import assert from 'node:assert/strict'
import test from 'node:test'
import levelThree from '../app/level-three.ts'
import scriptThree from '../app/original-script-three.json' with { type: 'json' }
import {
  cast,
  command,
  createWorld,
  placeBuilding,
  select,
  setSelection,
  tick,
} from '../app/model.ts'
import { missionEnemyTribe } from '../app/mission-data.ts'

const until = (world, condition, limit = 20_000) => {
  for (let turn = 0; !condition() && world.status === 'playing' && turn < limit; turn++)
    tick(world, 1 / 12)
  assert.ok(condition())
}

test('Mission 3 opens through original Chumara, Swarm, Temple and Erosion paths', () => {
  assert.equal(
    levelThree.sourceSha256,
    'eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf'
  )
  assert.equal(
    levelThree.headerSha256,
    '219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0'
  )
  assert.equal(
    scriptThree.sha256,
    'd5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601'
  )
  assert.equal(missionEnemyTribe(3), 2)

  const world = createWorld(3)
  assert.equal(world.units.filter(unit => unit.team === 'blue').length, 1)
  assert.equal(world.units.filter(unit => unit.team === 'yellow').length, 7)
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 44)
  assert.equal(
    world.buildings.filter(building => building.team === 'blue' && building.kind === 'hut').length,
    1
  )
  assert.ok(world.manaWorld.spells[0].available & (1 << 5))

  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  const erosionHead = world.shrines.find(shrine => shrine.kind === 'erosionEffect')
  assert.equal(vault?.reward, 'temple')
  assert.deepEqual(erosionHead?.effectTarget, { x: -15, z: 111 })

  assert.ok(command(world, vault))
  until(world, () => world.unlockedTemple)
  assert.ok(world.shots.swarm > 0)
  const enemy = world.units
    .filter(unit => unit.team === 'yellow' && unit.kind !== 'shaman' && unit.hp > 0)
    .findLast(unit => cast(world, 'swarm', unit))
  assert.ok(enemy)
  until(
    world,
    () => world.units.some(unit => unit.team === 'yellow' && unit.native?.state === 26),
    500
  )
  assert.equal(world.effects.find(effect => effect.swarm)?.swarm?.tribe, 0)

  select(world, 'brave')
  assert.ok(placeBuilding(world, 'temple', { x: 24, z: 70 }))
  const temple = world.buildings.findLast(building => building.kind === 'temple')
  until(world, () => temple.progress === 1)
  const brave = world.units.find(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
  )
  setSelection(world, [brave.id])
  assert.ok(command(world, temple))
  until(world, () => world.units.some(unit => unit.team === 'blue' && unit.kind === 'preacher'))

  const preacher = world.units.find(unit => unit.team === 'blue' && unit.kind === 'preacher')
  setSelection(world, [preacher.id])
  assert.ok(command(world, erosionHead))
  until(world, () => world.effects.some(effect => effect.erosion))
  assert.equal(erosionHead.uses, 1)
})
