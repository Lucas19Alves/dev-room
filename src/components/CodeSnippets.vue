<template>
  <div class="tool" style="--app-accent-rgb: 191, 90, 242" id="codesnippets-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Snippets de Código</h2>
        <p class="tool-sub">{{ snippets.length }} snippet{{ snippets.length === 1 ? '' : 's' }} salvos</p>
      </div>
      <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !formOpen }" @click="formOpen ? closeForm() : openForm()">
        <font-awesome-icon :icon="formOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-plus'" /> {{ formOpen ? 'Fechar' : 'Novo snippet' }}
      </button>
    </div>

    <div v-if="formOpen" class="tool-card form">
      <div class="tool-row">
        <input v-model="draft.title" placeholder="Título" class="tool-grow" id="codesnippets-input-title" />
        <select v-model="draft.language" aria-label="Linguagem" id="codesnippets-select-language">
          <option v-for="lang in languages" :key="lang.id" :value="lang.id">{{ lang.label }}</option>
        </select>
      </div>
      <textarea v-model="draft.code" class="code-area" rows="7" spellcheck="false" placeholder="Cole ou digite seu código…" @keydown.tab.prevent="insertTab" id="codesnippets-input-code"></textarea>
      <div class="tool-row">
        <span v-if="formError" class="tool-error">{{ formError }}</span>
        <span class="tool-grow"></span>
        <button type="button" class="btn btn-primary btn-sm" @click="saveDraft" id="codesnippets-add-btn">{{ editingId ? 'Salvar alterações' : 'Adicionar' }}</button>
      </div>
    </div>

    <div class="tool-row">
      <input v-model="search" type="search" placeholder="Buscar por título, linguagem ou código…" class="tool-grow" id="codesnippets-search" />
      <select v-model="languageFilter" aria-label="Filtrar linguagem" class="lang-filter">
        <option value="">Todas</option>
        <option v-for="lang in usedLanguages" :key="lang" :value="lang">{{ labelOf(lang) }}</option>
      </select>
    </div>

    <div class="tool-list list" id="codesnippets-list">
      <article v-for="snippet in filteredSnippets" :key="snippet.id" class="snippet">
        <header class="snippet-head">
          <strong class="tool-grow title">{{ snippet.title }}</strong>
          <span class="chip">{{ labelOf(snippet.language) }}</span>
          <button type="button" class="icon-btn" @click="copy(snippet.code, snippet.id)" :title="copied === snippet.id ? 'Copiado!' : 'Copiar código'"><font-awesome-icon :icon="copied === snippet.id ? 'fa-solid fa-check' : 'fa-solid fa-copy'" /></button>
          <button type="button" class="icon-btn" @click="openForm(snippet)" title="Editar"><font-awesome-icon icon="fa-solid fa-pen" /></button>
          <button type="button" class="icon-btn danger" @click="removeSnippet(snippet)" title="Remover"><font-awesome-icon icon="fa-solid fa-trash" /></button>
        </header>
        <pre class="code" :class="{ collapsed: isLong(snippet) && !expanded[snippet.id] }"><code class="hljs" v-html="highlight(snippet.code, snippet.language)"></code></pre>
        <button v-if="isLong(snippet)" type="button" class="btn btn-sm more" @click="expanded[snippet.id] = !expanded[snippet.id]">{{ expanded[snippet.id] ? 'Mostrar menos' : `Mostrar tudo (${lineCount(snippet)} linhas)` }}</button>
      </article>
      <p v-if="!filteredSnippets.length" class="tool-empty">{{ snippets.length ? 'Nenhum snippet encontrado.' : 'Guarde aqui os trechos que você sempre procura.' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import csharp from 'highlight.js/lib/languages/csharp'
import yaml from 'highlight.js/lib/languages/yaml'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import 'highlight.js/styles/github-dark.css'
import { useAppStorage } from '../composables/useAppStorage'
import { useCopy } from '../utils/clipboard'

const languageDefs = { javascript, typescript, python, bash, json, xml, css, sql, markdown, java, go, rust, php, csharp, yaml, dockerfile }
for (const [name, def] of Object.entries(languageDefs)) hljs.registerLanguage(name, def)
const languages = [
  { id: 'javascript', label: 'JavaScript' }, { id: 'typescript', label: 'TypeScript' }, { id: 'python', label: 'Python' },
  { id: 'bash', label: 'Shell' }, { id: 'json', label: 'JSON' }, { id: 'xml', label: 'HTML/XML' }, { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' }, { id: 'markdown', label: 'Markdown' }, { id: 'java', label: 'Java' }, { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' }, { id: 'php', label: 'PHP' }, { id: 'csharp', label: 'C#' }, { id: 'yaml', label: 'YAML' },
  { id: 'dockerfile', label: 'Dockerfile' }, { id: 'plaintext', label: 'Texto' }
]
const labelOf = id => languages.find(l => l.id === id)?.label || id

const { state: snippets } = useAppStorage('snippets', [])
const { copied, copy } = useCopy()
const search = ref('')
const languageFilter = ref('')
const formOpen = ref(false)
const editingId = ref(null)
const formError = ref('')
const draft = reactive({ title: '', language: 'javascript', code: '' })
const expanded = reactive({})

const usedLanguages = computed(() => [...new Set(snippets.value.map(s => s.language))])
const filteredSnippets = computed(() => {
  const q = search.value.trim().toLowerCase()
  return [...snippets.value].reverse().filter(s =>
    (!languageFilter.value || s.language === languageFilter.value) &&
    (!q || `${s.title} ${labelOf(s.language)} ${s.code}`.toLowerCase().includes(q)))
})

const lineCount = s => (s.code || '').split('\n').length
const isLong = s => lineCount(s) > 14

function openForm(snippet = null) {
  editingId.value = snippet?.id ?? null
  Object.assign(draft, snippet ? { title: snippet.title, language: snippet.language, code: snippet.code } : { title: '', language: draft.language || 'javascript', code: '' })
  formError.value = ''
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
}

function saveDraft() {
  if (!draft.title.trim() || !draft.code.trim()) { formError.value = 'Preencha título e código.'; return }
  const data = { title: draft.title.trim(), language: draft.language, code: draft.code.replace(/\s+$/, '') }
  if (editingId.value) {
    const index = snippets.value.findIndex(s => s.id === editingId.value)
    if (index !== -1) snippets.value[index] = { ...snippets.value[index], ...data }
  } else {
    snippets.value.push({ id: Date.now() + Math.random(), ...data })
  }
  closeForm()
}

function removeSnippet(snippet) {
  if (!confirm(`Remover o snippet "${snippet.title}"?`)) return
  snippets.value = snippets.value.filter(s => s.id !== snippet.id)
}

function insertTab(event) {
  const el = event.target
  const { selectionStart: start, selectionEnd: end } = el
  draft.code = `${draft.code.slice(0, start)}  ${draft.code.slice(end)}`
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2 })
}

const escapeHtml = text => text.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])
function highlight(code, lang) {
  try {
    if (hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
  } catch {}
  return escapeHtml(code || '')
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 8px; }
.lang-filter { width: 130px; }
.list { flex: 1; gap: 10px; }
.snippet { border: 1px solid var(--glass-border); border-radius: 14px; background: var(--bg-panel-secondary); padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.snippet-head { display: flex; align-items: center; gap: 4px; }
.title { overflow-wrap: anywhere; font-size: 14px; }
.code { margin: 0; border-radius: 10px; background: #0d1117; overflow: auto; font-size: 12.5px; line-height: 1.5; max-height: 420px; }
.code code { display: block; padding: 10px 12px; background: transparent; white-space: pre; }
.code.collapsed { max-height: 230px; overflow: hidden; -webkit-mask-image: linear-gradient(#000 70%, transparent); mask-image: linear-gradient(#000 70%, transparent); }
.more { align-self: center; }
</style>
