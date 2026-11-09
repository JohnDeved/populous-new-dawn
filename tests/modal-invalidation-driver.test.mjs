import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import { installModalInvalidationObserver } from '../scripts/modal-invalidation/observer.mjs'
import { holdSkyResponse, verifiedImage } from '../scripts/modal-invalidation/response-gate.mjs'
import { comparePixels } from '../scripts/modal-invalidation/run.mjs'

// Synthetic controls exercise actual acquisition code, never browser evidence.
const png = Buffer.from('89504e470d0a1a0a11223344', 'hex')
const blob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const flush = () => new Promise(resolve => setImmediate(resolve))
function fakePage({ body = png, fetchError } = {}) {
  let handler, active, fulfill, aborted = 0, removed = false
  const response = { status: () => 200, url: () => 'http://localhost/original/sky.png', body: async () => body }
  const route = { fetch: async () => { if (fetchError) throw fetchError; return response },
    fulfill: async options => { fulfill = options }, abort: async () => { aborted++ } }
  return { async route(url, fn) { assert.equal(url, response.url()); handler = fn },
    async unroute(url, fn) { assert.equal(fn, handler); removed = true },
    async request() { active = handler(route); await flush() },
    done: () => active, result: () => ({ fulfill, aborted, removed }) }
}

test('exact response bytes are verified, delayed and fulfilled unchanged', async () => {
  const page = fakePage(), gate = await holdSkyResponse(page, 'http://localhost', blob(png))
  await page.request(); assert.equal(gate.record.status, 'held'); assert.equal(page.result().fulfill, undefined)
  gate.release(); await page.done()
  assert.equal(gate.record.status, 'fulfilled'); assert.equal(page.result().fulfill.body, png)
  assert.throws(() => gate.release()); assert.deepEqual(await gate.close(), { closed: true, pending: 0, failure: null })
  assert.equal(page.result().removed, true)
})
test('mismatched image bytes reject before any fulfillment', async () => {
  assert.throws(() => verifiedImage(png, '0'.repeat(40)))
  const page = fakePage(), gate = await holdSkyResponse(page, 'http://localhost', '0'.repeat(40))
  await page.request(); await page.done(); assert.equal(gate.record.status, 'failed')
  assert.equal(page.result().fulfill, undefined); assert.equal(page.result().aborted, 1)
  assert.ok((await gate.close()).failure)
})
test('failure cleanup aborts and drains an actually held route', async () => {
  const page = fakePage(), gate = await holdSkyResponse(page, 'http://localhost', blob(png))
  await page.request(); const result = await gate.close(); await page.done()
  assert.equal(result.pending, 0); assert.equal(page.result().fulfill, undefined)
  assert.equal(page.result().aborted, 1); assert.equal(page.result().removed, true)
})
test('fetch failure remains a failure, not an unavailable-success result', async () => {
  const page = fakePage({ fetchError: Error('network refused') }), gate = await holdSkyResponse(page, 'http://localhost', blob(png))
  await page.request(); await page.done(); assert.match(gate.record.failure, /network refused/)
  assert.equal(page.result().fulfill, undefined); await gate.close()
})

function fixture() {
  let now = 0, sequence = 0, isLost = false, revision = 0, submitted = 0, thrown = null
  const queue = new Map(), calls = [], listeners = new Map(), world = { turn: 12, time: 1,
    pendingTime: .1, paused: false, speed: 1, inputMask: 0, castingTribes: [{ cooldown: 8 }],
    shots: { blast: 3 }, manaTribes: [{ available: 2000 }], units: [], projectiles: [] }
  class Image {}
  let ready
  const texture = { texture: {}, status: 'loading', ready: new Promise(resolve => { ready = resolve }) }
  const extension = { loseContext() { isLost = true }, restoreContext() { isLost = false } }
  const gl = { drawingBufferWidth: 200, drawingBufferHeight: 100,
    isContextLost: () => isLost, getExtension: () => isLost ? null : extension,
    readPixels(x, y, w, h, format, type, bytes) { bytes.fill(255) } }
  const canvas = { isConnected: true,
    addEventListener(name, fn) { listeners.set(name, fn) }, removeEventListener(name, fn) { assert.equal(listeners.get(name), fn); listeners.delete(name) } }
  const original = function (...args) { calls.push({ receiver: this, args }); submitted++; if (thrown) throw thrown; return 'original-result' }
  const renderer = { domElement: canvas, getContext: () => gl, render: original }
  const scene = { world, gameClock: {}, renderer, scene: {}, camera: {}, modalSuspended: true }
  scene.skyBackdrop = { visible: true, parent: scene.scene,
    material: { visible: true, uniforms: { map: { value: texture.texture }, height: { value: .4 } } } }
  const unit = { id: 1, team: 'blue', kind: 'shaman', hp: 100, x: 2, z: 3,
    native: { state: 22, timer: 2, stamp: 3 }, casting: { remaining: 5 } }
  const shot = { id: 6, caster: 1, spell: 'blast', phase: 'windup', remaining: 5 }
  world.units.push(unit); world.projectiles.push(shot)
  const window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world },
    __pndModalInvalidationFixture: { revision: () => revision, skyAsset: () => texture } }
  vm.runInNewContext(`(${installModalInvalidationObserver.toString()})()`, {
    window, performance: { now: () => now }, HTMLImageElement: Image, Uint8Array,
    requestAnimationFrame(fn) { queue.set(++sequence, fn); return sequence },
    cancelAnimationFrame(id) { queue.delete(id) },
  })
  return { window, observer: window.modalInvalidationObserver, scene, world, renderer, original, calls, listeners,
    queue, gl, extension, get submitted() { return submitted }, setThrown(error) { thrown = error },
    draw() { return renderer.render(scene.scene, scene.camera) },
    tick(ms) { now += ms; const current = [...queue.values()]; queue.clear(); current.forEach(fn => fn(now)) },
    event(kind, trusted) { listeners.get(`webglcontext${kind}`)({ isTrusted: trusted }) },
    complete() { revision++; texture.status = 'ready'; texture.texture.image = Object.assign(new Image(),
      { complete: true, naturalWidth: 10, naturalHeight: 10, currentSrc: 'http://localhost/original/sky.png' }); ready(true) },
  }
}
test('wrapper calls original once and preserves receiver, return and thrown identity', () => {
  const f = fixture(); assert.equal(f.draw(), 'original-result'); assert.equal(f.submitted, 1)
  assert.equal(f.calls[0].receiver, f.renderer); assert.equal(f.calls[0].args[0], f.scene.scene)
  const failure = Error('renderer failure'); f.setThrown(failure)
  assert.throws(() => f.draw(), error => error === failure); assert.equal(f.submitted, 2)
  assert.equal(f.observer.close().restored, true); assert.equal(f.renderer.render, f.original)
})
test('actual independent RAF samples never submit or advance simulation', async () => {
  const f = fixture(); f.draw(); f.observer.bindHeldCast(); const pending = f.observer.sample(400)
  f.tick(20); f.tick(200); f.tick(200); const samples = await pending
  assert.equal(samples.length, 3); assert.equal(samples[2].at - samples[0].at, 400)
  assert.equal(f.submitted, 1); assert.equal(f.world.turn, 12)
  assert.deepEqual(samples[0].frozenState, samples[2].frozenState); f.observer.close()
})
test('loss uses the retained real extension and never dispatches a synthetic event', () => {
  const f = fixture(); f.observer.bindHeldCast(); f.observer.lose()
  assert.equal(f.gl.isContextLost(), true); assert.equal(f.observer.read().events.length, 0)
  f.event('lost', true); f.observer.restore(); f.tick(1); f.event('restored', true)
  assert.equal(f.gl.isContextLost(), false); assert.equal(f.observer.read().events[1].trusted, true)
  f.observer.close()
})
test('synthetic loss cannot authorize restoration', () => {
  const f = fixture(); f.observer.bindHeldCast(); f.observer.lose(); f.event('lost', false)
  assert.throws(() => f.observer.restore(), /trusted context loss/); f.observer.close()
})
test('freeze sampling rejects replaced native person/projectile owners', async () => {
  const f = fixture(); f.observer.bindHeldCast(); const pending = f.observer.sample(400)
  f.world.projectiles[0] = { ...f.world.projectiles[0] }; f.tick(16)
  await assert.rejects(pending, /owner changed/); f.observer.close()
})
test('cleanup cancels only its RAF, removes listeners and restores descriptor', async () => {
  const f = fixture(); f.observer.bindHeldCast(); const pending = f.observer.sample(400)
  const rejected = assert.rejects(pending, /closed/); const cleanup = f.observer.close(); await rejected
  assert.equal(cleanup.restored, true); assert.equal(f.queue.size, 0); assert.equal(f.listeners.size, 0)
  assert.equal(f.renderer.render, f.original); assert.equal(f.window.modalInvalidationObserver, undefined)
})
test('visible loaded asset readiness and revision come from the real observation', async () => {
  const f = fixture(); const before = f.observer.watchSky(); assert.equal(before.status, 'loading')
  f.complete(); await flush(); const after = f.observer.texture()
  assert.equal(after.realImageDecode, true); assert.equal(after.readyResult, true)
  assert.equal(after.revision, before.revision + 1)
  f.scene.skyBackdrop.visible = false; assert.equal(f.observer.texture().usedByVisibleMaterial, false)
  f.observer.close()
})
test('pixel acceptance rejects stale, empty, unchanged late texture and changed restoration', () => {
  const a = { at: 1, drawCount: 2, crop: { x: 1 }, bytes: [1], nonempty: true }, b = { ...a, at: 3, drawCount: 3, bytes: [2] }
  assert.equal(comparePixels(a, b, 2, { changed: true }).changedFromBefore, true)
  assert.throws(() => comparePixels(a, b, 2, { changed: false }))
  assert.throws(() => comparePixels(a, { ...b, nonempty: false }, 2, { changed: true }))
  assert.throws(() => comparePixels(a, { ...b, at: 1 }, 2, { changed: true }))
  assert.throws(() => comparePixels(a, { ...b, bytes: [1] }, 2, { changed: true }))
})

const { settleWithin, contextDeadline } = await import('../scripts/modal-invalidation/deadline.mjs')
test('cleanup wait returns timed-out for a never-resolving renderer evaluation', async () => {
  const result = await settleWithin(() => new Promise(() => {}), 10)
  assert.equal(result.status, 'timed-out')
})
test('deadline independently closes context while renderer work is stuck', async () => {
  let closed = 0
  const owner = contextDeadline({ timeoutMs: 10, onFailure() {} })
  await owner.create(async () => ({ async close() { closed++ } }))
  await assert.rejects(Promise.race([new Promise(() => {}), owner.expired]), /deadline/)
  await flush(); assert.equal(closed, 1)
  assert.equal(await owner.close(), true); assert.equal(closed, 1); owner.cancelTimer()
})
test('late context creation after timeout closes it before allowing use', async () => {
  let resolve, closed = 0
  const owner = contextDeadline({ timeoutMs: 10, onFailure() {} })
  const pending = owner.create(() => new Promise(done => { resolve = done }))
  const rejected = assert.rejects(pending, /Late-created/)
  await assert.rejects(owner.expired, /deadline/)
  resolve({ async close() { closed++ } }); await rejected; await flush()
  assert.equal(closed, 1); owner.cancelTimer()
})
test('hung context close is reported unknown within bound, not certified cleanup', async () => {
  const owner = contextDeadline({ timeoutMs: 1000, onFailure() {} })
  await owner.create(async () => ({ close: () => new Promise(() => {}) }))
  assert.equal((await settleWithin(() => owner.close(), 10)).status, 'timed-out')
  owner.cancelTimer()
})

const { finishModalIntroduction, publicStartupReady, readBoundStartup, enterModalMission, validatePublicDelivery } =
  await import('../scripts/modal-invalidation/mission-entry.mjs')
function startupPage({ before = {}, after = {}, clickError, clickMs = 1000, unlockMs = 1000, initialMs = 0, proofMs = 0, waitError } = {}) {
  let now = 0, reads = 0
  const calls = [], state = { ownerUnchanged: true, inputMask: 64, level: 1, cheats: false, skipVisible: true,
    controlUnchanged: true, controlPresent: true, boundControlConnected: true, paused: false, modalSuspended: false, documentVisibility: 'visible' }
  const target = { x: 400, y: 300, inViewport: true, positiveArea: true, finiteGeometry: true, notInert: true, unique: true, connected: true, hitMatchesControl: true }
  const activation = { count: 1, extraClicks: 0, click: { targetMatched: true, trusted: true, button: 0, detail: 1, clientX: 400, clientY: 300,
    capture: { ...state, flyby: { flags: 21, warmup: 2 } }, bubble: { ...state, inputMask: 0, flyby: { flags: 20, warmup: 2 } } } }
  const page = {
    async evaluate() { calls.push('read'); if (reads === 0) now += initialMs; else now += proofMs; return { ...state, ...(reads++ ? { inputMask: 0, activation, ...after } : { publicClickTarget: target, ...before }) } },
    getByRole() { assert.fail('No locator activation in the pointer adapter') },
    mouse: { async click(x, y, options) { calls.push(['click', { x, y, ...options }]); now += clickMs; if (clickError) throw clickError } },
    async waitForFunction(fn, owners, options) { calls.push(['wait', options]); now += unlockMs; if (waitError) throw waitError },
  }
  return { page, calls, trace: {}, now: () => now }
}
test('ordinary startup uses one public click and one cumulative click/unlock budget', async () => {
  const f = startupPage(); await finishModalIntroduction(f.page, {}, f.trace, f.now, () => {})
  assert.equal(f.trace.outcome, 'public-click-unlocked'); assert.equal(f.trace.attempts, 1)
  assert.equal(f.trace.elapsedMs, 2000)
  assert.deepEqual(f.calls.filter(x => Array.isArray(x)), [
    ['click', { x: 400, y: 300, button: 'left', clickCount: 1 }], ['wait', { timeout: 1500 }],
  ])
})
test('natural introduction completion before activation sends no click', async () => {
  const f = startupPage({ before: { inputMask: 0, skipVisible: false } })
  await finishModalIntroduction(f.page, {}, f.trace, f.now, () => {})
  assert.equal(f.trace.outcome, 'natural-before-click'); assert.equal(f.trace.attempts, 0)
  assert.deepEqual(f.calls, ['read'])
})
test('raw pointer timeout is uncertain dispatch and cannot be rescued by natural unlock', async () => {
  const error = Object.assign(Error('pointer delivery timeout'), { name: 'TimeoutError' })
  for (const after of [{ inputMask: 0 }, { inputMask: 64 }, { ownerUnchanged: false }, { level: 2 }, { cheats: true }]) {
    const f = startupPage({ clickError: error, after })
    await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), value => value === error)
    assert.equal(f.trace.outcome, 'failed'); assert.equal(f.trace.attempts, 1)
    assert.equal(f.calls.filter(x => x === 'read').length, 1)
  }
})
test('non-timeout input dispatch failure is retained even if the mission could unlock', async () => {
  const failure = Error('input delivery disconnected'), f = startupPage({ clickError: failure })
  await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), error => error === failure)
  assert.equal(f.trace.attempts, 1); assert.equal(f.calls.filter(x => x === 'read').length, 1)
})
test('over-budget click or unlock cannot pass and never gets a second activation', async () => {
  const timeout = Object.assign(Error('timeout'), { name: 'TimeoutError' })
  for (const options of [{ clickMs: 2501, unlockMs: 0 }, { clickMs: 1500, unlockMs: 1001 }, { clickMs: 2501, clickError: timeout }]) {
    const f = startupPage(options)
    await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), /budget expired|timeout/)
    assert.equal(f.trace.attempts, 1); assert.equal(f.trace.outcome, 'failed')
  }
})
test('missing visible Skip, changed owner or wrong mission cannot authorize input', async () => {
  for (const before of [{ skipVisible: false }, { ownerUnchanged: false }, { level: 2 }, { cheats: true }]) {
    const f = startupPage({ before }); await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}))
    assert.equal(f.trace.attempts, 0)
  }
  const changed = startupPage({ after: { ownerUnchanged: false } })
  await assert.rejects(finishModalIntroduction(changed.page, {}, changed.trace, changed.now, () => {}), /owner changed/)
})
test('startup predicates read real owners and public visibility without changing them', () => {
  const world = { inputMask: 64, outcome: { level: 1 } }, scene = { world }, store = { getWorld: () => world, hasUsedCheats: () => false }
  const skip = { getClientRects: () => [1], disabled: false }, window = { testStore: store, testSceneRef: { current: scene } }
  const owners = { store, world, scene }, context = { window, document: { querySelector: () => skip }, getComputedStyle: () => ({ visibility: 'visible' }), owners }
  assert.equal(vm.runInNewContext(`(${publicStartupReady})()`, context), true)
  assert.equal(vm.runInNewContext(`(${readBoundStartup})(owners)`, context).ownerUnchanged, true)
  skip.disabled = true; assert.equal(vm.runInNewContext(`(${publicStartupReady})()`, context), false)
  window.testSceneRef.current = { world }
  assert.equal(vm.runInNewContext(`(${readBoundStartup})(owners)`, context).ownerUnchanged, false)
  assert.equal(world.inputMask, 64)
})
test('entry wall deadline rejects a stuck campaign helper without later setup actions', async () => {
  const trace = {}, page = { getByRole() { assert.fail('No later input after expired startup') } }
  await assert.rejects(enterModalMission(page, { openCampaignFromMainMenu: () => new Promise(() => {}),
    bindGame: () => assert.fail('No binding after expired startup'), onUncertainInput: () => {}, signal: new AbortController().signal,
    deadlineAt: Date.now() + 10, trace }), /entry deadline expired/)
  assert.equal(trace.status, 'failed'); assert.equal(trace.ownerHandleCleanup, 'fulfilled')
})

test('closure diagnostics distinguish requested cleanup from abort without delaying close', async () => {
  const attempts = [], reasons = [], owner = contextDeadline({ timeoutMs: 1000, onFailure() {}, onCloseAttempt: reason => attempts.push(reason) })
  await owner.create(async () => ({ async close(options) { reasons.push(options.reason) } }))
  await owner.close(); await owner.close(); owner.cancelTimer()
  assert.deepEqual(attempts, ['explicit-cleanup']); assert.deepEqual(reasons, ['explicit-cleanup'])
  let closed = 0
  const broken = contextDeadline({ timeoutMs: 1000, onFailure() {}, onCloseAttempt() { throw Error('diagnostic sink failed') } })
  await broken.create(async () => ({ async close() { closed++ } })); broken.abort(Error('cancelled'))
  await broken.close(); broken.cancelTimer(); assert.equal(closed, 1)
})

test('throwing lifecycle sink cannot replace primary failure or prevent abort cleanup', async () => {
  const { lifecycleRecorder } = await import('../scripts/modal-invalidation/diagnostics.mjs')
  for (const thrown of [Error('sink broke'), { toString() { throw Error('unprintable') } }]) {
    const recorder = lifecycleRecorder(() => { throw thrown })
    let closed = 0, primary
    const original = Error('original acquisition failure')
    const owner = contextDeadline({ timeoutMs: 1000,
      onFailure(error) { recorder.record('failure', String(error)); primary ??= error },
      onCloseAttempt(reason) { recorder.record('close-requested', reason) } })
    await owner.create(async () => ({ async close() { closed++ } }))
    owner.abort(original); await owner.close(); owner.cancelTimer()
    assert.equal(closed, 1); assert.equal(primary, original); assert.ok(recorder.report.sinkFailure)
    assert.deepEqual(recorder.report.events.map(x => x.kind), ['failure', 'close-requested'])
  }
})

const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail }); return { promise, resolve, reject } }
function strictRoutePage({ fetchPending, bodyPending, fulfillPending, abortError, fulfillError, fetchError, unrouteError, unroutePending } = {}) {
  let handler, active, terminal, removed = 0
  const calls = [], response = { status: () => 200, url: () => 'http://localhost/original/sky.png',
    async body() { calls.push('body'); if (bodyPending) await bodyPending.promise; return png } }
  const claim = action => { calls.push(action); assert.equal(terminal, undefined, 'Route is already handled!'); terminal = action }
  const route = { async fetch() { calls.push('fetch'); if (fetchPending) await fetchPending.promise; if (fetchError) throw fetchError; return response },
    async fulfill(options) { claim('fulfill'); assert.equal(options.body, png); if (fulfillPending) await fulfillPending.promise;
      if (fulfillError) throw fulfillError; calls.push('fulfill-complete') },
    async abort() { claim('abort'); if (abortError) throw abortError; calls.push('abort-complete') },
    request: () => ({ failure: () => abortError || fulfillError ? { errorText: 'net::ERR_ABORTED' } : null }) }
  const page = { async route(url, fn) { assert.equal(url, response.url()); handler = fn },
    async unroute(url, fn) { assert.equal(fn, handler); removed++; calls.push('unroute'); if (unroutePending) await unroutePending.promise; if (unrouteError) throw unrouteError },
    async request() { active = handler(route); await flush() },
    repeat: () => handler(route), done: () => active }
  return { page, calls, removed: () => removed }
}
test('close drains fetch, body and held phases before removing its one owned handler', async () => {
  for (const phase of ['fetchPending', 'bodyPending', 'held']) {
    const pending = deferred(), f = strictRoutePage(phase === 'held' ? {} : { [phase]: pending })
    const gate = await holdSkyResponse(f.page, 'http://localhost', blob(png)); await f.page.request()
    const closing = gate.close(); assert.equal(gate.close(), closing)
    pending.resolve(); const result = await closing; await f.page.done()
    assert.equal(result.failure, null); assert.equal(result.pending, 0)
    assert.equal(f.calls.filter(x => x === 'abort').length, 1); assert.equal(f.calls.includes('fulfill'), false)
    assert.ok(f.calls.indexOf('abort-complete') < f.calls.indexOf('unroute')); assert.equal(f.removed(), 1)
  }
})
test('close during fulfillment awaits the claimed terminal action without an abort fallback', async () => {
  const pending = deferred(), f = strictRoutePage({ fulfillPending: pending }), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
  await f.page.request(); gate.release(); await flush(); const closing = gate.close()
  assert.deepEqual(f.calls.slice(-1), ['fulfill']); pending.resolve(); await closing
  assert.equal(gate.record.owned.terminal.action, 'fulfill'); assert.equal(gate.record.owned.terminal.status, 'fulfilled')
  assert.ok(f.calls.indexOf('fulfill-complete') < f.calls.indexOf('unroute')); assert.equal(f.calls.includes('abort'), false)
})
test('rejected terminal dispatch is retained and never attempts a second terminal action', async () => {
  for (const action of ['abort', 'fulfill']) {
    const f = strictRoutePage({ [action + 'Error']: Error('Route is already handled!') }), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
    await f.page.request(); if (action === 'fulfill') { gate.release(); await f.page.done() }
    const result = await gate.close(); assert.match(result.failure, /already handled/)
    assert.equal(gate.record.owned.terminal.action, action); assert.equal(gate.record.owned.terminal.status, 'rejected')
    assert.equal(gate.record.owned.terminal.requestFailure, 'net::ERR_ABORTED')
    assert.equal(f.calls.filter(x => ['abort', 'fulfill'].includes(x)).length, 1)
    await gate.close(); assert.equal(f.removed(), 1)
  }
})
test('fetch failure stays primary while its one failed cancellation remains separate evidence', async () => {
  const f = strictRoutePage({ fetchError: Error('original fetch failure'), abortError: Error('already handled') })
  const gate = await holdSkyResponse(f.page, 'http://localhost', blob(png)); await f.page.request(); await f.page.done(); await gate.close()
  assert.match(gate.record.failure, /original fetch failure/)
  assert.ok(gate.record.events.some(x => x.kind === 'secondary-abort-failure' && /already handled/.test(x.error)))
  assert.equal(f.calls.filter(x => x === 'abort').length, 1)
})
test('repeated route callback fails closed without duplicate terminal ownership', async () => {
  const f = strictRoutePage(), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
  await f.page.request(); const repeated = f.page.repeat(); const result = await gate.close(); await repeated
  assert.match(result.failure, /callback repeated/); assert.equal(f.calls.filter(x => x === 'abort').length, 1)
  assert.equal(gate.record.requests, 1)
})
test('unroute failure remains a cleanup failure after successful owned drain', async () => {
  const f = strictRoutePage({ unrouteError: Error('unroute rejected') }), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
  await f.page.request(); const result = await gate.close()
  assert.equal(gate.record.cleanup.drain.status, 'fulfilled'); assert.match(result.failure, /unroute rejected/)
  assert.equal(gate.record.cleanup.unroute.status, 'rejected'); assert.equal(f.removed(), 1)
})
test('hung drain still attempts removal within the existing cleanup allowance and cannot pass', async () => {
  const pending = deferred(), f = strictRoutePage({ fetchPending: pending }), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
  await f.page.request()
  try {
    const result = await gate.close(); assert.match(result.failure, /drain did not complete/)
    assert.equal(gate.record.cleanup.drain.status, 'timed-out'); assert.equal(f.removed(), 1); assert.equal(result.pending, 1)
  } finally { pending.resolve(); await f.page.done() }
})
test('hung handler removal is bounded and cannot turn cancellation into verified cleanup', async () => {
  const pending = deferred(), f = strictRoutePage({ unroutePending: pending }), gate = await holdSkyResponse(f.page, 'http://localhost', blob(png))
  await f.page.request()
  try {
    const result = await gate.close(); assert.match(result.failure, /unroute did not complete/)
    assert.equal(gate.record.cleanup.unroute.status, 'timed-out'); assert.equal(f.removed(), 1)
  } finally { pending.resolve(); await flush() }
})

const { observeStartup, closeStartupProbe } = await import('../scripts/modal-invalidation/startup-probe.mjs')
function startupObservation() {
  let time = 0
  const tracks = Array.from({ length: 7 }, () => ({ frame: 0, duration: 0, active: false }))
  const world = { inputMask: 64, paused: false, outcome: { level: 1 }, flyby: { flags: 17, warmup: 6, frameRate: 0, frame: 0, cursor: 0, events: [], tracks } }
  const scene = { world, modalSuspended: false }, store = { getWorld: () => world, hasUsedCheats: () => false }
  const control = { getClientRects: () => [1], disabled: false, isConnected: true, closest: () => null,
    getBoundingClientRect: () => ({ left: 300, right: 500, top: 280, bottom: 320, width: 200, height: 40 }) }, handlers = new Map()
  const window = { testStore: store, testSceneRef: { current: scene },
    addEventListener(name, fn, options) { assert.equal(name, 'click'); assert.equal(options.passive, true); handlers.set(options.capture, fn) },
    removeEventListener(name, fn, capture) { assert.equal(name, 'click'); assert.equal(handlers.get(capture), fn); handlers.delete(capture) } }
  const document = { querySelector: () => control, querySelectorAll: () => [control], elementFromPoint: () => ({ closest: () => control }), visibilityState: 'visible' }, owners = { store, world, scene }
  const context = { window, document, owners, innerWidth: 1440, innerHeight: 1000, getComputedStyle: () => ({ visibility: 'visible' }), performance: { now: () => time, timeOrigin: 1000 } }
  const read = () => vm.runInNewContext(`(${observeStartup})(owners)`, context)
  const close = () => vm.runInNewContext(`(${closeStartupProbe})(owners)`, context)
  return { world, scene, window, owners, control, document, handlers, read, close, context, tick(ms) { time += ms },
    click({ trusted = true, wrongTarget = false, bubble = true, handler = () => {} } = {}) {
      const event = { isTrusted: trusted, timeStamp: time, button: 0, detail: 1, clientX: 400, clientY: 300, target: { closest: () => wrongTarget ? {} : control } }
      handlers.get(true)?.(event); handler(); if (bubble) handlers.get(false)?.(event)
    } }
}
test('passive capture and window bubble distinguish warmup skip from native blend without changing world state', () => {
  for (const phase of ['warmup', 'blend']) {
    const f = startupObservation(); if (phase === 'blend') { f.world.flyby.warmup = 0; f.world.flyby.frameRate = 23 }
    const original = JSON.stringify(f.world); const first = f.read(); assert.equal(JSON.stringify(f.world), original)
    assert.equal(first.ownerUnchanged, true); f.tick(600)
    f.click({ handler() {
      if (phase === 'warmup') { f.world.flyby.flags &= ~1; f.world.inputMask = 0 }
      else { f.world.flyby.flags |= 0x48; for (const index of [1, 2, 3]) Object.assign(f.world.flyby.tracks[index], { active: true, frame: 0, duration: 46 }) }
    } })
    const report = f.close(), click = report.clicks[0]
    assert.equal(click.trusted, true); assert.equal(click.capture.flyby.flags, 17)
    assert.equal(click.capture.pageNowMs, 600); assert.equal(click.eventTimeStampMs, 600)
    if (phase === 'warmup') assert.equal(click.bubble.inputMask, 0)
    else { assert.equal(click.bubble.flyby.flags, 89); assert.equal(click.bubble.flyby.tracks[0].duration, 46) }
    assert.equal(report.closed, true); assert.equal(report.listeners, 0); assert.equal(f.handlers.size, 0)
  }
})
test('wrong targets, untrusted clicks and missing bubble remain explicit rather than inferred handler success', () => {
  const f = startupObservation(); f.read(); f.click({ wrongTarget: true }); assert.equal(f.owners.startupProbe.report.clicks.length, 1)
  assert.equal(f.owners.startupProbe.report.clicks[0].targetMatched, false)
  f.click({ trusted: false, bubble: false }); const report = f.close()
  assert.equal(report.clicks.length, 2); assert.equal(report.clicks[1].trusted, false); assert.equal(report.clicks[1].bubble, null)
})
test('same-owner latest polling exposes paused or stalled tracks, late unlock and replaced owners without new timers', () => {
  const f = startupObservation(); f.read(); f.world.flyby.warmup = 0; f.world.flyby.frameRate = 23; f.world.paused = true
  f.owners.startupProbe.sample('unlock-poll'); assert.equal(f.owners.startupProbe.report.latest.paused, true)
  f.tick(2600); f.world.inputMask = 0; f.owners.startupProbe.sample('unlock-poll')
  assert.equal(f.owners.startupProbe.report.latest.pageNowMs, 2600)
  f.window.testSceneRef.current = { world: f.world }; f.owners.startupProbe.sample('unlock-poll')
  assert.equal(f.owners.startupProbe.report.latest.ownerUnchanged, false)
  const report = f.close(); assert.equal(report.final.inputMask, 0); assert.equal(report.closed, true)
})
test('last unlock poll preserves locked track progress after final diagnostic observes a late unlock', () => {
  const f = startupObservation(); f.read(); f.tick(2000)
  Object.assign(f.world.flyby.tracks[1], { active: true, frame: 17, duration: 46 })
  f.owners.startupProbe.sample('unlock-poll')
  f.tick(600); f.world.inputMask = 0
  Object.assign(f.world.flyby.tracks[1], { active: false, frame: 46 })
  const report = f.close()
  assert.equal(report.lastPoll.phase, 'unlock-poll'); assert.equal(report.lastPoll.pageNowMs, 2000)
  assert.equal(report.lastPoll.inputMask, 64); assert.equal(report.lastPoll.flyby.tracks[0].frame, 17)
  assert.equal(report.lastPoll.flyby.tracks[0].active, true)
  assert.equal(report.final.pageNowMs, 2600); assert.equal(report.final.inputMask, 0)
  assert.equal(report.final.flyby.tracks[0].frame, 46); assert.equal(report.final.flyby.tracks[0].active, false)
})
test('startup diagnostic storage stays bounded and cleanup is idempotent', () => {
  const f = startupObservation(); f.read()
  for (let i = 0; i < 20; i++) f.click()
  for (let i = 0; i < 1000; i++) f.owners.startupProbe.sample('unlock-poll')
  const report = f.close(); assert.equal(report.clicks.length, 4); assert.equal(report.extraClicks, 16)
  assert.ok(JSON.stringify(report).length < 10000); assert.equal(f.close(), report); assert.equal(f.handlers.size, 0)
})
test('unchanged click deadline fails despite a later diagnostic unlock and retains operation timestamps', async () => {
  const f = startupPage({ clickMs: 1238, unlockMs: 1333 })
  await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), /budget expired/)
  assert.equal(f.trace.elapsedMs, 2571); assert.equal(f.trace.attempts, 1); assert.equal(f.trace.outcome, 'failed')
  assert.equal(f.trace.operations.find(x => x.phase === 'click-fulfilled').elapsedMs, 1238)
  assert.equal(f.trace.operations.find(x => x.phase === 'unlock-wait-start').elapsedMs, 1238)
  assert.equal(f.trace.operations.at(-1).phase, 'failed')
})

test('initial passive observation remains inside the existing cumulative introduction budget', async () => {
  const f = startupPage({ initialMs: 2000, clickMs: 1000, unlockMs: 0 })
  await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), /budget expired/)
  assert.deepEqual(f.calls.find(x => Array.isArray(x) && x[0] === 'click')[1], { x: 400, y: 300, button: 'left', clickCount: 1 })
  assert.equal(f.calls.some(x => Array.isArray(x) && x[0] === 'wait'), false)
  assert.equal(f.trace.operations.find(x => x.phase === 'initial-observation-complete').elapsedMs, 2000)
  assert.equal(f.trace.elapsedMs, 3000)
})
function entryPage(options = {}, cleanup = {}) {
  const f = startupPage(options); let disposals = 0
  const evaluate = f.page.evaluate, wait = f.page.waitForFunction, role = f.page.getByRole
  f.page.evaluateHandle = async () => ({ async dispose() { disposals++ } })
  f.page.evaluate = async (fn, owners) => {
    if (fn === closeStartupProbe) { if (cleanup.error) throw cleanup.error; return cleanup.report ?? { closed: true, listeners: 0, final: { inputMask: 0 } } }
    return evaluate(fn, owners)
  }
  f.page.waitForFunction = async (fn, ...args) => { if (fn !== publicStartupReady) return wait(fn, ...args) }
  f.page.getByRole = (name, options) => {
    if (options.name === 'Start Mission 1') return { async click() {} }
    if (options.name === 'Continue anyway') return { async isVisible() { return false } }
    return role(name, options)
  }
  return { ...f, disposals: () => disposals,
    enter: () => enterModalMission(f.page, { openCampaignFromMainMenu: async () => {}, bindGame: async () => {},
      signal: new AbortController().signal, deadlineAt: Date.now() + 5000, trace: f.trace, onUncertainInput: cleanup.cancel ?? (() => {}) }) }
}
test('entry closes passive listeners and disposes owner under the existing cleanup step', async () => {
  const f = entryPage(); await f.enter()
  assert.equal(f.trace.status, 'passed'); assert.equal(f.trace.observations.closed, true)
  assert.equal(f.trace.observations.listeners, 0); assert.equal(f.disposals(), 1)
  const bad = entryPage({}, { report: { closed: false, listeners: 2 } })
  await assert.rejects(bad.enter(), /owner handle cleanup failed/); assert.equal(bad.disposals(), 1)
})
test('post-failure observation cannot rescue a late unlock or replace primary dispatch failure', async () => {
  const late = entryPage({ waitError: Error('original unlock timeout') }); await assert.rejects(late.enter(), /original unlock timeout/)
  assert.equal(late.trace.observations.final.inputMask, 0); assert.equal(late.trace.status, 'failed'); assert.equal(late.disposals(), 1)
  const original = Error('original dispatch failure'), failed = entryPage({ clickError: original }, { error: Error('diagnostic collection failed') })
  await assert.rejects(failed.enter(), error => error === original)
  assert.equal(failed.trace.ownerHandleCleanup, 'rejected'); assert.equal(failed.disposals(), 1)
  assert.match(failed.trace.error, /original dispatch failure/)
})

test('pointer target is current viewport CSS center and permits a child hit without game writes', () => {
  const f = startupObservation(), before = JSON.stringify(f.world), initial = f.read()
  assert.deepEqual(JSON.parse(JSON.stringify(initial.publicClickTarget)), { x: 400, y: 300, inViewport: true,
    positiveArea: true, finiteGeometry: true, notInert: true, unique: true, connected: true, hitMatchesControl: true })
  assert.equal(JSON.stringify(f.world), before); f.close()
})
test('pointer preflight retains and rejects obstructed, offscreen, zero, nonfinite, inert or detached targets', async () => {
  const changes = [
    f => { f.document.elementFromPoint = () => ({ closest: () => null }) },
    f => { f.control.getBoundingClientRect = () => ({ left: -400, right: -200, top: 1, bottom: 41, width: 200, height: 40 }) },
    f => { f.control.getBoundingClientRect = () => ({ left: 400, right: 400, top: 1, bottom: 41, width: 0, height: 40 }) },
    f => { f.control.getBoundingClientRect = () => ({ left: 300, right: 500, top: 280, bottom: 320, width: Infinity, height: 40 }) },
    f => { f.control.closest = () => ({ inert: true }) },
    f => { f.control.isConnected = false },
    f => { f.document.querySelectorAll = () => [f.control, {}] },
    f => { f.control.disabled = true },
  ]
  for (const change of changes) {
    const f = startupObservation(); change(f); const initial = f.read(), page = startupPage({ before: initial })
    await assert.rejects(finishModalIntroduction(page.page, {}, page.trace, page.now, () => {}))
    assert.equal(page.trace.attempts, 0); assert.equal(page.calls.some(x => Array.isArray(x) && x[0] === 'click'), false)
    f.close()
  }
})
function deliveryFromProbe(f) {
  const report = f.owners.startupProbe.report
  return { count: report.clicks.length, extraClicks: report.extraClicks, click: report.clicks[0] }
}
test('trusted warmup handler removal is accepted but same-position replacement is not', () => {
  for (const replacement of [false, true]) {
    const f = startupObservation(), initial = f.read()
    f.click({ handler() {
      f.world.flyby.flags &= ~1; f.world.inputMask = 0; f.control.isConnected = false
      f.document.querySelector = () => replacement ? { getClientRects: () => [1], disabled: false } : null
    } })
    const activation = deliveryFromProbe(f)
    if (replacement) assert.throws(() => validatePublicDelivery(activation, initial.publicClickTarget), /replaced or removed/)
    else assert.equal(validatePublicDelivery(activation, initial.publicClickTarget), 'warmup-unlocked')
    f.close()
  }
})
test('real observed native blend and already-finishing branches are accepted without a second input', () => {
  for (const finishing of [false, true]) {
    const f = startupObservation(); f.world.flyby.warmup = 0; f.world.flyby.frameRate = 23
    if (finishing) { f.world.flyby.flags |= 0x48; for (const index of [1, 2, 3]) Object.assign(f.world.flyby.tracks[index], { active: true, frame: 12, duration: 46 }) }
    const initial = f.read()
    f.click({ handler() {
      if (finishing) return
      f.world.flyby.flags |= 0x48
      for (const index of [1, 2, 3]) Object.assign(f.world.flyby.tracks[index], { active: true, frame: 0, duration: 46 })
    } })
    assert.equal(validatePublicDelivery(deliveryFromProbe(f), initial.publicClickTarget), finishing ? 'already-finishing' : 'native-blend-started')
    f.close()
  }
})
test('matched natural completion at dispatch is explicit and is not a missing-target exception', () => {
  const f = startupObservation(), initial = f.read(); f.world.inputMask = 0; f.world.flyby.flags &= ~1
  f.click(); assert.equal(validatePublicDelivery(deliveryFromProbe(f), initial.publicClickTarget), 'natural-before-dispatch'); f.close()
})
test('missing handler effect, mismatched, duplicate, untrusted or incomplete delivery cannot pass on later unlock', async () => {
  for (const kind of ['effect', 'wrong', 'duplicate', 'untrusted', 'bubble', 'owner', 'coordinates']) {
    const f = startupObservation(), initial = f.read()
    f.click({ wrongTarget: kind === 'wrong', trusted: kind !== 'untrusted', bubble: kind !== 'bubble', handler() {
      if (kind === 'effect') return
      f.world.inputMask = 0; f.world.flyby.flags &= ~1
      if (kind === 'owner') f.window.testSceneRef.current = { world: f.world }
    } })
    if (kind === 'duplicate') f.click()
    const activation = deliveryFromProbe(f)
    if (kind === 'coordinates') activation.click.clientX += 50
    const page = startupPage({ before: initial, after: { activation, inputMask: 0 } })
    await assert.rejects(finishModalIntroduction(page.page, {}, page.trace, page.now, () => {}))
    assert.equal(page.trace.outcome, 'failed'); assert.equal(page.trace.attempts, 1)
    f.close()
  }
})
test('delivery proof read and unlock both remain charged to the cumulative pointer response cap', async () => {
  for (const options of [{ initialMs: 200, clickMs: 200, unlockMs: 2000, proofMs: 101 }, { initialMs: 200, clickMs: 200, unlockMs: 2101 }]) {
    const f = startupPage(options)
    await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, () => {}), /budget expired/)
    assert.equal(f.trace.attempts, 1); assert.equal(f.trace.outcome, 'failed')
  }
})
test('hung pointer dispatch requests independent cancellation before cleanup and consumes late rejection', async () => {
  for (const rejects of [false, true]) {
    const f = startupPage({ initialMs: 2490 }), pending = deferred(), order = []
    f.page.mouse.click = async () => { order.push('input'); await pending.promise }
    let cancellation
    await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, error => { cancellation = error; order.push('close-requested') }), /uncertain outcome/)
    assert.equal(f.trace.delivery, 'uncertain'); assert.equal(f.trace.deliveryUncertain, true)
    assert.equal(f.trace.uncertainCancellationRequested, true); assert.ok(cancellation)
    assert.deepEqual(order, ['input', 'close-requested']); assert.equal(f.calls.some(x => Array.isArray(x) && x[0] === 'wait'), false)
    if (rejects) pending.reject(Error('late input rejection')); else pending.resolve()
    await flush(); assert.deepEqual(order, ['input', 'close-requested']); assert.equal(f.trace.outcome, 'failed')
  }
})
test('rejected dispatch preserves its primary error when independent cancellation and diagnostic cleanup fail', async () => {
  const original = Error('native mouse transport failure'), order = []
  const f = entryPage({ clickError: original }, { cancel() { order.push('cancel'); throw Error('close request failed') }, error: Error('diagnostic unavailable') })
  await assert.rejects(f.enter(), error => error === original)
  assert.deepEqual(order, ['cancel']); assert.equal(f.trace.deliveryUncertain, true)
  assert.match(f.trace.uncertainCancellationError, /close request failed/)
  assert.equal(f.trace.ownerHandleCleanup, 'rejected'); assert.equal(f.disposals(), 1)
})
test('public pointer adapter requires an explicit independent context owner', async () => {
  const f = startupPage()
  await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now), /independent owned-context/)
  assert.deepEqual(f.calls, [])
})
test('uncertain input uses the real deadline owner to close its context independently', async () => {
  const f = startupPage({ initialMs: 2490 }), pending = deferred(), events = []
  const owner = contextDeadline({ timeoutMs: 60000, onFailure: error => events.push(error.message) })
  try {
    await owner.create(async () => ({ async close() { events.push('context-closed') } }))
    f.page.mouse.click = () => pending.promise
    await assert.rejects(finishModalIntroduction(f.page, {}, f.trace, f.now, error => owner.abort(error)), /uncertain outcome/)
    await flush(); assert.equal(events.at(-1), 'context-closed')
    assert.equal(await owner.close(), true); assert.equal(events.filter(x => x === 'context-closed').length, 1)
  } finally { pending.resolve(); owner.cancelTimer() }
})
