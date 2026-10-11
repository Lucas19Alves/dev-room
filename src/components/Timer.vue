<template>
  <div class="tool" style="--app-accent-rgb: 10, 132, 255" id="timer-main">
    <div class="tool-head">
      <h2 class="tool-title">Timer</h2>
      <div class="seg" role="tablist" aria-label="Modo">
        <button type="button" :class="{ on: timer.mode !== 'stopwatch' }" @click="setMode('countdown')">Timer</button>
        <button type="button" :class="{ on: timer.mode === 'stopwatch' }" @click="setMode('stopwatch')">Cronômetro</button>
      </div>
    </div>

    <!-- Contagem regressiva -->
    <template v-if="timer.mode !== 'stopwatch'">
      <div class="tool-row presets">
        <button v-for="min in presets" :key="min" type="button" class="btn btn-sm" @click="setDuration(min * 60)">{{ min }} min</button>
      </div>
      <div class="tool-row">
        <label class="time-field"><input type="number" min="0" max="23" v-model.number="hours" aria-label="Horas" /> h</label>
        <label class="time-field"><input type="number" min="0" max="59" v-model.number="minutes" aria-label="Minutos" /> min</label>
        <label class="time-field"><input type="number" min="0" max="59" v-model.number="seconds" aria-label="Segundos" /> s</label>
        <button type="button" class="btn btn-sm" @click="applyFields" id="timer-set-btn">Definir</button>
      </div>
    </template>

    <div class="display" :class="{ done: finished }">
      <svg v-if="timer.mode !== 'stopwatch'" viewBox="0 0 120 120" class="dial" aria-hidden="true">
        <circle cx="60" cy="60" r="54" class="track" />
        <circle cx="60" cy="60" r="54" class="bar" :style="{ strokeDashoffset: 339.3 * (1 - progress) }" />
      </svg>
      <span class="time tool-mono">{{ display }}</span>
      <span v-if="finished" class="chip ok">Tempo esgotado!</span>
    </div>

    <div class="tool-row actions">
      <button type="button" class="btn btn-primary" @click="toggle" :disabled="timer.mode !== 'stopwatch' && !timer.total" id="timer-toggle-btn">
        <font-awesome-icon :icon="running ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
        {{ running ? 'Pausar' : elapsedMs > 0 && !finished ? 'Continuar' : 'Iniciar' }}
      </button>
      <button v-if="timer.mode === 'stopwatch'" type="button" class="btn" @click="lap" :disabled="!running">Volta</button>
      <button v-else type="button" class="btn" @click="addMinute" :disabled="!timer.total">+1 min</button>
      <button type="button" class="btn" @click="reset" :disabled="!elapsedMs && !running" id="timer-reset-btn">
        <font-awesome-icon icon="fa-solid fa-rotate-left" /> Zerar
      </button>
    </div>

    <ol v-if="timer.mode === 'stopwatch' && timer.laps.length" class="tool-list laps">
      <li v-for="(lapMs, i) in [...timer.laps].reverse()" :key="i" class="tool-item">
        <span class="tool-muted">Volta {{ timer.laps.length - i }}</span>
        <span class="tool-mono lap-time">{{ format(lapMs, true) }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { playSound, notify } from '../utils/notify'
import { useAppStorage } from '../composables/useAppStorage'

// Estado salvo: o relógio continua mesmo com a janela fechada (usa horários absolutos).
const { state: timer } = useAppStorage('timer', { mode: 'countdown', total: 300, startedAt: null, accumulated: 0, laps: [] })
// Migra o formato antigo ({ totalSeconds, elapsed, running, endTimestamp }).
if (timer.value.totalSeconds !== undefined) {
  const old = timer.value
  timer.value = {
    mode: 'countdown', total: old.totalSeconds || 0, laps: [],
    accumulated: old.running && old.endTimestamp ? 0 : (old.elapsed || 0) * 1000,
    startedAt: old.running && old.endTimestamp ? old.endTimestamp - (old.totalSeconds || 0) * 1000 : null
  }
}
timer.value.laps ||= []

const presets = [1, 5, 10, 15, 25, 45]
let notified = false
const now = ref(Date.now())
const running = computed(() => Boolean(timer.value.startedAt))
const elapsedMs = computed(() => timer.value.accumulated + (timer.value.startedAt ? now.value - timer.value.startedAt : 0))
const remainingMs = computed(() => Math.max(0, timer.value.total * 1000 - elapsedMs.value))
const finished = computed(() => timer.value.mode !== 'stopwatch' && timer.value.total > 0 && remainingMs.value === 0)
const progress = computed(() => timer.value.total ? Math.min(1, elapsedMs.value / (timer.value.total * 1000)) : 0)
const display = computed(() => timer.value.mode === 'stopwatch' ? format(elapsedMs.value, true) : format(Math.ceil(remainingMs.value / 1000) * 1000))

const hours = ref(Math.floor(timer.value.total / 3600))
const minutes = ref(Math.floor(timer.value.total % 3600 / 60))
const seconds = ref(timer.value.total % 60)

function format(ms, withTenths = false) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = String(Math.floor(total % 3600 / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  const tenths = withTenths ? `.${Math.floor(ms % 1000 / 100)}` : ''
  return `${h ? `${h}:` : ''}${m}:${s}${tenths}`
}

function setMode(mode) {
  if (timer.value.mode === mode) return
  timer.value = { ...timer.value, mode, startedAt: null, accumulated: 0, laps: [] }
}

function setDuration(totalSeconds) {
  const total = Math.max(0, Math.min(86399, Math.floor(totalSeconds) || 0))
  timer.value = { ...timer.value, total, startedAt: null, accumulated: 0 }
  hours.value = Math.floor(total / 3600)
  minutes.value = Math.floor(total % 3600 / 60)
  seconds.value = total % 60
}

function applyFields() {
  const clamp = (v, max) => Math.max(0, Math.min(max, Number(v) || 0))
  setDuration(clamp(hours.value, 23) * 3600 + clamp(minutes.value, 59) * 60 + clamp(seconds.value, 59))
}

function toggle() {
  if (running.value) {
    timer.value.accumulated = elapsedMs.value
    timer.value.startedAt = null
  } else {
    if (finished.value) timer.value.accumulated = 0
    now.value = Date.now()
    timer.value.startedAt = now.value
    notified = false
  }
}

function reset() {
  timer.value = { ...timer.value, startedAt: null, accumulated: 0, laps: [] }
}

function addMinute() {
  timer.value.total = Math.min(86399, timer.value.total + 60)
}

function lap() {
  timer.value.laps.push(elapsedMs.value)
}

let tick = 0
watch(finished, done => {
  if (done && running.value && !notified) {
    notified = true
    timer.value.accumulated = timer.value.total * 1000
    timer.value.startedAt = null
    playSound('/sounds/notify.mp3')
    notify('Tempo finalizado!', { body: 'Seu timer terminou.' })
  }
}, { immediate: true })

function pauseAll() { if (running.value) toggle() }
onMounted(() => {
  tick = setInterval(() => { now.value = Date.now() }, 100)
  window.addEventListener('devroom-pause-all', pauseAll)
})
onUnmounted(() => {
  clearInterval(tick)
  window.removeEventListener('devroom-pause-all', pauseAll)
})
</script>

<style scoped>
.presets { gap: 6px; }
.time-field { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); }
.time-field input { width: 58px; text-align: center; }
.display { position: relative; display: grid; place-items: center; align-self: center; width: min(240px, 80%); aspect-ratio: 1; }
.display > * { grid-area: 1 / 1; }
.display .chip { align-self: end; margin-bottom: 18%; }
.dial { width: 100%; height: 100%; transform: rotate(-90deg); }
.dial circle { fill: none; stroke-width: 6; }
.dial .track { stroke: var(--surface-soft); }
.dial .bar { stroke: rgb(var(--app-accent-rgb)); stroke-linecap: round; stroke-dasharray: 339.3; transition: stroke-dashoffset .2s linear; }
.time { font-size: clamp(2rem, 11cqi, 3rem); font-weight: 700; letter-spacing: -.04em; }
.done .time { color: #ff5f57; }
.actions { justify-content: center; }
.laps { max-height: 180px; }
.lap-time { margin-left: auto; }
</style>
