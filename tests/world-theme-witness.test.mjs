import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  armThemeAction,
  observeThemeAction,
  requireThemeCheckpoint,
  waitForThemeSave,
  installThemeFrame,
  readThemePose,
} from '../scripts/local-render/world-theme-witness.mjs'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'
import {
  admitThemeMode,
  referenceSource,
  requireThemeFrame,
} from '../scripts/local-render/world-theme-switch.mjs'

// Supplied browser/IO boundary, executing the actual maintained helper exports.
// These are observer contracts, never a browser, real input or original-data pass.
function browserFixture(t) {
  const globals = new Map(),
    listeners = new Set(),
    events = new Map()
  let world = {
    outcome: { level: 3 },
    turn: 80,
    time: 8,
    paused: true,
    speed: 1,
    status: 'playing',
    inputMask: 0,
    flyby: { flags: 0 },
    trees: [],
    units: [{ id: 1, team: 'blue', kind: 'brave', hp: 12, x: 2, z: 3 }],
    terrain: new Uint16Array([1, 7]),
    mana: 1,
    wood: 2,
    shots: { blast: 3 },
    giftCounts: new Map([[1, 2]]),
  }
  const store = {
    getWorld: () => world,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
  const main = { __reactFiberTest: { memoizedState: { memoizedState: store } } }
  const document = {
    querySelector: selector => (selector === 'main' ? main : null),
    addEventListener(name, listener, capture = false) {
      events.set(listener, { name, capture })
    },
    removeEventListener(_name, listener) {
      events.delete(listener)
    },
  }
  const install = (name, value) => {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  for (const [key, value] of Object.entries({
    window: globalThis,
    document,
    innerWidth: 1440,
    innerHeight: 1000,
    devicePixelRatio: 1,
    testStore: store,
    testSceneRef: { current: null },
  }))
    install(key, value)
  t.after(() => {
    delete globalThis.worldThemeCheckpoint
    for (const [key, descriptor] of globals)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
  })
  const click = (label, action, { trusted = true, aria = null } = {}) => {
    const event = {
      isTrusted: trusted,
      button: 0,
      target: { closest: () => ({ textContent: label, getAttribute: () => aria }) },
    }
    for (const [fn, settings] of [...events]) if (settings.capture) fn(event)
    action?.()
    for (const [fn, settings] of [...events]) if (!settings.capture) fn(event)
  }
  const notify = () => {
    for (const fn of [...listeners]) fn()
  }
  const replace = next => {
    world = next
    notify()
  }
  const page = {
    disposed: 0,
    async evaluate(fn, arg) {
      return fn(arg)
    },
    async evaluateHandle(fn, arg) {
      const value = fn(arg)
      return {
        evaluate: fn => fn(value),
        dispose: async () => {
          page.disposed++
        },
      }
    },
  }
  return {
    store,
    page,
    listeners,
    events,
    click,
    notify,
    replace,
    get world() {
      return world
    },
  }
}

test('actual Save observer owns the trusted event and exact typed snapshot, then cleans once', async t => {
  const f = browserFixture(t),
    observer = armThemeAction({ kind: 'save', label: 'Save checkpoint' })
  f.click('Other action', f.notify)
  assert.equal(observer.read().captured, false)
  f.click('Save checkpoint', f.notify)
  assert.equal(observer.read().captured, true)
  assert.equal(observer.read().boundary.replaced, false)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.events.size, 0)
  const before = await checkpointObservation({ observationName: 'worldThemeCheckpoint' })
  f.world.terrain[0] = 900
  f.world.units[0].hp = 1
  f.world.giftCounts.set(1, 50)
  assert.deepEqual(await checkpointObservation({ observationName: 'worldThemeCheckpoint' }), before)
  assert.equal(observer.close().closed, true)
  assert.deepEqual(observer.close().errors, [])
  assert.equal(Object.hasOwn(globalThis, 'worldThemeCheckpoint'), false)
})

test('actual action composition captures Load before normal auto-resume and closes the handle', async t => {
  const f = browserFixture(t),
    saved = structuredClone(f.world)
  const result = await observeThemeAction({
    page: f.page,
    signal: new AbortController().signal,
    kind: 'load',
    label: 'Load checkpoint',
    click: async () =>
      f.click('Load checkpoint', () => {
        f.replace(saved)
        saved.paused = false
        saved.turn++
        f.notify()
      }),
  })
  assert.equal(result.evidence.boundary.after.turn, 80)
  assert.equal(result.evidence.boundary.after.paused, true)
  assert.equal(result.digest.turn, 80)
  assert.equal(result.evidence.cleanup, true)
  assert.equal(f.world.turn, 81)
  assert.equal(f.world.paused, false)
  assert.equal(f.page.disposed, 1)
  assert.equal(f.events.size + f.listeners.size, 0)
})

test('actual observer uses shipped mission aria-label and fresh Restart turn without changing either', t => {
  const f = browserFixture(t)
  for (const [kind, label] of [
    ['start', 'Mission 2'],
    ['restart', 'Restart world'],
  ]) {
    const observer = armThemeAction({ kind, label })
    f.click(`${label}Play`, () => f.replace({ ...f.world, outcome: { level: 2 }, turn: 0 }), {
      aria: label,
    })
    assert.equal(observer.read().boundary.after.turn, 0)
    assert.equal(observer.read().boundary.after.level, 2)
    assert.deepEqual(observer.close().errors, [])
  }
})

test('untrusted clicks and wrong replacement direction are errors without escaping into game callbacks', t => {
  const f = browserFixture(t)
  for (const trusted of [false, true]) {
    const observer = armThemeAction({ kind: 'save', label: 'Save checkpoint' })
    assert.doesNotThrow(() =>
      f.click('Save checkpoint', () => f.replace(structuredClone(f.world)), { trusted })
    )
    assert.equal(observer.read().captured, false)
    assert.match(
      observer.read().errors[0],
      trusted ? /replacement boundary/ : /trusted primary click/
    )
    observer.close()
    assert.equal(f.events.size + f.listeners.size, 0)
  }
})

test('action composition cleans after click rejection, cancellation and a missed notification', async t => {
  const f = browserFixture(t)
  for (const mode of ['throw', 'abort', 'missing']) {
    const controller = new AbortController()
    await assert.rejects(
      observeThemeAction({
        page: f.page,
        signal: controller.signal,
        kind: 'load',
        label: 'Load checkpoint',
        click: async () => {
          if (mode === 'throw') throw Error('Delivered click failed')
          if (mode === 'abort') controller.abort(Error('Cancelled route'))
        },
      }),
      mode === 'throw'
        ? /Delivered click failed/
        : mode === 'abort'
          ? /Cancelled route/
          : /Missing synchronous/
    )
    assert.equal(f.events.size + f.listeners.size, 0)
    assert.equal(Object.hasOwn(globalThis, 'worldThemeCheckpoint'), false)
  }
  assert.equal(f.page.disposed, 3)
})

test('observer cleanup never deletes another owner snapshot', t => {
  const f = browserFixture(t),
    observer = armThemeAction({ kind: 'load', label: 'Load Game' })
  const other = { marker: 'foreign' }
  globalThis.worldThemeCheckpoint = other
  assert.match(observer.close().errors[0], /ownership changed/)
  assert.equal(globalThis.worldThemeCheckpoint, other)
  assert.equal(f.events.size + f.listeners.size, 0)
})

const checkpoint = () => ({
  version: 1,
  level: 3,
  turn: 80,
  time: 8,
  checkpointSha256: 'a'.repeat(64),
  actorsSha256: 'b'.repeat(64),
  terrainSha256: 'c'.repeat(64),
  stockSha256: 'd'.repeat(64),
})

test('actual Save waiter awaits sequential committed reads and verifies the complete typed digest', async () => {
  const expected = checkpoint(),
    sequence = [null, { ...expected, level: 2 }, { ...expected, turn: 79 }, expected]
  let pending = false,
    reads = 0,
    pauses = 0
  const result = await waitForThemeSave({
    expected,
    signal: new AbortController().signal,
    observeCheckpoint: async label => {
      assert.equal(label, 'Theme UI save committed')
      assert.equal(pending, false)
      pending = true
      await new Promise(resolve => setImmediate(resolve))
      pending = false
      return { checkpoint: sequence[reads++] }
    },
    pause: async () => {
      assert.equal(pending, false)
      pauses++
    },
  })
  assert.equal(reads, 4)
  assert.equal(pauses, 3)
  assert.deepEqual(result.checkpoint, expected)
})

test('typed mismatch, storage errors, missing commit and cancellation never become Save success', async () => {
  const expected = checkpoint()
  for (const field of ['stockSha256', 'checkpointSha256']) {
    let reads = 0
    await assert.rejects(
      waitForThemeSave({
        expected,
        signal: new AbortController().signal,
        observeCheckpoint: async () => {
          reads++
          return { checkpoint: { ...expected, [field]: 'e'.repeat(64) } }
        },
        pause: async () => {},
      }),
      /Checkpoint stockSha256|complete typed checkpoint/
    )
    assert.equal(reads, 1)
  }
  let reads = 0
  await assert.rejects(
    waitForThemeSave({
      expected,
      signal: new AbortController().signal,
      observeCheckpoint: async () => {
        reads++
        return { checkpoint: null }
      },
      pause: async () => {},
    }),
    /did not commit/
  )
  assert.equal(reads, 100)
  await assert.rejects(
    waitForThemeSave({
      expected,
      signal: new AbortController().signal,
      observeCheckpoint: async () => {
        throw Error('Storage failed')
      },
    }),
    /Storage failed/
  )
  const controller = new AbortController()
  await assert.rejects(
    waitForThemeSave({
      expected,
      signal: controller.signal,
      observeCheckpoint: async () => {
        controller.abort(Error('Stop'))
        return { checkpoint: expected }
      },
    }),
    /Stop/
  )
  assert.throws(() => requireThemeCheckpoint({}, {}))
})

function frameFixture(t) {
  const f = browserFixture(t),
    data = { p: [0, 0, 0, 1, 0, 0, 0, 1, 0], uv: [0, 0, 1, 0, 0, 1] }
  f.world.paused = false
  const tree = { id: 9, model: 3, x: 1, z: 2, logs: 4 }
  f.world.trees.push(tree)
  const positions = new Float32Array(data.p),
    uv = new Float32Array(data.uv)
  const resource = Object.freeze({ id: 15, bank: 6, data, shapeIndices: [1, 1, 1, 1] })
  const mesh = {
    userData: { nativeModel: 15, nativeResource: resource, stage: 4 },
    geometry: { getAttribute: name => ({ array: name === 'position' ? positions : uv }) },
    material: {
      map: {
        userData: { encodedColors: true },
        image: {
          complete: true,
          naturalWidth: 256,
          naturalHeight: 1024,
          src: 'http://127.0.0.1/original/atlas-p.png',
        },
      },
    },
  }
  const canvas = {
    width: 1440,
    height: 1000,
    isConnected: true,
    toDataURL: () => 'data:image/png;base64,AQID',
  }
  const gl = {
    getExtension: () => null,
    getParameter: () => 'supplied renderer',
    isContextLost: () => false,
  }
  const renderer = {
    domElement: canvas,
    info: { render: { frame: 0 } },
    calls: [],
    getContext: () => gl,
    render(...args) {
      this.calls.push(args)
      this.info.render.frame++
      return 'original result'
    },
  }
  const buffer = new ArrayBuffer(386048),
    scene = {
      world: f.world,
      renderer,
      scene: {},
      camera: {},
      environment: Object.freeze({}),
      overviewActive: false,
      overviewStage: null,
      viewPreset: 0,
      cameraPosition: { x: 3, y: 4 },
      view: { rawCenter: { x: 3, y: 4 }, projection: { width: 1440 } },
      visible: () => true,
      mini: { toDataURL: () => 'data:image/png;base64,AQID' },
      decorations: { children: [{ visible: true, userData: { point: tree }, children: [mesh] }] },
      buildingMeshes: new Map(),
      terrainTextures: {
        palette: new Uint8Array(buffer, 0, 1024),
        colors: new Uint8Array(buffer, 1024, 294912),
        cliffs: new Uint8Array(buffer, 295936, 8192),
        detail: new Int8Array(buffer, 304128, 65536),
        fade: new Uint8Array(buffer, 369664, 16384),
      },
    }
  globalThis.testSceneRef.current = scene
  return { ...f, scene, renderer, mesh, resource, positions, uv, buffer }
}

test('natural frame observer preserves the real call and hashes captured live bytes only at read time', async t => {
  const f = frameFixture(t),
    original = f.renderer.render,
    observer = installThemeFrame()
  assert.equal(f.renderer.calls.length, 0, 'Installing cannot force a draw')
  assert.equal(f.renderer.render(f.scene.scene, f.scene.camera), 'original result')
  assert.equal(f.renderer.calls.length, 1)
  assert.equal(f.renderer.render, original)
  assert.equal(observer.status().captured, true)
  const before = await observer.read()
  new Uint8Array(f.buffer)[0] = 15
  f.positions[0] = 2
  f.resource.data.p[0] = 3
  assert.deepEqual(await observer.read(), before, 'Late reads must hash the captured copies')
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(before.terrainSha256, hash(new Uint8Array(386048)))
  assert.equal(
    before.trees[0].positionsSha256,
    hash(Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer))
  )
  assert.deepEqual(before.visibleTreeIds, [9])
  assert.deepEqual(observer.close(), { captured: true, errors: [], closed: true })
  assert.equal(readThemePose().level, 3)
})

test('default frame mode rejects absent identities; explicit reference still requires ordinary readiness', async t => {
  const f = frameFixture(t)
  delete f.scene.environment
  delete f.mesh.userData.nativeResource
  let observer = installThemeFrame()
  f.renderer.render(f.scene.scene, f.scene.camera)
  await assert.rejects(observer.read(), /immutable environment/)
  observer.close()
  observer = installThemeFrame({ requireIdentity: false })
  f.renderer.render(f.scene.scene, f.scene.camera)
  assert.equal((await observer.read()).environment, null)
  assert.equal((await observer.read()).trees[0].bank, null)
  observer.close()
  f.scene.world.paused = true
  observer = installThemeFrame({ requireIdentity: false })
  f.renderer.render(f.scene.scene, f.scene.camera)
  await assert.rejects(observer.read(), /settled ordinary play/)
  observer.close()
})

test('render exception, replacement and pre-capture cancellation preserve original behavior and cleanup', async t => {
  const f = frameFixture(t),
    failure = Error('Original draw failed')
  f.renderer.render = () => {
    throw failure
  }
  let observer = installThemeFrame()
  assert.throws(
    () => f.renderer.render(f.scene.scene, f.scene.camera),
    error => error === failure
  )
  assert.equal(observer.close().closed, true)
  f.renderer.render = function () {
    this.info.render.frame++
  }
  const original = f.renderer.render
  observer = installThemeFrame()
  globalThis.testSceneRef.current = { world: f.scene.world }
  f.renderer.render(f.scene.scene, f.scene.camera)
  await assert.rejects(observer.read(), /owner replaced/)
  assert.equal(f.renderer.render, original)
  observer.close()
  globalThis.testSceneRef.current = f.scene
  observer = installThemeFrame()
  assert.equal(observer.close().captured, false)
  assert.equal(f.renderer.render, original)
})

test('reference admission checks the fixed full app/public scope and rejects source or untracked drift', () => {
  let calls = []
  const git = args => {
    calls.push(args)
    return args[0] === 'rev-parse' ? 'tree' : ''
  }
  assert.deepEqual(admitThemeMode('/repo', 'candidate', git), { mode: 'candidate' })
  assert.deepEqual(calls, [])
  assert.equal(admitThemeMode('/repo', 'reference', git).referenceSource, referenceSource)
  assert.deepEqual(calls[0], ['diff', '--exit-code', referenceSource, '--', 'app', 'public'])
  assert.deepEqual(calls[1], ['ls-files', '--others', '--exclude-standard', '--', 'app', 'public'])
  calls = []
  assert.throws(
    () =>
      admitThemeMode('/repo', 'reference', () => {
        throw Error('Source differs')
      }),
    /Source differs/
  )
  assert.throws(
    () =>
      admitThemeMode('/repo', 'reference', args =>
        args[0] === 'ls-files' ? 'app/untracked.ts' : ''
      ),
    /untracked/
  )
  assert.throws(() => admitThemeMode('/repo', 'auto', git), /Explicit/)
})

test('candidate frame assertion rejects wrong live terrain, model bytes and material independently of descriptor', () => {
  const expected = {
    level: 3,
    landscape: 'p',
    objects: 6,
    requestedLandscape: 25,
    requestedObjects: 6,
    terrain: 'landscape-p.bin',
    atlas: 'atlas-p',
    models: {
      15: {
        dataSha256: 'data',
        shapes: [1, 1, 1, 1],
        positionsSha256: 'positions',
        uvSha256: 'uv',
        vertices: 3,
      },
    },
  }
  const frame = {
    level: 3,
    rendererFrame: 1,
    terrainSha256: 'a07fc142b38441dd65bc99e55e2eb8f33a6423b4d02b3662f3be78e4eb4880f9',
    environment: {
      landscape: {
        requested: 25,
        bank: 'p',
        supported: true,
        terrain: 'landscape-p.bin',
        modelAtlas: 'atlas-p',
      },
      objects: { requested: 6, bank: 6, supported: true },
    },
    camera: { overview: false },
    visibleTreeIds: [9],
    trees: [{ model: 15, bank: 6, stage: 4, ...expected.models[15] }],
    materials: [
      { model: 15, bank: 6, encoded: true, src: 'http://127.0.0.1/original/atlas-p.png' },
    ],
  }
  assert.doesNotThrow(() => requireThemeFrame(frame, expected))
  for (const mutate of [
    row => {
      row.terrainSha256 = 'c'
    },
    row => {
      row.trees[0].positionsSha256 = 'wrong'
    },
    row => {
      row.trees[0].dataSha256 = 'wrong'
    },
    row => {
      row.materials[0].src = 'http://127.0.0.1/original/atlas.png'
    },
    row => {
      row.visibleTreeIds = []
    },
  ]) {
    const changed = structuredClone(frame)
    mutate(changed)
    assert.throws(() => requireThemeFrame(changed, expected))
  }
  const temple = structuredClone(frame)
  temple.materials = [
    { ...temple.materials[0], model: 95, src: 'http://127.0.0.1/original/temple-model-p.png' },
  ]
  assert.throws(
    () => requireThemeFrame(temple, expected),
    /atlas-p.png/,
    'Candidate ordinary Temple uses the full selected atlas'
  )
  temple.terrainSha256 = '8b23328932f2aeac33a0ce65e64cc0ab9bc110fe35a812b1d53ab81f9e68f68f'
  temple.environment = null
  assert.doesNotThrow(
    () => requireThemeFrame(temple, expected, { reference: true }),
    'Only explicit historical reference permits its old selective Temple atlas'
  )
})
