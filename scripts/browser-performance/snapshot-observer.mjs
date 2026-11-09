// Trusted read-only sidecar. One preallocated numeric record per completed RAF;
// no callback wrappers, world/ring traversal, hashing or per-RAF object allocation.
export function installSnapshotObserver() {
  if (window.__pndSnapshotObserver) throw Error('Observer already installed')
  const scene = window.testSceneRef.current, recorder = scene.fpsGraph.samples
  const geometry = window.__pndSnapshotGeometry
  if (!geometry || geometry.witnessWidth !== 113) throw Error('Missing bounded geometry observer')
  const width = 30 + geometry.witnessWidth, limit = 1200, data = new Float64Array(width * limit)
  const state = { count: 0, events: [], error: null, serial: recorder.recentCount,
    sequence: 0, expected: null, event: null, stopped: false, frame: null }
  const fail = message => { state.error ??= message; state.stopped = true }
  const input = event => {
    if (!state.expected || state.stopped) return
    const expected = state.expected
    if (event.type !== expected.type || event.clientX !== expected.x || event.clientY !== expected.y || event.buttons !== expected.buttons || !event.isTrusted) {
      fail('Unexpected input during sample block'); return
    }
    if (state.event) { fail('Duplicate input during sample block'); return }
    if (scene.fpsGraph?.samples !== recorder) { fail('Recorder replaced'); return }
    state.event = { sequence: state.sequence, type: event.type, x: event.clientX, y: event.clientY,
      buttons: event.buttons, timestampMs: performance.now(), anchorSerial: recorder.recentCount,
      anchorTimestampMs: recorder.timestamp }
    state.events.push(state.event)
  }
  const tick = now => {
    if (state.stopped) return
    if (scene.fpsGraph?.samples !== recorder || scene !== window.testSceneRef.current) fail('Recorder or scene replaced')
    else if (recorder.recentCount >= 1200) fail('Recorder ring bound reached')
    else if (recorder.recentCount !== state.serial) {
      if (recorder.recentCount !== state.serial + 1 || recorder.timestamp !== now)
        fail('Observer ordering/serial does not identify the just-completed callback')
      else if (state.count === limit) fail('Observer frame bound exceeded')
      else {
        const p = scene.cameraPosition, v = scene.viewPoint, w = scene.world, velocity = scene.cameraVelocity
        let i = state.count++ * width
        data[i++] = recorder.recentCount; data[i++] = now; data[i++] = state.sequence
        // Pose tuple: XY/angle, displayed XZ/bearing/zoom/preset, routed pointer XY,
        // buttons, paused/turn, input/modal/flyby/transition/overview/keys, motion,
        // result-motion, velocity turn/forward/side, navigation, gesture.
        data[i++] = p.x; data[i++] = p.y; data[i++] = p.angle; data[i++] = v.x; data[i++] = v.z
        data[i++] = scene.cameraBearing; data[i++] = scene.viewZoom; data[i++] = scene.viewPreset
        data[i++] = scene.pointerScreen?.clientX ?? -1; data[i++] = scene.pointerScreen?.clientY ?? -1
        data[i++] = scene.pointerButtons; data[i++] = Number(w.paused); data[i++] = w.turn; data[i++] = w.inputMask
        data[i++] = Number(scene.modalSuspended); data[i++] = Number(Boolean(w.flyby.flags & 1))
        data[i++] = Number(scene.viewTransition !== null); data[i++] = Number(Boolean(scene.overviewActive || scene.overviewStage || scene.globeMorph.active))
        data[i++] = scene.keys.size; data[i++] = scene.cameraMotion.active; data[i++] = scene.resultCamera.active
        data[i++] = velocity.turn; data[i++] = velocity.forward; data[i++] = velocity.side
        data[i++] = scene.navigationButtons(); data[i++] = Number(scene.pointerGesture !== null)
        data[i++] = scene.hoveredObject ?? -1
        try { geometry.writeWitness(data, i, window.testSceneRef.current) }
        catch { fail('Geometry witness failed') }
        if (state.event && recorder.recentCount > state.event.anchorSerial && state.expected)
          for (let j = 0; j < geometry.witnessWidth; j++)
            if (data[i + j] !== state.expected.geometryWitness[j]) { fail('Selected callback geometry inputs changed'); break }
      }
      state.serial = recorder.recentCount
    }
    if (!state.stopped) state.frame = requestAnimationFrame(tick)
  }
  const materialize = i => ({ serial: data[i * width], timestampMs: data[i * width + 1],
    sequence: data[i * width + 2], pose: Array.from(data.subarray(i * width + 3, i * width + 30)),
    geometryWitness: Array.from(data.subarray(i * width + 30, (i + 1) * width)) })
  const four = count => { if (count !== 4) throw Error('Only fixed four-callback blocks are supported') }
  for (const name of ['pointermove', 'pointerdown', 'pointerup']) window.addEventListener(name, input, { capture: true, passive: true })
  const api = {
    arm(expected) {
      if (state.expected || state.error || state.sequence >= 6) throw Error(state.error ?? 'Invalid block sequence')
      if (!Array.isArray(expected.geometryWitness) || expected.geometryWitness.length !== geometry.witnessWidth || !expected.geometryWitness.every(Number.isFinite)) throw Error('Invalid geometry witness')
      state.sequence++; state.expected = expected; state.event = null
      return state.sequence
    },
    ready(count) {
      four(count)
      if (state.error) throw Error(state.error)
      return !!state.event && state.serial >= state.event.anchorSerial + count
    },
    finish(count) {
      if (!api.ready(count)) throw Error('Incomplete input block')
      const event = state.event, frames = []
      for (let serial = event.anchorSerial + 1; serial <= event.anchorSerial + count; serial++) {
        let found = -1
        for (let i = 0; i < state.count; i++) if (data[i * width] === serial) { found = i; break }
        if (found < 0 || data[found * width + 2] !== event.sequence) throw Error('Missing exact first post-input callback')
        frames.push(materialize(found))
      }
      state.expected = null
      return { event, frames }
    },
    stop() {
      state.stopped = true; cancelAnimationFrame(state.frame)
      for (const name of ['pointermove', 'pointerdown', 'pointerup']) window.removeEventListener(name, input, true)
      delete window.__pndSnapshotObserver
      return { frames: Array.from({ length: state.count }, (_, i) => materialize(i)), events: state.events, error: state.error }
    },
  }
  window.__pndSnapshotObserver = api
  state.frame = requestAnimationFrame(tick)
}
