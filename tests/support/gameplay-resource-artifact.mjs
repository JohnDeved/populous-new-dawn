// Synthetic data-only fixtures; never hosted runtime acceptance.
import { createHash } from 'node:crypto'
import { FramePerformance } from '../../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../../app/pointer-frame-metrics.ts'
import { gameplayFramePlan as plan, gameplayFrameLimits, summarizeGameplayPhase } from '../../scripts/tutorial-browser/gameplay-frame-evidence.mjs'
import { gameplayResourceLimits, summarizeResourceRestart } from '../../scripts/tutorial-browser/gameplay-resource-observer.mjs'
import { gameplayResourceSplitBudget } from '../../scripts/tutorial-browser/scenario-policy.mjs'
import { GAMEPLAY_OWNERSHIP_POLICY, GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_MATCHED_POLICY, gameplayResourceInputs } from '../../scripts/integration-queue/gameplay-resources-policy.mjs'
import { gameplayHeapPolicy, gameplayHeapLimits, gameplayHeapResourceLimits, gameplayMatchedHeapPolicy, gameplayMatchedHeapLimits, gameplayMatchedProtocol, summarizeGameplayMatchedWorkload } from '../../scripts/tutorial-browser/gameplay-heap-observer.mjs'
import { gameplayThreeCycleProfile, gameplayThreeCycleArgument } from '../../scripts/tutorial-browser/gameplay-resource-profile.mjs'
import { gameplayThreeCycleHeapPolicy, gameplayThreeCycleHeapLimits, gameplayThreeCycleProtocol, gameplayThreeCycleResourceLimits, summarizeGameplayThreeCycleWorkload, validateGameplayThreeCycleHeapProbe } from '../../scripts/tutorial-browser/gameplay-heap-observer.mjs'
const revision = 'a'.repeat(40), hash = bytes => createHash('sha256').update(bytes).digest('hex')
function frameFixture(route = 'world') {
  const ring = new FramePerformance()
  for (let i = 0; i < 18; i++) {
    const pointer = createPointerFrameMetrics(true)
    Object.assign(pointer.interaction, { route, pointerMoved: true, viewChanged: true })
    pointer.terrainPickCalls = 1; pointer.objectPickCalls = 1
    pointer.nativeOcclusion.submittedTriangles = 5
    pointer.ordinaryTerrain.visitedTriangles = 7
    // Quantized zero CPU time is valid. Work is established by counters, not timers.
    ring.sample(100, 0, 0, 12, 0, 0, (i + 1) * 100, 'live', pointer)
  }
  const frames = ring.recentFrames()
  const before = { timestampMs: 100, timeOriginUnixMs: 10000, level: 2, turn: 1,
    paused: false, inputMask: 0, speed: 1, sameScene: true, camera: { x: 0, y: 0, angle: 0 },
    viewport: plan.viewport, visibility: 'visible' }
  const after = { ...before, timestampMs: 1700, turn: 40, camera: { x: 1, y: 1, angle: 1 } }
  const raw = { schema: 'populous-new-dawn/frame-performance', schemaVersion: 1, buildRevision: revision,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    session: { level: 2 }, environment: { viewportCssPixels: plan.viewport, devicePixelRatio: 1, visibility: 'visible' },
    timing: { timeOriginUnixMs: 10000, capacityFrames: 1200, count: frames.length,
      startTimestampMs: 0, endTimestampMs: 1800, capturedSpanMs: 1800 }, frames }
  return { raw, before, after }
}
const live = (turn, timestampMs, sceneUuid = 'old') => ({ level: 2, turn, timestampMs, timeOriginUnixMs: 10000, sceneUuid,
 paused: false, inputMask: 0, speed: 1, visibility: 'visible', disposed: false, aborted: false, canvasConnected: true,
 connectedBattlefieldCanvases: 1, contextLost: false, rendererGeometries: 4, rendererTextures: 3, rendererPrograms: 2,
 reachableGeometryIds: ['shared'], reachableTextureIds: ['shared'], reachableMaterialIds: ['material'] })
const encode = value => Buffer.from(JSON.stringify(value))
export function makeResourceFixture(policy = GAMEPLAY_RESOURCE_POLICY, { includeArchive = true } = {}) {
 const expected = { policy, identity: { headSha: 'b'.repeat(40), baseSha: 'c'.repeat(40), mergeSha: revision, runId: '12', runAttempt: '2' },
  inputs: Object.fromEntries(gameplayResourceInputs(policy).map(name => [name, hash(name)])) }
 const resources = { version: 1, status: 'passed-scoped-lifecycle-observations', limits: gameplayResourceLimits,
  beforeWarmup: live(1, 0), afterWorkload: live(200, 14000), restart: { retired: { disposed: true, aborted: true,
   canvasConnected: false, contextLost: true, ownedSoundCount: 0, buildingPanelCount: 0, fpsGraphReleased: true },
   after: live(1, 15000, 'new'), settled: live(25, 17000, 'new') } }
 Object.assign(resources.restart, summarizeResourceRestart(resources.afterWorkload, resources.restart.retired, resources.restart.after, resources.restart.settled))
 if (policy !== GAMEPLAY_RESOURCE_POLICY) {
  resources.version = 2; resources.status = 'passed-scoped-lifecycle-and-heap-capability'; resources.limits = gameplayHeapResourceLimits
  const sample = (boundary, at, scene, turn, clock) => ({ status: 'passed', boundary, scope: gameplayHeapPolicy.scope,
   gc: { method: 'HeapProfiler.collectGarbage', calls: 1, completed: true }, f8Hidden: true, isolateBefore: 'isolate', isolateAfter: 'isolate',
   bytes: { usedSize: 100, totalSize: 200, embedderHeapUsedSize: 50, backingStorageSize: 300 },
   timing: { startedMs: clock, gcStartedMs: clock+1, gcCompletedMs: clock+2, heapReadCompletedMs: clock+3, endedMs: clock+4 },
   before: live(turn, at, scene), after: live(turn, at+1, scene) })
  resources.heap = { version: 1, status: 'passed-capability-only', policy: gameplayHeapPolicy, limits: gameplayHeapLimits, sessionDetached: true,
   samples: [sample('after-workload',14001,'old',200,1), sample('after-restart-settled',17001,'new',25,6)] }
 }
 const report = { schema: 'populous-new-dawn/gameplay-frame-recording', schemaVersion: 1, status: 'passed', expectedRevision: revision,
  plan, limits: gameplayFrameLimits, measuredPhases: plan.phases.map(p => p.name), phases: [], resources,
  warmupBefore: { ...frameFixture().before, turn: 1, timestampMs: 0 }, warmupAfter: { ...frameFixture().before, turn: 25, timestampMs: 2000 }, menuBefore: { ...frameFixture().before, paused: true, timestampMs: 10000 }, menuAfter: { ...frameFixture().before, timestampMs: 10200 }, after: { ...frameFixture().after, timestampMs: 13900 } }
 const files = { 'gameplay-frames-final.png': Buffer.from([137,80,78,71,13,10,26,10]) }
 for (const [index, phase] of plan.phases.entries()) {
  const { raw, before, after } = frameFixture(phase.route), offset = 2000 + index * 2200
  for (const frame of raw.frames) frame.timestampMs += offset
  for (const key of ['startTimestampMs', 'endTimestampMs']) raw.timing[key] += offset
  before.timestampMs += offset; after.timestampMs += offset
  const rawFile = `gameplay-frame-${phase.name}.json`, summaryFile = `gameplay-summary-${phase.name}.json`
  files[rawFile] = encode(raw)
  const summary = summarizeGameplayPhase(files[rawFile].toString(), phase, before, after, revision); files[summaryFile] = encode(summary)
  const point = { x: 100, y: 100 }, commands = phase.moving ? plan.pointerOffsets.map(([dx,dy],i) => ({ offsetMs: i * plan.pointerIntervalMs, action: 'move', x: point.x+dx, y: point.y+dy })) : phase.camera ? plan.cameraInputs : []
  report.phases.push({ name: phase.name, status: 'passed', before, after, rawFile, summaryFile, point,
   inputs: commands.map(command => ({ ...command, observedTimestampMs: before.timestampMs + command.offsetMs })),
   rawSha256: summary.rawSha256, turnsAdvanced: summary.turnsAdvanced, work: summary.work, frameCount: summary.analysis.sampleCount })
 }
 if ([GAMEPLAY_MATCHED_POLICY, GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(policy)) makeMatchedCycles(report, files)
 if ([GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(policy)) makeThreeCycles(report, files)
 const raw = { status: 'passed', selectedScenario: 'gameplay-resources', source: { commit: revision, files: expected.inputs }, buildRevision: revision,
  github: { head: expected.identity.headSha, base: expected.identity.baseSha, merge: revision, runId: '12', runAttempt: '2' },
  build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 }, browserCapMs: 180000, browserTimedOut: false,
  sourceAfter: 'identical', cleanupVerified: true, errors: [], dependencyChanges: [], dependenciesBeforeSha256: 'e'.repeat(64), dependenciesAfterSha256: 'e'.repeat(64),
  browserSha256: 'd'.repeat(64), browserBinaryVersion: 'Google Chrome synthetic fixture', buildPackageVersions: { 'playwright-core': '1.63.0-fixture' },
  browserPath: '/opt/google/chrome/chrome', launch: { channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true, args: ['--headless','--remote-debugging-pipe'], timeout: 30000 },
  gameplayResourceSplitBudget, gameplayResources: report }
 if ([GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(policy)) Object.assign(raw, { gameplayResourceProfile: gameplayThreeCycleProfile,
  command: ['/usr/bin/node', '/repo/scripts/tutorial-browser/run.mjs', 'outputs/tutorial-browser', gameplayThreeCycleArgument] })
 if (policy === GAMEPLAY_OWNERSHIP_POLICY) makeOwnership(report, raw, expected.identity.headSha)
 const save = () => { files['receipt.json'] = encode(raw); files['gameplay-frames.json'] = encode(report) }; save()
 // Direct-validator mutation fixtures need exact file buffers, not an unused ZIP copy.
 if (!includeArchive) return { expected, files, raw, report, save }
 const archive = artifactZip(files), upload = { id: 42, name: `gameplay-resource-lifecycle-browser-${revision}`, bytes: archive.length, sha256: hash(archive) }
 const url = 'https://api.github.com/repos/JohnDeved/populous-new-dawn/actions/artifacts/42'
 const metadata = { id: upload.id, name: upload.name, expired: false, size_in_bytes: upload.bytes, digest: `sha256:${upload.sha256}`, url, archive_download_url: `${url}/zip`, workflow_run: { id: 12, head_sha: expected.identity.headSha } }
 const uploadLog = `Artifact ${upload.name} has been successfully uploaded! Final size is ${upload.bytes} bytes. Artifact ID is 42\nArtifact ${upload.name}.zip successfully finalized. Artifact ID 42\nSHA256 digest of uploaded artifact zip is ${upload.sha256}`
 return { expected, files, raw, report, save, archive, upload, metadata, uploadLog }
}
export function artifactZip(files) {
 const locals=[], centrals=[];let offset=0
 for(const [name,bytes] of Object.entries(files)) {
  const filename=Buffer.from(name);let crc=0xffffffff
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(bytes.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(filename.length,26)
  locals.push(local,filename,bytes)
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt32LE(crc,16);central.writeUInt32LE(bytes.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42)
  centrals.push(central,filename);offset+=local.length+filename.length+bytes.length
 }
 const directory=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16)
 return Buffer.concat([...locals,directory,end])
}

function makeMatchedCycles(report, files) {
 const first = { id: 'cycle-1', startup: { level: 2, action: 'skip' }, phases: report.phases,
  resources: { beforeWarmup: report.resources.beforeWarmup, afterWorkload: report.resources.afterWorkload } }
 for (const key of ['warmupBefore', 'warmupAfter', 'menuBefore', 'menuAfter', 'after']) {
  first[key] = report[key]; delete report[key]
 }
 first.pointerReset = { x: 900, y: 400, observedTimestampMs: 0 }
 const second = structuredClone(first); second.id = 'cycle-2'
 second.pointerReset.observedTimestampMs = 18000
 for (const key of ['warmupBefore', 'warmupAfter', 'menuBefore', 'menuAfter', 'after']) {
  second[key].timestampMs += 18000; second[key].turn += 25
 }
 second.resources = { beforeWarmup: live(25, 18000, 'new'), afterWorkload: live(225, 32000, 'new') }
 for (const [index, phase] of plan.phases.entries()) {
  const original = first.phases[index], next = second.phases[index]
  const bytes = files[original.rawFile], raw = JSON.parse(bytes)
  if (phase.nativeWork) { original.point.id = 5; next.point.id = 6 }
  for (const frame of raw.frames) {
   frame.timestampMs += 18000
   frame.pointerBreakdown.nativeOcclusion.submittedTriangles += 1
  }
  for (const key of ['startTimestampMs', 'endTimestampMs']) raw.timing[key] += 18000
  next.before.timestampMs += 18000; next.after.timestampMs += 18000
  next.before.turn += 3; next.after.turn += 7 // Deliberately different observed turns, same recipe.
  for (const command of next.inputs) command.observedTimestampMs += 18000
  next.rawFile = `cycle-2-${original.rawFile}`; next.summaryFile = `cycle-2-${original.summaryFile}`
  files[next.rawFile] = encode(raw)
  const summary = summarizeGameplayPhase(files[next.rawFile].toString(), phase, next.before, next.after, revision)
  files[next.summaryFile] = encode(summary)
  Object.assign(next, { rawSha256: summary.rawSha256, turnsAdvanced: summary.turnsAdvanced,
   frameCount: summary.analysis.sampleCount, work: summary.work })
  for (const key of ['rawFile', 'summaryFile']) {
   files[`cycle-1-${original[key]}`] = files[original[key]]; delete files[original[key]]
   original[key] = `cycle-1-${original[key]}`
  }
 }
 for (const cycle of [first, second]) {
  cycle.screenshotFile = `${cycle.id}-gameplay-frames-final.png`
  files[cycle.screenshotFile] = files['gameplay-frames-final.png']
 }
 delete files['gameplay-frames-final.png']; delete report.phases
 report.schemaVersion = 2; report.protocol = gameplayMatchedProtocol; report.cycles = [first, second]
 report.observedWorkloadComparison = summarizeGameplayMatchedWorkload(report.cycles)
 report.resources.version = 3; report.resources.status = 'passed-two-cycle-matched-protocol'
 delete report.resources.beforeWarmup; delete report.resources.afterWorkload
 Object.assign(report.resources.heap, { version: 2, status: 'passed-two-cycle-descriptive-observations',
  policy: gameplayMatchedHeapPolicy, limits: gameplayMatchedHeapLimits })
 report.resources.heap.samples.forEach((sample, index) => { sample.boundary = gameplayMatchedHeapPolicy.boundaries[index] })
 Object.assign(report.resources.heap.samples[1], { before: live(225, 32001, 'new'), after: live(225, 32002, 'new'),
  bytes: { usedSize: 137, totalSize: 200, embedderHeapUsedSize: 40, backingStorageSize: 300 } })
}

function makeThreeCycles(report, files) {
 const third = structuredClone(report.cycles[0]); third.id = 'cycle-3'
 third.pointerReset.observedTimestampMs = 36000
 for (const key of ['warmupBefore', 'warmupAfter', 'menuBefore', 'menuAfter', 'after']) {
  third[key].timestampMs += 36000; third[key].turn += 50
 }
 third.resources = { beforeWarmup: live(50, 36000, 'third'), afterWorkload: live(250, 50000, 'third') }
 for (const [index, phase] of plan.phases.entries()) {
  const next = third.phases[index], raw = JSON.parse(files[next.rawFile])
  if (phase.nativeWork) next.point.id = 7
  for (const frame of raw.frames) {
   frame.timestampMs += 36000; frame.pointerBreakdown.nativeOcclusion.submittedTriangles += 2
  }
  for (const key of ['startTimestampMs', 'endTimestampMs']) raw.timing[key] += 36000
  next.before.timestampMs += 36000; next.after.timestampMs += 36000
  next.before.turn += 6; next.after.turn += 14
  for (const command of next.inputs) command.observedTimestampMs += 36000
  next.rawFile = next.rawFile.replace('cycle-1-', 'cycle-3-')
  next.summaryFile = next.summaryFile.replace('cycle-1-', 'cycle-3-')
  files[next.rawFile] = encode(raw)
  const summary = summarizeGameplayPhase(files[next.rawFile].toString(), phase, next.before, next.after, revision)
  files[next.summaryFile] = encode(summary)
  Object.assign(next, { rawSha256: summary.rawSha256, turnsAdvanced: summary.turnsAdvanced,
   frameCount: summary.analysis.sampleCount, work: summary.work })
 }
 third.screenshotFile = 'cycle-3-gameplay-frames-final.png'
 files[third.screenshotFile] = files['cycle-1-gameplay-frames-final.png']
 report.cycles.push(third)
 report.schemaVersion = 3; report.resourceProfile = gameplayThreeCycleProfile; report.protocol = gameplayThreeCycleProtocol
 report.observedWorkloadComparison = summarizeGameplayThreeCycleWorkload(report.cycles)
 const resources = report.resources
 Object.assign(resources, { version: 4, status: 'passed-three-cycle-protocol', limits: gameplayThreeCycleResourceLimits })
 const first = { ...resources.restart, fromCycle: 'cycle-1', toCycle: 'cycle-2' }
 const second = { fromCycle: 'cycle-2', toCycle: 'cycle-3', retired: structuredClone(first.retired),
  after: live(1, 33000, 'third'), settled: live(25, 35000, 'third') }
 Object.assign(second, summarizeResourceRestart(report.cycles[1].resources.afterWorkload, second.retired, second.after, second.settled))
 resources.restarts = [first, second]; delete resources.restart
 Object.assign(resources.heap, { version: 3, status: 'passed-three-cycle-descriptive-observations',
  policy: gameplayThreeCycleHeapPolicy, limits: gameplayThreeCycleHeapLimits })
 const sample = structuredClone(resources.heap.samples[1])
 Object.assign(sample, { boundary: 'after-cycle-3-workload', before: live(250, 50001, 'third'), after: live(250, 50002, 'third'),
  timing: { startedMs: 11, gcStartedMs: 12, gcCompletedMs: 13, heapReadCompletedMs: 14, endedMs: 15 },
  bytes: { usedSize: 149, totalSize: 240, embedderHeapUsedSize: 35, backingStorageSize: 310 } })
 resources.heap.samples.push(sample)
 resources.heap.deltas = validateGameplayThreeCycleHeapProbe(resources.heap, resources, report.cycles)
}

function makeOwnership(report, raw, headSha) {
 raw.gameplayOwnershipProbe = 'weak-v1'
 raw.gameplayOwnershipSelection = { version: 1, mode: 'weak-v1', event: 'pull_request', action: 'ready_for_review', headSha, label: `weak-v1:${headSha}`, scenario: 'gameplay-resources' }
 raw.command.push('--gameplay-ownership-probe=weak-v1')
 report.ownershipProbe = { version: 1, scope: 'bounded-retired-wrapper-survival-only' }
 const slots = ['position','uv','landUv','surface','light','highlight'].map(name => ({label:`terrain.${name}`,status:'registered',bufferId:0}))
 slots.push({label:'terrain.index',status:'absent-optional'}, {label:'globe.atlas.pixels',status:'registered',bufferId:1}, {label:'globe.map.image.data',status:'registered',bufferId:1})
 const records = [1,2].map(retirement => ({ retirement,
  owners: ['scene','globe','terrain','terrain.geometry'].map(label => ({label,status:'registered',survival:'alive'})), slots,
  buffers: [64,128].map((registeredByteLength,id) => ({id,registeredByteLength,survival:'alive',currentByteLength:registeredByteLength,byteLengthChanged:false})),
  complete:true,survivingBufferCount:2,survivingRegisteredByteLengths:192 }))
 for(const [index,restart] of report.resources.restarts.entries()) restart.ownershipRegistration = {retirement:index+1,registeredOwners:4,registeredBuffers:2,slots:structuredClone(slots)}
 for(const [index,sample] of report.resources.heap.samples.entries()) {
  sample.ownershipTiming = { startedMs: sample.timing.heapReadCompletedMs, completedMs: sample.timing.heapReadCompletedMs + 0.5 }
  sample.ownership = {version:1,interpretation:'weak-wrapper-survival-and-registered-buffer-lengths-not-retained-backing-attribution',limits:'two-retirements-four-owners-nine-buffer-slots-each; no-cache-export-external-string-GPU-process-accounting',records:structuredClone(records.slice(0,index))}
 }
}
