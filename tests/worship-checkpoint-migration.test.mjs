import assert from 'node:assert/strict'
import test from 'node:test'

import { createGameStore, migrateCheckpoint, migrateLegacyWorshipAppearance } from '../app/game-store.ts'
import { tutorialLevel } from '../app/mission-data.ts'
import { addUnit, command, tick } from '../app/model.ts'
import { createWorld } from '../app/world-initialization.ts'
import { authoredWorshipMode } from '../app/worship-appearance.ts'

const migrateExpected = (shrine, mode) => {
  shrine.mode = mode
  if (mode === 3 && shrine.model === 45) shrine.model = 8
}

test('legacy Mission22 worship appearance is derived from authored source identity without changing checkpoint state', () => {
  const current = createWorld(22),
    currentSnapshot = structuredClone(current)
  migrateLegacyWorshipAppearance(current)
  assert.deepEqual(current, currentSnapshot, 'current-schema Mission22 worship appearance remains unchanged')

  const legacy = createWorld(22)
  legacy.randomState = 0x12345678
  legacy.cosmeticRandom.randomState = 0x23456789
  legacy.shrines[0].work = 17
  legacy.shrines[0].followers = 1
  legacy.shrines[0].uses = 2
  legacy.shrines[0].rewardDelay = 19
  legacy.shrines[0].rewardRecipient = 2
  for (const shrine of legacy.shrines) {
    delete shrine.mode
    shrine.model = 45
  }
  const expected = structuredClone(legacy)
  expected.shrines.forEach(shrine => migrateExpected(shrine, 3))

  const migrated = (migrateLegacyWorshipAppearance(legacy), legacy)
  assert.deepEqual(migrated, expected)
  assert.deepEqual(
    migrated.shrines.map(shrine => [shrine.id, shrine.x, shrine.z, shrine.kind, shrine.mode, shrine.model]),
    expected.shrines.map(shrine => [shrine.id, shrine.x, shrine.z, shrine.kind, shrine.mode, shrine.model])
  )
  assert.equal(migrated.randomState, 0x12345678)
  assert.equal(migrated.cosmeticRandom.randomState, 0x23456789)

  const once = structuredClone(migrated)
  migrateLegacyWorshipAppearance(migrated)
  assert.deepEqual(migrated, once, 'worship checkpoint migration is idempotent')
})

test('legacy linked mode3 head migrates recursively while root trigger and unrelated state stay byte-for-byte equivalent', () => {
  const legacy = createWorld(tutorialLevel),
    trigger = legacy.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger'),
    linked = trigger.linkedShrine
  linked.work = 23
  linked.followers = 1
  linked.uses = 3
  linked.rewardDelay = 11
  linked.rewardRecipient = 0
  delete linked.mode
  linked.model = 45
  const expected = structuredClone(legacy),
    expectedTrigger = expected.shrines.find(shrine => shrine.id === trigger.id)
  migrateExpected(expectedTrigger.linkedShrine, 3)

  migrateLegacyWorshipAppearance(legacy)
  assert.deepEqual(legacy, expected)
  assert.deepEqual(
    [trigger.mode, trigger.model],
    [undefined, 0],
    'current-schema tutorial trigger stays byte-for-byte unchanged'
  )
  assert.deepEqual(
    [linked.id, linked.x, linked.z, linked.mode, linked.model, linked.work, linked.followers, linked.uses, linked.rewardDelay],
    [expectedTrigger.linkedShrine.id, expectedTrigger.linkedShrine.x, expectedTrigger.linkedShrine.z, 3, 8, 23, 1, 3, 11]
  )
})

test('legacy non-mode3 and Vault heads recover mode without changing their presentation families', () => {
  const legacy = createWorld(1),
    ordinary = legacy.shrines.find(shrine => shrine.kind === 'lightning'),
    vault = legacy.shrines.find(shrine => shrine.kind === 'vault'),
    ordinaryStoneHead = structuredClone(ordinary.stoneHead)
  delete ordinary.mode
  delete vault.mode
  const vaultSnapshot = structuredClone(vault)

  migrateLegacyWorshipAppearance(legacy)
  assert.equal(ordinary.mode, 0)
  assert.equal(ordinary.model, 45)
  assert.deepEqual(ordinary.stoneHead, ordinaryStoneHead)
  assert.deepEqual(vault, vaultSnapshot)
})

test('authored worship lookup uses immutable source fields and agrees for Mission22 and linked tutorial head', () => {
  const mission22 = createWorld(22)
  for (const shrine of mission22.shrines) assert.equal(authoredWorshipMode(22, shrine), 3)
  const tutorial = createWorld(tutorialLevel),
    linked = tutorial.shrines.find(shrine => shrine.linkedShrine?.name === 'Obelisk').linkedShrine
  assert.equal(authoredWorshipMode(tutorialLevel, linked), 3)
})

test('shipped store load migrates legacy Mission22 before real command-27 Brave admission', async () => {
  const store = createGameStore()
  store.startMission(22)
  const source = store.getWorld(),
    sourceHead = source.shrines.find(shrine => shrine.kind === 'inert'),
    identity = [sourceHead.id, sourceHead.x, sourceHead.z, sourceHead.kind, sourceHead.angle, sourceHead.range]
  source.randomState = 0x3456789a
  sourceHead.work = 9
  sourceHead.followers = 0
  sourceHead.uses = 0
  delete sourceHead.mode
  sourceHead.model = 45
  await store.saveCheckpoint()
  source.randomState = 1
  sourceHead.work = 99

  assert.equal(store.loadCheckpoint(), true)
  const world = store.getWorld(),
    head = world.shrines.find(shrine => shrine.id === sourceHead.id)
  assert.deepEqual([head.id, head.x, head.z, head.kind, head.angle, head.range], identity)
  assert.deepEqual([head.mode, head.model, head.work, world.randomState], [3, 8, 9, 0x3456789a])
  head.work = 0

  const brave = addUnit(world, 'blue', 'brave', head)
  world.inputMask = 0
  tick(world, 1 / 12)
  tick(world, 1 / 12)
  world.selected = [brave.id]
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 300 && brave.native?.commandStatus !== 0; turn++) tick(world, 1 / 12)
  assert.deepEqual(
    { command: brave.native?.commandStatus, work: head.work, followers: head.followers, mode: head.mode, model: head.model },
    { command: 0, work: 0, followers: 0, mode: 3, model: 8 }
  )
})
