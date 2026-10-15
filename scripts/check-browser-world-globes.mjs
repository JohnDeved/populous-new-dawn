import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'

export default async function({page,context,output,receipt}) {
 const button=name=>page.getByRole('button',{name,exact:true})
 await button('New Game').click()
 const globe=mission=>page.locator(`canvas[data-world-globe="${mission}"][data-ready="true"]`)
 await globe(1).waitFor()
 const samples=[]
 for(const [width,height] of [[640,480],[1920,1080],[3440,1440],[3840,2160],[390,844]]){
  await page.setViewportSize({width,height})
  await page.waitForFunction(()=>{const c=document.querySelector('canvas[data-world-globe]');return c.width===Math.min(2048,Math.round(c.getBoundingClientRect().width*devicePixelRatio))})
  const data=await globe(1).evaluate(c=>{
   const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data
   let covered=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])covered++
   return {width:c.width,css:c.getBoundingClientRect().width,covered, pointerEvents:getComputedStyle(c).pointerEvents,tabIndex:c.tabIndex}
  })
  assert.ok(data.covered>data.width*data.width*.65&&data.covered<data.width*data.width*.8)
  assert.equal(data.pointerEvents,'none');assert.equal(data.tabIndex,-1)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  samples.push({viewport:[width,height],...data})
  if(width!==3840)await page.screenshot({path:resolve(output,`globe-${width}x${height}.png`)})
 }
 await page.setViewportSize({width:1024,height:768})
 const cdp=await context.newCDPSession(page)
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:2,mobile:false})
 await page.waitForFunction(()=>{const c=document.querySelector('canvas[data-world-globe]');return devicePixelRatio===2&&c.width===Math.round(c.getBoundingClientRect().width*2)})
 samples.push(await globe(1).evaluate(c=>({dpr:devicePixelRatio,width:c.width,css:c.getBoundingClientRect().width})))
 const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})
 writeFileSync(resolve(output,'globe-dpr2.png'),Buffer.from(shot.data,'base64'))
 // Instrument actual frame callbacks during high-DPI raster work, without adding
 // production timing hooks. This is local callback latency, not hardware FPS.
 await page.evaluate(()=>{
  window.globeBatchMs=[]
  const request=window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame=callback=>request(time=>{
   const start=performance.now();callback(time);window.globeBatchMs.push(performance.now()-start)
  })
 })
 const oldWidth=await globe(1).evaluate(c=>c.width)
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:2,mobile:false})
 assert.equal(await globe(1).evaluate(c=>c.width),oldWidth,'retain prior complete backing during resize')
 // Supersede an in-progress large raster, then return to the 4K target.
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:2560,height:1440,deviceScaleFactor:2,mobile:false})
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:2,mobile:false})
 await page.waitForFunction(()=>{const c=document.querySelector('canvas[data-world-globe]');return c.width===Math.round(c.getBoundingClientRect().width*2)})
 const batchMs=await page.evaluate(()=>window.globeBatchMs)
 assert.ok(batchMs.length>5)
 assert.ok(Math.max(...batchMs)<50,`Main-thread frame callback exceeded long-task threshold: ${Math.max(...batchMs)}ms`)
 samples.push({viewport:[3840,2160],dpr:2,batchMs,maxBatchMs:Math.max(...batchMs)})
 // Replace mission work while a large texture is still being rasterized.
 for(const mission of [2,3,1])await button(`Select Mission ${mission}`).click()
 await globe(1).waitFor()
 await page.waitForFunction(()=>document.querySelector('canvas[data-world-globe="1"]').width===1382)
 assert.equal(await page.locator('canvas[data-world-globe]').count(),1)
 await page.evaluate(()=>{window.globeBatchMs=[];window.globeRasterStart=performance.now()})
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:3840,height:2160,deviceScaleFactor:4,mobile:false})
 await page.waitForFunction(()=>document.querySelector('canvas[data-world-globe="1"]').width===2048)
 const cap=await page.evaluate(()=>({backing:2048,batchMs:window.globeBatchMs,maxBatchMs:Math.max(...window.globeBatchMs),elapsedMs:performance.now()-window.globeRasterStart}))
 assert.ok(cap.maxBatchMs<50);samples.push(cap)
 await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach()
 for(const mission of [2,3,1,3,2,1]){
  await button(`Select Mission ${mission}`).click();await globe(mission).waitFor()
  assert.equal(await button(`Start Mission ${mission}`).isDisabled(),mission!==1)
 }
 // No continuous rendering: same pixels after an idle interval.
 const before=await globe(1).evaluate(c=>c.toDataURL())
 await page.waitForTimeout(150)
 assert.equal(await globe(1).evaluate(c=>c.toDataURL()),before)
 // Late mission-2 load cannot repaint the replacement mission-3 canvas.
 let delayed
 await page.route('**/original/world-selector/globes/mission-2.png',route=>{delayed=route})
 await button('Select Mission 2').click()
 await page.waitForTimeout(100)
 await button('Select Mission 3').click();await globe(3).waitFor()
 if(delayed)await delayed.continue()
 await page.waitForTimeout(100)
 assert.equal(await globe(3).count(),1)
 await page.unroute('**/original/world-selector/globes/mission-2.png')
 // Art-only failure has a visible fallback and leaves availability/navigation intact.
 await page.route('**/original/world-selector/globes/*.png',route=>route.abort('failed'))
 await button('Select Mission 1').click()
 await page.getByText('World image unavailable',{exact:true}).waitFor()
 assert.equal(await button('Start Mission 1').isEnabled(),true)
 await page.screenshot({path:resolve(output,'globe-fallback.png')})
 await button('Select Mission 2').click()
 await page.getByText('World image unavailable',{exact:true}).waitFor()
 assert.equal(await button('Start Mission 2').isDisabled(),true)
 await page.unroute('**/original/world-selector/globes/*.png')
 await button('All missions').click()
 assert.equal(await page.getByRole('button',{name:/^Mission \d+(, completed)?$/}).count(),23)
 await button('Campaign worlds').click();await globe(2).waitFor()
 await button('Back').click();await button('New Game').click();await globe(1).waitFor()
 assert.deepEqual(receipt.errors.filter(e=>!e.includes('Failed to load resource: net::ERR_FAILED')),[])
 return {samples,checks:['Actual textured mesh pixel coverage','CSS resize including4K and DPR-only change','no focus/pointer overlay','rapid selection and stale-image lifetime','static idle pixels','missing-art fallback and availability','all23 direct access retained','Back/reopen','cooperative4K/DPR2 batch latency','superseded resize and mission generation cancellation'],limits:['Fixed adapted depth/pose and RGB8 bilinear repeat sampler; not original full-scene pixel parity','Headless compositor; no hardware performance claim']}
}
