import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import assets from '../app/original-frontend.json' with { type: 'json' }
import { frontendBackground, frontendQuitRows } from '../app/frontend-composition.ts'

const bytes = new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin', import.meta.url)))
const sha = value => createHash('sha256').update(value).digest('hex')

test('main text default preserves all-ready native golden and explicit true output', () => {
  assert.equal(sha(frontendBackground(bytes, { x: 320, y: 240 }, true)), '81c170ca64dbf189a2cd8820eca71643a06e0d83cf7bb7156461b91e99f570e2')
  for (const width of [640, 854]) for (const logo of [false, true]) {
    const args = [{ x: 100, y: 100 }, true, 3, frontendQuitRows, width, logo]
    assert.deepEqual(frontendBackground(bytes, ...args, true), frontendBackground(bytes, ...args))
  }
})

test('hidden main shadows equal transparent glyph masks independently of logo and preserve other panels', () => {
  const before = bytes.slice(), transparent = bytes.slice()
  for (const mask of assets.masks.fesd33we) transparent.fill(255, mask.offset, mask.offset + mask.w * mask.h)
  for (const width of [640, 854]) for (const logo of [false, true]) {
    const args = [{ x: 100, y: 100 }, true, 3, frontendQuitRows, width, logo]
    assert.deepEqual(frontendBackground(bytes, ...args, false), frontendBackground(transparent, ...args))
    assert.notDeepEqual(frontendBackground(bytes, ...args, false), frontendBackground(bytes, ...args, true))
    args[1] = false
    assert.deepEqual(frontendBackground(bytes, ...args, false), frontendBackground(bytes, ...args, true))
  }
  assert.deepEqual(bytes, before)
})

test('Options publishes only its own ready foreground rows and republishes on readiness changes', () => {
  const source = readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('options.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let effect
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect' && node.arguments[0]?.getText(parsed).includes('onTextRowsChange?.')) effect = node
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(effect)
  const body = ts.transpileModule(`return ${effect.arguments[0].getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const make = new Function('ready', 'rows', 'onTextRowsChange', body)
  const rows = [{ text: 'Back', x: 320, y: 454 }]
  const observed = []
  for (const ready of [false, true, false]) make(ready, rows, value => observed.push(value))()
  assert.deepEqual(observed, [[], rows, []])
  assert.equal(observed[1], rows)
  make(false, rows, undefined)()
  assert.match(effect.arguments[1].getText(parsed), /\bready\b/)
  assert.match(effect.arguments[1].getText(parsed), /\brows\b/)
  assert.match(effect.arguments[1].getText(parsed), /\bonTextRowsChange\b/)
})

test('Options entry clears previously published rows before remounting its fallback foreground', () => {
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let action
  function visit(node) {
    if (ts.isObjectLiteralExpression(node) && node.properties.some(p => ts.isPropertyAssignment(p) && p.name.getText(parsed) === 'label' && p.initializer.getText(parsed) === "'Options'")) {
      action = node.properties.find(p => p.name?.getText(parsed) === 'action').initializer
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(action)
  const calls = []
  const body = ts.transpileModule(`return ${action.getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('setOptionRows', 'setPanel', body)(rows => calls.push(['rows', rows]), panel => calls.push(['panel', panel]))()
  assert.deepEqual(calls, [['rows', []], ['panel', 'options']])
})
