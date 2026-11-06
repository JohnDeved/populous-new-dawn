// Standalone source proposal only. No app hooks, route, scheduling, or launch.
// This outer function has no module closure dependencies and may later be passed
// as a trusted function to browser tooling. It does not evaluate strings.
export function installCaptureProbe(options = null) {
  const orders = [['A', 'B'], ['B', 'A'], ['B', 'A'], ['A', 'B']]
  const dimensions = value => Number.isSafeInteger(value) && value > 0 && value <= 256
  const object = value => value !== null && typeof value === 'object'
  const reason = error => String(error).slice(0, 512)
  const check = (condition, message) => { if (!condition) throw Error(message) }
  const clone = value => structuredClone(value)
  function compareRgba(a, b) {
    for (const image of [a, b]) {
      check(object(image) && dimensions(image.width) && dimensions(image.height), 'Invalid RGBA dimensions')
      check(image.data instanceof Uint8ClampedArray, 'Expected RGBA8 Uint8ClampedArray')
      check(image.data.length === image.width * image.height * 4, 'Invalid RGBA length')
    }
    if (a.width !== b.width || a.height !== b.height) return { equal: false, mismatch: 'dimensions' }
    for (let index = 0; index < a.data.length; index++)
      if (a.data[index] !== b.data[index]) return { equal: false, mismatch: 'channel', index }
    return { equal: true, mismatch: null }
  }
  function create({ document, now, readState, routeStartMs, caseStartMs, launcherDeadlineMs,
    episodeId, crypto = null, setTimer = null, clearTimer = null, canonicalPngByteLimit,
    assertRetentionOwnership = null }) {
    check(typeof document?.createElement === 'function' && typeof now === 'function' &&
      typeof readState === 'function', 'Missing trusted browser dependencies')
    check(typeof episodeId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(episodeId), 'Invalid episode ID')
    check([routeStartMs, caseStartMs, launcherDeadlineMs].every(Number.isFinite) &&
      routeStartMs <= caseStartMs && caseStartMs <= now(), 'Missing original deadline origins')
    check(Number.isSafeInteger(canonicalPngByteLimit) && canonicalPngByteLimit > 0 &&
      canonicalPngByteLimit <= 8388608, 'Explicit bounded canonical artifact allowance required')
    if (crypto !== null) check(typeof crypto.subtle?.digest === 'function' &&
      typeof setTimer === 'function' && typeof clearTimer === 'function', 'Missing bounded digest dependencies')
    check(assertRetentionOwnership === null || typeof assertRetentionOwnership === 'function', 'Invalid retention ownership guard')
    const deadline = Math.min(routeStartMs + 180000, caseStartMs + 75000, launcherDeadlineMs)
    const pairs = [], owned = [], seenKeys = new Set(), seenContexts = new Set()
    const result = { schema: 'capture-probe-preparation-v1', episodeId,
      canonicalGate: 'unassessed-external-v2-required', originalFailureSuperseded: false,
      deadline, routeStartMs, caseStartMs, launcherDeadlineMs, pairs, terminal: null,
      firstError: null, retention: null, cleanup: { attempted: false, confirmed: false, errors: [] },
      allocations: 0, drawCalls: 0, nominalBackingBytes: 0, peakNominalBackingBytes: 0,
      liveReadbackArrays: 0, peakReadbackArrays: 0, digestOutstanding: false }
    let stopped = false, capturing = false, retentionPromise = null, lastNow = -Infinity
    let retentionInvalidated = false, cancelDigest = null
    let original = null
    const tick = () => {
      const value = now()
      check(Number.isFinite(value) && value >= lastNow, 'Non-monotonic timer')
      lastNow = value
      return value
    }
    const withinDeadline = () => { check(tick() < deadline, 'Original deadline exhausted') }
    const noteFailure = error => { result.firstError ??= reason(error) }
    const references = ['scene', 'world', 'source', 'person']
    const scalars = ['width', 'height', 'stamp', 'turn', 'animationFrame', 'actorId', 'actorKind',
      'actorTeam', 'hp', 'started', 'opponent', 'fightGroup', 'action', 'speed', 'paused',
      'visible', 'connected', 'sceneStoreMatch', 'profile', 'viewportWidth', 'viewportHeight', 'dpr']
    function state() {
      const live = readState()
      check(object(live), 'Missing source state')
      const snapshot = Object.fromEntries([...references, ...scalars].map(key => [key, live[key]]))
      check(references.every(key => object(snapshot[key])), 'Missing physical identity')
      check(snapshot.source.width === snapshot.width && snapshot.source.height === snapshot.height &&
        Number.isSafeInteger(snapshot.width) && snapshot.width > 0 &&
        Number.isSafeInteger(snapshot.height) && snapshot.height > 0, 'Invalid source dimensions')
      check(snapshot.actorId === 54 && snapshot.actorKind === 'shaman' && snapshot.actorTeam === 'blue' &&
        Number.isFinite(snapshot.hp) && snapshot.hp > 0, 'Actor missing or dead')
      check(snapshot.speed === 1 && snapshot.paused === false && snapshot.visible === true &&
        snapshot.connected === true && snapshot.source.isConnected === true && snapshot.sceneStoreMatch === true,
      'Running/visibility/connection guard failed')
      check(snapshot.viewportWidth === 960 && snapshot.viewportHeight === 720 && snapshot.dpr === 1 &&
        typeof snapshot.profile === 'string' && snapshot.profile.length > 0 && snapshot.profile.length <= 128,
      'Source profile drift')
      for (const key of ['stamp', 'turn', 'animationFrame', 'started', 'opponent', 'fightGroup'])
        check(Number.isSafeInteger(snapshot[key]) && snapshot[key] >= 0, `Invalid ${key}`)
      check(['attack', 'strike', 'special'].includes(snapshot.action), 'Not the running original attack')
      if (original) {
        for (const key of [...references, 'actorId', 'actorKind', 'actorTeam', 'started', 'opponent', 'fightGroup',
          'width', 'height', 'profile', 'viewportWidth', 'viewportHeight', 'dpr'])
          check(snapshot[key] === original[key], `Original identity/profile changed: ${key}`)
      }
      return snapshot
    }
    function unchanged(expected) {
      const actual = state()
      for (const key of [...references, ...scalars]) check(actual[key] === expected[key], `Pair state changed: ${key}`)
    }
    function release(item) {
      if (item.released) return
      item.released = true
      let clean = true
      for (const key of ['width', 'height']) {
        try { item.canvas[key] = 0; check(item.canvas[key] === 0, `Unconfirmed ${key} release`) }
        catch (error) { clean = false; result.cleanup.errors.push(reason(error)); noteFailure(error) }
      }
      if (clean) result.nominalBackingBytes -= item.bytes
      item.canvas = null; item.context = null
    }
    function cleanup({ invalidateRetention = true } = {}) {
      if (invalidateRetention && result.retention && !result.retention.done && !retentionInvalidated) {
        retentionInvalidated = true
        const error = Error('Retention invalidated by cleanup/disposal')
        noteFailure(error)
        result.retention.error ??= reason(error)
        result.retention.status = 'failed'
        cancelDigest?.(error)
      }
      if (!result.cleanup.attempted) {
        result.cleanup.attempted = true
        for (const item of owned) release(item)
        owned.length = 0; seenContexts.clear(); original = null
        document = null; readState = null
      }
      result.cleanup.confirmed = result.cleanup.errors.length === 0 &&
        result.nominalBackingBytes === 0 && result.liveReadbackArrays === 0 && !result.digestOutstanding
      return clone(result.cleanup)
    }
    function stop(terminal = { reason: 'stopped' }) {
      if (!stopped) {
        stopped = true
        result.terminal = { reason: reason(terminal.reason), error: terminal.error ? reason(terminal.error) : null,
          timestampMs: tick() }
        if (terminal.error) noteFailure(terminal.error)
      }
      return report()
    }
    const fail = error => {
      noteFailure(error)
      try { stop({ reason: 'error', error }) } finally {
        // A broken pair cannot be repaired. Release that pair immediately;
        // earlier complete private pairs remain available for one retention.
        for (const item of owned) if (pairs[item.slot]?.status !== 'copied') release(item)
        if (owned.every(item => item.released)) cleanup()
      }
      throw error
    }
    function capture(sample, select) {
      try {
        check(!stopped && !result.cleanup.attempted, 'Capture after terminal/cleanup')
        check(!capturing, 'Reentrant capture')
        withinDeadline()
        const expected = state()
        const fields = ['id', 'action', 'started', 'fightGroup', 'opponent', 'object', 'draw', 'f1', 'f2', 'direction']
        check(object(sample) && fields.every(key => key === 'action' ? typeof sample[key] === 'string' :
          Number.isSafeInteger(sample[key]) && sample[key] >= 0), 'Invalid pose metadata')
        check(['rafTimestampMs', 'callbackEntryMs'].every(key => sample[key] == null || Number.isFinite(sample[key])),
          'Invalid callback timing metadata')
        check(['slot', 'order', 'arm', 'source', 'clip'].every(key => !Object.hasOwn(sample, key)), 'Caller-selected pair identity/order rejected')
        const key = JSON.stringify(fields.map(field => sample[field]))
        check(key.length <= 512 && sample.id === expected.actorId && sample.started === expected.started &&
          sample.opponent === expected.opponent && sample.fightGroup === expected.fightGroup &&
          sample.action === expected.action && sample.turn === expected.turn && sample.stamp === expected.stamp,
        'Pose/source metadata mismatch')
        // Duplicate observed turns/poses do not reserve an extra slot. A slot can
        // only be allocated here; no caller may select an arm or replace a slot.
        if (seenKeys.has(key)) return { reserved: false, reason: 'duplicate-pose' }
        if (pairs.length === 4) return { reserved: false, reason: 'four-slots-reserved' }
        original ??= expected
        capturing = true
        const slot = pairs.length
        const pair = { slot, key, order: [...orders[slot]], status: 'reserved', error: null,
          identity: { source: 'source:1', scene: 'scene:1', world: 'world:1', physicalPerson: 'person:1',
            actorId: expected.actorId, started: expected.started, opponent: expected.opponent,
            fightGroup: expected.fightGroup, profile: expected.profile },
          turn: expected.turn, stamp: expected.stamp, animationFrame: expected.animationFrame,
          sourceWidth: expected.width, sourceHeight: expected.height, clip: null, visibility: null,
          rafTimestampMs: sample.rafTimestampMs ?? null, callbackEntryMs: sample.callbackEntryMs ?? null,
          pairStartMs: tick(), pairEndMs: null, pairMs: null, cropCopyMs: null, candidateCopyMs: null, arms: {} }
        pairs.push(pair); seenKeys.add(key) // Reservation precedes eligibility.
        try {
          check(typeof select === 'function', 'Missing synchronous crop selection')
          const selection = select()
          check(selection && typeof selection.then !== 'function', 'Post-yield/asynchronous selection rejected')
          check(Object.keys(selection).every(key => ['eligible', 'reason', 'clip', 'visibility'].includes(key)),
            'Caller-selected source/order rejected')
          unchanged(expected); withinDeadline()
          if (selection.eligible === false) {
            pair.status = 'missing'; pair.error = reason(selection.reason ?? 'Reserved crop unavailable')
            noteFailure(pair.error)
            return { reserved: true, slot, status: pair.status }
          }
          const { clip, visibility } = selection
          check(selection.eligible === true && object(clip) && dimensions(clip.width) && dimensions(clip.height) &&
            Number.isSafeInteger(clip.x) && clip.x >= 0 && Number.isSafeInteger(clip.y) && clip.y >= 0 &&
            clip.x + clip.width <= expected.width && clip.y + clip.height <= expected.height, 'Invalid crop geometry')
          check(object(visibility) && visibility.bodyCanvasOwned === true && visibility.bodyInCanvas === true &&
            visibility.cropOverlayClear === true, 'Visibility/overlay guard failed')
          pair.clip = { x: clip.x, y: clip.y, width: clip.width, height: clip.height }
          check(JSON.stringify(visibility).length <= 32768, 'Visibility metadata cap exceeded')
          pair.visibility = clone(visibility)
          pair.pose = Object.fromEntries(['id', 'action', 'started', 'fightGroup', 'opponent', 'object',
            'draw', 'f1', 'f2', 'direction', 'frame', 'phase'].map(key => [key, sample[key]]))
          for (const arm of orders[slot]) {
            const record = { arm, position: orders[slot].indexOf(arm),
              captureId: `${episodeId}:${slot}:${arm}:${expected.turn}:${expected.stamp}:${key}:${JSON.stringify(pair.clip)}`,
              filename: arm === 'A' ? `melee-attack-frame-${slot}.png` : `diagnostic-melee-B-frame-${slot}.png`,
              requestedContextOptions: arm === 'A' ? null : { willReadFrequently: true },
              effectiveContextAttributes: null, timings: { beforeCreate: null, afterCreate: null, beforeSize: null,
                afterSize: null, beforeContext: null, afterContext: null, beforeDraw: null, afterDraw: null, operationEnd: null },
              copyMsSemantics: 'instrumented allocation-size-context-draw block, not byte-identical historical timer',
              drawCallMs: null, copyMs: null, error: null, rawPixelSha256: null, pngSha256: null, png: null }
            pair.arms[arm] = record
            let item
            try {
              withinDeadline(); unchanged(expected)
              record.timings.beforeCreate = tick()
              const canvas = document.createElement('canvas')
              // Never acquire ownership of a source or an already-owned canvas.
              check(object(canvas) && canvas !== expected.source && !owned.some(item => item.canvas === canvas),
                'Destination identity reused/source alias')
              item = { canvas, context: null, bytes: 0, released: false, record, slot, arm }
              owned.push(item); result.allocations++
              // Register a verified private destination before any fallible timer.
              record.timings.afterCreate = tick()
              check(result.allocations <= 8, 'Destination allocation cap exceeded')
              record.timings.beforeSize = tick()
              canvas.width = clip.width; canvas.height = clip.height
              item.bytes = clip.width * clip.height * 4
              result.nominalBackingBytes += item.bytes
              result.peakNominalBackingBytes = Math.max(result.peakNominalBackingBytes, result.nominalBackingBytes)
              record.timings.afterSize = tick()
              check(canvas.width === clip.width && canvas.height === clip.height &&
                result.nominalBackingBytes <= 2097152, 'Destination size/backing cap exceeded')
              record.timings.beforeContext = tick()
              const context = arm === 'A' ? canvas.getContext('2d') : canvas.getContext('2d', { willReadFrequently: true })
              record.timings.afterContext = tick()
              check(object(context) && !seenContexts.has(context), 'Null/reused 2D context')
              item.context = context; seenContexts.add(context)
              check(context.isContextLost?.() !== true, 'Destination context lost')
              withinDeadline(); unchanged(expected)
              result.drawCalls++
              check(result.drawCalls <= 8, 'Draw call cap exceeded')
              record.timings.beforeDraw = tick()
              try { context.drawImage(expected.source, clip.x, clip.y, clip.width, clip.height, 0, 0, clip.width, clip.height) }
              finally {
                record.timings.afterDraw = tick()
                record.drawCallMs = record.timings.afterDraw - record.timings.beforeDraw
              }
              check(context.isContextLost?.() !== true, 'Destination context lost')
              unchanged(expected); withinDeadline()
            } catch (error) { record.error = reason(error); throw error }
            finally {
              record.timings.operationEnd = tick()
              record.copyMs = record.timings.beforeCreate === null ? null :
                (record.timings.afterDraw ?? record.timings.operationEnd) - record.timings.beforeCreate
              if (arm === 'A') pair.cropCopyMs = record.copyMs
              else pair.candidateCopyMs = record.copyMs
            }
          }
          pair.status = 'copied'
          return { reserved: true, slot, status: pair.status, cropCopyMs: pair.cropCopyMs }
        } catch (error) { pair.status = 'failed'; pair.error = reason(error); throw error }
        finally { pair.pairEndMs = tick(); pair.pairMs = pair.pairEndMs - pair.pairStartMs; capturing = false }
      } catch (error) { capturing = false; return fail(error) }
    }
    function retentionGuard(signal) {
      assertRetentionOwnership?.()
      check(!retentionInvalidated, 'Retention invalidated by cleanup/disposal')
      check(!signal?.aborted, 'Retention aborted')
      withinDeadline()
    }
    async function digest(bytes, signal) {
      retentionGuard(signal)
      if (!crypto) return null // Explicitly unrequested, never an invented digest.
      result.digestOutstanding = true
      let timer, onAbort, onInvalidated
      const pending = Promise.resolve().then(() => {
        retentionGuard(signal)
        return crypto.subtle.digest('SHA-256', bytes)
      })
      // A timed-out WebCrypto call cannot be cancelled. It is never retried, its
      // late result is ignored, and cleanup stays unconfirmed until it settles.
      pending.then(() => { result.digestOutstanding = false; cleanupStatus() },
        () => { result.digestOutstanding = false; cleanupStatus() })
      try {
        const output = await Promise.race([pending, new Promise((resolve, reject) => {
          onInvalidated = error => reject(error)
          cancelDigest = onInvalidated
          timer = setTimer(() => reject(Error('Original deadline exhausted during digest')), Math.max(0, deadline - tick()))
          onAbort = () => reject(Error('Retention aborted'))
          signal?.addEventListener('abort', onAbort, { once: true })
          if (signal?.aborted) onAbort()
        })])
        retentionGuard(signal)
        check(output instanceof ArrayBuffer && output.byteLength === 32, 'Invalid SHA-256 output')
        return Array.from(new Uint8Array(output), byte => byte.toString(16).padStart(2, '0')).join('')
      } finally {
        if (cancelDigest === onInvalidated) cancelDigest = null
        try { if (timer !== undefined) clearTimer(timer) }
        finally { signal?.removeEventListener('abort', onAbort) }
      }
    }
    function cleanupStatus() {
      if (result.cleanup.attempted) result.cleanup.confirmed = result.cleanup.errors.length === 0 &&
        result.nominalBackingBytes === 0 && result.liveReadbackArrays === 0 && !result.digestOutstanding
    }
    function pngBytes(dataUrl) {
      check(typeof dataUrl === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/]*={0,2}$/.test(dataUrl), 'Invalid PNG encoding')
      const encoded = dataUrl.slice('data:image/png;base64,'.length)
      check(encoded.length > 0 && encoded.length % 4 === 0 && encoded.length <= 1398104, 'PNG encoding cap exceeded')
      const raw = atob(encoded), bytes = new Uint8Array(raw.length)
      for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index)
      check(bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte), 'Invalid PNG signature')
      return bytes
    }
    async function doRetain(signal) {
      result.retention = { startedMs: null, endedMs: null, done: false,
        status: 'running', digestRequested: crypto !== null, canonicalPngBytes: 0, sidecarPngBytes: 0,
        sidecarMetadataBytes: null, error: null }
      let a = null, b = null
      try {
        result.retention.startedMs = tick()
        check(stopped, 'Retention before observation stop')
        check(!result.cleanup.attempted, 'Copies already released')
        retentionGuard(signal)
        for (const pair of pairs) {
          if (pair.status !== 'copied') continue
          retentionGuard(signal)
          const entries = ['A', 'B'].map(arm => owned.find(item => item.slot === pair.slot && item.arm === arm))
          check(entries.every(item => item && !item.released && item.context), 'Missing private A/B copy')
          try {
            for (const [index, item] of entries.entries()) {
              check(item.canvas.width === pair.clip.width && item.canvas.height === pair.clip.height &&
                item.context.isContextLost?.() !== true, 'Retained copy size/context changed')
              const scanStarted = tick()
              const readback = item.context.getImageData(0, 0, pair.clip.width, pair.clip.height)
              const colors = new Set()
              for (let at = 0; at < readback.data.length; at += 4)
                if (readback.data[at + 3]) colors.add((readback.data[at] << 16) | (readback.data[at + 1] << 8) | readback.data[at + 2])
              item.record.opaqueColors = colors.size
              item.record.readbackScanMs = tick() - scanStarted
              item.record.readbackColorSpace = readback.colorSpace ?? null
              // Validate before accepting a supplied/browser readback result.
              compareRgba(readback, readback)
              check(readback.width === pair.clip.width && readback.height === pair.clip.height, 'Readback dimensions differ from copy')
              result.liveReadbackArrays++
              result.peakReadbackArrays = Math.max(result.peakReadbackArrays, result.liveReadbackArrays)
              check(result.liveReadbackArrays <= 2, 'Readback array cap exceeded')
              if (index === 0) a = readback
              else b = readback
              const rawPixelSha256 = await digest(readback.data, signal)
              retentionGuard(signal)
              item.record.rawPixelSha256 = rawPixelSha256
              const attributes = item.context.getContextAttributes?.()
              item.record.effectiveContextAttributes = attributes ? {
                alpha: attributes.alpha ?? null, colorSpace: attributes.colorSpace ?? null,
                colorType: attributes.colorType ?? null, desynchronized: attributes.desynchronized ?? null,
                willReadFrequently: attributes.willReadFrequently ?? null,
              } : { unavailable: true }
              item.record.hintReported = item.arm === 'B' ? attributes?.willReadFrequently === true : null
            }
            pair.comparison = compareRgba(a, b)
            pair.comparison.meaning = 'raw RGBA8 byte comparison only'
            const attrs = entries.map(item => item.record.effectiveContextAttributes)
            const knownAttributes = attributes => typeof attributes.alpha === 'boolean' &&
              attributes.colorSpace === 'srgb' && attributes.colorType === 'unorm8' &&
              typeof attributes.desynchronized === 'boolean' && typeof attributes.willReadFrequently === 'boolean'
            pair.contextAttributesCompatible = attrs.every(knownAttributes) && ['alpha', 'colorSpace', 'colorType', 'desynchronized'].every(key =>
              attrs[0][key] !== null && attrs[0][key] !== undefined && attrs[0][key] === attrs[1][key]) &&
              attrs[0].willReadFrequently === false && attrs[1].willReadFrequently === true
            pair.colorInterpretationMatches = pair.contextAttributesCompatible &&
              entries[0].record.readbackColorSpace !== null &&
              entries[0].record.readbackColorSpace === entries[1].record.readbackColorSpace &&
              entries.every(item => item.record.readbackColorSpace === item.record.effectiveContextAttributes.colorSpace)
            if (!pair.colorInterpretationMatches) noteFailure(`Unknown/mismatched color interpretation at slot ${pair.slot}`)
            if (!pair.comparison.equal) noteFailure(`RGBA mismatch at slot ${pair.slot}`)
            // Pixel comparison is independent of compressed PNG equality.
            for (const item of entries) {
              retentionGuard(signal)
              const encodingStarted = tick()
              const png = item.canvas.toDataURL('image/png'), bytes = pngBytes(png)
              item.record.encodingMs = tick() - encodingStarted
              retentionGuard(signal)
              const total = item.arm === 'A' ? 'canonicalPngBytes' : 'sidecarPngBytes'
              result.retention[total] += bytes.length
              check(result.retention[total] <= (item.arm === 'A' ? canonicalPngByteLimit : 8388608), 'PNG artifact budget exceeded')
              const pngSha256 = await digest(bytes, signal)
              retentionGuard(signal)
              item.record.pngSha256 = pngSha256
              item.record.png = png
            }
          } finally { a = null; b = null; result.liveReadbackArrays = 0; for (const item of entries) release(item) }
        }
        if (pairs.length !== 4 || pairs.some(pair => pair.status !== 'copied')) noteFailure('Incomplete four-slot diagnostic')
        // Count metadata without duplicating encoded PNG text. The future route
        // must count all actual sidecar files again before writing anything.
        const metadata = JSON.stringify(result, (key, value) => key === 'png' ? null : value)
        result.retention.sidecarMetadataBytes = new TextEncoder().encode(metadata).length
        check(result.retention.sidecarPngBytes + result.retention.sidecarMetadataBytes <= 8388608, 'Sidecar artifact budget exceeded')
        retentionGuard(signal)
        result.retention.status = result.firstError ? 'failed' : 'complete-comparison-only'
      } catch (error) {
        result.retention.error = reason(error); result.retention.status = 'failed'; noteFailure(error)
      } finally {
        a = null; b = null; result.liveReadbackArrays = 0
        // Cleanup and explicit completion evidence survive any timer failure,
        // including the entry timestamp and the final deadline check.
        cleanup({ invalidateRetention: false })
        try {
          result.retention.endedMs = tick()
          assertRetentionOwnership?.()
          check(result.retention.endedMs < deadline, 'Original deadline exhausted at retention completion')
          check(!retentionInvalidated, 'Retention invalidated by cleanup/disposal')
          check(!signal?.aborted, 'Retention aborted')
        } catch (error) {
          result.retention.error ??= reason(error)
          noteFailure(error)
        } finally {
          result.retention.done = true
          if (result.firstError) result.retention.status = 'failed'
        }
      }
      return report()
    }
    function retain({ signal } = {}) {
      // One attempt, including a premature/aborted/failed attempt. No new read,
      // encoding, or capture is possible on subsequent calls.
      if (!retentionPromise) retentionPromise = doRetain(signal)
      return retentionPromise
    }
    function report() { cleanupStatus(); return clone(result) }
    return Object.freeze({ capture, stop, retain, cleanup, report })
  }
  // No options returns the same factory for direct source controls. A browser
  // invocation supplies only JSON configuration and receives JSON metadata.
  if (options === null) return Object.freeze({ create, compareRgba })
  const namespace = '__pndMeleeCaptureDiagnostic'
  check(!Object.hasOwn(globalThis, namespace), 'Diagnostic namespace already occupied')
  check(object(options), 'Missing installer configuration')
  let scene = globalThis.window?.testSceneRef?.current
  let world = globalThis.window?.testStore?.getWorld()
  check(scene && world && scene.world === world, 'Missing original Scene/world')
  let source = scene.renderer.domElement
  const readState = () => {
    const currentScene = window.testSceneRef.current, currentWorld = window.testStore.getWorld()
    const actor = currentWorld?.units.find(unit => unit.id === 54), fight = actor?.fight
    return { scene: currentScene, world: currentWorld, source: currentScene?.renderer.domElement,
      person: fight?.motion, width: source.width, height: source.height,
      stamp: currentScene?.renderer.info.render.frame, turn: currentWorld?.turn,
      animationFrame: currentScene?.gameClock.animationFrame, actorId: actor?.id,
      actorKind: actor?.kind, actorTeam: actor?.team, hp: actor?.hp,
      started: fight?.started, opponent: fight?.opponent, fightGroup: fight?.group, action: fight?.action,
      speed: currentWorld?.speed, paused: currentWorld?.paused,
      visible: document.visibilityState === 'visible', connected: source.isConnected,
      sceneStoreMatch: currentScene === scene && currentWorld === world && currentScene.world === currentWorld &&
        currentScene.renderer.domElement === source,
      profile: options.sourceProfile, viewportWidth: innerWidth, viewportHeight: innerHeight, dpr: devicePixelRatio }
  }
  const select = () => {
    const rect = source.getBoundingClientRect(), bounds = scene.picking.personBounds(54, rect)
    if (!bounds || bounds.width <= 1 || bounds.height <= 1) return { eligible: false, reason: 'Missing first reserved bounds' }
    const scaleX = source.width / rect.width, scaleY = source.height / rect.height
    const x = Math.max(0, Math.floor((bounds.x - 12) * scaleX))
    const y = Math.max(0, Math.floor((bounds.y - 12) * scaleY))
    const width = Math.min(256, source.width - x, Math.ceil((bounds.width + 24) * scaleX))
    const height = Math.min(256, source.height - y, Math.ceil((bounds.height + 24) * scaleY))
    if (width <= 1 || height <= 1) return { eligible: false, reason: 'Missing first reserved crop' }
    const clip = { x: rect.left + x / scaleX, y: rect.top + y / scaleY, width: width / scaleX, height: height / scaleY }
    const owner = document.elementFromPoint(rect.left + bounds.x + bounds.width / 2, rect.top + bounds.y + bounds.height / 2)
    const overlays = [...document.querySelectorAll('.native-hud,.paused-badge,.campaign-messages summary,.campaign-messages details[open]>div,.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
      .filter(element => { const style = getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 })
      .map(element => { const r = element.getBoundingClientRect()
        return { tag: element.tagName, className: element.className, x: r.x, y: r.y, width: r.width, height: r.height } })
      .filter(r => r.width > 0 && r.height > 0 && r.x < clip.x + clip.width && r.x + r.width > clip.x &&
        r.y < clip.y + clip.height && r.y + r.height > clip.y)
    return { eligible: true, clip: { x, y, width, height }, visibility: {
      bodyCanvasOwned: owner === source,
      bodyInCanvas: bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= rect.width && bounds.y + bounds.height <= rect.height,
      cropOverlayClear: overlays.length === 0,
      cropVisibility: { bodyBounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        canvasRect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        bodyOwner: { tag: owner?.tagName, className: owner?.className }, clip, overlays } } }
  }
  check(options.requestDigests === false || options.requestDigests === true, 'Explicit digest selection required')
  if (options.requestDigests) check(typeof globalThis.crypto?.subtle?.digest === 'function', 'WebCrypto unavailable')
  const probe = create({ document, now: () => performance.now(), readState,
    routeStartMs: options.routeStartMs, caseStartMs: options.caseStartMs,
    launcherDeadlineMs: options.launcherDeadlineMs, episodeId: options.episodeId,
    canonicalPngByteLimit: options.canonicalPngByteLimit,
    crypto: options.requestDigests === true ? globalThis.crypto : null,
    setTimer: globalThis.setTimeout, clearTimer: globalThis.clearTimeout,
    assertRetentionOwnership: () => requireOwner() })
  let disposed = false, disposal = null
  const requireOwner = () => {
    if (disposed || globalThis[namespace] !== ownedInstance) {
      if (!disposed) ownedInstance.dispose()
      throw Error('Diagnostic namespace ownership changed or disposed')
    }
  }
  const ownedInstance = Object.freeze({
    stop(terminal) { requireOwner(); return probe.stop(terminal) },
    retain(input) { requireOwner(); return probe.retain(input) },
    report() { requireOwner(); return probe.report() },
    capture(sample) { requireOwner(); return probe.capture(sample, select) },
    dispose() {
      if (disposed) {
        // Idempotent disposal can report a formerly pending native digest's
        // settlement without repeating any release or retention operation.
        disposal.cleanup = probe.cleanup()
        return clone(disposal)
      }
      disposed = true
      const namespaceOwned = globalThis[namespace] === ownedInstance
      let stopError = null, cleanup
      try { probe.stop({ reason: 'disposed' }) }
      catch (error) { stopError = reason(error) }
      finally {
        try { cleanup = probe.cleanup() }
        finally {
          // A retained old instance cannot keep the original app references.
          scene = null; world = null; source = null
          if (namespaceOwned) delete globalThis[namespace]
        }
      }
      disposal = { cleanup, namespaceOwned, removed: namespaceOwned, sourceAliasesCleared: true,
        error: stopError ?? (namespaceOwned ? null : 'Diagnostic namespace ownership changed') }
      return clone(disposal)
    }
  })
  Object.defineProperty(globalThis, namespace, { value: ownedInstance, configurable: true, enumerable: false })
  return { installed: true, namespace, episodeId: options.episodeId, runtimeAdmitted: false }
}
