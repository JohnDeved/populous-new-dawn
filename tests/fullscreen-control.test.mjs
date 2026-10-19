import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createFullscreenSession, placeFullscreenHost, promoteFullscreenDialogs, fullscreenHostNeedsPlacement } from '../app/fullscreen-session.ts'

function setup({ supported = true, reject = false } = {}) {
  const doc = new EventTarget(), win = new EventTarget(), states = []
  let time = 0, enters = 0, exits = 0
  Object.assign(doc, {
    fullscreenEnabled: supported, fullscreenElement: null,
    querySelectorAll: () => [],
    documentElement: { requestFullscreen() {
      enters++
      if (reject) return Promise.reject(new Error('denied'))
      doc.fullscreenElement = doc.documentElement
      doc.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    } },
    exitFullscreen() {
      exits++
      doc.fullscreenElement = null
      doc.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    },
  })
  const session = createFullscreenSession(doc, win, state => states.push(state), () => time)
  return { doc, win, states, session, counts: () => [enters, exits], advance: ms => { time += ms } }
}
const key = (type, repeat = false) => Object.assign(new Event(type, { cancelable: true }), { key: 'Escape', repeat })

test('only explicit activation enters/exits; fullscreenchange owns state, repeat requests serialize', async () => {
  const f = setup()
  assert.deepEqual(f.counts(), [0, 0])
  const first = f.session.toggle()
  assert.equal(f.states.at(-1).active, true)
  await f.session.toggle()
  assert.deepEqual(f.counts(), [1, 0])
  await first
  assert.equal(f.states.at(-1).pending, false)
  await f.session.toggle()
  assert.deepEqual(f.counts(), [1, 1])
  assert.equal(f.states.at(-1).active, false)
  f.session.dispose()
})

test('unsupported API and rejected requests report an honest recoverable status', async () => {
  for (const options of [{ supported: false }, { reject: true }]) {
    const f = setup(options)
    await f.session.toggle()
    assert.equal(f.states.at(-1).active, false)
    assert.equal(f.states.at(-1).pending, false)
    assert.match(f.states.at(-1).error, /unavailable|blocked/)
    assert.deepEqual(f.counts(), [options.supported === false ? 0 : 1, 0])
    f.session.dispose()
  }
})

test('Escape preserves browser default but isolates gameplay/modal handling during native exit', async () => {
  const f = setup()
  let gameKeys = 0, modalCancels = 0
  f.win.addEventListener('keydown', () => gameKeys++)
  f.win.addEventListener('cancel', () => modalCancels++)
  f.win.dispatchEvent(key('keydown'))
  assert.equal(gameKeys, 1, 'normal gameplay Escape is unchanged')
  await f.session.toggle()
  const escape = key('keydown')
  f.win.dispatchEvent(escape)
  assert.equal(escape.defaultPrevented, false, 'browser owns native exit')
  assert.equal(gameKeys, 1)
  await f.doc.exitFullscreen()
  const cancel = new Event('cancel', { cancelable: true })
  f.win.dispatchEvent(cancel)
  assert.equal(cancel.defaultPrevented, true)
  assert.equal(modalCancels, 0)
  f.advance(500)
  f.win.dispatchEvent(key('keydown', true))
  assert.equal(gameKeys, 1, 'held Escape never resumes/cancels gameplay')
  f.win.dispatchEvent(key('keyup'))
  f.win.dispatchEvent(key('keydown'))
  assert.equal(gameKeys, 2, 'next distinct Escape works normally')
  f.session.dispose()
})

test('browser-consumed Escape arriving after fullscreenchange is isolated briefly, not permanently', async () => {
  const f = setup()
  await f.session.toggle()
  await f.doc.exitFullscreen()
  let keys = 0
  f.win.addEventListener('keydown', () => keys++)
  f.win.dispatchEvent(key('keydown'))
  f.win.dispatchEvent(key('keyup'))
  assert.equal(keys, 0)
  f.advance(251)
  f.win.dispatchEvent(key('keydown'))
  assert.equal(keys, 1)
  f.session.dispose()
})

test('fullscreen errors and unmount remove handlers and suppress late async state updates', async () => {
  const f = setup()
  f.doc.dispatchEvent(new Event('fullscreenerror'))
  assert.match(f.states.at(-1).error, /blocked/)
  const pending = f.session.toggle()
  f.session.dispose()
  const length = f.states.length
  await pending
  await f.session.toggle()
  f.doc.dispatchEvent(new Event('fullscreenchange'))
  f.doc.dispatchEvent(new Event('fullscreenerror'))
  assert.equal(f.states.length, length)
  let keys = 0
  f.win.addEventListener('keydown', () => keys++)
  f.win.dispatchEvent(key('keydown'))
  assert.equal(keys, 1)
  assert.deepEqual(f.counts(), [1, 0])
})

test('one stable portal follows open dialog, transfers focus only when already focused, returns to body', () => {
  const host = { parentElement: null, contains: node => node === focused }
  let focusCalls = 0, moves = 0
  const focused = { focus: () => focusCalls++ }
  const target = () => ({ appendChild(node) { assert.equal(node, host); node.parentElement = this; moves++ } })
  const body = target(), menu = target(), selector = target()
  let dialogs = []
  const doc = { body, activeElement: null, querySelectorAll: () => dialogs }
  placeFullscreenHost(doc, host)
  assert.equal(host.parentElement, body)
  dialogs = [menu]
  placeFullscreenHost(doc, host)
  assert.equal(host.parentElement, menu)
  assert.equal(focusCalls, 0)
  doc.activeElement = focused
  dialogs = [selector]
  placeFullscreenHost(doc, host)
  assert.equal(host.parentElement, selector)
  assert.equal(focusCalls, 1)
  placeFullscreenHost(doc, host)
  assert.equal(moves, 3, 'no observer mutation loop or duplicate portal')
  dialogs = []
  placeFullscreenHost(doc, host)
  assert.equal(host.parentElement, body)
})

test('shipped app mounts control once and keeps fullscreen available through loading/flyby input guards', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../app/fullscreen-control.tsx', import.meta.url), 'utf8')
  const scene = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  assert.equal(page.match(/<FullscreenControl \/>/g)?.length, 1)
  assert.equal(page.match(/\[data-fullscreen-control\]/g)?.length, 2)
  assert.match(component, /observer\.disconnect\(\)/)
  assert.match(component, /node\.remove\(\)/)
  assert.match(component, /onClick=.*session\.current\?\.toggle/)
  assert.match(scene, /new ResizeObserver\(\(\) => this\.setSize\(\)\)/)
  assert.match(scene, /this\.resize\.observe\(container\)/)
  assert.match(page, /window\.addEventListener\('resize', resize\)/)
})

test('entry re-promotes existing modals above fullscreen without replacing panel DOM or focus', async () => {
  const events = [], focused = { focus: () => events.push('focus') }
  const dialog = {
    close: () => events.push('close'), showModal: () => { events.push('showModal'); dialog.scrollTop = 0 },
    querySelectorAll: () => [], scrollHeight: 100, clientHeight: 40, scrollTop: 25, scrollLeft: 0,
    contains: node => node === focused,
  }
  const f = setup()
  f.doc.activeElement = focused
  f.doc.querySelectorAll = selector => { assert.equal(selector, 'dialog:modal'); return [dialog] }
  await f.session.toggle()
  assert.deepEqual(events, ['close', 'showModal', 'focus'])
  assert.equal(dialog.scrollTop, 25, 'modal promotion preserves scrolled panel position')
  events.length = 0
  await f.session.toggle()
  assert.deepEqual(events, [], 'exit does not close/reopen a modal')
  f.session.dispose()
  promoteFullscreenDialogs({ querySelectorAll: () => [], activeElement: focused })
  assert.deepEqual(events, [], 'gameplay entry never steals focus')
  for (const file of ['original-main-menu.tsx', 'original-pause-menu.tsx', 'page.tsx']) {
    const source = readFileSync(new URL('../app/' + file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /onClose=|addEventListener\(['"]close['"]/, 'promotion must not trigger app close/back handlers')
  }
})

test('ordinary HUD mutations cause no modal traversal or relocation; modal and detached host changes do', () => {
  const host = {}
  const node = (nodeName, includesHost = false) => ({ nodeName, contains: value => includesHost && value === host })
  const child = (addedNodes = [], removedNodes = []) => ({ type: 'childList', addedNodes, removedNodes })
  assert.equal(fullscreenHostNeedsPlacement([child([node('#text'), node('SPAN')], [node('DIV')])], host), false)
  assert.equal(fullscreenHostNeedsPlacement([{ type: 'attributes', target: node('DETAILS') }], host), false)
  assert.equal(fullscreenHostNeedsPlacement([child([node('DIALOG')])], host), true)
  assert.equal(fullscreenHostNeedsPlacement([child([], [node('DIALOG')])], host), true)
  assert.equal(fullscreenHostNeedsPlacement([{ type: 'attributes', target: node('DIALOG') }], host), true)
  assert.equal(fullscreenHostNeedsPlacement([child([], [node('MAIN', true)])], host), true)
})
