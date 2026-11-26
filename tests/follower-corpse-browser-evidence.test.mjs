import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import native from './fixtures/follower-corpse-native.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
import { validateFollowerCorpseSample, validateFollowerCorpseObservation } from '../scripts/tutorial-browser/follower-corpse-evidence.mjs'
import { installFollowerCorpseObserver, readCommittedFollowerCorpse, readFollowerCorpseReady } from '../scripts/tutorial-browser/follower-corpse-observer.mjs'
import followerCorpse, { assertFollowerCorpseActorSelection, followerCorpseBudgetMs, followerCorpseDeadline, pauseLoadedFollowerCorpse, readFollowerCorpseFailureState, sampleFollowerCorpseFailure } from '../scripts/tutorial-browser/follower-corpse.mjs'
import { meleeAttackLimitMs } from '../scripts/tutorial-browser/melee-attack.mjs'
import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

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
  const before = { id: 1235, team: 'blue', kind: 'brave', hp: 1.3, turn: 99, fight: { group: 4, opponent: 20 } }
  const segment = (segment, phases) => {
    const samples = phases.map(phase => ({ ...sample(phase), cropFile: `follower-corpse-${segment}-${phase}.png` }))
    return { segment, error: null, done: phases.includes(3), samples, crops: samples.map(s => ({
      filename: s.cropFile, effectId: s.effectId, turn: s.turn, stamp: s.stamp, frame: s.frame,
      phase: s.phase, opaqueColors: 2, sha256: 'a'.repeat(64) })) }
  }
  const effect = { id: 2, corpse: { phase: 1, displayedFrame: 0 }, animation: { object: 312, draw: 14 } }
  return { actorId: 1235, effectId: 2, error: null, order: { actorId: 1235, target: 20, lastOrderTurn: 80 },
    death: { before, absent: true, newEffect: true, phase: 0, effectId: 2 },
    segments: [segment('original', [0, 1]), segment('loaded', [1, 2, 3])],
    checkpoint: { committed: { checkpointSha256: 'b'.repeat(64), version: CHECKPOINT_VERSION, level: 2, turn: 111 },
      committedCorpse: { version: CHECKPOINT_VERSION, level: 2, turn: 111, effect: structuredClone(effect) },
      saved: { turn: 111, effect }, restoredSnapshot: { worldReplaced: true, turn: 111, effect: structuredClone(effect), paused: true },
      ...Object.fromEntries([['readyBeforePause', false], ['readyPaused', true], ['readyResumed', false]].map(([key, paused]) =>
        [key, { turn: 112, paused, sceneReplaced: true, worldReplaced: true, sceneStoreMatch: true, canvasConnected: true, effect: structuredClone(effect) }])),
      holdBefore: { turn: 111, animationFrame: 222, effect }, holdAfter: { turn: 111, animationFrame: 222, effect: structuredClone(effect) } } }
}

test('public selection rejects an otherwise eligible substitute Blue Brave before observer install', () => {
  const other = { id: 1236, team: 'blue', kind: 'brave', hp: 1.3, fight: null, target: null }
  assert.throws(() => assertFollowerCorpseActorSelection({ paused: true, selected: [1236], people: [other] }), /authored Blue Brave 1235/)
  assert.throws(() => assertFollowerCorpseActorSelection({ paused: true, selected: [1235], people: [other] }), /authored Blue Brave 1235/)
  assert.equal(assertFollowerCorpseActorSelection({
    paused: true, selected: [1235], people: [{ ...other, id: 1235 }],
  }), 1235)
  const episode = readFileSync(new URL('../scripts/tutorial-browser/follower-corpse.mjs', import.meta.url), 'utf8')
  const guard = episode.indexOf('report.actorId = assertFollowerCorpseActorSelection(report.selection)')
  assert.ok(guard > episode.indexOf("await button('Select brave')"))
  assert.ok(guard < episode.indexOf('await page.evaluate(installFollowerCorpseObserver'))
})

test('receipt rejects a consistently relabeled substitute brave even with all matching evidence', () => {
  const supplied = observation()
  assert.equal(validateFollowerCorpseObservation(supplied).victimId, 1235)
  supplied.actorId = supplied.order.actorId = supplied.death.before.id = 1236
  assert.throws(() => validateFollowerCorpseObservation(supplied), /authored Blue Brave 1235/)
})

function suppliedBudget() {
  let time = 0, next = 0
  const timers = new Map(), expired = []
  const budget = followerCorpseDeadline({ now: () => time,
    schedule: (fn, delay) => { timers.set(++next, { fn, delay }); return next },
    cancel: id => timers.delete(id), onExpire: record => expired.push(record.name) })
  const checkpoint = observation().checkpoint
  checkpoint.saved.paused = true
  return { budget, checkpoint, timers, expired, advance: value => { time = value } }
}

const orderProof = () => ({ clockReleased: true, beforeAttack: { turn: 114 },
  order: { turn: 114, lastOrderTurn: 114, selected: [1235], actorId: 1235, target: 20, paused: false } })

test('corpse budgets separately bound opening, released combat/save, and actual load verification', () => {
  const { budget, checkpoint, timers, advance } = suppliedBudget()
  assert.equal(budget.remaining(), 80000); assert.equal(timers.get(1).delay, 80000)
  assert.throws(() => budget.complete(), /All three corpse phases must complete/)
  assert.throws(() => budget.beginLoad(checkpoint), /after exact-order release/)
  advance(52183); budget.beginCombat(orderProof())
  assert.deepEqual(budget.records[0], { name: 'opening-through-exact-order-and-release', capMs: 80000,
    startedElapsedMs: 0, deadlineElapsedMs: 80000, completedElapsedMs: 52183, durationMs: 52183,
    releasedOrder: { turn: 114, actorId: 1235, target: 20 } })
  assert.equal(timers.has(1), false); assert.equal(timers.get(2).delay, 65000)
  advance(95900); budget.beginLoad(checkpoint)
  assert.deepEqual(budget.records[1], { name: 'released-exact-order-through-committed-save', capMs: 65000,
    startedElapsedMs: 52183, deadlineElapsedMs: 117183, completedElapsedMs: 95900, durationMs: 43717,
    committedSave: { checkpointSha256: 'b'.repeat(64), turn: 111, effectId: 2 } })
  assert.deepEqual(budget.records[2], { name: 'load-reframe-resume-and-terminal-verification',
    capMs: 25000, startedElapsedMs: 95900, deadlineElapsedMs: 120900 })
  assert.equal(timers.has(2), false); assert.equal(timers.get(3).delay, 25000)
  advance(119900); budget.complete()
  assert.equal(budget.records[2].durationMs, 24000); assert.equal(timers.size, 0)
  assert.throws(() => budget.remaining(), /already closed/)
})

test('unreleased clock, incorrect turn or wrong order cannot start the combat budget', () => {
  for (const mutate of [p => { p.clockReleased = false }, p => { p.beforeAttack.turn-- },
    p => { p.order.lastOrderTurn-- }, p => { p.order.turn++ }, p => { p.order.actorId++ },
    p => { p.order.selected = [1236] }, p => { p.order.target++ }, p => { p.order.paused = true }]) {
    const { budget, timers, advance } = suppliedBudget(), proof = orderProof()
    mutate(proof); advance(1000)
    assert.throws(() => budget.beginCombat(proof))
    assert.equal(budget.records.length, 1); assert.equal(budget.remaining(), 79000)
    assert.equal(timers.size, 1); assert.equal(timers.has(1), true)
    budget.dispose()
  }
})

test('missing or wrong committed save cannot start or refresh the load budget', () => {
  for (const mutate of [c => { delete c.committed }, c => { c.committed.version++ },
    c => { c.committed.checkpointSha256 = 'not-a-digest' }, c => { c.committedCorpse.level++ },
    c => { c.committedCorpse.turn++ }, c => { c.committedCorpse.effect.corpse.displayedFrame++ },
    c => { c.saved.paused = false }, c => { c.saved.effect.corpse.phase = 2 }]) {
    const { budget, checkpoint, timers, advance } = suppliedBudget()
    advance(52183); budget.beginCombat(orderProof())
    mutate(checkpoint); advance(95900)
    assert.throws(() => budget.beginLoad(checkpoint))
    assert.equal(budget.records.length, 2); assert.equal(budget.remaining(), 21283)
    assert.equal(timers.size, 1); assert.equal(timers.has(2), true)
    budget.dispose(); assert.equal(timers.size, 0)
  }
})

test('expired or repeated budget transitions fail even if the timer callback was delayed', () => {
  const first = suppliedBudget()
  first.advance(80000)
  assert.throws(() => first.budget.beginCombat(orderProof()), /deadline exceeded/)
  assert.equal(first.budget.records.length, 1)
  first.timers.get(1).fn()
  assert.deepEqual(first.expired, ['opening-through-exact-order-and-release'])
  first.budget.dispose()
  const second = suppliedBudget(), oldCallback = second.timers.get(1).fn
  second.advance(52000); second.budget.beginCombat(orderProof())
  assert.throws(() => second.budget.beginCombat(orderProof()), /Only one/)
  assert.equal(second.budget.records[1].deadlineElapsedMs, 117000)
  oldCallback(); assert.deepEqual(second.expired, [])
  second.advance(117000)
  assert.throws(() => second.budget.beginLoad(second.checkpoint), /deadline exceeded/)
  assert.deepEqual(second.expired, ['released-exact-order-through-committed-save'])
  second.budget.dispose()
  const third = suppliedBudget()
  third.advance(52000); third.budget.beginCombat(orderProof())
  third.advance(96000); third.budget.beginLoad(third.checkpoint)
  assert.throws(() => third.budget.beginLoad(third.checkpoint), /Only one/)
  third.advance(121000); third.timers.get(3).fn()
  assert.throws(() => third.budget.complete(), /deadline exceeded/)
  assert.deepEqual(third.expired, ['load-reframe-resume-and-terminal-verification'])
  third.budget.dispose()
})

test('last failure read is bounded, records snapshot results, and tolerates a lost page', async () => {
  assert.deepEqual(await sampleFollowerCorpseFailure({ isClosed: () => false,
    evaluate: async (_, id) => ({ turn: 444, renderStamp: 721, actor: { id }, observer: { phase: 0 } }) }, 1235),
  { turn: 444, renderStamp: 721, actor: { id: 1235 }, observer: { phase: 0 } })
  assert.deepEqual(await sampleFollowerCorpseFailure({ isClosed: () => false, evaluate: () => new Promise(() => {}) }, 1235, 5),
    { unavailable: 'Failure read deadline' })
  assert.deepEqual(await sampleFollowerCorpseFailure({ isClosed: () => true }, 1235),
    { unavailable: 'Page already closed' })
})

test('pre-close snapshot only reads bounded gameplay and observer scalars', () => {
  const actor = Object.freeze({ id: 1235, hp: 11, target: 20, secret: 'not recorded' })
  const world = Object.freeze({ turn: 442, paused: false, units: Object.freeze([actor]) })
  const oldWindow = globalThis.window
  globalThis.window = {
    testStore: { getWorld: () => world }, testSceneRef: { current: { renderer: { info: { render: { frame: 712 } } } } },
    __pndCorpseObservation: { result: { samples: [{ phase: 0, turn: 441, png: 'not copied' }], death: {},
      effectId: 22, error: 'x'.repeat(400) } },
  }
  try {
    assert.deepEqual(readFollowerCorpseFailureState(1235), { turn: 442, paused: false, renderStamp: 712,
      actor: { id: 1235, hp: 11, target: 20 }, observer: { phase: 0, sampleTurn: 441,
        effectId: 22, sampleCount: 1, hasDeath: true, error: 'x'.repeat(256) } })
  } finally { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow }
})

test('complete synthetic evidence requires combat death, five visible phase crops and actual current load/resume', () => {
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

test('good original phase 1 cannot mask a missing or blank first running loaded phase 1', () => {
  const cases = [
    [loaded => { loaded.crops.shift() }, /Exactly one loaded corpse phase 1 crop required/],
    [loaded => { loaded.crops[0].opaqueColors = 0 }, /Nonblank loaded corpse phase 1 crop required/],
    [loaded => { loaded.samples[0].cropFile = null }, /first running loaded corpse phase 1/],
    [loaded => { loaded.samples.unshift({ ...loaded.samples[0], cropFile: null }) }, /first running loaded corpse phase 1/],
  ]
  for (const [breakLoaded, expected] of cases) {
    const report = observation()
    assert.equal(report.segments[0].crops.find(crop => crop.phase === 1).opaqueColors, 2)
    breakLoaded(report.segments[1])
    assert.throws(() => validateFollowerCorpseObservation(report), expected)
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
  let copies = 0, encodes = 0, readbacks = 0, pixels = 1
  const world = { turn: 98, paused: false, speed: 1, effects: [],
    units: [{ id: 1, kind: 'brave', team: 'blue', hp: 1.3, x: 20, z: 20, heading: Math.PI, fight: { group: 4, opponent: 20, action: 'ready' } }] }
  const rect = { left: 200, top: 0, width: 760, height: 720 }
  const canvas = { width: 760, height: 720, isConnected: true, getBoundingClientRect: () => rect }
  const group = { visible: true, position: {}, userData: { layers: [{ visible: true, userData: { piece: 22 } }], bounds: { left: -8, top: -24, right: 8, bottom: 0 } } }
  const prototype = {
    renderSceneFrame() { this.renderer.info.render.frame++; return 'stock-render' },
    dispose() { this.disposedByStock = true },
  }
  const scene = Object.assign(Object.create(prototype), { world, renderer: { domElement: canvas, getRenderTarget: () => null, info: { render: { frame: 200 } } },
    gameClock: { animationFrame: 100, animationTime: 1 }, camera: {}, cameraBearing: 0x380 * Math.PI / 1024,
    fxMeshes: new Map([[2, group]]), view: { screen: () => ({ x: 0, y: 0, z: 0 }), painter: { source: () => ({ object: 2 }) } } })
  const replacements = { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
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
    assert.equal(scene.renderSceneFrame(), 'stock-render')
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

test('scene adapter detaches after stock disposal and does not wrap the prototype', () => {
  withObserver(({ scene, observation }) => {
    const original = Object.getPrototypeOf(scene).renderSceneFrame
    installFollowerCorpseObserver({ actorId: 1 })
    assert.notEqual(scene.renderSceneFrame, original)
    assert.throws(() => installFollowerCorpseObserver({ actorId: 1 }), /unwrapped/)
    scene.dispose()
    assert.equal(scene.disposedByStock, true)
    assert.equal(scene.renderSceneFrame, original)
    assert.equal(Object.hasOwn(scene, 'dispose'), false)
    assert.match(observation().result.error, /lost its bound Scene/)
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

test('independent corpse scenario keeps the measured phase caps and committed-save boundary', async () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const episode = readFileSync(new URL('../scripts/tutorial-browser/follower-corpse.mjs', import.meta.url), 'utf8')
  assert.ok(run.indexOf('receipt.gameplayFrames = await') < run.indexOf('receipt.meleeAttack = await'))
  const corpseBranch = run.split("} else if (selectedScenario === 'follower-corpse') {")[1].split("} else if (['profile-recovery'")[0]
  assert.match(corpseBranch, /await context.close\(\); context = undefined; page = undefined/)
  assert.match(corpseBranch, /receipt.followerCorpse = await/)
  assert.doesNotMatch(corpseBranch, /meleeAttack|gameplayFrames/)
  assert.equal(browserCapMs('follower-corpse'), 180000)
  assert.deepEqual(followerCorpseBudgetMs, { openingAndOrder: 80000, combatAndSave: 65000, loadAndVerify: 25000 }); assert.equal(meleeAttackLimitMs, 75000)
  assert.equal(browserCapMs('gameplay-frames'), 180000)
  assert.equal(episode.includes('activateFollowerCorpseButton'), false)
  assert.ok(episode.includes("const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())"))
  assert.ok(episode.indexOf('budget.beginCombat({ beforeAttack:') > episode.indexOf('await pacing.release()'))
  assert.ok(episode.indexOf('budget.beginCombat({ beforeAttack:') < episode.indexOf("phase('ordinary-combat')"))
  assert.match(episode, /watchdogClose = sampleFailure\(\)\.finally\(\(\) => context\.close/)
  assert.ok(episode.indexOf('budget.beginLoad(report.checkpoint)') > episode.indexOf('assert.deepEqual(report.checkpoint.committedCorpse.effect'))
  assert.ok(episode.indexOf('budget.beginLoad(report.checkpoint)') < episode.indexOf("await button('Back'); await button('Load Game')"))
  assert.ok(episode.indexOf('budget.complete()') > episode.indexOf("path: resolve(output, 'follower-corpse-context.png')"))
  const stop = Error('Stop before browser creation')
  await assert.rejects(followerCorpse({ browser: { async newContext(options) {
    assert.deepEqual(options, { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 }); throw stop
  } } }), error => error === stop)
})

test('corpse startup settles modal opening before unchanged natural-turn readiness', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/follower-corpse.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("await action('Settle opening messages and introduction', async () =>")
  const next = source.indexOf("phase('public-combat-setup')", start)
  assert.ok(start >= 0 && next > start)
  assert.match(source.slice(start, next), /settleFollowerCorpseOpening/)
  assert.match(source.slice(start, next), /advance: pacing.advanceOpeningFrame/)
  assert.doesNotMatch(source.slice(start, next), /waitForFunction/)
})
