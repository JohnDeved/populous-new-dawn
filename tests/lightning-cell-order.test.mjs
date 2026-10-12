import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { strikeLiveLightning } from '../app/live-people.ts'
import { strikeLightning } from '../app/lightning.ts'
import { random } from '../app/native-math.ts'

const nativeDeaths = [303, 306, 309, 312, 516, 519, 589],
  legacyDeaths = [303, 306, 507, 510, 513, 516, 589]

function pendingStrike() {
  const store = createGameStore()
  store.startMission(3)
  const world = finishLevelStart(store.getWorld()),
    ids = world.units
      .filter(unit => unit.team === 'blue' && unit.kind === 'brave')
      .map(unit => unit.id)
  assert.equal(ids.length, 12)
  for (const id of ids) {
    world.selected = [id]
    assert.ok(command(world, { x: 35, z: 85 }))
  }
  for (let turn = 0; turn < 9; turn++) tick(world, 1 / 12)
  // Stock is supplied; actors, movement, casting, arrival and damage are ordinary gameplay.
  world.shots.lightning = 1
  assert.ok(cast(world, 'lightning', { x: 35, z: 85 }))
  let bolt
  for (let turn = 0; turn < 100; turn++) {
    bolt = world.effects.find(effect => effect.lightning)?.lightning
    if (bolt?.turn === -1) break
    tick(world, 1 / 12)
  }
  assert.equal(bolt?.turn, -1)
  const cell = (bolt.target.y & 0xfe00) | ((bolt.target.x >>> 8) & 254),
    linked = [...objectsInCell(world.objectCells, cell)].filter(person => ids.includes(person.id))
  assert.deepEqual(
    linked.map(person => person.id),
    [306, 303, 312, 516, 309, 519, 589, 510, 507, 513]
  )
  return { world, store, bolt, ids, linked }
}
const deaths = (world, ids) =>
  world.units
    .filter(unit => ids.includes(unit.id) && unit.hp === 0)
    .map(unit => unit.id)
    .toSorted((a, b) => a - b)

function sourceDeaths(linked) {
  const people = structuredClone(linked)
  strikeLightning(people, 0, () => {})
  return people
    .filter(person => person.life === 0)
    .map(person => person.id)
    .toSorted((a, b) => a - b)
}

test('ordinary converging followers receive Lightning in retained cell order at the inclusive cap', () => {
  const { world, ids, linked } = pendingStrike()
  assert.deepEqual(sourceDeaths(linked), nativeDeaths)
  tick(world, 1 / 12)
  assert.deepEqual(deaths(world, ids), nativeDeaths)
  assert.equal(
    world.units.filter(unit => ids.includes(unit.id) && unit.native?.state === 44).length,
    7
  )
  for (let turn = 0; turn < 200; turn++) tick(world, 1 / 12)
  assert.ok(nativeDeaths.every(id => !world.units.some(unit => unit.id === id)))
  assert.ok(
    ids
      .filter(id => !nativeDeaths.includes(id))
      .every(id => world.units.some(unit => unit.id === id && unit.hp > 0))
  )
})

test('public Save/Load preserves pending Lightning recipient identities', async () => {
  const { store, ids } = pendingStrike()
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const world = store.getWorld()
  tick(world, 1 / 12)
  assert.deepEqual(deaths(world, ids), nativeDeaths)
})

test('Lightning keeps the unregistered fallback and excludes same-ID aliases', () => {
  for (const mode of ['unregistered', 'partial', 'alias']) {
    const { world, bolt, ids } = pendingStrike()
    const people =
      mode === 'unregistered'
        ? [...world.objectCells.objects.values()]
        : [world.objectCells.objects.get(312)]
    for (const person of people) {
      if (mode === 'alias') world.objectCells.objects.set(person.id, structuredClone(person))
      else {
        removeObjectFromCell(world.objectCells, person)
        world.objectCells.objects.delete(person.id)
      }
    }
    const expectedRng = { randomState: world.randomState }
    // State44 initialization samples ordinary person speed once before stopping.
    for (let victim = 0; victim < 7; victim++) random(expectedRng)
    strikeLiveLightning(world, bolt.target, 0)
    assert.equal(world.randomState, expectedRng.randomState)
    assert.deepEqual(
      deaths(world, ids),
      mode === 'unregistered' ? legacyDeaths : [303, 306, 309, 510, 516, 519, 589],
      mode
    )
  }
})

test('immune people do not consume the Lightning cap and protected transitions still count', () => {
  const { world, bolt, ids, linked } = pendingStrike()
  linked[0].flags3 |= 0x20000
  linked[1].flags3 |= 0x8000
  linked[2].flags2 |= 0x100000
  const expected = sourceDeaths(linked),
    previousState = linked[2].state
  assert.deepEqual(expected, [309, 312, 507, 510, 516, 519, 589])
  strikeLiveLightning(world, bolt.target, 0)
  assert.deepEqual(deaths(world, ids), expected)
  assert.equal(linked[2].state, previousState)
})

test('Lightning snapshots ordering before its first victim callback can remove another owner', () => {
  const { world, bolt, ids, linked } = pendingStrike(),
    [first, , later] = linked
  let flags = first.flags3,
    removed = false
  Object.defineProperty(first, 'flags3', {
    enumerable: true,
    configurable: true,
    get() {
      if (!removed) {
        removed = true
        removeObjectFromCell(world.objectCells, later)
        world.objectCells.objects.delete(later.id)
      }
      return flags
    },
    set(value) {
      flags = value
    },
  })
  strikeLiveLightning(world, bolt.target, 0)
  assert.ok(removed)
  assert.deepEqual(deaths(world, ids), nativeDeaths)
})
