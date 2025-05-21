<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]" id="water-reminder-main">
    <h2 class="text-xl font-bold mb-4 text-sky-400" id="water-reminder-title">Lembrete de Beber Água</h2>
    <form @submit.prevent="saveInterval" class="flex justify-center gap-2 mb-4 w-full" id="water-reminder-form">
      <label class="text-sm flex items-center gap-2" id="water-reminder-interval-label">
        Intervalo:
        <input
          type="number"
          min="5"
          max="180"
          v-model.number="interval"
          class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none text-center"
          id="water-reminder-interval-input"
        /> min
      </label>
      <button type="submit" class="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded transition" id="water-reminder-save-btn">
        Salvar
      </button>
      <button
        type="button"
        class="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded transition ml-2"
        @click="toggleReminder"
        id="water-reminder-toggle-btn"
      >
        {{ running ? 'Parar' : 'Iniciar' }}
      </button>
    </form>
    <div class="mb-4 w-full flex flex-col items-center" id="water-reminder-next">
      <div class="text-sm text-gray-400 mb-2" id="water-reminder-next-label">
        Próximo lembrete em: <span class="font-semibold text-sky-300" id="water-reminder-timeleft">{{ timeLeftFormatted }}</span>
      </div>
      <button
        @click="registerDrink"
        class="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded font-bold transition"
        id="water-reminder-drink-btn"
        :disabled="!running"
      >
        Bebi {{ amount }}ml de água
      </button>
      <div class="flex items-center gap-2 mt-2" id="water-reminder-amount-group">
        <label class="text-xs text-gray-400" id="water-reminder-amount-label">Quantidade:</label>
        <input
          type="number"
          min="50"
          max="1000"
          step="50"
          v-model.number="amount"
          class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
          id="water-reminder-amount-input"
        /> ml
      </div>
    </div>
    <div class="w-full mt-4 flex-1 flex flex-col" id="water-reminder-history">
      <div class="text-xs text-gray-400 mb-1" id="water-reminder-history-label">Histórico de hoje</div>
      <ul class="max-h-32 overflow-y-auto text-sm flex-1" id="water-reminder-history-list">
        <li v-for="(item, idx) in todayHistory" :key="idx" class="flex justify-between border-b border-gray-700 py-1 water-reminder-history-item">
          <span>{{ formatTime(item.time) }}</span>
          <span>{{ item.amount }}ml</span>
        </li>
        <li v-if="todayHistory.length === 0" class="text-gray-500 text-center" id="water-reminder-history-empty">Nenhum registro hoje.</li>
      </ul>
      <div class="mt-2 text-xs text-sky-300 font-semibold" id="water-reminder-total-today">
        Total hoje: {{ totalTodayLiters }} L
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { playSound, notify } from '../utils/notify'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

// Estado do lembrete de água
const allData = getDevRoomData()
const waterReminder = ref(allData.waterReminder || {
  config: { interval: 60, amount: 200 },
  history: [],
  next: null,
  running: false
})

// Salva lembrete de água no localStorage ao alterar
watch(waterReminder, (val) => {
  const data = getDevRoomData()
  data.waterReminder = val
  setDevRoomData(data)
}, { deep: true })

// Atualiza lembrete ao detectar alteração no localStorage
function syncFromStorage(e) {
  if (e.key === 'dev-room-data') {
    const allData = getDevRoomData()
    waterReminder.value = allData.waterReminder || {
      config: { interval: 60, amount: 200 },
      history: [],
      next: null,
      running: false
    }
  }
}
onMounted(() => {
  window.addEventListener('storage', syncFromStorage)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', syncFromStorage)
})

const interval = ref(waterReminder.value.config.interval || 60)
const amount = ref(waterReminder.value.config.amount || 200)
const timeLeft = ref(0)
const running = ref(waterReminder.value.running || false)
const timer = ref(null)
const history = ref(waterReminder.value.history || [])
const nextReminder = ref(waterReminder.value.next || null)

function saveInterval() {
  // Só salva, não inicia o timer
}

function toggleReminder() {
  running.value = !running.value
  if (running.value) {
    resetTimer()
  } else {
    clearInterval(timer.value)
    nextReminder.value = null
    timeLeft.value = 0
  }
}

function registerDrink() {
  if (!running.value) return
  const now = new Date()
  history.value.push({
    time: now.toISOString(),
    amount: amount.value
  })
  resetTimer()
}

function resetTimer() {
  const now = Date.now()
  nextReminder.value = now + interval.value * 60 * 1000
  updateTimeLeft()
}

function tick() {
  if (!running.value || !nextReminder.value) return
  const now = Date.now()
  if (nextReminder.value > now) {
    timeLeft.value = Math.floor((nextReminder.value - now) / 1000)
  } else {
    playSound('/sounds/notify.mp3')
    notify('Lembrete de hidratar-se', { body: 'Hora de beber água! 💧' })
    resetTimer()
  }
}

function updateTimeLeft() {
  if (!nextReminder.value) {
    timeLeft.value = 0
    return
  }
  const now = Date.now()
  timeLeft.value = Math.max(Math.floor((nextReminder.value - now) / 1000), 0)
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

// Atualização automática ao mudar localStorage
onMounted(() => {
  // Não inicia automaticamente!
  updateTimeLeft()
  timer.value = setInterval(() => {
    if (running.value) {
      tick()
    }
  }, 1000)
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission()
  }
  window.addEventListener('devroom-pause-all', () => running.value = false)
  window.addEventListener('devroom-resume-all', () => running.value = true)
})

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value)
  window.removeEventListener('devroom-pause-all', () => running.value = false)
  window.removeEventListener('devroom-resume-all', () => running.value = true)
})
</script>