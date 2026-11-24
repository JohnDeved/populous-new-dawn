import assert from 'node:assert/strict'
import test from 'node:test'
import rules from '../app/original-rules.json' with { type: 'json' }
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerSpells } from '../app/computer-runtime.ts'
import { combatPerson } from '../app/live-combat.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { spiralCell } from '../app/native-math.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import { createWorld } from '../app/world-initialization.ts'
import { addUnit } from '../app/world-state.ts'

const tribe = 1
const model = 5 // Swarm supplied by an ordinary general spell entry.
const entryMana = 1234
const bare = rules.spellCharging[model].cost + entryMana
const spellModels = [3, 0, 4, 8] // Zero is skipped; the fourth slot is not read.
const reserve = rules.spellCharging[3].cost + rules.spellCharging[4].cost

function generalTurn(owner, type, mana, spells = spellModels) {
  const w = createWorld(1)
  const u = w.units.find(unit => unit.team === 'red' && unit.kind === 'shaman')
  w.units = [u]
  u.native ??= createLivePerson(w, u)
  registerLivePerson(w, u.native)
  Object.assign(u.native, { computerAssignment: owner, state: 1, flags2: 0, flags4: 0 })
  u.casting = null
  w.turn = 16 // General dispatch runs; shoreline cadence does not.
  const ai = w.campaignAIs[tribe]
  ai.flags = 0
  ai.states = 0
  ai.attributes[32] = 0
  for (const entry of ai.spellEntries) entry.model = 0
  ai.spellEntries[0] = { model, mana: entryMana, range: 0, people: 1, mode: 0 }
  // The native reserve helper tests the owner slot's type, not its active bit.
  Object.assign(ai.tasks[1], { type, flags: 0, spells })
  w.manaTribes[tribe].mana = mana
  w.manaWorld.spells[tribe].stocks[model] = 0
  w.manaWorld.spells[tribe].available |= 1 << model
  Object.assign(w.castingTribes[tribe], { aiCooldown: 0, cooldown: 0 })

  const p = combatPerson(u)
  const origin = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  const cell = spiralCell(origin, 1, 0)
  addUnit(w, 'blue', 'warrior', nativeCellPoint(cell))

  const before = w.spellCasts[tribe][model]
  withCampaignTribe(w, tribe, () => stepComputerSpells(w, tribe))
  return {
    cast: w.spellCasts[tribe][model] - before,
    caster: u.id,
    projectiles: w.projectiles,
    cursor: w.spellScans[tribe].cursor,
  }
}

test('general AI spell readiness includes the owned raid reserve, with equality admitted', () => {
  const below = generalTurn(2, 20, bare + reserve - 1)
  const equal = generalTurn(2, 20, bare + reserve)
  assert.deepEqual([below.cast, below.cursor, below.projectiles.length], [0, 0, 0])
  assert.equal(equal.cast, 1)
  assert.equal(equal.cursor, 80)
  assert.deepEqual(
    equal.projectiles.map(({ spell, caster }) => [spell, caster]),
    [['swarm', equal.caster]]
  )
})

test('general AI spell readiness counts duplicate nonzero raid slots', () => {
  const repeated = [3, 3, 0]
  const threshold = bare + 2 * rules.spellCharging[3].cost
  assert.equal(generalTurn(2, 20, threshold - 1, repeated).cast, 0)
  assert.equal(generalTurn(2, 20, threshold, repeated).cast, 1)
})

test('general AI spell readiness does not reserve unowned or non-raid slots', () => {
  assert.equal(generalTurn(0, 20, bare).cast, 1)
  assert.equal(generalTurn(3, 20, bare).cast, 1)
  assert.equal(generalTurn(2, 8, bare).cast, 1)
  assert.equal(generalTurn(0, 20, bare - 1).cast, 0)
})
