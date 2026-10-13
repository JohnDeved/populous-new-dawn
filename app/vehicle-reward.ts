import rules from './original-rules.json' with { type: 'json' }
import { movePosition, nativeAngle, random, short } from './native-math.ts'
import { assignVehicleAllocationCounter, deferVehicleOrdinaryVisit } from './vehicle-allocation.ts'
import { initializeRewardBoat } from './vehicle-initialization.ts'
import { findVehicleLanding, vehicleReady } from './vehicle-routing.ts'
import { vehicleExit } from './live-vehicles.ts'
import type { Shrine, Vehicle, World } from './world-types.ts'

export type BoatRewardInitialization = {
  // Result of the explicit 0x4ed700 initialization visit, not a live state controller.
  state: 1 | 5 | 7 | 8
  counter?: number
  direction: number
  emptyTemplate: boolean
}
const cell = (point: { x: number; y: number }) => ((point.x >>> 8) & 254) | (point.y & 0xfe00)

// 0x4ede10 preserves fresh identity, allocation phase, state and registered XYZ.
// These are the fields represented by the browser's detached class4 template.
export function copyBoatRewardTemplate(vehicle: Vehicle, source: Vehicle) {
  vehicle.model = source.model
  vehicle.team = source.team
  vehicle.apparentTribe = source.apparentTribe
  vehicle.heading = source.heading
  vehicle.physics = source.physics
  vehicle.speed = source.speed
  vehicle.navigationFlags = source.navigationFlags
  vehicle.life = source.life
  vehicle.reservation = source.reservation
  vehicle.passengerCount = source.passengerCount
  vehicle.passengers = [...source.passengers]
  vehicle.turnAngle = source.turnAngle
  vehicle.turnY = source.turnY
}

// 0x466d90 -> 0x466fc0. Detached authored templates have no occupants, velocity,
// timer or bobbing work. Their fresh state1 visit still owns periodic centering.
function centerRewardBoat(world: World, vehicle: Vehicle) {
  const land = {
    flags: world.land.flags,
    categories: world.land.categories,
    cellObjects: (packed: number) =>
      world.vehicles.filter(other => other.active && cell(other) === (packed & 0xfefe)),
  }
  const { point } = findVehicleLanding(land, world.indexedSearch, vehicle, vehicle)
  const target = { x: (point.x & 0xfe00) + 256, y: (point.y & 0xfe00) + 256 }
  if ((vehicle.x & 65535) !== target.x || (vehicle.y & 65535) !== target.y) {
    vehicle.navigationFlags |= 0x8000
    if (
      Math.abs(short(vehicle.x) - short(target.x)) < 13 &&
      Math.abs(short(vehicle.y) - short(target.y)) < 13
    ) {
      vehicle.x = target.x
      vehicle.y = target.y
    } else {
      movePosition(
        vehicle,
        nativeAngle(short(target.x - vehicle.x), -short(target.y - vehicle.y)),
        12
      )
    }
  }
  const index = ((vehicle.y & 65535) >>> 9) * 128 + ((vehicle.x & 65535) >>> 9)
  const direction = rules.terrainCategoryDirections[world.land.categories[index] & 15]
  const current = Math.round((vehicle.heading * 1024) / Math.PI) & 2047
  const desired = direction < 0 ? current : ((direction + 4) & 7) << 8
  let delta = desired - current
  if (Math.abs(delta) > 1024) delta += delta < 0 ? 2048 : -2048
  const angle = Math.abs(delta) <= 11 ? desired : (current + Math.sign(delta) * 11) & 2047
  vehicle.heading = (angle * Math.PI) / 1024
}

// Bounded explicit state1 processing for an empty detached Boat template.
// Later ordinary rest/movement remains the existing live Boat adapter. Unknown
// legacy allocation phase deliberately skips periodic branches; it is never0.
export function processBoatRewardInitialization(
  world: World,
  vehicle: Vehicle,
  directionWord = 0
): BoatRewardInitialization {
  const result: BoatRewardInitialization = {
    state: 1,
    counter: vehicle.counter,
    direction: short(directionWord),
    emptyTemplate: vehicle.passengerCount === 0,
  }
  // Occupied linked templates are outside the authored detached-template contract.
  // Preserve the unsupported result instead of claiming an empty native visit.
  if (!result.emptyTemplate) return result
  if (vehicle.counter !== undefined && !(vehicle.counter & 31)) {
    if (short(vehicle.speed)) vehicle.speed = 0
    else centerRewardBoat(world, vehicle)
  }
  if (short(vehicle.life)) {
    vehicle.life = short(vehicle.life - 1)
    if (vehicle.life < 1) {
      result.state = 5
      vehicle.speed = 0
      vehicle.navigationFlags |= 0x10000
      vehicle.destructionState = 5
      vehicle.active = false
      return result
    }
    if (short(vehicle.speed)) vehicle.life = rules.vehicleLife[vehicle.model]
    if (!(vehicle.navigationFlags & 0x20000)) {
      if (vehicle.counter !== undefined && !(vehicle.counter & 63))
        vehicle.navigationFlags |= 0x4000
      if (vehicle.navigationFlags & 0x4000 && !vehicleReady(world.land, vehicle)) {
        result.state = 7
        vehicle.navigationFlags &= ~0x10000
      }
      const index = ((vehicle.y & 65535) >>> 9) * 128 + ((vehicle.x & 65535) >>> 9)
      if (
        vehicle.counter !== undefined &&
        !(vehicle.counter & 15) &&
        rules.terrainCategoryFlags[world.land.categories[index] & 15] & 1
      ) {
        // Empty arm of 0x464710. Occupied ejection and later state8 motion remain
        // separate; retain the result and its actual RNG/life/direction writes.
        result.state = 8
        vehicle.speed = 0
        vehicleExit(world, vehicle)
        vehicle.navigationFlags |= 0x10000
        vehicle.life = (random(world) & 127) + 160
        if (!result.direction) result.direction = random(world) & 1 ? 1 : 2047
        result.direction &= 2047
      }
    }
  }
  return result
}

export function allocateLinkedBoatReward(world: World, source: Vehicle) {
  const vehicle: Vehicle = {
    ...source,
    id: world.nextId++,
    active: true,
    destructionState: 0,
    navigationFlags: 0,
    passengers: [],
    passengerCount: 0,
  }
  delete vehicle.rewardInitialization
  assignVehicleAllocationCounter(world, vehicle)
  initializeRewardBoat(world, vehicle)
  copyBoatRewardTemplate(vehicle, source)
  vehicle.rewardInitialization = processBoatRewardInitialization(world, vehicle)
  // Native allocation prepends before the primary traversal's cached next link.
  // Its immediate visit does not increment the counter or run twice this pass.
  deferVehicleOrdinaryVisit(world, vehicle)
  return vehicle
}

export function linkedBoatTemplateShared(
  world: Pick<World, 'shrines'>,
  head: Shrine,
  sourceId: number
) {
  const pending = [...world.shrines],
    seen = new Set<Shrine>()
  for (const candidate of pending) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    if (candidate.id !== head.id && candidate.rewardVehicle === sourceId) return true
    if (candidate.linkedShrine) pending.push(candidate.linkedShrine)
  }
  return false
}

// Caller captures the positive1->0 use transition and removes the completed head
// after its current presentation visit. Native allocation failure still retires
// a final-use source/head; the live browser allocator retains its unbounded IDs.
export function grantLinkedBoatReward(
  world: World,
  head: Shrine,
  finalUse: boolean,
  allocate: (world: World, source: Vehicle) => Vehicle | undefined = allocateLinkedBoatReward
) {
  const source = world.vehicles.find(vehicle => vehicle.id === head.rewardVehicle)
  const reward = source && allocate(world, source)
  if (source && finalUse && !linkedBoatTemplateShared(world, head, source.id))
    world.vehicles = world.vehicles.filter(vehicle => vehicle !== source)
  return reward
}
