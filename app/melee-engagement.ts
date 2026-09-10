import type { OrderedPerson, PersonOrder } from './person-orders.ts'
import rules from './original-rules.json' with { type: 'json' }

type Order = Pick<PersonOrder, 'model' | 'flags'> | undefined
type Person = Pick<
  OrderedPerson,
  'model' | 'state' | 'substate' | 'flags2' | 'flags4' | 'assignment'
> & { vehicle: number; life: number; commandPhase: number }

// 0x4d44e0. Range and eligibility deliberately treat cancelled/automatic orders
// differently; normalizing their flags before these calls changes native behavior.
export function canAutoEngage(p: Person, order: Order, ritualAvailable: () => boolean) {
  if (p.vehicle && p.model !== 6) return false
  const ordered = p.state === 10 || p.state === 33
  const active = ordered && order && !(order.flags & 1) ? order : undefined
  const command = active?.model ?? 0
  if (p.flags4 & 0x1000 && !(ordered && command === 28)) return false
  if (p.assignment & 4 || rules.personStateFlags[p.state] & 0x40) return false
  if (
    ordered &&
    (command === 19 || command === 21) &&
    (p.substate === 1 || (p.substate === 3 && (p.commandPhase === 46 || p.commandPhase === 53)))
  )
    return false
  if (
    ordered &&
    command === 27 &&
    p.substate !== 0 &&
    (!ritualAvailable() || ((p.life >>> 8) & 255) <= 1)
  )
    return false
  if (ordered && (command === 21 || command === 11)) return false
  if (p.flags4 & 0x400 || p.flags2 & 0x80000) return false
  return (
    command === 30 || !(active && active.flags & 64 && rules.personModels[p.model].flags & 0x800)
  )
}

// 0x51ff60. Firewarriors use the dispatched command and an altitude/tower bonus;
// other classes use the raw current order, unless it is an automatic response.
export function engagementRange(
  p: { model: number; state: number; commandStatus: number; h: number },
  order: Order,
  inTower: boolean
) {
  let mode = 1
  if (p.state === 10) {
    if (p.model === 6) mode = rules.personCommands[p.commandStatus].rangeMode
    else if (order && !(order.flags & 32)) mode = rules.personCommands[order.model].rangeMode
  }
  const model = rules.personModels[p.model]
  let range = 0
  if (mode === 1) range = model.idleRange
  if (mode === 2) range = model.orderedRange
  if (mode === 3) range = model.orderedRange + 2
  if (p.model !== 6) return range
  const band = Math.max(0, Math.min(7, Math.trunc(p.h / 128)))
  return (Math.trunc((rules.engagementHeightFactors[band] * range) / 256) + (inTower ? 4 : 0)) | 1
}

// 0x51e5e0/0x51eab0 scan a wrapped square of whole 512-unit terrain cells.
// A range of one checks the current cell, including its far corner.
const cellDelta = (a: number, b: number) =>
  ((((a >>> 8) & 254) - ((b >>> 8) & 254) + 128) & 255) - 128

export function inEngagementArea(
  source: { x: number; y: number },
  target: { x: number; y: number },
  range: number
) {
  if (!range) return false
  const radius = Math.trunc(range / 2) * 2
  return (
    Math.abs(cellDelta(source.x, target.x)) <= radius &&
    Math.abs(cellDelta(source.y, target.y)) <= radius
  )
}
