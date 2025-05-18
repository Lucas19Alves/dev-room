<script setup>
import Timer from './components/Timer.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import TodoList from './components/TodoList.vue'
import Docs from './components/Docs.vue'
import QuickNotes from './components/QuickNotes.vue'
import CodeSnippets from './components/CodeSnippets.vue'
import DeployChecklist from './components/DeployChecklist.vue'
import Pomodoro from './components/Pomodoro.vue'
import Search from './components/Search.vue'
import Themes from './components/Themes.vue'
import WaterReminder from './components/WaterReminder.vue'
import Window from './components/Window.vue'
import FakeDataGenerator from './components/FakeDataGenerator.vue'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'

const NOME_KEY = 'dev-room-nome'
const THEME_KEY = 'dev-room-theme'
const nome = ref('')

function getUserInfo() {
  const novoNome = prompt('Digite seu nome:', nome.value)
  if (novoNome !== null && novoNome.trim() !== '') {
    nome.value = novoNome.trim()
    localStorage.setItem(NOME_KEY, nome.value)
  }
}

const currentTheme = ref('theme-default')
function applyTheme(theme) {
  currentTheme.value = theme
  document.documentElement.className = theme
  localStorage.setItem(THEME_KEY, theme)
}

onMounted(() => {
  const salvo = localStorage.getItem(NOME_KEY)
  if (salvo && salvo.trim() !== '') {
    nome.value = salvo
  } else {
    getUserInfo()
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

  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
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
    year: 'numeric',
  })
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const windowComponents = {
  Timer,
  MusicPlayer,
  TodoList,
  Docs,
  QuickNotes,
  CodeSnippets,
  DeployChecklist,
  Pomodoro,
  Search,
  Themes,
  WaterReminder,
  FakeDataGenerator,
}

let zIndexCounter = 10
const openWindows = reactive([])

const mobileActiveTab = ref('Timer') // ou qualquer componente inicial

const mobileTabs = [
  { type: 'Timer', label: 'Timer', icon: 'fa-solid fa-stopwatch' },
  { type: 'MusicPlayer', label: 'Player de Música', icon: 'fa-solid fa-music' },
  { type: 'TodoList', label: 'To-Do List', icon: 'fa-solid fa-list-check' },
  { type: 'Docs', label: 'Documentação', icon: 'fa-solid fa-book' },
  { type: 'QuickNotes', label: 'Notas Rápidas', icon: 'fa-solid fa-sticky-note' },
  { type: 'CodeSnippets', label: 'Snippets de Código', icon: 'fa-solid fa-code' },
  { type: 'DeployChecklist', label: 'Checklist de Deploy', icon: 'fa-solid fa-rocket' },
  { type: 'Pomodoro', label: 'Pomodoro', icon: 'fa-solid fa-clock' },
  { type: 'Search', label: 'Busca', icon: 'fa-solid fa-magnifying-glass' },
  { type: 'Themes', label: 'Temas', icon: 'fa-solid fa-palette' },
  { type: 'WaterReminder', label: 'Lembrete de Água', icon: 'fa-solid fa-droplet' },
  { type: 'FakeDataGenerator', label: 'Gerador de Dados', icon: 'fa-solid fa-database' },
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
    Search: { width: 640, height: 120 },
    Themes: { width: 340, height: 560 },
    WaterReminder: { width: 340, height: 400 },
    FakeDataGenerator: { width: 340, height: 400 },
  }
  const { width, height } = defaultSizes[type] || { width: 340, height: 220 }

  // Centralizar na área do conteúdo
  let x = 0
  let y = 0

  const container = document.getElementById('roomContent')
  if (container) {
    const rect = container.getBoundingClientRect()
    x = (rect.width - width) / 2
    y = (rect.height - height) / 2
  } else {
    // fallback para centralizar na tela
    x = (window.innerWidth - width) / 2
    y = (window.innerHeight - height) / 2
  }

  openWindows.push({
    id: Date.now() + Math.random(),
    type,
    x,
    y,
    zIndex: ++zIndexCounter,
    title: titleMap[type],
    width,
    height,
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

const showInstallPrompt = ref(false)
let deferredPrompt = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e
    showInstallPrompt.value = true
  })
})

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

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
</script>

<template>
  <SpeedInsights />
  <div class="h-screen text-gray-100 relative overflow-hidden" :style="{ background: 'var(--bg-main)', color: 'var(--text-main)' }">
    <!-- Botão de menu fixo no topo -->
    <button
      v-if="isMobile"
      @click="mobileMenuOpen = true"
      class="fixed top-4 left-4 z-50 bg-gray-900/80 rounded-full p-3 shadow-lg border border-gray-700"
    >
      <font-awesome-icon icon="fa-solid fa-bars" class="text-2xl text-blue-300" />
    </button>

    <!-- Drawer lateral -->
    <transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 bg-black/40" @click.self="mobileMenuOpen = false">
        <nav
          class="absolute left-0 top-0 h-full w-64 shadow-2xl flex flex-col py-8 px-4"
          :style="{
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            borderRight: '2px solid var(--accent)',
          }"
        >
          <button @click="mobileMenuOpen = false" class="self-end mb-6 text-gray-400 hover:text-white text-2xl">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
          <div class="flex flex-col gap-3">
            <button
              v-for="tab in mobileTabs"
              :key="tab.type"
              @click="
                mobileActiveTab = tab.type
                mobileMenuOpen = false
              "
              class="flex items-center gap-3 px-3 py-2 rounded text-lg transition"
              :class="mobileActiveTab === tab.type ? 'bg-blue-800 text-blue-200 font-bold' : 'text-gray-300 hover:bg-gray-800'"
              :style="mobileActiveTab === tab.type ? { background: 'var(--accent)', color: 'var(--text-main)' } : {}"
            >
              <font-awesome-icon :icon="tab.icon" class="text-xl" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </nav>
      </div>
    </transition>

    <div v-if="isMobile" class="flex flex-col h-screen">
      <!-- Conteúdo da aba ativa -->
      <div class="flex-1 overflow-auto">
        <component :is="windowComponents[mobileActiveTab]" />
      </div>
    </div>
    <div v-else>
      <div
        id="statusBar"
        class="bg-gray-800 text-blue-200 p-4 flex flex-row justify-between items-center shadow"
        :style="{ background: 'var(--bg-panel)' }"
      >
        <div>
          <font-awesome-icon icon="fa-solid fa-user" class="text-blue-300 hover:text-blue-500 cursor-pointer" @click="getUserInfo" />
        </div>
        <div>
          <h1>
            Olá, dev
            <span class="text-blue-400 font-semibold">{{ nome }}!</span>
          </h1>
        </div>
        <div class="flex flex-row gap-4 items-center">
          <h1 class="flex flex-row items-center gap-2">
            {{ formatTime(now) }}
            <font-awesome-icon icon="fa-solid fa-clock" class="text-blue-300" />
          </h1>
        </div>
      </div>

      <div id="roomContent" class="relative w-full h-[calc(100vh-200px)]">
        <template v-for="win in openWindows" :key="win.id">
          <Window
            :title="win.title"
            :x="win.x"
            :y="win.y"
            :zIndex="win.zIndex"
            :width="win.width"
            :height="win.height"
            :containerSelector="'#roomContent'"
            @close="closeWindow(win.id)"
            @update:position="pos => updateWindowPosition(win.id, pos)"
            @update:size="size => updateWindowSize(win.id, size)"
            @bringToFront="bringToFront(win.id)"
          >
            <component
              :is="win.type === 'Themes' ? Themes : windowComponents[win.type]"
              v-bind="win.type === 'Themes' ? { setTheme: applyTheme, currentTheme } : {}"
            />
          </Window>
        </template>
      </div>

      <div
        id="dock"
        class="p-4 flex flex-wrap justify-center items-center rounded-xl shadow-2xl fixed left-1/2 -translate-x-1/2 bottom-6 w-[90vw] max-w-6xl border"
        :style="{
          background: 'var(--bg-panel)',
          color: 'var(--text-main)',
          borderColor: 'var(--accent)',
        }"
      >
        <div class="flex flex-wrap gap-3 justify-center items-center w-full max-w-6xl">
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('Timer')">
            <font-awesome-icon icon="fa-solid fa-stopwatch" class="text-blue-400 text-2xl hover:text-blue-200" />
            <span class="dock-tooltip group-hover:opacity-100">{{ 'Timer' }}</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('MusicPlayer')">
            <font-awesome-icon icon="fa-solid fa-music" class="text-green-400 text-2xl hover:text-green-200" />
            <span class="dock-tooltip group-hover:opacity-100">Player de Música</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('TodoList')">
            <font-awesome-icon icon="fa-solid fa-list-check" class="text-yellow-400 text-2xl hover:text-yellow-200" />
            <span class="dock-tooltip group-hover:opacity-100">To-Do List</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('Docs')">
            <font-awesome-icon icon="fa-solid fa-book" class="text-pink-400 text-2xl hover:text-pink-200" />
            <span class="dock-tooltip group-hover:opacity-100">Documentação</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('QuickNotes')">
            <font-awesome-icon icon="fa-solid fa-sticky-note" class="text-orange-400 text-2xl hover:text-orange-200" />
            <span class="dock-tooltip group-hover:opacity-100">Notas Rápidas</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('CodeSnippets')">
            <font-awesome-icon icon="fa-solid fa-code" class="text-purple-400 text-2xl hover:text-purple-200" />
            <span class="dock-tooltip group-hover:opacity-100">Snippets de Código</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative"
            @click="openWindow('DeployChecklist')">
            <font-awesome-icon icon="fa-solid fa-rocket" class="text-teal-400 text-2xl hover:text-teal-200" />
            <span class="dock-tooltip group-hover:opacity-100">Checklist de Deploy</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('Pomodoro')">
            <font-awesome-icon icon="fa-solid fa-clock" class="text-red-400 text-2xl hover:text-red-200" />
            <span class="dock-tooltip group-hover:opacity-100">Pomodoro</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('Search')">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="text-cyan-400 text-2xl hover:text-cyan-200" />
            <span class="dock-tooltip group-hover:opacity-100">Busca</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('Themes')">
            <font-awesome-icon icon="fa-solid fa-palette" class="text-fuchsia-400 text-2xl hover:text-fuchsia-200" />
            <span class="dock-tooltip group-hover:opacity-100">Temas</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative" @click="openWindow('WaterReminder')">
            <font-awesome-icon icon="fa-solid fa-droplet" class="text-sky-400 text-2xl hover:text-sky-200" />
            <span class="dock-tooltip group-hover:opacity-100">Lembrete de Água</span>
          </div>
          <div class="flex flex-col items-center group cursor-pointer w-16 relative"
            @click="openWindow('FakeDataGenerator')">
            <font-awesome-icon icon="fa-solid fa-database" class="text-lime-400 text-2xl hover:text-lime-200" />
            <span class="dock-tooltip group-hover:opacity-100">Gerador de Dados</span>
          </div>
        </div>
      </div>

      <div
        v-if="showInstallPrompt"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-800 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-4"
      >
        <span>Instale o Dev Room no seu dispositivo para acesso rápido!</span>
        <button @click="installApp" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">Instalar</button>
        <button @click="showInstallPrompt = false" class="ml-2 text-blue-200 hover:text-white">Fechar</button>
      </div>
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
