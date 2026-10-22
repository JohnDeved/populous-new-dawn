import { setSoundThroughOptions } from '../browser-options-audio.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
export default async function({page,output,root,receipt}) {
 const progress=[],passed=name=>{progress.push(name);writeFileSync(resolve(output,'progress.json'),JSON.stringify(progress,null,2))}
 const button=name=>page.getByRole('button',{name,exact:true})
 const options=page.locator('[data-original-options]')
 const volume=name=>page.getByRole('slider',{name,exact:true})
 const setVolume=async(name,steps)=>{await volume(name).focus();await page.keyboard.press('Home');for(let i=0;i<steps;i++)await page.keyboard.press('ArrowRight')}
 const category=async name=>{await button(name).click();assert.equal(await options.getAttribute('data-category'),name);assert.equal(await options.locator('[aria-current="page"]').getAttribute('aria-label'),name);assert.equal(await button(name).count(),0)}
 await page.setViewportSize({width:1280,height:960});await button('Options').click();await category('Sound');await setVolume('Master volume',4);await setVolume('Music volume',12);await button('Back').click()
 const {bindGame}=await import(pathToFileURL(resolve(root,'scripts/browser-game.mjs')).href)
 await page.setViewportSize({width:800,height:600});await openCampaignFromMainMenu(page);await button('Start Mission 1').click();await bindGame(page)
 await page.setViewportSize({width:1280,height:960})
 await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
 await skipIntroductionWithSpace(page, { timeout: 45000 })
 await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 await setSoundThroughOptions(page, true)
 await button('Menu').click();await button('Options').click();assert.equal(await button('Back').evaluate(button=>button===document.activeElement),true);await category('Sound')
 assert.equal(await volume('Master volume').inputValue(),'0.2');assert.equal(await volume('Music volume').inputValue(),'0.6')
 assert.equal(await options.getAttribute('data-skin'),'ingame')
 assert.equal(await options.getByRole('heading',{name:'Sound',exact:true}).locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity)),1)
 const normal=await button('Game').locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity));assert.ok(Math.abs(normal-2/3)<0.000001)
 await button('Graphics').focus();assert.equal(await button('Graphics').locator('[aria-hidden="true"]').evaluate(element=>Number(getComputedStyle(element).opacity)),1);await options.getByRole('heading',{name:'Sound',exact:true}).focus()
 assert.equal(await page.locator('.campaign-messages').evaluate(element=>getComputedStyle(element).visibility),'hidden')
 const frozen=()=>page.evaluate(()=>{const w=window.testStore.getWorld(),s=window.testSceneRef.current;return {world:JSON.stringify(w),animation:s.gameClock.animationFrame,time:s.gameClock.animationTime,camera:s.camera.position.toArray()}})
 const before=await frozen();await page.waitForTimeout(400);assert.deepEqual(await frozen(),before)
 await page.evaluate(()=>{const main=document.querySelector('main');let fiber=main[Object.keys(main).find(key=>key.startsWith('__reactFiber'))];for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.buffers instanceof Map&&'randomState' in hook.memoizedState.current)window.optionsAudio=hook.memoizedState.current})
 assert.equal(await page.evaluate(()=>window.optionsAudio.paused),true)
 assert.equal(await page.evaluate(()=>window.optionsAudio.context.state),'suspended')
 await setVolume('Master volume',7);await setVolume('Music volume',9)
 passed('shared-volumes-world-camera-frozen-and-audio-context-suspended')
 assert.equal(await page.evaluate(()=>window.optionsAudio.context.state),'suspended')
 await page.screenshot({path:resolve(output,'ingame-sound-1280x960.png')})
 await category('Game');await button('Browser compatibility and help').click();assert.equal(await page.getByRole('button', { name: /^HUD size : </ }).isVisible(),true)
 for(const label of ['Zoom in','Zoom out','Focus settlement']) assert.equal(await button(label).count(),0)
 assert.equal(await options.locator('.menu-objectives,.help-grid,.help-tip,.reference-details').count(),0)
 assert.deepEqual(await frozen(),before)
 await button('Back to Options').click();assert.equal(await options.getAttribute('data-category'),'Game')
 await page.keyboard.press('Escape');assert.equal(await button('Options').evaluate(b=>b===document.activeElement),true)
 const messageState=await page.evaluate(()=>JSON.stringify(window.testStore.getWorld().messages))
 await button('Continue Game').evaluate(button=>{window.optionsMessageBefore=JSON.stringify(window.testStore.getWorld().messages);button.click();window.optionsMessageAfter=JSON.stringify(window.testStore.getWorld().messages)})
 assert.equal(await page.evaluate(()=>window.optionsMessageBefore),messageState);assert.equal(await page.evaluate(()=>window.optionsMessageAfter),messageState)
 assert.equal(await page.locator('.campaign-messages').evaluate(element=>getComputedStyle(element).visibility),'visible');assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),false)
 await page.waitForFunction(()=>window.optionsAudio.context.state==='running')
 await page.locator('.world-viewport').press('Space');await button('Menu').click();await button('Options').click()
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.testStore.getWorld().paused),true)
 passed('shared-entry-volume-world-camera-freeze-audio-suspend-and-pause-ownership')
 await button('Menu').click();await button('Quit Game').click();await button('Yes').click()
 await button('Options').click();await category('Sound')
 assert.equal(await volume('Master volume').inputValue(),'0.35');assert.equal(await volume('Music volume').inputValue(),'0.45')
 passed('in-game-preferences-return-to-startup')
 assert.deepEqual(receipt.errors,[])
 return {checks:progress,limits:['Headless software rendering; no hardware performance or native runtime pixel parity claim']}
}
