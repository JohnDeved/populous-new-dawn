import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { clearPortraitSelection } from '../scripts/browser-portrait-input.mjs'

function fixture(t, { mode = null, selected = [], paused = true, level = 1 } = {}) {
  const previous = Object.fromEntries(['window', 'document'].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const world = { status: 'playing', outcome: { level }, inputMask: 0, mode, selected: [...selected], paused,
    commands: [{ model: 3, destination: [10, 20] }], randomState: 123, vehicles: [{ id: 7 }] }
  const f = { world, current: world, scene: { world, modalSuspended: false },
    menu: false, fullscreen: false, fullscreenPending: false,
    messages: [{ serial: '17', open: false }], actions: [], disposed: 0 }
  globalThis.window = { testStore: { getWorld: () => f.current }, testSceneRef: { current: f.scene } }
  globalThis.document = {
    get fullscreenElement() { return f.fullscreen ? {} : null },
    querySelector(selector) {
      if (selector === '.campaign-messages details[open]') return f.messages.find(message => message.open) ?? null
      if (selector.includes('data-fullscreen-control')) return f.fullscreenPending ? {} : null
      assert.ok(selector.includes('dialog[open]'))
      return f.menu ? {} : null
    },
    querySelectorAll(selector) {
      assert.equal(selector, '.campaign-messages details')
      return f.messages.map(message => ({ open: message.open,
        getAttribute(name) { assert.equal(name, 'data-message-serial'); return message.serial } }))
    },
  }
  f.page = {
    async evaluateHandle(fn) {
      const value = fn()
      return { value, async dispose() { f.disposed++ } }
    },
    async evaluate(fn, argument) { return fn(argument?.value ?? argument) },
    locator(selector) {
      assert.equal(selector, '.world-viewport', 'No campaign summary/acknowledgement control may be clicked')
      return { async focus() { f.actions.push('focus'); await f.onFocus?.() } }
    },
    keyboard: { async press(key) {
      assert.equal(key, 'Escape')
      f.actions.push('Escape')
      if (f.onEscape?.() === false) return
      if (f.current.mode) f.current.mode = null
      else if (f.current.selected.length) f.current.selected = []
      else f.menu = true
    } },
  }
  t.after(() => {
    for (const key of ['window', 'document']) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key])
      else delete globalThis[key]
    }
  })
  return f
}

for (const paused of [false, true]) for (const [mode, selected, expected] of [
  [null, [], []],
  ['blast', [], ['cancel-targeting']],
  [null, [7, 8], ['clear-selection']],
  ['blast', [7, 8], ['cancel-targeting', 'clear-selection']],
]) test(`portrait clearing preserves pause=${paused} and observes ${expected.join(' then ') || 'empty/no input'}`, async t => {
  const f = fixture(t, { mode, selected, paused }), commands = structuredClone(f.world.commands),
    vehicles = structuredClone(f.world.vehicles), messages = structuredClone(f.messages)
  const result = await clearPortraitSelection(f.page)
  assert.deepEqual(result.steps.map(step => step.action), expected)
  assert.deepEqual(f.actions, expected.flatMap(() => ['focus', 'Escape']))
  assert.equal(f.world.mode, null)
  assert.deepEqual(f.world.selected, [])
  assert.equal(f.world.paused, paused)
  assert.equal(f.menu, false, 'An empty Escape must never open Menu')
  assert.deepEqual(f.world.commands, commands)
  assert.deepEqual(f.world.vehicles, vehicles)
  assert.equal(f.world.randomState, 123)
  assert.deepEqual(f.messages, messages, 'Retain notification records and presentation')
  assert.equal(f.disposed, 1)
  if (mode && selected.length) {
    assert.deepEqual(result.steps[0].after.selected, selected, 'First Escape cancels only targeting')
    assert.deepEqual(result.steps[1].before.selected, selected, 'Second Escape owns group cancellation')
  }
})

for (const owner of ['menu', 'modal', 'tutorial', 'inputMask', 'status', 'fullscreen', 'fullscreenPending', 'sceneMismatch'])
  test(`portrait clearing rejects ${owner} ownership before input`, async t => {
    const f = fixture(t, { selected: [7] })
    if (owner === 'menu') f.menu = true
    if (owner === 'modal') f.scene.modalSuspended = true
    if (owner === 'tutorial') f.world.outcome.level = 79
    if (owner === 'inputMask') f.world.inputMask = 64
    if (owner === 'status') f.world.status = 'won'
    if (owner === 'fullscreen') f.fullscreen = true
    if (owner === 'fullscreenPending') f.fullscreenPending = true
    if (owner === 'sceneMismatch') f.scene.world = structuredClone(f.world)
    const before = structuredClone(f.world)
    await assert.rejects(clearPortraitSelection(f.page))
    assert.deepEqual(f.actions, [])
    assert.deepEqual(f.world, before)
    assert.equal(f.disposed, 1)
  })

for (const phase of ['before', 'focus', 'delivery'])
  test(`portrait clear fails closed when a real popup owns ${phase}, retaining its record without dismissal`, async t => {
    const f = fixture(t, { mode: 'blast', selected: [7] })
    if (phase === 'before') f.messages[0].open = true
    if (phase === 'focus') f.onFocus = () => { f.messages[0].open = true }
    if (phase === 'delivery') f.onEscape = () => { f.messages[0].open = true; return false }
    await assert.rejects(clearPortraitSelection(f.page), /popup owns input/)
    assert.deepEqual(f.messages, [{ serial: '17', open: true }])
    assert.deepEqual(f.actions, phase === 'before' ? [] : phase === 'focus' ? ['focus'] : ['focus', 'Escape'])
    assert.equal(f.world.mode, 'blast')
    assert.deepEqual(f.world.selected, [7])
    assert.equal(f.disposed, 1)
  })

test('portrait clear rejects world replacement after preparation without pressing Escape', async t => {
  const f = fixture(t, { selected: [7] })
  f.onFocus = () => { f.current = structuredClone(f.world); f.scene.world = f.current }
  await assert.rejects(clearPortraitSelection(f.page), /World replaced/)
  assert.deepEqual(f.actions, ['focus'])
  assert.deepEqual(f.world.selected, [7])
  assert.deepEqual(f.current.selected, [7])
})

for (const owner of ['menu', 'modal', 'inputMask', 'status', 'fullscreen', 'pause'])
  test(`portrait clear rechecks ${owner} ownership after viewport focus`, async t => {
    const f = fixture(t, { selected: [7] })
    f.onFocus = () => {
      if (owner === 'menu') f.menu = true
      if (owner === 'modal') f.scene.modalSuspended = true
      if (owner === 'inputMask') f.world.inputMask = 64
      if (owner === 'status') f.world.status = 'won'
      if (owner === 'fullscreen') f.fullscreen = true
      if (owner === 'pause') f.world.paused = !f.world.paused
    }
    await assert.rejects(clearPortraitSelection(f.page))
    assert.deepEqual(f.actions, ['focus'])
    assert.deepEqual(f.world.selected, [7])
  })

test('world replacement at first Escape stops before a second transition', async t => {
  const f = fixture(t, { mode: 'blast', selected: [7] })
  f.onEscape = () => { f.current = structuredClone(f.world); f.scene.world = f.current; return false }
  await assert.rejects(clearPortraitSelection(f.page), /World replaced/)
  assert.deepEqual(f.actions, ['focus', 'Escape'])
  assert.equal(f.world.mode, 'blast')
  assert.deepEqual(f.world.selected, [7])
})

for (const failure of ['unchanged', 'selection-cleared-with-target', 'pause-changed'])
  test(`portrait clear stops after ${failure} Escape delivery without a retry`, async t => {
    const f = fixture(t, { mode: 'blast', selected: [7] })
    f.onEscape = () => {
      if (failure === 'unchanged') return false
      if (failure === 'selection-cleared-with-target') f.world.selected = []
      if (failure === 'pause-changed') f.world.paused = !f.world.paused
    }
    await assert.rejects(clearPortraitSelection(f.page))
    assert.deepEqual(f.actions, ['focus', 'Escape'])
    assert.equal(f.disposed, 1)
  })

test('portrait clear honors cancellation before input and between the two Escape transitions', async t => {
  const f = fixture(t, { mode: 'blast', selected: [7] }), controller = new AbortController()
  f.onEscape = () => controller.abort(new Error('Stop portrait input'))
  await assert.rejects(clearPortraitSelection(f.page, { signal: controller.signal }), /Stop portrait input/)
  assert.deepEqual(f.actions, ['focus', 'Escape'])
  assert.equal(f.world.mode, null)
  assert.deepEqual(f.world.selected, [7])
  assert.equal(f.disposed, 1)
  await assert.rejects(clearPortraitSelection(f.page, { signal: controller.signal }), /Stop portrait input/)
  assert.deepEqual(f.actions, ['focus', 'Escape'])
})

test('portrait clear deadline expiration cannot send the next Escape', async t => {
  const f = fixture(t, { mode: 'blast', selected: [7] })
  let now = 0
  t.mock.method(performance, 'now', () => now)
  f.onEscape = () => { now = 5000 }
  await assert.rejects(clearPortraitSelection(f.page, { timeout: 1000 }), /timed out/)
  assert.deepEqual(f.actions, ['focus', 'Escape'])
  assert.equal(f.world.mode, null)
  assert.deepEqual(f.world.selected, [7])
  assert.equal(f.disposed, 1)
})

test('aborting a pending focus cannot dispatch Escape after that focus resolves', async t => {
  const f = fixture(t, { selected: [7] }), controller = new AbortController()
  let releaseFocus, enteredFocus
  const entered = new Promise(resolve => { enteredFocus = resolve })
  f.onFocus = () => { enteredFocus(); return new Promise(resolve => { releaseFocus = resolve }) }
  const clearing = clearPortraitSelection(f.page, { signal: controller.signal })
  await entered
  controller.abort(new Error('Stop pending focus'))
  await assert.rejects(clearing, /Stop pending focus/)
  releaseFocus()
  // Drain the rejected preparation and the outer handle cleanup, without timers.
  for (let turn = 0; turn < 12; turn++) await Promise.resolve()
  assert.deepEqual(f.actions, ['focus'])
  assert.deepEqual(f.world.selected, [7])
  assert.equal(f.disposed, 1)
})

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const ordered = (text, fragments) => {
  let offset = 0
  for (const fragment of fragments) {
    const found = text.indexOf(fragment, offset)
    assert.notEqual(found, -1, `Ordered actual-source action: ${fragment}`)
    offset = found + fragment.length
  }
}

test('tutorial guard is bound to the current Page owner, not a guessed ordinary level', () => {
  assert.match(read('app/mission-data.ts'), /export const tutorialLevel = 79\b/)
  assert.match(read('app/page.tsx'), /current\.outcome\.level === tutorialLevel/)
})

test('camera, corpse and melee callers keep distinct primary/secondary actions before settling', () => {
  ordered(read('scripts/check-browser-camera-focus.mjs'), [
    'await clearPortraitSelection(page)',
    "name:'Select shaman',exact:true}).click()",
    "name:'Select shaman',exact:true}).click({button:'right'})",
    'await page.waitForFunction(()=>window.testScene.cameraMotion.active)',
    'await page.waitForFunction(()=>!window.testScene.cameraMotion.active)',
  ])
  for (const file of ['follower-corpse', 'melee-attack']) {
    const source = read(`scripts/tutorial-browser/${file}.mjs`)
    ordered(source, ["setWorldPaused(page, true", 'clearPortraitSelection(page',
      "await button('Select shaman')", "name: 'Select shaman', exact: true }).click({ button: 'right' })", 'await settle()'])
    for (const path of ['scripts/browser-portrait-input.mjs', 'scripts/browser-world-input.mjs', 'scripts/browser-space-ownership.mjs'])
      assert.ok(source.includes(`'${path}'`), `${file} retains the input dependency in source fingerprints`)
  }
  ordered(read('scripts/check-browser-hut-smoke-events.mjs'), [
    'await clearPortraitSelection(page)', "name: 'Select shaman', exact: true }).click()",
    "name: 'Select shaman', exact: true }).click({ button: 'right' })", 'await page.waitForFunction(() => !window.testScene.cameraMotion.active)',
  ])
})

test('caller migration retains singleton and actual native frame/overview owners', () => {
  ordered(read('scripts/check-browser-selection.mjs'), [
    'await clearPortraitSelection(page)', "name:'Select shaman',exact:true}).click()", "v.length===1&&v[0].userData.signature==='blue-shaman'",
  ])
  const hud = read('scripts/check-browser-hud.mjs')
  ordered(hud, ["page.locator('.world-viewport').press('Enter')", 'window.testScene.overviewActive&&!window.testScene.overviewStage',
    "name:'Select shaman',exact:true}).click({button:'right'})", '!window.testScene.overviewActive&&!window.testScene.overviewStage'])
  assert.doesNotMatch(hud, /name:'Planet overview'/)
  assert.match(read('scripts/check-browser-hud-portrait.mjs'), /getComputedStyle\(b,'::before'\)\.backgroundImage/)
  const ignition = read('scripts/local-render/hut-smoke-ignition.mjs')
  ordered(ignition, ['const selectShaman = async () =>', 'clearPortraitSelection(page', "await button('Select shaman')", 'selected, [originalShamanId]'])
  assert.match(ignition, /assert\.deepEqual\(report\.beforeLightningSelection\.selected, \[shamanId\]\)/)
})


test('adjacent pre-primary cancellation uses the guarded owner and retains scenario budgets', () => {
  const mission21 = read('scripts/check-browser-mission21.mjs')
  ordered(mission21, ['for (const [index, person]', 'await clearPortraitSelection(page)', 'await page.evaluate(personId', "index < 2 ? 'Select brave' : 'Select shaman'"])
  const boat = read('scripts/local-render/mission10-boat-checkpoint.mjs')
  ordered(boat, ["await state('authored-start')", 'await clearPortraitSelection(page, { signal, timeout: deadlineAt === null ? 2500 : Math.min(2500, deadlineAt - Date.now()) })', "name: 'Select shaman'"])
  const vault = read('scripts/local-render/mission3-vault-prayer.mjs')
  ordered(vault, ["input.action('clear-selection', () => clearPortraitSelection(page, { signal, timeout: Math.min(2500, deadline - Date.now()) }))", "input.button('Select shaman')"])
  const lifecycle = read('scripts/local-render/readiness-lifecycle.mjs')
  assert.equal(lifecycle.split('await clearPortraitSelection(page, { signal })').length - 1, 2)
  assert.doesNotMatch(lifecycle, /press\('Escape'\)/)
})
