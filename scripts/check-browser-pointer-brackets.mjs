import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {writeFileSync} from 'node:fs'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true}),views=[]
try{
 for(const [width,height,dpr] of [[1440,1000,1],[3440,1440,1],[1920,1080,2]]){
  const {page,errors}=await openGame(browser);await page.setViewportSize({width,height})
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false})
  const point=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts');cancelAnimationFrame(s.frame)
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.paused=false;w.speed=0
   const u=m.addUnit(w,'blue','brave',{x:0,z:8});s.focus(u);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   const p=s.picking.personBounds(u.id),r=s.container.getBoundingClientRect()
   return {x:r.left+p.x+p.width/2,y:r.top+p.y+p.height/2,id:u.id}
  })
  await page.mouse.move(point.x,point.y)
  const draw=()=>page.evaluate(()=>{const s=window.testScene;s.animate(s.previous);cancelAnimationFrame(s.frame);s.gameClock.animationFrame=0;s.drawPointer(performance.now());return {display:s.pointerOutline.style.display,lines:(s.pointerPath.getAttribute('d')?.match(/M/g)??[]).length,color:s.pointerPath.getAttribute('stroke'),hovered:s.hoveredObject,pointer:s.pointerScreen,mask:s.world.inputMask,picked:s.pointerScreen&&s.picking.pick(s.pointerScreen)}})
  const hover=await draw();assert.equal(hover.lines,16,JSON.stringify({point,hover}))
  await page.mouse.click(point.x,point.y)
  const clicked=await draw();assert.equal(clicked.display,'');assert.equal(clicked.lines,32);assert.equal(clicked.color,'rgb(229,220,214)')
  if(width===1440)await page.screenshot({path:'/private/tmp/populous-pointer-brackets.png'})
  const result=await page.evaluate(async()=>{
   const s=window.testScene,svg=s.pointerOutline.cloneNode(true),rect=s.container.getBoundingClientRect()
   svg.setAttribute('width',rect.width);svg.setAttribute('height',rect.height);svg.style.width='';svg.style.height=''
   const image=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}))
   image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=rect.width;canvas.height=rect.height
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);URL.revokeObjectURL(url)
   const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i])pixels++
   const baseline=s.pointerAck.until-5000/24
   const schedules=[5,30,60,120,144,240].map(hz=>{
    const samples=[];for(let i=0;i<=Math.ceil(hz*.3);i++){const ms=i/hz*1000;s.drawPointer(baseline+ms);samples.push({ms,lines:(s.pointerPath.getAttribute('d').match(/M/g)??[]).length})}
    if(samples.some(p=>p.lines!==(p.ms<5000/24?32:16)))throw Error(`Refresh-dependent acknowledgement at ${hz} Hz`)
    return hz
   })
   const start=performance.now();for(let i=0;i<1000;i++)s.drawPointer(baseline+300)
   return {pixels,schedules,cachedDrawMicroseconds:(performance.now()-start),webglCalls:s.renderer.info.render.calls,paths:s.pointerOutline.querySelectorAll('path').length}
  })
  assert.ok(result.pixels>50);assert.equal(result.paths,1)
  await page.mouse.move(10,10);await draw();assert.equal(await page.evaluate(()=>window.testScene.pointerOutline.style.display),'none')
  assert.deepEqual(errors,[]);views.push({width,height,dpr,...result});await page.close()
 }
 writeFileSync('/private/tmp/populous-pointer-brackets-browser.json',JSON.stringify({browser:browser.version(),views},null,2))
 console.log('PASS: actual hover/click brackets, SVG raster pixels, one path, expiry at 5–240 Hz, pointer-leave cleanup and desktop/ultrawide/2x DPI')
}finally{await browser.close()}
