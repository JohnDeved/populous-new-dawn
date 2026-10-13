import { seatVehiclePassenger, vehicleSeat } from './vehicle-seats.ts'
import type { LivePerson } from './live-people.ts'
import {
  teamForTribe,
  tribeForTeam,
  vehicleApparentTribe,
  type Vehicle,
  type World,
} from './world-types.ts'
import { browserPosition } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { restingCellCollision, terrainSupportsPerson } from './person-collision.ts'
import { randomPersonSpeed } from './person-state.ts'
import { movePosition, nativeAngle } from './native-math.ts'
import { attachPersonRoute, releasePersonRoute, routeVehicleAvailable } from './person-routes.ts'
import {
  boardingVehicle,
  findVehicleLanding,
  vehicleCanDisembark,
  vehicleReady,
} from './vehicle-routing.ts'
import { moveObjectInCells } from './object-cells.ts'
import { markPersonSelected } from './person-selection.ts'
import rules from './original-rules.json' with { type: 'json' }

const short = (n: number) => (n << 16) >> 16
const packedCell = (p: { x: number; y: number }) => ((p.x >> 8) & 254) | (p.y & 0xfe00)

function relocateLivePerson(w: World, p: LivePerson, to: { x: number; y: number; h: number }) {
  if (w.objectCells.objects.get(p.id) === p && p.flags2 & 0x20000)
    moveObjectInCells(w.objectCells, p, to)
  else Object.assign(p, to)
}

// The state initializer's deselection propagates through the active vehicle's
// occupied slots. It changes selection only, preserving seats and attachment.
export function deselectLiveVehiclePassengers(w: World, person: { id: number; vehicle: number }) {
  const vehicle = w.vehicles.find(v => v.id === person.vehicle && v.active)
  if (!vehicle?.passengerCount) return
  const deselected = new Set<number>()
  for (const id of vehicle.passengers.slice(0, rules.vehicleCapacity[vehicle.model])) {
    if (!id || id === person.id) continue
    const passenger = w.pathfinding.people.get(id) ?? w.units.find(u => u.id === id)?.native
    if (!passenger?.class || passenger.flags2 & 1) continue
    markPersonSelected(passenger, false)
    deselected.add(id)
  }
  w.selected = w.selected.filter(id => !deselected.has(id))
}

export const liveVehicles = (w: World) =>
  new Map(w.vehicles.filter(v => v.active).map(v => [v.id, v]))

// ponytail: Mission 5 has one Boat; replace this scan when vehicles join native object-cell chains.
export const liveVehicleCellObjects = (w: World, cell: number) =>
  w.vehicles.filter(v => v.active && packedCell(v) === (cell & 0xfefe))

export function nearestLiveBoat(
  w: World,
  p: Pick<LivePerson, 'tribe'>,
  center: { x: number; y: number },
  minimum: number,
  maximum: number
) {
  return w.vehicles
    .filter(v => {
      if (
        !v.active ||
        v.model !== 1 ||
        v.passengerCount >= rules.vehicleCapacity[v.model] ||
        !vehicleReady(w.land, v) ||
        (w.manaTribes[p.tribe].playerType === 1 && v.reservation)
      )
        return false
      const driver = v.passengerCount && w.pathfinding.people.get(v.passengers[0])
      if (driver && driver.tribe !== p.tribe) return false
      const distance = Math.hypot(short(v.x - center.x), short(v.y - center.y))
      return distance >= minimum && distance < maximum
    })
    .sort(
      (a, b) =>
        Math.hypot(short(a.x - center.x), short(a.y - center.y)) -
        Math.hypot(short(b.x - center.x), short(b.y - center.y))
    )[0]
}

export function boardLiveVehicle(w: World, p: LivePerson, v: Vehicle) {
  if (!v.active || v.passengerCount >= rules.vehicleCapacity[v.model] || p.vehicle) return false
  const slot = Array.from({ length: rules.vehicleCapacity[v.model] }, (_, i) => i).find(
    i => !v.passengers[i]
  )
  if (slot === undefined) return false
  v.team = teamForTribe(p.tribe)
  v.apparentTribe = p.model === 5 ? p.disguise >>> 6 : p.tribe
  v.passengers[slot] = p.id
  v.passengerCount++
  p.vehicle = v.id
  p.speed = 0
  const driver = slot && w.pathfinding.people.get(v.passengers[0])
  if (
    driver &&
    p.motionGroup &&
    driver.motionGroup !== p.motionGroup &&
    Math.abs(short(driver.goalX - p.goalX)) < 440 &&
    Math.abs(short(driver.goalY - p.goalY)) < 440
  ) {
    releasePersonRoute(w.motionRoutes, p)
    attachPersonRoute(w.motionRoutes, p, driver.motionGroup)
    p.motionIndex = driver.motionIndex
  }
  if (rules.vehicleRestFlags[v.model] & 1) p.flags4 = (p.flags4 | 0x2000000) >>> 0
  else p.flags4 = (p.flags4 & ~0x2000000) >>> 0
  syncLiveVehiclePassengers(w, v)
  return true
}

export function leaveLiveVehicle(
  w: World,
  v: Vehicle,
  p: LivePerson,
  to: { x: number; y: number }
) {
  const slot = v.passengers.indexOf(p.id)
  if (slot < 0) return
  v.apparentTribe ??= tribeForTeam(v.team)
  v.team = teamForTribe(p.tribe)
  v.passengers.splice(slot, 1)
  v.passengerCount = v.passengers.filter(Boolean).length
  if (!v.passengerCount) v.speed = -1
  p.vehicle = 0
  p.flags2 = (p.flags2 & ~0x4000) >>> 0
  p.flags4 = (p.flags4 & ~0x2000000) >>> 0
  relocateLivePerson(w, p, { ...to, h: terrainPointHeight(w.land, to) })
  Object.assign(p, {
    anchorX: to.x,
    anchorY: to.y,
    speed: rules.personSpeeds[p.physics],
  })
  const unit = w.units.find(u => u.id === p.id)
  if (unit) Object.assign(unit, browserPosition(p))
}

export function syncLiveVehiclePassengers(w: World, v: Vehicle) {
  for (const [slot, id] of v.passengers.entries()) {
    const p = w.pathfinding.people.get(id)
    if (p) seatVehiclePassenger(p, v, slot, point => relocateLivePerson(w, p, point))
    const unit = w.units.find(u => u.id === id)
    if (unit) {
      Object.assign(unit, browserPosition(p ?? vehicleSeat(v, slot)))
      if (p) unit.heading = Math.PI - (p.angle * Math.PI) / 1024
    }
  }
}

export function removeMissingVehiclePassengers(w: World) {
  const people = new Set(w.units.map(unit => unit.id))
  for (const vehicle of w.vehicles) {
    vehicle.passengers = vehicle.passengers.filter(id => people.has(id))
    vehicle.passengerCount = vehicle.passengers.length
    if (!vehicle.passengerCount) vehicle.speed = -1
  }
}

export function damageLiveVehicle(w: World, v: Vehicle, attacker: number, amount: number) {
  if (w.levelFlags2 & 0x04000000 || vehicleApparentTribe(v) === attacker) return
  v.life = short(v.life - short(amount))
}

// 0x466190: one shared ejection target, including coastal and seven-direction fallback.
export function vehicleExit(w: World, v: Vehicle) {
  const index = ((v.y & 65535) >> 9) * 128 + ((v.x & 65535) >> 9),
    category = w.land.categories[index] & 15,
    airborne = !!(rules.vehicleRestFlags[v.model] & 1),
    length = airborne ? 1024 : 512
  let angle = Math.round((v.heading * 1024) / Math.PI) & 2047,
    target = { x: v.x & 65535, y: v.y & 65535 }
  if (!(rules.terrainCategoryFlags[category] & 60)) movePosition(target, angle, length)
  else {
    const x = v.x & 0xfe00,
      y = v.y & 0xfe00,
      direction = rules.terrainCategoryDirections[category],
      offsets = [
        [256, -128],
        [-128, -128],
        [-128, 256],
        [-128, 640],
        [256, 640],
        [640, 640],
        [640, 256],
        [640, -128],
      ][direction]
    target = { x: (x + offsets[0]) & 65535, y: (y + offsets[1]) & 65535 }
    angle = ((direction + 4) & 7) << 8
  }
  const blocked = (p: { x: number; y: number }) => {
    const i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    return restingCellCollision(
      { flags: w.land.flags[i], category: w.land.categories[i] },
      w.land.walkMasks[w.pathfinding.state.walkMask],
      p,
      true
    )
  }
  if (!blocked(target)) return { point: target, found: true }
  for (let attempt = 0; attempt < 7; attempt++) {
    angle = (angle + 256) & 2047
    const candidate = { x: v.x & 65535, y: v.y & 65535 }
    movePosition(candidate, angle, airborne ? 1024 : 768)
    if (!blocked(candidate)) return { point: candidate, found: true }
  }
  return { point: { x: v.x & 65535, y: v.y & 65535 }, found: false }
}

export const vehicleExitTarget = (w: World, v: Vehicle) => vehicleExit(w, v).point

function destroyLiveVehicle(w: World, v: Vehicle) {
  v.active = false
  v.speed = -1
  v.destructionState = rules.vehicleRestFlags[v.model] & 1 ? 6 : 5
  const exit = vehicleExitTarget(w, v)
  for (const id of v.passengers) {
    const u = w.units.find(unit => unit.id === id),
      p = w.pathfinding.people.get(id) ?? u?.native
    if (!p) continue
    v.apparentTribe ??= tribeForTeam(v.team)
    v.team = teamForTribe(p.tribe)
    p.vehicle = 0
    p.flags2 = ((p.flags2 & ~0x4000) | 0x80010) >>> 0
    p.flags4 = ((p.flags4 & ~0x2000000) | 0x1000400) >>> 0
    p.speed = randomPersonSpeed(w, p)
    const angle = nativeAngle(short(exit.x - p.x), -short(exit.y - p.y))
    p.velocity = {
      x: short(Math.imul(rules.sine[angle], 160) >> 16),
      y: 60,
      z: short(Math.imul(rules.sine[(angle + 512) & 2047], 160) >> 16),
    }
    if (u) {
      u.flight = p
      u.lift = 1
    }
  }
  v.passengers = []
  v.passengerCount = 0
}

// 0x466760/0x4668b0: retain physical slots, then promote the first person
// with an eligible queued command. Person phases and order references are untouched.
// The browser schedules this once before person visits; native object-list ordering
// and the existing movement adapter remain separate composition boundaries.
const vehicleMovementPass = new WeakMap<World, Set<number>>()

// A browser world pass owns one airborne craft decision, independently of how
// many people become driver during its visits. Checkpoints occur between passes.
export function beginLiveVehiclePass(w: World) {
  vehicleMovementPass.set(w, new Set())
  selectLiveBalloonDrivers(w)
}

export function selectLiveBalloonDrivers(w: World) {
  for (const v of w.vehicles) {
    if (!v.active || !(rules.vehicleRestFlags[v.model] & 1) || !v.passengerCount) continue
    const capacity = (rules.vehicleCapacity[v.model] << 24) >> 24
    const person = (id: number) => {
      const p = w.objectCells.objects.get(id) as LivePerson | undefined
      // Live adapter: reject stale aliases instead of selecting a different owner.
      const u = w.units.find(unit => unit.id === id)
      return p?.class === 1 && p.id === id && u?.native === p && !(p.flags2 & 1) ? p : undefined
    }
    for (let slot = 0; slot < capacity; slot++) {
      const id = v.passengers[slot]
      if (!id) continue
      const p = person(id)
      if (!p) {
        v.passengers[slot] = 0
        v.passengerCount = (v.passengerCount - 1) & 255
      } else if (p.slowTurn) v.navigationFlags |= 2
    }
    if (!v.passengers[0]) {
      const slot = v.passengers.findIndex((id, i) => i > 0 && i < capacity && !!id)
      if (slot !== -1) {
        v.passengers[0] = v.passengers[slot]
        v.passengers[slot] = 0
      }
    }
    for (let slot = 0; slot < capacity; slot++) {
      const p = person(v.passengers[slot])
      if (!p) continue
      if (
        !(
          p.commands[p.commandCursor] &&
          (p.commandStatus !== 22 || (p.vehicle & 65535) !== short(p.target))
        ) &&
        !(p.model === 7 && p.state === 38)
      )
        continue
      if (slot) {
        v.passengers[slot] = v.passengers[0]
        v.passengers[0] = p.id
        if (!p.motionGroup) p.flags2 = (p.flags2 | 0x80000000) >>> 0
      }
      break
    }
  }
}

// Bounded 0x4641d0 zero-desired-speed tail. Positive speed projects the
// browser's moving state; untouched initial/resting speed -1 is not native state4.
// Active movement still owns its retained fixed-vector/height/wait adapter.
function stopUnvisitedBalloon(w: World, v: Vehicle) {
  const visited = vehicleMovementPass.get(w)
  if (
    !visited ||
    visited.has(v.id) ||
    !(rules.vehicleRestFlags[v.model] & 1) ||
    short(v.speed) <= 0
  )
    return
  const candidate = w.units.find(u => u.id === v.passengers[0])?.native,
    driver =
      candidate?.class === 1 &&
      candidate.id === v.passengers[0] &&
      !(candidate.flags2 & 1) &&
      w.objectCells.objects.get(candidate.id) === candidate
        ? candidate
        : undefined,
    land = {
      flags: w.land.flags,
      categories: w.land.categories,
      cellObjects: (cell: number) => liveVehicleCellObjects(w, cell),
    }
  // Ownerless moving/rest-state transitions remain in the existing adapter.
  if (!driver || short(driver.speed)) return
  visited.add(v.id)
  if (short(v.speed) > 1) {
    v.speed = short(Math.trunc((short(v.speed) * 22) / 32))
    if (v.speed < 6) v.speed = 1
    if (v.speed > 1) {
      // Retained radians heading projects native travel heading; no new turn state.
      const angle = (1024 - Math.round((v.heading * 1024) / Math.PI)) & 2047
      movePosition(v, angle, v.speed)
    }
    v.h = terrainPointHeight(w.land, v) + 560
    return
  }
  const index = ((v.y & 65535) >> 9) * 128 + ((v.x & 65535) >> 9)
  if (
    (v.x & 511) === 256 &&
    (v.y & 511) === 256 &&
    vehicleCanDisembark(land, v, v) &&
    (v.passengerCount || rules.terrainCategoryFlags[w.land.categories[index] & 15] & 61)
  ) {
    v.speed = 0
    v.h = terrainPointHeight(w.land, v) + 560
    v.navigationFlags &= ~0x10000
    return
  }
  // 0x466fc0 centers the returned point even when the bounded search fails.
  const { point } = findVehicleLanding(land, w.indexedSearch, v, v),
    target = { x: (point.x & 0xfe00) + 256, y: (point.y & 0xfe00) + 256 }
  if ((v.x & 65535) === target.x && (v.y & 65535) === target.y) return
  v.navigationFlags |= 0x8000
  if (Math.abs(short(v.x) - short(target.x)) < 13 && Math.abs(short(v.y) - short(target.y)) < 13) {
    v.x = target.x
    v.y = target.y
  } else movePosition(v, nativeAngle(short(target.x - v.x), -short(target.y - v.y)), 12)
}

export function stepLiveVehicles(w: World) {
  for (const v of w.vehicles) {
    if (v.destructionState === 5) {
      const cell = ((v.y & 65535) >> 9) * 128 + ((v.x & 65535) >> 9)
      if (terrainSupportsPerson(w.land.categories[cell], v)) {
        v.destructionState = 0
        continue
      }
      v.h = short(v.h - 8)
      if (v.h < -191) v.destructionState = 0
      continue
    }
    if (v.destructionState === 6) {
      v.h = short(v.h + 80)
      if (v.h > 1023) v.destructionState = 0
      continue
    }
    if (v.active) stopUnvisitedBalloon(w, v)
    // 0x463cb0 deliberately leaves exact zero untouched and restores occupied positive life.
    if (!v.active || !v.life) continue
    v.life = short(v.life - 1)
    if (v.life < 1) destroyLiveVehicle(w, v)
    else if (v.speed > 0 || v.passengerCount) v.life = rules.vehicleLife[v.model]
  }
  // The vehicle controller publishes seats after all person route/controller
  // visits. A boarding route may otherwise overwrite its provisional placement.
  for (const v of w.vehicles) if (v.active && v.passengerCount) syncLiveVehiclePassengers(w, v)
  vehicleMovementPass.delete(w)
}

export function stepLiveVehicle(w: World, p: LivePerson) {
  const v = w.vehicles.find(v => v.id === p.vehicle && v.active)
  if (!v) return false
  if (v.passengers[0] !== p.id) {
    syncLiveVehiclePassengers(w, v)
    return false
  }
  if (rules.vehicleRestFlags[v.model] & 1) {
    const moved = vehicleMovementPass.get(w)
    if (moved?.has(v.id)) {
      syncLiveVehiclePassengers(w, v)
      return true
    }
    moved?.add(v.id)
  }
  const vehicles = liveVehicles(w),
    vehicleWorld = {
      flags: w.land.flags,
      categories: w.land.categories,
      boatsEnabled: 1,
      vehicles,
      people: w.pathfinding.people,
      tribes: w.manaTribes.map(tribe => ({ playerType: tribe.playerType })),
      cellObjects: (cell: number) => liveVehicleCellObjects(w, cell),
    }
  if (
    v.passengerCount < rules.vehicleCapacity[v.model] &&
    [...w.pathfinding.people.values()].some(candidate => {
      if (
        candidate.id === p.id ||
        candidate.vehicle ||
        candidate.tribe !== p.tribe ||
        Math.abs(short(candidate.x - v.x)) >= 3_072 ||
        Math.abs(short(candidate.y - v.y)) >= 3_072
      )
        return false
      let matching = false
      routeVehicleAvailable(w.motionRoutes, candidate, cell => {
        matching = boardingVehicle(vehicleWorld, candidate, cell) === v.id
        return matching ? v.id : 0
      })
      return matching
    })
  ) {
    v.speed = -1
    syncLiveVehiclePassengers(w, v)
    return true
  }
  const dx = short(p.destinationX - v.x),
    dy = short(p.destinationY - v.y),
    distance = Math.hypot(dx, dy),
    speed = rules.personSpeeds[v.physics]
  if (distance) {
    const step = Math.min(speed, distance)
    v.x = short(v.x + Math.round((dx * step) / distance))
    v.y = short(v.y + Math.round((dy * step) / distance))
    v.heading = Math.atan2(dx, -dy)
    v.speed = speed
  } else v.speed = -1
  if (rules.vehicleRestFlags[v.model] & 1) v.h = terrainPointHeight(w.land, v) + 560
  syncLiveVehiclePassengers(w, v)
  return true
}
