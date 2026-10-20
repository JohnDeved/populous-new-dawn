// Complete synthetic Actions pipeline: authenticated API/log/archive fixtures,
// never a hosted run, browser result or candidate application execution.
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { GitHubReader } from '../../scripts/integration-queue/github.mjs'
import { REPO, GATES, sha256 } from '../../scripts/integration-queue/policy.mjs'
import { PROFILE_INPUTS, PROFILE_CASES, PROFILE_SCREENSHOTS } from '../../scripts/integration-queue/profile-recovery.mjs'
import { RECOVERY_INPUTS, RECOVERY_CHECKS, RECOVERY_SCREENSHOTS } from '../../scripts/integration-queue/pause-recovery.mjs'
import { SPLIT_BROWSER_JOBS } from '../../scripts/integration-queue/browser-jobs.mjs'
import { SPELL_VISUAL_BROWSER_JOBS, spellVisualReceiptLog } from '../../scripts/integration-queue/spell-visuals-policy.mjs'
import { mission10CrewReceipt } from '../../scripts/tutorial-browser/mission10-crew-receipt.mjs'
import { writeMission10Fixture } from './mission10-profile-receipt.mjs'
import { spellReaderFixture } from './spell-visuals-reader-fixture.mjs'
import { artifactZip } from './artifact-zip.mjs'
const h = 'a'.repeat(64)
const envelopeLog = (prefix, receipt) => {
  const json = JSON.stringify(receipt)
  return `${prefix}_RECEIPT=${Buffer.from(json).toString('base64')}\n${prefix}_SHA256=${sha256(json)}`
}
export function passiveBrowserFixture({ nine = true, version = nine ? 4 : 3 } = {}) {
  const f = spellReaderFixture(), identity = f.expected.identity
  const sourceBlobs = Object.fromEntries(Object.keys(f.expected.inputs).map(path => [path, Buffer.from(path)]))
  sourceBlobs['app/original-angel.json'] = f.expected.originalAngel
  sourceBlobs['app/original-units.json'] = f.expected.originalUnits
  const entry = { version: 1, repo: REPO, pr: 695, baseRef: 'main',
    sourceHead: identity.headSha, sourceTree: '4'.repeat(40), reviewBase: identity.baseSha,
    approvedBy: 'parent', allowMechanicalRefresh: false, requireBrowser: true,
    review: { reviewer: 'independent', decision: 'ACCEPT', head: identity.headSha, base: identity.baseSha, sha256: h, file: '/review' },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])), deployment: { kind: 'unverified', reason: 'synthetic fixture' },
    browserPolicy: nine ? 'spell-visuals-nine-v2' : 'profile-split-v1', ...(nine ? { browserCheckpointVersion: 4 } : {}) }
  const pr = { head: { sha: identity.headSha, ref: 'feature' }, base: { sha: identity.baseSha } }
  const synthetic = { sha: identity.mergeSha, tree: entry.sourceTree, parents: [identity.baseSha, identity.headSha] }
  const exact = { id: 100, run_attempt: 2, check_suite_id: 500, head_sha: identity.headSha,
    path: GATES[1].workflow, event: 'pull_request', status: 'completed', conclusion: 'success',
    run_started_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:01:00Z',
    pull_requests: [{ number: 695, base: { sha: identity.baseSha } }] }
  const jobs = (nine ? SPELL_VISUAL_BROWSER_JOBS : SPLIT_BROWSER_JOBS).map(([, name, , step], index) => ({
    id: 1000 + index, name, run_id: exact.id, run_attempt: exact.run_attempt, head_sha: identity.headSha,
    status: 'completed', conclusion: 'success', started_at: exact.run_started_at,
    check_run_url: `https://api.github.com/repos/${REPO}/check-runs/${2000 + index}`,
    steps: ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
      'Install locked dependencies and verify supported Chrome', 'Record exact tested source', step,
      'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots'].map(name => ({ name, conclusion: 'success' })),
  }))
  const checks = jobs.map((job, index) => ({ id: 2000 + index, name: job.name, head_sha: identity.headSha,
    check_suite: { id: 500 }, app: { id: 15368, slug: 'github-actions' }, status: 'completed', conclusion: 'success', started_at: exact.run_started_at }))
  const logIdentity = `PR_HEAD_SHA: ${identity.headSha}\nPR_BASE_SHA: ${identity.baseSha}\n/usr/bin/git log -1 --format=%H\n${identity.mergeSha}\n`
  const logs = new Map(jobs.map(job => [job.id, logIdentity])), archives = new Map(), artifacts = []
  function retain(job, prefix, files, receipt, envelopePrefix) {
    const bytes = artifactZip(Object.entries(files), { compress: true }), id = 3000 + artifacts.length
    const name = `${prefix}-${identity.mergeSha}`, url = `https://api.github.com/repos/${REPO}/actions/artifacts/${id}`
    const metadata = { id, name, expired: false, size_in_bytes: bytes.length, digest: `sha256:${sha256(bytes)}`,
      url, archive_download_url: `${url}/zip`, workflow_run: { id: exact.id, head_sha: identity.headSha } }
    archives.set(id, bytes); artifacts.push(metadata)
    logs.set(job.id, logIdentity + (envelopePrefix ? envelopeLog(envelopePrefix, receipt) : spellVisualReceiptLog(receipt)) +
      `\nSHA256 digest of uploaded artifact zip is ${sha256(bytes)}\nArtifact ${name}.zip successfully finalized. Artifact ID ${id}\nArtifact ${name} has been successfully uploaded! Final size is ${bytes.length} bytes. Artifact ID is ${id}`)
  }
  const inputs = paths => Object.fromEntries(paths.map(path => [path, sha256(path)]))
  const common = { build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 }, browserTimedOut: false,
    browserCapMs: 180000, sourceAfter: 'identical', cleanupVerified: true, errors: [], dependencyChanges: [],
    dependenciesBeforeSha256: h, dependenciesAfterSha256: h, browserPath: '/opt/google/chrome/chrome', launch: f.raw.launch }
  const pause = { version: 1, kind: 'pause-recovery-browser', status: 'passed', identity,
    inputs: inputs(RECOVERY_INPUTS), receiptSha256: h, selectedScenario: 'pause-checkpoint-recovery', ...common,
    checks: RECOVERY_CHECKS, screenshots: RECOVERY_SCREENSHOTS.map(([name, width, height, dpr]) => ({name, viewport:{width,height},dpr,sha256:h})) }
  logs.set(jobs[3].id, logIdentity + envelopeLog('PND_PAUSE_RECOVERY', pause))
  const github = { head: identity.headSha, base: identity.baseSha, merge: identity.mergeSha, runId: identity.runId, runAttempt: identity.runAttempt }
  const host = { status: 'passed', source: { commit: identity.mergeSha, files: inputs(PROFILE_INPUTS) }, github, ...common,
    node: 'synthetic', browserVersion: 'synthetic', browserSha256: h, buildPackageVersions: {} }
  const rawProfile = { status: 'passed', runtime: { fixture: true }, runtimeAfter: { fixture: true },
    cases: PROFILE_CASES.map(([kind,status,fixture]) => ({kind,status,fixture})),
    screenshots: PROFILE_SCREENSHOTS.map(([name,width,height,dpr]) => ({name,viewport:{width,height},dpr})) }
  const profileHost = { ...host, selectedScenario: 'profile-recovery', profileRecovery: rawProfile }
  const files = { 'receipt.json': Buffer.from(JSON.stringify(profileHost)), 'profile-recovery.json': Buffer.from(JSON.stringify(rawProfile)) }
  for (const shot of rawProfile.screenshots) files[shot.name] = Buffer.from('synthetic old-profile screenshot')
  const profile = { version: 1, kind: 'profile-recovery-cases-browser', status:'passed', identity, inputs: inputs(PROFILE_INPUTS),
    receiptSha256: sha256(files['receipt.json']), ...common, selectedScenario: 'profile-recovery', scenarioStatus:'passed', runtimeUnchanged:true,
    cases: rawProfile.cases, screenshots: rawProfile.screenshots.map(shot => ({...shot,sha256:sha256(files[shot.name])})) }
  retain(jobs[4], 'profile-recovery-browser', files, profile, 'PND_PROFILE_CASES')
  const output = mkdtempSync(join(tmpdir(), 'passive-reader-'))
  try {
    const missionHost = { ...host, selectedScenario: 'mission10-profile' }
    missionHost.mission10Profile = writeMission10Fixture(output, missionHost, value => {
      value.phases[0].saved[0] = version; value.phases[1].loaded[0] = version
    })
    writeFileSync(join(output, 'receipt.json'), JSON.stringify(missionHost))
    const env = { GITHUB_REPOSITORY: REPO, GITHUB_RUN_ID: identity.runId, GITHUB_RUN_ATTEMPT: identity.runAttempt,
      GITHUB_WORKFLOW_REF: identity.workflowRef, PR_HEAD_SHA: identity.headSha, PR_BASE_SHA: identity.baseSha }
    const mission = mission10CrewReceipt(missionHost, output, env)
    const missionFiles = Object.fromEntries(readdirSync(output, { withFileTypes:true }).filter(d => d.isFile()).map(d => [d.name,readFileSync(join(output,d.name))]))
    retain(jobs[5], 'mission10-crew-persistence-browser', missionFiles, mission, 'PND_MISSION10_CREW')
  } finally { rmSync(output, {recursive:true,force:true}) }
  if (nine) retain(jobs[8], 'spell-visuals-browser', f.files, f.receipt)
  const metadata = structuredClone(artifacts), calls = []
  const reader = new GitHubReader({ execute: (command, args) => {
    calls.push([command,args])
    if (command === 'git') {
      if (args.includes('config')) return ''
      assert.ok(args.includes('show')); return args.at(-1).split(':').slice(1).join(':')
    }
    assert.equal(command,'gh'); const endpoint = args[5]
    let result
    if (endpoint.includes('/actions/workflows/ready-pr-check.yml/runs?')) result = { total_count:0, workflow_runs:[] }
    else if (endpoint.includes('/actions/workflows/tutorial-browser.yml/runs?')) result = {total_count:1, workflow_runs:[exact]}
    else if (endpoint.endsWith('/attempts/2')) result = exact
    else if (endpoint.includes('/attempts/2/jobs?')) result = {total_count:jobs.length,jobs}
    else if (endpoint.includes('/check-runs/')) result = checks.find(c => c.id === Number(endpoint.split('/').at(-1)))
    else if (endpoint.endsWith('/logs')) return logs.get(Number(endpoint.split('/').at(-2)))
    else if (endpoint.includes('/contents/')) result = {encoding:'base64',content:Buffer.from('workflow').toString('base64')}
    else if (endpoint.includes('/runs/100/artifacts?')) result = {total_count:artifacts.length,artifacts}
    else if (endpoint.includes('/actions/artifacts/')) result = metadata.find(a => a.id === Number(endpoint.split('/').at(-1)))
    else assert.fail(`Unexpected text endpoint ${endpoint}`)
    return JSON.stringify(result)
  }, executeBinary: (command,args,options) => {
    calls.push([command,args,options])
    if(command==='git') return sourceBlobs[args.at(-1).split(':').slice(1).join(':')]
    assert.equal(command,'gh');return archives.get(Number(args[5].split('/').at(-2)))
  } })
  entry.workflowHashes[GATES[1].workflow] = sha256('workflow')
  return { f, entry, pr, synthetic, exact, jobs, checks, logs, artifacts, metadata, archives, reader, calls, sourceBlobs,
    run: () => reader.runs(entry, pr, synthetic)[0] }
}
