// Artwork-only capture; live roster ownership and input are checked separately.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import fixture from '../tests/fixtures/worship-panel.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  const frames = await page.evaluate(async cases => {
    const { worshipPanel } = await import('/app/worship-panel.ts')
    const { paintPanel } = await import('/app/training-panel.ts')
    const atlas = new Image()
    atlas.src = '/original/hud.png'
    await atlas.decode()
    const gallery = document.createElement('div')
    gallery.style.cssText =
      'position:fixed;inset:0;z-index:10000;background:#20302c;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;justify-items:center;overflow:auto'
    document.body.appendChild(gallery)
    return cases.map((state, i) => {
      const canvas = document.createElement('canvas')
      paintPanel(canvas, atlas, worshipPanel(state.state))
      if ([0, 14, 24, 38, 72, 96, 144, 158, 170, 192, 216, 259].includes(i)) {
        canvas.style.cssText = 'image-rendering:pixelated;transform:scale(2)'
        gallery.appendChild(canvas)
      }
      return { state, png: canvas.toDataURL().split(',')[1] }
    })
  }, fixture.cases)
  assert.equal(frames.length, fixture.cases.length)
  writeFileSync('/private/tmp/populous-worship-panel-pixels.json', JSON.stringify(frames))
  await page.screenshot({ path: '/private/tmp/populous-worship-panels.png' })
  console.log(`Captured ${frames.length} worship panel canvases for source-art pixel comparison`)
} finally {
  await browser.close()
}
