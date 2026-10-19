// Actual unit-frame caller and Three resources; texture/projection leaves are
// supplied by the existing Node fixture. These are not browser/FPS measurements.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

async function worldWithUnits(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(1)
  world.units = []
  world.selected = []
  for (let i = 0; i < count; i++) api.addUnit(world, 'blue', 'brave', { x: i % 16, z: 0 })
  return { api, world }
}

async function observeCleanup(fixture) {
  const { releaseGroup } = await import('../app/scene-assets.ts'),
    { scene } = fixture,
    events = [],
    remove = scene.objects.remove.bind(scene.objects),
    drop = scene.unitMeshes.delete.bind(scene.unitMeshes)
  scene.objects.remove = group => {
    events.push(['remove', group.userData.unit])
    return remove(group)
  }
  scene.releaseGroup = group => {
    events.push(['release', group.userData.unit])
    releaseGroup(group)
  }
  scene.unitMeshes.delete = id => {
    events.push(['delete', id])
    return drop(id)
  }
  return events
}

test('unit-frame cleanup preserves survivor identity, removal order and resource release', async () => {
  const { api, world } = await worldWithUnits(4),
    fixture = await makeSceneFixture(world),
    [a, b, c, d] = world.units
  try {
    fixture.render()
    const original = new Map(fixture.scene.unitMeshes),
      events = await observeCleanup(fixture),
      disposed = []
    for (const unit of [b, d]) {
      const group = original.get(unit.id)
      group.userData.selection.material.addEventListener('dispose', () => disposed.push(unit.id))
      group.userData.selection.material.map.addEventListener('dispose', () =>
        disposed.push(`${unit.id}:map`)
      )
    }
    const spawned = api.addUnit(world, 'blue', 'warrior', { x: 4, z: 1 })
    world.units = [c, a, spawned]
    const before = structuredClone(world)
    fixture.render()
    assert.deepEqual(
      events,
      [b, d].flatMap(unit => [
        ['remove', unit.id],
        ['release', unit.id],
        ['delete', unit.id],
      ])
    )
    assert.deepEqual(disposed, [`${b.id}:map`, b.id, `${d.id}:map`, d.id])
    assert.equal(fixture.scene.unitMeshes.get(a.id), original.get(a.id))
    assert.equal(fixture.scene.unitMeshes.get(c.id), original.get(c.id))
    assert.deepEqual([...fixture.scene.unitMeshes.keys()], [a.id, c.id, spawned.id])
    assert.deepEqual(fixture.scene.objects.children, [
      original.get(a.id),
      original.get(c.id),
      fixture.scene.unitMeshes.get(spawned.id),
    ])
    assert.deepEqual(world, before, 'rendering preserves all simulation data and RNG owners')
    events.length = 0
    fixture.render()
    assert.deepEqual(events, [], 'repeated frames do not remove/release survivors again')
    assert.deepEqual(world, before)
    assert.equal(fixture.scene.unitMeshes.get(a.id).userData.cellPosition, a)
    assert.deepEqual(fixture.scene.unitMeshes.get(spawned.id).position.toArray(), [4, 0, 1])
  } finally {
    fixture.close()
  }
})

test('unit-frame signature replacement retains cleanup ordering and draws the new kind/team', async () => {
  const { world } = await worldWithUnits(1),
    fixture = await makeSceneFixture(world)
  try {
    fixture.render()
    const unit = world.units[0],
      old = fixture.scene.unitMeshes.get(unit.id),
      events = await observeCleanup(fixture)
    unit.kind = 'warrior'
    unit.team = 'red'
    const before = structuredClone(world)
    fixture.render()
    const replacement = fixture.scene.unitMeshes.get(unit.id)
    assert.notEqual(replacement, old)
    assert.deepEqual(events, [
      ['remove', unit.id],
      ['release', unit.id],
      ['delete', unit.id],
    ])
    assert.equal(old.parent, null)
    assert.equal(replacement.parent, fixture.scene.objects)
    assert.equal(replacement.userData.signature, 'red-warrior')
    assert.equal(replacement.userData.owner, 1)
    assert.deepEqual(world, before)
    events.length = 0
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.get(unit.id), replacement)
    assert.deepEqual(events, [])
  } finally {
    fixture.close()
  }
})

test('membership rebuild observes in-place IDs, empty worlds, migrated loads and independent scenes', async () => {
  const { api, world } = await worldWithUnits(2),
    fixture = await makeSceneFixture(world)
  let other
  try {
    fixture.render()
    const [a, b] = world.units,
      oldA = fixture.scene.unitMeshes.get(a.id),
      oldId = a.id,
      oldB = fixture.scene.unitMeshes.get(b.id)
    a.id = world.nextId++
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.has(oldId), false)
    assert.equal(oldA.parent, null)
    assert.notEqual(fixture.scene.unitMeshes.get(a.id), oldA)
    const restored = api.migrateCheckpoint(structuredClone(world)),
      before = structuredClone(restored)
    fixture.scene.world = restored
    fixture.render()
    assert.equal(
      fixture.scene.unitMeshes.get(b.id),
      oldB,
      'same ID/signature survives a loaded world'
    )
    assert.equal(oldB.userData.cellPosition, restored.units[1], 'draw uses the newly loaded record')
    assert.deepEqual(restored, before)
    other = await makeSceneFixture(restored)
    other.render()
    assert.notEqual(other.scene.unitMeshes.get(b.id), oldB)
    const otherGroups = [...other.scene.unitMeshes.values()]
    fixture.scene.world = { ...restored, units: [] }
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.size, 0)
    assert.equal(fixture.scene.objects.children.length, 0)
    other.render()
    assert.deepEqual(
      [...other.scene.unitMeshes.values()],
      otherGroups,
      'Scenes own independent frame indexes'
    )
    fixture.scene.world = restored
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.size, restored.units.length)
    assert.deepEqual(restored, before)
  } finally {
    // Fixtures install texture/document leaves, so unwind in creation order's reverse.
    other?.close()
    fixture.close()
  }
})

test('a migrated NaN ID retains strict-comparison cleanup and rebuilds every frame', async () => {
  const { api, world } = await worldWithUnits(1)
  world.units[0].id = NaN
  const restored = api.migrateCheckpoint(structuredClone(world))
  assert.ok(restored)
  assert.ok(Number.isNaN(restored.units[0].id), 'migration retains the actual saved NaN ID')
  const before = structuredClone(restored),
    fixture = await makeSceneFixture(restored)
  try {
    fixture.render()
    const events = await observeCleanup(fixture)
    let previous = fixture.scene.unitMeshes.get(NaN)
    assert.ok(previous)
    for (let frame = 0; frame < 3; frame++) {
      events.length = 0
      fixture.render()
      const replacement = fixture.scene.unitMeshes.get(NaN)
      assert.deepEqual(events, [
        ['remove', NaN],
        ['release', NaN],
        ['delete', NaN],
      ])
      assert.notEqual(replacement, previous)
      assert.equal(previous.parent, null)
      assert.equal(replacement.parent, fixture.scene.objects)
      assert.deepEqual(
        restored,
        before,
        'rendering does not repair or otherwise mutate the saved world'
      )
      previous = replacement
    }
  } finally {
    fixture.close()
  }
})

test('actual unit-frame membership work scales linearly for survivors and stale meshes', async t => {
  const rows = []
  for (const count of [64, 256, 1024]) {
    const { world } = await worldWithUnits(count),
      fixture = await makeSceneFixture(world)
    try {
      fixture.render()
      const groups = [...fixture.scene.unitMeshes.values()]
      let reads = 0
      for (const unit of world.units) {
        const id = unit.id
        Object.defineProperty(unit, 'id', {
          enumerable: true,
          configurable: true,
          get: () => {
            reads++
            return id
          },
        })
      }
      // Freeze the previous cleanup's membership expression as a diagnostic
      // reference; the candidate measurement invokes the actual full frame caller.
      const oldMembershipReads = ids => {
        reads = 0
        for (const id of ids) world.units.some(unit => unit.id === id)
        return reads
      }
      const survivorBaseline = oldMembershipReads(fixture.scene.unitMeshes.keys())
      assert.equal(survivorBaseline, (count * (count + 1)) / 2)
      reads = 0
      fixture.render()
      const survivorFrame = reads
      assert.ok(survivorFrame <= 4 * count, `${count} survivors: ${survivorFrame} ID reads`)
      assert.deepEqual([...fixture.scene.unitMeshes.values()], groups)
      const stale = groups.map((_, index) => [-(index + 1), new THREE.Group()])
      for (const [id, group] of stale) {
        group.userData.unit = id
        fixture.scene.unitMeshes.set(id, group)
        fixture.scene.objects.add(group)
      }
      const mixedBaseline = oldMembershipReads(fixture.scene.unitMeshes.keys())
      assert.equal(mixedBaseline, (count * (count + 1)) / 2 + count * count)
      reads = 0
      fixture.render()
      const mixedFrame = reads
      assert.ok(
        mixedFrame <= 4 * count,
        `${count} survivors + stale meshes: ${mixedFrame} ID reads`
      )
      assert.deepEqual([...fixture.scene.unitMeshes.values()], groups)
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
      unitIdReads: rows,
      scope: 'Node actual frame caller; no wall time/browser/GPU/FPS claim',
    })
  )
})
