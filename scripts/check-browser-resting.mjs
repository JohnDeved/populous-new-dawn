import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  w.speed=0;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.pendingTime=0;w.manaWorld.gameFlags=32
  w.terrain.fill(3);w.terrainVersion++
  for(let i=0;i<12;i++)m.addUnit(w,'blue','brave',{x:0,z:8})
  w.selected=w.units.map(u=>u.id);s.focus({x:6,z:8});s.onChange()
  window.restingModel=m
 })
 const click=async point=>{
  const p=await page.evaluate(point=>{const s=window.testScene,p=s.screen(point),r=s.container.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}},point)
  await page.mouse.click(p.x,p.y,{button:'right'})
 }
 await click({x:10,z:8})
 assert.equal(await page.evaluate(()=>window.testScene.world.units.filter(u=>u.path.length).length),12)
 const view=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts')
  cancelAnimationFrame(s.frame);w.speed=1
  for(let i=0;i<240;i++)advanceGame(w,s.gameClock,1/12)
  w.paused=true;s.focus({x:11,z:7});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const units=w.units.map(u=>{const g=s.unitMeshes.get(u.id);return {id:u.id,x:u.x,z:u.z,state:u.native?.state,shape:u.native?.anchorFlags>>4,slot:u.native?.anchorFlags&15,cell:u.native?.formationCell,visible:g?.visible,frame:g?.userData.frame}})
  return {units,paused:JSON.stringify(w.units)}
 })
 assert.equal(view.units.length,12);assert.ok(view.units.every(u=>u.state===19&&u.visible&&Number.isInteger(u.frame)),JSON.stringify(view.units))
 for(const u of view.units)assert.equal(u.shape,view.units.filter(v=>v.cell===u.cell).length)
 assert.ok(view.units.some(u=>u.shape===6),'a complete six-person ring forms')
 assert.equal(new Set(view.units.map(u=>`${u.cell}:${u.slot}`)).size,12)
 await page.screenshot({path:'/private/tmp/populous-resting-groups.png'})
 const paused=await page.evaluate(async()=>{const s=window.testScene,{advanceGame}=await import('/app/game-clock.ts');advanceGame(s.world,s.gameClock,3);return JSON.stringify(s.world.units)})
 assert.equal(paused,view.paused)
 await page.evaluate(()=>{const w=window.testScene.world;w.selected=[w.units[0].id];w.paused=false;w.speed=0})
 await click({x:22,z:8})
 const result=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts'),u=w.units[0]
  const moving=u.path.length>0&&!(u.native.assignment&1)&&window.restingModel.unitAnimationSource(u)===null
  w.speed=1;for(let i=0;i<240;i++)advanceGame(w,s.gameClock,1/12)
  w.paused=true;s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  return {moving,x:u.x,people:w.units.map(u=>({cell:u.native.formationCell,shape:u.native.anchorFlags>>4})),errors:[]}
 })
 assert.ok(result.moving);assert.ok(result.x>20);assert.ok(result.people.some(u=>u.shape===5));for(const u of result.people)assert.equal(u.shape,result.people.filter(v=>v.cell===u.cell).length)
 assert.deepEqual(errors,[])
 console.log('PASS: actual right-click group order, twelve visible original poses, native ring populations, pause and departure reshaping')
} finally {await browser.close()}
