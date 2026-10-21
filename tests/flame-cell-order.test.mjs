import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, cast, command, selectUnit, tick } from '../app/model.ts'
import { buildingFirePoints, buildingPose } from '../app/building-shapes.ts'
import { buildingFirePeople, initializeLivePanic } from '../app/live-people.ts'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { ignitePeopleInFireCell } from '../app/person-panic.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

const referenceId = scalableReferenceIds(3)

const ids = [309, 312].map(referenceId)
const personOutcomes = world =>
  ids.map(id => {
    const unit = world.units.find(unit => unit.id === id),
      person = unit.native
    return { id, angle: person.turnAngle, trail: person.burnTrail, state: person.state }
  })
async function pendingIgnition() {
  const store = await createCampaignFixtureStore([3])
  assert.equal(store.startMission(3), true)
  const world = finishLevelStart(store.getWorld()),
    hut = world.buildings.find(building => building.team === 'blue' && building.kind === 'hut'),
    points = buildingFirePoints(buildingPose(hut)),
    target = browserPosition(points[0])
  for (const unit of world.units.filter(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.id !== referenceId(312)
  )) {
    selectUnit(world, unit.id, false)
    assert.ok(command(world, target))
  }
  for (let turn = 0; turn < 4; turn++) tick(world, 1 / 12)
  selectUnit(world, referenceId(312), false)
  assert.ok(command(world, target))
  while (world.turn < 121) tick(world, 1 / 12)
  // Only stock is supplied. Authored people, hut, entry/departure and ignition
  // retain their normal command, movement and effect ownership.
  world.shots.lightning = 1
  assert.ok(cast(world, 'lightning', target))
  while (world.turn < 131) tick(world, 1 / 12)
  for (const id of ids) {
    selectUnit(world, id, false)
    assert.ok(command(world, { x: 35, z: 83 }, { ctrlKey: true }))
    assert.ok(command(world, { x: 35, z: 81 }))
  }
  const point = points[2],
    packed = ((point.x >>> 8) & 254) | (point.y & 0xfe00),
    linked = [...objectsInCell(world.objectCells, packed)].filter(person => ids.includes(person.id))
  assert.deepEqual(
    linked.map(person => person.id),
    [312, 309].map(referenceId)
  )
  for (const person of linked)
    assert.equal(world.units.find(unit => unit.id === person.id).native, person)
  assert.ok(!hut.burn)
  return { world, store, point, packed, linked, hutId: hut.id }
}

function igniteReference(world, people) {
  ignitePeopleInFireCell(world, 0, people, person => {
    const unit = world.units.find(unit => unit.native === person)
    unit.native = person
    initializeLivePanic(world, unit)
  })
}

// Independent 004d2740 state26 + 00408840 body: speed, direction, trail.
// Keep this local oracle independent of the preceding campaign's global RNG,
// whose native cast ownership deliberately no longer runs idle after six visits.
function nativeIgnition(seed, orderedIds) {
  let randomState = seed
  const draw = () => {
    const value = (Math.imul(randomState, 0x24a1) + 0x24df) >>> 0
    return randomState = ((value >>> 13) | (value << 19)) >>> 0
  }
  const people = orderedIds.map(id => {
    draw()
    const angle = draw() & 2047, trail = (draw() & 7) + 8
    return { id, angle, trail, state: 26 }
  })
  return { randomState, people: people.sort((a, b) => a.id - b.id) }
}

test('ordinary Mission 3 fire assigns panic directions in retained person order and survives Save/Load', async () => {
  const { world, store, hutId } = await pendingIgnition()
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  for (const candidate of [world, restored]) {
    tick(candidate, 1 / 12)
    assert.ok(candidate.buildings.find(building => building.id === hutId).burn)
    // Current full-campaign trace. The independent local draw/order oracle below
    // guards the native behavior rather than blessing this new seed by itself.
    assert.equal(candidate.randomState, 3347046661)
    assert.deepEqual(personOutcomes(candidate), [
      { id: referenceId(309), angle: 1629, trail: 9, state: 26 },
      { id: referenceId(312), angle: 1545, trail: 11, state: 26 },
    ])
  }
  assert.deepEqual(restored, world)
  for (let turn = 0; turn < 200; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, world)
  assert.ok(ids.every(id => world.units.some(unit => unit.id === id && unit.hp > 0)))
})

test('source-ordered snapshot matches per-person panic draws without changing aggregate RNG', async () => {
  const { world, point, packed } = await pendingIgnition(),
    expected = structuredClone(world),
    linked = [...objectsInCell(expected.objectCells, packed)].filter(person =>
      ids.includes(person.id)
    ),
    native = nativeIgnition(world.randomState, linked.map(person => person.id))
  igniteReference(expected, linked)
  buildingFirePeople(world)(point, 0)
  assert.deepEqual(personOutcomes(world), personOutcomes(expected))
  assert.equal(world.randomState, expected.randomState)
  assert.equal(world.randomState, native.randomState)
  assert.deepEqual(personOutcomes(world), native.people)
})

test('unregistered, partial and same-ID alias slots retain their previous fallback', async () => {
  for (const mode of ['unregistered', 'partial', 'alias']) {
    const { world, point, linked } = await pendingIgnition()
    for (const person of mode === 'unregistered' ? linked : linked.slice(0, 1)) {
      if (mode === 'alias') world.objectCells.objects.set(person.id, structuredClone(person))
      else {
        removeObjectFromCell(world.objectCells, person)
        world.objectCells.objects.delete(person.id)
      }
    }
    const expected = structuredClone(world),
      legacy = [...expected.units]
        .reverse()
        .filter(unit => ids.includes(unit.id))
        .map(unit => unit.native)
    igniteReference(expected, legacy)
    buildingFirePeople(world)(point, 0)
    assert.deepEqual(personOutcomes(world), personOutcomes(expected), mode)
    assert.equal(world.randomState, expected.randomState, mode)
  }
})

test('duplicate roster ownership keeps the fallback rather than overrunning the projection', async () => {
  const { world, point } = await pendingIgnition(),
    unit = world.units.find(unit => unit.id === referenceId(312))
  // Deliberately supplied malformed ownership, not an ordinary producer.
  world.units.push(unit)
  const expected = structuredClone(world),
    legacy = [...expected.units]
      .reverse()
      .filter(unit => ids.includes(unit.id))
      .map(unit => unit.native)
  igniteReference(expected, legacy)
  assert.doesNotThrow(() => buildingFirePeople(world)(point, 0))
  assert.deepEqual(personOutcomes(world), personOutcomes(expected))
  assert.equal(world.randomState, expected.randomState)
})

test('repeated sockets preserve the snapshot when registry ownership changes before visits', async () => {
  const { world, point, packed, linked } = await pendingIgnition(),
    expected = structuredClone(world),
    referencePeople = [...objectsInCell(expected.objectCells, packed)].filter(person =>
      ids.includes(person.id)
    ),
    ignite = buildingFirePeople(world)
  for (const person of linked) {
    removeObjectFromCell(world.objectCells, person)
    world.objectCells.objects.delete(person.id)
  }
  for (let socket = 0; socket < 2; socket++) {
    igniteReference(expected, referencePeople)
    ignite(point, 0)
    assert.deepEqual(personOutcomes(world), personOutcomes(expected))
    assert.equal(world.randomState, expected.randomState)
  }
})
