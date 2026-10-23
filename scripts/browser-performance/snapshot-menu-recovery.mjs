import assert from 'node:assert/strict'

const entries = [
  { name: 'Game settings', selectors: [
    'aside.native-hud[aria-label="Tribe controls"] .top-actions > button[aria-label="Game settings"][title="Game settings"]:not([aria-description])',
  ] },
  { name: 'Menu', selectors: [
    'aside.native-hud[aria-label="Tribe controls"] .shaman-controls > button.help-button[aria-label="Menu"][title="Help and game menu"]:not([aria-description])',
    'aside.native-hud[aria-label="Tribe controls"] .shaman-controls > button.help-button[aria-label="Menu"][aria-description="Help and game menu"]:not([title])',
  ] },
]
const visibleDialogs = 'dialog:visible, [role="dialog"]:visible'
const nativeDialog = 'dialog[data-original-pause-menu]'
const stableFields = ['level', 'turn', 'time', 'pendingTime', 'randomState', 'paused', 'inputMask',
  'flybyActive', 'sameScene', 'sceneConnected', 'latchRemoved', 'visibility', 'selected', 'mode',
  'simulationSha256', 'unitsSha256', 'terrainSha256', 'geometrySha256', 'camera', 'viewport', 'timeOriginUnixMs']

// Retain references only in a disposable Playwright handle, never on the app or
// its World. The ordinary public controls remain the sole writers of game state.
export function captureMenuIdentity() {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { scene, world, canvas: scene.renderer.domElement, speed: world.speed }
}
export function observeMenuIdentity(original) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { sameScene: scene === original.scene && scene === window.testScene,
    sameWorld: world === original.world && scene.world === world,
    sameCanvas: scene.renderer.domElement === original.canvas, connected: original.canvas.isConnected,
    speed: world.speed, originalSpeed: original.speed }
}
function assertIdentity(identity) {
  for (const key of ['sameScene', 'sameWorld', 'sameCanvas', 'connected']) assert.equal(identity[key], true, key)
  assert.ok(Number.isFinite(identity.speed) && identity.speed > 0, 'Missing game speed')
  assert.equal(identity.speed, identity.originalSpeed, 'Menu changed game speed')
}
function assertRestoredState(state, before, modalSuspended) {
  assert.equal(state.modalSuspended, modalSuspended, 'Unexpected menu input suspension')
  for (const key of stableFields) assert.deepEqual(state[key], before[key], `Menu changed ${key}`)
}
async function assertNoDialog(page) {
  assert.equal(await page.locator(visibleDialogs).count(), 0, 'Unexpected visible dialog')
  assert.equal(await page.locator('dialog[open]').count(), 0, 'Unexpected open dialog')
  assert.equal(await page.getByRole('dialog').count(), 0, 'Unexpected accessible dialog')
}

export async function resolvePublicMenuEntry(page) {
  const present = []
  for (const { name, selectors } of entries) {
    // The old shipped UI has both named controls, the new UI only Menu. Count
    // hidden controls too: a stale/disabled old control must not trigger fallback.
    const all = page.getByRole('button', { name, exact: true, includeHidden: true })
    const count = await all.count()
    assert.ok(count <= 1, `Duplicate public menu entry: ${name}`)
    if (!count) continue
    const button = page.getByRole('button', { name, exact: true })
    assert.equal(await button.count(), 1, 'Public menu entry is not accessibility-exposed')
    assert.equal(await button.isVisible(), true, 'Public menu entry is hidden')
    assert.equal(await button.isEnabled(), true, 'Public menu entry is disabled')
    const matching = await button.evaluate((element, selectors) => selectors.filter(selector => element.matches(selector)), selectors)
    assert.equal(matching.length, 1, `Undeclared public menu control shape: ${name}`)
    present.push({ name, selector: matching[0], button })
  }
  assert.ok(present.some(entry => entry.name === 'Menu'), 'Expected the shipped native Menu control')
  // Preserve the historical route on the declared dual-control shape. This is a
  // pre-click shape decision, never a retry after an old-route action fails.
  const described = present.some(entry => entry.selector.includes('[aria-description="'))
  assert.ok(!described || present.length === 1, 'Undeclared mixed public menu control shape')
  const chosen = present[0], shape = present.length === 2 ? 'legacy-dual-entry'
    : described ? 'native-menu-description-only' : 'native-menu-only'
  return { button: chosen.button, route: { role: 'button', name: chosen.name, exact: true, shape,
    controls: present.map(({ name, selector }) => ({ name, selector })) } }
}

// Unmeasured preparation only. No fallback click, synthetic dispatch, forced
// action, pause mutation, retry, recorder reset or changed callback window.
export async function recoverSnapshotMenu({ page, record, observe, assertAdmission, save }) {
  const identity = await page.evaluateHandle(captureMenuIdentity)
  let dialog, failure
  try {
    const before = await observe(), beforeIdentity = await identity.evaluate(observeMenuIdentity)
    assertAdmission(before); assertIdentity(beforeIdentity)
    await assertNoDialog(page)
    const { button, route } = await resolvePublicMenuEntry(page)
    const opening = { action: 'open-public-settings', measured: false, route, before, identity: beforeIdentity,
      clickAttempted: true }
    record.preparation.push(opening); save()
    await button.click()
    const menu = page.locator(nativeDialog)
    await menu.waitFor({ state: 'visible' })
    assert.equal(await menu.count(), 1, 'Expected exactly one native pause dialog')
    assert.equal(await page.locator(visibleDialogs).count(), 1, 'Unexpected additional visible dialog')
    assert.equal(await page.getByRole('dialog').count(), 1, 'Unexpected additional accessible dialog')
    assert.equal(await page.getByRole('dialog', { name: 'Game menu', exact: true }).count(), 1,
      'Expected accessible Game menu dialog')
    dialog = await menu.elementHandle()
    opening.dialog = await dialog.evaluate(element => ({ name: element.getAttribute('aria-label'),
      panel: element.getAttribute('data-panel'), open: element.open, modal: element.matches(':modal') }))
    assert.deepEqual(opening.dialog, { name: 'Game menu', panel: 'root', open: true, modal: true },
      'Expected exact native Game menu root')
    const resume = menu.getByRole('button', { name: 'Continue Game', exact: true })
    assert.equal(await resume.count(), 1, 'Expected root Continue Game control')
    assert.equal(await resume.isVisible(), true); assert.equal(await resume.isEnabled(), true)
    record.menu = await observe(); opening.openIdentity = await identity.evaluate(observeMenuIdentity); save()
    assertIdentity(opening.openIdentity); assertRestoredState(record.menu, before, true)
    const closing = { action: 'close-public-settings', measured: false, route, escapeAttempted: true }
    record.preparation.push(closing); save()
    await page.keyboard.press('Escape')
    // Both the original node and the public locator must be hidden. A replacement
    // dialog, subpanel Back, or popup-owned Escape cannot count as recovery.
    await dialog.waitForElementState('hidden')
    await menu.waitFor({ state: 'hidden' })
    await assertNoDialog(page)
    closing.dialogHidden = true
    closing.after = await observe(); closing.identity = await identity.evaluate(observeMenuIdentity); save()
    assertIdentity(closing.identity); assertRestoredState(closing.after, before, false)
    assertAdmission(closing.after) // Preserve original paused-scene/input readiness.
  } catch (error) {
    failure = error
    // capture's outer receipt serializes String(error), not AggregateError.errors.
    // Preserve the primary failure independently before cleanup can also fail.
    record.menuRecoveryFailure = String(error)
  }
  const cleanupErrors = []
  for (const handle of [dialog, identity]) {
    try { await handle?.dispose() } catch (error) { cleanupErrors.push(error) }
  }
  if (cleanupErrors.length) {
    record.menuRecoveryCleanupFailures = cleanupErrors.map(error => String(error))
    try { save() } catch (error) { cleanupErrors.push(error) }
    throw new AggregateError(failure ? [failure, ...cleanupErrors] : cleanupErrors,
      failure ? 'Menu recovery failed; handle cleanup also failed' : 'Menu recovery handle cleanup failed')
  }
  if (failure) throw failure
}
