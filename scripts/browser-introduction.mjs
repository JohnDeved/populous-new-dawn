// Observe the presentation state, then use the same Space key as the player.
// Do not expose a test-only game control or call the scene controller directly.
export function introductionInputState(snapshot = false) {
  const world = window.testStore?.getWorld() ?? window.testSceneRef?.current?.world ?? window.testScene?.world
  let action = false
  if (world && !document.querySelector('.loading-world')) {
    // Authored flybys can start after an initially unlocked frame. Do not
    // mistake an in-progress new-game appearance sequence for a finished intro.
    // A paused restored world cannot advance that sequence until its caller resumes.
    if (!world.inputMask)
      action = !world.paused && world.levelStart?.some(site => site.phase !== 4) ? false : 'ready'
    // Active and interruptible, but not already interrupted/completing.
    else if ((world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11) action = 'skip'
  }
  return snapshot ? { action, paused: world?.paused ?? null } : action
}

export async function skipIntroductionWithSpace(page, { timeout = 30000 } = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid introduction timeout')
  const deadline = performance.now() + timeout
  const timedOut = new Error('Introduction readiness timed out')
  let expired = false, failed = false, failure, timer
  const remaining = () => {
    const budget = deadline - performance.now()
    if (expired || budget <= 0) throw timedOut
    return budget
  }
  const run = async () => {
    for (;;) {
      const state = await page.waitForFunction(introductionInputState, undefined, { timeout: remaining() })
      let action, readFailed = false
      try { remaining(); action = await state.jsonValue() }
      catch (error) { readFailed = failed = true; failure = error; throw error }
      finally {
        try { await state.dispose() }
        catch (error) { if (!readFailed) throw error }
      }
      remaining()
      if (action !== 'skip') return action
      // The presentation may finish during the handle round-trip. Never turn that
      // stale observation into a fresh Space pause/resume command.
      const before = await page.evaluate(introductionInputState, true)
      remaining()
      if (before.action === 'ready') return 'ready'
      if (before.action !== 'skip') continue
      await pressIntroductionSpace(page, { timeout: remaining() })
      remaining()
      const after = await page.evaluate(introductionInputState, true)
      remaining()
      // Observation and real keyboard delivery are not atomic. Fail the owning
      // episode if Space raced completion; do not guess a compensating pause toggle.
      if (after.paused !== before.paused) throw new Error('Introduction Space changed pause state; retry the episode')
      return 'skip'
    }
  }
  try {
    return await Promise.race([
      run(),
      new Promise((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(failed ? failure : timedOut) }, remaining())
      }),
    ])
  } finally { clearTimeout(timer) }
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
