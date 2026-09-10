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

// 0x489c40: specialists speak first, followed by the ordinary follower group.
export function selectedGroupVoices(models: number[]) {
  const voices: number[] = []
  for (const [model, cues] of [
    [5, [0x56, 0x46, 0x47, 0x48]],
    [4, [0x57, 0x49, 0x4a, 0x4b]],
  ] as const) {
    const count = models.filter(value => value === model).length
    if (count) voices.push(cues[Math.min(count - 1, 3)])
  }
  if (models.includes(7)) voices.push(0x18)
  const ordinary = models.filter(model => model !== 4 && model !== 5 && model !== 7).length
  if (ordinary) voices.push([0x58, 0x43, 0x44, 0x45][Math.min(ordinary - 1, 3)])
  return voices
}
