import { openCampaignFromMainMenu, waitForStartupMenu } from './browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'

const sceneSelector = 'canvas[data-world-scene="true"]'
const button = (page, name) => page.getByRole('button', {name, exact:true})
const select = (page, mission) => page.getByRole('button', {name:new RegExp(`^Panel Mission ${mission}(, completed)?$`)})
const scene = page => page.locator(sceneSelector)
const ready = page => page.locator(`${sceneSelector}[data-ready="true"]`).waitFor()
const open = async page => {
  await openCampaignFromMainMenu(page)
  await page.getByRole('dialog', {name:'Start game', exact:true}).waitFor()
}
const save = (output, name, data) => writeFileSync(resolve(output, name), JSON.stringify(data,null,2)+'\n')
const limits = ['Browser lifecycle/renderer observations, not native GPU pixel equivalence', 'Callback CPU durations include submission only, not GPU completion or hardware FPS', 'Completion profile is an explicit fixture, not naturally earned campaign victory']

// Observation only: no scheduling, forced draws, state changes, or production hooks.
// Records draws on detached canvases as well as live ones, so cleanup is testable.
async function observe(page) {
  await page.addInitScript(() => {
    const records = [], seen = new WeakMap()
    window.selectorObservation = {records, callbacks:[], geometry:{}, inspectGeometry:true, probeRibbons:false, ribbonPixels:[], imageLoads:[]}
    const NativeImage=window.Image
    window.Image=new Proxy(NativeImage,{construct(target,args,newTarget){
      const image=Reflect.construct(target,args,newTarget)
      for(const type of ['load','error']) image.addEventListener(type,()=>{
        if(!image.src.includes('/original/world-selector/globes/')) return
        const loads=window.selectorObservation.imageLoads
        loads.push({type,url:new URL(image.src).pathname,width:image.naturalWidth,height:image.naturalHeight})
        if(loads.length>64) loads.shift()
      },{once:true})
      return image
    }})
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(...args) {
      const gl = getContext.apply(this,args)
      if (gl && args[0] === 'webgl2' && this.matches('[data-world-scene]') && !seen.has(gl)) {
        const record = {canvas:this, draws:0, detachedDraws:0}
        records.push(record); seen.set(gl,record)
        let texture, stream
        const textures=new WeakMap(), bind=gl.bindTexture.bind(gl), upload=gl.texImage2D.bind(gl), buffer=gl.bufferSubData.bind(gl)
        gl.bindTexture=(target,value)=>{texture=value;return bind(target,value)}
        gl.texImage2D=(...values)=>{
          const image=values.at(-1)
          if(texture && image instanceof HTMLImageElement) textures.set(texture,image.src)
          return upload(...values)
        }
        // Retain only the current submission view; consume synchronously before reuse.
        gl.bufferSubData=(...values)=>{stream=values[2];return buffer(...values)}
        const draw = gl.drawArrays.bind(gl)
        gl.drawArrays = (...values) => {
          record.draws++
          if (!this.isConnected) record.detachedDraws++
          const obs=window.selectorObservation, name=textures.get(texture)||'', count=values[2]
          if (obs.inspectGeometry && stream && /mission-[12]\.png$/.test(name)) {
            let extent=0
            for(let i=0;i<count;i++) extent=Math.max(extent,Math.hypot(stream[i*11]-stream[0],stream[i*11+1]-stream[1]))
            obs.geometry[name.split('/').at(-1)]={x:stream[0],y:stream[1],extent,elapsed:Number(this.dataset.elapsed||0),count}
          }
          const probes=[]
          if (obs.probeRibbons && stream && name.endsWith('/ring.png')) {
            // Bounded, one-frame readback proves that ribbon submissions alter visible
            // framebuffer pixels. Separate from CPU sampling; no source pixel oracle.
            for(let i=0;i+2<count && probes.length<12;i+=Math.max(3,Math.floor(count/36)*3)) {
              const x=(stream[i*11]+stream[(i+1)*11]+stream[(i+2)*11])/3
              const y=(stream[i*11+1]+stream[(i+1)*11+1]+stream[(i+2)*11+1])/3
              if(x<1||x>=639||y<1||y>=479) continue
              const px=Math.floor(x/640*this.width),py=Math.floor((480-y)/480*this.height),before=new Uint8Array(4)
              gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,before)
              probes.push({x,y,px,py,before:Array.from(before)})
            }
          }
          const result=draw(...values)
          for(const probe of probes) {
            const after=new Uint8Array(4);gl.readPixels(probe.px,probe.py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,after)
            obs.ribbonPixels.push({...probe,after:Array.from(after)})
          }
          return result
        }
      }
      return gl
    }
    const request = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = callback => request(time => {
      const before = records.reduce((sum,r)=>sum+r.draws,0), start = performance.now()
      try { callback(time) } finally {
        // Probe only one naturally scheduled frame, never an unbounded readback loop.
        if(window.selectorObservation.resumeBaseline!==undefined && window.selectorObservation.firstResumeElapsed===null && records.reduce((sum,r)=>sum+r.draws,0)>before)
          window.selectorObservation.firstResumeElapsed=Number(document.querySelector('canvas[data-world-scene]')?.dataset.elapsed)
        const probed=window.selectorObservation.probeRibbons
        if(records.reduce((sum,r)=>sum+r.draws,0)>before) window.selectorObservation.probeRibbons=false
        if (!window.selectorObservation.inspectGeometry && !probed && records.reduce((sum,r)=>sum+r.draws,0) > before)
          window.selectorObservation.callbacks.push(performance.now()-start)
      }
    })
  })
  await page.reload({waitUntil:'domcontentloaded'})
}
async function observation(page) {
  return page.evaluate(()=>({
    records:window.selectorObservation.records.map(r=>({draws:r.draws,detachedDraws:r.detachedDraws,connected:r.canvas.isConnected,ready:r.canvas.dataset.ready})),
    callbacks:window.selectorObservation.callbacks,
    geometry:window.selectorObservation.geometry, ribbonPixels:window.selectorObservation.ribbonPixels,
    imageLoads:window.selectorObservation.imageLoads,
  }))
}
async function noSceneWork(page) {
  assert.equal(await scene(page).count(),0)
  const before=await observation(page)
  await page.waitForTimeout(180)
  const after=await observation(page)
  assert.deepEqual(after.records,before.records,'Unmounted selector must stop GPU submission')
  assert.ok(after.records.every(r=>r.detachedDraws===0),'No stale asynchronous draw after unmount')
}
async function selected(page, body, anchor) {
  await page.waitForFunction(({body,anchor})=>{
    const c=document.querySelector('canvas[data-world-scene][data-ready="true"]')
    return c?.dataset.selectedBody===String(body) && c?.dataset.progressionBody===String(anchor)
  },{body,anchor})
}
async function backing(page) {
  await page.waitForFunction(()=>{
    const c=document.querySelector('canvas[data-world-scene][data-ready="true"]')
    if (!c) return false
    const b=c.getBoundingClientRect(), scale=Math.min(devicePixelRatio||1,4096/Math.max(b.width,b.height))
    return c.width===Math.max(1,Math.round(b.width*scale)) && c.height===Math.max(1,Math.round(b.height*scale))
  })
  return scene(page).evaluate(c=>{
    const box=c.getBoundingClientRect()
    const panel=document.querySelector('[aria-label="Campaign status panel"]').getBoundingClientRect()
    return {width:c.width,height:c.height,cssWidth:box.width,cssHeight:box.height,panel:{x:panel.x,y:panel.y,width:panel.width,height:panel.height},dpr:devicePixelRatio,pointerEvents:getComputedStyle(c).pointerEvents,tabIndex:c.tabIndex}
  })
}

async function settle(page,mission,output) {
  const started=Number(await scene(page).getAttribute('data-elapsed'))
  await page.waitForFunction(({mission,started})=>{
    const p=window.selectorObservation.geometry[`mission-${mission}.png`]
    return p && p.elapsed>=started+12 && Math.abs(p.x-320)<1 && Math.abs(p.y-240)<1
  },{mission,started},{timeout:45000})
  const state=await page.evaluate(mission=>window.selectorObservation.geometry[`mission-${mission}.png`],mission)
  // Native selected radius8, source camera offset(200,66.666...) gives nominal15.1789.
  // Emitted outer ring falls within nominal radius; avoid assuming a full silhouette.
  assert.ok(state.extent>10 && state.extent<15.3,JSON.stringify(state))
  await page.screenshot({path:resolve(output,`scene-mission${mission}-settled.png`)})
  return state
}

// Optional renderer/lifecycle episodes use a declared diagnostic profile, not
// earned progress. Never apply it to a persistent harness profile or overwrite
// unrelated saved data. Canonical failureEpisode continues to use fresh progress.
export function selectorInspectionProfile(completed = false) {
  assert.equal(typeof completed, 'boolean')
  return {version:1, completed:completed ? [1,2] : [], nativeCampaign:{
    version:1, history:'legacy-completed-only',
    flags:Array.from({length:25},(_,i)=>i<3 ? 4+(completed&&i<2 ? 1 : 0) : 0),
  }}
}

export async function installSelectorInspectionProfile(page, completed = false) {
  const profile=selectorInspectionProfile(completed)
  const expected=completed ? selectorInspectionProfile(false) : undefined
  await waitForStartupMenu(page)
  const committed=await page.evaluate(async({profile,expected})=>{
    const canonical=value=>JSON.stringify(value, function(_key,item) {
      return item && typeof item==='object' && !Array.isArray(item)
        ? Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])) : item
    })
    const database=await new Promise((resolve,reject)=>{
      const request=indexedDB.open('populous-new-dawn',1)
      request.onsuccess=()=>resolve(request.result)
      request.onerror=()=>reject(request.error)
    })
    try {
      await new Promise((resolve,reject)=>{
        const transaction=database.transaction('checkpoints','readwrite')
        const store=transaction.objectStore('checkpoints'), request=store.get('profile')
        let failure
        request.onsuccess=()=>{
          if(canonical(request.result)!==canonical(expected)) {
            failure=new Error('Selector fixture refuses unexpected existing campaign profile')
            transaction.abort()
          } else store.put(profile,'profile')
        }
        transaction.oncomplete=resolve
        transaction.onerror=()=>reject(failure??transaction.error)
        transaction.onabort=()=>reject(failure??transaction.error??new Error('Selector fixture aborted'))
      })
      return await new Promise((resolve,reject)=>{
        const transaction=database.transaction('checkpoints','readonly')
        const request=transaction.objectStore('checkpoints').get('profile')
        let value
        request.onsuccess=()=>{value=request.result}
        transaction.oncomplete=()=>canonical(value)===canonical(profile)
          ? resolve(value) : reject(new Error('Selector fixture committed readback differs'))
        transaction.onerror=()=>reject(transaction.error)
        transaction.onabort=()=>reject(transaction.error??new Error('Selector fixture readback aborted'))
      })
    } finally {database.close()}
  },{profile,expected})
  assert.deepEqual(committed,profile)
  await page.reload({waitUntil:'domcontentloaded'})
  return {kind:'explicit-isolated-campaign-profile-fixture',profile:committed,
    naturallyEarned:false,priorProfile:expected??null}
}

export function assertSelectorSceneGeometry(sample, viewport) {
  const scale=Math.min(viewport.width/640,viewport.height/480)
  assert.ok(Number.isFinite(scale)&&scale>0)
  const close=(actual,expected,label)=>{
    assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=.75,
      `${label}: ${actual} != ${expected}`)
  }
  // The canvas fills the width; native art is uniformly scaled inside it.
  // A wide canvas is intentionally NOT constrained to a 4:3 aspect ratio.
  close(sample.cssWidth,viewport.width,'canvas width')
  close(sample.cssHeight,480*scale,'canvas height')
  close(sample.panel.x,(viewport.width-638*scale)/2,'panel x')
  close(sample.panel.y,viewport.height-61*scale,'panel y')
  close(sample.panel.width,638*scale,'panel width')
  close(sample.panel.height,61*scale,'panel height')
}

export default async function renderEpisode({page,context,output,receipt}) {
  assert.equal(receipt.profile,undefined,'Diagnostic selector fixtures require an ephemeral harness profile')
  await observe(page)
  const fixtures=[await installSelectorInspectionProfile(page)]
  save(output,'scene-profile-fixtures.json',fixtures)
  await open(page); await ready(page)
  await selected(page,24,24)
  await page.setViewportSize({width:800,height:600})
  // The inspection fixture unlocks only 1–3. Preserve genuine locked-world
  // rejection using Mission4 instead of expecting an unavailable world to select.
  const locked=select(page,4)
  assert.equal(await locked.isDisabled(),true)
  const hit=await locked.evaluate(node=>{
    const box=node.getBoundingClientRect(), x=box.x+box.width/2, y=box.y+box.height/2
    const target=document.elementFromPoint(x,y)
    return {x,y,width:box.width,height:box.height,viewportWidth:innerWidth,viewportHeight:innerHeight,
      owned:target===node || (target!==null && node.contains(target))}
  })
  assert.ok(['x','y','width','height','viewportWidth','viewportHeight'].every(key=>Number.isFinite(hit[key])))
  assert.ok(hit.width>0&&hit.height>0&&hit.x>=0&&hit.y>=0&&hit.x<hit.viewportWidth&&hit.y<hit.viewportHeight)
  assert.equal(hit.owned,true)
  await page.mouse.click(hit.x,hit.y)
  assert.equal(await locked.getAttribute('aria-pressed'),'false')
  await selected(page,24,24)
  assert.equal(await button(page,'Start Mission 1').isEnabled(),true)
  assert.equal(await page.locator('.world-viewport canvas').count(),0)
  await page.screenshot({path:resolve(output,'scene-mission1-initial.png')})
  const settled=[await settle(page,1,output)]
  await select(page,2).click();await selected(page,23,24)
  await page.screenshot({path:resolve(output,'scene-mission2-moving.png')})
  settled.push(await settle(page,2,output))
  await page.evaluate(()=>{window.selectorObservation.probeRibbons=true})
  await page.waitForFunction(()=>window.selectorObservation.ribbonPixels.some(p=>p.after.slice(0,3).some((v,i)=>v!==p.before[i])),undefined,{timeout:5000})
  const ribbonProof=await page.evaluate(()=>{const o=window.selectorObservation;o.probeRibbons=false;return o.ribbonPixels})
  save(output,'scene-settled-ribbons.json',{settled,ribbonProof})
  await page.screenshot({path:resolve(output,'scene-mission2-visible-ribbons.png')})
  await page.evaluate(()=>{window.selectorObservation.inspectGeometry=false;window.selectorObservation.callbacks=[]})
  await select(page,1).click();await selected(page,24,24)
  const canvas=await scene(page).elementHandle(), samples=[]
  for (const [width,height] of [[640,480],[1920,1080],[3440,1440],[390,844]]) {
    await page.setViewportSize({width,height})
    const sample=await backing(page)
    assertSelectorSceneGeometry(sample,{width,height})
    assert.equal(sample.pointerEvents,'none'); assert.equal(sample.tabIndex,-1)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    // Actual clicks below also test that the scene never captures control input.
    await select(page,2).click(); await selected(page,23,24)
    assert.equal(await button(page,'Start Mission 2').isEnabled(),true)
    await select(page,1).click(); await selected(page,24,24)
    samples.push({viewport:[width,height],...sample})
    await page.screenshot({path:resolve(output,`scene-${width}x${height}.png`)})
  }
  await page.setViewportSize({width:800,height:600})
  const start=Number(await scene(page).getAttribute('data-elapsed'))
  for(const mission of [2,3,1,3]) await select(page,mission).click()
  await selected(page,22,24)
  assert.equal(await canvas.evaluate(c=>c===document.querySelector('canvas[data-world-scene]')),true,'Selection retains one scene/camera owner')
  await page.waitForFunction(start=>Number(document.querySelector('canvas[data-world-scene]').dataset.elapsed)>start+.15,start)
  await page.screenshot({path:resolve(output,'scene-transition.png')})
  const transitionTime=Number(await scene(page).getAttribute('data-elapsed'))
  await page.waitForFunction(time=>Number(document.querySelector('canvas[data-world-scene]').dataset.elapsed)>time+1,transitionTime)
  await page.screenshot({path:resolve(output,'scene-transition-later.png')})
  // The continuous source-derived scene must advance while visible. No static-idle assertion.
  const cdp=await context.newCDPSession(page)
  try {
    for(const [width,height,dpr] of [[1024,768,2],[3840,2160,4],[800,600,1]]) {
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false})
      const sample=await backing(page)
      assert.equal(sample.dpr,dpr); assert.ok(Math.max(sample.width,sample.height)<=4096)
      samples.push({viewport:[width,height],...sample})
    }
  } finally { await cdp.send('Emulation.clearDeviceMetricsOverride'); await cdp.detach() }
  const initialObservation=await observation(page)
  save(output,'scene-initial-observation.json',initialObservation)
  assert.ok(initialObservation.callbacks.length>5)
  const measured=initialObservation.callbacks.slice(5).sort((a,b)=>a-b)
  const cpuSummary={warmupCallbacksDiscarded:5,samples:measured.length,p95:measured[Math.floor((measured.length-1)*.95)],max:Math.max(...measured),workload:'viewport/selection/DPR transitions, geometry/pixel observers disabled'}
  save(output,'scene-cpu-summary.json',cpuSummary)
  await page.keyboard.press('Escape'); await noSceneWork(page)
  fixtures.push(await installSelectorInspectionProfile(page,true))
  save(output,'scene-profile-fixtures.json',fixtures)
  await open(page); await ready(page)
  await selected(page,22,22)
  await select(page,1).click(); await selected(page,24,22)
  assert.equal(await button(page,'Replay Mission 1').isEnabled(),true)
  await page.screenshot({path:resolve(output,'scene-replay-anchor.png')})
  assert.deepEqual(receipt.errors,[])
  save(output,'scene-backing.json',samples)
  return {checks:['shared retained scene across rapid selection','moving elapsed state','selected/progression body independence','full-width scene with uniformly scaled native panel and real selectable control clicks','DPR2/4 and 4096 backing cap','replay availability','real locked Mission4 pointer rejection'],samples,settled,cpuSummary,fixtures,callbackCpuMs:initialObservation.callbacks,limits}
}

export async function lifecycleEpisode({page,output,receipt}) {
  assert.equal(receipt.profile,undefined,'Diagnostic selector fixtures require an ephemeral harness profile')
  await observe(page)
  const fixture=await installSelectorInspectionProfile(page)
  save(output,'scene-profile-fixtures.json',[fixture])
  // Native selector dismissal is Escape. Reentry recomputes its recommendation;
  // selection persistence is asserted only while the same selector remains mounted.
  for(const mission of [3,2]) {
    await open(page); await ready(page); await selected(page,24,24)
    await select(page,mission).click(); await selected(page,25-mission,24)
    await page.keyboard.press('Escape'); await noSceneWork(page)
    await button(page,'New Game').focus(); await page.keyboard.press('ArrowDown')
    assert.equal(await button(page,'Tutorial').evaluate(b=>b===document.activeElement),true)
  }
  // The 23 direct-access controls moved to the public F8 diagnostic overlay.
  // Unlike the removed All-missions view, this overlay retains the selector.
  for(const exit of ['Back','Escape']) {
    await open(page); await ready(page)
    await select(page,3).click(); await selected(page,22,24)
    const original=await scene(page).elementHandle()
    await page.keyboard.press('F8')
    const debug=page.getByRole('dialog',{name:'Debug missions',exact:true})
    await debug.waitFor({state:'visible'})
    assert.equal(await debug.getByRole('button',{name:/^Mission \d+$/}).count(),23)
    assert.equal(await page.locator('.world-viewport canvas').count(),0)
    if(exit==='Back') await debug.getByRole('button',{name:'Back',exact:true}).click()
    else await page.keyboard.press('Escape')
    await debug.waitFor({state:'detached'})
    await selected(page,22,24)
    assert.equal(await original.evaluate(c=>c===document.querySelector('canvas[data-world-scene]')),true)
    assert.equal(await button(page,'Start Mission 3').isEnabled(),true)
    assert.equal(await page.locator('.world-viewport canvas').count(),0)
    await page.keyboard.press('Escape'); await noSceneWork(page)
  }
  // Separate pending-load episodes: newer selection on the same owner, then
  // native dismissal and fresh public reentry. No forced clicks or fake events.
  for (const replace of [false,true]) {
    let release, arrived
    const arrivedPromise=new Promise(resolve=>{arrived=resolve})
    const releasePromise=new Promise(resolve=>{release=resolve})
    const pattern=/\/original\/world-selector\/globes\/mission-2\.png(?:\?[^#]*)?$/
    await page.route(pattern,async route=>{arrived();await releasePromise;await route.continue().catch(()=>{})})
    let timeout
    try {
      await open(page)
      await Promise.race([arrivedPromise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Delayed texture was not requested')),15000)})])
      clearTimeout(timeout)
      await select(page,3).click()
      const old=await scene(page).elementHandle()
      if (replace) { await page.keyboard.press('Escape'); await noSceneWork(page) }
      release(); await page.unroute(pattern)
      if (replace) {
        await open(page); await ready(page); await selected(page,24,24)
        await select(page,3).click()
      }
      await ready(page); await selected(page,22,24)
      assert.equal(await old.evaluate(c=>c.isConnected),!replace)
      if (replace) assert.equal(await old.evaluate(c=>c.dataset.ready),undefined)
      assert.ok((await observation(page)).records.every(r=>r.detachedDraws===0))
    } finally {clearTimeout(timeout);release();await page.unroute(pattern)}
    await page.keyboard.press('Escape'); await noSceneWork(page)
  }
  const observed=await observation(page);save(output,'scene-lifecycle.json',observed)
  assert.deepEqual(receipt.errors,[])
  return {checks:['native Escape cleanup and fresh recommendation on reentry','23 public F8 diagnostic controls with Back/Escape and no gameplay launch','same selector/selection retained across diagnostic overlay','main-menu keyboard ownership after dismissal','pending texture uses newest selection','pending texture cancellation and no detached draws'],fixture,observed,limits}
}

// The shipped native selector rejects locked worlds instead of selecting them
// for a disabled Start button. Exercise real pointer input, not force-click or
// Enter (native Enter starts the currently selected world).
export async function assertNativeLockedMissionRejected(page) {
  const locked=select(page,2), available=select(page,1)
  assert.equal(await locked.count(),1)
  assert.equal(await locked.isDisabled(),true)
  assert.equal(await locked.getAttribute('aria-pressed'),'false')
  assert.equal(await available.getAttribute('aria-pressed'),'true')
  const target=await locked.evaluate(node=>{
    const box=node.getBoundingClientRect(), x=box.x+box.width/2, y=box.y+box.height/2
    const hit=document.elementFromPoint(x,y)
    return {x,y,width:box.width,height:box.height,viewportWidth:innerWidth,viewportHeight:innerHeight,
      hit:hit===node || (hit!==null && node.contains(hit))}
  })
  assert.ok(['x','y','width','height','viewportWidth','viewportHeight'].every(key=>Number.isFinite(target[key])))
  assert.ok(target.width>0 && target.height>0 && target.x>=0 && target.y>=0 &&
    target.x<target.viewportWidth && target.y<target.viewportHeight)
  assert.equal(target.hit,true,'Locked-world pointer probe must hit the actual control')
  await page.mouse.click(target.x,target.y)
  assert.equal(await locked.getAttribute('aria-pressed'),'false')
  assert.equal(await available.getAttribute('aria-pressed'),'true')
  assert.equal(await page.getByRole('dialog',{name:'Start game',exact:true}).isVisible(),true)
  assert.equal(await page.locator('.world-viewport canvas').count(),0)
  assert.equal(await page.getByRole('heading',{name:'Loading failed',exact:true}).count(),0)
  assert.equal(await button(page,'Start Mission 1').isEnabled(),true)
}

export async function failureEpisode({page,output,receipt}) {
  await observe(page)
  await page.setViewportSize({width:800,height:600})
  const textureRequests=[]
  const recordTexture=event=>{
    if(textureRequests.length<128) textureRequests.push(event)
  }
  page.on('response',response=>{
    if(new URL(response.url()).pathname.startsWith('/original/world-selector/globes/'))
      recordTexture({url:new URL(response.url()).pathname,status:response.status()})
  })
  page.on('requestfailed',request=>{
    if(new URL(request.url()).pathname.startsWith('/original/world-selector/globes/'))
      recordTexture({url:new URL(request.url()).pathname,failure:request.failure()?.errorText})
  })
  const pattern=/\/original\/world-selector\/globes\/sun\.png(?:\?[^#]*)?$/
  const invalidPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='
  assert.deepEqual(await page.evaluate(async base64=>{const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();return [image.naturalWidth,image.naturalHeight]},invalidPng),[1,1],'Dimension fixture must decode as an actual 1x1 image')
  const retry=()=>button(page,'Retry scene')
  const recovery=()=>retry().locator('..')
  const failure=async()=>{
    await retry().waitFor({state:'visible'})
    assert.equal(await recovery().getByRole('status').count(),1)
    assert.match(await recovery().getByRole('status').textContent(),/Star-system image unavailable\. Mission controls still work\./)
    assert.equal(await scene(page).getAttribute('data-ready'),null)
    assert.equal(await button(page,'Browser controls').count(),0,'Use the shipped native campaign selector, not the debug compatibility branch')
  }
  const bitmapReady=async()=>{
    await retry().locator('i').first().waitFor({state:'visible'})
    await recovery().getByRole('status').locator('i').first().waitFor({state:'visible'})
  }
  const styles=()=>retry().evaluate(button=>{
    const style=getComputedStyle(button), box=button.getBoundingClientRect()
    const glyph=button.querySelector('i'), notice=button.parentElement.querySelector('[role="status"] i')
    const bounds=[...button.parentElement.querySelectorAll('i')].map(node=>{
      const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}
    })
    return {background:style.backgroundColor,border:style.borderTopWidth,radius:style.borderTopLeftRadius,
      outline:style.outlineWidth,font:glyph&&getComputedStyle(glyph).backgroundImage,
      noticeFont:notice&&getComputedStyle(notice).backgroundImage,height:box.height,bounds,
      viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth}
  })
  const dismiss=async()=>{
    await page.keyboard.press('Escape')
    await noSceneWork(page)
    await button(page,'New Game').focus();await page.keyboard.press('ArrowDown')
    assert.equal(await button(page,'Tutorial').evaluate(b=>b===document.activeElement),true,
      'Dismissal restores main-menu keyboard ownership')
  }
  const noLaunch=async()=>{
    assert.equal(await page.getByRole('dialog',{name:'Start game',exact:true}).isVisible(),true)
    assert.equal(await page.getByRole('heading',{name:'Loading failed',exact:true}).count(),0)
    assert.equal(await scene(page).count(),1,'Recovery input must retain the selector, never launch gameplay')
  }
  const keyboardRetry=async(key,{repeat=false,blocked=false}={})=>{
    const generation=Number(await scene(page).getAttribute('data-generation'))
    await retry().focus()
    if(repeat) {
      await page.keyboard.down(key)
      if(key==='Enter') await page.waitForFunction(previous=>Number(document.querySelector('canvas[data-world-scene]')?.dataset.generation)>previous,generation)
      await page.keyboard.down(key) // Playwright emits a real repeated keydown.
      if(key==='Space') assert.equal(Number(await scene(page).getAttribute('data-generation')),generation,'Space activates on keyup, not keydown or repeat')
      await page.keyboard.up(key)
    } else await page.keyboard.press(key)
    await page.waitForFunction(previous=>Number(document.querySelector('canvas[data-world-scene]')?.dataset.generation)>previous,generation)
    if(blocked) await failure()
    else {
      try { await ready(page) }
      catch(error) {
        // Preserve decisive live state without changing the renderer, extending
        // its deadline, clearing caches, or treating an unsuccessful retry as pass.
        try {
        const state=await page.evaluate(()=>{
          const canvas=document.querySelector('canvas[data-world-scene]')
          const retry=document.querySelector('button[data-selector-recovery]')
          return {hidden:document.hidden,visibilityState:document.visibilityState,
            activeElement:document.activeElement?.outerHTML.slice(0,1000),
            canvas:canvas ? {dataset:{...canvas.dataset},width:canvas.width,height:canvas.height,
              visibility:getComputedStyle(canvas).visibility,rect:canvas.getBoundingClientRect().toJSON()} : null,
            retry:retry?.outerHTML.slice(0,1500),gameplayCanvases:document.querySelectorAll('.world-viewport canvas').length,
            dialogs:[...document.querySelectorAll('dialog[open]')].map(node=>({label:node.getAttribute('aria-label'),text:node.textContent.slice(0,1500)}))}
        })
        save(output,'scene-retry-failure.json',{key,generation,state,textureRequests,observation:await observation(page),error:String(error)})
        await page.screenshot({path:resolve(output,'scene-retry-failure.png')})
        } catch(diagnosticError) { error.diagnosticError=String(diagnosticError) }
        throw error
      }
    }
    await noLaunch()
  }
  const samples=[],observations=[]
  for(const mode of ['network','dimensions']) {
    textureRequests.length=0
    await page.evaluate(()=>{window.selectorObservation.imageLoads.length=0})
    await page.route(pattern,route=>mode==='network' ? route.abort('failed') : route.fulfill({status:200,contentType:'image/png',body:Buffer.from(invalidPng,'base64')}))
    await open(page);await failure();await bitmapReady()
    await assertNativeLockedMissionRejected(page)
    await select(page,1).click()
    assert.equal(await button(page,'Start Mission 1').isEnabled(),true)
    if(mode==='network') {
      for(const [width,height] of [[640,480],[1280,720],[390,844]]) {
        await page.setViewportSize({width,height});await page.mouse.move(0,0)
        await select(page,1).focus()
        const sample=await styles()
        assert.equal(sample.background,'rgba(0, 0, 0, 0)');assert.equal(sample.border,'0px');assert.equal(sample.radius,'0px')
        assert.match(sample.font,/frontend\/felo33we\.png/);assert.match(sample.noticeFont,/frontend\/felo33we\.png/)
        assert.ok(sample.height>=44);assert.ok(sample.scrollWidth<=width)
        assert.ok(sample.bounds.every(b=>b.left>=0&&b.right<=width+.5&&b.top>=0&&b.bottom<=height+.5),'Native glyphs remain within the viewport')
        samples.push(sample)
        await page.screenshot({path:resolve(output,`scene-recovery-${width}x${height}.png`)})
      }
      await page.setViewportSize({width:800,height:600});await retry().hover()
      assert.match((await styles()).font,/frontend\/fehi33we\.png/)
      await page.screenshot({path:resolve(output,'scene-recovery-hover.png')})
      await page.mouse.move(0,0)
      // Genuine Tab navigation makes :focus-visible observable without a fixture.
      await page.keyboard.press('Tab')
      const count=await page.getByRole('dialog',{name:'Start game',exact:true}).getByRole('button').count()
      for(let i=0;i<count+1&&!await retry().evaluate(b=>b===document.activeElement);i++) await page.keyboard.press('Tab')
      assert.equal(await retry().evaluate(b=>b===document.activeElement),true)
      assert.match((await styles()).font,/frontend\/fehi33we\.png/)
      assert.equal((await styles()).outline,'1px')
      await page.screenshot({path:resolve(output,'scene-recovery-focus.png')})
      for(const key of ['Enter','Space']) await keyboardRetry(key,{repeat:true,blocked:true})
    } else await page.screenshot({path:resolve(output,'scene-dimensions-fallback.png')})
    await page.unroute(pattern)
    await keyboardRetry(mode==='network'?'Enter':'Space')
    await selected(page,24,24)
    await dismiss()
    observations.push({episode:mode,...await observation(page)})
  }
  await open(page);await ready(page)
  const renderer=await scene(page).evaluate(c=>{
    const gl=c.getContext('webgl2'), debug=gl.getExtension('WEBGL_debug_renderer_info')
    return debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)
  })
  const supported=await scene(page).evaluate(c=>{
    const extension=c.getContext('webgl2').getExtension('WEBGL_lose_context')
    window.selectorLoseContext=extension
    if(extension) extension.loseContext()
    return Boolean(extension)
  })
  assert.equal(supported,true,'Context loss test requires WEBGL_lose_context; missing extension is blocked coverage')
  await failure();await bitmapReady()
  await page.screenshot({path:resolve(output,'scene-context-lost.png')})
  await page.evaluate(()=>window.selectorLoseContext.restoreContext())
  await ready(page);await selected(page,24,24);await noLaunch()
  await dismiss()
  observations.push({episode:'context-restored',...await observation(page)})
  // Reload so a decoded frontend font cannot conceal the actual failed request.
  for(const font of ['feft33we','fehi33we','felo33we']) {
    const fontPattern=`**/original/frontend/${font}.png`
    let failures=0
    await page.route(fontPattern,route=>{failures++;return route.abort('failed')})
    await page.route(pattern,route=>route.abort('failed'))
    try {
      await page.reload({waitUntil:'domcontentloaded'});await open(page);await failure()
      assert.ok(failures>0,'Font fallback must follow an observed failed request')
      if(font==='felo33we') {
        assert.equal(await retry().locator('i').count(),0,'Normal Retry must not depend on failed gold artwork')
        assert.equal(await retry().innerText(),'Retry scene')
        assert.match(await retry().locator('[aria-hidden="true"]').evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/)
        assert.equal(await recovery().getByRole('status').locator('i').count(),0)
        assert.match(await recovery().getByRole('status').locator('[aria-hidden="true"]').first().evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/)
      } else if(font==='fehi33we') {
        await recovery().getByRole('status').locator('i').first().waitFor({state:'visible'})
        assert.equal(await retry().locator('i').count(),0)
        assert.equal(await retry().innerText(),'Retry scene')
        assert.match(await retry().locator('[aria-hidden="true"]').evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/)
      } else {
        await bitmapReady()
        await page.mouse.move(0,0);await select(page,1).focus()
        assert.match((await styles()).font,/frontend\/felo33we\.png/,
          'Failure of the unused dark menu bank must not hide readable recovery artwork')
      }
      await page.screenshot({path:resolve(output,`scene-recovery-${font}-failed.png`)})
      await dismiss() // Failed scenes also cancel draws/listeners on ordinary Escape.
      await open(page);await failure()
      await page.unroute(pattern);await keyboardRetry('Space');await selected(page,24,24)
      await dismiss()
      observations.push({episode:`font-failure-${font}`,failures,...await observation(page)})
    } finally {await page.unroute(fontPattern);await page.unroute(pattern)}
  }
  save(output,'scene-recovery-styles.json',{renderer,samples})
  save(output,'scene-failure-observation.json',observations)
  const expected=receipt.errors.filter(e=>e==='Failed to load resource: net::ERR_FAILED')
  assert.ok(expected.length>0,'Network injection must produce an observed failed resource')
  assert.deepEqual(receipt.errors.filter(e=>e!=='Failed to load resource: net::ERR_FAILED'),[])
  return {checks:['native campaign UI entry and Escape/main-menu ownership','real texture network failure','invalid texture dimensions','enabled/locked controls during fallback','original gold bitmap normal state and pale hover/focus','gold/highlight font-failure fallbacks and unused dark-bank independence','Enter/Space including held keys retry without mission launch','real WEBGL_lose_context loss/restoration','no draws after ready or failed scene dismissal'],renderer,samples,observations,expectedResourceErrors:expected,limits:['Explicit resource/context failures, not native failure-screen equivalence','Headless renderer observations, not hardware performance','No debug selector or injected campaign progression']}
}


export async function visibilityEpisode({page,context,output,receipt}) {
  await observe(page);await open(page);await ready(page)
  // Verify actual browser visibility; never overwrite document.hidden or dispatch a fake event.
  await page.evaluate(()=>{
    window.selectorVisibility=[]
    document.addEventListener('visibilitychange',()=>{
      const c=document.querySelector('canvas[data-world-scene]')
      window.selectorVisibility.push({hidden:document.hidden,elapsed:Number(c?.dataset.elapsed),draws:window.selectorObservation.records.reduce((n,r)=>n+r.draws,0)})
    })
  })
  const cover=await context.newPage()
  try {
    await cover.goto('about:blank');await cover.bringToFront()
    await page.waitForFunction(()=>document.hidden,undefined,{timeout:5000,polling:100}).catch(()=>{throw Error('BLOCKED visibility coverage: browser did not hide the selector after another page took focus')})
    const before=await observation(page)
    await cover.waitForTimeout(500)
    const after=await observation(page)
    assert.deepEqual(after.records,before.records,'Hidden selector must stop drawing')
    const elapsed=Number(await scene(page).getAttribute('data-elapsed'))
    await page.evaluate(elapsed=>{window.selectorObservation.resumeBaseline=elapsed;window.selectorObservation.firstResumeElapsed=null},elapsed)
    await page.bringToFront();await page.waitForFunction(()=>!document.hidden)
    await page.waitForFunction(()=>window.selectorObservation.firstResumeElapsed!==null)
    const resumed=await page.evaluate(()=>window.selectorObservation.firstResumeElapsed)
    assert.ok(resumed-elapsed<=.02,`First resumed frame must discard hidden 500ms: ${resumed-elapsed}s`)
    const events=await page.evaluate(()=>window.selectorVisibility)
    assert.ok(events.some(e=>e.hidden) && events.some(e=>!e.hidden))
    save(output,'scene-visibility.json',{before,after,elapsed,resumed,events})
    assert.deepEqual(receipt.errors,[])
    return {checks:['real hidden-page draw suspension','resume drops hidden elapsed time'],elapsed,resumed,events,limits}
  } finally {await cover.close()}
}
