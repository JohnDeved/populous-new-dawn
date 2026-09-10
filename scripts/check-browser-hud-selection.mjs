import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try{
 const {page,errors}=await openGame(browser)
 const brave=page.getByRole('button',{name:'Select brave',exact:true})
 const total=page.getByRole('button',{name:'Select follower',exact:true})
 const selected=()=>page.evaluate(()=>window.testScene.world.selected)
 for(const [width,height] of [[1440,1000],[3440,1440],[1920,1080]]){
  await page.setViewportSize({width,height})
  const initial=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   w.speed=0;w.paused=false;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.selected=[]
   w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=0
   for(let i=0;i<9;i++)m.addUnit(w,'blue',i===8?'shaman':i===7?'warrior':'brave',{x:i*.7,z:8})
   s.hudFocus.fill(0);s.focus({x:0,z:8});s.onChange()
   return {units:JSON.stringify(w.units),ids:w.units.map(u=>u.id)}
  })
  await brave.dispatchEvent('pointerup',{button:0,ctrlKey:true});assert.deepEqual(await selected(),[],'release without a press must not select')
  await brave.dispatchEvent('pointerdown',{button:0,ctrlKey:true});await brave.dispatchEvent('pointercancel');await brave.dispatchEvent('pointerup',{button:0,ctrlKey:true});assert.deepEqual(await selected(),[],'cancelled press must not select')
  await brave.click();assert.equal((await selected()).length,1)
  await brave.click();assert.equal((await selected()).length,2,'repeated ordinary click adds the next follower')
  await brave.click({modifiers:['Control']});assert.equal((await selected()).length,7)
  await total.click({modifiers:['Shift','Control']});assert.deepEqual(await selected(),initial.ids.slice(0,8),'Shift takes precedence; total excludes shaman')
  assert.equal(await page.evaluate(()=>JSON.stringify(window.testScene.world.units)),initial.units,'HUD must not create simulation owners')
  await page.keyboard.press('Escape');assert.deepEqual(await selected(),[])
  await brave.click({modifiers:['Control']});assert.equal((await selected()).length,5)
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.testScene.world.paused),true,'Ctrl mouse selection returns keyboard focus to the game');await page.keyboard.press('Space')
  await brave.dispatchEvent('click',{button:0,ctrlKey:true,detail:1});assert.equal((await selected()).length,5,'Windows-style click after pointer release must not add five twice')
  await brave.click({modifiers:['Shift']});assert.equal((await selected()).length,7)
  const focused=[]
  for(let i=0;i<8;i++){
   await brave.click({button:'right'})
   const state=await page.evaluate(()=>{const s=window.testScene;return{id:s.hudFocus[2],inspected:s.objectPanels.inspected,panels:[...s.objectPanels.panels.keys()],selected:s.world.selected}})
   focused.push(state.id);assert.ok(state.panels.includes(state.id));assert.equal(state.selected.length,7)
  }
  assert.equal(new Set(focused.slice(0,7)).size,7);assert.equal(focused[0],focused[7],'right-click cycles and wraps')
  await page.getByRole('button',{name:'followers',exact:true}).click()
  await page.getByRole('button',{name:'Select shaman',exact:true}).click({modifiers:['Control']})
  assert.equal((await selected()).length,8,'Ctrl does not turn shaman selection into a five-person search')
  await page.getByRole('button',{name:'Select shaman',exact:true}).click({button:'right'})
  assert.equal(await page.evaluate(()=>window.testScene.hudFocus[7]),initial.ids[8])
  await page.keyboard.press('Escape');assert.deepEqual(await selected(),[])
  await brave.focus();await page.keyboard.press('Enter');assert.equal((await selected()).length,1,'native keyboard button activation remains accessible')
  await page.keyboard.press('Escape');assert.deepEqual(await selected(),[])
  await page.evaluate(()=>{window.testScene.world.paused=true})
  await brave.click();assert.equal((await selected()).length,1,'pause does not disable selection')
  await page.evaluate(()=>{window.testScene.world.manaWorld.gameFlags|=32})
  await total.click({modifiers:['Shift']});assert.equal((await selected()).length,1,'native game input flag gates HUD commands')
  await page.evaluate(()=>{const s=window.testScene;s.world.manaWorld.gameFlags&=~32;s.world.paused=false})
  // Actual movement owner retains its orders when adding or focusing followers.
  const orders=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   w.manaWorld.gameFlags=32;w.selected=w.units.map(u=>u.id)
   m.command(w,{x:30,z:8});w.speed=1;for(let i=0;i<30;i++)m.tick(w,1/12);w.speed=0;w.manaWorld.gameFlags=0;w.selected=[];s.onChange()
   return JSON.stringify({orders:w.buildingOrders,people:w.units.map(u=>({id:u.id,path:u.path,commands:u.native?.commands,state:u.native?.state})),rng:w.randomState})
  })
  await brave.click({modifiers:['Control']});assert.equal((await selected()).length,5)
  await brave.click({button:'right'})
  assert.equal(await page.evaluate(()=>{const w=window.testScene.world;return JSON.stringify({orders:w.buildingOrders,people:w.units.map(u=>({id:u.id,path:u.path,commands:u.native?.commands,state:u.native?.state})),rng:w.randomState})}),orders)
 }
 await page.screenshot({path:'/private/tmp/populous-hud-selection-v210.png'})
 assert.deepEqual(errors,[])
 console.log('PASS: actual HUD single/Shift/Ctrl selection, precedence, total/shaman rules, focus cycling/panels, Escape, pause/input gate and marching-order preservation at three desktop sizes')
}finally{await browser.close()}
