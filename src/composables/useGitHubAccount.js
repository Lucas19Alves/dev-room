import { ref, computed, onUnmounted } from 'vue'
import { createOAuthRequest, consumeOAuthRequest } from '../utils/oauth'
import { CHANGE_EVENT, LOCAL_ONLY_KEYS } from '../utils/storage'
import { createGitHubClient, getUser } from '../utils/githubSync'
import { syncWithGitHub, flushToGitHub, hasPendingChanges, loadSyncState } from '../utils/syncEngine'

const POLL_INTERVAL = 60000
const PUSH_DELAY = 2500
const PUSH_MAX_WAIT = 15000
const MAX_BACKOFF = 300000

export function useGitHubAccount({ onUser, onRemote, onLogin }) {
  const githubToken = ref(sessionStorage.getItem('github_token') || localStorage.getItem('github_token') || '')
  localStorage.removeItem('github_token')
  if (githubToken.value) sessionStorage.setItem('github_token', githubToken.value)
  const githubUserLogin = ref('')
  const isSyncing = ref(false)
  const authBusy = ref(false)
  const accountError = ref('')
  const syncState = ref('local') // local | pending | syncing | synced | offline | error
  const lastSyncedAt = ref(0)
  const syncStatus = computed(() => ({
    local: 'Salvo neste navegador',
    pending: 'Alterações pendentes',
    syncing: 'Sincronizando…',
    synced: 'Sincronizado',
    offline: 'Offline — salvo localmente',
    error: 'Backup pendente'
  })[syncState.value])

  let api = null
  let session = {}
  let pollTimer = 0
  let pushTimer = 0
  let retryTimer = 0
  let firstPendingAt = 0
  let retryAt = 0
  let failures = 0
  let rerun = false
  let disposed = false
  let generation = 0

  const connected = () => Boolean(githubToken.value && githubUserLogin.value && api)

  function resetSession() {
    generation++
    api = null
    session = {}
    clearTimeout(pushTimer)
    clearTimeout(retryTimer)
    firstPendingAt = 0
    failures = 0
    retryAt = 0
  }

  function logoutGitHub() {
    resetSession()
    githubToken.value = ''
    githubUserLogin.value = ''
    sessionStorage.removeItem('github_token')
    localStorage.removeItem('github_token')
    syncState.value = 'local'
  }

  async function loginWithGitHub() {
    if (authBusy.value) return
    authBusy.value = true
    accountError.value = ''
    try {
      const response = await fetch('/api/github-config')
      const config = await response.json()
      if (!response.ok) throw new Error(config.error || 'Login indisponível.')
      if (new URL(config.redirectUri).origin !== window.location.origin) throw new Error('Entre pelo endereço principal dev-room-three.vercel.app para conectar o GitHub.')
      window.location.assign(await createOAuthRequest(config.clientId, config.redirectUri))
    } catch (error) {
      accountError.value = error.message || 'Não foi possível iniciar o login.'
      authBusy.value = false
    }
  }

  async function synchronize({ force = false } = {}) {
    if (!connected() || disposed) return
    if (isSyncing.value) { rerun = true; return }
    if (!navigator.onLine) { syncState.value = 'offline'; return }
    if (!force && Date.now() < retryAt) return
    clearTimeout(pushTimer)
    firstPendingAt = 0
    isSyncing.value = true
    syncState.value = 'syncing'
    const currentGeneration = generation
    try {
      await syncWithGitHub(api, githubUserLogin.value, { applyRemote: onRemote, session })
      if (currentGeneration !== generation || disposed) return
      failures = 0
      retryAt = 0
      accountError.value = ''
      lastSyncedAt.value = Date.now()
      syncState.value = hasPendingChanges(githubUserLogin.value) ? 'pending' : 'synced'
    } catch (error) {
      if (currentGeneration !== generation || disposed) return
      if (error.status === 401) {
        logoutGitHub()
        accountError.value = 'Sua sessão expirou. Entre novamente com GitHub.'
        return
      }
      failures++
      retryAt = Date.now() + (error.retryAfter || Math.min(MAX_BACKOFF, 5000 * 2 ** (failures - 1)))
      syncState.value = navigator.onLine ? 'error' : 'offline'
      if (failures === 1 || error.retryAfter || failures % 4 === 0) accountError.value = error.message || 'Falha na sincronização. Seus dados continuam salvos neste navegador.'
      clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => synchronize(), retryAt - Date.now())
    } finally {
      if (currentGeneration === generation) isSyncing.value = false
      if (rerun && !disposed && currentGeneration === generation) {
        rerun = false
        schedulePush()
      }
    }
  }

  // Agrupa alterações seguidas em uma única gravação, com espera máxima.
  function schedulePush() {
    if (!connected()) return
    syncState.value = isSyncing.value ? 'syncing' : 'pending'
    const now = Date.now()
    firstPendingAt ||= now
    clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => synchronize(), Math.max(0, Math.min(PUSH_DELAY, firstPendingAt + PUSH_MAX_WAIT - now)))
  }

  function handleLocalChange(event) {
    const keys = event.detail?.keys || []
    if (keys.some(key => !LOCAL_ONLY_KEYS.has(key))) schedulePush()
  }

  function handleVisibility() {
    if (!connected()) return
    if (document.visibilityState === 'hidden') {
      if (hasPendingChanges(githubUserLogin.value)) flushToGitHub(api, githubUserLogin.value)
    } else synchronize()
  }

  function handleOnline() { if (connected()) synchronize({ force: true }) }
  function handleOffline() { if (connected()) syncState.value = 'offline' }

  function startSyncLoop() {
    clearInterval(pollTimer)
    pollTimer = window.setInterval(() => { if (document.visibilityState === 'visible') synchronize() }, POLL_INTERVAL)
  }

  async function initializeGithub() {
    const params = new URLSearchParams(window.location.search)
    const hasCallback = params.has('code') || params.has('error')
    authBusy.value = true
    try {
      if (hasCallback) {
        const pending = consumeOAuthRequest(params.get('state'))
        if (params.has('error')) throw new Error('Login cancelado no GitHub. Você pode tentar novamente.')
        if (!pending) throw new Error('A tentativa de login expirou ou não foi iniciada neste navegador. Tente novamente.')
        const response = await fetch('/api/github-callback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: params.get('code'), verifier: pending.verifier, redirectUri: pending.redirectUri })
        })
        const data = await response.json()
        if (!response.ok || !data.access_token) throw new Error(data.error || 'Não foi possível concluir o login.')
        githubToken.value = data.access_token
        sessionStorage.setItem('github_token', data.access_token)
      }
      if (githubToken.value) {
        const client = createGitHubClient(githubToken.value)
        const user = await getUser(client)
        if (disposed) return
        resetSession()
        api = client
        githubUserLogin.value = user.login
        lastSyncedAt.value = loadSyncState(user.login).syncedAt || 0
        await synchronize({ force: true })
        onUser(user.name || user.login)
        onLogin()
      }
    } catch (error) {
      if (error.status === 401) logoutGitHub()
      accountError.value = error.message || 'Não foi possível conectar ao GitHub.'
    } finally {
      authBusy.value = false
      if (hasCallback) {
        for (const key of ['code', 'state', 'iss', 'error', 'error_description', 'error_uri']) params.delete(key)
        window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`)
      }
      if (!disposed) startSyncLoop()
    }
  }

  window.addEventListener(CHANGE_EVENT, handleLocalChange)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  onUnmounted(() => {
    disposed = true
    clearInterval(pollTimer)
    clearTimeout(pushTimer)
    clearTimeout(retryTimer)
    window.removeEventListener(CHANGE_EVENT, handleLocalChange)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    githubToken, githubUserLogin, isSyncing, authBusy, accountError, syncStatus, syncState, lastSyncedAt,
    loginWithGitHub, logoutGitHub, initializeGithub, synchronize: () => synchronize({ force: true })
  }
}
