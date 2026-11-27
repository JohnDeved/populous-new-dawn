import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'

test('authored Mission 15 polls for its surviving Prison before cancelling the rescue timer', () => {
  const intact = createWorld(15)
  const destroyed = createWorld(15)
  const controlPrison = intact.buildings.find(b => b.kind === 'prison')
  const target = destroyed.buildings.find(b => b.kind === 'prison')
  assert.equal(controlPrison?.object, 156)
  assert.equal(target?.object, 156)
  for (let i = 0; i < 17; i++) {
    tick(intact, 1 / 12)
    tick(destroyed, 1 / 12)
  }
  assert.equal(destroyed.turn, 17)
  assert.deepEqual(
    [intact.ai.variables[10], destroyed.ai.variables[10], destroyed.campaignTimer],
    [1, 1, 5383]
  )

  // Supply accumulated damage; normal building destruction and AI remain live.
  ensureBuildingDamage(target).damage = 22001
  for (let i = 0; i < 13; i++) {
    tick(intact, 1 / 12)
    tick(destroyed, 1 / 12)
  }
  assert.equal(destroyed.turn, 30)
  assert.equal(destroyed.buildings.includes(target), false)
  assert.deepEqual([destroyed.ai.variables[10], destroyed.campaignTimer], [1, 5370])

  tick(intact, 1 / 12)
  tick(destroyed, 1 / 12)
  assert.equal(destroyed.turn, 31)
  assert.ok(intact.buildings.includes(controlPrison) && controlPrison.hp > 0)
  assert.deepEqual([intact.ai.variables[10], intact.campaignTimer], [1, 5369])
  assert.deepEqual([destroyed.ai.variables[10], destroyed.campaignTimer], [0, null])
})
