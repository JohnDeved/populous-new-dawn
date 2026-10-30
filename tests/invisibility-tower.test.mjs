import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { command, selectUnit, tick, cast, invisibilityFollowers } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import constants from '../app/original-constants.json' with { type: 'json' }

test('earned Invisibility reaches an ordinary registered Tower occupant with public checkpoint continuity', async () => {
  const store = await createCampaignFixtureStore([10])
  assert.equal(store.startMission(10), true)
  const w = store.getWorld(),
    unit = w.units.find(u => u.id === 119),
    tower = w.buildings.find(b => b.id === 96)
  selectUnit(w, unit.id)
  assert.ok(command(w, tower))
  // Existing charge-focus adapter only; actual turns earn the shot.
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 5)
  let entered = 0
  for (let n = 0; n < 1000 && !(unit.inside === tower.id && w.shots.invisibility); n++) {
    tick(w, 1 / 12)
    if (unit.inside === tower.id && !entered) entered = w.turn
  }
  assert.equal(entered, 14)
  assert.equal(w.turn, 404)
  assert.equal(w.shots.invisibility, 1)
  const person = unit.entry.person
  assert.equal(w.objectCells.objects.get(unit.id), person)
  assert.ok(
    [...objectsInCell(w.objectCells, (person.y & 0xfe00) | ((person.x >>> 8) & 254))].includes(
      person
    )
  )
  // Supplied malformed owner controls extend no admission beyond the exact
  // registered living class1 person. They do not change the ordinary world.
  for (const boundary of ['alias', 'deleted', 'class0', 'tribe', 'shaman']) {
    const world = structuredClone(w),
      u = world.units.find(u => u.id === unit.id),
      p = u.entry.person
    if (boundary === 'alias') u.entry.person = structuredClone(p)
    else if (boundary === 'deleted') p.flags2 |= 1
    else if (boundary === 'class0') p.class = 0
    else if (boundary === 'tribe') p.tribe = 1
    else p.model = 7
    assert.ok(!invisibilityFollowers(world, u, 'blue').some(target => target.id === u.id), boundary)
    assert.equal(u.invisibility, undefined)
  }
  assert.ok(cast(w, 'invisibility', unit))
  assert.equal(w.shots.invisibility, 0)
  let expected = []
  for (let n = 0; n < 40 && !unit.invisibility; n++) {
    const projectile = w.projectiles.find(p => p.spell === 'invisibility')
    if (projectile) {
      const center = nativePosition(w, projectile.target),
        x = (center.x >>> 8) & 254,
        y = (center.y >>> 8) & 254
      expected = []
      for (const dy of [-2, 0, 2])
        for (const dx of [-2, 0, 2])
          for (const p of objectsInCell(w.objectCells, ((x + dx) & 254) | (((y + dy) & 254) << 8)))
            if (p.class === 1 && p.tribe === 0 && p.model !== 7 && !(p.flags4 & 0x1000))
              expected.push(p.id)
    }
    tick(w, 1 / 12)
  }
  assert.deepEqual(expected, [111, 119, 116])
  const effect = w.effects.find(f => f.kind === 'invisibility'),
    center = nativePosition(w, effect)
  assert.deepEqual([center.x, center.y], [10496, -768])
  assert.deepEqual(new Set(w.units.filter(u => u.invisibility).map(u => u.id)), new Set(expected))
  assert.equal(w.turn, 411)
  assert.equal(unit.invisibility, constants.INVISIBLE_COUNT_X8 * 8)
  assert.ok(person.flags4 & 0x1000)
  assert.ok(person.renderFlags & 0x4000)
  assert.equal(unit.entry.person, person)
  assert.equal(unit.inside, tower.id)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  const initial = unit.invisibility
  for (let n = 0; n < 40; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
    assert.equal(unit.entry.person, person)
    assert.equal(w.objectCells.objects.get(unit.id), person)
    assert.equal(unit.inside, tower.id)
  }
  assert.equal(unit.invisibility, initial - 40)
  assert.equal(unit.hp, 50)
  assert.ok(!invisibilityFollowers(w, unit, 'blue').includes(unit))
  assert.equal(unit.invisibility, initial - 40)
  // Ordinary movement leaves the Tower and subsequently enters authored Hut97.
  // Ground dispatch reconstructs its person owner; verify the current resident,
  // rather than claiming the old Tower record survives that existing adapter.
  for (const world of [w, restored]) {
    selectUnit(world, unit.id)
    assert.ok(command(world, { x: 27, z: -3 }))
    const selected = world.units.find(u => u.id === unit.id)
    assert.equal(currentPersonOrder(world.buildingOrders, selected.native)?.model, 3)
  }
  for (let n = 0; n < 160; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  }
  assert.equal(unit.inside, 97)
  assert.equal(unit.hp, 50)
  assert.equal(unit.invisibility, initial - 200)
  assert.equal(tower.admission.inside, 0)
  assert.ok(w.buildings.find(b => b.id === 97).admission.occupants.includes(unit.id))
  const resident = unit.entry?.person ?? unit.resident?.person ?? unit.native
  assert.ok(resident.flags4 & 0x1000)
  assert.ok(!invisibilityFollowers(w, unit, 'blue').includes(unit))
})
