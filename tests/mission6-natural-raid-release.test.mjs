import assert from 'node:assert/strict'
import test from 'node:test'
import {  createHistoricalFixtureHarness  } from './helpers/historical-checkpoint.ts'
import { cast, command, selectUnit, cancelInteraction, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { spellInRange } from '../app/spell-casting.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

// Genuine opening followed by a supplied legacy task without new marker metadata.
// Keep the original failed-route release assertions as checkpoint compatibility;
// fresh current-source marker travel/Bridge has a separate ordinary acceptance.
// Its historical dynamic IDs and rule behavior deliberately use classic mode.
test('legacy markerless Mission6 task releases its blocked raid without stranded owners', async () => {
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const store = createHistoricalFixtureHarness()
  store.startMission(6)
  const world = store.getWorld(),
    shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    population = team => world.units.filter(u => u.team === team && u.hp > 0).length,
    raid = () => world.campaignAIs[3].tasks.find(t => t.flags & 1 && t.type === 20),
    selectShaman = () => {
      cancelInteraction(world)
      selectUnit(world, shaman.id, false)
      assert.deepEqual(world.selected, [shaman.id])
    }
  while (!(world.flyby.flags & 1) && world.turn < 40) tick(world, 1 / 12)
  if (world.flyby.flags & 1 && world.flyby.warmup > 0)
    skipIntroduction({ world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  assert.equal(world.inputMask, 0)
  const vault = world.shrines.find(s => s.reward === 'convertWild')
  selectShaman()
  assert.ok(command(world, { ...vault, id: vault.id }))
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 33)
  for (let i = 0; i < 3000 && !world.shots.convertWild; i++) tick(world, 1 / 12)
  assert.ok(world.shots.convertWild > 0)
  assert.equal(world.turn, 566)
  const wrap = value => ((((value + 128) % 256) + 256) % 256) - 128
  for (let n = 0; n < 4 && world.shots.convertWild > 0; n++) {
    const wild = world.units
        .filter(
          u =>
            u.team === 'wild' && u.hp > 0 && u.inside === null && spellInRange(world, shaman, 17, u)
        )
        .sort(
          (a, b) =>
            Math.hypot(wrap(a.x - shaman.x), wrap(a.z - shaman.z)) -
            Math.hypot(wrap(b.x - shaman.x), wrap(b.z - shaman.z))
        )[0],
      before = population('blue'),
      stock = world.shots.convertWild
    assert.ok(wild)
    selectShaman()
    assert.ok(cast(world, 'convertWild', { x: wild.x, z: wild.z }))
    assert.equal(world.shots.convertWild, stock - 1)
    for (let i = 0; i < 1200 && population('blue') <= before; i++) tick(world, 1 / 12)
    assert.ok(population('blue') > before)
  }
  assert.equal(world.turn, 580)
  const raidLimit = world.turn + 15000
  while (world.turn < raidLimit && !raid() && world.status === 'playing') tick(world, 1 / 12)
  const task = raid()
  assert.ok(task)
  assert.equal(world.turn, 6767)
  assert.deepEqual(task.spells, [12, 3, 2])
  delete task.stagingMarker
  delete task.spellMarker
  const phaseLimit = world.turn + 512
  while (world.turn < phaseLimit && task.phase !== 6 && world.status === 'playing')
    tick(world, 1 / 12)
  assert.equal(task.phase, 6)
  assert.equal(world.turn, 6778)
  assert.equal(task.members.length, 5)
  const ids = [...task.members],
    owners = new Map(ids.map(id => [id, world.units.find(u => u.id === id).native])),
    health = new Map(ids.map(id => [id, world.units.find(u => u.id === id).hp]))
  assert.ok(ids.includes(world.units.find(u => u.team === 'green' && u.kind === 'shaman').id))
  for (const [id, person] of owners) assert.equal(world.objectCells.objects.get(id), person)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, world)
  const restoredTask = replay.campaignAIs[3].tasks.find(t => t.flags & 1 && t.type === 20)
  assert.ok(!Object.hasOwn(restoredTask, 'stagingMarker'))
  assert.ok(!Object.hasOwn(restoredTask, 'spellMarker'))
  const advance = () => {
    tick(world, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, world)
  }
  // The task is visited by the shared scheduler, not necessarily next world tick.
  while (world.turn < 6798 && task.elapsed === 0) advance()
  assert.equal(task.phase, 6)
  assert.ok(task.elapsed > 0, 'actual refused cast still advances the task clock')
  assert.deepEqual(task.spells, [12, 3, 2])
  while (world.turn < phaseLimit + 512 && task.phase !== 18) advance()
  assert.deepEqual([world.turn, task.phase, task.elapsed], [6846, 18, 64])
  while (world.turn < phaseLimit + 512 && task.phase !== 10) advance()
  assert.deepEqual([world.turn, task.phase, task.elapsed], [6849, 10, 0])
  // Native state33 settlement can release original members before the shared
  // return order. Preserve their health/identity checks through the full tail.
  assert.deepEqual(task.members, [619, 620, 9])
  for (const id of [618, 654]) {
    const unit = world.units.find(u => u.id === id), person = owners.get(id)
    assert.ok(!task.members.includes(id))
    assert.equal(unit.hp, health.get(id))
    assert.equal(unit.native, person)
    assert.equal(world.objectCells.objects.get(id), person)
    assert.ok(person.commands.every(command => command === 0))
    assert.equal(person.immediateCommand, 0)
    assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  }
  const admitted = task.members.map(id => owners.get(id)),
    first = admitted[0],
    orderId = first.immediateCommand || first.commands[first.commandCursor],
    order = world.buildingOrders.records[orderId]
  assert.equal(order.model, 3)
  assert.equal(order.references, 3)
  for (const person of admitted)
    assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  const releaseLimit = world.turn + 256
  while (world.turn < releaseLimit && task.phase !== 23) advance()
  assert.equal(task.phase, 23)
  assert.equal(world.turn, 6903)
  for (const id of ids) assert.equal(world.units.find(u => u.id === id).hp, health.get(id))
  assert.deepEqual(task.members, [])
  assert.equal(order.references, 0)
  assert.deepEqual(task.spells, [12, 3, 2], 'range-refused spells remain unconsumed')
  advance()
  assert.equal(task.flags & 1, 0)
  assert.equal(world.turn, 6904)
  for (let i = 0; i < 145; i++) advance()
  for (const [id, person] of owners) {
    const unit = world.units.find(u => u.id === id)
    assert.ok(unit && unit.hp > 0)
    assert.equal(unit.native, person)
    assert.equal(world.objectCells.objects.get(id), person)
    assert.ok(!person.commands.includes(orderId))
    assert.notEqual(person.immediateCommand, orderId)
    assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  }
  assert.equal(order.references, 0)
  assert.equal(world.stats.bridges, 0, 'this failed-raid recovery does not claim a land connection')
})
