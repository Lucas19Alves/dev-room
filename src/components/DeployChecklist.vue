<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4">
    <h2 class="text-xl font-bold mb-4 text-green-400">Checklist de Deploy</h2>
    <form @submit.prevent="addItem" class="flex gap-2 mb-4 w-full">
      <input
        v-model="newItem"
        type="text"
        placeholder="Adicionar item..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
      />
      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
      >
        +
      </button>
    </form>
    <ul class="w-full space-y-2 flex-1 overflow-y-auto max-h-full min-h-[40px]">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="flex items-center justify-between bg-gray-800 px-3 py-2 rounded"
      >
        <label class="flex items-center gap-2 w-full cursor-pointer">
          <input type="checkbox" v-model="item.done" @change="saveItems" />
          <span :class="{ 'line-through text-gray-400': item.done }" class="flex-1">{{ item.text }}</span>
        </label>
        <button
          @click="removeItem(idx)"
          class="ml-2 text-red-400 hover:text-red-600 transition"
          title="Remover"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="items.length === 0" class="text-gray-400 text-center">Nenhum item na checklist.</li>
    </ul>
    <div class="flex gap-2 mt-6 flex-wrap">
      <button
        class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition"
        @click="resetChecklist"
        :disabled="items.length === 0"
      >
        Resetar
      </button>
      <button
        class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded transition"
        @click="restoreDefault"
      >
        Restaurar padrão
      </button>
    </div>
  </div>
</template>

<script setup>
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

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY)
  items.value = saved ? JSON.parse(saved) : defaultItems.map(i => ({ ...i, id: Date.now() + Math.random() }))
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

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

function removeItem(idx) {
  items.value.splice(idx, 1)
  saveItems()
}

function resetChecklist() {
  items.value.forEach(item => (item.done = false))
  saveItems()
}

function restoreDefault() {
  items.value = defaultItems.map(i => ({ ...i, id: Date.now() + Math.random() }))
  saveItems()
}

loadItems()
watch(items, saveItems, { deep: true })
</script>