import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { captureSnapshotArmWitness, armWitnessLimits } from '../scripts/browser-performance/snapshot-arm-witness-core.mjs'
const commit = 'a'.repeat(40), generator = 'b'.repeat(64), codec = 'c'.repeat(64)
function fixture() {
  let time = 0, closed = false, closes = 0
  const files = new Map(), timers = new Map(), calls = []
  const events = new Map()
  const page = { setDefaultTimeout: n => assert.equal(n, 15000), on: (name, fn) => events.set(name, fn) }
  const browser = { contexts: () => [], isConnected: () => !closed,
    close: async () => { closes++; closed = true },
    newContext: async () => ({ newPage: async () => page }) }
  const options = { browser, url: 'http://127.0.0.1:5198', source: { commit }, expectedRevision: commit,
    expectedGeneratorSha256: generator, expectedCodecSha256: codec, expectedCheckpointVersion: 5 }
  const leaves = { checkpointVersion: 5, now: () => time,
    schedule: (f, ms) => { timers.set(f, ms); return f }, cancel: f => timers.delete(f),
    createFixture: async () => { calls.push('produce'); return { receipt: { sourceCommit: commit, generatorSha256: generator, codecSha256: codec } } },
    validateFixture: () => ({ transferText: '{"version":5}', expectedText: '{"world":true}' }),
    loadSnapshot: async () => { calls.push('public-load'); return { status: 'ready' } },
    observe: async () => { calls.push('observe'); return '{"unqualified":true}' },
    writeExclusive: (name, text) => { if (files.has(name)) throw Error('exists'); files.set(name, text) },
  }
  return { options, leaves, files, timers, calls, events, closes: () => closes, setTime: t => time = t }
}
test('one exact arm produces original records, public Loads and retains two non-admitting witnesses', async () => {
  const f = fixture(), r = await captureSnapshotArmWitness(f.options, f.leaves)
  assert.equal(r.status, 'observed-unqualified'); assert.equal(r.comparisonEligible, false); assert.equal(r.interpretationEligible, false)
  assert.deepEqual(f.calls, ['produce', 'public-load', 'observe', 'observe']); assert.equal(f.files.size, 7)
  assert.equal(f.files.get('arm-snapshot-transfer.json'), '{"version":5}'); assert.equal(f.closes(), 1); assert.equal(f.timers.size, 0)
})
for (const field of ['expectedRevision', 'expectedGeneratorSha256', 'expectedCodecSha256', 'expectedCheckpointVersion']) {
  test(`wrong ${field} rejects and closes owner`, async () => {
    const f = fixture(); f.options[field] = field.endsWith('Version') ? 4 : 'd'.repeat(field === 'expectedRevision' ? 40 : 64)
    await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves)); assert.equal(f.closes(), 1)
    assert.equal(JSON.parse(f.files.get('arm-witness.json')).status, 'failed')
  })
}
test('preflight foreign existing context closes but does not generate', async () => {
  const f = fixture(); f.options.browser.contexts = () => [{}]
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves)); assert.deepEqual(f.calls, []); assert.equal(f.closes(), 1)
})
test('falsey primary survives cleanup failure and final writer failure', async () => {
  const f = fixture(); f.leaves.createFixture = async () => { throw 0 }; f.options.browser.close = async () => { throw Error('close') }; f.leaves.writeExclusive = () => { throw Error('write') }
  let caught = false; try { await captureSnapshotArmWitness(f.options, f.leaves) } catch (e) { caught = true; assert.equal(e, 0) }; assert.ok(caught)
})
test('successful operation cannot swallow cleanup failure', async () => {
  const f = fixture(); const error = Error('close'); f.options.browser.close = async () => { throw error }
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), e => e === error)
})
test('quota rejects before oversized exclusive write', async () => {
  const f = fixture(); f.leaves.observe = async () => 'x'.repeat(armWitnessLimits.fileBytes + 1)
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), /quota/)
  assert.equal(f.files.has('arm-endpoint-first.json'), false); assert.equal(f.closes(), 1)
})
test('timeout closes browser and late producer cannot mutate finalized evidence', async () => {
  const f = fixture(); let release
  f.leaves.createFixture = () => new Promise(resolve => release = resolve)
  const run = captureSnapshotArmWitness(f.options, f.leaves)
  await new Promise(resolve => setImmediate(resolve))
  const expire = [...f.timers].find(([, ms]) => ms === 60000)[0]; f.setTime(60000); expire()
  await assert.rejects(run, /deadline/); const saved = [...f.files]
  release({ receipt: { sourceCommit: commit, generatorSha256: generator, codecSha256: codec } })
  await new Promise(resolve => setImmediate(resolve)); assert.deepEqual([...f.files], saved); assert.equal(f.closes(), 1)
})
test('source identity snapshot is not changed by an asynchronous producer', async () => {
  const f = fixture(); const original = f.leaves.createFixture
  f.leaves.createFixture = async args => { assert.deepEqual(args.source, { commit }); f.options.source.commit = 'd'.repeat(40); return original() }
  const r = await captureSnapshotArmWitness(f.options, f.leaves); assert.equal(r.sourceCommit, commit)
})
test('strict public Load readiness is required before witness', async () => {
  const f = fixture(); f.leaves.loadSnapshot = async () => ({ status: 'failed' })
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), /public Load/); assert.equal(f.files.has('arm-endpoint-first.json'), false)
})
// Actual synchronous observer body, with data-only codec and supplied Scene.
const adapter = readFileSync(new URL('../scripts/browser-performance/snapshot-arm-witness.mjs', import.meta.url), 'utf8')
const start = adapter.indexOf('export function readArmEndpoint('), end = adapter.indexOf('\nconst observe =', start)
assert.ok(start >= 0 && end > start)
function endpoint(world) {
  const scene = { world, renderer: { domElement: { isConnected: true, width: 1440, height: 1000 } },
    started: true, disposed: false, modalSuspended: false, cameraPosition: world.cameras?.tribes[0] ?? { x: 5 }, gameClock: { animationTime: 7, animationFrame: 8 },
    view: { projection: {}, config: {} }, camera: { matrixWorld: { elements: [1] }, projectionMatrix: { elements: [2] } } }
  const window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  const fn = vm.runInNewContext(adapter.slice(start, end).replace('export ', '') + '\nreadArmEndpoint', {
    window, document: { visibilityState: 'visible' }, innerWidth: 1440, innerHeight: 1000, devicePixelRatio: 1,
    performance: { now: () => 10, timeOrigin: 100 },
  })
  return { read: codec => fn(codec), scene, window }
}
test('base observer retains original World/light/Scene clocks without mutation', () => {
  const world = { paused: true, lightView: { x: 9 }, lights: [], lightRevision: 3 }; const before = JSON.stringify(world)
  const e = endpoint(world); let captured
  const result = e.read(v => { captured = v; return v })
  assert.equal(captured.world, world); assert.equal(captured.lighting.effectiveInput, world.lightView)
  assert.equal(captured.scene.animationTime, 7); assert.equal(JSON.stringify(world), before); assert.ok(result)
})
test('head observer retains raw owners and applies exact non-mutating displayed-light correction', () => {
  const world = { paused: true, manaWorld: { playerTribe: 0 }, cameras: { version: 1, phase: 'idle', tribes: [{ x: 65535, y: 0, angle: 2047 }], held: [{ x: 2, y: -1, angle: 2 }] } }
  const before = JSON.stringify(world), e = endpoint(world); let captured; e.read(v => { captured = v; return v })
  assert.equal(captured.scene.cameraPosition, world.cameras.tribes[0]); assert.deepEqual(JSON.parse(JSON.stringify(captured.lighting.effectiveInput)), { x: 1, y: 65535, angle: 1 }); assert.equal(JSON.stringify(world), before)
})
test('observer owner change during synchronous codec is rejected', () => {
  const world = { paused: true }, e = endpoint(world)
  assert.throws(() => e.read(v => { e.window.testSceneRef.current = {}; return v }), /owner changed/)
})

for (const [name, now] of [['throwing', () => { throw 0 }], ['NaN', () => NaN], ['infinite', () => Infinity]]) {
  test(`invalid initial ${name} clock still closes transferred browser`, async () => {
    const f = fixture(); f.leaves.now = now
    let caught = false; try { await captureSnapshotArmWitness(f.options, f.leaves) } catch { caught = true }
    assert.ok(caught); assert.equal(f.closes(), 1); assert.equal(JSON.parse(f.files.get('arm-witness.json')).status, 'failed')
  })
}
test('backward clock rejects before public Load and preserves cleanup', async () => {
  const f = fixture(); f.setTime(10); const original = f.leaves.createFixture
  f.leaves.createFixture = async args => { const r = await original(args); f.setTime(9); return r }
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), /clock/); assert.equal(f.closes(), 1); assert.equal(f.calls.includes('public-load'), false)
})
test('cleanup clock failure cannot replace falsey primary or skip close', async () => {
  const f = fixture(); f.leaves.createFixture = async () => { f.leaves.now = () => NaN; f.setTime(NaN); throw false }
  let caught = false; try { await captureSnapshotArmWitness(f.options, f.leaves) } catch (e) { caught = true; assert.equal(e, false) }
  assert.ok(caught); assert.equal(f.closes(), 1); assert.equal(JSON.parse(f.files.get('arm-witness.json')).status, 'failed')
})
for (const event of ['pageerror', 'crash', 'console']) {
  test(`actual runtime ${event} blocks successful public Load`, async () => {
    const f = fixture(); f.leaves.loadSnapshot = async () => {
      const emit = f.events.get(event); if (emit) emit(event === 'console' ? { type: () => 'error', text: () => 'runtime failure' } : 'runtime failure')
      return { status: 'ready' }
    }
    await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), /runtime errors/); assert.equal(f.closes(), 1)
  })
}
test('late pending producer is not full cleanup even after browser disconnect', async () => {
  const f = fixture(); f.leaves.createFixture = () => new Promise(() => {})
  const run = captureSnapshotArmWitness(f.options, f.leaves); await new Promise(resolve => setImmediate(resolve))
  const expire = [...f.timers].find(([, ms]) => ms === 60000)[0]; f.setTime(60000); expire()
  await assert.rejects(run, /deadline/)
  const r = JSON.parse(f.files.get('arm-witness.json')); assert.equal(r.browserDisconnected, true); assert.equal(r.operationSettled, false); assert.equal(r.cleanupVerified, false)
})
test('whole-owner final-write overrun throws and retains failure tombstone', async () => {
  const f = fixture(), write = f.leaves.writeExclusive
  f.leaves.writeExclusive = (name, text) => { write(name, text); if (name === 'arm-witness.json') f.setTime(62001) }
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves), /whole-owner/)
  assert.equal(JSON.parse(f.files.get('arm-witness-finalization-failure.json')).status, 'failed')
})
for (const change of ['store', 'renderer', 'camera', 'clock', 'disposed']) {
  test(`observer rejects ${change} handoff during encoding`, () => {
    const world = { paused: true }, e = endpoint(world)
    assert.throws(() => e.read(v => {
      if (change === 'store') e.window.testStore = { getWorld: () => world }
      if (change === 'renderer') e.scene.renderer = { domElement: e.scene.renderer.domElement }
      if (change === 'camera') e.scene.camera = { ...e.scene.camera }
      if (change === 'clock') e.scene.gameClock = { ...e.scene.gameClock }
      if (change === 'disposed') e.scene.disposed = true
      return v
    }), /owner changed/)
  })
}
test('outer receipt observes exact fulfilled core ownership result', async () => {
  const f = fixture(), outer = {}; f.options.receipt = outer
  assert.equal(await captureSnapshotArmWitness(f.options, f.leaves), outer)
  assert.equal(outer.operationSettled, true); assert.equal(outer.browserDisconnected, true); assert.equal(outer.status, 'observed-unqualified')
})
test('outer receipt exposes falsey primary failure and final-write overrun', async () => {
  for (const finalWrite of [false, true]) {
    const f = fixture(), outer = {}; f.options.receipt = outer
    if (finalWrite) { const write = f.leaves.writeExclusive; f.leaves.writeExclusive = (name, text) => { write(name, text); if (name === 'arm-witness.json') f.setTime(62001) } }
    else f.leaves.createFixture = async () => { throw 0 }
    let caught = false; try { await captureSnapshotArmWitness(f.options, f.leaves) } catch (e) { caught = true; if (!finalWrite) assert.equal(e, 0) }
    assert.ok(caught); assert.equal(outer.status, 'failed'); assert.equal(outer.comparisonEligible, false)
  }
})
test('invalid frozen outer receipt cannot bypass transferred browser cleanup', async () => {
  const f = fixture(); f.options.receipt = Object.freeze({})
  await assert.rejects(captureSnapshotArmWitness(f.options, f.leaves)); assert.equal(f.closes(), 1)
})
