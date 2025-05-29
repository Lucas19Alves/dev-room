<template>
  <div class="flex flex-col h-full w-full max-w-screen-xl mx-auto p-4 rounded-lg shadow-lg" id="kanban-main"
    :style="{ background: 'var(--bg-panel)' }">
    <div class="flex justify-between items-center flex-wrap overflow-hidden">
      <h2 class="text-xl font-bold text-blue-400 tracking-wide flex items-center gap-2">
        <font-awesome-icon icon="fa-solid fa-table-columns" class="text-blue-500" />
        Quadro Kanban
      </h2>
      <button @click="addColumn"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg shadow transition text-sm font-semibold flex items-center gap-1"
        id="kanban-add-column-btn">
        <font-awesome-icon icon="fa-solid fa-plus" />
        Coluna
      </button>
    </div>
    <div class="flex gap-6 flex-wrap pb-2" id="kanban-board">
      <div v-for="(column, colIdx) in columns" :key="column.id"
        class="rounded-xl p-3 flex-1 flex flex-col shadow-lg border border-gray-700 relative transition min-w-0 min-w-[200px]"
        :style="{ background: 'var(--bg-panel-secondary)', borderColor: '#23272e' }" :id="`kanban-column-${column.id}`">
        <div class="flex items-center justify-between mb-2 gap-2">
          <input v-model="column.title"
            class="bg-transparent font-bold text-base text-blue-100 border-b-2 border-blue-500 focus:outline-none flex-1 px-1"
            :id="`kanban-column-title-${column.id}`" autocomplete="off" maxlength="32"
            :style="{ background: 'transparent' }" />
        </div>
        <draggable v-model="column.cards" group="kanban" item-key="id" class="flex flex-col gap-3 min-h-[40px]"
          :id="`kanban-cards-draggable-${column.id}`">
          <template #item="{ element: card, index }">
            <div
              class="rounded-lg p-3 flex flex-col gap-2 border shadow group relative hover:border-blue-500 transition min-w-0"
              :style="{
                background: '#23272e',
                borderColor: '#23272e'
              }" :id="`kanban-card-${card.id}`">
              <div class="flex justify-between items-center">
                <template v-if="card.isEditing">
                  <input v-model="card.title"
                    class="font-semibold text-gray-100 text-base bg-gray-800 border border-gray-600 rounded px-1"
                    :id="`kanban-card-title-${card.id}`" />
                </template>
                <template v-else>
                  <span class="font-semibold text-gray-100 text-base w-full block truncate">{{ card.title }}</span>
                </template>

                <div class="flex gap-2">
                  <button @click="toggleEditCard(colIdx, index)"
                    class="text-xs text-yellow-400 hover:text-yellow-600 p-1 rounded transition" title="Editar card">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" />
                  </button>
                  <button @click="removeCard(colIdx, index)"
                    class="text-xs text-red-400 hover:text-red-600 p-1 rounded transition" title="Remover card">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
              <textarea v-model="card.description"
                class="text-xs text-gray-200 border border-gray-700 focus:border-blue-500 focus:outline-none rounded px-2 py-1 resize-none w-full transition"
                rows="2" placeholder="Descrição..." :id="`kanban-card-desc-${card.id}`" autocomplete="off"></textarea>
            </div>
          </template>
        </draggable>
        <form @submit.prevent="addCard(colIdx)" class="mt-3 flex gap-2 w-full" :id="`kanban-add-card-form-${column.id}`">
          <input v-model="newCardTitles[colIdx]" type="text" placeholder="Nova tarefa..."
            class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-gray-900 text-gray-100 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm transition"
            :id="`kanban-add-card-input-${column.id}`" autocomplete="off" />
          <button type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-bold transition"
            :id="`kanban-add-card-btn-${column.id}`">
            <font-awesome-icon icon="fa-solid fa-plus" />
          </button>
        </form>
        <button @click="removeColumn(colIdx)"
          class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-base p-1 rounded transition z-10 bg-gray-900/80"
          title="Remover coluna" :id="`kanban-remove-column-btn-${column.id}`">
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

const KANBAN_KEY = 'kanban-board'

function generateId() {
  return Date.now() + Math.random().toString(36).slice(2)
}

// Estado do Kanban
const columns = ref([])
const newCardTitles = ref([])

// Carregar do localStorage/dev-room-data
function loadKanban() {
  const allData = getDevRoomData()
  columns.value = (allData[KANBAN_KEY] || [
    { id: generateId(), title: 'A Fazer', cards: [] },
    { id: generateId(), title: 'Fazendo', cards: [] },
    { id: generateId(), title: 'Feito', cards: [] }
  ])
  newCardTitles.value = columns.value.map(() => '')
}

// Salvar no localStorage/dev-room-data
function saveKanban() {
  const data = getDevRoomData()
  data[KANBAN_KEY] = columns.value
  setDevRoomData(data)
}

watch(columns, saveKanban, { deep: true })

onMounted(() => {
  loadKanban()
  window.addEventListener('storage', syncFromStorage)
})

function syncFromStorage(e) {
  if (e.key === 'dev-room-data') {
    loadKanban()
  }
}

// Colunas
function addColumn() {
  columns.value.push({
    id: generateId(),
    title: 'Nova Coluna',
    cards: [],
    isEditing: false
  })
  newCardTitles.value.push('')
}
function removeColumn(idx) {
  columns.value.splice(idx, 1)
  newCardTitles.value.splice(idx, 1)
}
function toggleEditCard(colIdx, cardIdx) {
  const card = columns.value[colIdx].cards[cardIdx]
  card.isEditing = !card.isEditing
}

// Cards
function addCard(colIdx) {
  const title = newCardTitles.value[colIdx]?.trim()
  if (!title) return
  columns.value[colIdx].cards.push({
    id: generateId(),
    title,
    description: ''
  })
  newCardTitles.value[colIdx] = ''
}
function removeCard(colIdx, cardIdx) {
  columns.value[colIdx].cards.splice(cardIdx, 1)
}
</script>

<style scoped>
#kanban-main {
  min-width: 340px;
  min-height: 340px;
}

#kanban-board {
  scrollbar-color: #444 #222;
  scrollbar-width: thin;
}

::-webkit-scrollbar {
  height: 8px;
  background: #222;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}
</style>