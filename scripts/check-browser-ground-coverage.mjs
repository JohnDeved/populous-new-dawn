// Diagnostic, not a passing claim of widescreen parity. Compare the shipped
// ground footprint with lateral-only expansions while retaining native camera
// projection, heights, winding, row rasterizer, painter and wrapped instances.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

import { prepareTerrainCopiesBaseline, installTerrainCopiesBaseline } from './terrain-copies-baseline.mjs'

prepareTerrainCopiesBaseline()
const browser = await chromium.launch({ headless: true })
const cases = [], reportState = {}
try {
  const { page, errors } = await openGame(browser)
  await installTerrainCopiesBaseline(page)
  await page.evaluate(() => window.selectTerrainCopies(false))
  await page.waitForFunction(() => !!window.testScene.waves && !!window.testScene.terrainTextures)
  const terrainState = await page.evaluate(async () => {
    const s = window.testScene
    const { createWorld } = await import('/app/model.ts')
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
    s.world = createWorld()
    s.world.speed = 0
    s.rebuildTerrain()
    s.updateWater()
    s.view.painter.landFlags = s.world.land.flags
    // Isolate coverage from black terrain lighting, sky, models and textures.
    // A new material still goes through the actual native projection hooks.
    const terrain = s.terrain.clone()
    terrain.geometry = s.terrain.geometry.clone()
    terrain.material = new s.terrain.material.constructor({
      vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'void main(){gl_FragColor=vec4(1.);}',
    })
    const scene = new s.scene.constructor()
    scene.add(terrain)
    scene.background = s.space.clone().setRGB(0, 0, 0)
    s.view.prepare(scene)
    window.coverageScene = scene
    window.coverageTerrain = terrain
    const hash = await crypto.subtle.digest('SHA-256', terrain.geometry.getAttribute('position').array)
    return { turn: s.world.turn, geometrySha256: [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('') }
  })
  Object.assign(reportState, terrainState)
  for (const [width, height] of [[740, 480], [1920, 1080], [3440, 1440], [3840, 2160]]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(({ width, height }) => {
      const s = window.testScene, side = document.querySelector('.native-hud').getBoundingClientRect().width
      return s.renderer.domElement.width === width - side && s.renderer.domElement.height === height
    }, { width, height })
    for (const center of [{ x: 2, z: 30 }, { x: 126, z: -126 }]) {
      for (const heading of [0, 256, 512, 768, 1024, 1280, 1536, 1792]) {
        const result = await page.evaluate(async ({ center, heading, width }) => {
          const s = window.testScene, r = s.renderer, gl = r.getContext()
          const { polygonMeshBounds } = await import('/app/projection.ts')
          s.view.update(s.container.clientWidth, s.container.clientHeight, center, heading * Math.PI / 1024, 0, false, width)
          const native = s.view.bounds.map(row => [...row])
          const images = [], draws = []
          for (const padding of [0, 16, 32]) {
            s.view.bounds = padding ? polygonMeshBounds(
              s.view.config.bounds.map((n, i) => i % 2 ? n : n + Math.sign(n) * padding), heading
            ) : native
            s.view.bounds.forEach((row, i) => s.view.boundsTexture.image.data.set(row, i * 2))
            s.view.boundsTexture.needsUpdate = true
            r.render(window.coverageScene, s.camera)
            const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
            gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
            images.push(pixels)
            draws.push({ padding, cells: window.coverageTerrain.geometry.drawRange.count / 6,
              calls: r.info.render.calls, triangles: r.info.render.triangles })
          }
          const compare = (a, b) => {
            let added = 0, removed = 0
            for (let i = 0; i < a.length; i += 4) {
              // Ignore multisampled boundary slivers in the coverage count.
              if (a[i] < 128 && b[i] >= 128) added++
              if (a[i] >= 128 && b[i] < 128) removed++
            }
            return { added, removed }
          }
          const nativePixels = images[0].reduce((count, value, i) => count + Number(i % 4 === 0 && value >= 128), 0)
          return { heading, center, nativePixels, draws,
            padding16: compare(images[0], images[1]),
            padding32: compare(images[0], images[2]),
            convergence: compare(images[1], images[2]) }
        }, { center, heading, width })
        assert.ok(result.nativePixels > 0, 'Native terrain must render in the isolated scene')
        assert.ok(result.draws.every(draw => draw.calls === 1 && draw.triangles === draw.cells * 18))
        cases.push({ width, height, ...result })
      }
    }
    console.log(`Captured ${width}×${height}: sixteen headings/centers`)
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
const report = {
  date: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  scope: 'Normal ground view only; isolated white terrain through live native shaders. Original nine terrain copies retained. Expanded bounds are diagnostic, not shipped. Triangle counts measure submitted work, not GPU time or FPS.',
  terrainState: reportState,
  cases,
}
const output = process.argv[2] ?? '/private/tmp/populous-ground-coverage.json'
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(`Recorded ${cases.length} coverage comparisons to ${output}; no whole-display parity claim.`)
