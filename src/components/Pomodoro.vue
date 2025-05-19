<template>
  <!-- Container principal do Pomodoro -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]" id="pomodoro-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-red-400" id="pomodoro-title">Pomodoro</h2>
    <!-- Formulário de configuração de foco e pausa -->
    <form @submit.prevent="saveConfig" class="flex gap-2 mb-4 items-end" id="pomodoro-form">
      <div>
        <label class="block text-xs text-gray-400 mb-1" id="pomodoro-label-focus">Foco (min)</label>
        <input type="number" min="1" max="120" v-model.number="focusInput" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700" id="pomodoro-input-focus" />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1" id="pomodoro-label-break">Pausa (min)</label>
        <input type="number" min="1" max="60" v-model.number="breakInput" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700" id="pomodoro-input-break" />
      </div>
      <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-xs" id="pomodoro-save-btn">Salvar</button>
    </form>
    <!-- Exibe se está em foco ou pausa -->
    <div class="mb-2 text-lg text-gray-300" id="pomodoro-stage">
      {{ isBreak ? 'Pausa' : 'Foco' }}
    </div>
    <!-- Exibição do tempo formatado -->
    <div class="text-5xl font-mono mb-4 text-red-300 select-none break-words w-full text-center" id="pomodoro-timer">
      {{ formattedTime }}
    </div>
    <!-- Frase motivacional -->
    <div class="mb-4 text-sm text-gray-400 italic text-center" id="pomodoro-motivation">
      "{{ fraseMotivacional }}"
    </div>
    <!-- Botões de controle do Pomodoro -->
    <div class="flex gap-2 mb-2 flex-wrap justify-center w-full" id="pomodoro-actions">
      <button
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
        @click="toggleTimer"
        id="pomodoro-toggle-btn"
      >
        {{ running ? 'Pausar' : (elapsed > 0 ? 'Continuar' : 'Iniciar') }}
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="resetTimer"
        :disabled="elapsed === 0 && !running"
        id="pomodoro-reset-btn"
      >
        Resetar
      </button>
      <button
        class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition"
        @click="skip"
        id="pomodoro-skip-btn"
      >
        Pular
      </button>
    </div>
    <!-- Exibe o ciclo atual -->
    <div class="mt-2 text-xs text-gray-400" id="pomodoro-cycle">
      Ciclo: {{ cycle }} / 4
    </div>
  </div>
</template>

<script setup>
// Importações e estados reativos principais
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { playSound, notify } from '../utils/notify'

// Chaves para localStorage
const POMODORO_STATE_KEY = 'dev-room-pomodoro-state'
const POMODORO_CONFIG_KEY = 'dev-room-pomodoro-config'

// Frases motivacionais aleatórias
const frases = [
  'Foque no agora!',
  'Você está mais perto do seu objetivo.',
  'Continue, a pausa está chegando!',
  'Cada ciclo é um passo a mais.',
  'Respire fundo e mantenha o ritmo.'
]
const fraseMotivacional = frases[Math.floor(Math.random() * frases.length)]

// Configuração editável de foco e pausa
const focusInput = ref(25)
const breakInput = ref(5)
const focusTime = ref(25 * 60)
const breakTime = ref(5 * 60)

// Salva configuração de foco/pausa
function saveConfig() {
  focusTime.value = focusInput.value * 60
  breakTime.value = breakInput.value * 60
  localStorage.setItem(POMODORO_CONFIG_KEY, JSON.stringify({
    focus: focusInput.value,
    break: breakInput.value
  }))
  // Se estiver pausado, reseta o timer para novo tempo
  if (!running.value) {
    elapsed.value = 0
    endTimestamp.value = null
  }
}

// Carrega configuração salva
function loadConfig() {
  const saved = localStorage.getItem(POMODORO_CONFIG_KEY)
  if (saved) {
    const cfg = JSON.parse(saved)
    focusInput.value = cfg.focus
    breakInput.value = cfg.break
    focusTime.value = cfg.focus * 60
    breakTime.value = cfg.break * 60
  }
}

// Estados do Pomodoro
const elapsed = ref(0)
const running = ref(false)
const isBreak = ref(false)
const cycle = ref(1)
const endTimestamp = ref(null)
let intervalId = null

// Tempo formatado para exibição (mm:ss)
const formattedTime = computed(() => {
  const total = isBreak.value ? breakTime.value : focusTime.value
  const remaining = Math.max(total - elapsed.value, 0)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  return `${min}:${sec}`
})

// Salva o estado atual do Pomodoro
function saveState() {
  localStorage.setItem(
    POMODORO_STATE_KEY,
    JSON.stringify({
      elapsed: elapsed.value,
      running: running.value,
      isBreak: isBreak.value,
      cycle: cycle.value,
      endTimestamp: endTimestamp.value
    })
  )
}

// Carrega o estado salvo do Pomodoro
function loadState() {
  const saved = localStorage.getItem(POMODORO_STATE_KEY)
  if (saved) {
    const state = JSON.parse(saved)
    elapsed.value = state.elapsed
    running.value = state.running
    isBreak.value = state.isBreak
    cycle.value = state.cycle
    endTimestamp.value = state.endTimestamp
    const total = isBreak.value ? breakTime.value : focusTime.value
    if (running.value && endTimestamp.value) {
      const now = Date.now()
      const remaining = Math.max(Math.floor((endTimestamp.value - now) / 1000), 0)
      elapsed.value = total - remaining
      if (remaining <= 0) {
        elapsed.value = total
        running.value = false
        endTimestamp.value = null
        playSound('/sounds/notify.mp3')
        notify('Novo ciclo do Pomodoro', { body: 'Confira seu pomodoro' })
        nextStage(true)
      } else {
        startTimer(true)
      }
    }
  }
}

// Inicia o timer do Pomodoro
function startTimer(fromLoad = false) {
  if ((!running.value || fromLoad)) {
    running.value = true
    const total = isBreak.value ? breakTime.value : focusTime.value
    if (!fromLoad) {
      endTimestamp.value = Date.now() + (total - elapsed.value) * 1000
    }
    saveState()
    clearInterval(intervalId)
    intervalId = setInterval(() => {
      const now = Date.now()
      const total = isBreak.value ? breakTime.value : focusTime.value
      const remaining = Math.max(Math.floor((endTimestamp.value - now) / 1000), 0)
      elapsed.value = total - remaining
      if (remaining <= 0) {
        nextStage()
      }
    }, 1000)
  }
}

// Pausa o timer do Pomodoro
function pauseTimer() {
  running.value = false
  clearInterval(intervalId)
  saveState()
}

// Reseta o timer do Pomodoro
function resetTimer() {
  pauseTimer()
  elapsed.value = 0
  endTimestamp.value = null
  saveState()
}

// Alterna entre iniciar e pausar o timer
function toggleTimer() {
  if (running.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

// Avança para o próximo estágio (foco <-> pausa)
function nextStage(fromLoad = false) {
  pauseTimer()
  elapsed.value = 0
  endTimestamp.value = null
  if (!isBreak.value) {
    isBreak.value = true
  } else {
    isBreak.value = false
    cycle.value = cycle.value < 4 ? cycle.value + 1 : 1
  }
  if (!fromLoad) {
    playSound('/sounds/notify.mp3')
    notify('Novo ciclo do Pomodoro', { body: 'Confira seu pomodoro' })
  }
  startTimer()
}

// Pula para o próximo estágio manualmente
function skip() {
  nextStage()
}

// Ciclo de vida: monta e desmonta o componente
onMounted(() => {
  loadConfig()
  loadState()
  window.addEventListener('devroom-pause-all', pauseTimer)
  window.addEventListener('devroom-resume-all', () => {
    if (running.value) startTimer()
  })
})

onUnmounted(() => {
  clearInterval(intervalId)
  saveState()
  window.removeEventListener('devroom-pause-all', pauseTimer)
  window.removeEventListener('devroom-resume-all', () => {
    if (running.value) startTimer()
  })
})

// Observa mudanças para salvar o estado automaticamente
watch([elapsed, running, isBreak, cycle, endTimestamp], saveState)
</script>