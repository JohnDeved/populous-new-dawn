import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Evidence only. The trusted integration reader independently validates this
// envelope against the current Actions attempt and reviewed Git blobs.
export function recoveryReceipt(receipt, output, env = process.env) {
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  return {
    version: 1,
    kind: 'pause-recovery-browser',
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
        'scripts/tutorial-browser/recovery-receipt.mjs',
        'scripts/tutorial-browser/browser-config.mjs',
        'scripts/tutorial-browser/build-home.mjs',
        'scripts/tutorial-browser/fixture/main.tsx',
        'scripts/tutorial-browser/fixture/index.html',
        'scripts/local-render/original-pause-checkpoint-recovery.mjs',
        'scripts/local-render/checkpoint-observer.mjs',
        'scripts/browser-game.mjs',
        'scripts/browser-new-game.mjs',
        'app/original-pause-menu.tsx',
        'app/page.tsx',
        'app/game-store.ts',
        'package-lock.json',
      ].map(path => [path, receipt.source.files[path]])
    ),
    receiptSha256: hash(resolve(output, 'receipt.json')),
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
    checks: receipt.pauseCheckpointRecovery?.checks,
    screenshots: receipt.pauseCheckpointRecovery?.screenshots.map(s => ({
      ...s,
      sha256: hash(resolve(output, s.name)),
    })),
  }
}

export function recoveryReceiptLog(receipt) {
  const json = JSON.stringify(receipt)
  if (Buffer.byteLength(json) > 12000) throw Error('Recovery receipt exceeds bounded log envelope')
  return `PND_PAUSE_RECOVERY_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_PAUSE_RECOVERY_SHA256=${createHash('sha256').update(json).digest('hex')}`
}
