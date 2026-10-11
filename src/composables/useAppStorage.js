import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData, DATA_KEY } from '../utils/storage'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// Estado de uma chave de `dev-room-data`, com gravação agrupada e
// atualização quando outra aba ou o backup do GitHub alteram a mesma chave.
export function useAppStorage(key, fallback, delay = 250) {
  const initialData = getDevRoomData()
  const state = ref(clone(initialData[key] ?? (typeof fallback === 'function' ? fallback() : fallback)))
  let saveTimer = null
  let applying = false

  function save() {
    clearTimeout(saveTimer)
    saveTimer = null
    const data = getDevRoomData()
    data[key] = clone(state.value)
    setDevRoomData(data)
  }

  function scheduleSave() {
    if (applying) return
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(save, delay)
  }

  function syncFromStorage(event) {
    if (event.key !== DATA_KEY || !event.newValue) return
    // Uma edição local ainda não gravada vence: grava agora em vez de descartar.
    if (saveTimer) { save(); return }
    try {
      const incoming = JSON.parse(event.newValue)[key]
      if (incoming === undefined || JSON.stringify(incoming) === JSON.stringify(state.value)) return
      applying = true
      state.value = clone(incoming)
      Promise.resolve().then(() => { applying = false })
    } catch {
      applying = false
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
