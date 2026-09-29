import { ref, onUnmounted } from 'vue'
import { createOAuthRequest, consumeOAuthRequest } from '../utils/oauth'
import { getDevRoomData, setDevRoomData } from '../utils/storage'
import { loadDataFromRepo, saveDataToRepo } from '../utils/githubSync'

export function useGitHubAccount({ onUser, onRemote, onLogin }) {
  const githubToken = ref(sessionStorage.getItem('github_token') || localStorage.getItem('github_token') || '')
  localStorage.removeItem('github_token')
  if (githubToken.value) sessionStorage.setItem('github_token', githubToken.value)
  const githubUserLogin = ref('')
  const isSyncing = ref(false)
  const authBusy = ref(false)
  const accountError = ref('')
  const syncStatus = ref('Salvo neste navegador')
  let lastUploaded = ''
  let interval
  let disposed = false
  let generation = 0

  function logoutGitHub() {
    generation++
    githubToken.value = ''
    githubUserLogin.value = ''
    sessionStorage.removeItem('github_token')
    localStorage.removeItem('github_token')
    lastUploaded = ''
    syncStatus.value = 'Salvo neste navegador'
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

  async function synchronize() {
    if (!githubToken.value || !githubUserLogin.value || isSyncing.value || document.hidden) return
    isSyncing.value = true
    const currentGeneration = generation
    const token = githubToken.value
    const login = githubUserLogin.value
    try {
      const content = await loadDataFromRepo(token, login)
      if (disposed || currentGeneration !== generation) return
      const remote = JSON.parse(content || '{}')
      if (!remote || typeof remote !== 'object' || Array.isArray(remote)) throw new Error('Backup inválido no GitHub.')
      const local = getDevRoomData()
      if (Number(remote.lastModified || 0) > Number(local.lastModified || 0)) {
        setDevRoomData(remote, { remote: true })
        await onRemote(remote)
        lastUploaded = localStorage.getItem('dev-room-data') || '{}'
      } else {
        const snapshot = localStorage.getItem('dev-room-data') || '{}'
        if (snapshot !== lastUploaded) {
          const saved = await saveDataToRepo(token, login, snapshot)
          if (saved && currentGeneration === generation) lastUploaded = snapshot
          else if (!saved) throw new Error('Há uma versão mais recente no GitHub. A sincronização será repetida.')
        }
      }
      if (currentGeneration === generation) {
        syncStatus.value = 'Sincronizado com GitHub'
        accountError.value = ''
      }
    } catch (error) {
      if (currentGeneration !== generation || disposed) return
      if (error.status === 401) {
        logoutGitHub()
        accountError.value = 'Sua sessão expirou. Entre novamente com GitHub.'
      } else {
        syncStatus.value = 'Backup pendente'
        accountError.value = error.message || 'Falha na sincronização. Seus dados continuam salvos neste navegador.'
      }
    } finally { isSyncing.value = false }
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
        const { Octokit } = await import('@octokit/rest')
        const { data } = await new Octokit({ auth: githubToken.value }).users.getAuthenticated()
        if (disposed) return
        githubUserLogin.value = data.login
        await synchronize()
        onUser(data.name || data.login)
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
      if (!disposed) interval = window.setInterval(synchronize, 30000)
    }
  }
  onUnmounted(() => { disposed = true; clearInterval(interval) })
  return { githubToken, githubUserLogin, isSyncing, authBusy, accountError, syncStatus, loginWithGitHub, logoutGitHub, initializeGithub, synchronize }
}
