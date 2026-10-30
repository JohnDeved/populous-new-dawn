import { bindGame } from './browser-game.mjs'

// One owner covers every bind, asynchronous module read and poll. Reuse the
// public binder unchanged, but pass its waits the same remaining deadline.
async function withinPortraitReadiness(page, { timeout, signal }, run) {
  if (!Number.isFinite(timeout) || timeout <= 0)
    throw new RangeError('Invalid readiness wait timeout or polling interval')
  const deadline = performance.now() + timeout
  let expired = false, timer, rejectStop
  const timedOut = () => new Error('Portrait readiness timed out')
  const stopped = new Promise((_, reject) => { rejectStop = reject })
  const abort = () => {
    expired = true
    rejectStop(signal.reason ?? new Error('Portrait readiness aborted'))
  }
  const remaining = () => {
    signal?.throwIfAborted()
    const value = deadline - performance.now()
    if (expired || value <= 0) throw timedOut()
    return value
  }
  const phase = async action => {
    remaining()
    const result = await action()
    remaining()
    return result
  }
  const options = value => ({ ...value, timeout: Math.min(
    Number.isFinite(value?.timeout) && value.timeout > 0 ? value.timeout : Infinity, remaining()) })
  const bounded = {
    waitForSelector: (selector, settings) => phase(() => page.waitForSelector(selector, options(settings))),
    waitForFunction: (predicate, argument, settings) => phase(() => page.waitForFunction(predicate, argument, options(settings))),
    evaluate: (...args) => phase(() => page.evaluate(...args)),
    waitForTimeout: duration => phase(() => page.waitForTimeout(Math.min(duration, remaining()))),
  }
  try {
    remaining()
    signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => { expired = true; rejectStop(timedOut()) }, remaining())
    return await Promise.race([run(bounded), stopped])
  } finally {
    expired = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

// Reload destroys aliases. Bind every read; the browser callback only observes
// the current Scene/Store after its module import, never a captured prior World.
async function readBoundPortraitReadiness(page) {
  await bindGame(page)
  return page.evaluate(async () => {
    const { campaignPortraitReadiness } = await import('/scripts/campaign-portrait-readiness.mjs')
    const scene = window.testSceneRef?.current, store = window.testStore
    if (
      !scene?.renderer?.domElement?.isConnected ||
      scene.world !== store?.getWorld() ||
      scene.overviewActive || scene.overviewStage ||
      document.querySelector('.loading-world')
    ) return { ready: false, reason: 'Scene/store or portrait view unavailable during readiness observation' }
    return { ...campaignPortraitReadiness(scene.world), level: scene.world.outcome.level }
  })
}

export async function readPortraitReadiness(page, { timeout = 30000, signal } = {}) {
  return withinPortraitReadiness(page, { timeout, signal }, readBoundPortraitReadiness)
}

// Never pass an asynchronous readiness predicate to waitForFunction: await each
// read sequentially and keep all samples under one outer deadline/abort owner.
export async function waitForPortraitReadiness(page, { timeout = 30000, polling = 100, signal } = {}) {
  if (!Number.isFinite(polling) || polling <= 0)
    throw new RangeError('Invalid readiness wait timeout or polling interval')
  return withinPortraitReadiness(page, { timeout, signal }, async bounded => {
    let before, samples = 0
    for (;;) {
      const after = await readBoundPortraitReadiness(bounded)
      before ??= after
      samples++
      if (after.ready === true) return { before, after, samples }
      await bounded.waitForTimeout(polling)
    }
  })
}
