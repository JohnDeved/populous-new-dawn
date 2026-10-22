import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, placeBuilding, tick } from '../app/model.ts'
import { createGift } from '../app/world-effects.ts'
import { createWorldState } from '../app/world-state.ts'
import { CHECKPOINT_VERSION, migrateCheckpoint } from '../app/game-store.ts'
import { missionAllowsBuilding } from '../app/mission-data.ts'
import { readHelpBuildingKnowledge } from '../app/help-building-discovery.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { applySpellTestCheat } from '../app/spell-test-cheats.ts'
import { withStorage } from './support/profile-storage.mjs'
import { nativeCampaignProfile } from './support/campaign-fixture.mjs'

const existingOwners = [
  [4, 'unlockedTower'], [5, 'unlockedTemple'], [6, 'unlockedSpyHut'],
  [7, 'unlockedCamp'], [8, 'unlockedFirewarriorHut'],
  [13, 'unlockedBoatHouse'], [15, 'unlockedBalloonHut'],
]
const knowledge = world => [world.unlockedHut, world.unlockedGuardPost]
const withoutAddedOwners = world => {
  const result = structuredClone(world)
  delete result.unlockedHut
  delete result.unlockedGuardPost
  return result
}
const assertNewKnowledge = world => {
  assert.deepEqual(knowledge(world), [missionAllowsBuilding(world.outcome.level, 1), true])
  for (const [model, field] of existingOwners)
    assert.equal(world[field], missionAllowsBuilding(world.outcome.level, model), `${field} remains unchanged`)
}

test('new Worlds own profile Hut and post-profile Guard Post, including initially clear headers', () => {
  for (const level of [1, 2, 3, 8, 12, 22, 79]) {
    const world = createWorldState(level)
    assertNewKnowledge(world)
    if ([1, 3, 12, 22, 79].includes(level))
      assert.equal(missionAllowsBuilding(level, 17), false, 'Guard Post is enabled after this initial header')
  }
})

test('shipping new-game, mission, restart, tutorial and debug-world replacements initialize owners', async () => {
  await withStorage({ profile: nativeCampaignProfile({ available: [22] }) }, async fixture => {
    const store = await fixture.freshStore()
    await store.restoreCheckpoint()
    assertNewKnowledge(store.getWorld())
    for (const replace of [() => store.startMission(22), () => store.restart(), () => store.startTutorial(), () => store.startDebugMission(1)]) {
      store.getWorld().unlockedHut = false
      store.getWorld().unlockedGuardPost = false
      replace()
      assertNewKnowledge(store.getWorld())
    }
    assert.deepEqual(fixture.writes, [], 'world replacement does not save or migrate a checkpoint')
  })
})

test('current v3 checkpoint persistence round-trips present booleans without reinitialization', async () => {
  assert.equal(CHECKPOINT_VERSION, 3)
  for (const values of [[false, true], [true, false]]) {
    await withStorage({}, async fixture => {
      const store = await fixture.freshStore(), world = store.getWorld()
      world.unlockedHut = values[0]
      world.unlockedGuardPost = values[1]
      const existing = existingOwners.map(([, field]) => world[field])
      assert.equal(await store.saveCheckpoint(), true)
      const saved = structuredClone(fixture.records.get('latest'))
      assert.equal(saved.version, 3)
      assert.deepEqual(knowledge(saved.world), values)
      world.unlockedHut = !values[0]
      world.unlockedGuardPost = !values[1]
      assert.equal(store.loadCheckpoint(), true)
      assert.deepEqual(knowledge(store.getWorld()), values)
      assert.deepEqual(existingOwners.map(([, field]) => store.getWorld()[field]), existing)
      const restored = await fixture.freshStore()
      assert.equal(await restored.restoreCheckpoint(), true)
      assert.equal(restored.loadCheckpoint(), true)
      assert.deepEqual(knowledge(restored.getWorld()), values)
      for (const [index, model] of [1, 17].entries())
        assert.equal(readHelpBuildingKnowledge(restored.getWorld(), model).available, values[index])
      assert.deepEqual(fixture.records.get('latest'), saved, 'restore and load do not rewrite stored data')
      assert.deepEqual(fixture.writes, ['latest'])
    })
  }
})

test('existing v3 absence stays unknown through normalization, restore, load and later save', async () => {
  const legacy = createWorld(1, 'scalable')
  delete legacy.unlockedHut
  delete legacy.unlockedGuardPost
  const assertAbsent = world => {
    for (const field of ['unlockedHut', 'unlockedGuardPost']) assert.equal(Object.hasOwn(world, field), false)
    for (const model of [1, 17])
      assert.deepEqual(readHelpBuildingKnowledge(world, model), { kind: 'unsupported', reason: 'unowned-building-bit' })
  }
  assertAbsent(migrateCheckpoint(structuredClone(legacy)))
  await withStorage({ latest: { version: 3, world: legacy } }, async fixture => {
    const stored = structuredClone(fixture.records.get('latest')), store = await fixture.freshStore()
    assert.equal(await store.restoreCheckpoint(), true)
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(store.loadCheckpoint(), true)
    assertAbsent(store.getWorld())
    assert.deepEqual(fixture.records.get('latest'), stored, 'reading absent fields never backfills storage')
    assert.deepEqual(fixture.writes, [])
    assert.equal(await store.saveCheckpoint(), true)
    assertAbsent(fixture.records.get('latest').world)
    assert.equal(store.loadCheckpoint(), true)
    assertAbsent(store.getWorld())
    store.restart()
    assertNewKnowledge(store.getWorld())
  })
})

test('current Hut construction remains independent of primary knowledge, including legacy absence', () => {
  const base = createWorld(2)
  let expected
  for (const value of [undefined, false, true]) {
    const world = structuredClone(base)
    if (value === undefined) {
      delete world.unlockedHut
      delete world.unlockedGuardPost
    } else {
      world.unlockedHut = value
      world.unlockedGuardPost = value
    }
    assert.equal(placeBuilding(world, 'hut', { x: -96, z: -120 }), true)
    const result = withoutAddedOwners(world)
    if (expected) assert.deepEqual(result, expected)
    else expected = result
    assert.deepEqual(knowledge(world), [value, value], 'construction does not discover primary knowledge')
  }
})

test('existing spell-test grants and unsupported native building scripts do not stale owners', () => {
  const world = createWorldState(22)
  world.unlockedGuardPost = false
  const initial = knowledge(world), existing = existingOwners.map(([, field]) => world[field])
  for (const action of ['unlock', 'refill', 'mana']) {
    assert.equal(applySpellTestCheat(world, action), true)
    assert.deepEqual(knowledge(world), initial)
    assert.deepEqual(existingOwners.map(([, field]) => world[field]), existing)
  }
  for (const opcode of [1144, 1163]) {
    const before = structuredClone(world)
    assert.throws(() => campaignCommand(world, opcode, []), new RegExp(`Unbound campaign command ${opcode}`))
    assert.deepEqual(world, before, 'unsupported command must fail before mutating knowledge')
  }
})


test('supported building gift payout still changes only its seven existing knowledge owners', () => {
  const world = createWorld(1)
  world.unlockedHut = false
  world.unlockedGuardPost = false
  const rewards = ['tower', 'temple', 'spyHut', 'camp', 'firewarriorHut', 'boatHouse', 'balloonHut']
  for (const [index, [, field]] of existingOwners.entries()) {
    world[field] = false
    createGift(world, rewards[index], { x: 40, z: 40 }).remaining = 1
  }
  tick(world, 1 / 12)
  for (const [, field] of existingOwners) assert.equal(world[field], true)
  assert.deepEqual(knowledge(world), [false, false], 'existing rewards do not manufacture Hut or Guard Post discovery')
})
