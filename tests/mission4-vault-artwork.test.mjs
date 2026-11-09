import assert from 'node:assert/strict'
import test from 'node:test'
import { vaultKnowledgeAppearance, vaultKnowledgeAtlas, vaultKnowledgeFrame, initializeVaultKnowledge, vaultKnowledgeGiftAppearance } from '../app/vault-appearance.ts'
const shrine = () => ({ kind: 'vault', mode: 4, reward: 'tower', x: 69, z: -29, active: true })

test('Mission 4 authored Tower selects its original body and bank-d atlas', () => {
  const knowledge = vaultKnowledgeAppearance(shrine(), 4)
  assert.equal(knowledge.body.source, 1076)
  assert.equal(knowledge.atlas, 'vault-knowledge-tower')
  assert.equal(knowledge.landscapeBank, 13)
  assert.equal(vaultKnowledgeAtlas(4), knowledge.atlas)
  assert.equal(vaultKnowledgeFrame('tower', 0, 4), 1076)
  assert.equal(vaultKnowledgeFrame('tower'), 1077)
  assert.equal(vaultKnowledgeFrame('camp', 0, 1), 1077)
  assert.equal(vaultKnowledgeFrame('temple', 0, 3), 1079)
})

test('Tower artwork is restricted to the authored mission, reward and source', () => {
  for (const changed of [{ x: 68 }, { z: -28 }, { mode: 0 }, { reward: 'camp' }, { kind: 'totem' }])
    assert.equal(vaultKnowledgeAppearance({ ...shrine(), ...changed }, 4), undefined)
  for (const mission of [1, 2, 3, 7]) assert.equal(vaultKnowledgeAppearance(shrine(), mission), undefined)
})

test('Tower marker initializes once and preserves saved animation state', () => {
  const vault = shrine()
  initializeVaultKnowledge(vault, 4)
  assert.deepEqual([vault.knowledgeGlow.object, vault.knowledgeGlow.draw, vault.knowledgeGlow.f1], [1417, 43, 0])
  vault.knowledgeGlow.f1 = 8
  vault.knowledgeGlow.displayedFrame = 1
  const saved = structuredClone(vault.knowledgeGlow)
  initializeVaultKnowledge(vault, 4)
  assert.deepEqual(vault.knowledgeGlow, saved)
  const inactive = { ...shrine(), active: false }
  initializeVaultKnowledge(inactive, 4)
  assert.equal(inactive.knowledgeGlow, undefined)
})

test('Tower gift artwork requires matching original frame and animation identity', () => {
  const world = { outcome: { level: 4 }, shrines: [shrine()] }
  const gift = { x: 69, z: -29, reward: 'tower', frame: 1076, animation: { object: 1417, draw: 43 } }
  assert.equal(vaultKnowledgeGiftAppearance(world, gift)?.atlas, 'vault-knowledge-tower')
  for (const changed of [{ frame: 1077 }, { reward: 'camp' }, { animation: { object: 1418, draw: 43 } }, { x: 68 }])
    assert.equal(vaultKnowledgeGiftAppearance(world, { ...gift, ...changed }), undefined)
})
