import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'

// Pure observer plus the maintained Temple key assertion; no model/store imports.
async function observe(cameras) {
  const key = Symbol('supplied checkpoint observer fixture')
  globalThis[key] = { version: 5, world: {
    turn: 70, time: 4, outcome: { level: 3 }, units: [], terrain: [1, 2],
    mana: [0], wood: [0], shots: [], giftCounts: [], cameras,
  } }
  try { return await checkpointObservation({ observationName: key }) }
  finally { delete globalThis[key] }
}
test('maintained Temple digest key assertion includes the actual camera digest', async () => {
  const source = readFileSync(new URL('./temple-training-checkpoint.test.mjs', import.meta.url), 'utf8')
  const start = source.indexOf('  assert.deepEqual(\n    Object.keys(saved).sort(),')
  const end = source.indexOf('\n  )', start)
  assert.ok(start >= 0 && end > start)
  const saved = await observe({ time: 0, input: { buttons: 0 } })
  new Function('assert', 'saved', source.slice(start, end + 4))(assert, saved)
  assert.match(saved.cameraContinuationSha256, /^[0-9a-f]{64}$/)
})
test('camera digest detects changed continuation while old summary digests remain equal', async () => {
  const first = await observe({ time: 0, input: { buttons: 0 } })
  const same = await observe({ time: 0, input: { buttons: 0 } })
  const changed = await observe({ time: 1, input: { buttons: 0 } })
  assert.deepEqual(same, first)
  assert.notEqual(changed.cameraContinuationSha256, first.cameraContinuationSha256)
  assert.notEqual(changed.checkpointSha256, first.checkpointSha256)
  for (const key of ['actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.equal(changed[key], first[key], key)
})
test('legacy absent camera continuation is explicit null, not an invented digest', async () => {
  assert.equal((await observe(undefined)).cameraContinuationSha256, null)
  assert.equal((await observe(null)).cameraContinuationSha256, null)
})
