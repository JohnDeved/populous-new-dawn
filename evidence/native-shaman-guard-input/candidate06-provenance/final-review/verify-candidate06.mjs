import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { requireIdentityEpoch, requireAdoptedGuard, rebindIdentityEpoch, requireLoadedIdentityBinding } from '../native-guard-browser-preparation/guard-assertions.mjs'
import { acceptedInputBoundary } from '../native-guard-browser-preparation/input-boundary.mjs'
const root=process.cwd(),run=resolve(root,'work/orchestration/native-guard-browser-candidate-06'),prep=resolve(root,'work/orchestration/native-guard-browser-preparation')
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),json=p=>JSON.parse(readFileSync(p,'utf8'))
const w=json(run+'/run/witness.json'),inner=json(run+'/run/receipt.json'),outer=json(run+'/outer.json'),launcher=json(run+'/launcher.json')
const actions=readFileSync(run+'/run/actions.jsonl','utf8').trim().split('\n').map(JSON.parse)
assert.equal(w.status,'passed');assert.equal(inner.status,'passed');assert.equal(outer.status,'passed');assert.equal(outer.exitCode,0);assert.equal(launcher.exitCode,0)
assert.deepEqual(inner.source,inner.sourceAfter);assert.deepEqual(outer.source,outer.sourceAfter);assert.equal(inner.source.commit,'c20a297f5f815ce404f796b08f77ea56396f96da');assert.equal(inner.source.tree,'9af7241660efc11eb8969845ab7e587231d906bc');assert.equal(inner.source.status,'')
for(const name of ['stdout','stderr']){assert.equal(sha(outer.artifacts[name]),outer[name+'Sha256']);assert.equal(readFileSync(outer.artifacts[name],'utf8'),outer[name])}
for(const [name,digest]of Object.entries(w.inputs))assert.equal(sha(resolve(prep,name)),digest)
assert.equal(w.inputs['scenario.mjs'],'198073123b03c51f92a18ce0b2b18c23117bccee6b59ad97d743f89fbefd5279')
for(const [name,digest]of Object.entries(w.runtimeBefore.harness))assert.equal(sha(resolve(root,'scripts/local-render',name)),digest)
assert.equal(sha(w.runtimeBefore.browserPath),w.runtimeBefore.browserSha256);assert.equal(w.runtimeBefore.browserSha256,'7c141b276aacc74fe51f06986345fb0dbce0e3756413746fb18541b878c17706')
assert.deepEqual(inner.errors,[]);assert.deepEqual(w.failures,[]);assert.equal(w.eventStage,null)
assert.ok(launcher.postPorts.every(p=>p.closed));assert.equal(launcher.sourceStatusAfter,'');assert.equal(launcher.outer.sha256,sha(run+'/outer.json'));assert.equal(launcher.inner.sha256,sha(run+'/run/receipt.json'))
assert.equal(inner.launch.chromiumSandbox,true);assert.deepEqual(inner.launch.args,['--remote-debugging-pipe']);assert.equal(inner.profile,undefined)
const unit=(s,id=176)=>s.units.find(u=>u.id===id),pins=new Map(w.identityBindings.map(b=>[b.next.epoch,b])),identityCounts={},phaseSets={},rowHashes={};let count=0,occupancy=0,cost=0,firstFire=null
for(const name of readdirSync(run+'/run').filter(n=>/^epoch-\d+-rows\.jsonl$/.test(n)).sort()){
 rowHashes[name]=sha(run+'/run/'+name)
 for(const line of readFileSync(run+'/run/'+name,'utf8').trim().split('\n')){
  const s=JSON.parse(line);count++;assert.equal(s.speed,1);assert.equal(s.status,'playing');assert.equal(s.visibility,'visible');assert.equal(s.inputMask,0);assert.equal(s.campaignTimer,null)
  if(s.hut?.admission?.occupants.includes(122)){occupancy++;if(s.hut.admission.trainingCost===4000)cost++}
  const fire=unit(s);if(fire&&fire.hp>0)firstFire??={turn:s.turn,id:fire.id,kind:fire.kind,nativeModel:fire.native?.model,sourceBrave:unit(s,122)?.hp??null,trained:s.trained}
  const binding=pins.get(s.epoch)
  if(binding&&s.now>=binding.observedAt){requireIdentityEpoch(s,binding.next);identityCounts[s.epoch]=(identityCounts[s.epoch]??0)+1;phaseSets[s.epoch]??=new Set();phaseSets[s.epoch].add(JSON.stringify([fire.native.object,fire.native.draw,fire.native.f1,fire.native.f2]))}
 }
}
assert.equal(count,w.observations.reduce((n,o)=>n+o.rows,0));assert.equal(count,1031);assert.ok(occupancy>0&&cost>0)
for(const o of w.observations)assert.deepEqual(o.errors,[])
assert.deepEqual([w.training.sourceBraveId,w.training.newFirewarriorId],[122,176]);assert.equal(w.hutBinding.id,98)
let pendingKey=null,lastDelivery=null;const guards=[],inputBoundaries=[],eventStages=[],captureStarts=[];let follow
for(const x of actions){
 if(x.action==='entity-delivered-pointer-observation')lastDelivery=x.observed
 if(x.action==='synchronous-input-boundary-accepted'){
  const checked=acceptedInputBoundary(x.inputBefore,x.inputAfter,x.hit,lastDelivery);assert.deepEqual(checked.acceptance,x.acceptance);inputBoundaries.push({turn:x.inputAfter.turn,hit:x.hit,acceptance:x.acceptance})
 }
 if(x.action==='key-g')pendingKey=x.before
 if(x.action==='key-g-observed'){
  const s=x.after,u=unit(s),p=u.native;assert.equal(u.guard,false);assert.equal(u.sourceIdentity,u.nativeIdentity)
  if(s.paused){assert.equal(p.guardInputPending,true);const old=unit(pendingKey).native;for(const k of ['object','draw','f1','f2','stamp','counter','target'])assert.equal(p[k],old[k]);assert.equal(u.nativeIdentity,unit(pendingKey).nativeIdentity)}
  else if(s.selected.includes(176))requireAdoptedGuard(s,176,63)
  else {assert.equal(p.activeId,0);assert.equal(s.tribeMana.shamanGuards,0)}
  guards.push({turn:s.turn,paused:s.paused,selected:s.selected,command:p.commandStatus,activeId:p.activeId,count:s.tribeMana.shamanGuards,pending:p.guardInputPending})
 }
 if(x.action==='key-Escape-observed'&&x.after.turn>500&&x.after.turn<600){requireAdoptedGuard(x.after,176,63);assert.deepEqual(x.after.selected,[])}
 if(x.action==='following-evidence'){
  requireAdoptedGuard(x.after,176,63);const a=unit(x.before),b=unit(x.after),sa=unit(x.before,63),sb=unit(x.after,63)
  const fw=Math.hypot(b.x-a.x,b.z-a.z),shaman=Math.hypot(sb.x-sa.x,sb.z-sa.z);assert.ok(fw>.5&&shaman>1);assert.notDeepEqual([a.native.goalX,a.native.goalY],[b.native.goalX,b.native.goalY]);follow={beforeTurn:x.before.turn,afterTurn:x.after.turn,firewarriorDistance:fw,shamanDistance:shaman,goalBefore:[a.native.goalX,a.native.goalY],goalAfter:[b.native.goalX,b.native.goalY]}
 }
 if(x.action==='event-stage-complete'){assert.ok(x.elapsedMs<=x.limitMs);eventStages.push({name:x.name,elapsedMs:x.elapsedMs,limitMs:x.limitMs})}
 if(x.action==='observer-start')captureStarts.push(x.capture)
}
assert.equal(inputBoundaries.length,3);assert.equal(guards.length,8);assert.notEqual(guards[0].activeId,guards[1].activeId);assert.ok(follow);assert.equal(eventStages.length,11);assert.equal(captureStarts.length,5);assert.deepEqual(captureStarts.map(c=>c.epoch),[0,0,0,1,2])
assert.equal(w.checkpoints.length,2);const checkpoints=[]
for(const cp of w.checkpoints){
 assert.deepEqual(cp.pending,cp.savedGuard);assert.deepEqual(cp.savedGuard,cp.loadedGuard);assert.deepEqual(cp.savedHash,cp.loadedHash)
 const b=w.identityBindings.find(b=>b.mode===cp.mode),raw=actions.find(a=>a.action==='raw-post-Load-boundary-snapshot'&&a.mode===cp.mode).state
 requireLoadedIdentityBinding(raw,cp.loadedGuard,176,63);assert.deepEqual(rebindIdentityEpoch(b.previous,raw,cp.identity),b.next);requireIdentityEpoch(cp.continued,b.next)
 const p=cp.pending.people.find(u=>u.id===176).owners.find(p=>p.aliases.includes('native'));assert.equal(p.target,63);assert.equal(p.guardInputPending,true);assert.equal(cp.pending.paused,true)
 assert.ok(cp.continued.now-cp.firstAsync.now>=5000);assert.ok(cp.continued.turn>cp.savedHash.turn)
 if(cp.mode==='replace'){assert.ok(p.commands.some(Boolean));requireAdoptedGuard(cp.continued,176,63)}
 else{assert.ok(p.commands.every(x=>x===0));assert.equal(unit(cp.continued).native.activeId,0);assert.equal(unit(cp.continued).native.guardInputPending,null);assert.equal(cp.continued.tribeMana.shamanGuards,0)}
 checkpoints.push({mode:cp.mode,savedTurn:cp.savedHash.turn,firstAsyncTurn:cp.firstAsync.turn,continuedTurn:cp.continued.turn,observedContinuationMs:cp.continued.now-cp.firstAsync.now,epoch:b.next.epoch,personPhase:{object:p.object,draw:p.draw,f1:p.f1,f2:p.f2,stamp:p.stamp,counter:p.counter},checkpointSha256:cp.savedHash.checkpointSha256})
}
assert.equal(w.screenshots.length,11);for(const s of w.screenshots)assert.equal(sha(run+'/run/'+s.name+'.png'),s.sha256)
console.log(JSON.stringify({status:'passed',kind:'independent read-only candidate06 raw evidence audit',head:inner.source.commit,inputs:{launcher:sha(run+'/launcher.json'),outer:sha(run+'/outer.json'),inner:sha(run+'/run/receipt.json'),witness:sha(run+'/run/witness.json'),actions:sha(run+'/run/actions.jsonl'),rows:rowHashes},training:{occupancyRows:occupancy,cost4000Rows:cost,firstFire},rows:count,identityCounts,distinctObservedPhases:Object.fromEntries(Object.entries(phaseSets).map(([k,v])=>[k,v.size])),guards,inputBoundaries,follow,checkpoints,eventStages,captureStarts,screenshots:w.screenshots.map(s=>({name:s.name,sha256:s.sha256})),warnings:inner.warnings,limits:['Read-only revalidation of retained samples; no game/browser execution.','Independent RAF samples and explicit gaps do not prove every visit.','Checkpoint replacement capture precedes auto-resume; first asynchronous observation is later.','Cleanup is normal terminal exit plus closed ports and reviewed finally logic, not profile cleanup flags.']},null,2))
