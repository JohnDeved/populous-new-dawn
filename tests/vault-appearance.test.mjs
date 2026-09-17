import assert from 'node:assert/strict'
import test from 'node:test'
import {
  VAULT_KNOWLEDGE_NATIVE_HEIGHT,
  vaultKnowledgeFrame,
  vaultKnowledgeVisible,
} from '../app/vault-appearance.ts'

test('Vault knowledge uses the original class-6/model-2 reward frames and height', () => {
  assert.equal(VAULT_KNOWLEDGE_NATIVE_HEIGHT, 800)
  assert.equal(vaultKnowledgeFrame('invisibility'), 1062)
  assert.equal(vaultKnowledgeFrame('lightning'), 1059)
  assert.equal(vaultKnowledgeFrame('bridge'), 1068)
  assert.equal(vaultKnowledgeFrame('tower'), 1077)
  assert.equal(vaultKnowledgeFrame('mana', 5), 1061)
})

test('Vault knowledge is present only while its authored reward source is active', () => {
  const vault = { kind: 'vault', active: true, reward: 'invisibility' }
  assert.equal(vaultKnowledgeVisible(vault), true)
  assert.equal(vaultKnowledgeVisible({ ...vault, active: false }), false)
  assert.equal(vaultKnowledgeVisible({ ...vault, reward: undefined }), false)
  assert.equal(vaultKnowledgeVisible({ ...vault, kind: 'lightning' }), false)
})
