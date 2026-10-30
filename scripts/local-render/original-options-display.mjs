import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
export default async function({page,context,root,output,receipt}) {
 const width=Number(process.env.PND_OPTIONS_WIDTH??1920),height=Number(process.env.PND_OPTIONS_HEIGHT??1080),dpr=Number(process.env.PND_OPTIONS_DPR??1)
 const button=name=>page.getByRole('button',{name,exact:true})
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 await page.setViewportSize({width:800,height:600})
 // Use the verified shipped Options-to-mission route; direct scene startup can crash this software renderer.
 await button('Options').click();await button('Sound').click();await page.locator('[data-original-options][data-art-ready="true"]').waitFor();await button('Back').click()
 await openCampaignFromMainMenu(page);await button('Start Mission 1').click();await bindGame(page)

 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 });await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await button('Menu').click();await button('Options').click();await button('Sound').click()
 const options=page.locator('[data-original-options][data-art-ready="true"]');await options.waitFor()
 await page.setViewportSize({width,height})
 const cdp=await context.newCDPSession(page)
 if(dpr!==1)await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false})
 await page.mouse.move(-5,-5);await page.waitForTimeout(100)
 assert.equal(await options.getByRole('heading',{name:'Sound',exact:true}).locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity)),1)
 const normal=await button('Game').locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity));assert.ok(Math.abs(normal-2/3)<0.000001)
 await button('Graphics').focus();assert.equal(await button('Graphics').locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity)),1);await options.getByRole('heading',{name:'Sound',exact:true}).focus()
 for(const control of await options.locator('button,input').all()){const box=await control.boundingBox();assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1)}
 assert.equal(await page.locator('.campaign-messages').evaluate(element=>getComputedStyle(element).visibility),'hidden')
 const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false}),png=Buffer.from(shot.data,'base64')
 assert.equal(png.readUInt32BE(16),width*dpr);assert.equal(png.readUInt32BE(20),height*dpr)
 writeFileSync(resolve(output,`ingame-sound-${width}x${height}-dpr${dpr}.png`),png)
 const renderer=await page.evaluate(()=>{const gl=window.testSceneRef.current.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})
 if(dpr!==1)await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach()
 assert.deepEqual(receipt.errors,[])
 return {checks:['Fresh actual Mission1 menu display, visible original controls and hidden underlying message presentation'],viewport:{width,height,dpr},renderer,limits:['Headless software renderer; no native runtime pixel or hardware performance claim']}
}
