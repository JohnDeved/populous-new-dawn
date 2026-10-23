import test from 'node:test'
import assert from 'node:assert/strict'
import { assertCheckpointCapsOccupied } from '../scripts/local-render/checkpoint-scrollbar-observation.mjs'
import { observeFullscreenClearance as original } from './fixtures/fullscreen-clearance-before-batch.mjs'
import { observeFullscreenClearance, assertFullscreenClearance, assertPauseFullscreenIntegrity, assertPauseHudCount } from '../scripts/local-render/fullscreen-clearance.mjs'

function fixture(change = {}) {
  const rect = { x: 12, y: 12, width: 17, height: 14, right: 29, bottom: 26 }
  const button = { getBoundingClientRect: () => rect, contains: n => n === button,
    matches: () => change.visible !== false, getAttribute: () => 'Fullscreen' }
  const occupied = { getBoundingClientRect: () => ({ x: 50, y: 50, right: 300, bottom: 200 }), getAttribute: name => name === 'aria-label' ? 'menu controls' : null }
  const control = { getAttribute: () => null }, wrongOwnerControl = {}, calls = []
  const caps = ['up', 'down'].map(direction => ({
    getAttribute: name => name === 'data-pause-checkpoint-cap' ? direction : `Scroll checkpoint details ${direction}`,
    getBoundingClientRect: () => change.capOverlap ? rect : { x: 200, y: 100, right: 224, bottom: 112 },
  }))
  const controls = change.empty ? [] : [control, ...(change.caps ? caps : [])]
  const shadowControl = { getAttribute: () => null }
  const scopes = change.wrongScope ? [] : [{ querySelectorAll(selector) {
    assert.equal(selector, ':scope > :not([data-fullscreen-control]) button'); return controls
  } }]
  if (change.duplicateScope) scopes.push(scopes[0])
  const document = {
    activeElement: change.focused === false ? null : button,
    querySelector(selector) { assert.equal(selector, '[data-fullscreen-control]'); return change.missing ? null : {
      querySelector: () => button, parentElement: { matches: () => change.owner !== false },
    } },
    querySelectorAll(selector) {
      if (selector === '.native-hud') return Array(change.hudCount ?? 1).fill({})
      if (selector === '[data-fullscreen-control]') return Array(change.duplicates ? 2 : 1).fill({})
      if (selector === 'occupied') return [occupied, ...(change.caps ? caps.slice(change.omitCap ? 1 : 0) : [])]
      if (selector === 'all-dialog-buttons') return [...controls, wrongOwnerControl]
      throw Error('Unexpected broad selector: ' + selector)
    },
    elementFromPoint: () => change.hit === false ? {} : button,
  }
  const style = () => ({ outlineStyle: 'none' })
  const invoke = (fn, scope, args, all) => new Function('document', 'innerWidth', 'innerHeight', 'getComputedStyle', 'scope', 'args',
    `return (${fn})(${all ? 'scope, args' : 'args'})`)(document, 320, 240, style, scope, args)
  const page = { evaluate: async (fn, args) => { calls.push('page.evaluate'); return invoke(fn, null, args, false) },
    locator(selector) {
      assert.equal(selector, '.native-hud')
      return { async count() { calls.push('original HUD locator count'); return (change.hudCount ?? 1) + (change.shadowHudCount ?? 0) } }
    } }
  // This is the original exact role/name locator, not a new document selector.
  const resolved = [...new Set(scopes.flatMap(dialog => dialog.querySelectorAll(':scope > :not([data-fullscreen-control]) button')))]
  if (change.shadowControls) resolved.push(shadowControl)
  if (change.shadowCaps) resolved.push(...caps)
  const modal = { evaluateAll: async (fn, args) => { calls.push('controlsLocator.evaluateAll'); return invoke(fn, resolved, args, true) } }
  return { page, modal, calls, legacyCounts: { hudCount: (change.hudCount ?? 1) + (change.shadowHudCount ?? 0),
    nativeControlCount: resolved.length } }
}

test('atomic batch returns the identical original geometry and exact scoped counts in one RPC', async () => {
  for (const change of [{}, { duplicateScope: true }, { shadowControls: true }, { focused: false }, { visible: false }, { owner: false }, { duplicates: true }]) {
    const f = fixture(change)
    const old = await original(f.page, 'owner', 'occupied')
    const plain = await observeFullscreenClearance(f.page, 'owner', 'occupied')
    const batch = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal)
    assert.deepEqual(plain, old); assert.deepEqual(batch.sample, old)
    assert.deepEqual(batch.integrity, { nativeControlCount: f.legacyCounts.nativeControlCount })
    assert.deepEqual(f.calls, ['page.evaluate', 'page.evaluate', 'controlsLocator.evaluateAll'])
  }
})

test('missing/duplicate HUD and empty/wrong-scope controls preserve exact count failures', async () => {
  for (const change of [{ hudCount: 0 }, { hudCount: 2 }, { shadowHudCount: 1 }, { empty: true }, { wrongScope: true }]) {
    const f = fixture(change), result = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal)
    let oldError
    try {
      assert.equal(f.legacyCounts.hudCount, 1, 'Live native HUD/minimap geometry is required')
      assert.ok(f.legacyCounts.nativeControlCount > 0, 'Native menu controls cannot disappear from clearance coverage')
    } catch (error) { oldError = error }
    await assert.rejects(async () => { await assertPauseHudCount(f.page); assertPauseFullscreenIntegrity(result.integrity) }, error => {
      assert.equal(error.message, oldError.message); assert.equal(error.actual, oldError.actual)
      assert.equal(error.expected, oldError.expected); return true
    })
  }
})

test('batching does not weaken missing fullscreen, duplicate portal, wrong owner or interception checks', async () => {
  for (const change of [{ missing: true }, { duplicates: true }, { owner: false }, { hit: false }]) {
    const f = fixture(change), old = await original(f.page, 'owner', 'occupied')
    const result = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal)
    assertPauseFullscreenIntegrity(result.integrity)
    let oldError
    try { assertFullscreenClearance(old) } catch (error) { oldError = error }
    assert.ok(oldError)
    assert.throws(() => assertFullscreenClearance(result.sample), error => error.message === oldError.message)
  }
})


test('HUD uniqueness retains the real Playwright locator count including open shadow roots', async () => {
  for (const change of [{ hudCount: 0 }, { hudCount: 2 }, { hudCount: 1, shadowHudCount: 1 }, { hudCount: 0, shadowHudCount: 2 }]) {
    const f = fixture(change)
    await assert.rejects(assertPauseHudCount(f.page), /Live native HUD/)
    assert.deepEqual(f.calls, ['original HUD locator count'])
  }
  for (const change of [{}, { hudCount: 0, shadowHudCount: 1 }]) {
    const f = fixture(change)
    await assert.doesNotReject(assertPauseHudCount(f.page))
    assert.deepEqual(f.calls, ['original HUD locator count'])
  }
})


test('explicit checkpoint cap witnesses retain the exact control locator and broad occupied geometry', async () => {
  const f = fixture({ caps: true })
  const result = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal, { checkpointCaps: true })
  assert.deepEqual(result.integrity, { nativeControlCount: 3, checkpointCaps: ['up', 'down'] })
  assertCheckpointCapsOccupied(result.integrity.checkpointCaps, result.sample)
  assertFullscreenClearance(result.sample)
  assert.deepEqual(f.calls, ['controlsLocator.evaluateAll'])
})

test('caps omitted from occupied data, including shadow-resolved controls, cannot pass silently', async () => {
  for (const change of [{ caps: true, omitCap: true }, { shadowCaps: true }]) {
    const f = fixture(change)
    const result = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal, { checkpointCaps: true })
    assert.throws(() => assertCheckpointCapsOccupied(result.integrity.checkpointCaps, result.sample), /Every resolved cap/)
  }
  const f = fixture({ caps: true, capOverlap: true })
  const result = await observeFullscreenClearance(f.page, 'owner', 'occupied', f.modal, { checkpointCaps: true })
  assertCheckpointCapsOccupied(result.integrity.checkpointCaps, result.sample)
  assert.throws(() => assertFullscreenClearance(result.sample), /Fullscreen must clear/)
})
