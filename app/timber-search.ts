import rules from './original-rules.json' with { type: 'json' }
import { cellDelta, positionDistance } from './native-math.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

export interface TimberSearchObject {
  id: number
  class: number
  model: number
  flags4: number
  wood: number
}
export interface TimberSearchWorld {
  landFlags: number
  levelFlags: number
  playerTribe: number
  land: { flags: Uint32Array; buildingIds: Uint16Array }
  objects: (cell: number) => Iterable<TimberSearchObject>
  building: (
    id: number
  ) => { class: number; flags2: number; outside: number; needed: number } | undefined
}
export interface TimberCandidate {
  cell: number
  cost: number
  flags: number
}
export interface TimberSearch {
  stage: number
  stages: number
  tribe: number
  flags: number
  center: number
  angle: number
  unchecked: number
  age: number
  idle: number
  person: number
  candidates: TimberCandidate[]
}
const short = (n: number) => (n << 16) >> 16
const cellIndex = (cell: number) => ((cell >>> 9) & 127) * 128 + ((cell >>> 1) & 127)
const offset = (cell: number, x: number, y: number) =>
  (((cell & 255) + x) & 255) | ((((cell >>> 8) + y) & 255) << 8)
const searchRadii = [0, 6, 7, 10, 11, 13, 14, 15, 16, 16, 16]
const blockCells = (cell: number) => [
  cell,
  offset(cell, 0, 2),
  offset(cell, 2, 2),
  offset(cell, 2, 0),
]

function* timberInCell(w: TimberSearchWorld, cell: number, tribe: number) {
  const index = cellIndex(cell)
  if (
    !(w.landFlags & 8) &&
    w.playerTribe === tribe &&
    w.levelFlags & 4 &&
    !(w.land.flags[index] & 8)
  )
    return
  for (const object of w.objects(index))
    if (object.class === 5 && rules.sceneryResourceFlags[object.model] & 4) yield object
}

// 0x493f10 and 0x493d50: preserve cell-list order and the original fog gate.
// Validity, wood amount and reservations are intentionally not additional filters.
export function looseTimberInCell(w: TimberSearchWorld, cell: number, tribe: number) {
  for (const object of timberInCell(w, cell, tribe)) return object.id
  return 0
}
export function blockHasTimber(w: TimberSearchWorld, cell: number, tribe: number) {
  return blockCells(cell).some(point => !!looseTimberInCell(w, point, tribe))
}

// 0x494720: four cells ordered by the native octagonal distance, with stable ties.
export function orderedTimberCells(center: number, block: number) {
  return blockCells(block)
    .map(cell => {
      const x = cellDelta(center, cell),
        y = cellDelta(center >>> 8, cell >>> 8)
      return { cell, cost: Math.max(x, y) + (Math.min(x, y) >> 1) }
    })
    .toSorted((a, b) => a.cost - b.cost)
}

// 0x494490: neighboring structures keep their needed entrance timber on the
// first pass. The native loop counts each occupied neighbor, including duplicates.
export function timberNeededByNeighbors(w: TimberSearchWorld, cell: number, tribe: number) {
  const ids = [
    offset(cell, 2, 0),
    offset(cell, -2, 0),
    offset(cell, 0, 2),
    offset(cell, 0, -2),
  ].map(point => w.land.buildingIds[cellIndex(point)] & 1023)
  if (!ids.some(Boolean)) return false
  let needed = 0,
    available = 0
  for (const id of ids) {
    const b = id ? w.building(id) : undefined
    if (b && b.class && !(b.flags2 & 1) && b.outside === cell) needed = (needed + b.needed) | 0
  }
  for (const object of timberInCell(w, cell, tribe))
    if (!(object.flags4 & 0x100000)) available = (available + short(object.wood)) | 0
  return available <= needed
}

// 0x494360: prefer unneeded stock on pass one, then allow it on pass two.
export function chooseCachedTimber(
  w: TimberSearchWorld,
  search: Pick<TimberSearch, 'center' | 'tribe'>,
  candidate: Pick<TimberCandidate, 'cell'>,
  excludeEntrance: boolean,
  protectNeighbors: boolean
) {
  for (const { cell } of orderedTimberCells(search.center, candidate.cell)) {
    if (excludeEntrance && cell === search.center) continue
    if (protectNeighbors && timberNeededByNeighbors(w, cell, search.tribe)) continue
    for (const object of timberInCell(w, cell, search.tribe))
      if (!(object.flags4 & 0x100000)) return object.id
  }
  return 0
}

// 0x495390: distinguish stock at this entrance from stock elsewhere.
export function updateTimberAvailability(w: TimberSearchWorld, search: TimberSearch) {
  search.flags &= ~48
  for (const candidate of search.candidates) {
    if (candidate.flags & 4) continue
    search.flags |= 16
    if (
      candidate.cell !== (search.center & 0xfcfc) ||
      blockCells(candidate.cell).some(
        cell => cell !== search.center && !!looseTimberInCell(w, cell, search.tribe)
      )
    ) {
      search.flags |= 32
      return
    }
  }
}

// 0x493910: prune stale blocks before the two-pass query. Native status values:
// 0 found, 1 still expanding, 2 missing cache, 3 no eligible stock.
export function queryTimberSearch(
  w: TimberSearchWorld,
  search: TimberSearch | undefined,
  person: number,
  waitForExpansion: boolean,
  excludeEntrance: boolean,
  removed: (candidate: TimberCandidate) => void
) {
  if (!search || !(search.flags & 1)) return { status: 2, target: 0 }
  search.idle = 0
  search.person = person
  if (waitForExpansion && search.flags & 2) return { status: 1, target: 0 }
  search.candidates = search.candidates.filter(candidate => {
    if (blockHasTimber(w, candidate.cell, search.tribe)) return true
    if (!(candidate.flags & 2)) search.unchecked = short(search.unchecked - 1)
    candidate.flags &= ~1
    removed(candidate)
    return false
  })
  updateTimberAvailability(w, search)
  search.age = 0
  for (const protect of [true, false])
    for (const candidate of search.candidates) {
      if (candidate.flags & 4) continue
      const target = chooseCachedTimber(w, search, candidate, excludeEntrance, protect)
      if (target) return { status: 0, target }
    }
  return { status: 3, target: 0 }
}

export interface TimberSearchPool {
  records: TimberSearch[]
  active: number
  expanding: number
  unchecked: number
  candidates: number
  expansionInterval: number
  routeInterval: number
  expansionBudget: number
  routeBudget: number
  expansionTimer: number
  routeTimer: number
  expansionCursor: number
  routeCursor: number
}
const emptySearch = (): TimberSearch => ({
  stage: 0,
  stages: 5,
  tribe: 0,
  flags: 0,
  center: 0,
  angle: 0,
  unchecked: 0,
  age: 0,
  idle: 0,
  person: 0,
  candidates: [],
})

// Native candidate IDs/pointers are private to this cache. Arrays preserve the
// observed list order while avoiding a second pointer/index ownership graph.
export function createTimberSearches(): TimberSearchPool {
  return {
    records: Array.from({ length: 120 }, emptySearch),
    active: 0,
    expanding: 0,
    unchecked: 0,
    candidates: 0,
    expansionInterval: 1,
    routeInterval: 3,
    expansionBudget: 2,
    routeBudget: 1,
    expansionTimer: 0,
    routeTimer: 0,
    expansionCursor: 0,
    routeCursor: 0,
  }
}
function updateSearchBudgets(pool: TimberSearchPool) {
  pool.expansionInterval = 1
  pool.expansionBudget = 2
  pool.routeInterval = pool.unchecked >= 300 ? 1 : 3
  pool.routeBudget = 1
  if (pool.unchecked >= 500) pool.routeBudget = 2
  if (pool.unchecked >= 1000) pool.routeBudget = 3
}

// 0x4935c0: a matching entrance shares the cache, even across different workers.
// Exhaustion leaves the caller's previous index intact.
export function refreshTimberSearch(
  pool: TimberSearchPool,
  owner: { searchIndex: number },
  center: number,
  angle: number,
  person?: { id: number; tribe: number }
) {
  center &= 0xfefe
  let index = (owner.searchIndex << 24) >> 24
  const previous = pool.records[index]
  if (!previous || !(previous.flags & 1) || previous.center !== center) {
    index = pool.records.findIndex(record => !!(record.flags & 1) && record.center === center)
    if (index < 0) {
      index = pool.records.findIndex(record => !(record.flags & 1))
      if (index < 0) return -1
      pool.records[index] = { ...emptySearch(), flags: 3, stages: 5, center, angle: angle & 65535 }
      pool.active++
      pool.expanding++
      updateSearchBudgets(pool)
    }
  }
  owner.searchIndex = index
  pool.records[index].tribe = person ? (person.tribe << 24) >> 24 : -1
  pool.records[index].person = person ? person.id & 65535 : 0
  return index
}

function insertCandidate(pool: TimberSearchPool, search: TimberSearch, cell: number, cost: number) {
  if (search.candidates.some(candidate => candidate.cell === cell) || pool.candidates >= 7680)
    return
  const before = search.candidates.findLastIndex(candidate => candidate.cost < cost) + 1
  search.candidates.splice(before, 0, { cell, cost, flags: 1 })
  search.unchecked = short(search.unchecked + 1)
  pool.unchecked++
  pool.candidates++
}

function finishExpansion(pool: TimberSearchPool, search: TimberSearch) {
  if (!(search.flags & 2)) return
  search.flags &= ~2
  if (pool.expanding > 0) pool.expanding--
  updateSearchBudgets(pool)
}

function releaseSearch(pool: TimberSearchPool, search: TimberSearch) {
  // Cadence is sampled before freeing these candidates, as in 0x493770/0x493af0.
  finishExpansion(pool, search)
  for (const candidate of search.candidates) {
    if (!(candidate.flags & 2)) {
      search.unchecked = short(search.unchecked - 1)
      pool.unchecked--
    }
    candidate.flags &= ~1
  }
  pool.candidates -= search.candidates.length
  search.candidates.length = 0
  search.flags &= ~9
  pool.active--
}

export function invalidateTimberSearch(
  pool: TimberSearchPool,
  owner: { searchIndex: number },
  center: number
) {
  center &= 0xfefe
  const previous = pool.records[(owner.searchIndex << 24) >> 24]
  const search =
    previous && previous.flags & 1 && previous.center === center
      ? previous
      : pool.records.find(record => !!(record.flags & 1) && record.center === center)
  if (!search) return
  owner.searchIndex = -1
  releaseSearch(pool, search)
}

// Complete 0x4951b0: changed walkability makes nearby cached route results stale.
export function invalidateTimberRoutes(pool: TimberSearchPool, center: number, radius: number) {
  if (pool.active <= 0 || radius <= 1) return
  center &= 0xfefe
  const points =
    radius < 7
      ? [center]
      : [
          offset(center, -radius * 2, radius * 2),
          offset(center, radius * 2, radius * 2),
          center,
          offset(center, -radius * 4, 0),
        ]
  for (const search of pool.records) {
    if (!(search.flags & 1)) continue
    const position = {
      x: ((search.center & 0xfe) + 1) << 8,
      y: (((search.center >>> 8) & 0xfe) + 1) << 8,
    }
    if (
      points.every(
        point =>
          positionDistance(position, { x: (point & 0xfe) << 8, y: point & 0xfe00 }) >=
          searchRadii[search.stages * 2] * 0x200
      )
    )
      continue
    for (const candidate of search.candidates) {
      if (candidate.flags & 2) {
        candidate.flags &= ~2
        search.unchecked = short(search.unchecked + 1)
        pool.unchecked++
      }
      candidate.flags &= ~4
    }
  }
}

// 0x493fa0: expand one original ring segment. A Set preserves discovery order;
// the ordered candidate list preserves native insertion-before-equal-cost ties.
export function expandTimberSearch(
  pool: TimberSearchPool,
  w: TimberSearchWorld,
  indexed: Uint8Array,
  search: TimberSearch
) {
  const id = startIndexedSearch(
    indexed,
    2,
    search.angle,
    searchRadii[search.stage * 2],
    searchRadii[search.stage * 2 + 1]
  )
  // Native code reads uninitialized stack data when all indexed slots are busy.
  // Postpone this segment instead; retain its candidates and progress.
  if (!id) return
  const blocks = new Set<number>()
  let point
  while ((point = nextIndexedSearch(indexed, id))) {
    const cell = offset(search.center, point.x * 2, point.y * 2)
    if (looseTimberInCell(w, cell, search.tribe)) blocks.add(cell & 0xfcfc)
    if (blocks.size === 128) break
  }
  endIndexedSearch(indexed, id)
  for (const cell of blocks) {
    const x = cellDelta(search.center, cell),
      y = cellDelta(search.center >>> 8, cell >>> 8)
    insertCandidate(pool, search, cell, Math.max(x, y) + (Math.min(x, y) >> 1))
  }
  search.stage = (search.stage + 1) & 255
  if ((search.stage << 24) >> 24 >= (search.stages << 24) >> 24) finishExpansion(pool, search)
}

// 0x494a20: route checks have their own turn budget. Route costs come from the
// original path planner, not the octagonal estimate used while discovering stock.
export function checkTimberRoutes(
  pool: TimberSearchPool,
  w: TimberSearchWorld,
  start: number,
  budget: number,
  route: (search: TimberSearch, candidate: TimberCandidate) => { result: number; cost: number }
) {
  let cursor = 0
  while (budget && pool.unchecked > 0) {
    cursor = start
    let visited = 0
    while (pool.unchecked > 0 && visited < pool.active) {
      if (cursor >= 120) cursor = 0
      const search = pool.records[cursor]
      if (search.flags & 1) {
        visited++
        if (search.person) {
          const candidate = search.candidates.find(n => !(n.flags & 2))
          if (candidate && search.unchecked > 0) {
            const { result, cost } = route(search, candidate)
            const changed = !result && short(cost) !== candidate.cost
            candidate.cost = short(cost)
            if (result) candidate.flags |= 4
            candidate.flags |= 2
            search.unchecked = short(search.unchecked - 1)
            pool.unchecked--
            updateTimberAvailability(w, search)
            if (changed) {
              search.candidates.splice(search.candidates.indexOf(candidate), 1)
              const before = search.candidates.findLastIndex(n => n.cost < candidate.cost) + 1
              search.candidates.splice(before, 0, candidate)
            }
            if (!--budget) return cursor
          }
        } else if (!--budget) return cursor + 1
      }
      cursor++
    }
  }
  return cursor
}

// 0x493af0: shared expansion/route budgets and 321-turn idle expiry. Call once
// per simulation turn; rendering rate never advances this cache.
export function stepTimberSearches(
  pool: TimberSearchPool,
  w: TimberSearchWorld,
  indexed: Uint8Array,
  route: Parameters<typeof checkTimberRoutes>[4],
  personExists: (id: number) => boolean
) {
  if (pool.active <= 0) return
  if (--pool.expansionTimer < 1) {
    const start = pool.expansionCursor
    let cursor = 0,
      budget = pool.expansionBudget
    while (budget && pool.expanding > 0) {
      cursor = start
      let visited = 0
      while (budget && pool.expanding > 0 && visited < pool.active) {
        if (cursor >= 120) cursor = 0
        const search = pool.records[cursor]
        if (search.flags & 1) {
          visited++
          if (search.flags & 2) {
            budget--
            expandTimberSearch(pool, w, indexed, search)
          }
        }
        cursor++
      }
    }
    pool.expansionCursor = cursor
    pool.expansionTimer = pool.expansionInterval
  }
  if (--pool.routeTimer < 1) {
    pool.routeCursor = checkTimberRoutes(pool, w, pool.routeCursor, pool.routeBudget, route)
    pool.routeTimer = pool.routeInterval
  }
  let expired = false
  for (const search of pool.records) {
    if (!(search.flags & 1)) continue
    search.age = short(search.age + 1)
    if (search.person && !personExists(search.person)) search.person = 0
    search.idle = short(search.idle + 1)
    if (search.idle > 320) {
      search.flags |= 8
      expired = true
    }
  }
  if (expired) for (const search of pool.records) if (search.flags & 8) releaseSearch(pool, search)
}

export function findTimber(
  pool: TimberSearchPool,
  w: TimberSearchWorld,
  index: number,
  person: number,
  waitForExpansion: boolean,
  excludeEntrance: boolean
) {
  return queryTimberSearch(
    w,
    pool.records[index],
    person,
    waitForExpansion,
    excludeEntrance,
    candidate => {
      pool.candidates--
      if (!(candidate.flags & 2)) pool.unchecked--
    }
  )
}
