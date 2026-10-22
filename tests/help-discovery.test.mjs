import test from 'node:test'
import assert from 'node:assert/strict'
import { helpLinkAvailable, helpLinkTarget } from '../app/help-discovery.ts'

const state = patch => ({ spellBits: 0, buildingBits: 0, stock: [], levelFlags: 0, spellDefinitionByte: [], ...patch })
test('native links are gated by exact knowledge and stock bits, not campaign completion', () => {
  assert.equal(helpLinkAvailable('00000000', 0, state()), true)
  assert.equal(helpLinkAvailable('00425110', 7, state({ buildingBits: 1 << 7 })), true)
  assert.equal(helpLinkAvailable('00425110', 7, state({ buildingBits: 1 << 8 })), false)
  assert.equal(helpLinkAvailable('004250f0', 2, state({ spellBits: 1 << 2 })), true)
  assert.equal(helpLinkAvailable('004250f0', 2, state({ stock: [0, 0, 0x10] })), false)
  assert.equal(helpLinkAvailable('004250f0', 2, state({ stock: [0, 0, 0x11] })), true)
})
test('level flag0x20 requires the original definition byte plus low-nibble stock', () => {
  for (const definition of [0, 1]) for (const stock of [0, 1])
    assert.equal(helpLinkAvailable('004250f0', 2, state({ levelFlags: 0x20,
      spellBits: 1 << 2, stock: [0, 0, stock], spellDefinitionByte: [0, 0, definition] })), !!(definition && stock))
})
test('unavailable links remain activatable and select1057; direct Query is a separate selector', () => {
  assert.equal(helpLinkTarget(68, true), 1051)
  assert.equal(helpLinkTarget(23, false), 1057)
  assert.throws(() => helpLinkAvailable('12345678', 0, state()), /Unimported/)
  for (const invalid of [-1, 88, NaN, 1.5]) assert.throws(() => helpLinkTarget(invalid, true), /Unimported/)
})
