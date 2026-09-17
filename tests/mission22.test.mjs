import assert from 'node:assert/strict'
import test from 'node:test'

import { migrateCheckpoint } from '../app/game-store.ts'
import { liveCommandContext } from '../app/live-command.ts'
import { liveVehicleCellObjects } from '../app/live-vehicles.ts'
import { messageText } from '../app/messages.ts'
import { missionComputerTribes, missionData, missionScript } from '../app/mission-data.ts'
import { browserPosition, cast, command, tick } from '../app/model.ts'
import { vehicleCanDisembark } from '../app/vehicle-routing.ts'
import { createWorld } from '../app/world-initialization.ts'

const stepUntil = (world, done, limit) => {
  for (let turn = 0; turn < limit; turn++) {
    tick(world, 1 / 12)
    if (done()) return turn + 1
  }
  assert.fail(`condition timed out at turn ${world.turn}`)
}

const focusCharging = (world, model) => {
  world.charging = true
  world.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << (model - 1))
}

const moveShaman = (world, shaman, point) => {
  world.selected = [shaman.id]
  assert.ok(command(world, point))
  stepUntil(world, () => Math.hypot(shaman.x - point.x, shaman.z - point.z) < 2, 1_000)
}

test('Mission 22 opens with its solo Shaman, native heads, tribes and transport', () => {
  const world = createWorld(22)

  assert.equal(
    missionData(22).level.sourceSha256,
    '97fcbf41e1f13d53491fdbfbe8b5950fd94f3301c51c6f61b4725eb0aab30321'
  )
  assert.deepEqual(missionComputerTribes(22), [1, 2, 3])
  assert.deepEqual(
    [1, 2, 3].map(tribe => missionScript(22, tribe).sha256),
    [
      '741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c',
      'dc498e6c0077ee0d15980d60d264a363082d16692a880f8a5f835216cfd01d11',
      '5373a2d3cb4b965be69a665fa4695da0f351e9db6b6702c38bcf09edb24e0d5a',
    ]
  )
  assert.deepEqual(
    world.units.filter(unit => unit.team === 'blue').map(unit => unit.kind),
    ['shaman']
  )
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'None of my followers could accompany me to this world. I am alone and I shall need all my strength and cunning to survive. '
  )
  assert.deepEqual(
    world.shrines.map(head => [head.kind, head.required, head.target, head.rewardMana]),
    [
      ['mana', 1, 5, 600_000],
      ['inert', 1, 5, undefined],
      ['mana', 1, 35, 1_000_000],
    ]
  )
  assert.deepEqual(
    world.vehicles.map(vehicle => [vehicle.model, vehicle.team, vehicle.life]),
    [
      [3, 'yellow', 5_000],
      [1, 'red', 5_000],
    ]
  )
})

test('Mission 22 nearby head is a one-shot presentation with no gameplay reward', () => {
  const world = createWorld(22),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    head = world.shrines.find(shrine => shrine.kind === 'inert')
  world.manaWorld.spells[0].disabled = 0x7fffffff
  const pending = world.manaTribes.map(tribe => tribe.pending)

  assert.ok(command(world, { ...head, id: head.id }))
  stepUntil(world, () => head.rewardDelay === 50, 500)

  assert.deepEqual([head.active, head.uses], [true, 0])
  for (let turn = 0; turn < 49; turn++) tick(world, 1 / 12)
  assert.deepEqual([head.rewardDelay, head.active, head.uses], [1, true, 0])
  tick(world, 1 / 12)

  assert.deepEqual([head.rewardDelay, head.active, head.uses], [0, false, 1])
  assert.deepEqual(world.manaTribes.map(tribe => tribe.pending), pending)
  assert.equal(world.effects.some(effect => effect.kind === 'gift'), false)
  assert.equal(shaman.hp, 100)
})

test('Mission 22 southern head delivers its delayed 600,000 mana gift after real worship', () => {
  let world = createWorld(22),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    head = world.shrines.find(shrine => shrine.kind === 'mana' && shrine.rewardMana === 600_000)

  focusCharging(world, 12)
  stepUntil(world, () => world.shots.bridge > 0, 5_000)
  assert.ok(cast(world, 'bridge', { x: -29, z: -49 }))
  stepUntil(world, () => !shaman.casting, 100)
  for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)
  world.selected = [shaman.id]
  assert.ok(command(world, { ...head, id: head.id }))
  stepUntil(world, () => head.rewardDelay === 50, 500)
  assert.deepEqual([head.active, head.uses], [true, 0])
  assert.equal(head.rewardDelay, 50)

  world = migrateCheckpoint(structuredClone(world))
  shaman = world.units.find(unit => unit.id === shaman.id)
  head = world.shrines.find(shrine => shrine.id === head.id)
  stepUntil(world, () => world.effects.some(effect => effect.reward === 'mana'), 50)
  const gift = world.effects.find(effect => effect.reward === 'mana')
  assert.deepEqual([gift.amount, gift.recipient, gift.rewardModel, gift.phase, gift.remaining], [
    600_000,
    0,
    5,
    1,
    82,
  ])
  stepUntil(world, () => !world.effects.some(effect => effect.id === gift.id), 82)
  assert.ok(world.manaTribes[0].pending >= 590_000)
  assert.equal(head.active, false)
  assert.equal(shaman.hp, 100)
})

test('Mission 22 Shaman can steal, checkpoint and sail the authored enemy Boat', () => {
  let world = createWorld(22),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    boat = world.vehicles.find(vehicle => vehicle.model === 1)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  world.selected = [shaman.id]
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  assert.deepEqual([boat.team, boat.passengers, shaman.native.vehicle], [
    'blue',
    [shaman.id],
    boat.id,
  ])

  world = migrateCheckpoint(structuredClone(world))
  shaman = world.units.find(unit => unit.id === shaman.id)
  boat = world.vehicles.find(vehicle => vehicle.id === boat.id)
  assert.deepEqual([boat.team, boat.passengers, shaman.native.vehicle], [
    'blue',
    [shaman.id],
    boat.id,
  ])

  const land = {
      flags: world.land.flags,
      categories: world.land.categories,
      cellObjects: cell => liveVehicleCellObjects(world, cell),
    },
    landing = Array.from({ length: 128 }, (_, y) => y * 2 + 1)
      .flatMap(y => Array.from({ length: 128 }, (_, x) => ({ x: (x * 2 + 1) * 256, y: y * 256 })))
      .map(point => ({
        point,
        distance: Math.hypot(
          ((point.x - boat.x) << 16) >> 16,
          ((point.y - boat.y) << 16) >> 16
        ),
      }))
      .filter(
        ({ point, distance }) =>
          distance > 3_000 &&
          distance < 10_000 &&
          vehicleCanDisembark(land, boat, point) &&
          liveCommandContext(world, browserPosition(point))?.enabled
      )
      .sort((a, b) => a.distance - b.distance)
      .find(({ point }) => browserPosition(point).x < 20)?.point
  assert.ok(landing)
  world.selected = [shaman.id]
  assert.ok(command(world, browserPosition(landing)))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  assert.equal(shaman.native.vehicle, 0)
  assert.equal(shaman.hp, 100)
  assert.equal(boat.team, 'blue')
})
