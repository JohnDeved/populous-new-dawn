import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-fetch.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { fetchCase } from '../scripts/compare-building-fetch.mjs'

test('timber hauling matches native phases, movement, reservations, transfers, poses and clocks', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, i) => assert.deepEqual(fetchCase(c), fixture.expected[i], `native hauling case ${i}`))
  for (const phase of [0, 1, 2, 3, 4, 5, 17, 22, 24, 27, 50, 255])
    assert.ok(fixture.cases.some(c => c.task.phase === phase), `phase ${phase} covered`)
  for (const event of ['destination', 'animation', 'sound', 'refresh', 'find', 'loose', 'reserve', 'transfer', 'releaseMotion'])
    assert.ok(fixture.expected.some(c => c.events.some(e => e[0] === event)), `${event} covered`)
  assert.ok(fixture.expected.some(c => c.result === 2), 'completed delivery returns to work')
  assert.ok(fixture.expected.some(c => c.task.phase === 50), 'lost targets and timeouts return to the site')
  assert.ok(fixture.cases.some(c => c.routeFails && c.task.phase === 24), 'failed route entry covered')
  assert.ok(fixture.expected.some((e, i) => e.target.reservations === 0 && fixture.cases[i].target.reservations === 255), 'reservation counter wraps')
  assert.ok(fixture.expected.some(c => c.events.filter(e => e[0] === 'releaseMotion').length === 2), 'search retry and wait retain separate facing draws')
})
