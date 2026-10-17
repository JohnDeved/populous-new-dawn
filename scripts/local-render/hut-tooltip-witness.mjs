// One finite scenario observer. It never invokes a game update, picker, input,
// render, clock, or command. The installed wrappers forward actual calls once.
export async function installHutTooltipWitness(page, { deadlineAt, maxRecords = 8192, buildingRecordPrefix = 'hut', observeConstruction = false, observeTraining = false } = {}) {
  return page.evaluateHandle(async ({ source, limits }) => {
    const [{ GameScene }, { observeEntityPointer }] = await Promise.all([
      import('/app/scene.ts'), import('/qa/erosion-ordinary/input.mjs')])
    // Only the scenario's own passive observer is serialized; no runtime source
    // replacement or game state is evaluated here.
    return (0, eval)(`(${source})`)(GameScene, observeEntityPointer, limits)
  }, { source: installHutTooltipLifecycle.toString(), limits: { deadlineAt, maxRecords, buildingRecordPrefix, observeConstruction, observeTraining } })
}

// Dependency-supplied only so cheap contracts can exercise real wrapper behavior
// without a browser or installing dependencies. Production invocation is above.
export function installHutTooltipLifecycle(GameScene, observeEntityPointer, { deadlineAt, maxRecords = 8192, buildingRecordPrefix = 'hut', observeConstruction = false, observeTraining = false }) {
  const records = [], epochs = [], frames = {}, errors = [], initial = performance.now()
  const originalStart = GameScene.prototype.start
  const startDescriptor = Object.getOwnPropertyDescriptor(GameScene.prototype, 'start')
  const sessions = new WeakMap(), recordIds = new WeakMap(), buildings = new WeakMap(), people = new WeakMap()
  let targetId = null
  const recordKey = `${buildingRecordPrefix}Records`, inspectedKey = `${buildingRecordPrefix}Inspected`, heldKey = `${buildingRecordPrefix}HeldPointer`
  let phase = 'startup', ordinal = 0, closed = false, capture = null
  const error = e => { if (errors.length < 8) errors.push(String(e?.stack ?? e)) }
  const check = (ok, message) => { if (!ok) throw Error(message) }
  const observe = fn => { if (!closed && !errors.length) try { return fn() } catch (e) { error(e) } }
  const identity = (map, value) => {
    if (!value || typeof value !== 'object') return null
    if (!map.has(value)) map.set(value, ++ordinal)
    return map.get(value)
  }
  const add = row => {
    check(records.length < maxRecords, 'Hut tooltip record bound exceeded')
    check(Date.now() <= deadlineAt, 'Hut tooltip observation deadline exceeded')
    records.push({ ordinal: ++ordinal, phase, ...row })
  }
  const construction = scene => {
    if (!observeConstruction) return null
    const world = scene.world, camps = world.buildings.filter(b => b.team === 'blue' && b.kind === 'camp')
    check(camps.length <= 4, 'Bounded Mission 2 camp roster exceeded')
    const ids = new Set(camps.map(b => b.id))
    return { camps: camps.map(b => ({ id: b.id, identity: identity(buildings, b), kind: b.kind, team: b.team,
      x: b.x, z: b.z, anchor: b.anchor, hp: b.hp, progress: b.progress, preparation: b.preparation,
      builders: b.builders, admission: b.admission, dismantle: b.dismantle })),
      workers: world.units.filter(u => ids.has(u.work) || ids.has(u.inside)).map(u => {
        // adoptLiveOrders transfers model6 ownership into builder.person and
        // clears native. Preserve that actual object and its queue, not an alias.
        const person = u.builder?.person ?? u.native
        return { id: u.id, kind: u.kind, team: u.team, hp: u.hp, work: u.work, inside: u.inside, cargo: u.cargo, tree: u.tree,
          builder: u.builder && { task: u.builder.task, phase: u.builder.phase, busy: u.builder.busy, restart: u.builder.restart },
          orderOwner: u.builder?.person ? 'builder.person' : u.native ? 'native' : null,
          orderOwnerIdentity: identity(people, person), orderPersonId: person?.id, orderWorkTarget: person?.workTarget,
          orderState: person?.state, orderSubstate: person?.substate, orderPhase: person?.commandPhase,
          commands: person?.commands, commandCursor: person?.commandCursor, immediateCommand: person?.immediateCommand }
      }) }
  }
  const training = scene => {
    if (!observeTraining) return null
    const w = scene.world, panels = scene.objectPanels
    check(panels.automaticTrainingLatches instanceof Set, 'Missing actual automatic training latch owner')
    const camps = w.buildings.filter(b => b.team === 'blue' && b.kind === 'camp')
    check(camps.length <= 4, 'Bounded training camp roster exceeded')
    return { trained: w.stats.trained, manaTribes: w.manaTribes, manaWorld: w.manaWorld,
      reservations: w.secondaryEffects?.reservations ?? [], latches: [...panels.automaticTrainingLatches],
      camps: camps.map(b => ({ id: b.id, identity: identity(buildings, b), hp: b.hp, progress: b.progress,
        timer: b.timer, admission: b.admission,
        reservationCount: (w.secondaryEffects?.reservations ?? []).filter(key => key === `building-panel:${b.id}`).length })),
      people: w.units.filter(u => u.team === 'blue').map(u => {
        const person = u.entry?.person ?? u.native
        return { id: u.id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z, work: u.work, inside: u.inside,
          orderOwner: u.entry?.person ? 'entry.person' : u.native ? 'native' : null,
          orderOwnerIdentity: identity(people, person), registeredIdentity: identity(people, w.objectCells?.objects.get(u.id)),
          orderPersonId: person?.id, orderState: person?.state, orderWorkTarget: person?.workTarget,
          commands: person?.commands, commandCursor: person?.commandCursor, immediateCommand: person?.immediateCommand,
          entryOrdersMatch: u.entry ? u.entry.orders === w.buildingOrders : null }
      }) }
  }
  const simulation = scene => structuredClone({
    training: training(scene),
    construction: construction(scene),
    turn: scene.world.turn, selected: scene.world.selected, mode: scene.world.mode,
    orderCursor: scene.world.orderCursor, lastOrderTurn: scene.world.lastOrderTurn,
    random: scene.world.randomState, cosmeticRandom: scene.world.cosmeticRandom?.randomState,
    orders: scene.world.buildingOrders,
    units: scene.world.units.map(unit => ({ id: unit.id, work: unit.work, target: unit.target, tree: unit.tree,
      commands: unit.native?.commands, commandCursor: unit.native?.commandCursor, immediateCommand: unit.native?.immediateCommand })),
  })
  const markers = scene => {
    const actual = (scene.world.effects ?? []).filter(effect => effect.kind === 'orderMarker')
    return { count: actual.length, omitted: Math.max(0, actual.length - 160),
      values: actual.slice(-160).map(({ id, kind, x, z, height, age, duration, turnsRemaining }) =>
        ({ id, kind, x, z, height, age, duration, turnsRemaining })) }
  }
  const state = scene => {
    const w = scene.world, c = scene.tooltipController, session = c?.session ?? scene.tooltipSession
    check(scene.objectPanels?.[recordKey] instanceof Map, 'Missing actual Hut record observation interface')
    return structuredClone({
      sessionIdentity: identity(sessions, session), session: session ?? null,
      controller: c ?? null, input: scene.tooltipInput ?? null, pendingInputs: scene.tooltipInspectionInputs ?? [],
      tooltip: scene.tooltip, construction: construction(scene), training: training(scene), targetId,
      inspected: scene.objectPanels[inspectedKey] ?? null, heldPointer: scene.objectPanels[heldKey] ?? null,
      records: [...scene.objectPanels[recordKey]].map(([id, value]) => ({ id, identity: identity(recordIds, value),
        phase: value.phase, remaining: value.remaining, hold: value.hold, automatic: value.automatic })),
      panels: [...scene.buildingPanels].map(([id, panel]) => ({ id, hidden: panel.hidden,
        hovered: panel.matches?.(':hover') ?? false, focused: panel.contains?.(document.activeElement) ?? false,
        controlHovered: panel.querySelector?.('.dismantle-control')?.matches(':hover') ?? false })),
      level: w.outcome.level, status: w.status, turn: w.turn, speed: w.speed, paused: w.paused,
      selected: w.selected, mode: w.mode, inputMask: w.inputMask,
      overview: scene.overviewActive, overviewStage: scene.overviewStage, drag: scene.dragActive.value,
      flying: w.flyby.flags & 1, camera: scene.cameraMotion.active, transition: !!scene.viewTransition,
      dialog: !!document.querySelector('dialog[open]'),
      pointer: scene.pointerScreen, buttons: scene.pointerButtons, hovered: scene.hoveredObject,
      animationFrame: scene.gameClock.animationFrame, sceneFrame: scene.frame,
      rendererFrame: scene.renderer.info.render.frame, rafTimestamp: scene.previous,
    })
  }
  const node = n => n ? { tag: n.tagName ?? null, role: n.getAttribute?.('role') ?? null,
    label: n.getAttribute?.('aria-label') ?? null, text: n.textContent?.trim().slice(0, 100) ?? null,
    className: typeof n.className === 'string' ? n.className : null } : null
  const pixels = canvas => {
    check(canvas && canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000, 'Hut canvas capture bounds')
    return canvas.toDataURL('image/png')
  }
  const attach = scene => {
    check(epochs.length < 2, 'Ordinary Hut episode permits entry and one Load scene only')
    const epoch = { id: epochs.length + 1, scene, wrappers: [], listeners: [], disposed: false, closed: false,
      initial: state(scene), lastState: null, lastPaint: null, delivered: null,
      omittedIdenticalPointerFrames: 0, omittedSincePointerRecord: 0 }
    epochs.push(epoch)
    // start has already installed shipped listeners, but the same JS call stack
    // has not returned to RAF. Passive bubble listeners therefore follow input.
    let pointer
    const wrap = (owner, key, build) => {
      const original = owner[key], descriptor = Object.getOwnPropertyDescriptor(owner, key)
      check(typeof original === 'function', `Missing Hut observation boundary ${key}`)
      const wrapper = build(original); epoch.wrappers.push({ owner, key, original, descriptor, wrapper }); owner[key] = wrapper
    }
    const snapshot = () => { epoch.lastState = state(scene); return epoch.lastState }
    const finish = () => {
      if (epoch.closed) return
      epoch.closed = true
      epoch.cleanupHeldPointer = scene.objectPanels[heldKey] ?? null
      if (epoch.cleanupHeldPointer !== null) error('Actual Hut held-pointer owner remains at observer cleanup')
      for (const [owner, type, fn, capture] of epoch.listeners) try { owner.removeEventListener(type, fn, capture) } catch (e) { error(e) }
      for (const entry of epoch.wrappers.toReversed()) try {
        if (entry.owner[entry.key] !== entry.wrapper) { error(`Hut observer lost ${entry.key}`); continue }
        if (entry.descriptor) Object.defineProperty(entry.owner, entry.key, entry.descriptor)
        else delete entry.owner[entry.key]
      } catch (e) { error(e) }
      if (pointer) try { epoch.delivered = pointer.finish(); check(epoch.delivered.restored, 'Actual-pointer cleanup failed'); epoch.delivered.errors.forEach(error) } catch (e) { error(e) }
    }
    epoch.finish = finish
    try {
      pointer = observeEntityPointer(scene, document)
      if (observeTraining) wrap(scene.objectPanels, 'requestAutomaticTraining', original => function (...args) {
        const before = observe(snapshot)
        let result, threw = false
        try { result = original.apply(this, args); return result }
        catch (error) { threw = true; throw error }
        finally { observe(() => add({ kind: 'automatic-training-request', epoch: epoch.id, target: args[0],
          receiverMatches: this === scene.objectPanels, threw, before, after: snapshot() })) }
      })
      wrap(scene, 'updateTooltipController', original => function (...args) {
        const before = observe(snapshot), markersBefore = observe(() => markers(scene))
        const result = original.apply(this, args)
        observe(() => add({ kind: 'tick', epoch: epoch.id, receiverMatches: this === scene, now: args[0], before, after: snapshot(),
          markers: { before: markersBefore, after: markers(scene) } }))
        return result
      })
      wrap(scene, 'acquireForcedTooltip', original => function (...args) {
        const before = observe(snapshot), result = original.apply(this, args)
        observe(() => add({ kind: 'forced-acquisition', epoch: epoch.id, target: args[0]?.id ?? null,
          duration: args[1], receiverMatches: this === scene, before, after: snapshot() }))
        return result
      })
      let picking = null, lastPointerSignature = null
      wrap(scene.picking, 'pick', original => function (...args) {
        const result = original.apply(this, args)
        if (picking) observe(() => picking.push({ id: result, x: args[0]?.clientX, y: args[0]?.clientY, receiverMatches: this === scene.picking }))
        return result
      })
      wrap(scene, 'updatePointerFrame', original => function (...args) {
        picking = []
        let result
        try { result = original.apply(this, args) }
        catch (e) { picking = null; throw e }
        const picks = picking; picking = null
        observe(() => {
          if (!picks.length) return
          const input = scene.tooltipInput
          const signature = JSON.stringify([phase, picks, input?.route ?? null, input?.object?.id ?? null,
            input?.cell ?? null, input?.hud?.owner ?? null, input?.message ?? 0])
          if (signature === lastPointerSignature) {
            epoch.omittedIdenticalPointerFrames++; epoch.omittedSincePointerRecord++
            return
          }
          lastPointerSignature = signature
          add({ kind: 'pointer-frame', epoch: epoch.id, picks, after: snapshot(),
            omittedIdenticalBefore: epoch.omittedSincePointerRecord })
          epoch.omittedSincePointerRecord = 0
        })
        return result
      })
      wrap(scene, 'renderTooltip', original => function (...args) {
        const result = original.apply(this, args)
        observe(() => {
          const element = scene.tooltipElement, label = element.getAttribute('aria-label') ?? ''
          const hud = document.querySelector('.hud-description'), hudText = hud?.textContent?.trim() ?? ''
          const hudVisible = !!hud?.getClientRects().length
          epoch.lastPaint = { hidden: element.hidden, label, left: element.style.left, top: element.style.top }
          if (!capture || capture.epoch !== epoch.id || frames[capture.label]?.tooltip) return
          const matches = capture.when === 'modal-hidden' ? element.hidden && !!document.querySelector('dialog.game-dialog[open]') : capture.when === 'hidden' ? element.hidden : capture.when === 'hut'
            ? !element.hidden && label.startsWith('Small Hut:') : capture.when === 'blast'
              ? hudVisible && hudText.startsWith('Blast') && scene.tooltipController.category === 'hud' &&
                scene.tooltipController.owners.hud && scene.tooltip.draw === 1 : capture.when?.kind === 'named-object'
                ? !element.hidden && label === capture.when.text.replaceAll('{}', 'Left-click ').replaceAll('|}', 'Right-click ') &&
                  scene.tooltip.text === capture.when.text &&
                  scene.tooltip.draw === 1 && scene.tooltipInput?.picked === capture.when.id &&
                  scene.tooltipInput.object?.id === capture.when.id && scene.tooltipController.category === 'object' &&
                  scene.tooltipController.key === capture.when.id &&
                  scene.tooltipController.dwell > scene.tooltipController.session.threshold : true
          if (!matches) return
          const frame = frames[capture.label] ??= { epoch: epoch.id, phase, ordinal, rafTimestamp: scene.previous }
          frame.tooltip = { ...epoch.lastPaint, state: snapshot(), png: element.hidden ? null : pixels(scene.tooltipCanvas) }
          if (capture.when === 'blast') frame.hud = { text: hudText, visible: hudVisible,
            bounds: { x: hud.getBoundingClientRect().x, y: hud.getBoundingClientRect().y,
              width: hud.getBoundingClientRect().width, height: hud.getBoundingClientRect().height },
            pixels: 'blast-history-composite.png', owner: 'existing DOM hud-description' }
        })
        return result
      })
      wrap(scene.renderer, 'render', original => function (...args) {
        const result = original.apply(this, args)
        if (args[0] === scene.scene && args[1] === scene.camera) observe(() => {
          snapshot()
          const frame = capture?.epoch === epoch.id && frames[capture.label]
          if (frame?.tooltip && !frame.world) frame.world = { state: epoch.lastState, png: pixels(scene.renderer.domElement) }
        })
        return result
      })
      wrap(scene, 'updateHudFrame', original => function (...args) {
        const result = original.apply(this, args)
        observe(() => {
          const frame = capture?.epoch === epoch.id && frames[capture.label]
          if (frame?.world && !frame.panel) {
            const b = scene.world.buildings.find(b => targetId === null
              ? b.kind === 'hut' && b.team === 'blue' && b.anchor?.x === 64512 && b.anchor?.y === 54784 : b.id === targetId)
            const panel = b && scene.buildingPanels.get(b.id)
            frame.panel = { id: b?.id ?? null, hidden: panel?.hidden ?? true, label: panel?.getAttribute('aria-label') ?? null,
              left: panel?.style.left, top: panel?.style.top, state: snapshot(),
              png: panel && !panel.hidden ? pixels(panel.firstElementChild) : null }
          }
        })
        return result
      })
      wrap(scene, 'dispose', original => function (...args) {
        observe(() => add({ kind: 'dispose', epoch: epoch.id, before: snapshot() }))
        try { return original.apply(this, args) }
        finally { epoch.disposed = true; finish() }
      })
      const pending = new WeakMap()
      for (const type of ['pointerdown', 'pointerup', 'pointermove', 'pointerleave', 'pointercancel', 'keydown', 'keyup', 'click', 'focusin', 'focusout']) {
        const owner = type === 'pointerleave' ? scene.renderer.domElement : ['keydown', 'keyup'].includes(type) ? window : document
        const begin = event => observe(() => {
          if (epoch.closed || scene.disposed) return
          const row = { kind: 'input', epoch: epoch.id, type, trusted: event.isTrusted, target: node(event.target), relatedTarget: node(event.relatedTarget),
            panelControl: [...scene.buildingPanels].find(([, panel]) => {
              const control = panel.querySelector?.('.dismantle-control')
              return control && (event.target === control || control.contains(event.target))
            })?.[0] ?? null,
            canvasTarget: event.target === scene.renderer.domElement,
            canvasOwned: Number.isFinite(event.clientX) && document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement,
            key: event.key, x: event.clientX, y: event.clientY, button: event.button, buttons: event.buttons,
            modifiers: [event.shiftKey, event.ctrlKey, event.altKey, event.metaKey].map(Boolean),
            hit: Number.isFinite(event.clientX) ? node(document.elementFromPoint(event.clientX, event.clientY)) : null,
            before: simulation(scene), state: snapshot() }
          add(row); pending.set(event, records.at(-1))
        })
        const end = event => observe(() => {
          const row = pending.get(event); if (!row) return
          row.after = simulation(scene); row.afterState = snapshot(); row.defaultPrevented = event.defaultPrevented
          pending.delete(event)
        })
        owner.addEventListener(type, begin, true); epoch.listeners.push([owner, type, begin, true])
        owner.addEventListener(type, end, false); epoch.listeners.push([owner, type, end, false])
      }
      add({ kind: 'start', epoch: epoch.id, before: epoch.initial })
    } catch (e) { finish(); throw e }
  }
  const wrapper = function (...args) {
    const result = originalStart.apply(this, args)
    if (result && !closed && !epochs.some(epoch => epoch.scene === this)) observe(() => attach(this))
    return result
  }
  GameScene.prototype.start = wrapper
  const summary = () => ({ closed, errors: [...errors], phase, recordCount: records.length,
    trainingHeldVisits: observeTraining ? Object.fromEntries(epochs.map(epoch => [epoch.id,
      records.filter(row => row.kind === 'tick' && row.epoch === epoch.id &&
        row.before.records.some(record => record.id === targetId && record.automatic && record.phase === 1) &&
        row.after.records.some(record => record.id === targetId && record.automatic && record.phase === 1 && record.remaining === 15) &&
        (row.before.training.camps.find(b => b.id === targetId)?.admission.activity & 128) &&
        row.after.input?.object?.id !== targetId &&
        !row.after.panels.some(panel => panel.id === targetId && (panel.hovered || panel.focused))).length])) : null,
    phaseInspections: records.filter(row => row.phase === phase && row.kind === 'tick')
      .flatMap(row => row.after.controller?.lastVisit?.inspection ?? []),
    phasePanelControlInput: records.find(row => row.phase === phase && row.kind === 'input' &&
      row.type === 'pointermove' && row.trusted && row.panelControl !== null)?.panelControl ?? null,
    phasePanelControlTicks: records.filter(row => row.phase === phase && row.kind === 'tick')
      .flatMap(row => row.after.panels.filter(panel => !panel.hidden && panel.controlHovered))
      .reduce((counts, panel) => { counts[panel.id] = (counts[panel.id] ?? 0) + 1; return counts }, {}),
    elapsedMs: performance.now() - initial, captures: Object.fromEntries(Object.entries(frames).map(([key, value]) => [key, !!value.panel])),
    epochs: epochs.map(e => ({ id: e.id, initial: e.initial, state: e.lastState, paint: e.lastPaint, disposed: e.disposed, closed: e.closed,
      omittedIdenticalPointerFrames: e.omittedIdenticalPointerFrames })) })
  return {
    target(id) {
      check(Number.isInteger(id) && id > 0 && !closed, 'Actual building target required')
      check(targetId === null || targetId === id, 'Single building target only')
      targetId = id
    },
    phase(label, when = null) {
      check(!closed && !errors.length, 'Hut observation unavailable')
      phase = label
      if (when) {
        check(Object.keys(frames).length < 8 && !frames[label], 'Eight capture bound or duplicate label')
        check(!capture || frames[capture.label]?.panel, 'Earlier pixel capture incomplete')
        capture = { label, when, epoch: epochs.at(-1)?.id }
      }
    },
    status: summary,
    read() { return structuredClone({ ...summary(), records, frames, epochs: epochs.map(e => ({ id: e.id, initial: e.initial,
      lastState: e.lastState, disposed: e.disposed, closed: e.closed, delivered: e.delivered,
      cleanupHeldPointer: e.cleanupHeldPointer,
      omittedIdenticalPointerFrames: e.omittedIdenticalPointerFrames, omittedSincePointerRecord: e.omittedSincePointerRecord })) }) },
    close() {
      if (!closed) {
        for (const epoch of epochs) epoch.finish()
        if (GameScene.prototype.start !== wrapper) error('Foreign Scene.start wrapper preserved')
        else if (startDescriptor) Object.defineProperty(GameScene.prototype, 'start', startDescriptor)
        else delete GameScene.prototype.start
        closed = true
      }
      return this.read()
    },
  }
}
