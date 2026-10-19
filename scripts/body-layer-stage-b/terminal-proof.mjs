import assert from 'node:assert/strict'
import { gunzipSync } from 'node:zlib'
import { sha } from '../../scripts/body-layer-stage-a/io.mjs'
export function compareTerminal(report, actual, reference, readReference, decode) {
  assert.equal(reference.status, 'passed')
  assert.equal(report.revision, reference.revision)
  assert.equal(report.cohort, reference.cohort)
  assert.equal(report.side, reference.side)
  assert.equal(reference.steps.length, 28)
  assert.equal(reference.controls.length, 24)
  assert.deepEqual(report.environment, reference.environment)
  assert.equal(report.browserVersion, reference.browserVersion)
  assert.equal(report.browserBinary.sha256, reference.browserBinary.sha256)
  assert.equal(report.initialStateSha256, reference.initialStateSha256)
  const row = reference.steps[27]
  const pixels = gunzipSync(readReference(row.pixelFile)),
    state = gunzipSync(readReference(row.stateFile))
  assert.equal(sha(pixels), row.pixelSha256)
  assert.equal(sha(state), row.stateSha256)
  const expected = JSON.parse(state)
  assert.deepEqual(
    decode(actual.state, true),
    decode(expected.state, true),
    'Terminal complete state'
  )
  assert.deepEqual(
    decode(actual.picks, true),
    decode(expected.picks, true),
    'Terminal pick results'
  )
  assert.ok(Buffer.from(actual.pixels, 'base64').equals(pixels), 'Terminal raw RGBA')
  assert.equal(actual.width, row.width)
  assert.equal(actual.height, row.height)
  assert.deepEqual(actual.counters, row.counters, 'Terminal same-source counters')
  return {
    status: 'passed',
    referenceStateSha256: row.stateSha256,
    referencePixelSha256: row.pixelSha256,
  }
}
export function summarize(rows) {
  assert.equal(rows.length, 28)
  rows.forEach((r, i) => {
    assert.equal(r.index, i)
    assert.ok(Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0)
  })
  const values = rows.slice(4).map(r => r.elapsedMs),
    sorted = [...values].sort((a, b) => a - b),
    rank = q => sorted[Math.ceil(q * sorted.length) - 1]
  return {
    warmups: rows.slice(0, 4).map(r => r.elapsedMs),
    measured: values,
    total: values.reduce((a, b) => a + b, 0),
    p50: rank(0.5),
    p95: rank(0.95),
    p99: rank(0.99),
    max: sorted.at(-1),
  }
}
