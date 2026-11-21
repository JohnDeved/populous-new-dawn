import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function fixture() {
  const world = createWorld(20)
  const survivors = world.units.filter(u => u.team === 'red').slice(0, 7)
  world.units = world.units.filter(u => u.team !== 'red' || survivors.includes(u))
  world.buildings = world.buildings.filter(b => b.team !== 'red')
  world.killCredits[0][1] = 6
  return world
}
function sample(world, turn) {
  world.activeCampaignTribe = 1
  world.ai = world.campaignAIs[1]
  world.turn = turn
  campaignRules(world)
}

test('Mission 20 last stand preserves authored cadence, strict kill threshold and population gate', () => {
  for (const [turn, kills, population, expected] of [
    [8, 6, 7, false],
    [9, 5, 7, false],
    [9, 6, 8, false],
    [9, 6, 7, true],
    [73, 6, 7, true],
  ]) {
    const world = fixture()
    if (population === 8)
      world.units.push(
        structuredClone(
          createWorld(20).units.find(u => u.team === 'red' && !world.units.some(v => v.id === u.id))
        )
      )
    world.killCredits[0][1] = kills
    const flags = world.manaTribes[1].flags2
    sample(world, turn)
    assert.equal(!!(world.manaTribes[1].flags2 & 0x40), expected)
    assert.equal(world.manaTribes[1].flags2, flags | (expected ? 0x40 : 0))
  }
})

test('Mission 20 ordinary tick dispatches last stand and preserves checkpoint orders', () => {
  const world = fixture()
  while (world.turn < 9) tick(world, 1 / 12)
  assert.equal(world.manaTribes[1].flags2 & 0x40, 0)
  tick(world, 1 / 12)
  assert.ok(world.manaTribes[1].flags2 & 0x40)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.ok(
    world.units.some(
      u =>
        u.team === 'red' &&
        u.target === shaman.id &&
        currentPersonOrder(world.buildingOrders, u.native)?.model === 28
    )
  )
  const restored = migrateCheckpoint(structuredClone(world))
  tick(world, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(restored, world)
})

test('Mission 20 every completed hut tier blocks last stand while incomplete huts do not', () => {
  for (const level of [1, 2, 3]) {
    for (const progress of [0.5, 1]) {
      const world = fixture()
      const hut = structuredClone(
        createWorld(20).buildings.find(b => b.kind === 'hut' && b.team === 'red')
      )
      Object.assign(hut, { team: 'red', level, progress, hp: 100 })
      world.buildings.push(hut)
      sample(world, 9)
      assert.equal(!!(world.manaTribes[1].flags2 & 0x40), progress < 1)
    }
  }
})

function matchingAttackOwners(world, shamanId, corroborate = false) {
  const ids = []
  for (const u of world.units) {
    if (u.team !== 'red' || u.hp <= 0 || u.ghost) continue
    const p = world.objectCells.objects.get(u.id)
    const bound = !!p && [u.flight, u.fight?.motion, u.entry?.person, u.builder?.person, u.native].includes(p)
    const order = bound ? currentPersonOrder(world.buildingOrders, p) : undefined
    const effective =
      order?.model === 28 && order.a === shamanId && !(order.flags & 1)
    if (corroborate && u.target === shamanId) assert.ok(effective)
    if (!effective) continue
    if (corroborate) assert.equal(u.target, shamanId)
    ids.push(u.id)
  }
  return ids.sort((a, b) => a - b)
}

test('Mission 20 last stand queues and restores an effective attack on the Blue Shaman', () => {
  const world = fixture()
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0 && !u.ghost)
  assert.ok(shaman)
  while (world.turn < 9) {
    const before = world.turn
    tick(world, 1 / 12)
    assert.equal(world.turn, before + 1)
  }
  assert.equal(world.manaTribes[1].flags2 & 0x40, 0)
  assert.deepEqual(matchingAttackOwners(world, shaman.id), [])
  tick(world, 1 / 12)
  assert.equal(world.turn, 10)
  assert.equal(world.manaTribes[1].flags2 & 0x40, 0x40)
  const owners = matchingAttackOwners(world, shaman.id, true)
  assert.ok(owners.length > 0)

  const restored = migrateCheckpoint(structuredClone(world))
  assert.ok(restored.units.some(u => u.id === shaman.id && u.team === 'blue' && u.kind === 'shaman' && u.hp > 0 && !u.ghost))
  assert.deepEqual(matchingAttackOwners(restored, shaman.id, true), owners)
  tick(world, 1 / 12)
  tick(restored, 1 / 12)
  assert.equal(world.turn, 11)
  assert.deepEqual(restored, world)
})
