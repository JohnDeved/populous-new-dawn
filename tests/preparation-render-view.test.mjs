// Actual building frame/plan geometry/resource route. Controlled observers and
// cloned plans diagnose eager snapshots and the filter-result Array boundary;
// this is not ordinary browser/native/hardware or backing-storage evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makePlanScene } from './support/plan-scene.mjs'

async function plans(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22)
  world.buildings = []
  // The shipped placement command uses this maintained initializer with plan:true.
  // The copies are explicit diagnostic populations rather than player placement.
  const template = api.addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, false, { plan: true })
  assert.ok(template.preparation)
  world.buildings = Array.from({ length: count }, (_, index) => ({
    ...structuredClone(template),
    id: world.nextId++,
    anchor: { x: (4096 + index * 512) & 65535, y: 4096 },
  }))
  return { api, world }
}

const poseAnchor = pose => [pose.anchorX, pose.anchorY]

// Observe the actual planGeometry result without replacing its geometry/terrain
// computation. A supplied callback is an explicit snapshot diagnostic only.
function geometryObserver(scene, observe) {
  const original = scene.planGeometry,
    calls = []
  scene.planGeometry = function (pose, ...args) {
    const result = original.call(this, pose, ...args)
    calls.push(poseAnchor(pose))
    observe?.(pose)
    return result
  }
  return calls
}

// Delegate the original Array method exactly, retaining its result unchanged.
function filterObserver(array) {
  assert.equal(Object.getPrototypeOf(array), Array.prototype)
  assert.equal(Object.hasOwn(array, 'filter'), false)
  const original = Array.prototype.filter,
    results = []
  const observe = function (...args) {
    const result = original.apply(this, args)
    results.push(result)
    return result
  }
  Object.defineProperty(array, 'filter', { configurable: true, value: observe })
  return {
    results,
    observe,
    close: () => {
      delete array.filter
    },
  }
}

test('preparation snapshot sees actual stale-geometry disposal edits after cleanup and before the first plan draw', async () => {
  const { api, world } = await plans(3),
    [survivor, stale, retired] = world.buildings,
    fixture = await makePlanScene(world)
  let onCursorDispose
  try {
    fixture.render()
    const survivorMesh = fixture.scene.plans.get(survivor.id),
      staleMesh = fixture.scene.plans.get(stale.id),
      retiredMesh = fixture.scene.plans.get(retired.id),
      spawned = { ...structuredClone(retired), id: world.nextId++, anchor: { x: 8192, y: 4096 } }
    world.buildings = [survivor]
    const expected = structuredClone(world)
    delete expected.buildings[0].preparation
    expected.buildings[0].progress = 1
    expected.buildings.push(structuredClone(spawned))
    let staleDisposals = 0,
      retiredDisposals = 0,
      cursorDisposals = 0
    onCursorDispose = () => cursorDisposals++
    fixture.scene.cursor.material.addEventListener('dispose', onCursorDispose)
    staleMesh.geometry.addEventListener('dispose', () => {
      staleDisposals++
      delete survivor.preparation
      survivor.progress = 1
      world.buildings = [survivor, spawned]
    })
    retiredMesh.geometry.addEventListener('dispose', () => retiredDisposals++)
    const calls = geometryObserver(fixture.scene)
    fixture.render()
    assert.equal(staleDisposals, 1, 'observer ran inside maintained stale plan geometry disposal')
    assert.equal(retiredDisposals, 1)
    assert.equal(cursorDisposals, 0, 'plan teardown must retain the shared cursor material')
    assert.deepEqual(
      calls,
      [poseAnchor(api.buildingPose(spawned))],
      'snapshot follows the cleanup edit'
    )
    assert.equal(staleMesh.parent, null)
    assert.equal(retiredMesh.parent, null)
    assert.equal(
      fixture.scene.plans.get(survivor.id),
      survivorMesh,
      'the earlier membership snapshot precedes the diagnostic disposal callback'
    )
    assert.deepEqual([...fixture.scene.plans.keys()], [survivor.id, spawned.id])
    const spawnedMesh = fixture.scene.plans.get(spawned.id),
      builtGroup = fixture.scene.buildingMeshes.get(survivor.id)
    assert.equal(spawnedMesh.parent, fixture.scene.ground)
    assert.equal(spawnedMesh.material, fixture.scene.cursor.material)
    assert.ok(builtGroup, 'the later completed phase observes the changed current World')
    assert.equal(builtGroup.parent, fixture.scene.objects)
    assert.equal(
      builtGroup.userData.hutOccupancySmoke,
      undefined,
      'controlled red hut has no blue occupancy producer'
    )
    assert.deepEqual(
      world,
      expected,
      'only injected changes occurred; land.flags and both RNG owners remain equal'
    )
    let survivorDisposals = 0
    survivorMesh.geometry.addEventListener('dispose', () => survivorDisposals++)
    calls.length = 0
    fixture.render()
    assert.deepEqual(calls, [])
    assert.equal(survivorDisposals, 1)
    assert.equal(survivorMesh.parent, null)
    assert.equal(fixture.scene.plans.get(spawned.id), spawnedMesh)
    assert.equal(fixture.scene.buildingMeshes.get(survivor.id), builtGroup)
    assert.equal(cursorDisposals, 0)
    assert.deepEqual(world, expected)
  } finally {
    if (onCursorDispose)
      fixture.scene.cursor.material.removeEventListener('dispose', onCursorDispose)
    fixture.close()
  }
})

test('preparation view captures ordered eligibility before planGeometry while pose and later completed phase see current records', async () => {
  const { api, world } = await plans(4),
    [first, later, dormant, retired] = world.buildings,
    preparation = structuredClone(dormant.preparation),
    fixture = await makePlanScene(world)
  delete dormant.preparation
  dormant.progress = 1
  try {
    fixture.render()
    const meshes = new Map(fixture.scene.plans),
      dormantGroup = fixture.scene.buildingMeshes.get(dormant.id),
      appended = { ...structuredClone(first), id: world.nextId++, anchor: { x: 10240, y: 4096 } }
    // A controlled terrain-version change invalidates existing plan geometry. The
    // diagnostic edits below happen inside the first actual draw computation.
    world.terrainVersion++
    const expected = structuredClone(world)
    delete expected.buildings[1].preparation
    expected.buildings[1].progress = 1
    expected.buildings[1].anchor.x += 512
    expected.buildings[2].preparation = structuredClone(preparation)
    expected.buildings[2].progress = 0
    delete expected.buildings[3].preparation
    expected.buildings[3].progress = 1
    expected.buildings.push(structuredClone(appended))
    // The unchanged completed draw first consumes the now-completed later
    // record through nativePosition, which reconciles the stale terrain cache.
    // Exercise that maintained owner on the expected clone without suppressing
    // the actual frame's sync or excluding any World fields from comparison.
    const { nativePosition } = await import('../app/world-terrain-runtime.ts'),
      expectedLand = structuredClone(expected.land),
      expectedRng = [expected.randomState, expected.cosmeticRandom.randomState]
    assert.notEqual(expected.landVersion, expected.terrainVersion)
    nativePosition(expected, expected.buildings[1])
    assert.equal(expected.landVersion, expected.terrainVersion)
    assert.deepEqual(
      expected.land,
      expectedLand,
      'this unchanged-height input preserves land flags'
    )
    assert.deepEqual([expected.randomState, expected.cosmeticRandom.randomState], expectedRng)
    let changed = false
    const firstAnchor = poseAnchor(api.buildingPose(first)),
      calls = geometryObserver(fixture.scene, pose => {
        if (changed || pose.anchorX !== firstAnchor[0] || pose.anchorY !== firstAnchor[1]) return
        changed = true
        delete later.preparation
        later.progress = 1
        later.anchor.x += 512
        dormant.preparation = structuredClone(preparation)
        dormant.progress = 0
        delete retired.preparation
        retired.progress = 1
        world.buildings.push(appended)
      })
    fixture.render()
    assert.deepEqual(
      calls,
      [firstAnchor, poseAnchor(api.buildingPose(later)), poseAnchor(api.buildingPose(retired))],
      'captured plan eligibility/order survive draw-time edits; live records supply the updated pose'
    )
    assert.equal(fixture.scene.plans.has(dormant.id), false)
    assert.equal(fixture.scene.plans.has(appended.id), false)
    assert.equal(fixture.scene.plans.get(first.id), meshes.get(first.id))
    assert.equal(fixture.scene.plans.get(later.id), meshes.get(later.id))
    assert.equal(fixture.scene.plans.get(retired.id), meshes.get(retired.id))
    assert.equal(
      meshes.get(later.id).userData.signature,
      [
        api.buildingPose(later).object,
        api.buildingPose(later).angle,
        later.anchor.x,
        later.anchor.y,
        world.terrainVersion,
      ].join(',')
    )
    assert.equal(
      dormantGroup.parent,
      null,
      'completed cleanup sees current preparation after plan drawing'
    )
    const laterGroup = fixture.scene.buildingMeshes.get(later.id),
      retiredGroup = fixture.scene.buildingMeshes.get(retired.id)
    assert.ok(
      laterGroup && retiredGroup,
      'the completed draw phase consumes current truthiness normally'
    )
    assert.equal(laterGroup.userData.hutOccupancySmoke, undefined)
    assert.equal(retiredGroup.userData.hutOccupancySmoke, undefined)
    assert.deepEqual(
      world,
      expected,
      'red diagnostic transitions preserve the remaining full World and RNG state'
    )
    calls.length = 0
    fixture.render()
    assert.deepEqual(calls, [
      poseAnchor(api.buildingPose(dormant)),
      poseAnchor(api.buildingPose(appended)),
    ])
    assert.equal(meshes.get(later.id).parent, null)
    assert.equal(meshes.get(retired.id).parent, null)
    assert.equal(fixture.scene.plans.get(first.id), meshes.get(first.id))
    assert.equal(fixture.scene.buildingMeshes.get(later.id), laterGroup)
    assert.equal(fixture.scene.buildingMeshes.get(retired.id), retiredGroup)
    assert.equal(fixture.scene.plans.get(dormant.id).material, fixture.scene.cursor.material)
    assert.equal(fixture.scene.plans.get(appended.id).material, fixture.scene.cursor.material)
    assert.deepEqual(world, expected)
  } finally {
    fixture.close()
  }
})

test('repeated actual preparation-only building frames remove filter-result Array creation; other phases are excluded', async t => {
  for (const population of [64, 256, 1024]) {
    const { api, world } = await plans(population),
      fixture = await makePlanScene(world)
    let watch
    try {
      fixture.render()
      assert.equal(
        fixture.scene.buildingMeshes.size,
        0,
        'completed-building mesh population remains empty'
      )
      assert.equal(
        fixture.scene.hutSmokePuffs.size,
        0,
        'quiet actual fixture produced no smoke children'
      )
      const originalMeshes = [...fixture.scene.plans.values()]
      let idReads = 0
      for (const building of world.buildings) {
        const { id } = building
        Object.defineProperty(building, 'id', {
          configurable: true,
          enumerable: true,
          get: () => {
            idReads++
            return id
          },
        })
      }
      watch = filterObserver(world.buildings)
      const rows = []
      for (let frame = 0; frame < 3; frame++) {
        const before = structuredClone(world)
        idReads = 0
        fixture.render()
        const fullCallerBuildingIdReads = idReads
        assert.equal(
          fullCallerBuildingIdReads,
          population * 2,
          'existing preparation-only linear ID boundary remains'
        )
        assert.deepEqual([...fixture.scene.plans.values()], originalMeshes)
        assert.equal(world.buildings.filter, watch.observe)
        assert.equal(fixture.scene.buildingMeshes.size, 0)
        assert.equal(fixture.scene.hutSmokePuffs.size, 0)
        assert.deepEqual(
          world,
          before,
          'plan geometry preserves all land.flags, World and both RNG owners'
        )
        rows.push(fullCallerBuildingIdReads)
      }
      t.diagnostic(
        JSON.stringify({
          kind: 'preparation-filter-result-array-boundary',
          population,
          frames: 3,
          fullCallerBuildingIdReads: rows,
          filterResultArrayObjects: watch.results.length,
          filterResultElements: watch.results.reduce((sum, result) => sum + result.length, 0),
          scope:
            'Preparation-only, completed map empty, quiet smoke; filter-result Array object only, no whole-frame/backing-store/GC/browser/hardware claim',
        })
      )
      assert.equal(
        watch.results.length,
        0,
        `actual preparation frame created ${watch.results.length} filter-result arrays at population ${population}`
      )
      watch.close()
      watch = undefined
      // The same Scene must overwrite/truncate its view after replacement/load,
      // empty and refill. A second independent Scene cannot share the scratch view.
      const loaded = api.migrateCheckpoint(structuredClone(world)),
        other = await makePlanScene(loaded)
      try {
        const expectedLoaded = structuredClone(loaded)
        other.render()
        const independent = [...other.scene.plans.values()]
        assert.notEqual(independent[0], originalMeshes[0])
        assert.deepEqual(loaded, expectedLoaded)
        fixture.scene.world = { ...structuredClone(world), buildings: [] }
        const empty = structuredClone(fixture.scene.world)
        fixture.render()
        assert.equal(fixture.scene.plans.size, 0)
        assert.equal(fixture.scene.ground.children.length, 0)
        assert.equal(fixture.scene.buildingMeshes.size, 0)
        assert.deepEqual(fixture.scene.world, empty)
        other.render()
        assert.deepEqual([...other.scene.plans.values()], independent)
        assert.deepEqual(loaded, expectedLoaded)
        fixture.scene.world = loaded
        fixture.render()
        assert.equal(fixture.scene.plans.size, population)
        assert.equal(fixture.scene.buildingMeshes.size, 0)
        assert.equal(fixture.scene.plans.get(loaded.buildings[0].id).parent, fixture.scene.ground)
        assert.deepEqual(loaded, expectedLoaded)
      } finally {
        other.close()
      }
    } finally {
      watch?.close()
      fixture.close()
    }
  }
})
