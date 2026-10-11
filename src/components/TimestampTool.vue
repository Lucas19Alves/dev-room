<template>
  <div class="tool" style="--app-accent-rgb: 90, 200, 250" id="timestamp-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Timestamp</h2>
        <p class="tool-sub">Converta Unix ↔ data e veja fusos horários.</p>
      </div>
    </div>

    <div class="tool-card now">
      <div>
        <span class="tool-label">Agora (segundos)</span>
        <button type="button" class="big tool-mono" @click="copy(nowSeconds, 'now')" title="Copiar">{{ copied === 'now' ? 'Copiado!' : nowSeconds }}</button>
      </div>
      <div>
        <span class="tool-label">Agora (ms)</span>
        <button type="button" class="big tool-mono" @click="copy(now, 'nowms')" title="Copiar">{{ copied === 'nowms' ? 'Copiado!' : now }}</button>
      </div>
    </div>

    <div class="tool-row">
      <input v-model="state.input" class="tool-mono tool-grow" spellcheck="false" placeholder="1700000000, 1700000000000 ou 2024-05-01T12:00:00Z" aria-label="Timestamp ou data" id="timestamp-input" />
      <button type="button" class="btn btn-sm" @click="state.input = String(nowSeconds)">Agora</button>
    </div>
    <div class="tool-row">
      <span class="tool-label pick">ou escolha:</span>
      <input type="datetime-local" step="1" :value="localInput" @input="fromPicker" aria-label="Data e hora" class="tool-grow" />
    </div>

    <p v-if="state.input && !parsed" class="tool-error">Não reconheci esse valor como data ou timestamp.</p>
    <div v-if="parsed" class="tool-card">
      <div class="tool-row"><span class="chip">Detectado: {{ unitLabel }}</span><span class="chip">{{ relative }}</span></div>
      <dl class="kv rows">
        <template v-for="row in rows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
          <button type="button" class="btn btn-sm" @click="copy(row.value, row.label)">{{ copied === row.label ? 'Copiado!' : 'Copiar' }}</button>
        </template>
      </dl>
    </div>

    <div v-if="parsed" class="tool-card">
      <span class="tool-label">Fusos horários</span>
      <dl class="kv zones">
        <template v-for="zone in zones" :key="zone.id">
          <dt>{{ zone.label }}</dt>
          <dd>{{ formatIn(zone.id) }}</dd>
          <span></span>
        </template>
      </dl>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { useCopy } from '../utils/clipboard'
import { parseTimestamp, relativeTime } from '../utils/devtools'

const state = useLocalDraft('timestamp', { input: '' })
const { copied, copy } = useCopy()
const now = ref(Date.now())
const nowSeconds = computed(() => Math.floor(now.value / 1000))
let clock = 0
onMounted(() => { clock = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(clock))

const parsed = computed(() => parseTimestamp(state.value.input))
const unitLabel = computed(() => ({ s: 'segundos', ms: 'milissegundos', texto: 'data em texto' })[parsed.value?.unit])
const relative = computed(() => parsed.value ? relativeTime(parsed.value.date, now.value) : '')
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const rows = computed(() => {
  const date = parsed.value.date
  return [
    { label: 'Unix (s)', value: String(Math.floor(date.getTime() / 1000)) },
    { label: 'Unix (ms)', value: String(date.getTime()) },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: 'Local', value: date.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' }) },
    { label: 'UTC', value: date.toUTCString() }
  ]
})

const zones = [
  { id: localZone, label: `Local (${localZone})` },
  { id: 'UTC', label: 'UTC' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'America/New_York', label: 'Nova York' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'Europe/Lisbon', label: 'Lisboa' },
  { id: 'Europe/Berlin', label: 'Berlim' },
  { id: 'Asia/Tokyo', label: 'Tóquio' }
].filter((zone, i, list) => list.findIndex(z => z.id === zone.id) === i)

function formatIn(timeZone) {
  try {
    return parsed.value.date.toLocaleString('pt-BR', { timeZone, dateStyle: 'short', timeStyle: 'medium' })
  } catch { return '—' }
}

const localInput = computed(() => {
  const date = parsed.value?.date
  if (!date) return ''
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return shifted.toISOString().slice(0, 19)
})

function fromPicker(event) {
  const date = new Date(event.target.value)
  if (!Number.isNaN(date.getTime())) state.value.input = String(Math.floor(date.getTime() / 1000))
}
</script>

<style scoped>
.now { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.tool .big { min-height: 0 !important; padding: 0 !important; background: transparent; border: 0; font-size: 20px !important; font-weight: 700 !important; color: var(--text-main); cursor: copy; }
.pick { margin: 0; }
.rows { margin-top: 8px; }
.zones dd { font-size: 12.5px; }
</style>
