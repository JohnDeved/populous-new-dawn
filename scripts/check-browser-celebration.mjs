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
  const seen=new Set();let valid=true;
  for(let i=0;i<w.objectCells.heads.length;i++){
   let id=w.objectCells.heads[i],previous=0;
   while(id){const p=w.objectCells.objects.get(id);if(!p||seen.has(id)||p.cellPrevious!==previous||((p.y>>9)*128+(p.x>>9))!==i){valid=false;break;}seen.add(id);previous=id;id=p.cellNext;}
  }
  return {status:w.status,cellIntegrity:valid&&seen.size===w.objectCells.objects.size&&seen.size===w.units.length,units:w.units.map(u=>({id:u.id,x:u.x,z:u.z,kind:u.kind,p:u.native})),initial:window.initialPeople};
 });
 assert.ok(snapshot.cellIntegrity,'rendered live followers retain consistent native cell lists');
 assert.equal(snapshot.status,'won');assert.ok(snapshot.units.filter(u=>u.kind!=='shaman').some(u=>{const p=snapshot.initial.find(p=>p.id===u.id);return p.x!==u.x||p.z!==u.z;}));
 assert.equal(snapshot.units.find(u=>u.kind==='shaman').p.substate,8);
 await page.waitForTimeout(100);
 const rendered=await page.evaluate(()=>window.testStore.getWorld().units.map(u=>({kind:u.kind,object:u.native.object,f2:u.native.f2,frame:window.testScene.unitMeshes.get(u.id).userData.frame})));
 for(const r of rendered){const dirs=Object.values(sprites.animations[`blue-${r.kind}`]).find(d=>d[0].source===r.object);assert.ok(dirs);assert.ok(dirs.some(d=>d.frames[r.f2%d.frames.length]===r.frame));}
 const paused=await page.evaluate(()=>window.testStore.getWorld().units.map(u=>[u.native.f1,u.native.f2]));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>window.testStore.getWorld().units.map(u=>[u.native.f1,u.native.f2])),paused);
 await page.evaluate(()=>{
  const units=window.testStore.getWorld().units.filter(u=>u.kind==='brave'||u.kind==='warrior');
  window.idlePoseBackup=units.map(u=>({id:u.id,object:u.native.object,f2:u.native.f2}));
  for(const u of units){u.native.object=u.kind==='brave'?712:728;u.native.f2=0;}
 });
 await page.waitForTimeout(100);
 const idlePoses=await page.evaluate(()=>window.testStore.getWorld().units.filter(u=>u.kind==='brave'||u.kind==='warrior').map(u=>({kind:u.kind,frame:window.testScene.unitMeshes.get(u.id).userData.frame})));
 for(const pose of idlePoses)assert.ok(sprites.animations[`blue-${pose.kind}`].idleGesture.some(d=>d.frames[0]===pose.frame),'original resting gesture reaches the rendered atlas');
 await page.evaluate(()=>{for(const saved of window.idlePoseBackup){const p=window.testStore.getWorld().units.find(u=>u.id===saved.id).native;p.object=saved.object;p.f2=saved.f2;}});
 // A preparation interrupt returns through state 10 and the empty-order
 // victory decision, including state initialization and the new sprite pose.
 await page.evaluate(()=>{const w=window.testStore.getWorld(),p=w.units.find(u=>u.kind==='shaman').native;p.flags2|=16;w.paused=false;});
 await page.waitForFunction(()=>{const p=window.testStore.getWorld().units.find(u=>u.kind==='shaman').native;return !(p.flags2&16)&&p.previousState===10&&p.state===41;});
 // Place the six followers into native circle substates to exercise the
 // circle->chain transition and frame freezes without waiting on random joins.
 await page.evaluate(()=>{
  const w=window.testStore.getWorld(),braves=w.units.filter(u=>u.kind!=='shaman');
  for(let i=0;i<braves.length;i++){
   const u=braves[i],p=u.native;p.anchorX=3840;p.anchorY=55040;u.x=7;u.z=33;
   p.substate=i?4:3;p.flags2=0x40020000;p.link=0;p.target=0;p.speed=0;
  }
  w.paused=false;window.observedPhases=[];
  window.phaseWatcher=setInterval(()=>{const w=window.testStore.getWorld();window.observedPhases.push(...w.units.map(u=>u.native.substate));},10);
 });
 await page.waitForFunction(()=>window.observedPhases.includes(5)&&window.observedPhases.includes(6),{},{timeout:10000});
 await page.waitForTimeout(1300);
 await page.evaluate(()=>{
  clearInterval(window.phaseWatcher);
  const w=window.testStore.getWorld(),u=w.units.find(u=>u.kind!=='shaman'),b=w.buildings.find(b=>b.team==='blue');
  const edge=w.land.buildingIds.findIndex((id,i)=>(id&1023)===b.id&&(i&127)>0&&!(w.land.flags[i-1]&0x200));
  if(edge<0)throw new Error('No registered footprint boundary');
  const x=((edge&127)*512-12)&65535,y=((edge>>7)*512+256)&65535;
  Object.assign(u,{x:((x-2048)<<16>>16)/256,z:-((y+2048)<<16>>16)/256});window.detourStart={x:u.x,z:u.z};
  Object.assign(u.native,{substate:1,flags2:128,counter:0,heading:512,angle:512,turnAngle:512,speed:80,assignment:0,animationMode:0,commandPhase:100,timer:100,motionTimer:0,motionMode:0,recoveryCounter:0});
  window.detourPerson=u.id;
 });
 await page.waitForFunction(()=>window.testStore.getWorld().units.find(u=>u.id===window.detourPerson)?.native.motionMode>0);
 assert.ok(await page.evaluate(()=>{
  const u=window.testStore.getWorld().units.find(u=>u.id===window.detourPerson);
  return u.native.heading!==512&&(u.x!==window.detourStart.x||u.z!==window.detourStart.z);
 }),'blocked live follower selects and moves along a native detour');
 await page.waitForFunction(()=>!window.testStore.getWorld().outcome.cameraPlaying);
 await page.waitForSelector('.end-screen button');await page.locator('.end-screen button').click();
 await page.waitForFunction(()=>window.testStore.getWorld().status==='playing');
 assert.ok(await page.evaluate(()=>window.testStore.getWorld().units.every(u=>u.native===null)));
 assert.ok(await page.evaluate(()=>window.testStore.getWorld().objectCells.heads.every(id=>!id)));
 assert.deepEqual(errors,[]);
 console.log('PASS: live victory handoff, movement, original atlas frames, pause, circles, chains, obstacle detours and restart; no page errors');
}finally{await browser.close();}
