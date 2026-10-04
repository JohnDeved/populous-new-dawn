// Compare the explicit rectangular-hit compatibility choice with the old CSS ellipse.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default async function ({ page, openMission, output, receipt }) {
  await openMission(1)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    cancelAnimationFrame(scene.frame)
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const candidate = await page.locator('canvas.map-frame').count() > 0
  const canvas = page.getByLabel('Minimap. Click to move the camera.', { exact: true })
  const rect = await canvas.boundingBox()
  assert.equal(rect.width, 200)
  assert.equal(rect.height, 192)
  const cases = []
  for (const seam of [false, true]) for (const heading of [0, 512, 1024, 1536]) {
    for (const [name, x, y] of [['newly-visible-terrain', 4, 50], ['opaque-corner', 1, 1], ['outside-right', 202, 50], ['outside-bottom', 198, 194]]) {
      const before = await page.evaluate(async ({ heading, seam, x, y }) => {
        const scene = window.testScene
        scene.focus(seam ? { x: 127, z: -127 } : { x: 2, z: 30 })
        scene.cameraBearing = heading * Math.PI / 1024
        scene.drawMinimap()
        const { nativePosition } = await import('/app/model.ts')
        const { minimapPick } = await import('/app/minimap.ts')
        const rect = scene.mini.getBoundingClientRect()
        const element = document.elementFromPoint(rect.x + x, rect.y + y)
        return {
          target: { ...scene.cameraMotion.target },
          hitCanvas: element === scene.mini,
          expected: minimapPick(scene.mini.width, scene.mini.height, nativePosition(scene.world, scene.viewPoint), heading, { x, y }),
        }
      }, { heading, seam, x, y })
      const inside = !name.startsWith('outside-')
      assert.equal(before.hitCanvas, candidate && inside, `${name}: DOM hit mask`)
      if (candidate && inside) {
        const alpha = await page.locator('canvas.map-frame').evaluate((frame, { x, y }) => frame.getContext('2d').getImageData(x, y, 1, 1).data[3], { x, y })
        assert.equal(alpha, name === 'opaque-corner' ? 255 : 0, name)
      }
      await page.mouse.click(rect.x + x, rect.y + y)
      const after = await page.evaluate(() => ({ ...window.testScene.cameraMotion.target }))
      if (candidate && inside) {
        assert.equal(after.x, before.expected.x)
        assert.equal(after.y, before.expected.y)
        assert.equal(after.angle, heading)
      } else assert.deepEqual(after, before.target, `${name}: camera target must remain unchanged`)
      cases.push({ name, heading, seam, x, y, hitCanvas: before.hitCanvas, before: before.target, after, expected: before.expected })
    }
  }
  assert.deepEqual(receipt.errors, [])
  const result = { candidate, rect, cases, scope: 'Camera is fixed for each probe. Tests real DOM hit ownership and pointerdown, with unchanged map coordinate transforms. Rectangular corner reach is an intentional browser compatibility correction; native hit-region parity is unproved.' }
  writeFileSync(resolve(output, 'corner-hits.json'), JSON.stringify(result, null, 2))
  await page.screenshot({ path: resolve(output, 'corner-hit-screen.png') })
  return result
}
