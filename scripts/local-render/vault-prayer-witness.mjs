// Observe actual synchronous callers; never advance clocks or change gameplay state.
export function createVaultPrayerWitness({ scene, store, targetId, shamanId, doc = document, maxRecords = 4096 }) {
  const world = scene.world, panels = scene.objectPanels
  if (!Number.isInteger(targetId) || !Number.isInteger(shamanId) || !Number.isInteger(maxRecords) || maxRecords < 1)
    throw Error('Finite Vault, Shaman and record bound required')
  if (!scene.isCurrent() || store.getWorld() !== world) throw Error('Current Scene required')
  const identities = new WeakMap(), records = [], errors = [], restores = [], held = new Map()
  let nextIdentity = 1, ordinal = 0, closed = false, disposed = false, overflow = false
  let pointer = scene.pointerScreen && { ...scene.pointerScreen }, previousTurn = null
  const identity = value => {
    if (!value) return null
    if (!identities.has(value)) identities.set(value, nextIdentity++)
    return identities.get(value)
  }
  const error = failure => { if (errors.length < 16) errors.push(String(failure?.stack ?? failure)) }
  const snapshot = () => {
    const head = world.shrines.find(s => s.id === targetId), unit = world.units.find(u => u.id === shamanId)
    const person = unit?.native, orderId = person && (person.immediateCommand || person.commands[person.commandCursor])
    const order = world.buildingOrders.records[orderId], panel = panels.panels.get(targetId), element = panel?.element
    const pointerTarget = pointer && doc.elementFromPoint(pointer.clientX, pointer.clientY)
    const focused = !!element?.contains(doc.activeElement), hovered = !!element?.matches(':hover')
    return {
      turn: world.turn, time: world.time, animationFrame: scene.gameClock.animationFrame, panelFrame: panels.frame,
      current: scene.world === world && store.getWorld() === world && scene.isCurrent(),
      level: world.outcome.level, speed: world.speed, paused: world.paused, status: world.status,
      inputMask: world.inputMask, mode: world.mode, selected: [...world.selected],
      unlocked: world.unlockedTemple, trained: world.stats.trained, cast: world.stats.cast,
      head: head && { id: head.id, kind: head.kind, model: head.model, x: head.x, z: head.z,
        active: head.active, enabled: head.enabled, followers: head.followers,
        work: head.work, target: head.target, progress: head.progress, uses: head.uses, forced: head.forced },
      shaman: unit && { id: unit.id, kind: unit.kind, team: unit.team, hp: unit.hp, work: unit.work,
        vault: unit.vault && { ...unit.vault }, orderId: orderId ?? 0,
        order: order && { model: order.model, a: order.a, flags: order.flags, references: order.references } },
      record: panel ? { identity: identity(panel), elementIdentity: identity(element),
        automatic: panel.automatic, phase: panel.phase, remaining: panel.remaining, hold: panel.hold } : null,
      latch: panels.automaticVaultLatches.has(targetId), inspected: panels.inspected,
      dom: { present: !!element, connected: !!element?.isConnected, hidden: element?.hidden ?? null,
        focused, hovered, label: element?.getAttribute('aria-label') ?? null,
        width: panel?.canvas.width ?? 0, height: panel?.canvas.height ?? 0,
        visibleButtons: element ? [...element.querySelectorAll('button')].filter(button => !button.hidden).length : 0 },
      offTarget: !!pointerTarget && !element?.contains(pointerTarget) && !focused && !hovered &&
        (pointerTarget !== scene.renderer.domElement || scene.hoveredObject !== targetId),
      reservations: world.secondaryEffects.reservations.filter(key => key === `object-panel:${targetId}`).length,
    }
  }
  const safe = () => { try { return snapshot() } catch (failure) { error(failure); return null } }
  const push = row => {
    if (records.length >= maxRecords) {
      if (!overflow) error('Vault observation bound exceeded; evidence incomplete')
      overflow = true
      return
    }
    records.push({ ordinal: ++ordinal, ...row })
  }
  const signature = s => s && JSON.stringify([s.head, s.shaman, s.record, s.latch, s.inspected, s.dom, s.offTarget, s.unlocked, s.current])
  const cleanup = () => {
    if (closed) return
    closed = true
    for (const restore of restores.reverse()) try { restore() } catch (failure) { error(failure) }
  }
  const wrap = (owner, name, kind, relevant = () => true) => {
    const original = owner[name], descriptor = Object.getOwnPropertyDescriptor(owner, name)
    if (typeof original !== 'function') throw Error(`Missing actual ${name}`)
    function wrapper(...args) {
      const observe = !closed && relevant(args), before = observe ? safe() : null
      let result, failure, threw = false
      try { result = Reflect.apply(original, this, args) }
      catch (value) { failure = value; threw = true }
      if (observe) {
        const after = safe(), changed = signature(before) !== signature(after)
        if (kind === 'request' || kind === 'dispose' || changed ||
          (kind === 'turn' && signature(after) !== previousTurn))
          push({ kind, receiverMatches: this === owner, before, after, threw,
            result: typeof result === 'string' ? result : null,
            ...(kind === 'open' ? { immediate: !!args[1], automatic: !!args[2] } : {}) })
        if (kind === 'turn') previousTurn = signature(after)
        if (kind === 'update' && before?.record?.phase === 1 && after?.record?.phase === 1 &&
          before.record.identity === after.record.identity && after.head.followers > 0 &&
          before.offTarget && after.offTarget && before.inspected !== targetId && after.inspected !== targetId &&
          after.animationFrame > before.panelFrame) {
          const id = after.record.identity
          held.set(id, (held.get(id) ?? 0) + 1)
        }
        if (kind === 'dispose') { disposed = true; cleanup() }
        else if (!after?.current) { error('Vault observer Scene became stale'); cleanup() }
      }
      if (threw) throw failure
      return result
    }
    owner[name] = wrapper
    restores.push(() => {
      if (owner[name] !== wrapper) throw Error(`Foreign ${name} replacement preserved`)
      if (descriptor) Object.defineProperty(owner, name, descriptor)
      else delete owner[name]
    })
  }
  let initial
  try {
    if (!(panels.automaticVaultLatches instanceof Set)) throw Error('Missing Vault latch owner')
    const moved = event => { pointer = { clientX: event.clientX, clientY: event.clientY } }
    doc.addEventListener('pointermove', moved, true)
    restores.push(() => doc.removeEventListener('pointermove', moved, true))
    let input = null
    const inputBefore = event => {
      if (event.target !== scene.renderer.domElement) return
      input = { kind: 'input', trusted: event.isTrusted, button: event.button,
        modifiers: ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].map(key => !!event[key]), before: safe(), after: null }
    }
    const inputAfter = () => { if (input) { input.after = safe(); push(input); input = null } }
    doc.addEventListener('pointerup', inputBefore, true)
    doc.addEventListener('pointerup', inputAfter)
    restores.push(() => {
      doc.removeEventListener('pointerup', inputBefore, true)
      doc.removeEventListener('pointerup', inputAfter)
      input = null
    })
    wrap(panels, 'requestAutomaticVault', 'request', args => args[0] === targetId)
    wrap(panels, 'open', 'open', args => args[0] === targetId)
    wrap(panels, 'update', 'update')
    wrap(scene.gameClock, 'afterTurn', 'turn')
    wrap(scene, 'dispose', 'dispose')
    initial = snapshot()
  } catch (failure) { cleanup(); throw failure }
  return {
    status: () => ({ current: snapshot(), count: records.length, held: Object.fromEntries(held),
      errors: [...errors], overflow, closed, disposed }),
    range: (start = 0) => {
      if (!Number.isInteger(start) || start < 0 || start > records.length) throw Error('Invalid Vault record range')
      return structuredClone(records.slice(start))
    },
    close: () => {
      const final = safe()
      cleanup()
      return { initial, final, closed, disposed, errors: [...errors], overflow,
        held: Object.fromEntries(held), records: structuredClone(records) }
    },
  }
}

export function installVaultPrayerWitness({ targetId, shamanId }) {
  if (window.vaultPrayer) throw Error('Vault observer already installed')
  return window.vaultPrayer = createVaultPrayerWitness({
    scene: window.testSceneRef.current, store: window.testStore, targetId, shamanId,
  })
}
