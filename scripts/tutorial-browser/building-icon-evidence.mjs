import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'

export const buildingIconPolicy = Object.freeze({ routeMs:180000, operationMs:178000, cleanupMs:2000,
  maximumContexts:2, maximumScreenshots:8, screenshotBytes:2*1024*1024,
  imageBytes:16*1024*1024, metadataAndOuterBytes:8*1024*1024, totalArtifactBytes:24*1024*1024 })
export const buildingIconKinds = Object.freeze(['hut','tower','camp','temple','spyHut','firewarriorHut','boatHouse','balloonHut'])
export const buildingIconLabels = Object.freeze(['Hut, 3 wood','Guard Tower, 5 wood','Warrior Training Hut, 8 wood','Temple, 8 wood','Spy Training Hut, 8 wood','Firewarrior Training Hut, 8 wood','Boat House, 5 wood','Balloon Hut, 11 wood'])
const describe = error => { try { return String(error).slice(0,2000) } catch { return '[unprintable error]' } }
const digest = data => createHash('sha256').update(data).digest('hex')
const inside = (a,b) => a.x>=b.x-0.01 && a.y>=b.y-0.01 && a.x+a.width<=b.x+b.width+0.01 && a.y+a.height<=b.y+b.height+0.01
export function acceptBuildingIconPanel(panel, atlas, mission, scale) {
  assert.equal(panel.mission,mission);assert.equal(panel.paused,true);assert.equal(panel.scale,scale)
  assert.equal(panel.cards.length,8);assert.equal(panel.visible,true)
  assert.ok(inside(panel.rect,{x:0,y:0,width:1440,height:1000}),'Whole panel must fit viewport')
  assert.deepEqual(panel.cards.map(x=>x.kind),buildingIconKinds)
  assert.deepEqual(panel.cards.map(x=>x.label),buildingIconLabels)
  for(const card of panel.cards) {
    const icon=atlas.icons[card.kind]
    assert.ok(icon);assert.equal(card.iconCount,1);assert.equal(card.visible,true)
    assert.equal(card.disabled,!panel.available[card.kind]);assert.equal(card.pressed,panel.mode===card.kind)
    assert.equal(card.icon.width,icon.w);assert.equal(card.icon.height,icon.h)
    assert.ok(card.icon.x+icon.x===0);assert.ok(card.icon.y+icon.y===0)
    assert.equal(card.icon.repeat,'no-repeat');assert.equal(card.icon.rendering,'pixelated')
    assert.ok(card.icon.image.endsWith('/original/building-icons.png")'),'Exact separate atlas URL')
    assert.ok(inside(card.rect,panel.rect)&&inside(card.icon.rect,card.rect),'Icon/card clipping')
    assert.ok(card.clips.every(clip=>inside(card.icon.rect,clip)),'Ancestor clips icon')
    assert.equal(card.unoccluded,true,'Card center must belong to the live control')
  }
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++) {
    const a=panel.cards[i].rect,b=panel.cards[j].rect
    assert.ok(a.x+a.width<=b.x+0.01||b.x+b.width<=a.x+0.01||a.y+a.height<=b.y+0.01||b.y+b.height<=a.y+0.01,'Building controls overlap')
  }
  if(mission===1)assert.ok(panel.cards.some(x=>x.disabled),'Natural locked-state coverage absent')
  if(mission===16)assert.ok(panel.cards.every(x=>!x.disabled),'Mission16 natural availability incomplete')
  return {status:'passed',visualReviewPending:true}
}

// Browser reads only: no synthetic unlocks, model writes, manual RAF or camera steps.
export function readBuildingIconPanel(kinds) {
  const world=window.testStore.getWorld(),panel=document.querySelector('.native-hud'),cards=[...document.querySelectorAll('.building-list .building-card')]
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
  const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility==='visible'&&Number(getComputedStyle(e).opacity)>0
  return {mission:world.outcome.level,paused:world.paused,mode:world.mode,scale:Number(getComputedStyle(panel).getPropertyValue('--hud-scale')),
    rect:rect(panel),visible:visible(panel),activeIndex:cards.indexOf(document.activeElement),
    available:Object.fromEntries(kinds.map(k=>[k,k==='hut'||world['unlocked'+k[0].toUpperCase()+k.slice(1)]===true])),
    cards:cards.map((card,index)=>{const icons=card.querySelectorAll('i'),icon=icons[0],s=getComputedStyle(icon),r=rect(card),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)
      const clips=[];for(let a=icon.parentElement;a;a=a.parentElement){const style=getComputedStyle(a);if(['hidden','clip','auto','scroll'].includes(style.overflowX)||['hidden','clip','auto','scroll'].includes(style.overflowY))clips.push(rect(a))}
      return {kind:kinds[index],clips,label:card.getAttribute('aria-label'),disabled:card.disabled,pressed:card.getAttribute('aria-pressed')==='true',visible:visible(card),rect:r,unoccluded:hit===card||card.contains(hit),iconCount:icons.length,
        icon:{width:parseFloat(s.width),height:parseFloat(s.height),x:parseFloat(s.backgroundPositionX),y:parseFloat(s.backgroundPositionY),image:s.backgroundImage,repeat:s.backgroundRepeat,rendering:s.imageRendering,rect:rect(icon)}}})}
}

export async function tabToFirstBuilding(page,step) {
  await step(()=>page.getByRole('button',{name:'buildings B',exact:true}).focus())
  const visits=[]
  // The intervening public HUD controls are dynamic. Retain every actual focus;
  // never assume that the command cards immediately follow the category nav.
  for(let index=0;index<64;index++) {
    await step(()=>page.keyboard.press('Tab'))
    const focus=await step(()=>page.evaluate(()=>({
      label:document.activeElement?.getAttribute('aria-label')?.trim()??null,
      tag:document.activeElement?.tagName??null,
      cardIndex:[...document.querySelectorAll('.building-list .building-card')].indexOf(document.activeElement),
    })))
    visits.push(focus)
    if(focus.cardIndex>=0) {
      assert.equal(focus.cardIndex,0,'Public Tab traversal must first reach Hut')
      assert.equal(focus.label,'Hut, 3 wood');return visits
    }
  }
  throw Error('Public Tab traversal did not reach Hut within64 actions')
}

export async function runBuildingIconCases({browser,url,check,write,receipt,ownContext,releaseContext,atlas,atlasSha256,provenanceSha256}) {
  const step=async fn=>{check();const value=await fn();check();return value}
  const wait=async(page,fn,arg)=>{let handle;try{handle=await step(()=>page.waitForFunction(fn,arg,{timeout:15000}))}finally{if(handle)await handle.dispose()}check()}
  const observe=page=>step(()=>page.evaluate(readBuildingIconPanel,buildingIconKinds))
  const capture=async(page,name,mission,scale)=>{
    const before=await observe(page);acceptBuildingIconPanel(before,atlas,mission,scale)
    const bytes=await step(()=>page.screenshot({type:'png',timeout:10000}))
    assert.ok(bytes.length<=buildingIconPolicy.screenshotBytes,'PNG output cap')
    const after=await observe(page);acceptBuildingIconPanel(after,atlas,mission,scale)
    assert.deepEqual(after,before,'Panel changed across capture')
    write(name,bytes);receipt.captures.push({name,bytes:bytes.length,sha256:digest(bytes),before,after})
  }
  for(const mission of [1,16]) {
    const context=await step(async()=>{const c=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});ownContext(c);return c})
    const page=await step(()=>context.newPage());page.setDefaultTimeout(15000)
    page.on('pageerror',e=>{if(receipt.errors.length<20)receipt.errors.push(String(e).slice(0,2000))})
    page.on('crash',()=>{if(receipt.errors.length<20)receipt.errors.push('Page crashed')})
    page.on('console',message=>{if(message.type()==='error'&&receipt.errors.length<20)receipt.errors.push(message.text().slice(0,2000))})
    await step(()=>page.goto(url,{waitUntil:'domcontentloaded'}))
    // Compare actual delivered bytes, not HTTP status or an inferred icon image.
    for(const [path,expected] of [['building-icons.png',atlasSha256],['building-icons-provenance.json',provenanceSha256]]) {
      const response=await step(()=>page.request.get(new URL('/original/'+path,url).href,{timeout:10000}))
      try {assert.equal(response.status(),200);const body=await step(()=>response.body());assert.ok(body.length<=65536);assert.equal(digest(body),expected);receipt.delivery.push({mission,path,sha256:digest(body),bytes:body.length})}
      finally {await response.dispose()}
    }
    await step(()=>showAllMissions(page));await step(()=>page.getByRole('button',{name:`Mission ${mission}`,exact:true}).click());await step(()=>bindGame(page))
    let startup
    try {startup=await step(()=>page.waitForFunction(()=>{const w=window.testStore.getWorld(),b=document.querySelector('button.skip-introduction');return !w.inputMask?'ready':b&&b.getClientRects().length&&!b.disabled?'skip':false},null,{timeout:15000}));if(await startup.jsonValue()==='skip')await step(()=>page.getByRole('button',{name:/^Skip introduction/}).click())}
    finally {if(startup)await startup.dispose()}
    await wait(page,()=>!window.testStore.getWorld().inputMask)
    await step(()=>page.getByRole('button',{name:'Pause game',exact:true}).click());await wait(page,()=>window.testStore.getWorld().paused)
    await step(()=>page.getByRole('button',{name:'buildings B',exact:true}).click())
    await step(()=>page.evaluate(async()=>{const image=new Image();image.src='/original/building-icons.png';await image.decode();if(image.naturalWidth!==300||image.naturalHeight!==47)throw Error('Atlas dimensions') }))
    for(const scale of [1,1.5,2]) {
      await step(()=>page.getByRole('button',{name:'Game settings',exact:true}).click())
      await step(()=>page.getByRole('button',{name:'Options',exact:true}).click())
      await step(()=>page.getByRole('button',{name:'Browser compatibility and help',exact:true}).click())
      await step(()=>page.getByLabel('HUD size',{exact:true}).selectOption(String(scale)))
      await step(()=>page.getByRole('button',{name:'Back to Options',exact:true}).click())
      await step(()=>page.getByRole('button',{name:'Back',exact:true}).click())
      await step(()=>page.getByRole('button',{name:'Continue Game',exact:true}).click())
      await wait(page,s=>Number(getComputedStyle(document.querySelector('.native-hud')).getPropertyValue('--hud-scale'))===s,scale)
      await capture(page,`building-icon-m${mission}-scale${String(scale).replace('.','-')}.png`,mission,scale)
    }
    if(mission===16) {
      receipt.tabEntry=await tabToFirstBuilding(page,step)
      const first=await observe(page);assert.equal(first.activeIndex,0)
      await step(()=>page.keyboard.press('Enter'));const selected=await observe(page);assert.equal(selected.mode,'hut');assert.equal(selected.cards[0].pressed,true)
      receipt.interactions.push({action:'keyboard-select-hut',before:first,after:selected})
      await capture(page,'building-icon-selected-hut.png',16,2)
      for(let index=1;index<8;index++){const before=await observe(page);await step(()=>page.keyboard.press('Tab'));const after=await observe(page);assert.equal(after.activeIndex,index);assert.equal(after.mode,'hut');receipt.interactions.push({action:'tab',before,after})}
      await capture(page,'building-icon-keyboard-focus-balloon.png',16,2)
      await step(()=>page.keyboard.press('Enter'));assert.equal((await observe(page)).mode,'balloonHut')
      await step(()=>page.getByRole('button',{name:'spells',exact:true}).click())
      await step(()=>page.getByRole('button',{name:'buildings B',exact:true}).click())
      const returned=await observe(page);assert.equal(returned.mode,null);acceptBuildingIconPanel(returned,atlas,16,2);receipt.tabReturn=returned
    }
    await releaseContext(context)
  }
}

export function readBuildingIconInputs(root,source) {
  const read=name=>{const b=readFileSync(resolve(root,name));assert.equal(digest(b),source.files[name],`Source binding: ${name}`);return b}
  const atlas=JSON.parse(read('app/original-building-icons.json'))
  const png=read('public/original/building-icons.png'),provenance=read('public/original/building-icons-provenance.json')
  assert.equal(digest(png),'41ac76c013b3926a5f186eadac7822c486f994132faf0bc9af10a96d6c53fd98')
  assert.equal(JSON.parse(provenance).pngSha256,digest(png))
  assert.deepEqual(Object.keys(atlas.icons),buildingIconKinds)
  assert.deepEqual(buildingIconKinds.map(k=>atlas.icons[k].id),[1028,1029,1030,1032,1033,1031,1034,1035])
  for(const name of ['app/page.tsx','app/building-icon.tsx','app/world-state.ts','app/world-rules.ts','app/mission-data.ts','app/level-sixteen.ts','scripts/browser-game.mjs'])read(name)
  return {atlas,atlasSha256:digest(png),provenanceSha256:digest(provenance)}
}

export default async function buildingIconEvidence({browser,url,output,source,expectedRevision,receipt={},
  root=resolve(import.meta.dirname,'../..'),perform=runBuildingIconCases,inputs=readBuildingIconInputs,now=()=>performance.now(),writeReceipt=writeFileSync}) {
  const P=buildingIconPolicy
  let started,last,deadline,operationDeadline,cleanupDeadline,timer,terminal=false,settled=false,failed=false,primary,imageBytes=0
  const contexts=new Set(),closing=new Set();let contextCount=0
  Object.assign(receipt,{version:1,status:'incomplete',policy:P,expectedRevision,captures:[],interactions:[],delivery:[],errors:[],artifacts:[],cleanup:[],
    visualReviewPending:true,nativeFrameParity:false,performanceEligible:false,
    limits:['Production Home through plain Vite, not Vinext/Cloudflare/RSC hosting.','Normal icon identity only; native positioning and selected/disabled frame families remain separate.','Time/output/context bounds are not a whole-browser RSS cap or OS descendant cleanup proof.']})
  const clock=()=>{const n=now();assert.ok(Number.isFinite(n)&&Number.isFinite(last)&&n>=last,'Invalid monotonic route clock');last=n;return n}
  const check=()=>{assert.ok(!terminal&&clock()<operationDeadline,'Icon operation deadline exceeded')}
  const write=(name,data)=>{
    check();assert.match(name,/^building-icon-[a-z0-9-]+\.png$/);assert.ok(receipt.artifacts.length<P.maximumScreenshots)
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
    const outcome=await Promise.race([operation,new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false,error:Error('Icon route timed out')}),Math.max(0,operationDeadline-clock()))})])
    if(!outcome.ok)throw outcome.error
    check();assert.equal(receipt.captures.length,8);assert.equal(receipt.delivery.length,4);assert.deepEqual(receipt.errors,[])
    assert.equal(receipt.interactions.length,8);assert.equal(receipt.tabReturn?.mode,null);receipt.status='passed'
  } catch(error){failed=true;primary=error;receipt.status='failed';receipt.failure=describe(error)}
  finally {
    terminal=true;clearTimeout(timer);cleanupDeadline=performance.now()+P.cleanupMs
    for(const context of contexts)if(!closing.has(context))await close(context,'remaining-context')
    await close(browser,'browser')
    receipt.operationSettled=settled;receipt.cleanupConfirmed=settled&&receipt.cleanup.every(x=>x.confirmed)
    if(!receipt.cleanupConfirmed||receipt.errors.length){receipt.status='failed';if(!failed){failed=true;primary=Error('Icon cleanup/runtime failure')}}
    try{receipt.elapsedMs=clock()-started;assert.ok(receipt.elapsedMs<P.routeMs)}catch(error){receipt.status='failed';receipt.finalizationError=describe(error);if(!failed){failed=true;primary=error}}
    try{const data=JSON.stringify(receipt);assert.ok(Buffer.byteLength(data)<=1024*1024);writeReceipt(resolve(output,'building-icon-evidence.json'),data,{flag:'wx'});
      if(clock()>=deadline){receipt.receiptPostWriteDeadlineFailed=true;throw Error('Icon receipt exceeded whole-route deadline')}}
    catch(error){receipt.receiptWriteFailed=true;receipt.status='failed';if(!failed){failed=true;primary=error}}
  }
  if(failed)throw primary
  return receipt
}
