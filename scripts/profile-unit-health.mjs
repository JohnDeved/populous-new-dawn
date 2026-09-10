// Sequential hardware sample of a 200-person damaged crowd, before/after gauge replacement.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: false })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, { addUnit, maxHp } = await import('/app/model.ts')
    s.world.speed = 0; s.world.units = []; s.world.buildings = []; s.world.selected = []
    for (let i = 0; i < 200; i++) {
      const u = addUnit(s.world, 'blue', 'brave', { x: -8 + i % 20, z: 23 + Math.floor(i / 20) })
      u.hp = Math.floor(maxHp(u.kind) / 2)
    }
    s.focus({ x: 2, z: 30 })
  })
  await page.keyboard.down('Quote')
  await page.waitForTimeout(1200)
  const runs = []
  for (let run = 0; run < 3; run++) {
    await page.evaluate(() => {
      const s = window.testScene, animate = s.animate
      window.healthSamples = []
      window.stopHealthSample = () => { s.animate = animate }
      s.animate = now => {
        const start = performance.now(); animate(now)
        window.healthSamples.push({ cpu: performance.now() - start, calls: s.renderer.info.render.calls, triangles: s.renderer.info.render.triangles })
      }
    })
    await page.waitForTimeout(3000)
    runs.push(await page.evaluate(() => {
      window.stopHealthSample()
      const samples = window.healthSamples, values = samples.map(f => f.cpu).sort((a,b) => a-b), q = p => values[Math.floor((values.length-1)*p)]
      return { count: values.length, cpu: { p50:q(.5),p95:q(.95),p99:q(.99),max:q(1) }, calls:samples.at(-1).calls, triangles:samples.at(-1).triangles }
    }))
  }
  const device = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    return { userAgent:navigator.userAgent, renderer:gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport:[innerWidth,innerHeight], dpr:devicePixelRatio }
  })
  assert.deepEqual(errors, [])
  const result = { device, runs, workload:'200 half-health braves, held Quote, stationary ground view, paused simulation, three sequential 3-second samples after loading. CPU callback time, not physical display FPS or a whole-game benchmark.' }
  writeFileSync(process.argv[2] ?? '/private/tmp/populous-unit-health-profile.json', JSON.stringify(result,null,2)+'\n')
  console.log(result)
} finally { await browser.close() }
