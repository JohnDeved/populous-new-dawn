import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { hostname, tmpdir } from 'node:os'
import { isDeepStrictEqual } from 'node:util'
import { activeBudget, requireActiveBudget } from './observation.mjs'
const kind = 'mission3-recovered-sermon-erosion-continuation'
const priorRunId = '1c430e41-9aca-4a05-bb45-7bd8076ffffd'
const driver = fs.readFileSync(new URL('./driver.mjs', import.meta.url), 'utf8')
const between = (start, end) => driver.slice(driver.indexOf(start), driver.indexOf(end, driver.indexOf(start)))

test('actual entry uses the exact new harness history and fixed prior conversion budget without live milestone credit', () => {
  const run = Function('sermonRecord', 'receipt', 'activeBudget', `
    const ids = {}, milestones = [], failures = [], controlStops = []; let inheritedActiveSeconds, inheritedBudget = null;
    ${between('    const priorHistory =', '    victimSelection = sermonRecord.firstOwned')}
    return { inheritedActiveSeconds, inheritedBudget, milestones, failures, controlStops };
  `)
  const history = { activeSeconds: 980.0833333333333, failures: [{ index: 29 }, { index: 48 }, { index: 1 }],
    controlStops: [{ code: 'preserve-latest' }, { code: 'progress-stall' }], priorMilestones: [{ name: 'conversion', activeSeconds: 452.8333333333334 }] }
  const budget = { priorConversionActiveSeconds: 452.8333333333334, cumulativeActiveCeiling: 2252.8333333333335 }
  const record = { kind, ids: {}, milestones: [{ name: 'sermon-saved' }], activeSeconds: 407.75, failures: [],
    erosionContinuation: { history: { activeSeconds: 0 }, budget: { cumulativeActiveCeiling: 999999 } } }
  const result = run(record, { profile: { erosionContinuation: { history, budget } } }, activeBudget)
  assert.equal(result.inheritedActiveSeconds, history.activeSeconds)
  assert.deepEqual(result.inheritedBudget, budget); assert.equal(result.failures.length, 3)
  assert.equal(result.controlStops[1].code, 'progress-stall')
  assert.deepEqual(result.milestones.map(m => m.name), ['sermon-saved'])
  for (const olderKind of ['mission3-ui-sermon', 'mission3-recovered-ui-sermon']) {
    const ordinary = run({ ...record, kind: olderKind }, { profile: { erosionContinuation: { history, budget } } }, activeBudget)
    assert.equal(ordinary.inheritedActiveSeconds, 407.75); assert.equal(ordinary.inheritedBudget, null)
  }
})

test('actual lease appends one reviewed erosion claim and keeps both old claims through normal finish', () => {
  const root = fs.mkdtempSync(path.resolve(tmpdir(), 'erosion-claim-'))
  try {
    execFileSync('git', ['init', root], { stdio: 'pipe' }); fs.writeFileSync(path.resolve(root, '.gitignore'), '/work/\n')
    const profilePath = path.resolve(root, 'work/local-render-profiles/recovered'), output = path.resolve(root, 'work/proof')
    fs.mkdirSync(path.resolve(profilePath, 'browser'), { recursive: true, mode: 0o700 }); fs.mkdirSync(output)
    const binding = { root, origin: 'http://127.0.0.1:4366', application: 'old', runtime: { harness: 'old' } }
    const manifest = { version: 1, purpose: 'populous-local-render-game-only', id: 'c1f1d915-d99a-4c47-be2a-2ad36d89fc86', path: profilePath, binding,
      lastRun: { runId: priorRunId, cleanupVerified: true, continuationVerified: true, checkpointAtEnd: { turn: 4813 } },
      recoveryAdmission: { sha256: 'original' }, recoveryClaim: { runId: '5451f1a6-088f-4dac-94c9-b0f2cc869fd2' },
      gameplayContinuationClaim: { runId: priorRunId, priorRunId: '5451f1a6-088f-4dac-94c9-b0f2cc869fd2' } }
    const marker = path.resolve(profilePath, 'populous-profile.json'); fs.writeFileSync(marker, JSON.stringify(manifest), { mode: 0o600 })
    const continuation = { reference: { sha256: 'new' }, recoveryAdmission: { reference: manifest.recoveryAdmission },
      recoveryClaim: manifest.recoveryClaim, gameplayContinuationClaim: manifest.gameplayContinuationClaim }
    const source = fs.readFileSync(new URL('../../scripts/local-render/owned-profile.mjs', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replaceAll('export ', '')
    let checked = 0
    const deps = { execFileSync, createHash, randomUUID, ...fs, ...path, hostname, isDeepStrictEqual,
      readRecoveryAdmission: () => { throw Error('Old recovery cannot be replayed') },
      readGameplayContinuation: () => { throw Error('Old successor cannot be replayed') },
      readErosionContinuation: (_, context, actual) => { checked++; assert.deepEqual(actual, manifest); return structuredClone(continuation) } }
    delete deps.default
    const acquire = Function(...Object.keys(deps), source + '\nreturn acquireProfile;')(...Object.values(deps))
    const args = { root, path: profilePath, output, origin: binding.origin, source: { commit: 'new', fingerprint: 'new' },
      inputs: { application: 'new', checker: 'new' }, runtime: { harness: 'new' }, correspondence: '/reviewed' }
    assert.throws(() => acquire({ ...args, correspondence: undefined }), /already claimed/)
    const lease = acquire(args), claimed = JSON.parse(fs.readFileSync(marker))
    assert.equal(checked, 1)
    for (const key of ['recoveryAdmission', 'recoveryClaim', 'gameplayContinuationClaim', 'lastRun']) assert.deepEqual(claimed[key], manifest[key])
    assert.equal(claimed.erosionContinuationClaim.priorRunId, priorRunId)
    assert.equal(claimed.erosionContinuationClaim.runId, lease.profile.runId)
    assert.deepEqual(claimed.erosionContinuationClaim.previousBinding, binding)
    assert.throws(() => acquire(args), /already claimed/)
    const receipt = { status: 'failed', profile: { ...lease.profile, continuationVerified: true, checkpointAtEnd: { turn: 4813 } } }
    fs.writeFileSync(path.resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); lease.finish(receipt, true)
    assert.equal(fs.existsSync(path.resolve(profilePath, 'owner.lock')), false)
    const finished = JSON.parse(fs.readFileSync(marker))
    for (const key of ['recoveryAdmission', 'recoveryClaim', 'gameplayContinuationClaim', 'erosionContinuationClaim']) assert.deepEqual(finished[key], claimed[key])
    assert.throws(() => acquire(args), /already claimed/)
    delete finished.erosionContinuationClaim
    fs.writeFileSync(marker, JSON.stringify(finished), { mode: 0o600 })
    assert.throws(() => acquire(args), /Expected values|deep-equal|strictly deep-equal/, 'Deleting the new claim cannot restore the exact predecessor')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('actual health and wait budget anchor remains fixed before and after fresh conversion', () => {
  const anchor = between('  const conversionBudgetAnchor =', '  const health =')
  const health = between('  const health =', '  const currentActive =')
  const run = Function('inheritedBudget', 'milestones', 'active', 'assert', 'requireActiveBudget', `
    const requireNotDefeated = () => {}, currentActive = () => active;
    ${anchor}
    ${health}
    health({ level: 3, speed: 1, contextLost: false, status: 'playing', observation: { errors: [], speedViolations: [] } });
    return conversionBudgetAnchor();
  `)
  const inherited = { priorConversionActiveSeconds: 452.8333333333334 }
  for (const milestones of [[], [{ name: 'conversion', activeSeconds: 1100 }]]) {
    assert.equal(run(inherited, milestones, 980.0833333333333, assert, requireActiveBudget), inherited.priorConversionActiveSeconds)
    assert.throws(() => run(inherited, milestones, 2252.8333333333335, assert, requireActiveBudget), /resource envelope/)
  }
  assert.throws(() => run(null, [], 980, assert, requireActiveBudget), /resource envelope/)
  const waitBlock = between('      const active = currentActive(s)', '      const next = objectiveProgress')
  const waitBudget = Function('conversionBudgetAnchor', 'activeBudget', `const s = {}, currentActive = () => 980; ${waitBlock}; return budget;`)
  assert.equal(waitBudget(() => 452.8333333333334, activeBudget), 2252.8333333333335)
})
