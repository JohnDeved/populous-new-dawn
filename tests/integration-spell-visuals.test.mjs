import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
import { GATES, SPELL_VISUAL_BROWSER_GATE, gatesFor, validateEntry, validatePassedGate, sha256 } from '../scripts/integration-queue/policy.mjs'
import { spellVisualArtifactUpload, spellVisualArchiveLimit } from '../scripts/integration-queue/spell-visuals-artifact.mjs'
import { profileArchiveLimit } from '../scripts/integration-queue/profile-artifact.mjs'
import { profileCheckpointVersion, validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import { mission10ReceiptFixture, compactMission10Fixture, mission10EvidenceFixture } from './support/mission10-profile-receipt.mjs'
import { passiveBrowserFixture } from './support/passive-browser-reader.mjs'
const badHash = 'f'.repeat(40)
// Disposable fixtures own their config; production readers still reject inherited drivers.
const gitFixtureEnv = ambient => ({
  ...Object.fromEntries(Object.entries(ambient).filter(([key])=>!/^GIT_CONFIG(?:_|$)/.test(key))),
  GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_COUNT:'0',
})
const checkView = f => ({ head:f.pr.head.sha,base:f.pr.base.sha,synthetic:f.synthetic,
  currentChecks:f.checks.map(c=>({id:c.id,name:c.name,appId:c.app.id,head:c.head_sha,startedAt:c.started_at,status:c.status,conclusion:c.conclusion})) })
test('real synchronous reader accepts complete explicit nine/v4 and unchanged eight/v3 fixtures', () => {
  for(const nine of [false,true]) {
    const f=passiveBrowserFixture({nine}), row=f.run()
    assert.equal(validateEntry(f.entry),f.entry)
    assert.equal(row.then,undefined)
    for(const flag of ['identityVerified','pauseRecoveryVerified','profileRecoveryVerified','mission10Verified']) assert.equal(row[flag],true)
    assert.equal(row.spellVisualsVerified,nine?true:undefined)
    validatePassedGate(checkView(f),gatesFor(f.entry)[1],row)
    if(nine) assert.equal(gatesFor(f.entry)[1],SPELL_VISUAL_BROWSER_GATE)
  }
})
test('policy and checkpoint contracts are caller-selected, strict and never inferred from evidence', () => {
  const f=passiveBrowserFixture(), e=f.entry
  for(const version of [undefined,3,5,'4']) assert.throws(()=>validateEntry({...e,browserCheckpointVersion:version}))
  assert.throws(()=>validateEntry({...e,browserPolicy:'profile-split-v1'}))
  assert.throws(()=>validateEntry({...e,browserPolicy:'unknown'}))
  const transition={version:1,workflow:GATES[1].workflow,sourceHead:e.sourceHead,base:e.reviewBase,baseSha256:'b'.repeat(64),candidateSha256:e.workflowHashes[GATES[1].workflow]}
  assert.equal(validateEntry({...e,browserWorkflowTransition:transition}).browserPolicy,'spell-visuals-nine-v2')
  for(const [options,contract] of [[{nine:false,version:4},{}],[{nine:true,version:3},{}]]) {
    const bad=passiveBrowserFixture(options);assert.throws(()=>bad.run(),/checkpoint/)
  }
  assert.equal(profileCheckpointVersion(),3)
  for(const expected of [{checkpointVersion:4},{policy:'spell-visuals-nine-v2'},{policy:'profile-split-v1',checkpointVersion:4},{policy:'unknown',checkpointVersion:3}])
    assert.throws(()=>profileCheckpointVersion(expected))
  for(const version of [3,4]) {
    const raw=mission10ReceiptFixture(f.synthetic.sha);raw.phases[0].saved[0]=version;raw.phases[1].loaded[0]=version
    const contract=version===4?{policy:'spell-visuals-nine-v2',checkpointVersion:4}:{}
    assert.equal(validateMission10Profile(compactMission10Fixture(raw),f.synthetic.sha,mission10EvidenceFixture(raw),contract),true)
    raw.phases[1].loaded[0]=version===3?4:3
    assert.throws(()=>validateMission10Profile(compactMission10Fixture(raw),f.synthetic.sha,mission10EvidenceFixture(raw),contract),/Load boundary/)
  }
})
test('exact ninth inventory rejects missing, extra, duplicate, failed, wrong attempt and job head', () => {
  for(const mutate of [
    f=>f.jobs.pop(),f=>f.jobs.push({...f.jobs[8],id:9999}),f=>{f.jobs[8].id=f.jobs[0].id},
    f=>{f.jobs[8].name='renamed'},f=>{f.jobs[8].run_id++},f=>{f.jobs[8].run_attempt++},
    f=>{f.jobs[8].head_sha=badHash},f=>{f.jobs[8].conclusion='failure'},f=>{f.jobs[8].steps.pop()},
    f=>{f.jobs[8].steps.push(f.jobs[8].steps[0])},f=>{f.jobs[7].conclusion='skipped'},
    f=>{f.entry.browserPolicy='profile-split-v1';delete f.entry.browserCheckpointVersion},
  ]) {const f=passiveBrowserFixture();mutate(f);assert.throws(()=>f.run())}
})
test('authenticated check, workflow, log and all prior subgates cannot be spliced', () => {
  for(const mutate of [
    f=>{f.checks[8].app.id=1},f=>{f.checks[8].app.slug='impostor'},f=>{f.checks[8].check_suite.id++},
    f=>{f.checks[8].head_sha=badHash},f=>{f.checks[8].id++},f=>{f.checks[8].name='other'},
    f=>{f.checks[8].conclusion='failure'},f=>{f.checks[8].status='in_progress'},
    f=>{f.jobs[8].check_run_url='https://evil.test/check-runs/2008'},
    f=>{f.exact.path='other.yml'},f=>{f.exact.run_attempt++},
    f=>{f.entry.workflowHashes[GATES[1].workflow]='c'.repeat(64)},
    f=>f.logs.set(1008,f.logs.get(1008).replace(f.pr.head.sha,badHash)),
    f=>f.logs.set(1008,f.logs.get(1008).replace(f.pr.base.sha,badHash)),
    f=>f.logs.set(1008,f.logs.get(1008).replace(f.synthetic.sha,badHash)),
    f=>f.logs.set(1008,f.logs.get(1003)),
    f=>{f.checks[3].app.id=1},f=>{f.checks[4].check_suite.id++},f=>{f.checks[5].head_sha=badHash},
  ]) {const f=passiveBrowserFixture();mutate(f);assert.throws(()=>f.run())}
})
test('only exact current-run enumeration plus direct unexpired upload-bound metadata admits bytes', () => {
  for(const mutate of [
    f=>f.artifacts.pop(),f=>f.artifacts.push({...f.artifacts[2],id:9000}),f=>{f.artifacts[2].id++},
    f=>{f.artifacts[2].name='wrong'},f=>{f.metadata[2].expired=true},f=>{f.artifacts[2].expired=true},
    f=>{f.metadata[2].digest='sha256:'+'0'.repeat(64)},f=>{f.metadata[2].size_in_bytes++},
    f=>{f.metadata[2].workflow_run.id++},f=>{f.metadata[2].workflow_run.head_sha=badHash},
    f=>{f.metadata[2].archive_download_url='https://evil.test/archive'},
    f=>f.archives.set(3002,Buffer.from('bad archive')),
    f=>f.logs.set(1008,f.logs.get(1008).replace('Artifact ID is 3002','Artifact ID is 3003')),
    f=>f.logs.set(1008,f.logs.get(1008)+'\n'+f.logs.get(1008)),
    f=>{f.sourceBlobs['public/original/shield.png']=Buffer.from([0xff,0x80,0x00])},
    f=>{f.reader.executeBinary=()=>Promise.resolve(Buffer.from('zip'))},
    f=>{f.reader.verifySpellVisualRun=()=>Promise.resolve(true)},
  ]) {const f=passiveBrowserFixture();mutate(f);assert.throws(()=>f.run())}
})
test('ninth verified flag and exact latest Actions check are mandatory; newer failures never fall back', () => {
  const f=passiveBrowserFixture(),row=f.run(),gate=gatesFor(f.entry)[1]
  for(const flag of ['pauseRecoveryVerified','profileRecoveryVerified','mission10Verified','spellVisualsVerified'])
    for(const value of [false,undefined,Promise.resolve(true)]) assert.throws(()=>validatePassedGate(checkView(f),gate,{...row,[flag]:value}))
  for(const mutate of [
    o=>o.currentChecks.pop(),o=>{o.currentChecks.at(-1).id++},o=>{o.currentChecks.at(-1).appId=1},
    o=>{o.currentChecks.at(-1).head=badHash},
    o=>o.currentChecks.push({...o.currentChecks.at(-1),id:9999,conclusion:'failure',startedAt:'2026-10-20T11:00:00Z'}),
    o=>o.currentChecks.push({...o.currentChecks.at(-1),id:9999}),
  ]) {const o=checkView(f);mutate(o);assert.throws(()=>validatePassedGate(o,gate,row))}
})
test('ninth archive transport is numeric repository-only 48MiB; existing profile transport stays 16MiB', () => {
  const calls=[],reader=new GitHubReader({execute:()=>'',executeBinary:(...args)=>{calls.push(args);return Buffer.from('zip')}})
  assert.equal(spellVisualArchiveLimit,48*1024*1024);assert.equal(profileArchiveLimit,16*1024*1024)
  for(const id of [0,-1,1.5,'https://evil.test',Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>reader.spellVisualArchive(id))
  reader.spellVisualArchive(1);reader.artifactArchive(2)
  assert.equal(calls[0][2].maxBuffer,spellVisualArchiveLimit);assert.equal(calls[1][2].maxBuffer,profileArchiveLimit)
  assert.deepEqual(calls[0][1],['api','--hostname','github.com','--method','GET','repos/JohnDeved/populous-new-dawn/actions/artifacts/1/zip'])
  assert.throws(()=>new GitHubReader({execute:()=>''}).spellVisualArchive(1),/explicitly injected/)
  const f=passiveBrowserFixture(),log=f.logs.get(1008)
  assert.equal(spellVisualArtifactUpload(log,f.synthetic.sha).id,3002)
  for(const bytes of [spellVisualArchiveLimit+1,Number.MAX_SAFE_INTEGER+1])
    assert.throws(()=>spellVisualArtifactUpload(log.replace(/Final size is [0-9]+/,`Final size is ${bytes}`),f.synthetic.sha))
})
test('immutable safe Git blob read preserves invalid UTF-8 PNG bytes and rejects filters/Promises', () => {
  const dir=mkdtempSync(join(tmpdir(),'passive-git-'))
  const env=gitFixtureEnv(process.env)
  const git=(...args)=>execFileSync('git',args,{cwd:dir,env,encoding:'utf8'})
  try {
    git('init','--quiet');git('config','user.name','Synthetic');git('config','user.email','synthetic@example.invalid')
    mkdirSync(join(dir,'public/original'),{recursive:true})
    const bytes=Buffer.from([0x89,0x50,0x4e,0x47,0xff,0xc0,0x80,0x00,0xfe])
    writeFileSync(join(dir,'public/original/shield.png'),bytes)
    git('add','.');git('commit','--quiet','-m','synthetic binary input')
    const head=git('rev-parse','HEAD').trim()
    const calls=[]
    const reader=new GitHubReader({cwd:dir,execute:(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,env,encoding:'utf8'}),
      executeBinary:(cmd,args,options)=>{calls.push([args,options]);return execFileSync(cmd,args,{...options,env:{...env,GIT_NO_REPLACE_OBJECTS:'1',GIT_NO_LAZY_FETCH:'1'}})}})
    assert.deepEqual(reader.spellVisualBlob(head,'public/original/shield.png'),bytes)
    assert.notEqual(sha256(bytes),sha256(bytes.toString('utf8')))
    assert.equal(calls[0][1].maxBuffer,32*1024*1024)
    assert.ok(calls[0][0].includes('--no-replace-objects'))
    assert.equal(calls[0][1].env.GIT_NO_LAZY_FETCH,'1')
    assert.throws(()=>reader.spellVisualBlob('main','public/original/shield.png'))
    assert.throws(()=>reader.spellVisualBlob(head,'../secret'))
    git('config','filter.untrusted.clean','false')
    assert.throws(()=>reader.spellVisualBlob(head,'public/original/shield.png'),/Custom Git/)
    git('config','--unset','filter.untrusted.clean')
    reader.executeBinary=()=>Promise.resolve(bytes)
    assert.throws(()=>reader.spellVisualBlob(head,'public/original/shield.png'),/synchronous/)
  } finally {rmSync(dir,{recursive:true,force:true})}
})
test('Git fixture isolates controlled global/system drivers while production still rejects them', () => {
  const root=mkdtempSync(join(tmpdir(),'passive-git-config-')),dir=join(root,'repo')
  mkdirSync(dir)
  const clean=gitFixtureEnv(process.env)
  const execute=env=>(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,env,encoding:'utf8'})
  const git=(...args)=>execute(clean)('git',args,dir)
  const reader=(env,systemConfig)=>{
    // Substitute only this child process's system file, so NOSYSTEM is exercised
    // against a controlled driver without touching the machine's Git settings.
    const transportEnv=systemConfig?{...env,GIT_CONFIG_SYSTEM:systemConfig}:env
    return new GitHubReader({cwd:dir,execute:execute(transportEnv),
      executeBinary:(cmd,args,options)=>execFileSync(cmd,args,{...options,env:{...transportEnv,GIT_NO_REPLACE_OBJECTS:'1',GIT_NO_LAZY_FETCH:'1'}})})
  }
  try {
    git('init','--quiet');git('config','user.name','Synthetic');git('config','user.email','synthetic@example.invalid')
    mkdirSync(join(dir,'public/original'),{recursive:true})
    const bytes=Buffer.from([0x89,0x50,0x4e,0x47,0xff,0x80,0x00])
    writeFileSync(join(dir,'public/original/shield.png'),bytes)
    git('add','.');git('commit','--quiet','-m','synthetic config isolation')
    const head=git('rev-parse','HEAD').trim()
    for(const scope of ['global','system']) {
      const home=join(root,scope),xdg=join(home,'xdg')
      mkdirSync(xdg,{recursive:true})
      const config=join(home,scope==='global'?'.gitconfig':'system.gitconfig')
      writeFileSync(config,scope==='global'?'[merge "synthetic"]\n driver = false\n':'[filter "synthetic"]\n clean = false\n')
      const ambient={...clean,HOME:home,XDG_CONFIG_HOME:xdg,GIT_CONFIG_NOSYSTEM:'0',
        GIT_CONFIG_SYSTEM:scope==='system'?config:'/dev/null',
        GIT_CONFIG_GLOBAL:scope==='global'?config:'/dev/null'}
      const systemConfig=scope==='system'?config:undefined
      assert.throws(()=>reader(ambient,systemConfig).spellVisualBlob(head,'public/original/shield.png'),/Custom Git/,scope)
      assert.deepEqual(reader(gitFixtureEnv(ambient),systemConfig).spellVisualBlob(head,'public/original/shield.png'),bytes,scope)
    }
  } finally {rmSync(root,{recursive:true,force:true})}
})
test('inspectMode retains the exact current check for every selected subgate', () => {
  const f=passiveBrowserFixture(),dir=mkdtempSync(join(tmpdir(),'passive-inspect-'))
  try {
    writeFileSync(join(dir,'review'),'synthetic review');f.entry.review.file='review';f.entry.review.sha256=sha256('synthetic review')
    const pr={...f.pr,number:695,base:{...f.pr.base,ref:'main',repo:{full_name:f.entry.repo}},
      head:{...f.pr.head,repo:{full_name:f.entry.repo}},draft:false,state:'open',merged:false,mergeable:true,
      mergeable_state:'clean',merge_commit_sha:f.synthetic.sha,updated_at:'2026-10-20T10:02:00Z'}
    const get=f.reader.get.bind(f.reader)
    f.reader.get=(endpoint,text)=>endpoint.endsWith('/pulls/695')?pr:
      endpoint.endsWith('/git/ref/heads/main')?{object:{sha:pr.base.sha}}:
      endpoint.includes('/commits/')&&endpoint.includes('/check-runs?')?{total_count:f.checks.length,check_runs:f.checks}:get(endpoint,text)
    f.reader.commit=sha=>sha===f.synthetic.sha?f.synthetic:{sha,tree:f.entry.sourceTree,parents:[pr.base.sha]}
    f.reader.git=(command)=>command==='status'?'':command==='merge-base'?pr.base.sha:'app/page.tsx'
    const o=f.reader.inspectAdmission(f.entry,dir)
    assert.equal(o.complete,true,o.error);assert.equal(o.consistent,true,o.error)
    assert.deepEqual(o.currentChecks.map(c=>c.name),['Tutorial browser','Pause checkpoint recovery browser','Profile recovery browser','Mission 10 crew persistence browser','Spell visuals browser'])
    validatePassedGate(o,gatesFor(f.entry)[1],o.runs[0])
  } finally {rmSync(dir,{recursive:true,force:true})}
})
