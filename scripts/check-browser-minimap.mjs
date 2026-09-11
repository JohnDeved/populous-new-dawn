import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { minimapPick } from '../app/minimap.ts'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(
    () => window.testScene.terrainTextures && window.testScene.minimap.art.complete
  )
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
  })
  const cases = []
  for (const [width, height] of [
    [640, 480],
    [1280, 720],
    [1440, 1000],
    [1920, 1080],
    [3440, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(
      scale => Math.abs(document.querySelector('.native-hud').getBoundingClientRect().width - scale * 100) < .1,
      Math.min(2.5, Math.floor(Math.min(width / 640, height / 480) * 2) / 2)
    )
    for (const heading of [0, 256, 512, 1024]) {
      cases.push(
        await page.evaluate(
          async ({ heading, width }) => {
            const s = window.testScene,
              w = s.world,
              { nativePosition } = await import('/app/model.ts'),
              { terrainBrightness } = await import('/app/terrain-texture.ts'),
              hash = async canvas =>
                Array.from(
                  new Uint8Array(
                    await crypto.subtle.digest(
                      'SHA-256',
                      canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
                    )
                  )
                )
                  .map(v => v.toString(16).padStart(2, '0'))
                  .join('')
            s.focus(heading === 1024 ? { x: 127, z: -127 } : { x: 2, z: 30 })
            s.cameraBearing = (heading * Math.PI) / 1024
            const saved = { units: w.units, buildings: w.buildings, shrines: w.shrines }
            Object.assign(w, { units: [], buildings: [], shrines: [] })
            const ctx = s.mini.getContext('2d'),
              original = ctx.setTransform
            let transform
            ctx.setTransform = function (matrix) {
              transform = matrix.inverse()
              return original.call(this, matrix)
            }
            try {
              s.drawMinimap()
            } finally {
              ctx.setTransform = original
              Object.assign(w, saved)
            }
            const terrainHash = await hash(s.minimap.terrain),
              sourceHash = await hash(s.minimap.source),
              screenHash = await hash(s.mini)
            // Rotation must reach actual pixels, including its interpolated edges.
            if (screenHash === sourceHash) throw Error('Rotated map was not drawn')
            s.drawMinimap()
            if ((await hash(s.minimap.source)) === sourceHash)
              throw Error('Live object markers missing')
            return {
              name: `${width}/${heading}`,
              width: s.mini.width,
              height: s.mini.height,
              center: nativePosition(w, s.viewPoint),
              heading,
              fog: !!(w.manaWorld.levelFlags & 4),
              terrainHash,
              sourceHash,
              screenHash,
              transform: [
                transform.a,
                transform.b,
                transform.c,
                transform.d,
                transform.e,
                transform.f,
              ],
              land: {
                heights: Array.from(w.land.heights),
                cliffs: Array.from(w.land.cliffs),
                flags: Array.from(w.land.flags),
                brightness: Array.from(w.land.heights, (_, i) =>
                  terrainBrightness(w.land, i, [147, 147, 147])
                ),
              },
            }
          },
          { heading, width }
        )
      )
    }
  }
  // Equal HUD sizes intentionally produce identical maps on differently sized monitors.
  const uniqueViews = new Set(cases.map(c => `${c.width}/${c.height}/${c.heading}`))
  assert.equal(new Set(cases.map(c => c.screenHash)).size, uniqueViews.size)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForFunction(
    () => document.querySelector('.native-hud').getBoundingClientRect().width === 200
  )
  // Real clicks use the displayed, rotated coordinates and preserve the bearing.
  const mini = page.getByLabel('Minimap. Click to move the camera.', { exact: true })
  for (const heading of [0, 512, 1024, 1536]) {
    await page.evaluate(heading => {
      const s = window.testScene
      s.focus({ x: 2, z: 30 })
      s.cameraBearing = (heading * Math.PI) / 1024
      s.drawMinimap()
    }, heading)
    const c = await page.evaluate(() => {
        const s = window.testScene
        return { width: s.mini.width, height: s.mini.height, center: { x: 2560, y: 55808 } }
      }),
      rect = await mini.boundingBox(),
      point = { x: c.width * 0.6, y: c.height * 0.4 },
      expected = minimapPick(c.width, c.height, c.center, heading, point)
    await page.mouse.click(rect.x + rect.width * 0.6, rect.y + rect.height * 0.4)
    const target = await page.evaluate(() => window.testScene.cameraMotion.target)
    assert.equal(target.x, expected.x)
    assert.equal(target.y, expected.y)
    assert.equal(target.angle, heading)
  }
  // Browser-only secondary buttons must not move the camera or open a context menu.
  const target = await page.evaluate(() => ({ ...window.testScene.cameraMotion.target }))
  const rect = await mini.boundingBox()
  for (const button of ['middle', 'right']) {
    await page.mouse.click(rect.x + rect.width * 0.2, rect.y + rect.height * 0.8, { button })
    assert.deepEqual(await page.evaluate(() => window.testScene.cameraMotion.target), target)
  }
  assert.equal(
    await mini.evaluate(element =>
      element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    ),
    false
  )
  // A terrain edit invalidates the cached map through the same live land version.
  const changed = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world
    s.focus({ x: 2, z: 30 })
    s.drawMinimap()
    const before = s.minimap.terrain
        .getContext('2d')
        .getImageData(0, 0, s.mini.width, s.mini.height).data,
      cell = 64 * 128 + 64,
      old = w.land.heights[cell]
    w.land.heights[cell] = old ? 0 : 900
    w.landVersion++
    s.updateTerrainTexture()
    s.drawMinimap()
    const after = s.minimap.terrain
      .getContext('2d')
      .getImageData(0, 0, s.mini.width, s.mini.height).data
    w.land.heights[cell] = old
    w.landVersion++
    s.updateTerrainTexture()
    s.drawMinimap()
    return before.some((v, i) => v !== after[i])
  })
  assert.ok(changed, 'Terrain edit did not update minimap')
  await page.evaluate(() => {
    const s = window.testScene
    s.focus({ x: 2, z: 30 })
    s.cameraBearing = 0
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  await page.screenshot({ path: '/private/tmp/populous-minimap-after.png' })
  await mini.screenshot({ path: '/private/tmp/populous-minimap-canvas.png' })
  writeFileSync('/private/tmp/populous-minimap-browser.json', JSON.stringify(cases))
  assert.deepEqual(errors, [])
  console.log(
    'PASS: 24 live minimap captures at six desktop sizes through ultrawide/4K, four bearings, seam wrapping, marker draws, actual rotated clicks and terrain invalidation; ready for native --browser comparison'
  )
} finally {
  await browser.close()
}
