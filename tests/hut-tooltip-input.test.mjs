import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { closeHutMenu, installHutCheckpointBoundary, finishHutHandles, assertHutInspectionLifecycle } from '../scripts/local-render/hut-tooltip-input.mjs'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'
import hutTooltip from '../scripts/local-render/hut-tooltip.mjs'

const pageSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const loadSource = pageSource.slice(pageSource.indexOf('  function beginLoad('), pageSource.indexOf('\n  function restart('))
const bindLoad = bindings => Function(...Object.keys(bindings), `${stripTypeScriptTypes(loadSource)};return beginLoad`)(...Object.values(bindings))

test('named ordinary driver imports without executing the harness or runtime', () => {
  assert.equal(typeof hutTooltip, 'function')
})

test('explicit inspection requires ordered activation then release and cleared actual ownership', () => {
  const status = { phaseInspections: ['explicit:reused', 'release'], epochs: [{ state: { heldPointer: null, pendingInputs: [] } }] }
  assert.doesNotThrow(() => assertHutInspectionLifecycle(status))
  for (const change of [
    s => { s.phaseInspections.reverse() },
    s => { s.phaseInspections = ['explicit:rejected', 'release'] },
    s => { s.epochs[0].state.heldPointer = 7 },
    s => { s.epochs[0].state.pendingInputs = [{ kind: 'up' }] },
  ]) { const bad = structuredClone(status); change(bad); assert.throws(() => assertHutInspectionLifecycle(bad)) }
})

function checkpointFixture(kind) {
  const savedGlobals = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  let world = { paused: true, turn: 12, time: 1, outcome: { level: 1 }, units: [], terrain: new Uint16Array([3, 4]),
    mana: 10, wood: 20, shots: { blast: 1 }, giftCounts: {}, slots: new Map([[1, new Set([4, 5])]]) }
  const listeners = new Set(), clicks = new Set()
  const button = { isConnected: true, disabled: false, textContent: kind === 'save' ? 'Save checkpoint' : 'Load checkpoint',
    contains: () => false, addEventListener(_type, fn) { clicks.add(fn) }, removeEventListener(_type, fn) { clicks.delete(fn) } }
  const store = { getWorld: () => world, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    change(fn) { fn(world); for (const fn of listeners) fn() },
    loadCheckpoint() { world = structuredClone(world); for (const fn of listeners) fn(); return true } }
  globalThis.window = globalThis
  globalThis.testStore = store
  globalThis.document = { querySelector: selector => selector === 'dialog.game-dialog[open]' ? { querySelectorAll: () => [button] } : null }
  return { store, button, listeners, clicks, click(trusted = true) { for (const fn of clicks) fn({ isTrusted: trusted, target: button }) },
    publish() { for (const fn of listeners) fn() },
    restore() {
      delete globalThis.testStore; delete globalThis.hutTooltipCheckpointBoundary
      for (const [key, descriptor] of savedGlobals) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    } }
}

test('public modal closure matches the actual arrow name and explicitly resumes', async () => {
  assert.match(pageSource, /Continue Game <span>↗<\/span>/)
  assert.match(pageSource, /else if \(dialog\.current\?\.open\) dialog\.current\.close\(\)/)
  let open = true, paused = true
  const calls = [], button = (name, options, menu) => {
    const actual = menu ? 'Continue Game ↗' : paused ? 'Resume game' : 'Pause game'
    assert.equal(name, 'button')
    assert.ok(options.name instanceof RegExp ? options.name.test(actual) : options.name === actual)
    return { async click() { calls.push(actual); if (menu) open = false; else paused = false } }
  }
  const page = { locator(selector) {
    assert.equal(selector, 'dialog.game-dialog')
    return { getByRole: (name, options) => button(name, options, true), async waitFor({ state }) { assert.equal(state, 'hidden'); assert.equal(open, false) } }
  }, getByRole: (name, options) => button(name, options, false), evaluate: async () => paused,
  async waitForFunction() { assert.equal(paused, false) } }
  await closeHutMenu({ page, remaining: () => 100, action: async (_label, run) => run() })
  assert.deepEqual(calls, ['Continue Game ↗', 'Resume game'])
})

test('supplied Save publication preserves the typed clone and its immutable digest', async () => {
  const f = checkpointFixture('save'); let api
  try {
    api = installHutCheckpointBoundary({ kind: 'save' }); f.publish()
    assert.equal(api.read().captured, false)
    f.click(); f.store.getWorld().terrain[0] = 99; f.publish()
    const clone = globalThis.hutTooltipCheckpointBoundary.world
    assert.ok(clone.terrain instanceof Uint16Array); assert.equal(clone.terrain[0], 99)
    assert.ok(clone.slots instanceof Map); assert.ok(clone.slots.get(1) instanceof Set)
    const a = await checkpointObservation({ observationName: api.read().observationName })
    f.store.getWorld().terrain[0] = 2; f.publish()
    const b = await checkpointObservation({ observationName: api.read().observationName })
    assert.equal(a.checkpointSha256, b.checkpointSha256)
    assert.deepEqual(api.close().errors, []); assert.equal(f.listeners.size, 0); assert.equal(f.clicks.size, 0)
  } finally { api?.close(); f.restore() }
})

test('actual beginLoad captures replacement before its ordinary auto-resume', () => {
  const f = checkpointFixture('load'); let api
  try {
    const changes = []
    const beginLoad = bindLoad({ store: f.store, audio: { current: { reset() {} } },
      setSelectorOpen() {}, setMenu: value => changes.push(['menu', value]), setReady() {}, setError() {},
      loadRequest: {}, setTab() {}, setStartup() {} })
    api = installHutCheckpointBoundary({ kind: 'load' }); f.click()
    const original = f.store.getWorld(); beginLoad({ kind: 'checkpoint' })
    assert.notEqual(f.store.getWorld(), original)
    assert.equal(globalThis.hutTooltipCheckpointBoundary.world.paused, true)
    assert.equal(f.store.getWorld().paused, false)
    assert.deepEqual(changes, [['menu', false]])
    assert.deepEqual(api.close().errors, [])
  } finally { api?.close(); f.restore() }
})

test('untrusted checkpoint input cannot authorize capture; cleanup preserves foreign ownership', () => {
  const f = checkpointFixture('load'); let api
  try {
    api = installHutCheckpointBoundary({ kind: 'load' }); f.click(false); f.store.loadCheckpoint()
    assert.equal(api.read().captured, false); assert.equal(api.read().errors.length, 1)
    const foreign = {}; globalThis.hutTooltipCheckpointBoundary = foreign
    const result = api.close(); assert.equal(result.errors.length, 2)
    assert.equal(globalThis.hutTooltipCheckpointBoundary, foreign)
    assert.equal(f.listeners.size, 0); assert.equal(f.clicks.size, 0)
  } finally { api?.close(); f.restore() }
})

for (const failure of [undefined, null, 0, false, 'failure'])
  test(`cleanup preserves primitive primary failure ${String(failure)}`, async () => {
    let disposed = false, persisted = false, caught = false, actual
    const handle = { async evaluate() { throw Error('cleanup'); }, async dispose() { disposed = true } }
    try { await finishHutHandles([['observer', handle]], {}, () => { persisted = true }, { failed: true, failure }) }
    catch (error) { caught = true; actual = error }
    assert.equal(caught, true); assert.strictEqual(actual, failure)
    assert.equal(disposed, true); assert.equal(persisted, true)
  })
