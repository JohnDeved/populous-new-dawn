import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 await page.waitForFunction(()=>!!window.testScene.terrainTextures)
 await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts'),{createFootprints,stampFootprints}=await import('/app/footprints.ts')
  window.footprintModel=m;window.footprintClock=await import('/app/game-clock.ts')
  w.speed=0;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
  w.terrain.fill(3);w.terrainVersion++;w.footprints=createFootprints()
  window.walker=m.addUnit(w,'blue','brave',{x:0,z:8});w.selected=[window.walker.id]
  s.focus({x:4,z:8});s.onChange()
 })
 const target=await page.evaluate(()=>{const s=window.testScene,p=s.screen({x:10,z:8}),r=s.container.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}})
 await page.mouse.click(target.x,target.y,{button:'right'})
 const live=await page.evaluate(()=>{
  const s=window.testScene,w=s.world,u=window.walker
  if(!u.path.length)throw Error('Actual right-click did not issue movement')
  cancelAnimationFrame(s.frame);w.paused=true;w.speed=1;w.pendingTime=0;s.gameClock.animationTime=0
  const gl=s.renderer.getContext(),uploads=[],upload=gl.texSubImage2D.bind(gl)
  gl.texSubImage2D=(...args)=>{uploads.push({width:args[4],height:args[5]});return upload(...args)}
  for(let i=0;i<72;i++){
   w.paused=false;window.footprintClock.advanceGame(w,s.gameClock,1/24);w.paused=true
   s.animate(s.previous);cancelAnimationFrame(s.frame)
  }
  gl.texSubImage2D=upload
  const cursor=w.footprints.cursor;window.footprintClock.advanceGame(w,s.gameClock,3)
  return {cursor,paused:cursor===w.footprints.cursor,tiles:w.footprints.pixels.size,position:{x:u.x,z:u.z},uploads:uploads.filter(u=>u.width===32&&u.height===32).length}
 })
 assert.ok(live.cursor>0&&live.tiles>0&&live.uploads>0);assert.ok(live.paused)
 const visual=await page.evaluate(()=>{
  const s=window.testScene,w=s.world,gl=s.renderer.getContext(),size=gl.drawingBufferWidth*gl.drawingBufferHeight*4
  const read=()=>{s.renderer.render(s.scene,s.camera);const a=new Uint8Array(size);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return a}
  const partial=read();s.terrainMap.needsUpdate=true;const full=read()
  let mismatch=0;for(let i=0;i<size;i++)if(partial[i]!==full[i])mismatch++
  const saved=w.footprints.pixels;w.footprints.pixels=new Map();for(const cell of saved.keys())w.footprints.dirty.add(cell)
  s.updateTerrainTexture();const clear=read()
  let pixels=0;for(let i=0;i<size;i+=4)if(full[i]!==clear[i]||full[i+1]!==clear[i+1]||full[i+2]!==clear[i+2])pixels++
  w.footprints.pixels=saved;for(const cell of saved.keys())w.footprints.dirty.add(cell);s.updateTerrainTexture();read()
  return {pixels,mismatch}
 })
 assert.equal(visual.mismatch,0,'partial GPU uploads must exactly match full-atlas uploads');assert.ok(visual.pixels>10,JSON.stringify(visual))
 await page.screenshot({path:'/private/tmp/populous-footprints.png'})
 const performanceReport=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,{updateFootprintTiles}=await import('/app/terrain-texture.ts')
  // Same terrain/stains and CPU shading in both modes; vary only GPU transfer.
  const cells=[...w.footprints.pixels.keys()],samples={full:[],tiles:[]},bytes={full:0,tiles:0},calls={full:0,tiles:0}
  const gl=s.renderer.getContext(),upload=gl.texSubImage2D.bind(gl);let mode='full'
  gl.texSubImage2D=(...args)=>{if(typeof args[4]==='number'&&typeof args[5]==='number'){bytes[mode]+=args[4]*args[5]*4;calls[mode]++}return upload(...args)}
  for(let pass=0;pass<12;pass++)for(mode of pass%2?['tiles','full']:['full','tiles']){
   for(const cell of cells)w.footprints.dirty.add(cell)
   gl.finish();const start=performance.now()
   if(mode==='tiles')s.updateTerrainTexture()
   else {updateFootprintTiles(s.terrainAtlasState,w.land,s.terrainTextures,w.footprints,()=>{});w.footprints.dirty.clear();s.terrainMap.needsUpdate=true;s.renderer.initTexture(s.terrainMap)}
   gl.finish();samples[mode].push(performance.now()-start)
  }
  gl.texSubImage2D=upload
  const median=a=>a.slice(2).sort((a,b)=>a-b)[5]
  return {tiles:cells.length,fullMs:median(samples.full),tilesMs:median(samples.tiles),bytesPerUpdate:{full:bytes.full/12,tiles:bytes.tiles/12},callsPerUpdate:{full:calls.full/12,tiles:calls.tiles/12}}
 })
 assert.equal(performanceReport.bytesPerUpdate.full,4096*4096*4)
 assert.equal(performanceReport.bytesPerUpdate.tiles,performanceReport.tiles*32*32*4)
 assert.equal(performanceReport.callsPerUpdate.tiles,performanceReport.tiles)
 assert.deepEqual(errors,[])
 const report={date:'2026-09-10',browser:browser.version(),viewport:{width:1440,height:1000},live,visual,performance:performanceReport,limits:'Headless Chromium; timings include GPU completion and do not establish hardware FPS. Paired same-scene texture updates compare a full-atlas implementation alternative with rectangular tile uploads, not an earlier shipped footprint feature. Ordinary movement still supplies browser-owned animation eligibility; original visibility catch-up and all animation/state ownership remain open.'}
 writeFileSync('references/performance/2026-09-10-footprints.json',JSON.stringify(report,null,2)+'\n')
 console.log('PASS: real move command, footprint pixels, pause, exact partial/full GPU agreement and measured uploads',report)
} finally {await browser.close()}
