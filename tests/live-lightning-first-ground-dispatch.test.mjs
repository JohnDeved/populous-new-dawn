import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, createWorld, tick } from '../app/model.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'

test('ordinary earned Mission 6 Lightning dispatches the target fire and wave on its first controller turn', () => {
  const w = createWorld(6)
  const step = () => tick(w, 1 / 12)
  const to = (ready, deadline) => {
    while (!ready() && w.turn < deadline && w.status === 'playing') step()
    assert.ok(ready(), `not reached by turn ${deadline}`)
  }
  assert.equal(w.shots.lightning, 0)
  const spell = SPELLS.find(s => s.id === 'lightning')
  assert.ok(rightClickSpellCharging(w, spell, { ctrlKey: true, shiftKey: false }))
  to(() => w.shots.lightning === 1, 2988)
  assert.equal(w.turn, 2988)
  assert.ok(cast(w, 'lightning', { x: 59, z: -61 }))
  assert.equal(w.shots.lightning, 0)
  const bolt = () => w.effects.find(f => f.lightning?.tribe === 0)?.lightning
  to(() => bolt() !== undefined, 2996)
  assert.equal(w.turn, 2996)
  const target = { x: 17152, y: 13568, h: 223 }
  const groundEffects = () =>
    w.effects.filter(f =>
      [f.fire, f.wave].some(state => state?.x === target.x && state?.y === target.y)
    )
  assert.deepEqual(bolt().target, target)
  assert.equal(bolt().turn, -1)
  assert.deepEqual(groundEffects(), [])
  step()
  assert.equal(bolt().turn, 0)
  assert.deepEqual(groundEffects(), [])
  step()
  assert.equal(w.turn, 2998)
  assert.equal(bolt().turn, 1)
  assert.equal(bolt().segments.length, 8, 'the controller draws paths independently of ground dispatch')
  const dispatched = groundEffects()
  assert.deepEqual(dispatched.map(f => f.kind), ['fire', 'blastWave'])
  const [{ fire }, { wave }] = dispatched
  assert.deepEqual(
    { x: fire.x, y: fire.y, h: fire.h, remaining: fire.remaining },
    { ...target, remaining: 24 }
  )
  assert.deepEqual(
    {
      x: wave.x,
      y: wave.y,
      h: wave.h,
      tribe: wave.tribe,
      remaining: wave.remaining,
      radius: wave.radius,
      maxRadius: wave.maxRadius,
      spread: wave.spread,
      horizontal: wave.horizontal,
      vertical: wave.vertical,
      scatter: wave.scatter,
    },
    {
      ...target,
      tribe: 0,
      remaining: 3,
      radius: 2,
      maxRadius: 5,
      spread: 2,
      horizontal: 140,
      vertical: 98,
      scatter: true,
    }
  )
  step()
  assert.equal(bolt().turn, 2)
  assert.deepEqual(groundEffects().map(f => f.id), dispatched.map(f => f.id))
})
