// Start npm run dev, then node scripts/check-browser-selection.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import native from '../app/original-units.json' with {type:'json'};
import {spriteCoordinate} from '../app/projection.ts';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;});
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1,{},{timeout:15000});await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;s.focus({x:2,z:30});s.onChange();});
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 await page.waitForFunction(()=>{const s=window.testScene;return [...s.unitMeshes.values()].filter(g=>g.userData.selection.visible).length===6;});
 const pixels=await page.evaluate(()=>{
  const s=window.testScene,u=s.world.units.find(u=>u.kind==='brave'&&u.team==='blue'&&s.unitMeshes.get(u.id)?.visible&&s.visible(u)),g=s.unitMeshes.get(u.id),a=g.userData.selection;
  if(!a.isSprite)throw new Error('Selection must use the original sprite');
  const pos=s.screen(u),r=s.renderer,gl=r.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
  const x=(pos.x+1)*width/2-a.center.x*a.scale.x,y=(1-pos.y)*height/2-(1-a.center.y)*a.scale.y;
  r.render(s.scene,s.camera);const before=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,before);
  const all=[...s.unitMeshes.values()].map(g=>g.userData.selection).filter(a=>a.visible);all.forEach(a=>a.visible=false);r.render(s.scene,s.camera);const after=new Uint8Array(before.length);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,after);all.forEach(a=>a.visible=true);
  let changed=0;for(let yy=Math.max(0,Math.floor(y)-1);yy<Math.min(height,y+a.scale.y+1);yy++)for(let xx=Math.max(0,Math.floor(x)-1);xx<Math.min(width,x+a.scale.x+1);xx++){
   const i=((height-1-yy)*width+xx)*4;if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;
  }
  let total=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])total++;return {changed,total,x,y,source:a.material.map.image.src,scale:[a.scale.x,a.scale.y],visible:g.visible,loaded:a.material.map.image.complete,depth:a.material.depthTest,parentVisible:g.parent.visible,center:[a.center.x,a.center.y]};
 });
 assert.ok(pixels.total>0,JSON.stringify(pixels));assert.match(pixels.source,/selection.png$/);
 await page.screenshot({path:'/private/tmp/populous-selection-braves.png'});
 await page.getByRole('button',{name:'Select and focus shaman',exact:true}).click();
 await page.waitForFunction(()=>{const s=window.testScene,v=[...s.unitMeshes.values()].filter(g=>g.userData.selection.visible);return v.length===1&&v[0].userData.signature==='blue-shaman';});
 // Exercise real walk-frame poses with different native header heights.
 const poses=await page.evaluate(directions=>{
  const s=window.testScene,u=s.world.units.find(u=>u.kind==='shaman'&&u.team==='blue'),g=s.unitMeshes.get(u.id),body=g.userData.sprite,out=[];
  for(let i=0;i<12;i++){
   s.animatePerson(body,g,u.heading,directions,i/12,false);
   const a=g.userData.selection;out.push({index:g.userData.frame,offset:(1-a.center.y)*a.scale.y,view:s.view.config});
  }
  return out;
 },native.animations['blue-shaman'].walk);
 assert.ok(new Set(poses.map(p=>p.offset)).size>1,'arrow follows varying native pose heights');
 for(const p of poses){const flags=p.view.scaledSprites?0x100:0;assert.ok(Math.abs(p.offset-spriteCoordinate(native.frames[p.index].nativeHeight,-1,flags,p.view))<1e-8);}
 await page.screenshot({path:'/private/tmp/populous-selection-shaman.png'});
 await page.evaluate(()=>{const s=window.testScene;s.world.selected=s.world.units.filter(u=>u.team==='red').map(u=>u.id);s.onChange();});
 await page.waitForFunction(()=>[...window.testScene.unitMeshes.values()].every(g=>!g.userData.selection.visible));
 assert.deepEqual(errors,[]);
 console.log('PASS: original selection arrow reaches GPU pixels; group/shaman selection, native pose-height offsets and enemy-owner gating update through live controls; no browser errors');
}finally{await browser.close();}
