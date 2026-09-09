// 0x4b9cc0: preserve existing registration, otherwise occupy the first free slot.
// The caller sizes the slots from the original building descriptor.
export function assignBuilder(slots: number[], id: number) {
  if (slots.includes(id)) return true
  const empty = slots.indexOf(0)
  if (empty === -1) return false
  slots[empty] = id
  return true
}

// 0x4ba1b0 retains slot order and holes while removing stale assignments.
export function pruneBuilders(slots: number[], eligible: (id: number) => boolean) {
  slots.forEach((id, i) => {
    if (id && !eligible(id)) slots[i] = 0
  })
}
