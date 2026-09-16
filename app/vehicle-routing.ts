import rules from './original-rules.json' with { type: 'json' }
import { pathBoatInCell } from './path-search.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

type Point = { x: number; y: number }
type CellObject = { id: number; class: number; model: number }
export type RoutingVehicle = CellObject &
  Point & {
    physics: number
    speed: number
    navigationFlags: number
    passengerCount: number
    passengers: number[]
    reservation: number
  }
type VehicleLand = {
  flags: ArrayLike<number>
  categories: ArrayLike<number>
  cellObjects: (cell: number) => Iterable<CellObject>
}
export type VehicleRoutingWorld = VehicleLand & {
  boatsEnabled: number
  vehicles: ReadonlyMap<number, RoutingVehicle>
  people: ReadonlyMap<number, { tribe: number }>
  tribes: { playerType: number }[]
}
const cell = (p: Point) => ((p.x >> 8) & 254) | (p.y & 0xfe00)
const index = (cell: number) => ((cell >> 9) & 127) * 128 + ((cell & 254) >> 1)
const signedByte = (n: number) => (n << 24) >> 24

// Complete 0x465510: all other class-4 objects block, regardless of dead flags.
export function vehicleCellFree(w: Pick<VehicleLand, 'cellObjects'>, packed: number, id: number) {
  for (const o of w.cellObjects(packed & 0xfefe)) if (o.class === 4 && o.id !== id) return false
  return true
}

// Complete 0x464f90. Boats need a marked shore; airborne vehicles instead
// reject flag 2. Both exclude occupied cells and terrain flags 0x204.
export function vehicleCanDisembark(
  w: VehicleLand,
  v: Pick<RoutingVehicle, 'id' | 'model'>,
  p: Point
) {
  const packed = cell(p),
    i = index(packed),
    flags = w.flags[i]
  if (flags & 0x204) return false
  if (rules.vehicleRestFlags[v.model] & 1) return vehicleCellFree(w, packed, v.id) && !(flags & 2)
  if (!(flags & 0x1000000) || !vehicleCellFree(w, packed, v.id)) return false
  const category = rules.terrainCategoryFlags[w.categories[i] & 15]
  return !!(category & 60) && !(category & 16)
}

// Complete 0x4650d0, including open-water category bit 2.
export function vehicleCanApproach(w: VehicleLand, v: Pick<RoutingVehicle, 'id'>, p: Point) {
  const packed = cell(p),
    i = index(packed),
    flags = w.flags[i]
  if (flags & 0x204 || !vehicleCellFree(w, packed, v.id)) return false
  const category = rules.terrainCategoryFlags[w.categories[i] & 15]
  return category & 60 ? !!(flags & 0x1000000) && !(category & 16) : !!(category & 2)
}

// Complete 0x465650. Read signed speed and the original physics speed limit.
export function vehicleReady(
  w: Pick<VehicleLand, 'flags' | 'categories'>,
  v: Pick<RoutingVehicle, 'x' | 'y' | 'model' | 'physics' | 'speed' | 'navigationFlags'>
) {
  if (v.navigationFlags & 0x10000) return false
  const i = index(cell(v)),
    airborne = !!(rules.vehicleRestFlags[v.model] & 1)
  return (
    !!(rules.terrainCategoryFlags[w.categories[i] & 15] & (airborne ? 61 : 60)) &&
    !(w.flags[i] & (airborne ? 0x100204 : 0x100004)) &&
    (v.speed << 16) >> 16 < (rules.personSpeeds[v.physics] << 16) >> 16
  )
}

// Complete 0x4663c0 with actual readiness and 0x4f2490's reservation byte.
// Only the first eligible vehicle is considered, even when it cannot board.
export function boardingVehicle(w: VehicleRoutingWorld, p: { tribe: number }, packed: number) {
  const id = pathBoatInCell(w, packed)
  if (!id) return 0
  const v = w.vehicles.get(id)
  if (!v) throw Error('Missing native boarding vehicle')
  if (
    v.navigationFlags & 0x10000 ||
    signedByte(v.passengerCount) >= signedByte(rules.vehicleCapacity[v.model]) ||
    !vehicleReady(w, v)
  )
    return 0
  if (v.passengerCount && w.people.get(v.passengers[0])!.tribe !== p.tribe) return 0
  return w.tribes[p.tribe].playerType === 1 && v.reservation ? 0 : id
}

export type LandingReservations = { search: Uint8Array; records: Uint8Array; count: number }
// Complete 0x4ec3f0. Indexed search and reservations are shared across requests;
// the outer scheduler owns clearing reservation records and their count.
export function adjustVehicleDestination(
  w: VehicleLand,
  slots: LandingReservations,
  v: Pick<RoutingVehicle, 'id' | 'model'> | null,
  to: Point
) {
  if (!v) return
  const center = cell(to),
    airborne = !!(rules.vehicleRestFlags[v.model] & 1)
  if (!airborne && !(rules.terrainCategoryFlags[w.categories[index(center)] & 15] & 2)) return
  const handle = startIndexedSearch(slots.search, 2, 0, 0, 32)
  if (!handle) return
  const data = slots.records,
    view = new DataView(data.buffer, data.byteOffset, data.byteLength),
    count = slots.count
  for (
    let offset = nextIndexedSearch(slots.search, handle);
    offset;
    offset = nextIndexedSearch(slots.search, handle)
  ) {
    const x = ((center & 255) + offset.x * 2) & 255,
      y = ((center >> 8) + offset.y * 2) & 255,
      packed = x | (y << 8)
    if (
      (!airborne && !(rules.terrainCategoryFlags[w.categories[index(packed)] & 15] & 2)) ||
      !vehicleCellFree(w, packed, v.id)
    )
      continue
    let reserved = false,
      seen = 0
    for (let a = 0; seen < count; a += 3) {
      if (a >= data.length) throw Error('Inconsistent native landing reservation count')
      if (data[a + 2]) {
        seen++
        if (view.getUint16(a, true) === packed) {
          reserved = true
          break
        }
      }
    }
    if (reserved) continue
    to.x = (x + 1) * 256
    to.y = (y + 1) * 256
    if (count < 16)
      for (let a = 0; a < 48; a += 3)
        if (!data[a + 2]) {
          slots.count = ((slots.count + 1) << 16) >> 16
          data[a + 2] = 1
          view.setUint16(a, packed, true)
          break
        }
    break
  }
  endIndexedSearch(slots.search, handle)
}

// Complete 0x464ce0 for Boats. Balloon state 4 reuses the bounded search with its
// distinct disembark predicate; the initial point remains exact, alternatives center.
export function findVehicleLanding(
  w: VehicleLand,
  search: Uint8Array,
  v: Pick<RoutingVehicle, 'id' | 'model'>,
  to: Point
) {
  let point = { ...to },
    canLand = (candidate: Point) =>
      rules.vehicleRestFlags[v.model] & 1
        ? vehicleCanDisembark(w, v, candidate)
        : vehicleCanApproach(w, v, candidate),
    found = canLand(to)
  if (!found) {
    const handle = startIndexedSearch(search, 2, 0, 0, 16),
      center = cell(to)
    if (handle) {
      for (
        let offset = nextIndexedSearch(search, handle);
        offset;
        offset = nextIndexedSearch(search, handle)
      ) {
        const candidate = {
          x: ((((center & 255) + offset.x * 2) & 255) + 1) * 256,
          y: ((((center >> 8) + offset.y * 2) & 255) + 1) * 256,
        }
        if (canLand(candidate)) {
          point = candidate
          found = true
          break
        }
      }
      endIndexedSearch(search, handle)
    }
  }
  return { found, point }
}
