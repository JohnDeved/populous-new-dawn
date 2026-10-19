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
  validateMission10Profile(receipt.mission10, expected.identity.mergeSha)
  return true
}


// Required companion, not a substitute for any of the nine recovery cases.
export function validateMission10Profile(value, mergeSha) {
  ensure(value?.status === 'passed' && value.sourceCommit === mergeSha &&
    isHash(value.sourceFingerprint) && isHash(value.runtimeSha256) && isHash(value.reportSha256),
    'Mission 10 source/runtime or report is missing')
  ensure(value.artifacts?.path === 'mission10-artifacts.json' && isHash(value.artifacts.sha256) &&
    Number.isSafeInteger(value.artifacts.bytes) && value.artifacts.bytes > 0, 'Mission 10 retained artifact manifest missing')
  ensure(Array.isArray(value.phases) && value.phases.length === 2, 'Mission 10 requires both browser processes')
  const party = [63, 111, 112, 113, 114], warriors = party.slice(1)
  const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)
  const [saved, loaded] = value.phases
  for (const [index, phase] of value.phases.entries()) {
    ensure(phase.mode === (index === 0 ? 'created' : 'reused') && phase.status === 'passed' &&
      phase.sourceCommit === mergeSha && phase.sourceFingerprint === value.sourceFingerprint &&
      phase.runtimeSha256 === value.runtimeSha256 && phase.runtimeMatchesHost === true && phase.sourceAfter === 'identical' &&
      phase.cleanupVerified === true && phase.continuationVerified === true &&
      isHash(phase.receiptSha256) && isHash(phase.resultSha256) && uuid(phase.profileId) && uuid(phase.runId),
      'Mission 10 phase source/runtime/cleanup is invalid')
    ensure(phase.saved?.level === 10 && Number.isInteger(phase.saved.turn) && phase.saved.turn > 0 &&
      Number.isFinite(phase.saved.time) && ['checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'].every(key => isHash(phase.saved[key])) &&
      phase.checkpointAtEnd === phase.saved.checkpointSha256, 'Mission 10 committed checkpoint is incomplete')
    ensure(phase.receiptName === `mission10-${phase.mode}--receipt.json` &&
      phase.resultName === `mission10-${phase.mode}--boat-checkpoint.json`, 'Mission 10 retained report paths differ')
    const names = index === 0 ? ['boarded'] : ['loaded', 'unloaded']
    ensure(Array.isArray(phase.selection) && same(phase.selection.map(row => row.phase), names), 'Mission 10 selection phases incomplete')
    for (const row of phase.selection) {
      const occupied = row.phase !== 'unloaded'
      ensure(row.occupied === occupied && Array.isArray(row.occupants) &&
        row.occupants.every(Array.isArray) && same(row.occupants.map(person => person[0]), party) &&
        row.occupants.every(person => person.length === 3 && Number.isFinite(person[1]) && person[1] > 0 && (occupied ? person[2] === 62 : !person[2])),
        'Mission 10 real occupancy/unload observation invalid')
      ensure(Array.isArray(row.checks) && row.checks.length === 6, 'Mission 10 public selection checks incomplete')
      for (const [at, check] of row.checks.entries()) {
        ensure(Array.isArray(check) && check.length === 5, 'Mission 10 control observation malformed')
        const [control, observedModifier, cleared, selected, preserved] = check
        const name = at < 3 ? 'Select warrior' : 'Select follower', modifier = ['single', 'Control', 'Shift'][at % 3]
        ensure(control === name && observedModifier === modifier && same(cleared, []) && preserved === true,
          'Mission 10 Escape/control/modifier/preservation evidence invalid')
        const expected = occupied || name === 'Select follower' && modifier === 'Control' ? party : warriors
        ensure(!occupied && modifier === 'single'
          ? Array.isArray(selected) && selected.length === 1 && warriors.includes(selected[0])
          : same(selected, expected), 'Mission 10 selected crew differs')
      }
    }
    const actions = index === 0 ? ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click']
      : ['public Load Game', 'ordinary Boat right-click inspection', 'public Unload all passengers']
    ensure(Array.isArray(phase.publicActions) && actions.every(action => phase.publicActions.filter(value => value === action).length === 1),
      'Mission 10 genuine public route actions missing')
    const namesExpected = index === 0 ? ['mission10-created--boarded-class-selected.png', 'mission10-created--saved-occupied-boat.png']
      : ['mission10-reused--loaded-class-selected.png', 'mission10-reused--unloaded-class-selected.png']
    ensure(Array.isArray(phase.screenshots) && same(phase.screenshots.map(row => row.name), namesExpected) &&
      phase.screenshots.every(row => isHash(row.sha256)), 'Mission 10 rendered evidence missing')
  }
  ensure(saved.checkpointAtStart === null && saved.previousRunId === null && saved.loaded === null &&
    loaded.profileId === saved.profileId && loaded.runId !== saved.runId && loaded.previousRunId === saved.runId &&
    loaded.checkpointAtStart === saved.checkpointAtEnd && same(loaded.saved, saved.saved),
    'Mission 10 process/profile/checkpoint continuation differs')
  ensure(loaded.loaded && ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256']
    .every(key => loaded.loaded[key] === saved.saved[key]), 'Mission 10 public Load boundary differs')
  return true
}
