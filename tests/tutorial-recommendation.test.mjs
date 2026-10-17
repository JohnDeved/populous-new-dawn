import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import native from '../decomp/research/frontend-quit-menu/static-data.json' with { type: 'json' }
import assets from '../app/original-frontend.json' with { type: 'json' }
import { frontendTextWidth, frontendQuitRows } from '../app/frontend-composition.ts'
import { tutorialRecommendationText, tutorialParagraphRows, tutorialChoiceRows } from '../app/tutorial-recommendation.ts'

test('recommendation preserves menu2 text and action identities without claiming callback layout', () => {
  const [paragraph, yes, no, back] = native.menus[2].entries
  assert.equal(paragraph.labelId, 519)
  assert.equal(paragraph.label, tutorialRecommendationText)
  assert.equal(paragraph.u32[8], '00000258')
  assert.equal(paragraph.u32[9], '0000001e')
  assert.equal(paragraph.u32[10], '004c5b20', 'Post-render geometry remains unproved')
  assert.deepEqual([yes.action, no.action, back.action], ['004c5a40', '004c3340', '004c3970'])
  assert.deepEqual(tutorialChoiceRows.map(row => row.text), ['Yes', 'No', 'Back'])
})

test('browser-adapted paragraph wraps within600px and separates choices from text', () => {
  assert.equal(tutorialParagraphRows.map(row => row.text).join(' '), tutorialRecommendationText)
  assert.deepEqual(tutorialParagraphRows.map(row => row.y), [159, 189, 219, 249, 279])
  assert.deepEqual(tutorialChoiceRows.map(row => row.y), [309, 339, 454])
  for (const row of tutorialParagraphRows) {
    assert.equal(row.x, 320)
    assert.ok(frontendTextWidth(row.text) <= 600)
    for (const bank of ['feft33we', 'fehi33we', 'felo33we']) {
      assert.equal([...row.text].reduce((n, c) => n + assets.banks[bank].rects[c.charCodeAt(0) - 32].w, 0), frontendTextWidth(row.text))
    }
  }
})

test('browser-local preference handles absent, corrupt, answered and denied storage', async () => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  let saved = null
  const module = await import('../app/tutorial-recommendation.ts?storage-test')
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem(key) { assert.equal(key, module.TUTORIAL_RECOMMENDATION_KEY); return saved },
      setItem(key, value) { assert.equal(key, module.TUTORIAL_RECOMMENDATION_KEY); saved = value },
    } })
    assert.equal(module.hasAnsweredTutorialRecommendation(), false)
    saved = 'invalid'
    assert.equal(module.hasAnsweredTutorialRecommendation(), false)
    saved = 'answered'
    assert.equal(module.hasAnsweredTutorialRecommendation(), true)
    saved = null
    module.answerTutorialRecommendation()
    assert.equal(saved, 'answered')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied') } })
    const denied = await import('../app/tutorial-recommendation.ts?denied-test')
    assert.equal(denied.hasAnsweredTutorialRecommendation(), false)
    assert.doesNotThrow(() => denied.answerTutorialRecommendation())
    assert.equal(denied.hasAnsweredTutorialRecommendation(), true)
  } finally {
    if (old) Object.defineProperty(globalThis, 'localStorage', old)
    else delete globalThis.localStorage
  }
})

test('production recommendation choices preserve cancellation and guard repeated activation', () => {
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let handler
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(parsed) === 'onClick' && node.initializer?.getText(parsed).includes('answerTutorialRecommendation()')) handler = node.initializer.expression
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(handler)
  const body = ts.transpileModule(`return ${handler.getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const make = new Function('recommendationCommitted', 'back', 'row', 'answerTutorialRecommendation', 'onTutorial', 'onNewGame', body)
  for (const text of ['Yes', 'No', 'Back']) {
    const calls = []
    const handler = make({ current: false }, () => calls.push('back'), { text }, () => calls.push('answered'), () => calls.push('tutorial'), () => calls.push('campaign'))
    handler(); handler()
    assert.deepEqual(calls, text === 'Back' ? ['back'] : ['back', 'answered', text === 'Yes' ? 'tutorial' : 'campaign'])
  }
  assert.match(source, /label: 'Tutorial', action: onTutorial/)
})

test('production recommendation and Quit draws omit shadows only for HTML-fallback rows', () => {
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let draw
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'draw') draw = node.initializer.arguments[0]
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(draw)
  const body = ts.transpileModule(`return ${draw.getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const make = new Function('canvas', 'prepared', 'pointer', 'panel', 'pointerMode', 'glowFrame', 'optionRows', 'canvasWidth', 'tutorialRecommendationRows', 'frontendQuitRows', 'tutorialParagraphRows', 'questionReady', 'artReady', 'logoReady', 'frontendBackground', 'ImageData', body)
  const allRows = [...tutorialParagraphRows, ...tutorialChoiceRows]
  for (const [panel, questionRows, choiceRows] of [
    ['tutorial-recommendation', tutorialParagraphRows, tutorialChoiceRows],
    ['quit', frontendQuitRows.slice(0, 1), frontendQuitRows.slice(1)],
  ]) for (const [questionReady, artReady, expected] of [
    [true, true, [...questionRows, ...choiceRows]], [false, true, choiceRows],
    [true, false, questionRows], [false, false, []],
  ]) {
    let captured
    const draw = make(
      { current: { getContext: () => ({ putImageData() {} }) } }, { composition: new Uint8Array(1) },
      { current: { x: 320, y: 240 } }, panel, { current: false }, { current: 0 },
      [], 640, allRows, frontendQuitRows, tutorialParagraphRows, questionReady, artReady, true,
      (...args) => { captured = args[4]; return new Uint8ClampedArray(4) }, class {},
    )
    draw()
    assert.deepEqual(captured, expected)
  }
  assert.match(source, /\[panel, optionRows, canvasWidth, questionReady, artReady, logoReady, prepared\]/)
})
