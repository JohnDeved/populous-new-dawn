// Passive observation only. Every installed function forwards the original call.
export async function installHutResidentWitness({ hutId, unitId, deadlineAt }) {
  const [{ personReachedOrder }, { samePersonCell }, { default: rules }, { unitAnimationSource }] = await Promise.all([
    import('/app/person-orders.ts'), import('/app/person-idle.ts'), import('/app/original-rules.json'), import('/app/unit-animation-source.ts'),
  ])
  const scene = window.testSceneRef.current, world = scene.world, store = window.testStore
  const unit = world.units.find(u => u.id === unitId), hut = world.buildings.find(b => b.id === hutId)
  if (window.hutResidentWitness || !unit || !hut || unit.kind !== 'brave' || unit.team !== 'blue')
    throw new Error('Exclusive live Brave/Hut observation required')
  const evidence = { errors: [], events: [], frames: {}, entryInput: null, admission: null, departures: [], moves: [], closed: false }
  const restorers = [], canvas = scene.renderer.domElement, registry = world.objectCells.objects
  const captureAttempted = new Set()
  let phase = 'setup', entryPerson = null, move = null, departurePerson = null, closed = false
  const error = e => { if (evidence.errors.length < 12) evidence.errors.push(String(e?.stack ?? e).slice(0, 1000)) }
  const observe = fn => { if (!closed) try {
    if (Date.now() >= deadlineAt) throw new Error('Resident observation deadline expired')
    if (scene.world !== world || store.getWorld() !== world || window.testSceneRef.current !== scene || world.objectCells.objects !== registry)
      throw new Error('Resident Scene/World ownership changed')
    if (!world.units.includes(unit) || unit.hp <= 0 || !world.buildings.includes(hut) || hut.hp <= 0)
      throw new Error('Original Brave or fixed Hut was lost')
    fn()
  } catch (e) { error(e) } }
  const orderId = p => p ? p.immediateCommand || p.commands[p.commandCursor] || 0 : 0
  const summary = w => {
    const u = w.units.find(u => u.id === unitId), b = w.buildings.find(b => b.id === hutId)
    const r = u?.resident, p = r?.person, slots = b?.admission?.occupants.slice(0, 6) ?? []
    return { turn: w.turn, time: w.time, paused: w.paused, status: w.status, inputMask: w.inputMask,
      selected: [...w.selected], randomState: w.randomState, unit: u && { id: u.id, kind: u.kind,
        team: u.team, hp: u.hp, x: u.x, z: u.z, inside: u.inside, work: u.work,
        entry: !!u.entry, native: !!u.native, pathLength: u.path.length },
      building: b && { id: b.id, hp: b.hp, progress: b.progress, inside: b.admission?.inside,
        capacity: b.admission && rules.buildingCapacity[b.admission.model], slots },
      resident: r && { building: r.building, slot: r.slot, person: structuredClone(p) },
      correspondence: !!p && r.building === hutId && slots[r.slot] === unitId &&
        slots.filter(id => id === unitId).length === 1 && u.inside === hutId && p.id === unitId && p.building === hutId,
      activeAbsent: !!u && !u.entry && !u.native && !u.flight && !u.fight?.motion && !u.builder?.person,
      animationAbsent: !!u && unitAnimationSource(u) === null,
      registered: w.objectCells.objects.has(unitId) }
  }
  const state = () => summary(world)
  const push = event => { if (evidence.events.length >= 32) throw new Error('Resident event cap'); evidence.events.push(event) }
  const replace = (object, key, make) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key), original = object[key]
    if (typeof original !== 'function') throw new Error(`Missing resident observation method: ${key}`)
    const installed = make(original)
    Object.defineProperty(object, key, { configurable: true, writable: true, value: installed })
    restorers.push(() => {
      if (object[key] !== installed) { error(`Foreign replacement preserved: ${key}`); return }
      if (descriptor) Object.defineProperty(object, key, descriptor)
      else delete object[key]
    })
  }
  const nativeArrival = (p, order) => {
    const idle = rules.personModels[p.model].idleState
    return p.commands.every(id => !id) && !p.immediateCommand &&
      ((p.state === idle && p.previousState === 10) ||
        (p.state === 19 && p.previousState === idle && p.substate === 8 && !!(p.assignment & 1) &&
          !p.slowTurn && samePersonCell(p, { x: p.goalX, y: p.goalY }))) &&
      !(p.counter & 3) && !p.speed && !p.motionGroup && !p.vehicle && !(p.flags4 & 0x10000000) &&
      unit.inside === null && !unit.path.length && !world.pathfinding.people.has(unitId) &&
      !unit.work && !unit.lift && !unit.casting && !unit.fight &&
      personReachedOrder(p, order, () => { throw new Error('Unexpected resident vehicle arrival') })
  }
  try {
  replace(scene.gameClock, 'beforeTurn', original => function (...args) {
    const result = original?.apply(this, args)
    observe(() => {
      if (phase === 'entry' && unit.entry?.person) {
        if (entryPerson && unit.entry.person !== entryPerson) throw new Error('Original entry person replaced')
        entryPerson ??= unit.entry.person
      }
      if (move?.person) move.beforeId = orderId(move.person)
    })
    return result
  })
  replace(scene.gameClock, 'afterTurn', original => function (...args) {
    const result = original?.apply(this, args)
    observe(() => {
      if (phase === 'entry' && !evidence.admission && unit.resident) {
        const inputOrderId = evidence.entryInput?.after?.orderId
        evidence.admission = { samePerson: !!entryPerson && unit.resident.person === entryPerson, state: state(),
          entryOrderReferences: inputOrderId && world.buildingOrders.records[inputOrderId].references }
        push({ kind: 'admission', turn: world.turn })
      }
      if (move?.person && !move.done) {
        const p = unit.native, id = orderId(p)
        if (p !== move.person || registry.get(unitId) !== p || world.lastOrderTurn !== move.turn) throw new Error('Issued Brave movement owner/order replaced')
        const order = id && world.buildingOrders.records[id]
        if (id && (id !== move.orderId || order.model !== 3 || order.a !== move.order.a || order.b !== move.order.b || order.flags & 1))
          throw new Error('Issued Brave command replaced')
        if (move.beforeId === move.orderId && !id) {
          move.done = nativeArrival(p, move.order)
          move.ended = { turn: world.turn, state: state(), native: structuredClone(p) }
          if (!move.done) throw new Error('Brave command ended without native arrival')
          evidence.moves.push({ label: move.label, turn: move.turn, orderId: move.orderId,
            order: move.order, input: move.input, done: true, ended: move.ended })
        }
      }
    })
    return result
  })
  replace(registry, 'set', original => function (...args) {
    let boundary = null
    observe(() => {
      if (departurePerson && args[0] === unitId && args[1] === departurePerson) {
        boundary = { turn: world.turn, receiverMatches: this === registry, key: args[0],
          samePerson: unit.resident?.person === args[1], slotCleared: !hut.admission.occupants.includes(unitId),
          unitStillInside: unit.inside === hutId, personBuilding: args[1].building,
          before: state() }
      }
    })
    const result = Reflect.apply(original, this, args)
    if (boundary) observe(() => {
      boundary.returnMatches = result === registry
      boundary.registeredSame = registry.get(unitId) === departurePerson
      evidence.departures.push(boundary)
      departurePerson = null
    })
    return result
  })
  const beforePointer = event => observe(() => {
    if (phase !== 'entry' || evidence.entryInput) return
    evidence.entryInput = { before: state(), trusted: event.isTrusted,
      canvasTarget: event.target === canvas, button: event.button }
  })
  const pointer = event => observe(() => {
    if (phase === 'entry' && evidence.entryInput && !evidence.entryInput.after) {
      const p = unit.entry?.person ?? unit.native, id = orderId(p)
      if (!p || p.id !== unitId || p.model !== 2) throw new Error('Actual command8 person missing')
      entryPerson = p
      evidence.entryInput.after = { turn: world.turn, lastOrderTurn: world.lastOrderTurn,
        orderId: id, order: id ? structuredClone(world.buildingOrders.records[id]) : null }
    }
    if (!move || move.person) return
    const p = unit.native, id = orderId(p), order = id && world.buildingOrders.records[id]
    move.input = { trusted: event.isTrusted, button: event.button, targetMatches: event.target === canvas,
      modifiers: [event.ctrlKey, event.shiftKey, event.altKey, event.metaKey], selected: [...world.selected],
      turn: world.turn, lastOrderTurn: world.lastOrderTurn }
    if (!event.isTrusted || event.button !== 0 || event.target !== canvas ||
      move.input.modifiers.some(Boolean) || JSON.stringify(world.selected) !== JSON.stringify([unitId]) ||
      !p || p.id !== unitId || p.model !== 2 || !id || order?.model !== 3 || order.flags & 1)
      throw new Error('Actual trusted Brave command3 boundary missing')
    move.person = p; move.orderId = id; move.order = structuredClone(order); move.turn = world.lastOrderTurn
    move.beforeId = id
    push({ kind: 'move-input', label: move.label, ...move.input })
  })
  canvas.addEventListener('pointerdown', beforePointer, true)
  restorers.push(() => canvas.removeEventListener('pointerdown', beforePointer, true))
  canvas.addEventListener('pointerup', pointer)
  restorers.push(() => canvas.removeEventListener('pointerup', pointer))
  replace(scene.renderer, 'render', original => function (...args) {
    const before = scene.renderer.info.render.frame
    const result = Reflect.apply(original, this, args)
    observe(() => {
      if (this !== scene.renderer || args[0] !== scene.scene || args[1] !== scene.camera ||
        scene.renderer.info.render.frame <= before) return
      const label = phase === 'entry' && unit.entry && unit.inside === null ? 'entry'
        : phase === 'entry' && evidence.admission ? 'resident'
          : phase === 'departure' && move?.done ? 'departure' : null
      if (!label || captureAttempted.has(label)) return
      const group = scene.buildingMeshes.get(hutId)
      if (!group) return
      const actor = scene.unitScreen(unitId), building = scene.view.screen(group.position, scene.camera)
      if (!building || Math.abs(building.x) > 1 || Math.abs(building.y) > 1 || Math.abs(building.z) > 1 ||
        (label !== 'resident' && !actor)) return
      captureAttempted.add(label)
      const png = canvas.toDataURL('image/png')
      if (png.length > 8 * 1024 * 1024) throw new Error('Resident natural PNG exceeds 8MiB encoded cap')
      evidence.frames[label] = { turn: world.turn, phase, rendererFrame: scene.renderer.info.render.frame,
        actor: actor && { ...actor }, building: { x: building.x, y: building.y, z: building.z },
        state: state(), png }
    })
    return result
  })
  } catch (failure) {
    for (const restore of restorers.reverse()) try { restore() } catch (e) { error(e) }
    throw failure
  }
  const api = {
    summary, world,
    armEntry() { phase = 'entry'; entryPerson = null; move = null; push({ kind: 'arm-entry', turn: world.turn }); return state() },
    armMove(label, exactDeparture = false) {
      phase = exactDeparture ? 'departure' : 'setup'; move = { label, person: null, done: false }
      departurePerson = exactDeparture ? unit.resident?.person : null
      if (exactDeparture && !departurePerson) throw new Error('Stored resident required before departure')
    },
    read() { return { ...structuredClone(evidence), latest: state(), moveDone: !!move?.done } },
    close() {
      if (closed) return api.read()
      closed = true
      for (const restore of restorers.reverse()) try { restore() } catch (e) { error(e) }
      if (window.hutResidentWitness === api) delete window.hutResidentWitness
      else error('Foreign resident API preserved')
      evidence.closed = true
      return api.read()
    },
  }
  window.hutResidentWitness = api
  return api
}

export function readHutResidentRoster() {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current
  const hut = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut' && b.anchor?.x === 64512 && b.anchor?.y === 54784)
  const slots = hut?.admission?.occupants.slice(0, 6) ?? []
  const residents = slots.map((id, slot) => ({ slot, unit: world.units.find(u => u.id === id) }))
    .filter(({ unit }) => unit && unit.id >= 13 && unit.id <= 18 && unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === hut?.id)
    .sort((a, b) => a.unit.id - b.unit.id)
  return { turn: world.turn, inputMask: world.inputMask, level: world.outcome.level, paused: world.paused,
    sceneMatches: scene.world === world, status: world.status, speed: world.speed,
    shamanId: world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)?.id,
    hut: hut && { id: hut.id, x: hut.x, z: hut.z, hp: hut.hp, progress: hut.progress, anchor: { ...hut.anchor },
      admission: structuredClone(hut.admission) },
    residents: residents.map(({ slot, unit: u }) => ({ slot, id: u.id, hp: u.hp, inside: u.inside })) }
}

export async function readResidentCommitted() {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(new Error('Checkpoint absent')) }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(request.result); tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('Checkpoint read aborted'))
    })
    return record ? { version: record.version, summary: window.hutResidentWitness.summary(record.world) } : null
  } finally { db.close() }
}

export function installResidentCheckpointBoundary({ kind }) {
  const store = window.testStore, previous = store.getWorld(), summary = window.hutResidentWitness.summary
  const name = 'hutResidentCheckpointRecord'
  if (Object.hasOwn(window, name)) throw new Error('Checkpoint observation already owned')
  const label = kind === 'save' ? 'Save checkpoint' : 'Load checkpoint'
  const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === label)
  if (!button?.isConnected || button.disabled) throw new Error('Checkpoint control unavailable')
  let record = null, admitted = false, closed = false
  const errors = [], fail = e => { if (errors.length < 8) errors.push(String(e)) }
  window[name] = record
  const capture = world => {
    if (window[name] !== record) throw new Error('Checkpoint observation replaced')
    record = { version: 1, world: structuredClone(world) }
    window[name] = record
  }
  const click = event => {
    try {
      if (!event.isTrusted || store.getWorld() !== previous || (event.target !== button && !button.contains(event.target)))
        throw new Error('Trusted checkpoint click required')
      admitted = true
      if (kind === 'save') capture(store.getWorld())
    } catch (e) { fail(e) }
  }
  button.addEventListener('click', click, true)
  const unsubscribe = kind === 'load' ? store.subscribe(() => {
    if (record || store.getWorld() === previous) return
    try {
      if (!admitted) throw new Error('World changed before trusted Load')
      capture(store.getWorld())
    } catch (e) { fail(e) }
  }) : () => {}
  const read = () => ({ admitted, kind, errors: [...errors], captured: !!record,
    summary: record && summary(record.world), closed })
  return { read, close() {
    if (!closed) {
      closed = true; button.removeEventListener('click', click, true); unsubscribe()
      if (window[name] === record) delete window[name]
      else fail('Foreign checkpoint observation preserved')
    }
    return read()
  } }
}

export function installResidentPanelSelection({ hutId, unitId }) {
  const scene = window.testSceneRef.current, world = scene.world
  const panel = scene.buildingPanels.get(hutId), button = panel?.querySelector(`button[data-person="${unitId}"]`)
  if (!button?.isConnected || button.hidden || panel.hidden || button.disabled)
    throw new Error('Actual fixed-Hut resident panel control unavailable')
  let eventRecord = null, closed = false
  const click = event => {
    eventRecord = { trusted: event.isTrusted, targetMatches: event.target === button || button.contains(event.target),
      worldMatches: scene.world === world && window.testStore.getWorld() === world,
      selected: [...world.selected], turn: world.turn, inside: world.units.find(u => u.id === unitId)?.inside }
  }
  button.addEventListener('click', click)
  return { close() { if (!closed) { closed = true; button.removeEventListener('click', click) }
    return { event: eventRecord, closed } } }
}

export function installResidentSelectionClear() {
  const scene = window.testSceneRef.current, world = scene.world, active = document.activeElement
  if (window.testStore.getWorld() !== world || world.mode !== null || world.inputMask || world.paused ||
    world.outcome.level !== 1 || active?.closest('input,dialog'))
    throw new Error('Ordinary Escape selection-clear prerequisite missing')
  const sample = () => ({ selected: [...world.selected], mode: world.mode, orderCursor: world.orderCursor,
    turn: world.turn, lastOrderTurn: world.lastOrderTurn, randomState: world.randomState })
  const before = sample(); let eventRecord = null, closed = false
  const key = event => {
    if (event.key !== 'Escape') return
    eventRecord = { trusted: event.isTrusted, key: event.key,
      modifiers: [event.ctrlKey, event.shiftKey, event.altKey, event.metaKey],
      blockedTarget: !!event.target?.closest('input,dialog'), inputMask: world.inputMask,
      worldMatches: window.testStore.getWorld() === world && scene.world === world, after: sample() }
  }
  window.addEventListener('keydown', key)
  return { close() { if (!closed) { closed = true; window.removeEventListener('keydown', key) }
    return { before, event: eventRecord, closed } } }
}
