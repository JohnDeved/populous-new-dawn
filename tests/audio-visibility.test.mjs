import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Execute the actual Home effect without importing React, Three or application state.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const marker = '.setPaused(world.paused || document.hidden)'
assert.equal(source.split(marker).length, 2, 'identify exactly one audio pause effect')
const point = source.indexOf(marker)
const start = source.lastIndexOf('  useEffect(() => {', point)
const end = source.indexOf('\n  useEffect(', point)
assert.ok(start >= 0 && end > point)
const effectSource = source.slice(start, end)
const register = new Function('useEffect', 'world', 'audio', 'document', 'setSound', effectSource)

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture({ hidden = false, paused = false } = {}) {
  const listeners = new Set(), calls = [], values = []
  let cleanup, dependencies, muteCount = 0
  const sound = {
    setPaused(value) { calls.push(value); return Promise.resolve() },
    mute() { muteCount++ },
  }
  const audio = { current: sound }
  const document = {
    hidden,
    addEventListener(type, listener) {
      assert.equal(type, 'visibilitychange')
      listeners.add(listener)
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'visibilitychange')
      listeners.delete(listener)
    },
  }
  let world = { paused }
  function commit(nextWorld = world) {
    world = nextWorld
    register((effect, next) => {
      if (!dependencies || next.some((value, index) => !Object.is(value, dependencies[index]))) {
        cleanup?.()
        dependencies = next
        cleanup = effect()
      }
    }, world, audio, document, value => values.push(value))
  }
  commit()
  return {
    calls, values, sound, audio, listeners, world,
    get muteCount() { return muteCount },
    commit,
    visibility(value) {
      document.hidden = value
      for (const listener of [...listeners]) listener()
    },
    unmount() { cleanup?.() },
  }
}

test('hiding an unpaused game pauses its current audio owner', () => {
  const f = fixture()
  f.visibility(true)
  assert.deepEqual(f.calls, [false, true])
  f.unmount()
})

test('showing a hidden unpaused game resumes its current audio owner', () => {
  const f = fixture({ hidden: true })
  f.visibility(false)
  assert.deepEqual(f.calls, [true, false])
  f.unmount()
})

test('visibility never resumes a world that is itself paused', () => {
  const f = fixture({ paused: true })
  f.visibility(true)
  f.visibility(false)
  assert.deepEqual(f.calls, [true, true, true])
  f.unmount()
})

test('the pause state at initial setup still combines hidden and world pause', () => {
  for (const hidden of [false, true]) for (const paused of [false, true]) {
    const f = fixture({ hidden, paused })
    assert.deepEqual(f.calls, [hidden || paused])
    f.unmount()
  }
})

test('world replacement with the same pause value replaces the captured world', () => {
  const f = fixture(), replacement = { paused: false }
  f.commit(replacement)
  f.world.paused = true
  f.visibility(false)
  assert.deepEqual(f.calls, [false, false, false])
  assert.equal(f.listeners.size, 1)
  f.unmount()
})

test('pause commits replace rather than accumulate visibility listeners', () => {
  const f = fixture()
  f.world.paused = true
  f.commit()
  f.visibility(true)
  f.world.paused = false
  f.commit()
  f.visibility(false)
  assert.deepEqual(f.calls, [false, true, true, true, false])
  assert.equal(f.listeners.size, 1)
  f.unmount()
})

test('unmount removes the exact listener and prevents later audio changes', () => {
  const f = fixture()
  f.unmount()
  assert.equal(f.listeners.size, 0)
  f.visibility(true)
  assert.deepEqual(f.calls, [false])
})

test('a current pause failure retains the existing mute and disabled-state fallback', async () => {
  const f = fixture(), failure = new Error('device failed')
  f.sound.setPaused = () => Promise.reject(failure)
  f.world.paused = true
  f.commit()
  await Promise.resolve()
  assert.equal(f.muteCount, 1)
  assert.deepEqual(f.values, [false])
  f.unmount()
})

test('a retired audio owner cannot mute a replacement after a late failure', async () => {
  const f = fixture(), pending = deferred()
  let replacementMutes = 0
  f.sound.setPaused = () => pending.promise
  f.world.paused = true
  f.commit()
  f.audio.current = { mute() { replacementMutes++ } }
  pending.reject(new Error('retired owner failed'))
  await Promise.resolve()
  assert.equal(replacementMutes, 0)
  assert.deepEqual(f.values, [])
  f.unmount()
})
