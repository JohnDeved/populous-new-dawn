// Passive phase records only. The renderer and clock keep their original owners.
export function createSermonTracker({ maxVisits = 900, maxMs = 120000, requireMove = false } = {}) {
  const rows = [], progress = { status: requireMove ? 'awaiting-move' : 'waiting-entry', entryTurn: null, startMs: null,
    firstLoopTurn: null, terminalTurn: null, restartTurn: null, visits: 0, opportunities: 0 }
  let orderId, priorAfterTurn, priorTimer = 0
  const fail = reason => { if (progress.status !== 'failed') Object.assign(progress, { status: 'failed', reason }) }
  return { rows, progress, fail, observe(row) {
    if (['passed', 'failed'].includes(progress.status)) return
    rows.push(row)
    if (rows.length > 2800) return fail('Phase record bound exceeded')
    const p = row.person
    if (!row.sameActor || !row.sameWorld || !p || row.owner !== 'native' || row.hp <= 0 ||
      row.kind !== 'preacher' || row.team !== 'blue' || row.inside !== null || row.busy ||
      p.class !== 1 || p.model !== 4 || p.tribe !== 0 || p.vehicle || p.disguise ||
      p.flags2 & (1 | 0x80000 | 0x100000 | 0x800000) || p.flags4 & 0x800 ||
      row.status !== 'playing' || row.paused || row.speed !== 1 || row.visibility !== 'visible' ||
      row.landFlags & 2 || row.listeners.length)
      return fail('Ordinary living on-foot owner / clock / zero-listener precondition changed')
    if (progress.entryTurn === null) {
      if (progress.status === 'awaiting-move') {
        if (row.order?.model === 3) { progress.status = 'waiting-entry'; progress.moveTurn = row.turn }
        return
      }
      if (p.commandStatus === 17 && p.substate >= 3)
        return fail('First post-move sermon was already mid-loop; fresh entry was missed')
      if (row.phase !== 'afterTurn' || p.commandStatus !== 17 || p.substate !== 2) return
      progress.entryTurn = row.turn; progress.startMs = row.now
      progress.status = 'observing'; orderId = row.order?.id
    }
    if (row.now - progress.startMs >= maxMs) return fail('120-second observation ceiling reached')
    if (row.order?.model !== 17 || row.order.id !== orderId || row.order.flags & 1 ||
      p.state !== 10 || p.commandStatus !== 17 || row.site.collision !== 0 || row.threats.length)
      return fail('Sermon queue, safe site, or command17 continuity changed')
    if (!(p.flags3 & 0x40000)) return fail('Person lost logical-animation ownership')
    if (row.phase === 'afterTurn') {
      if (priorAfterTurn !== undefined && row.turn !== priorAfterTurn + 1)
        return fail('Missing or repeated logical afterTurn visit')
      priorAfterTurn = row.turn
      progress.visits++
      if (progress.visits > maxVisits) return fail('900-logical-visit ceiling reached')
      if (p.substate === 3 && p.timer === 1 && p.object === 168) {
        if (progress.firstLoopTurn === null) progress.firstLoopTurn = row.turn
        else if (progress.terminalTurn !== null) progress.restartTurn = row.turn
      }
      if (progress.firstLoopTurn !== null && progress.terminalTurn === null) {
        if (p.timer !== priorTimer + 1 || ![3, 4].includes(p.substate))
          return fail('Active sermon loop was interrupted; retain its actual phase records')
        priorTimer = p.timer
        if (p.object !== 168 || p.draw !== 14 || p.speed || p.flags2 & 0x2004 || p.statusFlags & 1 ||
          !(p.statusFlags & 2) || p.assignment & 64)
          return fail('Baseline loop is not stationary source168 with zero listeners')
        if (!(p.counter & 15)) { row.counter16Opportunity = true; progress.opportunities++ }
        if (p.timer === 840 && p.substate === 4) progress.terminalTurn = row.turn
      }
    } else if (progress.restartTurn !== null && row.turn === progress.restartTurn &&
      p.stamp === row.turn && p.object === 168) {
      progress.status = 'passed'
      progress.completedPhase = row.phase
    }
  } }
}

export function chainPhaseObservers(clock, renderer, observe, read, isMainRender) {
  const originals = [], errors = []
  let lastRenderTurn = -1
  const install = (owner, name, phase, accept = () => true) => {
    const original = owner[name], descriptor = Object.getOwnPropertyDescriptor(owner, name)
    const wrapper = function (...args) {
      const result = original?.apply(this, args)
      try {
        if (accept(args)) {
          const row = read(phase)
          if (phase !== 'render-after-updater' || row.turn !== lastRenderTurn) {
            if (phase === 'render-after-updater') lastRenderTurn = row.turn
            observe(row)
          }
        }
      } catch (error) { errors.push(String(error)) }
      return result
    }
    owner[name] = wrapper
    originals.push({ owner, name, original, descriptor, wrapper })
  }
  install(clock, 'beforeTurn', 'beforeTurn')
  install(clock, 'afterTurn', 'afterTurn')
  install(renderer, 'render', 'render-after-updater', isMainRender)
  return { errors, finish() {
    for (const { owner, name, original, descriptor, wrapper } of originals) {
      if (owner[name] !== wrapper) errors.push(`Observer ownership changed: ${name}`)
      else if (descriptor) Object.defineProperty(owner, name, descriptor)
      else delete owner[name]
    }
    return { errors: [...errors], restored: originals.every(x => x.owner[x.name] === x.original) }
  } }
}

export async function installSermonObservation(id) {
  const { unitAnimationSource, unitInvisibleToPlayer } = await import('/app/model.ts')
  const { currentPersonOrder } = await import('/app/person-orders.ts')
  const { restingCellCollision } = await import('/app/person-collision.ts')
  const { tribeForTeam } = await import('/app/world-types.ts')
  const scene = window.testSceneRef.current, world = scene.world
  const actor = world.units.find(u => u.id === id), native = actor?.native
  if (!native || unitAnimationSource(actor) !== native) throw Error('Acquired Preacher lacks its on-foot native owner')
  const tracker = createSermonTracker({ requireMove: true })
  const read = phase => {
    const w = scene.world, u = w.units.find(u => u.id === id), p = u && unitAnimationSource(u)
    const cell = p ? (p.y >> 9) * 128 + (p.x >> 9) : 0
    const hostile = v => v.team !== 'blue' && v.team !== 'wild' && !(w.outcome.alliances[0] & (1 << tribeForTeam(v.team)))
    const short = v => ((v + 128) % 256 + 256) % 256 - 128
    const distance = v => u ? Math.hypot(short(v.x - u.x), short(v.z - u.z)) : 0
    return { phase, now: performance.now(), timeOrigin: performance.timeOrigin, sceneNow: scene.previous,
      turn: w.turn, time: w.time, animationFrame: scene.gameClock.animationFrame,
      animationTime: scene.gameClock.animationTime, pendingTime: w.pendingTime,
      rng: { simulation: w.randomState, cosmetic: w.cosmeticRandom.randomState },
      sameActor: u === actor && p === native, sameWorld: scene === window.testSceneRef.current &&
        w === world && w === window.testStore.getWorld(), owner: p === u?.native ? 'native' : 'other',
      id, hp: u?.hp, kind: u?.kind, team: u?.team, x: u?.x, z: u?.z, inside: u?.inside,
      busy: !!(u?.flight || u?.fight || u?.fighting || u?.lift || u?.casting || u?.invisibility ||
        u?.ghost || u && unitInvisibleToPlayer(w, u)),
      status: w.status, paused: w.paused, speed: w.speed, visibility: document.visibilityState,
      landFlags: w.land.landFlags, levelFlags2: w.levelFlags2,
      person: p ? structuredClone(p) : null,
      order: p && currentPersonOrder(w.buildingOrders, p) ? {
        id: p.immediateCommand || p.commands[p.commandCursor],
        ...structuredClone(currentPersonOrder(w.buildingOrders, p)) } : null,
      queue: p ? [...new Set([p.immediateCommand, ...p.commands].filter(Boolean))]
        .map(id => ({ id, record: structuredClone(w.buildingOrders.records[id]) })) : [],
      listeners: w.units.filter(v => {
        const n = v.native ?? v.entry?.person ?? v.fight?.motion
        return v.hp > 0 && n?.state === 23 && n.workTarget === id
      }).map(v => v.id),
      threats: [...w.units, ...w.buildings].filter(v => v.hp > 0 && hostile(v) && distance(v) <= 16)
        .map(v => ({ id: v.id, kind: v.kind, team: v.team, distance: distance(v) })),
      site: { cell, flags: w.land.flags[cell], category: w.land.categories[cell],
        building: w.land.buildingIds[cell], collision: p ? restingCellCollision(
          { flags: w.land.flags[cell], category: w.land.categories[cell] }, w.land.walkMasks[0], p) : null },
      mesh: (() => {
        const g = scene.unitMeshes.get(id)
        return g ? { visible: g.visible, frame: g.userData.frame, frameFlip: g.userData.frameFlip,
          draw: g.userData.draw, owner: g.userData.owner, layers: (g.userData.layers ?? []).map(l => ({
            visible: l.visible, piece: l.userData.piece, uv: l.userData.atlasTransform?.toArray() })) } : null
      })() }
  }
  const chain = chainPhaseObservers(scene.gameClock, scene.renderer, row => tracker.observe(row), read,
    args => args[0] === scene.scene && args[1] === scene.camera)
  window.preacherSermon = { tracker, read, drain: () => ({ rows: tracker.rows.splice(0),
    progress: { ...tracker.progress }, errors: [...chain.errors] }), finish: () => chain.finish() }
  return read('armed-before-ordinary-move')
}
