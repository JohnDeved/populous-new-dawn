// Armed only during the ordinary Pause state. This adapter observes the existing
// post-turn callback; it never invokes tick, animation, rendering or clock steps.
export function installRecoveryObserver(expected, realm = globalThis) {
  const insist = (condition, message) => { if (!condition) throw Error(message) }
  insist(!realm.firewarriorRecoveryObserver, 'Recovery observer already installed')
  const scene = realm.testSceneRef.current, world = scene.world, clock = scene.gameClock
  const registry = realm.nativeGuardIdentityRegistry
  const unit = world.units.find(item => item.id === expected.actorId), person = unit?.native
  const target = world.buildings.find(item => item.id === expected.targetId)
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  insist(descriptor?.configurable && descriptor.writable && typeof descriptor.value === 'function',
    'An existing owned afterTurn callback is required')
  insist(world.paused && world.turn === expected.startTurn, 'Arm at the actual captured paused turn')
  insist(expected.projectileIds.length === 2 && new Set(expected.projectileIds).size === 2,
    'Pin the actual captured projectile pair')
  const original = descriptor.value, rows = [], startedAt = realm.performance.now()
  const limits = { rows: 32, ms: 8000 }
  let active = true, restored = false, failure = null, saw40 = false, complete = false
  let lastTurn = world.turn, timer = null, calls = 0
  const identity = object => registry.identities.get(object)
  const validateOwner = () => {
    insist(realm.testSceneRef.current === scene && scene.world === world && scene.gameClock === clock,
      'Recovery scene/world/clock owner changed')
    insist(realm.testStore.getWorld() === world && registry.epoch === expected.epoch,
      'Recovery store or observation epoch changed')
    insist(identity(scene) === expected.sceneIdentity && identity(world) === expected.worldIdentity,
      'Recovery scene/world identity changed')
    insist(world.units.includes(unit) && unit.native === person && unit.hp > 0 && unit.inside === null,
      'Captured actor/native owner disappeared')
    insist(identity(unit) === expected.unitIdentity && identity(person) === expected.nativeIdentity,
      'Captured actor/native identity changed')
    insist(unit.kind === 'firewarrior' && unit.team === 'blue' && person.class === 1 && person.model === 6,
      'Captured Firewarrior class or tribe changed')
    insist(!unit.flight && !unit.fight && !unit.builder && !unit.entry && !person.vehicle,
      'Captured on-foot owner changed')
    insist(world.buildings.includes(target) && target.hp > 0 && identity(target) === expected.targetIdentity,
      'Captured target identity changed')
    insist(world.speed === 1 && world.status === 'playing' && world.inputMask === 0,
      'Ordinary recovery execution changed')
  }
  const snapshot = () => {
    validateOwner()
    const orderId = person.immediateCommand || person.commands[person.commandCursor] || 0
    const record = world.buildingOrders.records[orderId]
    const shots = world.effects.filter(effect => expected.projectileIds.includes(effect.id)).map(effect => {
      insist(effect.firewarriorShot?.source === expected.actorId && effect.firewarriorShot.target === expected.targetId,
        'Captured projectile attribution changed')
      return { ...structuredClone(effect.firewarriorShot), id: effect.id }
    })
    return { turn: world.turn, paused: world.paused, actorId: unit.id, nativeIdentity: identity(person),
      targetId: target.id, orderId, order: record ? { ...record } : null,
      native: Object.fromEntries(['state', 'substate', 'commandStatus', 'animationMode', 'timer', 'assignment',
        'object', 'draw', 'f1', 'f2', 'renderFlags', 'workTarget', 'stateObject'].map(key => [key, person[key]])),
      projectiles: shots }
  }
  const initial = snapshot()
  insist(initial.orderId === expected.orderId && initial.order?.model === 21 && initial.order.flags === 0x22,
    'Pin the actual captured automatic command')
  insist(person.state === 10 && person.substate === 11 && person.commandStatus === 21 &&
    person.animationMode === 44 && person.workTarget === target.id && person.object === 56 && person.draw === 13,
    'Arm during the captured firing phase')
  insist(initial.projectiles.length === 2 && initial.projectiles.filter(shot => shot.impact).length === 1 &&
    expected.projectileIds.every(id => initial.projectiles.filter(shot => shot.id === id).length === 1),
    'Both actual captured projectiles must remain present while paused')
  const tracked = initial.projectiles.find(shot => shot.impact).id
  insist(person.stateObject === tracked, 'Actual tracked projectile must belong to the captured pair')
  const stop = () => {
    active = false
    if (timer !== null) {
      try { realm.clearTimeout(timer) } catch { failure ??= 'Recovery timer cleanup failed' }
      timer = null
    }
    if (!restored) try {
      if (Object.getOwnPropertyDescriptor(clock, 'afterTurn')?.value === wrapper) {
        Object.defineProperty(clock, 'afterTurn', descriptor); restored = true
      } else failure ??= 'Recovery observer no longer owns afterTurn'
    } catch { failure ??= 'Recovery callback restoration failed' }
  }
  const fail = reason => {
    if (!failure) try { failure = String(reason) } catch { failure = 'Recovery observation failed' }
    stop()
  }
  const finish = () => { stop(); return read() }
  const read = () => ({ failure, active, restored, saw40, complete, calls, limits: { ...limits },
    startedAt, elapsedMs: realm.performance.now() - startedAt, expected: structuredClone(expected),
    initial: structuredClone(initial), rows: structuredClone(rows),
    boundary: 'After the existing callback following each actual stepTurn; before logical animation and the next catch-up turn.' })
  function wrapper(...args) {
    let result
    try { result = Reflect.apply(original, this, args) }
    catch (error) { if (active) fail('Original afterTurn threw'); throw error }
    // Diagnostics cannot replace the original result or escape into game code.
    if (active) try {
      calls++
      insist(clock.afterTurn === wrapper, 'Recovery callback was replaced')
      insist(realm.performance.now() - startedAt <= limits.ms && rows.length < limits.rows,
        'Recovery observer row/time bound')
      const row = snapshot()
      insist(!row.paused && row.turn === lastTurn + 1, 'Missing adjacent real recovery turn')
      lastTurn = row.turn
      const sameCommand = row.orderId === expected.orderId && row.native.commandStatus === 21
      if (row.native.animationMode === 44 || row.native.animationMode === 40) {
        insist(sameCommand && row.order?.model === 21 && row.order.flags === 0x22 &&
          row.native.workTarget === expected.targetId && row.native.object === 56 && row.native.draw === 13,
          'Captured firing command or target changed before recovery')
        insist(row.native.stateObject === tracked || row.native.stateObject === 0,
          'Captured tracked projectile changed')
      }
      if (sameCommand && row.native.animationMode === 40) saw40 = true
      complete = !sameCommand && row.native.animationMode !== 44 && row.native.animationMode !== 40 && !row.projectiles.length
      rows.push(row)
      if (complete) {
        insist(saw40, 'Captured volley completed without a real phase40 observation')
        stop()
      }
    } catch (error) {
      let message = 'Recovery observation failed'
      try { message = error?.message ?? message } catch { /* Keep the safe diagnostic. */ }
      fail(message)
    }
    return result
  }
  const observer = { read, finish }
  try {
    Object.defineProperty(clock, 'afterTurn', { ...descriptor, value: wrapper })
    realm.firewarriorRecoveryObserver = observer
    timer = realm.setTimeout(() => fail('Recovery observer lifetime bound'), limits.ms)
    return read()
  } catch (error) {
    stop()
    if (realm.firewarriorRecoveryObserver === observer) delete realm.firewarriorRecoveryObserver
    throw error
  }
}
