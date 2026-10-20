import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { deflateSync } from 'node:zlib'
import { createAngelVisualFixture } from '../scripts/tutorial-browser/angel-visuals-fixture.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { angelPosePositions } from '../app/angel-presentation.ts'
import { advanceGame } from '../app/game-clock.ts'
import { angelAttributeChecksum, expectedAngelUV } from '../scripts/tutorial-browser/angel-visuals-evidence.mjs'
import { SPLIT_BROWSER_JOBS, validateSplitBrowserJobs } from '../scripts/integration-queue/browser-jobs.mjs'
import { SPELL_VISUAL_POLICY, SPELL_VISUAL_JOB, SPELL_VISUAL_BROWSER_JOBS, SPELL_VISUAL_INPUTS, SPELL_VISUAL_FILES,
 validateSpellVisualBrowserJobs, spellVisualReceiptLog, readSpellVisualReceiptLog, validateSpellVisualReceipt, resolveSpellVisualArtifact } from '../scripts/integration-queue/spell-visuals-policy.mjs'
import { browserCapMs, spellVisualBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'
import spellVisuals from '../scripts/tutorial-browser/spell-visuals.mjs'
import { SHIELD_VISUAL_INPUTS } from '../scripts/tutorial-browser/shield-visuals-inputs.mjs'
import { shieldReceiptEvidence } from './support/shield-visuals-receipt.mjs'
import { spellVisualReceipt } from '../scripts/tutorial-browser/spell-visuals-receipt.mjs'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { artifactZip } from './support/artifact-zip.mjs'
const source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }
const hash = value => createHash('sha256').update(value).digest('hex'), oid = n => String(n).repeat(40)
function observation(segment) {
  const f = createAngelVisualFixture(source), w = checkpointCodec(f.expected, true)
  const r = { segment, error: null, done: true, sceneWorldMatched: true, worldReplaced: segment === 'running',
    retention: { done: true }, visits: 100, samples: [], crops: [], contextFrames: [], resources: [], terminal: { reason: segment === 'paused' ? 'paused-transition' : 'ordinary-expiry' },
    cleanup: { effectsRemoved: true, groupsRemoved: true, allOwnedDetached: true, disposed: { geometry: 8, material: 8, texture: 0 }, neighbourSubmitted: true, neighbourAtlasUnchanged: true } }
  for (const [owner,id] of f.receipt.ids.entries()) for (const base of [62,69])
    r.resources.push({ id, owner, base, bank: 2, geometry: `${id}:${base}`, material: `${id}:${base}`, neighbourSharesAtlas: true, materialColor: [1,1,1], atlasUrl: 'http://127.0.0.1/original/atlas.png', ...expectedAngelUV(base,owner) })
  const append = () => {
    for (const [owner,id] of f.receipt.ids.entries()) {
      const e=w.effects.find(e=>e.id===id); if(!e) continue
      const pose=e.angel.presentation.displayed, positions=angelPosePositions(pose)
      r.samples.push({ rafTimestamp:r.samples.length+1,sceneTimestamp:r.samples.length+1,id,owner,base:pose.base,pose:structuredClone(pose),presentation:structuredClone(e.angel.presentation),
        turn:w.turn,stamp:r.samples.length+1,phase:e.angel.phase,timer:e.angel.timer,paused:segment==='paused',
        height:e.height,groupY:Math.round(e.height*45)/128,nativeTilt:0,nativeRoll:0,visible:true,submitted:true,
        scale:pose.scale,shaderScale:pose.scale,positionCount:positions.length,positionChecksum:angelAttributeChecksum(positions),...(r.samples.length < 4 ? {positions:[...positions]} : {}),bounds:{x:20,y:20,width:40,height:40} })
    }
  }
  append()
  if(segment==='running') {
    w.paused=false; const clock={animationTime:0,animationFrame:0}
    for(let i=0;i<188;i++){advanceGame(w,clock,1/24);append()}
  }
  for(const [owner,id] of f.receipt.ids.entries()) {
    const labels=segment==='paused'?['paused-transition']:['transition','base-62','base-69',...(owner===0?['death-large','death-small']:[])]
    const labelOf=s=>segment==='paused'?'paused-transition':s.pose.to>=76?'transition':s.phase==='dying'?s.scale>80?'death-large':'death-small':`base-${s.base}`
    for(const label of labels){
      const sample=r.samples.find(s=>s.id===id&&labelOf(s)===label), filename=`angel-${segment}-${r.crops.length}.png`
      sample.cropFile=filename; sample.positions=[...angelPosePositions(sample.pose)]
      r.crops.push({filename,label,id,stamp:sample.stamp,turn:sample.turn,pose:sample.pose,bounds:sample.bounds,
        canvasOwned:true,overlays:[],clip:{width:56,height:56},opaqueColors:10,sha256:'a'.repeat(64),pixelChecksum:'body'})
    }
    if(segment==='running')r.crops.push({filename:`angel-${segment}-${r.crops.length}.png`,label:'cleared-footprint',id,cleared:true,canvasOwned:true,
      overlays:[],clip:{width:56,height:56},opaqueColors:5,sha256:'b'.repeat(64),pixelChecksum:'clear'})
  }
  if(segment==='running')for(const label of ['loop','death']) {
    const sample=r.samples.find(s=>s.owner===0&&(label==='loop'?s.base===62&&s.pose.to<76:s.phase==='dying'&&s.scale<=80))
    r.contextFrames.push({filename:`angel-${label}-context.png`,label,id:sample.id,stamp:sample.stamp,turn:sample.turn,pose:sample.pose,fullCanvas:true,
      clip:{x:0,y:0,width:1440,height:1000},opaqueColors:16,sha256:'a'.repeat(64),pixelChecksum:'context'})
  }
  return {r,fixture:f.receipt}
}
const run={id:100,run_attempt:2,head_sha:oid(2),status:'completed',conclusion:'success'}
const admission={policy:SPELL_VISUAL_POLICY,headSha:oid(2)}
function jobs(){return SPELL_VISUAL_BROWSER_JOBS.map(([,name,,buildStep],index)=>({id:200+index,name,run_id:100,run_attempt:2,head_sha:oid(2),status:'completed',conclusion:'success',steps:
 ['Require a ready pull request','Check out exact proposed merge','Set up Node','Install locked dependencies and verify supported Chrome','Record exact tested source',buildStep,'Reject tracked input mutation','Retain bounded validation receipts and screenshots'].map(name=>({name,conclusion:'success'}))}))}
test('ninth hosted row is exact and preserves the eight existing rows, caps, triggers, permissions and launch',()=>{
 const workflow=yaml.load(readFileSync(new URL('../.github/workflows/tutorial-browser.yml',import.meta.url),'utf8'))
 const rows=workflow.jobs['tutorial-browser'].strategy.matrix.include.map(x=>[x.scenario,x.name,x.artifact,x.buildStep,x.timeoutMinutes])
 assert.deepEqual(rows,SPELL_VISUAL_BROWSER_JOBS);assert.deepEqual(rows.slice(0,8),SPLIT_BROWSER_JOBS);assert.deepEqual(rows.at(-1),SPELL_VISUAL_JOB)
 assert.deepEqual(workflow.permissions,{contents:'read'});assert.deepEqual(workflow.on.pull_request.types,['ready_for_review'])
 assert.equal(browserCapMs('spell-visuals'),180000);assert.deepEqual(spellVisualBudget,{browserMs:180000,buildMs:120000,hostedJobMs:900000,angelEpisodeMs:50000,angelAdmissionMs:60000,shieldEpisodeMs:45000,shieldAdmissionMs:55000})
 const runner=readFileSync(new URL('../scripts/tutorial-browser/run.mjs',import.meta.url),'utf8')
 assert.match(runner,/deadlineAt: browserDeadlineAt/);assert.match(runner,/!\['snapshot-protocol', 'spell-visuals'\]\.includes/)
 assert.match(runner,/120000/);assert.doesNotMatch(runner,/no-sandbox|disable-web-security/)
})
test('explicit nine-job policy rejects missing, duplicate, wrong-name, wrong-head and failed spell jobs without eight-job fallback',()=>{
 assert.equal(validateSpellVisualBrowserJobs(jobs(),run,admission),true)
 assert.equal(validateSplitBrowserJobs(jobs().slice(0,8),run),true)
 assert.throws(()=>validateSplitBrowserJobs(jobs(),run))
 assert.throws(()=>validateSpellVisualBrowserJobs(jobs(),run,{...admission,policy:'profile-split-v1'}))
 for(const mutate of [j=>j.pop(),j=>j.push(j[8]),j=>{j[8].name='Spell browser'},j=>{j[8].head_sha=oid(4)},j=>{j[8].conclusion='failure'},j=>{j[8].status='in_progress'},j=>{j[8].run_attempt=1},j=>{j[8].run_id=99},j=>{j[8].steps.pop()},j=>{j[8].steps[5].conclusion='skipped'},j=>{j[0].head_sha=oid(3)},j=>{j[0].id=j[8].id}]){
  const value=jobs();mutate(value);assert.throws(()=>validateSpellVisualBrowserJobs(value,run,admission))
 }
 assert.throws(()=>validateSpellVisualBrowserJobs(jobs(),{...run,head_sha:oid(4)},admission))
})
test('shared shard awaits successful context closure and forwards the unmodified absolute deadline',async()=>{
 const options={browser:{},url:'http://127.0.0.1',output:'/tmp/example',source,expectedRevision:source.commit,deadlineAt:12345}
 let closed=false, calls=0
 const shield=async value=>{assert.equal(value,options);assert.equal(closed,true);calls++;return{status:'passed',cleanup:{contextClosed:true,closedWithinBudget:true}}}
 const result=await spellVisuals(options,async value=>{assert.equal(value,options);closed=true;return{status:'passed',contextClosed:true}},shield)
 assert.deepEqual(result.episodes,['angel','shield']);assert.equal(calls,1)
 for(const result of [{status:'failed',contextClosed:true},{status:'passed',contextClosed:false}])await assert.rejects(spellVisuals(options,async()=>result,shield))
 assert.equal(calls,1)
 for(const result of [{status:'failed',cleanup:{contextClosed:true,closedWithinBudget:true}},{status:'passed',cleanup:{contextClosed:false,closedWithinBudget:true}},{status:'passed',cleanup:{contextClosed:true,closedWithinBudget:false}}])await assert.rejects(spellVisuals(options,async()=>({status:'passed',contextClosed:true}),async()=>result))
})
function png(width,height,seed=0){
 const rgba=Buffer.alloc(width*height*4),raw=Buffer.alloc(height*(width*4+1))
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,c=seed+(x+y)%16;rgba.set([c,c,c,255],i);raw.set(rgba.subarray(i,i+4),y*(width*4+1)+1+x*4)
 }
 const chunk=(name,data)=>{const bytes=Buffer.alloc(data.length+12);bytes.writeUInt32BE(data.length);bytes.write(name,4);data.copy(bytes,8);let crc=0xffffffff
  for(const b of bytes.subarray(4,-4)){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}bytes.writeUInt32BE((crc^0xffffffff)>>>0,bytes.length-4);return bytes}
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6
 return {bytes:Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]),pixelChecksum:angelAttributeChecksum(rgba),opaqueColors:16,rgbaSha256:hash(rgba)}
}
let evidenceCache
function copyEvidence(f) {
 const receipt=structuredClone(f.receipt),raw=structuredClone(f.raw),files=Object.fromEntries(Object.entries(f.files).map(([name,bytes])=>[name,Buffer.from(bytes)])),angel=raw.spellVisuals.angel,shield=raw.spellVisuals.shield
 const expected={...f.expected,files}
 const rebind=()=>{files['shield-visuals.json']=Buffer.from(JSON.stringify(shield));files['angel-visuals.json']=Buffer.from(JSON.stringify(angel));files['receipt.json']=Buffer.from(JSON.stringify(raw));receipt.artifacts=Object.fromEntries([...SPELL_VISUAL_FILES,...[angel.paused,angel.running].flatMap(r=>r.crops.map(c=>c.filename))].map(name=>[name,hash(files[name])]))}
 return {receipt,raw,angel,shield,files,expected,rebind}
}
function evidence(){
 if(evidenceCache)return copyEvidence(evidenceCache)
 const {r:paused,fixture}=observation('paused'),{r:running}=observation('running')
 const originalAngel=readFileSync(new URL('../app/original-angel.json',import.meta.url))
 const originalUnits=readFileSync(new URL('../app/original-units.json',import.meta.url))
 const inputs=Object.fromEntries(SPELL_VISUAL_INPUTS.map(name=>[name,hash(name)]));inputs['app/original-angel.json']=hash(originalAngel);inputs['app/original-units.json']=hash(originalUnits)
 const identity={repository:'JohnDeved/populous-new-dawn',runId:'100',runAttempt:'2',workflowRef:'test',mergeSha:source.commit,headSha:oid(2),baseSha:oid(3)}
 const github={head:oid(2),base:oid(3),merge:source.commit,runId:'100',runAttempt:'2'}
 const files=Object.fromEntries(SPELL_VISUAL_FILES.map(name=>[name,Buffer.from(name)]))
 const f=createAngelVisualFixture(source);fixture.transferSha256=hash(JSON.stringify(f.transfer));fixture.expectedSha256=hash(JSON.stringify(f.expected))
 files['angel-supplied-checkpoint.json']=Buffer.from(JSON.stringify(f.transfer));files['angel-supplied-expected.json']=Buffer.from(JSON.stringify(f.expected))
 files['angel-fixture-source.json']=Buffer.from(JSON.stringify(fixture))
 files['angel-public-save.json']=Buffer.from(JSON.stringify(f.transfer));files['angel-public-load-boundary.json']=Buffer.from(JSON.stringify(f.expected))
 const context=png(1440,1000).bytes
 for(const name of ['angel-paused-context.png','angel-loop-context.png','angel-death-context.png'])files[name]=context
 const state=fixture.state
 const angel={schema:'populous-new-dawn/angel-visuals',schemaVersion:1,status:'passed',sourceCommit:source.commit,expectedRevision:source.commit,
 source:Object.fromEntries(SPELL_VISUAL_INPUTS.slice(12,35).map(name=>[name,inputs[name]])),admission:'admitted',budget:{episode:50000,admission:60000,outerReserve:10000,outerDeadlineAt:180000,remainingAtAdmissionMs:180000},
 presentation:{testedCommit:source.commit,contextual:['angel-paused-context.png','angel-loop-context.png','angel-death-context.png']},
 elapsedMs:12000,contextClosed:true,contextCreationPending:false,cleanupPending:false,errors:[],fixture,setupCommittedReadback:true,setupLoadBoundaryMatched:true,
 pausedBefore:state,pausedAfter:state,publicSave:{version:4,state,sha256:hash(files['angel-public-save.json'])},publicLoad:{fullBoundaryMatched:true,state,sha256:hash(files['angel-public-load-boundary.json'])},paused,running}
 for(const r of [paused,running])for(const crop of r.crops){const image=png(crop.clip.width,crop.clip.height,crop.cleared?64:0);files[crop.filename]=image.bytes;crop.sha256=hash(image.bytes);crop.pixelChecksum=image.pixelChecksum;crop.opaqueColors=image.opaqueColors}
 for(const frame of running.contextFrames){const image=png(frame.clip.width,frame.clip.height,frame.label==='loop'?0:64);files[frame.filename]=image.bytes;frame.sha256=hash(image.bytes);frame.opaqueColors=image.opaqueColors;frame.pixelChecksum=image.pixelChecksum}
 const shield=shieldReceiptEvidence({source,inputs,files,png,units:JSON.parse(originalUnits)})
 const raw={browserDeadlineAt:180000,spellVisualEpisodeSha256:{angel:inputs['scripts/tutorial-browser/angel-visuals.mjs'],shield:inputs['scripts/tutorial-browser/shield-visuals.mjs']},status:'passed',selectedScenario:'spell-visuals',source:{commit:source.commit,files:inputs},buildRevision:source.commit,github,
 build:{exitCode:0,signal:null,timedOut:false,capMs:120000},browserCapMs:180000,sourceAfter:'identical',cleanupVerified:true,errors:[],dependencyChanges:[],
 dependenciesBeforeSha256:'a'.repeat(64),dependenciesAfterSha256:'a'.repeat(64),browserPath:'/opt/google/chrome/chrome',
 launch:{channel:'chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe'],timeout:30000},spellVisuals:{episodes:['angel','shield'],angel,shield}}
 const receipt={version:1,kind:'spell-visuals-browser',status:'passed',identity,inputs,github,artifacts:{},visualReview:'required'}
 const rebind=()=>{files['shield-visuals.json']=Buffer.from(JSON.stringify(shield));files['angel-visuals.json']=Buffer.from(JSON.stringify(angel));files['receipt.json']=Buffer.from(JSON.stringify(raw));receipt.artifacts=Object.fromEntries([...SPELL_VISUAL_FILES,...[paused,running].flatMap(r=>r.crops.map(c=>c.filename))].map(name=>[name,hash(files[name])]))}
 rebind();evidenceCache={receipt,raw,angel,shield,files,rebind,expected:{policy:SPELL_VISUAL_POLICY,identity,inputs,files,originalAngel,originalUnits}};return copyEvidence(evidenceCache)
}
test('source/receipt contract independently recomputes actual geometry/UV/height/scale evidence and hashes every retained byte',async()=>{
 const f=evidence();assert.equal(await validateSpellVisualReceipt(f.receipt,f.expected),true)
 assert.deepEqual(readSpellVisualReceiptLog(spellVisualReceiptLog(f.receipt)),f.receipt)
 assert.throws(()=>readSpellVisualReceiptLog(spellVisualReceiptLog(f.receipt)+'\n'+spellVisualReceiptLog(f.receipt)))
 for(const mutate of [f=>{f.angel.source={}},f=>{f.angel.status='failed'},f=>{f.angel.contextClosed=false},f=>{f.angel.elapsedMs=50000},f=>{f.angel.budget.remainingAtAdmissionMs=59999},
  f=>{f.angel.publicSave.version=3},f=>{f.angel.publicLoad.fullBoundaryMatched=false},f=>{f.angel.running.samples[0].shaderScale=1},f=>{f.angel.running.resources[0].uv[0]+=.1},
  f=>{f.angel.running.cleanup.disposed.texture=1},f=>{f.raw.sourceAfter='mutated'},f=>{f.raw.github.head=oid(4)},f=>{f.raw.launch.chromiumSandbox=false},f=>{f.raw.browserCapMs=180001},
  f=>{f.raw.spellVisuals.episodes=[]},f=>{f.angel.running.crops=[]}]){
   const g=evidence();mutate(g);g.rebind();await assert.rejects(()=>validateSpellVisualReceipt(g.receipt,g.expected))
 }
 const old=evidence();const record=checkpointCodec(JSON.parse(old.files['angel-public-save.json']),true);record.version=3;old.files['angel-public-save.json']=Buffer.from(JSON.stringify(checkpointCodec(record)));old.angel.publicSave.sha256=hash(old.files['angel-public-save.json']);old.rebind();await assert.rejects(()=>validateSpellVisualReceipt(old.receipt,old.expected))
 const badPng=evidence();badPng.files['angel-paused-context.png']=Buffer.from('not PNG');badPng.rebind();await assert.rejects(()=>validateSpellVisualReceipt(badPng.receipt,badPng.expected))
 const g=evidence();g.files['angel-public-save.json']=Buffer.from('different bytes');await assert.rejects(()=>validateSpellVisualReceipt(g.receipt,g.expected))
 await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,originalAngel:Buffer.from('{}')}))
 await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,policy:'profile-split-v1'}))
})
test('data-only exact numeric artifact resolver rejects wrong digest/name, missing and extra archive entries',async()=>{
 const f=evidence(),archive=artifactZip(Object.entries(f.files),{compress:true}),upload={id:123,name:`spell-visuals-browser-${source.commit}`,bytes:archive.length,sha256:hash(archive)}
 assert.equal((await resolveSpellVisualArtifact(archive,upload,f.receipt,f.expected)).visualReview,'required')
 await assert.rejects(resolveSpellVisualArtifact(archive,{...upload,name:'other'},f.receipt,f.expected))
 await assert.rejects(resolveSpellVisualArtifact(archive,{...upload,sha256:'0'.repeat(64)},f.receipt,f.expected))
 for(const entries of [Object.entries(f.files).slice(1),[...Object.entries(f.files),['unexpected.json','{}']]]){
  const archive=artifactZip(entries,{compress:true});await assert.rejects(resolveSpellVisualArtifact(archive,{...upload,bytes:archive.length,sha256:hash(archive)},f.receipt,f.expected))
 }
})

test('combined producer retains both mandatory episodes and round-trips the complete compact receipt',async()=>{
 const f=evidence(),dir=mkdtempSync(join(tmpdir(),'spell-visuals-producer-'))
 try {
  for(const [name,bytes] of Object.entries(f.files))writeFileSync(join(dir,name),bytes)
  const env={GITHUB_REPOSITORY:f.receipt.identity.repository,GITHUB_RUN_ID:'100',GITHUB_RUN_ATTEMPT:'2',GITHUB_WORKFLOW_REF:'test',PR_HEAD_SHA:oid(2),PR_BASE_SHA:oid(3)}
  assert.deepEqual(await spellVisualReceipt(f.raw,dir,env),f.receipt)
  assert.deepEqual(readSpellVisualReceiptLog(spellVisualReceiptLog(f.receipt)),f.receipt)
  assert.throws(()=>spellVisualReceiptLog({...f.receipt,padding:'x'.repeat(24000)}))
 } finally {rmSync(dir,{recursive:true,force:true})}
})
test('mandatory Shield contract fails closed for missing sources, old versions, lifecycle, pixel and expiry forgeries',async()=>{
 const mutations=[
  f=>{f.raw.spellVisuals.episodes=['angel']},f=>{delete f.raw.spellVisuals.shield},
  f=>{f.shield.source.files={}},f=>{f.shield.source.commit=oid(4)},f=>{f.shield.expectedRevision=oid(4)},
  f=>{f.raw.spellVisualEpisodeSha256.shield='a'.repeat(64)},f=>{f.shield.currentCheckpointVersion=3},
  f=>{f.shield.status='skipped'},f=>{f.shield.admission='skipped'},f=>{f.shield.timedOut=true},
  f=>{f.shield.budget.runnerDeadlineAt++},f=>{f.shield.budget.remainingAtAdmissionMs=180001},f=>{f.shield.budget.capMs=45001},f=>{f.shield.budget.remainingAtAdmissionMs=54999},
  f=>{f.shield.budget.elapsedMs=45000},f=>{f.shield.budget.deadlineMonotonicMs++},
  f=>{f.shield.cleanup.contextClosed=false},f=>{f.shield.cleanup.closedWithinBudget=false},
  f=>{f.shield.cleanup.lateCreation=true},f=>{f.shield.cleanup.creationPendingOrFailed=true},
  f=>{f.shield.cleanup.closedElapsedMs=45000},f=>{f.shield.errors=['page error']},
  f=>{f.shield.setup.version=3},f=>{f.shield.saved.version=3},f=>{f.shield.loaded.version=3},
  f=>{f.shield.initialLoad.completeWorldMatched=false},f=>{f.shield.loaded.completeWorldMatched=false},
  f=>{f.shield.beforeCast.shots=0},f=>{f.shield.afterCast.shots=1},
  f=>{delete f.shield.visiblePause.timestamp;delete f.shield.visiblePause.sceneTimestamp},
  f=>{delete f.shield.visiblePause.clockBefore;delete f.shield.visiblePause.clockAfter},
  f=>{f.shield.visiblePause.sceneTimestamp++},f=>{f.shield.visiblePause.clockAfter.animationFrame++},
  f=>{f.shield.visiblePause.beforeSha256=f.shield.visiblePause.afterSha256},f=>{delete f.shield.visiblePause},
  f=>{f.shield.pauseAfter.people[0].shield--},f=>{f.shield.atlas.sha256='0'.repeat(64)},
  f=>{f.shield.buildIdentity.revision=oid(4)},f=>{f.shield.captures.pop()},
  f=>{f.shield.captures[0].samples.pop()},f=>{f.shield.captures[0].samples[0].pieces[0].source++},
  f=>{f.shield.captures[0].samples[0].pieces[1].color=0x00ffff},
  f=>{f.shield.captures[0].samples[0].pieces[2].depth=1},
  f=>{f.shield.captures[0].samples[0].overlays=['HUD']},
  f=>{f.shield.captures[0].samples[0].causal.changedInsideShield=0},
  f=>{f.shield.captures[0].samples[0].retainedRgbaSha256='0'.repeat(64)},
  f=>{f.shield.disposal.disposedAtlas=1},f=>{f.shield.expiry.samples=[]},
  f=>{f.shield.expiry.samples.at(-1).people[0].remaining=1},
  f=>{f.shield.expiry.samples.at(-1).people[0].visible[0]=true},
  f=>{f.shield.expiry.samples.at(-1).turn=179},f=>{f.shield.terminal.people[0].shield=0},
 ]
 for(const mutate of mutations){const f=evidence();mutate(f);f.rebind();await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,f.expected))}
 for(const name of ['shield-visuals.json','shield-context.png','shield-original-3.png','shield-public-save.json']){
  const f=evidence();delete f.files[name];await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,f.expected))
 }
 for(const name of ['shield-original-0.png','shield-context.png']){
  const f=evidence();f.files[name]=Buffer.from('not a PNG');f.rebind();await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,f.expected))
 }
 const old=evidence(),saved=JSON.parse(old.files['shield-public-save.json']);saved.version=3;old.files['shield-public-save.json']=Buffer.from(JSON.stringify(saved));old.rebind();await assert.rejects(()=>validateSpellVisualReceipt(old.receipt,old.expected))
 const f=evidence();await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,originalUnits:Buffer.from('{}')}))
 await assert.rejects(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,policy:'spell-visuals-nine-v1'}))
 assert.equal(SPELL_VISUAL_FILES.length+22+1,50);assert.equal(new Set(SPELL_VISUAL_INPUTS).size,SPELL_VISUAL_INPUTS.length)
 for(const name of SHIELD_VISUAL_INPUTS)assert.ok(SPELL_VISUAL_INPUTS.includes(name))
 for(const name of SPELL_VISUAL_INPUTS)assert.ok(readFileSync(new URL('../'+name,import.meta.url)).length>0)
})

test('strict Angel source inventory matches every producer input including PNG transport', async () => {
 const { ANGEL_VISUAL_INPUTS } = await import('../scripts/tutorial-browser/angel-visuals.mjs')
 assert.deepEqual(ANGEL_VISUAL_INPUTS, SPELL_VISUAL_INPUTS.slice(12,35))
 assert.equal(SPELL_VISUAL_INPUTS.filter(name=>name==='scripts/tutorial-browser/compact-png.mjs').length,1)
})
