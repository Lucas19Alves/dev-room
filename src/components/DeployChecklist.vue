<template>
  <!-- Container principal da checklist de deploy -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4" id="deploy-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-green-400" id="deploy-title">Checklist de Deploy</h2>
    <!-- Formulário para adicionar novo item -->
    <form @submit.prevent="addItem" class="flex gap-2 mb-4 w-full" id="deploy-form">
      <input
        v-model="newItem"
        type="text"
        placeholder="Adicionar item..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="deploy-input"
      />
      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
        id="deploy-add-btn"
      >
        +
      </button>
    </form>
    <!-- Lista de itens da checklist -->
    <ul class="w-full space-y-2 flex-1 overflow-y-auto max-h-full min-h-[40px]" id="deploy-list">
      <li
        v-for="(item, idx) in items"
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
          <span :class="{ 'line-through text-gray-400': item.done }" class="flex-1 deploy-text" :id="`deploy-text-${item.id}`">{{ item.text }}</span>
        </label>
        <button
          @click="removeItem(idx)"
          class="ml-2 text-red-400 hover:text-red-600 transition deploy-remove-btn"
          title="Remover"
          :id="`deploy-remove-btn-${item.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="items.length === 0" class="text-gray-400 text-center" id="deploy-empty">Nenhum item na checklist.</li>
    </ul>
    <!-- Botões de reset e restaurar padrão -->
    <div class="flex gap-2 mt-6 flex-wrap" id="deploy-actions">
      <button
        class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition"
        @click="resetChecklist"
        :disabled="items.length === 0"
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
    </div>
  </div>
</template>

<script setup>
// Importações e estados reativos principais
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dev-room-deploy-checklist'
const defaultItems = [
  { text: 'Testes automatizados passaram', done: false },
  { text: 'Variáveis de ambiente revisadas', done: false },
  { text: 'Build gerado em modo produção', done: false },
  { text: 'Backup realizado', done: false },
  { text: 'Documentação atualizada', done: false },
  { text: 'Notificações enviadas para o time', done: false }
]

const newItem = ref('')
const items = ref([])

// Carrega itens do localStorage ou usa padrão
function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY)
  items.value = saved ? JSON.parse(saved) : defaultItems.map(i => ({ ...i, id: Date.now() + Math.random() }))
}

// Salva itens no localStorage
function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

// Adiciona novo item à checklist
function addItem() {
  if (newItem.value.trim() === '') return
  items.value.push({
    id: Date.now() + Math.random(),
    text: newItem.value.trim(),
    done: false
  })
  newItem.value = ''
  saveItems()
}

// Remove item pelo índice
function removeItem(idx) {
  items.value.splice(idx, 1)
  saveItems()
}

// Marca todos como não feitos
function resetChecklist() {
  items.value.forEach(item => (item.done = false))
  saveItems()
}

// Restaura checklist padrão
function restoreDefault() {
  items.value = defaultItems.map(i => ({ ...i, id: Date.now() + Math.random() }))
  saveItems()
}

// Inicializa e observa mudanças para salvar automaticamente
loadItems()
watch(items, saveItems, { deep: true })
</script>