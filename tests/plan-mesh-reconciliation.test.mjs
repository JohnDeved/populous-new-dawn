// Actual building-frame and plan geometry in Node with controlled lifecycle states.
// Scaling uses preparation-only populations: completed-building cleanup is unchanged.
// No ordinary gameplay, browser/GPU, native raster or hardware timing claim.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makePlanScene } from './support/plan-scene.mjs'

async function worldWithPlans(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22)
  world.buildings = []
  // The shipped placement path uses this maintained initializer with plan:true.
  // Copies below are explicit diagnostic populations, not player-placed buildings.
  const template = api.addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, false, { plan: true })
  assert.ok(template.preparation)
  world.buildings = Array.from({ length: count }, () => ({
    ...structuredClone(template),
    id: world.nextId++,
  }))
  return { api, world }
}

function observePlanCleanup(scene) {
  const events = [],
    drop = scene.plans.delete.bind(scene.plans)
  for (const [id, mesh] of scene.plans) {
    const remove = mesh.removeFromParent.bind(mesh)
    mesh.removeFromParent = () => {
      events.push(['remove', id])
      return remove()
    }
    mesh.geometry.addEventListener('dispose', () => events.push(['geometry', id]))
  }
  scene.plans.delete = id => {
    events.push(['delete', id])
    return drop(id)
  }
  return events
}

test('plan cleanup preserves ordered geometry disposal, shared cursor material and survivor identity', async () => {
  const { world } = await worldWithPlans(4),
    [a, b, c, d] = world.buildings,
    fixture = await makePlanScene(world)
  let onSharedDispose
  try {
    fixture.render()
    const original = new Map(fixture.scene.plans),
      events = observePlanCleanup(fixture.scene)
    let sharedDisposals = 0
    onSharedDispose = () => sharedDisposals++
    fixture.scene.cursor.material.addEventListener('dispose', onSharedDispose)
    for (const mesh of original.values()) {
      assert.equal(mesh.material, fixture.scene.cursor.material)
      assert.ok(mesh.geometry.getAttribute('position').count > 0)
      assert.equal(mesh.parent, fixture.scene.ground)
    }
    const spawned = { ...structuredClone(b), id: world.nextId++ }
    world.buildings = [c, a, spawned]
    const before = structuredClone(world)
    fixture.render()
    assert.deepEqual(
      events,
      [b, d].flatMap(v => [
        ['remove', v.id],
        ['geometry', v.id],
        ['delete', v.id],
      ])
    )
    assert.equal(sharedDisposals, 0)
    assert.equal(fixture.scene.plans.get(a.id), original.get(a.id))
    assert.equal(fixture.scene.plans.get(c.id), original.get(c.id))
    assert.deepEqual([...fixture.scene.plans.keys()], [a.id, c.id, spawned.id])
    assert.equal(original.get(b.id).parent, null)
    assert.equal(original.get(d.id).parent, null)
    assert.equal(fixture.scene.plans.get(spawned.id).material, fixture.scene.cursor.material)
    assert.deepEqual(
      world,
      before,
      'actual plan geometry preserves land.flags and all world/RNG data'
    )
    events.length = 0
    fixture.render()
    assert.deepEqual(events, [])
    assert.deepEqual(world, before)
  } finally {
    if (onSharedDispose)
      fixture.scene.cursor.material.removeEventListener('dispose', onSharedDispose)
    fixture.close()
  }
})

test('plan pose and terrain signatures refresh actual geometry while retaining the same mesh', async () => {
  const { world } = await worldWithPlans(1),
    building = world.buildings[0],
    fixture = await makePlanScene(world)
  try {
    fixture.render()
    const mesh = fixture.scene.plans.get(building.id),
      first = mesh.geometry,
      positions = [...first.getAttribute('position').array]
    let firstDisposals = 0
    first.addEventListener('dispose', () => firstDisposals++)
    fixture.render()
    assert.equal(mesh.geometry, first)
    assert.equal(firstDisposals, 0)
    building.anchor.x += 512
    const moved = structuredClone(world)
    fixture.render()
    const second = mesh.geometry
    assert.equal(fixture.scene.plans.get(building.id), mesh)
    assert.notEqual(second, first)
    assert.equal(firstDisposals, 1)
    assert.notDeepEqual([...second.getAttribute('position').array], positions)
    assert.deepEqual(world, moved)
    let secondDisposals = 0
    second.addEventListener('dispose', () => secondDisposals++)
    world.terrainVersion++
    const terrain = structuredClone(world)
    fixture.render()
    assert.equal(fixture.scene.plans.get(building.id), mesh)
    assert.notEqual(mesh.geometry, second)
    assert.equal(secondDisposals, 1)
    assert.deepEqual(
      [...mesh.geometry.getAttribute('position').array],
      [...second.getAttribute('position').array]
    )
    assert.deepEqual(world, terrain)
    const third = mesh.geometry
    fixture.render()
    assert.equal(mesh.geometry, third)
    assert.equal(firstDisposals, 1)
    assert.equal(secondDisposals, 1)
  } finally {
    fixture.close()
  }
})

test('preparation to built and built to preparation retain the unchanged full building caller lifecycle', async () => {
  const { world } = await worldWithPlans(1),
    building = world.buildings[0],
    preparation = structuredClone(building.preparation),
    fixture = await makePlanScene(world)
  try {
    fixture.render()
    const mesh = fixture.scene.plans.get(building.id)
    let planDisposals = 0
    mesh.geometry.addEventListener('dispose', () => planDisposals++)
    delete building.preparation
    building.progress = 1
    const built = structuredClone(world)
    fixture.render()
    assert.equal(fixture.scene.plans.size, 0)
    assert.equal(mesh.parent, null)
    assert.equal(planDisposals, 1)
    const group = fixture.scene.buildingMeshes.get(building.id)
    assert.ok(group)
    assert.equal(group.parent, fixture.scene.objects)
    assert.equal(group.userData.building, building.id)
    assert.equal(group.rotation.y, -building.angle)
    assert.deepEqual(world, built, 'controlled red hut has no unrelated occupancy/Shake producer')
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(building.id), group)
    assert.equal(planDisposals, 1)
    let modelDisposals = 0
    group.children[0].geometry.addEventListener('dispose', () => modelDisposals++)
    building.preparation = preparation
    building.progress = 0
    const preparing = structuredClone(world)
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.size, 0)
    assert.equal(group.parent, null)
    assert.equal(modelDisposals, 1)
    const replacement = fixture.scene.plans.get(building.id)
    assert.notEqual(replacement, mesh)
    assert.equal(replacement.parent, fixture.scene.ground)
    assert.equal(replacement.material, fixture.scene.cursor.material)
    assert.deepEqual(world, preparing)
    fixture.render()
    assert.equal(fixture.scene.plans.get(building.id), replacement)
    assert.equal(modelDisposals, 1)
  } finally {
    fixture.close()
  }
})

test('plan membership observes migrated NaN IDs, in-place IDs, loaded worlds and independent Scenes', async () => {
  const { api, world } = await worldWithPlans(2)
  world.buildings[0].id = NaN
  const restored = api.migrateCheckpoint(structuredClone(world))
  assert.ok(restored)
  assert.ok(Number.isNaN(restored.buildings[0].id))
  const before = structuredClone(restored),
    fixture = await makePlanScene(restored)
  let other
  try {
    fixture.render()
    let previous = fixture.scene.plans.get(NaN)
    const survivor = fixture.scene.plans.get(restored.buildings[1].id)
    for (let frame = 0; frame < 3; frame++) {
      let disposals = 0
      previous.geometry.addEventListener('dispose', () => disposals++)
      fixture.render()
      const replacement = fixture.scene.plans.get(NaN)
      assert.notEqual(replacement, previous)
      assert.equal(previous.parent, null)
      assert.equal(disposals, 1)
      assert.equal(fixture.scene.plans.get(restored.buildings[1].id), survivor)
      assert.deepEqual(restored, before)
      previous = replacement
    }
    restored.buildings = [restored.buildings[1]]
    const oldId = restored.buildings[0].id
    restored.buildings[0].id = restored.nextId++
    fixture.render()
    assert.equal(fixture.scene.plans.has(oldId), false)
    assert.equal(survivor.parent, null)
    const loaded = api.migrateCheckpoint(structuredClone(restored)),
      loadedBefore = structuredClone(loaded),
      cached = fixture.scene.plans.get(loaded.buildings[0].id)
    fixture.scene.world = loaded
    fixture.render()
    assert.equal(fixture.scene.plans.get(loaded.buildings[0].id), cached)
    other = await makePlanScene(loaded)
    other.render()
    const independent = other.scene.plans.get(loaded.buildings[0].id)
    assert.notEqual(independent, cached)
    fixture.scene.world = { ...loaded, buildings: [] }
    fixture.render()
    assert.equal(fixture.scene.plans.size, 0)
    assert.equal(fixture.scene.ground.children.length, 0)
    other.render()
    assert.equal(other.scene.plans.get(loaded.buildings[0].id), independent)
    fixture.scene.world = loaded
    fixture.render()
    assert.deepEqual(loaded, loadedBefore)
  } finally {
    other?.close()
    fixture.close()
  }
})

test('preparation-only full building caller has linear plan ID reads with stale plans', async t => {
  const rows = []
  for (const count of [64, 256, 1024]) {
    const { world } = await worldWithPlans(count),
      fixture = await makePlanScene(world)
    try {
      fixture.render()
      assert.equal(
        fixture.scene.buildingMeshes.size,
        0,
        'completed-building cleanup is outside this population'
      )
      const meshes = [...fixture.scene.plans.values()]
      let reads = 0
      for (const b of world.buildings) {
        const id = b.id
        Object.defineProperty(b, 'id', {
          enumerable: true,
          configurable: true,
          get: () => {
            reads++
            return id
          },
        })
      }
      const oldMembershipReads = ids => {
        reads = 0
        for (const id of ids) world.buildings.some(b => b.id === id && b.preparation)
        return reads
      }
      const survivorBaseline = oldMembershipReads(fixture.scene.plans.keys())
      assert.equal(survivorBaseline, (count * (count + 1)) / 2)
      reads = 0
      fixture.render()
      const survivorFrame = reads
      assert.ok(survivorFrame <= count * 3, `${count} preparation plans: ${survivorFrame} ID reads`)
      assert.deepEqual([...fixture.scene.plans.values()], meshes)
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), fixture.scene.cursor.material)
        fixture.scene.plans.set(-(i + 1), mesh)
        fixture.scene.ground.add(mesh)
      }
      const mixedBaseline = oldMembershipReads(fixture.scene.plans.keys())
      assert.equal(mixedBaseline, (count * (count + 1)) / 2 + count * count)
      reads = 0
      fixture.render()
      const mixedFrame = reads
      assert.ok(
        mixedFrame <= count * 3,
        `${count} preparation + stale plans: ${mixedFrame} ID reads`
      )
      assert.deepEqual([...fixture.scene.plans.values()], meshes)
      rows.push({ count, survivorBaseline, survivorFrame, mixedBaseline, mixedFrame })
    } finally {
      fixture.close()
    }
  }
  for (let i = 1; i < rows.length; i++) {
    assert.equal(rows[i].survivorFrame, rows[i - 1].survivorFrame * 4)
    assert.equal(rows[i].mixedFrame, rows[i - 1].mixedFrame * 4)
  }
  t.diagnostic(
    JSON.stringify({
      planIdReads: rows,
      scope:
        'Node full building caller, preparation-only population, completed-building mesh map empty; no whole-caller/browser/hardware performance claim',
    })
  )
})
