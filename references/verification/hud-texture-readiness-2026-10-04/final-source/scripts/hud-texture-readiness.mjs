// Await the current document's texture getter on every observation. Async
// waitForFunction predicates can accept a truthy Promise that resolves false.
// The deadline covers reads and pauses, but cannot cancel an in-flight evaluate;
// a stalled import must settle (or the owning browser must close) before we exit.
export async function waitForHudTexture(page, { timeout = 30000, polling = 100 } = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0 || !Number.isFinite(polling) || polling <= 0)
    throw new RangeError('Invalid HUD texture timeout or polling interval')
  const deadline = performance.now() + timeout
  while (performance.now() < deadline) {
    const ready = await page.evaluate(async () => {
      const { texture } = await import('/app/scene-assets.ts'),
        image = texture('hud').image
      return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
    })
    const remaining = deadline - performance.now()
    if (remaining <= 0) break
    if (ready === true) return true
    await page.waitForTimeout(Math.min(polling, remaining))
  }
  throw new Error(`HUD texture readiness timed out after ${timeout} ms`)
}
