import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import treeHover, { assertTreeHoverEvidence } from '../scripts/local-render/tree-hover.mjs'
import { stripTypeScriptTypes } from 'node:module'
import { minimapPick } from '../app/minimap.ts'
import { minimapInput } from '../qa/erosion-ordinary/minimap-input.mjs'
import { findEntityInput } from '../qa/erosion-ordinary/input.mjs'
import { authoredHoverTargets, hoverInput, hoverMinimapInput } from '../scripts/local-render/tree-hover-input.mjs'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/world-turn.ts'
import levelOne from '../app/level-one.ts'
import { zoomPreset } from '../app/camera-view.ts'
import { installTreeHoverWitness } from '../scripts/local-render/tree-hover-witness.mjs'

// Execute these exact shipped function bodies; imported branches unused by the
// declared no-mode/zero-buttons contract have explicit fail-closed boundaries.
const inputSource = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
function shipped(name, dependencies = {}) {
  const begin = inputSource.indexOf(`export function ${name}(`)
  assert.ok(begin >= 0)
  const next = inputSource.indexOf('\nexport ', begin + 1)
  const js = stripTypeScriptTypes(inputSource.slice(begin, next < 0 ? undefined : next)).replace('export ', '')
  return Function(...Object.keys(dependencies), `${js};return ${name}`)(...Object.values(dependencies))
}
const unsupported = () => { throw Error('Undeclared branch') }
const updatePointerFrame = shipped('updatePointerFrame', { blastPersonTargeting: () => false,
  blastPersonPosition: unsupported, nativePosition: unsupported, browserPosition: unsupported })
const pointerMove = shipped('pointerMove')
const cameraDeclaration = inputSource.slice(inputSource.indexOf('const cameraKeys:'), inputSource.indexOf('\n}', inputSource.indexOf('const cameraKeys:')) + 2)
const cameraKeys = Function(`${stripTypeScriptTypes(cameraDeclaration)};return cameraKeys`)()
const keyDown = shipped('keyDown', { cameraKeys, cameraBookmark: unsupported })
const installInput = shipped('installInputListeners', { minimapPick,
  nativePosition: (_world, p) => ({ x: ((p.x + 8) * 256) << 16 >> 16, y: ((-p.z - 8) * 256) << 16 >> 16 }),
  browserPosition: p => ({ x: ((p.x - 2048) << 16 >> 16) / 256, z: -((p.y + 2048) << 16 >> 16) / 256 }) })

function fixture({ failRender, failReadback, own = false } = {}) {
  const prior = Object.fromEntries(['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const target = () => ({ listeners: [], addEventListener(type, fn, capture) { this.listeners.push({ type, fn, capture: !!capture }) },
    removeEventListener(type, fn, capture) { this.listeners = this.listeners.filter(r => r.type !== type || r.fn !== fn || r.capture !== !!capture) } })
  const win = target(), canvas = Object.assign(target(), { width: 1440, height: 1000, isConnected: true,
    getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, width: 1440, height: 1000 }),
    toDataURL() { if (failReadback) throw failReadback; return 'data:image/png;base64,AA==' } })
  const world = { trees: [{ id: 999, x: 3, z: 23, model: 1, logs: 4 }], buildings: [{ id: 888, x: -11.0703125, z: 33.0546875, anchor: { x: 64512, y: 54784 }, team: 'blue', kind: 'hut' }],
    units: [{ id: 1, native: { commands: [0], commandCursor: 0 } }], selected: [1], buildingOrders: { records: [] },
    randomState: 12, cosmeticRandom: { randomState: 13 }, turn: 0, speed: 1, paused: false, status: 'playing',
    mode: null, inputMask: 0, manaWorld: { gameFlags: 0 }, flyby: { flags: 0 } }
  const result = {}, calls = [], original = function (...args) { calls.push({ receiver: this, args }); if (failRender) throw failRender; this.info.render.frame++; return result }
  const renderer = Object.create({ render: original }); renderer.info = { render: { frame: 0 } }; renderer.domElement = canvas
  if (own) Object.defineProperty(renderer, 'render', { value: original, configurable: true, writable: true, enumerable: false })
  const body = { visible: true, userData: { nativeModel: 13, highlight: { value: 0 } },
    geometry: { getAttribute: () => ({ array: [7, 7, 7] }) } }
  const group = { visible: true, userData: { point: world.trees[0] }, traverse(fn) { fn(body) } }; body.parent = group
  const buildingBody = { ...body, userData: { nativeModel: 10, highlight: { value: 0 } } }
  const buildingGroup = { visible: true, userData: { building: 888 }, traverse(fn) { fn(buildingBody) } }; buildingBody.parent = buildingGroup
  const mini = Object.assign(target(), { width: 200, height: 192, getBoundingClientRect: () => ({ x: 20, y: 30, left: 20, top: 30, width: 200, height: 192 }) })
  const scene = { world, renderer, frame: 1, gameClock: { animationFrame: 0 }, scene: {}, camera: { position: { toArray: () => [0, 0, 0] } },
    decorations: { children: [group] }, buildingMeshes: new Map([[888, buildingGroup]]), mini, testHit: 999, view: { projection: {} }, viewPreset: 0,
    viewPoint: { x: 0, z: 0 }, cameraBearing: 0, viewTransition: null, overviewActive: false,
    pointerScreen: null, hoveredObject: null, pointerButtons: 0, pointerState: '', container: { clientWidth: 1440, clientHeight: 1000 },
    selectionOverlay: {}, dragActive: { value: false }, keys: new Set(), updateSpellHalo() {},
    updatePointerFrame(now) { return updatePointerFrame(this, now) },
    picking: { pick() { return scene.testHit }, model() { return [{ kind: 'model', points: [{ x: 40, y: 40 }, { x: 80, y: 40 }, { x: 60, y: 80 }] }] } },
    pointerMove(event) { return pointerMove(scene, event) }, keyDown(event) { return keyDown(scene, event) },
    zoom(inward) { this.viewPreset = zoomPreset(this.viewPreset, inward) }, focus(p, options) { scene.focused = { p, options } },
    listen(t, type, fn) { t.addEventListener(type, fn, false) } }
  globalThis.window = Object.assign(win, { testSceneRef: { current: scene }, testStore: { getWorld: () => world } })
  globalThis.document = Object.assign(target(), { elementFromPoint: x => x < 1000 ? canvas : null })
  installInput(scene, mini)
  const dispatch = (type, x = 60, y = 50) => {
    const e = { type, clientX: x, clientY: y, buttons: 0, button: 0, isTrusted: true, target: canvas }
    for (const row of [...canvas.listeners].filter(r => r.type === type && r.capture)) row.fn(e)
    for (const row of [...canvas.listeners].filter(r => r.type === type && !r.capture)) row.fn(e)
  }
  const key = (value, type = 'keydown') => {
    const e = { type, key: value, code: value === 'w' ? 'KeyW' : value === '-' ? 'Minus' : 'Equal',
      isTrusted: true, target: { closest: () => null }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }
    for (const row of [...win.listeners].filter(r => r.type === type && r.capture)) row.fn(e)
    for (const row of [...win.listeners].filter(r => r.type === type && !r.capture)) row.fn(e)
  }
  return { scene, world, body, canvas, renderer, original, result, calls, dispatch, mini, key,
    draw(turn) { world.turn = turn; scene.gameClock.animationFrame++; scene.updatePointerFrame(turn); body.userData.highlight.value = scene.hoveredObject === 999 ? (turn & 2 ? 255 : 200) : 0
      buildingBody.userData.highlight.value = scene.hoveredObject === 888 ? (turn & 2 ? 255 : 200) : 0
      const value = renderer.render(scene.scene, scene.camera); scene.frame++; return value },
    restore() { for (const [key, descriptor] of Object.entries(prior)) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } }
}

test('shipped hover and leave compose with observer without diagnostic picks or simulation mutation', () => {
  const f = fixture(); let api
  try {
    const originals = [f.scene.updatePointerFrame, f.scene.picking.pick], listeners = f.canvas.listeners.length
    api = installTreeHoverWitness([{ id: 999, kind: 'tree' }]); api.arm({ name: 'tree-live', kind: 'hover', id: 999, point: { x: 60, y: 50 } })
    f.dispatch('pointermove')
    for (let turn = 0; turn < 4; turn++) assert.equal(f.draw(turn), f.result)
    assert.equal(api.status().phase.done, true)
    api.arm({ name: 'tree-leave', kind: 'leave' }); f.dispatch('pointerleave', 1200); f.draw(4)
    const evidence = api.read()
    assert.deepEqual(evidence.errors, []); assert.equal(evidence.records.at(-1).state.hovered, null)
    for (const event of evidence.records.filter(r => r.kind === 'event')) assert.deepEqual(event.after, event.before)
    assert.equal(evidence.records.filter(r => r.kind === 'render').flatMap(r => r.pointerUpdate.picks).length, 4)
    assert.equal(Object.keys(evidence.frames).length, 3)
    api.close(); api.close(); assert.equal(f.canvas.listeners.length, listeners)
    assert.equal(f.renderer.render, f.original); assert.equal(Object.hasOwn(f.renderer, 'render'), false)
    assert.equal(f.scene.updatePointerFrame, originals[0]); assert.equal(f.scene.picking.pick, originals[1])
  } finally { api?.close(); f.restore() }
})

test('original render exception is retained and no successful frame is manufactured', () => {
  const failure = Error('GPU boundary failure'), f = fixture({ failRender: failure, own: true }); let api
  const descriptor = Object.getOwnPropertyDescriptor(f.renderer, 'render')
  try {
    api = installTreeHoverWitness([{ id: 999, kind: 'tree' }]); api.arm({ name: 'tree-live', kind: 'hover', id: 999, point: { x: 60, y: 50 } })
    f.dispatch('pointermove'); assert.throws(() => f.draw(0), e => e === failure)
    assert.equal(f.calls.length, 1); assert.equal(api.read().records.filter(r => r.kind === 'render').length, 0)
    api.close(); assert.deepEqual(Object.getOwnPropertyDescriptor(f.renderer, 'render'), descriptor)
  } finally { api?.close(); f.restore() }
})

test('readback failure remains evidence failure and original return/cleanup survive', () => {
  const f = fixture({ failReadback: Error('PNG failure') }); let api
  try {
    api = installTreeHoverWitness([{ id: 999, kind: 'tree' }]); api.arm({ name: 'tree-live', kind: 'hover', id: 999, point: { x: 60, y: 50 } })
    f.dispatch('pointermove'); assert.equal(f.draw(0), f.result); assert.match(api.read().errors[0], /PNG failure/)
    api.close(); assert.equal(f.renderer.render, f.original)
  } finally { api?.close(); f.restore() }
})

test('authored identity resolves coordinates/model and prepared pixels retain direct tree picker evidence', async () => {
  const f = fixture()
  try {
    assert.equal(authoredHoverTargets(f.scene).tree.id, 999)
    f.scene.pickWorldObject = () => { throw Error('Omitting-tree helper must not run') }
    const prepared = await hoverInput({ scene: f.scene, target: { id: 999, kind: 'tree' }, findEntityInput, doc: document })
    assert.equal(prepared.point.interiorRadius, 2); assert.equal(prepared.probe.inspected, 25)
    assert.equal(prepared.sceneFrame, 1); assert.deepEqual(prepared.probe.bodies[0].textureModes, [7])
  } finally { f.restore() }
})

test('actual shipped minimap handler matches prepared inverse at variable camera headings', async () => {
  const f = fixture()
  try {
    const listener = f.mini.listeners.find(r => r.type === 'pointerdown').fn
    for (const heading of [0, 257, 512, 1001, 1536, 2047]) {
      f.scene.cameraBearing = heading * Math.PI / 1024
      const prepared = await hoverMinimapInput({ scene: f.scene, target: { x: 3, z: 23 }, minimapInput, minimapPick,
        doc: { elementFromPoint: () => f.mini } })
      assert.ok(prepared)
      listener({ clientX: prepared.x, clientY: prepared.y, button: 0 })
      assert.deepEqual(f.scene.focused, { p: { x: ((prepared.native.x - 2048) << 16 >> 16) / 256,
        z: -((prepared.native.y + 2048) << 16 >> 16) / 256 }, options: { animate: true } })
      assert.ok(prepared.distance <= 2048)
    }
  } finally { f.restore() }
})


test('actual shipped keyboard handler chooses W navigation and normal-to-bird zoom without heading assumptions', () => {
  const f = fixture()
  try {
    const declaration = inputSource.slice(inputSource.indexOf('const cameraKeys:'), inputSource.indexOf('\n}', inputSource.indexOf('const cameraKeys:')) + 2)
    const cameraKeys = Function(`${stripTypeScriptTypes(declaration)};return cameraKeys`)()
    const keyDown = shipped('keyDown', { cameraKeys, cameraBookmark: unsupported })
    const cameraSource = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
    const zoomCode = stripTypeScriptTypes(cameraSource.slice(cameraSource.indexOf('export function zoom('))).replace('export ', '')
    const zoom = Function('zoomPreset', `${zoomCode};return zoom`)(zoomPreset)
    let requested
    f.scene.startGroundView = preset => { requested = preset }
    f.scene.zoom = inward => zoom(f.scene, inward)
    for (const heading of [0, 0.71, Math.PI, 6.2]) {
      f.scene.cameraBearing = heading; f.scene.viewPreset = 0; f.scene.keys.clear()
      const event = key => ({ key, code: key === 'w' ? 'KeyW' : 'Minus', target: { closest: () => null }, preventDefault() { this.consumed = true } })
      const pan = event('w'); keyDown(f.scene, pan); assert.ok(f.scene.keys.has('w')); assert.ok(pan.consumed)
      const outward = event('-'); keyDown(f.scene, outward); assert.equal(requested, 2); assert.ok(outward.consumed)
      f.scene.viewPreset = 2; const inward = event('='); keyDown(f.scene, inward); assert.equal(requested, 0)
      assert.equal(f.scene.cameraBearing, heading)
    }
  } finally { f.restore() }
})


for (const primary of [null, undefined, false, 0, 'plain failure'])
  test(`scenario retains primitive failure ${String(primary)} through a later persistence failure`, async () => {
    const output = mkdtempSync(resolve(tmpdir(), 'tree-hover-error-'))
    const page = { setDefaultTimeout() {}, getByRole() { rmSync(output, { recursive: true }); throw primary } }
    let caught = false, value
    try {
      await treeHover({ page, root: resolve(import.meta.dirname, '..'), output, receipt: { errors: [] },
        signal: { throwIfAborted() {} } })
    } catch (error) { caught = true; value = error }
    finally { rmSync(output, { recursive: true, force: true }) }
    assert.equal(caught, true); assert.strictEqual(value, primary)
  })


for (const handoffBeforeArm of [true, false]) test(`complete composed evidence accepts ${handoffBeforeArm ? 'panel' : 'HUD'} leave and rejects broken control ownership`, () => {
  const f = fixture(); let api
  try {
    api = installTreeHoverWitness([{ id: 999, kind: 'tree' }, { id: 888, kind: 'building' }])
    const point = { x: 60, y: 50, preparation: { sceneFrame: -1 }, boundary: { rendererFrame: 0 } }
    let turn = 0
    const hover = (name, id) => {
      f.scene.testHit = id; api.arm({ name, kind: 'hover', id, point, singleFrame: id === 888 }); f.dispatch('pointermove')
      for (let n = 0; n < (id === 888 ? 1 : 4); n++) f.draw(turn++)
    }
    const leave = name => {
      if (name === 'building-leave' && handoffBeforeArm) f.dispatch('pointerleave', 1200) // Real panel handoff can precede host arm.
      api.arm({ name, kind: 'leave', ...(name === 'building-leave' ? { continuationOf: 'building-live' } : {}) })
      if (name !== 'building-leave' || !handoffBeforeArm) f.dispatch('pointerleave', 1200)
      f.draw(turn++)
    }
    hover('tree-live', 999)
    api.arm({ name: 'tree-pan', kind: 'camera', change: 'pan', point }); f.key('w'); f.scene.viewPoint.x++; f.draw(turn++); f.key('w', 'keyup')
    api.arm({ name: 'tree-zoom', kind: 'camera', change: 'zoom', point }); f.key('-'); f.draw(turn++); f.key('-', 'keyup')
    f.key('='); f.key('=', 'keyup')
    hover('tree-return', 999); leave('tree-leave'); hover('building-live', 888); leave('building-leave')
    api.close(); const evidence = api.read(); assertTreeHoverEvidence(evidence)
    for (const damage of [
      value => { value.records = value.records.filter(r => !(r.phase === 'tree-return' && r.type === 'pointermove')) },
      value => { value.records.find(r => r.type === 'keydown' && r.key === '-').defaultPrevented = false },
      value => { value.records.find(r => r.kind === 'render').bodies[999][0].uniform = 0 },
      value => { value.records.find(r => r.kind === 'event').after.units[0].immediateCommand = 77 },
      value => { value.records.find(r => r.kind === 'render').receiverMatches = false },
      value => { value.records.find(r => r.phase === 'building-live' && r.type === 'pointermove').canvasOwned = false },
      value => { value.records.find(r => r.type === 'pointerleave' && ['building-live', 'building-leave'].includes(r.phase)).canvasTarget = false },
      value => { value.records.find(r => r.phase === 'building-live' && r.kind === 'render').bodies[888][0].uniform = 0 },
      value => { value.records = value.records.filter(r => !(r.type === 'pointerleave' && ['building-live', 'building-leave'].includes(r.phase))) },
      value => { value.records.find(r => r.phase === 'building-leave' && r.kind === 'render').bodies[888][0].uniform = 255 },
    ]) { const bad = structuredClone(evidence); damage(bad); assert.throws(() => assertTreeHoverEvidence(bad)) }
  } finally { api?.close(); f.restore() }
})


test('actual createWorld1 binds object42 by authored anchor, not its normalized display origin', () => {
  const world = createWorld(1), declared = levelOne.objects.find(o => o.index === 42)
  const targets = authoredHoverTargets({ world })
  assert.equal(targets.failure, null); assert.equal(targets.tree.sourceObject, 20)
  assert.equal(targets.tree.x, 3); assert.equal(targets.tree.z, 23); assert.equal(targets.tree.model, 1)
  assert.equal(targets.building.sourceObject, 42)
  assert.deepEqual(targets.building.anchor, { x: Math.round((declared.x + 8) * 256) & 0xfe00,
    y: Math.round((-declared.z - 8) * 256) & 0xfe00 })
  const actual = world.buildings.find(b => b.id === targets.building.id)
  assert.equal(targets.building.x, actual.x); assert.equal(targets.building.z, actual.z)
  assert.notEqual(actual.x, declared.x); assert.notEqual(actual.z, declared.z)
  assert.equal(world.buildings.some(b => b.x === -12 && b.z === 34 && b.team === 'blue' && b.kind === 'hut'), false,
    'Retains baseline01 wrong-coordinate predicate failure at initialization, without replay')
  assert.equal(targets.roster.truncated, false)
  const missing = authoredHoverTargets({ world: { ...world, buildings: [] } })
  assert.equal(missing.tree.id, targets.tree.id); assert.equal(missing.building, null)
  assert.match(missing.failure, /object42/); assert.equal(missing.roster.buildingCount, 0)
  // Supporting model feasibility only: a single fixed 405-turn progression.
  // No browser, frame/readiness replay, forced completion flag or seed sweep.
  for (let turns = 0; turns < 405; turns++) tick(world, 1 / 12)
  assert.equal(world.turn, 405)
  const after = authoredHoverTargets({ world })
  assert.equal(after.failure, null); assert.equal(after.tree.id, targets.tree.id); assert.equal(after.tree.logs, 4)
  assert.equal(after.building.id, targets.building.id); assert.deepEqual(after.building.anchor, targets.building.anchor)
})
