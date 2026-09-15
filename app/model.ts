import { personInCompletedTower } from './person-selection.ts'
import { selectionBuilding, unitAnimationSource } from './selection-runtime.ts'
import { unitInvisibleToPlayer } from './spell-effects-runtime.ts'
import type { Unit, World } from './world-types.ts'
export { ensureBuildingDamage } from './building-damage.ts'
export { buildingObject, buildingPose } from './building-shapes.ts'
export { campaignCommand, removeHead } from './campaign-command-runtime.ts'
export {
  campaignBuildingCount,
  campaignInternal,
  campaignPersonCount,
  campaignPosition,
  ENEMY,
  forceHead,
  HOME,
  markerHeight,
} from './campaign-runtime.ts'
export { fightPosition, joinBattle, meleeDamage } from './combat-runtime.ts'
export { computerMarkerOrderCount } from './computer-runtime.ts'
export {
  addBuilding,
  buildingBlocksStep,
  buildingContainsPoint,
  buildingPlanPose,
  footprint,
  footprintPoints,
  groundBuilding,
  placementError,
  rotateBuildingPlan,
} from './construction-runtime.ts'
export {
  cast,
  command,
  entrance,
  findPath,
  guardShaman,
  placeBuilding,
  spellTargetError,
  tell,
  walkable,
} from './live-command.ts'
export { manaRate } from './mana.ts'
export { nativeAngle, nativeStep, random } from './native-math.ts'
export {
  cancelInteraction,
  canOrder,
  hudPeople,
  select,
  selectArea,
  selectFollowers,
  selectionPeople,
  selectUnit,
  setSelection,
  unitAnimation,
  unitAnimationSource,
} from './selection-runtime.ts'
export { beginCast, recordSpellCast, spellInRange, spellRange } from './spell-casting.ts'
export {
  applyHypnotise,
  invisibilityFollowers,
  revealUnitInvisibility,
  setUnitInvisibility,
  shieldFollowers,
  stepUnitHypnotise,
  stepUnitInvisibility,
  stepUnitShields,
  unitInvisibilityRenderBit,
  unitInvisibilityRenderFlag,
  unitInvisibleToPlayer,
} from './spell-effects-runtime.ts'
export {
  browserPosition,
  distance,
  height,
  nativeCellPoint,
  nativeStep3D,
  nativeTerrainHeight,
  surface,
  terrainCross,
  worldPoint,
} from './world-coordinates.ts'
export { createGift, effect, emitGroundSpark, requestTutorial, sound } from './world-effects.ts'
export { createWorld } from './world-initialization.ts'
export {
  buildingHp,
  BUILDINGS,
  GRID,
  isShaman,
  maxHp,
  PLANET_RADIUS,
  ROUTE_FAILURE_TEXT,
  SIZE,
  SPELLS,
  TURNS_PER_SECOND,
} from './world-rules.ts'
export {
  addUnit,
  breedingWork,
  housing,
  population,
  populationLimit,
  trainingCost,
} from './world-state.ts'
export { releaseTasks } from './world-tasks.ts'
export {
  buildingStage,
  makeTerrain,
  nativePosition,
  supportsFollower,
  syncLandscapeObjects,
} from './world-terrain-runtime.ts'
export type {
  Building,
  BuildingKind,
  Effect,
  Gift,
  Point,
  Projectile,
  Shrine,
  SoundEvent,
  Spell,
  Team,
  Tree,
  Unit,
  Vehicle,
  World,
} from './world-types.ts'

export type { UnitKind } from './unit-kinds.ts'

export function canPickUnit(w: World, u: Unit) {
  if (unitInvisibleToPlayer(w, u)) return false
  const p = unitAnimationSource(u)
  if (!p) return u.inside === null
  return (
    !!(p.renderFlags & 128) &&
    (!(p.flags2 & 0x800000) || !personInCompletedTower(p, selectionBuilding(w, p)))
  )
}

export { buildingModel } from './building-shapes.ts'
export { nativeTerrainCross } from './native-math.ts'

export { tick, type TurnObserver } from './world-turn.ts'
