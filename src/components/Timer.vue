<template>
  <div class="flex flex-col items-center justify-center p-6 min-w-[260px]">
    <h2 class="text-xl font-bold mb-4 text-blue-300">Timer</h2>
    <form @submit.prevent="setTimer" class="flex gap-2 mb-4">
      <input
        type="number"
        min="0"
        max="99"
        v-model.number="inputMinutes"
        class="w-14 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        placeholder="min"
      />
      <span class="text-blue-200 font-bold">:</span>
      <input
        type="number"
        min="0"
        max="59"
        v-model.number="inputSeconds"
        class="w-14 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        placeholder="seg"
      />
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
      >
        Definir
      </button>
    </form>
    <div class="text-5xl font-mono mb-6 text-blue-200 select-none">
      {{ formattedTime }}
    </div>
    <div class="flex gap-4">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        @click="toggleTimer"
        :disabled="totalSeconds === 0"
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
    </div>
  </div>
</template>

<script setup>
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

const formattedTime = computed(() => {
  const remaining = Math.max(totalSeconds.value - elapsed.value, 0)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  return `${min}:${sec}`
})

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

function setTimer() {
  totalSeconds.value = inputMinutes.value * 60 + inputSeconds.value
  elapsed.value = 0
  running.value = false
  endTimestamp.value = null
  clearInterval(intervalId)
  saveState()
}

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

onMounted(() => {
  loadState()
})

onUnmounted(() => {
  clearInterval(intervalId)
  saveState()
})

watch([inputMinutes, inputSeconds, totalSeconds, elapsed, running, endTimestamp], saveState)
</script>

<style scoped>
</style>