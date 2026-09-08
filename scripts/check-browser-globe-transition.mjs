// npm run dev, then node scripts/check-browser-globe-transition.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame); s.world.speed = 0; s.world.paused = true
    s.focus({ x: 2, z: 30 }); s.cameraBearing = 333 * Math.PI / 1024
    s.cameraTime = 0; s.updateView()
  })
  const state = () => page.evaluate(() => {
    const s = window.testScene
    return { stage:s.overviewStage,overview:s.overviewActive,preset:s.viewPreset,
      remaining:s.viewTransition?.remaining ?? 0,bearing:s.cameraBearing,
      morph:structuredClone(s.globeMorph),center:s.view.center,ground:s.ground.visible,
      vertices:[...(s.globe.land.geometry.attributes.position?.array ?? [])] }
  })
  const frame = (n=1) => page.evaluate(n => {
    const s=window.testScene
    for(let i=0;i<n;i++)s.updateCameraMotion(1/24)
    s.animate(s.previous);cancelAnimationFrame(s.frame)
  },n)
  const original=await state()
  await page.getByRole('button',{name:'Planet overview',exact:true}).click()
  let s=await state()
  assert.equal(s.stage,'enter');assert.equal(s.overview,false);assert.equal(s.remaining,18)
  await frame(9);s=await state()
  assert.ok(s.bearing>0&&s.bearing<original.bearing);assert.equal(s.remaining,9)
  await page.keyboard.press('=');assert.equal((await state()).stage,'enter')
  await frame(9);s=await state()
  assert.equal(s.overview,true);assert.equal(s.morph.value,256);assert.equal(s.bearing,0)
  assert.equal(s.ground,false)
  const flat=s.vertices,values=[s.morph.value]
  assert.equal(await page.evaluate(()=>window.testScene.pick({clientX:820,clientY:500})),null,'Native picking rejects a blended projection')
  await page.evaluate(()=>window.testScene.world.inputMask=4)
  await frame(4);assert.equal((await state()).morph.value,256)
  await page.evaluate(()=>window.testScene.world.inputMask=0)
  for(let i=0;i<6;i++){
    await frame();s=await state();values.push(s.morph.value)
    assert.ok(s.vertices.every(Number.isFinite))
    if(i===2)await page.screenshot({path:'/private/tmp/populous-globe-morph-v107.png'})
  }
  assert.deepEqual(values,[256,214,171,129,86,43,0])
  assert.equal(s.stage,null);assert.deepEqual(s.center,original.center);assert.notDeepEqual(s.vertices,flat)
  assert.notEqual(await page.evaluate(()=>window.testScene.pick({clientX:820,clientY:500})),null)
  await page.keyboard.press('=')
  const back=[]
  for(let i=0;i<7;i++){await frame();s=await state();back.push(s.morph.value)}
  assert.deepEqual(back,[0,42,85,127,170,213,256])
  assert.equal(s.overview,false);assert.equal(s.remaining,18);assert.equal(s.preset,2)
  await frame(18);s=await state()
  assert.equal(s.stage,null);assert.equal(s.remaining,0);assert.equal(s.bearing,original.bearing)
  assert.deepEqual(s.center,original.center);assert.equal(s.ground,true)
  await page.screenshot({path:'/private/tmp/populous-globe-return-v107.png'})
  // Enter toggles back to the saved preset; zoom-in explicitly chooses bird's-eye.
  await page.keyboard.press('=');await frame(18)
  assert.equal((await state()).preset,0)
  await page.evaluate(()=>document.activeElement?.blur())
  await page.keyboard.press('Enter');await frame(24)
  assert.equal((await state()).overview,true)
  await page.keyboard.press('Enter');await frame(25)
  s=await state();assert.equal(s.overview,false);assert.equal(s.preset,0);assert.equal(s.bearing,original.bearing)
  // A forced focus interrupts the view sequence without leaving a stuck blend.
  await page.getByRole('button',{name:'Planet overview',exact:true}).click();await frame(4)
  await page.evaluate(()=>window.testScene.focus({x:8,z:30}));await frame()
  s=await state();assert.equal(s.stage,null);assert.equal(s.overview,false);assert.equal(s.morph.active,false)
  assert.deepEqual(errors,[])
  console.log('PASS: real overview entry/return, 18-tick ground zoom/rotation, native seven-frame morphs and finite geometry, paused presentation, input/reentry/picking gates, restored bearing and interrupted focus')
} finally { await browser.close() }
