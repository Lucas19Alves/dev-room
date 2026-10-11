import { getDevRoomData, setDevRoomData, toSyncPayload, mergeData, stableStringify, hashString } from './storage.js'
import { ensureRepo, readBackup, writeBackup } from './githubSync.js'

const STATE_KEY = 'dev-room-sync'
const KEEPALIVE_LIMIT = 60000
const isConflict = error => error?.status === 409 || error?.status === 422

// Estado por conta: sha/ETag do último backup visto e hash do conteúdo sincronizado.
export function loadSyncState(login) {
  try {
    const state = JSON.parse(localStorage.getItem(STATE_KEY))
    if (state?.login === login) return state
  } catch {}
  return { login }
}

function saveSyncState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function clearSyncState() {
  localStorage.removeItem(STATE_KEY)
}

function localSnapshot() {
  const text = stableStringify(toSyncPayload(getDevRoomData()))
  return { text, hash: hashString(text) }
}

export function hasPendingChanges(login) {
  return localSnapshot().hash !== loadSyncState(login).hash
}

// Uma rodada de sincronização. Custo típico: 1 requisição condicional (304,
// sem consumir limite) quando nada mudou; 1 leitura + 1 escrita quando mudou.
export async function syncWithGitHub(api, login, { applyRemote = () => {}, session = {} } = {}) {
  const state = loadSyncState(login)
  const result = { uploaded: false, downloaded: false }

  async function upload(text, hash, sha) {
    if (!session.verified) {
      await ensureRepo(api, login)
      session.verified = true
    }
    state.sha = await writeBackup(api, login, text, sha)
    state.hash = hash
    state.etag = ''
    state.syncedAt = Date.now()
    saveSyncState(state)
    result.uploaded = true
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = await readBackup(api, login, state.sha ? state.etag : '')
    try {
      if (remote.missing) {
        session.verified = false
        const local = localSnapshot()
        await upload(local.text, local.hash)
        return result
      }

      if (remote.notModified || remote.sha === state.sha) {
        if (remote.etag) state.etag = remote.etag
        const local = localSnapshot()
        if (local.hash === state.hash) {
          state.syncedAt = Date.now()
          saveSyncState(state)
          return result
        }
        await upload(local.text, local.hash, state.sha)
        return result
      }

      // O backup mudou em outro dispositivo: mescla chave a chave.
      // Leitura e gravação local acontecem sem `await` entre elas.
      const local = getDevRoomData()
      const firstSync = !state.hash && local._clock !== undefined
      const merged = mergeData(local, remote.data, { preferRemote: firstSync })
      const mergedText = stableStringify(toSyncPayload(merged))
      if (mergedText !== stableStringify(toSyncPayload(local))) {
        setDevRoomData(merged, { remote: true })
        result.downloaded = true
        await applyRemote(merged)
      }
      const mergedHash = hashString(mergedText)
      if (mergedText === stableStringify(toSyncPayload(remote.data))) {
        Object.assign(state, { sha: remote.sha, etag: remote.etag, hash: mergedHash, syncedAt: Date.now() })
        saveSyncState(state)
        return result
      }
      state.etag = ''
      await upload(mergedText, mergedHash, remote.sha)
      return result
    } catch (error) {
      if (!isConflict(error)) throw error
      // Outro dispositivo gravou no meio do caminho: relê e tenta novamente.
      state.etag = ''
      state.sha = undefined
    }
  }
  throw new Error('O backup mudou várias vezes seguidas. A sincronização será repetida.')
}

// Envio rápido ao ocultar/fechar a aba, sem leitura prévia. Se o backup tiver
// mudado, o GitHub rejeita pelo sha e a próxima sincronização mescla.
export function flushToGitHub(api, login) {
  const state = loadSyncState(login)
  const local = localSnapshot()
  if (!state.sha || local.hash === state.hash || local.text.length > KEEPALIVE_LIMIT) return null
  return writeBackup(api, login, local.text, state.sha, { keepalive: true }).then(sha => {
    const current = loadSyncState(login)
    if (current.sha !== state.sha) return
    saveSyncState({ ...current, sha, hash: local.hash, etag: '', syncedAt: Date.now() })
  }).catch(() => {})
}
