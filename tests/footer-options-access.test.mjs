import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const text = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const source = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const elements = []
const functions = new Map()
function visit(node) {
  if (ts.isJsxElement(node)) elements.push(node)
  if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node)
  ts.forEachChild(node, visit)
}
visit(source)
const attrs = node => new Map(node.openingElement.attributes.properties
  .filter(ts.isJsxAttribute).map(a => [a.name.getText(source), a.initializer]))
const literal = node => node && ts.isStringLiteral(node) ? node.text : undefined
const expression = node => {
  assert.ok(node && ts.isJsxExpression(node) && node.expression)
  return node.expression.getText(source)
}
const evaluate = (code, bindings) => new Function(...Object.keys(bindings), `return (${code})`)(...Object.values(bindings))
const footer = elements.find(node => literal(attrs(node).get('className')) === 'top-actions')

test('current footer retains Pause and Settings but no longer duplicates Options audio', () => {
  assert.ok(footer)
  const buttons = footer.children.filter(node => ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'button')
  assert.equal(buttons.length, 2)
  assert.equal(expression(attrs(buttons[0]).get('aria-label')), "world.paused ? 'Resume game' : 'Pause game'")
  assert.match(expression(attrs(buttons[0]).get('onClick')), /w\.paused = !w\.paused/)
  assert.equal(literal(attrs(buttons[1]).get('aria-label')), 'Game settings')
  assert.equal(expression(attrs(buttons[1]).get('onClick')), 'openMenu')
  assert.doesNotMatch(footer.getText(source), /toggleSound|Enable sound|Mute sound/)
})

test('Options exposes the existing audio control with stable accessible state and pending ownership', () => {
  const button = elements.find(node => literal(attrs(node).get('data-option-key')) === 'audio')
  assert.ok(button, 'real Options audio control must remain discoverable')
  const a = attrs(button)
  assert.equal(expression(a.get('onClick')), 'toggleSound')
  for (const sound of [false, true])
    assert.equal(evaluate(expression(a.get('aria-label')), { sound }), sound ? '♪ Sound on' : '♫ Enable sound')
  for (const soundPending of [false, true]) {
    assert.equal(evaluate(expression(a.get('disabled')), { soundPending }), soundPending)
    assert.equal(evaluate(expression(a.get('aria-busy')), { soundPending }), soundPending)
  }
  assert.match(text, /<OriginalOptions[\s\S]*compatibility=/)
  assert.match(text, /audioStartNotice && <p role="status">\{audioStartNotice\}<\/p>/)
})

function toggleFixture({ sound = false, enable = async () => true } = {}) {
  let enables = 0
  const events = [], world = {}, environment = {}
  const engine = { current: { soundEnvironment: () => environment } }
  const audio = { current: { enable: () => { enables++; return enable() }, mute: () => events.push(['mute']) } }
  const code = ts.transpileModule(functions.get('toggleSound').getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const bindings = { sound, audio, world, engine,
    setAudioStartNotice: value => events.push(['notice', value]),
    setSound: value => events.push(['sound', value]),
    setSoundPending: value => events.push(['pending', value]),
    tell: (owner, message) => { assert.equal(owner, world); events.push(['tell', message]) },
    update: () => events.push(['update']),
  }
  const toggle = new Function(...Object.keys(bindings), `${code}; return toggleSound`)(...Object.values(bindings))
  return { toggle, events, audio, environment, enables: () => enables }
}

test('actual audio retry reports the surviving Options route and clears pending after failure', async () => {
  const f = toggleFixture({ enable: async () => { throw Error('blocked') } })
  await f.toggle()
  assert.equal(f.enables(), 1)
  assert.equal(f.audio.current.environment, f.environment)
  assert.deepEqual(f.events.map(e => e[0]), ['notice', 'pending', 'mute', 'notice', 'tell', 'update', 'pending'])
  assert.match(f.events[3][1], /Menu > Options > Game > Browser compatibility and help/)
  assert.equal(f.events[3][1], f.events[4][1])
  assert.deepEqual(f.events.at(-1), ['pending', false])
})

test('actual enable and mute transitions retain existing behavior', async () => {
  const enabled = toggleFixture()
  await enabled.toggle()
  assert.equal(enabled.enables(), 1)
  assert.equal(enabled.audio.current.environment, enabled.environment)
  assert.deepEqual(enabled.events, [['notice', ''], ['pending', true], ['sound', true], ['pending', false]])
  const muted = toggleFixture({ sound: true })
  await muted.toggle()
  assert.deepEqual(muted.events, [['notice', ''], ['mute'], ['sound', false]])
})

// Execute the shipped capture handler before the actual opening callback. The
// dialog below is a lifecycle model, not a browser or a recorded opener trace.
const shell = elements.find(node => literal(attrs(node).get('className')) === 'game-shell')
const hud = elements.find(node => literal(attrs(node).get('className')) === 'native-hud')
const openMenuDeclarations = []
function findOpenMenu(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'openMenu') openMenuDeclarations.push(node)
  ts.forEachChild(node, findOpenMenu)
}
findOpenMenu(source)
assert.equal(openMenuDeclarations.length, 1)
const openMenuCall = openMenuDeclarations[0].initializer
assert.ok(ts.isCallExpression(openMenuCall) && openMenuCall.expression.getText(source) === 'useCallback')
const pauseText = readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8')
const pauseSource = ts.createSourceFile('menu.tsx', pauseText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const continuations = pauseSource.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === 'continuePauseMenu')
assert.equal(continuations.length, 1)
function compiledFunction(code, bindings = {}) {
  const emitted = ts.transpileModule(`const extracted = ${code};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  return new Function(...Object.keys(bindings), `${emitted}; return extracted`)(...Object.values(bindings))
}
const continuePauseMenu = compiledFunction(continuations[0].getText(pauseSource))
const launcherNode = label => elements.find(node => literal(attrs(node).get('aria-label')) === label)
function isInHud(node) {
  for (; node; node = node.parent) if (node === hud) return true
  return false
}

function openingFixture(label, { detail = 1, nested = false, paused = false, inHud = true, loadingBlocked = false, inputMask = 0 } = {}) {
  const node = launcherNode(label), properties = attrs(node)
  assert.ok(isInHud(node), `${label} must be inside the actual HUD`)
  const body = {}, interior = {}, world = { paused, inputMask }, calls = []
  let focused, remembered = null, menu = false, open = false, stopped = false, prevented = false
  const button = {
    getAttribute: name => literal(properties.get(name)) ?? null,
    blur() { calls.push('blur'); if (focused === button) focused = body },
    closest(selector) {
      if (selector === 'button') return button
      if (selector === '.native-hud') return inHud ? hud : null
      // The input-mask guard's existing route exemptions are separate from blur.
      assert.ok(selector.includes('[data-fullscreen-control]'))
      return label === 'Game settings' ? footer : null
    },
  }
  // Model normal pointer/keyboard button focus, then the real capture/bubble order.
  focused = button
  const target = nested ? { closest: selector => button.closest(selector) } : button
  const scene = { world, nearbyFollowersHudActive: true, suspended: false,
    setModalSuspended(value) { this.suspended = value } }
  const bindings = {
    cancelNearbyInput() {}, engine: { current: scene }, menuSession: { current: null },
    pendingMenuCamera: { current: [] }, store: { getWorld: () => world, change: action => action(world) },
    setMenu(value) { menu = value },
  }
  const capture = compiledFunction(expression(attrs(shell).get('onClickCapture')), {
    world, blockLoadingInteraction: () => loadingBlocked,
  })
  const openMenu = compiledFunction(openMenuCall.arguments[0].getText(source), bindings)
  const closeMenu = compiledFunction(functions.get('closeMenu').getText(source), bindings)
  const dialog = {
    showModal() {
      calls.push('showModal'); open = true
      // BODY is activeElement's fallback when no real element remains focused.
      remembered = focused === body ? null : focused
      focused = interior
    },
    close() { calls.push('close'); if (!open) return; open = false; if (remembered) focused = remembered },
    remove() { calls.push('remove'); if (focused === interior) focused = body },
  }
  const event = { detail, target,
    preventDefault() { prevented = true }, stopPropagation() { stopped = true } }
  const focusOwner = () => focused === button ? label : focused === body ? 'BODY' : 'dialog'
  return {
    calls, world, scene, focusOwner, get open() { return open }, get menu() { return menu },
    get rememberedOpener() { return remembered === button },
    get prevented() { return prevented }, get stopped() { return stopped },
    capture() { capture(event) },
    activate() {
      capture(event)
      if (loadingBlocked || stopped) return
      const callback = evaluate(expression(properties.get('onClick')), { openMenu })
      callback()
      assert.equal(menu, true)
      dialog.showModal() // Model the component's later mount effect, after capture.
    },
    continue() {
      continuePauseMenu(dialog, closeMenu)
      assert.equal(menu, false)
      dialog.remove() // Parent unmount follows the actual continuation helper.
    },
  }
}

test('actual Menu and Game settings declare their dialog opening semantics', () => {
  for (const label of ['Menu', 'Game settings']) {
    const node = launcherNode(label)
    assert.ok(isInHud(node))
    assert.equal(literal(attrs(node).get('aria-haspopup')), 'dialog')
    assert.equal(expression(attrs(node).get('onClick')), 'openMenu')
  }
})

for (const label of ['Menu', 'Game settings']) for (const nested of [false, true])
  test(`pointer ${label}${nested ? ' nested artwork' : ''} preserves its opener through actual capture and continuation`, () => {
    for (const paused of [false, true]) {
      const f = openingFixture(label, { nested, paused })
      f.activate()
      const rememberedOpener = f.rememberedOpener
      assert.equal(f.world.paused, true)
      assert.equal(f.scene.suspended, true)
      f.continue()
      assert.deepEqual({ rememberedOpener, focusOwner: f.focusOwner() },
        { rememberedOpener: true, focusOwner: label }, 'opening must retain a valid launcher for ordinary dismissal, not BODY')
      assert.equal(f.world.paused, paused)
      assert.equal(f.scene.suspended, false)
      assert.deepEqual(f.calls, ['showModal', 'close', 'remove'])
    }
  })

test('keyboard launchers and unrelated HUD controls keep their existing focus policy', () => {
  for (const label of ['Menu', 'Game settings']) {
    const f = openingFixture(label, { detail: 0, nested: true })
    f.activate(); f.continue()
    assert.equal(f.focusOwner(), label)
    assert.equal(f.calls.includes('blur'), false)
  }
  for (const nested of [false, true]) {
    const pointer = openingFixture('Select and focus shaman', { nested })
    pointer.capture()
    assert.equal(pointer.focusOwner(), 'BODY')
    assert.deepEqual(pointer.calls, ['blur'])
    const keyboard = openingFixture('Select and focus shaman', { detail: 0, nested })
    keyboard.capture()
    assert.equal(keyboard.focusOwner(), 'Select and focus shaman')
    assert.deepEqual(keyboard.calls, [])
    const outside = openingFixture('Select and focus shaman', { inHud: false, nested })
    outside.capture()
    assert.equal(outside.focusOwner(), 'Select and focus shaman')
    assert.deepEqual(outside.calls, [])
  }
})

test('dialog launcher preservation does not bypass the existing loading and input guards', () => {
  for (const label of ['Menu', 'Game settings']) {
    const loading = openingFixture(label, { loadingBlocked: true })
    loading.activate()
    assert.equal(loading.menu, false)
    assert.deepEqual(loading.calls, [])
  }
  const blocked = openingFixture('Menu', { inputMask: 64 })
  blocked.activate()
  assert.equal(blocked.menu, false)
  assert.equal(blocked.prevented, true)
  assert.equal(blocked.stopped, true)
  assert.deepEqual(blocked.calls, [])
  const settings = openingFixture('Game settings', { inputMask: 64 })
  settings.activate(); settings.continue()
  assert.equal(settings.focusOwner(), 'Game settings', 'existing top-actions exemption survives')
})
