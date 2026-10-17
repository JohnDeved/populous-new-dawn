import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareFrontendAssets, FRONTEND_ASSET_TIMEOUT_MS } from '../app/frontend-assets.ts'
import art from '../app/original-frontend.json' with { type: 'json' }
import { pageEffect } from './support/follower-nearby-page.mjs'

const flush = () => new Promise(resolve => setImmediate(resolve))
function fixture(t) {
  const requests = [], timers = []
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: class {
    decode() { return new Promise((resolve, reject) => requests.push({ url: this.src, resolve, reject })) }
  } })
  t.after(() => previous ? Object.defineProperty(globalThis, 'Image', previous) : delete globalThis.Image)
  t.mock.method(globalThis, 'setTimeout', (run, delay) => { const timer = { run, delay }; timers.push(timer); return timer })
  t.mock.method(globalThis, 'clearTimeout', timer => { timer.cleared = true })
  t.mock.method(globalThis, 'fetch', (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })))
  const pending = prepareFrontendAssets()
  const complete = (request, invalid = false) => request.resolve(request.url.endsWith('.bin')
    ? { ok: true, arrayBuffer: async () => new ArrayBuffer(invalid ? 1 : art.binaryBytes) } : undefined)
  return { requests, timers, pending, complete }
}

test('frontend prepares all groups concurrently and retains decoded images in a frozen snapshot', async t => {
  const f = fixture(t)
  assert.equal(f.requests.length, 10)
  assert.equal(new Set(f.requests.map(r => r.url)).size, 10)
  assert.equal(f.timers[0].delay, FRONTEND_ASSET_TIMEOUT_MS)
  f.requests.forEach(r => f.complete(r))
  const result = await f.pending
  for (const group of ['fonts', 'lowFont', 'logo', 'background', 'cursor', 'sliders']) assert.equal(result[group], true)
  assert.equal(result.composition.byteLength, art.binaryBytes)
  assert.equal(result.images.length, 9)
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.images))
  assert.equal(f.timers[0].cleared, true)
})

for (const [part, failed] of [['feft33we', 'fonts'], ['felo33we', 'lowFont'], ['felgspen', 'logo'],
  ['background', 'background'], ['pointer', 'cursor'], ['frontend-1', 'sliders'], ['composition', 'composition']]) {
  test(`${failed} failure preserves every independent healthy group`, async t => {
    const f = fixture(t)
    f.requests.forEach(r => r.url.includes(part) ? r.reject(Error('asset failure')) : f.complete(r))
    const result = await f.pending
    for (const group of ['fonts', 'lowFont', 'logo', 'background', 'cursor', 'sliders']) assert.equal(result[group], group !== failed)
    assert.equal(result.composition === null, failed === 'composition')
  })
}
test('invalid composition bytes select fallback without discarding good artwork', async t => {
  const f = fixture(t);f.requests.forEach(r => f.complete(r, r.url.endsWith('.bin')))
  const result = await f.pending
  assert.equal(result.composition, null);assert.equal(result.fonts, true);assert.equal(result.logo, true)
})
test('deadline preserves settled groups and late success cannot mutate the returned session', async t => {
  const f = fixture(t), held = f.requests.filter(r => r.url.includes('/options/') || r.url.endsWith('.bin'))
  f.requests.filter(r => !held.includes(r)).forEach(r => f.complete(r))
  await flush()
  f.timers[0].run()
  const result = await f.pending
  assert.equal(result.fonts, true);assert.equal(result.sliders, false);assert.equal(result.composition, null)
  assert.equal(held.find(r => r.options)?.options.signal.aborted, true)
  const before = { ...result, images: [...result.images] }
  held.forEach(r => f.complete(r));await flush()
  assert.deepEqual(result, before)
})

function startup(restore, prepared, world) {
  const calls = [], reference = { current: null }
  const store = { getWorld: () => world.current, restoreCheckpoint: restore }
  const scope = {
    store, frontendPreparation: reference, prepareFrontendAssets: prepared,
    readAudioPreferences: () => ({ volume: .5, musicVolume: .5 }), readGamePreferences: () => ({}),
    setAudioPreferences() {}, audio: { current: null }, gamePreferencesRef: { current: null }, setGamePreferences() {},
    setFrontendAssets: assets => calls.push(['assets', assets]), setStartup: state => calls.push(['startup', state]),
  }
  return { calls, run: () => pageEffect('store.restoreCheckpoint()', scope)() }
}
for (const first of ['restore', 'assets']) test(`Home keeps loading when only ${first} has settled`, async () => {
  let finishRestore, finishAssets
  const world = { current: {} }, assets = {}
  const restore = new Promise(resolve => { finishRestore = resolve }), prepared = new Promise(resolve => { finishAssets = resolve })
  const home = startup(() => restore, () => prepared, world)
  home.run();(first === 'restore' ? finishRestore : finishAssets)(assets);await flush()
  assert.deepEqual(home.calls, [])
  ;(first === 'restore' ? finishAssets : finishRestore)(assets);await flush()
  assert.deepEqual(home.calls, [['assets', assets], ['startup', 'choice']])
})
for (const cancellation of ['unmount', 'world replacement']) test(`Home ignores prepared assets after ${cancellation}`, async () => {
  let finish
  const world = { current: {} }, home = startup(async () => {}, () => new Promise(resolve => { finish = resolve }), world)
  const cleanup = home.run()
  if (cancellation === 'unmount') cleanup();else world.current = {}
  finish({});await flush();assert.deepEqual(home.calls, [])
})
test('Home effect replay shares its one preparation and only the live owner reveals', async () => {
  let finish, preparations = 0
  const world = { current: {} }, assets = {}, pending = new Promise(resolve => { finish = resolve })
  const home = startup(async () => {}, () => { preparations++;return pending }, world)
  home.run()();home.run();finish(assets);await flush()
  assert.equal(preparations, 1)
  assert.deepEqual(home.calls, [['assets', assets], ['startup', 'choice']])
})
