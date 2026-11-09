// Actual selection producers and full unit-frame/Scene wrappers, with controlled
// Node populations. These are not browser interactions or hardware measurements.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeSelectionScene } from './support/selection-scene.mjs'

async function quietWorld(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(1)
  world.units = []
  world.selected = []
  world.buildings = []
  world.shrines = []
  world.trees = []
  for (let i = 0; i < count; i++) api.addUnit(world, 'blue', 'brave', { x: i % 16, z: 0 })
  return { api, world }
}

function assertFrame(fixture, world) {
  const before = structuredClone(world)
  fixture.render()
  assert.deepEqual(world, before, 'render must retain full world and both RNG owners')
  for (const unit of world.units) {
    const group = fixture.scene.unitMeshes.get(unit.id),
      selected = world.selected.includes(unit.id)
    assert.equal(group.userData.state, selected ? 'selected' : 'idle')
    assert.equal(group.userData.selection.visible, selected)
  }
}

const parameters = call => call.slice(0, 6)
const bodySnapshot = group => ({
  frame: group.userData.frame,
  flip: group.userData.frameFlip,
  bounds: { ...group.userData.bounds },
  layers: group.userData.layers.map(layer => ({
    piece: layer.userData.piece,
    visible: layer.visible,
    center: layer.center.toArray(),
    scale: layer.scale.toArray(),
    uv: layer.userData.atlasTransform?.toArray(),
    opacity: layer.material.opacity,
  })),
})

test('actual click/Ctrl selection and mode-first cancellation update idle animation and arrows without simulation writes', async () => {
  const { api, world } = await quietWorld(3),
    [a, b, c] = world.units,
    fixture = await makeSelectionScene(world)
  try {
    assertFrame(fixture, world)
    const original = new Map(fixture.scene.unitMeshes)
    api.selectUnit(world, a.id, false)
    assert.deepEqual(world.selected, [a.id])
    assertFrame(fixture, world)
    api.selectUnit(world, b.id, true)
    assert.deepEqual(world.selected, [a.id, b.id])
    assertFrame(fixture, world)
    api.selectUnit(world, a.id, false)
    assert.deepEqual(
      world.selected,
      [a.id, b.id],
      'clicking an already selected person retains the group'
    )
    assertFrame(fixture, world)
    api.selectUnit(world, a.id, true)
    assert.deepEqual(world.selected, [b.id])
    assertFrame(fixture, world)
    world.mode = 'blast'
    api.cancelInteraction(world)
    assert.equal(world.mode, null)
    assert.deepEqual(world.selected, [b.id], 'first cancel owns targeting mode only')
    assertFrame(fixture, world)
    api.cancelInteraction(world)
    assert.deepEqual(world.selected, [])
    assertFrame(fixture, world)
    api.setSelection(world, [a.id, c.id])
    assertFrame(fixture, world)
    for (const unit of world.units)
      assert.equal(fixture.scene.unitMeshes.get(unit.id), original.get(unit.id))
    assert.ok(
      world.units.every(unit => !unit.native),
      'selection/render must not create native movement owners'
    )
  } finally {
    fixture.close()
  }
})

test('same selected array mutations, replacement, empty roster and migrated load refresh current frame membership', async () => {
  const { api, world } = await quietWorld(3),
    [a, b, c] = world.units,
    fixture = await makeSelectionScene(world)
  try {
    world.selected.push(a.id)
    const array = world.selected
    assertFrame(fixture, world)
    const groups = new Map(fixture.scene.unitMeshes),
      maps = new Map(
        [...groups].map(([id, group]) => [
          id,
          group.userData.layers.map(layer => layer.material.map),
        ])
      )
    world.selected.splice(0, 1, b.id, c.id)
    assert.equal(world.selected, array)
    assertFrame(fixture, world)
    world.selected.length = 0
    assertFrame(fixture, world)
    world.selected = [a.id, a.id, c.id]
    assert.notEqual(world.selected, array)
    assertFrame(fixture, world)
    const loaded = api.migrateCheckpoint(structuredClone(world))
    fixture.scene.world = loaded
    assertFrame(fixture, loaded)
    assertFrame(fixture, loaded)
    for (const unit of loaded.units) {
      const group = fixture.scene.unitMeshes.get(unit.id)
      assert.equal(group, groups.get(unit.id))
      assert.deepEqual(
        group.userData.layers.map(layer => layer.material.map),
        maps.get(unit.id)
      )
    }
    const empty = structuredClone(loaded)
    empty.units = []
    empty.selected = []
    fixture.scene.world = empty
    assertFrame(fixture, empty)
    assert.equal(fixture.scene.unitMeshes.size, 0)
    loaded.selected = [b.id]
    fixture.scene.world = loaded
    assertFrame(fixture, loaded)
  } finally {
    fixture.close()
  }
})

test('omitted direct/helper/effect calls retain live selection after a cached frame and normal effects stay unchanged', async () => {
  const { api, world } = await quietWorld(2),
    [a, b] = world.units,
    fixture = await makeSelectionScene(world)
  let plain, observer
  try {
    api.setSelection(world, [a.id])
    assertFrame(fixture, world)
    const aCall = parameters(fixture.personCalls.find(call => call[0].userData.unit === a.id)),
      bCall = parameters(fixture.personCalls.find(call => call[0].userData.unit === b.id))
    world.selected = [b.id]
    const beforeDirect = structuredClone(world)
    fixture.directPerson(...aCall)
    assert.equal(aCall[0].userData.selection.visible, false)
    api.animatePerson(fixture.scene, ...bCall)
    assert.equal(bCall[0].userData.selection.visible, true)
    assert.equal(api.unitAnimation(world, a), 'idle')
    assert.equal(api.unitAnimation(world, b), 'selected')
    assert.deepEqual(world, beforeDirect)

    const effect = api.effect(world, 'death', a)
    effect.unit = structuredClone(a)
    const beforeEffect = structuredClone(world)
    plain = fixture.scene.makeFx(effect)
    fixture.scene.animateFx(plain, effect)
    assert.equal(
      plain.userData.selection,
      undefined,
      'normal unit-death effects have no selection arrow'
    )
    assert.deepEqual(world, beforeEffect)
    const normal = bodySnapshot(plain)
    world.selected = [a.id]
    const afterSelection = structuredClone(world)
    fixture.scene.animateFx(plain, effect)
    assert.deepEqual(bodySnapshot(plain), normal)
    assert.deepEqual(world, afterSelection)
    world.selected = beforeEffect.selected

    // Diagnostic observer only: attach a maintained unit-arrow sprite to the
    // actual effect factory output to observe its omitted animation argument.
    // Production corpse/death effects do not gain arrows through this test.
    observer = fixture.scene.makeFx(effect)
    const arrow = aCall[0].userData.selection.clone()
    arrow.material = arrow.material.clone()
    arrow.material.map = arrow.material.map.clone()
    observer.add(arrow)
    observer.userData.selection = arrow
    observer.userData.unit = a.id
    fixture.scene.animateFx(observer, effect)
    assert.equal(
      arrow.visible,
      false,
      'effect must observe changed live selection, not the previous unit-frame set'
    )
    world.selected = [a.id]
    const selectedBefore = structuredClone(world)
    fixture.scene.animateFx(observer, effect)
    assert.equal(arrow.visible, true)
    assert.deepEqual(bodySnapshot(observer), normal)
    assert.deepEqual(world, selectedBefore)
    const effectCall = fixture.personCalls.at(-1)
    assert.equal(
      effectCall.length,
      5,
      'actual unit-death effect keeps its existing omitted-set call shape'
    )
  } finally {
    for (const group of [observer, plain]) if (group) fixture.scene.releaseGroup(group)
    fixture.close()
  }
})

test('SameValueZero selection preserves accepted NaN, duplicates and signed zero through repeated migrated frames', async () => {
  const { api, world } = await quietWorld(3)
  world.units[0].id = NaN
  world.units[1].id = 0
  world.units[2].id = 2
  world.selected = [NaN, NaN, -0, 2]
  const loaded = api.migrateCheckpoint(structuredClone(world)),
    fixture = await makeSelectionScene(loaded)
  try {
    assert.ok(Number.isNaN(loaded.units[0].id))
    assert.ok(Object.is(loaded.selected[2], -0))
    for (let visit = 0; visit < 3; visit++) assertFrame(fixture, loaded)
    loaded.selected.splice(0, loaded.selected.length, -0)
    assertFrame(fixture, loaded)
    loaded.selected = [NaN]
    assertFrame(fixture, loaded)
    loaded.selected = []
    assertFrame(fixture, loaded)
  } finally {
    fixture.close()
  }
})

test('independent Scenes retain their own current selection across repeated calls and world replacement', async () => {
  const { world } = await quietWorld(2),
    other = structuredClone(world),
    [a, b] = world.units
  world.selected = [a.id]
  other.selected = [b.id]
  const first = await makeSelectionScene(world),
    second = await makeSelectionScene(other)
  try {
    assertFrame(first, world)
    assertFrame(second, other)
    assert.notEqual(first.scene.unitMeshes.get(a.id), second.scene.unitMeshes.get(a.id))
    const secondGroup = second.scene.unitMeshes.get(b.id)
    world.selected.length = 0
    assertFrame(first, world)
    assertFrame(second, other)
    assert.equal(second.scene.unitMeshes.get(b.id), secondGroup)
    const replacement = structuredClone(world)
    replacement.selected = [a.id, b.id]
    first.scene.world = replacement
    assertFrame(first, replacement)
    assertFrame(second, other)
  } finally {
    second.close()
    first.close()
  }
})

test('explicit ReadonlySet authority overrides nonempty live selection and preserves existing animation branches', async () => {
  const { api, world } = await quietWorld(1),
    [unit] = world.units,
    fixture = await makeSelectionScene(world)
  try {
    api.setSelection(world, [unit.id])
    assertFrame(fixture, world)
    const args = parameters(fixture.personCalls[0]),
      empty = new Set(),
      selected = new Set([unit.id]),
      before = structuredClone(world)
    fixture.directPerson(...args, empty)
    assert.equal(
      args[0].userData.selection.visible,
      false,
      'wrapper must forward an explicitly empty set'
    )
    fixture.directPerson(...args)
    assert.equal(args[0].userData.selection.visible, true)
    api.animatePerson(fixture.scene, ...args, empty)
    assert.equal(
      args[0].userData.selection.visible,
      false,
      'helper must use cached false without live fallback'
    )
    assert.equal(api.unitAnimation(world, unit, empty), 'idle')
    world.selected = []
    fixture.directPerson(...args, selected)
    assert.equal(args[0].userData.selection.visible, true)
    assert.equal(api.unitAnimation(world, unit, selected), 'selected')
    assert.equal(api.unitAnimation(world, unit), 'idle')
    world.selected = before.selected
    for (const [patch, expected] of [
      [{ lift: 1 }, 'airborne'],
      [{ casting: {} }, 'cast'],
      [{ fight: { animation: 'stagger' } }, 'stagger'],
      [{ fighting: true }, 'attack'],
      [{ path: [{ x: unit.x + 1, z: unit.z }] }, 'walk'],
      [{ cargo: 1 }, 'carryIdle'],
      [{ harvest: true }, 'work'],
    ]) {
      const controlled = { ...structuredClone(unit), ...patch }
      assert.equal(api.unitAnimation(world, controlled), expected)
      assert.equal(api.unitAnimation(world, controlled, empty), expected)
    }
    assert.deepEqual(world, before)
  } finally {
    fixture.close()
  }
})

test('quiet idle full unit caller reads selected slots linearly with all people selected', async () => {
  const counts = []
  for (const count of [64, 256, 1024]) {
    const { api, world } = await quietWorld(count)
    api.setSelection(
      world,
      world.units.map(unit => unit.id)
    )
    assert.equal(world.selected.length, count)
    assert.ok(world.units.every(unit => api.unitAnimation(world, unit) === 'selected'))
    const fixture = await makeSelectionScene(world)
    try {
      fixture.render()
      let reads = 0
      for (let index = 0; index < world.selected.length; index++) {
        const id = world.selected[index]
        Object.defineProperty(world.selected, index, {
          configurable: true,
          enumerable: true,
          get() {
            reads++
            return id
          },
        })
      }
      const frozenBothQueries = () => {
        for (const unit of world.units) {
          world.selected.includes(unit.id)
          world.selected.includes(fixture.scene.unitMeshes.get(unit.id).userData.unit)
        }
      }
      frozenBothQueries()
      const oldSelectedSlots = reads
      reads = 0
      fixture.render()
      const currentSelectedSlots = reads
      assert.ok(
        currentSelectedSlots <= count * 2,
        `quiet idle full unit caller read ${currentSelectedSlots} selected slots for ${count} people`
      )
      assert.ok(
        [...fixture.scene.unitMeshes.values()].every(group => group.userData.selection.visible)
      )
      counts.push({ people: count, oldSelectedSlots, currentSelectedSlots })
    } finally {
      fixture.close()
    }
  }
  for (let i = 1; i < counts.length; i++)
    assert.equal(counts[i].currentSelectedSlots, counts[i - 1].currentSelectedSlots * 4)
  console.log(
    'Selected-slot diagnostic (frozen both includes queries vs actual idle full caller):',
    JSON.stringify(counts)
  )
})
