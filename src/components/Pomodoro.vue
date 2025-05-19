<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]">
    <h2 class="text-xl font-bold mb-4 text-red-400">Pomodoro</h2>
    <form @submit.prevent="saveConfig" class="flex gap-2 mb-4 items-end">
      <div>
        <label class="block text-xs text-gray-400 mb-1">Foco (min)</label>
        <input type="number" min="1" max="120" v-model.number="focusInput" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700" />
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Pausa (min)</label>
        <input type="number" min="1" max="60" v-model.number="breakInput" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700" />
      </div>
      <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-xs">Salvar</button>
    </form>
    <div class="mb-2 text-lg text-gray-300">
      {{ isBreak ? 'Pausa' : 'Foco' }}
    </div>
    <div class="text-5xl font-mono mb-4 text-red-300 select-none break-words w-full text-center">
      {{ formattedTime }}
    </div>
    <div class="mb-4 text-sm text-gray-400 italic text-center">
      "{{ fraseMotivacional }}"
    </div>
    <div class="flex gap-2 mb-2 flex-wrap justify-center w-full">
      <button
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
        @click="toggleTimer"
      >
        {{ running ? 'Pausar' : (elapsed > 0 ? 'Continuar' : 'Iniciar') }}
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="resetTimer"
        :disabled="elapsed === 0 && !running"
      >
        Resetar
      </button>
      <button
        class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition"
        @click="skip"
      >
        Pular
      </button>
    </div>
    <div class="mt-2 text-xs text-gray-400">
      Ciclo: {{ cycle }} / 4
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { playSound, notify } from '../utils/notify'

const POMODORO_STATE_KEY = 'dev-room-pomodoro-state'
const POMODORO_CONFIG_KEY = 'dev-room-pomodoro-config'

const frases = [
  'Foque no agora!',
  'Você está mais perto do seu objetivo.',
  'Continue, a pausa está chegando!',
  'Cada ciclo é um passo a mais.',
  'Respire fundo e mantenha o ritmo.'
]
const fraseMotivacional = frases[Math.floor(Math.random() * frases.length)]

// Configuração editável
const focusInput = ref(25)
const breakInput = ref(5)
const focusTime = ref(25 * 60)
const breakTime = ref(5 * 60)

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

const elapsed = ref(0)
const running = ref(false)
const isBreak = ref(false)
const cycle = ref(1)
const endTimestamp = ref(null)
let intervalId = null

const formattedTime = computed(() => {
  const total = isBreak.value ? breakTime.value : focusTime.value
  const remaining = Math.max(total - elapsed.value, 0)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  return `${min}:${sec}`
})

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

function pauseTimer() {
  running.value = false
  clearInterval(intervalId)
  saveState()
}

function resetTimer() {
  pauseTimer()
  elapsed.value = 0
  endTimestamp.value = null
  saveState()
}

function toggleTimer() {
  if (running.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

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

function skip() {
  nextStage()
}

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

watch([elapsed, running, isBreak, cycle, endTimestamp], saveState)
</script>