import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { installSpySourceObserver } from '../scripts/tutorial-browser/spy-source-observer.mjs'

test('observer distinguishes living fight ownership from absent native and retains matching detector identity', () => {
  const person = { id: 2170, x: 3839, y: 57371, state: 29, substate: 4, object: 48,
    disguise: 0, timer: 40, immediateCommand: 0, commands: [13], flags2: 0 },
    spy = { id: 2170, hp: 30, x: 7, z: 24, native: null, fight: { motion: person } },
    world = { turn: 284, units: [spy,
      { id: 2178, team: 'red', kind: 'brave', hp: 30, inside: null, x: 5.6, z: 23.1 },
      { id: 32, team: 'red', kind: 'shaman', hp: 30, inside: null, x: 1, z: -37 },
      { id: 99, team: 'red', kind: 'brave', hp: 0, inside: null, x: 5.6, z: 23.1 }],
    buildings: [{ id: 1022, team: 'red', hp: 400, progress: 1 }],
    objectCells: { objects: new Map([[2170, person]]) }, buildingOrders: { records: { 13: { model: 15 } } } },
    scene = { world, gameClock: { afterTurn() {} }, unitMeshes: new Map([[2170, {}]]), renderer: { domElement: {} } }
  const context = { structuredClone, window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    requestAnimationFrame: () => { throw Error('Controlled diagnostics must not schedule RAF') }, cancelAnimationFrame() {} }
  const before = structuredClone(world)
  runInNewContext(`(${installSpySourceObserver.toString()})({spyId:2170,targetId:1022,controlled:true})`, context)
  assert.equal(context.window.__pndSpySourceObservation.result.error, null)
  context.window.__pndSpySourceObservation.sample()
  const { result } = context.window.__pndSpySourceObservation, runtime = result.runtime[0]
  assert.equal(result.error, 'Error: Trained Spy or actual mesh missing', 'acceptance remains strict')
  assert.equal(runtime.unitExists, true); assert.equal(runtime.meshExists, true); assert.equal(runtime.hp, 30)
  assert.equal(runtime.owners.native, null); assert.equal(runtime.owners.fight.state, 29)
  assert.equal(runtime.owners.fight.registered, true)
  assert.equal(runtime.owners.fight.orders[1].record.model, 15)
  assert.deepEqual(Array.from(runtime.nearbyActors, u => u.id), [2178])
  assert.equal(runtime.target.team, 'red'); assert.equal(runtime.target.progress, 1)
  assert.deepEqual(world, before)
  assert.equal(result.hook.restored, true, 'Diagnostic failure restores its owned clock hook')
  world.buildingOrders.records[13].model = 3
  assert.equal(runtime.owners.fight.orders[1].record.model, 15, 'retained historical order cannot change with the live queue')
})

