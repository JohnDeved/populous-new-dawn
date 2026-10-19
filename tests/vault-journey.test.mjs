import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, select, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

const outside = { x: 58112, y: 30976 }
const inside = { x: 58112, y: 32000 }
const leave = { x: 58112, y: 29952 }

function journey() {
  const world = finishLevelStart(createWorld(3))
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple')
  const home = { x: shaman.x, z: shaman.z }
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  return { world, shaman, vault, home }
}

function snapshot(world, shamanId, vaultId) {
  return structuredClone({
    turn: world.turn,
    randomState: world.randomState,
    cosmeticRandom: world.cosmeticRandom,
    shaman: world.units.find(unit => unit.id === shamanId),
    vault: world.shrines.find(shrine => shrine.id === vaultId),
    orders: world.buildingOrders,
    unlocked: world.unlockedTemple,
    gifts: world.gifts,
  })
}

test('authored M3 Vault caller opens before entry and preserves a prayer Save/Load through reward and departure', t => {
  const { world, shaman, vault } = journey()
  const savedPhases = new Set()
  const goals = new Map([[1, outside], [2, outside], [4, inside], [7, outside], [9, leave]])
  let prayerRestored
  const advance = () => {
    tick(world, 1 / 12)
    if (prayerRestored) {
      tick(prayerRestored, 1 / 12)
      assert.deepEqual(snapshot(prayerRestored, shaman.id, vault.id), snapshot(world, shaman.id, vault.id))
    }
  }
  let completed = false
  for (let turn = 0; turn < 4000 && !(completed && world.unlockedTemple); turn++) {
    advance()
    assert.ok(shaman.hp > 0)
    const person = shaman.native
    const order = person && currentPersonOrder(world.buildingOrders, person)
    if (order?.model === 33) {
      assert.equal(order.a, vault.id)
      const phase = person.commandPhase
      // A newly selected phase still owns the previous goal until its first-entry visit.
      if (!(person.flags2 & 0x40000000) && goals.has(phase) && !savedPhases.has(phase)) {
        assert.deepEqual({ x: person.goalX, y: person.goalY }, goals.get(phase))
        if (phase === 2) assert.equal(vault.model, 154, 'outside prayer precedes opening')
        if (phase === 4) assert.equal(vault.model, 153, 'inside travel starts only after opening')
        savedPhases.add(phase)
        t.diagnostic(JSON.stringify({ phase, turn: world.turn, goal: goals.get(phase) }))
        const restored = migrateCheckpoint(structuredClone(world))
        // Retain the actual prayer checkpoint through the same finite caller history.
        // The other four checkpoints check three-turn restored-state equivalence.
        if (phase === 2) prayerRestored = restored
        for (let resumed = 0; resumed < 3; resumed++) {
          advance()
          if (restored !== prayerRestored) tick(restored, 1 / 12)
          assert.deepEqual(snapshot(restored, shaman.id, vault.id), snapshot(world, shaman.id, vault.id))
        }
      }
    } else if (savedPhases.has(9)) {
      completed = true
      assert.equal(shaman.vault, null)
      assert.equal(shaman.work, null)
    }
  }
  assert.deepEqual([...savedPhases], [1, 2, 4, 7, 9])
  assert.equal(completed, true)
  assert.equal(world.unlockedTemple, true)
  assert.equal(vault.uses, 1)
  assert.ok(prayerRestored)
  assert.equal(prayerRestored.unlockedTemple, true)
  assert.equal(prayerRestored.shrines.find(shrine => shrine.id === vault.id).uses, 1,
    'the retained prayer Save/Load must receive exactly one reward')
  assert.deepEqual(snapshot(prayerRestored, shaman.id, vault.id), snapshot(world, shaman.id, vault.id))
})

test('public command replacement cancels approach/prayer work and a later Vault command starts a fresh approach', () => {
  for (const targetPhase of [1, 2]) {
    const { world, shaman, vault, home } = journey()
    let ready = false
    for (let turn = 0; turn < 4000 && !ready; turn++) {
      tick(world, 1 / 12)
      ready = shaman.native?.commandPhase === targetPhase && (targetPhase === 1 || vault.work >= 3)
    }
    assert.equal(ready, true)
    const beforeWork = vault.work
    select(world, 'shaman')
    assert.equal(command(world, home), true)
    assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 3)
    assert.equal(shaman.vault, null)
    assert.equal(shaman.work, null)
    for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
    assert.ok(targetPhase === 1 ? vault.work === 0 : vault.work < beforeWork)
    assert.equal(vault.uses, 0)
    select(world, 'shaman')
    assert.equal(command(world, vault), true)
    tick(world, 1 / 12)
    assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 33)
    assert.deepEqual({ x: shaman.native.goalX, y: shaman.native.goalY }, outside)
  }
})
