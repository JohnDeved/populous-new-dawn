import rules from './original-rules.json' with { type: 'json' }
import constants from './original-constants.json' with { type: 'json' }
import type { HudPerson, HudSelectionMode } from './hud-selection.ts'
import { positionDistance, positionDistanceSquared } from './native-math.ts'
import { markPersonSelected, selectedPersonVoice } from './person-selection.ts'

export type TransportKind = 1 | 3
export type TransportPerson = HudPerson & { commandStatus: number }
export interface HudTransport {
  id: number
  model: number
  x: number
  y: number
  owner: number
  countOwner: number
  passengerCount: number
  passengers: number[]
  active: boolean
}
interface Point {
  x: number
  y: number
}
const centerCell = (p: Point) => ({ x: (p.x & 0xfe00) + 256, y: (p.y & 0xfe00) + 256 })
const kindOf = (v: HudTransport): TransportKind => (v.model <= 2 ? 1 : 3)
const occupants = (v: HudTransport, people: Map<number, TransportPerson>) =>
  v.passengers.slice(0, rules.vehicleCapacity[v.model]).flatMap(id => {
    const p = people.get(id)
    return p ? [p] : []
  })
const inRange = (v: HudTransport, center: Point, nearby: boolean) =>
  !nearby || positionDistanceSquared(center, v) < 0x2400000

// 0x4ecac0 counts occupied vehicles once per present passenger class. Presence
// also includes empty vehicles and follows the real owner, not the apparent owner.
export function transportCounts(
  vehicles: readonly HudTransport[],
  people: readonly TransportPerson[],
  point: Point,
  nearby = false
) {
  const result = {
      1: { present: false, counts: Array<number>(9).fill(0) },
      3: { present: false, counts: Array<number>(9).fill(0) },
    },
    byId = new Map(people.map(p => [p.id, p]))
  for (const v of vehicles) {
    if (!v.active || v.countOwner !== 0) continue
    const row = result[kindOf(v)]
    row.present = true
    if (!v.passengerCount || !inRange(v, point, nearby)) continue
    row.counts[0]++
    for (const model of new Set(occupants(v, byId).map(p => p.model)))
      if (model > 0 && model < 9) row.counts[model]++
  }
  return result
}

// The native rebuild prepends to the per-kind list. Preserve that order for
// equal-distance ties and cycling, while keeping world creation order unchanged.
function vehicleList(vehicles: readonly HudTransport[], kind: TransportKind) {
  return vehicles
    .toReversed()
    .filter(v => v.active && kindOf(v) === kind && v.owner === 0 && v.passengerCount)
}
function nearestTransport(
  vehicles: readonly HudTransport[],
  people: Map<number, TransportPerson>,
  model: number,
  center: Point,
  nearby: boolean,
  focus = false
) {
  for (const idle of [true, false]) {
    let nearest: HudTransport | undefined,
      distance = 0x0fffffff
    for (const v of vehicles) {
      if (!inRange(v, center, nearby) || (idle && people.get(v.passengers[0])?.commandStatus))
        continue
      const p = occupants(v, people).find(
        p =>
          (!model || p.model === model) &&
          (focus || (!(p.flags4 & 128) && !(p.selectionFlags & 128)))
      )
      if (!p) continue
      const d = positionDistance(center, p)
      if (d < distance) {
        nearest = v
        distance = d
      }
    }
    if (nearest) return nearest
  }
}

// 0x7f/0x80/0x81 acquire vehicles, then 0x4e31f0 selects every eligible passenger.
// A class filter never reduces the selected group to that class alone.
export function selectTransportPassengers(
  vehicles: readonly HudTransport[],
  people: TransportPerson[],
  kind: TransportKind,
  model: number,
  point: Point,
  mode: HudSelectionMode,
  nearby = false
) {
  const list = vehicleList(vehicles, kind),
    byId = new Map(people.map(p => [p.id, p])),
    center = centerCell(point)
  let speaker: TransportPerson | undefined
  const select = (v: HudTransport) => {
    let first: TransportPerson | undefined
    for (const p of occupants(v, byId)) {
      if (p.flags4 & 128) continue
      markPersonSelected(p, true)
      first ??= p
    }
    return first
  }
  if (mode === 'all') {
    for (const v of list)
      if (inRange(v, center, nearby) && (!model || occupants(v, byId).some(p => p.model === model)))
        speaker = select(v) ?? speaker
  } else {
    for (let i = 0; i < (mode === 'five' ? constants.MULTIPLE_SELECT_NUM : 1); i++) {
      const v = nearestTransport(list, byId, model, center, nearby)
      if (!v) break
      const first = select(v)
      speaker ??= first
    }
  }
  return { speaker: speaker?.id, cues: speaker ? [selectedPersonVoice(speaker.model)] : [] }
}

// 0x4deb40 accepts variants in search/cycling but invalidates remembered model2/4.
// Focus ignores passenger selection/block flags and never mutates their state.
export function focusTransport(
  vehicles: readonly HudTransport[],
  people: readonly TransportPerson[],
  kind: TransportKind,
  model: number,
  point: Point,
  previous: number,
  nearby = false
) {
  const list = vehicleList(vehicles, kind),
    byId = new Map(people.map(p => [p.id, p])),
    center = centerCell(point),
    matches = (v: HudTransport) =>
      inRange(v, center, nearby) && (!model || occupants(v, byId).some(p => p.model === model)),
    index = list.findIndex(v => v.id === previous && v.model === kind && matches(v))
  if (index !== -1) {
    for (let offset = 1; offset < list.length; offset++) {
      const v = list[(index + offset) % list.length]
      if (matches(v)) return v.id
    }
    return previous
  }
  return nearestTransport(list, byId, model, center, nearby, true)?.id ?? 0
}
