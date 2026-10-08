import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { personReachedOrder } from '../../app/person-orders.ts'
import { nativeUnitModel } from '../../app/unit-kinds.ts'
import { samePersonCell, initializeIdleApproach, initializeRestingPerson } from '../../app/person-idle.ts'
import rules from '../../app/original-rules.json' with { type: 'json' }
import { installMission1MoveWitness } from './mission1-vault-arrival.mjs'

const actualInstall = () => Function('imports', `return (${installMission1MoveWitness.toString().replaceAll('import(', 'imports(')})`)(async path => {
  if (path === '/app/person-orders.ts') return { personReachedOrder }
  if (path === '/app/original-rules.json') return { default: rules }
  if (path === '/app/unit-kinds.ts') return { nativeUnitModel }
  if (path === '/app/person-idle.ts') return { samePersonCell }
  throw Error(`Unexpected module ${path}`)
})
function fixture() {
  const order = { model: 3, flags: 0, references: 1, object: 0, a: 2171, b: 58621 }
  const point = { x: (2171 / 256) - 8, z: -(58621 << 16 >> 16) / 256 - 8 }
  const p = { id: 30, model: nativeUnitModel('shaman'), state: 10, previousState: 10, substate: 0, counter: 203,
    x: 1500, y: 58000, goalX: order.a, goalY: order.b, destinationX: order.a, destinationY: order.b,
    speed: 32, motionGroup: 1, motionIndex: 0, flags2: 0, flags3: 0, flags4: 0,
    commands: [1, 0, 0, 0, 0, 0, 0, 0], commandCursor: 0, commandStatus: 3, immediateCommand: 0, vehicle: 0 }
  const u = { id: 30, kind: 'shaman', team: 'blue', hp: 100, native: p, x: p.x / 256 - 8,
    z: -(p.y << 16 >> 16) / 256 - 8, inside: null, work: null, lift: 0, casting: null, fight: null, path: [{ ...point }] }
  const w = { turn: 200, time: 200 / 12, paused: false, status: 'playing', lastOrderTurn: 200,
    units: [u], objectCells: { objects: new Map([[30, p]]) }, buildingOrders: { records: [null, order] }, pathfinding: { people: new Map([[30, p]]) } }
  const calls = [], before = function (...args) { calls.push(['before', this === scene.gameClock, args]); return 10 }
  const after = function (...args) { calls.push(['after', this === scene.gameClock, args]); return 11 }
  const scene = { world: w, gameClock: { beforeTurn: before, afterTurn: after } }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => w } }
  const args = { id: 30, point, orderId: 1, order: { ...order }, acknowledgedTurn: 200 }
  return { w, u, p, scene, before, after, calls, args,
    async install() { await actualInstall()(args) },
    visit(mutate = () => {}) { assert.equal(scene.gameClock.beforeTurn('input'), 10); w.turn++; w.time = w.turn / 12; mutate(); assert.equal(scene.gameClock.afterTurn('output'), 11) },
    complete(dx = 160, dy = 160) {
      p.x = (order.a + dx) & 65535; p.y = (order.b + dy) & 65535
      u.x = (p.x << 16 >> 16) / 256 - 8; u.z = -(p.y << 16 >> 16) / 256 - 8
      p.commands.fill(0); p.counter = 204; p.state = rules.personModels[p.model].idleState; p.previousState = 10; p.speed = 0
      p.motionGroup = 0; u.path = []; w.pathfinding.people.delete(30)
    } }
}

test('source binding uses actual Shaman7/radius160, strict216 native square and native seam fold', () => {
  assert.equal(nativeUnitModel('shaman'), 7); assert.equal(rules.personArrivalRadius[7], 160)
  assert.equal(nativeUnitModel('firewarrior'), 6); assert.equal(rules.personArrivalRadius[6], 384)
  const p = { model: 7, vehicle: 0, flags4: 0, x: 1215, y: 1215 }, order = { model: 3, a: 1000, b: 1000 }
  assert.equal(personReachedOrder(p, order, () => {}), true)
  p.x = 1216; assert.equal(personReachedOrder(p, order, () => {}), false)
  p.x = 1215; p.y = 1216; assert.equal(personReachedOrder(p, order, () => {}), false)
  p.x = 65530; p.y = 65530; order.a = 5; order.b = 5
  assert.equal(personReachedOrder(p, order, () => {}), true)
  // The original fold is65535, not a newly substituted65536 modulus.
  p.x = 32760; p.y = 0; order.a = 32976; order.b = 0
  assert.equal(personReachedOrder(p, order, () => {}), true)
  p.x = 32759; assert.equal(personReachedOrder(p, order, () => {}), false)
})

test('legitimate diagonal native completion replaces the extra Euclidean helper precision without writes', async () => {
  const f = fixture(), initial = structuredClone(f.w)
  await f.install(); assert.deepEqual(f.w, initial)
  f.visit(() => f.complete())
  const after = structuredClone(f.w), e = window.restoreMission1MoveWitness()
  assert.deepEqual(f.w, after); assert.equal(e.restored, true); assert.deepEqual(e.errors, [])
  assert.ok(e.completed); assert.equal(e.completed.before.orderId, 1); assert.equal(e.completed.after.orderId, 0)
  assert.equal(e.completed.after.registeredOwnerMatches, true)
  assert.equal(e.completed.after.nativeReached, true); assert.equal(e.completed.after.legacy.within035, false)
  assert.equal(e.completed.after.legacy.speedZero, true); assert.equal(e.completed.after.route.present, false)
  assert.equal(f.scene.gameClock.beforeTurn, f.before); assert.equal(f.scene.gameClock.afterTurn, f.after)
  assert.deepEqual(f.calls, [['before', true, ['input']], ['after', true, ['output']]])
})

test('observer rejects boundary/outside, pending routes, replaced/cancelled order, new actor or intervening input', async () => {
  for (const mutate of [
    f => f.complete(216, 0), f => { f.complete(); f.w.pathfinding.people.set(30, f.p) },
    f => { f.complete(); f.p.commands[1] = 2 }, f => { f.complete(); f.p.state = 1 },
    f => { f.complete(); f.p.flags4 |= 0x10000000 },
    f => { f.u.native = { ...f.p } }, f => { f.p.model = 6 },
    f => { f.w.objectCells.objects.set(30, { ...f.p }) },
    f => { f.complete(); f.p.counter = 205 },
    f => { f.w.lastOrderTurn++ }, f => { f.w.buildingOrders.records[1].flags |= 1 },
    f => { f.w.buildingOrders.records[1].a++ },
  ]) {
    const f = fixture(); await f.install(); f.visit(() => mutate(f))
    const e = window.restoreMission1MoveWitness(); assert.ok(e.errors.length); assert.equal(e.completed, undefined)
    assert.ok(e.terminal && e.latest); assert.equal(f.scene.gameClock.afterTurn, f.after)
  }
})

test('bounded progress and failure-time snapshots retain every old conjunct and route ownership', async () => {
  const f = fixture(); await f.install()
  for (let i = 0; i < 500; i++) f.visit()
  const e = window.restoreMission1MoveWitness()
  assert.equal(e.completed, undefined); assert.equal(e.samples.length, 32)
  assert.equal(e.initial.turn, 200); assert.equal(e.latest.turn, 700); assert.equal(e.terminal.turn, 700)
  assert.equal(e.terminal.orderId, 1); assert.equal(e.terminal.route.present, true)
  assert.equal(e.terminal.route.matchesNative, true); assert.equal(e.terminal.native.goalX, 2171)
  assert.equal(e.terminal.native.goalY, 58621); assert.equal(e.terminal.legacy.emptyPath, false)
  assert.equal(e.terminal.legacy.speedZero, false); assert.equal(e.terminal.legacy.insideNull, true)
  assert.ok(Number.isFinite(e.terminal.legacy.distance))
})

test('missed attachment retains initial diagnostics and source binds the real completion owner', async () => {
  const f = fixture(); f.complete()
  await assert.rejects(() => f.install(), /completion was missed/)
  assert.equal(window.mission1MoveEvidence.initial.orderId, 0)
  assert.equal(f.scene.gameClock.beforeTurn, f.before)
  const source = path => readFileSync(new URL('../../app/' + path, import.meta.url), 'utf8')
  assert.match(source('live-movement.ts'), /stepMovementOrder\(p, order, w.land.categories/)
  assert.match(source('live-movement.ts'), /clearLivePath\(w, u\)\s+changeLivePersonState\(w, u, next\)/)
  assert.match(source('person-order-update.ts'), /if \(complete\)[\s\S]*e.remove\(p.commandCursor\)/)
  assert.match(source('person-orders.ts'), /return positionsOverlap\(p.vehicle \? vehicle\(p.vehicle\) : p, radius, to, 56\)/)
  const driver = readFileSync(new URL('./mission1-vault-knowledge.mjs', import.meta.url), 'utf8')
  assert.match(driver, /report.movements.push\(movement\); save\(\)/)
  assert.match(driver, /movement.observation = await page.evaluate/)
})


test('actual idle initializer can nest state17 to resting19 in the completion turn', async () => {
  const f = fixture(); await f.install(); let nested = 0
  f.visit(() => {
    f.complete()
    Object.assign(f.p, { anchorX: f.p.x, anchorY: f.p.y, cargo: 0, slowTurn: 0, assignment: 0 })
    initializeIdleApproach(0, f.p, {
      collision: () => 0, setAnimation() {},
      searchStart() { assert.fail('A collision-free nearby Shaman should not search') },
      initialize() {
        nested++; assert.equal(f.p.state, 19); assert.equal(f.p.previousState, 17)
        initializeRestingPerson({ turn: f.w.turn }, f.p, { setAnimation() {}, releaseMotion() {} })
      },
    })
  })
  const e = window.restoreMission1MoveWitness()
  assert.equal(nested, 1); assert.deepEqual(e.errors, []); assert.ok(e.completed)
  assert.equal(e.completed.before.native.state, 10)
  assert.equal(e.completed.after.native.state, 19); assert.equal(e.completed.after.native.previousState, 17)
  assert.equal(e.completed.after.native.substate, 8); assert.equal(e.completed.after.sameGoalCell, true)
  assert.equal(e.completed.after.legacy.within035, false)
})
