import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, select, tick } from '../app/model.ts'
import { buildingFootprintCells, buildingOutsidePoint } from '../app/building-shapes.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import levelThree from '../app/level-three.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { bindTrainingPanelRequests } from '../app/training-panel-requests.ts'

const cell = point => ((point.y & 65535) >>> 9) * 128 + ((point.x & 65535) >>> 9)

// CPU model/caller coverage: startup and travel use real turns, without browser
// presentation/input proof. No actor relocation, work injection or supplied phases.
test('authored M3 Vault command approaches its original outside point and earns prayer work there', t => {
  const world = createWorld(3)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple')
  const authored = levelThree.objects.find(object => object.index === 104)
  assert.ok(shaman)
  assert.ok(vault)
  assert.deepEqual(
    [authored.type, authored.model, authored.owner, authored.x, authored.z, authored.angle],
    [2, 18, 255, -38, -132, 0]
  )
  const pose = {
    object: 154,
    angle: authored.angle,
    anchorX: Math.round((authored.x + 8) * 256) & 0xfe00,
    anchorY: Math.round((-authored.z - 8) * 256) & 0xfe00,
  }
  // Retained 004044b0 and shape 59: anchor (57856,31744), outside [20,4].
  const expected = { x: 58112, y: 30976 }
  const footprint = new Set(buildingFootprintCells(pose))
  assert.deepEqual(buildingOutsidePoint(pose), expected)
  assert.equal(footprint.has(cell(expected)), false)

  finishLevelStart(world)
  assert.equal(world.units.find(unit => unit.id === shaman.id), shaman)
  assert.ok(shaman.hp > 0)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [shaman.id])
  assert.equal(command(world, vault), true)
  const issued = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.equal(issued?.model, 33)
  assert.equal(issued.a, vault.id)
  assert.equal(issued.flags & 1, 0)

  let approached = false
  let prayerWork = false
  // Same finite 4,000-turn bound as the existing ordinary Vault collection test.
  for (let turn = 0; turn < 4000 && !prayerWork; turn++) {
    const beforePhase = shaman.native?.commandPhase
    const beforeWork = vault.work
    tick(world, 1 / 12)
    const person = shaman.native
    assert.ok(person, 'the original Shaman must retain the actual native task owner')
    assert.equal(world.objectCells.objects.get(shaman.id), person)
    assert.ok(shaman.hp > 0, 'the original Shaman must remain alive')
    const order = currentPersonOrder(world.buildingOrders, person)
    assert.equal(order?.model, 33, 'the ordinary Vault command must remain active')
    assert.equal(order.a, vault.id)
    assert.equal(order.flags & 1, 0)

    if (!approached && person.commandPhase === 1) {
      const goal = { x: person.goalX, y: person.goalY }
      t.diagnostic(JSON.stringify({
        boundary: 'first-phase-1', turn: world.turn, shaman: shaman.id,
        target: vault.id, phase: person.commandPhase, goal, expected,
        goalInsideFootprint: footprint.has(cell(goal)),
      }))
      assert.deepEqual(goal, expected, 'the actual phase-1 caller must install the original outside point')
      assert.equal(footprint.has(cell(goal)), false, 'prayer approach must target outside the occupied mask')
      approached = true
    }
    if (beforePhase === 2 && person.commandPhase === 2 && vault.work > beforeWork) {
      assert.equal(approached, true)
      assert.deepEqual({ x: person.goalX, y: person.goalY }, expected)
      assert.ok(Math.abs(person.x - expected.x) <= 11 && Math.abs(person.y - expected.y) <= 11)
      assert.equal(footprint.has(cell(person)), false, 'pre-open prayer must stay outside the Vault')
      assert.equal(person.state, 10)
      assert.equal(person.commandStatus, 33)
      assert.equal(vault.model, 154, 'this witness is prayer before opening, not intentional phase-4 entry')
      assert.equal(vault.uses, 0)
      assert.equal(vault.forced, false)
      t.diagnostic(JSON.stringify({
        boundary: 'phase-2-work', turn: world.turn, phase: person.commandPhase,
        position: { x: person.x, y: person.y }, beforeWork, work: vault.work,
      }))
      prayerWork = true
    }
  }
  assert.equal(approached, true, 'ordinary command 33 must reach its first approach phase within 4,000 turns')
  assert.equal(prayerWork, true, 'ordinary phase-2 work must grow at the canonical outside point within 4,000 turns')
})

test('ordinary M3 Vault samples request the panel before replacing the cached count and prayer work', t => {
  const world = createWorld(3)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple')
  finishLevelStart(world)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [shaman.id])
  assert.equal(command(world, vault), true)
  const requests = []
  const release = bindTrainingPanelRequests(world, {
    requestAutomaticTraining() {},
    requestAutomaticVault(id) {
      if (id !== vault.id) return
      requests.push({
        turn: world.turn,
        followers: vault.followers,
        work: vault.work,
        state: shaman.native.state,
        command: shaman.native.commandStatus,
      })
    },
  })
  t.after(release)
  let firstPositive
  let repeatedPositive
  for (let turns = 0; turns < 4000 && !repeatedPositive; turns++) {
    const before = { followers: vault.followers, work: vault.work }
    tick(world, 1 / 12)
    const request = requests.findLast(sample => sample.turn === world.turn)
    if (request) {
      assert.equal(world.turn & 3, 0)
      assert.equal(request.state, 10)
      assert.equal(request.command, 33)
      assert.equal(request.followers, before.followers)
      assert.equal(request.work, before.work)
    }
    if (!before.followers && vault.followers) {
      assert.ok(request, 'the first actual 0→1 sample must request before its count write')
      firstPositive = request
      assert.equal(request.followers, 0)
      assert.equal(vault.work, request.work + 1)
    } else if (firstPositive && request?.followers === 1) repeatedPositive = request
  }
  assert.ok(firstPositive, 'ordinary original Shaman reaches a positive prayer sample')
  assert.ok(repeatedPositive, 'a later actual sample must request with the previous positive count')
  assert.equal(repeatedPositive.turn - firstPositive.turn, 4)
  assert.equal(shaman.native, world.objectCells.objects.get(shaman.id))
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 33)
  assert.equal(vault.uses, 0)
  assert.equal(vault.forced, false)
  t.diagnostic(JSON.stringify({ boundary: 'vault-request-order', firstPositive, repeatedPositive }))

  // Ordinary command cancellation must update the cached count to zero, then
  // ordinary reissue can produce a fresh 0→1 sample through the same caller.
  assert.equal(command(world, { x: 35, z: 81 }), true)
  for (let turns = 0; turns < 4 && vault.followers; turns++) tick(world, 1 / 12)
  assert.equal(vault.followers, 0)
  assert.equal(command(world, vault), true)
  let resumed
  for (let turns = 0; turns < 4000 && !resumed; turns++) {
    const before = vault.followers
    tick(world, 1 / 12)
    if (!before && vault.followers) resumed = requests.findLast(sample => sample.turn === world.turn)
  }
  assert.ok(resumed)
  assert.equal(resumed.followers, 0)
})
