import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { Soundscape } from '../app/audio.ts'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function fixture(t) {
  const sound = new Soundscape(), plays = [], timers = new Set()
  t.mock.method(globalThis, 'setInterval', () => {
    const timer = {}
    timers.add(timer)
    return timer
  })
  t.mock.method(globalThis, 'clearInterval', timer => timers.delete(timer))
  sound.enabled = true
  sound.context = {
    state: 'running',
    currentTime: 0,
    async resume() { this.state = 'running' },
    async suspend() { this.state = 'suspended' },
    async close() { this.state = 'closed' },
  }
  sound.master = { gain: { setValueAtTime() {} } }
  sound.music = {
    loading: Promise.resolve(),
    gain: { gain: { setValueAtTime() {} } },
    element: {
      paused: true,
      play() {
        this.paused = false
        const request = deferred()
        plays.push(request)
        return request.promise
      },
      pause() { this.paused = true },
    },
    dispose() { this.element.pause() },
  }
  sound.loading = Promise.resolve()
  t.after(() => sound.dispose())
  return { sound, plays, timers }
}

const interrupted = () => new DOMException('The play() request was interrupted by pause().', 'AbortError')

test('pausing an unfinished music play preserves enabled sound and later resume', async t => {
  const { sound, plays, timers } = fixture(t)
  const pending = sound.setPaused(false)
  const result = pending.then(() => 'completed', error => error)
  await setImmediate()
  assert.equal(plays.length, 1)
  await sound.setPaused(true)
  plays[0].reject(interrupted())
  assert.equal(await result, 'completed', 'an obsolete play rejection is not a current audio failure')
  assert.equal(sound.enabled, true)
  assert.equal(sound.paused, true)
  assert.equal(sound.context.state, 'suspended')
  assert.equal(sound.music.element.paused, true)
  assert.equal(timers.size, 0)

  const resumed = sound.setPaused(false)
  await setImmediate()
  plays[1].resolve()
  await resumed
  assert.equal(sound.enabled, true)
  assert.equal(sound.context.state, 'running')
  assert.equal(sound.music.element.paused, false)
  assert.equal(timers.size, 1)
})

test('late rejection from an older resume cannot cancel the newest playing request', async t => {
  const { sound, plays, timers } = fixture(t)
  const first = sound.setPaused(false)
  const firstResult = first.then(() => 'completed', error => error)
  await setImmediate()
  await sound.setPaused(true)
  const second = sound.setPaused(false)
  await setImmediate()
  plays[1].resolve()
  await second
  const currentTimer = sound.backgroundTimer
  plays[0].reject(interrupted())
  assert.equal(await firstResult, 'completed')
  assert.equal(sound.enabled, true)
  assert.equal(sound.paused, false)
  assert.equal(sound.backgroundTimer, currentTimer)
  assert.equal(timers.size, 1)
})

test('a superseded context resume does not submit an extra music play', async t => {
  const { sound, plays, timers } = fixture(t)
  const resumes = []
  sound.context.resume = () => {
    const request = deferred()
    resumes.push(request)
    return request.promise
  }
  const first = sound.setPaused(false)
  await sound.setPaused(true)
  const second = sound.setPaused(false)
  resumes[0].resolve()
  await first
  assert.equal(plays.length, 0, 'only the latest resume may submit playback')
  resumes[1].resolve()
  await setImmediate()
  assert.equal(plays.length, 1)
  plays[0].resolve()
  await second
  assert.equal(timers.size, 1)
})

for (const stop of ['mute', 'dispose']) {
  test(`${stop} cancels pending playback without recreating the background timer`, async t => {
    const { sound, plays, timers } = fixture(t)
    const pending = sound.setPaused(false)
    const result = pending.then(() => 'completed', error => error)
    await setImmediate()
    sound[stop]()
    plays[0].reject(interrupted())
    assert.equal(await result, 'completed')
    assert.equal(sound.enabled, false)
    assert.equal(sound.backgroundTimer, null)
    assert.equal(timers.size, 0)
  })
}

test('the current playback failure still rejects rather than hiding a real media error', async t => {
  const { sound, plays, timers } = fixture(t)
  const error = new DOMException('The stream is unsupported.', 'NotSupportedError')
  const pending = sound.setPaused(false)
  const rejected = assert.rejects(pending, actual => actual === error)
  await setImmediate()
  plays[0].reject(error)
  await rejected
  assert.equal(timers.size, 0)
})

test('current context errors propagate, while a disposed request cannot report a stale failure', async t => {
  const { sound, timers } = fixture(t)
  const resume = deferred()
  sound.context.resume = () => resume.promise
  const pending = sound.setPaused(false)
  const result = pending.then(() => 'completed', error => error)
  sound.dispose()
  resume.reject(new DOMException('The context was closed.', 'InvalidStateError'))
  assert.equal(await result, 'completed')
  assert.equal(timers.size, 0)

  const latest = new Soundscape()
  latest.enabled = true
  const failure = new Error('Device unavailable')
  latest.context = { async resume() { throw failure } }
  await assert.rejects(latest.setPaused(false), actual => actual === failure)
})

test('initial enable can finish while paused without turning the sound setting off', async t => {
  const { sound, plays, timers } = fixture(t)
  sound.enabled = false
  const pending = sound.enable()
  const result = pending.then(value => value, error => error)
  await setImmediate()
  assert.equal(plays.length, 1)
  await sound.setPaused(true)
  plays[0].reject(interrupted())
  assert.equal(await result, true)
  assert.equal(sound.enabled, true)
  assert.equal(sound.paused, true)
  assert.equal(timers.size, 0)
})

test('enable reports cancellation when muted during its pending playback', async t => {
  const { sound, plays, timers } = fixture(t)
  sound.enabled = false
  const pending = sound.enable()
  const result = pending.then(value => value, error => error)
  await setImmediate()
  sound.mute()
  plays[0].reject(interrupted())
  assert.equal(await result, false)
  assert.equal(sound.enabled, false)
  assert.equal(timers.size, 0)
})
