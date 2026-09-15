import assert from 'node:assert/strict'
import test from 'node:test'
import { migrateCheckpoint } from '../app/game-store.ts'
import levelSeven from '../app/level-seven.ts'
import { entrance } from '../app/live-command.ts'
import { cast, command, createWorld, tick } from '../app/model.ts'
import { missionEnemyTribe } from '../app/mission-data.ts'
import scriptSeven from '../app/original-script-seven.json' with { type: 'json' }
import { syncLivePersonCells } from '../app/live-people.ts'

const until = (world, condition, limit = 5_000) => {
  for (let turn = 0; !condition() && world.status === 'playing' && turn < limit; turn++)
    tick(world, 1 / 12)
  assert.ok(condition())
}

test('Mission 7 converts Wildmen and grants Invisibility through its original head', () => {
  assert.equal(
    levelSeven.sourceSha256,
    'a22326653fb6ca36792d2b79576dce9a8c014736129ffd3de4d3ba816423b752'
  )
  assert.equal(
    levelSeven.headerSha256,
    '5bbe0a02845d1a9182fcd63dcaa67dcb918051caecce4c3ebd261640282e41b7'
  )
  assert.equal(
    scriptSeven.sha256,
    'e461c70a5294a5d3b6d2f53a45bcd67cf77562c9848617b6fe856cc4a2b3fa53'
  )
  assert.equal(missionEnemyTribe(7), 2)

  const world = createWorld(7),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    vault = world.shrines.find(shrine => shrine.kind === 'vault'),
    erosion = world.shrines.find(shrine => shrine.kind === 'erosion')
  assert.deepEqual(
    {
      blue: world.units.filter(unit => unit.team === 'blue').length,
      yellow: world.units.filter(unit => unit.team === 'yellow').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
    },
    { blue: 1, yellow: 11, wild: 59 }
  )
  assert.equal(vault?.reward, 'invisibility')
  assert.equal(erosion?.reward, 'erosion')

  until(world, () => world.shots.convertWild > 0)
  assert.ok(cast(world, 'convertWild', { x: -63, z: 19 }))
  until(world, () => world.units.some(unit => unit.team === 'blue' && unit.kind === 'brave'), 100)
  const converted = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
  assert.ok(converted)
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 58)

  // The remote terrain route is separate work; exercise the authentic Shaman and Vault task at its door.
  Object.assign(shaman, entrance(world, vault, 2))
  syncLivePersonCells(world)
  world.selected = [shaman.id]
  assert.ok(command(world, vault))
  until(world, () => world.shots.invisibility > 0, 2_000)
  assert.equal(vault.uses, 1)

  Object.assign(converted, { x: shaman.x + 1, z: shaman.z })
  syncLivePersonCells(world)
  assert.ok(cast(world, 'invisibility', converted))
  until(world, () => !!converted.invisibility, 100)
  assert.equal(world.shots.invisibility, 0)

  const restored = migrateCheckpoint(structuredClone(world)),
    restoredFollower = restored.units.find(unit => unit.id === converted.id),
    restoredVault = restored.shrines.find(shrine => shrine.id === vault.id)
  assert.equal(restored.outcome.level, 7)
  assert.ok(restoredFollower?.invisibility)
  assert.equal(restoredVault?.uses, 1)
  assert.equal(restoredVault?.active, false)
})
