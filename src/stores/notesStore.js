import { ref } from 'vue'

const STORAGE_KEY = 'dev-room-quick-notes'
const notes = ref([])

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEY)
  notes.value = saved ? JSON.parse(saved) : []
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
}

loadNotes()

export { notes, loadNotes, saveNotes, STORAGE_KEY }