import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
export default async function({page,root,output}) {
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const button=name=>page.getByRole('button',{name,exact:true})
 await page.setViewportSize({width:800,height:600})
 await openCampaignFromMainMenu(page);await button('Start Mission 1').click();await bindGame(page)
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await page.locator('.world-viewport').press('Space');assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 await button('Menu').click();await button('Save Game').click()
 await page.evaluate(()=>{
  const put=IDBObjectStore.prototype.put
  window.restorePauseStorage=()=>{IDBObjectStore.prototype.put=put}
  IDBObjectStore.prototype.put=function(...args){if(this.name==='checkpoints')throw new DOMException('Controlled storage failure','QuotaExceededError');return put.apply(this,args)}
  const store=window.testStore,save=store.saveCheckpoint
  window.restorePauseSave=()=>{store.saveCheckpoint=save}
  store.saveCheckpoint=async(...args)=>{
   const result=await save(...args)
   await new Promise(resolve=>{window.finishPauseSave=resolve})
   return result
  }
 })
 await button('Save checkpoint').click()
 await page.waitForFunction(()=>typeof window.finishPauseSave==='function')
 assert.equal(await button('Saving…').isDisabled(),true)
 await page.keyboard.press('Escape')
 assert.equal(await page.getByRole('dialog',{name:'Game menu',exact:true}).getAttribute('data-panel'),'root')
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 await page.evaluate(()=>window.finishPauseSave())
 await button('Save Game').click();await page.evaluate(()=>window.restorePauseSave())
 await button('Save checkpoint').click()
 await page.getByRole('status').filter({hasText:'Checkpoint saved for this session only; browser storage is unavailable.'}).waitFor()
 await page.screenshot({path:resolve(output,'session-only-checkpoint.png')})
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 assert.equal(await page.evaluate(()=>window.testStore.hasCheckpoint()),true)
 await button('Back').click();await button('Load Game').click();await button('Back').click()
 await button('Continue Game').click()
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 await page.evaluate(()=>window.restorePauseStorage())
 return {checks:['actual IDB put failure retains session checkpoint and truthful notice','Escape while asynchronous Save is pending keeps root paused','already-paused Save and final Continue preserve paused state'],limits:['Controlled storage failure and delayed save response; actual shipped store and UI handlers']}
}
