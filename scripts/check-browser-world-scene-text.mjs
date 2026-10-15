import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {readFileSync,writeFileSync} from 'node:fs'

// Integrate only after writer's tooltip-owner and art-fallback repairs. No fake clocks/events.
export default async function({page,root,output,receipt}) {
 const art=JSON.parse(readFileSync(resolve(root,'public/original/world-selector/text/runtime.json')))
 const button=name=>page.getByRole('button',{name,exact:true})
 const panel=n=>page.getByRole('button',{name:new RegExp(`^Panel Mission ${n}(, completed)?$`)})
 const tip=id=>page.locator(`[data-native-tooltip="${id}"]`)
 const noTip=async()=>assert.equal(await page.locator('[data-native-tooltip]').count(),0)
 const controls=async()=>{const b=button('Browser controls');if(await b.getAttribute('aria-expanded')==='false')await b.click()}
 const record=(name,value)=>writeFileSync(resolve(output,name),JSON.stringify(value,null,2)+'\n')
 const stages=[]
 const mark=stage=>{stages.push({stage,at:new Date().toISOString()});record('scene-text-stages.json',stages)}
 mark('start')
 await page.setViewportSize({width:800,height:600})
 await button('New Game').click()
 await page.locator('canvas[data-world-scene][data-ready="true"]').waitFor()
 mark('selector ready; checking title geometry/cursors')
 const titleFacts=[]
 for(const mission of [1,2,3,1]) {
  await panel(mission).click()
  const expected=art.banks[mission],heading=page.getByRole('heading',{name:expected.title.text,exact:true})
  await heading.waitFor()
  const title=heading.locator('img')
  await title.evaluate(img=>img.decode())
  const state=await title.evaluate(img=>({src:img.getAttribute('src'),natural:[img.naturalWidth,img.naturalHeight],box:img.getBoundingClientRect().toJSON()}))
  assert.equal(state.src,art.baseUrl+expected.title.file)
  assert.deepEqual(state.natural,[expected.title.width,expected.title.height])
  assert.ok(Math.abs(state.box.y-500)<1,'Source y400 scales to viewport y500 at 800x600')
  const cursor=await panel(mission).evaluate(b=>getComputedStyle(b).cursor)
  assert.match(cursor,new RegExp(`cursor-${mission}\\.png["']?\\) 0 0`))
  titleFacts.push({mission,...state,cursor})
 }
 await page.screenshot({path:resolve(output,'scene-native-title-and-panel.png')})
 mark('titles/cursors passed; installing tooltip epoch observer')
 // Record real pointer event epochs and the first DOM insertion of each tooltip.
 await page.evaluate(()=>{
  window.selectorTipEvents=[]
  let id=null,start=0,last=0
  document.addEventListener('pointermove',event=>{
   const value=Number(event.target instanceof Element?event.target.closest('[data-selector-tooltip]')?.dataset.selectorTooltip:NaN)
   const next=[978,979,980].includes(value)?value:null
   last=performance.now();if(next!==id){id=next;start=last}
   window.selectorTipEvents.push({kind:'move',id,start,last})
  },true)
  new MutationObserver(changes=>{
   for(const change of changes)for(const node of change.addedNodes)
    if(node instanceof Element && node.matches('[data-native-tooltip]'))
     window.selectorTipEvents.push({kind:'shown',id:Number(node.dataset.nativeTooltip),at:performance.now(),start,last})
  }).observe(document.body,{subtree:true,childList:true})
 })
 const moveInside=async(locator,dx=0)=>{
  await locator.scrollIntoViewIfNeeded()
  const b=await locator.boundingBox();assert.ok(b)
  await page.mouse.move(b.x+b.width/2+dx,b.y+b.height/2)
 }
 await page.mouse.move(10,10);await noTip()
 mark('testing same-ID >500ms hover')
 await moveInside(panel(1))
 await page.waitForTimeout(250);await noTip()
 await moveInside(panel(1),2)
 await tip(979).waitFor();await tip(979).evaluate(img=>img.decode())
 let events=await page.evaluate(()=>window.selectorTipEvents)
 const first=events.find(e=>e.kind==='shown'&&e.id===979)
 assert.ok(first && first.at-first.start>500,JSON.stringify(first))
 assert.ok(first.last-first.start>=200 && first.at-first.last<500,'Same-ID pointer movement must retain the original hover start')
 await page.screenshot({path:resolve(output,'scene-tooltip-unconquered.png')})
 mark('same-ID passed; testing changed-ID reset')
 await moveInside(button('Start Mission 1'))
 await noTip();await page.waitForTimeout(250);await noTip()
 await tip(978).waitFor()
 events=await page.evaluate(()=>window.selectorTipEvents)
 const launch=events.find(e=>e.kind==='shown'&&e.id===978)
 assert.ok(launch && launch.at-launch.start>500,'Changed tooltip ID restarts delay')
 await page.screenshot({path:resolve(output,'scene-tooltip-start.png')})
 mark('ID reset passed; keyboard locked selection')
 // Keyboard-driven locked selection without pointer movement must clear old978.
 await button('Browser controls').focus();await page.keyboard.press('Enter')
 const inspect=page.getByRole('combobox',{name:'Inspect campaign world',exact:true})
 await inspect.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter')
 await button('Start Mission 2').waitFor();assert.equal(await button('Start Mission 2').isDisabled(),true)
 await noTip()
 mark('locked selection cleared tooltip; resize/scroll/leave/unmount')
 // Close the compatibility surface by keyboard, restore mission1, and test resize clear.
 await button('Browser controls').focus();await page.keyboard.press('Enter')
 await panel(1).focus();await page.keyboard.press('Enter')
 await moveInside(button('Start Mission 1'));await tip(978).waitFor()
 await page.setViewportSize({width:801,height:600});await noTip()
 await moveInside(button('Start Mission 1'));await tip(978).waitFor()
 mark('resize passed; actual short-height scroll')
 await page.setViewportSize({width:800,height:400})
 await moveInside(button('Start Mission 1'));await tip(978).waitFor()
 const scrolled=await page.getByRole('dialog',{name:'Start game',exact:true}).evaluate(el=>{const before=el.scrollTop;el.scrollTop=before>0?0:40;return {before,after:el.scrollTop}})
 assert.notEqual(scrolled.after,scrolled.before,'Scroll-clear test must cause actual scrolling')
 await page.waitForTimeout(50);await noTip()
 await page.setViewportSize({width:800,height:600})
 await moveInside(button('Start Mission 1'));await tip(978).waitFor()
 await page.mouse.move(-5,-5);await noTip()
 await moveInside(button('Start Mission 1'));await tip(978).waitFor()
 await page.keyboard.press('Escape');await noTip()
 await button('New Game').click();await noTip()
 mark('resize/scroll/leave/unmount passed; title fallback')
 // A valid title network failure falls back to its same accessible/text label.
 await page.route('**/original/world-selector/text/title-2.png',r=>r.abort('failed'))
 await panel(2).click()
 const fallbackTitle=page.getByRole('heading',{name:art.banks[2].title.text,exact:true})
 await page.waitForFunction(text=>Array.from(document.querySelectorAll('h3')).some(h=>h.textContent===text&&!h.querySelector('img')),art.banks[2].title.text)
 assert.equal(await fallbackTitle.innerText(),art.banks[2].title.text)
 await page.screenshot({path:resolve(output,'scene-title-fallback.png')})
 await page.unroute('**/original/world-selector/text/title-2.png')
 mark('title fallback passed; panel numeral fallback')
 // Panel labels become visibly numbered only while art is absent.
 await page.keyboard.press('Escape')
 await page.route('**/original/world-selector/panel/*.png',r=>r.abort('failed'))
 await button('New Game').click()
 for(const mission of [1,2,3]) {
  await panel(mission).waitFor();await page.waitForFunction(n=>Array.from(document.querySelectorAll('button')).some(b=>b.getAttribute('aria-label')===`Panel Mission ${n}`&&b.innerText.includes(String(n))),mission)
 }
 await panel(2).click();assert.equal(await button('Start Mission 2').isDisabled(),true)
 await page.screenshot({path:resolve(output,'scene-panel-numeral-fallback.png')})
 await page.unroute('**/original/world-selector/panel/*.png')
 mark('panel fallback passed')
 record('scene-text-facts.json',{titleFacts,events})
 assert.deepEqual(receipt.errors.filter(e=>e!=='Failed to load resource: net::ERR_FAILED'),[])
 return {checks:['selected bitmap title source geometry','computed native cursor URL/hotspot','strict >500ms tooltip delay','same-ID move preserves hover epoch','ID change resets epoch','keyboard locked selection clears stale launch tooltip','resize/actual capture-scroll/leave/unmount clear','title text fallback','visible fallback panel numerals'],titleFacts,events,limits:['Browser behavior and source bitmap geometry, not original runtime pixel identity','Browser screenshot omits actual OS pointer; cursor is verified by computed CSS URL/hotspot','Wall-clock event timing observed without synthetic timers or pointer events']}
}
