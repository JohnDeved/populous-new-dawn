// Supplied construction boundaries through the real in-session game-store API.
// No IndexedDB persistence, ordinary AI episode, school implementation or native parity claim.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameStore } from '../app/game-store.ts'
import { addBuilding, prepareBuildingSite } from '../app/construction-runtime.ts'
import { buildingGradeVertices, buildingPose } from '../app/building-shapes.ts'
import { requestConstruction, computerPhase } from '../app/computer.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function setup(kind) {
  const store = createGameStore()
  store.startMission(4)
  const w = store.getWorld()
  const b = addBuilding(w, 'green', kind, { x: -48, z: -64 }, false, { plan: true })
  assert.ok(b.preparation)
  b.preparation.work = rules.buildingPreparationWork[b.preparation.model]
  for (const v of buildingGradeVertices(buildingPose(b))) w.land.heights[v.index] = b.preparation.height
  b.counter = 0
  return { store, w, b }
}
function allocate(w, b) {
  const workers = Array.from({ length: Math.max(1, rules.buildingMinWorkers[b.preparation.model]) }, () => ({
    builder: { task: 9, busy: 0, phase: 6, restart: false },
  }))
  prepareBuildingSite(w, b, workers)
  assert.equal(b.preparation, undefined)
}
for (const kind of ['camp', 'tower']) test(`checkpoint restores pending ${kind} and continues allocation without duplicate identity`, async () => {
  const { store, w, b } = setup(kind), id = b.id
  const ids = w.buildings.map(value => value.id), plan = structuredClone(b.preparation)
  const rng = w.randomState
  assert.equal(await store.saveCheckpoint(), false, 'no browser persistence in this Node fixture')
  assert.equal(store.hasCheckpoint(), true, 'in-session snapshot still exists')
  b.preparation.work = 0
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld(), target = restored.buildings.find(value => value.id === id)
  assert.notEqual(restored, w)
  assert.notEqual(target, b)
  assert.deepEqual(target.preparation, plan)
  assert.equal(restored.randomState, rng)
  allocate(restored, target)
  assert.deepEqual(restored.buildings.map(value => value.id), ids)
  assert.equal(restored.buildings.filter(value => value.id === id).length, 1)
  assert.equal(b.preparation.work, 0, 'loaded continuation does not mutate old world')
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().buildings.find(value => value.id === id).preparation, plan,
    'allocation does not mutate stored pending snapshot')
})
test('checkpoint after allocation retains construction task reference through actual cleanup', async () => {
  const { store, w, b } = setup('tower')
  allocate(w, b)
  w.turn = 61
  assert.equal(computerPhase(w.turn, 3), 'dispatch')
  assert.ok(requestConstruction(w.ai, 4, 0x36b6))
  const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 0), index = w.ai.tasks.indexOf(task)
  Object.assign(task, { phase: 7, entity: b.id, members: [] })
  w.ai.cursor = index
  w.ai.selectionOwner = index
  w.ai.flags |= 2
  const ids = w.buildings.map(value => value.id), rng = w.randomState
  assert.equal(await store.saveCheckpoint(), false)
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld(), target = restored.buildings.find(value => value.id === b.id)
  assert.equal(target.preparation, undefined)
  assert.equal(restored.ai.tasks[index].entity, target.id)
  assert.equal(restored.ai.selectionOwner, index)
  stepComputerTasks(restored, 3)
  assert.deepEqual(restored.buildings.map(value => value.id), ids)
  assert.equal(restored.ai.tasks[index].flags & 3, 0)
  assert.equal(restored.ai.selectionOwner, 10)
  assert.equal(restored.randomState, rng)
  assert.equal(task.flags & 1, 1, 'cleanup leaves old world untouched')
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(store.getWorld().ai.tasks[index].flags & 1, 1, 'cleanup leaves stored task untouched')
})
