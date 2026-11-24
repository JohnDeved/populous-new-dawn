import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import { messageStringId } from '../app/messages.ts'

for (const [mission, number, stringId, primaryAfterInitialization] of [
  [3, 105, 648, 2517695575],
  [5, 74, 661, 1125611668],
  [8, 52, 672, 1],
  [9, 54, 675, 1],
]) {
  const opening = w => w.messages.slots.filter(m => m?.stringId === stringId)
  test(`M${mission} imports the native opening message ${number}`, () => {
    assert.equal(messageStringId(number), stringId)
  })
  test(`M${mission} initializes one pending opening popup`, () => {
    const w = createWorld(mission)
    assert.equal(opening(w).length, 1)
    assert.ok(opening(w)[0].flags & 0x20000)
    assert.equal(w.messages.nextSerial, 1)
    assert.ok(!w.ai.pendingCommands.some(c => c.opcode === 1174 || c.opcode === 1187))
  })
  test(`M${mission} opening advances the native presentation RNG, not the primary simulation RNG`, () => {
    const w = createWorld(mission)
    assert.equal(w.randomState, primaryAfterInitialization)
    assert.equal(w.cosmeticRandom.randomState, 1275068418, 'One presentation draw from seed 1')
  })
  test(`M${mission} recurring rules do not replay its opening`, () => {
    const w = createWorld(mission)
    for (const turn of [1, 2, 7, 25, 254, 510]) {
      w.turn = turn
      campaignRules(w)
    }
    assert.equal(w.messages.nextSerial, 1)
    assert.equal(opening(w)[0].serial, 0)
  })
  test(`M${mission} opening settles and current checkpoint continuation does not replay`, () => {
    const w = createWorld(mission)
    advanceGame(w, { animationTime: 0, animationFrame: 0 }, 5)
    assert.equal(w.messages.nextSerial, 1)
    const message = opening(w)[0]
    assert.equal(message.flags & 0x20000, 0)
    assert.ok(message.flags & 2)
    const restored = migrateCheckpoint(structuredClone(w))
    for (let i = 0; i < 20; i++) tick(restored, 1 / 12)
    assert.equal(restored.messages.nextSerial, 1)
    assert.equal(opening(restored)[0].serial, message.serial)
  })
}

test('existing startup message callers retain their current compatibility stream', () => {
  for (const [mission, stringId, primary, speed] of [
    [4, 654, 2517695575, 1123],
    [7, 668, 1275068418, 1170],
    [15, 1228, 521602106, 1208],
  ]) {
    const w = createWorld(mission)
    assert.equal(w.randomState, primary)
    assert.equal(w.cosmeticRandom.randomState, 1)
    assert.deepEqual(
      w.messages.slots.filter(Boolean).map(message => [message.stringId, message.speed]),
      [[stringId, speed]]
    )
  }
})
