<template>
  <!-- Container principal da To-Do List -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]" id="todo-main">
    <h2 class="text-xl font-bold mb-4 text-yellow-300" id="todo-title">To-Do List</h2>
    <!-- Formulário para adicionar nova tarefa -->
    <form @submit.prevent="addTask(newTask)" class="flex flex-row gap-2 mb-4 w-full" id="todo-form">
      <input
        v-model="newTask"
        type="text"
        autocomplete="off"
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
        v-for="(task, idx) in sortedTasks"
        :key="task.id"
        class="flex items-center justify-between bg-gray-800 px-3 py-2 rounded todo-item"
        :id="`todo-item-${task.id}`"
      >
        <label class="flex items-center gap-2 w-full cursor-pointer todo-label" :id="`todo-label-${task.id}`">
          <input
            type="checkbox"
            v-model="task.done"
            class="todo-checkbox"
            :id="`todo-checkbox-${task.id}`"
          />
          <!-- Editável: input aparece ao editar, senão mostra o texto -->
          <span
            v-if="editingId !== task.id"
            :class="{ 'line-through text-gray-400': task.done }"
            class="flex-1 todo-text"
            :id="`todo-text-${task.id}`"
            @dblclick="startEdit(task)"
            title="Clique duplo para editar"
            style="cursor: pointer;"
          >{{ task.text }}</span>
          <input
            v-else
            v-model="editText"
            @keyup.enter="saveEdit(task)"
            @blur="saveEdit(task)"
            class="flex-1 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-yellow-400 focus:outline-none"
            :id="`todo-edit-input-${task.id}`"
            ref="editInput"
          />
        </label>
        <button
          @click="removeTask(task.id)"
          class="ml-2 text-red-400 hover:text-red-600 transition todo-remove-btn"
          title="Remover"
          :id="`todo-remove-btn-${task.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="sortedTasks.length === 0" class="text-gray-400 text-center" id="todo-empty">Nenhuma tarefa ainda.</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

const allData = getDevRoomData()
const tasks = ref(allData.tasks || [])
const newTask = ref('')

// Estados para edição
const editingId = ref(null)
const editText = ref('')
const editInput = ref(null)

watch(tasks, (val) => {
  const data = getDevRoomData()
  data.tasks = val
  setDevRoomData(data)
}, { deep: true })

// Adiciona uma nova tarefa
function addTask(text) {
  if (text.trim() === '') return
  tasks.value.push({
    id: Date.now() + Math.random(),
    text: text.trim(),
    done: false
  })
  newTask.value = ''
}

// Remove uma tarefa pelo ID
function removeTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

// Inicia edição ao dar duplo clique
function startEdit(task) {
  editingId.value = task.id
  editText.value = task.text
  nextTick(() => {
    // Foca no input ao editar
    const input = document.getElementById(`todo-edit-input-${task.id}`)
    if (input) input.focus()
  })
}

// Salva edição ao sair do input ou pressionar Enter
function saveEdit(task) {
  if (editText.value.trim() !== '') {
    task.text = editText.value.trim()
    const data = getDevRoomData()
    data.tasks = tasks.value
    setDevRoomData(data)
  }
  editingId.value = null
  editText.value = ''
}

// Computed para ordenar: não concluídas primeiro, concluídas depois
const sortedTasks = computed(() => {
  return [
    ...tasks.value.filter(t => !t.done),
    ...tasks.value.filter(t => t.done)
  ]
})
</script>