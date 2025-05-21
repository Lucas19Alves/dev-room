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
        v-model.number="timer.inputMinutes"
        class="w-14 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        placeholder="min"
        id="timer-input-minutes"
      />
      <span class="text-blue-200 font-bold" id="timer-separator">:</span>
      <input
        type="number"
        min="0"
        max="59"
        v-model.number="timer.inputSeconds"
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
        :disabled="timer.totalSeconds === 0"
        id="timer-toggle-btn"
      >
        {{ timer.running ? 'Pausar' : (timer.elapsed > 0 ? 'Continuar' : 'Iniciar') }}
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="resetTimer"
        :disabled="timer.elapsed === 0 && !timer.running"
        id="timer-reset-btn"
      >
        Resetar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { playSound, notify } from '../utils/notify'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

// Estado do timer
const allData = getDevRoomData()
const timer = ref(allData.timer || {
  inputMinutes: 0,
  inputSeconds: 0,
  totalSeconds: 0,
  elapsed: 0,
  running: false,
  endTimestamp: null
})

// Controle do intervalo do timer
let intervalId = null

watch(timer, (val) => {
  const data = getDevRoomData()
  data.timer = val
  setDevRoomData(data)
}, { deep: true })

function syncFromStorage(e) {
  if (e.key === 'dev-room-data') {
    const allData = getDevRoomData()
    timer.value = allData.timer || {
      inputMinutes: 0,
      inputSeconds: 0,
      totalSeconds: 0,
      elapsed: 0,
      running: false,
      endTimestamp: null
    }
  }
}
onMounted(() => {
  window.addEventListener('storage', syncFromStorage)
})
onUnmounted(() => {
  window.removeEventListener('storage', syncFromStorage)
  clearInterval(intervalId)
})

const formattedTime = computed(() => {
  const remaining = Math.max(timer.value.totalSeconds - timer.value.elapsed, 0)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  return `${min}:${sec}`
})

function setTimer() {
  timer.value.totalSeconds = timer.value.inputMinutes * 60 + timer.value.inputSeconds
  timer.value.elapsed = 0
  timer.value.running = false
  timer.value.endTimestamp = null
  clearInterval(intervalId)
}

function startTimer() {
  if (!timer.value.running && timer.value.totalSeconds > 0) {
    timer.value.running = true
    timer.value.endTimestamp = Date.now() + (timer.value.totalSeconds - timer.value.elapsed) * 1000
    clearInterval(intervalId)
    intervalId = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(Math.floor((timer.value.endTimestamp - now) / 1000), 0)
      timer.value.elapsed = timer.value.totalSeconds - remaining
      if (remaining <= 0) {
        playSound('/sounds/notify.mp3')
        notify('Tempo finalizado!', { body: 'Seu timer terminou.' })
        pauseTimer()
        timer.value.elapsed = timer.value.totalSeconds
        timer.value.endTimestamp = null
      }
    }, 1000)
  }
}

function pauseTimer() {
  timer.value.running = false
  clearInterval(intervalId)
}

function resetTimer() {
  pauseTimer()
  timer.value.elapsed = 0
  timer.value.endTimestamp = null
}

function toggleTimer() {
  if (timer.value.running) {
    pauseTimer()
  } else {
    startTimer()
  }
}
</script>

<style scoped>
</style>