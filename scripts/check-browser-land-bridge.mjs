import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'

const baseline = 'f1d7cba42eb0afe2a2f4fad9441269a81697b426'
const source = execFileSync('git', ['show', `${baseline}:app/scene.ts`], { encoding: 'utf8' })
const method = source.slice(
  source.indexOf('  rebuildTerrain() {'),
  source.indexOf('  updateTerrainTexture() {')
)
mkdirSync('.tools/performance', { recursive: true })
writeFileSync(
  '.tools/performance/bridge-terrain-baseline.ts',
  "import * as THREE from 'three';import {terrainTextureBounds} from '../../app/terrain-texture.ts';import {waterCell} from '../../app/water.ts';import {walkable} from '../../app/model.ts';\nexport function " +
    method.trim()
)

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(u, { x: 0, z: 20, path: [], casting: null })
    w.selected = [u.id]
    w.shots.bridge = 1
    w.speed = 0.2
    s.focus({ x: 0, z: 14 })
  })
  await page.keyboard.press('2')
  const target = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 0, z: 4 }),
      r = s.renderer.domElement.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(
    () => window.testScene.world.effects.some(f => f.bridge),
    {},
    { timeout: 20000 }
  )
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world
    cancelAnimationFrame(s.frame)
    w.paused = true
    const fx = w.effects.find(f => f.bridge)
    if (fx.bridge.turn !== 0) throw Error('Missed initial bridge state')
    const { tick } = await import('/app/model.ts')
    window.bridgeReport = {
      start: fx.bridge.start,
      target: fx.bridge.target,
      heights: Array.from(w.land.heights),
      flags: Array.from(w.land.flags),
      cliffs: Array.from(w.land.cliffs),
      categories: Array.from(w.land.categories),
      shadows: Array.from(w.land.shadows),
      landFlags: w.land.landFlags,
      timeline: [],
      timings: [],
      effectId: fx.id,
    }
    window.stepBridge = () => {
      const start = performance.now()
      w.paused = false
      tick(w, 1 / 12)
      w.paused = true
      const simulated = performance.now()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const { start: a, target: b, ...state } = fx.bridge
      window.bridgeReport.timeline.push({
        state,
        alive: w.effects.includes(fx),
        heights: Array.from(w.land.heights),
      })
      window.bridgeReport.timings.push({
        simulation: simulated - start,
        presentation: performance.now() - simulated,
        effects: w.effects.length,
        draws: s.renderer.info.render.calls,
      })
    }
    for (let i = 0; i < 16; i++) window.stepBridge()
  })
  const ids = await page.evaluate(() =>
    window.testScene.world.effects.filter(f => f.sprite?.sequence === 'blastTrail').map(f => f.id)
  )
  assert.ok(ids.length > 20, 'trails extend along the live crossing')
  const pixels = await effectPixels(page, ids)
  assert.ok(pixels > 100, 'ground trails reach actual GPU pixels')
  await page.evaluate(async () => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
    const { rebuildTerrain } = await import('/.tools/performance/bridge-terrain-baseline.ts')
    const pixels = () => {
      s.updateWater()
      r.render(s.scene, s.camera)
      const p = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        p
      )
      return p
    }
    const original = () => {
      rebuildTerrain.call(s)
      s.releaseGroup(s.decorations)
      s.decorations.clear()
      s.makeDecorations()
    }
    original()
    const before = pixels(),
      geometry = s.terrain.geometry
    s.rebuildTerrain()
    if (geometry !== s.terrain.geometry) throw Error('Terrain buffers were replaced')
    const after = pixels()
    if (before.some((v, i) => v !== after[i]))
      throw Error('Retained terrain buffers changed pixels')
    const samples = [[], []]
    for (let i = 0; i < 48; i++)
      for (const mode of i % 2 ? [1, 0] : [0, 1]) {
        const start = performance.now()
        if (mode) s.rebuildTerrain()
        else original()
        if (i >= 8) samples[mode].push(performance.now() - start)
      }
    s.rebuildTerrain()
    s.updateWater()
    window.bridgeReport.terrainRebuild = samples.map(values => {
      const sorted = values.toSorted((a, b) => a - b)
      return { median: sorted[20], p95: sorted[38], samples: values }
    })
  })
  await page.screenshot({ path: '/private/tmp/populous-land-bridge-active.png' })
  const report = await page.evaluate(() => {
    for (let i = 16; i < 63; i++) window.stepBridge()
    const s = window.testScene,
      w = s.world
    const report = window.bridgeReport
    if (w.effects.some(f => f.bridge)) throw Error('Bridge did not finish')
    if (s.terrainMapVersion !== w.landVersion || w.terrainVersion !== w.landVersion)
      throw Error('Stale terrain')
    for (let i = 0; i < 8; i++) window.stepBridge()
    if (w.effects.some(f => f.sprite?.sequence === 'blastTrail'))
      throw Error('Ground trails leaked')
    return report
  })
  await page.screenshot({ path: '/private/tmp/populous-land-bridge-finished.png' })
  assert.deepEqual(errors, [])
  report.timeline = report.timeline.slice(0, 63).map(t => ({
    ...t,
    changes: t.heights.flatMap((h, i) => (h === report.heights[i] ? [] : [[i, h]])),
    heights: createHash('sha256').update(JSON.stringify(t.heights)).digest('hex'),
  }))
  const artifact = {
    baseline,
    browser: await browser.version(),
    headless: true,
    viewport: { width: 1440, height: 1000 },
    pixels,
    ...report,
    limitation:
      'CPU times in headless Chromium, not hardware FPS. Native replay compares terrain/controller outputs; full original object allocation and mixed-class scheduling remain partial.',
  }
  const path = '/private/tmp/populous-land-bridge-browser.json'
  writeFileSync(path, JSON.stringify(artifact) + '\n')
  if (process.argv.includes('--record'))
    writeFileSync(
      'references/performance/2026-09-10-land-bridge.json',
      JSON.stringify(artifact) + '\n'
    )
  const stats = key => {
    const values = report.timings
      .slice(8, 63)
      .map(t => t[key])
      .sort((a, b) => a - b)
    return {
      median: values[Math.floor(values.length / 2)],
      p95: values[Math.floor(values.length * 0.95)],
    }
  }
  console.log(
    'PASS: clicked Land Bridge, native ground trails in GPU pixels, terrain refresh and cleanup',
    JSON.stringify({
      pixels,
      simulation: stats('simulation'),
      presentation: stats('presentation'),
      terrainRebuild: report.terrainRebuild.map(({ samples, ...v }) => v),
      peakEffects: Math.max(...report.timings.map(t => t.effects)),
    })
  )
} finally {
  await browser.close()
}
