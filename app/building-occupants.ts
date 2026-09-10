import rules from './original-rules.json' with { type: 'json' }
import { buildingOutsidePoint, type BuildingShapePose } from './building-shapes.ts'
import { nativeAngle, nativeStep } from './native-math.ts'
import {
  clearPersonOrders,
  type OrderedPerson,
  type OrderPool,
  type OrderEffects,
} from './person-orders.ts'
import type { TrainingBuilding } from './training.ts'

export type BuildingOccupant = OrderedPerson & {
  class: number
  tribe: number
  renderFlags: number
  supportHeight: number
  h: number
  displacement: { x: number; y: number; h: number }
  anchorX: number
  anchorY: number
  anchorFlags: number
  angle: number
  turnAngle: number
  heading: number
}
export type OccupiedBuilding = BuildingShapePose &
  Pick<TrainingBuilding, 'id' | 'class' | 'model' | 'flags2' | 'flags3' | 'activity' | 'inside'> & {
    tribe: number
    occupants: number[]
    trainingTimer: number
    trainingCost: number
    entryDelay: number
    lastActivity: number
  }
export interface OccupancyWorld {
  people: Map<number, BuildingOccupant>
  orders: OrderPool
  towerTribes: number
  buildings: Map<number, OccupiedBuilding>
  turn: number
  buildingAt: (cell: number) => number
  tribes: { personCounts: number[]; playerType: number; buildingIds: number[] }[]
}
// Required world consumers: vehicle removal, land-cell membership, tower
// placement, construction-plan geometry and occupancy indicator allocation.
export interface OccupancyEffects {
  orders: OrderEffects
  leaveVehicle: (person: BuildingOccupant) => void
  adjacentBuilding: (person: BuildingOccupant, model: number) => number
  towerPosition: (id: number) => { x: number; y: number; supportHeight: number }
  terrainHeight: (x: number, y: number) => number
  moveToCell: (person: BuildingOccupant, x: number, y: number, height: number) => void
  insertCell: (person: BuildingOccupant) => void
  removeCell: (person: BuildingOccupant) => void
  planExitPoint: (building: OccupiedBuilding) => { x: number; y: number }
  updateIndicator: (building: OccupiedBuilding) => void
}
const short = (n: number) => (n << 16) >> 16
const byte = (n: number) => (n << 24) >> 24
function live(w: OccupancyWorld, id: number) {
  const p = id ? w.people.get(id) : undefined
  return p?.class && !(p.flags2 & 1) ? p : undefined
}

// 0x41b0c0 arithmetic. Both multiplications wrap before signed division by 256.
export function nativeTrainingCost(count: number, model: number, playerType: number, amount = 1) {
  const training = rules.personTraining[model]
  if (!training) throw new RangeError(`Unsupported native person model ${model}`)
  count = short(count)
  const band = count < 4 ? 0 : count < 8 ? 1 : count < 12 ? 2 : count < 16 ? 3 : count < 21 ? 4 : 5
  const mana = playerType === 2 ? training.humanMana : training.computerMana
  return Math.trunc(Math.imul(Math.imul(rules.trainingBands[band], mana), amount) / 256) | 0
}

// 0x408d20. Count conversion weight of live occupants that are not already the
// destination model, irrespective of tribe; only a full conversion counts.
export function trainingOccupantWeight(w: OccupancyWorld, b: OccupiedBuilding) {
  if (!b.inside) return 0
  const model = rules.buildingTrainedModel[b.model],
    capacity = rules.buildingCapacity[b.model]
  let weight = 0
  for (let i = 0; i < capacity; i++) {
    const p = live(w, b.occupants[i])
    if (p && p.model !== model) weight += short(rules.personTraining[p.model].weight)
  }
  return weight >= short(rules.personTraining[model].weight) ? weight : 0
}

// 0x40bbe0. A zero conversion count stores zero here; callers decide whether
// repricing is warranted or whether the previous cost word must be preserved.
export function repriceTraining(w: OccupancyWorld, b: OccupiedBuilding) {
  const model = rules.buildingTrainedModel[b.model],
    tribe = w.tribes[b.tribe]
  const divisor = short(rules.personTraining[model].weight)
  if (!divisor) throw new RangeError('Native training model has zero conversion weight')
  const amount = Math.trunc(trainingOccupantWeight(w, b) / divisor)
  b.trainingCost =
    Math.min(
      65535,
      nativeTrainingCost(tribe.personCounts[model], model, tribe.playerType, amount)
    ) & 65535
}

// Shared activity rebuild in native admission and removal.
function updateTrainingOccupants(w: OccupancyWorld, b: OccupiedBuilding) {
  b.flags3 = (b.flags3 & ~0x1000) >>> 0
  b.trainingTimer = 0
  const weight = trainingOccupantWeight(w, b)
  b.activity = weight ? b.activity | 128 : b.activity & ~128
  if (weight) repriceTraining(w, b)
  for (let i = 0; i < rules.buildingCapacity[b.model]; i++) {
    const occupant = live(w, b.occupants[i])
    if (occupant?.tribe === b.tribe)
      occupant.assignment = weight ? occupant.assignment | 4 : occupant.assignment & ~4
  }
}

// 0x4d80e0. Modes 0/4 hide ordinary occupants; 3 retains training/workshop
// commands and presentation. Mode 1 restores land membership and vertical state.
export function setPersonOccupancy(
  w: OccupancyWorld,
  p: BuildingOccupant,
  mode: number,
  effects: OccupancyEffects
) {
  mode &= 255
  if (mode === 0 || mode === 4) {
    effects.leaveVehicle(p)
    if (mode !== 4) clearPersonOrders(w.orders, p, effects.orders)
    p.flags4 = (p.flags4 & ~256) >>> 0
    p.flags2 = (p.flags2 | 0x804000) >>> 0
    const tower = effects.adjacentBuilding(p, 4)
    if (tower) {
      const point = effects.towerPosition(tower)
      p.supportHeight = point.supportHeight & 65535
      const height = effects.terrainHeight(point.x, point.y)
      effects.moveToCell(p, point.x, point.y, height)
      return
    }
    if (p.model !== 7 || !effects.adjacentBuilding(p, 19)) {
      p.renderFlags |= 16
      if (p.flags2 & 0x20000) effects.removeCell(p)
    }
  } else if (mode === 1) {
    restoreBuildingOccupant(p, effects.terrainHeight, () => effects.insertCell(p))
  } else if (mode === 3) {
    effects.leaveVehicle(p)
    p.flags2 = (p.flags2 | 0x800000) >>> 0
  }
}

// 0x407150. Admission consumes the first empty physical slot, not `inside` as
// an array index. The shaman can request an ejection at nominal capacity; entry
// still requires an empty slot afterwards. Failed admission leaves orders alone.
export function enterBuilding(
  w: OccupancyWorld,
  p: BuildingOccupant,
  b: OccupiedBuilding,
  effects: OccupancyEffects
) {
  const flags = rules.buildingFlags[b.model],
    capacity = rules.buildingCapacity[b.model]
  if ((p.tribe !== b.tribe && !(flags & 0x100000)) || !(b.activity & 8)) return 0
  if (byte(b.inside) >= capacity) {
    if (p.model !== 7) return 0
    removeBuildingOccupant(w, b, undefined, effects)
  }
  const slot = b.occupants.slice(0, 6).indexOf(0)
  if (slot < 0) return 0
  b.inside = (b.inside + 1) & 255
  b.occupants[slot] = p.id
  setPersonOccupancy(w, p, flags & 65 ? 3 : 0, effects)
  if (b.model === 4) w.towerTribes = (w.towerTribes | (1 << (b.tribe & 31))) & 255
  if (rules.buildingFlags[b.model] & 1) {
    updateTrainingOccupants(w, b)
  }
  effects.updateIndicator(b)
  b.activity &= ~1024
  p.orderLocation = 0
  return 1
}

// 0x409ed0: a nonzero terrain index suppresses list fallback, even when it is
// the wrong class/building. The tribe list is consulted only for index zero.
export function leaveBuilding(w: OccupancyWorld, p: BuildingOccupant, effects: OccupancyEffects) {
  const id = w.buildingAt(((p.x >>> 8) & 254) | (p.y & 0xfe00)) & 1023
  if (id) {
    const b = w.buildings.get(id)
    if (b?.class === 2) removeBuildingOccupant(w, b, p, effects)
  } else {
    for (const id of w.tribes[p.tribe].buildingIds) {
      const b = w.buildings.get(id)!
      if (b.occupants.some(slot => short(slot) === p.id)) {
        removeBuildingOccupant(w, b, p, effects)
        return
      }
    }
  }
}

// Shared outside target in removal and training conversion.
export function buildingExitPoint(b: BuildingShapePose, outside = buildingOutsidePoint(b)) {
  const exit = nativeStep({ x: outside.x / 256, z: -outside.y / 256 }, (b.angle + 512) & 2047, 512)
  return { x: Math.round(exit.x * 256) & 65535, y: Math.round(-exit.z * 256) & 65535 }
}

// Mode 1 of 0x4d80e0. Keep XY and physical velocity; clear only the previous
// motion deltas, so revealing an occupant cannot interpolate from stale motion.
export function restoreBuildingOccupant(
  p: Pick<
    BuildingOccupant,
    'x' | 'y' | 'h' | 'displacement' | 'renderFlags' | 'assignment' | 'flags2' | 'flags4'
  >,
  terrainHeight: (x: number, y: number) => number,
  insertCell: () => void
) {
  p.renderFlags &= ~16
  p.assignment &= ~4
  p.flags4 = (p.flags4 | 256) >>> 0
  p.flags2 = (p.flags2 & ~0x804000) >>> 0
  if (!(p.flags2 & 0x20000)) insertCell()
  p.h = short(terrainHeight(p.x, p.y))
  p.displacement.x = 0
  p.displacement.y = 0
  p.displacement.h = 0
}

// Placement tail of 0x407490, shared with the live occupancy adapter.
export function faceBuildingExit(
  p: Pick<
    BuildingOccupant,
    'x' | 'y' | 'anchorX' | 'anchorY' | 'anchorFlags' | 'flags2' | 'turnAngle' | 'heading' | 'angle'
  >,
  { x, y }: { x: number; y: number }
) {
  p.anchorX = (x & 0xfe00) + 256
  p.anchorY = (y & 0xfe00) + 256
  p.anchorFlags = 0
  const angle = nativeAngle(short(x - p.x), -short(y - p.y))
  if (p.flags2 & 128) p.turnAngle = angle
  p.heading = angle
  p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
  p.flags2 = (p.flags2 | 16) >>> 0
}

// 0x407490. Restore the person at its current location, then set the outside
// movement target and facing. Native removal does not teleport to the door.
export function removeBuildingOccupant(
  w: OccupancyWorld,
  b: OccupiedBuilding | undefined,
  person: BuildingOccupant | undefined,
  effects: OccupancyEffects
): BuildingOccupant | undefined {
  if (!b) {
    if (person) leaveBuilding(w, person, effects)
    return
  }
  if (byte(b.inside) <= 0) return
  const slot = b.occupants
    .slice(0, 6)
    .findIndex(id => (person ? short(id) === person.id : id !== 0))
  if (slot < 0) return
  const p = w.people.get(b.occupants[slot])
  if (!p) throw new RangeError('Native occupant slot has no object record')
  b.inside = (b.inside - 1) & 255
  b.occupants[slot] = 0
  b.activity &= ~4
  setPersonOccupancy(w, p, 1, effects)
  if (b.model === 4) w.towerTribes = (w.towerTribes | (1 << (b.tribe & 31))) & 255
  if (rules.buildingFlags[b.model] & 1) updateTrainingOccupants(w, b)
  effects.updateIndicator(b)
  faceBuildingExit(p, buildingExitPoint(b, b.class === 9 ? effects.planExitPoint(b) : undefined))
  b.entryDelay = 12
  b.activity &= ~1024
  if (rules.buildingFlags[b.model] & 32) b.lastActivity = w.turn >>> 0
  return p
}
