<template>
  <div class="tool" style="--app-accent-rgb: 52, 199, 89" id="diff-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Diff</h2>
        <p class="tool-sub">Compare dois textos linha a linha.</p>
      </div>
      <div class="tool-row">
        <span class="chip ok">+{{ stats.add }}</span>
        <span class="chip bad">−{{ stats.del }}</span>
      </div>
    </div>

    <div class="tool-row">
      <label class="tool-row check"><input type="checkbox" v-model="state.ignoreWhitespace" /> Ignorar espaços</label>
      <label class="tool-row check"><input type="checkbox" v-model="state.onlyChanges" /> Só alterações</label>
      <button type="button" class="btn btn-sm" @click="swap">Trocar lados</button>
      <button type="button" class="btn btn-sm" @click="state.before = ''; state.after = ''">Limpar</button>
    </div>

    <div class="diff-inputs">
      <label><span class="tool-label">Original</span><textarea v-model="state.before" class="code-area" rows="7" spellcheck="false" id="diff-before"></textarea></label>
      <label><span class="tool-label">Modificado</span><textarea v-model="state.after" class="code-area" rows="7" spellcheck="false" id="diff-after"></textarea></label>
    </div>

    <p v-if="result.error" class="tool-error">{{ result.error }}</p>
    <div v-else class="tool-card diff-out">
      <p v-if="!stats.add && !stats.del" class="tool-empty">{{ state.before || state.after ? 'Os textos são iguais.' : 'Cole os textos para comparar.' }}</p>
      <table v-else class="tool-mono">
        <tbody>
          <tr v-for="(line, i) in visible" :key="i" :class="line.type">
            <td class="num">{{ line.gap ? '' : line.a ?? '' }}</td>
            <td class="num">{{ line.gap ? '' : line.b ?? '' }}</td>
            <td class="sign">{{ line.gap ? '' : line.type === 'add' ? '+' : line.type === 'del' ? '−' : '' }}</td>
            <td class="text">{{ line.gap ? `··· ${line.gap} linhas iguais ···` : line.text }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { diffLines } from '../utils/devtools'

const state = useLocalDraft('diff', {
  before: 'const nome = "Dev Room"\nconsole.log(nome)\nexport default nome',
  after: 'const nome = "Dev Room 2"\nconsole.log(nome)\nconsole.log("pronto")\nexport default nome',
  ignoreWhitespace: false,
  onlyChanges: false
})

function swap() {
  const { before, after } = state.value
  state.value.before = after
  state.value.after = before
}

const result = computed(() => {
  try { return { lines: diffLines(state.value.before, state.value.after, { ignoreWhitespace: state.value.ignoreWhitespace }) } } catch (e) { return { error: e.message, lines: [] } }
})
const stats = computed(() => ({
  add: result.value.lines.filter(l => l.type === 'add').length,
  del: result.value.lines.filter(l => l.type === 'del').length
}))

// Recolhe trechos iguais longos, mantendo 2 linhas de contexto.
const visible = computed(() => {
  const lines = result.value.lines
  if (!state.value.onlyChanges) return lines
  const keep = new Set()
  lines.forEach((line, i) => { if (line.type !== 'same') for (let k = i - 2; k <= i + 2; k++) keep.add(k) })
  const out = []
  let skipped = 0
  lines.forEach((line, i) => {
    if (keep.has(i)) {
      if (skipped) out.push({ gap: skipped, type: 'gap' })
      skipped = 0
      out.push(line)
    } else skipped++
  })
  if (skipped) out.push({ gap: skipped, type: 'gap' })
  return out
})
</script>

<style scoped>
.check { gap: 6px; font-size: 12.5px; cursor: pointer; }
.diff-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.diff-out { padding: 0; overflow: auto; max-height: 420px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 1px 6px; vertical-align: top; }
.num { width: 1%; text-align: right; color: var(--text-muted); user-select: none; white-space: nowrap; }
.sign { width: 1%; user-select: none; font-weight: 700; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
tr.add { background: rgba(48, 209, 88, .14); }
tr.add .sign { color: #30d158; }
tr.del { background: rgba(255, 95, 87, .14); }
tr.del .sign { color: #ff5f57; }
tr.gap td { color: var(--text-muted); text-align: center; font-style: italic; background: var(--surface-soft); }
</style>
