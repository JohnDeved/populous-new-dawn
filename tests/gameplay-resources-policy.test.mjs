import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_RESOURCE_BROWSER_JOBS, GAMEPLAY_RESOURCE_INPUTS, GAMEPLAY_HEAP_INPUTS,
 validateGameplayResourceBrowserJobs, validateGameplayResourceArtifact, gameplayResourceArtifactUpload,
 validateGameplayResourceArtifactMetadata, resolveGameplayResourceArtifact } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
import { makeResourceFixture as artifactFixture } from './support/gameplay-resource-artifact.mjs'
const directFixture = policy => artifactFixture(policy, { includeArchive: false })
const revision = 'a'.repeat(40), hash = bytes => createHash('sha256').update(bytes).digest('hex'), encode = value => Buffer.from(JSON.stringify(value))
function jobFixture() {
 const run = { id: 12, run_attempt: 2, check_suite_id: 3, head_sha: revision, status: 'completed', conclusion: 'success' }
 const jobs = GAMEPLAY_RESOURCE_BROWSER_JOBS.map(([,name,,buildStep],i) => ({ id: i+100, run_id: 12, run_attempt: 2, head_sha: revision,
  name, status: 'completed', conclusion: 'success', steps: ['Require a ready pull request','Check out exact proposed merge','Set up Node',
   'Install locked dependencies and verify supported Chrome','Record exact tested source',buildStep,'Reject tracked input mutation','Retain bounded validation receipts and screenshots'].map(name => ({ name, conclusion: 'success' })) }))
 return { run, jobs, expected: { policy: GAMEPLAY_RESOURCE_POLICY, headSha: revision } }
}
test('explicit nine-job inventory passes without redefining historical eight', () => {
 const { run,jobs,expected } = jobFixture(); assert.equal(validateGameplayResourceBrowserJobs(jobs,run,expected),true)
 assert.equal(GAMEPLAY_RESOURCE_BROWSER_JOBS.length,9)
})
test('inventory rejects wrong policy, missing, duplicate, failed, wrong-head and wrong-attempt jobs', () => {
 for (const mutate of [v=>{v.expected.policy='profile-split-v1'},v=>v.jobs.pop(),v=>v.jobs.push(v.jobs[0]),v=>{v.jobs[0].id=v.jobs[1].id},
  v=>{v.jobs[0].head_sha='f'.repeat(40)},v=>{v.jobs[0].run_attempt=1},v=>{v.jobs[7].conclusion='failure'},v=>{v.jobs[7].steps.pop()},v=>{v.jobs[7].name='Spell visuals browser'}]) {
  const v=jobFixture(); mutate(v); assert.throws(()=>validateGameplayResourceBrowserJobs(v.jobs,v.run,v.expected))
 }
})
test('synthetic artifact recomputes five raw captures and one restart, without RAM claim', () => {
 const v=artifactFixture(), result=validateGameplayResourceArtifact(v.files,v.expected)
 assert.equal(result.lifecycleVerified,true); assert.equal(result.phaseCount,5); assert.equal(result.lifecycle.memoryBytes,'not-measured')
 assert.equal(result.receiptSha256,hash(v.files['receipt.json']))
 assert.deepEqual(resolveGameplayResourceArtifact(v.archive,v.upload,v.expected),result)
})
test('artifact rejects stale identity, sources, failed cleanup, cap drift and partial phase claims', () => {
 for (const mutate of [v=>{v.raw.github.runAttempt='1'},v=>{v.raw.source.files={...v.raw.source.files,[GAMEPLAY_RESOURCE_INPUTS[0]]:'f'.repeat(64)}},
  v=>{v.raw.status='failed'},v=>{v.raw.cleanupVerified=false},v=>{v.raw.browserTimedOut=true},v=>{v.raw.browserCapMs=360000},
  v=>{v.report.phases.pop()},v=>{v.report.measuredPhases.pop()},v=>{v.report.phases[0].inputs=[]},v=>{v.report.resources.restart.retired.disposed=false},
  v=>{v.report.resources.restart.settled.turn=1},v=>{v.report.resources.restart.after.sceneUuid='old'},v=>{v.report.resources.restart.after.timeOriginUnixMs++},
  v=>{v.report.resources.restart.reusedReachableGeometryIdentities=999},v=>{v.report.resourceObserverCleanupFailure='failed'}]) {
  const v=directFixture(); mutate(v); v.save(); assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected))
 }
})
test('green summaries cannot replace missing or tampered raw phase evidence', () => {
 for (const [index, mutate] of [v=>delete v.files['gameplay-frame-hud.json'],v=>{v.files['extra.json']=encode({})},v=>{
  const raw=JSON.parse(v.files['gameplay-frame-world-hover.json']);raw.frames.forEach(f=>{f.sceneDrawCalls=0});v.files['gameplay-frame-world-hover.json']=encode(raw)
 },v=>{v.files['gameplay-summary-hud.json']=encode({status:'passed'})}].entries()) {
  const v=directFixture();mutate(v)
  assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected), index === 3
   ? { message: 'Stored gameplay phase summary differs from recomputed raw evidence' } : undefined)
 }
})
test('upload binding rejects duplicate log lines, wrong metadata and corrupt archive', () => {
 const name=`gameplay-resource-lifecycle-browser-${revision}`, digest='f'.repeat(64)
 const log=`Artifact ${name} has been successfully uploaded! Final size is 100 bytes. Artifact ID is 42\nArtifact ${name}.zip successfully finalized. Artifact ID 42\nSHA256 digest of uploaded artifact zip is ${digest}`
 const upload=gameplayResourceArtifactUpload(log,revision)
 assert.equal(upload.id,42);assert.throws(()=>gameplayResourceArtifactUpload(log+'\n'+log,revision))
 const identity={repository:'JohnDeved/populous-new-dawn',runId:'12',headSha:revision},url='https://api.github.com/repos/JohnDeved/populous-new-dawn/actions/artifacts/42'
 const metadata={id:42,name,expired:false,size_in_bytes:100,digest:`sha256:${digest}`,url,archive_download_url:`${url}/zip`,workflow_run:{id:12,head_sha:revision}}
 assert.equal(validateGameplayResourceArtifactMetadata(metadata,upload,identity),true)
 for (const edit of [{expired:true},{digest:'sha256:'+'a'.repeat(64)},{workflow_run:{id:11,head_sha:revision}},{archive_download_url:'https://example.invalid'}])
  assert.throws(()=>validateGameplayResourceArtifactMetadata({...metadata,...edit},upload,identity))
 assert.throws(()=>resolveGameplayResourceArtifact(Buffer.alloc(100),upload,artifactFixture().expected))
})

test('v1 retains exact historical inputs and counts-only meaning; v2 requires explicit byte proof', () => {
 const light=directFixture(GAMEPLAY_HEAP_POLICY)
 assert.equal(light.archive,undefined); assert.equal(light.upload,undefined); assert.equal(light.metadata,undefined)
 assert.equal(validateGameplayResourceArtifact(light.files,light.expected).heapCapabilityVerified,true)
 assert.equal(GAMEPLAY_RESOURCE_INPUTS.length, 32)
 assert.deepEqual(GAMEPLAY_HEAP_INPUTS, [...GAMEPLAY_RESOURCE_INPUTS, 'scripts/tutorial-browser/gameplay-heap-observer.mjs'])
 const legacy=artifactFixture(), historical=validateGameplayResourceArtifact(legacy.files,legacy.expected)
 assert.equal(historical.heapCapabilityVerified,undefined)
 assert.equal(historical.scope,'one-cycle-cleanup-and-counts-not-ram-or-plateau')
 const v=artifactFixture(GAMEPLAY_HEAP_POLICY), result=validateGameplayResourceArtifact(v.files,v.expected)
 assert.equal(result.heapCapabilityVerified,true); assert.equal(result.heap.sampleCount,2)
 // This old summary remains specifically about lifecycle counters, not the separate byte probe.
 assert.equal(result.lifecycle.memoryBytes,'not-measured')
 assert.deepEqual(resolveGameplayResourceArtifact(v.archive,v.upload,v.expected),result)
 const upgraded=artifactFixture(); upgraded.expected.policy=GAMEPLAY_HEAP_POLICY
 assert.throws(()=>validateGameplayResourceArtifact(upgraded.files,upgraded.expected))
 v.expected.policy=GAMEPLAY_RESOURCE_POLICY
 assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected))
})
test('v2 rejects missing, unsupported, inconsistent, unbound or incomplete byte evidence', () => {
 for(const mutate of [
  v=>{delete v.report.resources.heap},v=>{v.report.resources.version=1},
  v=>{v.report.resources.heap.samples.pop()},v=>{v.report.resources.heap.samples.reverse()},
  v=>{v.report.resources.heap.samples[0].status='failed'},v=>{v.report.resources.heap.samples[0].gc.calls=2},
  v=>{v.report.resources.heap.samples[0].gc.completed=false},v=>{v.report.resources.heap.samples[0].f8Hidden=false},
  v=>{delete v.report.resources.heap.samples[0].bytes.backingStorageSize},
  v=>{v.report.resources.heap.samples[0].bytes.usedSize=-1},
  v=>{v.report.resources.heap.samples[0].bytes.usedSize=NaN},
  v=>{v.report.resources.heap.samples[0].bytes.backingStorageSize=null},
  v=>{v.report.resources.heap.samples[0].isolateAfter='other'},
  v=>{v.report.resources.heap.samples[1].isolateBefore='other';v.report.resources.heap.samples[1].isolateAfter='other'},
  v=>{v.report.resources.heap.samples[0].before.sceneUuid='new'},
  v=>{v.report.resources.heap.samples[0].before.timeOriginUnixMs++},
  v=>{v.report.resources.heap.samples[0].before.timestampMs=0},
  v=>{v.report.resources.heap.samples[0].after.timestampMs=16000},
  v=>{v.report.resources.heap.samples[1].before.timestampMs=16000},
  v=>{v.report.resources.heap.samples[0].timing.gcCompletedMs=0},
  v=>{v.report.resources.heap.samples[1].timing.startedMs=0},
  v=>{v.report.resources.heap.sessionDetached=false},
  v=>{v.report.resources.heap.limits=[]},v=>{v.report.heapObserverCleanupFailure='detach failed'},
  v=>{v.raw.browserSha256='unknown'},v=>{delete v.raw.browserBinaryVersion},
  v=>{v.raw.source.files={...v.raw.source.files, 'scripts/tutorial-browser/gameplay-heap-observer.mjs':'f'.repeat(64)}},
 ]) { const v=directFixture(GAMEPLAY_HEAP_POLICY); mutate(v);v.save();assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected)) }
})

import { GAMEPLAY_MATCHED_POLICY, gameplayResourceInputs } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('v3 recomputes all ten cycle-prefixed raw phases and reports differences without claiming a plateau', () => {
 const v=artifactFixture(GAMEPLAY_MATCHED_POLICY), result=validateGameplayResourceArtifact(v.files,v.expected)
 assert.equal(result.matchedCyclesVerified,true); assert.equal(result.phaseCount,10); assert.equal(result.cycleCount,2)
 assert.equal(result.heap.sampleCount,2); assert.equal(result.heap.secondMinusFirstBytes.usedSize,37)
 assert.equal(result.heap.secondMinusFirstBytes.embedderHeapUsedSize,-10)
 assert.equal(result.lifecycle.memoryBytes,'not-measured')
 assert.equal(result.scope,'two-cycle-descriptive-isolate-byte-change-only')
 assert.equal(v.report.observedWorkloadComparison[0].secondMinusFirst.turnsAdvanced,4)
 assert.equal(v.report.observedWorkloadComparison[0].secondMinusFirst.work.nativeTriangles,16)
 assert.equal(v.report.observedWorkloadComparison[0].first.point.id,5)
 assert.equal(v.report.observedWorkloadComparison[0].second.point.id,6)
 assert.deepEqual(gameplayResourceInputs(GAMEPLAY_MATCHED_POLICY),GAMEPLAY_HEAP_INPUTS)
 assert.deepEqual(resolveGameplayResourceArtifact(v.archive,v.upload,v.expected),result)
 for (const policy of [GAMEPLAY_RESOURCE_POLICY,GAMEPLAY_HEAP_POLICY]) {
  const old=directFixture(policy); old.expected.policy=GAMEPLAY_MATCHED_POLICY
  assert.throws(()=>validateGameplayResourceArtifact(old.files,old.expected))
  assert.throws(()=>validateGameplayResourceArtifact(v.files,{...v.expected,policy}))
 }
})
test('v3 rejects incomplete cycles, cross-cycle raw substitution, unmeasured claims and third or early GC samples', () => {
 const mutations=[
  v=>{v.report.cycles.pop()}, v=>{v.report.cycles.reverse()}, v=>{v.report.cycles[1].phases.pop()},
  v=>{delete v.files['cycle-2-gameplay-frame-hud.json']},
  v=>{v.files['cycle-2-gameplay-frame-hud.json']=v.files['cycle-1-gameplay-frame-hud.json']},
  v=>{v.report.cycles[1].phases[0].rawFile='cycle-1-gameplay-frame-world-hover.json'},
  v=>{v.files['cycle-2-gameplay-summary-hud.json']=encode({status:'passed'})},
  v=>{v.files['gameplay-frame-hud.json']=v.files['cycle-1-gameplay-frame-hud.json']},
  v=>{delete v.files['cycle-2-gameplay-frames-final.png']},
  v=>{v.report.cycles[1].phases[0].inputs=[]},
  v=>{delete v.report.cycles[1].phases[0].point.id},
  v=>{v.report.cycles[1].pointerReset.x=901},
  v=>{v.report.cycles[1].pointerReset.observedTimestampMs=16000},
  v=>{const raw=JSON.parse(v.files['cycle-2-gameplay-frame-world-hover.json']);raw.frames.forEach(frame=>{frame.sceneDrawCalls=0});v.files['cycle-2-gameplay-frame-world-hover.json']=encode(raw)},
  v=>{v.report.cycles[1].warmupAfter.turn=v.report.cycles[1].warmupBefore.turn},
  v=>{v.report.cycles[1].resources.beforeWarmup.timeOriginUnixMs++},
  v=>{v.report.cycles[1].resources.beforeWarmup.turn=1},
  v=>{v.report.cycles[1].resources.afterWorkload.turn=64},
  v=>{v.report.cycles[1].resources.afterWorkload.sceneUuid='old'},
  v=>{v.report.resources.heap.samples.push(v.report.resources.heap.samples[1])},
  v=>{v.report.resources.heap.samples[1].boundary='after-restart-settled'},
  v=>{v.report.resources.heap.samples[1].before.timestampMs=17001},
  v=>{v.report.resources.heap.samples[1].gc.calls=2},
  v=>{v.report.resources.heap.samples[1].bytes.usedSize=null},
  v=>{v.report.resources.heap.samples[1].isolateBefore='other'},
  v=>{v.report.resources.heap.sessionDetached=false},
  v=>{v.report.protocol={...v.report.protocol,cycles:3}},
  v=>{v.report.observedWorkloadComparison[0].secondMinusFirst.turnsAdvanced=0},
  v=>{v.raw.browserCapMs=360000}, v=>{v.raw.cleanupVerified=false},
  v=>{v.report.resources.restart.retired.disposed=false},
 ]
 for(const mutate of mutations){const v=directFixture(GAMEPLAY_MATCHED_POLICY);mutate(v);v.save();assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected))}
 const divergent=directFixture(GAMEPLAY_MATCHED_POLICY)
 divergent.raw.gameplayResources=structuredClone(divergent.report)
 divergent.raw.gameplayResources.cycles[1].phases[0].frameCount++
 divergent.save()
 assert.throws(()=>validateGameplayResourceArtifact(divergent.files,divergent.expected),
  {message:'Receipt gameplay resources differ from retained report'})
})

import { GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_THREE_CYCLE_INPUTS, GAMEPLAY_THREE_CYCLE_BROWSER_JOBS } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('v4 recomputes fifteen raw phases, three post-GC samples and both adjacent and endpoint deltas', () => {
 const v = artifactFixture(GAMEPLAY_THREE_CYCLE_POLICY), result = validateGameplayResourceArtifact(v.files, v.expected)
 assert.equal(result.threeCyclesVerified, true); assert.equal(result.matchedCyclesVerified, undefined)
 assert.equal(result.cycleCount, 3); assert.equal(result.phaseCount, 15); assert.equal(result.heap.sampleCount, 3)
 assert.deepEqual(result.heap.cycle2MinusCycle1Bytes, { usedSize: 37, totalSize: 0, embedderHeapUsedSize: -10, backingStorageSize: 0 })
 assert.deepEqual(result.heap.cycle3MinusCycle2Bytes, { usedSize: 12, totalSize: 40, embedderHeapUsedSize: -5, backingStorageSize: 10 })
 assert.deepEqual(result.heap.cycle3MinusCycle1Bytes, { usedSize: 49, totalSize: 40, embedderHeapUsedSize: -15, backingStorageSize: 10 })
 assert.equal(result.lifecycle.length, 2); assert.ok(result.lifecycle.every(value => value.memoryBytes === 'not-measured'))
 assert.equal(result.scope, 'three-cycle-descriptive-isolate-byte-change-only')
 assert.equal(v.report.observedWorkloadComparison.cycle3MinusCycle2[0].secondMinusFirst.turnsAdvanced, 4)
 assert.equal(v.report.observedWorkloadComparison.cycle3MinusCycle2[0].secondMinusFirst.work.nativeTriangles, 16)
 assert.deepEqual(resolveGameplayResourceArtifact(v.archive, v.upload, v.expected), result)
 assert.deepEqual(gameplayResourceInputs(GAMEPLAY_THREE_CYCLE_POLICY), GAMEPLAY_THREE_CYCLE_INPUTS)
 assert.deepEqual(GAMEPLAY_THREE_CYCLE_INPUTS, [...GAMEPLAY_HEAP_INPUTS, 'scripts/tutorial-browser/gameplay-resource-profile.mjs', 'scripts/browser-new-game.mjs',
  'scripts/integration-queue/policy.mjs', 'scripts/integration-queue/github.mjs'])
 assert.equal(GAMEPLAY_RESOURCE_INPUTS.length, 32); assert.equal(GAMEPLAY_HEAP_INPUTS.length, 33)
 for (const policy of [GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_MATCHED_POLICY]) {
  const old = directFixture(policy)
  assert.throws(() => validateGameplayResourceArtifact(old.files, {...old.expected, policy: GAMEPLAY_THREE_CYCLE_POLICY}))
  assert.throws(() => validateGameplayResourceArtifact(v.files, {...v.expected, policy}))
 }
})
test('v4 has an exact new build-step label, while historical job inventories remain unchanged', () => {
 const v = jobFixture(); v.expected.policy = GAMEPLAY_THREE_CYCLE_POLICY
 assert.throws(() => validateGameplayResourceBrowserJobs(v.jobs, v.run, v.expected))
 v.jobs[7].steps.find(step => step.name === GAMEPLAY_RESOURCE_BROWSER_JOBS[7][3]).name = GAMEPLAY_THREE_CYCLE_BROWSER_JOBS[7][3]
 assert.equal(validateGameplayResourceBrowserJobs(v.jobs, v.run, v.expected), true)
 assert.throws(() => validateGameplayResourceBrowserJobs(v.jobs, v.run, {...v.expected, policy: GAMEPLAY_MATCHED_POLICY}))
 assert.deepEqual(GAMEPLAY_THREE_CYCLE_BROWSER_JOBS.filter((_, i) => i !== 7), GAMEPLAY_RESOURCE_BROWSER_JOBS.filter((_, i) => i !== 7))
})
test('v4 rejects incomplete, reordered, stale, cross-document, aliased or cleanup-failed third-cycle data', () => {
 const mutations = [
  v => {delete v.raw.gameplayResourceProfile}, v => {v.report.resourceProfile = 'unknown'},
  v => {v.raw.command.push('--cycles=4')}, v => {v.raw.command.pop()},
  v => {v.report.schemaVersion = 2}, v => {v.report.resources.version = 3},
  v => {v.report.protocol = {...v.report.protocol, cycles: 4}},
  v => {v.report.cycles.pop()}, v => {v.report.cycles.reverse()}, v => {v.report.cycles.push(v.report.cycles[2])},
  v => {v.report.cycles[2].id = 'cycle-2'}, v => {v.report.cycles[2].phases.pop()},
  v => {delete v.files['cycle-3-gameplay-frame-hud.json']}, v => {delete v.files['cycle-3-gameplay-summary-hud.json']},
  v => {delete v.files['cycle-3-gameplay-frames-final.png']},
  v => {v.files['cycle-3-gameplay-frames-final.png'] = Buffer.from('not png')},
  v => {v.files['cycle-3-gameplay-frame-hud.json'] = v.files['cycle-2-gameplay-frame-hud.json']},
  v => {v.report.cycles[2].phases[0].rawFile = v.report.cycles[1].phases[0].rawFile},
  v => {v.report.cycles[2].phases[0].inputs = []}, v => {v.report.cycles[2].pointerReset.observedTimestampMs = 0},
  v => {v.report.cycles[2].resources.beforeWarmup.timeOriginUnixMs++},
  v => {v.report.cycles[2].resources.afterWorkload.sceneUuid = 'new'},
  v => {v.report.resources.restarts.pop()}, v => {v.report.resources.restarts.reverse()},
  v => {v.report.resources.restarts.push(v.report.resources.restarts[1])},
  v => {v.report.resources.restarts[1].fromCycle = 'cycle-1'},
  v => {v.report.resources.restarts[1].retired.disposed = false},
  v => {v.report.resources.restarts[1].retired.fpsGraphReleased = false},
  v => {v.report.resources.restarts[1].settled.turn = 1},
  v => {v.report.resources.restarts[1].after.sceneUuid = 'old'},
  v => {v.report.resources.restarts[1].after.timeOriginUnixMs++},
  v => {v.report.resources.restart = v.report.resources.restarts[0]},
  v => {v.report.resources.heap.samples.pop()}, v => {v.report.resources.heap.samples.reverse()},
  v => {v.report.resources.heap.samples.push(v.report.resources.heap.samples[2])},
  v => {v.report.resources.heap.samples[2].gc.calls = 0}, v => {v.report.resources.heap.samples[2].gc.calls = 2},
  v => {v.report.resources.heap.samples[2].gc.completed = false},
  v => {v.report.resources.heap.samples[2].f8Hidden = false},
  v => {v.report.resources.heap.samples[2].isolateBefore = 'other'; v.report.resources.heap.samples[2].isolateAfter = 'other'},
  v => {v.report.resources.heap.samples[2].before.timeOriginUnixMs++},
  v => {v.report.resources.heap.samples[2].before.timestampMs = 34000},
  v => {v.report.resources.heap.samples[1].after.timestampMs = 34000},
  v => {v.report.resources.heap.samples[2].timing.startedMs = 0},
  v => {v.report.resources.heap.samples[2].bytes.backingStorageSize = null},
  v => {v.report.resources.heap.sessionDetached = false},
  v => {v.report.resources.heap.deltas.cycle3MinusCycle1Bytes.usedSize++},
  v => {v.report.resources.limits = []}, v => {v.report.heapObserverCleanupFailure = 'failed'},
  v => {v.report.resourceObserverCleanupFailure = 'failed'}, v => {v.raw.cleanupVerified = false},
  v => {v.raw.browserCapMs = 360000}, v => {v.raw.build.capMs = 240000},
  v => {v.raw.source.files = {...v.raw.source.files, 'scripts/tutorial-browser/gameplay-resource-profile.mjs': 'f'.repeat(64)}},
  v => {v.raw.source.files = {...v.raw.source.files, 'scripts/browser-new-game.mjs': 'f'.repeat(64)}},
  v => {v.raw.source.files = {...v.raw.source.files}; delete v.raw.source.files['scripts/browser-new-game.mjs']},
  v => {v.report.observedWorkloadComparison.cycle3MinusCycle2[0].secondMinusFirst.work.nativeTriangles++},
  // Coherently relabel every third Scene reference as the first: pairwise uniqueness still fails.
  v => {
   const c = v.report.cycles[2], r = v.report.resources.restarts[1], s = v.report.resources.heap.samples[2]
   for (const value of [c.resources.beforeWarmup, c.resources.afterWorkload, r.after, r.settled, s.before, s.after]) value.sceneUuid = 'old'
  },
 ]
 for (const [index, mutate] of mutations.entries()) {
  const v = directFixture(GAMEPLAY_THREE_CYCLE_POLICY); mutate(v); v.save()
  assert.throws(() => validateGameplayResourceArtifact(v.files, v.expected), `mutation ${index}`)
 }
})

import { GAMEPLAY_OWNERSHIP_POLICY, GAMEPLAY_OWNERSHIP_INPUTS, validateGameplayProducerPreflightArtifact } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('weak-v1 source-bound artifact validates per-retirement observations, never an aggregate memory claim', () => {
 const v=directFixture(GAMEPLAY_OWNERSHIP_POLICY), result=validateGameplayResourceArtifact(v.files,v.expected)
 assert.equal(result.ownershipVerified,true);assert.equal(result.ownership.protocolVerified,true)
 assert.equal(result.ownership.aggregation,'per-retirement-only-no-cross-record-byte-total')
 assert.equal(result.ownership.coverageComplete,true);assert.equal(result.phaseCount,15)
 assert.deepEqual(GAMEPLAY_OWNERSHIP_INPUTS,[...GAMEPLAY_THREE_CYCLE_INPUTS,'scripts/tutorial-browser/gameplay-ownership-observer.mjs','app/globe-renderer.ts','app/scene-terrain-runtime.ts'])
 const first=v.report.resources.heap.samples[1].ownership.records[0]
 for(const sample of v.report.resources.heap.samples.slice(1)) {
  const r=sample.ownership.records[0];r.owners[1]={label:'globe',status:'missing',survival:'unavailable'};r.complete=false
 }
 v.report.resources.restarts[0].ownershipRegistration.registeredOwners=3;v.save()
 assert.equal(validateGameplayResourceArtifact(v.files,v.expected).ownership.coverageComplete,false)
 assert.equal(first.survivingRegisteredByteLengths,192)
})
test('historical v1-v4 reject every ownership marker, even empty/null markers', () => {
 for(const policy of [GAMEPLAY_RESOURCE_POLICY,GAMEPLAY_HEAP_POLICY,GAMEPLAY_MATCHED_POLICY,GAMEPLAY_THREE_CYCLE_POLICY]) {
  for(const mutate of [
   v=>{v.raw.gameplayOwnershipProbe=null},v=>{v.raw.gameplayOwnershipSelection={}},v=>{v.report.ownershipProbe={}},v=>{v.raw.command=['node','run','--gameplay-ownership-probe=weak-v1']},
   v=>{(v.report.resources.restarts?.[0]??v.report.resources.restart).ownershipRegistration={}},
   ...(policy===GAMEPLAY_RESOURCE_POLICY?[]:[v=>{v.report.resources.heap.samples[0].ownership={}},v=>{v.report.resources.heap.samples[0].ownershipTiming={}}]),
  ]) {const v=directFixture(policy);mutate(v);v.save();assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected))}
 }
})
test('weak-v1 rejects altered selection, count/order, timing, bounds, sums, source and resurrection', () => {
 const mutations=[
  v=>{delete v.raw.gameplayOwnershipProbe},v=>{delete v.raw.gameplayOwnershipSelection},
  v=>{v.raw.gameplayOwnershipSelection.headSha='d'.repeat(40)},v=>{v.raw.gameplayOwnershipSelection.label='weak-v1'},
  v=>{v.raw.gameplayOwnershipSelection.action='labeled'},v=>{v.raw.command.pop()},
  v=>{delete v.raw.source.files['scripts/tutorial-browser/gameplay-ownership-observer.mjs']},
  v=>{v.raw.source.files['app/globe-renderer.ts']='f'.repeat(64)},v=>{v.raw.source.files['app/scene-terrain-runtime.ts']='f'.repeat(64)},
  v=>{v.report.resources.heap.samples[2].ownership.records=[]},
  v=>{v.report.resources.heap.samples[0].ownership.records=[v.report.resources.heap.samples[1].ownership.records[0]]},
  v=>{v.report.resources.heap.samples[2].ownership.records.reverse()},
  v=>{v.report.resources.heap.samples[1].ownershipTiming.startedMs=0},
  v=>{v.report.resources.heap.samples[1].ownershipTiming.completedMs=99999},
  v=>{delete v.report.resources.heap.samples[1].ownershipTiming},
  v=>{v.report.resources.heap.samples[1].ownership.extra='unbounded'},
  v=>{v.report.resources.heap.samples[1].ownership.limits='x'.repeat(65537)},
  v=>{v.report.resources.restarts[0].ownershipRegistration.registeredBuffers=10},
  v=>{v.report.resources.restarts[0].ownershipRegistration.slots.pop()},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].owners.pop()},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].survivingBufferCount++},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].survivingRegisteredByteLengths++},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].buffers[0].byteLengthChanged=true},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].buffers[0].registeredByteLength=-1},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].slots[0].bufferId=2},
  v=>{v.report.resources.heap.samples[2].ownership.records[0].buffers[0].registeredByteLength++},
  v=>{v.report.resources.heap.samples[1].ownership.records[0].owners[0].survival='collected'},
  v=>{const r=v.report.resources.heap.samples[1].ownership.records[0];Object.assign(r.buffers[0],{survival:'collected',currentByteLength:null,byteLengthChanged:null});r.survivingBufferCount=1;r.survivingRegisteredByteLengths=128},
 ]
 for(const [index,mutate] of mutations.entries()) {const v=directFixture(GAMEPLAY_OWNERSHIP_POLICY);v.raw.source.files={...v.raw.source.files};const before=JSON.stringify(v.raw), trusted=JSON.stringify(v.expected);mutate(v);assert.notEqual(JSON.stringify(v.raw),before,`mutation ${index} must change evidence`);assert.equal(JSON.stringify(v.expected),trusted,`mutation ${index} must not change trusted expectation`);v.save();assert.throws(()=>validateGameplayResourceArtifact(v.files,v.expected),`mutation ${index}`)}
})

function addProducerFixture(v) {
 const sample = v.report.resources.heap.samples[2], start = sample.timing.endedMs + 10
 v.raw.browserVersion = '155.0.8059.39'
 v.raw.heapProducerPreflight = { version: 1, mode: 'metadata-only', snapshot_attempted: false, capture_ready: false,
  status: 'observed', code: null, expectedPinMatched: false,
  browser: { product: 'Chrome/155.0.8059.39', revision: '@3ff7ac5a9224be9156d7f8703a06e22890aafd34', jsVersion: '15.5.35.20', protocolVersion: '1.3' },
  target: { targetId: 'synthetic-target', type: 'page' }, isolateId: sample.isolateAfter, timeOriginUnixMs: sample.after.timeOriginUnixMs,
  timing: { clock: 'driver-performance.now-milliseconds', browserStartedMs: 0, browserDeadlineMs: 180000,
   browserDeadlineUnixMs: 1800000, lastMetricEndedMs: sample.timing.endedMs, observerCleanupCompletedMs: start,
   startedMs: start, operationsDeadlineMs: start + 2000, cleanupDeadlineMs: start + 3000,
   metadataCompletedMs: start + 5, endedMs: start + 10, remainingAfterPreflightMs: 180000 - start - 10,
   ordinaryCleanupEndedMs: start + 20, remainingAfterOrdinaryCleanupMs: 180000 - start - 20,
   ordinaryCleanupVerified: true, cleanupDeadlineEnforced: false },
  sessionCleanup: { created: 2, detached: 2, promisesSettled: true } }
 v.save()
}
test('metadata receipt is additive: historical inventory/report gates remain, separate acceptance requires observed proof', () => {
 const v = directFixture(GAMEPLAY_OWNERSHIP_POLICY), report = Buffer.from(v.files['gameplay-frames.json']), inventory = Object.keys(v.files)
 assert.equal(validateGameplayResourceArtifact(v.files, v.expected).ownershipVerified, true)
 assert.throws(() => validateGameplayProducerPreflightArtifact(v.files, v.expected), /missing/)
 addProducerFixture(v)
 const accepted = validateGameplayProducerPreflightArtifact(v.files, v.expected)
 assert.equal(accepted.artifact.ownershipVerified, true)
 assert.deepEqual(accepted.producer, { metadataObserved: true, snapshotAttempted: false, captureReady: false })
 assert.deepEqual(Object.keys(v.files), inventory); assert.deepEqual(v.files['gameplay-frames.json'], report)
 v.raw.heapProducerPreflight.status = 'failed'; v.raw.heapProducerPreflight.code = 'PROTOCOL'; v.save()
 assert.equal(validateGameplayResourceArtifact(v.files, v.expected).ownershipVerified, true)
 assert.throws(() => validateGameplayProducerPreflightArtifact(v.files, v.expected), /not observed/)
})
test('present metadata fails closed on forged pin/capture/settlement/shape and cannot weaken existing source/runtime gates', () => {
 const mutations = [v => { v.raw.heapProducerPreflight.expectedPinMatched = true },
  v => { v.raw.heapProducerPreflight.snapshot_attempted = true }, v => { v.raw.heapProducerPreflight.capture_ready = true },
  v => { v.raw.heapProducerPreflight.browser.title = 'private' }, v => { v.raw.heapProducerPreflight.sessionCleanup.promisesSettled = false },
  v => { v.raw.browserVersion = 'different' }, v => { v.raw.browserCapMs++ }, v => { v.raw.command.pop() },
  v => { v.raw.source.files = { ...v.raw.source.files, 'scripts/tutorial-browser/gameplay-heap-observer.mjs': 'f'.repeat(64) } },
  v => { v.raw.cleanupVerified = false }, v => { v.files['extra-producer.json'] = encode({}) }]
 for (const mutate of mutations) {
  const v = directFixture(GAMEPLAY_OWNERSHIP_POLICY); addProducerFixture(v); mutate(v); v.save()
  assert.throws(() => validateGameplayResourceArtifact(v.files, v.expected))
 }
})
