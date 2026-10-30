import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { evaluatePage } from './support/follower-nearby-page.mjs'
import { createFullscreenSession, placeFullscreenHost, promoteFullscreenDialogs, fullscreenHostNeedsPlacement } from '../app/fullscreen-session.ts'

function nativeCloseBindings(text) {
  const source = ts.createSourceFile('modal.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    found = []
  const member = node => ts.isPropertyAccessExpression(node) ? node.name.text
    : ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text
      : ts.isIdentifier(node) ? node.text : undefined
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      /^[a-z]/.test(node.tagName.getText(source)) &&
      node.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'onClose'))
      found.push('native JSX onClose')
    if (ts.isCallExpression(node) && member(node.expression) === 'addEventListener' &&
      node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === 'close')
      found.push('close event listener')
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      member(node.left) === 'onclose') found.push('onclose assignment')
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

test('modal close-binding audit distinguishes custom callbacks from native close handlers', () => {
  assert.deepEqual(nativeCloseBindings('<SpellTestMenu onClose={closeMenu} />'), [])
  assert.deepEqual(nativeCloseBindings('<dialog onCancel={cancel} onKeyDown={key} />'), [])
  assert.deepEqual(nativeCloseBindings('<dialog onClose={closeMenu} />'), ['native JSX onClose'])
  assert.deepEqual(nativeCloseBindings('<div onClose={closeMenu}><dialog /></div>'), ['native JSX onClose'])
  assert.deepEqual(nativeCloseBindings('dialog.addEventListener("close", closeMenu)'), ['close event listener'])
  assert.deepEqual(nativeCloseBindings('dialog.onclose = closeMenu'), ['onclose assignment'])
})

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

function portalFixture() {
  let dialogs = [], loading = false, moves = 0, removals = 0
  const doc = { activeElement: null,
    querySelectorAll: selector => { assert.equal(selector, 'dialog[open]'); return dialogs },
    querySelector: selector => selector === '.loading-world' ? loading ? {} : null
      : selector === '.world-viewport' ? viewport : null,
  }
  const target = () => ({ appendChild(node) { assert.equal(node, host); node.parentElement = this; moves++ } })
  const body = target(), menu = target(), selector = target()
  doc.body = body
  const focusCalls = []
  const viewport = { focus(options) { assert.deepEqual(options, { preventScroll: true }); doc.activeElement = viewport; focusCalls.push('viewport') } }
  const button = { focus(options) { assert.deepEqual(options, { preventScroll: true }); doc.activeElement = button; focusCalls.push('button') } }
  const host = { parentElement: null, contains: node => node === button,
    remove() { this.parentElement = null; removals++; if (doc.activeElement === button) doc.activeElement = body },
  }
  return { doc, host, body, menu, selector, button, viewport, focusCalls,
    get moves() { return moves }, get removals() { return removals },
    place(modals = [], isLoading = false) { dialogs = modals; loading = isLoading; placeFullscreenHost(doc, host) },
  }
}

test('fullscreen is detached in gameplay and follows existing dialogs/loading without stealing focus', () => {
  const f = portalFixture()
  f.place()
  assert.equal(f.host.parentElement, null, 'no battlefield overlay or invisible tab stop')
  assert.equal(f.moves, 0)
  f.place([f.menu])
  assert.equal(f.host.parentElement, f.menu)
  assert.deepEqual(f.focusCalls, [])
  f.doc.activeElement = f.button
  f.place([f.menu, f.selector])
  assert.equal(f.host.parentElement, f.selector, 'topmost open dialog owns the portal')
  assert.deepEqual(f.focusCalls, ['button'])
  f.place([f.menu, f.selector])
  assert.equal(f.moves, 2, 'stable owner cannot start an observer mutation loop')
  f.place([], true)
  assert.equal(f.host.parentElement, f.body, 'body placement is only allowed during loading/recovery')
  assert.deepEqual(f.focusCalls, ['button', 'button'])
  f.place()
  assert.equal(f.host.parentElement, null)
  assert.equal(f.doc.activeElement, f.viewport, 'a removed focused browser control returns focus to the world')
  assert.deepEqual(f.focusCalls, ['button', 'button', 'viewport'])
  f.place()
  assert.equal(f.removals, 1, 'detached host causes no repeated removal or focus writes')
  f.place([f.menu])
  assert.equal(f.doc.activeElement, f.viewport, 'reopening does not resurrect stale portal focus')
})

test('closing a menu never replaces focus already restored by its modal owner', () => {
  const f = portalFixture()
  f.place([f.menu])
  const trigger = {}
  f.doc.activeElement = trigger
  f.place()
  assert.equal(f.host.parentElement, null)
  assert.equal(f.doc.activeElement, trigger)
  assert.deepEqual(f.focusCalls, [])
})

test('shipped app mounts control once and keeps fullscreen available through loading/flyby input guards', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../app/fullscreen-control.tsx', import.meta.url), 'utf8')
  const sceneSource = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  assert.equal(page.match(/<FullscreenControl \/>/g)?.length, 1)
  const source = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const guards = new Map()
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'closest' && ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.split(',').includes('[data-fullscreen-control]')) {
      let guard = node.parent, owner = node.parent
      while (guard && !ts.isIfStatement(guard)) guard = guard.parent
      while (owner && !(ts.isVariableDeclaration(owner) || ts.isFunctionDeclaration(owner) || ts.isJsxAttribute(owner)))
        owner = owner.parent
      assert.ok(guard && owner, 'fullscreen exclusion belongs to a live input guard')
      const name = owner.name.getText(source)
      assert.equal(guards.has(name), false, 'one fullscreen guard per input owner')
      guards.set(name, guard.expression.getText(source))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.deepEqual([...guards.keys()].sort(), ['blockLoadingInteraction', 'key', 'onClickCapture', 'up'],
    'loading/flyby and native result keydown/keyup each retain their fullscreen exclusion')
  const world = { inputMask: 64 }, scene = { world }
  for (const [owner, expression] of guards) for (const fullscreen of [false, true]) {
    const event = { key: ' ', code: 'Space', target: { closest: () => fullscreen ? {} : null } }
    const guardTaken = Boolean(evaluatePage(expression, {
      ready: owner !== 'blockLoadingInteraction', startup: 'playing', current: world, world, scene,
      engine: { current: scene }, store: { getWorld: () => world }, resultSession: { stage: () => 'statistics' },
      menu: false, cheatsOpen: false, selectorOpen: false, debugPicker: false,
      messageDetails: { current: new Map() }, event, e: event,
    }))
    assert.equal(guardTaken, owner === 'onClickCapture' ? !fullscreen : fullscreen,
      `${owner}: fullscreen target must bypass game input without removing the ordinary guard`)
  }
  assert.match(component, /observer\.disconnect\(\)/)
  assert.match(component, /node\.remove\(\)/)
  assert.match(component, /onClick=.*session\.current\?\.toggle/)
  assert.match(sceneSource, /new ResizeObserver\(\(\) => this\.setSize\(\)\)/)
  assert.match(sceneSource, /this\.resize\.observe\(container\)/)
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
  for (const file of ['original-main-menu.tsx', 'original-pause-menu.tsx', 'page.tsx', 'spell-test-menu.tsx']) {
    const source = readFileSync(new URL('../app/' + file, import.meta.url), 'utf8')
    assert.deepEqual(nativeCloseBindings(source), [], `${file}: promotion must not trigger app close/back handlers`)
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

test('loading/recovery insertion and removal trigger placement, but obsolete footer mutations do not', () => {
  const host = {}
  const element = classes => ({ nodeName: 'DIV', nodeType: 1, contains: () => false,
    matches: selector => selector.split(',').some(name => classes.includes(name)) })
  for (const [addedNodes, removedNodes] of [[[element(['.loading-world'])], []], [[], [element(['.loading-world'])]]])
    assert.equal(fullscreenHostNeedsPlacement([{ type: 'childList', addedNodes, removedNodes }], host), true)
  assert.equal(fullscreenHostNeedsPlacement([{ type: 'childList', addedNodes: [element(['.top-actions'])], removedNodes: [] }], host), false)
})
