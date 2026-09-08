import rules from './original-rules.json' with { type: 'json' }
import { nativeStep } from './native-math.ts'
import { currentPersonOrder, type OrderPool } from './person-orders.ts'
import { terrainCellHeightRange, type NativeTerrain } from './native-terrain.ts'
import { terrainSupportsPerson } from './person-collision.ts'
import { idleSlotPosition, type IdleWorld } from './person-idle.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

type Point = { x: number; y: number }
export type RestingObject = {
  id: number
  class: number
  model: number
  state: number
  flags3: number
  assignment: number
  formationCell: number
  anchorFlags: number
  commands: number[]
  commandCursor: number
  immediateCommand: number
}
type RestingPerson = RestingObject & {
  physics: number
  heading: number
  anchorX: number
  anchorY: number
}
export type RestingWorld = {
  land: Pick<NativeTerrain, 'heights' | 'flags' | 'categories' | 'buildingIds'>
  orders: OrderPool
  cellObjects: (cell: number) => Iterable<RestingObject>
  outside: (building: number) => Point
  search: Uint8Array
  slotOffsets: IdleWorld['slotOffsets']
}
const index = (cell: number) => ((cell & 0xfe00) >> 9) * 128 + ((cell & 254) >> 1)
const packed = (p: Point) => ((p.x >> 8) & 254) | (p.y & 0xfe00)

// 0x42c210 at fresh-world initialization. Centers are zeroed BSS; shapes 1..8
// receive exactly their population's positions. Shape zero reads shape six.
export function createRestingSlots() {
  const radii = [0, 0, 80, 100, 120, 130, 140, 150, 160],
    slots: Point[][] = [[]]
  for (let n = 1; n <= 8; n++) {
    const row = [{ x: 0, y: 0 }]
    for (let i = 0; i < n; i++) {
      const p = nativeStep({ x: 0, z: 0 }, (i * Math.trunc(2048 / n)) & 2047, radii[n])
      row.push({ x: p.x * 256, y: -p.z * 256 })
    }
    slots.push(row)
  }
  slots[0] = slots[6]
  return slots
}

// Complete 0x4d55a0, composing the current-command predicate at 0x4f62c0.
export function restingCellAvailable(w: RestingWorld, cell: number) {
  const i = index(cell)
  if (w.land.flags[i] & 0x4206) return false
  if (!(rules.terrainCategoryFlags[w.land.categories[i] & 15] & 1)) return false
  for (const p of w.cellObjects(cell & 0xfefe)) {
    if (p.class === 1) {
      const order = p.state === 10 || p.state === 33 ? currentPersonOrder(w.orders, p) : undefined
      if (order && !(order.flags & 1) && order.model === 24) return false
    } else if (p.class === 4 && !(rules.vehicleRestFlags[p.model] & 1)) return false
  }
  return true
}

// Complete 0x4d5420. Eligibility is checked at the slot's terrain position;
// occupancy is checked in its owning cell and ignores the shape high nibble.
export function restingSlotAvailable(
  w: RestingWorld,
  p: RestingPerson,
  cell = p.formationCell,
  flags = p.anchorFlags
) {
  if (!restingCellAvailable(w, cell)) return false
  const to = idleSlotPosition(w.slotOffsets, cell, flags)
  if (
    terrainCellHeightRange(w.land, packed(to)) > (rules.personSlopeLimits[p.physics] << 16) >> 16 ||
    !terrainSupportsPerson(w.land.categories[index(packed(to))], to)
  )
    return false
  for (const other of w.cellObjects(cell & 0xfefe))
    if (
      other.class === 1 &&
      other.id !== p.id &&
      other.assignment & 1 &&
      other.formationCell === cell &&
      !((other.anchorFlags ^ flags) & 15)
    )
      return false
  return true
}

// Complete 0x4d5120, with the actual shared indexed search and native six-slot
// preference. The first occupant receives shape 1; others start in shape 0.
export function findRestingSlot(w: RestingWorld, p: RestingPerson) {
  const search = startIndexedSearch(w.search, 2, p.heading, 0, 16)
  if (!search) return false
  let origin = { x: p.anchorX, y: p.anchorY }
  const i = index(packed(origin))
  if (w.land.flags[i] & 512) origin = w.outside(w.land.buildingIds[i] & 1023)
  const center = packed(origin)
  for (
    let delta = nextIndexedSearch(w.search, search);
    delta;
    delta = nextIndexedSearch(w.search, search)
  ) {
    const x = ((center & 255) + delta.x * 2) & 255,
      y = ((center >> 8) + delta.y * 2) & 255,
      cell = x | (y << 8)
    if (!restingCellAvailable(w, cell)) continue
    for (let slot = 1; slot < 7; slot++) {
      const to = idleSlotPosition(w.slotOffsets, cell, slot)
      if (
        terrainCellHeightRange(w.land, packed(to)) >
          (rules.personSlopeLimits[p.physics] << 16) >> 16 ||
        !terrainSupportsPerson(w.land.categories[index(packed(to))], to)
      )
        continue
      let count = 1,
        free = true
      for (const other of w.cellObjects(cell))
        if (
          other.class === 1 &&
          other.id !== p.id &&
          other.assignment & 1 &&
          other.formationCell === cell
        ) {
          count++
          if ((other.anchorFlags & 15) === slot) {
            free = false
            break
          }
        }
      if (free) {
        p.anchorFlags = slot | (count === 1 ? 16 : 0)
        p.formationCell = cell
        endIndexedSearch(w.search, search)
        return true
      }
    }
  }
  endIndexedSearch(w.search, search)
  return false
}

// Complete 0x4d56f0. Mark/count, detect changed shape, compact slot numbers,
// then walk the same native cell order again to request repositioning.
export function rebuildRestingSlots(w: Pick<RestingWorld, 'cellObjects'>, cell: number) {
  cell &= 0xfefe
  const slots = new Uint8Array(7)
  let count = 0,
    changed = false
  for (const p of w.cellObjects(cell))
    if (
      p.class === 1 &&
      p.assignment & 1 &&
      !(rules.personModels[p.model].flags & 0x400) &&
      p.anchorFlags & 15 &&
      p.formationCell === cell
    ) {
      const slot = p.anchorFlags & 15
      if (slot > 6) throw new RangeError('Invalid native resting slot')
      count++
      p.flags3 = (p.flags3 | 16) >>> 0
      slots[slot] = slot
    }
  if (!count) return
  for (const p of w.cellObjects(cell))
    if (p.flags3 & 16 && p.anchorFlags >> 4 !== count) {
      changed = true
      break
    }
  count = Math.min(count, 6)
  if (changed) for (let i = 1; i < 7; i++) if (!slots[i]) for (let j = i + 1; j < 7; j++) slots[j]--
  let assigned = 0
  for (const p of w.cellObjects(cell))
    if (p.flags3 & 16) {
      p.flags3 = (p.flags3 & ~16) >>> 0
      if (changed) {
        p.assignment |= 2
        p.anchorFlags = assigned < count ? (slots[p.anchorFlags & 15] & 15) | (count << 4) : 0
        assigned++
      }
    }
}
