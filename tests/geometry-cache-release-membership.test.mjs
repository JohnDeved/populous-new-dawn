// Real scene-assets factories and releaseGroup in Node. Existing unit/vehicle
// caller tests supply ordinary frame/load coverage; this file isolates cache
// ownership, synchronous observer ordering and operation counts, not GPU/GC time.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture(),
  { geometry, nativeModel, releaseGroup, texture } = await import('../app/scene-assets.ts')
let nextKey = 0
const key = label => `release-membership-test/${label}/${nextKey++}`
const mesh = (geo, mat = new THREE.MeshBasicMaterial()) => new THREE.Mesh(geo, mat)
const group = (...children) => new THREE.Group().add(...children)
const onDispose = (resource, events, name) =>
  resource.addEventListener('dispose', () => events.push(name))

test('cached Mesh/Line geometry and shared texture survive ordered owned-resource cleanup', () => {
  const cached = new THREE.BoxGeometry(),
    cacheKey = key('shared'),
    events = []
  assert.equal(
    geometry(cacheKey, () => cached),
    cached
  )
  assert.equal(
    geometry(cacheKey, () => assert.fail('a cache hit must not call its factory')),
    cached
  )
  assert.equal(
    geometry(key('alias'), () => cached),
    cached,
    'two keys may own one geometry'
  )
  const owned = cached.clone(),
    firstMaterial = new THREE.MeshBasicMaterial(),
    lineMaterial = new THREE.LineBasicMaterial(),
    sharedMap = texture('lightning-bolt'),
    sharedSpriteMaterial = new THREE.SpriteMaterial({ map: sharedMap }),
    ownedMap = sharedMap.clone(),
    ownedSpriteMaterial = new THREE.SpriteMaterial({ map: ownedMap }),
    root = group(
      mesh(cached, firstMaterial),
      new THREE.Line(cached, lineMaterial),
      mesh(owned, [firstMaterial, lineMaterial]),
      new THREE.Line(owned, lineMaterial),
      new THREE.Sprite(sharedSpriteMaterial),
      new THREE.Sprite(ownedSpriteMaterial)
    )
  for (const [resource, name] of [
    [cached, 'shared geometry'],
    [owned, 'owned geometry'],
    [sharedMap, 'shared texture'],
    [ownedMap, 'owned texture'],
    [firstMaterial, 'first material'],
    [lineMaterial, 'line material'],
    [sharedSpriteMaterial, 'shared sprite material'],
    [ownedSpriteMaterial, 'owned sprite material'],
  ])
    onDispose(resource, events, name)
  releaseGroup(root)
  assert.deepEqual(events, [
    'owned geometry',
    'owned geometry',
    'owned texture',
    'first material',
    'line material',
    'shared sprite material',
    'owned sprite material',
  ])
  assert.equal(root.children[0].geometry, cached)
  assert.equal(root.children[1].geometry, cached)
  assert.equal(root.children[4].material.map, sharedMap)
  assert.equal(root.children[5].material.map, ownedMap)
})

test('same-key reentrant replacement and a throwing outer factory retain current cache ownership', () => {
  const overwrittenKey = key('overwrite'),
    inner = new THREE.BufferGeometry(),
    outer = new THREE.BufferGeometry(),
    events = []
  onDispose(inner, events, 'overwritten inner')
  onDispose(outer, events, 'current outer')
  assert.equal(
    geometry(overwrittenKey, () => {
      assert.equal(
        geometry(overwrittenKey, () => inner),
        inner
      )
      releaseGroup(group(mesh(inner)))
      assert.deepEqual(events, [], 'inner write is visible before the outer overwrite')
      return outer
    }),
    outer
  )
  assert.equal(
    geometry(overwrittenKey, () => assert.fail('outer value is now cached')),
    outer
  )
  releaseGroup(group(mesh(inner), new THREE.Line(outer, new THREE.LineBasicMaterial())))
  assert.deepEqual(events, ['overwritten inner'])

  const throwingKey = key('throw'),
    retained = new THREE.BufferGeometry(),
    neverStored = new THREE.BufferGeometry(),
    failure = new Error('controlled outer factory failure')
  // Warm ownership before the inner insertion; the throwing outer must not undo
  // the successful inner write's invalidation.
  releaseGroup(group(mesh(outer)))
  assert.throws(
    () =>
      geometry(throwingKey, () => {
        assert.equal(
          geometry(throwingKey, () => retained),
          retained
        )
        throw failure
      }),
    error => error === failure
  )
  assert.equal(
    geometry(throwingKey, () => assert.fail('the inner value survived')),
    retained
  )
  onDispose(retained, events, 'retained inner')
  onDispose(neverStored, events, 'never stored')
  releaseGroup(group(mesh(retained), mesh(neverStored)))
  assert.deepEqual(events, ['overwritten inner', 'never stored'])
})

test('a disposal observer cache insertion is visible to the next visited Mesh/Line', () => {
  const first = new THREE.BufferGeometry(),
    later = new THREE.BufferGeometry(),
    material = new THREE.MeshBasicMaterial(),
    events = [],
    laterKey = key('dispose-observer')
  first.addEventListener('dispose', () => {
    events.push('first geometry')
    assert.equal(
      geometry(laterKey, () => later),
      later
    )
  })
  onDispose(later, events, 'later geometry')
  onDispose(material, events, 'material')
  const root = group(mesh(first, material), new THREE.Line(later, material))
  releaseGroup(root)
  assert.deepEqual(events, ['first geometry', 'material'])
  assert.equal(root.children[1].geometry, later)
})

test('membership is captured before a geometry getter and disposal retains the second getter read', () => {
  const seed = new THREE.BufferGeometry(),
    newlyCached = new THREE.BufferGeometry(),
    secondRead = new THREE.BufferGeometry(),
    events = [],
    cacheKey = key('getter-insertion'),
    observed = mesh(new THREE.BufferGeometry())
  geometry(key('getter-seed'), () => seed)
  let reads = 0
  Object.defineProperty(observed, 'geometry', {
    get() {
      reads++
      events.push(`geometry read ${reads}`)
      if (reads === 1) {
        geometry(cacheKey, () => newlyCached)
        return newlyCached
      }
      return secondRead
    },
  })
  onDispose(newlyCached, events, 'newly cached geometry')
  onDispose(secondRead, events, 'second-read geometry')
  releaseGroup(group(observed, new THREE.Line(newlyCached, new THREE.LineBasicMaterial())))
  assert.deepEqual(events, ['geometry read 1', 'geometry read 2', 'second-read geometry'])
  assert.equal(reads, 2)
  assert.equal(
    geometry(cacheKey, () => assert.fail('getter insertion survived')),
    newlyCached
  )
})

test('nativeModel owns independent geometry/material clones while its cache and atlas survive', async () => {
  const world = api.createWorld(22),
    fixture = await makeSceneFixture(world),
    { nativeModelResource } = await import('../app/model-resources.ts')
  try {
    const before = structuredClone(world),
      first = nativeModel(13, 2, 4, false, fixture.scene.environment),
      second = nativeModel(13, 2, 4, false, fixture.scene.environment),
      resource = nativeModelResource(13, fixture.scene.environment.objects.bank),
      cached = geometry(`original-${resource.bank}-13-4`, () =>
        assert.fail('factory cached geometry')
      ),
      events = []
    assert.notEqual(first.geometry, cached)
    assert.notEqual(second.geometry, cached)
    assert.notEqual(first.geometry, second.geometry)
    assert.notEqual(
      first.geometry.getAttribute('position').array,
      cached.getAttribute('position').array
    )
    assert.deepEqual(
      first.geometry.getAttribute('position').array,
      cached.getAttribute('position').array
    )
    assert.notEqual(first.material, second.material)
    assert.equal(first.material.map, second.material.map)
    for (const [item, name] of [
      [cached, 'cached geometry'],
      [first.geometry, 'first geometry'],
      [second.geometry, 'second geometry'],
      [first.material, 'first material'],
      [second.material, 'second material'],
      [first.material.map, 'shared atlas'],
    ])
      onDispose(item, events, name)
    releaseGroup(group(first))
    assert.deepEqual(events, ['first geometry', 'first material'])
    releaseGroup(group(second))
    assert.deepEqual(events, [
      'first geometry',
      'first material',
      'second geometry',
      'second material',
    ])
    assert.deepEqual(
      world,
      before,
      'actual model resources do not change World, terrain or either RNG'
    )
  } finally {
    fixture.close()
  }
})

test('GameScene.dispose delegates real resource ownership once and preserves the World', async () => {
  const { GameScene } = await import('../app/scene.ts'),
    { FpsGraph } = await import('../app/fps-graph.ts'),
    { FramePerformance } = await import('../app/frame-performance.ts'),
    world = api.createWorld(1),
    before = structuredClone(world),
    shared = geometry(key('scene-dispose'), () => new THREE.BoxGeometry()),
    owned = shared.clone(),
    events = [],
    scene = new THREE.Scene(),
    globe = new THREE.Group(),
    sharedMaterial = new THREE.MeshBasicMaterial(),
    ownedMaterial = new THREE.LineBasicMaterial(),
    sharedMap = texture('lightning-bolt'),
    ownedMap = sharedMap.clone(),
    spriteMaterial = new THREE.SpriteMaterial({ map: ownedMap })
  scene.add(
    globe,
    mesh(shared, sharedMaterial),
    new THREE.Line(owned, ownedMaterial),
    new THREE.Sprite(spriteMaterial)
  )
  for (const [item, name] of [
    [shared, 'shared geometry'],
    [owned, 'owned geometry'],
    [sharedMap, 'shared texture'],
    [ownedMap, 'owned sprite map'],
    [sharedMaterial, 'shared material'],
    [ownedMaterial, 'owned material'],
    [spriteMaterial, 'sprite material'],
  ])
    onDispose(item, events, name)
  const leaf = name => () => events.push(name),
    disposable = name => ({ dispose: leaf(name) }),
    element = name => ({ remove: leaf(name) }),
    terrainLoad = new AbortController()
  globe.dispose = leaf('globe')
  const fpsGraph = Object.assign(Object.create(FpsGraph.prototype), {
    gpuTimer: disposable('gpu timer'), samples: new FramePerformance(), element: element('fps'),
  })
  fpsGraph.samples.sample(10, 1, 2, 3, 6)
  // The maintained lifecycle runs on actual Three resources. Browser/GPU/DOM
  // endpoints are observed leaves, without constructing a WebGL renderer.
  const receiver = {
    world,
    disposed: false,
    scene,
    globe,
    nearbyFollowers: { cancel: leaf('nearby cancel'), reset: leaf('nearby reset') },
    onNearbyFollowersCancel: leaf('nearby callback'),
    cancelNearbyFollowers: GameScene.prototype.cancelNearbyFollowers,
    releaseTrainingPanelRequests: leaf('training release'),
    presentationBinding: { release: leaf('presentation release') },
    frame: 0,
    ownedSounds: new Map([['sound', leaf('sound')]]),
    terrainLoad,
    resize: { disconnect: leaf('resize') },
    disposeListeners: [leaf('listener')],
    releaseGroup: GameScene.prototype.releaseGroup,
    waterMap: disposable('water map'),
    terrainMap: disposable('terrain map'),
    terrainUpload: new THREE.DataTexture(),
    minimap: { revision: undefined },
    view: disposable('view'),
    renderer: { ...disposable('renderer'), domElement: element('renderer element'), forceContextLoss: leaf('context loss') },
    fpsGraph,
    cancelTooltipInspection: GameScene.prototype.cancelTooltipInspection,
    tooltipInspectionInputs: ['diagnostic input'],
    tooltipInput: 'diagnostic input',
    tooltipElement: element('tooltip'),
    pointerOutline: element('pointer'),
    buildingPanels: new Map([['panel', element('building panel')]]),
    objectPanels: {
      releaseBuildingInspection: leaf('inspection release'),
      ...disposable('object panels'),
    },
    spellPointer: element('spell pointer'),
    worshipPresentation: disposable('worship'),
  }
  GameScene.prototype.dispose.call(receiver)
  assert.deepEqual(events, [
    'nearby cancel',
    'nearby callback',
    'nearby reset',
    'training release',
    'presentation release',
    'sound',
    'resize',
    'listener',
    'globe',
    'owned geometry',
    'owned sprite map',
    'shared material',
    'owned material',
    'sprite material',
    'water map',
    'terrain map',
    'view',
    'gpu timer',
    'fps',
    'renderer',
    'renderer element',
    'inspection release',
    'tooltip',
    'pointer',
    'building panel',
    'object panels',
    'spell pointer',
    'worship',
    'context loss',
  ])
  assert.equal(receiver.fpsGraph, null)
  assert.equal(fpsGraph.gpuTimer, null)
  assert.equal(fpsGraph.samples.recentFrames().length, 0)
  assert.equal(terrainLoad.signal.aborted, true)
  assert.equal(globe.parent, null)
  assert.equal(receiver.ownedSounds.size, 0)
  assert.equal(receiver.buildingPanels.size, 0)
  assert.deepEqual(receiver.tooltipInspectionInputs, [])
  assert.equal(receiver.tooltipInput, null)
  assert.deepEqual(world, before)
  const after = [...events]
  GameScene.prototype.dispose.call(receiver)
  assert.deepEqual(events, after, 'a repeated dispose does not release any resource twice')
  assert.deepEqual(world, before)
})

function captureRealCache(label) {
  const originalSet = Map.prototype.set,
    marker = new THREE.BufferGeometry(),
    markerKey = key(label)
  let cache
  Map.prototype.set = function set(entryKey, value) {
    const result = originalSet.call(this, entryKey, value)
    if (entryKey === markerKey && value === marker) cache = result
    return result
  }
  try {
    geometry(markerKey, () => marker)
  } finally {
    Map.prototype.set = originalSet
  }
  assert.ok(cache instanceof Map, 'capture only the private Map used by the actual geometry API')
  return cache
}

function measureRealRelease(label) {
  const cache = captureRealCache(label),
    originalValues = Map.prototype.values,
    originalIncludes = Array.prototype.includes,
    sharedKey = key(`${label}-shared`),
    cached = geometry(sharedKey, () => new THREE.BufferGeometry()),
    rows = []
  for (let i = 0; i < 64; i++) geometry(key(`${label}-seed`), () => new THREE.BufferGeometry())
  for (const count of [64, 256, 1024]) {
    const material = new THREE.MeshBasicMaterial(),
      root = group(...Array.from({ length: count }, () => mesh(cached, material)))
    for (const phase of ['cold', 'warm', 'post-insert']) {
      if (phase !== 'warm') geometry(key(`${label}-${phase}`), () => new THREE.BufferGeometry())
      else
        assert.equal(
          geometry(sharedKey, () => assert.fail('warm hit must not create')),
          cached
        )
      // Reference capture and fixture creation are outside the measured interval.
      const expectedValues = [...originalValues.call(cache)],
        row = {
          count,
          phase,
          cacheSize: cache.size,
          valuesCalls: 0,
          valuesRead: 0,
          resultArrays: 0,
        }
      Map.prototype.values = function values() {
        const iterator = originalValues.call(this)
        if (this !== cache) return iterator
        row.valuesCalls++
        return {
          next(...args) {
            const result = iterator.next(...args)
            if (!result.done) row.valuesRead++
            return result
          },
          [Symbol.iterator]() {
            return this
          },
        }
      }
      Array.prototype.includes = function includes(value, ...args) {
        if (value === cached && this.length === expectedValues.length && args.length === 0) {
          let same = true
          for (let i = 0; i < this.length; i++) if (this[i] !== expectedValues[i]) same = false
          if (same) row.resultArrays++
        }
        return originalIncludes.call(this, value, ...args)
      }
      try {
        releaseGroup(root)
      } finally {
        Map.prototype.values = originalValues
        Array.prototype.includes = originalIncludes
      }
      rows.push(row)
    }
  }
  // Emit every row before either cost assertion so the unchanged baseline's
  // expected failure retains the complete cold/warm/insertion measurements.
  console.log(`${label} ${JSON.stringify(rows)}`)
  return rows
}

test('real releaseGroup cache-value visits rebuild once after insertion and reuse warm membership', () => {
  const rows = measureRealRelease('geometry-cache-values')
  for (const row of rows) {
    assert.equal(row.valuesCalls, row.phase === 'warm' ? 0 : 1, JSON.stringify(row))
    assert.equal(row.valuesRead, row.phase === 'warm' ? 0 : row.cacheSize, JSON.stringify(row))
  }
})

test('real releaseGroup removes the per-Mesh cache-values result Array boundary', () => {
  const rows = measureRealRelease('geometry-cache-result-arrays')
  for (const row of rows) assert.equal(row.resultArrays, 0, JSON.stringify(row))
})
