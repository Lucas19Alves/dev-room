<template>
  <!-- Container principal dos snippets -->
  <div class="flex flex-col w-full h-full p-4" id="codesnippets-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-fuchsia-400" id="codesnippets-title">Snippets de Código</h2>
    <!-- Formulário para adicionar novo snippet -->
    <form @submit.prevent="addSnippet" class="flex flex-col sm:flex-row gap-2 mb-4" id="codesnippets-form">
      <input
        v-model="newSnippet.title"
        type="text"
        placeholder="Título"
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        required
        id="codesnippets-input-title"
      />
      <select
        v-model="newSnippet.language"
        class="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        required
        id="codesnippets-select-language"
      >
        <option disabled value="">Linguagem</option>
        <option v-for="lang in languages" :key="lang" :value="lang" :id="`codesnippets-option-${lang}`">{{ lang }}</option>
      </select>
      <button
        type="submit"
        class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded transition"
        id="codesnippets-add-btn"
      >
        Adicionar
      </button>
    </form>
    <!-- Área para digitar o código do novo snippet -->
    <textarea
      v-model="newSnippet.code"
      placeholder="Cole ou digite seu código aqui..."
      class="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none font-mono"
      rows="3"
      required
      id="codesnippets-input-code"
    ></textarea>
    <!-- Campo de busca -->
    <input
      v-model="search"
      type="text"
      placeholder="Buscar por título ou linguagem..."
      class="mb-4 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
      id="codesnippets-search"
    />
    <!-- Lista de snippets -->
    <div class="overflow-y-auto flex-1 w-full min-h-[40px]" id="codesnippets-list">
      <div
        v-for="(snippet, idx) in filteredSnippets"
        :key="snippet.id"
        class="mb-4 p-4 rounded-lg shadow bg-gray-800 border border-fuchsia-900 relative codesnippets-item"
        :id="`codesnippets-item-${snippet.id}`"
      >
        <div class="flex justify-between items-center mb-2" :id="`codesnippets-header-${snippet.id}`">
          <div>
            <span class="font-bold text-fuchsia-300" :id="`codesnippets-title-${snippet.id}`">{{ snippet.title }}</span>
            <span class="ml-2 px-2 py-1 rounded text-xs bg-fuchsia-900 text-fuchsia-200" :id="`codesnippets-language-${snippet.id}`">{{ snippet.language }}</span>
          </div>
          <div class="flex gap-2" :id="`codesnippets-actions-${snippet.id}`">
            <button
              @click="copyCode(snippet.code)"
              class="text-green-400 hover:text-green-200 transition codesnippets-copy-btn"
              title="Copiar código"
              :id="`codesnippets-copy-btn-${snippet.id}`"
            >
              <font-awesome-icon icon="fa-solid fa-copy" />
            </button>
            <button
              @click="editSnippet(idx)"
              class="text-yellow-400 hover:text-yellow-200 transition codesnippets-edit-btn"
              title="Editar"
              :id="`codesnippets-edit-btn-${snippet.id}`"
            >
              <font-awesome-icon icon="fa-solid fa-pen" />
            </button>
            <button
              @click="removeSnippet(idx)"
              class="text-red-400 hover:text-red-600 transition codesnippets-remove-btn"
              title="Remover"
              :id="`codesnippets-remove-btn-${snippet.id}`"
            >
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </div>
        <!-- Exibição do código com highlight -->
        <pre class="rounded bg-gray-900 p-3 overflow-x-auto codesnippets-code" :id="`codesnippets-code-${snippet.id}`">
          <code :class="`language-${snippet.language}`" v-html="highlight(snippet.code, snippet.language)"></code>
        </pre>
      </div>
      <!-- Mensagem caso não haja snippets -->
      <div v-if="filteredSnippets.length === 0" class="text-gray-400 text-center mt-8" id="codesnippets-empty">
        Nenhum snippet encontrado.
      </div>
    </div>
    <!-- Modal de edição de snippet -->
    <div v-if="editingIdx !== null" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" id="codesnippets-edit-modal">
      <div class="bg-gray-900 border border-fuchsia-700 rounded-lg p-6 w-full max-w-lg" id="codesnippets-edit-modal-content">
        <h3 class="text-lg font-bold mb-4 text-fuchsia-300" id="codesnippets-edit-title">Editar Snippet</h3>
        <input
          v-model="editSnippetData.title"
          type="text"
          placeholder="Título"
          class="w-full mb-2 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
          id="codesnippets-edit-input-title"
        />
        <select
          v-model="editSnippetData.language"
          class="w-full mb-2 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
          id="codesnippets-edit-select-language"
        >
          <option disabled value="">Linguagem</option>
          <option v-for="lang in languages" :key="lang" :value="lang" :id="`codesnippets-edit-option-${lang}`">{{ lang }}</option>
        </select>
        <textarea
          v-model="editSnippetData.code"
          class="w-full mb-2 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none font-mono"
          rows="5"
          id="codesnippets-edit-input-code"
        ></textarea>
        <div class="flex gap-2 justify-end" id="codesnippets-edit-actions">
          <button @click="saveEdit" class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded" id="codesnippets-edit-save-btn">Salvar</button>
          <button @click="cancelEdit" class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded" id="codesnippets-edit-cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Importações e estados reativos principais
import { ref, computed, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import java from 'highlight.js/lib/languages/java' // Importa Java
import 'highlight.js/styles/github-dark.css'

// Registra as linguagens suportadas
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('java', java) // Registra Java

const STORAGE_KEY = 'dev-room-snippets'
const languages = [
  'javascript', 'python', 'bash', 'json', 'xml', 'css', 'sql', 'markdown', 'java' // Adiciona Java
]

const newSnippet = ref({ title: '', language: '', code: '' })
const snippets = ref([])
const search = ref('')

const editingIdx = ref(null)
const editSnippetData = ref({ title: '', language: '', code: '' })

// Carrega snippets do localStorage ao iniciar
function loadSnippets() {
  const saved = localStorage.getItem(STORAGE_KEY)
  snippets.value = saved ? JSON.parse(saved) : []
}

// Salva snippets no localStorage
function saveSnippets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets.value))
}

// Adiciona novo snippet
function addSnippet() {
  if (
    !newSnippet.value.title.trim() ||
    !newSnippet.value.language ||
    !newSnippet.value.code.trim()
  ) return
  snippets.value.push({
    id: Date.now() + Math.random(),
    title: newSnippet.value.title.trim(),
    language: newSnippet.value.language,
    code: newSnippet.value.code
  })
  newSnippet.value = { title: '', language: '', code: '' }
  saveSnippets()
}

// Remove snippet pelo índice
function removeSnippet(idx) {
  snippets.value.splice(idx, 1)
  saveSnippets()
}

// Edita snippet pelo índice
function editSnippet(idx) {
  editingIdx.value = idx
  editSnippetData.value = { ...snippets.value[idx] }
}

// Salva edição do snippet
function saveEdit() {
  if (
    !editSnippetData.value.title.trim() ||
    !editSnippetData.value.language ||
    !editSnippetData.value.code.trim()
  ) return
  snippets.value[editingIdx.value] = { ...editSnippetData.value }
  editingIdx.value = null
  saveSnippets()
}

// Cancela edição
function cancelEdit() {
  editingIdx.value = null
}

// Copia código para a área de transferência
function copyCode(code) {
  navigator.clipboard.writeText(code)
}

// Lista filtrada de snippets conforme busca
const filteredSnippets = computed(() => {
  if (!search.value.trim()) return snippets.value
  const q = search.value.trim().toLowerCase()
  return snippets.value.filter(
    s =>
      s.title.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q)
  )
})

// Realça o código conforme a linguagem
function highlight(code, lang) {
  if (hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value
  }
  return hljs.highlightAuto(code).value
}

// Inicializa e observa mudanças para salvar automaticamente
loadSnippets()
watch(snippets, saveSnippets, { deep: true })
</script>