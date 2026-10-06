// Frozen-input candidate gate / identical-input baseline capture. No model writes.
import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createOrdinaryInput } from './ordinary-input.mjs'
import { createOrderDispatch } from './ground-and-dispatch.mjs'
import { installNativeGuardObserver, startNativeGuardCapture, drainNativeGuardCapture, setNativeGuardObservedIds, setNativeGuardObservedHut } from './observer.mjs'
import { missionTenSourceFacts, resolveAuthoredHut, observeInitialBraves, enterMissionTen } from './entry-identity.mjs'
import { requireOrdinaryMoveContinuation } from './input-boundary.mjs'
import { createEventDeadlines } from './event-deadlines.mjs'
import { requireGestureProgress } from './gesture-progress.mjs'
import { pinIdentityEpoch, requireIdentityEpoch, hasCurrentGuard, requireAdoptedGuard } from './guard-assertions.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const candidate = 'a577e3635e303e5026a4a576963d135f9b1641d4'
const baseline = '89e68606a406f93715b930550317519818ddc081'
const appTrees = { [candidate]: '70ca3233de4be0a958d47b84b9723b69291d1b34', [baseline]: '6f4235c9e6ca59f478d3c9834a9740a0c5142318' }
const phase = p => Object.fromEntries(['object','draw','f1','f2','stamp','counter'].map(key => [key,p?.[key] ?? null]))
const person = (state, id) => state.units.find(u => u.id === id)
const activeGuard = hasCurrentGuard

export default async function firewarriorRestingWitness({ page, root, output, receipt, signal, url }) {
  const stageTimes=[]
  const stampStage=(name,details={})=>{const stage={name,at:new Date().toISOString(),monotonicMs:performance.now(),wallMs:Date.now()-Date.parse(receipt.startedAt),...details};stageTimes.push(stage);return stage}
  stampStage('scenario-start')
  assert.ok(resolve(output)!==here&&!resolve(output).startsWith(here+'/'),'Run artifacts must not overwrite the frozen preparation')
  assert.equal(receipt.profile, undefined, 'Use the fresh ephemeral harness context; no profile')
  const git = (...args) => execFileSync('git', ['-C',root,...args], { encoding:'utf8' }).trim()
  const head = git('rev-parse','HEAD'), isCandidate = head === candidate
  assert.ok(head === candidate || head === baseline, 'Only the frozen candidate or baseline is permitted')
  assert.equal(git('status','--porcelain'), '', 'Runtime tracked/untracked source must be clean')
  assert.equal(git('rev-parse','HEAD:app'), appTrees[head])
  const inputs = Object.fromEntries(readdirSync(here).filter(name => /\.(mjs|json|md|txt)$/.test(name)).sort().map(name => [name, hash(readFileSync(resolve(here,name)))]))
  const runtime = () => {
    const require = createRequire(resolve(root,'package.json'))
    return { node:process.version, platform:process.platform, arch:process.arch,
      browserPath:receipt.launch.executablePath, browserSha256:hash(readFileSync(receipt.launch.executablePath)),
      playwright:require('@playwright/test/package.json').version,
      playwrightCoreSha256:hash(readFileSync(resolve(dirname(require.resolve('playwright-core/package.json')),'lib/coreBundle.js'))),
      installedLockSha256:hash(readFileSync(resolve(root,'node_modules/.package-lock.json'))),
      harness:Object.fromEntries(['harness.mjs','owned-profile.mjs','checkpoint-observer.mjs','vite.config.mjs'].map(name => [name,hash(readFileSync(resolve(root,'scripts/local-render',name)))])) }
  }
  stampStage('runtime-fingerprint-start')
  const runtimeBefore = runtime()
  stampStage('runtime-fingerprint-complete')
  const { showAllMissions, bindGame, waitForShamanReadiness } = await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  const { checkpointObservation } = await import(pathToFileURL(resolve(root,'scripts/local-render/checkpoint-observer.mjs')).href)
  const construction=JSON.parse(readFileSync(resolve(here,'mission10-construction.json'),'utf8'))
  for(const [path,digest] of Object.entries(construction.hashes))assert.equal(hash(readFileSync(resolve(root,path))),path==='scripts/local-render/harness.mjs'?'fb07de9e278f26b2b32324defeb6164832472a58d422aead1032b7db7ee85fcf':digest,`Runtime construction source differs: ${path}`)
  const levelText=readFileSync(resolve(root,'app/level-ten.ts'),'utf8')
  const level=JSON.parse(levelText.slice(levelText.indexOf('export default ')+15).trim().replace(/;$/,''))
  const sourceFacts=missionTenSourceFacts(level,JSON.parse(readFileSync(resolve(root,'app/original-rules.json'),'utf8')),construction)
  stampStage('helpers-and-source-facts-ready')
  page.setDefaultTimeout(5000)
  let latest, epoch = -1, firstTotemId, capture = null, fwId, shamanId, braveId, hutId
  const observations = [], training = { sawOccupant:false, sawCost4000:false, sourceBraveId:null, newFirewarriorId:null }, checkpoints = []
  const screenshots = [], failures = [], identityBindings = []
  let identityPin = null, hutBinding = null, initialRoster = null
  const naturalBirths = new Map()
  const log = entry => { const event = { at:new Date().toISOString(), wallMs:Date.now()-Date.parse(receipt.startedAt), ...entry }; appendFileSync(resolve(output,'actions.jsonl'),JSON.stringify(event)+'\n') }
  const markStage=(name,details={})=>log({action:'stage',...stampStage(name,details)})
  for(const stage of stageTimes)log({action:'stage',...stage})
  const remaining = () => 360000 - (Date.now()-Date.parse(receipt.startedAt))
  const progress = status => writeFileSync(resolve(output,'witness.json'), JSON.stringify({status,head,isCandidate,inputs,runtimeBefore,training,gesture,checkpoints,screenshots,observations,identityBindings,stageTimes,sourceFacts,hutBinding,initialRoster,naturalBirths:[...naturalBirths.values()],eventStage:eventStages.current(),failures,latest,limits:{entryMs:60000,harnessMs:360000,parentEnvelopeMs:390000,speed:1,profile:false}},null,2)+'\n')
  const eventStages=createEventDeadlines({globalCheck:()=>{signal.throwIfAborted();assert.ok(remaining()>0,'Outer real-clock envelope exhausted')},log})
  const check=eventStages.check
  const health = (s, allowPaused=false) => {
    assert.deepEqual(receipt.errors,[],'Application exceptions invalidate the witness')
    check(); assert.equal(s.level,10); assert.equal(s.status,'playing'); assert.equal(s.speed,1)
    assert.equal(s.inputMask,0); assert.equal(s.visibility,'visible'); assert.equal(s.campaignTimer,null)
    if (!allowPaused) assert.equal(s.paused,false)
    const shrine = s.shrines.find(h => h.id === firstTotemId)
    if (firstTotemId) { assert.equal(shrine?.uses,0); assert.equal(shrine?.remaining,1); assert.equal(shrine?.progress,0) }
    for (const id of [fwId,shamanId].filter(Boolean)) {
      const actor=person(s,id);assert.ok(actor?.hp>0);assert.equal(actor.inside,null)
      assert.equal(actor.native?.vehicle??0,0,'Ordinary witness actors remain on foot')
    }
  }
  const validatePinned = state => { if(identityPin) requireIdentityEpoch(state,identityPin) }
  const read = async () => {
    check(); latest = await page.evaluate(() => window.nativeGuardRead()); check()
    try { validatePinned(latest) }
    catch(error) { log({action:'identity-check-failed',scope:'current-read',pin:identityPin,state:latest,error:String(error)});throw error }
    return latest
  }
  const drain = async (finish=false) => {
    if (!capture) return []
    const batch = await page.evaluate(drainNativeGuardCapture,{finish})
    if (!batch) return []
    for (const row of batch.rows) {
      appendFileSync(resolve(output,`epoch-${row.epoch}-rows.jsonl`),JSON.stringify(row)+'\n')
      for(const brave of row.braveRoster??[])if(!sourceFacts.originalBraves.some(original=>original.id===brave.id)&&!naturalBirths.has(brave.id))naturalBirths.set(brave.id,{...brave,firstObservedEpoch:row.epoch,firstObservedTurn:row.turn,firstObservedNow:row.now})
      if (braveId && row.hut?.admission?.occupants.includes(braveId)) training.sawOccupant = true
      if (braveId && row.hut?.admission?.occupants.includes(braveId) && row.hut.admission.trainingCost === 4000) training.sawCost4000 = true
    }
    observations.push({epoch,startedAt:batch.startedAt,endedAt:batch.endedAt,rows:batch.rows.length,totalRows:batch.totalRows,errors:batch.errors,drainedAt:new Date().toISOString()})
    progress('in-progress')
    if (finish) capture=null
    // Preserve the entire raw batch before rejecting its first mismatched row.
    for(const row of batch.rows) {
      try { validatePinned(row) }
      catch(error) { log({action:'identity-check-failed',scope:'sampled-row',pin:identityPin,state:row,error:String(error)});throw error }
    }
    assert.deepEqual(batch.errors,[],'Independent RAF observer failed')
    if (!finish) assert.equal(batch.running,true,'Independent RAF observer stopped early')
    return batch.rows
  }
  const startCapture = async (maxMs, requiredIds) => { capture=await page.evaluate(startNativeGuardCapture,{maxMs,requiredIds}); log({action:'observer-start',capture}) }
  const pollUI = async (predicate, timeout, label) => {
    const end = performance.now()+timeout
    for (;;) {
      check()
      if (await predicate()) return
      if (performance.now()>=end) throw Error(`Timed out: ${label}`)
      await page.waitForTimeout(100)
    }
  }
  const controls = async (label, body, allowPaused=false) => {
    const before=await read(); health(before,allowPaused); log({action:label,before})
    await body(); check()
    const after=await read(); health(after,allowPaused); log({action:`${label}-observed`,after})
    return {before,after}
  }
  const key = (name,allowPaused=false) => controls(`key-${name}`,()=>page.keyboard.press(name),allowPaused)
  const button = (name,allowPaused=false) => controls(`button-${name}`,()=>page.getByRole('button',{name,exact:true}).click(),allowPaused)
  const clear = async (allowPaused=false) => {
    for(let i=0;i<2;i++) { const s=await read(); if(s.mode===null&&!s.selected.length)return s; await key('Escape',allowPaused) }
    const s=await read(); assert.equal(s.mode,null);assert.deepEqual(s.selected,[]);return s
  }
  const select = async (kind,id) => {
    await clear()
    await button(kind==='shaman'?'Select and focus shaman':`Select ${kind}`)
    const s=await read(); assert.deepEqual(s.selected,[id]); return s
  }
  const screenshot = async name => {
    const before=await read()
    const path=resolve(output,`${name}.png`)
    await page.screenshot({path,timeout:5000})
    const after=await read()
    const record={name,before:{epoch:before.epoch,now:before.now,turn:before.turn,camera:before.camera,selected:before.selected},after:{epoch:after.epoch,now:after.now,turn:after.turn,camera:after.camera,selected:after.selected},sha256:hash(readFileSync(path))}
    screenshots.push(record);log({action:'screenshot',...record});return record
  }
  const requireGuard = s => {
    assert.ok(identityPin,'Candidate Guard checks require an explicit identity pin')
    validatePinned(s)
    requireAdoptedGuard(s,fwId,shamanId)
  }
  const pressGuard = async ({cancel=false,allowPaused=false,repeat=false}={}) => {
    const result=await key('g',allowPaused), a=person(result.before,fwId),b=person(result.after,fwId)
    {
      assert.deepEqual(result.after.selected,result.before.selected,'G retains selection')
      assert.equal(b.nativeIdentity,a.nativeIdentity,'G keeps the actual native person object')
      assert.equal(b.sourceIdentity,b.nativeIdentity,'Native person retains renderer ownership')
      assert.equal(b.guard,false)
      if(cancel){ assert.equal(activeGuard(result.after,fwId,shamanId),false);assert.equal(result.after.tribeMana.shamanGuards,0) }
      else { assert.equal(activeGuard(result.after,fwId,shamanId),true);if(repeat)assert.notEqual(b.native.activeId,a.native.activeId,'Repeat replaces the allocated command') }
      if(allowPaused) { assert.equal(b.native.guardInputPending,true);assert.equal(b.native.target,a.native.target,'Paused G preserves its actual prior native target');assert.deepEqual(phase(b.native),phase(a.native),'Paused producer changes no phase field') }
    }
    return result
  }
  let gesture = null
  const renderedGesture = () => page.evaluate(async id => {
    const { default: art } = await import('/app/original-units.json')
    const scene=window.testSceneRef.current,world=scene.world,u=world.units.find(u=>u.id===id),p=u?.native,g=scene.unitMeshes.get(id)
    if(!u||!p||!g)return null
    const directions=Object.values(art.animations[`${u.team}-firewarrior`]).find(rows=>rows[0].source===p.object)
    const camera=Math.round(scene.cameraBearing*1024/Math.PI),heading=Math.round((Math.PI-u.heading)*1024/Math.PI)
    const direction=((((camera<<16)>>16)-((heading<<16)>>16)-0x380)&0x700)>>8
    const canvas=scene.renderer.domElement,screen=scene.view.screen(g.position,scene.camera),rectangle=canvas.getBoundingClientRect()
    const client={x:rectangle.left+(screen.x+1)*rectangle.width/2,y:rectangle.top+(1-screen.y)*rectangle.height/2}
    const canvasOwned=document.elementFromPoint(client.x,client.y)===canvas
    return {screen:{x:screen.x,y:screen.y},client,canvasOwned,viewport:{width:rectangle.width,height:rectangle.height},turn:world.turn,paused:world.paused,id,object:p.object,draw:p.draw,f1:p.f1,f2:p.f2,stamp:p.stamp,direction,ownerPresent:true,artworkSource:directions?.[0]?.source??null,expectedFrame:directions?.[direction]?.frames[p.f2]??null,actualFrame:g.userData.frame,actualVfra:art.frames[g.userData.frame]?.source,flip:g.userData.frameFlip,meshVisible:g.visible,objectsVisible:scene.objects.visible,sceneVisible:scene.scene.visible}
  },fwId)
  try {
    assert.equal(await page.evaluate(checkpointObservation),null,'Fresh context contains no prior checkpoint')
    const readiness=await enterMissionTen({page,showAllMissions,bindGame,waitForShamanReadiness,markStage,entryRemaining:()=>60000-(Date.now()-Date.parse(receipt.startedAt)),check})
    check()
    epoch=(await page.evaluate(installNativeGuardObserver)).epoch
    // Current-origin imports are resolved by this tested runtime's Vite server.
    const probeText=readFileSync(resolve(here,'browser-probes.mjs'),'utf8').replaceAll("from '/app/",`from '${url}/app/`)
    const probeData='data:text/javascript;base64,'+Buffer.from(probeText).toString('base64')
    await page.evaluate(async source=>{window.nativeGuardProbes=await import(source)},probeData)
    const initial=await read();health(initial)
    assert.ok(Date.now()-Date.parse(receipt.startedAt)<60000,'Entry/readiness real-clock bound')
    const blue=initial.units.filter(u=>u.hp>0)
    initialRoster=observeInitialBraves(blue,sourceFacts)
    for(const brave of initialRoster.additional)naturalBirths.set(brave.id,{...brave,firstObservedEpoch:initial.epoch,firstObservedTurn:initial.turn,firstObservedNow:initial.now})
    assert.equal(blue.filter(u=>u.kind==='firewarrior').length,0)
    const shaman=blue.find(u=>u.kind==='shaman');assert.ok(shaman);shamanId=shaman.id
    const firstTotem=initial.shrines.find(h=>h.kind==='linkedEffects'&&h.x===29&&h.z===-67);assert.ok(firstTotem);firstTotemId=firstTotem.id;health(initial)
    hutBinding=resolveAuthoredHut(initial.buildings,sourceFacts.hut);hutId=hutBinding.id
    await page.evaluate(setNativeGuardObservedHut,hutId)
    const bound=await read();assert.equal(bound.hut?.id,hutId)
    markStage('ordinary-roster-and-hut-bound',{hutBinding,originalBraves:initialRoster.original.map(u=>u.id),additionalBraves:initialRoster.additional.map(u=>u.id),threats:bound.threats})
    log({action:'ordinary-entry-accepted',initial,readiness})
    const ordinary=createOrdinaryInput({page,read,log,signal,health,pollUI})
    const dispatch=createOrderDispatch({page,read,log,pollUI,health,ordinary,signal})
    const targetStarted=performance.now()
    const hutHit=await ordinary.targetEntity('buildings',hutId)
    assert.ok(performance.now()-targetStarted<=15000,'Target/view real-clock bound')
    markStage('training-hut-target-prepared',{hutId})
    await screenshot('training-hut-target')
    await clear();await button('Select brave')
    const selected=await read();assert.equal(selected.selected.length,1)
    braveId=selected.selected[0];assert.equal(person(selected,braveId).kind,'brave');assert.ok(sourceFacts.originalBraves.some(u=>u.id===braveId),'Actual HUD selection belongs to the original source-proven Brave roster');training.sourceBraveId=braveId
    markStage('original-Brave-selected',{braveId,actor:person(selected,braveId),threats:selected.threats})
    const initialIds=initial.units.map(u=>u.id)
    await page.evaluate(setNativeGuardObservedIds,[braveId,shamanId])
    assert.ok(remaining()>105000,'Insufficient real-clock envelope for training and complete guard sequence')
    await startCapture(Math.min(180000,remaining()-100000),[shamanId])
    const accepted=await dispatch.clickOrder(hutHit)
    assert.equal(person(accepted.after,braveId).work,hutId,'Training input must be accepted before waiting')
    markStage('training-input-accepted',{braveId,hutId,turn:accepted.after.turn,threats:accepted.after.threats})
    training.acceptance=accepted
    const trainingStart=performance.now();let signature,lastChanged=trainingStart,summaryAt=trainingStart
    while(!fwId){
      await page.waitForTimeout(500);await drain();const s=await read();health(s)
      const candidates=s.units.filter(u=>u.hp>0&&u.kind==='firewarrior'&&!initialIds.includes(u.id))
      const exited=candidates.find(u=>u.inside===null&&!u.busy.entry&&u.selectable&&u.mesh?.visible&&u.native?.class===1&&u.native.model===6)
      const trainee=person(s,braveId),admission=s.hut.admission
      if(!trainee||trainee.hp<=0)assert.ok(candidates.length>0&&s.trained>initial.trained,'The training Brave was lost before actual replacement allocation')
      const next=JSON.stringify([trainee&&[trainee.hp,trainee.x,trainee.z,trainee.inside,trainee.work,trainee.path],admission&&[admission.inside,admission.entering,admission.occupants,admission.queueHead,admission.queueFrom,admission.storedMana,admission.trainingCost],s.trained,[s.tribeMana.available,s.tribeMana.pending,s.tribeMana.mana],candidates.map(u=>[u.id,u.inside,u.hp])])
      if(next!==signature){signature=next;lastChanged=performance.now()}
      if(performance.now()-summaryAt>=15000){log({action:'training-progress',elapsedMs:performance.now()-trainingStart,state:s,training});summaryAt=performance.now()}
      if(exited){fwId=exited.id;training.newFirewarriorId=fwId;assert.ok(training.sawOccupant,'Raw RAF sampled source Brave occupancy');assert.ok(training.sawCost4000,'Raw RAF sampled the actual ordinary 4000-mana training cost');assert.ok(!trainee||trainee.hp<=0,'Training removes the original Brave');assert.ok(s.trained>initial.trained);break}
      assert.ok(performance.now()-lastChanged<30000,'Training progress timeout; clock alone is not progress')
      assert.ok(performance.now()-trainingStart<180000,'Training resource bound')
      assert.ok(remaining()>100000,'Acquisition exhausted the complete-sequence resource reserve')
    }
    await drain(true)
    markStage('trained-Firewarrior-exited',{fwId,braveId,hutId})
    await page.evaluate(setNativeGuardObservedIds,[fwId,shamanId])
    await select('firewarrior',fwId)
    // An ordinary Move establishes supported on-foot move ownership before G.
    const initialMove=await dispatch.move('firewarrior')
    const moving=await read();health(moving)
    const continuation=requireOrdinaryMoveContinuation(initialMove.inputAfter,moving,fwId)
    log({action:'initial-Move-input-and-later-owner',assigned:initialMove.inputAfter,observed:moving,continuation})
    {
      identityPin=pinIdentityEpoch(initialMove.inputAfter,[fwId,shamanId])
      const binding={reason:'captured-post-handler-model3-input',previous:null,next:identityPin,observedAt:moving.now}
      identityBindings.push(binding);log({action:'identity-epoch-pinned',...binding});validatePinned(moving)
    }
    markStage('initial-Move-accepted',{fwId,turn:moving.turn,threats:moving.threats})
    await startCapture(180000,[fwId,shamanId])
    eventStages.begin('ordinary-G-adoption-and-cancellation',15000)
    await pressGuard()
    await pollUI(()=>page.evaluate(id=>{const p=window.testStore.getWorld().units.find(u=>u.id===id)?.native;return p?.state===10&&p.commandStatus===30&&!p.guardInputPending},fwId),5000,'real Guard adoption')
    requireGuard(await read())
    await clear();await pressGuard({cancel:true});await drain()
    eventStages.finish()
    markStage('ordinary-Guard-cancelled-for-resting',{fwId})
    eventStages.begin('natural-source720-observation',125000)
    const searchStarted=performance.now();let lastDrain=searchStarted
    for (;;) {
      check()
      const found=await page.evaluate(id=>{const w=window.testStore.getWorld(),u=w.units.find(u=>u.id===id),p=u?.native;return !w.paused&&p?.state===19&&p.object===720&&p.draw===18&&p.f2<=3&&u.hp>0&&u.inside===null},fwId)
      if(found)break
      if(performance.now()-searchStarted>120000)throw Error('Natural source720 was not observed within the declared window')
      await page.waitForTimeout(100)
      if(performance.now()-lastDrain>=1000){await drain();health(await read());lastDrain=performance.now()}
    }
    // Only our diagnostic observer permits this public Pause. No game clock is written.
    await page.evaluate(()=>{window.nativeGuardCapture.allowPaused=true})
    await page.getByRole('button',{name:'Pause game',exact:true}).click()
    const paused=await read();health(paused,true);assert.equal(paused.paused,true)
    const fw=person(paused,fwId)
    assert.equal(fw.native.object,720,'Gesture ended before public Pause; no substitute screenshot')
    assert.equal(fw.native.draw,18);assert.equal(fw.sourceIdentity,fw.nativeIdentity)
    assert.ok(fw.native.f2<=5,'Public Pause missed the declared early gesture phase')
    gesture={before:paused,render:await renderedGesture()}
    assert.equal(gesture.render.object,720)
    assert.equal(gesture.render.meshVisible,true);assert.equal(gesture.render.objectsVisible,true);assert.equal(gesture.render.sceneVisible,true);assert.equal(gesture.render.canvasOwned,true,'The actual projected gesture point must belong to the game canvas')
    assert.ok(Number.isFinite(gesture.render.screen.x)&&Number.isFinite(gesture.render.screen.y)&&Math.abs(gesture.render.screen.x)<0.9&&Math.abs(gesture.render.screen.y)<0.9,'Actual gesture actor must remain inside the rendered viewport')
    if(isCandidate){assert.equal(gesture.render.artworkSource,720);assert.equal(gesture.render.actualFrame,gesture.render.expectedFrame)}
    else{assert.equal(gesture.render.artworkSource,null);assert.ok(gesture.render.actualVfra<3707||gesture.render.actualVfra>3776)}
    log({action:'paused-natural-source720',gesture})
    await screenshot('natural-source720-idle')
    const pausedPhase=phase(person(await read(),fwId).native)
    await page.waitForTimeout(300)
    assert.deepEqual(phase(person(await read(),fwId).native),pausedPhase)
    await button('Select firewarrior',true)
    const selectedPose=await read();assert.deepEqual(selectedPose.selected,[fwId])
    assert.deepEqual(phase(person(selectedPose,fwId).native),pausedPhase,'Paused selection retains native phase')
    gesture.selectedRender=await renderedGesture()
    assert.equal(gesture.selectedRender.canvasOwned,true,'Selected gesture point must still belong to the canvas')
    if(isCandidate){assert.equal(gesture.selectedRender.artworkSource,720);assert.equal(gesture.selectedRender.actualFrame,gesture.selectedRender.expectedFrame)}
    else assert.equal(gesture.selectedRender.artworkSource,null)
    await screenshot('natural-source720-selected')
    await drain();eventStages.finish()
    eventStages.begin('gesture-native-phase-continuation',10000)
    await button('Resume game',true)
    const continuationStart=performance.now()
    const samples=[]
    for(;;){
      const state=await read();health(state);const u=person(state,fwId)
      assert.equal(u.sourceIdentity,u.nativeIdentity,'Continuation keeps the actual native animation owner')
      if(u.native.object!==720){gesture.after=state;break}
      const rendered=await renderedGesture();samples.push(rendered)
      if(isCandidate&&rendered.object===720){assert.equal(rendered.artworkSource,720);assert.equal(rendered.actualFrame,rendered.expectedFrame)}
      if(performance.now()-continuationStart>8000)throw Error('Resting gesture failed to complete within continuation bound')
      await page.waitForTimeout(75);await drain()
    }
    gesture.samples=samples
    gesture.progress=requireGestureProgress(samples)
    assert.ok(gesture.after.turn>gesture.before.turn)
    assert.equal(person(gesture.after,fwId).nativeIdentity,fw.nativeIdentity)
    assert.equal(person(gesture.after,fwId).native.object,48,'Actual controller returns to idle')
    log({action:'source720-continuation',gesture});await drain(true);eventStages.finish()
    assert.deepEqual(receipt.errors,[],'Browser errors are retained failures')
    assert.deepEqual(runtime(),runtimeBefore,'Runtime inputs stayed unchanged')
    for(const [name,digest]of Object.entries(inputs))assert.equal(hash(readFileSync(resolve(here,name))),digest,`Checker changed: ${name}`)
    markStage('ordinary-witness-complete')
    progress('passed')
    return {kind:'ordinary-Mission10-Firewarrior-resting720',gesture,mode:isCandidate?'candidate-artwork':'baseline-missing-artwork',head,inputs,runtime:runtimeBefore,training,checkpoints,screenshots,observations,identityBindings,stageTimes,sourceFacts,hutBinding,initialRoster,naturalBirths:[...naturalBirths.values()],source:receipt.source,limitations:['Single naturally trained Firewarrior; shared multi-person allocation remains portable evidence.','The naturally produced gesture is paused only through the public control; no RNG or phase injection.','Independent RAF cannot prove every native visit, uninterrupted historical phase, original pixels or hardware performance.','No checkpoint, full native rendering, blending or other-family acceptance is claimed.']}
  }catch(error){failures.push({at:new Date().toISOString(),error:String(error?.stack??error)});progress('failed');throw error}
  finally{
    let cleanupFailure
    try{await drain(true)}catch(error){cleanupFailure=error;failures.push({cleanupObservation:String(error)})}
    try{await page.evaluate(()=>{if(window.campaignEntityPointer){window.campaignEntityPointer.finish();delete window.campaignEntityPointer}})}catch{}
    if(failures.length)progress('failed')
    if(cleanupFailure)throw cleanupFailure
  }
}
