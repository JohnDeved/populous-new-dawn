// Passive observation of the actual Page -> Scene request and elapsed dispatch.
// This helper never invokes a game action, writes a World or changes a clock.
export function createNearbyFollowerWitness({ scene, store, read, root, maxEvents = 128, maxBytes = 2 * 1024 * 1024 }) {
  if (
    !scene?.isCurrent?.() || scene.world !== store?.getWorld?.() ||
    typeof read !== 'function' || !root?.addEventListener ||
    !Number.isInteger(maxEvents) || maxEvents < 1 || !Number.isInteger(maxBytes) || maxBytes < 262144
  ) throw Error('Current nearby Scene/store, snapshot and event root required')
  const world = scene.world, records = [], errors = [], restorers = [], listeners = [],
    counters = { requests: 0, commits: 0, selections: 0, cancellations: 0 },
    clock = { calls: 0, first: null, last: null },
    add = root.addEventListener, remove = root.removeEventListener,
    sizes = new Map(), size = value => new TextEncoder().encode(JSON.stringify(value)).length
  let closed = false, exported = false, phase = 'entry', event = null, request = null, selection = null,
    overflow = false, errorCount = 0, ordinal = 0, recordBytes = 0, terminal = null, sealed = null
  const error = value => {
    errorCount++
    errors.push(String(value?.stack ?? value).slice(0, 2048))
    if (!closed) close()
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
    const bytes = size(row)
    if (recordBytes + bytes > maxBytes - 131072) {
      overflow = true
      throw Error('Nearby complete-export byte budget exhausted')
    }
    recordBytes += bytes
    sizes.set(row, bytes)
    records.push(row)
    return row
  }
  const patch = (row, fields) => {
    const bytes = size({ ...row, ...fields }), next = recordBytes - sizes.get(row) + bytes
    if (next > maxBytes - 131072) {
      overflow = true
      throw Error('Nearby complete-export byte budget exhausted')
    }
    Object.assign(row, fields)
    recordBytes = next
    sizes.set(row, bytes)
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
      const row = observe(() => before?.(args, this))
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
    patch(row, { threw: failed, after: snapshot() })
  }
  const capture = value => { if (!closed) event = value }
  const release = value => { if (event === value) event = null }
  const captureTerminal = () => {
    const value = snapshot()
    if (recordBytes + size(value) > maxBytes - 65536) {
      overflow = true
      throw Error('Nearby terminal snapshot exceeds complete-export budget')
    }
    terminal = value
  }
  function seal(expected) {
    if (closed) {
      if (JSON.stringify(sealed) !== JSON.stringify(expected)) throw Error('Nearby endpoint was not sealed as declared')
      return status()
    }
    try {
      if (!Array.isArray(expected?.phases) || !expected.phases.length || typeof expected.nearby !== 'boolean')
        throw Error('Nearby endpoint requires declared phases and final mode')
      captureTerminal()
      let pending = null, last = null
      const phases = []
      for (const row of records) {
        if (row.threw) throw Error('Nearby action threw before endpoint')
        if (row.kind === 'request') {
          if (row.admitted) {
            if (pending) throw Error('Nearby endpoint has overlapping admitted requests')
            pending = row
          } else if (!pending) throw Error('Nearby endpoint has an unowned rejected request')
        } else if (row.kind === 'commit') {
          if (!pending || row.phase !== pending.phase || row.beforeFlags !== pending.before.flags ||
            row.after.nearby === pending.before.nearby || (row.beforeFlags ^ row.after.flags) !== 128)
            throw Error('Nearby endpoint has an unjoined commitment')
          phases.push(row.phase)
          pending = null
          last = row
        }
      }
      if (pending || !last || phases.length !== counters.commits ||
        JSON.stringify(phases) !== JSON.stringify(expected.phases) ||
        terminal.nearby !== expected.nearby || terminal.nearby !== last.after.nearby)
        throw Error('Nearby endpoint has unfinished requests, wrong phases or wrong final mode')
      sealed = structuredClone(expected)
    } catch (failure) { error(failure) }
    return close()
  }
  function close() {
    if (closed) return status()
    closed = true
    if (!errorCount && !terminal) {
      try { captureTerminal() } catch (failure) { error(failure) }
    }
    event = null
    request = null
    selection = null
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
      ...counters, clock: { ...clock }, records: records.length, recordBytes, maxBytes, phase,
      terminalMode: terminal?.nearby, terminalTurn: terminal?.turn, sealed }
  }
  try {
    wrap('requestNearbyFollowers', () => {
      counters.requests++
      return request = append({ kind: 'request', input: input(), before: snapshot(), cues: [] })
    }, (row, args, result, failed) => {
      finish(row, failed)
      if (row) patch(row, { admitted: result })
      request = null
    })
    wrap('onSound', args => {
      if (request && [0x6e, 0x6f].includes(args[0])) {
        if (request.cues.length >= 8) throw Error('Unexpected nearby cue repetition')
        patch(request, { cues: [...request.cues, { cue: args[0], attenuation: args[1], pan: args[2] }] })
      }
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
      return selection = append({ kind: 'selection', input: input(), focusCalls: [],
        command: { model: args[0], shift: !!args[1]?.shiftKey,
          ctrl: !!args[1]?.ctrlKey, focus: !!args[2], category: args[3] ?? null },
        before: snapshot() })
    }, (row, args, result, failed) => { finish(row, failed); selection = null })
    wrap('focus', (args, receiver) => {
      if (!selection) return
      if (selection.focusCalls.length) throw Error('Unexpected repeated follower focus call')
      patch(selection, { focusCalls: [{ point: structuredClone(args[0]),
        options: structuredClone(args[1]), receiverMatches: receiver === scene }] })
    })
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
    seal,
    take(expected) {
      if (exported) throw Error('Nearby terminal evidence already exported')
      if (expected) {
        try { seal(expected) } catch (failure) { error(failure) }
      }
      close()
      exported = true
      const result = structuredClone({ ...status(), records, terminal })
      if (size(result) > maxBytes) throw Error('Nearby complete export exceeds byte cap')
      return result
    },
  }
}
