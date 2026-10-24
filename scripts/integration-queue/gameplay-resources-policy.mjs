// Explicit current resource inventory. Historical eight-job and spell-nine policies remain unchanged.
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { validateGameplayHeapProbe, gameplayHeapResourceLimits } from '../tutorial-browser/gameplay-heap-observer.mjs'
import { createHash } from 'node:crypto'
import { readArtifactZip } from '../artifact-zip.mjs'
import { SPLIT_BROWSER_JOBS, validateSplitBrowserJobs } from './browser-jobs.mjs'
import { gameplayFramePlan as plan, gameplayFrameLimits, summarizeGameplayPhase } from '../tutorial-browser/gameplay-frame-evidence.mjs'
import { gameplayResourceLimits, assertResourceLive, summarizeResourceRestart } from '../tutorial-browser/gameplay-resource-observer.mjs'
import { gameplayResourceSplitBudget } from '../tutorial-browser/scenario-policy.mjs'
export const GAMEPLAY_RESOURCE_POLICY = 'gameplay-resources-nine-v1'
export const GAMEPLAY_HEAP_POLICY = 'gameplay-resources-nine-v2'
export const GAMEPLAY_RESOURCE_POLICIES = Object.freeze([GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY])
export const GAMEPLAY_RESOURCE_JOB = Object.freeze(['gameplay-resources', 'Gameplay resource lifecycle browser',
  'gameplay-resource-lifecycle-browser', 'Observe full live Mission 2 workload and one same-document resource restart', 15])
export const GAMEPLAY_RESOURCE_BROWSER_JOBS = Object.freeze([...SPLIT_BROWSER_JOBS.slice(0, -1), GAMEPLAY_RESOURCE_JOB, SPLIT_BROWSER_JOBS.at(-1)])
export const GAMEPLAY_RESOURCE_INPUTS = Object.freeze([
  ...['run', 'scenario-policy', 'gameplay-frames', 'gameplay-frame-evidence', 'gameplay-resource-observer', 'browser-config', 'build-home', 'build-provenance', 'frame-export', 'm2-pointer-f8'].map(name => `scripts/tutorial-browser/${name}.mjs`),
  'scripts/browser-game.mjs', 'scripts/integration-queue/browser-jobs.mjs', 'scripts/integration-queue/gameplay-resources-policy.mjs',
  'scripts/artifact-zip.mjs', '.github/workflows/tutorial-browser.yml',
  ...['frame-export-analysis', 'frame-export-cohorts', 'frame-export-size', 'frame-performance', 'gpu-frame-timing', 'model-pick-work', 'native-occlusion-metrics', 'ordinary-terrain-metrics', 'pointer-frame-metrics', 'pointer-interaction-context', 'scene-update-metrics', 'water-update-reasons', 'scene', 'scene-assets'].map(name => `app/${name}.ts`),
  'app/original-pause-menu.tsx', 'package.json', 'package-lock.json',
])
export const GAMEPLAY_HEAP_INPUTS = Object.freeze([...GAMEPLAY_RESOURCE_INPUTS, 'scripts/tutorial-browser/gameplay-heap-observer.mjs'])
export function gameplayResourceInputs(policy) {
  assert.ok(GAMEPLAY_RESOURCE_POLICIES.includes(policy), 'Explicit supported resource policy required')
  return policy === GAMEPLAY_HEAP_POLICY ? GAMEPLAY_HEAP_INPUTS : GAMEPLAY_RESOURCE_INPUTS
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const positive = value => assert.ok(Number.isSafeInteger(value) && value > 0)
export const gameplayResourceArchiveLimit = 48 * 1024 * 1024
export function validateGameplayResourceBrowserJobs(jobs, run, expected) {
  assert.ok(GAMEPLAY_RESOURCE_POLICIES.includes(expected?.policy))
  assert.match(expected.headSha, /^[a-f0-9]{40}$/)
  for (const value of [run.id, run.run_attempt, run.check_suite_id, ...jobs.map(job => job.id)]) positive(value)
  assert.equal(run.head_sha, expected.headSha); assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success')
  assert.equal(jobs.length, 9); assert.equal(new Set(jobs.map(job => job.id)).size, 9)
  const resources = jobs.filter(job => job.name === GAMEPLAY_RESOURCE_JOB[1]); assert.equal(resources.length, 1)
  validateSplitBrowserJobs(jobs.filter(job => job !== resources[0]), run)
  for (const job of jobs) assert.equal(job.head_sha, expected.headSha)
  const job = resources[0]
  assert.equal(job.run_id, run.id); assert.equal(job.run_attempt, run.run_attempt)
  assert.equal(job.status, 'completed'); assert.equal(job.conclusion, 'success')
  for (const name of ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
    'Install locked dependencies and verify supported Chrome', 'Record exact tested source', GAMEPLAY_RESOURCE_JOB[3],
    'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots']) {
    const steps = job.steps?.filter(step => step.name === name)
    assert.equal(steps?.length, 1); assert.equal(steps[0].conclusion, 'success')
  }
  return true
}
export function gameplayResourceArtifactUpload(log, mergeSha) {
  assert.match(mergeSha, /^[a-f0-9]{40}$/)
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
  const one = pattern => { const matches = lines.map(line => line.match(pattern)).filter(Boolean)
    assert.equal(matches.length, 1, 'Missing/duplicate resource upload binding'); return matches[0] }
  const name = `gameplay-resource-lifecycle-browser-${mergeSha}`
  const uploaded = one(new RegExp(`^Artifact ${name} has been successfully uploaded! Final size is ([1-9][0-9]*) bytes\\. Artifact ID is ([1-9][0-9]*)$`))
  const finalized = one(new RegExp(`^Artifact ${name}\\.zip successfully finalized\\. Artifact ID ([1-9][0-9]*)$`))
  const sha256 = one(/^SHA256 digest of uploaded artifact zip is ([a-f0-9]{64})$/)[1]
  assert.equal(uploaded[2], finalized[1])
  const bytes = Number(uploaded[1]), id = Number(uploaded[2]); positive(bytes); positive(id)
  assert.ok(bytes <= gameplayResourceArchiveLimit)
  return { id, name, bytes, sha256 }
}
export function validateGameplayResourceArtifactMetadata(metadata, upload, identity) {
  assert.equal(identity.repository, 'JohnDeved/populous-new-dawn')
  assert.match(identity.runId, /^[1-9][0-9]*$/); assert.match(identity.headSha, /^[a-f0-9]{40}$/)
  positive(upload.id)
  const url = `https://api.github.com/repos/${identity.repository}/actions/artifacts/${upload.id}`
  assert.equal(metadata.id, upload.id); assert.equal(metadata.name, upload.name)
  assert.equal(metadata.expired, false); assert.equal(metadata.size_in_bytes, upload.bytes)
  assert.equal(metadata.digest, `sha256:${upload.sha256}`)
  assert.equal(metadata.url, url); assert.equal(metadata.archive_download_url, `${url}/zip`)
  assert.equal(String(metadata.workflow_run?.id), identity.runId); assert.equal(metadata.workflow_run?.head_sha, identity.headSha)
  return true
}
const filesRequired = ['receipt.json', 'gameplay-frames.json', 'gameplay-frames-final.png',
  ...plan.phases.flatMap(phase => [`gameplay-frame-${phase.name}.json`, `gameplay-summary-${phase.name}.json`])]
export function validateGameplayResourceArtifact(files, expected) {
  assert.ok(GAMEPLAY_RESOURCE_POLICIES.includes(expected?.policy))
  for (const key of ['headSha', 'baseSha', 'mergeSha']) assert.match(expected.identity[key], /^[a-f0-9]{40}$/)
  for (const key of ['runId', 'runAttempt']) assert.match(String(expected.identity[key]), /^[1-9][0-9]*$/)
  assert.deepEqual(Object.keys(expected.inputs), gameplayResourceInputs(expected.policy))
  for (const digest of Object.values(expected.inputs)) assert.match(digest, /^[a-f0-9]{64}$/)
  assert.deepEqual(Object.keys(files).filter(name => name !== 'build.log').sort(), [...filesRequired].sort())
  assert.ok(Object.values(files).every(Buffer.isBuffer))
  assert.ok(Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0) <= 96 * 1024 * 1024)
  const read = name => { const bytes = files[name]; assert.ok(bytes?.length > 0 && bytes.length <= 32 * 1024 * 1024); return bytes }
  const json = name => JSON.parse(read(name).toString('utf8'))
  const raw = json('receipt.json'), report = json('gameplay-frames.json')
  assert.equal(raw.status, 'passed'); assert.equal(raw.selectedScenario, 'gameplay-resources')
  assert.equal(raw.source.commit, expected.identity.mergeSha); assert.equal(raw.buildRevision, expected.identity.mergeSha)
  for (const [name, digest] of Object.entries(expected.inputs)) assert.equal(raw.source.files[name], digest)
  for (const [key, identityKey] of [['head', 'headSha'], ['base', 'baseSha'], ['merge', 'mergeSha'], ['runId', 'runId'], ['runAttempt', 'runAttempt']])
    assert.equal(String(raw.github[key]), String(expected.identity[identityKey]))
  assert.equal(raw.build.exitCode, 0); assert.equal(raw.build.signal, null); assert.equal(raw.build.timedOut, false); assert.equal(raw.build.capMs, 120000)
  assert.equal(raw.browserCapMs, 180000); assert.ok(!raw.browserTimedOut)
  assert.equal(raw.sourceAfter, 'identical'); assert.equal(raw.cleanupVerified, true)
  assert.deepEqual(raw.errors, []); assert.deepEqual(raw.dependencyChanges, [])
  assert.match(raw.dependenciesBeforeSha256, /^[a-f0-9]{64}$/); assert.equal(raw.dependenciesBeforeSha256, raw.dependenciesAfterSha256)
  assert.equal(raw.browserPath, '/opt/google/chrome/chrome')
  assert.deepEqual(raw.launch, { channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true, args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 })
  assert.deepEqual(raw.gameplayResourceSplitBudget, gameplayResourceSplitBudget)
  assert.deepEqual(raw.gameplayResources, report)
  assert.equal(report.schema, 'populous-new-dawn/gameplay-frame-recording'); assert.equal(report.schemaVersion, 1)
  assert.equal(report.status, 'passed'); assert.equal(report.expectedRevision, expected.identity.mergeSha)
  assert.ok(!report.failure && !report.resourceObserverCleanupFailure && !report.heapObserverCleanupFailure)
  assert.deepEqual(report.plan, plan); assert.deepEqual(report.limits, gameplayFrameLimits)
  assert.deepEqual(report.measuredPhases, plan.phases.map(phase => phase.name))
  assert.deepEqual(report.phases.map(phase => phase.name), report.measuredPhases)
  for (const [state, paused] of [[report.warmupBefore, false], [report.warmupAfter, false], [report.menuBefore, true], [report.menuAfter, false], [report.after, false]]) {
    assert.equal(state.level, 2); assert.equal(state.sameScene, true); assert.equal(state.paused, paused)
    assert.equal(state.inputMask, 0); assert.equal(state.speed, 1); assert.equal(state.visibility, 'visible')
    assert.deepEqual(state.viewport, plan.viewport)
    assert.ok(Number.isFinite(state.timestampMs) && state.timestampMs >= 0)
    assert.ok(Number.isFinite(state.timeOriginUnixMs) && state.timeOriginUnixMs >= 0)
    assert.equal(state.timeOriginUnixMs, report.resources.beforeWarmup.timeOriginUnixMs)
    assert.ok(Number.isSafeInteger(state.turn) && state.turn >= 0)
  }
  assert.ok(report.warmupAfter.timestampMs - report.warmupBefore.timestampMs >= plan.warmupMs)
  assert.ok(report.menuAfter.timestampMs > report.menuBefore.timestampMs)
  assert.ok(report.after.timestampMs >= report.phases.at(-1).after.timestampMs)
  assert.ok(report.warmupAfter.turn > report.warmupBefore.turn)
  assert.equal(report.menuBefore.paused, true); assert.equal(report.menuAfter.paused, false)
  for (const [index, phase] of plan.phases.entries()) {
    const record = report.phases[index]; assert.equal(record.status, 'passed')
    assert.equal(record.before.timeOriginUnixMs, report.resources.beforeWarmup.timeOriginUnixMs)
    assert.ok(record.before.timestampMs >= (index ? report.phases[index - 1].after.timestampMs : report.warmupAfter.timestampMs))
    const commands = phase.moving ? plan.pointerOffsets.map(([dx, dy], i) => ({ offsetMs: i * plan.pointerIntervalMs, action: 'move', x: record.point.x + dx, y: record.point.y + dy })) : phase.camera ? plan.cameraInputs : []
    assert.deepEqual(record.inputs.map(({ observedTimestampMs, ...command }) => command), commands)
    for (const input of record.inputs) assert.ok(Number.isFinite(input.observedTimestampMs) && input.observedTimestampMs >= record.before.timestampMs && input.observedTimestampMs <= record.after.timestampMs)
    assert.equal(record.rawFile, `gameplay-frame-${phase.name}.json`); assert.equal(record.summaryFile, `gameplay-summary-${phase.name}.json`)
    const summary = summarizeGameplayPhase(read(record.rawFile).toString('utf8'), phase, record.before, record.after, expected.identity.mergeSha)
    // Keep exact deep-strict equality without formatting an unbounded object diff.
    // Original artifact bytes remain available for independent inspection.
    assert.ok(isDeepStrictEqual(json(record.summaryFile), summary), 'Stored gameplay phase summary differs from recomputed raw evidence')
    for (const key of ['rawSha256', 'turnsAdvanced', 'work']) assert.deepEqual(record[key], summary[key])
    assert.equal(record.frameCount, summary.analysis.sampleCount)
  }
  const resources = report.resources
  const heapRequired = expected.policy === GAMEPLAY_HEAP_POLICY
  assert.equal(resources.version, heapRequired ? 2 : 1)
  assert.equal(resources.status, heapRequired ? 'passed-scoped-lifecycle-and-heap-capability' : 'passed-scoped-lifecycle-observations')
  assert.deepEqual(resources.limits, heapRequired ? gameplayHeapResourceLimits : gameplayResourceLimits)
  if (!heapRequired) assert.equal(resources.heap, undefined, 'Historical v1 cannot carry unvalidated byte proof')
  for (const sample of [resources.beforeWarmup, resources.afterWorkload]) assertResourceLive(sample)
  assert.ok(resources.beforeWarmup.timestampMs <= report.warmupBefore.timestampMs && resources.afterWorkload.timestampMs >= report.phases.at(-1).after.timestampMs)
  assert.equal(resources.beforeWarmup.sceneUuid, resources.afterWorkload.sceneUuid)
  assert.equal(resources.beforeWarmup.timeOriginUnixMs, resources.afterWorkload.timeOriginUnixMs)
  assert.ok(resources.afterWorkload.timestampMs > resources.beforeWarmup.timestampMs && resources.afterWorkload.turn > resources.beforeWarmup.turn)
  const restart = resources.restart
  const recomputed = summarizeResourceRestart(resources.afterWorkload, restart.retired, restart.after, restart.settled)
  for (const [key, value] of Object.entries(recomputed)) assert.deepEqual(restart[key], value)
  if (heapRequired) {
    assert.match(raw.browserSha256, /^[a-f0-9]{64}$/)
    assert.ok(typeof raw.browserBinaryVersion === 'string' && raw.browserBinaryVersion.length > 0)
    assert.ok(typeof raw.buildPackageVersions?.['playwright-core'] === 'string' && raw.buildPackageVersions['playwright-core'].length > 0)
  }
  const heap = heapRequired ? validateGameplayHeapProbe(resources.heap, resources) : undefined
  assert.deepEqual(read('gameplay-frames-final.png').subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return { ...(heapRequired ? { heapCapabilityVerified: true, heap } : {}), lifecycleVerified: true, receiptSha256: hash(read('receipt.json')), reportSha256: hash(read('gameplay-frames.json')),
    phaseCount: 5, lifecycle: recomputed, scope: heapRequired ? 'one-cycle-lifecycle-and-isolate-byte-capability-not-retention-comparison' : 'one-cycle-cleanup-and-counts-not-ram-or-plateau', visualReview: 'required' }
}
// Caller first binds upload to the exact current job log and API metadata; never follow candidate URLs.
export function resolveGameplayResourceArtifact(archive, upload, expected) {
  positive(upload.id); assert.equal(upload.name, `gameplay-resource-lifecycle-browser-${expected.identity.mergeSha}`)
  assert.equal(archive.length, upload.bytes); assert.ok(archive.length <= gameplayResourceArchiveLimit)
  assert.equal(hash(archive), upload.sha256)
  const allowed = new Set([...filesRequired, 'build.log'])
  const files = Object.fromEntries(readArtifactZip(archive, { maxArchiveBytes: gameplayResourceArchiveLimit,
    maxFileBytes: 32 * 1024 * 1024, maxTotalBytes: 96 * 1024 * 1024, maxEntries: allowed.size, allowName: name => allowed.has(name) }))
  return validateGameplayResourceArtifact(files, expected)
}
