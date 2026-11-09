import rules from './original-rules.json' with { type: 'json' }
import { prepareVehiclePosition } from './vehicle-routing.ts'
import { terrainPointHeight } from './native-terrain.ts'
import type { Vehicle, World } from './world-types.ts'

const packedCell = (p: { x: number; y: number }) => ((p.x >>> 8) & 254) | (p.y & 0xfe00)

// Fresh authored Boats: 0x4631b0 -> 0x463ba0 -> state-1 0x463370.
// The browser's vehicle collection is its existing class-4 cell adapter.
function initializeBoat(w: World, v: Vehicle, includeInactive: boolean) {
  if (!(v.navigationFlags & 0x200000)) {
    const context = {
      flags: w.land.flags,
      categories: w.land.categories,
      // Construction includes linked inactive templates, unlike live routing.
      cellObjects: (cell: number) =>
        w.vehicles.filter(
          other => (includeInactive || other.active) && packedCell(other) === (cell & 0xfefe)
        ),
    }
    Object.assign(v, prepareVehiclePosition(context, w.indexedSearch, v, v).point)
  }
  // Register before height/heading sampling, including failed preparation.
  w.vehicles.push(v)
  v.h = terrainPointHeight(w.land, v)
  const i = ((v.y & 65535) >>> 9) * 128 + ((v.x & 65535) >>> 9),
    direction = rules.terrainCategoryDirections[w.land.categories[i] & 15],
    angle = direction < 0 ? 0 : ((direction + 4) & 7) << 8
  v.heading = (angle * Math.PI) / 1024
  v.life = rules.vehicleLife[v.model]
  v.navigationFlags = ((v.navigationFlags | 0x80) & ~0x10101) | 0x4000
  v.physics = 12
  // Fresh allocation clears these; state 1 clears speed (+0x5f) again.
  v.speed = 0
  v.turnAngle = 0
  v.turnY = 0
  v.reservation = 0
  v.passengerCount = 0
  v.passengers = []
}

export function initializeAuthoredBoat(w: World, v: Vehicle) {
  initializeBoat(w, v, true)
}
// Linked sources were detached after level loading; reward allocation uses live
// registered class4 occupancy, while the authored loop includes prior templates.
export function initializeRewardBoat(w: World, v: Vehicle) {
  initializeBoat(w, v, false)
}
