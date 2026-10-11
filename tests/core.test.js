import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createOAuthRequest, consumeOAuthRequest, OAUTH_STATE_KEY } from '../src/utils/oauth.js'
import { restoreWindows } from '../src/utils/windowState.js'
import { getDevRoomData, setDevRoomData, mergeData, toSyncPayload } from '../src/utils/storage.js'
import { ensureRepo, encodeBase64, decodeBase64, createGitHubClient } from '../src/utils/githubSync.js'
import { syncWithGitHub, loadSyncState } from '../src/utils/syncEngine.js'
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
  let repo = () => { throw { status: 401 } }
  const api = async (method) => {
    if (method === 'POST') { created = true; return { data: {} } }
    return { data: repo() }
  }
  await assert.rejects(ensureRepo(api, 'dev'))
  assert.equal(created, false)
  repo = () => ({ private: false })
  await assert.rejects(ensureRepo(api, 'dev'), /privado/)
  repo = () => { throw { status: 404 } }
  await ensureRepo(api, 'dev')
  assert.equal(created, true)
})
test('Merge keeps the newest version of each tool and honours deletions', () => {
  const local = { todos: ['local'], notes: ['old'], timer: { running: true }, _clock: { todos: 30, notes: 10, timer: 50 }, lastModified: 50 }
  const remote = { notes: ['remote'], kanban: ['k'], timer: { running: false }, _clock: { todos: 40, notes: 20, kanban: 5, timer: 60 }, lastModified: 60 }
  const merged = mergeData(local, remote)
  assert.equal(merged.todos, undefined)
  assert.deepEqual(merged.notes, ['remote'])
  assert.deepEqual(merged.kanban, ['k'])
  assert.deepEqual(merged.timer, { running: true })
  assert.equal(toSyncPayload(merged).timer, undefined)
  const legacy = mergeData({ todos: ['a'], lastModified: 5 }, { todos: ['b'], lastModified: 9 })
  assert.deepEqual(legacy.todos, ['b'])
  const fresh = mergeData({ kanban: ['default'], extra: 1, _clock: { kanban: 99, extra: 99 } }, { kanban: ['saved'], _clock: { kanban: 3 } }, { preferRemote: true })
  assert.deepEqual(fresh.kanban, ['saved'])
  assert.equal(fresh.extra, 1)
})
test('Base64 helpers round-trip unicode', () => {
  const text = JSON.stringify({ nota: 'Olá, ação ✓ 🚀' })
  assert.equal(decodeBase64(encodeBase64(text)), text)
})
function fakeGitHub() {
  const repo = { file: null, sha: 0, calls: [] }
  const fetcher = async (url, options) => {
    const path = url.replace('https://api.github.com', '')
    repo.calls.push(`${options.method} ${path}`)
    const reply = (status, body, headers = {}) => ({ ok: status < 400, status, headers: new Headers(headers), text: async () => body === undefined ? '' : JSON.stringify(body) })
    if (path.endsWith('/dev-room-data') && options.method === 'GET') return reply(200, { private: true })
    if (path.includes('/contents/') && options.method === 'GET') {
      if (!repo.file) return reply(404, { message: 'Not Found' })
      const etag = `"e${repo.sha}"`
      if (options.headers['If-None-Match'] === etag) return reply(304)
      return reply(200, { sha: `s${repo.sha}`, encoding: 'base64', content: encodeBase64(repo.file) }, { etag })
    }
    if (options.method === 'PUT') {
      const body = JSON.parse(options.body)
      if (repo.file && body.sha !== `s${repo.sha}`) return reply(409, { message: 'conflict' })
      repo.file = decodeBase64(body.content)
      repo.sha++
      return reply(200, { content: { sha: `s${repo.sha}` } })
    }
    return reply(500, { message: 'unexpected' })
  }
  return { repo, api: createGitHubClient('t', fetcher) }
}
test('Sync uploads once, then idles on cheap conditional requests', async () => {
  globalThis.localStorage = memoryStorage()
  const { repo, api } = fakeGitHub()
  setDevRoomData({ todos: ['one'], timer: { elapsed: 1 } })
  const session = {}
  await syncWithGitHub(api, 'dev', { session })
  assert.equal(JSON.parse(repo.file).todos[0], 'one')
  assert.equal(JSON.parse(repo.file).timer, undefined)
  repo.calls.length = 0
  await syncWithGitHub(api, 'dev', { session })
  await syncWithGitHub(api, 'dev', { session })
  assert.deepEqual(repo.calls.map(call => call.split(' ')[0]), ['GET', 'GET'])
  setDevRoomData({ ...getDevRoomData(), timer: { elapsed: 2 } })
  repo.calls.length = 0
  await syncWithGitHub(api, 'dev', { session })
  assert.deepEqual(repo.calls.map(call => call.split(' ')[0]), ['GET'])
  assert.ok(loadSyncState('dev').hash)
})
test('Sync merges changes made on another device without losing local edits', async () => {
  globalThis.localStorage = memoryStorage()
  const { repo, api } = fakeGitHub()
  setDevRoomData({ todos: ['one'], notes: ['n1'] })
  await syncWithGitHub(api, 'dev')
  const remote = JSON.parse(repo.file)
  remote.notes = ['from phone']
  remote._clock.notes = Date.now() + 1000
  repo.file = JSON.stringify(remote)
  repo.sha++
  setDevRoomData({ ...getDevRoomData(), todos: ['one', 'two'] })
  let applied = null
  await syncWithGitHub(api, 'dev', { applyRemote: data => { applied = data } })
  assert.deepEqual(getDevRoomData().notes, ['from phone'])
  assert.deepEqual(getDevRoomData().todos, ['one', 'two'])
  assert.deepEqual(JSON.parse(repo.file).todos, ['one', 'two'])
  assert.ok(applied)
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
test('Legacy data keeps its original timestamps after the first new edit', () => {
  globalThis.localStorage = memoryStorage()
  localStorage.setItem('dev-room-data', JSON.stringify({ todos: ['a'], notes: ['n'], lastModified: 100 }))
  setDevRoomData({ ...getDevRoomData(), todos: ['b'] })
  const data = getDevRoomData()
  assert.equal(data._clock.notes, 100)
  assert.ok(data._clock.todos > 100)
})
