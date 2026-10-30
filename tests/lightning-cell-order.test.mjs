import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, tick } from '../app/model.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { strikeLiveLightning } from '../app/live-people.ts'
import { strikeLightning } from '../app/lightning.ts'
import { random } from '../app/native-math.ts'

const referenceId = scalableReferenceIds(3)

const nativeDeaths = [303, 306, 309, 312, 516, 519, 589].map(referenceId),
  legacyDeaths = [303, 306, 507, 510, 513, 516, 589].map(referenceId)

async function pendingStrike() {
  const store = await createCampaignFixtureStore([3])
  assert.equal(store.startMission(3), true)
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
    [306, 303, 312, 516, 309, 519, 589, 510, 507, 513].map(referenceId)
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

test('ordinary converging followers receive Lightning in retained cell order at the inclusive cap', async () => {
  const { world, ids, linked } = await pendingStrike()
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
  const { store, ids } = await pendingStrike()
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const world = store.getWorld()
  tick(world, 1 / 12)
  assert.deepEqual(deaths(world, ids), nativeDeaths)
})

test('Lightning keeps the unregistered fallback and excludes same-ID aliases', async () => {
  for (const mode of ['unregistered', 'partial', 'alias']) {
    const { world, bolt, ids } = await pendingStrike()
    const people =
      mode === 'unregistered'
        ? [...world.objectCells.objects.values()]
        : [world.objectCells.objects.get(referenceId(312))]
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
      mode === 'unregistered' ? legacyDeaths : [303, 306, 309, 510, 516, 519, 589].map(referenceId),
      mode
    )
  }
})

test('immune people do not consume the Lightning cap and protected transitions still count', async () => {
  const { world, bolt, ids, linked } = await pendingStrike()
  linked[0].flags3 |= 0x20000
  linked[1].flags3 |= 0x8000
  linked[2].flags2 |= 0x100000
  const expected = sourceDeaths(linked),
    previousState = linked[2].state
  assert.deepEqual(expected, [309, 312, 507, 510, 516, 519, 589].map(referenceId))
  strikeLiveLightning(world, bolt.target, 0)
  assert.deepEqual(deaths(world, ids), expected)
  assert.equal(linked[2].state, previousState)
})

test('Lightning snapshots ordering before its first victim callback can remove another owner', async () => {
  const { world, bolt, ids, linked } = await pendingStrike(),
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

test('supplied malformed duplicate roster owners retain Lightning fallback tolerance', async () => {
  for (const sameUnit of [true, false]) {
    const { world, bolt, ids, linked } = await pendingStrike(),
      unit = world.units.find(candidate => candidate.id === linked[0].id)
    // No ordinary producer is established. Preserve the prior adapter's behavior,
    // including repeated entries, rather than inventing a deduplication policy.
    world.units.push(sameUnit ? unit : { ...unit })
    assert.doesNotThrow(() => strikeLiveLightning(world, bolt.target, 0))
    assert.deepEqual(
      deaths(world, ids),
      sameUnit ? [303, 306, 306, 507, 510, 513, 589].map(referenceId) : [303, 306, 507, 510, 513, 589].map(referenceId)
    )
  }
})
