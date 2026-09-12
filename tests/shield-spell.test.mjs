import assert from 'node:assert/strict'
import test from 'node:test'
import constants from '../app/original-constants.json' with { type: 'json' }
import { addUnit, cast, createWorld, shieldFollowers, stepUnitShields, tick } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { damagePerson } from '../app/person-update.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

test('Magical Shield protects six nearby followers for the native lifetime', () => {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  const shaman = addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const braves = Array.from({ length: 7 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 1 + i / 10, z: 0 })
  )
  const enemy = addUnit(w, 'red', 'brave', { x: 1, z: 0 })
  const targets = shieldFollowers(w, { x: 1, z: 0 }, 'blue')

  assert.deepEqual(targets, braves.slice(0, constants.SHIELD_NUM_PEOPLE))
  assert.equal(shaman.shield, undefined)
  assert.equal(enemy.shield, undefined)
  assert.equal(targets[0].shield, constants.SHIELD_COUNT_X8 * 8)

  const person = createLivePerson(w, targets[0])
  assert.ok(person.flags3 & 0x80000)
  const life = person.life
  damagePerson(person, 0, 1, 80)
  assert.equal(person.life, life - 10)

  targets[0].shield = 1
  targets[0].native = person
  stepUnitShields(w)
  assert.equal(targets[0].shield, 0)
  assert.equal(person.flags3 & 0x80000, 0)

  w.shots.shield = 1
  assert.ok(cast(w, 'shield', { x: 1, z: 0 }))
  for (let i = 0; w.projectiles.length && i < 120; i++) tick(w, 1 / 12)
  assert.equal(w.shots.shield, 0)
  assert.ok(braves.some(u => u.shield))
})

test('old checkpoints default new Shield stock without disturbing their world', () => {
  const w = createWorld()
  delete w.shots.shield
  delete w.giftCounts.shield
  assert.equal(migrateCheckpoint(w), w)
  assert.equal(w.shots.shield, 0)
  assert.equal(w.giftCounts.shield, 0)
})
