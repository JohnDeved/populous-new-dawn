// Extract portable comparisons from the independently reviewed, frozen native
// results. Original scripts/results keep their byte hashes and absolute metadata.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const directory = process.argv[2]
if (!directory) throw new Error('Usage: node scripts/extract-shaman-guard-vectors.mjs RAW_DIRECTORY [--check]')
const sources = {
  'producer-attempt-01.json': '92153069ba20138e60280cb639cfc2f794d1ed4532e7234dbaa79e39843bc922',
  'distance-result.json': 'fa07a6393231153208152ba789b80d9954ae01baefdd87729c3257bedcd52b76',
  'attempt-04.json': '7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711',
}
const reports = Object.fromEntries(Object.entries(sources).map(([name, hash]) => {
  const bytes = readFileSync(resolve(directory, name))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, name)
  return [name, JSON.parse(bytes)]
}))
const producer = reports['producer-attempt-01.json'], lifecycle = reports['attempt-04.json']
const vectors = {
  sources,
  executable: producer.identity,
  comparison: {
    producer: 'Default retain1 only. Every observed person field, all pool references/accounting and changed order bytes are compared. Command30 payload b is excluded: the native caller leaves that stack word unspecified and its consumers use only a. Original b values remain in these snapshots and their raw-result hashes.',
    lifecycle: 'Exact phase/state snapshots retained for live setter/deferred-owner tests. Supplied native destination, stamps, tables and roster do not prove full physical or browser parity.',
    excluded: 'Retain0 passenger selection is native evidence only; the current port exposes default retain1. Absolute paths/tool metadata stay in the frozen result rather than defining portable equality.',
  },
  producer: producer.cases.map(c => ({
    label: c.label,
    // These fixture cases explicitly prefill every nonzero slot with command3.
    filledPool: /^(exhausted-pool|last-free-slot)/.test(c.label),
    steps: c.steps.filter(s => s.entry === '00443b40' && s.args[1] === 1).map(s => ({
      label: s.label, before: s.before, after: s.after,
      changedRecords: s.poolChangedRecords,
      calls: s.trace.map(t => t.name),
    })),
  })).filter(c => c.steps.length),
  distances: reports['distance-result.json'].cases.map(({ label, person, target, goal, native }) => ({ label, person, target, goal, native })),
  lifecycle: lifecycle.cases.map(c => ({
    label: c.label, fixture: c.fixture,
    steps: c.steps.map(({ label, entry, before, after }) => ({ label, entry, before, after })),
  })),
}
const output = new URL('../tests/fixtures/shaman-guard-native.json', import.meta.url)
const text = `${JSON.stringify(vectors, null, 2)}\n`
if (process.argv.includes('--check')) assert.equal(readFileSync(output, 'utf8'), text)
else writeFileSync(output, text)
console.log(`Native correspondence: ${vectors.producer.length} producer cases/${vectors.producer.reduce((n, c) => n + c.steps.length, 0)} producer entries; ${vectors.distances.length} distances; ${vectors.lifecycle.length} lifecycle cases/${vectors.lifecycle.reduce((n, c) => n + c.steps.length, 0)} retained stages.`)
