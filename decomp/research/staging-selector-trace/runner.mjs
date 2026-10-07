import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { output, install, initialize, completed, finish } from './observe.mjs'

assert.equal(process.env.PND_STAGING_TRACE, '1')
for (const name of ['trace.jsonl', 'result.json']) assert.equal(existsSync(`${output}/${name}`), false)
const hooks = install()
let world, tickCalls = 0, failure = null
try {
  const { tick: actualTick } = await import('../../../app/model.ts')
  const { missionData } = await import('../../../app/mission-data.ts')
  const { runScenario } = await import('./scenario.mjs')
  runScenario({
    initialized(w) {
      world = w
      const authored = missionData(2).level.objects.filter(o => o.type === 1 && o.model === 7)
      initialize(w, structuredClone(authored))
    },
    tick(w, dt) {
      assert.equal(w, world)
      assert.equal(dt, 1 / 12)
      assert.ok(tickCalls < 12000, '12,000 fixed-turn call bound reached; no extension')
      tickCalls++
      actualTick(w, dt)
      assert.equal(w.status, 'playing', 'authored outcome ended before selected boundary')
    },
    completed,
  })
  assert.ok(completed())
} catch (error) {
  failure = error
} finally {
  const result = finish(world, failure, tickCalls)
  hooks.deregister()
  delete globalThis[Symbol.for('pnd.staging.trace')]
  console.log(JSON.stringify(result))
}
if (failure) throw failure
