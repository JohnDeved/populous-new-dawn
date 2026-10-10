import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import models from '../app/original-models.json' with { type: 'json' }
import { modelStage, modelTextureModes } from '../app/model-faces.ts'
import {
  installOrdinaryTempleObserver,
  requireOrdinaryTempleFrame,
  requireTempleCoverage,
} from '../scripts/local-render/ordinary-temple-witness.mjs'
import {
  armTempleResourceAction,
  requireTempleTransition,
} from '../scripts/local-render/ordinary-temple-scenes.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function fixture(t) {
  const previous = new Map(),
    listeners = new Set(),
    events = new Map()
  let world = {
      outcome: { level: 3 },
      turn: 7,
      land: { landFlags: 0 },
      status: 'playing',
      speed: 1,
      paused: false,
      inputMask: 0,
      flyby: { flags: 0 },
      buildings: [],
    },
    shared = Object.freeze({ bank: 'p', modelAtlas: 'atlas-p', counter: 0, tile: 92, epoch: 1 })
  const store = {
    getWorld: () => world,
    getPresentationSnapshot: () => shared,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
  const building = {
    id: 1,
    kind: 'temple',
    team: 'blue',
    hp: 100,
    x: 2,
    z: 3,
    logs: 8,
    progress: 1,
  }
  world.buildings.push(building)
  const mesh = {
    visible: true,
    onAfterRender() {
      this.callbackCalls++
    },
    callbackCalls: 0,
    userData: { nativeModel: 95, stage: 4, nativeResource: Object.freeze({ id: 95, bank: 6 }) },
    material: {
      alphaTest: 0.5,
      side: 1,
      customProgramCacheKey: () =>
        mesh.userData.stage === 4 ? 'native-model-light-temple' : 'native-model-light',
      map: {
        userData: { encodedColors: true },
        image: { src: 'http://localhost/original/atlas-p.png', complete: true, naturalWidth: 256 },
      },
    },
  }
  const gl = {
    getExtension: () => null,
    getParameter: () => 'supplied GPU',
    isContextLost: () => false,
  }
  const canvas = {
    width: 1240,
    height: 1000,
    isConnected: true,
    copies: 0,
    toDataURL() {
      this.copies++
      return 'data:image/png;base64,AQID'
    },
  }
  const renderer = {
    info: { render: { frame: 0 } },
    calls: [],
    domElement: canvas,
    getContext: () => gl,
    draw: true,
    render(...args) {
      this.calls.push(args)
      this.info.render.frame++
      if (this.draw)
        mesh.onAfterRender(this, scene.scene, scene.camera, mesh.geometry, mesh.material, null)
      return 'real result'
    },
  }
  const group = { children: [mesh], visible: true, position: { x: 2, y: 3, z: 4 } }
  const scene = {
    world,
    renderer,
    scene: {},
    camera: {},
    templeResourceSnapshot: shared,
    buildingMeshes: new Map([[1, group]]),
    environment: Object.freeze({ landscape: { bank: 'p', modelAtlas: 'atlas-p' } }),
    overviewActive: false,
    overviewStage: null,
    viewTransition: false,
    cameraMotion: { active: false },
    viewPreset: 0,
    cameraPosition: { x: 1, z: 2 },
    view: {
      rawCenter: { x: 1, z: 2 },
      projection: { width: 1240 },
      screen: () => ({ x: 0, y: 0, z: 0 }),
      project: () => ({ flags: 0 }),
    },
  }
  const document = {
    querySelector: () => null,
    addEventListener(name, fn, capture) {
      events.set(fn, { name, capture })
    },
    removeEventListener(_name, fn) {
      events.delete(fn)
    },
  }
  for (const [key, value] of Object.entries({
    window: globalThis,
    testSceneRef: { current: scene },
    testStore: store,
    document,
    innerWidth: 1440,
    innerHeight: 1000,
    devicePixelRatio: 1,
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  t.after(() => {
    for (const [key, descriptor] of previous)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
  })
  const phase = (counter, epoch = 1) => {
    shared = Object.freeze({
      bank: 'p',
      modelAtlas: 'atlas-p',
      epoch,
      counter,
      tile: [92, 93, 94, 95, 100, 101, 102, 103, 108][counter],
    })
    scene.templeResourceSnapshot = shared
    if (mesh.userData.stage === 4) {
      mesh.userData.templeResourceEpoch = epoch
      mesh.userData.templeTileOffset = {
        value: { x: ((shared.tile & 7) - 4) / 8, y: -((shared.tile >> 3) - 11) / 32 },
      }
    }
  }
  const stage = value => {
    const data = modelStage(models[95], value),
      modes = modelTextureModes(models[95], value)
    const attrs = {
      position: { array: new Float32Array(data.p), count: data.p.length / 3 },
      uv: { array: new Float32Array(data.uv) },
      textureMode: { array: new Float32Array(modes) },
    }
    mesh.geometry = { getAttribute: name => attrs[name] }
    mesh.userData.stage = value
    mesh.material.side = value === 4 ? 1 : 2
    building.progress = value === 4 ? 1 : value / 4
    delete mesh.userData.templeTileOffset
    delete mesh.userData.templeResourceEpoch
    phase(shared.counter, shared.epoch)
  }
  stage(4)
  const click = (label, fn, trusted = true) => {
    const event = {
      isTrusted: trusted,
      button: 0,
      target: { closest: () => ({ getAttribute: () => label }) },
    }
    for (const [handler, row] of [...events]) if (row.capture) handler(event)
    fn()
    for (const callback of [...listeners]) callback()
    for (const [handler, row] of [...events]) if (!row.capture) handler(event)
  }
  return {
    scene,
    store,
    renderer,
    canvas,
    mesh,
    group,
    building,
    phase,
    stage,
    click,
    events,
    listeners,
    get world() {
      return world
    },
    replace(value) {
      world = value
      scene.world = value
    },
  }
}
function expected() {
  return {
    level: 3,
    bank: 'p',
    atlas: 'atlas-p',
    objects: 6,
    models: Object.fromEntries(
      [0, 1, 2, 3, 4].map(stage => {
        const data = modelStage(models[95], stage),
          modes = modelTextureModes(models[95], stage)
        return [
          `95:${stage}`,
          {
            positionsSha256: hash(Buffer.from(new Float32Array(data.p).buffer)),
            uvSha256: hash(Buffer.from(new Float32Array(data.uv).buffer)),
            modesSha256: hash(Buffer.from(new Float32Array(modes).buffer)),
            vertices: data.p.length / 3,
            mode32Vertices: modes.filter(x => x === 32).length,
            capVertices: modes.filter(x => x === 7).length,
          },
        ]
      })
    ),
  }
}

test('actual observer only copies naturally submitted pixels, preserves callbacks and binds two live tiles', async t => {
  const f = fixture(t),
    original = f.renderer.render,
    callback = f.mesh.onAfterRender,
    observer = installOrdinaryTempleObserver({ ids: [1] })
  assert.equal(f.renderer.calls.length, 0)
  const input = [f.scene.scene, f.scene.camera]
  assert.equal(f.renderer.render(...input), 'real result')
  assert.deepEqual(f.renderer.calls, [input])
  assert.equal(f.mesh.callbackCalls, 1)
  assert.equal(f.mesh.onAfterRender, callback)
  f.renderer.render(...input)
  assert.equal(f.canvas.copies, 1, 'Same tile is not duplicate evidence')
  f.phase(1)
  f.renderer.render(...input)
  f.phase(2)
  f.renderer.render(...input)
  assert.equal(f.canvas.copies, 2, 'Only the declared two completed samples are retained')
  assert.deepEqual(observer.close(), { closed: true, errors: [] })
  assert.equal(f.renderer.render, original)
  const report = await observer.read()
  assert.equal(report.frames.length, 2)
  for (const frame of report.frames) requireOrdinaryTempleFrame(frame, expected())
  requireTempleCoverage(report, { ids: [1] })
  f.mesh.geometry.getAttribute('position').array[0] = 999
  assert.deepEqual(await observer.read(), report, 'Digests bind captured copies, not late geometry')
})

test('actual staged construction and completion require cap geometry then shared completed material', async t => {
  const f = fixture(t),
    observer = installOrdinaryTempleObserver()
  for (const stage of [0, 1, 2, 3, 4]) {
    f.stage(stage)
    f.renderer.render(f.scene.scene, f.scene.camera)
  }
  f.phase(4)
  f.renderer.render(f.scene.scene, f.scene.camera)
  observer.close()
  const report = await observer.read()
  assert.deepEqual(
    report.frames.map(frame => frame.buildings[0].stage),
    [0, 1, 2, 3, 4, 4]
  )
  for (const frame of report.frames) requireOrdinaryTempleFrame(frame, expected())
  requireTempleCoverage(report, { ids: [1], construction: true })
  const missing = structuredClone(report)
  missing.frames = missing.frames.slice(4)
  assert.throws(
    () => requireTempleCoverage(missing, { ids: [1], construction: true }),
    /construction cap/
  )
})

test('frustum rejection, paused state and non-submission cannot become rendered evidence', async t => {
  const f = fixture(t),
    observer = installOrdinaryTempleObserver()
  f.renderer.draw = false
  f.renderer.render(f.scene.scene, f.scene.camera)
  assert.equal(f.canvas.copies, 0)
  f.renderer.draw = true
  f.world.paused = true
  f.renderer.render(f.scene.scene, f.scene.camera)
  f.world.paused = false
  f.scene.view.screen = () => ({ x: 2, y: 0, z: 0 })
  f.renderer.render(f.scene.scene, f.scene.camera)
  assert.equal(f.canvas.copies, 0)
  assert.deepEqual(observer.close(), { closed: true, errors: [] })
  assert.throws(
    () => requireTempleCoverage({ ...observer.status(), frames: [] }, { ids: [1] }),
    /two naturally/
  )
})

test('original render and callback exceptions propagate unchanged and all owned wrappers restore', t => {
  const f = fixture(t),
    error = Error('real render failure')
  f.renderer.render = function () {
    this.info.render.frame++
    throw error
  }
  const original = f.renderer.render,
    callback = f.mesh.onAfterRender,
    observer = installOrdinaryTempleObserver()
  assert.throws(
    () => f.renderer.render(f.scene.scene, f.scene.camera),
    value => value === error
  )
  assert.equal(f.mesh.onAfterRender, callback)
  observer.close()
  assert.equal(f.renderer.render, original)
})

test('replacement, phase drift and lost observer ownership fail without mutating product state', async t => {
  const f = fixture(t),
    observer = installOrdinaryTempleObserver(),
    original = f.renderer.render
  window.testSceneRef.current = { ...f.scene }
  f.renderer.render(f.scene.scene, f.scene.camera)
  assert.match(observer.status().errors[0], /owner changed/)
  assert.equal(f.canvas.copies, 0)
  assert.equal(f.world.turn, 7)
  const other = () => {}
  f.renderer.render = other
  assert.ok(observer.close().errors.some(error => /ownership changed/.test(error)))
  assert.equal(f.renderer.render, other)
  assert.notEqual(original, other)
})

test('strict frame assertions reject wrong atlas, phase, geometry, shader mode and missing live tile', async t => {
  const f = fixture(t),
    observer = installOrdinaryTempleObserver()
  f.renderer.render(f.scene.scene, f.scene.camera)
  observer.close()
  const report = await observer.read(),
    frame = report.frames[0]
  for (const change of [
    copy => {
      copy.buildings[0].source = 'http://localhost/original/temple-model-p.png'
    },
    copy => {
      copy.buildings[0].offset = [0.5, 0.5]
    },
    copy => {
      copy.buildings[0].positionsSha256 = 'bad'
    },
    copy => {
      copy.buildings[0].program = 'native-model-light'
    },
    copy => {
      copy.resource.bank = 'c'
    },
  ]) {
    const copy = structuredClone(frame)
    change(copy)
    assert.throws(() => requireOrdinaryTempleFrame(copy, expected()))
  }
  assert.throws(() => requireTempleCoverage(report, { ids: [1] }), /two naturally/)
})

test('trusted actual Load and Restart observers preserve synchronous phase lineage without direct mutators', t => {
  const f = fixture(t)
  f.phase(4)
  let observer = armTempleResourceAction({ kind: 'load', label: 'Load checkpoint' })
  f.click('Load checkpoint', () => {
    f.replace({ ...f.world, turn: 15 })
    f.phase(0, 2)
  })
  requireTempleTransition(observer.close())
  assert.equal(f.events.size, 0)
  assert.equal(f.listeners.size, 0)
  f.phase(5, 2)
  observer = armTempleResourceAction({ kind: 'restart', label: 'Restart world' })
  f.click('Restart world', () => f.replace({ ...f.world, turn: 0, buildings: [] }))
  requireTempleTransition(observer.close())
})

test('untrusted input and merely asynchronous resource reads do not satisfy replacement evidence', t => {
  const f = fixture(t)
  let observer = armTempleResourceAction({ kind: 'load', label: 'Load checkpoint' })
  f.click('Load checkpoint', () => f.replace({ ...f.world }), false)
  assert.throws(() => requireTempleTransition(observer.close()))
  observer = armTempleResourceAction({ kind: 'load', label: 'Load checkpoint' })
  assert.throws(() => requireTempleTransition(observer.close()))
  assert.equal(f.events.size, 0)
  assert.equal(f.listeners.size, 0)
})

test('a throwing product mesh callback is never suppressed by the observer', t => {
  const f = fixture(t),
    error = Error('real callback failure')
  f.mesh.onAfterRender = () => {
    throw error
  }
  const callback = f.mesh.onAfterRender,
    observer = installOrdinaryTempleObserver()
  assert.throws(
    () => f.renderer.render(f.scene.scene, f.scene.camera),
    value => value === error
  )
  assert.equal(f.mesh.onAfterRender, callback)
  assert.deepEqual(observer.close(), { closed: true, errors: [] })
})

test('phase drift within a real draw cannot yield a coherent Temple frame', t => {
  const f = fixture(t),
    real = f.mesh.onAfterRender
  f.mesh.onAfterRender = function (...args) {
    real.apply(this, args)
    f.phase(1)
  }
  const observer = installOrdinaryTempleObserver()
  f.renderer.render(f.scene.scene, f.scene.camera)
  assert.ok(observer.status().errors.some(error => /phase changed/.test(error)))
  assert.equal(f.canvas.copies, 0)
  observer.close()
})
