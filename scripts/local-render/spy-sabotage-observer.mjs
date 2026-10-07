// Passive copied state only; no World construction, stepping, picking or validation.
export function spySnapshot(world, actorId, targetId) {
  const unit = world.units.find(u => u.id === actorId)
  const person = world.objectCells.objects.get(actorId)
  const current = person && (person.immediateCommand || person.commands[person.commandCursor])
  const target = world.buildings.find(b => b.id === targetId)
  return {
    turn: world.turn, time: world.time, speed: world.speed, paused: world.paused,
    status: world.status, mode: world.mode, selected: [...world.selected], lastOrderTurn: world.lastOrderTurn,
    actor: unit && { id: unit.id, kind: unit.kind, team: unit.team, hp: unit.hp,
      x: unit.x, z: unit.z, inside: unit.inside, target: unit.target, work: unit.work,
      path: structuredClone(unit.path), registeredNative: !!person && unit.native === person },
    person: person && { id: person.id, state: person.state, substate: person.substate,
      counter: person.counter, x: person.x, y: person.y, goalX: person.goalX, goalY: person.goalY,
      speed: person.speed, timer: person.timer, flags2: person.flags2, flags4: person.flags4,
      disguise: person.disguise, commandStatus: person.commandStatus,
      commands: [...person.commands], commandCursor: person.commandCursor, immediateCommand: person.immediateCommand },
    current, order: current ? structuredClone(world.buildingOrders.records[current]) : null,
    target: target && { id: target.id, team: target.team, kind: target.kind, hp: target.hp,
      progress: target.progress, burn: structuredClone(target.burn), damage: structuredClone(target.damageState) },
  }
}

// Same pass-through afterTurn pattern as the maintained ordinary lifecycle observer.
// An observation failure is recorded, never thrown into or hidden from game execution.
export function observeSpyTurns(clock, world, actorId, targetId, isCurrent, maxSamples = 4096) {
  if (!Number.isInteger(maxSamples) || maxSamples < 1 || maxSamples > 4096) throw Error('Invalid observation bound')
  const original = clock.afterTurn, descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  const samples = [], errors = []
  let lastTurn = world.turn, finished = false
  function wrapper(...args) {
    const result = original?.apply(this, args)
    if (!errors.length) try {
      if (!isCurrent()) throw Error('Spy observer scene/world identity changed')
      if (world.turn !== lastTurn + 1) throw Error('Missing adjacent observed turn')
      if (world.speed !== 1) throw Error('Spy observer requires ordinary 1x time')
      if (samples.length >= maxSamples) throw Error('Spy observation bound reached')
      lastTurn = world.turn
      samples.push(spySnapshot(world, actorId, targetId))
    } catch (error) { errors.push(String(error)) }
    return result
  }
  clock.afterTurn = wrapper
  return {
    status() { return structuredClone({ latest: samples.at(-1), count: samples.length, errors }) },
    finish() {
      if (!finished) {
        finished = true
        if (clock.afterTurn !== wrapper) errors.push('Spy observer hook ownership changed')
        else if (descriptor) Object.defineProperty(clock, 'afterTurn', descriptor)
        else delete clock.afterTurn
      }
      return structuredClone({ samples, errors, restored: clock.afterTurn === original })
    },
  }
}

export function requireSabotageTrace(trace, input, targetId, goals) {
  const insist = (value, message) => { if (!value) throw Error(message) }
  insist(trace.restored && !trace.errors.length, 'Spy observer must finish cleanly')
  const sent = input.after, before = input.before, order = sent.current
  insist(sent.actor?.registeredNative && sent.actor.target === targetId && sent.order?.model === 15 && order,
    'Actual Spy input must attach command15 through the registered owner')
  insist(before.person.goalX === sent.person.goalX && before.person.goalY === sent.person.goalY,
    'The input handler must not eagerly plan the approach')
  const visits = trace.samples.filter(s => s.turn > sent.turn && s.current === order && s.order?.model === 15 && s.person?.state === 10)
  const approaching = visits.filter(s => s.person.substate === 0)
  insist(approaching.length > 0, 'Observe an actual approach before arrival')
  const planned = approaching[0].person
  insist(goals.some(g => g.x === planned.goalX && g.y === planned.goalY), 'Approach must use the actual special/outside target')
  insist(approaching.every(s => !(s.person.flags2 & 0x40000000)), 'Approach entry gate must be consumed')
  const armed = visits.find(s => s.person.substate === 1 && s.person.flags2 & 0x40000000)
  insist(armed, 'Observe the arrival visit arming phase1')
  const signed = v => (v << 16) >> 16
  insist(Math.abs(signed(armed.person.goalX) - signed(armed.person.x)) <= 11 &&
    Math.abs(signed(armed.person.goalY) - signed(armed.person.y)) <= 11, 'Arrival must satisfy both signed goal axes')
  const next = visits.find(s => s.turn > armed.turn && s.person.counter !== armed.person.counter)
  insist(next && next.person.counter === ((armed.person.counter + 1) & 255) &&
    next.person.substate === 1 && next.person.timer === 9 && !(next.person.flags2 & 0x40000000),
  'The next actual controller visit must initialize and decrement the armed wait')
  const ignition = visits.find(s => s.turn > next.turn && s.person.substate === 4 && s.target?.burn?.remaining > 0)
  insist(ignition?.target.id === targetId && ignition.target.damage?.attacker === 0, 'Observe actual Blue Spy target ignition')
  insist(trace.samples.filter(s => s.turn > sent.turn && s.turn <= ignition.turn).every(s =>
    s.actor?.hp > 0 && s.actor.registeredNative && s.current === order && s.order?.model === 15 && s.person?.state === 10),
    'The living registered Spy must retain command15 through ignition')
  return { order, approachTurn: approaching[0].turn, armedTurn: armed.turn,
    nextVisitTurn: next.turn, ignitionTurn: ignition.turn,
    disguiseAtInput: sent.person.disguise, disguiseAtIgnition: ignition.person.disguise,
    goal: { x: planned.goalX, y: planned.goalY } }
}
