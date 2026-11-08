// Use the actual first-time recommendation UI when a scenario needs campaign
// setup. Never preseed its browser-local flag or bypass selector readiness.
export async function continueNewGameRecommendation(page) {
  const recommendation = page.locator('[data-original-tutorial-recommendation]')
  const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
  await recommendation.or(selector).first().waitFor({ state: 'visible' })
  if (await recommendation.isVisible()) {
    await recommendation.getByRole('button', { name: 'No', exact: true }).click()
  }
  await selector.waitFor({ state: 'visible' })
}

export async function openCampaignFromMainMenu(page) {
  await waitForStartupMenu(page)
  await page.getByRole('dialog', { name: 'Main menu', exact: true })
    .getByRole('button', { name: 'New Game', exact: true }).click()
  await continueNewGameRecommendation(page)
}

// Scenarios testing gameplay/storage use the visible public Skip control. Logo
// playback acceptance deliberately does not call this helper.
export async function waitForStartupMenu(page, { allowSelector = false } = {}) {
  const menu = page.getByRole('dialog', {
    name: allowSelector ? /^(Main menu|Start game)$/ : 'Main menu',
    exact: true,
  })
  const logo = page.getByRole('dialog', { name: 'Opening logo', exact: true })
  await menu.or(logo).filter({ visible: true }).first().waitFor({ state: 'visible' })
  if (await logo.isVisible()) {
    try {
      await logo.getByRole('button', { name: 'Skip logo', exact: true })
        .click({ timeout: 2500, noWaitAfter: true })
    } catch (error) {
      // Natural completion can remove the control between observation and click.
      // Only accept that race after observing the actual destination.
      if (error.name !== 'TimeoutError' || await logo.isVisible() || !await menu.isVisible())
        throw error
    }
  }
  await menu.waitFor({ state: 'visible' })
}
