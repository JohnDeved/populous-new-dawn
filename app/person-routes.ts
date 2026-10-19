import rules from './original-rules.json' with { type: 'json' }
import type { NativeTerrain } from './native-terrain.ts'
import { cellDelta, movePosition } from './native-math.ts'

interface Point {
  x: number
  y: number
}
export type RoutedPerson = Point & {
  id: number
  tribe: number
  vehicle: number
  flags2: number
  flags4: number
  motionGroup: number
  motionIndex: number
  recoveryCounter: number
  goalX: number
  goalY: number
  destinationX: number
  destinationY: number
  turnAngle: number
  turnY: number
}
export interface MotionRoutes {
  records: Uint8Array
  // Shipping scalable ownership. The first two payload bytes stay unused;
  // absent only in explicit classic/native-reference worlds.
  references?: Float64Array
  active: number
  last: number
  cursor: number
  failedSearches: Uint8Array
  pathResult: Uint8Array
}
export const createMotionRoutes = (scalable = false): MotionRoutes => ({
  records: new Uint8Array(401 * 109),
  ...(scalable ? { references: new Float64Array(401) } : {}),
  active: 0,
  last: 0,
  cursor: 0,
  failedSearches: new Uint8Array(80),
  pathResult: new Uint8Array(1033),
})
const short = (n: number) => (n << 16) >> 16
const view = (w: MotionRoutes) =>
  new DataView(w.records.buffer, w.records.byteOffset, w.records.byteLength)
const cell = (p: Point) => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)

// Preserve the native spare end record: allocation excludes it, reuse visits it.
export const motionRouteCapacity = (w: MotionRoutes) => w.records.length / 109 - 2

export function motionRouteReferences(w: MotionRoutes, id: number) {
  if (!w.references) return view(w).getInt16(id * 109, true)
  if (!Number.isSafeInteger(id) || id < 1 || id > motionRouteCapacity(w))
    throw new RangeError('Invalid scalable motion-route handle')
  const count = w.references[id]
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError('Invalid scalable motion-route reference count')
  return count
}

function changedRouteCount(w: MotionRoutes, count: number, delta: number) {
  if (!w.references) return delta ? short(count + delta) : count
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Number.isSafeInteger(count + delta) ||
    count + delta < 0
  )
    throw new RangeError('Invalid scalable motion-route count')
  return count + delta
}

function setRouteReferences(w: MotionRoutes, id: number, count: number) {
  if (w.references) w.references[id] = count
  else view(w).setInt16(id * 109, count, true)
}

// Demand growth, not a new gameplay ceiling. All allocations/copies complete
// before publication, so a representability/allocation error leaves both arrays
// and the cursor untouched. Actual engine/host memory limits can be much lower.
function growMotionRoutes(w: MotionRoutes) {
  const capacity = motionRouteCapacity(w),
    length = capacity * 2 + 2,
    bytes = length * 109
  if (!Number.isSafeInteger(length) || !Number.isSafeInteger(bytes))
    throw new RangeError('Scalable motion-route storage exceeds exact address range')
  const records = new Uint8Array(bytes),
    references = new Float64Array(length)
  records.set(w.records)
  references.set(w.references!)
  w.records = records
  w.references = references
  return capacity + 1
}

// Current-format ownership only. Never reconstruct missing counts from people:
// an omitted/damaged sidecar is an incompatible checkpoint, not an old-save path.
export function validateScalableMotionRoutes(w: MotionRoutes, people: Iterable<unknown>) {
  if (
    !w ||
    !(w.records instanceof Uint8Array) ||
    w.records.length < 401 * 109 ||
    w.records.length % 109 ||
    !(w.references instanceof Float64Array) ||
    w.references.length !== w.records.length / 109 ||
    !(w.failedSearches instanceof Uint8Array) ||
    w.failedSearches.length !== 80 ||
    !(w.pathResult instanceof Uint8Array) ||
    w.pathResult.length !== 1033 ||
    !Number.isSafeInteger(w.active) ||
    w.active < 0 ||
    w.active > motionRouteCapacity(w) ||
    !Number.isSafeInteger(w.cursor) ||
    w.cursor < 0 ||
    w.cursor > motionRouteCapacity(w) ||
    !Number.isSafeInteger(w.last) ||
    w.last < 0 ||
    w.last > motionRouteCapacity(w)
  )
    throw new RangeError('Invalid scalable checkpoint motion-route pool')
  if (
    new Set([w.records.buffer, w.references.buffer, w.failedSearches.buffer, w.pathResult.buffer])
      .size !== 4
  )
    throw new RangeError('Aliased scalable checkpoint motion-route storage')
  const counts = new Map<number, number>()
  for (const person of new Set(people)) {
    if (!person || typeof person !== 'object' || !('commands' in person || 'motionGroup' in person))
      continue
    if (
      !('motionGroup' in person) ||
      typeof person.motionGroup !== 'number' ||
      !Number.isSafeInteger(person.motionGroup) ||
      person.motionGroup < 0 ||
      person.motionGroup > motionRouteCapacity(w) ||
      !('motionIndex' in person) ||
      typeof person.motionIndex !== 'number' ||
      !Number.isInteger(person.motionIndex) ||
      person.motionIndex < 0 ||
      person.motionIndex > 255 ||
      (person.motionGroup && (person.motionIndex > 23 || !w.references[person.motionGroup]))
    )
      throw new RangeError('Invalid scalable checkpoint motion-route handle')
    if (person.motionGroup)
      counts.set(person.motionGroup, (counts.get(person.motionGroup) ?? 0) + 1)
  }
  let active = 0
  for (let id = 0; id < w.references.length; id++) {
    const count = w.references[id],
      a = id * 109
    if (!Number.isSafeInteger(count) || count < 0 || count !== (counts.get(id) ?? 0))
      throw new RangeError('Invalid scalable checkpoint motion-route ownership count')
    if (w.records[a] || w.records[a + 1] || w.records[a + 108] > 23 || w.records[a + 2] & ~7)
      throw new RangeError('Invalid scalable checkpoint motion-route payload')
    if (count) active++
  }
  if (active !== w.active) throw new RangeError('Invalid scalable checkpoint active-route count')
}

// 0x439850 refreshes pursuit when either target axis moves far enough from the
// last destination. Signed coordinates are compared without wrapping the delta.
export function pursuitDestinationChanged(
  p: Pick<RoutedPerson, 'goalX' | 'goalY'>,
  target: Point,
  radius: number
) {
  const tolerance = Math.trunc(radius / 2) + 56
  return (
    Math.abs(short(p.goalX) - short(target.x)) >= tolerance ||
    Math.abs(short(p.goalY) - short(target.y)) >= tolerance
  )
}

// Complete 0x4ea460. A zero group leaves the index untouched. Reserved routes
// (flag 4) survive their last user's departure; active counts are signed words.
export function releasePersonRoute(
  w: MotionRoutes,
  p: Pick<RoutedPerson, 'motionGroup' | 'motionIndex'>
) {
  const id = p.motionGroup
  if (!id) return
  const a = id * 109,
    count = motionRouteReferences(w, id)
  if (w.references && !count) throw new RangeError('Unowned scalable motion-route release')
  const active = changedRouteCount(w, w.active, count === 1 ? -1 : 0)
  p.motionGroup = 0
  p.motionIndex = 0
  if (count > 0) {
    setRouteReferences(w, id, count - 1)
    if (count === 1) {
      w.active = active
      if (!(w.records[a + 2] & 4)) w.records[a + 2] = 0
    }
  }
}

// Complete 0x4ea3b0, or 0x4ea400 with reserved=true. Callers release any prior
// ownership before attaching; reservation preserves a route at zero users.
export function attachPersonRoute(
  w: MotionRoutes,
  p: Pick<RoutedPerson, 'motionGroup' | 'motionIndex'>,
  id: number,
  reserved = false
) {
  if (w.references && p.motionGroup)
    throw new RangeError('Scalable motion-route attachment must release prior ownership')
  // Boarding may adopt a driver's no-route sentinel. Native 0x4657d0 still
  // calls 0x4ea3b0 for zero, creating a phantom raw count. Scalable ownership
  // keeps the same last/index/person outcome without owning sentinel storage.
  if (w.references && id === 0) {
    w.last = 0
    p.motionGroup = 0
    p.motionIndex = 0
    return
  }
  const a = id * 109,
    count = motionRouteReferences(w, id),
    references = changedRouteCount(w, count, 1),
    active = changedRouteCount(w, w.active, count < 1 ? 1 : 0)
  w.last = id
  w.active = active
  setRouteReferences(w, id, references)
  p.motionGroup = id
  p.motionIndex = 0
  w.records[a + 2] = (w.records[a + 2] & ~4) | (reserved ? 4 : 0)
}

// Complete 0x4e9dd0; used by resting and celebration's direct movements.
export function setDirectPersonDestination(w: MotionRoutes, p: RoutedPerson, to: Point) {
  releasePersonRoute(w, p)
  p.goalX = to.x & 65535
  p.destinationX = p.goalX
  p.turnAngle = p.goalX
  p.goalY = to.y & 65535
  p.destinationY = p.goalY
  p.turnY = p.goalY
  p.flags2 = ((p.flags2 & ~128) | 0x1000) >>> 0
}

// Complete 0x4ea4c0. Exhaustion returns the record's base point, even with
// no intermediate points. Coordinates are centered on the original even cell.
export function personRoutePosition(w: MotionRoutes, id: number, index: number) {
  const a = id * 109,
    intermediate = index < w.records[a + 108],
    offset = a + (intermediate ? 12 + index * 4 : 4)
  return {
    x: ((w.records[offset] & 254) + 1) * 256,
    y: ((w.records[offset + 1] & 254) + 1) * 256,
    intermediate,
  }
}

// Complete 0x4ea550, low-word result. The original scans only active-count
// slots backwards from the last route, including empty slots in that budget.
export function reusablePersonRoute(
  w: MotionRoutes,
  p: Pick<RoutedPerson, 'motionGroup' | 'vehicle'>,
  from: Point,
  to: Point
) {
  if (p.motionGroup && w.records[p.motionGroup * 109 + 2] & 4) return p.motionGroup
  const v = view(w),
    end = w.references ? motionRouteCapacity(w) + 1 : 400
  let id = w.last
  const near = (a: number, b: number) => {
    const n = Math.abs(a - b)
    return Math.min(n, 256 - n) < 3
  }
  for (let left = w.active; left > 0; left--, id--) {
    if (id < 1) id = end
    const a = id * 109,
      flags = w.records[a + 2]
    if (
      !(w.references ? w.references[id] : v.getInt16(a, true)) ||
      flags & 4 ||
      id === p.motionGroup
    )
      continue
    if (w.records[a + 8] !== to.x || w.records[a + 9] !== to.y) continue
    if (w.records[a + 4] === from.x && w.records[a + 5] === from.y) return id
    if (
      !(flags & 3) &&
      !p.vehicle &&
      near(w.records[a + 4], from.x) &&
      near(w.records[a + 5], from.y)
    )
      return id
  }
  return 0
}

// Complete 0x4ea300. Vehicle readiness remains an explicit world consumer.
export function updatePersonRouteVehicle(
  w: MotionRoutes,
  p: RoutedPerson,
  ready: (id: number) => boolean
) {
  if (!(p.flags4 & 512)) return
  let waiting = false
  if (p.vehicle && !(p.flags4 & 0x2000000) && !(p.flags2 & 0x80000) && p.motionGroup) {
    const a = p.motionGroup * 109
    waiting = !ready(p.vehicle) || !w.records[a + (w.records[a + 108] ? 14 : 6)]
  }
  p.flags2 = (waiting ? p.flags2 | 0x8000000 : p.flags2 & ~0x8000000) >>> 0
}

export interface RouteWorld {
  routes: MotionRoutes
  skip: number
  checkingPerson: number
  levelFlags2: number
  computerLimit: number
  humanLimit: number
  tribes: { playerType: number; requests: number }[]
  land: Pick<NativeTerrain, 'flags' | 'categories' | 'buildingIds'>
  vehicles: ReadonlyMap<number, Point>
}
export interface RouteEffects {
  outside: (id: number) => Point
  buildingBlocks: (cell: number) => boolean
  coastDirection: (to: Point) => number
  build: (p: RoutedPerson, from: Point, to: Point) => number
  vehicleReady: (id: number) => boolean
  advance: (p: RoutedPerson) => void
}

// 0x4ea6b0: raw route probes correct byte-coordinate endpoints before searching.
// A correction to either end commits both coarse coordinates, including odd bytes.
export function correctRouteEndpoints(
  w: Pick<RouteWorld, 'land' | 'vehicles' | 'checkingPerson'>,
  p: Pick<RoutedPerson, 'id' | 'vehicle'>,
  from: Point,
  to: Point,
  e: Pick<RouteEffects, 'outside' | 'buildingBlocks' | 'coastDirection'>
) {
  const start = (from.y >> 1) * 128 + (from.x >> 1),
    end = (to.y >> 1) * 128 + (to.x >> 1)
  let a = { x: (from.x & 254) << 8, y: (from.y & 254) << 8 },
    b = { x: (to.x & 254) << 8, y: (to.y & 254) << 8 },
    changed = !!(w.land.flags[start] & 512)
  if (changed) a = e.outside(w.land.buildingIds[start] & 1023)
  if (w.land.flags[end] & 512) {
    w.checkingPerson = p.id
    if (e.buildingBlocks(to.x | (to.y << 8))) {
      changed = true
      b = e.outside(w.land.buildingIds[end] & 1023)
    }
  }
  if (p.vehicle) {
    a = { ...w.vehicles.get(p.vehicle)! }
    changed = true
  } else {
    for (const [point, index] of [
      [a, start],
      [b, end],
    ] as const)
      if (rules.terrainCategoryFlags[w.land.categories[index] & 15] & 60) {
        changed = true
        movePosition(point, e.coastDirection(point) * 256 + 1024, 512)
      }
  }
  if (changed) {
    from.x = a.x >> 8
    from.y = a.y >> 8
    to.x = b.x >> 8
    to.y = b.y >> 8
  }
}

// Complete 0x4e9e80. Route construction and advancement remain required
// consumers; reuse, ownership, capacity gates and destination changes compose.
export function planPersonDestination(w: RouteWorld, p: RoutedPerson, to: Point, e: RouteEffects) {
  p.goalX = to.x & 65535
  p.goalY = to.y & 65535
  let enabled = false
  if (w.skip) w.skip = 0
  else
    enabled =
      !(w.levelFlags2 & 0x400000) &&
      !!(p.flags2 & 0x2000000) &&
      !(p.vehicle && p.flags4 & 0x2000000)
  p.flags4 = (p.flags4 & ~0x10000000) >>> 0
  if (enabled) {
    const tribe = w.tribes[p.tribe]
    let limit = 0
    if (tribe.playerType === 1) limit = w.computerLimit
    else if (tribe.playerType === 2) limit = w.humanLimit
    if (limit && tribe.requests > limit) enabled = false
  }
  if (enabled) {
    const start = cell(p),
      end = cell(to),
      startBuilding = w.land.buildingIds[start] & 1023
    if (!startBuilding || startBuilding !== (w.land.buildingIds[end] & 1023)) {
      let from = w.land.flags[start] & 512 ? e.outside(startBuilding) : { x: p.x, y: p.y },
        target = { x: p.goalX, y: p.goalY },
        adjusted = false
      if (w.land.flags[end] & 512) {
        w.checkingPerson = p.id
        if (e.buildingBlocks(((to.x >> 8) & 254) | (to.y & 0xfe00))) {
          adjusted = true
          target = e.outside(w.land.buildingIds[end] & 1023)
        }
      }
      const coast = (point: Point) => {
        const angle = (e.coastDirection(point) * 256 + 1024) & 2047
        return {
          x: (point.x + ((rules.sine[angle] << 9) >> 16)) & 65535,
          y: (point.y + ((rules.sine[(angle + 512) & 2047] << 9) >> 16)) & 65535,
        }
      }
      if (p.vehicle) {
        const vehicle = w.vehicles.get(p.vehicle)
        if (!vehicle) throw new Error('Missing native route vehicle')
        from = { ...vehicle }
      } else {
        if (rules.terrainCategoryFlags[w.land.categories[start] & 15] & 60) from = coast(from)
        if (rules.terrainCategoryFlags[w.land.categories[end] & 15] & 60) {
          adjusted = true
          target = coast(target)
        }
      }
      if (adjusted) {
        p.goalX = target.x
        p.goalY = target.y
      }
      const a = { x: from.x >> 8, y: from.y >> 8 },
        b = { x: target.x >> 8, y: target.y >> 8 }
      const built = reusablePersonRoute(w.routes, p, a, b) || e.build(p, a, b),
        id = w.routes.references ? built : short(built)
      p.recoveryCounter = 0
      if (adjusted) p.flags4 = (p.flags4 | 0x4000000) >>> 0
      if (id) {
        p.flags2 = (p.flags2 & 0x7fffffff) >>> 0
        releasePersonRoute(w.routes, p)
        attachPersonRoute(w.routes, p, id)
        const point = personRoutePosition(w.routes, id, 0)
        p.destinationX = point.x
        p.destinationY = point.y
        updatePersonRouteVehicle(w.routes, p, e.vehicleReady)
        e.advance(p)
        return id
      }
    }
  }
  if (p.motionGroup && !(w.routes.records[p.motionGroup * 109 + 2] & 4))
    releasePersonRoute(w.routes, p)
  p.destinationX = p.goalX
  p.destinationY = p.goalY
  return 0
}

// Complete 0x4e9d80 wrapper. Vehicle landing-target adjustment is supplied.
export function setPlannedPersonDestination(
  w: RouteWorld,
  p: RoutedPerson,
  to: Point,
  e: RouteEffects,
  adjustVehicle: (to: Point) => void
) {
  const target = { x: to.x & 65535, y: to.y & 65535 }
  adjustVehicle(target)
  planPersonDestination(w, p, target, e)
  p.turnAngle = p.destinationX
  p.turnY = p.destinationY
  p.flags2 = ((p.flags2 & ~128) | 0x1000) >>> 0
}

type RouteBuildPerson = RoutedPerson & { flags3: number }
interface RouteBuildEffects {
  findVehicle: (
    p: RouteBuildPerson,
    center: Point,
    minimum: number,
    maximum: number
  ) => Point | null
  search: (
    mode: 0 | 1,
    p: RouteBuildPerson,
    from: Point,
    to: Point,
    option: number,
    vehicles: boolean
  ) => number
}
const failedRouteMatches = (cache: Uint8Array, a: number, from: Point, to: Point) =>
  cache[a + 2] === (from.x & 254) &&
  cache[a + 3] === (from.y & 254) &&
  cache[a + 6] === (to.x & 254) &&
  cache[a + 7] === (to.y & 254)

// Complete 0x4ec390, including signed-word underflow for nonzero timers.
export function ageFailedRoutes(w: MotionRoutes) {
  const c = w.failedSearches,
    v = new DataView(c.buffer, c.byteOffset, c.byteLength)
  for (let a = 0; a < 80; a += 10) {
    const timer = v.getInt16(a, true)
    if (timer) v.setInt16(a, timer - 1, true)
  }
}

// Complete 0x4ec680. Clear every matching entry, preserving its other bytes.
export function clearFailedRoute(w: MotionRoutes, id: number) {
  if (!id) return
  const a = id * 109,
    from = { x: w.records[a + 4], y: w.records[a + 5] },
    to = { x: w.records[a + 8], y: w.records[a + 9] },
    c = w.failedSearches
  const v = new DataView(c.buffer, c.byteOffset, c.byteLength)
  for (let offset = 0; offset < 80; offset += 10)
    if (v.getInt16(offset, true) && failedRouteMatches(c, offset, from, to))
      v.setInt16(offset, 0, true)
}

// Complete 0x4ea970, low-word result. Search writes the shared native result
// buffer (two 4-byte endpoints, 256 4-byte points, then its byte count).
// Construction does not attach the person or increment the active route count.
export function buildPersonRoute(
  w: MotionRoutes,
  p: RouteBuildPerson,
  from: Point,
  to: Point,
  option: number,
  tribe: { flags: number },
  e: RouteBuildEffects
) {
  p.flags4 = (p.flags4 & ~0x10000000) >>> 0
  const cache = w.failedSearches,
    cv = new DataView(cache.buffer, cache.byteOffset, cache.byteLength)
  for (let a = 0; a < 80; a += 10)
    if (cv.getInt16(a, true) && failedRouteMatches(cache, a, from, to)) {
      p.flags4 = (p.flags4 | 0x10000000) >>> 0
      return 0
    }
  // The compiled >= 0x960679 guard wraps before record 400. Keep the
  // original 400 probes over slots 1..399, distinct from reuse's wrap at 400.
  const v = view(w),
    capacity = w.references ? motionRouteCapacity(w) : 399
  let id = w.cursor + 1,
    found = false
  for (let probes = 0; probes < capacity + 1; probes++, id++) {
    if (id > capacity) id = 1
    if (!(w.references ? w.references[id] : v.getInt16(id * 109, true))) {
      w.cursor = id
      found = true
      break
    }
  }
  if (!found) {
    if (!w.references) return 0
    id = growMotionRoutes(w)
    w.cursor = id
  }
  w.pathResult[1032] = 0
  let success = false,
    viaVehicle = false
  const vehicles = () => !!(tribe.flags & 32) && !(p.flags4 & 8) && !(p.flags3 & 0x2000)
  const vehicleSearch = (minimum: number, maximum: number) => {
    const center = { x: ((from.x & 254) + 1) * 256, y: ((from.y & 254) + 1) * 256 },
      vehicle = e.findVehicle(p, center, minimum, maximum)
    if (!vehicle) return false
    const target = { x: vehicle.x >> 8, y: vehicle.y >> 8 }
    if (e.search(1, p, from, target, option, false) === 1) return false
    to.x = target.x
    to.y = target.y
    viaVehicle = true
    return true
  }
  if (vehicles() && !(p.vehicle && !(p.flags4 & 0x2000000))) {
    const dx = cellDelta(from.x, to.x),
      dy = cellDelta(from.y, to.y) // 0x450590, no halving.
    if (dx * dx + dy * dy > 100) success = vehicleSearch(0, 2048)
  }
  if (!success) {
    success = e.search(0, p, from, to, option, vehicles()) !== 1
    if (!success && vehicles()) success = vehicleSearch(2048, 10240)
    if (!success) {
      let oldest = 0
      for (let a = 10; a < 80; a += 10)
        if (cv.getInt16(a, true) < cv.getInt16(oldest, true)) oldest = a
      cv.setInt16(oldest, 16, true)
      cache[oldest + 2] = from.x & 254
      cache[oldest + 3] = from.y & 254
      cache[oldest + 6] = to.x & 254
      cache[oldest + 7] = to.y & 254
      p.flags4 = (p.flags4 | 0x10000000) >>> 0
      return 0
    }
  }
  const a = id * 109
  w.records.set(w.pathResult.subarray(0, 8), a + 4)
  w.records[a + 2] = (viaVehicle ? w.records[a + 2] | 2 : w.records[a + 2] & ~2) & ~1
  const count = Math.min(w.pathResult[1032], 23)
  w.records[a + 108] = count
  w.records.set(w.pathResult.subarray(8, 8 + count * 4), a + 12)
  for (let i = 0; i < count; i++) if (w.pathResult[10 + i * 4]) w.records[a + 2] |= 1
  return id
}

// Complete 0x4ebab0. Check the next vehicle leg, or the final flagged target;
// the original uses boat lookup even for the route's alternate-vehicle flag.
export function routeVehicleAvailable(
  w: MotionRoutes,
  p: Pick<RoutedPerson, 'motionGroup' | 'motionIndex'>,
  boarding: (cell: number) => number
) {
  const a = p.motionGroup * 109,
    d = w.records,
    flags = d[a + 2],
    count = d[a + 108]
  let at = -1
  if (flags & 1) {
    if (count) {
      for (let i = (p.motionIndex << 24) >> 24; i < count; i++)
        if (d[a + 14 + i * 4]) {
          at = a + 12 + i * 4
          break
        }
    } else if (d[a + 6]) at = a + 4
  } else if (flags & 2) at = a + (count ? 8 + count * 4 : 4)
  return at < 0 || !!boarding((d[at] & 254) | ((d[at + 1] & 254) << 8))
}
