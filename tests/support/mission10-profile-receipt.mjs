// Synthetic evidence for validator tests only, never rendered acceptance.
export function mission10ReceiptFixture(mergeSha) {
  const h = 'a'.repeat(64), party = [63, 111, 112, 113, 114]
  const saved = { version: 1, level: 10, turn: 100, time: 4, checkpointSha256: h, actorsSha256: h, terrainSha256: h, stockSha256: h }
  return { status: 'passed', sourceCommit: mergeSha, sourceFingerprint: h, runtimeSha256: h, reportSha256: h,
    phases: ['created', 'reused'].map((mode, index) => ({
      mode, status: 'passed', sourceCommit: mergeSha, sourceFingerprint: h, runtimeSha256: h,
      sourceAfter: 'identical', runtimeMatchesHost: true, profileId: '11111111-1111-1111-1111-111111111111',
      runId: index ? '33333333-3333-3333-3333-333333333333' : '22222222-2222-2222-2222-222222222222',
      previousRunId: index ? '22222222-2222-2222-2222-222222222222' : null,
      cleanupVerified: true, continuationVerified: true, receiptSha256: h, resultSha256: h,
      checkpointAtStart: index ? h : null, checkpointAtEnd: h, saved: { ...saved }, loaded: index ? { ...saved } : null,
      selection: (index ? ['loaded', 'unloaded'] : ['boarded']).map(phase => ({
        phase, occupied: phase !== 'unloaded',
        occupants: party.map(id => [id, 100, phase !== 'unloaded' ? 62 : 0]),
        checks: ['Select warrior', 'Select follower'].flatMap(name => ['single', 'Control', 'Shift'].map(modifier => [
          name, modifier, [], phase !== 'unloaded' || name === 'Select follower' && modifier === 'Control' ? [...party]
            : modifier === 'single' ? [111] : party.slice(1), true,
        ])),
      })),
      publicActions: index ? ['public Load Game', 'ordinary Boat right-click inspection', 'public Unload all passengers']
        : ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click'],
      screenshots: (index ? ['loaded-class-selected.png', 'unloaded-class-selected.png'] : ['boarded-class-selected.png', 'saved-occupied-boat.png'])
        .map(name => ({ name: `mission10-${mode}/${name}`, sha256: h })),
    })) }
}

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
export function writeMission10Fixture(output, receipt) {
  const value = mission10ReceiptFixture(receipt.source.commit), json = value => JSON.stringify(value, null, 2) + '\n'
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  const runtime = { browserSha256: receipt.browserSha256, browserVersion: receipt.browserVersion, node: receipt.node,
    launch: receipt.launch, packages: receipt.buildPackageVersions }
  const runtimeSha256 = createHash('sha256').update(JSON.stringify(runtime)).digest('hex')
  const report = { status: 'passed', sourceCommit: value.sourceCommit, sourceFingerprint: value.sourceFingerprint, runtimeSha256,
    phases: value.phases.map(p => {
      const dir = `mission10-${p.mode}`; mkdirSync(resolve(output, dir))
      const result = { status: 'passed', saved: p.mode === 'created' ? { checkpoint: p.saved } : p.saved, loaded: p.loaded,
        selection: p.selection.map(row => ({ ...row,
          occupants: row.occupants.map(([id, hp, vehicle]) => ({ id, hp, vehicle })),
          checks: row.checks.map(([name, modifier, cleared, selected, preserved]) => ({ name, modifier, cleared, selected, preserved })),
        })), actions: p.publicActions.map(label => ({ label, phase: 'after' })) }
      const phase = { status: p.status, source: { commit: p.sourceCommit, fingerprint: p.sourceFingerprint },
        runtime, runtimeSha256, errors: [], sourceAfter: p.sourceAfter, cleanupVerified: p.cleanupVerified,
        profile: { id: p.profileId, runId: p.runId, previousRun: p.previousRunId && { runId: p.previousRunId },
          cleanupVerified: p.cleanupVerified, continuationVerified: p.continuationVerified, checkpointAtStart: p.checkpointAtStart && { checkpointSha256: p.checkpointAtStart },
          checkpointAtEnd: { checkpointSha256: p.checkpointAtEnd } }, result }
      writeFileSync(resolve(output, dir, 'receipt.json'), json(phase))
      writeFileSync(resolve(output, dir, 'boat-checkpoint.json'), json(result))
      for (const image of p.screenshots) writeFileSync(resolve(output, image.name), 'synthetic pixel bytes')
      return { mode: p.mode, receiptSha256: hash(resolve(output, dir, 'receipt.json')) }
    }) }
  writeFileSync(resolve(output, 'mission10-profile.json'), json(report))
  return report
}
