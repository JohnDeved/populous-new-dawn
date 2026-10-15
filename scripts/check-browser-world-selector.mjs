import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Scenario for scripts/local-render/harness.mjs. Campaign actions deliberately
// do not use the direct-access openMission helper.
export default async function checkWorldSelector({ page, context, url, root, output, receipt }) {
  const select=mission=>page.getByRole('button',{name:new RegExp(`^Panel Mission ${mission}(, completed)?$`)})
  const showControls=async()=>{const b=page.getByRole('button',{name:'Browser controls',exact:true});if(await b.count() && await b.getAttribute('aria-expanded')==='false')await b.click()}
  const dialog = page.getByRole('dialog', { name: 'Start game', exact: true })
  await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'New Game', exact: true }).click()
  await dialog.waitFor({ state: 'visible' })
  await page.setViewportSize({width:640,height:480})
  const panel=page.getByLabel('Campaign status panel', {exact:true})
  await panel.locator('img').first().waitFor()
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('[aria-label="Campaign status panel"] img')).every(img=>img.complete&&img.naturalWidth>0))
  const geometry=await panel.boundingBox()
  assert.ok(Math.abs(geometry.x-1)<.02&&Math.abs(geometry.y-419)<.02&&Math.abs(geometry.width-638)<.02)
  const glyph=await page.getByRole('button',{name:'Panel Mission 1',exact:true}).locator('img').boundingBox()
  assert.ok(Math.abs(glyph.x-34)<.02&&Math.abs(glyph.y-445)<.02, JSON.stringify({glyph,geometry,style:await page.getByRole('button',{name:'Panel Mission 1',exact:true}).evaluate(b=>({box:b.getBoundingClientRect().toJSON(),css:getComputedStyle(b).cssText,markup:b.outerHTML}))}))
  assert.equal(await page.getByRole('button',{name:'Panel Mission 2',exact:true}).locator('img').count(),0)
  await page.screenshot({path:resolve(output,'fresh-640x480.png')})
  const panelOne=page.getByRole('button',{name:'Panel Mission 1',exact:true})
  await panelOne.hover();await panelOne.focus()
  assert.equal(await panelOne.evaluate(b=>getComputedStyle(b).backgroundColor),'rgba(0, 0, 0, 0)')
  await page.screenshot({path:resolve(output,'glyph-hover-focus-640x480.png')})
  const launch=page.getByRole('button',{name:'Start Mission 1',exact:true})
  await launch.hover();await launch.focus()
  assert.equal(await launch.evaluate(b=>getComputedStyle(b).backgroundColor),'rgba(0, 0, 0, 0)')
  assert.equal(await launch.locator('img').evaluate(img=>getComputedStyle(img).opacity),'1')
  await page.screenshot({path:resolve(output,'launch-hover-focus-640x480.png')})
  for(let i=0;i<3;i++) {
    await page.keyboard.press('Escape')
    await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
    await page.getByRole('button',{name:'New Game',exact:true}).click()
  }
  await select(2).click()
  assert.equal(await page.getByRole('button', { name: 'Start Mission 2', exact: true }).isDisabled(), true)
  await page.screenshot({path:resolve(output,'locked-mission2.png')})
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).waitFor()
  await page.screenshot({ path: resolve(output, 'fresh-campaign.png') })

  for (const viewport of [{width:640,height:480},{width:1024,height:768},{width:390,height:844},{width:1920,height:1080},{width:3440,height:1440}]) {
    await page.setViewportSize(viewport)
    await select(1).click()
    const bounds = await page.getByRole('button', { name: 'Start Mission 1', exact: true }).boundingBox()
    assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow,false)
    await page.screenshot({path:resolve(output,`fresh-${viewport.width}x${viewport.height}.png`)})
  }
  await page.setViewportSize({width:800,height:600})
  const { showAllMissions } = await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  await showAllMissions(page)
  assert.equal(await page.getByRole('button',{name:/^Mission \d+(, completed)?$/}).count(),23)
  await page.screenshot({path:resolve(output,'all-missions.png')})
  await showControls()
  await page.getByRole('button', { name: 'Campaign worlds', exact: true }).click()
  // A persisted completion fixture isolates restore/selector integration.
  // It is not a claim of naturally winning these missions in this check.
  await page.evaluate(async()=> {
    const database=await new Promise((res,rej)=>{const request=indexedDB.open('populous-new-dawn',1);request.onsuccess=()=>res(request.result);request.onerror=()=>rej(request.error)})
    await new Promise((res,rej)=>{const tx=database.transaction('checkpoints','readwrite');tx.objectStore('checkpoints').put({version:1,completed:[1,2]},'profile');tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})
    database.close()
  })
  await page.goto(url,{waitUntil:'networkidle'})
  await page.getByRole('button', { name: 'New Game', exact: true }).click()
  await page.getByRole('button',{name:'Start Mission 3',exact:true}).waitFor({state:'visible'})
  assert.equal(await page.getByRole('button',{name:'Start Mission 3',exact:true}).isEnabled(),true)
  await select(3).focus()
  await page.keyboard.press('ArrowLeft')
  await page.getByRole('button',{name:'Replay Mission 2',exact:true}).waitFor()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button',{name:'Start Mission 3',exact:true}).waitFor()
  await select(1).click()
  await page.getByRole('button',{name:'Replay Mission 1',exact:true}).waitFor({state:'visible'})
  await page.screenshot({path:resolve(output,'restored-progress.png')})
  await page.setViewportSize({width:640,height:480})
  await page.getByRole('button',{name:'Panel Mission 2, completed',exact:true}).click()
  await page.getByRole('button',{name:'Replay Mission 2',exact:true}).waitFor()
  assert.ok((await page.getByRole('button',{name:'Panel Mission 1, completed',exact:true}).locator('img').getAttribute('src')).endsWith('2-6.png'))
  await page.screenshot({path:resolve(output,'completed-mission2-640x480.png')})
  await select(3).click()
  await page.screenshot({path:resolve(output,'restored-next-mission3-640x480.png')})
  const cdp=await context.newCDPSession(page)
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:2,mobile:false})
  await select(1).click()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button',{name:'Replay Mission 2',exact:true}).waitFor()
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})
  const png=Buffer.from(shot.data,'base64')
  assert.equal(png.readUInt32BE(16),2048);assert.equal(png.readUInt32BE(20),1536)
  writeFileSync(resolve(output,'selector-dpr2.png'),png)
  await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach()
  assert.deepEqual(receipt.errors,[])
  return {renderer:'Chromium frontend compositor; no battlefield scene initialized',geometry,checks:['source strip/glyph geometry at640x480','repeated startup Escape and reopen','panel glyph pointer selection','DPR2 keyboard and rendered capture','fresh locked/unlocked state','left/right selection','responsive overflow','all23 missions retained','persisted completion restoration and replay'],limits:['Completion profile fixture; not natural campaign victory','Native strip and source-derived shared GPU scene; browser adaptation, not original GPU pixel parity']}
}
