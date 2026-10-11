<template>
  <div class="tool" style="--app-accent-rgb: 175, 82, 222" id="encoder-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Codificador</h2>
        <p class="tool-sub">Base64, URL, HTML, JWT e hashes, tudo local no navegador.</p>
      </div>
    </div>

    <div class="tool-row">
      <div class="seg" role="group" aria-label="Formato">
        <button v-for="m in modes" :key="m.id" type="button" :class="{ on: state.mode === m.id }" @click="state.mode = m.id">{{ m.label }}</button>
      </div>
      <div v-if="hasDirection" class="seg" role="group" aria-label="Direção">
        <button type="button" :class="{ on: state.direction === 'encode' }" @click="state.direction = 'encode'">Codificar</button>
        <button type="button" :class="{ on: state.direction === 'decode' }" @click="state.direction = 'decode'">Decodificar</button>
      </div>
    </div>

    <label>
      <span class="tool-label">{{ state.mode === 'jwt' ? 'Token JWT' : 'Entrada' }}</span>
      <textarea v-model="state.input" class="code-area wrap" rows="5" spellcheck="false" :placeholder="placeholder" id="encoder-input"></textarea>
    </label>

    <!-- Conversões de texto -->
    <div v-if="hasDirection" class="tool-card">
      <div class="out-head">
        <span class="tool-label">Resultado</span>
        <button type="button" class="btn btn-sm" :disabled="!result.text" @click="state.input = result.text; flip()">Inverter</button>
        <button type="button" class="btn btn-sm" :disabled="!result.text" @click="copy(result.text, 'out')">{{ copied === 'out' ? 'Copiado!' : 'Copiar' }}</button>
      </div>
      <p v-if="result.error" class="tool-error">{{ result.error }}</p>
      <pre v-else class="tool-mono out">{{ result.text || '—' }}</pre>
    </div>

    <!-- JWT -->
    <template v-else-if="state.mode === 'jwt'">
      <p v-if="jwt.error" class="tool-error">{{ jwt.error }}</p>
      <template v-else-if="jwt.value">
        <div class="tool-row">
          <span v-if="jwt.value.expired !== null" class="chip" :class="jwt.value.expired ? 'bad' : 'ok'">{{ jwt.value.expired ? 'Expirado' : 'Válido no tempo' }}</span>
          <span class="chip">alg: {{ jwt.value.header.alg || '?' }}</span>
          <span v-for="(date, key) in jwt.value.claims" :key="key" class="chip">{{ claimLabels[key] }}: {{ date.toLocaleString('pt-BR') }}</span>
        </div>
        <div class="jwt-grid">
          <div class="tool-card">
            <span class="tool-label">Cabeçalho</span>
            <pre class="tool-mono out">{{ JSON.stringify(jwt.value.header, null, 2) }}</pre>
          </div>
          <div class="tool-card">
            <div class="out-head">
              <span class="tool-label">Conteúdo</span>
              <button type="button" class="btn btn-sm" @click="copy(JSON.stringify(jwt.value.payload, null, 2), 'jwt')">{{ copied === 'jwt' ? 'Copiado!' : 'Copiar' }}</button>
            </div>
            <pre class="tool-mono out">{{ JSON.stringify(jwt.value.payload, null, 2) }}</pre>
          </div>
        </div>
        <p class="tool-muted small">A assinatura não é verificada; o token não sai do navegador.</p>
      </template>
    </template>

    <!-- Hash -->
    <div v-else class="tool-card">
      <dl class="kv">
        <template v-for="algo in hashAlgorithms" :key="algo">
          <dt>{{ algo }}</dt>
          <dd>{{ hashes[algo] || '—' }}</dd>
          <button type="button" class="btn btn-sm" :disabled="!hashes[algo]" @click="copy(hashes[algo], algo)">{{ copied === algo ? 'Copiado!' : 'Copiar' }}</button>
        </template>
      </dl>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { useCopy } from '../utils/clipboard'
import { utf8ToBase64, base64ToUtf8, encodeHtml, decodeHtml, decodeJwt, digest } from '../utils/devtools'

const state = useLocalDraft('encoder', { mode: 'base64', direction: 'encode', input: '' })
const { copied, copy } = useCopy()
const modes = [
  { id: 'base64', label: 'Base64' }, { id: 'base64url', label: 'Base64URL' }, { id: 'url', label: 'URL' },
  { id: 'html', label: 'HTML' }, { id: 'jwt', label: 'JWT' }, { id: 'hash', label: 'Hash' }
]
const hashAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
const claimLabels = { iat: 'Emitido', nbf: 'Válido a partir de', exp: 'Expira' }
const hasDirection = computed(() => ['base64', 'base64url', 'url', 'html'].includes(state.value.mode))
const placeholder = computed(() => state.value.mode === 'jwt' ? 'eyJhbGciOi...' : 'Digite ou cole o texto')

function flip() { state.value.direction = state.value.direction === 'encode' ? 'decode' : 'encode' }

const result = computed(() => {
  const { mode, direction, input } = state.value
  if (!input) return { text: '' }
  try {
    const encode = direction === 'encode'
    if (mode === 'base64') return { text: encode ? utf8ToBase64(input) : base64ToUtf8(input) }
    if (mode === 'base64url') return { text: encode ? utf8ToBase64(input, true) : base64ToUtf8(input) }
    if (mode === 'url') return { text: encode ? encodeURIComponent(input) : decodeURIComponent(input.replace(/\+/g, ' ')) }
    if (mode === 'html') return { text: encode ? encodeHtml(input) : decodeHtml(input) }
  } catch {
    return { error: 'Entrada inválida para decodificar neste formato.' }
  }
  return { text: '' }
})

const jwt = computed(() => {
  if (state.value.mode !== 'jwt' || !state.value.input.trim()) return {}
  try { return { value: decodeJwt(state.value.input) } } catch (e) { return { error: e.message } }
})

const hashes = reactive({})
let hashRun = 0
watch(() => [state.value.mode, state.value.input], async ([mode, input]) => {
  if (mode !== 'hash') return
  const run = ++hashRun
  const entries = input ? await Promise.all(hashAlgorithms.map(async algo => [algo, await digest(algo, input)])) : hashAlgorithms.map(algo => [algo, ''])
  if (run === hashRun) Object.assign(hashes, Object.fromEntries(entries))
}, { immediate: true })
</script>

<style scoped>
.out-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.out-head .tool-label { margin: 0 auto 0 0; }
.out { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 260px; overflow: auto; margin: 0; }
.jwt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.small { font-size: 11.5px; }
</style>
