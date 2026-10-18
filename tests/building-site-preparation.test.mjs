import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { addBuilding, checkBuildingSite, prepareBuildingSiteCheck } from '../app/construction-runtime.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

const poses = Array.from({ length: 80 }, (_, i) => ({
  object: rules.buildingObjects[1], angle: (i & 3) * 512,
  anchorX: ((i * 7) & 127) * 512, anchorY: ((i * 11) & 127) * 512,
}))

function compareBatch(actual, expected) {
  const check = prepareBuildingSiteCheck(actual, 'red')
  for (const [i, pose] of poses.entries()) {
    assert.deepEqual(check(pose, 1), checkBuildingSite(expected, pose, 1, 'red'), `proposal ${i}`)
    assert.deepEqual(actual, expected, `entire world after proposal ${i}`)
  }
}

test('prepared proposals preserve each result, flags and all synchronization side effects', () => {
  const actual = createWorld(6), expected = createWorld(6)
  compareBatch(actual, expected)
  const stable = structuredClone(actual)
  for (let i = 0; i < 3; i++) syncLandscapeObjects(actual)
  assert.deepEqual(actual, stable, 'unchanged repeated synchronization is state-idempotent')
})

test('new preparation sees tree, shrine, terrain and building changes between batches', () => {
  const actual = createWorld(6), expected = createWorld(6)
  const edits = [
    w => { w.trees[0].logs = 0 },
    w => { w.trees.push({ ...w.trees[1], id: w.nextId++, x: 5, z: -9, model: 11, logs: 1 }) },
    w => { w.trees[1].x += 2; w.trees[1].flags4 = 0x100000 },
    w => { w.land.heights[0] += 80; w.land.flags[100] ^= 0x10000 },
    w => { w.terrain[0] += 1; w.terrainVersion++ },
    w => { if (w.shrines.length) w.shrines[0].x += 2 },
    w => { addBuilding(w, 'red', 'hut', { x: 8, z: -8 }, true) },
    w => { w.buildings.at(-1).hp = 0 },
  ]
  compareBatch(actual, expected)
  for (const edit of edits) {
    edit(actual); edit(expected)
    compareBatch(actual, expected)
  }
})

test('failure flags are reset for every proposal and public checks remain fresh', () => {
  const w = createWorld(6)
  w.land.flags.fill(0x10000)
  const rejected = prepareBuildingSiteCheck(w, 'red')
  assert.ok(rejected(poses[0], 1).flags)
  // Own a new batch after mutation, never reuse the rejected snapshot.
  w.land.flags.fill(0)
  const next = prepareBuildingSiteCheck(w, 'red')
  for (const pose of poses) assert.deepEqual(next(pose, 1), checkBuildingSite(w, pose, 1, 'red'))
  w.land.flags.fill(0x4000000)
  assert.equal(checkBuildingSite(w, poses[0], 1, 'red').flags & 0x8000000, 0x8000000)
})
