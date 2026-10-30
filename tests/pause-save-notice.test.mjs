import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
const tree = element => {
  if (!element || typeof element !== 'object') return []
  if (typeof element.type === 'function') return tree(element.type(element.props))
  return [element, ...[element.props?.children].flat(Infinity).flatMap(tree)]
}

// Retain hook slots across renders, executing the shipped handlers and JSX.
// Effects/DOM focus are outside this small component-state regression.
function fixture() {
  const slots = []
  let cursor = 0, calls = 0, resolve, reject
  const pending = new Promise((yes, no) => { resolve = yes; reject = no })
  const component = { exports: {} }
  const react = {
    useEffect() {},
    useRef(value) {
      const index = cursor++
      return slots[index] ??= { current: value }
    },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
  }
  new Function('require', 'module', 'exports', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './original-pause-font.json') return JSON.parse(readFileSync(new URL('../app/original-pause-font.json', import.meta.url)))
    if (name === './frontend-composition') return { frontendScale: () => 1 }
    if (name.endsWith('.module.css')) return {}
    throw new Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  const props = {
    tutorial: false, hasCheckpoint: true, checkpointReadStatus: 'read', renderOptions: () => null,
    onRetryCheckpoint() {},
    onContinue() {}, onLoad() {}, onRestart() {}, onQuitLevel() {}, onQuitGame() {},
    onSave() { calls++; return pending },
  }
  let output
  function render() { cursor = 0; output = component.exports.OriginalPauseMenu(props); return output }
  function row(label) {
    const match = tree(output).find(node => node?.type === 'button' && node.props['aria-label'] === label)
    assert.ok(match, `Menu row ${label}`)
    match.props.onClick(); render()
  }
  function save() {
    const button = tree(output).find(node => node?.type === 'button' && ['Save checkpoint', 'Saving…'].includes(node.props['aria-label']))
    assert.ok(button)
    button.props.onClick(); render()
    return button
  }
  function escape() { output.props.onCancel({ preventDefault() {} }); render() }
  function statuses() { return tree(output).filter(node => node?.props?.role === 'status').map(node => node.props.children[0].props.children) }
  async function settle(result) {
    if (result instanceof Error) reject(result)
    else resolve(result)
    await pending.catch(() => {})
    await Promise.resolve()
    render()
  }
  render()
  return { row, save, escape, statuses, settle, render, calls: () => calls }
}

for (const [name, outcome, message] of [
  ['persisted', true, 'Checkpoint saved in this browser.'],
  ['session-only', false, 'Checkpoint saved for this session only.'],
  ['failure', new Error('Controlled save failure'), 'Could not save. Current world unchanged.'],
]) {
  test(`${name} save completion cannot publish a notice in Load Game`, async () => {
    const ui = fixture()
    ui.row('Save Game'); ui.save(); ui.escape(); ui.row('Load Game')
    await ui.settle(outcome)
    assert.equal(ui.render().props['data-panel'], 'load')
    assert.deepEqual(ui.statuses(), ['Checkpoint available in this session.'])
    assert.equal(ui.calls(), 1)
  })
  test(`${name} completion remains visible after reopening pending Save Game`, async () => {
    const ui = fixture()
    ui.row('Save Game')
    const firstButton = ui.save()
    firstButton.props.onClick() // A repeated activation before/after render is single-flight.
    ui.escape(); ui.row('Save Game'); ui.save()
    assert.equal(ui.calls(), 1)
    await ui.settle(outcome)
    assert.deepEqual(ui.statuses(), [message])
    const button = tree(ui.render()).find(node => node?.type === 'button' && node.props['aria-label'] === 'Save checkpoint')
    assert.equal(button.props.disabled, false)
  })
}
