import { changeLivePersonState, createLivePerson, registerLivePerson } from './live-people.ts'
import { nativePosition, refreshTerrainSurface } from './world-terrain-runtime.ts'
import { browserPosition } from './world-coordinates.ts'
import { addUnit } from './world-state.ts'
import { releaseTasks } from './world-tasks.ts'
import { enforceSpecialBattleBoundary, specialBattlePosition } from './special-battle.ts'
import {
  processTerrain,
  queueTerrain,
  terrainPointHeight,
  updateWalkMasks,
} from './native-terrain.ts'
import { moveObjectInCells } from './object-cells.ts'
import { positionDistance, random } from './native-math.ts'
import type { UnitKind } from './unit-kinds.ts'
import { teamForTribe, type Effect, type Unit, type World } from './world-types.ts'
import rules from './original-rules.json' with { type: 'json' }

const followerKinds: UnitKind[] = ['warrior', 'brave', 'preacher', 'spy', 'firewarrior']
const arenaQuarter = [
  [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
  [50, 50, 50, 50, 50, 50, 50, 50, 50, 60, 50, 50],
  [50, 50, 50, 50, 50, 50, 50, 141, 247, 323, 212, 236],
  [50, 50, 50, 50, 50, 87, 247, 372, 463, 520, 393, 408],
  [50, 50, 50, 50, 113, 298, 442, 537, 592, 614, 459, 459],
  [50, 50, 50, 87, 298, 463, 568, 614, 615, 590, 399, 379],
  [50, 50, 50, 247, 442, 568, 618, 601, 539, 458, 225, 184],
  [50, 50, 141, 372, 537, 614, 601, 515, 385, 251, 50, 50],
  [50, 50, 247, 463, 592, 615, 539, 385, 198, 50, 50, 50],
  [50, 60, 323, 520, 614, 590, 458, 251, 50, 50, 50, 50],
  [50, 50, 212, 393, 459, 399, 225, 50, 50, 50, 50, 50],
  [50, 50, 236, 408, 459, 379, 184, 50, 50, 50, 50, 50],
]

export interface Armageddon {
  phase: 0 | 1 | 2
  terrainRemaining: number
  gate: number
  settle: number
  commandDelay: number
  commandInterval: number
  directions: number[]
  populations: number[]
  participants: number[][]
  staged: number[]
  inputMask: number
}

const activeTribes = (w: World) =>
  w.manaTribes.flatMap((tribe, id) =>
    tribe.active && w.units.some(u => u.team === teamForTribe(id) && !u.ghost && u.hp > 0)
      ? [id]
      : []
  )

function rebuildParticipants(w: World, fx: Effect, tribes: number[]) {
  const census = tribes.map(tribe => {
      const team = teamForTribe(tribe),
        people = w.units.filter(u => u.team === team && !u.ghost && u.hp > 0),
        origin = people.find(u => u.kind === 'shaman') ?? people[0] ?? fx
      return {
        team,
        origin: { x: origin.x, z: origin.z },
        counts: followerKinds.map(kind => people.filter(u => u.kind === kind).length),
      }
    }),
    greatest = Math.max(...census.map(c => c.counts.reduce((sum, count) => sum + count, 1))),
    scale = greatest < 121 ? 0x1000 : Math.floor(0x78000 / greatest)
  for (const u of w.units) releaseTasks(w, u)
  w.units = []
  w.selected = []
  return census.map(({ team, origin, counts }) => {
    const ids = [addUnit(w, team, 'shaman', origin).id]
    counts.forEach((count, index) => {
      if (count) count = Math.max(1, (count * scale) >> 12)
      for (let n = 0; n < count; n++) ids.push(addUnit(w, team, followerKinds[index], origin).id)
    })
    return ids
  })
}

export function startArmageddon(w: World, fx: Effect) {
  const tribes = activeTribes(w)
  if (w.land.landFlags & 0x06000000 || tribes.length < 2) return false
  const center = nativePosition(w, fx)
  center.x = (center.x & 0xfe00) + 0x100
  center.y = (center.y & 0xfe00) + 0x100
  Object.assign(fx, browserPosition(center))
  const participants = rebuildParticipants(w, fx, tribes),
    directions = Array(4).fill(0),
    populations = Array(4).fill(0),
    lists = Array.from({ length: 4 }, () => [] as number[])
  tribes.forEach((tribe, direction) => {
    directions[tribe] = direction
    populations[tribe] = participants[direction].length
    lists[tribe] = participants[direction]
  })
  fx.armageddon = {
    phase: 0,
    terrainRemaining: 128,
    gate: 0,
    settle: 0,
    commandDelay: 0,
    commandInterval: 0,
    directions,
    populations,
    participants: lists,
    staged: Array(4).fill(0),
    inputMask: w.inputMask,
  }
  fx.duration = Infinity
  w.effects = [fx]
  w.projectiles = []
  w.buildings = []
  w.vehicles = []
  w.fights = []
  w.trees = w.trees.filter(
    tree =>
      !!(rules.sceneryResourceFlags[tree.model] & 0x10) || tree.model === 10 || tree.model === 12
  )
  w.shrines = []
  w.gifts = []
  w.manaWorld.gameFlags |= 2
  w.levelFlags2 |= 0x02500000
  w.inputMask |= 32
  w.mode = null
  return true
}

function reshapeArena(w: World, fx: Effect, remaining: number) {
  const center = nativePosition(w, fx),
    cx = (center.x >>> 8) & 254,
    cy = (center.y >>> 8) & 254
  for (let row = 0; row < 24; row++)
    for (let column = 0; column < 24; column++) {
      const dx = column * 2 - 22,
        dy = row * 2 - 22
      if (Math.hypot(dx * 256, dy * 256) >= 0x1601) continue
      const x = (cx + dx) & 254,
        y = (cy + dy) & 254,
        index = (y >>> 1) * 128 + (x >>> 1),
        target = arenaQuarter[Math.min(row, 23 - row)][Math.min(column, 23 - column)]
      w.land.heights[index] += Math.trunc((target - w.land.heights[index]) / remaining)
    }
  const cell = cx | (cy << 8)
  queueTerrain(w.land, cell, 16, 1, { surface: () => {}, globe: () => {} })
  processTerrain(w.land, { surface: () => {}, globe: () => {} })
  updateWalkMasks(w.land, cell, 16)
  refreshTerrainSurface(w)
}

function stage(w: World, fx: Effect, u: Unit, rank: number) {
  if (!u.native) u.native = createLivePerson(w, u)
  const p = u.native
  if (p.model === 7) {
    const arena = fx.armageddon!,
      point = {
        ...specialBattlePosition(
          {
            randomState: w.randomState,
            center: nativePosition(w, fx),
            directions: arena.directions,
            populations: arena.populations,
          },
          0,
          p.tribe
        ),
        h: 0,
      }
    registerLivePerson(w, p)
    moveObjectInCells(w.objectCells, p, point)
    p.h = terrainPointHeight(w.land, p)
    p.flags4 = (p.flags4 & ~0x400) >>> 0
    p.displacement.x = 0
    p.displacement.y = 0
    p.displacement.h = 0
    p.renderFlags &= ~16
    Object.assign(u, browserPosition(p))
  }
  p.link = rank
  changeLivePersonState(w, u, 39)
}

function directBattle(w: World, fx: Effect, enter = false) {
  const arena = fx.armageddon!
  // ponytail: native caps each roster near 120, so a direct nearest-enemy scan is cheaper than a new index.
  for (const ids of arena.participants)
    for (const id of ids) {
      const u = w.units.find(person => person.id === id && person.hp > 0)
      if (!u) continue
      if (enter && u.native?.state === 39) changeLivePersonState(w, u, 10)
      if (u.fight || u.target !== null) continue
      const enemy = w.units
        .filter(target => target.hp > 0 && target.team !== u.team && target.team !== 'wild')
        .toSorted(
          (a, b) =>
            positionDistance(nativePosition(w, u), nativePosition(w, a)) -
              positionDistance(nativePosition(w, u), nativePosition(w, b)) || a.id - b.id
        )[0]
      u.target = enemy?.id ?? null
    }
}

export function finishArmageddon(w: World, fx: Effect) {
  const arena = fx.armageddon
  if (!arena) return
  w.manaWorld.gameFlags &= ~2
  w.levelFlags2 &= 0xfdafffff
  w.inputMask = arena.inputMask
  for (const u of w.units) if (u.native?.state === 39) changeLivePersonState(w, u, 10)
  fx.duration = fx.age
}

export function stepArmageddon(w: World, fx: Effect) {
  const arena = fx.armageddon!
  if (w.land.landFlags & 0x06000000) {
    finishArmageddon(w, fx)
    return
  }
  if (arena.phase === 0) {
    if (arena.terrainRemaining <= 64) reshapeArena(w, fx, arena.terrainRemaining)
    if (--arena.terrainRemaining === 0) {
      arena.phase = 1
      arena.gate = 24
      arena.settle = 100
      for (let tribe = 0; tribe < 4; tribe++) {
        const id = arena.participants[tribe][0],
          shaman = w.units.find(u => u.id === id)
        if (shaman) stage(w, fx, shaman, 0)
        arena.staged[tribe] = id ? 1 : 0
      }
    }
    return
  }
  if (arena.phase === 1) {
    if (arena.gate) {
      arena.gate--
      return
    }
    if (!(w.turn & 3))
      for (let tribe = 0; tribe < 4; tribe++) {
        const index = arena.staged[tribe],
          id = arena.participants[tribe][index],
          u = w.units.find(person => person.id === id)
        if (u) stage(w, fx, u, index)
        if (id) arena.staged[tribe]++
      }
    if (arena.staged.every((count, tribe) => count >= arena.participants[tribe].length)) {
      if (--arena.settle > 0) return
      arena.phase = 2
      arena.commandDelay = 38
      arena.commandInterval = (random(w) & 31) + 32
    }
    return
  }
  const center = nativePosition(w, fx)
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native
    if (!p || u.hp <= 0) continue
    enforceSpecialBattleBoundary({ ...center, substate: 2, delay: 0 }, p)
    u.hp = Math.min(u.hp, p.life / 20)
  }
  if (arena.commandDelay && --arena.commandDelay === 0) directBattle(w, fx, true)
  if (--arena.commandInterval < 1) {
    directBattle(w, fx)
    arena.commandInterval = (random(w) & 31) + 32
  }
}
