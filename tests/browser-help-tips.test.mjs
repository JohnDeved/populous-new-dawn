import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const parsed = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
assert.equal(parsed.parseDiagnostics.length, 0, 'actual Home TSX parses')
const compatibility = []
function visit(node) {
  if (ts.isJsxAttribute(node) && node.name.getText(parsed) === 'compatibility')
    compatibility.push(node.initializer.expression.getText(parsed))
  ts.forEachChild(node, visit)
}
visit(parsed)
assert.equal(compatibility.length, 1, 'one actual in-game browser compatibility owner')
const require = createRequire(import.meta.url)
const component = { exports: {} }
new Function('require', 'module', 'exports', ts.transpileModule(`
  export function content(context) {
    const { world, store, setMenu, openSelector, engine, update, hudSize, setHudSize,
      localStorage, toggleSound, soundPending, sound, audioStorageNotice, audioStartNotice } = context;
    return (${compatibility[0]});
  }`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText)(require, component, component.exports)

function fixture(overrides = {}) {
  const calls = [], world = { outcome: { level: 1 }, speed: 1 }
  const context = {
    world, store: { change: action => action(world) },
    setMenu: value => calls.push(['menu', value]), openSelector: () => calls.push(['selector']),
    engine: { current: { fpsGraph: false, togglePerformance: () => calls.push(['F8']) } },
    update: () => calls.push(['update']), hudSize: 'auto', setHudSize: value => calls.push(['hud', value]),
    localStorage: { setItem: (key, value) => calls.push(['storage', key, value]) },
    toggleSound: () => calls.push(['sound']), sound: false, soundPending: false,
    audioStorageNotice: '', audioStartNotice: '', ...overrides,
  }
  function tree(element) {
    return !element || typeof element !== 'object' ? []
      : [element, ...[element.props?.children].flat(Infinity).flatMap(tree)]
  }
  const render = () => component.exports.content(context)
  return { calls, context, world, markup: () => renderToStaticMarkup(render()),
    button: text => {
      const match = tree(render()).filter(node => node.type === 'button' &&
        renderToStaticMarkup(node).includes(text))
      assert.equal(match.length, 1, `one actual button: ${text}`)
      return match[0].props
    },
    hud: () => tree(render()).find(node => node.type === 'select').props }
}

test('normal Browser compatibility content contains no invented strategy, checklist, controls guide or references', () => {
  const ui = fixture()
  // The same live fragment follows all campaign and tutorial worlds without strategy prose.
  for (const level of [...Array.from({ length: 25 }, (_, index) => index + 1), 79, 999]) {
    ui.world.outcome.level = level
    assert.doesNotMatch(ui.markup(), /Objectives|Mission \d|Worship|Land Bridge|casting range|vault|Controls|camera bookmarks|About this recreation|Gameplay reference|Zoom in|Zoom out|Focus settlement|Camera changes apply|\d\d:\d\d/)
  }
  assert.doesNotMatch(page, /BrowserHelpTips|menu-objectives|help-grid|reference-details|pendingMenuCamera|timeLabel/)
  assert.equal(existsSync(new URL('../app/browser-help-tips.tsx', import.meta.url)), false)
})

test('retained game speed and HUD accessibility controls use actual handlers and tolerate unavailable storage', () => {
  const ui = fixture()
  ui.button('1× game speed').onClick()
  assert.equal(ui.world.speed, 2)
  ui.button('2× game speed').onClick()
  assert.equal(ui.world.speed, 1)
  assert.match(ui.markup(), /aria-label="HUD size"/)
  for (const value of ['auto', '1', '1.5', '2', '2.5', '3', '4']) {
    ui.hud().onChange({ target: { value } })
    assert.deepEqual(ui.calls.slice(-2), [['hud', value], ['storage', 'hud-size', value]])
  }
  const denied = fixture({ localStorage: { setItem() { throw new Error('storage unavailable') } } })
  assert.doesNotThrow(() => denied.hud().onChange({ target: { value: '2' } }))
  assert.deepEqual(denied.calls, [['hud', '2']])
})

test('audio activation and truthful recovery notices remain visible and pending activation remains disabled', () => {
  const ui = fixture({ audioStorageNotice: 'Storage unavailable', audioStartNotice: 'Audio needs another gesture' })
  ui.button('Enable sound').onClick()
  assert.deepEqual(ui.calls, [['sound']])
  assert.match(ui.markup(), /role="status">Storage unavailable/)
  assert.match(ui.markup(), /role="status">Audio needs another gesture/)
  ui.context.soundPending = true
  assert.equal(ui.button('Enable sound').disabled, true)
  assert.equal(ui.button('Enable sound')['aria-busy'], true)
  ui.context.sound = true
  assert.match(ui.markup(), /Sound on/)
})

test('browser mission access and exempt F8 control keep their live actions', () => {
  const ui = fixture()
  ui.button('Select Level').onClick()
  assert.deepEqual(ui.calls, [['menu', false], ['selector']])
  ui.button('Toggle performance overlay · F8').onClick()
  assert.deepEqual(ui.calls.slice(-2), [['F8'], ['update']])
  ui.context.engine.current.fpsGraph = true
  assert.equal(ui.button('Toggle performance overlay · F8')['aria-pressed'], true)
  assert.match(page, /<FullscreenControl \/>/)
  assert.match(page, /<SpellTestMenu/)
  assert.match(page, /<OriginalCampaignPopup/)
  assert.match(page, /aria-label="Select and focus shaman"/)
})


test('startup compatibility fallback names only controls retained on the battlefield menu', () => {
  const source = ts.createSourceFile('original-options.tsx', readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const fallbacks = []
  function visit(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken &&
      node.left.getText(source) === 'compatibility') fallbacks.push(node.right.getText(source))
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(fallbacks.length, 1)
  const fallback = { exports: {} }
  new Function('require', 'module', 'exports', ts.transpileModule(`module.exports = (${fallbacks[0]})`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText)(require, fallback, fallback.exports)
  const html = renderToStaticMarkup(fallback.exports)
  assert.match(html, /HUD size, audio and game speed/)
  assert.doesNotMatch(html, /camera controls|help/)
})
