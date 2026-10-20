import test from 'node:test'
import assert from 'node:assert/strict'
import {
  finishTornadoAcceptance,
  tornadoGraphicsMetadata,
} from '../scripts/lib/tornado-browser-evidence.mjs'

test('delayed final context.close after watchdog expiry cannot report PASS', async () => {
  let resolveClose,
    clock = 89999,
    expired = false,
    closed = false
  const report = { status: 'RUNNING' },
    closePending = new Promise(resolve => {
      resolveClose = resolve
    })
  const completion = finishTornadoAcceptance(report, {
    close: async () => {
      await closePending
      closed = true
    },
    elapsed: () => clock,
    expired: () => expired,
    budgetMs: 90000,
  })
  assert.equal(report.status, 'RUNNING')
  assert.equal(closed, false)
  // Deterministic fake watchdog and clock: no real waiting or browser launch.
  expired = true
  clock = 90001
  resolveClose()
  await assert.rejects(completion, /aggregate budget exhausted during completion/)
  assert.equal(closed, true)
  assert.equal(report.status, 'FAIL')
  assert.deepEqual(report.timeout, { budgetMs: 90000, elapsedMs: 90001, expired: true })
})

test('elapsed deadline still rejects when the watchdog callback has not run', async () => {
  const report = { status: 'RUNNING' }
  await assert.rejects(
    finishTornadoAcceptance(report, {
      close: async () => {},
      elapsed: () => 90000.1,
      expired: () => false,
      budgetMs: 90000,
    }),
    /aggregate budget exhausted/
  )
  assert.equal(report.status, 'FAIL')
})

test('success requires completed close and an unexpired aggregate budget', async () => {
  const report = { status: 'RUNNING' }
  let closed = false
  await finishTornadoAcceptance(report, {
    close: async () => {
      closed = true
    },
    elapsed: () => 89999,
    expired: () => false,
    budgetMs: 90000,
  })
  assert.equal(closed, true)
  assert.equal(report.status, 'PASS')
})

function graphics(extension) {
  const attributes = {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    },
    values = {
      vendor: 'masked vendor',
      renderer: 'masked renderer',
      version: 'WebGL 2.0',
      language: 'GLSL ES 3.00',
      uv: 'actual vendor',
      ur: 'actual renderer',
    },
    gl = {
      VENDOR: 'vendor',
      RENDERER: 'renderer',
      VERSION: 'version',
      SHADING_LANGUAGE_VERSION: 'language',
      getExtension: name => {
        assert.equal(name, 'WEBGL_debug_renderer_info')
        return extension
      },
      getParameter: name => values[name],
      getContextAttributes: () => attributes,
      isContextLost: () => false,
      drawingBufferWidth: 1440,
      drawingBufferHeight: 1000,
    },
    renderer = {
      getContext: () => gl,
      getPixelRatio: () => 1,
      domElement: { width: 1440, height: 1000, clientWidth: 1440, clientHeight: 1000 },
      outputColorSpace: 'srgb',
      toneMapping: 0,
      toneMappingExposure: 1,
      capabilities: { precision: 'highp', isWebGL2: true },
    }
  return tornadoGraphicsMetadata({ renderer }, 1)
}

test('graphics evidence records actual context values and explicit absent optional extension', () => {
  const result = graphics(null)
  assert.deepEqual(result.webgl.debugRendererInfo, {
    available: false,
    unmaskedVendor: null,
    unmaskedRenderer: null,
  })
  assert.equal(result.webgl.vendor, 'masked vendor')
  assert.equal(result.webgl.renderer, 'masked renderer')
  assert.equal(result.webgl.version, 'WebGL 2.0')
  assert.equal(result.webgl.contextAttributes.antialias, false)
  assert.deepEqual(result.webgl.drawingBuffer, { width: 1440, height: 1000 })
  assert.equal(result.devicePixelRatio, 1)
  assert.equal(result.rendererPixelRatio, 1)
  assert.equal(result.renderer.outputColorSpace, 'srgb')
  assert.equal(result.renderer.toneMapping, 0)
})

test('available optional renderer extension is read, never inferred from masked values', () => {
  assert.deepEqual(
    graphics({ UNMASKED_VENDOR_WEBGL: 'uv', UNMASKED_RENDERER_WEBGL: 'ur' }).webgl
      .debugRendererInfo,
    { available: true, unmaskedVendor: 'actual vendor', unmaskedRenderer: 'actual renderer' }
  )
})
