import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// The accepted tree witness's single-shot public entry. Observation must already
// be installed: neither bindGame nor Shaman readiness recovers earlier history.
export async function enterHutMission({ page, root, remaining, action }) {
  const { showAllMissions, bindGame, waitForShamanReadiness } = await import(
    pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  await action('All missions', () => showAllMissions(page))
  await action('Mission 1', () => page.getByRole('button', { name: 'Mission 1', exact: true }).click({ noWaitAfter: true, timeout: remaining() }))
  await bindGame(page)
  const skip = page.getByRole('button', { name: /^Skip introduction/ })
  if (await skip.isVisible()) await action('Skip introduction', () => skip.click({ noWaitAfter: true, timeout: remaining() }))
  return waitForShamanReadiness(page, { timeout: remaining() })
}

// Closing this compatibility dialog does not itself resume the game. Match the
// actual arrow-bearing accessible name; never reuse exact "Continue Game".
export async function closeHutMenu({ page, remaining, action }) {
  const menu = page.locator('dialog.game-dialog')
  await action('Continue Game', () => menu.getByRole('button', { name: /^Continue Game(?:\s|$)/ }).click({ timeout: remaining() }))
  await menu.waitFor({ state: 'hidden', timeout: remaining() })
  if (await page.evaluate(() => window.testStore.getWorld().paused))
    await action('Resume game', () => page.getByRole('button', { name: 'Resume game', exact: true }).click({ timeout: remaining() }))
  await page.waitForFunction(() => !window.testStore.getWorld().paused, null, { timeout: remaining() })
}

export function assertHutAdmission(state) {
  assert.equal(state.level, 1); assert.equal(state.status, 'playing')
  assert.equal(state.speed, 1); assert.equal(state.paused, false)
  assert.equal(state.inputMask, 0); assert.equal(state.mode, null)
  assert.deepEqual(state.selected, [])
  for (const name of ['overview', 'overviewStage', 'drag', 'flying', 'camera', 'transition', 'dialog'])
    assert.ok(!state[name], `Ordinary Hut admission: ${name}`)
}

// Reuses the resident witness's trusted-click/subscription boundary. Save is
// captured at the synchronous publication after saveCheckpoint rebuilt its
// derived state and cloned the actual checkpoint, not before that mutation.
// checkpointObservation hashes this typed clone; no live World is exported.
export function installHutCheckpointBoundary({ kind }) {
  if (!['save', 'load'].includes(kind)) throw Error('Unknown checkpoint boundary')
  const store = window.testStore, previous = store.getWorld()
  const observationName = 'hutTooltipCheckpointBoundary'
  if (Object.hasOwn(window, observationName)) throw Error('Checkpoint observation already owned')
  const label = kind === 'save' ? 'Save checkpoint' : 'Load checkpoint'
  const menu = document.querySelector('dialog.game-dialog[open]')
  const button = [...(menu?.querySelectorAll('button') ?? [])].find(b => b.textContent.trim() === label)
  if (!button?.isConnected || button.disabled || !previous.paused) throw Error('Paused public checkpoint control unavailable')
  let record = null, admitted = false, closed = false, unsubscribe = () => {}
  const errors = [], fail = e => { if (errors.length < 8) errors.push(String(e?.stack ?? e)) }
  window[observationName] = record
  const click = event => {
    try {
      if (admitted || !event.isTrusted || store.getWorld() !== previous ||
        (event.target !== button && !button.contains(event.target))) throw Error('One trusted checkpoint click required')
      admitted = true
    } catch (error) { fail(error) }
  }
  try {
    button.addEventListener('click', click, true)
    unsubscribe = store.subscribe(() => {
      if (closed || record || !admitted || errors.length) return
      const world = store.getWorld()
      if (kind === 'load' && world === previous) return
      try {
        if (window[observationName] !== record || (kind === 'save' && world !== previous))
          throw Error('Checkpoint observation ownership changed')
        record = { version: 1, world: structuredClone(world) }
        window[observationName] = record
      } catch (error) { fail(error) }
    })
  } catch (error) {
    button.removeEventListener('click', click, true)
    if (window[observationName] === record) delete window[observationName]
    throw error
  }
  const read = () => ({ kind, observationName, admitted, captured: !!record, errors: [...errors], closed,
    reservations: record ? structuredClone(record.world.secondaryEffects?.reservations ?? []) : null })
  return { read, close() {
    if (!closed) {
      closed = true
      try { button.removeEventListener('click', click, true) } catch (error) { fail(error) }
      try { unsubscribe() } catch (error) { fail(error) }
      if (window[observationName] === record) delete window[observationName]
      else fail('Foreign checkpoint observation preserved')
    }
    return read()
  } }
}

export function assertHutCheckpointRestore(saved, loaded) {
  assert.equal(saved?.version, 1); assert.equal(loaded?.version, 1)
  for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.deepEqual(loaded[key], saved[key], `Public Load boundary ${key}`)
  // The full typed digest is retained for review. Existing migration and
  // presentation reservation rebuilding may change the whole-record digest.
}

export function assertHutInspectionLifecycle(status) {
  const events = status.phaseInspections
  const activation = events.findIndex(event => event === 'explicit:created' || event === 'explicit:reused')
  const release = events.indexOf('release')
  assert.ok(activation >= 0 && release > activation, 'Actual explicit acquisition must precede its consumed release')
  assert.ok(!events.some(event => event === 'cancel-stale' || event.startsWith('explicit:rejected')))
  const state = status.epochs.at(-1).state
  assert.equal(state.heldPointer, null, 'Consumed release clears the actual Hut held-pointer owner')
  assert.deepEqual(state.pendingInputs, [], 'Actual explicit input queue is drained before departure')
}

// Existing DOM control only. No focus(), click(), picker, or state mutation.
export function readHutPanelControl(hutId) {
  const scene = window.testSceneRef.current, panel = scene.buildingPanels.get(hutId)
  const button = panel?.querySelector('.dismantle-control')
  if (!panel?.isConnected || panel.hidden || !button?.isConnected || button.hidden || button.disabled)
    throw Error('Visible same-Hut panel control unavailable')
  const rect = button.getBoundingClientRect(), x = Math.round(rect.x + rect.width / 2), y = Math.round(rect.y + rect.height / 2)
  const receiver = document.elementFromPoint(x, y)
  if (!(rect.width > 0 && rect.height > 0) || !(receiver === button || button.contains(receiver)))
    throw Error('Same-Hut panel control does not own its point')
  return { hutId, x, y, label: button.getAttribute('aria-label'), panelLabel: panel.getAttribute('aria-label') }
}

// Install after readiness, so the actual page keyboard handler is already
// registered. Both snapshots belong to the same physical key dispatch.
export function installHutSelectionClear() {
  const scene = window.testSceneRef.current, world = scene.world
  if (world.mode !== null || world.inputMask || world.paused || world.outcome.level !== 1 ||
    document.activeElement?.closest('input,dialog')) throw Error('Ordinary Escape prerequisites missing')
  const snapshot = () => structuredClone({ selected: world.selected, mode: world.mode, orderCursor: world.orderCursor,
    turn: world.turn, lastOrderTurn: world.lastOrderTurn, randomState: world.randomState, orders: world.buildingOrders })
  let eventRecord = null, closed = false
  const before = event => {
    if (event.key === 'Escape') eventRecord = { trusted: event.isTrusted, key: event.key,
      modifiers: [event.ctrlKey, event.shiftKey, event.altKey, event.metaKey], before: snapshot() }
  }
  const after = event => {
    if (event.key === 'Escape' && eventRecord) eventRecord.after = snapshot()
  }
  window.addEventListener('keydown', before, true); window.addEventListener('keydown', after)
  return { close() {
    if (!closed) { closed = true; window.removeEventListener('keydown', before, true); window.removeEventListener('keydown', after) }
    return { event: eventRecord, closed, errors: [] }
  } }
}

// Persist every cleanup result and preserve primitive original exceptions.
export async function finishHutHandles(handles, report, save, primary) {
  let { failed, failure } = primary
  const fail = error => {
    report.status = 'failed'
    ;(report.cleanupErrors ??= []).push(String(error?.stack ?? error))
    if (!failed) { failed = true; failure = error }
  }
  for (const [label, handle] of handles) if (handle) {
    try {
      report[label] = await handle.evaluate(api => api.close())
      assert.equal(report[label].closed, true); assert.deepEqual(report[label].errors, [])
    } catch (error) { fail(error) }
    finally { try { await handle.dispose() } catch (error) { fail(error) } }
  }
  try { save() } catch (error) { fail(error) }
  if (failed) throw failure
}
