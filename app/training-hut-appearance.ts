import models from './original-models.json' with { type: 'json' }
import { buildingObject } from './building-shapes.ts'
import type { Building } from './world-types.ts'

// 0040b170 selects original consecutive tribe meshes, not a tint of Blue.
// Preserve the stored object identity used by footprint/entrance consumers.
export function originalTrainingHutObject(
  building: Pick<Building, 'kind' | 'team' | 'level' | 'object'>
): number | undefined {
  if (
    building.team === 'wild' ||
    !['temple', 'spyHut', 'camp', 'firewarriorHut'].includes(building.kind)
  ) return undefined
  const object = buildingObject(building)
  if (!Object.hasOwn(models, object))
    throw new Error(`Missing original ${building.team} ${building.kind} mesh ${object}`)
  return object
}
