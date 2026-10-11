import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, applyHypnotise, command, createWorld, stepUnitHypnotise, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { startArmageddon } from '../app/armageddon.ts'
import {
  beginPrimaryPersonPass, endPrimaryPersonPass, hasPrimaryPersonVisit,
  isPrimaryPersonMember, personCounter, primaryPersonMembers,
  projectPersonCounter, restorePersonClock, visitPrimaryPerson,
} from '../app/person-clock.ts'

test('ordinary Mission 3 startup births retain distinct allocation phases before their first visit', () => {
  const w = createWorld(3)
  for (let n = 0; n < 100; n++) {
    const previous = new Set(w.units)
    tick(w, 1 / 12)
    const born = w.units.filter(u => !previous.has(u)).sort((a, b) => a.id - b.id)
    if (born.length < 2) continue
    const phases = born.map(u => (u.native ?? u.entry?.person ?? u.builder?.person)?.counter)
    assert.ok(phases.every(Number.isInteger), 'ordinary replacements have retained person owners')
    for (let i = 1; i < phases.length; i++)
      assert.equal(phases[i], (phases[i - 1] + 1) & 255,
        `distinct successful births at turn ${w.turn}: ${phases.join(',')}`)
    for (const u of born) {
      assert.equal(createLivePerson(w, u).counter, u.native.counter,
        'adapter reconstruction is not another allocation or a world-turn reseed')
    }
    return
  }
  assert.fail('ordinary startup did not produce a multi-person replacement wave')
})

test('class-1 allocation is shared across models/tribes, wraps, and ignores other object IDs', () => {
  const w = createWorld(3), initial = w.personClock.next
  const people = []
  for (let i = 0; i < 260; i++) {
    if (i === 2) addBuilding(w, 'blue', 'hut', { x: 0, z: 0 }, true)
    people.push(addUnit(w, i & 1 ? 'blue' : 'red', i & 2 ? 'warrior' : 'brave', { x: 0, z: 0 }))
  }
  assert.deepEqual(people.map(u => u.personCounter), people.map((_, i) => (initial + i) & 255))
  assert.equal(w.personClock.next, (initial + 260) & 255)
  w.units.splice(w.units.indexOf(people[0]), 1)
  assert.equal(addUnit(w, 'blue', 'brave', { x: 0, z: 0 }).personCounter, (initial + 260) & 255)
})

test('adapter reconstruction, registration and detached route projections never allocate or visit', () => {
  const w = createWorld(3), u = w.units.find(u => u.kind === 'shaman'), next = w.personClock.next
  const before = u.personCounter
  for (let i = 0; i < 3; i++) {
    const p = createLivePerson(w, u)
    registerLivePerson(w, p)
    assert.equal(p.counter, before)
  }
  const route = createLivePerson(w, u)
  w.pathfinding.people.set(u.id, route)
  visitPrimaryPerson(w, u)
  assert.equal(route.counter, (before + 1) & 255)
  route.counter = 99 // a parked projection cannot overwrite the retained clock
  projectPersonCounter(w, u, route)
  assert.equal(route.counter, u.personCounter)
  u.native = null
  assert.equal(createLivePerson(w, u).counter, u.personCounter)
  assert.equal(w.personClock.next, next)
})

test('primary membership excludes new/replaced identities and substeps share one visit, not one world turn', () => {
  const w = createWorld(3), u = w.units.find(u => u.kind === 'shaman'), before = u.personCounter
  beginPrimaryPersonPass(w)
  visitPrimaryPerson(w, u, u.native)
  visitPrimaryPerson(w, u, u.native)
  assert.equal(u.personCounter, (before + 1) & 255)
  const born = addUnit(w, 'blue', 'brave', u), phase = born.personCounter
  assert.equal(isPrimaryPersonMember(w, born), false)
  visitPrimaryPerson(w, born)
  assert.equal(born.personCounter, phase)
  w.units.splice(w.units.indexOf(u), 1)
  assert.equal(primaryPersonMembers(w).includes(u), true)
  assert.equal(isPrimaryPersonMember(w, u), false)
  visitPrimaryPerson(w, u)
  assert.equal(u.personCounter, (before + 1) & 255)
  endPrimaryPersonPass(w)
  // An explicit second traversal at the same world turn is not globally banned.
  beginPrimaryPersonPass(w)
  visitPrimaryPerson(w, born)
  assert.equal(born.personCounter, (phase + 1) & 255)
  endPrimaryPersonPass(w)
})

test('active reserved/casting/seated/training states visit; invalid residents/dead/state0 do not', () => {
  const w = createWorld(3), u = w.units.find(u => u.kind === 'shaman'), p = u.native
  for (const state of [10, 14, 21, 22, 24, 30, 39, 44]) {
    p.state = state
    const before = u.personCounter
    beginPrimaryPersonPass(w)
    visitPrimaryPerson(w, u, p)
    assert.equal(u.personCounter, (before + 1) & 255, `active state ${state}`)
    assert.equal(p.counter, u.personCounter)
    endPrimaryPersonPass(w)
  }
  p.state = 0
  assert.equal(hasPrimaryPersonVisit(w, u), false)
  p.state = 10; u.hp = 0
  assert.equal(hasPrimaryPersonVisit(w, u), false)
  p.state = 24
  assert.equal(hasPrimaryPersonVisit(w, u), true)
  p.state = 44
  assert.equal(hasPrimaryPersonVisit(w, u), true)
  p.state = 10; u.flight = p
  assert.equal(hasPrimaryPersonVisit(w, u), true)
  delete u.flight; u.native = null; u.hp = 100; u.inside = 1
  u.resident = { building: 1, slot: 0, person: p }
  assert.equal(hasPrimaryPersonVisit(w, u), false, 'an invalid retained slot cannot invent a visit')
  delete u.resident; u.inside = null; u.team = 'wild'
  assert.equal(hasPrimaryPersonVisit(w, u), true, 'unowned living legacy controller retains a visit')
})

test('new save/load retains aliases, future allocation order and ordinary continuation', () => {
  const w = createWorld(3)
  for (let i = 0; i < 24; i++) tick(w, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(w))
  const clocks = world => [world.personClock, world.units.map(u => [u.id, u.personCounter])]
  assert.deepEqual(clocks(restored), clocks(w))
  for (const world of [w, restored]) {
    addUnit(world, 'blue', 'brave', world.units[0])
    for (let i = 0; i < 20; i++) tick(world, 1 / 12)
  }
  assert.deepEqual(clocks(restored), clocks(w))
  assert.equal(restored.randomState, w.randomState)
  const u = w.units.find(u => u.native), p = u.native
  u.flight = p
  w.pathfinding.people.set(u.id, p)
  const cloned = structuredClone(w)
  restorePersonClock(cloned)
  const copy = cloned.units.find(x => x.id === u.id)
  assert.equal(copy.native, copy.flight)
  assert.equal(copy.native, cloned.pathfinding.people.get(u.id))
})

test('old checkpoints stay entirely legacy across births and saves; restart returns to fresh policy', async () => {
  const store = createGameStore(), w = store.getWorld()
  delete w.personClock
  migrateCheckpoint(w)
  assert.deepEqual(w.personClock, { mode: 'legacy', reason: 'checkpoint' })
  assert.ok(w.units.every(u => u.personCounter === undefined))
  const born = addUnit(w, 'blue', 'brave', w.units[0])
  assert.equal(born.personCounter, undefined)
  assert.equal(createLivePerson(w, born).counter, (w.turn - 1) & 255)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  assert.equal(store.getWorld().personClock.mode, 'legacy')
  assert.ok(store.getWorld().units.every(u => u.personCounter === undefined))
  store.restart()
  assert.equal(store.getWorld().personClock.mode, 'allocation')
  assert.ok(store.getWorld().units.every(u => Number.isInteger(u.personCounter)))
})

test('partial new clock metadata fails closed instead of guessing a seed or mixing modes', () => {
  const w = createWorld(3)
  delete w.units[0].personCounter
  assert.throws(() => migrateCheckpoint(w), /Incomplete saved/)
  const other = createWorld(3)
  delete other.personClock.next
  assert.throws(() => migrateCheckpoint(other), /Incomplete saved/)
})

test('Hypnotise replacement and expiry allocate new lives without visiting replacement identities in the pass', () => {
  const w = createWorld(3)
  w.terrain.fill(3); w.terrainVersion++
  const old = addUnit(w, 'red', 'brave', { x: 0, z: 0 }), initial = w.personClock.next
  beginPrimaryPersonPass(w)
  applyHypnotise(w, old, 'blue')
  const converted = w.units.find(u => u.hypnotise && u.x === old.x && u.z === old.z)
  assert.ok(converted)
  assert.equal(converted.personCounter, initial)
  assert.equal(isPrimaryPersonMember(w, old), false)
  assert.equal(isPrimaryPersonMember(w, converted), false)
  converted.hypnotise.remaining = 1; converted.hypnotise.counter = 7
  stepUnitHypnotise(w)
  assert.ok(w.units.includes(converted), 'same-pass newborn has no expiry visit')
  endPrimaryPersonPass(w)
  const seed = w.personClock.next
  for (let visits = 0; visits < 8 && w.units.includes(converted); visits++) {
    const phase = converted.personCounter
    beginPrimaryPersonPass(w)
    stepUnitHypnotise(w)
    if (((phase + 1) & 7) !== 0) {
      assert.ok(w.units.includes(converted))
      assert.equal(converted.hypnotise.counter, converted.personCounter)
    }
    if (w.units.includes(converted)) endPrimaryPersonPass(w)
  }
  const restored = w.units.find(u => u.team === 'red' && u.x === old.x && u.z === old.z)
  assert.ok(restored && restored !== old)
  assert.equal(restored.personCounter, seed)
  assert.equal(isPrimaryPersonMember(w, restored), false)
  endPrimaryPersonPass(w)
})

test('Armageddon reconstruction explicitly switches the whole world to permanent legacy compatibility', () => {
  const w = createWorld(17), shaman = w.units.find(u => u.kind === 'shaman' && u.team === 'blue')
  assert.equal(w.personClock.mode, 'allocation')
  assert.ok(startArmageddon(w, { id: w.nextId++, x: shaman.x, z: shaman.z }))
  assert.deepEqual(w.personClock, { mode: 'legacy', reason: 'armageddon' })
  assert.ok(w.units.every(u => u.personCounter === undefined))
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(restored.personClock, w.personClock)
  assert.equal(addUnit(restored, 'blue', 'brave', shaman).personCounter, undefined)
  assert.equal(createWorld(17).personClock.mode, 'allocation')
})


test('expiry removes deferred contact and burning identities before their post-person consumers', () => {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  const source = addUnit(w, 'red', 'brave', { x: 0, z: 8 })
  applyHypnotise(w, source, 'blue')
  const u = w.units.find(u => u.hypnotise), target = addUnit(w, 'red', 'brave', u)
  for (let n = 0; (u.personCounter & 7) !== 7 && n < 8; n++) visitPrimaryPerson(w, u, u.native)
  assert.equal(u.personCounter & 7, 7)
  u.hypnotise.remaining = 1
  u.target = target.id
  u.burnTrail = 2
  const effects = new Set(w.effects), seed = w.personClock.next
  tick(w, 1 / 12)
  assert.ok(!w.units.includes(u))
  assert.equal(w.personClock.next, (seed + 1) & 255)
  assert.equal(w.fights.length, 0)
  assert.equal(target.fight, null)
  assert.equal(u.fight, null)
  assert.equal(w.effects.filter(fx => !effects.has(fx) && fx.kind === 'trail').length, 0)
})

test('dead active Tornado throw still receives its genuine primary visit before becoming flight', () => {
  const w = createStartedWorld(), u = addUnit(w, 'blue', 'brave', { x: 0, z: 8 })
  u.native = createLivePerson(w, u)
  u.native.state = 24; u.native.stateObject = 0; u.hp = 0
  const phase = u.personCounter, p = u.native
  tick(w, 1 / 12)
  assert.equal(u.personCounter, (phase + 1) & 255)
  assert.equal(p.counter, u.personCounter)
  assert.equal(u.flight, p)
  assert.ok(w.units.includes(u))
})

test('a hypnotised marcher exposes the previous person phase to formations before its primary visit', () => {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  for (let i = 0; i < 5; i++) addUnit(w, 'red', 'brave', { x: i / 8, z: 8 })
  applyHypnotise(w, { x: 0, z: 8 }, 'blue')
  w.selected = w.units.map(u => u.id)
  assert.ok(command(w, { x: 10, z: 8 }))
  for (let n = 0; !w.marching.length && n < 100; n++) tick(w, 1 / 12)
  assert.ok(w.marching.length)
  const memberIds = new Set(w.marching.flatMap(g => g.members)), reads = []
  const people = w.units.filter(u => memberIds.has(u.id) && u.hypnotise)
  assert.ok(people.length > 1)
  const before = new Map(people.map(u => [u.id, u.personCounter]))
  for (const u of people) {
    const p = u.native
    let value = p.counter
    Object.defineProperty(p, 'counter', { configurable: true, enumerable: true,
      get() { if (new Error().stack.includes('marching-formations.ts')) reads.push([u.id, value]); return value },
      set(next) { value = next },
    })
  }
  tick(w, 1 / 12)
  assert.ok(reads.length, 'actual formation counter consumer was reached')
  for (const [id, value] of reads) assert.equal(value, before.get(id))
  for (const u of people) {
    assert.equal(u.personCounter, (before.get(u.id) + 1) & 255)
    assert.equal(u.hypnotise.counter, u.personCounter)
  }
})
