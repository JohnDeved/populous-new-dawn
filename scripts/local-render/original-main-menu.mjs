import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

export default async function({page,browser,url,root,output,receipt}) {
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
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
 await button('Options').focus();await page.keyboard.press('Enter')
 await page.getByRole('region',{name:'Options',exact:true}).waitFor()
 await page.getByRole('slider',{name:'Master volume'}).fill('0.2')
 await page.keyboard.press('Escape')
 assert.equal(await button('Options').evaluate(b=>b===document.activeElement),true)
 await button('Options').click();assert.equal(await page.getByRole('slider',{name:'Master volume'}).inputValue(),'0.2');await button('Back').click()
 await button('Quit').click();await page.getByText('You can close this browser tab to quit.',{exact:false}).waitFor();await button('Back').click();await noScene()
 for(const exit of ['Back','Escape']) {
  await button('New Game').click();await page.getByRole('dialog',{name:'Start game',exact:true}).waitFor()
  if(exit==='Back')await button('Back').click();else await page.keyboard.press('Escape')
  await main.waitFor();await noScene()
 }
 await page.mouse.move(-5,-5)
 assert.equal(await main.isVisible(),true)
 assert.match(await main.evaluate(el=>getComputedStyle(el).cursor),/pointer\.png.*0 0/)
 await button('Tutorial').click();await bindGame(page)
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),79)
 await page.getByRole('button',{name:'Game settings',exact:true}).click()
 await button('Quit to Main Menu').click();await main.waitFor();await noScene()
 // Force one real network failure, then use the retained request's Retry button.
 await page.route('**/original/landscape.bin',route=>route.abort('failed'))
 await button('New Game').click();await button('Start Mission 1').click()
 await page.getByRole('heading',{name:'Loading failed',exact:true}).waitFor()
 const stopped=await page.evaluate(()=>{
  let f=document.querySelector('main')[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))]
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.getWorld){window.menuTestStore=h.memoizedState;return h.memoizedState.getWorld().turn}
 })
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.menuTestStore.getWorld().turn),stopped)
 await page.unroute('**/original/landscape.bin');await button('Try again').click();await bindGame(page)
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 const skip=page.locator('.skip-introduction');if(await skip.isVisible())await skip.click()
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await button('Game settings').click();await button('Save checkpoint').click()
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Load checkpoint'&&!b.disabled))
 const saved=await page.evaluate(()=>({level:window.testStore.getWorld().outcome.level,turn:window.testStore.getWorld().turn}))
 await page.reload({waitUntil:'domcontentloaded'});await main.waitFor();await noScene()
 assert.equal(await button('Load Game').getAttribute('aria-disabled'),'false')
 await button('Load Game').click();await bindGame(page)
 assert.equal(await page.evaluate(()=>window.testStore.getWorld().outcome.level),saved.level)
 assert.ok(await page.evaluate(()=>window.testStore.getWorld().turn)>=saved.turn)
 await button('Game settings').click()
 const paused=await page.evaluate(()=>window.testStore.getWorld().turn)
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.testStore.getWorld().turn),paused)
 await button('Select Level').click();await button('Back').click()
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
 await fm.getByRole('button',{name:'New Game',exact:true}).click();await fp.getByRole('dialog',{name:'Start game',exact:true}).waitFor();await fallback.close()
 const unexpected=receipt.errors.filter(e=>!e.includes('Failed to load resource')&&!e.includes('net::ERR_FAILED'))
 assert.deepEqual(unexpected,[])
 return {saved,checks:['native rows/reference positions','four viewport scales','DPR2','unavailable actions','keyboard focus/activation','options persistence/back/Escape','quit browser guidance','campaign Back/Escape','Tutorial and return','no startup scene','real loading failure and retained Retry','fresh-document checkpoint load','pause/selector Back keeps paused','pointer leave and native CSS hotspot','font-fetch failure readable fallback'],limits:['Injected network failure only; no simulated gameplay inputs','Software headless renderer; not hardware performance or native execution pixel parity','Full options/pause restoration and intro movies remain separate']}
}
