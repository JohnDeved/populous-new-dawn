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
    getComputedStyle: element => element.style, HTMLElement: class {} }
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

// These execute the actual serialized callbacks. Browser scheduling, input and
// rendering remain separate hosted gates; queued effects below are supplied.
function holdFixture() {
  const f = fixture(), h = f.context.window.buildingIdentity
  const calls = [], focused = new f.context.HTMLElement()
  focused.blur = () => { calls.push('blur'); f.context.document.activeElement = null }
  f.context.document.activeElement = focused
  f.panel.matches = () => true
  f.panel.contains = node => node === focused
  h.building.team = 'blue'
  Object.assign(f.scene, { visible: () => true, navigationButtons: () => 0,
    renderer: { info: { render: { frame: 9 } } }, viewPoint: { x: 1, z: 2 } })
  return { ...f, h, calls, focused }
}
function actualHoldCallback(name, context, hold = 'pointer', boundary = 'ownership') {
  const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
  const prefix = `const ${name} = await page.evaluate(`
  const at = source.indexOf(prefix), start = at + prefix.length
  const end = source.indexOf(', { hold, boundary })', start)
  assert.ok(at >= 0 && end > start)
  return runInNewContext(`(${source.slice(start, end)})(${JSON.stringify({ hold, boundary })})`, context)
}

test('pointer snapshot performs the real blur before reading current identity and hold', () => {
  const f = holdFixture()
  assert.equal(actualHoldCallback('before', f.context).held, true)
  assert.deepEqual(f.calls, ['blur'])
  assert.equal(f.context.document.activeElement, null)
  for (const damage of [
    f => { f.scene.buildingPanels.set(7, { ...f.panel }) },
    f => { f.h.building.team = 'red' },
    f => { f.panel.hidden = true },
  ]) {
    const changed = holdFixture()
    changed.focused.blur = () => {
      changed.context.document.activeElement = null
      damage(changed)
    }
    assert.throws(() => actualHoldCallback('before', changed.context), /Expected held, owned and visible/)
  }
})

test('focus snapshot does not blur and a failed pointer blur cannot certify a hold', () => {
  const f = holdFixture()
  f.panel.matches = () => false
  assert.equal(actualHoldCallback('before', f.context, 'focus').held, true)
  assert.deepEqual(f.calls, [])
  const failed = holdFixture()
  failed.focused.blur = () => { throw Error('blur failed') }
  assert.throws(() => actualHoldCallback('before', failed.context), /blur failed/)
  const retained = holdFixture()
  retained.focused.blur = () => {}
  assert.throws(() => actualHoldCallback('before', retained.context), /Expected held, owned and visible/)
})

test('post-frame callback rejects deferred identity and eligibility effects before applying a boundary', () => {
  for (const damage of [
    f => { const replacement = { ...f.panel }; f.h.panel = replacement; f.scene.buildingPanels.set(7, replacement) },
    f => { f.h.building = { ...f.h.building } },
    f => { f.h.scene = { ...f.scene } },
    f => { delete f.h.heldVisibilityBefore },
    f => { f.scene.buildingPanels.set(7, { ...f.panel }) },
    f => { f.panel.isConnected = false },
    f => { f.panel.hidden = true },
    f => { f.h.building.team = 'red' },
    f => { f.scene.visible = () => false },
    f => { f.context.document.activeElement = f.focused },
  ]) {
    const f = holdFixture(), queued = []
    f.focused.blur = () => {
      f.context.document.activeElement = null
      queued.push(() => damage(f))
    }
    assert.equal(actualHoldCallback('before', f.context).held, true)
    // Supplied deferred callback after the initial snapshot, not real RAF proof.
    for (const effect of queued) effect()
    f.scene.renderer.info.render.frame += 2
    let focusCalls = 0
    f.scene.focus = () => { focusCalls++ }
    assert.throws(() => actualHoldCallback('transition', f.context, 'pointer', 'visibility'), /Panel identity or eligibility changed/)
    assert.equal(focusCalls, 0, 'Reject before the supplied visibility boundary is applied')
  }
})

test('valid post-frame pointer and focus controls still apply the requested ownership boundary', () => {
  for (const hold of ['pointer', 'focus']) {
    const f = holdFixture()
    f.panel.matches = () => hold === 'pointer'
    actualHoldCallback('before', f.context, hold)
    f.scene.renderer.info.render.frame += 2
    const transition = actualHoldCallback('transition', f.context, hold)
    assert.equal(transition.held, true)
    assert.equal(transition.frame, 11)
    assert.equal(transition.team, 'red')
  }
})


test('focus-hold gaining pointer hover is rejected before the visibility boundary', () => {
  const f = holdFixture()
  f.panel.matches = () => false
  actualHoldCallback('before', f.context, 'focus')
  f.scene.renderer.info.render.frame += 2
  f.panel.matches = () => true
  let focusCalls = 0
  f.scene.focus = () => { focusCalls++ }
  assert.throws(() => actualHoldCallback('transition', f.context, 'focus', 'visibility'), /Panel identity or eligibility changed/)
  assert.equal(focusCalls, 0)
  assert.equal(f.h.building.team, 'blue')
})

test('valid pointer and focus controls apply the supplied visibility boundary without changing ownership', () => {
  for (const hold of ['pointer', 'focus']) {
    const f = holdFixture(), focusCalls = []
    let visible = true
    f.panel.matches = () => hold === 'pointer'
    f.scene.visible = () => visible
    f.scene.focus = point => {
      focusCalls.push({ ...point })
      f.scene.viewPoint = { ...point }
      visible = false
    }
    actualHoldCallback('before', f.context, hold)
    f.scene.renderer.info.render.frame += 2
    const transition = actualHoldCallback('transition', f.context, hold, 'visibility')
    assert.equal(transition.held, true)
    assert.equal(transition.frame, 11)
    assert.equal(transition.afterVisible, false)
    assert.equal(transition.team, 'blue')
    assert.deepEqual(focusCalls, [{ x: 129, z: 2 }])
  }
})
