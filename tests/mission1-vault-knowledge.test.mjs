import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, nativePosition, tick } from '../app/model.ts'
import { createGift, initializeVaultKnowledgeGift } from '../app/world-effects.ts'
import { initializeVaultKnowledge, vaultKnowledgePlacement } from '../app/vault-appearance.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

const source = world => world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'camp')

test('authored Mission 1 camp Vault owns its separate HFX glow at socket 1', () => {
  const world = createWorld(1), vault = source(world)
  assert.deepEqual([vault.x, vault.z, vault.mode], [-5, -3, 4])
  assert.ok(vault.knowledgeGlow, 'authored camp marker needs an owned glow')
  assert.deepEqual([vault.knowledgeGlow.object, vault.knowledgeGlow.draw, vault.knowledgeGlow.f1], [1417, 43, 0])
  assert.deepEqual(vaultKnowledgePlacement(vault), { x: -5, z: -3, heightOffset: 1072 })
  const rng = world.randomState, id = world.nextId
  initializeVaultKnowledge(vault, 1)
  assert.equal(world.randomState, rng)
  assert.equal(world.nextId, id)
  for (const changed of [{ x: -3 }, { reward: 'tower' }, { mode: 0 }]) {
    const other = { ...vault, ...changed, knowledgeGlow: undefined }
    initializeVaultKnowledge(other, 1)
    assert.equal(other.knowledgeGlow, undefined)
  }
})

test('Mission 1 nonzero marker cursor survives checkpoint while legacy state initializes once', () => {
  const world = createWorld(1), vault = source(world)
  assert.ok(vault.knowledgeGlow)
  animateLiveObjects(world)
  animateLiveObjects(world)
  assert.equal(vault.knowledgeGlow.f1, 8)
  assert.equal(vault.knowledgeGlow.displayedFrame, 1)
  const saved = migrateCheckpoint(structuredClone(world)), restored = source(saved)
  assert.deepEqual(restored.knowledgeGlow, vault.knowledgeGlow)
  saved.paused = true
  animateLiveObjects(saved)
  assert.deepEqual(restored.knowledgeGlow, vault.knowledgeGlow)
  saved.paused = false
  restored.active = false
  animateLiveObjects(saved)
  assert.deepEqual(restored.knowledgeGlow, vault.knowledgeGlow)
  const legacy = structuredClone(world), before = [legacy.turn, legacy.nextId, legacy.randomState]
  delete source(legacy).knowledgeGlow
  const migrated = migrateCheckpoint(legacy)
  assert.equal(source(migrated).knowledgeGlow.f1, 0)
  assert.deepEqual([migrated.turn, migrated.nextId, migrated.randomState], before)
  assert.equal(migrated.unlockedCamp, false)
})

test('camp gift presentation preserves the existing hide and unlock timers without touching RNG', () => {
  // Focused caller fixture; the separate browser episode earns this reward through command33.
  const world = createWorld(1), vault = source(world), rng = world.randomState
  const gift = createGift(world, 'camp', vault)
  assert.equal(world.randomState, rng)
  assert.deepEqual([gift.frame, gift.remaining, gift.phase], [1077, 82, 6])
  assert.ok(gift.animation)
  assert.notEqual(gift.animation, vault.knowledgeGlow)
  const ground = terrainPointHeight(world.land, nativePosition(world, gift))
  assert.equal(Math.round(gift.height * 45) - ground, 1072)
  assert.equal(gift.sprite.sequence, 'vault-knowledge-glow')
  const clock = { animationTime: 0, animationFrame: 0 }
  advanceGame(world, clock, 1 / 24)
  assert.equal(gift.sprite.frame, 0)
  assert.equal(gift.animation.f1, 4)
  const legacy = structuredClone(world), old = legacy.gifts.find(entry => entry.id === gift.id)
  delete old.animation
  delete old.sprite
  old.height = (ground + 800) / 45
  const remaining = old.remaining, phase = old.phase, nextId = legacy.nextId
  const loaded = migrateCheckpoint(legacy).gifts.find(entry => entry.id === gift.id)
  assert.deepEqual([loaded.frame, loaded.remaining, loaded.phase], [1077, remaining, phase])
  assert.equal(legacy.nextId, nextId)
  assert.equal(Math.round(loaded.height * 45) - ground, 1072)
  for (let visit = 1; visit <= 81; visit++) {
    tick(world, 1 / 12)
    assert.equal(gift.remaining, 82 - visit)
    assert.equal(gift.phase, Math.max(0, 6 - visit))
    assert.equal(world.unlockedCamp, false)
    if (visit === 6) {
      const cursor = gift.animation.f1
      animateLiveObjects(world)
      assert.equal(gift.animation.f1, cursor)
    }
  }
  tick(world, 1 / 12)
  assert.equal(world.unlockedCamp, true)
  assert.equal(world.gifts.some(entry => entry.id === gift.id), false)
})

test('other campaign sources cannot acquire the Mission 1 camp presentation', () => {
  const world = createWorld(1)
  const gift = createGift(world, 'camp', { x: 40, z: 40 })
  assert.equal(gift.animation, undefined)
  const unsupported = createWorld(4)
  const other = { ...source(world), knowledgeGlow: undefined }
  initializeVaultKnowledge(other, 4)
  assert.equal(other.knowledgeGlow, undefined)
  const unrelated = { ...gift, x: -5, z: -3 }
  initializeVaultKnowledgeGift(unsupported, unrelated)
  assert.equal(unrelated.animation, undefined)
})
