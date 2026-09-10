// Actual desktop cast, head/flash handoff, smooth flight and native launch visits.
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame,effectPixels} from './browser-game.mjs'
import fixture from '../tests/fixtures/blast-impact.json' with {type:'json'}

const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    window.blastModel=m;window.blastClock=await import('/app/game-clock.ts')
    w.speed=0;w.manaWorld.gameFlags=32
    const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    Object.assign(shaman,{x:6,z:30,path:[],casting:null})
    w.units=[shaman];w.selected=[shaman.id];w.castingTribes[0].cooldown=0;w.shots.blast=4
    s.focus({x:12,z:31});s.onChange()
  })
  await page.keyboard.press('1')
  const point=await page.evaluate(()=>{
    const s=window.testScene,p=s.screen({x:12,z:31}),r=s.container.getBoundingClientRect()
    return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  })
  await page.mouse.click(point.x,point.y)
  await page.evaluate(()=>{
    const s=window.testScene,w=s.world,m=window.blastModel,shot=w.projectiles[0]
    if(!shot)throw Error('Mouse cast did not create a projectile')
    cancelAnimationFrame(s.frame);w.paused=true;w.speed=1;w.pendingTime=0;s.gameClock.animationTime=0
    window.blastShot=shot
    const p=shot.target
    window.blastEnemy=m.addUnit(w,'red','brave',{x:p.x+3,z:p.z})
    window.blastAlly=m.addUnit(w,'blue','brave',{x:p.x-3,z:p.z})
    window.blastEnemy.hp=window.blastAlly.hp=1000
    window.drawBlast=()=>{s.animate(s.previous);cancelAnimationFrame(s.frame)}
    window.stepBlast=dt=>{w.paused=false;window.blastClock.advanceGame(w,s.gameClock,dt);w.paused=true;window.drawBlast()}
    window.stepBlast(6/12)
  })
  const smooth=await page.evaluate(()=>{
    const s=window.testScene,shot=window.blastShot,points=[]
    for(let i=0;i<40;i++){
      window.stepBlast(1/240)
      const g=s.fxMeshes.get(shot.visuals[0].id)
      points.push(g.position.toArray())
    }
    return {positions:new Set(points.map(p=>JSON.stringify(p))).size,points}
  })
  assert.ok(smooth.positions>15)
  const headId=await page.evaluate(()=>{
    const s=window.testScene,shot=window.blastShot
    for(let i=0;shot.phase!=='arrived'&&i<30;i++)window.stepBlast(1/12)
    if(shot.phase!=='arrived')throw Error('Projectile did not arrive')
    window.stepBlast(1/24)
    return shot.visuals[0].id
  })
  const headPixels=await effectPixels(page,[headId])
  assert.ok(headPixels>5,'head still draws during arrival turn')
  const pause=await page.evaluate(()=>{
    const s=window.testScene,head=window.blastShot.visuals[0],g=s.fxMeshes.get(head.id),before=g.position.toArray()
    window.blastClock.advanceGame(s.world,s.gameClock,100);window.drawBlast()
    return {before,after:g.position.toArray()}
  })
  assert.deepEqual(pause.before,pause.after)
  const timeline=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,head=window.blastShot.visuals[0],rows=[]
    let enemy=false,ally=false
    for(let i=0;i<6;i++){
      enemy ||= !!window.blastEnemy.flight;ally ||= !!window.blastAlly.flight
      const g=s.fxMeshes.get(head.id)
      rows.push({head:!!g&&g.userData.sprite.material.opacity>0,enemy,ally})
      window.stepBlast(i===0?1/24:1/12)
    }
    return rows
  })
  assert.deepEqual(timeline,fixture.timeline)
  await page.screenshot({path:'/private/tmp/populous-blast-impact.png'})
  const performanceResult=await page.evaluate(()=>{
    const s=window.testScene,source=window.blastShot.visuals[0],world={...s.world,projectiles:[]},motion=s.projectileMotion
    // Same 40-shot / 1,000-effect workload on both paths; only attached artwork gets history.
    for(let i=0;i<40;i++)world.projectiles.push({visuals:Array.from({length:5},()=>({...source}))})
    const effects=world.projectiles.flatMap(p=>p.visuals)
    effects.push(...Array.from({length:800},()=>({...source})))
    const samples={direct:[],interpolated:[]},result={x:0,y:0,z:0}
    for(let pass=0;pass<12;pass++)for(const mode of pass%2?['interpolated','direct']:['direct','interpolated']){
      const start=performance.now()
      for(let frame=0;frame<240;frame++){
        if(frame%20===0){
          if(mode==='interpolated')motion.beforeTurn(world)
          for(const shot of world.projectiles)for(const f of shot.visuals)f.x+=.1
          if(mode==='interpolated')motion.afterTurn(world)
        }
        world.pendingTime=(frame%20)/240
        for(const f of effects){
          result.x=f.x;result.y=Math.round(f.height*45)/128;result.z=f.z
          if(mode==='interpolated')motion.position(world,f,result)
        }
      }
      samples[mode].push((performance.now()-start)/240)
    }
    const median=xs=>xs.slice(2).sort((a,b)=>a-b)[5]
    return {shots:40,effects:1000,directMs:median(samples.direct),interpolatedMs:median(samples.interpolated)}
  })
  assert.deepEqual(errors,[])
  const report={date:'2026-09-10',browser:browser.version(),viewport:{width:1440,height:1000},headPixels,smoothPositions:smooth.positions,timeline,performance:performanceResult,limits:'Headless Chromium CPU microbenchmark, not hardware FPS or a performance improvement claim. Reused snapshots at 12 Hz, in-place interpolation at 240 Hz; fixed simulation and sprite clocks unchanged. Complete native mixed-class scheduling remains open.'}
  writeFileSync('references/performance/2026-09-10-blast-impact.json',JSON.stringify(report,null,2)+'\n')
  console.log('PASS: desktop cast, arrival pixels, smooth/pause-safe head, native enemy/allied launch timing',report)
}finally{await browser.close()}
