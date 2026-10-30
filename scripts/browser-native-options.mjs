import assert from 'node:assert/strict'
import { expect } from '@playwright/test'

const hudSizes = ['auto', '1', '1.5', '2', '2.5', '3', '4']

// Use only the shipped row's ordinary clicks. Observe its displayed value and
// await each actual change; never write storage, invoke handlers or mutate React.
export async function chooseHudSize(scope, value) {
  assert.ok(hudSizes.includes(value), `Unsupported HUD size: ${value}`)
  const row = scope.getByRole('button', { name: /^HUD size : </ })
  let current = await row.getAttribute('data-hud-size')
  assert.ok(hudSizes.includes(current), `Unknown displayed HUD size: ${current}`)
  for (let changed = 0; current !== value && changed < hudSizes.length; changed++) {
    const next = hudSizes[(hudSizes.indexOf(current) + 1) % hudSizes.length]
    await row.click()
    await expect(row).toHaveAttribute('data-hud-size', next)
    current = next
  }
  assert.equal(current, value, 'HUD row reaches the requested preference')
}

export async function changeHudSize(page, value) {
  const click = name => page.getByRole('button', { name, exact: true }).click()
  await click('Menu')
  await click('Options')
  await click('Browser compatibility and help')
  await chooseHudSize(page, value)
  await click('Back to Options')
  await click('Back')
  await click('Continue Game')
  await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
}
