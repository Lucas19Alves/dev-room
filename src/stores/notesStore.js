import { ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

const STORAGE_KEY = 'dev-room-data'
const notes = ref(getDevRoomData().notes || [])

// Carrega as notas do localStorage
function loadNotes() {
  const allData = getDevRoomData()
  notes.value = allData.notes || []
}

// Salva as notas no localStorage
function saveNotes() {
  const allData = getDevRoomData()
  allData.notes = notes.value
  setDevRoomData(allData)
}

// Salva automaticamente ao alterar
watch(notes, saveNotes, { deep: true })

export { notes, loadNotes, saveNotes, STORAGE_KEY }