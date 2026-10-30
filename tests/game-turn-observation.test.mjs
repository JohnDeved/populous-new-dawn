import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { advanceGame, observeGameTurns } from '../app/game-clock.ts'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createSpySourceFixture } from '../scripts/tutorial-browser/spy-source-fixture.mjs'

const clock = () => ({ animationTime: 0, animationFrame: 0 })

test('opt-in diagnostics preserve complete gameplay, RNG, saves, clocks and production callbacks at ordinary and catch-up cadence', () => {
  for (const dt of [1 / 24, 1 / 12, 1 / 4]) {
    let baseline
    for (const mode of ['absent', 'present', 'throwing', 'unsubscribed', 'failure-throws', 'unsubscribe-then-throw']) {
      const world = createWorld(), timing = clock(), production = [], visits = [], failures = [], survivor = []
      const beforeTurn = () => production.push(['before', world.turn])
      const afterTurn = () => production.push(['after', world.turn])
      timing.beforeTurn = beforeTurn; timing.afterTurn = afterTurn
      let stop = () => {}, stopSurvivor = () => {}
      if (mode !== 'absent') {
        stop = observeGameTurns(timing, () => {
          visits.push(world.turn)
          assert.deepEqual(production.at(-1), ['after', world.turn])
          if (mode === 'unsubscribe-then-throw') stop()
          if (['throwing', 'failure-throws', 'unsubscribe-then-throw'].includes(mode)) throw Error('diagnostic-only')
        }, error => {
          failures.push(String(error))
          if (mode === 'failure-throws') throw Error('failure reporter')
        })
        stopSurvivor = observeGameTurns(timing, () => survivor.push(world.turn), () => assert.fail('survivor cannot fail'))
      }
      if (mode === 'unsubscribed') { stop(); stop() }
      for (let n = 0; n < Math.round(1 / dt); n++) advanceGame(world, timing, dt)
      stop(); stopSurvivor()
      const visitsBeforeStop = [...visits], survivorBeforeStop = [...survivor]
      advanceGame(world, timing, 1 / 4)
      assert.deepEqual(visits, visitsBeforeStop, 'unsubscription is terminal')
      assert.deepEqual(survivor, survivorBeforeStop)
      assert.equal(timing.beforeTurn, beforeTurn); assert.equal(timing.afterTurn, afterTurn)
      assert.equal(world.turn, 15)
      const result = { world, save: checkpointCodec(world), production,
        animationTime: timing.animationTime, animationFrame: timing.animationFrame }
      baseline ??= result
      assert.deepEqual(result, baseline, `${dt}: ${mode} cannot alter production`)
      assert.equal(visits.length, mode === 'present' ? 12 : ['absent', 'unsubscribed'].includes(mode) ? 0 : 1)
      assert.equal(failures.length, ['throwing', 'failure-throws', 'unsubscribe-then-throw'].includes(mode) ? 1 : 0)
      if (mode !== 'absent') assert.deepEqual(survivor, Array.from({ length: 12 }, (_, i) => i + 1))
    }
  }
})

test('real Spy pending entry remains witnessed when two logical visits share one rendered catch-up boundary', async () => {
  const fixture = await createSpySourceFixture('a'.repeat(40)),
    world = checkpointCodec(fixture.transfer, true).world,
    { loadSceneFixture } = await import('./support/bloodlust-scene.mjs'), api = await loadSceneFixture(),
    spy = world.units.find(unit => unit.id === fixture.spyId), timing = clock()
  world.paused = false
  api.select(world, 'spy')
  assert.equal(api.disguiseSelectedSpies(world, 1), true)
  for (let n = 0; spy.native?.disguise !== 0x40 && n < 100; n++) api.advanceGame(world, timing, 1 / 12)
  assert.equal(spy.native.disguise, 0x40)
  assert.equal(api.command(world, world.buildings.find(b => b.id === fixture.targetId)), true)
  for (let n = 0; !(spy.native.substate === 1 && spy.native.timer === 1) && n < 180; n++)
    api.advanceGame(world, timing, 1 / 12)
  assert.equal(spy.native.substate, 1); assert.equal(spy.native.timer, 1)
  const before = world.turn, plain = structuredClone(world), plainClock = { ...timing }, turns = []
  const stop = observeGameTurns(timing, () => turns.push({ turn: world.turn, substate: spy.native.substate,
    timer: spy.native.timer, armed: !!(spy.native.flags2 & 0x40000000), object: spy.native.object, f2: spy.native.f2 }),
  error => { throw error })
  api.advanceGame(world, timing, 1 / 6)
  api.advanceGame(plain, plainClock, 1 / 6)
  stop()
  assert.deepEqual(world, plain, 'observation preserves every live and saved field, including RNG')
  assert.deepEqual(timing, plainClock)
  assert.equal(turns.length, 2)
  assert.deepEqual(turns[0], { turn: before + 1, substate: 2, timer: 0, armed: true, object: 48, f2: turns[0].f2 })
  assert.deepEqual(turns[1], { turn: before + 2, substate: 2, timer: 23, armed: false, object: 136, f2: 0 })
  assert.equal(spy.native.object, 136, 'one end-of-frame read cannot see the prior pending-entry visit')
})
