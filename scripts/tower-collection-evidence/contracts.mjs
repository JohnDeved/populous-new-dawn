import assert from 'node:assert/strict'

// Compact read-only semantic observation, not a substitute for a full checkpoint.
// Kept serializable so the identical function observes live and committed worlds.
export function towerWorldObservation(world) {
  const shrine = world.shrines.find(value => value.kind === 'vault' && value.reward === 'tower')
  if (world.outcome.level !== 4 || !shrine || shrine.x !== 69 || shrine.z !== -29)
    throw Error('Expected authored Mission 4 Tower Vault')
  return structuredClone({
    level: world.outcome.level, turn: world.turn, time: world.time,
    unlockedTower: world.unlockedTower,
    shrine,
    gifts: world.gifts.filter(gift => gift.reward === 'tower'),
    giftCounts: world.giftCounts,
  })
}

export function assertTowerGift(state) {
  assert.equal(state.level, 4)
  assert.equal(state.shrine.active, false)
  assert.equal(state.unlockedTower, false, 'Reward must still be pending at checkpoint')
  assert.equal(state.gifts.length, 1, 'One actual Tower gift is required')
  const gift = state.gifts[0]
  assert.equal(gift.frame, 1076)
  assert.equal(gift.animation?.object, 1417)
  assert.equal(gift.animation?.draw, 43)
  assert.ok(gift.remaining > 0)
  assert.ok(gift.phase > 0, 'Capture the world presentation before it hides')
}

export function assertTowerPresentation(presentation) {
  assert.equal(presentation.visible, true)
  assert.equal(presentation.frame, 1076)
  assert.equal(presentation.bodyFrame, 1076)
  assert.ok(presentation.glowFrame >= 1417 && presentation.glowFrame <= 1430)
  assert.equal(new URL(presentation.atlas).pathname, '/original/vault-knowledge-tower.png')
  assert.equal(presentation.width, 384)
  assert.equal(presentation.height, 384)
  assert.ok(presentation.visibleLayers > 0)
}

export function assertTowerRestore(saved, beforeLoad, loaded) {
  assertTowerGift(saved)
  assertTowerGift(beforeLoad)
  assert.equal(beforeLoad.gifts[0].id, saved.gifts[0].id)
  assert.ok(beforeLoad.turn > saved.turn, 'Live world must advance after saving')
  assert.ok(beforeLoad.gifts[0].remaining < saved.gifts[0].remaining, 'Live gift must diverge before loading')
  assert.deepEqual(loaded, saved, 'Load must rewind to the committed state, not clone the newer live state')
}

export function assertTowerContinuation(saved, loaded, completed, observedGiftIds) {
  assertTowerGift(saved)
  assert.deepEqual(loaded, saved, 'Real Load must restore the committed Tower state before a resumed visit')
  assert.equal(completed.unlockedTower, true)
  assert.equal(completed.level, 4)
  for (const key of ['id', 'kind', 'reward', 'x', 'z'])
    assert.deepEqual(completed.shrine[key], saved.shrine[key], `Restored Tower shrine ${key} changed`)
  assert.equal(completed.gifts.length, 0)
  assert.equal(completed.shrine.active, false)
  assert.equal(completed.shrine.uses, saved.shrine.uses)
  assert.deepEqual([...new Set(observedGiftIds)], [saved.gifts[0].id], 'No second Tower gift may appear during this bounded continuation')
}
