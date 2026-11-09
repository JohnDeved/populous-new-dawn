import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import * as frontendBadges from '../app/frontend-badges.ts'

const require = createRequire(import.meta.url)
const emitted = ts.transpileModule(
  readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }
).outputText

function tree(element) {
  if (!element || typeof element !== 'object') return []
  if (typeof element.type === 'function') return tree(element.type(element.props))
  return [element, ...[element.props?.children].flat(Infinity).flatMap(tree)]
}

// Execute the shipped component and handlers with retained hook state. DOM focus
// methods are observed, not simulated browser focus algorithms. Native disabling,
// key defaults and dialog containment still require the rendered browser scenario.
function fixture(overrides = {}) {
  const slots = [], component = { exports: {} }, focusCalls = []
  let cursor = 0, output, nodes, active = 'Retry checkpoint lookup', retries = 0, loads = 0
  const react = {
    useEffect() {}, useLayoutEffect() {}, useCallback(fn) { return fn },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value
      }]
    },
  }
  new Function('require', 'module', 'exports', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './original-frontend.json') return {}
    if (name === './frontend-badges') return frontendBadges
    // Tooltip lifecycle has its own production-hook tests; this fixture owns recovery.
    if (name === './menu-tooltip') return { MenuTooltip: () => null }
    if (name === './frontend-composition.ts') return {
      frontendScale: () => 1, frontendRowY: index => index * 30,
      frontendTextWidth: text => text.length * 10, frontendQuitRows: [],
    }
    if (name === './tutorial-recommendation.ts') return {
      tutorialChoiceRows: [], tutorialParagraphRows: [], tutorialRecommendationRows: [],
      hasAnsweredTutorialRecommendation: () => true,
    }
    if (name.endsWith('.module.css')) return {}
    throw new Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  const props = {
    prepared: { fonts: false, lowFont: false, logo: false, background: false, cursor: false },
    hasCheckpoint: false, checkpointReadStatus: 'failed',
    onRetryCheckpoint() {
      retries++
      assert.equal(active, 'Load Game', 'focus moves before a synchronous pending publication')
    },
    onNewGame() {}, onTutorial() {}, onLoad() { loads++ }, renderOptions: () => null,
    ...overrides,
  }
  const dialog = { querySelector(selector) {
    assert.equal(selector, 'nav button[aria-label="Load Game"]')
    assert.ok(nodes.some(node => node.type === 'button' && node.props['aria-label'] === 'Load Game'))
    return { focus() { active = 'Load Game'; focusCalls.push(active) } }
  } }
  function render(next = {}) {
    Object.assign(props, next)
    cursor = 0
    output = component.exports.OriginalMainMenu(props)
    output.props.ref.current = dialog
    nodes = tree(output)
    return output
  }
  function button(label) {
    const node = nodes.find(node => node.type === 'button' &&
      (node.props['aria-label'] === label || node.props.children === label))
    assert.ok(node, `Button ${label}`)
    return node
  }
  function activate(key, repeat, buttonTarget = true) {
    let prevented = false
    output.props.onKeyDown({ key, repeat,
      target: { closest: selector => {
        assert.equal(selector, 'button')
        return buttonTarget ? {} : null
      } },
      preventDefault() { prevented = true },
    })
    return prevented
  }
  render()
  return { render, button, activate, focusCalls, retries: () => retries, loads: () => loads }
}

test('frontend Retry focuses its persistent Load Game row before starting a lookup', () => {
  const ui = fixture()
  ui.button('Retry checkpoint lookup').props.onClick()
  assert.deepEqual(ui.focusCalls, ['Load Game'])
  assert.equal(ui.retries(), 1)
  assert.equal(ui.loads(), 0, 'focus never activates Load Game')
  ui.render({ checkpointReadStatus: 'pending' })
  assert.equal(ui.button('Retry checkpoint lookup').props.disabled, true)
  ui.button('Retry checkpoint lookup').props.onClick()
  assert.equal(ui.retries(), 1, 'pending handlers cannot start a second lookup')
  assert.deepEqual(ui.focusCalls, ['Load Game'], 'pending input cannot move focus again')
})

test('every lookup result retains the Load row without completion-driven focus or loading', () => {
  for (const checkpointReadStatus of ['read', 'failed', 'unavailable']) {
    for (const hasCheckpoint of [false, true]) {
      const ui = fixture()
      ui.button('Retry checkpoint lookup').props.onClick()
      ui.render({ checkpointReadStatus: 'pending' })
      ui.render({ checkpointReadStatus, hasCheckpoint })
      assert.equal(ui.button('Load Game').props['aria-disabled'], !hasCheckpoint)
      assert.equal(ui.button('Load Game').props.disabled, undefined, 'unavailable row remains focusable')
      assert.deepEqual(ui.focusCalls, ['Load Game'])
      assert.equal(ui.loads(), 0)
      if (checkpointReadStatus === 'failed') {
        ui.button('Retry checkpoint lookup').props.onClick()
        assert.equal(ui.retries(), 2, 'a failed lookup can be deliberately retried')
      }
    }
  }
})

test('held activation cannot follow Retry focus into a now-available Load Game', () => {
  const ui = fixture()
  ui.button('Retry checkpoint lookup').props.onClick()
  ui.render({ checkpointReadStatus: 'read', hasCheckpoint: true })
  for (const key of ['Enter', ' ']) {
    assert.equal(ui.activate(key, true), true)
    assert.equal(ui.activate(key, false), false, 'a fresh press remains available')
    assert.equal(ui.activate(key, true, false), false, 'non-button input is not intercepted')
  }
  assert.equal(ui.activate('Tab', true), false, 'tab navigation is unaffected')
  assert.equal(ui.loads(), 0)
  ui.button('Load Game').props.onClick()
  assert.equal(ui.loads(), 1, 'only explicit fresh activation invokes Load')
})

test('late lookup completion cannot navigate or reclaim focus after opening Options', () => {
  const ui = fixture()
  ui.button('Retry checkpoint lookup').props.onClick()
  ui.render({ checkpointReadStatus: 'pending' })
  ui.button('Options').props.onClick()
  const output = ui.render({ checkpointReadStatus: 'read', hasCheckpoint: true })
  assert.ok(!tree(output).some(node => node.props?.['aria-label'] === 'Main menu choices'))
  assert.deepEqual(ui.focusCalls, ['Load Game'])
  assert.equal(ui.loads(), 0)
})

// The shared Options capture listener consumes the first Escape in Browser help
// and then unmounts. These repeats reach this actual frontend component handler.
// React propagation, keyup and focus restoration are covered by frontend-held-escape.
test('held Escape cannot leave newly revealed frontend Options; a fresh press still returns', () => {
  const ui = fixture()
  for (let episode = 0; episode < 2; episode++) {
    ui.button('Options').props.onClick()
    ui.render()
    for (let repeat = 0; repeat < 3; repeat++) {
      assert.equal(ui.activate('Escape', true, false), true)
      const output = ui.render()
      assert.ok(!tree(output).some(node => node.props?.['aria-label'] === 'Main menu choices'),
        'held Escape must not cross from the newly revealed Options to Main')
    }
    assert.equal(ui.activate('Escape', false, false), true)
    assert.ok(tree(ui.render()).some(node => node.props?.['aria-label'] === 'Main menu choices'))
  }
  assert.equal(ui.loads(), 0)
})

test('frontend native cancel retains its fresh back action', () => {
  const ui = fixture()
  ui.button('Options').props.onClick()
  const output = ui.render()
  let prevented = false
  output.props.onCancel({ preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  assert.ok(tree(ui.render()).some(node => node.props?.['aria-label'] === 'Main menu choices'))
})

test('availability publication replaces tooltip ownership before row DOM attributes commit', () => {
  const ui = fixture({ checkpointReadStatus: 'pending' })
  const tooltipKey = output => {
    function jsxNodes(node) {
      if (!node || typeof node !== 'object') return []
      return [node, ...[node.props?.children].flat(Infinity).flatMap(jsxNodes)]
    }
    const tooltip = jsxNodes(output).find(node => node.type?.name === 'MenuTooltip')
    assert.ok(tooltip)
    return tooltip.key
  }
  // Production JSX renders against unchanged ref/DOM stubs. A new React key
  // disposes the old hook state at commit rather than trusting stale attributes.
  const pending = tooltipKey(ui.render())
  assert.equal(tooltipKey(ui.render()), pending)
  for (const checkpointReadStatus of ['read', 'failed', 'unavailable']) {
    for (const hasCheckpoint of [false, true]) {
      const next = tooltipKey(ui.render({ checkpointReadStatus, hasCheckpoint }))
      assert.notEqual(next, pending)
      assert.equal(next, `${hasCheckpoint}:${checkpointReadStatus}`)
    }
  }
})
