// Serialized observation only. The game owns movement, order removal and the
// completion transition; the shipped pure arrival predicate owns its geometry.
export async function installMission1MoveWitness({ id, point, orderId, order, acknowledgedTurn }) {
  const [{ personReachedOrder }, { default: rules }, { nativeUnitModel }, { samePersonCell }] = await Promise.all([
    import('/app/person-orders.ts'), import('/app/original-rules.json'), import('/app/unit-kinds.ts'), import('/app/person-idle.ts')])
  const s = window.testSceneRef.current, w = s.world, u = w.units.find(unit => unit.id === id), p = u?.native
  if (!p || p.model !== nativeUnitModel('shaman') || !orderId || order?.model !== 3 || order.flags & 1) throw Error('Acknowledged original move/order required')
  const originalModel = p.model
  const expected = { id, nativeModel: originalModel, point: { ...point }, orderId, order: { ...order }, acknowledgedTurn }
  const e = window.mission1MoveEvidence = { expected, samples: [], transitions: [], errors: [], restored: false }
  const restorers = [], error = value => { if (e.errors.length < 8) e.errors.push(String(value)) }
  const state = () => {
    const actor = w.units.find(unit => unit.id === id), person = actor?.native
    const current = person && (person.immediateCommand || person.commands[person.commandCursor])
    const record = current ? w.buildingOrders.records[current] : null
    const route = w.pathfinding.people.get(id), actorMatches = actor === u && person === p
    const native = person && Object.fromEntries(['id', 'model', 'state', 'previousState', 'substate', 'counter', 'speed',
      'x', 'y', 'goalX', 'goalY', 'destinationX', 'destinationY', 'motionGroup', 'motionIndex', 'flags2', 'flags3', 'flags4',
      'commandStatus', 'commandCursor', 'immediateCommand', 'vehicle', 'assignment', 'slowTurn', 'anchorX', 'anchorY'].map(key => [key, person[key]]))
    const distance = actor && Math.hypot(actor.x - point.x, actor.z - point.z)
    return { turn: w.turn, time: w.time, paused: w.paused, status: w.status, lastOrderTurn: w.lastOrderTurn,
      worldMatches: s.world === w && window.testStore.getWorld() === w, actorMatches,
      actor: actor && { id: actor.id, kind: actor.kind, team: actor.team, hp: actor.hp, x: actor.x, z: actor.z,
        inside: actor.inside, work: actor.work, lift: actor.lift, casting: !!actor.casting, fighting: !!actor.fight,
        pathLength: actor.path.length, path: actor.path.slice(0, 8).map(p => ({ ...p })) },
      native, commands: person ? [...person.commands] : [], orderId: current || 0, order: record && { ...record },
      route: { present: !!route, matchesNative: !!route && route === person, motionGroup: route?.motionGroup, motionIndex: route?.motionIndex },
      idleState: person && rules.personModels[person.model].idleState,
      sameGoalCell: !!person && samePersonCell(person, { x: person.goalX, y: person.goalY }),
      nativeReached: !!person && !person.vehicle && personReachedOrder(person, expected.order, () => { throw Error('Unexpected vehicle arrival') }),
      legacy: { distance, insideNull: actor?.inside === null, emptyPath: actor?.path.length === 0,
        speedZero: person?.speed === 0, within035: distance < 0.35 } }
  }
  const validate = snapshot => {
    if (!snapshot.worldMatches || !snapshot.actorMatches || snapshot.actor?.id !== id || snapshot.native?.id !== id ||
      snapshot.native.model !== originalModel || snapshot.actor.hp <= 0 ||
      snapshot.actor.kind !== 'shaman' || snapshot.actor.team !== 'blue') throw Error('Original movement actor/world ownership changed')
    if (snapshot.lastOrderTurn !== acknowledgedTurn) throw Error('Acknowledged movement was replaced by a later order')
    if (snapshot.orderId && (snapshot.orderId !== orderId || snapshot.order?.model !== 3 ||
      snapshot.order.a !== order.a || snapshot.order.b !== order.b || snapshot.order.flags & 1))
      throw Error('Acknowledged movement order was replaced or cancelled')
  }
  const terminal = snapshot => snapshot.orderId === 0 && snapshot.commands.every(id => !id) &&
    ((snapshot.native.state === snapshot.idleState && snapshot.native.previousState === 10) ||
      (snapshot.native.state === 19 && snapshot.native.previousState === snapshot.idleState &&
        snapshot.native.substate === 8 && !!(snapshot.native.assignment & 1) && !snapshot.native.slowTurn && snapshot.sameGoalCell)) &&
    !(snapshot.native.counter & 3) &&
    snapshot.native.speed === 0 && !snapshot.native.motionGroup && !snapshot.native.vehicle && !(snapshot.native.flags4 & 0x10000000) &&
    snapshot.actor.inside === null && !snapshot.actor.pathLength && !snapshot.route.present &&
    !snapshot.actor.work && !snapshot.actor.lift && !snapshot.actor.casting && !snapshot.actor.fighting && snapshot.nativeReached
  const initial = e.initial = e.latest = state(); validate(initial)
  if (initial.orderId !== orderId) throw Error('Move completion was missed before observation could attach')
  for (const key of ['beforeTurn', 'afterTurn'])
    if (typeof s.gameClock[key] !== 'function') throw Error(`Missing movement clock hook ${key}`)
  let before = null
  const wrap = (key, factory) => {
    const descriptor = Object.getOwnPropertyDescriptor(s.gameClock, key), original = s.gameClock[key]
    if (typeof original !== 'function') throw Error(`Missing movement clock hook ${key}`)
    const replacement = factory(original); s.gameClock[key] = replacement
    restorers.push(() => {
      if (s.gameClock[key] !== replacement) throw Error(`Movement observer ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(s.gameClock, key, descriptor); else delete s.gameClock[key]
    })
  }
  wrap('beforeTurn', original => function (...args) {
    try { before = state() } catch (failure) { error(failure) }
    return original.apply(this, args)
  })
  wrap('afterTurn', original => function (...args) {
    const result = original.apply(this, args)
    try {
      const after = state(); e.latest = after; validate(after)
      if (before && (before.orderId !== after.orderId || before.native?.state !== after.native?.state || before.route.present !== after.route.present)) {
        if (e.transitions.length < 8) e.transitions.push({ before, after })
      }
      if (!e.samples.length || after.turn - e.samples.at(-1).turn >= 12) {
        if (e.samples.length === 32) e.samples.shift()
        e.samples.push(after)
      }
      if (!e.completed && before?.orderId === orderId && after.orderId === 0) {
        validate(before)
        if (!terminal(after)) throw Error('Acknowledged move ended without its native arrival/idle transition')
        e.completed = { before, after }
      }
    } catch (failure) { error(failure) }
    return result
  })
  window.restoreMission1MoveWitness = () => {
    try { e.terminal = state() } catch (failure) { error(failure) }
    for (const restore of restorers.reverse()) try { restore() } catch (failure) { error(failure) }
    e.restored = e.errors.length === 0
    delete window.restoreMission1MoveWitness
    return e
  }
}
