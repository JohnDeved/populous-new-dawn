import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, command, cast, selectFollowers, cancelInteraction, nativePosition } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { bindStagedBlastTarget, stationaryBlastTarget } from '../qa/blast-ordinary/preparation.mjs'
import { responseSnapshot } from '../qa/blast-ordinary/observer.mjs'

// Actual imported M2 World/public model commands; no injected actors, pose, speed,
// resources, terrain or order. This is a port caller contract, not browser evidence.
test('completed ordinary M2 staging binds its real owner and admits a later cast', t => {
  const world = createWorld(2)
  for (let i = 0; i < 70; i++) tick(world, 1 / 12)
  const actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  cancelInteraction(world)
  selectFollowers(world, 2, nativePosition(world, actor), 'single')
  assert.equal(world.selected.length, 1)
  const target = world.units.find(u => u.id === world.selected[0]), destination = { x: -99.03736562343573, z: -100.98158892093534 } // retained ordinary17 ground pick
  assert.ok(command(world, destination))
  const person = target.native, scene = { world }, original = { scene, world, target, stagePerson: person }
  assert.equal(currentPersonOrder(world.buildingOrders, person)?.model, 3)
  assert.equal(bindStagedBlastTarget(original, destination, currentPersonOrder).ready, false, 'unreached stage cannot attach')
  assert.equal(original.movePerson, undefined)
  let completed, stationary, admitted, movingResting, firstZeroSpeed, prior
  for (let attempts = 0; attempts < 600; attempts++) {
    tick(world, 1 / 12)
    const actual = bindStagedBlastTarget(original, destination, currentPersonOrder)
    if (!actual.ready) continue
    completed ??= actual
    if (actual.speed === 0) firstZeroSpeed ??= actual
    const snapshot = responseSnapshot(scene, original)[0]
    assert.ok(snapshot, 'actual scenario snapshot retains the bound person')
    if (person.state === 19 && person.substate === 2 && person.speed > 0) {
      movingResting ??= actual
      assert.equal(snapshot.idle, false)
      assert.equal(stationaryBlastTarget(snapshot, prior?.turn, prior?.position, actual.turn), false)
    }
    if (prior && actual.turn > prior.turn && actual.position.x === prior.position.x && actual.position.y === prior.position.y) stationary ??= actual
    if (stationaryBlastTarget(snapshot, prior?.turn, prior?.position, actual.turn)) { admitted = actual; break }
    prior = actual
  }
  assert.ok(movingResting, 'actual resting-slot approach must be rejected before admission')
  assert.ok(completed && stationary && admitted, 'normal staging must reach a stable native pose within the finite contract')
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  assert.throws(() => {
    const order = currentPersonOrder(world.buildingOrders, person)
    assert.ok(order && order.model === 3, 'obsolete attachment demands an unfinished order')
  }, /obsolete attachment/)
  assert.equal(original.movePerson, person)
  assert.equal(world.objectCells.objects.get(target.id), person)
  assert.equal(bindStagedBlastTarget(original, { x: 50, z: 50 }, currentPersonOrder).ready, false)
  assert.throws(() => bindStagedBlastTarget({ ...original, target: { ...target } }, destination, currentPersonOrder), /identity or registered owner/)
  assert.throws(() => bindStagedBlastTarget({ ...original, stagePerson: { ...person } }, destination, currentPersonOrder), /identity or registered owner/)
  const selected = [...world.selected], stock = world.shots.blast
  assert.ok(cast(world, 'blast', target, target.id), 'actual public cast admission accepts the completed-stage target')
  assert.equal(world.mode, null)
  assert.deepEqual(world.selected, selected)
  assert.equal(world.shots.blast, stock - 1)
  assert.equal(world.projectiles.at(-1).caster, actor.id)
  assert.equal(world.projectiles.at(-1).phase, 'windup')
  assert.equal(world.projectiles.at(-1).remaining, 6)
  t.diagnostic(JSON.stringify({ completed, movingResting, stationary, admitted, firstZeroSpeed: firstZeroSpeed ?? null, caster: actor.id, target: target.id }))
})
