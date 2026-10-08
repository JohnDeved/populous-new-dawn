import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installOrdinaryZoomWitness } from '../scripts/local-render/ordinary-zoom-witness.mjs'
import ordinaryZoom, { assertOrdinaryZoomEvidence } from '../scripts/local-render/ordinary-zoom.mjs'

function fixture({
  own = false,
  failure = null,
  readbackFailure = null,
  installFailure = false,
} = {}) {
  const globals = Object.fromEntries(
    ['window', 'document', 'performance'].map(key => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  )
  const listeners = [],
    calls = [],
    result = {},
    config = { scale: 100, diameter: 50, boundsMode: 0, bounds: [1, 2] }
  let now = 100,
    readbacks = 0
  const world = Object.freeze({
    outcome: Object.freeze({ level: 1 }),
    turn: 12,
    speed: 1,
    paused: false,
    status: 'playing',
    inputMask: 0,
    flyby: Object.freeze({ flags: 0 }),
    randomState: 44,
    cosmeticRandom: Object.freeze({ randomState: 55 }),
  })
  const clock = Object.freeze({ animationFrame: 24 })
  const original = function (...args) {
    calls.push({ receiver: this, args })
    if (failure) throw failure
    renderer.info.render.frame++
    return result
  }
  const renderer = Object.create({ render: original })
  if (own)
    Object.defineProperty(renderer, 'render', {
      value: original,
      configurable: true,
      writable: true,
      enumerable: false,
    })
  renderer.info = { render: { frame: 1 } }
  renderer.domElement = {
    width: 1440,
    height: 1000,
    isConnected: true,
    toDataURL() {
      readbacks++
      if (readbackFailure) throw readbackFailure
      return 'data:image/png;base64,AA=='
    },
  }
  const scene = {
    world,
    gameClock: clock,
    renderer,
    scene: {},
    camera: {},
    keys: new Set(),
    viewPreset: 0,
    viewTransition: null,
    cameraTime: 0,
    cameraBearing: 0,
    viewPoint: { x: 0, z: 0 },
    overviewActive: false,
    overviewStage: null,
    view: {
      config,
      projection: { scale: 100 },
      rawCenter: { x: 0, y: 0 },
      bounds: [[1, 2]],
      boundsTexture: { image: { data: new Float32Array([1, 2]) } },
      painter: { commandsBySlot: [1, 2] },
    },
    terrain: { count: 1, geometry: { drawRange: { count: 6 } } },
  }
  const win = {
    testSceneRef: { current: scene },
    testStore: { getWorld: () => world },
    addEventListener(type, listener, capture) {
      if (installFailure && listeners.length === 1) throw new Error('Listener installation failed')
      listeners.push({ type, listener, capture })
    },
    removeEventListener(type, listener, capture) {
      const index = listeners.findIndex(
        value => value.type === type && value.listener === listener && value.capture === capture
      )
      if (index !== -1) listeners.splice(index, 1)
    },
  }
  globalThis.window = win
  globalThis.document = { querySelector: () => null }
  globalThis.performance = { now: () => now }
  const setFrame = (remaining, fraction, scale, preset = scene.viewPreset) => {
    scene.viewPreset = preset
    scene.view.config = { ...config, scale }
    scene.view.projection = { scale }
    scene.viewTransition = remaining
      ? {
          remaining,
          previewFraction: fraction,
          preview: fraction ? { scale } : undefined,
          time: fraction / 24,
          config: { ...config },
        }
      : null
  }
  const dispatch = (key, type = 'keydown', trusted = true) => {
    let code = `Key${key.toUpperCase()}`
    if (key === '-') code = 'Minus'
    if (key === '=') code = 'Equal'
    const event = {
      key,
      code,
      type,
      isTrusted: trusted,
      repeat: false,
      timeStamp: ++now,
      target: { tagName: 'CANVAS' },
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      defaultPrevented: false,
    }
    for (const entry of listeners) if (entry.type === type && entry.capture) entry.listener(event)
    // Test stand-in for the installed public handler, between passive phases.
    if (type === 'keydown' && ['-', '='].includes(key)) {
      scene.viewPreset = key === '-' ? 2 : 0
      scene.viewTransition = {
        remaining: 18,
        previewFraction: 0,
        preview: undefined,
        time: 0,
        config: structuredClone(scene.view.config),
      }
      event.defaultPrevented = true
    } else if (type === 'keydown') scene.keys.add(key)
    else scene.keys.delete(key)
    for (const entry of listeners) if (entry.type === type && !entry.capture) entry.listener(event)
    return event
  }
  const press = key => {
    dispatch(key)
    dispatch(key, 'keyup')
  }
  return {
    scene,
    renderer,
    world,
    clock,
    original,
    calls,
    result,
    listeners,
    setFrame,
    dispatch,
    press,
    draw: () => renderer.render(scene.scene, scene.camera),
    readbacks: () => readbacks,
    advance: ms => {
      now += ms
    },
    install() {
      installOrdinaryZoomWitness()
      return window.ordinaryZoom
    },
    restore() {
      for (const [key, descriptor] of Object.entries(globals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
    },
  }
}

function composedEpisode(f, { missFraction = false } = {}) {
  const witness = f.install()
  witness.arm('out')
  f.draw()
  f.press('-')
  for (const args of [
    [17, 0.4, 110],
    [9, 0.2, 140],
    [2, 0.3, 180],
    [0, 0, 200, 2],
  ]) {
    f.setFrame(...args)
    f.draw()
  }
  f.press('=')
  f.setFrame(0, 0, 100, 0)
  f.draw()
  witness.arm('reversal')
  f.draw()
  f.press('-')
  f.setFrame(17, 0.4, 110)
  f.draw()
  if (missFraction) {
    f.setFrame(0, 0, 200, 2)
    f.draw()
  }
  f.press('=')
  f.setFrame(17, 0.5, 105)
  f.draw()
  f.setFrame(0, 0, 100, 0)
  f.draw()
  witness.arm('combined')
  f.draw()
  f.dispatch('w')
  f.dispatch('q')
  f.press('-')
  f.scene.viewPoint = { x: 1, z: 0 }
  f.scene.cameraBearing = 0.2
  f.setFrame(17, 0.2, 110)
  f.draw()
  f.dispatch('q', 'keyup')
  f.dispatch('w', 'keyup')
  f.setFrame(0, 0, 200, 2)
  f.draw()
  witness.close()
  return { ...witness.read(), cleanupError: null }
}

test('composed delivered input and natural draw boundaries retain the actual fractional reversal', () => {
  const f = fixture(),
    beforeWorld = structuredClone(f.world),
    beforeClock = structuredClone(f.clock)
  try {
    const evidence = composedEpisode(f)
    assertOrdinaryZoomEvidence(evidence)
    const reversal = evidence.records.find(
      row => row.ordinal === evidence.cases[1].reversal.ordinal
    )
    assert.equal(reversal.before.fraction, 0.4)
    assert.equal(reversal.after.fraction, 0)
    assert.deepEqual(reversal.before.config, reversal.after.config)
    assert.equal(reversal.matchesLastRender, true)
    assert.deepEqual(f.world, beforeWorld)
    assert.deepEqual(f.clock, beforeClock)
    assert.equal(f.readbacks(), 12)
    assert.equal(f.listeners.length, 0)
    assert.equal(f.renderer.render, f.original)
    assert.equal(Object.hasOwn(f.renderer, 'render'), false)
    for (const frame of Object.values(evidence.frames))
      assert.equal(evidence.records.find(row => row.ordinal === frame.ordinal).kind, 'render')
    const calls = f.calls.length
    window.ordinaryZoom.read()
    assert.equal(f.calls.length, calls, 'Export cannot draw or advance anything')
  } finally {
    f.restore()
  }
})

test('host delay reaching an endpoint is a missed reversal, never a fabricated fractional pass', () => {
  const f = fixture()
  try {
    const evidence = composedEpisode(f, { missFraction: true })
    assert.equal(evidence.cases[1].reversal.fractional, false)
    assert.throws(() => assertOrdinaryZoomEvidence(evidence), /Fractional reversal missed/)
    assert.equal(
      evidence.records.filter(
        row =>
          row.kind === 'keyboard' &&
          row.type === 'keydown' &&
          row.phase === 'reversal' &&
          row.key === '='
      ).length,
      1
    )
  } finally {
    f.restore()
  }
})

test('original callback receiver/arguments/result and descriptor are preserved; no draw on installation', () => {
  const f = fixture({ own: true }),
    descriptor = Object.getOwnPropertyDescriptor(f.renderer, 'render')
  try {
    const witness = f.install()
    witness.arm('out')
    assert.equal(f.calls.length, 0)
    const receiver = {},
      tail = {},
      args = [f.scene.scene, f.scene.camera, tail]
    assert.equal(f.renderer.render.call(receiver, ...args), f.result)
    assert.equal(f.calls.length, 1)
    assert.equal(f.calls[0].receiver, receiver)
    assert.deepEqual(f.calls[0].args, args)
    assert.equal(f.renderer.render({}, f.scene.camera), f.result)
    assert.equal(witness.read().records.length, 1)
    witness.close()
    witness.close()
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.renderer, 'render'), descriptor)
  } finally {
    f.restore()
  }
})

test('original thrown object propagates without a success frame; cleanup still restores ownership', () => {
  const failure = new Error('GPU draw failed'),
    f = fixture({ failure, own: true })
  try {
    const witness = f.install()
    witness.arm('out')
    assert.throws(f.draw, error => error === failure)
    assert.equal(f.calls.length, 1)
    assert.deepEqual(witness.read().records, [])
    assert.equal(f.readbacks(), 0)
    witness.close()
    assert.equal(f.renderer.render, f.original)
    assert.equal(f.listeners.length, 0)
  } finally {
    f.restore()
  }
})

test('readback failure stops observation without changing draw returns or inventing a captured PNG', () => {
  const f = fixture({ readbackFailure: new Error('Readback failed') })
  try {
    const witness = f.install()
    witness.arm('out')
    assert.equal(f.draw(), f.result)
    assert.match(witness.status().errors[0], /Readback failed/)
    assert.deepEqual(witness.read().frames, {})
    f.draw()
    assert.equal(f.calls.length, 2)
    assert.equal(f.readbacks(), 1)
    witness.close()
  } finally {
    f.restore()
  }
})

test('changed renderer ownership is not overwritten; listeners are removed and evidence remains readable', () => {
  const f = fixture()
  try {
    const witness = f.install(),
      replacement = () => 'new owner'
    witness.arm('out')
    f.draw()
    f.renderer.render = replacement
    assert.throws(() => witness.close(), /ownership changed/)
    assert.equal(f.renderer.render, replacement)
    assert.equal(f.listeners.length, 0)
    assert.equal(witness.read().closed, true)
    assert.equal(witness.read().records.length, 1)
    witness.close()
  } finally {
    f.restore()
  }
})

test('partial listener installation unwinds only owned resources', () => {
  const f = fixture({ installFailure: true })
  try {
    assert.throws(() => f.install(), /installation failed/)
    assert.equal(f.renderer.render, f.original)
    assert.equal(f.listeners.length, 0)
    assert.equal(window.ordinaryZoom, undefined)
  } finally {
    f.restore()
  }
})

test('time and row caps stop observation while the original game continues drawing', () => {
  for (const mode of ['time', 'rows']) {
    const f = fixture()
    try {
      const witness = f.install()
      witness.arm('out')
      if (mode === 'time') f.advance(15001)
      else for (let index = 0; index < 512; index++) f.draw()
      assert.equal(f.draw(), f.result)
      assert.match(witness.status().errors[0], mode === 'time' ? /15-second/ : /512-row/)
      assert.equal(witness.read().records.length, mode === 'time' ? 0 : 512)
      witness.close()
    } finally {
      f.restore()
    }
  }
})

test('scenario cleanup uses its captured API and preserves a foreign global replacement', async () => {
  for (const replaceRenderer of [false, true]) {
    const f = fixture(),
      output = mkdtempSync(join(tmpdir(), 'ordinary-zoom-cleanup-')),
      globals = Object.fromEntries(
        ['innerWidth', 'innerHeight', 'devicePixelRatio'].map(name => [
          name,
          Object.getOwnPropertyDescriptor(globalThis, name),
        ])
      ),
      failure = new Error('Delivered input interrupted')
    let owned,
      disposed = false,
      foreignCalls = 0
    const foreignMethod = () => {
      foreignCalls++
      throw new Error('Foreign API must not be invoked')
    }
    const foreign = { close: foreignMethod, read: foreignMethod, status: foreignMethod }
    const foreignRender = () => foreign
    globalThis.innerWidth = 1440
    globalThis.innerHeight = 1000
    globalThis.devicePixelRatio = 1
    f.scene.cameraMotion = { active: false }
    f.scene.resultCamera = { active: false }
    f.renderer.getContext = () => ({
      RENDERER: 1,
      drawingBufferWidth: 1440,
      drawingBufferHeight: 1000,
      getExtension: () => null,
      getParameter: () => 'fixture renderer',
    })
    const page = {
      evaluate: async (fn, value) => fn(value),
      evaluateHandle: async fn => {
        owned = fn()
        assert.equal(
          owned,
          window.ordinaryZoom,
          'Handle captures the API returned by this installation'
        )
        return {
          evaluate: async callback => callback(owned),
          dispose: async () => {
            disposed = true
          },
        }
      },
      waitForFunction: async (fn, value) => {
        if (value === 'before') f.draw()
        assert.equal(fn(value), true)
      },
      locator: () => ({ boundingBox: async () => ({ x: 0, y: 0, width: 1440, height: 1000 }) }),
      mouse: { move: async () => {} },
      keyboard: {
        press: async key => {
          f.press(key)
          window.ordinaryZoom = foreign
          if (replaceRenderer) f.renderer.render = foreignRender
          throw failure
        },
        up: async key => f.dispatch(key, 'keyup'),
      },
    }
    try {
      await assert.rejects(
        ordinaryZoom({
          page,
          openMission: async () => {},
          output,
          signal: new AbortController().signal,
          receipt: { errors: [] },
        }),
        error => error === failure
      )
      const report = JSON.parse(readFileSync(join(output, 'ordinary-zoom.json'), 'utf8'))
      assert.equal(report.status, 'failed')
      assert.equal(report.observation.closed, true)
      assert.match(report.observation.cleanupError, /API global ownership changed/)
      if (replaceRenderer)
        assert.match(report.observation.cleanupError, /Renderer observer ownership changed/)
      assert.equal(window.ordinaryZoom, foreign, 'Foreign API remains installed')
      assert.equal(foreignCalls, 0, 'Cleanup never calls the replacement API')
      assert.equal(f.renderer.render, replaceRenderer ? foreignRender : f.original)
      assert.equal(
        f.listeners.length,
        0,
        'Original listeners are removed even after ownership changes'
      )
      assert.equal(disposed, true)
      assert.equal(report.observation.frames['out-before'].png, 'out-before.png')
      assert.ok(
        readFileSync(join(output, 'out-before.png')).length > 0,
        'Own partial frame is retained'
      )
      assert.equal(owned.read().closed, true)
    } finally {
      f.restore()
      for (const [name, descriptor] of Object.entries(globals)) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else delete globalThis[name]
      }
      rmSync(output, { recursive: true, force: true })
    }
  }
})
