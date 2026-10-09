// Passive, page-serializable observer. The real game owns inputs, RAF and draws.
export function installTreeHoverWitness(targets) {
  const scene = window.testSceneRef.current, world = scene.world, clock = scene.gameClock,
    renderer = scene.renderer, canvas = renderer.domElement, startedAt = performance.now()
  const phases = [], records = [], frames = {}, errors = [], wrappers = [], listeners = []
  const pending = new WeakMap()
  let phase = null, activePointer = null, lastPointer = null, ordinal = 0, closed = false
  const check = (ok, message) => { if (!ok) throw Error(message) }
  const error = value => { if (errors.length < 8) errors.push(String(value?.stack ?? value)) }
  const observe = fn => { if (!closed && !errors.length) try { return fn() } catch (e) { error(e) } }
  const add = row => {
    check(records.length < 512, '512-record tree-hover bound exceeded')
    row.ordinal = ++ordinal; records.push(row); return row
  }
  const owner = () => {
    check(window.testSceneRef.current === scene && scene.world === world && window.testStore.getWorld() === world &&
      scene.renderer === renderer && scene.gameClock === clock && renderer.domElement === canvas && canvas.isConnected,
    'Tree-hover Scene/World/clock/canvas ownership changed')
    for (const entry of wrappers) check(entry.owner[entry.key] === entry.wrapper, `Observer lost ${entry.key}`)
    check(performance.now() - startedAt <= 120000, '120-second tree-hover observation bound exceeded')
  }
  const state = () => {
    owner()
    return structuredClone({ sceneFrame: scene.frame, turn: world.turn, animationFrame: clock.animationFrame,
      rendererFrame: renderer.info.render.frame, speed: world.speed, paused: world.paused,
      status: world.status, mode: world.mode, inputMask: world.inputMask, selected: world.selected,
      keys: [...scene.keys], pointer: scene.pointerScreen, buttons: scene.pointerButtons, hovered: scene.hoveredObject,
      camera: { point: scene.viewPoint, bearing: scene.cameraBearing, preset: scene.viewPreset,
        transition: scene.viewTransition?.remaining ?? 0, overview: scene.overviewActive },
      flyby: world.flyby.flags })
  }
  const bodies = () => Object.fromEntries(targets.map(target => {
    const group = target.kind === 'tree' ? scene.decorations.children.find(g => g.userData.point?.id === target.id)
      : scene.buildingMeshes.get(target.id)
    const rows = []
    group?.traverse(mesh => {
      if (mesh.userData.highlight) rows.push({ id: mesh.parent?.userData.point?.id ?? mesh.parent?.userData.building,
        nativeModel: mesh.userData.nativeModel, visible: mesh.visible && group.visible,
        uniform: mesh.userData.highlight.value })
    })
    return [target.id, rows]
  }))
  const wrap = (target, key, create) => {
    const original = target[key], descriptor = Object.getOwnPropertyDescriptor(target, key)
    check(typeof original === 'function', `Missing observer boundary ${key}`)
    const wrapper = create(original)
    wrappers.push({ owner: target, key, original, descriptor, wrapper }); target[key] = wrapper
  }
  const retain = (key, row) => {
    if (frames[key]) return
    check(Object.keys(frames).length < 10, 'Ten-PNG tree-hover bound exceeded')
    check(canvas.width * canvas.height <= 2000000 && canvas.width > 0 && canvas.height > 0,
      'Canvas outside declared capture bounds')
    frames[key] = { ordinal: row.ordinal, png: canvas.toDataURL('image/png') }
  }
  const cleanup = () => {
    if (closed) return
    closed = true
    for (const [target, type, fn, capture] of listeners) try { target.removeEventListener(type, fn, capture) } catch (e) { error(e) }
    for (const entry of wrappers.toReversed()) try {
      if (entry.owner[entry.key] !== entry.wrapper) { error(`Observer lost ${entry.key} during cleanup`); continue }
      if (entry.descriptor) Object.defineProperty(entry.owner, entry.key, entry.descriptor)
      else delete entry.owner[entry.key]
    } catch (e) { error(e) }
  }
  try {
    wrap(scene.picking, 'pick', original => function (...args) {
      // Original exceptions and return objects propagate unchanged.
      let result
      try { result = original.apply(this, args) }
      catch (e) { if (activePointer) observe(() => activePointer.picks.push({ threw: true, error: String(e) })); throw e }
      if (activePointer) observe(() => activePointer.picks.push({ receiverMatches: this === scene.picking,
        x: args[0]?.clientX, y: args[0]?.clientY, id: result, sceneFrame: scene.frame, rendererFrame: renderer.info.render.frame,
        canvasOwned: document.elementFromPoint(args[0]?.clientX, args[0]?.clientY) === canvas }))
      return result
    })
    wrap(scene, 'updatePointerFrame', original => function (...args) {
      activePointer = phase && !phase.done ? { picks: [], receiverMatches: this === scene } : null
      let result
      try { result = original.apply(this, args) }
      catch (e) { activePointer = null; throw e }
      if (activePointer) observe(() => { lastPointer = { ...activePointer, state: state() } })
      activePointer = null
      return result
    })
    wrap(renderer, 'render', original => function (...args) {
      let beforeRendererFrame
      try { beforeRendererFrame = renderer.info.render.frame } catch (e) { error(e) }
      const result = original.apply(this, args)
      if (args[0] !== scene.scene || args[1] !== scene.camera || !phase || phase.done) return result
      observe(() => {
        const current = state()
        check(this === renderer && current.rendererFrame > beforeRendererFrame, 'Main render receiver/frame did not advance')
        check(performance.now() - phase.startedAt <= 12000, '12-second tree-hover phase bound exceeded')
        check(current.speed === 1 && current.paused === false && current.status === 'playing' &&
          current.mode === null && current.inputMask === 0 && current.buttons === 0 &&
          !current.camera.overview && !(current.flyby & 1), 'Ordinary hover prerequisites changed')
        check(JSON.stringify(current.selected) === JSON.stringify(phase.selected), 'Hover changed selection')
        const row = add({ kind: 'render', phase: phase.name, receiverMatches: this === renderer, beforeRendererFrame, state: current, bodies: bodies(), pointerUpdate: lastPointer })
        const changed = phase.kind === 'camera' && phase.inputOrdinal && current.pointer?.clientX === phase.point.x && current.pointer?.clientY === phase.point.y &&
          (phase.change === 'pan' ? JSON.stringify(current.camera.point) !== JSON.stringify(phase.initial.camera.point)
            : current.camera.preset === 2 && current.camera.transition === 0)
        const matches = phase.kind === 'camera' ? changed : phase.kind === 'leave' ? current.hovered === null && current.pointer === null
          : current.hovered === phase.id && current.pointer?.clientX === phase.point.x && current.pointer?.clientY === phase.point.y
        if (!matches) return
        if (phase.kind === 'leave' && phase.continuationOf) {
          const leave = records.find(event => event.kind === 'event' && event.type === 'pointerleave' &&
            event.trusted && event.canvasTarget && !event.canvasOwned &&
            event.ordinal > phase.afterHitOrdinal)
          if (!leave) return
          phase.leaveOrdinal = leave.ordinal
        }
        if (phase.singleFrame) phase.hitOrdinal ??= row.ordinal
        phase.residues = [...new Set([...phase.residues, current.turn & 3])]
        if (phase.kind === 'leave' || phase.kind === 'camera') { retain(phase.name, row); phase.done = true }
        else {
          retain(`${phase.name}-${(current.turn & 3) < 2 ? 200 : 255}`, row)
          phase.done = phase.singleFrame === true || phase.residues.length === 4
        }
      })
      return result
    })
    const simulation = () => structuredClone({ selected: world.selected, orderCursor: world.orderCursor,
      lastOrderTurn: world.lastOrderTurn, random: world.randomState, cosmeticRandom: world.cosmeticRandom.randomState,
      orders: world.buildingOrders,
      units: world.units.map(unit => ({ id: unit.id, target: unit.target, work: unit.work, tree: unit.tree,
        commands: unit.native?.commands, commandCursor: unit.native?.commandCursor,
        commandStatus: unit.native?.commandStatus, nativeTarget: unit.native?.target,
        immediateCommand: unit.native?.immediateCommand, workTarget: unit.native?.workTarget, orderLocation: unit.native?.orderLocation })) })
    for (const [target, types] of [[canvas, ['pointermove', 'pointerleave']], [scene.mini, ['pointerdown']], [window, ['keydown', 'keyup']]])
      for (const type of types) {
        const begin = event => observe(() => {
          if (!phase) return
          const hit = Number.isFinite(event.clientX) ? document.elementFromPoint(event.clientX, event.clientY) : null
          const node = value => value ? { tag: value.tagName ?? null,
            className: typeof value.className === 'string' ? value.className : null, role: value.getAttribute?.('role') ?? null } : null
          const row = add({ kind: 'event', phase: phase.name, type, trusted: event.isTrusted,
            x: event.clientX ?? null, y: event.clientY ?? null, key: event.key ?? null,
            repeat: !!event.repeat, buttons: event.buttons ?? null, canvasTarget: event.target === canvas,
            canvasOwned: hit === canvas, hitNode: node(hit), relatedTarget: node(event.relatedTarget),
            before: simulation(), state: state(), after: null })
          pending.set(event, row)
        })
        const end = event => observe(() => {
          const row = pending.get(event)
          if (!row) return
          row.after = simulation(); row.afterState = state(); row.defaultPrevented = event.defaultPrevented
          if (phase.kind === 'camera' && !phase.done && type === 'keydown' && event.defaultPrevented &&
            event.key === (phase.change === 'pan' ? 'w' : '-')) phase.inputOrdinal = row.ordinal
          pending.delete(event)
        })
        // Capture precedes the game's handler; bubble follows it in one dispatch.
        target.addEventListener(type, begin, true); listeners.push([target, type, begin, true])
        target.addEventListener(type, end, false); listeners.push([target, type, end, false])
      }

  } catch (e) { cleanup(); throw e }
  return {
    arm(spec) {
      owner(); check(!phase || phase.done, 'Previous tree-hover phase incomplete')
      check(phases.length < 8, 'Eight-phase tree-hover bound exceeded')
      const afterHitOrdinal = spec.continuationOf ? phase?.name === spec.continuationOf && phase.hitOrdinal : undefined
      check(!spec.continuationOf || Number.isInteger(afterHitOrdinal), 'Missing prior actual hover render')
      phase = { ...spec, afterHitOrdinal, initial: state(), selected: [...world.selected], startedAt: performance.now(), residues: [], done: false }
      phases.push(phase); lastPointer = null
    },
    status() { observe(owner); return structuredClone({ phase, errors, closed }) },
    read: () => structuredClone({ phases, records, frames, errors, closed }),
    close: cleanup,
  }
}
