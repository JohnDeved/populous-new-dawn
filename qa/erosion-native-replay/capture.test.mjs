import assert from 'node:assert/strict'
import test from 'node:test'
import { createErosion, stepErosion } from '../../app/erosion.ts'
import { attachErosionCapture } from './capture.mjs'

// These are attribution contracts, not an ordinary browser activation.
function fixture({ immediate = true } = {}) {
  const world = { outcome: { level: 3 }, turn: 100, effects: [], randomState: 23,
    land: { heights: new Int16Array(16384).fill(200) },
    shrines: [{ id: 101, kind: 'erosionEffect', uses: 0, effectTargets: [{ x: -15, z: 111 }] }] }
  const epoch = { errors: [], speedViolations: [], erosion: { version: 2, shrineId: 101, use: null, effects: [] } }
  let calls = 0
  const clock = { afterTurn(arg) { assert.equal(this, clock); calls++; return arg } }
  const observer = attachErosionCapture(clock, world, epoch, { runId: 'test-only', profileId: 'test-only', source: {} })
  const onset = () => {
    const effect = { id: 400, kind: 'erosion', age: 0, erosion: createErosion({ x: 63744, y: 35072, h: 200 }) }
    world.effects.push(effect); world.shrines[0].uses++; world.turn++
    epoch.erosion.use = { turn: world.turn }
    if (immediate) stepErosion(world.land, effect.erosion, world, { sound() {}, terrain() {} })
    epoch.erosion.effects.push({ onsetTurn: world.turn, onset: { id: effect.id, remaining: effect.erosion.remaining } })
    assert.equal(clock.afterTurn('ordinary-return'), 'ordinary-return')
    return effect
  }
  return { world, epoch, clock, observer, onset, calls: () => calls }
}

test('passive adapter binds 64 actual observed turns, detached heights and real retirement', () => {
  const f = fixture(), effect = f.onset()
  for (let i = 1; i < 64; i++) {
    f.world.turn++
    const alive = stepErosion(f.world.land, effect.erosion, f.world, { sound() {}, terrain() {} })
    if (!alive) {
      f.world.effects = []
      f.epoch.erosion.effects[0].retired = { turnAfter: f.world.turn }
    }
    const before = structuredClone(f.world)
    assert.equal(f.clock.afterTurn(i), i)
    assert.deepEqual(f.world, before)
  }
  const value = f.observer.read()
  assert.equal(value.version, 2)
  assert.equal(value.creation.remaining, 64)
  assert.equal(value.steps.length, 64); assert.equal(value.steps[0].turn, 101)
  assert.equal(value.steps.at(-1).turn, 164); assert.equal(f.calls(), 64)
  assert.equal(value.steps[0].visit.after.remaining, 63)
  assert.equal(value.steps[0].visit.before.heights.length, 16384)
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value)
  f.observer.dispose(); f.observer.dispose()
  assert.equal(f.clock.afterTurn('restored'), 'restored'); assert.equal(f.calls(), 65)
})

test('missing calls, changed controllers and a late onset fail without altering afterTurn returns', () => {
  for (const mutation of ['gap', 'controller', 'late']) {
    const f = fixture(), effect = f.onset()
    f.world.turn++
    if (mutation === 'controller') effect.erosion = structuredClone(effect.erosion)
    if (mutation === 'late') f.epoch.erosion.effects[0].onset.id++
    const before = structuredClone(f.world)
    assert.equal(f.clock.afterTurn('still-returned'), 'still-returned')
    assert.deepEqual(f.world, before)
    assert.throws(() => f.observer.read(), /Missing|identity/)
    f.observer.dispose()
  }
})

test('original afterTurn exception propagates unchanged and diagnostics never run in its place', () => {
  const world = { outcome: { level: 3 }, turn: 1, shrines: [{ id: 101, kind: 'erosionEffect', uses: 0, effectTargets: [{ x: -15, z: 111 }] }] }
  const epoch = { erosion: { version: 2, shrineId: 101, use: null } }, error = new Error('application')
  let calls = 0
  const clock = { afterTurn() { calls++; throw error } }
  const handle = attachErosionCapture(clock, world, epoch, {})
  assert.throws(() => clock.afterTurn(), value => value === error)
  assert.equal(calls, 1); assert.throws(() => handle.read(), /Incomplete/)
  handle.dispose()
})

for (const [label, diagnostic] of [['empty string', ''], ['empty stringifier', { toString: () => '' }],
  ['zero', 0], ['false', false], ['null', null], ['undefined', undefined]]) {
  test(`a final attribution ${label} throw cannot be exported as successful evidence`, () => {
    const f = fixture(), effect = f.onset()
    for (let i = 1; i < 64; i++) {
      f.world.turn++
      const alive = stepErosion(f.world.land, effect.erosion, f.world, { sound() {}, terrain() {} })
      if (!alive) {
        f.world.effects = []
        f.epoch.erosion.effects[0].retired = { turnAfter: f.world.turn }
      }
      const before = structuredClone(f.world)
      const descriptor = Object.getOwnPropertyDescriptor(effect.erosion, 'remaining')
      try {
        if (!alive) Object.defineProperty(effect.erosion, 'remaining', { configurable: true, get() { throw diagnostic } })
        assert.equal(f.clock.afterTurn(i), i)
      } finally { Object.defineProperty(effect.erosion, 'remaining', descriptor) }
      assert.deepEqual(f.world, before)
    }
    assert.equal(f.calls(), 64); assert.equal(effect.erosion.remaining, 0)
    assert.throws(() => f.observer.read(), 'Every diagnosed attribution error must reject evidence')
    f.observer.dispose()
  })
}

test('old delayed activation and an unowned same-position creation reject instead of selecting another controller', () => {
  const delayed = fixture({ immediate: false })
  delayed.onset()
  assert.throws(() => delayed.observer.read(), /first|processing|onset/)
  delayed.observer.dispose()
  const wrongWorld = fixture()
  createErosion({ x: 63744, y: 35072, h: 200 })
  wrongWorld.onset()
  assert.throws(() => wrongWorld.observer.read(), /creation|capture/)
  wrongWorld.observer.dispose()
})

test('declaration derives x/y without touching terrain and rejects version1 lifecycle input', () => {
  const world = { outcome: { level: 3 }, turn: 1,
    shrines: [{ id: 101, kind: 'erosionEffect', uses: 0, effectTargets: [{ x: -15, z: 111 }] }],
    get land() { throw Error('A passive declaration must not access or synchronize terrain') } }
  const clock = { afterTurn() {} }, epoch = { erosion: { version: 1, shrineId: 101, use: null } }
  assert.throws(() => attachErosionCapture(clock, world, epoch, {}), /version2/)
  epoch.erosion.version = 2
  const observer = attachErosionCapture(clock, world, epoch, {})
  observer.dispose()
})
