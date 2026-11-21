import assert from 'node:assert/strict'

// Context ownership only. Does not navigate, import saves, launch a browser,
// alter the paused scenario, or claim admission/publication acceptance.
export async function withNaturalF8Context({ browser, routeDeadlineUnixMs, run,
  now = () => performance.now(), wallNow = () => Date.now(), receipt = {} }) {
  // Capture monotonic first: time spent reading wall clock cannot extend budget.
  const monotonicStarted = now(), wallStarted = wallNow()
  assert.ok(Number.isFinite(routeDeadlineUnixMs) && Number.isFinite(wallStarted) &&
    Number.isFinite(monotonicStarted))
  const remainingRouteMs = routeDeadlineUnixMs - wallStarted
  assert.ok(remainingRouteMs > 0 && remainingRouteMs <= 180000,
    'expected Date.now route deadline with at most original 180s remaining')
  assert.equal(typeof run, 'function')
  const deadlineAt = monotonicStarted + Math.min(remainingRouteMs, 45000)
  let context, stopped = false, closePromise, timer, primary, failed = false
  receipt.cleanupVerified = false
  receipt.deadlineAt = deadlineAt
  receipt.clockBinding = { routeDeadlineUnixMs, wallStarted, monotonicStarted, remainingRouteMs }
  const close = () => {
    stopped = true
    if (context && !closePromise) {
      closePromise = Promise.resolve().then(() => context.close()).then(() => {
        receipt.cleanupVerified = true
      }, error => { receipt.cleanupError = String(error); throw error })
      // Late acquisitions still close after the caller has failed. Their failure
      // stays in receipt, not as an unhandled rejection or fictitious cleanup.
      closePromise.catch(() => {})
    }
    return closePromise
  }
  const expired = () => stopped || now() >= deadlineAt
  const remaining = () => {
    if (expired()) { close(); throw new Error('Natural F8 owner deadline exceeded') }
    return Math.min(10000, deadlineAt - now())
  }
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { close(); reject(new Error('Natural F8 owner deadline exceeded')) }, deadlineAt - now())
  })
  const operation = async () => {
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    remaining() // Late context is closed, never admitted.
    const page = await context.newPage()
    remaining()
    page.setDefaultTimeout(remaining())
    return run({ context, page, deadlineAt, remaining, closeOwner: close })
  }
  let result
  try {
    result = await Promise.race([operation(), timeout])
    remaining()
  } catch (error) { failed = true; primary = error }
  finally {
    // Do not let cleanup extend the inherited absolute episode deadline.
    const closing = close()
    if (closing) {
      try { await Promise.race([closing, timeout]) }
      catch (error) { if (!failed) { failed = true; primary = error } }
    }
    clearTimeout(timer)
  }
  if (failed) throw primary
  assert.equal(receipt.cleanupVerified, true)
  return result
}

// Invoke in the page realm as one synchronous read. Host performance.now is
// never a sample boundary. Caller retains this JSHandle, not serialized copies.
export function captureNaturalF8Identity() {
  const scene = window.testSceneRef?.current, store = window.testStore
  const world = store?.getWorld(), graph = scene?.fpsGraph
  if (!scene || scene.world !== world || !scene.renderer?.domElement?.isConnected ||
      world.outcome?.level !== 2 || world.paused || world.inputMask ||
      scene.messageModal || scene.modalSuspended || scene.overviewActive || !graph || graph.disposed)
    throw new Error('Natural F8 current live Mission2 admission failed')
  return { scene, store, world, graph, recording: graph.interactionRecording,
    afterTimestamp: performance.now() }
}

// Same-task revalidation before every observation; graph reset/world replacement
// fails instead of silently accepting a different session.
export function assertNaturalF8Identity(identity) {
  if (window.testSceneRef?.current !== identity.scene || window.testStore !== identity.store ||
      identity.store.getWorld() !== identity.world || identity.scene.world !== identity.world ||
      identity.scene.fpsGraph !== identity.graph || identity.graph.disposed ||
      identity.graph.interactionRecording !== identity.recording ||
      !identity.scene.renderer.domElement.isConnected)
    throw new Error('Natural F8 identity changed')
  if (identity.world.outcome?.level !== 2 || identity.world.paused || identity.world.inputMask ||
      identity.scene.messageModal || identity.scene.modalSuspended || identity.scene.overviewActive)
    throw new Error('Natural F8 live input admission changed')
  return true
}
