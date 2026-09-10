import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const headed = process.argv.includes('--headed'), browser = await chromium.launch({ headless: !headed })
const pursuit = process.argv.includes('--pursuit')
try {
  const { page, errors } = await openGame(browser)
  page.on('pageerror', error => console.error(error.stack))
  await page.evaluate(async pursuit => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []; w.pendingTime = 0
    w.terrain.fill(3); w.terrainVersion++
    w.shrines=[]
    if (pursuit) {
      for (let row=0;row<4;row++) for (let col=0;col<4;col++) {
        const x=col*16-40,z=row*16-28
        const u=m.addUnit(w,'blue','warrior',{x,z}),target=m.addUnit(w,'red','shaman',{x:x+12,z})
        w.selected=[u.id];m.command(w,target)
        w.selected=[target.id];m.command(w,{x:x+30,z:z+8})
      }
      w.selected=[]
    } else {
      // Two separated tribes keep scanning without an early matching candidate.
      for (let row = 0; row < 8; row++) for (let col = 0; col < 12; col++)
        m.addUnit(w, col < 6 ? 'blue' : 'red', 'warrior', { x: col * 8 - 44, z: row * 8 - 28 })
    }
    // Synchronize the replacement landscape before measuring steady gameplay.
    w.speed = 1; m.tick(w, 1 / 6); w.speed = 0
    s.focus({ x: 0, z: 0 }); s.onChange()
  },pursuit)
  await page.waitForFunction(count => window.testScene.unitMeshes.size === count,pursuit?32:96)
  await page.evaluate(() => {
    const s = window.testScene, animate = s.animate.bind(s), frames = []
    const start = performance.now()
    window.engagementProfile = { frames }
    s.animate = now => {
      const before = performance.now(), turn = s.world.turn
      animate(now)
      frames.push({ time: now, cpu: performance.now() - before, scan: s.world.turn !== turn && !(s.world.turn & 3), calls: s.renderer.info.render.calls })
      if (performance.now() - start >= 6000) {
        window.engagementProfile.done = true; s.world.speed = 0; s.animate = animate
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.engagementProfile.done).catch(async error => {
    console.error({ errors, state: await page.evaluate(() => ({ frames: window.engagementProfile.frames.length, turn: window.testScene.world.turn, status: window.testScene.world.status })) })
    throw error
  })
  const report = await page.evaluate(() => {
    const s = window.testScene, f = window.engagementProfile.frames, gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    const summary = values => {
      values.sort((a,b) => a-b)
      const q = p => values[Math.floor((values.length - 1) * p)]
      return { count: values.length, p50: q(.5), p95: q(.95), p99: q(.99), max: q(1) }
    }
    return { userAgent: navigator.userAgent, renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
      cpu: summary(f.map(v => v.cpu)), scanFrameCpu: summary(f.filter(v => v.scan).map(v => v.cpu)),
      gaps: summary(f.slice(1).map((v,i) => v.time - f[i].time)), maxDrawCalls: Math.max(...f.map(v => v.calls)),
      people: s.world.units.length, fights: s.world.fights.length, targets: s.world.units.filter(u => u.target !== null).length }
  })
  assert.deepEqual(errors, []); assert.equal(report.people, pursuit?32:96); assert.equal(report.fights, 0); assert.equal(report.targets, pursuit?16:0)
  assert.ok(report.scanFrameCpu.count >= 12, 'measurement includes recurring native scan visits')
  const result = { headed, workload: pursuit ? '16 warriors pursuing 16 moving shamans for six seconds after terrain/sprite synchronization. Includes actual path updates, rendering and simulation. Unpaired workload, not a speedup, loading or whole-game result; callback cadence is not physical display FPS.' : '96 idle warriors in two separated tribes, recurring no-match scans over six seconds, after replacement landscape synchronization and sprite creation. Includes rendering and simulation; current target-array traversal remains quadratic. Browser callback cadence is not physical display FPS, and this is not a paired speedup, loading profile or whole-game result.', ...report }
  writeFileSync(`/private/tmp/populous-${pursuit?'pursuit':'engagement'}-profile.json`, JSON.stringify(result, null, 2) + '\n')
  console.log('PASS: recurring live engagement workload', result)
} finally { await browser.close() }
