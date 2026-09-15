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
  withCampaignTribe,
} from './campaign-runtime.ts'
import { campaignRules, stepForcedCampaignAttack } from './campaign-command-runtime.ts'
import {
  computerSelectionWorld,
  computerTrainingBuilding,
  refreshTribeTerritory,
  stepComputerSpells,
  stepComputerTasks,
} from './computer-runtime.ts'
import {
  builderActivity,
  unitAnimationSource,
  selectionBuilding,
  canOrder,
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
import { meleeDamage, joinBattle, cleanBattles, processBattles } from './combat-runtime.ts'
import { release, releaseTasks } from './world-tasks.ts'
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
import { buildingObject, buildingPose, buildingShapeCells } from './building-shapes.ts'
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
  wrappedPlanarDelta,
  wrappedDistance,
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
import { TRIBE_TEAMS, teamForTribe, tribeForTeam } from './world-types.ts'
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
import { firewarriorRange, launchFirewarrior, stepFirewarriorShots } from './firewarrior.ts'
import { buildingDoor, entrance, findPath, route, tell } from './live-command.ts'
import { pursuitDestinationChanged } from './person-routes.ts'
import { stepAttackReservation, type AttackReservation } from './combat-targets.ts'
import { currentPersonOrder, emptyPersonOrder, type OrderPool } from './person-orders.ts'
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
import { removeObjectFromCell, objectsInCell, type ObjectCells } from './object-cells.ts'
import {
  stepBuildingEntry,
  isDismantling,
  buildingAdmission,
  stepLiveTraining,
  type BuildingEntry,
  type BuildingAdmission,
} from './live-building-entry.ts'
import { stepBuildingEntryClocks } from './training.ts'
import { boardLiveVehicle, syncLiveVehiclePassengers } from './live-vehicles.ts'
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
import {
  distributeMana,
  generateFollowerMana,
  liveManaOrders,
  manaPeople,
  type ManaWorld,
  type ManaTribe,
} from './mana.ts'
import { createTribeCasting, stepComputerCastCooldown, type TribeCasting } from './spell-casting.ts'
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
          withCampaignTribe(w, id, ai => {
            stepComputerCastCooldown(w.castingTribes[id], ai.flags)
            campaignRules(w)
            stepComputerTasks(w, id)
            stepComputerSpells(w, id)
          })
        },
      }
    )
  const dt = 1 / TURNS_PER_SECOND
  w.turn = (w.turn + 1) >>> 0
  for (let tribe = 1; tribe < w.campaignAIs.length; tribe++)
    if (w.campaignAIs[tribe]) withCampaignTribe(w, tribe, () => stepForcedCampaignAttack(w))
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
    if (
      gift.reward === 'camp' ||
      gift.reward === 'tower' ||
      gift.reward === 'temple' ||
      gift.reward === 'firewarriorHut' ||
      gift.reward === 'boatHouse' ||
      gift.reward === 'vault'
    ) {
      if (gift.reward === 'temple') w.unlockedTemple = true
      else if (gift.reward === 'tower') w.unlockedTower = true
      else if (gift.reward === 'firewarriorHut') w.unlockedFirewarriorHut = true
      else if (gift.reward === 'boatHouse') w.unlockedBoatHouse = true
      else w.unlockedCamp = true
      tell(
        w,
        gift.reward === 'temple'
          ? 'Knowledge discovered: build a Temple, then send braves inside to train as preachers.'
          : gift.reward === 'tower'
            ? 'Knowledge discovered: build a Guard Tower, then send a follower inside to defend the area.'
            : gift.reward === 'firewarriorHut'
              ? 'Knowledge discovered: build a Firewarrior Training Hut, then send braves inside.'
              : gift.reward === 'boatHouse'
                ? 'Knowledge discovered: build a Boat House at the shore to launch a Boat.'
                : 'Knowledge discovered: build a Warrior Training Hut, then send braves inside.'
      )
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
        const team = teamForTribe(fx.firestorm!.tribe)
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
            teamForTribe(fx.lightning.tribe),
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
  stepFirewarriorShots(w)
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
        wrappedDistance(shaman, shrine) < 3
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
      } else if (shrine.kind === 'erosionEffect') {
        const erosion = effect(w, 'erosion', shrine.effectTarget!)
        erosion.erosion = createErosion(nativePosition(w, shrine.effectTarget!))
        erosion.duration = Infinity
      } else if (shrine.kind === 'boat') {
        const boat = w.vehicles.find(v => v.id === shrine.rewardVehicle)
        if (boat) {
          boat.active = true
          w.castingTribes[0].flags |= 64
          tell(w, 'Boat received. Select followers and click it to board.')
        }
      } else createGift(w, shrine.reward!, shrine)
      sound(w, 0x70, shrine)
    }
  }
  // Imported availability selects rechargeable spells; head rewards remain one-off stocks.
  w.manaWorld.turn = w.turn
  for (const spell of SPELLS)
    if (w.manaWorld.spells[0].available & (1 << spell.model))
      w.manaWorld.spells[0].stocks[spell.model] = w.shots[spell.id]
  w.manaWorld.spells[0].disabled = w.charging ? 0 : 2
  w.manaTribes[0].spellProgress[2] = Math.round(w.mana * 1000)
  generateFollowerMana(w.manaWorld, w.manaTribes, manaPeople(w), liveManaOrders)
  for (const [tribeId, team] of TRIBE_TEAMS.entries()) {
    if (tribeId >= w.tribeCount) break
    const tribe = w.manaTribes[tribeId]
    if (!tribe.active) continue
    const schools = w.buildings.filter(
      b =>
        b.team === team &&
        (b.kind === 'camp' || b.kind === 'temple' || b.kind === 'firewarriorHut') &&
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
  for (const spell of SPELLS)
    if (w.manaWorld.spells[0].available & (1 << spell.model))
      w.shots[spell.id] = w.manaWorld.spells[0].stocks[spell.model] & 15
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
    if (b.kind === 'camp' || b.kind === 'temple' || b.kind === 'firewarriorHut') {
      stepLiveTraining(w, b)
    } else if (b.kind === 'boatHouse' && !b.boatLaunched && inhabitants.length) {
      if (++b.timer >= 600) {
        const pose = buildingPose(b),
          launch = buildingShapeCells(pose).find(cell => cell.mask & 16)
        if (launch) {
          const x = short((((launch.index & 127) * 2 + 1) * 256) & 65535),
            y = short(((Math.floor(launch.index / 128) * 2 + 1) * 256) & 65535),
            direction = rules.terrainCategoryDirections[w.land.categories[launch.index] & 15],
            heading = direction < 0 ? (pose.angle + 1024) & 2047 : (direction << 8) & 2047,
            boat: Vehicle = {
              x,
              y,
              h: terrainPointHeight(w.land, { x, y }),
              id: w.nextId++,
              class: 4,
              model: 1,
              team: b.team,
              physics: 1,
              speed: -1,
              navigationFlags: 0x8004,
              passengerCount: 0,
              passengers: [],
              reservation: 0,
              turnAngle: x,
              turnY: y,
              heading: (heading * Math.PI * 2) / 2048,
              active: true,
            },
            worker = inhabitants[0]
          w.vehicles.push(boat)
          release(w, worker)
          worker.native = createLivePerson(w, worker)
          w.pathfinding.people.set(worker.id, worker.native)
          boardLiveVehicle(w, worker.native, boat)
          if (w.manaTribes[tribeForTeam(b.team)].playerType === 1)
            for (const occupant of inhabitants.slice(1)) {
              release(w, occupant)
              occupant.native = createLivePerson(w, occupant)
            }
          b.timer = 0
          b.boatLaunched = true
          w.castingTribes[tribeForTeam(b.team)].flags |= 64
          tell(w, 'Boat launched. Its builder is aboard and ready to sail.')
        }
      }
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
    if (!u.native?.vehicle && !supportsFollower(w, u)) {
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
        if (
          (b.kind === 'camp' ||
            b.kind === 'tower' ||
            b.kind === 'temple' ||
            b.kind === 'firewarriorHut') &&
          u.entry
        )
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
        work.kind === 'firewarriorHut' ||
        work.kind === 'boatHouse' ||
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
    if (u.native?.vehicle && !activeOrder) {
      const vehicle = w.vehicles.find(vehicle => vehicle.id === u.native!.vehicle)
      if (vehicle) syncLiveVehiclePassengers(w, vehicle)
      continue
    }
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
    const reach =
      target && 'progress' in target ? 4.3 : u.kind === 'firewarrior' ? firewarriorRange : 1.7
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
      if (!('progress' in target) && u.kind === 'firewarrior') {
        u.path = []
        if (u.native) u.native.speed = 0
        u.fighting = true
        if (!u.cooldown) launchFirewarrior(w, u, target)
        continue
      }
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
      ([3, 6, 7, 22, 27, 30, 33].includes(activeOrder?.model ?? 0) ||
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
    const victim = tribeForTeam(u.team),
      person = u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person,
      attacker = person?.damageAttacker ?? 255
    if (victim >= 0 && attacker >= 0 && attacker < 4)
      w.killCredits[attacker][victim] = (w.killCredits[attacker][victim] + 1) & 65535
  }
  for (const u of ordinaryDead.filter(u => u.kind === 'shaman'))
    if (
      w.units.some(a => a.team === u.team && !a.ghost && a.hp > 0) &&
      (u.team === 'blue' || !!w.campaignAIs[tribeForTeam(u.team)]?.reincarnation)
    ) {
      const turns = reincarnationTurns(!supportsFollower(w, u)),
        tribe = tribeForTeam(u.team),
        position = nativePosition(w, u),
        visual = effect(w, 'reincarnation', u)
      w.respawns[tribe] = turns / TURNS_PER_SECOND
      w.respawnPoints[tribe] = { x: u.x, z: u.z }
      if (tribe === 0) {
        w.respawn = w.respawns[tribe]
        w.respawnPoint = w.respawnPoints[tribe]
      } else if (tribe === 1) {
        w.redRespawn = w.respawns[tribe]
        w.redRespawnPoint = w.respawnPoints[tribe]
      }
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
      { ...nativePosition(w, b), tribe: tribeForTeam(b.team) },
      w.campaignAIs[tribeForTeam(b.team)]?.defenceRadius ?? 11,
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
  for (const [tribe, team] of TRIBE_TEAMS.entries()) {
    const legacyRemaining = tribe === 0 ? w.respawn : tribe === 1 ? w.redRespawn : 0,
      remaining = w.respawns[tribe] || legacyRemaining,
      point =
        w.respawnPoints[tribe] ??
        (tribe === 0 ? w.respawnPoint : tribe === 1 ? w.redRespawnPoint : undefined)
    if (remaining > 0) {
      const site = campaignPosition(w, team),
        visual = w.effects.find(f => f.reincarnation?.team === team),
        canSpawn =
          w.units.some(u => u.team === team && !u.ghost) &&
          !w.units.some(u => u.team === team && isShaman(u)),
        step = stepReincarnation(
          Math.round(remaining * TURNS_PER_SECOND),
          canSpawn,
          !supportsFollower(w, point ?? site)
        )
      w.respawns[tribe] = step.remaining / TURNS_PER_SECOND
      if (tribe === 0) w.respawn = w.respawns[tribe]
      else if (tribe === 1) w.redRespawn = w.respawns[tribe]
      if (visual?.reincarnation) {
        visual.reincarnation.phase = step.phase
        visual.height = (visual.reincarnation.ground + step.height) / 45
      }
      if (step.event === 'splash') effect(w, 'splash', point ?? site)
      else if (step.event === 'rise') effect(w, 'birth', site)
      else if (step.event === 'spawn') {
        const u = addUnit(w, team, 'shaman', site)
        if (tribe === w.manaWorld.playerTribe) sound(w, 0x6b, site)
        if (team === 'blue' && !w.selected.length) w.selected = [u.id]
        if (visual) visual.duration = visual.age
      }
      if (!w.respawns[tribe]) {
        w.respawnPoints[tribe] = undefined
        if (tribe === 0) delete w.respawnPoint
        else if (tribe === 1) delete w.redRespawnPoint
      }
    }
  }
  refreshTerrainLights(w) // 0x4ec6f0: lighting follows the completed object turn.
  ageFailedRoutes(w.motionRoutes) // 0x4ec6f0: after object and terrain work.
  // The result overlay remains while followers continue their native celebration.
  // Full progression presentation is still being reconstructed.
  if (w.land.landFlags & 0x2000000) {
    for (let tribe = 1; tribe < w.respawns.length; tribe++) {
      w.respawns[tribe] = 0
      w.respawnPoints[tribe] = undefined
      const visual = w.effects.find(f => f.reincarnation?.team === teamForTribe(tribe))
      if (visual) visual.duration = visual.age
    }
    w.redRespawn = 0
    delete w.redRespawnPoint
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
