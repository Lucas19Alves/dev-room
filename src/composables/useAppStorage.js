import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function useAppStorage(key, fallback, delay = 250) {
  const initialData = getDevRoomData()
  const state = ref(clone(initialData[key] ?? fallback))
  let saveTimer = null

  function save() {
    clearTimeout(saveTimer)
    saveTimer = null
    const data = getDevRoomData()
    data[key] = clone(state.value)
    data.lastModified = Date.now()
    setDevRoomData(data)
  }

  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(save, delay)
  }

  function syncFromStorage(event) {
    if (event.key !== 'dev-room-data' || !event.newValue) return
    try {
      const incoming = JSON.parse(event.newValue)
      if (incoming[key] !== undefined) state.value = clone(incoming[key])
    } catch {
      // Ignora payloads incompletos de outras abas.
    }
  }

  watch(state, scheduleSave, { deep: true })
  onMounted(() => window.addEventListener('storage', syncFromStorage))
  onUnmounted(() => {
    window.removeEventListener('storage', syncFromStorage)
    if (saveTimer) save()
  })

  return { state, save }
}
