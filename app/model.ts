import {
  changedBuildingGround,
  damageDisasterBuilding,
  damageTornadoTree,
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
  placementError,
  groundBuilding,
  buildingContainsPoint,
  buildingBlocksStep,
  addBuilding,
  buildingPlanPose,
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
  headAt,
  campaignInternal,
  campaignPersonCount,
  campaignPeopleInMarker,
  campaignAttackTarget,
  forceHead,
  campaignPosition,
  campaignTribe,
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
import { campaignCommand, campaignRules } from './campaign-command-runtime.ts'
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
  shotVisual,
  moveVisual,
  emitGroundSpark,
  stepDebrisEffect,
  createFire,
  depleteTree,
  stepScenery,
  registerTerrainLight,
  refreshTerrainLights,
} from './world-effects.ts'
export { sound, effect, emitGroundSpark } from './world-effects.ts'
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
} from './world-terrain-runtime.ts'
export {
  nativePosition,
  buildingStage,
  syncLandscapeObjects,
  makeTerrain,
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
  createWorldState,
} from './world-state.ts'
export {
  housing,
  population,
  populationLimit,
  breedingWork,
  trainingCost,
  addUnit,
} from './world-state.ts'
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
import { worshipHeadPose } from './live-worship.ts'
import {
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
import { announceCombatMarches, type CombatMarch } from './combat-order-search.ts'
import {
  stepLiveBuildingAttack,
  cancelLiveBuildingAttack,
  startLiveCombatResponse,
} from './live-building-combat.ts'
import { nativePersonModel, nativePersonTribe } from './live-combat.ts'
import { buildingDoor, entrance, route, tell } from './live-command.ts'
export { cast, command, entrance, spellTargetError, tell, walkable } from './live-command.ts'
import { pursuitDestinationChanged } from './person-routes.ts'
import { stepAttackReservation, type AttackReservation } from './combat-targets.ts'
import {
  currentPersonOrder,
  emptyPersonOrder,
  allocatePersonOrder,
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
import { BuilderTask } from './building-workers.ts'
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
import {
  personStepCollision,
  restingCellCollision,
  terrainSupportsPerson,
} from './person-collision.ts'
import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import { createSpellTrail, stepSpellTrail, type SpellTrail } from './spell-trails.ts'
import { createBuildingSmoke, stepBuildingSmoke, type BuildingSmoke } from './building-smoke.ts'
import { collapseBuildingFaces } from './building-debris.ts'
import modelAssets from './original-models.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'
import { stepLightning, type Lightning } from './lightning.ts'
import { createLandBridge, stepLandBridge, type LandBridge } from './land-bridge.ts'
import { stepFlatten, type Flatten } from './flatten.ts'
import { stepErosion, type Erosion } from './erosion.ts'
import { stepSwamp, type Swamp, type SwampTarget } from './swamp.ts'
import { stepFirestorm, type Firestorm } from './firestorm.ts'
import { stepEarthquake, type Earthquake } from './earthquake.ts'
import { stepVolcano, type Volcano } from './volcano.ts'
import { stepConvertWild, type ConvertWild } from './convert-wild.ts'
import {
  stepTornado,
  stepTornadoPerson,
  type Tornado,
  type TornadoBuilding,
  type TornadoPerson,
  type TornadoScenery,
} from './tornado.ts'
import {
  findLivePath,
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
  defeatTribe,
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
  generatedMana,
  generateFollowerMana,
  type ManaWorld,
  type ManaTribe,
} from './mana.ts'
export { nativeAngle, nativeStep, random } from './native-math.ts'
import {
  createTribeCasting,
  stepComputerCastCooldown,
  type TribeCasting,
} from './spell-casting.ts'
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
import { missionData } from './mission-data.ts'
import {
  createWorship,
  stepWorship,
  stepWorshipHead,
  countWorshippers,
  worshipProgress,
  type WorshipState,
} from './worship.ts'
import type { ModelMorph } from './morph.ts'
import { stepVaultWork, stepVaultTask, type VaultTask } from './vault.ts'
import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { unitKindFromModel, type UnitKind } from './unit-kinds.ts'

export type { UnitKind } from './unit-kinds.ts'
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

export { nativeTerrainCross } from './native-math.ts'
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
export function createWorld(missionNumber = 1): World {
  const mission = missionData(missionNumber),
    level = mission.level,
    w = createWorldState(missionNumber)
  for (const o of level.objects) {
    if (o.type === 2 && o.owner !== 255) {
      const kind =
        o.model === 4 ? 'tower' : o.model === 5 ? 'temple' : o.model === 7 ? 'camp' : 'hut'
      addBuilding(w, o.owner === 0 ? 'blue' : 'red', kind, o, true, {
        level: kind === 'hut' ? o.model : 1,
        angle: (o.angle / 2048) * Math.PI * 2,
      })
    }
    if (o.type === 1)
      addUnit(
        w,
        o.owner === 255 && missionNumber === 2 && distance(o, campaignPosition(w, 'blue')) < 6
          ? 'blue'
          : o.owner === 255
            ? 'wild'
            : o.owner === 0
              ? 'blue'
              : 'red',
        unitKindFromModel(o.model),
        o
      )
    if (o.type === 5 && o.model <= 6)
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      const settings = o.settings!,
        linked = level.objects.find(r => r.index + 1 === (settings[6] | (settings[7] << 8))),
        reward = linked?.settings,
        bridgeTarget = linked && 'target' in linked ? (linked.target as Point) : undefined
      const rewardSpell =
          reward?.[0] === 11 ? SPELLS.find(spell => spell.model === reward[1])?.id : undefined,
        kind =
          settings[0] === 4
            ? 'vault'
            : linked?.type === 7 && linked.model === 24 && bridgeTarget
              ? 'bridgeEffect'
              : reward?.[0] === 11 && reward[1] === 3
                ? 'lightning'
                : reward?.[0] === 11 && reward[1] === 4
                  ? 'tornado'
                  : reward?.[0] === 11 && reward[1] === 12
                    ? 'bridge'
                    : null
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const shrineReward =
        kind === 'vault'
          ? reward?.[0] === 2 && reward[1] === 7
            ? 'camp'
            : rewardSpell
          : kind === 'bridgeEffect'
            ? undefined
            : kind
      if (kind !== 'bridgeEffect' && !shrineReward)
        throw new Error(`Unbound shrine gift ${o.index}`)
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
        reward: shrineReward,
        ...(kind === 'bridgeEffect' ? { bridgeTarget } : {}),
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridge'
              ? 'Land Bridge stone head'
              : kind === 'bridgeEffect'
                ? 'Land raising stone head'
                : kind === 'tornado'
                  ? 'Tornado stone head'
                  : 'Lightning stone head',
        progress: 0,
        duration: (worship.target * 4) / TURNS_PER_SECOND,
        uses: 0,
      })
    }
  }
  w.ai.pendingCommands = w.ai.pendingCommands.filter(c => {
    if (
      ![1038, 1069, 1081, 1091, 1092, 1095, 1097, 1108, 1109, 1112, 1117, 1196, 1204].includes(
        c.opcode
      )
    )
      return true
    campaignCommand(w, c.opcode, c.args)
    return false
  })
  w.selected = [w.units.find(u => u.team === 'blue' && isShaman(u))!.id]
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, campaignPosition(w, 'blue'))
  return w
}
export function requestTutorial(w: World, flags: number, message: number) {
  // 0x499f40 mode 9: a single transient tooltip, not tutorial history.
  if (flags === 0x200000 && message === 603)
    w.routeNotice = { flags, message, serial: (w.routeNotice?.serial ?? 0) + 1 }
}
export function createGift(w: World, reward: Gift['reward'], p: Point) {
  const gift = effect(w, 'gift', p) as Gift
  Object.assign(gift, {
    reward,
    remaining: 82,
    phase: 6,
    frame:
      reward === 'camp' || reward === 'vault'
        ? 1077
        : 1056 + SPELLS.find(spell => spell.id === reward)!.model,
    height: (terrainPointHeight(w.land, nativePosition(w, p)) + 800) / 45,
    duration: Infinity,
  })
  w.gifts.push(gift)
  return gift
}
export { buildingModel } from './building-shapes.ts'

// Native slots retain registration order. Browser work orders supply eligibility
// until the complete native person/plan command ownership is connected.

function completeBuildingConstruction(w: World, b: Building) {
  if (!b.upgrading && !b.damageState) w.stats.built++
  b.upgrading = false
  if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  tell(w, `${BUILDINGS.find(s => s.id === b.kind)!.name} completed.`)
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
        const tree = w.trees.find(tree => tree.id === id)
        if (tree) reserveTimber(tree, Math.round(tree.logs * 100))
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
          if (amount) releaseTimberReservation(tree)
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
          if (amount) releaseTimberReservation(tree)
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
  defeatTribe(
    context,
    id,
    w.castingTribes[id].flags,
    nativePosition(w, campaignPosition(w, id === 0 ? 'blue' : 'red')),
    {
      // Tribe-death sky objects and reveal/camera effects need their native consumers.
      allocate: () => {},
      reveal: () => {},
      remove: () => {},
    }
  )
  w.outcome.skyCounter = context.skyCounter
  for (const p of units)
    if (p.tribe === id) {
      const state = ensureBuildingDamage(p.building)
      state.buildingFlags = p.buildingFlags
      state.damage = p.damage
    }
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
  return w.units.map(u => {
    const tribe = u.team === 'red' ? campaignTribe(w) : (u.native?.tribe ?? 0)
    return {
      ...(u.native ?? {
        class: 1,
        model: nativePersonModel(u),
        state: 10,
        flags2: u.inside !== null ? 0x800000 : 0,
        flags4: u.hp > 0 ? 0x20000000 : 0,
        assignment: 0,
        commandStatus: u.work !== null || u.path.length > 0 || u.target !== null || u.guard ? 1 : 0,
        commands: [],
        commandCursor: 0,
        immediateCommand: 0,
      }),
      tribe,
    }
  })
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
        flags4: tree.flags4 ?? 0,
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
function harvestAssignedTree(w: World, u: Unit, destination?: Point, queued = false) {
  if (u.tree === null || u.cargo || u.fight || u.native?.immediateCommand) return false
  const tree = w.trees.find(t => t.id === u.tree)
  if (!tree) {
    u.tree = null
    u.harvest = undefined
    return true
  }
  if (u.path.length) return false
  if (distance(u, tree) >= 1) {
    route(w, u, tree)
    return false
  }
  if (!u.harvest) {
    u.harvest = startTimberHarvest(2, tree.model)
    sound(w, 1, u)
  }
  if (!stepTimberHarvest(u.harvest)) {
    if (tree.model === 11) sound(w, 10, u)
    return false
  }
  const wood = timberTransfer(
    Math.round(tree.logs * 100),
    Math.round(u.cargo * 100),
    rules.personWood[2],
    rules.personWood[2]
  )
  if (wood) releaseTimberReservation(tree)
  tree.logs -= wood / 100
  if (wood && tree.logs < 1)
    depleteTree(w, tree, w.manaTribes[u.team === 'blue' ? 0 : 1].playerType === 1)
  u.cargo += wood / 100
  if (!destination && u.native) u.native.cargo = Math.round(u.cargo * 100)
  u.harvest = undefined
  if (destination) route(w, u, destination)
  else {
    u.tree = null
    if (queued) return true
    const building = directTimberDestination(w, u)
    if (building && route(w, u, entrance(w, building)).length) {
      u.delivery = { target: building.id }
    }
  }
  return true
}

function stepQueuedTreeOrder(w: World, u: Unit, order: { a: number; b: number }) {
  if (u.cargo) return 1
  if (u.tree === null) {
    // Native command 7 stores the coarse-cell center, then resolves scenery later.
    const tree = w.trees.findLast(t => {
      const point = nativePosition(w, t)
      return (
        t.logs > 0 &&
        t.model >= 1 &&
        t.model <= 6 &&
        (point.x & 0xff00) + 128 === order.a &&
        (point.y & 0xff00) + 128 === order.b
      )
    })
    if (!tree) return 1
    u.tree = tree.id
  }
  return Number(harvestAssignedTree(w, u, undefined, true))
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

// Browser positions may differ by a map period; native movement uses signed-short displacement.
function wrappedPlanarDelta(a: Point, b: Point) {
  return {
    x: short(Math.round(b.x * 256) - Math.round(a.x * 256)),
    z: short(Math.round(b.z * 256) - Math.round(a.z * 256)),
  }
}
function wrappedDistance(a: Point, b: Point) {
  const { x, z } = wrappedPlanarDelta(a, b)
  return Math.hypot(x, z) / 256
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
          if (id !== campaignTribe(w)) throw new Error(`Unimplemented campaign tribe ${id}`)
          stepComputerCastCooldown(w.castingTribes[id], w.ai.flags)
          campaignRules(w)
          stepComputerTasks(w, id)
          stepComputerSpells(w, id)
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
    if (gift.reward === 'camp' || gift.reward === 'vault') {
      w.unlockedCamp = true
      tell(w, 'Knowledge discovered: build a Warrior Training Hut, then send braves inside.')
    } else {
      // 0x4c2cd0: stocks already at/above the cap are unchanged.
      if (w.shots[gift.reward] < 4) w.shots[gift.reward]++
      // 0x4c2aa0: the separate gift counter increases even at full stock.
      w.giftCounts[gift.reward] = Math.min(15, w.giftCounts[gift.reward] + 1)
      tell(
        w,
        `${SPELLS.find(spell => spell.id === gift.reward)!.name} received. ${w.shots[gift.reward]} shots ready.`
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
      if (shrine.kind === 'bridgeEffect') {
        const bridge = effect(w, 'bridge', shrine)
        bridge.bridge = createLandBridge(
          nativePosition(w, shrine),
          nativePosition(w, shrine.bridgeTarget!)
        )
        bridge.team = 'blue'
        bridge.duration = Infinity
        w.stats.bridges++
      } else createGift(w, shrine.reward!, shrine)
      sound(w, 0x70, shrine)
    }
  }
  // First-mission adapter: only Blast recharges; head rewards remain one-off stocks.
  w.manaWorld.turn = w.turn
  w.manaWorld.spells[0].stocks[2] = w.shots.blast
  w.manaWorld.spells[0].disabled = w.charging ? 0 : 2
  w.manaTribes[0].spellProgress[2] = Math.round(w.mana * 1000)
  generateFollowerMana(w.manaWorld, w.manaTribes, manaPeople(w), liveManaOrders)
  for (const [team, tribeId] of [
    ['blue', 0],
    ['red', campaignTribe(w)],
  ] as const) {
    const tribe = w.manaTribes[tribeId]
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
    if (
      u.work === null &&
      u.inside === null &&
      u.hp > 0 &&
      u.kind === 'brave' &&
      (!u.native || currentPersonOrder(w.buildingOrders, u.native)?.model !== 7)
    )
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
    const targetDelta = target && !('progress' in target) ? wrappedPlanarDelta(u, target) : null
    const targetDistance = target
      ? targetDelta
        ? Math.hypot(targetDelta.x, targetDelta.z) / 256
        : distance(u, target)
      : Infinity
    const reach = target && 'progress' in target ? 4.3 : 1.7
    if (target) {
      // 0x51a2a0 raises quiet music to activity without overriding battle music.
      // ponytail: target ownership remains the live attack adapter until the
      // shared native command controller is integrated.
      if (!w.musicActivity && nativePersonTribe(u) === w.manaWorld.playerTribe) w.musicActivity = 1
      u.heading = targetDelta
        ? Math.atan2(targetDelta.x, targetDelta.z)
        : Math.atan2(target.x - u.x, target.z - u.z)
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
      ([3, 6, 7, 27, 30, 33].includes(activeOrder?.model ?? 0) ||
        (activeOrder?.model === 28 && nativePersonTribe(u) === w.manaWorld.playerTribe && !target))
    ) {
      stepLiveMovement(w, u, {
        7: order => stepQueuedTreeOrder(w, u, order),
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
      const { x: dx, z: dz } = wrappedPlanarDelta(u, next),
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
      wrappedDistance(u, target) < 1.7 &&
      !u.fight &&
      !u.casting &&
      !target.casting
    )
      joinBattle(w, u, target)
  const dead = w.units.filter(u => u.hp <= 0 && !u.flight && u.native?.state !== 44),
    ordinaryDead = dead.filter(u => !u.ghost)
  for (const u of ordinaryDead) restoreDeadHypnotisedUnit(u)
  for (const u of ordinaryDead) {
    const victim = u.team === 'blue' ? 0 : u.team === 'red' ? campaignTribe(w) : -1,
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
      const site = campaignPosition(w, team),
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
        const u = addUnit(w, team, 'shaman', site)
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
