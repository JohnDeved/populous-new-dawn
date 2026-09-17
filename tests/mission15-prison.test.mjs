import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, command, createWorld, nativePosition, tick } from '../app/model.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { strikeLiveLightning, syncLivePersonCells } from '../app/live-people.ts'
import { messageText } from '../app/messages.ts'

const objective = world => ({
  prison: world.buildings.find(building => building.kind === 'prison'),
  shaman: world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
})

test('Mission 15 ordinary Prison attack frees the captive and cancels the timer', () => {
  const world = createWorld(15),
    { prison, shaman } = objective(world),
    brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
  assert.deepEqual(
    {
      prison: { kind: prison.kind, level: prison.level, object: prison.object, team: prison.team },
      captive: { inside: shaman.inside, selected: world.selected },
      timer: world.campaignTimer,
      message: messageText(world.messages.slots[world.lastMessage].stringId),
    },
    {
      prison: { kind: 'prison', level: 1, object: 156, team: 'yellow' },
      captive: { inside: prison.id, selected: [] },
      timer: 5400,
      message:
        'The Dakini have trapped me in this magical prison and I cannot escape. I must command my Followers to free me or we are all doomed.',
    }
  )
  const captiveCheckpoint = migrateCheckpoint(structuredClone(world)),
    captive = objective(captiveCheckpoint)
  assert.equal(captive.shaman.inside, captive.prison.id)
  assert.equal(captiveCheckpoint.campaignTimer, 5400)

  Object.assign(brave, browserPosition(buildingOutsidePoint(buildingPose(prison))), {
    inside: null,
    native: null,
    // This test isolates Prison attack ownership; live enemy Firewarriors now shoot it.
    hp: 1000,
  })
  syncLivePersonCells(world)
  world.selected = [brave.id]
  assert.equal(command(world, prison), true)
  for (let turn = 0; turn < 120 && !prison.damageState?.damage; turn++) tick(world, 1 / 12)
  assert.equal(brave.native.commandStatus, 19)
  assert.equal(prison.damageState.damage, 7)

  prison.damageState.damage = 22001
  tick(world, 1 / 12)
  assert.equal(prison.hp, 0)
  assert.equal(shaman.inside, null)
  for (let turn = 0; turn < 32 && world.campaignTimer !== null; turn++) tick(world, 1 / 12)
  assert.equal(world.campaignTimer, null)
  assert.equal(world.ai.variables[10], 0)
  assert.equal(world.status, 'playing')
  assert.equal(world.inputMask & 128, 0)

  const rescued = migrateCheckpoint(structuredClone(world)),
    restored = objective(rescued)
  assert.equal(restored.prison, undefined)
  assert.equal(restored.shaman.inside, null)
  assert.equal(rescued.campaignTimer, null)
})

test('Mission 15 timer expiry locks input and kills the captive with enemy Lightning', () => {
  const world = createWorld(15),
    { prison, shaman } = objective(world)
  world.campaignTimer = 0
  for (let turn = 0; turn < 100 && world.status === 'playing'; turn++) tick(world, 1 / 12)
  assert.deepEqual(
    {
      status: world.status,
      timer: world.campaignTimer,
      inputLocked: !!(world.inputMask & 128),
      yellowLightningCasts: world.spellCasts[2][3],
      prison: prison.hp,
      shaman: { hp: shaman.hp, inside: shaman.inside },
    },
    {
      status: 'lost',
      timer: 0,
      inputLocked: true,
      yellowLightningCasts: 1,
      prison: 260,
      shaman: { hp: 0, inside: null },
    }
  )
  const restored = migrateCheckpoint(structuredClone(world)),
    failed = objective(restored)
  assert.equal(restored.status, 'lost')
  assert.equal(restored.campaignTimer, 0)
  assert.equal(failed.prison.hp, 260)
  assert.equal(failed.shaman.hp, 0)
})

test('Mission 15 expiry stays latched if the Prison falls before Lightning lands', () => {
  const world = createWorld(15),
    { prison, shaman } = objective(world)
  world.campaignTimer = 0
  for (let turn = 0; turn < 32 && !(world.inputMask & 128); turn++) tick(world, 1 / 12)
  assert.equal(shaman.hp, 100)
  ensureBuildingDamage(prison).damage = 22001
  for (let turn = 0; turn < 100 && world.status === 'playing'; turn++) tick(world, 1 / 12)
  assert.equal(world.campaignTimer, null)
  assert.equal(shaman.hp, 0)
  assert.equal(world.status, 'lost')
})

test('Mission 15 captive Lightning branch requires an enemy caster, not the Prison cell', () => {
  const friendly = createWorld(15),
    friendlyObjective = objective(friendly)
  strikeLiveLightning(friendly, nativePosition(friendly, friendlyObjective.prison), 0)
  assert.equal(friendlyObjective.shaman.inside, friendlyObjective.prison.id)
  assert.equal(friendlyObjective.shaman.hp, 100)

  const enemy = createWorld(15),
    enemyObjective = objective(enemy)
  strikeLiveLightning(enemy, { x: 0, y: 0 }, 2)
  assert.equal(enemyObjective.shaman.inside, null)
  assert.equal(enemyObjective.shaman.hp, 0)
})
