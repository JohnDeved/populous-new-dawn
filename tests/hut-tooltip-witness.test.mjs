import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { installHutTooltipLifecycle } from '../scripts/local-render/hut-tooltip-witness.mjs'
import { assertCampPlacement } from '../scripts/local-render/camp-inspection-input.mjs'
import { assertSingleTrainingInput, assertAutomaticRequest } from '../scripts/local-render/training-panel-input.mjs'
import { readHutPanelControl } from '../scripts/local-render/hut-tooltip-input.mjs'

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

test('actual renderTooltip body binds DAT20 pick, imported835 raw text, expanded label and mature paint', () => {
  const palette = JSON.parse(readFileSync(new URL('../app/original-tooltips.json', import.meta.url), 'utf8'))
  assert.equal(palette.names[5][1][0], 835)
  const text = palette.strings[835]
  assert.ok(text.startsWith('Tree:'))
  const f = fixture(); let api
  const renderSource = readFileSync(process.env.HUT_TOOLTIP_PRODUCT_ROOT
    ? resolve(process.env.HUT_TOOLTIP_PRODUCT_ROOT, 'app/scene-input-runtime.ts')
    : new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
  const renderBody = renderSource.slice(renderSource.indexOf('export function renderTooltip('), renderSource.indexOf('\nexport function drawPointer('))
  assert.ok(renderBody.startsWith('export function renderTooltip('))
  const paintInputs = []
  const render = Function('worldTooltipObject', 'drawTooltip', 'texture',
    `${stripTypeScriptTypes(renderBody.replace(/^export /, ''))}; return renderTooltip`)(
    () => ({ id: 20, type: 5, model: 1 }), (_canvas, _texture, raw) => paintInputs.push(raw), () => ({ image: {} }))
  f.Scene.prototype.renderTooltip = function () { return render(this) }
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start()
    const labels = new Map()
    Object.assign(scene.tooltipElement, { offsetWidth: 100, offsetHeight: 20,
      setAttribute: (name, value) => labels.set(name, value), getAttribute: name => labels.get(name) })
    scene.container = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) }
    scene.screen = () => ({ x: 0, y: 0 }); scene.y = () => 0; scene.visible = () => true
    api.phase('named-tree-history', { kind: 'named-object', id: 20, text })
    const good = () => {
      scene.tooltipInput = { picked: 20, object: { id: 20, type: 5, model: 1 } }
      Object.assign(scene.tooltipController, { category: 'object', key: 20, dwell: 13 })
      Object.assign(scene.tooltip, { draw: 1, text })
    }
    const paint = () => {
      scene.tooltipController.output = { ...scene.tooltip, kind: 'object', pointer: { clientX: 40, clientY: 50 } }
      scene.renderTooltip()
    }
    for (const invalidate of [s => { s.tooltip.draw = 0 }, s => { s.tooltip.text = '' },
      s => { s.tooltipInput.picked = 37 }, s => { s.tooltipInput.object.id = 37 },
      s => { s.tooltipController.key = 37 }, s => { s.tooltipController.dwell = 12 }]) {
      good(); invalidate(scene); paint()
      assert.equal(api.read().frames['named-tree-history'], undefined)
    }
    good(); paint(); scene.renderer.render(scene.scene, scene.camera); scene.updateHudFrame()
    const frame = api.read().frames['named-tree-history']
    assert.equal(frame.tooltip.label, text.replaceAll('{}', 'Left-click ').replaceAll('|}', 'Right-click '))
    assert.notEqual(frame.tooltip.label, text); assert.equal(paintInputs.at(-1), text)
    assert.equal(frame.tooltip.hidden, false)
    assert.equal(frame.tooltip.state.input.picked, 20); assert.equal(frame.tooltip.state.controller.dwell, 13)
    assert.equal(api.status().captures['named-tree-history'], true)
  } finally { api?.close(); f.restore() }
})
test('actual renderTooltip body binds completed camp pick, imported912 raw text, expanded label and mature paint', () => {
  const palette = JSON.parse(readFileSync(new URL('../app/original-tooltips.json', import.meta.url), 'utf8'))
  assert.equal(palette.names[2][7][0], 912)
  const text = palette.strings[912]
  assert.ok(text.startsWith('Warrior Training Hut:'))
  const f = fixture(); let api
  const renderSource = readFileSync(process.env.HUT_TOOLTIP_PRODUCT_ROOT
    ? resolve(process.env.HUT_TOOLTIP_PRODUCT_ROOT, 'app/scene-input-runtime.ts')
    : new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
  const renderBody = renderSource.slice(renderSource.indexOf('export function renderTooltip('), renderSource.indexOf('\nexport function drawPointer('))
  assert.ok(renderBody.startsWith('export function renderTooltip('))
  const paintInputs = []
  const render = Function('worldTooltipObject', 'drawTooltip', 'texture',
    `${stripTypeScriptTypes(renderBody.replace(/^export /, ''))}; return renderTooltip`)(
    () => ({ id: 1010, type: 2, model: 7 }), (_canvas, _texture, raw) => paintInputs.push(raw), () => ({ image: {} }))
  f.Scene.prototype.renderTooltip = function () { return render(this) }
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start()
    const labels = new Map()
    Object.assign(scene.tooltipElement, { offsetWidth: 100, offsetHeight: 20,
      setAttribute: (name, value) => labels.set(name, value), getAttribute: name => labels.get(name) })
    scene.container = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) }
    scene.screen = () => ({ x: 0, y: 0 }); scene.y = () => 0; scene.visible = () => true
    api.phase('named-camp-history', { kind: 'named-object', id: 1010, text })
    const good = () => {
      scene.tooltipInput = { picked: 1010, object: { id: 1010, type: 2, model: 7 } }
      Object.assign(scene.tooltipController, { category: 'object', key: 1010, dwell: 13 })
      Object.assign(scene.tooltip, { draw: 1, text })
    }
    const paint = () => {
      scene.tooltipController.output = { ...scene.tooltip, kind: 'object', pointer: { clientX: 40, clientY: 50 } }
      scene.renderTooltip()
    }
    for (const invalidate of [s => { s.tooltip.draw = 0 }, s => { s.tooltip.text = '' },
      s => { s.tooltipInput.picked = 37 }, s => { s.tooltipInput.object.id = 37 },
      s => { s.tooltipController.key = 37 }, s => { s.tooltipController.dwell = 12 }]) {
      good(); invalidate(scene); paint()
      assert.equal(api.read().frames['named-camp-history'], undefined)
    }
    good(); paint(); scene.renderer.render(scene.scene, scene.camera); scene.updateHudFrame()
    const frame = api.read().frames['named-camp-history']
    assert.equal(frame.tooltip.label, text.replaceAll('{}', 'Left-click ').replaceAll('|}', 'Right-click '))
    assert.notEqual(frame.tooltip.label, text); assert.equal(paintInputs.at(-1), text)
    assert.equal(frame.tooltip.hidden, false)
    assert.equal(frame.tooltip.state.input.picked, 1010); assert.equal(frame.tooltip.state.controller.dwell, 13)
    assert.equal(api.status().captures['named-camp-history'], true)
  } finally { api?.close(); f.restore() }
})

test('actual controller return retains detached bounded marker consequences without requesting audio', () => {
  const f = fixture(); let api
  const original = f.Scene.prototype.updateTooltipController
  let calls = 0
  f.Scene.prototype.updateTooltipController = function (...args) {
    calls++
    const result = original.apply(this, args)
    this.world.effects.push({ id: 900, kind: 'orderMarker', x: 2, z: 3, height: 4, age: 0, duration: 1, turnsRemaining: 4 })
    return result
  }
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.world.effects = Array.from({ length: 161 }, (_, id) => ({ id, kind: 'orderMarker', x: id, z: 0 }))
    scene.world.effects.push({ id: 899, kind: 'blast', x: 0, z: 0 })
    scene.start()
    assert.equal(scene.updateTooltipController(500), f.originalReturn); assert.equal(calls, 1)
    scene.world.effects.at(-1).x = 99
    const row = api.read().records.find(row => row.kind === 'tick')
    assert.deepEqual([row.markers.before.count, row.markers.before.omitted, row.markers.before.values.length], [161, 1, 160])
    assert.deepEqual([row.markers.after.count, row.markers.after.omitted, row.markers.after.values.length], [162, 2, 160])
    assert.deepEqual(row.markers.after.values.at(-1), { id: 900, kind: 'orderMarker', x: 2, z: 3, height: 4, age: 0, duration: 1, turnsRemaining: 4 })
    assert.deepEqual(api.close().errors, [])
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

test('panel hold counts only actual controller visits with the physical control hovered', () => {
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000 })
    const scene = new f.Scene(); scene.start(); window.testSceneRef = { current: scene }
    let hovered = false
    const button = { tagName: 'BUTTON', className: 'dismantle-control', isConnected: true, hidden: false, disabled: false,
      contains: () => false, matches: () => hovered, getAttribute: () => 'Dismantle Hut',
      getBoundingClientRect: () => ({ x: 20, y: 30, width: 40, height: 40 }) }
    const panel = { isConnected: true, hidden: false, contains: node => node === button, matches: () => hovered,
      querySelector: () => button, getAttribute: () => 'Hut: 0 of 3 occupants' }
    scene.buildingPanels.set(37, panel)
    scene.objectPanels.hutRecords.set(37, { phase: 1, remaining: 16, hold: 16, automatic: false })
    f.doc.elementFromPoint = () => button
    assert.deepEqual(readHutPanelControl(37), { hutId: 37, x: 40, y: 50, label: 'Dismantle Hut', panelLabel: 'Hut: 0 of 3 occupants' })
    f.doc.elementFromPoint = () => f.canvas
    assert.throws(() => readHutPanelControl(37), /does not own/)
    f.doc.elementFromPoint = () => button
    api.phase('panel-control-hold')
    for (let i = 0; i < 10; i++) scene.updateTooltipController(i)
    assert.equal(api.status().phasePanelControlTicks[37], undefined)
    hovered = true
    const event = { target: button, isTrusted: true, clientX: 40, clientY: 50, button: 0, buttons: 0 }
    for (const listener of f.doc.listeners.filter(row => row.type === 'pointermove' && row.capture)) listener.fn(event)
    for (const listener of f.doc.listeners.filter(row => row.type === 'pointermove' && !row.capture)) listener.fn(event)
    for (let i = 0; i < 24; i++) scene.updateTooltipController(10 + i)
    assert.equal(api.status().phasePanelControlInput, 37)
    assert.equal(api.status().phasePanelControlTicks[37], 24)
    hovered = false; scene.updateTooltipController(35)
    assert.equal(api.status().phasePanelControlTicks[37], 24)
    assert.equal(api.read().records.filter(row => row.kind === 'tick').length, 35)
  } finally { api?.close(); f.restore() }
})


test('shared camp owners capture dynamic construction identity, all ticks and actual modal hiding', () => {
  const f = fixture(); let api
  const camp = { id: 1010, kind: 'camp', team: 'blue', hp: 800, progress: 1,
    anchor: { x: 2, y: 4 }, builders: [0], admission: { inside: 0, activity: 8, occupants: [0, 0, 0, 0, 0, 0] } }
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000,
      buildingRecordPrefix: 'building', observeConstruction: true })
    const scene = new f.Scene()
    scene.world.outcome.level = 2; scene.world.buildings = [camp]
    scene.objectPanels = { buildingRecords: new Map([[1010, { phase: 1, remaining: 16, hold: 8, automatic: false }]]),
      buildingInspected: 1010, buildingHeldPointer: null }
    scene.start(); api.target(1010)
    scene.updateTooltipController(500); scene.updateTooltipController(500)
    const ticks = api.read().records.filter(row => row.kind === 'tick')
    assert.equal(ticks.length, 2)
    assert.equal(ticks[0].after.inspected, 1010); assert.equal(ticks[1].after.targetId, 1010)
    assert.equal(ticks[0].after.records[0].identity, ticks[1].after.records[0].identity)
    assert.equal(ticks[0].after.construction.camps[0].identity, ticks[1].after.construction.camps[0].identity)
    camp.admission.inside = 1
    assert.equal(ticks[0].after.construction.camps[0].admission.inside, 0)
    api.phase('menu', 'modal-hidden')
    scene.tooltip.draw = 0; scene.renderTooltip(); assert.equal(api.read().frames.menu, undefined)
    f.doc.querySelector = selector => selector === 'dialog.game-dialog[open]' ? {} : null
    scene.renderTooltip(); scene.renderer.render(scene.scene, scene.camera)
    scene.buildingPanels.set(1010, { hidden: true, style: {}, getAttribute: () => 'Warrior training: 0 of 5 occupants; 0% charged' })
    scene.updateHudFrame()
    assert.equal(api.read().frames.menu.panel.id, 1010); assert.equal(api.status().captures.menu, true)
    assert.deepEqual(api.close().errors, [])
  } finally { api?.close(); f.restore() }
})


test('actual adoptLiveOrders transfer is observed through the pointer boundary and admitted by the camp assertion', () => {
  const product = process.env.CAMP_INSPECTION_PRODUCT_ROOT ?? new URL('..', import.meta.url).pathname
  const movement = readFileSync(resolve(product, 'app/live-movement.ts'), 'utf8')
  const ordersSource = readFileSync(resolve(product, 'app/person-orders.ts'), 'utf8')
  const adoptBody = movement.slice(movement.indexOf('export function adoptLiveOrders('), movement.indexOf('\n// Player clicks append'))
  const lookupBody = ordersSource.slice(ordersSource.indexOf('export function currentPersonOrder('), ordersSource.indexOf('\nfunction descriptor('))
  const lookup = Function(`${stripTypeScriptTypes(lookupBody.replace(/^export /, ''))};return currentPersonOrder`)()
  const adopt = Function('currentPersonOrder', `${stripTypeScriptTypes(adoptBody.replace(/^export /, ''))};return adoptLiveOrders`)(lookup)
  const f = fixture(); let api
  try {
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000,
      buildingRecordPrefix: 'building', observeConstruction: true })
    const scene = new f.Scene(), person = { id: 278, commands: Array(8).fill(0), commandCursor: 0,
      immediateCommand: 0, state: 10, substate: 1, workTarget: 1022, commandPhase: 0 }
    const unit = { id: 278, team: 'blue', kind: 'brave', hp: 50, work: null, inside: null, native: person }
    Object.assign(scene.world, { outcome: { level: 2 }, selected: [54, 278], mode: 'camp', units: [unit], buildings: [],
      buildingOrders: { records: Array.from({ length: 30 }, () => ({ model: 0, flags: 0, references: 0, a: 0, b: 0, object: 0 })) } })
    scene.objectPanels = { buildingRecords: new Map(), buildingHeldPointer: null }
    scene.start(); api.phase('place-camp')
    const event = type => ({ type, target: f.canvas, isTrusted: true, clientX: 816, clientY: 405, button: 0, buttons: type === 'pointerdown' ? 1 : 0 })
    const send = (event, mutate = () => {}) => {
      for (const listener of f.doc.listeners.filter(l => l.type === event.type && l.capture)) listener.fn(event)
      mutate()
      for (const listener of f.doc.listeners.filter(l => l.type === event.type && !l.capture)) listener.fn(event)
    }
    send(event('pointerdown'))
    send(event('pointerup'), () => {
      scene.world.buildingOrders.records[29] = { model: 6, flags: 0, references: 1, object: 0, a: 1022, b: 0 }
      person.commands[0] = 29; unit.builder = { task: 1, phase: 0, busy: 0, restart: true }
      scene.world.buildings.push({ id: 1022, kind: 'camp', team: 'blue', hp: 260, progress: 0,
        anchor: { x: 41984, y: 24576 }, builders: [278, 0, 0] })
      adopt(scene.world, unit, person); scene.world.mode = null
    })
    assert.equal(unit.native, null); assert.equal(unit.builder.person, person)
    const rows = api.read().records, ground = { x: 816, y: 405, anchor: { x: 41984, y: 24576 } }
    assert.deepEqual(assertCampPlacement(rows, ground).recipients, [278])
    const worker = rows.find(r => r.kind === 'input' && r.type === 'pointerup').after.construction.workers[0]
    assert.equal(worker.orderOwner, 'builder.person'); assert.equal(worker.orderPersonId, 278)
    assert.deepEqual([worker.orderState, worker.orderSubstate, worker.orderWorkTarget, worker.orderPhase], [10, 1, 1022, 0])
    scene.updateTooltipController(500)
    assert.equal(api.read().records.at(-1).after.construction.workers[0].orderOwnerIdentity, worker.orderOwnerIdentity)
    person.commands[0] = 0
    assert.equal(worker.commands[0], 29, 'The observed queue remains detached')
    for (const alter of [w => { delete w.commands }, w => { w.commands = [] }, w => { w.commandCursor = undefined },
      w => { w.orderOwner = 'native' }, w => { w.orderOwnerIdentity = null }]) {
      const bad = structuredClone(rows), copied = bad.find(r => r.kind === 'input' && r.type === 'pointerup').after.construction.workers[0]
      alter(copied); assert.throws(() => assertCampPlacement(bad, ground), { name: 'AssertionError' })
    }
    assert.deepEqual(api.close().errors, [])
  } finally { api?.close(); f.restore() }
})


test('training pointer snapshot follows real entry.person adoption and detaches synchronous callback state', () => {
  const movement = readFileSync(new URL('../app/live-movement.ts', import.meta.url), 'utf8')
  const adoptBody = movement.slice(movement.indexOf('export function adoptLiveOrders('), movement.indexOf('\n// Player clicks append'))
  const adopt = Function('currentPersonOrder', `${stripTypeScriptTypes(adoptBody.replace(/^export /, ''))};return adoptLiveOrders`)(
    (pool, p) => pool.records[p.commands[p.commandCursor]])
  const f = fixture(); let api
  try {
    const scene = new f.Scene(), p = { id: 278, commands: Array(8).fill(0), commandCursor: 0, immediateCommand: 0 },
      u = { id: 278, kind: 'brave', team: 'blue', hp: 50, work: null, inside: null, native: p },
      b = { id: 1022, kind: 'camp', team: 'blue', hp: 800, progress: 1, admission: { activity: 0, inside: 0, occupants: [] } }
    Object.assign(scene.world, { outcome: { level: 2 }, units: [u], buildings: [b], selected: [278],
      stats: { trained: 0 }, manaTribes: [], manaWorld: {}, objectCells: { objects: new Map([[278, p]]) },
      buildingOrders: { records: [{}, { model: 8, a: 1022, flags: 0, references: 1 }] }, secondaryEffects: { reservations: [] } })
    const token = {}, consumer = function (id) {
      assert.equal(this, scene.objectPanels)
      this.buildingRecords.set(id, { automatic: true, phase: -1, remaining: 0, hold: 16 })
      this.automaticTrainingLatches.add(id); scene.world.secondaryEffects.reservations.push(`building-panel:${id}`)
      return token
    }
    scene.objectPanels = { buildingRecords: new Map(), automaticTrainingLatches: new Set(), requestAutomaticTraining: consumer }
    api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000,
      buildingRecordPrefix: 'building', observeTraining: true })
    scene.start(); api.target(b.id); api.phase('train-one-brave')
    for (const type of ['pointerdown', 'pointerup']) {
      const e = { type, target: f.canvas, isTrusted: true, clientX: 400, clientY: 300, button: 0 }
      for (const l of f.doc.listeners.filter(l => l.type === type && l.capture)) l.fn(e)
      if (type === 'pointerup') { p.commands[0] = 1; adopt(scene.world, u, p) }
      for (const l of f.doc.listeners.filter(l => l.type === type && !l.capture)) l.fn(e)
    }
    const input = assertSingleTrainingInput(api.read().records, b, { x: 400, y: 300 })
    assert.equal(input.personId, 278); assert.equal(u.native, null); assert.equal(u.entry.person, p)
    b.admission.activity = 128; b.admission.inside = 1; b.admission.occupants = [278]
    assert.equal(scene.objectPanels.requestAutomaticTraining(b.id), token)
    // Same outer game visit may convert before any host call. Both callback
    // snapshots must retain the earlier admitted person and active occupancy.
    b.admission.activity = 0; b.admission.inside = 0; b.admission.occupants[0] = 0
    p.commands[0] = 0; scene.world.stats.trained = 1
    const row = api.read().records.find(row => row.kind === 'automatic-training-request')
    assertAutomaticRequest(row, b.id)
    assert.equal(row.after.training.people[0].commands[0], 1)
    assert.equal(row.after.training.camps[0].admission.occupants[0], 278)
    const bad = structuredClone(api.read().records)
    bad.find(row => row.type === 'pointerup').after.training.people[0].orderOwner = 'native'
    assert.throws(() => assertSingleTrainingInput(bad, b, { x: 400, y: 300 }))
    assert.deepEqual(api.close().errors, [])
    assert.equal(scene.objectPanels.requestAutomaticTraining, consumer)
  } finally { api?.close(); f.restore() }
})

test('missing training consumer closes partial wrappers; thrown consumer is forwarded once and restored', () => {
  for (const missing of [true, false]) {
    const f = fixture(); let api
    try {
      const scene = new f.Scene(), sentinel = Error('original consumer failure'); let calls = 0
      Object.assign(scene.world, { stats: { trained: 0 }, manaTribes: [], manaWorld: {}, secondaryEffects: { reservations: [] } })
      const original = function () { calls++; throw sentinel }
      scene.objectPanels = { buildingRecords: new Map(), automaticTrainingLatches: new Set(), ...(missing ? {} : { requestAutomaticTraining: original }) }
      api = installHutTooltipLifecycle(f.Scene, f.observe, { deadlineAt: Date.now() + 10000,
        buildingRecordPrefix: 'building', observeTraining: true })
      scene.start()
      if (missing) {
        assert.match(api.status().errors[0], /requestAutomaticTraining/)
        assert.equal(api.status().epochs[0].closed, true)
      } else {
        assert.throws(() => scene.objectPanels.requestAutomaticTraining(17), error => error === sentinel)
        assert.equal(calls, 1); assert.equal(api.read().records.at(-1).threw, true)
        api.close(); assert.equal(scene.objectPanels.requestAutomaticTraining, original)
      }
    } finally { api?.close(); f.restore() }
  }
})
