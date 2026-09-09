// Repeatable render-loop baseline. Headless timings are diagnostic, not hardware fps certification.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser),
    cdp = await page.context().newCDPSession(page)
  await cdp.send('Profiler.enable')
  await cdp.send('Performance.enable')
  const fullTerrain = process.argv.includes('--full-terrain')
  const environment = await page.evaluate(fullTerrain => {
    const s = window.testScene,
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info')
    if (fullTerrain) {
      s.terrain.userData.terrainGrid = false
      s.terrain.geometry.setIndex(null)
      s.terrain.geometry.setDrawRange(0, Infinity)
    }
    const original = s.animate
    window.frameSamples = []
    s.animate = now => {
      const start = performance.now()
      original(now)
      window.frameSamples.push({
        time: now,
        cpu: performance.now() - start,
        calls: s.renderer.info.render.calls,
        triangles: s.renderer.info.render.triangles,
      })
    }
    return {
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      pixelRatio: devicePixelRatio,
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    }
  }, fullTerrain)
  const runs = []
  for (const scenario of ['opening', 'camera', 'crowd']) {
    if (scenario === 'camera') await page.keyboard.down('q')
    if (scenario === 'crowd') {
      await page.keyboard.up('q')
      await page.evaluate(async () => {
        const s = window.testScene,
          { addUnit } = await import('/app/model.ts')
        s.world.speed = 0
        s.focus({ x: 2, z: 30 })
        for (let i = 0; i < 200; i++)
          addUnit(s.world, 'blue', 'brave', { x: -8 + (i % 20), z: 23 + Math.floor(i / 20) })
      })
    }
    await page.waitForTimeout(1000)
    await page.evaluate(() => {
      window.frameSamples = []
    })
    await cdp.send('Profiler.start')
    await page.waitForTimeout(4000)
    const { profile } = await cdp.send('Profiler.stop'),
      metrics = await cdp.send('Performance.getMetrics'),
      data = await page.evaluate(() => ({
        frames: window.frameSamples,
        units: window.testScene.world.units.length,
        memory: window.testScene.renderer.info.memory,
        programs: window.testScene.renderer.info.programs.length,
      }))
    assert.ok(data.frames.length > 5, 'Render loop stopped')
    const quantile = (values, q) =>
        values.sort((a, b) => a - b)[Math.floor((values.length - 1) * q)],
      gaps = data.frames.slice(1).map((f, i) => f.time - data.frames[i].time),
      samples = new Map(),
      nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame]))
    profile.samples.forEach((id, i) => {
      const f = nodes.get(id),
        key = `${f.functionName || '(anonymous)'} ${f.url.replace(/^.*\/app\//, 'app/').split('?')[0]}:${f.lineNumber + 1}`
      samples.set(key, (samples.get(key) ?? 0) + profile.timeDeltas[i])
    })
    runs.push({
      scenario,
      ...data,
      frames: undefined,
      frameCount: data.frames.length,
      frameGapMs: { p50: quantile(gaps, 0.5), p95: quantile(gaps, 0.95), max: Math.max(...gaps) },
      cpuFrameMs: {
        p50: quantile(
          data.frames.map(f => f.cpu),
          0.5
        ),
        p95: quantile(
          data.frames.map(f => f.cpu),
          0.95
        ),
      },
      drawCalls: quantile(
        data.frames.map(f => f.calls),
        0.5
      ),
      triangles: quantile(
        data.frames.map(f => f.triangles),
        0.5
      ),
      heapBytes: metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value,
      topSelfMs: [...samples]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([name, us]) => ({ name, ms: us / 1000 })),
    })
  }
  assert.deepEqual(errors, [])
  const report = {
    date: new Date().toISOString(),
    fullTerrain,
    runtime: process.version,
    cpu: cpus()[0].model,
    os: platform(),
    arch: arch(),
    mode: 'Headless Chromium, 1 second settling and 4 second CPU sample per scenario; crowd adds 200 stationary braves for renderer stress',
    ...environment,
    runs,
  }
  const path =
    process.argv.slice(2).find(a => !a.startsWith('--')) ?? '/private/tmp/populous-performance.json'
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
