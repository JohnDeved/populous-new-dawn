import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { computerSpellAllowed, registerSpellCooldown, stepComputerCastCooldown } from '../app/spell-casting.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

for (const population of [11, 73, 74])
  test(`M7 original usage-limit EVERY255 offset132 at population${population}`, () => {
    const w = createWorld(7)
    while (w.units.filter(u => u.team === 'yellow').length < population)
      addUnit(w, 'yellow', 'brave', { x: 0, z: 0 })
    const intervals = w.castingTribes[2].spells.map(s => s.interval)
    assert.equal(w.ai.flags & 0x40000, 0)
    for (const turn of [121, 122, 123, 377, 378, 379]) {
      w.ai.flags &= ~0x40000
      w.turn = turn
      campaignRules(w)
      assert.equal(!!(w.ai.flags & 0x40000), turn === 122 || turn === 378)
      assert.deepEqual(w.castingTribes[2].spells.map(s => s.interval), intervals,
        'bounded projection must not enable excluded model2..16 interval commands')
    }
  })

test('M7 authored flag enables Convert usage accounting and the unchanged64-call recovery', () => {
  const w = createWorld(7), casting = w.castingTribes[2], spell = casting.spells[17]
  w.turn = 122
  campaignRules(w)
  assert.equal(w.ai.flags & 0x40000, 0x40000)
  assert.equal(spell.interval, 1)
  const limit = rules.spellCharging[17].normalLimit
  assert.equal(limit, 4)
  for (let n = 0; n < limit; n++) {
    assert.equal(computerSpellAllowed(casting, w.ai.flags, 0, 17), true)
    registerSpellCooldown(casting, 1, w.ai.flags, 0, 0, 17)
  }
  assert.deepEqual([spell.used, spell.remaining], [4, 64])
  assert.equal(computerSpellAllowed(casting, w.ai.flags, 0, 17), false)
  for (let n = 0; n < 63; n++) stepComputerCastCooldown(casting, w.ai.flags)
  assert.deepEqual([spell.used, spell.remaining], [4, 1])
  assert.equal(computerSpellAllowed(casting, w.ai.flags, 0, 17), false)
  stepComputerCastCooldown(casting, w.ai.flags)
  assert.deepEqual([spell.used, spell.remaining], [3, 64])
  assert.equal(computerSpellAllowed(casting, w.ai.flags, 0, 17), true)
})
