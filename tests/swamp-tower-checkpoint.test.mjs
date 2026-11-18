import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

await loadSceneFixture()
const { createGameStore } = await import('../app/game-store.ts')
const { placeBuilding, selectUnit, command, tick, cast } = await import('../app/model.ts')
const { objectsInCell } = await import('../app/object-cells.ts')
const { removeOwnedSwamp } = await import('../app/swamp-removal.ts')
const { default: rules } = await import('../app/original-rules.json', { with: { type: 'json' } })

// Promotes the retained #1011 pre/post-scan probes to maintained regression tests.
// No rendered input, IndexedDB persistence, original-game or unlock-parity claim.
async function cancellationFixture() {
  const store = createGameStore()
  store.startMission(14)
  const w = store.getWorld(),
    workers = w.units.filter(u => u.team === 'blue' && u.kind === 'brave')
  // Explicitly supplied spell-availability mask isolates Swamp charging.
  // Real workers build the Tower and normal mana charges the enabled spell;
  // this does not prove natural campaign spell unlock/availability.
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

  return { store, world: w, victim, tower, swamp }
}

for (const afterScan of [false, true]) {
  test(`owned Tower Swamp cancellation ${afterScan ? 'after' : 'before'} victim scan survives repeated session reload`, async () => {
    const { store, world, victim, tower, swamp } = await cancellationFixture()
    const retainedPeople = world.units.filter(unit => unit.hp > 0)
    if (afterScan) tick(world, 1 / 12)
    const killedIds = retainedPeople.filter(unit => unit.hp <= 0).map(unit => unit.id)
    if (afterScan) {
      assert.equal(victim.hp, 0)
      assert.equal(killedIds.length, swamp.kills)
      assert.equal(killedIds.length, 6)
    } else {
      assert.equal(victim.hp, 50)
      assert.deepEqual(killedIds, [])
    }
    world.selected = []; world.mode = null; world.paused = false; world.inputMask = 0
    const effectId = world.effects.find(effect => effect.swamp === swamp).id
    // Adjacent cell inside the trap avoids the owned-building action precedence.
    assert.ok(removeOwnedSwamp(world, { x: (swamp.center.x + 512) & 65535, y: swamp.center.y }))
    assert.equal(swamp.remaining, 0)
    assert.equal(await store.saveCheckpoint(false), false, 'Node has no IndexedDB; session snapshot only')
    for (let repeat = 0; repeat < 2; repeat++) {
      assert.ok(store.loadCheckpoint())
      const restored = store.getWorld()
      assert.notEqual(restored, world)
      assert.equal(restored.effects.find(effect => effect.id === effectId).swamp.remaining, 0)
      for (let tickIndex = 0; tickIndex < 3; tickIndex++) tick(restored, 1 / 12)
      assert.equal(restored.effects.some(effect => effect.id === effectId), false)
      const resident = restored.units.find(unit => unit.id === victim.id)
      if (afterScan) {
        for (const id of killedIds) {
          const dead = restored.units.find(unit => unit.id === id)
          assert.ok(!dead || dead.hp <= 0, `victim ${id} resurrected`)
        }
        assert.ok(!resident || resident.hp <= 0)
        assert.equal(restored.effects.filter(effect => effect.swamp).length, 0)
      } else {
        assert.ok(resident && resident.hp > 0)
        assert.equal(resident.inside, tower.id)
        assert.equal(restored.buildings.find(building => building.id === tower.id).admission.inside, 1)
      }
    }
  })
}
