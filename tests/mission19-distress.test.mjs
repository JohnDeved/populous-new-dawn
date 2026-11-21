import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { campaignInternal } from '../app/campaign-runtime.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function sample(world, turn) {
  world.activeCampaignTribe = 1
  world.ai = world.campaignAIs[1]
  world.turn = turn
  campaignRules(world)
}
const warnings = world => world.messages.slots.filter(Boolean).map(message => message.stringId)

test('kill-count internals retain attacker/victim direction and unsigned word width', () => {
  const world = createWorld(19)
  for (let attacker = 0; attacker < 4; attacker++) {
    world.activeCampaignTribe = attacker
    for (let victim = 0; victim < 4; victim++) {
      world.killCredits[attacker][victim] = 65536 + attacker * 100 + victim
      assert.equal(campaignInternal(world, 1176 + victim), attacker * 100 + victim)
    }
  }
})

test('Mission 19 first distress warning consumes real death credit once across checkpoint', () => {
  const world = createWorld(19)
  // Controlled lethal fixtures feed the ordinary death owner, not the counter directly.
  const victims = world.units.filter(unit => unit.team === 'yellow' && unit.kind === 'brave').slice(0, 3)
  assert.equal(victims.length, 3)
  for (const victim of victims) {
    victim.hp = 0
    victim.damageAttacker = 1
    if (victim.native) victim.native.damageAttacker = 1
  }
  tick(world, 1 / 12)
  assert.equal(world.killCredits[1][2], 3)
  while (world.turn < 63) tick(world, 1 / 12)
  assert.ok(!warnings(world).includes(703))
  tick(world, 1 / 12)
  assert.equal(warnings(world).filter(id => id === 703).length, 1)
  assert.equal(world.campaignAIs[1].variables[16], 1)
  const restored = migrateCheckpoint(structuredClone(world))
  sample(restored, 127)
  assert.equal(warnings(restored).filter(id => id === 703).length, 1)
})

test('Mission 19 distress thresholds preserve strict limits and second warning prerequisites', () => {
  for (const [kills, first, second] of [[2, false, false], [3, true, false], [25, true, false], [26, true, true]]) {
    const world = createWorld(19)
    world.killCredits[1][2] = kills
    world.buildings = world.buildings.filter(building => building.team !== 'yellow')
    sample(world, 63)
    assert.equal(warnings(world).includes(703), first)
    assert.equal(warnings(world).includes(704), second)
    const restored = migrateCheckpoint(structuredClone(world))
    sample(restored, 127)
    assert.equal(warnings(restored).filter(id => id === 704).length, second ? 1 : 0)
    assert.equal(restored.campaignAIs[1].variables[15], second ? 1 : 0)
  }
})

test('second warning stays closed while Chumara has its school or Dakini has at most thirty people', () => {
  for (const blockedBy of ['school', 'population']) {
    const world = createWorld(19)
    world.killCredits[1][2] = 26
    if (blockedBy === 'population') {
      world.buildings = world.buildings.filter(building => building.team !== 'yellow')
      let retained = 0
      world.units = world.units.filter(unit => unit.team !== 'red' || retained++ < 30)
    }
    sample(world, 63)
    assert.ok(warnings(world).includes(703))
    assert.ok(!warnings(world).includes(704))
    assert.equal(world.campaignAIs[1].variables[15], 0)
  }
})
