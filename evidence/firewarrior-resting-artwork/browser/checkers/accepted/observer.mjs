// Source-derived passive reads; this file changes diagnostic globals only.
// Registry IDs remain stable throughout this document, including UI Load epochs.
export async function installNativeGuardObserver({ hutId = null } = {}) {
  const { unitAnimationSource, unitAnimation, canOrder } = await import('/app/model.ts')
  const { buildingModel, buildingPose } = await import('/app/building-shapes.ts')
  const { tribeForTeam } = await import('/app/world-types.ts')
  const { default: rules } = await import('/app/original-rules.json')
  const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
  const registry = window.nativeGuardIdentityRegistry ??= { identities: new WeakMap(), nextIdentity: 1, epoch: -1 }
  registry.hutId = hutId ?? registry.hutId ?? null
  registry.epoch++
  const epoch = registry.epoch, identities = registry.identities
  const identity = object => {
    if (!object) return null
    if (!identities.has(object)) identities.set(object, registry.nextIdentity++)
    return identities.get(object)
  }
  const fields = (object, names) => Object.fromEntries(names.map(name => [name, object[name] ?? null]))
  const nativeFields = ('id class tribe model object draw f1 f2 flags2 flags3 flags4 stamp renderFlags '
    + 'selectionFlags state previousState substate commandStatus commandCursor immediateCommand '
    + 'orderLocation workTarget assignment stateObject animationMode counter speed timer anchorFlags formationCell '
    + 'x y h angle heading goalX goalY target vehicle morph morphTimer morphFrames guardInputPending life motionIndex workFlags').split(' ')
  const initialScene = window.testSceneRef.current, initialWorld = initialScene.world
  // Exact accepted campaign command-owner priority; distinct from renderer ownership.
  const commandPerson = u => u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
  const readInput = () => {
    const s=window.testSceneRef.current,w=s.world
    if(s!==initialScene||w!==initialWorld||w!==window.testStore.getWorld())throw Error('Input observation scene/world changed')
    const owner = p => {
      if(!p)return null
      const commands=[...p.commands],id=p.immediateCommand||commands[p.commandCursor]||0
      return {identity:identity(p),...fields(p,['id','class','model','state','commandStatus','guardInputPending','flags2','flags3','flags4','vehicle','workFlags','target']),
        commands,commandCursor:p.commandCursor,immediateCommand:p.immediateCommand,activeId:id,
        orders:[...new Set([p.immediateCommand,...commands].filter(Boolean))].map(id=>({id,record:w.buildingOrders.records[id]?{...w.buildingOrders.records[id]}:null}))}
    }
    const ids=new Set([...w.selected,...(registry.observedIds??[])])
    return {scope:'synchronous-existing-pointer-handler',epoch,sceneIdentity:identity(s),worldIdentity:identity(w),
      turn:w.turn,time:w.time,lastOrderTurn:w.lastOrderTurn,status:w.status,paused:w.paused,speed:w.speed,inputMask:w.inputMask,mode:w.mode,
      selected:[...w.selected],pointerAck:{...s.pointerAck},
      effects:w.effects.map(e=>{
        const slot=e.kind==='orderMarker'?w.secondaryEffects.slots.findIndex(p=>p?.kind==='orderMarker'&&p.effect===e.id):-1,p=slot>=0?w.secondaryEffects.slots[slot]:null
        return {id:e.id,kind:e.kind,x:e.x,z:e.z,turnsRemaining:e.turnsRemaining,
          secondaryOwner:p?{slot,kind:p.kind,effect:p.effect,serial:p.serial}:null}
      }),
      units:w.units.filter(u=>ids.has(u.id)).map(u=>{
        const p=commandPerson(u),commandOwner=owner(p),q=commandOwner?.activeId,source=unitAnimationSource(u)
        return {identity:identity(u),...fields(u,['id','team','kind','hp','x','z','inside','work','target']),
          nativeIdentity:identity(u.native),sourceIdentity:identity(source),native:owner(u.native),
          commandOwnerIdentity:identity(p),commandOwner,
          commandOwnerSlots:[u.builder?.person,u.flight,u.fight?.motion,u.native,u.entry?.person].map(identity),
          order:q&&w.buildingOrders.records[q]?{id:q,...w.buildingOrders.records[q]}:null}
      })}
  }
  const snapshot = now => {
    const s = window.testSceneRef.current, w = s.world
    if (s !== initialScene || w !== initialWorld || w !== window.testStore.getWorld())
      throw new Error('Scene/store identity changed within this fresh observation')
    const owner = p => {
      if (!p) return null
      const commands = p.commands ? [...p.commands] : [],
        activeId = p.immediateCommand || commands[p.commandCursor] || 0,
        ids = [...new Set([...commands, p.immediateCommand, activeId].filter(Boolean))]
      return { identity: identity(p), ...fields(p, nativeFields), commands, activeId,
        descriptorMode: rules.animationDescriptors[p.draw]?.mode ?? null,
        registered: w.objectCells.objects.get(p.id) === p,
        orders: ids.map(id => ({ id, record: w.buildingOrders.records[id]
          ? { identity: identity(w.buildingOrders.records[id]), ...w.buildingOrders.records[id] }
          : null })) }
    }
    const observedIds = registry.observedIds ?? null
    const units = w.units.filter(u => u.team === 'blue' && (!observedIds || observedIds.includes(u.id) || u.kind === 'firewarrior')).map(u => {
      const source = unitAnimationSource(u), commandSource = commandPerson(u), mesh = s.unitMeshes.get(u.id),
        slots = [['flight', u.flight], ['fight.motion', u.fight?.motion], ['native', u.native],
          ['entry.person', u.entry?.person], ['builder.person', u.builder?.person]],
        owners = [...new Set(slots.map(([, p]) => p).filter(Boolean))]
      return { identity: identity(u), ...fields(u, ['id', 'team', 'kind', 'hp', 'x', 'z',
        'inside', 'work', 'target', 'guard', 'heading', 'timer', 'idleTurns', 'fighting']),
        selected: w.selected.includes(u.id), pose: unitAnimation(w, u), selectable: canOrder(u),
        nativeIdentity: identity(u.native), native: owner(u.native), commandOwnerIdentity: identity(commandSource),
        order: (() => { const p = commandSource; const id = p && (p.immediateCommand || p.commands[p.commandCursor]); return id ? { id, ...w.buildingOrders.records[id] } : null })(),
        busy: { ghost: !!u.ghost, flight: !!u.flight, fight: !!u.fight, casting: !!u.casting, lift: !!u.lift, entry: !!u.entry, builder: !!u.builder, harvest: !!u.harvest, delivery: !!u.delivery, vault: !!u.vault, attackReservation: !!u.attackReservation, tree: u.tree ?? null, registeredRouteIsNative: !!u.native && w.pathfinding.people.get(u.id) === u.native, otherRegisteredRoute: !!w.pathfinding.people.get(u.id) && w.pathfinding.people.get(u.id) !== u.native },
        path: u.path.map(p => ({ x: p.x, z: p.z })),
        fight: u.fight ? { action: u.fight.action, animation: u.fight.animation ?? null } : null,
        sourceIdentity: identity(source),
        sourceAliases: slots.filter(([, p]) => p && p === source).map(([name]) => name),
        owners: owners.map(p => ({ aliases: slots.filter(([, other]) => other === p).map(([name]) => name), ...owner(p) })),
        mesh: mesh ? { identity: identity(mesh), visible: mesh.visible,
          objectsVisible: s.objects.visible, sceneVisible: s.scene.visible,
          position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
          frame: mesh.userData.frame ?? null, draw: mesh.userData.draw ?? null,
          frameFlip: mesh.userData.frameFlip ?? null,
          layers: (mesh.userData.layers ?? []).map(layer => {
            const uv = layer.userData.atlasTransform
            return { visible: layer.visible, piece: layer.userData.piece ?? null,
              uv: uv ? [uv.x, uv.y, uv.z, uv.w] : null }
          }) } : null }
    })
    const hut = w.buildings.find(b => b.id === registry.hutId), admission = hut?.admission
    const anchors = w.units.filter(u => u.hp > 0 && (observedIds ? observedIds.includes(u.id) : u.team === 'blue' && u.kind === 'shaman'))
    const wrap = value => ((value + 128) % 256 + 256) % 256 - 128
    const distance = object => Math.min(...anchors.map(u => Math.hypot(wrap(u.x-object.x),wrap(u.z-object.z))))
    const hostile = object => object.team !== 'blue' && object.team !== 'wild' && !(w.outcome.alliances[0] & (1 << tribeForTeam(object.team)))
    const threats = { radius: 16, blueAlliances: w.outcome.alliances[0],
      actors: anchors.map(u => ({ id:u.id,kind:u.kind,hp:u.hp,x:u.x,z:u.z,inside:u.inside,work:u.work,target:u.target,fighting:!!u.fighting })),
      units: w.units.filter(u => u.hp > 0 && hostile(u) && distance(u) <= 16).map(u => ({ id:u.id,team:u.team,kind:u.kind,hp:u.hp,x:u.x,z:u.z,distance:distance(u),target:u.target,fighting:!!u.fighting })),
      buildings: w.buildings.filter(b => b.hp > 0 && hostile(b) && distance(b) <= 16).map(b => ({ id:b.id,team:b.team,kind:b.kind,model:buildingModel(b),hp:b.hp,progress:b.progress,x:b.x,z:b.z,distance:distance(b) })) }
    return { now, epoch, sceneNow: s.previous, timeOrigin: performance.timeOrigin,
      sceneIdentity: identity(s), worldIdentity: identity(w), visibility: document.visibilityState,
      level: w.outcome.level, status: w.status, turn: w.turn, time: w.time,
      speed: w.speed, paused: w.paused, inputMask: w.inputMask, mode: w.mode,
      animationFrame: s.gameClock.animationFrame, animationTime: s.gameClock.animationTime,
      landFlags: w.land.landFlags, levelFlags2: w.levelFlags2,
      selected: [...w.selected], lastOrderTurn: w.lastOrderTurn, pointerAck: structuredClone(s.pointerAck),
      effects: w.effects.map(e => ({ id: e.id, kind: e.kind, x: e.x, z: e.z })),
      camera: { point: { ...s.viewPoint }, position: { ...s.cameraPosition }, bearing: s.cameraBearing, motion: { ...s.cameraMotion }, overview: s.overviewStage },
      readiness: campaignShamanReadiness(w), pool: { cursor: w.buildingOrders.cursor, active: w.buildingOrders.active },
      buildings: w.buildings.map(b => ({ id: b.id, team: b.team, tribe: tribeForTeam(b.team), kind: b.kind, model: buildingModel(b), pose: buildingPose(b), x: b.x, z: b.z, hp: b.hp, progress: b.progress })),
      threats, hutId: registry.hutId,
      braveRoster: w.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => ({id:u.id,hp:u.hp,x:u.x,z:u.z,inside:u.inside,work:u.work})),
      campaignTimer: w.campaignTimer, trained: w.stats.trained,
      units, observedUnitIds: observedIds,
      hut: hut ? { ...fields(hut, ['id', 'kind', 'team', 'x', 'z', 'hp', 'progress', 'timer']),
        admission: admission ? { identity: identity(admission),
          ...fields(admission, ['class', 'model', 'inside', 'entering', 'activity', 'queueHead',
            'queueFrom', 'trainingCost', 'storedMana', 'trainingTimer', 'counter', 'lastActivity']),
          occupants: [...admission.occupants] } : null } : null,
      tribeMana: fields(w.manaTribes[0], ['available', 'pending', 'mana', 'estimatedRate', 'shamanGuards', 'shamanGuardChanged']),
      shrines: w.shrines.map(h => ({ ...fields(h, ['id', 'kind', 'x', 'z', 'uses', 'remaining', 'progress']) })) }
  }

  window.nativeGuardReadInput = readInput
  window.nativeGuardRead = () => snapshot(performance.now())
  return { epoch, now: performance.now() }
}

// Independent read-only RAF. Never scene.frame, a game-clock callback, or a renderer.
export function startNativeGuardCapture({ maxMs = 90000, requiredIds = [], allowPaused = false } = {}) {
  if (window.nativeGuardCapture?.running) throw Error('An observation is already running')
  if (!Number.isFinite(maxMs) || maxMs <= 0 || maxMs > 180000) throw Error('Invalid observation bound')
  const capture = { running: true, startedAt: performance.now(), rows: [], errors: [], totalRows: 0, allowPaused, requiredIds, endedAt: null }
  window.nativeGuardCapture = capture
  let ownFrame, timer
  capture.finish = reason => {
    if (!capture.running) return
    capture.running = false; capture.endedAt = performance.now()
    if (reason) capture.errors.push(reason)
    clearTimeout(timer); cancelAnimationFrame(ownFrame)
  }
  const sample = () => {
    try {
      const row = window.nativeGuardRead()
      capture.rows.push(row); capture.totalRows++
      if (capture.rows.length > 12000 || capture.totalRows > 18000) throw Error('Observer row bound reached')
      const firstTotem = row.shrines.find(h => h.kind === 'linkedEffects' && h.x === 29 && h.z === -67)
      if (row.visibility !== 'visible' || row.status !== 'playing' || row.speed !== 1 || row.inputMask || row.campaignTimer !== null || !firstTotem || firstTotem.uses !== 0 || firstTotem.remaining !== 1 || firstTotem.progress !== 0) throw Error('Ordinary witness safety invariant changed')
      if (!capture.allowPaused && row.paused) throw Error('Unexpected pause')
      if (capture.requiredIds.some(id => !row.units.some(u => u.id === id && u.hp > 0))) throw Error('Required live actor disappeared')
      ownFrame = requestAnimationFrame(sample)
    } catch (error) { capture.finish(String(error?.stack ?? error)) }
  }
  timer = setTimeout(() => capture.finish('Observation resource deadline'), maxMs)
  ownFrame = requestAnimationFrame(sample)
  return { startedAt: capture.startedAt, maxMs, epoch: window.nativeGuardIdentityRegistry.epoch }
}

export function drainNativeGuardCapture({ finish = false } = {}) {
  const capture = window.nativeGuardCapture
  if (!capture) return null
  if (finish) capture.finish()
  return { startedAt: capture.startedAt, endedAt: capture.endedAt, running: capture.running, totalRows: capture.totalRows, errors: [...capture.errors], rows: capture.rows.splice(0) }
}

// Diagnostic scope only: all naturally appearing Firewarriors remain discoverable.
export function setNativeGuardObservedIds(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.some(id => !Number.isInteger(id) || id <= 0)) throw Error('Invalid observed actor IDs')
  window.nativeGuardIdentityRegistry.observedIds = [...ids]
}

export function setNativeGuardObservedHut(id) {
  if(!Number.isInteger(id)||id<=0)throw Error('Invalid observed hut identity')
  window.nativeGuardIdentityRegistry.hutId=id
}
