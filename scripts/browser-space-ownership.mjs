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
  trace.keyDeliveryFailed = false
  const id = `__pndSpaceOwnership_${randomUUID()}`, deadline = performance.now() + timeout
  let timer, records, installed = false, primary
  const remaining = () => Math.max(0, deadline - performance.now())
  const bounded = async operation => {
    if (!remaining()) { void operation.catch(() => {}); throw Error('Space ownership input timed out') }
    try {
      return await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('Space ownership input timed out')), remaining())
      })])
    } finally { clearTimeout(timer) }
  }
  try {
    signal?.throwIfAborted()
    installed = true
    await bounded(page.evaluate(beginSpaceOwnership, { id, timeout }))
    signal?.throwIfAborted()
    if (!remaining()) throw Error('Space ownership input timed out')
    try { await bounded(page.keyboard.press('Space')) }
    catch (error) { trace.keyDeliveryFailed = true; throw error }
  } catch (error) { primary = error }
  finally {
    clearTimeout(timer)
    if (installed) {
      const cleanup = page.evaluate(snapshot ? endSpaceOwnershipSnapshot : endSpaceOwnership, id)
      if (!remaining()) { void cleanup.catch(() => {}); primary ??= Error('Space ownership input timed out') }
      else try {
        records = await bounded(cleanup)
      } catch (error) { primary ??= error }
      finally { clearTimeout(timer) }
    }
  }
  if (primary) throw primary
  return snapshot ? { ...records, witnessId: id } : records
}
