import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame, settleView, originalSkyShaders } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(() => {
    const s = window.testScene
    return s.terrainTextures && s.skyBackdrop.material.uniforms.map.value.image?.complete &&
      s.skyClouds.every(m => m.material.uniforms.map.value.image?.complete)
  })
  await page.evaluate(shaders => {
    const s = window.testScene
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
    const original = s.skyBackdrop.material.clone()
    Object.assign(original, shaders)
    window.originalSky = original
  }, originalSkyShaders)
  const results = []
  for (const [width, height] of [[740, 480], [1920, 1080], [3440, 1440], [3840, 2160]]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(({ width, height }) => {
      const s = window.testScene, sidebar = document.querySelector('.native-hud').getBoundingClientRect().width
      return s.renderer.domElement.width === width - sidebar && s.renderer.domElement.height === height
    }, { width, height })
    for (const preset of [0, 3, 2]) {
      results.push(await page.evaluate(({ preset, width, height }) => {
        const s = window.testScene, r = s.renderer, gl = r.getContext()
        s.startGroundView(preset)
        for (let i = 0; i < 32; i++) s.updateCameraMotion(1 / 24)
        s.cameraBearing = 0
        s.focus({ x: 2, z: 30 })
        s.animate(s.previous)
        cancelAnimationFrame(s.frame)
        const read = () => {
          r.render(s.scene, s.camera)
          const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
          gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data)
          return data
        }
        const modern = s.skyBackdrop.material, after = read(),
          calls = r.info.render.calls, triangles = r.info.render.triangles,
          projection = JSON.stringify(s.view.projection), bounds = JSON.stringify(s.view.bounds),
          pick = s.view.pick({ x: 0, y: 0 }, [s.terrain], s.camera)?.point
        window.originalSky.uniforms.height.value = modern.uniforms.height.value
        s.skyBackdrop.material = window.originalSky
        s.skyBackdrop.visible = s.view.config.horizon > 0
        const before = read(), oldCalls = r.info.render.calls, oldTriangles = r.info.render.triangles
        // A white clear identifies translucent edges: these should receive the
        // new background too, while fully covered ground must stay identical.
        const background = s.scene.background
        s.scene.background = s.space.clone().setRGB(1, 1, 1)
        const againstWhite = read()
        s.scene.background = background
        s.skyBackdrop.material = modern
        s.skyBackdrop.visible = true
        read()
        let filled = 0, blackAfter = 0, changedGround = 0, blendedEdges = 0, upperDifferences = 0, upperMaxDelta = 0
        const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, horizon = s.view.config.horizon,
          edge = Math.ceil(Math.max(0, horizon) / 128) + 2
        for (let i = 0; i < before.length; i += 4) {
          const y = h - 1 - Math.floor(i / 4 / w),
            black = !(before[i] | before[i + 1] | before[i + 2]),
            newBlack = !(after[i] | after[i + 1] | after[i + 2]),
            delta = Math.max(Math.abs(before[i] - after[i]), Math.abs(before[i + 1] - after[i + 1]), Math.abs(before[i + 2] - after[i + 2]))
          if (black && !newBlack) filled++
          if (newBlack) blackAfter++
          if (!black && y > horizon + edge && delta > 1) {
            const backgroundVisible = [0, 1, 2].some(k => againstWhite[i + k] !== before[i + k])
            if (backgroundVisible) blendedEdges++
            else changedGround++
          }
          // Exclude the intended half-texel wrap correction at both texture edges.
          if (y > edge && y < horizon - edge && delta) {
            upperDifferences++
            upperMaxDelta = Math.max(upperMaxDelta, delta)
          }
        }
        return { width, height, preset, horizon, filled, blackAfter, changedGround, blendedEdges,
          upperDifferences, upperMaxDelta, calls, oldCalls, triangles, oldTriangles,
          sameProjection: JSON.stringify(s.view.projection) === projection,
          sameBounds: JSON.stringify(s.view.bounds) === bounds,
          samePick: JSON.stringify(s.view.pick({ x: 0, y: 0 }, [s.terrain], s.camera)?.point) === JSON.stringify(pick) }
      }, { preset, width, height }))
      if (width === 3440 && preset === 0)
        await page.screenshot({ path: '/private/tmp/populous-sky-coverage-ultrawide.png' })
    }
  }
  for (const c of results) {
    assert.ok(c.sameProjection && c.sameBounds && c.samePick, JSON.stringify(c))
    assert.equal(c.changedGround, 0, JSON.stringify(c))
    assert.ok(c.upperMaxDelta <= 1, JSON.stringify(c))
    assert.equal(c.calls - c.oldCalls, c.horizon ? 0 : 1)
    assert.equal(c.triangles - c.oldTriangles, c.horizon ? 0 : 2)
  }
  assert.ok(results.some(c => c.width === 3440 && c.filled > 100000))
  await page.evaluate(() => window.testScene.overview())
  await settleView(page)
  assert.equal(await page.evaluate(() => window.testScene.skyBackdrop.visible), false)
  await page.evaluate(() => { window.originalSky.dispose() })
  assert.deepEqual(errors, [])
  writeFileSync('references/performance/2026-09-09-sky-coverage.json', JSON.stringify(results, null, 2) + '\n')
  console.log('PASS: sky coverage at 12 desktop/view states through 4K; native ground pixels, projection, bounds and picks retained; horizon/cloud scale unchanged; no extra pass for existing skies', results)
} finally {
  await browser.close()
}
