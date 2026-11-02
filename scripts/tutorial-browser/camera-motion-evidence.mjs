import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { installCameraMotionObserver } from './camera-motion-observer.mjs'
import { acceptCameraMotionCase, cameraMotionCases } from './camera-motion-acceptance.mjs'

export const cameraMotionPolicy = Object.freeze({ routeMs:180000, operationMs:178000,
  cleanupMs:2000, artifactBytes:24*1024*1024, totalArtifactBytes:32*1024*1024, outerArtifactBytes:8*1024*1024, screenshotBytes:2*1024*1024,
  maximumScreenshots:9, maximumContexts:3, maximumFrames:12000, maximumEvents:2048 })

// Overview evidence begins after ordinary public introduction dismissal. The two
// flyby cases must instead observe the untouched natural gate and never dismiss it.
export async function prepareCameraIntroduction({page,naturalFlyby,step,wait,receipt,now=()=>performance.now()}) {
  const start=now(),deadline=start+15000
  let last=start
  const remaining=()=>{const value=now();assert.ok(Number.isFinite(value)&&value>=last&&value<deadline,'Camera preparation deadline exceeded');last=value;return deadline-value}
  const read=()=>page.evaluate(()=>({flyby:!!(window.testScene.world.flyby.flags&1),inputMask:window.testScene.world.inputMask,paused:!!window.testScene.world.paused,turn:window.testScene.world.turn??null,started:!!window.testScene.started,modalSuspended:!!window.testScene.modalSuspended}))
  const preparation={kind:naturalFlyby?'natural-flyby':'overview',stage:'observe-before',skipClicked:false}
  ;(receipt.preparations??=[]).push(preparation)
  preparation.before=await step(read)
  // bindGame proves connected ownership, not that authored startup has begun.
  // Retain the maintained openGame flyby-or-unmasked transition before branching.
  if(!preparation.before.flyby&&preparation.before.inputMask) {
    preparation.stage='await-startup'
    await wait(page,()=>!!(window.testScene.world.flyby.flags&1)||!window.testScene.world.inputMask,undefined,remaining())
    preparation.startup=await step(read)
  }
  const admitted=preparation.startup??preparation.before
  if(naturalFlyby) {
    assert.equal(admitted.flyby&&!!admitted.inputMask,true,'Natural flyby gate missed; no retry')
  } else {
    if(admitted.flyby) {
      preparation.stage='public-skip'
      await step(()=>page.locator('.skip-introduction').click({timeout:remaining()}))
      preparation.skipClicked=true
    }
    preparation.stage='await-ground'
    await wait(page,()=>!(window.testScene.world.flyby.flags&1)&&!window.testScene.world.inputMask,undefined,remaining())
  }
  preparation.stage='observe-after'
  preparation.after=await step(read)
  if(naturalFlyby) assert.equal(preparation.after.flyby&&!!preparation.after.inputMask,true,'Natural flyby gate missed; no retry')
  remaining()
  preparation.stage='complete'
}

export async function runCameraMotionCases({ browser,url,check,write,receipt,ownContext,releaseContext }) {
  const step=async fn=>{check();const value=await fn();check();return value}
  const wait=async(page,fn,arg,timeout=15000)=>{const handle=await step(()=>page.waitForFunction(fn,arg,{timeout}));await handle.dispose();check()}
  const observe=page=>step(()=>page.evaluate(()=>window.__pndCameraMotion.read()))
  const mark=(page,phase)=>step(()=>page.evaluate(phase=>window.__pndCameraMotion.mark(phase),phase))
  const ready=async naturalFlyby=>{
    const context=await step(async()=>{const value=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});ownContext(value);return value})
    const page=await step(()=>context.newPage());page.setDefaultTimeout(15000)
    const error=e=>{if(receipt.errors.length<20)receipt.errors.push(String(e).slice(0,2000))}
    page.on('pageerror',error);page.on('crash',()=>error('Page crashed'))
    page.on('console',m=>{if(m.type()==='error')error(m.text())})
    await step(()=>page.goto(url,{waitUntil:'domcontentloaded'}))
    await step(()=>showAllMissions(page))
    await step(()=>page.getByRole('button',{name:'Mission 1',exact:true}).focus())
    await step(()=>page.keyboard.press('Enter'))
    await step(()=>bindGame(page))
    await prepareCameraIntroduction({page,naturalFlyby,step,wait,receipt})
    await step(()=>page.locator('.world-viewport canvas.battlefield').focus())
    await step(()=>page.mouse.move(720,500))
    return {context,page}
  }
  const finishObserver=async(page,report)=>{
    report.observation=await step(()=>page.evaluate(()=>{
      const owner=window.__pndCameraMotion,result=owner.stop()
      if(window.__pndCameraMotion===owner)delete window.__pndCameraMotion
      return result
    }))
  }
  const startPhase=async(page,phase)=>{
    await step(()=>page.evaluate(phase=>{window.__pndCameraMotion.mark(phase)},phase))
  }
  const collectSettled=async(page,phase)=>{
    await wait(page,()=>{const x=window.__pndCameraMotion.status();if(x.failed)throw Error(x.failure);return x.last&&!x.last.inputMask&&!x.last.overviewStage&&!x.last.flyby})
    await startPhase(page,phase)
    await wait(page,()=>{const x=window.__pndCameraMotion.status();if(x.failed)throw Error(x.failure);return x.count>=x.phaseStart+6})
  }
  const capture=async(page,report)=>{
    for(let i=0;i<3;i++) {
      const before=await observe(page),bytes=await step(()=>page.screenshot({type:'png',timeout:10000})),after=await observe(page)
      assert.ok(bytes.length<=cameraMotionPolicy.screenshotBytes,'Screenshot cap exceeded before materialization')
      const name=`camera-${report.kind}-${i}.png`;write(name,bytes)
      report.captures.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),before,after})
    }
  }
  const episode=async(page,report,body)=>{
    let failed=false,primary
    try {await body()}
    catch(error){failed=true;primary=error;report.failure=String(error).slice(0,2000)}
    try {await finishObserver(page,report)}
    catch(error){report.observerCleanupFailed=true;report.observerCleanupError=String(error).slice(0,2000);if(!failed){failed=true;primary=error}}
    if(!failed)try {report.acceptance=acceptCameraMotionCase(report)}
    catch(error){failed=true;primary=error;report.failure=String(error).slice(0,2000)}
    try {write(`camera-${report.kind}.json`,JSON.stringify(report))}
    catch(error){report.rawWriteFailed=true;report.rawWriteError=String(error).slice(0,2000);if(!failed){failed=true;primary=error}}
    if(report.observation){report.observationSummary={frames:report.observation.frames.length,events:report.observation.events.length,
      failed:report.observation.failed,stopped:report.observation.stopped,restored:report.observation.restored};delete report.observation}
    if(failed)throw primary
  }
  const release=async(context)=>{try {await releaseContext(context)}catch(error){receipt.errors.push('Context release failed: '+String(error).slice(0,2000))}}
  let overviewOwner
  try {
    overviewOwner=await ready(false)
    for(const kind of cameraMotionCases.slice(0,4)) {
      const {page}=overviewOwner,report={kind,captures:[]};receipt.cases.push(report)
      await step(()=>page.evaluate(installCameraMotionObserver))
      await episode(page,report,async()=>{
        await mark(page,'ground')
        if(kind.includes('edge'))await step(()=>page.mouse.move(1,500))
        else await step(()=>page.keyboard.down('ArrowLeft'))
        await step(()=>page.keyboard.press('Enter'))
        await wait(page,()=>!!window.__pndCameraMotion.status().last?.overviewStage)
        if(kind==='overview-key-release')await step(()=>page.keyboard.up('ArrowLeft'))
        if(kind==='overview-edge-away')await step(()=>page.mouse.move(720,500))
        await collectSettled(page,'entered')
        assert.equal((await observe(page)).overview,true)
        await mark(page,'exit-transition')
        await step(()=>page.keyboard.press('Enter'))
        await wait(page,()=>!!window.__pndCameraMotion.status().last?.overviewStage)
        await collectSettled(page,'exited')
        assert.equal((await observe(page)).overview,false)
        if(!kind.endsWith('release')&&!kind.endsWith('away'))await capture(page,report)
      })
      await step(()=>page.keyboard.up('ArrowLeft'));await step(()=>page.mouse.move(720,500))
    }
  } finally {if(overviewOwner)await release(overviewOwner.context)}
  for(const kind of cameraMotionCases.slice(4)) {
    let owner
    const report={kind,captures:[]};receipt.cases.push(report)
    try {
      owner=await ready(true);const {page}=owner
      await step(()=>page.evaluate(installCameraMotionObserver))
      await episode(page,report,async()=>{
        await mark(page,'flyby')
        if(kind==='flyby-edge')await step(()=>page.mouse.move(1,500))
        else await step(()=>page.keyboard.down('ArrowLeft'))
        await collectSettled(page,'released')
        if(kind==='flyby-edge')await capture(page,report)
      })
    } finally {if(owner)await release(owner.context)}
  }
}

export default async function cameraMotionEvidence({browser,url,output,source,expectedRevision,receipt={},
  perform=runCameraMotionCases,now=()=>performance.now()}) {
  const P=cameraMotionPolicy
  let started,deadline,operationDeadline,last,cleanupWallDeadline
  Object.assign(receipt,{version:1,status:'incomplete',expectedRevision,policy:P,
    cases:[],errors:[],artifacts:[],cleanup:[],performanceEligible:false,visualEquivalent:false})
  let terminal=false,settled=false,failed=false,primary,bytes=0,timer
  const contexts=new Set();let contextCount=0
  const clock=()=>{const n=now();if(!Number.isFinite(last)||!Number.isFinite(n)||n<last)throw Error('Invalid monotonic route clock');last=n;return n}
  const check=()=>{if(terminal||clock()>=operationDeadline)throw Error('Camera route operation deadline exceeded')}
  const write=(name,data)=>{
    check();assert.match(name,/^camera-[a-z0-9-]+\.(json|png)$/)
    const b=Buffer.isBuffer(data)?data:Buffer.from(data)
    assert.ok(bytes+b.length<=P.artifactBytes-1024*1024,'Camera artifact group cap exceeded')
    writeFileSync(resolve(output,name),b,{flag:'wx'});bytes+=b.length
    receipt.artifacts.push({name,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});check()
  }
  const close=async(owner,label)=>{
    let remaining=0,clockError
    try {remaining=Math.max(0,Math.min(P.cleanupMs,deadline-clock()))}catch(error){clockError=String(error).slice(0,2000);remaining=Math.max(0,(cleanupWallDeadline??performance.now())-performance.now())}
    let t
    const result=await Promise.race([Promise.resolve().then(()=>owner.close()).then(()=>({confirmed:true}),error=>({confirmed:false,error:String(error).slice(0,2000)})),
      new Promise(resolve=>{t=setTimeout(()=>resolve({confirmed:false,timedOut:true}),remaining)})])
    clearTimeout(t);if(clockError){result.confirmed=false;result.clockError=clockError}
    receipt.cleanup.push({label,...result});return result
  }
  try {
    started=now();assert.ok(Number.isFinite(started)&&started>=0,'Invalid initial camera route clock')
    last=started;deadline=started+P.routeMs;operationDeadline=started+P.operationMs
    assert.match(expectedRevision,/^[a-f0-9]{40}$/)
    assert.equal(source.commit,expectedRevision,'Runner source and built revision must agree')
    receipt.sourceCommit=source.commit
    const operation=Promise.resolve().then(()=>perform({browser,url,check,write,receipt,
      ownContext(context){if(++contextCount>3)throw Error('Camera context cap exceeded');contexts.add(context)},async releaseContext(context){check();contexts.delete(context);const r=await close(context,'context');if(!r.confirmed)throw Error('Context cleanup unconfirmed');check()}}))
      .then(value=>{settled=true;return {ok:true,value}},error=>{settled=true;return {ok:false,error}})
    const outcome=await Promise.race([operation,new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false,error:Error('Camera route timed out')}),Math.max(0,operationDeadline-clock()))})])
    if(!outcome.ok)throw outcome.error;check()
    assert.equal(receipt.cases.length,6);assert.ok(receipt.cases.every(x=>x.acceptance?.status==='passed'))
    assert.deepEqual(receipt.errors,[]);receipt.status='passed'
  } catch(error) {failed=true;primary=error;receipt.status='failed';receipt.failure=String(error).slice(0,2000)}
  finally {
    terminal=true;clearTimeout(timer);cleanupWallDeadline=performance.now()+P.cleanupMs
    for(const context of contexts)await close(context,'remaining-context')
    await close(browser,'browser')
    receipt.operationSettled=settled
    receipt.cleanupConfirmed=settled&&receipt.cleanup.every(x=>x.confirmed)
    if(!receipt.cleanupConfirmed||receipt.errors.length){receipt.status='failed';if(!failed){failed=true;primary=Error('Camera owner cleanup/runtime error')}}
    try {
      receipt.elapsedMs=clock()-started
      if(receipt.elapsedMs>=P.routeMs)throw Error('Camera whole-route deadline exceeded')
    } catch(error){receipt.status='failed';receipt.finalizationError=String(error).slice(0,2000);if(!failed){failed=true;primary=error}}
    try {const data=JSON.stringify(receipt);assert.ok(Buffer.byteLength(data)<=1024*1024);writeFileSync(resolve(output,'camera-motion.json'),data);if(clock()>=deadline)throw Error('Camera final receipt exceeded whole-route deadline')}
    catch(error){receipt.receiptWriteFailed=true;receipt.status='failed';if(!failed){failed=true;primary=error}
      try{
        const fallback=JSON.stringify({version:1,status:'failed',receiptWriteFailed:true,
          expectedRevision:typeof expectedRevision==='string'?expectedRevision.slice(0,40):null,
          failure:String(primary).slice(0,2000),receiptFailure:String(error).slice(0,2000),
          operationSettled:receipt.operationSettled===true,cleanupConfirmed:receipt.cleanupConfirmed===true,
          performanceEligible:false,visualEquivalent:false,detailsOmitted:true})
        assert.ok(Buffer.byteLength(fallback)<=1024*1024)
        writeFileSync(resolve(output,'camera-motion.json'),fallback)
      }catch{} }
  }
  if(failed)throw primary
  return receipt
}
