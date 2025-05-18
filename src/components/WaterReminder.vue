<template>
  <div class="flex flex-col items-center justify-center mx-auto p-6 min-w-[320px] max-w-[400px] w-full sm:items-start sm:justify-start">
    <h2 class="text-xl font-bold mb-4 text-sky-400">Lembrete de Beber Água</h2>
    <form @submit.prevent="saveInterval" class="flex justify-center gap-2 mb-4 w-full">
      <label class="text-sm flex items-center gap-2">
        Intervalo:
        <input
          type="number"
          min="5"
          max="180"
          v-model.number="interval"
          class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none text-center"
        /> min
      </label>
      <button type="submit" class="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded transition">
        Salvar
      </button>
    </form>
    <div class="mb-4 w-full flex flex-col items-center">
      <div class="text-sm text-gray-400 mb-2">
        Próximo lembrete em: <span class="font-semibold text-sky-300">{{ timeLeftFormatted }}</span>
      </div>
      <button
        @click="registerDrink"
        class="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded font-bold transition"
      >
        Bebi {{ amount }}ml de água
      </button>
      <div class="flex items-center gap-2 mt-2">
        <label class="text-xs text-gray-400">Quantidade:</label>
        <input
          type="number"
          min="50"
          max="1000"
          step="50"
          v-model.number="amount"
          class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        /> ml
      </div>
    </div>
    <div class="w-full mt-4">
      <div class="text-xs text-gray-400 mb-1">Histórico de hoje</div>
      <ul class="max-h-32 overflow-y-auto text-sm">
        <li v-for="(item, idx) in todayHistory" :key="idx" class="flex justify-between border-b border-gray-700 py-1">
          <span>{{ formatTime(item.time) }}</span>
          <span>{{ item.amount }}ml</span>
        </li>
        <li v-if="todayHistory.length === 0" class="text-gray-500 text-center">Nenhum registro hoje.</li>
      </ul>
      <div class="mt-2 text-xs text-sky-300 font-semibold">
        Total hoje: {{ totalTodayLiters }} L
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { playSound } from '../utils/notify'

function notify(title, options = {}) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, options)
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, options)
        } else {
          alert(`${title}\n${options.body || ''}`)
        }
      })
    } else {
      alert(`${title}\n${options.body || ''}`)
    }
  } else {
    alert(`${title}\n${options.body || ''}`)
  }
}

const STORAGE_KEY = 'dev-room-water-reminder'
const HISTORY_KEY = 'dev-room-water-history'
const NEXT_REMINDER_KEY = 'dev-room-water-next-reminder'

const interval = ref(60) // minutos
const amount = ref(200) // ml
const timer = ref(null)
const timeLeft = ref(interval.value * 60)
const history = ref([])

function loadSettings() {
  const savedInterval = localStorage.getItem(STORAGE_KEY)
  if (savedInterval) interval.value = Number(savedInterval)
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  history.value = savedHistory ? JSON.parse(savedHistory) : []
}

function saveInterval() {
  localStorage.setItem(STORAGE_KEY, interval.value)
  resetTimer() // Só reinicia o timer ao salvar o novo intervalo
}

function registerDrink() {
  const now = new Date()
  history.value.push({
    time: now.toISOString(),
    amount: amount.value
  })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  resetTimer()
}

function resetTimer() {
  const now = Date.now()
  const next = now + interval.value * 60 * 1000
  localStorage.setItem(NEXT_REMINDER_KEY, next)
  timeLeft.value = interval.value * 60
}

function tick() {
  if (timeLeft.value > 0) {
    timeLeft.value--
  } else {
    playSound('/sounds/notify.mp3')
    notify('Lembrete de hidratar-se', { body: 'Hora de beber água! 💧' })
    resetTimer()
  }
}

function updateTimeLeft() {
  const next = Number(localStorage.getItem(NEXT_REMINDER_KEY))
  const now = Date.now()
  if (next && next > now) {
    timeLeft.value = Math.floor((next - now) / 1000)
  } else {
    timeLeft.value = 0
  }
}

const todayHistory = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return history.value.filter(item => item.time.startsWith(today))
})

const totalTodayLiters = computed(() => {
  const total = todayHistory.value.reduce((sum, item) => sum + item.amount, 0)
  return (total / 1000).toFixed(2)
})

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const timeLeftFormatted = computed(() => {
  const min = Math.floor(timeLeft.value / 60)
  const sec = timeLeft.value % 60
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
})

onMounted(() => {
  loadSettings()
  updateTimeLeft()
  timer.value = setInterval(() => {
    tick()
    updateTimeLeft()
  }, 1000)
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission()
  }
})

</script>