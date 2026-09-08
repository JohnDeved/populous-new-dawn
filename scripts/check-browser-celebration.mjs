// Start npm run dev, then: node scripts/check-browser-celebration.mjs
// Optional POPULOUS_URL selects another already-running local preview.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import sprites from '../app/original-units.json' with {type:'json'};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{
  let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next){if(h.memoizedState?.getWorld)window.testStore=h.memoizedState;if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;}
  const w=window.testStore.getWorld();w.units=w.units.filter(u=>u.team==='blue');w.units.find(u=>u.kind==='brave').kind='warrior';w.turn=31;w.pendingTime=0;w.paused=false;w.speed=1;w.ai.variables[57]=1;w.flyby.flags=0;w.inputMask=0;
  window.initialPeople=w.units.map(u=>({id:u.id,x:u.x,z:u.z}));window.testScene.focus({x:9,z:33});
 });
 await page.waitForFunction(()=>window.testStore.getWorld().units.every(u=>u.native?.state===41));
 await page.waitForTimeout(2000);
 const snapshot=await page.evaluate(()=>{
  const w=window.testStore.getWorld();w.paused=true;
  return {status:w.status,units:w.units.map(u=>({id:u.id,x:u.x,z:u.z,kind:u.kind,p:u.native})),initial:window.initialPeople};
 });
 assert.equal(snapshot.status,'won');assert.ok(snapshot.units.filter(u=>u.kind!=='shaman').some(u=>{const p=snapshot.initial.find(p=>p.id===u.id);return p.x!==u.x||p.z!==u.z;}));
 assert.equal(snapshot.units.find(u=>u.kind==='shaman').p.substate,8);
 await page.waitForTimeout(100);
 const rendered=await page.evaluate(()=>window.testStore.getWorld().units.map(u=>({kind:u.kind,object:u.native.object,f2:u.native.f2,frame:window.testScene.unitMeshes.get(u.id).userData.frame})));
 for(const r of rendered){const dirs=Object.values(sprites.animations[`blue-${r.kind}`]).find(d=>d[0].source===r.object);assert.ok(dirs);assert.ok(dirs.some(d=>d.frames[r.f2%d.frames.length]===r.frame));}
 const paused=await page.evaluate(()=>window.testStore.getWorld().units.map(u=>[u.native.f1,u.native.f2]));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>window.testStore.getWorld().units.map(u=>[u.native.f1,u.native.f2])),paused);
 // Place the six followers into native circle substates to exercise the
 // circle->chain transition and frame freezes without waiting on random joins.
 await page.evaluate(()=>{
  const w=window.testStore.getWorld(),braves=w.units.filter(u=>u.kind!=='shaman');
  for(let i=0;i<braves.length;i++){
   const u=braves[i],p=u.native;p.x=3840;p.y=55040;p.h=100;p.anchorX=p.x;p.anchorY=p.y;u.x=7;u.z=33;
   p.substate=i?4:3;p.flags2=0x40000000;p.link=0;p.target=0;p.speed=0;
  }
  w.paused=false;window.observedPhases=[];
  window.phaseWatcher=setInterval(()=>{const w=window.testStore.getWorld();window.observedPhases.push(...w.units.map(u=>u.native.substate));},10);
 });
 await page.waitForFunction(()=>window.observedPhases.includes(5)&&window.observedPhases.includes(6),{},{timeout:10000});
 await page.waitForTimeout(1300);
 await page.evaluate(()=>{clearInterval(window.phaseWatcher);});
 await page.waitForFunction(()=>!window.testStore.getWorld().outcome.cameraPlaying);
 await page.waitForSelector('.end-screen button');await page.locator('.end-screen button').click();
 await page.waitForFunction(()=>window.testStore.getWorld().status==='playing');
 assert.ok(await page.evaluate(()=>window.testStore.getWorld().units.every(u=>u.native===null)));
 assert.deepEqual(errors,[]);
 console.log('PASS: live victory handoff, movement, original atlas frames, pause, circles, chains and restart; no page errors');
}finally{await browser.close();}
