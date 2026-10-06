// Ordinary candidate only: real entry/training/Move/Pause, passive observations.
import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createOrdinaryInput } from './ordinary-input.mjs'
import { createOrderDispatch } from './ground-and-dispatch.mjs'
import { installNativeGuardObserver, startNativeGuardCapture, drainNativeGuardCapture,
  setNativeGuardObservedIds, setNativeGuardObservedHut } from './observer.mjs'
import { missionTenSourceFacts, resolveAuthoredHut, observeInitialBraves, enterMissionTen } from './entry-identity.mjs'
import { createEventDeadlines } from './event-deadlines.mjs'
import { installPauseInputObserver, requirePauseInput } from './pause-input.mjs'
import { pinIdentityEpoch, requireIdentityEpoch } from './guard-assertions.mjs'
import { installTextureObserver, captureUnitTexture } from './texture-observation.mjs'
import { requireUnitTexture, requireSameUnitTexture } from './texture-assertions.mjs'

const here=dirname(fileURLToPath(import.meta.url))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const actor=(row,id)=>row.units.find(u=>u.id===id)
const phase=p=>Object.fromEntries(['object','draw','f1','f2','counter','stamp','animationMode','timer'].map(k=>[k,p?.[k]]))

export default async function firingCandidate({page,root,output,receipt,signal,url}) {
  const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim()
  const head=git('rev-parse','HEAD')
  assert.equal(git('status','--porcelain'),'')
  const candidate=JSON.parse(readFileSync(resolve(here,'candidate-source.json'),'utf8'))
  assert.equal(candidate.status,'ready')
  assert.match(candidate.candidateCommit,/^[a-f0-9]{40}$/)
  assert.equal(git('rev-parse','HEAD:app'),candidate.appTree)
  assert.equal(git('rev-parse','HEAD:public'),candidate.publicTree)
  for(const [path,digest]of Object.entries(candidate.changedFiles))assert.equal(hash(readFileSync(resolve(root,path))),digest,path)
  assert.equal(receipt.profile,undefined)
  assert.ok(!resolve(output).startsWith(here+'/'))
  const inputs=Object.fromEntries(readdirSync(here).filter(n=>/\.(mjs|json|md)$/.test(n)).sort()
    .map(n=>[n,hash(readFileSync(resolve(here,n)))]))
  const runtime=()=>{
    const require=createRequire(resolve(root,'package.json'))
    return {node:process.version,browserPath:receipt.launch.executablePath,
      browserSha256:hash(readFileSync(receipt.launch.executablePath)),
      installedLockSha256:hash(readFileSync(resolve(root,'node_modules/.package-lock.json'))),
      packageLockSha256:hash(readFileSync(resolve(root,'package-lock.json'))),
      playwright:require('@playwright/test/package.json').version,
      playwrightCoreSha256:hash(readFileSync(resolve(dirname(require.resolve('playwright-core/package.json')),'lib/coreBundle.js'))),
      uploadImplementation:Object.fromEntries(Object.keys(JSON.parse(readFileSync(resolve(here,'upload-runtime.json'),'utf8')))
        .map(n=>[n,hash(readFileSync(resolve(root,'node_modules',n)))])),
      harness:Object.fromEntries(['harness.mjs','owned-profile.mjs','checkpoint-observer.mjs','vite.config.mjs']
        .map(n=>[n,hash(readFileSync(resolve(root,'scripts/local-render',n)))]))}
  }
  const runtimeBefore=runtime()
  assert.deepEqual(runtimeBefore.uploadImplementation,JSON.parse(readFileSync(resolve(here,'upload-runtime.json'),'utf8')))
  const {showAllMissions,bindGame,waitForShamanReadiness}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  const {checkpointObservation}=await import(pathToFileURL(resolve(root,'scripts/local-render/checkpoint-observer.mjs')).href)
  const construction=JSON.parse(readFileSync(resolve(here,'mission10-construction.json'),'utf8'))
  for(const [path,digest]of Object.entries(construction.hashes))
    assert.equal(hash(readFileSync(resolve(root,path))),path==='scripts/local-render/harness.mjs'
      ?'fb07de9e278f26b2b32324defeb6164832472a58d422aead1032b7db7ee85fcf':digest,path)
  const levelText=readFileSync(resolve(root,'app/level-ten.ts'),'utf8')
  const level=JSON.parse(levelText.slice(levelText.indexOf('export default ')+15).trim().replace(/;$/,''))
  const rules=JSON.parse(readFileSync(resolve(root,'app/original-rules.json'),'utf8'))
  const sourceFacts=missionTenSourceFacts(level,rules,construction)
  const authoredTower=level.objects.find(o=>o.index===112)
  assert.deepEqual([authoredTower.type,authoredTower.model,authoredTower.owner,authoredTower.x,authoredTower.z,authoredTower.angle],[2,4,3,10,-2,0])
  const towerPose={object:rules.buildingObjects[4]+(rules.buildingFlags[4]&0x4000?3:0),angle:0,anchorX:4608,anchorY:64000}
  let latest,capture=false,captureStarted,fwId,shamanId,braveId,hutId,towerId,pin,pinnedAt=Infinity
  let initial,move,pauseMouseHeld=false,detectionHandle,detected,pauseTrace,render,continuation
  let rawRows=0,rawBytes=0,textureBefore,textureAfter,textureCleanup,textureObserverInstalled=false
  const training={sawOccupant:false,sawCost4000:false},observations=[],screenshots=[],failures=[]
  const projectiles=new Map();let observedRestAfterMove=false
  const log=event=>appendFileSync(resolve(output,'actions.jsonl'),JSON.stringify({at:new Date().toISOString(),...event})+'\n')
  const remaining=()=>300000-(Date.now()-Date.parse(receipt.startedAt))
  const events=createEventDeadlines({globalCheck:()=>{signal.throwIfAborted();assert.ok(remaining()>0,'Overall witness bound')},log})
  const check=events.check
  const progress=status=>writeFileSync(resolve(output,'witness.json'),JSON.stringify({status,head,inputs,runtimeBefore,candidate,textureBefore,textureAfter,textureCleanup,warnings:[...receipt.warnings],
    sourceFacts,towerPose,hutId,towerId,fwId,shamanId,braveId,training,move,detected,pauseTrace,render,continuation,
    observations,screenshots,projectiles:[...projectiles.values()],rawRows,rawBytes,eventStage:events.current(),
    failures,latest,limits:{entryMs:60000,trainingMs:110000,routeAndFiringMs:42000,captureResumeMs:20000,
      observerMs:180000,harnessMs:300000,outerMs:330000}},null,2)+'\n')
  const health=(row,allowPaused=false)=>{
    check();assert.deepEqual(receipt.errors,[]);assert.equal(row.level,10);assert.equal(row.status,'playing')
    assert.equal(row.speed,1);assert.equal(row.inputMask,0);assert.equal(row.visibility,'visible')
    assert.equal(row.campaignTimer,null);if(!allowPaused)assert.equal(row.paused,false)
    const shrine=row.shrines.find(h=>h.kind==='linkedEffects'&&h.x===29&&h.z===-67)
    assert.ok(shrine);assert.equal(shrine.uses,0);assert.equal(shrine.remaining,1);assert.equal(shrine.progress,0)
    for(const id of [fwId,shamanId].filter(Boolean)) {
      const u=actor(row,id);assert.ok(u?.hp>0);assert.equal(u.inside,null);assert.equal(u.native?.vehicle??0,0)
    }
    if(pin&&row.now>=pinnedAt)requireIdentityEpoch(row,pin)
    if(towerId)assert.ok(row.buildings.some(b=>b.id===towerId&&b.hp>0),'Bound target survives this short witness')
  }
  const read=async()=>{check();latest=await page.evaluate(()=>window.nativeGuardRead());check();return latest}
  const drain=async(finish=false)=>{
    if(!capture)return []
    const batch=await page.evaluate(drainNativeGuardCapture,{finish})
    for(const row of batch.rows) {
      const line=JSON.stringify(row)+'\n';rawBytes+=Buffer.byteLength(line);rawRows++
      assert.ok(rawBytes<=192*1024*1024&&rawRows<=18000,'Passive evidence storage bound')
      appendFileSync(resolve(output,'rows.jsonl'),line)
      if(braveId&&row.hut?.admission?.occupants.includes(braveId)) {
        training.sawOccupant=true
        if(row.hut.admission.trainingCost===4000)training.sawCost4000=true
      }
      for(const fx of row.effects.filter(e=>e.firewarriorShot)) {
        if(!projectiles.has(fx.id))projectiles.set(fx.id,{...fx,firstTurn:row.turn,firstNow:row.now})
      }
      if(move&&row.now>=move.observedAt&&[17,19].includes(actor(row,fwId)?.native?.state))observedRestAfterMove=true
    }
    observations.push({rows:batch.rows.length,totalRows:batch.totalRows,startedAt:batch.startedAt,endedAt:batch.endedAt,errors:batch.errors})
    if(finish)capture=false
    progress('in-progress')
    assert.deepEqual(batch.errors,[],'Passive observer failed')
    for(const row of batch.rows)if(pin&&row.now>=pinnedAt)requireIdentityEpoch(row,pin)
    return batch.rows
  }
  const pollUI=async(predicate,timeout,label)=>{
    const end=performance.now()+timeout
    while(!await predicate()){check();assert.ok(performance.now()<end,label);await page.waitForTimeout(50)}
  }
  const button=async(name,paused=false)=>{
    health(await read(),paused);await page.getByRole('button',{name,exact:true}).click();health(await read(),paused)
  }
  const clear=async()=>{
    for(let i=0;i<2;i++){const s=await read();if(s.mode===null&&!s.selected.length)return;await page.keyboard.press('Escape')}
    const s=await read();assert.equal(s.mode,null);assert.deepEqual(s.selected,[])
  }
  const requireFiring=row=>{
    health(row,true);const u=actor(row,fwId),p=u.native
    assert.equal(u.kind,'firewarrior');assert.equal(u.team,'blue');assert.equal(p.class,1);assert.equal(p.model,6)
    assert.equal(p.state,10);assert.equal(p.commandStatus,21);assert.equal(u.order?.model,21)
    assert.equal(u.order.flags,0x22);assert.equal(p.substate,11);assert.equal(p.animationMode,44);assert.equal(p.workTarget,towerId)
    assert.equal(u.sourceIdentity,u.nativeIdentity);assert.equal(u.commandOwnerIdentity,u.nativeIdentity)
    assert.equal(p.flags2&0x80000,0);assert.equal(p.flags4&0x400000,0)
    const shots=row.effects.filter(e=>e.firewarriorShot?.source===fwId&&e.firewarriorShot.target===towerId)
    assert.equal(shots.length,2);assert.deepEqual(shots.map(e=>e.firewarriorShot.impact).sort(),[false,true])
    return u
  }
  try {
    assert.equal(await page.evaluate(checkpointObservation),null)
    assert.equal(await page.evaluate(()=>!!document.querySelector('.world-viewport canvas')),false,'Install upload observer before scene creation')
    await page.evaluate(installTextureObserver);textureObserverInstalled=true
    await enterMissionTen({page,showAllMissions,bindGame,waitForShamanReadiness,
      markStage:(name,details)=>log({action:name,...details}),entryRemaining:()=>60000-(Date.now()-Date.parse(receipt.startedAt)),check})
    textureBefore=await page.evaluate(captureUnitTexture)
    requireUnitTexture(textureBefore,receipt.warnings,url)
    textureCleanup=await page.evaluate(()=>window.firewarriorTextureObserver.finish())
    assert.equal(textureCleanup.failure,null);assert.equal(textureCleanup.restored,true)
    await page.evaluate(installNativeGuardObserver)
    const probeText=readFileSync(resolve(here,'browser-probes.mjs'),'utf8').replaceAll("'/app/",`'${url}/app/`)
    await page.evaluate(async source=>{window.nativeGuardProbes=await import(source)},'data:text/javascript;base64,'+Buffer.from(probeText).toString('base64'))
    initial=await read();health(initial);observeInitialBraves(initial.units,sourceFacts)
    assert.equal(initial.units.filter(u=>u.kind==='firewarrior').length,0)
    shamanId=initial.units.find(u=>u.kind==='shaman').id
    hutId=resolveAuthoredHut(initial.buildings,sourceFacts.hut).id
    const towers=initial.buildings.filter(b=>b.model===4&&b.tribe===3&&Object.entries(towerPose).every(([k,v])=>b.pose[k]===v))
    assert.equal(towers.length,1);assert.ok(towers[0].hp>0);assert.equal(towers[0].progress,1);towerId=towers[0].id
    await page.evaluate(setNativeGuardObservedHut,hutId)
    const ordinary=createOrdinaryInput({page,read,log,signal,health,pollUI})
    const dispatch=createOrderDispatch({page,read,log,pollUI,health,ordinary,signal})
    events.begin('prepare-training-input',15000)
    const hutHit=await ordinary.targetEntity('buildings',hutId)
    await clear();await button('Select brave')
    const selected=await read();assert.equal(selected.selected.length,1);braveId=selected.selected[0]
    assert.ok(sourceFacts.originalBraves.some(u=>u.id===braveId));training.sourceBraveId=braveId
    await page.evaluate(setNativeGuardObservedIds,[braveId,shamanId])
    // Continuous capture starts before admission/allocation/emergence, never after firing.
    captureStarted=await page.evaluate(startNativeGuardCapture,{maxMs:180000,requiredIds:[shamanId],allowPaused:true});capture=true
    events.finish();events.begin('ordinary-training',110000)
    training.input=await dispatch.clickOrder(hutHit)
    assert.equal(actor(training.input.after,braveId).work,hutId)
    let signature,lastChanged=performance.now()
    while(!fwId) {
      await page.waitForTimeout(250);await drain();const s=await read();health(s)
      const candidates=s.units.filter(u=>u.hp>0&&u.kind==='firewarrior'&&!initial.units.some(old=>old.id===u.id))
      const exited=candidates.find(u=>u.inside===null&&!u.busy.entry&&u.selectable&&u.mesh?.visible&&u.native?.class===1&&u.native.model===6)
      const trainee=actor(s,braveId),a=s.hut.admission
      const next=JSON.stringify([trainee&&[trainee.hp,trainee.x,trainee.z,trainee.inside,trainee.work,trainee.path],
        a&&[a.inside,a.entering,a.occupants,a.queueHead,a.queueFrom,a.storedMana,a.trainingCost],s.trained,
        [s.tribeMana.available,s.tribeMana.pending,s.tribeMana.mana],candidates.map(u=>[u.id,u.inside,u.hp])])
      if(next!==signature){signature=next;lastChanged=performance.now()}
      if(!trainee||trainee.hp<=0)assert.ok(candidates.length&&s.trained>initial.trained)
      assert.ok(performance.now()-lastChanged<30000,'No ordinary training progress')
      if(exited){
        fwId=exited.id;training.newFirewarriorId=fwId;assert.ok(training.sawOccupant&&training.sawCost4000)
        assert.ok(!trainee||trainee.hp<=0);assert.ok(s.trained>initial.trained)
        pin=pinIdentityEpoch(s,[fwId]);pinnedAt=s.now;training.emerged=s
      }
    }
    events.finish();events.begin('ground-Move-and-automatic-fire',42000)
    await page.evaluate(setNativeGuardObservedIds,[fwId,shamanId])
    await clear();await button('Select firewarrior');assert.deepEqual((await read()).selected,[fwId])
    move=await dispatch.move('firewarrior');move.observedAt=move.after.now
    assert.equal(move.inputAfter.units.find(u=>u.id===fwId).order.model,3)
    assert.equal(move.inputAfter.units.find(u=>u.id===fwId).nativeIdentity,pin.units[0].nativeIdentity)
    const box=await page.getByRole('button',{name:'Pause game',exact:true}).boundingBox();assert.ok(box)
    const point={x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2)}
    await page.evaluate(installPauseInputObserver,{id:fwId,point,targetId:towerId})
    await page.mouse.move(point.x,point.y);pauseMouseHeld=true;await page.mouse.down({button:'left'})
    detectionHandle=await page.waitForFunction(({id,targetId,unitIdentity,nativeIdentity})=>{
      const w=window.testStore.getWorld(),u=w.units.find(u=>u.id===id),p=u?.native
      if(document.visibilityState!=='visible'||w.speed!==1||w.status!=='playing'||w.inputMask||w.campaignTimer!==null||
        !window.nativeGuardCapture?.running||window.nativeGuardCapture.errors.length||!u||u.hp<=0||u.inside!==null||p?.vehicle)
        throw Error('Ordinary firing-wait invariant changed')
      const identities=window.nativeGuardIdentityRegistry.identities
      if(identities.get(u)!==unitIdentity||identities.get(p)!==nativeIdentity)throw Error('Firing owner changed')
      const q=p&&(p.immediateCommand||p.commands[p.commandCursor]),order=w.buildingOrders.records[q]
      const projectiles=w.effects.filter(e=>e.firewarriorShot?.source===id&&e.firewarriorShot.target===targetId)
        .map(e=>({id:e.id,...structuredClone(e.firewarriorShot)}))
      if(w.paused||w.speed!==1||w.status!=='playing'||!u||u.hp<=0||u.inside!==null||p?.vehicle||
        p?.state!==10||p.commandStatus!==21||order?.model!==21||p.substate!==11||p.animationMode!==44||
        p.workTarget!==targetId||projectiles.length!==2)return false
      return {now:performance.now(),turn:w.turn,sourceId:id,state:p.state,substate:p.substate,commandStatus:p.commandStatus,
        animationMode:p.animationMode,workTarget:p.workTarget,object:p.object,draw:p.draw,f1:p.f1,f2:p.f2,
        counter:p.counter,timer:p.timer,order:structuredClone(order),projectiles}
    },{id:fwId,targetId:towerId,unitIdentity:pin.units[0].unitIdentity,nativeIdentity:pin.units[0].nativeIdentity},
      {polling:'raf',timeout:Math.max(1,42000-events.current().elapsedMs)})
    // Release before serializing or draining the detected state. Never retry release.
    pauseMouseHeld=false;await page.mouse.up({button:'left'})
    detected=await detectionHandle.jsonValue();await detectionHandle.dispose();detectionHandle=null
    pauseTrace=await page.evaluate(()=>window.firewarriorPauseInput.finish())
    requirePauseInput(pauseTrace,detected,towerId)
    const paused=await read();assert.equal(paused.paused,true);const u=requireFiring(paused)
    assert.equal(u.native.object,56);assert.equal(u.native.draw,13)
    for(const sample of [detected,...pauseTrace.events.slice(1)]) {
      assert.equal(sample.object,56);assert.equal(sample.draw,13);assert.equal(sample.order.flags,0x22)
    }
    const start=actor(training.emerged,fwId)
    assert.ok(Math.hypot(u.x-start.x,u.z-start.z)>1/256,'Observe actual ordinary movement after emergence')
    await drain();events.finish();events.begin('paused-pixels-and-ordinary-recovery',20000)
    // Await the application's own rendered paused frame; no renderer/game-clock call.
    await page.waitForFunction(now=>window.testSceneRef.current.previous>now,pauseTrace.events[2].now,{polling:'raf',timeout:3000})
    const {captureFiringRender}=await import('./render-observation.mjs')
    render=await page.evaluate(captureFiringRender,fwId)
    textureAfter=await page.evaluate(captureUnitTexture,fwId)
    requireUnitTexture(textureAfter,receipt.warnings,url);requireSameUnitTexture(textureBefore,textureAfter)
    assert.equal(textureAfter.observation.restored,true);assert.equal(textureAfter.observation.active,false)
    assert.deepEqual(render.atlas,{width:2048,height:8128,columns:32,cell:64})
    assert.equal(render.source,56);assert.equal(render.draw,13)
    assert.equal(render.paused,true);assert.equal(render.ownerMatches,true)
    assert.equal(render.meshVisible&&render.objectsVisible&&render.sceneVisible,true);assert.equal(render.canvasOwned,true)
    assert.equal(render.actualFrame,render.expectedFrame);assert.equal(render.draw,u.native.draw)
    assert.ok(render.crop&&render.layers.some(layer=>layer.visible),'Actual visible sprite layers required')
    for(const [i,expected]of render.expectedLayers.entries()) {
      const actual=render.layers[i];assert.ok(actual);assert.equal(actual.visible,expected.visible);assert.equal(actual.piece,expected.piece)
      if(expected.visible){assert.deepEqual(actual.uv,expected.uv);assert.deepEqual(actual.scale,expected.scale)}
    }
    assert.ok(render.layers.slice(render.expectedLayers.length).every(l=>!l.visible))
    const pausedPhase=phase(u.native)
    for(const [name,clip]of [['firing-full',null],['firing-actor',render.crop]]) {
      const path=resolve(output,name+'.png');await page.screenshot({path,...(clip?{clip}:{}),timeout:5000})
      const after=await read();assert.equal(after.paused,true);requireFiring(after)
      assert.equal(after.turn,paused.turn);assert.deepEqual(phase(actor(after,fwId).native),pausedPhase)
      screenshots.push({name,clip,sha256:hash(readFileSync(path)),turn:after.turn,phase:pausedPhase})
    }
    const volleyIds=detected.projectiles.map(p=>p.id)
    await button('Resume game',true)
    let saw40=false,complete=false
    const until=performance.now()+8000
    while(!complete) {
      const rows=await drain();const s=await read();health(s)
      for(const row of [...rows,s]) {
        const p=actor(row,fwId)?.native
        if(p?.commandStatus===21&&p.animationMode===40)saw40=true
        if(row.turn>paused.turn&&p?.animationMode!==44&&p?.animationMode!==40&&
          !row.effects.some(e=>volleyIds.includes(e.id)))complete=true
      }
      assert.ok(performance.now()<until,'Ordinary launch/recovery observation deadline')
      if(!complete)await page.waitForTimeout(50)
    }
    continuation={saw40,complete,volleyIds,observedRestAfterMove,
      last:latest,meaning:'Independent RAF observations; completion/facing fields remain owned by outer live callers'}
    assert.ok(saw40,'A real post-launch phase40 observation is required')
    await drain(true);events.finish()
    requireUnitTexture(await page.evaluate(captureUnitTexture,fwId),receipt.warnings,url)
    assert.deepEqual(runtime(),runtimeBefore);assert.equal(git('status','--porcelain'),'')
    for(const [name,digest]of Object.entries(inputs))assert.equal(hash(readFileSync(resolve(here,name))),digest)
    progress('captured-pending-visual-review')
    return {kind:'ordinary-Mission10-command21-firing-candidate',status:'captured-pending-visual-review',head,
      inputs,runtime:runtimeBefore,candidate,textureBefore,textureAfter,textureCleanup,warnings:[...receipt.warnings],training,move,detected,pauseTrace,render,continuation,screenshots,observations,
      limits:['One naturally acquired on-foot building-target witness.','RAF may miss transient visits; no complete animation clock proof.',
        'Screenshots require visual inspection; mesh visibility alone is not pixel acceptance.',
        'Observed GL calls returned normally; no error-queue consumption or GPU texture readback.',
        'Captured volley is not asserted to be the first; no native scene parity, person-target route or hardware performance claim.']}
  } catch(error) {
    failures.push({error:String(error?.stack??error)});progress('failed');throw error
  } finally {
    let cleanupFailure
    if(pauseMouseHeld){pauseMouseHeld=false;try{await page.mouse.up({button:'left'})}catch(e){cleanupFailure??=e}}
    if(textureObserverInstalled)try {
      textureCleanup=await page.evaluate(()=>{
        const owned=window.firewarriorTextureObserver
        if(!owned)throw Error('Owned texture observer disappeared')
        const result=owned.finish();delete window.firewarriorTextureObserver;return result
      })
      assert.equal(textureCleanup.failure,null);assert.equal(textureCleanup.restored,true)
    }catch(e){cleanupFailure??=e}
    try{await detectionHandle?.dispose()}catch(e){cleanupFailure??=e}
    try{const pending=await page.evaluate(()=>window.firewarriorPauseInput?.finish()??null);if(pending)log({action:'pause-observer-cleanup',pending})}catch(e){cleanupFailure??=e}
    try{await drain(true)}catch(e){cleanupFailure??=e}
    try{await page.evaluate(()=>{if(window.campaignEntityPointer){window.campaignEntityPointer.finish();delete window.campaignEntityPointer}})}catch(e){cleanupFailure??=e}
    if(failures.length)progress('failed')
    if(cleanupFailure){failures.push({cleanup:String(cleanupFailure)});progress('failed');throw cleanupFailure}
  }
}
