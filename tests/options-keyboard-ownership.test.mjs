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
