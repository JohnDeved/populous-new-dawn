import { encodeMission10Query, mission10Controls, mission10Modifiers } from '../local-render/mission10-selection.mjs'
// Compact evidence producer. Trusted admission validates this against reviewed
// Git inputs; raw reports and screenshots remain independent hashed artifacts.
import assert from 'node:assert/strict'
import { mission10RetainedName, readMission10ArtifactManifest } from './mission10-artifacts.mjs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// Lossless bounded checkpoint tuple: version, level, turn, time, then
// checkpoint/actors/terrain/stock SHA-256. Raw reports retain named fields.
const checkpointTuple = value => value === null ? null : [value.version, value.level, value.turn, value.time,
  value.checkpointSha256, value.actorsSha256, value.terrainSha256, value.stockSha256]
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')

export function mission10ProfileReceipt(receipt, output) {
  const report = receipt.mission10Profile
  assert.equal(report?.status, 'passed', 'Mission 10 companion must pass')
  assert.equal(report.phases.length, 2)
  assert.deepEqual(JSON.parse(readFileSync(resolve(output, 'mission10-profile.json'))), report)
  let savedCheckpoint
  return { status: report.status, sourceCommit: report.sourceCommit,
    sourceFingerprint: report.sourceFingerprint, runtimeSha256: report.runtimeSha256,
    reportSha256: hash(resolve(output, 'mission10-profile.json')),
    artifacts: readMission10ArtifactManifest(output, report),
    phases: ['created', 'reused'].map((mode, index) => {
      const row = report.phases[index], dir = `mission10-${mode}`
      assert.equal(row.mode, mode)
      assert.equal(row.receipt, mission10RetainedName(mode, 'receipt.json'))
      assert.equal(row.sourceReceipt, `${dir}/receipt.json`)
      const file = resolve(output, dir, 'receipt.json'), phase = JSON.parse(readFileSync(file))
      assert.equal(hash(file), row.receiptSha256, 'Terminal phase receipt changed')
      const result = phase.result, profile = phase.profile
      assert.equal(result.status, 'passed')
      assert.deepEqual(phase.errors, [])
      assert.equal(profile.cleanupVerified, phase.cleanupVerified)
      assert.deepEqual(JSON.parse(readFileSync(resolve(output, dir, 'boat-checkpoint.json'))), result)
      assert.equal(phase.runtimeSha256, createHash('sha256').update(JSON.stringify(phase.runtime)).digest('hex'))
      const runtimeMatchesHost = phase.runtime.browserSha256 === receipt.browserSha256 &&
        phase.runtime.browserVersion === receipt.browserVersion && phase.runtime.node === receipt.node &&
        JSON.stringify(phase.runtime.launch) === JSON.stringify(receipt.launch) &&
        JSON.stringify(phase.runtime.packages) === JSON.stringify(receipt.buildPackageVersions)
      const screenshots = mode === 'created' ? ['boarded-class-selected.png', 'saved-occupied-boat.png']
        : ['loaded-class-selected.png', 'unloaded-class-selected.png']
      assert.equal(phase.source.commit, report.sourceCommit)
      assert.equal(phase.source.fingerprint, report.sourceFingerprint)
      assert.equal(phase.runtimeSha256, report.runtimeSha256)
      const saved = checkpointTuple(mode === 'created' ? result.saved.checkpoint : result.saved)
      if (index === 0) savedCheckpoint = saved
      else assert.deepEqual(saved, savedCheckpoint, 'Exact current checkpoint changed across processes')
      return { mode, status: phase.status,
        // Fixed binding tuple: shared source/runtime reference (0),
        // source-after status, host match, profile ID, run ID, previous run ID,
        // cleanup verified, continuation verified. No numeric/hash fact is lost.
        binding: [0, // exact reference to the outer source/runtime triple, asserted above
          phase.sourceAfter, runtimeMatchesHost, profile.id, profile.runId,
          profile.previousRun?.runId ?? null, phase.cleanupVerified, profile.continuationVerified],
        receiptName: mission10RetainedName(mode, 'receipt.json'), resultName: mission10RetainedName(mode, 'boat-checkpoint.json'),
        receiptSha256: hash(file), resultSha256: hash(resolve(output, dir, 'boat-checkpoint.json')),
        checkpointAtStart: profile.checkpointAtStart?.checkpointSha256 ?? null,
        checkpointAtEnd: profile.checkpointAtEnd?.checkpointSha256 ?? null,
        saved: index === 0 ? saved : 0, // 0 is a lossless reference to phases[0].saved after exact equality above.
        loaded: checkpointTuple(result.loaded ?? null), selection: result.selection.map(row => ({
          phase: row.phase, occupied: row.occupied, query: encodeMission10Query(row.query),
          // Bounded envelope tuples: occupant [id, hp, vehicle], check
          // [control code, modifier code, cleared IDs, selected IDs, preserved].
          // Codes are exact indexes of the two fixed public names/three modifiers.
          occupants: row.occupants.map(({ id, hp, vehicle }) => [id, hp, vehicle]),
          checks: row.checks.map(({ name, modifier, cleared, selected, preserved }) => [mission10Controls.indexOf(name), mission10Modifiers.indexOf(modifier), cleared, selected, preserved]),
        })),
        publicActions: result.actions.filter(action => action.phase === 'after' &&
          ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click',
            'public Load Game', 'ordinary Boat right-click inspection', 'public Unload all passengers'].includes(action.label)).map(action => action.label),
        screenshots: screenshots.map(name => ({ name: mission10RetainedName(mode, name), sha256: hash(resolve(output, dir, name)) })) }
    }) }
}
