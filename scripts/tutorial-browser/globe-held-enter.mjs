import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { showAllMissions, bindGame } from '../browser-game.mjs'
import { verifyHeldEnter } from '../globe-held-enter-witness.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'

// Hosted production Home scenario. The runner owns Chrome, the page, the single
// 180s browser deadline and cleanup. No dev server or independent browser launch.
export default async function runGlobeHeldEnter({ page, url, output, source }) {
  const errors = []
  const onError = error => errors.push(String(error))
  const onConsole = message => { if (message.type() === 'error') errors.push(message.text()) }
  page.on('pageerror', onError)
  page.on('console', onConsole)
  const report = { status: 'running', commit: source.commit, viewport: { width: 1440, height: 1000 },
    screenshots: ['globe-held-enter-morph.png', 'globe-held-enter-return.png',
      'globe-held-enter-overview.png', 'globe-held-enter-ground.png'], errors,
    limits: ['Production Home via plain Vite, not deployed Vinext/Cloudflare.',
      'Public Mission 1 selector; supplied focus/bearing and paused simulation.',
      'Actual camera transitions advance with explicit 1/24-second presentation ticks.',
      'Playwright trusted repeat events, not natural OS autorepeat timing or hardware performance.',
      'No Numpad browser claim; existing source regression covers Numpad.'] }
  try {
    await page.setViewportSize(report.viewport)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await showAllMissions(page)
    await page.getByRole('button', { name: 'Mission 1', exact: true }).focus()
    await page.keyboard.press('Enter')
    await bindGame(page)
    // Scene binding can precede React's public Skip control. Reuse the existing
    // actionable startup observer rather than sampling visibility once.
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue()
    await startup.dispose()
    assert.equal(report.startup.level, 1)
    if (report.startup.action === 'skip')
      await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
    await page.evaluate(() => { window.testScene = window.testSceneRef.current })
    report.renderer = await page.evaluate(() => {
      const gl = window.testScene.renderer.getContext()
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      return { renderer: gl.getParameter(gl.RENDERER), vendor: gl.getParameter(gl.VENDOR),
        unmaskedRenderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null }
    })
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
  await page.locator('.world-viewport canvas').focus()
  await page.keyboard.press('Enter')
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
    if(i===2)await page.screenshot({path:resolve(output, 'globe-held-enter-morph.png')})
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
  await page.screenshot({path:resolve(output, 'globe-held-enter-return.png')})
  // Enter toggles back to the saved preset; zoom-in explicitly chooses bird's-eye.
  await page.keyboard.press('=');await frame(18)
  assert.equal((await state()).preset,0)
  await page.evaluate(()=>document.activeElement?.blur())
  await page.keyboard.press('Enter');await frame(24)
  assert.equal((await state()).overview,true)
  await page.keyboard.press('Enter');await frame(25)
  s=await state();assert.equal(s.overview,false);assert.equal(s.preset,0);assert.equal(s.bearing,original.bearing)
  const heldEnter = await verifyHeldEnter({ page, state, frame,
    capture: phase => page.screenshot({ path: resolve(output, `globe-held-enter-${phase}.png`) }),
  })
  report.heldEnter = heldEnter
  // A forced focus interrupts the view sequence without leaving a stuck blend.
  await page.locator('.world-viewport canvas').focus()
  await page.keyboard.press('Enter');await frame(4)
  await page.evaluate(()=>window.testScene.focus({x:8,z:30}));await frame()
  s=await state();assert.equal(s.stage,null);assert.equal(s.overview,false);assert.equal(s.morph.active,false)
  assert.deepEqual(errors,[])
  report.status = 'passed'
  return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    throw error
  } finally {
    writeFileSync(resolve(output, 'globe-held-enter.json'), JSON.stringify(report, null, 2) + '\n')
    page.off('pageerror', onError)
    page.off('console', onConsole)
  }
}
