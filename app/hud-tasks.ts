import rules from './original-rules.json' with { type: 'json' }
import constants from './original-constants.json' with { type: 'json' }
import type { OrderedPerson, PersonOrder } from './person-orders.ts'
import type { HudPerson, HudSelectionMode } from './hud-selection.ts'
import { markPersonSelected, selectedGroupVoices, selectedPersonVoice } from './person-selection.ts'
import { positionDistance, positionDistanceSquared } from './native-math.ts'

export type FollowerTask = 1 | 2 | 3 | 4
export type TaskPerson = HudPerson & { category: number; vehicle?: number }
type TaskSource = Pick<
  OrderedPerson,
  'state' | 'model' | 'commandStatus' | 'flags2' | 'assignment'
> & {
  vehicle: number
}
interface Point {
  x: number
  y: number
}
const centerCell = (p: Point) => ({ x: (p.x & 0xfe00) + 256, y: (p.y & 0xfe00) + 256 })
const available = (p: TaskPerson, includeReserved: boolean) =>
  !(p.flags4 & (includeReserved ? 128 : 0x880))
const matchesTask = (p: TaskPerson, category: FollowerTask) =>
  category === 1 ? !!(p.selectionFlags & 128) : p.category === category

// 0x4513e0. Read the active controller's state; missing/dormant owners must not
// silently become Idle or Busy. Occupying a training building is not Housed.
export function classifyFollowerTask(
  p: TaskSource | undefined,
  buildingModel?: number,
  order?: Pick<PersonOrder, 'model' | 'flags'>
) {
  if (!p) return 0
  const stateCategory = rules.personTaskCategories[p.state] ?? 0
  if (p.vehicle) return stateCategory === 1 ? 1 : 5
  let category =
    p.state === 10 ? (rules.commandTaskCategories[p.commandStatus] ?? 0) : stateCategory
  if (p.state === 21 && p.flags2 & 0x800000 && buildingModel !== undefined)
    category = rules.buildingTaskCategories[buildingModel] ?? stateCategory
  if (
    p.model === 4 &&
    [10, 33].includes(p.state) &&
    order &&
    !(order.flags & 1) &&
    [17, 31, 32].includes(order.model) &&
    !(p.assignment & 64) &&
    !(p.flags2 & 0x800000)
  )
    return 2
  return category
}

// 0x4ecac0. Task counts overlap: classification and the selected bit each add
// independently. Class enable uses the global total even in nearby display mode.
export function followerTaskCounts(people: readonly TaskPerson[], point: Point, nearby = false) {
  const totals = Array<number>(9).fill(0),
    tasks = Array.from({ length: 9 }, () => Array<number>(6).fill(0))
  for (const p of people) {
    if (!(p.flags4 & 0x20000000) || p.flags4 & 0x800 || p.model < 2 || p.model > 7) continue
    totals[p.model]++
    if (nearby && positionDistanceSquared(point, p) >= 0x2400000) continue
    if (p.category >= 0 && p.category < 6) tasks[p.model][p.category]++
    if (p.selectionFlags & 128) tasks[p.model][1]++
  }
  for (let model = 2; model <= 6; model++) {
    totals[0] += totals[model]
    for (let category = 0; category < 6; category++) tasks[0][category] += tasks[model][category]
  }
  return { totals, tasks }
}

// Nonzero task categories bypass the persistent strip's assignment priorities.
function nearestTaskFollower(
  people: readonly TaskPerson[],
  model: number,
  category: FollowerTask,
  center: Point,
  nearby: boolean,
  includeReserved = false,
  includeSelected = false
) {
  let nearest: TaskPerson | undefined,
    distance = nearby ? 6144 : 0x0fffffff
  for (const p of people) {
    if (
      (model && p.model !== model) ||
      !available(p, includeReserved) ||
      !matchesTask(p, category) ||
      (category !== 1 && !includeSelected && p.selectionFlags & 128)
    )
      continue
    const d = positionDistance(center, p)
    if (d < distance) {
      nearest = p
      distance = d
    }
  }
  return nearest
}

// Native task commands 0x7d/0x72/0x54/0x55. The caller propagates selection to
// fellow vehicle passengers using the existing live vehicle owner.
export function selectTaskFollowers(
  people: TaskPerson[],
  model: number,
  category: FollowerTask,
  point: Point,
  mode: HudSelectionMode,
  nearby = false,
  mark: (person: TaskPerson, selected: boolean) => void = markPersonSelected
) {
  const center = centerCell(point)
  let speaker: TaskPerson | undefined
  if (mode === 'all') {
    for (const p of people) {
      if (
        (model ? p.model !== model : p.model === 7) ||
        !matchesTask(p, category) ||
        (nearby && p.model !== 7 && positionDistanceSquared(center, p) >= 0x2400000) ||
        (category !== 1 && !available(p, true))
      )
        continue
      mark(p, category !== 1)
      if (category !== 1) speaker = p
    }
  } else {
    for (let i = 0; i < (mode === 'five' ? constants.MULTIPLE_SELECT_NUM : 1); i++) {
      const p = nearestTaskFollower(people, model, category, center, nearby)
      if (!p) break
      const selected = mode === 'five' || category !== 1
      mark(p, selected)
      if (selected) speaker = p
    }
  }
  let cues: number[] = []
  if (speaker && mode === 'single') cues = [selectedPersonVoice(speaker.model)]
  else if (speaker && mode === 'all')
    cues = selectedGroupVoices(people.filter(p => p.selectionFlags & 128).map(p => p.model))
  return { speaker: speaker?.id, cues }
}

// 0x4de810 remembers each model/category independently. Initial search applies
// the nearby radius to everyone; subsequent native list cycling exempts Shaman.
export function focusTaskFollower(
  people: readonly TaskPerson[],
  model: number,
  category: FollowerTask,
  point: Point,
  previous: number,
  includeReserved = false,
  nearby = false
) {
  const center = centerCell(point),
    matches = (p: TaskPerson) =>
      (!model || p.model === model) &&
      matchesTask(p, category) &&
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
  return (
    nearestTaskFollower(people, model, category, center, nearby, includeReserved, true)?.id ?? 0
  )
}
