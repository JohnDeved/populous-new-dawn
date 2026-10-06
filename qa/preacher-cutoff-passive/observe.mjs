import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'
import { createPassiveRenderRead } from './render.mjs'

const counts = { 48: 6, 160: 4, 168: 6, 176: 10, 184: 18 }
export function requireUpdatePair(controller, updated) {
  const a = controller.person, b = updated.person
  if (!['beforeTurn', 'render-after-updater'].includes(updated.phase) || updated.turn !== controller.turn ||
    !updated.sameActor || !updated.sameWorld || !updated.registeredOwner ||
    !counts[a.object] || ![14, 16, 19].includes(a.draw) || b.object !== a.object || b.draw !== a.draw ||
    b.stamp !== updated.turn || b.f1 !== (a.f1 ? a.f1 - 1 : a.draw === 19 ? 1 : 0) ||
    b.f2 !== (a.f1 ? a.f2 : (a.f2 + 1) % counts[a.object]))
    throw Error('Owner/source/stamp/updater pairing failed')
}
export function cutoffRenderKind(row, progress) {
  if (row.phase !== 'render-after-updater') return null
  if (progress.terminalTurn === null && row.person.substate === 3 && row.person.timer === 839) return 'final-loop'
  if (progress.terminalTurn === null) return null
  if (row.turn === progress.terminalTurn + 1) return 'middle-reset'
  if (row.turn === progress.terminalTurn + 2) return 'next-entry'
  return null
}
export function createCutoffTracker() {
  const rows = [], events = [], progress = { status: 'awaiting-move', entryTurn: null, startMs: null,
    firstLoopTurn: null, terminalTurn: null, resetTurn: null, nextEntryTurn: null, restartTurn: null,
    visits: 0, totalRows: 0, nativeDomain: { initial839AnimationSubset: null, middle840AnimationSubset: null,
      scope: 'Animation subsets only; RNG values are world callback snapshots, not isolated controller inputs' },
    renders: { 'final-loop': 'render-not-observed', 'middle-reset': 'render-not-observed', 'next-entry': 'render-not-observed' } }
  let orderId, orderIdentity, orderPayload, queue, previousAfter, timer = 0, before, pending
  const fail = reason => Object.assign(progress, { status: 'failed', reason })
  return { rows, events, progress, fail, observe(row) {
    if (['passed', 'failed'].includes(progress.status)) return
    rows.push(row)
    if (++progress.totalRows > 2800) return fail('2800 compact phase row bound')
    const p = row.person
    if (!p || !row.sameActor || !row.sameWorld || !row.registeredOwner || row.owner !== 'native' ||
      row.hp <= 0 || row.kind !== 'preacher' || row.team !== 'blue' || row.inside !== null || row.busy ||
      p.class !== 1 || p.model !== 4 || p.tribe !== 0 || p.vehicle || p.cargo || p.disguise ||
      p.flags2 & (1 | 0x80000 | 0x100000 | 0x800000) || p.flags4 & 0x800 ||
      row.status !== 'playing' || row.paused || row.speed !== 1 || row.visibility !== 'visible' ||
      row.landFlags & 2 || row.listeners.length) return fail('Ordinary on-foot owner/clock/zero-listener boundary changed')
    if (row.phase === 'beforeTurn') before = row
    if (progress.entryTurn === null) {
      if (progress.status === 'awaiting-move') {
        if (row.order?.model === 3) { progress.status = 'waiting-entry'; progress.moveTurn = row.turn }
        return
      }
      if (p.commandStatus === 17 && p.substate >= 3) return fail('Fresh entry missed')
      if (row.phase !== 'afterTurn' || p.commandStatus !== 17 || p.substate !== 2) return
      Object.assign(progress, { status: 'observing', entryTurn: row.turn, startMs: row.now }); orderId = row.order?.id
      orderIdentity = row.order?.identity; orderPayload = JSON.stringify([row.order?.object, row.order?.a, row.order?.b])
      queue = JSON.stringify([p.commandCursor, p.immediateCommand, row.commands])
    }
    if (row.now - progress.startMs >= 120000) return fail('120-second observation bound')
    if (row.order?.id !== orderId || !Number.isInteger(orderIdentity) || orderIdentity < 1 ||
      row.order.identity !== orderIdentity || JSON.stringify([row.order.object, row.order.a, row.order.b]) !== orderPayload ||
      JSON.stringify([p.commandCursor, p.immediateCommand, row.commands]) !== queue ||
      row.order.model !== 17 || row.order.flags & 1 ||
      p.state !== 10 || p.commandStatus !== 17 || !(p.flags3 & 0x40000) || row.collision ||
      row.threats.length || row.followingOrder) return fail('Stable command17/queue/site/logical-owner boundary changed')
    if (row.phase !== 'afterTurn') {
      if (pending && row.turn === pending.turn) {
        try { requireUpdatePair(pending, row) } catch (error) { return fail(String(error)) }
        row.updateWitness = { controllerTurn: pending.turn,
          boundary: row.phase === 'beforeTurn' ? 'next-beforeTurn-after-update' : 'actual-render-after-update' }
        if (progress.terminalTurn !== null && row.turn >= progress.terminalTurn - 1)
          events.push({ kind: 'updated', turn: row.turn, phase: row.phase, person: p, rng: row.rng })
        pending = null
      }
      const kind = cutoffRenderKind(row, progress)
      if (kind && row.render) progress.renders[kind] = row.render.outcome
      if (progress.restartTurn !== null && row.turn === progress.restartTurn && row.updateWitness) {
        Object.assign(progress, { status: 'passed', completedPhase: row.phase, elapsedMs: row.now - progress.startMs })
      }
      return
    }
    if (pending) return fail('Previous controller lacks an owned update witness')
    if (previousAfter !== undefined && row.turn !== previousAfter + 1) return fail('Missing/repeated logical visit')
    previousAfter = row.turn
    if (++progress.visits > 900) return fail('900 logical visit bound')
    if (p.substate === 3 && p.timer === 1) {
      if (p.object !== 168 || p.draw !== 14 || p.f1 !== 1 || p.f2 !== 0 ||
        p.flags2 & 0x40000000 || p.statusFlags & 1) return fail('Fresh loop entry is not168/14 with1/0 and consumed entry bit')
      if (progress.firstLoopTurn === null) progress.firstLoopTurn = row.turn
      else if (progress.terminalTurn !== null) progress.restartTurn = row.turn
    }
    if (progress.firstLoopTurn !== null && progress.terminalTurn === null) {
      if (p.timer !== timer + 1 || ![3, 4].includes(p.substate) || p.draw !== 14 || p.speed ||
        p.flags2 & 0x2004 || !(p.statusFlags & 2) || p.assignment & 64) return fail('Uninterrupted stationary loop failed')
      timer = p.timer
      if (timer === 840) {
        if (p.substate !== 4 || !(p.flags2 & 0x40000000)) return fail('Terminal entry-state bit missing')
        progress.terminalTurn = row.turn
        const prior = before?.person
        progress.nativeDomain.initial839AnimationSubset = !!prior && before.turn === row.turn - 1 &&
          prior.timer === 839 && prior.substate === 3 && prior.object === 168 && prior.draw === 14 &&
          prior.f1 === 0 && prior.f2 === 5 && !(prior.statusFlags & 1)

      }
    } else if (progress.terminalTurn !== null && row.turn === progress.terminalTurn + 1) {
      const prior = before?.person
      if (!prior || before.turn !== row.turn - 1 || prior.substate !== 4 || p.substate !== 2 ||
        p.timer !== 840 || !(p.flags2 & 0x40000000) || p.speed || p.object !== 48 || p.draw !== 16 ||
        p.f1 !== 0 || p.f2 !== (prior.f2 < 6 ? prior.f2 : 0) || p.renderFlags !== 384)
        return fail('Real phase4 stop did not select the expected48/16 owner')
      progress.resetTurn = row.turn
      progress.nativeDomain.middle840AnimationSubset = prior.object === 168 && prior.draw === 14 &&
        prior.f1 === 0 && prior.f2 === 0 && prior.timer === 840 && prior.substate === 4 && !(prior.statusFlags & 1)
    } else if (progress.terminalTurn !== null && row.turn === progress.terminalTurn + 2) {
      if (p.substate !== 2 || p.timer !== 7 || p.flags2 & 0x40000000 || p.speed ||
        p.object !== 160 || p.draw !== 19 || p.f1 !== 1 || p.f2 !== 0)
        return fail('Next phase2 entry did not converge to160/19 with1/0')
      progress.nextEntryTurn = row.turn
    }
    if (progress.terminalTurn !== null && row.turn >= progress.terminalTurn)
      events.push({ kind: 'controller', turn: row.turn, rngScope: 'World callback boundaries, not isolated command17 controller inputs', before: before?.person, person: p, rngBefore: before?.rng, rng: row.rng })
    pending = row
  } }
}

export async function installCutoffObservation(id) {
  const [{ unitAnimationSource, unitInvisibleToPlayer }, { currentPersonOrder }, { restingCellCollision },
    { tribeForTeam }, { default: art }, { default: rules }, { spriteLayers }] = await Promise.all([
    import('/app/model.ts'), import('/app/person-orders.ts'), import('/app/person-collision.ts'),
    import('/app/world-types.ts'), import('/app/original-units.json'), import('/app/original-rules.json'), import('/app/sprite-layers.ts')])
  const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.id === id), native = actor?.native
  if (!native || unitAnimationSource(actor) !== native) throw Error('Acquired native owner missing')
  const orderIdentities = new WeakMap(); let nextOrderIdentity = 0
  const tracker = createCutoffTracker(), renders = createPassiveRenderRead({ art, rules, spriteLayers, unitAnimationSource }, scene, id)
  const keys = ['id', 'class', 'model', 'tribe', 'state', 'previousState', 'substate', 'commandStatus',
    'counter', 'timer', 'flags2', 'flags3', 'flags4', 'statusFlags', 'speed', 'assignment', 'animationMode',
    'commandAux', 'commandPhase', 'cargo', 'vehicle', 'disguise', 'renderFlags', 'object', 'draw', 'f1', 'f2', 'stamp',
    'x', 'y', 'h', 'anchorX', 'anchorY', 'goalX', 'goalY', 'destinationX', 'destinationY',
    'motionGroup', 'motionIndex', 'recoveryCounter', 'target', 'link', 'workTarget', 'commandCursor', 'immediateCommand']
  const read = phase => {
    const w = scene.world, u = w.units.find(u => u.id === id), p = u && unitAnimationSource(u)
    const cell = p ? (p.y >> 9) * 128 + (p.x >> 9) : 0, order = p && currentPersonOrder(w.buildingOrders, p)
    if (order && !orderIdentities.has(order)) orderIdentities.set(order, ++nextOrderIdentity)
    const short = value => ((value + 128) % 256 + 256) % 256 - 128
    const threat = v => v.hp > 0 && v.team !== 'blue' && v.team !== 'wild' &&
      !(w.outcome.alliances[0] & (1 << tribeForTeam(v.team))) && Math.hypot(short(v.x - u.x), short(v.z - u.z)) <= 16
    const row = { phase, now: performance.now(), timeOrigin: performance.timeOrigin, sceneNow: scene.previous,
      turn: w.turn, time: w.time, animationFrame: scene.gameClock.animationFrame,
      animationTime: scene.gameClock.animationTime, pendingTime: w.pendingTime,
      rng: { simulation: w.randomState, cosmetic: w.cosmeticRandom.randomState },
      sameActor: u === actor && p === native, registeredOwner: w.objectCells.objects.get(id) === native,
      sameWorld: scene === window.testSceneRef.current && w === world && w === window.testStore.getWorld(),
      owner: p === u?.native ? 'native' : 'other', id, hp: u?.hp, kind: u?.kind, team: u?.team, inside: u?.inside,
      busy: !!(u?.flight || u?.fight || u?.fighting || u?.lift || u?.casting || u?.invisibility || u?.ghost || u && unitInvisibleToPlayer(w, u)),
      status: w.status, paused: w.paused, speed: w.speed, visibility: document.visibilityState, landFlags: w.land.landFlags,
      person: p ? Object.fromEntries(keys.map(key => [key, p[key] ?? null])) : null,
      order: order ? { id: p.immediateCommand || p.commands[p.commandCursor], identity: orderIdentities.get(order),
        model: order.model, flags: order.flags, references: order.references, object: order.object, a: order.a, b: order.b } : null,
      commands: p ? [...p.commands] : [], followingOrder: p ? p.commands.slice(p.commandCursor + 1).some(Boolean) : true,
      listeners: w.units.filter(v => { const n = v.native ?? v.entry?.person ?? v.fight?.motion; return v.hp > 0 && n?.state === 23 && n.workTarget === id }).map(v => v.id),
      threats: u ? [...w.units.filter(threat), ...w.buildings.filter(threat)].map(v => v.id) : [],
      collision: p ? restingCellCollision({ flags: w.land.flags[cell], category: w.land.categories[cell] }, w.land.walkMasks[0], p) : null }
    const kind = cutoffRenderKind(row, tracker.progress)
    if (kind && !['passed', 'failed'].includes(tracker.progress.status)) row.render = renders.read(kind, row)
    return row
  }
  const chain = chainPhaseObservers(scene.gameClock, scene.renderer, row => tracker.observe(row), read,
    args => args[0] === scene.scene && args[1] === scene.camera)
  window.preacherCutoff = { tracker, drain: () => ({ rows: tracker.rows.splice(0), events: tracker.events.splice(0),
    progress: { ...tracker.progress, renders: { ...tracker.progress.renders } }, errors: [...chain.errors] }),
    captures: () => renders.take(), finish: () => chain.finish() }
  return read('armed-before-ordinary-move')
}
