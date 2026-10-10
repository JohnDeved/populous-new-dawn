import assert from 'node:assert/strict'
import test from 'node:test'
import { tornadoWoodImpact, attachTornadoBuildingObservation } from '../scripts/local-render/tornado-building-witness.mjs'

function impact() {
  const before = { turn: 10, competing: [], building: { id: 7, x: 1, z: -1,
    hp: 170, work: 300, life: 300, stage: 4, present: true } }
  const after = structuredClone(before)
  after.turn++
  after.building.work = 200
  after.building.stage = 2
  after.tornado = { id: 21, x: 2304, y: -1792, phase: 0, tribe: 0 }
  const logs = [{ id: 22, x: 1, z: -1, model: 11, logs: 1 }]
  return { before, after, logs }
}

test('Tornado witness requires owned effect, cell, work, log and competing-owner exclusion', () => {
  const positive = impact()
  assert.equal(tornadoWoodImpact(positive.before, positive.after, positive.logs).log.id, 22)
  for (const alter of [
    ({ after }) => { after.tornado = null },
    ({ after }) => { after.tornado.x += 1024 },
    ({ after }) => { after.tornado.phase = 1 },
    ({ after }) => { after.building.work = 100 },
    ({ after }) => { after.building.stage = 3 },
    ({ before }) => { before.competing.push('worker:5') },
    ({ after }) => { after.competing.push('effect:31') },
    ({ logs }) => { logs[0].x++ },
    ({ logs }) => { logs[0].logs = 2 },
    ({ logs }) => { logs.push({ ...logs[0], id: 23 }) },
  ]) {
    const sample = impact()
    alter(sample)
    assert.throws(() => tornadoWoodImpact(sample.before, sample.after, sample.logs))
  }
  const retired = impact()
  retired.before.building.work = 100
  retired.after.building.work = 0
  retired.after.building.stage = 0
  assert.throws(() => tornadoWoodImpact(retired.before, retired.after, retired.logs))
  retired.after.building.present = false
  assert.ok(tornadoWoodImpact(retired.before, retired.after, retired.logs))
})

test('Tornado witness preserves callback receiver, arguments, result and owned cleanup', () => {
  const building = { id: 7, kind: 'hut', level: 1, x: 1, z: -1, hp: 170, progress: 1 }
  const shaman = { id: 8, kind: 'shaman', hp: 100 }
  const projectile = { id: 20, spell: 'tornado', caster: 8 }
  const world = { turn: 0, buildings: [building], units: [shaman], projectiles: [projectile],
    effects: [], trees: [] }
  const calls = []
  const clock = {
    beforeTurn(...args) { calls.push(['before', this === clock, args]); return 17 },
    afterTurn(...args) { calls.push(['after', this === clock, args]); return 18 },
  }
  const before = clock.beforeTurn, after = clock.afterTurn
  const scene = { world, gameClock: clock }
  const observer = attachTornadoBuildingObservation(scene, { getWorld: () => world },
    { targetId: 7, shamanId: 8, projectileId: 20 })
  assert.equal(clock.beforeTurn('a'), 17)
  world.turn++
  assert.equal(clock.afterTurn('b'), 18)
  assert.deepEqual(calls, [['before', true, ['a']], ['after', true, ['b']]])
  assert.deepEqual(observer.status().errors, [])
  assert.equal(observer.status().visits, 1)
  const evidence = observer.finish()
  assert.equal(evidence.restored, true)
  assert.equal(clock.beforeTurn, before)
  assert.equal(clock.afterTurn, after)
  assert.equal(observer.finish(), evidence)
})

test('Tornado witness retains ownership failures without replacing foreign callbacks', () => {
  const world = { turn: 0, buildings: [{ id: 7, kind: 'hut', level: 1, x: 1, z: -1,
    hp: 170, progress: 1 }], units: [{ id: 8, hp: 100 }],
    projectiles: [{ id: 20, spell: 'tornado', caster: 8 }], effects: [], trees: [] }
  const clock = { beforeTurn() {}, afterTurn() {} }, scene = { world, gameClock: clock }
  const observer = attachTornadoBuildingObservation(scene, { getWorld: () => world },
    { targetId: 7, shamanId: 8, projectileId: 20 })
  clock.beforeTurn()
  world.turn += 2
  clock.afterTurn()
  assert.match(observer.status().errors[0], /Missing or duplicate turn/)
  const foreign = () => 42
  clock.afterTurn = foreign
  const evidence = observer.finish()
  assert.equal(evidence.restored, false)
  assert.equal(clock.afterTurn, foreign)
  assert.deepEqual(evidence.cleanupErrors, ['afterTurn ownership changed'])
})
