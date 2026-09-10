import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/construction-panel.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { constructionPanel } from '../app/construction-panel.ts'
import {
  createWorld,
  addBuilding,
  addUnit,
  command,
  tick,
  ensureBuildingDamage,
} from '../app/model.ts'
import {
  selectBuildingOccupants,
  dismantleBuilding,
  isDismantling,
} from '../app/live-building-entry.ts'

test('construction panel matches native submissions and corrects the unlinked second-row height', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const { width, height, events, people, control } = constructionPanel(c)
    assert.equal(width, c.expected.width)
    assert.equal(height, c.expected.height + (c.capacity > 7 && !c.linked ? 28 : 0))
    assert.deepEqual(events, c.expected.events)
    assert.equal(people.length, c.capacity)
    assert.equal(!!control, c.linked)
    for (const p of people) assert.ok(p.x >= 0 && p.x + 16 <= width && p.y + 23 <= height)
  }
})

test('construction workers can be selected, reassigned to dismantle, cancelled and restarted', () => {
  for (const kind of ['hut', 'camp', 'tower', 'temple']) {
    const w = createWorld()
    w.inputMask = 0
    w.manaWorld.gameFlags = 32
    const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, false, { angle: Math.PI })
    b.progress = 0.5
    ensureBuildingDamage(b)
    const people = Array.from({ length: 3 }, (_, i) =>
      addUnit(w, 'blue', 'brave', { x: 7 + i * 0.4, z: 33 })
    )
    w.selected = people.map(u => u.id)
    command(w, b)
    assert.equal(b.builders.filter(Boolean).length, 3)
    w.selected = []
    selectBuildingOccupants(w, b, people[1].id, false)
    assert.deepEqual(w.selected, [people[1].id])
    selectBuildingOccupants(w, b, people[0].id, true)
    assert.deepEqual(new Set(w.selected), new Set(people.map(u => u.id)))
    const before = people.map(u => [u.x, u.z, u.cargo])
    dismantleBuilding(w, b)
    assert.ok(people.every(u => isDismantling(w, u) && !u.builder))
    assert.deepEqual(
      people.map(u => [u.x, u.z, u.cargo]),
      before
    )
    assert.equal(b.builders.filter(Boolean).length, 0)
    dismantleBuilding(w, b)
    tick(w, 1 / 12)
    assert.ok(people.every(u => !isDismantling(w, u)))
    dismantleBuilding(w, b)
    w.selected = people.map(u => u.id)
    command(w, b)
    for (let i = 0; i < 400 && b.hp > 0; i++) tick(w, 1 / 12)
    assert.ok(b.hp <= 0, kind)
  }
})

test('construction icons select the active worker record and respect its native eligibility', () => {
  const w = createWorld()
  w.inputMask = 0
  w.manaWorld.gameFlags = 32
  const b = addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, false, { angle: Math.PI })
  b.progress = 0.5
  ensureBuildingDamage(b)
  const workers = Array.from({ length: 3 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 7 + i * 0.4, z: 33 })
  )
  w.selected = workers.map(u => u.id)
  command(w, b)
  for (let i = 0; i < 30 && workers.some(u => !u.builder?.person); i++) tick(w, 1 / 12)
  const outside = addUnit(w, 'blue', 'warrior', { x: 12, z: 36 })
  const people = workers.map(u => u.builder.person)
  assert.ok(people.every(Boolean), 'real construction must own the workers')
  people[1].flags4 |= 128
  w.selected = [outside.id]
  const orders = structuredClone(w.buildingOrders), rng = w.randomState
  const simulation = () => {
    const units = structuredClone(w.units)
    for (const u of units)
      for (const p of [u.native, u.entry?.person, u.builder?.person]) {
        if (!p) continue
        p.selectionFlags &= ~128
        p.flags3 = (p.flags3 & ~0x10000080) >>> 0
      }
    return units
  }
  const before = simulation()
  selectBuildingOccupants(w, b, workers[1].id, false)
  assert.deepEqual(w.selected, [outside.id], 'a blocked worker must not enter the selection')
  selectBuildingOccupants(w, b, workers[0].id, false)
  assert.deepEqual(w.selected, [outside.id, workers[0].id])
  assert.ok(people[0].selectionFlags & 128, 'selection belongs to the active worker')
  assert.ok(people[0].flags3 & 0x10000000, 'single-icon command carries native mode bit 4')
  selectBuildingOccupants(w, b, workers[2].id, true)
  assert.deepEqual(new Set(w.selected), new Set([outside.id, workers[0].id, workers[2].id]))
  assert.deepEqual(people.map(p => !!(p.selectionFlags & 128)), [true, false, true])
  assert.ok(people.every(p => !(p.flags3 & 0x10000000)), 'group selection clears mode bit 4')
  selectBuildingOccupants(w, b, workers[0].id, true)
  assert.deepEqual(w.selected, [outside.id])
  assert.ok(people.every(p => !(p.selectionFlags & 128)))
  assert.deepEqual(simulation(), before, 'selection must not change construction, routes, poses or position')
  assert.deepEqual(w.buildingOrders, orders)
  assert.equal(w.randomState, rng)
  assert.equal(outside.native, null, 'selection must not create legacy movement ownership')
})
