import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import assets from '../app/original-frontend.json' with { type: 'json' }
import { frontendBackground, frontendQuitRows } from '../app/frontend-composition.ts'
import { tutorialParagraphRows, tutorialChoiceRows } from '../app/tutorial-recommendation.ts'

const bytes = new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin', import.meta.url)))
const sha = value => createHash('sha256').update(value).digest('hex')
const cases = [
  [{ x: 320, y: 240 }, true, null, [], 640],
  [{ x: 100, y: 100 }, false, 3, frontendQuitRows, 640],
  [{ x: 540, y: 80 }, true, 0, [], 854],
  [{ x: -30, y: 500 }, false, null, tutorialParagraphRows, 854],
]

test('logo-shadow default and explicit true preserve native golden and all-ready composition', () => {
  assert.equal(sha(frontendBackground(bytes, ...cases[0])), '81c170ca64dbf189a2cd8820eca71643a06e0d83cf7bb7156461b91e99f570e2')
  for (const args of cases) assert.deepEqual(frontendBackground(bytes, ...args, true), frontendBackground(bytes, ...args))
})

test('hidden logo shadow equals a transparent-logo-mask reference without changing other layers', () => {
  const before = bytes.slice()
  const transparent = bytes.slice()
  const logo = assets.masks.felgsden[0]
  transparent.fill(255, logo.offset, logo.offset + logo.w * logo.h)
  const transparentBefore = transparent.slice()
  for (const args of cases) {
    const hidden = frontendBackground(bytes, ...args, false)
    assert.deepEqual(hidden, frontendBackground(transparent, ...args))
    assert.notDeepEqual(hidden, frontendBackground(bytes, ...args, true))
  }
  assert.deepEqual(bytes, before)
  assert.deepEqual(transparent, transparentBefore)
})

test('every frontend panel passes foreground artwork readiness to its logo shadow', () => {
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let callback, dependencies
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'draw') {
      callback = node.initializer.arguments[0]
      dependencies = node.initializer.arguments[1]
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(callback)
  const body = ts.transpileModule(`return ${callback.getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const make = new Function('canvas', 'prepared', 'pointer', 'panel', 'pointerMode', 'glowFrame', 'optionRows', 'canvasWidth', 'tutorialRecommendationRows', 'frontendQuitRows', 'tutorialParagraphRows', 'questionReady', 'artReady', 'logoReady', 'frontendBackground', 'ImageData', 'badges', 'vectorFailures', 'checkpointRecovery', body)
  for (const panel of ['main', 'options', 'quit', 'tutorial-recommendation']) {
    for (const questionReady of [false, true]) for (const artReady of [false, true]) for (const logoReady of [false, true]) {
      let args
      const draw = make(
        { current: { getContext: () => ({ putImageData() {} }) } }, { composition: new Uint8Array(1) },
        { current: { x: 320, y: 240 } }, panel, { current: false }, { current: 0 }, [], 640,
        [...tutorialParagraphRows, ...tutorialChoiceRows], frontendQuitRows, tutorialParagraphRows,
        questionReady, artReady, logoReady, (...values) => { args = values; return new Uint8ClampedArray(4) }, class {}, { current: [] }, [false, false],
        { noticeRows: [], shadowRows: [] },
      )
      draw()
      assert.equal(args[6], logoReady, `${panel}: logo readiness follows foreground title`)
      assert.equal(args[7], artReady, `${panel}: main glyph readiness follows foreground labels`)
      assert.equal(args[2], panel === 'main')
    }
  }
  assert.deepEqual(dependencies.elements.map(node => node.getText(parsed)), [
    'panel', 'optionRows', 'canvasWidth', 'questionReady', 'artReady', 'logoReady',
    'prepared', 'vectorFailures', 'checkpointRecovery',
  ])
})
