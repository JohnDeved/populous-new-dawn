import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { armErosionCapture, observeErosionStep } from '../app/erosion-observation.ts'
import { stepErosion } from '../app/erosion.ts'
import { cast, createWorld, tick } from '../app/model.ts'

// Load the actual accepted source; never maintain a second hand-copied oracle.
const base = '3b899125cc8cedef938823718ad5d44f49957b66'
const original = execFileSync('git', ['show', `${base}:app/erosion.ts`], { encoding: 'utf8' })
const code = stripTypeScriptTypes(original.replace("'./native-math.ts'", JSON.stringify(new URL('../app/native-math.ts', import.meta.url).href)))
const { stepErosion: uninstrumented } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const fixture = () => ({
  land: { heights: Int16Array.from({ length: 16384 }, (_, i) => i % 17 ? 30 + i % 270 : 0) },
  erosion: { center: { x: 63744, y: 35072, h: 200 }, remaining: 64 },
  game: { randomState: 0x87654321 },
})
function run(step, captureEnabled) {
  const f = fixture(), handle = captureEnabled && armErosionCapture(f.erosion), visits = []
  for (let i = 0; i < 64; i++) {
    const calls = [], effects = {
      sound() { assert.equal(this, effects); calls.push(['sound']); return 'sound-return' },
      terrain(cell) { assert.equal(this, effects); calls.push(['terrain', cell]); return 'terrain-return' },
    }
    const alive = step(f.land, f.erosion, f.game, effects)
    visits.push({ ...structuredClone(f), alive, calls })
  }
  return { visits, capture: handle && handle.read() }
}

test('all 64 visits match pinned uninstrumented source with observation disabled and enabled', () => {
  const expected = run(uninstrumented, false).visits
  assert.deepEqual(run(stepErosion, false).visits, expected)
  const { visits, capture } = run(stepErosion, true)
  assert.deepEqual(visits, expected)
  assert.equal(capture.failure, null); assert.equal(capture.visits.length, 64)
  assert.equal(capture.visits[0].before.remaining, 64)
  assert.equal(capture.visits.at(-1).after.remaining, 0)
  assert.equal(capture.visits.at(-1).alive, false)
  assert.deepEqual(capture.visits.at(-1).notifications, [])
  for (const [i, visit] of capture.visits.entries()) {
    assert.equal(visit.ordinal, i + 1); assert.equal(visit.completed, true)
    assert.deepEqual(visit.after.heights, visits[i].land.heights)
    assert.equal(visit.after.randomState, visits[i].game.randomState)
    assert.ok(Number.isFinite(visit.copyMilliseconds) && visit.copyMilliseconds >= 0)
  }
})

test('actual application errors keep their identity, partial state, receiver and call count', () => {
  for (const fail of ['sound', 'terrain']) {
    const sentinel = new Error(`${fail} application failure`), outcomes = []
    for (const mode of ['original', 'disabled', 'captured']) {
      const f = fixture(), calls = [], handle = mode === 'captured' && armErosionCapture(f.erosion)
      const effects = {
        sound() { assert.equal(this, effects); calls.push('sound'); if (fail === 'sound') throw sentinel },
        terrain(cell) { assert.equal(this, effects); calls.push(['terrain', cell]); if (fail === 'terrain') throw sentinel },
      }
      assert.throws(() => (mode === 'original' ? uninstrumented : stepErosion)(f.land, f.erosion, f.game, effects), error => error === sentinel)
      outcomes.push({ ...structuredClone(f), calls })
      if (handle) {
        const visit = handle.read().visits[0]
        assert.equal(visit.completed, false); assert.equal(visit.alive, null)
        assert.equal(visit.notifications.at(-1).completed, false)
        assert.deepEqual(visit.after.heights, f.land.heights)
      }
    }
    assert.deepEqual(outcomes[1], outcomes[0]); assert.deepEqual(outcomes[2], outcomes[0])
  }
})

test('read copies and later game writes cannot change each other or historical capture', () => {
  const f = fixture(), handle = armErosionCapture(f.erosion)
  stepErosion(f.land, f.erosion, f.game, { sound() {}, terrain() {} })
  const expected = handle.read(), exported = handle.read()
  exported.visits[0].before.heights.fill(-1); exported.visits[0].before.center.x = 0
  exported.visits[0].notifications.length = 0; exported.failure = 'outside'
  f.land.heights.fill(-2); f.erosion.center.x = 1; f.game.randomState = 0
  assert.deepEqual(handle.read(), expected)
})

test('active callback wrappers preserve their original return values', () => {
  const f = fixture(), soundResult = {}, terrainResult = {}, handle = armErosionCapture(f.erosion)
  const effects = { sound: () => soundResult, terrain: () => terrainResult }
  const result = observeErosionStep(f.land, f.erosion, f.game, effects, (land, erosion, game, observed) => {
    assert.equal(observed.sound(), soundResult)
    assert.equal(observed.terrain(123), terrainResult)
    return false
  })
  assert.equal(result, false); assert.equal(handle.read().failure, null)
  assert.deepEqual(handle.read().visits[0].notifications, [
    { kind: 'sound', completed: true }, { kind: 'terrain', cell: 123, completed: true },
  ])
})

test('copy failure and overflow invalidate evidence without skipping the original body', () => {
  const f = fixture(), handle = armErosionCapture(f.erosion), sentinel = { toString() { throw Error('unprintable') } }
  Object.defineProperty(f.land, 'heights', { get() { throw sentinel } })
  let calls = 0
  assert.equal(observeErosionStep(f.land, f.erosion, f.game, {}, () => { calls++; return true }), true)
  assert.equal(calls, 1); assert.equal(handle.read().failure, 'Erosion observation failed')
  assert.equal(handle.read().visits.length, 0)
  const other = fixture(), bounded = armErosionCapture(other.erosion)
  for (let i = 0; i < 65; i++) observeErosionStep(other.land, other.erosion, other.game, {}, () => { calls++; return false })
  assert.equal(calls, 66); assert.equal(bounded.read().visits.length, 64)
  assert.match(bounded.read().failure, /exceeded 64/)
})

test('after-copy diagnostic failure cannot replace an application exception', () => {
  const f = fixture(), handle = armErosionCapture(f.erosion), sentinel = new Error('application')
  assert.throws(() => observeErosionStep(f.land, f.erosion, f.game, {}, () => {
    Object.defineProperty(f.land, 'heights', { get() { throw Error('diagnostic') } })
    throw sentinel
  }), error => error === sentinel)
  assert.match(handle.read().failure, /diagnostic/)
  assert.equal(handle.read().visits[0].completed, false)
})

for (const [label, diagnostic] of [['empty string', ''], ['empty stringifier', { toString: () => '' }],
  ['zero', 0], ['false', false], ['null', null], ['undefined', undefined]]) {
  test(`a thrown ${label} permanently invalidates capture while all original calls continue`, () => {
    const f = fixture(), handle = armErosionCapture(f.erosion), originalPerformance = globalThis.performance
    let timingReads = 0, calls = 0
    try {
      globalThis.performance = { now() { if (++timingReads === 4) throw diagnostic; return timingReads } }
      for (let i = 0; i < 64; i++) observeErosionStep(f.land, f.erosion, f.game, {}, () => {
        calls++; f.game.randomState++; return --f.erosion.remaining > 0
      })
    } finally { globalThis.performance = originalPerformance }
    handle.detach()
    const capture = handle.read()
    assert.equal(calls, 64); assert.equal(f.erosion.remaining, 0)
    assert.equal(f.game.randomState, 0x87654321 + 64)
    assert.ok(capture.failure, 'Diagnostic failure must retain a nonempty marker')
    assert.equal(capture.visits.length, 1, 'No collection resumes after any diagnostic throw')
    assert.equal(timingReads, 4)
  })
}

test('an empty diagnostic throw cannot replace an application exception', () => {
  const f = fixture(), handle = armErosionCapture(f.erosion), originalPerformance = globalThis.performance
  const sentinel = new Error('original application failure'); let timingReads = 0, calls = 0
  try {
    globalThis.performance = { now() { if (++timingReads === 4) throw ''; return timingReads } }
    assert.throws(() => observeErosionStep(f.land, f.erosion, f.game, {}, () => {
      calls++; throw sentinel
    }), error => error === sentinel)
  } finally { globalThis.performance = originalPerformance }
  assert.equal(calls, 1); assert.ok(handle.read().failure)
  assert.equal(handle.read().visits[0].completed, false)
})

test('diagnostic append failure disables capture and still invokes the body once', () => {
  const f = fixture(), handle = armErosionCapture(f.erosion), push = Array.prototype.push
  let calls = 0, result
  try {
    Array.prototype.push = () => { throw Error('diagnostic append') }
    result = observeErosionStep(f.land, f.erosion, f.game, {}, () => { calls++; return true })
  } finally { Array.prototype.push = push }
  assert.equal(result, true); assert.equal(calls, 1)
  assert.match(handle.read().failure, /diagnostic append/)
})

test('no observer or detached capture makes no diagnostic copy and invokes the body once', () => {
  const f = fixture(); let calls = 0
  Object.defineProperty(f.land, 'heights', { get() { throw Error('unexpected diagnostic read') } })
  const step = (...args) => { calls++; assert.deepEqual(args, [f.land, f.erosion, f.game, effects]); return false }, effects = {}
  assert.equal(observeErosionStep(f.land, f.erosion, f.game, effects, step), false)
  const handle = armErosionCapture(f.erosion); handle.detach(); handle.detach()
  assert.equal(observeErosionStep(f.land, f.erosion, f.game, effects, step), false)
  assert.equal(calls, 2); assert.equal(handle.read().visits.length, 0)
  assert.throws(() => armErosionCapture(f.erosion), /unobserved/)
  f.erosion.remaining = 63; assert.throws(() => armErosionCapture(f.erosion), /remaining 64/)
})

test('capturing a live controller does not change any World field or completed turn (source fixture)', () => {
  const worlds = [createWorld(), createWorld()]
  for (const world of worlds) {
    const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    world.selected = [shaman.id]; world.shots.erosion = 1
    assert.ok(cast(world, 'erosion', { x: 0, z: 8 }))
  }
  let handle, retired = false
  for (let turn = 0; turn < 100 && !retired; turn++) {
    for (const world of worlds) tick(world, 1 / 12)
    assert.deepEqual(worlds[1], worlds[0], `full World after turn ${turn}`)
    const controller = worlds[1].effects.find(fx => fx.erosion)?.erosion
    if (!handle && controller) handle = armErosionCapture(controller)
    if (handle?.status().count === 64) retired = true
  }
  assert.equal(retired, true); assert.equal(handle.status().failure, null)
  handle.detach()
})
