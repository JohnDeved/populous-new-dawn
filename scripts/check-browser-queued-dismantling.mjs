import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser=await chromium.launch({headless:true}), reports=[]
try {
  for(const viewport of [{width:1440,height:1000},{width:3440,height:1440}]) {
    const {page,errors}=await openGame(browser)
    await page.setViewportSize(viewport)
    await page.evaluate(async()=>{
      const s=window.testScene,w=s.world,m=await import('/app/model.ts')
      const {dismantleBuilding}=await import('/app/live-building-entry.ts')
      cancelAnimationFrame(s.frame)
      const version=w.terrainVersion+1
      Object.assign(w,m.createWorld(),{units:[],buildings:[],trees:[],shrines:[],inputMask:0,speed:0})
      w.terrain.fill(3);w.terrainVersion=version;w.manaWorld.gameFlags=32;w.flyby.flags=0
      const b=m.addBuilding(w,'blue','hut',{x:0,z:8});dismantleBuilding(w,b)
      const people=Array.from({length:3},(_,i)=>m.addUnit(w,'blue','brave',{x:-20+i/2,z:8}))
      const warrior=m.addUnit(w,'blue','warrior',{x:-22,z:8})
      window.queuedWork={b,people,warrior}
      m.setSelection(w,[...people,warrior].map(u=>u.id))
      s.focus({x:0,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
    })
    for(const [x,ctrl] of [[-10,true],[0,true],[20,false]]) {
      const point=await page.evaluate(x=>{
        const s=window.testScene,p=s.screen({x,z:8}),r=s.container.getBoundingClientRect()
        return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
      },x)
      if(ctrl)await page.keyboard.down('Control')
      await page.mouse.click(point.x,point.y)
      if(ctrl)await page.keyboard.up('Control')
    }
    const result=await page.evaluate(async()=>{
      const s=window.testScene,w=s.world,{b,people,warrior}=window.queuedWork
      const {advanceGame}=await import('/app/game-clock.ts')
      const {default:sprites}=await import('/app/original-units.json')
      const workObject=sprites.animations['blue-brave'].work[0].source
      const person=u=>u.native??u.entry?.person
      const states=people.map(person),timings=[]
      const models=people.map(u=>person(u).commands.filter(Boolean).map(id=>w.buildingOrders.records[id].model))
      const warriorOrders=person(warrior).commands.filter(Boolean).map(id=>w.buildingOrders.records[id].model)
      const beforeWork=people.every(u=>u.work===null),initialTimber=b.logs
      const advance=()=>{w.speed=1;const t=performance.now();advanceGame(w,s.gameClock,1/12);timings.push(performance.now()-t);w.speed=0}
      for(let i=0;i<400&&!people.some(u=>u.entry?.person.substate===3&&u.entry.person.object===workObject);i++)advance()
      s.cameraBearing=Math.PI;s.focus({x:0,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
      const frames=new Set(sprites.animations['blue-brave'].work.flatMap(d=>d.frames))
      const meshes=people.filter(u=>u.entry?.person.substate===3&&u.entry.person.object===workObject).map(u=>s.unitMeshes.get(u.id))
      const poses=people.map(u=>({id:u.id,mode:u.entry?.person.animationMode,object:u.entry?.person.object,frame:s.unitMeshes.get(u.id)?.userData.frame,visible:s.unitMeshes.get(u.id)?.visible,workObject}))
      const working=meshes.length>0&&meshes.every(g=>g?.visible&&frames.has(g.userData.frame))
      const identity=people.every((u,i)=>person(u)===states[i])
      const gl=s.renderer.getContext(),read=()=>{
        s.renderer.render(s.scene,s.camera)
        const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4)
        gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p)
        return p
      }
      const bearings=[]
      for(const bearing of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
        s.cameraBearing=bearing;s.updateView()
        const before=read();meshes.forEach(g=>g.visible=false);const after=read();meshes.forEach(g=>g.visible=true)
        let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
        bearings.push({bearing,pixels})
      }
      const pixels=Math.max(...bearings.map(b=>b.pixels))
      const frozen=JSON.stringify({turn:w.turn,people,b})
      w.paused=true;w.speed=1;advanceGame(w,s.gameClock,10);w.paused=false;w.speed=0
      const paused=frozen===JSON.stringify({turn:w.turn,people,b})
      for(let i=0;i<800&&w.buildingOrders.active;i++)advance()
      const sorted=timings.toSorted((a,b)=>a-b),info=gl.getExtension('WEBGL_debug_renderer_info')
      return {viewport:[innerWidth,innerHeight],models,warriorOrders,beforeWork,identity,working,pixels,bearings,poses,paused,
        removed:!w.buildings.includes(b)&&b.dismantled,arrived:[...people,warrior].every(u=>u.hp>0&&u.x>18),orders:w.buildingOrders.active,
        initialTimber,timber:people.reduce((n,u)=>n+u.cargo,0)+w.trees.filter(t=>t.model===11).reduce((n,t)=>n+t.logs,0),
        performance:{renderer:info&&gl.getParameter(info.UNMASKED_RENDERER_WEBGL),samples:sorted.length,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)}}
    })
    assert.ok(result.models.every(m=>m.join()==='3,10,3'));assert.deepEqual(result.warriorOrders,[3,3])
    for(const k of ['beforeWork','identity','working','paused','removed','arrived'])assert.equal(result[k],true,`${k}: ${JSON.stringify(result)}`)
    assert.ok(result.pixels>5,JSON.stringify(result));assert.equal(result.orders,0);assert.equal(result.timber,result.initialTimber)
    assert.deepEqual(errors,[]);reports.push(result);await page.close()
  }
  writeFileSync('references/performance/2026-09-11-queued-dismantling.json',JSON.stringify({browser:await browser.version(),reports,
    limitation:'Real Ctrl movement/work/movement clicks, four followers, original work sprite pixels and complete simulation-turn CPU samples. Headless software rendering/coarse browser timer; no hardware FPS or before/after speedup claim.'},null,2)+'\n')
  console.log(JSON.stringify(reports,null,2))
}finally{await browser.close()}
