import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {writeFileSync} from 'node:fs'
import {cpus,platform,arch} from 'node:os'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  w.speed=0;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.pendingTime=0;w.manaWorld.gameFlags=32
  w.terrain.fill(3);w.terrainVersion++
  for(let i=0;i<24;i++)m.addUnit(w,'blue','brave',{x:-18+(i%3)*.5,z:8+Math.floor(i/3)*.5})
  w.selected=w.units.map(u=>u.id);s.focus({x:18,z:8});s.onChange()
 })
 const click=async point=>{
  const p=await page.evaluate(point=>{const s=window.testScene,p=s.screen(point),r=s.container.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}},point)
  await page.mouse.click(p.x,p.y)
 }
 await click({x:30,z:8})
 assert.equal(await page.evaluate(()=>window.testScene.world.buildingOrders.active),1)
 const result=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts')
  cancelAnimationFrame(s.frame);w.speed=1
  for(let i=0;i<70;i++)advanceGame(w,s.gameClock,1/12)
  w.paused=true;s.focus(w.units[0]);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  return {members:w.marching.flatMap(g=>g.members.filter(Boolean)),groups:w.marching.map(g=>g.count),units:w.units.map(u=>({x:u.x,z:u.z,object:u.native.object,frame:s.unitMeshes.get(u.id)?.userData.frame,visible:s.unitMeshes.get(u.id)?.visible})),paused:JSON.stringify(w.units)}
 })
 assert.ok(result.groups.length>=2);assert.ok(result.groups.every(n=>n>=2&&n<=11));assert.ok(result.members.length>=20)
 assert.ok(result.units.every(u=>u.visible&&Number.isInteger(u.frame)&&[40,208].includes(u.object)),JSON.stringify(result.units))
 assert.equal(new Set(result.units.map(u=>`${u.x},${u.z}`)).size,24)
 await page.screenshot({path:'/private/tmp/populous-marching-groups.png'})
 const state=await page.evaluate(async()=>{const s=window.testScene,{advanceGame}=await import('/app/game-clock.ts');advanceGame(s.world,s.gameClock,2);return JSON.stringify(s.world.units)})
 assert.equal(state,result.paused)
 await page.evaluate(()=>{const w=window.testScene.world;w.selected=[w.units[0].id];w.paused=false;w.speed=0})
 await click({x:-18,z:12})
 const final=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts')
  const orders=w.buildingOrders.active
  w.speed=1;for(let i=0;i<300;i++)advanceGame(w,s.gameClock,1/12)
  w.paused=true;s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  return {orders,remaining:w.buildingOrders.active,groups:w.marching.length,x:w.units[0].x,states:w.units.map(u=>u.native.state)}
 })
 assert.equal(final.orders,2);assert.equal(final.remaining,0);assert.equal(final.groups,0);assert.ok(final.x<-14);assert.ok(final.states.every(s=>s===19))
 for(const viewport of [{width:1440,height:1000},{width:3440,height:1440}]) {
  await page.setViewportSize(viewport)
  await page.evaluate(async()=>{
   const s=window.testScene,m=await import('/app/model.ts'),w=s.world
   Object.assign(w,m.createWorld())
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0
   w.terrain.fill(3);w.terrainVersion++;w.speed=0
   for(let i=0;i<24;i++)m.addUnit(w,'blue','brave',{x:-25+(i%3)*.5,z:8+Math.floor(i/3)*.5})
   w.selected=w.units.map(u=>u.id);s.focus({x:18,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  })
  await click({x:30,z:8})
  const recovery=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts'),{advanceGame}=await import('/app/game-clock.ts')
   const accepted=w.buildingOrders.active
   if(accepted!==1||w.units.some(u=>!u.native))throw Error(JSON.stringify({accepted,people:w.units.map(u=>({native:!!u.native,target:u.target})),selected:w.selected,input:w.inputMask,status:w.status}))
   m.addBuilding(w,'blue','hut',{x:0,z:8},true)
   w.speed=1;let requests=0,planned=0
   for(let turn=0;turn<504;turn++) {
    const retrying=w.units.filter(u=>u.native.flags2&0x80000000);requests+=retrying.length
    advanceGame(w,s.gameClock,1/12)
    planned+=retrying.filter(u=>u.native.motionGroup).length
   }
   w.paused=true;s.focus({x:30,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   return {accepted,requests,planned,orders:w.buildingOrders.active,routes:w.motionRoutes.active,
    people:w.units.map(u=>({x:u.x,state:u.native.state,visible:s.unitMeshes.get(u.id)?.visible,frame:s.unitMeshes.get(u.id)?.userData.frame}))}
  })
  assert.equal(recovery.accepted,1);assert.ok(recovery.requests>0);assert.equal(recovery.planned,recovery.requests)
  assert.equal(recovery.people.length,24);assert.equal(recovery.orders,0);assert.equal(recovery.routes,0)
  assert.ok(recovery.people.every(u=>u.x>25&&u.state===19&&u.visible&&Number.isInteger(u.frame)))
 }
 if(process.argv.includes('--profile')) {
  await page.evaluate(async()=>{
   const s=window.testScene,m=await import('/app/model.ts'),w=s.world
   Object.assign(w,m.createWorld())
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0
   w.terrain.fill(3);w.terrainVersion++
   for(let i=0;i<200;i++)m.addUnit(w,'blue','brave',{x:-30+(i%20)*.25,z:8+Math.floor(i/20)*.25})
   w.selected=w.units.map(u=>u.id);m.command(w,{x:35,z:8})
   s.focus({x:-20,z:8});s.onChange();s.previous=null
   const animate=s.animate;window.marchingFrames=[]
   s.animate=now=>{const start=performance.now();animate(now);window.marchingFrames.push({time:now,cpu:performance.now()-start,groups:s.world.marching.length})}
   s.animate(performance.now())
  })
  await page.waitForTimeout(5000)
  const data=await page.evaluate(()=>{
   const s=window.testScene,gl=s.renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info')
   cancelAnimationFrame(s.frame)
   return {frames:window.marchingFrames,units:s.world.units.length,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],pixelRatio:devicePixelRatio,renderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}
  })
  assert.equal(data.units,200);assert.ok(data.frames.some(f=>f.groups>0),'profile must include actual marching groups')
  const frames=data.frames.slice(30),quantile=(a,q)=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*q)]
  assert.ok(frames.length>50)
  const gaps=frames.slice(1).map((f,i)=>f.time-frames[i].time),cpu=frames.map(f=>f.cpu)
  const report={date:'2026-09-10',...data,frames:undefined,frameCount:frames.length,cpu:cpus()[0].model,platform:platform(),architecture:arch(),frameGapMs:{p50:quantile(gaps,.5),p95:quantile(gaps,.95)},cpuFrameMs:{p50:quantile(cpu,.5),p95:quantile(cpu,.95)},maxGroups:Math.max(...frames.map(f=>f.groups)),limits:'One five-second headless Chromium sample, excluding the first 30 frames. Full scene with 200 native marching followers on flat terrain at 1440x1000. Diagnostic baseline, not a before/after GPU comparison or cross-hardware FPS certification.'}
  writeFileSync('references/performance/2026-09-10-marching-browser.json',JSON.stringify(report,null,2)+'\n')
  console.log('PROFILE:',JSON.stringify(report))
 }
 assert.deepEqual(errors,[])
 console.log('PASS: real left-click shared movement, marching groups, visible original walking/gesture poses, pause, interruption, obstacle replanning on desktop/ultrawide and resting handoff')
} finally {await browser.close()}
