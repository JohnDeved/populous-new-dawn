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
