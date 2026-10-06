import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'

const frameCounts = { 160: 4, 168: 6, 176: 10, 184: 18 }
export const gestureSource = source => source === 176 || source === 184

export function requireUpdatedPhase(controller, updated) {
  const a = controller.person, b = updated.person, count = frameCounts[a.object]
  if (!count || ![14, 19].includes(a.draw)) throw Error('Unreviewed sermon animation owner')
  const expectedF1 = a.f1 ? a.f1 - 1 : a.draw === 19 ? 1 : 0
  const expectedF2 = a.f1 ? a.f2 : (a.f2 + 1) % count
  if (updated.turn !== controller.turn || b.object !== a.object || b.draw !== a.draw ||
    b.stamp !== updated.turn || b.f1 !== expectedF1 || b.f2 !== expectedF2)
    throw Error('Logical updater differs from the exact owned source/frame phase')
}

export function createCandidateTracker() {
  const rows = [], events = [], progress = { status: 'awaiting-move', entryTurn: null, startMs: null,
    firstLoopTurn: null, terminalTurn: null, restartTurn: null, visits: 0, opportunities: 0,
    families: { 176: { births: 0, returns: 0 }, 184: { births: 0, returns: 0 } } }
  let orderId, priorAfterTurn, priorTimer = 0, before, pending, active, allowPaused = false
  const fail = reason => { if (progress.status !== 'failed') Object.assign(progress, { status: 'failed', reason }) }
  const record = (kind, row, details = {}) => events.push({ kind, turn: row.turn, now: row.now, ...details })
  return { rows, events, progress, fail, permitOrdinaryPause(value) { allowPaused = value === true }, observe(row) {
    if (['passed', 'failed'].includes(progress.status)) return
    rows.push(row)
    const p = row.person
    if (!row.sameActor || !row.sameWorld || !p || row.owner !== 'native' || row.hp <= 0 ||
      row.kind !== 'preacher' || row.team !== 'blue' || row.inside !== null || row.busy ||
      p.class !== 1 || p.model !== 4 || p.tribe !== 0 || p.vehicle || p.disguise ||
      p.flags2 & (1 | 0x80000 | 0x100000 | 0x800000) || p.flags4 & 0x800 ||
      row.status !== 'playing' || row.paused && !allowPaused || row.speed !== 1 ||
      row.visibility !== 'visible' || row.landFlags & 2 || row.listeners.length)
      return fail('Living on-foot owner, ordinary clock, or zero-listener boundary changed')
    if (row.phase === 'beforeTurn') before = row
    if (progress.entryTurn === null) {
      if (progress.status === 'awaiting-move') {
        if (row.order?.model === 3) { progress.status = 'waiting-entry'; progress.moveTurn = row.turn }
        return
      }
      if (p.commandStatus === 17 && p.substate >= 3) return fail('Fresh post-move entry was missed')
      if (row.phase !== 'afterTurn' || p.commandStatus !== 17 || p.substate !== 2) return
      progress.entryTurn = row.turn; progress.startMs = row.now
      progress.status = 'observing'; orderId = row.order?.id
    }
    if (row.now - progress.startMs >= 120000) return fail('120-second wall bound, including ordinary pauses, reached')
    if (row.order?.model !== 17 || row.order.id !== orderId || row.order.flags & 1 ||
      p.state !== 10 || p.commandStatus !== 17 || row.site.collision || row.threats.length ||
      !(p.flags3 & 0x40000)) return fail('Queue, site, threat, or logical-owner continuity changed')
    if (row.phase !== 'afterTurn') {
      if (pending && row.turn === pending.turn) {
        try { requireUpdatedPhase(pending, row) } catch (error) { return fail(String(error)) }
        if (pending.returnedSource) {
          if (p.f1 !== 0 || p.f2 !== 1) return fail('Return updater did not advance source168 from0 to1')
          progress.families[pending.returnedSource].returns++
          record('return-updater', row, { source: pending.returnedSource, birthTurn: pending.birthTurn })
        }
        pending = null
      }
      if (progress.restartTurn !== null && row.turn === progress.restartTurn && p.stamp === row.turn) {
        if (![176, 184].every(source => progress.families[source].returns > 0))
          return fail('Finite full loop did not include both naturally completed gesture families')
        progress.status = 'passed'; progress.completedPhase = row.phase
      }
      return
    }
    if (pending) return fail('A controller visit arrived before its prior updater was observed')
    if (priorAfterTurn !== undefined && row.turn !== priorAfterTurn + 1) return fail('Missing/repeated logical controller visit')
    priorAfterTurn = row.turn; progress.visits++
    if (progress.visits > 900) return fail('900 logical visits after fresh entry reached')
    if (p.substate === 3 && p.timer === 1) {
      if (progress.firstLoopTurn === null) progress.firstLoopTurn = row.turn
      else if (progress.terminalTurn !== null) progress.restartTurn = row.turn
    }
    if (progress.firstLoopTurn !== null && progress.terminalTurn === null) {
      if (p.timer !== priorTimer + 1 || ![3, 4].includes(p.substate) || p.draw !== 14 ||
        p.speed || p.flags2 & 0x2004 || !(p.statusFlags & 2) || p.assignment & 64)
        return fail('Stationary no-listener active loop was interrupted')
      priorTimer = p.timer
      if (!(p.counter & 15)) { row.counter16Opportunity = true; progress.opportunities++ }
      if (p.timer === 840 && p.substate === 4) progress.terminalTurn = row.turn
    }
    if (gestureSource(p.object) && !active) {
      if (!before || before.turn !== row.turn - 1 || p.counter & 15 || !(p.statusFlags & 1) ||
        p.f1 !== 1 || p.f2 !== 0 || p.timer >= 840)
        return fail('Gesture birth lacks its natural counter16/f1=1/f2=0 controller boundary')
      active = { source: p.object, birthTurn: row.turn }
      progress.families[p.object].births++
      record('birth', row, { ...active, before: before.person, after: p,
        rngBefore: before.rng, rngAfter: row.rng })
    } else if (active && p.object === 168) {
      const previous = before?.person, count = frameCounts[active.source]
      if (previous?.object !== active.source || previous.f1 !== 0 || previous.f2 !== count - 1 ||
        row.turn - active.birthTurn !== count || p.f1 !== 0 || p.f2 !== 0 || p.statusFlags & 1)
        return fail('Gesture return lost exact final frame/phase/owner or11/19-visit ownership')
      row.returnedSource = active.source; row.birthTurn = active.birthTurn
      record('return-controller', row, active); active = null
    } else if (active && p.object !== active.source) {
      if (progress.terminalTurn === null || p.object !== 160) return fail('Active gesture owner was unexpectedly replaced')
      record('terminal-entry-interruption', row, active); active = null
    }
    pending = row
  } }
}

export async function installCandidateObservation(id) {
  const { unitAnimationSource, unitInvisibleToPlayer } = await import('/app/model.ts')
  const { currentPersonOrder } = await import('/app/person-orders.ts')
  const { restingCellCollision } = await import('/app/person-collision.ts')
  const { tribeForTeam } = await import('/app/world-types.ts')
  const scene = window.testSceneRef.current, world = scene.world
  const actor = world.units.find(u => u.id === id), native = actor?.native
  if (!native || unitAnimationSource(actor) !== native) throw Error('Acquired Preacher lacks its on-foot native owner')
  const tracker = createCandidateTracker()
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
  window.preacherCandidate = { tracker, read, drain: () => ({ rows: tracker.rows.splice(0), events: tracker.events.splice(0),
    progress: { ...tracker.progress }, errors: [...chain.errors] }), finish: () => chain.finish() }
  return read('armed-before-ordinary-move')
}

export function installLoadedObservation(id) {
  const scene = window.testSceneRef.current, world = scene.world
  const actor = world.units.find(u => u.id === id), person = actor?.native, started = performance.now()
  if (!person) throw Error('Loaded Preacher is missing')
  const rows = [], errors = []
  let totalRows = 0
  const chain = chainPhaseObservers(scene.gameClock, scene.renderer, row => {
    if (++totalRows > 1500 || performance.now() - started > 60000) { errors.push('Loaded epoch evidence bound'); return }
    rows.push(row)
  }, phase => {
    const row = window.nativeGuardRead(), current = scene.world.units.find(u => u.id === id)
    return { ...row, epoch: 'loaded-checkpoint', phase,
      sameLoadedOwner: scene === window.testSceneRef.current && scene.world === world && current === actor && current?.native === person }
  }, args => args[0] === scene.scene && args[1] === scene.camera)
  window.preacherLoaded = { drain: () => ({ rows: rows.splice(0), errors: [...errors, ...chain.errors], totalRows }),
    finish: () => chain.finish() }
}
