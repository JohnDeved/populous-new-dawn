import assert from 'node:assert/strict'
import test from 'node:test'
import { tornadoWoodImpact, attachTornadoBuildingObservation, assertTornadoBuildingCast, boundedTornadoEvidence } from '../scripts/local-render/tornado-building-witness.mjs'
import { finishTornadoBuildingRun } from '../scripts/local-render/mission2-tornado-building.mjs'
import { createWorld, cast } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { UnitMotion } from '../app/unit-motion.ts'

const expected = { targetId: 1, shamanId: 54, projectileId: 20 }
function fixture(clock = { beforeTurn() {}, afterTurn() {} }) {
  const world = { turn: 0, outcome: { level: 2 },
    buildings: [{ id: 1, kind: 'camp', team: 'green', level: 1, x: 1, z: -1, hp: 260, progress: 1 }],
    units: [{ id: 54, kind: 'shaman', team: 'blue', hp: 100 }],
    projectiles: [{ id: 20, spell: 'tornado', caster: 54 }], effects: [], trees: [] }
  const scene = { world, gameClock: clock }, store = { getWorld: () => world }
  return { world, scene, store, clock }
}

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
  const calls = []
  const clock = {
    beforeTurn(...args) { calls.push(['before', this === clock, args]); return 17 },
    afterTurn(...args) { calls.push(['after', this === clock, args]); return 18 },
  }
  const before = clock.beforeTurn, after = clock.afterTurn
  const { world, scene, store } = fixture(clock)
  const observer = attachTornadoBuildingObservation(scene, store, expected)
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

test('Tornado witness detaches on error and retains foreign callback ownership', () => {
  const { world, clock, scene, store } = fixture()
  const before = clock.beforeTurn, after = clock.afterTurn
  const observer = attachTornadoBuildingObservation(scene, store, expected)
  clock.beforeTurn()
  world.turn += 2
  clock.afterTurn()
  assert.match(observer.status().errors[0], /Missing or duplicate turn/)
  assert.equal(clock.beforeTurn, before)
  assert.equal(clock.afterTurn, after)
  assert.equal(observer.finish().restored, true)
  const second = attachTornadoBuildingObservation(scene, store, expected)
  const foreign = () => 42
  clock.afterTurn = foreign
  const evidence = second.finish()
  assert.equal(evidence.restored, false)
  assert.equal(clock.afterTurn, foreign)
  assert.deepEqual(evidence.cleanupErrors, ['afterTurn ownership changed'])
})

test('Tornado observer forwards original throw identity and rolls back partial installation', () => {
  for (const phase of ['beforeTurn', 'afterTurn']) {
    const failure = new Error(`${phase} original failure`)
    const clock = { beforeTurn() {}, afterTurn() {} }
    clock[phase] = () => { throw failure }
    const original = clock[phase], { scene, store } = fixture(clock)
    const observer = attachTornadoBuildingObservation(scene, store, expected)
    assert.throws(() => clock[phase](), error => error === failure)
    assert.equal(clock[phase], original)
    assert.match(observer.finish().errors[0], /original failure/)
  }
  const failure = new Error('afterTurn install failed')
  const original = { beforeTurn() {}, afterTurn() {} }
  const clock = new Proxy({ ...original }, { set(target, key, value) {
    if (key === 'afterTurn') throw failure
    return Reflect.set(target, key, value)
  } })
  const { scene, store } = fixture(clock)
  assert.throws(() => attachTornadoBuildingObservation(scene, store, expected), error => error === failure)
  assert.equal(clock.beforeTurn, original.beforeTurn)
  assert.equal(clock.afterTurn, original.afterTurn)
})

test('Tornado observer attempts both restorations and stops after the turn cap', () => {
  let rejectRestore = false
  const originals = { beforeTurn() {}, afterTurn() {} }
  const clock = new Proxy({ ...originals }, { defineProperty(target, key, descriptor) {
    if (rejectRestore && key === 'beforeTurn') throw Error('before restore failed')
    return Reflect.defineProperty(target, key, descriptor)
  } })
  const { world, scene, store } = fixture(clock)
  const observer = attachTornadoBuildingObservation(scene, store, expected)
  for (let turn = 0; turn < 320; turn++) { clock.beforeTurn(); world.turn++; clock.afterTurn() }
  assert.equal(observer.status().visits, 320)
  assert.match(observer.status().errors[0], /320-turn/)
  assert.equal(clock.afterTurn, originals.afterTurn)
  clock.beforeTurn(); world.turn++; clock.afterTurn()
  assert.equal(observer.status().visits, 320)
  const second = attachTornadoBuildingObservation(scene, store, expected)
  rejectRestore = true
  const evidence = second.finish()
  assert.equal(evidence.restored, false)
  assert.match(evidence.cleanupErrors[0], /before restore failed/)
  assert.equal(clock.afterTurn, originals.afterTurn)
})

test('Tornado observer rejects wrong and second live effect identities', () => {
  for (const mode of ['wrong-tribe', 'second-effect']) {
    const { world, clock, scene, store } = fixture()
    const observer = attachTornadoBuildingObservation(scene, store, expected)
    clock.beforeTurn()
    const effect = { id: 21, kind: 'tornado', tornado: { tribe: mode === 'wrong-tribe' ? 3 : 0,
      x: 2304, y: -1792, phase: 0, remaining: 200 } }
    world.effects.push(effect)
    world.turn++
    clock.afterTurn()
    if (mode === 'second-effect') {
      clock.beforeTurn()
      world.effects.push({ ...effect, id: 22 })
      world.turn++
      clock.afterTurn()
    }
    assert.ok(observer.status().errors.length > 0, mode)
    assert.equal(observer.finish().restored, true)
  }
})

test('Tornado observer composes actual advanceGame, projectile impact and live building damage', () => {
  const world = createWorld(2)
  const target = world.buildings.find(b => b.id === 1), shaman = world.units.find(u => u.id === 54)
  // Supplied Node setup only. It cannot establish the separate earned-stock UI witness.
  world.units = [shaman]
  world.buildings = [target]
  world.effects = []
  world.trees = []
  Object.assign(shaman, { x: target.x, z: target.z + 8, path: [], native: null, casting: null })
  world.selected = [shaman.id]
  world.shots.tornado = 1
  const motion = new UnitMotion()
  const clock = { animationTime: 0, animationFrame: 0,
    beforeTurn: () => motion.beforeTurn(world), afterTurn: () => motion.afterTurn(world) }
  const scene = { world, gameClock: clock }, store = { getWorld: () => world }
  const observer = attachTornadoBuildingObservation(scene, store, { targetId: 1, shamanId: 54 })
  assert.ok(cast(world, 'tornado', target))
  const projectileId = world.projectiles.find(p => p.spell === 'tornado').id
  for (let turn = 0; !observer.status().terminal && turn < 320; turn++) advanceGame(world, clock, 1 / 12)
  const evidence = observer.finish()
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.cleanupErrors, [])
  assert.equal(evidence.restored, true)
  assert.equal(evidence.terminal.reason, 'impact')
  assert.equal(observer.status().projectileId, projectileId)
  assert.equal(evidence.impacts.length, 1)
  const impact = evidence.impacts[0]
  assert.equal(impact.before.work - impact.after.work, 100)
  assert.ok(world.trees.some(tree => tree.id === impact.log.id && tree.model === 11 && tree.logs === 1))
  const visits = evidence.visits.length
  advanceGame(world, clock, 1 / 12)
  assert.equal(evidence.visits.length, visits, 'First accepted impact detaches atomically')
})

test('Tornado cast consumer binds actual delivered terrain pick and quantized projectile', () => {
  const args = { clientX: 400, clientY: 500, button: 0 }
  const before = { mode: 'tornado', overviewActive: false, worldMatches: true, caster: 54,
    turn: 100, stock: 3, projectiles: [] }
  const after = { ...before, mode: null, stock: 2, projectiles: [{ id: 20, spell: 'tornado',
    caster: 54, phase: 'windup', remaining: 6, turns: 0, visuals: [],
    target: { x: 69, z: 101 }, destination: { x: 19712, y: -27904, h: 100 } }] }
  const pointer = { restored: true, errors: [], events: [{ type: 'pointerup', trusted: true,
    button: 0, canvasOwned: true, canvasTarget: true, args,
    state: { currentSceneMatches: true, currentWorldMatches: true, armedWorldMatches: true,
      armedCanvasMatches: true },
    picks: [{ owner: 'scene', name: 'pick', receiverMatches: true, args,
      point: { x: 68.9, z: 100.7 } }] }] }
  const receipt = { before, after, pointer }
  assert.deepEqual(assertTornadoBuildingCast(receipt, 54),
    { projectileId: 20, point: { x: 68.9, z: 100.7 }, target: { x: 69, z: 101 } })
  for (const alter of [
    r => { r.pointer.events[0].trusted = false },
    r => { r.pointer.events[0].state.armedWorldMatches = false },
    r => { r.pointer.events[0].picks[0].args = { ...args, clientX: 401 } },
    r => { r.pointer.events[0].picks[0].point.x = 66 },
    r => { r.pointer.events[0].picks.push({ name: 'pickPerson' }) },
    r => { r.after.projectiles[0].caster = 55 },
    r => { r.after.projectiles[0].destination.y++ },
    r => { r.after.projectiles[0].phase = 'flight' },
    r => { r.after.turn++ },
    r => { r.after.stock++ },
  ]) {
    const copy = structuredClone(receipt)
    alter(copy)
    assert.throws(() => assertTornadoBuildingCast(copy, 54))
  }
})

test('Tornado route cleanup attempts finish, dispose and save while preserving primary failure', async () => {
  const primary = new Error('actual route failure'), attempts = []
  const report = { status: 'failed' }
  const observation = {
    async evaluate() { attempts.push('finish'); throw Error('finish failure') },
    async dispose() { attempts.push('dispose'); throw Error('dispose failure') },
  }
  const failure = await finishTornadoBuildingRun({ observation, report, primaryError: primary,
    save() { attempts.push('save'); throw Error('save failure') } })
  assert.equal(failure, primary)
  assert.deepEqual(attempts, ['finish', 'dispose', 'save'])
  assert.equal(report.cleanupErrors.length, 3)
  assert.equal(report.status, 'failed')
})

test('Tornado evidence export rejects oversize data instead of truncating any record', () => {
  const small = { visits: [], errors: ['complete error'] }
  assert.equal(boundedTornadoEvidence(small), small)
  const large = { errors: ['x'.repeat(4 * 1024 * 1024)] }
  assert.throws(() => boundedTornadoEvidence(large), /4MiB export bound/)
  assert.equal(large.errors[0].length, 4 * 1024 * 1024)
})
