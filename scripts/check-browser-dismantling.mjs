// Exercise actual panel input, live work/stages and cancellation with original sprites.
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const headed=process.argv.includes('--headed'),browser=await chromium.launch({headless:!headed})
try {
  const {page,errors}=await openGame(browser)
  const results=[]
  for(const cancel of [false,true]) {
    await page.evaluate(async cancel=>{
      const s=window.testScene,w=s.world,m=await import('/app/model.ts')
      w.speed=0;w.manaWorld.gameFlags=32
      // Each case owns its followers. Survivors from the dismantled first camp
      // otherwise stand on the second camp's click target and receive selection.
      if(window.dismantling){
        for(const u of window.dismantling.people)m.releaseTasks(w,u)
        w.units=w.units.filter(u=>!window.dismantling.people.includes(u))
      }
      const b=m.addBuilding(w,'blue','camp',{x:-2,z:32},true,{angle:Math.PI})
      const people=Array.from({length:8},(_,i)=>m.addUnit(w,'blue','brave',{x:7+i*.4,z:33}))
      window.dismantling={b,people,cancel,m,frames:[],stages:[],workFrames:[],phase:'entry'}
      w.selected=people.map(u=>u.id);s.focus(b);s.startGroundView(2)
      for(let i=0;i<18;i++)s.updateCameraMotion(1/24)
      s.onChange()
    },cancel)
    const target=await page.evaluate(()=>{
      const s=window.testScene,p=s.screen(window.dismantling.b),r=s.container.getBoundingClientRect()
      return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}
    })
    await page.mouse.click(target.x,target.y);await page.mouse.move(1400,50)
    await page.evaluate(()=>{
      const s=window.testScene,h=window.dismantling,after=s.gameClock.afterTurn
      s.gameClock.afterTurn=()=>{
        after()
        if(h.phase==='entry'&&h.b.admission?.inside===5&&h.people.every(u=>u.entry&&!u.entry.person.speed))s.world.speed=0
        if(h.phase==='work') {
          h.stages.push(h.m.buildingStage(h.b))
          for(const u of h.people)if(u.entry?.person.substate===3)h.workFrames.push(u.entry.person.object)
          if(h.b.progress<1){h.phase='partial';s.world.speed=0}
        }
        if(h.phase==='finish'&&h.b.hp<=0){h.phase='done';s.world.speed=0}
      }
      s.world.speed=1
    })
    await page.waitForFunction(()=>window.dismantling.b.admission?.inside===5&&window.testScene.world.speed===0)
    const button=page.locator('.training-panel:not([hidden]) .dismantle-control')
    await button.waitFor({state:'visible'})
    const before=await page.evaluate(()=>window.dismantling.people.map(u=>[u.x,u.z]))
    await button.click()
    const started=await page.evaluate(async()=>{
      const h=window.dismantling,s=window.testScene,{isDismantling}=await import('/app/live-building-entry.ts')
      return{inside:h.b.admission.inside,positions:h.people.map(u=>[u.x,u.z]),orders:h.people.every(u=>isDismantling(s.world,u))}
    })
    assert.equal(started.inside,0);assert.deepEqual(started.positions,before);assert.ok(started.orders)
    assert.equal(await button.getAttribute('aria-pressed'),'true')
    await page.mouse.move(1400,50)
    await page.evaluate(()=>{
      const s=window.testScene,h=window.dismantling,animate=s.animate
      s.animate=now=>{const start=performance.now();animate(now);if(h.phase==='work'||h.phase==='finish')h.frames.push({time:now,cpu:performance.now()-start,calls:s.renderer.info.render.calls,phase:h.phase})}
      h.phase='work';s.world.speed=1
    })
    await page.waitForFunction(()=>window.dismantling.phase==='partial')
    assert.ok(await button.isVisible(),'control stays usable while dismantling an incomplete building')
    const partial=await page.evaluate(async()=>{
      const s=window.testScene,h=window.dismantling,art=(await import('/app/original-units.json')).default
      const working=h.people.filter(u=>u.entry?.person.substate===3).map(u=>{
        const p=u.entry.person,g=s.unitMeshes.get(u.id),directions=Object.values(art.animations['blue-brave']).find(d=>d[0].source===p.object)
        return{object:p.object,frame:g.userData.frame,correct:directions?.some(d=>d.frames.includes(g.userData.frame))}
      })
      return{working,progress:h.b.progress,stage:h.m.buildingStage(h.b),workFrames:h.workFrames,visible:h.people.filter(u=>s.unitMeshes.get(u.id)?.visible).length,moved:h.people.map(u=>[u.x,u.z])}
    })
    assert.ok(partial.progress>0&&partial.progress<1);assert.ok(partial.workFrames.length);assert.ok(partial.working.length&&partial.working.every(p=>p.correct));assert.equal(partial.visible,8);assert.notDeepEqual(partial.moved,before)
    await page.screenshot({path:`/private/tmp/populous-dismantling-${cancel?'cancel':'work'}.png`})
    if(cancel) {
      await button.click()
      const remaining=await page.evaluate(()=>window.dismantling.b.damageState.plan.remaining)
      await page.evaluate(()=>{window.dismantling.until=window.testScene.world.turn+30;window.testScene.world.speed=1})
      await page.waitForFunction(()=>window.testScene.world.turn>=window.dismantling.until)
      await page.evaluate(()=>window.testScene.world.speed=0)
      assert.equal(await page.evaluate(()=>window.dismantling.b.damageState.plan.remaining),remaining)
      assert.equal(await page.evaluate(()=>window.dismantling.b.admission.activity&0x8000),0)
    } else {
      await page.evaluate(()=>{window.dismantling.phase='finish';window.testScene.world.speed=1})
      await page.waitForFunction(()=>window.dismantling.phase==='done')
      await page.waitForFunction(()=>!document.querySelector('.training-panel'))
      const result=await page.evaluate(()=>{
        const s=window.testScene,h=window.dismantling,w=s.world,gl=s.renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info')
        const frames=h.frames,gaps=frames.slice(1).flatMap((f,i)=>f.phase===frames[i].phase?[f.time-frames[i].time]:[])
        const q=(a,n)=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*n)]
        return{removed:!w.buildings.includes(h.b),dismantled:h.b.dismantled,timber:h.people.reduce((n,u)=>n+u.cargo,0)+w.trees.filter(t=>t.model===11).reduce((n,t)=>n+t.logs,0),
          performance:{userAgent:navigator.userAgent,renderer:gl.getParameter(info.UNMASKED_RENDERER_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,frames:frames.length,cpu:{p50:q(frames.map(f=>f.cpu),.5),p95:q(frames.map(f=>f.cpu),.95)},gaps:{p50:q(gaps,.5),p95:q(gaps,.95),max:Math.max(...gaps)},maxDrawCalls:Math.max(...frames.map(f=>f.calls))}}
      })
      assert.ok(result.removed&&result.dismantled);assert.equal(result.timber,8);results.push(result)
    }
    results.push({cancel,partial})
  }
  assert.deepEqual(errors,[])
  writeFileSync('/private/tmp/populous-dismantling-browser.json',JSON.stringify({headed,results},null,2)+'\n')
  console.log('PASS: real dismantle/cancel input, five residents and three queued braves, no teleport, visible work sprites and staged removal, full timber recovery and cancellation',results)
} finally {await browser.close()}
