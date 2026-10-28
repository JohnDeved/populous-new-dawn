import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { captureLoadingFocus } from '../app/loading-focus.ts'
import { createFullscreenSession, placeFullscreenHost } from '../app/fullscreen-session.ts'

// Actual production focus and portal-placement owners with DOM stand-ins. This
// does not prove browser event ordering, trusted activation, layout or rendering.
function fixture(phase = 'failed') {
  const doc = new EventTarget(), win = new EventTarget(), events = []
  const make = name => ({ name, isConnected: true, hidden: false, disabled: false,
    getClientRects() { return this.hidden ? [] : [{}] },
    matches(selector) { assert.equal(selector, ':disabled'); return this.disabled },
    focus() { doc.activeElement = this; events.push(name) },
  })
  const root = make('screen'), fullscreen = make('fullscreen')
  const region = make('region'), summary = make('summary'), retry = make('retry')
  const up = make('up'), down = make('down')
  let controls = phase === 'failed' ? [region, summary, retry, up, down] : []
  let loading = true, dialog = null, resolveRequest, rejectRequest, requests = 0
  root.querySelectorAll = selector => {
    assert.equal(selector, 'summary,button,[data-loading-recovery-scroll][tabindex="0"]')
    return controls
  }
  const host = { parentElement: null, contains: node => node === fullscreen,
    querySelector(selector) { assert.equal(selector, 'button'); return fullscreen },
    remove() { this.parentElement = null },
  }
  doc.body = { appendChild(node) { node.parentElement = this } }
  Object.assign(doc, {
    activeElement: phase === 'failed' ? retry : root,
    defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) },
    fullscreenEnabled: true, fullscreenElement: null,
    documentElement: { requestFullscreen() {
      requests++
      return new Promise((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject })
    } },
    querySelector(selector) {
      if (selector === 'dialog[open]') return dialog
      if (selector === '.loading-world') return loading ? root : null
      if (selector === '[data-fullscreen-control]') return host.parentElement ? host : null
      if (selector === '.world-viewport') return make('world')
      throw Error(`Unexpected selector ${selector}`)
    },
    querySelectorAll(selector) {
      if (selector === 'dialog[open]') return dialog ? [dialog] : []
      if (selector === 'dialog:modal') return []
      throw Error(`Unexpected selector ${selector}`)
    },
  })
  placeFullscreenHost(doc, host)
  const nativeAdd = doc.addEventListener.bind(doc), nativeRemove = doc.removeEventListener.bind(doc)
  const listeners = []
  doc.addEventListener = (type, listener, capture) => {
    listeners.push({ type, listener, capture }); nativeAdd(type, listener, capture)
  }
  doc.removeEventListener = (type, listener, capture) => {
    const index = listeners.findIndex(row => row.type === type && row.listener === listener && row.capture === capture)
    if (index >= 0) listeners.splice(index, 1)
    nativeRemove(type, listener, capture)
  }
  const release = captureLoadingFocus(doc, root)
  function key(key = 'Tab', options = {}) {
    const event = Object.assign(new Event('keydown', { cancelable: true }), {
      key, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...options,
    })
    doc.dispatchEvent(event)
    return event
  }
  return { doc, win, root, fullscreen, region, summary, retry, up, down, host, events, listeners, release, key,
    setControls(next) { controls = next }, setLoading(value) { loading = value },
    setDialog(value) { dialog = value }, requests: () => requests,
    resolveRequest: () => resolveRequest(), rejectRequest: () => rejectRequest(Error('Controlled browser rejection')),
  }
}

for (const phase of ['restore', 'loading']) test(`${phase} reaches and retains the body fullscreen control in both Tab directions`, () => {
  const f = fixture(phase)
  assert.equal(f.host.parentElement, f.doc.body)
  assert.deepEqual(f.listeners.map(({ type, capture }) => [type, capture]), [['keydown', true]])
  assert.equal(f.key().defaultPrevented, true)
  assert.equal(f.doc.activeElement, f.fullscreen)
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.fullscreen)
  f.doc.activeElement = f.root
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.fullscreen)
  f.release()
})

test('failed recovery traverses both loading-to-portal and portal-to-loading boundaries with every overflow control', () => {
  const f = fixture()
  for (const expected of [f.up, f.down, f.fullscreen, f.region, f.summary, f.retry]) {
    f.key(); assert.equal(f.doc.activeElement, expected)
  }
  for (const expected of [f.summary, f.region, f.fullscreen, f.down, f.up, f.retry]) {
    f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, expected)
  }
  f.release()
})

test('late scrollbar controls, forced-colors/asset fallback, and disabled controls are read afresh', () => {
  const f = fixture()
  f.region.hidden = true; f.up.hidden = true; f.down.hidden = true
  f.key(); assert.equal(f.doc.activeElement, f.fullscreen)
  f.key(); assert.equal(f.doc.activeElement, f.summary)
  f.retry.disabled = true
  f.key(); assert.equal(f.doc.activeElement, f.fullscreen)
  f.retry.disabled = false; f.region.hidden = false; f.up.hidden = false; f.down.hidden = false
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.down)
  f.release()
})

test('missing portal or empty pending roster keeps focus inside the loading owner, never the hidden HUD', () => {
  const f = fixture('loading')
  f.host.remove()
  f.doc.activeElement = { name: 'hidden-hud' }
  f.key(); assert.equal(f.doc.activeElement, f.root)
  f.setControls([f.summary, f.retry])
  f.doc.activeElement = { name: 'body' }
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.retry)
  f.doc.activeElement = { name: 'body' }
  f.key(); assert.equal(f.doc.activeElement, f.summary)
  placeFullscreenHost(f.doc, f.host)
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.fullscreen)
  f.release()
})

test('a real dialog takes precedence, and neither a modal-owned portal nor a detached loading root is trapped', () => {
  const f = fixture()
  const modal = { appendChild(node) { node.parentElement = this } }
  f.setDialog(modal); placeFullscreenHost(f.doc, f.host)
  assert.equal(f.host.parentElement, modal)
  assert.equal(f.key().defaultPrevented, false)
  assert.deepEqual(f.events, [])
  f.setDialog(null)
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.summary, 'modal-owned portal is not in loading roster')
  f.root.isConnected = false
  assert.equal(f.key().defaultPrevented, false)
  f.release()
})

test('Enter, Space, Escape and browser modifier shortcuts retain their existing owners', () => {
  const f = fixture('loading')
  for (const key of ['Enter', ' ', 'Escape', 'Home', 'End']) assert.equal(f.key(key).defaultPrevented, false)
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) assert.equal(f.key('Tab', { [modifier]: true }).defaultPrevented, false)
  assert.deepEqual(f.events, [])
  f.release()
})

for (const rejected of [false, true]) test(`pending fullscreen ${rejected ? 'rejection' : 'completion'} keeps its control in the loading cycle`, async () => {
  const f = fixture('loading'), states = []
  const session = createFullscreenSession(f.doc, f.win, state => states.push(state))
  f.key()
  const request = session.toggle()
  assert.equal(states.at(-1).pending, true)
  f.fullscreen.ariaDisabled = true // aria-disabled is deliberately not native :disabled.
  await session.toggle(); assert.equal(f.requests(), 1)
  f.key('Tab', { shiftKey: true }); assert.equal(f.doc.activeElement, f.fullscreen)
  if (rejected) f.rejectRequest(); else f.resolveRequest()
  await request
  assert.equal(states.at(-1).pending, false)
  assert.equal(Boolean(states.at(-1).error), rejected)
  f.key(); assert.equal(f.doc.activeElement, f.fullscreen)
  session.dispose(); f.release(); assert.deepEqual(f.listeners, [])
})

test('retry replacement removes the old capture owner and resolves the new portal and controls', () => {
  const old = fixture()
  old.release(); old.root.isConnected = false
  assert.deepEqual(old.listeners, [])
  assert.equal(old.key().defaultPrevented, false)
  const next = fixture('loading')
  next.key(); assert.equal(next.doc.activeElement, next.fullscreen)
  next.release()
  next.setLoading(false); placeFullscreenHost(next.doc, next.host)
  assert.equal(next.host.parentElement, null)
  assert.equal(next.key().defaultPrevented, false)
})


test('the conservative composed source inventory includes the new application owner exactly once', () => {
  const inputs = JSON.parse(readFileSync(new URL('../scripts/integration-queue/composed-source-inputs.json', import.meta.url)))
  assert.equal(inputs.filter(path => path === 'app/loading-focus.ts').length, 1)
})
