import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import native from './fixtures/follower-corpse-native.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
import { validateFollowerCorpseSample, validateFollowerCorpseObservation } from '../scripts/tutorial-browser/follower-corpse-evidence.mjs'
import { installFollowerCorpseObserver, readCommittedFollowerCorpse, readFollowerCorpseReady } from '../scripts/tutorial-browser/follower-corpse-observer.mjs'
import followerCorpse, { activateFollowerCorpseButton, followerCorpseLimitMs, pauseLoadedFollowerCorpse } from '../scripts/tutorial-browser/follower-corpse.mjs'
import { meleeAttackLimitMs } from '../scripts/tutorial-browser/melee-attack.mjs'
import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

// Supplied DOM/input records exercise the helper's guards, not a browser result.
// A hosted run must additionally produce the trusted key/click receipt itself.
async function withButtonInput(change, run) {
  const descriptors = new Map(['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const calls = [], listeners = new Map()
  const state = { visible: true, enabled: true, ariaDisabled: null, focusWorks: true,
    trusted: true, clickDetail: 0, sendClick: true, ...change }
  const button = { isConnected: true, get disabled() { return !state.enabled },
    getAttribute: () => state.ariaDisabled, checkVisibility: () => state.visible,
    addEventListener(type, fn, options) {
      assert.deepEqual(options, { once: true, capture: true }); listeners.set(type, fn)
    } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { activeElement: null } })
  const locator = {
    async waitFor(options) {
      calls.push('visible'); assert.deepEqual(options, { state: 'visible' })
      assert.ok(state.visible && state.enabled, 'Locator must resolve a visible enabled button')
    },
    async focus() { calls.push('focus'); if (state.focusWorks) document.activeElement = button },
    async evaluate(fn) { calls.push('observe-control'); return fn(button) },
    async click() { assert.fail('The keyboard route must not call locator.click') },
  }
  const page = {
    getByRole(role, options) {
      assert.equal(role, 'button'); assert.equal(options.disabled, false)
      assert.equal(options.exact, typeof options.name === 'string'); return locator
    },
    async evaluate(fn) { calls.push('read-input'); return fn() },
    keyboard: { async press(key) {
      calls.push(`key:${key}`); assert.equal(key, 'Enter')
      listeners.get('keydown')({ isTrusted: state.trusted, target: button, key, detail: 0 })
      if (state.sendClick) listeners.get('click')({ isTrusted: state.trusted, target: button, detail: state.clickDetail })
    } },
  }
  try { await run({ page, calls }) } finally {
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
}

test('corpse buttons use visible enabled focus and Enter, retaining genuine native-key evidence', async () => {
  for (const name of ['Select brave', /^Skip introduction/]) await withButtonInput({}, async ({ page, calls }) => {
    const input = await activateFollowerCorpseButton(page, name)
    assert.equal(input.method, 'focused-native-button/Enter')
    assert.deepEqual(calls, ['visible', 'focus', 'observe-control', 'key:Enter', 'read-input'])
    assert.equal(input.events[0].key, 'Enter'); assert.equal(input.events[1].detail, 0)
    assert.ok(input.events.every(event => event.trusted && event.target && event.focused))
  })
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(home, /e\.key === 'Enter' && !\(e\.target as HTMLElement\)\.closest\('button'\)/,
    'Native button Enter must not also invoke the game overview shortcut')
  assert.match(home, /if \(!event\.ctrlKey \|\| !event\.detail\) choose\(event\)/,
    'The ordinary follower control must continue to support keyboard clicks')
})

test('hidden, disabled or unfocused controls cannot receive the corpse test activation', async () => {
  for (const change of [{ visible: false }, { enabled: false }, { ariaDisabled: 'true' }, { focusWorks: false }])
    await withButtonInput(change, async ({ page, calls }) => {
      await assert.rejects(activateFollowerCorpseButton(page, 'Select brave'))
      assert.equal(calls.includes('key:Enter'), false)
    })
})

test('synthetic click, pointer click or missing native activation cannot masquerade as keyboard input', async () => {
  for (const change of [{ trusted: false }, { clickDetail: 1 }, { sendClick: false }])
    await withButtonInput(change, async ({ page }) => {
      await assert.rejects(activateFollowerCorpseButton(page, 'Resume game'), /genuine keyboard activation/)
    })
})

// Supplied evidence only. Expected native chains below come from the independent
// original witness. These tests do not establish a browser or pixel result.
function sample(phase = 0, direction = 0, kind = 'brave') {
  const object = [304, 312, 320, 320][phase], expected = native.sources[object][direction]
  const displayedFrame = phase === 3 ? 4 : 0
  return { effectId: 2, turn: 100 + phase * 10, stamp: 200 + phase * 10, phase,
    object, kind, team: 'blue', draw: 14 + ['brave', 'warrior', 'preacher', 'spy', 'firewarrior'].indexOf(kind),
    renderedDraw: 14 + ['brave', 'warrior', 'preacher', 'spy', 'firewarrior'].indexOf(kind),
    heading: Math.PI, cameraBearing: (0x380 + direction * 256) * Math.PI / 1024,
    direction, directionSource: expected.vstart, displayedFrame, nextFrame: (displayedFrame + 1) % expected.vfra.length,
    frame: units.frames.findIndex(frame => frame.source === expected.vfra[displayedFrame]), flip: expected.mirror,
    drawFlags: phase === 3 ? 6 : 0, visible: true, submittedLayers: 1, canvasConnected: true,
    sceneStoreMatch: true, speed: 1, documentVisible: true, paused: false,
    bodyInCanvas: true, bodyCanvasOwned: true, cropOverlayClear: true }
}

test('every follower kind, native direction and death phase binds original VFRA rather than packed-index aliases', () => {
  for (const kind of ['brave', 'warrior', 'preacher', 'spy', 'firewarrior'])
    for (let phase = 0; phase < 4; phase++) for (let direction = 0; direction < 8; direction++) {
      const s = sample(phase, direction, kind)
      assert.equal(validateFollowerCorpseSample(s).vfra, native.sources[s.object][direction].vfra[s.displayedFrame])
      assert.throws(() => validateFollowerCorpseSample({ ...s, frame: s.object }))
    }
})

test('wrong original chain, heading, draw, displayed frame or hidden/unsubmitted artwork fails closed', () => {
  const s = sample()
  for (const change of [{ object: 248 }, { renderedDraw: 15 }, { draw: 13 }, { direction: 1 },
    { directionSource: 305 }, { flip: true }, { frame: 0 }, { displayedFrame: 8 },
    { visible: false }, { submittedLayers: 0 }, { canvasConnected: false }, { sceneStoreMatch: false },
    { speed: 2 }, { documentVisible: false }, { phase: 4 }])
    assert.throws(() => validateFollowerCorpseSample({ ...s, ...change }))
  assert.throws(() => validateFollowerCorpseSample({ ...sample(3), displayedFrame: 0 }))
  assert.throws(() => validateFollowerCorpseSample({ ...sample(3), drawFlags: 0 }))
})

function observation() {
  const before = { id: 1, team: 'blue', kind: 'brave', hp: 1.3, turn: 99, fight: { group: 4, opponent: 20 } }
  const segment = phases => {
    const samples = phases.map(phase => ({ ...sample(phase), cropFile: `phase-${phase}.png` }))
    return { error: null, done: phases.includes(3), samples, crops: samples.map(s => ({
      filename: s.cropFile, effectId: s.effectId, turn: s.turn, stamp: s.stamp, frame: s.frame,
      phase: s.phase, opaqueColors: 2, sha256: 'a'.repeat(64) })) }
  }
  const effect = { id: 2, corpse: { phase: 1, displayedFrame: 0 }, animation: { object: 312, draw: 14 } }
  return { actorId: 1, effectId: 2, error: null, order: { actorId: 1, target: 20, lastOrderTurn: 80 },
    death: { before, absent: true, newEffect: true, phase: 0, effectId: 2 },
    segments: [segment([0, 1]), segment([1, 2, 3])],
    checkpoint: { committed: { checkpointSha256: 'b'.repeat(64), version: CHECKPOINT_VERSION, level: 2, turn: 111 },
      committedCorpse: { version: CHECKPOINT_VERSION, level: 2, turn: 111, effect: structuredClone(effect) },
      saved: { turn: 111, effect }, restoredSnapshot: { worldReplaced: true, turn: 111, effect: structuredClone(effect), paused: true },
      ...Object.fromEntries([['readyBeforePause', false], ['readyPaused', true], ['readyResumed', false]].map(([key, paused]) =>
        [key, { turn: 112, paused, sceneReplaced: true, worldReplaced: true, sceneStoreMatch: true, canvasConnected: true, effect: structuredClone(effect) }])),
      holdBefore: { turn: 111, animationFrame: 222, effect }, holdAfter: { turn: 111, animationFrame: 222, effect: structuredClone(effect) } } }
}

test('complete synthetic evidence requires combat death, four visible phase crops and actual current load/resume', () => {
  assert.deepEqual(validateFollowerCorpseObservation(observation()).originalSources, [304, 312, 320])
  for (const mutate of [r => { r.death.before.fight = null }, r => { r.death.phase = 1 },
    r => { r.order.lastOrderTurn = 100 }, r => { r.order.target = 13 }, r => { r.death.absent = false }, r => { r.death.newEffect = false },
    r => { r.segments[0].samples[0].cropFile = null }, r => { r.segments[1].samples.at(-1).bodyCanvasOwned = false },
    r => { r.segments[0].crops[0].frame++ }, r => { r.segments[1].crops.at(-1).opaqueColors = 1 },
    r => { r.checkpoint.restoredSnapshot.worldReplaced = false }, r => { r.checkpoint.restoredSnapshot.effect.corpse.displayedFrame++ },
    r => { r.checkpoint.holdAfter.animationFrame++ }, r => { r.segments[1].samples.forEach(s => { s.paused = true }) },
    r => { r.segments[1].done = false }]) {
    const r = observation(); mutate(r); assert.throws(() => validateFollowerCorpseObservation(r))
  }
})

test('same-turn wrong committed corpse and transient-only pause evidence cannot pass', () => {
  for (const mutate of [r => { r.checkpoint.committedCorpse.effect.corpse.displayedFrame = 1 },
    r => { r.checkpoint.committedCorpse.effect.animation.object = 304 },
    r => { delete r.checkpoint.committedCorpse }, r => { r.checkpoint.committedCorpse.version++ },
    r => { r.checkpoint.readyBeforePause.paused = true }, r => { r.checkpoint.readyPaused.paused = false },
    r => { r.checkpoint.readyPaused.sceneReplaced = false }, r => { r.checkpoint.readyPaused.worldReplaced = false },
    r => { r.checkpoint.readyResumed.sceneStoreMatch = false }]) {
    const r = observation(); mutate(r)
    assert.equal(r.checkpoint.restoredSnapshot.paused, true, 'The old transient snapshot still looks paused')
    assert.equal(r.checkpoint.committed.turn, r.checkpoint.saved.turn, 'Turn equality alone still passes')
    assert.throws(() => validateFollowerCorpseObservation(r))
  }
  assert.match(validateFollowerCorpseObservation(observation()).cadence, /^Not established by browser sampling/)
})

test('ready-scene helper publicly pauses after Home resumes the transient restored snapshot', async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const original = { turn: 111, paused: true }, originalScene = { world: original }
  const effect = { id: 2, corpse: { phase: 1 } }, restored = { turn: 111, paused: true, effects: [effect] }
  const transient = structuredClone(restored)
  // Supplied lifecycle ordering matches beginLoad: subscription first, then
  // Home's explicit unpause, then a new ready Scene. This is not browser proof.
  restored.paused = false
  const scene = { world: restored, renderer: { domElement: { isConnected: true } } }, calls = []
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    __pndCorpsePreviousWorld: original, __pndCorpsePreviousScene: originalScene,
    testSceneRef: { current: scene }, testStore: { getWorld: () => restored } } })
  const page = { evaluate: async (fn, arg) => fn(arg), waitForFunction: async fn => assert.equal(fn(), true) }
  try {
    const result = await pauseLoadedFollowerCorpse(page, 2, async name => {
      calls.push(name); assert.equal(name, 'Pause game'); restored.paused = true
    })
    assert.equal(transient.paused, true)
    assert.equal(result.readyBeforePause.paused, false); assert.equal(result.readyPaused.paused, true)
    assert.equal(result.readyPaused.sceneReplaced, true); assert.deepEqual(calls, ['Pause game'])
    restored.paused = false; window.__pndCorpsePreviousScene = scene
    await assert.rejects(pauseLoadedFollowerCorpse(page, 2, async () => assert.fail('Stale Scene must not accept setup input')), /new ready Scene/)
    window.__pndCorpsePreviousScene = originalScene
    await assert.rejects(pauseLoadedFollowerCorpse(page, 2, async () => {}), /strictly equal/)
    assert.equal(readFollowerCorpseReady(2).paused, false)
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
    else delete globalThis.window
  }
})

test('committed corpse observer reads only actual IDB bytes and retains an independent snapshot', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  const effect = { id: 2, duration: Infinity, corpse: { phase: 1, displayedFrame: 0 }, animation: { object: 312, draw: 14 } }
  const record = { version: CHECKPOINT_VERSION, world: { turn: 111, outcome: { level: 2 }, effects: [effect] } }
  let closed = 0, opened = 0, databasePresent = true
  const db = { close: () => { closed++ }, transaction: (store, mode) => {
    assert.equal(store, 'checkpoints'); assert.equal(mode, 'readonly')
    const transaction = { objectStore: name => {
      assert.equal(name, 'checkpoints')
      return { get: key => { assert.equal(key, 'latest'); queueMicrotask(() => transaction.oncomplete()); return { result: record } } }
    } }
    return transaction
  } }
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
    databases: async () => databasePresent ? [{ name: 'populous-new-dawn' }] : [],
    open: name => { opened++; assert.equal(name, 'populous-new-dawn')
      const request = { result: db }; queueMicrotask(() => request.onsuccess()); return request }
  } })
  try {
    const observed = await readCommittedFollowerCorpse(2)
    assert.deepEqual(observed, { version: CHECKPOINT_VERSION, level: 2, turn: 111, effect })
    observed.effect.corpse.displayedFrame = 7
    assert.equal(record.world.effects[0].corpse.displayedFrame, 0, 'Readback must not alias the record')
    record.world.effects[0].corpse.displayedFrame = 1
    const wrongSameTurn = await readCommittedFollowerCorpse(2)
    assert.equal(wrongSameTurn.turn, 111); assert.equal(wrongSameTurn.effect.corpse.displayedFrame, 1)
    await assert.rejects(readCommittedFollowerCorpse(3), /missing or ambiguous/)
    assert.equal(closed, 3)
    databasePresent = false
    await assert.rejects(readCommittedFollowerCorpse(2), /database is missing/)
    assert.equal(opened, 3, 'Missing database must not be created')
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'indexedDB', descriptor)
    else delete globalThis.indexedDB
  }
})

function withObserver(run) {
  let callback, copies = 0, encodes = 0, readbacks = 0, pixels = 1
  const world = { turn: 98, paused: false, speed: 1, effects: [],
    units: [{ id: 1, kind: 'brave', team: 'blue', hp: 1.3, x: 20, z: 20, heading: Math.PI, fight: { group: 4, opponent: 20, action: 'ready' } }] }
  const rect = { left: 200, top: 0, width: 760, height: 720 }
  const canvas = { width: 760, height: 720, isConnected: true, getBoundingClientRect: () => rect }
  const group = { visible: true, position: {}, userData: { layers: [{ visible: true, userData: { piece: 22 } }], bounds: { left: -8, top: -24, right: 8, bottom: 0 } } }
  const scene = { world, renderer: { domElement: canvas, info: { render: { frame: 200 } } },
    gameClock: { animationFrame: 100, animationTime: 1 }, camera: {}, cameraBearing: 0x380 * Math.PI / 1024,
    fxMeshes: new Map([[2, group]]), view: { screen: () => ({ x: 0, y: 0, z: 0 }), painter: { source: () => ({ object: 2 }) } } }
  const replacements = { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    requestAnimationFrame: fn => { callback = fn; return 1 }, cancelAnimationFrame: () => { callback = null },
    document: { visibilityState: 'visible', elementFromPoint: () => canvas, querySelectorAll: () => [],
      createElement: () => {
        let captured
        return { width: 0, height: 0, getContext: () => ({
          drawImage: () => { copies++; captured = pixels },
          getImageData: () => { readbacks++; return { data: [captured, 0, 0, 255, 0, 1, 0, 255] } },
        }), toDataURL: () => { encodes++; return `data:image/png;base64,${captured}` } }
      } } }
  const descriptors = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const visit = phase => {
    if (phase !== undefined) {
      const s = sample(phase)
      world.units = []; world.turn = s.turn
      world.effects = [{ id: 2, x: 20, z: 20, unit: { kind: 'brave', team: 'blue', heading: Math.PI },
        corpse: { phase, remaining: 468 - phase, displayedFrame: s.displayedFrame },
        animation: { object: s.object, draw: s.draw, f1: 0, f2: s.nextFrame } }]
      Object.assign(group.userData, { draw: s.draw, drawFlags: s.drawFlags, frame: s.frame,
        frameFlip: s.flip, directions: Array.from({ length: 8 }, (_, d) => ({ source: native.sources[s.object][d].vstart })) })
    }
    const before = structuredClone(world)
    scene.renderer.info.render.frame++
    callback()
    assert.deepEqual(world, before, 'The observer must not mutate World or effect state')
  }
  try {
    for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    return run({ world, scene, visit, observation: () => window.__pndCorpseObservation,
      counts: () => ({ copies, encodes, readbacks }), setPixels: n => { pixels = n } })
  } finally {
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
}

test('read-only observer follows living combat to native corpse and retains only same-callback copies', () => {
  withObserver(({ visit, observation, counts, setPixels }) => {
    installFollowerCorpseObserver({ actorId: 1 }); visit()
    for (const phase of [0, 1, 2, 3]) { setPixels(phase + 1); visit(phase) }
    const r = observation().result
    assert.equal(r.error, null); assert.equal(r.done, true); assert.equal(r.death.before.id, 1)
    assert.deepEqual(r.samples.map(s => s.object), [304, 312, 320, 320])
    assert.deepEqual(counts(), { copies: 4, encodes: 0, readbacks: 0 })
    const terminal = structuredClone(r.terminal)
    setPixels(99); observation().retain(); observation().retain()
    assert.deepEqual(counts(), { copies: 4, encodes: 4, readbacks: 4 })
    assert.deepEqual(r.crops.map(c => c.png), [1, 2, 3, 4].map(n => `data:image/png;base64,${n}`))
    assert.deepEqual(r.terminal, terminal)
    for (const s of r.samples) validateFollowerCorpseSample(s)
  })
})

test('observer rejects an unseen combat producer and refuses a stale Scene/world', () => {
  withObserver(({ world, visit, observation }) => {
    world.units[0].fight = null; installFollowerCorpseObserver({ actorId: 1 }); visit(); visit(0)
    assert.match(observation().result.error, /living combat participant/)
  })
  withObserver(({ scene, visit, observation }) => {
    installFollowerCorpseObserver({ actorId: 1 }); scene.world = {}; visit()
    assert.match(observation().result.error, /bound Scene\/world/)
  })
})

test('invoked gameplay chain and all existing time bounds remain explicit without a new workflow', async () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.ok(run.indexOf('receipt.gameplayFrames = await') < run.indexOf('receipt.meleeAttack = await'))
  assert.ok(run.indexOf('receipt.meleeAttack = await') < run.indexOf('receipt.followerCorpse = await'))
  assert.equal(followerCorpseLimitMs, 75000); assert.equal(meleeAttackLimitMs, 75000)
  assert.equal(browserCapMs('gameplay-frames'), 180000)
  const stop = Error('Stop before browser creation')
  await assert.rejects(followerCorpse({ browser: { async newContext(options) {
    assert.deepEqual(options, { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 }); throw stop
  } } }), error => error === stop)
})
