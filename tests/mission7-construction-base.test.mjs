import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function ordinaryPlan() {
  const w = createWorld(7), clock = { animationTime: 0, animationFrame: 0 }
  let task
  for (let n = 0; n < 400 && !task; n++) {
    advanceGame(w, clock, 1 / 12)
    task = w.ai.tasks.find(t => t.flags & 1 && t.type === 0 && t.requested === 4 && t.entity)
  }
  assert.ok(task, 'original roster must place its first ordinary Tower plan')
  const tower = w.buildings.find(b => b.id === task.entity)
  assert.equal(tower.kind, 'tower')
  const p = buildingOutsidePoint(buildingPose(tower))
  return { w, clock, task, tower, expected: ((p.x >>> 8) & 254) | (p.y & 0xfe00) }
}

test('M7 ordinary Tower plan enters native phase3 and establishes exterior base before completion', () => {
  const { w, clock, task, tower, expected } = ordinaryPlan()
  assert.equal(task.phase, 3)
  assert.equal(w.ai.constructionBase, undefined)
  assert.ok(tower.progress < 1)
  const replay = migrateCheckpoint(structuredClone(w)), replayClock = structuredClone(clock)
  while (task.phase === 3) {
    advanceGame(w, clock, 1 / 12)
    advanceGame(replay, replayClock, 1 / 12)
  }
  assert.equal(task.phase, 4)
  assert.equal(w.ai.constructionBase, expected)
  assert.equal(w.ai.constructionRadius, 0)
  assert.deepEqual(replay, w)
})

for (const condition of ['base-zero', 'base-existing', 'scripted', 'missing-building'])
  test(`M7 phase3 retains native non-writing condition ${condition}`, () => {
    const { w, task, tower } = ordinaryPlan()
    // Controlled phase3 boundary, separate from the ordinary path above.
    task.phase = 3
    if (condition === 'base-zero') w.ai.constructionBase = 0
    if (condition === 'base-existing') w.ai.constructionBase = 0x1234
    if (condition === 'scripted') task.extra = 1
    if (condition === 'missing-building') tower.hp = 0
    w.ai.constructionRadius = 17
    const base = w.ai.constructionBase, rng = w.randomState
    w.turn = 1
    w.ai.cursor = w.ai.tasks.indexOf(task)
    stepComputerTasks(w, 2)
    assert.equal(task.phase, 4)
    assert.equal(w.ai.constructionBase, base)
    assert.equal(w.ai.constructionRadius, 17)
    assert.equal(w.randomState, rng)
  })
