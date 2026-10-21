import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
export default async function({page,output,root}) {
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const progress=[],passed=name=>{progress.push(name);writeFileSync(resolve(output,'progress.json'),JSON.stringify(progress,null,2))}
 const button=name=>page.getByRole('button',{name,exact:true})
 const modal=page.getByRole('dialog',{name:'Game menu',exact:true})
 const state=()=>page.evaluate(()=>{const s=window.testSceneRef.current,w=window.testStore.getWorld();return {world:JSON.stringify(w),animation:s.gameClock.animationFrame,animationTime:s.gameClock.animationTime,phase:s.globe.phase,camera:s.cameraPosition,position:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray()}})
 const paused=()=>page.evaluate(()=>window.testStore.getWorld().paused)
 await page.setViewportSize({width:800,height:600})
 await openCampaignFromMainMenu(page)
 await page.getByRole('button',{name:'Start Mission 1',exact:true}).click()
 await page.waitForSelector('.world-viewport canvas')
 const {bindGame:bind}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 await bind(page)

 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await button('Menu').click();await modal.waitFor()
 assert.deepEqual(await modal.locator('nav button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))),['Continue Game','Load Game','Save Game','Options','Restart Level','Quit Level','Quit Game','Back'])
 assert.equal(await button('Load Game').isDisabled(),true)
 const frozen=await state();await page.waitForTimeout(650);assert.deepEqual(await state(),frozen);passed('entire-world-clock-camera-acquisition-frozen')
 for(const [width,height] of [[640,480],[1280,960],[1920,1080],[900,360],[2560,720]]) {
  await page.setViewportSize({width,height});await button('Options').hover();await page.waitForTimeout(100)
  for(const b of await modal.locator('nav button').all()){const r=await b.boundingBox();assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1)}
  await page.screenshot({path:resolve(output,`pause-${width}x${height}.png`)})
 }
 await page.setViewportSize({width:960,height:720});passed('native-root-and-responsive-viewports')
 for(const label of ['Restart Level','Quit Level','Quit Game']) {
  for(const cancel of ['No','Back','Escape']) {
   await button(label).click();assert.equal(await modal.getAttribute('data-panel'),label==='Restart Level'?'restart':label==='Quit Level'?'quit-level':'quit-game')
   assert.equal(await button('No').evaluate(b=>b===document.activeElement),true)
   await page.screenshot({path:resolve(output,`${label.replaceAll(' ','-')}.png`)})
   if(cancel==='Escape')await page.keyboard.press('Escape');else await button(cancel).click()
   assert.equal(await modal.getAttribute('data-panel'),'root');assert.equal(await paused(),true)
   assert.equal(await button(label).evaluate(b=>b===document.activeElement),true)
  }
 }
 passed('all-destructive-confirmations-cancel-back-escape-focus')
 const resumeBoundary=await page.evaluate(()=>new Promise(resolve=>{
  const world=window.testStore.getWorld(),before=world.turn
  document.querySelector('[data-original-pause-menu] button[aria-label="Continue Game"]').click()
  requestAnimationFrame(()=>resolve({before,after:world.turn}))
 }))
 assert.equal(resumeBoundary.after,resumeBoundary.before)
 await button('Menu').click();passed('no-suspended-wall-time-catchup-on-first-resumed-frame')
 for(const close of ['Continue Game','Back','Escape']) {
  if(close==='Escape')await page.keyboard.press('Escape');else await button(close).click()
  assert.equal(await paused(),false)
  await button('Menu').focus();await page.keyboard.press('Enter');assert.equal(await paused(),true)
 }
 await button('Continue Game').click();await page.locator('.world-viewport').press('Space');assert.equal(await paused(),true)
 for(const close of ['Continue Game','Back','Escape']) {
  await button('Menu').click()
  if(close==='Escape')await page.keyboard.press('Escape');else await button(close).click()
  assert.equal(await paused(),true)
 }
 passed('pointer-keyboard-close-preserves-running-and-already-paused')
 await page.locator('.world-viewport').press('Space');await button('Menu').click()
 await button('Options').click();await button('Browser compatibility and help').click();await page.getByRole('region',{name:'Browser compatibility and help'}).waitFor()
 assert.equal(await page.getByRole('button', { name: /^HUD size : </ }).isVisible(),true)
 await button('Select Level').click();await button('Back').click();assert.equal(await paused(),true)
 await button('Back').click();assert.equal(await paused(),false)
 passed('secondary-help-options-and-selector-return-preserve-original-pause')
 await button('Menu').click();await button('Save Game').click()
 await button('Save checkpoint').click();await page.getByRole('status').filter({hasText:'Checkpoint saved in this browser.'}).waitFor()
 assert.equal(await paused(),true)
 await page.screenshot({path:resolve(output,'save-checkpoint.png')})
 const saved=await page.evaluate(()=>({turn:window.testStore.getWorld().turn,time:window.testStore.getWorld().time}))
 const persisted=await page.evaluate(async()=>{
  const db=await new Promise((res,rej)=>{const r=indexedDB.open('populous-new-dawn',1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
  try{return await new Promise((res,rej)=>{const r=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');r.onsuccess=()=>res({paused:r.result.world.paused,turn:r.result.world.turn});r.onerror=()=>rej(r.error)})}finally{db.close()}
 })
 assert.equal(persisted.paused,false);assert.equal(persisted.turn,saved.turn)
 await button('Back').click();assert.equal(await button('Load Game').isEnabled(),true)
 await button('Load Game').click();await page.screenshot({path:resolve(output,'load-checkpoint.png')});await button('Back').click();assert.equal(await paused(),true)
 await button('Continue Game').click();await page.waitForTimeout(300);await button('Menu').click();await button('Load Game').click()
 await page.evaluate(()=>{const store=window.testStore;window.loadCalls=0;const load=store.loadCheckpoint;store.loadCheckpoint=()=>{window.loadCalls++;return load()}})
 await button('Load checkpoint').evaluate(b=>{b.click();b.click()})
 assert.equal(await page.evaluate(()=>window.loadCalls),1)
 await bindGame(page);assert.equal(await paused(),false);passed('durable-checkpoint-clone-pause-and-single-load-world-replacement')
 await button('Menu').click();await button('Restart Level').click()
 await button('No').focus();await page.keyboard.down('Enter');await page.keyboard.press('Enter');await page.keyboard.up('Enter')
 if(await modal.getAttribute('data-panel')==='root')await button('Restart Level').click()
 assert.equal(await paused(),true)
 await page.evaluate(()=>{const store=window.testStore;window.restartCalls=0;const restart=store.restart;store.restart=()=>{window.restartCalls++;return restart()}})
 await button('Yes').evaluate(b=>{b.click();b.click()});assert.equal(await page.evaluate(()=>window.restartCalls),1)
 await bindGame(page);passed('restart-confirm-yes-exactly-once')
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await button('Menu').click();await button('Quit Level').click();await button('Yes').click()
 await page.getByRole('dialog',{name:'Start game',exact:true}).waitFor();assert.equal(await page.locator('.world-viewport canvas').count(),0)
 await button('Back').click();await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
 await button('Tutorial').click();await bindGame(page)

 await page.mouse.move(500,300);await page.mouse.down({button:'right'})
 assert.notEqual(await page.evaluate(()=>window.testSceneRef.current.pointerGesture),null)
 await page.keyboard.press('Escape');await modal.waitFor()
 assert.equal(await page.evaluate(()=>window.testSceneRef.current.pointerGesture),null)
 const dragFrozen=await state();await page.mouse.move(580,350);await page.mouse.up({button:'right'});assert.deepEqual(await state(),dragFrozen)
 passed('tutorial-captured-drag-cancelled-before-menu')
 assert.deepEqual(await modal.locator('nav button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))),['Continue Game','Options','Quit Game','Back'])
 await page.screenshot({path:resolve(output,'tutorial-pause.png')})
 await button('Quit Game').click();await button('Yes').click();await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor();assert.equal(await page.locator('.world-viewport canvas').count(),0)
 passed('distinct-quit-level-selector-and-tutorial-quit-main-outcomes')
 return {checks:progress,limits:['Software renderer; browser one-checkpoint and exit adaptations; original font fade separately bounded']}
}
