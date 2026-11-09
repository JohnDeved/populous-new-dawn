import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, addBuilding, tick } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { launchFirewarrior, stepFirewarriorShots } from '../app/firewarrior.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import constants from '../app/original-constants.json' with { type: 'json' }

function fixture({ tower = false, bloodlust = false, shield = false, hp = 100 } = {}) {
  const world = createWorld(),
    source = addUnit(world, 'blue', 'firewarrior', { x: 0, z: 0 }),
    target = addUnit(world, 'red', 'brave', source)
  if (tower) source.inside = addBuilding(world, 'blue', 'tower', source, true).id
  if (bloodlust) source.bloodlust = 100
  if (shield) target.shield = 100
  target.hp = hp
  target.damageAttacker = 3
  target.native = createLivePerson(world, target)
  target.native.damageAttacker = 3
  world.effects = []
  launchFirewarrior(world, source, target)
  const pair = world.effects.filter(effect => effect.firewarriorShot)
  assert.deepEqual(pair.map(effect => effect.firewarriorShot.impact), [false, true])
  return { world, source, target, pair }
}

for (const tower of [false, true]) for (const bloodlust of [false, true]) {
  test(`${tower ? 'tower' : 'on-foot'}${bloodlust ? ' Bloodlust' : ''} pair has one authoritative unit impact`, () => {
    const { world, target, pair } = fixture({ tower, bloodlust }),
      damage = (tower ? 25 : 10) * (bloodlust ? constants.BLOODLUST_DAMAGE_X : 1),
      randomState = world.randomState
    world.effects = [pair[0]]
    stepFirewarriorShots(world)
    assert.equal(target.hp, 100, 'unmarked visual side cannot damage')
    assert.equal(target.damageAttacker, 3)
    assert.equal(target.native.damageAttacker, 3)
    assert.equal(world.effects.some(effect => effect.kind === 'hit'), false)
    assert.equal(pair[0].duration, pair[0].age)
    world.effects = [pair[1]]
    stepFirewarriorShots(world)
    assert.equal(target.hp, 100 - damage)
    assert.equal(target.damageAttacker, 0)
    assert.equal(target.native.damageAttacker, 0)
    assert.equal(world.effects.filter(effect => effect.kind === 'hit').length, 1)
    assert.equal(pair[1].duration, pair[1].age)
    assert.equal(world.randomState, randomState)
  })
}

test('whole pair preserves Shield and only the marked side emits hit feedback', () => {
  const { world, target } = fixture({ shield: true })
  stepFirewarriorShots(world)
  assert.equal(target.hp, 100)
  assert.equal(target.damageAttacker, 3)
  assert.equal(target.native.damageAttacker, 3)
  assert.equal(world.effects.filter(effect => effect.kind === 'hit').length, 1)
})

test('visual side cannot claim lethal damage or campaign kill attribution', () => {
  const { world, target, pair } = fixture({ hp: 5 })
  world.effects = [pair[0]]
  stepFirewarriorShots(world)
  assert.equal(target.hp, 5)
  assert.equal(world.killCredits[0][1], 0)
  world.effects = [pair[1]]
  stepFirewarriorShots(world)
  assert.equal(target.hp, 0)
  assert.equal(target.damageAttacker, 0)
  tick(world, 1 / 12)
  assert.equal(world.killCredits[0][1], 1)
  assert.equal(world.killCredits[3][1], 0)
})

test('source loss preserves launched impact but cannot fabricate a living attacker', () => {
  const { world, target, source } = fixture()
  source.hp = 0
  stepFirewarriorShots(world)
  assert.equal(target.hp, 90)
  assert.equal(target.damageAttacker, 3, 'retain existing absent-source attribution policy')
  assert.equal(target.native.damageAttacker, 3)
})

test('legacy omitted markers preserve old in-flight unit behavior through checkpoint restore', () => {
  const { world, target, pair } = fixture()
  world.effects = [pair[0]]
  delete pair[0].firewarriorShot.impact
  const restored = migrateCheckpoint(structuredClone(world))
  stepFirewarriorShots(world)
  stepFirewarriorShots(restored)
  assert.equal(target.hp, 90, 'missing side metadata is not guessed during migration')
  assert.deepEqual(restored, world)
  assert.equal(world.effects.filter(effect => effect.kind === 'hit').length, 1)
})

test('current pair side ownership survives an in-flight checkpoint unchanged', () => {
  const { world, target } = fixture()
  const restored = migrateCheckpoint(structuredClone(world))
  stepFirewarriorShots(world)
  stepFirewarriorShots(restored)
  assert.equal(target.hp, 90)
  assert.deepEqual(restored, world)
})

for (const marker of [false, true, undefined]) {
  test(`building impact keeps its existing ${String(marker)} marker behavior`, () => {
    const world = createWorld(), building = addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, true),
      source = addUnit(world, 'blue', 'firewarrior', building), state = ensureBuildingDamage(building)
    world.effects = []
    launchFirewarrior(world, source, building)
    const shot = world.effects.find(effect => effect.firewarriorShot)
    if (marker === undefined) delete shot.firewarriorShot.impact
    else shot.firewarriorShot.impact = marker
    world.effects = [shot]
    const damage = state.damage
    stepFirewarriorShots(world)
    assert.equal(state.damage - damage, marker === true ? 40 : 0)
    assert.equal(world.effects.filter(effect => effect.kind === 'hit').length, marker === false ? 0 : 1)
  })
}
