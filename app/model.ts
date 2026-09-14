import {
  changedBuildingGround,
  damageDisasterBuilding,
  debrisModels,
  evacuateBuilding,
  stepBuildingGroundResponse,
  stepBurningBuilding,
  stepDamagedBuilding,
} from './building-runtime.ts'
import {
  finishQueuedConstruction,
  constructionWorkers,
  dispatchConstructionCrew,
  timberCell,
  invalidateBuildingTimberSearch,
  footprint,
  footprintPoints,
  groundBuilding,
  buildingContainsPoint,
  buildingBlocksStep,
  rotateBuildingPlan,
  prepareBuildingSite,
} from './construction-runtime.ts'
export {
  footprint,
  footprintPoints,
  placementError,
  groundBuilding,
  buildingContainsPoint,
  buildingBlocksStep,
  addBuilding,
  buildingPlanPose,
  rotateBuildingPlan,
} from './construction-runtime.ts'
import {
  atBuildingEntrance,
  completeBuildingConstruction,
  directTimberDestination,
  entranceWood,
  findBuildingWood,
  harvestAssignedTree,
  haulBuildingWood,
  needsDirectTimber,
  processBuilderWork,
  stepLiveTimberSearches,
  stepQueuedTreeOrder,
} from './live-construction-runtime.ts'
import {
  headAt,
  campaignInternal,
  campaignPersonCount,
  campaignPeopleInMarker,
  campaignAttackTarget,
  forceHead,
  campaignPosition,
  campaignTribe,
  cleanupDefeatedTribe,
} from './campaign-runtime.ts'
export {
  campaignInternal,
  campaignPersonCount,
  campaignBuildingCount,
  forceHead,
  campaignPosition,
  HOME,
  ENEMY,
  markerHeight,
} from './campaign-runtime.ts'
import { campaignRules, stepForcedCampaignAttack } from './campaign-command-runtime.ts'
export { campaignCommand, removeHead } from './campaign-command-runtime.ts'
import {
  computerSelectionWorld,
  computerTrainingBuilding,
  refreshTribeTerritory,
  stepComputerSpells,
  stepComputerTasks,
} from './computer-runtime.ts'
export { computerMarkerOrderCount } from './computer-runtime.ts'
import {
  builderActivity,
  unitAnimationSource,
  selectionBuilding,
  canOrder,
} from './selection-runtime.ts'
export {
  unitAnimation,
  unitAnimationSource,
  canOrder,
  select,
  selectionPeople,
  hudPeople,
  selectFollowers,
  setSelection,
  selectUnit,
  selectArea,
  cancelInteraction,
} from './selection-runtime.ts'
import {
  applyHypnotise,
  emitBlastWave,
  igniteLightningScenery,
  invisibilityFollowers,
  processProjectiles,
  restoreDeadHypnotisedUnit,
  shieldFollowers,
  stepGhostArmy,
  stepLiveBlastWave,
  stepLiveConvertWild,
  stepLiveSwamp,
  stepSwarm,
  stepUnitHypnotise,
  stepUnitInvisibility,
  stepUnitShields,
  unitInvisibleToPlayer,
} from './spell-effects-runtime.ts'
export {
  applyHypnotise,
  invisibilityFollowers,
  revealUnitInvisibility,
  setUnitInvisibility,
  shieldFollowers,
  stepUnitHypnotise,
  stepUnitInvisibility,
  stepUnitShields,
  unitInvisibleToPlayer,
  unitInvisibilityRenderBit,
  unitInvisibilityRenderFlag,
} from './spell-effects-runtime.ts'
import { meleeDamage, joinBattle, cleanBattles, processBattles } from './combat-runtime.ts'
export { meleeDamage, fightPosition, joinBattle } from './combat-runtime.ts'
import { release, releaseTasks } from './world-tasks.ts'
export { releaseTasks } from './world-tasks.ts'
import {
  sound,
  effect,
  createGift,
  shotVisual,
  moveVisual,
  emitGroundSpark,
  stepDebrisEffect,
  createFire,
  depleteTree,
  stepScenery,
  registerTerrainLight,
  refreshTerrainLights,
  requestTutorial,
} from './world-effects.ts'
export { sound, effect, createGift, emitGroundSpark, requestTutorial } from './world-effects.ts'
import { buildingObject, buildingPose } from './building-shapes.ts'
export { buildingObject, buildingPose } from './building-shapes.ts'
import {
  nativePosition,
  refreshTerrainSurface,
  nativeCellIndex,
  terrainTextures,
  notifyHeightChanges,
  syncNativeTerrain,
  buildingStage,
  syncLandscapeObjects,
  originalLand,
  makeTerrain,
  supportsFollower,
} from './world-terrain-runtime.ts'
export {
  nativePosition,
  buildingStage,
  syncLandscapeObjects,
  makeTerrain,
  supportsFollower,
} from './world-terrain-runtime.ts'
import {
  worldPoint,
  distance,
  nativeStep3D,
  browserPosition,
  nativeTerrainHeight,
  terrainCross,
  height,
  surface,
  nativeCellPoint,
} from './world-coordinates.ts'
export {
  worldPoint,
  distance,
  nativeStep3D,
  browserPosition,
  nativeTerrainHeight,
  terrainCross,
  height,
  surface,
  nativeCellPoint,
} from './world-coordinates.ts'
import { short } from './native-math.ts'
import {
  housing,
  population,
  populationLimit,
  breedingWork,
  trainingCost,
  addUnit,
} from './world-state.ts'
export {
  housing,
  population,
  populationLimit,
  breedingWork,
  trainingCost,
  addUnit,
} from './world-state.ts'
export { createWorld } from './world-initialization.ts'
import {
  isShaman,
  TURNS_PER_SECOND,
  SPELLS,
  BUILDINGS,
  SIZE,
  GRID,
  PLANET_RADIUS,
  unitSpeed,
  maxHp,
  buildingHp,
  ROUTE_FAILURE_TEXT,
} from './world-rules.ts'
export {
  isShaman,
  TURNS_PER_SECOND,
  SPELLS,
  BUILDINGS,
  SIZE,
  GRID,
  PLANET_RADIUS,
  maxHp,
  buildingHp,
  ROUTE_FAILURE_TEXT,
} from './world-rules.ts'
import type {
  Team,
  BuildingKind,
  Spell,
  Point,
  Fight,
  NativePoint,
  Vehicle,
  Projectile,
  Battle,
  Unit,
  Building,
  Shrine,
  Tree,
  SoundEvent,
  Effect,
  World,
} from './world-types.ts'
export type {
  Team,
  BuildingKind,
  Spell,
  Point,
  Vehicle,
  Projectile,
  Unit,
  Building,
  Shrine,
  Tree,
  SoundEvent,
  Effect,
  Gift,
  World,
} from './world-types.ts'
import { selectHudPeople, type HudSelectionMode } from './hud-selection.ts'
import { worshipHeadPose } from './live-worship.ts'
import {
  cancelLiveOrder,
  stepLiveConversionVictim,
  stepLiveMovement,
  stepLivePreaching,
  stepLiveMarchingFormations,
  type LiveFormation,
} from './live-movement.ts'
import { cancelLiveResting, stepLiveResting } from './live-resting.ts'
import { createFootprints, type Footprints } from './footprints.ts'
import {
  joinMeleeGroup,
  cleanFightRoster,
  releaseFightRoster,
  fightCenter,
  type MeleeGroup,
  type FightParticipant,
} from './melee-groups.ts'
import { announceCombatMarches, type CombatMarch } from './combat-order-search.ts'
import {
  stepLiveBuildingAttack,
  cancelLiveBuildingAttack,
  startLiveCombatResponse,
} from './live-building-combat.ts'
import { nativePersonModel, nativePersonTribe } from './live-combat.ts'
import { buildingDoor, entrance, findPath, route, tell } from './live-command.ts'
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
import { pursuitDestinationChanged } from './person-routes.ts'
import { stepAttackReservation, type AttackReservation } from './combat-targets.ts'
import {
  currentPersonOrder,
  emptyPersonOrder,
  type OrderPool,
} from './person-orders.ts'
import {
  clickPersonSelection,
  markPersonSelected,
  selectedPersonVoice,
  selectedGroupVoices,
  canDragPerson,
  personInCompletedTower,
} from './person-selection.ts'
import {
  dragCommandCorners,
  dragCellBounds,
  inDragCells,
  unwrapDragCorners,
  inDragSelection,
} from './drag-selection.ts'
import { relocateFight } from './melee-placement.ts'
import { chooseMeleeAttack, meleeDuration, type MeleeAttack } from './melee.ts'
import { stepPersonFireTrail } from './person-panic.ts'
import { BuilderTask } from './building-workers.ts'
import { stepBuildingWork, stepBuildingDeparture, stepBuildingApproach } from './building-work.ts'
import { stepBuildingFetch } from './building-fetch.ts'
import { stepBuildingLevel } from './building-preparation.ts'
import {
  defaultPersonState,
  faceTribe,
  personAnimationObject,
  recoverPersonMovement,
  setPersonAnimationRow,
  stopPersonMovement,
} from './person-state.ts'
import {
  stepBuildingScenery,
  stepBuildingPeople,
  SceneryPhase,
  type ClearingPerson,
} from './building-clearing.ts'
import { restingCellAvailable } from './resting-slots.ts'
import { buildingCellValid } from './building-validity.ts'
import { notifyTerrainObjects } from './terrain-notifications.ts'
import { turnPerson } from './person-motion.ts'
import { addTerrainLight, updateTerrainLights, type TerrainLights } from './terrain-light.ts'
import { stepHutUpgrade, looseWoodInCell } from './hut-upgrade.ts'
import {
  startTimberHarvest,
  stepTimberHarvest,
  timberTransfer,
  dropCarriedTimber,
  reserveTimber,
  releaseTimberReservation,
} from './timber.ts'
import { createIndexedSearch } from './indexed-search.ts'
import {
  createTimberSearches,
  findTimber,
  invalidateTimberSearch,
  invalidateTimberRoutes,
  looseTimberInCell,
  orderedTimberCells,
  refreshTimberSearch,
  stepTimberSearches,
  type TimberSearchWorld,
} from './timber-search.ts'
import { reincarnationStones, reincarnationTurns, stepReincarnation } from './reincarnation.ts'
import { stepHutBirth, hutBirthPoints } from './hut-birth.ts'
import { personStepCollision } from './person-collision.ts'
import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import { createSpellTrail, stepSpellTrail, type SpellTrail } from './spell-trails.ts'
import { createBuildingSmoke, stepBuildingSmoke, type BuildingSmoke } from './building-smoke.ts'
import { collapseBuildingFaces } from './building-debris.ts'
import modelAssets from './original-models.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'
import { stepLightning, type Lightning } from './lightning.ts'
import { createLandBridge, stepLandBridge, type LandBridge } from './land-bridge.ts'
import { stepFlatten, type Flatten } from './flatten.ts'
import { createErosion, stepErosion, type Erosion } from './erosion.ts'
import { stepFirestorm, type Firestorm } from './firestorm.ts'
import { stepEarthquake, type Earthquake } from './earthquake.ts'
import { stepVolcano, type Volcano } from './volcano.ts'
import { stepLiveTornado, stepLiveTornadoPerson } from './tornado-runtime.ts'
import {
  probeLivePathCost,
  clearLivePath,
  replanLivePath,
  stepLiveRoute,
  removeDeadLiveRoutes,
} from './live-pathfinding.ts'
import {
  collisionWorld,
  enterLiveCombat,
  stepLivePhysics,
  stepLiveEncounter,
  createLivePerson,
  createMeleePerson,
  setLivePersonAnimation,
  initializeLiveCelebration,
  initializeLivePanic,
  strikeLiveLightning,
  stepLiveElectrocution,
  cancelBuildingEntry,
  leaveLiveBuilding,
  stepLivePerson,
  stepLiveImpulse,
  registerLivePerson,
  changeLivePersonState,
  disturbLiveVolcanoPerson,
  startMeleeKnockback,
  approachLiveMelee,
  stepLiveMeleeMotion,
  syncLivePersonCells,
  type LivePerson,
} from './live-people.ts'
import {
  removeObjectFromCell,
  objectsInCell,
  type ObjectCells,
} from './object-cells.ts'
import {
  stepBuildingEntry,
  isDismantling,
  buildingAdmission,
  stepLiveTraining,
  type BuildingEntry,
  type BuildingAdmission,
} from './live-building-entry.ts'
import { stepBuildingEntryClocks } from './training.ts'
import {
  createMotionRoutes,
  ageFailedRoutes,
  setDirectPersonDestination,
  releasePersonRoute,
  type MotionRoutes,
} from './person-routes.ts'
import {
  nativeAngle,
  nativeStep,
  random,
  positionDistance,
  nativeTerrainCross,
} from './native-math.ts'
import {
  queueTerrain,
  processTerrain,
  updateWalkMasks,
  terrainPointHeight,
  type NativeTerrain,
} from './native-terrain.ts'
import { markBuildingTerritory, type Territory } from './territory.ts'
import {
  processTribes,
  processOutcome,
  stepOutcome,
  type TribeTurnState,
  type OutcomeWorld,
} from './tribe-turns.ts'
import {
  buildingModel,
  buildingFootprintCells,
  buildingFootprintTiles,
  type BuildingShapePose,
  buildingOutsidePoint,
  buildingInsidePoint,
  buildingPosition,
  buildingGradeVertices,
  buildingPlanHeight,
  levelBuildingGround,
  buildingSmokePoint,
  buildingRepairArea,
} from './building-shapes.ts'
import { nativeTrainingCost } from './building-occupants.ts'
import {
  stepBuildingTerrain,
  stepTerrainCollapse,
  type BuildingTerrain,
} from './building-terrain.ts'
import { stepSinkingBuilding, type SinkingBuilding } from './building-sinking.ts'
import {
  advanceCollapse,
  stepBuildingShake,
  processBuildingDamage,
  ensureBuildingDamage,
  stepBuildingBurn,
  type BuildingBurn,
  changeBuildingWork,
  buildingWorkStage,
  type DamageBuilding,
  type BuildingPlan,
} from './building-damage.ts'
export { ensureBuildingDamage } from './building-damage.ts'
import {
  distributeMana,
  generateFollowerMana,
  liveManaOrders,
  manaPeople,
  type ManaWorld,
  type ManaTribe,
} from './mana.ts'
export { manaRate } from './mana.ts'
export { nativeAngle, nativeStep, random } from './native-math.ts'
import { createTribeCasting, stepComputerCastCooldown, type TribeCasting } from './spell-casting.ts'
export { recordSpellCast, spellRange, spellInRange, beginCast } from './spell-casting.ts'
import { type SpellTargetScan } from './computer-spells.ts'
import {
  requestAttack,
  requestMarkerTask,
  requestShamanGuard,
  requestTraining,
  creditAttackTask,
} from './computer.ts'
import { availableTrainingPeople } from './computer-selection.ts'
import { createFlyby, flybyCommand, type Flyby } from './flyby.ts'
import {
  stepWorship,
  stepWorshipHead,
  countWorshippers,
  worshipProgress,
  type WorshipState,
} from './worship.ts'
import type { ModelMorph } from './morph.ts'
import { processVaultTask, stepVaultWork, stepVaultTask, type VaultTask } from './vault.ts'
import rules from './original-rules.json' with { type: 'json' }
import type { UnitKind } from './unit-kinds.ts'

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

export { nativeTerrainCross } from './native-math.ts'
export { buildingModel } from './building-shapes.ts'

export { tick, type TurnObserver } from './world-turn.ts'
