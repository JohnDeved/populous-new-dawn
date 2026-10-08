import assert from 'node:assert/strict'
import test from 'node:test'
import { observeBlastEpisode, inputContext } from '../qa/blast-ordinary/observer.mjs'

// Synthetic event/DOM graph only. The real observer is exercised; no browser,
// gameplay, rendered-pixel or public-command result is claimed by these mocks.
function fixture(t, { rejectRelease = false, rejectAdmission = false, throwDraw, enemy = false, primerPerson = false } = {}) {
  const listeners = [], log = [], rect = { left: 0, top: 0, width: 20, height: 20 }
  const canvas = { isConnected: true, getBoundingClientRect: () => rect,
    addEventListener(type, fn, capture = false) { listeners.push({ type, fn, capture }) },
    removeEventListener(type, fn, capture = false) { const index = listeners.findIndex(x => x.type === type && x.fn === fn && x.capture === capture); if (index >= 0) listeners.splice(index, 1) },
    dispatch(type, point = { x: 10, y: 20 }) {
      const event = { type, target: canvas, button: 0, buttons: type === 'pointerdown' ? 1 : 0, isTrusted: true, clientX: point.x, clientY: point.y }
      // DOM invoke snapshots each phase. Newly armed bubble listeners cannot
      // consume this event; removals of old listeners still take effect.
      for (const capture of [true, false]) for (const listener of listeners.filter(x => x.type === type && x.capture === capture).slice())
        if (listeners.includes(listener)) listener.fn.call(canvas, event)
      return event
    },
    toDataURL() { log.push('webgl-png'); return 'data:image/png;base64,eA==' },
  }
  const native = id => ({ id, class: 1, flags2: 0, x: id === 1 ? 100 : 1000, y: 2000, h: 120, speed: 0, state: 19, immediateCommand: 0, commands: [], commandCursor: 0 })
  const actor = { id: 1, team: 'blue', kind: 'shaman', hp: 100, inside: null, native: native(1) }
  const target = { id: 3, team: 'blue', kind: 'brave', hp: 100, inside: null, native: native(3) }
  const world = { turn: 1, outcome: { level: 2 }, status: 'playing', paused: false, speed: 1, mode: 'blast', inputMask: 0,
    manaWorld: { gameFlags: 0 }, manaTribes: [{ mana: 10 }], randomState: 123, units: [actor, target], selected: [3], projectiles: [], effects: [],
    objectCells: { objects: new Map([[1, actor.native], [3, target.native]]) }, buildingOrders: { records: [] }, shots: { blast: 4 }, stats: { cast: 0 } }
  if (enemy) {
    world.outcome.level = 1; target.team = 'red'; world.selected = [1]
    world.castingTribes = [{ flags: 0, cooldown: 0, aiCooldown: 0 }]; world.manaTribes[0].playerType = 2
    world.landVersion = 0; world.terrainVersion = 0; world.buildings = []
    world.land = { heights: new Int16Array(16384).fill(120), flags: new Uint32Array(16384) }
    for (const u of world.units) { u.x = (u.native.x - 2048) / 256; u.z = -(u.native.y + 2048) / 256 }
  }
  const attrs = new Map([['d', 'M'.repeat(16)], ['stroke-opacity', '1']])
  const path = { getAttribute: key => attrs.get(key), style: {} }
  const outline = { cloneNode() { return { attrs: Object.fromEntries(attrs), style: {}, setAttribute(key, value) { this.attrs[key] = value }, querySelector: () => ({ style: {} }) } } }
  const scene = { world, scene: {}, camera: {}, container: { clientWidth: 20, clientHeight: 20, getBoundingClientRect: () => rect },
    cameraPosition: { x: 1, y: 2, angle: 3 }, viewPoint: { x: 1, z: 2 }, cameraBearing: 3, gameClock: { beforeTurn() {}, afterTurn() {}, animationFrame: 0 },
    pointerOutline: outline, pointerPath: path, pointerScreen: { clientX: 10, clientY: 20 }, hoveredObject: 3, pointerAck: { target: 0, until: 0 },
    picking: { pickPerson: () => world.mode === 'blast' && !(enemy && handlers === 1 && !primerPerson) ? 3 : null }, unitMeshes: new Map(), fxMeshes: new Map(),
    pick: () => ({ x: 3, z: 0 }),
    drawPointer(now) { log.push({ name: 'draw', receiver: this, now }); if (throwDraw) throw throwDraw; attrs.set('d', 'M'.repeat(now < this.pointerAck.until ? 32 : 16)); return 'draw-result' },
    renderer: { domElement: canvas, info: { render: { frame: 0 } }, getContext: () => ({ isContextLost: () => false, drawingBufferWidth: 2, drawingBufferHeight: 2,
      RGBA: 1, UNSIGNED_BYTE: 2, readPixels(...args) { log.push('readPixels'); args.at(-1).fill(255) } }),
    render() { this.info.render.frame++; return 'render-result' } },
  }
  const doc = { elementFromPoint: () => canvas, createElement() { log.push('raster'); return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8Array([0, 0, 0, 255]) }) }), toDataURL: () => 'data:image/png;base64,eA==' } } }
  const globals = { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }, document: doc,
    getComputedStyle: () => ({ display: '', visibility: 'visible', stroke: 'white', fill: 'none', strokeWidth: '1' }),
    Image: class { decode() { log.push('decode'); return Promise.resolve() } },
    XMLSerializer: class { serializeToString(vector) { return JSON.stringify(vector.attrs) } } }
  for (const [key, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key])
  }
  let handlers = 0
  canvas.addEventListener('pointerdown', event => { scene.pointerScreen = event; scene.pointerButtons = 1 })
  canvas.addEventListener('pointerup', event => {
    handlers++; scene.pointerScreen = event; scene.pointerButtons = 0
    if (world.mode === 'blast') {
      const hitId = scene.picking.pickPerson(event)
      if (enemy && handlers === 1) scene.pick(event)
      if (rejectRelease && handlers === 1) return
      world.projectiles.push({ id: enemy ? 43 + handlers : 44, team: 'blue', spell: 'blast', caster: 1, phase: 'windup', remaining: 6, target: { x: 1, z: 2 },
        destination: { x: 1000, y: 2000, h: 120 }, blastTarget: enemy && handlers === 1 && hitId === null ? undefined : { personId: 3, shotPersonId: null, destination: { x: target.native.x, y: 2000, h: 120 } }, visuals: [] })
      world.mode = null; world.shots.blast--; world.stats.cast++; if (rejectAdmission) world.selected = [1]; scene.pointerAck = { target: hitId, until: hitId === null ? 0 : performance.now() + 5000 / 24 }
    } else {
      scene.pick(event); scene.picking.pickPerson(event)
      world.buildingOrders.records[1] = { model: 3, a: 2816, b: 63488 }
      target.native.immediateCommand = 1
    }
  })
  const originalDraw = scene.drawPointer, originalRender = scene.renderer.render, originalPick = scene.picking.pickPerson
  const observer = observeBlastEpisode(scene, { expectation: 'candidate', actorId: 1, targetId: 3, runId: 'synthetic', sourceFingerprint: 'synthetic', ...(enemy && { phenotype: 'm1-enemy' }) })
  const ground = { x: 50, y: 60, point: { x: 3, z: 0 } }
  if (!enemy) observer.prepareMove(ground)
  const prepare = async () => {
    const pose = { x: 1000, y: 2000, h: 120 }
    observer.hover({ turn: 1, targetId: 3, mode: 'blast', canvasOwned: true, hitId: 3, visible: true, lines: 16,
      context: inputContext(scene), position: pose, previousTurn: 0, previousPosition: pose, idle: true, point: { x: 10, y: 20 }, observedAt: performance.now() })
    scene.renderer.render(scene.scene, scene.camera); scene.drawPointer(performance.now()); await observer.settled()
    canvas.dispatch('pointerdown'); observer.trigger(1)
  }
  t.after(() => observer.dispose())
  return { scene, world, canvas, observer, prepare, ground, log, attrs, originalDraw, originalRender, originalPick, target, handlers: () => handlers }
}

test('actual first release rearms one later event without replay or duplicate original handler', async t => {
  const f = fixture(t); await f.prepare()
  const early = f.observer.waitForMove(); f.ground.point.x = 999
  f.canvas.dispatch('pointerup')
  const admission = await early
  assert.equal(admission.turn, 1); assert.equal(admission.shot.remaining, 6); assert.equal(f.handlers(), 1)
  assert.equal(f.observer.read().artifacts.movePointer, undefined)
  admission.selected[0] = 99
  assert.deepEqual((await f.observer.waitForMove()).selected, [3])
  f.canvas.dispatch('pointerdown', { x: 50, y: 60 }); f.canvas.dispatch('pointerup', { x: 50, y: 60 })
  const result = f.observer.read()
  assert.equal(f.handlers(), 2); assert.equal(result.report.movement.order.model, 3)
  assert.deepEqual(result.report.errors, [])
  assert.equal(result.artifacts.pointer.events.filter(e => e.type === 'pointerup').length, 1)
  assert.equal(result.artifacts.movePointer.events.filter(e => e.type === 'pointerup').length, 1)
  f.observer.dispose()
  assert.equal(f.scene.drawPointer, f.originalDraw); assert.equal(f.scene.renderer.render, f.originalRender); assert.equal(f.scene.picking.pickPerson, f.originalPick)
})

test('HUD snapshot is after the original draw and ack raster waits for actual second release', async t => {
  const f = fixture(t); await f.prepare(); f.canvas.dispatch('pointerup'); await f.observer.waitForMove()
  const reads = f.log.filter(x => x === 'readPixels').length, rasters = f.log.filter(x => x === 'raster').length
  f.scene.renderer.render(f.scene.scene, f.scene.camera)
  const now = performance.now()
  assert.equal(f.scene.drawPointer(now), 'draw-result')
  const captured = f.observer.read().artifacts.ack
  assert.equal(captured.feedback.lines, 32); assert.equal(captured.frameProof.drawNow, now)
  assert.equal(captured.png, undefined); assert.equal(captured.bracketPng, undefined)
  assert.equal(f.log.filter(x => x === 'readPixels').length, reads); assert.equal(f.log.filter(x => x === 'raster').length, rasters)
  assert.equal(f.log.findLast(x => x?.name === 'draw').receiver, f.scene)
  f.attrs.set('d', 'changed-after-snapshot')
  // Late movement rejects independently, but still drains its earlier ack proof.
  f.world.projectiles[0].phase = 'flying'; f.world.projectiles[0].remaining = 0
  f.canvas.dispatch('pointerdown', { x: 50, y: 60 }); f.canvas.dispatch('pointerup', { x: 50, y: 60 })
  await f.observer.settled()
  const result = f.observer.read()
  assert.equal(result.artifacts.ack.svg, captured.svg); assert.ok(result.artifacts.ack.bracketPng)
  assert.equal(result.report.frames.find(x => x.kind === 'ack').drawNow, now)
  assert.ok(result.report.errors.some(x => x.includes('Movement was late')))
})

test('failed actual release, explicit abort and disposal settle waiting readers', async t => {
  const f = fixture(t, { rejectRelease: true }); await f.prepare()
  const pending = assert.rejects(f.observer.waitForMove(), /One naturally allocated/)
  f.canvas.dispatch('pointerup'); await pending
  assert.equal(f.handlers(), 1); assert.equal(f.observer.read().artifacts.movePointer, undefined)
  const g = fixture(t); const aborted = assert.rejects(g.observer.waitForMove(), /explicit stop/)
  g.observer.abortMove('explicit stop'); await aborted
  const h = fixture(t); const disposed = assert.rejects(h.observer.waitForMove(), /disposed/)
  h.observer.dispose(); await disposed
})

test('deferred ack drains on disposal without rereading DOM', async t => {
  const f = fixture(t); await f.prepare(); f.canvas.dispatch('pointerup')
  f.scene.renderer.render(f.scene.scene, f.scene.camera); f.scene.drawPointer(f.scene.pointerAck.until - 1)
  const svg = f.observer.read().artifacts.ack.svg
  f.attrs.set('d', 'changed'); f.observer.dispose(); await f.observer.settled()
  assert.equal(f.observer.read().artifacts.ack.svg, svg); assert.ok(f.observer.read().artifacts.ack.bracketPng)
})

test('original draw exception and argument identity survive the passive wrapper', t => {
  const failure = Error('original draw failed'), f = fixture(t, { throwDraw: failure }), now = 19
  assert.throws(() => f.scene.drawPointer(now), error => error === failure)
  assert.deepEqual(f.log.at(-1), { name: 'draw', receiver: f.scene, now })
})

test('failed first release keeps the declared second event and its effects without inventing a trace', async t => {
  const f = fixture(t, { rejectRelease: true }); await f.prepare()
  const pending = assert.rejects(f.observer.waitForMove(), /One naturally allocated/)
  f.canvas.dispatch('pointerup'); await pending
  f.canvas.dispatch('pointerdown', { x: 50, y: 60 }); f.canvas.dispatch('pointerup', { x: 50, y: 60 })
  const result = f.observer.read(), attempt = result.artifacts.unarmedFollowingInput
  assert.equal(f.handlers(), 2); assert.equal(result.report.complete, false)
  assert.equal(attempt.handlerTrace, false); assert.equal(attempt.before.trusted, true); assert.equal(attempt.before.canvasOwned, true)
  assert.deepEqual(attempt.before.point, { x: 50, y: 60 }); assert.deepEqual(attempt.before.selected, [3])
  assert.deepEqual({ mode: attempt.before.mode, stock: attempt.before.stock, cast: attempt.before.castCount }, { mode: 'blast', stock: 4, cast: 0 })
  assert.deepEqual(attempt.after, { turn: 1, mode: null, selected: [3], stock: 3, castCount: 1 })
  assert.equal(result.artifacts.movePointer, undefined)
  assert.ok(result.report.errors.some(error => error.includes('actual effects retained without handler trace')))
  assert.ok(result.report.errors.every(error => !error.includes('finish') && !error.includes('TypeError')))
})

test('validated cast with rejected admission still retains the unarmed following input', async t => {
  const f = fixture(t, { rejectAdmission: true }); await f.prepare()
  const pending = assert.rejects(f.observer.waitForMove(), /Actual accepted cast/); f.canvas.dispatch('pointerup'); await pending
  assert.ok(f.observer.read().report.release, 'first cast is accepted before the single-selection admission fails')
  f.canvas.dispatch('pointerdown', { x: 50, y: 60 }); f.canvas.dispatch('pointerup', { x: 50, y: 60 })
  const result = f.observer.read(), attempted = result.artifacts.unarmedFollowingInput
  assert.equal(attempted.handlerTrace, false); assert.deepEqual(attempted.before.selected, [1])
  assert.deepEqual(attempted.after, { turn: 1, mode: null, selected: [1], stock: 3, castCount: 1 })
  assert.equal(result.report.complete, false); assert.equal(f.handlers(), 2)
  assert.ok(result.report.errors.some(error => error.includes('actual effects retained without handler trace')))
})

test('enemy arm consumes its actual ground primer and deferred natural hover uses the later live release pose', async t => {
  const f = fixture(t, { enemy: true })
  assert.throws(() => f.observer.armEnemy(), /validated actual ground primer/)
  f.canvas.dispatch('pointerdown'); f.canvas.dispatch('pointerup')
  assert.equal(f.handlers(), 1); assert.equal(f.observer.progress().release, undefined)
  assert.equal(f.observer.read().artifacts.primer.valid, true)
  // Normal charging between inputs is observed, not a cross-turn stock veto.
  f.world.shots.blast++
  assert.equal(f.observer.armEnemy().primerId, 44)
  assert.equal(f.observer.read().artifacts.enemyArmed.stockDeltaSincePrimer, 1)
  assert.equal(f.observer.read().artifacts.pointer.events.filter(e => e.type === 'pointerup').length, 1)
  assert.throws(() => f.observer.armEnemy(), /validated actual ground primer/)
  f.world.projectiles.length = 0; f.world.mode = 'blast'
  f.world.turn = 2; f.target.native.x += 10; f.target.x += 10 / 256; f.scene.gameClock.afterTurn()
  const renderResult = f.scene.renderer.render(f.scene.scene, f.scene.camera), drawNow = performance.now()
  assert.equal(f.scene.drawPointer(drawNow), 'draw-result'); assert.equal(renderResult, 'render-result')
  const prepared = f.observer.read()
  assert.equal(prepared.report.hover.turn, 2); assert.equal(prepared.report.hoverCapture.renderFrame, 1)
  assert.equal(prepared.artifacts.hover.png, undefined); assert.equal(prepared.artifacts.hover.bracketPng, undefined)
  assert.equal(f.log.includes('readPixels'), false); assert.equal(f.log.includes('raster'), false)
  f.world.turn = 3; f.target.native.x += 10; f.target.x += 10 / 256; f.scene.gameClock.afterTurn()
  f.observer.trigger(3)
  f.canvas.dispatch('pointerdown', { x: 11, y: 21 }); f.canvas.dispatch('pointerup', { x: 11, y: 21 })
  await f.observer.settled()
  const delivered = f.observer.read()
  assert.deepEqual(delivered.report.errors, [])
  assert.equal(delivered.report.release.handlerPersonId, 3); assert.equal(delivered.report.release.turn, 3)
  assert.equal(delivered.report.entry.shot.id, 45); assert.equal(delivered.report.movement, undefined)
  assert.notDeepEqual(delivered.report.hover.position, delivered.report.entry.target.position)
  assert.equal(delivered.report.frames.find(frame => frame.kind === 'hover').turn, 2)
  assert.equal(delivered.artifacts.hover.bracketPixels, 1); assert.equal(f.handlers(), 2)
  // After release only the active lifecycle sample reads the target owner;
  // preparation history must not introduce another snapshot on this boundary.
  const nativeOwner = f.target.native
  f.scene.gameClock.beforeTurn()
  f.world.turn = 4; f.world.projectiles[0].remaining = 5
  f.world.projectiles[0].blastTarget.destination = { x: nativeOwner.x, y: nativeOwner.y, h: nativeOwner.h }
  nativeOwner.x += 10
  let ownerReads = 0
  Object.defineProperty(f.target, 'native', { configurable: true, get() { ownerReads++; return nativeOwner } })
  f.scene.gameClock.afterTurn()
  assert.equal(ownerReads, 1); assert.deepEqual(f.observer.progress().errors, [])
  f.observer.dispose(); assert.equal(f.scene.drawPointer, f.originalDraw); assert.equal(f.scene.picking.pickPerson, f.originalPick)
})
test('enemy primer person hit is retained and cannot arm a second person cast', t => {
  const f = fixture(t, { enemy: true, primerPerson: true })
  f.canvas.dispatch('pointerdown'); f.canvas.dispatch('pointerup')
  assert.equal(f.observer.read().artifacts.primer.valid, false)
  assert.equal(f.observer.read().artifacts.primer.event.handlerPersonId, 3)
  assert.throws(() => f.observer.armEnemy(), /validated actual ground primer/)
  assert.match(f.observer.progress().errors.join(' '), /ground primer/)
})
test('enemy draw without matching natural render cannot manufacture hover evidence', t => {
  const f = fixture(t, { enemy: true })
  f.canvas.dispatch('pointerdown'); f.canvas.dispatch('pointerup'); f.observer.armEnemy()
  f.world.mode = 'blast'; f.world.turn = 2; f.target.native.x += 10; f.scene.gameClock.afterTurn()
  f.scene.drawPointer(performance.now())
  assert.equal(f.observer.progress().hover, undefined)
  assert.match(f.observer.progress().errors.join(' '), /preceding natural render/)
})
