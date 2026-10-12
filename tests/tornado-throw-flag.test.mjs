import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, createWorld, tick, browserPosition } from '../app/model.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { stepTornadoPerson } from '../app/tornado.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function ordinaryThrow() {
  const w = createWorld(),
    shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    victim = w.units.find(u => u.team === 'red' && u.kind === 'brave')
  w.units = [shaman, victim]
  w.buildings = []
  w.trees = []
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  w.shots.tornado = 1
  assert.ok(cast(w, 'tornado', { x: 0, z: 8 }))
  for (let i = 0; i < 64 && !w.effects.some(f => f.tornado); i++) tick(w, 1 / 12)
  const fx = w.effects.find(f => f.tornado)
  assert.ok(fx)
  // Supply one victim at the moving controller; retain its normal capture clock.
  Object.assign(victim, { ...browserPosition(fx.tornado), native: null, flight: undefined, path: [] })
  let captured
  for (let i = 0; i < 70; i++) {
    tick(w, 1 / 12)
    if (victim.native?.state === 24 && !captured)
      captured = { turn: w.turn, flags3: victim.native.flags3, flags4: victim.native.flags4 }
    if (captured && victim.flight?.velocity.y === 230) return { w, victim, captured }
  }
  assert.fail('ordinary cast must capture and throw without forcing substate or expiry')
}

test('throw marks flags4 and preserves unrelated bits in both words', () => {
  for (const flags3 of [0x40000, 0x80400]) {
    const w = { land: createNativeTerrain(new Int16Array(16384).fill(512)), randomState: 0x12345678 }
    const p = { id: 1, model: 2, state: 24, previousState: 10, substate: 18,
      flags2: 0x4000, flags3, flags4: 0x20000100, stateObject: 9,
      heading: 0, velocity: { x: 0, y: 0, z: 0 }, damageAttacker: 255,
      x: 1000, y: 1000, h: 900 }
    assert.equal(stepTornadoPerson(w, p, undefined, 0), false)
    assert.equal(p.flags3, flags3)
    assert.equal(p.flags4, 0x20000500)
    assert.equal(p.velocity.y, 230)
    assert.equal(w.randomState, 0x32be789b)
  }
})

test('ordinary throw retains airborne ownership and avoids a second first-fall cue', () => {
  const { w, victim, captured } = ordinaryThrow()
  assert.equal(w.turn - captured.turn, 18)
  assert.equal(victim.native.flags3, captured.flags3)
  assert.equal(victim.native.flags4, captured.flags4 | 0x400)
  w.sounds = []
  tick(w, 1 / 12)
  assert.ok(!w.sounds.some(s => s.cue === 0xc4))
  assert.ok(victim.native.flags4 & 0x400)
})

test('a genuinely unmarked falling person still receives its first-fall cue', () => {
  const { w, victim } = ordinaryThrow()
  victim.native.flags4 &= ~0x400
  w.sounds = []
  tick(w, 1 / 12)
  assert.equal(w.sounds.filter(s => s.cue === 0xc4).length, 1)
  assert.ok(victim.native.flags4 & 0x400)
})

test('mid-throw checkpoint retains the flag and exact continuation through landing', () => {
  const { w, victim, captured } = ordinaryThrow()
  const thrownPerson = victim.native
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(restored, w)
  for (let i = 0; i < 400 && (victim.flight || victim.native?.state === 24 || (victim.native?.flags4 ?? 0) & 0x400); i++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, w)
  assert.ok(w.units.includes(victim), 'controlled victim survives the landing')
  assert.ok(!victim.flight, 'normal physics releases flight ownership')
  assert.equal(thrownPerson.flags4 & 0x400, 0)
  assert.equal(thrownPerson.flags3 & 0x400, captured.flags3 & 0x400)
})
