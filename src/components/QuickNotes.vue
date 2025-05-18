<template>
  <div class="flex flex-col p-6 min-w-[320px] max-w-[700px] h-[400px]">
    <h2 class="text-xl font-bold mb-4 text-orange-300">Notas Rápidas</h2>
    <form @submit.prevent="addNote" class="flex gap-2 mb-4">
      <input
        v-model="newNote"
        type="text"
        placeholder="Digite uma nota rápida..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
      />
      <button
        type="submit"
        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition"
      >
        Adicionar
      </button>
    </form>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full overflow-y-auto max-h-[260px] pr-2">
      <div
        v-for="(note, idx) in notes"
        :key="note.id"
        class="relative bg-yellow-100 rounded-lg shadow p-3 min-h-[100px] flex flex-col"
        :style="{ background: noteColors[idx % noteColors.length] }"
      >
        <textarea
          v-model="note.text"
          @input="saveNotes"
          class="bg-transparent resize-none border-none text-gray-800 font-medium w-full h-full focus:outline-none"
          rows="4"
        />
        <button
          @click="removeNote(idx)"
          class="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"
          title="Remover"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </div>
      <div v-if="notes.length === 0" class="col-span-full text-gray-400 text-center">Nenhuma nota ainda.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dev-room-quick-notes'
const newNote = ref('')
const notes = ref([])

const noteColors = [
  '#FEF3C7',
  '#FDE68A',
  '#FCD34D',
  '#FFD6A5',
  '#E0BBE4',
  '#B5EAD7',
  '#C7CEEA',
]

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEY)
  notes.value = saved ? JSON.parse(saved) : []
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
}

function addNote() {
  if (newNote.value.trim() === '') return
  notes.value.push({
    id: Date.now() + Math.random(),
    text: newNote.value.trim()
  })
  newNote.value = ''
  saveNotes()
}

function removeNote(idx) {
  notes.value.splice(idx, 1)
  saveNotes()
}

loadNotes()
watch(notes, saveNotes, { deep: true })
</script>