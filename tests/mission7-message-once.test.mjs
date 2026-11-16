import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import { messageStringId } from '../app/messages.ts'
const opening = w => w.messages.slots.filter(m => m?.stringId === messageStringId(50))
test('M7 emits its original turn-zero opening message once during initialization', () => {
  const w = createWorld(7)
  assert.equal(opening(w).length, 1)
  assert.ok(opening(w)[0].flags & 0x20000)
  assert.equal(w.messages.nextSerial, 1)
  assert.ok(!w.ai.pendingCommands.some(c => c.opcode === 1174 || c.opcode === 1187))
})
test('M7 recurring rules do not replace the opening message at later turns', () => {
  const w = createWorld(7)
  for (const turn of [1, 2, 7, 25, 254, 510]) {
    w.turn = turn
    campaignRules(w)
  }
  assert.equal(w.messages.nextSerial, 1)
  assert.equal(opening(w)[0].serial, 0)
})
test('M7 opening message can settle and checkpoint continuation does not replay it', () => {
  const w = createWorld(7)
  advanceGame(w, { animationTime: 0, animationFrame: 0 }, 5)
  assert.equal(w.messages.nextSerial, 1)
  const message = opening(w)[0]
  assert.equal(message.flags & 0x20000, 0)
  assert.ok(message.flags & 2)
  const restored = migrateCheckpoint(structuredClone(w))
  const serial = restored.messages.nextSerial
  for (let i = 0; i < 20; i++) tick(restored, 1 / 12)
  assert.equal(restored.messages.nextSerial, serial)
  assert.equal(opening(restored)[0].serial, message.serial)
})
