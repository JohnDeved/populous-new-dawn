import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {writeFileSync} from 'node:fs'

// Independent ordinary checkpoint acceptance. Error/Retry remains a separate
// scenario because the baseline software browser crashes in that route.
export default async function({page,browser,url,root,output,receipt}) {
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const {waitForCheckpointReadback}=await import(pathToFileURL(resolve(root,'scripts/checkpoint-readback.mjs')).href)
 const progress=[],passed=name=>{progress.push(name);writeFileSync(resolve(output,'progress.json'),JSON.stringify(progress,null,2)+'\n')}
 const button=name=>page.getByRole('button',{name,exact:true})
 const main=page.getByRole('dialog',{name:'Main menu',exact:true})
 await page.setViewportSize({width:960,height:720})
 await openCampaignFromMainMenu(page)
 await button('Start Mission 1').click();await bindGame(page)
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 const snapshot=()=>page.evaluate(()=>{
  const w=window.testStore.getWorld()
  return {level:w.outcome.level,turn:w.turn,time:w.time,units:w.units.map(u=>[u.id,u.kind,u.team,u.hp,u.x,u.z]),shots:structuredClone(w.shots)}
 })
 await button('Menu').click()
 const saved=await snapshot();await button('Save Game').click();await button('Save checkpoint').click()
 const committed=await waitForCheckpointReadback(()=>page.evaluate(async expected=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('populous-new-dawn',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  try {const r=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');const v=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return v?.world?.turn===expected.turn&&v.world.outcome.level===expected.level}finally{db.close()}
 },saved),{pause:()=>page.waitForTimeout(100)})
 assert.equal(committed,true);passed('ordinary-start-and-durable-save')
 await page.reload({waitUntil:'domcontentloaded'});await main.waitFor()
 assert.equal(await page.locator('.world-viewport canvas').count(),0)
 assert.equal(await button('Load Game').getAttribute('aria-disabled'),'false')
 assert.equal(await button('Load Game').evaluate(b=>b===document.activeElement),true)
 await page.evaluate(()=>{
  let fiber=document.querySelector('main')[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))]
  for(;fiber;fiber=fiber.return)for(let h=fiber.memoizedState;h;h=h.next)if(h.memoizedState?.getWorld)window.checkpointMenuStore=h.memoizedState
  document.addEventListener('click',event=>{
   if(!event.target.closest('[aria-label="Load Game"]'))return
   const w=window.checkpointMenuStore.getWorld()
   window.loadedMenuBoundary={level:w.outcome.level,turn:w.turn,time:w.time,units:w.units.map(u=>[u.id,u.kind,u.team,u.hp,u.x,u.z]),shots:structuredClone(w.shots)}
  })
 })
 const startupTurn=await page.evaluate(()=>window.checkpointMenuStore.getWorld().turn)
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.checkpointMenuStore.getWorld().turn),startupTurn)
 await button('Load Game').click()
 assert.deepEqual(await page.evaluate(()=>window.loadedMenuBoundary),saved,'ordinary Load restores the committed world before simulation resumes')
 passed('fresh-page-exact-checkpoint-load-boundary')
 await bindGame(page);await button('Menu').click()
 const pausedTurn=await page.evaluate(()=>window.testStore.getWorld().turn)
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.testStore.getWorld().turn),pausedTurn)
 await button('Options').click();await button('Select Level').click();await button('Back').click()
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 await page.screenshot({path:resolve(output,'checkpoint-loaded-paused.png')})
 passed('loaded-scene-ready-and-selector-back-preserves-pause')
 const renderer=await page.evaluate(()=>{const gl=window.testSceneRef.current.renderer.getContext(),d=gl.getExtension('WEBGL_debug_renderer_info');return d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})
 // Release the software-WebGL page before independent 2D/DPR contexts.
 await page.close()
 const high=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:2})
 const hp=await high.newPage();hp.setDefaultTimeout(60000);const highErrors=[];hp.on('pageerror',e=>highErrors.push(String(e)));await hp.goto(url,{waitUntil:'networkidle'})
 await hp.getByRole('dialog',{name:'Main menu',exact:true}).waitFor().catch(async e=>{await hp.screenshot({path:resolve(output,'dpr2-failure.png')});writeFileSync(resolve(output,'dpr2-error.json'),JSON.stringify({errors:highErrors,body:await hp.locator('body').innerText()}));throw e})
 assert.deepEqual(highErrors,[])
 await hp.getByRole('button',{name:'Options',exact:true}).hover()
 await hp.screenshot({path:resolve(output,'main-1920x1080-dpr2.png')});await high.close();passed('DPR2-menu-render')
 const fallback=await browser.newContext({viewport:{width:640,height:480}})
 const fp=await fallback.newPage();await fp.route('**/original/frontend/feft33we.png',r=>r.abort('failed'))
 await fp.goto(url,{waitUntil:'networkidle'});const fm=fp.getByRole('dialog',{name:'Main menu',exact:true});await fm.waitFor()
 assert.match(await fm.getByRole('button',{name:'New Game',exact:true}).innerText(),/New Game/)
 await fp.screenshot({path:resolve(output,'font-network-fallback.png')})
 await openCampaignFromMainMenu(fp);await fp.getByRole('dialog',{name:'Start game',exact:true}).waitFor();await fallback.close();passed('font-failure-visible-usable-fallback')
 assert.deepEqual(receipt.errors,[])
 return {checks:progress,saved,renderer,limits:['Software WebGL; no hardware performance claim','Error/Retry has a separately retained baseline target-crash blocker']}
}
