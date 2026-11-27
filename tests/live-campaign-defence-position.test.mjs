import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('the authored opening packs defence coordinates into each acting tribe', async () => {
  const { createWorld, tick } = await loadSceneFixture()
  const { default: { tribes } } = await import('../app/original-script-six.json', { with: { type: 'json' } })
  const authored = [
    [1, 76, 25, 26, 140, 184],
    [2, 76, 25, 26, 140, 184],
    [3, 63, 18, 4, 206, 128],
  ]
  for (const [id, offset, xField, yField, x, y] of authored) {
    assert.deepEqual(tribes[id].codes.slice(offset - 1, offset + 4), [1006, 1038, xField, yField, 1022])
    assert.deepEqual(tribes[id].fields[xField], [0, x])
    assert.deepEqual(tribes[id].fields[yField], [0, y])
  }
  const world = createWorld(6)
  assert.equal(world.status, 'playing')
  assert.equal(world.turn, 0)
  const active = authored.slice(1)
  const read = () => active.map(([id]) => {
    const ai = world.campaignAIs[id]
    return [id, Number(ai.defencePosition), Boolean(ai.states & 0x400), Boolean(ai.flags & 0x100)]
  })
  assert.equal(world.campaignAIs[1], null, 'only actual enemy owners participate at startup')
  const start = read()
  assert.deepEqual(start.map(([id, , enabled, claimed]) => [id, enabled, claimed]), [[2, true, true], [3, true, true]])
  assert.deepEqual(start.map(([, pos]) => pos), active.map(([, , , , x, y]) => x | (y << 8)), 'opening uses native byte order')
  tick(world, 1 / 12)
  assert.equal(world.turn, 1)
  assert.equal(world.campaignAIs[1], null, 'absent owner stays absent after the first tick')
  assert.deepEqual(read(), start, 'opening results persist through the first real world tick')
})
