import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {writeFileSync} from 'node:fs'
export default async function({page,root,context,output,receipt}) {
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const fallback=process.env.PND_PAUSE_FONT_FAILURE==='1'
 let aborted=0
 if(fallback)await page.route('**/original/pause-font.png',route=>{aborted++;return route.abort('failed')})
 await page.setViewportSize({width:800,height:600})
 await page.getByRole('button',{name:'Tutorial',exact:true}).click();await bindGame(page)

 await page.getByRole('button',{name:'Menu',exact:true}).click()
 const modal=page.getByRole('dialog',{name:'Game menu',exact:true});await modal.waitFor()
 if(fallback){
  await page.waitForTimeout(100)
  assert.ok(aborted>0)
  assert.equal(await modal.getByRole('button',{name:'Continue Game',exact:true}).innerText(),'Continue Game')
  await page.screenshot({path:resolve(output,'pause-font-fallback.png')})
  await page.getByRole('button',{name:'Options',exact:true}).focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button',{name:'Options',exact:true}).evaluate(b=>b===document.activeElement),true)
 }else{
  await page.waitForFunction(()=>document.querySelector('[data-original-pause-menu] nav button i'))
  const cdp=await context.newCDPSession(page)
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:800,height:600,deviceScaleFactor:2,mobile:false})
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(()=>devicePixelRatio),2)
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false}),png=Buffer.from(shot.data,'base64')
  assert.equal(png.readUInt32BE(16),1600);assert.equal(png.readUInt32BE(20),1200)
  writeFileSync(resolve(output,'pause-dpr2.png'),png)
  await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach()
 }
 assert.deepEqual(receipt.errors.filter(error=>!error.includes('Failed to load resource: net::ERR_FAILED')),[])
 return {checks:[fallback?'real missing-font request retains visible labels and keyboard panel navigation':'real DPR2 original-font overlay over Tutorial'],aborted,limits:['Software renderer; independent display-only episode']}
}
