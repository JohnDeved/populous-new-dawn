import test from 'node:test'
import assert from 'node:assert/strict'
import { createSpySourceFixture } from '../scripts/tutorial-browser/spy-source-fixture.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
const api = await loadSceneFixture(), fixture = await createSpySourceFixture('a'.repeat(40))
const { nativePosition } = await import('../app/world-terrain-runtime.ts')
const { breedingWork } = await import('../app/world-state.ts')

function run(accelerated, disguiseTurn = 170, commandTurn = 251) {
  const w = checkpointCodec(fixture.transfer, true).world,
    spy = w.units.find(u => u.id === fixture.spyId), target = w.buildings.find(b => b.id === fixture.targetId),
    clock = { animationTime: 0, animationFrame: 0 }, advance = () => api.advanceGame(w, clock, 1 / 12), rows = []
  assert.equal(target.timer, 0)
  // Historical setup reproduction only; never applied after browser startup.
  if (accelerated) target.timer = breedingWork(w, target) - 54
  w.paused = false
  while (w.turn < disguiseTurn) advance()
  api.select(w, 'spy'); assert.equal(api.disguiseSelectedSpies(w, 1), true)
  for (let i = 0; i < 100 && spy.native?.disguise !== 64; i++) advance()
  assert.equal(spy.native?.disguise, 64)
  while (w.turn < commandTurn) advance()
  assert.equal(api.command(w, target), true)
  for (let i = 0; i < 100; i++) {
    const p = spy.native ?? spy.fight?.motion
    rows.push({ turn: w.turn, hp: spy.hp, native: !!spy.native, fight: structuredClone(spy.fight),
      person: structuredClone(p), actors: w.units.filter(u => u.team === 'red' && u.hp > 0 && u.inside === null)
        .map(u => ({ id: u.id, kind: u.kind, ...nativePosition(w, u) })) })
    if (!spy.native || spy.native.object === 136) break
    advance()
  }
  return { w, spy, target, rows }
}

test('historical accelerated hut birth reproduces reveal283 and live combat handoff284', () => {
  const { rows } = run(true), reveal = rows.find(r => r.turn === 283), handoff = rows.find(r => r.turn === 284)
  assert.equal(reveal.person.disguise, 0); assert.equal(reveal.person.timer, 9)
  const detector = reveal.actors.find(u => u.id === 2178)
  assert.equal(detector.kind, 'brave')
  for (const axis of ['x', 'y']) {
    const a = (detector[axis] & 65535) >> 9, b = (reveal.person[axis] & 65535) >> 9
    assert.ok(Math.abs(((a - b + 64) & 127) - 64) <= 1)
  }
  assert.equal(handoff.native, false); assert.equal(handoff.hp, 30)
  assert.equal(handoff.fight.opponent, detector.id); assert.equal(handoff.fight.motion.state, 29)
  assert.equal(handoff.fight.motion.id, fixture.spyId)
})

for (const [disguiseTurn, commandTurn] of [[170, 251], [300, 400]]) {
  test(`zero-work supplied hut preserves real sabotage after delayed ordinary turns ${disguiseTurn}/${commandTurn}`, () => {
    const { spy, rows } = run(false, disguiseTurn, commandTurn)
    assert.equal(spy.native.object, 136); assert.equal(spy.native.disguise, 64); assert.equal(spy.hp, 30)
    assert.ok(rows.some(r => r.person.substate === 1))
    for (const row of rows.filter(r => r.person.substate === 1)) {
      const nearby = row.actors.filter(u => ['x', 'y'].every(axis => {
        const a = (u[axis] & 65535) >> 9, b = (row.person[axis] & 65535) >> 9
        return Math.abs(((a - b + 64) & 127) - 64) <= 1
      }))
      assert.deepEqual(nearby, [], 'no disguise-tribe detector in the actual sabotage cells')
    }
    assert.equal(fixture.receipt.targetBreeding.initialWork, 0)
    assert.ok(fixture.receipt.targetBreeding.helperSeededWork > 0)
  })
}
