<script setup>
import Timer from './components/Timer.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import TodoList from './components/TodoList.vue'
import QuickNotes from './components/QuickNotes.vue'
import CodeSnippets from './components/CodeSnippets.vue'
import DeployChecklist from './components/DeployChecklist.vue'
import Pomodoro from './components/Pomodoro.vue'
import Search from './components/Search.vue'
import WaterReminder from './components/WaterReminder.vue'
import Window from './components/Window.vue'
import FakeDataGenerator from './components/FakeDataGenerator.vue'
import Config from './components/Config.vue'
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { SpeedInsights } from '@vercel/speed-insights/vue';

const NOME_KEY = 'dev-room-nome'
const THEME_KEY = 'dev-room-theme'

const userName = ref(localStorage.getItem(NOME_KEY) || '')
const nomeInput = ref(userName.value || '')
const onboardingDone = ref(localStorage.getItem('dev-room-onboarding') === 'ok');

const onboardingStep = ref(0)
const checkedOnboarding = ref(false)

function saveName() {
  if (nomeInput.value.trim() !== '') {
    userName.value = nomeInput.value.trim()
    localStorage.setItem(NOME_KEY, userName.value)
    onboardingStep.value++
  }
}

function endOnboarding() {
  onboardingDone.value = true
  localStorage.setItem('dev-room-onboarding', 'ok')
}

const currentTheme = ref('theme-default')
function applyTheme(theme) {
  currentTheme.value = theme
  document.documentElement.className = theme
  localStorage.setItem(THEME_KEY, theme)
}

function setNome(novoNome) {
  userName.value = novoNome
  localStorage.setItem(NOME_KEY, userName.value)
}

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

  // Restaurar janelas abertas
  const savedWindows = localStorage.getItem('dev-room-windows')
  if (savedWindows) {
    try {
      const parsed = JSON.parse(savedWindows)
      openWindows.splice(0, openWindows.length, ...parsed)
      // Atualiza zIndexCounter para evitar sobreposição errada
      if (parsed.length) {
        zIndexCounter = Math.max(...parsed.map(w => w.zIndex ?? 10), zIndexCounter)
      }
    } catch (e) {
      // Se der erro, limpa o localStorage para evitar travar o app
      localStorage.removeItem('dev-room-windows')
    }
  }
})

onUnmounted(() => {
  clearInterval(intervalId)
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

const windowComponents = {
  Timer,
  MusicPlayer,
  TodoList,
  QuickNotes,
  CodeSnippets,
  DeployChecklist,
  Pomodoro,
  Search,
  WaterReminder,
  FakeDataGenerator,
  Config,
}

let zIndexCounter = 10
const openWindows = reactive([])

watch(openWindows, (windows) => {
  localStorage.setItem('dev-room-windows', JSON.stringify(windows))
}, { deep: true })

const mobileActiveTab = ref('Timer')

const mobileTabs = [
  { type: 'Timer', label: 'Timer', icon: 'fa-solid fa-stopwatch' },
  { type: 'MusicPlayer', label: 'Player de Música', icon: 'fa-solid fa-music' },
  { type: 'TodoList', label: 'To-Do List', icon: 'fa-solid fa-list-check' },
  { type: 'QuickNotes', label: 'Notas Rápidas', icon: 'fa-solid fa-sticky-note' },
  { type: 'CodeSnippets', label: 'Snippets de Código', icon: 'fa-solid fa-code' },
  { type: 'DeployChecklist', label: 'Checklist de Deploy', icon: 'fa-solid fa-rocket' },
  { type: 'Pomodoro', label: 'Pomodoro', icon: 'fa-solid fa-clock' },
  { type: 'Search', label: 'Busca', icon: 'fa-solid fa-magnifying-glass' },
  { type: 'WaterReminder', label: 'Lembrete de Água', icon: 'fa-solid fa-droplet' },
  { type: 'FakeDataGenerator', label: 'Gerador de Dados', icon: 'fa-solid fa-database' },
  { type: 'Config', label: 'Configurações', icon: 'fa-solid fa-gear' },
]

const mobileMenuOpen = ref(false)

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
    DeployChecklist: 'Checklist de Deploy',
    Pomodoro: 'Pomodoro',
    Search: 'Busca',
    Themes: 'Temas',
    WaterReminder: 'Lembrete de Água',
    FakeDataGenerator: 'Gerador de Dados Falsos',
    Config: 'Configurações'
  }
  const defaultSizes = {
    Timer: { width: 320, height: 360 },
    MusicPlayer: { width: 340, height: 520 },
    TodoList: { width: 340, height: 540 },
    Docs: { width: 480, height: 500 },
    QuickNotes: { width: 620, height: 600 },
    CodeSnippets: { width: 600, height: 680 },
    DeployChecklist: { width: 340, height: 520 },
    Pomodoro: { width: 400, height: 420 },
    Search: { width: 700, height: 500 },
    Themes: { width: 340, height: 560 },
    WaterReminder: { width: 340, height: 400 },
    FakeDataGenerator: { width: 340, height: 400 },
    Config: { width: 340, height: 400 }
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
  // Ajusta o tamanho para nunca ultrapassar o container
  width = Math.min(width, maxWidth - 16) // 16px de margem opcional
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

function closeWindow(id) {
  const idx = openWindows.findIndex(w => w.id === id)
  if (idx !== -1) openWindows.splice(idx, 1)
}

function updateWindowPosition(id, pos) {
  const win = openWindows.find(w => w.id === id)
  if (win) {
    win.x = pos.x
    win.y = pos.y
  }
}

function updateWindowSize(id, size) {
  const win = openWindows.find(w => w.id === id)
  if (win) {
    win.width = size.width
    win.height = size.height
  }
}

function bringToFront(id) {
  zIndexCounter++
  const win = openWindows.find(w => w.id === id)
  if (win) win.zIndex = zIndexCounter
}

function minimizeWindow(id) {
  const win = openWindows.find(w => w.id === id)
  if (win) win.minimized = true
}
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

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

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

// Funções para pausar e retomar
function activatePauseMode() {
  pauseMode.value = true
  pauseStep.value = 0
  // Pausar alarmes/timers
  window.dispatchEvent(new CustomEvent('devroom-pause-all'))
  // Pausar música
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
  // Retomar alarmes/timers
  window.dispatchEvent(new CustomEvent('devroom-resume-all'))
  // Retomar música
  window.dispatchEvent(new CustomEvent('devroom-music-resume'))
}
</script>

<template>
  <!-- Modal de onboarding -->
  <transition name="fade">
    <div
      v-if="!onboardingDone"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0, 0, 0, 0.85); color: white"
      id="onboarding-modal"
    >
      <div class="max-w-md w-full bg-gray-900 p-8 rounded-xl shadow-xl text-center border border-blue-500" id="onboarding-content">
        <!-- Passo 0 do onboarding -->
        <div v-if="onboardingStep === 0" id="onboarding-step-0">
          <h2 class="text-2xl font-bold mb-4">Bem-vindo ao Dev Room 🚀</h2>
          <p class="mb-6">Esse é seu espaço digital com ferramentas úteis para programar, se organizar e focar.</p>
          <button
            @click="onboardingStep++"
            class="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
            id="onboarding-next-btn"
          >
            Próximo
          </button>
        </div>
        <!-- Passo 1 do onboarding -->
        <div v-else-if="onboardingStep === 1" id="onboarding-step-1">
          <h2 class="text-xl font-bold mb-4">Qual é o seu nome?</h2>
          <input
            v-model="nomeInput"
            placeholder="Digite seu nome"
            class="w-full px-4 py-2 rounded bg-gray-800 text-white border border-blue-400 mb-4"
            id="onboarding-name-input"
          />
          <button
            :disabled="!nomeInput.trim()"
            @click="saveName"
            class="cursor-pointer bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold disabled:opacity-50"
            id="onboarding-continue-btn"
          >
            Continuar
          </button>
        </div>
        <!-- Passo 2 do onboarding -->
        <div v-else-if="onboardingStep === 2" id="onboarding-step-2">
          <h2 class="text-xl font-bold mb-4">Tudo pronto, {{ userName }}!</h2>
          <p class="mb-4">Use os widgets no dock abaixo para abrir ferramentas como Pomodoro, Notas e muito mais.</p>
          <button
            @click="endOnboarding"
            class="cursor-pointer bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold"
            aria-label="Começar a usar o Dev Room"
            id="onboarding-finish-btn"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  </transition>

  <SpeedInsights />

  <!-- Container principal do app -->
  <div class="h-screen text-gray-100 relative overflow-hidden"
    :style="{ background: 'var(--bg-main)', color: 'var(--text-main)' }"
    id="main-app"
  >

    <!-- Botão para abrir menu mobile -->
    <button
      v-if="isMobile"
      @click="mobileMenuOpen = true"
      class="cursor-pointer fixed top-4 left-4 z-50 bg-gray-900/80 rounded-full p-3 shadow-lg border border-gray-700"
      aria-label="Abrir menu"
      id="mobile-menu-open-btn"
    >
      <font-awesome-icon icon="fa-solid fa-bars" class="text-2xl text-blue-300" />
    </button>

    <!-- Menu lateral mobile -->
    <transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-40 bg-black/40"
        @click.self="mobileMenuOpen = false"
        id="mobile-menu-overlay"
      >
        <nav
          class="absolute left-0 top-0 h-full w-64 shadow-2xl flex flex-col py-8 px-4"
          aria-label="Menu"
          :style="{
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            borderRight: '2px solid var(--accent)'
          }"
          id="mobile-menu"
        >
          <!-- Botão para fechar menu mobile -->
          <button @click="mobileMenuOpen = false" class="self-end mb-6 text-gray-400 hover:text-white text-2xl" id="mobile-menu-close-btn">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
          <!-- Abas do menu mobile -->
          <div class="flex flex-col gap-3" id="mobile-menu-tabs">
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
        <component :is="windowComponents[mobileActiveTab]" />
      </div>

      <!-- Dock mobile -->
      <nav
        class="fixed bottom-0 left-0 w-full z-40 flex items-center justify-center py-2"
        aria-label="Dock"
        :style="{
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--accent)',
          boxShadow: '0 -2px 8px 0 rgb(0 0 0 / 0.10)'
        }"
        id="mobile-dock"
      >
        <!-- Botão de apoio mobile -->
        <button
          class="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-xs shadow transition"
          :style="{
            background: 'var(--accent)',
            color: 'var(--text-main)',
            border: '1px solid var(--accent)',
            opacity: 0.85
          }"
          @click="showPixModal = true"
          title="Me apoie"
          id="mobile-dock-support-btn"
        >
          <font-awesome-icon icon="fa-solid fa-heart" class="text-base" />
          Me apoie
        </button>
      </nav>
    </div>

    <!-- Conteúdo principal desktop -->
    <div v-else>
      <!-- Barra de status superior -->
      <div id="statusBar" class="bg-gray-800 text-blue-200 p-4 flex flex-row justify-between items-center shadow"
        :style="{ background: 'var(--bg-panel)' }">
        <div id="support-btn-container">
          <!-- Botão de apoio desktop -->
          <button
            class="cursor-pointer font-bold px-4 py-2 rounded-full shadow flex items-center gap-2 transition"
            :style="{
              background: 'var(--accent)',
              color: 'var(--text-main)',
              border: '2px solid var(--accent)'
            }" @click="showPixModal = true" title="Me apoie"
            id="support-btn"
          >
            <font-awesome-icon icon="fa-solid fa-heart" class="text-xl" />
            Me apoie
          </button>
        </div>
        <div id="status-bar-user">
          <h1>Olá, dev <span class="font-semibold" :style="{color: 'var(--name)'}">{{ userName }}!</span></h1>
        </div>
        <div class="flex flex-row gap-4 items-center" id="status-bar-clock">
          <h1 class="flex flex-row items-center gap-2">
            {{ formatTime(now) }}
            <font-awesome-icon icon="fa-solid fa-clock" class="text-blue-300" />
          </h1>
        </div>
      </div>

      <!-- Área das janelas abertas -->
      <div id="roomContent" class="relative w-full h-[calc(100vh-200px)]">
        <template v-for="win in openWindows" :key="win.id">
          <Window :title="win.title" :x="win.x" :y="win.y" :zIndex="win.zIndex" :width="win.width" :height="win.height"
            :containerSelector="'#roomContent'" :minimized="win.minimized" @close="closeWindow(win.id)"
            @update:position="pos => updateWindowPosition(win.id, pos)"
            @update:size="size => updateWindowSize(win.id, size)" @bringToFront="bringToFront(win.id)"
            @minimize="minimizeWindow(win.id)">
            <component :is="win.type === 'Config' ? Config : windowComponents[win.type]"
              v-bind="win.type === 'Config' ? { setTheme: applyTheme, currentTheme, nome: userName, setNome } : {}" />
          </Window>
        </template>
      </div>

      <!-- Dock desktop -->
      <div id="dock"
        class="p-4 flex flex-wrap justify-center items-center rounded-xl shadow-2xl fixed left-1/2 -translate-x-1/2 bottom-6 w-[90vw] max-w-6xl border"
        :style="{
          background: 'var(--bg-panel)',
          color: 'var(--text-main)',
          borderColor: 'var(--accent)'
        }">
        <div class="flex flex-wrap gap-3 justify-center items-center w-full max-w-6xl" id="desktop-dock-icons">
          <!-- Ícones do dock desktop -->
          <div
            v-for="winTab in mobileTabs"
            :key="winTab.type"
            class="flex flex-col items-center group cursor-pointer w-16 relative"
            @click="() => {
              const win = openWindows.find(w => w.type === winTab.type)
              if (win) {
                if (win.minimized) {
                  restoreWindow(win.id)
                  bringToFront(win.id)
                } else if (win.zIndex === zIndexCounter) {
                  minimizeWindow(win.id)
                } else {
                  bringToFront(win.id)
                }
              } else {
                openWindow(winTab.type)
              }
            }"
            :id="`desktop-dock-icon-${winTab.type}`"
          >
            <font-awesome-icon :icon="winTab.icon" :class="[
              winTab.type === 'Timer' ? 'text-blue-400 hover:text-blue-200' : '',
              winTab.type === 'MusicPlayer' ? 'text-green-400 hover:text-green-200' : '',
              winTab.type === 'TodoList' ? 'text-yellow-400 hover:text-yellow-200' : '',
              winTab.type === 'Docs' ? 'text-pink-400 hover:text-pink-200' : '',
              winTab.type === 'QuickNotes' ? 'text-orange-400 hover:text-orange-200' : '',
              winTab.type === 'CodeSnippets' ? 'text-purple-400 hover:text-purple-200' : '',
              winTab.type === 'DeployChecklist' ? 'text-teal-400 hover:text-teal-200' : '',
              winTab.type === 'Pomodoro' ? 'text-red-400 hover:text-red-200' : '',
              winTab.type === 'Search' ? 'text-cyan-400 hover:text-cyan-200' : '',
              winTab.type === 'Themes' ? 'text-fuchsia-400 hover:text-fuchsia-200' : '',
              winTab.type === 'WaterReminder' ? 'text-sky-400 hover:text-sky-200' : '',
              winTab.type === 'FakeDataGenerator' ? 'text-lime-400 hover:text-lime-200' : ''
            ]" class="text-2xl" />
            <span class="dock-tooltip group-hover:opacity-100">{{ winTab.label }}</span>
            <span
              v-if="openWindows.find(w => w.type === winTab.type && w.minimized)"
              class="absolute top-1 right-2 w-2 h-2 rounded-full bg-yellow-400 border border-yellow-700"
              title="Minimizada"
              :id="`desktop-dock-icon-minimized-${winTab.type}`"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão modo pausa Desktop -->
    <div
      v-if="!isMobile"
      class="fixed left-[calc(5vw-64px)] bottom-6 z-50 flex flex-col items-center"
      style="min-width: 64px;"
      id="pause-btn-desktop-container"
    >
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs shadow transition border"
        :style="{
          background: 'var(--bg-panel)',
          color: 'var(--text-main)',
          borderColor: 'var(--accent)',
          opacity: 0.95
        }"
        @click="activatePauseMode"
        title="Modo Pausa"
        id="pause-btn-desktop"
      >
        <font-awesome-icon icon="fa-solid fa-mug-hot" class="text-orange-400 text-xl" />
        Pausa
      </button>
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

    <!-- Modal do modo pausa -->
    <transition name="fade">
      <div
        v-if="pauseMode"
        class="fixed inset-0 z-[999] flex items-center justify-center"
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
    <div v-if="showPixModal" class="fixed inset-0 z-50 flex items-center justify-center"
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
      class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-800 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-4"
      id="install-prompt"
    >
      <span>Instale o Dev Room no seu dispositivo para acesso rápido!</span>
      <button @click="installApp" class="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold" id="install-prompt-install-btn">Instalar</button>
      <button @click="showInstallPrompt = false" class="cursor-pointer ml-2 text-blue-200 hover:text-white" id="install-prompt-close-btn">Fechar</button>
    </div>
  </div>
</template>

<style scoped>
#roomContent {
  padding-bottom: 120px;
}

.dock-tooltip {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  font-size: 0.75rem;
  color: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.15);
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
```
