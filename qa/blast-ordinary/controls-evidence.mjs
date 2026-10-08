// QA projections and evidence checks only. No game calls, input or storage writes.
const requireEvidence = (condition, message) => { if (!condition) throw Error(message) }
const equal = (actual, expected, message) => requireEvidence(JSON.stringify(actual) === JSON.stringify(expected), message)
const owner = unit => unit?.flight ?? unit?.fight?.motion ?? unit?.native ?? unit?.entry?.person ?? unit?.builder?.person

export function controlSnapshot(world) {
  const actor = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && !unit.ghost)
  return structuredClone({
    level: world.outcome.level, turn: world.turn, time: world.time, pendingTime: world.pendingTime,
    status: world.status, paused: world.paused, speed: world.speed, inputMask: world.inputMask,
    flags: world.manaWorld.gameFlags, mode: world.mode, selected: [...world.selected],
    stock: world.shots.blast, charging: world.charging, disabled: world.manaWorld.spells[0].disabled,
    castCount: world.stats.cast, lastOrderTurn: world.lastOrderTurn,
    actor: actor ? { id: actor.id, hp: actor.hp, x: actor.x, z: actor.z, casting: actor.casting ?? null } : null,
    projectiles: world.projectiles.filter(shot => shot.team === 'blue' && shot.spell === 'blast'),
    effects: world.effects.filter(effect => ['blast', 'blastWave'].includes(effect.kind)).map(effect => ({ id: effect.id, kind: effect.kind, x: effect.x, z: effect.z })),
    payment: { shots: world.shots, stock: world.manaWorld.spells[0].stocks, mana: world.manaTribes[0], casts: world.spellCasts[0] },
    randomState: world.randomState, cosmeticRandom: world.cosmeticRandom, message: world.message,
  })
}

export function activeCheckpointProjection(world, targetId) {
  const state = controlSnapshot(world), target = world.units.find(unit => unit.id === targetId)
  return structuredClone({
    level: state.level, turn: state.turn, time: state.time, pendingTime: state.pendingTime,
    paused: state.paused, speed: state.speed, status: state.status, mode: state.mode,
    projectiles: state.projectiles, actor: state.actor, payment: state.payment,
    randomState: state.randomState, cosmeticRandom: state.cosmeticRandom,
    charging: state.charging, disabled: state.disabled, castCount: state.castCount,
    target: target ? { id: target.id, team: target.team, kind: target.kind, hp: target.hp,
      x: target.x, z: target.z, inside: target.inside, person: owner(target) } : null,
  })
}

export function assertNoCast(event) {
  requireEvidence(event.trusted && event.before && event.after, 'Actual trusted input required')
  requireEvidence(event.before.turn === event.after.turn, 'Input boundaries must share one turn')
  for (const key of ['stock', 'castCount', 'projectiles', 'payment', 'randomState', 'cosmeticRandom', 'lastOrderTurn'])
    equal(event.after[key], event.before[key], `Rejected/cancelled input changed ${key}`)
}

export function assertCancellationSequence(events) {
  const expected = [
    ['keydown', 'Digit1', null, 'blast'],
    ['keydown', 'Escape', 'blast', null],
    ['keydown', 'Digit1', null, 'blast'],
    ['pointerup', 2, 'blast', null],
    ['keydown', 'Digit1', null, 'blast'],
    ['keydown', 'Digit1', 'blast', null],
  ]
  requireEvidence(events.length === expected.length, 'Exactly six delivered cancellation inputs required')
  for (const [index, [type, control, before, after]] of expected.entries()) {
    const event = events[index]
    requireEvidence(event.type === type && (type === 'keydown' ? event.code === control && !event.repeat : event.button === control && event.canvasOwned), `Cancellation input ${index + 1} has the wrong delivered control`)
    assertNoCast(event)
    requireEvidence(event.before.mode === before && event.after.mode === after, `Cancellation input ${index + 1} did not perform its own mode transition`)
  }
}

export function assertCast(event, pointer, { targetId = null } = {}) {
  requireEvidence(event.trusted && event.canvasOwned && event.type === 'pointerup' && event.button === 0, 'Trusted owned-canvas release required')
  requireEvidence(event.before.mode === 'blast' && !event.before.paused, 'Live armed Blast required')
  requireEvidence(event.before.turn === event.after.turn, 'Release boundaries must share one turn')
  requireEvidence(event.before.projectiles.length === 0 && event.after.projectiles.length === 1, 'One fresh Blue Blast allocation required')
  requireEvidence(event.after.stock === event.before.stock - 1 && event.after.castCount === event.before.castCount + 1, 'One allocation must consume exactly one shot')
  requireEvidence(event.after.mode === null, 'Successful cast must clear targeting mode')
  requireEvidence(pointer?.trusted && pointer.canvasOwned && pointer.canvasTarget && pointer.turn === event.before.turn && pointer.x === event.x && pointer.y === event.y, 'Matching actual handler trace required')
  const person = pointer.picks.filter(pick => pick.name === 'pickPerson').at(-1)?.id ?? null
  const shot = event.after.projectiles[0]
  requireEvidence(shot.phase === 'windup' && shot.remaining === 6, 'Actual release must allocate the ordinary windup')
  if (targetId !== null) {
    requireEvidence(person === targetId && event.targetSame && event.targetOwnerValid, 'Actual handler must consume the original person')
    requireEvidence(shot.blastTarget?.personId === targetId && shot.blastTarget.shotPersonId === null, 'Allocated person ownership required')
  } else {
    const terrain = pointer.picks.find(pick => pick.name === 'pick' && pick.owner === 'scene' && pick.point)?.point
    requireEvidence(person === null && terrain && !shot.blastTarget, 'Ground cast must use actual terrain without person ownership')
    equal(shot.target, { x: Math.floor(terrain.x / 2) * 2 + 1, z: -Math.floor(-terrain.z / 2) * 2 - 1 }, 'Ground cast must retain native cell centering')
  }
  return shot
}

export function assertActivePause(release, pause, shotId, targetId) {
  requireEvidence(pause?.trusted && pause.type === 'keydown' && pause.code === 'Space' && !pause.repeat && !pause.blockedTarget, 'Ordinary nonrepeated Space required')
  requireEvidence(pause.observedAt > release.observedAt && pause.before.turn >= release.after.turn, 'Pause must follow the real release')
  requireEvidence(!pause.before.paused && pause.after.paused, 'Public Space must own the pause transition')
  const shot = pause.after.projectiles.find(shot => shot.id === shotId)
  requireEvidence(shot && ['windup', 'flying'].includes(shot.phase) && shot.blastTarget?.personId === targetId, 'Pause arrived after active tracked cast ended')
  for (const key of ['turn', 'time', 'pendingTime', 'projectiles', 'payment', 'castCount', 'randomState', 'cosmeticRandom'])
    equal(pause.after[key], pause.before[key], `Pause input changed ${key}`)
  return shot
}

export function assertFrozen(before, after) {
  requireEvidence(before.paused && after.paused, 'Pause must remain active throughout the hold')
  for (const key of ['turn', 'time', 'pendingTime', 'projectiles', 'payment', 'castCount', 'randomState', 'cosmeticRandom'])
    equal(after[key], before[key], `Paused hold advanced ${key}`)
}
