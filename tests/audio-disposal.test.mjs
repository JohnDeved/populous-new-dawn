import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { Soundscape } from '../app/audio.ts'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture(t) {
  const state = {
    requests: [], bodies: 0, decodes: 0, plays: 0, starts: 0, timers: 0,
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
    decode: async () => ({}),
  }
  const node = () => ({ connect() {}, disconnect() {} })
  const gain = () => ({ ...node(), gain: { value: 0, setValueAtTime() {} } })
  const sound = new Soundscape()
  sound.context = {
    state: 'suspended', currentTime: 0,
    createGain: gain,
    createStereoPanner() { return { ...node(), pan: { value: 0 } } },
    createBufferSource() {
      let ended
      return { ...node(), playbackRate: { value: 1 }, addEventListener(_event, callback) { ended = callback }, start() { state.starts++ }, stop() { ended?.() } }
    },
    decodeAudioData(bytes) { state.decodes++; return state.decode(bytes) },
    async resume() { this.state = 'running' },
    async suspend() { this.state = 'suspended' },
    async close() { this.state = 'closed' },
  }
  sound.master = gain()
  sound.music = {
    loading: Promise.resolve(), gain: gain(), disposed: false,
    element: { play: async () => { state.plays++ }, pause() {} },
    dispose() { this.disposed = true },
  }
  t.mock.method(globalThis, 'fetch', (url, options) => {
    state.requests.push({ url, signal: options?.signal })
    return state.fetch(url, options)
  })
  t.mock.method(globalThis, 'setInterval', () => { state.timers++; return {} })
  t.mock.method(globalThis, 'clearInterval', () => {})
  t.after(() => sound.dispose())
  return { sound, state }
}

function noPlayback(sound, state) {
  assert.equal(sound.enabled, false)
  assert.equal(sound.buffers.size, 0)
  assert.equal(sound.loading, null)
  assert.equal(sound.backgroundTimer, null)
  assert.deepEqual([state.plays, state.starts, state.timers], [0, 0, 0])
}

test('dispose aborts already-started cue fetches and resolves cancelled enable without playback', async t => {
  const { sound, state } = fixture(t), pending = [], aborted = []
  state.fetch = (url, { signal } = {}) => {
    const request = deferred()
    pending.push(request)
    signal?.addEventListener('abort', () => {
      aborted.push(url)
      request.reject(new DOMException('Disposed', 'AbortError'))
    }, { once: true })
    return request.promise
  }
  const enabling = sound.enable()
  try {
    await setImmediate()
    assert.ok(state.requests.length > 0)
    sound.dispose()
    assert.equal(aborted.length, state.requests.length, 'all owned requests must receive abort')
    assert.equal(await enabling, false)
    assert.equal(state.decodes, 0)
    noPlayback(sound, state)
  } finally {
    sound.dispose()
    for (const request of pending) request.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
    await Promise.allSettled([enabling])
  }
})

test('dispose before a late cue response prevents reading its body even if fetch ignores abort', async t => {
  const { sound, state } = fixture(t), response = deferred()
  state.fetch = () => response.promise
  const enabling = sound.enable()
  await setImmediate()
  assert.ok(state.requests.length > 0)
  sound.dispose()
  response.resolve({ ok: true, arrayBuffer: async () => { state.bodies++; return new ArrayBuffer(0) } })
  assert.equal(await enabling, false)
  assert.equal(state.bodies, 0)
  assert.equal(state.decodes, 0)
  noPlayback(sound, state)
})

test('dispose during cue body reads prevents all later decodes', async t => {
  const { sound, state } = fixture(t), bytes = deferred()
  state.fetch = async () => ({ ok: true, arrayBuffer: () => { state.bodies++; return bytes.promise } })
  const enabling = sound.enable()
  await setImmediate()
  assert.ok(state.bodies > 0)
  sound.dispose()
  bytes.resolve(new ArrayBuffer(0))
  assert.equal(await enabling, false)
  assert.equal(state.decodes, 0)
  noPlayback(sound, state)
})

test('dispose discards already-running cue decodes and releases the shared loading reference', async t => {
  const { sound, state } = fixture(t), decoded = deferred()
  state.decode = () => decoded.promise
  const enabling = sound.enable()
  await setImmediate()
  assert.ok(state.decodes > 0)
  const decodes = state.decodes
  sound.dispose()
  const loadingAfterDisposal = sound.loading
  decoded.resolve({})
  assert.equal(await enabling, false)
  assert.equal(state.decodes, decodes)
  assert.equal(loadingAfterDisposal, null)
  noPlayback(sound, state)
})

for (const stage of ['fetch', 'body', 'decode']) {
  test(`dispose observes a late ${stage} rejection without reporting an obsolete cue failure`, async t => {
    const { sound, state } = fixture(t), pending = deferred()
    if (stage === 'fetch') state.fetch = () => pending.promise
    if (stage === 'body') state.fetch = async () => ({ ok: true, arrayBuffer: () => pending.promise })
    if (stage === 'decode') state.decode = () => pending.promise
    const enabling = sound.enable()
    const result = enabling.then(value => value, error => error)
    await setImmediate()
    sound.dispose()
    pending.reject(new Error(`late ${stage} failure`))
    assert.equal(await result, false)
    noPlayback(sound, state)
  })
}

test('mute during cue loading retains the shared owner for a newer enable', async t => {
  const { sound, state } = fixture(t), bytes = deferred()
  state.fetch = async () => ({ ok: true, arrayBuffer: () => bytes.promise })
  const stale = sound.enable()
  await setImmediate()
  const loading = sound.loading, music = sound.music, requests = state.requests.length
  sound.mute()
  const current = sound.enable()
  await setImmediate()
  assert.equal(sound.loading, loading)
  assert.equal(state.requests.length, requests)
  assert.ok(state.requests.every(request => !request.signal?.aborted))
  bytes.resolve(new ArrayBuffer(0))
  assert.deepEqual(await Promise.all([stale, current]), [false, true])
  assert.equal(sound.enabled, true)
  assert.equal(sound.music, music)
  assert.equal(music.disposed, false)
  assert.ok(sound.buffers.size > 0)
  sound.mute()
  assert.equal(await sound.enable(), true)
  assert.equal(sound.loading, loading)
  assert.equal(state.requests.length, requests, 'successful cache remains reusable')
})

for (const stage of ['fetch', 'http', 'body', 'decode']) {
  test(`a live ${stage} failure still rejects, clears loading, and permits retry`, async t => {
    const { sound, state } = fixture(t), failure = new Error(`live ${stage} failure`)
    if (stage === 'fetch') state.fetch = async () => { throw failure }
    if (stage === 'http') state.fetch = async () => ({ ok: false })
    if (stage === 'body') state.fetch = async () => ({ ok: true, arrayBuffer: async () => { throw failure } })
    if (stage === 'decode') state.decode = async () => { throw failure }
    const music = sound.music
    await assert.rejects(sound.enable(), error => stage === 'http' ? /Sound sample failed:/.test(error.message) : error === failure)
    assert.equal(sound.loading, null)
    assert.equal(sound.music, null)
    assert.equal(music.disposed, true)
    assert.ok(state.requests.every(request => !request.signal?.aborted), 'live failure must not cancel the lifetime owner')
    // Replace the failed Music stub as the real enable path would do.
    music.disposed = false
    sound.music = music
    state.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
    state.decode = async () => ({})
    assert.equal(await sound.enable(), true)
    assert.equal(sound.enabled, true)
    assert.ok(sound.buffers.size > 0)
  })
}

test('dispose also cancels failed-batch siblings after a successful cue retry', async t => {
  const { sound, state } = fixture(t), oldBytes = deferred(), failure = new Error('first cue failed')
  state.fetch = async () => {
    if (state.requests.length === 1) throw failure
    return { ok: true, arrayBuffer: () => oldBytes.promise }
  }
  const music = sound.music
  await assert.rejects(sound.enable(), error => error === failure)
  const oldRequests = [...state.requests]
  assert.ok(oldRequests.length > 1)
  music.disposed = false
  sound.music = music
  state.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
  assert.equal(await sound.enable(), true)
  const decodes = state.decodes
  sound.dispose()
  oldBytes.resolve(new ArrayBuffer(0))
  await setImmediate()
  assert.ok(oldRequests.every(request => request.signal?.aborted), 'failed-batch siblings remain lifetime-owned')
  assert.equal(state.decodes, decodes, 'failed-batch bodies must not start late decodes')
  assert.equal(sound.buffers.size, 0)
  assert.equal(sound.loading, null)
})
