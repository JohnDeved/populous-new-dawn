import type { LivePerson } from './live-people.ts'
import type { Vehicle, World } from './world-types.ts'
import { browserPosition } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import rules from './original-rules.json' with { type: 'json' }

const short = (n: number) => (n << 16) >> 16
const packedCell = (p: { x: number; y: number }) => ((p.x >> 8) & 254) | (p.y & 0xfe00)

export const liveVehicles = (w: World) =>
  new Map(w.vehicles.filter(v => v.active).map(v => [v.id, v]))

// ponytail: Mission 5 has one Boat; replace this scan when vehicles join native object-cell chains.
export const liveVehicleCellObjects = (w: World, cell: number) =>
  w.vehicles.filter(v => v.active && packedCell(v) === (cell & 0xfefe))

export function nearestLiveBoat(
  w: World,
  center: { x: number; y: number },
  minimum: number,
  maximum: number
) {
  return w.vehicles
    .filter(v => {
      if (!v.active || rules.vehicleRestFlags[v.model] & 1) return false
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
  v.passengers[slot] = p.id
  v.passengerCount++
  p.vehicle = v.id
  p.speed = 0
  if (rules.vehicleRestFlags[v.model] & 1) p.flags4 = (p.flags4 | 0x2000000) >>> 0
  else p.flags4 = (p.flags4 & ~0x2000000) >>> 0
  syncLiveVehiclePassengers(w, v)
  return true
}

export function leaveLiveVehicle(w: World, v: Vehicle, p: LivePerson, to: { x: number; y: number }) {
  const slot = v.passengers.indexOf(p.id)
  if (slot < 0) return
  v.passengers.splice(slot, 1)
  v.passengerCount = v.passengers.filter(Boolean).length
  if (!v.passengerCount) v.speed = -1
  p.vehicle = 0
  p.flags4 = (p.flags4 & ~0x2000000) >>> 0
  Object.assign(p, to, {
    h: terrainPointHeight(w.land, to),
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
    if (p) Object.assign(p, { x: v.x, y: v.y, h: v.h })
    const unit = w.units.find(u => u.id === id)
    if (unit) Object.assign(unit, browserPosition(v))
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

export function stepLiveVehicle(w: World, p: LivePerson) {
  const v = w.vehicles.find(v => v.id === p.vehicle && v.active)
  if (!v) return false
  if (v.passengers[0] !== p.id) {
    syncLiveVehiclePassengers(w, v)
    return false
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
