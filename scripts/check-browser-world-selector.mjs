import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Scenario for scripts/local-render/harness.mjs. Campaign actions deliberately
// do not use the direct-access openMission helper.
export default async function checkWorldSelector({ page, url, root, output }) {
  const dialog = page.getByRole('dialog', { name: 'Start game', exact: true })
  await dialog.waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Select Mission 2', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Start Mission 2', exact: true }).isDisabled(), true)
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).waitFor()
  await page.screenshot({ path: resolve(output, 'fresh-campaign.png') })

  for (const viewport of [{width:1024,height:768},{width:390,height:844},{width:1920,height:1080}]) {
    await page.setViewportSize(viewport)
    await page.getByRole('button', { name: 'Select Mission 1', exact: true }).click()
    const bounds = await page.getByRole('button', { name: 'Start Mission 1', exact: true }).boundingBox()
    assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow,false)
  }
  await page.setViewportSize({width:1440,height:1000})
  await page.getByRole('button', { name: 'All missions', exact: true }).click()
  assert.equal(await page.getByRole('button',{name:'Mission 23',exact:true}).count(),1)
  await page.getByRole('button', { name: 'Campaign worlds', exact: true }).click()
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
  const { bindGame } = await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  await bindGame(page)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),1)
  const skip=page.locator('.skip-introduction')
  await skip.waitFor({state:'visible',timeout:45000}).catch(()=>{})
  if(await skip.isVisible()) await skip.click()
  await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
  const renderer = await page.evaluate(()=> {
    const gl=window.testScene.renderer.getContext(), debug=gl.getExtension('WEBGL_debug_renderer_info')
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  })
  await page.getByRole('button',{name:'Game settings',exact:true}).click()
  await page.getByRole('button',{name:'Select Level',exact:true}).click()
  await dialog.waitFor({state:'visible'})
  const before=await page.evaluate(()=>({turn:window.testStore.getWorld().turn,level:window.testStore.getWorld().outcome.level,paused:window.testStore.getWorld().paused}))
  await page.waitForTimeout(350)
  const after=await page.evaluate(()=>({turn:window.testStore.getWorld().turn,level:window.testStore.getWorld().outcome.level,paused:window.testStore.getWorld().paused}))
  assert.deepEqual(after,before)
  assert.equal(after.paused,true)
  await page.getByRole('button',{name:'Back',exact:true}).click()
  await page.getByRole('button',{name:'Continue Game',exact:false}).waitFor({state:'visible'})
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)

  // A persisted completion fixture isolates restore/selector integration.
  // It is not a claim of naturally winning these missions in this check.
  await page.evaluate(async()=> {
    const database=await new Promise((res,rej)=>{const request=indexedDB.open('populous-new-dawn',1);request.onsuccess=()=>res(request.result);request.onerror=()=>rej(request.error)})
    await new Promise((res,rej)=>{const tx=database.transaction('checkpoints','readwrite');tx.objectStore('checkpoints').put({version:1,completed:[1,2]},'profile');tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})
    database.close()
  })
  await page.goto(url,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Start Mission 3',exact:true}).waitFor({state:'visible'})
  assert.equal(await page.getByRole('button',{name:'Start Mission 3',exact:true}).isEnabled(),true)
  await page.getByRole('button',{name:'Select Mission 1',exact:true}).click()
  await page.getByRole('button',{name:'Replay Mission 1',exact:true}).waitFor({state:'visible'})
  await page.screenshot({path:resolve(output,'restored-progress.png')})
  return {renderer,checks:['fresh locked/unlocked state','left/right selection','pointer launch Mission1','responsive overflow','all23 missions retained','return and Back preserve paused world','persisted completion restoration and replay'],limits:['Completion profile fixture; not natural campaign victory','Native authored layout and textures with modern flat-map/CSS sphere presentation; not native pixel parity']}
}
