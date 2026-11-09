import { liveBuildingShape } from './live-building-shapes.ts'
import {
  buildingFirePoints,
  buildingFootprintCells,
  buildingModel,
  buildingPose,
  buildingSabotagePoint,
} from './building-shapes.ts'
import { joinBattle } from './combat-runtime.ts'
import { createFire, effect, sound } from './world-effects.ts'
import { cancelLiveResting } from './live-resting.ts'
import {
  browserPosition,
  nativePosition,
  ensureBuildingDamage,
  syncLandscapeObjects,
  setUnitInvisibility,
  type World,
  type Unit,
  type Building,
} from './model.ts'
import { teamForTribe, tribeForTeam, type Team } from './world-types.ts'
import {
  createLivePerson,
  moveLivePerson,
  setLivePersonAnimation,
  registerLivePerson,
  buildingFirePeople,
  leaveLiveBuilding,
  collisionWorld,
  changeLivePersonState,
  type LivePerson,
} from './live-people.ts'
import { vehicleReady } from './vehicle-routing.ts'
import { leaveLiveVehicle, stepLiveVehicle, vehicleExit } from './live-vehicles.ts'
import { restingCellCollision, terrainSupportsPerson } from './person-collision.ts'
import {
  trackExplicitCombatTarget,
  selectExplicitCombatTarget,
  explicitCombatCommandResult,
  pauseExplicitCombatTarget,
} from './combat-explicit-target.ts'
import { setPersonAnchor } from './person-order-update.ts'
import { clearLivePath, replanLivePath, stepLiveRoute } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import {
  personAnimationObject,
  recoverPersonMovement,
  setPersonAnimationRow,
  stopPersonMovement,
} from './person-state.ts'
import { preparePersonTurn, stepPersonReaction } from './person-update.ts'
import { attackCombatBuilding } from './combat-building.ts'
import {
  startLiveOrders,
  cancelLiveOrder,
  stepLiveOrderQueue,
  adoptLiveOrders,
  releaseShamanGuard,
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
  combatWorld,
  allocateLiveCombatResponse,
  combatPerson,
  nativePersonModel,
  nativePersonTribe,
  selectLiveCombatTarget,
  selectLiveFirewarriorTarget,
} from './live-combat.ts'
import { eligibleCombatPerson } from './combat-targets.ts'
import { availableFightSlot, releaseAttackReservation } from './combat-targets.ts'
import { fightWaitingPosition } from './melee-placement.ts'
import { engagementRange } from './melee-engagement.ts'
import { buildingInsidePoint, buildingOutsidePoint } from './building-shapes.ts'
import { terrainCellHeightRange, terrainPointHeight } from './native-terrain.ts'
import { moveObjectInCells, objectsInCell } from './object-cells.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }
import {
  allocatePersonOrder,
  attachPersonOrder,
  clearPersonOrders,
  currentPersonOrder,
  type OrderEffects,
  type PersonOrder,
  prepareCellOrder,
} from './person-orders.ts'
import { buildingAdmission } from './live-building-entry.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import { igniteBuilding } from './building-damage.ts'
import { reconcileWorldHutSmoke } from './hut-smoke-runtime.ts'
import { random, nativeAngle, movePosition, short } from './native-math.ts'
import { firewarriorReady, launchFirewarrior } from './firewarrior.ts'

const unsupported = (): never => {
  throw new Error('Unported building attack order consumer')
}
const orderEffects = (w: World): OrderEffects => ({
  prepare: unsupported,
  stopWork: person => releaseLiveAttackReservation(w, person.workTarget),
  releaseSpell: person => releaseShamanGuard(w, person as LivePerson),
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
    b => b.id === id && b.hp > 0 && b.progress === 1 && b.team !== teamForTribe(p.tribe)
  )
}

export function cancelLiveBuildingAttack(w: World, u: Unit, retainPerson = false) {
  const p = u.native ?? u.fight?.motion ?? u.flight
  const model = p && currentPersonOrder(w.buildingOrders, p)?.model
  if (!p || ![11, 15, 19, 21].includes(model ?? 0)) return
  // 0x4364d0 releases the queue on the same person; vehicle departure is separate.
  const seated =
    model === 19 &&
    u.hp > 0 &&
    u.native === p &&
    w.objectCells.objects.get(p.id) === p &&
    w.vehicles.some(v => v.id === p.vehicle && v.active && v.passengers.includes(p.id))
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
  if (!retainPerson && !seated && u.native === p) u.native = null
  u.fighting = false
}

function spyDetected(w: World, p: LivePerson) {
  const target = p.disguise >>> 6,
    px = (p.x & 65535) >> 9,
    py = (p.y & 65535) >> 9,
    near = (a: number, b: number) => Math.abs(((a - b + 64) & 127) - 64) <= 1
  return w.units.some(u => {
    if (u.hp <= 0 || u.inside !== null || tribeForTeam(u.team) !== target) return false
    const other = nativePosition(w, u)
    return near((other.x & 65535) >> 9, px) && near((other.y & 65535) >> 9, py)
  })
}

function revealSpy(p: LivePerson) {
  p.disguise = (p.tribe << 6) & 255
}

function igniteSabotagedBuilding(w: World, b: Building, tribe: number) {
  igniteBuilding(ensureBuildingDamage(b), tribe, () => {
    b.burn = { remaining: 127, soundPlaying: false }
    const ignitePeople = buildingFirePeople(w)
    for (const point of buildingFirePoints(buildingPose(b))) {
      createFire(w, browserPosition(point), {
        size: point.size,
        light: point.light,
        snap: false,
        smoke: true,
        turns: 135,
        suppressEmbers: true,
      })
      b.burn.soundPlaying = true
      ignitePeople(point, tribeForTeam(b.team))
    }
    reconcileWorldHutSmoke(w, b)
  })
}

function stepSpySabotage(w: World, u: Unit, p: LivePerson, order: PersonOrder) {
  const cell = ((order.b & 65535) >> 9) * 128 + ((order.a & 65535) >> 9),
    id = w.land.buildingIds[cell] & 1023,
    b = w.buildings.find(
      candidate =>
        candidate.id === id &&
        candidate.hp > 0 &&
        candidate.progress === 1 &&
        candidate.team !== teamForTribe(p.tribe)
    )
  if (!b) return 1
  u.target = b.id
  if (p.substate === 0) {
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      recoverPersonMovement(w, p, (_, object) => setLivePersonAnimation(w, p, object))
      replanLivePath(w, u, p, buildingSabotagePoint(buildingPose(b)))
      if (p.flags4 & 0x10000000) {
        p.flags4 = (p.flags4 & ~0x10000000) >>> 0
        replanLivePath(w, u, p, buildingOutsidePoint(buildingPose(b)))
      }
    }
    // Native compares sign-extended fields; this subtraction does not wrap.
    const dx = ((p.goalX << 16) >> 16) - ((p.x << 16) >> 16),
      dy = ((p.goalY << 16) >> 16) - ((p.y << 16) >> 16)
    if (Math.abs(dx) > 11 || Math.abs(dy) > 11) return 0
    p.substate = 1
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  } else if (p.substate === 1) {
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      stopPersonMovement(p, (_, object) => setLivePersonAnimation(w, p, object))
      p.timer = 10
    }
    if (spyDetected(w, p)) revealSpy(p)
    if (--p.timer < 1) {
      p.substate = 2
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  } else if (p.substate === 2) {
    if (p.flags2 & 0x40000000) {
      // 00439fb5: animation and 0040a980 facing belong to this next visit.
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      const inside = buildingInsidePoint(buildingPose(b)),
        angle = nativeAngle(short(inside.x - p.x), -short(inside.y - p.y))
      p.heading = angle
      p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
      releasePersonRoute(w.motionRoutes, p)
      clearLivePath(w, u)
      p.turnAngle = angle
      p.flags2 = (p.flags2 | 0x1080) >>> 0
      setLivePersonAnimation(w, p, 0x65)
      p.f2 = 0
      p.f1 = 1
      p.timer =
        ((rules.animationDescriptors[p.draw]?.step ?? 0) + 1) * sprites.frameCounts[p.object]
    }
    if (spyDetected(w, p)) revealSpy(p)
    if (--p.timer < 1) {
      effect(w, 'hit', u)
      sound(w, 0x36, u, u.id)
      p.substate = 3
      p.timer = 8
    }
  } else if (p.substate === 3) {
    if (--p.timer < 1) {
      igniteSabotagedBuilding(w, b, p.tribe)
      p.substate = 4
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  } else {
    // 00439d30: discovery belongs to the next aftermath entry, not ignition.
    // Existing phase4 checkpoints without the entry bit must not replay it.
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      p.timer = 24
      const targetTribe = tribeForTeam(b.team)
      if (
        w.manaTribes[p.tribe].playerType !== 1 &&
        random(w) % 100 < (w.campaignAIs[targetTribe]?.attributes[40] ?? 0) &&
        !(w.land.landFlags & 8)
      )
        revealSpy(p)
    }
    if (--p.timer < 1) return 1
  }
  return 0
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
  let people: { unit: Unit; person: LivePerson & { class: 1; group: number } }[] = [
    { unit: u, person: source },
  ]
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
  const id = allocateLiveCombatResponse(
    w,
    u,
    source,
    peers,
    orderEffects(w),
    target => !u.cooldown && (!target || firewarriorReady(w, u, target))
  )
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

function buildingCounterattackCells(w: World, b: Building, radius: number) {
  const id = startIndexedSearch(w.indexedSearch, 2, 0, 0, radius)
  if (!id) return null
  const center = nativePosition(w, b),
    cx = (center.x >>> 8) & 254,
    cy = (center.y >>> 8) & 254,
    cells: number[] = []
  for (
    let offset = nextIndexedSearch(w.indexedSearch, id);
    offset;
    offset = nextIndexedSearch(w.indexedSearch, id)
  ) {
    const x = (cx + offset.x * 2) & 254,
      y = (cy + offset.y * 2) & 254
    cells.push((y >> 1) * 128 + (x >> 1))
  }
  endIndexedSearch(w.indexedSearch, id)
  return cells
}

// 0x40bce0/0x40bd20: occupied guard towers order nearby tribe defenders
// to counterattack only after their area scan detects a hostile person.
export function buildingCounterattack(w: World, team: Team) {
  const tribe = tribeForTeam(team)
  for (const b of w.buildings) {
    if (b.team !== team || b.hp <= 0 || buildingModel(b) !== 4) continue
    const admission = buildingAdmission(w, b),
      first = w.units.find(u => u.id === admission.occupants[0] && u.hp > 0)
    if (!admission.inside || !first || nativePersonModel(first) !== 3) continue
    const source = combatPerson(first),
      radius = Math.max(0, Math.min(31, 7 + ((nativePosition(w, b).h * 7 * 32) >> 16))),
      scan = buildingCounterattackCells(w, b, radius)
    if (!scan) continue
    const { world } = combatWorld(w, source, 255)
    if (
      !scan.some(
        cell =>
          !(rules.terrainCategoryFlags[w.land.categories[cell] & 15] & 2) &&
          [...world.cellObjects(cell)].some(
            target => target.class === 1 && eligibleCombatPerson(world, source, target)
          )
      )
    )
      continue

    const marked = new Set<number>()
    for (const cell of scan) {
      for (const target of world.cellObjects(cell))
        if (target.class === 1 && target.tribe === tribe && target.id !== first.id)
          marked.add(target.id)
      const buildingId = w.land.buildingIds[cell] & 1023,
        occupied = w.buildings.find(
          candidate =>
            (candidate.id & 1023) === buildingId && candidate.team === team && candidate.hp > 0
        )
      if (
        w.land.flags[cell] & 0x200 &&
        occupied &&
        rules.buildingFlags[buildingModel(occupied)] & 0x400
      )
        for (const id of buildingAdmission(w, occupied).occupants) if (id) marked.add(id)
    }

    let orderId = 0
    for (const u of w.units) {
      if (u.team !== team || !marked.has(u.id)) continue
      let p = u.native ?? u.entry?.person ?? u.builder?.person
      if (!p) {
        p = createLivePerson(w, u)
        u.native = p
      }
      if (!(rules.personStateFlags[p.state] & 0x1000)) continue
      const current = currentPersonOrder(w.buildingOrders, p)
      if (
        p.state === 10 &&
        current &&
        !(current.flags & 1) &&
        rules.personCommands[current.model].flags & 0x80
      )
        continue
      if (!orderId) {
        orderId = allocatePersonOrder(w.buildingOrders)
        if (!orderId) break
        const point = nativePosition(w, b),
          q = (radius * 2 - 4) & 255
        prepareCellOrder(
          w.buildingOrders.records[orderId],
          { a: ((point.x >>> 8) & 254) | (point.y & 0xfe00), b: q | (q << 8) },
          0x32,
          w.land.categories,
          19
        )
      }
      p.flags2 = (p.flags2 | 0x10) >>> 0
      p.flags3 = (p.flags3 & ~0x02000000) >>> 0
      attachPersonOrder(w.buildingOrders, p, orderId, -1, orderEffects(w))
      p.flags3 = (p.flags3 | 0x02000000) >>> 0
    }
  }
}

// Manual command 19 and automatic command 21 share the native area controller.
export function stepLiveBuildingAttack(w: World, u: Unit, b?: Building) {
  if (
    !u.native ||
    ![11, 15, 19, 21].includes(currentPersonOrder(w.buildingOrders, u.native)?.model ?? 0)
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
  if (p.vehicle && current?.model === 19) {
    if (!stepLiveVehicle(w, p)) return
    stepLiveRoute(w, u)
  } else moveLivePerson(w, u, p)
  if (p.state !== 10) return
  const next = stepLiveOrderQueue(w, u, p, {
    11: order => Number(stepGuardOrder(w, u, p, order)),
    15: order => stepSpySabotage(w, u, p, order),
    19: order => Number(stepAreaAttack(w, u, p, order)),
  })
  if (next) {
    u.target = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  if (!u.fight) adoptLiveOrders(w, u, p)
  if (![11, 15, 19, 21].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0))
    u.target = null
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

const explicitTargetCell = (point: { x: number; y: number }) =>
  ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)

// Bounded 0x51fce0/0x51a2a0 transport handoff. Grounded command 28 retains
// its existing controller; ranged/preacher and later airborne substates stay separate.
export function stepLiveAboardPersonAttack(w: World, u: Unit) {
  const p = u.native,
    order = p && currentPersonOrder(w.buildingOrders, p)
  if (!p?.vehicle || order?.model !== 28 || p.model === 4 || p.model === 6) return false
  if (p.substate !== 0 && p.substate !== 12)
    throw new Error('Unported airborne explicit-target phase')
  registerLivePerson(w, p)
  p.counter = (p.counter + 1) & 255
  const motion = combatMotion(w, u, p)
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize: () => changeLivePersonState(w, u),
    animation: () => {
      const object = personAnimationObject(p)
      if (object !== -1) setLivePersonAnimation(w, p, object)
    },
    destination: motion.destination,
  })
  stepPersonReaction(p)
  if (!stepLiveVehicle(w, p)) return true
  stepLiveRoute(w, u)
  if (p.state !== 10) return true
  const next = stepLiveOrderQueue(w, u, p, {
    28: command => {
      const owner = w.units.find(candidate => candidate.id === command.a && candidate.hp > 0)
      if (!owner) return 1
      const target = combatPerson(owner)
      if (target.flags2 & 1) return 1
      const { world } = combatWorld(w, target, 128),
        outside = (id: number) => buildingOutsidePoint(liveBuildingShape(w, id)!),
        search = {
          randomState: w.randomState,
          playerTribe: w.manaWorld.playerTribe,
          alert: w.musicActivity,
          marches: w.combatMarches,
        }
      let selected: ReturnType<typeof selectExplicitCombatTarget>
      const visit = prepareCombatOrderVisit(search, p, command, {
        ...motion,
        range: () => engagementRange(p, command, false),
        approachPoint: current =>
          findCombatApproachPoint(p, current, {
            collision: collisionWorld(w),
            search: w.indexedSearch,
            landLimit: rules.pathLandLimit,
            heightRange: key => terrainCellHeightRange(w.land, key),
            outside,
          }),
        trackTarget: () =>
          trackExplicitCombatTarget(p, target, {
            ...motion,
            outside: other => {
              const index = explicitTargetCell(other)
              return w.land.flags[index] & 512
                ? outside(w.land.buildingIds[index] & 1023)
                : undefined
            },
            supportsTarget: other =>
              !!terrainSupportsPerson(w.land.categories[explicitTargetCell(other)], other),
            targetOnWater: other =>
              !!(rules.terrainCategoryFlags[w.land.categories[explicitTargetCell(other)] & 15] & 2),
          }),
        withinArea: current =>
          withinCombatArea(p, current, target, {
            range: () => engagementRange(p, current, false),
            vehicleReady: () => {
              const vehicle = w.vehicles.find(v => v.id === p.vehicle && v.active)
              return !!vehicle && vehicleReady(w.land, vehicle)
            },
          }),
        select: current => {
          selected = selectExplicitCombatTarget(world.objects, p, current)
          return selected && { id: selected.target.id, type: selected.type }
        },
        prepareTarget: current =>
          beginCombatPursuit(
            search,
            p,
            current,
            {
              ...selected!.target,
              vehicle: selected!.target.class === 1 ? selected!.target.vehicle : 0,
            },
            {
              ...motion,
              canFire: unsupported,
              commandPosition: () => target,
              vehicleDestination: point => leaveLiveAttackVehicle(w, p, point),
            }
          ),
      })
      if (p.substate === 12) pauseExplicitCombatTarget(search, p, target, motion)
      w.randomState = search.randomState
      w.musicActivity = search.alert
      // 0x51fce0 only checks target transport after a nonzero shared-body result.
      return explicitCombatCommandResult(visit.complete, target.vehicle)
    },
  })
  if (next) {
    u.target = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  if (!u.fight) adoptLiveOrders(w, u, p)
  return true // No second grounded controller visit on the departure turn.
}

// 0x435550 mode 1, called by 0x520300. The caller ignores its native return
// byte; do not extend this forced-departure path to mode 0's return contract.
export function leaveLiveAttackVehicle(w: World, p: LivePerson, to: { x: number; y: number }) {
  const vehicle = w.vehicles.find(candidate => candidate.id === p.vehicle && candidate.active)
  if (!vehicle) return
  let exit = { x: p.x, y: p.y }
  movePosition(exit, nativeAngle(short(to.x - p.x), -short(to.y - p.y)), 768)
  const cell = (exit.y >> 9) * 128 + (exit.x >> 9)
  if (
    restingCellCollision(
      { flags: w.land.flags[cell], category: w.land.categories[cell] },
      w.land.walkMasks[w.pathfinding.state.walkMask],
      exit
    )
  )
    exit = vehicleExit(w, vehicle).point
  // Existing departure adapter retains its simplified ground physics/RNG.
  leaveLiveVehicle(w, vehicle, p, exit)
  const index = (exit.y >> 9) * 128 + (exit.x >> 9),
    shape =
      w.land.flags[index] & 512 ? liveBuildingShape(w, w.land.buildingIds[index] & 1023) : undefined
  setPersonAnchor(p, shape ? buildingOutsidePoint(shape) : exit)
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
  const outside = (id: number) => buildingOutsidePoint(liveBuildingShape(w, id)!)
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
      withinCombatArea(p, command, undefined, {
        range,
        vehicleReady: () => {
          const vehicle = w.vehicles.find(v => v.id === p.vehicle && v.active)
          return !!vehicle && vehicleReady(w.land, vehicle)
        },
      }),
    select: (command: PersonOrder, vehicleOnly: boolean) => {
      if (vehicleOnly || (p.vehicle && command.model !== 19)) unsupported()
      selected ??=
        p.model === 6 && command.model === 21
          ? selectLiveFirewarriorTarget(w, u, command, target => firewarriorReady(w, u, target))
          : selectLiveCombatTarget(w, u, command)
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
          canFire: () => {
            if (p.model !== 6) return unsupported()
            const owner = selected?.owner
            return !!owner && !('members' in owner) && firewarriorReady(w, u, owner)
          },
          commandPosition: area => ({
            x: ((area.a & 254) + 1) * 256,
            y: (((area.a >>> 8) & 254) + 1) * 256,
          }),
          vehicleDestination: point => {
            if (!p.vehicle) return
            if (command.model !== 19) unsupported()
            leaveLiveAttackVehicle(w, p, point)
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
  if ([10, 11].includes(p.substate)) {
    const fireTarget = p.substate === 11 ? building : target
    if (!fireTarget) return true
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      if (firewarriorReady(w, u, fireTarget)) {
        p.assignment |= 0x10
        p.animationMode = u.cooldown ? 45 : 44
      } else restart = true
    }
    if (!restart) {
      if (p.animationMode === 40) {
        if (p.assignment & 0x10) {
          p.assignment &= ~0x10
          setPersonAnimationRow(p, 15, motion.animation)
          Object.assign(p, { f1: 1, f2: 0, timer: 6 })
          p.renderFlags |= 2
        }
        if (p.timer) p.timer--
        if (
          !p.stateObject ||
          !w.effects.some(effect => effect.id === p.stateObject) ||
          p.timer < 1
        ) {
          Object.assign(p, { animationMode: 0, stateObject: 0, timer: 0 })
          u.fighting = false
          return true
        }
      } else if (p.animationMode === 44) {
        p.assignment |= 0x200
        if (p.assignment & 0x10) {
          p.assignment &= ~0x10
          u.target = fireTarget.id
          u.heading = Math.atan2(fireTarget.x - u.x, fireTarget.z - u.z)
          u.fighting = true
          setPersonAnimationRow(p, 15, motion.animation)
          Object.assign(p, {
            f1: 1,
            f2: 0,
            timer: (rules.animationDescriptors[p.draw].step + 1) * sprites.frameCounts[p.object],
            stateObject: launchFirewarrior(w, u, fireTarget),
          })
        }
        if (!w.effects.some(shot => shot.id === p.stateObject)) p.stateObject = 0
        if (p.timer && --p.timer === 0) {
          p.animationMode = 40
          p.assignment |= 0x10
        }
      } else if (p.animationMode === 45) {
        if (p.assignment & 0x10) {
          p.assignment &= ~0x10
          p.timer = 32
        }
        if (!u.cooldown || --p.timer < 1) {
          Object.assign(p, { animationMode: 0, timer: 0 })
          return true
        }
      }
      return false
    }
  }
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

// 0x51e300: damaged structures inspect the linked people on their plan footprint;
// completed structures use their resident count. Hidden residents are not plan defenders.
export function liveBuildingHasDefenders(w: World, b: Building, attackerTribe: number) {
  if (b.kind === 'prison') return false
  if (ensureBuildingDamage(b).state !== 1) return buildingAdmission(w, b).inside > 0
  for (const index of buildingFootprintCells(buildingPose(b))) {
    const cell = ((index >> 7) << 9) | ((index & 127) << 1)
    for (const object of objectsInCell(w.objectCells, cell)) {
      const person = object as LivePerson,
        tribe = (person.tribe << 24) >> 24
      if (person.class === 1 && tribe !== -1 && tribe !== (attackerTribe & 255)) return true
    }
  }
  return false
}

function attackBuilding(w: World, u: Unit, p: LivePerson, b: Building) {
  const state = ensureBuildingDamage(b)
  const target = {
    ...state,
    ...buildingPose(b),
    ...nativePosition(w, b),
    class: 2,
    tribe: tribeForTeam(b.team),
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
    hasDefenders: () => liveBuildingHasDefenders(w, b, p.tribe),
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
