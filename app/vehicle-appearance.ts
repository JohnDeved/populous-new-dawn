// 00463ba0 selects the vehicle descriptor's +4 mesh and draw type 2.
// Models 1/2 share Boat143; models 3/4 share Balloon144, for every owner/state.
// The adjacent descriptor+6 IDs838/839 feed tooltip strings, not geometry.
export function originalVehicleMesh(model: number): 143 | 144 {
  switch (model) {
    case 1:
    case 2:
      return 143
    case 3:
    case 4:
      return 144
    default:
      throw new RangeError(`Unsupported original vehicle model: ${model}`)
  }
}
