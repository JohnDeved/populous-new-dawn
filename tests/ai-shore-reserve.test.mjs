import assert from 'node:assert/strict'
import test from 'node:test'
import rules from '../app/original-rules.json' with { type: 'json' }
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerSpells } from '../app/computer-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { combatPerson } from '../app/live-combat.ts'
import { spiralCell } from '../app/native-math.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { createWorld } from '../app/world-initialization.ts'
import { nativeCellIndex } from '../app/world-terrain-runtime.ts'
import { addUnit } from '../app/world-state.ts'

const tribe = 1
const blast = rules.spellCharging[2].cost
const spellModels = [3, 0, 4]
const reserve = rules.spellCharging[3].cost + rules.spellCharging[4].cost

function shoreTurn(
  task = { type: 20, flags: 1, spells: spellModels },
  owner = 2,
  mana = blast + 50000 + reserve
) {
  const w = createWorld(1)
  const u = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
  w.units = [u] // controlled native-rule scenario atop the live stock World
  u.native ??= createLivePerson(w, u)
  Object.assign(u.native, { computerAssignment: owner, state: 1, flags2: 0, flags4: 0 })
  u.casting = null
  w.turn = 24 // (tribe + turn + 7) & 31 === 0
  w.campaignAIs[tribe].spellEntries = []
  Object.assign(w.campaignAIs[tribe].tasks[1], task)
  w.manaTribes[tribe].mana = mana
  w.castingTribes[tribe].cooldown = 0
  w.castingTribes[tribe].aiCooldown = 0
  const caster = combatPerson(u)
  const origin = ((caster.x >>> 8) & 254) | (caster.y & 0xfe00)
  const cell = spiralCell(origin, 24, 0)
  const adjacent = (cell & 255) | ((((cell >>> 8) + 2) & 255) << 8)
  w.land.categories.fill(rules.terrainCategoryFlags.findIndex(flags => flags & 1))
  w.land.categories[nativeCellIndex(adjacent)] = rules.terrainCategoryFlags.findIndex(
    flags => (flags & 60) && !(flags & 1)
  )
  addUnit(w, 'blue', 'warrior',
    browserPosition({ x: ((cell & 254) << 8) + 256, y: (cell & 0xfe00) + 256 })
  )
  withCampaignTribe(w, tribe, () => stepComputerSpells(w, tribe))
  return w.projectiles.filter(p => p.spell === 'blast').length
}

test('shoreline Blast preserves the shaman’s own type-20 raid mana reserve', () => {
  assert.equal(shoreTurn(), 0)
  assert.equal(shoreTurn(undefined, 2, blast + 50000 + reserve + 1), 1)
})

test('unassigned casters and non-raid task assignments do not reserve those spells', () => {
  assert.equal(shoreTurn(undefined, 0, blast + 50001), 1)
  assert.equal(shoreTurn(undefined, 3, blast + 50001), 1)
  assert.equal(shoreTurn({ type: 8, flags: 1, spells: spellModels }, 2, blast + 50001), 1)
})
