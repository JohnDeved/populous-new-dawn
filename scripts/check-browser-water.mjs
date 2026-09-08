// Start npm run dev, then: node scripts/check-browser-water.mjs
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
  })
  await page.waitForFunction(() => {
    const s = window.testScene
    return s.waves && s.world.landVersion >= 0 && s.terrainVersion === s.world.landVersion
  })
  const result = await page.evaluate(() => {
    const s = window.testScene,
      g = s.terrain.geometry,
      p = g.getAttribute('position'),
      gl = s.renderer.getContext(),
      width = gl.drawingBufferWidth,
      height = gl.drawingBufferHeight
    const pixels = () => {
      s.renderer.render(s.scene, s.camera)
      const out = new Uint8Array(width * height * 4)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, out)
      return out
    }
    s.world.turn = 0
    s.updateWater()
    const zero = Array.from(p.array),
      first = pixels()
    s.world.turn = 23
    s.updateWater()
    const second = pixels(),
      changedHeights = p.array.some((v, i) => v !== zero[i])
    let changedWater = 0
    for (let y = 0; y < height * 0.15; y++)
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        if (
          first[i] !== second[i] ||
          first[i + 1] !== second[i + 1] ||
          first[i + 2] !== second[i + 2]
        )
          changedWater++
      }
    s.world.turn = 256
    s.updateWater()
    const wrapped = Array.from(p.array).every((v, i) => v === zero[i]),
      shared = new Map()
    let cracks = 0,
      south = 0
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j),
        z = p.getZ(j),
        h = p.getY(j),
        key = `${x},${z}`
      if (shared.has(key) && shared.get(key) !== h) cracks++
      shared.set(key, h)
      if (z === 50 && x >= -18 && x <= 4) south++
    }
    const surface = g.getAttribute('surface'),
      light = g.getAttribute('light'),
      highlight = g.getAttribute('highlight')
    const savedLight = new Float32Array(light.array),
      savedHighlight = new Float32Array(highlight.array)
    const nativeCoast = pixels()
    let wetLandVertices = 0
    window.coastBaseline = enabled => {
      light.array.set(savedLight)
      highlight.array.set(savedHighlight)
      if (enabled)
        for (let j = 0; j < p.count; j++)
          if (!surface.getX(j)) {
            light.setXYZ(j, 1, 1, 1)
            highlight.setXYZ(j, 0, 0, 0)
          }
      light.needsUpdate = highlight.needsUpdate = true
    }
    for (let j = 0; j < p.count; j++) if (!surface.getX(j) && light.getX(j) < 1) wetLandVertices++
    window.coastBaseline(true)
    const oldCoast = pixels()
    window.coastBaseline(false)
    const difference = (a, b) => {
      let n = 0
      for (let i = 0; i < a.length; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++
      return n
    }
    const coastPixels = difference(nativeCoast, oldCoast)
    // Supply light-strength inputs to verify rendering; native sunlight ownership
    // and scheduling are not implemented by this test or renderer change.
    const lightCells = [
      [0, 30],
      [2, 30],
      [0, 32],
      [2, 32],
    ].map(([x, z]) => s.landIndex(x, z))
    const savedCells = lightCells.map(i => s.world.land.buildingIds[i])
    lightCells.forEach(i => {
      s.world.land.buildingIds[i] |= 0xfc00
    })
    s.waterState = ''
    s.updateWater()
    const lit = pixels()
    let warmVertices = 0,
      waterHighlights = 0
    for (let j = 0; j < p.count; j++) {
      if (surface.getX(j) && highlight.getX(j)) waterHighlights++
      if (
        !surface.getX(j) &&
        highlight.getX(j) > highlight.getY(j) &&
        highlight.getY(j) > highlight.getZ(j)
      )
        warmVertices++
    }
    const warmPixels = difference(nativeCoast, lit)
    lightCells.forEach((i, j) => {
      s.world.land.buildingIds[i] = savedCells[j]
    })
    s.waterState = ''
    s.updateWater()
    return {
      changedHeights,
      changedWater,
      wrapped,
      scroll: s.waterScroll.value,
      cracks,
      south,
      triangles: g.index.count / 3,
      atlas: s.terrainMap.image.width,
      wetLandVertices,
      coastPixels,
      warmVertices,
      warmPixels,
      waterHighlights,
    }
  })
  assert.ok(result.changedHeights)
  assert.ok(result.changedWater > 1000)
  assert.ok(result.wrapped)
  assert.equal(result.scroll, 0)
  assert.equal(result.cracks, 0)
  assert.ok(result.south > 0)
  assert.equal(result.triangles, 32768)
  assert.equal(result.atlas, 4096)
  assert.ok(result.wetLandVertices > 0)
  assert.ok(result.coastPixels > 1000, JSON.stringify(result))
  assert.ok(result.warmVertices > 0)
  assert.ok(result.warmPixels > 100, JSON.stringify(result))
  assert.equal(result.waterHighlights, 0)
  await page.evaluate(() => window.coastBaseline(true))
  await page.screenshot({ path: '/private/tmp/populous-coast-before.png' })
  await page.evaluate(() => window.coastBaseline(false))
  await page.screenshot({ path: '/private/tmp/populous-coast-after.png' })
  await page.screenshot({ path: '/private/tmp/populous-water-after.png' })
  await page.evaluate(() => {
    window.testScene.world.speed = 1
    window.testScene.world.paused = true
  })
  const held = await page.evaluate(() => ({
    turn: window.testScene.world.turn,
    state: window.testScene.waterState,
  }))
  await page.waitForTimeout(250)
  assert.deepEqual(
    await page.evaluate(() => ({
      turn: window.testScene.world.turn,
      state: window.testScene.waterState,
    })),
    held
  )
  await page.evaluate(() => {
    window.testScene.world.speed = 0
    window.testScene.world.paused = false
    window.testScene.onChange()
  })
  await page.evaluate(() => window.testScene.focus({ x: 0, z: 50 }))
  await page.waitForTimeout(100)
  await page.screenshot({ path: '/private/tmp/populous-water-southern-shore.png' })
  await page.evaluate(() => (window.testScene.overviewActive = true))
  await page.waitForTimeout(100)
  assert.ok(await page.evaluate(() => window.testScene.terrain.count === 1))
  await page.evaluate(() => window.testScene.focus())
  await page.waitForTimeout(100)
  assert.ok(await page.evaluate(() => window.testScene.terrain.count === 9))
  assert.deepEqual(errors, [])
  console.log(
    `PASS: coastline diffuse shading (${result.coastPixels} GPU pixels), additive warm light (${result.warmPixels} pixels), no water highlights; wave animation/wrap/pause, shared coast heights and overview; no browser errors`
  )
} finally {
  await browser.close()
}
