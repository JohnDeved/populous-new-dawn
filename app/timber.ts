import rules from './original-rules.json' with { type: 'json' }

// 0x4340a0's harvesting phase. Routing and follow-up orders belong to its caller.
export function startTimberHarvest(personModel: number, sceneryModel: number) {
  return { remaining: sceneryModel === 11 ? 3 : rules.personHarvestTurns[personModel] }
}

export function stepTimberHarvest(work: { remaining: number }) {
  work.remaining = ((work.remaining - 1) << 16) >> 16
  return work.remaining <= 0
}

// 0x496750 phase 5 transfers carried timber after exactly eight object turns.
// Unlike harvesting, this shared native wait finishes only when the short reaches zero.
export function stepTimberDelivery(work: { remaining: number }) {
  work.remaining = ((work.remaining - 1) << 16) >> 16
  return work.remaining === 0
}

// 0x4a7860: transfer cannot exceed the source, request or recipient capacity.
export function timberTransfer(
  available: number,
  carried: number,
  capacity: number,
  requested: number
) {
  return Math.max(0, Math.min(available, requested, capacity - carried))
}

// 0x4a79f0, shared by harvesting and burning. Only surviving scenery is resized.
export function timberScale(wood: number, capacity: number, modelScale: number) {
  const base = Math.trunc(modelScale / 6)
  return Math.trunc(((modelScale - base) * wood) / capacity) + base
}
