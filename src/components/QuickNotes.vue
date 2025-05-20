<template>
  <!-- Container principal das Notas Rápidas -->
  <div class="flex flex-col w-full h-full p-4" id="quicknotes-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-orange-300" id="quicknotes-title">Notas Rápidas</h2>
    <!-- Formulário para adicionar nova nota -->
    <form @submit.prevent="addNote" class="flex gap-2 mb-4" id="quicknotes-form">
      <input
        v-model="newNote"
        type="text"
        autocomplete="off"
        placeholder="Digite uma nota rápida..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="quicknotes-input"
      />
      <button
        type="submit"
        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition"
        id="quicknotes-add-btn"
      >
        Adicionar
      </button>
    </form>
    <!-- Grid de notas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full overflow-y-auto flex-1 pr-2" id="quicknotes-list">
      <div
        v-for="(note, idx) in fixedNotes"
        :key="note.id"
        class="relative bg-yellow-100 rounded-lg shadow p-3 min-h-[80px] flex flex-col quicknotes-item"
        :style="{ background: noteColors[idx % noteColors.length] }"
        :id="`quicknotes-item-${note.id}`"
      >
        <!-- Área editável da nota -->
        <textarea
          v-model="note.text"
          @input="saveNotes"
          class="bg-transparent resize-none border-none text-gray-800 font-medium w-full h-full focus:outline-none quicknotes-textarea"
          rows="4"
          :id="`quicknotes-textarea-${note.id}`"
        />
        <!-- Botão para remover nota -->
        <button
          @click="removeNoteById(note.id)"
          class="absolute top-2 right-2 text-red-400 hover:text-red-600 transition quicknotes-remove-btn"
          title="Remover"
          :id="`quicknotes-remove-btn-${note.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
        <!-- Botão para desafixar nota (ícone) -->
        <button
          @click="floatNote(note)"
          class="absolute top-2 left-2 text-blue-400 hover:text-blue-600 transition quicknotes-float-btn"
          title="Desafixar"
          :id="`quicknotes-float-btn-${note.id}`"
        >
          <font-awesome-icon icon="fa-solid fa-up-right-and-down-left-from-center" />
        </button>
      </div>
      <!-- Mensagem caso não haja notas -->
      <div v-if="fixedNotes.length === 0" class="col-span-full text-gray-400 text-center" id="quicknotes-empty">
        Nenhuma nota ainda.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { notes, loadNotes, saveNotes, STORAGE_KEY } from '../stores/notesStore'

const newNote = ref('')

const noteColors = [
  '#FEF3C7', '#FDE68A', '#FCD34D', '#FFD6A5',
  '#E0BBE4', '#B5EAD7', '#C7CEEA',
]

const fixedNotes = computed(() => notes.value.filter(n => !n.floating))

function addNote() {
  if (newNote.value.trim() === '') return
  notes.value.push({
    id: Date.now() + Math.random(),
    text: newNote.value.trim(),
    floating: false,
    x: 100,
    y: 100
  })
  newNote.value = ''
  saveNotes()
}

function removeNoteById(id) {
  const idx = notes.value.findIndex(n => n.id === id)
  if (idx !== -1) {
    notes.value.splice(idx, 1)
    saveNotes()
  }
}

function floatNote(note) {
  note.floating = true
  note.x = 100
  note.y = 100
  saveNotes()
}

onMounted(() => {
  loadNotes()
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) loadNotes()
  })
})

watch(notes, saveNotes, { deep: true })
</script>