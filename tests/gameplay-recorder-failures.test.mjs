import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

// Execute the complete maintained recorder, observer and schedule declarations.
// Browser, resource probes, clocks, validators and output I/O are supplied control
// boundaries. These fixtures do not record gameplay or qualify resource evidence.
const source = readFileSync(new URL('../scripts/tutorial-browser/gameplay-frames.mjs', import.meta.url), 'utf8'),
  planSource = readFileSync(new URL('../scripts/tutorial-browser/gameplay-frame-evidence.mjs', import.meta.url), 'utf8'),
  planStart = planSource.indexOf('export const gameplayFramePlan ='),
  planEnd = planSource.indexOf('\n\nexport const gameplayFrameLimits', planStart)
assert.ok(planStart >= 0 && planEnd > planStart)
const plan = runInNewContext(planSource.slice(planStart, planEnd).replace('export const', 'const') + '\n;gameplayFramePlan')
const declarations = source.replace(/^import .*\n/gm, '').replace(/^export function /gm, 'function ')
  .replace('export default async function (', 'async function runGameplayFrames(')
assert.ok(!declarations.includes('import '), 'all module dependencies must be supplied explicitly')
assert.equal((declarations.match(/async function runGameplayFrames\(/g) ?? []).length, 1)
const values = [undefined, null, false, 0, NaN, '', 0n, new Error('primary error')]
const named = name => ({ [name]: function () {} })[name]

function fixture(options = {}) {
  const events = [], saved = [], attempts = [], keyUps = new Map()
  let clock = 0, turn = 0, paused = false
  const owns = key => Object.hasOwn(options, key)
  const raise = key => { if (owns(key)) throw options[key] }
  const observe = () => ({ timestampMs: ++clock, timeOriginUnixMs: 10000, level: 2,
    turn: ++turn, paused, inputMask: 0, speed: 1, sameScene: true,
    camera: { x: 1, y: 1, angle: 1 }, viewport: plan.viewport, visibility: 'visible' })
  const locator = () => ({ waitFor: async () => {}, focus: async () => {}, isVisible: async () => false,
    getByRole: (_, { name }) => button(name) })
  const button = name => ({ ...locator(), click: async () => {
    events.push('click:' + String(name))
    if (name === 'Game settings') paused = true
    if (name === 'Yes') paused = false
  } })
  const heapSession = { detach: async function () {
    assert.equal(this, heapSession)
    events.push('heap:detach'); raise('heapCleanup')
  } }
  const page = {
    locator: () => locator(), getByRole: (_, { name }) => button(name),
    isClosed: () => { events.push('page:isClosed'); raise('closedCheck'); return !!options.pageClosed },
    setViewportSize: async () => { events.push('viewport'); raise('primary') },
    goto: async () => {}, waitForTimeout: async () => {}, screenshot: async () => {},
    context: () => ({ newCDPSession: async () => { events.push('heap:create'); return heapSession } }),
    waitForFunction: async () => ({ jsonValue: async () => ({ level: 2, action: 'none' }), dispose: async () => {} }),
    waitForEvent: async () => ({ suggestedFilename: () => 'populous-frames-fixture.json', saveAs: async () => {} }),
    mouse: { move: async () => {} },
    keyboard: {
      press: async key => { if (key === 'Escape') paused = false },
      down: async key => { events.push('key:down:' + key); raise('cameraInput') },
      up: async key => {
        const occurrence = (keyUps.get(key) ?? 0) + 1
        keyUps.set(key, occurrence); events.push(`key:up:${key}:${occurrence}`)
        const cleanup = owns('cameraInput') || occurrence >= 2
        if (cleanup) raise(key === 'ArrowRight' ? 'rightCleanup' : 'panCleanup')
      },
    },
    evaluate: async fn => {
      const text = String(fn)
      if (text.includes('delete window.testScene;')) {
        events.push('observer:cleanup'); raise('observerCleanup'); return
      }
      if (fn.name === 'observeGameplayFramePhase') return observe()
      if (fn.name === 'observeGameplayResources') return { ...observe(), sceneUuid: 'scene-fixture' }
      if (['m2NativePointerTarget', 'm2HudPoint'].includes(fn.name)) return { x: 900, y: 400 }
      if (text.includes('performance.now()')) return ++clock
    },
  }
  const dependencies = { assert, resolve, plan, gameplayFrameLimits: [],
    performance: { now: () => ++clock },
    writeFileSync: (path, json) => {
      if (!path.endsWith('gameplay-frames.json')) return
      const value = JSON.parse(json); attempts.push(value)
      if (value.status !== 'running') { events.push('report:final-save'); raise('finalSave') }
      saved.push(value)
    },
    readFileSync: () => '{}',
    bindGame: async () => {}, showAllMissions: async () => {},
    assertResourceScenario: () => {}, assertResourceLive: () => {},
    summarizeGameplayPhase: () => ({ rawSha256: 'fixture', analysis: { sampleCount: 16 }, turnsAdvanced: 1, work: {} }),
    gameplayThreeCycleProfile: 'three-cycle-v1',
    captureGameplayMatchedHeapSample: async () => { events.push('heap:sample'); raise('heapPrimary') },
    captureGameplayThreeCycleHeapSample: async () => { throw new Error('three-cycle control was not requested') },
  }
  for (const name of ['registerRetiredGameplayOwnership', 'sampleRetiredGameplayOwnership', 'clearRetiredGameplayOwnership',
    'm2NativePointerTarget', 'm2HudPoint', 'm2RouteReady', 'm2StartupReady', 'observeGameplayResources',
    'captureRetiredGameplayScene', 'summarizeResourceRestart', 'validateGameplayMatchedHeapProbe',
    'summarizeGameplayMatchedWorkload', 'validateGameplayThreeCycleHeapProbe', 'summarizeGameplayThreeCycleWorkload'])
    dependencies[name] = named(name)
  for (const name of ['gameplayMatchedHeapPolicy', 'gameplayMatchedHeapLimits', 'gameplayMatchedProtocol',
    'gameplayHeapResourceLimits', 'gameplayThreeCycleHeapPolicy', 'gameplayThreeCycleHeapLimits',
    'gameplayThreeCycleProtocol', 'gameplayThreeCycleResourceLimits']) dependencies[name] = {}
  const run = runInNewContext(declarations + '\n;runGameplayFrames', dependencies)
  return { events, saved, attempts, run: () => run({ page, url: 'fixture://game', output: '/fixture-output',
    expectedRevision: 'a'.repeat(40), resourceLifecycle: !!options.resourceLifecycle }) }
}

async function rejection(run) {
  let rejected = false, reason
  try { await run() } catch (error) { rejected = true; reason = error }
  assert.equal(rejected, true, 'the recorder must reject, including falsey reasons')
  return reason
}
function sameReasons(error, expected) {
  assert.equal(error?.name, 'AggregateError')
  assert.equal(error.errors.length, expected.length)
  expected.forEach((reason, i) => assert.ok(Object.is(error.errors[i], reason), `reason ${i}`))
}

test('ordinary supplied success preserves phase order and releases only both camera keys', async () => {
  const f = fixture(), report = await f.run()
  assert.equal(report.status, 'passed')
  assert.deepEqual([...report.phases].map(p => p.name), [...plan.phases].map(p => p.name))
  assert.equal(f.saved.at(-1).status, 'passed')
  assert.deepEqual(f.events.filter(e => e.startsWith('key:up:')),
    ['key:up:ArrowRight:1', 'key:up:w:1', 'key:up:ArrowRight:2', 'key:up:w:2'])
  assert.ok(!f.events.includes('observer:cleanup'))
  assert.ok(!f.events.includes('heap:detach'))
})

for (const [index, reason] of values.entries()) {
  test(`primary rejection ${index} retains identity and its recorded reason`, async () => {
    const f = fixture({ primary: reason })
    assert.ok(Object.is(await rejection(f.run), reason))
    assert.equal(f.saved.at(-1).status, 'failed')
    assert.equal(f.saved.at(-1).failure.message, String(reason))
    assert.equal(f.saved.at(-1).failure.stack, reason?.stack)
  })
  test(`observer rejection ${index} retains primary failure and final reporting`, async () => {
    const primary = new Error('scenario'), f = fixture({ primary, observerCleanup: reason, resourceLifecycle: true })
    sameReasons(await rejection(f.run), [primary, reason])
    assert.equal(f.saved.at(-1).failure.message, String(primary))
    assert.equal(f.saved.at(-1).resourceObserverCleanupFailure, String(reason))
    assert.deepEqual(f.events.slice(-3), ['page:isClosed', 'observer:cleanup', 'report:final-save'])
  })
  test(`heap rejection ${index} retains primary and observer failures in order`, async () => {
    const primary = new Error('heap sample'), observer = new Error('observer cleanup'),
      f = fixture({ heapPrimary: primary, observerCleanup: observer, heapCleanup: reason, resourceLifecycle: true })
    sameReasons(await rejection(f.run), [primary, observer, reason])
    assert.equal(f.saved.at(-1).failure.message, String(primary))
    assert.equal(f.saved.at(-1).heapObserverCleanupFailure, String(reason))
    assert.deepEqual(f.events.slice(-4), ['page:isClosed', 'observer:cleanup', 'heap:detach', 'report:final-save'])
  })
  test(`final save rejection ${index} cannot replace a primary reason`, async () => {
    const primary = new Error('scenario'), f = fixture({ primary, finalSave: reason })
    sameReasons(await rejection(f.run), [primary, reason])
    assert.equal(f.attempts.at(-1).status, 'failed')
  })
  test(`camera rejection ${index} still attempts both owned key releases`, async () => {
    const right = new Error('right release'), pan = new Error('pan release'),
      f = fixture({ cameraInput: reason, rightCleanup: right, panCleanup: pan })
    sameReasons(await rejection(f.run), [reason, right, pan])
    const record = f.saved.at(-1).phases.find(p => p.name === 'camera-world')
    assert.equal(record.cameraFailure.message, String(reason))
    assert.deepEqual(record.cameraKeyReleaseFailures.map(e => e.key), ['ArrowRight', 'w'])
    assert.deepEqual(f.events.filter(e => e.startsWith('key:up:')), ['key:up:ArrowRight:1', 'key:up:w:1'])
  })
  test(`lone camera key-release rejection ${index} keeps its exact identity`, async () => {
    const f = fixture({ rightCleanup: reason })
    assert.ok(Object.is(await rejection(f.run), reason))
    assert.ok(f.events.includes('key:up:w:2'), 'second key release must still be attempted')
  })
  test(`lone final-save rejection ${index} keeps its exact identity`, async () => {
    const f = fixture({ finalSave: reason })
    assert.ok(Object.is(await rejection(f.run), reason))
  })
}

test('closed pages skip observer evaluation but still detach an owned heap session', async () => {
  const primary = new Error('heap sample'), f = fixture({ heapPrimary: primary, pageClosed: true, resourceLifecycle: true })
  assert.equal(await rejection(f.run), primary)
  assert.ok(!f.events.includes('observer:cleanup'))
  assert.ok(f.events.includes('heap:detach'))
})

test('failed closed-state lookup still attempts heap detach and final reporting', async () => {
  const primary = new Error('heap sample'), closed = new Error('closed lookup'),
    f = fixture({ heapPrimary: primary, closedCheck: closed, resourceLifecycle: true })
  sameReasons(await rejection(f.run), [primary, closed])
  assert.ok(f.events.includes('heap:detach'))
  assert.equal(f.saved.at(-1).resourceObserverCleanupFailure, String(closed))
})

test('four independent terminal failures remain ordered without flattening original AggregateError', async () => {
  const primary = new AggregateError([new Error('inner')], 'existing aggregate'),
    observer = undefined, heap = null, save = false,
    f = fixture({ heapPrimary: primary, observerCleanup: observer, heapCleanup: heap, finalSave: save, resourceLifecycle: true })
  sameReasons(await rejection(f.run), [primary, observer, heap, save])
  assert.equal(f.attempts.at(-1).failure.message, String(primary))
})

const hostileReasons = [
  ['null prototype', () => ({ reason: Object.create(null), message: '[Unprintable thrown value]' })],
  ['throwing conversion', () => ({ reason: { [Symbol.toPrimitive]() { throw null } }, message: '[Unprintable thrown value]' })],
  ['revoked proxy', () => {
    const proxy = Proxy.revocable({}, {}); proxy.revoke()
    return { reason: proxy.proxy, message: '[Unprintable thrown value]' }
  }],
  ['throwing stack', () => ({ reason: { get stack() { throw new Error('stack getter') } }, message: '[object Object]' })],
  ['BigInt stack', () => ({ reason: { stack: 1n }, message: '[object Object]' })],
  ['circular stack', () => {
    const stack = {}; stack.self = stack
    return { reason: { stack }, message: '[object Object]' }
  }],
]
async function boxedRejection(run) {
  try { await run() } catch (reason) { return { reason } }
  assert.fail('the recorder must reject')
}
for (const [name, create] of hostileReasons) {
  test(`primary ${name} retains identity and cannot prevent cleanup or report serialization`, async () => {
    const { reason, message } = create(), f = fixture({ heapPrimary: reason, resourceLifecycle: true })
    assert.ok(Object.is((await boxedRejection(f.run)).reason, reason))
    assert.deepEqual(f.events.slice(-4), ['page:isClosed', 'observer:cleanup', 'heap:detach', 'report:final-save'])
    assert.deepEqual(f.saved.at(-1).failure, { message })
  })
  test(`observer ${name} cannot prevent heap cleanup or final reporting`, async () => {
    const { reason, message } = create(), primary = new Error('heap sample'), heap = new Error('heap cleanup'),
      f = fixture({ heapPrimary: primary, observerCleanup: reason, heapCleanup: heap, resourceLifecycle: true })
    sameReasons(await rejection(f.run), [primary, reason, heap])
    assert.deepEqual(f.events.slice(-4), ['page:isClosed', 'observer:cleanup', 'heap:detach', 'report:final-save'])
    assert.equal(f.saved.at(-1).resourceObserverCleanupFailure, message)
  })
  test(`camera input ${name} cannot prevent either key release`, async () => {
    const { reason, message } = create(), f = fixture({ cameraInput: reason })
    assert.ok(Object.is((await boxedRejection(f.run)).reason, reason))
    assert.deepEqual(f.events.filter(e => e.startsWith('key:up:')), ['key:up:ArrowRight:1', 'key:up:w:1'])
    const record = f.saved.at(-1).phases.find(p => p.name === 'camera-world')
    assert.deepEqual(record.cameraFailure, { message })
  })
  test(`camera release ${name} cannot prevent the other owned key release`, async () => {
    const { reason, message } = create(), primary = new Error('camera input'), pan = new Error('pan release'),
      f = fixture({ cameraInput: primary, rightCleanup: reason, panCleanup: pan })
    sameReasons(await rejection(f.run), [primary, reason, pan])
    assert.deepEqual(f.events.filter(e => e.startsWith('key:up:')), ['key:up:ArrowRight:1', 'key:up:w:1'])
    const record = f.saved.at(-1).phases.find(p => p.name === 'camera-world')
    assert.equal(record.cameraKeyReleaseFailures[0].message, message)
  })
}

test('primary stack is read once and cleanup descriptions never read a stack getter', async () => {
  let primaryReads = 0, cleanupReads = 0
  const primary = { get stack() { assert.equal(++primaryReads, 1); return 'single stack read' } },
    cleanup = { get stack() { cleanupReads++; throw new Error('must not inspect cleanup stack') } },
    f = fixture({ heapPrimary: primary, observerCleanup: cleanup, resourceLifecycle: true })
  sameReasons(await rejection(f.run), [primary, cleanup])
  assert.equal(primaryReads, 1)
  assert.equal(cleanupReads, 0)
  assert.equal(f.saved.at(-1).failure.stack, 'single stack read')
})
