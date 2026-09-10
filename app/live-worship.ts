import {
  nativePosition,
  browserPosition,
  sound,
  type World,
  type Unit,
  type Shrine,
} from './model.ts'
import { setLivePersonAnimation, type LivePerson } from './live-people.ts'
import { planLivePath, clearLivePath, acceptLivePath } from './live-pathfinding.ts'
import { allocatePersonOrder, writePersonOrder } from './person-orders.ts'
import { setPersonAnchor } from './person-order-update.ts'
import { recoverPersonMovement } from './person-state.ts'
import { releasePersonRoute } from './person-routes.ts'
import { stepWorshipPerson } from './person-worship.ts'
import { findWorshipPlace, worshipPositions } from './worship.ts'
import { moveObjectInCells, objectsInCell } from './object-cells.ts'
import { terrainPointHeight } from './native-terrain.ts'
import sprites from './original-units.json' with { type: 'json' }

export function worshipHeadPose(w: World, head: Shrine) {
  const p = nativePosition(w, head)
  return { x: p.x & 65535, y: p.y & 65535, angle: Math.round((head.angle * 1024) / Math.PI) & 2047 }
}

function* standingPeople(w: World, point: { x: number; y: number }) {
  for (const object of objectsInCell(w.objectCells, (point.x >> 8) | (point.y & 0xff00))) {
    const p = object as LivePerson
    if (p.class === 1 && !p.speed && p.x === point.x && p.y === point.y) yield p
  }
}

// 0x43c600 reads the first stationary friendly at each exact slot, regardless
// of their current task. Reuse the live cell chains rather than a proximity scan.
export function liveWorshippers(w: World, head: Shrine) {
  const people: LivePerson[] = []
  for (const point of worshipPositions(worshipHeadPose(w, head)))
    for (const p of standingPeople(w, point))
      if (p.tribe === w.manaWorld.playerTribe) {
        people.push(p)
        break
      }
  return people
}

export function worshipOrder(w: World, head: Shrine) {
  const id = allocatePersonOrder(w.buildingOrders)
  if (id) writePersonOrder(w.buildingOrders.records[id], 27, head.id, 0, 0)
  return id
}

export function stepLiveWorship(w: World, u: Unit) {
  const p = u.native!,
    head = w.shrines.find(s => s.id === p.target)
  if (!head) return true
  const state = { ...worshipHeadPose(w, head), nextSlot: head.nextSlot, slotTimer: head.slotTimer }
  const occupied = (point: { x: number; y: number }) => {
    for (const other of standingPeople(w, point)) if (other.id !== p.id) return true
    return false
  }
  const done = stepWorshipPerson(w.cosmeticRandom, p, state, sprites.frameCounts, {
    findPlace: () =>
      findWorshipPlace(
        state,
        p,
        occupied,
        point => !!planLivePath(w, u, browserPosition(point), p, true)
      ),
    occupied,
    // First-mission spell heads have no shaman-only trigger. Vault command 33
    // retains its own controller; general trigger-object ownership is pending.
    shamanOnly: () => false,
    destination: point => {
      clearLivePath(w, u)
      acceptLivePath(w, u, planLivePath(w, u, browserPosition(point), p))
    },
    recover: () => recoverPersonMovement(w, p, (_, object) => setLivePersonAnimation(w, p, object)),
    disembark: () => {
      throw new Error('Live worship vehicle ownership is not integrated')
    },
    anchor: point => setPersonAnchor(p, point),
    relocate: point => {
      moveObjectInCells(w.objectCells, p, { ...point, h: terrainPointHeight(w.land, point) })
      Object.assign(u, browserPosition(p))
    },
    releaseRoute: () => {
      releasePersonRoute(w.motionRoutes, p)
      clearLivePath(w, u)
    },
    animation: object => setLivePersonAnimation(w, p, object),
    sound: cue => {
      p.flags4 = (p.flags4 | 16) >>> 0
      sound(w, cue, u, u.id)
    },
  })
  head.nextSlot = state.nextSlot
  head.slotTimer = state.slotTimer
  return done
}
