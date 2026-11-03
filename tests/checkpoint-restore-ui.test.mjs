import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { createWorld } from '../app/world-initialization.ts'
import { frontendRowY, frontendTextWidth } from '../app/frontend-composition.ts'
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
  styles: new Proxy({}, { get: (_, name) => name }), MenuText: 'MenuText', MenuTooltip,
  frontendRowY, frontendTextWidth,
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
    setCheatsOpen: value => cheatClosures.push(value),
    cancelNearbyInput: () => {}, setSelectorOpen: () => {}, setMenu: () => {},
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

test('combined current checkpoint contract is version 5', () => {
  assert.equal(CHECKPOINT_VERSION, 5)
})

// Supplied nondefault continuation, not evidence of a natural gameplay trace.
function retainedCamera(world) {
  const camera = world.cameras
  camera.tribes[0].x = 197
  camera.held[0].x = 3
  camera.time = 0.017
  camera.navigationTime = 0.003
  camera.elapsed = 0.5
  camera.input = { time: 0.497, cursor: 8, buttons: 1,
    pointer: { x: -0.5, y: 799.25, buttons: 0 } }
  camera.keys.add('w')
  return camera
}

let session = 0
async function withStorage(run, initial = {}, { failWrite = false } = {}) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  const records = new Map(Object.entries(initial)), opens = [], reads = [], writes = []
  let transactions = 0
  const database = Object.assign(new EventTarget(), {
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
  })
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
    await run({ store: createGameStore(), createStore: createGameStore, open, read, records, writes, opens, reads, transactions: () => transactions })
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
  }, { latest: { version: CHECKPOINT_VERSION, world: saved }, profile: { version: 1, completed: [1, 2] } })
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
  }, { latest: { version: CHECKPOINT_VERSION, world: saved } })
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
    else assert.equal(records.get('latest').version, CHECKPOINT_VERSION)
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
    assert.equal(records.get('latest').version, CHECKPOINT_VERSION)
    await read()
    assert.equal(await restoring, true)
    assert.equal(store.getCheckpointReadStatus(), 'read')
    assert.equal(text(menu(store)).includes('incompatible'), false)
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.deepEqual(store.getCompletedMissions(), [1, 2])
  }, { latest: { version: 1, world: createWorld() }, profile: { version: 1, completed: [1, 2] } })
})

for (const version of [3, 4, 999]) {
  test(`otherwise current world under incompatible envelope ${version} is never relabeled`, async () => {
    assert.notEqual(CHECKPOINT_VERSION, version)
    const saved = createWorld(1, 'scalable')
    retainedCamera(saved)
    await withStorage(async ({ store, open, read, records, writes }) => {
      const active = store.getWorld(), before = structuredClone(records)
      const home = startup(store)
      await open(); await read()
      assert.equal(store.getCheckpointReadStatus(), 'incompatible')
      assert.equal(store.hasCheckpoint(), false)
      assert.equal(store.loadCheckpoint(), false)
      assert.equal(store.getWorld(), active)
      assert.deepEqual(records, before)
      assert.deepEqual(writes, [])
      assert.deepEqual(store.getCompletedMissions(), [1, 2])
      assert.deepEqual(home.states, ['choice'])
      assert.match(text(menu(store)), /incompatible.*stored save has not been changed/)
      home.cleanup()
    }, { latest: { version, world: saved }, profile: { version: 1, completed: [1, 2] } })
  })
}

for (const [name, damage] of [
  ['missing cameras', world => { delete world.cameras }],
  ['active camera phase', world => { world.cameras.phase = 'simulation' }],
  ['missing pointer field', world => { delete world.cameras.input.pointer }],
  ['nonfinite camera pose', world => { world.cameras.tribes[0].x = NaN }],
  ['invalid scenery source', world => { world.scenerySource.sourceSha256 = '0'.repeat(64) }],
  // Deliberately malformed supplied effect records; these test the store guard,
  // not natural effect production or the complete effect-state contract.
  ['present malformed Angel latch', world => { world.effects.push({ angel: { presentation: null } }) }],
  ['malformed Tornado particle', world => { world.effects.push({ tornado: { particles: [{}] } }) }],
]) {
  test(`current envelope rejects ${name} without changing records or the active world`, async () => {
    const saved = createWorld(1, 'scalable')
    retainedCamera(saved)
    damage(saved)
    await withStorage(async ({ store, open, read, records, writes }) => {
      const active = store.getWorld(), before = structuredClone(records)
      const restoring = store.restoreCheckpoint()
      assert.equal(restoring, store.restoreCheckpoint())
      await open(); await read()
      assert.equal(await restoring, false)
      assert.equal(store.getCheckpointReadStatus(), 'incompatible')
      assert.equal(store.loadCheckpoint(), false)
      assert.equal(store.getWorld(), active)
      assert.deepEqual(records, before)
      assert.deepEqual(writes, [])
      assert.deepEqual(store.getCompletedMissions(), [1, 2])
    }, { latest: { version: CHECKPOINT_VERSION, world: saved }, profile: { version: 1, completed: [1, 2] } })
  })
}

test('successful current Save survives fresh-store lookup and deliberate Load with exact camera continuation', async () => {
  await withStorage(async ({ store, createStore, open, read, records, writes }) => {
    const original = store.getWorld()
    const camera = structuredClone(retainedCamera(original))
    const saving = store.saveCheckpoint()
    await open()
    assert.equal(await saving, true)
    assert.equal(records.get('latest').version, CHECKPOINT_VERSION)
    assert.deepEqual(records.get('latest').world.cameras, camera)
    const before = structuredClone(records), writeCount = writes.length
    const fresh = createStore(), active = fresh.getWorld()
    const restoring = fresh.restoreCheckpoint()
    await settle(); await read()
    assert.equal(await restoring, true)
    assert.equal(fresh.getCheckpointReadStatus(), 'read')
    assert.equal(fresh.getWorld(), active, 'lookup does not load or navigate')
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount)
    assert.equal(fresh.loadCheckpoint(), true)
    assert.notEqual(fresh.getWorld(), active)
    assert.notEqual(fresh.getWorld(), original)
    assert.deepEqual(fresh.getWorld().cameras, camera)
    assert.deepEqual(fresh.getWorld().scenerySource, original.scenerySource)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount, 'deliberate Load also leaves stored data unchanged')
  })
})

test('rejected camera Save preserves the previous committed and session checkpoints', async () => {
  await withStorage(async ({ store, open, records, writes }) => {
    const camera = structuredClone(retainedCamera(store.getWorld()))
    const saving = store.saveCheckpoint()
    await open()
    assert.equal(await saving, true)
    const before = structuredClone(records), writeCount = writes.length
    store.getWorld().cameras.input.pointer.x = NaN
    await assert.rejects(store.saveCheckpoint(), RangeError)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount)
    assert.equal(store.loadCheckpoint(), true)
    assert.deepEqual(store.getWorld().cameras, camera)
    assert.deepEqual(records, before)
  })
})

// Reuse the existing Angel public-cast fixture design: the arena/units are
// supplied, but casting, projectile arrival and the partial strike are real.
// Removing presentation below intentionally supplies the valid-absent policy
// boundary; it does not claim a naturally produced absent latch at that turn.
async function partialStrikeInStore(store) {
  const { addUnit, cast } = await import('../app/model.ts')
  const { retainFixtureUnits } = await import('./level-start-fixture.mjs')
  const { syncLandscapeObjects } = await import('../app/world-terrain-runtime.ts')
  const { createLivePerson, syncLivePersonCells } = await import('../app/live-people.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const world = store.getWorld()
  world.manaWorld.loadFlags |= 0x200
  world.terrain.fill(3)
  world.terrainVersion++
  retainFixtureUnits(world, () => false)
  world.buildings = []; world.trees = []; world.shrines = []
  syncLandscapeObjects(world)
  addUnit(world, 'blue', 'shaman', { x: 0, z: 8 })
  const victim = addUnit(world, 'red', 'brave', { x: 0, z: 0 })
  victim.native = createLivePerson(world, victim)
  victim.native.damageAttacker = 255
  syncLivePersonCells(world)
  world.shots.angel = 1
  assert.equal(cast(world, 'angel', { x: 0, z: 0 }), true)
  const clock = {
    get animationTime() { return world.cameras.animationTime },
    set animationTime(value) { world.cameras.animationTime = value },
    get animationFrame() { return world.cameras.animationFrame },
    set animationFrame(value) { world.cameras.animationFrame = value },
  }
  for (let turn = 0; turn < 96; turn++) {
    advanceGame(world, clock, 1 / 24)
    const effect = world.effects.find(effect => effect.angel)
    if (effect?.angel.phase === 'striking' &&
        effect.angel.presentation?.transitionCounter > 0 &&
        effect.angel.presentation.transitionCounter < 5) return effect
  }
  assert.fail('Public cast must reach an actual partial strike before saving')
}

for (const presentation of ['absent', 'present']) {
  test(`fresh-store durable Load preserves valid ${presentation} Angel presentation policy`, async () => {
    await withStorage(async ({ store, createStore, open, read, records, writes }) => {
      const effect = await partialStrikeInStore(store)
      if (presentation === 'absent') delete effect.angel.presentation
      assert.equal(Object.hasOwn(effect.angel, 'presentation'), presentation === 'present')
      const expected = structuredClone(effect.angel)
      const saving = store.saveCheckpoint()
      await open()
      assert.equal(await saving, true)
      const storedAngel = records.get('latest').world.effects.find(item => item.id === effect.id).angel
      assert.deepEqual(storedAngel, expected)
      assert.equal(Object.hasOwn(storedAngel, 'presentation'), presentation === 'present')
      const before = structuredClone(records), writeCount = writes.length
      const fresh = createStore(), active = fresh.getWorld()
      const restoring = fresh.restoreCheckpoint()
      await settle(); await read()
      assert.equal(await restoring, true)
      assert.equal(fresh.getCheckpointReadStatus(), 'read')
      assert.equal(fresh.getWorld(), active, 'lookup must not replace the active world')
      assert.deepEqual(records, before)
      assert.equal(writes.length, writeCount)
      assert.equal(fresh.loadCheckpoint(), true)
      const loaded = fresh.getWorld().effects.find(item => item.id === effect.id).angel
      assert.deepEqual(loaded, expected)
      assert.equal(Object.hasOwn(loaded, 'presentation'), presentation === 'present',
        'Load must neither fill genuine absence nor drop a valid existing latch')
      assert.deepEqual(records, before)
      assert.equal(writes.length, writeCount)
    })
  })
}
