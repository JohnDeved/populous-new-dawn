import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import level from '../app/level-five.ts'
import { missionComputerTribes, missionPosition } from '../app/mission-data.ts'
import { createWorld } from '../app/world-initialization.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'

// Retained source binding, not native execution or a complete save/reset writer audit.
test('Mission 5 raid origin binds the unique loaded Dakini Shaman', () => {
  for (const [file, expected] of [
    ['00461d70.c', 'b3615d5df13470b64957be7de66ec21d444d9f093f78172cb9ac5ba65c4a8c46'],
    ['00485b00.c', '346a7d08813529a5f716e7641c6580c30b8853070e6c3759b64e8e1ecd899099'],
    ['004f6020.c', '21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb'],
  ]) {
    const source = readFileSync(new URL(`../decomp/generated/${file}`, import.meta.url))
    assert.equal(createHash('sha256').update(source).digest('hex'), expected, file)
  }
  assert.equal(level.sourceSha256, 'fce3c6555933d9e6d04490739a90f0cd188bc561a977c0c28e04aa265955f90b')
  assert.deepEqual(missionComputerTribes(5), [1])
  assert.deepEqual(
    level.objects.filter(o => o.type === 1 && o.model === 7 && o.owner === 1)
      .map(o => [o.index, o.x, o.z]),
    [[124, -117, 67]],
    'unique authored Shaman makes the first lookup equal the last accepted loader writer'
  )
  assert.deepEqual(missionPosition(5, 'red'), { x: -117, z: 67 })
  const world = createWorld(5), position = nativePosition(world, missionPosition(5, 'red'))
  assert.equal(((position.x >>> 8) & 254) | (position.y & 0xfe00), 0xb492)
})
