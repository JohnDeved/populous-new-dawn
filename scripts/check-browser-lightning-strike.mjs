import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    window.strikeModel=m
    w.manaWorld.gameFlags=32
    w.units=w.units.filter(u=>u.kind==='shaman')
    const shaman=w.units.find(u=>u.team==='blue')
    Object.assign(shaman,{x:8,z:30,path:[],casting:null})
    w.selected=[shaman.id];w.shots.lightning=1;w.speed=.2
    s.focus({x:13,z:32});s.onChange()
  })
  await page.keyboard.press('3')
  const target=await page.evaluate(()=>{
    const s=window.testScene,p=s.screen({x:14,z:33}),r=s.container.getBoundingClientRect()
    return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  })
  await page.mouse.click(target.x,target.y)
  await page.waitForFunction(()=>{
    const s=window.testScene,fx=s.world.effects.find(f=>f.lightning?.turn===-1)
    if(!fx)return false
    s.world.paused=true;window.strikeBolt=fx;return true
  },null,{timeout:20000})
  await page.evaluate(()=>{
    const s=window.testScene,w=s.world,m=window.strikeModel,p=m.browserPosition(window.strikeBolt.lightning.target)
    cancelAnimationFrame(s.frame)
    window.strikeVictim=m.addUnit(w,'red','warrior',p)
    window.strikeSurvivor=m.addUnit(w,'blue','brave',{x:p.x+2,z:p.z})
    window.strikeTimings=[]
    window.stepStrike=()=>{
      const t=performance.now();w.paused=false;m.tick(w,1/12);w.paused=true
      const simulated=performance.now();s.animate(s.previous);cancelAnimationFrame(s.frame)
      window.strikeTimings.push({simulation:simulated-t,presentation:performance.now()-simulated,draws:s.renderer.info.render.calls,phase:window.strikeVictim.native?.substate})
    }
    window.stepStrike();window.stepStrike()
  })
  const visible=await page.evaluate(()=>{
    const s=window.testScene,u=window.strikeVictim,g=s.unitMeshes.get(u.id),gl=s.renderer.getContext()
    const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
    const a=read();g.visible=false;const b=read();g.visible=true
    let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])pixels++
    return {pixels,state:u.native.state,phase:u.native.substate,object:u.native.object,draw:u.native.draw,frame:g.userData.frame,layers:g.userData.layers.length,lightning:window.strikeBolt.lightning.turn,wave:s.world.effects.find(f=>f.wave)?.wave}
  })
  assert.equal(visible.state,44);assert.equal(visible.phase,2);assert.equal(visible.object,776)
  assert.equal(visible.draw,14);assert.ok(visible.layers>0);assert.ok(visible.pixels>10)
  assert.equal(visible.lightning,1);assert.equal(visible.wave.scatter,true);assert.equal(visible.wave.remaining,3)
  await page.screenshot({path:'/private/tmp/populous-lightning-electrocution.png'})
  const result=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,victim=window.strikeVictim,survivor=window.strikeSurvivor
    let flight=false
    for(let i=0;i<100;i++){window.stepStrike();flight ||= !!survivor.flight}
    return {flight,removed:!w.units.includes(victim),staleMesh:s.unitMeshes.has(victim.id),samples:window.strikeTimings}
  })
  assert.ok(result.flight);assert.ok(result.removed);assert.equal(result.staleMesh,false)
  assert.deepEqual(errors,[])
  const percentile=(key,p)=>{const xs=result.samples.slice(2).map(s=>s[key]).sort((a,b)=>a-b);return xs[Math.floor((xs.length-1)*p)]}
  const report={date:'2026-09-10',browser:browser.version(),viewport:{width:1440,height:1000},visible,flight:result.flight,removed:result.removed,simulationMs:{median:percentile('simulation',.5),p95:percentile('simulation',.95)},presentationMs:{median:percentile('presentation',.5),p95:percentile('presentation',.95)},maxDrawCalls:Math.max(...result.samples.map(s=>s.draws)),limits:'Headless Chromium CPU measurements, not hardware FPS or a before/after performance claim. Reuses native sprite batching and existing impulse physics; no per-render simulation work.'}
  writeFileSync('references/performance/2026-09-10-lightning-strike.json',JSON.stringify(report,null,2)+'\n')
  console.log('PASS: real desktop Lightning input, GPU electrocution pose, staged shockwave, survivor flight and victim/mesh cleanup',report)
}finally{await browser.close()}
