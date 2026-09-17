import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, createWorld, tick } from '../app/model.ts'
import { markerHeight } from '../app/campaign-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { messageText } from '../app/messages.ts'
import { missionData, missionScript } from '../app/mission-data.ts'

const advanceTo = (world, turn) => {
  while (world.turn < turn) tick(world, 1 / 12)
}

test('Mission 21 loads its authored opening and first fault state', () => {
  const world = createWorld(21),
    opening = world.messages.slots.find(Boolean),
    flatten = world.shrines.find(shrine => shrine.kind === 'flattenEffect'),
    eruption = world.shrines.find(
      shrine => shrine.kind === 'volcanoEffect' && shrine.x === 29 && shrine.z === -133
    )
  assert.deepEqual(
    {
      bank: missionData(21).level.landscapeBank,
      script: missionScript(21).source,
      tribes: world.campaignAIs.map(Boolean),
      message: messageText(opening.stringId),
      baseline: world.campaignAIs[1].variables[13],
      markerHeight: markerHeight(world.terrain, 17, 21, world.land.heights),
      flattenStock: world.shots.flatten,
      convertStock: world.shots.convertWild,
      blue: world.units.filter(unit => unit.team === 'blue').map(unit => unit.kind),
      flatten: [flatten.x, flatten.z, flatten.effectTarget.x, flatten.effectTarget.z],
      eruption: [eruption.x, eruption.z, eruption.effectTarget.x, eruption.effectTarget.z],
      eruptionControllers: world.shrines.filter(shrine => shrine.kind === 'volcanoEffect').length,
    },
    {
      bank: 29,
      script: 'cpscr040.dat',
      tribes: [false, true, false, false],
      message:
        'This is a mysterious, hostile land. I sense there are many dangers that I must face before we meet the Dakini in Battle.',
      baseline: 457,
      markerHeight: 457,
      flattenStock: 0,
      convertStock: 0,
      blue: ['shaman'],
      flatten: [33, 117, 29, 119],
      eruption: [29, -133, 29, -133],
      eruptionControllers: 1,
    }
  )
})

test('Mission 21 converts worshippers and seals the first fault across a checkpoint', () => {
  const world = createWorld(21),
    stock = world.manaWorld.spells[0]
  advanceTo(world, 1)
  for (let model = 1; model < 22; model++)
    if (model !== 17) stock.disabled |= 1 << (model - 1)
  while (!world.shots.convertWild && world.turn < 1000) tick(world, 1 / 12)
  assert.equal(world.shots.convertWild, 1)
  assert.equal(cast(world, 'convertWild', { x: 31, z: 87 }), true)
  while (world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave').length < 6)
    tick(world, 1 / 12)
  const head = world.shrines.find(shrine => shrine.kind === 'flattenEffect')
  world.selected = world.units
    .filter(unit => unit.team === 'blue')
    .map(unit => unit.id)
  assert.equal(command(world, head), true)
  while (!head.work && world.turn < 1951) tick(world, 1 / 12)
  assert.ok(head.work > 0)
  assert.equal(world.campaignAIs[1].variables[22], 0)

  while (world.campaignAIs[1].variables[22] !== 2 && world.turn < 1952) tick(world, 1 / 12)
  const restoredHead = world.shrines.find(shrine => shrine.kind === 'flattenEffect')
  assert.deepEqual(
    {
      byDeadline: world.turn <= 1952,
      state: world.campaignAIs[1].variables[22],
      presentationLatch: world.campaignAIs[1].variables[28],
      head: [restoredHead.active, restoredHead.uses],
      volcano: world.effects.some(effect => !!effect.volcano),
      casts: world.spellCasts[0][17],
    },
    {
      byDeadline: true,
      state: 2,
      presentationLatch: 1,
      head: [false, 1],
      volcano: false,
      casts: 1,
    }
  )

  const resolved = migrateCheckpoint(structuredClone(world)),
    messageCount = resolved.messages.slots.filter(Boolean).length
  advanceTo(resolved, 1984)
  assert.deepEqual(
    {
      state: resolved.campaignAIs[1].variables[22],
      messages: resolved.messages.slots.filter(Boolean).length,
      volcanoes: resolved.effects.filter(effect => !!effect.volcano).length,
    },
    { state: 2, messages: messageCount, volcanoes: 0 }
  )
})

test('Mission 21 checkpoints one unsealed first-fault eruption without replay', () => {
  const armed = createWorld(21)
  advanceTo(armed, 100)
  const world = migrateCheckpoint(structuredClone(armed))
  advanceTo(world, 1952)
  const warning = world.messages.slots.filter(Boolean).at(-1)
  assert.deepEqual(
    {
      state: world.campaignAIs[1].variables[22],
      sentinel: world.shrines.some(shrine => shrine.kind === 'flattenEffect'),
      volcanoes: world.effects.filter(effect => !!effect.volcano).length,
      message: messageText(warning.stringId),
      view: warning.view,
      lifetime: warning.lifetime,
    },
    {
      state: 1,
      sentinel: false,
      volcanoes: 1,
      message:
        'A fault has become unstable and sparked a massive volcano! There are still more faults on the world that can be fused with the correct spell.',
      view: { cell: 32290, payload: 16018 },
      lifetime: 256,
    }
  )

  const restored = migrateCheckpoint(structuredClone(world))
  advanceTo(restored, 1984)
  assert.equal(restored.campaignAIs[1].variables[22], 2)
  assert.equal(restored.effects.filter(effect => !!effect.volcano).length, 1)

  const resolved = migrateCheckpoint(structuredClone(restored))
  advanceTo(resolved, 2016)
  assert.equal(resolved.campaignAIs[1].variables[22], 2)
  assert.equal(resolved.effects.filter(effect => !!effect.volcano).length, 1)
  assert.equal(
    resolved.messages.slots.filter(
      message => message && messageText(message.stringId).startsWith('A fault has become unstable')
    ).length,
    1
  )
})
