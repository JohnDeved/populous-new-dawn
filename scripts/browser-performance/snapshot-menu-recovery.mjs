import assert from 'node:assert/strict'

const entryNames = ['Game settings', 'Menu']
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
  const entries = []
  for (const name of entryNames) {
    // Count hidden alternatives too: a duplicate or an obsolete hidden route is
    // not permission to choose whichever happens to work on this comparison arm.
    const all = page.getByRole('button', { name, exact: true, includeHidden: true })
    const count = await all.count()
    assert.ok(count <= 1, `Duplicate public menu entry: ${name}`)
    if (count) entries.push(name)
  }
  assert.equal(entries.length, 1, 'Expected exactly one public menu entry across Game settings and Menu')
  const name = entries[0], button = page.getByRole('button', { name, exact: true })
  assert.equal(await button.count(), 1, 'Public menu entry is not accessibility-exposed')
  assert.equal(await button.isVisible(), true, 'Public menu entry is hidden')
  assert.equal(await button.isEnabled(), true, 'Public menu entry is disabled')
  return { button, route: { role: 'button', name, exact: true } }
}

// Unmeasured preparation only. No fallback click, synthetic dispatch, forced
// action, pause mutation, retry, recorder reset or changed callback window.
export async function recoverSnapshotMenu({ page, record, observe, assertAdmission, save }) {
  const identity = await page.evaluateHandle(captureMenuIdentity)
  let dialog
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
  } finally {
    try { await dialog?.dispose() } finally { await identity.dispose() }
  }
}
