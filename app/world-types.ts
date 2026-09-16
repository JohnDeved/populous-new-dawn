import type { LiveFormation } from './live-movement.ts'
import type { Footprints } from './footprints.ts'
import type { CombatMarch } from './combat-order-search.ts'
import type { AttackReservation } from './combat-targets.ts'
import type { OrderPool } from './person-orders.ts'
import type { MeleeAttack } from './melee.ts'
import type { UnbuiltPlan, Builder } from './building-workers.ts'
import type { BlastWave } from './blast-wave.ts'
import type { TerrainLights } from './terrain-light.ts'
import type { Replant } from './tree-growth.ts'
import type { createTimberSearches } from './timber-search.ts'
import type { AnimatedUnit } from './animation.ts'
import type { SpellTrail } from './spell-trails.ts'
import type { BuildingSmoke } from './building-smoke.ts'
import type { SceneryFire, BurningTree } from './scenery-fire.ts'
import type { BuildingDebris } from './building-debris.ts'
import type { Lightning } from './lightning.ts'
import type { LandBridge } from './land-bridge.ts'
import type { Flatten } from './flatten.ts'
import type { Erosion } from './erosion.ts'
import type { Swamp } from './swamp.ts'
import type { Firestorm } from './firestorm.ts'
import type { Earthquake } from './earthquake.ts'
import type { Volcano } from './volcano.ts'
import type { ConvertWild } from './convert-wild.ts'
import type { Tornado } from './tornado.ts'
import type { createLivePathfinding } from './live-pathfinding.ts'
import type { LivePerson } from './live-people.ts'
import type { ObjectCells } from './object-cells.ts'
import type { BuildingEntry, BuildingAdmission } from './live-building-entry.ts'
import type { MotionRoutes } from './person-routes.ts'
import type { NativeTerrain } from './native-terrain.ts'
import type { Territory } from './territory.ts'
import type { TribeTurnState, OutcomeWorld } from './tribe-turns.ts'
import type { RegisteredBuilding, SceneryShapePose } from './building-shapes.ts'
import type { BuildingTerrain } from './building-terrain.ts'
import type { SinkingBuilding } from './building-sinking.ts'
import type { BuildingBurn, DamageBuilding, BuildingPlan } from './building-damage.ts'
import type { ManaWorld, ManaTribe } from './mana.ts'
import type { TribeCasting } from './spell-casting.ts'
import type { SpellTargetScan } from './computer-spells.ts'
import type { ComputerQueue } from './computer.ts'
import type { Flyby } from './flyby.ts'
import type { ScriptState } from './popscript.ts'
import type { WorshipState } from './worship.ts'
import type { ModelMorph } from './morph.ts'
import type { MessageState } from './messages.ts'
import type { VaultTask } from './vault.ts'
import type { UnitKind } from './unit-kinds.ts'

export const TRIBE_TEAMS = ['blue', 'red', 'yellow', 'green'] as const
export type TribeTeam = (typeof TRIBE_TEAMS)[number]
export type Team = TribeTeam | 'wild'
export const teamForTribe = (tribe: number): Team =>
  tribe === -1 || tribe === 255 ? 'wild' : (TRIBE_TEAMS[tribe] ?? 'wild')
export const tribeForTeam = (team: Team) => (team === 'wild' ? -1 : TRIBE_TEAMS.indexOf(team))
export const animationTeam = (team: Team): 'blue' | 'red' | 'wild' =>
  team === 'yellow' || team === 'green' ? 'red' : team
export type BuildingKind = 'hut' | 'camp' | 'tower' | 'temple' | 'firewarriorHut' | 'boatHouse'
export type Spell =
  | 'blast'
  | 'convertWild'
  | 'hypnotise'
  | 'ghostArmy'
  | 'lightning'
  | 'bridge'
  | 'flatten'
  | 'erosion'
  | 'swamp'
  | 'firestorm'
  | 'earthquake'
  | 'volcano'
  | 'tornado'
  | 'shield'
  | 'invisibility'
  | 'swarm'
export type Point = { x: number; z: number }
export type Fight = {
  group: number
  opponent: number
  action: 'encounter' | 'approach' | 'ready' | 'attack' | 'strike' | 'special' | 'recoil' | 'push'
  started: number
  remaining?: number
  animation?: MeleeAttack | 'recoil' | 'walk' | 'idle'
  knockback?: boolean
  motion?: LivePerson
}
export type NativePoint = { x: number; y: number; h: number }
export type Vehicle = NativePoint & {
  id: number
  class: 4
  model: number
  team: Team
  physics: number
  speed: number
  navigationFlags: number
  passengerCount: number
  passengers: number[]
  reservation: number
  turnAngle: number
  turnY: number
  heading: number
  active: boolean
}
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
  fireball?: boolean
}
export type AngelState = {
  phase: 'seeking' | 'striking' | 'dying'
  target: number | null
  heading: number
  timer: number
  lifetime: number
}
export type Battle = Point & {
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
  damageAttacker?: number
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
  delivery?: { target: number }
  builder?: Builder & { person?: LivePerson }
  timer: number
  guard: boolean
  lift: number
  idleTurns: number
  heading: number
  fighting: boolean
  fight: Fight | null
  casting: { spell: Spell; point: Point; remaining: number } | null
  shield?: number
  invisibility?: number
  hypnotise?: { originalTeam: Team; remaining: number; counter: number }
  ghost?: boolean
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
  boatLaunched?: boolean
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
  timberSearch?: number
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
  attackTaskMember?: number
  terrainState?: BuildingTerrain & { dirty: boolean }
  shake?: number
  shakeOrigin?: number
}
export type Shrine = Point &
  WorshipState & {
    id: number
    kind: Spell | 'bridgeEffect' | 'erosionEffect' | 'linkedEffects' | 'vault' | 'boat' | 'angel'
    reward?: Spell | 'camp' | 'tower' | 'temple' | 'firewarriorHut' | 'boatHouse'
    bridgeTarget?: Point
    effectTarget?: Point
    effectTargets?: Point[]
    earthquakeTargets?: Point[]
    linkedShrine?: Shrine
    rewardVehicle?: number
    angelTarget?: Point
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
  flags4?: number
  reservations?: number
  reservationTimer?: number
  burn?: BurningTree
  counter?: number
  growth?: number
  shake?: number
  shakeOrigin?: number
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
    | 'reincarnation'
    | 'gift'
    | 'firewarriorShot'
    | 'angel'
  height?: number
  sprite?: { sequence: string; frame: number; fixed?: boolean }
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
  corpse?: { remaining: number; phase: number; ground: number }
  bridge?: LandBridge
  flatten?: Flatten
  erosion?: Erosion
  swamp?: Swamp
  firestorm?: Firestorm
  earthquake?: Earthquake
  volcano?: Volcano
  convertWild?: ConvertWild
  ghostArmy?: true
  tornado?: Tornado
  swarm?: { tribe: number; remaining: number; applied: boolean }
  reincarnation?: { team: Team; phase: number; ground: number }
  firewarriorShot?: { source: number; target: number; remaining: number; tower?: boolean }
  angel?: AngelState
}
export type Gift = Effect & {
  kind: 'gift'
  reward: Spell | 'camp' | 'tower' | 'temple' | 'firewarriorHut' | 'boatHouse' | 'vault'
  remaining: number
  phase: number
  frame: number
}
export type CampaignAI = ScriptState &
  ComputerQueue & {
    states: number
    flags: number
    enemyTribe: number
    defencePosition: number
    defenceRadius: number
    task9a: number
    task9b: number
    spellEntries: { model: number; mana: number; range: number; people: number; mode: number }[]
    reincarnation: boolean
    includeIncompleteBuildings: boolean
    pendingCommands: { opcode: number; args: number[] }[]
    trainingSelections: number[][]
  }

export type World = {
  objectCells: ObjectCells
  marching: LiveFormation[]
  combatMarches: CombatMarch[]
  lastOrderTurn: number
  buildingOrders: OrderPool
  motionRoutes: MotionRoutes
  pathfinding: ReturnType<typeof createLivePathfinding>
  timberSearches: ReturnType<typeof createTimberSearches>
  ai: CampaignAI
  campaignAIs: (CampaignAI | null)[]
  activeCampaignTribe: number
  messages: MessageState
  flyby: Flyby
  inputMask: number
  lastMessage: number
  campaignTimer: number | null
  spellCasts: number[][]
  killCredits: number[][]
  gifts: Gift[]
  giftCounts: Record<Spell, number>
  land: NativeTerrain & Territory
  landVersion: number
  lights: TerrainLights
  lightView: { x: number; y: number }
  lightRevision: number
  buildingFootprints: Map<number, RegisteredBuilding & { plan: boolean }>
  sceneryShadows: Map<number, SceneryShapePose>
  spellScan: SpellTargetScan
  spellScans: SpellTargetScan[]
  castingTribes: TribeCasting[]
  manaWorld: ManaWorld
  manaTribes: (ManaTribe & TribeTurnState)[]
  routeNotice: { flags: 0x200000; message: 603; serial: number } | null
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
  vehicles: Vehicle[]
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
  unlockedTower: boolean
  unlockedTemple: boolean
  unlockedFirewarriorHut: boolean
  unlockedBoatHouse: boolean
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
  orderCursor: number
  mode: Spell | BuildingKind | null
  buildingDirections: Record<BuildingKind, number>
  paused: boolean
  speed: number
  message: string
  messageUntil: number
  status: 'playing' | 'won' | 'lost'
  respawn: number
  redRespawn: number
  respawnPoint?: Point
  redRespawnPoint?: Point
  respawns: number[]
  respawnPoints: (Point | undefined)[]
  stats: { built: number; cast: number; bridges: number; trained: number; battlesWon: number[] }
}
