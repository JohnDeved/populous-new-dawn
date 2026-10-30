// Real RenderView/Painter caches with controlled Three geometry and renderer
// callbacks. These tests prove reference ownership, not GPU pixels or host RAM.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'

const mouse = new THREE.Vector2(0, 0)
const camera = new THREE.Camera()
const renderer = { setTransparentSort() {} }

function fixture(triangles = 2, transparent = false) {
  const view = new RenderView(),
    scene = new THREE.Scene()
  const values = new Float32Array(triangles * 9)
  for (let i = 0; i < triangles; i++) values.set([-1, 0, -1, 1, 0, -1, 0, 0, 1], i * 9)
  const geometry = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.BufferAttribute(values, 3)
  )
  const material = new THREE.MeshBasicMaterial({ transparent })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  // Stable projections make callback interruption assertions independent of
  // camera framing; the real cache, interpolation and painter paths still run.
  view.visible = () => true
  view.screen = point => new THREE.Vector4(point.x, point.z, 0, 1)
  view.prepare(scene)
  scene.updateMatrixWorld(true)
  return {
    view,
    scene,
    mesh,
    geometry,
    material,
    position: geometry.getAttribute('position'),
    close() {
      view.dispose()
      geometry.dispose()
      material.dispose()
    },
  }
}

function candidates(view, objects) {
  return view.pickCandidates(mouse, objects, camera, true)
}

function warm(f) {
  const picked = candidates(f.view, [f.scene])
  assert.ok(picked.length)
  f.view.pickSubmissionKey([f.scene])
  f.view.painter.update(f.scene, renderer)
  f.view.painter.afterRender()
  assert.ok(f.view.painter.command(f.mesh, 0))
  return picked
}

function heldState(f) {
  const painter = f.view.painter
  return {
    picks: f.view.groundPickCache,
    pick: f.view.groundPickCache.get(f.mesh).get(0),
    submissions: f.view.pickSubmissions,
    submission: f.view.pickSubmissions.get(f.mesh),
    vertices: painter.vertices,
    vertex: painter.vertices.entries.get(f.position),
    centers: painter.centers,
    center: painter.centers.get(f.position),
    ranges: painter.ranges,
    range: painter.ranges.get(f.mesh),
    commands: painter.commandsBySlot,
    image: painter.texture.image,
    texture: painter.texture,
  }
}

function bytes(state) {
  return {
    world: state.pick.world.map(p => p.toArray()),
    screen: state.pick.screen.map(p => p.toArray()),
    slots: state.pick.slots && Array.from(state.pick.slots),
    cells: Array.from(state.submission.cells),
    source: Array.from(state.vertex.source),
    seen: Array.from(state.vertex.seen),
    depth: Array.from(state.vertex.depth),
    projected: structuredClone(state.vertex.projected),
    centers: Array.from(state.center.positions.array),
    range: [...state.range],
    commands: structuredClone(state.commands),
    pixels: Array.from(state.image.data),
  }
}

function released(f, state) {
  const painter = f.view.painter
  assert.notEqual(f.view.groundPickCache, state.picks)
  assert.equal(f.view.groundPickCache.get(f.mesh), undefined)
  assert.notEqual(f.view.pickSubmissions, state.submissions)
  assert.equal(f.view.pickSubmissions.get(f.mesh), undefined)
  assert.notEqual(painter.vertices, state.vertices)
  assert.equal(painter.vertices.entries.get(f.position), undefined)
  assert.notEqual(painter.centers, state.centers)
  assert.equal(painter.centers.get(f.position), undefined)
  assert.notEqual(painter.ranges, state.ranges)
  assert.equal(painter.ranges.get(f.mesh), undefined)
  assert.notEqual(painter.commandsBySlot, state.commands)
  assert.deepEqual(painter.commandsBySlot, [])
  assert.notEqual(painter.texture.image, state.image)
  assert.equal(painter.texture.image.data.length, 1024)
  assert.equal(painter.texture.image.width, 1024)
  assert.equal(painter.texture.image.height, 1)
  assert.equal(painter.texture, state.texture, 'shader uniform texture identity is stable')
  assert.equal(f.view.uniforms.nativePainter.value, state.texture)
  assert.equal(painter.depth(f.mesh, 0, 0), null)
}

test('disposal detaches owned caches without mutating held data or shared source resources', () => {
  const f = fixture(1025),
    successor = new RenderView()
  const world = {
    heights: new Int16Array([1, 2]),
    categories: new Uint8Array([3, 4]),
    flags: new Uint32Array([5]),
    cells: { heads: new Uint16Array([0]), objects: new Map() },
  }
  const saved = structuredClone(world)
  f.view.painter.land = world
  f.view.painter.landFlags = world.flags
  f.view.painter.cells = world.cells
  let geometryDisposed = 0,
    materialDisposed = 0
  f.geometry.addEventListener('dispose', () => geometryDisposed++)
  f.material.addEventListener('dispose', () => materialDisposed++)
  try {
    const expected = warm(f),
      state = heldState(f),
      before = bytes(state)
    const source = f.position.array.slice(),
      materials = f.view.materials
    const hook = f.mesh.onBeforeRender,
      compile = f.material.onBeforeCompile
    assert.equal(state.image.data.length, 2048, 'actual update grew the depth buffer')
    successor.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
    successor.visible = f.view.visible
    successor.screen = f.view.screen
    const successorCandidates = candidates(successor, [f.scene])
    const successorCache = successor.groundPickCache.get(f.mesh)
    f.view.dispose()
    f.view.dispose()
    released(f, state)
    assert.deepEqual(bytes(state), before)
    assert.deepEqual(f.position.array, source)
    assert.deepEqual(world, saved)
    assert.equal(geometryDisposed, 0)
    assert.equal(materialDisposed, 0)
    assert.equal(f.view.materials, materials)
    assert.equal(f.mesh.onBeforeRender, hook)
    assert.equal(f.material.onBeforeCompile, compile)
    assert.equal(successor.groundPickCache.get(f.mesh), successorCache)
    assert.deepEqual(successorCandidates, expected)
    assert.deepEqual(candidates(f.view, [f.scene]), expected)
    assert.notEqual(f.view.groundPickCache.get(f.mesh).get(0), state.pick)
    f.view.pickSubmissionKey([f.scene])
    f.view.painter.update(f.scene, renderer)
    assert.notEqual(f.view.painter.vertices.entries.get(f.position), state.vertex)
    assert.notEqual(f.view.painter.centers.get(f.position), state.center)
    assert.deepEqual(Array.from(f.view.painter.texture.image.data), before.pixels)
    assert.deepEqual(bytes(state), before, 'reusing the view never recycles a held old buffer')
  } finally {
    successor.dispose()
    f.close()
  }
})

test('native picking completes after reentrant disposal without repopulating caches', () => {
  const f = fixture(),
    extra = new THREE.Mesh(f.geometry, f.material)
  f.scene.add(extra)
  try {
    const expected = candidates(f.view, [f.scene])
    f.view.groundPickCache = new WeakMap()
    const project = f.view.screen
    let interrupted = false
    f.view.screen = (...args) => {
      if (!interrupted) {
        interrupted = true
        f.view.dispose()
        assert.deepEqual(
          candidates(f.view, [extra]),
          expected.filter(c => c.object === extra)
        )
      }
      return project(...args)
    }
    assert.deepEqual(candidates(f.view, [f.scene]), expected)
    assert.equal(f.view.groundPickCache.get(f.mesh), undefined)
    assert.equal(f.view.groundPickCache.get(extra), undefined)
    assert.equal(f.view.ordinaryPickDepth, 0)
    assert.deepEqual(candidates(f.view, [f.scene]), expected)
    assert.ok(f.view.groundPickCache.get(f.mesh))
    assert.ok(f.view.groundPickCache.get(extra))
  } finally {
    f.close()
  }
})

test('submission-key callbacks cannot publish through a disposed outer or nested query', () => {
  const f = fixture()
  const index = new THREE.BufferAttribute(new Uint32Array([0, 1, 2, 3, 4, 5]), 1)
  f.geometry.setIndex(index)
  f.mesh.userData.terrainGrid = true
  const expected = f.view.pickSubmissionKey([f.scene]),
    original = f.view.pickSubmissions
  const getX = index.getX
  let interrupted = false
  index.needsUpdate = true
  index.getX = function (i) {
    if (!interrupted) {
      interrupted = true
      f.view.dispose()
      assert.equal(f.view.pickSubmissionKey([f.scene]), expected)
    }
    return getX.call(this, i)
  }
  try {
    assert.equal(f.view.pickSubmissionKey([f.scene]), expected)
    assert.notEqual(f.view.pickSubmissions, original)
    assert.equal(f.view.pickSubmissions.get(f.mesh), undefined)
    assert.equal(f.view.ordinaryPickDepth, 0)
    assert.equal(f.view.pickSubmissionKey([f.scene]), expected)
    assert.ok(f.view.pickSubmissions.get(f.mesh))
    index.needsUpdate = true
    index.getX = () => {
      f.view.dispose()
      throw new Error('index callback')
    }
    assert.throws(() => f.view.pickSubmissionKey([f.scene]), /index callback/)
    assert.equal(f.view.ordinaryPickDepth, 0)
    index.getX = getX
    assert.equal(f.view.pickSubmissionKey([f.scene]), expected)
  } finally {
    f.close()
  }
})

test('a pick keeps painter depth until resolution when projection disposes the view', () => {
  const f = fixture()
  try {
    warm(f)
    const expected = f.view.pick(mouse, [f.scene], camera, true)
    assert.notEqual(expected.depth, 0, 'painter depth differs from geometric candidate depth')
    const state = heldState(f),
      before = bytes(state),
      project = f.view.screen
    f.view.groundPickCache = new WeakMap()
    let interrupted = false
    f.view.screen = (...args) => {
      if (!interrupted) {
        interrupted = true
        f.view.dispose()
      }
      assert.equal(f.view.painter.ranges, state.ranges)
      assert.equal(f.view.painter.texture.image, state.image)
      return project(...args)
    }
    assert.deepEqual(f.view.pick(mouse, [f.scene], camera, true), expected)
    released(f, state)
    assert.deepEqual(bytes(state), before)
  } finally {
    f.close()
  }
})

for (const throws of [false, true])
  test(`direct update disposal waits for all CPU writes (${throws ? 'throw' : 'normal'})`, () => {
    const f = fixture(2, true)
    try {
      warm(f)
      const state = heldState(f),
        originalGroups = f.geometry.groups,
        visible = f.view.visible
      let interrupted = false
      f.view.visible = (...args) => {
        if (!interrupted) {
          interrupted = true
          f.view.dispose()
          assert.equal(f.view.painter.ranges, state.ranges)
          assert.equal(f.view.painter.commandsBySlot, state.commands)
          assert.equal(f.view.painter.texture.image, state.image)
          if (throws) throw new Error('update callback')
        }
        return visible(...args)
      }
      if (throws) assert.throws(() => f.view.painter.update(f.scene, renderer), /update callback/)
      else f.view.painter.update(f.scene, renderer)
      released(f, state)
      assert.equal(f.mesh.material, f.material)
      assert.equal(f.geometry.groups, originalGroups)
      assert.equal(f.view.painter.transparentMeshes.length, 0)
      f.view.visible = visible
      f.view.painter.update(f.scene, renderer)
      assert.ok(f.view.painter.command(f.mesh, 0))
      f.view.painter.afterRender()
    } finally {
      f.close()
    }
  })

for (const throws of [false, true])
  test(`nested render disposal preserves outer leases (${throws ? 'throw' : 'normal'})`, () => {
    const f = fixture(2, true)
    try {
      warm(f)
      const state = heldState(f),
        originalGroups = f.geometry.groups
      let disposedTextures = 0
      f.view.painter.texture.addEventListener('dispose', () => disposedTextures++)
      f.view.painter.render(
        {
          render() {
            f.view.painter.update(f.scene, renderer)
            const outerGroups = f.geometry.groups,
              outerMaterial = f.mesh.material
            const inner = {
              render() {
                f.view.painter.update(f.scene, renderer)
                f.view.dispose()
                f.view.dispose()
                assert.equal(f.view.painter.ranges, state.ranges)
                assert.equal(f.view.painter.commandsBySlot, state.commands)
                assert.equal(f.view.painter.texture.image, state.image)
                assert.equal(disposedTextures, 0)
                if (throws) throw new Error('inner render')
                f.view.painter.afterRender()
              },
            }
            if (throws)
              assert.throws(() => f.view.painter.render(inner, f.scene, camera), /inner render/)
            else f.view.painter.render(inner, f.scene, camera)
            assert.equal(f.geometry.groups, outerGroups)
            assert.equal(f.mesh.material, outerMaterial)
            assert.equal(f.view.painter.ranges, state.ranges)
            assert.equal(f.view.painter.texture.image, state.image)
            assert.equal(disposedTextures, 0)
            f.view.painter.afterRender()
          },
        },
        f.scene,
        camera
      )
      assert.equal(f.geometry.groups, originalGroups)
      assert.equal(f.mesh.material, f.material)
      assert.equal(f.view.painter.transparentMeshes.length, 0)
      assert.equal(disposedTextures, 1)
      released(f, state)
    } finally {
      f.close()
    }
  })

test('texture-dispose callbacks cannot recursively dispose or overwrite a fresh independent update', () => {
  const f = fixture()
  try {
    warm(f)
    let events = 0
    f.view.painter.texture.addEventListener('dispose', () => {
      events++
      f.view.painter.dispose()
      f.view.painter.update(f.scene, renderer)
    })
    f.view.dispose()
    assert.equal(events, 1)
    assert.ok(f.view.painter.command(f.mesh, 0))
    assert.ok(f.view.painter.vertices.entries.get(f.position))
  } finally {
    f.close()
  }
})

test('direct resolution retains painter ordering and blocks nested cache publication after disposal', () => {
  const f = fixture()
  try {
    warm(f)
    const choices = candidates(f.view, [f.scene])
    f.mesh.userData.selectionCommands = [{}, {}]
    const index = new THREE.BufferAttribute(new Uint32Array([0, 1, 2, 3, 4, 5]), 1)
    f.geometry.setIndex(index)
    f.view.painter.texture.image.data[0] = 0.25
    f.view.painter.texture.image.data[1] = 0.125
    const expected = f.view.resolvePickCandidates(choices),
      state = heldState(f)
    // The last candidate is nearer in painter order; geometric fallback on that
    // candidate would incorrectly leave the first candidate selected.
    assert.equal(expected.triangle, 1)
    const getX = index.getX
    let reads = 0
    index.getX = function (i) {
      reads++
      if (reads === 1) f.view.dispose()
      else if (reads === 2) {
        candidates(f.view, [f.scene])
        f.view.pickSubmissionKey([f.scene])
        assert.equal(f.view.groundPickCache.get(f.mesh), undefined)
        assert.equal(f.view.pickSubmissions.get(f.mesh), undefined)
      }
      return getX.call(this, i)
    }
    assert.deepEqual(f.view.resolvePickCandidates(choices), expected)
    released(f, state)
    assert.equal(f.view.pickOperationDepth, 0)
    assert.equal(f.view.ordinaryPickDepth, 0)
    assert.ok(candidates(f.view, [f.scene]).length)
    assert.ok(f.view.groundPickCache.get(f.mesh))
  } finally {
    f.close()
  }
})
