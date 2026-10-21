import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { captureMenuIdentity, observeMenuIdentity, recoverSnapshotMenu, resolvePublicMenuEntry }
  from '../scripts/browser-performance/snapshot-menu-recovery.mjs'

// In-memory API/control doubles only. They do not certify rendered old/new UI,
// Escape propagation, production click handlers, or a performance comparison.
function fixture(options = {}) {
  const entries = options.entries ?? [{ name: 'Game settings' }]
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
  const dialog = { evaluate: async fn => fn(element), dispose: async () => { disposed.push('dialog') },
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
      return { evaluate: async read => read(value), dispose: async () => { disposed.push('identity') } }
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

for (const name of ['Game settings', 'Menu']) test(`one exact ${name} route performs one click and real Escape outside measurement`, async () => {
  const f = fixture({ entries: [{ name }] })
  await f.run()
  assert.deepEqual(f.calls.filter(s => s.startsWith('click:') || s.startsWith('press:')), [`click:${name}`, 'press:Escape'])
  assert.equal(f.calls.filter(s => s === 'admission').length, 2)
  assert.deepEqual(f.disposed, ['dialog', 'identity'])
  const [opening, closing] = f.record.preparation
  assert.deepEqual(opening.route, { role: 'button', name, exact: true })
  assert.equal(opening.measured, false); assert.equal(closing.measured, false)
  assert.equal(opening.identity.sameWorld, true); assert.equal(opening.identity.originalSpeed, 1)
  assert.deepEqual(opening.dialog, { name: 'Game menu', panel: 'root', open: true, modal: true })
  assert.equal(f.record.menu.modalSuspended, true); assert.equal(closing.after.modalSuspended, false)
  assert.equal(closing.dialogHidden, true)
  assert.ok(f.calls.indexOf('original:hidden') < f.calls.indexOf('menu:hidden'))
})

for (const [label, entries] of [
  ['missing', []], ['non-exact', [{ name: 'Open Menu' }]],
  ['both shipped routes', [{ name: 'Game settings' }, { name: 'Menu' }]],
  ['duplicate old', [{ name: 'Game settings' }, { name: 'Game settings' }]],
  ['duplicate new', [{ name: 'Menu' }, { name: 'Menu' }]],
  ['hidden', [{ name: 'Menu', visible: false }]],
  ['accessibility-hidden', [{ name: 'Menu', exposed: false }]],
  ['disabled', [{ name: 'Menu', enabled: false }]],
  ['hidden duplicate', [{ name: 'Menu' }, { name: 'Menu', exposed: false, visible: false }]],
  ['hidden alternative', [{ name: 'Game settings' }, { name: 'Menu', exposed: false, visible: false }]],
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

test('source integration preserves original admission, measured windows, and shipped root markers', () => {
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const capture = read('scripts/browser-performance/snapshot-capture.mjs')
  assert.match(capture, /if \(name === 'menu-recovery'\) \{\s+await recoverSnapshotMenu\(\{ page, record, observe, save,\s+assertAdmission: state => assertSnapshotAdmission\(state, fixture\) \}\)/)
  assert.ok(capture.indexOf('await recoverSnapshotMenu(') < capture.indexOf('await page.evaluate(viewChange ? installSnapshotDragObserver'))
  assert.match(capture, /window\.__pndSnapshotObserver\.ready\(4\)/)
  assert.match(capture, /window\.__pndSnapshotObserver\.finish\(4\)/)
  assert.match(capture, /record\.before = await observe\(\); invariant\(record\.before\); assertSnapshotAdmission\(record\.before, fixture\)/)
  const page = read('app/page.tsx'), menu = read('app/original-pause-menu.tsx')
  assert.match(page, /aria-label="(?:Game settings|Menu)"[\s\S]{0,120}onClick=\{openMenu\}/)
  assert.match(menu, /aria-label="Game menu"[\s\S]{0,150}data-original-pause-menu\s+data-panel=\{panel\}/)
  assert.match(menu, /useState<Panel>\('root'\)/)
  assert.match(menu, /onCancel=\{event => \{\s+event\.preventDefault\(\)\s+back\(\)/)
  assert.equal(typeof resolvePublicMenuEntry, 'function')
})
