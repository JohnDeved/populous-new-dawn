import assert from 'node:assert/strict'
import test from 'node:test'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { createGameStore } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { beginCast } from '../app/spell-casting.ts'

const red = 1,
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
  test(`M22 applies Red's authored spell intervals at population ${population ?? 'from the unmodified start'}`, async () => {
    const store = createGameStore()
    store.startMission(22)
    const world = store.getWorld()
    while (world.turn < 122) step(world)
    const redBefore = profile(world, red),
      otherTribes = [2, 3],
      otherTribeBefore = otherTribes.map(tribe => profile(world, tribe)),
      otherTribeFlags = otherTribes.map(tribe => world.campaignAIs[tribe].flags & cooldownFlag)
    step(world)
    assert.equal(world.turn, 123)
    assert.equal(world.campaignAIs[red].flags & cooldownFlag, 0)
    assert.deepEqual(profile(world, red), redBefore)

    const shaman = world.units.find(u => u.team === 'red' && u.kind === 'shaman' && u.hp > 0)
    assert.ok(shaman)
    if (population !== null) {
      const missing = population - campaignPersonCount(world, red)
      assert.ok(missing >= 0)
      for (let index = 0; index < missing; index++)
        addUnit(world, 'red', 'brave', {
          x: shaman.x + ((index % 9) - 4) * 0.4,
          z: shaman.z + (Math.floor(index / 9) - 4) * 0.4,
        })
      syncLivePersonCells(world)
      assert.equal(campaignPersonCount(world, red), population)
    } else assert.ok(campaignPersonCount(world, red) < 73)

    step(world)
    assert.equal(world.turn, 124)
    assert.equal(world.campaignAIs[red].flags & cooldownFlag, cooldownFlag)
    assert.deepEqual(profile(world, red), expected)
    assert.deepEqual(otherTribes.map(tribe => profile(world, tribe)), otherTribeBefore)
    assert.deepEqual(otherTribes.map(tribe => world.campaignAIs[tribe].flags & cooldownFlag), otherTribeFlags)
    assert.notDeepEqual(profile(world, red), redBefore)

    const charge = world.castingTribes[red].spells[3],
      castCount = world.spellCasts[red][3]
    assert.deepEqual([charge.used, charge.remaining], [0, 0])
    // Supply one command to the live caster, not AI target selection. Allocation,
    // accounting, windup and subsequent timer visits use the actual game world.
    beginCast(world, shaman, 'lightning', { x: shaman.x, z: shaman.z })
    assert.ok(world.projectiles.some(p => p.spell === 'lightning' && p.caster === shaman.id))
    assert.equal(world.spellCasts[red][3], (castCount + 1) & 255)
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
      assert.deepEqual(replay.castingTribes[red], world.castingTribes[red])
      assert.deepEqual(replay.spellCasts[red], world.spellCasts[red])
      assert.deepEqual(replay.projectiles.filter(p => p.team === 'red'), world.projectiles.filter(p => p.team === 'red'))
    }

    const now = store.getWorld()
    now.castingTribes[red].spells[17].interval = 253
    step(now)
    assert.equal(now.castingTribes[red].spells[17].interval, 253)
  })
}

test('M22 refreshes the same Red tribe from population 72 to 73 at the second authored visit', () => {
  const store = createGameStore()
  store.startMission(22)
  const world = store.getWorld(),
    caster = world.units.find(u => u.team === 'red' && u.kind === 'shaman' && u.hp > 0)
  assert.ok(caster)
  const supply = count => {
    const missing = count - campaignPersonCount(world, red)
    assert.ok(missing >= 0)
    for (let index = 0; index < missing; index++)
      addUnit(world, 'red', 'brave', {
        x: caster.x + ((index % 9) - 4) * 0.4,
        z: caster.z + (Math.floor(index / 9) - 4) * 0.4,
      })
    syncLivePersonCells(world)
    assert.equal(campaignPersonCount(world, red), count)
  }

  while (world.turn < 123) step(world)
  supply(72)
  step(world)
  assert.deepEqual(profile(world, red), early)
  beginCast(world, caster, 'lightning', { x: caster.x, z: caster.z })
  const charge = world.castingTribes[red].spells[3]
  assert.deepEqual([charge.used, charge.remaining], [1, 4096])
  while (world.turn < 379) step(world)
  assert.deepEqual(profile(world, red), early)
  assert.deepEqual([charge.used, charge.remaining], [1, 4096 - 255])
  supply(73)
  step(world)
  assert.equal(world.turn, 380)
  assert.deepEqual(profile(world, red), late)
  assert.deepEqual([charge.used, charge.remaining], [1, 4096 - 256])
})

test('M22 keeps the independent Red tower and marker orders at the authored staffing visit', () => {
  for (const turn of [254, 255, 256]) {
    const store = createGameStore()
    store.startMission(22)
    const world = store.getWorld()
    world.turn = turn
    withCampaignTribe(world, red, () => {
      assert.deepEqual(world.ai.tasks.slice(0, 3).map(task => task.flags & 1), [1, 0, 0])
      campaignRules(world)
      assert.deepEqual(world.ai.tasks.slice(0, 3).map(task => task.flags & 1),
        turn === 255 ? [1, 1, 1] : [1, 0, 0])
      if (turn === 255) {
        const [, tower, marker] = world.ai.tasks
        assert.deepEqual([tower.type, tower.target, tower.requested], [7, 90, 6])
        assert.deepEqual([marker.type, ...marker.route.slice(0, 2).map(point => point.marker)], [24, 1, 3])
      }
    })
  }
})
