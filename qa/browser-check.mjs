import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import * as THREE from 'three';
import { createWorld, worldPoint, planetPoint, normal, PLANET_RADIUS, cast } from '../app/model.ts';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});page.setDefaultTimeout(12000);
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{window.__audioStarts=0;for(const Type of [OscillatorNode,AudioBufferSourceNode]){const start=Type.prototype.start;Type.prototype.start=function(...args){window.__audioStarts++;return start.apply(this,args);};}});
const w=createWorld(),cam=new THREE.PerspectiveCamera(42,1440/960,.2,500);cam.up.set(0,0,-1);
function camera(p){const n=normal({x:p.x,z:p.z+(.22*55/70)*PLANET_RADIUS});cam.position.set(n.x*125,n.y*125-PLANET_RADIUS,n.z*125);const q=planetPoint(p);cam.lookAt(q.x,q.y,q.z);cam.updateMatrixWorld();}camera({x:0,z:36});
async function focus(x,z){const rect=await page.locator('.minimap-wrap canvas').boundingBox();await page.mouse.click(rect.x+(x+48)/96*rect.width,rect.y+(z+48)/96*rect.height);camera({x,z});await page.waitForTimeout(350);}
async function click(x,z,button='left'){const q=worldPoint(w.terrain,{x,z}),p=new THREE.Vector3(q.x,q.y,q.z).project(cam);await page.mouse.click((p.x+1)*720,(1-p.y)*480,{button});}
try{
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});await page.locator('.loading-world').waitFor({state:'hidden'});await page.screenshot({path:'qa/desktop.png'});
 await page.getByRole('button',{name:'Enable sound',exact:true}).click();assert.ok(await page.evaluate(()=>window.__audioStarts>=4));
 await page.getByRole('button',{name:'buildings B',exact:false}).click();assert.ok(await page.getByRole('button',{name:'Warrior Training Hut, 8 wood',exact:true}).isDisabled());
 await page.getByRole('button',{name:'spells 1–3',exact:false}).click();
 await page.getByRole('button',{name:'1× GAME SPEED',exact:false}).click();
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();await page.getByRole('button',{name:'Worship Land Bridge stone head',exact:true}).click();
 await page.getByRole('button',{name:/Land Bridge, [234] shots/}).waitFor({timeout:24000});console.log('stone head gifts verified');
 await page.getByRole('button',{name:'Select all shaman',exact:true}).click();await focus(0,20);await click(0,20,'right');await page.waitForTimeout(6500);
 await focus(0,10);await page.getByRole('button',{name:/Land Bridge, [234] shots/}).click();await click(0,4);await page.waitForFunction(()=>document.querySelectorAll('.objective-panel li.complete').length===1);
 const shaman=w.units.find(u=>u.kind==='shaman'&&u.team==='blue');shaman.x=0;shaman.z=20;w.shots.bridge=1;cast(w,'bridge',{x:0,z:4});
 await click(0,4,'right');await page.waitForTimeout(4200);await focus(-4,0);
 await page.getByRole('button',{name:/Blast, [1-4] shots/}).click();await click(-9,-3);await page.waitForTimeout(600);
 await page.getByRole('button',{name:'Worship Vault of Knowledge',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.objective-panel li.complete').length===2,{},{timeout:18000});console.log('bridge and vault verified');
 await focus(4,32);await page.getByRole('button',{name:'Select all braves',exact:true}).click();await click(4,32,'right');
 await page.getByRole('button',{name:'buildings B',exact:false}).click();const camp=page.getByRole('button',{name:'Warrior Training Hut, 8 wood',exact:true});assert.ok(await camp.isEnabled());await camp.click();await click(4,32);
 await page.getByText('Warrior Training Hut planned. Braves will fetch 8 logs from nearby trees.').waitFor();await page.screenshot({path:'qa/construction.png'});
 await page.getByRole('button',{name:'Warrior Training Hut: ready',exact:true}).waitFor({timeout:45000});console.log('timber delivery and grounded construction verified');
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();await click(4,32,'right');await page.waitForFunction(()=>Number(document.querySelectorAll('.tribe-classes strong')[1]?.textContent)>0,{},{timeout:20000});await page.screenshot({path:'qa/training.png'});
 await page.getByRole('button',{name:'Pause game',exact:true}).click();const time=await page.locator('.clock-label').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('.clock-label').innerText(),time);
 await page.getByRole('button',{name:'Planet overview',exact:true}).click();await page.screenshot({path:'qa/planet.png'});
 const before=await page.getByRole('button',{name:'Worship Vault of Knowledge',exact:true,includeHidden:true}).boundingBox();await page.mouse.move(950,470);await page.mouse.down({button:'right'});await page.mouse.move(390,500,{steps:30});await page.mouse.up({button:'right'});await page.waitForTimeout(500);await page.screenshot({path:'qa/planet-orbit.png'});
 const after=await page.getByRole('button',{name:'Worship Vault of Knowledge',exact:true,includeHidden:true}).boundingBox();assert.ok(after===null||Math.abs(before.x-after.x)>30,'rotation carries landmarks around the planet');
 await page.getByRole('button',{name:'Centre camera',exact:true}).click();await page.getByRole('button',{name:'Menu',exact:true}).click();assert.ok(await page.locator('dialog').evaluate(d=>d.open));await page.getByRole('button',{name:'Restart world',exact:true}).click();await page.locator('.loading-world').waitFor({state:'hidden'});assert.equal(await page.locator('.objective-panel li.complete').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: render, original mission discoveries, real timber delivery, training, pause, spherical orbit, sound, and restart.');
}catch(e){await page.screenshot({path:'qa/failure.png'});console.log((await page.locator('body').innerText()).slice(0,1600));throw e;}finally{console.log({errors});await browser.close();}
