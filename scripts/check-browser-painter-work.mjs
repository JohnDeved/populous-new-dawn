// Compare all painter depth slots and GPU pixels with the retained implementation.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { preparePainterBaseline, installPainterBaseline, painterBaselineCommit } from './painter-baseline.mjs'

preparePainterBaseline()
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await installPainterBaseline(page)
  const cases = await page.evaluate(() => {
    const s = window.testScene, r = s.renderer, gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const cases = []
    const compare = name => {
      const capture = optimized => {
        window.selectPainter(optimized)
        r.render(s.scene, s.camera)
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        return {
          pixels, depth: s.view.painter.texture.image.data.slice(),
          calls: r.info.render.calls, triangles: r.info.render.triangles,
          pick: s.view.pick({ x: 0, y: 0 }, [s.terrain, s.objects], s.camera)?.point ?? null,
        }
      }
      const before = capture(false), after = capture(true)
      const differences = (a, b) => {
        if (a.length !== b.length) throw Error(`${name}: different buffer lengths`)
        let changed = 0
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changed++
        return changed
      }
      cases.push({ name, depthSlots: before.depth.length,
        changedDepths: differences(before.depth, after.depth),
        changedPixels: differences(before.pixels, after.pixels),
        before: { calls: before.calls, triangles: before.triangles, pick: before.pick },
        after: { calls: after.calls, triangles: after.triangles, pick: after.pick },
      })
    }
    for (const [x, z, heading, zoom] of [
      [2, 30, 0, 0], [2, 30, 256, 0], [2, 30, 512, 0],
      [127, -127, 1024, 0], [-127, 127, 1536, 2], [2, 30, 0, 4],
    ]) {
      s.view.update(s.container.clientWidth, s.container.clientHeight,
        { x, z }, heading * Math.PI / 1024, zoom, false)
      compare(`view ${x}/${z}/${heading}/${zoom}`)
    }
    s.view.update(s.container.clientWidth, s.container.clientHeight, { x: 2, z: 30 }, 0, 0, false)
    compare('warm terrain cache')
    const position = s.terrain.geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      position.setX(i, position.getX(i) + .75)
      position.setY(i, position.getY(i) + Math.sin(i) * .5)
    }
    position.needsUpdate = true
    compare('terrain deformation invalidates centers')
    const replacement = position.clone()
    for (let i = 0; i < replacement.count; i++) replacement.setX(i, replacement.getX(i) - 1.5)
    s.terrain.geometry.setAttribute('position', replacement)
    compare('replacement position attribute')
    s.terrain.position.set(.125, .75, -.375)
    for (const group of s.objects.children) {
      group.position.x += .25
      group.userData.nativeHeading = 1024
      group.userData.nativeTilt = 32
    }
    compare('transforms and model headings change with cached centers')
    s.view.overview = true
    s.view.uniforms.nativeMode.value = 0
    compare('overview bypass')
    return cases
  })
  for (const c of cases) {
    assert.equal(c.changedDepths, 0, c.name)
    assert.equal(c.changedPixels, 0, c.name)
    assert.deepEqual(c.after, c.before, c.name)
  }
  assert.deepEqual(errors, [])
  const report = { baseline: painterBaselineCommit, cases }
  writeFileSync(process.argv[2] ?? '/private/tmp/populous-painter-work.json', JSON.stringify(report, null, 2) + '\n')
  console.log(`PASS: identical depth slots, pixels, draw submissions and picking in ${cases.length} painter cases`)
} finally {
  await browser.close()
}
