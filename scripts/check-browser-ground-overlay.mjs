// Start npm run dev, then node scripts/check-browser-ground-overlay.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {buildingFootprintCells} from '../app/building-shapes.ts';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;});
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1);await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;s.focus({x:2,z:34});s.onChange();});
 await page.getByRole('button',{name:'buildings B',exact:true}).click();await page.getByRole('button',{name:'Hut, 3 wood',exact:true}).click();
 async function move(p){
  const q=await page.evaluate(p=>{const s=window.testScene,q=s.screen(p,Math.max(0,s.y(p))),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};},p);
  await page.mouse.move(q.x,q.y);await page.waitForFunction(p=>{const s=window.testScene,q=s.pointer;return s.cursor.visible&&q&&Math.hypot(q.x-p.x,q.z-p.z)<.2;},p);return q;
 }
 await move({x:4.3,z:32.3});
 const valid=await page.evaluate(()=>{
  const s=window.testScene,m=s.cursor,r=s.renderer,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,a=new Uint8Array(w*h*4),b=new Uint8Array(a.length);
  r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,a);m.visible=false;r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,b);m.visible=true;
  let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])pixels++;
  const position=m.geometry.getAttribute('position');let grounded=true;
  for(let i=0;i<position.count;i++){const x=Math.round((position.getX(i)+8)*256)&65535,y=Math.round((-position.getZ(i)-8)*256)&65535,j=(y>>>9)*128+(x>>>9);if(position.getY(i)*128!==s.world.land.heights[j])grounded=false;}
  return {pixels,cells:m.userData.cells,invalid:m.userData.invalid,grounded,vertices:position.count,texture:m.material.map.image.src,uv:Array.from(m.geometry.getAttribute('uv').array),key:s.placementState};
 });
 assert.equal(valid.invalid,false);assert.equal(valid.grounded,true);assert.ok(valid.pixels>500,JSON.stringify(valid));assert.match(valid.texture,/original\/atlas.png$/);
 assert.deepEqual(valid.cells,buildingFootprintCells({object:131,angle:0,anchorX:3072,anchorY:54784}));assert.equal(valid.vertices,valid.cells.length*6);
 assert.ok(valid.uv.every(v=>v>=0&&v<=1));
 await page.screenshot({path:'/private/tmp/populous-ground-placement.png'});
 // Crossing a terrain cell changes the footprint; turning the camera repicks a stationary pointer.
 await move({x:6.3,z:32.3});assert.notEqual(await page.evaluate(()=>window.testScene.placementState),valid.key);
 const beforeTurn=await page.evaluate(()=>({bearing:window.testScene.cameraBearing,point:{...window.testScene.pointer}}));
 await page.locator('.world-viewport canvas').focus();await page.keyboard.down('q');await page.waitForTimeout(250);await page.keyboard.up('q');
 assert.ok(await page.evaluate(old=>{const s=window.testScene,p=s.pointer;return s.cameraBearing!==old.bearing&&p&&Math.hypot(p.x-old.point.x,p.z-old.point.z)>.1;},beforeTurn));
 // Invalid terrain uses native red tint and rejects a real click without placing a building.
 const bad=await move({x:-4,z:42});await page.waitForFunction(()=>window.testScene.cursor.userData.invalid);
 assert.ok(await page.evaluate(()=>{const c=window.testScene.cursor.geometry.getAttribute('color');return c.getX(0)>c.getY(0)*10;}));
 const count=await page.evaluate(()=>window.testScene.world.buildings.length);await page.mouse.click(bad.x,bad.y);
 assert.equal(await page.evaluate(()=>window.testScene.world.buildings.length),count);
 await page.screenshot({path:'/private/tmp/populous-ground-invalid.png'});
 await page.mouse.move(100,500);await page.waitForFunction(()=>!window.testScene.cursor.visible);
 await page.evaluate(()=>window.testScene.focus({x:2,z:34}));
 const good=await move({x:4.3,z:32.3});await page.mouse.click(good.x,good.y);
 await page.waitForFunction(n=>window.testScene.world.buildings.length===n+1,count);await page.waitForFunction(()=>!window.testScene.cursor.visible&&window.testScene.world.mode===null);
 // Cancellation also clears a live preview.
 await page.getByRole('button',{name:'Hut, 3 wood',exact:true}).click();await move({x:4.3,z:32.3});await page.locator('.world-viewport canvas').focus();await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.testScene.cursor.visible);
 assert.deepEqual(errors,[]);console.log(`PASS: original connected placement tiles (${valid.cells.length} cells, ${valid.pixels} GPU pixels), native terrain grounding, cell snapping, camera turn, invalid tint/rejected click, HUD leave, successful placement and cancellation; no browser errors`);
}finally{await browser.close();}
