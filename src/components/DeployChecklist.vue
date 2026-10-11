<template>
  <div class="tool" style="--app-accent-rgb: 52, 199, 89" id="deploy-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Checklist de Deploy</h2>
        <p class="tool-sub">{{ doneCount }}/{{ checklist.length }} concluídos{{ allDone ? ' — pronto para publicar! 🚀' : '' }}</p>
      </div>
      <div class="seg" role="group" aria-label="Filtro">
        <button v-for="f in filters" :key="f.id" type="button" :class="{ on: filter === f.id }" @click="filter = f.id">{{ f.label }}</button>
      </div>
    </div>

    <div class="progress"><span :style="{ width: `${progress}%` }"></span></div>

    <div class="tool-row">
      <input v-model="newItem" type="text" autocomplete="off" placeholder="Adicionar item… (Enter)" class="tool-grow" @keydown.enter="addItem" id="deploy-input" />
      <button type="button" class="btn btn-primary" :disabled="!newItem.trim()" @click="addItem" id="deploy-add-btn"><font-awesome-icon icon="fa-solid fa-plus" /></button>
    </div>

    <draggable v-model="checklist" item-key="id" tag="ul" class="tool-list" handle=".handle" :disabled="filter !== 'all'" id="deploy-list">
      <template #item="{ element: item }">
        <li v-show="matches(item)" class="tool-item" :class="{ done: item.done }">
          <span v-if="filter === 'all'" class="handle" title="Arraste para reordenar">⋮⋮</span>
          <input type="checkbox" v-model="item.done" :aria-label="item.text" />
          <input v-if="editingId === item.id" v-model="editText" class="tool-grow edit" @keydown.enter="saveEdit(item)" @keydown.esc="editingId = null" @blur="saveEdit(item)" :id="`deploy-edit-${item.id}`" />
          <span v-else class="tool-grow text" @dblclick="startEdit(item)">{{ item.text }}</span>
          <button type="button" class="icon-btn" @click="startEdit(item)" title="Editar"><font-awesome-icon icon="fa-solid fa-pen" /></button>
          <button type="button" class="icon-btn danger" @click="removeItem(item.id)" title="Remover"><font-awesome-icon icon="fa-solid fa-trash" /></button>
        </li>
      </template>
      <template #footer>
        <li v-if="!checklist.some(matches)" class="tool-empty">Nenhum item aqui.</li>
      </template>
    </draggable>

    <div class="tool-row footer">
      <button type="button" class="btn btn-sm" @click="resetChecklist" :disabled="!doneCount" id="deploy-reset-btn"><font-awesome-icon icon="fa-solid fa-rotate-left" /> Desmarcar tudo</button>
      <select v-model="template" class="template" aria-label="Carregar modelo" @change="loadTemplate">
        <option value="">Carregar modelo…</option>
        <option v-for="(items, name) in templates" :key="name" :value="name">{{ name }}</option>
      </select>
      <button type="button" class="btn btn-sm" @click="exportChecklist" :disabled="!checklist.length" title="Exportar JSON"><font-awesome-icon icon="fa-solid fa-download" /></button>
      <label class="btn btn-sm" title="Importar JSON"><font-awesome-icon icon="fa-solid fa-upload" /><input type="file" accept=".json,application/json" class="hidden" @change="importChecklist" /></label>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { useAppStorage } from '../composables/useAppStorage'
import { toast } from '../utils/notify'

const { state: checklist } = useAppStorage('deployChecklist', [])
const newItem = ref('')
const editingId = ref(null)
const editText = ref('')
const filter = ref('all')
const template = ref('')
const filters = [{ id: 'all', label: 'Todos' }, { id: 'open', label: 'Pendentes' }, { id: 'done', label: 'Feitos' }]
const newId = () => Date.now() + Math.random()

const templates = {
  'Geral': ['Testes automatizados passaram', 'Variáveis de ambiente revisadas', 'Build gerado em modo produção', 'Backup realizado', 'Documentação atualizada', 'Time avisado'],
  'Frontend': ['Lint e testes passaram', 'Build sem avisos', 'Lighthouse revisado (performance e acessibilidade)', 'Testado em mobile e desktop', 'Meta tags e favicon conferidos', 'Variáveis públicas sem segredos', 'Cache/CDN invalidado'],
  'Backend / API': ['Testes e cobertura ok', 'Migrações de banco revisadas', 'Backup do banco feito', 'Segredos no cofre, não no código', 'Logs e alertas configurados', 'Plano de rollback definido', 'Health check respondendo'],
  'Release mobile': ['Versão e build incrementados', 'Changelog escrito', 'Testado em Android e iOS', 'Screenshots da loja atualizadas', 'Crash reporting ativo', 'Envio para revisão da loja']
}

const doneCount = computed(() => checklist.value.filter(i => i.done).length)
const progress = computed(() => checklist.value.length ? Math.round(doneCount.value / checklist.value.length * 100) : 0)
const allDone = computed(() => checklist.value.length > 0 && doneCount.value === checklist.value.length)
const matches = item => filter.value === 'all' || (filter.value === 'done' ? item.done : !item.done)

function addItem() {
  const text = newItem.value.trim()
  if (!text) return
  checklist.value.push({ id: newId(), text, done: false })
  newItem.value = ''
}

function removeItem(id) {
  checklist.value = checklist.value.filter(i => i.id !== id)
}

function resetChecklist() {
  checklist.value.forEach(item => { item.done = false })
}

function loadTemplate() {
  const items = templates[template.value]
  template.value = ''
  if (!items) return
  if (checklist.value.length && !confirm('Substituir a checklist atual pelo modelo?')) return
  checklist.value = items.map(text => ({ id: newId(), text, done: false }))
}

function startEdit(item) {
  editingId.value = item.id
  editText.value = item.text
  nextTick(() => document.getElementById(`deploy-edit-${item.id}`)?.focus())
}

function saveEdit(item) {
  if (editingId.value !== item.id) return
  if (editText.value.trim()) item.text = editText.value.trim()
  editingId.value = null
}

function exportChecklist() {
  const blob = new Blob([JSON.stringify(checklist.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: 'deploy-checklist.json' })
  a.click()
  URL.revokeObjectURL(url)
}

function importChecklist(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  file.text().then(text => {
    const imported = JSON.parse(text)
    if (!Array.isArray(imported) || !imported.every(i => typeof i?.text === 'string')) throw new Error()
    const seen = new Set()
    checklist.value = imported.map(item => {
      let id = item.id ?? newId()
      if (seen.has(id)) id = newId()
      seen.add(id)
      return { id, text: item.text, done: Boolean(item.done) }
    })
    toast(`${checklist.value.length} itens importados.`)
  }).catch(() => toast('Arquivo inválido. Use um JSON exportado pela checklist.', 'error'))
}

let celebrated = allDone.value
watch(allDone, done => {
  if (done && !celebrated) toast('Checklist completa — bom deploy! 🚀')
  celebrated = done
})
</script>

<style scoped>
.tool-list { flex: 1; }
.handle { cursor: grab; color: var(--text-muted); letter-spacing: -2px; user-select: none; }
.text { overflow-wrap: anywhere; font-size: 14px; }
.done .text { text-decoration: line-through; color: var(--text-muted); }
.edit { min-height: 30px !important; }
.footer { gap: 6px; }
.template { flex: 1; min-width: 140px; min-height: 30px !important; font-size: 12.5px; }
.hidden { display: none; }
</style>
