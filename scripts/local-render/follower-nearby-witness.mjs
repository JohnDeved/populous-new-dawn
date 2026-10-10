// Passive observation of the actual Page -> Scene request and elapsed dispatch.
// This helper never invokes a game action, writes a World or changes a clock.
export function createNearbyFollowerWitness({ scene, store, read, root, maxEvents = 128 }) {
  if (
    !scene?.isCurrent?.() || scene.world !== store?.getWorld?.() ||
    typeof read !== 'function' || !root?.addEventListener ||
    !Number.isInteger(maxEvents) || maxEvents < 1
  ) throw Error('Current nearby Scene/store, snapshot and event root required')
  const world = scene.world, records = [], errors = [], restorers = [], listeners = [],
    counters = { requests: 0, commits: 0, selections: 0, cancellations: 0 },
    clock = { calls: 0, first: null, last: null },
    add = root.addEventListener, remove = root.removeEventListener
  let closed = false, exported = false, phase = 'entry', event = null, request = null,
    overflow = false, errorCount = 0, ordinal = 0
  const error = value => {
    errorCount++
    if (errors.length < 16) errors.push(String(value?.stack ?? value).slice(0, 2048))
  }
  const observe = action => {
    if (closed) return
    try { return action() } catch (failure) { error(failure) }
  }
  const owner = () => {
    if (!scene.isCurrent() || scene.world !== world || store.getWorld() !== world)
      throw Error('Nearby observation Scene/World owner changed')
  }
  const snapshot = () => {
    owner()
    return structuredClone(read(scene, store))
  }
  const append = row => {
    if (records.length >= maxEvents) {
      overflow = true
      throw Error('Nearby meaningful-event budget exhausted')
    }
    row.ordinal = ++ordinal
    row.phase = phase
    records.push(row)
    return row
  }
  const input = () => event?.eventPhase ? {
    type: event.type, trusted: event.isTrusted, phase: event.eventPhase,
    button: event.button ?? null, detail: event.detail ?? null,
    key: event.key ?? null, repeat: !!event.repeat,
    ctrl: !!event.ctrlKey, shift: !!event.shiftKey,
    label: event.target?.closest?.('button')?.getAttribute('aria-label') ?? null,
  } : null
  function wrap(name, before, after) {
    const descriptor = Object.getOwnPropertyDescriptor(scene, name), original = scene[name]
    if (typeof original !== 'function') throw Error(`Actual Scene.${name} unavailable`)
    function wrapped(...args) {
      const row = observe(() => before?.(args))
      let result, failed = false, thrown
      try { result = original.apply(this, args) }
      catch (failure) { failed = true; thrown = failure }
      observe(() => after?.(row, args, result, failed))
      if (failed) throw thrown
      return result
    }
    scene[name] = wrapped
    restorers.push(() => {
      if (scene[name] !== wrapped) throw Error(`Scene.${name} observation ownership changed`)
      if (descriptor) Object.defineProperty(scene, name, descriptor)
      else delete scene[name]
    })
  }
  const finish = (row, failed) => {
    if (!row) return
    row.threw = failed
    row.after = snapshot()
  }
  const capture = value => { if (!closed) event = value }
  const release = value => { if (event === value) event = null }
  function close() {
    if (closed) return status()
    closed = true
    event = null
    request = null
    for (const args of listeners) {
      try { remove.call(root, ...args) } catch (failure) { error(failure) }
    }
    for (const restore of restorers.toReversed()) {
      try { restore() } catch (failure) { error(failure) }
    }
    return status()
  }
  function status() {
    return { closed, exported, overflow, errorCount, errors: [...errors],
      ...counters, clock: { ...clock }, records: records.length, phase }
  }
  try {
    wrap('requestNearbyFollowers', () => {
      counters.requests++
      return request = append({ kind: 'request', input: input(), before: snapshot(), cues: [] })
    }, (row, args, result, failed) => {
      finish(row, failed)
      if (row) row.admitted = result
      request = null
    })
    wrap('onSound', args => {
      if (request && [0x6e, 0x6f].includes(args[0]))
        request.cues.push({ cue: args[0], attenuation: args[1], pan: args[2] })
    })
    wrap('dispatchNearbyFollowers', args => {
      clock.calls++
      clock.first ??= args[0]
      clock.last = args[0]
      return { flags: world.castingTribes[0].flags }
    },
      (before, args, result, failed) => {
        if (!before || before.flags === world.castingTribes[0].flags) return
        counters.commits++
        append({ kind: 'commit', now: args[0], beforeFlags: before.flags,
          after: snapshot(), threw: failed })
      })
    wrap('chooseFollowers', args => {
      counters.selections++
      return append({ kind: 'selection', input: input(),
        command: { model: args[0], shift: !!args[1]?.shiftKey,
          ctrl: !!args[1]?.ctrlKey, focus: !!args[2], category: args[3] ?? null },
        before: snapshot() })
    }, (row, args, result, failed) => finish(row, failed))
    wrap('cancelNearbyFollowers', () => { counters.cancellations++ })
    for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click', 'contextmenu', 'keydown', 'keyup'])
      for (const [callback, capturing] of [[capture, true], [release, false]]) {
        const args = [type, callback, capturing]
        listeners.push(args)
        add.call(root, ...args)
      }
  } catch (failure) {
    error(failure)
    close()
  }
  return {
    status,
    mark(name) {
      if (closed || typeof name !== 'string' || name.length > 80) throw Error('Invalid nearby phase')
      owner()
      phase = name
      return status()
    },
    snapshot,
    close,
    take() {
      if (exported) throw Error('Nearby terminal evidence already exported')
      close()
      exported = true
      return structuredClone({ ...status(), records })
    },
  }
}
