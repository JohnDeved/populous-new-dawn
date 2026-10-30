import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
export default async function({page,root,output,receipt}) {
 const button=name=>page.getByRole('button',{name,exact:true})
 const options=page.locator('[data-original-options]')
 const failure=process.env.PND_OPTIONS_FAILURE??'storage'
 await page.setViewportSize({width:640,height:480})
 let aborted=0
 if(failure==='art')await page.route('**/original/options/frontend-1.png',route=>{aborted++;return route.abort('failed')})
 await button('Options').click();await button('Sound').click()
 if(failure==='art') {
  await page.waitForTimeout(100);assert.ok(aborted>0);assert.equal(await options.getAttribute('data-art-ready'),'false')
  assert.equal(await page.getByRole('heading',{name:'Sound',exact:true}).innerText(),'Sound')
 } else if(failure==='storage') {
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='populous-audio-preferences')throw new DOMException('Blocked for test','SecurityError');return original.call(this,key,value)}})
 }
 const master=page.getByRole('slider',{name:'Master volume',exact:true});await master.focus();await page.keyboard.press('End');assert.equal(await master.inputValue(),'1')
 if(failure==='storage') {
  const notice=page.getByRole('status').filter({hasText:'browser storage is unavailable'});await notice.waitFor()
  const text=await notice.boundingBox(),navigation=await button('Game').boundingBox();assert.ok(text.y+text.height<navigation.y);assert.equal(await button('Browser compatibility and help').count(),0)
 }
 await page.screenshot({path:resolve(output,`frontend-${failure}-640x480.png`)})
 await page.keyboard.press('Escape');assert.equal(await button('Options').evaluate(b=>b===document.activeElement),true)
 if(failure==='audio') {
  await page.setViewportSize({width:1280,height:960})
  const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
  await button('Tutorial').click();await bindGame(page)
  const wasPaused=await page.evaluate(()=>window.testStore.getWorld().paused)
  await button('Menu').click();await button('Options').click();await button('Browser compatibility and help').click()
  await page.evaluate(()=>{window.resumeForOptions=AudioContext.prototype.resume;AudioContext.prototype.resume=function(){return Promise.reject(new DOMException('Audio blocked for test','NotAllowedError'))}})
  await button('♫ Enable sound').click();await page.getByRole('status').filter({hasText:'Audio could not start.'}).waitFor();await page.getByRole('status').filter({hasText:'Audio could not start.'}).scrollIntoViewIfNeeded()
  assert.equal(await button('♫ Enable sound').isEnabled(),true)
  assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
  await page.screenshot({path:resolve(output,'ingame-audio-failure.png')})
  await page.evaluate(()=>{AudioContext.prototype.resume=window.resumeForOptions})
  await button('♫ Enable sound').click();await button('♪ Sound on').waitFor()
  await page.evaluate(()=>document.activeElement?.blur())
  const frozen=await page.evaluate(()=>JSON.stringify(window.testStore.getWorld()));await page.keyboard.press('h');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>JSON.stringify(window.testStore.getWorld())),frozen)
  await page.keyboard.press('Escape');assert.equal(await options.getAttribute('data-category'),'Game')
  assert.equal(await button('Browser compatibility and help').evaluate(b=>b===document.activeElement),true)
  await page.keyboard.press('Escape');assert.equal(await button('Options').evaluate(b=>b===document.activeElement),true)
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-original-pause-menu]').count(),0);assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),wasPaused)
 }
 assert.deepEqual(receipt.errors.filter(error=>failure==='art'&&error.includes('Failed to load resource: net::ERR_FAILED')?false:true),[])
 return {checks:[`${failure} failure retains visible usable controls, session state and focus`,...(failure==='audio'?['real audio startup retry after injected resume rejection']:[])],limits:['Explicit browser boundary failure injection; no native runtime or hardware performance claim']}
}
