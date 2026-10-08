// Passive setup telemetry only. No game/runtime imports, stepping or input dispatch.
// The setup observer writes only its two callback wrappers. Release diagnostics below separately declare their picker-cache effects.
const scalar = value => ['string', 'boolean'].includes(typeof value) || Number.isFinite(value) ? value : null
const fields = (object, names) => Object.fromEntries(names.map(name => [name, scalar(object?.[name])]))
const sources = unit => [['flight', unit?.flight], ['fight', unit?.fight?.motion], ['native', unit?.native], ['entry', unit?.entry?.person], ['builder', unit?.builder?.person]]
const ownDescriptor = (object, key) => Object.getOwnPropertyDescriptor(object, key)
const equalDescriptor = (a, b) => a === b || !!a && !!b &&
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => key in b && a[key] === b[key])

export function observeBlastSetup(scene, actor, {
  capacity = 96,
  getScene = () => globalThis.window?.testSceneRef?.current,
  getWorld = () => globalThis.window?.testStore?.getWorld?.(),
  currentOrder = (world, person) => {
    const id = person?.immediateCommand || person?.commands?.[person.commandCursor]
    return id ? world.buildingOrders?.records?.[id] : undefined
  },
} = {}) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 96) throw Error('Setup telemetry capacity must be 1..96')
  const world = scene.world, clock = scene.gameClock, canvas = scene.renderer?.domElement
  const originalId = actor?.id ?? null, recent = [], errors = [], hooks = [], cleanup = []
  let sequence = 0, totalBoundaries = 0, dropped = 0, errorCount = 0, latest = null, firstFailure = null, finished = false
  const noteError = (stage, error) => {
    errorCount++
    let message
    try { message = String(error?.stack ?? error) } catch { message = 'Unreadable telemetry error' }
    errors.push({ stage, message }); if (errors.length > 32) errors.shift()
  }
  const describe = unit => {
    if (!unit) return null
    const owners = sources(unit), active = owners.find(([, p]) => p), person = active?.[1]
    const registration = world.objectCells?.objects?.get(unit.id), commandId = person?.immediateCommand || person?.commands?.[person.commandCursor] || 0
    const order = person ? currentOrder(world, person) : null
    return {
      ...fields(unit, ['id', 'team', 'kind', 'hp', 'x', 'z', 'heading', 'lift', 'inside', 'work', 'target', 'fighting', 'damageAttacker']),
      present: world.units.includes(unit),
      pose: person ? { owner: active[0], ...fields(person, ['id', 'class', 'model', 'tribe', 'x', 'y', 'h', 'angle', 'heading', 'state', 'substate', 'speed', 'life', 'flags2', 'flags3', 'flags4', 'damageAttacker', 'commandCursor', 'commandStatus', 'workTarget', 'immediateCommand']) } : null,
      order: order ? { id: commandId, ...fields(order, ['model', 'flags', 'references', 'object', 'a', 'b']) } : null,
      fight: unit.fight ? fields(unit.fight, ['group', 'opponent', 'action', 'started', 'remaining', 'animation', 'knockback']) : null,
      registration: { present: !!registration, sameId: registration?.id === unit.id,
        activeOwnerMatches: !!person && registration === person,
        owners: owners.filter(([, p]) => p && registration === p).map(([name]) => name),
        record: registration ? fields(registration, ['id', 'class', 'model', 'tribe', 'x', 'y', 'h', 'flags2', 'state']) : null },
    }
  }
  const capture = stage => {
    try {
      const sameIds = world.units.filter(u => u.id === originalId), identity = {
        scene: getScene() === scene, sceneWorld: scene.world === world, storeWorld: getWorld() === world,
        clock: scene.gameClock === clock, canvas: scene.renderer?.domElement === canvas, canvasConnected: canvas?.isConnected === true,
        originalActorPresent: !!actor && world.units.includes(actor), sameIdCount: sameIds.length,
        sameIdIsOriginal: !!actor && sameIds.length === 1 && sameIds[0] === actor,
        originalBlueShaman: actor?.id === originalId && actor?.team === 'blue' && actor?.kind === 'shaman',
      }
      const selected = world.selected ?? [], markers = world.effects.filter(effect => effect.kind === 'orderMarker')
      const failures = Object.entries(identity).filter(([key, value]) => key !== 'sameIdCount' && value !== true).map(([key]) => key)
      if (!(actor?.hp > 0)) failures.push('actorHealth')
      const sample = { sequence: ++sequence, stage, originalActorId: originalId,
        ...fields(world, ['turn', 'time', 'status', 'paused', 'speed', 'mode', 'inputMask', 'orderCursor', 'lastOrderTurn']),
        level: scalar(world.outcome?.level), stock: scalar(world.shots?.blast), identity, failures,
        actor: describe(actor), sameIdActor: sameIds[0] === actor ? null : describe(sameIds[0]),
        opponent: describe(world.units.find(u => u.id === actor?.fight?.opponent)),
        selected: [...selected].slice(0, 256), selectedCount: selected.length, selectedTruncated: selected.length > 256,
        recipients: selected.slice(0, 256).map(id => ({ id, person: describe(world.units.find(u => u.id === id)) })),
        pointerAck: fields(scene.pointerAck, ['target', 'until']),
        orderMarkers: markers.slice(-32).map(effect => fields(effect, ['id', 'kind', 'x', 'z', 'height', 'age', 'duration', 'turnsRemaining'])),
        orderMarkerCount: markers.length, orderMarkersTruncated: markers.length > 32,
      }
      latest = sample
      if (failures.length && !firstFailure) firstFailure = structuredClone(sample)
      if (stage === 'before' || stage === 'after') {
        totalBoundaries++; recent.push(sample)
        if (recent.length > capacity) { recent.shift(); dropped++ }
      }
      return structuredClone(sample)
    } catch (error) { noteError(stage, error); return null }
  }
  const read = () => structuredClone({ version: 1, originalActorId: originalId, capacity, finished,
    attached: !finished && hooks.length === 2, attachmentVerified: hooks.length === 2,
    latest, firstFailure, recent, totalBoundaries, dropped, errors, errorCount, cleanup,
    cleanupVerified: finished && hooks.every(hook => cleanup.some(row => row.key === hook.key && row.restored)) })
  function restore() {
    for (const hook of [...hooks].reverse()) {
      const row = { key: hook.key, wrapperStillOwned: false, restored: false }
      try {
        row.wrapperStillOwned = equalDescriptor(ownDescriptor(clock, hook.key), hook.installed)
        if (!row.wrapperStillOwned) throw Error(`Callback ownership changed: ${hook.key}; replacement preserved`)
        if (hook.descriptor) Object.defineProperty(clock, hook.key, hook.descriptor)
        else delete clock[hook.key]
        row.restored = equalDescriptor(ownDescriptor(clock, hook.key), hook.descriptor)
        if (!row.restored) throw Error(`Exact callback descriptor was not restored: ${hook.key}`)
      } catch (error) { noteError('cleanup', error) }
      cleanup.push(row)
    }
  }
  capture('attached')
  try {
    // Preflight both leaves before installing either; accessors are not evaluated.
    const planned = ['beforeTurn', 'afterTurn'].map(key => {
      const descriptor = ownDescriptor(clock, key)
      let inherited = descriptor, parent = clock
      while (!inherited && (parent = Object.getPrototypeOf(parent))) inherited = ownDescriptor(parent, key)
      if (inherited && (!('value' in inherited) || inherited.value !== undefined && typeof inherited.value !== 'function')) throw Error(`Unsupported callback descriptor: ${key}`)
      if (descriptor && !descriptor.configurable && !descriptor.writable || !descriptor && !Object.isExtensible(clock)) throw Error(`Callback cannot be observed: ${key}`)
      return { key, descriptor, original: inherited?.value }
    })
    for (const hook of planned) {
      const wrapper = function (...args) {
        if (!finished && hook.key === 'beforeTurn') capture('before')
        try { return hook.original?.apply(this, args) }
        finally { if (!finished && hook.key === 'afterTurn') capture('after') }
      }
      const installed = hook.descriptor ? { ...hook.descriptor, value: wrapper } : { value: wrapper, writable: true, enumerable: true, configurable: true }
      Object.defineProperty(clock, hook.key, installed); hooks.push({ ...hook, installed })
    }
  } catch (error) { noteError('attach', error); restore(); finished = true }
  return {
    snapshot: () => capture('snapshot'),
    read,
    finish() {
      if (!finished) { capture('finish'); finished = true; restore() }
      return read()
    },
  }
}

// Actual release capture boundary. The source validator receives a detached World.
export function captureBlastReleaseRange(world, originalTarget, rangeCheck) {
  const sameOriginal = world.units.find(unit => unit.id === originalTarget.id) === originalTarget
  const probe = structuredClone(world), target = probe.units.find(unit => unit.id === originalTarget.id)
  return { phase: 'before-handler', turn: world.turn, targetId: originalTarget.id, sameOriginal,
    targetError: target ? structuredClone(rangeCheck(probe, 'blast', target)) : 'missing target' }
}

// Call only after the real handler trace has finished/restored. This additional
// geometric read can update picker caches; it is not a handler-consumed pick.
export function readBlastReleasePixel(scene, event) {
  const before = fields(scene.picking, ['lastKey', 'lastId', 'lastKind'])
  const personId = scene.picking.pickPerson(event)
  return { phase: 'after-handler-diagnostic', turn: scene.world.turn,
    point: { x: event.clientX, y: event.clientY }, personId,
    cacheBefore: before, cacheAfter: fields(scene.picking, ['lastKey', 'lastId', 'lastKind']) }
}
