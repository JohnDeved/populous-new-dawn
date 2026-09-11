import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/construction-order.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { constructionCase } from '../scripts/compare-construction-order.mjs'

test('construction command matches native registration, fallback ownership and task handoffs', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, i) => assert.deepEqual(constructionCase(c), fixture.expected[i], `native construction case ${i}`))
  const outcomes = fixture.expected
  assert.ok(outcomes.some(c => c.events.some(e => e[0] === 'register')))
  assert.ok(outcomes.some(c => c.events.some(e => e[0] === 'prepare')))
  assert.ok(outcomes.some(c => c.result && c.person.workTarget === 0))
  assert.ok(outcomes.some(c => !c.result && c.person.substate === 2))
  for (const task of [1, 2, 3, 4, 7, 8, 9]) assert.ok(outcomes.some(c => c.events.some(e => e[0] === 'task' && e[1] === task)), `task ${task} exercised`)
  assert.ok(fixture.cases.some(c => c.full), 'pool exhaustion retained')
  assert.ok(fixture.cases.some(c => c.person.commands.every(Boolean)), 'full person queues retained')
  assert.ok(outcomes.some(c => c.cursor === 1), 'allocator wrap retained')
})
