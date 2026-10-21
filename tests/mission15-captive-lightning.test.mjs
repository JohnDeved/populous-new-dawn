import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld, nativePosition, tick } from '../app/model.ts'
import { createLivePerson, strikeLiveLightning } from '../app/live-people.ts'
import { random } from '../app/native-math.ts'

const captive = world => world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')

// 00511f70's separate post-traversal state-42 branch forces state 3, then
// 004da0d0 records attribution. It neither electrocutes nor consumes the cell cap.
test('ordinary Mission 15 deadline kills the captive directly, including public Save/Load', async () => {
  const store = await createCampaignFixtureStore([15])
  assert.equal(store.startMission(15), true)
  const world = store.getWorld(),
    shaman = captive(world)
  assert.equal(world.campaignTimer, 5400)
  for (
    let turn = 0;
    turn < 5500 && !world.effects.some(effect => effect.lightning?.turn === -1);
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(world.turn, 5421)
  assert.equal(world.campaignTimer, 0)
  assert.equal(world.killCredits[2][0], 0)
  assert.equal(world.inputMask & 128, 128)
  assert.equal(shaman.hp, 100)
  assert.notEqual(shaman.inside, null)
  assert.equal(world.effects.find(effect => effect.lightning?.turn === -1).lightning.tribe, 2)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  for (const candidate of [world, restored]) {
    const victim = captive(candidate)
    tick(candidate, 1 / 12)
    assert.equal(victim.native.state, 3)
    assert.equal(victim.native.previousState, 42)
    assert.equal(victim.native.damageAttacker, 2)
    assert.equal(victim.native.flags2 & 0x100000, 0)
    assert.equal(victim.hp, 0)
    assert.equal(candidate.killCredits[2][0], 1)
    assert.equal(victim.inside, null)
    assert.equal(captive(candidate), undefined, 'direct death enters ordinary cleanup immediately')
    for (let turn = 0; turn < 32 && candidate.status === 'playing'; turn++) tick(candidate, 1 / 12)
    assert.equal(candidate.status, 'lost')
    assert.equal(candidate.spellCasts[2][3], 1)
    assert.equal(candidate.buildings.find(building => building.kind === 'prison').hp, 260)
    const deaths = candidate.effects
      .filter(effect => effect.kind === 'death')
      .map(effect => effect.id)
    for (let turn = 0; turn < 20; turn++) tick(candidate, 1 / 12)
    assert.equal(candidate.spellCasts[2][3], 1)
    assert.equal(candidate.killCredits[2][0], 1)
    assert.ok(
      candidate.effects
        .filter(effect => effect.kind === 'death')
        .every(effect => deaths.includes(effect.id))
    )
  }
})

test('supplied saturated-cell and immunity controls cannot spare the separate captive', () => {
  for (const flags3 of [0, 0x8000, 0x20000]) {
    const world = createWorld(15),
      shaman = captive(world),
      point = { x: 0, z: 0 }
    // Explicitly supplied adapter inputs, not an ordinary crowd producer.
    const followers = Array.from({ length: 8 }, () => addUnit(world, 'blue', 'brave', point))
    shaman.native = createLivePerson(world, shaman)
    shaman.native.flags3 |= flags3
    shaman.native.flags2 |= 0x100000
    const expectedRandom = { randomState: world.randomState }
    for (let death = 0; death < 7; death++) random(expectedRandom)
    strikeLiveLightning(world, nativePosition(world, followers[0]), 2)
    assert.equal(followers.filter(unit => unit.hp === 0).length, 7)
    assert.equal(shaman.hp, 0)
    assert.equal(shaman.native.state, 3)
    assert.equal(shaman.native.previousState, 42)
    assert.equal(shaman.native.damageAttacker, 2)
    assert.equal(shaman.native.flags2 & 0x100000, 0)
    assert.equal(
      world.randomState,
      expectedRandom.randomState,
      'only the seven cell electrocutions draw speed RNG'
    )
  }
})
