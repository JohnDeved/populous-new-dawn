// Explicit current resource inventory. Historical eight-job and spell-nine policies remain unchanged.
import assert from 'node:assert/strict'
import { gameplayThreeCycleProfile, gameplayThreeCycleArgument, gameplayOwnershipArgument } from '../tutorial-browser/gameplay-resource-profile.mjs'
import { gameplayThreeCycleProtocol, gameplayThreeCycleResourceLimits, validateGameplayThreeCycleHeapProbe, summarizeGameplayThreeCycleWorkload } from '../tutorial-browser/gameplay-heap-observer.mjs'
import { validateGameplayProducerPreflight } from '../tutorial-browser/gameplay-heap-observer.mjs'
import { isDeepStrictEqual } from 'node:util'
import { validateGameplayHeapProbe, gameplayHeapResourceLimits, gameplayMatchedProtocol, validateGameplayMatchedHeapProbe, summarizeGameplayMatchedWorkload } from '../tutorial-browser/gameplay-heap-observer.mjs'
import { createHash } from 'node:crypto'
import { readArtifactZip } from '../artifact-zip.mjs'
import { SPLIT_BROWSER_JOBS, validateSplitBrowserJobs } from './browser-jobs.mjs'
import { gameplayFramePlan as plan, gameplayFrameLimits, summarizeGameplayPhase } from '../tutorial-browser/gameplay-frame-evidence.mjs'
import { gameplayResourceLimits, assertResourceLive, summarizeResourceRestart } from '../tutorial-browser/gameplay-resource-observer.mjs'
import { gameplayResourceSplitBudget } from '../tutorial-browser/scenario-policy.mjs'
export const GAMEPLAY_RESOURCE_POLICY = 'gameplay-resources-nine-v1'
export const GAMEPLAY_HEAP_POLICY = 'gameplay-resources-nine-v2'
export const GAMEPLAY_MATCHED_POLICY = 'gameplay-resources-nine-v3'
export const GAMEPLAY_THREE_CYCLE_POLICY = 'gameplay-resources-nine-v4'
export const GAMEPLAY_OWNERSHIP_POLICY = 'gameplay-resources-weak-v1'
export const GAMEPLAY_RESOURCE_POLICIES = Object.freeze([GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_MATCHED_POLICY, GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY])
// Separate opt-in evidence claim. Historical nine-artifact acceptance does not
// silently acquire a new producer requirement, and an absent/failed diagnostic
// cannot be accepted as observed metadata by this entry point.
export function validateGameplayProducerPreflightArtifact(files, expected) {
  const artifact = validateGameplayResourceArtifact(files, expected)
  assert.equal(expected.policy, GAMEPLAY_OWNERSHIP_POLICY)
  const raw = JSON.parse(files['receipt.json'].toString('utf8'))
  assert.ok(raw.heapProducerPreflight, 'Producer preflight missing')
  const producer = validateGameplayProducerPreflight(raw.heapProducerPreflight, raw.gameplayResources,
    { requireObserved: true, executableSha256: raw.browserSha256 })
  return { artifact, producer }
}
export const GAMEPLAY_RESOURCE_JOB = Object.freeze(['gameplay-resources', 'Gameplay resource lifecycle browser',
  'gameplay-resource-lifecycle-browser', 'Observe full live Mission 2 workload and one same-document resource restart', 15])
export const GAMEPLAY_RESOURCE_BROWSER_JOBS = Object.freeze([...SPLIT_BROWSER_JOBS.slice(0, -1), GAMEPLAY_RESOURCE_JOB, SPLIT_BROWSER_JOBS.at(-1)])
export const GAMEPLAY_THREE_CYCLE_JOB = Object.freeze([...GAMEPLAY_RESOURCE_JOB.slice(0, 3),
  'Observe three full live Mission 2 workloads and two same-document resource restarts', 15])
export const GAMEPLAY_THREE_CYCLE_BROWSER_JOBS = Object.freeze([...SPLIT_BROWSER_JOBS.slice(0, -1), GAMEPLAY_THREE_CYCLE_JOB, SPLIT_BROWSER_JOBS.at(-1)])
export const GAMEPLAY_RESOURCE_INPUTS = Object.freeze([
  ...['run', 'scenario-policy', 'gameplay-frames', 'gameplay-frame-evidence', 'gameplay-resource-observer', 'browser-config', 'build-home', 'build-provenance', 'frame-export', 'm2-pointer-f8'].map(name => `scripts/tutorial-browser/${name}.mjs`),
  'scripts/browser-game.mjs', 'scripts/integration-queue/browser-jobs.mjs', 'scripts/integration-queue/gameplay-resources-policy.mjs',
  'scripts/artifact-zip.mjs', '.github/workflows/tutorial-browser.yml',
  ...['frame-export-analysis', 'frame-export-cohorts', 'frame-export-size', 'frame-performance', 'gpu-frame-timing', 'model-pick-work', 'native-occlusion-metrics', 'ordinary-terrain-metrics', 'pointer-frame-metrics', 'pointer-interaction-context', 'scene-update-metrics', 'water-update-reasons', 'scene', 'scene-assets'].map(name => `app/${name}.ts`),
  'app/original-pause-menu.tsx', 'package.json', 'package-lock.json',
])
export const GAMEPLAY_HEAP_INPUTS = Object.freeze([...GAMEPLAY_RESOURCE_INPUTS, 'scripts/tutorial-browser/gameplay-heap-observer.mjs'])
// v4 additionally binds the selector, public startup dependency and policy/adapter inputs.
// Historical input arrays remain byte-for-byte policy contracts, not refreshed lists.
export const GAMEPLAY_THREE_CYCLE_INPUTS = Object.freeze([...GAMEPLAY_HEAP_INPUTS,
  'scripts/tutorial-browser/gameplay-resource-profile.mjs', 'scripts/browser-new-game.mjs',
  'scripts/integration-queue/policy.mjs', 'scripts/integration-queue/github.mjs'])
export const GAMEPLAY_OWNERSHIP_INPUTS = Object.freeze([...GAMEPLAY_THREE_CYCLE_INPUTS,
  'scripts/tutorial-browser/gameplay-ownership-observer.mjs', 'app/globe-renderer.ts', 'app/scene-terrain-runtime.ts'])
const threeCyclePolicy = policy => [GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(policy)
export function gameplayResourceInputs(policy) {
  assert.ok(GAMEPLAY_RESOURCE_POLICIES.includes(policy), 'Explicit supported resource policy required')
  return policy === GAMEPLAY_OWNERSHIP_POLICY ? GAMEPLAY_OWNERSHIP_INPUTS
    : policy === GAMEPLAY_THREE_CYCLE_POLICY ? GAMEPLAY_THREE_CYCLE_INPUTS
    : policy === GAMEPLAY_RESOURCE_POLICY ? GAMEPLAY_RESOURCE_INPUTS : GAMEPLAY_HEAP_INPUTS
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
  const buildStep = threeCyclePolicy(expected.policy) ? GAMEPLAY_THREE_CYCLE_JOB[3] : GAMEPLAY_RESOURCE_JOB[3]
  assert.equal(job.run_id, run.id); assert.equal(job.run_attempt, run.run_attempt)
  assert.equal(job.status, 'completed'); assert.equal(job.conclusion, 'success')
  for (const name of ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
    'Install locked dependencies and verify supported Chrome', 'Record exact tested source', buildStep,
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
const matchedFilesRequired = ['receipt.json', 'gameplay-frames.json', ...['cycle-1-', 'cycle-2-'].flatMap(prefix =>
  filesRequired.filter(name => name !== 'receipt.json' && name !== 'gameplay-frames.json').map(name => prefix + name))]
const threeCycleFilesRequired = ['receipt.json', 'gameplay-frames.json', ...['cycle-1-', 'cycle-2-', 'cycle-3-'].flatMap(prefix =>
  filesRequired.filter(name => name !== 'receipt.json' && name !== 'gameplay-frames.json').map(name => prefix + name))]
const requiredFiles = policy => threeCyclePolicy(policy) ? threeCycleFilesRequired
  : policy === GAMEPLAY_MATCHED_POLICY ? matchedFilesRequired : filesRequired
function validateCycle(report, read, json, expected, prefix = '') {
  assert.deepEqual(report.phases.map(phase => phase.name), plan.phases.map(phase => phase.name))
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
    if (prefix && phase.nativeWork) assert.ok(Number.isSafeInteger(record.point.id) && record.point.id >= 0, 'Authored target identity required')
    assert.equal(record.before.timeOriginUnixMs, report.resources.beforeWarmup.timeOriginUnixMs)
    assert.ok(record.before.timestampMs >= (index ? report.phases[index - 1].after.timestampMs : report.warmupAfter.timestampMs))
    const commands = phase.moving ? plan.pointerOffsets.map(([dx, dy], i) => ({ offsetMs: i * plan.pointerIntervalMs, action: 'move', x: record.point.x + dx, y: record.point.y + dy })) : phase.camera ? plan.cameraInputs : []
    assert.deepEqual(record.inputs.map(({ observedTimestampMs, ...command }) => { void observedTimestampMs; return command }), commands)
    for (const input of record.inputs) assert.ok(Number.isFinite(input.observedTimestampMs) && input.observedTimestampMs >= record.before.timestampMs && input.observedTimestampMs <= record.after.timestampMs)
    assert.equal(record.rawFile, `${prefix}gameplay-frame-${phase.name}.json`); assert.equal(record.summaryFile, `${prefix}gameplay-summary-${phase.name}.json`)
    const summary = summarizeGameplayPhase(read(record.rawFile).toString('utf8'), phase, record.before, record.after, expected.identity.mergeSha)
    // Keep exact deep-strict equality without formatting an unbounded object diff.
    // Original artifact bytes remain available for independent inspection.
    assert.ok(isDeepStrictEqual(json(record.summaryFile), summary), 'Stored gameplay phase summary differs from recomputed raw evidence')
    for (const key of ['rawSha256', 'turnsAdvanced', 'work']) assert.deepEqual(record[key], summary[key])
    assert.equal(record.frameCount, summary.analysis.sampleCount)
  }
  const resources = report.resources
  for (const sample of [resources.beforeWarmup, resources.afterWorkload]) assertResourceLive(sample)
  assert.ok(resources.beforeWarmup.timestampMs <= report.warmupBefore.timestampMs && resources.afterWorkload.timestampMs >= report.phases.at(-1).after.timestampMs)
  assert.equal(resources.beforeWarmup.sceneUuid, resources.afterWorkload.sceneUuid)
  assert.equal(resources.beforeWarmup.timeOriginUnixMs, resources.afterWorkload.timeOriginUnixMs)
  assert.ok(resources.afterWorkload.timestampMs > resources.beforeWarmup.timestampMs && resources.afterWorkload.turn > resources.beforeWarmup.turn)
}
export function validateGameplayResourceArtifact(files, expected) {
  assert.ok(GAMEPLAY_RESOURCE_POLICIES.includes(expected?.policy))
  for (const key of ['headSha', 'baseSha', 'mergeSha']) assert.match(expected.identity[key], /^[a-f0-9]{40}$/)
  for (const key of ['runId', 'runAttempt']) assert.match(String(expected.identity[key]), /^[1-9][0-9]*$/)
  assert.deepEqual(Object.keys(expected.inputs), gameplayResourceInputs(expected.policy))
  for (const digest of Object.values(expected.inputs)) assert.match(digest, /^[a-f0-9]{64}$/)
  assert.deepEqual(Object.keys(files).filter(name => name !== 'build.log').sort(), [...requiredFiles(expected.policy)].sort())
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
  assert.ok(isDeepStrictEqual(raw.gameplayResources, report), 'Receipt gameplay resources differ from retained report')
  const ownership = expected.policy === GAMEPLAY_OWNERSHIP_POLICY
  const threeCycles = threeCyclePolicy(expected.policy)
  const matched = threeCycles || expected.policy === GAMEPLAY_MATCHED_POLICY
  assert.equal(raw.gameplayResourceProfile, threeCycles ? gameplayThreeCycleProfile : undefined)
  assert.equal(report.resourceProfile, threeCycles ? gameplayThreeCycleProfile : undefined)
  if (threeCycles) assert.deepEqual(raw.command.slice(2), ['outputs/tutorial-browser', gameplayThreeCycleArgument, ...(ownership ? [gameplayOwnershipArgument] : [])])
  const ownershipEvidence = ownership ? validateGameplayOwnershipEvidence(raw, report, expected.identity.headSha) : rejectGameplayOwnershipEvidence(raw, report)
  if (raw.heapProducerPreflight !== undefined) {
    assert.equal(ownership, true, 'Producer preflight belongs only to the unchanged three-cycle weak route')
    validateGameplayProducerPreflight(raw.heapProducerPreflight, report, { executableSha256: raw.browserSha256 })
    if (raw.heapProducerPreflight.status === 'observed') assert.equal(raw.heapProducerPreflight.browser.product, `Chrome/${raw.browserVersion}`)
  }
  assert.equal(report.schema, 'populous-new-dawn/gameplay-frame-recording'); assert.equal(report.schemaVersion, threeCycles ? 3 : matched ? 2 : 1)
  assert.equal(report.status, 'passed'); assert.equal(report.expectedRevision, expected.identity.mergeSha)
  assert.ok(!report.failure && !report.resourceObserverCleanupFailure && !report.heapObserverCleanupFailure)
  assert.deepEqual(report.plan, plan); assert.deepEqual(report.limits, gameplayFrameLimits)
  assert.deepEqual(report.measuredPhases, plan.phases.map(phase => phase.name))
  if (matched) {
    assert.deepEqual(report.protocol, threeCycles ? gameplayThreeCycleProtocol : gameplayMatchedProtocol)
    assert.equal(report.phases, undefined)
    assert.deepEqual(report.cycles.map(cycle => cycle.id), threeCycles ? ['cycle-1', 'cycle-2', 'cycle-3'] : ['cycle-1', 'cycle-2'])
    for (const cycle of report.cycles) {
      validateCycle(cycle, read, json, expected, `${cycle.id}-`)
      assert.deepEqual({ x: cycle.pointerReset.x, y: cycle.pointerReset.y }, gameplayMatchedProtocol.pointerReset)
      assert.ok(Number.isFinite(cycle.pointerReset.observedTimestampMs) && cycle.pointerReset.observedTimestampMs >= 0 &&
        cycle.pointerReset.observedTimestampMs <= cycle.resources.beforeWarmup.timestampMs)
      assert.equal(cycle.startup.level, 2)
      assert.ok(['skip', 'ready'].includes(cycle.startup.action))
      assert.ok(cycle.resources.afterWorkload.timestampMs >= cycle.after.timestampMs)
      assert.ok(cycle.resources.beforeWarmup.turn <= cycle.warmupBefore.turn)
      assert.ok(cycle.resources.afterWorkload.turn >= cycle.after.turn && cycle.after.turn >= cycle.phases.at(-1).after.turn)
      assert.equal(cycle.resources.beforeWarmup.timeOriginUnixMs, report.cycles[0].resources.beforeWarmup.timeOriginUnixMs)
      assert.equal(cycle.screenshotFile, `${cycle.id}-gameplay-frames-final.png`)
      assert.deepEqual(read(cycle.screenshotFile).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    }
    assert.ok(isDeepStrictEqual(report.observedWorkloadComparison, threeCycles ? summarizeGameplayThreeCycleWorkload(report.cycles) : summarizeGameplayMatchedWorkload(report.cycles)),
      'Observed cycle workload comparison differs from validated phase evidence')
  } else {
    assert.equal(report.cycles, undefined); assert.equal(report.protocol, undefined)
    validateCycle(report, read, json, expected)
  }
  const resources = report.resources
  const heapRequired = expected.policy !== GAMEPLAY_RESOURCE_POLICY
  assert.equal(resources.version, threeCycles ? 4 : matched ? 3 : heapRequired ? 2 : 1)
  assert.equal(resources.status, threeCycles ? 'passed-three-cycle-protocol' : matched ? 'passed-two-cycle-matched-protocol' : heapRequired ? 'passed-scoped-lifecycle-and-heap-capability' : 'passed-scoped-lifecycle-observations')
  assert.deepEqual(resources.limits, threeCycles ? gameplayThreeCycleResourceLimits : heapRequired ? gameplayHeapResourceLimits : gameplayResourceLimits)
  if (!heapRequired) assert.equal(resources.heap, undefined, 'Historical v1 cannot carry unvalidated byte proof')
  let recomputed
  if (threeCycles) {
    assert.equal(resources.restart, undefined)
    assert.deepEqual(resources.restarts.map(restart => [restart.fromCycle, restart.toCycle]),
      [['cycle-1', 'cycle-2'], ['cycle-2', 'cycle-3']])
    recomputed = resources.restarts.map((restart, index) => {
      const previous = report.cycles[index], next = report.cycles[index + 1]
      assert.ok(restart.settled.timestampMs - restart.after.timestampMs >= plan.warmupMs)
      assert.ok(next.pointerReset.observedTimestampMs >= restart.settled.timestampMs)
      const result = summarizeResourceRestart(previous.resources.afterWorkload, restart.retired, restart.after, restart.settled)
      for (const [key, value] of Object.entries(result)) assert.deepEqual(restart[key], value)
      assert.equal(next.resources.beforeWarmup.sceneUuid, restart.settled.sceneUuid)
      return result
    })
  } else {
    assert.equal(resources.restarts, undefined)
    const restart = resources.restart
    if (matched) {
      assert.ok(restart.settled.timestampMs - restart.after.timestampMs >= plan.warmupMs)
      assert.ok(report.cycles[1].pointerReset.observedTimestampMs >= restart.settled.timestampMs)
    }
    recomputed = summarizeResourceRestart(matched ? report.cycles[0].resources.afterWorkload : resources.afterWorkload, restart.retired, restart.after, restart.settled)
    for (const [key, value] of Object.entries(recomputed)) assert.deepEqual(restart[key], value)
  }
  if (heapRequired) {
    assert.match(raw.browserSha256, /^[a-f0-9]{64}$/)
    assert.ok(typeof raw.browserBinaryVersion === 'string' && raw.browserBinaryVersion.length > 0)
    assert.ok(typeof raw.buildPackageVersions?.['playwright-core'] === 'string' && raw.buildPackageVersions['playwright-core'].length > 0)
  }
  const heap = threeCycles ? validateGameplayThreeCycleHeapProbe(resources.heap, resources, report.cycles) : matched ? validateGameplayMatchedHeapProbe(resources.heap, resources, report.cycles) : heapRequired ? validateGameplayHeapProbe(resources.heap, resources) : undefined
  if (threeCycles) assert.deepEqual(resources.heap.deltas, heap)
  if (!matched) assert.deepEqual(read('gameplay-frames-final.png').subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return { ...(ownership ? { ownershipVerified: true, ownership: ownershipEvidence } : {}), ...(threeCycles ? { threeCyclesVerified: true, cycleCount: 3 } : matched ? { matchedCyclesVerified: true, cycleCount: 2 } : {}), ...(heapRequired ? { heapCapabilityVerified: true, heap } : {}), lifecycleVerified: true, receiptSha256: hash(read('receipt.json')), reportSha256: hash(read('gameplay-frames.json')),
    phaseCount: threeCycles ? 15 : matched ? 10 : 5, lifecycle: recomputed, scope: threeCycles ? gameplayThreeCycleProtocol.interpretation : matched ? gameplayMatchedProtocol.interpretation : heapRequired ? 'one-cycle-lifecycle-and-isolate-byte-capability-not-retention-comparison' : 'one-cycle-cleanup-and-counts-not-ram-or-plateau', visualReview: 'required' }
}
// Caller first binds upload to the exact current job log and API metadata; never follow candidate URLs.
export function resolveGameplayResourceArtifact(archive, upload, expected) {
  positive(upload.id); assert.equal(upload.name, `gameplay-resource-lifecycle-browser-${expected.identity.mergeSha}`)
  assert.equal(archive.length, upload.bytes); assert.ok(archive.length <= gameplayResourceArchiveLimit)
  assert.equal(hash(archive), upload.sha256)
  const allowed = new Set([...requiredFiles(expected.policy), 'build.log'])
  const files = Object.fromEntries(readArtifactZip(archive, { maxArchiveBytes: gameplayResourceArchiveLimit,
    maxFileBytes: 32 * 1024 * 1024, maxTotalBytes: 96 * 1024 * 1024, maxEntries: allowed.size, allowName: name => allowed.has(name) }))
  return validateGameplayResourceArtifact(files, expected)
}

const ownershipOwners = ['scene', 'globe', 'terrain', 'terrain.geometry']
const ownershipSlots = ['terrain.position', 'terrain.uv', 'terrain.landUv', 'terrain.surface', 'terrain.light', 'terrain.highlight',
  'terrain.index', 'globe.atlas.pixels', 'globe.map.image.data']
const ownershipInterpretation = 'weak-wrapper-survival-and-registered-buffer-lengths-not-retained-backing-attribution'
const ownershipLimits = 'two-retirements-four-owners-nine-buffer-slots-each; no-cache-export-external-string-GPU-process-accounting'
const exactKeys = (value, keys) => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort())
}
const natural = value => assert.ok(Number.isSafeInteger(value) && value >= 0)
const finiteTime = value => assert.ok(Number.isFinite(value) && value >= 0)
function validateOwnershipSlots(slots, bufferCount) {
  assert.deepEqual(slots.map(slot => slot.label), ownershipSlots)
  for (const slot of slots) {
    assert.ok(['registered', 'missing', 'unsupported', 'absent-optional'].includes(slot.status))
    exactKeys(slot, slot.status === 'registered' ? ['label', 'status', 'bufferId'] : ['label', 'status'])
    if (slot.status === 'registered') { natural(slot.bufferId); assert.ok(slot.bufferId < bufferCount) }
    if (slot.status === 'absent-optional') assert.equal(slot.label, 'terrain.index')
  }
  assert.deepEqual([...new Set(slots.filter(s => s.status === 'registered').map(s => s.bufferId))].sort((a,b) => a-b),
    Array.from({ length: bufferCount }, (_, index) => index))
}
export function rejectGameplayOwnershipEvidence(raw, report) {
  if (Array.isArray(raw.command)) assert.ok(!raw.command.some(value => typeof value === 'string' && value.startsWith('--gameplay-ownership-probe')), 'Historical policy cannot carry ownership command')
  for (const key of ['gameplayOwnershipProbe', 'gameplayOwnershipSelection']) assert.equal(Object.hasOwn(raw, key), false, 'Historical policy cannot carry ownership markers')
  assert.equal(Object.hasOwn(report, 'ownershipProbe'), false)
  for (const restart of [...(report.resources?.restarts ?? []), ...(report.resources?.restart ? [report.resources.restart] : [])])
    assert.equal(Object.hasOwn(restart, 'ownershipRegistration'), false)
  for (const sample of report.resources?.heap?.samples ?? []) {
    assert.equal(Object.hasOwn(sample, 'ownership'), false); assert.equal(Object.hasOwn(sample, 'ownershipTiming'), false)
  }
}
export function validateGameplayOwnershipEvidence(raw, report, headSha) {
  assert.match(headSha, /^[a-f0-9]{40}$/)
  assert.equal(raw.gameplayOwnershipProbe, 'weak-v1')
  assert.deepEqual(raw.gameplayOwnershipSelection, { version: 1, mode: 'weak-v1', event: 'pull_request',
    action: 'ready_for_review', headSha, label: `weak-v1:${headSha}`, scenario: 'gameplay-resources' })
  assert.deepEqual(report.ownershipProbe, { version: 1, scope: 'bounded-retired-wrapper-survival-only' })
  const restarts = report.resources.restarts, samples = report.resources.heap.samples
  assert.equal(restarts.length, 2); assert.equal(samples.length, 3)
  const bounded = { marker: report.ownershipProbe, registrations: restarts.map(r => r.ownershipRegistration),
    samples: samples.map(s => ({ ownership: s.ownership, timing: s.ownershipTiming })) }
  assert.ok(Buffer.byteLength(JSON.stringify(bounded)) <= 65536, 'Ownership diagnostic exceeds bounded output')
  for (const [index, restart] of restarts.entries()) {
    const registration = restart.ownershipRegistration
    exactKeys(registration, ['retirement', 'registeredOwners', 'registeredBuffers', 'slots'])
    assert.equal(registration.retirement, index + 1)
    natural(registration.registeredOwners); assert.ok(registration.registeredOwners <= 4)
    natural(registration.registeredBuffers); assert.ok(registration.registeredBuffers <= 9)
    validateOwnershipSlots(registration.slots, registration.registeredBuffers)
  }
  for (const [index, sample] of samples.entries()) {
    assert.equal(sample.boundary, `after-cycle-${index + 1}-workload`)
    exactKeys(sample.ownershipTiming, ['startedMs', 'completedMs'])
    for (const value of Object.values(sample.ownershipTiming)) finiteTime(value)
    assert.ok(sample.ownershipTiming.startedMs >= sample.timing.heapReadCompletedMs)
    assert.ok(sample.ownershipTiming.completedMs >= sample.ownershipTiming.startedMs)
    assert.ok(sample.ownershipTiming.completedMs <= sample.timing.endedMs)
    const diagnostic = sample.ownership
    exactKeys(diagnostic, ['version', 'interpretation', 'limits', 'records'])
    assert.equal(diagnostic.version, 1); assert.equal(diagnostic.interpretation, ownershipInterpretation); assert.equal(diagnostic.limits, ownershipLimits)
    assert.deepEqual(diagnostic.records.map(record => record.retirement), Array.from({ length: index }, (_, i) => i + 1))
    for (const record of diagnostic.records) {
      exactKeys(record, ['retirement', 'owners', 'slots', 'buffers', 'complete', 'survivingBufferCount', 'survivingRegisteredByteLengths'])
      const registration = restarts[record.retirement - 1].ownershipRegistration
      assert.deepEqual(record.owners.map(owner => owner.label), ownershipOwners)
      for (const owner of record.owners) {
        exactKeys(owner, ['label', 'status', 'survival']); assert.ok(['registered', 'missing'].includes(owner.status))
        assert.ok((owner.status === 'registered' ? ['alive', 'collected'] : ['unavailable']).includes(owner.survival))
      }
      assert.equal(record.owners.filter(o => o.status === 'registered').length, registration.registeredOwners)
      assert.equal(record.buffers.length, registration.registeredBuffers)
      validateOwnershipSlots(record.slots, record.buffers.length); assert.deepEqual(record.slots, registration.slots)
      for (const [id, buffer] of record.buffers.entries()) {
        exactKeys(buffer, ['id', 'registeredByteLength', 'survival', 'currentByteLength', 'byteLengthChanged'])
        assert.equal(buffer.id, id); natural(buffer.registeredByteLength)
        assert.ok(['alive', 'collected'].includes(buffer.survival))
        if (buffer.survival === 'collected') { assert.equal(buffer.currentByteLength, null); assert.equal(buffer.byteLengthChanged, null) }
        else { natural(buffer.currentByteLength); assert.equal(buffer.byteLengthChanged, buffer.currentByteLength !== buffer.registeredByteLength) }
      }
      assert.equal(record.complete, record.owners.every(o => o.status === 'registered') && record.slots.every(s => ['registered', 'absent-optional'].includes(s.status)))
      assert.equal(record.survivingBufferCount, record.buffers.filter(b => b.survival === 'alive').length)
      natural(record.survivingRegisteredByteLengths)
      assert.equal(record.survivingRegisteredByteLengths, record.buffers.reduce((n,b) => n + (b.survival === 'alive' ? b.registeredByteLength : 0), 0))
      // The same retired record may recur at later boundaries. Never sum records
      // across retirements: their buffers may alias and ownership is not exclusive.
      const previous = index > 1 ? samples[index - 1].ownership.records.find(r => r.retirement === record.retirement) : undefined
      if (previous) {
        assert.deepEqual(record.owners.map(o => [o.label,o.status]), previous.owners.map(o => [o.label,o.status]))
        assert.deepEqual(record.buffers.map(b => [b.id,b.registeredByteLength]), previous.buffers.map(b => [b.id,b.registeredByteLength]))
        for (const [i, owner] of previous.owners.entries()) if (owner.survival === 'collected') assert.equal(record.owners[i].survival, 'collected')
        for (const [i, buffer] of previous.buffers.entries()) if (buffer.survival === 'collected') assert.equal(record.buffers[i].survival, 'collected')
      }
    }
  }
  return { protocolVerified: true, coverageComplete: samples.every(s => s.ownership.records.every(r => r.complete)),
    sampleCount: 3, retirementCount: 2, scope: ownershipInterpretation, aggregation: 'per-retirement-only-no-cross-record-byte-total' }
}
