import { ref } from 'vue'

// Copia texto e expõe qual item foi copiado por último (para feedback visual).
export function useCopy() {
  const copied = ref(null)
  let timer = 0
  async function copy(text, id = true) {
    try {
      await navigator.clipboard.writeText(String(text))
    } catch {
      const el = document.createElement('textarea')
      el.value = String(text)
      document.body.appendChild(el)
      el.select()
      try { document.execCommand('copy') } catch {}
      el.remove()
    }
    copied.value = id
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, 1400)
  }
  return { copied, copy }
}
