import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import sprites from '../app/original-units.json' with {type:'json'}

const headed=process.argv.includes('--headed'),browser=await chromium.launch({headless:!headed})
try{
  const {page,errors}=await openGame(browser)
  const ids=await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    w.speed=0;w.units=[];w.buildings=[];w.shrines=[];w.fights=[];w.pendingTime=0
    w.terrain.fill(3);w.terrainVersion++
    const a=m.addUnit(w,'blue','warrior',{x:0,z:32}),b=m.addUnit(w,'red','warrior',{x:1,z:32})
    w.selected=[a.id];m.command(w,b)
    window.encounterClock={animationTime:0,animationFrame:0}
    s.focus({x:0,z:32});s.startGroundView(3)
    for(let i=0;i<18;i++)s.updateCameraMotion(1/24)
    s.onChange();return [a.id,b.id]
  })
  const phases=[]
  for(const phase of [6,7,25]){
    const state=await page.evaluate(async({phase,ids})=>{
      const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts')
      for(let i=0;i<80;i++){
        w.speed=1;advanceGame(w,window.encounterClock,1/12);w.speed=0
        const people=ids.map(id=>w.units.find(u=>u.id===id))
        const p=people[phase===7?1:0]?.fight?.motion
        if((phase===25?p?.state===25:p?.substate===phase&&p.object===(phase===6?120:128))){
          s.onChange()
          return {phase,people:people.map(u=>({id:u.id,hp:u.hp,x:u.x,z:u.z,source:u.fight.motion.object,state:u.fight.motion.state,phase:u.fight.motion.substate})),members:w.fights[0].members,angle:w.fights[0].angle}
        }
      }
      throw Error(`Encounter never reached ${phase}`)
    },{phase,ids})
    const who=phase===7?1:0,expected=phase===6?'attack':phase===7?'stagger':'idle'
    await page.waitForFunction(({id,expected})=>window.testScene.unitMeshes.get(id)?.userData.state===expected,{id:ids[who],expected})
    const pose=await page.evaluate(id=>{
      const g=window.testScene.unitMeshes.get(id)
      return {visible:g.visible,state:g.userData.state,frame:g.userData.frame}
    },ids[who])
    assert.equal(pose.visible,true)
    const signature=who?'red-warrior':'blue-warrior'
    assert.ok(sprites.animations[signature][expected].some(d=>d.frames.includes(pose.frame)),`${expected} must render its original source`)
    assert.deepEqual(state.people.map(p=>p.hp),[90,90])
    if(phase===7){assert.equal(state.people[1].source,128);assert.ok(Math.hypot(state.people[1].x-1,state.people[1].z-32)>.01)}
    if(phase===25){assert.equal(state.members[0],ids[1]);assert.ok(state.angle<360)}
    phases.push({...state,pose})
    await page.screenshot({path:`/private/tmp/populous-encounter-${phase}.png`})
  }
  const sound=await page.evaluate(()=>window.testScene.world.sounds.some(s=>s.cue===13))
  assert.equal(sound,true)
  // New encounters remain part of the measured workload, followed by live melee.
  await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    w.speed=0;w.units=[];w.fights=[];w.pendingTime=0
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const x=col*6-9,z=row*6+8
      const a=m.addUnit(w,'blue','warrior',{x,z}),b=m.addUnit(w,'red','warrior',{x:x+1,z})
      w.selected=[a.id];m.command(w,b)
    }
    w.selected=[];s.focus({x:0,z:20});s.onChange()
  })
  await page.waitForFunction(()=>window.testScene.unitMeshes.size===32)
  const cdp=process.argv.includes('--profile')?await page.context().newCDPSession(page):null
  if(cdp){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
  await page.evaluate(()=>{
    const s=window.testScene,animate=s.animate.bind(s),frames=[],start=performance.now()
    const gl=s.renderer.getContext(),upload=gl.texSubImage2D,uploads=[]
    window.encounterProfile={frames,uploads}
    gl.texSubImage2D=function(...args){
      const before=performance.now(),result=upload.apply(this,args),data=args.at(-1)
      uploads.push({ms:performance.now()-before,time:before,width:args.length>=9?args[4]:data.width,height:args.length>=9?args[5]:data.height,bytes:data.byteLength,source:data.src})
      return result
    }
    s.animate=now=>{
      const before=performance.now();animate(now)
      frames.push({cpu:performance.now()-before,time:before,turn:s.world.turn,encounters:s.world.fights.filter(b=>b.encounter).length,calls:s.renderer.info.render.calls})
      if(performance.now()-start>=6000){window.encounterProfile.done=true;s.world.speed=0;s.animate=animate;gl.texSubImage2D=upload}
    }
    s.world.speed=1
  })
  await page.waitForFunction(()=>window.encounterProfile.done)
  if(cdp)writeFileSync('/private/tmp/populous-encounter.cpuprofile',JSON.stringify((await cdp.send('Profiler.stop')).profile))
  const performance=await page.evaluate(()=>{
    const s=window.testScene,f=window.encounterProfile.frames,gl=s.renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info')
    const summary=values=>{values.sort((a,b)=>a-b);const q=p=>values[Math.floor((values.length-1)*p)];return {count:values.length,p50:q(.5),p95:q(.95),p99:q(.99),max:q(1)}}
    return {uploads:window.encounterProfile.uploads,userAgent:navigator.userAgent,renderer:gl.getParameter(info.UNMASKED_RENDERER_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,cpu:summary(f.map(v=>v.cpu)),encounterCpu:summary(f.filter(v=>v.encounters).map(v=>v.cpu)),worstFrames:[...f].sort((a,b)=>b.cpu-a.cpu).slice(0,8),maxDrawCalls:Math.max(...f.map(v=>v.calls))}
  })
  assert.ok(performance.encounterCpu.count>20);assert.deepEqual(errors,[])
  assert.equal(performance.uploads.filter(u=>u.source?.endsWith('/effects.png')).length,0,'effects atlas must be uploaded during scene loading, not on the first melee hit')
  const result={headed,phases,sound,performance,workload:'16 newly initiated warrior encounters followed by melee over six seconds, after terrain and sprite setup. Unpaired bounded CPU sample; callback cadence is not physical display FPS, no speedup or whole-engine claim.'}
  writeFileSync('/private/tmp/populous-encounter-browser.json',JSON.stringify(result,null,2)+'\n')
  console.log('PASS: original encounter poses, physics, sound, handoff and no first-hit atlas upload', {...result,performance:{...performance,uploads:performance.uploads.length}})
}finally{await browser.close()}
