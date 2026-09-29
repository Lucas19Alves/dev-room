import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createOAuthRequest, consumeOAuthRequest, OAUTH_STATE_KEY } from '../src/utils/oauth.js'
import { restoreWindows } from '../src/utils/windowState.js'
import { getDevRoomData, setDevRoomData } from '../src/utils/storage.js'
import { ensureRepo } from '../src/utils/githubSync.js'
import callback from '../api/github-callback.js'
import config from '../api/github-config.js'

function memoryStorage() {
  const entries = new Map()
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) }
}
function response() {
  return { statusCode: 0, headers: {}, setHeader(k,v) { this.headers[k] = v }, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}
test('OAuth uses S256 PKCE and consumes state only once', async () => {
  const storage = memoryStorage()
  const url = new URL(await createOAuthRequest('client', 'https://dev-room-three.vercel.app/', storage))
  const pending = consumeOAuthRequest(url.searchParams.get('state'), storage)
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(pending.verifier).digest('base64url'))
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(consumeOAuthRequest(url.searchParams.get('state'), storage), null)
})
test('OAuth rejects mismatched and expired state', async () => {
  const storage = memoryStorage()
  await createOAuthRequest('client', 'https://dev-room-three.vercel.app/', storage)
  assert.equal(consumeOAuthRequest('forged', storage), null)
  storage.setItem(OAUTH_STATE_KEY, JSON.stringify({ state: 'old', createdAt: Date.now() - 600001 }))
  assert.equal(consumeOAuthRequest('old', storage), null)
})
test('Corrupt persisted windows are filtered and offscreen windows recover', () => {
  const tools = [{ type: 'Timer', label: 'Timer' }]
  assert.deepEqual(restoreWindows({}, tools, 900, 600), [])
  const result = restoreWindows([null, { type: 'missing' }, { type: 'Timer', x: 9000, y: -10, width: 5000 }, { type: 'Timer' }], tools, 900, 600)
  assert.equal(result.length, 1)
  assert.equal(result[0].width, 868)
  assert.equal(result[0].x, 32)
  assert.equal(result[0].y, 0)
})
test('Every real storage change advances its timestamp; remote echoes do not', () => {
  globalThis.localStorage = memoryStorage()
  assert.deepEqual(getDevRoomData(), {})
  localStorage.setItem('dev-room-data', '[]')
  assert.deepEqual(getDevRoomData(), {})
  setDevRoomData({ todos: ['one'] })
  const first = getDevRoomData().lastModified
  setDevRoomData({ todos: ['two'] })
  assert.ok(getDevRoomData().lastModified > first)
  const current = getDevRoomData().lastModified
  setDevRoomData({ todos: ['two'] })
  assert.equal(getDevRoomData().lastModified, current)
})
test('Backup never creates a repo for permission failures or writes to a public repo', async () => {
  let created = false
  const client = { repos: { get: async () => { throw { status: 401 } }, createForAuthenticatedUser: async () => { created = true } } }
  await assert.rejects(ensureRepo(client, 'dev'))
  assert.equal(created, false)
  client.repos.get = async () => ({ data: { private: false } })
  await assert.rejects(ensureRepo(client, 'dev'), /privado/)
  client.repos.get = async () => { throw { status: 404 } }
  await ensureRepo(client, 'dev')
  assert.equal(created, true)
})
test('Callback rejects malformed PKCE before contacting GitHub', async () => {
  const res = response()
  await callback({ method: 'POST', body: { code: 'code', verifier: 'short', redirectUri: 'https://dev-room-three.vercel.app/' } }, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.headers['Cache-Control'], 'no-store')
})
test('Callback handles successful exchange and GitHub refusal without leaking secrets', async () => {
  const originalFetch = globalThis.fetch
  const oldId = process.env.GITHUB_CLIENT_ID
  const oldSecret = process.env.GITHUB_CLIENT_SECRET
  process.env.GITHUB_CLIENT_ID = ' test-client\n'
  process.env.GITHUB_CLIENT_SECRET = ' test-secret\n'
  try {
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)
      assert.equal(body.code_verifier, 'a'.repeat(64))
      assert.equal(body.client_id, 'test-client')
      assert.equal(body.client_secret, 'test-secret')
      return { ok: true, json: async () => ({ access_token: 'test-token', scope: 'repo' }) }
    }
    const req = { method: 'POST', body: { code: 'test-code', verifier: 'a'.repeat(64), redirectUri: 'https://dev-room-three.vercel.app/' } }
    const success = response()
    await callback(req, success)
    assert.deepEqual(success.body, { access_token: 'test-token' })
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: 'bad_verification_code' }) })
    const failure = response()
    await callback(req, failure)
    assert.equal(failure.statusCode, 401)
    assert.equal(failure.body.errorCode, 'bad_verification_code')
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: 'incorrect_client_credentials', error_description: 'sensitive upstream data' }) })
    const invalidCredentials = response()
    await callback(req, invalidCredentials)
    assert.equal(invalidCredentials.body.errorCode, 'incorrect_client_credentials')
    assert.equal(JSON.stringify(invalidCredentials.body).includes('sensitive upstream data'), false)
    const configured = response()
    config({ method: 'GET' }, configured)
    assert.equal(configured.body.clientId, 'test-client')
    assert.equal(JSON.stringify(configured.body).includes('test-secret'), false)
  } finally {
    globalThis.fetch = originalFetch
    if (oldId === undefined) delete process.env.GITHUB_CLIENT_ID; else process.env.GITHUB_CLIENT_ID = oldId
    if (oldSecret === undefined) delete process.env.GITHUB_CLIENT_SECRET; else process.env.GITHUB_CLIENT_SECRET = oldSecret
  }
})
