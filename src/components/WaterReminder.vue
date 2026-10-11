<template>
  <div class="tool" style="--app-accent-rgb: 90, 200, 250" id="water-reminder-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Lembrete de Água</h2>
        <p class="tool-sub">{{ water.running ? `Próximo lembrete em ${timeLeft}` : 'Lembretes desligados' }}</p>
      </div>
      <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !water.running }" @click="toggle" id="water-reminder-toggle-btn">
        <font-awesome-icon :icon="water.running ? 'fa-solid fa-pause' : 'fa-solid fa-bell'" /> {{ water.running ? 'Parar' : 'Ativar lembretes' }}
      </button>
    </div>

    <div class="tool-card goal">
      <div class="glass" :style="{ '--fill': `${percent}%` }" aria-hidden="true"><span></span></div>
      <div class="goal-info">
        <strong class="total">{{ (todayTotal / 1000).toFixed(2) }} L</strong>
        <span class="tool-muted">de {{ (water.config.goal / 1000).toFixed(1) }} L hoje · {{ percent }}%</span>
        <span v-if="percent >= 100" class="chip ok">Meta batida! 💧</span>
      </div>
    </div>

    <div class="tool-row quick">
      <button v-for="ml in quickAmounts" :key="ml" type="button" class="btn" @click="drink(ml)">+{{ ml }} ml</button>
    </div>

    <div class="tool-card settings">
      <label>Intervalo <span><input type="number" min="5" max="240" v-model.number="water.config.interval" /> min</span></label>
      <label>Meta diária <span><input type="number" min="500" max="6000" step="250" v-model.number="water.config.goal" /> ml</span></label>
    </div>

    <div class="history">
      <span class="tool-label">Hoje</span>
      <ul class="tool-list" id="water-reminder-history-list">
        <li v-for="item in todayHistory" :key="item.time" class="tool-item">
          <font-awesome-icon icon="fa-solid fa-droplet" class="drop" />
          <span>{{ formatTime(item.time) }}</span>
          <span class="tool-grow amount">{{ item.amount }} ml</span>
          <button type="button" class="icon-btn danger" @click="remove(item)" title="Remover registro"><font-awesome-icon icon="fa-solid fa-trash" /></button>
        </li>
        <li v-if="!todayHistory.length" class="tool-empty">Nenhum registro hoje.</li>
      </ul>
    </div>

    <div v-if="week.some(d => d.total)" class="week" aria-label="Últimos 7 dias">
      <div v-for="day in week" :key="day.key" class="bar" :title="`${day.label}: ${(day.total / 1000).toFixed(2)} L`">
        <span :style="{ height: `${Math.min(100, day.total / water.config.goal * 100)}%` }"></span>
        <small>{{ day.short }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { playSound, notify, requestNotificationPermission } from '../utils/notify'
import { useAppStorage } from '../composables/useAppStorage'

const { state: water } = useAppStorage('waterReminder', { config: { interval: 60, amount: 200, goal: 2000 }, history: [], next: null, running: false })
water.value.config = { interval: 60, amount: 200, goal: 2000, ...water.value.config }
water.value.history ||= []

const quickAmounts = [150, 200, 300, 500]
const now = ref(Date.now())
const dayKey = date => { const d = new Date(date); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

const todayHistory = computed(() => water.value.history.filter(item => dayKey(item.time) === dayKey(now.value)).slice().reverse())
const todayTotal = computed(() => todayHistory.value.reduce((sum, item) => sum + item.amount, 0))
const percent = computed(() => Math.round(todayTotal.value / Math.max(1, water.value.config.goal) * 100))
const timeLeft = computed(() => {
  const seconds = Math.max(0, Math.round(((water.value.next || 0) - now.value) / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
const week = computed(() => Array.from({ length: 7 }, (_, i) => {
  const date = new Date(now.value - (6 - i) * 86400000)
  const key = dayKey(date)
  return {
    key, label: date.toLocaleDateString('pt-BR'), short: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }),
    total: water.value.history.filter(item => dayKey(item.time) === key).reduce((sum, item) => sum + item.amount, 0)
  }
}))

function scheduleNext() {
  const minutes = Math.max(5, Math.min(240, Number(water.value.config.interval) || 60))
  water.value.next = Date.now() + minutes * 60000
}

function toggle() {
  water.value.running = !water.value.running
  if (water.value.running) {
    requestNotificationPermission()
    scheduleNext()
  } else water.value.next = null
}

function drink(ml) {
  water.value.history.push({ time: new Date().toISOString(), amount: ml })
  // Mantém só os últimos 30 dias para não inflar o backup.
  const cutoff = Date.now() - 30 * 86400000
  water.value.history = water.value.history.filter(item => new Date(item.time).getTime() >= cutoff)
  if (water.value.running) scheduleNext()
}

function remove(item) {
  water.value.history = water.value.history.filter(h => h !== item && !(h.time === item.time && h.amount === item.amount))
}

const formatTime = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

watch(() => water.value.config.interval, () => { if (water.value.running) scheduleNext() })

let tick = 0
let pausedByBreak = false
function onTick() {
  now.value = Date.now()
  if (water.value.running && water.value.next && now.value >= water.value.next) {
    playSound('/sounds/notify.mp3')
    notify('Hora de beber água! 💧', { body: `Meta de hoje: ${percent.value}% concluída.` })
    scheduleNext()
  }
}
function pauseAll() { if (water.value.running) { pausedByBreak = true; water.value.running = false } }
function resumeAll() { if (pausedByBreak) { pausedByBreak = false; water.value.running = true; scheduleNext() } }
onMounted(() => {
  tick = setInterval(onTick, 1000)
  window.addEventListener('devroom-pause-all', pauseAll)
  window.addEventListener('devroom-resume-all', resumeAll)
})
onUnmounted(() => {
  clearInterval(tick)
  window.removeEventListener('devroom-pause-all', pauseAll)
  window.removeEventListener('devroom-resume-all', resumeAll)
})
</script>

<style scoped>
.goal { display: flex; align-items: center; gap: 16px; }
.glass { position: relative; width: 54px; height: 72px; border: 2px solid rgba(var(--app-accent-rgb), .6); border-top: 0; border-radius: 4px 4px 14px 14px; overflow: hidden; flex: none; }
.glass span { position: absolute; inset: auto 0 0; height: min(var(--fill), 100%); background: linear-gradient(180deg, rgba(var(--app-accent-rgb), .55), rgb(var(--app-accent-rgb))); transition: height .5s; }
.goal-info { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.total { font-size: 26px; letter-spacing: -.03em; }
.quick { display: grid; grid-template-columns: repeat(4, 1fr); }
.settings { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: 12.5px; color: var(--text-secondary); }
.settings label { display: flex; flex-direction: column; gap: 4px; }
.settings span { display: flex; align-items: center; gap: 6px; }
.settings input { width: 90px; }
.history { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.history .tool-list { max-height: 180px; }
.drop { color: rgb(var(--app-accent-rgb)); }
.amount { text-align: right; font-weight: 600; }
.week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; height: 70px; align-items: end; }
.bar { display: flex; flex-direction: column; align-items: center; gap: 2px; height: 100%; justify-content: flex-end; }
.bar span { width: 100%; max-width: 22px; min-height: 2px; border-radius: 5px; background: rgb(var(--app-accent-rgb)); }
.bar small { font-size: 10px; color: var(--text-muted); }
</style>
