// A single post-construction Temple epoch. No clocks, commands or World fields are written.
export function createTempleTrainingEpoch({
  scene,
  store,
  targetId,
  controller,
  session = controller?.session,
  epoch = 1,
  maxRecords = 8192,
  trackInspection = false,
  doc = document,
}) {
  if (!Number.isInteger(targetId) || !Number.isInteger(maxRecords) || maxRecords < 1)
    throw new Error('Finite target and record bound required')
  if (scene.world !== store.getWorld() || !scene.isCurrent())
    throw new Error('Current Scene required')
  const world = scene.world,
    records = [],
    errors = [],
    restorers = [],
    identities = new WeakMap()
  let nextIdentity = 1,
    ordinal = 0,
    traineeId = null,
    input = null,
    closed = false,
    disposed = false
  let firstRequest = null,
    heldVisits = 0,
    overflow = false
  let actualPointer = scene.pointerScreen ? { ...scene.pointerScreen } : null
  const identity = value => {
    if (!value || typeof value !== 'object') return null
    if (!identities.has(value)) identities.set(value, nextIdentity++)
    return identities.get(value)
  }
  const error = value => {
    if (errors.length < 16) errors.push(String(value?.stack ?? value))
    else overflow = true
  }
  const admission = value =>
    value
      ? {
          ...Object.fromEntries(
            Object.entries(value).filter(
              ([, v]) => v === null || ['number', 'boolean', 'string'].includes(typeof v)
            )
          ),
          occupants: [...value.occupants],
        }
      : null
  const person = unit => {
    if (!unit) return null
    const owner = unit.entry?.person,
      orderId = owner && (owner.immediateCommand || owner.commands[owner.commandCursor])
    const order = orderId ? world.buildingOrders.records[orderId] : null
    return {
      id: unit.id,
      kind: unit.kind,
      team: unit.team,
      hp: unit.hp,
      inside: unit.inside,
      work: unit.work,
      entryPersonId: owner?.id ?? null,
      entryIdentity: identity(owner),
      registeredIdentity: identity(world.objectCells.objects.get(unit.id)),
      entryOrdersMatch: !!owner && unit.entry.orders === world.buildingOrders,
      commands: owner ? [...owner.commands] : null,
      cursor: owner?.commandCursor ?? null,
      orderId: orderId ?? 0,
      order: order
        ? {
            model: order.model,
            a: order.a,
            b: order.b,
            flags: order.flags,
            references: order.references,
          }
        : null,
    }
  }
  const snapshot = () => {
    const building = world.buildings.find(b => b.id === targetId),
      record = scene.objectPanels.buildingRecords.get(targetId)
    const panel = scene.buildingPanels.get(targetId),
      selected = world.units.find(u => u.id === traineeId)
    const focused = !!panel?.contains(doc.activeElement),
      hovered = !!panel?.matches(':hover')
    const pointerTarget = actualPointer
      ? doc.elementFromPoint(actualPointer.clientX, actualPointer.clientY)
      : null
    const pointerAway =
      !!pointerTarget &&
      !panel?.contains(pointerTarget) &&
      (pointerTarget !== scene.renderer.domElement || scene.hoveredObject !== targetId)
    return {
      epoch,
      turn: world.turn,
      trained: world.stats.trained,
      paused: world.paused,
      level: world.outcome.level,
      mode: world.mode,
      speed: world.speed,
      inputMask: world.inputMask,
      status: world.status,
      gameFlags: world.manaWorld.gameFlags,
      unlockedTemple: world.unlockedTemple,
      overviewStage: scene.overviewStage ?? null,
      braves: world.units
        .filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
        .map(u => u.id),
      shamanAlive: world.units.some(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0),
      shamans: world.units
        .filter(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
        .map(u => u.id),
      otherActiveSchools: world.buildings
        .filter(
          b =>
            b.id !== targetId &&
            b.team === 'blue' &&
            ['camp', 'temple', 'spyHut', 'firewarriorHut'].includes(b.kind) &&
            (b.admission?.activity ?? 0) & 128
        )
        .map(b => b.id),
      current: store.getWorld() === world && scene.isCurrent(),
      selected: [...world.selected],
      sceneFrame: scene.frame,
      animationFrame: scene.gameClock.animationFrame,
      target: building
        ? {
            id: building.id,
            identity: identity(building),
            kind: building.kind,
            team: building.team,
            hp: building.hp,
            progress: building.progress,
            builders: [...(building.builders ?? [])],
            workers: world.units.filter(u => u.hp > 0 && u.work === targetId).map(u => u.id),
            admission: admission(building.admission),
          }
        : null,
      trainee: person(selected),
      preachers: world.units
        .filter(u => u.team === 'blue' && u.kind === 'preacher' && u.hp > 0)
        .map(u => ({ id: u.id, hp: u.hp, team: u.team, kind: u.kind })),
      record: record
        ? {
            identity: identity(record),
            automatic: record.automatic,
            phase: record.phase,
            remaining: record.remaining,
            hold: record.hold,
          }
        : null,
      inspection: {
        selected: scene.objectPanels.buildingInspected,
        held: scene.objectPanels.buildingHeldPointer,
      },
      latch: scene.objectPanels.automaticTrainingLatches.has(targetId),
      reservations: world.secondaryEffects.reservations.filter(
        key => key === `building-panel:${targetId}`
      ).length,
      dom: { present: !!panel, hidden: panel?.hidden ?? null, focused, hovered },
      pointer: actualPointer ? { ...actualPointer } : null,
      offTarget: pointerAway && !focused && !hovered,
      tooltip: controller ? { dwell: controller.dwell, category: controller.category } : null,
      session: session
        ? {
            visits: session.visits,
            threshold: session.threshold,
            sample: session.sample,
            sampleAt: session.sampleAt,
            sampleCount: session.sampleCount,
            initializedBy: session.initializedBy,
          }
        : null,
    }
  }
  const safe = () => {
    try {
      return snapshot()
    } catch (failure) {
      error(failure)
      return null
    }
  }
  const push = row => {
    if (records.length >= maxRecords) {
      if (!overflow) error('Temple epoch record limit reached; evidence incomplete')
      overflow = true
      return
    }
    records.push({ ordinal: ++ordinal, ...row })
  }
  const wrap = (owner, key, kind, relevant = () => true) => {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key),
      original = owner[key]
    if (typeof original !== 'function') throw new Error(`Missing actual ${key}`)
    function replacement(...args) {
      const observe = !closed && relevant(args),
        before = observe ? safe() : null
      let result,
        threw = false,
        failure
      try {
        result = original.apply(this, args)
      } catch (value) {
        threw = true
        failure = value
      }
      if (observe) {
        const after = safe(),
          row = {
            kind,
            receiverMatches: this === owner,
            before,
            after,
            threw,
            result:
              typeof result === 'string' || typeof result === 'boolean' || result === null
                ? result
                : null,
            ...(kind === 'renew' ? { hovered: args[0] } : {}),
            ...(threw ? { error: String(failure?.stack ?? failure) } : {}),
          }
        push(row)
        if (kind === 'request' && !firstRequest)
          firstRequest = structuredClone(records.at(-1) ?? row)
        if (
          kind === 'step' &&
          before?.record?.phase === 1 &&
          before.record.identity === after?.record?.identity &&
          before.offTarget &&
          after?.record?.phase === 1 &&
          after.record.remaining === 15 &&
          after.offTarget &&
          after.target?.admission?.activity & 128
        )
          heldVisits++
        if (kind === 'dispose') disposed = true
      }
      if (threw) throw failure
      return result
    }
    owner[key] = replacement
    restorers.push(() => {
      if (owner[key] !== replacement) throw new Error(`Foreign replacement of ${key}; preserved`)
      if (descriptor) Object.defineProperty(owner, key, descriptor)
      else delete owner[key]
    })
  }
  const finishInput = () => {
    if (!input) return null
    let restored = true
    for (const [type, fn, capture] of [
      ['pointerdown', input.down, true],
      ['pointerup', input.up, false],
    ]) {
      try {
        input.remove.call(input.canvas, type, fn, capture)
      } catch (failure) {
        restored = false
        input.errors.push(String(failure))
        error(failure)
      }
    }
    const result = { events: input.events, errors: input.errors, restored }
    input = null
    return structuredClone(result)
  }
  let initial
  try {
    const pointer = event => {
      actualPointer = { clientX: event.clientX, clientY: event.clientY }
    }
    doc.addEventListener('pointermove', pointer, true)
    restorers.push(() => doc.removeEventListener('pointermove', pointer, true))
    wrap(scene.objectPanels, 'requestAutomaticTraining', 'request', args => args[0] === targetId)
    wrap(scene.objectPanels, 'stepBuildingInspections', 'step')
    if (trackInspection) wrap(scene.objectPanels, 'renewBuildingInspection', 'renew')
    wrap(scene.gameClock, 'afterTurn', 'turn')
    wrap(scene, 'dispose', 'dispose')
    initial = snapshot()
  } catch (failure) {
    for (const restore of restorers.reverse())
      try {
        restore()
      } catch (problem) {
        error(problem)
      }
    throw failure
  }
  return {
    snapshot,
    setTrainee(id) {
      if (traineeId !== null && traineeId !== id)
        throw new Error('Epoch trainee cannot be replaced')
      if (
        !world.units.some(u => u.id === id && u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
      )
        throw new Error('Living Blue Brave required')
      traineeId = id
    },
    armInput(id) {
      if (input) throw new Error('Input observation already armed')
      this.setTrainee(id)
      const events = [],
        inputErrors = [],
        canvas = scene.renderer.domElement
      const capture = event => {
        try {
          events.push({
            type: event.type,
            trusted: event.isTrusted,
            targetMatches: event.target === canvas,
            button: event.button,
            buttons: event.buttons,
            x: event.clientX,
            y: event.clientY,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            canvasOwned: doc.elementFromPoint(event.clientX, event.clientY) === canvas,
            state: snapshot(),
          })
        } catch (failure) {
          inputErrors.push(String(failure))
          error(failure)
        }
      }
      const add = canvas.addEventListener,
        remove = canvas.removeEventListener
      input = { canvas, remove, down: capture, up: capture, events, errors: inputErrors }
      add.call(canvas, 'pointerdown', capture, true)
      add.call(canvas, 'pointerup', capture)
    },
    finishInput,
    status() {
      return {
        closed,
        disposed,
        errors: [...errors],
        overflow,
        count: records.length,
        heldVisits,
        firstRequest: firstRequest && structuredClone(firstRequest),
        current: snapshot(),
      }
    },
    close() {
      if (closed) throw new Error('Full Temple epoch export already collected')
      const final = safe(),
        inputEvidence = finishInput()
      for (const restore of restorers.reverse())
        try {
          restore()
        } catch (failure) {
          error(failure)
        }
      closed = true
      return {
        epoch,
        targetId,
        traineeId,
        initial,
        final,
        disposed,
        closed,
        errors: [...errors],
        overflow,
        heldVisits,
        input: inputEvidence,
        records,
      }
    },
  }
}

// Browser-local ownership; full saved Worlds live only inside checkpoint closures.
export async function installTempleTrainingRuntime({ targetId, trackInspection = false }) {
  const [
    { getTooltipController },
    { armBuildingSceneStart },
    { armTempleCheckpoint },
    { GameScene },
    mana,
    cost,
  ] = await Promise.all([
    import('/app/scene-tooltip-runtime.ts'),
    import('/scripts/local-render/mission3-building-lifecycle.mjs'),
    import('/scripts/local-render/temple-training-checkpoint.mjs'),
    import('/app/scene.ts'),
    import('/app/mana.ts'),
    import('/app/building-occupants.ts'),
  ])
  if (window.m3TempleRoute || window.templeTraining)
    throw new Error('Construction observer must close before a fresh training epoch')
  const store = window.testStore,
    epochs = [],
    checkpoints = {},
    cleanupErrors = []
  const firstScene = window.testSceneRef.current,
    firstSession = getTooltipController(firstScene).session
  let traineeId = null,
    start = null,
    sameSession = null,
    loadInitialSession = null
  const attach = scene => {
    const controller = getTooltipController(scene)
    const next = createTempleTrainingEpoch({
      scene,
      store,
      targetId,
      controller,
      epoch: epochs.length + 1,
      trackInspection: trackInspection && epochs.length === 0,
    })
    try {
      if (traineeId !== null) next.setTrainee(traineeId)
    } catch (failure) {
      next.close()
      throw failure
    }
    epochs.push(next)
    return next
  }
  attach(firstScene)
  const current = () => epochs.at(-1)
  const targetSnapshot = ({ world }) => {
    const b = world.buildings.find(b => b.id === targetId),
      p = world.units.find(u => u.id === traineeId)
    return {
      level: world.outcome.level,
      turn: world.turn,
      paused: world.paused,
      trained: world.stats.trained,
      target: b
        ? {
            id: b.id,
            hp: b.hp,
            progress: b.progress,
            kind: b.kind,
            model: b.admission?.model,
            activity: b.admission?.activity,
            inside: b.admission?.inside,
            occupants: [...(b.admission?.occupants ?? [])],
            cost: b.admission?.trainingCost,
            storedMana: b.admission?.storedMana,
            queueHead: b.admission?.queueHead,
          }
        : null,
      trainee: p
        ? {
            id: p.id,
            kind: p.kind,
            hp: p.hp,
            inside: p.inside,
            entryId: p.entry?.person.id ?? null,
            sharedOrders: p.entry?.orders === world.buildingOrders,
          }
        : null,
      tooltipSession: { ...firstSession },
      reservations: world.secondaryEffects.reservations.filter(
        key => key === `building-panel:${targetId}`
      ),
    }
  }
  const button = name => {
    const found = [...document.querySelectorAll('button')].find(
      item => item.textContent.trim() === name
    )
    if (!found?.isConnected || found.disabled) throw new Error(`Public ${name} unavailable`)
    return found
  }
  const api = {
    status: () => current().status(),
    snapshot: () => current().snapshot(),
    readiness() {
      const w = store.getWorld(),
        people = w.units.filter(u => u.team === 'blue' && u.hp > 0)
      return {
        ...current().snapshot(),
        braves: people
          .filter(u => u.kind === 'brave')
          .map(u => ({
            id: u.id,
            ghost: !!((u.native ?? u.entry?.person ?? u.builder?.person)?.flags4 & 0x800),
            inside: u.inside,
          })),
        shaman: people.filter(u => u.kind === 'shaman').map(u => u.id),
        cost: cost.nativeTrainingCost(
          people.filter(u => u.kind === 'preacher').length,
          4,
          w.manaTribes[0].playerType,
          1
        ),
        generatedMana: mana.generatedMana(mana.liveManaOrders, mana.manaPeople(w), w.manaTribes)[0],
        tribe: { ...w.manaTribes[0], spellProgress: [...w.manaTribes[0].spellProgress] },
      }
    },
    armInput(id) {
      traineeId = id
      current().armInput(id)
    },
    finishInput: () => current().finishInput(),
    frame() {
      const scene = window.testSceneRef.current,
        panel = scene.buildingPanels.get(targetId)
      return {
        snapshot: current().snapshot(),
        label: panel?.getAttribute('aria-label') ?? null,
        panel: panel?.querySelector('canvas')?.toDataURL('image/png') ?? null,
      }
    },
    armSave() {
      if (checkpoints.save) throw new Error('Single Save boundary required')
      checkpoints.save = armTempleCheckpoint({
        kind: 'save',
        store,
        button: button('Save checkpoint'),
        snapshot: targetSnapshot,
      })
      return checkpoints.save.status()
    },
    async saveDigests() {
      return {
        status: checkpoints.save.status(),
        actual: await checkpoints.save.digest(),
        expectedLoad: await checkpoints.save.expectedLoadDigest(),
      }
    },
    armLoad() {
      if (checkpoints.load || epochs.length !== 1)
        throw new Error('Single in-session Load required')
      const oldWorld = store.getWorld()
      checkpoints.load = armTempleCheckpoint({
        kind: 'load',
        store,
        button: button('Load checkpoint'),
        snapshot: targetSnapshot,
      })
      try {
        start = armBuildingSceneStart({
          prototype: GameScene.prototype,
          store,
          expectedWorld: () => (store.getWorld() === oldWorld ? null : store.getWorld()),
          sceneRef: () => window.testSceneRef,
          attach(scene, ref) {
            window.testSceneRef = ref
            window.testScene = scene
            sameSession = getTooltipController(scene).session === firstSession
            loadInitialSession = { ...getTooltipController(scene).session }
            attach(scene)
          },
        })
      } catch (failure) {
        checkpoints.load.close()
        throw failure
      }
      return checkpoints.load.status()
    },
    loadStatus() {
      return {
        checkpoint: checkpoints.load?.status() ?? null,
        start: start?.evidence ?? null,
        epochs: epochs.length,
        sameSession,
        loadInitialSession,
        oldDisposed: epochs[0].status().disposed,
        current: current().status(),
      }
    },
    async loadDigest() {
      return checkpoints.load.digest()
    },
    close() {
      const boundaries = {},
        result = []
      for (const [kind, capture] of Object.entries(checkpoints))
        try {
          boundaries[kind] = capture.close()
        } catch (failure) {
          cleanupErrors.push(String(failure))
        }
      try {
        start?.close()
      } catch (failure) {
        cleanupErrors.push(String(failure))
      }
      for (const owner of epochs)
        try {
          result.push(owner.close())
        } catch (failure) {
          cleanupErrors.push(String(failure))
        }
      if (window.templeTraining !== api) cleanupErrors.push('Foreign training API preserved')
      else delete window.templeTraining
      return {
        targetId,
        traineeId,
        sameSession,
        epochs: result,
        boundaries,
        start: start?.evidence ?? null,
        cleanupErrors,
      }
    },
  }
  window.templeTraining = api
  try {
    return api.status()
  } catch (failure) {
    api.close()
    throw failure
  }
}
