import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, placeBuilding, rotateBuildingPlan, select, tick } from '../app/model.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'

function mission() {
  const world = createWorld(6)
  while (world.turn < 430) tick(world, 1 / 12)
  assert.equal(world.inputMask, 0)
  assert.equal(world.status, 'playing')
  return world
}

// Supply the already chosen HUD icon, not a browser keyboard gesture.
// Rotation, placement, object identity, worker registration and paths are real.
function hutAtM6(world, rotate) {
  const pos = { x: 62, z: -61 }
  select(world, 'brave')
  world.mode = 'hut'
  if (rotate) assert.equal(rotateBuildingPlan(world), true)
  assert.ok(placeBuilding(world, 'hut', pos))
  const hut = world.buildings.at(-1)
  assert.deepEqual(
    [hut.id, hut.team, hut.kind, hut.progress, hut.anchor],
    [358, 'blue', 'hut', 0, { x: 17920, y: 13312 }]
  )
  const workers = world.units.filter(unit => unit.work === hut.id)
  assert.deepEqual(workers.map(unit => unit.id), [281, 282, 289, 290, 291, 292])
  return {
    angle: hut.angle,
    entrance: buildingOutsidePoint(buildingPose(hut)),
    destinations: workers.map(unit => unit.path.at(-1)),
  }
}

test('an ordinary M6 Hut plan uses the rotated icon direction for real worker routes', () => {
  assert.deepEqual(hutAtM6(mission(), false), {
    angle: 0,
    entrance: { x: 18176, y: 12672 },
    destinations: Array(6).fill({ x: 63, z: -57.5 }),
  })
  assert.deepEqual(hutAtM6(mission(), true), {
    angle: Math.PI / 2,
    entrance: { x: 17280, y: 13568 },
    destinations: Array(6).fill({ x: 59.5, z: -61 }),
  })
})

test('plan rotation wraps its active icon and retains the other icon direction', () => {
  const world = mission()
  assert.equal(world.mode, null)
  assert.equal(rotateBuildingPlan(world), false)
  assert.deepEqual([world.buildingDirections.hut, world.buildingDirections.camp], [0, 0])
  world.mode = 'hut'
  for (const expected of [1, 2, 3, 0, 1]) {
    assert.equal(rotateBuildingPlan(world), true)
    assert.equal(world.buildingDirections.hut, expected)
    assert.equal(world.buildingDirections.camp, 0)
  }
  world.mode = 'camp'
  assert.equal(rotateBuildingPlan(world), true)
  assert.equal(rotateBuildingPlan(world), true)
  world.mode = 'hut'
  assert.equal(rotateBuildingPlan(world), true)
  assert.deepEqual([world.buildingDirections.hut, world.buildingDirections.camp], [2, 2])
})
