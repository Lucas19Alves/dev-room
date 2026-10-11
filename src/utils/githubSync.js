// Backup no GitHub via REST, sem SDK: requisições condicionais (ETag) tornam a
// verificação periódica gratuita no limite de taxa, e o `sha` conhecido permite
// gravar com uma única chamada.
export const REPO_NAME = 'dev-room-data'
export const FILE_PATH = 'dev-room-data.json'
const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(status, message, retryAfter = 0) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

function retryDelay(response) {
  const retry = Number(response.headers.get('retry-after'))
  if (retry > 0) return retry * 1000
  const reset = Number(response.headers.get('x-ratelimit-reset'))
  if (response.headers.get('x-ratelimit-remaining') === '0' && reset) return Math.max(0, reset * 1000 - Date.now())
  return 0
}

export function createGitHubClient(token, fetcher = (...args) => globalThis.fetch(...args)) {
  return async function request(method, path, { body, etag, raw = false, keepalive = false } = {}) {
    const headers = {
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
    if (etag) headers['If-None-Match'] = etag
    if (body) headers['Content-Type'] = 'application/json'
    const response = await fetcher(`${API}${path}`, {
      method, headers, cache: 'no-store', keepalive,
      body: body ? JSON.stringify(body) : undefined
    })
    if (response.status === 304) return { status: 304, etag }
    const text = await response.text()
    let data = text
    if (!raw) { try { data = text ? JSON.parse(text) : null } catch { data = null } }
    if (!response.ok) {
      const limited = (response.status === 403 || response.status === 429) && (retryDelay(response) || /rate limit/i.test(data?.message || ''))
      throw new GitHubError(response.status, limited ? 'Limite de uso do GitHub atingido. O backup será retomado em instantes.' : (data?.message || `GitHub respondeu ${response.status}.`), limited ? retryDelay(response) || 60000 : 0)
    }
    return { status: response.status, data, etag: response.headers.get('etag') || '' }
  }
}

export function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export function decodeBase64(base64) {
  const binary = atob(base64.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

export async function getUser(api) {
  return (await api('GET', '/user')).data
}

// Garante um repositório privado; nunca cria após erros de permissão.
export async function ensureRepo(api, login) {
  try {
    const { data } = await api('GET', `/repos/${login}/${REPO_NAME}`)
    if (!data.private) throw new Error('O repositório dev-room-data precisa ser privado para sincronizar seus dados.')
  } catch (error) {
    if (error.status !== 404) throw error
    await api('POST', '/user/repos', { body: { name: REPO_NAME, private: true, auto_init: false, description: 'Backup dos dados do Dev Room' } })
  }
}

// Lê o backup. `notModified` indica que nada mudou desde o ETag informado.
export async function readBackup(api, login, etag) {
  const path = `/repos/${login}/${REPO_NAME}/contents/${FILE_PATH}`
  try {
    const response = await api('GET', path, { etag })
    if (response.status === 304) return { notModified: true, etag }
    const file = response.data
    // Acima de 1 MB a API não inclui o conteúdo; busca a versão bruta.
    const text = file.encoding === 'base64' && file.content ? decodeBase64(file.content) : (await api('GET', path, { raw: true })).data
    let data
    try { data = JSON.parse(text || '{}') } catch { throw new Error('Backup inválido no GitHub.') }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Backup inválido no GitHub.')
    return { data, sha: file.sha, etag: response.etag }
  } catch (error) {
    if (error.status === 404) return { missing: true }
    throw error
  }
}

// Grava o backup. Retorna o novo sha; erros 409/422 indicam versão desatualizada.
export async function writeBackup(api, login, text, sha, { keepalive = false } = {}) {
  const { data } = await api('PUT', `/repos/${login}/${REPO_NAME}/contents/${FILE_PATH}`, {
    keepalive,
    body: { message: 'Sincroniza dados do Dev Room', content: encodeBase64(text), ...(sha ? { sha } : {}) }
  })
  return data.content.sha
}
