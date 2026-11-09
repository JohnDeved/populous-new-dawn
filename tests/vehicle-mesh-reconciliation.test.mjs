// Actual class4 frame/factory/Scene transforms and resource disposal in Node.
// Authored vehicle templates plus controlled lifecycle/scaling states; no
// ordinary gameplay, browser, native raster or hardware timing claim.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeVehicleScene } from './support/vehicle-scene.mjs'

async function worldWithVehicles(models) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22),
    templates = new Map(world.vehicles.map(v => [v.model, v]))
  world.vehicles = models.map((model, index) => ({
    ...structuredClone(templates.get(model)),
    id: world.nextId++,
    active: true,
    destructionState: 0,
    x: 1000 + index * 256,
    y: 2000,
    h: 128,
    heading: Math.PI / 2,
  }))
  assert.ok(
    world.vehicles.every(v => v.class === 4),
    'templates come from authored Mission 22 vehicles'
  )
  return { api, world }
}

function observeCleanup(scene) {
  const events = [],
    remove = scene.objects.remove.bind(scene.objects),
    drop = scene.vehicleMeshes.delete.bind(scene.vehicleMeshes),
    release = scene.releaseGroup
  scene.objects.remove = group => {
    events.push(['remove', group.userData.vehicle])
    return remove(group)
  }
  scene.releaseGroup = group => {
    events.push(['release', group.userData.vehicle])
    release(group)
  }
  scene.vehicleMeshes.delete = id => {
    events.push(['delete', id])
    return drop(id)
  }
  return events
}

test('inactive vehicle destruction states5/6 remain drawn until the state clears', async () => {
  const { world } = await worldWithVehicles([1, 1, 3, 3]),
    [active, sinking, rising, hidden] = world.vehicles
  Object.assign(sinking, { active: false, destructionState: 5 })
  Object.assign(rising, { active: false, destructionState: 6 })
  hidden.active = false
  const fixture = await makeVehicleScene(world)
  try {
    const before = structuredClone(world)
    fixture.render()
    assert.deepEqual([...fixture.scene.vehicleMeshes.keys()], [active.id, sinking.id, rising.id])
    const groups = new Map(fixture.scene.vehicleMeshes),
      events = observeCleanup(fixture.scene)
    fixture.render()
    assert.deepEqual(events, [])
    assert.deepEqual(world, before)
    sinking.destructionState = 6
    fixture.render()
    assert.equal(fixture.scene.vehicleMeshes.get(sinking.id), groups.get(sinking.id))
    assert.deepEqual(events, [], 'both nonzero destruction states are eligible')
    rising.destructionState = 0
    const cleared = structuredClone(world)
    fixture.render()
    assert.deepEqual(events, [
      ['remove', rising.id],
      ['release', rising.id],
      ['delete', rising.id],
    ])
    assert.equal(groups.get(rising.id).parent, null)
    assert.deepEqual(world, cleared)
    events.length = 0
    active.active = false
    sinking.destructionState = 0
    fixture.render()
    assert.deepEqual(
      events,
      [active, sinking].flatMap(v => [
        ['remove', v.id],
        ['release', v.id],
        ['delete', v.id],
      ])
    )
    assert.equal(fixture.scene.vehicleMeshes.size, 0)
    hidden.active = true
    fixture.render()
    assert.deepEqual(
      [...fixture.scene.vehicleMeshes.keys()],
      [hidden.id],
      'in-place eligibility change is observed'
    )
  } finally {
    fixture.close()
  }
})

test('vehicle cleanup preserves ordered disposal, shared atlas, survivor mesh and actual transforms', async () => {
  const { world } = await worldWithVehicles([1, 3, 1, 3]),
    [a, b, c, d] = world.vehicles,
    fixture = await makeVehicleScene(world)
  let sharedMap, onSharedDispose
  try {
    fixture.render()
    const original = new Map(fixture.scene.vehicleMeshes),
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
    const spawned = {
      ...structuredClone(b),
      id: world.nextId++,
      x: 5000,
      y: 6000,
      h: 256,
      heading: Math.PI,
    }
    world.vehicles = [c, a, spawned]
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
    assert.equal(fixture.scene.vehicleMeshes.get(a.id), original.get(a.id))
    assert.equal(fixture.scene.vehicleMeshes.get(c.id), original.get(c.id))
    assert.deepEqual([...fixture.scene.vehicleMeshes.keys()], [a.id, c.id, spawned.id])
    const group = fixture.scene.vehicleMeshes.get(spawned.id)
    assert.equal(group.userData.vehicleMesh, 144)
    assert.equal(group.children[0].userData.nativeModel, 144)
    assert.deepEqual(group.position.toArray(), [11.53125, 2, -31.4375])
    assert.equal(group.rotation.y, -Math.PI)
    assert.equal(group.userData.nativeHeading, 1024)
    assert.deepEqual(world, before, 'actual rendering preserves all simulation data and RNG')
    events.length = 0
    fixture.render()
    assert.deepEqual(events, [])
    assert.deepEqual(world, before)
  } finally {
    if (sharedMap) sharedMap.removeEventListener('dispose', onSharedDispose)
    fixture.close()
  }
})

test('migrated NaN vehicle IDs retain strict cleanup and rebuild without world repair', async () => {
  const { api, world } = await worldWithVehicles([1])
  world.vehicles[0].id = NaN
  const restored = api.migrateCheckpoint(structuredClone(world))
  assert.ok(restored)
  assert.ok(Number.isNaN(restored.vehicles[0].id))
  const before = structuredClone(restored),
    fixture = await makeVehicleScene(restored)
  try {
    fixture.render()
    const events = observeCleanup(fixture.scene)
    let previous = fixture.scene.vehicleMeshes.get(NaN)
    for (let frame = 0; frame < 3; frame++) {
      events.length = 0
      fixture.render()
      const replacement = fixture.scene.vehicleMeshes.get(NaN)
      assert.deepEqual(events, [
        ['remove', NaN],
        ['release', NaN],
        ['delete', NaN],
      ])
      assert.notEqual(replacement, previous)
      assert.equal(previous.parent, null)
      assert.equal(replacement.parent, fixture.scene.objects)
      assert.deepEqual(restored, before)
      previous = replacement
    }
  } finally {
    fixture.close()
  }
})

test('vehicle membership observes in-place IDs, loaded worlds, independent Scenes and empty replacements', async () => {
  const { api, world } = await worldWithVehicles([1, 3]),
    fixture = await makeVehicleScene(world)
  let other
  try {
    fixture.render()
    const [a, b] = world.vehicles,
      oldId = a.id,
      oldA = fixture.scene.vehicleMeshes.get(a.id),
      oldB = fixture.scene.vehicleMeshes.get(b.id)
    a.id = world.nextId++
    fixture.render()
    assert.equal(fixture.scene.vehicleMeshes.has(oldId), false)
    assert.equal(oldA.parent, null)
    const restored = api.migrateCheckpoint(structuredClone(world)),
      before = structuredClone(restored)
    fixture.scene.world = restored
    fixture.render()
    assert.equal(fixture.scene.vehicleMeshes.get(b.id), oldB)
    other = await makeVehicleScene(restored)
    other.render()
    const otherGroups = [...other.scene.vehicleMeshes.values()]
    assert.notEqual(other.scene.vehicleMeshes.get(b.id), oldB)
    fixture.scene.world = { ...restored, vehicles: [] }
    fixture.render()
    assert.equal(fixture.scene.vehicleMeshes.size, 0)
    assert.equal(fixture.scene.objects.children.length, 0)
    other.render()
    assert.deepEqual([...other.scene.vehicleMeshes.values()], otherGroups)
    fixture.scene.world = restored
    fixture.render()
    assert.equal(fixture.scene.vehicleMeshes.size, 2)
    assert.deepEqual(restored, before)
  } finally {
    other?.close()
    fixture.close()
  }
})

test('actual vehicle-frame membership ID reads scale linearly for survivors and stale meshes', async t => {
  const rows = []
  for (const count of [64, 256, 1024]) {
    const { world } = await worldWithVehicles(
        Array.from({ length: count }, (_, i) => (i & 1 ? 3 : 1))
      ),
      fixture = await makeVehicleScene(world)
    try {
      fixture.render()
      const groups = [...fixture.scene.vehicleMeshes.values()]
      let reads = 0
      for (const v of world.vehicles) {
        const id = v.id
        Object.defineProperty(v, 'id', {
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
        for (const id of ids)
          world.vehicles.some(v => v.id === id && (v.active || v.destructionState))
        return reads
      }
      const survivorBaseline = oldMembershipReads(fixture.scene.vehicleMeshes.keys())
      assert.equal(survivorBaseline, (count * (count + 1)) / 2)
      reads = 0
      fixture.render()
      const survivorFrame = reads
      assert.ok(survivorFrame <= 3 * count, `${count} survivors: ${survivorFrame} ID reads`)
      assert.deepEqual([...fixture.scene.vehicleMeshes.values()], groups)
      for (let i = 0; i < count; i++) {
        const group = new THREE.Group(),
          id = -(i + 1)
        group.userData.vehicle = id
        fixture.scene.vehicleMeshes.set(id, group)
        fixture.scene.objects.add(group)
      }
      const mixedBaseline = oldMembershipReads(fixture.scene.vehicleMeshes.keys())
      assert.equal(mixedBaseline, (count * (count + 1)) / 2 + count * count)
      reads = 0
      fixture.render()
      const mixedFrame = reads
      assert.ok(
        mixedFrame <= 3 * count,
        `${count} survivors + stale meshes: ${mixedFrame} ID reads`
      )
      assert.deepEqual([...fixture.scene.vehicleMeshes.values()], groups)
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
      vehicleIdReads: rows,
      scope: 'Node actual full vehicle frame; no wall-time/browser/GPU/FPS claim',
    })
  )
})
