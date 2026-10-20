// The supplied training fixture advances simulation, not the presentation-owned
// introduction. Public Load resumes it; only the shipped Skip control may end it.
export const spySourceReadinessMs = 8000

export function readSpySourceReadiness(mode = 'snapshot') {
  const scene = window.testSceneRef?.current,
    world = window.testStore?.getWorld(),
    button = document.querySelector('button.skip-introduction'),
    skipVisible = !!button && button.getClientRects().length > 0 &&
      getComputedStyle(button).visibility !== 'hidden' && !button.disabled,
    snapshot = {
      sceneStoreMatch: !!scene && scene.world === world,
      canvasConnected: !!scene?.renderer?.domElement?.isConnected,
      loading: !!document.querySelector('.loading-world'),
      level: world?.outcome.level ?? null,
      turn: world?.turn ?? null,
      paused: world?.paused ?? null,
      inputMask: world?.inputMask ?? null,
      flybyFlags: world?.flyby.flags ?? null,
      flybyFrame: world?.flyby.frame ?? null,
      flybyWarmup: world?.flyby.warmup ?? null,
      skipVisible,
      action: 'wait',
    }
  if (snapshot.sceneStoreMatch && snapshot.canvasConnected && !snapshot.loading) {
    if (snapshot.inputMask === 0) snapshot.action = 'ready'
    // Active (1), interruptible (16), not already interrupted/completing (64).
    else if (snapshot.inputMask === 64 && (snapshot.flybyFlags & 0x51) === 0x11 && skipVisible)
      snapshot.action = 'skip'
  }
  return mode === 'snapshot' || snapshot.action === 'ready' ||
    (mode === 'actionable' && snapshot.action === 'skip') ? snapshot : false
}

export async function awaitSpySourceReadiness({ page, report, action, save, deadlineAt }) {
  if (!Number.isFinite(deadlineAt)) throw Error('Original Spy episode deadline required')
  const startedAt = Date.now(),
    deadline = Math.min(startedAt + spySourceReadinessMs, deadlineAt),
    remaining = () => {
      const ms = deadline - Date.now()
      if (ms <= 0) throw Error('Spy public Load readiness exhausted its original 8000ms budget')
      return ms
    },
    observation = report.readiness = { startedAt, deadlineAt: deadline, capMs: spySourceReadinessMs }
  const wait = async mode => {
    const result = await page.waitForFunction(readSpySourceReadiness, mode, { timeout: remaining() })
    try { return await result.jsonValue() } finally { await result.dispose() }
  }
  try {
    observation.before = await page.evaluate(readSpySourceReadiness)
    save()
    observation.actionable = await wait('actionable')
    save()
    if (observation.actionable.action === 'skip')
      await action('Public Skip introduction', () =>
        page.getByRole('button', { name: /^Skip introduction/ }).click({ timeout: remaining() }))
    observation.after = await wait('ready')
  } catch (error) {
    observation.failure = String(error)
    try { observation.failed = await page.evaluate(readSpySourceReadiness) }
    catch (diagnosticError) { observation.diagnosticFailure = String(diagnosticError) }
    throw error
  } finally {
    observation.endedAt = Date.now()
    save()
  }
}
