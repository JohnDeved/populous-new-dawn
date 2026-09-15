import { buildingPose } from './building-shapes.ts'
import { sound } from './world-effects.ts'
import { browserPosition, nativePosition, type World, type Unit } from './model.ts'
import {
  createLivePerson,
  registerLivePerson,
  moveLivePerson,
  changeLivePersonState,
  setLivePersonAnimation,
  type LivePerson,
} from './live-people.ts'
import { initializeIdleApproach, stepIdleApproach, stepRestingPerson } from './person-idle.ts'
import {
  createRestingSlots,
  findRestingSlot,
  restingSlotAvailable,
  rebuildRestingSlots,
  type RestingWorld,
} from './resting-slots.ts'
import { setPersonAnchor } from './person-order-update.ts'
import { defaultPersonState, personAnimationObject } from './person-state.ts'
import { preparePersonTurn, stepPersonReaction } from './person-update.ts'
import { restingCellCollision } from './person-collision.ts'
import { objectsInCell, moveObjectInCells } from './object-cells.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import { clearLivePath, planLivePath, acceptLivePath, replanLivePath } from './live-pathfinding.ts'
import { allocatePersonOrder, attachPersonOrder, clearPersonOrders } from './person-orders.ts'
import { orderEffects } from './live-movement.ts'
import sprites from './original-units.json' with { type: 'json' }
import { tribeForTeam } from './world-types.ts'

const slots = createRestingSlots()
const cellIndex = (p: { x: number; y: number }) => (p.y >> 9) * 128 + (p.x >> 9)
function restingWorld(w: World): RestingWorld {
  return {
    land: w.land,
    orders: w.buildingOrders,
    search: w.indexedSearch,
    slotOffsets: slots,
    // The retained cell registry currently contains live people only.
    cellObjects: cell => objectsInCell(w.objectCells, cell) as Iterable<LivePerson>,
    outside: id => buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!)),
  }
}
function collision(w: World, p: { x: number; y: number }) {
  const i = cellIndex(p)
  return restingCellCollision(
    { flags: w.land.flags[i], category: w.land.categories[i] },
    w.land.walkMasks[0],
    p
  )
}
export function rebuildLiveRestingSlots(w: World, cell: number) {
  rebuildRestingSlots(restingWorld(w), cell)
}

// Called by the common native state initializer; its nested transitions retain
// that initializer's RNG state and ordering.
export function initializeLiveIdleApproach(
  w: World,
  u: Unit,
  p: LivePerson,
  initialize: () => void
) {
  initializeIdleApproach(w.manaWorld.gameFlags, p, {
    setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
    collision: to => collision(w, to),
    height: to => terrainPointHeight(w.land, to),
    searchStart: () => startIndexedSearch(w.indexedSearch, 2, 0, 0, 32),
    searchNext: id => nextIndexedSearch(w.indexedSearch, id),
    searchEnd: id => endIndexedSearch(w.indexedSearch, id),
    destination: to => {
      clearLivePath(w, u)
      acceptLivePath(w, u, planLivePath(w, u, browserPosition(to), p))
    },
    allocateOrder: () => allocatePersonOrder(w.buildingOrders),
    adjacentBuilding: () => {
      const cell = (p.y >> 9) * 128 + (p.x >> 9)
      return w.land.flags[cell] & 512 ? w.land.buildingIds[cell] & 1023 : 0
    },
    buildingPoint: id =>
      buildingOutsidePoint(buildingPose(w.buildings.find(building => building.id === id)!)),
    prepareOrder: (id, model, to) =>
      Object.assign(w.buildingOrders.records[id], {
        model,
        a: to.x & 65535,
        b: to.y & 65535,
      }),
    occupied: () => false,
    clearOrders: () => clearPersonOrders(w.buildingOrders, p, orderEffects(w)),
    attachOrder: id => attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(w)),
    initialize,
  })
}

export function cancelLiveResting(w: World, u: Unit) {
  const p = u.native
  if (!p || ![1, 17, 19].includes(p.state)) return
  if (p.assignment & 1) {
    p.assignment &= ~1
    rebuildLiveRestingSlots(w, p.formationCell)
  }
  releasePersonRoute(w.motionRoutes, p)
  // Keep the person (including shields/disguise) while legacy orders own motion.
  // State 10 without a native command uses the browser animation controller.
  changeLivePersonState(w, u, 10)
}

// Ordinary order completion hands the actual follower to native states 17/19.
// The existing movement/work controller still owns the journey to this anchor.
export function stepLiveResting(w: World, u: Unit) {
  const retry = u.native?.state === 10 && u.native.previousState === 1
  if (!retry && (!u.native || ![1, 17, 19].includes(u.native.state))) {
    const p = u.native ?? createLivePerson(w, u)
    setPersonAnchor(p, nativePosition(w, u))
    setDirectPersonDestination(w.motionRoutes, p, p)
    p.counter = w.turn & 255
    u.native = p
    registerLivePerson(w, p)
    changeLivePersonState(w, u, 17)
    // The legacy controller already visited this follower. Begin native motion
    // next turn, just as a state transition follows the original physics visit.
    return
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
  if (p.state === 10) changeLivePersonState(w, u, 17) // Empty ordinary order queue.
  if (p.state === 17) {
    if (stepIdleApproach(p, to => collision(w, to))) changeLivePersonState(w, u, 19)
  } else if (p.state === 19) {
    const rest = restingWorld(w)
    const next = stepRestingPerson(
      {
        get randomState() {
          return w.randomState
        },
        set randomState(value) {
          w.randomState = value
        },
        turn: w.turn,
        poseRandom: w.cosmeticRandom,
        slotOffsets: slots,
        get shamans() {
          return new Map(
            w.units
              .filter(u => u.kind === 'shaman' && !u.ghost && u.hp > 0)
              .map(u => [tribeForTeam(u.team), nativePosition(w, u)])
          )
        },
      },
      p,
      {
        setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
        releaseMotion: () => {
          releasePersonRoute(w.motionRoutes, p)
          clearLivePath(w, u)
        },
        occupied: () => false, // These followers have no AI reservation/work owner.
        validSlot: () => restingSlotAvailable(rest, p),
        findSlot: () => findRestingSlot(rest, p),
        directDestination: to => setDirectPersonDestination(w.motionRoutes, p, to),
        insert: to => {
          moveObjectInCells(w.objectCells, p, to)
          Object.assign(u, browserPosition(p))
        },
        height: to => terrainPointHeight(w.land, to),
        allocateLog: () => {
          // ponytail: scenery allocation uses the existing unbounded live pool.
          w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
          return true
        },
        sound: cue => sound(w, cue, u),
        refreshCell: cell => rebuildRestingSlots(rest, cell),
        frameCount: object => sprites.frameCounts[object],
      }
    )
    if (next) changeLivePersonState(w, u, next)
  } else if (p.state === 1) {
    p.timer = ((p.timer - 1) << 16) >> 16
    if (p.timer < 1 || p.flags2 & 0x2004)
      changeLivePersonState(w, u, defaultPersonState(p, w.manaWorld.gameFlags))
  }
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  u.cargo = p.cargo / 100
}
