<template>
  <!-- Container principal do lembrete de água -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]" id="water-reminder-main">
    <h2 class="text-xl font-bold mb-4 text-sky-400" id="water-reminder-title">Lembrete de Beber Água</h2>
    <!-- Formulário de configuração do intervalo -->
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
    <!-- Próximo lembrete e registro de consumo -->
    <div class="mb-4 w-full flex flex-col items-center" id="water-reminder-next">
      <div class="text-sm text-gray-400 mb-2" id="water-reminder-next-label">
        Próximo lembrete em: <span class="font-semibold text-sky-300" id="water-reminder-timeleft">{{ timeLeftFormatted }}</span>
      </div>
      <button
        @click="registerDrink"
        class="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded font-bold transition"
        id="water-reminder-drink-btn"
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
    <!-- Histórico do dia -->
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
// Importações e definição de propriedades
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { playSound } from '../utils/notify'

// Função para notificar o usuário
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

// Chaves de armazenamento local
const STORAGE_KEY = 'dev-room-water-reminder'
const HISTORY_KEY = 'dev-room-water-history'
const NEXT_REMINDER_KEY = 'dev-room-water-next-reminder'

// Estados reativos principais
const interval = ref(60) // minutos
const amount = ref(200) // ml
const timer = ref(null)
const timeLeft = ref(interval.value * 60)
const history = ref([])
const running = ref(true)

// Carrega configurações e histórico do localStorage
function loadSettings() {
  const savedInterval = localStorage.getItem(STORAGE_KEY)
  if (savedInterval) interval.value = Number(savedInterval)
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  history.value = savedHistory ? JSON.parse(savedHistory) : []
}

// Salva o intervalo escolhido e reinicia o timer
function saveInterval() {
  localStorage.setItem(STORAGE_KEY, interval.value)
  resetTimer()
}

// Registra o consumo de água
function registerDrink() {
  const now = new Date()
  history.value.push({
    time: now.toISOString(),
    amount: amount.value
  })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  resetTimer()
}

// Reinicia o timer para o próximo lembrete
function resetTimer() {
  const now = Date.now()
  const next = now + interval.value * 60 * 1000
  localStorage.setItem(NEXT_REMINDER_KEY, next)
  timeLeft.value = interval.value * 60
}

// Reduz o tempo restante e notifica quando chega a zero
function tick() {
  if (!running.value) return
  if (timeLeft.value > 0) {
    timeLeft.value--
  } else {
    playSound('/sounds/notify.mp3')
    notify('Lembrete de hidratar-se', { body: 'Hora de beber água! 💧' })
    resetTimer()
  }
}

// Atualiza o tempo restante com base no localStorage
function updateTimeLeft() {
  const next = Number(localStorage.getItem(NEXT_REMINDER_KEY))
  const now = Date.now()
  if (next && next > now) {
    timeLeft.value = Math.floor((next - now) / 1000)
  } else {
    timeLeft.value = 0
  }
}

// Inicia ou pausa o lembrete
function toggleReminder() {
  running.value = !running.value
  if (running.value) {
    resetTimer()
  }
}

// Histórico apenas do dia atual
const todayHistory = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return history.value.filter(item => item.time.startsWith(today))
})

// Soma total de água consumida no dia (em litros)
const totalTodayLiters = computed(() => {
  const total = todayHistory.value.reduce((sum, item) => sum + item.amount, 0)
  return (total / 1000).toFixed(2)
})

// Formata horário para exibição
function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Formata o tempo restante para mm:ss
const timeLeftFormatted = computed(() => {
  const min = Math.floor(timeLeft.value / 60)
  const sec = timeLeft.value % 60
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
})

// Ciclo de vida do componente: inicialização e limpeza
onMounted(() => {
  loadSettings()
  updateTimeLeft()
  timer.value = setInterval(() => {
    if (running.value) {
      tick()
      updateTimeLeft()
    }
  }, 1000)
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission()
  }
  // Integração com modo pausa global
  window.addEventListener('devroom-pause-all', () => running.value = false)
  window.addEventListener('devroom-resume-all', () => running.value = true)
})

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value)
  window.removeEventListener('devroom-pause-all', () => running.value = false)
  window.removeEventListener('devroom-resume-all', () => running.value = true)
})
</script>