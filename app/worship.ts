import { movePosition } from './native-math.ts'
import { currentPersonOrder, type OrderPool, type OrderedPerson } from './person-orders.ts'

// Reviewed portions of 0x485b00 (level settings) and 0x4fb270 (worship triggers).
// Follower eligibility, world scheduling and reward objects are supplied by the engine.
export interface WorshipState {
  work: number
  target: number
  required: number
  remaining: number
  growth: number
  grown: boolean
  enabled: boolean
  reset: boolean
  cooldown: number
  active: boolean
}

export function createWorship(settings: number[]): WorshipState {
  if (settings.length !== 32) throw new Error('Invalid worship settings')
  const short = (i: number) => ((settings[i] | (settings[i + 1] << 8)) << 16) >> 16
  return {
    work: 0,
    target: short(26),
    required: short(4),
    remaining: (settings[3] << 24) >> 24,
    growth: short(30) || 768,
    grown: false,
    enabled: settings[28] === 0,
    reset: true,
    cooldown: 0,
    active: true,
  }
}

export function finishWorship(s: WorshipState) {
  s.work = 0
  if (s.remaining > 0 && --s.remaining === 0) {
    s.active = false
    return
  }
  if (!s.grown) {
    s.grown = true
    s.target = (s.target + Math.trunc(s.growth / 4)) | 0
  }
  s.enabled = false
  s.cooldown = s.remaining < 0 ? 0 : 1
  if (s.remaining < 0) s.active = false
}

// Shared reset/refill prefix of 0x4fb270, before its trigger-type switch.
export function beginWorshipTurn(s: WorshipState): boolean {
  if (!s.active) return false
  if (s.reset) {
    s.work = 0
    s.reset = false
  }
  if (!s.enabled) {
    if (s.cooldown !== 0 && --s.cooldown === 0) {
      s.enabled = true
      s.reset = true
    }
    return false
  }
  return true
}

// Type-0 spell heads sample on every fourth object turn. Work is integer, not elapsed seconds.
export function stepWorship(
  s: WorshipState,
  phase: number,
  followers: number,
  forced = false
): boolean {
  if (s.reset) forced = false
  if (!beginWorshipTurn(s)) return false
  let ready = false
  if (!(phase & 3)) {
    const square = Math.imul(s.required, s.required)
    if (followers === 0) {
      s.work = Math.max(0, (s.work - square) | 0)
    } else {
      const missing = s.required - Math.min(s.required, followers) + 1
      s.work = (s.work + Math.trunc(square / Math.imul(missing, missing))) | 0
      ready = s.work >= Math.imul(s.target, square)
    }
  }
  if (!ready && !forced) return false
  finishWorship(s)
  return true
}

export function worshipProgress(s: WorshipState) {
  return s.target > 0 && s.required > 0 ? s.work / (s.target * s.required * s.required) : 0
}

// 0x429ad0: fifty worship positions in alternating left/right arcs.
const worshipOffsets: { x: number; y: number }[] = []
for (let count = 3, radius = 448; worshipOffsets.length < 50; count += 2, radius += 256) {
  const step = Math.trunc(284 / (count - 1))
  for (let i = 0; i < count && worshipOffsets.length < 50; i++) {
    const p = { x: 0, y: 0 }
    movePosition(p, Math.ceil(i / 2) * step * (i & 1 ? -1 : 1), -radius)
    worshipOffsets.push({ x: (p.x << 16) >> 16, y: (p.y << 16) >> 16 })
  }
}

// 0x43c600: rotate around the coarse-cell center and wrap native coordinates.
export function worshipPositions(head: { x: number; y: number; angle: number }) {
  const quarter = Math.trunc(head.angle / 512)
  return worshipOffsets.map(({ x, y }) => {
    if (quarter === 1) [x, y] = [y, -x]
    else if (quarter === 2) [x, y] = [-x, -y]
    else if (quarter === 3) [x, y] = [-y, x]
    return { x: ((head.x & 0xfe00) + 256 + x) & 65535, y: ((head.y & 0xfe00) + 256 + y) & 65535 }
  })
}

// 0x4a8e70: initial approach is one cell in front of the head.
export function worshipApproach(head: { x: number; y: number; angle: number }) {
  const point = { x: (head.x & 0xfe00) + 256, y: (head.y & 0xfe00) + 256 }
  movePosition(point, ((Math.trunc(head.angle / 512) + 2) & 3) * 512, 512)
  return point
}

// 0x43c340. The second pass accepts occupied slots; it still requires a route.
export function findWorshipPlace(
  head: { x: number; y: number; angle: number; nextSlot: number },
  person: { flags4: number },
  occupied: (point: { x: number; y: number }) => boolean,
  reachable: (point: { x: number; y: number }) => boolean
) {
  if (!reachable(worshipApproach(head))) return null
  const positions = worshipPositions(head)
  for (let pass = 1; pass <= 2; pass++)
    for (let slot = head.nextSlot; slot < positions.length; slot++) {
      const point = positions[slot]
      if (pass === 1 && occupied(point)) continue
      if (reachable(point)) return { point, slot, mode: pass }
      person.flags4 = (person.flags4 & ~0x10000000) >>> 0
    }
  return null
}

// Ordinary model-9 head visit, 0x4a8b00. Terrain initialization and morphs
// have separate owners; the standing cursor expires even without worshippers.
export function stepWorshipHead(head: { nextSlot: number; slotTimer: number }) {
  if (head.slotTimer && --head.slotTimer === 0) head.nextSlot = 0
}

// Timed spell-head branch of 0x4fb270. Reward admission is an oriented cell
// square and an active worship order; exact standing slots belong to the panel.
export function countWorshippers(
  head: { x: number; y: number; angle: number; range: number },
  orders: OrderPool,
  cellPeople: (cell: number) => Iterable<
    OrderedPerson & {
      class: number
      tribe: number
      state: number
      substate: number
      speed: number
    }
  >
) {
  const counts = [0, 0, 0, 0],
    radius = head.range * 2
  let x = ((head.x >> 8) & 254) - radius,
    y = ((head.y >> 8) & 254) - radius
  switch (((head.angle + 1024) & 1536) >> 9) {
    case 0:
      y += radius
      break
    case 1:
      x += radius
      break
    case 2:
      y -= radius
      break
    case 3:
      x -= radius
      break
  }
  for (let row = 0; row <= head.range * 2; row++)
    for (let column = 0; column <= head.range * 2; column++)
      for (const p of cellPeople(((x + column * 2) & 255) | (((y + row * 2) & 255) << 8))) {
        if (
          p.class !== 1 ||
          p.tribe < 0 ||
          p.tribe > 3 ||
          p.flags4 & 0x800 ||
          ![10, 33].includes(p.state) ||
          p.speed ||
          !p.substate
        )
          continue
        const order = currentPersonOrder(orders, p)
        if (order?.model === 27 && !(order.flags & 1)) counts[p.tribe]++
      }
  return counts
}
