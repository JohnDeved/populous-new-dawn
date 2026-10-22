import { skipIntroductionWithSpace } from './browser-introduction.mjs'
import { openCampaignFromMainMenu } from './browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

// Explicit failed resource boundaries and a real saved checkpoint. No outcome injection.
export default async function({page,url,root,output,receipt}) {
  const showControls=async()=>{const b=page.getByRole('button',{name:'Browser controls',exact:true});if(await b.count() && await b.getAttribute('aria-expanded')==='false')await b.click()}
  const button=name=>page.getByRole('button',{name,exact:true})
  const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  await page.setViewportSize({width:800,height:600})
  let artFailures=0,atlasFailures=0
  await page.route('**/original/world-selector/panel/*.png',route=>{artFailures++;return route.abort('failed')})
  await openCampaignFromMainMenu(page)
  await page.getByRole('button',{name:'Start Mission 1',exact:true}).getByText('Start',{exact:true}).waitFor()
  assert.ok(artFailures>0)
  await button('Panel Mission 2').click()
  assert.equal(await button('Start Mission 2').isDisabled(),true)
  await button('Panel Mission 1').click()
  await page.screenshot({path:resolve(output,'panel-art-fallback.png')})
  await page.route('**/original/atlas.png',route=>{atlasFailures++;return route.abort('failed')})
  await button('Start Mission 1').focus();await page.keyboard.press('Enter')
  await page.getByRole('heading',{name:'Loading failed',exact:true}).waitFor()
  assert.ok(atlasFailures>0)
  await page.screenshot({path:resolve(output,'mission-loading-failed.png')})
  await page.unroute('**/original/atlas.png')
  await button('Try again').click()
  await bindGame(page)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),1)

  await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
  await button('Menu').click();await button('Save Game').click();await button('Save checkpoint').click()
  await page.getByText('Checkpoint saved in this browser.',{exact:true}).waitFor()
  const saved=await page.evaluate(()=>({level:window.testStore.getWorld().outcome.level,turn:window.testStore.getWorld().turn}))
  await page.keyboard.press('Escape');await button('Options').click();await button('Browser compatibility and help').click();await button('Select Level').click()
  await showControls()
  await button('Load Game').waitFor()
  await page.screenshot({path:resolve(output,'selector-checkpoint-access.png')})
  await button('Load Game').click();await bindGame(page)
  const restored=await page.evaluate(()=>({level:window.testStore.getWorld().outcome.level,turn:window.testStore.getWorld().turn}))
  assert.equal(restored.level,saved.level);assert.ok(restored.turn>=saved.turn)
  await page.unroute('**/original/world-selector/panel/*.png')
  await page.goto(url,{waitUntil:'networkidle'})
  // Startup restores the saved world's ownership; load and tutorial remain separate actions.
  await openCampaignFromMainMenu(page);await showControls();await button('Tutorial').click();await bindGame(page)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),79)
  assert.deepEqual(receipt.errors.filter(error=>!error.includes('Failed to load resource: net::ERR_FAILED')&&!error.includes('Texture load failed: atlas')),[])
  return {artFailures,atlasFailures,saved,restored,checks:['visible art fallback and locked launch','keyboard Mission1 launch through required-texture failure and explicit retry','real saved checkpoint accessible and loadable from selector','Tutorial remains launchable'],limits:['Explicit resource failures; no natural campaign outcome evidence','Headless software rendering']}
}
