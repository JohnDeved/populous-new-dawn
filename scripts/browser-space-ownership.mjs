import { randomUUID } from 'node:crypto'

// Observation only. Window capture runs before the document's native popup
// owner. Never prevent/stop an event, activate a control, or write game/DOM state.
export function beginSpaceOwnership({ id, timeout }) {
  const records = [], world = () => window.testStore?.getWorld() ?? window.testSceneRef?.current?.world
  const read = () => {
    const w = world()
    return w ? { paused: w.paused, inputMask: w.inputMask, flybyFlags: w.flyby.flags } : null
  }
  const listener = event => {
    if (event.code !== 'Space' || records.length >= 2) return
    const originalWorld = world(), record = { trusted: event.isTrusted, repeat: event.repeat,
      before: read(), owners: [...document.querySelectorAll('.campaign-messages details[open]')]
        .map(detail => detail.getAttribute('data-message-serial')) }
    // Keep the event/reference private until the post-keyboard evaluation. A
    // capture-listener microtask can run before later native listeners for a
    // trusted browser event and therefore cannot certify their final effect.
    records.push({ event, originalWorld, record })
  }
  const stop = () => {
    window.removeEventListener('keydown', listener, true)
    delete window[id]
    records.length = 0
  }
  window.addEventListener('keydown', listener, true)
  const timer = setTimeout(stop, timeout)
  window[id] = () => {
    clearTimeout(timer)
    try {
      return records.map(({ event, originalWorld, record }) => ({ ...record,
        prevented: event.defaultPrevented, after: read(),
        sameWorld: !!originalWorld && originalWorld === world() }))
    } finally { stop() }
  }
}

export function endSpaceOwnership(id) {
  return window[id]?.() ?? []
}

// Optional atomic post-dispatch observation for reviewed recovery callers. The
// listener is finalized first; the fresh native state is read in the same task,
// with no intervening public input or game/DOM write.
export function endSpaceOwnershipSnapshot(id) {
  const witness = window[id], records = witness?.() ?? []
  const world = window.testStore?.getWorld() ?? window.testSceneRef?.current?.world
  return { observationId: id, witnessPresent: typeof witness === 'function', records,
    state: world ? { paused: world.paused, inputMask: world.inputMask, flybyFlags: world.flyby.flags } : null }
}

export function popupRejectedSpace(records) {
  if (records.length !== 1) return false
  const { trusted, repeat, prevented, owners, before, after, sameWorld } = records[0]
  return trusted && !repeat && prevented && owners.length > 0 && sameWorld && !!before && !!after &&
    before.paused === after.paused && before.inputMask === after.inputMask && before.flybyFlags === after.flybyFlags
}

// Install before trusted input and remove even on delivery rejection. A stalled
// browser cannot certify cleanup; the in-page expiry and owning context teardown
// also release the passive listener. No cleanup wait extends the input deadline.
export async function pressObservedSpace(page, { timeout, signal, snapshot = false, trace = {} }) {
  if (typeof snapshot !== 'boolean') throw new RangeError('Invalid Space snapshot option')
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid Space ownership timeout')
  const started = performance.now()
  Object.assign(trace, { keyDeliveryFailed: false, phase: 'start', pending: false, completed: [] })
  const id = `__pndSpaceOwnership_${randomUUID()}`, deadline = started + timeout
  let timer, records, installed = false, primary
  const remaining = () => Math.max(0, deadline - performance.now())
  const bounded = async (name, operation) => {
    const startedMs = performance.now() - started
    Object.assign(trace, { phase: name, pending: true, phaseStartedMs: startedMs, phaseError: null })
    const settled = (status, error) => {
      const elapsedMs = performance.now() - started
      // A late prior RPC must not overwrite a newer cleanup operation's state.
      if (trace.phase === name && trace.phaseStartedMs === startedMs)
        Object.assign(trace, { pending: false, elapsedMs, phaseError: error ? String(error) : null })
      trace.completed.push({ phase: name, startedMs, finishedMs: elapsedMs, status })
    }
    const observed = operation.then(value => { settled('fulfilled'); return value },
      error => { settled('rejected', error); throw error })
    if (!remaining()) { void observed.catch(() => {}); throw Error('Space ownership input timed out') }
    try {
      return await Promise.race([observed, new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('Space ownership input timed out')), remaining())
      })])
    } finally { clearTimeout(timer) }
  }
  try {
    signal?.throwIfAborted()
    installed = true
    await bounded('install-space-witness', page.evaluate(beginSpaceOwnership, { id, timeout }))
    signal?.throwIfAborted()
    if (!remaining()) throw Error('Space ownership input timed out')
    try { await bounded('public-space-key', page.keyboard.press('Space')) }
    catch (error) { trace.keyDeliveryFailed = true; throw error }
  } catch (error) { primary = error }
  finally {
    clearTimeout(timer)
    if (installed) {
      const cleanup = page.evaluate(snapshot ? endSpaceOwnershipSnapshot : endSpaceOwnership, id)
      if (!remaining()) { void cleanup.catch(() => {}); primary ??= Error('Space ownership input timed out') }
      else try {
        records = await bounded('finalize-space-witness', cleanup)
      } catch (error) { primary ??= error }
      finally { clearTimeout(timer) }
    }
  }
  if (primary) throw primary
  return snapshot ? { ...records, witnessId: id } : records
}
