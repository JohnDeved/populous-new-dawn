import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createProfileEvidence } from '../scripts/profile-evidence.mjs'

test('retains complete ordered frame and CDP records with arm metadata', () => {
  const directory = mkdtempSync(join(tmpdir(), 'profile-evidence-'))
  try {
    const metadata = { runtime: 'fixture', environment: { renderer: 'fixture' } }
    const frames = [{ time: 1, cpu: 2 }, { time: 8, cpu: 3 }]
    const profile = { nodes: [{ id: 1, children: [2] }, { id: 2 }], samples: [2, 1], timeDeltas: [7, 3] }
    const writer = createProfileEvidence(join(directory, 'summary.json'), metadata)
    const reference = writer.writeRun(0, { scenario: 'crowd', smoothUnits: false }, frames, profile)
    const raw = JSON.parse(readFileSync(reference.path, 'utf8'))
    assert.deepEqual(raw.frames, frames)
    assert.deepEqual(raw.profile, profile)
    assert.deepEqual(raw.metadata, metadata)
    assert.deepEqual(raw.run, { scenario: 'crowd', smoothUnits: false })
    assert.equal(raw.index, 0)
    assert.throws(() => writer.writeRun(0, {}, [], {}), /EEXIST/)
    const other = createProfileEvidence(join(directory, 'summary.json'), metadata)
    assert.notEqual(other.writeRun(0, {}, [], {}).path, reference.path)
    assert.throws(() => writer.writeRun(-1, {}, [], {}), /Invalid run index/)
  } finally {
    rmSync(directory, { recursive: true })
  }
})

test('retains failed-sample diagnostics and explicitly encodes non-finite values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'profile-evidence-'))
  try {
    const writer = createProfileEvidence(join(directory, 'summary.json'), {})
    const reference = writer.writeRun(0, { observations: { endPose: { x: 9 } } },
      [{ landTriangles: Infinity, cpu: NaN, time: -Infinity }], { nodes: [], samples: [] })
    assert.throws(() => assert.fail('Fixed camera drifted'), /Fixed camera drifted/)
    const raw = JSON.parse(readFileSync(reference.path, 'utf8'))
    assert.deepEqual(raw.frames, [{ landTriangles: { $number: 'Infinity' }, cpu: { $number: 'NaN' }, time: { $number: '-Infinity' } }])
    assert.deepEqual(raw.run.observations.endPose, { x: 9 })
    // The live harness must persist the collected sample before any verdict or
    // profile aggregation can throw. This guards placement, not browser behavior.
    const source = readFileSync(new URL('../scripts/profile-game.mjs', import.meta.url), 'utf8')
    const write = source.indexOf('const rawEvidence = evidence.writeRun(')
    assert.ok(write > source.indexOf('endPose:'))
    for (const marker of ['assert.ok(data.frames.length', 'const landTriangles =', 'profile.samples.forEach'])
      assert.ok(write < source.indexOf(marker), `raw write must precede ${marker}`)
  } finally {
    rmSync(directory, { recursive: true })
  }
})
