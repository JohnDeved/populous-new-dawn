import rules from './original-rules.json' with { type: 'json' }
import constants from './original-constants.json' with { type: 'json' }
import { positionDistance, positionDistanceSquared } from './native-math.ts'
import { markPersonSelected, selectedGroupVoices, selectedPersonVoice } from './person-selection.ts'
import type { OrderedPerson } from './person-orders.ts'

export type HudPerson = Pick<
  OrderedPerson,
  'id' | 'model' | 'x' | 'y' | 'assignment' | 'flags3' | 'flags4' | 'selectionFlags'
>
export type HudSelectionMode = 'single' | 'all' | 'five'
interface Point {
  x: number
  y: number
}
const centerCell = (p: Point) => ({ x: (p.x & 0xfe00) + 256, y: (p.y & 0xfe00) + 256 })
const available = (p: HudPerson, includeReserved: boolean) =>
  !(p.flags4 & (includeReserved ? 128 : 0x880))

// 0x451720: preferred assignment bands nearby, then nearest unselected globally.
// Distances are truncated before comparison, so equal distances retain list order.
function nextFollower(people: HudPerson[], model: number, center: Point, nearby: boolean) {
  let nearest: HudPerson | undefined,
    distance = 6144
  for (const priority of rules.hudSelectionPriority) {
    for (const p of people) {
      if (
        !available(p, false) ||
        p.model === 7 ||
        (model && p.model !== model) ||
        p.selectionFlags & 128 ||
        ((p.assignment >> 12) & 7) !== priority
      )
        continue
      const d = positionDistance(center, p)
      if (d < distance) {
        nearest = p
        distance = d
      }
    }
    if (nearest) return nearest
  }
  if (nearby) return
  distance = 0x0fffffff
  for (const p of people) {
    if (!available(p, false) || (model && p.model !== model) || p.selectionFlags & 128) continue
    const d = positionDistance(center, p)
    if (d < distance) {
      nearest = p
      distance = d
    }
  }
  return nearest
}

// HUD commands 0x7d / 0x53 / 0x48 / 0x72. All add to the existing group.
// Vehicle/passenger propagation belongs to the future live transport owner.
export function selectHudPeople(
  people: HudPerson[],
  model: number,
  point: Point,
  mode: HudSelectionMode,
  nearby = false
) {
  const center = centerCell(point)
  let speaker: HudPerson | undefined
  if (mode === 'all') {
    for (const p of people) {
      if ((model ? p.model !== model : p.model === 7) || !available(p, true)) continue
      if (nearby && p.model !== 7 && positionDistanceSquared(center, p) >= 0x2400000) continue
      markPersonSelected(p, true)
      speaker = p
    }
    return {
      speaker: speaker?.id,
      cues: speaker
        ? selectedGroupVoices(people.filter(p => p.selectionFlags & 128).map(p => p.model))
        : [],
    }
  }
  if (model === 7 && mode === 'single') {
    speaker = people.find(p => p.model === 7 && available(p, false))
    if (speaker) markPersonSelected(speaker, true)
  } else {
    for (let i = 0; i < (mode === 'five' ? constants.MULTIPLE_SELECT_NUM : 1); i++) {
      const p = nextFollower(people, model, center, nearby)
      if (!p) break
      markPersonSelected(p, true)
      speaker = p
    }
  }
  // The original five-person command does not submit a selection voice.
  return {
    speaker: speaker?.id,
    cues: speaker && mode === 'single' ? [selectedPersonVoice(speaker.model)] : [],
  }
}

// 0x4de810, ordinary category-0 HUD right-click. Initial focus is nearest;
// subsequent clicks cycle through the retained tribe list and wrap.
export function focusHudPerson(
  people: HudPerson[],
  model: number,
  point: Point,
  previous: number,
  includeReserved = false,
  nearby = false
) {
  const center = centerCell(point)
  const matches = (p: HudPerson) =>
    (!model || p.model === model) &&
    (includeReserved || !(p.flags4 & 0x800)) &&
    (!nearby || p.model === 7 || positionDistanceSquared(center, p) < 0x2400000)
  const index = people.findIndex(p => p.id === previous && matches(p))
  if (index !== -1) {
    for (let offset = 1; offset < people.length; offset++) {
      const p = people[(index + offset) % people.length]
      if (matches(p)) return p.id
    }
    return previous
  }
  let nearest = 0,
    distance = nearby ? 6144 : 0x0fffffff
  for (const p of people) {
    if ((model && p.model !== model) || !available(p, includeReserved)) continue
    const d = positionDistance(center, p)
    if (d < distance) {
      nearest = p.id
      distance = d
    }
  }
  return nearest
}
