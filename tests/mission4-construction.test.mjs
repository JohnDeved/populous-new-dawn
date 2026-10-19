import assert from 'node:assert/strict'
import test from 'node:test'
import { createLivePerson } from '../app/live-people.ts'
import { createWorld } from '../app/world-initialization.ts'
import { availableTrainingPeople } from '../app/computer-selection.ts'
import { stepComputerTasks, computerSelectionWorld } from '../app/computer-runtime.ts'
import { requestConstruction } from '../app/computer.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'

function fixture() {
  const w = createWorld(4)
  w.turn = 60 // Controlled producer boundary, not an ordinary episode.
  return w
}
const active = w => w.ai.tasks.filter(t => t.flags & 1 && t.type === 0)

test('Mission4 authored startup owns first Tower inputs', () => {
  const w = createWorld(4)
  assert.equal(w.ai.coordinateLatch, 0x38d8)
  assert.equal(w.ai.flags & 0x20, 0x20)
  assert.equal(w.ai.states & 1, 1)
  assert.deepEqual([9, 10, 3, 30].map(i => w.ai.attributes[i]), [1, 0, 1, 0])
  assert.equal(w.units.filter(u => u.team === 'green' && u.kind === 'brave').length, 6)
  assert.equal(w.buildings.filter(b => b.team === 'green').length, 0)
})

for (const state of ['moved', 'dead', 'missing', 'zero'])
  test(`Mission4 construction uses stored origin with ${state} Shaman/base`, () => {
    const w = fixture(), shaman = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
    if (state === 'moved') Object.assign(shaman, { x: 24, z: -40 })
    if (state === 'dead') shaman.hp = 0
    if (state === 'missing') w.units = w.units.filter(u => u !== shaman)
    if (state === 'zero') w.ai.constructionBase = 0
    const rng = w.randomState
    stepComputerTasks(w, 3)
    assert.deepEqual(active(w).map(t => [t.requested, t.origin, t.phase, t.extra]),
      [[4, state === 'zero' ? 0 : 0x36b6, 0, 0]])
    assert.equal(w.randomState, rng, 'request consumes no RNG')
  })

for (const gate of ['disabled', 'towerDisabled', 'limit', 'full', 'oneWorker'])
  test(`Mission4 Tower respects ${gate} gate`, () => {
    const w = fixture()
    if (gate === 'disabled') w.ai.states &= ~1
    if (gate === 'towerDisabled') w.ai.flags |= 0x400
    if (gate === 'limit') w.ai.attributes[9] = 0
    if (gate === 'full') for (const t of w.ai.tasks) Object.assign(t, { flags: 1, type: 1 })
    if (gate === 'oneWorker') {
      let kept = false
      for (const u of w.units.filter(u => u.team === 'green' && u.kind === 'brave')) {
        if (!kept) kept = true
        else u.hp = 0
      }
    }
    const rng = w.randomState
    stepComputerTasks(w, 3)
    assert.equal(active(w).length, 0)
    assert.equal(w.randomState, rng)
  })

for (const phase of [0, 2, 3, 8])
  test(`Mission4 unestablished Tower does not duplicate pending phase${phase}`, () => {
    const w = fixture()
    w.ai.attributes[9] = 2
    assert.ok(requestConstruction(w.ai, 4, 0x36b6))
    w.ai.tasks[0].phase = phase
    // A retained plan accompanies phases3/8, as on the ordinary constructor path.
    if (phase >= 3) addBuilding(w, 'green', 'tower', { x: -48, z: -64 }, false, { plan: true })
    stepComputerTasks(w, 3)
    assert.equal(active(w).length, 1)
  })

test('Mission4 retained base permits source-supported lost Tower replacement', () => {
  const w = fixture()
  w.ai.constructionBase = 0x38d8
  stepComputerTasks(w, 3)
  assert.deepEqual(active(w).map(t => [t.requested, t.origin]), [[4, 0x38d8]])
})

for (const mode of ['ordinary', 'exact', 'existingZero'])
  test(`Mission4 Tower phase3 preserves ${mode} base ownership`, () => {
    const w = fixture(), b = addBuilding(w, 'green', 'tower', { x: -48, z: -64 }, false, { plan: true })
    requestConstruction(w.ai, 4, 0x36b6, mode === 'exact')
    const t = w.ai.tasks[0]
    Object.assign(t, { phase: 3, entity: b.id })
    if (mode === 'existingZero') w.ai.constructionBase = 0
    w.ai.cursor = 0
    w.turn = 61
    const rng = w.randomState
    stepComputerTasks(w, 3)
    const p = buildingOutsidePoint(buildingPose(b)), expected = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    assert.equal(w.ai.constructionBase, mode === 'ordinary' ? expected : mode === 'existingZero' ? 0 : undefined)
    assert.equal(t.phase, 4)
    assert.equal(w.randomState, rng)
    assert.equal(b.progress, 0, 'accepted plan, not injected completion')
  })

for (const housingOnly of [false, true])
  test(`Mission4 requires two idle people, housing double-count=${housingOnly}`, () => {
    const w = fixture(), braves = w.units.filter(u => u.team === 'green' && u.kind === 'brave')
    for (const u of braves.slice(housingOnly ? 1 : 2)) u.hp = 0
    if (housingOnly) {
      // Controlled command-pool boundary: one idle Brave also has order6.
      const p = braves[0].native ??= createLivePerson(w, braves[0])
      Object.assign(p, { state: 10, commandStatus: 6, immediateCommand: 1 })
      Object.assign(w.buildingOrders.records[1], { model: 6, flags: 0 })
      assert.equal(availableTrainingPeople(computerSelectionWorld(w, 3).world), 2)
    }
    stepComputerTasks(w, 3)
    assert.equal(active(w).length, housingOnly ? 0 : 1)
  })

for (const established of [false, true])
  test(`Mission4 existing Tower with established base=${established}`, () => {
    const w = fixture()
    addBuilding(w, 'green', 'tower', { x: -48, z: -64 }, true)
    if (established) w.ai.constructionBase = 0x34da
    stepComputerTasks(w, 3)
    assert.deepEqual(active(w).map(t => t.requested), established ? [] : [4])
  })

for (const phase of [3, 8])
  test(`Mission4 lost plan preserves first Tower branch despite pending phase${phase}`, () => {
    const w = fixture()
    w.ai.attributes[9] = 2
    requestConstruction(w.ai, 4, 0x36b6)
    w.ai.tasks[0].phase = phase
    stepComputerTasks(w, 3)
    assert.equal(active(w).length, 2)
  })
