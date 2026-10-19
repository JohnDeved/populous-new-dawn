import type { Battle, Point, Unit, World } from './world-types.ts'

// Browser positions are the combat adapter's authority, including people with
// no native cell registration and native owners not yet published to the browser.
const combatCell = (point: Point) => {
  const x = Math.round((point.x + 8) * 256) & 65535,
    y = Math.round((-point.z - 8) * 256) & 65535
  return ((y >> 9) << 7) | (x >> 9)
}

type Entry = { cell: number; rank: number }
class SpatialRoster<T extends Point & { id: number }> {
  readonly rows = new Map<number, Set<T>>()
  readonly entries = new Map<T, Entry>()
  readonly byId = new Map<number, T>()
  length: number
  readonly roster: T[]

  constructor(roster: T[]) {
    this.roster = roster
    this.length = roster.length
    for (const [rank, owner] of roster.entries()) this.add(owner, rank)
  }

  add(owner: T, rank: number) {
    const cell = combatCell(owner)
    this.entries.set(owner, { cell, rank })
    if (!this.byId.has(owner.id)) this.byId.set(owner.id, owner)
    let row = this.rows.get(cell)
    if (!row) this.rows.set(cell, (row = new Set()))
    row.add(owner)
  }

  move(owner: T) {
    const entry = this.entries.get(owner)
    if (!entry) return
    const cell = combatCell(owner)
    if (cell === entry.cell) return
    const previous = this.rows.get(entry.cell)!
    previous.delete(owner)
    if (!previous.size) this.rows.delete(entry.cell)
    entry.cell = cell
    let row = this.rows.get(cell)
    if (!row) this.rows.set(cell, (row = new Set()))
    row.add(owner)
  }

  inCells(cells: Iterable<number>) {
    const owners: T[] = []
    for (const cell of cells) {
      const row = this.rows.get(cell)
      if (row) for (const owner of row) owners.push(owner)
    }
    // Movement changes bucket insertion order, never browser roster ties.
    return owners.sort((a, b) => this.entries.get(a)!.rank - this.entries.get(b)!.rank)
  }
}

type QuerySession = {
  units?: SpatialRoster<Unit>
  fights?: SpatialRoster<Battle>
}
const sessions = new WeakMap<World, QuerySession>()
const suspended = new WeakSet<World>()

// Internal ownership boundary: visit must be synchronous engine code mutating
// ordinary factory/current-load data through the publishers below, not an external
// callback. Accessors/Proxies/custom iterators are not supported in this owned
// plain-data scope; it is not a public fixture compatibility wrapper. No repeated
// descriptor audit is needed for game-owned records. Public queries stay cold.
// Only the synchronous simulation body retains an index. Public commands,
// snapshots and standalone queries keep their exhaustive live view between calls.
// Nothing is serialized: a loaded current-format world starts with fresh buckets.
// Observers run outside this scope. Nested owned visits share mutation publishers;
// throws always end the outer scope rather than leaving a reusable stale index.
export function withLiveCombatQueries<T>(w: World, visit: () => T): T {
  if (suspended.has(w) || sessions.has(w)) return visit()
  sessions.set(w, {})
  try {
    return visit()
  } finally {
    sessions.delete(w)
  }
}

// Supported external callbacks may query, mutate retained aliases, or reenter
// tick before returning. They must stay exhaustive for their entire execution,
// including nested ticks; invalidating only after the callback is too late.
export function withoutLiveCombatQueries<T>(w: World, visit: () => T): T {
  const retained = sessions.has(w),
    nested = suspended.has(w)
  sessions.delete(w)
  suspended.add(w)
  try {
    return visit()
  } finally {
    if (!nested) suspended.delete(w)
    if (retained) sessions.set(w, {})
  }
}

function invalidateLiveCombatQueries(w: World) {
  if (sessions.has(w)) sessions.set(w, {})
}

function unitIndex(w: World, session: QuerySession) {
  if (session.units?.roster !== w.units || session.units.length !== w.units.length)
    session.units = new SpatialRoster(w.units)
  return session.units
}

function fightIndex(w: World, session: QuerySession) {
  if (session.fights?.roster !== w.fights || session.fights.length !== w.fights.length)
    session.fights = new SpatialRoster(w.fights)
  return session.fights
}

// Every live browser-position publication uses this boundary. Native positions
// alone do not move combat candidates. Preserve Object.assign's evaluation/write
// order and update only after the ordinary publication has completed.
export function publishLiveCombatPosition<T extends Unit | Battle>(w: World, owner: T, to: Point) {
  try {
    Object.assign(owner, to)
  } catch (error) {
    // Object.assign can publish x before a failing z setter. If a caller catches
    // that failure, its next query must still observe the partially written data.
    invalidateLiveCombatQueries(w)
    throw error
  }
  refreshLiveCombatPosition(w, owner)
}

export function refreshLiveCombatPosition(w: World, owner: Unit | Battle) {
  const session = sessions.get(w)
  if ('members' in owner) session?.fights?.move(owner)
  else session?.units?.move(owner)
}

export function appendLiveCombatUnit(w: World, unit: Unit) {
  const session = sessions.get(w),
    index = session?.units
  if (!index) return
  if (index.roster !== w.units || index.length + 1 !== w.units.length) {
    // An earlier removal can be hidden when this append restores the old length.
    // Do not leave that stale roster reusable by the next same-turn query.
    session.units = undefined
    return
  }
  index.add(unit, index.length)
  index.length++
}

// Both ordinary fight factories append in roster order. Publish after push so
// later same-turn queries include the new fight without rebuilding older fights.
export function appendLiveCombatFight(w: World, fight: Battle) {
  const session = sessions.get(w),
    index = session?.fights
  if (!index) return
  if (index.roster !== w.fights || index.length + 1 !== w.fights.length) {
    session.fights = undefined
    return
  }
  index.add(fight, index.length)
  index.length++
}

// Conversion replaces an earlier slot with a new ID, then removes its temporary
// appended slot. Length/array identity cannot detect that mutation on their own.
export function invalidateLiveCombatUnits(w: World) {
  const session = sessions.get(w)
  if (session) session.units = undefined
}

function* neighborhood(source: { x: number; y: number }, range: number) {
  if (!range) return
  const radius = Math.trunc(range / 2)
  if (radius < 0) return
  // The square is toroidal. At half-world radius visit each cell once, rather
  // than duplicating opposite edges (or iterating unbounded caller ranges).
  const count = Math.min(128, radius * 2 + 1)
  const x = (source.x & 65535) >> 9,
    y = (source.y & 65535) >> 9,
    offset = Math.min(64, radius)
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++)
      yield (((y - offset + row) & 127) << 7) | ((x - offset + col) & 127)
}

export function liveCombatNeighborhood(w: World, source: { x: number; y: number }, range: number) {
  const session = sessions.get(w)
  if (!session) return
  const units = unitIndex(w, session),
    fights = fightIndex(w, session)
  return {
    units: units.inCells(neighborhood(source, range)),
    fights: fights.inCells(neighborhood(source, range)),
    unitById: units.byId,
  }
}

export function liveCombatPeopleInCell(w: World, cell: number) {
  const session = sessions.get(w)
  return session && unitIndex(w, session)?.inCells([cell])
}
