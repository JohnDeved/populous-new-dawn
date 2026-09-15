import assert from 'node:assert/strict'
import test from 'node:test'
import {
  command,
  createWorld,
  placeBuilding,
  select,
  setSelection,
  tick,
} from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { campaignAttackTarget } from '../app/campaign-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function stepUntil(w, ready, limit) {
  for (let i = 0; i < limit && !ready(); i++) tick(w, 1 / 12)
  assert.ok(ready(), `condition timed out at turn ${w.turn}`)
}

test('Mission 2 naturally earns Matak kills and launches the organized raid', () => {
  const w = createWorld(2)
  stepUntil(w, () => w.turn >= 70, 1000)

  select(w, 'brave')
  assert.ok(placeBuilding(w, 'camp', { x: -99, z: -105 }))
  const camp = w.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  stepUntil(w, () => camp.progress === 1, 3000)
  stepUntil(w, () => !w.units.some(unit => unit.builder), 1000)
  setSelection(
    w,
    w.units
      .filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
      .slice(0, 8)
      .map(unit => unit.id)
  )
  assert.ok(command(w, camp))
  stepUntil(
    w,
    () => w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0).length >= 8,
    15000
  )

  const warriors = () =>
    w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
  for (let attempts = 0; w.killCredits[0][3] <= 3 && attempts < 8; attempts++) {
    const target = w.units
      .filter(unit => unit.team === 'green' && unit.kind !== 'shaman' && unit.hp > 0)
      .sort((a, b) => Math.hypot(a.x + 99, a.z + 105) - Math.hypot(b.x + 99, b.z + 105))[0]
    assert.ok(target)
    setSelection(w, warriors().map(unit => unit.id))
    assert.ok(command(w, target))
    stepUntil(w, () => target.hp <= 0, 10000)
  }
  assert.equal(w.killCredits[0][1], 0)
  assert.ok(w.killCredits[0][3] > 3)

  stepUntil(w, () => w.ai.tasks.some(task => task.flags & 1 && task.type === 20), 5000)
  const raid = w.ai.tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(
    { requested: raid.requested, mode: raid.mode, entity: raid.entity },
    { requested: 2, mode: 7, entity: camp.id }
  )
  stepUntil(
    w,
    () =>
      raid.members.length === 2 &&
      raid.members.every(id => {
        const unit = w.units.find(candidate => candidate.id === id)
        return unit?.native && currentPersonOrder(w.buildingOrders, unit.native)?.model === 19
      }),
    2000
  )
  const blueHp = w.units
    .filter(unit => unit.team === 'blue' && unit.hp > 0)
    .reduce((sum, unit) => sum + unit.hp, 0)
  stepUntil(
    w,
    () =>
      w.units
        .filter(unit => unit.team === 'blue' && unit.hp > 0)
        .reduce((sum, unit) => sum + unit.hp, 0) < blueHp,
    5000
  )
  assert.equal(raid.phase, 16)
  assert.equal(raid.fallback, 14)
  assert.ok(raid.flags & 1)
})

test('Mission 2 checkpoints retain kill ownership from the old red slot', () => {
  const saved = structuredClone(createWorld(2))
  saved.killCredits[0][1] = 6
  saved.killCredits[0][3] = 2
  saved.killCredits[1][0] = 5
  saved.killCredits[3][0] = 1
  migrateCheckpoint(saved)
  assert.equal(saved.killCredits[0][3], 6)
  assert.equal(saved.killCredits[3][0], 5)
})

test('Mission 2 camp targeting takes the first model match without RNG', () => {
  const w = createWorld(2)
  select(w, 'brave')
  assert.ok(placeBuilding(w, 'camp', { x: -99, z: -105 }))
  const camp = w.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  const seed = w.randomSeed
  assert.equal(campaignAttackTarget(w, 0, 7)?.id, camp.id)
  assert.equal(w.randomSeed, seed)
})
