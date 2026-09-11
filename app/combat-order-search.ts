import rules from './original-rules.json' with { type: 'json' }
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import { pathCellBlocked, type CollisionWorld, type CollisionPerson } from './person-collision.ts'
import { positionDistance } from './native-math.ts'
import { emptyPersonOrder, type PersonOrder } from './person-orders.ts'
import {
  randomPersonSpeed,
  recoverPersonMovement,
  setPersonAnimationRow,
  type PersonStateEffects,
} from './person-state.ts'
import { retryCombatTarget, type CombatApproachPerson } from './combat-approach.ts'

interface Point {
  x: number
  y: number
}
export type SearchingCombatPerson = CombatApproachPerson & {
  turnY: number
  marchCooldown: number // Native byte +0x1e, separate from the animation stamp.
}
export interface CombatMarch {
  count: number
  person: number
  a: number
  b: number
  distance: number
}

// 0x520250. Removal advances to the next physical slot, so the shifted row waits
// for the next visit. Keep that ordering without the original byte-copy loop.
export function announceCombatMarches(
  marches: CombatMarch[],
  sound: (person: number, cue: number) => void
) {
  for (let i = 0; i < marches.length; i++) {
    const march = marches[i]
    if (march.distance >= 1536) continue
    sound(march.person, march.count >= 1 && march.count <= 3 ? 44 + march.count : 48)
    marches.splice(i, 1)
  }
}
interface CombatSearchWorld {
  randomState: number
  playerTribe: number
  alert: number
  marches: CombatMarch[]
}
interface CombatSearchEffects {
  animation: PersonStateEffects['setAnimation']
  releaseMotion: () => void
  approachPoint: (order: PersonOrder) => Point & { kind: number }
  destination: (point: Point) => void
  withinArea: (order: PersonOrder) => boolean
  select: (order: PersonOrder, vehicleOnly: boolean) => { id: number; type: number } | undefined
  prepareTarget: (order: PersonOrder, id: number) => boolean
  range: () => number
}

// 0x51a2a0 shares eight march summaries across people, keyed by both payload
// words. Existing records still update when full; only new records need space.
function recordMarch(w: CombatSearchWorld, p: SearchingCombatPerson, order: PersonOrder) {
  const distance = positionDistance({ x: p.turnAngle, y: p.turnY }, p)
  const match = w.marches.find(m => m.a === order.a && m.b === order.b)
  if (match) {
    if (!p.marchCooldown) match.count = (match.count + 1) & 255
    match.distance = Math.min(match.distance, distance)
    p.marchCooldown = 16
  } else if (distance > 2560 && w.marches.length < 8) {
    w.marches.push({ count: 1, person: p.id, a: order.a, b: order.b, distance })
    p.marchCooldown = 16
  }
}

function chooseTarget(
  p: SearchingCombatPerson,
  order: PersonOrder,
  e: Pick<CombatSearchEffects, 'select' | 'prepareTarget'>,
  vehicleOnly = false
) {
  const target = e.select(order, vehicleOnly)
  if (!target) return undefined
  const { id, type } = target
  p.workTarget = id
  p.substate = type >= 1 && type <= 4 ? type : 0
  if (p.model === 6 && (type === 2 || type === 3)) p.substate += 8
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  return e.prepareTarget(order, id)
}

// Used by automatic entry fallback, periodic local scans and busy-target retry.
// No result leaves ownership intact; each caller supplies its own restart rule.
export function retargetCombatOrder(
  p: SearchingCombatPerson,
  radius: number,
  e: Pick<CombatSearchEffects, 'select' | 'prepareTarget'>
) {
  const order = emptyPersonOrder()
  order.model = 21
  order.a = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  order.b = (radius & 254) * 257
  return chooseTarget(p, order, e)
}

// Command 19/21's front half, through target dispatch (0x51a8db). The caller
// retains both results until after the selected attack phase: completion and
// restart are independent, and automatic rescanning can replace restart.
export function prepareCombatOrderVisit(
  w: CombatSearchWorld,
  p: SearchingCombatPerson,
  order: PersonOrder,
  e: CombatSearchEffects
) {
  if (order.model !== 11 && order.model !== 19 && order.model !== 21)
    throw new RangeError(`Unsupported attack command ${order.model}`)
  if (p.tribe === w.playerTribe && !w.alert) w.alert = 1
  const automatic = order.model === 21
  let complete = false,
    restart = false
  p.flags2 = (p.flags2 | 0x2000000) >>> 0
  if (p.flags2 & 0x40000000) {
    p.flags4 = (p.flags4 & ~0x10007) >>> 0
    p.assignment &= ~512
  }
  if (p.substate === 0) {
    let scan = !(p.counter & 3)
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      scan = true
      const point = e.approachPoint(order)
      p.flags4 = ((p.flags4 & ~0x80000) | (point.kind === 2 ? 0x80000 : 0)) >>> 0
      if (p.model !== 6 || !automatic) {
        e.destination(point)
        const inArea = e.withinArea(order)
        if (p.model === 6) {
          if (!inArea) p.speed = randomPersonSpeed(w, p)
          if (!p.vehicle)
            setPersonAnimationRow(p, (p.cargo ? 4 : 0) + (p.speed ? 1 : 0), e.animation)
        } else if (!inArea) recoverPersonMovement(w, p, e.animation)
      }
    }
    p.assignment |= 8
    if (scan) {
      if (p.model !== 6) recordMarch(w, p, order)
      if (e.withinArea(order)) {
        const selected = chooseTarget(p, order, e, p.model === 6 && automatic && !!p.vehicle)
        if (selected !== undefined) restart = selected
        else if (automatic) {
          const fallback = retargetCombatOrder(p, e.range(), e)
          restart = fallback ?? false
          complete = fallback === undefined || fallback
        } else complete = true
      }
    }
  } else if (p.substate === 7) retryCombatTarget(w, p, e)
  if (p.substate !== 0 && p.substate !== 7 && automatic && !(p.counter & 3))
    restart = retargetCombatOrder(p, 0, e) ?? false
  return { complete, restart }
}

const cellCenter = (cell: number) => ({
  x: ((cell & 254) + 1) * 256,
  y: (((cell >>> 8) & 254) + 1) * 256,
})

// Complete 0x51c110: explicit targets use their enclosing building's entrance;
// area orders use the original indexed rings when their center is blocked.
export function findCombatApproachPoint(
  p: CollisionPerson,
  order: PersonOrder,
  w: {
    collision: CollisionWorld
    search: Uint8Array
    landLimit: number
    heightRange: (cell: number) => number
    outside: (building: number) => Point
  }
): Point & { kind: number } {
  const { collision } = w
  if (!(rules.personCommands[order.model].flags & 0x800)) {
    const target = order.a ? collision.objects.get(order.a) : undefined
    if (!target || !target.class || target.flags2 & 1) return { x: p.x, y: p.y, kind: 1 }
    const cell = collision.cell(target)
    if (cell.flags & 512) return { ...w.outside(cell.building & 1023), kind: 2 }
    return { x: target.x, y: target.y, kind: 1 }
  }
  const point = cellCenter(order.a)
  const width = order.b & 255,
    height = order.b >>> 8
  const left = ((order.a & 255) - width) & 255
  const top = ((order.a >>> 8) - height) & 255
  let open = false
  // Each axis repeats after 128 coarse cells; one lap proves full occupancy.
  const rows = Math.min(height + 1, 128),
    columns = Math.min(width + 1, 128)
  for (let row = 0; row < rows && !open; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = ((left + col * 2) & 255) | (((top + row * 2) & 255) << 8)
      if (!(collision.cell(cellCenter(cell)).flags & 512)) {
        open = true
        break
      }
    }
  }
  if (!open) {
    const cell = collision.cell(cellCenter(left | (top << 8)))
    return { ...w.outside(cell.building & 1023), kind: 2 }
  }
  const blocked = (cell: number) =>
    pathCellBlocked(
      collision,
      p,
      cell,
      () => w.heightRange(cell & 0xfefe),
      w.landLimit,
      () => {
        const current = collision.cell(p)
        return current.flags & 512 ? current.building & 1023 : 0
      }
    )
  if (!blocked(order.a)) return { ...point, kind: 1 }
  const id = startIndexedSearch(w.search, 2, 0, 0, 16)
  if (!id) return { ...point, kind: 1 }
  let result = { ...point, kind: 0 }
  for (
    let offset = nextIndexedSearch(w.search, id);
    offset;
    offset = nextIndexedSearch(w.search, id)
  ) {
    const cell =
      (((order.a & 255) + offset.x * 2) & 255) | ((((order.a >>> 8) + offset.y * 2) & 255) << 8)
    if (!blocked(cell)) {
      result = { ...cellCenter(cell), kind: 1 }
      break
    }
  }
  endIndexedSearch(w.search, id)
  return result
}
