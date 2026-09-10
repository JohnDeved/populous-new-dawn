import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/unit-health.json' with { type: 'json' }
import { unitHealthGauge } from '../app/unit-health.ts'

test('overhead health gauges match native visibility, scaled-pose anchors and 24-pixel fills', () => {
  assert.deepEqual(fixture.cases.map(unitHealthGauge), fixture.expected)
})
