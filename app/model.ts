import { finishQueuedConstruction, constructionWorkers, dispatchConstructionCrew, timberCell, invalidateBuildingTimberSearch } from './construction-runtime.ts'
import {
  headAt,
  campaignInternal,
  campaignPersonCount,
  campaignPeopleInMarker,
  campaignAttackEntity,
  campaignAttackTarget,
  forceHead,
  missionAI,
} from './campaign-runtime.ts'
export { campaignInternal, campaignPersonCount, campaignBuildingCount, forceHead } from './campaign-runtime.ts'
import { builderActivity, unitAnimationSource, selectionBuilding, canOrder, selectionPeople, cancelInteraction } from './selection-runtime.ts'
export { unitAnimationSource, canOrder, select, selectionPeople, hudPeople, selectFollowers, setSelection, selectUnit, selectArea, cancelInteraction } from './selection-runtime.ts'
import { meleeDamage, joinBattle, cleanBattles, processBattles } from './combat-runtime.ts'
export { meleeDamage, fightPosition, joinBattle } from './combat-runtime.ts'
import { release, releaseTasks } from './world-tasks.ts'
export { releaseTasks } from './world-tasks.ts'
import { sound, effect, registerTerrainLight, refreshTerrainLights } from './world-effects.ts'
export { sound, effect } from './world-effects.ts'
import { buildingObject, buildingPose } from './building-shapes.ts'
export { buildingObject, buildingPose } from './building-shapes.ts'
import { nativePosition, refreshTerrainSurface, nativeCellIndex, terrainTextures, notifyHeightChanges, syncNativeTerrain } from './world-terrain-runtime.ts'
export { nativePosition } from './world-terrain-runtime.ts'
import { worldPoint, distance, nativeStep3D, browserPosition, nativeDistance, shotAngles, nativeTerrainHeight, terrainCross, height, surface, nativeCellPoint } from './world-coordinates.ts'
export { worldPoint, distance, nativeStep3D, browserPosition, nativeTerrainHeight, terrainCross, height, surface, nativeCellPoint } from './world-coordinates.ts'
import { short } from './native-math.ts'
import { housing, population, populationLimit, breedingWork, trainingCost, addUnit } from './world-state.ts'
export { housing, population, populationLimit, breedingWork, trainingCost, addUnit } from './world-state.ts'
import {
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
  Projectile,
  Battle,
  Unit,
  Building,
  Shrine,
  Tree,
  SoundEvent,
  Effect,
  Gift,
  World,
} from './world-types.ts'
export type {
  Team,
  BuildingKind,
  Spell,
  Point,
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
import { worshipOrder, worshipHeadPose } from './live-worship.ts'
import {
  movementOrder,
  appendLiveOrders,
  appendLiveGuardOrders,
  startLiveOrder,
  startLiveConstructionOrder,
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
import { EncounterPhase } from './melee-encounter.ts'
import { announceCombatMarches, type CombatMarch } from './combat-order-search.ts'
import {
  stepLiveBuildingAttack,
  cancelLiveBuildingAttack,
  startLiveCombatResponse,
} from './live-building-combat.ts'
import { combatPerson, nativePersonModel, nativePersonTribe } from './live-combat.ts'
import { liveCommandContext } from './live-command.ts'
import { pursuitDestinationChanged } from './person-routes.ts'
import { stepAttackReservation, type AttackReservation } from './combat-targets.ts'
import {
  currentPersonOrder,
  playerOrderInput,
  deselectPerson,
  emptyPersonOrder,
  allocatePersonOrder,
  acceptsPersonOrder,
  writePersonOrder,
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
import {
  assignBuilder,
  pruneBuilders,
  stepConstructionCrew,
  stepUnbuiltPlan,
  type UnbuiltPlan,
  BuilderTask,
  type Builder,
} from './building-workers.ts'
import { stepBuildingWork, stepBuildingDeparture, stepBuildingApproach } from './building-work.ts'
import { stepBuildingFetch } from './building-fetch.ts'
import { stepBuildingLevel } from './building-preparation.ts'
import {
  defaultPersonState,
  faceTribe,
  personAnimationObject,
  randomPersonSpeed,
  recoverPersonMovement,
  setPersonAnimationRow,
  stopPersonMovement,
} from './person-state.ts'
import { damagePerson } from './person-update.ts'
import { createBlastWave, stepBlastWave, type BlastWave, type BlastTarget } from './blast-wave.ts'
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
} from './timber.ts'
import {
  stepTreeGrowth,
  replantDelay,
  findReplantSite,
  stepReplant,
  type Replant,
} from './tree-growth.ts'
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
import {
  personStepCollision,
  restingCellCollision,
  terrainSupportsPerson,
} from './person-collision.ts'
import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import { createSpellTrail, stepSpellTrail, type SpellTrail } from './spell-trails.ts'
import { createBuildingSmoke, stepBuildingSmoke, type BuildingSmoke } from './building-smoke.ts'
import {
  createSceneryFire,
  setFireLifetime,
  stepSceneryFire,
  stepBurningTree,
  type SceneryFire,
  type BurningTree,
} from './scenery-fire.ts'
import {
  collapseBuildingFaces,
  stepBuildingDebris,
  type BuildingDebris,
} from './building-debris.ts'
import modelAssets from './original-models.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'
import { stepLightning, type Lightning } from './lightning.ts'
import { createLandBridge, stepLandBridge, type LandBridge } from './land-bridge.ts'
import { createFlatten, stepFlatten, type Flatten } from './flatten.ts'
import { createErosion, stepErosion, type Erosion } from './erosion.ts'
import { createSwamp, excessSwamp, stepSwamp, type Swamp, type SwampTarget } from './swamp.ts'
import { createFirestorm, stepFirestorm, type Firestorm } from './firestorm.ts'
import { createEarthquake, stepEarthquake, type Earthquake } from './earthquake.ts'
import { createVolcano, stepVolcano, type Volcano } from './volcano.ts'
import { createConvertWild, stepConvertWild, type ConvertWild } from './convert-wild.ts'
import {
  createTornado,
  stepTornado,
  stepTornadoPerson,
  type Tornado,
  type TornadoBuilding,
  type TornadoPerson,
  type TornadoScenery,
} from './tornado.ts'
import {
  createLivePathfinding,
  findLivePath,
  planLivePath,
  probeLivePathCost,
  acceptLivePath,
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
  buildingFirePeople,
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
  moveObjectInCells,
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
  cellDistanceSquared,
  positionDistance,
  nativeTerrainCross,
  spiralCell,
} from './native-math.ts'
import {
  createNativeTerrain,
  queueTerrain,
  processTerrain,
  updateWalkMasks,
  terrainPointHeight,
  type NativeTerrain,
} from './native-terrain.ts'
import { markBuildingTerritory, refreshBuildingTerritory, type Territory } from './territory.ts'
import {
  processTribes,
  processOutcome,
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
  chooseBuildingObject,
  buildingSmokePoint,
  buildingFirePoints,
  buildingRepairArea,
  registerBuildingFootprint,
  refreshSceneryShadow,
  nativeCellShade,
  type RegisteredBuilding,
  type SceneryShapePose,
} from './building-shapes.ts'
import { nativeTrainingCost } from './building-occupants.ts'
import {
  stepBuildingTerrain,
  stepTerrainCollapse,
  type BuildingTerrain,
} from './building-terrain.ts'
import { stepSinkingBuilding, type SinkingBuilding } from './building-sinking.ts'
import {
  defeatTribe,
  advanceCollapse,
  stepBuildingShake,
  processBuildingDamage,
  igniteBuilding,
  stepBuildingBurn,
  type BuildingBurn,
  changeBuildingWork,
  buildingWorkStage,
  type DamageBuilding,
  type BuildingPlan,
} from './building-damage.ts'
import {
  distributeMana,
  generatedMana,
  generateFollowerMana,
  type ManaWorld,
  type ManaTribe,
} from './mana.ts'
export { nativeAngle, nativeStep, random } from './native-math.ts'
import {
  spellCaster,
  spellInRange,
  beginCast,
  createTribeCasting,
  canShamanCast,
  stepComputerCastCooldown,
  type TribeCasting,
} from './spell-casting.ts'
export { recordSpellCast, spellRange, spellInRange, beginCast } from './spell-casting.ts'
import {
  castShoreBlast,
  processComputerSpells,
  type SpellTargetScan,
  type SpellTargetWorld,
  type SpellTargetUnit,
} from './computer-spells.ts'
import {
  computerPhase,
  dispatchComputerTask,
  requestAttack,
  requestMarkerTask,
  requestShamanGuard,
  requestTraining,
  creditAttackTask,
  stepAttackTask,
  stepMarkerTask,
  stepShamanGuardTask,
  stepTrainingTask,
  type ComputerQueue,
  type TrainingBuilding,
} from './computer.ts'
import {
  availableTrainingPeople,
  selectComputerPeople,
  type SelectionUnit,
  type SelectionWorld,
} from './computer-selection.ts'
import { createFlyby, flybyCommand, type Flyby } from './flyby.ts'
import level from './level-one.ts'
import originalScript from './original-script.json' with { type: 'json' }
import {
  runScript,
  scriptValue,
  type ScriptState,
  type PopScript,
} from './popscript.ts'
import {
  createWorship,
  stepWorship,
  stepWorshipHead,
  worshipApproach,
  countWorshippers,
  worshipProgress,
  type WorshipState,
} from './worship.ts'
import type { ModelMorph } from './morph.ts'
import { createMessages, addMessage, messageStringId, type MessageState } from './messages.ts'
import { stepVaultWork, stepVaultTask, type VaultTask } from './vault.ts'
import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { unitKindFromModel, type UnitKind } from './unit-kinds.ts'

const debrisModels: Record<number, NativeModel> = modelAssets
export type { UnitKind } from './unit-kinds.ts'
const position = (owner: number) => {
  const o = level.objects.find(o => o.type === 1 && o.model === 7 && o.owner === owner)!
  return { x: o.x, z: o.z }
}
export const HOME = position(0),
  ENEMY = position(1)
const unitSpeed = (u: Unit) =>
  u.kind === 'shaman'
    ? constants.MEDICINE_MAN_SPEED
    : u.kind === 'warrior'
      ? constants.WARRIOR_SPEED
      : u.kind === 'preacher'
        ? constants.RELIGIOUS_SPEED
        : constants.BRAVE_SPEED


export function canPickUnit(w: World, u: Unit) {
  if (unitInvisibleToPlayer(w, u)) return false
  const p = unitAnimationSource(u)
  if (!p) return u.inside === null
  return (
    !!(p.renderFlags & 128) &&
    (!(p.flags2 & 0x800000) || !personInCompletedTower(p, selectionBuilding(w, p)))
  )
}

export function unitAnimation(w: World, u: Unit) {
  if (u.lift > 0) return 'airborne'
  if (u.casting) return 'cast'
  if (u.fight?.animation) return u.fight.animation
  if (u.fight?.action === 'encounter') {
    const p = u.fight.motion!
    return p.substate === EncounterPhase.Strike
      ? 'attack'
      : p.substate === EncounterPhase.Knockback
        ? 'stagger'
        : p.speed
          ? 'walk'
          : 'idle'
  }
  if (u.fight)
    return u.fight.action === 'approach'
      ? 'walk'
      : u.fight.action === 'ready'
        ? 'idle'
        : u.fight.action === 'push'
          ? 'walk'
          : u.fight.action
  if (u.fighting) return 'attack'
  if (builderActivity(u) && u.builder?.person) {
    if (u.builder.person.speed) return u.cargo ? 'carry' : 'walk'
    if (u.builder.task === BuilderTask.Level && u.builder.phase === 28) return 'dance'
    if (u.builder.task === BuilderTask.ClearScenery && u.builder.phase === SceneryPhase.Harvest)
      return 'work'
    if (u.builder.task === BuilderTask.Work && !w.buildings.find(b => b.id === u.work)?.preparation)
      return 'work'
    return u.cargo ? 'carryIdle' : 'idle'
  }
  if (u.path.length) return u.cargo ? 'carry' : 'walk'
  if (u.cargo) return 'carryIdle'
  if (u.harvest) return 'work'
  if (
    w.shrines.some(
      s =>
        s.id === u.work &&
        s.active &&
        distance(s, u) < 3 &&
        (s.kind !== 'vault' || u.vault?.phase === 2)
    )
  )
    return 'pray'
  return w.selected.includes(u.id) ? 'selected' : 'idle'
}
export { nativeTerrainCross } from './native-math.ts'
const originalLand = createNativeTerrain(new Int16Array(16384))
const originalTerrain = originalLand.heights
for (const [x, y, h] of level.heights) originalTerrain[y * 128 + x] = h
// 0x44e850: complete two-traversal initialization before browser resampling.
// ponytail: original texture assets still supply rendering; native texture
// consumers join this queue when palette/texture rebuilding is integrated.
queueTerrain(originalLand, 0, 64, 1, { surface: () => {}, globe: () => {} })
updateWalkMasks(originalLand, 0, 64)
export function makeTerrain() {
  return Array.from({ length: GRID * GRID }, (_, i) => {
    const x = (i % GRID) - 48,
      z = Math.floor(i / GRID) - 48,
      h = nativeTerrainHeight(originalTerrain, (x + 8) * 256, (-z - 8) * 256) / 45
    // ponytail: cropped/resampled terrain and artificial seabed remain until the native world grid is ported.
    return h === 0 ? -0.35 : h
  })
}
export const footprint = (kind: BuildingKind) => (kind === 'temple' ? 3.9 : 3)
export function footprintPoints(kind: BuildingKind, p: Point) {
  const r = footprint(kind),
    points: Point[] = []
  for (let z = Math.floor(p.z - r); z <= Math.ceil(p.z + r); z++)
    for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) points.push({ x, z })
  return points
}
function checkBuildingSite(w: World, pose: BuildingShapePose, model: number, team: Team, plan = 0) {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  const tribe = {
    tribe: team === 'blue' ? 0 : 1,
    playerType: w.manaTribes[team === 'blue' ? 0 : 1].playerType,
    flags: 0,
  }
  // ponytail: build a read-only cell view until all scenery and shrine classes
  // share the world's native object index.
  const land = { ...w.land, flags: w.land.flags.slice(), buildingIds: w.land.buildingIds.slice() }
  const buildings = new Map(
    w.buildings
      .filter(b => b.hp > 0)
      .map(b => [b.id & 1023, { model: buildingModel(b), tribe: b.team === 'blue' ? 0 : 1 }])
  )
  const scenery = new Map<number, { class: number; model: number }[]>()
  const add = (p: NativePoint, model: number) => {
    const i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const row = scenery.get(i) ?? []
    row.push({ class: 5, model })
    scenery.set(i, row)
    land.flags[i] |= 2
  }
  for (const tree of w.trees) if (tree.logs > 0) add(nativePosition(w, tree), tree.model)
  for (const shrine of w.shrines) {
    if (shrine.kind !== 'vault') {
      add(nativePosition(w, shrine), 9)
      continue
    }
    const p = nativePosition(w, shrine),
      id = shrine.id & 1023
    buildings.set(id, { model: 18, tribe: 255 })
    for (const i of buildingFootprintCells({
      object: rules.buildingObjects[18],
      angle: Math.round((shrine.angle * 1024) / Math.PI) & 2047,
      anchorX: p.x & 0xfe00,
      anchorY: p.y & 0xfe00,
    })) {
      land.flags[i] |= 512
      land.buildingIds[i] = (land.buildingIds[i] & 0xfc00) | id
    }
  }
  for (const center of [HOME, ENEMY])
    for (const stone of reincarnationStones(land, nativePosition(w, center))) add(stone, 12)
  const world = {
    land,
    // ponytail: the live first mission has no fog ownership; connect these
    // original visibility gates when level loading owns the native fog flags.
    landFlags: 0,
    levelFlags: 0,
    building: (id: number) => {
      const b = buildings.get(id)
      if (!b) throw new Error(`Missing placement object ${id}`)
      return b
    },
    scenery: (i: number) => scenery.get(i) ?? [],
  }
  const valid = buildingFootprintTiles(pose).every(({ index, mask }) =>
    buildingCellValid(
      world,
      tribe,
      ((index & 127) << 1) | ((index >> 7) << 9),
      mask,
      model,
      plan,
      tribe.playerType === 1
    )
  )
  return { valid, flags: tribe.flags }
}
export function placementError(w: World, kind: BuildingKind, p: Point) {
  const plan = buildingPlanPose(w, kind, p)
  const result = checkBuildingSite(w, plan, buildingModel({ kind, level: 1 }), 'blue')
  if (!result.valid) {
    if (result.flags & 0x800000) return 'Leave room around the other buildings and their entrances.'
    if (result.flags & 0x10000000) return 'This slope is too steep. Choose a level building site.'
    if (result.flags & 0x20000000) return 'Leave the worship site clear.'
    return 'The whole building needs dry land, including its fence and doorway.'
  }
  p = browserPosition({ x: plan.anchorX, y: plan.anchorY })
  // ponytail: placement reach still uses settlement proximity until the full
  // preview controller's territory and capacity queries are connected.
  if (!w.buildings.some(b => b.team === 'blue' && distance(b, p) < 16) && distance(HOME, p) > 16)
    return 'Build next to your settlement or reincarnation site.'
  return null
}
export function groundBuilding(w: World, b: Building, prepare = b.progress < 1) {
  syncNativeTerrain(w)
  const pose = buildingPose(b),
    model = buildingModel(b)
  if (prepare) {
    const target = buildingPlanHeight(w.land, pose, model, 0, 0)
    // Direct building insertion prepares immediately; player plans are graded
    // by their workers and pass false during delayed allocation.
    for (const c of buildingGradeVertices(pose)) w.land.heights[c.index] = target
  }
  levelBuildingGround(w.land.heights, pose, model, (cell, radius) => {
    queueTerrain(w.land, cell, radius, 1, terrainTextures)
    processTerrain(w.land, terrainTextures)
    updateWalkMasks(w.land, cell, radius + 1)
    invalidateTimberRoutes(w.timberSearches, cell, radius)
  })
  b.foundation = terrainPointHeight(w.land, buildingPosition(pose)) / 45
  refreshTerrainSurface(w)
}
export function walkable(terrain: number[], p: Point) {
  return Math.abs(p.x) < 47 && Math.abs(p.z) < 47 && height(terrain, p.x, p.z) > 0.45
}
export const buildingContainsPoint = (b: Building, p: Point) =>
  b.progress === 1 && distance(b, p) < 2.35
export const buildingBlocksStep = (b: Building, start: Point, next: Point) =>
  buildingContainsPoint(b, next) && !buildingContainsPoint(b, start)
// Terrain support follows the original coastal mask, including low dry shore.
export function supportsFollower(w: World, p: Point & { inside?: number | null }) {
  // Occupants remain with their building until its controller ejects them.
  // Terrain-only route points still use the ordinary coastal support predicate.
  if (p.inside != null && w.buildings.some(b => b.id === p.inside && b.hp > 0)) return true
  const n = nativePosition(w, p),
    cell = ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
  return !!terrainSupportsPerson(w.land.categories[cell], n)
}
export function findPath(w: World, start: Unit, end: Point): Point[] {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  return findLivePath(w, start, end)
}
function planRoute(w: World, u: Unit, end: Point) {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  return planLivePath(w, u, end)
}
function route(w: World, u: Unit, end: Point, preserveOrders = false) {
  cancelLiveResting(w, u)
  const person = u.native ?? u.fight?.motion
  if (!preserveOrders && (!person || currentPersonOrder(w.buildingOrders, person)?.model !== 28))
    cancelLiveOrder(w, u)
  return acceptLivePath(w, u, planRoute(w, u, end))
}
function buildingId(w: World) {
  if (w.nextId < 1024) return w.nextId++
  // Terrain packs a ten-bit building handle beside lighting. Browser effects
  // have unbounded IDs, so they must not push new buildings out of that range.
  // Full native allocation/list ownership remains separate from this adapter.
  const used = new Set(
    [w.units, w.buildings, w.trees, w.shrines, w.effects, w.fights, w.projectiles].flatMap(
      objects => objects.map(o => o.id)
    )
  )
  for (let id = 1023; id > 0; id--) if (!used.has(id)) return id
  throw new Error('No free terrain building handles')
}

export function addBuilding(
  w: World,
  team: Team,
  kind: BuildingKind,
  p: Point,
  complete = true,
  { angle = 0, level: buildingLevel = 1, plan = false } = {}
) {
  const b: Building = {
    x: p.x,
    z: p.z,
    id: buildingId(w),
    anchor: { x: Math.round((p.x + 8) * 256) & 0xfe00, y: Math.round((-p.z - 8) * 256) & 0xfe00 },
    team,
    kind,
    object: plan
      ? rules.buildingObjects[buildingModel({ kind, level: buildingLevel })]
      : chooseBuildingObject(
          buildingModel({ kind, level: buildingLevel }),
          team === 'blue' ? 0 : 1,
          w
        ),
    hp: buildingHp(kind),
    progress: complete ? 1 : 0,
    timer: 0,
    foundation: 0,
    level: buildingLevel,
    logs: complete ? (BUILDINGS.find(b => b.id === kind)?.cost ?? 0) : 0,
    upgrade: 0,
    upgrading: false,
    angle,
    counter: 0,
    damageState: null,
  }
  Object.assign(b, browserPosition(buildingPosition(buildingPose(b))))
  if (plan) {
    syncNativeTerrain(w)
    b.preparation = {
      model: buildingModel(b),
      counter: 0,
      dirty: true,
      revalidate: false,
      timeout: 0,
      height: buildingPlanHeight(w.land, buildingPose(b), buildingModel(b), 0, 0),
      alternateHeight: 0,
      work: 0,
    }
    b.foundation = terrainPointHeight(w.land, buildingPosition(buildingPose(b))) / 45
  } else groundBuilding(w, b)
  w.buildings.push(b)
  if (complete && kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  return b
}
export function createWorld(): World {
  const w: World = {
    flyby: createFlyby(),
    inputMask: 0,
    lastMessage: -1,
    ai: missionAI(),
    messages: createMessages(),
    spellCasts: Array.from({ length: 4 }, () => Array(22).fill(0)),
    killCredits: Array.from({ length: 4 }, () => Array(4).fill(0)),
    gifts: [],
    giftCounts: {
      blast: 0,
      convertWild: 0,
      hypnotise: 0,
      ghostArmy: 0,
      bridge: 0,
      lightning: 0,
      flatten: 0,
      erosion: 0,
      swamp: 0,
      firestorm: 0,
      earthquake: 0,
      volcano: 0,
      tornado: 0,
      shield: 0,
      invisibility: 0,
      swarm: 0,
    },
    objectCells: { heads: new Uint16Array(16384), objects: new Map() },
    marching: [],
    combatMarches: [],
    lastOrderTurn: 0,
    buildingOrders: {
      records: Array.from({ length: 800 }, emptyPersonOrder),
      cursor: 1,
      active: 0,
    },
    motionRoutes: createMotionRoutes(),
    pathfinding: createLivePathfinding(),
    timberSearches: createTimberSearches(),
    land: {
      ...structuredClone(originalLand),
      regions: new Uint8Array(16384),
      searchMarks: new Uint8Array(16384),
      searchTag: 255,
    },
    landVersion: -1,
    lights: Array(50).fill(null),
    lightView: { x: 0, y: 0 },
    lightRevision: 0,
    buildingFootprints: new Map(),
    sceneryShadows: new Map(),
    spellScan: { cursor: 0, limit: 0, paused: 0, targets: [0, 0, 0, 0] },
    castingTribes: Array.from({ length: 4 }, (_, id) => createTribeCasting(id !== 0)),
    tribeCount: 2,
    levelFlags2: 0,
    outcome: {
      campaignTribes: 2,
      level: 1,
      progressFlags: 0,
      lastDefeated: 0,
      defeatedCounts: [0, 0, 0, 0],
      alliances: [0, 0, 0, 0],
      cameraTribe: null,
      cameraRequest: 0,
      cameraPlaying: false,
      completedLevel: null,
      skyCounter: 0,
    },
    manaWorld: {
      playerTribe: 0,
      gameFlags: 0,
      loadFlags: 0,
      levelFlags: 0,
      manaFlags: 0,
      turn: 0,
      turnsPerSecond: TURNS_PER_SECOND,
      spells: Array.from({ length: 4 }, () => ({
        available: 4,
        disabled: 0,
        stocks: Array(22).fill(0),
      })),
    },
    manaTribes: Array.from({ length: 4 }, (_, id) => ({
      id,
      spellOwner: id,
      playerType: id === 0 ? 2 : 1,
      active: id < 2,
      defeatTimer: 0,
      flags2: 0,
      mana: 0,
      pending: 0,
      available: constants.START_MANA,
      totalProgress: 0,
      previousRate: 0,
      estimatedRate: 0,
      releaseDelay: 0,
      releaseRate: 0,
      spellProgress: Array(22).fill(0),
      shamanGuards: 0,
      shamanGuardChanged: 0,
    })),
    routeNotice: null,
    terrain: makeTerrain(),
    terrainVersion: 0,
    units: [],
    buildings: [],
    effects: [],
    projectiles: [],
    shrines: [],
    trees: [],
    replants: [],
    indexedSearch: createIndexedSearch(),
    fights: [],
    sounds: [],
    soundSerial: 0,
    mana: 0,
    wood: 0,
    shots: {
      blast: 4,
      convertWild: 0,
      hypnotise: 0,
      ghostArmy: 0,
      bridge: 0,
      lightning: 0,
      flatten: 0,
      erosion: 0,
      swamp: 0,
      firestorm: 0,
      earthquake: 0,
      volcano: 0,
      tornado: 0,
      shield: 0,
      invisibility: 0,
      swarm: 0,
    },
    charging: true,
    unlockedCamp: false,
    time: 0,
    turn: 0,
    attackAlert: 0,
    attackCell: 0,
    musicActivity: 0,
    pendingTime: 0,
    randomState: 1,
    cosmeticRandom: { randomState: 1 },
    effectCounter: 0,
    nextId: 1,
    footprints: createFootprints(),
    selected: [],
    orderCursor: 0,
    mode: null,
    buildingDirections: { hut: 0, tower: 0, temple: 0, camp: 0 },
    paused: false,
    speed: 1,
    message: 'Select a brave and send them to the southern stone head to worship for Land Bridge.',
    messageUntil: 18,
    status: 'playing',
    respawn: 0,
    redRespawn: 0,
    stats: { built: 0, cast: 0, bridges: 0, trained: 0, battlesWon: [0, 0, 0, 0] },
  }
  for (const o of level.objects) {
    if (o.type === 2 && o.owner !== 255) {
      addBuilding(w, o.owner === 0 ? 'blue' : 'red', o.model === 7 ? 'camp' : 'hut', o, true, {
        level: o.model === 3 ? 3 : 1,
        angle: (o.angle / 2048) * Math.PI * 2,
      })
    }
    if (o.type === 1)
      addUnit(
        w,
        o.owner === 255 ? 'wild' : o.owner === 0 ? 'blue' : 'red',
        unitKindFromModel(o.model),
        o
      )
    if (o.type === 5 && o.model <= 6)
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      const settings = o.settings!,
        reward = level.objects.find(
          r => r.index + 1 === (settings[6] | (settings[7] << 8))
        )?.settings
      const kind =
        settings[0] === 4
          ? 'vault'
          : reward?.[0] === 11 && reward[1] === 3
            ? 'lightning'
            : reward?.[0] === 11 && reward[1] === 12
              ? 'bridge'
              : null
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const worship = createWorship(settings)
      const vault =
        kind === 'vault'
          ? level.objects.find(r => r.type === 2 && r.model === 18 && distance(r, o) < 3)
          : undefined
      w.shrines.push({
        ...worship,
        nextSlot: 0,
        slotTimer: 0,
        range: settings[1],
        followers: 0,
        forced: false,
        morph: null,
        model: kind === 'vault' ? 154 : 45,
        angle: ((vault?.angle ?? 0) / 2048) * Math.PI * 2,
        id: w.nextId++,
        x: o.x,
        z: o.z,
        kind,
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridge'
              ? 'Land Bridge stone head'
              : 'Lightning stone head',
        progress: 0,
        duration: (worship.target * 4) / TURNS_PER_SECOND,
        uses: 0,
      })
    }
  }
  w.ai.pendingCommands = w.ai.pendingCommands.filter(c => {
    if (![1038, 1081, 1091, 1092, 1095, 1108, 1109, 1112, 1117, 1196, 1204].includes(c.opcode))
      return true
    campaignCommand(w, c.opcode, c.args)
    return false
  })
  w.selected = [w.units.find(u => u.team === 'blue' && isShaman(u))!.id]
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, HOME)
  return w
}
export function markerHeight(terrain: number[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= level.markers.length)
    throw new RangeError('Invalid campaign marker')
  const packed = level.markers[index],
    p = nativeCellPoint(packed)
  if (Math.abs(p.x) > 48 || Math.abs(p.z) > 48)
    return originalTerrain[((packed & 0xfe00) >> 9) * 128 + ((packed & 254) >> 1)]
  const h = height(terrain, p.x, p.z)
  return h === -0.35 ? 0 : short(Math.round(h * 45)) // Convert the browser's artificial seabed back to native zero.
}
export function removeHead(w: World, x: number, y: number) {
  const head = headAt(w, x, y)
  if (!head) return
  w.shrines.splice(w.shrines.indexOf(head), 1)
  head.active = false
  for (const u of w.units) if (u.work === head.id) release(w, u)
}
function computerSelectionWorld(w: World, tribe: number) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null,
    sources = new Map<number, LivePerson>(),
    people: SelectionUnit[] = []
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const source = unitAnimationSource(u),
      position = source ?? nativePosition(w, u)
    if (source) sources.set(u.id, source)
    people.push({
      id: u.id,
      class: 1,
      model: nativePersonModel(u),
      state: source?.state ?? (u.path.length ? 10 : 17),
      tribe,
      x: position.x & 65535,
      y: position.y & 65535,
      flags2: source?.flags2 ?? (u.inside === null ? 0 : 0x800000),
      flags3: source?.flags3 ?? 0,
      flags4: source?.flags4 ?? 0,
      assignment: source?.assignment ?? 0,
      busy:
        source?.computerAssignment ||
        source?.workFlags ||
        Number(!!u.fight || u.fighting || !!u.casting || u.work !== null || !!u.lift),
      vehicle: source?.vehicle ?? 0,
      driver: 0,
      inside: source?.building ?? u.inside ?? 0,
      immediateCommand: source?.immediateCommand ?? 0,
      commands: source?.commands ?? Array(8).fill(0),
      commandCursor: source?.commandCursor ?? 0,
    })
  }
  const units = new Map<number, SelectionUnit>(people.map(p => [p.id, p]))
  for (const b of w.buildings) {
    if (b.hp <= 0) continue
    const position = buildingPosition(buildingPose(b))
    units.set(b.id, {
      id: b.id,
      class: 2,
      model: buildingModel(b),
      state: b.progress === 1 ? 2 : 1,
      tribe: b.team === 'blue' ? 0 : 1,
      x: position.x & 65535,
      y: position.y & 65535,
      flags2: 0,
      flags3: 0,
      flags4: 0,
      assignment: 0,
      busy: 0,
      vehicle: 0,
      driver: 0,
      inside: b.admission?.inside ?? w.units.filter(u => u.hp > 0 && u.inside === b.id).length,
      immediateCommand: 0,
      commands: Array(8).fill(0),
      commandCursor: 0,
    })
  }
  const orders = new Map<number, { model: number; flags: number }>()
  w.buildingOrders.records.forEach((order, id) => orders.set(id, order))
  const world: SelectionWorld = {
    people,
    units,
    orders,
    tribes: Array.from({ length: 4 }, (_, id) => {
      const shaman = w.units.find(
          u => u.hp > 0 && isShaman(u) && u.team === (id === 0 ? 'blue' : id === 1 ? 'red' : null)
        ),
        p = shaman && nativePosition(w, shaman)
      return {
        hasBase: id === 1 && !!(w.ai.flags & 0x100),
        base: id === 1 ? w.ai.defencePosition : 0,
        shaman: p ? ((p.x >>> 8) & 254) | (p.y & 0xfe00) : 0,
        radius: id === 1 ? w.ai.defenceRadius : 0,
      }
    }),
    buildingAt: cell =>
      w.land.buildingIds[((cell & 0xfe00) >>> 9) * 128 + ((cell & 254) >>> 1)] & 1023,
  }
  return { world, sources }
}

function computerTrainingBuilding(w: World, model: number) {
  return (
    w.buildings.find(
      b =>
        b.team === 'red' &&
        b.hp > 0 &&
        b.progress === 1 &&
        b.damageState?.state !== 3 &&
        buildingModel(b) === model
    )?.id ?? 0
  )
}

function trainingBuilding(w: World, id: number): TrainingBuilding | null {
  const b = w.buildings.find(
    b =>
      b.id === id && b.team === 'red' && b.hp > 0 && b.progress === 1 && b.damageState?.state !== 3
  )
  if (!b) return null
  const admission = buildingAdmission(w, b),
    model = buildingModel(b),
    capacity = rules.buildingCapacity[model]
  return {
    id: b.id,
    owner: 1,
    state: 2,
    model,
    capacity,
    inside: admission.inside,
    occupants: admission.occupants.slice(0, capacity).map(id => {
      const u = id && w.units.find(u => u.id === id && u.hp > 0)
      return u ? { id: u.id, model: nativePersonModel(u) } : null
    }),
  }
}

// 0x4f2ac0: reservations in sibling tasks and live command-8 people prevent
// zero-count training requests from committing the same capacity again.
function committedTraining(w: World, current: number, model: number) {
  const matches = (id: number) => {
    const b = w.buildings.find(b => b.id === id && b.hp > 0)
    return !!b && buildingModel(b) === model
  }
  let count = 0
  for (let index = 0; index < w.ai.tasks.length; index++) {
    const task = w.ai.tasks[index]
    if (index === current || !(task.flags & 1) || task.type !== 6 || !matches(task.target)) continue
    if (task.phase === 0 || task.phase === 2) count += 5
    else if (task.phase === 3 || task.phase === 4) count += task.remaining
    else if (task.phase === 5 || task.phase === 6) count += task.selected
  }
  for (const u of w.units) {
    if (u.team !== 'red' || u.hp <= 0) continue
    const p = unitAnimationSource(u) ?? u.native,
      order = p && (p.state === 10 || p.state === 33) && currentPersonOrder(w.buildingOrders, p)
    if (order && !(order.flags & 1) && order.model === 8 && matches(p.target)) count++
  }
  return count | 0
}

function restoreComputerSelection(w: World, index: number) {
  for (const id of w.ai.trainingSelections[index]) {
    const u = w.units.find(u => u.id === id)
    if (u?.native?.state === 14) changeLivePersonState(w, u, 10)
  }
  w.ai.trainingSelections[index].length = 0
}

function computerAttackUnits(w: World, index: number) {
  return w.ai.tasks[index].members.flatMap(id => {
    const unit = w.units.find(u => u.id === id && u.hp > 0)
    return unit ? [unit] : []
  })
}
const computerAttackReady = (u: Unit) =>
  !u.flight && !u.fight && !u.fighting && !u.casting && !u.lift

function computerAttackHasOrder(w: World, index: number, model: number, target: number) {
  const units = computerAttackUnits(w, index)
  return (
    units.length > 0 &&
    units.every(u => {
      const p = u.native ?? u.fight?.motion
      const order = p && currentPersonOrder(w.buildingOrders, p)
      return order?.model === model && order.a === target
    })
  )
}

function computerAttackTargetsRemain(w: World, tribe: number, target: number) {
  const team = tribe === 1 ? 'blue' : tribe === 0 ? 'red' : null
  if (!team) return false
  const within = (object: Point) => {
    const p = nativePosition(w, object),
      cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    return cellDistanceSquared(cell, target) <= 100
  }
  return (
    w.units.some(
      u =>
        u.team === team &&
        u.hp > 0 &&
        u.inside === null &&
        u.native?.state !== 23 &&
        !u.flight &&
        within(u)
    ) ||
    w.buildings.some(b => b.team === team && b.hp > 0 && b.damageState?.state !== 3 && within(b))
  )
}

function produceMissionWarriorTraining(w: World) {
  if (w.ai.tasks.every(task => task.flags & 1)) return
  const model = 3,
    trainingModel = 7,
    trained = campaignPersonCount(w, 1, model),
    target = computerTrainingBuilding(w, trainingModel)
  if (
    !(w.ai.states & (1 << 6)) ||
    !target ||
    Math.trunc((w.ai.attributes[7] * campaignPersonCount(w, 1)) / 100) <= trained
  )
    return
  random(w) // Native producer chooses among eligible classes; mission one has only warrior training.
  const selection = computerSelectionWorld(w, 1),
    available = availableTrainingPeople(selection.world)
  if (available >= rules.buildingCapacity[trainingModel]) return
  requestTraining(w.ai, 0, model, available, candidate =>
    candidate === trainingModel ? target : 0
  )
}

export function computerMarkerOrderCount(
  w: World,
  tribe: number,
  marker: number,
  secondary: number
) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null,
    primary = level.markers[marker],
    alternate = secondary === -1 ? -1 : level.markers[secondary],
    matches = (a: number, b: number) => b !== -1 && (a & 0xfefe) === (b & 0xfefe)
  if (primary === undefined || (secondary !== -1 && alternate === undefined))
    throw new RangeError('Invalid computer marker route')
  let count = 0
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const p = unitAnimationSource(u) ?? u.native
    if (!p || ![10, 33].includes(p.state)) continue
    const active = currentPersonOrder(w.buildingOrders, p)
    if (!active || active.flags & 1 || ![11, 25].includes(active.model)) continue
    const id = p.commands[p.commandCursor],
      queued = id ? w.buildingOrders.records[id] : undefined,
      flags = queued ? (rules.personCommands[queued.model]?.flags ?? 0) : 0
    if (!queued) continue
    const position = flags & 0x800 ? queued.a : ((queued.a >>> 8) & 254) | (queued.b & 0xfe00)
    if (
      flags & 0x800
        ? matches(position, primary)
        : flags & 1 && (matches(position, primary) || matches(position, alternate))
    )
      count++
  }
  return count
}

function stepComputerTasks(w: World, tribe: number) {
  const phase = computerPhase(w.turn, tribe)
  if (phase === 'produce') {
    produceMissionWarriorTraining(w)
    return
  }
  if (phase !== 'dispatch') return
  dispatchComputerTask(w.ai, index => {
    const task = w.ai.tasks[index]
    if (task.type === 24) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const actions = stepMarkerTask(w.ai, index, {
        existing: (marker, secondary) => computerMarkerOrderCount(w, tribe, marker, secondary),
        select: (model, count, marker) => {
          const current = (selection ??= computerSelectionWorld(w, tribe)),
            ids = selectComputerPeople(
              current.world,
              model,
              model,
              -1,
              1,
              level.markers[marker],
              64,
              count
            )
          for (const id of ids) {
            const source = current.sources.get(id)
            if (source) source.flags3 = current.world.units.get(id)!.flags3
          }
          return ids
        },
      })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported computer marker selection')
          u.native ??= createLivePerson(w, u)
          u.native.computerAssignment = 99
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else if (action.kind === 'order' || action.kind === 'guard') {
          const marker = level.markers[action.marker],
            cell = ((marker & 0xfe00) >>> 9) * 128 + ((marker & 254) >>> 1),
            target = w.land.buildingIds[cell] & 1023,
            order = emptyPersonOrder(),
            units = action.ids.flatMap(id => {
              const u = w.units.find(u => u.id === id && u.hp > 0)
              return u ? [u] : []
            })
          if (action.kind === 'guard') {
            if (units.length) appendLiveGuardOrders(w, units, marker)
          } else {
            writePersonOrder(order, target ? 8 : 3, target, marker, 0)
            if (units.length) appendLiveOrders(w, units, order, true)
          }
        } else {
          for (const id of action.ids) {
            const u = w.units.find(u => u.id === id)
            if (u?.native?.state === 14) changeLivePersonState(w, u, 10)
          }
        }
      }
      return
    }
    if (task.type === 28) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const shaman = w.units.find(
          u => u.hp > 0 && isShaman(u) && u.team === (tribe === 0 ? 'blue' : 'red')
        ),
        point = shaman && nativePosition(w, shaman),
        destination = point ? ((point.x >>> 8) & 254) | (point.y & 0xfe00) : 0,
        actions = stepShamanGuardTask(w.ai, index, {
          existing: () => {
            let count = 0
            for (const u of w.units) {
              const p = unitAnimationSource(u) ?? u.native,
                order = p && currentPersonOrder(w.buildingOrders, p),
                model = nativePersonModel(u)
              if (
                u.hp > 0 &&
                p &&
                [10, 33].includes(p.state) &&
                order?.model === 30 &&
                model >= 2 &&
                model <= 6
              )
                count++
            }
            return count
          },
          select: (model, count) => {
            if (!shaman) return []
            const current = (selection ??= computerSelectionWorld(w, tribe)),
              ids = selectComputerPeople(current.world, model, model, -1, 1, destination, 0, count)
            for (const id of ids) {
              const source = current.sources.get(id)
              if (source) source.flags3 = current.world.units.get(id)!.flags3
            }
            return ids
          },
        })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported shaman guard selection')
          u.native ??= createLivePerson(w, u)
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else if (action.kind === 'order') {
          const units = action.ids.flatMap(id => {
              const u = w.units.find(u => u.id === id && u.hp > 0)
              return u ? [u] : []
            }),
            order = emptyPersonOrder()
          writePersonOrder(order, 30, shaman?.id ?? 0, 0, 0)
          const issued = shaman && units.length ? appendLiveOrders(w, units, order, true) : null
          if (!issued?.accepted || issued.count !== units.length)
            for (const u of units) if (u.native?.state === 14) changeLivePersonState(w, u, 10)
        } else {
          for (const id of action.ids) {
            const p = w.units.find(u => u.id === id)?.native
            if (p) deselectPerson(p)
          }
        }
      }
      return
    }
    if (task.type === 20) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const shaman = w.units.find(u => u.team === 'red' && isShaman(u) && u.hp > 0),
        shamanPosition = shaman && nativePosition(w, shaman),
        staging =
          w.ai.flags & 0x100
            ? w.ai.defencePosition
            : shamanPosition
              ? ((shamanPosition.x >>> 8) & 254) | (shamanPosition.y & 0xfe00)
              : 0,
        actions = stepAttackTask(w.ai, index, {
          staging,
          ready: () => computerAttackUnits(w, index).every(computerAttackReady),
          activeMembers: () => computerAttackUnits(w, index).length,
          targetsRemain: target =>
            computerAttackHasOrder(w, index, 19, target) &&
            computerAttackTargetsRemain(w, tribe, target),
          random: () => random(w),
          entity: id => campaignAttackEntity(w, id),
          tracking: id => computerAttackHasOrder(w, index, 28, id),
          reacquire: () => campaignAttackTarget(w, tribe === 1 ? 0 : 1),
          select: (model, count, destination) => {
            const current = (selection ??= computerSelectionWorld(w, tribe)),
              ids = selectComputerPeople(current.world, model, model, -1, 1, destination, 7, count)
            for (const id of ids) {
              const source = current.sources.get(id)
              if (source) source.flags3 = current.world.units.get(id)!.flags3
            }
            return ids
          },
          settled: () => {
            const units = computerAttackUnits(w, index)
            return units.length === 0
              ? null
              : units.every(
                  u =>
                    computerAttackReady(u) &&
                    (u.native?.state !== 10 ||
                      currentPersonOrder(w.buildingOrders, u.native)?.model !== 3)
                )
          },
          memberWithin: (target, radius) => {
            const unit = computerAttackUnits(w, index).find(u => {
              if (!computerAttackReady(u)) return false
              const p = nativePosition(w, u),
                cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
              return cellDistanceSquared(cell, target) <= radius * radius
            })
            if (!unit) return null
            const p = nativePosition(w, unit)
            return ((p.x >>> 8) & 254) | (p.y & 0xfe00)
          },
        })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported computer attack selection')
          u.native ??= createLivePerson(w, u)
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else {
          const units = computerAttackUnits(w, index),
            order = emptyPersonOrder()
          if (action.kind === 'attackPerson') {
            writePersonOrder(order, 28, action.target, 0, 0)
            for (const u of units)
              if (appendLiveOrders(w, [u], order, true).count === 1) u.target = action.target
            continue
          }
          if (action.kind === 'attack')
            Object.assign(order, { model: 19, a: action.target, b: 0x0808 })
          else writePersonOrder(order, 3, 0, action.target, 0)
          const issued = units.length ? appendLiveOrders(w, units, order, action.replace) : null
          if (action.kind === 'move') for (const u of units) u.target = null
          if (
            action.kind === 'move' &&
            task.fallback !== 23 &&
            (!issued?.accepted || issued.count !== units.length)
          ) {
            for (const u of units) if (u.native?.state === 14) changeLivePersonState(w, u, 10)
            task.flags &= ~3
            task.members.length = 0
          }
        }
      }
      return
    }
    if (task.type !== 6) throw new Error(`Unbound computer task ${task.type}`)
    const target = trainingBuilding(w, task.target)
    let selection: ReturnType<typeof computerSelectionWorld> | undefined
    const actions = stepTrainingTask(w.ai, index, target, {
      tribe,
      preference: w.ai.attributes[7],
      population: campaignPersonCount(w, tribe),
      trained: campaignPersonCount(w, tribe, 3),
      committed: target ? committedTraining(w, index, target.model) : 0,
      maximum: w.ai.attributes[33],
      select: (building, count) => {
        const b = w.buildings.find(b => b.id === building.id)!,
          p = buildingPosition(buildingPose(b)),
          destination = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
          current = (selection ??= computerSelectionWorld(w, tribe)),
          ids = selectComputerPeople(current.world, 2, 2, building.id, 1, destination, 6, count)
        for (const id of ids) {
          const source = current.sources.get(id)
          if (source) source.flags3 = current.world.units.get(id)!.flags3
        }
        return ids
      },
    })
    for (const action of actions) {
      if (action.kind === 'restore') {
        restoreComputerSelection(w, index)
      } else if (action.kind === 'select') {
        const u = w.units.find(u => u.id === action.id)
        if (!u || u.inside !== null || u.entry || u.work !== null)
          throw new Error('Unsupported computer training selection')
        u.native ??= createLivePerson(w, u)
        registerLivePerson(w, u.native)
        changeLivePersonState(w, u, 14)
        w.ai.trainingSelections[index].push(u.id)
      } else if (action.kind === 'train') {
        const units = w.ai.trainingSelections[index].flatMap(id => {
          const u = w.units.find(u => u.id === id && u.hp > 0)
          return u ? [u] : []
        })
        const order = emptyPersonOrder()
        writePersonOrder(order, 8, action.id, 0, 0)
        const issued = units.length ? appendLiveOrders(w, units, order, true) : null
        if (!issued?.accepted || issued.count !== units.length) task.flags &= ~3
        w.ai.trainingSelections[index].length = 0
      } else {
        const u = w.units.find(u => u.id === action.id),
          p = u && leaveLiveBuilding(w, u)
        if (u && p) {
          u.entry = undefined
          u.native = p
          u.work = null
          changeLivePersonState(w, u, 10)
        }
      }
    }
  })
}

// Reviewed DO query handlers. Unknown commands/unsupported world state fail explicitly.
export function campaignCommand(
  w: World,
  opcode: number,
  args: number[],
  script: PopScript = originalScript
) {
  const arity = (
    {
      1028: 1,
      1038: 3,
      1059: 13,
      1068: 4,
      1081: 1,
      1091: 7,
      1092: 4,
      1095: 2,
      1102: 1,
      1108: 6,
      1109: 0,
      1112: 0,
      1117: 0,
      1196: 1,
      1204: 1,
      1076: 3,
      1077: 3,
      1085: 2,
      1131: 3,
      1136: 0,
      1151: 1,
      1171: 2,
      1172: 1,
      1173: 2,
      1176: 1,
      1113: 0,
      1180: 0,
      1187: 0,
      1205: 0,
      1206: 0,
      1207: 0,
      1208: 1,
      1209: 4,
      1210: 3,
      1211: 3,
      1212: 4,
      1213: 5,
      1214: 4,
      1215: 2,
    } as Record<number, number>
  )[opcode]
  if (arity === undefined) throw new Error(`Unbound campaign command ${opcode}`)
  if (args.length !== arity) throw new Error(`Invalid campaign command arguments ${opcode}`)
  const read = (index: number) => scriptValue(script, w.ai, index, id => campaignInternal(w, id))
  const writeVariable = (token: number, value: number) => {
    const index = script.fields[token]?.[1]
    if (!Number.isInteger(index) || index < 0 || index >= 64)
      throw new RangeError('Invalid campaign query destination')
    w.ai.variables[index] = value | 0
  }

  if (opcode === 1028) {
    if (args[0] === 1022) w.ai.states = (w.ai.states | 1) >>> 0
    else if (args[0] === 1023) w.ai.states = (w.ai.states & ~1) >>> 0
    return
  }
  if (opcode === 1172) {
    const mode = (args[0] << 16) >> 16
    if (mode === 1022) w.ai.flags = (w.ai.flags | 0x40000) >>> 0
    else if (mode === 1023) w.ai.flags = (w.ai.flags & ~0x40000) >>> 0
    return
  }
  if (opcode === 1173) {
    const index = read(args[0])
    if (!Number.isInteger(index) || index < 0 || index >= w.ai.attributes.length)
      throw new RangeError('Invalid computer attribute')
    w.ai.attributes[index] = read(args[1]) & 255
    return
  }

  if (opcode === 1081) {
    const field = script.fields[args[0]]
    if (!field) throw new RangeError('Invalid script field')
    w.ai.markerValue = (field[1] << 16) >> 16
    return
  }
  if (opcode === 1091) {
    const [index, marker, secondary, ...quotas] = args.map(read),
      entry = w.ai.markerEntries[index]
    if (!entry) throw new RangeError('Invalid computer marker entry')
    entry.marker = (marker << 24) >> 24
    entry.secondary = (secondary << 24) >> 24
    entry.quotas = quotas.map(n => Math.max(0, Math.min(100, n)))
    return
  }
  if (opcode === 1117) {
    w.ai.flags = (w.ai.flags | 0x800) >>> 0
    return
  }
  if (opcode === 1092) {
    requestMarkerTask(w.ai, args.map(read), !!(w.ai.flags & 0x800))
    w.ai.flags = (w.ai.flags & ~0x800) >>> 0
    return
  }

  if (opcode === 1059) {
    const field = (index: number, type: number, value: number) => {
        const field = script.fields[args[index]]
        return field?.[0] === type && field[1] === value
      },
      none = (index: number) => field(index, 2, 1224),
      requested = read(args[1]),
      marker = read(args[3]),
      damage = read(args[4]),
      options = [9, 10, 11, 12].map(index => read(args[index])),
      targetMode = args[2],
      validTarget =
        (targetMode === 1070 && requested === 3 && marker === 3) ||
        (targetMode === 1071 && field(1, 2, 1) && field(3, 2, 1223) && marker === 0)
    if (
      args[0] !== 1118 ||
      args[8] !== 1078 ||
      ![5, 6, 7].every(none) ||
      !validTarget ||
      damage !== 999 ||
      options.some((value, index) => value !== [0, -1, -1, 0][index])
    )
      throw new Error('Unsupported computer attack')
    const target =
      targetMode === 1070 ? { id: 0, target: level.markers[marker] } : campaignAttackTarget(w, 0)
    if (target === null) return
    requestAttack(
      w.ai,
      target.target,
      marker,
      requested,
      damage,
      w.ai.attributes.slice(11, 17),
      w.ai.attributes[28],
      !!(w.ai.states & (1 << 20)),
      1,
      target.id
    )
    return
  }

  if (opcode === 1068) {
    const tribe =
      args[0] === 1058 ? -1 : args[0] >= 1118 && args[0] <= 1121 ? args[0] - 1118 : read(args[0])
    writeVariable(args[3], campaignPeopleInMarker(w, tribe, read(args[1]), read(args[2])))
    return
  }

  if (opcode === 1095) {
    const [count, model] = args.map(read)
    if (count <= 0 || model !== 3)
      throw new Error(`Unsupported computer training ${count}:${model}`)
    const selection = computerSelectionWorld(w, 1)
    requestTraining(w.ai, count, model, availableTrainingPeople(selection.world), targetModel =>
      computerTrainingBuilding(w, targetModel)
    )
    return
  }

  if (opcode === 1102) {
    const shaman = w.units.some(u => u.team === 'red' && isShaman(u) && u.hp > 0)
    requestShamanGuard(
      w.ai,
      read(args[0]),
      [0, 29, 6, 2, 30].map(index => w.ai.attributes[index]),
      shaman
    )
    return
  }

  if (opcode === 1038) {
    // 0x492c30 reads both coordinates even for OFF; disabled orders retain the old target.
    const x = read(args[0]) & 255,
      y = read(args[1]) & 255
    if (args[2] === 1022) w.ai.states = (w.ai.states | 0x400) >>> 0
    else if (args[2] === 1023) w.ai.states = (w.ai.states & ~0x400) >>> 0
    if (w.ai.states & 0x400) {
      w.ai.flags = (w.ai.flags | 0x100) >>> 0
      w.ai.defencePosition = x | (y << 8)
    } else w.ai.flags = (w.ai.flags & ~0x100) >>> 0
    return
  }
  if (opcode === 1196) {
    w.ai.defenceRadius = read(args[0]) & 255
    return
  }
  if (opcode === 1108) {
    // 0x4902e0: preserve the native dword/word/byte widths of the five written fields.
    const [index, model, mana, range, people, mode] = args.map(read)
    if (!Number.isInteger(index) || index < 0 || index >= w.ai.spellEntries.length)
      throw new RangeError('Invalid computer spell entry')
    w.ai.spellEntries[index] = {
      model: model & 255,
      mana: mana | 0,
      range: range & 65535,
      people: people & 255,
      mode: mode & 255,
    }
    return
  }

  // 0x4f2e30 and 0x48cc60 case 0xb0 preserve every unrelated mode bit.
  if (opcode === 1109) {
    w.ai.flags = (w.ai.flags | 0x400) >>> 0
    return
  }
  if (opcode === 1204) {
    if (args[0] === 1022) w.manaWorld.gameFlags = (w.manaWorld.gameFlags & ~0x40) >>> 0
    else if (args[0] === 1023) w.manaWorld.gameFlags = (w.manaWorld.gameFlags | 0x40) >>> 0
    return
  }

  if (opcode === 1112) {
    if (!(w.manaWorld.levelFlags & 0x1000000)) {
      w.manaWorld.levelFlags = (w.manaWorld.levelFlags | 0x20000000) >>> 0
      w.inputMask |= 128
    }
    return
  }
  if (opcode === 1113) {
    if (!(w.manaWorld.levelFlags & 0x1000000)) {
      w.manaWorld.levelFlags = (w.manaWorld.levelFlags & ~0x20000000) >>> 0
      w.inputMask &= ~128
    }
    return
  }
  if (opcode === 1180 || opcode === 1187) {
    const message = w.messages.slots[w.lastMessage]
    if (message) message.flags |= opcode === 1180 ? 0x200 : 0x20000
    return
  }
  if (opcode >= 1205 && opcode <= 1215) {
    flybyCommand(w.flyby, opcode, opcode === 1208 ? [args[0] === 1022 ? 1 : 0] : args.map(read))
    if (opcode === 1206) w.inputMask |= 64
    if (opcode === 1207) w.inputMask &= ~64
    return
  }

  if (opcode === 1136) {
    w.ai.includeIncompleteBuildings = true
    return
  }
  if (opcode === 1151) {
    forceHead(w, read(args[0]))
    return
  }

  if (opcode === 1176) {
    w.lastMessage = addMessage(w.messages, messageStringId(read(args[0])), () => random(w))
    sound(w, 0xe3, HOME)
    return
  }

  if (opcode === 1171) {
    removeHead(w, read(args[0]), read(args[1]))
    return
  }
  let value: number
  if (opcode === 1085) {
    value = markerHeight(w.terrain, read(args[0]))
  } else if (opcode === 1131) {
    value = ((headAt(w, read(args[0]), read(args[1]))?.remaining ?? 0) << 24) >> 24
  } else {
    const tribe = args[0] >= 1118 && args[0] <= 1121 ? args[0] - 1118 : read(args[0])
    const model = read(args[1])
    if (
      !Number.isInteger(tribe) ||
      tribe < 0 ||
      tribe > 3 ||
      !Number.isInteger(model) ||
      model < 0 ||
      model >= 22
    ) {
      throw new RangeError('Invalid campaign spell query')
    }
    if (opcode === 1076) {
      value = w.spellCasts[tribe][model] & 255
    } else {
      const spell = SPELLS.find(s => s.model === model)?.id
      if (tribe !== 0 || !spell) throw new Error(`Unbound one-off spell stock ${tribe}:${model}`)
      value = w.shots[spell] & 15 // 0x4c2b40 excludes the separate upper-nibble gift counter.
    }
  }
  // Native destinations use the field's value as a user-variable index, regardless of type.
  writeVariable(args.at(-1)!, value)
}

const boundCampaignScript = {
  ...originalScript,
  codes: [12, 1003, ...originalScript.codes.slice(382, 1524), 1004, 1019],
}
function campaignRules(w: World) {
  // ponytail: execute these verified original blocks until the remaining mission commands are bound.
  runScript(boundCampaignScript, w.ai, {
    turn: w.turn,
    tribe: 1,
    readInternal: id => campaignInternal(w, id),
    command: (opcode, args) => campaignCommand(w, opcode, args),
  })
}
export function requestTutorial(w: World, flags: number, message: number) {
  // 0x499f40 mode 9: a single transient tooltip, not tutorial history.
  if (flags === 0x200000 && message === 603)
    w.routeNotice = { flags, message, serial: (w.routeNotice?.serial ?? 0) + 1 }
}
export function tell(w: World, message: string) {
  w.message = message
  w.messageUntil = w.time + 9
}
export function createGift(w: World, reward: Shrine['kind'], p: Point) {
  const gift = effect(w, 'gift', p) as Gift
  Object.assign(gift, {
    reward,
    remaining: 82,
    phase: 6,
    frame: { vault: 1077, lightning: 1059, bridge: 1068 }[reward],
    height: (terrainPointHeight(w.land, nativePosition(w, p)) + 800) / 45,
    duration: Infinity,
  })
  w.gifts.push(gift)
  return gift
}
export { buildingModel } from './building-shapes.ts'
export function buildingStage(b: Building) {
  // The browser stores native plan work as a fraction of the model
  // capacity; complete plan allocation and order dispatch remain separate.
  const life = rules.buildingLife[buildingModel(b)]
  return b.damageState?.stage ?? buildingWorkStage(Math.trunc(b.progress * life), life)
}

export function buildingPlanPose(w: World, kind: BuildingKind, p: Point) {
  return {
    object: rules.buildingObjects[buildingModel({ kind, level: 1 })],
    angle: w.buildingDirections[kind] * 512,
    anchorX: Math.round((p.x + 8) * 256) & 0xfe00,
    anchorY: Math.round((-p.z - 8) * 256) & 0xfe00,
  }
}

// 0x4aab80 command 0x7b: each building icon retains its quarter-turn direction.
export function rotateBuildingPlan(w: World) {
  if (
    !w.mode ||
    !Object.hasOwn(w.buildingDirections, w.mode) ||
    w.inputMask ||
    w.status !== 'playing'
  )
    return false
  const kind = w.mode as BuildingKind
  w.buildingDirections[kind] = (w.buildingDirections[kind] + 1) & 3
  return true
}
function cellShade(w: World, i: number) {
  const b = w.buildings.find(b => b.id === (w.land.buildingIds[i] & 1023))
  const scenery = w.trees
    .filter(
      t =>
        t.logs > 0 &&
        nativeCellIndex(
          ((nativePosition(w, t).x >>> 8) & 254) | (nativePosition(w, t).y & 0xfe00)
        ) === i
    )
    .map(t => ({ class: 5, model: t.model }))
  return nativeCellShade(
    w.land.flags[i],
    b
      ? {
          class: 2,
          model: buildingModel(b),
          state: b.progress === 1 ? 2 : 1,
          flags2: b.hp > 0 ? 0 : 1,
          stage: buildingStage(b),
        }
      : undefined,
    scenery
  )
}
// Live object adapter: native masks/shade, browser-owned building and tree lifetimes.
// Full plan/scenery class registration and native texture scheduling remain open.
export function syncLandscapeObjects(w: World) {
  const current = new Map(
    w.buildings
      .filter(b => b.hp > 0)
      .map(b => [
        b.id,
        { ...buildingPose(b), id: b.id, tribe: b.team === 'blue' ? 0 : 1, plan: !!b.preparation },
      ])
  )
  const shade = (i: number) => cellShade(w, i)
  const update = (b: RegisteredBuilding & { plan: boolean }, mode: number) => {
    if (!b.plan) return registerBuildingFootprint(w.land, b, mode, shade, () => {})
    // 0x4b9190 modes 2/3/4: reserve cells without marking an actual building.
    for (const i of buildingFootprintCells(b)) {
      if (mode === 1) {
        w.land.flags[i] |= 0x410
        w.land.buildingIds[i] = (w.land.buildingIds[i] & 0xfc00) | (b.id & 1023)
        w.land.owners[i] = (w.land.owners[i] & 0xf0) | (b.tribe + 1)
      } else {
        w.land.flags[i] = (w.land.flags[i] & ~0x4400) | 16
        w.land.buildingIds[i] &= 0xfc00
        w.land.owners[i] &= 0xf0
      }
    }
  }
  for (const [id, old] of w.buildingFootprints) {
    const next = current.get(id)
    if (
      !next ||
      Object.keys(old).some(
        k => old[k as keyof RegisteredBuilding] !== next[k as keyof RegisteredBuilding]
      )
    ) {
      update(old, 0)
      update(old, 4)
      w.buildingFootprints.delete(id)
    }
  }
  for (const [id, b] of current)
    if (!w.buildingFootprints.has(id)) {
      update(b, 1)
      w.buildingFootprints.set(id, b)
    }
  const scenery = new Map<number, SceneryShapePose>()
  for (const tree of w.trees) {
    if (tree.logs <= 0 || !(rules.sceneryFlags[tree.model] & 1)) continue
    const p = nativePosition(w, tree)
    scenery.set(tree.id, {
      object: rules.sceneryObjects[tree.model],
      anchorX: p.x & 0xfe00,
      anchorY: p.y & 0xfe00,
    })
  }
  const refresh = (p: SceneryShapePose) => refreshSceneryShadow(w.land, p, shade, () => {})
  for (const [id, old] of w.sceneryShadows) {
    const next = scenery.get(id)
    if (
      !next ||
      old.object !== next.object ||
      old.anchorX !== next.anchorX ||
      old.anchorY !== next.anchorY
    ) {
      refresh(old)
      w.sceneryShadows.delete(id)
    }
  }
  for (const [id, p] of scenery)
    if (!w.sceneryShadows.has(id)) {
      refresh(p)
      w.sceneryShadows.set(id, p)
    }
}
function buildingDoor(b: Building) {
  const point = buildingOutsidePoint(buildingPose(b))
  return browserPosition(point)
}
export function entrance(w: World, b: Point, radius = 4) {
  if ('level' in b && 'team' in b && 'kind' in b && 'angle' in b) {
    return buildingDoor(b as Building)
  }
  const angle = 'angle' in b ? Number(b.angle) : 0
  // Native model doors face -Z. Reflect both the model and the native map coordinates.
  if ('angle' in b) return { x: b.x - Math.sin(angle) * radius, z: b.z + Math.cos(angle) * radius }
  return (
    Array.from({ length: 16 }, (_, i) => ({
      x: b.x + Math.sin((i * Math.PI) / 8) * radius,
      z: b.z + Math.cos((i * Math.PI) / 8) * radius,
    })).find(p => walkable(w.terrain, p)) ?? b
  )
}
// Native slots retain registration order. Browser work orders supply eligibility
// until the complete native person/plan command ownership is connected.


function completeBuildingConstruction(w: World, b: Building) {
  if (!b.upgrading && !b.damageState) w.stats.built++
  b.upgrading = false
  if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  tell(w, `${BUILDINGS.find(s => s.id === b.kind)!.name} completed.`)
}

// Native plan decisions run before their registered workers. Resource/object
// ownership and ordinary movement still use the live world adapters.
function prepareBuildingSite(w: World, b: Building, workers: Unit[]) {
  const plan = b.preparation!,
    pose = buildingPose(b),
    cells = new Set(buildingFootprintCells(pose)),
    cell = (p: Point) => {
      const n = nativePosition(w, p)
      return ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
    },
    onSite = (p: Point) => cells.has(cell(p)),
    crew = workers.map(
      u => (u.builder ??= { task: BuilderTask.Approach, busy: 0, phase: 0, restart: true })
    )
  plan.counter = b.counter
  const action = stepUnbuiltPlan(
    plan,
    crew,
    () => checkBuildingSite(w, pose, plan.model, b.team, b.id).valid,
    () => {
      const people = w.units.filter(u => u.hp > 0 && u.inside === null && onSite(u)),
        scenery = w.trees.filter(t => t.logs > 0 && onSite(t))
      return {
        timber: plan.work < rules.buildingPreparationWork[plan.model],
        grade: buildingGradeVertices(pose).some(
          v => Math.abs(w.land.heights[v.index] - plan.height) > 1
        ),
        scenery: scenery.length,
        friendly: people.filter(u => u.team === b.team && u.work !== b.id).length,
        enemies: people.filter(u => u.team !== b.team).length,
        vehicles: 0,
        crew: people.filter(u => u.team === b.team && u.work === b.id).length,
        wooden: scenery.some(t => !!(rules.sceneryResourceFlags[t.model] & 16)),
      }
    }
  )
  if (action === 'remove') {
    workers.forEach(u => {
      if (!finishQueuedConstruction(w, u)) release(w, u)
    })
    invalidateBuildingTimberSearch(w, b)
    w.buildings = w.buildings.filter(other => other !== b)
    return
  }
  if (action === 'allocate') {
    b.object = chooseBuildingObject(plan.model, b.team === 'blue' ? 0 : 1, w)
    b.progress = plan.work / rules.buildingLife[plan.model]
    b.preparation = undefined
    Object.assign(b, browserPosition(buildingPosition(buildingPose(b))))
    // Workers already graded the site. Allocation performs only the original
    // model foundation pass, without the legacy immediate-plan preparation.
    groundBuilding(w, b, false)
    for (const u of workers) if (u.builder?.person) u.builder.person.assignment |= 16
    return
  }
  for (const u of workers) {
    const task = u.builder!
    if (task.task === 5 || task.task === 6) {
      // 0x495520 returns task 2 immediately for these two preparation requests.
      task.task = BuilderTask.Work
      task.restart = true
    }
  }
}

function processBuilderWork(w: World, u: Unit, b: Building) {
  const task = u.builder!,
    p = (task.person ??= u.native ?? createLivePerson(w, u)),
    pose = buildingPose(b)
  if (u.native === p) {
    if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
    w.objectCells.objects.delete(p.id)
    u.native = null
  }
  Object.assign(p, nativePosition(w, u))
  p.x &= 65535
  p.y &= 65535
  p.counter = w.turn & 255
  p.state = 10
  p.cargo = Math.round(u.cargo * 100)
  const leaving = task.task === BuilderTask.Leave
  if (leaving || task.task === BuilderTask.ClearScenery || task.task === BuilderTask.ClearPeople)
    turnPerson(p)
  // 0x495520 clears movement mode when a construction subtask restarts.
  if (task.restart) p.flags4 = (p.flags4 & 0xfffefff8) >>> 0
  if (leaving && task.restart) {
    u.tree = null
    u.harvest = undefined
    u.delivery = undefined
  }
  const cell = (p.y >> 9) * 128 + (p.x >> 9)
  const destination = (to: { x: number; y: number }, direct = false) => {
    clearLivePath(w, u)
    setDirectPersonDestination(w.motionRoutes, p, to)
    if (direct) u.path = [browserPosition(to)]
    else route(w, u, browserPosition(to), true)
  }
  const animation = (_: unknown, object: number) => {
    setLivePersonAnimation(w, p, object)
    if (!p.speed) clearLivePath(w, u)
  }
  const releaseMotion = () => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, u)
  }
  const allocateLog = () => {
    w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
    return true // ponytail: unbounded scenery until native object-pool allocation is connected.
  }
  let finished = 0
  if (task.task === BuilderTask.Fetch) {
    const searchWorld = liveTimberWorld(w),
      site = {
        id: b.id,
        class: 9,
        model: buildingModel(b),
        building: b.preparation ? 0 : b.id,
        flags3: b.woodUnavailable ? 0x1000 : 0,
        searchIndex: b.timberSearch ?? -1,
        angle: pose.angle,
        inside: buildingInsidePoint(pose),
        outside: buildingOutsidePoint(pose),
        occupied: w.land.buildingIds[cell],
      }
    const timber = (id: number) => {
      const tree = w.trees.find(tree => tree.id === id)
      return tree
        ? {
            ...nativePosition(w, tree),
            id: tree.id,
            class: tree.logs > 0 ? 5 : 0,
            model: tree.model,
            flags2: 0,
          }
        : { x: p.goalX, y: p.goalY, id, class: 0, model: 0, flags2: 1 }
    }
    finished = stepBuildingFetch(w, p, task, site, {
      animation,
      destination,
      directDestination: to => destination(to, true),
      releaseMotion,
      sound: cue => sound(w, cue, u),
      target: timber,
      refreshSearch: (point, angle) => {
        refreshTimberSearch(w.timberSearches, site, timberCell(point), angle, p)
        b.timberSearch = site.searchIndex
      },
      findWood: index => findTimber(w.timberSearches, searchWorld, index, p.id, true, false).target,
      looseWood: to => {
        const targetCell = ((to.y & 65535) >> 9) * 128 + ((to.x & 65535) >> 9)
        return (
          w.trees.find(tree => {
            const point = nativePosition(w, tree)
            return (
              tree.logs > 0 &&
              ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9) === targetCell
            )
          })?.id ?? 0
        )
      },
      reserve: id => {
        u.tree = id
      },
      transfer: (from, _to, requested) => {
        if (from !== p.id) {
          const tree = w.trees.find(tree => tree.id === from)
          if (!tree) return
          const amount = timberTransfer(
            Math.round(tree.logs * 100),
            short(p.cargo),
            short(rules.personWood[p.model]),
            requested
          )
          tree.logs -= amount / 100
          p.cargo = (p.cargo + amount) & 65535
          if (amount && tree.logs < 1) depleteTree(w, tree, w.manaTribes[p.tribe].playerType === 1)
          return
        }
        const capacity = b.preparation
            ? rules.buildingPreparationWork[site.model]
            : rules.buildingLife[site.model],
          work =
            b.preparation?.work ??
            b.damageState?.plan.remaining ??
            Math.round(b.progress * capacity),
          amount = timberTransfer(short(p.cargo), work, capacity, requested),
          wasIncomplete = b.progress < 1
        p.cargo = (p.cargo - amount) & 65535
        if (b.preparation) {
          b.preparation.work = work + amount
          b.logs = (work + amount) / 100
        } else if (b.damageState) {
          const state = b.damageState
          changeBuildingWork(state.plan, amount, state, null, {
            move: () => {},
            release: () => {},
            init: () => {},
          })
          b.progress = Math.max(0, state.plan.remaining) / capacity
          b.logs = Math.max(0, state.plan.remaining) / 100
          b.hp = buildingHp(b.kind) * b.progress
        } else {
          b.progress = (work + amount) / capacity
          b.logs = (work + amount) / 100
        }
        if (wasIncomplete && b.progress === 1) completeBuildingConstruction(w, b)
      },
    })
    b.woodUnavailable = !!(site.flags3 & 0x1000)
    if (finished === 2) u.tree = null
  } else if (task.task === BuilderTask.ClearScenery) {
    const scenery = w.trees.map(tree => ({
      ...nativePosition(w, tree),
      id: tree.id,
      class: tree.logs > 0 ? 5 : 0,
      model: tree.model,
      flags2: 0,
    }))
    const target = (id: number) => scenery.find(tree => tree.id === id)
    const cells = buildingFootprintCells(pose)
    finished = stepBuildingScenery(
      w,
      p,
      task,
      {
        outside: buildingOutsidePoint(pose),
        target,
        scenery: () =>
          cells.flatMap(i =>
            scenery.filter(
              object =>
                object.class && ((object.y & 65535) >> 9) * 128 + ((object.x & 65535) >> 9) === i
            )
          ),
      },
      {
        animation,
        destination,
        releaseMotion,
        sound: cue => sound(w, cue, u),
        transfer: (id, capacity) => {
          const tree = w.trees.find(t => t.id === id)!
          const amount = timberTransfer(
            Math.round(tree.logs * 100),
            short(p.cargo),
            capacity,
            capacity
          )
          tree.logs -= amount / 100
          p.cargo = (p.cargo + amount) & 65535
          if (amount && tree.logs < 1) depleteTree(w, tree, w.manaTribes[p.tribe].playerType === 1)
        },
        remove: id => {
          const tree = w.trees.find(t => t.id === id)!
          // State 5 starts a 76-turn fire; timber depletion can remove it sooner.
          tree.burn ??= {
            remaining: 76,
            started: false,
            wood: Math.round(tree.logs * 100),
            scale: debrisModels[tree.model + 12]?.scale ?? 0,
          }
        },
        dropTimber: () => dropCarriedTimber(p, allocateLog, () => sound(w, 11, u)),
      }
    )
  } else if (task.task === BuilderTask.ClearPeople) {
    const people: ClearingPerson[] = w.units
      .filter(u => u.hp > 0 && u.inside === null)
      .map(u => ({
        ...nativePosition(w, u),
        id: u.id,
        class: 1,
        model: nativePersonModel(u),
        tribe: u.team === 'blue' ? 0 : 1,
        state: u.native?.state ?? (u.work === null ? 1 : 10),
        speed: u.native?.speed ?? (u.path.length ? unitSpeed(u) : 0),
        flags2: u.native?.flags2 ?? 0,
        commands: [],
        commandCursor: 0,
        immediateCommand: 0,
      }))
    const cellPeople = (i: number) =>
      people.filter(o => ((o.y & 65535) >> 9) * 128 + ((o.x & 65535) >> 9) === i)
    const orders = { records: [], cursor: 0, active: 0 }
    // Browser commands still own routes; this supplies the existing terrain/cell
    // predicate without pretending browser orders are native command records.
    const resting = { land: w.land, orders, cellObjects: () => [] }
    let displacement: Point | null = null
    finished = stepBuildingPeople(
      w,
      p,
      task,
      {
        tribe: p.tribe,
        orders,
        search: w.indexedSearch,
        flags: w.land.flags,
        occupants: () => buildingFootprintCells(pose).flatMap(cellPeople),
        cellPeople,
        available: i => restingCellAvailable(resting, ((i & 127) << 1) | ((i >> 7) << 9)),
      },
      {
        animation,
        destination,
        releaseMotion,
        // ponytail: browser orders have no native pool limit; connect command ownership.
        allocateOrder: to => {
          displacement = browserPosition(to)
          return 1
        },
        displace: other => {
          const follower = w.units.find(u => u.id === other.id)!
          release(w, follower)
          route(w, follower, displacement!)
        },
      }
    )
  } else if (task.task === BuilderTask.Level && b.preparation) {
    turnPerson(p)
    const result = stepBuildingLevel(
      w,
      p,
      task,
      b.preparation,
      w.land,
      () => buildingGradeVertices(pose),
      {
        animation,
        destination: to => destination(to, true),
        releaseMotion,
        terrainChanged: index => changedBuildingGround(w, index),
        sound: cue => sound(w, cue, u),
      }
    )
    if (result === 2) {
      task.task = BuilderTask.Work
      task.restart = true
    }
  } else {
    const step =
      task.task === BuilderTask.Approach
        ? stepBuildingApproach
        : task.task === BuilderTask.Leave
          ? stepBuildingDeparture
          : stepBuildingWork
    step(
      w,
      p,
      task,
      {
        model: buildingModel(b),
        building: b.preparation ? 0 : b.id,
        occupied: w.land.buildingIds[cell],
        onBuilding: !!(w.land.flags[cell] & 512),
        angle: 0,
        center: buildingInsidePoint(pose),
        outside: buildingOutsidePoint(pose),
      },
      {
        destination,
        animation,
        releaseMotion,
        outsideBuilding: point => {
          const index = (point.y >> 9) * 128 + (point.x >> 9)
          if (!(w.land.flags[index] & 512)) return point
          const building = w.buildings.find(b => b.id === (w.land.buildingIds[index] & 1023))
          if (!building) throw new Error('Missing building at construction resting anchor')
          return buildingOutsidePoint(buildingPose(building))
        },
        allocateLog,
        sound: cue => sound(w, cue, u),
        rest: () =>
          faceTribe(
            {
              instantFacing: false,
              // Shared live selection adapter supplies tribe interest until camera
              // ownership is connected to native tribe records.
              tribes: w.manaTribes.map(() => ({ x: 0, y: 0, angle: 0 })),
            },
            p,
            { releaseMotion }
          ),
      }
    )
  }
  if (finished === 2) {
    task.task = BuilderTask.Work
    task.restart = true
  }
  u.cargo = p.cargo / 100
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
}

// Door arrival for timber delivery and the remaining temple admission adapter.
function atBuildingEntrance(w: World, p: Point, b: Building) {
  const door = entrance(w, b)
  return Math.abs(p.x - door.x) < 112 / 256 && Math.abs(p.z - door.z) < 112 / 256
}
// Input acceptance is separate from later route/allocation success.
export function command(
  w: World,
  p: Point & { id?: number },
  modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
) {
  if (w.paused || w.status !== 'playing') return false
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  const context = liveCommandContext(w, p)
  if (!context?.enabled) return false
  const { model } = context
  w.lastOrderTurn = w.turn
  const queuedBuilding =
    [6, 8, 10].includes(model) &&
    context.building &&
    ['hut', 'camp', 'tower', 'temple'].includes(context.building.kind)
  if (
    model === 19 ||
    model === 33 ||
    ((model === 3 || model === 27 || model === 28 || queuedBuilding) &&
      (modifiers.ctrlKey || w.orderCursor))
  ) {
    const slot = w.orderCursor
    const input = playerOrderInput(
      model,
      slot,
      modifiers.ctrlKey,
      modifiers.shiftKey,
      modifiers.altKey
    )
    const units = w.units.filter(
      u =>
        canOrder(u) &&
        w.selected.includes(u.id) &&
        acceptsPersonOrder(combatPerson(u), model)
    )
    if (!units.length) {
      tell(w, 'No selected followers can take this order.')
      return true
    }
    // Only release the old controller when beginning a new sequence or replacing
    // an order whose ownership has not yet migrated to the shared queue.
    for (const u of units) {
      const person = u.native ?? u.entry?.person ?? u.builder?.person,
        active = person ? (currentPersonOrder(w.buildingOrders, person)?.model ?? 0) : 0
      if (
        ![17, 31, 32].includes(active) &&
        (!slot || !person || ![3, 6, 8, 10, 19, 27, 28].includes(active))
      ) {
        release(w, u, model === 33)
        if (model === 33 && person) u.native = person
      }
    }
    const order = emptyPersonOrder(),
      to = nativePosition(w, p)
    writePersonOrder(
      order,
      model,
      model === 19 ? 0 : (context.person?.id ?? context.building?.id ?? context.shrine?.id ?? 0),
      ((to.x >>> 8) & 255) | (to.y & 0xff00),
      input.flags
    )
    const result = appendLiveOrders(w, units, order, slot === 0)
    if (model === 28 && result.accepted)
      for (const u of units) {
        const person = u.native ?? u.entry?.person ?? u.builder?.person
        if (!person || currentPersonOrder(w.buildingOrders, person)?.model !== 28) continue
        u.target = context.person!.id
        route(w, u, context.person!, true)
      }
    for (const p of selectionPeople(w))
      p.selectionFlags = (p.selectionFlags & ~1) | (p.selectionFlags >>> 7)
    w.orderCursor = input.nextCursor
    if (input.deselect) cancelInteraction(w)
    tell(
      w,
      result.accepted
        ? result.count
          ? 'Your followers are on the move.'
          : 'No followers can take this order.'
        : 'No command slots available.'
    )
    return true
  }
  // Non-ground commands retain their existing controller until mixed queues are live.
  w.orderCursor = 0
  const shrine = model === 27 || model === 33 ? context.shrine : undefined
  const friendly = [6, 8, 10].includes(model) ? context.building : undefined
  const enemy = model === 28 ? context.person : undefined
  const tree = model === 7 ? context.tree : undefined
  const dismantling = model === 10
  const headOrder = shrine && shrine.kind !== 'vault' ? worshipOrder(w, shrine) : 0
  const moveOrder =
    !shrine && !friendly && !enemy ? movementOrder(w, nativePosition(w, tree ?? p)) : 0
  if (
    (shrine && shrine.kind !== 'vault' && !headOrder) ||
    (!shrine && !friendly && !enemy && !moveOrder)
  ) {
    tell(w, 'No command slots available.')
    return true
  }
  let count = 0,
    constructionFull = false
  if (friendly && friendly.progress < 1 && !dismantling) constructionWorkers(w, friendly)
  for (const u of w.units.filter(u => canOrder(u) && w.selected.includes(u.id))) {
    if (!acceptsPersonOrder(combatPerson(u), model)) continue
    if (
      friendly &&
      (friendly.progress < 1 || !['hut', 'camp', 'tower', 'temple'].includes(friendly.kind)) &&
      u.kind !== 'brave'
    )
      continue
    if (
      friendly &&
      friendly.progress < 1 &&
      !dismantling &&
      !friendly.builders!.includes(u.id) &&
      !friendly.builders!.includes(0)
    ) {
      constructionFull = true
      continue
    }
    const goal = shrine
      ? headOrder
        ? browserPosition(worshipApproach(worshipHeadPose(w, shrine)))
        : entrance(w, shrine, 2)
      : friendly
        ? entrance(w, friendly)
        : enemy && 'progress' in enemy
          ? entrance(w, enemy)
          : (enemy ?? tree ?? p)
    const path = planLivePath(w, u, goal)
    if (!path) continue
    if (friendly && friendly.progress < 1 && !dismantling) assignBuilder(friendly.builders!, u.id)
    release(w, u)
    if (moveOrder || headOrder) {
      releasePersonRoute(w.motionRoutes, path)
      startLiveOrder(w, u, moveOrder || headOrder)
    } else acceptLivePath(w, u, path)
    u.work = shrine?.id ?? friendly?.id ?? null
    if (friendly && friendly.progress < 1 && !dismantling)
      u.builder = { task: BuilderTask.Approach, busy: 0, phase: 0, restart: true }
    u.target = enemy?.id ?? null
    u.tree = tree?.id ?? null
    if (shrine?.kind === 'vault')
      u.vault = { head: shrine.id, phase: 1, entering: true, remaining: 0 }
    count++
  }
  let message = 'No land route. Bring your shaman to the shore and make a Land Bridge.'
  if (count) {
    message = 'Your followers are on the move.'
    if (dismantling) message = 'Braves assigned to dismantle the building and recover timber.'
    else if (shrine)
      message = `Worshipping ${shrine.name}. ${shrine.kind === 'vault' ? 'Only your shaman can learn its secrets.' : 'One follower is enough.'}`
    else if (friendly) {
      if (friendly.progress < 1) message = 'Braves assigned to construction.'
      else if (friendly.kind === 'camp') message = 'Braves sent to train as warriors.'
      else if (friendly.kind === 'temple') message = 'Braves sent to train as preachers.'
      else if (friendly.kind === 'tower') message = 'Followers sent to occupy the guard tower.'
      else message = 'Braves sent to live in the hut.'
    } else if (enemy) message = 'Your followers march to battle.'
  } else if (constructionFull) message = 'This building already has its full construction crew.'
  else if (shrine?.kind === 'vault')
    message = 'Select your shaman to worship the Vault of Knowledge.'
  tell(w, message)
  return true
}

function processVaultTask(w: World, u: Unit) {
  const p = u.native!,
    task: VaultTask = {
      head: p.workTarget,
      phase: p.commandPhase,
      entering: !!(p.flags2 & 0x40000000),
      remaining: p.timer,
    },
    target = task.phase ? task.head : p.target,
    head = w.shrines.find(s => s.id === target && s.kind === 'vault'),
    door = head && entrance(w, head, 2),
    goal = head && (task.phase === 4 ? head : task.phase === 9 ? entrance(w, head, 6) : door),
    point = goal && nativePosition(w, goal),
    doorPoint = door && nativePosition(w, door),
    arrived = !!(
      point &&
      Math.abs(short(p.x) - short(point.x)) <= 11 &&
      Math.abs(short(p.y) - short(point.y)) <= 11
    ),
    adjacent = !!(
      doorPoint &&
      Math.abs(short(p.x - doorPoint.x)) < 512 &&
      Math.abs(short(p.y - doorPoint.y)) < 512
    )
  const previous = task.phase
  const { done, actions } = stepVaultTask(task, {
    target,
    targetValid: !!head,
    arrived,
    ready: !!head && head.work >= head.target,
    triggerExists: !!head?.active,
    adjacent,
    open: head?.model === 153,
  })
  p.workTarget = task.head
  p.commandPhase = task.phase
  p.timer = task.remaining
  p.flags2 = (task.entering ? p.flags2 | 0x40000000 : p.flags2 & ~0x40000000) >>> 0
  u.vault = done ? null : { ...task }
  u.work = done ? null : task.head
  if (!head || !door) return Number(done)
  const destination = (goal: Point) => {
    replanLivePath(w, u, p, nativePosition(w, goal))
    recoverPersonMovement(w, p, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    )
  }
  for (const action of actions) {
    if (action === 'approach' || action === 'exit') destination(door)
    if (action === 'enter') destination(head)
    if (action === 'leave') destination(entrance(w, head, 6))
    if (action === 'open' || action === 'close') {
      sound(w, 0x9f, head)
      head.model = 152
      head.morph = {
        from: action === 'open' ? 154 : 153,
        to: action === 'open' ? 153 : 155,
        started: w.turn,
        duration: 40,
      }
    }
    if (action === 'trigger') head.forced = true
    if (action === 'face') u.heading = Math.atan2(head.x - u.x, head.z - u.z)
    if (action === 'pray') {
      stopPersonMovement(p, (person, object) =>
        setLivePersonAnimation(w, person as LivePerson, object)
      )
      clearLivePath(w, u)
    }
  }
  if (previous === 3 && task.phase === 4) {
    head.model = 153
    head.morph = null
  }
  return Number(done)
}

export function guardShaman(w: World) {
  const shaman = w.units.find(u => u.team === 'blue' && canOrder(u) && isShaman(u))
  if (!shaman) return
  for (const u of w.units.filter(
    u => canOrder(u) && w.selected.includes(u.id) && u.kind !== 'shaman'
  )) {
    const guard = !u.guard
    release(w, u)
    u.guard = guard
  }
  tell(w, 'Selected followers will guard your shaman.')
}
export function placeBuilding(w: World, kind: BuildingKind, p: Point) {
  if (w.paused || w.status !== 'playing') return false
  const spec = BUILDINGS.find(b => b.id === kind)
  if (!spec || (kind === 'camp' && !w.unlockedCamp)) {
    tell(w, 'Your shaman must discover the Warrior Training Hut at the vault.')
    return false
  }
  const plan = buildingPlanPose(w, kind, p)
  p = browserPosition({ x: plan.anchorX, y: plan.anchorY })
  const error = placementError(w, kind, p)
  if (error) {
    tell(w, error)
    return false
  }
  const selected = w.units.filter(
    u => u.team === 'blue' && canOrder(u) && u.kind === 'brave' && w.selected.includes(u.id)
  )
  const workers = (
    selected.length
      ? selected
      : w.units.filter(
          u =>
            u.team === 'blue' &&
            canOrder(u) &&
            u.kind === 'brave' &&
            (u.work === null || u.inside !== null)
        )
  )
    .sort((a, b) => distance(a, p) - distance(b, p))
    .map(u => ({ u, path: findPath(w, u, p) }))
    .filter(a => a.path.length)
    .slice(0, rules.buildingMaxWorkers[buildingModel({ kind, level: 1 })])
  const b = addBuilding(w, 'blue', kind, p, false, {
    angle: (plan.angle * Math.PI) / 1024,
    plan: true,
  })
  b.builders = Array<number>(rules.buildingMaxWorkers[buildingModel(b)]).fill(0)
  if (workers.length) {
    const order = allocatePersonOrder(w.buildingOrders)
    if (order) {
      writePersonOrder(w.buildingOrders.records[order], 6, b.id, 0, 0)
      for (const { u } of workers) {
        release(w, u)
        startLiveOrder(w, u, order)
        if (startLiveConstructionOrder(w, u)) route(w, u, entrance(w, b), true)
      }
    }
  }
  w.mode = null
  tell(w, `${spec.name} planned. Braves will fetch ${spec.cost} logs from nearby trees.`)
  return true
}
// Shared browser target adapter: cursor feedback and click rejection must agree.
// Native person flags and complete globe targeting are still being integrated.
export function spellTargetError(w: World, spell: Spell, p: Point) {
  const spec = SPELLS.find(s => s.id === spell),
    shaman = w.units.find(u => u.team === 'blue' && canOrder(u) && isShaman(u))
  if (!spec) return { code: -1, message: '' }
  if (!shaman) return { code: -1, message: 'Your shaman is reincarnating.' }
  if (
    shaman.lift > 0 ||
    shaman.casting ||
    !canShamanCast(w.castingTribes[0], w.manaTribes[0].playerType, {
      state: 0,
      flags2: 0,
      flags4: 0,
    })
  )
    return { code: -1, message: 'Your shaman must finish her current action.' }
  if (!spellInRange(w, shaman, spec.model, p))
    return { code: -2, message: 'Beyond your reach. Move your shaman closer.' }
  if (Math.abs(p.x) > 45 || Math.abs(p.z) > 45)
    return { code: -3, message: 'Choose a target within the world.' }
  if (spell === 'bridge' && (!walkable(w.terrain, p) || !walkable(w.terrain, shaman)))
    return {
      code: -3,
      message: 'Land Bridge must join two dry shores. Aim at land on the opposite island.',
    }
  return null
}
export function cast(w: World, spell: Spell, p: Point) {
  if (w.paused || w.status !== 'playing') return false
  const error = spellTargetError(w, spell, p)
  if (error?.code === -1) {
    if (error.message) tell(w, error.message)
    return false
  }
  if (w.shots[spell] <= 0) {
    tell(
      w,
      spell === 'blast'
        ? 'Blast is charging. Braves working or inside huts generate more mana.'
        : spell === 'flatten' ||
            spell === 'erosion' ||
            spell === 'swamp' ||
            spell === 'firestorm' ||
            spell === 'earthquake' ||
            spell === 'volcano' ||
            spell === 'convertWild' ||
            spell === 'hypnotise' ||
            spell === 'ghostArmy' ||
            spell === 'tornado' ||
            spell === 'shield' ||
            spell === 'invisibility' ||
            spell === 'swarm'
          ? `${SPELLS.find(s => s.id === spell)!.name} is not available in this mission.`
          : 'Worship the stone head to receive this spell.'
    )
    return false
  }
  if (error) {
    tell(w, error.message)
    return false
  }
  const shaman = w.units.find(u => u.team === 'blue' && isShaman(u))!
  release(w, shaman)
  shaman.heading = Math.atan2(p.x - shaman.x, p.z - shaman.z)
  beginCast(w, shaman, spell, p)
  w.mode = null
  return true
}
// ponytail: browser unit arrays supply cell order until native terrain lists and
// person records are live. Blast scoring does not consume terrain flags.
function computerSpellPerson(w: World, u: Unit): SpellTargetUnit {
  const p = nativePosition(w, u),
    live = unitAnimationSource(u)
  return {
    class: 1,
    model: nativePersonModel(u),
    state: live?.state ?? 0,
    tribe: u.team === 'wild' ? -1 : u.team === 'blue' ? 0 : 1,
    x: p.x,
    y: p.y,
    flags2: u.inside === null ? 0 : 0x800000,
    flags4: live?.flags4 ?? (u.invisibility ? 0x1000 : 0),
    assignment: 0,
    disguise: 0,
  }
}
function computerSpellWorld(w: World): SpellTargetWorld {
  const cells = new Map<number, SpellTargetUnit[]>()
  for (const u of w.units)
    if (u.hp > 0 && u.inside === null) {
      const p = computerSpellPerson(w, u),
        cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
      const objects = cells.get(cell) ?? []
      objects.push(p)
      cells.set(cell, objects)
    }
  return {
    tribe: 1,
    alliances: 0,
    cells,
    terrainFlags: cell => w.land.flags[nativeCellIndex(cell)],
  }
}
function refreshTribeTerritory(w: World, id: number) {
  const team = id === 0 ? 'blue' : id === 1 ? 'red' : null
  refreshBuildingTerritory(w.land, w.turn, {
    id,
    playerType: w.manaTribes[id].playerType,
    defenceRadius: id === 1 ? w.ai.defenceRadius : 11,
    buildings: w.buildings
      .filter(b => b.hp > 0 && b.team === team)
      .map(b => ({ ...nativePosition(w, b), tribe: id })),
  })
}
function stepComputerSpells(w: World) {
  const u = w.units.find(u => u.team === 'red' && isShaman(u) && u.hp > 0)
  const person = u ? combatPerson(u) : null
  const caster =
    u && person
      ? {
          ...spellCaster(w, u),
          ...person,
          landIndex: person.vehicle,
          casting: w.castingTribes[1],
          playerType: w.manaTribes[1].playerType,
        }
      : null
  const world = computerSpellWorld(w),
    categoryFlags = (cell: number) =>
      rules.terrainCategoryFlags[w.land.categories[nativeCellIndex(cell)] & 15]
  const allocate = (model: number, cell: number) => {
    const spell = SPELLS.find(s => s.model === model)
    if (!spell) throw new Error(`Unimplemented computer spell effect ${model}`)
    clearLivePath(w, u!)
    beginCast(w, u!, spell.id, nativeCellPoint(cell))
    const fightingPerson = u!.fight?.motion
    if (fightingPerson && (fightingPerson.state === 25 || fightingPerson.state === 29)) {
      u!.native = fightingPerson
      changeLivePersonState(w, u!, 22)
      u!.fight = null
    }
  }
  // The live person owns native action flags; browser casting has no native record yet.
  if (caster && u?.casting) caster.flags4 |= 0x400
  const shore = castShoreBlast(
    world,
    caster,
    {
      turn: w.turn,
      population: w.units.filter(p => p.team === 'red' && !p.ghost && p.hp > 0).length,
      mana: w.manaTribes[1].mana,
      reserve: 0,
      gameFlags: w.manaWorld.gameFlags,
      aiFlags: w.ai.flags,
    },
    { categoryFlags, cast: allocate }
  )
  refreshTribeTerritory(w, 1)
  if (shore) return
  const enemyTeam = w.ai.enemyTribe === 0 ? 'blue' : w.ai.enemyTribe === 1 ? 'red' : null
  const enemy = w.units.find(p => p.team === enemyTeam && isShaman(p) && p.hp > 0)
  const context = {
    turn: w.turn,
    mana: w.manaTribes[1].mana,
    reserve: 0,
    gameFlags: w.manaWorld.gameFlags,
    aiFlags: w.ai.flags,
    blastFrequency: w.ai.attributes[32],
    stock: w.manaWorld.spells[1],
  }
  processComputerSpells(world, w.spellScan, caster, context, w.ai.spellEntries, {
    categoryFlags,
    regionFlags: cell => w.land.regions[nativeCellIndex(cell)],
    cast: allocate,
    enemyShaman: enemy ? computerSpellPerson(w, enemy) : null,
    enemyBuildings: w.buildings
      .filter(b => b.team === enemyTeam && b.hp > 0 && b.kind === 'tower')
      .map(b => {
        const people = w.units.filter(p => p.inside === b.id && p.hp > 0)
        return {
          ...buildingPose(b),
          model: 4,
          state: b.progress === 1 ? 2 : 1,
          occupants: people.length,
          firstOccupant: people[0] ? computerSpellPerson(w, people[0]) : null,
        }
      }),
  })
  w.ai.flags = context.aiFlags
}
function cleanupDefeatedTribe(w: World, id: number) {
  // ponytail: browser entity IDs/list order stand in for native registration;
  // ghosts and internal objects join this adapter with the common object store.
  const units = w.buildings
    .filter(b => b.hp > 0)
    .map(building => ({
      building,
      id: building.id,
      class: 2,
      model: buildingModel(building),
      tribe: building.team === 'blue' ? 0 : 1,
      flags4: 0,
      hp: 0,
      buildingFlags: building.damageState?.buildingFlags ?? 0,
      damage: building.damageState?.damage ?? 0,
      internalModel: 0,
    }))
  const context = {
    turn: w.turn,
    lastDefeated: w.outcome.lastDefeated,
    skyCounter: w.outcome.skyCounter,
    units,
  }
  defeatTribe(context, id, w.castingTribes[id].flags, nativePosition(w, id === 0 ? HOME : ENEMY), {
    // Tribe-death sky objects and reveal/camera effects need their native consumers.
    allocate: () => {},
    reveal: () => {},
    remove: () => {},
  })
  w.outcome.skyCounter = context.skyCounter
  for (const p of units)
    if (p.tribe === id) {
      const state = ensureBuildingDamage(p.building)
      state.buildingFlags = p.buildingFlags
      state.damage = p.damage
    }
}
export function ensureBuildingDamage(b: Building) {
  if (b.damageState) return b.damageState
  const model = buildingModel(b)
  const remaining = Math.trunc(
    Math.min(b.progress, b.hp / buildingHp(b.kind)) * rules.buildingLife[model]
  )
  return (b.damageState = {
    model,
    state: b.progress === 1 ? 2 : 1,
    flags2: 0,
    flags3: 0,
    buildingFlags: 0,
    counter: b.counter,
    damage: 0,
    renderFlags: 32,
    tilt: 0,
    roll: 0,
    remaining: 0,
    stage: buildingWorkStage(remaining, rules.buildingLife[model]),
    attacker: 255,
    occupants: 0,
    plan: { remaining, repairDelay: 0, attacker: 255 },
  })
}

function changedBuildingGround(w: World, index: number) {
  const cell = ((index & 127) << 1) | ((index >> 7) << 9)
  queueTerrain(w.land, cell, 2, 1, terrainTextures)
  processTerrain(w.land, terrainTextures)
  updateWalkMasks(w.land, cell, 3)
  notifyHeightChanges(w, [{ cell, radius: 1 }])
  refreshTerrainSurface(w)
}

function emitBuildingDebris(w: World, b: Building, stage: number, rng: { randomState: number }) {
  const source = {
    ...nativePosition(w, b),
    h: Math.round(b.foundation * 45),
    angle: buildingPose(b).angle,
    flags3: b.damageState?.flags3 ?? 0,
    tribe: b.team === 'blue' ? 0 : 1,
    stage: buildingStage(b),
  }
  for (const fragment of collapseBuildingFaces(
    w.land,
    debrisModels[buildingObject(b)],
    source,
    stage,
    rng
  )) {
    const fx = effect(w, 'debris', browserPosition(fragment))
    fx.debris = fragment
    fx.duration = Infinity
    if (!stepDebrisEffect(w, fx, rng)) w.effects.splice(w.effects.indexOf(fx), 1)
  }
}

function stepBuildingGroundResponse(w: World, b: Building) {
  const terrain = b.terrainState
  if (!terrain || b.preparation) return
  if (terrain.dirty && !((b.damageState?.flags2 ?? 0) & 0x2000000)) {
    const state = {
      ...buildingPose(b),
      ...terrain,
      model: buildingModel(b),
      counter: b.counter,
      state: b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      flags2: (b.damageState?.flags2 ?? 0) | 4,
      h: Math.round(b.foundation * 45),
    }
    stepBuildingTerrain(w.land, state, {
      // These linked indicator/attachment and dock-warning objects have no live
      // owner yet. The first mission's playable buildings do not allocate them.
      indicator: () => {},
      attachment: () => {},
      dock: () => {},
      terrainChanged: index => changedBuildingGround(w, index),
      occupants: () => {
        for (const u of w.units) {
          if (u.inside !== b.id || u.hp <= 0 || !u.native || !(u.native.flags2 & 0x20000)) continue
          const p = nativePosition(w, u),
            i = (p.y >> 9) * 128 + (p.x >> 9)
          if ((w.land.buildingIds[i] & 1023) === (b.id & 1023))
            u.native.h = terrainPointHeight(w.land, p)
        }
      },
      collapse: () => {
        state.flags2 |= 0x100000
        state.delay = 2
        ensureBuildingDamage(b).state = 3
      },
    })
    Object.assign(terrain, {
      flooded: state.flooded,
      delay: state.delay,
      reason: state.reason,
      dirty: !!(state.flags2 & 4),
    })
    b.foundation = state.h / 45
    if (b.damageState) b.damageState.flags2 = state.flags2
  }
  if (b.damageState?.state !== 3) return
  stepTerrainCollapse(terrain, {
    eject: () => evacuateBuilding(w, b),
    destroy: reason => {
      if (reason === 1) {
        emitBuildingDebris(w, b, -1, w)
        emitBlastWave(w, b, b.team, true)
      } else if (reason === 2) {
        const fx = effect(w, 'sinking', b)
        fx.sinking = {
          ...buildingPose(b),
          ...nativePosition(w, b),
          h: Math.round(b.foundation * 45),
          stage: buildingStage(b),
          counter: (w.effectCounter - 1) & 255,
          remaining: 80,
          phase: 0,
          tilt: 0,
          roll: 0,
          direction: 0,
          target: 0,
          speed: 0,
          fallSpeed: 0,
          spin: 0,
          spinDirection: 0,
          sector: 0,
          shoreScore: 0,
        }
        fx.height = b.foundation
        fx.duration = Infinity
      }
      // Native attacker statistics and mixed-class allocation ordering remain open.
      b.hp = 0
      for (const u of w.units.filter(u => u.work === b.id || u.inside === b.id)) release(w, u)
      if (b.burn?.soundPlaying) sound(w, 0x53, b, b.id).stop = true
    },
  })
}

function evacuateBuilding(w: World, b: Building, burning = false) {
  for (const u of w.units.filter(u => u.inside === b.id && u.hp > 0)) {
    const p = release(w, u)!
    if (burning) {
      u.burnTrail = 24
      u.native = p
      p.flags2 &= ~16
      initializeLivePanic(w, u)
    }
  }
}

function damageDisasterBuilding(
  w: World,
  b: Building,
  rng: { randomState: number },
  attacker?: number
) {
  const state = ensureBuildingDamage(b),
    oldStage = state.stage
  if (attacker !== undefined && attacker !== -1) state.attacker = attacker
  if (
    changeBuildingWork(state.plan, -100, state, null, {
      move: () => {},
      release: () => {},
      init: () => {},
    })
  ) {
    emitBuildingDebris(w, b, oldStage, rng)
    sound(w, 0x12, b)
  }
  if (attacker !== undefined) state.plan.repairDelay = rules.buildingRepairDelay
  if (attacker !== undefined && attacker !== -1) state.plan.attacker = attacker
  b.progress = Math.max(0, state.plan.remaining) / rules.buildingLife[state.model]
  b.logs = Math.max(0, Math.floor(state.plan.remaining / 100))
  b.hp = Math.min(b.hp, buildingHp(b.kind) * b.progress)
}

function damageTornadoTree(w: World, tree: Tree) {
  const wood = Math.max(
    0,
    Math.min(rules.sceneryWood[tree.model], Math.round(tree.logs * 100) - 100)
  )
  if (wood < 100) depleteTree(w, tree)
  else tree.logs = wood / 100
}

function emitBuildingSmoke(w: World, b: Building, rng: { randomState: number }) {
  const point = buildingSmokePoint(buildingPose(b), rng)
  if (!point) return null
  const cloud = createBuildingSmoke(w.land, point, rng)
  const fx = effect(w, 'buildingSmoke', browserPosition(point))
  fx.animation = fx.smoke = cloud
  fx.groundVersion = w.landVersion
  fx.duration = Infinity
  moveVisual(fx, cloud)
  return cloud
}

function stepBurningBuilding(w: World, b: Building) {
  const state = b.damageState!,
    burn = b.burn!
  state.occupants = w.units.filter(u => u.inside === b.id && u.hp > 0).length
  stepBuildingBurn(state, burn, {
    eject: () => evacuateBuilding(w, b, true),
    sound: () => {
      sound(w, 0x53, b, b.id)
      burn.soundPlaying = true
    },
    damage: () => {
      sound(w, 0x53, b, b.id).stop = true
      const plan = state.plan
      if (
        changeBuildingWork(plan, -100, state, null, {
          move: () => {},
          release: () => {},
          init: () => {},
        })
      ) {
        const smoke = emitBuildingSmoke(w, b, w)
        if (smoke) smoke.lifetime = (((random(w) & 255) + rules.buildingSmokeDuration) << 16) >> 16
      }
      plan.repairDelay = rules.buildingRepairDelay
      if (state.attacker !== 255) plan.attacker = state.attacker
      b.hp = Math.min(
        b.hp,
        (buildingHp(b.kind) * Math.max(0, plan.remaining)) / rules.buildingLife[state.model]
      )
    },
    finish: () => {
      b.burn = undefined
      b.progress = Math.max(0, state.plan.remaining) / rules.buildingLife[state.model]
      b.logs = Math.max(0, Math.floor(state.plan.remaining / 100))
    },
  })
}

function stepDamagedBuilding(w: World, b: Building) {
  const state = b.damageState!
  state.counter = b.counter
  state.occupants = w.units.filter(u => u.inside === b.id && u.hp > 0).length
  advanceCollapse(w, state)
  const smoke = { duration: 0, cloud: null as BuildingSmoke | null },
    context = { randomState: w.randomState, tribes: [] }
  processBuildingDamage(context, state, {
    ensurePlan: () => {
      if (state.state === 2 && !(state.flags2 & 0x100000)) state.state = 1
    },
    plan: () => state.plan,
    changeWork: (p, n) =>
      changeBuildingWork(p, n, state, null, { move: () => {}, release: () => {}, init: () => {} }),
    removeOccupant: () => {
      const u = w.units.find(u => u.inside === b.id && u.hp > 0)
      if (u) release(w, u)
      state.occupants--
    },
    smoke: () => {
      smoke.cloud = emitBuildingSmoke(w, b, context)
      return smoke.cloud ? smoke : null
    },
    debris: oldStage => emitBuildingDebris(w, b, oldStage, context),
    canRespond: () => false,
    reserve: () => {},
    removePlan: () => {},
    notify: () => {},
    removeBuilding: () => {
      if (b.attackTaskMember !== undefined) creditAttackTask(w.ai, b.attackTaskMember, 1)
      b.hp = 0
    },
    sound: () => sound(w, 0x34, b),
  })
  // ponytail: native plan stages drive collapse; combat HP,
  // plan geometry and AI repair selection await the rest of the building port.
  b.hp = Math.min(
    b.hp,
    (buildingHp(b.kind) * Math.max(0, state.plan.remaining)) / rules.buildingLife[state.model]
  )
  w.randomState = context.randomState
  if (smoke.cloud) smoke.cloud.lifetime = smoke.duration
}
function stepOutcome(w: World) {
  if (w.manaWorld.loadFlags & 0x200 || w.manaWorld.gameFlags & 32) return
  // ponytail: registered native person lists/counts await the shared object
  // rebuild. Opening classes retain browser followers through live death states.
  const tribes = w.manaTribes.map((t, id) => {
    const team = id === 0 ? 'blue' : id === 1 ? 'red' : null
    const people = w.units
      .filter(u => u.team === team)
      .map(unit => ({
        unit,
        model: nativePersonModel(unit),
        state: unit.native?.state ?? 0,
        previousState: unit.native?.previousState ?? 0,
        flags2: unit.native?.flags2 ?? (unit.inside === null ? 0 : 0x800000),
        flags3: unit.native?.flags3 ?? 0,
        hp: Math.round(unit.hp * 20),
      }))
    return { ...t, flags: w.castingTribes[id].flags, population: people.length, people }
  })
  const context = {
    ...w.outcome,
    turn: w.turn,
    landFlags: w.land.landFlags,
    playerTribe: w.manaWorld.playerTribe,
  }
  processOutcome(context, tribes, {
    camera: id => {
      w.outcome.cameraTribe = id
      w.outcome.cameraRequest++
    },
    completeLevel: index => {
      w.outcome.completedLevel = index
    },
    cancelInput: () => {
      w.selected = []
      w.mode = null
    },
    reveal: () => {
      for (let i = 0; i < w.land.flags.length; i++) w.land.flags[i] |= 8
    },
    releasePerson: p => {
      const person = p.unit.native ?? createLivePerson(w, p.unit)
      // Celebration owns its native occupant exit after dropping carried logs.
      releaseTasks(w, p.unit)
      p.unit.native = person
    },
    damage: (p, amount) => {
      p.unit.hp -= amount / 20
    },
    // Persistent campaign saves and network result delivery remain unported.
    defeat: id => cleanupDefeatedTribe(w, id),
    initPerson: p => initializeLiveCelebration(w, p.unit),
    networkResult: () => {},
  })
  w.land.landFlags = context.landFlags
  w.outcome.progressFlags = context.progressFlags
  w.outcome.lastDefeated = context.lastDefeated
  tribes.forEach((t, id) => {
    w.manaTribes[id].defeatTimer = t.defeatTimer
    w.manaTribes[id].flags2 = t.flags2
  })
}
function shotVisual(w: World, p: NativePoint, team: Team, sequence: string, frame = 0) {
  const fx = effect(w, 'trail', browserPosition(p))
  fx.height = p.h / 45
  fx.sprite = { sequence, frame }
  fx.team = team
  fx.duration = Infinity
  if (sequence === 'blastTrail' || sequence === 'spellTrail') {
    const trail = createSpellTrail(
      w.land,
      p,
      sequence === 'blastTrail' ? 3 : 4,
      (w.effectCounter - 1) & 255,
      w.cosmeticRandom
    )
    // 0x4bb440 overrides Blast jitter trails to expire their first phase next turn.
    if (sequence === 'blastTrail') {
      trail.remaining = 0
      trail.flags3 |= 0x100
    }
    fx.animation = trail
    fx.height = trail.h / 45
  }
  return fx
}
function moveVisual(f: Effect, p: NativePoint) {
  Object.assign(f, browserPosition(p))
  f.height = p.h / 45
}
// Class-7/model-3 sparks are shared by landings, debris and fire embers.
export function emitGroundSpark(w: World, position: NativePoint) {
  const fx = effect(w, 'trail', browserPosition(position))
  const trail = createSpellTrail(w.land, position, 3, (w.effectCounter - 1) & 255, w.cosmeticRandom)
  fx.animation = trail
  fx.sprite = { sequence: 'blastTrail', frame: 0 }
  fx.duration = Infinity
  moveVisual(fx, trail)
  return trail
}

function stepDebrisEffect(w: World, fx: Effect, rng: { randomState: number }) {
  const fragment = fx.debris!
  const alive = stepBuildingDebris(w.land, fragment, rng, water => {
    const position = browserPosition(fragment)
    if (water) {
      effect(w, 'splash', position)
    } else {
      emitGroundSpark(w, fragment)
      sound(w, 0x13, position)
    }
  })
  moveVisual(fx, fragment)
  return alive
}

function createFire(
  w: World,
  p: Point,
  options: {
    size: number
    snap: boolean
    smoke: boolean
    turns: number
    suppressEmbers?: boolean
    light?: boolean
  }
) {
  const fx = effect(w, 'fire', p)
  fx.fire = createSceneryFire(w.land, nativePosition(w, p), options, w.cosmeticRandom)
  setFireLifetime(fx.fire, options.turns)
  fx.fire.suppressEmbers = options.suppressEmbers ?? false
  fx.fire.expiring = fx.fire.suppressEmbers
  fx.duration = Infinity
  fx.groundVersion = w.landVersion
  moveVisual(fx, fx.fire)
  if (options.light !== false) registerTerrainLight(w, fx, 3)
}

function igniteBuildingAt(w: World, target: NativePoint, tribe: number) {
  const index = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9)
  const id = w.land.buildingIds[index] & 1023
  const building = w.buildings.find(b => b.id === id && b.hp > 0)
  if (building) {
    const state = ensureBuildingDamage(building)
    igniteBuilding(state, tribe, () => {
      building.burn = { remaining: 127, soundPlaying: false }
      const ignitePeople = buildingFirePeople(w)
      for (const point of buildingFirePoints(buildingPose(building))) {
        createFire(w, browserPosition(point), {
          size: point.size,
          light: point.light,
          snap: false,
          smoke: true,
          turns: 135,
          suppressEmbers: true,
        })
        building.burn.soundPlaying = true
        ignitePeople(point, building.team === 'blue' ? 0 : 1)
      }
    })
  }
}

// 0x511ae0's first bolt turn: ignite burnable scenery in the target cell;
// without scenery, create the short-lived, cell-centered fire instead.
function igniteLightningScenery(w: World, target: NativePoint, tribe: number) {
  igniteBuildingAt(w, target, tribe)
  const trees = w.trees.filter(tree => {
    const p = nativePosition(w, tree)
    return (
      tree.model <= 6 &&
      tree.logs > 0 &&
      !tree.burn &&
      (p.x & 0xfe00) === (target.x & 0xfe00) &&
      (p.y & 0xfe00) === (target.y & 0xfe00)
    )
  })
  for (const tree of trees)
    tree.burn = {
      remaining: 76,
      started: false,
      wood: Math.round(tree.logs * 100),
      scale: debrisModels[tree.model + 12].scale,
    }
  const fires = w.effects.filter(
    ({ fire }) =>
      fire &&
      !fire.expiring &&
      (fire.x & 0xfe00) === (target.x & 0xfe00) &&
      (fire.y & 0xfe00) === (target.y & 0xfe00)
  )
  for (const { fire } of fires) {
    fire!.expiring = true
    fire!.remaining = 0
  }
  if (!trees.length && !fires.length)
    createFire(w, browserPosition(target), { size: 16, snap: true, smoke: false, turns: 24 })
}

// 0x511800: effect model 28, emitted by a Firestorm projectile at impact.
function impactFirestorm(w: World, target: NativePoint, tribe: number) {
  const index = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9),
    point = browserPosition(target)
  if (rules.terrainCategoryFlags[w.land.categories[index] & 15] & 2) {
    effect(w, 'splash', point, true)
    sound(w, 0x55, point)
  } else {
    createFire(w, point, {
      size: 32,
      snap: false,
      smoke: false,
      turns: 22,
      suppressEmbers: true,
    })
    sound(w, 0xb6, point)
  }
  const wave = emitBlastWave(w, point, tribe === 0 ? 'blue' : 'red')
  wave.panic = true
  wave.scatter = true
  igniteBuildingAt(w, target, tribe)
}

function depleteTree(w: World, tree: Tree, computer = false) {
  tree.logs = 0
  const remaining = replantDelay(tree.model, computer)
  if (remaining) w.replants.push({ ...nativePosition(w, tree), model: tree.model, remaining })
}

function stepScenery(w: World) {
  // Snapshot requests before this turn's fire/harvesting can create new ones.
  w.replants = w.replants.filter(
    request =>
      !stepReplant(request, () => {
        const occupied = new Map<number, { class: number; model: number }[]>()
        const add = (p: NativePoint, model: number) => {
          const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
          const row = occupied.get(cell) ?? []
          row.push({ class: 5, model })
          occupied.set(cell, row)
        }
        for (const tree of w.trees) if (tree.logs > 0) add(nativePosition(w, tree), tree.model)
        for (const shrine of w.shrines) add(nativePosition(w, shrine), 9)
        for (const center of [HOME, ENEMY])
          for (const stone of reincarnationStones(w.land, nativePosition(w, center))) add(stone, 12)
        for (const fx of w.effects) if (fx.fire) add(fx.fire, 10)
        const point = findReplantSite(
          w.land,
          w.indexedSearch,
          request,
          cell => occupied.get(cell) ?? []
        )
        if (!point) return false
        // Native scenery initialization snaps the allocated corner to its cell center.
        w.trees.push({
          ...browserPosition({ x: point.x + 256, y: point.y + 256 }),
          id: w.nextId++,
          model: request.model,
          logs: 1,
          counter: 0,
          growth: rules.sceneryGrowth[request.model],
        })
        return true
      })
  )
  // Snapshot before tree/fire callbacks allocate this turn's new scenery.
  const fires = w.effects.filter(fx => fx.fire)
  for (const tree of w.trees) {
    tree.counter = ((tree.counter ?? 0) + 1) & 255
    if (tree.logs <= 0) continue
    if (!tree.burn) {
      const state = {
        model: tree.model,
        counter: tree.counter,
        wood: Math.round(tree.logs * 100),
        growth: tree.growth ?? rules.sceneryGrowth[tree.model],
      }
      stepTreeGrowth(state)
      tree.logs = state.wood / 100
      tree.growth = state.growth
      continue
    }
    tree.burn.wood = Math.round(tree.logs * 100)
    const alive = stepBurningTree(
      tree.burn,
      rules.sceneryWood[tree.model],
      debrisModels[tree.model + 12]?.scale ?? 0,
      () => createFire(w, tree, { size: 32, snap: false, smoke: true, turns: 76 })
    )
    if (alive) tree.logs = tree.burn.wood / 100
    else if (tree.burn.remaining >= 0 && tree.burn.wood < 100) depleteTree(w, tree)
    else tree.logs = 0 // 0x4a7bd0's expiry removal does not allocate a replant request.
  }
  for (const fx of fires) {
    const fire = fx.fire!
    if (fx.groundVersion !== w.landVersion) fire.groundDirty = true
    fx.groundVersion = w.landVersion
    const alive = stepSceneryFire(w.land, fire, w, {
      isLand: () =>
        !!terrainSupportsPerson(w.land.categories[(fire.y >> 9) * 128 + (fire.x >> 9)], fire),
      sound: () => {
        sound(w, 6, fx, fx.id)
        fire.soundPlaying = true // Cleared when its audio voice ends.
      },
      ember: (position, speed, flags) => {
        const trail = emitGroundSpark(w, position)
        trail.speed = speed
        trail.flags4 |= flags
      },
      smoke: () => {
        const cloud = createBuildingSmoke(w.land, fire, w)
        const smoke = effect(w, 'buildingSmoke', browserPosition(fire))
        smoke.animation = smoke.smoke = cloud
        smoke.groundVersion = w.landVersion
        smoke.duration = Infinity
        moveVisual(smoke, cloud)
      },
    })
    moveVisual(fx, fire)
    if (!alive) fx.duration = fx.age
  }
}
function processProjectiles(w: World) {
  // Newest native allocations precede older objects. Full mixed-class scheduling remains to be ported.
  for (const shot of [...w.projectiles].reverse()) {
    const caster = w.units.find(u => u.team === shot.team && isShaman(u) && u.hp > 0)
    const remove = () => {
      w.projectiles.splice(w.projectiles.indexOf(shot), 1)
      for (const f of shot.visuals) f.duration = f.age
    }
    if (shot.fireball && shot.remaining > 0) {
      shot.remaining--
      continue
    }
    if (shot.phase === 'windup') {
      if (!caster) {
        remove()
        continue
      }
      if (--shot.remaining > 0) continue
      shot.source = { x: caster.x, z: caster.z }
      shot.origin = nativePosition(w, caster)
      shot.origin.h += 0x60
      shot.position = { ...shot.origin }
      // 0x4c21e0: Lightning aims 0x400 above, displaced 0x600 toward the shaman.
      if (shot.spell === 'lightning') {
        const d = shot.destination,
          yaw = nativeAngle(short(shot.origin.x - d.x), -short(shot.origin.y - d.y))
        shot.destination = nativeStep3D({ ...d, h: d.h + 0x400 }, yaw, 512, 0x600)
      }
      shot.phase = 'flying'
      if (shot.spell === 'blast') {
        sound(w, 0xa1, shot.source)
        shot.visuals = Array.from({ length: 5 }, (_, i) =>
          shotVisual(w, shot.position, shot.team, 'blastShot', i + 3)
        )
      }
      continue
    }
    if (shot.phase === 'arrived') {
      if (!shot.fireball && caster)
        finishCast(w, { id: shot.caster, team: shot.team, ...shot.source }, shot.spell, shot.target)
      remove()
      continue
    }
    const p = shot.position,
      d = shot.destination
    if (shot.spell === 'blast' || shot.fireball) {
      // 0x4bb440: model-4 projectiles snap inside the arrival sphere and delete next turn.
      const speed = shot.fireball ? 250 : 1000
      if (
        Math.abs(short(d.x - p.x)) < 0x408 &&
        Math.abs(short(d.y - p.y)) < 0x408 &&
        Math.abs(d.h - p.h) < 0x408 &&
        nativeDistance(p, d) < speed
      ) {
        shot.position = {
          ...d,
          h: Math.max(d.h, nativePosition(w, browserPosition(d)).h),
        }
        shot.phase = 'arrived'
        // 0x4bb440 removes the four attached tails, but the shot's own head
        // reaches the target and remains visible until deletion on its next visit.
        moveVisual(shot.visuals[0], shot.position)
        for (const f of shot.visuals.slice(1)) f.duration = f.age
        if (shot.fireball) impactFirestorm(w, d, shot.team === 'blue' ? 0 : 1)
        continue
      }
      const [yaw, pitch] = shotAngles(p, d)
      shot.position = nativeStep3D(p, yaw, pitch, speed)
      shot.position.h = Math.max(
        shot.position.h,
        nativePosition(w, browserPosition(shot.position)).h
      )
      const travelled = nativeDistance(shot.position, shot.origin)
      moveVisual(shot.visuals[0], shot.position)
      for (let i = 1; i <= 4; i++)
        if (i * 80 < travelled)
          moveVisual(shot.visuals[i], nativeStep3D(shot.position, yaw, pitch, -i * 80))
      // Four jitter trails; jitter uses game RNG, effect initialization uses cosmetic RNG.
      if (!shot.fireball && shot.turns > 0)
        for (let i = 1; i <= 4; i++)
          if (320 + i * 160 < travelled) {
            const tail = nativeStep3D(
              nativeStep3D(shot.position, yaw, pitch, -320),
              yaw,
              pitch,
              -i * 160
            )
            tail.x = short(tail.x + 8 - (random(w) & 15))
            tail.y = short(tail.y + 8 - (random(w) & 15))
            shotVisual(w, tail, shot.team, 'blastTrail')
          }
    } else {
      // 0x4baf00: 20 substeps of 70; each trail starts with four turns before its second phase.
      for (let i = 0; i < 20; i++) {
        const p = shot.position,
          tail = {
            ...p,
            x: short(p.x + 8 - (random(w) & 15)),
            y: short(p.y + 8 - (random(w) & 15)),
          }
        tail.h = Math.max(tail.h, nativePosition(w, browserPosition(tail)).h)
        shotVisual(w, tail, shot.team, 'spellTrail')
        if (
          Math.abs(short(d.x - p.x)) < 108 &&
          Math.abs(short(d.y - p.y)) < 108 &&
          Math.abs(d.h - p.h) < 108
        ) {
          if (caster)
            finishCast(
              w,
              { id: shot.caster, team: shot.team, ...shot.source },
              shot.spell,
              shot.target,
              shot.position
            )
          remove()
          break
        }
        const [yaw, pitch] = shotAngles(p, d)
        shot.position = nativeStep3D(p, yaw, pitch, 70)
      }
    }
    shot.turns++
  }
}
function emitBlastWave(w: World, point: Point, team: Team, standardForce = false) {
  const position = nativePosition(w, point)
  position.h = terrainPointHeight(w.land, position)
  const fx = effect(w, 'blastWave', point)
  fx.wave = createBlastWave(
    position,
    team === 'blue' ? 0 : 1,
    !standardForce && !!(w.manaWorld.loadFlags & 0x04000000)
  )
  fx.duration = Infinity
  sound(w, 0xa1, point)
  return fx.wave
}

// Native force/damage dispatch with live object adapters. Ordinary allocation
// still supplies cell order; complete mixed-class lists remain open.
function stepLiveBlastWave(w: World, wave: BlastWave) {
  syncLandscapeObjects(w)
  const units = new Map(
    w.units.filter(u => u.hp > 0 || u.flight || u.native?.state === 44).map(u => [u.id, u])
  )
  const buildings = new Map(w.buildings.filter(b => b.hp > 0).map(b => [b.id, b]))
  const cells = new Map<number, BlastTarget[]>()
  const records = new Map<number, BlastTarget>()
  const people = new Map<number, LivePerson>()
  const shaken = new Map<number, Building | Tree>()
  const add = (p: BlastTarget) => {
    records.set(p.id, p)
    const index = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const cell = cells.get(index) ?? []
    cell.unshift(p)
    cells.set(index, cell)
  }
  for (const u of units.values()) {
    if (u.inside !== null) continue
    const existing = u.flight ?? u.fight?.motion ?? u.native
    const p = existing ?? createLivePerson(w, u)
    p.life = Math.round(u.hp * 20)
    people.set(p.id, p)
    add(Object.assign(p, { shake: 0, shakeOrigin: 0 }))
  }
  const addShaken = (
    source: Building | Tree,
    objectClass: 2 | 5,
    model: number,
    tribe: number,
    state: number,
    flags2 = 0,
    flags3 = 0
  ) => {
    shaken.set(source.id, source)
    add({
      ...nativePosition(w, source),
      id: source.id,
      class: objectClass,
      model,
      tribe,
      state,
      previousState: 0,
      flags2,
      flags3,
      flags4: 0,
      velocity: { x: 0, y: 0, z: 0 },
      vehicle: 0,
      burnTrail: 0,
      life: 0,
      shake: source.shake ?? 0,
      shakeOrigin: source.shakeOrigin ?? 0,
    })
  }
  for (const b of buildings.values())
    addShaken(
      b,
      2,
      buildingModel(b),
      b.team === 'blue' ? 0 : 1,
      b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      b.damageState?.flags2,
      b.damageState?.flags3
    )
  for (const tree of w.trees)
    if (tree.logs > 0 && rules.sceneryResourceFlags[tree.model] & 0x40000)
      addShaken(tree, 5, tree.model, -1, 0)
  const state = {
    randomState: w.randomState,
    search: w.indexedSearch,
    land: w.land,
    alliances: w.outcome.alliances,
    special: !!(w.manaWorld.loadFlags & 0x04000000),
  }
  const alive = stepBlastWave(
    state,
    wave,
    {
      cell: index => cells.get(index) ?? [],
      building: id => records.get(id),
    },
    {
      panic: p => {
        w.randomState = state.randomState
        initializeLivePanic(w, units.get(p.id)!, people.get(p.id)!, true)
        state.randomState = w.randomState
      },
      animation: p => {
        const u = units.get(p.id)
        if (!u) return
        const person = people.get(p.id)!
        const object = personAnimationObject(person)
        if (object !== -1) setLivePersonAnimation(w, person, object)
      },
      damage: (p, amount) => damagePerson(people.get(p.id)!, w.levelFlags2, wave.tribe, amount),
      buildingDamage: (p, amount) => {
        if (w.levelFlags2 & 0x04000000 || p.flags3 & 128) return
        const b = ensureBuildingDamage(buildings.get(p.id)!)
        b.damage = ((b.damage + amount) << 16) >> 16
        if (wave.tribe !== -1 && wave.tribe !== 255) b.attacker = wave.tribe
      },
      vehicleDamage: () => {
        throw new Error('Live vehicle damage has no vehicle owner')
      },
      remove: p => {
        p.life = 0
      },
    }
  )
  for (const p of people.values()) {
    const u = units.get(p.id)
    if (!u) continue
    u.hp = p.life / 20
    u.burnTrail = p.burnTrail
    if (p.flags2 & 0x80000) {
      if (!u.flight) release(w, u)
      u.flight = p
      u.lift = 1
    }
  }
  for (const [id, source] of shaken) {
    const p = records.get(id)!
    if (p.shake && !source.shake) {
      source.shake = 1
      source.shakeOrigin = p.shakeOrigin
    }
  }
  w.randomState = state.randomState
  return alive
}

const SHIELD_TURNS = constants.SHIELD_COUNT_X8 * 8
const INVISIBILITY_TURNS = constants.INVISIBLE_COUNT_X8 * 8
const HYPNOTISE_COUNT = constants.HYPNO_COUNT_X8

function retainedPeople(u: Unit) {
  return [
    ...new Set([u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]),
  ].filter(Boolean) as LivePerson[]
}

function replaceHypnotisedUnit(w: World, source: Unit, team: Team, originalTeam?: Team) {
  const slot = w.units.indexOf(source)
  if (slot < 0) return
  const position = { x: source.x, z: source.z },
    { hp, cargo, heading, kind } = source,
    people = retainedPeople(source)
  releaseTasks(w, source)
  for (const p of people) if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
  w.objectCells.objects.delete(source.id)
  w.selected = w.selected.filter(id => id !== source.id)
  const replacement = addUnit(w, team, kind, position)
  Object.assign(replacement, { hp, cargo, heading })
  replacement.native = createLivePerson(w, replacement)
  if (originalTeam) {
    replacement.hypnotise = {
      originalTeam,
      remaining: HYPNOTISE_COUNT,
      counter: replacement.native.counter,
    }
    replacement.native.flags4 = (replacement.native.flags4 | 0x4000) >>> 0
  }
  registerLivePerson(w, replacement.native)
  w.units[slot] = replacement
  w.units.pop()
  return replacement
}

export function applyHypnotise(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(({ u, scan }) => {
      const p = unitAnimationSource(u)
      return (
        scan >= 0 &&
        u.inside === null &&
        ![1, 7, 8].includes(nativePersonModel(u)) &&
        u.team !== team &&
        !((p?.flags4 ?? 0) & 0x1000) &&
        !u.invisibility
      )
    })
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.HYPNO_NUM_PEOPLE)
  for (const { u } of targets) {
    const p = unitAnimationSource(u)
    if ((p?.flags4 ?? 0) & 0x800) {
      releaseTasks(w, u)
      if ((p?.flags2 ?? 0) & 0x20000) removeObjectFromCell(w.objectCells, p as LivePerson)
      w.objectCells.objects.delete(u.id)
      w.selected = w.selected.filter(id => id !== u.id)
      w.units.splice(w.units.indexOf(u), 1)
      continue
    }
    replaceHypnotisedUnit(w, u, team, u.hypnotise?.originalTeam ?? u.team)
  }
  return targets
}

export function stepUnitHypnotise(w: World) {
  for (const u of [...w.units]) {
    const status = u.hypnotise
    if (!status || u.hp <= 0) continue
    status.counter = (status.counter + 1) & 255
    if (status.counter & 7 || --status.remaining > 0) continue
    const tribe = status.originalTeam === 'blue' ? 0 : status.originalTeam === 'red' ? 1 : -1
    if (tribe >= 0 && w.manaTribes[tribe].defeatTimer) {
      delete u.hypnotise
      for (const p of retainedPeople(u)) p.flags4 = (p.flags4 & ~0x4000) >>> 0
    } else replaceHypnotisedUnit(w, u, status.originalTeam)
  }
}

function restoreDeadHypnotisedUnit(u: Unit) {
  if (!u.hypnotise) return
  u.team = u.hypnotise.originalTeam
  delete u.hypnotise
  for (const p of retainedPeople(u)) {
    p.tribe = u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1
    p.flags4 = (p.flags4 & ~0x4000) >>> 0
  }
}

function setUnitShield(u: Unit, turns: number) {
  u.shield = turns
  for (const p of [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person])
    if (p) p.flags3 = turns ? (p.flags3 | 0x80000) >>> 0 : (p.flags3 & ~0x80000) >>> 0
}

export function stepUnitShields(w: World) {
  for (const u of w.units) if (u.shield) setUnitShield(u, u.shield - 1)
}

export function shieldFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point)
  // ponytail: nearest candidates approximate the unavailable native radius-3
  // land-list callbacks; replace this ordering when 00515e30 is exportable.
  const targets = w.units
    .filter(
      u =>
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        positionDistance(nativePosition(w, u), center) <= 3 * 512
    )
    .toSorted(
      (a, b) =>
        positionDistance(nativePosition(w, a), center) -
        positionDistance(nativePosition(w, b), center)
    )
    .slice(0, constants.SHIELD_NUM_PEOPLE)
  for (const u of targets) setUnitShield(u, SHIELD_TURNS)
  return targets
}

export function setUnitInvisibility(w: World, u: Unit, turns: number) {
  const wasInvisible = !!u.invisibility,
    renderFlag = unitInvisibilityRenderBit(w, u)
  u.invisibility = turns
  for (const p of new Set([
    u.native,
    u.flight,
    u.fight?.motion,
    u.entry?.person,
    u.builder?.person,
  ])) {
    if (!p) continue
    if (turns) {
      if (!wasInvisible) p.invisibilityRender = p.renderFlags & renderFlag ? 0 : renderFlag
      p.flags4 = (p.flags4 | 0x1000) >>> 0
      p.renderFlags |= renderFlag
    } else {
      if (p.invisibilityRender) p.renderFlags &= ~p.invisibilityRender
      delete p.invisibilityRender
      p.flags4 = (p.flags4 & ~0x1000) >>> 0
    }
  }
}

export function unitInvisibleToPlayer(w: World, u: Unit) {
  return !!(
    u.invisibility &&
    u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
  )
}

export function unitInvisibilityRenderBit(w: World, u: Unit) {
  return u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
    ? 16
    : 0x4000
}

export function unitInvisibilityRenderFlag(w: World, u: Unit) {
  if (!u.invisibility) return 0
  const flag = unitInvisibilityRenderBit(w, u)
  if (flag !== 0x4000 || u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red')) return flag
  const timer = Math.ceil(u.invisibility! / 8),
    mask = timer < 6 ? 1 : timer < 14 ? 2 : timer < 24 ? 4 : 0
  return mask && !(w.turn & mask) ? 0 : flag
}

export function revealUnitInvisibility(w: World, u: Unit, audible = true) {
  if (!u.invisibility) return false
  if (audible) sound(w, 0x35, u, u.id)
  setUnitInvisibility(w, u, 0)
  return true
}

export function stepUnitInvisibility(w: World) {
  for (const u of w.units)
    if (u.invisibility && u.invisibility <= 1) revealUnitInvisibility(w, u)
    else if (u.invisibility) u.invisibility--
}

export function invisibilityFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(
      ({ u, scan }) =>
        scan >= 0 &&
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        !u.invisibility &&
        !((unitAnimationSource(u)?.flags4 ?? 0) & 0x1000)
    )
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.INVIS_NUM_PEOPLE)
    .map(({ u }) => u)
  for (const u of targets) setUnitInvisibility(w, u, INVISIBILITY_TURNS)
  return targets
}

function stepSwarm(w: World, fx: Effect) {
  const swarm = fx.swarm!
  if (!swarm.applied) {
    const center = nativePosition(w, fx),
      centerCell = ((center.y & 0xfe00) | ((center.x >>> 8) & 254)) >>> 0,
      cells = new Set([
        centerCell,
        ...Array.from({ length: 7 }, (_, i) => spiralCell(centerCell, i, 0)),
      ])
    for (const u of w.units) {
      if (u.hp <= 0 || u.inside !== null) continue
      const p =
          u.builder?.person ??
          u.flight ??
          u.fight?.motion ??
          u.native ??
          u.entry?.person ??
          createLivePerson(w, u),
        cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0
      p.life = Math.round(u.hp * 20)
      if (
        !cells.has(cell) ||
        p.tribe === swarm.tribe ||
        p.state === 23 ||
        p.flags2 & 0x800000 ||
        rules.personModels[p.model].flags & 0x100
      )
        continue
      if (p.flags4 & 0x800) {
        p.life = 0
        u.hp = 0
        continue
      }
      if (!(p.flags2 & 0x100000)) initializeLivePanic(w, u, p)
      damagePerson(p, w.levelFlags2, swarm.tribe, constants.SWARM_PERSON_DAMAGE)
      u.hp = p.life / 20
    }
    swarm.applied = true
  }
  // ponytail: one proven native victim pass plus a 65-turn visible lifetime;
  // add native building pursuit when its controller duration and state 2 are recovered.
  return --swarm.remaining > 0
}

const ghostRanks = [0, 0, 1, 2, 4, 3, 5, 6]
function ghostArmyCell(w: World, p: Point) {
  const n = nativePosition(w, p)
  return ((n.x >>> 8) & 254) | (n.y & 0xfe00)
}
function ghostArmyModel(w: World, fx: Effect) {
  const tribe = fx.team === 'blue' ? 0 : 1
  if (w.manaTribes[tribe].playerType === 1) return 2
  const center = ghostArmyCell(w, fx)
  let model = 2,
    rank = ghostRanks[model]
  for (const u of w.units)
    if (
      u.team === fx.team &&
      u.hp > 0 &&
      u.inside === null &&
      cellDistanceSquared(ghostArmyCell(w, u), center) <= 2 &&
      ghostRanks[nativePersonModel(u)] > rank
    ) {
      model = nativePersonModel(u)
      rank = ghostRanks[model]
    }
  return model
}
function evictGhosts(w: World, team: Team, count: number, center: number) {
  const ghosts = [...w.units].reverse().filter(u => u.team === team && u.ghost && u.hp > 0)
  for (let excess = ghosts.length + count - 60; excess > 0; excess--) {
    let victim: Unit | undefined
    for (const group of [2, 7, 0]) {
      let farthest = 0
      for (const u of ghosts) {
        const model = nativePersonModel(u)
        if (
          u.hp <= 0 ||
          u.native?.state === 3 ||
          (group ? model !== group : model === 2 || model === 7)
        )
          continue
        const distance = cellDistanceSquared(ghostArmyCell(w, u), center)
        if (distance > farthest) {
          victim = u
          farthest = distance
        }
      }
      if (victim) break
    }
    if (victim && !((victim.native?.flags2 ?? 0) & 0x100000)) victim.hp = 0
  }
}
function stepGhostArmy(w: World, fx: Effect) {
  if (fx.turnsRemaining === 4) {
    const center = nativePosition(w, fx),
      baseX = center.x & 0xfe00,
      baseY = center.y & 0xfe00
    for (let i = 0; i < 81; i++) {
      const position = {
        x: (baseX + (random(w) & 511)) & 65535,
        y: (baseY + (random(w) & 511)) & 65535,
        h: 0,
      }
      position.h = terrainPointHeight(w.land, position)
      random(w) // Successful class-7/model-3 initialization.
      emitGroundSpark(w, position)
    }
  }
  if (fx.turnsRemaining !== 0) return
  const model = ghostArmyModel(w, fx),
    kind = unitKindFromModel(model),
    count = model === 2 ? 6 : model === 7 ? 1 : 3,
    center = nativePosition(w, fx),
    team = fx.team!
  evictGhosts(w, team, count, ghostArmyCell(w, fx))
  for (let i = 0; i < count; i++) {
    const position = {
        x: short(center.x + (random(w) & 511) - 256),
        y: short(center.y + (random(w) & 511) - 256),
      },
      heading = random(w) & 2047,
      life = Math.round(maxHp(kind) * 20),
      hp = Math.floor((life * 3) / 4) + (random(w) % Math.floor(life / 4)),
      u = addUnit(w, team, kind, browserPosition(position))
    u.ghost = true
    u.heading = Math.PI - (heading * Math.PI) / 1024
    u.hp = hp / 20
    u.native = createLivePerson(w, u)
  }
}

function finishCast(
  w: World,
  shaman: Pick<Unit, 'id' | 'team' | 'x' | 'z'>,
  spell: Spell,
  p: Point,
  endpoint?: NativePoint
) {
  // Effect 78 uses the default wave initializer, then enables scatter.
  if (spell === 'blast') emitBlastWave(w, p, shaman.team).scatter = true
  const upper =
      (spell === 'lightning' || spell === 'tornado') && endpoint ? browserPosition(endpoint) : p,
    fx = effect(w, spell, upper)
  if (spell === 'lightning') {
    // 0x511ef0 raises the displaced projectile endpoint above its local ground.
    // 0x511f70 creates the upper flash and bolt generator on the next turn.
    fx.lightning = {
      tribe: shaman.team === 'blue' ? 0 : 1,
      start: { ...nativePosition(w, upper), h: Math.round(fx.height! * 45) },
      target: nativePosition(w, p),
      seed: 0,
      turn: -1,
      segments: [],
    }
  }
  // Spell 2 allocates effect 78 (0x50b630) before effect 38 (0x509c10).
  if (spell === 'blast') {
    sound(w, 0xb2, p)
  } else if (spell === 'bridge') {
    sound(w, 0xab, p)
    sound(w, 0x29, p)
  } else if (spell === 'flatten') {
    sound(w, 0xae, p)
  } else if (spell === 'ghostArmy') {
    sound(w, 0xa8, p)
  }
  if (spell === 'bridge') {
    fx.bridge = createLandBridge(nativePosition(w, shaman), nativePosition(w, p))
    fx.team = shaman.team
    fx.duration = Infinity
    w.stats.bridges++
    tell(w, 'The earth rises. Lead your followers across the new Land Bridge.')
  } else {
    if (spell === 'flatten') {
      fx.flatten = createFlatten(w.land, nativePosition(w, p))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'erosion') {
      fx.erosion = createErosion(nativePosition(w, p))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'firestorm') {
      fx.firestorm = createFirestorm(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'earthquake') {
      fx.earthquake = createEarthquake(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1, w)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'volcano') {
      fx.volcano = createVolcano(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'convertWild') {
      fx.convertWild = createConvertWild(
        nativePosition(w, p),
        shaman.team === 'blue' ? 0 : 1,
        (w.effectCounter - 1) & 255,
        w.manaTribes[shaman.team === 'blue' ? 0 : 1].playerType === 1
      )
      fx.team = shaman.team
      fx.duration = Infinity
      sound(w, 0xb4, p)
    } else if (spell === 'hypnotise') {
      fx.team = shaman.team
      fx.turnsRemaining = 16
      fx.duration = Infinity
      // ponytail: reuse the packed sparkle until the native effect-17 initializer is recovered.
      fx.sprite = { sequence: 'sparkle', frame: 0 }
    } else if (spell === 'ghostArmy') {
      fx.team = shaman.team
      fx.ghostArmy = true
      fx.turnsRemaining = 5
      fx.duration = Infinity
    } else if (spell === 'tornado') {
      fx.tornado = createTornado(
        w.land,
        endpoint ?? nativePosition(w, p),
        nativePosition(w, shaman),
        shaman.team === 'blue' ? 0 : 1,
        w
      )
      fx.team = shaman.team
      fx.duration = Infinity
      moveVisual(fx, fx.tornado)
    } else if (spell === 'swamp') {
      fx.swamp = createSwamp(
        nativePosition(w, p),
        shaman.team === 'blue' ? 0 : 1,
        (w.effectCounter - 1) & 255,
        w
      )
      fx.team = shaman.team
      fx.height = fx.swamp.center.h / 45
      fx.duration = Infinity
      const owned = w.effects.filter(candidate => candidate.swamp?.tribe === fx.swamp!.tribe),
        excess = excessSwamp(owned.map(candidate => candidate.swamp!))
      if (excess) {
        const oldest = owned.find(candidate => candidate.swamp === excess)!
        oldest.duration = oldest.age
      }
    } else if (spell === 'shield') {
      fx.sprite = { sequence: 'sparkle', frame: 0 }
      shieldFollowers(w, p, shaman.team)
    } else if (spell === 'invisibility') {
      fx.sprite = { sequence: 'sparkle', frame: 0 }
      if (invisibilityFollowers(w, p, shaman.team).length) sound(w, 0x31, p)
    } else if (spell === 'swarm') {
      fx.swarm = { tribe: shaman.team === 'blue' ? 0 : 1, remaining: 65, applied: false }
      fx.sprite = { sequence: 'smoke', frame: 0 }
      fx.duration = Infinity
      sound(w, 0xa4, p)
    }
    if (shaman.team === 'blue')
      tell(w, `${SPELLS.find(s => s.id === spell)!.name}! The world bends to your will.`)
  }
}

function stepLiveTornado(w: World, fx: Effect) {
  const tornado = fx.tornado!,
    units = new Map<number, Unit>(),
    people = new Map<number, LivePerson>(),
    cells = new Map<number, TornadoPerson[]>(),
    buildings = new Map<number, Building>(),
    buildingCells = new Map<number, TornadoBuilding[]>(),
    trees = new Map<number, Tree>(),
    sceneryCells = new Map<number, TornadoScenery[]>()
  for (const u of w.units) {
    if (u.hp <= 0) continue
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? createLivePerson(w, u),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    people.set(p.id, p)
    row.unshift(p)
    cells.set(cell, row)
  }
  for (const b of w.buildings) {
    if (b.hp <= 0 || b.preparation) continue
    const p = nativePosition(w, b),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = buildingCells.get(cell) ?? [],
      candidate = { id: b.id, model: buildingModel(b) }
    buildings.set(b.id, b)
    row.unshift(candidate)
    buildingCells.set(cell, row)
  }
  for (const tree of w.trees) {
    if (tree.logs <= 0 || tree.model < 1 || tree.model > 6) continue
    const p = nativePosition(w, tree),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = sceneryCells.get(cell) ?? [],
      candidate = { id: tree.id, model: tree.model }
    trees.set(tree.id, tree)
    row.unshift(candidate)
    sceneryCells.set(cell, row)
  }
  const alive = stepTornado(w, tornado, {
    people: cell => cells.get(cell) ?? [],
    buildings: cell => buildingCells.get(cell) ?? [],
    scenery: cell => sceneryCells.get(cell) ?? [],
    capture: candidate => {
      const u = units.get(candidate.id)!
      let p = people.get(candidate.id)!
      if (candidate.flags2 & 0x800000) p = release(w, u) ?? p
      else releaseTasks(w, u)
      u.native = p
      u.flight = undefined
      p.previousState = p.state
      p.state = 24
      p.substate = 0
      p.stateObject = fx.id
      setLivePersonAnimation(w, p, personAnimationObject(p))
      w.selected = w.selected.filter(id => id !== u.id)
      registerLivePerson(w, p)
      sound(
        w,
        p.model === 7 ? (p.tribe === w.manaWorld.playerTribe ? 26 : 137) : 210,
        browserPosition(p)
      )
    },
    damage: candidate => damageDisasterBuilding(w, buildings.get(candidate.id)!, w, tornado.tribe),
    damageScenery: candidate => damageTornadoTree(w, trees.get(candidate.id)!),
    sound: stop => {
      const event = sound(w, 163, fx, fx.id)
      if (stop) event.stop = true
    },
  })
  moveVisual(fx, tornado)
  return alive
}

function stepLiveTornadoPerson(w: World, u: Unit) {
  const p = u.native!,
    fx = w.effects.find(effect => effect.id === p.stateObject),
    before = { x: p.x, y: p.y, h: p.h },
    carried = stepTornadoPerson(w, p, fx?.tornado, w.manaWorld.gameFlags),
    after = { x: p.x, y: p.y, h: p.h }
  Object.assign(p, before)
  moveObjectInCells(w.objectCells, p, after)
  Object.assign(u, browserPosition(p))
  u.heading = Math.PI - (p.heading * Math.PI) / 1024
  if (!carried) {
    u.flight = p
    u.lift = 1
  }
}

function stepLiveSwamp(w: World, swamp: Swamp) {
  const units = new Map<number, Unit>(),
    people = new Map<number, LivePerson>(),
    cells = new Map<number, SwampTarget[]>()
  for (const u of w.units) {
    if (u.inside !== null || (u.hp <= 0 && !u.flight)) continue
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? createLivePerson(w, u),
      cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9),
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    people.set(p.id, p)
    row.unshift({ ...p, attached: p.vehicle, immune: false })
    cells.set(cell, row)
  }
  swamp.counter = (swamp.counter + 1) & 255
  return stepSwamp(w.land, swamp, !!(w.manaWorld.gameFlags & 2), {
    cell: packed => cells.get(((packed >>> 9) & 127) * 128 + ((packed & 254) >>> 1)) ?? [],
    kill: target => {
      const p = people.get(target.id)!,
        u = units.get(p.id)!
      releaseTasks(w, u)
      u.native = p
      p.previousState = p.state
      p.state = 27
      p.flags2 = (p.flags2 | 0x100000) >>> 0
      p.damageAttacker = swamp.tribe
      u.hp = 0
    },
    remove: target => {
      const p = people.get(target.id)!,
        u = units.get(p.id)!
      releaseTasks(w, u)
      const index = w.units.indexOf(u)
      if (index !== -1) w.units.splice(index, 1)
      w.selected = w.selected.filter(id => id !== u.id)
    },
    sound: () => sound(w, 0xaa, browserPosition(swamp.center)),
  })
}

function stepLiveConvertWild(w: World, fx: Effect) {
  const spell = fx.convertWild!,
    team = spell.tribe === 0 ? 'blue' : 'red',
    units = new Map<number, Unit>(),
    cells = new Map<number, LivePerson[]>()
  for (const u of w.units) {
    if (u.team !== 'wild' || u.hp <= 0 || u.inside !== null) continue
    const p = (u.native ??= createLivePerson(w, u)),
      cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    row.unshift(p)
    cells.set(cell, row)
  }
  spell.counter = (spell.counter + 1) & 255
  return stepConvertWild(spell, w, {
    population: () => population(w, team),
    people: cell => cells.get(cell) ?? [],
    unsupported: p => {
      const index = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
      return (
        restingCellCollision(
          { flags: w.land.flags[index], category: w.land.categories[index] },
          w.land.walkMasks[0],
          p
        ) === 4
      )
    },
    strand: p => {
      const u = units.get(p.id)
      if (!u) return
      const person = u.native!
      person.previousState = person.state
      person.state = 8
      person.substate = 3
      person.flags2 = (person.flags2 | 0x40000000) >>> 0
    },
    suppressed: () => !!(w.manaTribes[spell.tribe].flags2 & 64),
    convert: p => {
      const u = units.get(p.id),
        slot = u ? w.units.indexOf(u) : -1
      if (!u || slot < 0) return
      releaseTasks(w, u)
      if (u.native!.flags2 & 0x20000) removeObjectFromCell(w.objectCells, u.native!)
      w.objectCells.objects.delete(u.id)
      u.native!.class = 0
      u.hp = 0
      const replacement = addUnit(w, team, 'brave', browserPosition(p))
      w.units[slot] = replacement
      w.units.pop()
      replacement.heading = u.heading
      replacement.native = createLivePerson(w, replacement)
      replacement.native.speed = randomPersonSpeed(w, replacement.native)
      replacement.native.flags4 = (replacement.native.flags4 | 0x40000) >>> 0
      registerLivePerson(w, replacement.native)
      sound(w, 5, browserPosition(p))
      // ponytail: reuse the packed birth flash until an asset import adds native effect model 58.
      effect(w, 'birth', browserPosition(p))
    },
    sparkle: (position, turns) => {
      const sparkle = effect(w, 'trail', browserPosition(position))
      sparkle.sprite = { sequence: 'sparkle', frame: 0 }
      sparkle.height = position.h / 45
      sparkle.duration = turns / TURNS_PER_SECOND
    },
  })
}
// ponytail: current braves/warriors/shaman use the live order adapter. Replace it
// with native person records/order ownership when that lifecycle is integrated.
const liveManaOrders = { records: [], cursor: 1, active: 0 }
function manaPeople(w: World) {
  return w.units.map(
    u =>
      u.native ?? {
        class: 1,
        model: nativePersonModel(u),
        tribe: u.team === 'red' ? 1 : 0,
        state: 10,
        flags2: u.inside !== null ? 0x800000 : 0,
        flags4: u.hp > 0 ? 0x20000000 : 0,
        assignment: 0,
        commandStatus: u.work !== null || u.path.length > 0 || u.target !== null || u.guard ? 1 : 0,
        commands: [],
        commandCursor: 0,
        immediateCommand: 0,
      }
  )
}
export function manaRate(w: World) {
  return (
    (generatedMana(liveManaOrders, manaPeople(w), w.manaTribes)[0] * TURNS_PER_SECOND) /
    (rules.manaUpdateMask + 1) /
    1000
  )
}
export interface TurnObserver {
  beforeTurn?: () => void
  afterTurn?: () => void
}
export function tick(w: World, dt: number, observer?: TurnObserver) {
  if (w.paused) return
  if (!Number.isFinite(dt) || dt < 0)
    throw new RangeError('Simulation delta must be finite and nonnegative')
  w.pendingTime += dt
  // 0x4a5590 / 0x4ec6f0 keep processing after the land victory/loss bits are set.
  // The result is presentation state, not a simulation pause.
  while (w.pendingTime + 1e-9 >= 1 / TURNS_PER_SECOND) {
    w.pendingTime = Math.max(0, w.pendingTime - 1 / TURNS_PER_SECOND)
    if (w.pendingTime < 1e-9) w.pendingTime = 0
    observer?.beforeTurn?.()
    stepTurn(w)
    observer?.afterTurn?.()
  }
}
function entranceWood(w: World, b: Building) {
  return looseWoodInCell(
    buildingOutsidePoint(buildingPose(b)),
    w.trees.map(t => ({
      ...nativePosition(w, t),
      model: t.model,
      wood: Math.round(t.logs * 100),
    }))
  )
}


function* liveTimberObjects(w: World, cell: number) {
  // ponytail: scan the live tree array; index it by native cell if scenery scale makes this hot.
  for (let i = w.trees.length - 1; i >= 0; i--) {
    const tree = w.trees[i],
      point = nativePosition(w, tree),
      index = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
    if (index === cell)
      yield {
        id: tree.id,
        class: tree.logs > 0 ? 5 : 0,
        model: tree.model,
        flags4: 0,
        wood: Math.round(tree.logs * 100),
      }
  }
}

function liveTimberWorld(w: World): TimberSearchWorld {
  return {
    landFlags: w.land.landFlags,
    levelFlags: w.manaWorld.levelFlags,
    playerTribe: w.manaWorld.playerTribe,
    land: w.land,
    objects: cell => liveTimberObjects(w, cell),
    building: id => {
      const b = w.buildings.find(b => b.id === id)
      if (!b) return
      const model = buildingModel(b),
        life = rules.buildingLife[model],
        work = b.damageState?.plan.remaining ?? Math.round(b.progress * life)
      return {
        class: b.preparation ? 9 : 2,
        flags2: b.hp > 0 ? 0 : 1,
        outside: timberCell(buildingOutsidePoint(buildingPose(b))) & 0xfefe,
        needed: Math.max(0, life - work),
      }
    },
  }
}

function stepLiveTimberSearches(w: World) {
  const world = liveTimberWorld(w),
    collision = collisionWorld(w)
  stepTimberSearches(
    w.timberSearches,
    world,
    w.indexedSearch,
    (search, candidate) => {
      const u = w.units.find(u => u.id === search.person && u.hp > 0),
        p = u?.builder?.person
      if (!u || !p) return { result: 1, cost: candidate.cost }
      for (const { cell } of orderedTimberCells(search.center, candidate.cell)) {
        if (!looseTimberInCell(world, cell, search.tribe)) continue
        const center = {
          x: (((cell & 0xfe) + 1) << 8) & 65535,
          y: ((((cell >>> 8) & 0xfe) + 1) << 8) & 65535,
        }
        if (personStepCollision(collision, p, center)) continue
        const route = probeLivePathCost(w, u, p, search.center, cell)
        if (route.result !== 1) return route
      }
      return { result: 1, cost: candidate.cost }
    },
    id => w.units.some(u => u.id === id && u.hp > 0)
  )
}


function findBuildingWood(w: World, u: Unit, b: Building) {
  const door = buildingOutsidePoint(buildingPose(b))
  return w.trees
    .filter(t => {
      if (t.logs < 1) return false
      if (b.progress < 1) return true
      const p = nativePosition(w, t)
      return !!(((p.x ^ door.x) | (p.y ^ door.y)) & 0xfe00)
    })
    .sort((a, c) => distance(a, u) - distance(c, u))
    .find(t => findPath(w, u, t).length)
}

function needsDirectTimber(w: World, u: Unit, b: Building) {
  if (b.team !== u.team || b.hp <= 0 || b.progress >= 1) return false
  const model = buildingModel(b),
    life = rules.buildingLife[model],
    work = b.damageState?.plan.remaining ?? b.preparation?.work ?? Math.round(b.progress * life)
  return life - work - entranceWood(w, b) > 0
}

function directTimberDestination(w: World, u: Unit) {
  const origin = nativePosition(w, u)
  return w.buildings
    .filter(
      b => needsDirectTimber(w, u, b) && positionDistance(origin, nativePosition(w, b)) < 0x2800
    )
    .sort(
      (a, b) =>
        positionDistance(origin, nativePosition(w, a)) -
        positionDistance(origin, nativePosition(w, b))
    )
    .find(b => findPath(w, u, entrance(w, b)).length)
}

// Hut upgrades retain the existing loose-log delivery adapter.
function harvestAssignedTree(w: World, u: Unit, destination?: Point) {
  if (u.tree === null || u.cargo || u.fight || u.native?.immediateCommand) return
  const tree = w.trees.find(t => t.id === u.tree)
  if (!tree) {
    u.tree = null
    u.harvest = undefined
    return
  }
  if (u.path.length) return
  if (distance(u, tree) >= 1) {
    route(w, u, tree)
    return
  }
  if (!u.harvest) {
    u.harvest = startTimberHarvest(2, tree.model)
    sound(w, 1, u)
  }
  if (!stepTimberHarvest(u.harvest)) {
    if (tree.model === 11) sound(w, 10, u)
    return
  }
  const wood = timberTransfer(
    Math.round(tree.logs * 100),
    Math.round(u.cargo * 100),
    rules.personWood[2],
    rules.personWood[2]
  )
  tree.logs -= wood / 100
  if (wood && tree.logs < 1)
    depleteTree(w, tree, w.manaTribes[u.team === 'blue' ? 0 : 1].playerType === 1)
  u.cargo += wood / 100
  if (!destination && u.native) u.native.cargo = Math.round(u.cargo * 100)
  u.harvest = undefined
  if (destination) route(w, u, destination)
  else {
    u.tree = null
    const building = directTimberDestination(w, u)
    if (building && route(w, u, entrance(w, building)).length) {
      u.delivery = { target: building.id }
    }
  }
}

function haulBuildingWood(w: World, b: Building, workers: Unit[]) {
  for (const u of workers) {
    if (u.cargo && atBuildingEntrance(w, u, b) && !u.path.length) {
      const point = buildingDoor(b)
      w.trees.push({ ...point, id: w.nextId++, model: 11, logs: u.cargo })
      sound(w, 0xb, u)
      u.cargo = 0
      u.tree = null
    }
    harvestAssignedTree(w, u, entrance(w, b))
  }
}

function stepTurn(w: World) {
  // 0x4a5590: tribe work observes the previous completed object turn.
  // First-mission initialization supplies two active tribes. Object phases below remain partial.
  if (w.land.landFlags & 2) return
  syncNativeTerrain(w)
  if (!(w.land.landFlags & 0x800000))
    processTribes(
      {
        ...w.manaWorld,
        landFlags: w.land.landFlags,
        levelFlags2: w.levelFlags2,
        tribeCount: w.tribeCount,
      },
      w.manaTribes,
      w.castingTribes,
      {
        territory: id => refreshTribeTerritory(w, id),
        computer: id => {
          if (id !== 1) throw new Error(`Unimplemented campaign tribe ${id}`)
          stepComputerCastCooldown(w.castingTribes[id], w.ai.flags)
          campaignRules(w)
          stepComputerTasks(w, id)
          stepComputerSpells(w)
        },
      }
    )
  const dt = 1 / TURNS_PER_SECOND
  w.turn = (w.turn + 1) >>> 0
  stepUnitShields(w)
  stepUnitInvisibility(w)
  stepUnitHypnotise(w)
  w.attackAlert = 0 // 0x4ec6f0: current object turn owns the first player fight alert.
  w.musicActivity = 0 // 0x4ec6f0: current object turn owns the music activity.
  w.time = w.turn / TURNS_PER_SECOND
  // 0x4ec6f0 resets per-turn route requests and search counters before objects.
  w.pathfinding.solver.tribeRequests.fill(0)
  w.pathfinding.state.searches = 0
  Object.assign(w.pathfinding.solver, { attempts: 0, detours: 0, steps: 0, limited: 0 })
  stepLiveTimberSearches(w)
  stepOutcome(w) // 0x4ec6f0: after increment, before this turn's object work.
  stepLiveMarchingFormations(w) // Native formations steer this turn's person physics.
  // 0x4facf0: auto-collected reward objects grant knowledge/stock after 82 object turns.
  for (const gift of w.gifts) {
    if (gift.phase) gift.phase--
    if (--gift.remaining !== 0) continue
    gift.duration = gift.age
    effect(w, 'birth', gift)
    if (gift.reward === 'vault') {
      w.unlockedCamp = true
      tell(w, 'Knowledge discovered: build a Warrior Training Hut, then send braves inside.')
    } else {
      // 0x4c2cd0: stocks already at/above the cap are unchanged.
      if (w.shots[gift.reward] < 4) w.shots[gift.reward]++
      // 0x4c2aa0: the separate gift counter increases even at full stock.
      w.giftCounts[gift.reward] = Math.min(15, w.giftCounts[gift.reward] + 1)
      tell(
        w,
        `${gift.reward === 'bridge' ? 'Land Bridge' : 'Lightning'} received. ${w.shots[gift.reward]} shots ready.`
      )
    }
  }
  w.gifts = w.gifts.filter(g => g.remaining > 0)
  stepScenery(w)
  // New class-7 effects are inserted before the current native list cursor;
  // their first processor visit belongs to the following simulation turn.
  const effectCount = w.effects.length,
    terrainCenters: { cell: number; radius: number }[] = []
  // Native allocated-object order is newest first; terrain and RNG effects are noncommutative.
  for (let index = effectCount - 1; index >= 0; index--) {
    const fx = w.effects[index]
    fx.age += dt
    if (fx.corpse) {
      const step = stepReincarnation(fx.corpse.remaining, true, false)
      fx.corpse.remaining = step.remaining
      fx.corpse.phase = step.phase
      fx.height = (fx.corpse.ground + step.height) / 45
      if (!step.remaining) fx.duration = fx.age
    }
    if (fx.turnsRemaining !== undefined && --fx.turnsRemaining === 0) fx.duration = fx.age
    if (fx.kind === 'hypnotise' && fx.turnsRemaining === 11) applyHypnotise(w, fx, fx.team!)
    if (fx.ghostArmy) stepGhostArmy(w, fx)
    if (fx.wave && !stepLiveBlastWave(w, fx.wave)) fx.duration = fx.age
    if (fx.debris && !stepDebrisEffect(w, fx, w)) fx.duration = fx.age
    if (fx.sinking) {
      fx.sinking.counter = (fx.sinking.counter + 1) & 255
      if (!stepSinkingBuilding(w.land, fx.sinking)) fx.duration = fx.age
      moveVisual(fx, fx.sinking)
    }
    if (fx.smoke) {
      if (fx.groundVersion !== w.landVersion) fx.smoke.flags2 |= 4
      fx.groundVersion = w.landVersion
      if (!stepBuildingSmoke(w.land, fx.smoke)) fx.duration = fx.age
      moveVisual(fx, fx.smoke)
    }
    if (fx.animation && 'remaining' in fx.animation) {
      const alive = stepSpellTrail(w.land, fx.animation)
      moveVisual(fx, fx.animation)
      if (!alive) fx.duration = fx.age
    }
    if (fx.flatten) {
      const alive = stepFlatten(w.land, fx.flatten, {
        orbit: (position, sunlight) => {
          const orbit = effect(w, 'trail', browserPosition(position))
          orbit.sprite = { sequence: 'sparkle', frame: 0, fixed: true }
          orbit.height = position.h / 45
          orbit.duration = Infinity
          if (sunlight) registerTerrainLight(w, orbit, 1)
          return orbit.id
        },
        sparkle: position => {
          const sparkle = effect(w, 'trail', browserPosition(position))
          sparkle.sprite = { sequence: 'sparkle', frame: 6 }
          sparkle.height = position.h / 45
          sparkle.duration = 6 / TURNS_PER_SECOND
        },
        move: (id, position) => {
          const orbit = w.effects.find(f => f.id === id)!
          moveVisual(orbit, position)
        },
        remove: id => {
          const orbit = w.effects.find(f => f.id === id)
          if (orbit) orbit.duration = orbit.age
        },
        terrain: cell => {
          queueTerrain(w.land, cell, 6, 1, terrainTextures)
          terrainCenters.push({ cell, radius: 6 })
        },
      })
      if (!alive) fx.duration = fx.age
    }
    if (fx.erosion) {
      const alive = stepErosion(w.land, fx.erosion, w, {
        sound: () => sound(w, 0xa9, fx),
        terrain: cell => {
          queueTerrain(w.land, cell, 6, 1, terrainTextures)
          terrainCenters.push({ cell, radius: 6 })
        },
      })
      if (!alive) fx.duration = fx.age
    }
    if (fx.earthquake) {
      const alive = stepEarthquake(w.land, fx.earthquake, w, {
        sound: cue => sound(w, cue, fx),
        shake: () => {},
        buildings: cell =>
          w.buildings.filter(b => {
            if (b.hp <= 0) return false
            const p = nativePosition(w, b)
            return (((p.x >>> 8) & 254) | (p.y & 0xfe00)) === cell
          }),
        model: buildingModel,
        evacuate: b => evacuateBuilding(w, b),
        damage: b => damageDisasterBuilding(w, b, w.cosmeticRandom),
        spark: position => {
          emitGroundSpark(w, position).remaining = 4
        },
        // Effect models 34/40 are visual-only boundaries until their HFX is imported.
        fissure: () => {},
        terrain: (anchor, radius) => {
          queueTerrain(w.land, anchor, radius, 1, terrainTextures)
          processTerrain(w.land, terrainTextures)
          updateWalkMasks(w.land, anchor, radius)
          notifyHeightChanges(w, [{ cell: anchor, radius }])
          refreshTerrainSurface(w)
        },
      })
      if (!alive) fx.duration = fx.age
    }
    if (fx.convertWild && !stepLiveConvertWild(w, fx)) fx.duration = fx.age
    if (fx.volcano) {
      const cellOf = (p: Point) => {
        const position = nativePosition(w, p)
        return ((position.x >>> 8) & 254) | (position.y & 0xfe00)
      }
      const visible = (position: NativePoint, turns = 4) => {
        const spark = emitGroundSpark(w, position)
        spark.remaining = turns
        w.effects.at(-1)!.team = fx.team
      }
      // ponytail: reuse live fire/trail effects until the downstream native
      // rock, fireball, lava-gloop and camera-shake controllers are recovered.
      const alive = stepVolcano(w.land, fx.volcano, w, {
        sound: cue => sound(w, cue, fx),
        shake: () => {},
        people: cell => w.units.filter(u => u.hp > 0 && u.inside === null && cellOf(u) === cell),
        exempt: u => u.kind === 'shaman' && u.team === fx.team,
        disturb: (u, tribe) => disturbLiveVolcanoPerson(w, u, tribe),
        buildings: cell =>
          w.buildings.filter(
            b => b.hp > 0 && !b.preparation && b.damageState?.state !== 3 && cellOf(b) === cell
          ),
        collapse: b => {
          const state = ensureBuildingDamage(b)
          state.flags2 |= 0x40000000
          if (state.flags2 & 0x100000) return
          state.state = 3
          state.flags2 |= 0x100000
          b.terrainState = { flooded: 0, delay: 2, reason: 1, dirty: false }
        },
        rock: position => visible(position, 8),
        fireball: (position, large) =>
          createFire(w, browserPosition(position), {
            size: large ? 32 : 16,
            snap: false,
            smoke: false,
            turns: large ? 30 : 18,
          }),
        gloop: position => visible(position, 6),
        burst: position => {
          createFire(w, browserPosition(position), {
            size: 32,
            snap: false,
            smoke: true,
            turns: 38,
            light: true,
          })
          visible(position, 10)
        },
        terrain: (cell, radius) => {
          queueTerrain(w.land, cell, radius, 1, terrainTextures)
          terrainCenters.push({ cell, radius })
        },
      })
      if (!alive) fx.duration = fx.age
    }
    if (fx.tornado && !stepLiveTornado(w, fx)) fx.duration = fx.age
    if (fx.swarm && !stepSwarm(w, fx)) fx.duration = fx.age
    if (fx.firestorm) {
      const alive = stepFirestorm(w.land, fx.firestorm, w, shot => {
        const team = fx.firestorm!.tribe === 0 ? 'blue' : 'red'
        w.projectiles.push({
          id: w.nextId++,
          spell: 'firestorm',
          team,
          caster: 0,
          target: browserPosition(shot.target),
          source: browserPosition(shot.origin),
          position: { ...shot.origin },
          destination: { ...shot.target },
          origin: { ...shot.origin },
          phase: 'flying',
          remaining: 1,
          turns: 0,
          visuals: Array.from({ length: 5 }, (_, i) =>
            shotVisual(w, shot.origin, team, 'blastShot', i + 3)
          ),
          fireball: true,
        })
        sound(w, 0xb3, browserPosition(shot.origin))
      })
      if (!alive) fx.duration = fx.age
    }
    if (fx.swamp && !stepLiveSwamp(w, fx.swamp)) fx.duration = fx.age
    if (fx.lightning) {
      if (fx.lightning.turn < 0) {
        fx.lightning.turn = 0
        fx.lightning.seed = w.randomState
        setAnimationObject(fx.animation!, 41, 1361)
        sound(w, 0xa2, fx)
        strikeLiveLightning(w, fx.lightning.target, fx.lightning.tribe)
      } else {
        if (fx.lightning.turn === 0) {
          igniteLightningScenery(w, fx.lightning.target, fx.lightning.tribe)
          const wave = emitBlastWave(
            w,
            browserPosition(fx.lightning.target),
            fx.lightning.tribe === 0 ? 'blue' : 'red',
            true
          )
          wave.scatter = true
        }
        stepLightning(w.land, fx.lightning, w)
      }
    }
    if (fx.bridge) {
      const changed = new Set<number>()
      const alive = stepLandBridge(
        w.land,
        fx.bridge,
        p => {
          const trail = effect(w, 'trail', browserPosition(p))
          trail.sprite = { sequence: 'blastTrail', frame: 0 }
          const animation = createSpellTrail(
            w.land,
            p,
            3,
            (w.effectCounter - 1) & 255,
            w.cosmeticRandom
          )
          animation.remaining = 2
          trail.animation = animation
          trail.height = animation.h / 45
          trail.duration = Infinity
        },
        cell => {
          queueTerrain(w.land, cell, 2, 1, terrainTextures)
          changed.add(cell)
        }
      )
      if (changed.size) {
        processTerrain(w.land, terrainTextures)
        for (const cell of changed) updateWalkMasks(w.land, cell, 3)
        notifyHeightChanges(
          w,
          Array.from(changed, cell => ({ cell, radius: 2 }))
        )
        refreshTerrainSurface(w)
      }
      if (!alive) fx.duration = fx.age
    }
  }
  if (terrainCenters.length) {
    processTerrain(w.land, terrainTextures)
    for (const { cell, radius } of terrainCenters) updateWalkMasks(w.land, cell, radius)
    notifyHeightChanges(w, terrainCenters)
    refreshTerrainSurface(w)
  }
  w.effects = w.effects.filter(f => f.age < f.duration)
  processProjectiles(w)
  for (const message of w.messages.slots) if (message) message.age = (message.age + 1) | 0
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const shrine of w.shrines) {
    if (shrine.kind !== 'vault') stepWorshipHead(shrine)
    if (!shrine.active) continue
    if (shrine.reset) {
      shrine.forced = false
      shrine.followers = 0
    }
    let fired = false
    if (shrine.kind === 'vault') {
      const shaman = w.units.find(u => u.team === 'blue' && isShaman(u) && u.hp > 0)
      // ponytail: native coarse-cell/adjacent-building eligibility awaits the occupancy port.
      const eligible =
        !!shaman &&
        shaman.vault?.head === shrine.id &&
        shaman.lift === 0 &&
        !shaman.fight &&
        !shaman.casting &&
        distance(shaman, shrine) < 3
      if (shrine.enabled && !(w.turn & 3)) shrine.followers = Number(eligible)
      fired = stepVaultWork(shrine, w.turn, eligible, shrine.forced)
      shrine.progress = shrine.target > 0 ? shrine.work / shrine.target : 0
    } else {
      // The trigger still uses world-turn phase until native mixed-class scheduling.
      if (shrine.enabled && !(w.turn & 3))
        shrine.followers = countWorshippers(
          { ...worshipHeadPose(w, shrine), range: shrine.range },
          w.buildingOrders,
          cell => objectsInCell(w.objectCells, cell) as Iterable<LivePerson>
        )[w.manaWorld.playerTribe]
      fired = stepWorship(shrine, w.turn, shrine.followers, shrine.forced)
      shrine.progress = worshipProgress(shrine)
    }
    if (fired) {
      shrine.progress = 0
      shrine.uses++
      createGift(w, shrine.kind, shrine)
      sound(w, 0x70, shrine)
    }
  }
  // First-mission adapter: only Blast recharges; head rewards remain one-off stocks.
  w.manaWorld.turn = w.turn
  w.manaWorld.spells[0].stocks[2] = w.shots.blast
  w.manaWorld.spells[0].disabled = w.charging ? 0 : 2
  w.manaTribes[0].spellProgress[2] = Math.round(w.mana * 1000)
  generateFollowerMana(w.manaWorld, w.manaTribes, manaPeople(w), liveManaOrders)
  for (const team of ['blue', 'red'] as const) {
    const tribe = w.manaTribes[team === 'blue' ? 0 : 1]
    const schools = w.buildings.filter(
      b =>
        b.team === team &&
        (b.kind === 'camp' || b.kind === 'temple') &&
        b.progress === 1 &&
        b.hp > 0
    )
    const buildings = schools.map(b => buildingAdmission(w, b))
    distributeMana(w.manaWorld, tribe, buildings, {
      // 0x499970 only permits its tutorial reminder on original levels 6–10.
      shouldNotifyFull: () => false,
      notify: (flags, message) => requestTutorial(w, flags, message),
    })
    buildings.forEach((b, i) => {
      schools[i].timer = b.storedMana
    })
  }
  w.shots.blast = w.manaWorld.spells[0].stocks[2] & 15
  w.mana = w.manaTribes[0].spellProgress[2] / 1000
  for (const u of w.units)
    if (u.work === null && u.inside === null && u.hp > 0 && u.kind === 'brave')
      harvestAssignedTree(w, u)
  for (const b of w.buildings) {
    if (b.hp <= 0) continue
    b.counter = (b.counter + 1) & 255
    if (b.attackReservation) stepAttackReservation(b.attackReservation, b.counter)
    if (b.damageState) stepBuildingShake(b.damageState, b.counter)
    if (b.admission) stepBuildingEntryClocks(b.admission, b.counter)
    stepBuildingGroundResponse(w, b)
    if (b.hp <= 0 || b.damageState?.state === 3) continue
    if (b.damageState) {
      stepDamagedBuilding(w, b)
      if (b.hp > 0 && b.burn && b.damageState.state === 4) stepBurningBuilding(w, b)
      if (b.hp > 0 && b.burn) dispatchConstructionCrew(w, b, constructionWorkers(w, b))
      if (b.hp <= 0 || b.burn || (b.damageState.buildingFlags & 64 && b.damageState.state !== 2))
        continue
    }
    if (b.preparation) {
      prepareBuildingSite(w, b, constructionWorkers(w, b))
      continue
    }
    const inhabitants = w.units.filter(u => u.inside === b.id && u.hp > 0)
    if (b.progress < 1 || b.builders?.some(Boolean)) {
      const wasIncomplete = b.progress < 1
      const workers = constructionWorkers(w, b)
      dispatchConstructionCrew(w, b, workers)
      if (wasIncomplete && b.progress === 1) {
        completeBuildingConstruction(w, b)
      }
      if (wasIncomplete) continue
    }
    if (b.kind === 'camp' || b.kind === 'temple') {
      stepLiveTraining(w, b)
    } else if (b.kind === 'hut') {
      const admission = buildingAdmission(w, b)
      if (
        !(w.manaWorld.gameFlags & 32) &&
        stepHutBirth(
          b,
          admission.inside,
          population(w, b.team) < populationLimit(w, b.team),
          breedingWork(w, b)
        )
      ) {
        const points = hutBirthPoints(buildingPose(b), point => {
          const cell = (point.y >> 9) * 128 + (point.x >> 9)
          if (!(w.land.flags[cell] & 512)) return
          const neighbor = w.buildings.find(other => other.id === (w.land.buildingIds[cell] & 1023))
          return neighbor && buildingPose(neighbor)
        })
        const u = addUnit(w, b.team, 'brave', browserPosition(points.inside))
        u.heading = Math.PI - b.angle
        if (b.team === 'blue') sound(w, 0x28, u)
        effect(w, 'birth', browserPosition(points.flash))
        // ponytail: native newborn home/state ownership still uses the live route adapter.
        route(w, u, browserPosition(points.destination))
      }
      const haulers = w.units.filter(
        u => u.work === b.id && u.inside === null && u.hp > 0 && u.kind === 'brave' && !u.builder
      )
      haulBuildingWood(w, b, haulers)
      const upgrade =
        !(w.manaWorld.gameFlags & 32) &&
        stepHutUpgrade(b, inhabitants.length, () =>
          Math.max(0, rules.buildingLife[b.level + 1] - entranceWood(w, b))
        )
      if (upgrade === 'fetch') {
        const u = inhabitants.find(u => u.kind === 'brave' && !u.fight && !u.casting)
        if (u) {
          const tree = findBuildingWood(w, u, b)
          if (tree) {
            release(w, u)
            u.work = b.id
            u.tree = tree.id
            route(w, u, tree)
          } else b.woodUnavailable = true
        }
      } else if (upgrade === 'upgrade') {
        b.upgrade = 0
        // 0x4050c0 retains the family and starts its replacement plan with 100 work.
        b.object = buildingObject(b) + 1
        b.level++
        Object.assign(b, browserPosition(buildingPosition(buildingPose(b))))
        b.damageState = null
        b.builders = undefined
        b.progress = 100 / rules.buildingLife[b.level]
        b.logs = 1
        b.timer = 0
        b.upgrading = true
        for (const u of inhabitants) {
          release(w, u)
          u.work = u.kind === 'brave' ? b.id : null
        }
      }
    }
  }

  processBattles(w)
  const contacts: [Unit, Unit][] = []
  const burningPeople = w.units
    .filter(u => u.burnTrail && u.hp > 0)
    .map(u => ({
      unit: u,
      previous: u.flight ? { x: u.flight.x, y: u.flight.y, h: u.flight.h } : nativePosition(w, u),
    }))
  syncLandscapeObjects(w)
  for (const u of w.units) {
    if (u.attackReservation) stepAttackReservation(u.attackReservation, w.turn)
    u.fighting = false
    if (u.native?.state === 44) {
      stepLiveElectrocution(w, u)
      continue
    }
    if (u.native?.state === 24) {
      stepLiveTornadoPerson(w, u)
      continue
    }
    if (u.flight) {
      stepLiveImpulse(w, u)
      continue
    }
    if (u.hp <= 0) continue
    if (u.native?.state === 14) continue
    const recovering = u.native ?? u.entry?.person
    if (recovering?.state === 33) {
      stepLivePhysics(w, u, recovering)
      continue
    }
    u.cooldown = Math.max(0, u.cooldown - dt)
    if (u.native?.state === 41 || u.native?.state === 26 || u.native?.state === 31) {
      stepLivePerson(w, u)
      continue
    }
    if (!supportsFollower(w, u)) {
      u.hp = 0
      continue
    }
    if (u.native?.state === 23) {
      stepLiveConversionVictim(w, u)
      continue
    }
    if (
      u.inside !== null &&
      !w.buildings.some(building => building.id === u.inside && building.hp > 0)
    ) {
      release(w, u)
      u.hp -= 10
    }
    if (
      u.native &&
      [17, 31, 32].includes(currentPersonOrder(w.buildingOrders, u.native)?.model ?? 0)
    ) {
      stepLivePreaching(w, u)
      continue
    }
    if (u.fight) {
      if (u.fight.motion) stepLiveMeleeMotion(w, u)
      continue
    }
    if (u.native && [25, 29].includes(u.native.state)) {
      stepLivePhysics(w, u, u.native)
      continue
    }
    if (
      u.native &&
      [11, 19, 21].includes(currentPersonOrder(w.buildingOrders, u.native)?.model ?? 0)
    ) {
      stepLiveBuildingAttack(w, u)
      continue
    }
    const castingState = u.native?.state === 22
    if (castingState) {
      u.native!.timer = short(u.native!.timer - 1)
      if (u.native!.timer < 1)
        changeLivePersonState(w, u, defaultPersonState(u.native!, w.manaWorld.gameFlags))
    }
    if (u.casting) {
      u.casting.remaining -= dt
      if (u.casting.remaining <= 1e-8) u.casting = null
      continue
    }
    if (castingState) continue
    const work =
      w.buildings.find(b => b.id === u.work && b.hp > 0) ??
      w.shrines.find(s => s.id === u.work && (s.active || u.vault?.head === s.id))
    let delivery = u.delivery
      ? w.buildings.find(b => b.id === u.delivery!.target && needsDirectTimber(w, u, b))
      : undefined
    if (u.delivery && !delivery) {
      u.delivery = undefined
      u.path = []
      delivery = directTimberDestination(w, u)
      if (delivery && route(w, u, entrance(w, delivery)).length) {
        u.delivery = { target: delivery.id }
      }
    }
    if (u.entry && u.inside === null && !work) {
      stepBuildingEntry(w, u)
      continue
    }
    if (
      u.builder?.person &&
      (currentPersonOrder(w.buildingOrders, u.builder.person)?.flags ?? 0) & 1
    )
      finishQueuedConstruction(w, u)
    if (u.work !== null && !work && !finishQueuedConstruction(w, u)) release(w, u)
    if (isDismantling(w, u) && work && 'hp' in work) {
      if (startLiveCombatResponse(w, u)) {
        stepLiveBuildingAttack(w, u)
        continue
      }
      stepBuildingEntry(w, u, work)
      continue
    }
    if (u.inside !== null) {
      const b = w.buildings.find(b => b.id === u.inside && b.hp > 0)
      if (b) {
        if ((b.kind === 'camp' || b.kind === 'tower' || b.kind === 'temple') && u.entry)
          stepBuildingEntry(w, u, b)
        continue
      }
      release(w, u)
      u.hp -= 10
    }
    if (
      work &&
      'hp' in work &&
      (work.kind === 'hut' ||
        work.kind === 'camp' ||
        work.kind === 'tower' ||
        work.kind === 'temple' ||
        !!((work.admission?.activity ?? 0) & 0x8000)) &&
      (work.progress === 1 || !!((work.admission?.activity ?? 0) & 0x8000)) &&
      !work.burn &&
      !u.builder &&
      u.tree === null &&
      !u.harvest &&
      !u.delivery
    ) {
      stepBuildingEntry(w, u, work)
      continue
    }
    // An unavailable hut hands control back to the existing work controller.
    cancelBuildingEntry(w, u)
    if (u.delivery && delivery && !u.path.length) {
      if (!atBuildingEntrance(w, u, delivery)) route(w, u, entrance(w, delivery))
      else {
        const p = u.native ?? createLivePerson(w, u)
        Object.assign(p, nativePosition(w, u))
        p.cargo = Math.round(u.cargo * 100)
        u.native = p
        registerLivePerson(w, p)
        dropCarriedTimber(
          p,
          () => {
            w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
            return true
          },
          () => sound(w, 11, u)
        )
        u.cargo = p.cargo / 100
        u.delivery = undefined
      }
    }
    const activeOrder = u.native && currentPersonOrder(w.buildingOrders, u.native)
    if (
      u.target === null &&
      activeOrder?.model === 28 &&
      nativePersonTribe(u) === w.manaWorld.playerTribe
    ) {
      const enemy = w.units.find(
        target =>
          target.id === activeOrder.a && target.hp > 0 && target.inside === null && !target.lift
      )
      u.target = enemy?.id ?? null
      if (enemy) route(w, u, enemy, true)
    }
    let target: Unit | Building | undefined =
      u.target === null
        ? undefined
        : [...w.units, ...w.buildings].find(t => t.id === u.target && t.hp > 0)
    if (target && !('progress' in target) && (target.lift > 0 || target.inside !== null))
      target = undefined
    if (!target) {
      cancelLiveBuildingAttack(w, u)
      u.target = null
      if (startLiveCombatResponse(w, u)) {
        stepLiveBuildingAttack(w, u)
        continue
      }
    }
    if (target && 'progress' in target && target.progress === 1) {
      stepLiveBuildingAttack(w, u, target)
      continue
    }
    const targetDistance = target ? distance(u, target) : Infinity
    const reach = target && 'progress' in target ? 4.3 : 1.7
    if (target) {
      // 0x51a2a0 raises quiet music to activity without overriding battle music.
      // ponytail: target ownership remains the live attack adapter until the
      // shared native command controller is integrated.
      if (!w.musicActivity && nativePersonTribe(u) === w.manaWorld.playerTribe) w.musicActivity = 1
      u.heading = Math.atan2(target.x - u.x, target.z - u.z)
      if (u.target === null && u.work === null) {
        u.target = target.id
        if (targetDistance >= reach) route(w, u, target)
      } else if (
        !('progress' in target) &&
        u.target === target.id &&
        u.work === null &&
        targetDistance >= reach
      ) {
        const planned = w.pathfinding.people.get(u.id)
        if (planned && pursuitDestinationChanged(planned, nativePosition(w, target), 224))
          route(w, u, target)
      }
    }
    if (target && targetDistance < reach) {
      if ('progress' in target) {
        u.fighting = true
        if (!u.cooldown) {
          if (!u.ghost) target.hp -= meleeDamage(u)
          u.cooldown = (u.kind === 'shaman' ? 4 : 6) / TURNS_PER_SECOND
          if (!u.ghost) effect(w, 'hit', target)
        }
      } else contacts.push([u, target])
      continue
    }
    if (u.guard && !u.path.length) {
      const shaman = w.units.find(a => a.team === u.team && isShaman(a))
      if (shaman && distance(u, shaman) > 3) route(w, u, entrance(w, shaman, 2))
    }
    if (builderActivity(u) && work && 'hp' in work) processBuilderWork(w, u, work)
    if (
      u.native &&
      ([3, 6, 27, 30, 33].includes(activeOrder?.model ?? 0) ||
        (activeOrder?.model === 28 && nativePersonTribe(u) === w.manaWorld.playerTribe && !target))
    ) {
      stepLiveMovement(w, u, {
        28: order => {
          const enemy = w.units.find(
            target =>
              target.id === order.a && target.hp > 0 && target.inside === null && !target.lift
          )
          u.target = enemy?.id ?? null
          return Number(!enemy)
        },
        33: () => processVaultTask(w, u),
      })
    } else if (
      u.team !== 'wild' &&
      !work &&
      !target &&
      !u.guard &&
      // ponytail: hold direct gatherers at their source until the native no-following tail is evidenced.
      u.tree === null &&
      !u.harvest &&
      !u.delivery &&
      (!u.path.length || (u.native && [1, 17, 19].includes(u.native.state)))
    ) {
      stepLiveResting(w, u)
    } else if (u.path.length) {
      const next = u.path[0],
        length = builderActivity(u) ? (u.builder?.person?.speed ?? unitSpeed(u)) : unitSpeed(u)
      if (!supportsFollower(w, next)) {
        clearLivePath(w, u)
        continue
      }
      const dx = Math.round(next.x * 256) - Math.round(u.x * 256),
        dz = Math.round(next.z * 256) - Math.round(u.z * 256),
        angle = nativeAngle(dx, dz)
      if (dx || dz) {
        u.heading = Math.PI - (angle * Math.PI) / 1024
        if (u.builder?.person) u.builder.person.heading = u.builder.person.angle = angle
      }
      const p =
        Math.hypot(dx, dz) <= length
          ? { x: Math.round(next.x * 256) / 256, z: Math.round(next.z * 256) / 256 }
          : nativeStep(u, angle, length)
      if (!supportsFollower(w, p)) {
        clearLivePath(w, u)
        continue
      }
      u.x = p.x
      u.z = p.z
      if (Math.hypot(dx, dz) <= length) u.path.shift()
      stepLiveRoute(w, u)
    } else if (
      (u.builder?.task === BuilderTask.Leave ||
        (u.builder?.task === BuilderTask.ClearScenery &&
          u.builder.phase === SceneryPhase.Retreat)) &&
      u.builder.person?.speed
    ) {
      const p = nativeStep(u, u.builder.person.heading, u.builder.person.speed)
      if (supportsFollower(w, p)) Object.assign(u, p)
    } else if (target && u.target !== null)
      route(w, u, 'progress' in target ? entrance(w, target) : target)
    else if (work && u.tree === null && !builderActivity(u))
      u.heading = Math.atan2(work.x - u.x, work.z - u.z)
    if (
      u.kind === 'brave' &&
      !u.path.length &&
      u.work === null &&
      u.target === null &&
      u.tree === null &&
      !u.guard
    ) {
      u.idleTurns++
      if (u.idleTurns > 16 && (w.turn & 15) === 0) {
        const hut = w.buildings
          .filter(
            b =>
              b.team === u.team &&
              b.kind === 'hut' &&
              b.hp > 0 &&
              b.progress === 1 &&
              !b.burn &&
              distance(u, b) < 8 &&
              w.units.filter(a => a.work === b.id || a.inside === b.id).length < housing(b)
          )
          .sort((a, b) => distance(a, u) - distance(b, u))[0]
        if (hut) {
          const path = route(w, u, entrance(w, hut))
          if (path.length) u.work = hut.id
        }
      }
    } else u.idleTurns = 0
  }
  for (const { unit: u, previous } of burningPeople) {
    if (u.hp <= 0 && !u.flight) continue
    const person = { ...(u.flight ?? nativePosition(w, u)), burnTrail: u.burnTrail! }
    stepPersonFireTrail(
      person,
      {
        x: short(person.x - previous.x),
        y: short(person.y - previous.y),
        h: short(person.h - previous.h),
      },
      (model, point) => {
        const fx = effect(w, 'trail', browserPosition(point))
        const trail = createSpellTrail(
          w.land,
          point,
          model,
          (w.effectCounter - 1) & 255,
          w.cosmeticRandom
        )
        fx.animation = trail
        fx.sprite = { sequence: model === 3 ? 'blastTrail' : 'blastShot', frame: 0 }
        fx.duration = Infinity
        moveVisual(fx, trail)
        return trail
      }
    )
    u.burnTrail = person.burnTrail
    if (u.native) u.native.burnTrail = u.burnTrail
    if (u.flight) u.flight.burnTrail = u.burnTrail
  }
  for (const [u, target] of contacts.sort((a, b) => a[0].id - b[0].id))
    if (
      u.hp > 0 &&
      target.hp > 0 &&
      u.inside === null &&
      target.inside === null &&
      u.lift === 0 &&
      target.lift === 0 &&
      distance(u, target) < 1.7 &&
      !u.fight &&
      !u.casting &&
      !target.casting
    )
      joinBattle(w, u, target)
  const dead = w.units.filter(u => u.hp <= 0 && !u.flight && u.native?.state !== 44),
    ordinaryDead = dead.filter(u => !u.ghost)
  for (const u of ordinaryDead) restoreDeadHypnotisedUnit(u)
  for (const u of ordinaryDead) {
    const victim = u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1,
      person = u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person,
      attacker = person?.damageAttacker ?? 255
    if (victim >= 0 && attacker >= 0 && attacker < 4)
      w.killCredits[attacker][victim] = (w.killCredits[attacker][victim] + 1) & 65535
  }
  for (const u of ordinaryDead.filter(u => u.kind === 'shaman'))
    if (
      w.units.some(a => a.team === u.team && !a.ghost && a.hp > 0) &&
      (u.team === 'blue' || (u.team === 'red' && w.ai.reincarnation))
    ) {
      const turns = reincarnationTurns(!supportsFollower(w, u)),
        key = u.team === 'blue' ? 'respawn' : 'redRespawn',
        pointKey = u.team === 'blue' ? 'respawnPoint' : 'redRespawnPoint',
        position = nativePosition(w, u),
        visual = effect(w, 'reincarnation', u)
      w[key] = turns / TURNS_PER_SECOND
      w[pointKey] = { x: u.x, z: u.z }
      visual.duration = Infinity
      visual.height = position.h / 45
      visual.reincarnation = { team: u.team, phase: turns === 333 ? 3 : 0, ground: position.h }
      if (u.team === 'blue') tell(w, 'Your shaman will reincarnate.')
    }
  for (const u of ordinaryDead) {
    cancelLiveResting(w, u)
    const f = effect(w, supportsFollower(w, u) ? 'death' : 'splash', u)
    if (f.kind === 'death') {
      f.unit = { team: u.team, kind: u.kind, heading: u.heading }
      if (u.kind !== 'shaman') {
        const position = nativePosition(w, u)
        f.duration = Infinity
        f.height = position.h / 45
        f.corpse = { remaining: reincarnationTurns(false), phase: 0, ground: position.h }
      }
    }
  }
  for (const b of w.buildings.filter(b => b.hp <= 0)) {
    invalidateBuildingTimberSearch(w, b)
    markBuildingTerritory(
      w.land,
      { ...nativePosition(w, b), tribe: b.team === 'blue' ? 0 : 1 },
      b.team === 'blue' ? 11 : w.ai.defenceRadius,
      true
    )
    if (!b.terrainState?.reason && !b.dismantled) effect(w, 'death', b)
  }
  // Native person epilogue decrements the arrival-voice cooldown after its state body.
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person
    if (p?.marchCooldown) p.marchCooldown--
  }
  // Audio admission follows simulation time, independent of display refresh.
  announceCombatMarches(w.combatMarches, (id, cue) => {
    const unit = w.units.find(u => u.id === id)
    if (unit) sound(w, cue, unit, id)
  })
  removeDeadLiveRoutes(w)
  for (const u of w.units)
    if (u.hp <= 0 && !u.flight && u.native?.state !== 44) {
      if (u.inside !== null) leaveLiveBuilding(w, u)
      cancelLiveBuildingAttack(w, u)
      cancelLiveOrder(w, u)
      cancelBuildingEntry(w, u)
    }
  w.units = w.units.filter(u => u.hp > 0 || u.flight || u.native?.state === 44)
  w.buildings = w.buildings.filter(b => b.hp > 0)
  w.selected = w.selected.filter(id => w.units.some(u => u.id === id))
  syncLivePersonCells(w)
  syncLandscapeObjects(w)
  cleanBattles(w)
  for (const team of ['blue', 'red'] as const) {
    const key = team === 'blue' ? 'respawn' : 'redRespawn',
      pointKey = team === 'blue' ? 'respawnPoint' : 'redRespawnPoint'
    if (w[key] > 0) {
      const site = team === 'blue' ? HOME : ENEMY,
        visual = w.effects.find(f => f.reincarnation?.team === team),
        canSpawn =
          w.units.some(u => u.team === team && !u.ghost) &&
          !w.units.some(u => u.team === team && isShaman(u)),
        step = stepReincarnation(
          Math.round(w[key] * TURNS_PER_SECOND),
          canSpawn,
          !supportsFollower(w, w[pointKey] ?? site)
        )
      w[key] = step.remaining / TURNS_PER_SECOND
      if (visual?.reincarnation) {
        visual.reincarnation.phase = step.phase
        visual.height = (visual.reincarnation.ground + step.height) / 45
      }
      if (step.event === 'splash') effect(w, 'splash', w[pointKey] ?? site)
      else if (step.event === 'rise') effect(w, 'birth', site)
      else if (step.event === 'spawn') {
        const u = addUnit(w, team, 'shaman', team === 'blue' ? HOME : ENEMY)
        if ((team === 'blue' ? 0 : 1) === w.manaWorld.playerTribe) sound(w, 0x6b, site)
        if (team === 'blue' && !w.selected.length) w.selected = [u.id]
        if (visual) visual.duration = visual.age
      }
      if (!w[key]) delete w[pointKey]
    }
  }
  refreshTerrainLights(w) // 0x4ec6f0: lighting follows the completed object turn.
  ageFailedRoutes(w.motionRoutes) // 0x4ec6f0: after object and terrain work.
  // The result overlay remains while followers continue their native celebration.
  // Full progression presentation is still being reconstructed.
  if (w.land.landFlags & 0x2000000) {
    w.redRespawn = 0
    delete w.redRespawnPoint
    const visual = w.effects.find(f => f.reincarnation?.team === 'red')
    if (visual) visual.duration = visual.age
    w.status = 'won'
  }
  if (w.land.landFlags & 0x4000000) {
    w.respawn = 0
    delete w.respawnPoint
    const visual = w.effects.find(f => f.reincarnation?.team === 'blue')
    if (visual) visual.duration = visual.age
    w.status = 'lost'
  }
  w.effects = w.effects.filter(f => f.age < f.duration)
}
