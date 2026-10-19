import assert from 'node:assert/strict'
import { mission10ProfileReceipt } from './mission10-profile-receipt.mjs'
import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Evidence only. The trusted integration reader independently validates this
// envelope against the current Actions attempt and reviewed Git blobs.
export function profileRecoveryReceipt(receipt, output, env = process.env) {
  const result = receipt.profileRecovery
  assert.ok(
    result?.status === 'passed' &&
      Array.isArray(result?.cases) &&
      Array.isArray(result?.screenshots),
    'Successful profile scenario must provide cases'
  )
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  return {
    version: 1,
    kind: 'profile-recovery-browser',
    status: receipt.status,
    identity: {
      repository: env.GITHUB_REPOSITORY,
      runId: env.GITHUB_RUN_ID,
      runAttempt: env.GITHUB_RUN_ATTEMPT,
      workflowRef: env.GITHUB_WORKFLOW_REF,
      mergeSha: receipt.source.commit,
      headSha: env.PR_HEAD_SHA,
      baseSha: env.PR_BASE_SHA,
    },
    inputs: Object.fromEntries(
      [
        'scripts/tutorial-browser/run.mjs',
        'scripts/tutorial-browser/profile-recovery-receipt.mjs',
        'scripts/tutorial-browser/profile-readiness.mjs',
        'scripts/tutorial-browser/browser-config.mjs',
        'scripts/tutorial-browser/build-home.mjs',
        'scripts/tutorial-browser/fixture/main.tsx',
        'scripts/tutorial-browser/fixture/index.html',
        'scripts/local-render/campaign-profile-recovery.mjs',
        'scripts/local-render/original-pause-checkpoint-recovery.mjs',
        'scripts/local-render/checkpoint-observer.mjs',
        'scripts/campaign-start-readiness.mjs',
        'scripts/local-render/harness.mjs',
        'scripts/local-render/vite.config.mjs',
        'scripts/local-render/owned-profile.mjs',
        'scripts/browser-game.mjs',
        'scripts/browser-new-game.mjs',
        'scripts/checkpoint-readback.mjs',
        'app/original-pause-menu.tsx',
        'app/page.tsx',
        'app/game-store.ts',
        'package-lock.json',
        'scripts/tutorial-browser/mission10-profile.mjs',
        'scripts/tutorial-browser/mission10-artifacts.mjs',
        'scripts/tutorial-browser/mission10-input.mjs',
        'scripts/tutorial-browser/mission10-profile-receipt.mjs',
        'scripts/tutorial-browser/checkpoint-codec.mjs',
        'scripts/local-render/mission10-boat-checkpoint.mjs',
        'scripts/local-render/mission1-vault-input.mjs',
        'qa/erosion-ordinary/input.mjs',
        'qa/erosion-ordinary/minimap-input.mjs',
        'app/minimap.ts',
        'app/world-coordinates.ts',
        'app/native-math.ts',
        'app/original-rules.json',
        'app/live-command.ts',
        'app/world-terrain-runtime.ts',
        'app/selection-runtime.ts',
        'app/hud-selection.ts',
        'app/hud-person-source.ts',
      ].map(path => [path, receipt.source.files[path]])
    ),
    receiptSha256: hash(resolve(output, 'receipt.json')),
    mission10: mission10ProfileReceipt(receipt, output),
    selectedScenario: receipt.selectedScenario,
    build: receipt.build,
    sourceAfter: receipt.sourceAfter,
    cleanupVerified: receipt.cleanupVerified,
    errors: receipt.errors,
    dependencyChanges: receipt.dependencyChanges,
    dependenciesBeforeSha256: receipt.dependenciesBeforeSha256,
    dependenciesAfterSha256: receipt.dependenciesAfterSha256,
    browserCapMs: receipt.browserCapMs,
    browserTimedOut: receipt.browserTimedOut ?? false,
    browserPath: receipt.browserPath,
    launch: receipt.launch,
    scenarioStatus: result.status,
    runtimeUnchanged:
      !!result.runtime &&
      !!result.runtimeAfter &&
      isDeepStrictEqual(result.runtime, result.runtimeAfter),
    cases: result.cases.map(({ kind, status, fixture }) => ({ kind, status, fixture })),
    screenshots: result.screenshots.map(s => ({
      ...s,
      sha256: hash(resolve(output, s.name)),
    })),
  }
}

export function profileRecoveryReceiptLog(receipt) {
  const json = JSON.stringify(receipt)
  if (Buffer.byteLength(json) > 12000) throw Error('Recovery receipt exceeds bounded log envelope')
  return `PND_PROFILE_RECOVERY_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_PROFILE_RECOVERY_SHA256=${createHash('sha256').update(json).digest('hex')}`
}
