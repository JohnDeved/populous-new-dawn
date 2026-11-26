import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { beginCast } from '../app/spell-casting.ts'

const yellow = 2,
  cooldownFlag = 0x40000,
  models = [2, 17, 5, 6, 19, 12, 3, 7, 4, 11, 15, 14, 10, 8, 13, 16],
  early = [8, 8, 32, 40, 48, 66, 64, 70, 72, 80, 100, 140, 168, 64, 152, 128],
  late = [4, 4, 16, 20, 24, 33, 32, 35, 36, 40, 50, 70, 84, 180, 204, 64]

function step(world) {
  const before = world.turn
  assert.equal(world.status, 'playing')
  assert.equal(world.paused, false)
  tick(world, 1 / 12)
  assert.equal(world.turn, before + 1)
}
function profile(world, tribe) {
  return models.map(model => world.castingTribes[tribe].spells[model].interval)
}

for (const [population, expected, lightning] of [
  [null, early, 64],
  [72, early, 64],
  [73, late, 32],
]) {
  test(`M7 applies Yellow's authored spell intervals at population ${population ?? 'from the unmodified start'}`, async () => {
    const store = createGameStore()
    store.startMission(7)
    const world = store.getWorld()
    while (world.turn < 121) step(world)
    const yellowBefore = profile(world, yellow),
      otherTribes = [0, 1, 3],
      otherTribeBefore = otherTribes.map(tribe => profile(world, tribe)),
      otherTribeFlags = otherTribes.map(tribe => (world.campaignAIs[tribe]?.flags ?? 0) & cooldownFlag)
    step(world)
    assert.equal(world.turn, 122)
    assert.equal(world.campaignAIs[yellow].flags & cooldownFlag, 0)
    assert.deepEqual(profile(world, yellow), yellowBefore)

    const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman' && u.hp > 0)
    assert.ok(shaman)
    if (population !== null) {
      const missing = population - campaignPersonCount(world, yellow)
      assert.ok(missing >= 0)
      for (let index = 0; index < missing; index++)
        addUnit(world, 'yellow', 'brave', {
          x: shaman.x + ((index % 9) - 4) * 0.4,
          z: shaman.z + (Math.floor(index / 9) - 4) * 0.4,
        })
      syncLivePersonCells(world)
      assert.equal(campaignPersonCount(world, yellow), population)
    } else assert.ok(campaignPersonCount(world, yellow) < 73)

    step(world)
    assert.equal(world.turn, 123)
    assert.equal(world.campaignAIs[yellow].flags & cooldownFlag, cooldownFlag)
    assert.deepEqual(profile(world, yellow), expected)
    assert.deepEqual(otherTribes.map(tribe => profile(world, tribe)), otherTribeBefore)
    assert.deepEqual(otherTribes.map(tribe => (world.campaignAIs[tribe]?.flags ?? 0) & cooldownFlag), otherTribeFlags)
    assert.notDeepEqual(profile(world, yellow), yellowBefore)

    const charge = world.castingTribes[yellow].spells[3],
      castCount = world.spellCasts[yellow][3]
    assert.deepEqual([charge.used, charge.remaining], [0, 0])
    // Supply one command to the live caster, not AI target selection. Allocation,
    // accounting, windup and subsequent timer visits use the actual game world.
    beginCast(world, shaman, 'lightning', { x: shaman.x, z: shaman.z })
    assert.ok(world.projectiles.some(p => p.spell === 'lightning' && p.caster === shaman.id))
    assert.equal(world.spellCasts[yellow][3], (castCount + 1) & 255)
    assert.deepEqual([charge.used, charge.remaining], [1, lightning * 64])
    if (population === null) {
      assert.equal(await store.saveCheckpoint(false), false, 'in-session checkpoint: no IndexedDB')
      assert.ok(store.hasCheckpoint())
      step(world)
      assert.equal(charge.remaining, lightning * 64 - 1)
      assert.equal(store.loadCheckpoint(), true)
      const replay = store.getWorld()
      assert.notEqual(replay, world)
      step(replay)
      assert.equal(replay.turn, world.turn)
      assert.deepEqual(replay.castingTribes[yellow], world.castingTribes[yellow])
      assert.deepEqual(replay.spellCasts[yellow], world.spellCasts[yellow])
      assert.deepEqual(replay.projectiles.filter(p => p.team === 'yellow'), world.projectiles.filter(p => p.team === 'yellow'))
    }

    const now = store.getWorld()
    now.castingTribes[yellow].spells[17].interval = 253
    step(now)
    assert.equal(now.castingTribes[yellow].spells[17].interval, 253)
  })
}

test('M7 refreshes the same Yellow tribe from population 72 to 73 at the second authored visit', () => {
  const store = createGameStore()
  store.startMission(7)
  const world = store.getWorld(),
    caster = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman' && u.hp > 0)
  assert.ok(caster)
  const supply = count => {
    const missing = count - campaignPersonCount(world, yellow)
    assert.ok(missing >= 0)
    for (let index = 0; index < missing; index++)
      addUnit(world, 'yellow', 'brave', {
        x: caster.x + ((index % 9) - 4) * 0.4,
        z: caster.z + (Math.floor(index / 9) - 4) * 0.4,
      })
    syncLivePersonCells(world)
    assert.equal(campaignPersonCount(world, yellow), count)
  }

  while (world.turn < 122) step(world)
  supply(72)
  step(world)
  assert.deepEqual(profile(world, yellow), early)
  beginCast(world, caster, 'lightning', { x: caster.x, z: caster.z })
  const charge = world.castingTribes[yellow].spells[3]
  assert.deepEqual([charge.used, charge.remaining], [1, 4096])
  while (world.turn < 378) step(world)
  assert.deepEqual(profile(world, yellow), early)
  assert.deepEqual([charge.used, charge.remaining], [1, 4096 - 255])
  supply(73)
  step(world)
  assert.equal(world.turn, 379)
  assert.deepEqual(profile(world, yellow), late)
  assert.deepEqual([charge.used, charge.remaining], [1, 4096 - 256])
})

test('M7 keeps the original Yellow settlement visit between both cadence visits', () => {
  const store = createGameStore()
  store.startMission(7)
  const world = store.getWorld()
  while (world.turn < 254) step(world)
  assert.equal(world.campaignAIs[yellow].attributes[0], 20)
  step(world)
  assert.equal(world.turn, 255)
  assert.equal(world.campaignAIs[yellow].attributes[0], 21)
  assert.deepEqual(
    world.campaignAIs[yellow].tasks.filter(task => task.flags & 1).map(task => [task.type, task.target, task.requested]),
    [[0, 21116, 4], [0, 20098, 1], [0, 19578, 1], [0, 21116, 1]]
  )
})
