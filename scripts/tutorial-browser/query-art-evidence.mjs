import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'

export const queryArtPolicy = Object.freeze({routeMs:180000,operationMs:178000,cleanupMs:2000,maximumContexts:2,maximumScreenshots:8,screenshotBytes:2*1024*1024,imageBytes:16*1024*1024,metadataAndOuterBytes:8*1024*1024,totalArtifactBytes:24*1024*1024})
export const queryArtNames = Object.freeze(['query-normal-scale1.png','query-hover.png','query-held.png','query-keyboard-focus.png','query-normal-scale1-5.png','query-normal-scale2.png','query-failed.png','query-failed-focus.png'])
const offsets=[0,4,1,6,8,7,2,5,3]
const describe=error=>{try{return String(error).slice(0,2000)}catch{return '[unprintable error]'}}
const digest=data=>createHash('sha256').update(data).digest('hex')
const inside=(a,b)=>a.x>=b.x-0.01&&a.y>=b.y-0.01&&a.x+a.width<=b.x+b.width+0.01&&a.y+a.height<=b.y+b.height+0.01
export function acceptQueryArt(row,state,scale) {
  assert.equal(row.count,1);assert.equal(row.label,'Menu');assert.equal(row.title,'Help and game menu')
  assert.equal(row.paused,true);assert.equal(row.scale,scale);assert.equal(row.visible,true);assert.equal(row.unoccluded,true)
  assert.equal(row.width,13);assert.equal(row.height,12);assert.ok(Math.abs(row.rect.width-13*scale)<0.1&&Math.abs(row.rect.height-12*scale)<0.1,'Rendered Query scale mismatch')
  assert.ok(inside(row.rect,row.viewport)&&row.clips.every(c=>inside(row.rect,c)),'Query control clipped')
  const failed=state.startsWith('failed'),focused=state==='focus'||state==='failed-focus'
  assert.equal(row.art,failed?'failed':'source-bound');assert.equal(row.focusVisible,focused)
  if(focused)assert.equal(row.active,true)
  if(failed){assert.equal(row.fallback,'?');assert.equal(row.frames.length,0);if(focused)assert.ok(row.outlineStyle!=='none'&&row.outlineWidth>0,'Fallback focus must remain visible')}
  else {
    assert.equal(row.frames.length,3);assert.ok(row.glyph,'Missing Query glyph');assert.equal(row.glyph.url,'/original/query-control/hfx-105.png')
    assert.equal(row.glyph.complete,true);assert.equal(row.glyph.width,4);assert.equal(row.glyph.height,6)
    assert.equal(row.glyph.left,4);assert.equal(row.glyph.top,3)
    const selected=state==='held'?2:(state==='hover'||state==='focus'?1:0)
    assert.deepEqual(row.frames.map(f=>f.visible),[0,1,2].map(i=>i===selected))
    for(let i=0;i<3;i++) {
      assert.deepEqual(row.frames[i].tiles.map(t=>t.url),offsets.map(n=>`/original/query-control/hfx-${[1005,996,1014][i]+n}.png`))
      assert.ok(row.frames[i].tiles.every(t=>t.complete&&t.repeat==='repeat'),'Exact loaded tiled frame required')
    }
  }
  assert.equal(row.hover,state==='hover'||state==='held');assert.equal(row.held,state==='held')
  return {status:'passed',visualReviewPending:true}
}
// Read-only DOM/world observation; no state, class, focus or renderer injection.
export function readQueryArt() {
  const buttons=[...document.querySelectorAll('button.help-button')],b=buttons[0]
  if(!b)return {count:buttons.length}
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
  const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility==='visible'&&Number(getComputedStyle(e).opacity)>0
  const path=s=>{const match=s.match(/url\(["']?([^"')]+)["']?\)/);return match?new URL(match[1],location.href).pathname:null}
  const art=b.querySelector('[data-query-art]'),style=getComputedStyle(b),r=rect(b),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),clips=[]
  for(let a=b.parentElement;a;a=a.parentElement){const s=getComputedStyle(a);if(['hidden','clip','auto','scroll'].includes(s.overflowX)||['hidden','clip','auto','scroll'].includes(s.overflowY))clips.push(rect(a))}
  const frames=art?[...art.children].filter(e=>e.tagName==='SPAN'&&e.querySelector('i')).map(e=>({visible:visible(e),tiles:[...e.querySelectorAll('i')].map(tile=>{const image=tile.querySelector('img'),s=getComputedStyle(tile);return {url:path(s.backgroundImage),repeat:s.backgroundRepeat,complete:!!image?.complete&&image.naturalWidth>0}})})):[]
  const glyph=art?[...art.children].find(e=>e.tagName==='IMG'):null,gs=glyph?getComputedStyle(glyph):null
  return {count:buttons.length,label:b.getAttribute('aria-label'),title:b.title,paused:window.testStore.getWorld().paused,
    scale:Number(getComputedStyle(document.querySelector('.native-hud')).getPropertyValue('--hud-scale')),visible:visible(b),unoccluded:hit===b||b.contains(hit),rect:r,clips,viewport:{x:0,y:0,width:innerWidth,height:innerHeight},
    width:parseFloat(style.width),height:parseFloat(style.height),active:document.activeElement===b,focusVisible:b.matches(':focus-visible'),hover:b.matches(':hover'),held:b.matches(':active'),outlineStyle:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth),
    art:art?.dataset.queryArt,fallback:art?.dataset.queryArt==='failed'?art.textContent.trim():null,frames,
    glyph:glyph?{url:new URL(glyph.src).pathname,complete:glyph.complete&&glyph.naturalWidth>0,width:glyph.naturalWidth,height:glyph.naturalHeight,left:parseFloat(gs.left),top:parseFloat(gs.top)}:null}
}
export async function tabToQuery(page,step) {
  const visits=[]
  for(let i=0;i<64;i++) {
    await step(()=>page.keyboard.press('Tab'))
    const focus=await step(()=>page.evaluate(()=>({label:document.activeElement?.getAttribute('aria-label')??null,query:document.activeElement?.matches('button.help-button')===true,visible:document.activeElement?.matches(':focus-visible')===true})))
    visits.push(focus);if(focus.query){assert.equal(focus.label,'Menu');assert.equal(focus.visible,true);return visits}
  }
  throw Error('Public Tab did not reach Menu within64 actions')
}
export async function captureHeldQuery(page,step,capture) {
  let attempted=false,failed=false,primary
  try {await step(async()=>{attempted=true;await page.mouse.down()});await capture()}
  catch(error){failed=true;primary=error}
  finally {if(attempted)try{await page.mouse.up()}catch(error){if(!failed){failed=true;primary=error}}}
  if(failed)throw primary
}
export async function runQueryArtCases({browser,url,check,write,receipt,ownContext,releaseContext,icons}) {
  const step=async fn=>{check();const value=await fn();check();return value}
  const wait=async(page,fn,arg)=>{let h;try{h=await step(()=>page.waitForFunction(fn,arg,{timeout:15000}))}finally{if(h)await h.dispose()}check()}
  const observe=page=>step(()=>page.evaluate(readQueryArt))
  const capture=async(page,name,state,scale)=>{
    const before=await observe(page);acceptQueryArt(before,state,scale)
    const bytes=await step(()=>page.screenshot({type:'png',timeout:10000}));assert.ok(bytes.length<=queryArtPolicy.screenshotBytes)
    const after=await observe(page);acceptQueryArt(after,state,scale);assert.deepEqual(after,before,'Query state changed during capture')
    write(name,bytes);receipt.captures.push({name,state,scale,sha256:digest(bytes),bytes:bytes.length,before,after})
  }
  const neutral=async page=>{await step(()=>page.mouse.move(1430,990));await step(()=>page.keyboard.press('Tab'))}
  const menuOpened=async page=>{await step(()=>page.getByRole('button',{name:'Continue Game',exact:true}).waitFor({state:'visible'}));assert.equal(await step(()=>page.getByRole('button',{name:'Continue Game',exact:true}).count()),1)}
  const closeMenu=async page=>{await step(()=>page.keyboard.press('Escape'));await step(()=>page.getByRole('button',{name:'Continue Game',exact:true}).waitFor({state:'hidden'}));await wait(page,()=>window.testStore.getWorld().paused)}
  const scaleTo=async(page,scale)=>{
    await step(()=>page.getByRole('button',{name:'Game settings',exact:true}).click());await menuOpened(page)
    for(const name of ['Options','Browser compatibility and help'])await step(()=>page.getByRole('button',{name,exact:true}).click())
    await step(()=>page.getByLabel('HUD size',{exact:true}).selectOption(String(scale)))
    for(const name of ['Back to Options','Back','Continue Game'])await step(()=>page.getByRole('button',{name,exact:true}).click())
    await wait(page,s=>Number(getComputedStyle(document.querySelector('.native-hud')).getPropertyValue('--hud-scale'))===s,scale)
    await neutral(page)
  }
  for(const failure of [false,true]) {
    const context=await step(async()=>{const c=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});ownContext(c);return c})
    if(failure)await step(()=>context.route('**/original/query-control/hfx-105.png',async route=>{receipt.intentionalFailures++;await route.abort('failed')}))
    const page=await step(()=>context.newPage());page.setDefaultTimeout(15000)
    page.on('pageerror',e=>{if(receipt.errors.length<20)receipt.errors.push(describe(e))})
    page.on('crash',()=>{if(receipt.errors.length<20)receipt.errors.push('Page crashed')})
    page.on('console',message=>{if(message.type()!=='error')return;const location=message.location();if(failure&&location.url.endsWith('/original/query-control/hfx-105.png')){if(receipt.expectedNetworkErrors.length<20)receipt.expectedNetworkErrors.push(message.text().slice(0,1000));return}if(receipt.errors.length<20)receipt.errors.push(message.text().slice(0,2000))})
    await step(()=>page.goto(url,{waitUntil:'domcontentloaded'}))
    if(!failure)for(const icon of Object.values(icons)) {
      const response=await step(()=>page.request.get(new URL(icon.url,url).href,{timeout:10000}))
      try{assert.equal(response.status(),200);const b=await step(()=>response.body());assert.ok(b.length<=4096);assert.equal(digest(b),icon.sha256);receipt.delivery.push({path:icon.url,sha256:digest(b),bytes:b.length})}finally{await response.dispose()}
    }
    await step(()=>showAllMissions(page));await step(()=>page.getByRole('button',{name:'Mission 1',exact:true}).click());await step(()=>bindGame(page))
    let startup;try{startup=await step(()=>page.waitForFunction(()=>{const w=window.testStore.getWorld(),b=document.querySelector('button.skip-introduction');return !w.inputMask?'ready':b&&b.getClientRects().length&&!b.disabled?'skip':false},null,{timeout:15000}));if(await startup.jsonValue()==='skip')await step(()=>page.getByRole('button',{name:/^Skip introduction/}).click())}finally{if(startup)await startup.dispose()}
    await wait(page,()=>!window.testStore.getWorld().inputMask)
    await step(()=>page.getByRole('button',{name:'Pause game',exact:true}).click());await wait(page,()=>window.testStore.getWorld().paused)
    await scaleTo(page,1)
    if(failure) {
      await wait(page,()=>document.querySelector('[data-query-art="failed"]'))
      assert.ok(receipt.intentionalFailures>0);await capture(page,'query-failed.png','failed',1)
      receipt.tabVisits.push(await tabToQuery(page,step));await capture(page,'query-failed-focus.png','failed-focus',1)
      await step(()=>page.keyboard.press('Enter'));await menuOpened(page);await closeMenu(page);receipt.interactions.push('fallback-keyboard-menu')
      await step(()=>page.getByRole('button',{name:'Menu',exact:true}).click());await menuOpened(page);await closeMenu(page);receipt.interactions.push('fallback-pointer-menu')
    } else {
      await wait(page,()=>{const a=document.querySelector('[data-query-art="source-bound"]');return a&&[...a.querySelectorAll('img')].length===28&&[...a.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)})
      await capture(page,'query-normal-scale1.png','normal',1)
      const button=page.getByRole('button',{name:'Menu',exact:true});await step(()=>button.hover());await capture(page,'query-hover.png','hover',1)
      await captureHeldQuery(page,step,()=>capture(page,'query-held.png','held',1))
      check();await menuOpened(page);await closeMenu(page);receipt.interactions.push('held-release-menu')
      await neutral(page);receipt.tabVisits.push(await tabToQuery(page,step));await capture(page,'query-keyboard-focus.png','focus',1)
      await step(()=>page.keyboard.press('Enter'));await menuOpened(page);await closeMenu(page);receipt.interactions.push('keyboard-menu')
      for(const scale of [1.5,2]){await scaleTo(page,scale);await capture(page,`query-normal-scale${String(scale).replace('.','-')}.png`,'normal',scale)}
    }
    await releaseContext(context)
  }
}
export function readQueryArtInputs(root,source) {
  const read=name=>{const b=readFileSync(resolve(root,name));assert.equal(digest(b),source.files[name],`Source binding: ${name}`);return b}
  const provenance=JSON.parse(read('decomp/research/native-help/query-control.json')),icons=provenance.icons
  assert.equal(provenance.originalExecuted,false);assert.equal(Object.keys(icons).length,28)
  assert.deepEqual(Object.keys(icons).map(Number).sort((a,b)=>a-b),[105,...Array.from({length:27},(_,i)=>996+i)])
  for(const [id,icon] of Object.entries(icons)){assert.equal(icon.url,`/original/query-control/hfx-${id}.png`);assert.equal(digest(read('public'+icon.url)),icon.sha256)}
  for(const name of ['app/page.tsx','app/query-control.tsx','app/query-control.module.css','app/globals.css','scripts/browser-game.mjs'])read(name)
  return {icons}
}

export default async function queryArtEvidence({browser,url,output,source,expectedRevision,receipt={},
  root=resolve(import.meta.dirname,'../..'),perform=runQueryArtCases,inputs=readQueryArtInputs,now=()=>performance.now(),writeReceipt=writeFileSync}) {
  const P=queryArtPolicy
  let started,last,deadline,operationDeadline,cleanupDeadline,timer,terminal=false,settled=false,failed=false,primary,imageBytes=0
  const contexts=new Set(),closing=new Set();let contextCount=0
  Object.assign(receipt,{version:1,status:'incomplete',policy:P,expectedRevision,captures:[],interactions:[],delivery:[],errors:[],expectedNetworkErrors:[],intentionalFailures:0,tabVisits:[],artifacts:[],cleanup:[],
    visualReviewPending:true,nativeAbsoluteGeometryParity:false,performanceEligible:false,
    limits:['Production Home through plain Vite, not Vinext/Cloudflare/RSC hosting.','Original Query frame families only; absolute native geometry remains unclaimed.','Time/output/context bounds are not a whole-browser RSS cap or OS descendant cleanup proof.']})
  const clock=()=>{const n=now();assert.ok(Number.isFinite(n)&&Number.isFinite(last)&&n>=last,'Invalid monotonic route clock');last=n;return n}
  const check=()=>{assert.ok(!terminal&&clock()<operationDeadline,'Query operation deadline exceeded')}
  const write=(name,data)=>{
    check();assert.ok(queryArtNames.includes(name));assert.ok(receipt.artifacts.length<P.maximumScreenshots)
    assert.ok(Buffer.isBuffer(data)&&data.length<=P.screenshotBytes&&imageBytes+data.length<=P.imageBytes)
    writeFileSync(resolve(output,name),data,{flag:'wx'});imageBytes+=data.length
    receipt.artifacts.push({name,bytes:data.length,sha256:digest(data)});check()
  }
  const close=async(owner,label)=>{
    if(closing.has(owner))return {confirmed:false,duplicate:true}
    closing.add(owner)
    const wallEnd=cleanupDeadline??Math.min(performance.now()+P.cleanupMs,performance.now()+Math.max(0,deadline-last))
    let remaining=Math.max(0,wallEnd-performance.now()),clockFailed=false
    try{remaining=Math.min(remaining,Math.max(0,deadline-clock()))}catch{clockFailed=true}
    let t
    const result=await Promise.race([Promise.resolve().then(()=>owner.close()).then(()=>({confirmed:true}),error=>({confirmed:false,error:describe(error)})),new Promise(resolve=>{t=setTimeout(()=>resolve({confirmed:false,timedOut:true}),remaining)})])
    clearTimeout(t)
    if(performance.now()>=wallEnd)result.confirmed=false
    try{if(clock()>=deadline)result.confirmed=false}catch{clockFailed=true}
    if(clockFailed){result.confirmed=false;result.clockFailed=true}
    receipt.cleanup.push({label,...result});return result
  }
  try {
    started=now();assert.ok(Number.isFinite(started)&&started>=0);last=started;deadline=started+P.routeMs;operationDeadline=started+P.operationMs
    assert.match(expectedRevision,/^[a-f0-9]{40}$/);assert.equal(source.commit,expectedRevision)
    const bound=inputs(root,source);check();receipt.sourceCommit=source.commit
    const operation=Promise.resolve().then(()=>perform({browser,url,check,write,receipt,...bound,
      ownContext(context){contexts.add(context);assert.ok(!terminal&&++contextCount<=P.maximumContexts,'Context ownership/deadline exceeded')},
      async releaseContext(context){check();const r=await close(context,'context');contexts.delete(context);assert.equal(r.confirmed,true,'Context cleanup unconfirmed');check()}}))
      .then(value=>{settled=true;return {ok:true,value}},error=>{settled=true;return {ok:false,error}})
    const outcome=await Promise.race([operation,new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false,error:Error('Query route timed out')}),Math.max(0,operationDeadline-clock()))})])
    if(!outcome.ok)throw outcome.error
    check();assert.equal(receipt.captures.length,8);assert.equal(receipt.delivery.length,28);assert.deepEqual(receipt.errors,[])
    assert.deepEqual(receipt.captures.map(x=>x.name),queryArtNames);assert.equal(receipt.interactions.length,4);assert.equal(receipt.tabVisits.length,2);receipt.status='passed'
  } catch(error){failed=true;primary=error;receipt.status='failed';receipt.failure=describe(error)}
  finally {
    terminal=true;clearTimeout(timer);cleanupDeadline=performance.now()+P.cleanupMs
    for(const context of contexts)if(!closing.has(context))await close(context,'remaining-context')
    await close(browser,'browser')
    receipt.operationSettled=settled;receipt.cleanupConfirmed=settled&&receipt.cleanup.every(x=>x.confirmed)
    if(!receipt.cleanupConfirmed||receipt.errors.length){receipt.status='failed';if(!failed){failed=true;primary=Error('Query cleanup/runtime failure')}}
    try{receipt.elapsedMs=clock()-started;assert.ok(receipt.elapsedMs<P.routeMs)}catch(error){receipt.status='failed';receipt.finalizationError=describe(error);if(!failed){failed=true;primary=error}}
    try{const data=JSON.stringify(receipt);assert.ok(Buffer.byteLength(data)<=1024*1024);writeReceipt(resolve(output,'query-art-evidence.json'),data,{flag:'wx'});
      if(clock()>=deadline){receipt.receiptPostWriteDeadlineFailed=true;throw Error('Query receipt exceeded whole-route deadline')}}
    catch(error){receipt.receiptWriteFailed=true;receipt.status='failed';if(!failed){failed=true;primary=error}}
  }
  if(failed)throw primary
  return receipt
}
