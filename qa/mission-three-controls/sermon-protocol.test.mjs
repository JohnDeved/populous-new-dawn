import assert from 'node:assert/strict'
import test from 'node:test'
import * as observation from './observation.mjs'

const staging = () => {
  const preacher = { id: 3163, team: 'blue', kind: 'preacher', hp: 55, inside: null, x: -37, z: -109 }
  const brave = id => ({ id, team: 'yellow', kind: 'brave', hp: 50, inside: null,
    native: { model: 2, tribe: 2, state: 19, workTarget: 0 } })
  const world = { turn: 100, time: 100 / 12, speed: 1, outcome: { level: 3 },
    units: [preacher, brave(2495), brave(53)] }
  const epoch = observation.createEpoch('staging', world.time)
  observation.recordTurn(epoch, world)
  const declaration = structuredClone(observation.armSermonObservation(epoch, world, preacher.id))
  const snapshot = () => ({ selected: [preacher.id], observation: structuredClone(epoch), buildings: [], shrines: [],
    units: world.units.map(u => ({ ...u, nativeState: u.native?.state, owner: u.native?.workTarget })) })
  const next = () => { world.turn++; world.time = world.turn / 12; observation.recordTurn(epoch, world) }
  const listen = id => Object.assign(world.units.find(u => u.id === id).native, { state: 23, workTarget: preacher.id })
  return { world, epoch, preacher, declaration, snapshot, next, listen }
}

test('declaration before departure captures a first listener acquired during staging without another movement', () => {
  const f = staging()
  f.next(); f.listen(2495); f.next()
  const state = f.snapshot(), original = structuredClone(state)
  const first = observation.requireFirstOwnedListener(state, 3163, f.declaration, 'staging')
  assert.equal(first.victim.id, 2495)
  assert.equal(first.turnBefore, 101); assert.equal(first.turnAfter, 102)
  assert.deepEqual(state, original)
  first.victim.id = 999
  assert.equal(f.epoch.sermon.firstOwned.victim.id, 2495, 'Capture cannot mutate the passive lock')
})

test('capture cannot rearm or substitute a later listener after the actual first listener leaves', () => {
  const f = staging(); f.listen(2495); f.next()
  assert.throws(() => observation.armSermonObservation(f.epoch, f.world, 3163), /re-armed/)
  f.world.units.find(u => u.id === 2495).native.state = 19
  f.listen(53); f.next()
  assert.equal(f.epoch.sermon.firstOwned.victim.id, 2495)
  assert.throws(() => observation.requireFirstOwnedListener(f.snapshot(), 3163, f.declaration, 'staging'),
    error => error.code === 'missed-sermon-window')
})

test('capture requires the declared epoch, preacher and actual first-owned listener', () => {
  const f = staging()
  assert.throws(() => observation.requireFirstOwnedListener(f.snapshot(), 3163, f.declaration, 'staging'), /first owned listener/)
  f.listen(2495); f.next()
  for (const [state, preacher, declaration, epoch] of [
    [{ ...f.snapshot(), observation: { ...f.epoch, sermon: null } }, 3163, f.declaration, 'staging'],
    [f.snapshot(), 999, f.declaration, 'staging'],
    [f.snapshot(), 3163, { ...f.declaration, armedAtTurn: 99 }, 'staging'],
    [f.snapshot(), 3163, f.declaration, 'reload'],
    [{ ...f.snapshot(), units: f.snapshot().units.filter(u => u.id !== 3163) }, 3163, f.declaration, 'staging'],
  ]) assert.throws(() => observation.requireFirstOwnedListener(state, preacher, declaration, epoch))
})

test('ordinary Preacher departure is blocked before declaration while other selected followers remain orderable', () => {
  const f = staging(), state = f.snapshot()
  assert.throws(() => observation.requireDeclaredPreacherOrder(state, false), /before any Preacher order/)
  assert.doesNotThrow(() => observation.requireDeclaredPreacherOrder(state, true))
  assert.doesNotThrow(() => observation.requireDeclaredPreacherOrder({ ...state, selected: [46] }, false))
})

test('an onset interrupts movement waiting even when arrival is newly satisfied', () => {
  const f = staging(); f.listen(2495); f.next()
  const state = { ...f.snapshot(), buildings: [], shrines: [] }
  const condition = { type: 'units-near', id: 3163, point: { x: -37, z: -109 }, distance: 1 }
  assert.equal(observation.checkCondition(state, condition), true)
  assert.equal(observation.waitDisposition(state, condition, false), 'capture-sermon')
  assert.equal(observation.waitDisposition(state, condition, true), 'complete')
  assert.equal(observation.waitDisposition(state, { type: 'target-gone', id: 2495 }, true), 'wait')
})
