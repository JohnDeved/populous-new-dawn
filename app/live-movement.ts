import { buildingPose } from './building-shapes.ts'
import { releaseTasks } from './world-tasks.ts'
import {
  buildingModel,
  browserPosition,
  nativePosition,
  addUnit,
  population,
  supportsFollower,
  type World,
  type Unit,
} from './model.ts'
import {
  createLivePerson,
  leaveLiveBuilding,
  changeLivePersonState,
  registerLivePerson,
  setLivePersonAnimation,
  stepLivePhysics,
  type LivePerson,
} from './live-people.ts'
import { initializeBuildingPerson } from './live-building-entry.ts'
import { stepLiveWorship } from './live-worship.ts'
import {
  liveBuildingAttackTarget,
  releaseLiveAttackReservation,
  startLiveCombatResponse,
} from './live-building-combat.ts'
import { clearLivePath, stepLiveRoute, replanLivePath } from './live-pathfinding.ts'
import { releasePersonRoute } from './person-routes.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { objectsInCell, removeObjectFromCell } from './object-cells.ts'
import { nativeAngle, random } from './native-math.ts'
import {
  startPersonOrders,
  configurePersonOrder,
  type OrderStartEffects,
} from './person-order-start.ts'
import { stepPersonOrders, type OrderUpdateEffects } from './person-order-update.ts'
import { stepConstructionOrder } from './construction-order.ts'
import { assignBuilder, BuilderTask } from './building-workers.ts'
import {
  recoverPersonMovement,
  defaultPersonState,
  randomPersonSpeed,
  resetPersonMotion,
  stopPersonMovement,
} from './person-state.ts'
import {
  currentPersonOrder,
  emptyPersonOrder,
  allocatePersonOrder,
  attachPersonOrder,
  appendPersonOrders,
  clearPersonOrders,
  commitPersonOrders,
  removePersonOrder,
  advancePersonOrder,
  queuePersonOrder,
  stepMovementOrder,
  prepareMovementOrder,
  prepareBuildingEntryOrder,
  prepareCellOrder,
  type OrderEffects,
  type PersonOrder,
} from './person-orders.ts'
import {
  joinMarchingFormation,
  stepMarchingFormation,
  type MarchingFormation,
} from './marching-formations.ts'
import rules from './original-rules.json' with { type: 'json' }
import constants from './original-constants.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }
import { spyDisguisedFrom } from './computer-spells.ts'
import { teamForTribe, tribeForTeam } from './world-types.ts'
import {
  boardLiveVehicle,
  leaveLiveVehicle,
  liveVehicleCellObjects,
  liveVehicles,
  stepLiveVehicle,
} from './live-vehicles.ts'
import { vehicleCanDisembark, vehicleReady } from './vehicle-routing.ts'
import {
  cancelConversionVictim,
  inPreachingRange,
  initializeConversionVictim,
  stepConversionVictim,
  stepPreachingOrder,
} from './preacher-conversion.ts'

const unsupported = (): never => {
  throw new Error('Unported live movement order consumer')
}
const short = (n: number) => (n << 16) >> 16
export type LiveFormation = MarchingFormation & { tribe: number }
function outsideBuilding(w: World, point: { x: number; y: number }) {
  const cell = (point.y >> 9) * 128 + (point.x >> 9)
  const building =
    w.land.flags[cell] & 512
      ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
      : undefined
  return building ? buildingOutsidePoint(buildingPose(building)) : point
}
const personSource = (u: Unit) =>
  u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person

export function releaseShamanGuard(w: World, person: { tribe: number }) {
  const tribe = w.manaTribes[person.tribe]
  tribe.shamanGuardChanged = 1
  tribe.shamanGuards = Math.max(0, short(tribe.shamanGuards - 1))
  if (tribe.shamanGuards) return
  const shaman = w.units.find(
      u => u.hp > 0 && u.kind === 'shaman' && !u.ghost && tribeForTeam(u.team) === person.tribe
    ),
    source = shaman && personSource(shaman)
  if (source?.speed) source.speed = randomPersonSpeed(w, source)
}
export const orderEffects = (w: World): OrderEffects => ({
  prepare: unsupported,
  stopWork: person => releaseLiveAttackReservation(w, person.workTarget),
  releaseSpell: person => releaseShamanGuard(w, person as LivePerson),
  deleteObject: unsupported,
  releaseFight: p =>
    recoverPersonMovement(w, p as LivePerson, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    ),
})

function orderContext(w: World, p: LivePerson, rng: { randomState: number }) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (
    !order ||
    ![3, 6, 7, 8, 10, 11, 15, 16, 17, 19, 21, 22, 25, 27, 28, 30, 31, 32, 33].includes(
      order.model
    )
  )
    unsupported()
  const state = {
    randomState: rng.randomState,
    instantFacing: false,
    levelFlags: w.manaWorld.gameFlags,
    orders: w.buildingOrders,
    tribes: w.manaTribes.map(t => ({
      x: 0,
      y: 0,
      angle: 0,
      selectedCount: 0,
      flags: t.flags2,
      vehicleMode: 0,
    })),
  }
  const effects: OrderStartEffects = {
    setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
    setDestination: (person, x, y) => {
      const unit = w.units.find(u => u.id === person.id)!
      replanLivePath(w, unit, person as LivePerson, { x, y })
    },
    commandPosition: unsupported,
    allowVehicleOrder: () => true,
    initializeCommand: () => {
      if (order!.model === 6 || order!.model === 7) return
      if (order!.model === 30) {
        const tribe = w.manaTribes[p.tribe]
        tribe.shamanGuards = short(tribe.shamanGuards + 1)
        tribe.shamanGuardChanged = 1
        return
      }
      if (order!.model === 10) {
        const b = w.buildings.find(building => building.id === order!.a)
        if (b) {
          const point = buildingOutsidePoint(buildingPose(b))
          order!.b = ((point.x >>> 8) & 254) | (point.y & 0xfe00)
        }
        return
      }
      // Command 19's specialized initialization only changes the radius for model 19.
      const b = liveBuildingAttackTarget(w, p)
      if (b && buildingModel(b) === 19) order!.flags |= 4
    },
    adjacentBuilding: (person, model) => {
      const cell = (person.y >> 9) * 128 + (person.x >> 9)
      if (!(w.land.flags[cell] & 512)) return 0
      const id = w.land.buildingIds[cell] & 1023
      return w.buildings.some(b => b.id === id && (!model || buildingModel(b) === model)) ? id : 0
    },
    canStayForTarget: unsupported,
    leaveBuilding: person => {
      leaveLiveBuilding(w, w.units.find(u => u.id === person.id)!)
    },
    resetVehicleMovement: id => {
      const vehicle = w.vehicles.find(v => v.id === id)
      if (vehicle) vehicle.speed = -1
    },
    leaveSelectedVehicle: () => {},
    initializeState: person => {
      w.randomState = state.randomState
      const unit = w.units.find(u => u.id === person.id)!
      if (unit.entry?.person === person) initializeBuildingPerson(w, person as LivePerson)
      else changeLivePersonState(w, unit, undefined, person as LivePerson)
      state.randomState = w.randomState
    },
  }
  return { state, effects }
}

export function startLiveOrders(w: World, p: LivePerson, rng: { randomState: number }) {
  const { state, effects } = orderContext(w, p, rng)
  startPersonOrders(state, p, effects)
  rng.randomState = state.randomState
}

// Keep the person and shared queue intact when a different live controller takes over.
export function adoptLiveOrders(w: World, u: Unit, p: LivePerson) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (order?.model === 6 && u.builder) {
    u.builder.person = p
    u.native = null
    u.work = order.a
  } else if (order && [8, 10].includes(order.model)) {
    u.native = null
    u.entry ??= { person: p, orders: w.buildingOrders }
    u.work = order.a
  } else {
    if (order?.model === 27) u.work = order.a
    else if (order?.model === 33) {
      u.work = order.a
      u.vault = {
        head: p.workTarget || order.a,
        phase: p.commandPhase,
        entering: !!(p.flags2 & 0x40000000),
        remaining: p.timer,
      }
    } else if (u.entry) u.work = null
    if (order?.model !== 33) u.vault = null
    u.entry = undefined
    u.native = p
  }
}

// Player clicks append to the same eight-slot queues used by simulation.
export function appendLiveOrders(w: World, units: Unit[], command: PersonOrder, replace: boolean) {
  let count = 0
  const preachers = replace
    ? units.flatMap(u => {
        const p = u.native ?? u.entry?.person ?? u.builder?.person
        return p && [17, 31, 32].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0)
          ? [p]
          : []
      })
    : []
  const accepted = appendPersonOrders(
    w.buildingOrders,
    command,
    units.map(u => {
      const p = u.native ?? u.entry?.person ?? u.builder?.person ?? createLivePerson(w, u)
      if (!u.entry) u.native = p
      p.selectionFlags |= 128
      registerLivePerson(w, p)
      return p
    }),
    {
      ...orderEffects(w),
      prepare: (order, model, x, y, commandFlags = 0) => {
        if (model === 10 || model === 11 || model === 19) {
          prepareCellOrder(order, { a: x, b: y }, commandFlags, w.land.categories, model)
          return
        }
        if (model === 8) {
          prepareBuildingEntryOrder(
            order,
            x,
            y,
            commandFlags,
            !!((w.buildings.find(b => b.id === x)?.admission?.activity ?? 0) & 0x8000)
          )
          return
        }
        if (
          model === 6 ||
          model === 7 ||
          model === 15 ||
          model === 16 ||
          model === 17 ||
          model === 27 ||
          model === 28 ||
          model === 30 ||
          model === 33
        ) {
          if (order.model !== model || order.a !== x || order.b !== y)
            Object.assign(order, {
              model,
              a: x,
              b: y,
              flags: order.flags | commandFlags,
            })
          return
        }
        if (model !== 3) unsupported()
        prepareMovementOrder(order, { x, y }, commandFlags, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!))
        )
      },
      acknowledge: (_, counts) => {
        count = counts.reduce((a, b) => a + b, 0)
      },
      special: unsupported,
    },
    replace
  )
  for (const p of accepted ? preachers : [])
    if (![17, 31, 32].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0))
      releasePreacherVictims(w, p, p.commandAux || 3)
  for (const u of units) {
    const p = (u.native ?? u.entry?.person ?? u.builder?.person)!
    if (!accepted && preachers.includes(p)) continue
    // 0x43b670 only replaces and attaches command 28; keep direct-target motion intact.
    if (command.model === 28) {
      adoptLiveOrders(w, u, p)
      continue
    }
    if (p.state === 25 || p.state === 29) continue
    // Native player input restarts the active order even when appending a later one.
    resetPersonMotion(p)
    p.previousState = p.state === 14 ? 14 : 0
    p.state = defaultPersonState(p, w.manaWorld.gameFlags)
    if (u.entry) initializeBuildingPerson(w, p)
    else changeLivePersonState(w, u)
    adoptLiveOrders(w, u, p)
    if (accepted && command.model === 17) {
      releasePersonRoute(w.motionRoutes, p)
      clearLivePath(w, u)
      Object.assign(p, {
        anchorX: p.x,
        anchorY: p.y,
        goalX: p.x,
        goalY: p.y,
        speed: 0,
        substate: 0,
      })
    }
  }
  return { accepted, count }
}

// 0x4cedd0 commits movement and persistent guard as one native command group.
export function appendLiveGuardOrders(w: World, units: Unit[], marker: number, secondary = -1) {
  const group = {
    records: Array.from({ length: 8 }, emptyPersonOrder),
    count: 0,
    cursor: 0,
  }
  if (secondary === -1) queuePersonOrder(group, 3, 0, marker)
  queuePersonOrder(group, 11, 0x606, marker)
  if (secondary !== -1) queuePersonOrder(group, 11, 0x606, secondary)
  const people = units.map(u => {
    const p = u.native ?? createLivePerson(w, u)
    u.native = p
    p.selectionFlags |= 128
    registerLivePerson(w, p)
    return p
  })
  return commitPersonOrders(w.buildingOrders, group, people, [-1, -1, -1], {
    ...orderEffects(w),
    prepare: (order, model, a, b, flags = 0) => {
      if (model === 3)
        prepareMovementOrder(order, { x: a, y: b }, flags, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(building => building.id === id)!))
        )
      else if (model === 11) prepareCellOrder(order, { a, b }, flags, w.land.categories, model)
      else unsupported()
    },
  })
}

export function movementOrder(w: World, to: { x: number; y: number }) {
  const id = allocatePersonOrder(w.buildingOrders)
  if (id)
    prepareMovementOrder(w.buildingOrders.records[id], to, 0, w.land, buildingId =>
      buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === buildingId)!))
    )
  return id
}

export function startLiveOrder(w: World, u: Unit, id: number) {
  const p = u.native ?? createLivePerson(w, u)
  u.native = p
  attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(w))
  registerLivePerson(w, p)
  changeLivePersonState(w, u, 10)
}

export function cancelLiveOrder(w: World, u: Unit) {
  const p = u.native ?? u.flight ?? u.fight?.motion ?? u.builder?.person
  const model = p && currentPersonOrder(w.buildingOrders, p)?.model
  if (!p || !model || ![3, 6, 7, 15, 16, 17, 22, 27, 28, 30, 31, 32, 33].includes(model))
    return
  if ([17, 31, 32].includes(model)) releasePreacherVictims(w, p, p.commandAux || 3)
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
}

const allied = (w: World, tribe: number, other: number) =>
  tribe === -1 || other === -1 || tribe === other || !!(w.outcome.alliances[tribe] & (1 << other))

function eligiblePreacherVictim(w: World, preacher: LivePerson, victim: LivePerson) {
  return (
    victim.id !== preacher.id &&
    victim.life > 0 &&
    !allied(w, preacher.tribe, victim.tribe) &&
    !!(rules.personModels[victim.model].flags & 32) &&
    !(rules.personStateFlags[victim.state] & 32) &&
    !(victim.flags2 & 0x100000) &&
    !(victim.flags4 & 8) &&
    !victim.vehicle &&
    !spyDisguisedFrom(victim, preacher.tribe)
  )
}

function acquirePreacherVictims(w: World, preacher: LivePerson, radius: number) {
  let count = 0,
    first: LivePerson | undefined
  // ponytail: the game caps tribes at 200 people; a direct scan avoids a second index.
  for (const u of w.units) {
    if (u.hp <= 0 || u.inside !== null || u.flight) continue
    const victim = u.native ?? u.entry?.person ?? u.fight?.motion ?? createLivePerson(w, u)
    if (!inPreachingRange(preacher, victim, radius)) continue
    if (victim.state !== 23) {
      if (!eligiblePreacherVictim(w, preacher, victim)) continue
      releaseTasks(w, u)
      u.native = victim
      const state = {
        randomState: w.randomState,
        loadFlags: w.manaWorld.loadFlags,
      }
      initializeConversionVictim(state, victim, preacher, () =>
        stopPersonMovement(victim, (person, object) =>
          setLivePersonAnimation(w, person as LivePerson, object)
        )
      )
      w.randomState = state.randomState
      registerLivePerson(w, victim)
      w.selected = w.selected.filter(id => id !== u.id)
    }
    if (victim.workTarget !== preacher.id) continue
    first ??= victim
    count++
  }
  preacher.statusFlags = count <= 4 ? preacher.statusFlags | 2 : preacher.statusFlags & ~2
  if (first && preacher.statusFlags & 2) {
    preacher.turnAngle = nativeAngle(
      ((first.x - preacher.x) << 16) >> 16,
      -(((first.y - preacher.y) << 16) >> 16)
    )
    preacher.flags2 = (preacher.flags2 | 0x1080) >>> 0
  }
  return count
}

function releasePreacherVictims(w: World, preacher: LivePerson, radius: number) {
  for (const u of w.units) {
    const victim = u.native
    if (
      !victim ||
      victim.state !== 23 ||
      victim.workTarget !== preacher.id ||
      allied(w, preacher.tribe, victim.tribe) ||
      [4, 7].includes(victim.model) ||
      !inPreachingRange(preacher, victim, radius)
    )
      continue
    changeLivePersonState(w, u, cancelConversionVictim(victim, w.manaWorld.gameFlags))
  }
}

function replaceConvertedVictim(w: World, u: Unit, preacher: LivePerson) {
  const victim = u.native!,
    oldId = u.id,
    team = teamForTribe(preacher.tribe),
    slot = w.units.indexOf(u)
  if (slot < 0) throw new Error('Missing converted victim')
  // alloc_unit initializes a person speed before conversion replaces it.
  random(w)
  const angle = (random(w) & 63) << 5
  let point = {
    x: (preacher.x + (Math.imul(rules.sine[(angle + 512) & 2047], 0x500) >> 16)) & 0xffff,
    y: (preacher.y + (Math.imul(rules.sine[angle], 0x500) >> 16)) & 0xffff,
  }
  point = outsideBuilding(w, point)
  point.x = (point.x & 0xfe00) + 0x100
  point.y = (point.y & 0xfe00) + 0x100
  releaseTasks(w, u)
  if (victim.flags2 & 0x20000) removeObjectFromCell(w.objectCells, victim)
  w.objectCells.objects.delete(oldId)
  w.selected = w.selected.filter(id => id !== oldId)
  victim.class = 0
  u.hp = 0
  const replacement = addUnit(w, team, u.kind, browserPosition(point))
  w.units[slot] = replacement
  w.units.pop()
  replacement.heading = Math.PI - (preacher.angle * Math.PI) / 1024
  replacement.native = createLivePerson(w, replacement)
  replacement.native.speed = randomPersonSpeed(w, replacement.native)
  replacement.native.flags4 = (replacement.native.flags4 | 0x40000) >>> 0
  replacement.native.flags3 = (replacement.native.flags3 | 0x1000000) >>> 0
  registerLivePerson(w, replacement.native)
}

export function stepLiveConversionVictim(w: World, u: Unit) {
  const victim = u.native!
  victim.counter = (victim.counter + 1) & 255
  const preacher =
      w.units.find(candidate => candidate.id === victim.workTarget && candidate.hp > 0)?.native ??
      undefined,
    state = {
      randomState: w.randomState,
      loadFlags: w.manaWorld.loadFlags,
      orders: w.buildingOrders,
      tribeFlags: w.manaTribes.map(t => t.flags2),
    },
    result = stepConversionVictim(state, victim, preacher)
  w.randomState = state.randomState
  if (result === 'cancel')
    changeLivePersonState(w, u, cancelConversionVictim(victim, w.manaWorld.gameFlags))
  else if (result === 'convert') {
    const team = teamForTribe(preacher!.tribe)
    if (population(w, team) <= 199 || w.manaTribes[victim.tribe].flags2 & 64)
      replaceConvertedVictim(w, u, preacher!)
  } else u.heading = Math.PI - (victim.turnAngle * Math.PI) / 1024
}

export function stepLivePreaching(w: World, u: Unit) {
  const p = u.native!
  stepLivePhysics(w, u, p)
  stepLiveRoute(w, u)
  if (p.state !== 10) return
  const order = currentPersonOrder(w.buildingOrders, p)
  if ((order?.flags ?? 0) & 1) releasePreacherVictims(w, p, p.commandAux || 3)
  const state = {
    randomState: w.randomState,
    loadFlags: w.manaWorld.loadFlags,
    orders: w.buildingOrders,
    tribeFlags: w.manaTribes.map(t => t.flags2),
  }
  const next = stepLiveOrderQueue(w, u, p, {
    17: command => {
      const result = stepPreachingOrder(state, p, command, {
        animate: object => setLivePersonAnimation(w, p, object),
        animationDuration: () =>
          (rules.animationDescriptors[p.draw].step + 1) * sprites.frameCounts[p.object],
        stop: () => {
          releasePersonRoute(w.motionRoutes, p)
          clearLivePath(w, u)
          stopPersonMovement(p, (person, object) =>
            setLivePersonAnimation(w, person as LivePerson, object)
          )
        },
        acquire: radius => {
          w.randomState = state.randomState
          const count = acquirePreacherVictims(w, p, radius)
          state.randomState = w.randomState
          return count
        },
        release: radius => releasePreacherVictims(w, p, radius),
      })
      w.randomState = state.randomState
      return result
    },
  })
  if (next) {
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  adoptLiveOrders(w, u, p)
  if (u.native === p) startLiveCombatResponse(w, u)
}

function join(w: World, p: LivePerson) {
  joinMarchingFormation(
    {
      search: w.indexedSearch,
      cellPeople: cell => objectsInCell(w.objectCells, cell) as Iterable<LivePerson>,
    },
    p,
    w.marching.filter(g => g.tribe === p.tribe),
    leader => {
      const group: LiveFormation = {
        id: w.nextId++,
        class: 10,
        model: 0,
        tribe: leader.tribe,
        x: leader.x,
        y: leader.y,
        heading: 0,
        destinationX: 0,
        destinationY: 0,
        shape: 0,
        speed: 0,
        timer: 0,
        shapeTimer: 0,
        count: 0,
        freeSlot: 0,
        members: Array(12).fill(0),
        offsets: Array.from({ length: 12 }, () => ({ x: 0, y: 0 })),
      }
      // Native allocation prepends the tribe list. Browser object allocation has no cap yet.
      w.marching.unshift(group)
      return group
    }
  )
}

// 0x43daa0. Command 30 follows one saved shaman identity until that target is
// gone or contained; proximity pauses pursuit but does not complete the order.
export function stepShamanGuard(
  p: Pick<
    LivePerson,
    'substate' | 'counter' | 'x' | 'y' | 'goalX' | 'goalY' | 'flags2' | 'assignment' | 'speed'
  >,
  target: { x: number; y: number } | null,
  effects: {
    recover: () => void
    destination: (point: { x: number; y: number }) => void
  }
) {
  if (!target) return 1
  if (!p.substate) {
    p.substate = 1
    p.flags2 = (p.flags2 | 0x2000000) >>> 0
    p.assignment &= ~8
    effects.recover()
    effects.destination(target)
    return 0
  }
  if (p.counter & 3) return 0
  p.flags2 = (p.flags2 | 0x2000000) >>> 0
  p.assignment &= ~8
  if (Math.abs(short(target.x - p.x)) < 824 && Math.abs(short(target.y - p.y)) < 824) {
    p.flags2 = (p.flags2 & ~0x2000000) >>> 0
    return 0
  }
  p.assignment |= 8
  if (Math.abs(short(target.x - p.goalX)) > 439 || Math.abs(short(target.y - p.goalY)) > 439)
    effects.destination(target)
  if (!p.speed) effects.recover()
  return 0
}

function shamanGuardTarget(w: World, order: PersonOrder) {
  const unit = w.units.find(u => u.id === order.a && u.hp > 0 && u.inside === null),
    person = unit && personSource(unit)
  if (!unit || (person && (!person.class || person.flags2 & 1))) return null
  return outsideBuilding(w, person ?? nativePosition(w, unit))
}

function stepLiveConstructionOrder(w: World, u: Unit, p: LivePerson, order: PersonOrder) {
  const building = w.buildings.find(b => b.id === order.a && b.hp > 0 && b.progress < 1)
  if (!building) return 1
  const target = (id: number) => {
    const b = w.buildings.find(building => building.id === id)
    // ponytail: browser buildings combine native display/plan IDs; split with object allocation.
    return (
      b && {
        id: b.id,
        class: 2,
        tribe: tribeForTeam(b.team),
        flags2: b.hp > 0 ? 0 : 1,
        plan: b.id,
        signal: 0,
      }
    )
  }
  return Number(
    stepConstructionOrder(w.buildingOrders, p, order, {
      ...orderEffects(w),
      target,
      register: plan => {
        const b = w.buildings.find(building => building.id === plan.id)!
        const slots = (b.builders ??= Array(rules.buildingMaxWorkers[buildingModel(b)]).fill(0))
        if (!assignBuilder(slots, u.id)) return false
        u.work = b.id
        u.builder ??= {
          task: BuilderTask.Approach,
          busy: 0,
          phase: 0,
          restart: true,
        }
        u.builder.person = p
        return true
      },
      outside: target =>
        buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === target.id)!)),
      prepare: (next, model, x, y, flags) => {
        if (model !== 3) unsupported()
        prepareMovementOrder(next, { x, y }, flags ?? 0, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!))
        )
      },
      task: task => {
        if (task !== BuilderTask.Approach) unsupported()
        const worker = u.builder!
        worker.task = task
        worker.busy = p.commandPhase
        worker.phase = p.animationMode
        worker.restart = !!(p.flags2 & 0x40000000)
        return 0
      },
    })
  )
}

export function startLiveConstructionOrder(w: World, u: Unit) {
  const p = u.native,
    order = p && currentPersonOrder(w.buildingOrders, p)
  if (!p || order?.model !== 6 || stepLiveConstructionOrder(w, u, p, order)) return false
  adoptLiveOrders(w, u, p)
  return true
}

export function stepLiveMovement(w: World, u: Unit, commands: OrderUpdateEffects['commands'] = {}) {
  const p = u.native!
  const driver = p.vehicle ? stepLiveVehicle(w, p) : false
  if (!p.vehicle) stepLivePhysics(w, u, p)
  if (!p.vehicle || driver) stepLiveRoute(w, u)
  else return
  if (p.state !== 10) return
  const next = stepLiveOrderQueue(w, u, p, {
    3: order => {
      if (!p.vehicle)
        return Number(
          stepMovementOrder(p, order, w.land.categories, id => liveVehicles(w).get(id)!)
        )
      if (p.motionGroup) return 0
      const vehicle = liveVehicles(w).get(p.vehicle),
        // The route may coast-correct p.goal; command 3 retains the clicked land target.
        to = { x: order.a, y: order.b },
        vehicleWorld = {
          flags: w.land.flags,
          categories: w.land.categories,
          cellObjects: (cell: number) => liveVehicleCellObjects(w, cell),
        }
      if (vehicle && vehicleCanDisembark(vehicleWorld, vehicle, to)) {
        // ponytail: bounded shore scan; replace with native 004659d0 outward velocity when ported.
        const candidates = []
        for (let y = -512; y <= 512; y += 32)
          for (let x = -512; x <= 512; x += 32)
            candidates.push({ x: short(to.x + x), y: short(to.y + y) })
        candidates.sort(
          (a, b) =>
            Math.hypot(short(a.x - to.x), short(a.y - to.y)) -
            Math.hypot(short(b.x - to.x), short(b.y - to.y))
        )
        const exits: { x: number; y: number }[] = []
        for (const candidate of candidates) {
          if (
            !supportsFollower(w, browserPosition(candidate)) ||
            exits.some(
              exit => Math.hypot(short(exit.x - candidate.x), short(exit.y - candidate.y)) < 96
            )
          )
            continue
          exits.push(candidate)
          if (exits.length === vehicle.passengers.length) break
        }
        for (const [index, id] of [...vehicle.passengers].entries()) {
          const passenger = w.pathfinding.people.get(id)
          if (passenger) leaveLiveVehicle(w, vehicle, passenger, exits[index] ?? to)
        }
        return 1
      }
      return 0
    },
    22: order => {
      if (p.motionGroup) return 0
      const vehicle = w.vehicles.find(v => v.id === order.a && v.active)
      if (!vehicle) return 1
      const holdVehicle = () => {
        p.goalX = p.destinationX = vehicle.x
        p.goalY = p.destinationY = vehicle.y
      }
      if (p.vehicle === vehicle.id) {
        holdVehicle()
        return 0
      }
      const dx = short(vehicle.x - p.x),
        dy = short(vehicle.y - p.y)
      // 0x4eadc0 accepts the targeted ready Boat from the adjacent terminal coast cell.
      if (
        Math.abs(dx) <= 576 &&
        Math.abs(dy) <= 576 &&
        vehicleReady(
          {
            flags: w.land.flags,
            categories: w.land.categories,
          },
          vehicle
        )
      ) {
        if (boardLiveVehicle(w, p, vehicle)) holdVehicle()
      }
      return 0
    },
    6: order => stepLiveConstructionOrder(w, u, p, order),
    27: () => Number(stepLiveWorship(w, u)),
    30: order =>
      stepShamanGuard(p, shamanGuardTarget(w, order), {
        recover: () =>
          recoverPersonMovement(w, p, (person, object) =>
            setLivePersonAnimation(w, person as LivePerson, object)
          ),
        destination: point => replanLivePath(w, u, p, point),
      }),
    ...commands,
  })
  if (next) {
    if (p.commandStatus === 27) u.work = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  adoptLiveOrders(w, u, p)
}

// Shared native state-10 completion: entry and movement advance the same queue.
export function stepLiveOrderQueue(
  w: World,
  u: Unit,
  p: LivePerson,
  commands: OrderUpdateEffects['commands']
) {
  const remove = (slot: number) => removePersonOrder(w.buildingOrders, p, slot, orderEffects(w))
  return stepPersonOrders(
    {
      orders: w.buildingOrders,
      landFlags: w.land.landFlags,
      levelFlags2: w.levelFlags2,
      playerTribe: w.manaWorld.playerTribe,
      objects: new Map(),
      survivingTribes: () => w.manaTribes.filter(t => t.active && !t.defeatTimer).length,
    },
    p,
    {
      commands,
      commandPosition: order =>
        order.model === 30
          ? (shamanGuardTarget(w, order) ?? { x: p.x, y: p.y })
          : { x: order.a, y: order.b },
      vehicleDestination: unsupported,
      vehicleReady: unsupported,
      changeTribe: tribe => {
        p.disguise = ((tribe & 3) << 6) | constants.SPY_DISGUISE_DELAY
      },
      effectiveTribe: () => (p.disguise & 63 ? p.tribe : p.disguise >>> 6),
      cellObjects: unsupported,
      arrival: unsupported,
      leaveVehicle: () => {
        if (p.vehicle) unsupported()
        return false
      },
      outside: to => outsideBuilding(w, to),
      destination: unsupported,
      stop: unsupported,
      formation: () => join(w, p),
      remove,
      advance: () =>
        advancePersonOrder(w.buildingOrders, p, {
          remove,
          resumeVehicle: () => false,
          resumeBuilding: () => false,
          // 0x436870 only rewrites command 31; ground/head queues do not use it.
          prepareNext: () => {
            const slot = p.commandCursor,
              order = w.buildingOrders.records[p.commands[slot]]
            if (order.model !== 31) return
            const point = { x: order.a, y: order.b },
              cell = (point.y >> 9) * 128 + (point.x >> 9),
              id = w.land.buildingIds[cell] & 1023,
              building =
                w.land.flags[cell] & 512
                  ? w.buildings.find(b => (b.id & 1023) === id && b.team === teamForTribe(p.tribe))
                  : undefined
            remove(slot)
            const nextId = allocatePersonOrder(w.buildingOrders)
            if (!nextId) return
            const next = w.buildingOrders.records[nextId]
            if (building) prepareBuildingEntryOrder(next, building.id, 0, 0, false)
            else
              prepareMovementOrder(next, point, 0, w.land, buildingId =>
                buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === buildingId)!))
              )
            attachPersonOrder(w.buildingOrders, p, nextId, slot, orderEffects(w))
          },
          configure: () => {
            const { state, effects } = orderContext(w, p, w)
            configurePersonOrder(state, p, effects)
            w.randomState = state.randomState
          },
          recover: () =>
            recoverPersonMovement(w, p, (person, object) =>
              setLivePersonAnimation(w, person as LivePerson, object)
            ),
        }),
      initialize: () => {
        if (u.entry) initializeBuildingPerson(w, p)
        else changeLivePersonState(w, u)
      },
    }
  )
}

// 0x4ec6f0 visits tribe formations before encounters and ordinary objects.
// New groups recruited by people therefore begin on the next simulation turn.
export function stepLiveMarchingFormations(w: World) {
  if (!w.marching.length) return
  const people = new Map<number, LivePerson>()
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person
    if (p) {
      if (u.hp <= 0) p.flags2 |= 1
      people.set(p.id, p)
    }
  }
  for (let tribe = 0; tribe < 4; tribe++) {
    for (const g of w.marching) {
      if (!g.class || g.tribe !== tribe) continue
      // Retain removed records until this visit, as the native object pool does.
      for (const id of g.members)
        if (id && !people.has(id)) {
          const p = w.objectCells.objects.get(id) as LivePerson | undefined
          if (p) {
            p.class = 0
            people.set(id, p)
          }
        }
      const state = {
        randomState: w.randomState,
        poseRandom: w.cosmeticRandom,
        people,
      }
      stepMarchingFormation(state, g, {
        remove: () => {
          g.class = 0
        },
        destination: (p, to) => {
          p.turnAngle = to.x
          p.turnY = to.y
          p.flags2 = ((p.flags2 & ~128) | 4096) >>> 0
        },
        setAnimation: (p, object) => setLivePersonAnimation(w, p as LivePerson, object),
      })
      w.randomState = state.randomState
    }
  }
  w.marching = w.marching.filter(g => g.class)
}
