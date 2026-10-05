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
import { installReplacementObservation, replacementIdentity } from './replacement-observer.mjs'
import { missionTenSourceFacts, resolveAuthoredHut, observeInitialBraves, enterMissionTen } from './entry-identity.mjs'
import { requireOrdinaryMoveContinuation } from './input-boundary.mjs'
import { createEventDeadlines } from './event-deadlines.mjs'
import { checkpointGuardState } from './checkpoint-guard.mjs'
import { pinIdentityEpoch, requireIdentityEpoch, rebindIdentityEpoch, hasCurrentGuard, requireAdoptedGuard, requireLoadedIdentityBinding } from './guard-assertions.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const candidate = 'c20a297f5f815ce404f796b08f77ea56396f96da'
const baseline = '3b899125cc8cedef938823718ad5d44f49957b66'
const appTrees = { [candidate]: '1338564ae3119eb12f680d194f260a1e895378f3', [baseline]: '20b5894d4c17f120cd7608b4138953ea6c5f243f' }
const phase = p => Object.fromEntries(['object','draw','f1','f2','stamp','counter'].map(key => [key,p?.[key] ?? null]))
const person = (state, id) => state.units.find(u => u.id === id)
const activeGuard = hasCurrentGuard

export default async function nativeGuardWitness({ page, root, output, receipt, signal, url }) {
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
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root,'scripts/checkpoint-readback.mjs')).href)
  const construction=JSON.parse(readFileSync(resolve(here,'mission10-construction.json'),'utf8'))
  for(const [path,digest] of Object.entries(construction.hashes))assert.equal(hash(readFileSync(resolve(root,path))),digest,`Runtime construction source differs: ${path}`)
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
  const remaining = () => 300000 - (Date.now()-Date.parse(receipt.startedAt))
  const progress = status => writeFileSync(resolve(output,'witness.json'), JSON.stringify({status,head,isCandidate,inputs,runtimeBefore,training,checkpoints,screenshots,observations,identityBindings,stageTimes,sourceFacts,hutBinding,initialRoster,naturalBirths:[...naturalBirths.values()],eventStage:eventStages.current(),failures,latest,limits:{entryMs:60000,harnessMs:300000,parentEnvelopeMs:330000,speed:1,profile:false}},null,2)+'\n')
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
  const validatePinned = state => { if(isCandidate && identityPin) requireIdentityEpoch(state,identityPin) }
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
    if(!isCandidate)return
    assert.ok(identityPin,'Candidate Guard checks require an explicit identity pin')
    validatePinned(s)
    requireAdoptedGuard(s,fwId,shamanId)
  }
  const pressGuard = async ({cancel=false,allowPaused=false,repeat=false}={}) => {
    const result=await key('g',allowPaused), a=person(result.before,fwId),b=person(result.after,fwId)
    if(isCandidate) {
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
  const loadCycle = async mode => {
    eventStages.begin('checkpoint-'+mode+'-prepare',10000)
    // No active RAF observer crosses a world replacement. Registry identity does.
    await drain(true)
    if(mode==='replace')await select('firewarrior',fwId)
    else await clear()
    if(isCandidate)requireGuard(await read())
    await page.evaluate(()=>{ if(window.nativeGuardCapture)window.nativeGuardCapture.allowPaused=true })
    await button('Pause game',true)
    assert.equal((await read()).paused,true)
    await pressGuard({cancel:mode==='cancel',allowPaused:true,repeat:mode==='replace'})
    markStage('checkpoint-pending-'+mode)
    const pending=await page.evaluate(checkpointGuardState,{live:true,unitIds:[fwId,shamanId]})
    if(isCandidate)assert.equal(pending.people.find(u=>u.id===fwId)?.owners.find(p=>p.aliases.includes('native'))?.target,shamanId,'Paused replacement/cancellation retains the previously adopted native target')
    const phaseBefore=phase(person(await read(),fwId).native)
    await page.waitForTimeout(500)
    if(isCandidate)assert.deepEqual(phase(person(await read(),fwId).native),phaseBefore)
    await button('Game settings',true)
    const dialog=page.locator('dialog.game-dialog');await dialog.waitFor({state:'visible'})
    eventStages.finish();eventStages.begin('checkpoint-'+mode+'-save',15000)
    await controls('Save-checkpoint',()=>dialog.getByRole('button',{name:'Save checkpoint',exact:true}).click(),true)
    let savedHash,savedGuard
    assert.equal(await waitForCheckpointReadback(async()=>{
      check();savedHash=await page.evaluate(checkpointObservation)
      savedGuard=await page.evaluate(checkpointGuardState,{unitIds:[fwId,shamanId]})
      return savedHash?.level===10&&savedHash.turn===pending.turn&&JSON.stringify(savedGuard)===JSON.stringify(pending)
    },{attempts:100,pause:()=>page.waitForTimeout(100)}),true,'Ordinary Save committed the actual paused marker, aliases, queue, phase and tribe counters')
    markStage('checkpoint-committed-'+mode,{turn:savedHash.turn})
    await screenshot(`checkpoint-${mode}-saved`)
    eventStages.finish();eventStages.begin('checkpoint-'+mode+'-load-binding',15000)
    await page.evaluate(installReplacementObservation)
    log({action:'Load-checkpoint',savedHash,savedGuard})
    await dialog.getByRole('button',{name:'Load checkpoint',exact:true}).click()
    markStage('checkpoint-Load-delivered-'+mode)
    const loadedHash=await page.evaluate(checkpointObservation,{observationName:'campaignLoadBoundary'})
    const loadedGuard=await page.evaluate(checkpointGuardState,{observationName:'campaignLoadBoundary',unitIds:[fwId,shamanId]})
    for(const name of ['level','turn','time','actorsSha256','terrainSha256','stockSha256'])assert.deepEqual(loadedHash[name],savedHash[name],`Captured replacement ${name}`)
    assert.deepEqual(loadedGuard,savedGuard,'Captured pre-auto-resume guard checkpoint state')
    await bindGame(page)
    const identity=await page.evaluate(replacementIdentity)
    assert.equal(identity.sameStore,true);assert.equal(identity.newWorld,true);assert.equal(identity.newScene,true);assert.equal(identity.currentCorrespondence,true);assert.equal(identity.error,null)
    epoch=(await page.evaluate(installNativeGuardObserver,{hutId})).epoch
    // This is the sole explicit post-Load pinning read. Never retry/rebind on a
    // mismatch from ordinary read() or from a sampled row.
    const loadedState=await page.evaluate(()=>{
      const observed=window.campaignReplacement, scene=window.testSceneRef.current, world=window.testStore.getWorld()
      if(!observed || observed.pending || observed.error || observed.world!==world || scene.world!==world)throw Error('Unverified Load correspondence before identity rebind')
      return window.nativeGuardRead()
    })
    log({action:'raw-post-Load-boundary-snapshot',mode,state:loadedState,correspondence:identity})
    if(isCandidate) {
      requireLoadedIdentityBinding(loadedState,loadedGuard,fwId,shamanId)
      const previous=identityPin, next=rebindIdentityEpoch(previous,loadedState,identity)
      const binding={reason:'verified-ordinary-UI-Load',mode,previous,next,correspondence:identity,savedHash,observedAt:loadedState.now}
      identityBindings.push(binding);log({action:'identity-epoch-rebound',...binding});identityPin=next
    }
    const firstAsync=await read();health(firstAsync);assert.equal(firstAsync.paused,false)
    checkpoints.push({mode,pending,savedHash,savedGuard,loadedHash,loadedGuard,identity,firstAsync:{epoch:firstAsync.epoch,turn:firstAsync.turn,time:firstAsync.time,now:firstAsync.now}})
    await startCapture(15000,[fwId,shamanId])
    eventStages.finish();eventStages.begin('checkpoint-'+mode+'-real-continuation',8000)
    const resumedAt=performance.now()
    while(performance.now()-resumedAt<5000){await page.waitForTimeout(500);await drain();health(await read())}
    const continued=await read()
    assert.ok(continued.turn>savedHash.turn,'Actual normal turns followed UI Load')
    if(isCandidate){if(mode==='replace')requireGuard(continued);else {assert.equal(activeGuard(continued,fwId,shamanId),false);assert.equal(person(continued,fwId).native.guardInputPending,null);assert.equal(continued.tribeMana.shamanGuards,0)}}
    await screenshot(`checkpoint-${mode}-resumed-5s`)
    checkpoints.at(-1).continued=continued;markStage('checkpoint-continuation-'+mode,{turn:continued.turn});progress('in-progress');eventStages.finish()
  }
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
    if(isCandidate) {
      identityPin=pinIdentityEpoch(initialMove.inputAfter,[fwId,shamanId])
      const binding={reason:'captured-post-handler-model3-input',previous:null,next:identityPin,observedAt:moving.now}
      identityBindings.push(binding);log({action:'identity-epoch-pinned',...binding});validatePinned(moving)
    }
    markStage('initial-Move-accepted',{fwId,turn:moving.turn,threats:moving.threats})
    await startCapture(65000,[fwId,shamanId])
    const windowStart=await page.evaluate(()=>performance.now())
    const at=async(ms,label,body,origin=windowStart)=>{
      for(;;){const now=await page.evaluate(()=>performance.now());if(now>=origin+ms)break;await page.waitForTimeout(Math.min(500,origin+ms-now));await drain();health(await read())}
      const before=await read();assert.ok(before.now-origin-ms<=1500,`${label} missed its source-defined window`)
      log({action:'scheduled-boundary',label,offsetMs:ms,actualMs:before.now-origin})
      await body();const after=await read();log({action:'scheduled-completion',label,offsetMs:ms,actualMs:after.now-origin,bodyElapsedMs:after.now-before.now});assert.ok(after.now-origin-ms<=4000,`${label} action exceeded its window`);await drain()
    }
    await at(4000,'first-G',()=>pressGuard())
    await at(6000,'first-G-image',()=>screenshot('guard-06000-first-G'))
    requireGuard(await read())
    await at(9000,'first-deselection',()=>clear())
    await at(11000,'deselected-image',()=>screenshot('guard-11000-deselected'))
    requireGuard(await read())
    await at(14000,'reselect-firewarrior',()=>select('firewarrior',fwId))
    await at(16000,'repeat-G',()=>pressGuard({repeat:true}))
    await at(18000,'repeat-G-image',()=>screenshot('guard-18000-repeat-G'))
    requireGuard(await read())
    await at(22000,'empty-selection-cancellation',async()=>{await clear();requireGuard(await read());await pressGuard({cancel:true})})
    await at(24000,'empty-cancellation-image',()=>screenshot('guard-24000-empty-cancel'))
    await at(28000,'reissue-after-cancel',async()=>{await select('firewarrior',fwId);await pressGuard()})
    await at(34000,'shaman-only-cancellation',async()=>{requireGuard(await read());await select('shaman',shamanId);await pressGuard({cancel:true})})
    await at(36000,'shaman-cancellation-image',()=>screenshot('guard-36000-shaman-cancel'))
    await at(38000,'guard-again',async()=>{await select('firewarrior',fwId);await pressGuard()})
    // The proved control prefix ends here. Continuation has event-based deadlines,
    // with all evidence drained and the same document/owner pin retained.
    await drain(true)
    markStage('native-control-prefix-complete')
    await startCapture(35000,[fwId,shamanId])
    eventStages.begin('follow-selection-focus',4000)
    requireGuard(await read());await select('shaman',shamanId);await drain();eventStages.finish()
    eventStages.begin('accepted-shaman-move',4000)
    const followStart=await read();requireGuard(followStart);assert.deepEqual(followStart.selected,[shamanId])
    const shamanMove=await dispatch.move('shaman'),followOrigin=shamanMove.after.now
    log({action:'follow-event-origin',pageNow:followOrigin,acceptedInput:shamanMove.acceptance,turn:shamanMove.after.turn})
    await drain();eventStages.finish()
    eventStages.begin('native-follow-observation',18000)
    await at(6000,'following-image',()=>screenshot('guard-follow-accepted-plus-6000'),followOrigin)
    await at(14000,'following-observed',async()=>{
      const after=await read();requireGuard(after)
      if(isCandidate){const a=person(followStart,fwId),b=person(after,fwId),sa=person(followStart,shamanId),sb=person(after,shamanId)
        assert.ok(Math.hypot(sb.x-sa.x,sb.z-sa.z)>1,'Shaman actually moved under ordinary input')
        assert.ok(Math.hypot(b.x-a.x,b.z-a.z)>0.5,'Guard actually moved after Shaman input')
        assert.ok(b.native.goalX!==a.native.goalX||b.native.goalY!==a.native.goalY,'Guard goal reacted to the moved Shaman')}
      log({action:'following-evidence',before:followStart,after})
    },followOrigin)
    eventStages.finish()
    markStage('guard-input-window-complete')
    await loadCycle('replace')
    await loadCycle('cancel')
    await drain(true)
    assert.deepEqual(receipt.errors,[],'Browser errors are retained failures')
    assert.deepEqual(runtime(),runtimeBefore,'Runtime inputs stayed unchanged')
    for(const [name,digest]of Object.entries(inputs))assert.equal(hash(readFileSync(resolve(here,name))),digest,`Checker changed: ${name}`)
    markStage('ordinary-witness-complete')
    progress('passed')
    return {kind:'ordinary-Mission10-native-G',mode:isCandidate?'candidate-gate':'baseline-identical-input-capture',head,inputs,runtime:runtimeBefore,training,checkpoints,screenshots,observations,identityBindings,stageTimes,sourceFacts,hutBinding,initialRoster,naturalBirths:[...naturalBirths.values()],source:receipt.source,limitations:['Single naturally trained Firewarrior; shared multi-person allocation remains portable evidence.','Store replacement is captured before UI auto-resume; asynchronous first observation is separately labelled.','Independent RAF cannot prove every native visit, uninterrupted historical phase, original pixels or hardware performance.','Fresh-context in-session Save/Load only; no restart/profile persistence.']}
  }catch(error){failures.push({at:new Date().toISOString(),error:String(error?.stack??error)});progress('failed');throw error}
  finally{
    let cleanupFailure
    try{await drain(true)}catch(error){cleanupFailure=error;failures.push({cleanupObservation:String(error)})}
    try{await page.evaluate(()=>{window.campaignReplacement?.dispose?.();if(window.campaignEntityPointer){window.campaignEntityPointer.finish();delete window.campaignEntityPointer}})}catch{}
    if(failures.length)progress('failed')
    if(cleanupFailure)throw cleanupFailure
  }
}
