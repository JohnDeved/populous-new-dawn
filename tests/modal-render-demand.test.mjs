import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { createResultClock, advanceResultClock } from '../app/result-session.ts'

// Actual methods/initializers and registered listener statements, with boundary
// stubs. This checks ownership, not WebGL pixels or browser performance.
const text = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
const source = ts.createSourceFile('scene.ts', text, ts.ScriptTarget.Latest, true)
const declaration = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene')
const names = new Set(['animate', 'resultClock', 'modalSuspended', 'modalRenderVersion', 'modalRenderedVersion', 'modalTextureVersion', 'invalidateModalRender', 'setModalSuspended', 'updateView', 'setSize', 'listen'])
const members = declaration.members.filter(node => names.has(node.name?.getText(source))).map(node => node.getText(source)).join('\n')
const constructor = declaration.members.find(ts.isConstructorDeclaration)
const listeners = constructor.body.statements.filter(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText(source) === 'this.listen' && ['webglcontextrestored', 'visibilitychange', 'focus'].includes(node.expression.arguments[1]?.text)).map(node => node.getText(source)).join('\n')
assert.equal(listeners.split('this.listen').length - 1, 3)

function fixture() {
  const document = Object.assign(new EventTarget(), { hidden: false, querySelector: () => null })
  const window = new EventTarget(), canvas = new EventTarget()
  let revision = 0, draws = 0, polls = 0, schedules = 0, updates = [], mutation = () => {}, failure, consumeAudio = true
  const context = {
    document, window, devicePixelRatio: 1,
    createResultClock, advanceResultClock,
    sceneTextureRevision: () => revision,
    requestAnimationFrame() { return ++schedules },
    performance: { now: () => 0 },
    cancelPointerGesture() {}, updateView() {}, syncSecondaryReservations() {},
    advanceGame() {}, updateVehiclesFrame() {}, SPELLS: [],
  }
  const owner = vm.runInNewContext(stripTypeScriptTypes(`new (class { ${members}\n installInvalidations() { ${listeners} } })()`), context)
  const painter = { pendingSoundEnvironment: undefined, render() {
    draws++
    mutation()
    if (failure) throw failure
    if (consumeAudio) painter.pendingSoundEnvironment = undefined
  } }
  Object.assign(owner, {
    disposed: false, isCurrent() { return !this.disposed },
    world: { status: 'playing', selected: [], trees: [], buildings: [] }, tooltipElement: { hidden: false }, keys: new Set(),
    renderer: { domElement: canvas, getPixelRatio() { return this.ratio ?? 1 }, setPixelRatio(value) { this.ratio = value }, setSize(w, h) { this.size = [w, h] }, info: { render: { calls: 9 } } },
    view: { painter }, scene: {}, camera: { updateProjectionMatrix() {} }, disposeListeners: [],
    container: { getBoundingClientRect: () => ({ width: 960, height: 540 }) },
    globe: { stars: { material: { uniforms: { pixelRatio: { value: 1 } } } } },
    hoveredObject: null, dispatchNearbyFollowers() {}, playWorldSounds() {},
    updateTerrainFrame() {}, updateDecorationsFrame() {}, updateCameraMotion() { return false },
    updateFlyby() { return false }, updateUnitsFrame() {}, renderTooltip() {}, updateBuildingsFrame() {},
    updateEffectsFrame() {}, updateShrinesFrame() {}, updatePointerFrame() {}, updatePlacement() {},
    updateSpellPointerFrame() {}, updateEnvironmentFrame() {}, updateHudFrame() {},
    renderSceneFrame() { painter.render() },
    cancelNearbyFollowers() {}, cancelTooltipInspection() {},
    fpsGraph: { renderGpu(draw) { return draw() }, pollGpu() { polls++ }, update(...args) { updates.push(args) }, reset() {} },
  })
  owner.installInvalidations()
  owner.setModalSuspended(true)
  return { owner, painter, document, window, canvas, updates,
    get draws() { return draws }, get polls() { return polls }, get schedules() { return schedules },
    retainAudio() { consumeAudio = false }, setDpr(value) { context.devicePixelRatio = value },
    settleTexture() { revision++ }, mutateDuringDraw(fn) { mutation = fn }, fail(error) { failure = error },
    frame(now) { owner.animate(now) },
  }
}

test('unchanged modal retains clocks and RAF but submits no duplicate draw or false telemetry', () => {
  const f = fixture()
  f.frame(0); f.frame(1000)
  assert.equal(f.draws, 1)
  assert.equal(f.polls, 1)
  assert.equal(f.schedules, 2)
  assert.equal(f.owner.previous, 1000)
  assert.ok(f.owner.resultClock.inputCycles > 0)
  assert.equal(f.updates[1][2], 0)
  assert.equal(f.updates[1][3], 0)
  assert.equal(f.updates[1][4], 'Menu · holding frame')
})

test('late texture, actual view method and modal reentry each restore a draw', () => {
  const f = fixture()
  f.frame(0); f.frame(1)
  f.settleTexture(); f.frame(2); f.frame(3)
  assert.equal(f.draws, 2)
  f.owner.updateView(); f.frame(4); f.frame(5)
  assert.equal(f.draws, 3)
  f.owner.setModalSuspended(false)
  assert.equal(f.owner.previous, null)
  f.owner.setModalSuspended(true); f.frame(6)
  assert.equal(f.draws, 4)
})

test('registered restoration/visibility/focus events invalidate and owned disposers remove them', () => {
  const f = fixture(); f.frame(0)
  for (const [target, name] of [[f.canvas, 'webglcontextrestored'], [f.document, 'visibilitychange'], [f.window, 'focus']]) {
    const before = f.draws
    target.dispatchEvent(new Event(name)); f.frame(before)
    assert.equal(f.draws, before + 1)
  }
  f.owner.disposeListeners.forEach(remove => remove())
  const before = f.owner.modalRenderVersion
  f.canvas.dispatchEvent(new Event('webglcontextrestored'))
  f.document.dispatchEvent(new Event('visibilitychange'))
  f.window.dispatchEvent(new Event('focus'))
  assert.equal(f.owner.modalRenderVersion, before)
  f.owner.disposed = true
  const scheduled = f.schedules
  f.frame(100)
  assert.equal(f.schedules, scheduled)
})

test('pending audio snapshots retain the actual painter completion path', () => {
  const f = fixture(); f.frame(0)
  f.painter.pendingSoundEnvironment = { trees: false }
  f.frame(1)
  assert.equal(f.draws, 2)
  assert.equal(f.painter.pendingSoundEnvironment, undefined)
  f.frame(2)
  assert.equal(f.draws, 2)
})

test('failed draws and invalidation during draw are not consumed', () => {
  const f = fixture(), error = new Error('renderer failure')
  f.fail(error)
  assert.throws(() => f.frame(0), e => e === error)
  assert.equal(f.owner.modalRenderedVersion, -1)
  assert.equal(f.schedules, 0)
  f.fail(undefined)
  f.mutateDuringDraw(() => f.owner.invalidateModalRender())
  f.frame(1)
  f.mutateDuringDraw(() => {})
  f.frame(2)
  assert.equal(f.draws, 3)
  f.frame(3)
  assert.equal(f.draws, 3)
})

test('hidden callbacks keep non-GPU ownership without querying diagnostics', () => {
  const f = fixture(); f.document.hidden = true
  f.frame(0); f.frame(1)
  assert.equal(f.draws, 1)
  assert.equal(f.polls, 0)
  assert.equal(f.updates.length, 0)
  assert.equal(f.schedules, 2)
})


test('unconsumed audio work stays redraw-eligible rather than being silently dropped', () => {
  const f = fixture(); f.frame(0)
  f.retainAudio()
  f.painter.pendingSoundEnvironment = { trees: false }
  f.frame(1); f.frame(2)
  assert.equal(f.draws, 3)
  assert.ok(f.painter.pendingSoundEnvironment)
})

test('result blink callbacks continue on retained frames and disposal stops scheduling', () => {
  const f = fixture(); f.frame(0)
  f.owner.world.status = 'victory'
  let changed = 0
  f.owner.onChange = () => changed++
  f.frame(400)
  assert.equal(changed, 1)
  assert.equal(f.draws, 1)
  f.owner.onChange = () => { f.owner.disposed = true }
  const scheduled = f.schedules
  f.frame(800)
  assert.equal(f.schedules, scheduled)
})


test('actual resize path and DPR comparison redraw once with capped unchanged sizing semantics', () => {
  const f = fixture(); f.frame(0); f.frame(1)
  f.owner.setSize(); f.frame(2); f.frame(3)
  assert.equal(f.draws, 2)
  assert.deepEqual(f.owner.renderer.size, [960, 540])
  assert.equal(f.owner.camera.aspect, 960 / 540)
  f.setDpr(2); f.frame(4); f.frame(5)
  assert.equal(f.draws, 3)
  assert.equal(f.owner.renderer.getPixelRatio(), 1.8)
  assert.equal(f.owner.globe.stars.material.uniforms.pixelRatio.value, 1.8)
})

test('ordinary Space-pause state retains continuous presentation submits', () => {
  const f = fixture()
  f.owner.setModalSuspended(false)
  f.owner.world.paused = true
  f.frame(0); f.frame(1); f.frame(2)
  assert.equal(f.draws, 3)
  assert.equal(f.polls, 0)
  assert.equal(f.schedules, 3)
  assert.equal(f.updates.at(-1)[4], 'Paused · rendering')
})
