import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addUnit,
  browserPosition,
  command,
  createWorld,
  tick,
} from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { messageText } from '../app/messages.ts'
import { missionData, missionScript } from '../app/mission-data.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { worshipPositions } from '../app/worship.ts'

function startWorship(world, head) {
  const slots = worshipPositions(worshipHeadPose(world, head)),
    followers = Array.from({ length: head.required }, (_, index) =>
      addUnit(world, 'blue', 'brave', browserPosition(slots[index]))
    )
  world.selected = followers.map(unit => unit.id)
  syncLivePersonCells(world)
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  assert.ok(head.followers > 0)
}

function finishWorship(world, head) {
  startWorship(world, head)
  head.work = head.target * head.required ** 2 - 1
  for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
  assert.equal(head.uses, 1)
  const effects = {
    lightning: world.effects.filter(effect => effect.lightning?.visualOnly).length,
  }
  for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
  return effects
}

test('Mission 20 loads its authored opening and four-stage linked chain', () => {
  const world = createWorld(20),
    opening = world.messages.slots.find(Boolean),
    chain = []
  for (
    let head = world.shrines.find(shrine => shrine.reward === 'bridge');
    head;
    head = head.linkedShrine
  )
    chain.push({
      reward: head.reward,
      required: head.required,
      target: head.target,
      earthquakes: head.earthquakeTargets?.length ?? 0,
      lightnings: head.lightningTargets?.length ?? 0,
      firestorms: head.firestormTargets?.length ?? 0,
      volcanoes: head.volcanoTargets?.length ?? 0,
      trees: head.linkedTrees?.length ?? 0,
    })
  assert.deepEqual(
    {
      bank: missionData(20).level.landscapeBank,
      script: missionScript(20).source,
      tribes: world.campaignAIs.map(Boolean),
      message: messageText(opening.stringId),
      flags: world.campaignAIs[1].flags & 0xe000,
      pending: world.campaignAIs[1].pendingCommands,
      chain,
    },
    {
      bank: 9,
      script: 'cpscr043.dat',
      tribes: [false, true, false, false],
      message:
        'I sense the Dakini are preparing for war. I must create more land to build on if I am to increase my forces and face them in battle.',
      flags: 0xe000,
      pending: [],
      chain: [
        { reward: 'bridge', required: 5, target: 128, earthquakes: 1, lightnings: 0, firestorms: 0, volcanoes: 0, trees: 6 },
        { reward: 'flatten', required: 6, target: 180, earthquakes: 0, lightnings: 4, firestorms: 0, volcanoes: 0, trees: 0 },
        { reward: 'firestorm', required: 7, target: 160, earthquakes: 0, lightnings: 0, firestorms: 1, volcanoes: 1, trees: 0 },
        { reward: 'volcano', required: 8, target: 168, earthquakes: 0, lightnings: 0, firestorms: 0, volcanoes: 0, trees: 0 },
      ],
    }
  )
})

test('Mission 20 worship consumes each head once and restores the live chain', () => {
  const initial = createWorld(20),
    initialTrees = initial.trees.length,
    initialBridge = initial.shrines.find(shrine => shrine.reward === 'bridge')
  startWorship(initial, initialBridge)
  initialBridge.work = initialBridge.target * initialBridge.required ** 2 - 1
  const world = migrateCheckpoint(structuredClone(initial)),
    bridge = world.shrines.find(shrine => shrine.reward === 'bridge')
  assert.equal(bridge.work, initialBridge.work)
  for (let turn = 0; turn < 8 && !bridge.uses; turn++) tick(world, 1 / 12)
  assert.equal(bridge.uses, 1)
  for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
  assert.equal(bridge.active, false)
  assert.equal(world.trees.length, initialTrees + 6)
  assert.equal(world.effects.filter(effect => effect.earthquake).length, 1)
  assert.deepEqual([world.shots.bridge, world.giftCounts.bridge], [1, 1])

  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(
    {
      turn: restored.turn,
      randomState: restored.randomState,
      trees: restored.trees.length,
      bridge: [restored.shots.bridge, restored.giftCounts.bridge],
      active: restored.shrines.filter(shrine => shrine.active).map(shrine => shrine.reward),
      earthquake: restored.effects.find(effect => effect.earthquake).earthquake,
    },
    {
      turn: world.turn,
      randomState: world.randomState,
      trees: world.trees.length,
      bridge: [1, 1],
      active: ['angel', 'flatten'],
      earthquake: world.effects.find(effect => effect.earthquake).earthquake,
    }
  )

  for (const reward of ['flatten', 'firestorm', 'volcano']) {
    const head = restored.shrines.find(shrine => shrine.active && shrine.reward === reward)
    assert.ok(head)
    const effects = finishWorship(restored, head)
    assert.equal(head.active, false)
    if (reward === 'flatten') assert.equal(effects.lightning, 4)
    if (reward === 'firestorm') {
      assert.equal(restored.effects.some(effect => effect.firestorm), true)
      assert.equal(restored.effects.some(effect => effect.volcano), true)
    }
  }
  assert.deepEqual(
    [
      restored.shots.bridge,
      restored.shots.flatten,
      restored.shots.firestorm,
      restored.shots.volcano,
      restored.giftCounts.bridge,
      restored.giftCounts.flatten,
      restored.giftCounts.firestorm,
      restored.giftCounts.volcano,
    ],
    [1, 1, 1, 1, 1, 1, 1, 1]
  )
  assert.equal(restored.shrines.some(shrine => shrine.kind === 'linkedEffects' && shrine.active), false)
})
