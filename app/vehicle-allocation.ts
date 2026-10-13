import type { Vehicle, World } from './world-types.ts'

// 0x4eda23 assigns the class seed, then increments it for class4 (descriptor f2=8).
// Allocation and ordinary object visits have independent byte counters. Do not
// recover legacy allocation history from nextId or surviving vehicle count.
export function assignVehicleAllocationCounter(
  world: Pick<World, 'vehicleAllocationSeed'>,
  vehicle: Pick<Vehicle, 'counter'>
) {
  if (world.vehicleAllocationSeed === undefined) {
    delete vehicle.counter
    return
  }
  vehicle.counter = world.vehicleAllocationSeed & 255
  world.vehicleAllocationSeed = (vehicle.counter + 1) & 255
}
