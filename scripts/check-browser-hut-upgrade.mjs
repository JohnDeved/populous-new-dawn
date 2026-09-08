// npm run dev, then node scripts/check-browser-hut-upgrade.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  const original=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
    window.upgradeHut=b
    const residents=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,3)
    for(const u of residents){u.inside=b.id;u.work=b.id;u.path=[]}
    window.upgradeResidents=residents
    b.counter=127;b.upgrade=1776;b.timer=-20000;w.speed=4
    s.focus(b);s.startGroundView(2)
    for(let i=0;i<18;i++)s.updateCameraMotion(1/24)
    return b.object
  })
  await page.waitForFunction(()=>window.upgradeResidents.some(u=>u.cargo>0 && u.inside===null))
  await page.waitForFunction(()=>{
    const s=window.testScene,pile=s.world.trees.find(t=>t.model===11&&t.logs>0)
    if(!pile || !s.decorations.children.some(g=>g.userData.point===pile))return false
    s.world.speed=0;window.upgradePile=pile;return true
  })
  const stock=await page.evaluate(()=>{
    const s=window.testScene,g=s.decorations.children.find(g=>g.userData.point===window.upgradePile),gl=s.renderer.getContext()
    const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
    const before=read();g.visible=false;const after=read();g.visible=true
    let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
    return {pixels,level:window.upgradeHut.level,progress:window.upgradeHut.progress,sequence:g.userData.sequence,cue:s.world.sounds.some(v=>v.cue===11)}
  })
  assert.equal(stock.level,1);assert.equal(stock.progress,1);assert.equal(stock.sequence,'log');assert.ok(stock.pixels>0);assert.ok(stock.cue)
  await page.screenshot({path:'/private/tmp/populous-hut-timber-v110.png'})
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>{
    const s=window.testScene,b=window.upgradeHut
    if(b.level!==2 || s.buildingMeshes.get(b.id)?.children[0].userData.nativeModel!==b.object)return false
    s.world.speed=0;return true
  })
  const replacement=await page.evaluate(()=>({object:window.upgradeHut.object,progress:window.upgradeHut.progress,upgrading:window.upgradeHut.upgrading}))
  assert.equal(replacement.object,original+1);assert.ok(replacement.progress>=1/3&&replacement.progress<1);assert.ok(replacement.upgrading)
  await page.screenshot({path:'/private/tmp/populous-hut-upgrading-v110.png'})
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>window.upgradeHut.progress===1 && !window.upgradeHut.upgrading)
  await page.evaluate(()=>{window.testScene.world.speed=0})
  assert.deepEqual(errors,[])
  console.log(`PASS: real residents carry timber, original entrance log sprites (${stock.pixels} GPU pixels), drop cue, retained complete hut until ready, native family upgrade and completed reconstruction; no browser errors`)
} finally {await browser.close()}
