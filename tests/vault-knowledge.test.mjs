import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, nativePosition, tick } from '../app/model.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { vaultKnowledgeFrame } from '../app/vault-appearance.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

test('Mission 3 Temple descriptor selects the native HFX identity', () => {
  const world = createWorld(3)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  assert.equal(vault.knowledgeGlow.f1, 0, 'new world owns initialization before rendering')
  assert.equal(vault.reward, 'temple')
  assert.deepEqual([vault.x, vault.z, vault.mode], [-37, -133, 4])
  assert.equal(vaultKnowledgeFrame(vault.reward, vault.rewardModel, world.outcome.level), 1079)
})

test('Mission 3 marker glow owns a saved fourteen-frame cursor on the existing animation boundary', () => {
  const world = createWorld(3)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  animateLiveObjects(world)
  assert.ok(vault.knowledgeGlow)
  assert.deepEqual(
    [vault.knowledgeGlow.object, vault.knowledgeGlow.draw, vault.knowledgeGlow.f1],
    [1417, 43, 4]
  )
  for (let i = 1; i < 14; i++) animateLiveObjects(world)
  assert.equal(vault.knowledgeGlow.f1, 0)
  world.paused = true
  animateLiveObjects(world)
  assert.equal(vault.knowledgeGlow.f1, 0)
  world.paused = false
  animateLiveObjects(world)
  const saved = migrateCheckpoint(structuredClone(world))
  const savedVault = saved.shrines.find(shrine => shrine.id === vault.id)
  assert.deepEqual(savedVault.knowledgeGlow, vault.knowledgeGlow)
  animateLiveObjects(saved)
  assert.equal(savedVault.knowledgeGlow.f1, 8)
  const before = structuredClone(savedVault.knowledgeGlow)
  savedVault.active = false
  animateLiveObjects(saved)
  assert.deepEqual(savedVault.knowledgeGlow, before)
  const legacy = structuredClone(world)
  delete legacy.shrines.find(shrine => shrine.id === vault.id).knowledgeGlow
  const oldTurn = legacy.turn
  const restored = migrateCheckpoint(legacy)
  assert.equal(restored.shrines.find(shrine => shrine.id === vault.id).knowledgeGlow.f1, 0)
  assert.equal(restored.turn, oldTurn)
  assert.equal(restored.unlockedTemple, false)
})

test('ordinary Mission 3 Vault collection preserves payout while changing only world presentation', () => {
  const world = createWorld(3)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  finishLevelStart(world)
  assert.ok(command(world, vault))
  for (let i = 0; !world.gifts.some(gift => gift.reward === 'temple') && i < 4000; i++)
    tick(world, 1 / 12)
  const gift = world.gifts.find(gift => gift.reward === 'temple')
  assert.ok(gift, 'ordinary command must produce the authored Temple reward')
  const ground = terrainPointHeight(world.land, nativePosition(world, gift))
  assert.deepEqual(
    [gift.frame, Math.round(gift.height * 45) - ground, gift.remaining, gift.phase],
    [1079, 1072, 82, 6]
  )
  assert.ok(gift.animation)
  assert.deepEqual([gift.animation.object, gift.animation.draw, gift.animation.f1], [1417, 43, 0])
  assert.notEqual(gift.animation, vault.knowledgeGlow)
  assert.equal(vault.active, false)
  assert.equal(world.unlockedTemple, false)
  const saved = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(saved.gifts.find(candidate => candidate.id === gift.id).animation, gift.animation)
  const legacy = structuredClone(world)
  const oldGift = legacy.gifts.find(candidate => candidate.id === gift.id)
  delete oldGift.animation
  oldGift.frame = 1077
  oldGift.height = (ground + 800) / 45
  const oldNextId = legacy.nextId
  const recovered = migrateCheckpoint(legacy).gifts.find(candidate => candidate.id === gift.id)
  assert.deepEqual([recovered.frame, recovered.remaining, recovered.phase], [1079, 82, 6])
  assert.equal(legacy.nextId, oldNextId)
  assert.equal(legacy.unlockedTemple, false)
  for (let visit = 1; visit <= 81; visit++) {
    tick(world, 1 / 12)
    assert.equal(gift.remaining, 82 - visit)
    assert.equal(gift.phase, Math.max(0, 6 - visit))
    assert.equal(world.unlockedTemple, false)
    if (visit === 6) {
      const cursor = gift.animation.f1
      animateLiveObjects(world)
      assert.equal(gift.animation.f1, cursor, 'retired gift glow stops on the hide visit')
    }
  }
  tick(world, 1 / 12)
  assert.equal(world.unlockedTemple, true)
  assert.equal(world.gifts.some(candidate => candidate.id === gift.id), false)
})

test('unrelated Vault and ordinary spell families retain their existing presentation owners', () => {
  for (const mission of [2, 4, 7]) {
    const world = createWorld(mission)
    assert.ok(world.shrines.every(shrine => shrine.knowledgeGlow === undefined))
  }
  assert.equal(vaultKnowledgeFrame('tower'), 1077)
  assert.equal(vaultKnowledgeFrame('temple', 0, 7), 1077)
  assert.equal(vaultKnowledgeFrame('invisibility'), 1062)
})

test('a glow born on an animation boundary first displays frame zero before its next cursor', () => {
  const world = createWorld(3)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  const clock = { animationTime: 0, animationFrame: 0 }
  advanceGame(world, clock, 1 / 24)
  assert.equal(vault.knowledgeGlow.displayedFrame, 0)
  assert.equal(vault.knowledgeGlow.f1, 4)
  finishLevelStart(world)
  assert.ok(command(world, vault))
  for (let i = 0; !world.gifts.some(gift => gift.reward === 'temple') && i < 8000; i++)
    advanceGame(world, clock, 1 / 24)
  const gift = world.gifts.find(gift => gift.reward === 'temple')
  assert.ok(gift)
  assert.equal(gift.animation.f1, 4)
  assert.equal(gift.sprite.frame, 0)
  advanceGame(world, clock, 1 / 24)
  assert.equal(gift.animation.f1, 8)
  assert.equal(gift.sprite.frame, 1)
})
