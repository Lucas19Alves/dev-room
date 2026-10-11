<template>
  <div class="tool" style="--app-accent-rgb: 255, 204, 0" id="json-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">JSON</h2>
        <p class="tool-sub">Valide, formate, minifique e gere tipos TypeScript.</p>
      </div>
      <span v-if="state.input.trim()" class="chip" :class="error ? 'bad' : 'ok'">
        {{ error ? `Erro na linha ${error.line}, coluna ${error.column}` : summary }}
      </span>
    </div>

    <div class="tool-row">
      <div class="seg" role="group" aria-label="Indentação">
        <button v-for="opt in indents" :key="opt.label" type="button" :class="{ on: state.indent === opt.value }" @click="state.indent = opt.value">{{ opt.label }}</button>
      </div>
      <button type="button" class="btn btn-primary btn-sm" :disabled="!parsed.ok" @click="format">Formatar</button>
      <button type="button" class="btn btn-sm" :disabled="!parsed.ok" @click="minify">Minificar</button>
      <button type="button" class="btn btn-sm" :disabled="!parsed.ok" @click="sortKeys">Ordenar chaves</button>
      <button type="button" class="btn btn-sm" :disabled="!parsed.ok" @click="toTypes">TypeScript</button>
      <button type="button" class="btn btn-sm" @click="state.input = sample">Exemplo</button>
    </div>

    <div class="json-grid">
      <label class="json-pane">
        <span class="tool-label">Entrada</span>
        <textarea v-model="state.input" class="code-area" spellcheck="false" placeholder='Cole seu JSON aqui, ex.: {"nome": "Dev Room"}' id="json-input"></textarea>
      </label>
      <div class="json-pane">
        <span class="tool-label json-out-head">
          Resultado
          <button type="button" class="btn btn-sm" :disabled="!output" @click="copy(output)">{{ copied ? 'Copiado!' : 'Copiar' }}</button>
          <button type="button" class="btn btn-sm" :disabled="!output" @click="state.input = output; output = ''">Usar como entrada</button>
        </span>
        <textarea :value="output" readonly class="code-area" spellcheck="false" placeholder="O resultado aparece aqui." id="json-output"></textarea>
      </div>
    </div>
    <p v-if="error" class="tool-error">{{ error.message }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { useCopy } from '../utils/clipboard'
import { sortKeysDeep, jsonErrorLocation, jsonToTypeScript } from '../utils/devtools'

const state = useLocalDraft('json', { input: '', indent: 2 })
const output = ref('')
const { copied, copy } = useCopy()
const indents = [{ label: '2', value: 2 }, { label: '4', value: 4 }, { label: 'Tab', value: '\t' }]
const sample = '{"projeto":"Dev Room","versao":2,"ativo":true,"tags":["vue","vite"],"autor":{"nome":"Lucas","github":"Lucas19Alves"}}'

const parsed = computed(() => {
  const text = state.value.input.trim()
  if (!text) return { ok: false }
  try { return { ok: true, value: JSON.parse(text) } } catch (e) { return { ok: false, error: e } }
})

const error = computed(() => {
  if (!state.value.input.trim() || parsed.value.ok) return null
  const location = jsonErrorLocation(state.value.input) || { line: 1, column: 1 }
  return { ...location, message: parsed.value.error?.message || 'JSON inválido.' }
})

const summary = computed(() => {
  const value = parsed.value.value
  if (Array.isArray(value)) return `Válido · array com ${value.length} itens`
  if (value && typeof value === 'object') return `Válido · ${Object.keys(value).length} chaves`
  return 'Válido'
})

function format() { output.value = JSON.stringify(parsed.value.value, null, state.value.indent) }
function minify() { output.value = JSON.stringify(parsed.value.value) }
function sortKeys() { output.value = JSON.stringify(sortKeysDeep(parsed.value.value), null, state.value.indent) }
function toTypes() { output.value = jsonToTypeScript(parsed.value.value) }
</script>

<style scoped>
.json-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; min-height: 0; }
.json-pane { display: flex; flex-direction: column; min-height: 220px; }
.json-pane textarea { flex: 1; resize: none; }
.json-out-head { display: flex; align-items: center; gap: 6px; }
.json-out-head .btn:first-of-type { margin-left: auto; }
</style>
