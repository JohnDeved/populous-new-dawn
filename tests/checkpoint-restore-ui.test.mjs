import { nativeCampaignProfile } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { createWorld } from '../app/world-initialization.ts'
import { frontendRows, frontendRowY, frontendTextWidth } from '../app/frontend-composition.ts'
import { wrapTutorialRecommendation } from '../app/tutorial-recommendation.ts'
import { menuTooltipPosition } from '../app/menu-tooltip-layout.ts'
import { evaluatePage, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

// Actual Home effect/JSX and menu component, with synthetic hooks and IndexedDB.
// Rendering, browser storage, and native dialog focus remain separate browser gates.
// Retain the real component identity at this structural JSX boundary. The
// evaluator intentionally does not mount children: tooltip effects/rendering are
// exercised by menu-tooltip.test.mjs, not silently replaced with a null stub.
const require = createRequire(import.meta.url)
const tooltipModule = { exports: {} }
const tooltipJavascript = ts.transpileModule(
  readFileSync(new URL('../app/menu-tooltip.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }
).outputText
new Function('require', 'exports', tooltipJavascript)(name => {
  if (name === 'react' || name === 'react/jsx-runtime') return require(name)
  if (name === '../public/original/world-selector/text/provenance.json') return require(name)
  if (name === './menu-tooltip-layout') return { menuTooltipPosition }
  if (name === './menu-tooltip.module.css') return { tooltip: 'tooltip' }
  throw new Error(`Unexpected tooltip dependency: ${name}`)
}, tooltipModule.exports)
const { MenuTooltip } = tooltipModule.exports

const menuSource = ts.createSourceFile('menu.tsx', readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const menuFunction = menuSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'OriginalMainMenu')
const renderMenu = evaluatePage(menuFunction.getText(menuSource).replace(/^export /, ''), {
  useRef: current => ({ current }), useState: value => [value, () => {}],
  useEffect: () => {}, useLayoutEffect: () => {}, useCallback: callback => callback,
  useMemo: callback => callback(),
  styles: new Proxy({}, { get: (_, name) => name }), MenuText: 'MenuText', MenuTooltip,
  frontendRows, frontendRowY, frontendTextWidth, wrapTutorialRecommendation,
})
const homeMenu = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'OriginalMainMenu')
function menu(store, overrides = {}) {
  const home = evaluatePage(homeMenu.getText(pageSource), {
    OriginalMainMenu: 'OriginalMainMenu', store, frontendAssets: { fonts: false, lowFont: false, logo: false },
    setStartupCampaign: () => assert.fail('lookup must not navigate to campaign selection'),
    startMission: () => assert.fail('lookup must not start a mission'), tutorialLevel: 79,
    loadCheckpoint: () => assert.fail('lookup must not load a checkpoint'), ...overrides,
  })
  return renderMenu(home.props)
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...tree.children.flatMap(nodes)]
}
const button = (tree, name) => nodes(tree).find(node => node.type === 'button' && (node.props['aria-label'] === name || node.children.includes(name)))
const text = tree => nodes(tree).flatMap(node => node.children.filter(child => typeof child === 'string')).join(' ')
function startup(store) {
  const states = [], cheatClosures = []
  const names = ['beginLoad', 'startMission', 'loadCheckpoint']
  const declarations = names.map(name => pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')
  const navigation = evaluatePage(`function(){${declarations}; return {${names.join(',')}}}`, {
    store, setStartup: state => states.push(state),
    menuSession: { current: null }, pendingMenuCamera: { current: [] },
    engine: { current: null }, audio: { current: null }, loadRequest: { current: null },
    setCheatsOpen: value => cheatClosures.push(value), setDebugPicker: () => {},
    cancelNearbyInput: () => {}, setSelectorOpen: () => {}, setMenu: () => {},
    setResultInputCycles: value => assert.equal(value, 0, 'each admitted load resets result input time'),
    setReady: () => {}, setError: () => {}, setTab: () => {},
  })()
  const cleanup = pageEffect('store.restoreCheckpoint()', {
    frontendPreparation: { current: null }, prepareFrontendAssets: async () => ({}), setFrontendAssets() {},
    store, readAudioPreferences: () => ({ volume: 1, musicVolume: 1 }),
    readGamePreferences: () => ({}), setAudioPreferences: () => {}, audio: { current: null },
    gamePreferencesRef: { current: null }, setGamePreferences: () => {},
    setStartup: state => states.push(state),
  })()
  return { states, cheatClosures, cleanup, navigation }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
let session = 0
async function withStorage(run, initial = {}, { failWrite = false } = {}) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  const records = new Map(Object.entries(initial)), opens = [], reads = [], writes = []
  let transactions = 0
  const database = {
    transaction(name, mode = 'readonly') {
      assert.equal(name, 'checkpoints')
      transactions++
      const transaction = new EventTarget(), staged = []
      transaction.objectStore = () => ({
        get: key => ({ result: structuredClone(records.get(key)) }),
        put: (value, key) => { writes.push(key); staged.push([key, structuredClone(value)]) },
      })
      if (mode === 'readonly') reads.push(transaction)
      else queueMicrotask(() => {
        if (failWrite) { transaction.error = new Error('Synthetic write abort'); transaction.dispatchEvent(new Event('abort')) }
        else { for (const entry of staged) records.set(...entry); transaction.dispatchEvent(new Event('complete')) }
      })
      return transaction
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
    open: () => { const request = new EventTarget(); opens.push(request); return request },
  } })
  const open = async (fail = false) => {
    const request = opens.shift()
    assert.ok(request)
    request.result = database
    request.error = fail ? new Error('Synthetic open failure') : null
    request.dispatchEvent(new Event(fail ? 'error' : 'success'))
    await settle()
  }
  const read = async (fail = false) => {
    const transaction = reads.shift()
    assert.ok(transaction)
    transaction.error = fail ? new Error('Synthetic transaction abort') : null
    transaction.dispatchEvent(new Event(fail ? 'abort' : 'complete'))
    await settle()
  }
  try {
    const { createGameStore } = await import(`../app/game-store.ts?restore-ui=${++session}`)
    await run({ store: createGameStore(), open, read, records, writes, opens, reads, transactions: () => transactions })
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
}

for (const failure of ['open', 'abort']) test(`actual Home ${failure} failure exposes retry and enables Load after a recovered read`, async () => {
  const saved = createWorld(1, 'scalable'); saved.turn = 217
  await withStorage(async ({ store, open, read, writes, records, transactions }) => {
    const active = store.getWorld(), before = structuredClone(records), home = startup(store)
    await open(failure === 'open')
    if (failure === 'abort') await read(true)
    assert.deepEqual(home.states, ['choice'])
    assert.equal(store.getCheckpointReadStatus(), 'failed')
    const failed = menu(store), load = button(failed, 'Load Game'), retry = button(failed, 'Retry checkpoint lookup')
    assert.equal(load.props['aria-disabled'], true)
    assert.equal(load.props['aria-description'], 'Saved checkpoint could not be read')
    assert.match(text(failed), /may still be available/)
    assert.ok(retry && !retry.props.disabled)
    retry.props.onClick()
    const pending = store.restoreCheckpoint()
    assert.equal(pending, store.restoreCheckpoint(), 'same pending promise for repeated attempts')
    retry.props.onClick()
    assert.equal(button(menu(store), 'Retry checkpoint lookup').props.disabled, true)
    if (failure === 'open') await open()
    else await settle()
    await read()
    assert.equal(await pending, true)
    assert.equal(transactions(), failure === 'open' ? 1 : 2, 'one transaction per attempt')
    assert.equal(store.getWorld(), active, 'retry refreshes availability only')
    assert.deepEqual(home.states, ['choice'], 'retry never navigates')
    assert.deepEqual(home.cheatClosures, [], 'lookup does not change testing-menu state')
    assert.deepEqual(records, before)
    assert.deepEqual(writes, [])
    assert.deepEqual(store.getCompletedMissions(), [1, 2])
    const recovered = button(menu(store, home.navigation), 'Load Game')
    assert.equal(recovered.props['aria-disabled'], false)
    recovered.props.onClick()
    assert.equal(store.getWorld().turn, 217)
    assert.notEqual(store.getWorld(), active)
    assert.deepEqual(home.states, ['choice', 'playing'], 'only deliberate Load invokes actual Home beginLoad')
    assert.deepEqual(home.cheatClosures, [false], 'deliberate Load closes the testing menu once')
    home.cleanup()
  }, { latest: { version: 3, world: saved }, profile: { version: 1, completed: [1, 2] } })
})

test('genuine empty and unusable records are read results, not a failed lookup or proof of empty disk', async () => {
  for (const latest of [undefined, { version: 999, world: {} }, { version: 1, world: {} }]) {
    await withStorage(async ({ store, open, read, writes }) => {
      const home = startup(store)
      await open(); await read()
      assert.equal(store.getCheckpointReadStatus(), latest ? 'incompatible' : 'read')
      assert.equal(store.hasCheckpoint(), false)
      assert.equal(button(menu(store), 'Load Game').props['aria-description'], latest ? 'Checkpoint is incompatible with this development version' : 'No usable saved checkpoint')
      if (latest) assert.match(text(menu(store)), /incompatible.*stored save has not been changed/)
      assert.equal(button(menu(store), 'Retry checkpoint lookup'), undefined)
      assert.deepEqual(writes, [])
      home.cleanup()
    }, { latest })
  }
})

test('repeated failed retries preserve the world and remain retryable', async () => {
  await withStorage(async ({ store, open, writes }) => {
    const active = store.getWorld(), home = startup(store)
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) button(menu(store), 'Retry checkpoint lookup').props.onClick()
      await open(true)
      assert.equal(store.getCheckpointReadStatus(), 'failed')
      assert.equal(store.getWorld(), active)
      assert.equal(button(menu(store), 'Retry checkpoint lookup').props.disabled, false)
    }
    assert.deepEqual(home.states, ['choice'])
    assert.deepEqual(writes, [])
    home.cleanup()
  })
})

test('late read keeps a newer memory save and current world after navigation', async () => {
  const saved = createWorld(1, 'scalable'); saved.turn = 217
  await withStorage(async ({ store, open, read }) => {
    const home = startup(store)
    // Read the declared Mission 2 prerequisite before beginning the delayed retry.
    await open()
    await read()
    const retry = store.restoreCheckpoint()
    await settle()
    home.navigation.startMission(2)
    assert.equal(store.getWorld().outcome.level, 2)
    const newer = store.getWorld()
    newer.turn = 999
    assert.equal(await store.saveCheckpoint(), true)
    await read()
    await retry
    assert.equal(store.getWorld(), newer)
    assert.deepEqual(home.states, ['choice', 'playing'], 'Home stays mounted while retry completes after mission launch')
    home.navigation.loadCheckpoint()
    assert.equal(store.getWorld().turn, 999, 'post-await memory checkpoint wins over old read')
    home.cleanup()
  }, { latest: { version: 3, world: saved }, profile: nativeCampaignProfile({ available: [2] }) })
})

for (const interruption of ['unmount', 'world replacement']) test(`initial restore completion cannot navigate after ${interruption}`, async () => {
  await withStorage(async ({ store, open, read }) => {
    const home = startup(store)
    await open()
    if (interruption === 'unmount') home.cleanup()
    else assert.equal(store.startDebugMission(2), true)
    const active = store.getWorld()
    await read()
    assert.deepEqual(home.states, [])
    assert.equal(store.getWorld(), active)
    home.cleanup()
  })
})

test('unsupported storage ends startup, explains session saves, and permits memory Load', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  delete globalThis.indexedDB
  try {
    const { createGameStore } = await import('../app/game-store.ts?restore-ui=unsupported')
    const store = createGameStore(), home = startup(store)
    await settle()
    assert.deepEqual(home.states, ['choice'])
    assert.equal(store.getCheckpointReadStatus(), 'unavailable')
    assert.equal(button(menu(store), 'Load Game').props['aria-description'], 'Browser storage is unavailable')
    assert.equal(button(menu(store), 'Retry checkpoint lookup'), undefined)
    store.getWorld().turn = 313
    assert.equal(await store.saveCheckpoint(), false)
    const load = button(menu(store, home.navigation), 'Load Game')
    assert.equal(load.props['aria-disabled'], false)
    load.props.onClick()
    assert.equal(store.getWorld().turn, 313)
    home.cleanup()
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
  }
})

test('checkpoint menu retains real tooltip identity, current availability key and frame binding', () => {
  assert.equal(typeof MenuTooltip, 'function')
  for (const status of ['pending', 'read', 'failed', 'unavailable']) {
    for (const hasCheckpoint of [false, true]) {
      const tree = menu({ hasCheckpoint: () => hasCheckpoint, getCheckpointReadStatus: () => status })
      const tooltip = nodes(tree).filter(node => node.type === MenuTooltip)
      assert.equal(tooltip.length, 1, 'production tooltip remains in the real menu JSX')
      assert.equal(tooltip[0].props.key, `${hasCheckpoint}:${status}`)
      const frame = nodes(tree).find(node => node.type === 'div' && node.props.className === 'frame')
      assert.equal(tooltip[0].props.container, frame.props.ref)
      const load = button(tree, 'Load Game')
      assert.equal(load.props['aria-disabled'], !hasCheckpoint)
      assert.equal(load.props.title, undefined, 'browser tooltip must not duplicate the native presentation')
      assert.equal(load.props['data-menu-tooltip'], load.props['aria-description'])
      if (hasCheckpoint) assert.equal(load.props['aria-description'], undefined)
      else assert.equal(typeof load.props['aria-description'], 'string')
    }
  }
})

for (const failWrite of [false, true]) test(`explicit Save after incompatible restore reports committed storage truth (fail=${failWrite})`, async () => {
  const latest = { version: 1, world: createWorld() }
  await withStorage(async ({ store, open, read, records }) => {
    const home = startup(store)
    await open(); await read()
    assert.equal(store.getCheckpointReadStatus(), 'incompatible')
    assert.match(text(menu(store)), /incompatible.*stored save has not been changed/)
    const before = structuredClone(records)
    store.getWorld().turn = 217
    assert.equal(await store.saveCheckpoint(), !failWrite)
    assert.equal(store.getCheckpointReadStatus(), failWrite ? 'incompatible' : 'read')
    assert.equal(text(menu(store)).includes('stored save has not been changed'), failWrite)
    assert.equal(button(menu(store), 'Load Game').props['aria-disabled'], false)
    if (failWrite) assert.deepEqual(records, before)
    else assert.equal(records.get('latest').version, 3)
    assert.equal(store.loadCheckpoint(), true, 'even a failed disk write retains an explicit session checkpoint')
    assert.equal(store.getWorld().turn, 217)
    home.cleanup()
  }, { latest }, { failWrite })
})

test('successful explicit Save supersedes an older pending incompatible read snapshot', async () => {
  await withStorage(async ({ store, open, read, records }) => {
    const restoring = store.restoreCheckpoint()
    await open() // The pending read now owns a snapshot of the old v1 record.
    assert.equal(store.getCheckpointReadStatus(), 'pending')
    store.getWorld().turn = 217
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(records.get('latest').version, 3)
    await read()
    assert.equal(await restoring, true)
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(text(menu(store)).includes('incompatible'), false)
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.deepEqual(store.getCompletedMissions(), [1, 2])
  }, { latest: { version: 1, world: createWorld() }, profile: { version: 1, completed: [1, 2] } })
})
