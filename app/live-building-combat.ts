import { cancelLiveResting } from './live-resting.ts'
import {
  buildingPose,
  browserPosition,
  nativePosition,
  ensureBuildingDamage,
  joinBattle,
  sound,
  type World,
  type Unit,
  type Building,
} from './model.ts'
import {
  createLivePerson,
  moveLivePerson,
  setLivePersonAnimation,
  registerLivePerson,
  leaveLiveBuilding,
  type LivePerson,
} from './live-people.ts'
import { clearLivePath, planLivePath, acceptLivePath, replanLivePath } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import { personAnimationObject } from './person-state.ts'
import { finishPersonPreparation, stepPersonReaction } from './person-update.ts'
import { attackCombatBuilding } from './combat-building.ts'
import { startLiveOrders, cancelLiveOrder } from './live-movement.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  clearPersonOrders,
  currentPersonOrder,
  type OrderEffects,
} from './person-orders.ts'
import { buildingAdmission } from './live-building-entry.ts'

const unsupported = (): never => {
  throw new Error('Unported building attack order consumer')
}
const orderEffects = (u: Unit): OrderEffects => ({
  prepare: unsupported,
  stopWork: unsupported,
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: p => {
    Object.assign(p, { workFlags: 0 })
    u.fight = null
  },
})

export function liveBuildingAttackTarget(w: World, p: LivePerson) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (order?.model !== 19 || order.flags & 1) return undefined
  const cell = ((order.a & 254) >> 1) + ((order.a & 0xfe00) >> 9) * 128
  const id = w.land.buildingIds[cell] & 1023
  return w.buildings.find(
    b => b.id === id && b.hp > 0 && b.progress === 1 && b.team !== (p.tribe === 0 ? 'blue' : 'red')
  )
}

export function cancelLiveBuildingAttack(w: World, u: Unit) {
  const p = u.native ?? u.fight?.motion ?? u.flight
  if (!p || currentPersonOrder(w.buildingOrders, p)?.model !== 19) return
  clearPersonOrders(w.buildingOrders, p, orderEffects(u))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
  if (u.native === p) u.native = null
  u.fighting = false
}

// The shared native command record survives a defender encounter. General area
// target selection and non-building command-19/21 consumers remain unfinished.
export function stepLiveBuildingAttack(w: World, u: Unit, b: Building) {
  if (!u.native || currentPersonOrder(w.buildingOrders, u.native)?.model !== 19) {
    cancelLiveResting(w, u)
    cancelLiveBuildingAttack(w, u)
    cancelLiveOrder(w, u)
    const id = allocatePersonOrder(w.buildingOrders)
    if (!id) return
    clearLivePath(w, u)
    const p = u.native ?? createLivePerson(w, u),
      point = nativePosition(w, b)
    Object.assign(w.buildingOrders.records[id], {
      model: 19,
      a: ((point.x >>> 8) & 254) | (point.y & 0xfe00),
      b: 0,
    })
    attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(u))
    p.state = 10
    startLiveOrders(w, p, w)
    u.native = p
    u.target = b.id
  }
  if (u.native.state !== 10) {
    u.native.previousState = u.native.state
    u.native.state = 10
    startLiveOrders(w, u.native, w)
  }
  if (u.native.substate === 0) {
    u.native.substate = 3
    u.native.workTarget = b.id
    u.native.flags2 = (u.native.flags2 | 0x40000000) >>> 0
  }
  const p = u.native!,
    state = ensureBuildingDamage(b)
  const target = {
    ...state,
    ...buildingPose(b),
    ...nativePosition(w, b),
    class: 2,
    tribe: b.team === 'blue' ? 0 : 1,
  }
  const stop = () => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, u)
  }
  const destination = (to: { x: number; y: number }) => {
    stop()
    acceptLivePath(w, u, planLivePath(w, u, browserPosition(to), p))
  }
  registerLivePerson(w, p)
  p.counter = (p.counter + 1) & 255
  finishPersonPreparation(p, {
    animation: () => {
      const object = personAnimationObject(p)
      if (object !== -1) setLivePersonAnimation(w, p, object)
    },
    destination: to => replanLivePath(w, u, p, to),
  })
  stepPersonReaction(p)
  moveLivePerson(w, u, p)
  const context = {
    randomState: w.randomState,
    levelFlags2: w.levelFlags2,
    playerTribe: w.manaWorld.playerTribe,
    attackAlert: w.attackAlert,
    attackCell: w.attackCell,
    tribes: w.manaTribes.map(t => ({ flags: t.flags2 })),
  }
  if (!w.musicActivity && p.tribe === context.playerTribe) w.musicActivity = 1
  p.flags2 = (p.flags2 | 0x2000000) >>> 0
  if (p.flags2 & 0x40000000) {
    p.flags4 = (p.flags4 & ~0x10007) >>> 0
    p.assignment &= ~512
  }
  const result = attackCombatBuilding(context, p, target, {
    animation: (person, object) => setLivePersonAnimation(w, person as typeof p, object),
    destination,
    directDestination: to => {
      stop()
      setDirectPersonDestination(w.motionRoutes, p, to)
    },
    buildingAt: to => w.land.buildingIds[(to.y >> 9) * 128 + (to.x >> 9)],
    hasDefenders: () => buildingAdmission(w, b).inside > 0,
    removeDefender: () => {
      const admission = buildingAdmission(w, b)
      const id = admission.occupants.find(Boolean),
        defender = w.units.find(unit => unit.id === id)
      if (!defender) return undefined
      const person = leaveLiveBuilding(w, defender)
      if (!person) return undefined
      defender.native = person
      target.buildingFlags &= ~4
      return person
    },
    encounter: defender => {
      const unit = w.units.find(candidate => candidate.id === defender.id)!
      // Commit branch RNG before encounter allocation/initialization consumes it.
      w.randomState = context.randomState
      joinBattle(w, u, unit, b)
      context.randomState = w.randomState
    },
    releaseMotion: stop,
    sound: cue => sound(w, cue, u, u.id),
  })
  Object.assign(state, {
    damage: target.damage,
    attacker: target.attacker,
    buildingFlags: target.buildingFlags,
    renderFlags: target.renderFlags,
    tilt: target.tilt,
    roll: target.roll,
    remaining: target.remaining,
  })
  w.randomState = context.randomState
  w.attackAlert = context.attackAlert
  w.attackCell = context.attackCell
  context.tribes.forEach((t, i) => (w.manaTribes[i].flags2 = t.flags))
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.fighting = p.animationMode === 46 || p.animationMode === 53
  if (result === 'restart') {
    p.substate = 0
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
}
