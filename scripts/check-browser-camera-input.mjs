// Start npm run dev, then node scripts/check-browser-camera-input.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  // Freeze RAF so actual keyboard events can be checked at exact presentation steps.
  await page.evaluate(() => { const s=window.testScene;cancelAnimationFrame(s.frame);s.world.speed=0 })
  const reset = () => page.evaluate(() => {
    const s=window.testScene
    s.keys.clear();s.cameraTime=0;s.cameraBearing=333*Math.PI/1024
    s.focus({x:-10.09375,z:-8.78125}) // Native (65000, 200).
  })
  const step = (dt=1/24) => page.evaluate(dt => {
    const s=window.testScene;s.updateCameraMotion(dt)
    const {x,y,angle}=s.cameraPosition
    return {x,y,angle}
  },dt)
  // Captured from complete 0x4424b0 at 24 Hz, with momentum disabled.
  const cases = [
    [['w'],[65272,367,333]], [['ArrowDown'],[64727,32,333]],
    [['a'],[64832,472,333]], [['ArrowRight'],[65000,200,359]],
    [['q'],[65000,200,307]], [['e'],[65000,200,359]],
    [['w','a','e'],[65140,629,359]],
    [['w','s','a','d','q','e'],[65140,629,359]],
  ]
  for (const [keys,[x,y,angle]] of cases) {
    await reset()
    for (const key of keys) await page.keyboard.down(key)
    assert.deepEqual(await step(),{x,y,angle},`Native keyboard result: ${keys}`)
    for (const key of keys) await page.keyboard.up(key)
    assert.deepEqual(await step(),{x,y,angle},'No drift after release in momentum-off mode')
  }
  await reset();await page.keyboard.down('w')
  for (let i=0;i<3;i++) assert.deepEqual(await step(1/96),{x:65000,y:200,angle:333})
  assert.deepEqual(await step(1/96),{x:65272,y:367,angle:333},'Render rate does not change camera speed')
  await page.keyboard.up('w')
  await reset()
  await page.evaluate(()=>{window.testScene.world.paused=true})
  await page.keyboard.down('w')
  assert.deepEqual(await step(),{x:65272,y:367,angle:333},'Camera works while simulation is paused')
  await page.keyboard.up('w')
  await reset();await page.evaluate(()=>{window.testScene.world.inputMask=4})
  await page.keyboard.down('w')
  assert.deepEqual(await step(),{x:65000,y:200,angle:333},'Locked presentation rejects camera input')
  await page.keyboard.up('w');await page.evaluate(()=>{window.testScene.world.inputMask=0})
  // Focused HUD buttons must not swallow camera keys; pan interrupts focus.
  await page.getByRole('button',{name:'Focus Dakini tribe',exact:true}).click()
  await page.keyboard.down('d');await step();await page.keyboard.up('d')
  assert.equal(await page.evaluate(()=>window.testScene.cameraMotion.active),0)
  const canvas=page.locator('.world-viewport canvas'),rect=await canvas.boundingBox()
  const center={x:Math.round(rect.x+rect.width/2),y:Math.round(rect.y+rect.height/2)}
  const drag=async(button,dx,dy)=>{
    await page.mouse.move(center.x,center.y);await page.mouse.down({button})
    await page.mouse.move(center.x+dx,center.y+dy);await page.mouse.up({button})
    return page.evaluate(()=>{const {x,y,angle}=window.testScene.cameraPosition;return{x,y,angle}})
  }
  await reset()
  assert.deepEqual(await drag('right',64,80),{x:65000,y:200,angle:397},'Right drag rotates one native angle unit per pixel without panning')
  await reset()
  assert.deepEqual(await drag('right',0,80),{x:65000,y:200,angle:333},'Vertical right drag does not move the camera')
  await reset()
  await page.evaluate(()=>{const s=window.testScene;s.cameraBearing=0;s.focus({x:2,z:30});s.world.mode='blast'})
  assert.deepEqual(await drag('middle',32,-16),{x:2176,y:55616,angle:0},'Middle drag uses native 12-unit integer steps')
  assert.equal(await page.evaluate(()=>window.testScene.world.mode),null)
  await page.evaluate(()=>{
    const s=window.testScene;s.world.paused=false;s.cameraBearing=333*Math.PI/1024
    s.focus({x:2,z:30});s.onChange();s.renderer.render(s.scene,s.camera)
  })
  await page.screenshot({path:'/private/tmp/populous-camera-input.png'})
  assert.deepEqual(errors,[])
  console.log('PASS: native keyboard directions, simultaneous keys, fixed timing, pause/lock, focused HUD, focus takeover and real mouse drags')
} finally { await browser.close() }
