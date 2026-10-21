import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { createWorld } from '../app/model.ts'
import { CHEAT_SAVE_NOTICE } from '../app/spell-test-cheats.ts'
import { withStorage } from './support/profile-storage.mjs'
import { evaluatePage, pageNode, pageSource } from './support/follower-nearby-page.mjs'

const require = createRequire(import.meta.url)
const emitted = ts.transpileModule(
  readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }
).outputText

function tree(element) {
  if (!element || typeof element !== 'object') return []
  if (typeof element.type === 'function') return tree(element.type(element.props))
  return [element, ...[element.props?.children].flat(Infinity).flatMap(tree)]
}

// Execute the shipped component/handlers with retained hook state. Real layout,
// browser focus, and IndexedDB errors require the separate rendered scenario.
function fixture(overrides = {}) {
  const slots = [], component = { exports: {} }
  let cursor = 0, output, nodes, retries = 0, loads = 0
  const react = {
    useEffect() {},
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
  }
  new Function('require', 'module', 'exports', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './original-pause-font.json') return JSON.parse(readFileSync(new URL('../app/original-pause-font.json', import.meta.url)))
    if (name === './frontend-composition') return { frontendScale: () => 1 }
    if (name.endsWith('.module.css')) return {}
    throw new Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  const props = {
    tutorial: false, hasCheckpoint: false, checkpointReadStatus: 'failed',
    renderOptions: () => null, onContinue() {}, onSave: async () => true,
    onRestart() {}, onQuitLevel() {}, onQuitGame() {},
    onRetryCheckpoint() { retries++ }, onLoad() { loads++ }, ...overrides,
  }
  function render(next = {}) {
    Object.assign(props, next)
    cursor = 0
    output = component.exports.OriginalPauseMenu(props)
    nodes = tree(output)
    return output
  }
  function button(label) {
    const node = nodes.find(node => node.type === 'button' &&
      (node.props['aria-label'] === label || node.props.children === label))
    assert.ok(node, `Button ${label}`)
    return node
  }
  function click(label) {
    const node = button(label)
    assert.ok(!node.props.disabled, `${label} must be enabled`)
    node.props.onClick()
    render()
  }
  function back() { output.props.onCancel({ preventDefault() {} }); render() }
  function statuses() { return nodes.filter(node => node.props?.role === 'status').map(node => node.props.children[0].props.children) }
  render()
  return { render, button, click, back, statuses, keyDown: event => output.props.onKeyDown(event), retries: () => retries, loads: () => loads }
}

for (const state of ['failed', 'pending', 'idle']) {
  test(`${state} lookup leaves the original Load Game entry reachable without a checkpoint`, () => {
    const ui = fixture({ checkpointReadStatus: state })
    ui.click('Load Game')
    assert.equal(ui.render().props['data-panel'], 'load')
    assert.equal(ui.button('Load checkpoint').props.disabled, true)
    assert.equal(ui.button('Retry checkpoint lookup').props.disabled, state === 'pending')
    assert.match(ui.statuses()[0], state === 'failed' ? /could not|Could not/ : state === 'pending' ? /Checking/ : /not been checked/)
    ui.button('Retry checkpoint lookup').props.onClick()
    assert.equal(ui.retries(), state === 'pending' ? 0 : 1)
    assert.equal(ui.loads(), 0)
  })
}

for (const [state, reason] of [
  ['read', 'No usable saved checkpoint'],
  ['unavailable', 'Browser storage is unavailable'],
]) {
  test(`${state} without a checkpoint has a truthful unavailable reason`, () => {
    const ui = fixture({ checkpointReadStatus: state })
    assert.equal(ui.button('Load Game').props.disabled, true)
    assert.equal(ui.button('Load Game').props.title, reason)
  })
}

test('an available memory checkpoint stays loadable through every storage-read state', () => {
  for (const checkpointReadStatus of ['idle', 'pending', 'failed', 'read', 'unavailable', 'incompatible']) {
    const ui = fixture({ checkpointReadStatus, hasCheckpoint: true })
    ui.click('Load Game')
    assert.equal(ui.button('Load checkpoint').props.disabled, false)
    assert.ok(!ui.statuses().join(' ').includes('session only'), 'read failure does not prove a later save was not persisted')
    ui.click('Load checkpoint')
    ui.button('Load checkpoint').props.onClick()
    assert.equal(ui.loads(), 1, 'explicit loading remains one-shot')
  }
})

test('a lookup completion cannot navigate out of the current pause subpanel', () => {
  const ui = fixture()
  ui.click('Load Game')
  ui.click('Retry checkpoint lookup')
  ui.render({ checkpointReadStatus: 'pending' })
  ui.back()
  ui.click('Save Game')
  ui.render({ checkpointReadStatus: 'read', hasCheckpoint: true })
  assert.equal(ui.render().props['data-panel'], 'save')
  assert.deepEqual(ui.statuses(), [])
  assert.equal(ui.loads(), 0)
  ui.back()
  ui.click('Load Game')
  assert.deepEqual(ui.statuses(), ['Checkpoint available in this session.'])
})

test('empty retry result stays explained in Load until Back; a failed retry remains retryable', () => {
  const ui = fixture()
  ui.click('Load Game')
  ui.click('Retry checkpoint lookup')
  ui.render({ checkpointReadStatus: 'pending' })
  ui.render({ checkpointReadStatus: 'failed' })
  ui.click('Retry checkpoint lookup')
  assert.equal(ui.retries(), 2)
  ui.render({ checkpointReadStatus: 'read' })
  assert.equal(ui.render().props['data-panel'], 'load')
  assert.deepEqual(ui.statuses(), ['No saved checkpoint in this browser.'])
  assert.equal(ui.button('Load checkpoint').props.disabled, true)
  ui.back()
  assert.equal(ui.button('Load Game').props.disabled, true)
})

test('Tutorial retains its original omission of Save and Load rows', () => {
  const ui = fixture({ tutorial: true })
  const labels = tree(ui.render()).map(node => node.props?.['aria-label'])
  assert.ok(!labels.includes('Load Game'))
  assert.ok(!labels.includes('Save Game'))
})

test('holding an activation key cannot follow retry focus into Back; fresh presses remain usable', () => {
  const ui = fixture()
  ui.click('Load Game')
  ui.click('Retry checkpoint lookup')
  for (const key of ['Enter', ' ']) {
    for (const repeat of [false, true]) {
      let prevented = false
      ui.render().props.onKeyDown({
        key, repeat, target: { closest: selector => selector === 'button' ? {} : null },
        preventDefault() { prevented = true },
      })
      assert.equal(prevented, repeat)
    }
    let prevented = false
    ui.render().props.onKeyDown({
      key, repeat: true, target: { closest: () => null },
      preventDefault() { prevented = true },
    })
    assert.equal(prevented, false, 'text entry is not intercepted')
  }
  assert.equal(ui.render().props['data-panel'], 'load')
})

const pauseUse = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'OriginalPauseMenu')
function homeProps(store) {
  return evaluatePage(pauseUse.getText(pageSource), {
    OriginalPauseMenu: 'OriginalPauseMenu', frontendAssets: undefined, CHEAT_SAVE_NOTICE,
    world: store.getWorld(), tutorialLevel: 0, store,
    closeMenu() {}, saveCheckpoint: () => store.saveCheckpoint(),
    loadCheckpoint: () => store.loadCheckpoint(), restart() {}, quitLevel() {}, exitTutorial() {},
  }).props
}

test('actual Home retry binding recovers a stored checkpoint without replacing the active world', async () => {
  const saved = createWorld(2, 'scalable')
  saved.turn = 217
  await withStorage({ latest: { version: 3, world: saved } }, async ({ freshStore, writes, drain }) => {
    const store = await freshStore()
    assert.equal(await store.restoreCheckpoint(), false)
    store.startMission(1)
    const active = store.getWorld(), before = structuredClone(active)
    const ui = fixture(homeProps(store))
    ui.click('Load Game')
    const retry = ui.button('Retry checkpoint lookup')
    retry.props.onClick()
    const pending = store.restoreCheckpoint()
    retry.props.onClick()
    assert.equal(store.restoreCheckpoint(), pending, 'repeated input shares the existing store lookup')
    ui.render(homeProps(store))
    assert.equal(ui.button('Retry checkpoint lookup').props.disabled, true)
    await pending
    await drain()
    ui.render(homeProps(store))
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(store.getWorld(), active)
    assert.deepEqual(active, before, 'lookup changes neither world, clocks, RNG nor pause')
    assert.deepEqual(writes, [], 'recovery only reads browser storage')
    ui.click('Load checkpoint')
    assert.notEqual(store.getWorld(), active)
    assert.equal(store.getWorld().outcome.level, 2)
    assert.equal(store.getWorld().turn, 217)
  }, { failFirstRestore: true })
})

test('a newer in-session Save wins over a delayed lookup started through the pause UI', async () => {
  const saved = createWorld(2, 'scalable')
  saved.turn = 217
  await withStorage({ latest: { version: 3, world: saved } }, async ({ freshStore, drain }) => {
    const store = await freshStore()
    await store.restoreCheckpoint()
    const ui = fixture(homeProps(store))
    ui.click('Load Game')
    ui.click('Retry checkpoint lookup')
    const pending = store.restoreCheckpoint(), active = store.getWorld()
    active.turn = 419
    const write = store.saveCheckpoint(false)
    await Promise.all([pending, write])
    await drain()
    ui.render(homeProps(store))
    assert.equal(store.getWorld(), active)
    ui.click('Load checkpoint')
    assert.equal(store.getWorld().turn, 419)
    assert.equal(store.getWorld().outcome.level, active.outcome.level)
    assert.equal(store.getWorld().paused, false)
  }, { failFirstRestore: true })
})

test('recovery startup waits through delayed, hidden and disabled public Skip controls', async () => {
  const { pauseStartupReady } = await import('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  const { runInNewContext } = await import('node:vm')
  const world = { inputMask: 1, flyby: { flags: 1 } }
  let skip = null
  const context = {
    window: { testStore: { getWorld: () => world } },
    document: { querySelector: selector => {
      assert.equal(selector, 'button.skip-introduction')
      return skip
    } },
    getComputedStyle: node => ({ visibility: node.visibility }),
  }
  const poll = () => runInNewContext(`(${pauseStartupReady.toString()})()`, context)
  assert.equal(poll(), false, 'flyby state alone cannot admit a not-yet-rendered control')
  skip = { getClientRects: () => [], visibility: 'visible', disabled: false }
  assert.equal(poll(), false)
  skip.getClientRects = () => [{}]
  skip.visibility = 'hidden'
  assert.equal(poll(), false)
  skip.visibility = 'visible'
  skip.disabled = true
  assert.equal(poll(), false)
  skip.disabled = false
  assert.equal(poll(), 'skip', 'later React commit becomes actionable without a fixed sleep')
  world.inputMask = 0
  skip = null
  assert.equal(poll(), 'ready', 'naturally completed introduction does not require a stale click')
})

test('recovery scenario awaits actionable startup and uses public click before unlocked-input assertion', () => {
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-recovery.mjs', import.meta.url), 'utf8')
  const entry = source.slice(source.indexOf('  async function enterMission'), source.indexOf('  async function openFailedLoad'))
  assert.match(entry, /await page.waitForFunction\(pauseStartupReady\)/)
  assert.match(entry, /await startup.dispose\(\)/)
  assert.match(entry, /if \(action === 'skip'\) await skipPauseIntroduction\(page\)/)
  assert.ok(entry.indexOf("if (action === 'skip')") < entry.indexOf('await page.waitForFunction(() => !window.testStore.getWorld().inputMask)'))
  assert.doesNotMatch(entry, /skip\.isVisible|waitForTimeout|skipIntroduction\(|store\.change|\.inputMask\s*=/)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /page.setDefaultTimeout\(25000\)/)
  assert.equal(browserCapMs('pause-checkpoint-recovery'), 180000)
})

test('natural completion during public Skip activation is accepted only after the click settles', async () => {
  const { skipPauseIntroduction } = await import('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  for (const mode of ['already-unlocked', 'click-success', 'unlocks-during-click', 'still-locked']) {
    let reads = 0, clicks = 0, settled = false
    const failure = new Error('Skip disappeared or remained unclickable')
    const page = {
      evaluate: async () => {
        reads++
        if (reads === 1) return mode === 'already-unlocked'
        assert.equal(settled, true, 'cannot inspect completion while an abandoned click is pending')
        return mode === 'still-locked'
      },
      getByRole: (role, options) => {
        assert.equal(role, 'button')
        assert.equal(options.name.test('Skip introduction ESC'), true)
        return { click: async options => {
          clicks++
          assert.equal(options.timeout, 2500)
          await Promise.resolve()
          settled = true
          if (mode !== 'click-success') throw failure
        } }
      },
    }
    if (mode === 'still-locked') await assert.rejects(skipPauseIntroduction(page), error => error === failure)
    else await skipPauseIntroduction(page)
    assert.equal(clicks, mode === 'already-unlocked' ? 0 : 1)
    if (clicks) assert.equal(settled, true)
  }
})


// This proves shipped handler ownership, not browser-generated cancel behavior.
// A separate actual-Chrome key-hold episode must verify the native default action.
test('held Escape cannot cross pause subpanels, but a fresh press retains native cancel', () => {
  for (const panel of ['Load Game', 'Save Game', 'Options', 'Restart Level', 'Quit Level', 'Quit Game']) {
    let resumes = 0
    const ui = fixture({ onContinue() { resumes++ } })
    ui.click(panel)
    function escape(repeat) {
      let prevented = false
      ui.keyDown({ key: 'Escape', repeat, target: { closest: () => null }, preventDefault() { prevented = true } })
      return prevented
    }
    const originalPanel = ui.render().props['data-panel']
    assert.notEqual(originalPanel, 'root')
    assert.equal(escape(true), true, 'a held key entering a subpanel must not cancel it')
    assert.equal(ui.render().props['data-panel'], originalPanel)
    assert.equal(escape(false), false, 'initial press remains browser-owned')
    ui.back() // Explicitly model only the native cancel handler, not Chromium dispatch.
    assert.equal(ui.render().props['data-panel'], 'root')
    for (let i = 0; i < 3; i++) assert.equal(escape(true), true, 'held repeats prevent another native cancel')
    assert.equal(resumes, 0)
    assert.equal(escape(false), false, 'release then press remains browser-owned')
    ui.back()
    assert.equal(resumes, 1)
  }
})

for (const [label, callback, destination] of [
  ['Quit Game', 'onQuitGame', 'Return to the main menu.'],
  ['Quit Level', 'onQuitLevel', 'Return to world selection.'],
]) {
  test(`${label} retains destination and unsaved warning in pause-font lines and fallback`, () => {
    for (const fonts of [true, false]) {
      const ui = fixture({ prepared: { fonts } })
      ui.click(label)
      const nodes = tree(ui.render())
      const warning = nodes.find(node => node.props.id === 'pause-quit-warning')
      assert.ok(warning)
      assert.equal(ui.render().props['aria-describedby'], 'pause-quit-warning')
      assert.equal(warning.props.children[0].props.children, `${destination} Unsaved progress will be lost.`)
      const lines = warning.props.children[1]
      assert.equal(lines.length, 2)
      const font = JSON.parse(readFileSync(new URL('../app/original-pause-font.json', import.meta.url)))
      for (const [index, line] of lines.entries()) {
        const text = [destination, 'Unsaved progress will be lost.'][index]
        assert.equal(line.props.children.props.text, text)
        assert.equal(line.props.children.props.ready, fonts)
        assert.ok([...text].reduce((sum, c) => sum + font.rects[c.charCodeAt(0) - 32].w, 0) <= 480)
        const rendered = tree(line)
        assert.equal(rendered.some(node => node.type === 'i'), fonts)
        if (!fonts) assert.ok(rendered.some(node => node.props.children === text))
      }
      assert.ok(!JSON.stringify(warning).includes('Close the browser tab'))
      assert.equal(ui.button('Yes').props.style.top, 189)
      assert.equal(ui.button('No').props.style.top, 219)
      assert.equal(ui.button('Back').props.style.top, 454)
    }
  })
  test(`${label} cancellation, reopen and repeated confirmation preserve actual callback ownership`, () => {
    let quits = 0, otherQuits = 0, resumes = 0
    const ui = fixture({ [callback]() { quits++ },
      [callback === 'onQuitGame' ? 'onQuitLevel' : 'onQuitGame']() { otherQuits++ },
      onContinue() { resumes++ } })
    for (const cancel of ['No', 'Back', 'Escape']) {
      ui.click(label)
      if (cancel === 'Escape') ui.back()
      else ui.click(cancel)
      assert.equal(ui.render().props['data-panel'], 'root')
      assert.equal(ui.render().props['aria-describedby'], undefined)
      assert.equal(quits + otherQuits + resumes, 0)
    }
    ui.click(label)
    for (const key of ['Enter', ' ']) {
      let prevented = false
      ui.keyDown({ key, repeat: true, target: { closest: () => ({}) }, preventDefault() { prevented = true } })
      assert.equal(prevented, true)
    }
    const yes = ui.button('Yes')
    yes.props.onClick(); yes.props.onClick()
    assert.equal(quits, 1)
    assert.equal(otherQuits + resumes, 0)
  })
}

test('actual Home quit callbacks retain different destinations and clear obsolete menu ownership', () => {
  for (const [name, campaign, callback] of [['exitTutorial', false, 'onQuitGame'], ['quitLevel', true, 'onQuitLevel']]) {
    const states = {}, menuSession = { current: {} }, pendingMenuCamera = { current: [() => {}] }, loadRequest = { current: {} }
    let cancelled = 0, reset = 0
    const bindings = { menuSession, pendingMenuCamera, loadRequest,
      cancelNearbyInput() { cancelled++ }, engine: { current: {} }, audio: { current: { reset() { reset++ } } },
      ...Object.fromEntries(['CheatsOpen', 'Menu', 'Ready', 'Error', 'StartupCampaign', 'Startup', 'SelectorOpen'].map(key => [`set${key}`, value => { states[key] = value }])) }
    const node = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
    const action = evaluatePage(node.getText(pageSource), bindings)
    const props = evaluatePage(pauseUse.getText(pageSource), {
      OriginalPauseMenu: 'OriginalPauseMenu', frontendAssets: undefined, CHEAT_SAVE_NOTICE, world: { outcome: { level: 1 } }, tutorialLevel: 0,
      store: { hasCheckpoint: () => true, getCheckpointReadStatus: () => 'read', hasUsedCheats: () => false },
      closeMenu() {}, saveCheckpoint() {}, loadCheckpoint() {}, restart() {}, quitLevel: action, exitTutorial: action,
    }).props
    const ui = fixture(props)
    ui.click(callback === 'onQuitGame' ? 'Quit Game' : 'Quit Level')
    assert.equal(cancelled, 0)
    assert.equal(states.CheatsOpen, undefined, 'confirmation alone does not close the testing menu')
    ui.click('Yes')
    assert.equal(states.CheatsOpen, false)
    assert.equal(states.Startup, 'choice'); assert.equal(states.StartupCampaign, campaign)
    assert.equal(states.Menu, false); assert.equal(states.Ready, false)
    assert.equal(menuSession.current, null); assert.deepEqual(pendingMenuCamera.current, [])
    assert.equal(loadRequest.current, null); assert.equal(cancelled, 1); assert.equal(reset, 1)
  }
})

// Rejection is visible without pretending that an incompatible record is absent.
test('incompatible checkpoint remains inspectable in Load panel without enabling load or retry', () => {
  const ui = fixture({ checkpointReadStatus: 'incompatible' })
  ui.click('Load Game')
  assert.equal(ui.render().props['data-panel'], 'load')
  assert.equal(ui.button('Load checkpoint').props.disabled, true)
  assert.match(ui.statuses()[0], /Incompatible checkpoint.*Stored save unchanged/)
  assert.throws(() => ui.button('Retry checkpoint lookup'), /Button/)
  assert.equal(ui.loads(), 0)
  assert.equal(ui.retries(), 0)
})
