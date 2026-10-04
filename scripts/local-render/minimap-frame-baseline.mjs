// Run against the exact accepted base, before the overlay repair, for honest screenshots.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default async function ({ page, openMission, output, receipt }) {
  await openMission(1)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    cancelAnimationFrame(scene.frame)
  })
  const frames = []
  for (const [width, height] of [[640, 480], [1440, 1000], [3840, 2160]]) {
    await page.setViewportSize({ width, height })
    const proceed = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await proceed.isVisible()) await proceed.click()
    await page.waitForFunction(() => document.querySelector('img.map-frame')?.complete)
    await page.evaluate(() => { const scene = window.testScene; scene.animate(scene.previous); cancelAnimationFrame(scene.frame) })
    await page.locator('.map-frame').screenshot({ path: resolve(output, `viewport-${width}-frame.png`) })
    await page.screenshot({ path: resolve(output, `viewport-${width}-screen.png`) })
    frames.push({ width, height, bounds: await page.locator('.map-frame').boundingBox() })
  }
  assert.deepEqual(receipt.errors, [])
  return { frames, scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'), limitation: 'Legacy frame screenshots on exact base; same Mission 1 and viewport as candidate; software rendering only.' }
}
