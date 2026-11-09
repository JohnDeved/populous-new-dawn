import assert from 'node:assert/strict'

// Public setup only: close the exact observed campaign details, never dismiss
// messages or alter their World data. The caller owns its existing outer budget.
export async function collapseObservedCampaignMessages(page, {
  remainingMs = () => 25000, observe = () => {},
} = {}) {
  const deadlineAt = Date.now() + Math.min(25000, remainingMs())
  const remaining = () => {
    const left = Math.min(deadlineAt - Date.now(), remainingMs())
    assert.ok(left > 0, 'Campaign keyboard-owner setup deadline exceeded')
    return left
  }
  remaining() // An already-expired budget must not acquire or operate any owner.
  const owner = await page.evaluateHandle(() => window.testStore.getWorld())
  const handles = [owner]
  let failed = false, failure
  const fail = error => { if (!failed) { failed = true; failure = error } }
  const assertOwner = async () => assert.equal(await owner.evaluate(world =>
    window.testStore.getWorld() === world && window.testSceneRef.current.world === world &&
    world.paused && world.status === 'playing'), true,
  'Keyboard setup must retain the exact paused World')
  const diagnostic = async phase => observe({ phase, ...await page.evaluate(() => ({
    openMessageSerials: [...document.querySelectorAll('.campaign-messages details[open]')]
      .map(element => element.getAttribute('data-message-serial')),
    focus: { tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute('aria-label') ?? null },
    selected: [...window.testStore.getWorld().selected],
    paused: window.testStore.getWorld().paused, turn: window.testStore.getWorld().turn,
  })) })
  try {
    remaining()
    await assertOwner()
    await diagnostic('before-public-collapse')
    const messages = await page.locator('.campaign-messages details[open]').elementHandles()
    handles.push(...messages)
    assert.ok(messages.length <= 32, 'Observed campaign messages exceed native slot capacity')
    const serials = await Promise.all(messages.map(message => message.getAttribute('data-message-serial')))
    assert.ok(new Set(serials).size === serials.length && serials.every(serial => /^\d+$/.test(serial)),
      'Observed message serials must be valid and unique')
    for (const [index, message] of messages.entries()) {
      remaining()
      await assertOwner()
      const serial = serials[index]
      assert.equal(await message.evaluate((element, serial) => {
        const matches = document.querySelectorAll(`.campaign-messages details[data-message-serial="${serial}"]`)
        return matches.length === 1 && matches[0] === element && element.isConnected && element.open
      }, serial), true, 'Exact observed campaign message must remain open and connected')
      const summary = await message.$(':scope > summary[aria-label="Read campaign message"]')
      assert.ok(summary, 'Exact observed message must retain its public summary')
      handles.push(summary)
      await summary.click({ timeout: remaining() })
      await assertOwner()
      assert.equal(await message.evaluate((element, serial) => {
        const matches = document.querySelectorAll(`.campaign-messages details[data-message-serial="${serial}"]`)
        return matches.length === 1 && matches[0] === element && element.isConnected && !element.open
      }, serial), true, 'Public collapse must retain and close the exact observed message')
    }
    assert.equal(await page.locator('.campaign-messages details[open]').count(), 0)
    await assertOwner()
    await diagnostic('after-public-collapse')
  } catch (error) {
    fail(error)
    try { await diagnostic('public-collapse-failed') } catch { /* Preserve primary failure. */ }
  } finally {
    for (const handle of handles.reverse()) {
      try { await handle.dispose() } catch (error) { fail(error) }
    }
  }
  if (failed) throw failure
}
