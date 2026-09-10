import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'

const browser=await chromium.launch({headless:true}),views=[]
try {
  for(const [width,height,deviceScaleFactor] of [[1440,1000,1],[3440,1440,1],[1920,1080,2]]) {
    const {page,errors}=await openGame(browser)
    await page.setViewportSize({width,height})
    const cdp=await page.context().newCDPSession(page)
    await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile:false})
    const before=await page.evaluate(async()=>{
      const s=window.testScene,w=s.world,m=await import('/app/model.ts')
      w.speed=0;w.paused=false;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.effects=[];w.selected=[];w.manaWorld.gameFlags=32
      w.terrain.fill(384/45);w.terrainVersion++;w.land.heights.fill(384);w.land.flags.fill(0)
      const u=m.addUnit(w,'blue','brave',{x:0,z:8})
      m.setSelection(w,[u.id]);m.command(w,{x:8,z:8});m.cancelInteraction(w)
      s.focus(u);s.onChange();s.personPanels.open(u.id,true);w.paused=true
      window.markerCues=[];const sound=s.onSound.bind(s);s.onSound=(cue,...args)=>{window.markerCues.push(cue);return sound(cue,...args)}
      return {queue:JSON.stringify([u.native.commands,u.native.commandCursor,w.buildingOrders.records]),counter:w.effectCounter}
    })
    const button=page.locator('.person-panel button:not([hidden])').first()
    await button.click({button:'right'})
    const marker=await page.evaluate(()=>{
      const s=window.testScene,w=s.world,f=w.effects.find(f=>f.kind==='orderMarker')
      if(!f)throw Error('Actual order-icon click did not emit a marker')
      cancelAnimationFrame(s.frame);w.paused=true
      window.drawMarker=()=>{s.animate(s.previous);cancelAnimationFrame(s.frame)}
      window.drawMarker()
      return {id:f.id,counter:w.effectCounter,sequence:s.fxMeshes.get(f.id).userData.sequence,cues:window.markerCues,queue:JSON.stringify([w.units[0].native.commands,w.units[0].native.commandCursor,w.buildingOrders.records])}
    })
    assert.deepEqual(marker.cues,[106,106])
    assert.equal(marker.counter,before.counter)
    assert.equal(marker.queue,before.queue)
    assert.equal(marker.sequence,'hit')
    const pixels=await effectPixels(page,[marker.id])
    assert.ok(pixels>30,`marker must reach GPU pixels (${pixels})`)
    const rendering=await page.evaluate(id=>{
      const s=window.testScene,g=s.fxMeshes.get(id),r=s.renderer
      const measure=()=>{r.render(s.scene,s.camera);return {calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures}}
      g.visible=false;const without=measure();g.visible=true;const withMarker=measure()
      return {without,withMarker,sprites:g.children.length}
    },marker.id)
    assert.equal(rendering.sprites,1)
    assert.equal(rendering.withMarker.textures,rendering.without.textures)
    assert.equal(rendering.withMarker.triangles-rendering.without.triangles,2)
    if(width===1440) {
      await page.evaluate(id=>{
        const s=window.testScene,f=s.world.effects.find(f=>f.id===id)
        f.animation.f1=8;s.world.paused=false;s.onChange();window.drawMarker()
      },marker.id)
      await page.screenshot({path:'/private/tmp/populous-order-marker.png'})
      await page.evaluate(id=>{
        const s=window.testScene;s.world.effects.find(f=>f.id===id).animation.f1=0;s.world.paused=true;window.drawMarker()
      },marker.id)
    }
    const state=await page.evaluate(async id=>{
      const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts'),f=w.effects.find(f=>f.id===id)
      const before=JSON.stringify(f)
      advanceGame(w,s.gameClock,120);window.drawMarker()
      const paused=JSON.stringify(f)===before
      w.speed=1;w.pendingTime=0;s.gameClock.animationTime=0
      const alive=[]
      for(let i=0;i<4;i++) {
        w.paused=false;advanceGame(w,s.gameClock,1/12);w.paused=true;window.drawMarker()
        alive.push(w.effects.some(f=>f.id===id))
      }
      return {paused,alive,removed:!s.fxMeshes.has(id)}
    },marker.id)
    assert.deepEqual(state,{paused:true,alive:[true,true,true,false],removed:true})
    assert.deepEqual(errors,[])
    views.push({width,height,deviceScaleFactor,pixels,rendering,...state})
    await page.close()
  }
  writeFileSync('/private/tmp/populous-order-marker-browser.json',JSON.stringify({views},null,2))
  console.log('PASS: actual order-icon emission, native double UI cue, unchanged queue/counter, visible GPU pixels, pause and four-turn mesh disposal at desktop/ultrawide/2x DPI')
} finally {await browser.close()}
