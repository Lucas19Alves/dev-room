<script setup>
import Window from './components/Window.vue'
import StickyNotes from './components/StickyNotes.vue'
import draggable from 'vuedraggable'
import { ref, reactive, onMounted, onUnmounted, watch, computed, defineAsyncComponent } from 'vue'
import { SpeedInsights } from '@vercel/speed-insights/vue';
import { inject } from "@vercel/analytics"
import { saveDataToRepo, loadDataFromRepo } from './utils/githubSync';
import { getDevRoomData, setDevRoomData } from './utils/storage';

const Timer = defineAsyncComponent(() => import('./components/Timer.vue'))
const MusicPlayer = defineAsyncComponent(() => import('./components/MusicPlayer.vue'))
const TodoList = defineAsyncComponent(() => import('./components/TodoList.vue'))
const QuickNotes = defineAsyncComponent(() => import('./components/QuickNotes.vue'))
const CodeSnippets = defineAsyncComponent(() => import('./components/CodeSnippets.vue'))
const DeployChecklist = defineAsyncComponent(() => import('./components/DeployChecklist.vue'))
const Pomodoro = defineAsyncComponent(() => import('./components/Pomodoro.vue'))
const Search = defineAsyncComponent(() => import('./components/Search.vue'))
const WaterReminder = defineAsyncComponent(() => import('./components/WaterReminder.vue'))
const FakeDataGenerator = defineAsyncComponent(() => import('./components/FakeDataGenerator.vue'))
const Config = defineAsyncComponent(() => import('./components/Config.vue'))
const ChatGPTApi = defineAsyncComponent(() => import('./components/ChatGPTApi.vue'))
const GithubFeatures = defineAsyncComponent(() => import('./components/GithubFeatures.vue'))
const Kanban = defineAsyncComponent(() => import('./components/Kanban.vue'))
const Converter = defineAsyncComponent(() => import('./components/Converter.vue'))
const CodePlayground = defineAsyncComponent(() => import('./components/CodePlayground.vue'))

const NOME_KEY = 'dev-room-nome'
const THEME_KEY = 'dev-room-theme'
const THEME_CLASSES = [
  'theme-default', 'theme-dark', 'theme-solarized', 'theme-dracula', 'theme-gruvbox',
  'theme-nord', 'theme-monokai', 'theme-onedark', 'theme-nightowl', 'theme-palenight'
]

const userName = ref(localStorage.getItem(NOME_KEY) || '')
const nomeInput = ref(userName.value || '')
const onboardingDone = ref(localStorage.getItem('dev-room-onboarding') === 'ok');
const onboardingStep = ref(0)
const checkedOnboarding = ref(false)
const firstLoginModal = ref(localStorage.getItem('dev-room-first-login') !== 'ok' && localStorage.getItem('dev-room-first-login') !== 'skip')
const initialModalVisible = computed(() => !onboardingDone.value || firstLoginModal.value)

// Salva nome do usuário e avança onboarding
function saveName() {
  if (nomeInput.value.trim() !== '') {
    userName.value = nomeInput.value.trim()
    localStorage.setItem(NOME_KEY, userName.value)
    onboardingStep.value++
  }
}

// Finaliza onboarding
function endOnboarding() {
  onboardingDone.value = true
  localStorage.setItem('dev-room-onboarding', 'ok')
}

const currentTheme = ref('theme-default')
function applyTheme(theme) {
  const selectedTheme = THEME_CLASSES.includes(theme) ? theme : 'theme-default'
  currentTheme.value = selectedTheme
  document.documentElement.classList.remove(...THEME_CLASSES)
  document.documentElement.classList.add(selectedTheme)
  localStorage.setItem(THEME_KEY, selectedTheme)
}

function setNome(novoNome) {
  userName.value = novoNome
  localStorage.setItem(NOME_KEY, userName.value)
}

function skipFirstLogin() {
  firstLoginModal.value = false
  localStorage.setItem('dev-room-first-login', 'skip')
}

let zIndexCounter = 10
const openWindows = reactive([])
let appStateSaveTimer = null
let syncPushIntervalId = null
let syncPullIntervalId = null

// Salva estado principal do app no localStorage e dev-room-data
function saveAppState() {
  clearTimeout(appStateSaveTimer)
  appStateSaveTimer = null
  const data = getDevRoomData()
  data.nome = userName.value
  data.tema = currentTheme.value
  data.windows = JSON.parse(JSON.stringify(openWindows))
  data.lastModified = Date.now()
  setDevRoomData(data)
  localStorage.setItem(NOME_KEY, userName.value)
  localStorage.setItem(THEME_KEY, currentTheme.value)
  localStorage.setItem('dev-room-windows', JSON.stringify(openWindows))
  localStorage.setItem('dev-room-lastModified', data.lastModified)
}

function scheduleAppStateSave() {
  clearTimeout(appStateSaveTimer)
  appStateSaveTimer = window.setTimeout(saveAppState, 300)
}

// Agrupa alterações rápidas, como movimento e redimensionamento de janelas.
watch(userName, scheduleAppStateSave)
watch(currentTheme, scheduleAppStateSave)
watch(openWindows, scheduleAppStateSave, { deep: true })

// Papel de parede - agora aplica diretamente ao estilo do body
const wallpaper = ref(null)

function setWallpaper(imageDataUrl) {
  wallpaper.value = imageDataUrl
  
  // Já não precisamos fazer nada aqui pois o componente Wallpaper 
  // aplica diretamente o estilo ao body
}

// Imagem de fundo - carregamento direto do localStorage
const BACKGROUND_IMAGE_KEY = 'dev-room-background'
const backgroundImage = computed(() => {
  try {
    // Carrega diretamente da chave específica no localStorage
    const imgData = localStorage.getItem(BACKGROUND_IMAGE_KEY)
    return imgData || null
  } catch (error) {
    console.error('Erro ao carregar imagem de fundo:', error)
    return null
  }
})

onMounted(() => {
  onboardingDone.value = localStorage.getItem('dev-room-onboarding') === 'ok';

  const salvo = localStorage.getItem(NOME_KEY)
  if (salvo && salvo.trim() !== '') {
    userName.value = salvo
  }

  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme) {
    applyTheme(savedTheme)
  } else {
    applyTheme('theme-default')
  }

  intervalId = setInterval(() => {
    now.value = new Date()
  }, 1000)

  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission()
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallPrompt.value = true
  })
  
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('storage', handleStorageSync)

  // Restaurar janelas abertas
  const savedWindows = localStorage.getItem('dev-room-windows')
  if (savedWindows) {
    try {
      const parsed = JSON.parse(savedWindows)
      const availableWindows = parsed.filter(win => mobileTabs.some(tab => tab.type === win.type))
      openWindows.splice(0, openWindows.length, ...availableWindows)
      if (availableWindows.length) {
        zIndexCounter = Math.max(...availableWindows.map(w => w.zIndex ?? 10), zIndexCounter)
      }
    } catch (e) {
      localStorage.removeItem('dev-room-windows')
    }
  }

  const token = localStorage.getItem('github_token')
  if (token) {
    githubToken.value = token
    fetchGitHubUserName().then(loadDataFromRepoAndSet)
  } else {
    handleGitHubCallback()
  }

  if (githubToken.value) {
    firstLoginModal.value = false
    localStorage.setItem('dev-room-first-login', 'ok')
  }

  const allData = getDevRoomData()
  if (allData.nome) userName.value = allData.nome
  if (allData.tema) applyTheme(allData.tema)
  if (allData.windows && Array.isArray(allData.windows)) {
    const availableWindows = allData.windows.filter(win => mobileTabs.some(tab => tab.type === win.type))
    openWindows.splice(0, openWindows.length, ...availableWindows)
    if (availableWindows.length) {
      zIndexCounter = Math.max(...availableWindows.map(w => w.zIndex ?? 10), zIndexCounter)
    }
  }

  // Verifica a imagem de fundo
  if (localStorage.getItem(BACKGROUND_IMAGE_KEY)) {
    console.log('Imagem de fundo encontrada')
  }

  // Carregar papel de parede se existir
  const savedWallpaper = localStorage.getItem('dev-room-wallpaper')
  if (savedWallpaper) {
    wallpaper.value = savedWallpaper
    console.log('Papel de parede carregado')
  }
})

onUnmounted(() => {
  clearInterval(intervalId)
  clearInterval(syncPushIntervalId)
  clearInterval(syncPullIntervalId)
  if (appStateSaveTimer) saveAppState()
  window.removeEventListener('storage', handleStorageSync)
  window.removeEventListener('resize', checkMobile)
})

const now = ref(new Date())
let intervalId = null

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Mapeamento dos componentes das janelas
const windowComponents = {
  Timer,
  MusicPlayer,
  TodoList,
  QuickNotes,
  GithubFeatures,
  CodeSnippets,
  DeployChecklist,
  Pomodoro,
  Search,
  WaterReminder,
  FakeDataGenerator,
  Config,
  ChatGPTApi,
  Kanban,
  Converter,
  CodePlayground,
}

const mobileActiveTab = ref('Timer')

const mobileTabs = [
  { type: 'Timer', label: 'Timer', icon: 'fa-solid fa-stopwatch' },
  { type: 'MusicPlayer', label: 'Player de Música', icon: 'fa-solid fa-music' },
  { type: 'TodoList', label: 'To-Do List', icon: 'fa-solid fa-list-check' },
  { type: 'Kanban', label: 'Kanban', icon: 'fa-solid fa-table-columns' },
  { type: 'QuickNotes', label: 'Notas Rápidas', icon: 'fa-solid fa-sticky-note' },
  { type: 'CodeSnippets', label: 'Snippets de Código', icon: 'fa-solid fa-code' },
  { type: 'CodePlayground', label: 'Code Playground', icon: 'fa-solid fa-laptop-code' },
  { type: 'GithubFeatures', label: 'GitHub', icon: 'fa-brands fa-github' },
  { type: 'DeployChecklist', label: 'Checklist de Deploy', icon: 'fa-solid fa-rocket' },
  { type: 'Pomodoro', label: 'Pomodoro', icon: 'fa-solid fa-clock' },
  { type: 'ChatGPTApi', label: 'IA (ChatGPT)', icon: 'fa-solid fa-robot' },
  { type: 'Search', label: 'Busca', icon: 'fa-solid fa-magnifying-glass' },
  { type: 'WaterReminder', label: 'Lembrete de Água', icon: 'fa-solid fa-droplet' },
  { type: 'FakeDataGenerator', label: 'Gerador de Dados', icon: 'fa-solid fa-database' },
  { type: 'Converter', label: 'Conversor de moedas', icon: 'fa-solid fa-dollar-sign' },
  { type: 'Config', label: 'Configurações', icon: 'fa-solid fa-gear' },
]

const DOCK_ORDER_KEY = 'centralos-dock-order'

function loadDockTabs() {
  try {
    const savedOrder = JSON.parse(localStorage.getItem(DOCK_ORDER_KEY) || '[]')
    if (!Array.isArray(savedOrder)) return [...mobileTabs]
    const positions = new Map(savedOrder.map((type, index) => [type, index]))
    return [...mobileTabs].sort((a, b) =>
      (positions.get(a.type) ?? Number.MAX_SAFE_INTEGER) -
      (positions.get(b.type) ?? Number.MAX_SAFE_INTEGER)
    )
  } catch {
    return [...mobileTabs]
  }
}

const dockTabs = ref(loadDockTabs())
const dockDragging = ref(false)
const dockReveal = ref(false)

watch(dockTabs, (tabs) => {
  localStorage.setItem(DOCK_ORDER_KEY, JSON.stringify(tabs.map(tab => tab.type)))
}, { deep: true })

function handleDockItemClick(type) {
  if (dockDragging.value) return
  const win = openWindows.find(windowItem => windowItem.type === type)
  if (!win) {
    openWindow(type)
    return
  }
  if (win.minimized) {
    restoreWindow(win.id)
    bringToFront(win.id)
  } else if (win.zIndex === zIndexCounter) {
    minimizeWindow(win.id)
  } else {
    bringToFront(win.id)
  }
}

function finishDockDrag() {
  window.setTimeout(() => {
    dockDragging.value = false
  }, 0)
}

const mobileMenuOpen = ref(false)

// Abre uma janela (desktop) ou ativa aba (mobile)
function openWindow(type) {
  if (isMobile.value) {
    mobileActiveTab.value = type
    return
  }
  if (openWindows.some(w => w.type === type)) {
    const win = openWindows.find(w => w.type === type)
    bringToFront(win.id)
    if (win.minimized) win.minimized = false
    return
  }
  const titleMap = {
    Timer: 'Timer',
    MusicPlayer: 'Player de Música',
    TodoList: 'To-Do List',
    Docs: 'Documentação',
    QuickNotes: 'Notas Rápidas',
    CodeSnippets: 'Snippets de Código',
    GithubFeatures: 'Funcionalidades do GitHub',
    DeployChecklist: 'Checklist de Deploy',
    Pomodoro: 'Pomodoro',
    Search: 'Busca',
    Themes: 'Temas',
    WaterReminder: 'Lembrete de Água',
    FakeDataGenerator: 'Gerador de Dados Falsos',
    Config: 'Configurações',
    ChatGPTApi: 'ChatGPT API',
    Kanban: 'Kanban',
    Converter: 'Conversor de moedas',
    CodePlayground: 'Code Playground',
  }
  const defaultSizes = {
    Timer: { width: 360, height: 380 },
    MusicPlayer: { width: 380, height: 640 },
    TodoList: { width: 420, height: 520 },
    Docs: { width: 480, height: 500 },
    QuickNotes: { width: 620, height: 600 },
    CodeSnippets: { width: 600, height: 680 },
    GithubFeatures: { width: 740, height: 400 },
    DeployChecklist: { width: 420, height: 560 },
    Pomodoro: { width: 400, height: 500 },
    Search: { width: 700, height: 500 },
    Themes: { width: 340, height: 560 },
    WaterReminder: { width: 420, height: 500 },
    FakeDataGenerator: { width: 400, height: 460 },
    Config: { width: 480, height: 640 },
    ChatGPTApi: { width: 600, height: 600 },
    Kanban: { width: 1000, height: 600 },
    Converter: { width: 420, height: 400 },
    CodePlayground: { width: 900, height: 680 },
  }
  let { width, height } = defaultSizes[type] || { width: 340, height: 220 }

  let x = 0, y = 0
  const container = document.getElementById('roomContent')
  let maxWidth = window.innerWidth
  let maxHeight = window.innerHeight
  if (container) {
    const rect = container.getBoundingClientRect()
    maxWidth = rect.width
    maxHeight = rect.height
  }
  width = Math.min(width, maxWidth - 16)
  height = Math.min(height, maxHeight - 16)

  x = (maxWidth - width) / 2
  y = (maxHeight - height) / 2

  openWindows.push({
    id: Date.now() + Math.random(),
    type,
    x,
    y,
    zIndex: ++zIndexCounter,
    title: titleMap[type],
    width,
    height,
    minimized: false
  })
}

// Fecha uma janela pelo id
function closeWindow(id) {
  const idx = openWindows.findIndex(w => w.id === id)
  if (idx !== -1) openWindows.splice(idx, 1)
}

// Atualiza posição da janela
function updateWindowPosition(id, pos) {
  const win = openWindows.find(w => w.id === id)
  if (win) {
    win.x = pos.x
    win.y = pos.y
  }
}

// Atualiza tamanho da janela
function updateWindowSize(id, size) {
  const win = openWindows.find(w => w.id === id)
  if (win) {
    win.width = size.width
    win.height = size.height
  }
}

// Traz janela para frente
function bringToFront(id) {
  zIndexCounter++
  const win = openWindows.find(w => w.id === id)
  if (win) win.zIndex = zIndexCounter
}

// Minimiza janela
function minimizeWindow(id) {
  const win = openWindows.find(w => w.id === id)
  if (win) win.minimized = true
}

// Restaura janela minimizada
function restoreWindow(id) {
  const win = openWindows.find(w => w.id === id)
  if (win) win.minimized = false
}

const showInstallPrompt = ref(false)
let deferredPrompt = null

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      showInstallPrompt.value = false
      deferredPrompt = null
    })
  }
}

const isMobile = ref(false)
const viewportSize = reactive({ width: window.innerWidth, height: window.innerHeight })
function checkMobile() {
  viewportSize.width = window.innerWidth
  viewportSize.height = window.innerHeight
  isMobile.value = viewportSize.width <= 768
}

const isDockObstructed = computed(() => {
  if (isMobile.value) return false
  const statusBarHeight = 50
  const dockWidth = Math.min(viewportSize.width * 0.94, 860)
  const dockLeft = (viewportSize.width - dockWidth) / 2
  const dockRight = dockLeft + dockWidth
  const dockTop = viewportSize.height - 82

  return openWindows.some(win => {
    if (win.minimized) return false
    const left = win.x
    const right = win.x + win.width
    const top = statusBarHeight + win.y
    const bottom = top + win.height
    return right > dockLeft && left < dockRight && bottom > dockTop && top < viewportSize.height
  })
})

const showPixModal = ref(false)


// Estado do modo pausa
const pauseMode = ref(false)
const pauseStep = ref(0)
const pauseTips = [
  {
    icon: 'fa-solid fa-chair',
    text: 'Ajuste sua postura na cadeira!',
    color: 'text-blue-400'
  },
  {
    icon: 'fa-solid fa-cookie-bite',
    text: 'Que tal um lanche rápido?',
    color: 'text-yellow-400'
  },
  {
    icon: 'fa-solid fa-window-maximize',
    text: 'Olhe pela janela e respire fundo!',
    color: 'text-green-400'
  },
  {
    icon: 'fa-solid fa-handshake',
    text: 'Dê um oi para alguém por perto!',
    color: 'text-pink-400'
  },
  {
    icon: 'fa-solid fa-face-smile-beam',
    text: 'Sorria! Você está indo bem!',
    color: 'text-purple-400'
  }
]

// Ativa modo pausa (pausa timers/música)
function activatePauseMode() {
  pauseMode.value = true
  pauseStep.value = 0
  window.dispatchEvent(new CustomEvent('devroom-pause-all'))
  window.dispatchEvent(new CustomEvent('devroom-music-pause'))
}
function nextPauseTip() {
  if (pauseStep.value < pauseTips.length - 1) {
    pauseStep.value++
  }
}
function prevPauseTip() {
  if (pauseStep.value > 0) {
    pauseStep.value--
  }
}
function deactivatePauseMode() {
  pauseMode.value = false
  window.dispatchEvent(new CustomEvent('devroom-resume-all'))
  window.dispatchEvent(new CustomEvent('devroom-music-resume'))
}

// GitHub Integration
const githubToken = ref(null)
const isSyncing = ref(false)
const githubUserLogin = ref('')

const showLoginModal = ref(false)
const showLogoutModal = ref(false)

function confirmLoginWithGitHub() {
  showLoginModal.value = false
  loginWithGitHub()
}

function confirmLogoutGitHub() {
  showLogoutModal.value = false
  logoutGitHub()
}

function loginWithGitHub() {
  const clientId = 'Ov23liLXp3BH07oDymH4'
  // O GitHub usa a callback cadastrada no OAuth App; isso evita divergência
  // entre localhost, preview e o domínio de produção.
  const state = crypto.randomUUID()
  sessionStorage.setItem('centralos-github-oauth-state', state)
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo', state })
  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`
}

async function handleGitHubCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const returnedState = urlParams.get('state')
  const expectedState = sessionStorage.getItem('centralos-github-oauth-state')
  if (code && (!expectedState || returnedState !== expectedState)) {
    window.history.replaceState({}, document.title, window.location.pathname)
    return
  }
  if (code) {
    const res = await fetch('/api/github-callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    const data = await res.json()
    if (data.access_token) {
      githubToken.value = data.access_token
      localStorage.setItem('github_token', githubToken.value)
      await fetchGitHubUserName()
      onboardingStep.value = 5
      onboardingDone.value = true
      localStorage.setItem('dev-room-onboarding', 'ok')
      await loadDataFromRepoAndSet()
      sessionStorage.removeItem('centralos-github-oauth-state')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }
}

async function fetchGitHubUserName() {
  if (!githubToken.value) return
  const { Octokit } = await import('@octokit/rest')
  const octokit = new Octokit({ auth: githubToken.value })
  const { data } = await octokit.users.getAuthenticated()
  userName.value = data.name || data.login || ''
  githubUserLogin.value = data.login
  localStorage.setItem(NOME_KEY, userName.value)
}

async function syncDataToRepo() {
  if (!githubToken.value || !githubUserLogin.value || isSyncing.value || document.hidden) return
  isSyncing.value = true
  try {
    await saveDataToRepo(githubToken.value, githubUserLogin.value, localStorage.getItem('dev-room-data') || '{}')
    // Backup salvo no GitHub
  } catch (err) {
    // Erro ao salvar backup no GitHub
  } finally {
    isSyncing.value = false
  }
}

async function loadDataFromRepoAndSet() {
  if (!githubToken.value || !githubUserLogin.value) return
  const content = await loadDataFromRepo(githubToken.value, githubUserLogin.value)
  const repoData = JSON.parse(content || '{}')
  const localLastModified = Number(localStorage.getItem('dev-room-lastModified') || 0)
  const repoLastModified = Number(repoData.lastModified || 0)

  // Só sobrescreve se o backup do GitHub for mais recente
  if (repoLastModified > localLastModified) {
    localStorage.setItem('dev-room-data', content)
    localStorage.setItem('dev-room-lastModified', repoLastModified)
    // Atualiza variáveis reativas principais do app imediatamente
    if (repoData.nome) userName.value = repoData.nome
    if (repoData.tema) applyTheme(repoData.tema)
    if (repoData.windows && Array.isArray(repoData.windows)) {
      const availableWindows = repoData.windows.filter(win => mobileTabs.some(tab => tab.type === win.type))
      openWindows.splice(0, openWindows.length, ...availableWindows)
      if (availableWindows.length) {
        zIndexCounter = Math.max(...availableWindows.map(w => w.zIndex ?? 10), zIndexCounter)
      }
    }
  }
}

function logoutGitHub() {
  githubToken.value = null
  localStorage.removeItem('github_token')
}

function handleStorageSync(event) {
  if (event.key === 'dev-room-data' && githubToken.value && githubUserLogin.value) {
    syncDataToRepo()
  }
}

// Sincroniza backup local com GitHub a cada 2s se houver alteração
let lastData = localStorage.getItem('dev-room-data')
syncPushIntervalId = window.setInterval(() => {
  if (document.hidden) return
  if (githubToken.value && githubUserLogin.value) {
    const currentData = localStorage.getItem('dev-room-data')
    if (currentData !== lastData) {
      lastData = currentData
      syncDataToRepo()
    }
  }
}, 5000)

// Sincroniza backup do GitHub para localStorage a cada 10s
syncPullIntervalId = window.setInterval(async () => {
  if (!document.hidden && githubToken.value && githubUserLogin.value && !isSyncing.value) {
    try {
      const repoContent = await loadDataFromRepo(githubToken.value, githubUserLogin.value)
      const repoData = JSON.parse(repoContent || '{}')
      const localLastModified = Number(localStorage.getItem('dev-room-lastModified') || 0)
      const repoLastModified = Number(repoData.lastModified || 0)
      if (
        repoContent &&
        repoLastModified > localLastModified &&
        repoContent !== localStorage.getItem('dev-room-data')
      ) {
        localStorage.setItem('dev-room-data', repoContent)
        localStorage.setItem('dev-room-lastModified', repoLastModified)
        // Atualiza variáveis reativas principais do app
        if (repoData.nome) userName.value = repoData.nome
        if (repoData.tema) applyTheme(repoData.tema)
        if (repoData.windows && Array.isArray(repoData.windows)) {
          const availableWindows = repoData.windows.filter(win => mobileTabs.some(tab => tab.type === win.type))
          openWindows.splice(0, openWindows.length, ...availableWindows)
          if (availableWindows.length) {
            zIndexCounter = Math.max(...availableWindows.map(w => w.zIndex ?? 10), zIndexCounter)
          }
        }
      }
    } catch (e) {
      // Silencia erros de rede ou 404
    }
  }
}, 30000)

watch(onboardingStep, (step) => {
  if (step === 5 && githubToken.value) {
    onboardingDone.value = true
    localStorage.setItem('dev-room-onboarding', 'ok')
  }
})

function copyPixKey() {
  const key = '(77) 99115-6978'
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(key)
  } else {
    const el = document.createElement('textarea')
    el.value = key
    document.body.appendChild(el)
    el.select()
    try {
      document.execCommand('copy')
    } catch (e) {}
    document.body.removeChild(el)
  }
  showPixToast.value = true
  setTimeout(() => { showPixToast.value = false }, 1500)
}

const showPixToast = ref(false) // <-- Adicione esta linha
</script>

<template>
  <!-- O papel de parede agora é aplicado diretamente ao estilo do body -->

  <!-- Modal de onboarding -->
  <transition name="fade">
    <div
      v-if="!onboardingDone"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0, 0, 0, 0.85); color: white"
      id="onboarding-modal"
    >
      <div class="max-w-md w-full bg-gray-900 p-8 rounded-xl shadow-xl text-center border border-blue-500" id="onboarding-content">
        <!-- 1. Recepção -->
        <div v-if="onboardingStep === 0" id="onboarding-step-0">
          <img src="/icons/centralos-logo.png" alt="Logo do CentralOS" class="w-20 h-20 mx-auto mb-4 object-contain" />
          <h2 class="text-2xl font-bold mb-4">Bem-vindo ao CentralOS</h2>
          <p class="mb-6">Seu espaço digital para produtividade, organização e foco, feito especialmente para devs!</p>
          <button
            @click="onboardingStep++"
            class="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
            id="onboarding-next-btn-0"
          >
            Próximo
          </button>
        </div>
        <!-- 2. Apoio -->
        <div v-else-if="onboardingStep === 1" id="onboarding-step-1">
          <font-awesome-icon icon="fa-solid fa-heart" class="text-3xl mb-4 text-pink-400" />
          <h2 class="text-xl font-bold mb-4">Apoie o CentralOS!</h2>
          <p class="mb-4">
            Se você gostar do projeto, considere contribuir clicando no botão <b>Me apoie</b> no canto superior.<br>
            Assim você ajuda a manter e evoluir essa ferramenta gratuita para todos!
          </p>
          <button
            @click="onboardingStep++"
            class="cursor-pointer bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white font-semibold"
            id="onboarding-next-btn-1"
          >
            Próximo
          </button>
        </div>
        <!-- 3. Funcionalidades -->
        <div v-else-if="onboardingStep === 2" id="onboarding-step-2">
          <font-awesome-icon icon="fa-solid fa-cubes" class="text-3xl mb-4 text-yellow-400" />
          <h2 class="text-xl font-bold mb-4">Funcionalidades</h2>
          <ul class="list-disc ml-5 mt-2 space-y-1 text-left">
            <li><b>Widgets:</b> To-Do, Notas rápidas, Pomodoro, Timer, Snippets, Checklist de Deploy, Lembrete de água, Player de música, Gerador de dados fake e Busca inteligente.</li>
            <li><b>Personalização:</b> 10 temas translúcidos, com opções claras e escuras.</li>
            <li><b>Experiência fluida:</b> No desktop, organize as janelas livremente. No mobile, navegue pelo menu lateral.</li>
            <li><b>Salvamento automático:</b> Tudo salvo no navegador ou sincronizado com seu GitHub.</li>
          </ul>
          <button
            @click="onboardingStep++"
            class="cursor-pointer bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white font-semibold mt-4"
            id="onboarding-next-btn-2"
          >
            Próximo
          </button>
        </div>
        <!-- 4. Open Source -->
        <div v-else-if="onboardingStep === 3" id="onboarding-step-3">
          <font-awesome-icon icon="fa-brands fa-github" class="text-3xl mb-4 text-gray-300" />
          <h2 class="text-xl font-bold mb-4">Open Source</h2>
          <p class="mb-4">
            O CentralOS é <b>open source</b>! Veja o código, contribua ou adapte para seu time.<br>
            <a href="https://github.com/Lucas19Alves/CentralOS" target="_blank" class="text-blue-300 underline">Repositório do CentralOS</a>
          </p>
          <button
            @click="onboardingStep++"
            class="cursor-pointer bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded text-white font-semibold"
            id="onboarding-next-btn-3"
          >
            Próximo
          </button>
        </div>
        <!-- 5. Login (pode ser dispensado) -->
        <div v-else-if="onboardingStep === 4 && !githubToken" id="onboarding-step-4">
          <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="text-3xl mb-4 text-blue-400" />
          <h2 class="text-xl font-bold mb-4">Sincronize seus dados!</h2>
          <p class="mb-4">
            Faça login para salvar e sincronizar suas configurações e dados em qualquer dispositivo.<br>
            <span class="text-xs text-gray-400">Se preferir, pode usar localmente sem login.</span>
          </p>
          <button
            @click="loginWithGitHub"
            class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow transition text-lg mb-3 w-full"
            id="onboarding-github-btn"
          >
            <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="text-xl" />
            Entrar
          </button>
          <button
            @click="onboardingStep++"
            class="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-gray-200 px-6 py-3 rounded-full font-bold shadow transition text-lg w-full"
            id="onboarding-skip-login-btn"
          >
            <font-awesome-icon icon="fa-solid fa-user-lock" class="text-xl" />
            Usar sem login
          </button>
        </div>
        <!-- 6. Nome (se não logou) -->
        <div v-else-if="onboardingStep === 5 && !githubToken" id="onboarding-step-5">
          <font-awesome-icon icon="fa-solid fa-user" class="text-3xl mb-4 text-green-400" />
          <h2 class="text-xl font-bold mb-4">Como você quer ser chamado?</h2>
          <input
            v-model="nomeInput"
            type="text"
            placeholder="Seu nome ou apelido"
            class="w-full px-4 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none mb-4"
            id="onboarding-name-input"
          />
          <button
            @click="saveName"
            class="cursor-pointer bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold w-full"
            id="onboarding-save-name-btn"
          >
            Salvar e começar
          </button>
        </div>
        <!-- 6. Final (se logou ou já tem nome) -->
        <div v-else-if="(onboardingStep === 5 && githubToken) || (onboardingStep === 6)" id="onboarding-step-6">
          <font-awesome-icon icon="fa-solid fa-th-large" class="text-3xl mb-4 text-purple-400" />
          <h2 class="text-xl font-bold mb-4">Tudo pronto, {{ userName }}!</h2>
          <p class="mb-4">Use os widgets no dock abaixo para abrir ferramentas como Pomodoro, Notas e muito mais.</p>
          <button
            @click="endOnboarding"
            class="cursor-pointer bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold w-full"
            aria-label="Começar a usar o CentralOS"
            id="onboarding-finish-btn"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  </transition>

  <StickyNotes/>

  <SpeedInsights />

  <inject/>

  <!-- Container principal do app -->
  <div 
    id="main-app" 
    class="h-screen text-gray-100 relative overflow-hidden"
    :style="{ 
      background: wallpaper ? 'transparent' : 'var(--desktop-bg)',
      color: 'var(--text-main)'
    }">

    <!-- Barra superior mobile com botão de abrir menu e "Me apoie" -->
    <div v-if="isMobile" class="relative w-full flex items-center justify-between gap-2 px-4 py-3" :style="{
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--accent)'
    }" id="mobile-topbar">
      <!-- Botão de abrir menu mobile -->
      <button
        v-if="!mobileMenuOpen"
        @click="mobileMenuOpen = true"
        class="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-base shadow transition border"
        :style="{
          background: 'var(--accent)',
          color: 'var(--text-main)',
          border: '2px solid var(--accent)'
        }"
        aria-label="Abrir menu"
        id="mobile-menu-open-btn"
      >
        <font-awesome-icon icon="fa-solid fa-bars" class="text-xl" />
        Menu
      </button>
      <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <img src="/icons/centralos-logo.png" alt="" class="w-10 h-10 object-contain" />
      </div>
      <!-- Botão de apoio mobile -->
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-base shadow transition border"
        :style="{
          background: 'var(--accent)',
          color: 'var(--text-main)',
          border: '2px solid var(--accent)'
        }"
        @click="showPixModal = true"
        title="Me apoie"
        id="mobile-dock-support-btn"
      >
        <font-awesome-icon icon="fa-solid fa-heart" class="text-base" />
        Me apoie
      </button>
    </div>

    <!-- Menu lateral mobile -->
    <transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-40 bg-black/40"
        @click.self="mobileMenuOpen = false"
        id="mobile-menu-overlay"
      >
        <nav
          class="absolute left-0 top-0 h-full w-64 shadow-2xl flex flex-col py-8 px-4 overflow-y-auto max-h-full"
          aria-label="Menu"
          :style="{
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            borderRight: '2px solid var(--accent)'
          }"
          id="mobile-menu"
        >
          <div class="mb-6 flex items-center gap-3">
            <img src="/icons/centralos-logo.png" alt="Logo do CentralOS" class="w-11 h-11 object-contain" />
            <span class="text-xl font-bold" :style="{ color: 'var(--text-main)' }">CentralOS</span>
          </div>
          <!-- Saudação e botão fechar alinhados -->
          <div class="mb-6 flex flex-row items-center justify-between w-full">
            <div class="flex items-center gap-2 mb-4">
              <span class="text-base font-semibold" :style="{color: 'var(--name)'}">
                Olá, <span>{{ userName }}</span>
              </span>
              <button
                v-if="!githubToken"
                @click="showLoginModal = true"
                class="flex items-center justify-center rounded-full p-2 border-2 transition"
                :style="{
                  background: 'var(--bg-panel)',
                  color: 'var(--text-main)',
                  borderColor: '#24292f'
                }"
                title="Entrar"
                id="mobile-menu-login-btn"
              >
                <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="text-lg" />
              </button>
              <button
                v-else
                @click="showLogoutModal = true"
                class="flex items-center justify-center rounded-full p-2 border-2 transition"
                :style="{
                  background: 'var(--bg-panel)',
                  color: 'var(--text-main)',
                  borderColor: '#24292f'
                }"
                title="Sair"
                id="mobile-menu-logout-btn"
              >
                <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-lg" />
              </button>
            </div>
            <button @click="mobileMenuOpen = false" class="text-gray-400 hover:text-white text-2xl ml-2" id="mobile-menu-close-btn">
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
          </div>
          <!-- GitHub Login/Logout -->
          <div class="mb-4 w-full flex flex-col items-stretch">
            <span v-if="isSyncing" class="ml-2 text-yellow-400">Sincronizando...</span>
          </div>
          <!-- Abas do menu mobile -->
          <div class="flex flex-col mb-12 gap-3" id="mobile-menu-tabs">
            <button v-for="tab in mobileTabs" :key="tab.type"
              @click="mobileActiveTab = tab.type; mobileMenuOpen = false"
              class="cursor-pointer flex items-center gap-3 px-3 py-2 rounded text-lg transition"
              :class="mobileActiveTab === tab.type ? 'bg-blue-800 text-blue-200 font-bold' : 'text-gray-300 hover:bg-gray-800'"
              :style="mobileActiveTab === tab.type ? { background: 'var(--accent)', color: 'var(--text-main)' } : {}"
              :id="`mobile-menu-tab-${tab.type}`"
            >
              <font-awesome-icon :icon="tab.icon" class="text-xl" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </nav>
      </div>
    </transition>

    <!-- Conteúdo principal mobile -->
    <div v-if="isMobile" class="flex flex-col h-screen" id="mobile-main">
      <div class="flex-1 overflow-auto" id="mobile-content">
        <component
          :is="mobileActiveTab === 'Config' ? Config : windowComponents[mobileActiveTab]"
          v-bind="mobileActiveTab === 'Config' ? { setTheme: applyTheme, currentTheme, nome: userName, setNome, setWallpaper } : {}"
        />
      </div>
    </div>

    <!-- Conteúdo principal desktop -->
    <div v-else>
      <!-- Barra de status superior -->
      <div id="statusBar" class="bg-gray-800 text-blue-200 px-4 py-2 flex flex-row justify-between items-center shadow"
        :style="{ background: 'var(--bg-panel)' }">
        <div id="status-bar-brand-actions" class="flex items-center gap-3">
          <div class="flex items-center gap-2" id="status-bar-brand">
            <img src="/icons/centralos-logo.png" alt="Logo do CentralOS" class="w-8 h-8 object-contain" />
            <span class="text-base font-bold" :style="{ color: 'var(--text-main)' }">CentralOS</span>
          </div>
          <div id="support-btn-container">
          <!-- Botão de apoio desktop -->
            <button
              class="cursor-pointer font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 text-sm transition"
              :style="{
                background: 'var(--accent)',
                color: 'var(--text-main)',
                border: '2px solid var(--accent)'
              }" @click="showPixModal = true" title="Me apoie"
              id="support-btn"
            >
              <font-awesome-icon icon="fa-solid fa-heart" class="text-sm" />
              Apoiar
            </button>
          </div>
          <button
            class="cursor-pointer px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold"
            :style="{ background: 'var(--bg-panel-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }"
            @click="activatePauseMode"
            title="Modo Pausa"
            id="pause-btn-desktop"
          >
            <font-awesome-icon icon="fa-solid fa-mug-hot" class="text-orange-400" />
            Pausa
          </button>
        </div>
        <div id="status-bar-user" class="flex items-center gap-1.5 text-sm">
          <h1>
            Olá, <span class="font-semibold" :style="{color: 'var(--name)'}">{{ userName }}</span>
          </h1>
          <!-- Botão de login na statusbar -->
          <button
            v-if="!githubToken"
            @click="showLoginModal = true"
            class="ml-1 flex items-center justify-center rounded-full p-1.5 border transition"
            :style="{
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              borderColor: '#24292f'
            }"
            title="Entrar"
            id="status-bar-login-btn"
          >
            <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="text-base" />
          </button>
          <!-- Botão de logout na statusbar -->
          <button
            v-else
            @click="showLogoutModal = true"
            class="ml-1 flex items-center justify-center rounded-full p-1.5 border transition"
            :style="{
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              borderColor: '#24292f'
            }"
            title="Sair"
            id="status-bar-logout-btn"
          >
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-base" />
          </button>
        </div>
        <div class="flex flex-row gap-3 items-center text-sm" id="status-bar-clock">
          <span class="hidden lg:inline" :style="{ color: 'var(--text-muted)' }">{{ formatDate(now) }}</span>
          <h1 class="flex flex-row items-center gap-1.5 tabular-nums">
            {{ formatTime(now) }}
            <font-awesome-icon icon="fa-solid fa-clock" class="text-blue-300" />
          </h1>
        </div>
      </div>

      <!-- Área das janelas abertas -->
      <div id="roomContent" class="relative w-full h-[calc(100vh-50px)]">
        <template v-for="win in openWindows" :key="win.id">
          <Window :title="win.title" :x="win.x" :y="win.y" :zIndex="win.zIndex" :width="win.width" :height="win.height"
            :containerSelector="'#roomContent'" :minimized="win.minimized" @close="closeWindow(win.id)"
            @update:position="pos => updateWindowPosition(win.id, pos)"
            @update:size="size => updateWindowSize(win.id, size)" @bringToFront="bringToFront(win.id)"
            @minimize="minimizeWindow(win.id)">
            <component :is="win.type === 'Config' ? Config : windowComponents[win.type]"
              v-bind="win.type === 'Config' ? { setTheme: applyTheme, currentTheme, nome: userName, setNome, setWallpaper } : {}" />
          </Window>
        </template>
      </div>

      <!-- Dock desktop -->
      <div
        v-if="isDockObstructed"
        class="fixed inset-x-0 bottom-0 h-4 z-[9000]"
        aria-hidden="true"
        @mouseenter="dockReveal = true"
        id="dock-reveal-zone"
      ></div>
      <div v-if="!initialModalVisible" id="dock"
        class="p-2 flex justify-center items-center shadow-2xl fixed left-1/2 bottom-3 w-fit max-w-[94vw] border z-[9000]"
        :class="{ 'dock-auto-hidden': isDockObstructed && !dockReveal }"
        :style="{
          background: 'var(--bg-panel)',
          color: 'var(--text-main)',
          borderColor: 'var(--accent)'
        }"
        @mouseenter="dockReveal = true"
        @mouseleave="dockReveal = false"
      >
        <draggable
          v-model="dockTabs"
          item-key="type"
          tag="div"
          class="flex flex-nowrap gap-1 justify-start items-center overflow-visible px-1"
          ghost-class="dock-item-ghost"
          chosen-class="dock-item-chosen"
          :animation="180"
          @start="dockDragging = true"
          @end="finishDockDrag"
          id="desktop-dock-icons"
        >
          <template #item="{ element: winTab }">
            <div
              class="dock-item flex flex-col items-center justify-center group cursor-grab active:cursor-grabbing w-10 h-10 rounded-xl relative flex-none"
              :class="{
                'dock-item-active': openWindows.some(w => w.type === winTab.type && !w.minimized),
                'dock-item-minimized': openWindows.some(w => w.type === winTab.type && w.minimized)
              }"
              @click="handleDockItemClick(winTab.type)"
              :title="`${winTab.label} — arraste para reordenar`"
              :aria-label="winTab.label"
              :id="`desktop-dock-icon-${winTab.type}`"
            >
              <font-awesome-icon :icon="winTab.icon" :class="[
                winTab.type === 'Timer' ? 'text-blue-400 hover:text-blue-200' : '',
                winTab.type === 'MusicPlayer' ? 'text-green-400 hover:text-green-200' : '',
                winTab.type === 'TodoList' ? 'text-yellow-400 hover:text-yellow-200' : '',
                winTab.type === 'Docs' ? 'text-pink-400 hover:text-pink-200' : '',
                winTab.type === 'QuickNotes' ? 'text-orange-400 hover:text-orange-200' : '',
                winTab.type === 'GithubFeatures' ? 'text-gray-400 hover:text-gray-200' : '',
                winTab.type === 'CodeSnippets' ? 'text-purple-400 hover:text-purple-200' : '',
                winTab.type === 'CodePlayground' ? 'text-orange-400 hover:text-orange-200' : '',
                winTab.type === 'DeployChecklist' ? 'text-teal-400 hover:text-teal-200' : '',
                winTab.type === 'Pomodoro' ? 'text-red-400 hover:text-red-200' : '',
                winTab.type === 'Search' ? 'text-cyan-400 hover:text-cyan-200' : '',
                winTab.type === 'Themes' ? 'text-fuchsia-400 hover:text-fuchsia-200' : '',
                winTab.type === 'WaterReminder' ? 'text-sky-400 hover:text-sky-200' : '',
                winTab.type === 'FakeDataGenerator' ? 'text-lime-400 hover:text-lime-200' : '',
                winTab.type === 'ChatGPTApi' ? 'text-emerald-400 hover:text-emerald-200' : '',
                winTab.type === 'Kanban' ? 'text-blue-400 hover:text-blue-200' : '',
                winTab.type === 'Converter' ? 'text-blue-400 hover:text-blue-200' : '',
              ]" class="text-xl dock-item-icon" />
              <span class="dock-tooltip group-hover:opacity-100">{{ winTab.label }}</span>
              <span
                v-if="openWindows.find(w => w.type === winTab.type && w.minimized)"
                class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400"
                title="Minimizada"
                :id="`desktop-dock-icon-minimized-${winTab.type}`"
              ></span>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Botão modo pausa Mobile (no menu, separado dos itens) -->
    <transition name="fade">
      <div
        v-if="mobileMenuOpen && isMobile"
        class="fixed inset-0 z-50 pointer-events-none"
        id="pause-btn-mobile-overlay"
      >
        <div class="absolute left-0 bottom-0 w-64 px-4 pb-8 pointer-events-auto" id="pause-btn-mobile-container">
          <button
            class="w-full flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-base shadow transition border mt-8"
            :style="{
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              borderColor: 'var(--accent)',
              opacity: 0.95
            }"
            @click="activatePauseMode"
            title="Modo Pausa"
            id="pause-btn-mobile"
          >
            <font-awesome-icon icon="fa-solid fa-mug-hot" class="text-orange-400 text-xl" />
            Pausa
          </button>
        </div>
      </div>
    </transition>

    <!-- Modal de modo pausa -->
    <transition name="fade">
      <div
        v-if="pauseMode"
        class="fixed inset-0 z-[9999] flex items-center justify-center"
        style="background: rgba(0,0,0,0.85);"
        id="pause-modal"
      >
        <div class="bg-gray-900 border-4 rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-full animate__animated animate__fadeInDown"
          :style="{ borderColor: 'var(--accent)' }"
          id="pause-modal-content"
        >
          <font-awesome-icon
            :icon="pauseTips[pauseStep].icon"
            :class="['text-6xl mb-6 animate__animated animate__bounceIn', pauseTips[pauseStep].color]"
            id="pause-modal-icon"
          />
          <h2 class="text-2xl font-bold mb-4 text-center animate__animated animate__fadeIn" id="pause-modal-text">{{ pauseTips[pauseStep].text }}</h2>
          <div class="flex gap-2 mt-4" id="pause-modal-actions">
            <button
              v-if="pauseStep > 0"
              @click="prevPauseTip"
              class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
              id="pause-modal-prev-btn"
            >
              <font-awesome-icon icon="fa-solid fa-arrow-left" /> Anterior
            </button>
            <button
              v-if="pauseStep < pauseTips.length - 1"
              @click="nextPauseTip"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              id="pause-modal-next-btn"
            >
              Próximo <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </button>
            <button
              v-if="pauseStep === pauseTips.length - 1"
              @click="deactivatePauseMode"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition font-bold"
              id="pause-modal-exit-btn"
            >
              Voltar ao trabalho <font-awesome-icon icon="fa-solid fa-play" />
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal de apoio Pix -->
    <div v-if="showPixModal" class="z-[999] fixed inset-0 flex items-center justify-center"
      :style="{ background: 'rgba(0,0,0,0.5)' }" @click.self="showPixModal = false"
      id="pix-modal-overlay"
    >
      <div class="rounded-lg p-6 shadow-xl flex flex-col items-center max-w-xs w-full" :style="{
        background: 'var(--bg-panel)',
        color: 'var(--text-main)',
        border: '2px solid var(--accent)'
      }" id="pix-modal-content">
        <h3 class="text-lg font-bold mb-2" :style="{ color: 'var(--accent)' }">Me pague um café ☕</h3>
        <p class="mb-3 text-center">Apoie o projeto enviando qualquer valor via Pix!</p>
        <img src="/images/qrcode-pix.png" alt="QR Code Pix" class="w-48 h-48 object-contain mb-3 border rounded bg-white p-2" />
        <div class="mb-3 w-full">
          <label class="block text-sm font-semibold mb-1 text-center">Chave Pix (celular):</label>
          <div class="flex items-center justify-center gap-2">
            <span class="bg-gray-800 px-2 py-1 rounded select-all text-sm" id="pix-key">(11) 98192-7567</span>
            <button
              @click="copyPixKey"
              class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold transition"
              id="pix-copy-btn"
            >
              Copiar
            </button>
          </div>
          <div class="text-xs text-gray-400 text-center mt-1">Lucas Alves</div>
        </div>
        <button
          class="cursor-pointer mt-2 px-4 py-2 rounded font-bold transition"
          :style="{
            background: 'var(--accent)',
            color: 'var(--text-main)'
          }"
          @click="showPixModal = false"
          id="pix-modal-close-btn"
        >
          Fechar
        </button>
      </div>
    </div>

    <!-- Modal de instalação PWA -->
    <div v-if="showInstallPrompt"
      class="fixed left-1/2 -translate-x-1/2 bg-blue-800 text-white px-6 py-3 rounded shadow-lg z-[9500] flex items-center gap-4"
      :class="isMobile ? 'bottom-6' : 'bottom-24'"
      id="install-prompt"
    >
      <span>Instale o CentralOS no seu dispositivo para acesso rápido!</span>
      <button @click="installApp" class="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold" id="install-prompt-install-btn">Instalar</button>
      <button @click="showInstallPrompt = false" class="cursor-pointer ml-2 text-blue-200 hover:text-white" id="install-prompt-close-btn">Fechar</button>
    </div>

    <!-- Modal de login via GitHub -->
    <transition name="fade">
      <div v-if="showLoginModal" class="fixed inset-0 z-[999] flex items-center justify-center"
        style="background: rgba(0,0,0,0.85);">
        <div class="bg-gray-900 border-4 rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto"
          :style="{ borderColor: 'var(--accent)' }">
          <font-awesome-icon icon="fa-brands fa-github" class="text-5xl mb-4 text-gray-300" />
          <h2 class="text-2xl font-bold mb-4 text-center">Login via GitHub</h2>
          <p class="mb-4 text-center">
            Para sincronizar seus dados entre dispositivos, faça login com sua conta do <b>GitHub</b>.<br>
            Seus dados ficarão salvos de forma privada em seu próprio repositório.
          </p>
          <button
            @click="confirmLoginWithGitHub"
            class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow transition text-lg mb-3 w-full"
            id="modal-github-login-btn"
          >
            <font-awesome-icon icon="fa-brands fa-github" class="text-xl" />
            Entrar com GitHub
          </button>
          <button
            @click="showLoginModal = false"
            class="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-gray-200 px-6 py-3 rounded-full font-bold shadow transition text-lg w-full"
            id="modal-github-cancel-btn"
          >
            Cancelar
          </button>
        </div>
      </div>
    </transition>

    <!-- Modal de logout com confirmação -->
    <transition name="fade">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[999] flex items-center justify-center"
        style="background: rgba(0,0,0,0.85);">
        <div class="bg-gray-900 border-4 rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto"
          :style="{ borderColor: 'var(--accent)' }">
          <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-5xl mb-4 text-red-400" />
          <h2 class="text-2xl font-bold mb-4 text-center">Sair da sincronização</h2>
          <p class="mb-4 text-center text-red-300">
            Ao sair, seus dados <b>não serão mais sincronizados</b> com o GitHub.<br>
            Você poderá continuar usando o app localmente, mas <b>poderá perder dados</b> se limpar o navegador ou trocar de dispositivo.
          </p>
          <button
            @click="confirmLogoutGitHub"
            class="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold shadow transition text-lg mb-3 w-full"
            id="modal-github-logout-btn"
          >
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="text-xl" />
            Sair e parar sincronização
          </button>
          <button
            @click="showLogoutModal = false"
            class="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-gray-200 px-6 py-3 rounded-full font-bold shadow transition text-lg w-full"
            id="modal-github-logout-cancel-btn"
          >
            Cancelar
          </button>
        </div>
      </div>
    </transition>

    <!-- Toast de copiado -->
    <transition name="fade">
      <div v-if="showPixToast"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-[9999] font-bold"
        style="pointer-events: none;">
        Copiado!
      </div>
    </transition>

  </div>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body {
  position: relative;
}

/* Removemos os estilos específicos do papel de parede pois agora 
   o estilo é aplicado diretamente ao body */

#roomContent {
  padding-bottom: 72px;
}

#dock {
  transform: translateX(-50%);
  transition: transform 240ms cubic-bezier(.22, 1, .36, 1), opacity 180ms ease;
  will-change: transform, opacity;
}

#dock.dock-auto-hidden {
  transform: translate(-50%, calc(100% + 1.5rem));
  opacity: 0;
  pointer-events: none;
}

#desktop-dock-icons {
  scrollbar-width: none;
}

#desktop-dock-icons::-webkit-scrollbar {
  display: none;
}

.dock-item {
  transition: transform 180ms cubic-bezier(.22, 1, .36, 1), background-color 180ms ease, box-shadow 180ms ease;
}

.dock-item:hover,
.dock-item-chosen {
  transform: translateY(-5px) scale(1.12);
  background: var(--accent-soft);
}

.dock-item-active {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--glass-border);
}

.dock-item-active::after {
  content: "";
  position: absolute;
  bottom: 0.15rem;
  left: 50%;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--accent);
  transform: translateX(-50%);
}

.dock-item-ghost {
  opacity: 0.28;
  transform: scale(0.9);
}

.dock-item-icon {
  transition: transform 180ms ease, filter 180ms ease;
}

.dock-item:hover .dock-item-icon {
  filter: drop-shadow(0 4px 7px rgba(0, 0, 0, 0.24));
}

@media (max-width: 900px) and (min-width: 769px) {
  .dock-item {
    width: 2rem !important;
    height: 2rem !important;
  }

  .dock-item-icon {
    font-size: 0.95rem !important;
  }

  #dock {
    padding: 0.35rem !important;
  }
}

.dock-tooltip {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-strong);
  font-size: 0.75rem;
  color: var(--text-main);
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 50;
  white-space: nowrap;
}

.group:hover .dock-tooltip {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {

  html,
  body,
  #app {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
}
</style>
