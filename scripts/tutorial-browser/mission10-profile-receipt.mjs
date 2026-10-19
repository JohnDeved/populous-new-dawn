// Compact evidence producer. Trusted admission validates this against reviewed
// Git inputs; raw reports and screenshots remain independent hashed artifacts.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')

export function mission10ProfileReceipt(receipt, output) {
  const report = receipt.mission10Profile
  assert.equal(report?.status, 'passed', 'Mission 10 companion must pass')
  assert.equal(report.phases.length, 2)
  assert.deepEqual(JSON.parse(readFileSync(resolve(output, 'mission10-profile.json'))), report)
  return { status: report.status, sourceCommit: report.sourceCommit,
    sourceFingerprint: report.sourceFingerprint, runtimeSha256: report.runtimeSha256,
    reportSha256: hash(resolve(output, 'mission10-profile.json')),
    phases: ['created', 'reused'].map((mode, index) => {
      const row = report.phases[index], dir = `mission10-${mode}`
      assert.equal(row.mode, mode)
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
      return { mode, status: phase.status, sourceCommit: phase.source.commit,
        sourceFingerprint: phase.source.fingerprint, runtimeSha256: phase.runtimeSha256,
        sourceAfter: phase.sourceAfter, runtimeMatchesHost, profileId: profile.id, runId: profile.runId,
        previousRunId: profile.previousRun?.runId ?? null,
        cleanupVerified: phase.cleanupVerified, continuationVerified: profile.continuationVerified,
        receiptSha256: hash(file), resultSha256: hash(resolve(output, dir, 'boat-checkpoint.json')),
        checkpointAtStart: profile.checkpointAtStart?.checkpointSha256 ?? null,
        checkpointAtEnd: profile.checkpointAtEnd?.checkpointSha256 ?? null,
        saved: mode === 'created' ? result.saved.checkpoint : result.saved,
        loaded: result.loaded ?? null, selection: result.selection.map(row => ({
          phase: row.phase, occupied: row.occupied,
          // Bounded envelope tuples: occupant [id, hp, vehicle], check
          // [accessible name, modifier, cleared IDs, selected IDs, preserved].
          occupants: row.occupants.map(({ id, hp, vehicle }) => [id, hp, vehicle]),
          checks: row.checks.map(({ name, modifier, cleared, selected, preserved }) => [name, modifier, cleared, selected, preserved]),
        })),
        publicActions: result.actions.filter(action => action.phase === 'after' &&
          ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click',
            'public Load Game', 'ordinary Boat right-click inspection', 'public Unload all passengers'].includes(action.label)).map(action => action.label),
        screenshots: screenshots.map(name => ({ name: `${dir}/${name}`, sha256: hash(resolve(output, dir, name)) })) }
    }) }
}
