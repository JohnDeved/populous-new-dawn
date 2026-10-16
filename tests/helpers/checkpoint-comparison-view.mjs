import assert from 'node:assert/strict'

// A transient comparison view, never a checkpoint or a mutable test fixture.
// Preserve the existing mana-shrine schema default without cloning every live
// world field at every replay tick. Full deep equality still visits every field.
// Domain: plain enumerable world data; normalized shrines are not aliased
// elsewhere in the world. Validate each replay world once before using views.
// Call immediately before comparing; do not retain or mutate the returned view.
export function checkpointComparisonView(world) {
  return {
    ...world,
    shrines: world.shrines.map(head =>
      head.reward === undefined && head.rewardMana
        ? { ...head, reward: 'mana' }
        : head
    ),
  }
}

// Keep the previous normalization as a one-time domain check on each actual
// replay world. This rejects incompatible aliases/prototypes instead of silently
// changing comparison semantics. This is never called inside the replay loop.
export function assertCheckpointComparisonDomain(world) {
  const copy = structuredClone(world)
  for (const head of copy.shrines)
    if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
  assert.deepEqual(checkpointComparisonView(world), copy)
}
