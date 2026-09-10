import { engagementRange } from './melee-engagement.ts'
import { detectCombatThreat, type CombatPerson, type CombatTargetWorld } from './combat-targets.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  currentPersonOrder,
  prepareCombatOrder,
  type OrderedPerson,
  type OrderEffects,
  type OrderPool,
} from './person-orders.ts'
import rules from './original-rules.json' with { type: 'json' }

export type CombatOrderPerson = CombatPerson & OrderedPerson & { h: number }

// 0x520480: the caller supplies the current cell's native head/next traversal.
// This intentionally does not re-run each recipient's automatic-engagement gate.
export function shareCombatOrder(
  orders: OrderPool,
  source: CombatOrderPerson,
  id: number,
  people: Iterable<CombatOrderPerson>,
  effects: OrderEffects
) {
  const { model, tribe, state, commandStatus } = source
  for (const p of people) {
    if (
      p.id === source.id ||
      p.class !== 1 ||
      p.model !== model ||
      p.tribe !== tribe ||
      p.state !== state ||
      p.commandStatus !== commandStatus ||
      p.immediateCommand ||
      (source.flags4 & 0x800 && !(p.flags4 & 0x800))
    )
      continue
    p.flags2 = (p.flags2 | 16) >>> 0
    attachPersonOrder(orders, p, id, -1, effects)
  }
}

// Complete 0x51e5e0. Detection succeeds even if the shared order pool is full;
// allocation failure must neither interrupt followers nor alter existing orders.
export function startCombatResponse(
  world: CombatTargetWorld,
  orders: OrderPool,
  p: CombatOrderPerson,
  peers: () => Iterable<CombatOrderPerson>,
  effects: OrderEffects
) {
  const range = engagementRange(p, currentPersonOrder(orders, p), false)
  if (!range) return 0
  const radius = Math.trunc(range / 2) * 2
  const area = { a: ((p.x >>> 8) & 254) | (p.y & 0xfe00), b: radius | (radius << 8) }
  const buildings = !!(rules.personStateFlags[p.state] & 8) && !p.vehicle
  const threat = detectCombatThreat(world, p, area, buildings, buildings)
  if (!threat) return 0
  const id = allocatePersonOrder(orders)
  if (!id) return threat
  prepareCombatOrder(
    orders.records[id],
    area,
    32 | (buildings ? 16 : 0) | (threat === 3 ? 2 : 0),
    world.land.categories
  )
  p.flags2 = (p.flags2 | 16) >>> 0
  attachPersonOrder(orders, p, id, -1, effects)
  shareCombatOrder(orders, p, id, peers(), effects)
  return threat
}
