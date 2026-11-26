import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'

const matak = 3
const packed = (x, y) => x | (y << 8)
const activeTower = (w, origin) =>
  w.campaignAIs[matak].tasks.find(t =>
    (t.flags & 1) && t.type === 0 && t.requested === 4 && t.origin === origin && t.extra === 1
  )

function setup(phase, population, complete = true) {
  const store = createGameStore()
  store.startMission(11)
  const w = store.getWorld()
  const ai = w.campaignAIs[matak]
  // Give the authored world a mature Hut and the selected later script state;
  // live scheduling, queue, terrain search and building reservation are not stubbed.
  addBuilding(w, 'green', 'hut', nativeCellPoint(packed(128, 220)), complete, { level: 3 })
  const shaman = w.units.find(unit => unit.team === 'green' && unit.kind === 'shaman')
  assert.ok(shaman)
  for (let n = campaignPersonCount(w, matak); n < population; n++) {
    addUnit(w, 'green', 'brave', {
      x: shaman.x + ((n % 5) - 2) * 0.53,
      z: shaman.z + ((n % 7) - 3) * 0.56,
    })
  }
  assert.equal(campaignPersonCount(w, matak), population)
  ai.variables[6] = phase
  w.turn = 252
  return { store, w, ai }
}

function step(w) {
  const before = w.turn
  tick(w, 1 / 12)
  assert.equal(w.turn, before + 1)
}

for (const [phase, population, nextPhase, origin, accepted] of [
  [0, 7, 1, packed(120, 166), packed(120, 164)],
  [1, 7, 2, packed(120, 176), packed(122, 178)],
  [2, 41, 3, packed(90, 196), packed(92, 198)],
  [3, 46, 6, packed(150, 176), packed(152, 178)],
]) {
  test(`M11 Matak phase ${phase} queues one authored tower and reserves real terrain`, async () => {
    const { store, w, ai } = setup(phase, population)
    step(w)
    assert.equal(ai.variables[6], phase)
    assert.equal(activeTower(w, origin), undefined)
    step(w)
    assert.equal(ai.variables[6], nextPhase)
    const task = activeTower(w, origin)
    assert.ok(task)
    assert.equal(task.phase, 0)
    assert.equal(task.entity, 0)
    assert.equal(ai.tasks.filter(t => t.flags & 1 && t.extra === 1 && t.requested === 4).length, 1)
    if (phase === 1) {
      assert.equal(await store.saveCheckpoint(false), false, 'no IndexedDB; only in-session checkpoint')
      assert.ok(store.hasCheckpoint())
    }
    step(w)
    const plan = w.buildings.find(b => b.id === task.entity)
    assert.equal(task.target, accepted)
    assert.deepEqual([plan?.team, plan?.kind, plan?.progress], ['green', 'tower', 0])
    assert.equal(packed(plan.anchor.x >> 8, plan.anchor.y >> 8), accepted)
    assert.ok(plan.preparation)
    assert.equal(ai.variables[6], nextPhase)

    if (phase === 1) {
      assert.equal(store.loadCheckpoint(), true)
      const restored = store.getWorld()
      assert.notEqual(restored, w)
      assert.equal(activeTower(restored, origin)?.phase, 0)
      step(restored)
      assert.deepEqual(restored, w)
    }
  })
}

test('M11 later towers respect the exact population, mature Hut, capacity and terminal gates', () => {
  for (const [phase, population, complete, saturated] of [
    [2, 40, true, false],
    [3, 45, true, false],
    [1, 7, false, false],
    [1, 7, true, true],
    [6, 46, true, false],
  ]) {
    const { w, ai } = setup(phase, population, complete)
    step(w)
    if (saturated) {
      // Leave exactly one free entry before the Matak script visit.
      for (const task of ai.tasks.slice(0, -1)) Object.assign(task, { flags: 1, type: 0, requested: 4 })
      ai.tasks.at(-1).flags = 0
    }
    step(w)
    assert.equal(ai.variables[6], phase)
    assert.equal(ai.tasks.filter(t => t.flags & 1 && t.extra === 1 && t.requested === 4).length, 0)
  }
})

test('M11 unmodified mission produces a second Matak Tower on the next authored visit', { timeout: 35000 }, () => {
  const store = createGameStore()
  store.startMission(11)
  const world = store.getWorld(), ai = world.campaignAIs[matak]
  const secondOrigin = packed(120, 176)
  while (world.turn < 5373) step(world)
  assert.equal(ai.variables[6], 1)
  assert.equal(activeTower(world, secondOrigin), undefined)
  assert.ok(world.buildings.some(b => b.team === 'green' && b.kind === 'hut' && b.level === 3 && b.progress === 1))
  step(world)
  assert.equal(ai.variables[6], 2)
  const task = activeTower(world, secondOrigin)
  assert.ok(task)
  assert.equal(task.phase, 4)
  const plan = world.buildings.find(b => b.id === task.entity)
  assert.ok(plan)
  assert.deepEqual([plan.team, plan.kind, plan.preparation !== undefined], ['green', 'tower', true])
  assert.notEqual(task.target, secondOrigin)
})
