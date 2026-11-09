import { movePosition } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import type { Vehicle } from './world-types.ts'
import type { LivePerson } from './live-people.ts'

// Original settled seats, in craft-local side/forward/height coordinates.
const boatSeats = [
  [-40, -128, 48],
  [-40, -64, 48],
  [-40, -16, 48],
  [-40, 64, 48],
  [-40, 128, 48],
]
const balloonSeats = [
  [0, -64, 60],
  [0, 64, 60],
]
type Craft = Pick<Vehicle, 'model' | 'heading' | 'x' | 'y' | 'h'>
export function vehicleSeat(v: Craft, slot: number) {
  const [side, forward, height] = (v.model <= 2 ? boatSeats : balloonSeats)[slot],
    angle = Math.round((v.heading * 1024) / Math.PI) & 2047,
    point = { x: v.x & 65535, y: v.y & 65535, h: ((v.h + height) << 16) >> 16 }
  movePosition(point, angle, forward)
  movePosition(point, (angle + 512) & 2047, side)
  return point
}

// The live boarding path attaches immediately. Preserve native settled geometry
// without replaying countdown interpolation on each passenger/driver sync call.
export function seatVehiclePassenger(
  p: Pick<LivePerson, 'flags2' | 'assignment' | 'slowTurn' | 'turnAngle' | 'heading' | 'angle'>,
  v: Craft,
  slot: number,
  place: (point: { x: number; y: number; h: number }) => void
) {
  const angle = Math.round((v.heading * 1024) / Math.PI) & 2047
  if (!p.slowTurn && !(p.assignment & 512)) {
    if (p.flags2 & 128) p.turnAngle = angle
    p.heading = angle
    p.angle = (angle + (p.flags2 & 0x8000 ? 1024 : 0)) & 2047
  }
  place(vehicleSeat(v, slot))
  p.flags2 |= 0x4000
}

// Fill only the driver vacancy. Other occupants retain their physical seats.
export function fillVehicleDriverSeat(v: Pick<Vehicle, 'model' | 'passengers'>) {
  if (v.passengers[0]) return
  const capacity = (rules.vehicleCapacity[v.model] << 24) >> 24,
    slot = v.passengers.findIndex((id, i) => i > 0 && i < capacity && !!id)
  if (slot !== -1) {
    v.passengers[0] = v.passengers[slot]
    v.passengers[slot] = 0
  }
}
