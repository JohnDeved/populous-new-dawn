import { controlSnapshot, activeCheckpointProjection } from './controls-evidence.mjs'

// Each original input picker/turn callback runs once. These observers never act.
export function observeControls(scene, observeEntityPointer, target = null, doc = document, win = window) {
  const world = scene.world, canvas = scene.renderer.domElement, events = [], turns = [], errors = []
  const clock = scene.gameClock
  const planned = ['beforeTurn', 'afterTurn'].map(key => {
    const descriptor = Object.getOwnPropertyDescriptor(clock, key)
    let inherited = descriptor, parent = clock
    while (!inherited && (parent = Object.getPrototypeOf(parent))) inherited = Object.getOwnPropertyDescriptor(parent, key)
    if (inherited && (!('value' in inherited) || inherited.value !== undefined && typeof inherited.value !== 'function')) throw Error(`Unsupported ${key} descriptor`)
    if (descriptor && !descriptor.configurable && !descriptor.writable || !descriptor && !Object.isExtensible(clock)) throw Error(`Cannot observe ${key}`)
    return { key, descriptor, original: inherited?.value }
  })
  const pointer = observeEntityPointer(scene, doc), hooks = []
  let current = null, finished = false, trackedId = null, retiredTurn = null
  const note = error => { if (errors.length < 16) errors.push(String(error?.stack ?? error)) }
  const before = event => {
    if (event.type === 'keydown' && !['Space', 'Escape', 'Digit1'].includes(event.code)) return
    try {
      if (events.length >= 32) throw Error('Control input observation bound exceeded')
      const person = target?.flight ?? target?.fight?.motion ?? target?.native ?? target?.entry?.person ?? target?.builder?.person
      current = { type: event.type, code: event.code ?? null, button: event.button ?? null,
        x: event.clientX ?? null, y: event.clientY ?? null, trusted: event.isTrusted,
        repeat: !!event.repeat, blockedTarget: !!event.target?.closest?.('button,input,dialog'),
        canvasOwned: event.target === canvas && doc.elementFromPoint(event.clientX, event.clientY) === canvas,
        observedAt: performance.now(), targetSame: !!target && world.units.find(unit => unit.id === target.id) === target,
        targetOwnerValid: !!person && person.class === 1 && !(person.flags2 & 1) && world.objectCells.objects.get(target.id) === person,
        before: controlSnapshot(world), after: null }
      events.push(current)
    } catch (error) { current = null; note(error) }
  }
  const after = event => {
    if (!current || current.type !== event.type) return
    try {
      current.after = controlSnapshot(world)
      if (trackedId === null && current.after.castCount === current.before.castCount + 1)
        trackedId = current.after.projectiles.find(shot => !current.before.projectiles.some(old => old.id === shot.id))?.id ?? null
    } catch (error) { note(error) }
    current = null
  }
  canvas.addEventListener('pointerup', before, true)
  canvas.addEventListener('pointerup', after, false)
  win.addEventListener('keydown', before, true)
  win.addEventListener('keydown', after, false)
  for (const { key, descriptor, original } of planned) {
    const wrapper = function (...args) {
      const capture = () => {
        if (finished || trackedId === null || retiredTurn !== null && world.turn > retiredTurn + 2) return
        try {
          if (turns.length >= 100) throw Error('Control turn observation bound exceeded')
          turns.push({ phase: key, state: controlSnapshot(world) })
          if (!world.projectiles.some(shot => shot.id === trackedId)) retiredTurn ??= world.turn
        } catch (error) { note(error) }
      }
      if (key === 'beforeTurn') capture()
      try { return original?.apply(this, args) }
      finally { if (key === 'afterTurn') capture() }
    }
    hooks.push({ key, descriptor, original, wrapper })
    Object.defineProperty(clock, key, descriptor ? { ...descriptor, value: wrapper } : { value: wrapper, configurable: true, enumerable: true, writable: true })
  }
  return {
    read: () => structuredClone({ events, turns, errors }),
    finish() {
      if (finished) throw Error('Control observer already finished')
      finished = true
      canvas.removeEventListener('pointerup', before, true); canvas.removeEventListener('pointerup', after, false)
      win.removeEventListener('keydown', before, true); win.removeEventListener('keydown', after, false)
      for (const { key, descriptor, wrapper } of hooks.reverse()) {
        if (clock[key] !== wrapper) { note(Error(`Foreign ${key} replacement preserved`)); continue }
        if (descriptor) Object.defineProperty(clock, key, descriptor)
        else delete clock[key]
      }
      const trace = pointer.finish()
      return structuredClone({ events, turns, errors, pointer: trace,
        cleanupVerified: hooks.every(({ key, original }) => clock[key] === original) && trace.restored })
    },
  }
}

// Existing checkpoint-observer policy: open only an already-existing DB and
// observe transaction completion. Nothing creates, clears or replaces storage.
export async function readActiveCheckpoint(targetId, database = indexedDB) {
  if (!(await database.databases()).some(entry => entry.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = database.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Checkpoint DB unexpectedly missing')) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    const saved = await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly'), request = transaction.objectStore('checkpoints').get('latest')
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? Error('Read-only checkpoint transaction aborted'))
    })
    if (saved?.version !== 1 || !saved.world) throw Error('No genuine version-1 checkpoint')
    return activeCheckpointProjection(saved.world, targetId)
  } finally { db.close() }
}
