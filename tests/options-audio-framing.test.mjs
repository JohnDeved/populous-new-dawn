import test from 'node:test'
import assert from 'node:assert/strict'
import { observeAudioFrame, assertAudioFrame, captureAudioFrame } from '../scripts/local-render/options-audio-framing.mjs'
import { createAudioOptionsBudget } from '../scripts/browser-options-audio.mjs'

const selector = 'dialog[data-original-pause-menu][open] [data-original-options][data-skin="ingame"] .audio-settings button[data-option-key="audio"]'
const enabled = '♪ Sound on', muted = '♫ Enable sound'
const filename = label => label === enabled ? 'options-sound-enabled.png' : 'options-sound-muted.png'
const rectangle = (left, top, width, height) => ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height })
const defaultStyle = Object.freeze({ display: 'block', visibility: 'visible', opacity: '1', transform: 'none',
  perspective: 'none', clipPath: 'none', overflowX: 'visible', overflowY: 'visible' })

// Only read operations exist on these DOM fixtures. Test-owned backing records
// can change between observations, but the observer cannot write DOM or owners.
// Dimensions model context/app__original-{pause-menu,options}.module.css:
// 640×480 frame, translate(-50%, -50%) scale(...), and the in-game 500×420
// compatibility scroller at (70,40), with its actual one-pixel border.
function fixture({ scale = 2, label = enabled } = {}) {
  const records = new WeakMap(), reads = [], nodes = {}
  function node(name, parent, bounds, extra = {}) {
    const data = { parent, bounds, connected: true, label, busy: 'false', disabled: false,
      style: { ...defaultStyle }, offsetWidth: bounds.width, offsetHeight: bounds.height,
      clientWidth: bounds.width, clientHeight: bounds.height, clientLeft: 0, clientTop: 0,
      scrollWidth: bounds.width, scrollHeight: bounds.height, scrollLeft: 0, scrollTop: 0, ...extra }
    const element = Object.freeze({
      get parentElement() { return data.parent },
      get isConnected() { return data.connected },
      get disabled() { return data.disabled },
      get offsetWidth() { return data.offsetWidth }, get offsetHeight() { return data.offsetHeight },
      get clientWidth() { return data.clientWidth }, get clientHeight() { return data.clientHeight },
      get clientLeft() { return data.clientLeft }, get clientTop() { return data.clientTop },
      get scrollWidth() { return data.scrollWidth }, get scrollHeight() { return data.scrollHeight },
      get scrollLeft() { return data.scrollLeft }, get scrollTop() { return data.scrollTop },
      getBoundingClientRect() { reads.push(['rect', name]); return Object.freeze({ ...data.bounds }) },
      getAttribute(attribute) {
        assert.ok(['aria-label', 'aria-busy'].includes(attribute))
        return attribute === 'aria-label' ? data.label : data.busy
      },
      contains(other) {
        for (let current = other, depth = 0; current && depth < 64; current = records.get(current)?.parent, depth++)
          if (current === element) return true
        return false
      },
    })
    records.set(element, data)
    nodes[name] = { element, data }
    return element
  }
  const scaled = (left, top, width, height) => rectangle(left * scale, top * scale, width * scale, height * scale)
  const html = node('html', null, scaled(0, 0, 640, 480))
  const body = node('body', html, scaled(0, 0, 640, 480))
  const dialog = node('dialog', body, scaled(0, 0, 640, 480), {
    style: { ...defaultStyle, overflowX: 'hidden', overflowY: 'hidden' },
  })
  const frame = node('frame', dialog, scaled(0, 0, 640, 480), {
    offsetWidth: 640, offsetHeight: 480, clientWidth: 640, clientHeight: 480,
    scrollWidth: 640, scrollHeight: 480,
    style: { ...defaultStyle, transform: `matrix(${scale}, 0, 0, ${scale}, -320, -240)` },
  })
  const options = node('options', frame, scaled(0, 0, 640, 480))
  const panel = node('panel', options, scaled(70, 40, 500, 420), {
    offsetWidth: 500, offsetHeight: 420, clientWidth: 498, clientHeight: 418, clientLeft: 1, clientTop: 1,
    scrollWidth: 498, scrollHeight: 680, scrollTop: 240,
    style: { ...defaultStyle, overflowX: 'auto', overflowY: 'auto' },
  })
  const audio = node('audio', panel, scaled(90, 370, 460, 70))
  const control = node('control', audio, scaled(110, 390, 105, 35))
  const text = node('text', control, scaled(115, 395, 95, 25))
  const state = { controls: [control], canvas: Object.freeze({}), paused: true,
    width: 640 * scale, height: 480 * scale, dpr: 1, hit: control }
  const world = Object.freeze({ get paused() { return state.paused } })
  state.sceneWorld = world
  state.rendererCanvas = state.canvas
  const scene = Object.freeze({ get world() { return state.sceneWorld },
    renderer: Object.freeze({ get domElement() { return state.rendererCanvas } }) })
  state.world = world; state.scene = scene
  const owner = Object.freeze({ world, scene })
  const document = Object.freeze({
    querySelectorAll(actual) { assert.equal(actual, selector); reads.push(['queryAll', actual]); return Object.freeze([...state.controls]) },
    querySelector(actual) { assert.equal(actual, '.world-viewport canvas.battlefield'); return state.canvas },
    elementFromPoint(x, y) { reads.push(['hit', x, y]); return typeof state.hit === 'function' ? state.hit(x, y) : state.hit },
  })
  const window = Object.freeze({ testStore: Object.freeze({ getWorld: () => state.world }),
    testSceneRef: Object.freeze({ get current() { return state.scene } }) })
  class DOMMatrixReadOnly {
    constructor(transform) {
      const match = /^(matrix|matrix3d)\(([^)]+)\)$/.exec(transform)
      if (!match) throw new SyntaxError('Unsupported fixture matrix syntax')
      const values = match[2].split(',').map(Number)
      assert.equal(values.length, match[1] === 'matrix' ? 6 : 16)
      assert.ok(values.every(Number.isFinite))
      Object.assign(this, { is2D: match[1] === 'matrix', a: values[0], b: values[1], c: values[2], d: values[3] })
      Object.freeze(this)
    }
  }
  function install() {
    const values = { document, window, DOMMatrixReadOnly,
      getComputedStyle(element) { assert.ok(records.has(element)); return Object.freeze({ ...records.get(element).style }) } }
    const descriptors = Object.fromEntries(Object.keys(values).map(key => [key, { configurable: true, value: values[key] }]))
    for (const [key, field] of Object.entries({ innerWidth: 'width', innerHeight: 'height', devicePixelRatio: 'dpr' }))
      descriptors[key] = { configurable: true, get: () => state[field] }
    const previous = Object.keys(descriptors).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
    Object.defineProperties(globalThis, descriptors)
    return () => {
      for (const [key, descriptor] of previous)
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
    }
  }
  return { state, nodes, control, text, owner, reads, node, install, observe: () => observeAudioFrame(control, owner) }
}

function observed(options, action) {
  const f = fixture(options), restore = f.install()
  try { return action(f) } finally { restore() }
}
async function captured(options, action) {
  const f = fixture(options), restore = f.install()
  try { return await action(f) } finally { restore() }
}
async function rejectsWith(promise, expected) {
  let rejected = false
  try { await promise } catch (error) { rejected = true; assert.equal(error, expected) }
  assert.equal(rejected, true, 'Expected rejection, including when its value is falsey')
}

function harness(f, hooks = {}) {
  const events = [], captures = [], metadata = [], clock = { now: 0 }, abort = new AbortController()
  const budget = createAudioOptionsBudget({ timeout: 1000, deadlineAt: 1000, now: () => clock.now, signal: abort.signal })
  let evaluations = 0, disposals = 0
  const control = Object.freeze({
    async scrollIntoViewIfNeeded(options) {
      events.push('scroll')
      assert.deepEqual(Object.keys(options), ['timeout'])
      assert.ok(options.timeout > 0 && options.timeout <= 1000)
      await hooks.scroll?.()
    },
    async evaluate(observer, owner) {
      events.push(`observe:${++evaluations}`)
      assert.equal(observer, observeAudioFrame, 'Exercise the actual browser observer, not a canned observation')
      assert.equal(owner, f.owner)
      await hooks.evaluate?.(evaluations)
      return observer(f.control, owner)
    },
    async dispose() { events.push('dispose'); disposals++; await hooks.dispose?.() },
  })
  const locator = Object.freeze({
    async count() { events.push('count'); return hooks.count ?? f.state.controls.length },
    async elementHandle() { events.push('handle'); await hooks.handle?.(); return hooks.missingHandle ? null : control },
  })
  const page = Object.freeze({ locator(actual) { events.push('locator'); assert.equal(actual, selector); return locator } })
  const run = (overrides = {}) => {
    const label = overrides.label ?? enabled, name = overrides.name ?? filename(label)
    return captureAudioFrame({ page, owner: f.owner, label, name, captures, metadata, budget,
      capture: async () => { events.push('capture'); await hooks.capture?.(); captures.push(name) }, ...overrides })
  }
  return { run, events, captures, metadata, abort, clock, budget, get disposals() { return disposals } }
}

test('real observer admits translated menu at 1×, 1.5× and 2× using rendered clipping coordinates', () => {
  for (const scale of [1, 1.5, 2]) observed({ scale }, f => {
    const result = f.observe()
    assertAudioFrame(result, enabled)
    assert.equal(result.clipped, false)
    assert.deepEqual(result.scroll, [{ depth: 2, left: 0, top: 240 }])
    assert.equal(result.bounds.bottom, 425 * scale)
    assert.equal(result.viewport.height, 480 * scale)
    assert.equal(result.bounds.bottom > f.nodes.panel.data.bounds.top + f.nodes.panel.data.clientHeight, scale > 1,
      'At 1.5× and 2× this valid control would fail an unscaled clientHeight comparison')
    assert.equal(f.reads.filter(entry => entry[0] === 'hit').length, 5)
    assert.deepEqual(result.samples, [true, true, true, true, true])
    assert.ok(Object.isFrozen(f.control) && Object.isFrozen(f.owner) && Object.isFrozen(window) && Object.isFrozen(document))
  })
})

test('scaled clipping accepts exact inner border edges and rejects every edge crossing', () => {
  for (const overflow of ['auto', 'scroll', 'hidden', 'clip']) observed({}, f => {
    f.nodes.panel.data.style.overflowX = overflow
    f.nodes.panel.data.style.overflowY = overflow
    const inner = rectangle(142, 82, 996, 836)
    f.nodes.control.data.bounds = inner
    assertAudioFrame(f.observe(), enabled)
    for (const bounds of [rectangle(141.5, 82, 996, 836), rectangle(142, 81.5, 996, 836),
      rectangle(142, 82, 996.5, 836), rectangle(142, 82, 996, 836.5)]) {
      f.nodes.control.data.bounds = bounds
      const result = f.observe()
      assert.equal(result.clipped, true)
      assert.throws(() => assertAudioFrame(result, enabled), /clipping ancestors/)
    }
  })
})

test('each ancestor clips only its declared axes and nonuniform positive scale is supported', () => {
  observed({}, f => {
    f.nodes.panel.data.style.overflowX = 'visible'
    f.nodes.control.data.bounds = rectangle(100, 780, 1100, 70)
    assertAudioFrame(f.observe(), enabled)
    f.nodes.panel.data.style.overflowX = 'hidden'
    assert.throws(() => assertAudioFrame(f.observe(), enabled), /clipping ancestors/)
  })
  observed({}, f => {
    f.nodes.frame.data.style.transform = 'matrix(2, 0, 0, 1.5, -320, -240)'
    f.nodes.panel.data.bounds = rectangle(140, 60, 1000, 630)
    f.nodes.control.data.bounds = rectangle(200, 600, 200, 60)
    assertAudioFrame(f.observe(), enabled)
    f.nodes.control.data.bounds = rectangle(200, 600, 200, 89)
    assert.throws(() => assertAudioFrame(f.observe(), enabled), /clipping ancestors/)
  })
})

test('viewport rejects all four edges, empty dimensions, and nonfinite geometry', () => {
  const changes = [rectangle(-1, 200, 10, 10), rectangle(200, -1, 10, 10), rectangle(1271, 200, 10, 10),
    rectangle(200, 951, 10, 10), rectangle(200, 200, 0, 10), rectangle(200, 200, 10, 0), rectangle(NaN, 200, 10, 10)]
  for (const bounds of changes) observed({}, f => {
    for (const name of ['panel', 'dialog']) Object.assign(f.nodes[name].data.style, { overflowX: 'visible', overflowY: 'visible' })
    f.nodes.control.data.bounds = bounds
    assert.throws(() => assertAudioFrame(f.observe(), enabled))
  })
  for (const [field, value] of [['width', 0], ['height', -1], ['dpr', 0], ['width', Infinity], ['dpr', NaN]]) observed({}, f => {
    f.state[field] = value
    assert.throws(() => assertAudioFrame(f.observe(), enabled))
  })
})

test('uncertain transforms, clipping paths, perspective and invalid ancestor dimensions fail closed', () => {
  for (const style of [{ transform: 'matrix(1, .1, 0, 1, 0, 0)' }, { transform: 'matrix(1, 0, .1, 1, 0, 0)' },
    { transform: 'matrix(-1, 0, 0, 1, 0, 0)' }, { transform: 'matrix(1, 0, 0, 0, 0, 0)' },
    { transform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)' }, { perspective: '500px' }, { clipPath: 'inset(1px)' }]) observed({}, f => {
    Object.assign(f.nodes.frame.data.style, style)
    const result = f.observe()
    assert.equal(result.geometrySupported, false)
    assert.throws(() => assertAudioFrame(result, enabled), /geometrySupported/)
  })
  observed({}, f => {
    f.nodes.frame.data.style.transform = 'not-a-matrix'
    assert.throws(() => f.observe(), SyntaxError)
  })
  for (const value of [0, -1, NaN, Infinity]) observed({}, f => {
    f.nodes.panel.data.offsetWidth = value
    assert.throws(() => assertAudioFrame(f.observe(), enabled), /geometrySupported/)
  })
})

test('hidden control or ancestor and all-zero opacity fail visibility', () => {
  for (const name of ['control', 'panel', 'frame'])
    for (const style of [{ display: 'none' }, { visibility: 'hidden' }, { visibility: 'collapse' }, { opacity: '0' }]) observed({}, f => {
      Object.assign(f.nodes[name].data.style, style)
      assert.throws(() => assertAudioFrame(f.observe(), enabled), /visibleStyle/)
    })
})

test('all five actual hit coordinates admit descendants and reject overlay or null at any sample', () => {
  observed({}, f => {
    f.state.hit = f.text
    assertAudioFrame(f.observe(), enabled)
    const rect = f.nodes.control.data.bounds
    assert.deepEqual(f.reads.filter(entry => entry[0] === 'hit').map(entry => entry.slice(1)),
      [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]].map(([x, y]) => [rect.left + x * rect.width, rect.top + y * rect.height]))
  })
  for (const obstacle of [null, Object.freeze({})])
    for (let index = 0; index < 5; index++) observed({}, f => {
      let call = 0
      f.state.hit = () => call++ === index ? obstacle : f.control
      const result = f.observe()
      assert.equal(result.samples[index], false)
      assert.throws(() => assertAudioFrame(result, enabled), /hit-test samples/)
    })
})

test('duplicate, replaced, missing and disconnected controls fail exact retained ownership', () => {
  for (const change of [f => { f.state.controls = [f.control, f.text] }, f => { f.state.controls = [f.text] },
    f => { f.state.controls = [] }, f => { f.nodes.control.data.connected = false }]) observed({}, f => {
    change(f)
    assert.throws(() => assertAudioFrame(f.observe(), enabled), /exactControl|connected/)
  })
})

test('world, scene, scene-world, canvas identity and pause are independently verified', () => {
  for (const change of [f => { f.state.world = Object.freeze({ paused: true }) },
    f => { f.state.scene = Object.freeze({ world: f.owner.world, renderer: { domElement: f.state.canvas } }) },
    f => { f.state.sceneWorld = {} }, f => { f.state.canvas = {} }, f => { f.state.rendererCanvas = {} },
    f => { f.state.paused = false }]) observed({}, f => {
    change(f)
    assert.throws(() => assertAudioFrame(f.observe(), enabled), /sameWorldScene|ownedCanvas|paused/)
  })
})

test('pending, disabled, missing busy and wrong labels cannot be photographed', () => {
  for (const change of [{ busy: 'true' }, { busy: null }, { disabled: true }, { label: muted }, { label: 'Sound on' }, { label: null }]) observed({}, f => {
    Object.assign(f.nodes.control.data, change)
    assert.throws(() => assertAudioFrame(f.observe(), enabled))
  })
  observed({ label: muted }, f => assertAudioFrame(f.observe(), muted))
  observed({}, f => assert.throws(() => assertAudioFrame(f.observe(), 'unexpected label')))
})

test('ancestry is bounded at 32 nodes and scroll evidence rejects nonfinite offsets', () => {
  for (const extra of [24, 25]) observed({}, f => {
    let ancestor = null
    for (let index = 0; index < extra; index++) ancestor = f.node(`extra${index}`, ancestor, rectangle(0, 0, 1280, 960))
    f.nodes.html.data.parent = ancestor
    const result = f.observe()
    assert.equal(result.ancestryBounded, extra === 24)
    if (extra === 24) assertAudioFrame(result, enabled)
    else assert.throws(() => assertAudioFrame(result, enabled), /ancestryBounded/)
  })
  observed({}, f => {
    f.nodes.panel.data.scrollTop = NaN
    assert.throws(() => assertAudioFrame(f.observe(), enabled))
  })
})

test('both existing slots retain one handle, scroll once, observe around capture and dispose once', async () => {
  for (const label of [enabled, muted]) await captured({ label }, async f => {
    const h = harness(f)
    await h.run({ label })
    assert.deepEqual(h.events, ['locator', 'count', 'handle', 'scroll', 'observe:1', 'capture', 'observe:2', 'dispose'])
    assert.equal(h.disposals, 1)
    assert.deepEqual(h.captures, [filename(label)])
    assert.equal(h.metadata[0].status, 'passed')
    assert.equal(h.metadata[0].expectedLabel, label)
    assert.deepEqual(h.metadata[0].before, h.metadata[0].after)
  })
})

test('the single ordinary scroll may expose the offscreen control before the first observation', async () => captured({}, async f => {
  f.nodes.control.data.bounds = rectangle(220, 1080, 210, 70)
  const h = harness(f, { scroll() { f.nodes.control.data.bounds = rectangle(220, 780, 210, 70); f.nodes.panel.data.scrollTop = 390 } })
  await h.run()
  assert.equal(h.metadata[0].before.bounds.top, 780)
  assert.equal(h.metadata[0].before.scroll[0].top, 390)
  assert.equal(h.events.filter(event => event === 'scroll').length, 1)
}))

test('an ordinary scroll that does not reveal the control fails without capture or retry', async () => captured({}, async f => {
  f.nodes.control.data.bounds = rectangle(220, 1080, 210, 70)
  const h = harness(f)
  await assert.rejects(h.run(), /clipping ancestors|captured viewport/)
  assert.deepEqual(h.captures, [])
  assert.deepEqual(h.events, ['locator', 'count', 'handle', 'scroll', 'observe:1', 'dispose'])
  assert.equal(h.metadata[0].status, 'failed')
}))

test('pre-capture validation uses real DOM state and prevents taking invalid screenshots', async () => {
  for (const change of [f => { f.nodes.control.data.busy = 'true' }, f => { f.nodes.control.data.disabled = true },
    f => { f.nodes.control.data.label = muted }, f => { f.state.paused = false },
    f => { f.state.controls = [f.text] }, f => { f.state.hit = null }]) await captured({}, async f => {
    const h = harness(f, { scroll() { change(f) } })
    await assert.rejects(h.run())
    assert.equal(h.events.includes('capture'), false)
    assert.equal(h.disposals, 1)
    assert.equal(h.metadata[0].status, 'failed')
  })
})

test('every stable-looking geometry, scroll and viewport drift is rejected after capture', async () => {
  for (const change of [f => { f.nodes.control.data.bounds = rectangle(221, 780, 210, 70) },
    f => { f.nodes.control.data.bounds = rectangle(220, 780, 211, 70) }, f => { f.nodes.panel.data.scrollTop++ },
    f => { f.nodes.panel.data.scrollLeft++ }, f => { f.state.width++ }, f => { f.state.height++ }, f => { f.state.dpr = 2 }]) await captured({}, async f => {
    const h = harness(f, { capture() { change(f) } })
    await assert.rejects(h.run(), /must remain stable during capture/)
    assert.equal(h.metadata[0].status, 'failed')
    assert.equal(h.disposals, 1)
    assert.equal(h.captures.length, 1)
    assert.notDeepEqual(h.metadata[0].before, h.metadata[0].after)
  })
})

test('post-capture identity, state, label and hit-target drift fails the actual second observation', async () => {
  for (const change of [f => { f.state.world = { paused: true } },
    f => { f.state.scene = { world: f.owner.world, renderer: { domElement: f.state.canvas } } },
    f => { f.state.canvas = {} }, f => { f.state.paused = false }, f => { f.state.controls = [f.text] },
    f => { f.nodes.control.data.connected = false }, f => { f.nodes.control.data.busy = 'true' },
    f => { f.nodes.control.data.disabled = true }, f => { f.nodes.control.data.label = muted }, f => { f.state.hit = null }]) await captured({}, async f => {
    const h = harness(f, { capture() { change(f) } })
    await assert.rejects(h.run())
    assert.equal(h.metadata[0].status, 'failed')
    assert.equal(h.disposals, 1)
    assert.ok(h.metadata[0].after)
  })
})

test('zero or duplicate locator counts fail before retaining or scrolling a handle', async () => {
  for (const count of [0, 2]) await captured({}, async f => {
    const h = harness(f, { count })
    await assert.rejects(h.run(), /Exactly one public audio control/)
    assert.deepEqual(h.events, ['locator', 'count'])
    assert.equal(h.metadata[0].status, 'failed')
  })
})

test('missing or rejected retained handle fails before scrolling and does not invent cleanup', async () => captured({}, async f => {
  const absent = harness(f, { missingHandle: true })
  await assert.rejects(absent.run(), /Retain the actual audio control/)
  assert.deepEqual(absent.events, ['locator', 'count', 'handle'])
  const failure = new Error('handle acquisition failed')
  const rejected = harness(f, { handle() { throw failure } })
  await rejectsWith(rejected.run(), failure)
  assert.equal(rejected.disposals, 0)
}))

test('scroll failure and observer exceptions dispose once and retain the original cause', async () => {
  for (const phase of ['scroll', 'evaluate']) await captured({}, async f => {
    const failure = new Error(`${phase} failed`), h = harness(f, { [phase]() { throw failure } })
    await rejectsWith(h.run(), failure)
    assert.equal(h.disposals, 1)
    assert.equal(h.events.includes('capture'), false)
    assert.equal(h.metadata[0].failure, String(failure))
  })
  await captured({}, async f => {
    const h = harness(f, { scroll() { f.nodes.frame.data.style.transform = 'not-a-matrix' } })
    await assert.rejects(h.run(), SyntaxError)
    assert.equal(h.disposals, 1)
    assert.equal(h.events.includes('capture'), false)
  })
})

test('capture failure, including every falsey rejection, wins over cleanup and final-budget failures', async () => {
  for (const primary of [new Error('screenshot failed'), undefined, null, false, 0, '']) await captured({}, async f => {
    const cleanup = new Error('dispose failed')
    const h = harness(f, { capture() { throw primary }, dispose() { h.abort.abort(new Error('late abort')); throw cleanup } })
    await rejectsWith(h.run(), primary)
    assert.deepEqual(h.captures, [])
    assert.equal(h.disposals, 1)
    assert.equal(h.metadata[0].status, 'failed')
    assert.equal(h.metadata[0].failure, String(primary))
    assert.equal(h.metadata[0].cleanupError, String(cleanup))
    assert.equal(h.events.includes('observe:2'), false)
  })
})

test('cleanup failure becomes primary after a successful capture and is recorded', async () => captured({}, async f => {
  const cleanup = new Error('dispose failed'), h = harness(f, { dispose() { throw cleanup } })
  await rejectsWith(h.run(), cleanup)
  assert.equal(h.disposals, 1)
  assert.equal(h.metadata[0].status, 'failed')
  assert.equal(h.metadata[0].cleanupError, String(cleanup))
  assert.deepEqual(h.captures, [filename(enabled)])
}))

test('already aborted budget does no locator action beyond construction and captures nothing', async () => captured({}, async f => {
  const h = harness(f), reason = new Error('already aborted')
  h.abort.abort(reason)
  await rejectsWith(h.run(), reason)
  assert.deepEqual(h.events, ['locator'])
  assert.equal(h.metadata[0].status, 'failed')
  assert.equal(h.disposals, 0)
}))

test('a handle settling after abort or deadline is still disposed before rejection', async () => {
  for (const expiry of ['abort', 'deadline']) await captured({}, async f => {
    let release, started
    const gate = new Promise(resolve => { release = resolve })
    const entered = new Promise(resolve => { started = resolve })
    const reason = new Error('abort while elementHandle is pending')
    const h = harness(f, { async handle() { started(); await gate } })
    const pending = h.run()
    await entered
    if (expiry === 'abort') h.abort.abort(reason)
    else h.clock.now = 1000
    release()
    if (expiry === 'abort') await rejectsWith(pending, reason)
    else await assert.rejects(pending, /deadline expired/)
    assert.deepEqual(h.events, ['locator', 'count', 'handle', 'dispose'])
    assert.equal(h.disposals, 1)
    assert.equal(h.metadata[0].status, 'failed')
  })
})

test('late abort during scroll, capture, observation or disposal cannot turn into success', async () => {
  for (const phase of ['scroll', 'capture', 'evaluate', 'dispose']) await captured({}, async f => {
    const reason = new Error(`abort during ${phase}`)
    const h = harness(f, { [phase](number) { if (phase !== 'evaluate' || number === 2) h.abort.abort(reason) } })
    await rejectsWith(h.run(), reason)
    assert.equal(h.disposals, 1)
    assert.equal(h.metadata[0].status, 'failed')
    if (phase === 'scroll') assert.equal(h.events.includes('capture'), false)
    if (phase === 'capture') assert.equal(h.events.includes('observe:2'), false)
  })
})

test('deadline expires across capture or cleanup without resetting the aggregate budget', async () => {
  for (const phase of ['capture', 'dispose']) await captured({}, async f => {
    const h = harness(f, { [phase]() { h.clock.now = 1000 } })
    await assert.rejects(h.run(), /deadline expired/)
    assert.equal(h.disposals, 1)
    assert.equal(h.metadata[0].status, 'failed')
  })
})

test('ninth PNG, wrong labels and mismatched screenshot names reject before browser work', async () => captured({}, async f => {
  for (const overrides of [{ captures: Array(8).fill('prior.png') }, { captures: Array(9).fill('prior.png') },
    { label: 'unexpected label' }, { name: filename(muted) }, { name: '../options-sound-enabled.png' }]) {
    const h = harness(f)
    await assert.rejects(h.run(overrides))
    assert.deepEqual(h.events, [])
    assert.deepEqual(h.metadata, [])
  }
  const h = harness(f)
  h.captures.push(...Array(7).fill('prior.png'))
  await h.run()
  assert.equal(h.captures.length, 8)
  const events = [...h.events]
  await assert.rejects(h.run({ label: muted }), /PNG limit/)
  assert.deepEqual(h.events, events)
}))

test('only the two distinct sound slots are admitted, including failed-slot attempts', async () => captured({}, async f => {
  const h = harness(f)
  await h.run()
  const firstEvents = [...h.events]
  await assert.rejects(h.run(), /admitted once/)
  assert.deepEqual(h.events, firstEvents)
  f.nodes.control.data.label = muted
  await h.run({ label: muted })
  assert.deepEqual(h.metadata.map(frame => frame.name), [filename(enabled), filename(muted)])
  const bothEvents = [...h.events]
  await assert.rejects(h.run(), /admitted once/)
  assert.deepEqual(h.events, bothEvents)
  const failure = harness(f, { count: 0 })
  await assert.rejects(failure.run())
  await assert.rejects(failure.run(), /admitted once/)
  assert.deepEqual(failure.events, ['locator', 'count'])
  const capped = harness(f)
  capped.metadata.push({ name: 'first' }, { name: 'second' })
  await assert.rejects(capped.run(), /admitted once/)
  assert.deepEqual(capped.events, [])
}))
