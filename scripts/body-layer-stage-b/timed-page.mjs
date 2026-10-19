// Serialized into the page. One real callback; terminal pixels stay in its task.
export async function timedCallback({ now, cohort, expectedAngle, index, expected, terminal }) {
  const s = window.testSceneRef.current
  const row = { index, now, elapsedMs: null, status: 'attempted' }
  const precondition = () => {
    if (
      s.fpsGraph ||
      s.modalSuspended ||
      s.world.inputMask ||
      s.world !== window.testStore.getWorld()
    )
      throw Error('Callback precondition drift')
    if (expectedAngle !== null && s.cameraPosition.angle !== expectedAngle)
      throw Error('Literal input angle mismatch')
    if (
      s.previous !== expected.previous ||
      s.world.turn !== expected.preTurn ||
      window.__bodyStep !== expected.preStep
    )
      throw Error('Pre-callback reference identity drift')
  }
  try {
    cancelAnimationFrame(s.frame)
    s.world.paused = cohort === 'camera'
    precondition()
    await new Promise(resolve => requestAnimationFrame(resolve))
    precondition()
    const start = performance.now()
    try {
      s.animate(now)
    } finally {
      row.elapsedMs = performance.now() - start
      cancelAnimationFrame(s.frame)
    }
    if (!Number.isFinite(row.elapsedMs) || row.elapsedMs < 0) throw Error('Invalid CPU duration')
    window.__bodyStep++
    row.turn = s.world.turn
    row.step = window.__bodyStep
    row.previous = s.previous
    if (
      s.previous !== expected.now ||
      row.turn !== expected.turn ||
      row.step !== expected.step ||
      now !== expected.now
    )
      throw Error('Post-callback reference identity drift')
    if (
      s.view.painter.transparentMeshes.length ||
      s.view.painter.renderLeaseBases.length ||
      (s.view.painter.suppressedBodyMaterials?.length ?? 0)
    )
      throw Error('Callback restoration drift')
    row.restored = true
    const r = s.renderer.info.render
    row.counters = {
      calls: r.calls,
      triangles: r.triangles,
      points: r.points,
      lines: r.lines,
      frame: r.frame,
    }
    row.status = 'completed'
    if (terminal) {
      window.__bodyPhases = { callbackMs: row.elapsedMs }
      const observation = window.__bodyCapture() // synchronous readPixels BEFORE first yield/presentation
      row.terminal = await window.__bodyPack(observation, window.__bodyCodec)
    }
  } catch (error) {
    row.status = 'failed'
    row.error = { message: String(error), stack: error.stack }
  }
  return row
}
