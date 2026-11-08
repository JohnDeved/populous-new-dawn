import { buildingModel, buildingPose } from './building-shapes.ts'
import { vaultShapePose } from './vault-geometry.ts'
import type { World } from './world-types.ts'

// Physical Vault bodies share the native building-cell domain even though the
// current world adapter keeps their command/reward state in top-level shrines.
// Hidden linked shrines have no live footprint until their owner publishes them.
export function liveBuildingShape(w: World, id: number) {
  const building = w.buildings.find(building => building.id === id)
  if (building) return buildingPose(building)
  const vault = w.shrines.find(
    shrine => shrine.id === id && shrine.kind === 'vault' && shrine.model
  )
  return vault && vaultShapePose(vault)
}

export function liveBuildingModel(w: World, id: number) {
  const building = w.buildings.find(building => building.id === id)
  if (building) return buildingModel(building)
  return w.shrines.some(shrine => shrine.id === id && shrine.kind === 'vault' && shrine.model)
    ? 18
    : 0
}
