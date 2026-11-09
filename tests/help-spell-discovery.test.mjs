import test from 'node:test'
import assert from 'node:assert/strict'
import help from '../app/original-help.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { SPELLS } from '../app/world-rules.ts'
import { createWorldState } from '../app/world-state.ts'
import { helpLinkAvailable, helpSpellLinkAvailable } from '../app/help-discovery.ts'
import { helpSpellDiscoveryModels, readHelpSpellKnowledge } from '../app/help-spell-discovery.ts'

const state = () => ({
  shots: Object.fromEntries(SPELLS.map(spell => [spell.id, 0])),
  manaWorld: { playerTribe: 0, gameFlags: 0, spells: [{ available: 0, disabled: 0, stocks: Array(22).fill(0) }] },
})
const spellId = model => SPELLS.find(spell => spell.model === model).id

test('current reader covers all twenty exact imported spell predicate models', () => {
  const topics = Object.values(help.topics).filter(topic => topic.discovery.predicate === '004250f0')
  assert.equal(topics.length, 20)
  assert.deepEqual(helpSpellDiscoveryModels, [...new Set(topics.map(topic => topic.discovery.argument))].sort((a, b) => a - b))
  for (const model of helpSpellDiscoveryModels) {
    const world = state()
    world.shots[spellId(model)] = 1
    assert.deepEqual(readHelpSpellKnowledge(world, model), {
      kind: 'known', available: true, source: 'browser-current-spell', spell: spellId(model),
    })
  }
  for (const model of [0, 1, 22, 31])
    assert.deepEqual(readHelpSpellKnowledge(state(), model), { kind: 'unsupported', reason: 'not-help-spell-predicate' })
})

test('shared scalar predicate preserves the native mask/stock branches and original fixture API', () => {
  for (const model of helpSpellDiscoveryModels)
    for (const permanent of [false, true])
      for (const stock of [0, 1, 15, 16, 17, 255])
        for (const gameFlags of [0, 32]) {
          const alternateLimit = rules.spellCharging[model].alternateLimit
          const expected = gameFlags === 32 ? [10, 12, 15].includes(model) && !!(stock % 16) : permanent || !!(stock % 16)
          const mask = permanent ? 1 << model : 0
          assert.equal(helpSpellLinkAvailable(model, mask, stock, gameFlags, alternateLimit), expected)
          const stocks = [], definitions = []
          stocks[model] = stock
          definitions[model] = alternateLimit
          assert.equal(helpLinkAvailable('004250f0', model, {
            spellBits: mask, buildingBits: 0, stock: stocks, levelFlags: gameFlags, spellDefinitionByte: definitions,
          }), expected)
        }
})

test('a current one-off shot absent from the mana mirror is discovered without synchronization', () => {
  const world = createWorldState(1)
  assert.equal(world.manaWorld.spells[0].available & (1 << 5), 0)
  assert.equal(world.manaWorld.spells[0].stocks[5], 0)
  world.shots.swarm = 1
  const before = structuredClone({ shots: world.shots, manaWorld: world.manaWorld })
  assert.equal(readHelpSpellKnowledge(world, 5).available, true)
  assert.deepEqual({ shots: world.shots, manaWorld: world.manaWorld }, before)
  world.shots.swarm = 0
  world.manaWorld.spells[0].stocks[5] = 9
  assert.equal(readHelpSpellKnowledge(world, 5).available, false)
})

test('permanent knowledge needs no shots, and disabled charging or a HUD alias cannot replace it', () => {
  const world = state()
  world.manaTribes = [{ spellOwner: 1 }]
  world.manaWorld.spells.push({ available: 1 << 2, disabled: 0, stocks: Array(22).fill(15) })
  assert.equal(readHelpSpellKnowledge(world, 2).available, false)
  world.manaWorld.spells[0].available = 1 << 2
  world.manaWorld.spells[0].disabled = 0xffffffff
  world.manaWorld.levelFlags = 32
  assert.equal(readHelpSpellKnowledge(world, 2).available, true)
  world.manaWorld.spells[0].available = 0
  assert.equal(readHelpSpellKnowledge(world, 2).available, false)
})

test('gameFlags0x20 uses alternateLimit, not definition mode, permanent knowledge or HUD visibility', () => {
  const world = state()
  world.manaWorld.gameFlags = 32
  world.manaWorld.spells[0].available = 0xffffffff
  for (const model of helpSpellDiscoveryModels) {
    assert.equal(readHelpSpellKnowledge(world, model).available, false)
    world.shots[spellId(model)] = 1
    assert.equal(readHelpSpellKnowledge(world, model).available, [10, 12, 15].includes(model))
    world.shots[spellId(model)] = 0
  }
  assert.equal(rules.spellCharging[2].mode, 1)
  assert.equal(rules.spellCharging[2].alternateLimit, 0)
  for (const model of [10, 12, 15]) assert.equal(rules.spellCharging[model].alternateLimit, 5)
  world.manaWorld.spells[0].available = 0
  world.shots[spellId(10)] = 1
  assert.equal(readHelpSpellKnowledge(world, 10).available, true)
})

test('reader never accesses or mutates the stock mirror or disabled state', () => {
  const world = state()
  world.shots.blast = 1
  for (const field of ['stocks', 'disabled'])
    Object.defineProperty(world.manaWorld.spells[0], field, { get() { throw new Error(`Unexpected read of ${field}`) } })
  Object.freeze(world.manaWorld.spells[0])
  Object.freeze(world.manaWorld.spells)
  Object.freeze(world.manaWorld)
  Object.freeze(world.shots)
  Object.freeze(world)
  assert.equal(readHelpSpellKnowledge(world, 2).available, true)
})

test('byte/nibble boundaries and signed or unsigned DWORD representations remain explicit', () => {
  const world = state()
  for (const stock of [0, 15, 16, 17, 255]) {
    world.shots.blast = stock
    assert.equal(readHelpSpellKnowledge(world, 2).available, !!(stock % 16))
  }
  world.shots.blast = 0
  for (const mask of [-0x80000000, 0, 0x80000000]) {
    world.manaWorld.spells[0].available = mask
    assert.equal(readHelpSpellKnowledge(world, 2).available, false)
  }
  for (const mask of [-1, 0xffffffff]) {
    world.manaWorld.spells[0].available = mask
    assert.equal(readHelpSpellKnowledge(world, 2).available, true)
  }
  world.shots[spellId(10)] = 1
  for (const gameFlags of [-0x80000000, -1, 0, 0xffffffff]) {
    world.manaWorld.gameFlags = gameFlags
    assert.equal(readHelpSpellKnowledge(world, 10).available, true)
  }
})

test('missing or invalid current masks, stocks and flags fail instead of manufacturing absence', () => {
  for (const invalid of [undefined, null, NaN, Infinity, 1.5, '1', true, -0x80000001, 0x100000000]) {
    const world = state()
    world.manaWorld.spells[0].available = invalid
    assert.throws(() => readHelpSpellKnowledge(world, 2), /permanent spell mask/)
    world.manaWorld.spells[0].available = 0
    world.manaWorld.gameFlags = invalid
    assert.throws(() => readHelpSpellKnowledge(world, 2), /game flags/)
  }
  for (const invalid of [undefined, null, NaN, Infinity, 1.5, '1', true, -1, 256]) {
    const world = state()
    world.shots.blast = invalid
    assert.throws(() => readHelpSpellKnowledge(world, 2), /current spell stock/)
  }
  for (const spells of [undefined, [], [{}]]) {
    const world = state()
    world.manaWorld.spells = spells
    assert.throws(() => readHelpSpellKnowledge(world, 2), /permanent spell mask/)
  }
  const missingShots = state()
  delete missingShots.shots
  assert.throws(() => readHelpSpellKnowledge(missingShots, 2), /current spell stock/)
})

test('other players are unsupported, and invalid player or model values are rejected', () => {
  for (const playerTribe of [1, 2, 3])
    assert.deepEqual(readHelpSpellKnowledge({ manaWorld: { playerTribe } }, 2), { kind: 'unsupported', reason: 'unowned-player' })
  for (const playerTribe of [-1, 4, NaN, Infinity, 0.5, undefined, '0']) {
    const world = state()
    world.manaWorld.playerTribe = playerTribe
    assert.throws(() => readHelpSpellKnowledge(world, 2), /Invalid current Help player/)
  }
  assert.throws(() => readHelpSpellKnowledge({ shots: {} }, 2), /Invalid current Help player/)
  for (const model of [-1, 32, NaN, Infinity, 1.5, undefined, '2'])
    assert.throws(() => readHelpSpellKnowledge(state(), model), /Invalid native spell knowledge bit/)
})

test('malformed imported definition bytes fail closed without a guessed fallback', () => {
  const definition = rules.spellCharging[10], saved = definition.alternateLimit, world = state()
  try {
    for (const invalid of [undefined, null, -1, 256, 0.5, '5']) {
      definition.alternateLimit = invalid // In-memory fault injection only; no asset files are changed.
      assert.throws(() => readHelpSpellKnowledge(world, 10), /spell definition byte/)
    }
  } finally {
    definition.alternateLimit = saved
  }
})
