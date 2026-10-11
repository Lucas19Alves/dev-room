import { ref, watch } from 'vue'

// Rascunho salvo só neste navegador (não entra no backup do GitHub).
export function useLocalDraft(key, fallback, maxLength = 200000) {
  let initial = fallback
  try {
    const saved = localStorage.getItem(`dev-room-draft:${key}`)
    if (saved !== null) initial = JSON.parse(saved)
  } catch {}
  const state = ref(initial)
  let timer = 0
  watch(state, value => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        const text = JSON.stringify(value)
        if (text.length <= maxLength) localStorage.setItem(`dev-room-draft:${key}`, text)
      } catch {}
    }, 300)
  }, { deep: true })
  return state
}
