import assert from 'node:assert/strict'

// Preparatory input driver only. Caller owns the admitted public M2 context,
// source binding, 45s episode/180s route deadline, exports and cleanup. No launch.
export async function runNaturalF8Inputs({ page, hud, world, deadlineAt, observe, closeOwner, releaseErrors = [],
  now = () => performance.now(), wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  assert.ok(Number.isFinite(deadlineAt))
  assert.equal(typeof observe, 'function')
  assert.equal(typeof closeOwner, 'function')
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    // Caller must verify actual context closure; invoking teardown alone is not
    // proof that a pending browser operation has ceased all side effects.
    Promise.resolve().then(closeOwner).catch(error => releaseErrors.push({ phase: 'owner-close', error }))
  }
  const requireTime = (end, label) => {
    if (stopped || now() >= end) {
      stop()
      throw new Error(`${label} deadline exceeded (exhausted original allowance)`)
    }
  }
  const bounded = async (operation, end, label) => {
    requireTime(end, label)
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        stop()
        const failure = new Error(`${label} deadline exceeded`)
        reject(failure)
      }, end - now())
    })
    try {
      const result = await Promise.race([Promise.resolve().then(operation), timeout])
      requireTime(end, label)
      return result
    } finally { clearTimeout(timer) }
  }
  for (const point of [hud, world])
    assert.ok(Number.isFinite(point?.x) && Number.isFinite(point?.y))
  assert.ok(Number.isFinite(world.radius) && world.radius >= 4 && world.radius <= 16,
    'caller must verify an interior world rectangle for the entire movement path')
  const results = []
  for (const stage of ['hud-stationary', 'world-stationary', 'world-moving', 'view-moving']) {
    const end = Math.min(deadlineAt, now() + 2000)
    const check = () => requireTime(end, stage)
    const point = stage === 'hud-stationary' ? hud : world
    check()
    await bounded(() => page.mouse.move(point.x, point.y), end, stage)
    check()
    const before = await bounded(() => observe({ stage, edge: 'before', deadlineAt: end }), end, stage)
    check()
    let keyHeld = false, primaryPresent = false, primary, holdEnd
    try {
      if (stage === 'view-moving') {
        // Mark before awaiting so a rejected/uncertain keydown still gets keyup.
        keyHeld = true
        holdEnd = Math.min(end, now() + 500)
        await bounded(() => page.keyboard.down('ArrowRight'), holdEnd, 'key-hold')
        check()
        await bounded(() => wait(Math.min(400, Math.max(0, holdEnd - now() - 50))), holdEnd, 'key-hold')
      } else if (stage === 'world-moving') {
        for (let i = 0; i < 20; i++) {
          check()
          await bounded(() => page.mouse.move(world.x + (i % 2 ? world.radius : -world.radius), world.y), end, stage)
          check()
          await bounded(() => wait(Math.min(50, end - now())), end, stage)
        }
      } else await bounded(() => wait(Math.min(500, end - now())), end, stage)
      check()
    } catch (error) { primaryPresent = true; primary = error } finally {
      if (keyHeld && !stopped) {
        try { await bounded(() => page.keyboard.up('ArrowRight'), holdEnd, 'key-release') }
        catch (error) {
          releaseErrors.push({ phase: 'key-release', error })
          stop()
          if (!primaryPresent) { primaryPresent = true; primary = error }
        }
      }
    }
    if (primaryPresent) throw primary
    const after = await bounded(() => observe({ stage, edge: 'after', deadlineAt: end }), end, stage)
    check()
    results.push({ stage, before, after })
  }
  return { stages: results, scope: 'Trusted input sequence only; observations are not UI/sample correlation, native parity or performance acceptance.' }
}
