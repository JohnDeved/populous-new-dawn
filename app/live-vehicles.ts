import type { LivePerson } from './live-people.ts'
import { teamForTribe, tribeForTeam, type Vehicle, type World } from './world-types.ts'
import { browserPosition } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { restingCellCollision, terrainSupportsPerson } from './person-collision.ts'
import { randomPersonSpeed } from './person-state.ts'
import { movePosition, nativeAngle } from './native-math.ts'
import { attachPersonRoute, releasePersonRoute, routeVehicleAvailable } from './person-routes.ts'
import { boardingVehicle, vehicleReady } from './vehicle-routing.ts'
import { moveObjectInCells } from './object-cells.ts'
import rules from './original-rules.json' with { type: 'json' }

const short = (n: number) => (n << 16) >> 16
const packedCell = (p: { x: number; y: number }) => ((p.x >> 8) & 254) | (p.y & 0xfe00)

function relocateLivePerson(
  w: World,
  p: LivePerson,
  to: { x: number; y: number; h: number }
) {
  if (w.objectCells.objects.get(p.id) === p && p.flags2 & 0x20000)
    moveObjectInCells(w.objectCells, p, to)
  else Object.assign(p, to)
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
  if (!v.passengerCount) v.team = teamForTribe(p.tribe)
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
  v.passengers.splice(slot, 1)
  v.passengerCount = v.passengers.filter(Boolean).length
  if (!v.passengerCount) v.speed = -1
  p.vehicle = 0
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
  for (const id of v.passengers) {
    const p = w.pathfinding.people.get(id)
    if (p) relocateLivePerson(w, p, { x: v.x, y: v.y, h: v.h })
    const unit = w.units.find(u => u.id === id)
    if (unit) Object.assign(unit, browserPosition(p ?? v))
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
  if (w.levelFlags2 & 0x04000000 || tribeForTeam(v.team) === attacker) return
  v.life = short(v.life - short(amount))
}

// 0x466190: one shared ejection target, including coastal and seven-direction fallback.
export function vehicleExitTarget(w: World, v: Vehicle) {
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
  if (!blocked(target)) return target
  for (let attempt = 0; attempt < 7; attempt++) {
    angle = (angle + 256) & 2047
    const candidate = { x: v.x & 65535, y: v.y & 65535 }
    movePosition(candidate, angle, airborne ? 1024 : 768)
    if (!blocked(candidate)) return candidate
  }
  return { x: v.x & 65535, y: v.y & 65535 }
}

function destroyLiveVehicle(w: World, v: Vehicle) {
  v.active = false
  v.speed = -1
  v.destructionState = rules.vehicleRestFlags[v.model] & 1 ? 6 : 5
  const exit = vehicleExitTarget(w, v)
  for (const id of v.passengers) {
    const u = w.units.find(unit => unit.id === id),
      p = w.pathfinding.people.get(id) ?? u?.native
    if (!p) continue
    p.vehicle = 0
    p.flags2 = (p.flags2 | 0x80010) >>> 0
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
    // 0x463cb0 deliberately leaves exact zero untouched and restores occupied positive life.
    if (!v.active || !v.life) continue
    v.life = short(v.life - 1)
    if (v.life < 1) destroyLiveVehicle(w, v)
    else if (v.speed > 0 || v.passengerCount) v.life = rules.vehicleLife[v.model]
  }
}

export function stepLiveVehicle(w: World, p: LivePerson) {
  const v = w.vehicles.find(v => v.id === p.vehicle && v.active)
  if (!v) return false
  if (v.passengers[0] !== p.id) {
    syncLiveVehiclePassengers(w, v)
    return false
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
