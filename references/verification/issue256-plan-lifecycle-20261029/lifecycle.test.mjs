// Caller-bound supplied-state regressions, NOT an ordinary gameplay/native-parity run.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../issue25-held-panel-visibility-20261029/baseline/app/world-initialization.ts'
import { addBuilding, prepareBuildingSite } from '../issue25-held-panel-visibility-20261029/baseline/app/construction-runtime.ts'
import { buildingGradeVertices, buildingPose } from '../issue25-held-panel-visibility-20261029/baseline/app/building-shapes.ts'
import rules from '../issue25-held-panel-visibility-20261029/baseline/app/original-rules.json' with { type: 'json' }

function suppliedSite(kind = 'camp') {
  const w = createWorld(4)
  // Controlled empty site; excludes movement, pathfinding, producer and original parity.
  w.units = []
  w.trees = []
  const b = addBuilding(w, 'green', kind, { x: -48, z: -64 }, false, { plan: true })
  assert.ok(b.preparation)
  assert.equal(w.buildings.filter(value => value.id === b.id).length, 1)
  return { w, b }
}

for (const kind of ['camp', 'tower']) test(`actual ${kind} preparation allocation retains one object and identity`, () => {
  const { w, b } = suppliedSite(kind), plan = b.preparation, id = b.id
  const before = w.buildings.slice()
  // Supply completed work/grade and a departed worker cohort at the allocation boundary.
  plan.work = rules.buildingPreparationWork[plan.model]
  for (const v of buildingGradeVertices(buildingPose(b))) w.land.heights[v.index] = plan.height
  b.counter = 0
  const workers = Array.from({ length: Math.max(1, rules.buildingMinWorkers[plan.model]) }, () => ({
    builder: { task: 9, busy: 0, phase: 6, restart: false },
  }))
  prepareBuildingSite(w, b, workers)
  assert.equal(b.preparation, undefined)
  assert.equal(b.id, id)
  assert.equal(w.buildings.length, before.length)
  assert.ok(w.buildings.every((value, index) => value === before[index]))
  assert.equal(w.buildings.filter(value => value.id === id).length, 1)
  assert.equal(b.progress, plan.work / rules.buildingLife[plan.model])
  assert.ok(workers.every(u => u.builder.task === 2 && u.builder.phase === 21))
})

test('actual preparation timeout removes only the target plan', () => {
  const { w, b } = suppliedSite()
  const other = addBuilding(w, 'green', 'tower', { x: 48, z: 64 }, false, { plan: true })
  b.counter = 0
  b.preparation.timeout = 50
  assert.ok(rules.buildingTimeoutWorkers[b.preparation.model] > 0)
  prepareBuildingSite(w, b, [])
  assert.ok(!w.buildings.includes(b))
  assert.ok(w.buildings.includes(other))
  assert.ok(other.preparation)
})
