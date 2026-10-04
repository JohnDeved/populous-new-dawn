import rules from './original-rules.json' with { type: 'json' }
import { randomPersonSpeed } from './person-state.ts'
import { nativeAngle } from './native-math.ts'
import type { LivePerson } from './live-people.ts'
import type { Vehicle } from './world-types.ts'
import { teamForTribe } from './world-types.ts'

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
    p.vehicle = 0
    p.flags2 = (p.flags2 & ~0x4000) >>> 0
    p.flags4 = ((p.flags4 & ~0x2000000) | 0x1000400) >>> 0
    p.speed = randomPersonSpeed(rng, p)
    const angle = nativeAngle(
      ((exit.point.x - p.x) << 16) >> 16,
      -(((exit.point.y - p.y) << 16) >> 16)
    )
    p.velocity = {
      x: Math.imul(rules.sine[angle], 160) >> 16,
      y: 60,
      z: Math.imul(rules.sine[(angle + 512) & 2047], 160) >> 16,
    }
    vehicle.passengers.shift()
    vehicle.passengerCount--
    vehicle.navigationFlags |= 2
    vehicle.team = teamForTribe(p.tribe)
    effects.launched(p)
    count++
  }
  return count
}
