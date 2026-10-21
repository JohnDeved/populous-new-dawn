// Observe the presentation state, then use the same Space key as the player.
// Do not expose a test-only game control or call the scene controller directly.
export function introductionInputState() {
  const world = window.testStore?.getWorld() ?? window.testSceneRef?.current?.world ?? window.testScene?.world
  if (!world || document.querySelector('.loading-world')) return false
  // Authored flybys can start after an initially unlocked frame. Do not
  // mistake an in-progress new-game appearance sequence for a finished intro.
  // A paused restored world cannot advance that sequence until its caller resumes.
  if (!world.inputMask)
    return !world.paused && world.levelStart?.some(site => site.phase !== 4) ? false : 'ready'
  // Active and interruptible, but not already interrupted/completing.
  return (world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11 ? 'skip' : false
}

export async function skipIntroductionWithSpace(page, { timeout = 30000 } = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid introduction timeout')
  const deadline = performance.now() + timeout
  const remaining = () => {
    const budget = deadline - performance.now()
    if (budget <= 0) throw new Error('Introduction readiness timed out')
    return budget
  }
  const state = await page.waitForFunction(introductionInputState, undefined, { timeout })
  let action, failed = false
  try { action = await state.jsonValue() }
  catch (error) { failed = true; throw error }
  finally {
    try { await state.dispose() }
    catch (error) { if (!failed) throw error }
  }
  const budget = remaining()
  if (action === 'skip') await pressIntroductionSpace(page, { timeout: budget })
  remaining()
  return action
}

// Keyboard.press has no Playwright action timeout. Keep callers' original
// episode deadline authoritative even if browser delivery stalls.
export async function pressIntroductionSpace(page, { timeout = 2500 } = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid Space input timeout')
  let timer
  try {
    await Promise.race([
      page.keyboard.press('Space'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Introduction Space input timed out')), timeout)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
