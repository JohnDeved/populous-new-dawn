import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  async function castAt(key,point){
    await page.keyboard.press(key)
    const target=await page.evaluate(p=>{const s=window.testScene,r=s.container.getBoundingClientRect(),q=s.screen(p);return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}},point)
    await page.mouse.click(target.x,target.y)
  }
  async function groundPixels(){
    return page.evaluate(()=>{
      const s=window.testScene,w=s.world,r=s.renderer,gl=r.getContext(),saved=w.land.buildingIds.slice()
      const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),dark=new Uint8Array(pixels.length)
      s.waterState='';s.updateWater();r.render(s.scene,s.camera)
      gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
      const highlighted=[...s.terrain.geometry.getAttribute('highlight').array].filter(n=>n>0).length
      w.land.buildingIds.forEach((n,i)=>{w.land.buildingIds[i]=n&1023})
      s.waterState='';s.updateWater();r.render(s.scene,s.camera)
      gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,dark)
      w.land.buildingIds.set(saved);s.waterState='';s.updateWater();r.render(s.scene,s.camera)
      let changed=0,brighter=0
      for(let i=0;i<pixels.length;i+=4){
        if(pixels[i]!==dark[i]||pixels[i+1]!==dark[i+1]||pixels[i+2]!==dark[i+2])changed++
        if(pixels[i]+pixels[i+1]+pixels[i+2]>dark[i]+dark[i+1]+dark[i+2])brighter++
      }
      return {changed,brighter,highlighted,cells:[...saved].filter(n=>n>>>10).length}
    })
  }
  const point=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    w.speed=.25;w.manaWorld.gameFlags=32;w.selected=[u.id];w.shots.blast=4
    const target={x:u.x+2,z:u.z+2};s.focus(target);s.onChange();return target
  })
  await castAt('1',point)
  await page.waitForFunction(()=>{const s=window.testScene;if(!s.world.effects.some(f=>f.kind==='blast')||!s.world.lights.some(Boolean))return false;s.world.speed=0;return true})
  await page.waitForFunction(()=>window.testScene.world.effects.filter(f=>f.kind==='blast').every(f=>window.testScene.fxMeshes.has(f.id)))
  const blast=await groundPixels()
  assert.ok(blast.changed>100&&blast.brighter>blast.changed*.99&&blast.highlighted>0&&blast.cells>0,JSON.stringify(blast))
  await page.screenshot({path:'/private/tmp/populous-blast-ground-light-v118.png'})
  await page.evaluate(()=>{window.testScene.world.speed=1})
  await page.waitForFunction(()=>window.testScene.world.lights.every(l=>l===null))
  assert.equal(await page.evaluate(()=>window.testScene.world.land.buildingIds.some(n=>n>>>10)),false)
  const building=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
    w.speed=.5;w.shots.lightning=1;s.focus(b);s.onChange();window.lightBuilding=b;return {x:b.x,z:b.z}
  })
  await castAt('3',building)
  await page.waitForFunction(()=>{
    const s=window.testScene,flames=s.world.effects.filter(f=>f.fire?.suppressEmbers)
    if(flames.length<2||!s.world.lights.some(l=>l&&flames.some(f=>f.id===l.owner)))return false
    s.world.speed=0;window.lightFlames=flames.map(f=>f.id);return true
  })
  const owners=await page.evaluate(()=>window.testScene.world.lights.filter(l=>l&&window.lightFlames.includes(l.owner)).map(l=>l.owner))
  assert.equal(owners.length,1)
  const fire=await groundPixels()
  assert.ok(fire.changed>100&&fire.brighter>fire.changed*.99,JSON.stringify(fire))
  await page.screenshot({path:'/private/tmp/populous-fire-ground-light-v118.png'})
  await page.evaluate(()=>{window.testScene.world.speed=8})
  await page.waitForFunction(()=>window.lightFlames.every(id=>!window.testScene.world.effects.some(f=>f.id===id)))
  await page.waitForFunction(()=>window.testScene.world.lights.every(l=>l===null))
  assert.equal(await page.evaluate(()=>window.testScene.world.land.buildingIds.some(n=>n>>>10)),false)
  assert.deepEqual(errors,[])
  console.log(`PASS: real Blast ground light ${blast.changed} changed GPU pixels (${blast.brighter} brighter)/${blast.cells} cells; real building fire ${fire.changed} changed GPU pixels (${fire.brighter} brighter), one light socket, expiry/cleanup and no browser errors`)
}finally{await browser.close()}
