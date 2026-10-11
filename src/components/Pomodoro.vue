<template>
  <div class="tool" :style="{ '--app-accent-rgb': stage.rgb }" id="pomodoro-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Pomodoro</h2>
        <p class="tool-sub">{{ pomo.completedToday }} foco{{ pomo.completedToday === 1 ? '' : 's' }} concluído{{ pomo.completedToday === 1 ? '' : 's' }} hoje</p>
      </div>
      <div class="seg" role="group" aria-label="Etapa">
        <button v-for="(item, id) in stages" :key="id" type="button" :class="{ on: pomo.stage === id }" @click="goTo(id)">{{ item.label }}</button>
      </div>
    </div>

    <div class="display">
      <svg viewBox="0 0 120 120" class="dial" aria-hidden="true">
        <circle cx="60" cy="60" r="54" class="track" />
        <circle cx="60" cy="60" r="54" class="bar" :style="{ strokeDashoffset: 339.3 * (1 - progress) }" />
      </svg>
      <div class="center">
        <span class="stage-name">{{ stage.label }}</span>
        <span class="time tool-mono">{{ display }}</span>
        <span class="dots" :title="`Ciclo ${pomo.cycle} de ${pomo.config.rounds}`">
          <i v-for="n in pomo.config.rounds" :key="n" :class="{ on: n < pomo.cycle || (n === pomo.cycle && pomo.stage !== 'focus') }"></i>
        </span>
      </div>
    </div>

    <p class="motivation tool-muted">“{{ phrase }}”</p>

    <div class="tool-row actions">
      <button type="button" class="btn btn-primary" @click="toggle" id="pomodoro-toggle-btn">
        <font-awesome-icon :icon="running ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
        {{ running ? 'Pausar' : elapsedMs > 0 ? 'Continuar' : 'Iniciar' }}
      </button>
      <button type="button" class="btn" @click="reset" :disabled="!elapsedMs && !running"><font-awesome-icon icon="fa-solid fa-rotate-left" /> Zerar</button>
      <button type="button" class="btn" @click="advance(false)"><font-awesome-icon icon="fa-solid fa-forward" /> Pular</button>
    </div>

    <details class="tool-card config">
      <summary>Ajustes</summary>
      <div class="config-grid">
        <label>Foco <span><input type="number" min="1" max="120" v-model.number="pomo.config.focus" /> min</span></label>
        <label>Pausa curta <span><input type="number" min="1" max="60" v-model.number="pomo.config.short" /> min</span></label>
        <label>Pausa longa <span><input type="number" min="1" max="60" v-model.number="pomo.config.long" /> min</span></label>
        <label>Ciclos até a longa <span><input type="number" min="2" max="8" v-model.number="pomo.config.rounds" /></span></label>
      </div>
      <label class="tool-row auto"><input type="checkbox" v-model="pomo.config.autoStart" /> Iniciar a próxima etapa automaticamente</label>
      <label class="tool-row auto"><input type="checkbox" v-model="pomo.config.titleClock" /> Mostrar contagem no título da aba</label>
    </details>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { playSound, notify, requestNotificationPermission } from '../utils/notify'
import { useAppStorage } from '../composables/useAppStorage'

const stages = {
  focus: { label: 'Foco', rgb: '255, 69, 58' },
  short: { label: 'Pausa', rgb: '48, 209, 88' },
  long: { label: 'Pausa longa', rgb: '10, 132, 255' }
}
const defaults = () => ({
  config: { focus: 25, short: 5, long: 15, rounds: 4, autoStart: true, titleClock: true },
  stage: 'focus', cycle: 1, startedAt: null, accumulated: 0, completedToday: 0, day: ''
})
const { state: pomo } = useAppStorage('pomodoro', defaults)

// Migra as chaves antigas e completa campos ausentes.
;(() => {
  const base = defaults()
  const current = pomo.value || {}
  const next = { ...base, ...current, config: { ...base.config, ...(current.config || {}) } }
  if (!stages[next.stage]) next.stage = 'focus'
  try {
    const oldConfig = JSON.parse(localStorage.getItem('dev-room-pomodoro-config'))
    if (oldConfig?.focus) Object.assign(next.config, { focus: oldConfig.focus, short: oldConfig.break || 5 })
  } catch {}
  localStorage.removeItem('dev-room-pomodoro-config')
  localStorage.removeItem('dev-room-pomodoro-state')
  pomo.value = next
})()

const phrases = ['Foque no agora!', 'Você está mais perto do seu objetivo.', 'Continue, a pausa está chegando!', 'Cada ciclo é um passo a mais.', 'Respire fundo e mantenha o ritmo.', 'Uma coisa de cada vez.']
const phrase = phrases[Math.floor(Math.random() * phrases.length)]
const now = ref(Date.now())
const stage = computed(() => stages[pomo.value.stage])
const durationMs = computed(() => Math.max(1, Number(pomo.value.config[pomo.value.stage]) || 1) * 60000)
const running = computed(() => Boolean(pomo.value.startedAt))
const elapsedMs = computed(() => pomo.value.accumulated + (pomo.value.startedAt ? now.value - pomo.value.startedAt : 0))
const remainingMs = computed(() => Math.max(0, durationMs.value - elapsedMs.value))
const progress = computed(() => Math.min(1, elapsedMs.value / durationMs.value))
const display = computed(() => {
  const total = Math.ceil(remainingMs.value / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})

const today = () => new Date().toDateString()

function toggle() {
  if (running.value) {
    pomo.value.accumulated = elapsedMs.value
    pomo.value.startedAt = null
  } else {
    requestNotificationPermission()
    now.value = Date.now()
    pomo.value.startedAt = now.value
  }
}

function reset() {
  pomo.value.startedAt = null
  pomo.value.accumulated = 0
}

function goTo(id) {
  pomo.value.stage = id
  reset()
}

// Avança para a próxima etapa; `finished` indica que o tempo acabou (conta o foco).
function advance(finished) {
  const p = pomo.value
  if (p.stage === 'focus') {
    if (finished) {
      if (p.day !== today()) { p.day = today(); p.completedToday = 0 }
      p.completedToday++
    }
    p.stage = p.cycle >= p.config.rounds ? 'long' : 'short'
  } else {
    if (p.stage === 'long') p.cycle = 1
    else p.cycle++
    p.stage = 'focus'
  }
  p.accumulated = 0
  p.startedAt = finished && p.config.autoStart ? Date.now() : null
}

watch(remainingMs, remaining => {
  if (remaining > 0 || !running.value) return
  const wasFocus = pomo.value.stage === 'focus'
  advance(true)
  playSound('/sounds/notify.mp3')
  notify(wasFocus ? 'Foco concluído! Hora da pausa.' : 'Pausa encerrada. Bora focar!', { body: `Próxima etapa: ${stage.value.label}.` })
}, { immediate: true })

// Contagem no título da aba enquanto roda.
const originalTitle = document.title
watch([display, running, () => pomo.value.config.titleClock], ([time, isRunning, enabled]) => {
  document.title = isRunning && enabled ? `${time} · ${stage.value.label} — Dev Room` : originalTitle
})

let tick = 0
let pausedByBreak = false
function pauseAll() { if (running.value) { pausedByBreak = true; toggle() } }
function resumeAll() { if (pausedByBreak && !running.value) toggle(); pausedByBreak = false }
onMounted(() => {
  if (pomo.value.day !== today()) { pomo.value.day = today(); pomo.value.completedToday = 0 }
  tick = setInterval(() => { now.value = Date.now() }, 250)
  window.addEventListener('devroom-pause-all', pauseAll)
  window.addEventListener('devroom-resume-all', resumeAll)
})
onUnmounted(() => {
  clearInterval(tick)
  document.title = originalTitle
  window.removeEventListener('devroom-pause-all', pauseAll)
  window.removeEventListener('devroom-resume-all', resumeAll)
})
</script>

<style scoped>
.display { position: relative; display: grid; place-items: center; align-self: center; width: min(240px, 78%); aspect-ratio: 1; }
.display > * { grid-area: 1 / 1; }
.dial { width: 100%; height: 100%; transform: rotate(-90deg); }
.dial circle { fill: none; stroke-width: 6; }
.dial .track { stroke: var(--surface-soft); }
.dial .bar { stroke: rgb(var(--app-accent-rgb)); stroke-linecap: round; stroke-dasharray: 339.3; transition: stroke-dashoffset .25s linear, stroke .3s; }
.center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stage-name { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgb(var(--app-accent-rgb)); }
.time { font-size: clamp(2.2rem, 12cqi, 3.2rem); font-weight: 700; letter-spacing: -.04em; }
.dots { display: flex; gap: 5px; }
.dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--surface-soft); border: 1px solid var(--glass-border); }
.dots i.on { background: rgb(var(--app-accent-rgb)); }
.motivation { text-align: center; font-style: italic; font-size: 13px; }
.actions { justify-content: center; }
.config summary { cursor: pointer; font-size: 13px; font-weight: 600; }
.config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 10px 0; font-size: 12.5px; color: var(--text-secondary); }
.config-grid label { display: flex; flex-direction: column; gap: 4px; }
.config-grid span { display: flex; align-items: center; gap: 6px; }
.config-grid input { width: 72px; }
.auto { font-size: 12.5px; gap: 6px; margin-top: 4px; cursor: pointer; }
</style>
