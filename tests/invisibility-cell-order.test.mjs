import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createWorld,
  addUnit,
  browserPosition,
  nativePosition,
  invisibilityFollowers,
  setUnitInvisibility,
  cast,
  tick,
} from '../app/model.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { objectsInCell, moveObjectInCells } from '../app/object-cells.ts'
import { positionDistance } from '../app/native-math.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function field() {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  return w
}
function person(w, x, y, team = 'blue', kind = 'brave') {
  const u = addUnit(w, team, kind, browserPosition({ x, y }))
  u.native = createLivePerson(w, u)
  return u
}
const aim = (x, y) => browserPosition({ x, y })
const ids = units => units.map(u => u.id)
const cell = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)
const chain = (w, p) => [...objectsInCell(w.objectCells, cell(p))].map(p => p.id)

test('Invisibility tie recipients stay fixed when only the browser unit array is permuted', () => {
  const w = field(),
    people = Array.from({ length: 7 }, () => person(w, 0x2100, 0x2100))
  syncLivePersonCells(w)
  const reordered = structuredClone(w)
  reordered.units.reverse()
  const before = chain(w, { x: 0x2100, y: 0x2100 }),
    rng = w.randomState
  assert.deepEqual(before, ids(people).reverse())
  assert.deepEqual(chain(reordered, { x: 0x2100, y: 0x2100 }), before)
  assert.deepEqual(
    ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')),
    ids(people.slice(0, 6))
  )
  assert.deepEqual(
    ids(invisibilityFollowers(reordered, aim(0x2100, 0x2100), 'blue')),
    ids(people.slice(0, 6))
  )
  assert.deepEqual(chain(w, { x: 0x2100, y: 0x2100 }), before)
  assert.equal(w.randomState, rng)
})

test('native cell departure and return changes ties without reordering browser units', () => {
  const w = field(),
    people = Array.from({ length: 7 }, () => person(w, 0x2100, 0x2100))
  syncLivePersonCells(w)
  const p = people[0].native
  moveObjectInCells(w.objectCells, p, { x: 0x2300, y: p.y, h: p.h })
  moveObjectInCells(w.objectCells, p, { x: 0x2100, y: p.y, h: p.h })
  assert.deepEqual(ids(w.units), ids(people))
  assert.deepEqual(ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')), ids(people.slice(1)))
})

test('unique-distance recipients remain nearest-six even when the closest is discovered last', () => {
  const w = field(),
    people = [600, 500, 400, 300, 200, 100, 0].map(dx => person(w, 0x2100 + dx, 0x2100))
  syncLivePersonCells(w)
  const reordered = structuredClone(w)
  reordered.units.reverse()
  const expected = ids(people.slice(1).reverse())
  assert.deepEqual(ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')), expected)
  assert.deepEqual(ids(invisibilityFollowers(reordered, aim(0x2100, 0x2100), 'blue')), expected)
})

test('native wrapped cells and cross-cell tie priority determine the capped set', () => {
  const w = field(),
    earlier = Array.from({ length: 6 }, () => person(w, 0xffff, 0)),
    later = person(w, 1, 0),
    outside = person(w, 0x400, 0)
  syncLivePersonCells(w)
  assert.deepEqual(ids(invisibilityFollowers(w, aim(0, 0), 'blue')), [
    later.id,
    ...ids(earlier.slice(0, 5)),
  ])
  assert.equal(outside.invisibility, undefined)
})

test('unregistered placeholders are absent from the native scan', () => {
  const w = field(),
    live = person(w, 0x2120, 0x2100),
    placeholder = addUnit(w, 'blue', 'brave', aim(0x2100, 0x2100))
  syncLivePersonCells(w)
  assert.equal(w.objectCells.objects.has(placeholder.id), false)
  assert.deepEqual(ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')), [live.id])
  assert.equal(placeholder.invisibility, undefined)
})

test('the existing browser predicate remains separate from the unavailable native predicate', () => {
  const w = field(),
    existing = person(w, 0x2100, 0x2100),
    enemy = person(w, 0x2100, 0x2100, 'red'),
    shaman = person(w, 0x2100, 0x2100, 'blue', 'shaman'),
    ghost = person(w, 0x2100, 0x2100),
    hypnotised = person(w, 0x2100, 0x2100)
  setUnitInvisibility(w, existing, 7)
  ghost.ghost = true
  ghost.native.flags4 |= 0x800
  hypnotised.hypnotise = { originalTeam: 'red', remaining: 55, counter: 0 }
  hypnotised.native.flags4 |= 0x4000
  syncLivePersonCells(w)
  assert.deepEqual(ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')), [
    ghost.id,
    hypnotised.id,
  ])
  assert.equal(existing.invisibility, 7)
  assert.equal(enemy.invisibility, undefined)
  assert.equal(shaman.invisibility, undefined)
})

// Source selector's reverse discovery and nearest set, for ordinary healthy Braves.
function expectedCast(w, point) {
  const p = nativePosition(w, point),
    x = (p.x >>> 8) & 254,
    y = (p.y >>> 8) & 254,
    candidates = []
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2])
      for (const person of objectsInCell(
        w.objectCells,
        ((x + dx) & 254) | (((y + dy) & 254) << 8)
      )) {
        const u = w.units.find(u => u.id === person.id)
        if (u?.team === 'blue' && u.kind === 'brave' && u.hp > 0 && !u.invisibility)
          candidates.unshift({ id: u.id, distance: positionDistance(person, p) })
      }
  return candidates
    .toSorted((a, b) => a.distance - b.distance)
    .slice(0, 6)
    .map(p => p.id)
}

test('ordinary cast registers initially unowned live people before selecting them', () => {
  const w = field()
  addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  const people = Array.from({ length: 7 }, () => addUnit(w, 'blue', 'brave', { x: 0, z: 0 })),
    point = { x: 0, z: 0 }
  assert.ok(people.every(u => !u.native && !w.objectCells.objects.has(u.id)))
  w.shots.invisibility = 1
  assert.equal(cast(w, 'invisibility', point), true)
  const destination = w.projectiles.find(p => p.spell === 'invisibility').target
  assert.deepEqual(destination, { x: 1, z: -1 }, 'the cast uses its admitted cell-center target')
  let expected = []
  for (let n = 0; n < 120 && !people.some(u => u.invisibility); n++) {
    expected = expectedCast(w, destination)
    tick(w, 1 / 12)
  }
  assert.equal(w.turn, 8)
  assert.equal(w.shots.invisibility, 0)
  assert.equal(expected.length, 6)
  assert.deepEqual(new Set(ids(people.filter(u => u.invisibility))), new Set(expected))
  assert.ok(people.every(u => w.objectCells.objects.get(u.id) === u.native))
})

test('checkpoint preserves native chain identity and exact selection continuation', () => {
  const w = field(),
    people = Array.from({ length: 7 }, () => person(w, 0x2100, 0x2100))
  syncLivePersonCells(w)
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(chain(restored, { x: 0x2100, y: 0x2100 }), chain(w, { x: 0x2100, y: 0x2100 }))
  assert.deepEqual(
    ids(invisibilityFollowers(w, aim(0x2100, 0x2100), 'blue')),
    ids(people.slice(0, 6))
  )
  assert.deepEqual(
    ids(invisibilityFollowers(restored, aim(0x2100, 0x2100), 'blue')),
    ids(people.slice(0, 6))
  )
  assert.deepEqual(restored, w)
  tick(w, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(restored, w)
})
