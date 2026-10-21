import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { placeBuilding, selectUnit, command, tick, cast } from '../app/model.ts'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { stepLiveSwamp } from '../app/spell-effects-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

test('earned Swamp kills an ordinary built Tower resident and releases its physical ownership', async () => {
  const store = await createCampaignFixtureStore([14])
  assert.equal(store.startMission(14), true)
  const w = store.getWorld(),
    workers = w.units.filter(u => u.team === 'blue' && u.kind === 'brave')
  // Only the existing focus adapter is supplied; real workers acquire timber,
  // build the Tower and normal mana generation earns the spell.
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 10)
  for (const [i, u] of workers.entries()) selectUnit(w, u.id, i !== 0)
  const prior = new Set(w.buildings.map(b => b.id))
  assert.ok(placeBuilding(w, 'tower', { x: 85, z: -37 }))
  const tower = w.buildings.find(b => !prior.has(b.id))
  for (let n = 0; n < 2200 && tower.progress < 1; n++) tick(w, 1 / 12)
  assert.equal(tower.progress, 1)
  assert.equal(w.turn, 414)
  const victim = workers.find(u => u.hp > 0)
  assert.equal(victim.id, 50)
  selectUnit(w, victim.id)
  assert.ok(command(w, tower))
  for (let n = 0; n < 800 && victim.inside !== tower.id; n++) tick(w, 1 / 12)
  assert.equal(w.turn, 416)
  assert.equal(victim.inside, tower.id)
  for (let n = 0; n < 6500 && !w.shots.swamp; n++) tick(w, 1 / 12)
  assert.equal(w.turn, 3108)
  assert.equal(w.shots.swamp, 1)
  assert.ok(cast(w, 'swamp', victim))
  assert.equal(w.shots.swamp, 0)
  let swamp
  for (let n = 0; n < 60; n++) {
    swamp = w.effects.find(f => f.swamp)?.swamp
    if (swamp && !((swamp.counter + 1) & 3)) break
    tick(w, 1 / 12)
  }
  assert.equal(w.turn, 3117)
  const p = victim.entry.person,
    packed = (p.y & 0xfe00) | ((p.x >>> 8) & 254)
  assert.equal(w.objectCells.objects.get(victim.id), p)
  assert.ok([...objectsInCell(w.objectCells, packed)].includes(p))
  assert.equal(p.class, 1)
  assert.equal(p.physics, 2)
  assert.equal(rules.personPhysicsFlags[p.physics] & 2, 0)
  assert.equal(p.flags2 & (2 | 0x100000), 0)
  assert.equal(p.flags4 & 0x400, 0)
  assert.equal(p.vehicle, 0)
  assert.equal(tower.admission.inside, 1)

  // Explicit supplied boundaries leave the real campaign branch untouched.
  for (const boundary of [
    'unlink',
    'alias',
    'class',
    'deleted',
    'immune',
    'attached',
    'flags2',
    'flags4',
    'protected',
  ]) {
    const clone = structuredClone(w),
      u = clone.units.find(u => u.id === victim.id),
      owner = u.entry.person,
      trap = clone.effects.find(f => f.swamp).swamp
    if (boundary === 'unlink') removeObjectFromCell(clone.objectCells, owner)
    else if (boundary === 'alias') u.entry.person = structuredClone(owner)
    else if (boundary === 'class') owner.class = 0
    else if (boundary === 'deleted') owner.flags2 |= 1
    else if (boundary === 'immune') owner.physics = 19
    else if (boundary === 'attached') owner.vehicle = 1
    else if (boundary === 'flags2') owner.flags2 |= 2
    else if (boundary === 'flags4') owner.flags4 |= 0x400
    else owner.flags2 |= 0x100000
    stepLiveSwamp(clone, trap)
    assert.equal(u.hp, 50, boundary)
    assert.equal(u.inside, tower.id, boundary)
    assert.equal(clone.buildings.find(b => b.id === tower.id).admission.inside, 1, boundary)
  }
  // Supplied isolated victim and nine prior uses exercise the unchanged cap.
  const capped = structuredClone(w),
    cappedVictim = capped.units.find(u => u.id === victim.id),
    cappedTrap = capped.effects.find(f => f.swamp).swamp
  capped.units = [cappedVictim]
  cappedTrap.kills = 9
  assert.equal(stepLiveSwamp(capped, cappedTrap), false)
  assert.equal(cappedTrap.kills, 10)
  assert.equal(cappedVictim.hp, 0)
  assert.ok(cappedVictim.native.flags2 & 0x100000)

  const ghostWorld = structuredClone(w),
    ghost = ghostWorld.units.find(u => u.id === victim.id),
    ghostTower = ghostWorld.buildings.find(b => b.id === tower.id),
    ghostTrap = ghostWorld.effects.find(f => f.swamp).swamp
  ghost.entry.person.flags4 |= 0x800
  stepLiveSwamp(ghostWorld, ghostTrap)
  assert.ok(!ghostWorld.units.includes(ghost))
  assert.equal(ghost.inside, null)
  assert.equal(ghostTower.admission.inside, 0)
  assert.ok(!ghostTower.admission.occupants.includes(ghost.id))
  assert.equal(ghostTrap.kills, 5)
  tick(ghostWorld, 1 / 12)
  assert.ok(!ghostWorld.objectCells.objects.has(ghost.id))

  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  const priorCredit = w.killCredits[0][0]
  tick(w, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(restored, w)
  assert.equal(w.turn, 3118)
  assert.equal(swamp.kills, 6)
  assert.equal(victim.hp, 0)
  assert.equal(victim.inside, null)
  assert.equal(tower.admission.inside, 0)
  assert.ok(!tower.admission.occupants.includes(victim.id))
  assert.ok(!w.units.some(u => u.id === victim.id))
  assert.ok(!w.objectCells.objects.has(victim.id))
  assert.ok(p.commands.every(id => !id))
  assert.equal(w.killCredits[0][0], priorCredit + 6)
  for (let n = 0; n < 120; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  }
  assert.equal(swamp.kills, 6, 'the removed resident cannot consume another use')
})
