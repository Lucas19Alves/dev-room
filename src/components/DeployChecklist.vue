<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4" id="deploy-main">
    <h2 class="text-xl font-bold mb-4 text-green-400" id="deploy-title">Checklist de Deploy</h2>
    <!-- Formulário para adicionar novo item -->
    <form @submit.prevent="addItem(newItem)" class="flex gap-2 mb-4 w-full" id="deploy-form">
      <input
        v-model="newItem"
        type="text"
        autocomplete="off"
        placeholder="Adicionar item..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="deploy-input"
      />
      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
        id="deploy-add-btn"
        :disabled="newItem.trim() === ''"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
      </button>
    </form>
    <!-- Filtros -->
    <div class="flex gap-2 mb-2 w-full justify-end">
      <button
        class="px-2 py-1 rounded text-xs font-bold"
        :class="filter === 'all' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'"
        @click="filter = 'all'"
      >Todos</button>
      <button
        class="px-2 py-1 rounded text-xs font-bold"
        :class="filter === 'open' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'"
        @click="filter = 'open'"
      >Pendentes</button>
      <button
        class="px-2 py-1 rounded text-xs font-bold"
        :class="filter === 'done' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'"
        @click="filter = 'done'"
      >Concluídos</button>
    </div>
    <!-- Lista de itens da checklist -->
    <ul class="w-full space-y-2 flex-1 overflow-y-auto max-h-full min-h-[40px]" id="deploy-list">
      <li
        v-for="(item, idx) in filteredItems"
        :key="item.id"
        class="flex items-center justify-between bg-gray-800 px-3 py-2 rounded deploy-item"
        :id="`deploy-item-${item.id}`"
      >
        <label class="flex items-center gap-2 w-full cursor-pointer deploy-label" :id="`deploy-label-${item.id}`">
          <input
            type="checkbox"
            v-model="item.done"
            @change="saveItems"
            class="deploy-checkbox"
            :id="`deploy-checkbox-${item.id}`"
          />
          <span
            v-if="editingId !== item.id"
            :class="{ 'line-through text-gray-400': item.done }"
            class="flex-1 deploy-text"
            :id="`deploy-text-${item.id}`"
            @dblclick="startEdit(item)"
            title="Clique duplo para editar"
            style="cursor: pointer;"
          >{{ item.text }}</span>
          <input
            v-else
            v-model="editText"
            @keyup.enter="saveEdit(item)"
            @blur="saveEdit(item)"
            class="flex-1 px-2 py-1 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none"
            ref="editInput"
            :id="`deploy-edit-input-${item.id}`"
            autocomplete="off"
          />
        </label>
        <button
          @click="removeItem(item.id)"
          class="ml-2 text-red-400 hover:text-red-600 transition deploy-remove-btn"
          title="Remover"
          :id="`deploy-remove-btn-${item.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="filteredItems.length === 0" class="text-gray-400 text-center" id="deploy-empty">
        Nenhum item na checklist.
      </li>
    </ul>
    <!-- Progresso -->
    <div class="w-full mt-4">
      <div class="flex justify-between text-xs mb-1">
        <span>Progresso</span>
        <span>{{ doneCount }}/{{ checklist.length }} concluídos</span>
      </div>
      <div class="w-full bg-gray-700 rounded h-2 overflow-hidden">
        <div
          class="bg-green-500 h-2 transition-all"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>
    <!-- Botões de reset e restaurar padrão -->
    <div class="flex gap-2 mt-6 flex-wrap" id="deploy-actions">
      <button
        class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition"
        @click="resetChecklist"
        :disabled="checklist.length === 0"
        id="deploy-reset-btn"
      >
        Resetar
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="restoreDefault"
        id="deploy-restore-btn"
      >
        Restaurar padrão
      </button>
      <button
        class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition"
        @click="exportChecklist"
        :disabled="checklist.length === 0"
        id="deploy-export-btn"
      >
        Exportar
      </button>
      <label
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition cursor-pointer"
        id="deploy-import-btn"
      >
        Importar
        <input type="file" accept=".json" class="hidden" @change="importChecklist" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

const allData = getDevRoomData()
const checklist = ref(allData.deployChecklist || [])

watch(checklist, (val) => {
  const data = getDevRoomData()
  data.deployChecklist = val
  setDevRoomData(data)
}, { deep: true })

const newItem = ref('')
const editingId = ref(null)
const editText = ref('')
const filter = ref('all')

function addItem(text) {
  checklist.value.push({ text, done: false, id: Date.now() + Math.random() })
}

function removeItem(id) {
  checklist.value = checklist.value.filter(i => i.id !== id)
}

function resetChecklist() {
  checklist.value.forEach(item => (item.done = false))
}

function restoreDefault() {
  checklist.value = [
    { text: 'Testes automatizados passaram', done: false, id: Date.now() + Math.random() },
    { text: 'Variáveis de ambiente revisadas', done: false, id: Date.now() + Math.random() },
    { text: 'Build gerado em modo produção', done: false, id: Date.now() + Math.random() },
    { text: 'Backup realizado', done: false, id: Date.now() + Math.random() },
    { text: 'Documentação atualizada', done: false, id: Date.now() + Math.random() },
    { text: 'Notificações enviadas para o time', done: false, id: Date.now() + Math.random() }
  ]
}

function startEdit(item) {
  editingId.value = item.id
  editText.value = item.text
  nextTick(() => {
    const input = document.getElementById(`deploy-edit-input-${item.id}`)
    if (input) input.focus()
  })
}

function saveEdit(item) {
  if (editingId.value === item.id) {
    item.text = editText.value.trim() || item.text
    editingId.value = null
    editText.value = ''
  }
}

function exportChecklist() {
  const data = JSON.stringify(checklist.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'deploy-checklist.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importChecklist(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const imported = JSON.parse(evt.target.result)
      if (Array.isArray(imported) && imported.every(i => i.text)) {
        const seen = new Set()
        let duplicatedCount = 0
        const sanitized = imported.filter(item => {
          if (seen.has(item.id)) {
            duplicatedCount++
            return false 
          }
          seen.add(item.id)
          return true
        }).map(item => ({
          ...item,
          id: item.id || Date.now() + Math.random(),
          done: !!item.done
        }))
        checklist.value = sanitized
        if (duplicatedCount > 0) {
          showToast(`${duplicatedCount} item(ns) com ID duplicado foram ignorados ao importar.`)
        }
      } else {
        alert('Arquivo inválido.')
      }
    } catch {
      alert('Erro ao importar checklist.')
    }
  }
  reader.readAsText(file)
}

function showToast(msg) {
  const toast = document.createElement('div')
  toast.textContent = msg
  toast.style.position = 'fixed'
  toast.style.bottom = '32px'
  toast.style.left = '50%'
  toast.style.transform = 'translateX(-50%)'
  toast.style.background = '#222'
  toast.style.color = '#fff'
  toast.style.padding = '12px 24px'
  toast.style.borderRadius = '8px'
  toast.style.zIndex = 9999
  toast.style.boxShadow = '0 2px 8px #0006'
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.remove()
  }, 3500)
}

const filteredItems = computed(() => {
  if (filter.value === 'all') return checklist.value
  if (filter.value === 'open') return checklist.value.filter(i => !i.done)
  if (filter.value === 'done') return checklist.value.filter(i => i.done)
  return checklist.value
})

const doneCount = computed(() => checklist.value.filter(i => i.done).length)
const progress = computed(() => checklist.value.length ? Math.round((doneCount.value / checklist.value.length) * 100) : 0)
</script>

<style scoped>
.drag-handle {
  cursor: move;
}
</style>