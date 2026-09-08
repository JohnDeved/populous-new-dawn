// Start npm run dev, then node scripts/check-browser-hud.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(7000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});
 await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{
  let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;

 });
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1,{},{timeout:15000});
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 await page.evaluate(()=>{const s=window.testScene;s.world.messageUntil=0;s.focus({x:2,z:30});s.onChange();});
 const bounds=()=>page.evaluate(()=>{
  const hud=document.querySelector('.native-hud').getBoundingClientRect(),view=document.querySelector('.world-viewport').getBoundingClientRect();
  return {hud:{x:hud.x,right:hud.right,bottom:hud.bottom},left:view.left,buttons:[...document.querySelectorAll('.native-hud button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};})};
 });
 for(const size of [{width:1440,height:1000},{width:1280,height:720}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);const b=await bounds();assert.equal(b.hud.x,0);assert.equal(b.left,b.hud.right);assert.ok(Math.abs(b.hud.bottom-size.height)<1);assert.ok(b.buttons.every(r=>r.left>=0&&r.right<=b.hud.right+1&&r.bottom<=size.height));
 }
 await page.setViewportSize({width:1440,height:1000});
 assert.equal(await page.locator('.shrine-label,.building-label,.chapter-heading,.controls-footer').count(),0);
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 assert.ok(await page.evaluate(()=>{const w=window.testScene.world;return w.selected.length===6&&w.selected.every(id=>w.units.find(u=>u.id===id).kind==='brave');}));
 const bearing=await page.evaluate(()=>window.testScene.cameraBearing);
 await page.keyboard.down('q');await page.waitForTimeout(150);await page.keyboard.up('q');
 assert.notEqual(await page.evaluate(()=>window.testScene.cameraBearing),bearing,'mouse HUD clicks leave camera keyboard controls active');
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.testScene.world.paused),true);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.testScene.world.paused),false);
 await page.evaluate(()=>window.testScene.focus({x:2,z:30}));
 const blast=page.getByRole('button',{name:/^Blast, \d+ shots$/});await blast.click();assert.equal(await blast.getAttribute('aria-pressed'),'true');
 await blast.click({button:'right'});assert.equal(await page.evaluate(()=>window.testScene.world.charging),false);
 await blast.click({button:'right'});assert.equal(await page.evaluate(()=>window.testScene.world.charging),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.testScene.world.mode),null);
 await page.getByRole('button',{name:'buildings B',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Warrior Training Hut, 8 wood',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Hut, 3 wood',exact:true}).click();assert.equal(await page.evaluate(()=>window.testScene.world.mode),'hut');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'spells 1–3',exact:true}).click();
 // The removed label is replaced by a real mesh hit, for hover and orders.
 const target=await page.evaluate(()=>{
  const s=window.testScene,head=s.world.shrines.find(h=>h.kind==='bridge'),r=s.renderer.domElement.getBoundingClientRect();
  for(let height=1;height<7;height+=.25){const q=s.screen(head,s.y(head)+height),x=r.left+(q.x+1)*r.width/2,y=r.top+(1-q.y)*r.height/2;
   if(s.pickWorldObject({clientX:x,clientY:y})?.id===head.id)return {x,y,id:head.id};}
  throw new Error('No visible mesh hit on opening stone head');
 });
 await page.mouse.move(target.x,target.y);await page.waitForFunction(()=>!document.querySelector('.native-tooltip').hidden);
 assert.match(await page.locator('.native-tooltip').textContent(),/Stone Head|worship|Worship/);
 await page.mouse.click(target.x,target.y);assert.ok(await page.evaluate(id=>window.testScene.world.units.some(u=>u.work===id),target.id));
 await page.mouse.move(400,950);await page.waitForTimeout(100);
 await page.screenshot({path:'/private/tmp/populous-native-hud-after.png'});
 await page.getByRole('button',{name:'Menu',exact:true}).click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);assert.equal(await page.evaluate(()=>window.testScene.world.paused),true);
 await page.getByRole('button',{name:'Close menu',exact:true}).click();assert.equal(await page.evaluate(()=>window.testScene.world.paused),false);
 await page.getByRole('button',{name:'Planet overview',exact:true}).click();assert.equal(await page.evaluate(()=>window.testScene.overviewActive),true);
 await page.getByRole('button',{name:'Select and focus shaman',exact:true}).click();assert.equal(await page.evaluate(()=>window.testScene.overviewActive),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: HUD bounds at two desktop sizes; selection, spell toggles/charging, building gating, mesh hover/worship, menu/pause and overview/shaman controls; no floating labels or browser errors');
}finally{await browser.close();}
