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
