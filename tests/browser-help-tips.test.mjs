import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createWorld } from '../app/model.ts'
import { missionNumbers, tutorialLevel } from '../app/mission-data.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const component = { exports: {} }
new Function('require', 'module', 'exports', ts.transpileModule(
  readFileSync(new URL('../app/browser-help-tips.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText)(require, component, component.exports)
const markup = level => renderToStaticMarkup(component.exports.BrowserHelpTips({ level }))
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')

test('Mission 1 directions match authored shrine locations, reward count and stock limit', () => {
  const world = createWorld(1)
  const bridge = world.shrines.find(head => head.reward === 'bridge')
  const lightning = world.shrines.find(head => head.reward === 'lightning')
  assert.deepEqual([bridge.x, bridge.z], [-5, 25])
  assert.deepEqual([lightning.x, lightning.z, lightning.remaining], [11, 1, 4])
  assert.equal(rules.spellCharging[12].normalLimit, 4)
  assert.match(markup(world.outcome.level), /Mission 1: Worship the southern head for Land Bridge/)
  assert.match(markup(1), /central head for four Lightning gifts/)
})

test('all other campaign missions and tutorial retain general help without Mission 1 directions', () => {
  for (const level of [...missionNumbers, tutorialLevel, 999]) {
    const html = markup(level)
    assert.match(html, /Right-click a rechargeable spell/)
    assert.match(html, /Only your shaman can learn at the vault/)
    assert.match(html, /completed training hut to train them/)
    if (level !== 1) {
      assert.doesNotMatch(html, /southern head|central head|four Lightning|data-mission-help/)
    }
  }
  // Re-rendering the same production component follows current mission, not initial startup.
  assert.match(markup(1), /data-mission-help="1"/)
  assert.doesNotMatch(markup(2), /data-mission-help/)
  assert.match(markup(1), /data-mission-help="1"/)
})

test('live Browser help receives current world level and labels historical references explicitly', () => {
  assert.match(page, /<BrowserHelpTips level=\{world\.outcome\.level\} \/>/)
  assert.match(page, /<h3>Controls<\/h3>/)
  assert.match(page, /Mission 1 reference: The Journey Begins/)
  assert.doesNotMatch(page, /Your powers, at a glance/)
})

test('actual page synopsis does not direct Mission 19 or unknown missions to Armageddon', () => {
  const parsed = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let synopsis
  function visit(node) {
    if (ts.isJsxExpression(node) && node.expression?.getText(parsed).startsWith('world.outcome.level === tutorialLevel')) synopsis = node.expression
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(synopsis)
  const readSynopsis = new Function('world', 'tutorialLevel', `return (${synopsis.getText(parsed)})`)
  assert.equal(readSynopsis({ outcome: { level: 19 } }, tutorialLevel), null)
  assert.equal(readSynopsis({ outcome: { level: 999 } }, tutorialLevel), null)
  assert.deepEqual(createWorld(19).shrines.map(head => head.reward), ['firestorm', 'volcano', 'teleport'])
  for (const level of [18, 23]) assert.match(readSynopsis({ outcome: { level } }, tutorialLevel), /seek Armageddon/)
  assert.match(readSynopsis({ outcome: { level: 1 } }, tutorialLevel), /Worship for Land Bridge/)
  assert.match(readSynopsis({ outcome: { level: tutorialLevel } }, tutorialLevel), /World View with Return/)
})
