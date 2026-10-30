import { skipIntroductionWithSpace } from './browser-introduction.mjs'
import { openCampaignFromMainMenu } from './browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

// Separate fresh episode: no large frontend captures precede actual WebGL startup.
export default async function({page,root,output,receipt}) {
  const dialog=page.getByRole('dialog',{name:'Start game',exact:true})
  await page.setViewportSize({width:800,height:600})
  await openCampaignFromMainMenu(page)
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
  const { bindGame } = await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  await bindGame(page)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),1)

  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
  const renderer = await page.evaluate(()=> {
    const gl=window.testScene.renderer.getContext(), debug=gl.getExtension('WEBGL_debug_renderer_info')
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  })
  await page.getByRole('button',{name:'Menu',exact:true}).click()
  await page.getByRole('button',{name:'Options',exact:true}).click()
  await page.getByRole('button',{name:'Browser compatibility and help',exact:true}).click()
  await page.getByRole('button',{name:'Select Level',exact:true}).click()
  await dialog.waitFor({state:'visible'})
  await page.locator('canvas[data-world-scene][data-ready="true"]').waitFor()
  await page.evaluate(()=>{window.selectorOriginalWorld=window.testStore.getWorld()})
  const before=await page.evaluate(()=>({turn:window.testStore.getWorld().turn,level:window.testStore.getWorld().outcome.level,paused:window.testStore.getWorld().paused}))
  await page.getByRole('button',{name:'Panel Mission 2',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('canvas[data-world-scene]')?.dataset.selectedBody==='23')
  await page.waitForTimeout(350)
  const after=await page.evaluate(()=>({turn:window.testStore.getWorld().turn,level:window.testStore.getWorld().outcome.level,paused:window.testStore.getWorld().paused}))
  assert.deepEqual(after,before)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld()===window.selectorOriginalWorld),true)
  assert.equal(after.paused,true)
  await page.screenshot({path:resolve(output,'ingame-selector.png')})
  const controls=page.getByRole('button',{name:'Browser controls',exact:true})
  if(await controls.count() && await controls.getAttribute('aria-expanded')==='false')await controls.click()
  await page.getByRole('button',{name:'Back',exact:true}).click()
  assert.equal(await page.locator('canvas[data-world-scene]').count(),0)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld()===window.selectorOriginalWorld),true)
  await page.getByRole('button',{name:'Continue Game',exact:false}).waitFor({state:'visible'})
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)

  await page.screenshot({path:resolve(output,'returned-pause-menu.png')})
  await page.getByRole('button',{name:'Options',exact:true}).click()
  await page.getByRole('button',{name:'Browser compatibility and help',exact:true}).click()
  await page.getByRole('button',{name:'Select Level',exact:true}).click()
  await page.locator('canvas[data-world-scene][data-ready="true"]').waitFor()
  assert.equal(await page.evaluate(()=>window.testStore.getWorld()===window.selectorOriginalWorld),true)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('canvas[data-world-scene]').count(),0)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld()===window.selectorOriginalWorld),true)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
  await page.getByRole('button',{name:'Continue Game',exact:true}).waitFor()
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),1)

  assert.deepEqual(receipt.errors,[])
  return {renderer,before,after,checks:['pointer launch Mission1','Select Level through shipped compatibility menu','ready scene selection preserves paused world object/turn/level','Back and Escape preserve exact world object','Back and Escape return to paused main menu'],limits:['Headless software rendering; no hardware performance or natural-victory claim']}
}
