import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
// The supplied training fixture advances simulation, not the presentation-owned
// introduction. Public Load resumes it; only the native Space input may end it.
export const spySourceReadinessMs = 8000

export function readSpySourceReadiness(mode = 'snapshot') {
  const scene = window.testSceneRef?.current,
    world = window.testStore?.getWorld(),
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
      action: 'wait',
    }
  if (snapshot.sceneStoreMatch && snapshot.canvasConnected && !snapshot.loading) {
    if (snapshot.inputMask === 0) snapshot.action = 'ready'
    // Active (1), interruptible (16), not already interrupted/completing (64).
    else if (snapshot.inputMask === 64 && (snapshot.flybyFlags & 0x51) === 0x11)
      snapshot.action = 'skip'
  }
  return mode === 'snapshot' || snapshot.action === 'ready' ||
    (mode === 'actionable' && snapshot.action === 'skip') ? snapshot : false
}

export async function awaitSpySourceReadiness({ page, report, action, save, deadlineAt }) {
  if (!Number.isFinite(deadlineAt)) throw Error('Original Spy episode deadline required')
  const startedAt = Date.now(),
    deadline = Math.min(startedAt + spySourceReadinessMs, deadlineAt),
    timeout = Error('Spy public Load readiness exhausted its original 8000ms budget'),
    observation = report.readiness = { startedAt, deadlineAt: deadline, capMs: spySourceReadinessMs },
    disposals = new WeakMap()
  let expired = false, closed = false, primaryError, timer
  const outOfTime = () => expired || closed || Date.now() >= deadline,
    remaining = () => {
      if (outOfTime()) throw timeout
      return deadline - Date.now()
    },
    expiry = new Promise((_, reject) => {
      timer = setTimeout(() => { expired = true; reject(timeout) }, Math.max(0, deadline - Date.now()))
    })
  // Keep the single expiry owned even when a synchronous operation fails first.
  expiry.catch(() => {})
  const dispose = handle => {
    let pending = disposals.get(handle)
    if (!pending) {
      pending = Promise.resolve().then(() => handle.dispose())
      disposals.set(handle, pending)
    }
    return pending
  }
  // An already-issued Playwright operation cannot be cancelled individually.
  // Consume late failures and release late handles without awaiting past expiry.
  // The episode's existing context/browser owner remains responsible for closure.
  const disposeDetached = handle => { void dispose(handle).catch(() => {}) }
  const within = async (run, lateValue) => {
    remaining()
    const pending = Promise.resolve().then(() => { remaining(); return run() })
    pending.then(value => {
      if (outOfTime()) lateValue?.(value)
    }, () => {}).catch(() => {})
    const value = await Promise.race([pending, expiry])
    try { remaining() }
    catch (error) { lateValue?.(value); throw error }
    return value
  }
  const wait = async mode => {
    const result = await within(
      () => page.waitForFunction(readSpySourceReadiness, mode, { timeout: remaining() }),
      disposeDetached
    )
    let failure
    try { return await within(() => result.jsonValue()) }
    catch (error) { failure = error; throw error }
    finally {
      try { await within(() => dispose(result)) }
      catch (error) {
        disposeDetached(result)
        if (!failure) throw error
        observation.disposalFailure = String(error)
      }
    }
  }
  try {
    observation.before = await within(() => page.evaluate(readSpySourceReadiness))
    save()
    observation.actionable = await wait('actionable')
    save()
    if (observation.actionable.action === 'skip') {
      // The readiness handle can become stale during extraction/disposal. Read
      // the current native gate inside the same absolute deadline before input.
      observation.beforeSkip = await within(() => page.evaluate(readSpySourceReadiness))
      if (observation.beforeSkip.action === 'skip') {
        await within(() => action('Public Space skip', () => within(() =>
          skipIntroductionWithSpace(page, { timeout: remaining() }))))
        observation.afterSkip = await within(() => page.evaluate(readSpySourceReadiness))
        if (observation.afterSkip.paused !== observation.beforeSkip.paused)
          throw new Error('Spy Space changed pause state; retry the episode')
      }
    }
    observation.after = await wait('ready')
    remaining()
  } catch (error) {
    primaryError = error
    observation.failure = String(error)
    if (outOfTime()) observation.diagnosticsSkipped = 'readiness deadline expired'
    else {
      try { observation.failed = await within(() => page.evaluate(readSpySourceReadiness)) }
      catch (diagnosticError) { observation.diagnosticFailure = String(diagnosticError) }
    }
    throw error
  } finally {
    closed = true
    clearTimeout(timer)
    observation.endedAt = Date.now()
    // Saving is synchronous receipt IO. It cannot turn a late completion into
    // success or replace the original browser error if persistence also fails.
    try { save() }
    catch (error) { if (!primaryError) throw error }
    if (!primaryError && (expired || Date.now() >= deadline)) {
      observation.failure = String(timeout)
      delete observation.after
      try { save() } catch {}
      throw timeout
    }
  }
}
