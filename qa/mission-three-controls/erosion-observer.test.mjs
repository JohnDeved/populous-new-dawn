import assert from 'node:assert/strict'
import test from 'node:test'
import { armErosionObservation, recordErosionTurn, requireErosionEvidence, erosionProgress } from './erosion-observer.mjs'
import { createEpoch, attachObserver, objectiveProgress, checkCondition } from './observation.mjs'

function fixture() {
  const epoch = createEpoch('erosion-test', 100 / 12)
  const world = { turn: 100, time: 100 / 12, speed: 1, outcome: { level: 3 }, units: [], effects: [],
    shrines: [{ id: 101, kind: 'erosionEffect', active: true, uses: 0, remaining: 1, forced: false,
      effectTarget: { x: -15, z: 111 }, effectTargets: [{ x: -15, z: 111 }] }],
    land: { heights: new Int16Array(16384).fill(50), walkMasks: [new Uint8Array(16384), new Uint8Array(16384)] },
    landVersion: 0, terrainVersion: 0 }
  return { epoch, world }
}
function onset(f) {
  armErosionObservation(f.epoch, f.world, 101)
  const effect = { id: 900, kind: 'erosion', x: -15, z: 111, age: 0, duration: Infinity,
    erosion: { center: { x: 63744, y: 35072, h: 50 }, remaining: 64 } }
  f.world.effects.push(effect); Object.assign(f.world.shrines[0], { uses: 1, active: false, remaining: 0 })
  f.world.turn++; f.world.time = f.world.turn / 12
  recordErosionTurn(f.epoch, f.world)
  return effect
}
function step(f, effect, elapsed) {
  f.world.turn++; f.world.time = f.world.turn / 12; effect.age += 1 / 12; effect.erosion.remaining--
  if (elapsed === 1) { f.world.land.heights[68 * 128 + 124]--; f.world.landVersion++ }
  if (elapsed === 64) { effect.duration = effect.age; f.world.effects = f.world.effects.filter(e => e !== effect) }
  const beforeObservation = structuredClone(f.world)
  recordErosionTurn(f.epoch, f.world)
  assert.deepEqual(f.world, beforeObservation, 'Observer must not mutate producer-owned World')
}

test('prospective linked Erosion keeps real scalar onset and64 adjacent visits through actual zero-counter removal', () => {
  const f = fixture(), effect = onset(f), onsetCopy = structuredClone(f.epoch.erosion.effects[0].onset)
  for (let n = 1; n <= 64; n++) step(f, effect, n)
  const record = requireErosionEvidence(f.epoch, 101, true)
  assert.deepEqual(record.effects[0].onset, onsetCopy)
  assert.equal(record.effects[0].onset.remaining, 64); assert.equal(record.effects[0].last.remaining, 1)
  assert.equal(record.effects[0].retired.remaining, 0); assert.equal(record.effects[0].retired.turnAfter, 165)
  assert.equal(record.effects[0].samples.length, 64); assert.equal(record.effects[0].changedCells.length, 1)
  assert.equal(record.effects[0].terrain.onset.cells.length, 169)
  assert.equal(Object.hasOwn(record.effects[0].onset, 'duration'), false, 'Live Infinity is not silently serialized as null')
  assert.deepEqual(JSON.parse(JSON.stringify(record)), record, 'Exported lifecycle evidence round-trips losslessly')
  effect.erosion.center.x = 0; effect.age = 99
  assert.deepEqual(f.epoch.erosion.effects[0].onset, onsetCopy, 'Later controller changes cannot rewrite historical evidence')
  const snapshot = { observation: f.epoch, units: [], buildings: [], shrines: f.world.shrines, effects: [], status: 'playing' }
  assert.equal(checkCondition(snapshot, { type: 'erosion-onset', id: 101 }), true, 'Host may arrive after retirement')
  assert.equal(checkCondition(snapshot, { type: 'erosion-retired', id: 101 }), true)
})

test('late arming, prior matching effects, missing linked onset and ambiguous targets cannot fabricate Erosion proof', () => {
  for (const mutate of [f => f.world.shrines[0].uses = 1, f => f.world.shrines[0].active = false,
    f => f.world.shrines[0].effectTargets.push({ x: -15, z: 111 }),
    f => f.world.effects.push({ id: 1, kind: 'erosion', x: -15, z: 111 })]) {
    const f = fixture(); mutate(f); assert.throws(() => armErosionObservation(f.epoch, f.world, 101))
  }
  const f = fixture(); armErosionObservation(f.epoch, f.world, 101)
  f.world.shrines[0].uses = 1; f.world.turn++
  assert.throws(() => recordErosionTurn(f.epoch, f.world), /unique new Erosion/)
  assert.throws(() => requireErosionEvidence(f.epoch, 101))
  assert.throws(() => armErosionObservation(f.epoch, f.world, 101), /re-armed/)
})

test('wrong identity, target, countdown, skipped turns or early absence fail closed', () => {
  for (const mutate of [f => f.world.turn++, f => f.world.effects = [],
    f => f.world.effects[0] = structuredClone(f.world.effects[0]),
    f => f.world.effects[0].x++, f => f.world.effects[0].erosion.remaining = 42,
    f => f.world.effects[0].age = Infinity, f => f.world.effects[0].erosion.center.h = NaN,
    f => f.world.shrines[0].effectTargets[0].x++]) {
    const f = fixture(), effect = onset(f); f.world.turn++; effect.erosion.remaining = 63; mutate(f)
    assert.throws(() => recordErosionTurn(f.epoch, f.world))
  }
  const f = fixture(), effect = onset(f)
  for (let n = 1; n <= 63; n++) step(f, effect, n)
  f.world.turn++; f.world.effects = [] // removed without actual zero-counter producer
  assert.throws(() => recordErosionTurn(f.epoch, f.world), /zero-counter/)
})

test('passive hook chains original once and never mutates world or loses observer errors', () => {
  const f = fixture(); let calls = 0
  const clock = { afterTurn() { calls++; return 'ordinary-return' } }
  const detach = attachObserver(clock, f.world, f.epoch)
  armErosionObservation(f.epoch, f.world, 101)
  f.world.turn++; f.world.time = f.world.turn / 12
  const before = structuredClone(f.world)
  assert.equal(clock.afterTurn(), 'ordinary-return'); assert.equal(calls, 1); assert.deepEqual(f.world, before)
  f.world.turn += 2; f.world.time = f.world.turn / 12
  assert.equal(clock.afterTurn(), 'ordinary-return'); assert.equal(calls, 2)
  assert.equal(f.epoch.errors.length, 1); assert.throws(() => requireErosionEvidence(f.epoch, 101), /errors/)
  detach()
})

test('unrelated combat or time cannot reset an Erosion or named-target progress deadline', () => {
  const f = fixture(); onset(f)
  const snapshot = { observation: f.epoch, effects: [], units: [{ id: 1, team: 'yellow', hp: 50, x: 0, z: 0 }], buildings: [], shrines: [], status: 'playing' }
  const before = erosionProgress(snapshot, 101)
  snapshot.units[0].hp--; snapshot.units[0].x++; snapshot.effects.push({ id: 88, kind: 'blast', age: 1 })
  assert.equal(erosionProgress(snapshot, 101), before)
  assert.equal(objectiveProgress(snapshot, { type: 'erosion-retired', id: 101 }, 'combat'), before)
  const live = objectiveProgress(snapshot, { type: 'effect-present', kind: 'erosion' }, 'combat')
  snapshot.units[0].x++
  assert.equal(objectiveProgress(snapshot, { type: 'effect-present', kind: 'erosion' }, 'combat'), live)
})

import { createWorld, command, placeBuilding, select, setSelection, tick } from '../../app/model.ts'
import { finishLevelStart } from '../../tests/level-start-fixture.mjs'

test('actual M3 simulation producer exposes shrine-linked64-turn lifecycle to the passive hook (not browser proof)', () => {
  const world = createWorld(3)
  finishLevelStart(world)
  const until = (predicate, clock) => {
    for (let n = 0; !predicate() && n < 20000; n++) tick(world, 1 / 12, clock)
    assert.ok(predicate(), 'Bounded ordinary simulation path reached its condition')
  }
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  const shrine = world.shrines.find(shrine => shrine.kind === 'erosionEffect')
  assert.equal(shrine.id, 101); assert.ok(command(world, vault)); until(() => world.unlockedTemple)
  select(world, 'brave'); assert.ok(placeBuilding(world, 'temple', { x: 24, z: 70 }))
  const temple = world.buildings.findLast(building => building.kind === 'temple')
  until(() => temple.progress === 1)
  const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null)
  setSelection(world, [brave.id]); assert.ok(command(world, temple))
  until(() => world.units.some(unit => unit.team === 'blue' && unit.kind === 'preacher'))
  const preacher = world.units.find(unit => unit.team === 'blue' && unit.kind === 'preacher')
  const epoch = createEpoch('actual-simulation-erosion', world.time), clock = {}
  const detach = attachObserver(clock, world, epoch)
  armErosionObservation(epoch, world, shrine.id)
  setSelection(world, [preacher.id]); assert.ok(command(world, shrine))
  until(() => epoch.erosion.effects.length > 0, clock)
  const onsetTurn = epoch.erosion.effects[0].onsetTurn
  until(() => epoch.erosion.effects.every(effect => effect.retired), clock)
  const result = requireErosionEvidence(epoch, shrine.id, true)
  assert.equal(result.use.turn, onsetTurn); assert.equal(result.effects[0].retired.turnAfter, onsetTurn + 64)
  assert.equal(result.effects[0].onset.remaining, 64); assert.equal(result.effects[0].last.remaining, 1)
  assert.equal(result.effects[0].retired.remaining, 0); assert.ok(result.effects[0].changedCells.length > 0)
  assert.deepEqual(epoch.errors, []); assert.deepEqual(JSON.parse(JSON.stringify(result)), result); detach()
})
