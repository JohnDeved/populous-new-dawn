import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, browserPosition, nativePosition, tick } from '../app/model.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { missionData } from '../app/mission-data.ts'
import { requestMarkerTask } from '../app/computer.ts'
import { appendLiveGuardOrders } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Computer single-marker guards (task type 24, 0x4cedd0 phase 5 at
// 0x4cf150..0x4cf1c6; decomp/research/computer-marker-guards.md). The command-3
// move is committed only to selected Preachers (0x4359b0 model filter 4) and
// started by 0x41b180, whose state-14 exit deselects them (0x4d2740 ->
// 0x445750). The command-11 guard then reaches every person still selected.
// Warriors therefore get one command-11 guard and no leading move.

const turn = (w, n = 1) => {
  for (let i = 0; i < n; i++) tick(w, 1 / 12)
}
const models = (w, p) => p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
const centreOf = marker =>
  browserPosition({ x: ((marker & 254) + 1) << 8, y: (((marker >>> 8) & 254) + 1) << 8 })
const wrapped = (a, b) => Math.abs((((a - b + 32768) & 65535) + 65536) % 65536 - 32768)
// Native distance from the marker cell centre (person position units).
const offset = (w, u, marker) => {
  const n = nativePosition(w, u),
    x = ((marker & 254) + 1) << 8,
    y = (((marker >>> 8) & 254) + 1) << 8
  return Math.max(wrapped(n.x & 65535, x), wrapped(n.y & 65535, y))
}

function flatWorld(gameFlags) {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = gameFlags
  return w
}

// Hold: at the marker centre, on its single guard order, for the given turns.
function assertHolds(w, u, marker, turns) {
  for (let i = 0; i < turns; i++) {
    turn(w)
    assert.equal(u.native.state, 10, `turn ${w.turn}: the guard stays on its order`)
    assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 11)
    assert.ok(offset(w, u, marker) <= 64, `turn ${w.turn}: the guard holds its marker cell centre`)
  }
}

test('a single-marker computer guard queues one command-11 guard, walks to its marker and holds it', () => {
  const w = flatWorld(32)
  const markerPoint = nativePosition(w, { x: -10, z: 8 }),
    marker = ((markerPoint.x >>> 8) & 254) | (markerPoint.y & 0xfe00)
  const u = addUnit(w, 'red', 'warrior', { x: -25, z: 8 })
  appendLiveGuardOrders(w, [u], marker)
  const p = u.native,
    [order] = p.commands.filter(Boolean).map(id => w.buildingOrders.records[id])
  assert.deepEqual(models(w, p), [11], 'no leading command-3 move for a non-Preacher')
  assert.deepEqual([order.a, order.b], [marker, 0x606], 'the guard area is the marker cell')
  const start = offset(w, u, marker)
  assert.ok(start >= 3000, 'the guard starts far from its marker')
  let arrived = -1
  for (let i = 0; i < 300 && arrived < 0; i++) {
    turn(w)
    if (offset(w, u, marker) <= 16) arrived = w.turn
  }
  assert.ok(arrived > 0, 'the guard walks to its marker')
  assertHolds(w, u, marker, 400)
})

test('the type-24 task gives Warriors the guard and starts a deselected Preacher move; Save/Load mid-walk continues', () => {
  // Ordinary task path: script-shaped marker entry, selection (state 14), the
  // phase-5 commit and the 0x418ce0 restore all run through computer turns.
  const w = flatWorld(0),
    index = 1,
    marker = missionData(w.outcome.level).level.markers[index],
    centre = centreOf(marker)
  // A distant player unit keeps the level running.
  addUnit(w, 'blue', 'brave', { x: centre.x + 40, z: centre.z + 40 })
  const [warrior, preacher] = ['warrior', 'preacher'].map((kind, i) =>
    addUnit(w, 'red', kind, { x: centre.x - 12 + i, z: centre.z + 6 })
  )
  w.ai.markerEntries[0] = { marker: index, secondary: -1, quotas: [0, 1, 0, 1] }
  requestMarkerTask(w.ai, [0], false)
  for (let i = 0; i < 200 && !warrior.native?.commands.some(Boolean); i++) turn(w)
  const committed = w.turn
  assert.ok(warrior.native?.commands.some(Boolean), 'the task committed its guard')
  assert.deepEqual(models(w, warrior.native), [11], 'Warrior: one guard, no leading move')
  assert.equal(warrior.native.state, 10)
  assert.deepEqual(models(w, preacher.native), [3], 'Preacher: only the started move')
  assert.equal(preacher.native.state, 10, '0x41b180 restored the Preacher first')
  assert.equal(preacher.native.selectionFlags & 128, 0, 'the restore deselected the Preacher')
  assert.equal(preacher.native.commandStatus, 3, 'the move was configured')
  const move = w.buildingOrders.records[preacher.native.commands[0]]
  assert.deepEqual([move.a, move.b], [((marker << 8) + 128) & 65535, (marker & 0xff00) + 128])
  for (const u of [warrior, preacher])
    assert.ok(offset(w, u, marker) >= 2500, `${u.kind} starts far from the marker`)

  turn(w, 12)
  assert.ok(offset(w, warrior, marker) >= 1500, 'saved mid-walk')
  const resumed = migrateCheckpoint(structuredClone(w)),
    sample = v =>
      [warrior.id, preacher.id].map(id => {
        const u = v.units.find(unit => unit.id === id)
        return [u.x, u.z, u.native.state, models(v, u.native), u.native.commandCursor]
      })
  let arrived = -1
  for (let i = 0; i < 300; i++) {
    turn(w)
    turn(resumed)
    if (arrived < 0 && offset(w, warrior, marker) <= 16) arrived = w.turn
  }
  assert.ok(arrived > committed, 'the Warrior walks to its marker')
  assert.deepEqual(sample(resumed), sample(w))
  assert.equal(resumed.randomState, w.randomState)
  assert.ok(offset(w, preacher, marker) <= 1280, 'the Preacher walked to the marker area')
  assertHolds(w, warrior, marker, 200)
})

test('ordinary M15 single-marker guards commit native queues and continue through public Save/Load', async () => {
  const store = createGameStore()
  store.startMission(15)
  const w = store.getWorld(),
    markers = missionData(15).level.markers
  // Yellow (tribe 2) task 1 stages marker 0 with four Warriors and one Preacher (restored at turn 29).
  let task
  while (w.turn < 200 && !task) {
    task = w.campaignAIs[2].tasks.find(
      t => t.flags & 1 && t.type === 24 && t.phase === 5 && t.route[t.mode].secondary === -1
    )
    if (!task) turn(w)
  }
  assert.ok(task, 'the authored single-marker guard task reaches its commit')
  const marker = markers[task.route[task.mode].marker],
    members = task.members.map(id => w.units.find(u => u.id === id))
  for (let i = 0; i < 20 && members.some(u => u.native.state === 14); i++) turn(w)
  const warriors = members.filter(u => u.kind === 'warrior'),
    preachers = members.filter(u => u.kind === 'preacher')
  assert.ok(warriors.length >= 2 && preachers.length >= 1, 'the group has both kinds')
  for (const u of warriors) {
    assert.deepEqual(models(w, u.native), [11], `Warrior ${u.id}: one guard, no leading move`)
    assert.equal(u.native.state, 10)
  }
  // This Preacher already stands on the marker, so its started move completes
  // on the commit turn and its own preaching resumes; it never gets the guard.
  for (const u of preachers) {
    assert.equal(u.native.state, 10)
    assert.ok(!models(w, u.native).includes(11), `Preacher ${u.id} is not given the guard`)
    assert.equal(u.native.selectionFlags & 128, 0, `Preacher ${u.id} was deselected`)
  }
  const walking = warriors.filter(u => offset(w, u, marker) > 64)
  assert.ok(walking.length, 'saved while Warriors are still walking')
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  while (w.turn < 400) {
    turn(w)
    turn(replay)
  }
  assert.deepEqual(replay, w)
  for (const u of warriors) {
    if (u.hp <= 0) continue
    assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 11)
    assert.ok(offset(w, u, marker) <= 64, `Warrior ${u.id} holds its marker`)
  }
})
