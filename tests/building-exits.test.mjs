import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/building-exits.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { restoreBuildingOccupant, faceBuildingExit, buildingExitPoint } from '../app/building-occupants.ts'
import { createLivePerson, leaveLiveBuilding, syncLivePersonCells } from '../app/live-people.ts'
import { createWorld, addBuilding, addUnit, buildingPose, nativePosition, command } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { objectsInCell } from '../app/object-cells.ts'

test('occupant restoration and facing match native captures, including seams and backwards facing', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const p = structuredClone(c.person)
    let inserted = false
    restoreBuildingOccupant(p, () => 65400, () => { inserted = true })
    if (c.building)
      faceBuildingExit(p, buildingExitPoint(c.building, c.building.class === 9 ? { x: 3072, y: 4096 } : undefined))
    assert.deepEqual(p, c.expected)
    assert.equal(inserted, c.inserted)
  }
})

test('live exits retain position and sprite ownership for every building orientation', () => {
  for (const kind of ['hut', 'tower', 'temple', 'camp'])
    for (let direction = 0; direction < 4; direction++)
      for (const retained of [null, 'linked', 'unlinked']) {
        const w = createWorld()
        const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true, { angle: direction * Math.PI / 2 })
        const u = addUnit(w, 'blue', 'brave', { x: b.x + 0.125, z: b.z - 0.25 })
        u.inside = b.id
        const before = nativePosition(w, u)
        if (retained) {
          u.native = createLivePerson(w, u)
          Object.assign(u.native, { flags2: 0x804080, renderFlags: 16, assignment: 4, h: 1234 })
          u.native.displacement = { x: 90, y: -110, h: 70 }
          u.native.velocity = { x: 15, y: -30, z: 20 }
          if (retained === 'linked') syncLivePersonCells(w)
        }
        const original = u.native
        const p = leaveLiveBuilding(w, u)
        assert.deepEqual(nativePosition(w, u), before, 'exit must not teleport to the door')
        assert.equal(p.h, terrainPointHeight(w.land, p))
        assert.deepEqual(p.displacement, { x: 0, y: 0, h: 0 })
        assert.equal(p.flags2 & 0x804000, 0)
        assert.equal(p.renderFlags & 16, 0)
        assert.equal(p.assignment & 4, 0)
        assert.equal(p.flags4 & 256, 256)
        assert.equal(u.inside, null)
        assert.equal(p.building, null)
        assert.equal(u.native, original, 'ordinary units retain their normal sprites')
        const exit = buildingExitPoint(buildingPose(b))
        assert.equal(p.anchorX, (exit.x & 0xfe00) + 256)
        assert.equal(p.anchorY, (exit.y & 0xfe00) + 256)
        assert.equal(u.heading, Math.PI - p.angle * Math.PI / 1024)
        if (retained) {
          assert.deepEqual(p.velocity, { x: 15, y: -30, z: 20 })
          const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
          assert.deepEqual([...objectsInCell(w.objectCells, cell)].map(p => p.id), [u.id])
        }
      }
})

test('command cancellation uses shared exit restoration without changing the route start', () => {
  const w = createWorld()
  const b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  const u = addUnit(w, 'blue', 'brave', b)
  u.inside = u.work = b.id
  w.selected = [u.id]
  const start = { x: u.x, z: u.z }
  command(w, { x: 10, z: 30 })
  assert.equal(u.inside, null)
  assert.deepEqual({ x: u.x, z: u.z }, start)
  assert.ok(u.path.length)
  assert.equal(u.native, null)
})
