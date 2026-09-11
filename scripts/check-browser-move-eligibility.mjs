import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 for(const [width,height] of [[1440,1000],[3440,1440]]){
  await page.setViewportSize({width,height})
  await page.waitForFunction(()=>{const s=window.testScene,r=s.container.getBoundingClientRect();return Math.abs(s.camera.aspect-r.width/r.height)<1e-8})
  const points=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   cancelAnimationFrame(s.frame);w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.selected=[]
   w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.speed=0
   for(let i=0;i<8;i++)m.addUnit(w,'blue','brave',{x:-12+i*.25,z:8})
   w.selected=w.units.map(u=>u.id);s.focus({x:5,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   window.orderCues=[];s.onSound=cue=>{window.orderCues.push(cue);return ()=>{}}
   window.orderSnapshot=()=>JSON.stringify({units:w.units,orders:w.buildingOrders,marching:w.marching,effects:w.effects,sounds:w.sounds,random:w.randomState,selected:w.selected,message:w.message})
   const r=s.renderer.domElement.getBoundingClientRect()
   return [{x:5,z:8},{x:14,z:12}].map(point=>{
    const p=s.screen(point),x=r.left+(p.x+1)*r.width/2,y=r.top+(1-p.y)*r.height/2
    const picked=s.pick({clientX:x,clientY:y})
    if(!picked||s.picking.pick({clientX:x,clientY:y}))throw Error('Expected visible unoccupied land')
    const n=m.nativePosition(w,picked),index=((n.y&65535)>>9)*128+((n.x&65535)>>9)
    return {x,y,index,bit:(((n.y>>8)&254)+1)*256+((n.x>>8)&254)+1}
   })
  })
  await page.mouse.click(points[0].x,points[0].y)
  assert.deepEqual(await page.evaluate(()=>window.orderCues),[0x37])
  const before=await page.evaluate(()=>window.orderSnapshot())
  for(const obstruction of ['cell','quarter']){
   await page.evaluate(({point,obstruction})=>{
    const w=window.testScene.world;window.orderCues=[]
    if(obstruction==='cell'){window.previousMask=w.land.flags[point.index];w.land.flags[point.index]|=4}
    else {window.previousMask=w.land.walkMasks[0][point.bit>>3];w.land.walkMasks[0][point.bit>>3]&=~(1<<(point.bit&7))}
   },{point:points[1],obstruction})
   await page.mouse.click(points[1].x,points[1].y)
   assert.deepEqual(await page.evaluate(()=>window.orderCues),[],'blocked clicks cannot acknowledge an order')
   assert.equal(await page.evaluate(()=>window.orderSnapshot()),before,'the group, current orders and marker/audio queues must remain intact')
   await page.evaluate(({point,obstruction})=>{
    const w=window.testScene.world
    if(obstruction==='cell')w.land.flags[point.index]=window.previousMask
    else w.land.walkMasks[0][point.bit>>3]=window.previousMask
   },{point:points[1],obstruction})
  }
  await page.mouse.click(points[1].x,points[1].y)
  assert.deepEqual(await page.evaluate(()=>window.orderCues),[0x37])
  assert.notEqual(await page.evaluate(()=>window.orderSnapshot()),before,'cleared land accepts a new destination')
 }
 assert.deepEqual(errors,[])
 console.log('PASS: real valid/blocked/restored ground clicks preserve group orders and suppress acknowledgement/marker writes at desktop and ultrawide sizes')
} finally {await browser.close()}
