import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import {
  assertWorshipFocusObservation,
  installWorshipFocusObserver,
} from '../scripts/tutorial-browser/worship-focus-observer.mjs'

// Supplied target/listener ordering and event fields test checker behavior only.
// isTrusted:true below is modeled data, NOT browser-generated trusted input.
// This is not production ObjectPanels, DOM, RAF, or rendered-browser evidence.
function fixture({ inspected = 13, panel = { kind: 'person' } } = {}) {
  const listeners = [], child = {}, events = []
  const button = {
    dataset: { person: '13' },
    contains: target => target === child,
    addEventListener(type, callback, options = {}) { listeners.push({ type, callback, options }) },
    removeEventListener(type, callback) {
      const index = listeners.findIndex(x => x.type === type && x.callback === callback)
      if (index !== -1) listeners.splice(index, 1)
    },
  }
  const h = { button, units: [{ id: 13 }], scene: { objectPanels: { inspected: null, panels: new Map() } } }
  button.addEventListener('contextmenu', () => {
    events.push('supplied production listener')
    h.scene.objectPanels.inspected = inspected
    if (panel) h.scene.objectPanels.panels.set(13, panel)
  })
  // Like page.evaluate, evaluate the actual exported function without its module closure.
  vm.runInNewContext(`(${installWorshipFocusObserver.toString()})()`, { window: { worshipLifecycle: h } })
  const dispatch = (overrides = {}) => {
    const event = { type: 'contextmenu', isTrusted: true, target: button, currentTarget: button, ...overrides }
    for (const listener of [...listeners]) {
      if (listener.type !== event.type) continue
      if (listener.options.once) button.removeEventListener(listener.type, listener.callback)
      listener.callback(event)
    }
  }
  return { h, button, child, events, listeners, dispatch }
}

test('missing input fails instead of accepting an unobserved focus', () => {
  const f = fixture()
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13))
  f.h.stopWorshipFocusObservation()
})

for (const inspected of [null, 14]) test(`synchronous inspected=${inspected} still fails`, () => {
  const f = fixture({ inspected })
  f.dispatch()
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13), /synchronously inspect/)
})

for (const panel of [null, { kind: 'head' }]) test(`missing/wrong person panel (${panel?.kind ?? 'missing'}) fails`, () => {
  const f = fixture({ panel })
  f.dispatch()
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13), /person panel/)
})

for (const field of ['isTrusted', 'currentTarget', 'target']) test(`invalid ${field} fails`, () => {
  const f = fixture()
  f.dispatch({ [field]: field === 'isTrusted' ? false : {} })
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13))
})

test('a replaced retained button fails', () => {
  const f = fixture()
  f.h.button = {}
  f.dispatch()
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13), /must not be replaced/)
})

test('a changed person identity fails', () => {
  const f = fixture()
  f.button.dataset.person = '14'
  f.dispatch()
  assert.throws(() => assertWorshipFocusObservation(f.h.worshipFocusObservation, 13), /expected person/)
})

test('absent sample or invalid observation cardinality fails', () => {
  for (const observation of [null, { count: 0, sample: null }, { count: 1, sample: null }, { count: 2, sample: {} }])
    assert.throws(() => assertWorshipFocusObservation(observation, 13))
})

test('post-handler scalars survive a later ownership release without fabricating a hold', () => {
  const f = fixture()
  assert.equal(f.h.worshipFocusObservation.sample, null)
  f.dispatch()
  assert.deepEqual(f.events, ['supplied production listener'])
  assertWorshipFocusObservation(f.h.worshipFocusObservation, 13)
  f.h.scene.objectPanels.inspected = null // Model the later sample; not a production update/RAF witness.
  assert.equal(f.h.scene.objectPanels.inspected, null)
  assert.equal(f.h.worshipFocusObservation.sample.inspected, 13)
  assertWorshipFocusObservation(f.h.worshipFocusObservation, 13)
  assert.equal(f.h.scene.objectPanels.panels.get(13).kind, 'person')
})

test('a descendant input target is still owned by the exact retained button', () => {
  const f = fixture()
  f.dispatch({ target: f.child })
  assertWorshipFocusObservation(f.h.worshipFocusObservation, 13)
})

test('one-shot recording stays bounded and cannot be overwritten by later synthetic stale input', () => {
  const f = fixture()
  f.dispatch()
  const sample = f.h.worshipFocusObservation.sample
  f.dispatch({ isTrusted: false })
  assert.equal(f.h.worshipFocusObservation.count, 1)
  assert.equal(f.h.worshipFocusObservation.sample, sample)
  assertWorshipFocusObservation(f.h.worshipFocusObservation, 13)
  assert.equal(f.events.length, 2) // Observer does not suppress the real target's listeners.
})

test('early or repeated cleanup removes only the observer and preserves the production listener', () => {
  const f = fixture()
  f.h.stopWorshipFocusObservation()
  f.h.stopWorshipFocusObservation()
  f.dispatch()
  assert.deepEqual(f.events, ['supplied production listener'])
  assert.equal(f.h.worshipFocusObservation.count, 0)
  assert.equal(f.h.worshipFocusObservation.sample, null)
  assert.equal(f.listeners.length, 1)
})
