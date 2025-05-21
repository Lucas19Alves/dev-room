<template>
  <!-- Exibe apenas notas móveis (floating) -->
  <div>
    <div
      v-for="(note, idx) in floatingNotes"
      :key="note.id"
      class="fixed z-[9998] bg-yellow-100 rounded-lg shadow p-3 min-h-[80px] flex flex-col quicknotes-sticky"
      :style="{
        left: note.x + 'px',
        top: note.y + 'px',
        minWidth: '180px',
        maxWidth: '320px',
        background: noteColors[idx % noteColors.length]
      }"
      :id="`sticky-note-${note.id}`"
      @mousedown="startDrag(note, $event)"
    >
      <textarea
        v-model="note.text"
        @input="saveNotes"
        class="bg-transparent resize-none border-none text-gray-800 font-medium w-full h-full focus:outline-none quicknotes-textarea"
        rows="4"
        :id="`sticky-note-textarea-${note.id}`"
      />
      <!-- Botão para fixar de volta ao QuickNotes -->
      <button
        @click="unfloatNote(note)"
        class="absolute top-2 left-2 text-blue-400 hover:text-blue-600 transition quicknotes-float-btn"
        title="Fixar de volta"
        :id="`sticky-note-unfloat-btn-${note.id}`"
      >
        <font-awesome-icon icon="fa-solid fa-down-left-and-up-right-to-center" />
      </button>
      <!-- Botão para remover nota móvel -->
      <button
        @click="removeNoteById(note.id)"
        class="absolute top-2 right-2 text-red-400 hover:text-red-600 transition quicknotes-remove-btn"
        title="Remover"
        :id="`sticky-note-remove-btn-${note.id}`"
      >
        <font-awesome-icon icon="fa-solid fa-trash" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { notes, loadNotes, saveNotes, STORAGE_KEY } from '../stores/notesStore'

const noteColors = [
  '#FEF3C7', '#FDE68A', '#FCD34D', '#FFD6A5',
  '#E0BBE4', '#B5EAD7', '#C7CEEA',
]

const floatingNotes = computed(() => notes.value.filter(n => n.floating))

function removeNoteById(id) {
  const idx = notes.value.findIndex(n => n.id === id)
  if (idx !== -1) {
    notes.value.splice(idx, 1)
    saveNotes()
  }
}

function unfloatNote(note) {
  note.floating = false
  saveNotes()
}

// Drag & drop simples para notas móveis
let draggingNote = null
let offsetX = 0
let offsetY = 0

function startDrag(note, event) {
  draggingNote = note
  offsetX = event.clientX - note.x
  offsetY = event.clientY - note.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event) {
  if (draggingNote) {
    draggingNote.x = event.clientX - offsetX
    draggingNote.y = event.clientY - offsetY
    draggingNote.x = Math.max(0, Math.min(window.innerWidth - 200, draggingNote.x))
    draggingNote.y = Math.max(0, Math.min(window.innerHeight - 80, draggingNote.y))
    saveNotes()
  }
}

function stopDrag() {
  draggingNote = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function syncFromStorage(e) {
  if (e.key === STORAGE_KEY || e.key === 'dev-room-data') {
    loadNotes()
  }
}

onMounted(() => {
  loadNotes()
  window.addEventListener('storage', syncFromStorage)
})
onUnmounted(() => {
  window.removeEventListener('storage', syncFromStorage)
})

watch(notes, saveNotes, { deep: true })
</script>