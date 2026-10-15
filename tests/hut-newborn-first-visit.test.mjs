import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, browserPosition, maxHp } from '../app/model.ts'
import { buildingPose } from '../app/building-shapes.ts'
import { hutBirthPoints } from '../app/hut-birth.ts'
import { withStorage } from './support/profile-storage.mjs'
import { createLivePerson, stepLivePersonHealth } from '../app/live-people.ts'

function reachNaturalBirth(w) {
  for (let i = 0; i < 200; i++) {
    const previous = new Set(w.units.map(u => u.id))
    tick(w, 1 / 12)
    const newborns = w.units.filter(u => !previous.has(u.id) && u.kind === 'brave' && u.team !== 'wild')
    if (newborns.length) {
      const huts = w.buildings.filter(b => b.kind === 'hut' && b.timer === 0)
      assert.equal(newborns.length, 3, 'three authored M1 huts breed naturally together')
      assert.equal(huts.length, newborns.length)
      return { newborns, huts }
    }
  }
  assert.fail('ordinary authored hut clocks must produce a birth')
}

function assertAllocationTurn(w, newborns, huts) {
  for (let i = 0; i < newborns.length; i++) {
    const u = newborns[i], b = huts[i]
    const inside = browserPosition(hutBirthPoints(buildingPose(b), () => undefined).inside)
    assert.deepEqual({ x: u.x, z: u.z }, inside, 'birth initialization remains at the inside socket until the next scheduled visit')
    assert.equal(u.team, b.team)
    assert.equal(u.hp, maxHp('brave'))
    assert.equal(u.heading, Math.PI - b.angle)
    assert.equal(u.native, null, 'ordinary person processing must not start on allocation turn')
    assert.equal(u.inside, null)
    assert.equal(u.work, null)
    assert.equal(u.idleTurns, 0)
    assert.ok(u.path.length, 'birth still initializes the exit route immediately')
  }
  const flashes = w.effects.filter(f => f.kind === 'birth')
  assert.equal(flashes.length, newborns.length)
  for (const flash of flashes) {
    assert.equal(flash.animation.object, 1441)
    assert.equal(flash.turnsRemaining, 16)
  }
  assert.ok(w.sounds.some(s => s.cue === 40), 'Blue birth feedback is immediate')
}

test('natural simultaneous hut newborns retain allocation pose and start their scheduled movement next turn', () => {
  const w = createWorld()
  const { newborns, huts } = reachNaturalBirth(w)
  assertAllocationTurn(w, newborns, huts)
  const origins = newborns.map(u => ({ x: u.x, z: u.z }))
  tick(w, 1 / 12)
  newborns.forEach((u, i) => assert.notDeepEqual({ x: u.x, z: u.z }, origins[i], 'next turn must visit every newborn without a second deferral'))
})

test('public Save/Load at the natural birth boundary does not defer the next visit again', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(1)
    const w = store.getWorld(), { newborns, huts } = reachNaturalBirth(w)
    assertAllocationTurn(w, newborns, huts)
    const ids = newborns.map(u => u.id), origins = newborns.map(u => ({ x: u.x, z: u.z }))
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const loaded = store.getWorld()
    assert.deepEqual(loaded, w, 'synthetic storage retains the complete post-birth world')
    tick(w, 1 / 12)
    tick(loaded, 1 / 12)
    assert.deepEqual(loaded, w, 'loaded and uninterrupted worlds visit newborns on the same next turn')
    ids.forEach((id, i) => {
      const u = loaded.units.find(u => u.id === id)
      assert.notDeepEqual({ x: u.x, z: u.z }, origins[i])
    })
  })
})

test('synthetic allocation-hook control defers newborn fire and cooldown tails while existing actors still run', () => {
  const w = createWorld()
  for (let i = 0; i < 107; i++) tick(w, 1 / 12)
  const decorate = u => {
    u.burnTrail = 4
    u.native = createLivePerson(w, u)
    u.native.state = 19
    u.native.marchCooldown = 9
    return u.native
  }
  const existing = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
  decorate(existing)
  const newborns = []
  const push = w.units.push
  // Test-only state assignment at allocation, not a naturally burning newborn claim.
  w.units.push = function (...units) {
    for (const u of units) if (u.kind === 'brave' && u.team !== 'wild') {
      decorate(u)
      newborns.push(u)
    }
    return push.apply(this, units)
  }
  tick(w, 1 / 12)
  assert.equal(newborns.length, 3)
  for (const u of newborns) {
    assert.equal(u.burnTrail, 4)
    assert.equal(u.native.marchCooldown, 9)
  }
  assert.equal(existing.burnTrail, 3)
  assert.equal(existing.native.marchCooldown, 8)
})

test('synthetic health exclusion skips only deferred people and expires with the call', () => {
  const w = createWorld()
  const [deferred, existing] = w.units.filter(u => u.kind === 'brave').slice(0, 2)
  deferred.hp = existing.hp = 25
  w.manaWorld.gameFlags |= 128
  stepLivePersonHealth(w, new Set([deferred]))
  assert.equal(deferred.hp, 25)
  assert.equal(existing.hp, maxHp('brave'))
  stepLivePersonHealth(w)
  assert.equal(deferred.hp, maxHp('brave'))
})
