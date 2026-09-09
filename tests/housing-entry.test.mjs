import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/building-entry-clocks.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { stepBuildingEntryClocks } from '../app/training.ts'
import { buildingInsidePoint } from '../app/building-shapes.ts'
import { createWorld, addBuilding, addUnit, command, tick, buildingPose, nativePosition, unitAnimationSource } from '../app/model.ts'
import { initializeLivePanic } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'

function scenario(direction = 0, count = 1, level = 1) {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units = w.units.filter(u => u.kind === 'shaman')
  const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true, { angle: direction * Math.PI / 2, level })
  const people = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', 'brave', { x: 7 + i * 0.25, z: 33 }))
  w.selected = people.map(u => u.id)
  command(w, b)
  return { w, b, people }
}

function until(w, condition, limit = 180) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), 'housing scenario must reach the expected phase')
}

test('building admission clocks match captured native blocks', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const state = structuredClone(c.before)
    stepBuildingEntryClocks(state, c.counter)
    assert.deepEqual(state, c.expected)
  }
})

test('followers visibly cross the native interior threshold before housing consumes their command', () => {
  for (const level of [1, 2, 3]) for (let direction = 0; direction < 4; direction++) {
    const { w, b, people: [u] } = scenario(direction, 1, level)
    until(w, () => u.entry?.person.substate === 5)
    const entry = u.entry, p = entry.person
    assert.equal(u.inside, null, 'door arrival is not admission')
    assert.equal(u.native, null, 'ordinary state ownership remains separate')
    assert.equal(unitAnimationSource(u), p)
    assert.equal(p.object, rules.animationObjects[rules.personAnimationObjects[9 + p.model]][0])
    assert.equal(entry.orders.records[1].references, 1)
    const door = { x: u.x, z: u.z }
    until(w, () => u.inside === b.id)
    assert.ok(Math.hypot(u.x - door.x, u.z - door.z) > 1, 'entry requires actual movement inside')
    const inside = buildingInsidePoint(buildingPose(b)), position = nativePosition(w, u)
    assert.ok(Math.abs(((position.x - inside.x) << 16) >> 16) < 112)
    assert.ok(Math.abs(((position.y - inside.y) << 16) >> 16) < 112)
    assert.equal(p.flags2 & 0x804000, 0x804000)
    assert.equal(p.renderFlags & 16, 16)
    assert.equal(entry.orders.records[1].references, 0)
    assert.equal(entry.orders.active, 0)
    assert.equal(u.entry, undefined)
    assert.equal(unitAnimationSource(u), null)
  }
})

test('simultaneous arrivals respect hut capacity and cancellation releases the scoped animation and route', () => {
  const { w, b, people } = scenario(0, 4)
  for (let i = 0; i < 180; i++) {
    tick(w, 1 / 12)
    assert.ok(people.filter(u => u.inside === b.id).length <= 3)
  }
  assert.equal(people.filter(u => u.inside === b.id).length, 3)
  const other = scenario(), u = other.people[0]
  until(other.w, () => u.entry?.person.substate === 5)
  other.w.selected = [u.id]
  const before = [u.x, u.z]
  command(other.w, { x: 9, z: 30 })
  assert.equal(u.entry, undefined)
  assert.equal(unitAnimationSource(u), null)
  assert.deepEqual([u.x, u.z], before)
  assert.ok(u.path.length)
  until(other.w, () => u.path.length === 0)
  assert.equal(u.inside, null)
})

test('fire interrupts entry without retaining its walking sprites or command record', () => {
  const { w, people: [u] } = scenario()
  until(w, () => u.entry?.person.substate === 5)
  initializeLivePanic(w, u)
  assert.equal(u.entry, undefined)
  assert.equal(u.native.state, 26)
  assert.equal(u.path.length, 0)
  for (let i = 0; i < 65; i++) tick(w, 1 / 12)
  assert.equal(u.native, null)
})

test('staged entry positions, RNG, admission and sprite clocks are independent of rendered frame rate', () => {
  const run = hz => {
    const { w, b, people } = scenario(1, 3), clock = { animationTime: 0, animationFrame: 0 }
    for (let i = 0; i < hz * 6; i++) advanceGame(w, clock, 1 / hz)
    return { turn: w.turn, random: w.randomState, admission: b.admission,
      people: people.map(u => ({ x: u.x, z: u.z, inside: u.inside, entry: u.entry })) }
  }
  const expected = run(144)
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(hz), expected)
})

test('entry re-plans interrupted steering and releases its source when the hut becomes unavailable', () => {
  const { w, b, people: [u] } = scenario()
  tick(w, 1 / 12)
  const p = u.entry.person
  p.flags2 = (p.flags2 | 0x80000000) >>> 0
  tick(w, 1 / 12)
  assert.equal(p.flags2 & 0x80000000, 0)
  until(w, () => u.entry?.person.substate === 5)
  b.progress = 0.5
  tick(w, 1 / 12)
  assert.equal(u.entry, undefined)
  assert.notEqual(unitAnimationSource(u), p)
  assert.notEqual(w.pathfinding.people.get(u.id), p)
})
