import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { buildingModel } from '../app/building-shapes.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { nativePosition, syncNativeTerrain } from '../app/world-terrain-runtime.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { personSupportHeight } from '../app/person-physics.ts'
import {
  insertObjectIntoCell,
  moveObjectInCells,
  removeObjectFromCell,
} from '../app/object-cells.ts'
import {
  createLivePerson,
  registerLivePerson,
  syncBrowserPersonPosition,
  syncLivePersonCells,
} from '../app/live-people.ts'
import { stateDigest } from '../scripts/bench-simulation.mjs'

// Independent pre-optimization implementations from 649c0383. Keep the old
// position helper in this oracle too, including its discarded height samples.
function previousPosition(w, u, p) {
  if (u.flight || u.fight?.motion || p.vehicle) return
  const to = nativePosition(w, u)
  to.x &= 65535
  to.y &= 65535
  if (unitAnimationSource(u) === p)
    to.h = to.x === p.x && to.y === p.y ? p.h : terrainPointHeight(w.land, to)
  if (to.x !== p.x || to.y !== p.y || to.h !== p.h) moveObjectInCells(w.objectCells, p, to)
}

function previousSync(w) {
  const people = new Map(
    w.units
      .filter(
        u =>
          (u.flight || u.fight?.motion || u.native || u.entry) &&
          (u.hp > 0 || u.flight || u.native?.state === 44)
      )
      .map(u => [u.id, u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person])
  )
  for (const [id, p] of w.objectCells.objects)
    if (people.get(id) !== p) {
      if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
      w.objectCells.objects.delete(id)
    }
  for (const u of w.units) {
    const p = people.get(u.id)
    const offset = p?.supportHeight ?? u.supportHeight
    if (offset && !((p?.flags2 ?? 0) & 0x4000)) {
      const point = nativePosition(w, u),
        cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9),
        flags = w.land.flags[cell]
      const b =
        flags & 512 ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023)) : undefined
      const value = personSupportHeight(offset, flags, b ? buildingModel(b) : 0)
      if (p) p.supportHeight = value
      u.supportHeight = value || undefined
    }
    if (!p) continue
    if (!w.objectCells.objects.has(p.id)) {
      w.objectCells.objects.set(p.id, p)
      insertObjectIntoCell(w.objectCells, p, p)
    }
    if (u.flight || u.fight?.motion || p.vehicle) continue
    previousPosition(w, u, p)
  }
  return people
}

function fixture() {
  const w = createWorldState(1)
  for (let i = 0; i < w.land.heights.length; i++) {
    w.land.heights[i] = (i * 257 + 193) & 65535
    w.land.flags[i] = (i & 1) | 4
  }
  for (const x of [0, 0.25, 3]) {
    const u = addUnit(w, 'blue', 'brave', { x, z: 0 })
    u.native = createLivePerson(w, u)
    u.native.state = 19
    u.native.flags3 |= 0x100
    registerLivePerson(w, u.native)
  }
  return { w, u: w.units[0], p: w.units[0].native }
}

function comparePosition(supplied, label) {
  const before = structuredClone(supplied),
    after = structuredClone(supplied)
  previousPosition(before.w, before.u, before.p)
  syncBrowserPersonPosition(after.w, after.u, after.p)
  assert.deepEqual(after, before, label)
  assert.equal(stateDigest(after), stateDigest(before), `${label}: full graph`)
  return after
}

function compareSync(supplied, label) {
  const before = structuredClone(supplied),
    after = structuredClone(supplied)
  const oldPeople = previousSync(before.w),
    newPeople = syncLivePersonCells(after.w)
  assert.deepEqual(after, before, label)
  assert.deepEqual([...newPeople.keys()], [...oldPeople.keys()], `${label}: map order`)
  assert.equal(
    stateDigest({ ...after, people: newPeople }),
    stateDigest({ ...before, people: oldPeople }),
    `${label}: aliases and cell chains`
  )
  return { ...after, people: newPeople }
}

test('person synchronization preserves native, browser, entry and builder height ownership', () => {
  for (const owner of ['native', 'browser', 'entry', 'builder', 'guard']) {
    for (const dx of [0, 0.25, 3]) {
      const s = fixture(),
        { w, u, p } = s
      p.h = 1234
      if (owner === 'browser' || owner === 'builder' || owner === 'guard') p.state = 10
      if (owner === 'entry') {
        u.native = null
        u.entry = { person: p, orders: w.buildingOrders }
      }
      if (owner === 'builder') u.builder = { person: p, task: BuilderTask.Work }
      if (owner === 'guard') p.guardInputPending = true
      u.x += dx
      const result = comparePosition(s, `${owner}/${dx}`)
      if (!dx && owner !== 'browser') assert.equal(result.p.h, 1234)
      assert.equal(result.w.objectCells.objects.get(p.id), result.p)
    }
  }
})

test('position projection preserves signed wrapping, half rounding, seams and displacement', () => {
  const coordinates = [-65536.5, -32768.5, -0.5, 0, 0.5, 255.5, 511.5, 32767.5, 65535.5, 65536.5]
  for (let i = 0; i < coordinates.length; i++) {
    const s = fixture()
    s.u.x = coordinates[i] / 256 - 8
    s.u.z = -coordinates[(i + 3) % coordinates.length] / 256 - 8
    comparePosition(s, `wrapped coordinate ${i}`)
  }
})

test('dirty terrain still synchronizes before an unchanged native-owned pose', () => {
  const s = fixture()
  s.p.h = 1234
  s.p.flags2 &= ~0x4000000
  s.w.terrain.fill(6)
  s.w.terrainVersion++
  const result = comparePosition(s, 'dirty terrain')
  assert.equal(result.w.landVersion, result.w.terrainVersion)
  assert.equal(result.p.h, 1234)
  assert.notDeepEqual(result.w.land.heights, s.w.land.heights)
})

test('flight, fight motion and vehicle ownership retain their pre-synchronization return', () => {
  for (const owner of ['flight', 'fight', 'vehicle']) {
    const s = fixture()
    if (owner === 'flight') s.u.flight = s.p
    if (owner === 'fight') s.u.fight = { motion: s.p }
    if (owner === 'vehicle') s.p.vehicle = 77
    s.u.x += 3
    s.w.terrain.fill(6)
    s.w.terrainVersion++
    const result = comparePosition(s, owner)
    assert.equal(result.w.landVersion, s.w.landVersion)
    assert.equal(result.p.x, s.p.x)
  }
})

test('membership reconciliation preserves owner precedence, death, replacement and duplicate IDs', () => {
  for (const reversed of [false, true]) {
    const s = fixture(),
      { w } = s
    const add = () => {
      const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
      u.native = createLivePerson(w, u)
      registerLivePerson(w, u.native)
      return u
    }
    const dead = add()
    dead.hp = 0
    const dying = add()
    dying.hp = 0
    dying.native.state = 44
    const flying = add()
    flying.hp = 0
    flying.flight = { ...flying.native, displacement: { x: 0, y: 0, h: 0 } }
    const entry = add()
    entry.entry = { person: entry.native }
    entry.native = null
    const fighting = add()
    fighting.fight = { motion: { ...fighting.native, displacement: { x: 0, y: 0, h: 0 } } }
    const retired = add()
    w.pathfinding.people.set(retired.id, retired.native)
    retired.native = null
    const duplicate = { ...s.u, native: { ...s.p, displacement: { x: 0, y: 0, h: 0 } } }
    w.units.push(duplicate)
    w.units[1].x += 3
    if (reversed) w.units.reverse()
    const result = compareSync(s, `reversed=${reversed}`)
    assert.equal(result.people.has(dead.id), false)
    assert.equal(result.people.has(dying.id), true)
    assert.equal(result.people.has(flying.id), true)
    assert.equal(result.w.objectCells.objects.has(retired.id), false)
    assert.equal(result.w.pathfinding.people.has(retired.id), true)
  }
})

test('support-height reconciliation keeps zero, occupancy, absent owners and terrain invalidation', () => {
  for (const nativeOffset of [undefined, 0, 384]) {
    for (const occupied of [false, true]) {
      const s = fixture()
      s.u.supportHeight = 128
      s.p.supportHeight = nativeOffset
      if (occupied) s.p.flags2 |= 0x4000
      const other = addUnit(s.w, 'blue', 'brave', { x: 0, z: 0 })
      other.supportHeight = 256
      s.w.terrain.fill(2)
      s.w.terrainVersion++
      compareSync(s, `support=${nativeOffset}/occupied=${occupied}`)
    }
  }
})

test('same-cell synchronization keeps chain order through repeated browser/native handoffs', () => {
  const s = fixture()
  syncNativeTerrain(s.w)
  for (let i = 0; i < 8; i++) {
    s.u.x += 1 / 256
    s.p.state = i & 1 ? 19 : 10
    const expected = compareSync(s, `handoff ${i}`)
    Object.assign(s, expected)
    assert.equal(s.w.objectCells.objects.get(s.u.id), s.p)
  }
})
