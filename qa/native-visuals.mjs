import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const {GameScene}=await import('/app/scene.ts'),m=await import('/app/model.ts');
  const host=document.createElement('div');Object.assign(host.style,{position:'fixed',inset:'0',zIndex:10000,background:'#233544'});document.body.append(host);
  const mini=document.createElement('canvas'),w=m.createWorld();w.paused=true;w.inputMask=0;w.ai.variables[57]=1;w.effects=[];w.selected=[];w.units=[];
  for(const [team,kind,x,z] of [['blue','shaman',4,29],['red','shaman',8,29],['blue','brave',4,33],['blue','warrior',8,33]])m.addUnit(w,team,kind,{x,z});
  const scene=new GameScene(host,mini,w,()=>{},()=>{});scene.focus({x:5,z:31});
  window.nativeQA={scene,w,m};
 });
 await page.waitForTimeout(800);await page.screenshot({path:'qa/native-idle.png'});
 // Native 0x468c7b selects directions from camera/unit headings, independent of
 // where a sprite stands on the curved landscape. These indices are x86-checked.
 const facing=await page.evaluate(async()=>{
  const data=(await import('/app/original-units.json')).default,{scene,w}=window.nativeQA;
  const u=w.units.find(u=>u.kind==='brave'),g=scene.unitMeshes.get(u.id),body=g.userData.sprite;
  const directions=data.animations['blue-brave'].idle,original=scene.cameraBearing,results=[];
  for(const [camera,heading,index] of [[0,0,4],[512,0,6],[1536,0,2],[512,512,4],[0,128,4],[0,129,3]]){
   scene.cameraBearing=camera*Math.PI/1024;
   scene.animatePerson(body,g,Math.PI-heading*Math.PI/1024,directions,0);
   const cycle=directions[index],frameIndex=cycle.frames[0],frame=data.frames[frameIndex];
   results.push([body.material.map.offset.x,(frameIndex%data.columns*data.cell+(cycle.flip?frame.w:0))/data.width,
    body.material.map.repeat.x,(cycle.flip?-frame.w:frame.w)/data.width]);
  }
  scene.cameraBearing=original;return results;
 });
 for(const [offset,expectedOffset,width,expectedWidth] of facing){assert.equal(offset,expectedOffset);assert.equal(width,expectedWidth);}
 for(const state of ['walk','carry','airborne','cast','attack','strike','special','recoil']){
  await page.evaluate(state=>{const {w}=window.nativeQA;for(const u of w.units){u.path=[];u.cargo=0;u.lift=0;u.casting=null;u.fighting=false;u.fight=['attack','strike','special','recoil'].includes(state)?{action:state,opponent:0,started:w.time*12,until:w.time*12+7}:null;u.heading=Math.PI/2;if(state==='walk'||state==='carry')u.path=[{x:u.x+2,z:u.z}];if(state==='carry'&&u.kind==='brave')u.cargo=1;if(state==='airborne')u.lift=.5;if(state==='cast'&&u.kind==='shaman')u.casting={spell:'blast',point:{x:0,z:25},remaining:.4};}w.time+=.25;},state);
  await page.waitForTimeout(100);await page.evaluate(()=>window.nativeQA.w.time+=.25);await page.waitForTimeout(100);await page.screenshot({path:`qa/native-${state}.png`});
 }
 await page.evaluate(()=>{const {w,m}=window.nativeQA;w.effects=[];for(const [kind,x,z] of [['blast',1,28],['lightning',8,29],['birth',5,34],['splash',-2,33]]){const f=m.effect(w,kind,{x,z});f.age=.25;}for(const u of w.units){u.path=[];u.lift=0;u.casting=null;u.fighting=false;u.fight=null;}});
 await page.waitForTimeout(350);await page.screenshot({path:'qa/native-effects.png'});
 for(const spell of ['blast','lightning','bridge']){
  await page.evaluate(spell=>{const {w,m,scene}=window.nativeQA;w.units=[];w.effects=[];w.projectiles=[];w.fights=[];w.turn=0;w.time=0;w.pendingTime=0;w.status='playing';w.paused=false;w.shots[spell]=1;m.addUnit(w,'blue','shaman',{x:4,z:29});m.addUnit(w,'red','shaman',{x:1,z:-37});m.cast(w,spell,{x:12,z:29});m.tick(w,7/12);w.paused=true;scene.focus({x:7,z:29});},spell);
  await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>window.nativeQA.w.projectiles.some(p=>p.phase==='flying')));
  assert.ok(await page.evaluate(()=>window.nativeQA.w.effects.some(f=>f.sprite&&Number.isFinite(f.height))));
  await page.screenshot({path:`qa/native-projectile-${spell}.png`});
 }
 await page.evaluate(()=>{
  const {w,m,scene}=window.nativeQA;w.units=[];w.effects=[];w.projectiles=[];w.fights=[];w.time=0;w.turn=0;w.pendingTime=0;w.randomState=1;w.status='playing';
  m.addUnit(w,'blue','warrior',{x:1,z:29});for(let i=0;i<3;i++)m.addUnit(w,'red','brave',{x:1.4+i*.1,z:29});
  w.paused=false;m.tick(w,1/12);w.paused=true;scene.focus({x:1,z:29});scene.zoom(.88);
 });
 assert.equal(await page.evaluate(()=>window.nativeQA.w.fights[0]?.members.length),4);
 for(let i=0;i<12;i++){await page.evaluate(()=>{const {w,m}=window.nativeQA;w.paused=false;m.tick(w,1/12);w.paused=true;});await page.waitForTimeout(90);}
 await page.screenshot({path:'qa/native-group-fight.png'});
 assert.ok(await page.evaluate(()=>window.nativeQA.w.units.some(u=>u.hp<window.nativeQA.m.maxHp(u.kind))),'staged fighters exchange damage in the rendered scene');
 await page.evaluate(()=>{
  const {w,m,scene}=window.nativeQA,vault=w.shrines.find(s=>s.kind==='vault');
  w.units=[];w.effects=[];w.fights=[];w.status='playing';
  const u=m.addUnit(w,'blue','shaman',m.entrance(w,vault,2));m.addUnit(w,'red','brave',{x:0,z:-32});
  w.selected=[u.id];w.paused=false;m.command(w,vault);w.paused=true;scene.focus(vault);
 });
 await page.waitForTimeout(200);await page.screenshot({path:'qa/native-vault-closed.png'});
 const vaultVertices=await page.evaluate(()=>{
  const {w,scene}=window.nativeQA,vault=w.shrines.find(s=>s.kind==='vault');
  const points=scene.shrineMeshes.get(vault.id).g.children[0].geometry.getAttribute('position').array;
  const unique=new Map();
  for(let i=0;i<points.length;i+=3){
   const p=[points[i],points[i+1],-points[i+2]].map(v=>Math.round(v*10000));
   unique.set(JSON.stringify(p),p);
  }
  return [...unique.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
 });
 assert.equal(createHash('sha256').update(JSON.stringify(vaultVertices)).digest('hex'),
  '977d4efcc02c8ac2269fb8e44d56c442b2a3b0a27da8c9eabbf1760ab105481e',
  'the actual rendered vault geometry matches original knowledge.3ds, not just its model ID');
 for(const phase of [3,4,6,8,9]){
  await page.evaluate(phase=>{const {w,m}=window.nativeQA,u=w.units.find(u=>u.team==='blue');w.paused=false;
   for(let i=0;i<400&&u.vault?.phase!==phase;i++)m.tick(w,1/12);
   if((phase===3||phase===8)&&u.vault?.entering)m.tick(w,1/12);w.paused=true;
   if(u.vault?.phase!==phase)throw new Error(`Vault did not reach ${phase}`);
  },phase);
  await page.waitForTimeout(150);await page.screenshot({path:`qa/native-vault-${phase}.png`});
  assert.equal(await page.evaluate(()=>{const {w,scene}=window.nativeQA,v=w.shrines.find(s=>s.kind==='vault');return scene.shrineMeshes.get(v.id).g.children[0].userData.nativeModel;}),[3,8,9].includes(phase)?152:153);
  if(phase===3||phase===8){
   const positions=()=>page.evaluate(()=>{const {w,scene}=window.nativeQA,v=w.shrines.find(s=>s.kind==='vault');return Array.from(scene.shrineMeshes.get(v.id).g.children[0].geometry.getAttribute('position').array);});
   const before=await positions();await page.waitForTimeout(150);assert.deepEqual(await positions(),before,'paused door geometry is stable');
   await page.evaluate(()=>{const {w,m}=window.nativeQA;w.paused=false;m.tick(w,19/12);w.paused=true;});
   await page.waitForTimeout(150);assert.notDeepEqual(await positions(),before,'door geometry changes during the native morph');
   await page.screenshot({path:`qa/native-vault-${phase}-mid.png`});
  }
 }
 const removed=await page.evaluate(()=>{const {w,m,scene}=window.nativeQA,head=w.shrines.find(s=>s.kind==='bridge');const entry=scene.shrineMeshes.get(head.id);window.removedHead=entry;m.removeHead(w,2,222);return head.id;});
 await page.waitForTimeout(100);
 assert.ok(await page.evaluate(id=>!window.nativeQA.scene.shrineMeshes.has(id)&&!window.removedHead.label.isConnected&&window.removedHead.g.parent===null,removed),'native head removal releases its mesh and worship button');
 assert.deepEqual(errors,[]);console.log('PASS: native sprites, effects, combat, vault door morphs and head removal.');
 await page.evaluate(()=>window.nativeQA.scene.dispose());
}finally{await browser.close();}
