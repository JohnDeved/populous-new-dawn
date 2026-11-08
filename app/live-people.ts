import { launchFirewarriorPoint } from './firewarrior-point.ts'
import { unitRenderAnimationSource } from './unit-animation-source.ts'
import { discardInvalidResident, residentPerson } from './building-resident.ts'
import { deselectLiveVehiclePassengers } from './live-vehicles.ts'
import { latchShamanDeathFrame } from './shaman-death-vfx.ts'
import { latchFollowerCorpseFrame } from './follower-corpse-animation.ts'
import { buildingPose } from './building-shapes.ts'
import { liveBuildingModel, liveBuildingShape } from './live-building-shapes.ts'
import { effect, emitGroundSpark, requestTutorial, sound } from './world-effects.ts'
import { releaseTasks } from './world-tasks.ts'
import { initializeRouteRecovery, stepRouteRecovery } from './person-route-recovery.ts'
import {
  initializeLiveIdleApproach,
  rebuildLiveRestingSlots,
  stepLiveRestingState,
} from './live-resting.ts'
import { initializeRestingPerson } from './person-idle.ts'
import { facePersonCasting, initializePersonCasting, stepPersonCasting } from './person-casting.ts'
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
import { ownedSettlementObjects } from './live-settlement.ts'
export { cancelBuildingEntry } from './live-building-entry.ts'
import {
  type World,
  type Unit,
  nativePosition,
  browserPosition,
  unitAnimationSource,
  unitAnimation,
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
  regeneratePersonHealth,
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
  animationUsesLogicalVisits,
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
  stepOwnedPersonPhysics,
  type PhysicsPerson,
} from './person-physics.ts'
import { terrainPointHeight } from './native-terrain.ts'
import {
  setCellObject,
  deleteCellObject,
  insertObjectIntoCell,
  removeObjectFromCell,
  moveObjectInCells,
  objectsInCell,
  type CellObject,
} from './object-cells.ts'
import { positionDistance, random } from './native-math.ts'
import { maxHp } from './world-rules.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }
import { initializeSpecialBattle } from './special-battle.ts'

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
    // Public G retains this exact owner until its deferred order/state visit.
    // Optional so legacy boolean-guard checkpoints keep their original policy.
    guardInputPending?: boolean
  }
const short = (n: number) => (n << 16) >> 16
// Bootstrap the existing browser follower at the handoff to native controllers.
// Legacy orders/physics are not native records; their full migration is pending.
export function createLivePerson(w: World, u: Unit, pos = nativePosition(w, u)): LivePerson {
  const model = nativePersonModel(u)
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
    // 0x4d23ed supplies the logical animation gate. Keep models outside the
    // verified ordinary-person range on their existing adapter.
    flags3:
      (model >= 2 && model <= 7 ? 0x40000 : 0) |
      (u.shield ? 0x8000 : 0) |
      (u.bloodlust ? 0x80000 : 0),
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
    disguise: model === 5 ? (tribeForTeam(u.team) << 6) & 255 : 0,
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
export function stepLivePersonHealth(w: World, deferred?: ReadonlySet<Unit>) {
  for (const u of w.units) {
    if (deferred?.has(u)) continue
    discardInvalidResident(w, u)
    if (u.hp <= 0) continue
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person
    if (p && (rules.personStateFlags[p.state] & 1 || p.flags2 & 0x80000)) continue

    const resident = residentPerson(w, u),
      maxLife = short(Math.round(maxHp(u.kind) * 20)),
      health = {
        model: p?.model ?? nativePersonModel(u),
        life: short(Math.round(u.hp * 20)),
        maxLife,
        healthMarker: 0,
        flags3: p?.flags3 ?? resident?.flags3 ?? 0,
      }
    if (w.manaWorld.gameFlags & 128) health.life = maxLife
    else regeneratePersonHealth(health, w.turn)

    u.hp = health.life / 20
    if (p) {
      p.life = health.life
      p.flags3 = health.flags3
    }
    if (resident) {
      resident.life = health.life
      resident.flags3 = ((resident.flags3 & ~0x1000) | (health.flags3 & 0x1000)) >>> 0
    }
  }
}

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
        setCellObject(w.objectCells, p.id, p)
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
  invalidateLivePersonPass(w)
  return reconcileLivePersonCells(w)
}

function reconcileLivePersonCells(w: World) {
  const units = w.units.filter(
    u =>
      (u.flight || u.fight?.motion || u.native || u.entry) &&
      (u.hp > 0 || u.flight || u.native?.state === 44)
  )
  // Finish eligibility before reading owners, as in the legacy filter/map boundary.
  // The snapshot stays fresh without allocating a temporary entry tuple per person.
  const people = new Map<number, LivePerson>()
  for (const u of units)
    people.set(u.id, (u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person)!)
  for (const [id, p] of w.objectCells.objects)
    if (people.get(id) !== p) {
      if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
      deleteCellObject(w.objectCells, id)
    }
  for (const u of w.units) publishLivePersonCell(w, u, people.get(u.id))
  return people
}

function publishLivePersonCell(w: World, u: Unit, p: LivePerson | undefined) {
  // Preserve the native display offset across ordinary browser order handoff.
  // Occupancy freezes physics; ordinary movement resumes the native support check.
  const offset = p?.supportHeight ?? u.supportHeight
  if (offset && !((p?.flags2 ?? 0) & 0x4000)) {
    const point = nativePosition(w, u),
      cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9),
      flags = w.land.flags[cell]
    const model = flags & 512 ? liveBuildingModel(w, w.land.buildingIds[cell] & 1023) : 0
    const value = personSupportHeight(offset, flags, model)
    if (p) p.supportHeight = value
    u.supportHeight = value || undefined
  }
  if (!p) return
  if (!w.objectCells.objects.has(p.id)) {
    setCellObject(w.objectCells, p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
  }
  // Vehicle attachment owns seated height/position independently of the
  // animation-source projection (command22 is not an on-foot pose owner).
  if (u.flight || u.fight?.motion || p.vehicle) return
  syncBrowserPersonPosition(w, u, p)
}

interface PersonEpisode {
  people: Map<number, LivePerson>
  units: World['units']
  unitCount: number
  turn: number
  cells: World['objectCells']
  objects: World['objectCells']['objects']
  heads: World['objectCells']['heads']
  land: World['land']
  heights: World['land']['heights']
  flags: World['land']['flags']
  buildingIds: World['land']['buildingIds']
  terrain: World['terrain']
  terrainVersion: number
  landVersion: number
  buildings: World['buildings']
  shrines: World['shrines']
  pending?: Unit
}
interface PersonPass {
  generation: number
  busy: boolean
  episode?: PersonEpisode
}
const livePersonPasses = new WeakMap<World, PersonPass>()

function invalidateLivePersonPass(w: World) {
  const pass = livePersonPasses.get(w)
  if (pass) {
    pass.generation++
    pass.episode = undefined
  }
}

// Only the ordinary on-foot, unrouted celebration body is owned here. These
// guards exclude preparation/occupancy callbacks BEFORE they can mutate other
// people. Other states and callers retain the unconditional public reconciler.
function ownsCelebrationVisit(w: World, u: Unit) {
  const p = u.native
  return !!(
    w.land.landFlags & 0x2000000 &&
    u.hp > 0 &&
    p?.state === 41 &&
    !u.flight &&
    !u.fight &&
    !u.entry &&
    !u.builder &&
    !p.vehicle &&
    !w.pathfinding.people.has(u.id) &&
    !(p.flags2 & 16) &&
    !(p.flags2 & 0x80000000 && !(p.flags2 & 128)) &&
    !(p.substate === 0 && p.flags2 & 0x40000000 && p.flags2 & 0x800000)
  )
}

function episodeIsCurrent(w: World, episode: PersonEpisode) {
  return (
    episode.units === w.units &&
    episode.unitCount === w.units.length &&
    episode.turn === w.turn &&
    episode.cells === w.objectCells &&
    episode.objects === w.objectCells.objects &&
    episode.heads === w.objectCells.heads &&
    episode.land === w.land &&
    episode.terrain === w.terrain &&
    episode.heights === w.land.heights &&
    episode.flags === w.land.flags &&
    episode.buildingIds === w.land.buildingIds &&
    episode.terrainVersion === w.terrainVersion &&
    episode.landVersion === w.landVersion &&
    episode.buildings === w.buildings &&
    episode.shrines === w.shrines
  )
}

// A synchronous scheduler capability, never serialized or reused across turns.
// next() ends a run before another controller; close() deliberately does NOT
// publish pending changes. Publication stays at the old previsit/lazy-read sites.
export function beginLivePersonPass(w: World) {
  invalidateLivePersonPass(w)
  const pass: PersonPass = { generation: 0, busy: false }
  livePersonPasses.set(w, pass)
  const current = () => livePersonPasses.get(w) === pass
  const stop = () => {
    if (current()) invalidateLivePersonPass(w)
  }
  return {
    next(u: Unit) {
      if (!ownsCelebrationVisit(w, u)) stop()
    },
    stop,
    close() {
      if (current()) {
        stop()
        livePersonPasses.delete(w)
      }
    },
    step(u: Unit) {
      if (!current() || pass.busy || !ownsCelebrationVisit(w, u)) {
        stop()
        stepLivePerson(w, u)
        return
      }
      pass.busy = true
      const { generation } = pass
      let first = true
      const synchronize = () => {
        if (!current() || pass.generation !== generation || !ownsCelebrationVisit(w, u))
          return syncLivePersonCells(w)
        let { episode } = pass
        if (
          episode &&
          (!episodeIsCurrent(w, episode) ||
            episode.people.get(u.id) !== u.native ||
            (episode.pending &&
              (!ownsCelebrationVisit(w, episode.pending) ||
                episode.people.get(episode.pending.id) !== episode.pending.native)))
        ) {
          stop()
          return syncLivePersonCells(w)
        }
        if (episode) {
          // Earlier roster visits publish before this visit's lazy read. The
          // immutable membership Map is private; its values remain live aliases.
          if (episode.pending && episode.pending !== u)
            publishLivePersonCell(w, episode.pending, episode.people.get(episode.pending.id))
          publishLivePersonCell(w, u, episode.people.get(u.id))
        } else {
          const people = reconcileLivePersonCells(w)
          // Reentry during initialization cannot reactivate the outer run.
          if (!first || !current() || pass.generation !== generation) return people
          const ids = new Set<number>()
          for (const unit of w.units) {
            if (ids.has(unit.id) || (people.has(unit.id) && people.get(unit.id)!.id !== unit.id)) {
              stop()
              return people
            }
            ids.add(unit.id)
          }
          if (!current() || pass.generation !== generation) return people
          episode = {
            people,
            units: w.units,
            unitCount: w.units.length,
            turn: w.turn,
            cells: w.objectCells,
            objects: w.objectCells.objects,
            heads: w.objectCells.heads,
            land: w.land,
            terrain: w.terrain,
            heights: w.land.heights,
            flags: w.land.flags,
            buildingIds: w.land.buildingIds,
            terrainVersion: w.terrainVersion,
            landVersion: w.landVersion,
            buildings: w.buildings,
            shrines: w.shrines,
          }
          pass.episode = episode
        }
        episode.pending = undefined
        first = false
        return episode.people
      }
      try {
        stepLivePersonBody(w, u, synchronize)
        if (current() && pass.generation === generation && pass.episode) pass.episode.pending = u
      } catch (error) {
        stop()
        throw error
      } finally {
        pass.busy = false
      }
    },
  }
}

// Publish an ordinary browser-owned step before a later controller can adopt
// this same physical person. Flight, combat and seats already own native poses.
export function syncBrowserPersonPosition(w: World, u: Unit, p: LivePerson) {
  if (u.flight || u.fight?.motion || p.vehicle) return
  const to = nativePosition(w, u)
  to.x &= 65535
  to.y &= 65535
  // Keep the existing epilogue's native-height ownership on unchanged XY.
  if (unitAnimationSource(u) === p)
    to.h = to.x === p.x && to.y === p.y ? p.h : terrainPointHeight(w.land, to)
  if (to.x !== p.x || to.y !== p.y || to.h !== p.h) moveObjectInCells(w.objectCells, p, to)
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

function context(w: World, synchronize = () => syncLivePersonCells(w)) {
  let people: Map<number, LivePerson> | undefined
  const state = {
    randomState: w.randomState,
    get people() {
      return (people ??= synchronize())
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
      w.trees.push({
        ...(w.scenerySource ? { authoredSlot: null, sceneryBirth: 'loose-log' as const } : {}),
        id: w.nextId++,
        ...browserPosition(pos),
        logs: 1,
        model: 11,
      })
      return true
    },
    sound: (p, cue) => sound(w, cue, browserPosition(p)),
    leaveBuilding: person => {
      leaveLiveBuilding(
        w,
        w.units.find(u => u.id === person.id)!
      )
    },
    projectile: (person, to) => {
      const source = w.units.find(u => u.id === person.id)!
      revealUnitInvisibility(w, source)
      launchFirewarriorPoint(w, source, person as LivePerson, to, { effect, sound })
    },
  }
  return { state, effects }
}

function initializeLivePerson(w: World, u: Unit, ctx: ReturnType<typeof context>, p = u.native!) {
  const { state, effects } = ctx
  // Only state-14 entry/exit reads its own tribe's selection count. Capture it
  // before initialization callbacks can deselect passengers or start new states.
  let selectedCount = 0
  if (w.selected.length && (p.state === 14 || p.previousState === 14)) {
    const selected = new Set(w.selected)
    for (const unit of w.units)
      if (unit.native?.tribe === p.tribe && selected.has(unit.id)) selectedCount++
  }
  const tribes = w.manaTribes.map((t, i) => ({
    x: 0,
    y: 0,
    angle: 0,
    selectedCount: i === p.tribe ? selectedCount : 0,
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
    casting: () =>
      initializePersonCasting(p, !!castingCellObject(w, p), (person, object) =>
        setLivePersonAnimation(w, person as LivePerson, object)
      ),
    routeRecovery: () => initializeLiveRouteRecovery(w, p),
    encounter: () => initializeGroundCombat(w, p),
    fight: () => initializeGroundCombat(w, p),
    specialBattle: () => {
      const arena = w.effects.find(fx => fx.armageddon)
      if (!arena?.armageddon) throw new Error('Missing Armageddon controller')
      initializeSpecialBattle(
        {
          randomState: state.randomState,
          center: nativePosition(w, arena),
          directions: arena.armageddon.directions,
          populations: arena.armageddon.populations,
        },
        p,
        {
          leaveVehicle: () => {
            u.inside = null
            p.vehicle = 0
          },
          insert: point => {
            registerLivePerson(w, p)
            moveObjectInCells(w.objectCells, p, point)
            Object.assign(u, browserPosition(point))
          },
          height: point => terrainPointHeight(w.land, point),
          allocate: (_unitClass, _model, _tribe, point) => {
            const visual = effect(w, 'trail', browserPosition(point))
            visual.sprite = { sequence: 'sparkle', frame: 0 }
            visual.duration = 15 / 12
            visual.animation = {
              object: 0,
              draw: 0,
              morph: 0,
              palette: 0,
              renderFlags: 0,
              f1: 0,
              f2: 0,
              stamp: 0,
              flags3: 0,
              morphTimer: 0,
              morphFrames: 0,
            }
            return Object.assign(visual.animation, { flags2: 0, state: 0, duration: 15 })
          },
          initializeEffect: () => {},
          releaseMotion: () => releasePersonRoute(w.motionRoutes, p),
          setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
        }
      )
    },
    celebrate: () => stepCelebration(state, p, effects),
    setAnimation: (p, o) => effects.animation(p as LivePerson, o, true),
    releaseMotion: p => effects.releaseMotion(p as LivePerson),
    deselectPassengers: person => deselectLiveVehiclePassengers(w, person),
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
        [3, 6, 7, 8, 10, 11, 15, 16, 17, 18, 19, 21, 22, 25, 27, 28, 30, 31, 32, 33].includes(
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

function castingCellObject(w: World, point: { x: number; y: number }) {
  const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
  return w.land.flags[cell] & 512
    ? liveBuildingShape(w, w.land.buildingIds[cell] & 1023)
    : undefined
}

// Share the actual physical/animation owner rather than creating a new cast
// pose or reinitializing the AI's combat owner a second time.
export function beginLiveCasting(w: World, u: Unit, target: { x: number; y: number }) {
  const p =
    u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person ?? createLivePerson(w, u)
  u.native = p
  registerLivePerson(w, p)
  syncBrowserPersonPosition(w, u, p)
  changeLivePersonState(w, u, 22, p)
  if (p.state === 22 && u.fight?.motion === p) u.fight = null
  facePersonCasting(p, target)
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
}

export function stepLiveCasting(w: World, u: Unit, p: LivePerson) {
  stepLivePhysics(w, u, p)
  // Preparation can replace state 22. Do not tick the replacement state's
  // timer a second time or finish a cast that no longer owns this visit.
  if (p.state !== 22) return
  stepPersonCasting(p, w.manaWorld.gameFlags, {
    animation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
    destination: point => setDirectPersonDestination(w.motionRoutes, p, point),
    outside: point => {
      const shape = castingCellObject(w, point)
      return shape ? buildingOutsidePoint(shape) : point
    },
    release: () => releasePersonRoute(w.motionRoutes, p),
    initialize: next => changeLivePersonState(w, u, next, p),
  })
}

export function initializeLivePanic(
  w: World,
  u: Unit,
  p = u.flight ?? u.native ?? createLivePerson(w, u),
  transitioned = false,
  entryOrders: 'cancel' | 'preserve' = 'cancel'
) {
  if (p.flags2 & 0x100000) return
  cancelBuildingEntry(w, u, entryOrders === 'preserve')
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
  const prison =
      tribe !== w.manaWorld.playerTribe && w.buildings.find(b => b.kind === 'prison' && b.hp > 0),
    captive =
      prison &&
      w.units.find(
        u =>
          u.inside === prison.id &&
          u.team === teamForTribe(w.manaWorld.playerTribe) &&
          u.kind === 'shaman' &&
          u.hp > 0
      )
  const units = new Map<number, Unit>()
  const people: LivePerson[] = []
  // Retain legacy placement until exact native ownership is available.
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
  // 00511f70 consumes the retained person chain before its inclusive kill cap.
  // Project only exact owned objects into existing slots; snapshot before release.
  const linked: LivePerson[] = []
  for (const object of objectsInCell(w.objectCells, ((point.x >>> 8) & 254) | (point.y & 0xfe00))) {
    const person = people.find(candidate => candidate === object)
    if (person) linked.push(person)
  }
  const owned = new Set(linked)
  let next = 0
  // Ambiguous duplicate roster owners retain the previous fallback unchanged.
  if (people.filter(person => owned.has(person)).length === linked.length)
    for (const [index, person] of people.entries())
      if (owned.has(person)) people[index] = linked[next++]
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
  // 00511f70 handles the state-42 captive after the capped cell traversal.
  // This forced state-3 consequence bypasses the ordinary immunity/kill budget.
  if (captive) {
    const p = leaveLiveBuilding(w, captive)
    if (p) {
      releaseTasks(w, captive)
      p.flags2 = (p.flags2 & ~0x100000) >>> 0
      p.previousState = 42 // Prison occupancy is the live adapter for native state 42.
      p.state = 3
      captive.native = p
      if (p.tribe !== -1 && tribe !== -1) p.damageAttacker = tribe
      // Hand state 3 to existing live death cleanup, as electrocution does.
      // This is an adapter handoff, not a life write by native 004da0d0.
      p.life = 0
      captive.hp = 0
      w.selected = w.selected.filter(id => id !== captive.id)
    }
  }
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
  // 00408840 assigns panic/trail RNG in each socket's retained cell order.
  // Preserve this adapter's snapshot and legacy slots across repeated sockets.
  for (const [cell, people] of cells) {
    const linked: LivePerson[] = []
    for (const object of objectsInCell(w.objectCells, ((cell & 127) << 1) | ((cell >>> 7) << 9))) {
      const person = people.find(candidate => candidate === object)
      if (person) linked.push(person)
    }
    const owned = new Set(linked)
    let next = 0
    // Ambiguous duplicate owners retain the prior fallback unchanged.
    if (people.filter(person => owned.has(person)).length === linked.length)
      for (const [index, person] of people.entries())
        if (owned.has(person)) people[index] = linked[next++]
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
      for (const shrine of w.shrines)
        if (shrine.kind === 'vault' && shrine.model)
          objects.set(shrine.id, {
            ...nativePosition(w, shrine),
            class: 2,
            state: 2,
            flags2: 0,
            tribe: 255,
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

// 0x518480/0x5184e0. Ordinary outdoor fight entry uses this grounding after
// releasing its old work.
function initializeGroundCombat(w: World, p: LivePerson) {
  if (p.model === 5) p.disguise = (p.tribe << 6) & 255
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
    // 0x51e150 adopts the person's current physical position. Legacy walking
    // publishes browser XY before the final cell epilogue; reconcile only that
    // ordinary owner here, without changing route advancement or native owners.
    if (p === u.native && !u.entry && !u.builder?.person) syncBrowserPersonPosition(w, u, p)
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
  // Native substate7 retains both counters from the processed recoil entry.
  // Only a pose without that owner still needs the existing elapsed-time adapter.
  if (!u.fight?.nativeRecoilAnimation) {
    setLivePersonAnimation(w, p, meleeAnimationObject(u.kind, 'recoil'))
    p.f1 = 1
    const elapsed = w.time - (u.fight?.started ?? w.turn) / 12
    p.f2 = Math.min(
      sprites.frameCounts[p.object] - 1,
      Math.max(0, Math.floor(elapsed * sprites.fps))
    )
  }
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
    setCellObject(w.objectCells, p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
  }
}

// Grounded combat and airborne impulses share the original person physics.
export function stepLivePhysics(w: World, u: Unit, p: LivePerson, initializeOwner?: () => void) {
  stepLivePhysicsImpl(w, u, p, false, initializeOwner)
}

function stepLivePhysicsImpl(
  w: World,
  u: Unit,
  p: LivePerson,
  ownedImpulse = false,
  initializeOwner?: () => void
) {
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
  const initialize = () => {
    if (!initializeOwner) return initializeLivePerson(w, u, stateContext(), p)
    // The entry initializer commits its own RNG context. Synchronize either
    // direction if a physics consumer already opened the ordinary context.
    if (ctx) w.randomState = ctx.state.randomState
    initializeOwner()
    if (ctx) ctx.state.randomState = w.randomState
  }
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize,
    animation: animate,
    destination: to => replanLivePath(w, u, p, to),
  })
  stepPersonReaction(p)
  markPersonAirborne(w.land, p)
  const collision = collisionWorld(w)
  const stepPhysics: typeof stepPersonPhysics = ownedImpulse
    ? (world, person, effects, mask) =>
        stepOwnedPersonPhysics(
          world,
          person,
          effects,
          () => ownedSettlementObjects(w, p, collision),
          mask
        )
    : stepPersonPhysics
  stepPhysics(
    {
      land: w.land,
      collision,
      gameFlags: w.manaWorld.gameFlags,
      levelFlags: w.manaWorld.levelFlags,
      playerTribe: w.manaWorld.playerTribe,
      buildingModel: id => {
        const model = liveBuildingModel(w, id)
        if (!model) throw new Error('Missing building during impulse recovery')
        return model
      },
      route: outside => {
        const shape = liveBuildingShape(w, collision.cell(p).building & 1023)
        if (!shape) throw new Error('Missing building during impulse recovery')
        return outside ? buildingOutsidePoint(shape) : buildingApproachPoint(shape, p)
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
  // 0x4d32de: seated ownership clears these bits after preparation/physics,
  // before ordinary person-state dispatch. The falling-animation bit survives.
  if (p.vehicle) p.flags2 = (p.flags2 & ~0x82000) >>> 0
  // Native dispatch selects the current state once after physics. A state
  // controller transition must not cause another controller visit this turn.
  const resting = p.state === 1 || p.state === 17 || p.state === 19
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
  if (ctx) w.randomState = ctx.state.randomState
  if (resting) {
    stepLiveRestingState(w, u, p)
    u.cargo = p.cargo / 100
  }
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  Object.assign(u, browserPosition(p))
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.hp = p.life / 20
  u.supportHeight = p.supportHeight || undefined
}

// Publish the existing voluntary vehicle-launch physics/animation owner.
export function publishLiveVehicleLaunch(w: World, p: LivePerson) {
  const unit = w.units.find(u => u.id === p.id)
  if (!unit) return
  // Expose the ordinary physics owner without destruction's extra flags.
  unit.flight = p
  unit.lift = 1
  setLivePersonAnimation(w, p, rules.personAnimationObjects[(p.cargo ? 4 : 7) * 9 + p.model])
  if (!p.cargo) {
    p.f2 = 0
    p.f1 = rules.animationDescriptors[p.draw].hold
  }
  p.assignment |= 128
  p.slowTurn =
    ((sprites.frameCounts[p.object] * (rules.animationDescriptors[p.draw].step + 1)) << 24) >> 24
}

// 0x4d32de clears impulse/airborne flags for a seated person and continues
// state dispatch. A retained departure wrapper must not steal that visit.
export function resumeLiveSeatedFlight(u: Unit) {
  const p = u.flight
  // Settled seats freeze physics (0x4e6d00). Other flight owners keep their
  // ordinary physics visit, including a vehicle transition not yet seated.
  if (!p || u.native !== p || p.state !== 10 || !p.vehicle || !(p.flags2 & 0x4000)) return false
  u.flight = undefined
  u.lift = 0
  return true
}

export function stepLiveImpulse(w: World, u: Unit) {
  stepLiveImpulseImpl(w, u)
}

// Scheduler-owned plain records only. Direct/exotic callers keep the public
// eager path. No snapshot or permission to skip escapes this one physics visit.
export function stepOwnedLiveImpulse(w: World, u: Unit) {
  stepLiveImpulseImpl(w, u, true)
}

function stepLiveImpulseImpl(w: World, u: Unit, owned = false) {
  const p = u.flight!
  stepLivePhysicsImpl(w, u, p, owned)
  // Voluntary vehicle exits can be airborne through the live impulse flag
  // without destruction's forced-airborne bit. Keep their physics owner to landing.
  if (!(p.flags2 & 0x80000) && !(p.flags4 & 0x400) && u.fight?.action !== 'push') {
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
      const shape = liveBuildingShape(w, w.land.buildingIds[cell] & 1023)
      return shape ? { ...point, ...buildingOutsidePoint(shape) } : point
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
    } else if (p.state === 10) adoptLiveOrders(w, u, p)
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
      const shape = liveBuildingShape(w, w.land.buildingIds[cell] & 1023)
      return shape ? { ...point, ...buildingOutsidePoint(shape) } : point
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
    const shape =
      collision.cell(p).flags & 0x200
        ? liveBuildingShape(w, collision.cell(p).building & 1023)
        : undefined
    const blocked = (to: { x: number; y: number }) => personStepCollision(collision, p, to)
    if (speed)
      stepMotionRecovery(
        p,
        !!shape,
        () => !!buildingBlocksPerson(collision, p, collision.cell(p)),
        outside => {
          if (!shape) throw new Error('Missing building during native exit recovery')
          return outside ? buildingOutsidePoint(shape) : buildingApproachPoint(shape, p)
        }
      )
    const velocity = { x: 0, y: Math.max(0, short(p.velocity.y)), z: 0 }
    groundVelocity(velocity, p, speed, p.heading, terrain)
    limitPersonVelocity(p.physics, velocity)
    const next = { x: (p.x + velocity.x) & 65535, y: (p.y + velocity.z) & 65535, h: 0 }
    next.h = terrain(next.x, next.y)
    if (speed && blocked(next)) {
      if (turning) Object.assign(next, { x: p.x, y: p.y, h: terrain(p.x, p.y) })
      else if (
        !recoverGroundObstacle(p, next, !!shape, terrain, blocked) &&
        unsupportedGround(w.land, p, p.physics)
      ) {
        // 0x4e7193: retain this ground step's limited velocity, not an old combat
        // impulse. Shared physics owns the next visit; do not visit it twice.
        Object.assign(p.velocity, velocity)
        p.flags2 = (p.flags2 | 0x80000) >>> 0
        u.flight = p
      }
    }
    moveObjectInCells(w.objectCells, p, next)
    Object.assign(u, browserPosition(next))
  }
  stepLiveRoute(w, u) // Native routes advance after position, before the state controller.
}

export function stepLivePerson(w: World, u: Unit) {
  stepLivePersonBody(w, u, () => syncLivePersonCells(w))
}

function stepLivePersonBody(w: World, u: Unit, synchronize: () => Map<number, LivePerson>) {
  // Celebration/panic still accept legacy placement before their physics visit.
  synchronize()
  const ctx = context(w, synchronize),
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
          const shape = liveBuildingShape(w, w.land.buildingIds[cell] & 1023)
          if (!shape) return unowned()
          return buildingOutsidePoint(shape)
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

// The native processor stamps ordinary people/Splash before their gated animation
// visit. In the elapsed-time adapter, each completed logical turn owns that visit;
// ungated branches and other families retain the existing 24 Hz presentation owner.
export function animateLiveObjects(w: World, phase: 'logical' | 'presentation' = 'presentation') {
  if (w.paused || w.land.landFlags & 2) return
  for (const shrine of w.shrines)
    if (phase === 'presentation' && shrine.active && shrine.knowledgeGlow) {
      // Native draws before advancing; retain that visible sample on this boundary.
      shrine.knowledgeGlow.displayedFrame = (shrine.knowledgeGlow.f1 & 65535) >>> 2
      stepObjectAnimation(
        shrine.knowledgeGlow,
        { counter: 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: [], modelFrames: [], morphDurations: [] },
        () => {}
      )
    }
  for (const u of w.units) {
    const source = unitRenderAnimationSource(u)
    if (source) {
      const logical = source.model >= 2 && source.model <= 7 && animationUsesLogicalVisits(source)
      if (logical !== (phase === 'logical')) continue
      // Ownership is independent of eligibility: state0/removed gated records
      // must not fall back to presentation visits while waiting for a controller.
      if (logical && (source.class !== 1 || !source.state)) continue
      // Only the legacy presentation path needs the old final-frame hold.
      // Logical visits leave command27's final frame for its next controller poll.
      const p = u.native
      if (
        !logical &&
        source === p &&
        p.state === 10 &&
        p.commandStatus === 27 &&
        p.substate === 2 &&
        !p.f1 &&
        p.f2 === sprites.frameCounts[p.object] - 1
      )
        continue
      if (logical) source.stamp = w.turn
      stepObjectAnimation(
        source,
        { counter: logical ? w.turn : 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] },
        () => stampFootprints(w.footprints, source.x, source.y)
      )
    } else if (
      phase === 'presentation' &&
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
  for (const f of w.effects) {
    const logical = !!(
      f.kind === 'splash' &&
      f.animation &&
      animationUsesLogicalVisits(f.animation)
    )
    if (logical !== (phase === 'logical')) continue
    if (f.reincarnation) latchShamanDeathFrame(f)
    if (f.corpse) latchFollowerCorpseFrame(f)
    const knowledgeGlow = f.sprite?.sequence === 'vault-knowledge-glow' ? f.sprite : undefined,
      retired = knowledgeGlow && f.kind === 'gift' && 'phase' in f && !f.phase
    if (f.animation && knowledgeGlow && !retired)
      knowledgeGlow.frame = (f.animation.f1 & 65535) >>> 2
    if (f.animation && !retired) {
      if (logical) f.animation.stamp = w.turn
      stepObjectAnimation(
        f.animation,
        { counter: logical ? w.turn : 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] },
        () => {}
      )
    }
  }
}
