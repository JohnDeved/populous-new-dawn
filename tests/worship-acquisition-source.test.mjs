import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, createGift, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { ordinaryWorshipSource } from '../app/worship-acquisition-source.ts'

test('authored ordinary sources exclude the spell-valued Vault and other missions', () => {
  assert.deepEqual(ordinaryWorshipSource(1, 28), { head: 28, reward: 29, slot: 0, model: 3 })
  assert.deepEqual(ordinaryWorshipSource(1, 30), { head: 30, reward: 31, slot: 0, model: 12 })
  assert.deepEqual(ordinaryWorshipSource(2, 63), { head: 63, reward: 62, slot: 0, model: 4 })
  assert.equal(ordinaryWorshipSource(2, 25), undefined)
  for (const mission of [3, 4, 7, 20])
    assert.equal(ordinaryWorshipSource(mission, 28), undefined)
})

test('ordinary shrine completion persists provenance, recipient and creation order', () => {
  for (const [mission, reward, model] of [[1, 'lightning', 3], [1, 'bridge', 12], [2, 'tornado', 4]]) {
    const w = createWorld(mission), head = w.shrines.find(s => s.kind === reward)
    head.reset = false
    head.forced = true
    tick(w, 1 / 12)
    const gift = w.gifts.find(g => g.reward === reward)
    assert.ok(gift)
    assert.deepEqual(gift.ordinaryWorship, { ...head.ordinarySpellReward, completedTurn: w.turn, serial: gift.id })
    assert.equal(gift.ordinaryWorship.model, model)
    assert.equal(gift.recipient, w.manaWorld.playerTribe)
    const saved = migrateCheckpoint(structuredClone(w)).gifts.find(g => g.id === gift.id)
    assert.deepEqual(saved.ordinaryWorship, gift.ordinaryWorship)
    assert.equal(saved.recipient, gift.recipient)
  }
})

test('generic spell, mana and knowledge gifts do not inherit ordinary eligibility', () => {
  const w = createWorld(2), vault = w.shrines.find(s => s.kind === 'vault')
  assert.equal(vault.ordinarySpellReward, undefined)
  for (const reward of [vault.reward, 'mana', 'tower', 'lightning'])
    assert.equal(createGift(w, reward, vault).ordinaryWorship, undefined)
})

test('legacy head identity may recover eligibility but an existing gift cannot', () => {
  const w = createWorld(1), head = w.shrines.find(s => s.kind === 'bridge'),
    gift = createGift(w, 'bridge', head), expected = structuredClone(head.ordinarySpellReward)
  gift.phase = 0
  delete head.ordinarySpellReward
  delete head.mode
  const restored = migrateCheckpoint(structuredClone(w)),
    restoredHead = restored.shrines.find(s => s.id === head.id)
  assert.deepEqual(restoredHead.ordinarySpellReward, expected)
  assert.equal(restored.gifts.find(g => g.id === gift.id).ordinaryWorship, undefined)
  const once = structuredClone(restored)
  migrateCheckpoint(restored)
  assert.deepEqual(restored, once)
})
