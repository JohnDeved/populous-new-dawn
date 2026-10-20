import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { runProfileEpisode } from '../scripts/tutorial-browser/profile-episodes.mjs'
import { browserCapMs, profileSplitBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { profileCasesReceipt, profileCasesReceiptLog } from '../scripts/tutorial-browser/profile-recovery-receipt.mjs'
import { mission10CrewReceipt, mission10CrewReceiptLog } from '../scripts/tutorial-browser/mission10-crew-receipt.mjs'
import { PROFILE_INPUTS, PROFILE_CASES, PROFILE_SCREENSHOTS, profileCasesLog, validateProfileCases, validateProfileRecovery } from '../scripts/integration-queue/profile-recovery.mjs'
import { MISSION10_JOB, mission10CrewLog, validateMission10Crew, validateMission10Resumption } from '../scripts/integration-queue/mission10-recovery.mjs'
import { mission10ArtifactUpload, profileArtifactUpload, resolveMission10Artifact, resolveProfileArtifact, validateProfileArtifactMetadata } from '../scripts/integration-queue/profile-artifact.mjs'
import { SPLIT_BROWSER_JOBS, validateSplitBrowserJobs } from '../scripts/integration-queue/browser-jobs.mjs'
import { GATES, SPLIT_PROFILE_BROWSER_GATE, gatesFor, validateEntry, reviewedWorkflows, validatePassedGate } from '../scripts/integration-queue/policy.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'
import { artifactZip } from './support/artifact-zip.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex'), oid = n => String(n).repeat(40), h = 'a'.repeat(64)
const env = { GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn', GITHUB_RUN_ID: '100', GITHUB_RUN_ATTEMPT: '2',
  GITHUB_WORKFLOW_REF: 'JohnDeved/populous-new-dawn/.github/workflows/tutorial-browser.yml@refs/pull/647/merge', PR_HEAD_SHA: oid(2), PR_BASE_SHA: oid(3) }
function fixture(scenario) {
  const dir = mkdtempSync(join(tmpdir(), 'split-profile-'))
  const inputs = Object.fromEntries(PROFILE_INPUTS.map(path => [path, hash(path)]))
  const host = { status: 'passed', selectedScenario: scenario, source: { commit: oid(1), files: inputs },
    github: { head: oid(2), base: oid(3), merge: oid(1), runId: '100', runAttempt: '2' },
    browserSha256: h, browserVersion: 'Chrome', node: process.version, buildPackageVersions: {},
    browserPath: '/opt/google/chrome/chrome', launch: { channel: 'chrome', headless: true, chromiumSandbox: true,
      ignoreDefaultArgs: true, args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 },
    build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 }, browserCapMs: 180000,
    sourceAfter: 'identical', cleanupVerified: true, errors: [], dependencyChanges: [], dependenciesBeforeSha256: h, dependenciesAfterSha256: h }
  if (scenario === 'profile-recovery') {
    host.profileRecovery = { status: 'passed', runtime: {}, runtimeAfter: {},
      cases: PROFILE_CASES.map(([kind, status, fixture]) => ({ kind, status, fixture })),
      screenshots: PROFILE_SCREENSHOTS.map(([name, width, height, dpr]) => ({ name, viewport: { width, height }, dpr })) }
    for (const shot of host.profileRecovery.screenshots) writeFileSync(join(dir, shot.name), 'synthetic pixels')
    writeFileSync(join(dir, 'profile-recovery.json'), JSON.stringify(host.profileRecovery))
  } else host.mission10Profile = writeMission10Fixture(dir, host)
  writeFileSync(join(dir, 'receipt.json'), JSON.stringify(host))
  const receipt = scenario === 'profile-recovery' ? profileCasesReceipt(host, dir, env) : mission10CrewReceipt(host, dir, env)
  const files = readdirSync(dir).filter(name => statSync(join(dir, name)).isFile()).map(name => [name, readFileSync(join(dir, name))])
  rmSync(dir, { recursive: true, force: true })
  const archive = artifactZip(files, { compress: true }), upload = { id: 200, name: `mission10-crew-persistence-browser-${oid(1)}`, bytes: archive.length, sha256: hash(archive) }
  const url = 'https://api.github.com/repos/JohnDeved/populous-new-dawn/actions/artifacts/200'
  const metadata = { id: 200, name: upload.name, expired: false, size_in_bytes: archive.length, digest: `sha256:${upload.sha256}`,
    url, archive_download_url: `${url}/zip`, workflow_run: { id: 100, head_sha: oid(2) } }
  const uploadLog = `SHA256 digest of uploaded artifact zip is ${upload.sha256}\nArtifact ${upload.name}.zip successfully finalized. Artifact ID ${upload.id}\nArtifact ${upload.name} has been successfully uploaded! Final size is ${upload.bytes} bytes. Artifact ID is ${upload.id}`
  return { host, receipt, expected: { identity: receipt.identity, inputs }, files, archive, upload, metadata, uploadLog }
}
function completeJobs() {
  return SPLIT_BROWSER_JOBS.map(([, name, , buildStep], index) => ({ id: 200 + index, name, run_id: 100, run_attempt: 2,
    status: 'completed', conclusion: 'success', check_run_url: `https://api.github.com/repos/JohnDeved/populous-new-dawn/check-runs/${300 + index}`,
    steps: ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
      'Install locked dependencies and verify supported Chrome', 'Record exact tested source', buildStep,
      'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots'].map(name => ({ name, conclusion: 'success' })) }))
}
function entry() {
  return { version: 1, repo: env.GITHUB_REPOSITORY, pr: 647, baseRef: 'main', sourceHead: oid(2), sourceTree: oid(4), reviewBase: oid(3),
    approvedBy: 'parent', allowMechanicalRefresh: false, requireBrowser: true, browserPolicy: 'profile-split-v1',
    review: { reviewer: 'independent', decision: 'ACCEPT', head: oid(2), base: oid(3), sha256: h, file: '/review' },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])), deployment: { kind: 'unverified', reason: 'fixture' } }
}
test('parsed eight-job matrix explicitly spends two independent180s allowances without changing other caps or permissions', () => {
  const workflow = yaml.load(readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8'))
  const items = workflow.jobs['tutorial-browser'].strategy.matrix.include
  assert.deepEqual(items.map(x => [x.scenario, x.name, x.artifact, x.buildStep, x.timeoutMinutes]), SPLIT_BROWSER_JOBS)
  assert.deepEqual(workflow.on.pull_request.types, ['ready_for_review'])
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.equal(workflow.jobs['tutorial-browser']['runs-on'], 'ubuntu-24.04')
  assert.equal(new Set(items.map(x => x.artifact)).size, 8)
  assert.deepEqual(profileSplitBudget, { version: 1, recoveryMs: 180000, mission10Ms: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })
  assert.equal(browserCapMs('profile-recovery'), profileSplitBudget.recoveryMs)
  assert.equal(browserCapMs('mission10-profile'), profileSplitBudget.mission10Ms)
  assert.equal(validateSplitBrowserJobs(completeJobs(), { id: 100, run_attempt: 2 }), true)
  for (const mutate of [j => j.pop(), j => j.push(j[0]), j => { j[0].name = 'unknown' }, j => { j[0].id = j[1].id },
    j => { j[1].conclusion = 'skipped' }, j => { j[2].run_attempt-- }, j => { j[3].run_id-- }, j => { j[4].steps.pop() },
    j => { j[5].steps[0].conclusion = 'failure' }, j => { j[6].status = 'in_progress' }]) {
    const jobs = completeJobs(); mutate(jobs); assert.throws(() => validateSplitBrowserJobs(jobs, { id: 100, run_attempt: 2 }))
  }
})
test('actual episode dispatcher never combines scenarios or resets the supplied deadline', async () => {
  const calls = [], signal = new AbortController().signal, deadlineAt = 123456789
  const options = { signal, deadlineAt, runRecovery: async () => { calls.push('recovery'); return { cases: 9 } },
    closeProbe: async () => { calls.push('closed') }, runMission10: async args => { calls.push('M10'); assert.equal(args.signal, signal); assert.equal(args.deadlineAt, deadlineAt); return { phases: 2 } } }
  assert.deepEqual(await runProfileEpisode('profile-recovery', options), { profileRecovery: { cases: 9 } }); assert.deepEqual(calls, ['recovery'])
  calls.length = 0
  assert.deepEqual(await runProfileEpisode('mission10-profile', options), { mission10Profile: { phases: 2 } }); assert.deepEqual(calls, ['closed', 'M10'])
  for (const step of ['closeProbe', 'runMission10', 'runRecovery']) {
    const bad = { ...options, [step]: async () => { throw Error(step) } }
    await assert.rejects(runProfileEpisode(step === 'runRecovery' ? 'profile-recovery' : 'mission10-profile', bad), new RegExp(step))
  }
  const aborted = new AbortController(); aborted.abort(Error('deadline')); calls.length = 0
  await assert.rejects(runProfileEpisode('mission10-profile', { ...options, signal: aborted.signal }), /deadline/); assert.deepEqual(calls, [])
  const duringClose = new AbortController(); calls.length = 0
  await assert.rejects(runProfileEpisode('mission10-profile', { ...options, signal: duringClose.signal,
    closeProbe: async () => duringClose.abort(Error('deadline')) }), /deadline/); assert.deepEqual(calls, [])
  await assert.rejects(runProfileEpisode('unknown', options), /Unknown/)
})
test('independent recovery receipt retains all nine cases and cannot stand in for M10 or old composite admission', () => {
  const f = fixture('profile-recovery'), encoded = profileCasesReceiptLog(f.receipt)
  assert.equal(validateProfileCases(profileCasesLog(encoded), f.expected), true)
  assert.equal(f.receipt.cases.length, 9); assert.equal(f.receipt.mission10, undefined)
  assert.ok(Buffer.byteLength(JSON.stringify(f.receipt)) < 12000)
  assert.throws(() => validateProfileRecovery(f.receipt, f.expected))
  assert.throws(() => mission10CrewLog(encoded))
  assert.throws(() => profileCasesLog(encoded.replaceAll('PND_PROFILE_CASES_', 'PND_PROFILE_RECOVERY_')))
  for (const mutate of [r => r.cases.pop(), r => r.screenshots.pop(), r => { r.runtimeUnchanged = false },
    r => { r.browserCapMs = 360000 }, r => { r.mission10 = {} }, r => { r.cleanupVerified = false }, r => { r.identity.runAttempt = '1' }]) {
    const receipt = structuredClone(f.receipt); mutate(receipt); assert.throws(() => validateProfileCases(receipt, f.expected))
  }
})
test('standalone M10 binds its own real ZIP, exact source/attempt and all18 controls plus final resumption', () => {
  const f = fixture('mission10-profile'), encoded = mission10CrewReceiptLog(f.receipt)
  assert.deepEqual(mission10ArtifactUpload(f.uploadLog, oid(1)), f.upload)
  assert.throws(() => profileArtifactUpload(f.uploadLog, oid(1)))
  validateProfileArtifactMetadata(f.metadata, f.upload, f.expected.identity)
  const raw = resolveMission10Artifact(f.archive, f.upload, f.receipt)
  f.expected.mission10Evidence = raw
  assert.equal(validateMission10Crew(mission10CrewLog(encoded), f.expected), true)
  assert.equal(raw.flatMap(p => p.selection).reduce((n, s) => n + s.checks.length, 0), 18)
  assert.ok(Buffer.byteLength(JSON.stringify(f.receipt)) < 12000)
  assert.throws(() => validateProfileCases(f.receipt, f.expected))
  assert.throws(() => resolveProfileArtifact(f.archive, f.upload, f.receipt))
  for (const mutate of [r => { r.status = 'failed' }, r => { r.selectedScenario = 'profile-recovery' }, r => { r.cases = [] },
    r => { r.mission10.phases[1].checkpointAtEnd = 'b'.repeat(64) }, r => r.mission10.phases[1].screenshots.pop(),
    r => { r.mission10.phases[1].continuationVerified = false; r.mission10.phases[1].binding[7] = false },
    r => { r.browserTimedOut = true }, r => { r.browserCapMs = 360000 }, r => { r.identity.baseSha = oid(9) }]) {
    const receipt = structuredClone(f.receipt); mutate(receipt); assert.throws(() => validateMission10Crew(receipt, f.expected))
  }
  for (const mutate of [p => p[1].selection[1].checks.pop(), p => { p[1].status = 'failed' },
    p => { p[1].actions = p[1].actions.filter(a => !(a.label === 'Resume game' && a.phase === 'after')) },
    p => { p[1].observations = p[1].observations.filter(o => o.label !== 'unloaded-before-strip') }]) {
    const raw = structuredClone(f.expected.mission10Evidence); mutate(raw)
    assert.throws(() => validateMission10Crew(f.receipt, { ...f.expected, mission10Evidence: raw }))
  }
  const wrongFiles = [...f.files, ['profile-recovery.json', '{}']], archive = artifactZip(wrongFiles, { compress: true })
  assert.throws(() => resolveMission10Artifact(archive, { ...f.upload, bytes: archive.length, sha256: hash(archive) }, f.receipt))
  for (const missing of ['mission10-reused--unloaded-class-selected.png', 'mission10-artifacts.json', 'receipt.json']) {
    const archive = artifactZip(f.files.filter(([name]) => name !== missing), { compress: true })
    assert.throws(() => resolveMission10Artifact(archive, { ...f.upload, bytes: archive.length, sha256: hash(archive) }, f.receipt))
  }
  const wrong = structuredClone(f.metadata); wrong.workflow_run.id++
  assert.throws(() => validateProfileArtifactMetadata(wrong, f.upload, f.expected.identity))
})
test('new split policy retains pinned workflow transition and rejects one-job-only acceptance', () => {
  const e = entry(); assert.equal(gatesFor(e)[1], SPLIT_PROFILE_BROWSER_GATE); validateEntry(e)
  e.browserWorkflowTransition = { version: 1, workflow: GATES[1].workflow, sourceHead: e.sourceHead, base: e.reviewBase, baseSha256: 'b'.repeat(64), candidateSha256: h }
  validateEntry(e)
  const workflows = [{ path: GATES[0].workflow, ref: e.reviewBase, sha256: h },
    ...[e.reviewBase, e.sourceHead, oid(1)].map((ref, index) => ({ path: GATES[1].workflow, ref, sha256: index ? h : 'b'.repeat(64) }))]
  assert.equal(reviewedWorkflows(e, { head: e.sourceHead, base: e.reviewBase, synthetic: { sha: oid(1) }, workflows }), true)
  for (const mutate of [v => { v.allowMechanicalRefresh = true }, v => { v.browserWorkflowTransition.base = oid(8) }, v => { v.browserWorkflowTransition.candidateSha256 = 'c'.repeat(64) }]) {
    const bad = structuredClone(e); mutate(bad); assert.throws(() => validateEntry(bad))
  }
  const latest = { conclusion: 'success', event: 'pull_request', identityVerified: true, base: oid(3), merge: oid(1),
    job: 'Tutorial browser', jobConclusion: 'success', app: 'github-actions', appId: 15368, id: 100, attempt: 2,
    pauseRecoveryVerified: true, pauseRecoveryCheckId: 303, profileRecoveryVerified: true, profileRecoveryCheckId: 304,
    mission10Verified: true, mission10CheckId: 305, checkId: 300, steps: GATES[1].steps.map(name => ({ name, conclusion: 'success' })) }
  const o = { head: oid(2), base: oid(3), synthetic: { sha: oid(1) }, currentChecks: completeJobs().map((j, i) => ({ name: j.name, id: 300 + i,
    appId: 15368, head: oid(2), status: 'completed', conclusion: 'success' })) }
  validatePassedGate(o, SPLIT_PROFILE_BROWSER_GATE, latest)
  for (const key of ['profileRecoveryVerified', 'mission10Verified', 'pauseRecoveryVerified']) assert.throws(() => validatePassedGate(o, SPLIT_PROFILE_BROWSER_GATE, { ...latest, [key]: false }))
  for (const id of [304, 305]) assert.throws(() => validatePassedGate({ ...o, currentChecks: o.currentChecks.filter(c => c.id !== id) }, SPLIT_PROFILE_BROWSER_GATE, latest))
  assert.throws(() => validatePassedGate(o, SPLIT_PROFILE_BROWSER_GATE, { ...latest, mission10CheckId: 999 }))
})

test('real trusted adapter requires both exact current official jobs and resolves only the M10-owned artifact', () => {
  function adapter() {
    const recovery = fixture('profile-recovery'), mission = fixture('mission10-profile'), jobs = completeJobs(), e = entry()
    const reader = new GitHubReader(), exact = { id: 100, run_attempt: 2, check_suite_id: 500, status: 'completed', conclusion: 'success',
      event: 'pull_request', path: GATES[1].workflow, head_sha: oid(2) }
    const prefix = `PR_HEAD_SHA: ${oid(2)}\nPR_BASE_SHA: ${oid(3)}\n[command]/usr/bin/git log -1 --format=%H\n${oid(1)}\n`
    let downloads = 0
    reader.get = endpoint => {
      if (endpoint.endsWith('/actions/jobs/204/logs')) return prefix + profileCasesReceiptLog(recovery.receipt)
      if (endpoint.endsWith('/actions/jobs/205/logs')) return prefix + mission10CrewReceiptLog(mission.receipt) + '\n' + mission.uploadLog
      if (endpoint.endsWith('/actions/artifacts/200')) return structuredClone(mission.metadata)
      const match = endpoint.match(/\/check-runs\/(304|305)$/)
      if (!match) throw Error(`Unexpected API request: ${endpoint}`)
      const id = Number(match[1])
      return { id, name: id === 304 ? 'Profile recovery browser' : MISSION10_JOB, check_suite: { id: 500 },
        head_sha: oid(2), app: { id: 15368, slug: 'github-actions' }, status: 'completed', conclusion: 'success' }
    }
    reader.pages = (endpoint, key) => { assert.equal(endpoint, 'repos/JohnDeved/populous-new-dawn/actions/runs/100/artifacts'); assert.equal(key, 'artifacts'); return [mission.metadata] }
    reader.artifactArchive = id => { assert.equal(id, 200); downloads++; return mission.archive }
    reader.workflow = () => ({ sha256: h })
    reader.gitOutput = (_, ref) => ref.slice(ref.indexOf(':') + 1)
    const row = { job: 'Tutorial browser', merge: oid(1) }
    return { reader, mission, args: [e, { head: { sha: oid(2) }, base: { sha: oid(3) } }, { sha: oid(1) }, exact, jobs, row], downloads: () => downloads }
  }
  const good = adapter()
  good.reader.verifyProfileRecoveryRun(...good.args); assert.equal(good.downloads(), 0)
  good.reader.verifyMission10Run(...good.args); assert.equal(good.downloads(), 1)
  assert.equal(good.args[5].profileRecoveryVerified, true); assert.equal(good.args[5].mission10Verified, true)
  assert.equal(good.args[5].profileRecoveryCheckId, 304); assert.equal(good.args[5].mission10CheckId, 305)
  for (const mutate of [a => { a[0].browserPolicy = 'profile-recovery-v1' }, a => { a[3].run_attempt = 3 },
    a => { a[3].conclusion = 'failure' }, a => { a[4][4].conclusion = 'failure' }, a => { a[4][5].run_id = 99 },
    a => { a[4].pop() }, a => { a[4].push(a[4][0]) }, a => { a[1].base.sha = oid(9) }]) {
    const f = adapter(); mutate(f.args); assert.throws(() => f.reader.verifyMission10Run(...f.args))
  }
  for (const property of ['id', 'head_sha', 'name', 'app', 'check_suite', 'conclusion', 'status']) {
    const f = adapter(), get = f.reader.get
    f.reader.get = endpoint => { const value = get(endpoint); if (endpoint.endsWith('/check-runs/305')) value[property] = null; return value }
    assert.throws(() => f.reader.verifyMission10Run(...f.args))
  }
  for (const mutate of [f => { f.reader.workflow = () => ({ sha256: 'b'.repeat(64) }) },
    f => { f.reader.gitOutput = () => 'wrong' }, f => { f.mission.metadata.workflow_run.id = 99 },
    f => { f.reader.artifactArchive = () => Buffer.from('corrupt') }]) {
    const f = adapter(); mutate(f); assert.throws(() => f.reader.verifyMission10Run(...f.args))
  }
  assert.equal(validateMission10Resumption(resolveMission10Artifact(good.mission.archive, good.mission.upload, good.mission.receipt)), true)
})
