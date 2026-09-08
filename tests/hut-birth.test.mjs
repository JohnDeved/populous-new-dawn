import test from 'node:test'
import assert from 'node:assert/strict'
import manifest from '../decomp/exports.json' with { type: 'json' }
import fixtures from './fixtures/hut-birth.json' with { type: 'json' }
import { stepHutBirth, hutBirthPoints } from '../app/hut-birth.ts'
import { createWorld, breedingWork, tick } from '../app/model.ts'

test('hut birth clocks and destinations match captured original calls', () => {
  assert.equal(fixtures.executableSha256, manifest.executableSha256)
  fixtures.cases.forEach((c, i) => {
    const b = { counter: c.counter, timer: c.timer, birthPending: c.birthPending }
    const born = stepHutBirth(b, c.occupants, c.allowed, c.cost)
    assert.deepEqual({ timer: b.timer, birthPending: b.birthPending, born,
      points: born ? hutBirthPoints(c.pose, () => c.neighbor) : null,
      cues: born && c.tribe === 0 ? [40] : [] }, fixtures.expected[i], `native case ${i}`)
  })
})

test('live newborns leave the hut and keep native birth feedback and gates', () => {
  const w = createWorld(), b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  assert.equal(b.timer, breedingWork(w, b) - 54)
  for (const u of w.units) if (u.team === 'blue') u.guard = true
  const old = new Set(w.units.map(u => u.id))
  b.timer = breedingWork(w, b) - 2; b.counter = 2
  tick(w, 1/12)
  assert.equal(w.units.filter(u => !old.has(u.id)).length, 0, 'off-phase world turns cannot breed')
  w.manaWorld.gameFlags |= 32
  tick(w, 1/12)
  assert.equal(w.units.filter(u => !old.has(u.id)).length, 0, 'native building-work gate')
  w.manaWorld.gameFlags &= ~32; b.counter = 3
  tick(w, 1/12)
  const baby = w.units.find(u => !old.has(u.id)), flash = w.effects.find(f => f.kind === 'birth')
  assert.ok(baby); assert.equal(baby.inside, null); assert.equal(baby.work, null)
  assert.ok(baby.path.length, 'newborn receives an exit path')
  assert.ok(w.sounds.some(s => s.cue === 40))
  assert.equal(flash.animation.object, 1441); assert.equal(flash.animation.draw, 41)
  assert.equal(flash.turnsRemaining, 16); assert.equal(flash.duration, 16/12)
  const origin = { x: baby.x, z: baby.z }
  baby.guard = true
  for (let i=0; i<16; i++) tick(w, 1/12)
  assert.ok(Math.hypot(baby.x-origin.x,baby.z-origin.z) > .1, 'newborn visibly walks out')
  assert.ok(!w.effects.includes(flash), 'flash expires after sixteen simulation turns')
  assert.equal(b.birthPending, false)
})
