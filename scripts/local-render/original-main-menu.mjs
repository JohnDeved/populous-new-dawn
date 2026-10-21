import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'

export default async function({page,browser,url,root,output,receipt}) {
 const {waitForCheckpointReadback}=await import(pathToFileURL(resolve(root,'scripts/checkpoint-readback.mjs')).href)
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 const progress=[];const passed=name=>{progress.push(name);writeFileSync(resolve(output,'progress.json'),JSON.stringify(progress,null,2)+'\n')}
 const main=page.getByRole('dialog',{name:'Main menu',exact:true})
 const button=name=>page.getByRole('button',{name,exact:true})
 const noScene=async()=>assert.equal(await page.locator('.world-viewport canvas').count(),0)
 const rows=['New Game','Tutorial','Load Game','Multiplayer','Options','Rolling Demo','Credits','Coming Soon','Quit']
 await main.waitFor()
 assert.deepEqual(await main.locator('nav button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))),rows)
 await noScene()
 for(const [width,height] of [[640,480],[1280,960],[1920,1080],[3440,1440]]) {
  await page.setViewportSize({width,height})
  await button('Tutorial').hover()
  await page.waitForTimeout(120)
  const bounds=await main.locator('canvas').boundingBox()
  const scale=Math.min(width/640,height/480)
  assert.ok(Math.abs(bounds.width-640*scale)<1&&Math.abs(bounds.height-480*scale)<1)
  for(const name of rows){const b=await button(name).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1)}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.screenshot({path:resolve(output,`main-${width}x${height}.png`)})
 }
 await page.setViewportSize({width:1280,height:960})
 for(const name of ['Load Game','Multiplayer','Rolling Demo','Credits','Coming Soon']) {
  assert.equal(await button(name).getAttribute('aria-disabled'),'true')
  await button(name).focus();await page.keyboard.press('Enter');await noScene();assert.equal(await main.isVisible(),true)
 }
 await button('Options').focus();await page.keyboard.press('Home')
 assert.equal(await button('New Game').evaluate(b=>b===document.activeElement),true)
 await page.keyboard.press('ArrowDown');assert.equal(await button('Tutorial').evaluate(b=>b===document.activeElement),true)
 await page.keyboard.press('End');assert.equal(await button('Quit').evaluate(b=>b===document.activeElement),true)
 await page.keyboard.press('ArrowUp');assert.equal(await button('Coming Soon').evaluate(b=>b===document.activeElement),true)
 const canvas=main.locator('canvas'),digest=()=>canvas.evaluate(c=>c.toDataURL())
 const keyboardPixels=await digest();await page.waitForTimeout(220);assert.equal(await digest(),keyboardPixels,'keyboard mode stops pointer glow')
 await page.mouse.move(10,10);await button('Tutorial').hover();const movingPixels=await digest();await page.waitForTimeout(220);assert.notEqual(await digest(),movingPixels,'pointer mode animates original glow')
 await page.mouse.move(-5,-5);const leavePixels=await digest();await page.waitForTimeout(220);assert.equal(await digest(),leavePixels,'pointer leave removes and stops glow')
 await button('Options').focus();await page.keyboard.press('Enter')
 await page.getByRole('region',{name:'Options',exact:true}).waitFor();await button('Sound').click()
 await page.getByRole('slider',{name:'Master volume'}).focus();await page.keyboard.press('Home');for(let i=0;i<4;i++)await page.keyboard.press('ArrowRight')
 await page.keyboard.press('Escape')
 assert.equal(await button('Options').evaluate(b=>b===document.activeElement),true)
 await button('Options').click();await button('Sound').click();assert.equal(await page.getByRole('slider',{name:'Master volume'}).inputValue(),'0.2');await button('Back').click()
 await button('Quit').click();await page.getByText('Close this browser tab to quit.',{exact:false}).waitFor();await button('Back').click();assert.equal(await button('Quit').evaluate(b=>b===document.activeElement),true);await noScene()
 for(const exit of ['Back','Escape']) {
  await openCampaignFromMainMenu(page);await page.getByRole('dialog',{name:'Start game',exact:true}).waitFor()
  if(exit==='Back')await button('Back').click();else await page.keyboard.press('Escape')
  await main.waitFor();await noScene()
 }
 await page.mouse.move(-5,-5)
 assert.equal(await main.isVisible(),true)
 assert.match(await main.evaluate(el=>getComputedStyle(el).cursor),/pointer\.png.*0 0/)
 passed('menu-viewports-keyboard-options-back-cancel-glow')
 // Keep the software-WebGL gameplay smoke bounded; menu dimensions were tested above.
 await page.setViewportSize({width:800,height:600})
 await button('Tutorial').click();await bindGame(page)
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),79)
 await page.screenshot({path:resolve(output,'tutorial-ready.png')})
 passed('tutorial-ready')

 await page.getByRole('button',{name:'Menu',exact:true}).click()
 await button('Quit Game').click();await button('Yes').click();await main.waitFor();await noScene()
 passed('tutorial-return-main')
 // Separate the independent failure-injection scenario from the previous WebGL context.
 await page.reload({waitUntil:'domcontentloaded'});await main.waitFor()
 // Force one real network failure, then use the retained request's Retry button.
 await page.route('**/original/landscape.bin',route=>route.abort('failed'))
 await openCampaignFromMainMenu(page);await button('Start Mission 1').click()
 await page.getByRole('heading',{name:'Loading failed',exact:true}).waitFor()
 passed('real-network-failure-shows-retry')
 const stopped=await page.evaluate(()=>{
  let f=document.querySelector('main')[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))]
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.getWorld){window.menuTestStore=h.memoizedState;return h.memoizedState.getWorld().turn}
 })
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.menuTestStore.getWorld().turn),stopped)
 await page.unroute('**/original/landscape.bin');await button('Try again').click();await bindGame(page)
 passed('retry-load-ready')
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await button('Menu').click();await button('Save Game').click();await button('Save checkpoint').click()
 await page.getByRole('status').filter({hasText:'Checkpoint saved in this browser.'}).waitFor()
 const saved=await page.evaluate(()=>({level:window.testStore.getWorld().outcome.level,turn:window.testStore.getWorld().turn}))
 const committed=await waitForCheckpointReadback(()=>page.evaluate(async expected=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('populous-new-dawn',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  try {const r=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');const v=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return v?.world?.turn===expected.turn&&v.world.outcome.level===expected.level}finally{db.close()}
 },saved),{pause:()=>page.waitForTimeout(100)})
 assert.equal(committed,true)
 await page.reload({waitUntil:'domcontentloaded'});await main.waitFor();await noScene()
 assert.equal(await button('Load Game').getAttribute('aria-disabled'),'false')
 await button('Load Game').click();await bindGame(page)
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),saved.level)
 assert.ok(await page.evaluate(()=>window.testStore.getWorld().turn)>=saved.turn)
 passed('fresh-checkpoint-load-ready')
 await button('Menu').click()
 const paused=await page.evaluate(()=>window.testStore.getWorld().turn)
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.testStore.getWorld().turn),paused)
 await button('Options').click();await button('Select Level').click();await button('Back').click()
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 // A fresh DPR2 document tests real asset decode and pointer CSS under display scaling.
 const high=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:2})
 const hp=await high.newPage();await hp.goto(url,{waitUntil:'networkidle'})
 await hp.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
 await hp.getByRole('button',{name:'Options',exact:true}).hover()
 await hp.screenshot({path:resolve(output,'main-1920x1080-dpr2.png')});await high.close()
 // Block a font atlas: actual text, keyboard and New Game remain usable.
 const fallback=await browser.newContext({viewport:{width:640,height:480}})
 const fp=await fallback.newPage();await fp.route('**/original/frontend/feft33we.png',r=>r.abort('failed'))
 await fp.goto(url,{waitUntil:'networkidle'});const fm=fp.getByRole('dialog',{name:'Main menu',exact:true});await fm.waitFor()
 assert.match(await fm.getByRole('button',{name:'New Game',exact:true}).innerText(),/New Game/)
 await fp.screenshot({path:resolve(output,'font-network-fallback.png')})
 await openCampaignFromMainMenu(fp);await fp.getByRole('dialog',{name:'Start game',exact:true}).waitFor();await fallback.close()
 const unexpected=receipt.errors.filter(e=>!e.includes('Failed to load resource')&&!e.includes('net::ERR_FAILED'))
 assert.deepEqual(unexpected,[])
 return {saved,checks:['native rows/reference positions','four viewport scales','DPR2','unavailable actions','keyboard focus/activation','options persistence/back/Escape','quit browser guidance','campaign Back/Escape','Tutorial and return','no startup scene','real loading failure and retained Retry','fresh-document checkpoint load','pause/selector Back keeps paused','pointer leave and native CSS hotspot','font-fetch failure readable fallback'],limits:['Injected network failure only; no simulated gameplay inputs','Software headless renderer; not hardware performance or native execution pixel parity','Full options/pause restoration and intro movies remain separate']}
}
