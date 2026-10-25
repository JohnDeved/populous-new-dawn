import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { Music } from '../app/music.ts'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture(t) {
  const state = {
    requests: [],
    reads: 0,
    decodes: 0,
    fetch: async () => response(),
    read: async () => new ArrayBuffer(0),
    decode: async () => ({}),
  }
  function response() {
    return { ok: true, arrayBuffer() { state.reads++; return state.read() } }
  }
  const node = () => ({ connect() {}, disconnect() {} })
  const context = {
    currentTime: 0,
    createGain: () => ({ ...node(), gain: { value: 0 } }),
    createMediaElementSource: node,
    decodeAudioData(bytes) { state.decodes++; return state.decode(bytes) },
  }
  const originalAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio')
  globalThis.Audio = class {
    currentTime = 0
    pause() {}
    removeAttribute() {}
    load() {}
  }
  t.mock.method(globalThis, 'fetch', (url, options) => {
    state.requests.push({ url, signal: options?.signal })
    return state.fetch(url, options)
  })
  const instances = []
  function create() {
    const music = new Music(context, {}, { randomState: 1 })
    instances.push(music)
    return music
  }
  t.after(() => {
    for (const music of instances) music.dispose()
    if (originalAudio) Object.defineProperty(globalThis, 'Audio', originalAudio)
    else delete globalThis.Audio
  })
  return { state, response, create }
}

test('disposing music aborts only its requests and skips late response bodies and decoding', async t => {
  const { state, response, create } = fixture(t), fetch = deferred()
  state.fetch = () => fetch.promise
  const music = create()
  assert.ok(state.requests.length > 0)
  music.dispose()
  music.dispose()
  fetch.resolve(response()) // Also exercise a transport that ignores abort.
  await music.loading
  assert.equal(state.reads, 0)
  assert.equal(state.decodes, 0)
  assert.ok(state.requests.every(request => request.signal?.aborted))
  assert.equal(new Set(state.requests.map(request => request.signal)).size, 1)
  assert.deepEqual(music.clips, [])
})

test('disposing during response body loading skips decoding when the bytes arrive', async t => {
  const { state, create } = fixture(t), body = deferred()
  state.read = () => body.promise
  const music = create()
  await setImmediate()
  assert.equal(state.reads, state.requests.length)
  music.dispose()
  body.resolve(new ArrayBuffer(0))
  await music.loading
  assert.equal(state.decodes, 0)
  assert.ok(state.requests.every(request => request.signal?.aborted))
})

test('an owned fetch abort settles loading without an unhandled rejection', async t => {
  const { state, create } = fixture(t), pending = []
  state.fetch = (_url, options) => {
    const request = deferred()
    pending.push(request)
    options?.signal.addEventListener('abort', () => request.reject(options.signal.reason), { once: true })
    return request.promise
  }
  const music = create()
  music.dispose()
  // Resolve as a failure too if the baseline has not provided an abort signal.
  for (const request of pending) request.reject(new Error('cancelled transport'))
  // An unobserved rejection during this turn also fails the Node test runner.
  await setImmediate()
  await music.loading
  assert.equal(state.decodes, 0)
})

for (const stage of ['fetch', 'body', 'decode']) {
  test(`late ${stage} failure after disposal is cancelled, not a loading failure`, async t => {
    const { state, create } = fixture(t), pending = deferred()
    state[stage === 'body' ? 'read' : stage] = () => pending.promise
    const music = create(), loading = assert.doesNotReject(music.loading)
    await setImmediate()
    music.dispose()
    pending.reject(new Error(`disposed ${stage} failed`))
    await loading
    assert.deepEqual(music.clips, [])
  })
}

test('a decode already in progress is allowed to finish without restoring disposed clips', async t => {
  const { state, create } = fixture(t), decode = deferred()
  state.decode = () => decode.promise
  const music = create()
  await setImmediate()
  assert.equal(state.decodes, state.requests.length)
  music.dispose()
  decode.resolve({})
  await music.loading
  assert.deepEqual(music.clips, [])
})

test('disposing one music owner leaves another owner loading independently', async t => {
  const { state, response, create } = fixture(t), fetch = deferred()
  state.fetch = () => fetch.promise
  const old = create(), count = state.requests.length, current = create()
  old.dispose()
  fetch.resolve(response())
  await Promise.all([old.loading, current.loading])
  assert.ok(state.requests.slice(0, count).every(request => request.signal?.aborted))
  assert.ok(state.requests.slice(count).every(request => request.signal && !request.signal.aborted))
  assert.equal(state.decodes, count)
  assert.deepEqual(old.clips, [])
  assert.equal(current.clips.filter(Boolean).length, count)
})

test('reset retains pending and completed percussion for continued playback', async t => {
  const { state, response, create } = fixture(t), fetch = deferred()
  state.fetch = () => fetch.promise
  const music = create(), count = state.requests.length
  music.reset()
  fetch.resolve(response())
  await music.loading
  assert.ok(state.requests.every(request => !request.signal?.aborted))
  assert.equal(music.clips.filter(Boolean).length, count)
  const clips = music.clips
  music.reset()
  assert.equal(music.clips, clips)
  assert.equal(state.requests.length, count)
})

for (const stage of ['fetch', 'body', 'decode']) {
  test(`current music preserves genuine ${stage} failures`, async t => {
    const { state, create } = fixture(t), failure = new Error(`current ${stage} failed`)
    state[stage === 'body' ? 'read' : stage] = async () => { throw failure }
    const music = create()
    await assert.rejects(music.loading, error => error === failure)
    assert.equal(music.disposed, false)
  })
}

test('current music preserves an unsuccessful HTTP response', async t => {
  const { state, create } = fixture(t)
  state.fetch = async () => ({ ok: false })
  const music = create()
  await assert.rejects(music.loading, /Music sample failed:/)
  assert.equal(state.reads, 0)
  assert.equal(state.decodes, 0)
})
