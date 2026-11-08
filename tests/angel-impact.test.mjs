import { retainFixtureUnits } from './level-start-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, cast, tick } from '../app/model.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { createGameStore } from '../app/game-store.ts'

// Supplied flat field, people, spell stock and status durations. The public cast,
// projectile arrival, target selection and timer-eight impact run normally.
function launch({ shield = false, bloodlust = false, immune = false } = {}) {
  const w = createWorld(1, 'scalable')
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  const victim = addUnit(w, 'red', 'brave', { x: 0, z: 0 })
  victim.native = createLivePerson(w, victim)
  victim.native.damageAttacker = 255
  if (shield) {
    victim.shield = 600
    victim.native.flags3 |= 0x8000
  }
  if (bloodlust) {
    victim.bloodlust = 600
    victim.native.flags3 |= 0x80000
  }
  syncLivePersonCells(w)
  w.shots.angel = 1
  assert.equal(cast(w, 'angel', { x: 0, z: 0 }), true)
  assert.equal(w.shots.angel, 0)
  for (let n = 0; n < 120 && !w.effects.some(e => e.angel); n++) tick(w, 1 / 12)
  const angel = w.effects.find(e => e.angel)
  assert.ok(angel)
  assert.equal(w.turn, 8)
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, victim.id)
  assert.deepEqual([angel.angel.phase, angel.angel.timer], ['striking', 28])
  if (immune) w.levelFlags2 |= 0x04000000
  return { w, victim, angel }
}

function impact({ w, angel, victim }) {
  for (let n = 0; n < 19; n++) tick(w, 1 / 12)
  assert.equal(angel.angel.timer, 9)
  assert.equal(victim.hp, 50, 'no early damage before the native timer-eight consumer')
  tick(w, 1 / 12)
  assert.equal(w.turn, 29)
  assert.deepEqual([angel.angel.phase, angel.angel.timer], ['striking', 8])
}

for (const [name, options, hp] of [
  ['ordinary', {}, 0],
  ['Shield', { shield: true }, 0],
  ['Bloodlust', { bloodlust: true }, 43.75],
  ['Shield and Bloodlust', { shield: true, bloodlust: true }, 43.75],
  ['global immunity', { shield: true, bloodlust: true, immune: true }, 50],
]) test(`Angel timer-eight strike preserves native ${name} damage policy`, () => {
  const s = launch(options), person = s.victim.native
  impact(s)
  assert.equal(s.victim.hp, hp)
  assert.equal(person.damageAttacker, options.immune ? 255 : 0)
  assert.equal(s.w.killCredits[0][1], hp === 0 ? 1 : 0)
  assert.equal(s.w.units.includes(s.victim), hp > 0)
  assert.ok(s.w.effects.some(e => e.kind === 'hit'))
  assert.ok(s.w.sounds.some(sound => sound.cue === 0xdc))
  if (options.shield && hp > 0) assert.equal(s.victim.shield, 571)
  if (hp === 0) {
    for (let n = 0; n < 7; n++) tick(s.w, 1 / 12)
    assert.deepEqual([s.angel.angel.phase, s.angel.angel.timer], ['striking', 1])
    assert.equal(s.w.killCredits[0][1], 1, 'cleanup does not repeat kill credit')
    tick(s.w, 1 / 12)
    assert.equal(s.angel.angel.phase, 'seeking')
  }
})

for (const neutral of ['victim', 'attacker']) {
  test(`Angel impact preserves absent attribution for supplied neutral ${neutral}`, () => {
    const s = launch({ shield: true }), person = s.victim.native
    // Terminal-consumer controls after ordinary target selection. This does not
    // assert that native target selection admits a neutral person or owner.
    if (neutral === 'victim') {
      s.victim.team = 'wild'
      person.tribe = -1
    } else s.angel.team = 'wild'
    impact(s)
    assert.equal(s.victim.hp, 0)
    assert.equal(person.damageAttacker, 255)
    assert.ok(s.w.killCredits.every(row => row.every(value => value === 0)))
  })
}

test('Angel Shield impact and recovery continue identically through the checkpoint API', async () => {
  const { w, angel, victim } = launch({ shield: true })
  for (let n = 0; n < 19; n++) tick(w, 1 / 12)
  assert.equal(angel.angel.timer, 9)
  const store = createGameStore()
  Object.assign(store.getWorld(), w)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  for (let n = 0; n < 9; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  }
  assert.equal(w.units.some(u => u.id === victim.id), false)
  assert.equal(w.killCredits[0][1], 1)
  assert.equal(angel.angel.phase, 'seeking')
})
