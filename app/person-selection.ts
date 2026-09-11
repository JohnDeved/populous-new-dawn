import type { OrderedPerson, PersonOrder } from './person-orders.ts'
import rules from './original-rules.json' with { type: 'json' }

type SelectablePerson = Pick<OrderedPerson, 'id' | 'flags3' | 'flags4' | 'selectionFlags'>

// 0x4de610 is shared by pointer picking and area selection.
export function personInCompletedTower(
  person: Pick<OrderedPerson, 'flags2'>,
  building: { model: number; state: number } | undefined
) {
  return !!(person.flags2 & 0x800000 && building?.model === 4 && building.state === 2)
}

// 0x4449d0 calls 0x4e3430, 0x4de610 and 0x4de680 before its polygon test.
// The caller supplies the building recorded in this person's terrain cell.
export function canDragPerson(
  person: Pick<OrderedPerson, 'flags2' | 'flags4' | 'state' | 'substate'>,
  order: PersonOrder | undefined,
  building: { model: number; state: number } | undefined
) {
  if (person.flags4 & 128) return false
  if (personInCompletedTower(person, building)) return false
  return !(
    person.state === 10 &&
    person.substate === 13 &&
    order?.model === 8 &&
    !(order.flags & 1) &&
    building &&
    rules.buildingFlags[building.model] & 1
  )
}

// 0x4458d0's person flags. Passenger traversal and camera focus belong to callers.
export function markPersonSelected(p: SelectablePerson, selected: boolean, keepWork = false) {
  if (selected) {
    p.selectionFlags |= 128
    p.flags3 = (keepWork ? p.flags3 | 0x10000000 : p.flags3 & ~0x10000000) >>> 0
  } else {
    p.selectionFlags &= ~128
    p.flags3 = (p.flags3 & ~128) >>> 0
  }
}

// Ordinary on-foot command 0x7b. Ctrl toggles; an unmodified click replaces only
// when the clicked person is not already selected. Ineligible clicks keep the group.
export function clickPersonSelection(people: SelectablePerson[], id: number, extend: boolean) {
  const p = people.find(person => person.id === id)
  if (!p) return false
  if (p.selectionFlags & 128) {
    if (extend) markPersonSelected(p, false)
    return false
  }
  if (p.flags4 & 128) return false
  if (!extend) for (const other of people) markPersonSelected(other, false)
  markPersonSelected(p, true)
  return true
}

// 0x489c40: the same native rows drive selection and audio preloading.
const selectionVoices: Record<number, number[]> = {
  2: [0x58, 0x43, 0x44, 0x45],
  4: [0x57, 0x49, 0x4a, 0x4b],
  5: [0x56, 0x46, 0x47, 0x48],
  7: [0x18],
}
export const SELECTION_CUES = Object.values(selectionVoices).flat()
const voiceClass = (model: number) => (model === 4 || model === 5 || model === 7 ? model : 2)

export function selectedPersonVoice(model: number) {
  return selectionVoices[voiceClass(model)][0]
}

// Specialists speak first, then the shaman and ordinary followers.
export function selectedGroupVoices(models: number[]) {
  const voices: number[] = []
  for (const model of [5, 4, 7, 2]) {
    const count = models.filter(value => voiceClass(value) === model).length
    const cues = selectionVoices[model]
    if (count) voices.push(cues[Math.min(count - 1, cues.length - 1)])
  }
  return voices
}
