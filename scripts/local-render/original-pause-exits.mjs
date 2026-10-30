import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

// Independent short episodes avoid accumulating multiple software-WebGL worlds.
export default async function({page,root,output}) {
 const mode=process.env.PND_PAUSE_EXIT??'restart'
 assert.ok(['restart','level','tutorial'].includes(mode))
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const button=name=>page.getByRole('button',{name,exact:true})
 const modal=page.getByRole('dialog',{name:'Game menu',exact:true})
 await page.setViewportSize({width:800,height:600})
 if(mode==='tutorial')await button('Tutorial').click()
 else{await openCampaignFromMainMenu(page);await button('Start Mission 1').click()}
 await bindGame(page)
 if(mode!=='tutorial'){
  await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 }
 if(mode==='tutorial'){
  await page.mouse.move(500,300);await page.mouse.down({button:'right'})
  assert.notEqual(await page.evaluate(()=>window.testSceneRef.current.pointerGesture),null)
  await page.keyboard.press('Escape');await modal.waitFor()
  assert.equal(await page.evaluate(()=>window.testSceneRef.current.pointerGesture),null)
  const state=()=>page.evaluate(()=>{const s=window.testSceneRef.current;return {world:JSON.stringify(s.world),position:s.camera.position.toArray(),rotation:s.camera.quaternion.toArray(),phase:s.globe.phase}})
  const before=await state();await page.mouse.move(580,350);await page.mouse.up({button:'right'});assert.deepEqual(await state(),before)
  assert.deepEqual(await modal.locator('nav button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))),['Continue Game','Options','Quit Game','Back'])
  await page.screenshot({path:resolve(output,'tutorial-pause.png')})
  await button('Quit Game').click();await button('Yes').click()
  await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
  assert.equal(await page.locator('.world-viewport canvas').count(),0)
  return {checks:['Tutorial restricted rows','captured right-drag released at menu boundary; pointer movement/release cannot mutate frozen world/camera','Tutorial Quit Game returns main menu and disposes scene'],limits:['Software renderer; browser exit adaptation']}
 }
 await button('Menu').click()
 if(mode==='level'){
  await button('Quit Level').click();await button('Yes').click()
  await page.getByRole('dialog',{name:'Start game',exact:true}).waitFor()
  assert.equal(await page.locator('.world-viewport canvas').count(),0)
  await page.screenshot({path:resolve(output,'quit-level-selector.png')})
  await button('Back').click();await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
  return {checks:['Quit Level returns world selection and disposes scene','selector Back returns main menu'],limits:['Software renderer; browser world-selection adaptation']}
 }
 await page.setViewportSize({width:960,height:720})
 await button('Restart Level').click()
 await button('No').focus();await page.keyboard.down('Enter');await page.keyboard.press('Enter');await page.keyboard.up('Enter')
 if(await modal.getAttribute('data-panel')==='root')await button('Restart Level').click()
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 await page.evaluate(()=>{
  const store=window.testStore,restart=store.restart
  window.pauseRestartCalls=0
  store.restart=()=>{
   const old=store.getWorld();window.pauseRestartCalls++
   restart()
   window.pauseRestartBoundary={replaced:old!==store.getWorld(),level:store.getWorld().outcome.level,paused:store.getWorld().paused}
  }
 })
 await button('Yes').evaluate(b=>{b.click();b.click()})
 assert.equal(await page.evaluate(()=>window.pauseRestartCalls),1)
 assert.deepEqual(await page.evaluate(()=>window.pauseRestartBoundary),{replaced:true,level:1,paused:false})
 await bindGame(page)
 assert.equal(await page.evaluate(()=>window.testSceneRef.current.world===window.testStore.getWorld()),true)
 assert.equal(await page.evaluate(()=>window.testSceneRef.current.modalSuspended),false)
 assert.equal(await modal.count(),0)
 await page.screenshot({path:resolve(output,'restarted-ready.png')})
 return {checks:['held Enter on default No never accepts destructive Yes','repeated Yes replaces world exactly once','restart creates ready unsuspended current Scene; stale pause does not leak'],limits:['Software renderer; actual ordinary restart plus read-only call/boundary observer']}
}
