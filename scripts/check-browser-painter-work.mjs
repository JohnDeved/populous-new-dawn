// Ground clipping compacts the painter queue; compare visible pixels and picks
// against the previous GPU-only culling path. Retain changed depth counts as evidence.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import {
  preparePainterBaseline,
  installPainterBaseline,
  painterBaselineCommit,
} from './painter-baseline.mjs'

const baseline = painterBaselineCommit
preparePainterBaseline(baseline)
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await installPainterBaseline(page)
  const cases = await page.evaluate(async () => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const { cameraPreset } = await import('/app/projection.ts')
    const cases = []
    const compare = name => {
      const capture = optimized => {
        window.selectPainter(optimized)
        const relative = s.view.relative
        let relativeCalls = 0
        s.view.relative = function (...args) {
          relativeCalls++
          return relative.apply(this, args)
        }
        r.render(s.scene, s.camera)
        s.view.relative = relative
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        )
        return {
          pixels,
          relativeCalls,
          depth: s.view.painter.texture.image.data.slice(),
          activeCommands: s.view.painter.texture.image.data.reduce(
            (n, value) => n + Number(value < 1),
            0
          ),
          calls: r.info.render.calls,
          triangles: r.info.render.triangles,
          pick: s.view.pick({ x: 0, y: 0 }, [s.terrain, s.objects], s.camera)?.point ?? null,
        }
      }
      const before = capture(false),
        after = capture(true)
      const differences = (a, b) => {
        if (a.length !== b.length) throw Error(`${name}: different buffer lengths`)
        let changed = 0
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changed++
        return changed
      }
      cases.push({
        name,
        depthSlots: before.depth.length,
        changedDepths: differences(before.depth, after.depth),
        activeCommands: [before.activeCommands, after.activeCommands],
        changedPixels: differences(before.pixels, after.pixels),
        relativeCalls: [before.relativeCalls, after.relativeCalls],
        before: { calls: before.calls, triangles: before.triangles, pick: before.pick },
        after: { calls: after.calls, triangles: after.triangles, pick: after.pick },
      })
    }
    for (const [x, z, heading, zoom] of [
      [2, 30, 0, 0],
      [2, 30, 256, 0],
      [2, 30, 512, 0],
      [127, -127, 1024, 0],
      [-127, 127, 1536, 2],
      [2, 30, 0, 4],
    ]) {
      s.view.update(
        s.container.clientWidth,
        s.container.clientHeight,
        { x, z },
        (heading * Math.PI) / 1024,
        zoom,
        false
      )
      compare(`view ${x}/${z}/${heading}/${zoom}`)
    }
    s.view.update(s.container.clientWidth, s.container.clientHeight, { x: 2, z: 30 }, 0, 0, false)
    compare('warm terrain cache')
    const flags = s.view.painter.landFlags.slice()
    s.world.land.flags.fill(0x200)
    compare('raised land flags change without geometry edits')
    s.world.land.flags.fill(0x100200)
    compare('raised land exclusion flag')
    s.world.land.flags.set(flags)
    for (const [width, height, ratio] of [
      [3440, 1440, 1],
      [3840, 2160, 1],
      [1920, 1080, 1.8],
    ]) {
      r.setPixelRatio(ratio)
      r.setSize(width, height, false)
      s.view.update(width, height, { x: 2, z: 30 }, 0, 0, false)
      compare(`render size ${width}x${height} DPR ${ratio}`)
      s.view.update(
        width,
        height,
        { x: 126, z: -126 },
        Math.PI / 4,
        0,
        false,
        width,
        cameraPreset(3, 3)
      )
      compare(`close seam ${width}x${height} DPR ${ratio}`)
    }
    r.setPixelRatio(1)
    r.setSize(s.container.clientWidth, s.container.clientHeight, false)
    s.view.update(s.container.clientWidth, s.container.clientHeight, { x: 2, z: 30 }, 0, 0, false)
    const position = s.terrain.geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      position.setX(i, position.getX(i) + 0.75)
      position.setY(i, position.getY(i) + Math.sin(i) * 0.5)
    }
    position.needsUpdate = true
    compare('terrain deformation invalidates centers')
    const replacement = position.clone()
    for (let i = 0; i < replacement.count; i++) replacement.setX(i, replacement.getX(i) - 1.5)
    s.terrain.geometry.setAttribute('position', replacement)
    compare('replacement position attribute')
    s.terrain.position.set(0.125, 0.75, -0.375)
    for (const group of s.objects.children) {
      group.position.x += 0.25
      group.userData.nativeHeading = 1024
      group.userData.nativeTilt = 32
    }
    compare('transforms and model headings change with cached centers')
    s.view.overview = true
    s.view.uniforms.nativeMode.value = 0
    compare('overview bypass')
    return cases
  })
  writeFileSync(
    process.argv[2] ?? '/private/tmp/populous-painter-work.json',
    JSON.stringify({ baseline, cases }, null, 2) + '\n'
  )
  for (const c of cases) {
    assert.ok(c.activeCommands[1] <= c.activeCommands[0], c.name)
    assert.equal(c.changedPixels, 0, c.name)
    assert.deepEqual(c.after, c.before, c.name)
  }
  assert.deepEqual(errors, [])
  console.log(
    `PASS: identical pixels, draw submissions and picking with compacted ground queues in ${cases.length} painter cases`
  )
} finally {
  await browser.close()
}
