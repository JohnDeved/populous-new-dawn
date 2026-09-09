// Start npm run dev, then node scripts/check-browser-sky.mjs.
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fixture from '../tests/fixtures/sky-horizon.json' with { type: 'json' }
import { openGame, settleView } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(() => {
    const s = window.testScene
    return (
      s.skyBackdrop.material.uniforms.map.value.image?.complete &&
      s.skyClouds.every(m => m.material.uniforms.map.value.image?.complete)
    )
  })
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
    cancelAnimationFrame(s.frame)
  })
  const advance = () =>
    page.evaluate(() => {
      const s = window.testScene,
        frames = []
      for (let i = 0; i < 18; i++) {
        s.updateCameraMotion(1 / 24)
        s.updateSky()
        frames.push([
          s.view.config.horizon,
          s.skyBackdrop.material.uniforms.height.value * s.container.clientHeight,
        ])
      }
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return frames
    })
  const check = async () => {
    const actual = await page.evaluate(() => {
      const s = window.testScene,
        w = s.container.clientWidth,
        h = s.container.clientHeight
      s.world.outcome.skyCounter = 20
      s.world.outcome.lastDefeated = 0
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const flash = s.skyFlash.material.uniforms.height.value * h
      s.world.outcome.skyCounter = 0
      s.skyFlash.visible = false
      return {
        flash,
        width: w,
        height: h,
        preset: s.viewPreset,
        horizon: s.view.config.horizon,
        backdrop: s.skyBackdrop.material.uniforms.height.value * h,
        visible: s.skyBackdrop.visible,
        cloudsVisible: s.skyClouds.some(m => m.visible),
        layers: s.skyClouds.map(m => {
          const p = m.geometry.attributes.position,
            a = m.geometry.attributes.fade
          return Array.from({ length: p.count }, (_, i) => [
            ((p.getX(i) + 1) * w) / 2,
            ((1 - p.getY(i)) * h) / 2,
            Math.round(a.getX(i) * 255),
          ])
        }),
      }
    })
    const expected = fixture.cases.find(
      c => c.width === actual.width && c.height === actual.height && c.preset === actual.preset
    )
    assert.ok(expected, JSON.stringify(actual))
    assert.equal(actual.horizon, expected.horizon)
    assert.ok(Math.abs(actual.flash - expected.flashHeight) < 1e-9)
    assert.ok(Math.abs(actual.backdrop - expected.quad[2][1]) < 1e-9)
    assert.equal(actual.visible, true, 'Ground backdrop also covers exposed areas below the horizon')
    assert.equal(actual.cloudsVisible, expected.horizon > 0)
    if (expected.horizon)
      expected.layers.forEach((points, layer) =>
        points.forEach(([x, y, color], i) => {
          const p = actual.layers[layer][i]
          assert.ok(
            Math.abs(p[0] - x) < 0.001 && Math.abs(p[1] - y) < 0.001,
            `${layer}/${i}: ${p} vs ${x},${y}`
          )
          assert.equal(p[2], color >>> 24)
        })
      )
  }
  let checked = 0
  for (const [width, height] of [
    [1440, 1000],
    [1920, 1080],
    [740, 480],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(
      w => window.testScene.container.clientWidth === w - (w < 1000 ? 100 : 200),
      width
    )
    await page.evaluate(() => window.testScene.startGroundView(0))
    await advance()
    await check()
    checked++
    for (const key of ['=', '-', '-']) {
      await page.keyboard.press(key)
      for (const [h, rendered] of await advance())
        assert.ok(Math.abs(h - rendered) < 1e-9, 'Sky must track each transition frame')
      await check()
      checked++
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForFunction(() => window.testScene.container.clientWidth === 1240)
  await page.evaluate(() => window.testScene.startGroundView(0))
  await advance()
  await check()
  const pixels = await page.evaluate(() => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext(),
      w = gl.drawingBufferWidth,
      h = gl.drawingBufferHeight
    const read = () => {
      r.render(s.scene, s.camera)
      const p = new Uint8Array(w * h * 4)
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p)
      return p
    }
    const full = read(),
      layers = []
    for (const m of [s.skyBackdrop, ...s.skyClouds]) {
      m.visible = false
      const without = read()
      m.visible = true
      let upper = 0,
        lower = 0
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          if (
            full[i] === without[i] &&
            full[i + 1] === without[i + 1] &&
            full[i + 2] === without[i + 2]
          )
            continue
          if (y > h * 0.8) upper++
          if (y < h * 0.2) lower++
        }
      layers.push({ upper, lower })
    }
    const horizon = s.view.config.horizon
    s.view.config.horizon = h
    s.updateSky()
    const stretched = read()
    s.view.config.horizon = horizon
    s.updateSky()
    read()
    let changed = 0
    for (let i = 0; i < full.length; i += 4)
      if (
        full[i] !== stretched[i] ||
        full[i + 1] !== stretched[i + 1] ||
        full[i + 2] !== stretched[i + 2]
      )
        changed++
    // Isolate the real flash shader: ground occlusion must not hide an
    // incorrectly full-height rectangle from this regression.
    const isolated = new s.scene.constructor()
    isolated.add(s.skyFlash)
    s.skyFlash.visible = true
    s.skyFlash.material.uniforms.rgba.value.set(1, 0, 0, 1)
    r.render(isolated, s.camera)
    const flashPixels = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, flashPixels)
    let flashInside = 0,
      flashOutside = 0
    const flashHeight = s.skyFlash.material.uniforms.height.value * h
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (flashPixels[(y * w + x) * 4]) {
          if (y >= h - flashHeight) flashInside++
          else flashOutside++
        }
    s.scene.add(s.skyFlash)
    s.skyFlash.visible = false
    read()
    return { layers, changed, flashInside, flashOutside }
  })
  for (const layer of pixels.layers) {
    assert.ok(layer.upper > 100)
    assert.equal(layer.lower, 0, 'World occludes the sky')
  }
  assert.ok(pixels.flashInside > 100)
  assert.equal(pixels.flashOutside, 0)
  assert.ok(pixels.changed > 100, 'Native horizon must change rendered pixels')
  await page.screenshot({ path: '/private/tmp/populous-sky-horizon-after.png' })
  const before = await page.evaluate(() => {
    const s = window.testScene
    requestAnimationFrame(s.animate)
    return s.cameraBearing
  })
  await page.keyboard.down('e')
  await page.waitForTimeout(400)
  await page.keyboard.up('e')
  assert.notEqual(await page.evaluate(() => window.testScene.cameraBearing), before)
  const paused = await page.evaluate(() => {
    const s = window.testScene
    s.world.paused = true
    return { turn: s.world.turn, x: s.skyMotion.x, y: s.skyMotion.y }
  })
  await page.waitForTimeout(200)
  assert.ok(
    await page.evaluate(p => {
      const s = window.testScene
      return s.world.turn === p.turn && (s.skyMotion.x !== p.x || s.skyMotion.y !== p.y)
    }, paused)
  )
  await page.evaluate(() => window.testScene.overview())
  await settleView(page)
  assert.ok(
    await page.evaluate(() => {
      const s = window.testScene
      return s.globe.visible && !s.skyBackdrop.visible && s.skyClouds.every(m => !m.visible)
    })
  )
  await page.evaluate(() => window.testScene.overview())
  await settleView(page)
  assert.ok(
    await page.evaluate(() => {
      const s = window.testScene
      return !s.globe.visible && s.skyBackdrop.visible && s.skyClouds.every(m => m.visible)
    })
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: native sky bounds/fades through',
    checked,
    'view/size states, every zoom frame, zero horizon, GPU layers/occlusion, keyboard rotation, independent clock and overview return',
    pixels
  )
} finally {
  await browser.close()
}
