import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/drag-occupants.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import {
  createWorld,
  addUnit,
  addBuilding,
  command,
  tick,
  setSelection,
  selectArea,
  nativePosition,
  browserPosition,
} from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { insertObjectIntoCell } from '../app/object-cells.ts'
import { dragCommand } from '../app/drag-selection.ts'

test('native area commands retain tower/training exclusions, current-order lookup and actual land membership', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const w = createWorld()
    w.units = []
    w.selected = []
    w.objectCells.heads.fill(0)
    w.objectCells.objects.clear()
    w.buildings = [
      {
        id: 100,
        kind: c.building.model === 4 ? 'tower' : c.building.model === 5 ? 'camp' : 'hut',
        level: 1,
        progress: c.building.state === 2 ? 1 : 0.5,
        hp: 100,
      },
    ]
    w.buildingOrders.records = [{}, ...structuredClone(c.orders)]
    for (const d of c.people) {
      const u = addUnit(
        w,
        'blue',
        d.model === 7 ? 'shaman' : d.model === 3 ? 'warrior' : 'brave',
        browserPosition(d)
      )
      u.native = createLivePerson(w, u)
      Object.assign(u.native, structuredClone(d), { id: u.id })
      u.inside = d.flags2 & 0x800000 ? 100 : null
      w.objectCells.objects.set(u.id, u.native)
      if (d.present) insertObjectIntoCell(w.objectCells, u.native, u.native)
      const cell = (d.y >> 9) * 128 + (d.x >> 9)
      w.land.flags[cell] = d.terrainBuilding ? 512 : 0
      w.land.buildingIds[cell] = 100 | 0x4000
      if (d.selectionFlags & 128) w.selected.push(u.id)
    }
    const before = structuredClone(w.units),
      orders = structuredClone(w.buildingOrders),
      random = w.randomState
    selectArea(w, { x: 8192, y: 8192 }, c.packed, c.extend)
    assert.deepEqual(
      {
        people: w.units.map(u => ({
          flags3: u.native.flags3,
          selectionFlags: u.native.selectionFlags,
        })),
        voices: w.sounds.map(s => s.cue),
      },
      c.expected
    )
    before.forEach((u, i) => Object.assign(u.native, c.expected.people[i]))
    assert.deepEqual(w.units, before)
    assert.deepEqual(w.buildingOrders, orders)
    assert.equal(w.randomState, random)
  }
})

test('a real trainee remains drag-selectable on entry and becomes excluded only in the native interior phase', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units = w.units.filter(u => u.kind === 'shaman')
  const camp = addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, true)
  const trainee = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
  w.selected = [trainee.id]
  command(w, camp)
  for (let i = 0; i < 300 && trainee.entry?.person.substate !== 12; i++) tick(w, 1 / 12)
  assert.equal(trainee.entry?.person.substate, 12)
  assert.equal(trainee.inside, camp.id)
  const p = trainee.entry.person
  const start = nativePosition(w, { x: -9, z: 39 }),
    end = nativePosition(w, { x: 6, z: 26 })
  const packed = dragCommand(start, end, 0)
  setSelection(w, [])
  const before = structuredClone(p),
    orders = structuredClone(w.buildingOrders)
  selectArea(w, start, packed, false)
  assert.deepEqual(w.selected, [trainee.id], 'entry phase 12 is admitted despite inside membership')
  Object.assign(before, { flags3: p.flags3, selectionFlags: p.selectionFlags })
  assert.deepEqual(p, before)
  assert.deepEqual(w.buildingOrders, orders)
  tick(w, 1 / 12)
  assert.equal(p.substate, 13)
  setSelection(w, [])
  selectArea(w, start, packed, false)
  assert.deepEqual(w.selected, [], 'interior phase 13 is excluded without stopping training')
  assert.equal(trainee.inside, camp.id)
  assert.deepEqual(w.buildingOrders, orders)
})

test('fetching builders are selected at their live position rather than an inactive construction pose', () => {
  const w = createWorld()
  w.units = []
  w.selected = []
  const u = addUnit(w, 'blue', 'brave', { x: 0, z: 8 })
  const p = createLivePerson(w, u)
  Object.assign(p, nativePosition(w, { x: 30, z: 8 }))
  u.builder = { task: 7, busy: 0, phase: 0, restart: false, person: p }
  const start = nativePosition(w, { x: -2, z: 10 }),
    end = nativePosition(w, { x: 2, z: 6 })
  const point = { x: p.x, y: p.y }
  selectArea(w, start, dragCommand(start, end, 0), false)
  assert.deepEqual(w.selected, [u.id])
  assert.equal(u.native, null)
  assert.deepEqual({ x: p.x, y: p.y }, point)
})
