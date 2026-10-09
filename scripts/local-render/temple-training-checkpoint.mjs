import { migrateCheckpoint } from '../../app/game-store.ts'
import { checkpointObservation } from './checkpoint-observer.mjs'

// Only the selected Temple/trainee's small plain-data snapshot may leave this
// observer. In particular, never expose the privately retained checkpoint World.
function targetCopy(value, world) {
  let nodes = 0,
    characters = 0
  const seen = new Set()
  const copy = (value, depth = 0) => {
    if (++nodes > 2048 || depth > 16 || value === world)
      throw Error('Temple target snapshot exceeds bounds or exposes the World')
    if (
      value === null ||
      value === undefined ||
      typeof value === 'boolean' ||
      typeof value === 'number'
    )
      return value
    if (typeof value === 'string') {
      if ((characters += value.length) > 65536) throw Error('Temple target snapshot exceeds bounds')
      return value
    }
    if (
      typeof value !== 'object' ||
      seen.has(value) ||
      (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)
    )
      throw Error('Temple target snapshot must be acyclic plain data')
    const keys = Object.keys(value)
    if (
      (Array.isArray(value) ? value.length : keys.length) > 2048 ||
      (characters += keys.reduce((sum, key) => sum + key.length, 0)) > 65536
    )
      throw Error('Temple target snapshot exceeds bounds')
    seen.add(value)
    const result = Array.isArray(value)
      ? value.map(child => copy(child, depth + 1))
      : Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, copy(child, depth + 1)])
        )
    seen.delete(value)
    return result
  }
  return copy(value)
}

// The unchanged public encoder reads observationName before its first await.
// A unique, non-enumerable getter exists only for that synchronous call; it is
// removed before any digest continuation or caller can observe the returned API.
function observePrivate(record) {
  const name = Symbol('Temple checkpoint digest'),
    getter = () => record
  Object.defineProperty(globalThis, name, { configurable: true, get: getter })
  try {
    return checkpointObservation({ observationName: name })
  } finally {
    if (Object.getOwnPropertyDescriptor(globalThis, name)?.get === getter) delete globalThis[name]
  }
}

// This helper observes the shipped Save/Load handlers. It never invokes them,
// changes the store, installs a Scene, writes storage, or advances the game.
export function armTempleCheckpoint({ kind, store, button, snapshot }) {
  if (
    !['save', 'load'].includes(kind) ||
    typeof snapshot !== 'function' ||
    typeof store?.getWorld !== 'function' ||
    typeof store?.subscribe !== 'function' ||
    typeof button?.addEventListener !== 'function' ||
    typeof button?.removeEventListener !== 'function' ||
    !button.isConnected ||
    button.disabled
  )
    throw Error('Available public Temple Save/Load controls and store required')
  const getWorld = store.getWorld,
    subscribe = store.subscribe,
    add = button.addEventListener,
    remove = button.removeEventListener,
    prior = getWorld.call(store),
    evidence = {
      kind,
      trusted: false,
      captured: false,
      closed: false,
      publications: 0,
      click: null,
      publication: null,
      errors: [],
      errorCount: 0,
      cleanup: { listener: false, subscription: false },
    }
  let record = null,
    unsubscribe = null,
    listening = false,
    pending = false,
    attempted = false,
    eventInFlight = null,
    expiry = null,
    subscriptionAttempted = false
  const error = value => {
    evidence.errorCount++
    if (evidence.errors.length < 16)
      evidence.errors.push(String(value?.stack ?? value).slice(0, 2048))
  }
  const status = () => structuredClone(evidence)
  const finishWindow = () => {
    pending = false
    eventInFlight = null
    clearTimeout(expiry)
    expiry = null
  }
  const readTarget = (phase, world) => ({
    turn: world.turn,
    paused: world.paused,
    target: targetCopy(snapshot({ phase, kind, world }), world),
  })
  function capture(event) {
    if (evidence.closed) return
    try {
      if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
        throw Error('Trusted public Temple checkpoint click required')
      if (attempted) throw Error('Temple checkpoint observation accepts only one trusted click')
      attempted = true
      if (!button.isConnected || button.disabled || getWorld.call(store) !== prior)
        throw Error('Temple checkpoint control or World changed before input')
      evidence.trusted = true
      evidence.click = readTarget('click', prior)
      pending = true
      eventInFlight = event
      // Native dispatch can run microtasks between capture and React's bubble
      // listener. Check the real event phase at publication; expire next task.
      expiry = setTimeout(() => {
        if (!pending || evidence.closed) return
        finishWindow()
        error(Error('No synchronous Temple checkpoint publication followed the trusted click'))
      }, 0)
    } catch (value) {
      error(value)
    }
  }
  function publication() {
    if (!pending || evidence.closed || evidence.captured) return
    try {
      evidence.publications++
      if (!eventInFlight.eventPhase)
        throw Error('Temple checkpoint publication occurred after click dispatch')
      const world = getWorld.call(store)
      if (kind === 'load' && world === prior) return
      finishWindow()
      if (kind === 'save' && world !== prior) throw Error('Save replaced the Temple World')
      // Save publishes after its normalization/clone; Load publishes the migrated
      // replacement before Page's separate unpause. Freeze exactly that boundary.
      record = { version: 1, world: structuredClone(world) }
      evidence.publication = readTarget('publication', world)
      evidence.captured = true
    } catch (value) {
      finishWindow()
      error(value)
    }
  }
  const close = () => {
    if (evidence.closed) return status()
    evidence.closed = true
    if (pending) error(Error('Temple checkpoint closed before its synchronous publication'))
    finishWindow()
    // Each owned resource gets an independent cleanup attempt. Captured methods
    // keep their receiver; foreign replacements/listeners are never overwritten.
    try {
      if (listening) remove.call(button, 'click', capture, true)
      evidence.cleanup.listener = true
    } catch (value) {
      error(value)
    }
    try {
      if (subscriptionAttempted && typeof unsubscribe !== 'function')
        throw Error('Temple subscription cleanup unavailable')
      if (unsubscribe) unsubscribe()
      evidence.cleanup.subscription = true
    } catch (value) {
      error(value)
    }
    return status()
  }
  try {
    listening = true
    add.call(button, 'click', capture, true)
    subscriptionAttempted = true
    unsubscribe = subscribe.call(store, publication)
    if (typeof unsubscribe !== 'function') throw Error('Temple store subscription has no cleanup')
  } catch (value) {
    error(value)
    close()
  }
  const requireCapture = () => {
    if (!evidence.captured || evidence.errorCount)
      throw Error('Temple checkpoint boundary is missing or has observation errors')
    return record
  }
  return {
    status,
    async digest() {
      return observePrivate(requireCapture())
    },
    async expectedLoadDigest() {
      if (kind !== 'save') throw Error('Expected Load requires a Save capture')
      const saved = requireCapture()
      return observePrivate({
        version: saved.version,
        world: migrateCheckpoint(structuredClone(saved.world)),
      })
    },
    close,
  }
}
