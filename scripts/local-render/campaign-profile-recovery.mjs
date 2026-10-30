import { setWorldPaused } from '../browser-world-input.mjs'
import { dependencyReceipt } from '../orchestration/dependency-profile.mjs'
import assert from 'node:assert/strict'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { pauseStartupReady, skipPauseIntroduction, recoverVisibleIntroduction } from './original-pause-checkpoint-recovery.mjs'
import { waitRecoveryReadiness } from '../tutorial-browser/profile-readiness.mjs'
import { openCampaignFromMainMenu, waitForStartupMenu } from '../browser-new-game.mjs'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { traceProfileInput } from '../tutorial-browser/profile-input-trace.mjs'

// Named local-render scenario. All seeded records are explicit browser-storage
// fixtures; public startup/Save/Load assertions are recorded separately.
async function bindStartupStore(page) {
  await waitForStartupMenu(page)
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
          window.testStore = hook.memoizedState
          return true
        }
    return false
  })
}

function observeStorageWrites() {
  window.recoveryStorageWrites = []
  for (const method of ['put', 'add', 'delete', 'clear']) {
    const original = IDBObjectStore.prototype[method]
    IDBObjectStore.prototype[method] = function (...args) {
      if (this.transaction.db.name === 'populous-new-dawn' && this.name === 'checkpoints')
        window.recoveryStorageWrites.push({ method, key: String(method === 'put' || method === 'add' ? args[1] : args[0]) })
      return Reflect.apply(original, this, args)
    }
  }
}

// Hash every stored value, preserving references, typed arrays, Maps and Sets.
// This is read-only and compares complete records, including malformed worlds.
async function storedRecords() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    const records = await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly'), store = transaction.objectStore('checkpoints')
      const keys = store.getAllKeys(), values = store.getAll()
      transaction.oncomplete = () => resolve(keys.result.map((key, index) => [key, values.result[index]]))
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? Error('Storage read aborted'))
    })
    const canonical = value => {
      const seen = new Map()
      let nodes = 0
      const encode = (value, depth = 0) => {
        if (++nodes > 2_000_000 || depth > 128) throw Error('Record exceeds observation bounds')
        if (value === null) return ['null']
        const type = typeof value
        if (type === 'undefined') return ['undefined']
        if (type === 'number') return ['number', Number.isFinite(value) && !Object.is(value, -0) ? value : Object.is(value, -0) ? '-0' : String(value)]
        if (type === 'string' || type === 'boolean') return [type, value]
        if (type === 'bigint') return [type, value.toString()]
        if (type !== 'object') throw Error(`Unsupported stored value: ${type}`)
        if (seen.has(value)) return ['reference', seen.get(value)]
        const id = seen.size
        seen.set(value, id)
        const child = entry => encode(entry, depth + 1)
        if (Array.isArray(value)) return ['array', id, Array.from({ length: value.length }, (_, index) => index in value ? child(value[index]) : ['hole'])]
        if (value instanceof Map) return ['map', id, [...value].map(([key, entry]) => [child(key), child(entry)])]
        if (value instanceof Set) return ['set', id, [...value].map(child)]
        if (value instanceof ArrayBuffer) return ['buffer', id, Array.from(new Uint8Array(value))]
        if (ArrayBuffer.isView(value)) return ['view', id, value.constructor.name, value.byteOffset, value.byteLength, child(value.buffer)]
        if (value instanceof Date) return ['date', id, child(value.getTime())]
        const prototype = Object.getPrototypeOf(value)
        if (prototype !== Object.prototype && prototype !== null) throw Error('Unsupported stored prototype')
        if (Reflect.ownKeys(value).length !== Object.keys(value).length) throw Error('Unsupported stored properties')
        return ['object', id, prototype === null ? 'null-prototype' : 'plain', Object.keys(value).map(key => [key, child(value[key])])]
      }
      const text = JSON.stringify(encode(value))
      if (text.length > 64 * 1024 * 1024) throw Error('Record encoding exceeds observation bounds')
      return text
    }
    return Promise.all(records.map(async ([key, value]) => ({
      key,
      sha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)))), byte => byte.toString(16).padStart(2, '0')).join(''),
    })))
  } finally { db.close() }
}

// Read the profile itself as well as retaining complete-record digests. This
// observer never writes and does not consult the store's in-memory projection.
export async function storedRecoveryProfile() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly')
      const request = transaction.objectStore('checkpoints').get('profile')
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? Error('Profile observation aborted'))
    })
  } finally { db.close() }
}

// Independent oracle for only this scenario's two declared legacy/fresh inputs.
// Do not call the implementation's merge/transition helper to bless its output.
export function assertRecoverySelectorProfile(before, after, completed) {
  const fresh = before === undefined
  assert.deepEqual(completed, fresh ? [] : [1, 2], 'Recovery fixture completion ledger')
  if (!fresh) {
    assert.equal(before.version, 1)
    assert.deepEqual(before.completed, [1, 2])
    assert.equal(Object.hasOwn(before, 'nativeCampaign'), false, 'Expected the declared completed-only fixture')
  }
  const flags = Array(25).fill(0)
  flags[0] = fresh ? 4 : 5
  if (!fresh) { flags[1] = 1; flags[2] = 4 }
  const expected = { ...before, version: 1, completed: [...completed], nativeCampaign: {
    version: 1, flags, history: fresh ? 'native-model' : 'legacy-completed-only',
  } }
  assert.deepEqual(after, expected, 'Selector must persist exactly the allowed native return transition and preserve every other profile field')
  return expected
}

async function seedRecords(page, { kind, completed = [1, 2] }) {
  await page.evaluate(async ({ kind, completed, currentVersion }) => {
    let latest
    if (kind === 'malformed') latest = { version: 1, world: {} }
    // Historical partial state is rejected before normalization.
    if (kind === 'partially-migratable') latest = { version: 1, world: { objectCells: { heads: new Uint16Array([0, 17]) } } }
    if (kind === 'incompatible') latest = { version: 999, world: {} }
    if (kind === 'current' || kind === 'legacy') {
      const world = structuredClone(window.testStore.getWorld())
      world.turn = 217
      world.randomState = 0x12345678
      if (kind === 'legacy') { delete world.drawMode; delete world.capacityPolicy }
      latest = { version: kind === 'legacy' ? 1 : currentVersion, world }
    }
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('checkpoints', 'readwrite'), store = transaction.objectStore('checkpoints')
        if (kind !== 'empty') store.put({ version: 1, completed }, 'profile')
        if (latest) store.put(latest, 'latest')
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error ?? Error('Fixture seed aborted'))
      })
    } finally { db.close() }
  }, { kind, completed, currentVersion: CHECKPOINT_VERSION })
}

async function expectProfileUi(page, completed) {
  await openCampaignFromMainMenu(page)
  const dialog = page.getByRole('dialog', { name: 'Start game', exact: true })
  const labels = []
  for (const mission of [1, 2, 3]) {
    const label = await dialog.getByRole('button', { name: `Panel Mission ${mission}${completed.includes(mission) ? ', completed' : ''}`, exact: true }).innerText()
    labels.push({ mission, label })
    if (completed.includes(mission)) assert.match(label, /Completed, ready to replay/)
    else assert.match(label, mission === 1 || completed.includes(mission - 1) ? /Available/ : /Locked/)
  }
  const target = completed.includes(2) ? 3 : 1
  await dialog.getByRole('button', { name: `Panel Mission ${target}${completed.includes(target) ? ', completed' : ''}`, exact: true }).click()
  const start = dialog.getByRole('button', { name: `${completed.includes(target) ? 'Replay' : 'Start'} Mission ${target}`, exact: true })
  assert.equal(await start.isEnabled(), true)
  const enabledStart = await start.getAttribute('aria-label')
  return { labels, enabledStart }
}

async function installLoadObserver(page) {
  await page.evaluate(() => {
    const store = window.testStore, before = store.getWorld()
    window.recoveryLoadBoundary = null
    const unsubscribe = store.subscribe(() => {
      const world = store.getWorld()
      if (world === before) return
      window.recoveryLoadBoundary = { version: 3, world: structuredClone(world) }
      unsubscribe()
    })
  })
}

export default async function ({ browser, context: initialContext, page: initialPage, url, root, output, receipt, signal, deadlineAt }) {
  const require = createRequire(resolve(root, 'package.json'))
  const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  const { checkpointObservation } = await import(pathToFileURL(resolve(root, 'scripts/local-render/checkpoint-observer.mjs')).href)
  const runtime = () => ({
      node: process.version, platform: process.platform, arch: process.arch,
      browserVersion: receipt.browserVersion, browserSha256: digest(receipt.browserPath ?? receipt.launch.executablePath),
      launch: receipt.launch, playwright: require('@playwright/test/package.json').version,
      ...dependencyReceipt(root),
      helpers: Object.fromEntries(['scripts/tutorial-browser/profile-readiness.mjs', 'scripts/tutorial-browser/profile-input-trace.mjs', 'scripts/campaign-start-readiness.mjs', 'scripts/local-render/harness.mjs', 'scripts/local-render/vite.config.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/browser-game.mjs', 'scripts/browser-world-input.mjs', 'scripts/browser-introduction.mjs', 'scripts/local-render/original-pause-checkpoint-recovery.mjs', 'scripts/checkpoint-readback.mjs'].map(file => [file, digest(resolve(root, file))])),
  })
  const report = {
    status: 'running',
    scenarioSha256: digest(new URL(import.meta.url)),
    runtime: runtime(),
    method: 'Real IndexedDB committed transactions in fresh ephemeral browser contexts. Seeded latest/profile records are diagnostic fixtures. Fresh page startup, native selector availability, and valid checkpoint Load use shipped UI. Restore and Load are checked as no-write boundaries; explicit selector entry may persist only its native profile transition. The ordinary Save → fresh-page Load case seeds no records or gameplay state. In-session restore is a direct store diagnostic with an ordinary UI checkpoint and seeded completion/corruption.',
    limits: 'Browser checkpoint failure isolation only. Page reload within one browser context is not browser-process restart persistence. Complete stored-record digests do not establish full loaded-world equality. Load-boundary version is a supplied wrapper value, not an independent observation. No authentic original-save interoperability, naturally earned campaign completion, deployment behavior, hardware performance, or full PND-07 claim.',
    cases: [],
    screenshots: [],
    inputBudgets: [],
  }
  const capture = async (page, name) => {
    const viewport = page.viewportSize()
    const dpr = await page.evaluate(() => devicePixelRatio)
    await page.screenshot({ path: resolve(output, name) })
    report.screenshots.push({ name, viewport, dpr })
  }
  const save = () => writeFileSync(resolve(output, 'profile-recovery.json'), JSON.stringify(report, null, 2) + '\n')
  const freshPage = async first => {
    const context = first ? initialContext : await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    try {
      await context.addInitScript(observeStorageWrites)
      const page = first ? initialPage : await context.newPage()
      page.setDefaultTimeout(15000)
      page.on('crash', () => receipt.errors.push('Profile recovery page crashed'))
      if (!first) {
        page.on('pageerror', error => receipt.errors.push(String(error)))
        page.on('console', message => {
          if (message.type() === 'error') receipt.errors.push(message.text())
          if (message.type() === 'warning') receipt.warnings.push(message.text())
        })
      }
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await bindStartupStore(page)
      return { context, page }
    } catch (error) {
      await context.close()
      throw error
    }
  }
  const skipInput = async page => {
    const trace = {}; report.inputBudgets.push(trace)
    try {
      await skipPauseIntroduction(page, Number.isFinite(deadlineAt)
        ? { setupTimeout: 15000, deadlineAt, signal, trace } : { trace })
    } finally { save() }
  }
  const loadThroughUi = async (page, button) => {
    await installLoadObserver(page)
    await button.click()
    const loaded = await page.evaluate(checkpointObservation, { observationName: 'recoveryLoadBoundary' })
    const fields = await page.evaluate(() => {
      const world = window.recoveryLoadBoundary.world
      return { turn: world.turn, randomState: world.randomState, drawMode: world.drawMode }
    })
    await bindGame(page)
    const startup = await page.waitForFunction(pauseStartupReady)
    const action = await startup.jsonValue()
    await startup.dispose()
    if (action === 'skip') {
      if (!report.inputActionTrace)
        await traceProfileInput(page.context(), report, output, () => skipInput(page))
      else await skipInput(page)
    }
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await setWorldPaused(page, true, { timeout: 2500 })
    assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), true)
    const renderer = await page.evaluate(() => {
      const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        version: gl.getParameter(gl.VERSION), contextLost: gl.isContextLost(),
        drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], dpr: devicePixelRatio,
      }
    })
    assert.equal(renderer.contextLost, false)
    return { loaded, fields, renderer, canvasVisible: await page.locator('.world-viewport canvas.battlefield').isVisible() }
  }
  save()
  try {
  for (const kind of ['empty', 'missing', 'malformed', 'partially-migratable', 'incompatible', 'current', 'legacy']) {
    signal.throwIfAborted()
    const entry = { kind, fixture: true, status: 'running' }
    if (kind === 'partially-migratable') entry.fixtureScope = 'Obsolete partial state rejects without normalization; complete stored-record digest must remain unchanged.'
    if (kind === 'legacy') entry.fixtureScope = 'Obsolete v1 checkpoint without capacity policy is rejected and preserved, not upgraded.'
    report.cases.push(entry)
    save()
    const { context, page } = await freshPage(kind === 'empty')
    try {
      await seedRecords(page, { kind })
      entry.beforeStartup = await page.evaluate(storedRecords)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await bindStartupStore(page)
      const valid = kind === 'current', expected = kind === 'empty' ? [] : [1, 2]
      entry.startup = await page.evaluate(async () => {
        const store = window.testStore, active = store.getWorld()
        const before = { completed: store.getCompletedMissions(), hasCheckpoint: store.hasCheckpoint() }
        const restoredAgain = await store.restoreCheckpoint()
        return { ...before, restoredAgain, activeWorldPreserved: store.getWorld() === active, completedAfterRepeat: store.getCompletedMissions(), writes: [...window.recoveryStorageWrites] }
      })
      assert.deepEqual(entry.startup.completed, expected)
      assert.deepEqual(entry.startup.completedAfterRepeat, expected)
      assert.equal(entry.startup.hasCheckpoint, valid)
      assert.equal(entry.startup.restoredAgain, valid)
      assert.equal(entry.startup.activeWorldPreserved, true)
      assert.deepEqual(entry.startup.writes, [])
      entry.afterRestore = await page.evaluate(storedRecords)
      assert.deepEqual(entry.afterRestore, entry.beforeStartup, 'Restore alone preserves every record')
      entry.profileBeforeSelector = await page.evaluate(storedRecoveryProfile)
      assert.deepEqual(entry.profileBeforeSelector, kind === 'empty' ? undefined : { version: 1, completed: expected })
      entry.selector = await expectProfileUi(page, expected)
      if (kind === 'malformed') await capture(page, 'malformed-profile-selector.png')
      // Native selection returns through its dialog owner, not removed compatibility controls.
      await page.keyboard.press('Escape')
      await waitForStartupMenu(page)
      // Deliberately entering selection applies a native return transition. It
      // may persist availability, but cannot manufacture completion or a save.
      entry.afterSelector = await page.evaluate(storedRecords)
      assert.deepEqual(entry.afterSelector.filter(record => record.key !== 'profile'),
        entry.beforeStartup.filter(record => record.key !== 'profile'), 'Selector entry never replaces checkpoint data')
      const sessionCompleted = await page.evaluate(() => window.testStore.getCompletedMissions())
      assert.deepEqual(sessionCompleted, expected)
      entry.profileAfterSelector = await page.evaluate(storedRecoveryProfile)
      assertRecoverySelectorProfile(entry.profileBeforeSelector, entry.profileAfterSelector, sessionCompleted)
      const writesBeforeLoad = await page.evaluate(() => [...window.recoveryStorageWrites])
      assert.ok(writesBeforeLoad.every(write => write.method === 'put' && write.key === 'profile'), 'Only the explicit selector transition may write')
      const load = page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true })
      assert.equal(await load.count(), 1)
      assert.equal(await load.getAttribute('aria-disabled'), String(!valid))
      if (valid) {
        entry.publicLoad = await loadThroughUi(page, load)
        assert.deepEqual(entry.publicLoad.fields, { turn: 217, randomState: 0x12345678, drawMode: 0 })
        assert.equal(entry.publicLoad.loaded.level, 1)
        assert.equal(entry.publicLoad.canvasVisible, true)
      }
      entry.afterRestoreAndLoad = await page.evaluate(storedRecords)
      assert.deepEqual(entry.afterRestoreAndLoad, entry.afterSelector, 'Load preserves every post-selector stored record')
      assert.deepEqual(await page.evaluate(() => window.recoveryStorageWrites), writesBeforeLoad)
      entry.status = 'passed'
      save()
    } catch (error) {
      entry.status = 'failed'
      entry.error = error.stack
      await page.screenshot({ path: resolve(output, `${kind}-failed.png`), timeout: 5000 }).catch(() => {})
      save()
      throw error
    } finally { await context.close() }
  }

  for (const kind of ['ordinary-save-fresh-load', 'usable-session-checkpoint']) {
    signal.throwIfAborted()
    const entry = { kind, fixture: kind === 'usable-session-checkpoint', status: 'running' }
    report.cases.push(entry)
    save()
    const { context, page } = await freshPage(false)
    try {
      if (entry.fixture) {
        await seedRecords(page, { kind: 'missing', completed: [3] })
        await page.reload({ waitUntil: 'domcontentloaded' })
        await bindStartupStore(page)
        assert.deepEqual(await page.evaluate(() => window.testStore.getCompletedMissions()), [3])
      }
      await openCampaignFromMainMenu(page)
      const startup = page.getByRole('dialog', { name: 'Start game', exact: true })
      await startup.getByRole('button', { name: 'Panel Mission 1', exact: true }).click()
      await startup.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
      await bindGame(page)
      const startupReady = await page.waitForFunction(pauseStartupReady)
      const action = await startupReady.jsonValue()
      await startupReady.dispose()
      if (action === 'skip') await skipInput(page)
      entry.readiness = await waitRecoveryReadiness(page, { signal, onBlocked: recoverVisibleIntroduction(page) })
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      const menu = page.locator('dialog[data-original-pause-menu]')
      await menu.waitFor({ state: 'visible' })
      const savedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
      await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
      await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
      let saved
      assert.equal(await waitForCheckpointReadback(async () => {
        signal.throwIfAborted()
        saved = await page.evaluate(checkpointObservation)
        return saved?.turn === savedTurn && saved.level === 1
      }, { attempts: 100, pause: () => page.waitForTimeout(100) }), true)
      entry.saved = saved
      if (!entry.fixture) {
        entry.beforeReload = await page.evaluate(storedRecords)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await bindStartupStore(page)
        entry.publicLoad = await loadThroughUi(page, page.getByRole('button', { name: 'Load Game', exact: true }))
        for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
          assert.deepEqual(entry.publicLoad.loaded[key], saved[key], `Ordinary fresh-page Load preserves ${key}`)
        entry.afterLoad = await page.evaluate(storedRecords)
        assert.deepEqual(entry.afterLoad, entry.beforeReload)
        assert.deepEqual(await page.evaluate(() => window.recoveryStorageWrites), [])
        await capture(page, 'ordinary-fresh-load.png')
      } else {
        await menu.getByRole('button', { name: 'Back', exact: true }).click()
        await menu.getByRole('button', { name: /^Continue Game/ }).click()
        await menu.waitFor({ state: 'hidden' })
        await page.waitForFunction(() => !window.testStore.getWorld().paused)
        assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false, 'Continue Game closes settings and resumes the public clock')
        await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, saved.turn)
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        await menu.waitFor({ state: 'visible' })
        await seedRecords(page, { kind: 'malformed' })
        entry.beforeRestore = await page.evaluate(storedRecords)
        entry.session = await page.evaluate(async () => {
          const store = window.testStore, active = store.getWorld(), turn = active.turn,
            writesBefore = window.recoveryStorageWrites.length,
            restored = await store.restoreCheckpoint()
          return { restored, hasCheckpoint: store.hasCheckpoint(), activeWorldPreserved: store.getWorld() === active, turnBefore: turn, turnAfter: store.getWorld().turn, completed: store.getCompletedMissions(), writesBefore, writesAfter: window.recoveryStorageWrites.length }
        })
        assert.equal(entry.session.restored, true)
        assert.equal(entry.session.hasCheckpoint, true)
        assert.equal(entry.session.activeWorldPreserved, true)
        assert.equal(entry.session.turnAfter, entry.session.turnBefore)
        assert.ok(entry.session.turnBefore > saved.turn)
        assert.deepEqual(entry.session.completed, [1, 2, 3])
        assert.equal(entry.session.writesAfter, entry.session.writesBefore)
        await menu.getByRole('button', { name: 'Load Game', exact: true }).click()
        entry.publicLoad = await loadThroughUi(page, menu.getByRole('button', { name: 'Load checkpoint', exact: true }))
        for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
          assert.deepEqual(entry.publicLoad.loaded[key], saved[key], `Usable session checkpoint preserves ${key}`)
        assert.deepEqual(await page.evaluate(() => window.testStore.getCompletedMissions()), [1, 2, 3])
        entry.afterLoad = await page.evaluate(storedRecords)
        assert.deepEqual(entry.afterLoad, entry.beforeRestore)
        assert.equal(await page.evaluate(() => window.recoveryStorageWrites.length), entry.session.writesBefore)
      }
      entry.status = 'passed'
      save()
    } catch (error) {
      entry.status = 'failed'
      entry.error = error.stack
      await page.screenshot({ path: resolve(output, `${kind}-failed.png`), timeout: 5000 }).catch(() => {})
      save()
      throw error
    } finally { await context.close() }
  }
  assert.deepEqual(receipt.errors, [], 'No browser page/console errors')
  report.runtimeAfter = runtime()
  assert.deepEqual(report.runtimeAfter, report.runtime, 'Runtime and helper inputs must remain unchanged')
  assert.equal(digest(new URL(import.meta.url)), report.scenarioSha256, 'Scenario input must remain unchanged')
  report.status = 'passed'
  save()
  return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    save()
    throw error
  }
}
