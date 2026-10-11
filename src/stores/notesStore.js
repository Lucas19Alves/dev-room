import { ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData, DATA_KEY } from '../utils/storage'

// Notas compartilhadas entre Notas Rápidas e as notas flutuantes da área de trabalho.
const STORAGE_KEY = DATA_KEY
const notes = ref(getDevRoomData().notes || [])
let saveTimer = 0
let applying = false

function loadNotes() {
  applying = true
  notes.value = getDevRoomData().notes || []
  Promise.resolve().then(() => { applying = false })
}

function saveNotes() {
  clearTimeout(saveTimer)
  saveTimer = 0
  const data = getDevRoomData()
  data.notes = notes.value
  setDevRoomData(data)
}

// Agrupa gravações (ex.: arrastar uma nota gera muitos eventos).
watch(notes, () => {
  if (applying) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNotes, 300)
}, { deep: true })

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== DATA_KEY) return
    if (saveTimer) { saveNotes(); return }
    loadNotes()
  })
  window.addEventListener('pagehide', () => { if (saveTimer) saveNotes() })
}

export { notes, loadNotes, saveNotes, STORAGE_KEY }
