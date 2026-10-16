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
  await page.getByRole('dialog', { name: 'Main menu', exact: true })
    .getByRole('button', { name: 'New Game', exact: true }).click()
  await continueNewGameRecommendation(page)
}
