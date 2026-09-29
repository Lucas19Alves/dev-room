export const OAUTH_STATE_KEY = 'dev-room-oauth'

export async function createOAuthRequest(clientId, redirectUri, storage = sessionStorage) {
  const state = crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  storage.setItem(OAUTH_STATE_KEY, JSON.stringify({ state, verifier, redirectUri, createdAt: Date.now() }))
  return `https://github.com/login/oauth/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: 'repo', state, code_challenge: challenge, code_challenge_method: 'S256' })}`
}

export function consumeOAuthRequest(returnedState, storage = sessionStorage) {
  const raw = storage.getItem(OAUTH_STATE_KEY)
  storage.removeItem(OAUTH_STATE_KEY)
  let pending
  try { pending = JSON.parse(raw) } catch { return null }
  if (!pending || pending.state !== returnedState || Date.now() - pending.createdAt > 600000) return null
  return pending
}
