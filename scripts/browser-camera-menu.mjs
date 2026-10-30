import assert from 'node:assert/strict'

// Keep native menu ownership separate from the camera's deterministic frame driver.
export async function zoomOutAfterPauseMenu(page, state, advance) {
  const before = await state()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const menu = page.locator('dialog[data-original-pause-menu]')
  await menu.waitFor({ state: 'visible' })
  assert.equal(await page.getByRole('button', { name: 'Zoom out', exact: true }).count(), 0)
  assert.deepEqual(await state(), before, 'Opening the native menu does not change the view')
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click()
  await menu.waitFor({ state: 'hidden' })
  await page.waitForFunction(() => window.testScene.world.paused)
  await page.locator('.world-viewport').press('-')
  const requested = await state()
  assert.equal(requested.preset, 0)
  assert.equal(requested.remaining, 18)
  assert.deepEqual(requested.config, before.config, 'Keyboard zoom preserves the image before advancing')
  await advance()
  assert.equal((await state()).preset, 0)
  assert.equal((await state()).remaining, 0)
}
