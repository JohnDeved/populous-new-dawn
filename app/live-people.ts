import { cancelBuildingEntry, leaveBuildingEntry } from './live-building-entry.ts'
export { cancelBuildingEntry } from './live-building-entry.ts'
import {
  type World,
  type Unit,
  nativePosition,
  browserPosition,
  height,
  buildingPose,
  sound,
  unitAnimationSource,
  buildingModel,
  supportsFollower,
  emitGroundSpark,
} from './model.ts'
import {
  initializePersonState,
  personAnimationObject,
  type StatefulPerson,
} from './person-state.ts'
import { damagePerson, preparePersonTurn, stepPersonReaction } from './person-update.ts'
import { stepPersonPanic, ignitePeopleInFireCell } from './person-panic.ts'
import { stepPersonOrders } from './person-order-update.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
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
    damageAttacker: number
    burnTrail: number
  }
const short = (n: number) => (n << 16) >> 16

// Bootstrap the existing browser follower at the handoff to native state 41.
// Legacy orders/physics are not native records; their full migration is pending.
export function createLivePerson(w: World, u: Unit): LivePerson {
  const pos = nativePosition(w, u),
    model = u.team === 'wild' ? 1 : u.kind === 'shaman' ? 7 : u.kind === 'warrior' ? 3 : 2
  const selected = w.selected.includes(u.id),
    angle = Math.round(((Math.PI - u.heading) * 1024) / Math.PI) & 2047
  return {
    id: u.id,
    class: 1,
    model,
    state: selected ? 14 : 10,
    previousState: 0,
    substate: 0,
    tribe: u.team === 'wild' ? -1 : u.team === 'blue' ? 0 : 1,
    x: pos.x & 65535,
    y: pos.y & 65535,
    h: pos.h,
    anchorX: pos.x & 65535,
    anchorY: pos.y & 65535,
    counter: (w.turn - 1) & 255,
    flags2: u.inside === null ? 0 : 0x800000,
    flags3: selected ? 128 : 0,
    flags4: 0x20000000,
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
    renderFlags: 0,
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
    damageAttacker: 255,
    burnTrail: u.burnTrail ?? 0,
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
      .filter(u => (u.flight || u.native || u.entry) && (u.hp > 0 || u.flight))
      .map(u => [u.id, (u.flight ?? u.native ?? u.entry?.person)!])
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
    if (u.flight) continue
    const to = nativePosition(w, u)
    to.x &= 65535
    to.y &= 65535
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
  const people = syncLivePersonCells(w)
  const state = {
    randomState: w.randomState,
    people,
    shamans: w.manaTribes.map(
      (_, i) =>
        w.units.find(
          u =>
            u.hp > 0 &&
            u.kind === 'shaman' &&
            u.team === (i === 0 ? 'blue' : i === 1 ? 'red' : null)
        )?.id ?? 0
    ),
    cellPeople: (c: number) => [...objectsInCell(w.objectCells, c)].map(p => people.get(p.id)!),
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

function initializeLivePerson(
  w: World,
  u: Unit,
  { state, effects }: ReturnType<typeof context>,
  p = u.native!
) {
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
    orders: { records: [], cursor: 0, active: 0 },
  })
  const unexpected = () => {
    throw new Error('Legacy handoff contains an unowned native assignment')
  }
  initializePersonState(initWorld, p, {
    celebrate: () => stepCelebration(state, p, effects),
    setAnimation: (p, o) => effects.animation(p as LivePerson, o, true),
    releaseMotion: p => effects.releaseMotion(p as LivePerson),
    deselectPassengers: unexpected,
    rebuildTrainingQueue: unexpected,
    rebuildFormation: unexpected,
    startOrders: p => {
      if (p.immediateCommand || p.commands[p.commandCursor]) unexpected()
    },
  })
  tribes.forEach((t, i) => {
    w.manaTribes[i].flags2 = t.flags
  })
  u.cargo = p.cargo / 100
}

export function initializeLivePanic(w: World, u: Unit) {
  const p = u.flight ?? u.native ?? createLivePerson(w, u)
  if (p.flags2 & 0x100000) return
  cancelBuildingEntry(w, u)
  u.native = p
  p.previousState = p.state
  p.state = 26
  const ctx = context(w)
  initializeLivePerson(w, u, ctx)
  w.selected = w.selected.filter(id => id !== u.id)
  w.randomState = ctx.state.randomState
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
  const objects = new Map<number, CollisionObject>()
  for (const b of w.buildings)
    objects.set(b.id, {
      ...nativePosition(w, b),
      class: 2,
      state: b.progress === 1 ? 2 : 1,
      flags2: 0,
      tribe: b.team === 'blue' ? 0 : 1,
      related: 0,
    })
  for (const u of w.units)
    objects.set(u.id, {
      ...nativePosition(w, u),
      class: 1,
      state: u.native?.state ?? 10,
      flags2: u.hp > 0 ? (u.native?.flags2 ?? 0) : 1,
      tribe: u.team === 'blue' ? 0 : 1,
      related: 0,
    })
  return {
    objects,
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

// Native impulse/airborne physics owns the complete flight, then hands ordinary
// orders back to the existing browser controller after the native settle state.
export function stepLiveImpulse(w: World, u: Unit) {
  const p = u.flight!
  const ctx = context(w)
  const animate = () => {
    const object = personAnimationObject(p)
    if (object !== -1) setLivePersonAnimation(w, p, object)
  }
  const initialize = () => initializeLivePerson(w, u, ctx, p)
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize,
    animation: animate,
    destination: to => ctx.effects.destination(p, to),
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
  if (p.state === 26) updateLivePanic(w, u, ctx, p)
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  Object.assign(u, browserPosition(p))
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.hp = p.life / 20
  w.randomState = ctx.state.randomState
  if (!(p.flags2 & 0x80000)) {
    u.flight = undefined
    if (u.native === p && p.state !== 26 && p.state !== 41) u.native = null
    u.lift = 0
    if (!supportsFollower(w, u)) u.hp = 0
  }
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
    // Native panic ends here; ordinary live orders still use the existing controller.
    u.native = null
    releasePersonRoute(w.motionRoutes, p)
  }
}

// Ground motion is shared by panic, celebration and staged building entry.
export function moveLivePerson(w: World, u: Unit, p: LivePerson) {
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
    // The cropped browser world boundary remains until full-map rendering.
    const blocked = (to: { x: number; y: number }) => {
      const point = browserPosition(to)
      return Math.abs(point.x) >= 47 || Math.abs(point.z) >= 47
        ? 3
        : personStepCollision(collision, p, to)
    }
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
}

export function stepLivePerson(w: World, u: Unit) {
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
    destination: point => effects.destination(p, point),
  })
  stepPersonReaction(p)
  moveLivePerson(w, u, p)
  if (p.state === 41) stepCelebration(state, p, effects)
  else if (p.state === 26) {
    updateLivePanic(w, u, ctx, p)
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
  // Presentation remains grounded on the same resampled surface as other units.
  p.h = short(Math.round(height(w.terrain, u.x, u.z) * 45))
}

// Presentation adapter: called after drawing at the selected 24 Hz native rate.
// Native rate configuration, visibility catch-up and footprint visuals are pending.
export function animateLiveObjects(w: World) {
  if (w.paused || w.land.landFlags & 2) return
  for (const u of w.units) {
    const source = unitAnimationSource(u)
    if (source)
      stepObjectAnimation(
        source,
        { counter: 0, levelFlags: 0, levelFlags2: w.levelFlags2 },
        { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] },
        () => {}
      )
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
