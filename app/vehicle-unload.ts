import rules from './original-rules.json' with { type: 'json' }
import { randomPersonSpeed } from './person-state.ts'
import { nativeAngle } from './native-math.ts'
import type { LivePerson } from './live-people.ts'
import { teamForTribe, tribeForTeam, type Vehicle } from './world-types.ts'

// 0x466f30's forced refresh. The live panel recomputes from current state;
// it does not copy the original raw scheduler-byte cache into the browser.
export function vehicleUnloadReady(
  v: Pick<Vehicle, 'speed' | 'navigationFlags'>,
  ready: boolean,
  exitFound: boolean
) {
  const available = ready && exitFound && (v.speed << 16) >> 16 < 12
  v.navigationFlags = available ? v.navigationFlags | 0x100000 : v.navigationFlags & ~0x100000
  return available
}

// 0x4659d0 voluntary launch: retain seat position/height and existing state.
// Source4d8250(person,1) clears4000; it does not force airborne80000.
export function launchVehiclePerson(
  rng: { randomState: number },
  p: LivePerson,
  point: { x: number; y: number }
) {
  p.vehicle = 0
  p.flags2 = (p.flags2 & ~0x4000) >>> 0
  p.flags4 = ((p.flags4 & ~0x2000000) | 0x1000400) >>> 0
  p.speed = randomPersonSpeed(rng, p)
  const angle = nativeAngle(((point.x - p.x) << 16) >> 16, -(((point.y - p.y) << 16) >> 16))
  p.velocity = {
    x: Math.imul(rules.sine[angle], 160) >> 16,
    y: 60,
    z: Math.imul(rules.sine[(angle + 512) & 2047], 160) >> 16,
  }
}

// Queue departure owns one exact physical slot, without panel order clearing.
export function departVehiclePerson(
  rng: { randomState: number },
  vehicle: Vehicle,
  p: LivePerson,
  point: { x: number; y: number }
) {
  const capacity = (rules.vehicleCapacity[vehicle.model] << 24) >> 24,
    slot = vehicle.passengers.slice(0, capacity).indexOf(p.id)
  if ((vehicle.passengerCount << 24) >> 24 <= 0 || slot < 0) return false
  launchVehiclePerson(rng, p, point)
  vehicle.passengers[slot] = 0
  vehicle.passengerCount--
  if (!slot && vehicle.passengerCount) {
    const next = vehicle.passengers.findIndex((id, i) => i > 0 && i < capacity && !!id)
    if (next !== -1) {
      vehicle.passengers[0] = vehicle.passengers[next]
      vehicle.passengers[next] = 0
    }
  }
  vehicle.navigationFlags |= 2
  vehicle.apparentTribe ??= tribeForTeam(vehicle.team)
  vehicle.team = teamForTribe(p.tribe)
  return true
}

// Command0x60 clears the first passenger's orders even when a stale exit fails.
// Voluntary ejection preserves position, anchors and state. Destruction's extra
// flags2 writes and immediate-position landing helper are deliberately separate.
export function unloadVehiclePeople(
  rng: { randomState: number },
  vehicle: Vehicle,
  people: ReadonlyMap<number, LivePerson>,
  effects: {
    exit: () => { point: { x: number; y: number }; found: boolean }
    clearOrders: (p: LivePerson) => void
    launched: (p: LivePerson) => void
  },
  all = true
) {
  let count = 0
  for (let i = 0; i < (all ? rules.vehicleCapacity[vehicle.model] : 1); i++) {
    const p = vehicle.passengerCount && people.get(vehicle.passengers[0])
    if (!p) continue
    p.savedVehicle = 0
    effects.clearOrders(p)
    const exit = effects.exit()
    if (!exit.found) continue
    launchVehiclePerson(rng, p, exit.point)
    vehicle.passengers.shift()
    vehicle.passengerCount--
    vehicle.navigationFlags |= 2
    vehicle.apparentTribe ??= tribeForTeam(vehicle.team)
    vehicle.team = teamForTribe(p.tribe)
    effects.launched(p)
    count++
  }
  return count
}
