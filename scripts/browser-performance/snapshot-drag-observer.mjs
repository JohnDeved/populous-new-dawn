// Separate held-drag sidecar; the qualified stable observer remains unchanged.
// Trusted read-only sidecar. One preallocated numeric record per completed RAF;
// no callback wrappers, world/ring traversal, hashing or per-RAF object allocation.
export function installSnapshotDragObserver() {
  if (window.__pndSnapshotObserver) throw Error('Observer already installed')
  const scene = window.testSceneRef.current, recorder = scene.fpsGraph.samples
  const geometry = window.__pndSnapshotGeometry
  if (!geometry || geometry.witnessWidth !== 113) throw Error('Missing bounded geometry observer')
  const poseWidth = 72, width = 3 + poseWidth + geometry.witnessWidth
  const limit = 1200, data = new Float64Array(width * limit)
  // Only the explicitly separate held-drag cohort observes pre-input geometry and
  // tooltip ownership. Stable-hover keeps its original 27-scalar pose contract.
  const inputs = new Float64Array(6 * (poseWidth + geometry.witnessWidth))
  const postGeometry = new Float64Array(geometry.witnessWidth)
  const projectionFields = ['curvature', 'diameter', 'scale', 'spriteScale', 'depth', 'perspective', 'pitch',
    'offsetX', 'offsetY', 'horizon', 'width', 'height', 'shamanScale', 'boundsMode', 'scaledSprites',
    'centerX', 'centerY', 'fractionX', 'fractionY', 'pixelScaleX', 'pixelScaleY']
  const checkProjectionShape = () => {
    const projection = scene.view.projection
    if (Object.keys(projection).sort().join(',') !== [...projectionFields, 'matrix', 'bounds'].sort().join(',') ||
        projection.matrix.length !== 9 || projection.bounds.length !== 8) throw Error('Unsupported projection input shape')
  }
  checkProjectionShape()
  const state = { count: 0, events: [], error: null, serial: recorder.recentCount,
    sequence: 0, expected: null, event: null, stopped: false, frame: null }
  const fail = message => { state.error ??= message; state.stopped = true }
  const writePose = (buffer, offset) => {
    const p = scene.cameraPosition, v = scene.viewPoint, w = scene.world, velocity = scene.cameraVelocity
    let i = offset
    // Pose tuple: XY/angle, displayed XZ/bearing/zoom/preset, routed pointer XY,
    // buttons, paused/turn, input/modal/flyby/transition/overview/keys, motion,
    // result-motion, velocity turn/forward/side, navigation, gesture.
    buffer[i++] = p.x; buffer[i++] = p.y; buffer[i++] = p.angle; buffer[i++] = v.x; buffer[i++] = v.z
    buffer[i++] = scene.cameraBearing; buffer[i++] = scene.viewZoom; buffer[i++] = scene.viewPreset
    buffer[i++] = scene.pointerScreen?.clientX ?? -1; buffer[i++] = scene.pointerScreen?.clientY ?? -1
    buffer[i++] = scene.pointerButtons; buffer[i++] = Number(w.paused); buffer[i++] = w.turn; buffer[i++] = w.inputMask
    buffer[i++] = Number(scene.modalSuspended); buffer[i++] = Number(Boolean(w.flyby.flags & 1))
    buffer[i++] = Number(scene.viewTransition !== null); buffer[i++] = Number(Boolean(scene.overviewActive || scene.overviewStage || scene.globeMorph.active))
    buffer[i++] = scene.keys.size; buffer[i++] = scene.cameraMotion.active; buffer[i++] = scene.resultCamera.active
    buffer[i++] = velocity.turn; buffer[i++] = velocity.forward; buffer[i++] = velocity.side
    buffer[i++] = scene.navigationButtons(); buffer[i++] = Number(scene.pointerGesture !== null)
    buffer[i++] = scene.hoveredObject ?? -1
    {
      buffer[i++] = scene.tooltipInput?.picked ?? -1
      const view = scene.view, projection = view.projection
      buffer[i++] = view.center.x; buffer[i++] = view.center.y
      buffer[i++] = view.rawCenter.x; buffer[i++] = view.rawCenter.y
      buffer[i++] = view.angle; buffer[i++] = Number(view.overview)
      for (let j = 0; j < projectionFields.length; j++) buffer[i++] = projection[projectionFields[j]]
      for (let j = 0; j < 9; j++) buffer[i++] = projection.matrix[j]
      for (let j = 0; j < 8; j++) buffer[i++] = projection.bounds[j]
    }
    return i
  }
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
    {
      const offset = (state.sequence - 1) * (poseWidth + geometry.witnessWidth)
      try {
        geometry.writeWitness(inputs, writePose(inputs, offset), window.testSceneRef.current)
        for (let j = 0; j < geometry.witnessWidth; j++)
          if (inputs[offset + poseWidth + j] !== expected.geometryWitness[j]) { fail('Pre-input geometry changed'); break }
      } catch { fail('Pre-input witness failed') }
    }
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
        const offset = state.count++ * width
        data[offset] = recorder.recentCount; data[offset + 1] = now; data[offset + 2] = state.sequence
        const i = writePose(data, offset + 3)
        try { geometry.writeWitness(data, i, window.testSceneRef.current) }
        catch { fail('Geometry witness failed') }
        if (state.event && recorder.recentCount > state.event.anchorSerial && state.expected)
          for (let j = 0; j < geometry.witnessWidth; j++) {
            // The native query consumes old geometry, ordinary picking then
            // rebuilds the new-pose prefix. Retain the first completed endpoint;
            // it must remain exact for all subsequent selected callbacks.
            if (recorder.recentCount === state.event.anchorSerial + 1) postGeometry[j] = data[i + j]
            else if (data[i + j] !== postGeometry[j]) {
              fail('Selected callback geometry inputs changed'); break
            }
          }
      }
      state.serial = recorder.recentCount
    }
    if (!state.stopped) state.frame = requestAnimationFrame(tick)
  }
  const materialize = i => ({ serial: data[i * width], timestampMs: data[i * width + 1],
    sequence: data[i * width + 2], pose: Array.from(data.subarray(i * width + 3, i * width + 3 + poseWidth)),
    geometryWitness: Array.from(data.subarray(i * width + 3 + poseWidth, (i + 1) * width)) })
  const materializeEvent = event => {
    const offset = (event.sequence - 1) * (poseWidth + geometry.witnessWidth)
    return { ...event, beforePose: Array.from(inputs.subarray(offset, offset + poseWidth)),
      geometryWitness: Array.from(inputs.subarray(offset + poseWidth, offset + poseWidth + geometry.witnessWidth)) }
  }
  const four = count => { if (count !== 4) throw Error('Only fixed four-callback blocks are supported') }
  for (const name of ['pointermove', 'pointerdown', 'pointerup']) window.addEventListener(name, input, { capture: true, passive: true })
  const api = {
    arm(expected) {
      checkProjectionShape()
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
      checkProjectionShape()
      if (!api.ready(count)) throw Error('Incomplete input block')
      const event = state.event, frames = []
      for (let serial = event.anchorSerial + 1; serial <= event.anchorSerial + count; serial++) {
        let found = -1
        for (let i = 0; i < state.count; i++) if (data[i * width] === serial) { found = i; break }
        if (found < 0 || data[found * width + 2] !== event.sequence) throw Error('Missing exact first post-input callback')
        frames.push(materialize(found))
      }
      state.expected = null
      return { event: materializeEvent(event), frames }
    },
    stop() {
      state.stopped = true; cancelAnimationFrame(state.frame)
      for (const name of ['pointermove', 'pointerdown', 'pointerup']) window.removeEventListener(name, input, true)
      delete window.__pndSnapshotObserver
      return { frames: Array.from({ length: state.count }, (_, i) => materialize(i)), events: state.events.map(materializeEvent), error: state.error }
    },
  }
  window.__pndSnapshotObserver = api
  state.frame = requestAnimationFrame(tick)
}
