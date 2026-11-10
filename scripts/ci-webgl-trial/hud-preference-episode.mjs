// Trial-only port of the exact candidate's maintained HUD adapter.
// No browser/server launch or product edit occurs merely by importing this file.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { APP, URL, LIMITS, Budget, Counts, HeldStartup, admitTarget, guardDocumentResponse, hydrationDiagnostic } from './hud-policy.mjs'

export async function runHudPreferenceEpisode({ browser, sourceRoot, output: outputDir, expectedCommit }) {
assert.equal(expectedCommit, APP, 'Exact reviewed candidate required')
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const composition=readFileSync(resolve(sourceRoot,'public/original/frontend/composition.bin'))
const binding={sourceRoot,composition:{bytes:composition.length,sha256:hash(composition)}}
const {hudScale}=await import(pathToFileURL(resolve(binding.sourceRoot,'app/hud-layout.ts')).href)
const {waitForStartupMenu,openCampaignFromMainMenu}=await import(pathToFileURL(resolve(binding.sourceRoot,'scripts/browser-new-game.mjs')).href)
const out=resolve(outputDir);mkdirSync(out,{recursive:false})
const start=performance.now(), clock=()=>performance.now()-start, work=new Budget(clock,LIMITS.wall-LIMITS.cleanup), counts=new Counts()
const report={status:'running',application:APP,url:URL,limits:LIMITS,cases:[],diagnostics:[],documents:[],images:[],cleanup:[],limitations:['Top-level HTML uses no-follow route.fetch and unchanged response fulfillment; not an untouched browser transport.','Exact candidate built local Worker route; reload creates a new document/Home, not development StrictMode replay proof.','Isolated hud-size storage fixtures; not browser-wide storage outage.','No native Escape/fullscreen/ordinary Options or Full/Tutorial acceptance.','Outer runner owns build/runtime/source identity, browser launch, final stability and process cleanup.']}
let context, fatal, activePending, caseBudget
const recordError=error=>{fatal??=error instanceof Error?error:Error(String(error))}
function output(name,bytes,kind) { counts.record(kind,bytes.length);writeFileSync(resolve(out,name),bytes);return {name,bytes:bytes.length,sha256:hash(bytes)} }
function save() { const bytes=Buffer.from(JSON.stringify({...report,counts,elapsedMs:clock()},null,2)+'\n');assert.ok(bytes.length<=1024**2,'Receipt cap');assert.ok(counts.bytes+bytes.length<=LIMITS.evidenceBytes,'Total evidence cap');writeFileSync(resolve(out,'receipt.json'),bytes) }
async function step(promise,cap=LIMITS.action,budget=caseBudget??work) {
  if(fatal)throw fatal
  const ms=Math.min(work.left(cap),budget.left(cap));let timer
  try { const result=await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Bounded step timeout')),ms)})]);if(fatal)throw fatal;return result }
  finally { clearTimeout(timer) }
}
async function unique(locator) { await step(locator.waitFor({state:'visible',timeout:caseBudget.left(LIMITS.action)}));assert.equal(await locator.count(),1,'Expected unique visible public control');return locator }
async function click(locator) { await step((await unique(locator)).click({timeout:caseBudget.left(LIMITS.action)})) }
async function shot(page,name,cap=LIMITS.action) {
  const metadata=await step(page.evaluate(()=>{
    const canvas=document.querySelector('canvas.battlefield'),gl=canvas?.getContext('webgl2')
    const ext=gl?.getExtension('WEBGL_debug_renderer_info')
    return {viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio,
      renderer:gl?(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)):null,
      canvas:canvas?{width:canvas.width,height:canvas.height}:null}
  }),cap)
  const bytes=await step(page.screenshot({type:'png',fullPage:false,timeout:caseBudget.left(cap)}),cap)
  report.images.push({...output(name,bytes,'image'),metadata});save()
}
async function nav(page,name,reload=false) {
  const response=await step(reload?page.reload({waitUntil:'domcontentloaded',timeout:caseBudget.left(LIMITS.navigation)}):page.goto(URL,{waitUntil:'domcontentloaded',timeout:caseBudget.left(LIMITS.navigation)}),LIMITS.navigation)
  assert.ok(response);admitTarget(response.url(),!!response.request().redirectedFrom());assert.equal(page.url(),URL);assert.equal(response.status(),200)
  const type=response.headers()['content-type']??'';assert.match(type,/text\/html/i)
  const bytes=await step(response.body(),LIMITS.navigation);report.documents.push({...output(name+'.html',bytes,'html'),url:response.url(),status:response.status(),contentType:type});save()
}
async function createCase(name,options={}) {
  counts.context();caseBudget=new Budget(clock,options.javaScriptEnabled===false?LIMITS.server:LIMITS.case,work.end)
  context=await step(browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,serviceWorkers:'block',javaScriptEnabled:options.javaScriptEnabled??true,...(options.seed===undefined?{}:{storageState:{cookies:[],origins:[{origin:new globalThis.URL(URL).origin,localStorage:[{name:'hud-size',value:options.seed}]}]}})}))
  let pageCount=0
  context.on('page',page=>{if(++pageCount>1){recordError(Error('Unexpected popup/page'));void page.close().catch(recordError)}})
  context.on('weberror',error=>recordError(Error(String(error.error()))))
  const pending=options.pending?new HeldStartup(clock):null
  let interceptedResolve, releaseResolve, responseResolve, holdTimer, routeRef, pendingObserved
  const intercepted=new Promise(resolve=>{interceptedResolve=resolve}),released=new Promise(resolve=>{releaseResolve=resolve}),responseSeen=new Promise(resolve=>{responseResolve=resolve})
  async function release(reason) { if(!pending||pending.events.intercept===undefined||!pending.release(reason))return;clearTimeout(holdTimer);try{await routeRef.continue()}finally{releaseResolve()} }
  activePending={release, pending}
  await context.route('**/*',async route=>{
    const request=route.request()
    try {
      if(fatal)throw fatal
      if(request.isNavigationRequest()&&request.frame().parentFrame()===null) {
        counts.navigation(request.url(),!!request.redirectedFrom())
        await step(guardDocumentResponse(route,Math.min(work.left(LIMITS.navigation),caseBudget.left(LIMITS.navigation))),LIMITS.navigation)
        return
      }
      if(pending&&request.url()===new globalThis.URL('/original/frontend/composition.bin',URL).href&&pending.events.intercept===undefined) {
        pending.intercept();routeRef=route;interceptedResolve()
        holdTimer=setTimeout(()=>{recordError(Error('Held composition release deadline'));void release('deadline').catch(recordError)},4000)
        await released;return
      }
      // A second initial composition fetch is rejected; after the one reload, interception is disarmed.
      if(pending&&request.url()===new globalThis.URL('/original/frontend/composition.bin',URL).href&&!pending.disarmed)throw Error('Duplicate composition request')
      await route.continue()
    } catch(error) {recordError(error);await route.abort().catch(()=>{});releaseResolve()}
  })
  if(options.blockRead)await context.addInitScript(()=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='hud-size')throw new Error('Supplied hud-size read failure');return original.call(this,key)}})
  const page=await context.newPage();page.setDefaultTimeout(caseBudget.left(LIMITS.action));page.setDefaultNavigationTimeout(caseBudget.left(LIMITS.navigation))
  for(const type of ['console','pageerror'])page.on(type,value=>{
    const level=type==='console'?value.type():'pageerror';if(!['warning','error','pageerror'].includes(level))return
    const text=type==='console'?value.text():String(value)
    try {counts.diagnostic(text);report.diagnostics.push({case:name,level,text,at:clock()});if(level!=='warning'||hydrationDiagnostic(text))recordError(Error('Runtime/hydration diagnostic: '+text))} catch(error){recordError(error)}
  })
  if(pending)page.on('response',response=>{if(!pending.disarmed&&response.url()===new globalThis.URL('/original/frontend/composition.bin',URL).href){pendingObserved=(async()=>{assert.ok(!response.request().redirectedFrom(),'Composition redirect');assert.equal(response.status(),200);assert.equal(await response.finished(),null,'Composition response failed');const bytes=await response.body();assert.equal(bytes.length,binding.composition.bytes);assert.equal(hash(bytes),binding.composition.sha256,'Original composition bytes changed');pending.complete(response.status());return {status:response.status(),url:response.url(),bytes:bytes.length,sha256:hash(bytes),completedAt:clock()}})();responseResolve();pendingObserved.catch(recordError)}})
  const entry={name,startedAt:clock(),seed:options.seed??null,javaScriptEnabled:options.javaScriptEnabled!==false,blockedHudRead:!!options.blockRead,measurements:[]};report.cases.push(entry);save()
  return {page,entry,pending,release,intercepted,finishPending:async()=>{await step(responseSeen);assert.ok(pendingObserved,'Missing original composition response');entry.compositionResponse=await step(pendingObserved);pending.verify();entry.pendingEvents=pending.events;pending.disarmed=true},close:async()=>{clearTimeout(holdTimer);await step(release('cleanup'),1000,work);await step(context.close(),LIMITS.cleanup,work);report.cleanup.push({context:name,closed:true});context=null;activePending=null;entry.finishedAt=clock();save()}}
}
async function measure(page,preference) {
  const expected=hudScale(page.viewportSize().width,page.viewportSize().height,preference)
  await step(page.waitForFunction(scale=>{
    const shell=document.querySelector('.game-shell'),hud=document.querySelector('.native-hud'),mini=document.querySelector('.minimap-wrap canvas:not(.map-frame)'),frame=document.querySelector('canvas.map-frame')
    if(!shell||!hud||!mini||!frame)return false
    const r=frame.getBoundingClientRect(),h=hud.getBoundingClientRect(),m=mini.getBoundingClientRect(),ctx=frame.getContext('2d')
    if(Math.abs(Number(getComputedStyle(shell).getPropertyValue('--hud-scale'))-scale)>.01||Math.abs(h.width-100*scale)>.2||Math.abs(m.width-100*scale)>.2||Math.abs(m.height-96*scale)>.2||Math.abs(r.width-100*scale)>.2||Math.abs(r.height-96*scale)>.2||frame.width!==Math.round(r.width)||frame.height!==Math.round(r.height)||!ctx)return false
    return ctx.getImageData(0,0,1,1).data[3]>0
  },expected,{timeout:caseBudget.left(LIMITS.action)}))
  return await step(page.evaluate(expected=>({expected,scale:Number(getComputedStyle(document.querySelector('.game-shell')).getPropertyValue('--hud-scale')),hudWidth:document.querySelector('.native-hud').getBoundingClientRect().width,frame:{width:document.querySelector('canvas.map-frame').width,height:document.querySelector('canvas.map-frame').height},viewport:{width:innerWidth,height:innerHeight},stored:localStorage['hud-size']??null}),expected))
}
async function settings(page) {
  await step(waitForStartupMenu(page),LIMITS.navigation)
  await step(openCampaignFromMainMenu(page),LIMITS.navigation)
  await click(page.getByRole('button',{name:'Start Mission 1',exact:true}))
  await step(page.locator('.world-viewport canvas').waitFor({state:'visible',timeout:caseBudget.left(LIMITS.navigation)}),LIMITS.navigation)
  await step(page.locator('.loading-world').waitFor({state:'hidden',timeout:caseBudget.left(LIMITS.navigation)}),LIMITS.navigation)
  const skip=page.getByRole('button',{name:'Skip introduction',exact:false});if(await skip.isVisible())await click(skip)
  await click(page.getByRole('button',{name:'Game settings',exact:true}))
  await click(page.getByRole('button',{name:'Options',exact:true}))
  const options=page.locator('[data-original-options][data-skin="ingame"]');await unique(options)
  if(await options.getAttribute('data-category')!=='Game')await click(page.getByRole('button',{name:'Game',exact:true}))
  await click(page.getByRole('button',{name:'Browser compatibility and help',exact:true}))
  return await unique(page.getByRole('combobox',{name:'HUD size',exact:true}))
}
async function run() {
  report.browserVersion=browser.version();save()
  {
    const c=await createCase('server',{javaScriptEnabled:false})
    try {await nav(c.page,'server');for(const selector of ['main.game-shell','aside.native-hud','.loading-world[data-loading-phase="restore"]'])assert.equal(await c.page.locator(selector).count(),1);c.entry.serverDom={shell:true,hud:true,restore:true,effectsNotClaimed:true};c.entry.status='passed'}finally{await c.close()}
  }
  for(const spec of [{name:'default'},{name:'manual',seed:'1.5',pending:true},{name:'invalid',seed:'invalid'},{name:'blocked',seed:'2.5',blockRead:true}]) {
    const c=await createCase(spec.name,spec)
    try {
      let pendingProof
      if(c.pending) {
        pendingProof=(async()=>{
          await step(c.intercepted,LIMITS.navigation)
          const remaining=()=>Math.max(1,3000-(clock()-c.pending.events.intercept))
          await step(c.page.waitForFunction(()=>{const root=document.querySelector('.game-shell'),hud=document.querySelector('.native-hud');return !!document.querySelector('.loading-world[data-loading-phase="restore"]')&&root&&hud&&Math.abs(Number(getComputedStyle(root).getPropertyValue('--hud-scale'))-1.5)<.01&&Math.abs(hud.getBoundingClientRect().width-150)<.2},null,{timeout:remaining()}),remaining())
          await shot(c.page,'manual-pending.png',remaining());c.pending.observation();await c.release('observed')
        })();pendingProof.catch(recordError)
      }
      await Promise.all([nav(c.page,spec.name),pendingProof]);if(c.pending)await c.finishPending()
      let select=await settings(c.page),preference=spec.name==='manual'?'1.5':'auto'
      assert.equal(await select.inputValue(),preference);c.entry.measurements.push(await measure(c.page,preference));await shot(c.page,spec.name+'-settled.png')
      if(spec.name==='manual') {
        const frame=await c.page.locator('canvas.map-frame').elementHandle();assert.ok(frame)
        try {
          await step(select.selectOption('4',{timeout:caseBudget.left(LIMITS.action)}));assert.equal(await select.inputValue(),'4')
          await step(c.page.waitForFunction(old=>!old.isConnected&&document.querySelector('canvas.map-frame')!==old,frame,{timeout:caseBudget.left(LIMITS.action)}))
          c.entry.measurements.push(await measure(c.page,'4'));await step(c.page.setViewportSize({width:1280,height:720}));c.entry.measurements.push(await measure(c.page,'4'));await shot(c.page,'manual-clamped-remount.png')
        } finally {await frame.dispose()}
        await step(select.selectOption('1.5',{timeout:caseBudget.left(LIMITS.action)}));assert.equal(await c.page.evaluate(()=>localStorage.getItem('hud-size')),'1.5')
        await nav(c.page,'manual-reload',true);select=await settings(c.page);assert.equal(await select.inputValue(),'1.5');c.entry.measurements.push(await measure(c.page,'1.5'));await shot(c.page,'manual-reloaded.png')
      }
      if(spec.name==='invalid')assert.equal(await c.page.evaluate(()=>localStorage.getItem('hud-size')),'invalid')
      if(spec.name==='blocked') {
        await step(c.page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='hud-size')throw new Error('Supplied hud-size write failure');return original.call(this,key,value)}}))
        await step(select.selectOption('1.5',{timeout:caseBudget.left(LIMITS.action)}));assert.equal(await select.inputValue(),'1.5');c.entry.measurements.push(await measure(c.page,'1.5'));assert.equal(await c.page.evaluate(()=>localStorage['hud-size']),'2.5');await shot(c.page,'blocked-write-session.png')
      }
      c.entry.status='passed'
    } finally {await c.close()}
  }
  if(fatal)throw fatal;assert.equal(counts.contexts,5);assert.equal(counts.navigations,6);assert.equal(counts.html,6);report.status='passed-awaiting-pixel-review'
}
try {await run()}catch(error){report.status='failed';report.failure=String(error)}
finally {
  const end=start+LIMITS.wall
  async function cleanup(action,label) {let timer;try{await Promise.race([action(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cleanup deadline')),Math.max(1,Math.min(LIMITS.cleanup,end-performance.now())))})]);report.cleanup.push({owner:label,closed:true})}catch(error){report.cleanup.push({owner:label,error:String(error)});report.status='failed'}finally{clearTimeout(timer)}}
  if(activePending)await cleanup(()=>activePending.release('cleanup'),'held-request')
  if(context)await cleanup(()=>context.close(),'remaining-context')

  save()
}

assert.equal(report.status, 'passed-awaiting-pixel-review', 'HUD episode did not pass; inspect retained receipt')
return report
}
