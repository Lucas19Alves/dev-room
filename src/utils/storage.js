// Objeto principal do Dev Room no localStorage.
// Cada chave guarda o instante da última alteração em `_clock`, o que permite
// mesclar dispositivos chave a chave em vez de sobrescrever tudo.
export const DATA_KEY = 'dev-room-data'
export const CHANGE_EVENT = 'devroom-data-change'
// Estado efêmero de um único dispositivo, nunca enviado ao backup.
export const LOCAL_ONLY_KEYS = new Set(['timer'])
const META_KEYS = new Set(['lastModified', '_clock'])

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

export function getDevRoomData() {
  try {
    const data = JSON.parse(localStorage.getItem(DATA_KEY))
    return isObject(data) ? data : {}
  } catch {
    return {}
  }
}

export function contentKeys(data) {
  return Object.keys(data).filter(key => !META_KEYS.has(key))
}

function maxClock(clock, fallback = 0) {
  return Math.max(Number(fallback) || 0, ...Object.values(clock).map(Number).filter(Number.isFinite))
}

export function setDevRoomData(newData, { remote = false } = {}) {
  const previous = localStorage.getItem(DATA_KEY)
  const previousData = getDevRoomData()
  const previousClock = isObject(previousData._clock) ? previousData._clock : {}
  const content = Object.fromEntries(contentKeys(newData).filter(key => newData[key] !== undefined).map(key => [key, newData[key]]))
  let clock
  const changed = []

  if (remote) {
    clock = isObject(newData._clock) ? { ...newData._clock } : {}
  } else {
    const now = Math.max(Date.now(), Number(previousData.lastModified || 0) + 1)
    clock = { ...previousClock }
    // Dados antigos sem `_clock`: preserva a data original das demais chaves.
    for (const key of contentKeys(previousData)) clock[key] ??= Number(previousData.lastModified) || 0
    for (const key of new Set([...contentKeys(previousData), ...Object.keys(content)])) {
      if (JSON.stringify(previousData[key]) !== JSON.stringify(content[key])) {
        clock[key] = now
        changed.push(key)
      }
    }
    if (!changed.length) return
  }

  const data = { ...content, _clock: clock, lastModified: maxClock(clock, remote ? newData.lastModified : 0) }
  const serialized = JSON.stringify(data)
  localStorage.setItem(DATA_KEY, serialized)
  localStorage.setItem('dev-room-lastModified', String(data.lastModified))
  if (typeof window === 'undefined') return
  if (remote) window.dispatchEvent(new StorageEvent('storage', { key: DATA_KEY, oldValue: previous, newValue: serialized }))
  else window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { keys: changed } }))
}

// Conteúdo enviado ao GitHub: sem estado local nem metadados derivados.
export function toSyncPayload(data) {
  const clock = isObject(data._clock) ? data._clock : {}
  const payload = { _clock: {} }
  for (const key of new Set([...contentKeys(data), ...Object.keys(clock)])) {
    if (LOCAL_ONLY_KEYS.has(key)) continue
    if (data[key] !== undefined) payload[key] = data[key]
    const time = clock[key] ?? (data[key] !== undefined ? Number(data.lastModified) || 0 : undefined)
    if (time !== undefined) payload._clock[key] = time
  }
  payload.lastModified = maxClock(payload._clock)
  return payload
}

// Mescla chave a chave: vence a alteração mais recente de cada ferramenta.
// Dados antigos sem `_clock` usam `lastModified` como data de todas as chaves.
// `preferRemote` protege o primeiro acesso de um dispositivo novo, cujos valores
// padrão recém-criados não devem substituir o backup existente.
export function mergeData(local, remote, { preferRemote = false } = {}) {
  const localClock = isObject(local._clock) ? local._clock : {}
  const remoteClock = isObject(remote._clock) ? remote._clock : {}
  const time = (data, clock, key) => Number(clock[key] ?? (data[key] !== undefined ? data.lastModified || 0 : 0))
  const merged = {}
  const clock = {}
  const keys = new Set([...contentKeys(local), ...contentKeys(remote), ...Object.keys(localClock), ...Object.keys(remoteClock)])
  for (const key of keys) {
    const localTime = time(local, localClock, key)
    const remoteTime = time(remote, remoteClock, key)
    const useRemote = !LOCAL_ONLY_KEYS.has(key) && (remoteTime > localTime || (preferRemote && remote[key] !== undefined))
    const source = useRemote ? remote : local
    if (source[key] !== undefined) merged[key] = source[key]
    const winner = useRemote ? remoteTime : localTime
    if (winner) clock[key] = winner
  }
  merged._clock = clock
  merged.lastModified = maxClock(clock, Math.max(Number(local.lastModified) || 0, Number(remote.lastModified) || 0))
  return merged
}

// Hash curto e estável (cyrb53) para detectar alterações sem guardar cópias.
export function hashString(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

// Serialização com chaves ordenadas: o mesmo conteúdo gera sempre o mesmo texto.
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isObject(value)) return `{${Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
