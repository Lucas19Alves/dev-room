<template>
  <div class="tool" style="--app-accent-rgb: 94, 92, 230" id="kanban-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Kanban</h2>
        <p class="tool-sub">{{ totalCards }} card{{ totalCards === 1 ? '' : 's' }} em {{ columns.length }} coluna{{ columns.length === 1 ? '' : 's' }} · arraste para mover</p>
      </div>
      <div class="tool-row">
        <input v-model="filterText" type="search" placeholder="Filtrar cards" class="filter-input" aria-label="Filtrar cards" />
        <button type="button" class="btn btn-primary btn-sm" @click="addColumn" id="kanban-add-column-btn"><font-awesome-icon icon="fa-solid fa-plus" /> Coluna</button>
      </div>
    </div>

    <draggable v-model="columns" item-key="id" class="board" handle=".col-handle" :animation="160" id="kanban-board">
      <template #item="{ element: column }">
        <section class="column">
          <header class="col-head">
            <span class="col-handle" title="Arraste a coluna">⋮⋮</span>
            <input v-model="column.title" class="col-title" maxlength="40" aria-label="Nome da coluna" />
            <span class="chip">{{ column.cards.length }}</span>
            <button type="button" class="icon-btn danger" @click="removeColumn(column)" title="Remover coluna"><font-awesome-icon icon="fa-solid fa-trash" /></button>
          </header>

          <draggable v-model="column.cards" group="kanban-cards" item-key="id" class="cards" :animation="160" ghost-class="card-ghost">
            <template #item="{ element: card }">
              <article v-show="cardMatches(card)" class="card" :style="{ '--label': labels[card.label]?.color || 'transparent' }">
                <div class="card-top">
                  <input v-if="card.isEditing" v-model="card.title" class="card-title-input" @keydown.enter="card.isEditing = false" @blur="card.isEditing = false" :id="`kanban-card-${card.id}`" />
                  <strong v-else class="card-title" @dblclick="editCard(card)">{{ card.title }}</strong>
                  <button type="button" class="icon-btn" @click="editCard(card)" title="Editar título"><font-awesome-icon icon="fa-solid fa-pen" /></button>
                  <button type="button" class="icon-btn danger" @click="removeCard(column, card)" title="Remover card"><font-awesome-icon icon="fa-solid fa-trash" /></button>
                </div>
                <textarea v-model="card.description" rows="2" placeholder="Descrição…" class="card-desc"></textarea>
                <div class="label-row" role="group" aria-label="Etiqueta">
                  <button v-for="(label, id) in labels" :key="id" type="button" class="label-dot" :class="{ on: card.label === id }" :style="{ background: label.color }" :title="label.name" @click="card.label = card.label === id ? '' : id"></button>
                </div>
              </article>
            </template>
          </draggable>

          <div class="add-card">
            <input v-model="newCardTitles[column.id]" placeholder="Novo card… (Enter)" @keydown.enter="addCard(column)" :aria-label="`Novo card em ${column.title}`" />
            <button type="button" class="btn btn-sm btn-icon" @click="addCard(column)" title="Adicionar card"><font-awesome-icon icon="fa-solid fa-plus" /></button>
          </div>
        </section>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import draggable from 'vuedraggable'
import { useAppStorage } from '../composables/useAppStorage'

const generateId = () => Date.now() + Math.random().toString(36).slice(2)
const { state: columns } = useAppStorage('kanban-board', () => [
  { id: generateId(), title: 'A Fazer', cards: [] },
  { id: generateId(), title: 'Fazendo', cards: [] },
  { id: generateId(), title: 'Feito', cards: [] }
])
const newCardTitles = reactive({})
const filterText = ref('')
const labels = {
  red: { name: 'Urgente', color: '#ff5f57' },
  amber: { name: 'Importante', color: '#ffbd2e' },
  green: { name: 'Melhoria', color: '#30d158' },
  blue: { name: 'Ideia', color: '#0a84ff' },
  purple: { name: 'Bug', color: '#bf5af2' }
}

const totalCards = computed(() => columns.value.reduce((sum, col) => sum + col.cards.length, 0))
const normalize = text => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const cardMatches = card => !filterText.value.trim() || normalize(`${card.title} ${card.description}`).includes(normalize(filterText.value.trim()))

function addColumn() {
  columns.value.push({ id: generateId(), title: 'Nova coluna', cards: [] })
}

function removeColumn(column) {
  if (column.cards.length && !confirm(`Remover "${column.title}" e seus ${column.cards.length} cards?`)) return
  columns.value = columns.value.filter(c => c.id !== column.id)
}

function addCard(column) {
  const title = newCardTitles[column.id]?.trim()
  if (!title) return
  column.cards.push({ id: generateId(), title, description: '', label: '' })
  newCardTitles[column.id] = ''
}

function editCard(card) {
  card.isEditing = true
  nextTick(() => document.getElementById(`kanban-card-${card.id}`)?.focus())
}

function removeCard(column, card) {
  column.cards = column.cards.filter(c => c.id !== card.id)
}
</script>

<style scoped>
.filter-input { width: 150px; min-height: 30px !important; font-size: 12.5px; }
.board { flex: 1; display: flex; gap: 12px; overflow-x: auto; align-items: flex-start; padding-bottom: 6px; min-height: 0; }
.column { flex: 0 0 260px; display: flex; flex-direction: column; gap: 8px; max-height: 100%; padding: 10px; border-radius: 16px; border: 1px solid var(--glass-border); background: var(--bg-panel-secondary); }
.col-head { display: flex; align-items: center; gap: 6px; }
.col-handle { cursor: grab; color: var(--text-muted); letter-spacing: -2px; user-select: none; }
.col-title { flex: 1; min-width: 0; font-weight: 700; background: transparent !important; border-color: transparent !important; box-shadow: none !important; padding-inline: 4px !important; min-height: 30px !important; }
.col-title:focus { border-color: rgb(var(--app-accent-rgb)) !important; }
.cards { display: flex; flex-direction: column; gap: 8px; min-height: 40px; overflow-y: auto; }
.card { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 12px; background: var(--surface-strong); border: 1px solid var(--glass-border); border-left: 4px solid var(--label); box-shadow: 0 4px 14px rgba(0, 0, 0, .06); cursor: grab; }
.card-ghost { opacity: .4; }
.card-top { display: flex; align-items: center; gap: 2px; }
.card-title { flex: 1; font-size: 13.5px; overflow-wrap: anywhere; }
.card-title-input { flex: 1; min-height: 28px !important; }
.card-desc { font-size: 12px; resize: vertical; min-height: 0 !important; }
.label-row { display: flex; gap: 5px; }
.tool .label-dot { min-height: 0 !important; width: 14px; height: 14px; padding: 0 !important; border-radius: 50%; border: 2px solid transparent; opacity: .35; cursor: pointer; }
.tool .label-dot.on { opacity: 1; border-color: var(--text-main); }
.add-card { display: flex; gap: 6px; }
.add-card input { flex: 1; min-width: 0; min-height: 32px !important; font-size: 12.5px; }
</style>
