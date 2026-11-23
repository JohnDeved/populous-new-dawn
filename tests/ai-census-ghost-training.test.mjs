import assert from 'node:assert/strict'
import test from 'node:test'
import rules from '../app/original-rules.json' with { type: 'json' }
import { campaignPersonCount, withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerSpells } from '../app/computer-runtime.ts'
import { stepLiveTraining } from '../app/live-building-entry.ts'
import { combatPerson } from '../app/live-combat.ts'
import { addBuilding, addUnit, createWorld } from '../app/model.ts'
import { spiralCell } from '../app/native-math.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { nativeCellIndex } from '../app/world-terrain-runtime.ts'

const tribe = 1
const blastCost = rules.spellCharging[2].cost

function trainAndScan(ghost, mana) {
  const w = createWorld(1)
  const shaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
  w.units = [shaman]
  for (let i = 0; i < 8; i++)
    addUnit(w, 'red', 'brave', { x: shaman.x + 2, z: shaman.z })
  const camp = addBuilding(w, 'red', 'camp', { x: shaman.x + 4, z: shaman.z })
  camp.timer = 65535
  const trainee = addUnit(w, 'red', 'brave', { x: camp.x, z: camp.z })
  if (ghost) trainee.ghost = true
  trainee.inside = trainee.work = camp.id
  const before = campaignPersonCount(w, tribe)
  stepLiveTraining(w, camp)
  const replacements = w.units.filter(u => u.team === 'red' && u.kind === 'warrior' && u.hp > 0)
  assert.equal(replacements.length, 1)
  const [replacement] = replacements
  assert.equal(trainee.hp, 0, 'training retires the original')
  assert.notEqual(replacement.id, trainee.id)
  assert.ok(replacement.native, 'real training publishes the replacement native record')
  assert.equal(Boolean(replacement.native.flags4 & 0x800), ghost)

  w.turn = 24 // (tribe + turn + 7) & 31 === 0
  w.campaignAIs[tribe].spellEntries = []
  w.manaTribes[tribe].mana = mana
  w.castingTribes[tribe].cooldown = w.castingTribes[tribe].aiCooldown = 0
  const caster = combatPerson(shaman)
  const origin = ((caster.x >>> 8) & 254) | (caster.y & 0xfe00)
  const cell = spiralCell(origin, 24, 0)
  const adjacent = (cell & 255) | ((((cell >>> 8) + 2) & 255) << 8)
  w.land.categories.fill(rules.terrainCategoryFlags.findIndex(flags => flags & 1))
  w.land.categories[nativeCellIndex(adjacent)] = rules.terrainCategoryFlags.findIndex(
    flags => (flags & 60) && !(flags & 1)
  )
  addUnit(
    w,
    'blue',
    'warrior',
    browserPosition({ x: ((cell & 254) << 8) + 256, y: (cell & 0xfe00) + 256 })
  )
  withCampaignTribe(w, tribe, () => stepComputerSpells(w, tribe))
  return {
    before,
    after: campaignPersonCount(w, tribe),
    ghost: Boolean(replacement.ghost),
    blasts: w.projectiles.filter(p => p.spell === 'blast').length,
  }
}

test('a trained Ghost Warrior remains excluded from the live census and retains the Blast premium', () => {
  assert.deepEqual(trainAndScan(true, blastCost + 50000), {
    before: 9,
    after: 9,
    ghost: true,
    blasts: 0,
  })
  assert.deepEqual(trainAndScan(true, blastCost + 50001), {
    before: 9,
    after: 9,
    ghost: true,
    blasts: 1,
  })
})

test('ordinary training at the same threshold retains population and ordinary Blast cost', () => {
  assert.deepEqual(trainAndScan(false, blastCost), {
    before: 10,
    after: 10,
    ghost: false,
    blasts: 0,
  })
  assert.deepEqual(trainAndScan(false, blastCost + 1), {
    before: 10,
    after: 10,
    ghost: false,
    blasts: 1,
  })
})
