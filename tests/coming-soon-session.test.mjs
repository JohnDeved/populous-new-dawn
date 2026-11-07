import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Node >=22.13 supplies this eraser. Execute the production session without
// replacing its control flow; this is not a TypeScript typecheck or browser test.
const source = readFileSync(new URL('../app/coming-soon-session.ts', import.meta.url), 'utf8')
const emitted = stripTypeScriptTypes(source)
const { createComingSoonSession } = await import(`data:text/javascript;base64,${Buffer.from(emitted).toString('base64')}`)

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture() {
  const state = { hidden: false, playback: [], completions: 0 }
  const media = {
    plays: 0, pauses: 0, loads: 0, error: null, removed: [], next: null,
    play() {
      this.plays++
      if (this.throw) throw this.throw
      return this.next?.promise ?? Promise.resolve()
    },
    pause() { this.pauses++ },
    load() { this.loads++ },
    removeAttribute(name) { this.removed.push(name) },
  }
  const session = createComingSoonSession(media, () => state.hidden,
    value => state.playback.push(value), () => state.completions++)
  return { media, state, session }
}

test('natural completion and explicit skip finish once and stop media', () => {
  const f = fixture()
  f.session.play()
  f.session.stop()
  f.session.stop()
  assert.equal(f.state.completions, 1)
  assert.equal(f.media.pauses, 1)
  f.session.play()
  assert.equal(f.media.plays, 1)
})

test('fresh skip pauses on down and waits for the matching keyboard or pointer release', () => {
  for (const input of ['key:Enter', 'key:Space', 'key:Escape', 'key:KeyA', 'pointer:7']) {
    const f = fixture()
    f.session.hold(input, true)
    assert.equal(f.media.pauses, 1)
    assert.equal(f.state.completions, 0)
    assert.equal(f.session.release('unrelated'), true)
    assert.equal(f.state.completions, 0)
    assert.equal(f.session.release(input), true)
    assert.equal(f.state.completions, 1)
    f.session.release(input)
    assert.equal(f.state.completions, 1)
  }
})

test('multiple pressed inputs all drain before revealing the menu', () => {
  const f = fixture()
  f.session.hold('pointer:1', true)
  f.session.hold('pointer:2', true)
  f.session.hold('key:Space', true)
  f.session.release('pointer:1')
  f.session.release('key:Space')
  assert.equal(f.state.completions, 0)
  f.session.release('pointer:2')
  assert.equal(f.state.completions, 1)
})

test('control activation does not skip; natural end while a control is held absorbs its release', () => {
  for (const input of ['key:Space', 'key:Enter', 'pointer:5']) {
    const f = fixture()
    f.session.hold(input, false)
    assert.equal(f.media.pauses, 0)
    assert.equal(f.session.isExiting(), false)
    assert.equal(f.session.release(input), false)
    f.session.hold(input, false)
    f.session.stop()
    assert.equal(f.state.completions, 0)
    assert.equal(f.session.release(input), true)
    assert.equal(f.state.completions, 1)
  }
})

test('visibility pauses and resumes the same media without reloading', async () => {
  const f = fixture()
  f.session.play()
  await Promise.resolve()
  f.state.hidden = true
  f.session.visibilityChanged()
  assert.equal(f.media.pauses, 1)
  f.session.play()
  assert.equal(f.media.plays, 1)
  f.state.hidden = false
  f.session.visibilityChanged()
  await Promise.resolve()
  assert.equal(f.media.plays, 2)
  assert.equal(f.media.loads, 0)
  assert.deepEqual(f.state.playback, ['playing', 'playing'])
})

test('hidden mounting does not start media', () => {
  const f = fixture()
  f.state.hidden = true
  f.session.play()
  assert.equal(f.media.plays, 0)
})

test('visibility cannot resume a movie awaiting input release', () => {
  const f = fixture()
  f.session.play()
  f.session.hold('pointer:1', true)
  f.state.hidden = true
  f.session.visibilityChanged()
  f.state.hidden = false
  f.session.visibilityChanged()
  f.session.play()
  assert.equal(f.media.plays, 1)
  assert.equal(f.state.completions, 0)
  f.session.release('pointer:1')
  assert.equal(f.state.completions, 1)
})

test('lost window focus releases stopped input without completing an active movie', () => {
  const f = fixture()
  f.session.hold('key:Enter', false)
  f.session.blur()
  assert.equal(f.state.completions, 0)
  f.session.hold('pointer:1', true)
  f.session.blur()
  assert.equal(f.state.completions, 1)
  f.session.blur()
  assert.equal(f.state.completions, 1)
})

test('autoplay refusal can resume without resetting time or loading', async () => {
  const f = fixture()
  f.media.next = deferred()
  f.session.play()
  f.media.next.reject(new Error('autoplay'))
  await Promise.resolve()
  assert.deepEqual(f.state.playback, ['blocked'])
  f.media.next = null
  f.session.play()
  await Promise.resolve()
  assert.deepEqual(f.state.playback, ['blocked', 'playing'])
  assert.equal(f.media.loads, 0)
})

test('synchronous refusal and actual decoder errors remain truthful', () => {
  const f = fixture()
  f.media.throw = new Error('policy')
  f.session.play()
  assert.deepEqual(f.state.playback, ['blocked'])
  f.media.error = { code: 3 }
  f.session.play()
  assert.deepEqual(f.state.playback, ['blocked', 'failed'])
  f.session.play()
  assert.equal(f.media.plays, 2)
  f.session.stop()
  assert.equal(f.state.completions, 1)
})

test('newer successful play wins over stale rejection or resolution', async () => {
  for (const outcome of ['reject', 'resolve']) {
    const f = fixture(), old = deferred()
    f.media.next = old
    f.session.play()
    f.media.next = null
    f.session.play()
    await Promise.resolve()
    old[outcome](new Error('old request'))
    await Promise.resolve()
    assert.deepEqual(f.state.playback, ['playing'])
  }
})

test('hidden, pointer-held, failed, completed and disposed sessions ignore late play promises', async () => {
  const interruptions = [
    f => { f.state.hidden = true; f.session.visibilityChanged() },
    f => f.session.hold('pointer:1', true),
    f => f.session.fail(),
    f => f.session.stop(),
    f => f.session.dispose(),
  ]
  for (const interrupt of interruptions) for (const outcome of ['reject', 'resolve']) {
    const f = fixture(), pending = deferred()
    f.media.next = pending
    f.session.play()
    interrupt(f)
    const expected = [...f.state.playback]
    pending[outcome](new Error('interrupted'))
    await Promise.resolve()
    assert.deepEqual(f.state.playback, expected)
  }
})

test('failure remains an exit-capable terminal playback state across visibility changes', () => {
  const f = fixture()
  f.session.fail()
  f.state.hidden = true
  f.session.visibilityChanged()
  f.state.hidden = false
  f.session.visibilityChanged()
  assert.equal(f.media.plays, 0)
  assert.deepEqual(f.state.playback, ['failed'])
  f.session.stop()
  assert.equal(f.state.completions, 1)
})

test('dispose is idempotent, unloads media and disables all callbacks', async () => {
  const f = fixture()
  f.session.play()
  f.session.hold('pointer:1', true)
  f.session.dispose()
  const pauses = f.media.pauses
  f.session.dispose()
  f.session.release('pointer:1')
  f.session.blur()
  f.session.stop()
  f.session.fail()
  f.session.play()
  f.session.visibilityChanged()
  await Promise.resolve()
  assert.equal(f.media.pauses, pauses)
  assert.equal(f.media.loads, 1)
  assert.deepEqual(f.media.removed, ['src'])
  assert.equal(f.state.completions, 0)
  assert.deepEqual(f.state.playback, [])
})

test('reopening starts an independent session; old promise cannot change it', async () => {
  const old = fixture(), pending = deferred()
  old.media.next = pending
  old.session.play()
  old.session.stop()
  old.session.dispose()
  const reopened = fixture()
  reopened.session.play()
  pending.reject(new Error('old modal'))
  await Promise.resolve()
  assert.deepEqual(old.state.playback, [])
  assert.deepEqual(reopened.state.playback, ['playing'])
  assert.equal(reopened.state.completions, 0)
  reopened.session.stop()
  assert.equal(reopened.state.completions, 1)
})
