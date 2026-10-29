import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { readCurrentBuildingPanel, assertCurrentBuildingPanel } from '../scripts/tutorial-browser/building-panel-precondition.mjs'

function fixture() {
  const panel = { isConnected: true, hidden: false, style: { display: 'block', visibility: 'visible' },
    getClientRects: () => [{ width: 20, height: 30 }] }
  const scene = { buildingPanels: new Map([[7, panel]]) }, building = { id: 7 }
  const context = { window: { buildingIdentity: { panel, scene, building } },
    document: { querySelectorAll: () => panel.hidden ? [] : [panel] },
    getComputedStyle: element => element.style }
  return { panel, scene, context }
}
function snapshot(context) {
  // Execute the actual serialized reader, not a separately reimplemented predicate.
  return JSON.parse(JSON.stringify(runInNewContext(`(${readCurrentBuildingPanel.toString()})()`, context)))
}

test('already-open current panel passes the immediate actual reader and predicate', () => {
  assertCurrentBuildingPanel(snapshot(fixture().context))
})

test('hidden, disconnected, stale-map, unrelated-visible and invisible states fail closed', () => {
  for (const damage of [
    f => { f.panel.hidden = true },
    f => { f.panel.isConnected = false },
    f => { f.scene.buildingPanels.set(7, {}) },
    f => { f.context.document.querySelectorAll = () => [{ ...f.panel }] },
    f => { f.panel.style.visibility = 'hidden' },
    f => { f.panel.getClientRects = () => [{ width: 0, height: 30 }] },
  ]) {
    const f = fixture(); damage(f)
    assert.throws(() => assertCurrentBuildingPanel(snapshot(f.context)), /already-open current panel/)
  }
})

test('an identity change after an accepted observation is rejected by the next observation', () => {
  const f = fixture()
  assertCurrentBuildingPanel(snapshot(f.context))
  f.scene.buildingPanels.set(7, { ...f.panel })
  assert.throws(() => assertCurrentBuildingPanel(snapshot(f.context)))
})

test('actual before-hold snapshot rejects identity changing after the initial precondition', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
  const start = source.indexOf('const before = await page.evaluate(') + 'const before = await page.evaluate('.length
  const end = source.indexOf(', { hold, boundary })', start)
  assert.ok(start > 0 && end > start)
  const f = fixture()
  f.panel.matches = () => true
  f.panel.contains = () => false
  f.context.document.activeElement = null
  f.context.window.buildingIdentity.building.team = 'blue'
  Object.assign(f.scene, { visible: () => true, navigationButtons: () => 0,
    renderer: { info: { render: { frame: 9 } } }, viewPoint: { x: 1, z: 2 } })
  assertCurrentBuildingPanel(snapshot(f.context))
  const run = () => runInNewContext(`(${source.slice(start, end)})({hold:'pointer',boundary:'ownership'})`, f.context)
  assert.equal(run().held, true)
  f.scene.buildingPanels.set(7, { ...f.panel })
  assert.throws(run, /Expected held, owned and visible positive control/)
})

test('scenario checks preconditions before holds and preserves all restoration and deadline paths', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
  assert.match(source, /for \(const hold of \['pointer', 'focus'\]\)/)
  assert.match(source, /for \(const boundary of \['ownership', 'visibility'\]\)/)
  assert.ok(source.indexOf('assertCurrentBuildingPanel(await page.evaluate(readCurrentBuildingPanel))') < source.indexOf("if (hold === 'pointer')"))
  assert.doesNotMatch(source, /revealCurrentPanel\(`\$\{hold\}\/\$\{boundary\}\/initial`\)/)
  assert.match(source, /await revealCurrentPanel\(`\$\{hold\}\/\$\{boundary\}\/restore`\)/)
  assert.match(source, /!p\.isConnected \|\| p\.hidden \|\| h\.scene\.buildingPanels\.get\(h\.building\.id\) !== p/)
  for (const preserved of ['buildingPanelIdentityLimitMs = 35000', 'assertReplacement(report.replacement)',
    'assertCompletion(report.completed)', "await screenshot('original')", "await screenshot('selected')",
    'await screenshot(`held-${boundary}-hidden`)', "await screenshot('held-restored')",
    "await screenshot('dismantling')", "await screenshot('completed')", 'clearTimeout(timer)',
    "'Eligible held panel remains visible across real frames'", "'Current eligible panel can reopen'",
    'h.scene.navigationButtons() !== 0']) assert.ok(source.includes(preserved), preserved)
})
