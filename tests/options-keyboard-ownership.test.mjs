import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Evaluate the actual pause dialog handler. The retained actual-Home browser
// comparison owns React propagation, focus, sliders and return navigation proof.
const source = ts.createSourceFile('original-pause-menu.tsx', readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let dialogNode
function visit(node) {
  if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'dialog') dialogNode = node
  ts.forEachChild(node, visit)
}
visit(source)
assert.ok(dialogNode)
const handler = name => {
  const attribute = dialogNode.attributes.properties.find(p => p.name?.getText(source) === name)
  assert.ok(attribute?.initializer?.expression)
  return ts.transpileModule(`(${attribute.initializer.expression.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
}
function fixture(panel, active = 1) {
  let prevented = 0, queries = 0, backs = 0
  const document = { activeElement: null }
  const buttons = [0, 1, 2].map(id => ({ id, focus() { document.activeElement = this } }))
  document.activeElement = buttons[active]
  const dialog = { current: { querySelectorAll(selector) {
    queries++
    assert.equal(selector, 'nav button:not(:disabled)')
    return buttons
  } } }
  const keydown = Function('panel', 'dialog', 'document', `return ${handler('onKeyDown')}`)(panel, dialog, document)
  const cancel = Function('back', `return ${handler('onCancel')}`)(() => backs++)
  return { buttons, document, keydown, cancel,
    event(key, input = false) { return { key, target: { closest: () => input }, preventDefault() { prevented++ } } },
    counts: () => ({ prevented, queries, backs }) }
}

test('pause Options keeps ownership of arrow/Home/End focus outside and inside category navigation', () => {
  for (const control of ['Rotation', 'Flip Rotation', 'Back', 'Browser compatibility', 'Direct3D', 'category']) {
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
      const ui = fixture('options')
      const focused = { control }
      ui.document.activeElement = focused
      ui.keydown(ui.event(key))
      assert.equal(ui.document.activeElement, focused, `${control}: ${key}`)
      assert.deepEqual(ui.counts(), { prevented: 0, queries: 0, backs: 0 })
    }
  }
})

test('pause root and confirmation navigation retain enabled-row keyboard behavior', () => {
  for (const panel of ['root', 'restart', 'quit-game'])
    for (const [key, expected] of [['ArrowUp', 0], ['ArrowDown', 2], ['Home', 0], ['End', 2]]) {
      const ui = fixture(panel)
      ui.keydown(ui.event(key))
      assert.equal(ui.document.activeElement, ui.buttons[expected])
      assert.deepEqual(ui.counts(), { prevented: 1, queries: 1, backs: 0 })
    }
})

test('native slider keys and Tab are left to their controls', () => {
  for (const panel of ['root', 'options'])
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab']) {
      const ui = fixture(panel)
      ui.keydown(ui.event(key, key !== 'Tab'))
      assert.deepEqual(ui.counts(), { prevented: 0, queries: 0, backs: 0 })
    }
})

test('Options Escape still reaches the dialog cancel/back owner', () => {
  const ui = fixture('options')
  ui.keydown(ui.event('Escape'))
  assert.deepEqual(ui.counts(), { prevented: 0, queries: 0, backs: 0 })
  ui.cancel(ui.event('Escape'))
  assert.deepEqual(ui.counts(), { prevented: 1, queries: 0, backs: 1 })
})

// Bind the real frontend F8 entry/render gate, Debug mount/cancel and Options
// capture owner. The supplied DOM/event ordering is a source-level model, not
// browser top-layer/focus proof; actual rendered stacking remains a separate gate.
const ownerSource = name => ts.createSourceFile(name,
  readFileSync(new URL(`../app/${name}`, import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const optionsOwnerSource = ownerSource('original-options.tsx')
const homeOwnerSource = ownerSource('page.tsx')
const debugOwnerSource = ownerSource('debug-mission-picker.tsx')
function ownerNode(source, predicate) {
  const found = []
  function visit(node) {
    if (predicate(node)) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(found.length, 1, 'one actual source owner')
  return found[0]
}
const ownerEffect = (source, marker) => ownerNode(source, node =>
  ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
  node.arguments[0]?.getText(source).includes(marker)).arguments[0].getText(source)
const optionsEscapeEffect = ownerEffect(optionsOwnerSource, "document.addEventListener('keydown', keydown, true)")
const homeF8Effect = ownerEffect(homeOwnerSource, "event.key !== 'F8'")
const debugMountEffect = ownerEffect(debugOwnerSource, 'element?.showModal()')
function ownerAttribute(source, tag, name) {
  const node = ownerNode(source, node =>
    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === tag)
  const value = node.attributes.properties.find(attribute => attribute.name?.getText(source) === name)
  assert.ok(value?.initializer?.expression, `actual ${tag} ${name}`)
  return value.initializer.expression.getText(source)
}
const debugCancel = ownerAttribute(debugOwnerSource, 'dialog', 'onCancel')
const homeDebugClose = ownerAttribute(homeOwnerSource, 'DebugMissionPicker', 'onClose')
const unwrapOwner = node => ts.isParenthesizedExpression(node) ? unwrapOwner(node.expression) : node
const mainRenderGate = ownerNode(homeOwnerSource, node => {
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return false
  const right = unwrapOwner(node.right)
  return ts.isJsxSelfClosingElement(right) && right.tagName.getText(homeOwnerSource) === 'OriginalMainMenu'
}).left.getText(homeOwnerSource)
function evaluateOwner(expression, bindings) {
  const emitted = ts.transpileModule(`(${expression})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText
  return new Function(...Object.keys(bindings), `return ${emitted}`)(...Object.values(bindings))
}
function modalOwnerFixture() {
  const windowKeys = new Set(), documentKeys = new Set(), frames = [], focused = []
  let browser = true, debug = false, helpCleanup, debugCleanup, cancelCount = 0
  class Element {
    constructor(name, owner = null) { this.name = name; this.owner = owner }
    closest(selector) {
      if (selector === 'dialog') return this.owner
      assert.equal(selector, 'input,textarea,select,[contenteditable]')
      return this.input ? this : null
    }
    focus() { document.activeElement = this; focused.push(this.name) }
  }
  const main = new Element('main-dialog'), picker = new Element('debug-dialog')
  main.owner = main; main.open = true
  picker.owner = picker; picker.open = false
  const heading = new Element('help-heading', main), back = new Element('compatibility-row', main)
  const debugHeading = new Element('debug-heading', picker), debugButton = new Element('debug-button', picker)
  const fullscreen = new Element('fullscreen', main), debugFullscreen = new Element('debug-fullscreen', picker)
  const body = new Element('body'), input = new Element('input', main); input.input = true
  const element = new Element('options', main)
  element.querySelector = selector => { assert.equal(selector, '[data-compatibility]'); return back }
  picker.querySelector = selector => { assert.equal(selector, 'h2'); return debugHeading }
  picker.showModal = () => { assert.equal(picker.open, false); picker.open = true }
  picker.close = () => { picker.open = false; heading.focus() }
  const document = {
    activeElement: heading,
    querySelectorAll(selector) { assert.equal(selector, 'dialog[open]'); return [main, picker].filter(dialog => dialog.open) },
    addEventListener(type, handler, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); documentKeys.add(handler) },
    removeEventListener(type, handler, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); documentKeys.delete(handler) },
  }
  const window = {
    addEventListener(type, handler, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); windowKeys.add(handler) },
    removeEventListener(type, handler, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); windowKeys.delete(handler) },
  }
  const setDebugPicker = next => { debug = typeof next === 'function' ? next(debug) : next }
  const onClose = evaluateOwner(homeDebugClose, { setDebugPicker })
  const cancel = evaluateOwner(debugCancel, { onClose })
  const mainStillRendered = () => !!evaluateOwner(mainRenderGate, {
    startup: 'choice', startupLogoDone: true, startupCampaign: false, frontendAssets: {}, debugPicker: debug,
  })
  const f8Cleanup = evaluateOwner(homeF8Effect, {
    startup: 'choice', startupLogoDone: true, selectorOpen: false, setDebugPicker, globalThis: window,
  })()
  helpCleanup = evaluateOwner(optionsEscapeEffect, {
    browser, root: { current: element }, document, Element,
    setBrowser(next) { browser = next }, requestAnimationFrame(callback) { frames.push(callback) },
  })()
  function flush() {
    if (debug && !debugCleanup)
      debugCleanup = evaluateOwner(debugMountEffect, { dialog: { current: picker } })()
    else if (!debug && debugCleanup) { debugCleanup(); debugCleanup = undefined }
    if (!browser && helpCleanup) { helpCleanup(); helpCleanup = undefined }
    while (frames.length) frames.shift()()
  }
  function event(key, target = document.activeElement, extra = {}) {
    return { key, target, repeat: false, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false,
      defaultPrevented: false, propagationStopped: false, immediateStopped: false,
      preventDefault() { this.defaultPrevented = true },
      stopPropagation() { this.propagationStopped = true },
      stopImmediatePropagation() { this.immediateStopped = true; this.propagationStopped = true },
      ...extra }
  }
  function dispatch(key, target, extra) {
    const value = event(key, target, extra)
    for (const handler of windowKeys) { handler(value); if (value.immediateStopped) break }
    if (!value.propagationStopped) for (const handler of documentKeys) handler(value)
    // Supplied native default dispatch: the actual Debug cancel callback is used.
    // Browser event ordering and top-layer behavior are not executed by this model.
    if (key === 'Escape' && !value.defaultPrevented && picker.open) {
      cancelCount++
      cancel({ preventDefault() {} })
    }
    flush()
    return value
  }
  function unmount() {
    helpCleanup?.(); helpCleanup = undefined
    debugCleanup?.(); debugCleanup = undefined
    f8Cleanup?.()
  }
  return { dispatch, event, mainStillRendered, main, picker, document, heading, debugHeading,
    debugButton, fullscreen, debugFullscreen, body, input, focused,
    state: () => ({ browser, debug, cancelCount, helpListeners: documentKeys.size, windowListeners: windowKeys.size }),
    unmount }
}

test('actual frontend F8 Debug Escape closes only Debug and preserves underlying Options help', () => {
  for (const origin of ['debugHeading', 'debugButton', 'debugFullscreen']) {
    const ui = modalOwnerFixture()
    try {
      assert.equal(ui.mainStillRendered(), true)
      ui.dispatch('F8', ui.heading)
      assert.equal(ui.mainStillRendered(), true, 'actual Home retains Main Menu under Debug')
      assert.equal(ui.main.open, true); assert.equal(ui.picker.open, true)
      assert.equal(ui.document.activeElement, ui.debugHeading, 'actual Debug mount focuses its heading')
      const escape = ui.dispatch('Escape', ui[origin])
      assert.equal(escape.defaultPrevented, false, 'underlying help yields the top dialog key')
      assert.equal(escape.propagationStopped, false)
      assert.deepEqual(ui.state(), { browser: true, debug: false, cancelCount: 1, helpListeners: 1, windowListeners: 1 })
      assert.equal(ui.main.open, true); assert.equal(ui.picker.open, false)
      assert.equal(ui.focused.includes('compatibility-row'), false, 'inert help was not dismissed')
      assert.equal(ui.dispatch('Escape', ui.heading).defaultPrevented, true)
      assert.equal(ui.state().browser, false, 'next owned Escape retains normal Help -> Options')
      assert.equal(ui.focused.at(-1), 'compatibility-row')
    } finally { ui.unmount() }
  }
})

test('ambiguous body or non-Element Escape yields while the actual F8 Debug dialog is open', () => {
  for (const origin of ['body', 'document', 'null']) {
    const ui = modalOwnerFixture()
    try {
      ui.dispatch('F8', ui.heading)
      ui.document.activeElement = ui.body
      const target = origin === 'null' ? null : ui[origin]
      const escape = ui.dispatch('Escape', target)
      assert.equal(escape.defaultPrevented, false)
      assert.equal(ui.state().cancelCount, 1)
      assert.equal(ui.state().debug, false)
      assert.equal(ui.state().browser, true)
      assert.equal(ui.focused.includes('compatibility-row'), false)
    } finally { ui.unmount() }
  }
})

test('single-dialog help preserves owned, fullscreen and safe body/document fallback Escape', () => {
  for (const origin of ['heading', 'fullscreen', 'body', 'document', 'null']) {
    const ui = modalOwnerFixture()
    try {
      const escape = ui.dispatch('Escape', origin === 'null' ? null : ui[origin])
      assert.equal(escape.defaultPrevented, true)
      assert.equal(escape.propagationStopped, true)
      assert.equal(ui.state().browser, false)
      assert.equal(ui.state().helpListeners, 0, 'real effect cleanup removes the capture owner')
      assert.equal(ui.state().cancelCount, 0)
      assert.equal(ui.main.open, true)
      assert.equal(ui.focused.at(-1), 'compatibility-row')
    } finally { ui.unmount() }
    assert.equal(ui.state().windowListeners, 0)
  }
})

test('already-owned keys, non-Escape, closed dialogs and unmount have no Options Escape side effects', () => {
  for (const control of ['prevented', 'other-key', 'closed', 'unmounted']) {
    const ui = modalOwnerFixture()
    try {
      if (control === 'closed') ui.main.open = false
      if (control === 'unmounted') ui.unmount()
      const value = ui.dispatch(control === 'other-key' ? 'Tab' : 'Escape', ui.heading,
        control === 'prevented' ? { defaultPrevented: true } : {})
      assert.equal(ui.state().browser, true)
      assert.equal(ui.state().debug, false)
      assert.equal(value.propagationStopped, false)
      assert.equal(ui.focused.length, 0)
    } finally { if (control !== 'unmounted') ui.unmount() }
  }
})

test('actual frontend F8 entry retains repeat/modifier/form-control guards', () => {
  for (const control of ['repeat', 'ctrlKey', 'altKey', 'metaKey', 'shiftKey', 'input']) {
    const ui = modalOwnerFixture()
    try {
      const value = ui.dispatch('F8', control === 'input' ? ui.input : ui.heading,
        control === 'input' ? {} : { [control]: true })
      assert.equal(value.defaultPrevented, false)
      assert.equal(ui.state().debug, false)
      assert.equal(ui.state().browser, true)
      assert.equal(ui.state().cancelCount, 0)
    } finally { ui.unmount() }
  }
})
