import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'

const spell = id => SPELLS.find(s => s.id === id)
const plain = { ctrlKey: false, shiftKey: false }
const focus = { ctrlKey: true, shiftKey: false }
const advance = (world, turns) => {
  for (let i = 0; i < turns; i++) tick(world, 1 / 12)
}

test('authored Mission 10 spell controls pause, resume and restore the live charging mask', () => {
  const w = createWorld(10), lightning = spell('lightning'), swarm = spell('swarm')
  const tribe = w.manaTribes[0], stock = w.manaWorld.spells[0]
  const progress = model => tribe.spellProgress[model]
  advance(w, 120)
  assert.equal(stock.disabled, 0)
  assert.equal(rightClickSpellCharging(w, spell('flatten'), plain), false)
  assert.equal(stock.disabled, 0)

  const beforeLightning = progress(3), beforeSwarm = progress(5)
  assert.equal(rightClickSpellCharging(w, lightning, plain), true)
  assert.equal(stock.disabled, 4)
  advance(w, 30)
  assert.equal(progress(3), beforeLightning, 'paused Lightning must not accrue')
  assert.ok(progress(5) > beforeSwarm, 'unrelated Swarm must continue charging')
  assert.equal(rightClickSpellCharging(w, lightning, plain), true)
  assert.equal(stock.disabled, 0, 'the second click clears the Lightning bit')
  advance(w, 30)
  assert.ok(progress(3) > beforeLightning, 're-enabled Lightning must accrue')

  assert.equal(rightClickSpellCharging(w, swarm, plain), true)
  assert.equal(stock.disabled, 16)
  const [pausedSwarm, unfocusedInvisibility, focusedLightning] = [progress(5), progress(6), progress(3)]
  assert.equal(rightClickSpellCharging(w, lightning, focus), true)
  assert.equal(tribe.chargeFocusModel, 3)
  assert.equal(tribe.chargeFocusMask & 1, 1)
  assert.equal(stock.disabled & (4 | 16 | 32), 16 | 32)
  advance(w, 30)
  assert.ok(progress(3) > focusedLightning)
  assert.equal(progress(5), pausedSwarm)
  assert.equal(progress(6), unfocusedInvisibility)
  assert.equal(rightClickSpellCharging(w, lightning, focus), true)
  assert.equal(stock.disabled, 16, 'only the pre-existing Swarm pause remains')
  assert.equal(tribe.chargeFocusMask & 1, 0)
  assert.equal(tribe.chargeFocusModel, 0)
  advance(w, 30)
  assert.equal(progress(5), pausedSwarm)
  assert.ok(progress(6) > unfocusedInvisibility)
})
