import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, command, cancelInteraction, scatterSelected, tick } from '../app/model.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { setSelection } from '../app/selection-runtime.ts'
import { nativeScatterEligible } from '../app/person-scatter.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Failure-first supplied-world witness, not browser input or original execution.
// Native reference: player-scatter.md 00441c62 admission has no order whitelist;
// state43 preserves the queue, consumes one command-time RNG draw, then resumes10.
test('a live selected patrol retains its queue across scatter and resumes both route points', () => {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.shrines = []; w.trees = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  const u = addUnit(w, 'blue', 'warrior', { x: -25, z: 8 })
  setSelection(w, [u.id])
  const points = [{ x: -10, z: 8 }, { x: 0, z: 8 }]
  for (const p of points) assert.equal(command(w, p, { ctrlKey: true, altKey: true }), true)
  cancelInteraction(w)
  const p = u.native
  for (let i = 0; i < 4; i++) tick(w, 1 / 12)
  // Supplied fixture admission, matching existing player-scatter tests; not startup proof.
  w.inputMask = 0
  setSelection(w, [u.id])
  assert.equal(w.inputMask, 0)
  assert.equal(w.paused, false)
  assert.equal(p.state, 10)
  assert.equal(currentPersonOrder(w.buildingOrders, p).model, 25)
  assert.equal(nativeScatterEligible(p), true)
  assert.equal(w.status, 'playing')
  assert.equal(w.land.landFlags & 0x802, 0)
  assert.equal(u.team, 'blue')
  assert.ok(u.hp > 0)
  assert.ok(!u.ghost)
  assert.equal(u.inside, null)
  for (const key of ['flight', 'fight', 'casting', 'lift', 'entry', 'builder', 'harvest', 'delivery', 'vault', 'attackReservation'])
    assert.ok(!u[key], `no ${key} adapter`)
  assert.equal(u.work, null)
  assert.equal(u.tree, null)
  const registered = w.pathfinding.people.get(u.id)
  assert.ok(!registered || registered === p, 'registered route is absent or same native owner')
  assert.equal(p.class, 1)
  assert.ok(!p.guardInputPending)
  assert.ok(!p.workFlags)
  assert.equal(p.flags2 & 0x80000, 0)
  assert.equal(p.flags4 & 0x800, 0)
  const activeIds = [p.immediateCommand, ...p.commands].filter(Boolean)
  assert.ok(activeIds.length > 0)
  assert.deepEqual([...new Set(activeIds.map(id => w.buildingOrders.records[id]?.model))], [25],
    'all active/immediate queue records are the excluded patrol model, not another disallowed order')
  const queue = [...p.commands], cursor = p.commandCursor, selection = [...w.selected]
  const records = queue.filter(Boolean).map(id => structuredClone(w.buildingOrders.records[id]))
  const rng = w.randomState
  const n = (Math.imul(rng, 0x24a1) + 0x24df) >>> 0
  const afterCommand = ((n >>> 13) | (n << 19)) >>> 0
  assert.equal(scatterSelected(w), 1, 'native-eligible queued patrol must enter scatter')
  assert.equal(w.randomState, afterCommand, 'one generic speed draw at command admission')
  assert.equal(p.state, 43)
  assert.deepEqual(p.commands, queue)
  assert.equal(p.commandCursor, cursor)
  assert.deepEqual(queue.filter(Boolean).map(id => w.buildingOrders.records[id]), records)
  assert.deepEqual(w.selected, selection)
  for (let i = 0; i < 12; i++) tick(w, 1 / 12)
  assert.equal(p.state, 10)
  assert.deepEqual(p.commands, queue)
  const visited = new Set()
  for (let i = 0; i < 2400 && visited.size < 2; i++) {
    tick(w, 1 / 12)
    points.forEach((point, index) => { if (Math.hypot(u.x - point.x, u.z - point.z) < 1.5) visited.add(index) })
  }
  assert.equal(visited.size, 2, `resumed patrol reaches both original destinations: ${JSON.stringify({visited:[...visited], x:u.x,z:u.z,state:p.state,cursor:p.commandCursor,substate:p.substate,goal:[p.goalX,p.goalY],commands:p.commands,order:currentPersonOrder(w.buildingOrders,p)})}`)
  assert.deepEqual(p.commands, queue)
  assert.deepEqual(queue.filter(Boolean).map(id => w.buildingOrders.records[id]), records)
})

test('patrol support does not admit unrelated queued models or busy owners', () => {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.shrines = []; w.trees = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  const u = addUnit(w, 'blue', 'warrior', { x: -25, z: 8 })
  setSelection(w, [u.id])
  for (const point of [{ x: -10, z: 8 }, { x: 0, z: 8 }]) command(w, point, { ctrlKey: true, altKey: true })
  cancelInteraction(w); w.inputMask = 0; setSelection(w, [u.id])
  const p = u.native, record = w.buildingOrders.records[p.commands[0]]
  const rejected = label => {
    const before = structuredClone(p), records = structuredClone(w.buildingOrders), rng = w.randomState
    assert.equal(scatterSelected(w), 0, label)
    assert.deepEqual(p, before, label)
    assert.deepEqual(w.buildingOrders, records, label)
    assert.equal(w.randomState, rng, label)
  }
  for (const model of [6, 8, 10, 11, 15, 19, 21, 17, 31, 32, 33]) {
    record.model = model; rejected(`unsupported queued model ${model}`)
  }
  record.model = 25
  for (const field of ['builder', 'entry', 'casting', 'flight', 'fight', 'harvest', 'delivery', 'vault', 'attackReservation']) {
    const old = u[field]; u[field] = {}; rejected(`busy ${field}`); u[field] = old
  }
  for (const field of ['guardInputPending', 'workFlags']) {
    const old = p[field]; p[field] = 1; rejected(field); p[field] = old
  }
})
