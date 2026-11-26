import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('a builder clears an active Guard Post follower from an authored flat Hut footprint', async () => {
  const { createWorld, tick, nativePosition } = await loadSceneFixture()
  const { guardPostClick, placeBuilding } = await import('../app/live-command.ts')
  const { setSelection } = await import('../app/selection-runtime.ts')
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  const { BuilderTask } = await import('../app/building-workers.ts')
  const {
    buildingPose,
    buildingModel,
    buildingGradeVertices,
    buildingPlanHeight,
    buildingFootprintCells,
  } = await import('../app/building-shapes.ts')
  const {
    buildingPlanPose, checkBuildingSite, placementError,
  } = await import('../app/construction-runtime.ts')

  const w = createWorld(6, 'scalable')
  const site = { x: 52, z: -60 }
  const guard = w.units.find(unit => unit.id === 281)
  const builder = w.units.find(unit => unit.id === 291)
  const wilds = [348, 349].map(id => w.units.find(unit => unit.id === id))
  assert.ok(guard && builder && wilds.every(Boolean))
  assert.equal(w.status, 'playing')

  const pose = buildingPlanPose(w, 'hut', site)
  const model = buildingModel({ kind: 'hut', level: 1 })
  const footprint = new Set(buildingFootprintCells(pose))
  const gradeVertices = buildingGradeVertices(pose)
  const cell = point => {
    const p = nativePosition(w, point)
    return ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  }
  assert.equal(checkBuildingSite(w, pose, model, 'blue').valid, true)
  assert.equal(placementError(w, 'hut', site), null)
  const grade = buildingPlanHeight(w.land, pose, model, 0, 0)
  assert.equal(grade, 192)
  const checkGround = () => {
    assert.ok(gradeVertices.every(v => w.land.heights[v.index] === grade))
    assert.equal(w.trees.some(tree => tree.logs > 0 && footprint.has(cell(tree))), false)
  }
  checkGround()

  const order = () => guard.native && currentPersonOrder(w.buildingOrders, guard.native)
  setSelection(w, [guard.id])
  assert.equal(guardPostClick(w, { x: 51, z: -59 }), 'placed')
  assert.equal(order()?.model, 11)
  assert.equal(w.objectCells.objects.get(guard.id), guard.native)
  setSelection(w, [builder.id])
  assert.equal(placeBuilding(w, 'hut', site), true)
  const hut = w.buildings.find(b => b.kind === 'hut' && b.builders?.includes(builder.id))
  assert.ok(hut?.preparation)
  assert.deepEqual(new Set(buildingFootprintCells(buildingPose(hut))), footprint)
  const advanceTo = turn => {
    while (w.turn < turn) {
      const before = w.turn
      tick(w, 1 / 12)
      assert.equal(w.turn, before + 1)
    }
  }
  const checkPreparation = () => {
    assert.equal(hut.preparation?.height, grade)
    assert.equal(hut.preparation?.work, 100)
    checkGround()
  }
  const wildState = () => wilds.map(unit => [
    unit.id, unit.team, cell(unit), unit.hp, unit.inside, unit.work, unit.native,
  ])
  const wildBefore = wildState()
  assert.deepEqual(wildBefore, [
    [348, 'wild', 3358, 50, null, null, null],
    [349, 'wild', 3358, 50, null, null, null],
  ])

  advanceTo(191)
  assert.equal(builder.builder?.task, BuilderTask.ClearPeople)
  assert.equal(builder.builder?.phase, 14) // Find, before the eligible t192 tick.
  checkPreparation()
  advanceTo(192)
  assert.equal(builder.builder?.phase, 15) // Approach; the destination also has another Blue occupant.
  assert.deepEqual([builder.builder?.person?.goalX, builder.builder?.person?.goalY], [15104, 13056])

  advanceTo(216)
  assert.equal(builder.builder?.phase, 5) // Resting beside the occupied cell, before Clear.
  assert.equal(cell(guard), 3229)
  assert.equal(guard.native?.state, 10)
  assert.equal(w.objectCells.objects.get(guard.id), guard.native)
  assert.deepEqual([order()?.model, order()?.flags, order()?.references], [11, 0, 1])
  assert.deepEqual(wildState(), wildBefore)

  advanceTo(224)
  assert.equal(builder.builder?.task, BuilderTask.ClearPeople)
  assert.equal(builder.builder?.phase, 4)
  assert.equal(guard.native, null, 'the old Guard Post command is retired by clearing')
  assert.deepEqual(wildState(), wildBefore)
  checkPreparation()

  advanceTo(232)
  assert.equal(cell(guard), 3102)
  assert.equal(footprint.has(cell(guard)), false)
  assert.equal(guard.hp, 50)
  assert.equal(order()?.model, undefined)
  assert.deepEqual(wildState(), wildBefore)
  checkPreparation()
})
