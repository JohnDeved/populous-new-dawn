// Native floating-panel artwork and live modern display integration.
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import fixture from '../tests/fixtures/training-panel.json' with {type:'json'}

const browser=await chromium.launch({headless:!process.argv.includes('--headed')})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(async()=>{
    const s=window.testScene,w=s.world,m=await import('/app/model.ts')
    w.speed=0;w.manaWorld.gameFlags=32
    const b=m.addBuilding(w,'blue','camp',{x:-2,z:32},true,{angle:Math.PI})
    const people=Array.from({length:5},(_,i)=>m.addUnit(w,'blue','brave',{x:7+i*.4,z:33}))
    w.selected=people.map(u=>u.id);window.panelCheck={b,people}
    s.focus(b);s.startGroundView(2)
    for(let i=0;i<18;i++)s.updateCameraMotion(1/24)
    s.onChange()
  })
  const point=await page.evaluate(()=>{
    const s=window.testScene,p=s.screen(window.panelCheck.b),r=s.container.getBoundingClientRect()
    return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  })
  await page.mouse.click(point.x,point.y,{button:'right'});await page.mouse.move(1400,50)
  await page.evaluate(()=>{
    const s=window.testScene,after=s.gameClock.afterTurn
    s.gameClock.afterTurn=()=>{after();if(window.panelCheck.b.admission?.inside===5)s.world.speed=0}
    s.world.speed=1
  })
  await page.waitForFunction(()=>window.panelCheck.b.admission?.inside===5&&window.testScene.world.speed===0)
  const panel=page.locator('.training-panel:not([hidden])')
  await panel.waitFor({state:'visible'})
  assert.match(await panel.getAttribute('aria-label'),/5 of 5/)
  // A stationary panel must reuse its bitmap while RAF continues.
  const cached=await page.evaluate(async()=>{
    const canvas=document.querySelector('.training-panel'),ctx=canvas.getContext('2d'),draw=ctx.drawImage
    let paints=0;ctx.drawImage=function(...args){paints++;return draw.apply(this,args)}
    const initial=canvas.dataset.layout
    await new Promise(resolve=>{let n=0;function frame(){if(++n===30)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)})
    ctx.drawImage=draw
    return{paints,same:canvas.dataset.layout===initial}
  })
  assert.deepEqual(cached,{paints:0,same:true})
  const geometry=[]
  for(const [width,height,scale] of [[1440,1000,2],[1920,1080,2],[2560,1440,2.5],[3440,1440,2.5],[3840,2160,2.5]]){
    await page.setViewportSize({width,height})
    await page.waitForFunction(({width,scale})=>window.testScene.container.clientWidth===width-scale*100,{width,scale})
    await page.evaluate(()=>window.testScene.renderTrainingPanels())
    const g=await panel.evaluate(canvas=>{
      const s=window.testScene,r=canvas.getBoundingClientRect(),v=s.container.getBoundingClientRect(),p=s.screen(window.panelCheck.b)
      return{width:r.width,height:r.height,native:[canvas.width,canvas.height],anchor:[v.x+(p.x+1)*v.width/2,v.y+(1-p.y)*v.height/2],tail:[r.x+r.width/2,r.bottom]}
    })
    assert.equal(g.width,120*scale);assert.equal(g.height,68*scale)
    assert.ok(Math.abs(g.anchor[0]-g.tail[0])<.1&&Math.abs(g.anchor[1]-g.tail[1])<.1)
    geometry.push({width,height,scale,...g})
  }
  await page.setViewportSize({width:1440,height:1000})
  await page.waitForFunction(()=>window.testScene.container.clientWidth===1240)
  await page.screenshot({path:'/private/tmp/populous-training-panel.png'})
  // Exercise captured art states through the actual browser canvas at native size.
  const cases=fixture.cases.filter(c=>c.cost===480&&c.progress===160)
  const pixels=await page.evaluate(async cases=>{
    const{drawTrainingPanel}=await import('/app/training-panel.ts')
    const atlas=new Image();atlas.src='/original/hud.png';await atlas.decode()
    const canvas=document.createElement('canvas'),results=[]
    for(const c of cases){
      drawTrainingPanel(canvas,atlas,c)
      results.push({state:c,png:canvas.toDataURL('image/png').split(',')[1]})
    }
    return results
  },cases)
  writeFileSync('/private/tmp/populous-training-panel-pixels.json',JSON.stringify(pixels))
  // Camera turns move the tail with the building; globe/blocked input hides it.
  await page.evaluate(()=>{const s=window.testScene;s.cameraBearing+=Math.PI/2;s.updateView();s.renderTrainingPanels()})
  await page.screenshot({path:'/private/tmp/populous-training-panel-rotated.png'})
  await page.evaluate(()=>{const s=window.testScene;s.world.inputMask=64;s.renderTrainingPanels()})
  await panel.waitFor({state:'hidden'})
  await page.evaluate(()=>{const s=window.testScene;s.world.inputMask=0;window.panelCheck.b.hp=0;s.renderTrainingPanels()})
  assert.equal(await page.locator('.training-panel').count(),0)
  assert.deepEqual(errors,[])
  writeFileSync('/private/tmp/populous-training-panel-browser.json',JSON.stringify({geometry,cached,pixelStates:pixels.length},null,2)+'\n')
  console.log('PASS: real training input, five live occupants, cached bitmap, five desktop sizes, anchored tail, camera rotation, blocked-input hiding and destroyed-building cleanup', {pixelStates:pixels.length})
}finally{await browser.close()}
