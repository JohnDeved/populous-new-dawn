import assert from 'node:assert/strict'
import {resolve} from 'node:path'

// Pure frontend display/readability coverage without creating a WebGL scene.
export default async function({page,context,url,output,receipt}) {
 const main=page.getByRole('dialog',{name:'Main menu',exact:true})
 await main.waitFor()
 const cdp=await context.newCDPSession(page)
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:2,mobile:false})
 assert.equal(await page.evaluate(()=>window.devicePixelRatio),2)
 await main.getByRole('button',{name:'Options',exact:true}).hover()
 await page.waitForTimeout(150)
 await page.screenshot({path:resolve(output,'main-1920x1080-dpr2.png')})
 const bounds=await main.locator('canvas').boundingBox()
 assert.ok(Math.abs(bounds.width-1440)<1&&Math.abs(bounds.height-1080)<1)
 await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach()
 await page.setViewportSize({width:640,height:480})
 let aborted=0
 await page.route('**/original/frontend/feft33we.png',route=>{aborted++;return route.abort('failed')})
 await page.reload({waitUntil:'networkidle'});await main.waitFor()
 assert.ok(aborted>0,'font failure must actually be injected')
 assert.match(await main.getByRole('button',{name:'New Game',exact:true}).innerText(),/New Game/)
 assert.equal(await page.locator('.world-viewport canvas').count(),0)
 await page.screenshot({path:resolve(output,'font-network-fallback.png')})
 await main.getByRole('button',{name:'New Game',exact:true}).focus();await page.keyboard.press('Enter')
 await page.getByRole('dialog',{name:'Start game',exact:true}).waitFor()
 await page.getByRole('button',{name:'Back',exact:true}).click();await main.waitFor()
 assert.deepEqual(receipt.errors.filter(error=>!error.includes('Failed to load resource: net::ERR_FAILED')),[])
 return {checks:['real DPR2 display change and uniform1920×1080 composition','blocked font fetch retains visible labels and keyboard New Game/Back'],aborted,limits:['2D frontend only; no WebGL or hardware performance claim']}
}
