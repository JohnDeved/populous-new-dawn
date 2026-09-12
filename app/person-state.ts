import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, nativeStep, random } from './native-math.ts'
import { currentPersonOrder, type OrderedPerson, type OrderPool } from './person-orders.ts'

export type StatefulPerson = OrderedPerson & {
  tribe: number
  previousState: number
  physics: number
  renderFlags: number
  statusFlags: number
  workFlags: number
  stateObject: number
  speed: number
  timer: number
  target: number
  reservationNext: number
  formationCell: number
  cargo: number
  animationMode: number
  vehicle: number
  angle: number
  turnAngle: number
  motionTimer: number
  motionMode: number
}
export interface PersonStateWorld {
  randomState: number
  instantFacing: boolean
  levelFlags: number
  orders: OrderPool
  tribes: { x: number; y: number; angle: number; selectedCount: number; flags: number }[]
}
export interface PersonStateEffects {
  deselectPassengers: (person: StatefulPerson) => void
  rebuildTrainingQueue: (target: number) => void
  rebuildFormation: (cell: number) => void
  releaseMotion: (person: StatefulPerson) => void
  startOrders: (person: StatefulPerson) => void
  setAnimation: (person: StatefulPerson, object: number) => void
  celebrate?: () => void
  specialBattle?: () => void
  idleApproach?: () => void
  resting?: () => void
  occupying?: () => void
  fight?: () => void
  encounter?: () => void
  routeRecovery?: () => void
}
const short = (n: number) => (n << 16) >> 16

// Complete 0x402e30; read the model after any preceding world callbacks.
export function defaultPersonState(p: { model: number }, gameFlags: number) {
  return gameFlags & 2 && p.model === 7 ? 39 : rules.personModels[p.model].nextState
}

// Complete 0x518560: a removed/released group returns control to ordinary orders.
export function stateAfterFight(
  p: { model: number },
  gameFlags: number,
  group?: { class: number; flags2: number }
) {
  return group && group.class && !(group.flags2 & 1) ? 0 : defaultPersonState(p, gameFlags)
}

// Shared native speed draw used by 0x4d2740, 0x432260 and fight recovery.
export function randomPersonSpeed(
  w: { randomState: number },
  p: Pick<StatefulPerson, 'physics' | 'flags3'>
) {
  const raw = rules.personSpeeds[p.physics]
  if (raw === undefined) throw new RangeError(`Unsupported native physics model ${p.physics}`)
  const base = short(raw),
    spread = (base >> 2) >>> 0
  const speed = short(base + (random(w) % (spread || 1)))
  return p.flags3 & 0x80000 ? short(speed * 2) : speed
}

// 0x4d4f40: dropping a fight assignment draws speed and resets its animation.
export function recoverPersonMovement(
  w: { randomState: number },
  p: StatefulPerson,
  setAnimation: PersonStateEffects['setAnimation']
) {
  p.speed = randomPersonSpeed(w, p)
  setPersonAnimationRow(p, p.cargo ? 5 : 1, setAnimation)
}

// 0x4d4ee0: stopping keeps cargo/airborne animation choices, without an RNG draw.
export function stopPersonMovement(
  p: StatefulPerson,
  setAnimation: PersonStateEffects['setAnimation']
) {
  p.speed = 0
  setPersonAnimationRow(p, p.cargo ? 4 : 0, setAnimation)
}

// Complete 0x4d4da0. Only standing objects draw the idle-gesture RNG.
export function stepPersonIdleGesture(
  rng: { randomState: number },
  p: StatefulPerson & { object: number; draw: number; slowTurn: number },
  chance: number,
  animation: PersonStateEffects['setAnimation'],
  frameCount: (object: number) => number
) {
  if (![48, 80, 208].includes(p.object)) setPersonAnimationRow(p, p.cargo ? 4 : 0, animation)
  else if (random(rng) % chance === 0) {
    animation(p, rules.personAnimationObjects[(21 + (random(rng) % 3)) * 9 + p.model])
    const duration = (rules.animationDescriptors[p.draw].step + 1) * frameCount(p.object)
    p.slowTurn = (duration << 24) >> 24
  }
}

// 0x4391a0 / 0x439240: stop on entry, optionally turn on the 32-turn phase,
// then finish only when the signed timer reaches zero.
export function stepPersonWait(
  rng: { randomState: number },
  p: StatefulPerson & { counter: number },
  effects: { animation: PersonStateEffects['setAnimation']; releaseMotion: () => void },
  randomFacing: boolean
) {
  if (p.assignment & 16) {
    p.assignment &= ~16
    stopPersonMovement(p, effects.animation)
  }
  if (randomFacing && !(p.counter & 31)) {
    const angle = random(rng) & 2047
    effects.releaseMotion()
    p.turnAngle = angle
    p.flags2 = (p.flags2 | 0x1080) >>> 0
  }
  p.timer = short(p.timer - 1)
  return p.timer === 0
}

// Complete 0x4d3ff0, shared by idle, movement and recovery controllers.
export function setPersonAnimationRow(
  p: StatefulPerson,
  row: number,
  setAnimation: PersonStateEffects['setAnimation']
) {
  if (p.flags2 & 0x80000) {
    row = p.flags4 & 0x400 ? 12 : 2
    if (row === 2) p.flags2 = (p.flags2 & ~0x8000) >>> 0
  }
  setAnimation(p, rules.personAnimationObjects[row * 9 + p.model])
}

// 0x4e9b40, shared by state release and command configuration.
export function resetPersonMotion(p: StatefulPerson) {
  p.flags2 = ((p.flags2 & 0xdffff7ff) | 0x1000) >>> 0
  p.motionTimer = 0
  p.motionMode = 0
}

// 0x4d3ea0. Return the original animation-object identity, not a guessed sprite
// row from browser movement. A -1 table entry means leave the current object.
export function personAnimationObject(
  p: Pick<StatefulPerson, 'state' | 'model' | 'flags2' | 'flags4' | 'speed' | 'cargo'>
) {
  const model = rules.personModels[p.model]
  if (!model) throw new RangeError(`Unsupported native person model ${p.model}`)
  let row = 1,
    object = -1
  if (p.flags2 & 0x80000) {
    row = p.flags4 & 0x400 ? 12 : 2
    if (row === 2) p.flags2 = (p.flags2 & ~0x8000) >>> 0
  } else {
    if ([1, 3, 12, 19, 25, 29, 39, 44].includes(p.state)) row = 0
    else if ([11, 14].includes(p.state)) row = 3
    else if (p.state === 15) object = 2
    else if (p.state === 16) object = 3
    else if (p.state === 24) row = 12
    else if ([26, 31, 40].includes(p.state)) row = 25
    if (row === 1 && !p.speed) row = 0
  }
  if (model.flags & 2 && p.cargo) {
    if (row === 0) row = 4
    else if (row === 1) row = 5
  }
  return object === -1 ? rules.personAnimationObjects[row * 9 + p.model] : object
}

// 0x4eec80: selected people face the tribe's camera-relative interest point.
// With neither native global flag set, request a turn and release motion;
// land_flags_1 bit 8 or opened_files_flags bit 16 instead sets yaw immediately.
export function faceTribe(
  w: { instantFacing: boolean; tribes: { x: number; y: number; angle: number }[] },
  p: StatefulPerson,
  effects: Pick<PersonStateEffects, 'releaseMotion'>
) {
  let angle = p.angle
  if (p.tribe !== -1) {
    const tribe = w.tribes[p.tribe]
    const point = nativeStep(
      { x: tribe.x / 256, z: -tribe.y / 256 },
      (tribe.angle + 1024) & 2047,
      16384
    )
    const dx = short(Math.round(point.x * 256) - p.x),
      dy = short(Math.round(-point.z * 256) - p.y)
    angle = nativeAngle(dx, -dy)
  }
  if (w.instantFacing) p.angle = angle
  else {
    effects.releaseMotion(p)
    p.turnAngle = angle
    p.flags2 = (p.flags2 | 0x1080) >>> 0
  }
}

// 0x4d2740: shared initialization for timed wait (1), orders (10), selection (14), fight
// recovery (36), special battle (39) and victory (41).
// Other state bodies are not silently approximated. World consumers remain
// required callbacks until their native terrain, animation and list ports land.
export function initializePersonState(
  w: PersonStateWorld,
  p: StatefulPerson,
  effects: PersonStateEffects
) {
  if (![1, 8, 10, 14, 17, 19, 21, 22, 25, 26, 29, 33, 36, 39, 41, 44].includes(p.state))
    throw new RangeError(`Unported person-state initializer ${p.state}`)
  const oldFlags = rules.personStateFlags[p.previousState],
    stateFlags = rules.personStateFlags[p.state]
  const model = rules.personModels[p.model]
  if (oldFlags === undefined || !model)
    throw new RangeError('Unsupported native person state/model')
  p.stateObject = 0
  const deselect = () => {
    p.flags3 = (p.flags3 & ~128) >>> 0
    p.selectionFlags &= ~128
    if (p.vehicle) effects.deselectPassengers(p)
  }
  if (p.previousState === 14) {
    const tribe = w.tribes[p.tribe]
    if (tribe.selectedCount) tribe.selectedCount = (tribe.selectedCount - 1) | 0
    deselect()
  } else if (p.previousState === 24) {
    p.flags2 = (p.flags2 & ~0x4000) >>> 0
    p.workTarget = 0
  }
  if (p.state !== p.previousState && oldFlags & 256) p.flags3 = (p.flags3 | 0x800) >>> 0
  if (p.flags3 & 32 && p.state !== 14) {
    const order = currentPersonOrder(w.orders, p)
    // Unlike normal command queries, this leaf does not test cancellation.
    if (p.state !== 10 || !order || order.model !== 8 || short(p.target) !== order.a) {
      effects.rebuildTrainingQueue(short(p.target))
      p.flags3 = (p.flags3 & ~32) >>> 0
      p.reservationNext = 0
    }
  }
  p.flags2 = (p.flags2 & 0xfcdefddd) >>> 0
  p.renderFlags &= 0xfeff
  if (p.model === 7) {
    p.flags4 = (p.flags4 | 256) >>> 0
    p.statusFlags |= 4
  }
  p.flags4 = (p.flags4 & (p.model === 8 ? 0xffff7fff : 0xffff7f7f) & ~8) >>> 0
  p.assignment &= 0xf51f
  if (!(stateFlags & 16)) {
    p.workFlags = 0
    p.workTarget = 0
  }
  p.flags4 = (p.flags4 & 0xfffefff8) >>> 0
  if (p.assignment & 1 && stateFlags & 4 && !(model.flags & 0x400)) {
    p.assignment &= ~1
    if (p.state !== 10 || p.commands[p.commandCursor] & 255)
      effects.rebuildFormation(p.formationCell)
  }
  const oldSpeed = p.speed
  p.flags2 = (p.flags2 & 0xfffb7fff) >>> 0
  if (!(stateFlags & 512)) p.speed = randomPersonSpeed(w, p)
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  p.substate = 0
  p.timer = 0
  if (p.state === 1) {
    p.speed = 0
    p.timer = (random(w) % 50) + 50
  } else if (p.state === 8) p.target = 0
  else if (p.state === 10) effects.startOrders(p)
  else if (p.state === 14) {
    const tribe = w.tribes[p.tribe]
    tribe.selectedCount = (tribe.selectedCount + 1) | 0
    p.assignment &= ~4
    p.flags4 = (p.flags4 & ~0x40000) >>> 0
    p.speed = 0
    p.selectionFlags |= 0x81
    p.flags3 = (p.flags3 & ~1) >>> 0
    p.flags2 = (p.flags2 | 0x1000000) >>> 0
    faceTribe(w, p, effects)
    p.assignment |= 16
    p.animationMode = 1
  } else if (p.state === 17) {
    if (!effects.idleApproach) throw new Error('State 17 requires its idle approach initializer')
    effects.idleApproach()
  } else if (p.state === 19) {
    if (!effects.resting) throw new Error('State 19 requires its resting initializer')
    effects.resting()
  } else if (p.state === 21) {
    if (!effects.occupying) throw new Error('State 21 requires its occupancy consumers')
    p.assignment |= 1
    p.speed = 0
    effects.occupying()
  } else if (p.state === 22) {
    // 0x4d2740: the browser has no adjacent vehicle, so use the ground-cast pose.
    effects.releaseMotion(p)
    effects.setAnimation(p, 0x6d)
    p.timer = 10
  } else if (p.state === 25 || p.state === 29) {
    const enter = p.state === 25 ? effects.fight : effects.encounter
    if (!enter) throw new Error(`State ${p.state} requires its combat initializer`)
    enter()
  } else if (p.state === 26) {
    effects.setAnimation(p, rules.personAnimationObjects[25 * 9 + p.model])
    p.flags4 = (p.flags4 | 128) >>> 0
    p.speed = 110
    deselect()
    p.timer = 64
    const angle = random(w) & 2047
    effects.releaseMotion(p)
    p.flags2 = (p.flags2 | 0x1080) >>> 0
    p.turnAngle = angle
  } else if (p.state === 33) {
    if (!effects.routeRecovery) throw new Error('State 33 requires route recovery')
    effects.routeRecovery()
  } else if (p.state === 44) {
    p.speed = 0
    p.flags2 = (p.flags2 | 0x40100000) >>> 0
  } else if (p.state === 39) {
    if (!effects.specialBattle) throw new Error('State 39 requires its special battle initializer')
    effects.specialBattle()
  } else if (p.state === 41) {
    if (p.model !== 7) {
      p.flags4 = (p.flags4 | 128) >>> 0
      deselect()
    }
    if (!effects.celebrate)
      throw new Error('Victory initialization requires the celebration controller')
    effects.celebrate()
  }
  if (!(p.renderFlags & 256)) {
    const object = personAnimationObject(p)
    if (object !== -1) effects.setAnimation(p, object)
  }
  if (!oldSpeed && p.model === 6 && p.vehicle && p.commandStatus === 21) p.speed = 0
  if (p.tribe !== -1) {
    const tribe = w.tribes[p.tribe]
    if (tribe.flags & 64 && !(rules.personStateFlags[p.state] & 0x2000))
      tribe.flags = (tribe.flags | 1024) >>> 0
  }
}

// 0x4d32b0 state 44: two visits before the shock pose, death on visit eighteen.
// Physics and animation clocks continue independently of this person-state clock.
export function stepElectrocution(
  p: StatefulPerson,
  setAnimation: PersonStateEffects['setAnimation']
) {
  p.substate = (p.substate + 1) & 255
  if (p.substate === 2) setAnimation(p, rules.personAnimationObjects[27 * 9 + p.model])
  else if (p.substate === 18) {
    p.flags2 = (p.flags2 & ~0x100000) >>> 0
    p.previousState = p.state
    p.state = 3
    return true
  }
  return false
}

// 0x4c8490 phase 4. The reservation marker is assignment bit 0x800 at +0x77,
// not the adjacent animation/order scratch fields inferred by old struct names.
export function reserveTrainingPerson(
  w: PersonStateWorld,
  p: StatefulPerson,
  effects: PersonStateEffects
) {
  if (!(p.flags2 & 0x100000)) {
    p.previousState = p.state
    p.state = 14
    initializePersonState(w, p, effects)
  }
  p.assignment |= 0x800
}

// 0x418ce0 with 0x4e9b40 movement reset. The initializer chooses order state 10
// for normal followers; unsupported model/state paths remain explicit failures.
export function releaseSelectedPeople(
  w: PersonStateWorld,
  people: StatefulPerson[],
  state: number,
  effects: PersonStateEffects
) {
  for (const p of people) {
    if (p.state !== state) continue
    resetPersonMotion(p)
    if (p.flags2 & 0x100000) continue
    const next = w.levelFlags & 2 && p.model === 7 ? 39 : rules.personModels[p.model]?.nextState
    if (![1, 8, 10, 14, 17, 19, 21, 26, 36, 39, 41].includes(next))
      throw new RangeError(`Unported person-state initializer ${next}`)
    p.previousState = p.state
    p.state = next
    initializePersonState(w, p, effects)
  }
}

// 0x4df220: state 36 faces its target, plays the recovery pose, submits the
// fight consumer, then returns to the configured state when its timer expires.
export function stepFightRecovery(
  p: StatefulPerson & { heading: number; f1: number; f2: number },
  gameFlags: number,
  objects: ReadonlyMap<number, { x: number; y: number; class: number; flags2: number }>,
  effects: {
    setAnimation: PersonStateEffects['setAnimation']
    duration: () => number
    fight: (target: number) => void
  }
) {
  const target = p.target ? objects.get(p.target) : undefined
  let finished = !target || !target.class || !!(target.flags2 & 1)
  if (!finished) {
    if (p.substate === 0) {
      p.assignment |= 0x200
      p.flags2 = (p.flags2 | 128) >>> 0
      p.heading = nativeAngle(short(target!.x - p.x), -short(target!.y - p.y))
      p.turnAngle = p.heading
      p.angle = p.flags2 & 0x8000 ? (p.heading + 1024) & 2047 : p.heading
      p.substate = 1
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    } else if (p.substate === 1) {
      let row = 15
      if (p.flags2 & 0x80000) {
        row = p.flags4 & 0x400 ? 12 : 2
        if (row === 2) p.flags2 = (p.flags2 & ~0x8000) >>> 0
      }
      effects.setAnimation(p, rules.personAnimationObjects[row * 9 + p.model])
      p.f1 = 1
      p.f2 = 0
      p.timer = short(effects.duration())
      p.speed = p.vehicle && p.flags4 & 0x2000000 ? Math.trunc(p.speed / 2) : 0
      effects.fight(p.target)
      p.substate = 2
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    } else if (p.substate === 2) {
      p.timer = short(p.timer - 1)
      finished = p.timer <= 0
    }
  }
  return finished
    ? gameFlags & 2 && p.model === 7
      ? 39
      : rules.personModels[p.model].nextState
    : 0
}
