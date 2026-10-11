// Funções puras usadas pelas ferramentas de desenvolvimento.

// ---------- JSON ----------
export function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeysDeep(value[key])]))
  }
  return value
}

// Localiza linha/coluna do primeiro erro de sintaxe JSON (o V8 nem sempre informa a posição).
export function jsonErrorLocation(text) {
  let i = 0
  const fail = () => { throw i }
  const ws = () => { while (/\s/.test(text[i] || '')) i++ }
  const literal = word => { if (text.startsWith(word, i)) i += word.length; else fail() }
  function string() {
    i++
    while (i < text.length && text[i] !== '"') {
      if (text[i] === '\\') { i++; if (text[i] === 'u') { if (!/^[0-9a-f]{4}$/i.test(text.slice(i + 1, i + 5))) fail(); i += 4 } else if (!'"\\/bfnrt'.includes(text[i])) fail() }
      else if (text.charCodeAt(i) < 32) fail()
      i++
    }
    if (text[i] !== '"') fail()
    i++
  }
  function number() {
    const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i))
    if (!match) fail()
    i += match[0].length
  }
  function value() {
    ws()
    const ch = text[i]
    if (ch === '{') {
      i++; ws()
      if (text[i] === '}') { i++; return }
      while (true) {
        ws(); if (text[i] !== '"') fail(); string(); ws()
        if (text[i] !== ':') fail(); i++; value(); ws()
        if (text[i] === ',') { i++; continue }
        if (text[i] === '}') { i++; return }
        fail()
      }
    } else if (ch === '[') {
      i++; ws()
      if (text[i] === ']') { i++; return }
      while (true) {
        value(); ws()
        if (text[i] === ',') { i++; continue }
        if (text[i] === ']') { i++; return }
        fail()
      }
    } else if (ch === '"') string()
    else if (ch === 't') literal('true')
    else if (ch === 'f') literal('false')
    else if (ch === 'n') literal('null')
    else number()
  }
  try {
    value(); ws()
    if (i < text.length) fail()
    return null
  } catch (position) {
    if (typeof position !== 'number') throw position
    const before = text.slice(0, position).split('\n')
    return { line: before.length, column: before[before.length - 1].length + 1, position }
  }
}

const identifier = /^[A-Za-z_$][\w$]*$/
const pascal = text => String(text).replace(/(^|[^A-Za-z0-9]+)([A-Za-z0-9])/g, (_, __, ch) => ch.toUpperCase()).replace(/^[^A-Za-z]+/, '') || 'Item'

// Gera interfaces TypeScript a partir de um valor JSON.
export function jsonToTypeScript(value, rootName = 'Root') {
  const interfaces = new Map()
  function typeOf(input, name) {
    if (input === null) return 'null'
    if (Array.isArray(input)) {
      if (!input.length) return 'unknown[]'
      const objects = input.filter(item => item && typeof item === 'object' && !Array.isArray(item))
      const types = new Set(input.filter(item => !objects.includes(item)).map(item => typeOf(item, name)))
      if (objects.length) types.add(typeOf(Object.assign({}, ...objects), name.replace(/s$/, '') || name))
      const union = [...types].join(' | ')
      return types.size > 1 ? `(${union})[]` : `${union}[]`
    }
    if (typeof input === 'object') {
      const interfaceName = pascal(name)
      const lines = Object.entries(input).map(([key, val]) => `  ${identifier.test(key) ? key : JSON.stringify(key)}: ${typeOf(val, key)};`)
      interfaces.set(interfaceName, `interface ${interfaceName} {\n${lines.join('\n')}\n}`)
      return interfaceName
    }
    return typeof input
  }
  const root = typeOf(value, rootName)
  const body = [...interfaces.values()].reverse().join('\n\n')
  return interfaces.has(pascal(rootName)) ? body : `${body ? `${body}\n\n` : ''}type ${pascal(rootName)} = ${root};`
}

// ---------- Codificação ----------
export function utf8ToBase64(text, urlSafe = false) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const base64 = btoa(binary)
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64
}

export function base64ToUtf8(text) {
  let clean = text.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')
  while (clean.length % 4) clean += '='
  const binary = atob(clean)
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, ch => ch.charCodeAt(0)))
}

const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export function encodeHtml(text) {
  return text.replace(/[&<>"']/g, ch => htmlEntities[ch])
}
export function decodeHtml(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity
    }
    return named[code.toLowerCase()] ?? entity
  })
}

export function decodeJwt(token) {
  const parts = token.trim().split('.')
  if (parts.length < 2) throw new Error('Um JWT tem 3 partes separadas por ponto.')
  const parse = (part, label) => {
    try { return JSON.parse(base64ToUtf8(part)) } catch { throw new Error(`Não foi possível ler o ${label}.`) }
  }
  const header = parse(parts[0], 'cabeçalho')
  const payload = parse(parts[1], 'conteúdo')
  const claims = {}
  for (const key of ['iat', 'nbf', 'exp']) if (Number.isFinite(payload[key])) claims[key] = new Date(payload[key] * 1000)
  return { header, payload, claims, expired: claims.exp ? claims.exp.getTime() < Date.now() : null, signature: parts[2] || '' }
}

export async function digest(algorithm, text) {
  const hash = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

// ---------- Cores ----------
export function parseColor(input) {
  const text = String(input).trim().toLowerCase()
  let match = /^#?([0-9a-f]{3,8})$/.exec(text)
  if (match && [3, 4, 6, 8].includes(match[1].length)) {
    let hex = match[1]
    if (hex.length <= 4) hex = [...hex].map(ch => ch + ch).join('')
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }
  match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(text)
  if (match) {
    const alpha = match[4] === undefined ? 1 : match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])
    return { r: clamp(+match[1], 255), g: clamp(+match[2], 255), b: clamp(+match[3], 255), a: clamp(alpha, 1) }
  }
  match = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(text)
  if (match) {
    const alpha = match[4] === undefined ? 1 : match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])
    return { ...hslToRgb(+match[1], +match[2], +match[3]), a: clamp(alpha, 1) }
  }
  return null
}

const clamp = (value, max) => Math.min(max, Math.max(0, value))

export function rgbToHex({ r, g, b, a = 1 }) {
  const hex = [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
  return `#${hex}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) }
}

export function luminance({ r, g, b }) {
  const channel = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// ---------- Diff ----------
// Diff por linhas (LCS). Retorna [{ type: 'same'|'add'|'del', text, a?, b? }].
export function diffLines(before, after, { ignoreWhitespace = false } = {}) {
  const a = before.split('\n')
  const b = after.split('\n')
  const norm = ignoreWhitespace ? line => line.trim().replace(/\s+/g, ' ') : line => line
  // Remove prefixo e sufixo iguais para reduzir a matriz.
  let start = 0
  while (start < a.length && start < b.length && norm(a[start]) === norm(b[start])) start++
  let endA = a.length, endB = b.length
  while (endA > start && endB > start && norm(a[endA - 1]) === norm(b[endB - 1])) { endA--; endB-- }
  const midA = a.slice(start, endA), midB = b.slice(start, endB)
  if (midA.length * midB.length > 4_000_000) throw new Error('Textos grandes demais para comparar.')
  const n = midA.length, m = midB.length
  const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = norm(midA[i]) === norm(midB[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const result = a.slice(0, start).map((text, i) => ({ type: 'same', text, a: i + 1, b: i + 1 }))
  let i = 0, j = 0
  while (i < n || j < m) {
    if (i < n && j < m && norm(midA[i]) === norm(midB[j])) { result.push({ type: 'same', text: midB[j], a: start + i + 1, b: start + j + 1 }); i++; j++ }
    else if (i < n && (j === m || table[i + 1][j] >= table[i][j + 1])) { result.push({ type: 'del', text: midA[i], a: start + i + 1 }); i++ }
    else { result.push({ type: 'add', text: midB[j], b: start + j + 1 }); j++ }
  }
  for (let k = 0; k < a.length - endA; k++) result.push({ type: 'same', text: a[endA + k], a: endA + k + 1, b: endB + k + 1 })
  return result
}

// ---------- Tempo ----------
export function parseTimestamp(input) {
  const text = String(input).trim()
  if (!text) return null
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const value = Number(text)
    // Até 11 dígitos: segundos; acima disso: milissegundos.
    const ms = Math.abs(value) < 1e11 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : { date, unit: Math.abs(value) < 1e11 ? 's' : 'ms' }
  }
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : { date, unit: 'texto' }
}

export function relativeTime(date, now = Date.now()) {
  const diff = (date.getTime() - now) / 1000
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds || unit === 'second') return formatter.format(Math.round(diff / seconds), unit)
  }
}
