import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { armSnapshotPauseLatch, assertSnapshotAdmission, createSnapshotFixture, loadSnapshot,
  observeSnapshotState, snapshotSimulationIdentity, validateSnapshotFixture } from '../scripts/browser-performance/snapshot-setup.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: import.meta.dirname, encoding: 'utf8' }).trim() }
let fixture
const getFixture = async () => fixture ??= await createSnapshotFixture({ source })
function makeStore() {
  let world = { paused: false, turn: 0 }, listeners = new Set()
  const update = () => { for (const f of listeners) f() }
  return { getWorld: () => world, subscribe: f => { listeners.add(f); return () => listeners.delete(f) },
    replace: next => { world = next; update() }, change: f => { f(world); update() },
    listeners: () => listeners.size }
}

// Extract and execute both actual Home handlers, rather than assuming the old
// adjacent load/unpause spelling. Other page/DOM effects are supplied boundaries.
function homeCheckpointHandler(store) {
  const text = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const source = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const home = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'Home')
  const handlers = ['beginLoad', 'loadCheckpoint'].map(name => {
    const found = home.body.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
    assert.equal(found.length, 1, `unique actual Home ${name} handler`)
    return found[0].getText(source)
  })
  const effects = [], loadRequest = { current: null }
  const bindings = { store, loadRequest, menuSession: { current: null }, engine: { current: null }, audio: { current: null } }
  for (const name of ['setCheatsOpen', 'setDebugPicker', 'setResultInputCycles', 'cancelNearbyInput',
    'setSelectorOpen', 'setMenu', 'setReady', 'setError', 'setTab', 'setStartup'])
    bindings[name] = value => effects.push([name, value])
  const code = ts.transpileModule(handlers.join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const load = Function(...Object.keys(bindings), `${code}\nreturn loadCheckpoint`)(...Object.values(bindings))
  return { load, effects, loadRequest }
}

test('latch spans exact store replacement and actual Home forced-unpause contract', () => {
  const store = makeStore(), latch = armSnapshotPauseLatch(store, checkpointCodec)
  const restored = { paused: false, turn: 70 }, expected = JSON.stringify(checkpointCodec(restored))
  let loads = 0
  store.loadCheckpoint = () => { loads++; store.replace(restored); return true }
  const home = homeCheckpointHandler(store)
  home.load()
  assert.equal(loads, 1, 'the public Load handler uses the actual checkpoint boundary once')
  assert.equal(restored.paused, true)
  assert.deepEqual(latch.read(), { boundary: expected, failure: undefined, forcedUnpauses: 1, loaded: true, released: false })
  assert.deepEqual(home.loadRequest.current, { kind: 'checkpoint' })
  assert.ok(home.effects.some(([name, value]) => name === 'setResultInputCycles' && value === 0))
  assert.deepEqual(home.effects.at(-1), ['setStartup', 'playing'])
  latch.release(); latch.release()
  assert.equal(store.listeners(), 0)
  assert.deepEqual(Object.getOwnPropertyDescriptor(restored, 'paused'), { value: true, writable: true, enumerable: true, configurable: true })
  restored.paused = false
  assert.equal(restored.paused, false, 'No hook can suppress normal resume after setup')
})

test('actual Home failed checkpoint load cannot force resume or start replacement', () => {
  const store = makeStore(), original = store.getWorld()
  original.paused = true
  let loads = 0, changes = 0
  store.loadCheckpoint = () => { loads++; return false }
  store.change = () => { changes++; throw Error('failed Load must not mutate the live world') }
  const home = homeCheckpointHandler(store)
  home.load()
  assert.equal(loads, 1)
  assert.equal(changes, 0)
  assert.equal(store.getWorld(), original)
  assert.equal(original.paused, true)
  assert.equal(home.loadRequest.current, null)
  assert.deepEqual(home.effects, [['setCheatsOpen', false]])
})

test('latch cleanup before replacement and after codec exception never leaves subscription/accessor', () => {
  const early = makeStore(), earlyLatch = armSnapshotPauseLatch(early, checkpointCodec)
  earlyLatch.release(); early.replace({ paused: false, turn: 70 })
  assert.equal(early.getWorld().paused, false); assert.equal(early.listeners(), 0)
  const broken = makeStore(), brokenLatch = armSnapshotPauseLatch(broken, () => { throw Error('encoding failed') })
  broken.replace({ paused: false, turn: 70 })
  assert.match(brokenLatch.read().failure, /encoding failed/)
  brokenLatch.release()
  assert.equal(broken.listeners(), 0); assert.equal(broken.getWorld().paused, false)
  assert.ok('value' in Object.getOwnPropertyDescriptor(broken.getWorld(), 'paused'))
})

test('fixture is deterministic post-intro production-controller authoring and lossless migrated transport', async () => {
  const first = await getFixture(), second = await createSnapshotFixture({ source })
  assert.equal(JSON.stringify(first.transfer), JSON.stringify(second.transfer))
  assert.equal(JSON.stringify(first.expected), JSON.stringify(second.expected))
  assert.equal(first.receipt.snapshotSha256, second.receipt.snapshotSha256)
  assert.equal(first.receipt.turn, 70); assert.equal(first.receipt.time, 70 / 12)
  assert.equal(first.receipt.pendingTime, 0); assert.equal(first.receipt.focus.id, 54)
  assert.match(first.receipt.setup, /not a browser-recorded campaign save/)
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { migrateCheckpoint } = await loadSceneFixture()
  const decoded = checkpointCodec(first.transfer, true)
  const expected = migrateCheckpoint(migrateCheckpoint(structuredClone(decoded.world)))
  assert.deepEqual(checkpointCodec(expected), first.expected)
  assert.ok(expected.land.heights instanceof Int16Array)
  assert.ok(expected.buildingFootprints instanceof Map)
  assert.deepEqual(expected.selected, [54])
  const { cancelInteraction } = await loadSceneFixture()
  cancelInteraction(expected)
  assert.equal(sha(JSON.stringify(checkpointCodec(snapshotSimulationIdentity(expected)))), first.receipt.admittedSimulationSha256)
  assert.notEqual(first.receipt.loadedSimulationSha256, first.receipt.admittedSimulationSha256)
  assert.ok(expected.units.find(u => u.id === 54).native)
})

test('snapshot corruption, expected migration mismatch, and simulation hash mismatch fail closed', async () => {
  const f = await getFixture()
  assert.throws(() => validateSnapshotFixture({ ...f, transfer: { ...f.transfer, corrupt: true } }), /bytes\/hash mismatch/)
  assert.throws(() => validateSnapshotFixture({ ...f, expected: { ...f.expected, corrupt: true } }), /migration bytes\/hash mismatch/)
  assert.throws(() => validateSnapshotFixture({ ...f, receipt: { ...f.receipt, loadedSimulationSha256: '0'.repeat(64) } }), /state\/hash mismatch/)
  const w = checkpointCodec(f.expected, true)
  w.units[0].x++
  const expected = checkpointCodec(w)
  assert.throws(() => validateSnapshotFixture({ ...f, expected, receipt: { ...f.receipt,
    expectedLoadedSha256: sha(JSON.stringify(expected)) } }), /state\/hash mismatch/)
})

test('declared simulation identity includes gameplay RNG/units/terrain but not presentation clocks', async () => {
  const w = checkpointCodec((await getFixture()).expected, true)
  const signature = () => JSON.stringify(checkpointCodec(snapshotSimulationIdentity(w)))
  const before = signature()
  w.worshipAcquisition.clock.elapsed += 100
  w.cosmeticRandom.randomState++
  w.lightView.x++
  assert.equal(signature(), before, 'No unsupported whole-World freeze claim')
  w.randomState++
  assert.notEqual(signature(), before)
})

function readyState(f) {
  const focus = f.receipt.focus
  return { level: 2, paused: true, sameScene: true, sceneConnected: true, latchRemoved: true,
    visibility: 'visible', inputMask: 0, flybyActive: false, modalSuspended: false,
    simulationSha256: f.receipt.admittedSimulationSha256, selected: [], mode: null,
    viewport: { width: 1440, height: 1000, devicePixelRatio: 1, canvas: { left: 0, top: 0, width: 1440, height: 1000 } },
    camera: { position: { x: Math.round((focus.x + 8) * 256) & 65535, y: Math.round((-focus.z - 8) * 256) & 65535, angle: 0 },
      viewPoint: { x: focus.x, z: focus.z }, bearing: 0, preset: 0, zoom: 0, config: {}, presetMatches: true,
      projection: { width: 1440, height: 1000 }, transition: false, overview: false, pointerGesture: false,
      navigation: 0, motion: 0, resultMotion: 0, pointerButtons: 0, preview: null, keys: [],
      velocity: { turn: 0, forward: 0, side: 0 } }, unitsSha256: 'a', terrainSha256: 'b', timestampMs: 1 }
}
test('stable-pose admission rejects transition, drift, wrong focus, active input, live world, and remaining latch', async () => {
  const f = await getFixture(), first = readyState(f), next = { ...first, timestampMs: 2 }
  assertSnapshotAdmission(next, f, first)
  for (const [field, value] of [['transition', true], ['navigation', 16], ['motion', 1], ['bearing', 0.01], ['presetMatches', false]])
    assert.throws(() => assertSnapshotAdmission({ ...next, camera: { ...next.camera, [field]: value } }, f, first))
  for (const [field, value] of [['latchRemoved', false], ['paused', false], ['inputMask', 64], ['sameScene', false]])
    assert.throws(() => assertSnapshotAdmission({ ...next, [field]: value }, f, first))
  assert.throws(() => assertSnapshotAdmission({ ...next, camera: { ...next.camera, viewPoint: { x: 0, z: 0 } } }, f, first))
  assert.throws(() => assertSnapshotAdmission({ ...next, camera: { ...next.camera, config: { different: true } } }, f, first))
})

test('load exception after forced-unpause cleans the setup latch in finally', async () => {
  const f = await getFixture(), store = makeStore(), oldWindow = globalThis.window, oldDocument = globalThis.document
  let evaluations = 0
  const main = { __reactFiberTest: { memoizedState: { memoizedState: store, next: null }, return: null } }
  globalThis.window = {}
  globalThis.document = { querySelector: selector => selector === 'main' ? main : null }
  const button = { waitFor: async () => {}, click: async () => {
    store.replace(checkpointCodec(f.expected, true)); store.change(w => { w.paused = false })
    throw Error('public click failed after replacement')
  } }
  let menuWaits = 0
  const menu = { getByRole: () => button, waitFor: async () => { menuWaits++ },
    or: () => menu, filter: () => menu, first: () => menu }
  const page = { goto: async () => {}, reload: async () => {}, waitForFunction: async () => {},
    getByRole: (_role, { name }) => name === 'Opening logo' ? { isVisible: async () => false } : menu,
    isClosed: () => false,
    evaluate: async (fn, arg) => ++evaluations === 1 ? JSON.stringify(f.transfer) : fn(arg) }
  try {
    await assert.rejects(loadSnapshot({ page, url: 'http://localhost', fixture: f, expectedRevision: source.commit }), /public click failed/)
    assert.equal(menuWaits, 2, 'public Load follows observed menu readiness')
    assert.equal(store.listeners(), 0); assert.equal(window.__snapshotPauseLatch, undefined)
    assert.deepEqual(Object.getOwnPropertyDescriptor(store.getWorld(), 'paused'), { value: true, writable: true, enumerable: true, configurable: true })
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument
  }
})

test('page observer is a self-contained async read with real timestamp at the end and no clock/gameplay replacement', () => {
  const source = observeSnapshotState.toString()
  assert.match(source, /const codec = function checkpointCodec/)
  assert.match(source, /result\.timestampMs = performance\.now\(\);\s+return result/)
  assert.doesNotMatch(source, /cancelAnimationFrame|\.animate\(|\.tick\(|Object\.defineProperty\(w|w\.paused\s*=/)
})


test('real production store and clock cannot advance across load replacement or forced resume under latch', async () => {
  const f = await getFixture()
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { advanceGame, migrateCheckpoint } = await loadSceneFixture()
  const { createGameStore } = await import('../app/game-store.ts')
  const store = createGameStore()
  store.change(w => Object.assign(w, checkpointCodec(f.transfer, true).world))
  await store.saveCheckpoint()
  const latch = armSnapshotPauseLatch(store, checkpointCodec)
  try {
    assert.equal(store.loadCheckpoint(), true)
    const w = store.getWorld(), clock = { animationTime: 0, animationFrame: 0 }
    assert.deepEqual(JSON.parse(latch.read().boundary), checkpointCodec(migrateCheckpoint(checkpointCodec(f.transfer, true).world)))
    advanceGame(w, clock, 1)
    assert.equal(w.turn, 70)
    store.change(world => { world.paused = false })
    advanceGame(w, clock, 1)
    assert.equal(w.turn, 70); assert.equal(w.time, 70 / 12)
    assert.equal(w.pendingTime, 0); assert.equal(latch.read().forcedUnpauses, 1)
  } finally { latch.release() }
  assert.equal(store.getWorld().paused, true)
  assert.equal(Object.getOwnPropertyDescriptor(store.getWorld(), 'paused').get, undefined)
})


test('cleanup uncertainty preserves the original load failure without throwing inside finally', async () => {
  const f = await getFixture()
  let evaluations = 0
  const primary = Error('navigation failed'), cleanup = Error('cleanup context unavailable')
  const page = { goto: async () => { throw primary }, isClosed: () => false,
    evaluate: async () => { evaluations++; throw cleanup } }
  await assert.rejects(loadSnapshot({ page, url: 'http://localhost', fixture: f, expectedRevision: source.commit }), error => {
    assert.ok(error instanceof AggregateError)
    assert.match(error.message, /cleanup could not be verified/)
    assert.deepEqual(error.errors, [primary, cleanup])
    return true
  })
  assert.equal(evaluations, 1)
})

test('generated current snapshot is admitted by a fresh real store without rewriting persisted input', async () => {
  const f = await getFixture(), record = checkpointCodec(f.transfer, true),
    { withStorage } = await import('./support/profile-storage.mjs')
  assert.equal(record.version, 3)
  await withStorage({ latest: record }, async ({ freshStore, records, writes }) => {
    const store = await freshStore(), active = store.getWorld(), before = structuredClone(records)
    assert.equal(await store.restoreCheckpoint(), true)
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(store.getWorld(), active)
    assert.equal(store.loadCheckpoint(), true)
    assert.deepEqual(store.getWorld(), checkpointCodec(f.expected, true))
    assert.deepEqual(records, before)
    assert.deepEqual(writes, [])
  })
})

test('snapshot admission validates current route sidecars even when transport hashes are recomputed', async () => {
  const f = await getFixture()
  for (const change of [
    r => { r.version = 2 },
    r => { delete r.world.motionRoutes.references },
    r => { r.world.motionRoutes.references = new Uint16Array(401) },
    r => { r.world.motionRoutes.references = new Float64Array(400) },
    r => { r.world.motionRoutes.references[1]++ },
    r => { r.world.motionRoutes.references[1] = Number.MAX_SAFE_INTEGER },
    r => { r.world.motionRoutes.references = new Float64Array(r.world.motionRoutes.records.buffer, 0, 401) },
  ]) {
    const r = checkpointCodec(f.transfer, true)
    change(r)
    const transfer = checkpointCodec(r)
    assert.throws(() => validateSnapshotFixture({ ...f, transfer, receipt: { ...f.receipt,
      snapshotSha256: sha(JSON.stringify(transfer)) } }))
  }
  const w = checkpointCodec(f.expected, true), before = JSON.stringify(checkpointCodec(snapshotSimulationIdentity(w)))
  w.motionRoutes.references[1]++
  assert.notEqual(JSON.stringify(checkpointCodec(snapshotSimulationIdentity(w))), before,
    'admission identity binds authoritative route ownership, not only actor handles')
})
