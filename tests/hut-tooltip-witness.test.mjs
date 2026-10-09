import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { installHutTooltipLifecycle } from '../scripts/local-render/hut-tooltip-witness.mjs'

const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
const startBody = source.slice(source.indexOf('  start() {') + '  start() '.length, source.indexOf('\n  makeSky()'))

function fixture({ pointerFailure = false, failPixels = false } = {}) {
  const globals = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  const target = () => ({ listeners: [], addEventListener(type, fn, capture) { this.listeners.push({ type, fn, capture: !!capture }) },
    removeEventListener(type, fn, capture) { this.listeners = this.listeners.filter(x => x.type !== type || x.fn !== fn || x.capture !== !!capture) } })
  const win = target(), doc = Object.assign(target(), { querySelector: () => null, elementFromPoint: () => canvas })
  globalThis.window = win; globalThis.document = doc
  const canvas = Object.assign(target(), { width: 800, height: 600, toDataURL() { if (failPixels) throw Error('pixels unavailable'); return 'data:image/png;base64,AA==' } })
  const scheduled = [], originalReturn = {}, session = { visits: 0, sampleAt: 0, sampleCount: 0, sample: 0, threshold: 12, initializedBy: null }
  class Scene {
    constructor() {
      this.world = { outcome: { level: 1 }, status: 'playing', turn: 0, speed: 1, paused: false, selected: [], mode: null,
        inputMask: 0, flyby: { flags: 0 }, units: [], buildings: [{ id: 37, kind: 'hut', team: 'blue', anchor: { x: 64512, y: 54784 } }] }
      this.tooltipController = { session, category: 0, key: 0, dwell: 0, owners: {}, lastVisit: null, paint: null }
      this.tooltip = { remaining: 0, text: '', draw: 0 }; this.objectPanels = { hutRecords: new Map() }
      this.gameClock = { animationFrame: 0 }; this.dragActive = { value: false }; this.cameraMotion = { active: false }
      this.buildingPanels = new Map(); this.terrainLoad = { signal: { aborted: false } }; this.drawMinimap = () => {}
      this.mini = {}; this.scene = {}; this.camera = {}; this.tooltipCanvas = canvas
      this.tooltipElement = { hidden: true, style: {}, getAttribute: () => this.tooltip.text }
      this.renderer = { domElement: canvas, info: { render: { frame: 0 } }, render() { this.info.render.frame++; return originalReturn } }
      this.fixturePick = 37; this.picking = { pick: () => this.fixturePick }; this.animate = () => {}
    }
    updateTooltipController(now) {
      this.tooltipController.session.visits++
      const entry = this.tooltip.remaining
      if (entry) this.tooltip.remaining--
      this.tooltipController.lastVisit = { now, forced: { entry, handled: entry > 0, remaining: this.tooltip.remaining } }
      return originalReturn
    }
    acquireForcedTooltip(object, duration) { this.tooltip.remaining = duration; return object }
    updatePointerFrame(event = { clientX: 40, clientY: 50 }) { this.hoveredObject = this.picking.pick(event) }
    renderTooltip() { this.tooltipElement.hidden = !this.tooltip.draw; return originalReturn }
    updateHudFrame() { return originalReturn }
    dispose() { this.disposed = true; this.objectPanels.hutRecords.clear() }
  }
  // Exact shipped start body: its first queued RAF cannot run until start and
  // the scenario wrapper return. Keep the real listener-before-RAF ordering.
  Scene.prototype.start = Function('installInputListeners', 'requestAnimationFrame', `return function() ${startBody}`)(
    scene => scene.renderer.domElement.addEventListener('pointerup', () => {}, false), callback => { scheduled.push(callback); return scheduled.length })
  const observe = () => {
    if (pointerFailure) throw Error('pointer observer unavailable')
    return { finish: () => ({ restored: true, errors: [], events: [] }) }
  }
  return { Scene, observe, canvas, scheduled, session, originalReturn, doc,
    restore() { for (const [key, descriptor] of globals) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } }
}

test('actual start attaches before first RAF, retains every same-RAF catch-up tick and forced edge', () => {
  const f = fixture(); let api
  const original = f.Scene.prototype.start
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); assert.equal(scene.start(), true)
    assert.equal(f.scheduled.length, 1); assert.equal(api.read().records[0].kind, 'start')
    assert.equal(scene.start(), true); assert.equal(api.read().epochs.length, 1)
    const object = { id: 37 }
    assert.equal(scene.acquireForcedTooltip(object, 1), object)
    assert.equal(scene.updateTooltipController(500), f.originalReturn)
    assert.equal(scene.updateTooltipController(500), f.originalReturn)
    const rows = api.read().records
    assert.deepEqual(rows.map(r => r.kind), ['start', 'forced-acquisition', 'tick', 'tick'])
    assert.deepEqual(rows.filter(r => r.kind === 'tick').map(r => [r.now, r.before.session.visits, r.after.session.visits,
      r.after.controller.lastVisit.forced.handled]), [[500, 0, 1, true], [500, 1, 2, false]])
    assert.equal(scene.tooltipController.session.visits, 2)
    api.close(); assert.equal(f.Scene.prototype.start, original)
    assert.deepEqual(api.read().errors, [])
  } finally { api?.close(); f.restore() }
})

test('separate natural paint owners retain same-RAF tooltip, WebGL and later HUD pixels', () => {
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start(); scene.previous = 500
    api.phase('named', 'hut'); scene.tooltip.draw = 1; scene.tooltip.text = 'Small Hut: query'
    assert.equal(scene.renderTooltip(), f.originalReturn)
    assert.equal(api.status().captures.named, false)
    assert.equal(scene.renderer.render(scene.scene, scene.camera), f.originalReturn)
    const panel = { hidden: false, style: {}, getAttribute: () => 'Hut: 0 of 3 occupants', firstElementChild: f.canvas }
    scene.buildingPanels.set(37, panel); scene.updateHudFrame()
    const frame = api.read().frames.named
    assert.equal(frame.rafTimestamp, 500)
    assert.equal(frame.tooltip.state.rendererFrame, 0); assert.equal(frame.world.state.rendererFrame, 1)
    assert.equal(frame.panel.state.rendererFrame, 1); assert.equal(frame.panel.hidden, false)
    assert.equal(api.status().captures.named, true)
  } finally { api?.close(); f.restore() }
})

test('repeated identical picks stay bounded while changed results, coordinates, route and phase remain actual records', () => {
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start(); scene.tooltipInput = { route: 'world', object: { id: 37 }, cell: 1 }
    scene.updatePointerFrame()
    for (let frame = 1; frame <= 100; frame++) {
      scene.frame = frame; scene.previous = frame * 3; scene.world.turn = frame; scene.renderer.info.render.frame = frame
      scene.updatePointerFrame()
      scene.updateTooltipController(scene.previous)
    }
    scene.fixturePick = 20; scene.updatePointerFrame()
    scene.updatePointerFrame({ clientX: 41, clientY: 50 })
    scene.tooltipInput.route = 'outside'; scene.updatePointerFrame({ clientX: 41, clientY: 50 })
    api.phase('new phase'); scene.updatePointerFrame({ clientX: 41, clientY: 50 })
    const data = api.read(), picks = data.records.filter(row => row.kind === 'pointer-frame')
    assert.equal(picks.length, 5); assert.equal(data.epochs[0].omittedIdenticalPointerFrames, 100)
    assert.equal(data.records.filter(row => row.kind === 'tick').length, 100)
    assert.equal(data.records.filter(row => row.kind === 'tick').at(-1).after.session.visits, 100)
    assert.equal(picks[1].omittedIdenticalBefore, 100)
    assert.deepEqual(picks.map(row => [row.picks[0].id, row.picks[0].x]), [[37, 40], [20, 40], [20, 41], [20, 41], [20, 41]])
    assert.equal(picks.at(-1).phase, 'new phase')
  } finally { api?.close(); f.restore() }
})

test('public replacement epochs retain session identity and discard old record/observer ownership', () => {
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const first = new f.Scene(); first.start(); first.updateTooltipController(100)
    first.objectPanels.hutRecords.set(37, { phase: 1, remaining: 16, hold: 16, automatic: false })
    first.dispose()
    const second = new f.Scene(); second.start(); second.updateTooltipController(200)
    const epochs = api.read().epochs
    assert.equal(epochs.length, 2); assert.equal(epochs[0].disposed, true); assert.equal(epochs[0].closed, true)
    assert.equal(epochs[0].initial.sessionIdentity, epochs[1].initial.sessionIdentity)
    assert.equal(epochs[1].initial.session.visits, 1); assert.deepEqual(epochs[1].initial.records, [])
    assert.equal(api.close().epochs[1].closed, true)
  } finally { api?.close(); f.restore() }
})

test('installation and PNG diagnostics do not stop original start or paints and always clean up', () => {
  for (const options of [{ pointerFailure: true }, { failPixels: true }]) {
    const f = fixture(options); let api
    const original = f.Scene.prototype.start
    try {
      api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
      const scene = new f.Scene(); assert.equal(scene.start(), true)
      if (options.failPixels) {
        api.phase('named', 'hut'); scene.tooltip.draw = 1; scene.tooltip.text = 'Small Hut: query'
        assert.equal(scene.renderTooltip(), f.originalReturn)
      }
      assert.equal(api.read().errors.length, 1)
      assert.equal(api.close().closed, true); assert.equal(f.Scene.prototype.start, original)
      assert.equal(f.doc.listeners.length, 0)
    } finally { api?.close(); f.restore() }
  }
})

test('cleanup reports retained game inspection ownership without silently mutating it', () => {
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start(); scene.objectPanels.hutHeldPointer = 7
    const result = api.close()
    assert.equal(result.closed, true); assert.equal(result.epochs[0].cleanupHeldPointer, 7)
    assert.equal(scene.objectPanels.hutHeldPointer, 7)
    assert.match(result.errors[0], /held-pointer owner remains/)
    assert.equal(f.doc.listeners.length, 0)
  } finally { api?.close(); f.restore() }
})
