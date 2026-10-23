import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, createWorld, select, tick } from '../app/model.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { stepBlastWave } from '../app/blast-wave.ts'
import { stepLiveBlastWave } from '../app/spell-effects-runtime.ts'

const referenceId = scalableReferenceIds(3)

async function pendingFinalWave() {
  const store = await createCampaignFixtureStore([3])
  assert.equal(store.startMission(3), true)
  const world = finishLevelStart(store.getWorld()),
    mover = world.units.find(unit => unit.id === referenceId(312)),
    origin = { x: mover.x, z: mover.z },
    originalCell = (mover.native.y >>> 9) * 128 + (mover.native.x >>> 9),
    roster = world.units.filter(unit => unit.team === 'blue').map(unit => unit.id)
  world.selected = [mover.id]
  assert.ok(command(world, { x: origin.x + 4, z: origin.z }))
  for (
    let turn = 0;
    turn < 180 && Math.hypot(mover.x - origin.x - 4, mover.z - origin.z) > 0.25;
    turn++
  )
    tick(world, 1 / 12)
  assert.notEqual((mover.native.y >>> 9) * 128 + (mover.native.x >>> 9), originalCell)
  world.selected = [mover.id]
  assert.ok(command(world, origin))
  for (
    let turn = 0;
    turn < 180 && Math.hypot(mover.x - origin.x, mover.z - origin.z) > 0.25;
    turn++
  )
    tick(world, 1 / 12)
  assert.equal((mover.native.y >>> 9) * 128 + (mover.native.x >>> 9), originalCell)
  assert.deepEqual(
    world.units.filter(unit => roster.includes(unit.id)).map(unit => unit.id),
    roster
  )
  select(world, 'shaman')
  assert.ok(cast(world, 'blast', { x: 36, z: 83 }))
  let wave
  for (let turn = 0; turn < 100; turn++) {
    wave = world.effects.find(effect => effect.wave)?.wave
    if (wave?.remaining === 1) break
    tick(world, 1 / 12)
  }
  assert.equal(wave?.remaining, 1)
  assert.equal(
    world.units.some(unit => unit.flight),
    false
  )
  return { world, wave, store }
}

function nativeAlliedVisits(world, wave) {
  const records = new Map(
      world.units
        .filter(unit => unit.hp > 0 && unit.inside === null && unit.native)
        .map(unit => [unit.id, structuredClone(unit.native)])
    ),
    visits = []
  stepBlastWave(
    {
      randomState: world.randomState,
      search: structuredClone(world.indexedSearch),
      land: world.land,
      alliances: world.outcome.alliances,
      special: false,
    },
    structuredClone(wave),
    {
      cell: index =>
        [
          ...objectsInCell(
            world.objectCells,
            ((index % 128) * 2) | ((Math.floor(index / 128) * 2) << 8)
          ),
        ]
          .map(object => records.get(object.id))
          .filter(Boolean),
      building: () => undefined,
    },
    {
      panic: () => {},
      animation: person => visits.push(person.id),
      damage: () => {},
      buildingDamage: () => {},
      vehicleDamage: () => {},
      remove: () => {},
    }
  )
  return visits
}
const flights = world => world.units.filter(unit => unit.flight).map(unit => unit.id)

test('ordinary moved followers receive Blast in retained cell order at the five-visit allied cap', async () => {
  const { world, wave } = await pendingFinalWave()
  // 0050b740 counts visits, not unique followers: type2 search repeats its ring0 cell.
  assert.deepEqual(nativeAlliedVisits(world, wave), [507, 507, 312, 309, 513].map(referenceId))
  tick(world, 1 / 12)
  assert.deepEqual(flights(world), [312, 309, 513, 507].map(referenceId))
})

test('public checkpoint continuation preserves the pending Blast cap and linked identities', async () => {
  const { store } = await pendingFinalWave()
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld(),
    { wave } = restored.effects.find(effect => effect.wave)
  assert.deepEqual(nativeAlliedVisits(restored, wave), [507, 507, 312, 309, 513].map(referenceId))
  tick(restored, 1 / 12)
  assert.deepEqual(flights(restored), [312, 309, 513, 507].map(referenceId))
})

test('unregistered legacy people retain the existing Blast fallback ordering', async () => {
  const { world, wave } = await pendingFinalWave()
  for (const person of world.objectCells.objects.values()) {
    if (person.flags2 & 0x20000) removeObjectFromCell(world.objectCells, person)
    world.objectCells.objects.delete(person.id)
  }
  stepLiveBlastWave(world, wave)
  assert.deepEqual(flights(world), [312, 309, 510, 507].map(referenceId))
})

test('a mixed registered/unregistered cell retains the unregistered person slot', async () => {
  const { world, wave } = await pendingFinalWave(),
    person = world.objectCells.objects.get(referenceId(513))
  removeObjectFromCell(world.objectCells, person)
  world.objectCells.objects.delete(person.id)
  stepLiveBlastWave(world, wave)
  assert.deepEqual(flights(world), [312, 309, 510, 507].map(referenceId))
})

test('a same-ID cell alias cannot reorder a different live person owner', async () => {
  const { world, wave } = await pendingFinalWave(),
    person = world.objectCells.objects.get(referenceId(513))
  world.objectCells.objects.set(person.id, structuredClone(person))
  stepLiveBlastWave(world, wave)
  assert.deepEqual(flights(world), [312, 309, 510, 507].map(referenceId))
})

test('Blast snapshots owned slots before callbacks and preserves allied RNG', async () => {
  const { world, wave } = await pendingFinalWave(),
    first = world.units.find(unit => unit.id === referenceId(507)).native,
    later = world.objectCells.objects.get(referenceId(513)),
    random = world.randomState
  let flags = first.flags4,
    interrupted = false
  Object.defineProperty(first, 'flags4', {
    configurable: true,
    enumerable: true,
    get() {
      if (!interrupted) {
        interrupted = true
        removeObjectFromCell(world.objectCells, later)
        world.objectCells.objects.delete(later.id)
      }
      return flags
    },
    set(value) {
      flags = value
    },
  })
  stepLiveBlastWave(world, wave)
  assert.ok(interrupted)
  assert.deepEqual(flights(world), [312, 309, 513, 507].map(referenceId))
  assert.equal(world.randomState, random)
})

test('an unregistered vehicle retains its mixed-class slot before projected people', async () => {
  const { world, wave } = await pendingFinalWave(),
    person = world.objectCells.objects.get(referenceId(513)),
    boat = {
      ...createWorld(22).vehicles.find(vehicle => vehicle.model === 1),
      id: world.nextId++,
      x: person.x,
      y: person.y,
      h: person.h,
      team: 'red',
      apparentTribe: 1,
      active: true,
      passengers: [],
      passengerCount: 0,
    },
    events = []
  // Staged mixed-class adapter control; the ordinary cast witness above supplies no vehicle.
  let life = 5000,
    flags = person.flags4
  Object.defineProperty(boat, 'life', {
    enumerable: true,
    get: () => life,
    set(value) {
      events.push('vehicle')
      life = value
    },
  })
  Object.defineProperty(person, 'flags4', {
    enumerable: true,
    configurable: true,
    get() {
      events.push('person')
      return flags
    },
    set(value) {
      flags = value
    },
  })
  world.vehicles.push(boat)
  stepLiveBlastWave(world, wave)
  assert.equal(life, 4950)
  assert.equal(events[0], 'vehicle')
  assert.ok(events.includes('person'))
  assert.deepEqual(flights(world), [312, 309, 513, 507].map(referenceId))
})

test('supplied malformed distinct roster IDs sharing one person retain Blast fallback tolerance', async () => {
  const { world, wave } = await pendingFinalWave(),
    unit = world.units.find(candidate => candidate.id === referenceId(513))
  // Deliberately malformed compatibility control, without an ordinary producer.
  world.units.push({ ...unit, id: world.nextId++ })
  assert.doesNotThrow(() => stepLiveBlastWave(world, wave))
  assert.deepEqual(flights(world), [312, 309, 513, 507].map(referenceId))
})
