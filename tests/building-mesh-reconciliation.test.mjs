import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
// Actual completed-building frame/factory/Scene transforms and resource cleanup.
// Controlled populations/transitions; fullHutScene retains actual command8 admission.
// No ordinary browser gameplay, native raster or hardware timing claim.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makePlanScene } from './support/plan-scene.mjs'
import { fullHutScene } from './support/hut-smoke-scene.mjs'

async function worldWithBuildings(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22)
  world.buildings = []
  world.units = []
  // Maintained initializer used by shipped placement; copies are diagnostic only.
  const template = api.addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, true, {
    angle: Math.PI / 2,
  })
  world.buildings = Array.from({ length: count }, () => ({
    ...structuredClone(template),
    id: world.nextId++,
  }))
  assert.deepEqual(world.secondaryEffects.order, [])
  return { api, world }
}

function observeCleanup(scene) {
  const events = [],
    remove = scene.objects.remove.bind(scene.objects),
    release = scene.releaseGroup,
    drop = scene.buildingMeshes.delete.bind(scene.buildingMeshes)
  scene.objects.remove = group => {
    events.push(['remove', group.userData.building])
    return remove(group)
  }
  scene.releaseGroup = group => {
    events.push(['release', group.userData.building])
    release(group)
  }
  scene.buildingMeshes.delete = id => {
    events.push(['delete', id])
    return drop(id)
  }
  return events
}

test('completed cleanup preserves ordered disposal, shared atlas, survivor identity and Scene transforms', async () => {
  const { world } = await worldWithBuildings(4),
    [a, b, c, d] = world.buildings,
    fixture = await makePlanScene(world)
  let sharedMap, onSharedDispose
  try {
    fixture.render()
    const original = new Map(fixture.scene.buildingMeshes),
      events = observeCleanup(fixture.scene),
      disposed = []
    sharedMap = original.get(a.id).children[0].material.map
    let sharedDisposals = 0
    onSharedDispose = () => sharedDisposals++
    sharedMap.addEventListener('dispose', onSharedDispose)
    for (const v of [b, d]) {
      const mesh = original.get(v.id).children[0]
      assert.equal(mesh.material.map, sharedMap)
      mesh.geometry.addEventListener('dispose', () => disposed.push(`${v.id}:geometry`))
      mesh.material.addEventListener('dispose', () => disposed.push(`${v.id}:material`))
    }
    const spawned = { ...structuredClone(b), id: world.nextId++ }
    world.buildings = [c, a, spawned]
    const before = structuredClone(world)
    fixture.render()
    assert.deepEqual(
      events,
      [b, d].flatMap(v => [
        ['remove', v.id],
        ['release', v.id],
        ['delete', v.id],
      ])
    )
    assert.deepEqual(disposed, [
      `${b.id}:geometry`,
      `${b.id}:material`,
      `${d.id}:geometry`,
      `${d.id}:material`,
    ])
    assert.equal(sharedDisposals, 0)
    assert.equal(fixture.scene.buildingMeshes.get(a.id), original.get(a.id))
    assert.equal(fixture.scene.buildingMeshes.get(c.id), original.get(c.id))
    assert.deepEqual([...fixture.scene.buildingMeshes.keys()], [a.id, c.id, spawned.id])
    for (const v of [b, d]) assert.equal(original.get(v.id).parent, null)
    const group = fixture.scene.buildingMeshes.get(spawned.id)
    assert.equal(group.parent, fixture.scene.objects)
    assert.deepEqual(group.position.toArray(), [
      spawned.x,
      Math.round(spawned.foundation * 45) / 128,
      spawned.z,
    ])
    assert.equal(group.rotation.y, -spawned.angle)
    assert.equal(group.userData.nativeHeading, Math.round((spawned.angle * 1024) / Math.PI) & 2047)
    assert.deepEqual(
      world,
      before,
      'controlled red population preserves full World and both RNG owners'
    )
    events.length = 0
    fixture.render()
    assert.deepEqual(events, [])
    assert.equal(disposed.length, 4, 'owned stale resources dispose once')
    assert.deepEqual(world, before)
  } finally {
    if (onSharedDispose) sharedMap.removeEventListener('dispose', onSharedDispose)
    fixture.close()
  }
})

test('completed stage and resource signatures retain replacement and cached output without added health bars', async () => {
  const { api, world } = await worldWithBuildings(1),
    building = world.buildings[0],
    fixture = await makePlanScene(world)
  try {
    fixture.render()
    const first = fixture.scene.buildingMeshes.get(building.id)
    let disposals = 0
    first.children[0].geometry.addEventListener('dispose', () => disposals++)
    building.progress = 0.5
    const staged = structuredClone(world)
    fixture.render()
    const second = fixture.scene.buildingMeshes.get(building.id)
    assert.notEqual(second, first)
    assert.notEqual(second.userData.signature, first.userData.signature)
    assert.equal(first.parent, null)
    assert.equal(disposals, 1)
    assert.equal(second.children[0].userData.stage, api.buildingStage(building))
    assert.deepEqual(world, staged)
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(building.id), second)
    const replacement = api.addBuilding(world, 'yellow', 'camp', { x: 12, z: 8 }, true)
    // Different maintained initializer descriptor, same controlled identity.
    world.buildings = [{ ...structuredClone(replacement), id: building.id }]
    const changed = structuredClone(world)
    fixture.render()
    const third = fixture.scene.buildingMeshes.get(building.id)
    assert.notEqual(third, second)
    assert.equal(second.parent, null)
    assert.equal(third.children[0].userData.nativeModel, 105)
    assert.equal(third.userData.signature, '105-4')
    assert.equal(third.userData.health, undefined)
    assert.equal(third.userData.healthFill, undefined)
    assert.equal(third.children.length, 1, 'replacement keeps only its native building model')
    assert.deepEqual(world, changed)
    const restored = api.migrateCheckpoint(structuredClone(world))
    assert.ok(restored)
    fixture.scene.world = restored
    const loaded = structuredClone(restored)
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(building.id), third)
    assert.deepEqual(restored, loaded)
    // Accepted missing secondary-history legacy default, not invented native saves.
    const legacy = structuredClone(restored)
    delete legacy.secondaryEffects
    assert.ok(normalizeHistoricalFixture(legacy))
    fixture.scene.world = legacy
    const legacyBefore = structuredClone(legacy)
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(building.id), third)
    assert.deepEqual(legacy, legacyBefore)
  } finally {
    fixture.close()
  }
})

test('completed to preparation and back preserves the earlier plan phase and shared cursor material', async () => {
  const { api, world } = await worldWithBuildings(1),
    building = world.buildings[0],
    template = api.addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, false, { plan: true }),
    preparation = structuredClone(template.preparation)
  world.buildings = [building]
  const fixture = await makePlanScene(world)
  let onCursorDispose
  try {
    fixture.render()
    const group = fixture.scene.buildingMeshes.get(building.id),
      events = observeCleanup(fixture.scene)
    let modelDisposals = 0,
      cursorDisposals = 0
    group.children[0].geometry.addEventListener('dispose', () => modelDisposals++)
    onCursorDispose = () => cursorDisposals++
    fixture.scene.cursor.material.addEventListener('dispose', onCursorDispose)
    building.preparation = preparation
    building.progress = 0
    const preparing = structuredClone(world)
    fixture.render()
    assert.deepEqual(events, [
      ['remove', building.id],
      ['release', building.id],
      ['delete', building.id],
    ])
    assert.equal(group.parent, null)
    assert.equal(modelDisposals, 1)
    assert.equal(fixture.scene.buildingMeshes.size, 0)
    const plan = fixture.scene.plans.get(building.id)
    assert.equal(plan.parent, fixture.scene.ground)
    assert.equal(plan.material, fixture.scene.cursor.material)
    assert.ok(plan.geometry.getAttribute('position').count > 0)
    assert.deepEqual(world, preparing, 'actual plan geometry preserves land.flags and World/RNG')
    fixture.render()
    assert.equal(fixture.scene.plans.get(building.id), plan)
    assert.equal(modelDisposals, 1)
    let planDisposals = 0
    plan.geometry.addEventListener('dispose', () => planDisposals++)
    delete building.preparation
    building.progress = 1
    const built = structuredClone(world)
    fixture.render()
    assert.equal(plan.parent, null)
    assert.equal(planDisposals, 1)
    assert.equal(cursorDisposals, 0)
    assert.equal(fixture.scene.plans.size, 0)
    const replacement = fixture.scene.buildingMeshes.get(building.id)
    assert.notEqual(replacement, group)
    assert.equal(replacement.parent, fixture.scene.objects)
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(building.id), replacement)
    assert.deepEqual(world, built)
  } finally {
    if (onCursorDispose)
      fixture.scene.cursor.material.removeEventListener('dispose', onCursorDispose)
    fixture.close()
  }
})

test('completed membership observes migrated NaN IDs, in-place IDs, loaded worlds and independent Scenes', async () => {
  const { api, world } = await worldWithBuildings(2)
  world.buildings[0].id = NaN
  const restored = api.migrateCheckpoint(structuredClone(world))
  assert.ok(restored)
  assert.ok(Number.isNaN(restored.buildings[0].id))
  const before = structuredClone(restored),
    fixture = await makePlanScene(restored)
  let other
  try {
    fixture.render()
    let previous = fixture.scene.buildingMeshes.get(NaN)
    const survivor = fixture.scene.buildingMeshes.get(restored.buildings[1].id)
    for (let frame = 0; frame < 3; frame++) {
      let disposals = 0
      previous.children[0].geometry.addEventListener('dispose', () => disposals++)
      fixture.render()
      const replacement = fixture.scene.buildingMeshes.get(NaN)
      assert.notEqual(replacement, previous)
      assert.equal(previous.parent, null)
      assert.equal(disposals, 1)
      assert.equal(fixture.scene.buildingMeshes.get(restored.buildings[1].id), survivor)
      assert.deepEqual(restored, before)
      previous = replacement
    }
    restored.buildings = [restored.buildings[1]]
    const oldId = restored.buildings[0].id
    restored.buildings[0].id = restored.nextId++
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.has(oldId), false)
    assert.equal(survivor.parent, null)
    const loaded = api.migrateCheckpoint(structuredClone(restored)),
      loadedBefore = structuredClone(loaded),
      cached = fixture.scene.buildingMeshes.get(loaded.buildings[0].id)
    fixture.scene.world = loaded
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.get(loaded.buildings[0].id), cached)
    other = await makePlanScene(loaded)
    other.render()
    const independent = other.scene.buildingMeshes.get(loaded.buildings[0].id)
    assert.notEqual(independent, cached)
    fixture.scene.world = { ...loaded, buildings: [] }
    fixture.render()
    assert.equal(fixture.scene.buildingMeshes.size, 0)
    assert.equal(fixture.scene.objects.children.length, 0)
    other.render()
    assert.equal(other.scene.buildingMeshes.get(loaded.buildings[0].id), independent)
    fixture.scene.world = loaded
    fixture.render()
    assert.deepEqual(loaded, loadedBefore)
  } finally {
    other?.close()
    fixture.close()
  }
})

test('real attached smoke teardown unsubscribes occupancy while independent emitted children and atlas survive', async () => {
  const fixture = await fullHutScene(),
    { scene, api, render, hut } = fixture,
    { GameScene } = await import('../app/scene.ts'),
    { releaseGroup } = await import('../app/scene-assets.ts'),
    { notifyHutOccupancy } = await import('../app/hut-occupancy-smoke.ts')
  Object.assign(scene, {
    planGeometry: GameScene.prototype.planGeometry,
    y: GameScene.prototype.y,
    locate: GameScene.prototype.locate,
    orientModel: GameScene.prototype.orientModel,
    releaseGroup,
  })
  let atlas, onAtlasDispose
  try {
    const puffs = () =>
      scene.world.secondaryEffects.order
        .map(slot => scene.world.secondaryEffects.slots[slot])
        .filter(entry => entry.kind === 'hutPuff')
    for (let visit = 0; visit < 512 && !puffs().length; visit++) {
      api.advanceGame(scene.world, scene.gameClock, 1 / 12)
      render()
    }
    assert.ok(puffs().length, 'existing command8 admission route naturally allocates a child')
    const child = puffs()[0],
      childGroup = scene.hutSmokePuffs.get(child.serial),
      buildingGroup = scene.buildingMeshes.get(hut.id),
      smoke = buildingGroup.userData.hutOccupancySmoke,
      events = [],
      remove = scene.objects.remove.bind(scene.objects),
      drop = scene.buildingMeshes.delete.bind(scene.buildingMeshes),
      release = scene.releaseGroup
    assert.equal(smoke.group.parent, scene.objects)
    atlas = smoke.sprite.material.map
    assert.equal(childGroup.children[0].material.map, atlas)
    let smokeDisposals = 0,
      modelDisposals = 0,
      childDisposals = 0,
      atlasDisposals = 0
    smoke.sprite.material.addEventListener('dispose', () => smokeDisposals++)
    buildingGroup.children[0].geometry.addEventListener('dispose', () => modelDisposals++)
    childGroup.children[0].material.addEventListener('dispose', () => childDisposals++)
    onAtlasDispose = () => atlasDisposals++
    atlas.addEventListener('dispose', onAtlasDispose)
    const label = group =>
      group === smoke.group ? 'smoke' : group === buildingGroup ? 'building' : 'other'
    scene.objects.remove = group => {
      events.push(['remove', label(group)])
      return remove(group)
    }
    scene.releaseGroup = group => {
      events.push(['release', label(group)])
      release(group)
    }
    scene.buildingMeshes.delete = id => {
      events.push(['delete', id])
      return drop(id)
    }
    // Controlled removal after real admission/emission; no ordinary demolition claim.
    scene.world.buildings = scene.world.buildings.filter(b => b !== hut)
    const before = structuredClone(scene.world)
    render()
    assert.deepEqual(events, [
      ['remove', 'smoke'],
      ['release', 'smoke'],
      ['remove', 'building'],
      ['release', 'building'],
      ['delete', hut.id],
    ])
    assert.equal(smokeDisposals, 1)
    assert.equal(modelDisposals, 1)
    assert.equal(childDisposals, 0)
    assert.equal(atlasDisposals, 0)
    assert.equal(smoke.group.parent, null)
    assert.equal(buildingGroup.parent, null)
    assert.equal(buildingGroup.userData.hutOccupancySmoke, undefined)
    assert.equal(scene.hutSmokePuffs.get(child.serial), childGroup)
    assert.equal(childGroup.parent, scene.objects)
    assert.deepEqual(
      scene.world,
      before,
      'all roots were initialized before this non-advancing render'
    )
    const objects = [...scene.objects.children]
    events.length = 0
    notifyHutOccupancy(hut)
    assert.equal(
      buildingGroup.userData.hutOccupancySmoke,
      undefined,
      'real dispose listener removed the old occupancy observer'
    )
    assert.deepEqual(scene.objects.children, objects)
    assert.deepEqual(events, [])
    render()
    assert.deepEqual(events, [])
    assert.equal(scene.hutSmokePuffs.get(child.serial), childGroup)
    assert.equal(childDisposals, 0)
    assert.equal(smokeDisposals, 1)
    assert.deepEqual(scene.world, before)
  } finally {
    if (onAtlasDispose) atlas.removeEventListener('dispose', onAtlasDispose)
    for (const group of scene.hutSmokePuffs.values()) scene.releaseGroup(group)
    fixture.close()
  }
})

test('completed-only membership has linear full-caller ID reads with empty plans, units and secondary population', async () => {
  const counts = []
  for (const count of [64, 256, 1024]) {
    const { world } = await worldWithBuildings(count),
      fixture = await makePlanScene(world)
    try {
      fixture.render()
      assert.equal(fixture.scene.plans.size, 0)
      assert.equal(world.units.length, 0)
      assert.deepEqual(world.secondaryEffects.order, [])
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
      const ids = [...fixture.scene.buildingMeshes.keys()],
        frozenCleanup = meshIds => {
          for (const id of meshIds) world.buildings.some(b => b.id === id && !b.preparation)
        }
      frozenCleanup(ids)
      const oldSurvivors = reads
      reads = 0
      fixture.render()
      const currentSurvivors = reads
      assert.ok(
        currentSurvivors <= count * 3,
        `completed-only full caller read ${currentSurvivors} IDs for ${count} buildings`
      )
      const staleIds = Array.from({ length: count }, (_, index) => world.nextId + index + 1)
      reads = 0
      frozenCleanup([...ids, ...staleIds])
      const oldMixed = reads
      for (const id of staleIds) {
        const group = new THREE.Group()
        group.userData.building = id
        fixture.scene.buildingMeshes.set(id, group)
        fixture.scene.objects.add(group)
      }
      reads = 0
      fixture.render()
      const currentMixed = reads
      assert.ok(
        currentMixed <= count * 3,
        `mixed completed-only caller read ${currentMixed} IDs for ${count} buildings`
      )
      assert.equal(fixture.scene.buildingMeshes.size, count)
      counts.push({ buildings: count, oldSurvivors, currentSurvivors, oldMixed, currentMixed })
    } finally {
      fixture.close()
    }
  }
  for (let i = 1; i < counts.length; i++) {
    assert.equal(counts[i].currentSurvivors, counts[i - 1].currentSurvivors * 4)
    assert.equal(counts[i].currentMixed, counts[i - 1].currentMixed * 4)
  }
  console.log(
    'Completed-only ID-read diagnostic (frozen old cleanup vs actual candidate full caller):',
    JSON.stringify(counts)
  )
})
