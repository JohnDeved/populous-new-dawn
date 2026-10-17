import assert from 'node:assert/strict'

// Specific to the staged Mission 22 replay: preserve both indexed ID assertions
// on every comparison. Its undefined-reward defaults do not use rewardMana.
// This transient view is not a checkpoint. Never retain or mutate it. Validate
// each replay world once; normalized shrines must not be aliased elsewhere.
export function stagedCheckpointComparisonView(world) {
  for (const [index, id] of [[0, 102], [2, 120]])
    assert.equal(world.shrines[index].id, id)
  return {
    ...world,
    shrines: world.shrines.map((head, index) =>
      (index === 0 || index === 2) && head.reward === undefined
        ? { ...head, reward: 'mana' }
        : head
    ),
  }
}

// Retain the previous complete clone-normalizer as a one-time fail-fast check
// for each branch's live/restored world. It detects incompatible initial aliases
// and data shapes. Never call this inside a replay loop.
export function assertStagedCheckpointComparisonDomain(world) {
  const copy = structuredClone(world)
  for (const [index, id] of [[0, 102], [2, 120]]) {
    assert.equal(copy.shrines[index].id, id)
    if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
  }
  assert.deepEqual(stagedCheckpointComparisonView(world), copy)
}
