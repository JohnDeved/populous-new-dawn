import assert from 'node:assert/strict'
export function admitRemaining(deadline, now, completed, childMs = 90000, graceMs = 5000) {
  const remaining = deadline - now,
    required = (8 - completed) * (childMs + graceMs) + 40000
  assert.ok(
    remaining >= required,
    `Insufficient admitted budget: remaining ${remaining}, required ${required}`
  )
  return { remaining, required, completed, finalizationReserveMs: 40000 }
}
