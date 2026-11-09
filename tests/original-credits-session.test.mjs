import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = readFileSync(new URL('../app/original-credits-session.ts', import.meta.url), 'utf8')
const { freshCreditsInput, resetCreditsEntryLatches, pumpCreditsInput, advanceCreditsClock, startCreditsPlayback } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)
const key = (code, down = true) => ({ device: 'keyboard', code, down })
const mouse = (code, down = true) => ({ device: 'mouse', code, down })

test('Escape requests ordinary frontend return and Space selects interval four', () => {
  assert.deepEqual(pumpCreditsInput(freshCreditsInput(), [key('Escape')]), { interval: 16, exit: true })
  assert.deepEqual(pumpCreditsInput(freshCreditsInput(), [key('Space')]), { interval: 4, exit: false })
  assert.deepEqual(pumpCreditsInput(freshCreditsInput(), [key('KeyA')]), { interval: 16, exit: false })
})
test('first down retains repeat identity but later keyboard callbacks clear consumed slot', () => {
  const input = freshCreditsInput()
  assert.equal(pumpCreditsInput(input, [key('Escape'), key('KeyA')]).exit, false)
  assert.equal(input.repeatedCode, 'Escape')
  assert.equal(input.countdown, 5)
})
test('held Space begins repeating on fifth following pump invocation, not milliseconds', () => {
  const input = freshCreditsInput()
  pumpCreditsInput(input, [key('Space')])
  assert.deepEqual(Array.from({ length: 8 }, () => pumpCreditsInput(input, []).interval), [16, 16, 16, 16, 4, 4, 4, 4])
  assert.equal(pumpCreditsInput(input, [key('Space', false)]).interval, 16)
  assert.equal(pumpCreditsInput(input, []).interval, 16)
})
test('same-batch down/up is not an active mouse latch or Space command', () => {
  for (const code of [0, 1, 2]) {
    assert.equal(pumpCreditsInput(freshCreditsInput(), [mouse(code)]).exit, true)
    assert.equal(pumpCreditsInput(freshCreditsInput(), [mouse(code), mouse(code, false)]).exit, false)
  }
  assert.equal(pumpCreditsInput(freshCreditsInput(), [key('Space'), key('Space', false)]).interval, 16)
})
test('direct entry reset clears only Escape and mouse latches, preserving pending code and repeat', () => {
  const input = freshCreditsInput()
  input.pressed = new Set(['Escape', 'Space', 'mouse0', 'mouse1', 'mouse2'])
  input.released = new Set(['Escape', 'mouse0'])
  input.code = 'Escape'
  input.repeatedCode = 'Space'
  input.countdown = 1
  resetCreditsEntryLatches(input)
  assert.deepEqual([...input.pressed], ['Space'])
  assert.equal(input.released.size, 0)
  assert.equal(input.code, 'Escape')
  assert.equal(input.repeatedCode, 'Space')
  assert.equal(input.countdown, 1)
})
test('strict timer boundary and arithmetic catch-up reproduce the original bounded loop', () => {
  for (const interval of [4, 16]) {
    for (let elapsed = 0; elapsed <= 100; elapsed += 1) {
      let deadline = 100
      let origin = 0
      while (100 + elapsed > deadline) { deadline += interval; origin -= 1 }
      assert.deepEqual(advanceCreditsClock(100 + elapsed, 100, 0, interval), { deadline, origin })
    }
  }
})
test('clock rejects invalid or overflowing modern ranges rather than looping', () => {
  for (const args of [[NaN, 0, 0, 16], [0.5, 0, 0, 4], [-1, 0, 0, 16], [1, 0, 0, 0], [1, 0, -2147483648, 4]]) {
    assert.throws(() => advanceCreditsClock(...args), RangeError)
  }
})
function fixture() {
  let now = 0
  let nextId = 0
  const callbacks = new Map()
  const cancelled = []
  const rendered = []
  let returned = 0
  let failed = 0
  let mapOrigin = value => value
  const owner = startCreditsPlayback({
    now: () => now,
    schedule: callback => { callbacks.set(++nextId, callback); return nextId },
    cancel: id => { cancelled.push(id); callbacks.delete(id) },
    render: origin => { rendered.push(origin); return mapOrigin(origin) },
    onReturn: () => { returned += 1 },
    onFailure: () => { failed += 1 },
  })
  return {
    owner, callbacks, cancelled, rendered,
    get returned() { return returned }, get failed() { return failed },
    time(value) { now = value }, map(fn) { mapOrigin = fn },
    step(value) { now = value; const [id, callback] = callbacks.entries().next().value; callbacks.delete(id); callback() },
  }
}
test('loading keeps origin zero, ready starts a fresh deadline and carries layout reset forward', () => {
  const f = fixture()
  f.step(100)
  assert.deepEqual(f.rendered, [])
  f.owner.setReady(true)
  f.step(100)
  assert.deepEqual(f.rendered, [0])
  f.map(() => 481)
  f.step(101)
  assert.equal(f.rendered.at(-1), -1)
  f.map(value => value)
  f.step(117)
  assert.equal(f.rendered.at(-1), 480)
})
test('Escape returns once and cancels playback before the menu callback', () => {
  const f = fixture()
  const late = [...f.callbacks.values()][0]
  f.owner.enqueue(key('Escape'))
  f.step(10)
  assert.equal(f.returned, 1)
  assert.equal(f.callbacks.size, 0)
  f.owner.back(); late(); f.owner.enqueue(mouse(0)); f.owner.setReady(true)
  assert.equal(f.returned, 1)
  assert.equal(f.callbacks.size, 0)
})
test('fresh browser entry does not inherit the Home opening mouse state', () => {
  const f = fixture()
  f.step(10)
  assert.equal(f.returned, 0)
  f.owner.enqueue(mouse(0)); f.step(11)
  assert.equal(f.returned, 1)
})
test('same-RAF press/release does not close, with no invented opening-release suppression', () => {
  const f = fixture()
  f.owner.enqueue(mouse(0)); f.owner.enqueue(mouse(0, false)); f.step(1)
  assert.equal(f.returned, 0)
  f.owner.enqueue(mouse(0)); f.step(2)
  assert.equal(f.returned, 1)
})
test('pause discards browser held input, cancels work and resumes without hidden-time catch-up', () => {
  const f = fixture()
  f.owner.setReady(true)
  f.owner.enqueue(key('Space'))
  const stale = [...f.callbacks.values()][0]
  f.owner.setPaused(true)
  assert.equal(f.callbacks.size, 0)
  stale()
  assert.deepEqual(f.rendered, [])
  f.time(100000); f.owner.setPaused(false)
  stale()
  assert.equal(f.callbacks.size, 1)
  assert.deepEqual(f.rendered, [])
  f.step(100000)
  assert.deepEqual(f.rendered, [0])
  f.step(100001)
  assert.equal(f.rendered.at(-1), -1)
})
test('dispose prevents late callbacks, repeated cleanup, readiness and queued input from restarting', () => {
  const f = fixture()
  const stale = [...f.callbacks.values()][0]
  f.owner.dispose(); f.owner.dispose(); f.owner.setPaused(false); f.owner.setReady(true)
  stale()
  assert.equal(f.callbacks.size, 0)
  assert.equal(f.returned, 0)
  assert.deepEqual(f.rendered, [])
})
test('bounded queue overflow fails once and cannot act on a partially retained batch', () => {
  const f = fixture()
  for (let i = 0; i < 257; i += 1) f.owner.enqueue(key('KeyA'))
  assert.equal(f.failed, 1)
  assert.equal(f.callbacks.size, 0)
  f.owner.enqueue(key('Escape')); f.owner.back()
  assert.equal(f.returned, 0)
})
test('render failure terminates the owner and leaves no scheduled callback', () => {
  const f = fixture()
  f.owner.setReady(true)
  f.map(() => { throw new Error('layout failed') })
  f.step(1)
  assert.equal(f.failed, 1)
  assert.equal(f.callbacks.size, 0)
})
