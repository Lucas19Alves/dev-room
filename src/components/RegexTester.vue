<template>
  <div class="tool" style="--app-accent-rgb: 255, 55, 95" id="regex-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Regex</h2>
        <p class="tool-sub">Teste expressões regulares com destaque, grupos e substituição.</p>
      </div>
      <span v-if="state.pattern" class="chip" :class="regex.error ? 'bad' : 'ok'">
        {{ regex.error ? 'Expressão inválida' : `${matches.length}${limited ? '+' : ''} ocorrência${matches.length === 1 ? '' : 's'}` }}
      </span>
    </div>

    <div class="tool-row">
      <div class="pattern tool-grow">
        <span>/</span>
        <input v-model="state.pattern" spellcheck="false" placeholder="\b\w+@\w+\.\w+\b" class="tool-mono" aria-label="Expressão" id="regex-pattern" />
        <span>/{{ state.flags }}</span>
      </div>
      <div class="seg" role="group" aria-label="Flags">
        <button v-for="flag in flagList" :key="flag.id" type="button" :class="{ on: state.flags.includes(flag.id) }" :title="flag.title" @click="toggleFlag(flag.id)">{{ flag.id }}</button>
      </div>
    </div>
    <div class="tool-row">
      <span class="tool-muted small">Modelos:</span>
      <button v-for="preset in presets" :key="preset.label" type="button" class="btn btn-sm" @click="state.pattern = preset.pattern">{{ preset.label }}</button>
    </div>
    <p v-if="regex.error" class="tool-error">{{ regex.error }}</p>

    <label>
      <span class="tool-label">Texto de teste</span>
      <textarea v-model="state.text" class="code-area wrap" rows="5" spellcheck="false" id="regex-text"></textarea>
    </label>

    <div class="tool-card">
      <span class="tool-label">Destaque</span>
      <pre class="tool-mono highlight"><template v-for="(part, i) in highlighted" :key="i"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></pre>
    </div>

    <div v-if="matches.length" class="tool-card">
      <span class="tool-label">Ocorrências</span>
      <ol class="match-list">
        <li v-for="(m, i) in matches.slice(0, 100)" :key="i">
          <span class="chip">{{ i + 1 }}</span>
          <code>{{ m[0] || '(vazio)' }}</code>
          <span class="tool-muted small">índice {{ m.index }}</span>
          <span v-for="(group, g) in m.slice(1)" :key="g" class="chip">{{ groupName(m, g + 1) }}: {{ group ?? '—' }}</span>
        </li>
      </ol>
    </div>

    <label>
      <span class="tool-label">Substituir por <span class="tool-muted">(use $1, $&lt;nome&gt;)</span></span>
      <input v-model="state.replace" class="tool-mono" spellcheck="false" id="regex-replace" />
    </label>
    <div v-if="state.replace !== '' && !regex.error && state.pattern" class="tool-card">
      <span class="tool-label">Resultado da substituição</span>
      <pre class="tool-mono highlight">{{ replaced }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'

const state = useLocalDraft('regex', {
  pattern: '(?<usuario>[\\w.+-]+)@(?<dominio>[\\w-]+\\.[\\w.]+)',
  flags: 'g',
  text: 'Fale com contato@devroom.dev ou suporte@exemplo.com.br.',
  replace: ''
})
const flagList = [
  { id: 'g', title: 'Global: todas as ocorrências' }, { id: 'i', title: 'Ignorar maiúsculas' },
  { id: 'm', title: 'Multilinha: ^ e $ por linha' }, { id: 's', title: 'Ponto inclui quebra de linha' },
  { id: 'u', title: 'Unicode' }, { id: 'y', title: 'Sticky' }
]
const presets = [
  { label: 'E-mail', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*' },
  { label: 'CPF', pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' },
  { label: 'Data', pattern: '\\b\\d{2}\\/\\d{2}\\/\\d{4}\\b' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: 'Hex', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' }
]
const MAX_MATCHES = 1000

function toggleFlag(flag) {
  const flags = state.value.flags
  state.value.flags = flags.includes(flag) ? flags.replace(flag, '') : [...flags + flag].sort((a, b) => 'gimsuy'.indexOf(a) - 'gimsuy'.indexOf(b)).join('')
}

const regex = computed(() => {
  if (!state.value.pattern) return {}
  try { return { value: new RegExp(state.value.pattern, state.value.flags) } } catch (e) { return { error: e.message } }
})

const limited = computed(() => matches.value.length >= MAX_MATCHES)
const matches = computed(() => {
  const re = regex.value.value
  if (!re) return []
  const text = state.value.text
  if (!re.global && !re.sticky) {
    const m = re.exec(text)
    return m ? [m] : []
  }
  const found = []
  const scan = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  let m
  while ((m = scan.exec(text)) && found.length < MAX_MATCHES) {
    found.push(m)
    if (m[0] === '') scan.lastIndex++
  }
  return found
})

const highlighted = computed(() => {
  const text = state.value.text
  const parts = []
  let last = 0
  for (const m of matches.value) {
    if (!m[0]) continue
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    parts.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
})

function groupName(match, index) {
  const names = match.groups ? Object.keys(match.groups) : []
  return names[index - 1] || `$${index}`
}

const replaced = computed(() => {
  try { return state.value.text.replace(regex.value.value, state.value.replace) } catch { return '' }
})
</script>

<style scoped>
.pattern { display: flex; align-items: center; gap: 4px; padding: 0 10px; border: 1px solid var(--glass-border); border-radius: var(--radius-control, 10px); background: var(--input-bg); color: var(--text-muted); font-family: ui-monospace, monospace; }
.pattern input { flex: 1; border: 0 !important; background: transparent !important; box-shadow: none !important; padding-inline: 0 !important; }
.highlight { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 200px; overflow: auto; }
.highlight mark { background: rgba(var(--app-accent-rgb), .25); color: inherit; border-radius: 3px; box-shadow: 0 0 0 1px rgba(var(--app-accent-rgb), .5); }
.match-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow: auto; font-size: 12.5px; }
.match-list li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.match-list code { font-family: ui-monospace, monospace; overflow-wrap: anywhere; }
.small { font-size: 11.5px; }
</style>
