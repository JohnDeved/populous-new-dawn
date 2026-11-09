import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

// Execute only the actual, AST-selected host callbacks and row declaration.
// No game-store/runtime import, substitute runtime, mounted DOM or pixel claim.
const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
const ast = ts.createSourceFile('original-main-menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
function all(node, predicate) {
  const found = []
  function walk(current) { if (predicate(current)) found.push(current); ts.forEachChild(current, walk) }
  walk(node)
  return found
}
function execute(text, context) {
  const output = ts.transpileModule(`const result = (${text});`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
  return new Function(...Object.keys(context), `${output};return result`)(...Object.values(context))
}
const dialog = all(ast, node => ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === 'dialog')[0]
const attr = name => dialog.attributes.properties.find(node => node.name?.text === name).initializer.expression.getText(ast)
const effectCalls = all(ast, node => ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect')
function effectWith(text) {
  const matched = effectCalls.filter(call => call.arguments[0].getText(ast).includes(text))
  assert.equal(matched.length, 1)
  return matched[0]
}

test('Credits remains unavailable with no explicit renderer, and opens only the supplied host', () => {
  const rows = all(ast, node => ts.isVariableDeclaration(node) && node.name.getText(ast) === 'rows')[0].initializer.getText(ast)
  let panel = 'main'
  const context = { hasCheckpoint: false, checkpointDescriptions: { read: 'none' }, checkpointReadStatus: 'read', onNewGame() {}, onTutorial() {}, onLoad() {}, setPanel(value) { panel = value }, setOptionRows() {} }
  const disabled = execute(rows, { ...context, renderCredits: undefined }).find(row => row.label === 'Credits')
  assert.equal(disabled.unavailable, 'Original credits are not yet restored')
  assert.equal(disabled.action, undefined)
  const enabled = execute(rows, { ...context, renderCredits() {} }).find(row => row.label === 'Credits')
  assert.equal(enabled.unavailable, undefined); enabled.action(); assert.equal(panel, 'credits')
})
test('Credits owns dialog keydown while existing main Escape still returns', () => {
  let returned = 0
  let drawn = 0
  const context = { panel: 'credits', pointerMode: { current: true }, draw() { drawn += 1 }, back() { returned += 1 } }
  const handler = execute(attr('onKeyDown'), context)
  handler({ key: 'Escape', repeat: false, preventDefault() { throw new Error('parent consumed Credits Escape') } })
  assert.equal(returned, 0); assert.equal(drawn, 0)
  execute(attr('onKeyDown'), { ...context, panel: 'main' })({ key: 'Escape', repeat: false, preventDefault() {} })
  assert.equal(returned, 1)
})
test('dialog cancel does not bypass the active Credits owner', () => {
  let returned = 0; let prevented = 0
  const event = { preventDefault() { prevented += 1 } }
  execute(attr('onCancel'), { panel: 'credits', back() { returned += 1 } })(event)
  assert.equal(returned, 0); assert.equal(prevented, 1)
  execute(attr('onCancel'), { panel: 'main', back() { returned += 1 } })(event)
  assert.equal(returned, 1)
})
test('withdrawing the host returns to main instead of trapping a blank Credits panel', () => {
  const condition = all(ast, node => ts.isIfStatement(node) && node.expression.getText(ast) === "panel === 'credits' && !renderCredits")
  assert.equal(condition.length, 1)
  const callback = `() => { ${condition[0].getText(ast)} }`
  let panel = 'credits'
  execute(callback, { panel, renderCredits: undefined, setPanel(value) { panel = value } })()
  assert.equal(panel, 'main')
  execute(callback, { panel: 'credits', renderCredits() {}, setPanel() { throw new Error('unwanted withdrawal') } })()
})
test('return uses existing Credits row marker and entry focuses the actual screen target', () => {
  const call = effectWith("returnFocus.current")
  const focused = []
  const button = label => ({ getAttribute: () => label, focus() { focused.push(label) } })
  const screen = { focus() { focused.push('screen') } }
  const dialog = { current: { querySelectorAll: () => [button('New Game'), button('Credits')], querySelector: selector => { assert.equal(selector, '[data-panel-back]'); return screen } } }
  const context = { dialog, returnFocus: { current: 'Credits' }, first: { current: button('first') } }
  execute(call.arguments[0].getText(ast), { ...context, panel: 'main' })()
  execute(call.arguments[0].getText(ast), { ...context, panel: 'credits' })()
  assert.deepEqual(focused, ['Credits', 'screen'])
  assert.match(source, /returnFocus\.current = row\.label/)
})
test('host receives the widened logical screen and no production enablement is assumed', () => {
  const calls = all(ast, node => ts.isCallExpression(node) && node.expression.getText(ast) === 'renderCredits')
  assert.equal(calls.length, 1)
  const received = []
  const back = () => {}
  execute(calls[0].getText(ast), { renderCredits: (...args) => received.push(args), back, canvasWidth: 802 })
  assert.deepEqual(received, [[back, { width: 802, height: 480 }]])
  assert.match(source, /renderCredits\?:/)
  assert.match(source, /if \(panel === 'credits'\) return/)
})
