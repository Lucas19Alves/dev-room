<template>
  <div class="tool" style="--app-accent-rgb: 100, 210, 255" id="search-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Busca</h2>
        <p class="tool-sub">Procure nas suas tarefas, notas, snippets e quadros, ou pesquise na web.</p>
      </div>
    </div>

    <div class="tool-row">
      <input ref="input" v-model="query" type="search" placeholder="O que você procura?" class="tool-grow" @keydown.enter="openWeb(engines[0])" aria-label="Buscar" id="search-input" />
    </div>

    <div class="tool-row engines">
      <button v-for="engine in engines" :key="engine.name" type="button" class="btn btn-sm" :disabled="!query.trim()" @click="openWeb(engine)" :title="`Pesquisar em ${engine.name} (nova aba)`">
        {{ engine.name }} <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" class="ext" />
      </button>
    </div>

    <div class="results">
      <p v-if="!query.trim()" class="tool-empty">Digite para buscar no seu Dev Room. Enter pesquisa no Google.</p>
      <template v-else>
        <p v-if="!results.length" class="tool-empty">Nada encontrado nos seus dados.</p>
        <section v-for="group in grouped" :key="group.source">
          <span class="tool-label">{{ group.source }} · {{ group.items.length }}</span>
          <ul class="tool-list">
            <li v-for="(item, i) in group.items.slice(0, 20)" :key="i">
              <button type="button" class="tool-item result" @click="open(item)">
                <font-awesome-icon :icon="item.icon" class="result-icon" />
                <span class="tool-grow">
                  <span class="result-title" v-html="mark(item.title)"></span>
                  <span v-if="item.detail" class="result-detail" v-html="mark(item.detail)"></span>
                </span>
                <span v-if="item.done" class="chip ok">feita</span>
              </button>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getDevRoomData } from '../utils/storage'

const input = ref(null)
const query = ref('')
const engines = [
  { name: 'Google', url: q => `https://www.google.com/search?q=${q}` },
  { name: 'MDN', url: q => `https://developer.mozilla.org/pt-BR/search?q=${q}` },
  { name: 'Stack Overflow', url: q => `https://stackoverflow.com/search?q=${q}` },
  { name: 'GitHub', url: q => `https://github.com/search?type=code&q=${q}` },
  { name: 'npm', url: q => `https://www.npmjs.com/search?q=${q}` },
  { name: 'DuckDuckGo', url: q => `https://duckduckgo.com/?q=${q}` }
]

function openWeb(engine) {
  const q = query.value.trim()
  if (q) window.open(engine.url(encodeURIComponent(q)), '_blank', 'noopener')
}

const normalize = text => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Índice montado a partir dos dados salvos de cada ferramenta.
const index = computed(() => {
  void query.value
  const data = getDevRoomData()
  const items = []
  for (const task of data.tasks || []) items.push({ source: 'Tarefas', tool: 'TodoList', icon: 'fa-solid fa-list-check', title: task.text, done: task.done })
  for (const note of data.notes || []) items.push({ source: 'Notas', tool: 'QuickNotes', icon: 'fa-solid fa-sticky-note', title: (note.text || '').split('\n')[0], detail: (note.text || '').split('\n').slice(1).join(' ') })
  for (const snippet of data.snippets || []) items.push({ source: 'Snippets', tool: 'CodeSnippets', icon: 'fa-solid fa-code', title: snippet.title, detail: `${snippet.language} · ${(snippet.code || '').slice(0, 160)}`, copy: snippet.code })
  for (const column of data['kanban-board'] || []) {
    for (const card of column.cards || []) items.push({ source: 'Kanban', tool: 'Kanban', icon: 'fa-solid fa-table-columns', title: card.title, detail: [column.title, card.description].filter(Boolean).join(' · ') })
  }
  for (const item of data.deployChecklist || []) items.push({ source: 'Checklist de deploy', tool: 'DeployChecklist', icon: 'fa-solid fa-rocket', title: item.text, done: item.done })
  return items.filter(item => item.title || item.detail)
})

const results = computed(() => {
  const terms = normalize(query.value).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return index.value.filter(item => {
    const haystack = normalize(`${item.title} ${item.detail || ''}`)
    return terms.every(term => haystack.includes(term))
  })
})

const grouped = computed(() => {
  const groups = new Map()
  for (const item of results.value) {
    if (!groups.has(item.source)) groups.set(item.source, [])
    groups.get(item.source).push(item)
  }
  return [...groups].map(([source, items]) => ({ source, items }))
})

const escapeHtml = text => String(text || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
// Destaca os termos buscados (texto escapado antes de inserir as marcações).
function mark(text) {
  let html = escapeHtml(text)
  const terms = query.value.trim().split(/\s+/).filter(t => t.length > 1).map(t => escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return html
  return html.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>')
}

function open(item) {
  window.dispatchEvent(new CustomEvent('devroom-open-tool', { detail: { type: item.tool } }))
}

onMounted(() => input.value?.focus())
</script>

<style scoped>
.engines { gap: 6px; }
.ext { font-size: 10px; opacity: .6; }
.results { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; }
.tool .result { width: 100%; text-align: left; cursor: pointer; min-height: 0 !important; padding: 8px 10px !important; font-weight: 400 !important; }
.result-icon { color: rgb(var(--app-accent-rgb)); flex: none; }
.result-title { display: block; font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.result-detail { display: block; font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.results :deep(mark) { background: rgba(var(--app-accent-rgb), .3); color: inherit; border-radius: 3px; }
</style>
