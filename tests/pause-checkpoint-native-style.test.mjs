import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import font from '../app/original-pause-font.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../app/original-pause-menu.module.css', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
function tree(node) {
  if (!node || typeof node !== 'object') return []
  if (typeof node.type === 'function') return tree(node.type(node.props))
  return [node, ...[node.props?.children].flat(Infinity).flatMap(tree)]
}

// Execute the actual component and input handlers with retained hooks. Focus
// targets are supplied DOM boundaries; this is not rendered/browser evidence.
function fixture(overrides = {}) {
  const slots = [], component = { exports: {} }
  let cursor = 0, output, nodes, focused, retries = 0, loads = 0, resumes = 0, saves = 0
  const document = { activeElement: null }
  const react = {
    useEffect() {},
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
  }
  new Function('require', 'module', 'exports', 'document', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './original-pause-font.json') return font
    if (name === './frontend-composition') return { frontendScale: () => 1 }
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
    throw Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports, document)
  const props = {
    prepared: { fonts: true }, tutorial: false, hasCheckpoint: false, checkpointReadStatus: 'failed',
    renderOptions: () => null, onRestart() {}, onQuitLevel() {}, onQuitGame() {},
    onRetryCheckpoint() { retries++ }, onLoad() { loads++ }, onContinue() { resumes++ },
    async onSave() { saves++; return true }, ...overrides,
  }
  function render(next = {}) {
    Object.assign(props, next)
    cursor = 0
    output = component.exports.OriginalPauseMenu(props)
    nodes = tree(output)
    slots[0].current = {
      querySelector(selector) {
        assert.equal(selector, 'button[aria-label="Back"]')
        return { focus() { focused = 'Back' } }
      },
      querySelectorAll(selector) {
        assert.equal(selector, 'nav button:not(:disabled)')
        return tree(nodes.find(node => node.type === 'nav')).filter(node => node.type === 'button' && !node.props.disabled)
          .map(node => ({ focus() { focused = node.props['aria-label'] } }))
      },
    }
    return output
  }
  const button = name => {
    const match = nodes.find(node => node.type === 'button' && node.props['aria-label'] === name)
    assert.ok(match, `button ${name}`)
    return match
  }
  function click(name) { const node = button(name); assert.ok(!node.props.disabled); node.props.onClick(); render() }
  const panel = () => nodes.find(node => node.type === 'section')
  render()
  return { render, button, click, panel, nodes: () => nodes, focused: () => focused,
    counts: () => ({ retries, loads, resumes, saves }),
    escape() { output.props.onCancel({ preventDefault() {} }); render() },
    key(key, repeat = false) {
      let prevented = false
      output.props.onKeyDown({ key, repeat, target: { closest: selector => selector === 'button' ? {} : null },
        preventDefault() { prevented = true } })
      return prevented
    },
  }
}
const paragraphs = ui => tree(ui.panel()).filter(node => node.type === 'p')
const paragraphText = paragraph => paragraph.props.children[0].props.children

for (const fonts of [true, false]) {
  test(`Save and Load use native rows and width-bounded F00T9 text (fonts=${fonts})`, () => {
    for (const checkpointReadStatus of ['idle', 'pending', 'failed', 'incompatible', 'unavailable', 'read']) {
      for (const hasCheckpoint of [false, true]) {
        const ui = fixture({ prepared: { fonts }, checkpointReadStatus, hasCheckpoint })
        for (const choice of ['Save Game', 'Load Game']) {
          if (ui.button(choice).props.disabled) continue
          ui.click(choice)
          const panel = ui.panel(), nodes = tree(panel)
          assert.equal(panel.props['aria-label'], choice)
          const heading = nodes.find(node => node.type === 'h2')
          assert.equal(heading.props['aria-label'], choice)
          for (const paragraph of paragraphs(ui)) {
            assert.equal(paragraph.props.children[0].props.className, 'visuallyHidden')
            for (const line of paragraph.props.children[1]) {
              assert.equal(line.props['aria-hidden'], 'true')
              const text = line.props.children.props.text
              const width = [...text].reduce((sum, c) => sum + font.rects[c.charCodeAt(0) - 32].w, 0)
              assert.ok(width <= 600, `${width}: ${text}`)
              const rendered = tree(line)
              assert.equal(rendered.some(node => node.type === 'i'), fonts)
              if (!fonts) assert.ok(rendered.some(node => node.props.children === text))
            }
          }
          const actions = nodes.filter(node => node.type === 'button')
          assert.ok(actions.length)
          for (const action of actions) {
            assert.equal(action.props.style.top, 0)
            assert.equal(action.props.style.height, 29)
            if (fonts) assert.ok(tree(action).filter(node => node.type === 'i')
              .every(glyph => glyph.props.style.backgroundImage === "url('/original/pause-font.png')"))
          }
          assert.equal(ui.button('Back').props.style.top, 454)
          assert.ok(!JSON.stringify(panel).includes('multi-slot'))
          ui.click('Back')
        }
      }
    }
    assert.doesNotMatch(css.match(/\.panel \{[^}]+\}/)[0], /background|border|font:/)
    assert.doesNotMatch(css, /\.panel button/)
  })
}

test('native action hover and keyboard focus use the existing settled/highlighted opacity', () => {
  const ui = fixture()
  ui.click('Save Game')
  const opacity = () => tree(ui.button('Save checkpoint')).find(node => node.props?.className === 'text').props.style.opacity
  assert.equal(opacity(), 2 / 3)
  for (const [enter, leave] of [['onPointerEnter', 'onPointerLeave'], ['onFocus', 'onBlur']]) {
    ui.button('Save checkpoint').props[enter](); ui.render(); assert.equal(opacity(), 1)
    ui.button('Save checkpoint').props[leave](); ui.render(); assert.equal(opacity(), 2 / 3)
  }
})

test('lookup states, one-shot load, Back and held keys retain their existing input owners', () => {
  const ui = fixture()
  ui.click('Load Game')
  ui.click('Retry checkpoint lookup')
  assert.equal(ui.focused(), 'Back')
  assert.deepEqual(ui.counts(), { retries: 1, loads: 0, resumes: 0, saves: 0 })
  ui.render({ checkpointReadStatus: 'pending' })
  assert.equal(ui.button('Retry checkpoint lookup').props.disabled, true)
  ui.button('Retry checkpoint lookup').props.onClick()
  for (const key of ['Enter', ' ', 'Escape']) assert.equal(ui.key(key, true), true)
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
    assert.equal(ui.key(key), true)
    assert.equal(ui.focused(), 'Back', 'checkpoint action remains outside native root navigation')
  }
  ui.escape(); ui.click('Save Game')
  ui.render({ checkpointReadStatus: 'read', hasCheckpoint: true })
  assert.equal(ui.render().props['data-panel'], 'save', 'late lookup cannot navigate')
  ui.click('Back'); ui.click('Load Game')
  assert.equal(ui.button('Load checkpoint').props.disabled, false)
  const load = ui.button('Load checkpoint')
  load.props.onClick(); load.props.onClick()
  assert.deepEqual(ui.counts(), { retries: 1, loads: 1, resumes: 0, saves: 0 })
})

test('incompatible and empty records remain rejected with accessible truth; Save retains overwrite and disabled reasons', () => {
  const ui = fixture({ checkpointReadStatus: 'incompatible' })
  ui.click('Load Game')
  assert.equal(ui.button('Load checkpoint').props.disabled, true)
  assert.throws(() => ui.button('Retry checkpoint lookup'), /button/)
  const status = paragraphs(ui).find(node => node.props.role === 'status')
  assert.equal(paragraphText(status), 'Incompatible checkpoint. Stored save unchanged.')
  ui.render({ checkpointReadStatus: 'read' })
  assert.equal(paragraphText(paragraphs(ui).find(node => node.props.role === 'status')), 'No saved checkpoint in this browser.')
  ui.click('Back'); ui.click('Save Game')
  assert.deepEqual(paragraphs(ui).map(paragraphText), ['One checkpoint per browser.', 'Saving replaces the previous checkpoint.'])
  const reason = 'Testing cheats are active. Saving and campaign progress are disabled until you restart, load a checkpoint or start another mission.'
  ui.render({ saveDisabledReason: reason })
  assert.equal(ui.button('Save checkpoint').props.disabled, true)
  assert.ok(paragraphs(ui).map(paragraphText).includes(reason))
  assert.deepEqual(ui.counts(), { retries: 0, loads: 0, resumes: 0, saves: 0 })
})

test('pending Save keeps its accessible name while rendering supported native ellipsis pixels', async () => {
  let finish, calls = 0
  const pending = new Promise(resolve => { finish = resolve })
  const ui = fixture({ onSave() { calls++; return pending } })
  ui.click('Save Game'); ui.click('Save checkpoint')
  const saving = ui.button('Saving…')
  assert.equal(saving.props.disabled, true)
  const nativeText = saving.props.children.props.text
  assert.equal(nativeText, 'Saving...')
  assert.ok(tree(saving).some(node => node.type === 'i'))
  saving.props.onClick()
  assert.equal(calls, 1)
  finish(false)
  await pending; await Promise.resolve(); ui.render()
  assert.equal(ui.button('Save checkpoint').props.disabled, false)
  const status = paragraphs(ui).find(node => node.props.role === 'status')
  assert.equal(paragraphText(status), 'Checkpoint saved for this session only.')
})

test('an unexpected unsupported character in a supplied Save reason retains readable fallback', () => {
  const reason = 'Saving unavailable… please retry 🔒'
  const ui = fixture({ saveDisabledReason: reason })
  ui.click('Save Game')
  const fallback = tree(ui.panel()).find(node => node.props.className === 'fallback' && node.props.children === reason)
  assert.ok(fallback)
  assert.equal(ui.button('Save checkpoint').props.disabled, true)
  assert.ok(!tree(fallback).some(node => node.type === 'i'))
})
