import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    window.combatModel=m;window.combatClock=await import('/app/game-clock.ts')
    w.speed=0;w.manaWorld.gameFlags=32;w.units=[];w.buildings=[];w.shrines=[];w.trees=[]
    w.terrain.fill(3);w.terrainVersion++
    window.targetHut=m.addBuilding(w,'red','hut',{x:0,z:0})
    window.attacker=m.addUnit(w,'blue','warrior',{x:0,z:8})
    w.selected=[window.attacker.id];s.focus({x:0,z:1});s.onChange()
  })
  const point=await page.evaluate(()=>{const s=window.testScene,p=s.screen(window.targetHut),r=s.container.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}})
  await page.mouse.click(point.x,point.y,{button:'right'})
  assert.equal(await page.evaluate(()=>window.attacker.target),await page.evaluate(()=>window.targetHut.id))
  await page.evaluate(()=>{
    const s=window.testScene,w=s.world
    cancelAnimationFrame(s.frame);w.paused=true;w.speed=1;w.pendingTime=0;s.gameClock.animationTime=0
    window.stepCombat=()=>{w.paused=false;window.combatClock.advanceGame(w,s.gameClock,1/12);w.paused=true;s.animate(s.previous);cancelAnimationFrame(s.frame)}
    for(let i=0;i<150&&window.attacker.native?.animationMode!==46;i++)window.stepCombat()
    window.stepCombat();window.stepCombat()
  })
  const strike=await page.evaluate(()=>{
    const s=window.testScene,u=window.attacker,b=window.targetHut,g=s.unitMeshes.get(u.id),gl=s.renderer.getContext()
    const read=()=>{s.renderer.render(s.scene,s.camera);const a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return a}
    const a=read();g.visible=false;const bPixels=read();g.visible=true
    let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==bPixels[i]||a[i+1]!==bPixels[i+1]||a[i+2]!==bPixels[i+2])pixels++
    const tilt=b.damageState.tilt,roll=b.damageState.roll
    b.damageState.tilt=b.damageState.roll=0;s.animate(s.previous);cancelAnimationFrame(s.frame)
    const still=read();let shakePixels=0
    for(let i=0;i<a.length;i+=4)if(a[i]!==still[i]||a[i+1]!==still[i+1]||a[i+2]!==still[i+2])shakePixels++
    b.damageState.tilt=tilt;b.damageState.roll=roll;s.animate(s.previous);cancelAnimationFrame(s.frame)
    return {pixels,shakePixels,phase:u.native.animationMode,object:u.native.object,damage:b.damageState.damage,tilt:s.buildingMeshes.get(b.id).userData.nativeTilt,roll:s.buildingMeshes.get(b.id).userData.nativeRoll,drawCalls:s.renderer.info.render.calls}
  })
  assert.equal(strike.phase,46);assert.ok(strike.damage>0);assert.ok(strike.pixels>5);assert.ok(strike.tilt&&strike.roll);assert.ok(strike.shakePixels>5)
  await page.screenshot({path:'/private/tmp/populous-building-strike.png'})
  const occupied=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,m=window.combatModel,b=window.targetHut,u=window.attacker
    w.paused=false;m.releaseTasks(w,u);w.paused=true
    Object.assign(u,{x:0,z:8});b.damageState=null
    const d=m.addUnit(w,'red','brave',b);d.inside=b.id;d.work=b.id
    w.paused=false;w.selected=[u.id];m.command(w,b);w.paused=true
    let ejected=false,fought=false,resumed=false,peakEffects=0,peakDraws=0
    const timings=[]
    for(let i=0;i<700&&!resumed;i++){
      const start=performance.now();window.stepCombat();timings.push(performance.now()-start)
      ejected ||= !!w.fights.find(f=>f.encounterBuilding===b.id)&&d.inside===null
      fought ||= !!u.fight&&u.fight.action!=='encounter'
      resumed=fought&&!u.fight&&b.damageState.damage>0
      peakEffects=Math.max(peakEffects,w.effects.length);peakDraws=Math.max(peakDraws,s.renderer.info.render.calls)
    }
    const p=u.native,id=p.commands[0],references=w.buildingOrders.records[id].references
    const position=s.unitMeshes.get(u.id).position.toArray()
    window.combatClock.advanceGame(w,s.gameClock,100)
    s.animate(s.previous);cancelAnimationFrame(s.frame)
    const paused=JSON.stringify(position)===JSON.stringify(s.unitMeshes.get(u.id).position.toArray())
    w.paused=false;m.command(w,{x:10,z:8});w.paused=true
    return {ejected,fought,resumed,references,paused,cancelled:w.buildingOrders.records[id].references===0&&u.native===null,peakEffects,peakDraws,timings}
  })
  for(const key of ['ejected','fought','resumed','paused','cancelled'])assert.equal(occupied[key],true,key)
  assert.equal(occupied.references,1)
  const registration=await page.evaluate(async()=>{
    const m=window.combatModel,l=await import('/app/live-people.ts'),w=m.createWorld()
    w.units=[]
    for(let i=0;i<200;i++){const u=m.addUnit(w,'blue','warrior',{x:8+i%10*.1,z:32+Math.floor(i/10)*.1});u.native=l.createLivePerson(w,u)}
    l.syncLivePersonCells(w)
    const snapshot=()=>JSON.stringify({heads:[...w.objectCells.heads],people:[...w.objectCells.objects.values()]})
    const before=snapshot(),samples={full:[],direct:[]}
    for(let pass=0;pass<12;pass++)for(const mode of pass%2?['direct','full']:['full','direct']){
      const start=performance.now()
      for(let turn=0;turn<10;turn++)for(const u of w.units.slice(0,40)){
        if(mode==='full')l.syncLivePersonCells(w)
        else l.registerLivePerson(w,u.native)
      }
      samples[mode].push((performance.now()-start)/10)
    }
    const median=a=>a.slice(2).sort((a,b)=>a-b)[5]
    return {units:200,attackers:40,fullSyncMsPerTurn:median(samples.full),directMsPerTurn:median(samples.direct),unchanged:before===snapshot()}
  })
  assert.ok(registration.unchanged);assert.ok(registration.directMsPerTurn<registration.fullSyncMsPerTurn)
  assert.deepEqual(errors,[])
  const xs=occupied.timings.slice(10).sort((a,b)=>a-b),report={date:'2026-09-10',browser:browser.version(),viewport:{width:1440,height:1000},strike,...occupied,timings:undefined,frameMs:{median:xs[Math.floor(xs.length*.5)],p95:xs[Math.floor(xs.length*.95)]},registration,limits:'Headless Chromium, not hardware FPS. Full-frame samples include one fixed turn plus presentation. Registration comparison uses the same 200-person world and 40 attacks; repeated world synchronization is an implementation alternative, not the previous shipped combat behavior. Complete native command-19/21 selection and ordinary work restoration remain open.'}
  writeFileSync('references/performance/2026-09-10-building-combat.json',JSON.stringify(report,null,2)+'\n')
  console.log('PASS: desktop building attack, original strike pixels/shaking, defender ejection, preserved order/resume and cancellation',report)
}finally{await browser.close()}
