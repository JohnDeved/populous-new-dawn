// Start npm run dev, then: node scripts/check-browser-water.mjs
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{
  let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;
  const s=window.testScene;s.world.flyby.flags=0;s.world.inputMask=0;s.world.paused=false;s.focus({x:2,z:30});
 });
 await page.waitForFunction(()=>{const s=window.testScene;return s.waves&&s.world.landVersion>=0&&s.terrainVersion===s.world.landVersion;});
 await page.evaluate(()=>window.testScene.world.paused=true);
 const result=await page.evaluate(()=>{
  const s=window.testScene,g=s.terrain.geometry,p=g.getAttribute('position'),gl=s.renderer.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
  const pixels=()=>{s.renderer.render(s.scene,s.camera);const out=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;};
  s.world.turn=0;s.updateWater();const zero=Array.from(p.array),first=pixels();
  s.world.turn=23;s.updateWater();const second=pixels(),changedHeights=p.array.some((v,i)=>v!==zero[i]);let changedWater=0;
  for(let y=0;y<height*.15;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(first[i]!==second[i]||first[i+1]!==second[i+1]||first[i+2]!==second[i+2])changedWater++;}
  s.world.turn=256;s.updateWater();const wrapped=Array.from(p.array).every((v,i)=>v===zero[i]),shared=new Map();let cracks=0,south=0;
  for(let j=0;j<p.count;j++){
   const x=p.getX(j),z=p.getZ(j),h=p.getY(j),key=`${x},${z}`;
   if(shared.has(key)&&shared.get(key)!==h)cracks++;shared.set(key,h);if(z===50&&x>=-18&&x<=4)south++;
  }
  return {changedHeights,changedWater,wrapped,scroll:s.waterScroll.value,cracks,south,triangles:g.index.count/3,atlas:s.terrainMap.image.width};
 });
 assert.ok(result.changedHeights);assert.ok(result.changedWater>1000);assert.ok(result.wrapped);assert.equal(result.scroll,0);
 assert.equal(result.cracks,0);assert.ok(result.south>0);assert.equal(result.triangles,32768);assert.equal(result.atlas,4096);
 await page.screenshot({path:'/private/tmp/populous-water-after.png'});
 const held=await page.evaluate(()=>({turn:window.testScene.world.turn,state:window.testScene.waterState}));await page.waitForTimeout(250);
 assert.deepEqual(await page.evaluate(()=>({turn:window.testScene.world.turn,state:window.testScene.waterState})),held);
 await page.evaluate(()=>window.testScene.focus({x:0,z:50}));await page.waitForTimeout(100);
 await page.screenshot({path:'/private/tmp/populous-water-southern-shore.png'});
 await page.evaluate(()=>window.testScene.overviewActive=true);await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>window.testScene.terrain.count===1));
 await page.evaluate(()=>window.testScene.focus());await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>window.testScene.terrain.count===9));assert.deepEqual(errors,[]);
 console.log('PASS: water changes GPU pixels and vertex heights, wraps every 256 turns and freezes while paused; full-map coast has shared heights beyond the old crop; overview returns without browser errors');
}finally{await browser.close();}
