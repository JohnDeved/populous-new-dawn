import assert from 'node:assert/strict'
import test from 'node:test'
import constants from '../app/original-constants.json' with { type: 'json' }
import {
  addUnit,
  browserPosition,
  cast,
  command,
  createWorld,
  nativePosition,
  tick,
} from '../app/model.ts'
import { applyUnitDamage, meleeDamage } from '../app/combat-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { launchFirewarrior, stepFirewarriorShots } from '../app/firewarrior.ts'
import { randomPersonSpeed } from '../app/person-state.ts'
import {
  bloodlustFollowers,
  shieldFollowers,
  stepUnitBloodlust,
} from '../app/spell-effects-runtime.ts'
import { worshipPositions } from '../app/worship.ts'

function finishWorship(world, head) {
  const followers = world.units
    .filter(unit => unit.team === 'blue' && unit.kind === 'brave')
    .slice(0, head.required)
  const slots = worshipPositions({
    ...nativePosition(world, head),
    angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
  })
  followers.forEach((unit, index) =>
    Object.assign(unit, browserPosition(slots[index]), { native: null })
  )
  syncLivePersonCells(world)
  world.selected = followers.map(unit => unit.id)
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  head.work = head.target * head.required ** 2 - 1
  for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
  assert.equal(head.uses, 1)
}

test('Mission 16 worship grants Bloodlust and live combat consumes its status', () => {
  const world = createWorld(16),
    heads = world.shrines.filter(shrine => shrine.reward === 'bloodlust'),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.deepEqual(
    heads.map(head => [head.x, head.z, head.name]),
    [
      [85, -77, 'Bloodlust stone head'],
      [-33, -13, 'Bloodlust stone head'],
    ]
  )

  for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
  finishWorship(world, heads[0])
  assert.deepEqual(
    world.gifts.map(gift => gift.reward),
    ['bloodlust']
  )
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)
  assert.deepEqual([world.shots.bloodlust, world.giftCounts.bloodlust], [1, 1])

  for (const unit of world.units) if (unit !== shaman) unit.inside = 1
  const point = { x: shaman.x + 1, z: shaman.z },
    kinds = ['brave', 'warrior', 'preacher', 'firewarrior', 'spy', 'brave', 'warrior'],
    followers = kinds.map((kind, index) =>
      addUnit(world, 'blue', kind, { x: point.x + index / 20, z: point.z })
    )
  assert.equal(cast(world, 'bloodlust', point), true)
  for (let turn = 0; turn < 120 && !followers.some(unit => unit.bloodlust); turn++)
    tick(world, 1 / 12)
  const affected = followers.filter(unit => unit.bloodlust)
  assert.deepEqual(affected, followers.slice(0, constants.BLOODLUST_NUM_PEOPLE))
  assert.equal(affected[0].bloodlust, constants.BLOODLUST_COUNT_X8 * 8)
  assert.equal(world.shots.bloodlust, 0)

  const fighter = affected[1],
    ordinary = { ...fighter, bloodlust: 0 },
    baseDamage = meleeDamage(ordinary)
  assert.equal(meleeDamage(fighter), baseDamage * constants.BLOODLUST_DAMAGE_X)
  const hp = fighter.hp
  applyUnitDamage(fighter, 8)
  assert.equal(fighter.hp, hp - 1)

  const firewarrior = affected[3],
    target = addUnit(world, 'red', 'brave', firewarrior)
  target.hp = 100
  launchFirewarrior(world, firewarrior, target)
  const shots = world.effects.filter(effect => effect.firewarriorShot)
  assert.equal(firewarrior.cooldown, 25 / 12 / (1 << constants.BLOODLUST_SW_BLAST_X))
  assert.equal(shots.length, 2)
  assert.ok(shots.every(shot => shot.firewarriorShot.bloodlust))
  stepFirewarriorShots(world)
  assert.equal(target.hp, 100 - 20 * constants.BLOODLUST_DAMAGE_X)

  world.effects = world.effects.filter(effect => !effect.firewarriorShot)
  Object.assign(target, { hp: 100, shield: 1, damageAttacker: 2 })
  launchFirewarrior(world, firewarrior, target)
  stepFirewarriorShots(world)
  assert.equal(target.hp, 100)
  assert.equal(target.damageAttacker, 2)

  shieldFollowers(world, fighter, 'blue')
  fighter.native = createLivePerson(world, fighter)
  assert.equal(fighter.native.flags3 & 0x88000, 0x88000)
  const ordinaryRng = { randomState: 1 },
    bloodlustRng = { randomState: 1 }
  assert.equal(
    randomPersonSpeed(bloodlustRng, fighter.native),
    randomPersonSpeed(ordinaryRng, { ...fighter.native, flags3: 0 }) * 2
  )

  fighter.bloodlust = 1
  stepUnitBloodlust(world)
  assert.equal(fighter.bloodlust, 0)
  assert.equal(fighter.native.flags3 & 0x80000, 0)
  assert.ok(fighter.native.flags3 & 0x8000)

  const restored = migrateCheckpoint(structuredClone(world))
  assert.equal(restored.shots.bloodlust, 0)
  assert.equal(restored.giftCounts.bloodlust, 1)
  const expiring = restored.units.find(unit => unit.id === affected[0].id),
    remaining = expiring.bloodlust
  for (let turn = 0; turn < remaining; turn++) stepUnitBloodlust(restored)
  assert.equal(expiring.bloodlust, 0)
})

test('old checkpoints default Bloodlust stock without disturbing their world', () => {
  const world = createWorld()
  delete world.shots.bloodlust
  delete world.giftCounts.bloodlust
  assert.equal(migrateCheckpoint(world), world)
  assert.equal(world.shots.bloodlust, 0)
  assert.equal(world.giftCounts.bloodlust, 0)
})
