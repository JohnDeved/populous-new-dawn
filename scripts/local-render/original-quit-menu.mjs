import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'

// Actual production Home. Failure tests abort real asset requests; storage test
// invokes the real observed store save API only to prepare a session-only checkpoint.
// That supplemental setup does not claim the in-game Save UI was exercised.
export default async function({page,context,browser,url,output,receipt}) {
 const results=[]
 const main=()=>page.getByRole('dialog',{name:'Main menu',exact:true})
 const button=name=>main().getByRole('button',{name,exact:true})
 const quit=()=>page.locator('[data-original-quit-menu]')
 const guidance=()=>page.locator('#frontend-quit-guidance')
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 const record=(name,details)=>{results.push({name,details});writeFileSync(resolve(output,'progress.json'),JSON.stringify(results,null,2)+'\n')}
 const capture=async name=>{await settle();await page.screenshot({path:resolve(output,name+'.png')})}
 const state=()=>page.evaluate(()=>({url:location.href,history:history.length,storage:Object.fromEntries(Object.entries(localStorage)),scenes:document.querySelectorAll('.world-viewport canvas').length,writes:globalThis.__quitWrites??null}))
 const open=async()=>{await button('Quit').focus();await page.keyboard.press('Enter');await quit().waitFor();await page.waitForFunction(()=>document.activeElement?.matches('[data-original-quit-menu] [data-panel-back]'));await settle()}
 const assertMain=async()=>{await button('Quit').waitFor();assert.equal(await button('Quit').evaluate(el=>el===document.activeElement),true)}
 const layout=()=>quit().evaluate(el=>{
  const frame=el.parentElement,canvas=frame.querySelector('canvas'),bounds=canvas.getBoundingClientRect(),scale=bounds.width/640
  const map=e=>{const b=e.getBoundingClientRect();return{x:(b.x-bounds.x)/scale,y:(b.y-bounds.y)/scale,width:b.width/scale,height:b.height/scale,screen:b.toJSON(),text:e.innerText}}
  const title=el.querySelector('h2'),guide=el.querySelector('p')
  return{viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},frame:bounds.toJSON(),scale,question:map(title),questionFont:title.querySelector('i')?.style.backgroundImage??'fallback',buttons:[...el.querySelectorAll('button')].map(b=>({label:b.getAttribute('aria-label'),disabled:b.disabled,ariaDisabled:b.getAttribute('aria-disabled'),buttonOpacity:getComputedStyle(b).opacity,labelOpacity:getComputedStyle(b.querySelector('span')).opacity,...map(b),font:b.querySelector('i')?.style.backgroundImage??'fallback',glyph:b.querySelector('span')?map(b.querySelector('span')):null})),guidance:map(guide),panelBorder:getComputedStyle(el).borderWidth,panelBackground:getComputedStyle(el).backgroundColor,active:document.activeElement?.getAttribute('aria-label')}
 })
 const checkLayout=l=>{
  assert.equal(l.question.y,159);assert.equal(l.question.x,0);assert.equal(l.question.width,640)
  assert.deepEqual(l.buttons.map(b=>[b.label,b.y,b.disabled]),[['Yes',189,true],['No',219,false],['Back',454,false]])
  assert.equal(l.buttons[0].buttonOpacity,'1');assert.equal(l.buttons[0].labelOpacity,'0.5');assert.equal(l.panelBorder,'0px');assert.equal(l.panelBackground,'rgba(0, 0, 0, 0)')
  assert.ok(l.guidance.y>=245);assert.ok(l.guidance.y+l.guidance.height<454)
  for(const b of l.buttons){assert.ok(b.screen.x>=0&&b.screen.y>=0);assert.ok(b.screen.x+b.screen.width<=l.viewport.width+.01);assert.ok(b.screen.y+b.screen.height<=l.viewport.height+.01)}
 }
 await main().waitFor()
 await page.waitForFunction(()=>document.querySelector('[data-original-main-menu] nav button i'))
 await page.evaluate(()=>{globalThis.__quitWrites=0;for(const [proto,name]of [[IDBObjectStore.prototype,'put'],[Storage.prototype,'setItem']]){const original=proto[name];proto[name]=function(...args){globalThis.__quitWrites++;return original.apply(this,args)}}})
 const start=await state(),layouts=[]
 for(const [width,height]of [[640,480],[1280,960],[1920,1080],[3440,1440],[900,360]]){
  await page.setViewportSize({width,height});await open()
  await page.waitForFunction(()=>document.querySelector('#frontend-quit-question i')?.style.backgroundImage.includes('felo33we'))
  assert.equal(await button('Back').evaluate(el=>el===document.activeElement),true)
  assert.equal(await button('Yes').isDisabled(),true)
  assert.match(await guidance().innerText(),/Yes is unavailable in this browser\. Close this browser tab to quit\. Only checkpoints successfully saved to browser storage will remain after closing it\./)
  const l=await layout();checkLayout(l);assert.match(l.questionFont,/felo33we/);layouts.push(l)
  await capture(`quit-after-${width}x${height}`)
  await button('Back').click();await assertMain()
 }
 record('native geometry and actual Home captures',layouts)
 await page.setViewportSize({width:1920,height:1080});const cdp=await context.newCDPSession(page)
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:2,mobile:false});await open();assert.equal(await page.evaluate(()=>devicePixelRatio),2)
 const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false}),png=Buffer.from(shot.data,'base64');assert.equal(png.readUInt32BE(16),3840);assert.equal(png.readUInt32BE(20),2160);writeFileSync(resolve(output,'quit-after-1920x1080-dpr2.png'),png)
 await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach();await page.keyboard.press('Escape');await assertMain();record('actual DPR2',true)
 await page.setViewportSize({width:640,height:480});await open();const before=await state()
 const yes=button('Yes'),box=await yes.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await quit().waitFor()
 await yes.evaluate(el=>{el.click();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));el.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));el.focus()})
 assert.equal(await yes.evaluate(el=>el===document.activeElement),false);assert.deepEqual(await state(),before);await quit().waitFor()
 await button('Back').focus();await page.keyboard.press('Shift+Tab');assert.equal(await button('No').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await button('Back').evaluate(el=>el===document.activeElement),true)
 await page.keyboard.press('Space');await assertMain();record('unavailable Yes inert; actual Tab skips it; Space activates Back',true)
 for(const method of ['pointer No','keyboard No','keyboard Back','Escape','Escape']){
  await open();record('begin cancel '+method,{active:await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'))})
  if(method==='pointer No')await button('No').click()
  else if(method==='keyboard No'){await button('No').focus();await page.keyboard.press('Enter')}
  else if(method==='keyboard Back')await page.keyboard.press('Enter')
  else await page.keyboard.press('Escape')
  await assertMain();record('finished cancel '+method,true)
 }
 assert.deepEqual(await state(),start);record('No Back Escape repeat and no storage/navigation/world mutations',true)
 await open();const canvas=main().locator('canvas'),digest=()=>canvas.evaluate(c=>c.toDataURL())
 const keyboard=await digest();await page.waitForTimeout(240);assert.equal(await digest(),keyboard)
 await page.mouse.move(320,231);await page.mouse.move(319,230);const pointer=await digest();await page.waitForTimeout(240);assert.notEqual(await digest(),pointer)
 await page.mouse.move(-5,-5);const left=await digest();await page.waitForTimeout(240);assert.equal(await digest(),left)
 await button('No').focus();await page.keyboard.press('Tab');const again=await digest();await page.waitForTimeout(240);assert.equal(await digest(),again)
 await button('No').hover();assert.match(await button('No').locator('i').first().evaluate(el=>el.style.backgroundImage),/fehi33we/)
 await capture('quit-after-no-highlight');await page.keyboard.press('Escape');record('pointer glow and actual highlight ownership',true)
 await button('Options').click();await main().getByRole('region',{name:'Options',exact:true}).waitFor();await button('Sound').click();await page.getByRole('slider',{name:'Master volume'}).waitFor();await button('Back').click();assert.equal(await button('Options').evaluate(el=>el===document.activeElement),true);await open();await page.keyboard.press('Escape');await assertMain();record('Options Sound return followed by Quit reentry',true)
 await context.close()
 // Separate browser contexts guarantee each real missing request is attempted.
 const fallback=[]
 for(const file of ['felo33we.png','feft33we.png','fehi33we.png','composition.bin']){
  context=await browser.newContext({viewport:{width:640,height:480}});page=await context.newPage();page.setDefaultTimeout(25000);let aborted=0
  page.on('pageerror',error=>receipt.errors.push(String(error)))
  await page.route(`**/original/frontend/${file}`,route=>{aborted++;return route.abort('failed')})
  await page.goto(url,{waitUntil:'networkidle'});await main().waitFor();await open();assert.ok(aborted>0)
  const l=await layout();checkLayout(l)
  if(file==='felo33we.png'){assert.equal(l.questionFont,'fallback');assert.equal(await page.locator('#frontend-quit-question').innerText(),'Quit?');assert.match(l.buttons[1].font,/feft33we/)}
  else if(file!=='composition.bin'){assert.equal(l.buttons[1].font,'fallback');assert.match(l.questionFont,/felo33we/);assert.equal(await button('Back').innerText(),'Back')}
  else{assert.match(l.questionFont,/felo33we/);assert.equal(await main().locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,1,1).data[3]),0)}
  await capture(`quit-fallback-${file.replace('.','-')}-640x480`)
  if(file==='feft33we.png'||file==='fehi33we.png'){
   await page.setViewportSize({width:900,height:360});await settle();await capture(`quit-fallback-${file.replace('.','-')}-900x360`)
   const b=await button('Back').boundingBox();assert.ok(b.y+b.height<=360+.01)
   const reachable=await button('Back').evaluate(el=>{const r=el.getBoundingClientRect();const at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return at===el||el.contains(at)});assert.equal(reachable,true)
  }
  await page.keyboard.press('Enter');await assertMain();await open();await button('No').focus();await page.keyboard.press('Space');await assertMain()
  fallback.push({file,aborted,layout:l});await context.close()
 }
 record('real asset fetch failures retain readable reachable controls',fallback)
 context=await browser.newContext({viewport:{width:640,height:480},reducedMotion:'reduce'});page=await context.newPage();await page.goto(url);await main().waitFor();await open();await page.mouse.move(319,230);await settle();const reduced=await main().locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(240);assert.equal(await main().locator('canvas').evaluate(c=>c.toDataURL()),reduced);await capture('quit-reduced-motion');await page.keyboard.press('Escape');await assertMain();await context.close();record('reduced motion static glow and cancel',true)
 // Real store, actual failed IndexedDB open, no fake checkpoint success result.
 context=await browser.newContext({viewport:{width:640,height:480}})
 await context.addInitScript(()=>{globalThis.__quitBlockedOpens=0;IDBFactory.prototype.open=function(){globalThis.__quitBlockedOpens++;throw new DOMException('Controlled test storage failure','SecurityError')}})
 page=await context.newPage();page.on('pageerror',error=>receipt.errors.push(String(error)));await page.goto(url);await main().waitFor()
 const saved=await page.evaluate(async()=>{let fiber=document.querySelector('main')?.[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))];let store;for(;fiber;fiber=fiber.return){for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.getWorld&&hook.memoizedState?.saveCheckpoint)store=hook.memoizedState;if(store)break}if(!store)throw Error('Actual Home store not found');const persisted=await store.saveCheckpoint();return{persisted,available:store.hasCheckpoint(),blockedOpens:globalThis.__quitBlockedOpens}})
 assert.equal(saved.persisted,false);assert.equal(saved.available,true);assert.ok(saved.blockedOpens>=2)
 assert.equal(await button('Load Game').getAttribute('aria-disabled'),'false')
 await open();assert.match(await guidance().innerText(),/Only checkpoints successfully saved to browser storage/);assert.doesNotMatch(await guidance().innerText(),/Your saved checkpoint will remain/);await capture('quit-session-only-storage-failure')
 const openCount=await page.evaluate(()=>globalThis.__quitBlockedOpens);await button('No').click();await assertMain();assert.equal(await button('Load Game').getAttribute('aria-disabled'),'false');assert.equal(await page.evaluate(()=>globalThis.__quitBlockedOpens),openCount)
 record('session-only checkpoint truthful copy', {...saved,limit:'State prepared by invoking the real observed store.saveCheckpoint API; not shipped in-game Save UI coverage'})
 await context.close();assert.deepEqual(receipt.errors,[])
 return {checks:results,limits:['Actual production Home via plain React entry; no Vinext/Cloudflare/RSC serving/hydration claim','Original menu data/layout fidelity, not native runtime screenshot or native exit-semantics equivalence','Software headless browser; no hardware frame performance claim','Session-only checkpoint case uses a clearly labeled real-store API setup, not the in-game Save interface']}
}
