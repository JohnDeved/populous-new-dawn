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
    // Malformed duplicate IDs disable retention below; cold queries stay live.
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
  disabled?: boolean
  checked?: boolean
}
const sessions = new WeakMap<World, QuerySession>()
const suspended = new WeakSet<World>()

// Internal ownership boundary: visit must be synchronous engine code mutating
// ordinary factory/current-load data through the publishers below, not an external
// callback. Nested exotic accessors/Proxies are not supported simulation state.
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

function plainData(value: object) {
  return (
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(Object.getOwnPropertyDescriptors(value)).every(field => 'value' in field)
  )
}

function plainArray(value: unknown[]) {
  return (
    Object.getPrototypeOf(value) === Array.prototype &&
    !Object.getOwnPropertySymbols(value).length &&
    Object.entries(Object.getOwnPropertyDescriptors(value)).every(
      ([key, field]) => 'value' in field && (key === 'length' || /^(0|[1-9][0-9]*)$/.test(key))
    )
  )
}

function querySession(w: World) {
  const session = sessions.get(w)
  if (!session || session.disabled) return
  if (!session.checked) {
    session.checked = true
    // Bounded guards preserve existing projection-fixture accessor behavior.
    // They are not a recursive validator of arbitrary nested simulation state;
    // that state is ordinary data under the ownership contract above.
    if (
      !plainData(w) ||
      !plainData(w.outcome) ||
      !plainData(w.manaWorld) ||
      !plainData(w.land) ||
      !plainArray(w.manaTribes) ||
      !w.manaTribes.every(plainData) ||
      !plainArray(w.outcome.alliances) ||
      !plainData(w.objectCells) ||
      Object.getPrototypeOf(w.objectCells.objects) !== Map.prototype ||
      Reflect.ownKeys(w.objectCells.objects).length ||
      ![...w.objectCells.objects.values()].every(plainData) ||
      !plainArray(w.buildings) ||
      !w.buildings.every(
        building =>
          plainData(building) &&
          (!building.attackReservation || plainData(building.attackReservation)) &&
          (!building.admission || plainData(building.admission))
      )
    )
      session.disabled = true
  }
  return session.disabled ? undefined : session
}

function plainUnit(unit: Unit) {
  if (!plainData(unit)) return false
  for (const owner of [
    unit.native,
    unit.flight,
    unit.builder,
    unit.entry,
    unit.fight,
    unit.attackReservation,
  ])
    if (owner && !plainData(owner)) return false
  for (const person of [unit.builder?.person, unit.entry?.person, unit.fight?.motion])
    if (person && !plainData(person)) return false
  return true
}

function unitIndex(w: World, session: QuerySession) {
  if (session.disabled) return
  if (session.units?.roster !== w.units || session.units.length !== w.units.length) {
    // Supported simulation records are plain data. Custom accessor-backed test
    // actors retain exhaustive evaluation, not a snapshot of side-effectful reads.
    if (!plainArray(w.units) || !w.units.every(plainUnit)) {
      session.disabled = true
      return
    }
    session.units = new SpatialRoster(w.units)
    if (session.units.byId.size !== w.units.length) {
      session.disabled = true
      return
    }
  }
  return session.units
}

function fightIndex(w: World, session: QuerySession) {
  if (session.disabled) return
  if (session.fights?.roster !== w.fights || session.fights.length !== w.fights.length) {
    if (
      !plainArray(w.fights) ||
      !w.fights.every(
        fight =>
          plainData(fight) &&
          plainArray(fight.members) &&
          (!fight.slots || plainArray(fight.slots)) &&
          (!fight.tribes || plainArray(fight.tribes)) &&
          (!fight.attackReservation || plainData(fight.attackReservation))
      )
    ) {
      session.disabled = true
      return
    }
    session.fights = new SpatialRoster(w.fights)
  }
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
  if (session?.disabled) return
  if ('members' in owner) session?.fights?.move(owner)
  else session?.units?.move(owner)
}

export function appendLiveCombatUnit(w: World, unit: Unit) {
  const session = sessions.get(w),
    index = session?.units
  if (session?.disabled || !index) return
  if (index.roster !== w.units || index.length + 1 !== w.units.length) {
    // An earlier removal can be hidden when this append restores the old length.
    // Do not leave that stale roster reusable by the next same-turn query.
    session.units = undefined
    return
  }
  if (!plainUnit(unit)) {
    sessions.get(w)!.disabled = true
    return
  }
  index.add(unit, index.length)
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
  const session = querySession(w)
  if (!session) return
  const units = unitIndex(w, session),
    fights = fightIndex(w, session)
  if (!units || !fights) return
  return {
    units: units.inCells(neighborhood(source, range)),
    fights: fights.inCells(neighborhood(source, range)),
    unitById: units.byId,
  }
}

export function liveCombatPeopleInCell(w: World, cell: number) {
  const session = querySession(w)
  return session && unitIndex(w, session)?.inCells([cell])
}
