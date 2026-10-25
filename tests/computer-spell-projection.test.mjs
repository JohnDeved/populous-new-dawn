import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { nativePosition, nativeCellIndex, syncNativeTerrain } from '../app/world-terrain-runtime.ts'
import { unitAnimationSource } from '../app/selection-runtime.ts'
import { nativePersonModel } from '../app/live-combat.ts'
import { tribeForTeam } from '../app/world-types.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { short } from '../app/native-math.ts'
import * as original from './support/computer-spell-projection-reference.mjs'

// Exercise the exact private production adapter without adding a product export.
// Native conversion, terrain sync, model and animation dependencies are all real.
const source = readFileSync(new URL('../app/computer-runtime.ts', import.meta.url), 'utf8')
const start = source.indexOf('function computerSpellPerson(')
const end = source.indexOf('export function refreshTribeTerritory(', start)
assert.ok(start >= 0 && end > start)
const bindings = { nativePosition, nativeCellIndex, syncNativeTerrain, unitAnimationSource, nativePersonModel, tribeForTeam, short }
const candidate = new Function(...Object.keys(bindings), `${stripTypeScriptTypes(source.slice(start, end))}\nreturn { computerSpellPerson, computerSpellWorld }`)(...Object.values(bindings))

function fixture() {
  const w = createWorldState(1)
  Object.assign(w, { units: [], buildings: [], trees: [], effects: [] })
  return w
}
function projection(world) {
  return { tribe: world.tribe, alliances: world.alliances, cells: [...world.cells],
    flags: [...world.cells.keys()].map(cell => world.terrainFlags(cell)) }
}

test('full person projection matches original across cell seams, half rounding and signed wrap', () => {
  const w = fixture()
  const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const coordinates = [-65536, -32769, -32768, -513, -512, -1, 0, 1, 511, 512, 32767, 32768, 65535, 65536]
    .flatMap(n => [-0.500001, -0.5, -0.499999, 0, 0.499999, 0.5, 0.500001].map(f => n + f))
  for (const x of coordinates) for (const y of coordinates) {
    Object.assign(u, { x: x / 256 - 8, z: -y / 256 - 8 })
    assert.deepEqual(candidate.computerSpellPerson(w, u), original.computerSpellPerson(w, u), `${x}, ${y}`)
  }
})

test('full world projection preserves filtering, insertion order, fresh adapters and live fields', () => {
  const w = fixture()
  for (const [i, kind] of ['brave', 'warrior', 'preacher', 'firewarrior', 'spy', 'shaman'].entries()) {
    const u = addUnit(w, ['blue', 'red', 'yellow', 'green'][i % 4], kind, { x: i % 2, z: 0 })
    u.invisibility = i % 2 ? 20 : 0
    if (i % 2) Object.assign(u.native = createLivePerson(w, u), { state: 23, flags4: 0x1040, assignment: 64 })
    else u.native = null
  }
  const dead = addUnit(w, 'red', 'brave', { x: 10, z: 10 })
  dead.hp = 0
  const inside = addUnit(w, 'red', 'brave', { x: 12, z: 10 })
  inside.inside = 4
  assert.deepEqual(candidate.computerSpellPerson(w, inside), original.computerSpellPerson(w, inside))
  for (let tribe = 0; tribe < 4; tribe++) {
    const expected = original.computerSpellWorld(w, tribe)
    const actual = candidate.computerSpellWorld(w, tribe)
    assert.deepEqual(projection(actual), projection(expected))
    assert.equal([...actual.cells.values()].flat().length, 6)
    const again = candidate.computerSpellWorld(w, tribe)
    assert.notEqual(actual.cells, again.cells)
    for (const [cell, objects] of actual.cells) {
      assert.notEqual(objects, again.cells.get(cell))
      objects.forEach((object, i) => assert.notEqual(object, again.cells.get(cell)[i]))
    }
  }
})

test('every live source retains complete projection and priority', () => {
  const w = fixture(), u = addUnit(w, 'blue', 'brave', { x: -8.001953125, z: 120 })
  const person = state => Object.assign(createLivePerson(w, u), { state, flags4: state * 32, assignment: state })
  for (const fields of [
    { native: null, invisibility: 20 },
    { native: person(23) },
    { native: person(23), flight: person(19) },
    { native: person(23), fight: { action: 'encounter', motion: person(24) } },
    { native: person(23), fight: { animation: 'walk', motion: person(25) } },
    { native: null, entry: { person: person(26) } },
  ]) {
    Object.assign(u, { native: null, flight: null, fight: null, entry: undefined, invisibility: 0 }, fields)
    assert.deepEqual(candidate.computerSpellPerson(w, u), original.computerSpellPerson(w, u))
  }
})

test('stale terrain synchronizes real heights, queues, walk masks and person notifications identically', () => {
  function stale() {
    const w = fixture()
    const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
    u.native.flags2 &= ~4
    w.terrain.fill(12)
    w.terrainVersion++
    return { w, u }
  }
  const reference = stale(), actual = stale()
  assert.notEqual(actual.w.landVersion, actual.w.terrainVersion)
  const before = actual.w.land.heights.slice()
  const expected = original.computerSpellWorld(reference.w, 1)
  const projected = candidate.computerSpellWorld(actual.w, 1)
  assert.deepEqual(projection(projected), projection(expected))
  assert.notDeepEqual(actual.w.land.heights, before)
  assert.equal(actual.w.landVersion, actual.w.terrainVersion)
  assert.equal(actual.u.native.flags2 & 4, 4, 'sync must notify the live person')
  assert.deepEqual(actual.w.land, reference.w.land)
  assert.deepEqual(actual.w.units, reference.w.units)
  assert.deepEqual(actual.w.timberSearches, reference.w.timberSearches)
  assert.deepEqual(projection(candidate.computerSpellWorld(actual.w, 1)), projection(original.computerSpellWorld(reference.w, 1)))
})

test('an empty or fully filtered world does not introduce a terrain sync', () => {
  for (const inside of [null, 3]) {
    const w = fixture(), u = addUnit(w, 'red', 'brave', { x: 0, z: 0 })
    Object.assign(u, { hp: inside === null ? 0 : 10, inside })
    w.terrainVersion++
    const version = w.landVersion
    assert.deepEqual(projection(candidate.computerSpellWorld(w, 1)), projection(original.computerSpellWorld(w, 1)))
    assert.equal(w.landVersion, version)
  }
})
