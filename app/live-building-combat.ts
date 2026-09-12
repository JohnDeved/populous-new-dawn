import { cancelLiveResting } from './live-resting.ts'
import {
  buildingPose,
  browserPosition,
  nativePosition,
  ensureBuildingDamage,
  joinBattle,
  sound,
  syncLandscapeObjects,
  setUnitInvisibility,
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
  collisionWorld,
  changeLivePersonState,
  type LivePerson,
} from './live-people.ts'
import { clearLivePath, replanLivePath } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import { personAnimationObject } from './person-state.ts'
import { preparePersonTurn, stepPersonReaction } from './person-update.ts'
import { attackCombatBuilding } from './combat-building.ts'
import {
  startLiveOrders,
  cancelLiveOrder,
  stepLiveOrderQueue,
  adoptLiveOrders,
} from './live-movement.ts'
import {
  findCombatApproachPoint,
  prepareCombatOrderVisit,
  retargetCombatOrder,
} from './combat-order-search.ts'
import {
  beginCombatPursuit,
  withinCombatArea,
  approachCombatBuilding,
  approachCombatPlan,
} from './combat-pursuit.ts'
import { approachCombatPerson, approachFight, attackCombatPlan } from './combat-approach.ts'
import {
  allocateLiveCombatResponse,
  combatPerson,
  nativePersonModel,
  nativePersonTribe,
  selectLiveCombatTarget,
} from './live-combat.ts'
import { availableFightSlot, releaseAttackReservation } from './combat-targets.ts'
import { fightWaitingPosition } from './melee-placement.ts'
import { engagementRange } from './melee-engagement.ts'
import { buildingInsidePoint, buildingOutsidePoint } from './building-shapes.ts'
import { terrainCellHeightRange, terrainPointHeight } from './native-terrain.ts'
import { moveObjectInCells } from './object-cells.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }
import {
  allocatePersonOrder,
  attachPersonOrder,
  clearPersonOrders,
  currentPersonOrder,
  type OrderEffects,
  type PersonOrder,
} from './person-orders.ts'
import { buildingAdmission } from './live-building-entry.ts'

const unsupported = (): never => {
  throw new Error('Unported building attack order consumer')
}
const orderEffects = (w: World): OrderEffects => ({
  prepare: unsupported,
  stopWork: person => releaseLiveAttackReservation(w, person.workTarget),
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: p => {
    Object.assign(p, { workFlags: 0 })
    const unit = w.units.find(u => u.id === p.id)
    if (unit) unit.fight = null
  },
})

export function releaseLiveAttackReservation(w: World, id: number) {
  const target = w.fights.find(fight => fight.id === id)?.attackReservation
  if (target) releaseAttackReservation(target)
}

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
  if (!p || ![11, 19, 21].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0)) return
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
  if (u.native === p) u.native = null
  u.fighting = false
}

export function startLiveCombatResponse(w: World, u: Unit) {
  if (u.team === 'wild' || u.builder) return false
  const retained = u.native ?? u.entry?.person
  if (
    w.turn & rules.personModels[nativePersonModel(u)].scanMask &&
    !((retained?.flags3 ?? 0) & 0x800)
  )
    return false
  const source = (retained ?? createLivePerson(w, u)) as LivePerson & { class: 1; group: number }
  if (!retained) source.state = combatPerson(u).state
  const cell = (source.y >> 9) * 128 + (source.x >> 9)
  let people: { unit: Unit; person: LivePerson & { class: 1; group: number } }[] = []
  const peers = () => {
    people = w.units
      .filter(unit => {
        const point = nativePosition(w, unit)
        return (
          unit.hp > 0 &&
          !unit.builder &&
          ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9) === cell
        )
      })
      .map(unit => {
        const existing = unit === u ? source : (unit.native ?? unit.entry?.person),
          person = (existing ?? createLivePerson(w, unit)) as LivePerson & {
            class: 1
            group: number
          }
        if (!existing) person.state = combatPerson(unit).state
        return { unit, person }
      })
    return people.map(({ person }) => person)
  }
  const id = allocateLiveCombatResponse(w, source, peers, orderEffects(w))
  if (!id) return false
  for (const { unit, person } of people) {
    if (person.immediateCommand !== id) continue
    cancelLiveResting(w, unit)
    clearLivePath(w, unit)
    unit.harvest = undefined
    unit.native = person
    unit.target = null
    registerLivePerson(w, person)
  }
  return true
}

// Manual command 19 and automatic command 21 share the native area controller.
export function stepLiveBuildingAttack(w: World, u: Unit, b?: Building) {
  if (
    !u.native ||
    ![11, 19, 21].includes(currentPersonOrder(w.buildingOrders, u.native)?.model ?? 0)
  ) {
    if (!b) return
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
    attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(w))
    p.state = 10
    startLiveOrders(w, p, w)
    // The legacy automatic scanner has already selected and reserved this target.
    p.substate = 3
    p.workTarget = b.id
    u.native = p
    u.target = b.id
  }
  const current = currentPersonOrder(w.buildingOrders, u.native)
  if (u.native.state !== 10 || u.native.commandStatus !== current?.model) {
    u.native.previousState = u.native.state
    u.native.state = 10
    startLiveOrders(w, u.native, w)
  }
  const p = u.native!
  registerLivePerson(w, p)
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize: () => changeLivePersonState(w, u),
    animation: () => {
      const object = personAnimationObject(p)
      if (object !== -1) setLivePersonAnimation(w, p, object)
    },
    destination: to => replanLivePath(w, u, p, to),
  })
  stepPersonReaction(p)
  moveLivePerson(w, u, p)
  if (p.state !== 10) return
  const next = stepLiveOrderQueue(w, u, p, {
    11: order => Number(stepGuardOrder(w, u, p, order)),
    19: order => Number(stepAreaAttack(w, u, p, order)),
  })
  if (next) {
    u.target = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  if (!u.fight) adoptLiveOrders(w, u, p)
  if (![11, 19, 21].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0)) u.target = null
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
}

function combatMotion(w: World, u: Unit, p: LivePerson) {
  const releaseMotion = () => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, u)
  }
  return {
    animation: (person: Parameters<typeof personAnimationObject>[0], object: number) =>
      setLivePersonAnimation(w, person as LivePerson, object),
    releaseMotion,
    destination: (to: { x: number; y: number }) => replanLivePath(w, u, p, to),
    directDestination: (to: { x: number; y: number }) => {
      releaseMotion()
      setDirectPersonDestination(w.motionRoutes, p, to)
    },
  }
}

function stepGuardOrder(w: World, u: Unit, p: LivePerson, order: PersonOrder) {
  if (p.substate) {
    stepAreaAttack(w, u, p, order)
    return false
  }
  if (!p.commandAux) {
    if (stepAreaAttack(w, u, p, order)) p.commandAux = 1
    return false
  }
  if (p.counter & 1) return false
  const selected = selectLiveCombatTarget(w, u, order)
  if (!selected) return false
  p.commandAux = 0
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  stepAreaAttack(w, u, p, order, selected)
  return false
}

function stepAreaAttack(
  w: World,
  u: Unit,
  p: LivePerson,
  order: PersonOrder,
  initial?: NonNullable<ReturnType<typeof selectLiveCombatTarget>>
) {
  const motion = combatMotion(w, u, p)
  const range = () => engagementRange(p, order, false)
  const buildingAt = (point: { x: number; y: number }) => {
    const cell = (point.y >> 9) * 128 + (point.x >> 9)
    return { flags: w.land.flags[cell], id: w.land.buildingIds[cell] & 1023 }
  }
  const outside = (id: number) =>
    buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!))
  const search = {
    randomState: w.randomState,
    playerTribe: w.manaWorld.playerTribe,
    alert: w.musicActivity,
    marches: w.combatMarches,
  }
  let selected = initial
  const effects = {
    ...motion,
    range,
    approachPoint: (command: PersonOrder) =>
      findCombatApproachPoint(p, command, {
        collision: collisionWorld(w),
        search: w.indexedSearch,
        landLimit: rules.pathLandLimit,
        heightRange: (cell: number) => terrainCellHeightRange(w.land, cell),
        outside,
      }),
    withinArea: (command: PersonOrder) =>
      withinCombatArea(p, command, undefined, { range, vehicleReady: unsupported }),
    select: (command: PersonOrder, vehicleOnly: boolean) => {
      if (vehicleOnly || p.vehicle) unsupported()
      selected ??= selectLiveCombatTarget(w, u, command)
      return selected && { id: selected.target.id, type: selected.type }
    },
    prepareTarget: (command: PersonOrder) =>
      beginCombatPursuit(
        search,
        p,
        command,
        { ...selected!.target, vehicle: 0 },
        {
          ...motion,
          canFire: unsupported,
          commandPosition: area => ({
            x: ((area.a & 254) + 1) * 256,
            y: (((area.a >>> 8) & 254) + 1) * 256,
          }),
          vehicleDestination: () => {
            if (p.vehicle) unsupported()
          },
        }
      ),
  }
  const visit = prepareCombatOrderVisit(search, p, order, effects)
  w.randomState = search.randomState
  w.musicActivity = search.alert
  if (p.substate === 0 || p.substate === 7) return visit.complete
  let { restart } = visit
  const building = w.buildings.find(b => b.id === p.workTarget && b.hp > 0)
  const target = w.units.find(unit => unit.id === p.workTarget && unit.hp > 0)
  const fight = w.fights.find(b => b.id === p.workTarget)
  if (!building && !target && !fight) restart = true
  else if (p.substate === 3 && building)
    restart = attackBuilding(w, u, p, building) === 'restart' || restart
  else if ([2, 6, 8].includes(p.substate) && target) {
    const result = approachCombatPerson(
      w,
      p,
      {
        ...combatPerson(target),
        workFlags: target.fight?.group ?? 0,
      },
      {
        ...motion,
        plannedDestination: motion.destination,
        frameCount: object => sprites.frameCounts[object],
        buildingAt,
        approachBuilding: radius =>
          approachCombatBuilding(w, p, radius, {
            ...motion,
            outside: () => outside(p.target & 65535),
          }),
        fightModel: id => (w.fights.find(f => f.id === id)?.encounter ? 9 : 8),
      }
    )
    if (result === 'encounter') joinBattle(w, u, target)
    else if (result === 'inside') {
      const inside = w.buildings.find(b => b.id === (p.target & 65535))
      if (inside) joinBattle(w, u, target, inside, 2)
      else restart = true
    } else if (result === 'retarget') {
      search.randomState = w.randomState
      restart = retargetCombatOrder(p, range(), effects) ?? true
      w.randomState = search.randomState
    } else restart ||= result === 'restart'
  } else if (p.substate === 1 && fight) {
    const members = fight.slots ?? [
      ...fight.members,
      ...Array(Math.max(0, 6 - fight.members.length)).fill(0),
    ]
    const people = new Map(
      w.units
        .filter(unit => members.includes(unit.id))
        .map(unit => [unit.id, { model: nativePersonModel(unit), tribe: nativePersonTribe(unit) }])
    )
    const tribes = fight.tribes ?? [...new Set([...people.values()].map(person => person.tribe))]
    fight.attackReservation ??= { flags4: 0, reactionTimer: 0, reactionDuration: 0 }
    const reservation = fight.attackReservation
    const record = {
      ...nativePosition(w, fight),
      ...reservation,
      id: fight.id,
      class: 10,
      flags2: 0,
      vehicle: 0,
      count: fight.members.length,
    }
    const result = approachFight(w, p, record, {
      ...motion,
      plannedDestination: motion.destination,
      frameCount: object => sprites.frameCounts[object],
      available: () => !!availableFightSlot({ objects: people }, { members, tribes }, p),
      waitingPosition: () => {
        const state = {
          randomState: w.randomState,
          collision: collisionWorld(w),
          occupied: (point: { x: number; y: number }, except: number) =>
            [w.units, w.buildings, w.trees, w.fights].some(objects =>
              objects.some(object => {
                const pos = nativePosition(w, object)
                return (
                  object.id !== except && (pos.x & 65535) === point.x && (pos.y & 65535) === point.y
                )
              })
            ),
        }
        const point = fightWaitingPosition(state, p, record)
        w.randomState = state.randomState
        return point
      },
      move: point => {
        moveObjectInCells(w.objectCells, p, { ...point, h: terrainPointHeight(w.land, point) })
        Object.assign(u, browserPosition(p))
      },
    })
    Object.assign(reservation, { flags4: record.flags4, reactionTimer: record.reactionTimer })
    if (result === 'join') {
      const opponent = w.units.find(
        unit => members.includes(unit.id) && unit.team !== u.team && unit.hp > 0
      )
      if (opponent) joinBattle(w, u, opponent)
      if (!u.fight) {
        p.substate = 7
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
      }
    } else restart ||= result === 'restart'
  } else if ([4, 5].includes(p.substate) && building) {
    const pose = buildingPose(building)
    restart =
      attackCombatPlan(
        p,
        {
          id: building.id,
          class: building.preparation ? 9 : 2,
          tribe: nativePersonTribe(building),
          related: 0,
        },
        {
          animation: motion.animation,
          approach: () =>
            approachCombatPlan(w, p, {
              ...motion,
              inside: () => buildingInsidePoint(pose),
              outside: () => buildingOutsidePoint(pose),
            }),
          buildingAt: point => buildingAt(point).id,
          destroy: () => {
            building.hp = 0
            syncLandscapeObjects(w)
          },
        }
      ) === 'restart' || restart
  } else restart = true
  if (restart) {
    p.substate = 0
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  return visit.complete
}

function attackBuilding(w: World, u: Unit, p: LivePerson, b: Building) {
  const state = ensureBuildingDamage(b)
  const target = {
    ...state,
    ...buildingPose(b),
    ...nativePosition(w, b),
    class: 2,
    tribe: b.team === 'blue' ? 0 : 1,
  }
  const context = {
    randomState: w.randomState,
    levelFlags2: w.levelFlags2,
    playerTribe: w.manaWorld.playerTribe,
    attackAlert: w.attackAlert,
    attackCell: w.attackCell,
    tribes: w.manaTribes.map(t => ({ flags: t.flags2 })),
  }
  const damage = target.damage,
    invisible = !!u.invisibility
  const result = attackCombatBuilding(context, p, target, {
    ...combatMotion(w, u, p),
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
    sound: cue => sound(w, cue, u, u.id),
  })
  if (target.damage !== damage) b.attackTaskMember = u.id
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
  if (invisible && !(p.flags4 & 0x1000)) setUnitInvisibility(w, u, 0)
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.fighting = p.animationMode === 46 || p.animationMode === 53
  return result
}
