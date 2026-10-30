import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import native from '../decomp/research/result-statistics/native.json' with { type: 'json' }
import art from '../app/original-result-ui.json' with { type: 'json' }
import { CHECKPOINT_VERSION } from '../app/game-store.ts'

const span = name => native.spans.find(s => s.name === name)
const bytes = name => Buffer.from(span(name).hex, 'hex')
const at = (name, address, hex) => {
  const offset = address - parseInt(span(name).start, 16)
  assert.ok(offset >= 0, name)
  assert.equal(bytes(name).subarray(offset, offset + hex.length / 2).toString('hex'), hex, name)
}
const calls = target => native.directCallCandidates.filter(c => c.target === target).map(c => c.address)
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('bounded original spans retain exact identity, length and hash', () => {
  assert.equal(native.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(new Set(native.spans.map(s => s.name)).size, native.spans.length)
  for (const s of native.spans) {
    const data = Buffer.from(s.hex, 'hex')
    assert.equal(data.length, parseInt(s.end, 16) - parseInt(s.start, 16), s.name)
    assert.equal(createHash('sha256').update(data).digest('hex'), s.sha256, s.name)
  }
  // Every retained direct call's rel32 operand must actually target its helper.
  for (const c of native.directCallCandidates) {
    const data = Buffer.from(c.precedingHex, 'hex')
    assert.equal(data[16], 0xe8)
    assert.equal(parseInt(c.address, 16) + 5 + data.readInt32LE(17), parseInt(c.target, 16))
  }
})

test('all ten descriptors bind distinct words, labels and gaps; masks are not rows', () => {
  const expected = [
    'Fights Won', 'Fights Lost', 'Enemy Tribes Destroyed', 'Enemy Followers Killed',
    'Enemy Buildings Destroyed', 'Enemy Shaman Kills', 'Own Followers Lost',
    'Own Buildings Destroyed', 'Own Shaman Deaths', 'Vaults of Knowledge Raided',
  ]
  const descriptor = bytes('descriptor')
  for (let i = 0; i < 10; i++) {
    assert.equal(descriptor.readUInt16LE(i * 4), 741 + i)
    assert.equal(descriptor.readInt8(i * 4 + 2), i)
    assert.equal(descriptor[i * 4 + 3], [0, 2, 6, 9].includes(i) ? 1 : 0)
    assert.equal(art.nativeRows[i].counterIndex, i)
    assert.equal(art.nativeRows[i].label, expected[i])
  }
  assert.equal(descriptor.readUInt16LE(40), 0)
  assert.equal(art.nativeRows.length, 10)
  // tribe*12 words, then signed descriptor index, then four-byte load.
  at('rendererIndex', 0x5245e7, '8d0440c1e002')
  at('rendererRead', 0x524653, '0fbe470203442438')
  at('rendererRead', 0x524662, '8b0c85c69d9600')
})

test('reset and generic add share twelve-word tribe storage; add skips ff only', () => {
  at('reset', 0x41b521, 'b90c000000')
  at('reset', 0x41b52b, 'c1e0048dbc40c69d960033c0f3ab')
  at('add', 0x41b550, '8a4424043cff74180fbec8')
  at('add', 0x41b55b, '8b4424088d14498d0c90')
  at('add', 0x41b565, '8b54240c01148dc69d9600c3')
  assert.deepEqual(calls('0041b520'), ['0042cb7e'])
  at('resetCaller', 0x42cb7d, '57e89de9feff83c4044733c0')
})

test('producer discovery retains both fight release paths and every direct add call', () => {
  assert.deepEqual(calls('0041b550'), [
    '00403843', '00405235', '00407042', '004070cc', '00408c64', '004094c8',
    '0040b15b', '004a3a80', '004a3aa1', '004d5f29', '004d5f3c', '004d5f8c',
    '004d5f9f', '005199b2', '00519cec',
  ])
  const rows = [
    [0, ['005199b2', '00519cec']],
    [1, ['004a3a80', '004a3aa1']],
    [3, ['004d5f9f']],
    [4, ['00403843', '00405235', '00407042', '004070cc']],
    [5, ['004d5f3c']], [6, ['004d5f8c']],
    [7, ['00408c64', '004094c8', '0040b15b']], [8, ['004d5f29']],
  ]
  for (const [counter, addresses] of rows)
    for (const address of addresses) {
      const c = native.directCallCandidates.find(c => c.address === address)
      // Each reviewed call uses push 1; push counter; push attribution register.
      assert.ok(c.precedingHex.slice(0, 32).includes(`6a${counter.toString(16).padStart(2, '0')}`), address)
    }
  at('tribeElimination', 0x418f57, 'ff8440ce9d9600')
})

test('knowledge completion records a new bit once, separately for spell and building', () => {
  assert.deepEqual(calls('0041b580'), ['004fb071'])
  at('knowledge', 0x41b586, '3cff7433')
  at('knowledge', 0x41b5a7, 'd3e08b1685d0750e')
  at('knowledge', 0x41b5af, 'c1e7040bd08916ff847fea9d9600')
  at('rewardDelivery', 0x4fb05f, '80be80000000017511')
  at('rewardDelivery', 0x4fb068, '8b46748a4e7e505751')
  at('rewardDelivery', 0x4fb091, 'bf0b000000') // building mask word11
  at('rewardDelivery', 0x4fb0f8, 'bf0a000000') // spell mask word10
  // The renderer still reads that same mutable storage; clock conversion is separate.
  at('clock', 0x41b5c5, '2b05c29d9600a3c29d9600')
})

test('existing browser statistics are retained as their own metrics', () => {
  const types = source('app/world-types.ts')
  assert.match(types, /stats: \{ built: number; cast: number; bridges: number; trained: number; battlesWon: number\[\] \}/)
  assert.match(source('app/combat-runtime.ts'), /w\.stats\.battlesWon\[group\.winner\]/)
  assert.match(source('app/world-turn.ts'), /w\.killCredits\[attacker\]\[victim\].*& 65535/)
  // killCredits is a wrapping, unsplit matrix; it cannot stand in for rows3/5/6/8.
  assert.match(source('decomp/generated/004d5cf0.c'), /if .*&& \(!bVar6\)/)
})

test('current-format Save/Load clones stored metric data without aliasing or resetting it', async () => {
  const store = await createCampaignFixtureStore([2]), world = store.getWorld()
  assert.equal(CHECKPOINT_VERSION, 3)
  assert.equal(world.capacityPolicy.mode, 'scalable')
  const values = { built: 17, cast: 29, bridges: 3, trained: 11, battlesWon: [0, 7, -2147483648, 2147483647] }
  Object.assign(world.stats, structuredClone(values))
  await store.saveCheckpoint(false) // No IndexedDB: current in-session checkpoint contract only.
  world.stats.battlesWon[1]++
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().stats, values)
  store.getWorld().stats.battlesWon[2] = 99
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().stats, values)
  store.restart()
  assert.deepEqual(store.getWorld().stats, { built: 0, cast: 0, bridges: 0, trained: 0, battlesWon: [0, 0, 0, 0] })
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().stats, values)
  assert.equal(store.startMission(2), true)
  assert.deepEqual(store.getWorld().stats.battlesWon, [0, 0, 0, 0])
})
