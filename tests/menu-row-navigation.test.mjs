import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

// Evaluate each shipped dialog handler, not a copied navigation algorithm.
// Supplied focus/query objects establish row choice and event ownership only;
// browser focus, key defaults and rendered focus-visible styling remain unverified.
function dialogHandler(file) {
  const source = ts.createSourceFile(file,
    readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let expression
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'dialog') {
      expression = node.attributes.properties.find(attribute =>
        attribute.name?.getText(source) === 'onKeyDown')?.initializer?.expression
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(expression, `${file} dialog onKeyDown`)
  return ts.transpileModule(`(${expression.getText(source)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
}

const sources = {
  frontend: dialogHandler('original-main-menu.tsx'),
  pause: dialogHandler('original-pause-menu.tsx'),
}

function fixture(skin, panel, count = 3) {
  const outside = { label: 'auxiliary control outside nav' }
  const document = { activeElement: outside }
  let queries = 0, prevented = 0, backs = 0
  const buttons = Array.from({ length: count }, (_, index) => ({
    index, focus() { document.activeElement = this },
  }))
  const dialog = { current: { querySelectorAll(selector) {
    queries++
    // Preserve frontend unavailable explanations as focusable rows, while the
    // pause menu continues excluding genuinely disabled entries from navigation.
    assert.equal(selector, skin === 'frontend' ? 'nav button' : 'nav button:not(:disabled)')
    return buttons
  } } }
  const keydown = Function('panel', 'dialog', 'document', 'pointerMode', 'draw', 'back',
    `return ${sources[skin]}`)(panel, dialog, document, { current: true }, () => {}, () => backs++)
  return {
    buttons, document, outside,
    press(key, { repeat = false, formControl = false, button = false } = {}) {
      keydown({ key, repeat, target: { closest(selector) {
        if (selector === 'button') return button ? outside : null
        assert.equal(selector, 'input,select,textarea')
        return formControl ? outside : null
      } }, preventDefault() { prevented++ } })
    },
    counts: () => ({ queries, prevented, backs }),
  }
}

for (const [skin, panels] of [
  ['frontend', ['main', 'tutorial-recommendation']],
  ['pause', ['root', 'restart', 'quit-game', 'save', 'load']],
]) {
  test(`${skin}: outside-list arrows enter at the first/last row without skipping`, () => {
    for (const panel of panels)
      for (const count of [1, 3, 9])
        for (const [key, atLast] of [['ArrowUp', true], ['ArrowDown', false], ['Home', false], ['End', true]]) {
          const ui = fixture(skin, panel, count)
          ui.press(key)
          assert.equal(ui.document.activeElement, ui.buttons[atLast ? count - 1 : 0], `${panel}: ${key}/${count}`)
          assert.deepEqual(ui.counts(), { queries: 1, prevented: 1, backs: 0 })
        }
  })

  test(`${skin}: ordinary row navigation and wrapping stay unchanged`, () => {
    for (const panel of panels)
      for (const index of [0, 1, 2])
        for (const [key, expected] of [
          ['ArrowUp', (index + 2) % 3], ['ArrowDown', (index + 1) % 3], ['Home', 0], ['End', 2],
        ]) {
          const ui = fixture(skin, panel)
          ui.document.activeElement = ui.buttons[index]
          ui.press(key)
          assert.equal(ui.document.activeElement, ui.buttons[expected])
        }
  })

  test(`${skin}: Options, Tab and held activation retain their existing owners`, () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab']) {
      const ui = fixture(skin, 'options')
      ui.press(key)
      assert.equal(ui.document.activeElement, ui.outside)
      assert.deepEqual(ui.counts(), { queries: 0, prevented: 0, backs: 0 })
    }
    for (const key of ['Enter', ' ', 'Escape']) {
      const ui = fixture(skin, panels[0])
      ui.press(key, { repeat: true, button: true })
      assert.equal(ui.document.activeElement, ui.outside)
      assert.deepEqual(ui.counts(), { queries: 0, prevented: 1, backs: 0 })
    }
  })
}

test('pause form controls retain their native arrow/Home/End behavior', () => {
  for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
    const ui = fixture('pause', 'load')
    ui.press(key, { formControl: true })
    assert.equal(ui.document.activeElement, ui.outside)
    assert.deepEqual(ui.counts(), { queries: 0, prevented: 0, backs: 0 })
  }
})
