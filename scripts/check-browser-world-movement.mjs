import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 for(const viewport of [{width:1440,height:1000},{width:3440,height:1440}]) {
  await page.setViewportSize(viewport)
  for(const [from,to] of [[{x:44,z:8},{x:55,z:8}],[{x:125,z:8},{x:-120,z:8}],[{x:8,z:125},{x:8,z:-120}]]) {
   await page.evaluate(async({from})=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts'),terrain=await import('/app/native-terrain.ts')
    cancelAnimationFrame(s.frame)
    const version=w.terrainVersion+1;Object.assign(w,m.createWorld());w.terrainVersion=version
    w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0;w.speed=0
    w.terrain.fill(3);w.land.heights.fill(135)
    terrain.queueTerrain(w.land,0,64,1,{surface(){},globe(){}});terrain.updateWalkMasks(w.land,0,64);w.landVersion=w.terrainVersion
    for(let i=0;i<6;i++)m.addUnit(w,'blue','brave',from)
    w.selected=w.units.map(u=>u.id);s.focus(from);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   },{from})
   const point=await page.evaluate(to=>{const s=window.testScene,p=s.screen(to),r=s.container.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}},to)
   await page.mouse.click(point.x,point.y)
   const result=await page.evaluate(async to=>{
    const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts')
    const accepted=w.buildingOrders.active
    w.speed=1;for(let i=0;i<240;i++)advanceGame(w,s.gameClock,1/12)
    w.paused=true;s.focus(to);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
    return {accepted,orders:w.buildingOrders.active,people:w.units.map(u=>({x:u.x,z:u.z,state:u.native?.state,height:u.native?.h,visible:s.unitMeshes.get(u.id)?.visible,frame:s.unitMeshes.get(u.id)?.userData.frame})),ground:s.y(to)}
   },to)
   assert.equal(result.accepted,1,JSON.stringify({from,to,point,result}))
   assert.equal(result.people.length,6);assert.equal(result.orders,0);assert.equal(result.ground,3)
   const delta=(a,b)=>(((a-b+128)%256+256)%256)-128
   assert.ok(result.people.every(u=>u.state===19&&u.height===135&&u.visible&&Number.isInteger(u.frame)&&Math.abs(delta(u.x,to.x))<4&&Math.abs(delta(u.z,to.z))<4),JSON.stringify(result))
  }
 }
 await page.screenshot({path:'/private/tmp/populous-world-movement.png'})
 assert.deepEqual(errors,[])
 console.log('PASS: actual desktop/ultrawide orders beyond the former crop and across both world seams; native ground height, visible sprites and settled groups')
} finally {await browser.close()}
