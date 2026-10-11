<template>
  <div class="tool" style="--app-accent-rgb: 255, 159, 10" id="todo-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">To-Do List</h2>
        <p class="tool-sub">{{ pending }} pendente{{ pending === 1 ? '' : 's' }} · {{ tasks.length - pending }} concluída{{ tasks.length - pending === 1 ? '' : 's' }}</p>
      </div>
      <div class="seg" role="group" aria-label="Filtro">
        <button v-for="f in filters" :key="f.id" type="button" :class="{ on: filter === f.id }" @click="filter = f.id">{{ f.label }}</button>
      </div>
    </div>

    <div v-if="tasks.length" class="progress" :title="`${percent}% concluído`"><span :style="{ width: `${percent}%` }"></span></div>

    <div class="tool-row add-row">
      <input v-model="newTask" type="text" autocomplete="off" placeholder="Nova tarefa… (Enter para adicionar)" class="tool-grow" @keydown.enter="addTask" id="todo-input" />
      <button type="button" class="btn btn-primary" @click="addTask" :disabled="!newTask.trim()" id="todo-add-btn">
        <font-awesome-icon icon="fa-solid fa-plus" /> Adicionar
      </button>
    </div>

    <ul class="tool-list" id="todo-list">
      <li v-for="task in visibleTasks" :key="task.id" class="tool-item" :class="{ done: task.done, important: task.important }" :id="`todo-item-${task.id}`">
        <input type="checkbox" v-model="task.done" :aria-label="`Concluir ${task.text}`" />
        <input v-if="editingId === task.id" v-model="editText" class="tool-grow edit" @keydown.enter="saveEdit(task)" @keydown.esc="editingId = null" @blur="saveEdit(task)" :id="`todo-edit-${task.id}`" />
        <span v-else class="tool-grow text" @dblclick="startEdit(task)" title="Clique duplo para editar">{{ task.text }}</span>
        <button type="button" class="icon-btn star" :class="{ on: task.important }" @click="task.important = !task.important" :title="task.important ? 'Remover prioridade' : 'Marcar como prioridade'">
          <font-awesome-icon icon="fa-solid fa-star" />
        </button>
        <button type="button" class="icon-btn" @click="startEdit(task)" title="Editar"><font-awesome-icon icon="fa-solid fa-pen" /></button>
        <button type="button" class="icon-btn danger" @click="removeTask(task.id)" title="Remover"><font-awesome-icon icon="fa-solid fa-trash" /></button>
      </li>
      <li v-if="!visibleTasks.length" class="tool-empty">{{ emptyText }}</li>
    </ul>

    <div v-if="tasks.length - pending > 0" class="tool-row">
      <button type="button" class="btn btn-sm" @click="clearDone">Limpar concluídas ({{ tasks.length - pending }})</button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useAppStorage } from '../composables/useAppStorage'

const { state: tasks } = useAppStorage('tasks', [])
const newTask = ref('')
const editingId = ref(null)
const editText = ref('')
const filter = ref('all')
const filters = [{ id: 'all', label: 'Todas' }, { id: 'open', label: 'Pendentes' }, { id: 'done', label: 'Feitas' }]

const pending = computed(() => tasks.value.filter(t => !t.done).length)
const percent = computed(() => tasks.value.length ? Math.round((tasks.value.length - pending.value) / tasks.value.length * 100) : 0)
// Prioridades primeiro, depois pendentes; a ordem de criação é mantida dentro de cada grupo.
const visibleTasks = computed(() => tasks.value
  .filter(t => filter.value === 'all' || (filter.value === 'done' ? t.done : !t.done))
  .map((task, index) => ({ task, index }))
  .sort((a, b) => Number(a.task.done) - Number(b.task.done) || Number(Boolean(b.task.important)) - Number(Boolean(a.task.important)) || a.index - b.index)
  .map(item => item.task))
const emptyText = computed(() => ({ all: 'Nenhuma tarefa ainda. Que tal começar por uma pequena?', open: 'Tudo feito! 🎉', done: 'Nada concluído ainda.' })[filter.value])

function addTask() {
  const text = newTask.value.trim()
  if (!text) return
  tasks.value.push({ id: Date.now() + Math.random(), text, done: false, important: false, createdAt: Date.now() })
  newTask.value = ''
}

function removeTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function startEdit(task) {
  editingId.value = task.id
  editText.value = task.text
  nextTick(() => document.getElementById(`todo-edit-${task.id}`)?.focus())
}

function saveEdit(task) {
  if (editingId.value !== task.id) return
  if (editText.value.trim()) task.text = editText.value.trim()
  editingId.value = null
}

function clearDone() {
  tasks.value = tasks.value.filter(t => !t.done)
}
</script>

<style scoped>
.add-row input { min-width: 140px; }
.tool-list { flex: 1; }
.text { overflow-wrap: anywhere; cursor: text; font-size: 14px; }
.done .text { text-decoration: line-through; color: var(--text-muted); }
.important { border-color: rgba(var(--app-accent-rgb), .55); }
.star.on { color: rgb(var(--app-accent-rgb)); }
.edit { min-height: 30px !important; }
</style>
