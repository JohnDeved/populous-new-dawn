import {
  tribeForTeam,
  type World,
  type Team,
  type Building,
  type Unit,
  type Point,
} from './world-types.ts'
import type { UnitKind } from './unit-kinds.ts'
import { maxHp, SPELLS, TURNS_PER_SECOND } from './world-rules.ts'
import { buildingModel } from './building-shapes.ts'
import { nativeTrainingCost } from './building-occupants.ts'
import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { createFlyby } from './flyby.ts'
import { missionAI } from './campaign-runtime.ts'
import { createMessages } from './messages.ts'
import { emptyPersonOrder } from './person-orders.ts'
import { createMotionRoutes } from './person-routes.ts'
import { createTimberSearches } from './timber-search.ts'
import { makeTerrain } from './world-terrain-runtime.ts'
import { createIndexedSearch } from './indexed-search.ts'
import { createFootprints } from './footprints.ts'
import { createTribeCasting } from './spell-casting.ts'
import { createPathGeometry } from './path-geometry.ts'
import { createPathSolver } from './path-solver.ts'
import type { PathSearchState } from './path-search.ts'
import type { LivePerson } from './live-people.ts'
import {
  missionAllowsBuilding,
  missionComputerTribes,
  missionData,
  missionScript,
  missionSpellMask,
} from './mission-data.ts'
import { createMissionLand } from './world-terrain-runtime.ts'

export function createLivePathfinding() {
  const state: PathSearchState = {
    searches: 0,
    landLimit: 0,
    checkingPerson: 0,
    limit: 0,
    vehicles: 0,
    mode: 0,
    currentBoat: 0,
    candidateCount: 0,
    candidateIndex: 0,
    truncated: 0,
    walkMask: 0,
  }
  // 0x42b590 sets both node limits to 200 and both request limits to zero.
  return {
    people: new Map<number, LivePerson>(),
    state,
    path: { data: new Uint8Array(2580), count: 0 },
    geometry: createPathGeometry(),
    solver: createPathSolver(),
    measure: { dirty: 0, distance: 0, tribes: 0 },
    computerLimit: 200,
    humanLimit: 200,
    computerRequests: 0,
    humanRequests: 0,
    skip: 0,
  }
}

export function createWorldState(missionNumber = 1): World {
  const mission = missionData(missionNumber),
    land = createMissionLand(mission.level),
    objectTribes = new Set(
      mission.level.objects.flatMap(object =>
        object.owner >= 0 && object.owner < 4 ? [object.owner] : []
      )
    ),
    computerTribe = [...objectTribes].find(id => id !== 0) ?? 1,
    computerTribes = missionComputerTribes(missionNumber),
    activeTribes = new Set(missionNumber === 6 ? [0, ...computerTribes] : objectTribes),
    campaignAIs = Array.from({ length: 4 }, (_, id) =>
      computerTribes.includes(id) ? missionAI(missionScript(missionNumber, id), id) : null
    ),
    spellScans = Array.from({ length: 4 }, () => ({
      cursor: 0,
      limit: 0,
      paused: 0,
      targets: [0, 0, 0, 0],
    })),
    playerSpellMask =
      missionSpellMask(missionNumber) & SPELLS.reduce((mask, spell) => mask | (1 << spell.model), 0)
  return {
    flyby: createFlyby(),
    inputMask: 0,
    lastMessage: -1,
    campaignTimer: null,
    ai: campaignAIs[computerTribe]!,
    campaignAIs,
    activeCampaignTribe: computerTribe,
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
      ...land,
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
    spellScan: spellScans[computerTribe],
    spellScans,
    castingTribes: Array.from({ length: 4 }, (_, id) => createTribeCasting(id !== 0)),
    tribeCount: Math.max(...activeTribes) + 1,
    levelFlags2: 0,
    outcome: {
      campaignTribes: Math.max(...activeTribes) + 1,
      level: mission.number,
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
      spells: Array.from({ length: 4 }, (_, tribe) => ({
        available: tribe ? 4 : playerSpellMask,
        disabled: 0,
        stocks: Array(22).fill(0),
      })),
    },
    manaTribes: Array.from({ length: 4 }, (_, id) => ({
      id,
      spellOwner: id,
      playerType: id === 0 ? 2 : 1,
      active: activeTribes.has(id),
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
    terrain: makeTerrain(land),
    terrainVersion: 0,
    units: [],
    vehicles: [],
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
    unlockedCamp: missionAllowsBuilding(missionNumber, 7),
    unlockedTower: missionAllowsBuilding(missionNumber, 4),
    unlockedTemple: missionAllowsBuilding(missionNumber, 5),
    unlockedSpyHut: missionAllowsBuilding(missionNumber, 6),
    unlockedFirewarriorHut: missionAllowsBuilding(missionNumber, 8),
    unlockedBoatHouse: missionAllowsBuilding(missionNumber, 13),
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
    buildingDirections: {
      hut: 0,
      tower: 0,
      temple: 0,
      spyHut: 0,
      camp: 0,
      firewarriorHut: 0,
      boatHouse: 0,
    },
    paused: false,
    speed: 1,
    message:
      missionNumber === 1
        ? 'Select a brave and send them to the southern stone head to worship for Land Bridge.'
        : missionNumber === 2
          ? 'Send your Shaman to the Totem Pole and build your settlement before facing the Matak.'
          : missionNumber === 3
            ? 'The Chumara can turn your followers against you. Reach their Vault and learn their power.'
            : missionNumber === 4
              ? 'Convert the Wildmen, discover the Guard Tower, and defeat the Matak.'
              : missionNumber === 5
                ? 'Worship the stone head to receive a Boat and cross the water.'
                : missionNumber === 6
                  ? 'Establish your settlement and defeat both the Chumara and Matak tribes.'
                  : missionNumber === 7
                    ? 'Convert Wildmen and seize Invisibility from the Chumara Vault.'
                    : missionNumber === 8
                      ? 'Seize Firewarrior training from the Dakini Vault and build your ranged force.'
                      : missionNumber === 12
                        ? 'For the first time we must face all three Enemy tribes. I must prepare for a mighty struggle.'
                        : 'Discover the Boat House and launch a vessel to cross the world.',
    messageUntil: 18,
    status: 'playing',
    respawn: 0,
    redRespawn: 0,
    respawns: [0, 0, 0, 0],
    respawnPoints: [undefined, undefined, undefined, undefined],
    stats: { built: 0, cast: 0, bridges: 0, trained: 0, battlesWon: [0, 0, 0, 0] },
  }
}

export const housing = (b: Building) => rules.buildingCapacity[buildingModel(b)]
export function population(w: World, team: Team) {
  return (
    1 + w.units.filter(u => u.team === team && u.kind !== 'shaman' && !u.ghost && u.hp > 0).length
  )
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
    w.units.filter(u => u.team === team && u.kind === 'warrior' && !u.ghost && u.hp > 0).length,
    3,
    w.manaTribes[tribeForTeam(team)].playerType
  )
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
