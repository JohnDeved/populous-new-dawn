// Start npm run dev, then node scripts/check-browser-spell-cursor.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openGame,collapseCampaignMessages} from './browser-game.mjs';
const browser=await chromium.launch({headless:true});
try{
 // Shared public startup: opening logo/main menu -> New Game -> Mission 1 -> Skip Introduction.
 const {page,errors}=await openGame(browser);
 page.setDefaultTimeout(15000);
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 // The opening campaign message owns gameplay keys; collapse it before keyboard spell selection.
 await collapseCampaignMessages(page);
 await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;s.focus({x:2,z:30});s.onChange();});
 const near={x:10,z:33},far={x:0,z:44};
 async function move(p){
  const pos=await page.evaluate(p=>{const s=window.testScene,q=s.screen(p,Math.max(0,s.y(p))),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};},p);
  assert.ok(pos.x>200&&pos.x<1440&&pos.y>30&&pos.y<950,JSON.stringify(pos));
  await page.mouse.move(pos.x,pos.y);await page.waitForFunction(p=>{const q=window.testScene.pointer;return q&&Math.hypot(q.x-p.x,q.z-p.z)<1;},p);
  return pos;
 }
 const sprites=()=>page.locator('.spell-pointer i:not([hidden])').evaluateAll(es=>es.map(e=>e.dataset.sprite));
 async function expect(ids){try{await page.waitForFunction(ids=>JSON.stringify([...document.querySelectorAll('.spell-pointer i:not([hidden])')].map(e=>e.dataset.sprite))===JSON.stringify(ids),ids);}catch(e){throw Error(`Expected ${ids}; got ${await sprites()}`,{cause:e});}}
 // Keyboard selection after pointer movement updates without another mouse event.
 await moveWithoutMode();
 async function moveWithoutMode(){
  const p=await page.evaluate(p=>{const s=window.testScene,q=s.screen(p,Math.max(0,s.y(p))),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};},near);await page.mouse.move(p.x,p.y);
 }
 await page.keyboard.press('1');await expect(['point41']);
 const placement=await page.locator('.spell-pointer').evaluate(e=>{const s=window.testScene,r=e.children[0].getBoundingClientRect();return {x:r.x-s.pointerScreen.clientX,y:r.y-s.pointerScreen.clientY,ring:s.cursor.visible,background:getComputedStyle(e.children[0]).backgroundImage};});
 assert.equal(placement.x,0);assert.equal(placement.y,-16);assert.equal(placement.ring,false);assert.match(placement.background,/original\/hud.png/);
 await page.screenshot({path:'/private/tmp/populous-cursor-ready.png'});
 const out=await move(far),turn=await page.evaluate(()=>window.testScene.world.turn);await expect(['point41','589',`point${80+turn%4}`]);
 await page.screenshot({path:'/private/tmp/populous-cursor-range.png'});
 // Native range-animation clock input; do not advance simulation during fixtures.
 for(let turn=1;turn<=4;turn++){await page.evaluate(turn=>window.testScene.world.turn=turn,turn);await expect(['point41','589',`point${80+turn%4}`]);}
 const before=await page.evaluate(()=>window.testScene.world.shots.blast);await page.mouse.click(out.x,out.y);
 assert.equal(await page.evaluate(()=>window.testScene.world.shots.blast),before);
 assert.equal(await page.evaluate(()=>window.testScene.world.mode),'blast');
 // A zero-stock reward spell is an undiscovered HUD placeholder, so arm it through its stocked
 // HUD card, then remove the fixture stock while armed to show the no-stock frame.
 await page.evaluate(()=>{const s=window.testScene;s.world.shots.bridge=1;s.onChange();});
 await page.getByRole('button',{name:'Land Bridge, 1 shots',exact:true}).click();await move(near);await expect(['point48']);
 await page.evaluate(()=>window.testScene.world.shots.bridge=0);await expect(['point48','589']); // No gifted stock.
 await page.evaluate(()=>window.testScene.world.shots.bridge=1);await expect(['point48']);
 // A wet target within range must display the warning, without the range walker.
 // Since the native terrain-category predicate replaced the old "two dry shores" rule, sea-level
 // shore cells can be valid; choose the nearest wet cell whose native category rejects a bridge.
 const sea=await page.evaluate(async()=>{const s=window.testScene,w=s.world,u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman'),rules=(await import('/app/original-rules.json')).default,{nativePosition}=await import('/app/model.ts');
  let best=null;for(let z=Math.floor(u.z)-14;z<=u.z+14;z++)for(let x=Math.floor(u.x)-14;x<=u.x+14;x++){const t=nativePosition(w,{x,z}),cell=((t.y&65535)>>9)*128+((t.x&65535)>>9),d=Math.hypot(x-u.x,z-u.z);if(s.y({x,z})<=0&&rules.terrainCategoryFlags[w.land.categories[cell]&15]&2&&(!best||d<best.d))best={x,z,d};}
  if(!best)throw Error('No nearby shoreline fixture');return {x:best.x,z:best.z};});
 await move(sea);await expect(['point48','589']);
 await page.evaluate(()=>{const s=window.testScene;s.world.shots.lightning=1;s.onChange();});
 await page.getByRole('button',{name:'Lightning, 1 shots',exact:true}).click();await move(near);await expect(['point49']);
 await page.evaluate(()=>window.testScene.world.shots.lightning=0);await expect(['point49','589']); // No gifted stock.
 await page.evaluate(()=>window.testScene.world.shots.lightning=1);await expect(['point49']);
 await page.evaluate(()=>window.testScene.world.units.find(u=>u.team==='blue'&&u.kind==='shaman').lift=1);await expect(['point49','589']);
 await page.evaluate(()=>window.testScene.world.units.find(u=>u.team==='blue'&&u.kind==='shaman').lift=0);await expect(['point49']);
 // A stationary pointer follows a camera turn, and leaving the world clears it.
 const old=await page.evaluate(()=>({...window.testScene.pointer}));await page.keyboard.down('q');await page.waitForTimeout(250);await page.keyboard.up('q');
 assert.ok(await page.evaluate(old=>{const p=window.testScene.pointer;return p&&Math.hypot(p.x-old.x,p.z-old.z)>.1;},old));
 await page.mouse.move(100,500);await page.waitForFunction(()=>document.querySelector('.spell-pointer').hidden&&window.testScene.pointer===null);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{const s=window.testScene,u=s.world.units.find(u=>u.team==='blue'&&u.kind==='shaman');Object.assign(u,{x:0,z:46});s.focus({x:1,z:46});s.onChange();});
 const edge={x:1,z:46};await page.keyboard.press('1');await move(edge);await expect(['point41']);
 assert.ok(await page.evaluate(edge=>window.testScene.y(edge)>0,edge),'out-of-crop browser target is dry land');
 const position=await move(edge),edgeBefore=await page.evaluate(()=>window.testScene.world.shots.blast);await page.mouse.click(position.x,position.y);await page.waitForFunction(()=>window.testScene.world.mode===null&&document.querySelector('.spell-pointer').hidden);
 assert.equal(await page.evaluate(()=>window.testScene.world.shots.blast),edgeBefore-1);
 assert.equal(await page.evaluate(()=>window.testScene.world.stats.cast),1);
 assert.deepEqual(errors,[]);console.log('PASS: original spell cursor artwork/offsets, all three spells, range frames, no stock, wet shore, busy shaman, stationary camera targeting, HUD leave, rejected and full-world successful real clicks; no browser errors');
}finally{await browser.close();}
