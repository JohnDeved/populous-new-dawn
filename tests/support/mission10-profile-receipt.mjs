// Synthetic evidence for validator tests only, never rendered acceptance.
export function mission10ReceiptFixture(mergeSha) {
  const h = 'a'.repeat(64), party = [63, 111, 112, 113, 114]
  // version, level, turn, time, checkpoint/actors/terrain/stock SHA-256.
  const saved = [1, 10, 100, 4, h, h, h, h]
  return { status: 'passed', sourceCommit: mergeSha, sourceFingerprint: h, runtimeSha256: h, reportSha256: h,
    artifacts: { path: 'mission10-artifacts.json', bytes: 4000, sha256: h },
    phases: ['created', 'reused'].map((mode, index) => ({
      mode, status: 'passed',
      binding: [mergeSha, h, h, 'identical', true, '11111111-1111-1111-1111-111111111111',
        index ? '33333333-3333-3333-3333-333333333333' : '22222222-2222-2222-2222-222222222222',
        index ? '22222222-2222-2222-2222-222222222222' : null, true, true],
      receiptName: `mission10-${mode}--receipt.json`, resultName: `mission10-${mode}--boat-checkpoint.json`, receiptSha256: h, resultSha256: h,
      checkpointAtStart: index ? h : null, checkpointAtEnd: h, saved: [...saved], loaded: index ? [...saved] : null,
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
        .map(name => ({ name: `mission10-${mode}--${name}`, sha256: h })),
    })) }
}

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mission10ExpectedArtifacts, retainMission10Artifacts } from '../../scripts/tutorial-browser/mission10-artifacts.mjs'
export function writeMission10Fixture(output, receipt, customize = () => {}) {
  const value = mission10ReceiptFixture(receipt.source.commit), json = value => JSON.stringify(value, null, 2) + '\n'
  customize(value)
  const checkpoint = tuple => tuple === null ? null : Object.fromEntries(['version', 'level', 'turn', 'time',
    'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'].map((key, index) => [key, tuple[index]]))
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  const runtime = { browserSha256: receipt.browserSha256, browserVersion: receipt.browserVersion, node: receipt.node,
    launch: receipt.launch, packages: receipt.buildPackageVersions }
  const runtimeSha256 = createHash('sha256').update(JSON.stringify(runtime)).digest('hex')
  const report = { status: 'passed', sourceCommit: value.sourceCommit, sourceFingerprint: value.sourceFingerprint, runtimeSha256,
    phases: value.phases.map(p => {
      const [sourceCommit, sourceFingerprint, , sourceAfter, , profileId, runId, previousRunId, cleanupVerified, continuationVerified] = p.binding
      const dir = `mission10-${p.mode}`; mkdirSync(resolve(output, dir))
      const result = { status: 'passed', saved: p.mode === 'created' ? { checkpoint: checkpoint(p.saved) } : checkpoint(p.saved), loaded: checkpoint(p.loaded),
        selection: p.selection.map(row => ({ ...row,
          occupants: row.occupants.map(([id, hp, vehicle]) => ({ id, hp, vehicle })),
          checks: row.checks.map(([name, modifier, cleared, selected, preserved]) => ({ name, modifier, cleared, selected, preserved })),
        })), actions: p.publicActions.map(label => ({ label, phase: 'after' })) }
      const phase = { status: p.status, source: { commit: sourceCommit, fingerprint: sourceFingerprint },
        runtime, runtimeSha256, errors: [], sourceAfter, cleanupVerified,
        profile: { id: profileId, runId, previousRun: previousRunId && { runId: previousRunId },
          cleanupVerified, continuationVerified, checkpointAtStart: p.checkpointAtStart && { checkpointSha256: p.checkpointAtStart },
          checkpointAtEnd: { checkpointSha256: p.checkpointAtEnd } }, result }
      writeFileSync(resolve(output, dir, 'receipt.json'), json(phase))
      writeFileSync(resolve(output, dir, 'boat-checkpoint.json'), json(result))
      for (const name of mission10ExpectedArtifacts[p.mode].filter(name => name.endsWith('.png')))
        writeFileSync(resolve(output, dir, name), 'synthetic pixel bytes')
      return { mode: p.mode, receipt: `mission10-${p.mode}--receipt.json`, sourceReceipt: `${dir}/receipt.json`, receiptSha256: hash(resolve(output, dir, 'receipt.json')) }
    }) }
  writeFileSync(resolve(output, 'mission10-profile.json'), json(report))
  retainMission10Artifacts(output, report)
  return report
}
