import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/terrain-notifications.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { notifyTerrainObjects } from '../app/terrain-notifications.ts'
import {
  createWorld,
  addUnit,
  command,
  nativePosition,
  placeBuilding,
  tick,
  buildingPose,
  browserPosition,
  findPath,
} from '../app/model.ts'
import { buildingFootprintCells } from '../app/building-shapes.ts'

test('native height notifications retain object order, duplicate visits and touching building flags', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, n) => {
    const land = { flags: new Uint32Array(16384), buildingIds: new Uint16Array(16384) }
    const people = new Map(c.cells.map(d => [d.index, d.people])),
      objects = c.records.map(r => r.flags2),
      events = []
    for (const d of c.cells) {
      land.flags[d.index] = d.flags
      land.buildingIds[d.index] = d.building
    }
    notifyTerrainObjects(
      land,
      c.center,
      c.radius,
      i => people.get(i) ?? [],
      id => {
        events.push(id)
        objects[id - 1] = (objects[id - 1] | 4) >>> 0
      }
    )
    assert.deepEqual(
      { events, flags: c.cells.map(d => land.flags[d.index]), objects },
      fixture.expected[n]
    )
  })
})

test('terrain edits notify nearby plans, revalidate original slope rules and release an invalid plan', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  assert.ok(placeBuilding(w, 'hut', { x: -2, z: 32 }))
  const b = w.buildings.at(-1),
    cells = buildingFootprintCells(buildingPose(b)),
    i = cells[0]
  const point = browserPosition({ x: (i & 127) * 512, y: (i >> 7) * 512 })
  const browserIndex = (point.z + 48) * 97 + point.x + 48
  const worker = w.units.find(u => u.work === b.id)
  assert.ok(worker)
  w.terrain[browserIndex] += 1 / 45
  w.terrainVersion++
  findPath(w, worker, point)
  assert.ok(b.preparation.revalidate)
  tick(w, 1 / 12)
  assert.ok(w.buildings.includes(b), 'a valid adjustment must keep the plan')
  w.terrain[browserIndex] += 10
  w.terrainVersion++
  findPath(w, worker, point)
  assert.ok(b.preparation.revalidate)
  tick(w, 1 / 12)
  assert.ok(!w.buildings.includes(b))
  assert.ok(w.units.every(u => u.work !== b.id && !u.builder))
  assert.ok(cells.every(i => !(w.land.flags[i] & 1024)))
})


test('a large terrain edit indexes live people once while retaining dirty notifications', () => {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [] })
  w.manaWorld.gameFlags = 96
  w.terrain.fill(3); w.terrainVersion++
  for (let i = 0; i < 200; i++) addUnit(w, 'blue', 'brave', { x: i % 20, z: Math.floor(i / 20) })
  w.selected = w.units.map(u => u.id)
  command(w, { x: 24, z: 24 })
  let reads = 0
  for (const u of w.units) {
    assert.ok(u.native)
    u.native.flags2 &= ~4
    const x = u.x
    Object.defineProperty(u, 'x', { get: () => { reads++; return x }, configurable: true })
  }
  w.units[0].inside = 999
  w.units[1].hp = 0
  w.terrain.fill(4); w.terrainVersion++
  nativePosition(w, { x: 0, z: 0 })
  assert.equal(reads, 198, 'one position read per eligible person, independent of changed vertex count')
  assert.equal(w.units[0].native.flags2 & 4, 0)
  assert.equal(w.units[1].native.flags2 & 4, 0)
  assert.ok(w.units.slice(2).every(u => u.native.flags2 & 4))
  nativePosition(w, { x: 0, z: 0 })
  assert.equal(reads, 198, 'unchanged terrain creates no notification index')
})
