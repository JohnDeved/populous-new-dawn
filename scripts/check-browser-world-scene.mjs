import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'

async function click(page,name) {
  if(['Back','All missions','Campaign worlds','Tutorial','Load Game'].includes(name)) {
    const controls=page.getByRole('button',{name:'Browser controls',exact:true})
    if(await controls.count() && await controls.getAttribute('aria-expanded')==='false') await controls.click()
  }
  await button(page,name).click()
}

const sceneSelector = 'canvas[data-world-scene="true"]'
const button = (page, name) => page.getByRole('button', {name, exact:true})
const select = (page, mission) => page.getByRole('button', {name:new RegExp(`^Panel Mission ${mission}(, completed)?$`)})
const scene = page => page.locator(sceneSelector)
const ready = page => page.locator(`${sceneSelector}[data-ready="true"]`).waitFor()
const open = async page => {
  await page.getByRole('dialog', {name:'Main menu', exact:true}).waitFor()
  await button(page, 'New Game').click()
  await page.getByRole('dialog', {name:'Start game', exact:true}).waitFor()
}
const save = (output, name, data) => writeFileSync(resolve(output, name), JSON.stringify(data,null,2)+'\n')
const limits = ['Browser lifecycle/renderer observations, not native GPU pixel equivalence', 'Callback CPU durations include submission only, not GPU completion or hardware FPS', 'Completion profile is an explicit fixture, not naturally earned campaign victory']

// Observation only: no scheduling, forced draws, state changes, or production hooks.
// Records draws on detached canvases as well as live ones, so cleanup is testable.
async function observe(page) {
  await page.addInitScript(() => {
    const records = [], seen = new WeakMap()
    window.selectorObservation = {records, callbacks:[], geometry:{}, inspectGeometry:true, probeRibbons:false, ribbonPixels:[]}
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
    return {width:c.width,height:c.height,cssWidth:box.width,cssHeight:box.height,dpr:devicePixelRatio,pointerEvents:getComputedStyle(c).pointerEvents,tabIndex:c.tabIndex}
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

export default async function renderEpisode({page,context,output,receipt}) {
  await observe(page); await open(page); await ready(page)
  await selected(page,24,24)
  await page.setViewportSize({width:800,height:600})
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
    assert.ok(Math.abs(sample.cssWidth/sample.cssHeight-4/3)<.01)
    assert.equal(sample.pointerEvents,'none'); assert.equal(sample.tabIndex,-1)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    // Actual clicks below also test that the scene never captures control input.
    await select(page,2).click(); await selected(page,23,24)
    assert.equal(await button(page,'Start Mission 2').isDisabled(),true)
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
  // Exercise progression independently from selection through the existing persisted profile schema.
  await page.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('populous-new-dawn',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
    try { await new Promise((resolve,reject)=>{const tx=db.transaction('checkpoints','readwrite');tx.objectStore('checkpoints').put({version:1,completed:[1,2]},'profile');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}) } finally { db.close() }
  })
  const initialObservation=await observation(page)
  save(output,'scene-initial-observation.json',initialObservation)
  assert.ok(initialObservation.callbacks.length>5)
  const measured=initialObservation.callbacks.slice(5).sort((a,b)=>a-b)
  const cpuSummary={warmupCallbacksDiscarded:5,samples:measured.length,p95:measured[Math.floor((measured.length-1)*.95)],max:Math.max(...measured),workload:'viewport/selection/DPR transitions, geometry/pixel observers disabled'}
  save(output,'scene-cpu-summary.json',cpuSummary)
  await page.reload({waitUntil:'domcontentloaded'}); await open(page); await ready(page)
  await selected(page,22,22)
  await select(page,1).click(); await selected(page,24,22)
  assert.equal(await button(page,'Replay Mission 1').isEnabled(),true)
  await page.screenshot({path:resolve(output,'scene-replay-anchor.png')})
  assert.deepEqual(receipt.errors,[])
  save(output,'scene-backing.json',samples)
  return {checks:['shared retained scene across rapid selection','moving elapsed state','selected/progression body independence','responsive 4:3 scene and control clicks','DPR2/4 and 4096 backing cap','replay availability'],samples,settled,cpuSummary,callbackCpuMs:initialObservation.callbacks,limits}
}

export async function lifecycleEpisode({page,output,receipt}) {
  await observe(page)
  for(const exit of ['Back','Escape','All missions']) {
    await open(page); await ready(page)
    await select(page,3).click(); await selected(page,22,24)
    if(exit==='Escape') await page.keyboard.press('Escape')
    else await click(page,exit)
    await noSceneWork(page)
    if(exit==='All missions') {
      assert.equal(await page.getByRole('button',{name:/^Mission \d+(, completed)?$/}).count(),23)
      await click(page,'Campaign worlds'); await ready(page); await selected(page,22,24)
      await click(page,'Back'); await noSceneWork(page)
    }
    // Escaped selector has no document-wide arrow handler stealing main-menu input.
    await button(page,'New Game').focus(); await page.keyboard.press('ArrowDown')
    assert.equal(await button(page,'Tutorial').evaluate(b=>b===document.activeElement),true)
  }
  // Separate pending-load episodes: newer selection on the same owner, then unmount.
  for (const replace of [false,true]) {
    let release, arrived
    const arrivedPromise=new Promise(resolve=>{arrived=resolve})
    const releasePromise=new Promise(resolve=>{release=resolve})
    const pattern='**/original/world-selector/globes/mission-2.png'
    await page.route(pattern,async route=>{arrived();await releasePromise;await route.continue().catch(()=>{})})
    let timeout
    try {
      await open(page)
      await Promise.race([arrivedPromise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Delayed texture was not requested')),15000)})])
      clearTimeout(timeout)
      await select(page,3).click()
      const old=await scene(page).elementHandle()
      if (replace) { await click(page,'All missions'); await noSceneWork(page) }
      release(); await page.unroute(pattern)
      if (replace) await click(page,'Campaign worlds')
      await ready(page); await selected(page,22,24)
      assert.equal(await old.evaluate(c=>c.isConnected),!replace)
      if (replace) assert.equal(await old.evaluate(c=>c.dataset.ready),undefined)
      assert.ok((await observation(page)).records.every(r=>r.detachedDraws===0))
    } finally {clearTimeout(timeout);release();await page.unroute(pattern)}
    await click(page,'Back'); await noSceneWork(page)
  }
  const observed=await observation(page);save(output,'scene-lifecycle.json',observed)
  assert.deepEqual(receipt.errors,[])
  return {checks:['Back/Escape/All missions cleanup','23 direct-access controls','remount retains selected mission within selector','main-menu keyboard ownership after dismissal','pending texture uses newest selection','pending texture cancellation and no detached draws'],observed,limits}
}

export async function failureEpisode({page,output,receipt}) {
  await observe(page)
  const pattern='**/original/world-selector/globes/sun.png'
  const invalidPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='
  assert.deepEqual(await page.evaluate(async base64=>{const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();return [image.naturalWidth,image.naturalHeight]},invalidPng),[1,1],'Dimension fixture must decode as an actual 1x1 image')
  const failure=()=>page.getByText('Star-system image unavailable. Mission controls still work.',{exact:true}).waitFor()
  for(const mode of ['network','dimensions']) {
    await page.route(pattern,route=>mode==='network' ? route.abort('failed') : route.fulfill({status:200,contentType:'image/png',body:Buffer.from(invalidPng,'base64')}))
    await open(page); await failure()
    assert.equal(await scene(page).getAttribute('data-ready'),null)
    await select(page,2).click()
    assert.equal(await button(page,'Start Mission 2').isDisabled(),true)
    await select(page,1).click()
    assert.equal(await button(page,'Start Mission 1').isEnabled(),true)
    await page.screenshot({path:resolve(output,`scene-${mode}-fallback.png`)})
    await page.unroute(pattern); await button(page,'Retry scene').click(); await ready(page);await selected(page,24,24)
    await click(page,'Back'); await noSceneWork(page)
  }
  await open(page); await ready(page)
  const supported=await scene(page).evaluate(c=>{
    const extension=c.getContext('webgl2').getExtension('WEBGL_lose_context')
    window.selectorLoseContext=extension
    if(extension) extension.loseContext()
    return Boolean(extension)
  })
  assert.equal(supported,true,'Context loss test requires WEBGL_lose_context; missing extension is blocked coverage')
  await failure()
  await page.screenshot({path:resolve(output,'scene-context-lost.png')})
  await page.evaluate(()=>window.selectorLoseContext.restoreContext())
  await ready(page);await selected(page,24,24)
  await click(page,'Back'); await noSceneWork(page)
  const observed=await observation(page);save(output,'scene-failure-observation.json',observed)
  const expected=receipt.errors.filter(e=>e==='Failed to load resource: net::ERR_FAILED')
  assert.ok(expected.length>0,'Network injection must produce an observed failed resource')
  assert.deepEqual(receipt.errors.filter(e=>e!=='Failed to load resource: net::ERR_FAILED'),[])
  return {checks:['real texture network failure','invalid texture dimensions','enabled/locked controls during fallback','Retry scene recovery','real WEBGL_lose_context loss/restoration','no draws after failed scene dismissal'],observed,expectedResourceErrors:expected,limits}
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
