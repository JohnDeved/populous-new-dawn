import { departVehiclePerson } from './vehicle-unload.ts'
import { populationCeiling } from './capacity-policy.ts'
import { buildingPose } from './building-shapes.ts'
import { liveBuildingShape } from './live-building-shapes.ts'
import { clearTaskBindings, releaseTasks } from './world-tasks.ts'
import {
  buildingModel,
  browserPosition,
  nativePosition,
  addUnit,
  population,
  sound,
  type World,
  type Unit,
} from './model.ts'
import {
  createLivePerson,
  leaveLiveBuilding,
  changeLivePersonState,
  publishLiveVehicleLaunch,
  registerLivePerson,
  setLivePersonAnimation,
  stepLivePhysics,
  type LivePerson,
} from './live-people.ts'
import { cancelBuildingEntry, initializeBuildingPerson } from './live-building-entry.ts'
import { stepLiveWorship, worshipHeadPose } from './live-worship.ts'
import { worshipApproach } from './worship.ts'
import {
  leaveLiveAttackVehicle,
  liveBuildingAttackTarget,
  cancelLiveBuildingAttack,
  releaseLiveAttackReservation,
  startLiveCombatResponse,
} from './live-building-combat.ts'
import { clearLivePath, stepLiveRoute, replanLivePath } from './live-pathfinding.ts'
import { releasePersonRoute } from './person-routes.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { deleteCellObject, objectsInCell, removeObjectFromCell } from './object-cells.ts'
import { nativeAngle, random } from './native-math.ts'
import {
  startPersonOrders,
  configurePersonOrder,
  type OrderStartEffects,
} from './person-order-start.ts'
import {
  anchorPersonOrder,
  stepPersonOrders,
  type OrderUpdateEffects,
} from './person-order-update.ts'
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
  liveVehicles,
  stepLiveVehicle,
  vehicleExitTarget,
  vehicleExit,
} from './live-vehicles.ts'
import { vehicleReady } from './vehicle-routing.ts'
import { restingCellCollision } from './person-collision.ts'
import {
  boardingTargetLeftOrigin,
  clearFollowingBoardingOrders,
} from './vehicle-boarding-orders.ts'
import { withinVehicleTransferRange } from './vehicle-transfer.ts'
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
  const shape =
    w.land.flags[cell] & 512 ? liveBuildingShape(w, w.land.buildingIds[cell] & 1023) : undefined
  return shape ? buildingOutsidePoint(shape) : point
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
    ![3, 6, 7, 8, 10, 11, 15, 16, 17, 18, 19, 21, 22, 25, 27, 28, 30, 31, 32, 33].includes(
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
    objectId: (id, model) => ([22, 27, 28, 30].includes(model) ? id : (id << 16) >> 16),
    setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
    setDestination: (person, x, y) => {
      const unit = w.units.find(u => u.id === person.id)!
      replanLivePath(w, unit, person as LivePerson, { x, y })
    },
    commandPosition: command => {
      // 0x4389c0 resolves a command-27 stone head through 0x4a8e70.
      if (command.model === 27) {
        const head = w.shrines.find(candidate => candidate.id === command.a && candidate.active)
        if (head) return worshipApproach(worshipHeadPose(w, head))
        unsupported()
      }
      // 0x4389c0 gives command 19's packed-cell payload precedence over objects.
      if (command.model === 19)
        return {
          x: (((command.a & 254) + 1) << 8) & 65535,
          y: ((((command.a & 0xfefe) >>> 8) + 1) * 256) & 65535,
        }
      // 0x4389c0 uses the live person position for an explicit target.
      if (command.model === 28) {
        const target = w.units.find(candidate => candidate.id === command.a && candidate.hp > 0)
        if (target) return nativePosition(w, target)
        unsupported()
      }
      // Other encoded targets retain their existing unsupported boundary.
      if (rules.personCommands[command.model].flags & (4 | 0x800 | 0x242)) unsupported()
      return { x: command.a & 65535, y: command.b & 65535 }
    },
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
      leaveLiveBuilding(
        w,
        w.units.find(u => u.id === person.id)!
      )
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
  // 0x432260 returns before touching fields/RNG when the current slot is empty.
  if (!p.commands[p.commandCursor] && !p.immediateCommand) return
  const { state, effects } = orderContext(w, p, rng)
  startPersonOrders(state, p, effects)
  rng.randomState = state.randomState
}

// Keep the person and shared queue intact when a different live controller takes over.
export function adoptLiveOrders(w: World, u: Unit, p: LivePerson) {
  delete u.resident
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
  return issueLiveOrders(w, units, command, replace, false)
}

// 0x444f60's generic player-input tail restarts command28 as well. Direct
// 0x43b670 attachment and existing computer callers retain their separate path.
export function appendLivePlayerOrders(
  w: World,
  units: Unit[],
  command: PersonOrder,
  replace: boolean
) {
  return issueLiveOrders(w, units, command, replace, false, command.model === 28)
}

// Ordinary training input clears the entire selection before allocating once.
// AI replacement and Ctrl queues retain their existing append semantics.
export function replaceLiveTrainingOrders(w: World, units: Unit[], command: PersonOrder) {
  return issueLiveOrders(w, units, command, false, true)
}

function issueLiveOrders(
  w: World,
  units: Unit[],
  command: PersonOrder,
  replace: boolean,
  playerReplacement: boolean,
  restartDirectTarget = false
) {
  let count = 0
  const bindings = units.map(unit => {
    const sources = [
        unit.flight,
        unit.fight?.motion,
        unit.entry?.person,
        unit.builder?.person,
        unit.native,
      ],
      registered = w.objectCells.objects.get(unit.id),
      person = playerReplacement
        ? (sources.find(p => p && p === registered) ?? sources.find(Boolean))
        : personSource(unit)
    return {
      unit,
      person,
      retained: playerReplacement
        ? !!person && (person === unit.flight || person === unit.fight?.motion)
        : !!(unit.flight || unit.fight?.motion),
    }
  })
  const preachers =
    replace || playerReplacement
      ? bindings.flatMap(({ person: p }) => {
          return p && [17, 31, 32].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0)
            ? [p]
            : []
        })
      : []
  if (playerReplacement)
    for (const binding of bindings) {
      const { unit: u, retained } = binding
      binding.person ??= createLivePerson(w, u)
      const p = binding.person
      delete u.resident
      // Queue cancellation precedes command eligibility and allocation.
      clearPersonOrders(w.buildingOrders, p, orderEffects(w))
      delete p.guardInputPending
      if (retained || u.entry?.person === p) u.native = null
      else u.native = p
      if (![25, 29].includes(p.state) && !(p.flags2 & 0x100000)) clearTaskBindings(w, u)
    }
  const accepted = appendPersonOrders(
    w.buildingOrders,
    command,
    bindings.map(binding => {
      const { unit: u, retained } = binding
      binding.person ??= createLivePerson(w, u)
      const p = binding.person
      delete u.resident
      if (!retained && !u.entry) u.native = p
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
          model === 22 ||
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
          buildingOutsidePoint(liveBuildingShape(w, id)!)
        )
      },
      acknowledge: (_, counts) => {
        count = counts.reduce((a, b) => a + b, 0)
      },
      special: unsupported,
    },
    replace
  )
  for (const p of accepted || playerReplacement ? preachers : [])
    if (![17, 31, 32].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0))
      releasePreacherVictims(w, p, p.commandAux || 3)
  for (const { unit: u, person, retained } of bindings) {
    const p = person!
    if (!accepted && !playerReplacement && !restartDirectTarget && preachers.includes(p)) continue
    // 0x43b670 only replaces and attaches command 28; keep direct-target motion intact.
    if (command.model === 28 && !restartDirectTarget) {
      if (!retained) adoptLiveOrders(w, u, p)
      continue
    }
    if (p.state === 25 || p.state === 29) continue
    // Native player input restarts the active order even when appending a later one.
    resetPersonMotion(p)
    if ((playerReplacement || restartDirectTarget) && p.flags2 & 0x100000) {
      // No initializer may run for this person. A failed click still removes
      // its browser entry adapter and physical queue link before the next turn.
      if (playerReplacement && !accepted && u.entry?.person === p) {
        cancelBuildingEntry(w, u)
        u.native = p
        u.work = null
      }
      continue
    }
    p.previousState = !playerReplacement && !restartDirectTarget && p.state === 14 ? 14 : 0
    p.state = defaultPersonState(p, w.manaWorld.gameFlags)
    if (u.entry) initializeBuildingPerson(w, p)
    else changeLivePersonState(w, u, undefined, p)
    if (!retained) adoptLiveOrders(w, u, p)
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
          buildingOutsidePoint(liveBuildingShape(w, id)!)
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
      buildingOutsidePoint(liveBuildingShape(w, buildingId)!)
    )
  return id
}

//0x43b2a0: allocate before replacing; exhaustion leaves the person untouched.
//Unlike player input, this command does not restart the person's current state.
export function returnLivePerson(
  w: World,
  u: Unit,
  to: { x: number; y: number },
  source?: LivePerson
) {
  const p = source ?? u.native ?? u.entry?.person ?? u.builder?.person
  if (!p) return false
  const id = movementOrder(w, to)
  if (!id) return false
  p.flags2 = (p.flags2 | 0x10) >>> 0
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  attachPersonOrder(w.buildingOrders, p, id, p.commandCursor, orderEffects(w))
  adoptLiveOrders(w, u, p)
  return true
}

export function startLiveOrder(w: World, u: Unit, id: number) {
  const p = u.native ?? createLivePerson(w, u)
  delete u.resident
  u.native = p
  attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(w))
  registerLivePerson(w, p)
  changeLivePersonState(w, u, 10)
}

export function cancelLiveOrder(w: World, u: Unit) {
  const p = u.native ?? u.flight ?? u.fight?.motion ?? u.builder?.person
  if (p) delete p.guardInputPending
  const model = p && currentPersonOrder(w.buildingOrders, p)?.model
  if (!p || !model || ![3, 6, 7, 15, 16, 17, 22, 27, 28, 30, 31, 32, 33].includes(model)) return
  if ([17, 31, 32].includes(model)) releasePreacherVictims(w, p, p.commandAux || 3)
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
}

// Transport replacement retains the exact seated person while its old owner
// releases the queue and any attack reservation before a new order is attached.
export function cancelLiveTransportOrder(w: World, u: Unit) {
  const p = u.native
  if (p && currentPersonOrder(w.buildingOrders, p)?.model === 19)
    cancelLiveBuildingAttack(w, u, true)
  cancelLiveOrder(w, u)
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
  // Preserve roster order. A spatial index remains separate scaling work.
  for (const u of w.units) {
    if (u.hp <= 0 || u.inside !== null || u.flight) continue
    let victim = u.native ?? u.entry?.person ?? u.fight?.motion
    if (victim) {
      if (!inPreachingRange(preacher, victim, radius)) continue
    } else {
      // Keep nativePosition's terrain synchronization even for rejected candidates.
      const pos = nativePosition(w, u)
      if (!inPreachingRange(preacher, { x: pos.x & 65535, y: pos.y & 65535 }, radius)) continue
      victim = createLivePerson(w, u, pos)
    }
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
  deleteCellObject(w.objectCells, oldId)
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
    if (victim.flags4 & 0x800) {
      // 004d83b0 bypasses replacement allocation for ghosts. Use the existing
      // port ghost-removal epilogue; 004d4b50's full native cleanup is not retained.
      releaseTasks(w, u)
      victim.life = u.hp = 0
      return
    }
    const team = teamForTribe(preacher!.tribe)
    if (
      population(w, team) < populationCeiling(w.capacityPolicy) ||
      w.manaTribes[victim.tribe].flags2 & 64
    )
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
    poseRandom: w.cosmeticRandom,
    playerTribe: w.manaWorld.playerTribe,
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
        frameCount: () => sprites.frameCounts[p.object],
        sound: cue => {
          p.flags4 = (p.flags4 | 16) >>> 0
          sound(w, cue, u, u.id)
        },
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
  if (
    Math.abs(short(target.x) - short(p.x)) < 824 &&
    Math.abs(short(target.y) - short(p.y)) < 824
  ) {
    p.flags2 = (p.flags2 & ~0x2000000) >>> 0
    return 0
  }
  p.assignment |= 8
  if (
    Math.abs(short(target.x) - short(p.goalX)) >= 440 ||
    Math.abs(short(target.y) - short(p.goalY)) >= 440
  )
    effects.destination(target)
  if (!p.speed) effects.recover()
  return 0
}

function shamanGuardTarget(w: World, order: PersonOrder) {
  const unit = w.units.find(u => u.id === order.a && u.hp > 0),
    person = unit && personSource(unit)
  if (!unit || (person && (!person.class || person.flags2 & 1 || person.vehicle))) return null
  return outsideBuilding(w, person ?? nativePosition(w, unit))
}

export function anchorLiveShamanGuard(w: World, p: LivePerson, order: PersonOrder | undefined) {
  anchorPersonOrder(p, order, {
    // Cancellation's command-position lookup reads the saved target's position,
    // even if that target has since died or entered a vehicle.
    commandPosition: command => shamanGuardPosition(w, command, p),
    outside: point => outsideBuilding(w, point),
  })
}

function shamanGuardPosition(w: World, order: PersonOrder, fallback: LivePerson) {
  const target = w.units.find(u => u.id === order.a)
  return target ? (personSource(target) ?? nativePosition(w, target)) : fallback
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
          buildingOutsidePoint(liveBuildingShape(w, id)!)
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

// A retained entry owner uses the same visit with its existing initializer and
// final ownership publication. Ordinary callers keep the established defaults.
export interface MovementOwner {
  initialize: () => void
  changeState: (next: number) => void
  adopt: () => void
}
export function stepLiveMovement(
  w: World,
  u: Unit,
  commands: OrderUpdateEffects['commands'] = {},
  ownerContext?: MovementOwner
) {
  const p = u.native!
  // 0x4d32b0 prepares and visits physics before vehicle/order dispatch too.
  // Seated physics is frozen by 0x4000, but its clock/reaction still advance.
  stepLivePhysics(w, u, p, ownerContext?.initialize)
  const boarding = currentPersonOrder(w.buildingOrders, p)?.model === 22
  const driver = p.vehicle ? stepLiveVehicle(w, p) : false
  if (!p.vehicle || driver) stepLiveRoute(w, u)
  else if (!boarding && currentPersonOrder(w.buildingOrders, p)?.model !== 3) return
  if (p.state !== 10 || (p.guardInputPending && p.flags2 & 16)) return
  const next = stepLiveOrderQueue(w, u, p, {
    // 0x4336c0 arrival and 0x432590 per-person departure apply to both craft models.
    3: order =>
      Number(stepMovementOrder(p, order, w.land.categories, id => liveVehicles(w).get(id)!)),
    22: order => {
      const vehicle = w.vehicles.find(v => v.id === order.a && v.active)
      const complete = () => {
        p.speed = 0
        return 1
      }
      if (!vehicle || boardingTargetLeftOrigin(order, vehicle)) return complete()
      // 0x4666f0 resolves the persistent person object, not the active route cache.
      // A settled state-30 driver need not remain in pathfinding.people.
      const driverUnit = w.units.find(unit => unit.id === vehicle.passengers[0] && unit.hp > 0),
        owner = driverUnit && personSource(driverUnit),
        driverPerson =
          owner &&
          owner.id === vehicle.passengers[0] &&
          owner.class === 1 &&
          owner.vehicle === vehicle.id &&
          w.objectCells.objects.get(owner.id) === owner
            ? owner
            : undefined
      if (
        vehicle.passengerCount >= rules.vehicleCapacity[vehicle.model] ||
        !vehicleReady(w.land, vehicle) ||
        (vehicle.passengerCount && driverPerson?.tribe !== p.tribe)
      )
        return complete()
      if (p.vehicle === vehicle.id) return p.slowTurn ? 0 : complete()
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        recoverPersonMovement(w, p, (person, object) =>
          setLivePersonAnimation(w, person as LivePerson, object)
        )
        const target = { x: vehicle.x & 65535, y: vehicle.y & 65535 },
          cell = (target.y >> 9) * 128 + (target.x >> 9),
          direct =
            p.vehicle &&
            rules.vehicleRestFlags[vehicle.model] & 1 &&
            !restingCellCollision(
              { flags: w.land.flags[cell], category: w.land.categories[cell] },
              w.land.walkMasks[w.pathfinding.state.walkMask],
              target,
              true
            )
        replanLivePath(w, u, p, direct ? target : vehicleExitTarget(w, vehicle))
      }
      if (p.vehicle) {
        if (withinVehicleTransferRange(p, vehicle)) {
          // 0x435160 uses the same projected768/fallback/anchor departure shape
          // as 0x435550 mode1 before boarding the distinct target vehicle.
          leaveLiveAttackVehicle(w, p, vehicle)
          if (boardLiveVehicle(w, p, vehicle))
            clearFollowingBoardingOrders(
              w.buildingOrders,
              p,
              w.manaTribes[p.tribe].playerType,
              vehicle.model,
              id => w.vehicles.find(v => v.id === id && v.active)?.model,
              orderEffects(w).deleteObject
            )
        }
        return p.vehicle === vehicle.id && !p.slowTurn ? complete() : 0
      }
      // Existing settled boarding geometry is an explicit adapter boundary;
      // native 0x435160's direct-airborne point/extent is separate work.
      if (p.motionGroup || p.slowTurn) return 0
      const close = (point: { x: number; y: number }) =>
        Math.abs(short(point.x - p.x)) <= 576 && Math.abs(short(point.y - p.y)) <= 576
      if (
        (close(vehicle) || close(vehicleExitTarget(w, vehicle))) &&
        boardLiveVehicle(w, p, vehicle)
      ) {
        p.goalX = p.destinationX = vehicle.x
        p.goalY = p.destinationY = vehicle.y
      }
      return p.vehicle === vehicle.id && !p.slowTurn ? complete() : 0
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
    if (ownerContext) ownerContext.changeState(next)
    else changeLivePersonState(w, u, next)
  }
  if (!(next && p.flags2 & 0x100000)) delete p.guardInputPending
  if (ownerContext) ownerContext.adopt()
  else adoptLiveOrders(w, u, p)
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
      commandPosition: order => {
        if (order.model === 30) return shamanGuardPosition(w, order, p)
        // Area commands store a packed cell in a and search extents in b.
        if (rules.personCommands[order.model].flags & 0x800)
          return {
            x: ((order.a & 254) + 1) * 256,
            y: (((order.a >>> 8) & 254) + 1) * 256,
          }
        return { x: order.a, y: order.b }
      },
      vehicleDestination: unsupported,
      vehicleReady: unsupported,
      changeTribe: tribe => {
        p.disguise = ((tribe & 3) << 6) | constants.SPY_DISGUISE_DELAY
        // Command16 publishes the target tribe immediately, independently of
        // the person's disguise countdown and the vehicle's real count owner.
        const vehicle = w.vehicles.find(v => v.id === p.vehicle && v.active)
        if (vehicle) vehicle.apparentTribe = p.disguise >>> 6
      },
      effectiveTribe: () => (p.disguise & 63 ? p.tribe : p.disguise >>> 6),
      cellObjects: unsupported,
      arrival: unsupported,
      leaveVehicle: () => {
        const vehicle = w.vehicles.find(v => v.id === p.vehicle && v.active)
        if (!vehicle) return false
        const exit = vehicleExit(w, vehicle)
        if (!exit.found) return false
        if (!departVehiclePerson(w, vehicle, p, exit.point)) return false
        publishLiveVehicleLaunch(w, p)
        return true
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
                buildingOutsidePoint(liveBuildingShape(w, buildingId)!)
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
