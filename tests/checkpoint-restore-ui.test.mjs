import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createWorld } from '../app/world-initialization.ts'
import { frontendRowY, frontendTextWidth } from '../app/frontend-composition.ts'
import { evaluatePage, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

// Actual Home effect/JSX and menu component, with synthetic hooks and IndexedDB.
// Rendering, browser storage, and native dialog focus remain separate browser gates.
const menuSource = ts.createSourceFile('menu.tsx', readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const menuFunction = menuSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'OriginalMainMenu')
const renderMenu = evaluatePage(menuFunction.getText(menuSource).replace(/^export /, ''), {
  useRef: current => ({ current }), useState: value => [value, () => {}],
  useEffect: () => {}, useCallback: callback => callback,
  styles: new Proxy({}, { get: (_, name) => name }), MenuText: 'MenuText',
  frontendRowY, frontendTextWidth,
})
const homeMenu = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'OriginalMainMenu')
function menu(store, overrides = {}) {
  const home = evaluatePage(homeMenu.getText(pageSource), {
    OriginalMainMenu: 'OriginalMainMenu', store,
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
  const states = []
  const names = ['beginLoad', 'startMission', 'loadCheckpoint']
  const declarations = names.map(name => pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')
  const navigation = evaluatePage(`function(){${declarations}; return {${names.join(',')}}}`, {
    store, setStartup: state => states.push(state),
    menuSession: { current: null }, pendingMenuCamera: { current: [] },
    engine: { current: null }, audio: { current: null }, loadRequest: { current: null },
    cancelNearbyInput: () => {}, setSelectorOpen: () => {}, setMenu: () => {},
    setReady: () => {}, setError: () => {}, setTab: () => {},
  })()
  const cleanup = pageEffect('store.restoreCheckpoint()', {
    store, readAudioPreferences: () => ({ volume: 1, musicVolume: 1 }),
    readGamePreferences: () => ({}), setAudioPreferences: () => {}, audio: { current: null },
    gamePreferencesRef: { current: null }, setGamePreferences: () => {},
    setStartup: state => states.push(state),
  })()
  return { states, cleanup, navigation }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
let session = 0
async function withStorage(run, initial = {}) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  const records = new Map(Object.entries(initial)), opens = [], reads = [], writes = []
  let transactions = 0
  const database = {
    transaction(name, mode = 'readonly') {
      assert.equal(name, 'checkpoints')
      transactions++
      const transaction = new EventTarget()
      transaction.objectStore = () => ({
        get: key => ({ result: structuredClone(records.get(key)) }),
        put: (value, key) => { writes.push(key); records.set(key, structuredClone(value)) },
      })
      if (mode === 'readonly') reads.push(transaction)
      else queueMicrotask(() => transaction.dispatchEvent(new Event('complete')))
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
  const saved = createWorld(); saved.turn = 217
  await withStorage(async ({ store, open, read, writes, records, transactions }) => {
    const active = store.getWorld(), before = structuredClone(records), home = startup(store)
    await open(failure === 'open')
    if (failure === 'abort') await read(true)
    assert.deepEqual(home.states, ['choice'])
    assert.equal(store.getCheckpointReadStatus(), 'failed')
    const failed = menu(store), load = button(failed, 'Load Game'), retry = button(failed, 'Retry checkpoint lookup')
    assert.equal(load.props['aria-disabled'], true)
    assert.equal(load.props.title, 'Saved checkpoint could not be read')
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
    assert.deepEqual(records, before)
    assert.deepEqual(writes, [])
    assert.deepEqual(store.getCompletedMissions(), [1, 2])
    const recovered = button(menu(store, home.navigation), 'Load Game')
    assert.equal(recovered.props['aria-disabled'], false)
    recovered.props.onClick()
    assert.equal(store.getWorld().turn, 217)
    assert.notEqual(store.getWorld(), active)
    assert.deepEqual(home.states, ['choice', 'playing'], 'only deliberate Load invokes actual Home beginLoad')
    home.cleanup()
  }, { latest: { version: 1, world: saved }, profile: { version: 1, completed: [1, 2] } })
})

test('genuine empty and unusable records are read results, not a failed lookup or proof of empty disk', async () => {
  for (const latest of [undefined, { version: 999, world: {} }, { version: 1, world: {} }]) {
    await withStorage(async ({ store, open, read, writes }) => {
      const home = startup(store)
      await open(); await read()
      assert.equal(store.getCheckpointReadStatus(), 'read')
      assert.equal(store.hasCheckpoint(), false)
      assert.equal(button(menu(store), 'Load Game').props.title, 'No usable saved checkpoint')
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
  const saved = createWorld(); saved.turn = 217
  await withStorage(async ({ store, open, read }) => {
    const home = startup(store)
    await open(true)
    button(menu(store), 'Retry checkpoint lookup').props.onClick()
    await open()
    home.navigation.startMission(2)
    const newer = store.getWorld()
    newer.turn = 999
    assert.equal(await store.saveCheckpoint(), true)
    await read()
    assert.equal(store.getWorld(), newer)
    assert.deepEqual(home.states, ['choice', 'playing'], 'Home stays mounted while retry completes after mission launch')
    home.navigation.loadCheckpoint()
    assert.equal(store.getWorld().turn, 999, 'post-await memory checkpoint wins over old read')
    home.cleanup()
  }, { latest: { version: 1, world: saved } })
})

for (const interruption of ['unmount', 'world replacement']) test(`initial restore completion cannot navigate after ${interruption}`, async () => {
  await withStorage(async ({ store, open, read }) => {
    const home = startup(store)
    await open()
    if (interruption === 'unmount') home.cleanup()
    else store.startMission(2)
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
    assert.equal(button(menu(store), 'Load Game').props.title, 'Browser storage is unavailable')
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
