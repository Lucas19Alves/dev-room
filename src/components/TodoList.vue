<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]">
    <h2 class="text-xl font-bold mb-4 text-yellow-300">To-Do List</h2>
    <form @submit.prevent="addTask" class="flex flex-row gap-2 mb-4 w-full">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
      />
      <button
        type="submit"
        class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
      >
        Adicionar
      </button>
    </form>
    <ul class="w-full space-y-2 flex-1 overflow-y-auto max-h-full min-h-[40px]">
      <li
        v-for="(task, idx) in tasks"
        :key="task.id"
        class="flex items-center justify-between bg-gray-800 px-3 py-2 rounded"
      >
        <label class="flex items-center gap-2 w-full cursor-pointer">
          <input type="checkbox" v-model="task.done" @change="saveTasks" />
          <span :class="{ 'line-through text-gray-400': task.done }" class="flex-1">{{ task.text }}</span>
        </label>
        <button
          @click="removeTask(idx)"
          class="ml-2 text-red-400 hover:text-red-600 transition"
          title="Remover"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </li>
      <li v-if="tasks.length === 0" class="text-gray-400 text-center">Nenhuma tarefa ainda.</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dev-room-tasks'
const newTask = ref('')
const tasks = ref([])

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY)
  tasks.value = saved ? JSON.parse(saved) : []
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
}

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

function removeTask(idx) {
  tasks.value.splice(idx, 1)
  saveTasks()
}

loadTasks()

watch(tasks, saveTasks, { deep: true })
</script>