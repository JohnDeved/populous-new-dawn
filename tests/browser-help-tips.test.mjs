import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import ingame from '../app/original-pause-font.json' with { type: 'json' }

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
const adapter = { exports: {} }
const compilerOptions = { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 }
new Function('require', 'module', 'exports', ts.transpileModule(`
  export function content(context) {
    const { world, store, setMenu, openSelector, engine, update, hudSize, setHudSize,
      localStorage, toggleSound, soundPending, sound, audioStartNotice } = context;
    return (${compatibility[0]});
  }`, { compilerOptions }).outputText)(require, adapter, adapter.exports)
const emitted = ts.transpileModule(readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8'), { compilerOptions }).outputText
const tree = node => !node || typeof node !== 'object' ? [] :
  [node, ...[node.props?.children].flat(Infinity).flatMap(tree)]

// Evaluate the production Options component and actual Home adapter. These source
// fixtures establish handlers, glyph geometry and ownership, not rendered pixels.
function fixture(overrides = {}) {
  const calls = [], world = { outcome: { level: 1 }, speed: 1 }
  const context = {
    world, store: { change: action => action(world) },
    setMenu: value => calls.push(['menu', value]), openSelector: () => calls.push(['selector']),
    engine: { current: { fpsGraph: false, togglePerformance: () => calls.push(['F8']) } },
    update: () => calls.push(['update']), hudSize: 'auto',
    setHudSize: value => { context.hudSize = value; calls.push(['hud', value]) },
    localStorage: { setItem: (key, value) => calls.push(['storage', key, value]) },
    toggleSound: () => calls.push(['sound']), sound: false, soundPending: false,
    audioStorageNotice: '', audioStartNotice: '', ...overrides,
  }
  const hooks = ['Game', true, null, 'ingame', 'ingame'], effects = [], focus = []
  let cursor = 0
  const component = { exports: {} }
  const react = {
    useState: () => { const index = cursor++; return [hooks[index], value => { hooks[index] = value }] },
    useMemo: make => make(),
    useRef: () => ({ current: { querySelector: selector => ({ focus: () => focus.push(selector) }), closest: () => ({ open: true }) } }),
    useEffect: (run, deps) => effects.push({ run, deps }),
  }
  react.useLayoutEffect = react.useEffect
  const listeners = new Map()
  const document = {
    addEventListener: (name, run) => listeners.set(name, run),
    removeEventListener: (name, run) => { assert.equal(listeners.get(name), run); listeners.delete(name) },
  }
  new Function('require', 'module', 'exports', 'document', 'requestAnimationFrame', emitted)(name => {
    if (name === 'react') return react
    if (name === './menu-tooltip') return { MenuTooltip: () => null }
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
    if (name.endsWith('.json')) return JSON.parse(readFileSync(new URL('../app/' + name.slice(2), import.meta.url)))
    return require(name)
  }, component, component.exports, document, run => run())
  const render = () => {
    cursor = 0; effects.length = 0
    return component.exports.OriginalOptions({
      skin: 'ingame', preparedIngame: { fonts: true, sliders: true },
      onBack() {}, volume: .35, musicVolume: .65, onVolume() {}, onMusicVolume() {},
      storageNotice: context.audioStorageNotice, gameStorageNotice: '',
      gamePreferences: { rotation: 'cursor', flipRotation: false }, onGamePreferences() {},
      compatibility: context.frontend ? undefined : adapter.exports.content(context),
    })
  }
  const nodes = () => tree(render())
  return { calls, context, world, hooks, effects, focus, listeners, nodes,
    markup: () => renderToStaticMarkup(render()),
    button: label => {
      const matches = nodes().filter(node => node.type === 'button' && node.props['aria-label'] === label)
      assert.equal(matches.length, 1, `one actual button: ${label}`)
      return matches[0].props
    },
    hud: () => nodes().find(node => node.props?.['data-option-key'] === 'hud-size').props,
  }
}

test('normal Browser compatibility content contains no invented strategy, checklist, controls guide or references', () => {
  const ui = fixture()
  for (const level of [...Array.from({ length: 25 }, (_, index) => index + 1), 79, 999]) {
    ui.world.outcome.level = level
    assert.doesNotMatch(ui.markup(), /Objectives|Mission \d|Worship|Land Bridge|casting range|vault|Controls|camera bookmarks|About this recreation|Gameplay reference|Zoom in|Zoom out|Focus settlement|Camera changes apply|\d\d:\d\d/)
  }
  assert.doesNotMatch(page, /BrowserHelpTips|menu-objectives|help-grid|reference-details|pendingMenuCamera|timeLabel/)
  assert.equal(existsSync(new URL('../app/browser-help-tips.tsx', import.meta.url)), false)
})

test('retained speed uses the actual handler and can leave an existing 2x session', () => {
  const ui = fixture()
  ui.button('1× game speed').onClick()
  assert.equal(ui.world.speed, 2)
  ui.button('2× game speed').onClick()
  assert.equal(ui.world.speed, 1)
  const current = fixture({ world: { speed: 2 } })
  current.context.store = { change: run => run(current.context.world) }
  current.button('2× game speed').onClick()
  assert.equal(current.context.world.speed, 1)
})

test('HUD size cycles all existing values with an ordinary keyboard button and retains session values when storage fails', () => {
  const ui = fixture()
  for (let visit = 0; visit < 2; visit++) for (const value of ['1', '1.5', '2', '2.5', '3', '4', 'auto']) {
    const row = ui.hud()
    assert.match(row['aria-label'], /^HUD size : </)
    assert.equal(row.tabIndex, undefined, 'native button keeps Tab and Enter/Space activation')
    assert.equal(row.onKeyDown, undefined, 'no synthetic keyboard activation or duplicate dispatch')
    row.onClick()
    assert.deepEqual(ui.calls.slice(-2), [['hud', value], ['storage', 'hud-size', value]])
    assert.equal(ui.hud()['data-hud-size'], value)
    assert.equal(ui.hud()['aria-label'], `HUD size : <${value === 'auto' ? 'Automatic' : `${Number(value) * 100}%`}>`)
  }
  const denied = fixture({ localStorage: { setItem() { throw new Error('storage unavailable') } } })
  assert.doesNotThrow(() => denied.hud().onClick())
  assert.deepEqual(denied.calls, [['hud', '1']])
  assert.equal(denied.hud()['data-hud-size'], '1')
  assert.equal(ui.nodes().some(node => node.type === 'select'), false)
})

test('audio activation is still a direct trusted click and pending/retry notices retain original glyphs', () => {
  const ui = fixture({ audioStorageNotice: 'Volume changes apply for this session; browser storage is unavailable.',
    audioStartNotice: 'Audio could not start. Try Enable sound again.' })
  ui.button('♫ Enable sound').onClick()
  assert.deepEqual(ui.calls, [['sound']])
  const statuses = ui.nodes().filter(node => node.props?.role === 'status')
  assert.deepEqual(statuses.map(node => node.props['aria-label']), [ui.context.audioStorageNotice, ui.context.audioStartNotice])
  for (const status of statuses) {
    const announcement = tree(status).find(node => node.props?.className === 'game-a11y-status')
    assert.equal(announcement.props.children, status.props['aria-label'], 'live status has actual accessible text, not glyphs alone')
    const lines = tree(status).filter(node => node.type?.name === 'Text')
    assert.equal(lines.map(node => node.props.text).join(' '), status.props['aria-label'])
    for (const line of lines) {
      assert.ok([...line.props.text].reduce((width, letter) => width + ingame.rects[letter.charCodeAt(0) - 32].w, 0) <= 600)
      assert.equal(line.props.ready, true)
    }
  }
  ui.context.soundPending = true
  ui.hooks[2] = 'audio'
  assert.equal(ui.button('♫ Enable sound').disabled, true)
  assert.equal(ui.button('♫ Enable sound')['aria-busy'], true)
  assert.equal(ui.button('♫ Enable sound').children.props.state, 'normal', 'pending audio never uses selected/highlighted text')
  const css = readFileSync(new URL('../app/original-options.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.compatibility \.choice:disabled \{ opacity: \.5;/)
  ui.context.soundPending = false
  ui.button('♫ Enable sound').onClick()
  assert.deepEqual(ui.calls, [['sound'], ['sound']])
  ui.context.sound = true
  ui.button('♪ Sound on').onClick()
  assert.deepEqual(ui.calls.at(-1), ['sound'])
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
  assert.match(page, /aria-label="Select shaman"/)
})

test('compatibility has only the original-font rows, native 30-pixel spacing and the original transparent backdrop', () => {
  const ui = fixture(), nodes = ui.nodes()
  const buttons = nodes.filter(node => node.type === 'button')
  assert.deepEqual(buttons.map(node => node.props.style.top), [139, 169, 199, 229, 259, 454])
  for (const button of buttons) {
    assert.match(button.props.className, /choice/)
    assert.equal(button.props.children.type.name, 'Text')
    assert.equal(button.props.children.props.skin, 'ingame')
    assert.ok([...button.props.children.props.text].reduce((width, letter) => width + ingame.rects[letter.charCodeAt(0) - 32].w, 0) <= 540)
  }
  const css = readFileSync(new URL('../app/original-options.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.compatibility \{ position: absolute; inset: 0; \}/)
  assert.doesNotMatch(css, /\.compatibility[^}]*background:|\.compatibility[^}]*sans-serif|\.compatibility button/)
  assert.match(css, /\.noticeLine[^}]*height: 30px/)
  for (const audioStartNotice of ['Audio could not start. Try Enable sound again.', 'Audio stopped. Try Enable sound again.']) {
    const notices = fixture({ audioStorageNotice: 'Volume changes apply for this session; browser storage is unavailable.',
      audioStartNotice }).nodes().find(node => node.props?.className === 'browserNotices')
    const lines = tree(notices).filter(node => node.type?.name === 'Text')
    assert.ok(lines.length <= 4)
    assert.ok(309 + lines.length * 30 < 454, 'storage and audio recovery notices fit above Back without a scrollbox')
  }
})

test('repeated entry, Back and body-focused Escape preserve the nested dialog boundary and cleanup', () => {
  const ui = fixture()
  for (let visit = 0; visit < 3; visit++) {
    ui.hooks[1] = true
    ui.nodes()
    const entry = ui.effects.find(effect => effect.deps.length === 1 && effect.deps[0] === true)
    entry.run()
    assert.equal(ui.focus.at(-1), '[data-browser-help-heading]')
    const escape = ui.effects.filter(effect => effect.deps.length === 1 && effect.deps[0] === true)[1]
    const cleanup = escape.run()
    let prevented = 0, stopped = 0
    ui.listeners.get('keydown')({ key: 'Escape', preventDefault: () => prevented++, stopPropagation: () => stopped++ })
    assert.deepEqual([prevented, stopped, ui.hooks[1]], [1, 1, false])
    assert.equal(ui.focus.at(-1), '[data-compatibility]')
    cleanup()
    assert.equal(ui.listeners.size, 0)
    ui.hooks[1] = true
    ui.button('Back to Options').onClick()
    assert.equal(ui.hooks[1], false)
    assert.equal(ui.focus.at(-1), '[data-compatibility]')
  }
})

test('startup fallback remains a native-font direction to the retained battlefield controls', () => {
  const ui = fixture({ frontend: true })
  const paragraph = ui.nodes().find(node => node.type === 'p')
  assert.equal(paragraph.props['aria-label'], 'HUD size, audio and game speed are available from the battlefield menu.')
  assert.equal(tree(paragraph).find(node => node.props?.className === 'game-a11y-status').props.children, paragraph.props['aria-label'])
  const lines = tree(paragraph).filter(node => node.type?.name === 'Text')
  assert.equal(lines.map(node => node.props.text).join(' '), paragraph.props['aria-label'])
  assert.equal(ui.nodes().filter(node => node.type === 'button').length, 1)
})
