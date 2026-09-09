import rules from './original-rules.json' with { type: 'json' }
import { hasNonLand, terrainCellHeightRange, type NativeTerrain } from './native-terrain.ts'

type Land = Pick<NativeTerrain, 'heights' | 'flags' | 'categories' | 'buildingIds'>
export interface BuildingValidityWorld {
  land: Land
  landFlags: number
  levelFlags: number
  building: (id: number) => { model: number; tribe: number }
  scenery: (index: number) => Iterable<{ class: number; model: number }>
}
export interface BuildingValidityTribe {
  tribe: number
  playerType: number
  flags: number
}
const indexOf = (cell: number) => ((cell & 0xfe00) >> 9) * 128 + ((cell & 254) >> 1)
const offset = (cell: number, x: number, y: number) =>
  (((cell & 255) + x * 2) & 255) | ((((cell >> 8) + y * 2) & 255) << 8)

// 0x4baaf0: another tribe's guard-tower plan may be overlapped.
function foreignTower(w: BuildingValidityWorld, id: number, tribe: number) {
  const plan = w.building(id)
  return plan.model === 4 && plan.tribe !== tribe
}

// 0x44f220: adjacent occupied cells and plans, excluding the plan being checked.
function neighborsClear(w: BuildingValidityWorld, cell: number, plan: number, tribe: number) {
  for (let y = -1; y <= 1; y++)
    for (let x = -1; x <= 1; x++) {
      const i = indexOf(offset(cell, x, y)),
        id = w.land.buildingIds[i] & 1023
      if (id && id !== plan && (w.land.flags[i] & 512 || !foreignTower(w, id, tribe))) return false
    }
  return true
}

// Complete 0x44ee50. Failure bits accumulate in the tribe's placement feedback.
export function buildingCellValid(
  w: BuildingValidityWorld,
  tribe: BuildingValidityTribe,
  cell: number,
  mask: number,
  model: number,
  plan = 0,
  computer = false
) {
  const { land } = w,
    i = indexOf(cell),
    flags = land.flags[i]
  const fail = (reason: number) => {
    tribe.flags = (tribe.flags | reason) >>> 0
    return false
  }
  let protectedScenery = false
  if (flags & 2)
    for (const object of w.scenery(i))
      if (object.class === 5 && rules.sceneryResourceFlags[object.model] & 0x200000) {
        protectedScenery = true
        tribe.flags = (tribe.flags | 0x20000000) >>> 0
        break
      }
  if (protectedScenery || flags & 0x4010000) {
    if (flags & 0x10000) tribe.flags = (tribe.flags | 0x4000000) >>> 0
    if (flags & 0x4000000) tribe.flags = (tribe.flags | 0x8000000) >>> 0
    return false
  }
  if (!(w.landFlags & 8) && tribe.playerType !== 1 && w.levelFlags & 4 && !(flags & 8))
    return fail(0x40000000)
  const id = land.buildingIds[i] & 1023
  if (id && id !== (plan & 65535) && (!(flags & 1024) || !foreignTower(w, id, tribe.tribe)))
    return fail(0x800000)
  if (model === 10) return false
  const slopeLimit =
    rules.buildingFlags[model] & 512 ? rules.buildingSteepSlopeLimit : rules.buildingSlopeLimit
  const radius = computer ? 1 : 0
  for (let y = -radius; y <= radius; y++)
    for (let x = -radius; x <= radius; x++)
      if (terrainCellHeightRange(land, offset(cell, x, y)) > slopeLimit) return fail(0x10000000)
  if (!neighborsClear(w, cell, (plan << 16) >> 16, tribe.tribe)) return fail(0x800000)
  if (mask & 248) {
    if (model < 13 || model > 14 || !(mask & 8)) return true
    return !!(rules.terrainCategoryFlags[land.categories[i] & 15] & 1) && hasNonLand(land, cell, 2)
  }
  return hasNonLand(land, cell, 1) ? fail(0x1000000) : true
}
