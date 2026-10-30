import { withoutCampaignPopup } from './support/world-input-page.mjs'
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
    if (name === './checkpoint-scroll') return { CHECKPOINT_COPY_WIDTH: 368 }
    if (name === './checkpoint-scroll-area') return { CheckpointScrollArea: ({ children }) => require('react/jsx-runtime').jsx('div', { tabIndex: 0, 'aria-label': 'Checkpoint details', children }) }
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

test('recovery startup admits only native interruptible flyby input or an unlocked world', async () => {
  const { pauseStartupReady } = await import('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  const { runInNewContext } = await import('node:vm')
  const world = { inputMask: 64, flyby: { flags: 0 } }
  const context = { window: { testStore: { getWorld: () => world } } }
  const poll = () => runInNewContext(`(${pauseStartupReady.toString()})()`, context)
  for (const flags of [0, 1, 16, 64, 65, 80, 81, 85]) {
    world.flyby.flags = flags
    assert.equal(poll(), false, `flags ${flags} are not active, interruptible, unfinished input`)
  }
  for (const flags of [17, 21]) {
    world.flyby.flags = flags
    assert.equal(poll(), 'skip', 'native Space does not depend on an invented DOM control')
  }
  world.inputMask = 128
  assert.equal(poll(), false, 'unrelated input lock cannot admit Space')
  world.inputMask = 0
  assert.equal(poll(), 'ready', 'natural completion must not issue an extra Space pause toggle')
})

test('composed startup observation retains bounded diagnostics and fresh native retry identity', async () => {
  const { pauseStartupReady } = await import('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  const { runInNewContext } = await import('node:vm')
  const world = { inputMask: 64, flyby: { flags: 17 }, paused: false, outcome: { level: 1 }, levelStart: [{ phase: 4 }] }
  const before = structuredClone(world), warnings = []
  const context = { window: { testStore: { getWorld: () => world } },
    document: { querySelector: () => null, querySelectorAll: () => [], activeElement: null },
    console: { warn: (...args) => warnings.push(args) } }
  const read = snapshot => runInNewContext(`(${pauseStartupReady.toString()})(${snapshot})`, context)
  assert.deepEqual(JSON.parse(JSON.stringify(read(true))), {
    action: 'skip', paused: false, inputMask: 64, flybyFlags: 17,
  }, 'Recovery retry ownership receives fresh native identity, not only action/paused')
  assert.equal(warnings.length, 0, 'Atomic retry snapshots never create startup logging')
  for (let i = 0; i < 20; i++) assert.equal(read(false), 'skip')
  assert.equal(warnings.length, 1, 'A stable never-ready state is retained only once')
  assert.equal(warnings[0][0], 'NATIVE_STARTUP_STATE')
  assert.deepEqual(world, before, 'Observation must never mutate gameplay')
  for (let i = 0; i < 20; i++) { world.levelStart[0].phase = i; read(false) }
  assert.equal(warnings.length, 16, 'Distinct startup records remain bounded')
  delete context.window.__pauseStartupTrace
  context.document.querySelector = () => { throw Error('supplied diagnostic failure') }
  world.inputMask = 0
  assert.equal(read(false), 'ready', 'Diagnostic failure must not alter native readiness')
  assert.equal(read(true).inputMask, 0, 'Fresh snapshot reflects the completed native transition')
})

test('recovery scenario awaits actionable startup and uses native Space before unlocked-input assertion', () => {
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-recovery.mjs', import.meta.url), 'utf8')
  const entry = source.slice(source.indexOf('  async function enterMission'), source.indexOf('  async function openFailedLoad'))
  assert.match(entry, /await page.waitForFunction\(pauseStartupReady\)/)
  assert.match(entry, /await startup.dispose\(\)/)
  assert.match(entry, /if \(action === 'skip'\) \{[\s\S]*?await skipPauseIntroduction\(page, Number.isFinite\(deadlineAt\)/)
  assert.ok(entry.indexOf("if (action === 'skip')") < entry.indexOf('await page.waitForFunction(() => !window.testStore.getWorld().inputMask)'))
  assert.doesNotMatch(entry, /skip\.isVisible|waitForTimeout|skipIntroduction\(|store\.change|\.inputMask\s*=/)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /page.setDefaultTimeout\(25000\)/)
  assert.equal(browserCapMs('pause-checkpoint-recovery'), 180000)
})

test('natural completion during native Space delivery is accepted only after delivery settles', async () => {
  const { skipPauseIntroduction: skipPause } = await import('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  const skipPauseIntroduction = page => skipPause(withoutCampaignPopup(page))
  for (const mode of ['already-unlocked', 'press-success', 'unlocks-during-press', 'still-locked']) {
    let reads = 0, presses = 0, settled = false
    const failure = new Error('Space delivery failed')
    const page = {
      evaluate: async () => {
        reads++
        if (reads === 1) return { action: mode === 'already-unlocked' ? 'ready' : 'skip', paused: false }
        assert.equal(settled, true, 'cannot inspect completion while abandoned keyboard delivery is pending')
        return { action: mode === 'still-locked' ? 'skip' : 'ready', paused: false }
      },
      keyboard: { press: async key => {
        assert.equal(key, 'Space')
        presses++
        await Promise.resolve()
        settled = true
        if (mode !== 'press-success') throw failure
      } },
    }
    if (mode === 'still-locked') await assert.rejects(skipPauseIntroduction(page), error => error === failure)
    else await skipPauseIntroduction(page)
    assert.equal(presses, mode === 'already-unlocked' ? 0 : 1)
    if (presses) assert.equal(settled, true)
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
    const states = {}, menuSession = { current: {} }, loadRequest = { current: {} }
    let cancelled = 0, reset = 0, selectorReturns = 0
    const store = { hasCheckpoint: () => true, getCheckpointReadStatus: () => 'read', canSave: () => true,
      enterCampaignSelector(...args) { assert.deepEqual(args, []); selectorReturns++ } }
    const bindings = { menuSession, loadRequest, store,
      cancelNearbyInput() { cancelled++ }, engine: { current: {} }, audio: { current: { reset() { reset++ } } },
      ...Object.fromEntries(['CheatsOpen', 'Menu', 'Ready', 'Error', 'StartupCampaign', 'Startup', 'SelectorOpen'].map(key => [`set${key}`, value => { states[key] = value }])) }
    const node = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
    const action = evaluatePage(node.getText(pageSource), bindings)
    const props = evaluatePage(pauseUse.getText(pageSource), {
      OriginalPauseMenu: 'OriginalPauseMenu', frontendAssets: undefined, CHEAT_SAVE_NOTICE, world: { outcome: { level: 1 } }, tutorialLevel: 0,
      store, closeMenu() {}, saveCheckpoint() {}, loadCheckpoint() {}, restart() {},
      quitLevel() { assert.fail('Quit Game must not use the Quit Level callback') },
      exitTutorial() { assert.fail('Quit Level must not use the Quit Game callback') },
      [name]: action,
    }).props
    assert.equal(props.saveDisabledReason, undefined, 'a clean campaign retains Save availability')
    const ui = fixture(props)
    ui.click(callback === 'onQuitGame' ? 'Quit Game' : 'Quit Level')
    assert.equal(cancelled, 0)
    assert.equal(selectorReturns, 0, 'the confirmation panel must not enter campaign selection')
    assert.equal(states.CheatsOpen, undefined, 'confirmation alone does not close the testing menu')
    ui.click('Yes')
    assert.equal(states.CheatsOpen, false)
    assert.equal(states.Startup, 'choice'); assert.equal(states.StartupCampaign, campaign)
    assert.equal(selectorReturns, campaign ? 1 : 0, 'only Quit Level enters the native campaign return transition')
    assert.equal(states.SelectorOpen, campaign ? false : undefined)
    assert.equal(states.Menu, false); assert.equal(states.Ready, false)
    assert.equal(menuSession.current, null)
    assert.equal(loadRequest.current, null); assert.equal(cancelled, 1); assert.equal(reset, 1)
  }
})

// Rejection is visible without pretending that an incompatible record is absent.
test('incompatible checkpoint remains inspectable in Load panel without enabling load or retry', () => {
  const ui = fixture({ checkpointReadStatus: 'incompatible' })
  ui.click('Load Game')
  assert.equal(ui.render().props['data-panel'], 'load')
  assert.equal(ui.button('Load checkpoint').props.disabled, true)
  assert.match(ui.statuses()[0], /incompatible.*stored save has not been changed/)
  assert.throws(() => ui.button('Retry checkpoint lookup'), /Button/)
  assert.equal(ui.loads(), 0)
  assert.equal(ui.retries(), 0)
})


function checkpointParagraphs(ui) {
  const section = tree(ui.render()).find(node => node.type === 'section')
  return tree(section).filter(node => node.type === 'p')
}

function assertCheckpointCopy(paragraph, fonts) {
  const [accessible, visible] = paragraph.props.children
  const text = accessible.props.children
  if (fonts) {
    const font = JSON.parse(readFileSync(new URL('../app/original-pause-font.json', import.meta.url)))
    const lines = visible.map(line => {
      assert.equal(line.props['aria-hidden'], 'true')
      assert.equal(line.props.children.props.ready, true)
      const text = line.props.children.props.text
      const glyphs = tree(line).filter(node => node.type === 'i')
      assert.equal(glyphs.length, text.length)
      assert.ok(glyphs.every(node => node.props.style.backgroundImage === "url('/original/pause-font.png')"))
      assert.ok([...text].reduce((sum, c) => sum + font.rects[c.charCodeAt(0) - 32].w, 0) <= 368)
      return text
    })
    assert.equal(lines.join(' '), text.replaceAll('…', '...').replace(/\s+/g, ' ').trim())
  } else {
    assert.equal(visible.props['aria-hidden'], 'true')
    assert.equal(visible.props.children, text)
    assert.equal(tree(visible).some(node => node.type === 'i'), false)
  }
  return text
}

test('checkpoint panels use native font rows and retain all browser-only disclosures', () => {
  for (const fonts of [true, false]) {
    for (const checkpointReadStatus of ['idle', 'pending', 'failed', 'read', 'unavailable', 'incompatible']) {
      for (const hasCheckpoint of [true, false]) {
        const ui = fixture({ prepared: { fonts }, checkpointReadStatus, hasCheckpoint })
        // Reach Load before a lookup settles to unavailable/empty, as in the real panel.
        ui.render({ checkpointReadStatus: 'idle' })
        ui.click('Load Game')
        ui.render({ checkpointReadStatus })
        const paragraphs = checkpointParagraphs(ui)
        const copy = paragraphs.map(paragraph => assertCheckpointCopy(paragraph, fonts))
        assert.equal(copy[0], 'One browser checkpoint. No original multi-slot saves.')
        assert.ok(copy.includes('Loading replaces the current world and discards unsaved progress.'))
        assert.equal(copy.includes('Checkpoint available in this session.'), hasCheckpoint && checkpointReadStatus !== 'read')
        assert.equal(ui.button('Load checkpoint').props.style.top, 399)
        assert.equal(ui.button('Back').props.style.top, 454)
        if (['idle', 'pending', 'failed'].includes(checkpointReadStatus))
          assert.equal(ui.button('Retry checkpoint lookup').props.style.top, 369)
        for (const label of ['Load checkpoint', 'Back']) {
          const button = ui.button(label)
          assert.equal(tree(button).some(node => node.type === 'i'), fonts)
        }
      }
    }
    const ui = fixture({ prepared: { fonts }, saveDisabledReason: CHEAT_SAVE_NOTICE })
    ui.click('Save Game')
    const paragraphs = checkpointParagraphs(ui)
    assert.equal(assertCheckpointCopy(paragraphs[1], fonts), CHEAT_SAVE_NOTICE)
    assert.equal(ui.button('Save checkpoint').props.disabled, true)
    assert.equal(ui.button('Save checkpoint').props.style.top, 399)
    const title = tree(ui.render()).find(node => node.type === 'h2')
    assert.equal(title.props['aria-label'], 'Save Game')
    assert.equal(tree(title).some(node => node.type === 'i'), fonts)
  }
})

test('long checkpoint reasons wrap without losing characters and unsupported glyphs use readable fallback', () => {
  for (const reason of ['X'.repeat(160), 'Storage says: Ω ' + 'X'.repeat(160)]) {
    const ui = fixture({ prepared: { fonts: true }, saveDisabledReason: reason })
    ui.click('Save Game')
    const paragraph = checkpointParagraphs(ui)[1]
    assert.equal(paragraph.props.children[0].props.children, reason)
    const visible = paragraph.props.children[1]
    if (reason.includes('Ω')) assertCheckpointCopy(paragraph, false)
    else {
      const lines = visible.map(line => line.props.children.props.text)
      assert.equal(lines.join(''), reason)
      assert.ok(lines.length > 1)
      const font = JSON.parse(readFileSync(new URL('../app/original-pause-font.json', import.meta.url)))
      assert.ok(lines.every(line => [...line].reduce((sum, c) => sum + font.rects[c.charCodeAt(0) - 32].w, 0) <= 368))
    }
  }
})

test('checkpoint details retain native scrolling keys without turning them into Back navigation', () => {
  const ui = fixture()
  ui.click('Load Game')
  const details = tree(ui.render()).find(node => node.props?.['aria-label'] === 'Checkpoint details')
  assert.equal(details.props.tabIndex, 0)
  for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
    let prevented = false
    ui.keyDown({ key, repeat: false,
      target: { closest: selector => selector.includes('[tabindex="0"]') ? details : null },
      preventDefault() { prevented = true },
    })
    assert.equal(prevented, false)
    assert.equal(ui.render().props['data-panel'], 'load')
  }
})

test('native menu action rows and the fixed checkpoint body have distinct rendered-checker markers', () => {
  const ui = fixture()
  for (const label of ['Continue Game', 'Load Game', 'Save Game', 'Back'])
    assert.equal(ui.button(label).props['data-pause-action'], label)
  ui.click('Load Game')
  for (const label of ['Retry checkpoint lookup', 'Load checkpoint', 'Back'])
    assert.equal(ui.button(label).props['data-pause-action'], label)
  const body = tree(ui.render()).find(node => node.props?.['data-pause-checkpoint-body'])
  assert.ok(body)
  assert.equal(body.props['aria-label'], undefined, 'the fixed body is not the scroll/focus target')
  ui.back(); ui.click('Save Game')
  assert.equal(ui.button('Save checkpoint').props['data-pause-action'], 'Save checkpoint')
})

for (const [outcome, text] of [
  [true, 'Checkpoint saved in this browser.'],
  [false, 'Checkpoint saved for this session only; browser storage is unavailable.'],
  ['failed', 'The checkpoint could not be saved. Your current world is still open.'],
]) {
  test(`native-font save retains pending protection and ${outcome} disclosure`, async () => {
    let finish, saves = 0
    const pending = new Promise((resolve, reject) => { finish = outcome === 'failed' ? reject : resolve })
    const ui = fixture({ prepared: { fonts: true }, onSave() { saves++; return pending } })
    ui.click('Save Game')
    ui.click('Save checkpoint')
    const saving = ui.button('Saving…')
    assert.equal(saving.props.disabled, true)
    assert.ok(tree(saving).some(node => node.type === 'i'), 'ellipsis must use supported dot glyphs')
    saving.props.onClick()
    assert.equal(saves, 1)
    finish(outcome)
    await pending.catch(() => {})
    ui.render()
    assert.deepEqual(ui.statuses(), [text])
    const status = checkpointParagraphs(ui).find(node => node.props.role === 'status')
    assert.equal(assertCheckpointCopy(status, true), text)
    assert.equal(ui.button('Save checkpoint').props.disabled, false)
  })
}

test('checkpoint copy is independently scrollable and cannot cover fixed actions or Back', () => {
  const css = readFileSync(new URL('../app/original-pause-menu.module.css', import.meta.url), 'utf8')
  const panel = css.match(/\.panel \{([^}]+)\}/)[1]
  assert.doesNotMatch(panel, /background|border|font|padding/)
  const body = css.match(/\.checkpointBody \{([^}]+)\}/)[1]
  assert.match(body, /top: 81px/)
  assert.match(body, /height: 270px/)
  assert.match(body, /left: 104px/)
  assert.match(body, /width: 432px/)
  assert.equal(104 + 432 / 2, 320, 'copy stays on the original menu center')
  assert.ok(104 > 100, 'the copy area reserves the full unscaled native HUD gutter')
  const scrolling = readFileSync(new URL('../app/checkpoint-scroll-area.module.css', import.meta.url), 'utf8')
  assert.match(scrolling, /\.viewport \{[^}]*overflow: auto/)
  assert.match(scrolling, /\.content \{[^}]*width: 368px; margin: 0 auto/)
  assert.match(scrolling, /\.viewport:focus-visible/)
  assert.ok(81 + 270 < 369)
  assert.match(css, /\.checkpointText \{[^}]*overflow-wrap: anywhere/)
  assert.doesNotMatch(css, /\.panel h2|\.panel button \{[^}]*background|font: 15px/)
})
