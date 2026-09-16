import { buildingPose } from './building-shapes.ts'
import { emitGroundSpark, requestTutorial, sound } from './world-effects.ts'
import { releaseTasks } from './world-tasks.ts'
import { initializeRouteRecovery, stepRouteRecovery } from './person-route-recovery.ts'
import { initializeLiveIdleApproach, rebuildLiveRestingSlots } from './live-resting.ts'
import { initializeRestingPerson } from './person-idle.ts'
import { stampFootprints } from './footprints.ts'
import { adoptLiveOrders, startLiveOrders } from './live-movement.ts'
import { currentPersonOrder } from './person-orders.ts'
import {
  cancelBuildingEntry,
  leaveBuildingEntry,
  rebuildLiveTrainingQueue,
} from './live-building-entry.ts'
import { approachMeleeSlot, meleeAnimationObject } from './melee.ts'
import { stepMeleeEncounter } from './melee-encounter.ts'
import { nativePersonModel } from './live-combat.ts'
import { teamForTribe, tribeForTeam } from './world-types.ts'
export { cancelBuildingEntry } from './live-building-entry.ts'
import {
  type World,
  type Unit,
  nativePosition,
  browserPosition,
  unitAnimationSource,
  unitAnimation,
  buildingModel,
  supportsFollower,
  revealUnitInvisibility,
  unitInvisibilityRenderBit,
  unitInvisibilityRenderFlag,
} from './model.ts'
import {
  initializePersonState,
  stateAfterFight,
  personAnimationObject,
  stepElectrocution,
  type StatefulPerson,
} from './person-state.ts'
import {
  consumePersonDisruption,
  damagePerson,
  preparePersonTurn,
  stepPersonReaction,
} from './person-update.ts'
import { stepPersonPanic, stepVolcanoPanic, ignitePeopleInFireCell } from './person-panic.ts'
import { strikeLightning } from './lightning.ts'
import { stepPersonOrders } from './person-order-update.ts'
import {
  releasePersonRoute,
  setDirectPersonDestination,
  clearFailedRoute,
  attachPersonRoute,
} from './person-routes.ts'
import { stepCelebration, type Celebrant, type CelebrationEffects } from './celebration.ts'
import {
  setAnimationObject,
  setPersonAnimation,
  stepObjectAnimation,
  type Animation,
} from './animation.ts'
import {
  turnPerson,
  groundVelocity,
  positionsOverlap,
  stepMotionRecovery,
  recoverGroundObstacle,
  type RecoveryPerson,
} from './person-motion.ts'
import {
  clearLivePath,
  planLivePath,
  acceptLivePath,
  replanLivePath,
  buildLiveRecoveryRoute,
  stepLiveRoute,
} from './live-pathfinding.ts'
import { buildingApproachPoint, buildingOutsidePoint } from './building-shapes.ts'
import {
  buildingExitPoint,
  restoreBuildingOccupant,
  faceBuildingExit,
} from './building-occupants.ts'
import {
  personStepCollision,
  buildingBlocksPerson,
  type CollisionWorld,
  type CollisionObject,
} from './person-collision.ts'
import {
  limitPersonVelocity,
  personSupportHeight,
  markPersonAirborne,
  unsupportedGround,
  stepPersonPhysics,
  type PhysicsPerson,
} from './person-physics.ts'
import { terrainPointHeight } from './native-terrain.ts'
import {
  insertObjectIntoCell,
  removeObjectFromCell,
  moveObjectInCells,
  objectsInCell,
  type CellObject,
} from './object-cells.ts'
import { positionDistance, random } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }

export type LivePerson = StatefulPerson &
  Celebrant &
  Animation &
  RecoveryPerson &
  PhysicsPerson &
  CellObject & {
    stamp: number
    morphTimer: number
    morphFrames: number
    building: number | null
    goalX: number
    goalY: number
    destinationX: number
    destinationY: number
    motionGroup: number
    motionIndex: number
    reactionTimer: number
    reactionDuration: number
    anchorFlags: number
    disguise: number
    savedVehicle: number
    formationDelay: number
    orderDelay: number
    damageAttacker: number
    burnTrail: number
    marchCooldown: number
    computerAssignment: number
    invisibilityRender?: number
  }
const short = (n: number) => (n << 16) >> 16
// Bootstrap the existing browser follower at the handoff to native controllers.
// Legacy orders/physics are not native records; their full migration is pending.
export function createLivePerson(w: World, u: Unit): LivePerson {
  const pos = nativePosition(w, u),
    model = nativePersonModel(u)
  const selected = w.selected.includes(u.id),
    angle = Math.round(((Math.PI - u.heading) * 1024) / Math.PI) & 2047
  return {
    id: u.id,
    class: 1,
    model,
    // Player selection marks +0x7a; it does not enter the AI reservation state 14.
    state: 10,
    previousState: 0,
    substate: 0,
    tribe: tribeForTeam(u.team),
    x: pos.x & 65535,
    y: pos.y & 65535,
    h: pos.h,
    anchorX: pos.x & 65535,
    anchorY: pos.y & 65535,
    counter: (w.turn - 1) & 255,
    flags2: u.inside === null ? 0 : 0x800000,
    flags3: u.shield ? 0x80000 : 0,
    // Preserve the outdoor target eligibility previously supplied by each spell adapter.
    flags4:
      0x20000000 |
      (u.inside === null ? 256 : 0) |
      (u.invisibility ? 0x1000 : 0) |
      (u.ghost ? 0x800 : 0),
    physics: rules.personModels[model].physics,
    speed: 0,
    angle,
    heading: angle,
    turnAngle: angle,
    turnY: 0,
    slowTurn: 0,
    goalX: 0,
    goalY: 0,
    destinationX: 0,
    destinationY: 0,
    building: u.inside,
    cargo: u.cargo * 100,
    vehicle: 0,
    assignment: 0,
    timer: 0,
    target: 0,
    link: 0,
    stateObject: 0,
    animationMode: 0,
    commandAux: 0,
    commandPhase: 0,
    object: 0,
    draw: 0,
    morph: 0,
    palette: 0,
    renderFlags:
      unitInvisibilityRenderFlag(w, u) |
      (u.ghost && tribeForTeam(u.team) === w.manaWorld.playerTribe ? 0x4000 : 0),
    invisibilityRender: u.invisibility ? unitInvisibilityRenderBit(w, u) : undefined,
    f1: 0,
    f2: 0,
    stamp: 0,
    morphTimer: 0,
    morphFrames: 0,
    statusFlags: 0,
    workFlags: 0,
    reservationNext: 0,
    formationCell: 0,
    motionTimer: 0,
    motionMode: 0,
    motionGroup: 0,
    motionIndex: 0,
    recoveryCounter: 0,
    supportHeight: u.supportHeight ?? 0,
    selectionFlags: selected ? 128 : 0,
    commands: Array(8).fill(0),
    commandCursor: 0,
    immediateCommand: 0,
    orderLocation: 0,
    commandStatus: 0,
    workTarget: 0,
    cellNext: 0,
    cellPrevious: 0,
    displacement: { x: 0, y: 0, h: 0 },
    reactionTimer: 0,
    reactionDuration: 0,
    anchorFlags: 0,
    velocity: { x: 0, y: 0, z: 0 },
    life: short(Math.round(u.hp * 20)),
    disguise: 0,
    savedVehicle: 0,
    formationDelay: 0,
    orderDelay: 0,
    damageAttacker: 255,
    burnTrail: u.burnTrail ?? 0,
    marchCooldown: 0,
    computerAssignment: 0,
  }
}

// Share native exit placement without allocating a synthetic occupancy world.
// ponytail: ordinary occupants still belong to the browser unit list; native
// six-slot admission, training repricing and order ownership remain to be wired.
export function leaveLiveBuilding(w: World, u: Unit) {
  const entry = leaveBuildingEntry(w, u)
  if (entry) return entry
  const b = w.buildings.find(building => building.id === u.inside)
  if (!b) return
  const p = u.flight ?? u.native ?? createLivePerson(w, u)
  restoreBuildingOccupant(
    p,
    (x, y) => terrainPointHeight(w.land, { x, y }),
    () => {
      if (u.native === p || u.flight === p) {
        w.objectCells.objects.set(p.id, p)
        insertObjectIntoCell(w.objectCells, p, p)
      }
    }
  )
  faceBuildingExit(p, buildingExitPoint(buildingPose(b)))
  p.building = null
  u.inside = null
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  return p
}

// Legacy allocation/deletion and spell movement still own ordinary units.
// Reconcile that boundary; native movement then maintains persistent cell order.
// ponytail: victory bootstrap supplies initial order; full native allocation
// must establish membership for ordinary units and the remaining object classes.
export function syncLivePersonCells(w: World) {
  const people = new Map(
    w.units
      .filter(
        u =>
          (u.flight || u.fight?.motion || u.native || u.entry) &&
          (u.hp > 0 || u.flight || u.native?.state === 44)
      )
      .map(u => [u.id, (u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person)!])
  )
  for (const [id, p] of w.objectCells.objects)
    if (people.get(id) !== p) {
      if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
      w.objectCells.objects.delete(id)
    }
  for (const u of w.units) {
    // Preserve the native display offset across ordinary browser order handoff.
    // Occupancy freezes physics; ordinary movement resumes the native support check.
    const p = people.get(u.id)
    const offset = p?.supportHeight ?? u.supportHeight
    if (offset && !((p?.flags2 ?? 0) & 0x4000)) {
      const point = nativePosition(w, u),
        cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9),
        flags = w.land.flags[cell]
      const b =
        flags & 512 ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023)) : undefined
      const value = personSupportHeight(offset, flags, b ? buildingModel(b) : 0)
      if (p) p.supportHeight = value
      u.supportHeight = value || undefined
    }
    if (!p) continue
    if (!w.objectCells.objects.has(p.id)) {
      w.objectCells.objects.set(p.id, p)
      insertObjectIntoCell(w.objectCells, p, p)
    }
    if (u.flight || u.fight?.motion) continue
    const to = nativePosition(w, u)
    to.x &= 65535
    to.y &= 65535
    // Native physics owns height. Re-rounding the browser surface can hold a
    // grounded follower one unit above native terrain, restarting gravity forever.
    if (unitAnimationSource(u) === p)
      to.h = to.x === p.x && to.y === p.y ? p.h : terrainPointHeight(w.land, to)
    if (to.x !== p.x || to.y !== p.y || to.h !== p.h) moveObjectInCells(w.objectCells, p, to)
  }
  return people
}

export function setLivePersonAnimation(w: World, p: LivePerson, object: number) {
  setPersonAnimation(
    p,
    object,
    {
      playerTribe: w.manaWorld.playerTribe,
      gameFlags: w.manaWorld.gameFlags,
      sessionSubstate: null,
      tribes: w.manaTribes.map((t, i) => ({
        flags: w.castingTribes[i].flags,
        playerType: t.playerType,
      })),
      objects: new Map(),
    },
    sprites
  )
}

function context(w: World) {
  let people: Map<number, LivePerson> | undefined
  const state = {
    randomState: w.randomState,
    get people() {
      return (people ??= syncLivePersonCells(w))
    },
    get shamans() {
      return w.manaTribes.map(
        (_, i) =>
          w.units.find(
            u => u.hp > 0 && u.kind === 'shaman' && !u.ghost && u.team === teamForTribe(i)
          )?.id ?? 0
      )
    },
    cellPeople: (c: number) => {
      const people = state.people
      return [...objectsInCell(w.objectCells, c)].map(p => people.get(p.id)!)
    },
  }
  const effects: CelebrationEffects = {
    animation: (person, object, upper) => {
      const p = person as LivePerson
      if (upper) setLivePersonAnimation(w, p, object)
      else {
        const [start, draw] = rules.animationObjects[object]
        setAnimationObject(p, draw, start)
      }
    },
    animationTiming: person => {
      const p = person as LivePerson,
        d = rules.animationDescriptors[p.draw]
      return { hold: d.hold, duration: (d.step + 1) * sprites.frameCounts[p.object] }
    },
    releaseMotion: person => releasePersonRoute(w.motionRoutes, person as LivePerson),
    destination: (person, to) =>
      setDirectPersonDestination(w.motionRoutes, person as LivePerson, to),
    dropLog: person => {
      // 0x4a6cc0's cell centering and two jitter draws. Native free-cell search,
      // allocation ordering and loose-log lifecycle still use browser adapters.
      const pos = {
        x: ((person.x & 0xfe00) + 256 + 32 - (random(state) & 63)) & 65535,
        y: ((person.y & 0xfe00) + 256 + 32 - (random(state) & 63)) & 65535,
      }
      w.trees.push({ id: w.nextId++, ...browserPosition(pos), logs: 1, model: 11 })
      return true
    },
    sound: (p, cue) => sound(w, cue, browserPosition(p)),
    leaveBuilding: person => {
      leaveLiveBuilding(w, w.units.find(u => u.id === person.id)!)
    },
    projectile: () => {
      throw new Error('Live firewarriors are not yet implemented')
    },
  }
  return { state, effects }
}

function initializeLivePerson(w: World, u: Unit, ctx: ReturnType<typeof context>, p = u.native!) {
  const { state, effects } = ctx
  const tribes = w.manaTribes.map((t, i) => ({
    x: 0,
    y: 0,
    angle: 0,
    selectedCount: w.units.filter(u => u.native?.tribe === i && w.selected.includes(u.id)).length,
    flags: t.flags2,
  }))
  const initWorld = Object.assign(state, {
    tribes,
    instantFacing: false,
    levelFlags: w.manaWorld.gameFlags,
    orders: w.buildingOrders,
  })
  const unexpected = () => {
    throw new Error('Legacy handoff contains an unowned native assignment')
  }
  initializePersonState(initWorld, p, {
    routeRecovery: () => initializeLiveRouteRecovery(w, p),
    encounter: () => initializeGroundCombat(w, p),
    fight: () => initializeGroundCombat(w, p),
    celebrate: () => stepCelebration(state, p, effects),
    setAnimation: (p, o) => effects.animation(p as LivePerson, o, true),
    releaseMotion: p => effects.releaseMotion(p as LivePerson),
    deselectPassengers: unexpected,
    rebuildTrainingQueue: id => rebuildLiveTrainingQueue(w, id),
    rebuildFormation: cell => rebuildLiveRestingSlots(w, cell),
    idleApproach: () =>
      initializeLiveIdleApproach(w, u, p, () => initializeLivePerson(w, u, ctx, p)),
    resting: () =>
      initializeRestingPerson(w, p, {
        setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
        releaseMotion: () => {
          releasePersonRoute(w.motionRoutes, p)
          clearLivePath(w, u)
        },
      }),
    startOrders: p => {
      if (
        [3, 6, 7, 8, 10, 11, 17, 19, 21, 22, 25, 27, 28, 30, 31, 32, 33].includes(
          currentPersonOrder(w.buildingOrders, p)?.model ?? 0
        )
      )
        startLiveOrders(w, p as LivePerson, state)
      else if (p.immediateCommand || p.commands[p.commandCursor]) unexpected()
    },
  })
  tribes.forEach((t, i) => {
    w.manaTribes[i].flags2 = t.flags
  })
  u.cargo = p.cargo / 100
}

export function initializeLiveRouteRecovery(w: World, p: LivePerson) {
  initializeRouteRecovery(
    {
      gameFlags: w.manaWorld.gameFlags,
      playerTribe: w.manaWorld.playerTribe,
      turn: w.turn,
      lastOrderTurn: w.lastOrderTurn,
    },
    p,
    {
      animation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
      release: () => {
        releasePersonRoute(w.motionRoutes, p)
        const unit = w.units.find(u => u.id === p.id)
        if (unit) clearLivePath(w, unit)
      },
      sound: cue => sound(w, cue, browserPosition(p)),
      notify: (flags, message) => requestTutorial(w, flags, message),
    }
  )
}

export function changeLivePersonState(w: World, u: Unit, next?: number, source = u.native!) {
  const p = source
  if (p.flags2 & 0x100000) return
  if (next !== undefined) {
    p.previousState = p.state
    p.state = next
  }
  const ctx = context(w)
  initializeLivePerson(w, u, ctx, p)
  w.randomState = ctx.state.randomState
}

export function initializeLivePanic(
  w: World,
  u: Unit,
  p = u.flight ?? u.native ?? createLivePerson(w, u),
  transitioned = false
) {
  if (p.flags2 & 0x100000) return
  cancelBuildingEntry(w, u)
  u.native = p
  if (!transitioned) {
    p.previousState = p.state
    p.state = 26
  }
  const ctx = context(w)
  initializeLivePerson(w, u, ctx)
  w.selected = w.selected.filter(id => id !== u.id)
  w.randomState = ctx.state.randomState
}

export function disturbLiveVolcanoPerson(w: World, u: Unit, tribe: number, p?: LivePerson) {
  p ??=
    u.flight ??
    u.fight?.motion ??
    u.native ??
    u.entry?.person ??
    u.builder?.person ??
    createLivePerson(w, u)
  p.flags2 |= 8
  p.damageAttacker = tribe
  consumePersonDisruption(p, () => {
    releaseTasks(w, u)
    u.flight = undefined
    u.native = p
    const ctx = context(w)
    initializeLivePerson(w, u, ctx, p)
    w.randomState = ctx.state.randomState
    w.selected = w.selected.filter(id => id !== u.id)
    if (p.flags4 & 0x800) p.life = u.hp = 0
  })
  if (u.hp > 0 && p.state === 31) u.burnTrail = p.burnTrail = 4
}

export function strikeLiveLightning(w: World, point: { x: number; y: number }, tribe: number) {
  const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
  const units = new Map<number, Unit>()
  const people: LivePerson[] = []
  // Ordinary allocation still supplies cell order, as in the live Blast adapter.
  for (const u of w.units) {
    if (u.inside !== null || (u.hp <= 0 && !u.flight && u.native?.state !== 44)) continue
    const existing = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    const position = existing ?? nativePosition(w, u)
    if (((position.y & 65535) >> 9) * 128 + ((position.x & 65535) >> 9) !== cell) continue
    const p = existing ?? createLivePerson(w, u)
    p.life = Math.round(u.hp * 20)
    units.set(p.id, u)
    people.unshift(p)
  }
  strikeLightning(people, tribe, p => {
    const u = units.get(p.id)!
    releaseTasks(w, u)
    u.native = p
    const ctx = context(w)
    initializeLivePerson(w, u, ctx, p)
    w.randomState = ctx.state.randomState
    w.selected = w.selected.filter(id => id !== u.id)
  })
  for (const p of people) units.get(p.id)!.hp = p.life / 20
}

// Existing ordinary allocation order is also used by Blast's cell adapter.
// ponytail: full mixed-class persistent cell ownership remains a separate engine port.
export function buildingFirePeople(w: World) {
  const cells = new Map<number, LivePerson[]>()
  const units = new Map<number, Unit>()
  for (const u of w.units) {
    if (u.inside !== null || (u.hp <= 0 && !u.flight)) continue
    const p = u.flight ?? u.native ?? createLivePerson(w, u)
    const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const people = cells.get(cell) ?? []
    people.unshift(p)
    cells.set(cell, people)
    units.set(p.id, u)
  }
  return (point: { x: number; y: number }, tribe: number) => {
    const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
    const people = cells.get(cell) ?? []
    ignitePeopleInFireCell(w, tribe, people, p => {
      const u = units.get(p.id)!
      u.native = p
      initializeLivePanic(w, u)
    })
    for (const p of people) units.get(p.id)!.burnTrail = p.burnTrail
  }
}

export function initializeLiveCelebration(w: World, u: Unit) {
  const ctx = context(w),
    p = u.native!
  p.previousState = p.state
  p.state = 41
  initializeLivePerson(w, u, ctx)
  w.randomState = ctx.state.randomState
}

export function collisionWorld(w: World): CollisionWorld {
  // Native footprint cells are shared; object/plan lifecycle is still adapted.
  let objects: Map<number, CollisionObject> | undefined
  return {
    get objects() {
      if (objects) return objects
      objects = new Map()
      for (const b of w.buildings)
        objects.set(b.id, {
          ...nativePosition(w, b),
          class: 2,
          state: b.progress === 1 ? 2 : 1,
          flags2: 0,
          tribe: tribeForTeam(b.team),
          related: 0,
        })
      for (const u of w.units)
        objects.set(u.id, {
          ...nativePosition(w, u),
          class: 1,
          state: u.native?.state ?? 10,
          flags2: u.hp > 0 ? (u.native?.flags2 ?? 0) : 1,
          tribe: tribeForTeam(u.team),
          related: 0,
        })
      return objects
    },
    walkMask: w.land.walkMasks[0],
    boatAt: () => false,
    cell: pos => {
      const i = ((pos.y & 65535) >> 9) * 128 + ((pos.x & 65535) >> 9)
      return {
        flags: w.land.flags[i],
        category: w.land.categories[i],
        building: w.land.buildingIds[i],
      }
    },
  }
}

export function createMeleePerson(w: World, u: Unit) {
  revealUnitInvisibility(w, u)
  const p = createLivePerson(w, u)
  p.state = 25
  p.workFlags = u.fight?.group ?? 0
  p.flags2 |= 0x40200200 // 0x5184e0: arrival clamp and instant combat facing.
  p.h = terrainPointHeight(w.land, p)
  return p
}

// 0x518480; currently playable classes need no spy-disguise consumer. Ordinary
// outdoor fight entry also uses this grounding after releasing its old work.
function initializeGroundCombat(w: World, p: LivePerson) {
  p.flags4 = (p.flags4 & ~0x400) >>> 0
  p.h = terrainPointHeight(w.land, p)
  p.flags2 = (p.flags2 | 0x40200200) >>> 0
  p.substate = 0
}

export function enterLiveCombat(w: World, u: Unit, state: 25 | 29, p?: LivePerson) {
  revealUnitInvisibility(w, u)
  p ??= u.fight?.motion ?? u.native ?? u.entry?.person ?? createLivePerson(w, u)
  const flags = p.flags4 & 0x10007
  if (!(p.flags2 & 0x100000)) {
    p.previousState = p.state
    p.state = state
    const ctx = context(w)
    initializeLivePerson(w, u, ctx, p)
    w.randomState = ctx.state.randomState
  }
  if (state === 29) p.flags4 = (p.flags4 | flags) >>> 0
  return p
}

export function stepLiveEncounter(w: World, attacker: Unit, defender: Unit, buildingId?: number) {
  const building = w.buildings.find(b => b.id === buildingId && b.hp > 0)
  const state = {
    randomState: w.randomState,
    playerTribe: w.manaWorld.playerTribe,
    musicActivity: w.musicActivity,
    gameFlags: w.manaWorld.gameFlags,
    routes: w.motionRoutes,
    building: building && { ...buildingPose(building), id: building.id, class: 2, flags2: 0 },
  }
  const outcome = stepMeleeEncounter(state, attacker.fight!.motion!, defender.fight!.motion!, {
    animation: (p, object) => setLivePersonAnimation(w, p as LivePerson, object),
    height: (x, y) => terrainPointHeight(w.land, { x, y }),
    sound: (p, cue) => sound(w, cue, browserPosition(p)),
    building: {
      occupied: p => !!(w.land.flags[(p.y >> 9) * 128 + (p.x >> 9)] & 512),
      destination: (p, to) => {
        const u = p.id === attacker.id ? attacker : defender
        clearLivePath(w, u)
        acceptLivePath(w, u, planLivePath(w, u, browserPosition(to), p as LivePerson))
      },
      move: (p, to) => {
        registerLivePerson(w, p as LivePerson)
        moveObjectInCells(w.objectCells, p as LivePerson, {
          ...to,
          h: terrainPointHeight(w.land, to),
        })
        Object.assign(p.id === attacker.id ? attacker : defender, browserPosition(to))
      },
    },
  })
  w.randomState = state.randomState
  w.musicActivity = state.musicActivity
  for (const u of [attacker, defender]) {
    const p = u.fight!.motion!
    u.heading = Math.PI - (p.angle * Math.PI) / 1024
    if (p.flags2 & 0x80000) u.flight = p
  }
  return outcome
}

// 0x518fb0 substate 7: keep the recoil pose and let shared physics own the slide.
export function startMeleeKnockback(w: World, u: Unit) {
  const p = u.fight?.motion ?? createMeleePerson(w, u)
  p.state = 25
  p.substate = 7
  p.flags2 = ((p.flags2 & ~0x40000000) | 0x83080) >>> 0
  p.flags3 |= 0x8000000
  p.flags4 |= 0x2000
  setLivePersonAnimation(w, p, meleeAnimationObject(u.kind, 'recoil'))
  p.f1 = 1
  // Carry the displayed recoil frame across the browser-to-native handoff.
  // Ordinary fight poses still use elapsed turns rather than a retained person.
  const elapsed = w.time - (u.fight?.started ?? w.turn) / 12
  p.f2 = Math.min(sprites.frameCounts[p.object] - 1, Math.max(0, Math.floor(elapsed * sprites.fps)))
  groundVelocity(p.velocity, p, (random(w) % 70) + 35, (p.heading + 1024) & 2047, (x, y) =>
    terrainPointHeight(w.land, { x, y })
  )
  u.flight = p
}

// Fight control sets destinations first; ordinary person physics moves everyone
// afterward, preserving group decisions independently of participant list order.
export function approachLiveMelee(
  w: World,
  u: Unit,
  slot: { x: number; y: number },
  center: { x: number; y: number },
  outer: boolean
) {
  const f = u.fight!
  f.motion ??= createMeleePerson(w, u)
  const p = f.motion
  p.substate = f.action === 'approach' ? 0 : 1
  const state = { randomState: w.randomState, routes: w.motionRoutes }
  const ready = approachMeleeSlot(state, p, slot, center, outer, {
    animation: (_, object) => setLivePersonAnimation(w, p, object),
    move: point => {
      registerLivePerson(w, p)
      moveObjectInCells(w.objectCells, p, {
        x: point.x & 65535,
        y: point.y & 65535,
        h: terrainPointHeight(w.land, point),
      })
      Object.assign(u, browserPosition(p))
    },
  })
  w.randomState = state.randomState
  f.action = p.substate === 1 ? 'ready' : 'approach'
  f.animation = p.speed ? 'walk' : 'idle'
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  return ready
}

export function stepLiveMeleeMotion(w: World, u: Unit) {
  const p = u.fight!.motion!
  stepLivePhysics(w, u, p)
  if (p.flags2 & 0x80000) u.flight = p
  if (p.state !== 25 && p.state !== 29) u.fight = null
}

export function registerLivePerson(w: World, p: LivePerson) {
  const previous = w.objectCells.objects.get(p.id)
  if (previous !== p) {
    if (previous && previous.flags2 & 0x20000) removeObjectFromCell(w.objectCells, previous)
    w.objectCells.objects.set(p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
  }
}

// Grounded combat and airborne impulses share the original person physics.
export function stepLivePhysics(w: World, u: Unit, p: LivePerson) {
  const fighting = p.state === 25 || p.state === 29,
    recovering = p.state === 33
  registerLivePerson(w, p)
  // Ordinary combat still owns browser HP; don't restore an opportunistic hit
  // from the preceding physics snapshot when the defender is being pushed.
  p.life = short(Math.round(u.hp * 20))
  // Ordinary combat physics needs no celebration/order world snapshot.
  let ctx: ReturnType<typeof context> | undefined
  const stateContext = () => (ctx ??= context(w))
  const animate = () => {
    const object = personAnimationObject(p)
    if (object !== -1) setLivePersonAnimation(w, p, object)
  }
  const initialize = () => initializeLivePerson(w, u, stateContext(), p)
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize,
    animation: animate,
    destination: to => replanLivePath(w, u, p, to),
  })
  stepPersonReaction(p)
  markPersonAirborne(w.land, p)
  const collision = collisionWorld(w)
  stepPersonPhysics(
    {
      land: w.land,
      collision,
      gameFlags: w.manaWorld.gameFlags,
      levelFlags: w.manaWorld.levelFlags,
      playerTribe: w.manaWorld.playerTribe,
      buildingModel: id => buildingModel(w.buildings.find(b => b.id === id)!),
      route: outside => {
        const b = w.buildings.find(b => b.id === (collision.cell(p).building & 1023))
        if (!b) throw new Error('Missing building during impulse recovery')
        return outside
          ? buildingOutsidePoint(buildingPose(b))
          : buildingApproachPoint(buildingPose(b), p)
      },
    },
    p,
    {
      insert: to => moveObjectInCells(w.objectCells, p, to),
      sound: cue => sound(w, cue, browserPosition(p)),
      damage: (attacker, amount, mode) => damagePerson(p, w.levelFlags2, attacker, amount, mode),
      animation: animate,
      release: () => releasePersonRoute(w.motionRoutes, p),
      initialize,
      allocate: (unitClass, model, _tribe, to) => {
        if (unitClass !== 7 || model !== 3) throw new Error('Unsupported airborne allocation')
        emitGroundSpark(w, to)
      },
      // Reveal, path-group and fight-resumption ownership remain open.
      reveal: () => {},
      path: () => {},
      class3: () => {},
      canFight: () => false,
      readyToFight: () => false,
    }
  )
  if (p.state === 25 || p.state === 29) {
    const group = p.workFlags && w.fights.some(b => b.id === p.workFlags)
    const next = stateAfterFight(
      p,
      w.manaWorld.gameFlags,
      group ? { class: 10, flags2: 0 } : undefined
    )
    if (next && !(p.flags2 & 0x100000)) {
      p.previousState = p.state
      p.state = next
      initialize()
      // Resume the retained native queue; the owning work adapter is adopted below.
      u.fight = null
      if (currentPersonOrder(w.buildingOrders, p)) u.native = p
      else releasePersonRoute(w.motionRoutes, p)
    }
  }
  if (p.state === 33) {
    const tribe = w.manaTribes[p.tribe]
    stepRouteRecovery(
      {
        gameFlags: w.manaWorld.gameFlags,
        loadFlags: w.manaWorld.loadFlags,
        tribe: {
          flags: w.castingTribes[p.tribe].flags,
          flags2: tribe.flags2,
          playerType: tribe.playerType,
        },
      },
      p,
      {
        unsupportedGround: () => unsupportedGround(w.land, p, p.physics),
        adjacentBuilding: () => {
          const cell = (p.y >>> 9) * 128 + (p.x >>> 9)
          return w.land.flags[cell] & 512 ? w.land.buildingIds[cell] & 1023 : 0
        },
        build: option => buildLiveRecoveryRoute(w, u, p, option),
        release: () => releasePersonRoute(w.motionRoutes, p),
        clearFailure: id => clearFailedRoute(w.motionRoutes, id),
        attach: id => attachPersonRoute(w.motionRoutes, p, id, true),
        initialize,
      }
    )
  }
  if (p.state === 26) updateLivePanic(w, u, stateContext(), p)
  if ((fighting || recovering) && p.state === 10) adoptLiveOrders(w, u, p)
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  Object.assign(u, browserPosition(p))
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.hp = p.life / 20
  u.supportHeight = p.supportHeight || undefined
  if (ctx) w.randomState = ctx.state.randomState
}

export function stepLiveImpulse(w: World, u: Unit) {
  const p = u.flight!
  stepLivePhysics(w, u, p)
  if (!(p.flags2 & 0x80000) && u.fight?.action !== 'push') {
    u.flight = undefined
    if (
      u.native === p &&
      ![26, 41, 44].includes(p.state) &&
      !currentPersonOrder(w.buildingOrders, p)
    )
      u.native = null
    u.lift = 0
    if (!supportsFollower(w, u)) u.hp = 0
  }
}

export function stepLiveElectrocution(w: World, u: Unit) {
  const p = u.native!
  if (u.flight) stepLiveImpulse(w, u)
  else stepLivePhysics(w, u, p)
  stepElectrocution(p, (_, object) => setLivePersonAnimation(w, p, object))
  // State 3 is handed to ordinary live death cleanup; its full native corpse
  // lifecycle remains separate from this verified electrocution controller.
}

function updateLivePanic(w: World, u: Unit, ctx: ReturnType<typeof context>, p: LivePerson) {
  const next = stepPersonPanic(p, w.manaWorld.gameFlags, {
    sound: () => {
      p.flags4 = (p.flags4 | 16) >>> 0
      sound(w, 0x51, u, u.id)
    },
    outside: point => {
      const cell = (point.y >> 9) * 128 + (point.x >> 9)
      if (!(w.land.flags[cell] & 512)) return point
      const building = w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
      return building ? { ...point, ...buildingOutsidePoint(buildingPose(building)) } : point
    },
  })
  if (next && !(p.flags2 & 0x100000)) {
    p.previousState = p.state
    p.state = next
    initializeLivePerson(w, u, ctx, p)
    // Keep an owned command through recovery; legacy tasks have no native queue.
    if (!currentPersonOrder(w.buildingOrders, p)) {
      u.native = null
      releasePersonRoute(w.motionRoutes, p)
    }
  }
}

function updateLiveVolcanoPanic(w: World, u: Unit, ctx: ReturnType<typeof context>, p: LivePerson) {
  const next = stepVolcanoPanic(ctx.state, p, w.manaWorld.gameFlags, w.levelFlags2, {
    sound: () => {
      p.flags4 = (p.flags4 | 16) >>> 0
      sound(w, 0x51, u, u.id)
    },
    release: () => releasePersonRoute(w.motionRoutes, p),
    outside: point => {
      const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
      if (!(w.land.flags[cell] & 512)) return point
      const building = w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
      return building ? { ...point, ...buildingOutsidePoint(buildingPose(building)) } : point
    },
  })
  u.burnTrail = p.burnTrail
  u.hp = p.life / 20
  if (next && !(p.flags2 & 0x100000)) changeLivePersonState(w, u, next)
}

// Ground motion is shared by panic, celebration and staged building entry.
export function moveLivePerson(w: World, u: Unit, p: LivePerson) {
  registerLivePerson(w, p)
  const turning = turnPerson(p) // Native class-1 motion precedes its state controller.
  if (p.speed && !(p.flags2 & 0x84000)) {
    const terrain = (x: number, y: number) => terrainPointHeight(w.land, { x, y })
    let speed = p.speed
    const destination = { x: p.turnAngle, y: p.turnY }
    if (p.flags2 & 0x200 && !(p.flags2 & 128) && positionsOverlap(p, 56, destination, 1024))
      speed = Math.min(speed, positionDistance(p, destination))
    const collision = collisionWorld(w)
    const building =
      collision.cell(p).flags & 0x200
        ? w.buildings.find(b => b.id === (collision.cell(p).building & 1023))
        : undefined
    const blocked = (to: { x: number; y: number }) => personStepCollision(collision, p, to)
    if (speed)
      stepMotionRecovery(
        p,
        !!building,
        () => !!buildingBlocksPerson(collision, p, collision.cell(p)),
        outside => {
          if (!building) throw new Error('Missing building during native exit recovery')
          const pose = buildingPose(building)
          return outside ? buildingOutsidePoint(pose) : buildingApproachPoint(pose, p)
        }
      )
    const velocity = { x: 0, y: 0, z: 0 }
    groundVelocity(velocity, p, speed, p.heading, terrain)
    limitPersonVelocity(p.physics, velocity)
    const next = { x: (p.x + velocity.x) & 65535, y: (p.y + velocity.z) & 65535, h: 0 }
    next.h = terrain(next.x, next.y)
    if (speed && blocked(next)) {
      if (turning) Object.assign(next, { x: p.x, y: p.y, h: terrain(p.x, p.y) })
      else recoverGroundObstacle(p, next, !!building, terrain, blocked)
      // Native failed-recovery airborne dispatch remains in the physics work.
    }
    moveObjectInCells(w.objectCells, p, next)
    Object.assign(u, browserPosition(next))
  }
  stepLiveRoute(w, u) // Native routes advance after position, before the state controller.
}

export function stepLivePerson(w: World, u: Unit) {
  // Celebration/panic still accept legacy placement before their physics visit.
  syncLivePersonCells(w)
  const ctx = context(w),
    { state, effects } = ctx
  const p = u.native!
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize: () => initializeLivePerson(w, u, ctx),
    animation: () => {
      const object = personAnimationObject(p)
      if (object !== -1) effects.animation(p, object, true)
    },
    destination: point => replanLivePath(w, u, p, point),
  })
  stepPersonReaction(p)
  moveLivePerson(w, u, p)
  if (p.state === 41) stepCelebration(state, p, effects)
  else if (p.state === 26) {
    updateLivePanic(w, u, ctx, p)
  } else if (p.state === 31) {
    updateLiveVolcanoPanic(w, u, ctx, p)
  } else if (p.state === 10) {
    // Victory followers can resume through an empty order queue. Ordinary live
    // command/vehicle ownership and the remaining state dispatcher are pending.
    const unowned = () => {
      throw new Error('Native live order consumer is not integrated')
    }
    if (p.immediateCommand || p.commands.some(Boolean)) unowned()
    const next = stepPersonOrders(
      {
        orders: { records: [], cursor: 0, active: 0 },
        objects: new Map(),
        landFlags: w.land.landFlags,
        levelFlags2: w.levelFlags2,
        playerTribe: w.manaWorld.playerTribe,
        survivingTribes: () => w.manaTribes.filter(t => t.active && !t.defeatTimer).length,
      },
      p,
      {
        commands: {},
        commandPosition: unowned,
        vehicleDestination: unowned,
        vehicleReady: unowned,
        changeTribe: unowned,
        effectiveTribe: unowned,
        cellObjects: unowned,
        leaveVehicle: () => {
          if (p.vehicle) unowned()
          return false
        },
        outside: to => {
          const cell = ((to.y & 65535) >> 9) * 128 + ((to.x & 65535) >> 9)
          if (!(w.land.flags[cell] & 512)) return to
          const b = w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
          if (!b) return unowned()
          return buildingOutsidePoint(buildingPose(b))
        },
        destination: to => effects.destination(p, to),
        arrival: unowned,
        stop: unowned,
        formation: unowned,
        remove: unowned,
        advance: unowned,
        initialize: () => initializeLivePerson(w, u, ctx),
      }
    )
    if (next && !(p.flags2 & 0x100000)) {
      p.previousState = p.state
      p.state = next
      initializeLivePerson(w, u, ctx)
    }
  } else throw new Error(`Unported live person state ${p.state}`)
  w.randomState = state.randomState
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.cargo = p.cargo / 100
  p.h = nativePosition(w, u).h
}

// Presentation adapter: called after drawing at the selected 24 Hz native rate.
// Native rate configuration and visibility catch-up remain pending.
export function animateLiveObjects(w: World) {
  if (w.paused || w.land.landFlags & 2) return
  for (const u of w.units) {
    const source = unitAnimationSource(u)
    if (source) {
      // Command 27 polls the final frame at 12 Hz. Keep it observable when the
      // elapsed 24 Hz animation clock would otherwise wrap past that visit.
      const p = u.native
      if (
        source === p &&
        p.state === 10 &&
        p.commandStatus === 27 &&
        p.substate === 2 &&
        !p.f1 &&
        p.f2 === sprites.frameCounts[p.object] - 1
      )
        continue
      stepObjectAnimation(
        source,
        { counter: 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] },
        () => stampFootprints(w.footprints, source.x, source.y)
      )
    } else if (
      !(w.levelFlags2 & 0x10000) &&
      u.hp > 0 &&
      u.inside === null &&
      u.kind !== 'shaman' &&
      ['walk', 'carry'].includes(unitAnimation(w, u))
    ) {
      // Ordinary browser movement still owns its animation state. Use the same
      // 24 Hz emission cadence as its native walk/carry object, not render FPS.
      const p = nativePosition(w, u)
      stampFootprints(w.footprints, p.x, p.y)
    }
  }
  for (const f of w.effects)
    if (f.animation)
      stepObjectAnimation(
        f.animation,
        { counter: 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] },
        () => {}
      )
}
