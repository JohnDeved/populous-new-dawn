import assert from 'node:assert/strict'
import test from 'node:test'
import { liveBuildingAttackTarget } from '../../app/live-building-combat.ts'
import { buildingFootprintCells, buildingPose } from '../../app/building-shapes.ts'
import { syncLandscapeObjects } from '../../app/world-terrain-runtime.ts'
import { acceptedOrderEvidence } from './observation.mjs'
import { createWorldState } from '../../app/world-state.ts'
import { createMoveContextProbe, isOrdinaryMoveContext } from './command-probes.mjs'

const fixture = () => {
  const w = createWorldState(3)
  w.units = [{ id: 3242, team: 'blue', kind: 'preacher', hp: 55, x: 27, z: 75 }]
  w.selected = [3242]
  w.buildings = [{ id: 1016, team: 'yellow', kind: 'hut', hp: 170, progress: 1,
    x: -27.0546875, z: -107.078125, level: 1, angle: 0 }]
  return w
}

test('visually unpicked ground in a registered enemy building cell is rejected as a move', () => {
  const w = fixture(), original = structuredClone(w)
  const inspect = createMoveContextProbe(w)
  const context = inspect({ x: -28.93573121901977, z: -106.98719388391692 })
  assert.equal(context.model, 19)
  assert.equal(context.buildingId, 1016)
  assert.equal(isOrdinaryMoveContext(context), false)
  assert.equal(w.buildingFootprints.size, 0, 'Only the detached clone received footprint registration')
  assert.deepEqual(w, original)
})

test('a genuine enabled ground move remains eligible while blocked/coastal and other contexts are rejected', () => {
  const w = fixture(), original = structuredClone(w), inspect = createMoveContextProbe(w)
  assert.equal(isOrdinaryMoveContext(inspect({ x: 35, z: 81 })), true)
  assert.equal(isOrdinaryMoveContext(inspect({ x: 90, z: 90 })), false)
  for (const context of [null, { model: 3, enabled: false }, { model: 8, enabled: true }, { model: 19, enabled: true }])
    assert.equal(isOrdinaryMoveContext(context), false)
  assert.deepEqual(w, original)
})

// Explicit source-only fixture: these records never enter a running game.
const buildingAttackFixture = () => {
  const w = fixture(), building = w.buildings[0], pose = buildingPose(building)
  syncLandscapeObjects(w)
  const center = (pose.anchorX >>> 9) + (pose.anchorY >>> 9) * 128
  const cell = buildingFootprintCells(pose).find(cell => cell !== center)
  assert.notEqual(cell, undefined, 'Exercise a non-center footprint cell')
  w.buildingOrders.records[1] = { model: 19, flags: 0, references: 1, object: 0,
    a: (cell % 128) * 2 + Math.floor(cell / 128) * 512, b: 0 }
  const person = { id: 3242, tribe: 0, commands: [1], commandCursor: 0, immediateCommand: 0 }
  return { w, building, person, order: w.buildingOrders.records[1] }
}

test('source-owned building lookup resolves an occupied footprint cell without mutating the world', () => {
  const { w, building, person, order } = buildingAttackFixture(), original = structuredClone(w)
  assert.equal(liveBuildingAttackTarget(w, person)?.id, building.id)
  assert.deepEqual(w, original)
  for (const patch of [{ flags: 1 }, { model: 3 }, { a: 0 }]) {
    const changed = structuredClone(w)
    Object.assign(changed.buildingOrders.records[1], patch)
    assert.equal(liveBuildingAttackTarget(changed, person), undefined)
  }
  for (const patch of [{ hp: 0 }, { progress: 0.5 }, { team: 'blue' }]) {
    const changed = structuredClone(w)
    Object.assign(changed.buildings[0], patch)
    assert.equal(liveBuildingAttackTarget(changed, person), undefined)
  }
  assert.notEqual(order.a, building.id, 'Packed cell is not a building ID')
})

test('a building click requires the exact source-resolved attack target and fresh selected dispatch', () => {
  const { w, building, person, order } = buildingAttackFixture()
  const before = { turn: 10, lastOrderTurn: 9, pointerAck: { target: 0, until: 5 },
    selected: [person.id], units: [{ id: person.id, order: null, attackBuildingId: null }], effects: [] }
  const actor = { id: person.id, work: null, target: null, order,
    attackBuildingId: liveBuildingAttackTarget(w, person)?.id ?? null }
  const after = { ...before, lastOrderTurn: 10, pointerAck: { target: building.id, until: 6 }, units: [actor] }
  const hit = { collection: 'buildings', id: building.id }
  assert.equal(acceptedOrderEvidence(before, after, hit).kind, 'fresh-input-new-order')
  const alreadyAssigned = { ...before, units: [actor] }
  assert.equal(acceptedOrderEvidence(alreadyAssigned, after, hit).kind, 'fresh-input-existing-order')
  assert.throws(() => acceptedOrderEvidence(before, { ...after, lastOrderTurn: 9 }, hit), /fresh/)
  assert.throws(() => acceptedOrderEvidence(before, { ...after, pointerAck: before.pointerAck }, hit), /fresh/)
  assert.throws(() => acceptedOrderEvidence({ ...before, selected: [] }, after, hit), /recipient/)
  for (const invalid of [
    { ...actor, attackBuildingId: null, work: building.id, target: building.id },
    { ...actor, attackBuildingId: 1020, order: { ...order, a: building.id } },
    { ...actor, order: { ...order, flags: 1 } },
  ]) assert.throws(() => acceptedOrderEvidence(before, { ...after, units: [invalid] }, hit), /recipient/)
  assert.throws(() => acceptedOrderEvidence(before, after, { ...hit, collection: 'units' }), /recipient/)
  const ground = { ...after, pointerAck: { target: 0, until: 6 },
    effects: [{ id: 99, kind: 'orderMarker', x: 35, z: 81 }] }
  assert.throws(() => acceptedOrderEvidence(before, ground, { point: { x: 35, z: 81 } }), /recipient/)
})
