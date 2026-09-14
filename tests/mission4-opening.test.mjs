import assert from 'node:assert/strict'
import test from 'node:test'
import levelFour from '../app/level-four.ts'
import scriptFour from '../app/original-script-four.json' with { type: 'json' }
import { cast, command, createWorld, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { missionEnemyTribe } from '../app/mission-data.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

const until = (world, condition, limit = 30_000) => {
  for (let turn = 0; !condition() && world.status === 'playing' && turn < limit; turn++)
    tick(world, 1 / 12)
  assert.ok(condition(), `Mission 4 condition timed out at turn ${world.turn}`)
}

test('Mission 4 starts its original opening flyby once through ordinary turns', () => {
  const world = createWorld(4)
  for (let turn = 0; turn < 14; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)

  tick(world, 1 / 12)
  assert.equal(world.turn, 15)
  assert.equal(world.flyby.flags & 1, 1)
  assert.equal(world.inputMask & 64, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, flags, value, start, duration }) => [
      kind,
      flags,
      value,
      start,
      duration,
    ]),
    [
      [1, 0, 5196, 1, 29], [5, 2, 5196, 1, 50], [2, 0, 714, 1, 29],
      [3, 0, 128, 1, 19], [2, 0, 327, 30, 30], [3, 0, 65460, 30, 40],
      [5, 1, 17980, 55, 60], [1, 0, 17980, 60, 30], [2, 0, 700, 60, 35],
      [3, 0, 153, 75, 20], [2, 0, 253, 95, 30], [3, 0, 65485, 95, 50],
      [5, 2, 13556, 120, 100], [1, 0, 13556, 125, 45], [2, 0, 763, 125, 38],
      [3, 0, 102, 145, 60], [2, 0, 1291, 163, 30], [2, 0, 459, 193, 50],
      [1, 0, 14006, 200, 25], [3, 0, 0, 210, 30], [1, 0, 63530, 238, 35],
      [2, 0, 221, 243, 30], [3, 0, 0, 245, 28],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 42, y: 248, angle: 221, zoom: 0 })
  assert.equal(world.ai.variables[34], 1)

  const events = world.flyby.events
  for (let turn = 0; turn < 2048; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 23)
})

test('Mission 4 teaches training and attack from its original live conditions once', () => {
  const world = createWorld(4),
    promote = count => {
      for (const unit of world.units.filter(unit => unit.team === 'wild').slice(0, count))
        unit.team = 'blue'
    },
    runTutorialTurn = turn => {
      world.turn = turn
      tick(world, 1 / 12)
    },
    tutorialIds = () =>
      world.messages.slots
        .filter(message => message && [657, 658, 659].includes(message.stringId))
        .map(message => message.stringId)

  promote(25)
  runTutorialTurn(253)
  assert.deepEqual(tutorialIds(), [657])
  assert.equal(world.messages.slots[world.lastMessage].lifetime, 256)

  promote(15)
  runTutorialTurn(509)
  assert.deepEqual(tutorialIds(), [657, 658])

  const followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
  for (const unit of followers.slice(0, 10)) unit.kind = 'warrior'
  for (const unit of followers.slice(10, 20)) unit.kind = 'preacher'
  runTutorialTurn(765)
  assert.deepEqual(tutorialIds(), [657, 658, 659])
  assert.ok(
    world.messages.slots
      .filter(message => message && [657, 658, 659].includes(message.stringId))
      .every(message => message.lifetime === 256 && message.flags & 0x200)
  )

  runTutorialTurn(1021)
  assert.deepEqual(tutorialIds(), [657, 658, 659])
})

test('Mission 4 converts Wildmen, discovers the Guard Tower, and defeats the Matak', () => {
  assert.equal(
    levelFour.sourceSha256,
    '82a3511c1b5669ba5b44d8ca9eceeefef51c9c6fa7151f650d96d8870f61abad'
  )
  assert.equal(
    levelFour.headerSha256,
    '28423b5c46f3db542852b2a3059b343b255886697f335c38515ad20ffc812e3b'
  )
  assert.equal(
    scriptFour.sha256,
    'd0f72bd1d35fcc24f0529edce9d7d87df9ad96ae22607dbd64e11cad818f76fe'
  )
  assert.equal(missionEnemyTribe(4), 3)

  const world = createWorld(4)
  assert.equal(world.units.filter(unit => unit.team === 'blue').length, 1)
  assert.equal(world.units.filter(unit => unit.team === 'red').length, 7)
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 53)
  assert.equal(world.buildings.filter(building => building.kind === 'hut').length, 2)
  assert.deepEqual(
    world.shrines.map(shrine => shrine.reward),
    ['tower', 'convertWild', 'lightning']
  )
  const opening = world.messages.slots.find(Boolean)
  assert.equal(opening.stringId, 654)
  assert.ok(opening.flags & 0x20000)

  const forcedAttack = createWorld(4),
    forcedTarget = forcedAttack.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  forcedAttack.killCredits[0][3] = 11
  for (let turn = 0; turn < 62; turn++) tick(forcedAttack, 1 / 12)
  assert.ok(forcedAttack.manaTribes[3].flags2 & 0x40)
  for (const unit of forcedAttack.units.filter(unit => unit.team === 'red')) {
    assert.equal(unit.target, forcedTarget.id)
    assert.equal(currentPersonOrder(forcedAttack.buildingOrders, unit.native)?.model, 28)
  }
  const retrying = forcedAttack.units.find(unit => unit.team === 'red')
  retrying.target = null
  tick(forcedAttack, 2 / 12)
  assert.equal(retrying.target, forcedTarget.id)

  const convertHead = world.shrines.find(shrine => shrine.reward === 'convertWild')
  assert.ok(command(world, convertHead))
  until(world, () => world.shots.convertWild === 4)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    blueBefore = world.units.filter(unit => unit.team === 'blue').length,
    wild = world.units
      .filter(unit => unit.team === 'wild' && unit.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - shaman.x, a.z - shaman.z) -
          Math.hypot(b.x - shaman.x, b.z - shaman.z)
      )[0]
  assert.ok(cast(world, 'convertWild', wild))
  until(world, () => world.units.filter(unit => unit.team === 'blue').length > blueBefore, 500)

  const towerVault = world.shrines.find(shrine => shrine.reward === 'tower')
  setSelection(world, [shaman.id])
  assert.ok(command(world, towerVault))
  until(world, () => world.unlockedTower)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'tower', { x: 36, z: -26 }))
  const tower = world.buildings.findLast(building => building.kind === 'tower')
  until(world, () => tower.progress === 1)
  const guard = world.units.find(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
  )
  setSelection(world, [guard.id])
  assert.ok(command(world, tower))
  until(world, () => guard.inside === tower.id)

  for (let attack = 0; world.status === 'playing' && attack < 24; attack++) {
    const target =
      world.units.find(unit => unit.team === 'red' && unit.kind !== 'shaman' && unit.hp > 0) ??
      world.units.find(unit => unit.team === 'red' && unit.hp > 0)
    if (!target) break
    setSelection(
      world,
      world.units
        .filter(unit => unit.team === 'blue' && unit.hp > 0 && unit.inside === null)
        .map(unit => unit.id)
    )
    assert.ok(command(world, target))
    for (let turn = 0; target.hp > 0 && world.status === 'playing' && turn < 5_000; turn++)
      tick(world, 1 / 12)
  }
  until(world, () => world.status === 'won', 1_000)
})
