import test from 'node:test'
import assert from 'node:assert/strict'
import { GATES, GAMEPLAY_HEAP_BROWSER_GATE, GAMEPLAY_RESOURCE_BROWSER_GATE, SPLIT_PROFILE_BROWSER_GATE, SPELL_VISUAL_BROWSER_GATE,
  gatesFor, validateEntry, reviewedWorkflows, validatePassedGate } from '../scripts/integration-queue/policy.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
import { GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_RESOURCE_BROWSER_JOBS } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
import { SPLIT_BROWSER_JOBS } from '../scripts/integration-queue/browser-jobs.mjs'
import { SPELL_VISUAL_POLICY, SPELL_VISUAL_BROWSER_JOBS } from '../scripts/integration-queue/spell-visuals-policy.mjs'
const oid = n => String(n).repeat(40), h = 'a'.repeat(64)
function entry() {
  return { version: 1, repo: 'JohnDeved/populous-new-dawn', pr: 782, baseRef: 'main', sourceHead: oid(2), sourceTree: oid(4), reviewBase: oid(3),
    approvedBy: 'parent', allowMechanicalRefresh: false, requireBrowser: true, browserPolicy: GAMEPLAY_RESOURCE_POLICY, browserCheckpointVersion: 3,
    review: { reviewer: 'independent', decision: 'ACCEPT', head: oid(2), base: oid(3), sha256: h, file: '/review' },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])), deployment: { kind: 'unverified', reason: 'fixture' } }
}
function jobs(inventory = GAMEPLAY_RESOURCE_BROWSER_JOBS) {
  return inventory.map(([, name, , buildStep], i) => ({ id: 200 + i, name, head_sha: oid(2), run_id: 100, run_attempt: 2,
    status: 'completed', conclusion: 'success', check_run_url: `https://api.github.com/repos/JohnDeved/populous-new-dawn/check-runs/${300+i}`,
    steps: ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
      'Install locked dependencies and verify supported Chrome', 'Record exact tested source', buildStep,
      'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots'].map(name => ({name, conclusion:'success'})) }))
}
const run = () => ({ id:100, run_attempt:2, check_suite_id:500, head_sha:oid(2), status:'completed', conclusion:'success',
  event:'pull_request', path:GATES[1].workflow })
test('resource gate requires explicit v3 and reviewed workflow transition without changing historical policies', () => {
  const e=entry(); validateEntry(e); assert.equal(gatesFor(e)[1], GAMEPLAY_RESOURCE_BROWSER_GATE)
  assert.equal(gatesFor({...e,browserPolicy:'profile-split-v1'})[1], SPLIT_PROFILE_BROWSER_GATE)
  assert.equal(gatesFor({...e,browserPolicy:SPELL_VISUAL_POLICY,browserCheckpointVersion:4})[1], SPELL_VISUAL_BROWSER_GATE)
  for (const patch of [{browserCheckpointVersion:undefined},{browserCheckpointVersion:4},{profileArtifactPolicy:'composed-spells-eight-v1'}])
    assert.throws(()=>validateEntry({...e,...patch}))
  e.browserWorkflowTransition={version:1,workflow:GATES[1].workflow,sourceHead:e.sourceHead,base:e.reviewBase,baseSha256:'b'.repeat(64),candidateSha256:h}
  validateEntry(e)
  const workflows=[{path:GATES[0].workflow,ref:e.reviewBase,sha256:h},...[e.reviewBase,e.sourceHead,oid(1)].map((ref,i)=>({path:GATES[1].workflow,ref,sha256:i?h:'b'.repeat(64)}))]
  assert.equal(reviewedWorkflows(e,{head:e.sourceHead,base:e.reviewBase,synthetic:{sha:oid(1)},workflows}),true)
  for(const patch of [{allowMechanicalRefresh:true},{browserWorkflowTransition:{...e.browserWorkflowTransition,base:oid(9)}},
    {browserWorkflowTransition:{...e.browserWorkflowTransition,candidateSha256:'c'.repeat(64)}}]) assert.throws(()=>validateEntry({...e,...patch}))
})
test('trusted adapter selects resource nine, legacy eight and spell nine without inventory fallback', () => {
  const reader=new GitHubReader(), pr={head:{sha:oid(2)}}
  reader.validateBrowserJobs(entry(),pr,run(),jobs())
  reader.validateBrowserJobs({...entry(),browserPolicy:'profile-split-v1'},pr,run(),jobs(SPLIT_BROWSER_JOBS))
  reader.validateBrowserJobs({...entry(),browserPolicy:SPELL_VISUAL_POLICY,browserCheckpointVersion:4},pr,run(),jobs(SPELL_VISUAL_BROWSER_JOBS))
  for(const inventory of [SPLIT_BROWSER_JOBS,SPELL_VISUAL_BROWSER_JOBS]) assert.throws(()=>reader.validateBrowserJobs(entry(),pr,run(),jobs(inventory)))
  for(const mutate of [j=>j.pop(),j=>j.push(j[7]),j=>{j[7].name='unknown'},j=>{j[7].head_sha=oid(9)},j=>{j[7].run_id--},j=>{j[7].run_attempt--},j=>{j[7].conclusion='skipped'}]) {
    const j=jobs();mutate(j);assert.throws(()=>reader.validateBrowserJobs(entry(),pr,run(),j))
  }
})
test('resource acceptance requires artifact verification and the matching current official resource check', () => {
  const latest={conclusion:'success',event:'pull_request',identityVerified:true,base:oid(3),merge:oid(1),job:'Tutorial browser',jobConclusion:'success',app:'github-actions',appId:15368,id:100,attempt:2,
    pauseRecoveryVerified:true,pauseRecoveryCheckId:303,profileRecoveryVerified:true,profileRecoveryCheckId:304,mission10Verified:true,mission10CheckId:305,
    gameplayResourcesVerified:true,gameplayResourcesCheckId:307,checkId:300,steps:GATES[1].steps.map(name=>({name,conclusion:'success'}))}
  const o={head:oid(2),base:oid(3),synthetic:{sha:oid(1)},currentChecks:jobs().map((j,i)=>({name:j.name,id:300+i,appId:15368,head:oid(2),status:'completed',conclusion:'success',startedAt:'2026-10-24T00:00:00Z'}))}
  validatePassedGate(o,GAMEPLAY_RESOURCE_BROWSER_GATE,latest)
  assert.throws(()=>validatePassedGate(o,GAMEPLAY_HEAP_BROWSER_GATE,latest))
  validatePassedGate(o,GAMEPLAY_HEAP_BROWSER_GATE,{...latest,gameplayHeapVerified:true})
  assert.throws(()=>validatePassedGate(o,GAMEPLAY_MATCHED_BROWSER_GATE,{...latest,gameplayHeapVerified:true}))
  validatePassedGate(o,GAMEPLAY_MATCHED_BROWSER_GATE,{...latest,gameplayHeapVerified:true,gameplayMatchedCyclesVerified:true})
  assert.throws(()=>validatePassedGate(o,GAMEPLAY_THREE_CYCLE_BROWSER_GATE,{...latest,gameplayHeapVerified:true,gameplayMatchedCyclesVerified:true}))
  validatePassedGate(o,GAMEPLAY_THREE_CYCLE_BROWSER_GATE,{...latest,gameplayHeapVerified:true,gameplayThreeCyclesVerified:true})
  assert.throws(()=>validatePassedGate(o,GAMEPLAY_OWNERSHIP_BROWSER_GATE,{...latest,gameplayHeapVerified:true,gameplayThreeCyclesVerified:true}))
  validatePassedGate(o,GAMEPLAY_OWNERSHIP_BROWSER_GATE,{...latest,gameplayHeapVerified:true,gameplayThreeCyclesVerified:true,gameplayOwnershipVerified:true})
  for(const key of ['pauseRecoveryVerified','profileRecoveryVerified','mission10Verified','gameplayResourcesVerified']) assert.throws(()=>validatePassedGate(o,GAMEPLAY_RESOURCE_BROWSER_GATE,{...latest,[key]:false}))
  for(const mutate of [checks=>checks.splice(7,1),checks=>{checks[7].head=oid(9)},checks=>{checks[7].appId=0},checks=>{checks[7].conclusion='failure'},checks=>checks.push({...checks[7],id:999,startedAt:'2026-10-24T01:00:00Z'})]) {
    const bad=structuredClone(o);mutate(bad.currentChecks);assert.throws(()=>validatePassedGate(bad,GAMEPLAY_RESOURCE_BROWSER_GATE,latest))
  }
})

import { makeResourceFixture } from './support/gameplay-resource-artifact.mjs'
import { artifactZip } from './support/artifact-zip.mjs'
import { createHash } from 'node:crypto'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function resourceAdapter(policy = GAMEPLAY_RESOURCE_POLICY, gameplayResourceBudgetPolicy) {
  const f=makeResourceFixture(policy, { gameplayResourceBudgetPolicy }), identity=f.expected.identity, e=entry(), reader=new GitHubReader()
  const j=jobs([GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(policy) ? GAMEPLAY_THREE_CYCLE_BROWSER_JOBS : GAMEPLAY_RESOURCE_BROWSER_JOBS).map(job=>({...job,head_sha:identity.headSha,run_id:12})), exact={...run(),id:12,head_sha:identity.headSha}
  const pr={head:{sha:identity.headSha},base:{sha:identity.baseSha}}, synthetic={sha:identity.mergeSha}, row={merge:identity.mergeSha}
  e.browserPolicy=policy
  if (gameplayResourceBudgetPolicy !== undefined) e.gameplayResourceBudgetPolicy = gameplayResourceBudgetPolicy
  e.sourceHead=identity.headSha;e.reviewBase=identity.baseSha
  const check={id:307,name:'Gameplay resource lifecycle browser',check_suite:{id:500},head_sha:identity.headSha,
    app:{id:15368,slug:'github-actions'},status:'completed',conclusion:'success'}
  const prefix=`PR_HEAD_SHA: ${identity.headSha}\nPR_BASE_SHA: ${identity.baseSha}\n[command]/usr/bin/git log -1 --format=%H\n${identity.mergeSha}\n`
  reader.get=endpoint=>{
    if(endpoint.endsWith('/check-runs/307')) return structuredClone(check)
    if(endpoint.endsWith('/actions/jobs/207/logs')) return prefix+f.uploadLog
    if(endpoint.endsWith('/actions/artifacts/42')) return f.metadata
    throw Error(`Unexpected endpoint: ${endpoint}`)
  }
  reader.pages=()=>[f.metadata];reader.workflow=()=>({sha256:h})
  reader.immutableBlob=(_,path)=>Buffer.from(path)
  reader.gameplayResourceArchive=()=>f.archive
  const rebuild=()=>{
    f.save();f.archive=artifactZip(Object.entries(f.files),{compress:true})
    f.upload.bytes=f.archive.length;f.upload.sha256=hash(f.archive)
    f.metadata.size_in_bytes=f.upload.bytes;f.metadata.digest=`sha256:${f.upload.sha256}`
    f.uploadLog=`Artifact ${f.upload.name} has been successfully uploaded! Final size is ${f.upload.bytes} bytes. Artifact ID is 42\nArtifact ${f.upload.name}.zip successfully finalized. Artifact ID 42\nSHA256 digest of uploaded artifact zip is ${f.upload.sha256}`
  }
  return {f,reader,check,rebuild,args:[e,pr,synthetic,exact,j,row]}
}
test('real resource reader requires bound raw artifact before setting verified and rejects substitutions',()=>{
  const good=resourceAdapter();assert.equal(good.reader.verifyGameplayResourceRun(...good.args),true)
  assert.equal(good.args[5].gameplayResourcesVerified,true);assert.equal(good.args[5].gameplayResourcesCheckId,307)
  assert.equal(good.args[5].gameplayResourcesArtifactId,42)
  const mutations=[
    a=>{a.args[0].browserCheckpointVersion=4},a=>{a.args[3].run_attempt++},a=>{a.args[3].event='workflow_dispatch'},
    a=>{a.args[4].splice(7,1)},a=>{a.args[4].push(a.args[4][7])},a=>{a.args[4][7].head_sha=oid(9)},
    a=>{a.check.app.id=0},a=>{a.check.id=999},a=>{a.check.check_suite.id++},a=>{a.check.conclusion='failure'},
    a=>{a.reader.workflow=()=>({sha256:'f'.repeat(64)})},a=>{a.reader.immutableBlob=()=>Buffer.from('wrong source')},
    a=>{a.reader.gameplayResourceArchive=()=>Buffer.from('corrupt')},a=>{a.reader.gameplayResourceArchive=()=>Promise.resolve(a.f.archive)},
    a=>{a.reader.pages=()=>[]},a=>{a.reader.pages=()=>[a.f.metadata,a.f.metadata]},a=>{a.f.metadata.workflow_run.id++},
    a=>{a.f.metadata.expired=true},a=>{a.f.raw.github.runAttempt='1';a.rebuild()},
    a=>{delete a.f.files['gameplay-frame-hud.json'];a.rebuild()},
    a=>{a.f.report.resources.restart.retired.disposed=false;a.rebuild()},
  ]
  for(const mutate of mutations){const a=resourceAdapter();mutate(a);assert.throws(()=>a.reader.verifyGameplayResourceRun(...a.args));assert.equal(a.args[5].gameplayResourcesVerified,undefined)}
})

test('v2 selects byte-required gate and cannot accept v1-only completion',()=>{
  const e={...entry(),browserPolicy:GAMEPLAY_HEAP_POLICY};validateEntry(e)
  assert.equal(gatesFor(e)[1],GAMEPLAY_HEAP_BROWSER_GATE)
  assert.equal(gatesFor(entry())[1],GAMEPLAY_RESOURCE_BROWSER_GATE)
  const a=resourceAdapter(GAMEPLAY_HEAP_POLICY);assert.equal(a.reader.verifyGameplayResourceRun(...a.args),true)
  assert.equal(a.args[5].gameplayHeapVerified,true);assert.equal(a.args[5].gameplayResourcesVerified,true)
  for(const mutate of [
    v=>{delete v.f.report.resources.heap;v.rebuild()},
    v=>{v.f.raw.source.files={...v.f.raw.source.files, 'scripts/tutorial-browser/gameplay-heap-observer.mjs':'f'.repeat(64)};v.rebuild()},
    v=>{v.f.raw.source.files={...v.f.raw.source.files};delete v.f.raw.source.files['scripts/tutorial-browser/gameplay-heap-observer.mjs'];v.rebuild()},
    v=>{v.f.report.resources.version=1;v.rebuild()},
    v=>{v.f.report.resources.heap.samples[0].gc.completed=false;v.rebuild()},
    v=>{v.args[0].browserPolicy=GAMEPLAY_RESOURCE_POLICY},
  ]) {const bad=resourceAdapter(GAMEPLAY_HEAP_POLICY);mutate(bad);assert.throws(()=>bad.reader.verifyGameplayResourceRun(...bad.args));assert.equal(bad.args[5].gameplayHeapVerified,undefined)}
})

test('adapter cannot upgrade historical artifact to byte-qualified v2',()=>{
 const a=resourceAdapter();a.args[0].browserPolicy=GAMEPLAY_HEAP_POLICY
 assert.throws(()=>a.reader.verifyGameplayResourceRun(...a.args));assert.equal(a.args[5].gameplayHeapVerified,undefined)
})

import { GAMEPLAY_MATCHED_BROWSER_GATE } from '../scripts/integration-queue/policy.mjs'
import { GAMEPLAY_MATCHED_POLICY } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('v3 requires the matched-cycle gate and bound ten-phase archive, never historical completion',()=>{
 const e={...entry(),browserPolicy:GAMEPLAY_MATCHED_POLICY};validateEntry(e)
 assert.equal(gatesFor(e)[1],GAMEPLAY_MATCHED_BROWSER_GATE)
 assert.equal(GAMEPLAY_MATCHED_BROWSER_GATE.gameplayMatchedCyclesRequired,true)
 const good=resourceAdapter(GAMEPLAY_MATCHED_POLICY)
 assert.equal(good.reader.verifyGameplayResourceRun(...good.args),true)
 assert.equal(good.args[5].gameplayMatchedCyclesVerified,true)
 assert.equal(good.args[5].gameplayHeapVerified,true)
 for(const mutate of [
  v=>{delete v.f.files['cycle-2-gameplay-frame-hud.json'];v.rebuild()},
  v=>{v.f.report.resources.heap.samples[1].boundary='after-restart-settled';v.rebuild()},
  v=>{v.f.raw.source.files={...v.f.raw.source.files,'scripts/tutorial-browser/gameplay-heap-observer.mjs':'f'.repeat(64)};v.rebuild()},
  v=>{v.args[0].browserPolicy=GAMEPLAY_HEAP_POLICY},
 ]) {const bad=resourceAdapter(GAMEPLAY_MATCHED_POLICY);mutate(bad);assert.throws(()=>bad.reader.verifyGameplayResourceRun(...bad.args));assert.equal(bad.args[5].gameplayMatchedCyclesVerified,undefined)}
 for(const policy of [GAMEPLAY_RESOURCE_POLICY,GAMEPLAY_HEAP_POLICY]) {
  const old=resourceAdapter(policy);old.args[0].browserPolicy=GAMEPLAY_MATCHED_POLICY
  assert.throws(()=>old.reader.verifyGameplayResourceRun(...old.args));assert.equal(old.args[5].gameplayMatchedCyclesVerified,undefined)
 }
})

import { GAMEPLAY_THREE_CYCLE_BROWSER_GATE } from '../scripts/integration-queue/policy.mjs'
import { GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_THREE_CYCLE_BROWSER_JOBS } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('v4 selects its own three-cycle gate and exact step label; historical proof never upgrades', () => {
 const e = {...entry(), browserPolicy: GAMEPLAY_THREE_CYCLE_POLICY}; validateEntry(e)
 assert.equal(gatesFor(e)[1], GAMEPLAY_THREE_CYCLE_BROWSER_GATE)
 assert.equal(GAMEPLAY_THREE_CYCLE_BROWSER_GATE.gameplayThreeCyclesRequired, true)
 assert.equal(GAMEPLAY_THREE_CYCLE_BROWSER_GATE.gameplayMatchedCyclesRequired, undefined)
 const good = resourceAdapter(GAMEPLAY_THREE_CYCLE_POLICY)
 assert.equal(good.reader.verifyGameplayResourceRun(...good.args), true)
 assert.equal(good.args[5].gameplayThreeCyclesVerified, true)
 assert.equal(good.args[5].gameplayHeapVerified, true)
 assert.equal(good.args[5].gameplayMatchedCyclesVerified, undefined)
 for (const mutate of [
  v => {v.args[4] = jobs().map(job => ({...job, head_sha: v.f.expected.identity.headSha, run_id: 12}))},
  v => {v.args[0].browserPolicy = GAMEPLAY_MATCHED_POLICY},
  v => {delete v.f.files['cycle-3-gameplay-frame-hud.json']; v.rebuild()},
  v => {v.f.raw.gameplayResourceProfile = undefined; v.rebuild()},
  v => {v.f.report.resources.restarts[1].retired.disposed = false; v.rebuild()},
  v => {v.f.raw.source.files = {...v.f.raw.source.files, 'scripts/tutorial-browser/gameplay-resource-profile.mjs': 'f'.repeat(64)}; v.rebuild()},
 ]) {
  const bad = resourceAdapter(GAMEPLAY_THREE_CYCLE_POLICY); mutate(bad)
  assert.throws(() => bad.reader.verifyGameplayResourceRun(...bad.args))
  assert.equal(bad.args[5].gameplayThreeCyclesVerified, undefined)
 }
 for (const policy of [GAMEPLAY_RESOURCE_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_MATCHED_POLICY]) {
  const old = resourceAdapter(policy); old.args[0].browserPolicy = GAMEPLAY_THREE_CYCLE_POLICY
  assert.throws(() => old.reader.verifyGameplayResourceRun(...old.args))
  assert.equal(old.args[5].gameplayThreeCyclesVerified, undefined)
 }
})


import { GAMEPLAY_OWNERSHIP_BROWSER_GATE } from '../scripts/integration-queue/policy.mjs'
import { GAMEPLAY_OWNERSHIP_POLICY } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
test('weak ownership policy requires its own verified row and immutable source evidence', () => {
 const e = {...entry(), browserPolicy: GAMEPLAY_OWNERSHIP_POLICY}; validateEntry(e)
 assert.equal(gatesFor(e)[1], GAMEPLAY_OWNERSHIP_BROWSER_GATE)
 const good = resourceAdapter(GAMEPLAY_OWNERSHIP_POLICY)
 assert.equal(good.reader.verifyGameplayResourceRun(...good.args), true)
 assert.equal(good.args[5].gameplayOwnershipVerified, true)
 assert.equal(good.args[5].gameplayThreeCyclesVerified, true)
 for (const mutate of [
  v => {delete v.f.raw.gameplayOwnershipSelection;v.rebuild()},
  v => {v.f.raw.source.files = {...v.f.raw.source.files, 'scripts/tutorial-browser/gameplay-ownership-observer.mjs':'f'.repeat(64)};v.rebuild()},
  v => {v.f.report.resources.heap.samples[2].ownership.records=[];v.rebuild()},
  v => {v.args[0].browserPolicy=GAMEPLAY_THREE_CYCLE_POLICY},
 ]) {const bad=resourceAdapter(GAMEPLAY_OWNERSHIP_POLICY);mutate(bad);assert.throws(()=>bad.reader.verifyGameplayResourceRun(...bad.args));assert.equal(bad.args[5].gameplayOwnershipVerified,undefined)}
 const old=resourceAdapter(GAMEPLAY_THREE_CYCLE_POLICY);old.args[0].browserPolicy=GAMEPLAY_OWNERSHIP_POLICY
 assert.throws(()=>old.reader.verifyGameplayResourceRun(...old.args));assert.equal(old.args[5].gameplayOwnershipVerified,undefined)
})


import { digest, decide } from '../scripts/integration-queue/policy.mjs'
import { GAMEPLAY_RESOURCE_POLICIES, GAMEPLAY_COMPOSED_BUDGET_INPUTS, gameplayResourceInputs } from '../scripts/integration-queue/gameplay-resources-policy.mjs'
import { composedGameplayResourceBudgetPolicy } from '../scripts/tutorial-browser/scenario-policy.mjs'
const composedEntry = policy => ({...entry(), browserPolicy: policy,
  gameplayResourceBudgetPolicy: composedGameplayResourceBudgetPolicy})
test('composed budget requires explicit trusted resource admission and invalidates old checkpoint authorization', () => {
  for (const policy of GAMEPLAY_RESOURCE_POLICIES) {
    const old = {...entry(), browserPolicy: policy}, current = composedEntry(policy)
    validateEntry(old); validateEntry(current)
    assert.deepEqual(gatesFor(current)[1], {...gatesFor(old)[1], gameplayResourceBudgetPolicy: 'composed-gameplay-resources-v2'})
    assert.equal(gatesFor(old)[1].gameplayResourceBudgetPolicy, undefined)
    assert.notEqual(digest(old), digest(current))
    for (const [authorized, requested] of [[old,current], [current,old]]) {
      const result = decide(requested, null, {version: 1, authorization: digest(authorized), head: old.sourceHead}, 0)
      assert.equal(result.status, 'stop'); assert.match(result.reason, /Checkpoint authorization changed/)
    }
  }
  for (const patch of [
    {gameplayResourceBudgetPolicy:null}, {gameplayResourceBudgetPolicy:false}, {gameplayResourceBudgetPolicy:{}},
    {gameplayResourceBudgetPolicy:'unknown'}, {requireBrowser:false}, {browserCheckpointVersion:4},
    {browserPolicy:'profile-split-v1'}, {browserPolicy:'snapshot-protocol-v1'},
  ]) assert.throws(() => validateEntry({...composedEntry(GAMEPLAY_RESOURCE_POLICY), ...patch}))
  assert.throws(() => gatesFor({...entry(), browserPolicy:'profile-split-v1', gameplayResourceBudgetPolicy:composedGameplayResourceBudgetPolicy}))
})
test('reader forwards trusted composed expectation for every generation and binds all appended immutable inputs', () => {
  for (const policy of GAMEPLAY_RESOURCE_POLICIES) {
    const good = resourceAdapter(policy, composedGameplayResourceBudgetPolicy), acquired = []
    good.reader.immutableBlob = (_, path) => { acquired.push(path); return Buffer.from(path) }
    assert.equal(good.reader.verifyGameplayResourceRun(...good.args), true)
    assert.deepEqual(acquired, gameplayResourceInputs(policy, composedGameplayResourceBudgetPolicy))
    assert.equal(good.args[5].gameplayResourceBudgetVerified, true)
    assert.equal(good.args[5].gameplayResourceBudgetPolicy, 'composed-gameplay-resources-v2')
    assert.equal(good.args[5].gameplayResourcesVerified, true)
    const old = resourceAdapter(policy); old.reader.verifyGameplayResourceRun(...old.args)
    assert.equal(old.args[5].gameplayResourceBudgetVerified, undefined)
    assert.equal(old.args[5].gameplayResourceBudgetPolicy, undefined)
    for (const flag of ['gameplayHeapVerified', 'gameplayMatchedCyclesVerified', 'gameplayThreeCyclesVerified', 'gameplayOwnershipVerified'])
      assert.equal(good.args[5][flag], old.args[5][flag])
    for (const mutate of [
      a => { delete a.args[0].gameplayResourceBudgetPolicy },
      a => { a.args[0].gameplayResourceBudgetPolicy = null },
      a => { a.args[0].gameplayResourceBudgetPolicy = 'unknown' },
      a => { delete a.f.raw.gameplayResourceBudgetPolicy; a.rebuild() },
      a => { a.f.raw.gameplayResourceSplitBudget = {...a.f.raw.gameplayResourceSplitBudget, totalBrowserMs:535001}; a.rebuild() },
      a => { a.f.raw.source.files = {...a.f.raw.source.files}; delete a.f.raw.source.files['scripts/tutorial-browser/gameplay-admission.mjs']; a.rebuild() },
    ]) {
      const bad = resourceAdapter(policy, composedGameplayResourceBudgetPolicy); mutate(bad)
      assert.throws(() => bad.reader.verifyGameplayResourceRun(...bad.args))
      assert.equal(bad.args[5].gameplayResourcesVerified, undefined)
      assert.equal(bad.args[5].gameplayResourceBudgetVerified, undefined)
    }
    for (const changed of GAMEPLAY_COMPOSED_BUDGET_INPUTS) {
      const bad = resourceAdapter(policy, composedGameplayResourceBudgetPolicy)
      bad.reader.immutableBlob = (_, path) => Buffer.from(path === changed ? 'wrong immutable source' : path)
      assert.throws(() => bad.reader.verifyGameplayResourceRun(...bad.args))
      assert.equal(bad.args[5].gameplayResourceBudgetVerified, undefined)
    }
  }
})
test('composed gate requires matching verified budget in addition to every historical resource flag and current check', () => {
  const base = {conclusion:'success',event:'pull_request',identityVerified:true,base:oid(3),merge:oid(1),
    job:'Tutorial browser',jobConclusion:'success',app:'github-actions',appId:15368,id:100,attempt:2,
    pauseRecoveryVerified:true,pauseRecoveryCheckId:303,profileRecoveryVerified:true,profileRecoveryCheckId:304,
    mission10Verified:true,mission10CheckId:305,gameplayResourcesVerified:true,gameplayResourcesCheckId:307,
    gameplayHeapVerified:true,gameplayMatchedCyclesVerified:true,gameplayThreeCyclesVerified:true,gameplayOwnershipVerified:true,
    checkId:300,steps:GATES[1].steps.map(name=>({name,conclusion:'success'}))}
  const o = {head:oid(2),base:oid(3),synthetic:{sha:oid(1)},currentChecks:jobs().map((j,i)=>({name:j.name,id:300+i,
    appId:15368,head:oid(2),status:'completed',conclusion:'success',startedAt:'2026-10-24T00:00:00Z'}))}
  for (const policy of GAMEPLAY_RESOURCE_POLICIES) {
    const gate = gatesFor(composedEntry(policy))[1]
    const current = {...base,gameplayResourceBudgetVerified:true,gameplayResourceBudgetPolicy:composedGameplayResourceBudgetPolicy}
    validatePassedGate(o,gate,current)
    assert.throws(() => validatePassedGate(o,gate,base))
    assert.throws(() => validatePassedGate(o,gatesFor({...entry(),browserPolicy:policy})[1],current))
    for (const patch of [{gameplayResourceBudgetVerified:false},{gameplayResourceBudgetVerified:undefined},
      {gameplayResourceBudgetPolicy:undefined},{gameplayResourceBudgetPolicy:'unknown'},{gameplayResourcesVerified:false}])
      assert.throws(() => validatePassedGate(o,gate,{...current,...patch}))
    for (const [required,verified] of [['gameplayHeapRequired','gameplayHeapVerified'],
      ['gameplayMatchedCyclesRequired','gameplayMatchedCyclesVerified'],['gameplayThreeCyclesRequired','gameplayThreeCyclesVerified'],
      ['gameplayOwnershipRequired','gameplayOwnershipVerified']]) if (gate[required])
      assert.throws(() => validatePassedGate(o,gate,{...current,[verified]:false}))
    const wrongCheck = structuredClone(o); wrongCheck.currentChecks[7].head=oid(9)
    assert.throws(() => validatePassedGate(wrongCheck,gate,current))
  }
})
