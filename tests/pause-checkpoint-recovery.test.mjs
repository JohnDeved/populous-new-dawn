import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { createWorld } from '../app/model.ts'
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
  function statuses() { return nodes.filter(node => node.props?.role === 'status').map(node => node.props.children) }
  render()
  return { render, button, click, back, statuses, retries: () => retries, loads: () => loads }
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
  for (const checkpointReadStatus of ['idle', 'pending', 'failed', 'read', 'unavailable']) {
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
  assert.deepEqual(ui.statuses(), ['A checkpoint is available in this session.'])
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
  assert.deepEqual(ui.statuses(), ['No usable saved checkpoint was found in this browser.'])
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
    OriginalPauseMenu: 'OriginalPauseMenu', frontendAssets: undefined,
    world: store.getWorld(), tutorialLevel: 0, store,
    closeMenu() {}, saveCheckpoint: () => store.saveCheckpoint(),
    loadCheckpoint: () => store.loadCheckpoint(), restart() {}, quitLevel() {}, exitTutorial() {},
  }).props
}

test('actual Home retry binding recovers a stored checkpoint without replacing the active world', async () => {
  const saved = createWorld(2)
  saved.turn = 217
  await withStorage({ latest: { version: 1, world: saved } }, async ({ freshStore, writes, drain }) => {
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
  const saved = createWorld(2)
  saved.turn = 217
  await withStorage({ latest: { version: 1, world: saved } }, async ({ freshStore, drain }) => {
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
  assert.match(entry, /if \(action === 'skip'\)\s+await page.getByRole\('button', \{ name: \/\^Skip introduction\/ \}\).click\(\)/)
  assert.ok(entry.indexOf("if (action === 'skip')") < entry.indexOf('await page.waitForFunction(() => !window.testStore.getWorld().inputMask)'))
  assert.doesNotMatch(entry, /skip\.isVisible|waitForTimeout|skipIntroduction\(|store\.change|\.inputMask\s*=/)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /page.setDefaultTimeout\(25000\)/)
  assert.match(runner, /receipt.browserCapMs = 180000/)
})
