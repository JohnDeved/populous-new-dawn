// Actual vehicle frame/factory/pose/resource route. Controlled observers and cloned
// authored vehicle populations diagnose snapshot and filter-result Array behavior;
// they are not ordinary browser/native/hardware or backing-storage measurements.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeVehicleScene } from './support/vehicle-scene.mjs'

async function vehicles(models) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22),
    templates = new Map(world.vehicles.map(vehicle => [vehicle.model, vehicle]))
  world.vehicles = models.map((model, index) => {
    assert.ok(templates.has(model), 'Mission22 supplies the maintained authored class4 template')
    return {
      ...structuredClone(templates.get(model)),
      id: world.nextId++,
      active: true,
      destructionState: 0,
      x: 1000 + index * 256,
      y: 2000,
      h: 128,
      heading: Math.PI / 2,
    }
  })
  assert.ok(world.vehicles.every(vehicle => vehicle.class === 4))
  return { api, world }
}

const material = group => group.children[0].material

function drawObserver(scene, observe) {
  const locate = scene.locate,
    calls = []
  scene.locate = function (group, ...args) {
    calls.push(group.userData.vehicle)
    const result = locate.call(this, group, ...args)
    observe?.(group)
    return result
  }
  return calls
}

// A non-enumerable observer delegates the original method exactly. It does not
// replace simulation data or the filter result consumed by the original caller.
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

test('vehicle eligibility snapshot sees actual material-dispose observer changes after cleanup before the first draw', async () => {
  const { world } = await vehicles([1, 3, 1]),
    [survivor, stale, retired] = world.vehicles,
    fixture = await makeVehicleScene(world)
  try {
    fixture.render()
    const survivorGroup = fixture.scene.vehicleMeshes.get(survivor.id),
      staleGroup = fixture.scene.vehicleMeshes.get(stale.id),
      retiredGroup = fixture.scene.vehicleMeshes.get(retired.id),
      spawned = { ...structuredClone(retired), id: world.nextId++, x: retired.x + 256 }
    world.vehicles = [survivor]
    const expected = structuredClone(world)
    expected.vehicles = [{ ...expected.vehicles[0], active: false }, structuredClone(spawned)]
    let disposed = 0
    material(staleGroup).addEventListener('dispose', () => {
      disposed++
      survivor.active = false
      world.vehicles = [survivor, spawned]
    })
    const calls = drawObserver(fixture.scene)
    fixture.render()
    assert.equal(disposed, 1, 'the observer ran inside maintained material disposal')
    assert.deepEqual(calls, [spawned.id], 'eager draw snapshot follows cleanup callback edits')
    assert.deepEqual(
      world,
      expected,
      'only the explicitly observed world edit occurred; both RNG owners stay equal'
    )
    assert.equal(staleGroup.parent, null)
    assert.equal(retiredGroup.parent, null)
    assert.equal(
      fixture.scene.vehicleMeshes.get(survivor.id),
      survivorGroup,
      'membership cleanup visited the survivor before the callback changed eligibility'
    )
    assert.deepEqual([...fixture.scene.vehicleMeshes.keys()], [survivor.id, spawned.id])
    const spawnedGroup = fixture.scene.vehicleMeshes.get(spawned.id)
    assert.equal(spawnedGroup.parent, fixture.scene.objects)
    calls.length = 0
    fixture.render()
    assert.deepEqual(calls, [spawned.id])
    assert.equal(survivorGroup.parent, null, 'the next frame consumes the changed membership')
    assert.equal(fixture.scene.vehicleMeshes.get(spawned.id), spawnedGroup)
    assert.deepEqual(world, expected)
  } finally {
    fixture.close()
  }
})

test('the vehicle view captures eligibility and record order before drawing while pose consumers observe current records', async () => {
  const { world } = await vehicles([1, 3, 1, 3]),
    [first, later, dormant, sinking] = world.vehicles,
    fixture = await makeVehicleScene(world)
  dormant.active = false
  sinking.active = false
  sinking.destructionState = 5
  try {
    fixture.render()
    const groups = new Map(fixture.scene.vehicleMeshes),
      appended = { ...structuredClone(dormant), id: world.nextId++, active: true }
    const expected = structuredClone(world)
    expected.vehicles[1].active = false
    expected.vehicles[1].h = 256
    expected.vehicles[2].active = true
    expected.vehicles[3].destructionState = 0
    expected.vehicles.push(structuredClone(appended))
    let changed = false
    const calls = drawObserver(fixture.scene, group => {
      if (changed || group.userData.vehicle !== first.id) return
      changed = true
      later.active = false
      later.h = 256
      dormant.active = true
      sinking.destructionState = 0
      world.vehicles.push(appended)
    })
    fixture.render()
    assert.deepEqual(
      calls,
      [first.id, later.id, sinking.id],
      'eligibility/list snapshot precedes drawing: late removal/addition waits for the next frame'
    )
    assert.equal(fixture.scene.vehicleMeshes.has(dormant.id), false)
    assert.equal(fixture.scene.vehicleMeshes.has(appended.id), false)
    assert.equal(fixture.scene.vehicleMeshes.get(later.id), groups.get(later.id))
    assert.equal(
      groups.get(later.id).position.y,
      256 / 128,
      'the eager view stores live records; pose reads the current height'
    )
    assert.equal(fixture.scene.vehicleMeshes.get(sinking.id), groups.get(sinking.id))
    assert.deepEqual(world, expected)
    calls.length = 0
    fixture.render()
    assert.deepEqual(calls, [first.id, dormant.id, appended.id])
    assert.equal(groups.get(later.id).parent, null)
    assert.equal(groups.get(sinking.id).parent, null)
    assert.equal(fixture.scene.vehicleMeshes.get(first.id), groups.get(first.id))
    assert.deepEqual(world, expected)
  } finally {
    fixture.close()
  }
})

test('repeated actual vehicle frames remove filter-result Array creation at cloned authored populations; lifecycle cases remain separate', async t => {
  for (const population of [64, 256, 1024]) {
    const { api, world } = await vehicles(
        Array.from({ length: population }, (_, i) => (i & 1 ? 3 : 1))
      ),
      fixture = await makeVehicleScene(world)
    let watch
    try {
      fixture.render()
      const originalGroups = [...fixture.scene.vehicleMeshes.values()]
      let idReads = 0
      for (const vehicle of world.vehicles) {
        const id = vehicle.id
        Object.defineProperty(vehicle, 'id', {
          configurable: true,
          enumerable: true,
          get: () => {
            idReads++
            return id
          },
        })
      }
      watch = filterObserver(world.vehicles)
      const rows = []
      for (let frame = 0; frame < 3; frame++) {
        const before = structuredClone(world)
        idReads = 0
        fixture.render()
        const fullCallerVehicleIdReads = idReads
        assert.equal(
          fullCallerVehicleIdReads,
          population * 2,
          'the new eligibility view preserves the existing linear ID-read boundary'
        )
        assert.deepEqual([...fixture.scene.vehicleMeshes.values()], originalGroups)
        assert.equal(world.vehicles.filter, watch.observe, 'observer ownership remains unchanged')
        assert.deepEqual(
          world,
          before,
          'actual vehicle rendering preserves full World and both RNG owners'
        )
        rows.push(fullCallerVehicleIdReads)
      }
      t.diagnostic(
        JSON.stringify({
          kind: 'vehicle-filter-result-array-boundary',
          population,
          frames: 3,
          fullCallerVehicleIdReads: rows,
          filterResultArrayObjects: watch.results.length,
          filterResultElements: watch.results.reduce((total, array) => total + array.length, 0),
          scope:
            'Removed filter-result Array object only; no backing-store/GC/whole-frame/browser/hardware allocation claim',
        })
      )
      assert.equal(
        watch.results.length,
        0,
        `actual full vehicle frame created ${watch.results.length} filter-result arrays at population ${population}`
      )
      watch.close()
      watch = undefined
      // Exercise the same Scene's scratch view across replacement/load/empty/refill,
      // and a second independent Scene; original existing lifecycle tests are intact.
      const loaded = api.migrateCheckpoint(structuredClone(world)),
        other = await makeVehicleScene(loaded)
      try {
        const expectedLoaded = structuredClone(loaded)
        other.render()
        assert.deepEqual(loaded, expectedLoaded)
        fixture.scene.world = { ...structuredClone(world), vehicles: [] }
        const empty = structuredClone(fixture.scene.world)
        fixture.render()
        assert.equal(fixture.scene.vehicleMeshes.size, 0)
        assert.deepEqual(fixture.scene.world, empty)
        other.render()
        assert.equal(other.scene.vehicleMeshes.size, population)
        assert.deepEqual(loaded, expectedLoaded)
        fixture.scene.world = loaded
        fixture.render()
        assert.equal(fixture.scene.vehicleMeshes.size, population)
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
