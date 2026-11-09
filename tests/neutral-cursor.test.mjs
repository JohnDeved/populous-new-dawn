import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { NeutralCanvasCursor, neutralCanvasState, cursorRosterSelected, NEUTRAL_CURSOR_CSS } from '../app/neutral-cursor.ts'

const neutral = () => ({
  started: true, isCurrent: () => true, neutralCursorRosterSelected: false, cursorFrameBlocked: false,
  world: { status: 'playing', paused: false, inputMask: 0, mode: null, selected: [],
    manaWorld: { gameFlags: 0 }, units: [], flyby: { flags: 0 } },
  modalSuspended: false, overviewActive: false, overviewStage: null, wasFlying: false,
  pointerButtons: 0, pointerGesture: null, drag: null, dragActive: { value: false },
  globeMotion: { dragging: false }, keys: new Set(), cameraMotion: { active: 0 },
  resultCamera: { active: false },
})

function harness(t, { failed = false, width = 17, defer = false } = {}) {
  const doc = new EventTarget(), win = new EventTarget(), canvas = new EventTarget()
  let current = 'crosshair', priority = 'important', hit = canvas, focused = true, dialog = null
  const style = {
    getPropertyValue: () => current, getPropertyPriority: () => priority,
    setProperty: (_name, value, p = '') => { current = value; priority = p },
    removeProperty: () => { current = ''; priority = '' },
  }
  Object.assign(doc, { defaultView: win, hidden: false, hasFocus: () => focused,
    elementFromPoint: () => hit, querySelector: () => dialog })
  Object.assign(canvas, { ownerDocument: doc, style })
  let resolveDecode, rejectDecode, image
  const decoded = new Promise((resolve, reject) => { resolveDecode = resolve; rejectDecode = reject })
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  globalThis.Image = class {
    naturalWidth = width
    naturalHeight = 17
    constructor() { image = this }
    decode() { return decoded }
    removeAttribute() { this.src = '' }
  }
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'Image', previous)
    else delete globalThis.Image
  })
  const scene = neutral()
  const owner = new NeutralCanvasCursor(canvas, () => neutralCanvasState(scene))
  t.after(() => owner.dispose())
  const event = (type = 'pointermove', props = {}, target = canvas, advance = true) => {
    const e = new Event(type)
    for (const [key, value] of Object.entries({ target, pointerType: 'mouse', buttons: 0,
      clientX: 10, clientY: 20, altKey: false, ctrlKey: false, shiftKey: false,
      metaKey: false, ...props })) Object.defineProperty(e, key, { value })
    doc.dispatchEvent(e)
    if (advance) (scene.neutralCursor ?? owner).update()
  }
  if (!defer) failed ? rejectDecode(Error('unavailable')) : resolveDecode()
  return { doc, win, canvas, scene, owner, event, resolveDecode, rejectDecode,
    cursor: () => current, priority: () => priority, image: () => image,
    hit: value => { hit = value }, focus: value => { focused = value },
    dialog: value => { dialog = value; scene.cursorFrameBlocked = !!value } }
}

test('native frame pixels and provenance retain exact dimensions and decoder ownership', () => {
  const png = readFileSync(new URL('../public/original/cursor-point14.png', import.meta.url))
  const manifest = JSON.parse(readFileSync(new URL('../public/original/cursor-point14.json', import.meta.url)))
  assert.equal(png.readUInt32BE(16), 17)
  assert.equal(png.readUInt32BE(20), 17)
  assert.equal(createHash('sha256').update(png).digest('hex'), manifest.pngSha256)
  assert.deepEqual(manifest.hotspot, [0, 0])
  assert.equal(manifest.frame, 14)
  assert.match(NEUTRAL_CURSOR_CSS, /0 0, auto$/)
})

test('every neutral predicate exclusion rejects while ordinary canvas state accepts', () => {
  assert.equal(neutralCanvasState(neutral()), true)
  const mutations = [
    s => s.started = false, s => s.isCurrent = () => false,
    s => s.neutralCursorRosterSelected = true, s => s.cursorFrameBlocked = true,
    s => s.world.status = 'won', s => s.world.paused = true, s => s.world.inputMask = 1,
    s => s.world.mode = 'blast', s => s.world.selected.push(1), s => s.world.manaWorld.gameFlags = 32,
    s => s.modalSuspended = true, s => s.overviewActive = true, s => s.overviewStage = 'exit',
    s => s.wasFlying = true, s => s.world.flyby.flags = 1, s => s.cameraMotion.active = 1,
    s => s.resultCamera.active = true, s => s.pointerButtons = 1, s => s.pointerGesture = {},
    s => s.drag = {}, s => s.dragActive.value = true, s => s.globeMotion.dragging = true,
    s => s.keys.add('Shift'),

  ]
  for (const mutate of mutations) {
    const s = neutral(); mutate(s)
    assert.equal(neutralCanvasState(s), false, String(mutate))
  }
})

test('roster sources reject selection and the actual existing ID loop aggregates without a second traversal', () => {
  const source = ts.createSourceFile('scene-entities.ts', readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  const fn = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'updateUnitsFrame')
  const reset = fn.body.statements.find(n => n.getText(source) === 'scene.neutralCursorRosterSelected = false')
  const loop = fn.body.statements.find(n => ts.isForOfStatement(n) && n.getText(source).includes('ids.add(u.id)'))
  assert.ok(reset); assert.ok(loop)
  const code = ts.transpileModule(`(function(){${reset.getText(source)};${loop.getText(source)}})`, {}).outputText
  const aggregate = (scene, ids) => new Function('scene', 'ids', 'cursorRosterSelected', `return ${code}`)(scene, ids, cursorRosterSelected)()
  for (const active of [{ flight: { selectionFlags: 128 } },
    { fight: { action: 'encounter', motion: { selectionFlags: 128 } } },
    { fight: { animation: 'walk', motion: { selectionFlags: 128 } } }])
    assert.equal(cursorRosterSelected({ team: 'blue', hp: 100, ...active }), true)
  for (const owner of ['native', 'entry', 'builder']) {
    const unit = { id: 1, team: 'blue', hp: 100,
      [owner]: owner === 'native' ? { selectionFlags: 128 } : { person: { selectionFlags: 128 } } }
    assert.equal(cursorRosterSelected(unit), true)
    const scene = neutral(); scene.world.units = [unit]
    const ids = new Set(); aggregate(scene, ids)
    assert.deepEqual([...ids], [1]); assert.equal(neutralCanvasState(scene), false)
    unit[owner] = owner === 'native' ? { selectionFlags: 0 } : { person: { selectionFlags: 0 } }
    aggregate(scene, ids); assert.equal(neutralCanvasState(scene), true)
  }
})

test('pointer events cannot install before the scene frame and never traverse the roster', async t => {
  const h = harness(t); await h.owner.ready
  Object.defineProperty(h.scene.world, 'units', { get() { throw Error('extra roster scan') } })
  h.event('pointermove', {}, h.canvas, false)
  assert.equal(h.cursor(), 'crosshair')
  h.owner.update(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  h.scene.started = false; h.owner.update(); assert.equal(h.cursor(), 'crosshair')
  h.event('pointermove', {}, h.canvas, false); assert.equal(h.cursor(), 'crosshair')
  h.scene.started = true; h.owner.update(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  h.scene.isCurrent = () => false; h.owner.update(); assert.equal(h.cursor(), 'crosshair')
  h.event('pointermove', {}, h.canvas, false); assert.equal(h.cursor(), 'crosshair')
})

test('readiness precedes cursor; native size/hotspot preserves previous inline cursor and priority', async t => {
  const h = harness(t, { defer: true })
  h.event(); assert.equal(h.cursor(), 'crosshair')
  h.resolveDecode(); await h.owner.ready
  h.owner.update(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  h.canvas.dispatchEvent(new Event('pointerleave'))
  assert.equal(h.cursor(), 'crosshair'); assert.equal(h.priority(), 'important')
  h.owner.update(); assert.equal(h.cursor(), 'crosshair')
})

test('stationary state changes, overlay insertion and dialogs restore fallback', async t => {
  const h = harness(t); await h.owner.ready; h.event()
  for (const [mutate, clear] of [
    [() => h.scene.world.selected.push(1), () => h.scene.world.selected.length = 0],
    [() => h.scene.world.mode = 'blast', () => h.scene.world.mode = null],
    [() => h.scene.world.paused = true, () => h.scene.world.paused = false],
    [() => h.hit({}), () => h.hit(h.canvas)],
    [() => h.dialog({}), () => h.dialog(null)],
  ]) {
    assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
    mutate(); h.owner.update(); assert.equal(h.cursor(), 'crosshair')
    clear(); h.owner.update(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  }
})

test('non-canvas, touch, pen, held buttons and modifiers never install cursor', async t => {
  const h = harness(t); await h.owner.ready
  for (const props of [{ pointerType: 'touch' }, { pointerType: 'pen' }, { buttons: 1 },
    { buttons: 2 }, { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
    h.event('pointermove', props); assert.equal(h.cursor(), 'crosshair')
  }
  h.event('pointermove', {}, {}); assert.equal(h.cursor(), 'crosshair')
  h.event(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
})

test('blur, cancellation, keyboard and visibility require a fresh pointer event', async t => {
  const h = harness(t); await h.owner.ready
  for (const [target, type] of [[h.win, 'blur'], [h.canvas, 'pointercancel'],
    [h.canvas, 'lostpointercapture'], [h.doc, 'keydown'], [h.doc, 'visibilitychange']]) {
    h.event(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
    target.dispatchEvent(new Event(type)); h.owner.update()
    assert.equal(h.cursor(), 'crosshair')
  }
  h.focus(false); h.event(); assert.equal(h.cursor(), 'crosshair')
})

test('decode failure and unexpected source dimensions stay browser fallback', async t => {
  for (const options of [{ failed: true }, { width: 18 }]) {
    const h = harness(t, options); await h.owner.ready; h.event()
    assert.equal(h.cursor(), 'crosshair'); assert.equal(h.image().src, '')
    h.owner.dispose()
  }
})

test('disposal before readiness settles it and late decode cannot reattach or change cursor', async t => {
  const h = harness(t, { defer: true }); h.owner.dispose(); await h.owner.ready
  h.resolveDecode(); await Promise.resolve(); h.event(); h.owner.update()
  assert.equal(h.cursor(), 'crosshair'); assert.equal(h.image().src, '')
})

test('timeout freezes fallback even if decoding subsequently succeeds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const h = harness(t, { defer: true })
  t.mock.timers.tick(10000); await h.owner.ready
  h.resolveDecode(); await Promise.resolve(); h.event()
  assert.equal(h.cursor(), 'crosshair')
})

// Execute exact production constructor/ready/lifecycle statements, not copies.
const source = ts.createSourceFile('scene.ts', readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const sceneClass = source.statements.find(n => ts.isClassDeclaration(n) && n.name.text === 'GameScene')
function runStatement(predicate, bindings, receiver) {
  const nodes = []
  function visit(n) { if (ts.isExpressionStatement(n) && predicate(n.getText(source))) nodes.push(n); ts.forEachChild(n, visit) }
  visit(sceneClass)
  assert.equal(nodes.length, 1, 'one exact production caller')
  const code = ts.transpileModule(`(function(){${nodes[0].getText(source)}})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return new Function(...Object.keys(bindings), `return ${code}`)(...Object.values(bindings)).call(receiver)
}

test('actual scene constructor, readiness and lifecycle own the cursor controller', async t => {
  const h = harness(t); h.owner.dispose()
  const scene = Object.assign(h.scene, { renderer: { domElement: h.canvas } })
  runStatement(text => text.startsWith('this.neutralCursor = new NeutralCanvasCursor'),
    { NeutralCanvasCursor, neutralCanvasState }, scene)
  runStatement(text => text.startsWith('this.ready = Promise.all'),
    { terrain: { ready: Promise.resolve() }, preload: [] }, scene)
  await scene.ready
  h.event(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  const modal = sceneClass.members.find(n => n.name?.getText(source) === 'setModalSuspended')
  const reset = modal.body.statements.find(n => n.getText(source).includes('this.neutralCursor?.reset()'))
  const resetCode = ts.transpileModule(`(function(){${reset.getText(source)}})`, {}).outputText
  new Function(`return ${resetCode}`)().call(scene)
  assert.equal(h.cursor(), 'crosshair')
  h.event(); assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  scene.world.mode = 'blast'
  runStatement(text => text === 'this.neutralCursor?.update()', {}, scene)
  assert.equal(h.cursor(), 'crosshair')
  scene.world.mode = null
  runStatement(text => text === 'this.neutralCursor?.update()', {}, scene)
  assert.equal(h.cursor(), NEUTRAL_CURSOR_CSS)
  runStatement(text => text === 'this.neutralCursor?.dispose()', {}, scene)
  assert.equal(h.cursor(), 'crosshair')
  const animate = sceneClass.members.find(n => n.name?.getText(source) === 'animate').getText(source)
  assert.ok(animate.indexOf('advanceGame(') < animate.indexOf('this.updateUnitsFrame()'))
  assert.ok(animate.indexOf('this.updateUnitsFrame()') < animate.indexOf('this.neutralCursor?.update()'))
  for (const name of ['neutralCursorRosterSelected', 'cursorFrameBlocked'])
    assert.equal(sceneClass.members.find(n => n.name?.getText(source) === name).initializer.getText(source), 'true')
})
