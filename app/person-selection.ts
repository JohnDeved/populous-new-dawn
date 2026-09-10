import type { OrderedPerson } from './person-orders.ts'

type SelectablePerson = Pick<OrderedPerson, 'id' | 'flags3' | 'flags4' | 'selectionFlags'>

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

// 0x489c40's single-person voice, shared by all ordinary follower classes.
export function selectedPersonVoice(model: number) {
  if (model === 4) return 0x57
  if (model === 5) return 0x56
  if (model === 7) return 0x18
  return 0x58
}
