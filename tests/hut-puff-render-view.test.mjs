// Actual full building frame, puff sprites, transforms and resource release.
// Natural command8 admission supports the producer; other populations/observers
// diagnose a bounded renderer seam, not browser/native/hardware performance.
import assert from 'node:assert/strict'
import test from 'node:test'
import effects from '../app/original-effects.json' with { type: 'json' }
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makePlanScene } from './support/plan-scene.mjs'
import { fullHutScene } from './support/hut-smoke-scene.mjs'

const puffs = world => {
  const entries = []
  for (const slot of world.secondaryEffects.order) {
    const entry = world.secondaryEffects.slots[slot]
    if (entry?.kind === 'hutPuff') entries.push(entry)
  }
  return entries
}

async function poolApi() {
  const api = await loadSceneFixture(),
    pool = await import('../app/secondary-effects.ts')
  return { api, pool }
}

async function quietPuffs(count) {
  const { api, pool } = await poolApi(),
    world = api.createWorld(22),
    owner = world.secondaryEffects
  world.buildings = []
  assert.equal(owner.slots.length, 160)
  assert.deepEqual(owner.order, [])
  assert.deepEqual(owner.reservations, [])
  // Explicit consumer diagnostics use the maintained bounded allocator and the
  // child's shipped lifetime/phase fields; they are not ordinary hut emissions.
  for (let index = 0; index < count; index++)
    assert.notEqual(
      pool.allocateSecondaryEffect(
        owner,
        {
          kind: 'hutPuff',
          counter: world.effectCounter,
          position: { x: 8192 + index * 256, y: 12288, h: 400 + index },
          lifetime: 16,
          frameStart: owner.animationFrame,
        },
        20
      ),
      null,
      'diagnostic population stays within the real pool and reserve20 admission'
    )
  return { api, pool, world }
}

async function actualFixture(world, supplied) {
  const fixture = supplied ?? (await makePlanScene(world)),
    { scene } = fixture,
    { GameScene } = await import('../app/scene.ts'),
    { releaseGroup } = await import('../app/scene-assets.ts')
  Object.assign(scene, {
    planGeometry: GameScene.prototype.planGeometry,
    y: GameScene.prototype.y,
    locate: GameScene.prototype.locate,
    orientModel: GameScene.prototype.orientModel,
    releaseGroup,
  })
  return {
    ...fixture,
    render: () => GameScene.prototype.updateBuildingsFrame.call(scene),
    close: () => {
      for (const group of scene.hutSmokePuffs.values()) {
        group.removeFromParent()
        scene.releaseGroup(group)
      }
      scene.hutSmokePuffs.clear()
      fixture.close()
    },
  }
}

function assertDraw(api, group, puff, owner) {
  const frame = (((owner.animationFrame - puff.frameStart) % 16) + 16) % 16,
    art = effects.animations.hutSmokePartial[frame],
    sprite = group.children[0],
    point = api.browserPosition(puff.position)
  assert.equal(group.name, 'hut-smoke-puff')
  assert.deepEqual(group.position.toArray(), [point.x, Math.round(puff.position.h) / 128, point.z])
  assert.deepEqual(group.quaternion.toArray(), [0, 0, 0, 1])
  assert.deepEqual(sprite.scale.toArray(), [art.w, art.h, 1])
  assert.deepEqual(sprite.userData.atlasTransform.toArray(), [
    art.w / effects.width,
    art.h / effects.height,
    ((art.index % 8) * 256) / effects.width,
    1 - (Math.floor(art.index / 8) * 256 + art.h) / effects.height,
  ])
}

test('natural command8 child retains actual cache, frame and shared-atlas ownership through ordered removal', async () => {
  const supplied = await fullHutScene(),
    fixture = await actualFixture(supplied.scene.world, supplied),
    { scene, api, render } = fixture,
    { pool } = await poolApi()
  let atlas, onAtlasDispose, spriteGeometry, onGeometryDispose
  try {
    render()
    let child = puffs(scene.world).find(entry => entry.lifetime === 16)
    for (let visit = 0; visit < 512 && !child; visit++) {
      api.advanceGame(scene.world, scene.gameClock, 1 / 12)
      render()
      child = puffs(scene.world).find(entry => entry.lifetime === 16)
    }
    assert.ok(child, 'maintained full-root gate emits after real command8 admission')
    assert.equal(child.lifetime, 16)
    const group = scene.hutSmokePuffs.get(child.serial),
      sprite = group.children[0],
      root = scene.buildingMeshes.get(supplied.hut.id).userData.hutOccupancySmoke
    atlas = sprite.material.map
    assert.equal(atlas, root.sprite.material.map)
    assertDraw(api, group, child, scene.world.secondaryEffects)
    const before = structuredClone(scene.world)
    for (let frame = 0; frame < 3; frame++) {
      render()
      assert.equal(scene.hutSmokePuffs.get(child.serial), group)
      assert.deepEqual(scene.world, before, 'render does not age/allocate or consume either RNG')
    }
    const events = [],
      remove = group.removeFromParent.bind(group),
      release = scene.releaseGroup,
      drop = scene.hutSmokePuffs.delete.bind(scene.hutSmokePuffs)
    let atlasDisposals = 0,
      geometryDisposals = 0
    onAtlasDispose = () => atlasDisposals++
    atlas.addEventListener('dispose', onAtlasDispose)
    spriteGeometry = sprite.geometry
    onGeometryDispose = () => geometryDisposals++
    spriteGeometry.addEventListener('dispose', onGeometryDispose)
    sprite.material.addEventListener('dispose', () => events.push('material'))
    group.removeFromParent = () => {
      events.push('remove')
      return remove()
    }
    scene.releaseGroup = current => {
      if (current === group) events.push('release')
      release(current)
    }
    scene.hutSmokePuffs.delete = id => {
      if (id === child.serial) events.push('delete')
      return drop(id)
    }
    // Controlled owned removal after natural birth, not ordinary demolition.
    const slot = scene.world.secondaryEffects.order.find(
      current => scene.world.secondaryEffects.slots[current] === child
    )
    pool.releaseSecondaryEffect(scene.world.secondaryEffects, slot)
    const removed = structuredClone(scene.world)
    render()
    assert.deepEqual(events, ['remove', 'release', 'material', 'delete'])
    assert.equal(group.parent, null)
    assert.equal(scene.hutSmokePuffs.has(child.serial), false)
    assert.equal(atlasDisposals, 0)
    assert.equal(geometryDisposals, 0, 'shared Sprite geometry is not owned by puff cleanup')
    assert.deepEqual(scene.world, removed)
    render()
    assert.deepEqual(events, ['remove', 'release', 'material', 'delete'])
    assert.deepEqual(scene.world, removed)
  } finally {
    if (onAtlasDispose) atlas.removeEventListener('dispose', onAtlasDispose)
    if (onGeometryDispose) spriteGeometry.removeEventListener('dispose', onGeometryDispose)
    fixture.close()
  }
})

test('puff snapshot precedes cleanup and retains ordered live records and captured owner across World replacement', async () => {
  const { api, pool, world } = await quietPuffs(3),
    fixture = await actualFixture(world),
    { scene, render } = fixture,
    owner = world.secondaryEffects,
    [first, later, stale] = puffs(world),
    replacement = (await quietPuffs(1)).world
  replacement.secondaryEffects.animationFrame = 9
  try {
    render()
    const firstGroup = scene.hutSmokePuffs.get(first.serial),
      laterGroup = scene.hutSmokePuffs.get(later.serial),
      staleGroup = scene.hutSmokePuffs.get(stale.serial),
      staleSlot = owner.order.find(slot => owner.slots[slot] === stale)
    pool.releaseSecondaryEffect(owner, staleSlot)
    const expected = structuredClone(world),
      expectedLater = puffs(expected).find(entry => entry.serial === later.serial),
      addition = {
        kind: 'hutPuff',
        counter: world.effectCounter,
        position: { x: 16384, y: 12288, h: 700 },
        lifetime: 16,
        frameStart: 2,
      }
    expected.secondaryEffects.animationFrame += 2
    expectedLater.position.x += 256
    pool.allocateSecondaryEffect(expected.secondaryEffects, structuredClone(addition), 20)
    const expectedReplacement = structuredClone(replacement)
    let callbacks = 0
    staleGroup.children[0].material.addEventListener('dispose', () => {
      callbacks++
      owner.animationFrame += 2
      later.position.x += 256
      pool.allocateSecondaryEffect(owner, addition, 20)
      scene.world = replacement
    })
    const calls = [],
      locate = scene.locate
    scene.locate = function (group, point, height) {
      if (group.name === 'hut-smoke-puff') calls.push(group)
      return locate.call(this, group, point, height)
    }
    render()
    assert.equal(callbacks, 1)
    assert.deepEqual(calls, [firstGroup, laterGroup], 'membership was captured before disposal')
    assertDraw(api, firstGroup, first, owner)
    assertDraw(api, laterGroup, later, owner)
    assert.equal(scene.hutSmokePuffs.size, 2)
    assert.equal(staleGroup.parent, null)
    assert.equal(
      scene.hutSmokePuffs.has(owner.nextSerial - 1),
      false,
      'new child waits for next snapshot'
    )
    assert.equal(scene.hutSmokePuffs.has(puffs(replacement)[0].serial), false)
    assert.deepEqual(world, expected)
    assert.deepEqual(replacement, expectedReplacement)
    calls.length = 0
    render()
    const replacementChild = puffs(replacement)[0]
    assert.equal(scene.hutSmokePuffs.size, 1)
    assert.equal(firstGroup.parent, null)
    assert.equal(laterGroup.parent, null)
    assertDraw(
      api,
      scene.hutSmokePuffs.get(replacementChild.serial),
      replacementChild,
      replacement.secondaryEffects
    )
    assert.deepEqual(replacement, expectedReplacement)
    scene.world = world
    render()
    assert.deepEqual(
      [...scene.hutSmokePuffs.keys()],
      puffs(world).map(entry => entry.serial)
    )
    assert.deepEqual(world, expected)
  } finally {
    fixture.close()
  }
})

test('draw-time owned removal defers membership changes while captured puff position and frame remain live', async () => {
  const { api, pool, world } = await quietPuffs(2),
    fixture = await actualFixture(world),
    { scene, render } = fixture,
    owner = world.secondaryEffects,
    [first, later] = puffs(world)
  try {
    render()
    const firstGroup = scene.hutSmokePuffs.get(first.serial),
      laterGroup = scene.hutSmokePuffs.get(later.serial),
      slot = owner.order.find(index => owner.slots[index] === later),
      expected = structuredClone(world),
      expectedLater = structuredClone(later),
      addition = {
        kind: 'hutPuff',
        counter: world.effectCounter,
        position: { x: 20480, y: 12288, h: 600 },
        lifetime: 16,
        frameStart: 5,
      }
    expectedLater.position.y += 256
    pool.releaseSecondaryEffect(expected.secondaryEffects, slot)
    expected.secondaryEffects.animationFrame = 5
    pool.allocateSecondaryEffect(expected.secondaryEffects, structuredClone(addition), 20)
    let changed = false
    const calls = [],
      locate = scene.locate
    scene.locate = function (group, point, height) {
      if (group.name === 'hut-smoke-puff') calls.push(group)
      const result = locate.call(this, group, point, height)
      if (!changed && group === firstGroup) {
        changed = true
        later.position.y += 256
        pool.releaseSecondaryEffect(owner, slot)
        owner.animationFrame = 5
        pool.allocateSecondaryEffect(owner, addition, 20)
      }
      return result
    }
    render()
    assert.deepEqual(calls, [firstGroup, laterGroup])
    assertDraw(api, firstGroup, first, { animationFrame: 0 })
    assertDraw(api, laterGroup, later, owner)
    assert.deepEqual(later, expectedLater, 'freed record is still the captured live reference')
    assert.equal(scene.hutSmokePuffs.has(owner.nextSerial - 1), false)
    assert.deepEqual(world, expected)
    calls.length = 0
    render()
    const child = puffs(world)[0]
    assert.equal(laterGroup.parent, null)
    assert.equal(scene.hutSmokePuffs.get(first.serial), firstGroup)
    assert.deepEqual(calls, [scene.hutSmokePuffs.get(child.serial), firstGroup])
    assertDraw(api, firstGroup, first, owner)
    assert.deepEqual(world, expected)
  } finally {
    fixture.close()
  }
})

test('migrated NaN serials rebuild repeatedly while duplicate signed-zero and Infinity keys retain ordered drawing and Scene ownership', async () => {
  const { api, pool, world: source } = await quietPuffs(4)
  for (const [index, entry] of puffs(source).entries()) entry.serial = [NaN, -0, Infinity, 0][index]
  const world = api.migrateCheckpoint(structuredClone(source)),
    fixture = await actualFixture(world),
    { scene, render } = fixture,
    entries = puffs(world)
  let other
  try {
    render()
    const zero = scene.hutSmokePuffs.get(0),
      infinite = scene.hutSmokePuffs.get(Infinity),
      expected = structuredClone(world),
      calls = [],
      locate = scene.locate
    assert.ok(
      entries.some(entry => Number.isNaN(entry.serial)),
      'restore retains this strict-equality edge'
    )
    assert.equal(scene.hutSmokePuffs.size, 3)
    scene.locate = function (group, point, height) {
      if (group.name === 'hut-smoke-puff') calls.push(group)
      return locate.call(this, group, point, height)
    }
    for (let visit = 0; visit < 3; visit++) {
      const previous = scene.hutSmokePuffs.get(NaN)
      let disposals = 0
      previous.children[0].material.addEventListener('dispose', () => disposals++)
      calls.length = 0
      render()
      assert.equal(disposals, 1)
      assert.equal(previous.parent, null)
      assert.notEqual(scene.hutSmokePuffs.get(NaN), previous, 'strict some never matches NaN')
      assert.equal(scene.hutSmokePuffs.get(-0), zero)
      assert.equal(scene.hutSmokePuffs.get(Infinity), infinite)
      assert.deepEqual(
        calls,
        entries.map(entry => scene.hutSmokePuffs.get(entry.serial))
      )
      assertDraw(
        api,
        zero,
        entries.filter(entry => entry.serial === 0).at(-1),
        world.secondaryEffects
      )
      assert.deepEqual(
        world,
        expected,
        'all terrain, pool/lifetimes and both RNG owners remain equal'
      )
    }
    const restored = api.migrateCheckpoint(structuredClone(world))
    other = await actualFixture(restored)
    other.render()
    const independent = other.scene.hutSmokePuffs.get(0),
      expectedOther = structuredClone(restored)
    assert.notEqual(independent, zero)
    scene.world = { ...world, secondaryEffects: pool.createSecondaryEffects(world.turn) }
    const empty = structuredClone(scene.world)
    render()
    assert.equal(scene.hutSmokePuffs.size, 0)
    assert.equal(scene.objects.children.length, 0)
    assert.deepEqual(scene.world, empty)
    other.render()
    assert.equal(other.scene.hutSmokePuffs.get(0), independent)
    assert.deepEqual(restored, expectedOther)
    scene.world = world
    render()
    assert.equal(scene.hutSmokePuffs.size, 3)
    assert.notEqual(scene.hutSmokePuffs.get(0), zero)
    assert.deepEqual(world, expected)
  } finally {
    other?.close()
    fixture.close()
  }
})

async function diagnose(t, kind) {
  const rows = []
  for (const population of [16, 64, 128]) {
    const { world } = await quietPuffs(population),
      fixture = await actualFixture(world),
      { scene, render } = fixture,
      owner = world.secondaryEffects
    let originalFlatMap
    try {
      render()
      assert.equal(scene.buildingMeshes.size, 0)
      assert.equal(scene.plans.size, 0)
      const meshes = [...scene.hutSmokePuffs.values()]
      let serialReads = 0
      for (const entry of puffs(world)) {
        const { serial } = entry
        Object.defineProperty(entry, 'serial', {
          configurable: true,
          enumerable: true,
          get: () => {
            serialReads++
            return serial
          },
        })
      }
      assert.equal(Object.getPrototypeOf(owner.order), Array.prototype)
      assert.equal(Object.hasOwn(owner.order, 'flatMap'), false)
      originalFlatMap = Array.prototype.flatMap
      const results = [],
        observer = function (...args) {
          const result = originalFlatMap.apply(this, args)
          results.push(result)
          return result
        }
      Object.defineProperty(owner.order, 'flatMap', { configurable: true, value: observer })
      const reads = []
      for (let frame = 0; frame < 3; frame++) {
        const before = structuredClone(world)
        serialReads = 0
        render()
        reads.push(serialReads)
        assert.equal(owner.order.flatMap, observer)
        assert.deepEqual([...scene.hutSmokePuffs.values()], meshes)
        assert.deepEqual(
          world,
          before,
          'actual full caller preserves full World, terrain and both RNG owners'
        )
      }
      const row = {
        kind,
        population,
        frames: 3,
        fullCallerSerialReads: reads,
        flatMapResultArrayObjects: results.length,
        flatMapResultElements: results.reduce((sum, result) => sum + result.length, 0),
        scope:
          'Quiet bounded allocator reserve20; puff-only secondary population, empty building/plan maps; no whole-frame/backing-store/GC/browser/native/hardware result',
      }
      rows.push(row)
      t.diagnostic(JSON.stringify(row))
    } finally {
      if (originalFlatMap) delete owner.order.flatMap
      fixture.close()
    }
  }
  return rows
}

test('bounded quiet puff populations have linear actual full-caller serial reads', async t => {
  const rows = await diagnose(t, 'hut-puff-membership-boundary')
  assert.deepEqual(
    rows.map(row => row.fullCallerSerialReads),
    rows.map(row => Array(3).fill(row.population * 2)),
    'current-frame membership plus unchanged drawing must read each puff serial twice'
  )
})

test('repeated actual puff frames remove the flatMap-result Array object boundary', async t => {
  const rows = await diagnose(t, 'hut-puff-flatMap-result-array-boundary')
  assert.deepEqual(
    rows.map(row => row.flatMapResultArrayObjects),
    [0, 0, 0],
    'the original eager puff view must not create a new flatMap result Array each frame'
  )
  assert.deepEqual(
    rows.map(row => row.flatMapResultElements),
    [0, 0, 0]
  )
})
