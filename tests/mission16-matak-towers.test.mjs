import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding } from '../app/construction-runtime.ts'
import { createGameStore } from '../app/game-store.ts'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'

const matak = 3
const packed = (x, y) => x | (y << 8)
const sites = [[108, 224], [108, 234], [80, 200], [64, 240], [76, 10], [92, 10]]

function setup() {
  const store = createGameStore()
  store.startMission(16)
  const w = store.getWorld()
  const ai = w.campaignAIs[matak]
  return { store, w, ai }
}
function step(w) {
  const before = w.turn
  assert.equal(w.status, 'playing')
  tick(w, 1 / 12)
  assert.equal(w.turn, before + 1)
}
function supply(w, kind, count) {
  const shaman = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  assert.ok(shaman)
  for (let n = 0; n < count; n++)
    addUnit(w, 'green', kind, { x: shaman.x + (n % 7) * 0.7, z: shaman.z + 4 + Math.floor(n / 7) * 0.7 })
}
const matureHut = (w, complete = true) =>
  addBuilding(w, 'green', 'hut', nativeCellPoint(packed(82, 222)), complete, { level: 3 })
const builds = ai => ai.tasks.filter(t => (t.flags & 1) && t.type === 0 && t.extra === 1 && t.requested === 4)
const staffed = ai => ai.tasks.filter(t => (t.flags & 1) && t.type === 7)
const routes = ai => ai.tasks.filter(t => (t.flags & 1) && t.type === 24)

test('Matak requests and reserves the first authored M16 Tower at the exact scheduled visit', async () => {
  const { store, w, ai } = setup()
  assert.equal(w.buildings.some(b => b.team === 'green' && b.kind === 'tower'), false)
  // Supply only the mature-Hut prerequisite; the clock runs from actual startup.
  matureHut(w)
  while (w.turn < 253) step(w)
  assert.equal(ai.variables[13], 0)
  assert.equal(builds(ai).length, 0)
  assert.equal(await store.saveCheckpoint(false), false, 'in-session checkpoint, no IndexedDB')
  assert.ok(store.hasCheckpoint())
  step(w)
  const [request] = builds(ai)
  assert.equal(builds(ai).length, 1)
  assert.equal(ai.variables[13], 1)
  assert.equal(request.origin, packed(108, 224))
  assert.equal(request.target, packed(110, 224))
  const tower = w.buildings.find(b => b.id === request.entity)
  assert.deepEqual([tower.team, tower.kind, tower.progress], ['green', 'tower', 0])
  assert.ok(tower.preparation)
  assert.equal(store.loadCheckpoint(), true)
  const replay = store.getWorld()
  step(replay)
  const [replayRequest] = builds(replay.campaignAIs[matak])
  assert.deepEqual(replayRequest, request)
  assert.deepEqual(replay.buildings.find(b => b.id === replayRequest.entity), tower)
})

test('Matak queues the four reachable later Tower sites in original phase order', () => {
  for (let phase = 1; phase < 5; phase++) {
    const { w, ai } = setup()
    matureHut(w)
    const total = [0, 7, 41, 46, 51, 56][phase]
    supply(w, 'brave', total - campaignPersonCount(w, matak))
    assert.equal(campaignPersonCount(w, matak), total)
    ai.variables[13] = phase
    w.turn = 253 // Supplied later campaign state; this is not a natural playthrough.
    step(w)
    assert.equal(ai.variables[13], phase + 1)
    assert.deepEqual(builds(ai).map(t => t.origin), [packed(...sites[phase])])
  }
})

test('Matak leaves later Tower phases unchanged at exact unmet population, mature-Hut and capacity gates', () => {
  for (const [phase, total, complete, saturated] of [
    [0, 7, false, false],
    [0, 7, true, true],
    [2, 40, true, false],
    [3, 45, true, false],
    [4, 50, true, false],
    [5, 55, true, false],
    [5, 56, true, false], // Sixth site is nested in the phase-four capacity ELSE.
    [6, 56, true, false],
  ]) {
    const { w, ai } = setup()
    matureHut(w, complete)
    supply(w, 'brave', total - campaignPersonCount(w, matak))
    assert.equal(campaignPersonCount(w, matak), total)
    if (saturated) {
      for (const task of ai.tasks.slice(0, -1)) Object.assign(task, { flags: 1, type: 0, requested: 4 })
      assert.equal(ai.tasks.at(-1).flags & 1, 0)
    }
    ai.variables[13] = phase
    w.turn = 253
    step(w)
    assert.equal(ai.variables[13], phase)
    assert.equal(builds(ai).length, 0)
  }
})

test('Matak staffs the six authored Towers and starts both patrol groups in order on M16', () => {
  const { w, ai } = setup()
  const towers = sites.map(([x, y]) => addBuilding(w, 'green', 'tower', nativeCellPoint(packed(x, y))))
  for (const [kind, count] of [['warrior', 4], ['preacher', 3], ['firewarrior', 4]]) supply(w, kind, count)
  assert.deepEqual([3, 4, 6].map(model => campaignPersonCount(w, matak, model)), [4, 3, 4])
  w.turn = 125
  step(w)
  assert.deepEqual([...staffed(ai), ...routes(ai)], [])
  step(w)
  assert.deepEqual(staffed(ai).map(t => [t.requested, t.target]), towers.map(t => [6, t.id]))
  const both = routes(ai)
  assert.equal(both.length, 2)
  assert.deepEqual(both.map(t => t.route.map(r => [r.marker, r.secondary])), [
    [[21, 22], [23, 24], [25, 26], [-1, 0]],
    [[27, -1], [28, -1], [29, -1], [-1, 0]],
  ])
  assert.equal(ai.variables[13], 0)
})

test('Matak skips extra staffing and patrols at the exact follower thresholds', () => {
  const { w, ai } = setup()
  const towers = sites.map(([x, y]) => addBuilding(w, 'green', 'tower', nativeCellPoint(packed(x, y))))
  for (const [kind, count] of [['warrior', 3], ['preacher', 2], ['firewarrior', 3]]) supply(w, kind, count)
  assert.deepEqual([3, 4, 6].map(model => campaignPersonCount(w, matak, model)), [3, 2, 3])
  w.turn = 126
  step(w)
  assert.deepEqual(staffed(ai).map(t => [t.requested, t.target]), towers.slice(0, 3).map(t => [6, t.id]))
  assert.deepEqual(routes(ai), [])
})
