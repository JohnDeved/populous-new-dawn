import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import level from '../app/level-four.ts'
import { missionComputerTribes, missionPosition } from '../app/mission-data.ts'
import { createWorld } from '../app/world-initialization.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'

// Retained export/source binding, not execution of native instructions or a
// universal proof that bulk-memory writers and native saves preserve this word.
test('Mission 4 raid origin binds the retained loaded-Shaman writer and reader', () => {
  for (const [file, expected] of [
    ['00461d70.c', 'b3615d5df13470b64957be7de66ec21d444d9f093f78172cb9ac5ba65c4a8c46'],
    ['00485b00.c', '346a7d08813529a5f716e7641c6580c30b8853070e6c3759b64e8e1ecd899099'],
    ['004f6020.c', '21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb'],
  ]) {
    const source = readFileSync(new URL(`../decomp/generated/${file}`, import.meta.url))
    assert.equal(createHash('sha256').update(source).digest('hex'), expected, file)
  }
  assert.equal(level.sourceSha256, '82a3511c1b5669ba5b44d8ca9eceeefef51c9c6fa7151f650d96d8870f61abad')
  assert.deepEqual(missionComputerTribes(4), [3])
  assert.deepEqual(
    level.objects.filter(o => o.type === 1 && o.model === 7 && o.owner === 3)
      .map(o => [o.index, o.x, o.z]),
    [[14, -81, -63]],
    'first authored Shaman lookup equals last accepted loader writer only with uniqueness'
  )
  assert.deepEqual(missionPosition(4, 'green'), { x: -81, z: -63 })
  const world = createWorld(4), position = nativePosition(world, missionPosition(4, 'green'))
  assert.equal(((position.x >>> 8) & 254) | (position.y & 0xfe00), 0x36b6)
})
