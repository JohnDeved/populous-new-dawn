// Verification-only context resolution. These source-owned synchronizers can
// mutate their input, so they receive only a detached clone, never the live World.
import { liveCommandContext } from '../../app/live-command.ts'
import { syncNativeTerrain, syncLandscapeObjects } from '../../app/world-terrain-runtime.ts'

export function createMoveContextProbe(world) {
  const probe = structuredClone(world)
  syncNativeTerrain(probe)
  syncLandscapeObjects(probe)
  return point => {
    const context = liveCommandContext(probe, point)
    return { model: context?.model ?? null, enabled: context?.enabled === true,
      buildingId: context?.building?.id ?? null, personId: context?.person?.id ?? null,
      shrineId: context?.shrine?.id ?? null, treeId: context?.tree?.id ?? null,
      vehicleId: context?.vehicle?.id ?? null }
  }
}

export const isOrdinaryMoveContext = context => context?.model === 3 && context.enabled === true

// Integer pixels and a 5x5 same-object neighborhood avoid choosing the first
// fractional silhouette edge. This is picking evidence, not command acceptance.
export function findEntityInput(candidates, id, inspect) {
  const visited = new Set(), cache = new Map()
  const at = (x, y) => {
    const key = `${x},${y}`
    if (!cache.has(key)) cache.set(key, inspect({ x, y }))
    return cache.get(key)
  }
  for (const candidate of candidates) {
    const x = Math.round(candidate.x), y = Math.round(candidate.y), key = `${x},${y}`
    if (!Number.isFinite(x) || !Number.isFinite(y) || visited.has(key)) continue
    visited.add(key)
    let interior = true
    for (let dy = -2; dy <= 2 && interior; dy++) for (let dx = -2; dx <= 2; dx++) {
      const sample = at(x + dx, y + dy)
      if (!sample.canvasOwned || sample.hitId !== id) { interior = false; break }
    }
    if (interior) return { x, y, interiorRadius: 2 }
  }
  return null
}

export function inspectEntityPoint(scene, collection, point, doc = document) {
  const event = { clientX: point.x, clientY: point.y }
  const canvasOwned = doc.elementFromPoint(point.x, point.y) === scene.renderer.domElement
  if (!canvasOwned) return { ...point, canvasOwned, hitId: null }
  // pointerDown can select a friendly person before pointerUp orders an object.
  const selectable = scene.pickUnit(event)?.id ?? null
  const person = scene.picking.pickPerson(event)
  const object = scene.pickWorldObject(event)?.id ?? null
  return { ...point, canvasOwned, hitId: collection === 'units' ? person : selectable ?? person ?? object }
}

export function requireEntityContext(hit, observed, before) {
  if (!Number.isInteger(observed.turn) || observed.turn < before.turn || observed.targetId !== hit.id ||
    JSON.stringify(observed.selected) !== JSON.stringify(before.selected) ||
    !Number.isInteger(observed.context?.model) || observed.context.enabled !== true)
    throw Error('Entity target has no fresh enabled detached-clone command context')
}

// Observe the delivered events and the real handler's picker calls. No diagnostic
// picker or clone work runs ahead of that handler. Each wrapper calls its original
// exactly once with the same receiver/arguments and returns the original result.
export function observeEntityPointer(scene, doc = document) {
  const canvas = scene.renderer.domElement, events = [], errors = [], wrappers = []
  let active = null
  const begin = event => {
    try {
      active = { type: event.type, turn: scene.world.turn, x: event.clientX, y: event.clientY,
        button: event.button, buttons: event.buttons, trusted: event.isTrusted,
        canvasTarget: event.target === canvas,
        canvasOwned: doc.elementFromPoint(event.clientX, event.clientY) === canvas, picks: [] }
      events.push(active)
    } catch (error) { active = null; errors.push(String(error)) }
  }
  const end = () => { active = null }
  for (const [owner, name] of [[scene, 'pickUnit'], [scene.picking, 'pickPerson'], [scene, 'pickWorldObject']]) {
    const original = owner[name]
    const wrapper = function (...args) {
      const result = original.apply(this, args)
      if (active) try { active.picks.push({ name, id: typeof result === 'number' ? result : result?.id ?? null }) }
      catch (error) { errors.push(String(error)) }
      return result
    }
    wrappers.push({ owner, name, original, wrapper }); owner[name] = wrapper
  }
  for (const name of ['pointerdown', 'pointerup']) {
    canvas.addEventListener(name, begin, true)
    canvas.addEventListener(name, end, false)
  }
  return { finish() {
    for (const name of ['pointerdown', 'pointerup']) {
      canvas.removeEventListener(name, begin, true)
      canvas.removeEventListener(name, end, false)
    }
    for (const { owner, name, original, wrapper } of wrappers) {
      if (owner[name] !== wrapper) errors.push(`Unexpected replacement of ${name}`)
      else owner[name] = original
    }
    active = null
    return { events, errors, restored: wrappers.every(({ owner, name, original }) => owner[name] === original) }
  } }
}
