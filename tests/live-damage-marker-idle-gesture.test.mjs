import assert from 'node:assert/strict'
import test from 'node:test'
import { damageBuilding, damageBuildingByPerson } from '../app/building-damage.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { missionData } from '../app/mission-data.ts'
import { stepPersonIdleGesture } from '../app/person-state.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

test('00409200 real person strike damage wraps, preserves sentinel attacker and raises first owned alert only', () => {
  const w = { levelFlags2: 0, playerTribe: 0, attackAlert: 0, attackCell: 0, tribes: [{ flags: 1 }] }
  const target = { tribe: 0, flags3: 0, x: 0x3501, y: 0x9123, damage: 32765, attacker: 3 }
  damageBuildingByPerson(w, target, { model: 2, tribe: 2 })
  assert.deepEqual([target.damage, target.attacker, w.attackAlert, w.attackCell, w.tribes[0].flags],
    [-32764, 2, 1, 0x9034, 0x8001])
  damageBuilding(w, target, 2, -1)
  assert.deepEqual([target.damage, target.attacker], [-32762, 2])
  const other = { ...target, x: 0x4000, y: 0x5000 }
  damageBuilding(w, other, 1, 1)
  assert.equal(w.attackCell, 0x9034)
  assert.equal(other.attacker, 1)

  for (const [levelFlags2, flags3] of [[0x4000000, 0], [0, 128]]) {
    const blocked = { ...target, flags3 }, disabled = { ...w, levelFlags2, attackAlert: 0, attackCell: 0 }
    damageBuildingByPerson(disabled, blocked, { model: 3, tribe: 3 })
    assert.deepEqual(blocked, { ...target, flags3 })
    assert.equal(disabled.attackAlert, 0)
  }
  const enemy = { ...target, tribe: 2 }, enemyWorld = { ...w, attackAlert: 0, attackCell: 0 }
  damageBuilding(enemyWorld, enemy, 1, 0)
  assert.equal(enemy.damage, target.damage + 1)
  assert.equal(enemyWorld.attackAlert, 0)
})

test('00492920 opcode 1085 writes signed native height from an authored coarse marker outside viewport', () => {
  const markerIndex = 1, destination = 7, level = 16
  const packed = missionData(level).level.markers[markerIndex]
  assert.equal(packed, 0x2eca)
  const nativeHeights = new Int16Array(128 * 128).fill(112)
  nativeHeights[23 * 128 + 101] = -234
  const variables = Array(64).fill(99)
  const w = { outcome: { level }, land: { heights: nativeHeights }, terrain: Array(97 * 97).fill(3), ai: { variables } }
  const script = { fields: [[0, markerIndex], [2, destination]] }
  campaignCommand(w, 1085, [0, 1], script)
  assert.equal(variables[destination], -234)
  assert.equal(variables.filter(v => v === 99).length, 63)
  assert.deepEqual(nativeCellPoint(packed | 0x0101), nativeCellPoint(packed))
})

test('004d4da0 standing idle gesture consumes only qualifying draws and stores a signed animation countdown', () => {
  const model = 2, expectedFirst = 2778128446
  const nativeDraw = seed => {
    const next = (BigInt(seed) * 0x24a1n + 0x24dfn) & 0xffffffffn
    return Number((next >> 13n | next << 19n) & 0xffffffffn)
  }
  const seed = [...Array(4096).keys()].find(i => nativeDraw(i) % 8 === 0)
  assert.equal(typeof seed, 'number')
  const first = nativeDraw(seed), second = nativeDraw(first)
  const chosen = rules.personAnimationObjects[(21 + (second % 3)) * 9 + model]
  const person = object => ({ object, draw: 0, model, flags2: 0, flags4: 0, cargo: 0, slowTurn: 3 })
  const animations = []
  const animate = (p, object) => { animations.push(object); p.object = object }
  const hit = person(48), rng = { randomState: seed }
  stepPersonIdleGesture(rng, hit, 8, animate, object => {
    assert.equal(object, chosen)
    return 130
  })
  assert.equal(rng.randomState, second)
  assert.deepEqual(animations, [chosen])
  assert.equal(hit.slowTurn, -126)

  const missSeed = [...Array(4096).keys()].find(i => nativeDraw(i) % 8 !== 0)
  const miss = person(80), missRng = { randomState: missSeed }
  stepPersonIdleGesture(missRng, miss, 8, animate, () => assert.fail('A missed draw must not set a duration'))
  assert.equal(missRng.randomState, nativeDraw(missSeed))
  assert.equal(miss.slowTurn, 3)
  assert.deepEqual(animations, [chosen])
  const moving = person(49), movingRng = { randomState: expectedFirst }
  moving.cargo = 1
  stepPersonIdleGesture(movingRng, moving, 8, animate, () => assert.fail('Nonstanding objects must not sample frames'))
  assert.equal(movingRng.randomState, expectedFirst)
  assert.equal(moving.object, rules.personAnimationObjects[4 * 9 + model])
})
