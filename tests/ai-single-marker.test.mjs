import test from 'node:test'
import assert from 'node:assert/strict'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, tick, nativePosition } from '../app/model.ts'
import { createLivePerson, changeLivePersonState } from '../app/live-people.ts'
import { appendLiveGuardOrders } from '../app/live-movement.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Supplied flat-terrain mixed-group boundary for original 004cedd0 phase 5.
// Not a natural mission recruitment or rendered-game acceptance witness.
function setup() {
  const w = createStartedWorld(1, 'scalable')
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  for (const kind of ['brave', 'warrior', 'preacher', 'firewarrior']) {
    const u = addUnit(w, 'red', kind, { x: -25, z: 8 })
    u.native = createLivePerson(w, u)
    changeLivePersonState(w, u, 14)
  }
  return w
}
const models = (w, u) => u.native.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
const point = (w, to) => {
  const n = nativePosition(w, to)
  return ((n.x >>> 8) & 254) | (n.y & 0xfe00)
}
const turn = (w, n) => {
  for (let i = 0; i < n; i++) tick(w, 1 / 12)
}

test('single-marker producer gives Preachers move-only and other models guard-only', () => {
  const w = setup(), destination = point(w, {x:-10,z:8})
  assert.equal(appendLiveGuardOrders(w, w.units, destination), true)
  for (const u of w.units) {
    assert.deepEqual(models(w, u), u.kind === 'preacher' ? [3] : [11])
    assert.equal(u.native.state, u.kind === 'preacher' ? 10 : 14)
  }
  const guards = w.units.filter(u => u.kind !== 'preacher')
  assert.equal(new Set(guards.map(u => u.native.commands[0])).size,1,'guards share their record')
  for (const u of guards) changeLivePersonState(w, u, 10)
  turn(w, 1000)
  for (const u of guards) {
    assert.equal(currentPersonOrder(w.buildingOrders,u.native).model,11)
    assert.ok(Math.hypot(u.x+10,u.z-8)<8,'guard reaches and holds its authored area')
  }
  const preacher = w.units.find(u => u.kind === 'preacher')
  assert.ok(Math.hypot(preacher.x+10,preacher.z-8)<3,'Preacher reaches its point')
  assert.ok(!models(w, preacher).includes(11), 'Preacher is not pinned to an area guard after arrival')
  assert.notEqual(currentPersonOrder(w.buildingOrders, preacher.native)?.model, 3, 'initial move completes')
})

test('actual task-24 phase-5 consumer releases both model groups and checkpoints movement', () => {
  const w = setup(), task = w.ai.tasks[0]
  for (const t of w.ai.tasks) t.flags = 0
  Object.assign(task,{flags:1,type:24,phase:5,mode:0,extra:0,members:w.units.map(u => u.id)})
  task.route[0].marker = 0; task.route[0].secondary = -1
  w.ai.cursor=0; w.ai.commandDelay=0
  stepComputerTasks(w, 1)
  for (const u of w.units) {
    assert.deepEqual(models(w, u),u.kind === 'preacher'?[3]:[11])
    assert.equal(u.native.state, 10)
  }
  turn(w, 20)
  const replay=migrateCheckpoint(structuredClone(w))
  for(let i=0;i<80;i++){tick(w, 1 / 12);tick(replay, 1 / 12)}
  assert.deepEqual(replay,w)
})

test('unreleased locked Preacher remains selected for the second native guard commit', () => {
  const w = setup()
  const preacher = w.units.find(u => u.kind === 'preacher')
  preacher.native.flags2 |= 0x100000
  appendLiveGuardOrders(w, w.units, point(w, { x: -10, z: 8 }))
  assert.equal(preacher.native.state, 14)
  assert.ok(preacher.native.selectionFlags & 128)
  assert.deepEqual(models(w, preacher), [11])
})
