import test from 'node:test'
import assert from 'node:assert/strict'
import {
  browserPosition,
  command,
  createWorld,
  isShaman,
  tick,
} from '../app/model.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import {
  buildingFootprintCells,
  buildingInsidePoint,
  buildingOutsidePoint,
  buildingPose,
} from '../app/building-shapes.ts'
import { entrance } from '../app/live-command.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { worshipApproach } from '../app/worship.ts'
import { stoneHeadAngle } from '../app/stone-head-orientation.ts'

const cell = point => (point.y >> 9) * 128 + (point.x >> 9)

test('Temple training uses the canonical shape doorway rather than crossing its footprint', () => {
  const w = createWorld()
  const temple = addBuilding(w, 'blue', 'temple', { x: 0, z: 20 }, true, {
    angle: Math.PI / 2,
  })
  const pose = buildingPose(temple)
  const outside = buildingOutsidePoint(pose)
  const inside = buildingInsidePoint(pose)
  const footprint = new Set(buildingFootprintCells(pose))

  assert.deepEqual(entrance(w, temple), browserPosition(outside))
  assert.equal(footprint.has(cell(outside)), false)
  assert.equal(footprint.has(cell(inside)), true)
})

test('normal worship approach follows the same canonical stone-head heading as the rendered head', () => {
  const w = createWorld(5)
  w.manaWorld.gameFlags = 32
  const head = w.shrines.find(head => head.kind === 'convertWild')
  const shaman = w.units.find(unit => unit.team === 'blue' && isShaman(unit))
  assert.ok(head)
  assert.ok(shaman)

  const canonicalAngle = Math.round((stoneHeadAngle(head, 5) * 1024) / Math.PI) & 2047
  const pose = worshipHeadPose(w, head)
  const expectedApproach = worshipApproach({ ...pose, angle: canonicalAngle })

  assert.equal(canonicalAngle, 1024, 'retained native scenery heading for the Mission 5 head')
  assert.equal(
    pose.angle,
    canonicalAngle,
    'worship routing must consume the canonical model-9 scenery heading, not the trigger angle'
  )

  w.selected = [shaman.id]
  assert.equal(command(w, head), true)
  tick(w, 1 / 12)
  assert.deepEqual(
    { x: shaman.native.goalX, y: shaman.native.goalY },
    expectedApproach,
    'the normal command-27 route must approach the canonical front of the rendered head'
  )
})
