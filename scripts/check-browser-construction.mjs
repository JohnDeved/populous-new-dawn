// Real placement, timber delivery and rendered construction stages.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import sprites from '../app/original-units.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{
    const s=window.testScene,w=s.world
    w.speed=0;window.builder=w.units.find(u=>u.team==='blue'&&u.kind==='brave')
    w.selected=[window.builder.id];s.focus({x:4,z:32});s.onChange()
  })
  await page.waitForFunction(()=>!window.testScene.cameraMotion.active)
  await page.getByRole('button',{name:'buildings B',exact:true}).click()
  await page.getByRole('button',{name:'Hut, 3 wood',exact:true}).click()
  const point=await page.evaluate(()=>{
    const s=window.testScene,p={x:4.3,z:32.3},q=s.screen(p,Math.max(0,s.y(p))),r=s.container.getBoundingClientRect()
    return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}
  })
  await page.mouse.move(point.x,point.y)
  await page.waitForFunction(()=>window.testScene.cursor.visible&&!window.testScene.cursor.userData.invalid)
  await page.mouse.click(point.x,point.y)
  await page.waitForFunction(()=>window.testScene.world.buildings.some(b=>b.progress===0))
  await page.mouse.move(1300,950)
  await page.evaluate(()=>{const s=window.testScene;window.building=s.world.buildings.find(b=>b.progress===0);s.focus(window.building);s.startGroundView(2)})
  await page.waitForFunction(()=>!window.testScene.cameraMotion.active)
  await page.evaluate(()=>{window.testScene.world.speed=4})
  const snapshots=[]
  for(let log=1;log<=3;log++){
    await page.waitForFunction(log=>{
      const s=window.testScene,u=window.builder
      if(window.building.logs!==log-1||!u.delivery||u.delivery.remaining<2)return false
      s.world.speed=0;return true
    },log)
    await page.waitForFunction(()=>window.testScene.unitMeshes.get(window.builder.id)?.userData.state==='carryIdle')
    const waiting=await page.evaluate(()=>({cargo:window.builder.cargo,remaining:window.builder.delivery.remaining,progress:window.building.progress,frame:window.testScene.unitMeshes.get(window.builder.id).userData.frame}))
    assert.equal(waiting.cargo,1);assert.equal(waiting.progress,(log-1)/3)
    assert.ok(sprites.animations['blue-brave'].carryIdle.some(d=>d.frames.includes(waiting.frame)))
    await page.evaluate(()=>{window.testScene.world.speed=4})
    await page.waitForFunction(log=>{const s=window.testScene,b=window.building;if(b.logs!==log)return false;s.world.speed=0;return true},log)
    const expected=[1,2,4][log-1]
    await page.waitForFunction(stage=>window.testScene.buildingMeshes.get(window.building.id)?.children[0].userData.stage===stage,expected)
    const snapshot=await page.evaluate(()=>{
      const s=window.testScene,b=window.building,g=s.buildingMeshes.get(b.id),mesh=g.children[0],gl=s.renderer.getContext()
      const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
      const before=read();g.visible=false;const after=read();g.visible=true
      let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
      return {logs:b.logs,progress:b.progress,stage:mesh.userData.stage,pixels,vertices:mesh.geometry.getAttribute('position').count}
    })
    assert.equal(snapshot.progress,log/3);assert.equal(snapshot.stage,expected);assert.ok(snapshot.pixels>100,JSON.stringify(snapshot))
    snapshots.push(snapshot)
    await page.screenshot({path:`/private/tmp/populous-construction-v122-${log}.png`})
    if(log<3)await page.evaluate(()=>{window.testScene.world.speed=4})
  }
  assert.equal(await page.evaluate(()=>window.builder.work),null)
  assert.equal(await page.evaluate(()=>window.testScene.world.stats.built),1)
  assert.deepEqual(errors,[])
  console.log('PASS: real hut placement, three live delivery pauses with original carried-log sprites, native stage sequence and visible GPU geometry:',JSON.stringify(snapshots))
}finally{await browser.close()}
