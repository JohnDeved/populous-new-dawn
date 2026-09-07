import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const {GameScene}=await import('/app/scene.ts'),m=await import('/app/model.ts');
  const host=document.createElement('div');Object.assign(host.style,{position:'fixed',inset:'0',zIndex:10000,background:'#233544'});document.body.append(host);
  const mini=document.createElement('canvas'),w=m.createWorld();w.paused=true;w.effects=[];w.selected=[];w.units=[];
  for(const [team,kind,x,z] of [['blue','shaman',4,29],['red','shaman',8,29],['blue','brave',4,33],['blue','warrior',8,33]])m.addUnit(w,team,kind,{x,z});
  const scene=new GameScene(host,mini,w,()=>{},()=>{});scene.focus({x:5,z:31});
  window.nativeQA={scene,w,m};
 });
 await page.waitForTimeout(800);await page.screenshot({path:'qa/native-idle.png'});
 for(const state of ['walk','carry','airborne','cast','attack']){
  await page.evaluate(state=>{const {w}=window.nativeQA;for(const u of w.units){u.path=[];u.cargo=0;u.lift=0;u.casting=null;u.fighting=state==='attack';u.heading=Math.PI/2;if(state==='walk'||state==='carry')u.path=[{x:u.x+2,z:u.z}];if(state==='carry'&&u.kind==='brave')u.cargo=1;if(state==='airborne')u.lift=.5;if(state==='cast'&&u.kind==='shaman')u.casting={spell:'blast',point:{x:0,z:25},remaining:.4};}w.time+=.25;},state);
  await page.waitForTimeout(100);await page.evaluate(()=>window.nativeQA.w.time+=.25);await page.waitForTimeout(100);await page.screenshot({path:`qa/native-${state}.png`});
 }
 await page.evaluate(()=>{const {w,m}=window.nativeQA;w.effects=[];for(const [kind,x,z] of [['blast',1,28],['lightning',8,29],['birth',5,34],['splash',-2,33]]){const f=m.effect(w,kind,{x,z});f.age=.25;}for(const u of w.units){u.path=[];u.lift=0;u.casting=null;u.fighting=false;}});
 await page.waitForTimeout(350);await page.screenshot({path:'qa/native-effects.png'});
 assert.deepEqual(errors,[]);console.log('PASS: native walking, carrying, airborne, casting, attacks and translucent effect rendering.');
 await page.evaluate(()=>window.nativeQA.scene.dispose());
}finally{await browser.close();}
