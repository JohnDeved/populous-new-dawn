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
