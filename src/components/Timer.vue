<template>
  <!-- Container principal do Timer -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]" id="timer-main">
    <!-- Título do Timer -->
    <h2 class="text-xl font-bold mb-4 text-blue-300" id="timer-title">Timer</h2>
    <!-- Formulário para definir tempo -->
    <form @submit.prevent="setTimer" class="flex gap-2 mb-4" id="timer-form">
      <input
        type="number"
        min="0"
        max="99"
        v-model.number="inputMinutes"
        class="w-14 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        placeholder="min"
        id="timer-input-minutes"
      />
      <span class="text-blue-200 font-bold" id="timer-separator">:</span>
      <input
        type="number"
        min="0"
        max="59"
        v-model.number="inputSeconds"
        class="w-14 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        placeholder="seg"
        id="timer-input-seconds"
      />
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
        id="timer-set-btn"
      >
        Definir
      </button>
    </form>
    <!-- Exibição do tempo formatado -->
    <div class="text-5xl font-mono mb-6 text-blue-200 select-none break-words w-full text-center" id="timer-display">
      {{ formattedTime }}
    </div>
    <!-- Botões de controle do Timer -->
    <div class="flex gap-4 flex-wrap justify-center w-full" id="timer-actions">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        @click="toggleTimer"
        :disabled="totalSeconds === 0"
        id="timer-toggle-btn"
      >
        {{ running ? 'Pausar' : (elapsed > 0 ? 'Continuar' : 'Iniciar') }}
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="resetTimer"
        :disabled="elapsed === 0 && !running"
        id="timer-reset-btn"
      >
        Resetar
      </button>
    </div>
  </div>
</template>

<script setup>
// Importações e estados reativos principais
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { playSound, notify } from '../utils/notify'

const TIMER_STATE_KEY = 'dev-room-timer-state'

const inputMinutes = ref(0)
const inputSeconds = ref(0)
const totalSeconds = ref(0)
const elapsed = ref(0)
const running = ref(false)
const endTimestamp = ref(null)
let intervalId = null

// Tempo formatado para exibição (mm:ss)
const formattedTime = computed(() => {
  const remaining = Math.max(totalSeconds.value - elapsed.value, 0)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  return `${min}:${sec}`
})

// Salva o estado atual do timer no localStorage
function saveState() {
  localStorage.setItem(
    TIMER_STATE_KEY,
    JSON.stringify({
      inputMinutes: inputMinutes.value,
      inputSeconds: inputSeconds.value,
      totalSeconds: totalSeconds.value,
      elapsed: elapsed.value,
      running: running.value,
      endTimestamp: endTimestamp.value
    })
  )
}

// Carrega o estado salvo do timer
function loadState() {
  const saved = localStorage.getItem(TIMER_STATE_KEY)
  if (saved) {
    const state = JSON.parse(saved)
    inputMinutes.value = state.inputMinutes
    inputSeconds.value = state.inputSeconds
    totalSeconds.value = state.totalSeconds
    elapsed.value = state.elapsed
    running.value = state.running
    endTimestamp.value = state.endTimestamp

    // Se estava rodando, calcula o tempo restante e reinicia
    if (running.value && endTimestamp.value) {
      const now = Date.now()
      const remaining = Math.max(Math.floor((endTimestamp.value - now) / 1000), 0)
      elapsed.value = totalSeconds.value - remaining
      if (remaining <= 0) {
        elapsed.value = totalSeconds.value
        running.value = false
        endTimestamp.value = null
        playSound('/sounds/notify.mp3')
        notify('Tempo finalizado!', { body: 'Seu timer terminou.' })
      } else {
        startTimer(true)
      }
    }
  }
}

// Define o tempo do timer
function setTimer() {
  totalSeconds.value = inputMinutes.value * 60 + inputSeconds.value
  elapsed.value = 0
  running.value = false
  endTimestamp.value = null
  clearInterval(intervalId)
  saveState()
}

// Inicia o timer
function startTimer(fromLoad = false) {
  if ((!running.value || fromLoad) && totalSeconds.value > 0) {
    running.value = true
    if (!fromLoad) {
      endTimestamp.value = Date.now() + (totalSeconds.value - elapsed.value) * 1000
    }
    saveState()
    clearInterval(intervalId)
    intervalId = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(Math.floor((endTimestamp.value - now) / 1000), 0)
      elapsed.value = totalSeconds.value - remaining
      if (remaining <= 0) {
        playSound('/sounds/notify.mp3')
        notify('Tempo finalizado!', { body: 'Seu timer terminou.' })
        pauseTimer()
        elapsed.value = totalSeconds.value
        endTimestamp.value = null
        saveState()
      }
    }, 1000)
  }
}

// Pausa o timer
function pauseTimer() {
  running.value = false
  clearInterval(intervalId)
  saveState()
}

// Reseta o timer
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

// Ciclo de vida: monta e desmonta o componente
onMounted(() => {
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
watch([inputMinutes, inputSeconds, totalSeconds, elapsed, running, endTimestamp], saveState)
</script>

<style scoped>
</style>