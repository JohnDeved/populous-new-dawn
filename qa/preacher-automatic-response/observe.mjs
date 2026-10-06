import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const queue = row => [row.person.commandCursor, row.commands, row.queued]
const short = n => (n << 16) >> 16
const cell = p => [(p.x >>> 9) & 127, (p.y >>> 9) & 127]

export function admittedMovingLane(row) {
  const a = row.admission
  return !!a && a.work === null && a.target === null && a.tree === null && a.cargo === 0 &&
    !a.harvest && !a.delivery && !a.vault && !a.guard && !a.attackReservation &&
    !a.starting && !a.armageddon && !(a.landFlags & 2) && a.supported && a.positionCoherent
}

// A deliberately narrow ordinary-domain witness, not a second implementation of
// 0051f030. No model4/7 candidate exists in the guarded area, so its primary is
// empty without weakening any native predicate. The actual generic read also misses.
export function movingEncounter(row) {
  const p = row.person, f = row.facts
  return !!p && admittedMovingLane(row) && row.order?.model === 3 && !p.immediateCommand && p.commandStatus === 3 &&
    p.life > 0 && p.life === Math.round(row.actor.hp * 20) &&
    p.state === 10 && p.speed > 0 && !(row.order.flags & 1) && row.pendingDistance > 512 &&
    f.autoEligible && f.range === 1 && f.genericThreat === 0 && f.primaryGuardIds.length === 0 &&
    f.availableOrder && f.braves.length > 0 && f.gameFlags === 0 && f.levelFlags2 === 0 &&
    !(p.flags2 & 0x810004) && !(p.flags4 & 0x1c00) && !(p.assignment & 4) && !p.vehicle
}

export function qualifyingVisit(before, after) {
  if (before?.phase !== 'beforeTurn' || after.phase !== 'afterTurn' || after.turn !== before.turn + 1 ||
    !movingEncounter(before) || !movingEncounter(after) || !same(queue(before), queue(after)) ||
    before.order.id !== after.order.id || before.order.identity !== after.order.identity ||
    !same(before.admission, after.admission) || before.actor.hp !== after.actor.hp ||
    !same(cell(before.person), cell(after.person)) ||
    Math.hypot(short(after.person.x - before.person.x), short(after.person.y - before.person.y)) > 128 ||
    !(!(after.turn & after.facts.scanMask) || before.person.flags3 & 0x800)) return null
  const brave = before.facts.braves.find(a => after.facts.braves.some(b => same(a, b)))
  if (!brave) return null
  return { beforeTurn: before.turn, afterTurn: after.turn, brave, before, after,
    basis: 'Adjacent retained moving3; explicit world-turn no-target/no-task admission; pending destination; stable eligible native Brave; due scanner; empty primary guard; actual generic miss; free order capacity. No internal AL observed.' }
}

export function createResponseTracker({ baseline = false, loaded = false, captureOnly = false, maxRows = 12000, maxVisits = 3600 } = {}) {
  const rows = [], events = [], progress = { status: loaded ? 'loaded' : 'awaiting-move', totalRows: 0,
    visits: 0, move: null, encounter: null, firstResponse: null, startup: null, listenerIds: [],
    released: null, rendered: [], oddNoListener: [], evenNoListener: [] }
  let before, previousTurn, originalQueue, responseId, responseIdentity
  const fail = reason => Object.assign(progress, { status: 'failed', reason })
  return { rows, events, progress, fail, observe(row) {
    if (['failed', 'released', 'baseline-omission'].includes(progress.status)) return
    rows.push(row)
    if (++progress.totalRows > maxRows) return fail('Compact row cap exceeded')
    const p = row.person
    if (!p || !row.sameWorld || !row.sameActor || !row.registeredOwner || !row.nativeOnly ||
      row.actor.hp <= 0 || row.actor.kind !== 'preacher' || row.actor.team !== 'blue' || row.actor.inside !== null ||
      row.busy || p.class !== 1 || p.model !== 4 || p.tribe !== 0 || p.vehicle ||
      row.status !== 'playing' || row.speed !== 1 || row.visibility !== 'visible')
      return fail('Original on-foot living owner/scene/clock changed')
    if (!progress.move && !loaded && ['beforeTurn', 'afterTurn'].includes(row.phase) && row.order?.model === 3 && !p.immediateCommand) {
      progress.move = row; originalQueue = queue(row); progress.status = 'approaching'
    }
    if (row.phase === 'beforeTurn') { before = row; return }
    if (row.phase === 'render-after-updater') {
      if (row.order?.model === 32 && row.render?.visible && row.render.draw === p.draw &&
        row.render.stamp === row.turn && !progress.rendered.includes(row.turn)) {
        if (progress.rendered.length < 12) progress.rendered.push(row.turn)
      }
      return
    }
    if (row.phase !== 'afterTurn') return
    if (row.paused) return fail('Logical turn advanced while paused')
    if (previousTurn !== undefined && row.turn !== previousTurn + 1) return fail('Missing or repeated logical visit')
    previousTurn = row.turn
    if (++progress.visits > maxVisits) return fail('Logical visit cap exceeded')
    if (captureOnly) { progress.status = 'capturing-interruption'; return }
    const qualified = qualifyingVisit(before, row)
    if (qualified && !progress.encounter) {
      progress.encounter = qualified; events.push({ kind: 'qualifying-visit-without32', ...qualified })
      if (baseline) { progress.status = 'baseline-omission'; return }
    }
    if (!responseId && row.order?.model === 32) {
      if (loaded) originalQueue = queue(row)
      else if (!progress.move || !movingEncounter(before) || !same(queue(before), queue(row)) ||
        !same(queue(row), originalQueue) || !same(cell(before.person), cell(p)) ||
        !(!(row.turn & row.facts.scanMask) || before.person.flags3 & 0x800))
        return fail('First32 has no source-bound moving3 trigger and preserved queue')
      if (baseline) return fail('Baseline unexpectedly produced32; preserve actual result')
      if (!p.immediateCommand || row.order.id !== p.immediateCommand || row.order.flags !== 32 ||
        row.order.references !== 1 || row.order.a !== p.x || row.order.b !== p.y || row.orderUsers.length !== 1)
        return fail('Immediate32 payload/reference/initiator ownership failed')
      responseId = row.order.id; responseIdentity = row.order.identity
      progress.firstResponse = { before: loaded ? null : before, after: row, loaded }
      progress.status = 'responding'; events.push({ kind: loaded ? 'loaded32' : 'first-automatic32', ...progress.firstResponse })
    }
    if (!responseId) {
      if (progress.move && row.order?.model !== 3) return fail('Moving3 ended before qualified automatic32; idle17 is not32')
      return
    }
    if (!same(queue(row), originalQueue)) return fail('Preserved queued movement changed during32')
    for (const id of row.listeners) if (!progress.listenerIds.includes(id)) progress.listenerIds.push(id)
    if (row.order?.id === responseId && row.order.identity === responseIdentity) {
      if (p.commandStatus === 32 && p.state === 10 && !progress.startup) progress.startup = row
      if (p.commandStatus === 32 && p.timer > 32 && !row.listeners.length) {
        const key = p.counter & 1 ? 'oddNoListener' : 'evenNoListener'
        if (progress[key].length < 8) progress[key].push({ turn: row.turn, counter: p.counter, timer: p.timer })
      }
      return
    }
    const released = row.retiredOrders.find(o => o.id === responseId)
    if (p.immediateCommand || row.order?.model !== 3 || row.order.id !== progress.move?.order.id && !loaded ||
      !released || released.references !== 0 || row.listeners.length || !progress.startup || !progress.listenerIds.length)
      return fail('Immediate32 ended without listener lifecycle, reference release and preserved3')
    progress.released = { before, after: row, released }; progress.status = 'released'
    events.push({ kind: 'natural32-release-and-restored3', ...progress.released })
  } }
}

export async function installResponseObservation({ id, baseline = false, loaded = false, captureOnly = false }) {
  const [{ unitAnimationSource }, { currentPersonOrder }, { engagementRange, inEngagementArea, canAutoEngage },
    { combatWorld }, { detectCombatThreat }, { terrainSupportsPerson }, { default: rules }] = await Promise.all([
    import('/app/model.ts'), import('/app/person-orders.ts'), import('/app/melee-engagement.ts'),
    import('/app/live-combat.ts'), import('/app/combat-targets.ts'), import('/app/person-collision.ts'), import('/app/original-rules.json')])
  const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.id === id), native = actor?.native
  if (!native || unitAnimationSource(actor) !== native) throw Error('Acquired native owner unavailable')
  const identities = new WeakMap(), seenOrders = new Set(); let nextIdentity = 0
  const identity = value => { if (!value) return null; if (!identities.has(value)) identities.set(value, ++nextIdentity); return identities.get(value) }
  const fields = 'id class model tribe state previousState substate commandStatus commandCursor immediateCommand workTarget workFlags flags2 flags3 flags4 statusFlags assignment speed life counter timer commandAux commandPhase object draw f1 f2 stamp x y h goalX goalY destinationX destinationY vehicle disguise motionGroup motionIndex cellNext cellPrevious'.split(' ')
  const snapshot = p => p && Object.fromEntries(fields.map(k => [k, p[k] ?? null]))
  const tracker = createResponseTracker({ baseline, loaded, captureOnly })
  const read = phase => {
    const w = scene.world, u = w.units.find(u => u.id === id), p = u?.native, current = p && currentPersonOrder(w.buildingOrders, p)
    const linked = person => {
      const visited = new Set(), index = ((person.y & 65535) >>> 9) * 128 + ((person.x & 65535) >>> 9)
      let next = w.objectCells.heads[index]
      while (next) {
        if (visited.has(next)) throw Error('Cyclic observed native cell chain')
        visited.add(next)
        const member = w.objectCells.objects.get(next)
        if (!member) throw Error('Missing observed native cell member')
        if (member === person) return true
        next = member.cellNext
      }
      return false
    }
    const record = orderId => { const q = w.buildingOrders.records[orderId]; return q ? { id: orderId, identity: identity(q), ...q } : null }
    const active = p && (p.immediateCommand || p.commands[p.commandCursor])
    if (active) seenOrders.add(active)
    const nativeOnly = !!p && unitAnimationSource(u) === p && !u.builder && !u.entry && !u.flight && !u.fight
    const range = p ? engagementRange(p, current, false) : 0
    const guarded = p ? [...w.objectCells.objects.values()].filter(v => v.id !== id && v.class === 1 &&
      [4, 7].includes(v.model) && inEngagementArea(p, v, Math.max(5, range + 2))).map(v => v.id) : []
    // Also reject a nearby live4/7 lacking a registered native record.
    for (const other of w.units) if (other.id !== id && ['preacher', 'shaman'].includes(other.kind)) {
      const point = { x: Math.round((other.x + 8) * 256) & 65535, y: Math.round((-other.z - 8) * 256) & 65535 }
      if (p && inEngagementArea(p, point, Math.max(5, range + 2)) && !guarded.includes(other.id)) guarded.push(other.id)
    }
    const braves = []
    for (const other of w.units) {
      const v = other.native
      if (!p || other.kind !== 'brave' || other.hp <= 0 || other.inside !== null || !v || v.class !== 1 ||
        v.model !== 2 || v.tribe < 0 || v.tribe === p.tribe || v.state !== 17 || v.life <= 0 ||
        v.workFlags !== 0 || v.vehicle || v.flags2 & 0x810000 || v.flags4 & 0x1000 ||
        other.flight || other.fight || other.builder || other.entry || other.path.length ||
        w.outcome.alliances[v.tribe] & (1 << p.tribe) || !inEngagementArea(p, v, 3) ||
        w.objectCells.objects.get(v.id) !== v || !(v.flags2 & 0x20000) || !linked(v) ||
        v.x !== (Math.round((other.x + 8) * 256) & 65535) || v.y !== (Math.round((-other.z - 8) * 256) & 65535)) continue
      braves.push({ identity: identity(v), id: v.id, x: v.x, y: v.y, tribe: v.tribe, model: v.model,
        state: v.state, workFlags: v.workFlags, flags2: v.flags2, flags4: v.flags4, life: v.life,
        disguise: v.disguise, vehicle: v.vehicle, reverseAlliance: w.outcome.alliances[v.tribe] })
    }
    let genericThreat = null
    if (p && current?.model === 3 && range === 1) {
      // Both imported functions are source-reviewed reads: they allocate detached
      // diagnostic maps and records and never register or change the live World.
      const { world: view } = combatWorld(w, p, range)
      genericThreat = detectCombatThreat(view, p, { a: ((p.x >>> 8) & 254) | (p.y & 0xfe00), b: 0 }, false, false)
    }
    const row = { phase, now: performance.now(), turn: w.turn, time: w.time,
      animationFrame: scene.gameClock.animationFrame, animationTime: scene.gameClock.animationTime,
      pendingTime: w.pendingTime, rng: [w.randomState, w.cosmeticRandom.randomState],
      sameWorld: scene === window.testSceneRef.current && w === world && w === window.testStore.getWorld(),
      sameActor: u === actor && p === native, nativeOnly,
      registeredOwner: !!p && w.objectCells.objects.get(id) === p && !!(p.flags2 & 0x20000) && linked(p),
      actor: u && { id, kind: u.kind, team: u.team, hp: u.hp, inside: u.inside, x: u.x, z: u.z },
      busy: !!(u?.flight || u?.fight || u?.fighting || u?.lift || u?.casting || u?.ghost || u?.invisibility),
      admission: u && p && { work: u.work, target: u.target, tree: u.tree, cargo: u.cargo,
        harvest: !!u.harvest, delivery: !!u.delivery, vault: !!u.vault, guard: !!u.guard,
        attackReservation: !!u.attackReservation,
        starting: !!w.levelStart?.some(site => site.shaman === id && site.phase < 4),
        armageddon: w.effects.some(fx => !!fx.armageddon), landFlags: w.land.landFlags,
        supported: !!terrainSupportsPerson(w.land.categories[(p.y >>> 9) * 128 + (p.x >>> 9)], p),
        positionCoherent: p.x === (Math.round((u.x + 8) * 256) & 65535) && p.y === (Math.round((-u.z - 8) * 256) & 65535) },
      status: w.status, paused: w.paused, speed: w.speed, visibility: document.visibilityState,
      person: snapshot(p), order: active ? record(active) : null,
      commands: p ? [...p.commands] : [], queued: p ? p.commands.filter(Boolean).map(record) : [],
      retiredOrders: [...seenOrders].filter(q => q !== active && !p?.commands.includes(q)).map(record).filter(Boolean),
      orderUsers: active ? w.units.filter(v => {
        const n = v.native ?? v.entry?.person ?? v.builder?.person ?? v.fight?.motion
        return n && (n.immediateCommand === active || n.commands.includes(active))
      }).map(v => v.id) : [],
      listeners: w.units.filter(v => v.hp > 0 && v.native?.state === 23 && v.native.workTarget === id).map(v => v.id),
      pendingDistance: p && current ? Math.hypot(short(current.a - p.x), short(current.b - p.y)) : 0,
      facts: { range, genericThreat, primaryGuardIds: guarded, braves, gameFlags: w.manaWorld.gameFlags,
        levelFlags2: w.levelFlags2, scanMask: rules.personModels[4].scanMask,
        autoEligible: !!p && canAutoEngage(p, current, () => false),
        availableOrder: w.buildingOrders.records.slice(1).some(q => q.references === 0) } }
    if (phase === 'render-after-updater') {
      const mesh = scene.unitMeshes.get(id)
      row.render = { actualMainRender: true, frame: mesh?.userData.frame, draw: mesh?.userData.draw,
        visible: mesh?.visible, stamp: p?.stamp, source: p?.object }
    }
    return row
  }
  const chain = chainPhaseObservers(scene.gameClock, scene.renderer, row => tracker.observe(row), read,
    args => args[0] === scene.scene && args[1] === scene.camera)
  window.preacherResponse = { read, tracker, drain: () => ({ rows: tracker.rows.splice(0),
    events: tracker.events.splice(0), progress: structuredClone(tracker.progress), errors: [...chain.errors] }), finish: () => chain.finish() }
  return read('armed-before-input')
}
