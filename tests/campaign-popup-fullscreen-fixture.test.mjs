import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { homePopupFixture, homePopupSources } from '../scripts/campaign-popup-fixture/home-source.mjs'
import { activatePopupFullscreenFromMenu, assertPopupMenuRetention } from '../scripts/campaign-popup-fixture/fullscreen-menu.mjs'
import { finalizePopupFixture } from '../scripts/campaign-popup-fixture/finalize.mjs'
import { createFullscreenSession } from '../app/fullscreen-session.ts'

const root = new URL('..', import.meta.url).pathname
function sourceMenu(paused) {
  const source = homePopupSources(root)
  const world = { paused, messages: { slots: [{ serial: 7, text: 'Retained authored popup' }] } }
  const state = { menu: false, current: world, suspended: false }
  const engine = { current: { world, setModalSuspended(value) { state.suspended = value } } }
  const store = { getWorld: () => state.current, change: action => action(state.current) }
  const code = ts.transpileModule(`return (() => { ${source.menuSession}; ${source.openMenu}; ${source.closeMenu};
    return { openMenu, closeMenu, button: (${source.menuButton}), session: menuSession }; })()`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText
  const React = { createElement: (type, props, ...children) => ({ type, props, children }) }
  const owners = Function('React', 'QueryControlArt', 'world', 'engine', 'store', 'setMenu',
    'cancelNearbyInput', 'useCallback', 'useRef', code)(React, 'ActualQueryControlArt', world, engine, store,
    value => { state.menu = value }, () => {}, callback => callback, value => ({ current: value }))
  return { ...owners, state, world, engine }
}

for (const paused of [false, true]) test(`source-extracted Query/Menu/Continue restores prior pause=${paused}`, () => {
  const owner = sourceMenu(paused), before = structuredClone(owner.world)
  assert.equal(owner.button.props['aria-label'], 'Menu')
  assert.equal(owner.button.props.onClick, owner.openMenu)
  assert.equal(owner.button.children[0].type, 'ActualQueryControlArt')
  owner.button.props.onClick()
  assert.equal(owner.state.menu, true); assert.equal(owner.state.suspended, true)
  assert.equal(owner.world.paused, true); assert.equal(owner.session.current.paused, paused)
  owner.button.props.onClick()
  assert.equal(owner.session.current.paused, paused, 'Repeated menu entry cannot replace its saved owner')
  owner.closeMenu()
  assert.deepEqual(owner.world, before); assert.equal(owner.state.menu, false)
  assert.equal(owner.state.suspended, false); assert.equal(owner.session.current, null)
})

test('source-extracted Continue cannot restore a replacement world', () => {
  const owner = sourceMenu(false)
  owner.openMenu()
  owner.state.current = { paused: true, replacement: true }
  owner.closeMenu()
  assert.deepEqual(owner.state.current, { paused: true, replacement: true })
  assert.equal(owner.state.suspended, true, 'A different world cannot release the old scene owner')
})

function pageBoundary({ paused = true, afterAwait = () => {} } = {}) {
  const owner = sourceMenu(paused), log = [], events = new Map(), trace = {}
  let active = false, requests = 0, exits = 0
  const target = { addEventListener(type, listener) { events.set(type, listener) }, removeEventListener(type) { events.delete(type) } }
  const doc = { ...target, fullscreenEnabled: true, get fullscreenElement() { return active ? doc.documentElement : null },
    querySelectorAll() { return [] }, documentElement: { async requestFullscreen() { requests++; active = true; events.get('fullscreenchange')?.() } },
    async exitFullscreen() { exits++; active = false; events.get('fullscreenchange')?.() } }
  let fullscreen
  const session = createFullscreenSession(doc, target, state => { fullscreen = state })
  const snapshot = () => ({ world: structuredClone(owner.world), sameWorld: owner.engine.current.world === owner.world,
    acknowledgments: 0, calls: { gameplay: 0 }, keys: [], cheatsOpen: false, menu: owner.state.menu,
    modalSuspended: owner.state.suspended, popups: [{ serial: '7', open: true }],
    dialogs: owner.state.menu ? ['Game menu'] : [], focusOwner: owner.state.menu ? 'Game menu' : null,
    fullscreen: { active, requests, exits }, controlOwners: owner.state.menu ? ['Game menu'] : [] })
  const operation = async (name, fn) => { log.push(name); const value = await fn(); afterAwait(log.length, name, owner); return value }
  const button = name => ({
    click: async ({ timeout }) => operation(`click:${name}`, async () => {
      assert.ok(timeout > 0)
      if (name === 'Menu') owner.button.props.onClick()
      else if (name === 'Fullscreen') { assert.equal(owner.state.menu, true); await session.toggle() }
      else { assert.equal(name, 'Continue Game'); owner.closeMenu() }
    }),
    waitFor: async ({ state, timeout }) => operation(`wait:${name}`, () => {
      assert.equal(state, 'visible'); assert.ok(timeout > 0); assert.equal(owner.state.menu, true)
    }),
  })
  const menu = {
    getByRole(role, { name, exact }) { assert.equal(role, 'button'); assert.equal(exact, true); return button(name) },
    waitFor: async ({ state }) => operation(`wait:menu:${state}`, () => assert.equal(owner.state.menu, state === 'visible')),
    locator(selector) { assert.equal(selector, 'button[aria-label="Exit fullscreen"][aria-disabled="false"]'); return {
      waitFor: async ({ state }) => operation('wait:active', () => { assert.equal(state, 'visible'); assert.equal(fullscreen.active, true); assert.equal(fullscreen.pending, false) }),
    } },
  }
  return { owner, log, trace, snapshot, close: () => session.dispose(), page: {
    evaluate: async fn => operation('read', () => { assert.equal(fn.name, 'popupFullscreenOwnership'); return snapshot() }),
    getByRole(role, { name, exact }) {
      assert.equal(exact, true)
      if (role === 'dialog') { assert.equal(name, 'Game menu'); return menu }
      assert.equal(role, 'button'); assert.equal(name, 'Menu'); return button(name)
    },
    locator(selector) { assert.equal(selector, '[data-fullscreen-control]'); return {
      waitFor: async ({ state }) => operation('wait:detached', () => { assert.equal(state, 'detached'); assert.equal(owner.state.menu, false) }),
    } },
  } }
}

for (const paused of [false, true]) test(`fullscreen fixture uses actual menu callbacks and fullscreen session, prior pause=${paused}`, async () => {
  const f = pageBoundary({ paused })
  try {
    const trace = await activatePopupFullscreenFromMenu(f.page, { trace: f.trace })
    assert.deepEqual(f.log.filter(name => name.startsWith('click:')), ['click:Menu', 'click:Fullscreen', 'click:Continue Game'])
    assert.equal(trace.menuOpened.world.paused, true)
    assert.equal(trace.afterContinue.world.paused, paused)
    assert.equal(trace.afterContinue.fullscreen.requests, 1)
    assert.deepEqual(trace.afterContinue.popups, trace.before.popups)
    assert.deepEqual(trace.afterContinue.controlOwners, [])
  } finally { f.close() }
})

for (const kind of ['abort', 'deadline']) test(`fullscreen fixture stops after every late ${kind} boundary without another click or success`, async () => {
  const baseline = pageBoundary()
  try { await activatePopupFullscreenFromMenu(baseline.page) } finally { baseline.close() }
  for (let at = 1; at <= baseline.log.length; at++) {
    let now = 0, failed = false
    const controller = new AbortController(), reason = new Error('late abort')
    const f = pageBoundary({ afterAwait(n) { if (n === at) { if (kind === 'abort') controller.abort(reason); else now = 100 } } })
    try {
      try { await activatePopupFullscreenFromMenu(f.page, { timeout: 100, signal: controller.signal, now: () => now, trace: f.trace }) }
      catch (error) { failed = true; if (kind === 'abort') assert.equal(error, reason); else assert.match(error.message, /deadline expired/) }
      assert.equal(failed, true, `Boundary ${at} cannot publish success`)
      assert.deepEqual(f.log, baseline.log.slice(0, at), `Boundary ${at} cannot dispatch another await/input`)
      if (at === baseline.log.length) assert.equal(f.trace.afterContinue.fullscreen.active, true, 'Late actual observations stay in the failure trace')
    } finally { f.close() }
  }
})

test('popup ownership comparator rejects mutation, replacement, wrong pause and gameplay fullscreen hosts', () => {
  const f = pageBoundary()
  try {
    const before = f.snapshot()
    for (const mutate of [after => { after.world.paused = false }, after => { after.popups[0].serial = '8' },
      after => { after.popups[0].open = false }, after => { after.acknowledgments++ },
      after => { after.controlOwners = [null] }, after => { after.sameWorld = false },
      after => { after.calls.gameplay++ }, after => { after.dialogs = ['Other menu'] }]) {
      const after = structuredClone(before); mutate(after)
      assert.throws(() => assertPopupMenuRetention(before, after, { menu: false, active: false }))
    }
  } finally { f.close() }
})

test('generated fixture imports shipped Query and pause menu and runner retains every existing ownership scenario', () => {
  const fixture = homePopupFixture(root)
  const compiled = ts.transpileModule(fixture, { fileName: 'home.tsx', reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } })
  assert.deepEqual(compiled.diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error), [], 'Generated fixture remains valid TSX')
  assert.match(fixture, /import \{OriginalPauseMenu\} from .*\/app\/original-pause-menu/)
  assert.match(fixture, /import \{QueryControlArt\} from .*\/app\/query-control/)
  assert.match(fixture, /<OriginalPauseMenu[^>]*onContinue=\{closeMenu\}/)
  assert.doesNotMatch(fixture, /menu=false|openMenu=\(\)=>calls/)
  const run = readFileSync(new URL('../scripts/campaign-popup-fixture/run.mjs', import.meta.url), 'utf8')
  assert.match(run, /open\('home&running'\)/)
  assert.equal((run.match(/activatePopupFullscreenFromMenu\(page,/g) ?? []).length, 2)
  assert.doesNotMatch(run, /getByRole\('button',\{name:'Fullscreen'|fullscreenFixture\.set\(true\)/)
  for (const scenario of ['held Enter produces exactly one ACK click', 'Popup ownership precedes input-mask flyby skipping',
    'Fullscreen Escape retains browser default before popup capture', 'Outside fullscreen popup consumes Escape without acknowledgment',
    'F8/F9 preservation', 'one-shot focus return']) assert.ok(run.toLowerCase().includes(scenario.toLowerCase()), scenario)
})

test('fixture finalization keeps falsy primary errors and actual transition traces while independently closing and saving', async () => {
  for (const primaryError of [undefined, null, false, 0, '']) {
    const trace = { afterContinue: { actualObservation: true } }
    const receipt = { status: 'failed', checks: [{ fullscreenMenuTrace: trace }] }, calls = []
    const result = await finalizePopupFixture({ receipt, failed: true, primaryError,
      browser: { async close() { calls.push('browser'); throw null } },
      server: { async close() { calls.push('server'); throw false } },
      save() { calls.push('save'); throw 0 },
      emit(retained) { calls.push('emit'); assert.equal(retained, receipt); assert.equal(retained.checks[0].fullscreenMenuTrace, trace); throw '' },
    })
    assert.deepEqual(calls, ['browser', 'server', 'save', 'emit'])
    assert.equal(result.failed, true); assert.equal(result.primaryError, primaryError)
    assert.equal(receipt.error, String(primaryError)); assert.equal(receipt.status, 'failed')
    assert.deepEqual(receipt.finalizationErrors.map(item => item.phase), ['browser-close', 'server-close', 'save-receipt', 'emit-terminal'])
    assert.deepEqual(receipt.finalizationErrors.map(item => item.error), ['null', 'false', '0', ''])
  }
})

test('falsy cleanup or save rejection cannot publish a passing fixture and cannot skip another owner', async () => {
  for (const phase of ['browser', 'server', 'save']) for (const reason of [undefined, null, false, 0, '']) {
    const receipt = { status: 'passed', checks: [] }, calls = []
    const action = name => () => { calls.push(name); if (name === phase) throw reason }
    const result = await finalizePopupFixture({ receipt, failed: false,
      browser: { close: action('browser') }, server: { close: action('server') }, save: action('save'),
      emit(retained) { calls.push('emit'); assert.equal(retained.status, 'failed'); assert.equal(retained.error, String(reason)) },
    })
    assert.deepEqual(calls, ['browser', 'server', 'save', 'emit'])
    assert.equal(result.failed, true); assert.equal(result.primaryError, reason)
    assert.equal(receipt.status, 'failed')
  }
})

test('terminal emission failure updates a previously saved fixture without masking its first error', async () => {
  const receipt = { status: 'passed', checks: [] }, snapshots = [], calls = []
  const result = await finalizePopupFixture({ receipt, failed: false,
    browser: { close() { calls.push('browser') } }, server: { close() { calls.push('server') } },
    save() { calls.push('save'); snapshots.push(structuredClone(receipt)); if (snapshots.length === 2) throw null },
    emit() { calls.push('emit'); throw false },
  })
  assert.deepEqual(calls, ['browser', 'server', 'save', 'emit', 'save'])
  assert.deepEqual(snapshots.map(value => value.status), ['passed', 'failed'])
  assert.equal(result.failed, true); assert.equal(result.primaryError, false)
  assert.equal(receipt.error, 'false')
  assert.deepEqual(receipt.finalizationErrors.map(item => item.phase), ['emit-terminal', 'save-terminal-failure'])
})

test('successful fixture finalization preserves success and the runner supplies an explicit failed state', async () => {
  const receipt = { status: 'passed', checks: [] }, calls = []
  const result = await finalizePopupFixture({ receipt, failed: false,
    browser: { close() { calls.push('browser') } }, server: { close() { calls.push('server') } },
    save() { calls.push('save') }, emit(value) { calls.push('emit'); assert.equal(value, receipt) },
  })
  assert.deepEqual(calls, ['browser', 'server', 'save', 'emit'])
  assert.equal(result.failed, false); assert.equal(receipt.status, 'passed')
  assert.deepEqual(receipt.finalizationErrors, [])
  const run = readFileSync(new URL('../scripts/campaign-popup-fixture/run.mjs', import.meta.url), 'utf8')
  assert.match(run, /catch\(error\)\{episodeFailed=true;episodeError=error/)
  assert.match(run, /finalizePopupFixture\(\{receipt,failed:episodeFailed,primaryError:episodeError,browser,server,save,/)
  assert.match(run, /if\(terminal.failed\)process.exitCode=1/)
})
