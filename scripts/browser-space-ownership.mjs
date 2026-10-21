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
    records.push(record)
    queueMicrotask(() => {
      record.prevented = event.defaultPrevented
      record.after = read()
      record.sameWorld = !!originalWorld && originalWorld === world()
    })
  }
  const stop = () => window.removeEventListener('keydown', listener, true)
  window.addEventListener('keydown', listener, true)
  const timer = setTimeout(stop, timeout)
  window[id] = () => { clearTimeout(timer); stop(); delete window[id]; return records }
}

export function endSpaceOwnership(id) {
  return window[id]?.() ?? []
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
export async function pressObservedSpace(page, { timeout }) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid Space ownership timeout')
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
    installed = true
    await bounded(page.evaluate(beginSpaceOwnership, { id, timeout }))
    if (!remaining()) throw Error('Space ownership input timed out')
    await bounded(page.keyboard.press('Space'))
  } catch (error) { primary = error }
  finally {
    clearTimeout(timer)
    if (installed) {
      const cleanup = page.evaluate(endSpaceOwnership, id)
      if (!remaining()) { void cleanup.catch(() => {}); primary ??= Error('Space ownership input timed out') }
      else try {
        records = await bounded(cleanup)
      } catch (error) { primary ??= error }
      finally { clearTimeout(timer) }
    }
  }
  if (primary) throw primary
  return records
}
