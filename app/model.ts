import { selectHudPeople, type HudSelectionMode } from './hud-selection.ts'
import { worshipOrder, worshipHeadPose } from './live-worship.ts'
import {
  movementOrder,
  startLiveOrder,
  cancelLiveOrder,
  stepLiveMovement,
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
import {
  stepLiveBuildingAttack,
  cancelLiveBuildingAttack,
  liveBuildingAttackTarget,
} from './live-building-combat.ts'
import { automaticMeleeTarget, nativePersonModel, nativePersonTribe } from './live-combat.ts'
import { pursuitDestinationChanged } from './person-routes.ts'
import { stepAttackReservation, type AttackReservation } from './combat-targets.ts'
import {
  currentPersonOrder,
  deselectPerson,
  emptyPersonOrder,
  type OrderPool,
} from './person-orders.ts'
import {
  clickPersonSelection,
  markPersonSelected,
  selectedPersonVoice,
  selectedGroupVoices,
  canDragPerson,
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
import { stepBuildingLevel } from './building-preparation.ts'
import {
  faceTribe,
  personAnimationObject,
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
  stepTimberDelivery,
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
import { reincarnationStones } from './reincarnation.ts'
import { stepHutBirth, hutBirthPoints } from './hut-birth.ts'
import { terrainSupportsPerson } from './person-collision.ts'
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
import {
  createLivePathfinding,
  findLivePath,
  planLivePath,
  acceptLivePath,
  clearLivePath,
  stepLiveRoute,
  removeDeadLiveRoutes,
} from './live-pathfinding.ts'
import {
  collisionWorld,
  enterLiveCombat,
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
  nativeSpellRange,
  prepareSpellPayment,
  debitSpellMana,
  createTribeCasting,
  canShamanCast,
  registerSpellCooldown,
  stepComputerCastCooldown,
  type TribeCasting,
  type SpellCaster,
} from './spell-casting.ts'
import {
  castShoreBlast,
  processComputerSpells,
  type SpellTargetScan,
  type SpellTargetWorld,
  type SpellTargetUnit,
} from './computer-spells.ts'
import { createFlyby, flybyCommand, type Flyby } from './flyby.ts'
import level from './level-one.ts'
import originalScript from './original-script.json' with { type: 'json' }
import {
  runScript,
  scriptState,
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

const debrisModels: Record<number, NativeModel> = modelAssets
export type Team = 'blue' | 'red' | 'wild'
export type UnitKind = 'shaman' | 'brave' | 'warrior'
export type BuildingKind = 'hut' | 'camp' | 'tower' | 'temple'
export type Spell = 'blast' | 'lightning' | 'bridge'
export type Point = { x: number; z: number }
type Fight = {
  group: number
  opponent: number
  action: 'encounter' | 'approach' | 'ready' | 'attack' | 'strike' | 'special' | 'recoil' | 'push'
  started: number
  remaining?: number
  animation?: MeleeAttack | 'recoil' | 'walk' | 'idle'
  knockback?: boolean
  motion?: LivePerson
}
type NativePoint = { x: number; y: number; h: number }
export type Projectile = {
  id: number
  spell: Spell
  team: Team
  caster: number
  target: Point
  source: Point
  position: NativePoint
  destination: NativePoint
  origin: NativePoint
  phase: 'windup' | 'flying' | 'arrived'
  remaining: number
  turns: number
  visuals: Effect[]
}
type Battle = Point & {
  id: number
  members: number[]
  angle: number
  encounter?: [number, number]
  encounterBuilding?: number
  slots?: number[]
  tribes?: number[]
  center?: number
  winner?: number
  attackReservation?: AttackReservation
}
export type Unit = Point & {
  attackReservation?: AttackReservation
  supportHeight?: number
  entry?: BuildingEntry
  native: LivePerson | null
  burnTrail?: number
  flight?: LivePerson
  vault: VaultTask | null
  id: number
  team: Team
  kind: UnitKind
  hp: number
  path: Point[]
  target: number | null
  cooldown: number
  work: number | null
  inside: number | null
  cargo: number
  tree: number | null
  harvest?: { remaining: number }
  delivery?: { remaining: number }
  builder?: Builder & { person?: LivePerson }
  timer: number
  guard: boolean
  lift: number
  idleTurns: number
  heading: number
  fighting: boolean
  fight: Fight | null
  casting: { spell: Spell; point: Point; remaining: number } | null
}
export type Building = Point & {
  attackReservation?: AttackReservation
  admission?: BuildingAdmission
  dismantled?: boolean
  id: number
  anchor?: { x: number; y: number }
  object?: number
  team: Team
  kind: BuildingKind
  hp: number
  progress: number
  timer: number
  foundation: number
  level: number
  logs: number
  upgrade: number
  upgrading: boolean
  angle: number
  counter: number
  preparation?: UnbuiltPlan & { height: number; alternateHeight: number; work: number }
  builders?: number[]
  birthPending?: boolean
  woodUnavailable?: boolean
  damageState:
    | (DamageBuilding & {
        plan: BuildingPlan
        renderFlags: number
        tilt: number
        roll: number
        remaining: number
      })
    | null
  burn?: BuildingBurn
  terrainState?: BuildingTerrain & { dirty: boolean }
}
export type Shrine = Point &
  WorshipState & {
    id: number
    kind: 'bridge' | 'lightning' | 'vault'
    nextSlot: number
    slotTimer: number
    range: number
    followers: number
    name: string
    progress: number
    duration: number
    uses: number
    forced: boolean
    model: number
    morph: ModelMorph | null
    angle: number
  }
export type Tree = Point & {
  id: number
  logs: number
  model: number
  burn?: BurningTree
  counter?: number
  growth?: number
}
export type SoundEvent = Point & {
  serial: number
  cue: number
  turn: number
  owner?: number
  stop?: boolean
}
export type Effect = Point & {
  id: number
  team?: Team
  kind:
    | Spell
    | 'birth'
    | 'hit'
    | 'death'
    | 'splash'
    | 'trail'
    | 'buildingSmoke'
    | 'debris'
    | 'fire'
    | 'sinking'
    | 'blastWave'
    | 'orderMarker'
  height?: number
  sprite?: { sequence: string; frame: number }
  animation?: AnimatedUnit | SpellTrail
  lightning?: Lightning
  smoke?: BuildingSmoke
  debris?: BuildingDebris
  fire?: SceneryFire
  sinking?: SinkingBuilding & { stage: number }
  wave?: BlastWave
  turnsRemaining?: number
  groundVersion?: number
  age: number
  duration: number
  unit?: Pick<Unit, 'team' | 'kind' | 'heading'>
  bridge?: LandBridge
}
export const TURNS_PER_SECOND = 12
export const SPELLS: {
  id: Spell
  model: number
  name: string
  cost: number
  key: string
  symbol: string
  color: string
  description: string
}[] = [
  {
    id: 'blast',
    model: 2,
    name: 'Blast',
    cost: 10,
    key: '1',
    symbol: '✹',
    color: '#e8b076',
    description: 'Rechargeable · throws followers back. Water is deadly.',
  },
  {
    id: 'bridge',
    model: 12,
    name: 'Land Bridge',
    cost: 70,
    key: '2',
    symbol: '≋',
    color: '#bbca8a',
    description: 'Worship the southern stone head. Cast from one shore onto the other.',
  },
  {
    id: 'lightning',
    model: 3,
    name: 'Lightning',
    cost: 80,
    key: '3',
    symbol: 'ϟ',
    color: '#c6b8f2',
    description: 'Four gifts from the central stone head. A direct hit kills a follower.',
  },
]
export const BUILDINGS: {
  id: BuildingKind
  name: string
  cost: number
  symbol: string
  description: string
}[] = [
  {
    id: 'hut',
    name: 'Hut',
    cost: 3,
    symbol: '⌂',
    description: 'Three logs. Send braves inside to breed faster and generate more mana.',
  },
  {
    id: 'camp',
    name: 'Warrior Training Hut',
    cost: 8,
    symbol: '⚔',
    description: 'Eight logs. Unlock at the vault, then send braves inside to train with mana.',
  },
]
const position = (owner: number) => {
  const o = level.objects.find(o => o.type === 1 && o.model === 7 && o.owner === owner)!
  return { x: o.x, z: o.z }
}
export const HOME = position(0),
  ENEMY = position(1)
export const SIZE = 96,
  GRID = 97
export const PLANET_RADIUS = 70
export function worldPoint(terrain: number[], p: Point) {
  return { x: p.x, y: (height(terrain, p.x, p.z) * 45) / 128, z: p.z }
}
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)
export const maxHp = (kind: UnitKind) =>
  (kind === 'shaman'
    ? constants.LIFE_SHAMEN
    : kind === 'warrior'
      ? constants.LIFE_WARR
      : constants.LIFE_BRAVE) / 20
export const buildingHp = (kind: BuildingKind) => (kind === 'hut' ? 170 : 260)
export const housing = (b: Building) => rules.buildingCapacity[buildingModel(b)]
export function population(w: World, team: Team) {
  return 1 + w.units.filter(u => u.team === team && u.kind !== 'shaman' && u.hp > 0).length
}
export function populationLimit(w: World, team: Team) {
  return Math.min(
    200,
    6 +
      w.buildings
        .filter(b => b.team === team && b.kind === 'hut' && b.progress === 1 && b.hp > 0)
        .reduce(
          (sum, b) =>
            sum +
            [
              constants.MAX_POP_VALUE__HUT_1,
              constants.MAX_POP_VALUE__HUT_2,
              constants.MAX_POP_VALUE__HUT_3,
            ][b.level - 1],
          0
        )
  )
}
export function breedingWork(w: World, b: Building) {
  return Math.floor(
    (rules.hutBreedingWork[b.level - 1] *
      rules.breedingBands[Math.min(19, Math.floor(population(w, b.team) / 10))]) /
      256
  )
}
export function trainingCost(w: World, team: Team) {
  return nativeTrainingCost(
    w.units.filter(u => u.team === team && u.kind === 'warrior' && u.hp > 0).length,
    3,
    team === 'blue' ? 2 : 1
  )
}
export function meleeDamage(u: Unit) {
  const base =
    u.kind === 'warrior'
      ? constants.FIGHT_DAMAGE_WARR
      : u.kind === 'shaman'
        ? constants.FIGHT_DAMAGE_SHAMAN
        : constants.FIGHT_DAMAGE_BRAVE
  return Math.max(32, Math.floor((base * u.hp) / maxHp(u.kind))) / 20
}
const short = (v: number) => (v << 16) >> 16
// 0x4e6ac0: native XYZ, including signed-short wrap and half-scale vertical steps.
export function nativeStep3D(
  p: NativePoint,
  yaw: number,
  pitch: number,
  length: number
): NativePoint {
  const horizontal = Math.imul(rules.sine[pitch & 2047], length) >> 16
  return {
    x: short(p.x + (Math.imul(rules.sine[yaw & 2047], horizontal) >> 16)),
    y: short(p.y + (Math.imul(rules.sine[(yaw + 512) & 2047], horizontal) >> 16)),
    h: short(p.h + (Math.imul(rules.sine[(pitch + 512) & 2047], length >> 1) >> 16)),
  }
}
export const nativePosition = (w: World, p: Point): NativePoint => ({
  x: short(Math.round((p.x + 8) * 256)),
  y: short(Math.round((-p.z - 8) * 256)),
  h: Math.round(height(w.terrain, p.x, p.z) * 45),
})
export const browserPosition = (p: Pick<NativePoint, 'x' | 'y'>): Point => ({
  x: short(p.x - 2048) / 256,
  z: -short(p.y + 2048) / 256,
})
const nativeDistance = (a: NativePoint, b: NativePoint) =>
  Math.floor(Math.hypot(short(a.x - b.x), short(a.y - b.y), a.h - b.h))
function shotAngles(p: NativePoint, d: NativePoint) {
  const dx = short(d.x - p.x),
    dy = short(d.y - p.y)
  return [nativeAngle(dx, -dy), nativeAngle(Math.max(Math.abs(dx), Math.abs(dy)), -2 * (d.h - p.h))]
}
function meleeExchange(w: World, u: Unit, target: Unit, action: MeleeAttack) {
  // 0x518fb0 states 2/3/4; 0x4a39c0 calculates both damages before applying either.
  const damage = meleeDamage(u),
    counter = meleeDamage(target)
  u.heading =
    Math.PI -
    (nativeAngle(Math.round((target.x - u.x) * 256), Math.round((target.z - u.z) * 256)) *
      Math.PI) /
      1024
  u.fight = {
    motion: u.fight!.motion,
    group: u.fight!.group,
    opponent: target.id,
    action,
    animation: action,
    started: w.turn,
    remaining: meleeDuration(u.kind, action) - 1,
  }
  // Busy opponents take damage without losing their current action or facing.
  const defending = target.fight?.action === 'ready'
  if (defending && target.fight) {
    const knockback =
      action === 'attack' && target.kind !== 'shaman' && !(w.manaWorld.gameFlags & 64)
    target.heading = u.heading + Math.PI
    target.fight = {
      motion: target.fight.motion,
      group: target.fight.group,
      opponent: u.id,
      action: 'recoil',
      animation: 'idle',
      started: w.turn,
      knockback,
    }
  }
  for (const fighter of defending ? [u, target] : [u]) {
    const p = fighter.fight?.motion
    if (p && fighter.fight!.action !== 'approach' && fighter.fight!.action !== 'ready') {
      p.speed = 0
      p.heading = p.angle = Math.round(((Math.PI - fighter.heading) * 1024) / Math.PI) & 2047
      p.turnAngle = p.heading
      p.flags2 = (p.flags2 | 0x1080) >>> 0
    }
  }
  target.hp = Math.max(0, (Math.round(target.hp * 20) - Math.round(damage * 20)) / 20)
  if (action !== 'special')
    u.hp = Math.max(0, (Math.round(u.hp * 20) - Math.round(counter * 20)) / 20)
  effect(w, 'hit', target)
  if (action !== 'special') effect(w, 'hit', u)
}
const unitSpeed = (u: Unit) =>
  u.kind === 'shaman'
    ? constants.MEDICINE_MAN_SPEED
    : u.kind === 'warrior'
      ? constants.WARRIOR_SPEED
      : constants.BRAVE_SPEED
export function fightPosition(b: Battle, index: number) {
  return index === 0
    ? { x: b.x, z: b.z }
    : nativeStep(
        b,
        b.angle + (b.members.length === 3 ? [0, 0, 512][index] : [0, 0, 682, 1365][index]),
        180
      )
}
function relocateBattle(w: World, b: Battle, force = false) {
  const p = nativePosition(w, b),
    cell = (p: { x: number; y: number }) => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  if (!force && w.turn & 31 && !(w.land.flags[cell(p)] & 512)) return
  // Only build the occupancy index on a relocation visit. Earlier groups have
  // already moved, so later groups see their current cells, as in the original.
  const occupied = new Set(w.fights.filter(a => a !== b).map(a => cell(nativePosition(w, a))))
  const fight = {
    ...p,
    id: b.id,
    angle: b.angle,
    counter: w.turn,
    model: 8,
    tribe: 255,
    flags2: 0,
    flags4: 0,
    workTarget: 0,
    target: 0,
  }
  // ponytail: class allocation/scheduler phase is still adapted to the world
  // turn; replace this phase when native mixed-class object ownership lands.
  relocateFight(
    {
      collision: collisionWorld(w),
      search: w.indexedSearch,
      occupied: p => occupied.has(cell(p)),
      outside: id => {
        const building = w.buildings.find(b => b.id === id)
        if (!building) throw new Error(`Missing fight-site building ${id}`)
        return buildingOutsidePoint(buildingPose(building))
      },
      height: p => terrainPointHeight(w.land, p),
    },
    fight,
    force
  )
  Object.assign(b, browserPosition(fight))
}
export function joinBattle(w: World, u: Unit, target: Unit, structure?: Building) {
  let b = w.fights.find(b => b.id === target.fight?.group)
  if (b) {
    if (b.encounter) return // A model-9 encounter already owns both participants.
    reinforceBattle(w, b, u)
    return
  } else {
    b = {
      id: w.nextId++,
      members: [u.id, target.id],
      encounter: [u.id, target.id],
      encounterBuilding: structure?.id,
      x: target.x,
      z: target.z,
      angle: 0,
    }
    w.fights.push(b)
    for (const [person, opponent, phase] of [
      [u, target, EncounterPhase.Approach],
      [target, u, EncounterPhase.Wait],
    ] as const) {
      const motion = enterLiveCombat(w, person, 29)
      release(w, person, true)
      if (person.native === motion) person.native = null
      motion.substate = structure ? EncounterPhase.EjectDefender : phase
      motion.flags2 = (motion.flags2 | 0x40000000) >>> 0
      motion.workFlags = b.id
      person.fight = {
        group: b.id,
        opponent: opponent.id,
        action: 'encounter',
        started: w.turn,
        motion,
      }
    }
    // 0x51e150 stops the defender before visiting the encounter immediately.
    stopPersonMovement(target.fight!.motion!, (_, object) =>
      setLivePersonAnimation(w, target.fight!.motion!, object)
    )
    processEncounter(w, b)
    return
  }
}

// Persistent native slots remain separate from the center-first presentation order.
function reinforceBattle(w: World, b: Battle, recruit: Unit) {
  b.slots ??= [...b.members, ...Array(6 - b.members.length).fill(0)]
  const units = new Map(
    w.units.filter(u => b.slots!.includes(u.id) || u === recruit).map(u => [u.id, u])
  )
  const people = new Map(
    [...units.values()].map(u => [
      u.id,
      u.fight ? (u.fight.motion ??= createMeleePerson(w, u)) : createLivePerson(w, u),
    ])
  )
  b.tribes ??= [...new Set(b.members.map(id => people.get(id)!.tribe))]
  const group: MeleeGroup = {
    id: b.id,
    members: b.slots,
    tribes: b.tribes,
    center: b.center ?? b.members[0],
    count: b.slots.filter(Boolean).length,
    angle: b.angle,
  }
  const state = { randomState: w.randomState, objects: people }
  let created: MeleeGroup | undefined
  const admitted = joinMeleeGroup(state, group, people.get(recruit.id)!, {
    enter: p => {
      enterLiveCombat(w, recruit, 25, people.get(p.id)!)
      state.randomState = w.randomState
      release(w, recruit)
    },
    // ponytail: browser group allocation is unbounded; replace with the native
    // mixed-class pool when its ownership/limits are integrated.
    allocate: () =>
      (created = {
        id: w.nextId++,
        members: [],
        tribes: [],
        count: 0,
        center: 0,
        angle: 0,
      }),
  })
  if (!admitted) return
  w.randomState = state.randomState
  b.center = group.center
  b.members = group.members.filter(Boolean)
  if (created)
    w.fights.push({
      id: created.id,
      x: b.x,
      z: b.z,
      angle: created.angle,
      center: 0,
      members: created.members.filter(Boolean),
      slots: created.members,
      tribes: created.tribes,
    })
  for (const [id, p] of people) {
    const u = units.get(id)!
    if (!p.workFlags) {
      clearFightAssignment(u)
      continue
    }
    if (u === recruit || p.workFlags !== u.fight?.group) {
      const battle = w.fights.find(fight => fight.id === p.workFlags)!
      const opponent = battle.members.find(id => people.get(id)!.tribe !== p.tribe)!
      u.fight = {
        group: battle.id,
        opponent,
        action: 'approach',
        animation: 'idle',
        started: w.turn,
        motion: p,
      }
    }
  }
}

function processEncounter(w: World, b: Battle) {
  const [attacker, defender] = b.encounter!.map(id => w.units.find(u => u.id === id)!)
  const outcome = stepLiveEncounter(w, attacker, defender, b.encounterBuilding)
  if (outcome === 'waiting') return
  if (outcome === 'cancelled') {
    for (const u of [attacker, defender]) clearFightAssignment(u)
    b.members = []
    return
  }
  // 0x51de60: the defender becomes the first member and original fight center.
  // Class allocation order/counter phase still belong to the browser adapter.
  b.id = w.nextId++
  b.members = [defender.id, attacker.id]
  b.slots = [...b.members, 0, 0, 0, 0]
  b.tribes = [defender.fight!.motion!.tribe, attacker.fight!.motion!.tribe]
  b.center = 0
  b.x = defender.x
  b.z = defender.z
  delete b.encounter
  delete b.encounterBuilding
  for (const [u, target] of [
    [attacker, defender],
    [defender, attacker],
  ]) {
    const motion = enterLiveCombat(w, u, 25)
    motion.workFlags = b.id
    u.fight = {
      group: b.id,
      opponent: target.id,
      action: 'approach',
      animation: 'idle',
      started: w.turn,
      motion,
    }
  }
  b.angle = random(w) % 360
  relocateBattle(w, b, true)
}
function clearFightAssignment(u: Unit) {
  if (u.flight && u.flight.workFlags === u.fight?.group) u.flight.workFlags = 0
  if (u.fight?.motion) {
    const p = u.fight.motion
    p.workFlags = 0
    if (p.immediateCommand || p.commands.some(Boolean)) u.native = p
  }
  u.fight = null
}
function cleanBattles(w: World) {
  const rosters = new Map<number, number[]>()
  if (!w.fights.length) return rosters
  const units = new Map(w.units.map(u => [u.id, u])),
    people = new Map<number, FightParticipant>()
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    people.set(u.id, {
      ...nativePosition(w, u),
      id: u.id,
      class: p?.class ?? 1,
      tribe: u.team === 'blue' ? 0 : u.team === 'red' ? 1 : 255,
      state: p?.state ?? (u.fight ? 25 : 10),
      flags2: p?.flags2 ?? 0,
      life: short(Math.round(u.hp * 20)),
      workFlags: p?.workFlags ?? u.fight?.group ?? 0,
    })
  }
  for (const b of w.fights) {
    if (b.encounter) {
      // Model-9 encounters have their own two-person controller, not model-8 slots.
      if (
        b.members.every(id => {
          const u = units.get(id)
          return u && u.hp > 0 && u.fight?.group === b.id
        })
      )
        continue
      for (const id of b.members) {
        const u = units.get(id)
        if (u?.fight?.group === b.id) {
          clearFightAssignment(u)
          people.get(id)!.workFlags = 0
        }
      }
      b.members = []
      continue
    }
    const reservation = b.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }
    const group = {
      ...nativePosition(w, b),
      ...reservation,
      id: b.id,
      members: b.slots ?? [...b.members, ...Array(6 - b.members.length).fill(0)],
      tribes: b.tribes ?? [255, 255],
      count: b.members.length,
      winner: b.winner ?? 255,
    }
    const result = cleanFightRoster(group, people)
    b.slots = group.members
    b.tribes = group.tribes
    b.winner = group.winner
    reservation.flags4 = group.flags4
    reservation.reactionTimer = group.reactionTimer
    if (result.active) rosters.set(b.id, result.people.filter(Boolean))
    b.members = result.active ? b.members.filter(id => result.people.includes(id)) : []
    if (!result.active) {
      releaseFightRoster(group, people)
      if (group.winner !== 255)
        w.stats.battlesWon[group.winner] = (w.stats.battlesWon[group.winner] + 1) | 0
    }
  }
  for (const [id, p] of people) {
    const u = units.get(id)!,
      motion = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    if (motion) motion.workFlags = p.workFlags
    if (u.fight && motion && motion.state !== 29 && !(rules.personStateFlags[motion.state] & 16))
      u.fight = null
  }
  w.fights = w.fights.filter(b => b.members.length > 1)
  return rosters
}
function processBattles(w: World) {
  const rosters = cleanBattles(w)
  for (const b of w.fights) {
    if (b.encounter) {
      processEncounter(w, b)
      continue
    }
    const ids = rosters.get(b.id)!,
      members = ids.map(id => w.units.find(u => u.id === id)!)
    const center = fightCenter(
      { members: b.slots!, tribes: b.tribes!, count: members.length },
      ids,
      new Map(members.map(u => [u.id, { tribe: u.team === 'blue' ? 0 : 1 }]))
    )
    if (center.index > 0) [members[0], members[center.index]] = [members[center.index], members[0]]
    if ((b.center ?? b.members[0]) !== center.id) {
      b.x = members[0].x
      b.z = members[0].z
      b.angle = (b.angle + 1024) & 2047
    }
    b.center = center.id
    b.members = members.map(u => u.id)
    if ((w.turn & 31) === 0 && (random(w) & 1) === 0) {
      const r = (random(w) % 341) + 113
      b.angle = (b.angle + (r & 1 ? -r : r)) & 2047
    }
    relocateBattle(w, b)
    let recenter = false
    for (let i = 0; i < members.length; i++) {
      const u = members[i],
        f = u.fight!
      // Cleanup retains airborne/reaction states, but only state 25 takes fight actions.
      if (
        u.hp <= 0 ||
        !f ||
        ((u.flight ?? f.motion)?.state ?? 25) !== 25 ||
        f.action === 'encounter'
      )
        continue
      if (nativePersonTribe(u) === w.manaWorld.playerTribe) w.musicActivity = 2
      if (f.action === 'push') {
        if (f.remaining === undefined) {
          startMeleeKnockback(w, u)
          f.remaining = 2
        }
        const person = u.flight
        if (f.remaining > 0) {
          f.remaining--
          if (!f.remaining && person) {
            person.speed = 0
            setPersonAnimationRow(person, person.cargo ? 5 : 1, (_, object) =>
              setLivePersonAnimation(w, person, object)
            )
          }
        } else if (!person || !(person.flags2 & 0x80000)) {
          f.motion = u.flight
          u.flight = undefined
          f.action = 'approach'
          f.animation = 'walk'
          recenter = true
        }
        continue
      }
      if (f.action !== 'approach' && f.action !== 'ready') {
        if (f.remaining === undefined) {
          f.remaining = meleeDuration(u.kind, f.action, f.knockback)
          f.started = w.turn
          f.animation = f.action
        }
        f.remaining = short(f.remaining - 1)
        if (f.remaining > 0) continue
        // 0x518fb0 expires the action here; approach resumes next turn.
        if (f.action === 'attack' || f.action === 'special') sound(w, 0xd, u)
        if (f.action === 'strike') {
          const target = w.units.find(a => a.id === f.opponent)
          if (u.kind === 'warrior') {
            sound(w, target?.kind === 'warrior' ? 0x27 : 0x2b, u)
            if (target && target.kind !== 'warrior') sound(w, 0x32, target)
          } else sound(w, 0xe, u)
        }
        f.action = f.action === 'recoil' && f.knockback ? 'push' : 'approach'
        f.remaining = undefined
        continue
      }
      if (
        !approachLiveMelee(
          w,
          u,
          nativePosition(w, fightPosition(b, i)),
          nativePosition(w, b),
          i !== 0
        )
      )
        continue
      const choice = random(w) & 15,
        targetIndex = i === 0 ? 1 + (random(w) % (members.length - 1)) : 0,
        target = members[targetIndex]
      if (target.hp <= 0) continue
      const ready = target.fight?.action === 'ready'
      let slotDistanceSquared = 0
      if (!ready && choice < 4) {
        const slot = fightPosition(b, targetIndex),
          slotDx = short(Math.round((slot.x - target.x) * 256)),
          slotDz = short(Math.round((slot.z - target.z) * 256))
        slotDistanceSquared = (slotDx * slotDx + slotDz * slotDz) | 0
      }
      const action = chooseMeleeAttack(
        u.kind,
        choice,
        { ready, fighting: !!target.fight, slotDistanceSquared },
        members.length
      )
      if (action) meleeExchange(w, u, target, action)
    }
    if (recenter) {
      const p = nativePosition(w, b)
      Object.assign(b, browserPosition({ x: (p.x & 0xfe00) + 256, y: (p.y & 0xfe00) + 256 }))
    }
  }
  w.fights = w.fights.filter(b => b.members.length > 1)
}
function builderActivity(u: Unit) {
  const task = u.builder?.task
  return (
    task === BuilderTask.Approach ||
    task === BuilderTask.Work ||
    task === BuilderTask.Level ||
    task === BuilderTask.ClearScenery ||
    task === BuilderTask.ClearPeople ||
    task === BuilderTask.Leave
  )
}
export function unitAnimationSource(u: Unit) {
  if (u.flight) return u.flight
  if (u.fight?.action === 'encounter') return u.fight.motion!
  if (u.fight?.motion && ['walk', 'idle'].includes(u.fight.animation ?? '')) return u.fight.motion
  if (u.native && (u.native.state !== 10 || [3, 19, 27].includes(u.native.commandStatus)))
    return u.native
  if (u.entry) return u.entry.person
  return builderActivity(u) && !u.fight && !u.fighting && !u.casting && !u.lift
    ? (u.builder?.person ?? null)
    : null
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
// 0x44e940: toroidal 128-cell map, 512 coordinates/cell, separate signed shifts.
export function nativeTerrainHeight(terrain: ArrayLike<number>, x: number, y: number) {
  const ix = (x & 65535) >> 9,
    iy = (y & 65535) >> 9,
    fx = (x & 510) >> 1,
    fy = (y & 510) >> 1
  const a = terrain[iy * 128 + ix],
    b = terrain[iy * 128 + ((ix + 1) & 127)],
    c = terrain[((iy + 1) & 127) * 128 + ix],
    d = terrain[((iy + 1) & 127) * 128 + ((ix + 1) & 127)]
  return short(
    nativeTerrainCross(a, b, c, d)
      ? fx + fy < 256
        ? a + (((b - a) * fx) >> 8) + (((c - a) * fy) >> 8)
        : d + (((b - d) * (256 - fy)) >> 8) + (((c - d) * (256 - fx)) >> 8)
      : fy < fx
        ? a + (((d - b) * fy) >> 8) + (((b - a) * fx) >> 8)
        : a + (((d - c) * fx) >> 8) + (((c - a) * fy) >> 8)
  )
}
// Browser Z reflects native Y, exchanging the two diagonals. Quantize like the water shader.
export function terrainCross(a: number, b: number, c: number, d: number) {
  return !nativeTerrainCross(
    Math.floor(c * 45 + 0.5),
    Math.floor(d * 45 + 0.5),
    Math.floor(a * 45 + 0.5),
    Math.floor(b * 45 + 0.5)
  )
}
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
export function height(terrain: number[], x: number, z: number) {
  const gx = Math.max(0, Math.min(96, x + 48)),
    gz = Math.max(0, Math.min(96, z + 48))
  const ix = Math.min(95, Math.floor(gx)),
    iz = Math.min(95, Math.floor(gz)),
    fx = gx - ix,
    fz = gz - iz
  const a = terrain[iz * GRID + ix],
    b = terrain[iz * GRID + ix + 1],
    c = terrain[(iz + 1) * GRID + ix],
    d = terrain[(iz + 1) * GRID + ix + 1]
  // Match the rendered triangles, including their diagonal, rather than bilinear interpolation.
  return terrainCross(a, b, c, d)
    ? fx + fz <= 1
      ? a + fx * (b - a) + fz * (c - a)
      : d + (1 - fx) * (c - d) + (1 - fz) * (b - d)
    : fz < fx
      ? a + fx * (b - a) + fz * (d - b)
      : a + fx * (d - c) + fz * (c - a)
}
export function surface(terrain: number[], p: Point) {
  return height(terrain, p.x, p.z)
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
  })
  b.foundation = terrainPointHeight(w.land, buildingPosition(pose)) / 45
  refreshTerrainSurface(w)
}
function refreshTerrainSurface(w: World) {
  // Resample the compatibility grid after native writes; keep collision, picking
  // and the rendered native terrain on the same surface.
  for (let i = 0; i < w.terrain.length; i++) {
    const x = (i % GRID) - 48,
      z = Math.floor(i / GRID) - 48
    const h = terrainPointHeight(w.land, { x: (x + 8) * 256, y: (-z - 8) * 256 }) / 45
    w.terrain[i] = h || -0.35
  }
  w.terrainVersion++
  w.landVersion = w.terrainVersion
}
export function walkable(terrain: number[], p: Point) {
  return Math.abs(p.x) < 47 && Math.abs(p.z) < 47 && height(terrain, p.x, p.z) > 0.45
}
export const buildingContainsPoint = (b: Building, p: Point) =>
  b.progress === 1 && distance(b, p) < 2.35
export const buildingBlocksStep = (b: Building, start: Point, next: Point) =>
  buildingContainsPoint(b, next) && !buildingContainsPoint(b, start)
// Terrain support follows the original coastal mask, including low dry shore.
// ponytail: the movement adapter still owns only the rendered map crop.
export function supportsFollower(w: World, p: Point & { inside?: number | null }) {
  // Occupants remain with their building until its controller ejects them.
  // Terrain-only route points still use the ordinary coastal support predicate.
  if (p.inside != null && w.buildings.some(b => b.id === p.inside && b.hp > 0)) return true
  if (Math.abs(p.x) >= 47 || Math.abs(p.z) >= 47) return false
  const n = nativePosition(w, p),
    cell = ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
  return !!terrainSupportsPerson(w.land.categories[cell], n)
}
export function findPath(w: World, start: Unit, end: Point): Point[] {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  return findLivePath(w, start, end)
}
export type World = {
  objectCells: ObjectCells
  marching: LiveFormation[]
  buildingOrders: OrderPool
  motionRoutes: MotionRoutes
  pathfinding: ReturnType<typeof createLivePathfinding>
  ai: ScriptState & {
    states: number
    flags: number
    enemyTribe: number
    defencePosition: number
    defenceRadius: number
    spellEntries: { model: number; mana: number; range: number; people: number; mode: number }[]
    reincarnation: boolean
    includeIncompleteBuildings: boolean
    pendingCommands: { opcode: number; args: number[] }[]
  }
  messages: MessageState
  flyby: Flyby
  inputMask: number
  lastMessage: number
  spellCasts: number[][]
  gifts: (Point & { kind: Shrine['kind']; remaining: number })[]
  giftCounts: Record<Spell, number>
  land: NativeTerrain & Territory
  landVersion: number
  lights: TerrainLights
  lightView: { x: number; y: number }
  lightRevision: number
  buildingFootprints: Map<number, RegisteredBuilding & { plan: boolean }>
  sceneryShadows: Map<number, SceneryShapePose>
  spellScan: SpellTargetScan
  castingTribes: TribeCasting[]
  manaWorld: ManaWorld
  manaTribes: (ManaTribe & TribeTurnState)[]
  manaNotices: { flags: number; message: number }[]
  tribeCount: number
  levelFlags2: number
  outcome: Omit<OutcomeWorld, 'turn' | 'landFlags' | 'playerTribe'> & {
    cameraTribe: number | null
    cameraRequest: number
    cameraPlaying: boolean
    completedLevel: number | null
    skyCounter: number
  }
  terrain: number[]
  terrainVersion: number
  units: Unit[]
  buildings: Building[]
  effects: Effect[]
  projectiles: Projectile[]
  shrines: Shrine[]
  trees: Tree[]
  replants: Replant[]
  indexedSearch: Uint8Array
  fights: Battle[]
  sounds: SoundEvent[]
  soundSerial: number
  mana: number
  wood: number
  shots: Record<Spell, number>
  charging: boolean
  unlockedCamp: boolean
  time: number
  turn: number
  attackAlert: number
  attackCell: number
  musicActivity: number
  pendingTime: number
  randomState: number
  cosmeticRandom: { randomState: number }
  effectCounter: number
  nextId: number
  footprints: Footprints
  selected: number[]
  mode: Spell | BuildingKind | null
  buildingDirections: Record<BuildingKind, number>
  paused: boolean
  speed: number
  message: string
  messageUntil: number
  status: 'playing' | 'won' | 'lost'
  respawn: number
  redRespawn: number
  stats: { built: number; cast: number; bridges: number; trained: number; battlesWon: number[] }
}
function planRoute(w: World, u: Unit, end: Point) {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  return planLivePath(w, u, end)
}
function route(w: World, u: Unit, end: Point) {
  cancelLiveResting(w, u)
  cancelLiveOrder(w, u)
  return acceptLivePath(w, u, planRoute(w, u, end))
}
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = {
    native: null,
    vault: null,
    x: p.x,
    z: p.z,
    id: w.nextId++,
    team,
    kind,
    hp: maxHp(kind),
    path: [],
    target: null,
    cooldown: 0,
    work: null,
    inside: null,
    cargo: 0,
    tree: null,
    timer: 0,
    guard: false,
    lift: 0,
    idleTurns: 0,
    heading: Math.PI,
    fighting: false,
    fight: null,
    casting: null,
  }
  w.units.push(u)
  return u
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
function missionAI() {
  const ai = {
    ...scriptState(originalScript),
    states: 0,
    flags: 0,
    enemyTribe: 0,
    defencePosition: 0,
    defenceRadius: 11,
    spellEntries: Array.from({ length: 8 }, () => ({
      model: 0,
      mana: 0,
      range: 0,
      people: 0,
      mode: 0,
    })),
    reincarnation: true,
    includeIncompleteBuildings: false,
    pendingCommands: [] as { opcode: number; args: number[] }[],
  }
  // ponytail: turn-zero setup only; bind the remaining commands and live reads before recurring execution.
  ai.attributes[43] = 12 // 0x461d70: attribute 43 before the turn-zero script.
  runScript(originalScript, ai, {
    turn: 0,
    tribe: 1,
    readInternal: id => {
      if (id === 0) return 0
      throw new Error(`Unbound initial script read ${id}`)
    },
    command: (opcode, args) => {
      // 0x48cc60: native state bits, and SET_REINCARNATION's disable flag at tribe+0x93d.
      if (opcode >= 1028 && opcode <= 1051 && opcode !== 1038 && opcode !== 1049) {
        const bit = 1 << (opcode - 1028)
        if (args[0] === 1022) ai.states |= bit
        else if (args[0] === 1023) ai.states &= ~bit
      } else if (opcode === 1164) {
        if (args[0] === 1022) ai.reincarnation = true
        else if (args[0] === 1023) ai.reincarnation = false
      } else ai.pendingCommands.push({ opcode, args })
    },
  })
  return ai
}
export function createWorld(): World {
  const w: World = {
    flyby: createFlyby(),
    inputMask: 128,
    lastMessage: -1,
    ai: missionAI(),
    messages: createMessages(),
    spellCasts: Array.from({ length: 4 }, () => Array(22).fill(0)),
    gifts: [],
    giftCounts: { blast: 0, bridge: 0, lightning: 0 },
    objectCells: { heads: new Uint16Array(16384), objects: new Map() },
    marching: [],
    buildingOrders: {
      records: Array.from({ length: 800 }, emptyPersonOrder),
      cursor: 1,
      active: 0,
    },
    motionRoutes: createMotionRoutes(),
    pathfinding: createLivePathfinding(),
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
    })),
    manaNotices: [],
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
    shots: { blast: 4, bridge: 0, lightning: 0 },
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
        o.owner === 0 ? 'blue' : 'red',
        o.model === 7 ? 'shaman' : o.model === 3 ? 'warrior' : 'brave',
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
    if (![1038, 1108, 1196].includes(c.opcode)) return true
    campaignCommand(w, c.opcode, c.args)
    return false
  })
  w.selected = [w.units.find(u => u.team === 'blue' && u.kind === 'shaman')!.id]
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, HOME)
  return w
}
// 0x492920: marker queries read the coarse vertex; odd coordinate bits are ignored.
export function nativeCellPoint(packed: number): Point {
  return browserPosition({ x: (packed & 254) << 8, y: packed & 0xfe00 })
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
// 0x4f2160 / 0x4f2900 share the same coarse cell lookup.
function headAt(w: World, x: number, y: number) {
  const p = nativeCellPoint(((y & 255) << 8) | (x & 255))
  return w.shrines.find(s => {
    const n = nativePosition(w, s),
      cell = nativeCellPoint((n.y & 0xff00) | ((n.x >>> 8) & 255))
    return cell.x === p.x && cell.z === p.z
  })
}
export function removeHead(w: World, x: number, y: number) {
  const head = headAt(w, x, y)
  if (!head) return
  w.shrines.splice(w.shrines.indexOf(head), 1)
  head.active = false
  for (const u of w.units) if (u.work === head.id) release(w, u)
}
// 0x4c14c0 increments these bytes during allocation, even if the spell later cancels.
export function recordSpellCast(w: World, tribe: number, model: number) {
  if (
    !Number.isInteger(tribe) ||
    tribe < 0 ||
    tribe > 3 ||
    !Number.isInteger(model) ||
    model < 0 ||
    model > 255
  ) {
    throw new RangeError('Invalid native spell identity')
  }
  if (model < 22) w.spellCasts[tribe][model] = (w.spellCasts[tribe][model] + 1) & 255
}

export function campaignInternal(w: World, id: number) {
  if (id === 0) return w.turn
  // 0x48f350: total population is a dword; per-class counters are signed words.
  if (id >= 1 && id <= 5) return campaignPersonCount(w, id === 1 ? 1 : id - 2)
  if (id >= 1146 && id <= 1175) {
    const tribe = id < 1152 ? 1 : Math.floor((id - 1152) / 6)
    const model = (id < 1152 ? id - 1146 : (id - 1152) % 6) + 2
    return short(campaignPersonCount(w, tribe, model))
  }
  if (id === 1050) return constants.SPELL_BLAST // 0x48f350 reads the loaded spell-cost table.
  // 0x48f350: self then four explicit tribes, 16 building models each.
  if (id >= 1066 && id <= 1145) {
    const tribe = id < 1082 ? 1 : Math.floor((id - 1082) / 16)
    const model = id < 1082 ? id - 1065 : ((id - 1082) % 16) + 1
    const value = campaignBuildingCount(w, tribe, model, w.ai.includeIncompleteBuildings)
    w.ai.includeIncompleteBuildings = false
    return value
  }
  // Native spell constants, including Blast, Lightning and Land Bridge.
  if (id >= 1184 && id <= 1199) return id - 1183
  if (id === 1200) return 18 // INT_M_KNOWLEDGE, preceding the person constants.
  if (id >= 1201 && id <= 1206) return id - 1199
  throw new Error(`Unbound campaign internal ${id}`)
}

// 0x4ecac0: active tribe followers count even while housed or selected by the AI.
// Ghosts and the remaining person classes are not represented by browser units yet.
export function campaignPersonCount(w: World, tribe: number, model?: number) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null
  return (
    w.units.filter(
      u =>
        u.team === team &&
        u.hp > 0 &&
        (model === undefined || (u.kind === 'brave' ? 2 : u.kind === 'warrior' ? 3 : 7) === model)
    ).length | 0
  )
}

// 0x4ecac0 counts completed buildings (state 2) separately from all live buildings.
// Browser progress is the current approximation of native building state.
export function campaignBuildingCount(
  w: World,
  tribe: number,
  model: number,
  includeIncomplete: boolean
) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null
  const count = w.buildings.filter(
    b =>
      b.team === team &&
      b.hp > 0 &&
      (includeIncomplete || b.progress >= 1) &&
      buildingModel(b) === model
  ).length
  return short(count)
}

// 0x48cc60 / 0x4fbf40: marker coordinates select a coarse cell, not a radius.
export function forceHead(w: World, marker: number) {
  if (!Number.isInteger(marker) || marker < 0 || marker >= level.markers.length)
    throw new RangeError('Invalid trigger marker')
  const packed = level.markers[marker],
    head = headAt(w, packed & 255, packed >>> 8)
  if (head) head.forced = true
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
      1038: 3,
      1108: 6,
      1196: 1,
      1076: 3,
      1077: 3,
      1085: 2,
      1131: 3,
      1136: 0,
      1151: 1,
      1171: 2,
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

  if (opcode === 1113) {
    w.inputMask &= ~128
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
  const index = script.fields[args.at(-1)!]?.[1]
  if (!Number.isInteger(index) || index < 0 || index >= 64) {
    throw new RangeError('Invalid campaign query destination')
  }
  w.ai.variables[index] = value | 0
}

const boundCampaignScript = {
  ...originalScript,
  codes: [
    12,
    1003,
    ...originalScript.codes.slice(564, 601),
    ...originalScript.codes.slice(625, 681),
    ...originalScript.codes.slice(936, 1505),
    1004,
    1019,
  ],
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
export function tell(w: World, message: string) {
  w.message = message
  w.messageUntil = w.time + 9
}
// Presentation events have their own serial; they never consume simulation IDs or random values.
// ponytail: retain 128 recent cues; a streaming consumer is needed if a catch-up frame exceeds that history.
export function sound(w: World, cue: number, p: Point, owner?: number) {
  const event: SoundEvent = {
    serial: ++w.soundSerial,
    cue,
    x: p.x,
    z: p.z,
    turn: w.turn,
    ...(owner === undefined ? {} : { owner }),
  }
  w.sounds.push(event)
  if (w.sounds.length > 128) w.sounds.shift()
  return event
}
function castVoice(w: World, u: Unit, spell: Spell) {
  sound(
    w,
    (u.team === 'blue'
      ? { blast: 0x76, lightning: 0x77, bridge: 0x80 }
      : { blast: 0x8c, lightning: 0x8d, bridge: 0x96 })[spell],
    u
  )
}
export function effect(w: World, kind: Effect['kind'], p: Point) {
  // Browser allocation adapter; full native class-7 allocation ownership is pending.
  // Debris (class 10) and fire (class 5) have separate native counters.
  if (kind !== 'debris' && kind !== 'fire' && kind !== 'orderMarker')
    w.effectCounter = (w.effectCounter + 1) & 255
  const f: Effect = {
    x: p.x,
    z: p.z,
    kind,
    id: w.nextId++,
    age: 0,
    duration:
      kind === 'bridge'
        ? constants.LAND_BRIDGE_DURATION / TURNS_PER_SECOND
        : kind === 'hit'
          ? 0.5
          : 1.7,
  }
  if (
    kind === 'blast' ||
    kind === 'lightning' ||
    kind === 'splash' ||
    kind === 'birth' ||
    kind === 'orderMarker'
  ) {
    // Effect 38: 0x509c10 grounds the flash (0x445c20), sets draw 30/HFX1099;
    // state 0x24 in 0x50a750 removes its object after nine simulation turns.
    // Lightning starts hidden: one pending turn, then eight turns of upper flash.
    const position = nativePosition(w, p)
    f.height = (terrainPointHeight(w.land, position) + (kind === 'lightning' ? 1024 : 0)) / 45
    f.turnsRemaining = kind === 'splash' || kind === 'birth' ? 16 : 9
    f.duration = f.turnsRemaining / TURNS_PER_SECOND
    f.animation = {
      object: 0,
      draw: 0,
      morph: 0,
      palette: 0,
      renderFlags: 0,
      f1: 0,
      f2: 0,
      stamp: 0,
      flags3: 0,
      morphTimer: 0,
      morphFrames: 0,
    }
    if (kind === 'orderMarker') {
      // 0x4afff0 overrides class-7/model-61: grounded HFX1294, lowered 160,
      // four processor visits. Secondary allocation preserves the class counter.
      f.height -= 160 / 45
      f.turnsRemaining = 4
      f.duration = 4 / TURNS_PER_SECOND
      f.sprite = { sequence: 'hit', frame: 0 }
      setAnimationObject(f.animation, 46, 1294)
    } else if (kind === 'birth') {
      // 0x404c80 overrides effect 60's initial draw 44/HFX1288 with 41/HFX1441.
      setAnimationObject(f.animation, 44, 1288)
      setAnimationObject(f.animation, 41, 1441)
    } else if (kind === 'splash') {
      // Effect 65, 0x513830: grounded draw 44/HFX1304, cue 44, sixteen turns.
      setAnimationObject(f.animation, 44, 1304)
      f.animation.morph = 0xd3
      f.animation.flags3 |= 0x40400
      sound(w, 0x2c, p)
    } else {
      setAnimationObject(f.animation, kind === 'blast' ? 30 : 41, kind === 'blast' ? 1099 : 0x650)
    }
  }
  w.effects.push(f)
  if (kind === 'blast') registerTerrainLight(w, f, 4)
  return f
}
function lightPosition(w: World, f: Effect) {
  return (
    f.fire ?? {
      ...nativePosition(w, f),
      h: Math.round((f.height ?? height(w.terrain, f.x, f.z)) * 45),
    }
  )
}
function registerTerrainLight(w: World, f: Effect, strength: number) {
  if (
    addTerrainLight(w.lights, {
      owner: f.id,
      strength,
      flicker: 4,
      flags: 0,
      position: lightPosition(w, f),
    })
  )
    refreshTerrainLights(w)
}
function refreshTerrainLights(w: World) {
  if (
    updateTerrainLights(
      w.land,
      w.lights,
      id => {
        const f = w.effects.find(f => f.id === id)
        return f && lightPosition(w, f)
      },
      w.lightView,
      w.randomState,
      true // Desktop rendering enables native dynamic landscape lighting.
    )
  )
    w.lightRevision++
}

export function canOrder(u: Unit) {
  return u.hp > 0 && !((unitAnimationSource(u)?.flags2 ?? 0) & 0x100000)
}

export function select(w: World, kind: UnitKind | 'all') {
  setSelection(
    w,
    w.units
      .filter(u => u.team === 'blue' && canOrder(u) && (kind === 'all' || u.kind === kind))
      .map(u => u.id)
  )
  w.mode = null
}

export function selectionPeople(w: World, units = w.units) {
  const selected = new Set(w.selected)
  return units
    .filter(u => u.team === 'blue' && u.hp > 0)
    .map(u => {
      // Selection must not create a simulation owner before a real controller handoff.
      const p = unitAnimationSource(u) ??
        u.native ??
        u.entry?.person ??
        u.builder?.person ?? {
          id: u.id,
          flags3: 0,
          flags4: 0,
          selectionFlags: 0,
        }
      // The displayed roster owns selection until every native input producer is live.
      p.selectionFlags = (p.selectionFlags & ~128) | (selected.has(u.id) ? 128 : 0)
      return p
    })
}

// HUD queries read active positions without taking ownership of legacy simulation.
export function hudPeople(w: World) {
  const selected = new Set(w.selected)
  return w.units
    .filter(u => u.team === 'blue' && u.hp > 0)
    .map(u => {
      const active = unitAnimationSource(u) ?? u.native ?? u.entry?.person
      const source = active ?? u.builder?.person
      const point = active ?? nativePosition(w, u)
      return {
        id: u.id,
        model: nativePersonModel(u),
        x: point.x,
        y: point.y,
        assignment: source?.assignment ?? 0,
        flags3: source?.flags3 ?? 0,
        flags4: source?.flags4 ?? 0,
        selectionFlags: ((source?.selectionFlags ?? 0) & ~128) | (selected.has(u.id) ? 128 : 0),
        source,
      }
    })
}

export function selectFollowers(
  w: World,
  model: number,
  point: { x: number; y: number },
  mode: HudSelectionMode
) {
  const people = hudPeople(w)
  const result = selectHudPeople(people, model, point, mode, !!(w.castingTribes[0].flags & 128))
  for (const p of people)
    if (p.source) {
      p.source.flags3 = p.flags3
      p.source.selectionFlags = p.selectionFlags
    }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  w.mode = null
  const speaker = w.units.find(u => u.id === result.speaker)
  if (speaker) for (const cue of result.cues) sound(w, cue, speaker)
}

export function setSelection(w: World, ids: number[]) {
  const selected = new Set(ids)
  const people = selectionPeople(w)
  for (const p of people) {
    const next = selected.has(p.id) && !(p.flags4 & 128)
    if (next !== !!(p.selectionFlags & 128)) markPersonSelected(p, next)
  }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
}

export function selectUnit(w: World, id: number, extend: boolean) {
  const people = selectionPeople(w)
  const newlySelected = clickPersonSelection(people, id, extend)
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  if (newlySelected) {
    const u = w.units.find(unit => unit.id === id)!
    sound(w, selectedPersonVoice(nativePersonModel(u)), u)
  }
}

export function selectArea(
  w: World,
  start: { x: number; y: number },
  packed: number,
  extend: boolean
) {
  const wrapped = dragCommandCorners(start, packed)
  const corners = unwrapDragCorners(wrapped),
    bounds = dragCellBounds(wrapped, (packed & 1023) * 2)
  const people = selectionPeople(w)
  const ids = new Set(
    w.units
      .filter(u => {
        if (u.team !== 'blue' || u.hp <= 0) return false
        const active = unitAnimationSource(u) ?? u.native ?? u.entry?.person
        const p = active ?? u.builder?.person
        // Registered native occupants retain their actual land-list membership.
        // Legacy people have no list owner yet; keep their existing occupancy gate.
        if (p && w.objectCells.objects.get(u.id) === p) {
          if (!(p.flags2 & 0x20000)) return false
        } else if (u.inside !== null) return false
        const point = active ?? nativePosition(w, u)
        if (!inDragCells(point, bounds) || !inDragSelection(point, corners)) return false
        if (!p) return true
        const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
        const b =
          w.land.flags[cell] & 512
            ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
            : undefined
        return canDragPerson(
          p,
          currentPersonOrder(w.buildingOrders, p),
          b && {
            model: buildingModel(b),
            state: b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
          }
        )
      })
      .map(u => u.id)
  )
  const eligible = new Set(people.filter(p => ids.has(p.id) && !(p.flags4 & 128)).map(p => p.id))
  // The original clears the previous group only after finding an eligible member.
  if (!eligible.size) return
  if (!extend) for (const p of people) markPersonSelected(p, false)
  for (const p of people) if (eligible.has(p.id)) markPersonSelected(p, true)
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  const selected = new Set(w.selected),
    group = w.units.filter(u => selected.has(u.id))
  const speaker = w.units.findLast(u => eligible.has(u.id))!
  for (const cue of selectedGroupVoices(group.map(nativePersonModel))) sound(w, cue, speaker)
}

// Native right-click/Escape cancels a targeting mode before clearing followers.
export function cancelInteraction(w: World) {
  if (w.mode) {
    w.mode = null
    return
  }
  if (!w.selected.length) return
  const selected = new Set(w.selected)
  for (const u of w.units) {
    if (u.team !== 'blue') continue
    // The displayed roster still owns selection across the legacy/native boundary.
    // Clear every retained representation so resuming work cannot resurrect it.
    for (const p of new Set([
      u.native,
      u.flight,
      u.fight?.motion,
      u.entry?.person,
      u.builder?.person,
    ])) {
      if (!p) continue
      p.selectionFlags = (p.selectionFlags & ~128) | (selected.has(u.id) ? 128 : 0)
      deselectPerson(p)
    }
  }
  w.selected = []
}

function release(w: World, u: Unit, preserveOrders = false) {
  const occupant = u.inside !== null ? leaveLiveBuilding(w, u) : undefined
  u.inside = null
  releaseTasks(w, u, preserveOrders)
  return occupant
}
export function releaseTasks(w: World, u: Unit, preserveOrders = false) {
  cancelLiveResting(w, u)
  if (!preserveOrders) {
    cancelLiveBuildingAttack(w, u)
    cancelLiveOrder(w, u)
  }
  cancelBuildingEntry(w, u)
  clearLivePath(w, u)
  u.vault = null
  u.work = null
  u.tree = null
  u.harvest = undefined
  u.delivery = undefined
  u.builder = undefined
  u.target = null
  u.guard = false
  u.timer = 0
  u.casting = null
  u.fighting = false
  clearFightAssignment(u)
  u.idleTurns = 0
}
export { buildingModel } from './building-shapes.ts'
export function buildingStage(b: Building) {
  // The browser stores native plan work as a fraction of the model
  // capacity; complete plan allocation and order dispatch remain separate.
  const life = rules.buildingLife[buildingModel(b)]
  return b.damageState?.stage ?? buildingWorkStage(Math.trunc(b.progress * life), life)
}
// Share the displayed object identity with native footprint/entrance lookup.
export function buildingObject(b: Pick<Building, 'kind' | 'team' | 'level' | 'object'>) {
  if (b.object !== undefined) return b.object
  // Older browser state retains its previously displayed family.
  const tribe = b.team === 'blue' ? 0 : 1
  if (b.kind === 'hut') return 131 + tribe * 3 + b.level - 1
  return rules.buildingObjects[buildingModel(b)] + tribe
}

export function buildingPose(b: Building) {
  return {
    object: buildingObject(b),
    angle: Math.round((b.angle * 2048) / (Math.PI * 2)) & 2047,
    anchorX: b.anchor?.x ?? Math.round((b.x + 8) * 256) & 0xfe00,
    anchorY: b.anchor?.y ?? Math.round((-b.z - 8) * 256) & 0xfe00,
  }
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
function constructionWorkers(w: World, b: Building) {
  const slots = (b.builders ??= Array<number>(rules.buildingMaxWorkers[buildingModel(b)]).fill(0))
  const workers = new Map(
    w.units
      .filter(
        u =>
          u.work === b.id &&
          u.hp > 0 &&
          u.team === b.team &&
          u.kind === 'brave' &&
          !((b.admission?.activity ?? 0) & 0x8000) &&
          !isDismantling(w, u) &&
          (b.progress < 1 || u.builder)
      )
      .map(u => [u.id, u])
  )
  pruneBuilders(slots, id => workers.has(id))
  for (const u of workers.values()) if (!assignBuilder(slots, u.id)) release(w, u)
  return slots.filter(Boolean).map(id => workers.get(id)!)
}

function dispatchConstructionCrew(w: World, b: Building, workers: Unit[]) {
  const state = b.damageState?.plan,
    plan = {
      model: buildingModel(b),
      counter: b.counter,
      burning: !!b.burn,
      work: state?.remaining ?? Math.round(b.progress * rules.buildingLife[buildingModel(b)]),
      repairDelay: state?.repairDelay ?? 0,
    }
  const crew = workers.map(u => {
    // Existing hauling orders may attach directly; player commands explicitly
    // begin task 1 and retain their carried timber until its arrival/drop consumer.
    u.builder ??= {
      task: u.cargo || u.tree !== null ? BuilderTask.Fetch : BuilderTask.Approach,
      busy: 0,
      phase: 0,
      restart: true,
    }
    if (u.builder.task === BuilderTask.Work && (u.cargo || u.tree !== null))
      u.builder.task = BuilderTask.Fetch
    return u.builder
  })
  const finished = stepConstructionCrew(plan, crew, {
    evacuate: worker => release(w, workers.find(u => u.builder === worker)!),
    resume: () => {
      const area = buildingRepairArea(buildingPose(b)),
        cells = new Set(area.cells)
      for (const fx of w.effects) {
        const smoke = fx.smoke
        if (
          smoke &&
          smoke.lifetime > 0 &&
          cells.has(((smoke.y & 65535) >> 9) * 128 + ((smoke.x & 65535) >> 9))
        )
          smoke.lifetime = 16
      }
      queueTerrain(w.land, area.center, area.radius, 1, terrainTextures)
      processTerrain(w.land, terrainTextures)
    },
  })
  if (state) state.repairDelay = plan.repairDelay
  if (finished) {
    workers.forEach(u => release(w, u))
    b.builders!.fill(0)
  }
  return workers.filter(u => u.builder?.task === BuilderTask.Fetch)
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
    workers.forEach(u => release(w, u))
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
  haulBuildingWood(
    w,
    b,
    workers.filter(u => u.builder?.task === BuilderTask.Fetch),
    true
  )
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
    else route(w, u, browserPosition(to))
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
  if (task.task === BuilderTask.ClearScenery) {
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
        model: u.kind === 'shaman' ? 7 : u.kind === 'warrior' ? 3 : 2,
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
export function command(w: World, p: Point) {
  if (w.paused || w.status !== 'playing') return
  const shrine = w.shrines.find(s => s.active && distance(s, p) < 3),
    building = w.buildings.find(b => distance(b, p) < 3.1)
  const enemy =
    w.units.find(
      u => u.team === 'red' && u.hp > 0 && u.inside === null && u.lift === 0 && distance(u, p) < 1.5
    ) ?? (building?.team === 'red' ? building : undefined)
  const friendly = building?.team === 'blue' ? building : undefined,
    dismantling = !!((friendly?.admission?.activity ?? 0) & 0x8000)
  syncNativeTerrain(w)
  const headOrder = shrine && shrine.kind !== 'vault' ? worshipOrder(w, shrine) : 0
  const moveOrder = !shrine && !friendly && !enemy ? movementOrder(w, nativePosition(w, p)) : 0
  if (
    (shrine && shrine.kind !== 'vault' && !headOrder) ||
    (!shrine && !friendly && !enemy && !moveOrder)
  ) {
    tell(w, 'No command slots available.')
    return
  }
  let count = 0,
    constructionFull = false
  if (friendly && friendly.progress < 1 && !dismantling) constructionWorkers(w, friendly)
  for (const u of w.units.filter(u => canOrder(u) && w.selected.includes(u.id))) {
    if (shrine && shrine.kind === 'vault' && u.kind !== 'shaman') continue
    if (
      friendly &&
      (friendly.progress < 1 || !['hut', 'camp', 'tower'].includes(friendly.kind)) &&
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
          : (enemy ?? p)
    const path = planRoute(w, u, goal)
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
      else if (friendly.kind === 'tower') message = 'Followers sent to occupy the guard tower.'
      else message = 'Braves sent to live in the hut.'
    } else if (enemy) message = 'Your followers march to battle.'
  } else if (constructionFull) message = 'This building already has its full construction crew.'
  else if (shrine?.kind === 'vault')
    message = 'Select your shaman to worship the Vault of Knowledge.'
  tell(w, message)
}

function processVaultTask(w: World, u: Unit) {
  const task = u.vault!
  const head = w.shrines.find(s => s.id === task.head)
  if (!head) {
    release(w, u)
    return
  }
  // ponytail: native approach/pathfinding and shape entry coordinates still use browser routes.
  const door = entrance(w, head, 2)
  if (task.phase === 1) {
    if (u.path.length) return
    if (distance(u, door) > 0.1) {
      route(w, u, door)
      return
    }
    task.phase = 2
    task.entering = true
  }
  const goal = task.phase === 4 ? head : task.phase === 9 ? entrance(w, head, 6) : door
  const arrived =
    Math.abs(Math.round(goal.x * 256) - Math.round(u.x * 256)) <= 11 &&
    Math.abs(Math.round(goal.z * 256) - Math.round(u.z * 256)) <= 11
  const previous = task.phase
  const { done, actions } = stepVaultTask(task, arrived, head.work >= head.target, head.active)
  for (const action of actions) {
    if (action === 'enter' || action === 'exit' || action === 'leave') route(w, u, goal)
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
  }
  if (previous === 3 && task.phase === 4) {
    head.model = 153
    head.morph = null
  }
  if (done) release(w, u)
}

export function guardShaman(w: World) {
  const shaman = w.units.find(u => u.team === 'blue' && canOrder(u) && u.kind === 'shaman')
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
  for (const { u } of workers) {
    assignBuilder(b.builders, u.id)
    release(w, u)
    u.work = b.id
    u.builder = { task: BuilderTask.Approach, busy: 0, phase: 0, restart: true }
    route(w, u, entrance(w, b))
  }
  w.mode = null
  tell(w, `${spec.name} planned. Braves will fetch ${spec.cost} logs from nearby trees.`)
  return true
}
// Shared browser target adapter: cursor feedback and click rejection must agree.
// Native person flags and complete globe targeting are still being integrated.
export function spellTargetError(w: World, spell: Spell, p: Point) {
  const spec = SPELLS.find(s => s.id === spell),
    shaman = w.units.find(u => u.team === 'blue' && canOrder(u) && u.kind === 'shaman')
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
        : 'Worship the stone head to receive this spell.'
    )
    return false
  }
  if (error) {
    tell(w, error.message)
    return false
  }
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')!
  release(w, shaman)
  shaman.heading = Math.atan2(p.x - shaman.x, p.z - shaman.z)
  beginCast(w, shaman, spell, p)
  w.mode = null
  return true
}
// ponytail: browser occupancy supplies the cell's building until native terrain
// object lists and person flags are integrated. Range/payment override flags
// are stored per tribe.
function spellCaster(w: World, u: Unit): SpellCaster {
  const b = w.buildings.find(b => b.id === u.inside)
  return {
    height: nativePosition(w, u).h,
    flags2: u.inside === null ? 0 : 0x800000,
    building: b ? { class: 2, model: buildingModel(b), state: b.progress === 1 ? 2 : 1 } : null,
  }
}
export function spellRange(w: World, u: Unit, model: number) {
  return (
    nativeSpellRange(
      w.manaWorld.gameFlags,
      w.castingTribes[u.team === 'blue' ? 0 : 1].flags,
      spellCaster(w, u),
      model
    ) / 256
  )
}
export function spellInRange(w: World, u: Unit, model: number, target: Point) {
  return (
    positionDistance(nativePosition(w, u), nativePosition(w, target)) <=
    spellRange(w, u, model) * 256
  )
}
// ponytail: browser unit arrays supply cell order until native terrain lists and
// person records are live. Blast scoring does not consume terrain flags.
function computerSpellPerson(w: World, u: Unit): SpellTargetUnit {
  const p = nativePosition(w, u)
  return {
    class: 1,
    model: u.team === 'wild' ? 1 : u.kind === 'shaman' ? 7 : u.kind === 'warrior' ? 3 : 2,
    state: 0,
    tribe: u.team === 'wild' ? -1 : u.team === 'blue' ? 0 : 1,
    x: p.x,
    y: p.y,
    flags2: u.inside === null ? 0 : 0x800000,
    flags4: 0,
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
    terrainFlags: () => {
      throw new Error('Native terrain occupancy flags are not integrated')
    },
  }
}
const nativeCellIndex = (cell: number) => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
const terrainTextures = { surface: () => {}, globe: () => {} }
// ponytail: construction/deformation still write the cropped browser grid.
// Feed its native vertices through the recovered queue until those producers
// write the full native map directly; interpolated browser vertices are ignored.
function notifyHeightChange(w: World, cell: number, radius: number) {
  const objects = new Map<number, number[]>()
  const add = (o: Point & { id: number }) => {
    const p = nativePosition(w, o),
      i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const row = objects.get(i) ?? []
    row.push(o.id)
    objects.set(i, row)
  }
  w.units.filter(u => u.hp > 0 && u.inside === null).forEach(add)
  w.trees.filter(t => t.logs > 0).forEach(add)
  w.effects.forEach(add)
  notifyTerrainObjects(
    w.land,
    cell,
    radius,
    i => objects.get(i) ?? [],
    id => {
      const b = w.buildings.find(b => (b.id & 1023) === id)
      if (b?.preparation) b.preparation.revalidate = true
      else if (b && b.hp > 0) {
        b.terrainState ??= { flooded: 0, delay: 0, reason: 0, dirty: true }
        b.terrainState.dirty = true
      }
      if (b?.damageState) b.damageState.flags2 |= 4
      const u = w.units.find(u => u.id === id)
      if (u?.native) u.native.flags2 |= 4
      if (u?.builder?.person) u.builder.person.flags2 |= 4
      const fx = w.effects.find(fx => fx.id === id)
      if (fx?.fire) fx.fire.groundDirty = true
      if (fx?.smoke) fx.smoke.flags2 |= 4
      // Rendered tree heights already follow landVersion. Global route
      // invalidation remains with the native command/movement integration.
    }
  )
}
function syncNativeTerrain(w: World) {
  if (w.landVersion === w.terrainVersion) return
  const changed: number[] = []
  for (let z = -48; z <= 48; z += 2)
    for (let x = -48; x <= 48; x += 2) {
      const p = nativePosition(w, { x, z }),
        cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
        i = nativeCellIndex(cell)
      const h = short(Math.max(0, p.h))
      if (w.land.heights[i] !== h) {
        w.land.heights[i] = h
        changed.push(cell)
      }
    }
  for (const cell of changed) queueTerrain(w.land, cell, 1, 0, terrainTextures)
  processTerrain(w.land, terrainTextures)
  for (const cell of changed) {
    updateWalkMasks(w.land, cell, 1)
    notifyHeightChange(w, cell, 1)
  }
  w.landVersion = w.terrainVersion
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
  const u = w.units.find(u => u.team === 'red' && u.kind === 'shaman' && u.hp > 0)
  const caster = u
    ? {
        ...spellCaster(w, u),
        ...nativePosition(w, u),
        state: 0,
        flags4: 0,
        landIndex: 0,
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
  }
  // ponytail: native person action states and attack-group reserves remain
  // adapters; the first mission supplies the opening three person classes.
  const able = !!u && !u.lift && !u.fight && !u.casting
  const shore =
    able &&
    castShoreBlast(
      world,
      caster,
      {
        turn: w.turn,
        population: w.units.filter(p => p.team === 'red' && p.hp > 0).length,
        mana: w.manaTribes[1].mana,
        reserve: 0,
        gameFlags: w.manaWorld.gameFlags,
        aiFlags: w.ai.flags,
      },
      { categoryFlags, cast: allocate }
    )
  refreshTribeTerritory(w, 1)
  if (shore) return
  // Transport existing action guards through the native cast-block bit until
  // the person-state adapter supplies original states and flags directly.
  if (caster && !able) caster.flags4 |= 0x400
  const enemyTeam = w.ai.enemyTribe === 0 ? 'blue' : w.ai.enemyTribe === 1 ? 'red' : null
  const enemy = w.units.find(p => p.team === enemyTeam && p.kind === 'shaman' && p.hp > 0)
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
  notifyHeightChange(w, cell, 1)
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
  // rebuild. The opening classes currently use living browser followers.
  const tribes = w.manaTribes.map((t, id) => {
    const team = id === 0 ? 'blue' : id === 1 ? 'red' : null
    const people = w.units
      .filter(u => u.team === team && u.hp > 0)
      .map(unit => ({
        unit,
        model: unit.kind === 'shaman' ? 7 : unit.kind === 'warrior' ? 3 : 2,
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
function beginCast(w: World, u: Unit, spell: Spell, p: Point) {
  // 0x4f4de0 targets the center of a native 2x2 cell and spends the charge on allocation.
  const target = { x: Math.floor(p.x / 2) * 2 + 1, z: -Math.floor(-p.z / 2) * 2 - 1 },
    position = nativePosition(w, u)
  const tribe = u.team === 'blue' ? 0 : 1,
    model = SPELLS.find(s => s.id === spell)!.model
  if (tribe === 0) w.manaWorld.spells[0].stocks[model] = w.shots[spell]
  const state = w.castingTribes[tribe],
    price = prepareSpellPayment(w.manaWorld, tribe, state.flags, model)
  w.projectiles.push({
    id: w.nextId++,
    spell,
    team: u.team,
    caster: u.id,
    target,
    source: { x: u.x, z: u.z },
    position,
    destination: nativePosition(w, target),
    origin: { ...position },
    phase: 'windup',
    remaining: 6,
    turns: 0,
    visuals: [],
  })
  debitSpellMana(w.manaTribes[tribe], state.flags, price)
  registerSpellCooldown(
    state,
    w.manaTribes[tribe].playerType,
    tribe === 1 ? w.ai.flags : 0,
    w.manaWorld.gameFlags,
    0,
    model
  )
  if (tribe === 1) state.aiCooldown = w.ai.attributes[43] & 255 // 0x4f4de0, after allocation.
  recordSpellCast(w, tribe, model)
  if (u.team === 'blue') {
    w.shots[spell] = w.manaWorld.spells[0].stocks[model] & 15
    w.giftCounts[spell] = Math.max(0, w.giftCounts[spell] - 1)
    w.stats.cast++
  }
  u.casting = { spell, point: target, remaining: 6 / TURNS_PER_SECOND }
  castVoice(w, u, spell)
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

// 0x511ae0's first bolt turn: ignite burnable scenery in the target cell;
// without scenery, create the short-lived, cell-centered fire instead.
function igniteLightningScenery(w: World, target: NativePoint, tribe: number) {
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
    const caster = w.units.find(u => u.team === shot.team && u.kind === 'shaman' && u.hp > 0)
    const remove = () => {
      w.projectiles.splice(w.projectiles.indexOf(shot), 1)
      for (const f of shot.visuals) f.duration = f.age
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
      if (caster)
        finishCast(w, { id: shot.caster, team: shot.team, ...shot.source }, shot.spell, shot.target)
      remove()
      continue
    }
    const p = shot.position,
      d = shot.destination
    if (shot.spell === 'blast') {
      // 0x4bb440: move 1000 units/turn, snap inside the arrival sphere, delete next turn.
      if (
        Math.abs(d.x - p.x) < 0x408 &&
        Math.abs(d.y - p.y) < 0x408 &&
        Math.abs(d.h - p.h) < 0x408 &&
        nativeDistance(p, d) < 1000
      ) {
        shot.position = { ...d }
        shot.phase = 'arrived'
        // 0x4bb440 removes the four attached tails, but the shot's own head
        // reaches the target and remains visible until deletion on its next visit.
        moveVisual(shot.visuals[0], d)
        for (const f of shot.visuals.slice(1)) f.duration = f.age
        continue
      }
      const [yaw, pitch] = shotAngles(p, d)
      shot.position = nativeStep3D(p, yaw, pitch, 1000)
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
      if (shot.turns > 0)
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
        if (Math.abs(d.x - p.x) < 108 && Math.abs(d.y - p.y) < 108 && Math.abs(d.h - p.h) < 108) {
          if (caster)
            finishCast(
              w,
              { id: shot.caster, team: shot.team, ...shot.source },
              shot.spell,
              shot.target,
              shot.destination
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
// still supplies cell order; complete mixed-class lists and shake rendering remain open.
function stepLiveBlastWave(w: World, wave: BlastWave) {
  syncLandscapeObjects(w)
  const units = new Map(
    w.units.filter(u => u.hp > 0 || u.flight || u.native?.state === 44).map(u => [u.id, u])
  )
  const buildings = new Map(w.buildings.filter(b => b.hp > 0).map(b => [b.id, b]))
  const cells = new Map<number, BlastTarget[]>()
  const records = new Map<number, BlastTarget>()
  const people = new Map<number, LivePerson>()
  const add = (p: BlastTarget) => {
    records.set(p.id, p)
    const index = (p.y >> 9) * 128 + (p.x >> 9)
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
  for (const b of buildings.values()) {
    const position = nativePosition(w, b)
    add({
      ...position,
      id: b.id,
      class: 2,
      model: buildingModel(b),
      tribe: b.team === 'blue' ? 0 : 1,
      state: b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      previousState: 0,
      flags2: b.damageState?.flags2 ?? 0,
      flags3: b.damageState?.flags3 ?? 0,
      flags4: 0,
      velocity: { x: 0, y: 0, z: 0 },
      vehicle: 0,
      burnTrail: 0,
      life: 0,
      shake: 0,
      shakeOrigin: 0,
    })
  }
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
      panic: () => {
        throw new Error('Live panic waves require the state-26 controller')
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
  w.randomState = state.randomState
  return alive
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
  const upper = spell === 'lightning' && endpoint ? browserPosition(endpoint) : p,
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
  }
  if (spell === 'bridge') {
    fx.bridge = createLandBridge(nativePosition(w, shaman), nativePosition(w, p))
    fx.team = shaman.team
    fx.duration = Infinity
    w.stats.bridges++
    tell(w, 'The earth rises. Lead your followers across the new Land Bridge.')
  } else {
    if (shaman.team === 'blue')
      tell(w, `${SPELLS.find(s => s.id === spell)!.name}! The world bends to your will.`)
  }
}
// ponytail: current braves/warriors/shaman use the live order adapter. Replace it
// with native person records/order ownership when that lifecycle is integrated.
const liveManaOrders = { records: [], cursor: 1, active: 0 }
function manaPeople(w: World) {
  return w.units.map(
    u =>
      u.native ?? {
        class: 1,
        model: u.team === 'wild' ? 1 : u.kind === 'shaman' ? 7 : u.kind === 'warrior' ? 3 : 2,
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

// Shared hauling adapter; automatic resource search and full person-command ownership remain open.
function haulBuildingWood(w: World, b: Building, workers: Unit[], constructing: boolean) {
  for (const u of workers) {
    if (constructing && b.progress === 1) break
    if (u.cargo && atBuildingEntrance(w, u, b) && !u.path.length) {
      if (b.progress === 1) {
        const point = buildingDoor(b)
        w.trees.push({ ...point, id: w.nextId++, model: 11, logs: u.cargo })
        sound(w, 0xb, u)
        u.cargo = 0
      } else {
        u.delivery ??= { remaining: 8 }
        if (!stepTimberDelivery(u.delivery)) continue
        const capacity = b.preparation
            ? rules.buildingPreparationWork[buildingModel(b)]
            : rules.buildingLife[buildingModel(b)],
          work =
            b.preparation?.work ??
            b.damageState?.plan.remaining ??
            Math.round(b.progress * capacity),
          amount = timberTransfer(
            Math.round(u.cargo * 100),
            work,
            capacity,
            Math.round(u.cargo * 100)
          )
        if (b.preparation) b.preparation.work = work + amount
        else b.progress = (work + amount) / capacity
        b.logs = (work + amount) / 100
        u.cargo -= amount / 100
        if (b.damageState) {
          const state = b.damageState
          changeBuildingWork(state.plan, amount, state, null, {
            move: () => {},
            release: () => {},
            init: () => {},
          })
          b.hp = buildingHp(b.kind) * b.progress
        }
      }
      u.delivery = undefined
      u.tree = null
      if (constructing && u.builder) {
        u.builder.task = BuilderTask.Work
        u.builder.restart = true
        continue
      }
    }
    if (b.progress < 1 && !u.cargo && u.tree === null) {
      const tree = findBuildingWood(w, u, b)
      if (tree) {
        u.tree = tree.id
        route(w, u, tree)
        u.timer = 0
      }
    }
    if (u.tree !== null && !u.cargo) {
      const tree = w.trees.find(t => t.id === u.tree)
      if (!tree) {
        u.tree = null
        u.harvest = undefined
        continue
      }
      if (distance(u, tree) < 1 && !u.path.length) {
        if (!u.harvest) {
          u.harvest = startTimberHarvest(2, tree.model)
          sound(w, 1, u)
        }
        if (stepTimberHarvest(u.harvest)) {
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
          if (!u.cargo) u.tree = null
          u.harvest = undefined
          route(w, u, entrance(w, b))
        } else if (tree.model === 11) sound(w, 10, u)
      }
    }
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
          stepComputerSpells(w)
        },
      }
    )
  const dt = 1 / TURNS_PER_SECOND
  w.turn = (w.turn + 1) >>> 0
  w.musicActivity = 0 // 0x4ec6f0: current object turn owns the music activity.
  w.time = w.turn / TURNS_PER_SECOND
  // 0x4ec6f0 resets per-turn route requests and search counters before objects.
  w.pathfinding.solver.tribeRequests.fill(0)
  w.pathfinding.state.searches = 0
  Object.assign(w.pathfinding.solver, { attempts: 0, detours: 0, steps: 0, limited: 0 })
  stepOutcome(w) // 0x4ec6f0: after increment, before this turn's object work.
  // 0x4facf0: auto-collected reward objects grant knowledge/stock after 82 object turns.
  for (const gift of w.gifts) {
    if (--gift.remaining !== 0) continue
    effect(w, 'birth', gift)
    if (gift.kind === 'vault') {
      w.unlockedCamp = true
      tell(w, 'Knowledge discovered: build a Warrior Training Hut, then send braves inside.')
    } else {
      // 0x4c2cd0: stocks already at/above the cap are unchanged.
      if (w.shots[gift.kind] < 4) w.shots[gift.kind]++
      // 0x4c2aa0: the separate gift counter increases even at full stock.
      w.giftCounts[gift.kind] = Math.min(15, w.giftCounts[gift.kind] + 1)
      tell(
        w,
        `${gift.kind === 'bridge' ? 'Land Bridge' : 'Lightning'} received. ${w.shots[gift.kind]} shots ready.`
      )
    }
  }
  w.gifts = w.gifts.filter(g => g.remaining > 0)
  stepScenery(w)
  // New class-7 effects are inserted before the current native list cursor;
  // their first processor visit belongs to the following simulation turn.
  const effectCount = w.effects.length
  for (let index = 0; index < effectCount; index++) {
    const fx = w.effects[index]
    fx.age += dt
    if (fx.turnsRemaining !== undefined && --fx.turnsRemaining === 0) fx.duration = fx.age
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
        for (const cell of changed) {
          updateWalkMasks(w.land, cell, 3)
          notifyHeightChange(w, cell, 2)
        }
        refreshTerrainSurface(w)
      }
      if (!alive) fx.duration = fx.age
    }
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
      const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
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
      w.gifts.push({ kind: shrine.kind, x: shrine.x, z: shrine.z, remaining: 82 })
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
    const camps = w.buildings.filter(
      b => b.team === team && b.kind === 'camp' && b.progress === 1 && b.hp > 0
    )
    const buildings = camps.map(b => buildingAdmission(w, b))
    distributeMana(w.manaWorld, tribe, buildings, {
      // 0x499970 only permits its tutorial reminder on original levels 6–10.
      shouldNotifyFull: () => false,
      notify: (flags, message) => {
        // ponytail: retain native requests until tutorial gating/presentation is ported.
        if (!w.manaNotices.some(n => n.flags === flags)) w.manaNotices.push({ flags, message })
      },
    })
    buildings.forEach((b, i) => {
      camps[i].timer = b.storedMana
    })
  }
  w.shots.blast = w.manaWorld.spells[0].stocks[2] & 15
  w.mana = w.manaTribes[0].spellProgress[2] / 1000
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
      haulBuildingWood(w, b, dispatchConstructionCrew(w, b, workers), true)
      if (wasIncomplete && b.progress === 1) {
        if (!b.upgrading && !b.damageState) w.stats.built++
        b.upgrading = false
        if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
        tell(w, `${BUILDINGS.find(s => s.id === b.kind)!.name} completed.`)
      }
      if (wasIncomplete) continue
    }
    if (b.kind === 'camp') {
      stepLiveTraining(w, b)
    } else if (b.kind === 'hut') {
      if (
        !(w.manaWorld.gameFlags & 32) &&
        stepHutBirth(
          b,
          inhabitants.length,
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
      haulBuildingWood(w, b, haulers, false)
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
    if (u.flight) {
      stepLiveImpulse(w, u)
      continue
    }
    if (u.hp <= 0) continue
    u.cooldown = Math.max(0, u.cooldown - dt)
    if (u.native?.state === 41 || u.native?.state === 26) {
      stepLivePerson(w, u)
      continue
    }
    if (!supportsFollower(w, u)) {
      u.hp = 0
      continue
    }
    if (u.fight) {
      if (u.fight.motion) stepLiveMeleeMotion(w, u)
      continue
    }
    if (u.native?.commandStatus === 19) {
      const building = liveBuildingAttackTarget(w, u.native)
      if (building) {
        stepLiveBuildingAttack(w, u, building)
        continue
      }
      cancelLiveBuildingAttack(w, u)
      u.target = null
    }
    if (u.casting) {
      u.casting.remaining -= dt
      if (u.casting.remaining <= 1e-8) u.casting = null
      continue
    }
    if (u.vault) processVaultTask(w, u)
    const work =
      w.buildings.find(b => b.id === u.work && b.hp > 0) ??
      w.shrines.find(s => s.id === u.work && (s.active || u.vault?.head === s.id))
    if (u.work !== null && !work) release(w, u)
    if (isDismantling(w, u) && work && 'hp' in work) {
      stepBuildingEntry(w, u, work)
      continue
    }
    if (u.inside !== null) {
      const b = w.buildings.find(b => b.id === u.inside && b.hp > 0)
      if (b) {
        if ((b.kind === 'camp' || b.kind === 'tower') && u.entry) stepBuildingEntry(w, u, b)
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
    if (
      work &&
      'kind' in work &&
      'hp' in work &&
      work.progress === 1 &&
      !work.burn &&
      !u.builder &&
      !u.path.length &&
      atBuildingEntrance(w, u, work)
    ) {
      const capacity = housing(work)
      if (w.units.filter(a => a.inside === work.id).length < capacity) {
        u.inside = work.id
        continue
      }
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
      target = automaticMeleeTarget(w, u)
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
          target.hp -= meleeDamage(u)
          u.cooldown = (u.kind === 'shaman' ? 4 : 6) / TURNS_PER_SECOND
          effect(w, 'hit', target)
        }
      } else contacts.push([u, target])
      continue
    }
    if (u.guard && !u.path.length) {
      const shaman = w.units.find(a => a.team === u.team && a.kind === 'shaman')
      if (shaman && distance(u, shaman) > 3) route(w, u, entrance(w, shaman, 2))
    }
    if (builderActivity(u) && work && 'hp' in work) processBuilderWork(w, u, work)
    if (u.native && [3, 27].includes(u.native.commandStatus)) {
      stepLiveMovement(w, u)
    } else if (
      u.team !== 'wild' &&
      !work &&
      !target &&
      !u.guard &&
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
    if (u.kind === 'brave' && !u.path.length && u.work === null && u.target === null && !u.guard) {
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
  stepLiveMarchingFormations(w)
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
  const dead = w.units.filter(u => u.hp <= 0 && !u.flight && u.native?.state !== 44)
  for (const u of dead.filter(u => u.kind === 'shaman'))
    if (w.units.some(a => a.team === u.team && a.hp > 0)) {
      if (u.team === 'blue') {
        w.respawn = 12
        tell(w, 'Your shaman will reincarnate in 12 seconds.')
      } else if (w.ai.reincarnation) w.redRespawn = 12
    }
  for (const u of dead) {
    cancelLiveResting(w, u)
    const f = effect(w, supportsFollower(w, u) ? 'death' : 'splash', u)
    if (f.kind === 'death') f.unit = { team: u.team, kind: u.kind, heading: u.heading }
  }
  for (const b of w.buildings.filter(b => b.hp <= 0)) {
    markBuildingTerritory(
      w.land,
      { ...nativePosition(w, b), tribe: b.team === 'blue' ? 0 : 1 },
      b.team === 'blue' ? 11 : w.ai.defenceRadius,
      true
    )
    if (!b.terrainState?.reason && !b.dismantled) effect(w, 'death', b)
  }
  removeDeadLiveRoutes(w)
  for (const u of w.units)
    if (u.hp <= 0 && !u.flight && u.native?.state !== 44) {
      cancelLiveBuildingAttack(w, u)
      cancelLiveOrder(w, u)
    }
  w.units = w.units.filter(u => u.hp > 0 || u.flight || u.native?.state === 44)
  w.buildings = w.buildings.filter(b => b.hp > 0)
  w.selected = w.selected.filter(id => w.units.some(u => u.id === id))
  syncLivePersonCells(w)
  syncLandscapeObjects(w)
  cleanBattles(w)
  for (const team of ['blue', 'red'] as const) {
    const key = team === 'blue' ? 'respawn' : 'redRespawn'
    if (w[key] > 0) {
      w[key] = Math.max(0, w[key] - dt)
      if (w[key] === 0 && w.units.some(u => u.team === team)) {
        const u = addUnit(w, team, 'shaman', team === 'blue' ? HOME : ENEMY)
        if (team === 'blue' && !w.selected.length) w.selected = [u.id]
        effect(w, 'birth', u)
      }
    }
  }
  refreshTerrainLights(w) // 0x4ec6f0: lighting follows the completed object turn.
  ageFailedRoutes(w.motionRoutes) // 0x4ec6f0: after object and terrain work.
  // The result overlay remains while followers continue their native celebration.
  // Full progression presentation is still being reconstructed.
  if (w.land.landFlags & 0x2000000) {
    w.redRespawn = 0
    w.status = 'won'
  }
  if (w.land.landFlags & 0x4000000) {
    w.respawn = 0
    w.status = 'lost'
  }
}
