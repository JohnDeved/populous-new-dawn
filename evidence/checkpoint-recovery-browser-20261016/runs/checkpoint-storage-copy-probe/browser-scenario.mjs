import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame } from '../../../scripts/browser-game.mjs'
import { openCampaignFromMainMenu } from '../../../scripts/browser-new-game.mjs'

// Bounded browser-storage fixture. It never edits game state or replaces Home.
// Open faults are injected throws; abort faults use the real IDBTransaction.abort.
// A held read stays alive with read-only requests for at most 30 seconds.
function storageFixture(initialFault) {
  const originalOpen = IDBFactory.prototype.open
  const originalTransaction = IDBDatabase.prototype.transaction
  const originalWrites = Object.fromEntries(['put', 'add', 'delete', 'clear'].map(name => [name, IDBObjectStore.prototype[name]]))
  const state = { label: 'checkpoint recovery storage-boundary fixture', next: initialFault, opens: 0, reads: 0, writes: [], faults: [], held: false, holdExpired: false }
  IDBFactory.prototype.open = function (name, ...args) {
    if (name === 'populous-new-dawn') {
      state.opens++
      if (state.next === 'open') {
        state.next = null; state.faults.push('injected synchronous open failure')
        throw new DOMException('Checkpoint recovery fixture open failure', 'UnknownError')
      }
    }
    return originalOpen.call(this, name, ...args)
  }
  IDBDatabase.prototype.transaction = function (names, mode, ...args) {
    const transaction = originalTransaction.call(this, names, mode, ...args)
    if (this.name === 'populous-new-dawn' && (mode === undefined || mode === 'readonly') && transaction.objectStoreNames.contains('checkpoints')) {
      state.reads++
      const fault = state.next
      if (fault === 'abort' || fault === 'hold') state.next = null
      if (fault === 'abort') queueMicrotask(() => {
        state.faults.push('real read transaction aborted by fixture')
        transaction.abort()
      })
      if (fault === 'hold') {
        state.held = true
        const deadline = performance.now() + 30000
        const keepAlive = () => {
          if (!state.held) return
          if (performance.now() >= deadline) { state.holdExpired = true; state.held = false; return }
          transaction.objectStore('checkpoints').get('__checkpoint_recovery_read_only_keepalive__').onsuccess = keepAlive
        }
        keepAlive()
      }
    }
    return transaction
  }
  for (const [name, original] of Object.entries(originalWrites)) IDBObjectStore.prototype[name] = function (...args) {
    if (this.transaction.db.name === 'populous-new-dawn') state.writes.push({ method: name, store: this.name, key: args[name === 'put' || name === 'add' ? 1 : 0] ?? null })
    return original.apply(this, args)
  }
  const snapshot = async () => {
    const database = await new Promise((resolve, reject) => {
      const request = originalOpen.call(indexedDB, 'populous-new-dawn', 1)
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
    })
    const values = await new Promise((resolve, reject) => {
      const tx = originalTransaction.call(database, 'checkpoints', 'readonly')
      const store = tx.objectStore('checkpoints'), keys = store.getAllKeys(), values = store.getAll()
      tx.oncomplete = () => resolve({ keys: keys.result, values: values.result })
      tx.onabort = () => reject(tx.error)
    })
    database.close()
    const bytes = new TextEncoder().encode(JSON.stringify(values, (_, value) => {
      if (ArrayBuffer.isView(value)) return { type: value.constructor.name, values: Array.from(value) }
      if (value instanceof Map) return { type: 'Map', values: [...value] }
      if (value instanceof Set) return { type: 'Set', values: [...value] }
      return value
    }))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const latest = values.values[values.keys.indexOf('latest')]
    return { keys: values.keys, sha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join(''),
      checkpoint: latest?.world ? { level: latest.world.outcome.level, turn: latest.world.turn, time: latest.world.time, paused: latest.world.paused, randomState: latest.world.randomState, units: latest.world.units.map(unit => [unit.id, unit.kind, unit.team, unit.hp, unit.x, unit.z]) } : null }
  }
  window.checkpointFixture = { state, snapshot, arm: fault => { state.next = fault }, release: () => { state.held = false } }
}

async function observe(page) {
  return page.evaluateHandle(() => {
    function owners() {
      const main = document.querySelector('main')
      let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
      let store, scene = null
      for (; fiber; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.getWorld) store = hook.memoizedState
        if (hook.memoizedState?.current?.unitMeshes) scene = hook.memoizedState.current
      }
      if (!store) throw Error('Actual Home store not found')
      return { store, scene }
    }
    const initial = owners(), world = initial.store.getWorld(), canvas = document.querySelector('.world-viewport canvas')
    let loadingSeen = false, canvasRemoved = false, loadedState = null
    const unsubscribe = initial.store.subscribe(() => {
      const current = initial.store.getWorld()
      if (!loadedState && current !== world) loadedState = { level: current.outcome.level, turn: current.turn, time: current.time, paused: current.paused, randomState: current.randomState, units: current.units.map(unit => [unit.id, unit.kind, unit.team, unit.hp, unit.x, unit.z]) }
    })
    const mutations = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node.nodeType === 1 && (node.matches('.loading-world') || node.querySelector('.loading-world'))) loadingSeen = true
        for (const node of record.removedNodes) if (canvas && (node === canvas || node.contains(canvas))) canvasRemoved = true
      }
    })
    mutations.observe(document.body, { childList: true, subtree: true })
    return {
      read() {
        const current = owners()
        return { sameStore: current.store === initial.store, sameWorld: current.store.getWorld() === world,
          sameScene: current.scene === initial.scene, sameSceneWorld: !initial.scene || initial.scene.world === world,
          loadedState, sameCanvas: document.querySelector('.world-viewport canvas') === canvas && (!canvas || canvas.isConnected),
          loadingSeen, canvasRemoved, disposed: initial.scene?.disposed ?? false, terrainAborted: initial.scene?.terrainLoad.signal.aborted ?? false,
          level: world.outcome.level, turn: world.turn, time: world.time, paused: world.paused,
          status: current.store.getCheckpointReadStatus(), hasCheckpoint: current.store.hasCheckpoint(), canvasPresent: !!canvas }
      },
      disconnect() { mutations.disconnect(); unsubscribe() },
    }
  })
}
function retained(value) {
  for (const key of ['sameStore', 'sameWorld', 'sameScene', 'sameSceneWorld', 'sameCanvas']) assert.equal(value[key], true, key)
  for (const key of ['loadingSeen', 'canvasRemoved', 'disposed', 'terrainAborted']) assert.equal(value[key], false, key)
}
const read = (page, observer) => page.evaluate(value => value.read(), observer)
async function tabTo(page, name) {
  for (let i = 0; i < 14; i++) {
    if (await page.getByRole('button', { name, exact: true }).evaluate(node => node === document.activeElement)) return i
    await page.keyboard.press('Tab')
  }
  throw Error(`Tab did not reach ${name}`)
}
async function startMission(page) {
  await openCampaignFromMainMenu(page)
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
  await bindGame(page)
  const desktop = page.getByRole('button', { name: /^Continue anyway/ })
  if (await desktop.isVisible()) await desktop.click()
  await page.waitForFunction(() => window.testStore.getWorld().flyby.flags & 1 || !window.testStore.getWorld().inputMask)
  const skip = page.getByRole('button', { name: /^Skip introduction/ })
  if (await page.evaluate(() => !!(window.testStore.getWorld().flyby.flags & 1))) await skip.click()
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
}
async function save(page, wait = true) {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save Game', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  if (wait) await page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
}
async function layout(page) {
  return page.getByRole('region', { name: 'Browser checkpoint recovery', exact: true }).evaluate(panel => {
    const rect = panel.getBoundingClientRect(), button = panel.querySelector('button'), p = panel.querySelector('p')
    const overlaps = [...document.querySelectorAll('nav[aria-label="Main menu choices"] button')].filter(node => {
      const other = node.getBoundingClientRect()
      return rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top
    }).map(node => node.getAttribute('aria-label'))
    return { bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right },
      viewport: { width: innerWidth, height: innerHeight }, overlaps, textOverflow: p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth,
      buttonText: button?.textContent.trim(), fontSize: getComputedStyle(p).fontSize }
  })
}

export default async function ({ browser, url, output }) {
  const result = { status: 'running', fixture: 'Public Save seeds a real IndexedDB checkpoint; labeled faults only at the storage boundary. No simulation state mutation.', episodes: [], errors: [], warnings: [], cleanup: [] }
  const contexts = [], observations = []
  const persist = () => writeFileSync(resolve(output, 'checkpoint-recovery.json'), JSON.stringify(result, null, 2) + '\n')
  async function create(name, storageState, fault) {
    const context = await browser.newContext({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 1, ...(storageState ? { storageState } : {}) })
    contexts.push({ name, context })
    await context.addInitScript(storageFixture, fault)
    const page = await context.newPage(); page.setDefaultTimeout(25000)
    page.on('pageerror', error => { result.errors.push({ episode: name, message: String(error) }); persist() })
    page.on('console', message => { if (message.type() === 'error') result.errors.push({ episode: name, message: message.text() }); if (message.type() === 'warning') result.warnings.push({ episode: name, message: message.text() }) })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    return { page, context }
  }
  async function capture(page) { const observer = await observe(page); observations.push({ page, observer }); return observer }
  const snapshot = page => page.evaluate(() => window.checkpointFixture.snapshot())
  const state = page => page.evaluate(() => structuredClone(window.checkpointFixture.state))
  try {
    const seed = await create('seed', null, null)
    await startMission(seed.page)
    await seed.page.waitForFunction(() => window.testStore.getWorld().turn >= 12)
    await seed.page.getByRole('button', { name: 'Pause game', exact: true }).click()
    await save(seed.page)
    result.seed = await snapshot(seed.page)
    assert.ok(result.seed.checkpoint.turn >= 12)
    const storageState = await seed.context.storageState({ indexedDB: true })
    await seed.context.close(); contexts.splice(contexts.findIndex(item => item.context === seed.context), 1)
    // Keep each context isolated. storageState contains only this synthetic session's public save.
    for (const fault of ['open', 'abort']) {
      const name = `${fault}-recovery`, { page, context } = await create(name, storageState, fault)
      const observer = await capture(page), initial = await read(page, observer), before = await snapshot(page)
      const retry = page.getByRole('button', { name: 'Retry checkpoint lookup', exact: true })
      const load = page.getByRole('button', { name: 'Load Game', exact: true })
      assert.equal(await load.getAttribute('title'), 'Saved checkpoint could not be read')
      assert.equal(await load.getAttribute('aria-disabled'), 'true')
      const small = await layout(page); assert.deepEqual(small.overlaps, []); assert.equal(small.textOverflow, false)
      assert.ok(small.bounds.x >= 0 && small.bounds.bottom <= 480 && small.bounds.right <= 640)
      await page.screenshot({ path: resolve(output, `${name}-failure-640.png`) })
      await page.setViewportSize({ width: 1440, height: 900 })
      const wide = await layout(page); assert.deepEqual(wide.overlaps, []); assert.equal(wide.textOverflow, false)
      await page.screenshot({ path: resolve(output, `${name}-failure-wide.png`) })
      await page.setViewportSize({ width: 640, height: 480 })
      // Repeated failure via keyboard, followed by a held successful read.
      await page.evaluate(() => window.checkpointFixture.arm('abort'))
      const tabs = await tabTo(page, 'Retry checkpoint lookup')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => window.checkpointFixture.state.faults.length === 2)
      await page.getByText('Could not read browser storage. Your saved checkpoint may still be available.', { exact: true }).waitFor()
      assert.equal(await retry.isEnabled(), true)
      await page.evaluate(() => window.checkpointFixture.arm('hold'))
      await tabTo(page, 'Retry checkpoint lookup')
      await page.keyboard.press('Space')
      await page.waitForFunction(() => window.checkpointFixture.state.held)
      assert.equal(await retry.isDisabled(), true)
      const pendingState = await state(page)
      // Repeated real pointer/keyboard attempts on the disabled control must not add reads.
      const bounds = await retry.boundingBox()
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, { clickCount: 2 })
      await page.keyboard.press('Enter'); await page.keyboard.press('Space')
      assert.equal((await state(page)).reads, pendingState.reads)
      retained(await read(page, observer))
      await page.evaluate(() => window.checkpointFixture.release())
      await page.waitForFunction(() => document.querySelector('button[aria-label="Load Game"]')?.getAttribute('aria-disabled') === 'false')
      await retry.waitFor({ state: 'hidden' })
      const recovered = await read(page, observer); retained(recovered)
      assert.deepEqual([recovered.level, recovered.turn, recovered.time], [initial.level, initial.turn, initial.time], 'lookup leaves the captured world clock unchanged')
      assert.deepEqual(await snapshot(page), before)
      assert.deepEqual((await state(page)).writes, [])
      const focusAfterRemoval = await page.evaluate(() => ({ tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label') }))
      const loadTabs = await tabTo(page, 'Load Game')
      await page.screenshot({ path: resolve(output, `${name}-recovered.png`) })
      await page.keyboard.press('Enter')
      await bindGame(page)
      const loaded = await page.evaluate(() => ({ level: window.testStore.getWorld().outcome.level, turn: window.testStore.getWorld().turn, paused: window.testStore.getWorld().paused }))
      assert.equal(loaded.level, result.seed.checkpoint.level)
      assert.ok(loaded.turn >= result.seed.checkpoint.turn)
      assert.equal((await read(page, observer)).sameWorld, false, 'only deliberate Load replaces the startup world')
      assert.deepEqual((await read(page, observer)).loadedState, before.checkpoint, 'actual Load publication exactly matches saved clock, RNG, units and pause policy before the running-world update')
      result.episodes.push({ name, tabs, loadTabs, small, wide, focusAfterRemoval, initial, before, recovered, loaded, fixture: await state(page) }); persist()
      await observer.evaluate(value => value.disconnect()); observations.splice(observations.findIndex(item => item.observer === observer), 1)
      await context.close(); contexts.splice(contexts.findIndex(item => item.context === context), 1)
    }
    const empty = await create('empty', null, null)
    assert.equal(await empty.page.getByRole('button', { name: 'Load Game', exact: true }).getAttribute('title'), 'No usable saved checkpoint')
    assert.equal(await empty.page.getByRole('button', { name: 'Retry checkpoint lookup', exact: true }).count(), 0)
    const emptySnapshot = await snapshot(empty.page)
    assert.deepEqual(emptySnapshot.keys, [])
    assert.deepEqual((await state(empty.page)).writes, [])
    await empty.page.getByRole('button', { name: 'Load Game', exact: true }).focus()
    await empty.page.screenshot({ path: resolve(output, 'empty-confirmed.png') })
    result.episodes.push({ name: 'empty', storage: emptySnapshot, fixture: await state(empty.page) }); persist()

    const late = await create('navigate-during-retry', storageState, 'open')
    await late.page.evaluate(() => window.checkpointFixture.arm('hold'))
    await late.page.getByRole('button', { name: 'Retry checkpoint lookup', exact: true }).click()
    await late.page.waitForFunction(() => window.checkpointFixture.state.held)
    await startMission(late.page)
    await late.page.waitForFunction(turn => window.testStore.getWorld().turn > turn + 5, result.seed.checkpoint.turn)
    await late.page.getByRole('button', { name: 'Pause game', exact: true }).click()
    const live = await capture(late.page), frozen = await read(late.page, live)
    await save(late.page, false)
    await late.page.waitForFunction(() => window.testStore.hasCheckpoint())
    const writesBeforeRelease = (await state(late.page)).writes.length
    assert.equal(writesBeforeRelease, 1, 'one deliberate public Save enqueues the newer checkpoint')
    await late.page.evaluate(() => window.checkpointFixture.release())
    await late.page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
    const after = await read(late.page, live); retained(after)
    assert.deepEqual([after.level, after.turn, after.time, after.paused], [frozen.level, frozen.turn, frozen.time, true])
    assert.equal((await state(late.page)).writes.length, 1, 'restore adds no persistence writes')
    const newerSaved = await snapshot(late.page)
    assert.equal(newerSaved.checkpoint.turn, frozen.turn)
    await late.page.screenshot({ path: resolve(output, 'retry-after-navigation-retained.png') })
    await late.page.getByRole('button', { name: 'Back', exact: true }).click()
    await late.page.getByRole('button', { name: 'Load Game', exact: true }).click()
    await late.page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
    await bindGame(late.page)
    assert.equal((await read(late.page, live)).sameWorld, false)
    assert.deepEqual((await read(late.page, live)).loadedState, newerSaved.checkpoint, 'Load restores the newer memory save, not the earlier disk snapshot or a restarted world')
    const loadedNewer = await late.page.evaluate(() => ({ turn: window.testStore.getWorld().turn, level: window.testStore.getWorld().outcome.level }))
    assert.ok(loadedNewer.turn >= frozen.turn)
    result.episodes.push({ name: 'navigate-during-retry', frozen, after, newerSaved, loadedNewer, fixture: await state(late.page) }); persist()
    for (const episode of result.episodes) assert.equal(episode.fixture.holdExpired, false)
    assert.deepEqual(result.errors, [])
    result.status = 'passed'
  } catch (error) {
    result.status = 'failed'; result.failure = { message: String(error), stack: error.stack }
    for (const { name, context } of contexts) for (const page of context.pages()) {
      try { await page.screenshot({ path: resolve(output, `failure-${name}.png`), timeout: 5000 }) } catch { /* Preserve the primary failure. */ }
    }
    throw error
  } finally {
    for (const { observer } of observations) try { await observer.evaluate(value => value.disconnect()) } catch (error) { result.cleanup.push({ phase: 'observer', error: String(error) }) }
    for (const { name, context } of contexts) try { await context.close(); result.cleanup.push({ name, closed: true }) } catch (error) { result.cleanup.push({ name, closed: false, error: String(error) }); result.status = 'failed' }
    if (result.errors.length) result.status = 'failed'
    persist()
  }
  assert.deepEqual(result.errors, [], 'including runtime errors delivered during final context cleanup')
  assert.equal(result.status, 'passed')
  return result
}

export { storageFixture, startMission, save, observe, read }
