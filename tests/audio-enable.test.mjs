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
  const state = { resume: async () => {}, fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }), requests: 0, decodes: 0, plays: 0, starts: 0, timers: 0 }
  const node = () => ({ connect() {}, disconnect() {} })
  const gain = () => ({ ...node(), gain: { value: 0, setValueAtTime() {} } })
  const globals = new Map(['Audio', 'AudioContext'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  globalThis.Audio = class {
    paused = true
    play() { state.plays++; this.paused = false; return Promise.resolve() }
    pause() { this.paused = true }
    removeAttribute() {}
    load() {}
  }
  globalThis.AudioContext = class {
    state = 'suspended'
    currentTime = 0
    destination = {}
    createGain = gain
    createMediaElementSource = node
    createStereoPanner() { return { ...node(), pan: { value: 0 } } }
    createBufferSource() {
      let ended
      return { ...node(), playbackRate: { value: 1 }, addEventListener(_event, callback) { ended = callback }, start() { state.starts++ }, stop() { ended?.() } }
    }
    decodeAudioData() { state.decodes++; return Promise.resolve({}) }
    async resume() { await state.resume(); this.state = 'running' }
    async suspend() { this.state = 'suspended' }
    async close() { this.state = 'closed' }
  }
  t.mock.method(globalThis, 'fetch', (...args) => { state.requests++; return state.fetch(...args) })
  t.mock.method(globalThis, 'setInterval', () => { state.timers++; return {} })
  t.mock.method(globalThis, 'clearInterval', () => {})
  const sound = new Soundscape()
  t.after(() => {
    sound.dispose()
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return { sound, state }
}

test('eager music rejection is observed while context resume is pending and still reaches the caller', async t => {
  const { sound, state } = fixture(t), resume = deferred(), failure = new Error('music download failed')
  state.resume = () => resume.promise
  state.fetch = async () => { throw failure }
  const enabling = assert.rejects(sound.enable(), error => error === failure)
  const music = sound.music
  // An unobserved rejection here also fails the Node test runner.
  await setImmediate()
  resume.resolve()
  await enabling
  assert.equal(music.disposed, true)
  assert.equal(sound.music, null)
  assert.equal(sound.enabled, false)
})

test('failed context resume releases failed Music so the next explicit enable can recover', async t => {
  const { sound, state } = fixture(t), failure = new Error('context resume failed')
  state.resume = async () => { throw failure }
  state.fetch = async () => { throw new Error('abandoned music failed') }
  await assert.rejects(sound.enable(), error => error === failure)
  sound.mute() // The ordinary sound-button error handler.
  await setImmediate()
  assert.equal(sound.music, null)
  state.resume = async () => {}
  state.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
  assert.equal(await sound.enable(), true)
  assert.equal(sound.enabled, true)
  assert.equal(sound.music.disposed, false)
})

test('a late failed enable cleans only its captured Music and leaves a newer successful owner intact', async t => {
  const { sound, state } = fixture(t), firstResume = deferred(), failure = new Error('old resume failed')
  state.resume = () => firstResume.promise
  const first = assert.rejects(sound.enable(), error => error === failure), oldMusic = sound.music
  state.resume = async () => { throw new Error('second resume failed') }
  await assert.rejects(sound.enable(), /second resume failed/)
  assert.equal(oldMusic.disposed, true)
  state.resume = async () => {}
  assert.equal(await sound.enable(), true)
  const current = sound.music
  firstResume.reject(failure)
  await first
  assert.equal(sound.music, current)
  assert.equal(current.disposed, false)
  assert.equal(sound.enabled, true)
})

test('successful mute and explicit re-enable reuse loaded audio without another fetch', async t => {
  const { sound, state } = fixture(t)
  assert.equal(await sound.enable(), true)
  const music = sound.music, loading = sound.loading, requests = state.requests
  sound.mute()
  assert.equal(await sound.enable(), true)
  assert.equal(sound.music, music)
  assert.equal(sound.loading, loading)
  assert.equal(state.requests, requests)
})

for (const action of ['mute', 'dispose']) {
  test(`${action} during startup prevents delayed resume from starting sample work`, async t => {
    const { sound, state } = fixture(t), resume = deferred()
    state.resume = () => resume.promise
    const enabling = sound.enable()
    // Music loads eagerly, before resume. Isolate the sample work started after it.
    await sound.music.loading
    const { requests, decodes } = state
    sound[action]()
    resume.resolve()
    assert.equal(await enabling, false)
    assert.equal(state.requests, requests, 'cancelled startup must not start sample fetches')
    assert.equal(state.decodes, decodes, 'cancelled startup must not start sample decodes')
    assert.equal(sound.loading, null)
    assert.equal(sound.buffers.size, 0)
    assert.equal(sound.enabled, false)
    assert.equal(state.plays, 0)
    assert.equal(state.starts, 0)
    assert.equal(state.timers, 0)
    assert.equal(sound.backgroundTimer, null)
  })
}

test('a muted startup leaves the newer enable and its loaded cache intact', async t => {
  const { sound, state } = fixture(t), resume = deferred()
  state.resume = () => resume.promise
  const stale = sound.enable()
  await sound.music.loading
  sound.mute()
  state.resume = async () => {}
  assert.equal(await sound.enable(), true)
  const music = sound.music, loading = sound.loading
  const buffers = [...sound.buffers], { requests, decodes, plays, starts, timers } = state
  resume.resolve()
  assert.equal(await stale, false)
  assert.equal(sound.enabled, true)
  assert.equal(sound.music, music)
  assert.equal(music.disposed, false)
  assert.equal(sound.loading, loading)
  assert.deepEqual([...sound.buffers], buffers)
  assert.deepEqual(
    { requests: state.requests, decodes: state.decodes, plays: state.plays, starts: state.starts, timers: state.timers },
    { requests, decodes, plays, starts, timers }
  )
})
