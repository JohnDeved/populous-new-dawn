import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { captureMenuIdentity, observeMenuIdentity, recoverSnapshotMenu, resolvePublicMenuEntry }
  from '../scripts/browser-performance/snapshot-menu-recovery.mjs'

const selectors = {
  settings: 'aside.native-hud[aria-label="Tribe controls"] .top-actions > button[aria-label="Game settings"][title="Game settings"]:not([aria-description])',
  title: 'aside.native-hud[aria-label="Tribe controls"] .shaman-controls > button.help-button[aria-label="Menu"][title="Help and game menu"]:not([aria-description])',
  description: 'aside.native-hud[aria-label="Tribe controls"] .shaman-controls > button.help-button[aria-label="Menu"][aria-description="Help and game menu"]:not([title])',
}
const describedMenu = { name: 'Menu', attributes: { title: null, 'aria-description': 'Help and game menu' } }
function matchesControl(entry, selector) {
  // Bind the double to the complete declared selector, not a generic "matches"
  // success. Any weaker ancestor/class/name/attribute selector fails this test.
  assert.ok(Object.values(selectors).includes(selector), `Unexpected selector: ${selector}`)
  if (entry.shippedShape === false) return false
  const attributes = { title: entry.name === 'Menu' ? 'Help and game menu' : 'Game settings',
    'aria-description': null, ...entry.attributes }
  if (entry.name === 'Game settings') return selector === selectors.settings
    && attributes.title === 'Game settings' && attributes['aria-description'] === null
  return selector === selectors.title
    ? attributes.title === 'Help and game menu' && attributes['aria-description'] === null
    : selector === selectors.description && attributes.title === null && attributes['aria-description'] === 'Help and game menu'
}

// In-memory API/control doubles only. They do not certify rendered old/new UI,
// Escape propagation, production click handlers, or a performance comparison.
function fixture(options = {}) {
  const entries = options.entries ?? [{ name: 'Game settings' }, { name: 'Menu' }]
  const state = { level: 2, turn: 70, time: 70 / 12, pendingTime: 0, randomState: 4,
    paused: true, inputMask: 0, flybyActive: false, sameScene: true, sceneConnected: true,
    latchRemoved: true, visibility: 'visible', selected: [], mode: null,
    simulationSha256: 'a', unitsSha256: 'b', terrainSha256: 'c', geometrySha256: 'd',
    camera: { bearing: 0, position: { x: 10, y: 20, angle: 0 }, keys: [], pointerButtons: 0 },
    viewport: { width: 1440, height: 1000, devicePixelRatio: 1 }, timeOriginUnixMs: 123,
    modalSuspended: false }
  const world = { speed: 1 }, canvas = { isConnected: true }
  const scene = { world, renderer: { domElement: canvas } }
  const win = { testSceneRef: { current: scene }, testScene: scene, testStore: { getWorld: () => world } }
  const record = { preparation: [] }, calls = [], disposed = []
  let open = false, ready = true
  const countResult = n => ({ count: async () => n })
  const resume = { count: async () => options.noResume ? 0 : 1,
    isVisible: async () => true, isEnabled: async () => true }
  const element = { getAttribute: name => name === 'aria-label' ? options.dialogName ?? 'Game menu'
    : options.panel ?? 'root', get open() { return open }, matches: name => name === ':modal' && !options.nonModal }
  const dialog = { evaluate: async fn => fn(element), dispose: async () => {
    disposed.push('dialog'); if (options.dialogDisposeError) throw Error('Dialog disposal failed') },
    waitForElementState: async mode => { calls.push(`original:${mode}`); assert.equal(open, false, 'Original dialog is not hidden') } }
  const menu = { count: async () => open ? 1 : 0,
    waitFor: async ({ state }) => { calls.push(`menu:${state}`)
      assert.equal(open, state === 'visible', `Native dialog not ${state}`) },
    elementHandle: async () => dialog, getByRole: (role, query) => {
      assert.equal(role, 'button'); assert.deepEqual(query, { name: 'Continue Game', exact: true }); return resume } }
  const page = {
    evaluateHandle: async fn => {
      assert.equal(fn, captureMenuIdentity)
      const value = fn()
      return { evaluate: async read => read(value), dispose: async () => {
        disposed.push('identity'); if (options.identityDisposeError) throw Error('Identity disposal failed') } }
    },
    locator: selector => {
      if (selector === 'dialog[data-original-pause-menu]') return menu
      assert.ok(['dialog:visible, [role="dialog"]:visible', 'dialog[open]'].includes(selector))
      return countResult(Number(open) + Number(!!options.startingDialog) + Number(open && !!options.extraDialog))
    },
    getByRole: (role, query) => {
      if (role === 'dialog') return countResult(open && (!query || query.name === (options.dialogName ?? 'Game menu')) ? 1 : 0)
      assert.equal(role, 'button'); assert.equal(query.exact, true)
      const matches = entries.filter(entry => entry.name === query.name && (query.includeHidden || entry.exposed !== false))
      return { count: async () => matches.length, isVisible: async () => matches[0]?.visible !== false,
        isEnabled: async () => matches[0]?.enabled !== false,
        evaluate: async (fn, selectors) => fn({ matches: selector => matchesControl(matches[0], selector) }, selectors),
        click: async (...args) => {
          assert.deepEqual(args, [], 'No force or actionability overrides')
          calls.push(`click:${query.name}`)
          if (options.clickError) throw Error('Click outcome uncertain')
          open = !options.noOpen; state.modalSuspended = open
          options.onOpen?.({ state, world, win, scene, canvas })
        } }
    },
    keyboard: { press: async key => {
      calls.push(`press:${key}`); assert.equal(key, 'Escape')
      if (!options.noClose) { open = false; state.modalSuspended = false }
      if (options.inputNotReady) ready = false
      options.onClose?.({ state, world, win, scene, canvas })
    } },
  }
  const run = async () => {
    const previous = globalThis.window; globalThis.window = win
    try { return await recoverSnapshotMenu({ page, record, observe: async () => structuredClone(state),
      assertAdmission: observed => {
        calls.push('admission'); assert.equal(ready, true, 'Original input readiness failed')
        assert.equal(observed.paused, true); assert.equal(observed.modalSuspended, false)
      }, save: () => calls.push('save') }) }
    finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
  }
  return { run, page, calls, record, disposed }
}

for (const [shape, entries, expectedSelectors] of [
  ['legacy-dual-entry', [{ name: 'Game settings' }, { name: 'Menu' }], [selectors.settings, selectors.title]],
  ['native-menu-only', [{ name: 'Menu' }], [selectors.title]],
  ['native-menu-description-only', [describedMenu], [selectors.description]],
]) test(`one exact ${shape} route performs one click and real Escape outside measurement`, async () => {
  const name = entries[0].name, f = fixture({ entries })
  await f.run()
  assert.deepEqual(f.calls.filter(s => s.startsWith('click:') || s.startsWith('press:')), [`click:${name}`, 'press:Escape'])
  assert.equal(f.calls.filter(s => s === 'admission').length, 2)
  assert.deepEqual(f.disposed, ['dialog', 'identity'])
  const [opening, closing] = f.record.preparation
  assert.equal(opening.route.role, 'button'); assert.equal(opening.route.name, name); assert.equal(opening.route.exact, true)
  assert.equal(opening.route.shape, shape)
  assert.deepEqual(opening.route.controls, entries.map(({ name }, index) => ({ name, selector: expectedSelectors[index] })))
  assert.deepEqual(closing.route, opening.route)
  assert.equal(opening.measured, false); assert.equal(closing.measured, false)
  assert.equal(opening.identity.sameWorld, true); assert.equal(opening.identity.originalSpeed, 1)
  assert.deepEqual(opening.dialog, { name: 'Game menu', panel: 'root', open: true, modal: true })
  assert.equal(f.record.menu.modalSuspended, true); assert.equal(closing.after.modalSuspended, false)
  assert.equal(closing.dialogHidden, true)
  assert.ok(f.calls.indexOf('original:hidden') < f.calls.indexOf('menu:hidden'))
})

for (const [label, entries] of [
  ['missing', []], ['non-exact', [{ name: 'Open Menu' }]],
  ['undeclared dual shape', [{ name: 'Game settings', shippedShape: false }, { name: 'Menu' }]],
  ['old route without native Menu', [{ name: 'Game settings' }]],
  ['undeclared Menu shape', [{ name: 'Menu', shippedShape: false }]],
  ['disabled old route with working Menu', [{ name: 'Game settings', enabled: false }, { name: 'Menu' }]],
  ['hidden old route with working Menu', [{ name: 'Game settings', visible: false }, { name: 'Menu' }]],
  ['duplicate old', [{ name: 'Game settings' }, { name: 'Game settings' }]],
  ['duplicate new', [{ name: 'Menu' }, { name: 'Menu' }]],
  ['hidden', [{ name: 'Menu', visible: false }]],
  ['accessibility-hidden', [{ name: 'Menu', exposed: false }]],
  ['disabled', [{ name: 'Menu', enabled: false }]],
  ['hidden duplicate', [{ name: 'Menu' }, { name: 'Menu', exposed: false, visible: false }]],
  ['hidden alternative', [{ name: 'Game settings' }, { name: 'Menu', exposed: false, visible: false }]],
  ['legacy settings with description Menu', [{ name: 'Game settings' }, describedMenu]],
  ['title and description on one Menu', [{ name: 'Menu', attributes: { 'aria-description': 'Help and game menu' } }]],
  ['title and malformed description on one Menu', [{ name: 'Menu', attributes: { 'aria-description': 'Other menu' } }]],
  ['description and empty title on one Menu', [{ ...describedMenu, attributes: { ...describedMenu.attributes, title: '' } }]],
  ['legacy settings with a description', [{ name: 'Game settings', attributes: { 'aria-description': 'Game settings' } }, { name: 'Menu' }]],
  ['duplicate title and description Menus', [{ name: 'Menu' }, describedMenu]],
  ['hidden duplicate description Menu', [{ name: 'Menu' }, { ...describedMenu, exposed: false, visible: false }]],
  ['accessibility-hidden description Menu', [{ ...describedMenu, exposed: false }]],
  ['hidden description Menu', [{ ...describedMenu, visible: false }]],
  ['disabled description Menu', [{ ...describedMenu, enabled: false }]],
  ['undeclared description location/class', [{ ...describedMenu, shippedShape: false }]],
  ['non-exact description Menu name', [{ ...describedMenu, name: 'Open Menu' }]],
  ...[null, '', 'Help', 'help and game menu', 'Help and game menu ', ' Help and game menu'].map(description =>
    [`malformed description ${JSON.stringify(description)}`, [{ name: 'Menu', attributes: { title: null, 'aria-description': description } }]]),
  ['description and malformed title', [{ name: 'Menu', attributes: { title: 'Other menu', 'aria-description': 'Help and game menu' } }]],
]) test(`${label} public entry fails before any click`, async () => {
  const f = fixture({ entries })
  await assert.rejects(f.run())
  assert.equal(f.calls.some(s => s.startsWith('click:') || s.startsWith('press:')), false)
  assert.deepEqual(f.disposed, ['identity'])
})

test('existing dialog fails before resolving or opening another menu', async () => {
  const f = fixture({ startingDialog: true })
  await assert.rejects(f.run(), /Unexpected visible dialog/)
  assert.equal(f.calls.some(s => s.startsWith('click:')), false)
})
for (const options of [{ dialogName: 'Options' }, { panel: 'options' }, { extraDialog: true },
  { nonModal: true }, { noResume: true }, { noOpen: true }]) test(`wrong/non-root opening fails: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options)
  await assert.rejects(f.run())
  assert.equal(f.calls.filter(s => s.startsWith('click:')).length, 1)
  assert.equal(f.calls.includes('press:Escape'), false)
})

test('uncertain click is never retried or followed by Escape', async () => {
  const f = fixture({ clickError: true })
  await assert.rejects(f.run(), /Click outcome uncertain/)
  assert.equal(f.calls.filter(s => s.startsWith('click:')).length, 1)
  assert.equal(f.calls.includes('press:Escape'), false)
  assert.equal(f.record.preparation[0].clickAttempted, true)
})
for (const reason of ['popup-owned Escape', 'prevented Escape', 'no-op close']) test(`${reason} cannot pass hidden proof`, async () => {
  const f = fixture({ noClose: true })
  await assert.rejects(f.run(), /Original dialog is not hidden/)
  assert.equal(f.calls.filter(s => s === 'press:Escape').length, 1)
  assert.notEqual(f.record.preparation.at(-1).dialogHidden, true)
})

const mutations = {
  scene: ({ win, scene }) => { win.testSceneRef.current = { ...scene }; win.testScene = win.testSceneRef.current },
  world: ({ win, scene, world }) => { const replacement = { ...world }; win.testStore.getWorld = () => replacement; scene.world = replacement },
  canvas: ({ scene }) => { scene.renderer.domElement = { isConnected: true } },
  disconnected: ({ canvas }) => { canvas.isConnected = false },
  speed: ({ world }) => { world.speed = 2 },
  turn: ({ state }) => { state.turn++ },
  pause: ({ state }) => { state.paused = false },
  input: ({ state }) => { state.inputMask = 64 },
  camera: ({ state }) => { state.camera.bearing++ },
  selection: ({ state }) => { state.selected = [54] },
  simulation: ({ state }) => { state.simulationSha256 = 'changed' },
}
for (const [name, mutate] of Object.entries(mutations)) for (const boundary of ['onOpen', 'onClose'])
  test(`${name} drift at ${boundary} rejects the round trip`, async () => {
    const f = fixture({ [boundary]: mutate })
    await assert.rejects(f.run())
    assert.equal(f.calls.filter(s => s.startsWith('click:')).length, 1)
    assert.equal(f.calls.filter(s => s.startsWith('press:')).length, boundary === 'onOpen' ? 0 : 1)
    assert.deepEqual(f.disposed, ['dialog', 'identity'])
  })

test('restored-looking state cannot bypass failed original input readiness', async () => {
  const f = fixture({ inputNotReady: true })
  await assert.rejects(f.run(), /Original input readiness failed/)
  assert.equal(f.calls.filter(s => s === 'admission').length, 2)
})

for (const cleanup of ['dialogDisposeError', 'identityDisposeError'])
  test(`primary failure survives ${cleanup} and both handles are disposed`, async () => {
    const f = fixture({ noClose: true, [cleanup]: true })
    await assert.rejects(f.run(), error => {
      assert.ok(error instanceof AggregateError)
      assert.match(error.errors[0].message, /Original dialog is not hidden/)
      assert.match(error.errors[1].message, /disposal failed/)
      return true
    })
    assert.deepEqual(f.disposed, ['dialog', 'identity'])
    assert.equal(f.record.menuRecoveryCleanupFailures.length, 1)
    const persisted = JSON.parse(JSON.stringify(f.record))
    assert.match(persisted.menuRecoveryFailure, /Original dialog is not hidden/)
    assert.match(persisted.menuRecoveryCleanupFailures[0], /disposal failed/)
  })

test('cleanup failures alone cannot pass and both failures remain recorded', async () => {
  const f = fixture({ dialogDisposeError: true, identityDisposeError: true })
  await assert.rejects(f.run(), error => {
    assert.ok(error instanceof AggregateError)
    assert.deepEqual(error.errors.map(error => error.message), ['Dialog disposal failed', 'Identity disposal failed'])
    return true
  })
  assert.deepEqual(f.disposed, ['dialog', 'identity'])
  assert.equal(f.record.menuRecoveryCleanupFailures.length, 2)
})

test('identity observations do not accept replaced scenes or worlds with equal scalar values', () => {
  const prior = globalThis.window, world = { speed: 1 }, canvas = { isConnected: true }
  const scene = { world, renderer: { domElement: canvas } }
  globalThis.window = { testSceneRef: { current: scene }, testScene: scene, testStore: { getWorld: () => world } }
  try {
    const identity = captureMenuIdentity()
    assert.equal(observeMenuIdentity(identity).sameScene, true)
    window.testScene = window.testSceneRef.current = { ...scene }
    assert.equal(observeMenuIdentity(identity).sameScene, false)
    window.testStore.getWorld = () => ({ ...world })
    assert.equal(observeMenuIdentity(identity).sameWorld, false)
  } finally { if (prior === undefined) delete globalThis.window; else globalThis.window = prior }
})

test('source integration preserves original admission, measured windows, and the declared shipped menu route', async () => {
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const capture = read('scripts/browser-performance/snapshot-capture.mjs')
  assert.match(capture, /if \(name === 'menu-recovery'\) \{\s+await recoverSnapshotMenu\(\{ page, record, observe, save,\s+assertAdmission: state => assertSnapshotAdmission\(state, fixture\) \}\)/)
  assert.ok(capture.indexOf('await recoverSnapshotMenu(') < capture.indexOf('await page.evaluate(viewChange ? installSnapshotDragObserver'))
  assert.match(capture, /window\.__pndSnapshotObserver\.ready\(4\)/)
  assert.match(capture, /window\.__pndSnapshotObserver\.finish\(4\)/)
  assert.match(capture, /record\.before = await observe\(\); invariant\(record\.before\); assertSnapshotAdmission\(record\.before, fixture\)/)
  const page = read('app/page.tsx'), menu = read('app/original-pause-menu.tsx')
  const menuControls = [...page.matchAll(/<button\s+className="help-button"[\s\S]*?>/g)]
  assert.equal(menuControls.length, 1, 'Expected one shipped native Menu declaration')
  assert.match(menuControls[0][0], /^<button\s+className="help-button"\s+aria-label="Menu"\s+(title|aria-description)="Help and game menu"\s+onClick=\{openMenu\}\s*>$/)
  assert.match(page, /className="native-hud"\s+aria-label="Tribe controls"/)
  assert.match(page, /className="shaman-controls"/)
  const described = menuControls[0][0].includes('aria-description='), dual = page.includes('aria-label="Game settings"')
  const entries = [...(dual ? [{ name: 'Game settings' }] : []), described ? describedMenu : { name: 'Menu' }]
  const { route } = await resolvePublicMenuEntry(fixture({ entries }).page)
  assert.equal(route.shape, dual ? 'legacy-dual-entry' : described ? 'native-menu-description-only' : 'native-menu-only')
  assert.equal(route.controls.at(-1).selector, described ? selectors.description : selectors.title)
  if (dual) {
    assert.match(page, /className="top-actions"/)
    assert.match(page, /aria-label="Game settings" title="Game settings" onClick=\{openMenu\}/)
  }
  assert.match(menu, /aria-label="Game menu"[\s\S]{0,150}data-original-pause-menu\s+data-panel=\{panel\}/)
  assert.match(menu, /useState<Panel>\('root'\)/)
  assert.match(menu, /onCancel=\{event => \{\s+event\.preventDefault\(\)\s+back\(\)/)
  assert.equal(typeof resolvePublicMenuEntry, 'function')
})
