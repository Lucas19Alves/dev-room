<template>
  <!-- Container principal da To-Do List -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]" id="todo-main">
    <h2 class="text-xl font-bold mb-4 text-yellow-300" id="todo-title">To-Do List</h2>
    <!-- Formulário para adicionar nova tarefa -->
    <form @submit.prevent="addTask" class="flex flex-row gap-2 mb-4 w-full" id="todo-form">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="todo-input"
      />
      <button
        type="submit"
        class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
        id="todo-add-btn"
      >
        Adicionar
      </button>
    </form>
    <!-- Lista de tarefas -->
    <ul class="w-full space-y-2 flex-1 overflow-y-auto max-h-full min-h-[40px]" id="todo-list">
      <li
        v-for="(task, idx) in tasks"
        :key="task.id"
        class="flex items-center justify-between bg-gray-800 px-3 py-2 rounded todo-item"
        :id="`todo-item-${task.id}`"
      >
        <label class="flex items-center gap-2 w-full cursor-pointer todo-label" :id="`todo-label-${task.id}`">
          <input
            type="checkbox"
            v-model="task.done"
            @change="saveTasks"
            class="todo-checkbox"
            :id="`todo-checkbox-${task.id}`"
          />
          <span :class="{ 'line-through text-gray-400': task.done }" class="flex-1 todo-text" :id="`todo-text-${task.id}`">{{ task.text }}</span>
        </label>
        <button
          @click="removeTask(idx)"
          class="ml-2 text-red-400 hover:text-red-600 transition todo-remove-btn"
          title="Remover"
          :id="`todo-remove-btn-${task.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="tasks.length === 0" class="text-gray-400 text-center" id="todo-empty">Nenhuma tarefa ainda.</li>
    </ul>
  </div>
</template>

<script setup>
// Importações e definição de estados reativos
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dev-room-tasks'
const newTask = ref('')
const tasks = ref([])

// Carrega tarefas do localStorage ao iniciar
function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY)
  tasks.value = saved ? JSON.parse(saved) : []
}

// Salva tarefas no localStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
}

// Adiciona uma nova tarefa
function addTask() {
  if (newTask.value.trim() === '') return
  tasks.value.push({
    id: Date.now() + Math.random(),
    text: newTask.value.trim(),
    done: false
  })
  newTask.value = ''
  saveTasks()
}

// Remove uma tarefa pelo índice
function removeTask(idx) {
  tasks.value.splice(idx, 1)
  saveTasks()
}

// Inicializa tarefas e observa mudanças para salvar automaticamente
loadTasks()
watch(tasks, saveTasks, { deep: true })
</script>