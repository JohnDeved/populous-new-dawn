// Trusted read-only policy: never import this module from candidate Git source.
import { createHash } from 'node:crypto'
const ensure = (value, message) => {
  if (!value) throw Error(`Pause recovery: ${message}`)
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const hash = value => createHash('sha256').update(value).digest('hex')
const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
export const RECOVERY_JOB = 'Pause checkpoint recovery browser'
export const RECOVERY_STEPS = [
  'Require a ready pull request',
  'Check out exact proposed merge',
  'Set up Node',
  'Install locked dependencies and verify supported Chrome',
  'Record exact tested source',
  'Build plain production Home and validate pause checkpoint recovery',
  'Reject tracked input mutation',
  'Retain bounded validation receipts and screenshots',
]
export const RECOVERY_INPUTS = [
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
]
export const RECOVERY_CHECKS = [
  'checkpoint created and persisted by ordinary Save Game UI',
  'native held Escape cancels each subpanel once without resuming; a fresh press resumes',
  'frontend Retry preserves keyboard focus through Enter repeats/release and successful lookup',
  'frontend Retry preserves keyboard focus through Space repeats/release and successful lookup',
  'frontend Retry preserves keyboard focus through Enter repeats/release and late Options completion',
  'retry ignores held/repeated activation, freezes world and clock, and cannot steal focus or navigate from Save',
  'only explicit Load checkpoint replaces the world with the persisted checkpoint',
  'empty retry restores usable root focus when completion occurs in Load panel',
  'empty retry restores usable root focus when completion occurs in root',
]
export const RECOVERY_SCREENSHOTS = [
  ['frontend-retry-enter.png', 800, 600, 1],
  ['frontend-retry-space.png', 800, 600, 1],
  ['frontend-retry-enter-options.png', 800, 600, 1],
  ['failed-root-640x480.png', 640, 480, 1],
  ['failed-root-1920x1080.png', 1920, 1080, 1],
  ['failed-load-640x480.png', 640, 480, 1],
  ['failed-load-1920x1080.png', 1920, 1080, 1],
  ['failed-load-800x450.png', 800, 450, 1],
  ['pending-load.png', 800, 450, 1],
  ['recovered-load-640x480.png', 640, 480, 1],
  ['empty-failed-dpr2-panel.png', 800, 450, 2],
  ['empty-load-dpr2.png', 800, 450, 2],
  ['empty-failed-dpr2-root.png', 800, 450, 2],
]
export function pauseRecoveryLog(log) {
  const lines = log
    .split('\n')
    .map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
    .filter(line => line.startsWith('PND_PAUSE_RECOVERY_'))
  ensure(
    lines.length === 2 &&
      /^PND_PAUSE_RECOVERY_RECEIPT=[A-Za-z0-9+/=]+$/.test(lines[0]) &&
      /^PND_PAUSE_RECOVERY_SHA256=[a-f0-9]{64}$/.test(lines[1]),
    'missing or duplicate receipt'
  )
  const encoded = lines[0].slice('PND_PAUSE_RECOVERY_RECEIPT='.length)
  ensure(encoded.length <= 16000, 'receipt exceeds size bound')
  const bytes = Buffer.from(encoded, 'base64')
  ensure(
    bytes.length <= 12000 &&
      bytes.toString('base64') === encoded &&
      hash(bytes) === lines[1].slice('PND_PAUSE_RECOVERY_SHA256='.length),
    'receipt checksum/encoding differs'
  )
  return JSON.parse(bytes.toString('utf8'))
}
export function validatePauseRecovery(receipt, expected) {
  ensure(
    receipt?.version === 1 &&
      receipt.kind === 'pause-recovery-browser' &&
      receipt.status === 'passed' &&
      receipt.selectedScenario === 'pause-checkpoint-recovery',
    'scenario did not pass'
  )
  ensure(same(receipt.identity, expected.identity), 'run/attempt/source identity differs')
  ensure(
    same(Object.keys(receipt.inputs ?? {}), RECOVERY_INPUTS) &&
      same(receipt.inputs, expected.inputs) &&
      Object.values(receipt.inputs).every(isHash),
    'Git input hashes differ'
  )
  ensure(isHash(receipt.receiptSha256), 'raw receipt hash missing')
  ensure(
    receipt.build?.exitCode === 0 &&
      receipt.build.signal === null &&
      receipt.build.timedOut === false &&
      receipt.build.capMs === 120000 &&
      receipt.browserTimedOut === false &&
      receipt.browserCapMs === 180000,
    'build/browser deadline failure'
  )
  ensure(
    receipt.sourceAfter === 'identical' &&
      receipt.cleanupVerified === true &&
      same(receipt.errors, []) &&
      same(receipt.dependencyChanges, []) &&
      isHash(receipt.dependenciesBeforeSha256) &&
      receipt.dependenciesBeforeSha256 === receipt.dependenciesAfterSha256,
    'runtime/source/cleanup failure'
  )
  ensure(
    receipt.browserPath === '/opt/google/chrome/chrome' &&
      same(receipt.launch, {
        channel: 'chrome',
        headless: true,
        chromiumSandbox: true,
        ignoreDefaultArgs: true,
        args: ['--headless', '--remote-debugging-pipe'],
        timeout: 30000,
      }),
    'official sandboxed Chrome required'
  )
  ensure(same(receipt.checks, RECOVERY_CHECKS), 'assertion inventory incomplete')
  ensure(
    Array.isArray(receipt.screenshots) &&
      same(
        receipt.screenshots.map(s => [s.name, s.viewport?.width, s.viewport?.height, s.dpr]),
        RECOVERY_SCREENSHOTS
      ) &&
      receipt.screenshots.every(s => isHash(s.sha256)),
    'visual evidence inventory incomplete'
  )
  return true
}
