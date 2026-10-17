// Trusted read-only policy: never import this module from candidate Git source.
import { createHash } from 'node:crypto'
const ensure = (value, message) => {
  if (!value) throw Error(`Profile recovery: ${message}`)
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const hash = value => createHash('sha256').update(value).digest('hex')
const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
export const PROFILE_JOB = 'Profile recovery browser'
export const PROFILE_STEPS = [
  'Require a ready pull request',
  'Check out exact proposed merge',
  'Set up Node',
  'Install locked dependencies and verify supported Chrome',
  'Record exact tested source',
  'Build plain production Home and validate IndexedDB recovery',
  'Reject tracked input mutation',
  'Retain bounded validation receipts and screenshots',
]
export const PROFILE_INPUTS = [
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
]
export const PROFILE_CASES = [
  ['empty', 'passed', true],
  ['missing', 'passed', true],
  ['malformed', 'passed', true],
  ['partially-migratable', 'passed', true],
  ['incompatible', 'passed', true],
  ['current', 'passed', true],
  ['legacy', 'passed', true],
  ['ordinary-save-fresh-load', 'passed', false],
  ['usable-session-checkpoint', 'passed', true],
]
export const PROFILE_SCREENSHOTS = [
  ['malformed-profile-selector.png', 1440, 1000, 1],
  ['ordinary-fresh-load.png', 1440, 1000, 1],
]
export function profileRecoveryLog(log) {
  const lines = log
    .split('\n')
    .map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
    .filter(line => line.startsWith('PND_PROFILE_RECOVERY_'))
  ensure(
    lines.length === 2 &&
      /^PND_PROFILE_RECOVERY_RECEIPT=[A-Za-z0-9+/=]+$/.test(lines[0]) &&
      /^PND_PROFILE_RECOVERY_SHA256=[a-f0-9]{64}$/.test(lines[1]),
    'missing or duplicate receipt'
  )
  const encoded = lines[0].slice('PND_PROFILE_RECOVERY_RECEIPT='.length)
  ensure(encoded.length <= 16000, 'receipt exceeds size bound')
  const bytes = Buffer.from(encoded, 'base64')
  ensure(
    bytes.length <= 12000 &&
      bytes.toString('base64') === encoded &&
      hash(bytes) === lines[1].slice('PND_PROFILE_RECOVERY_SHA256='.length),
    'receipt checksum/encoding differs'
  )
  return JSON.parse(bytes.toString('utf8'))
}
export function validateProfileRecovery(receipt, expected) {
  ensure(
    receipt?.version === 1 &&
      receipt.kind === 'profile-recovery-browser' &&
      receipt.status === 'passed' &&
      receipt.selectedScenario === 'profile-recovery',
    'scenario did not pass'
  )
  ensure(same(receipt.identity, expected.identity), 'run/attempt/source identity differs')
  ensure(
    same(Object.keys(receipt.inputs ?? {}), PROFILE_INPUTS) &&
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
  ensure(
    receipt.scenarioStatus === 'passed' &&
      receipt.runtimeUnchanged === true &&
      Array.isArray(receipt.cases) &&
      same(
        receipt.cases.map(c => [c.kind, c.status, c.fixture]),
        PROFILE_CASES
      ),
    'case inventory or runtime integrity incomplete'
  )
  ensure(
    Array.isArray(receipt.screenshots) &&
      same(
        receipt.screenshots.map(s => [s.name, s.viewport?.width, s.viewport?.height, s.dpr]),
        PROFILE_SCREENSHOTS
      ) &&
      receipt.screenshots.every(s => isHash(s.sha256)),
    'visual evidence inventory incomplete'
  )
  return true
}
