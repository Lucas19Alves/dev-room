import { ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

const STORAGE_KEY = 'dev-room-data' // agora sempre usa o objeto principal!
const notes = ref(getDevRoomData().notes || [])

function loadNotes() {
  const allData = getDevRoomData()
  notes.value = allData.notes || []
}

function saveNotes() {
  const allData = getDevRoomData()
  allData.notes = notes.value
  setDevRoomData(allData)
}

watch(notes, saveNotes, { deep: true })

export { notes, loadNotes, saveNotes, STORAGE_KEY }