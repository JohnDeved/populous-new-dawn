import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { advanceGame } from '../app/game-clock.ts'

for (const [opcode, bit] of [[1180, 0x200], [1187, 0x20000]]) {
  test(`campaign message opcode ${opcode} respects disabled messages on a retained slot`, () => {
    const world = createWorld(3)
    advanceGame(world, { animationTime: 0, animationFrame: 0 }, 5)
    const message = world.messages.slots[world.lastMessage]
    assert.ok(message && message.stringId === 648 && message.serial === 0)
    assert.equal(message.flags & bit, 0, 'The authored briefing is still live, with no pending value for this flag')

    campaignCommand(world, 1222, [1023]) // Disable messages through the native-shaped script command.
    assert.ok(world.manaWorld.levelFlags & 0x1000000)
    const old = structuredClone(world.messages)
    campaignCommand(world, opcode, [])
    assert.equal(world.messages.slots[world.lastMessage], message)
    assert.deepEqual(world.messages, old, 'Disabled tag must not mutate the previous message slot')

    campaignCommand(world, 1222, [1022])
    assert.equal(world.manaWorld.levelFlags & 0x1000000, 0)
    campaignCommand(world, opcode, [])
    assert.equal(message.flags, old.slots[world.lastMessage].flags | bit)
    assert.equal(world.messages.nextSerial, old.nextSerial)
  })
}
