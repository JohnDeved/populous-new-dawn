import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const headed = process.argv.includes('--headed'),
  browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts')
    w.speed = 0
    w.manaWorld.gameFlags = 32
    const b = m.addBuilding(w, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI }),
      u = m.addUnit(w, 'blue', 'warrior', { x: 7, z: 33 })
    w.selected = [u.id]
    window.tower = { b, u, frames: [] }
    s.focus(b)
    s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  const target = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen(window.tower.b),
      r = s.container.getBoundingClientRect()
    return { x: r.x + ((p.x + 1) * r.width) / 2, y: r.y + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(target.x, target.y, { button: 'right' })
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene,
      h = window.tower,
      animate = s.animate,
      after = s.gameClock.afterTurn
    s.animate = now => {
      const start = performance.now()
      animate(now)
      if (!h.paused)
        h.frames.push({
          time: now,
          cpu: performance.now() - start,
          calls: s.renderer.info.render.calls,
        })
    }
    s.gameClock.afterTurn = () => {
      after()
      if (h.u.inside === h.b.id && h.u.entry?.person.timer === 0) {
        h.paused = true
        s.world.speed = 0
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.tower.paused)
  const result = await page.evaluate(async () => {
    const s = window.testScene,
      h = window.tower,
      u = h.u,
      p = u.entry.person,
      g = s.unitMeshes.get(u.id),
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info')
    const art = (await import('/app/original-units.json')).default,
      poses = Object.values(art.animations['blue-warrior']).find(d => d[0].source === p.object)
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const b = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        b
      )
      return b
    }
    const layers = g.userData.layers.filter(l => l.visible),
      before = read()
    layers.forEach(l => (l.visible = false))
    const after = read()
    layers.forEach(l => (l.visible = true))
    let pixels = 0
    for (let i = 0; i < before.length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    const frames = h.frames,
      gaps = frames.slice(1).map((f, i) => f.time - frames[i].time),
      q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    return {
      inside: u.inside === h.b.id,
      visible: g.visible,
      pixels,
      correctPose: poses.some(d => d.frames.includes(g.userData.frame)),
      height: g.position.y,
      expectedHeight: (p.h + p.supportHeight) / 128,
      offset: p.supportHeight,
      held: !!(p.renderFlags & 2),
      performance: {
        userAgent: navigator.userAgent,
        renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        frames: frames.length,
        cpu: {
          p50: q(
            frames.map(f => f.cpu),
            0.5
          ),
          p95: q(
            frames.map(f => f.cpu),
            0.95
          ),
        },
        gaps: { p50: q(gaps, 0.5), p95: q(gaps, 0.95), max: Math.max(...gaps) },
        maxDrawCalls: Math.max(...frames.map(f => f.calls)),
      },
    }
  })
  assert.ok(result.inside && result.visible && result.correctPose && result.held)
  assert.equal(result.height, result.expectedHeight)
  assert.equal(result.offset, 480)
  assert.ok(result.pixels > 25, JSON.stringify(result))
  await page.screenshot({ path: '/private/tmp/populous-tower-occupant.png' })
  // Render the same native socket from each camera bearing; no per-view fake height.
  for (let i = 1; i < 4; i++) {
    await page.evaluate(i => {
      const s = window.testScene
      s.cameraBearing = (i * Math.PI) / 2
      s.updateView()
    }, i)
    await page.screenshot({ path: `/private/tmp/populous-tower-bearing-${i}.png` })
  }
  // The higher view must retain real roof occlusion rather than forcing sprites on top.
  const occlusion = await page.evaluate(() => {
    const s = window.testScene
    s.cameraBearing = 0
    s.startGroundView(2)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.updateView()
    const h = window.tower,
      g = s.unitMeshes.get(h.u.id),
      tower = s.buildingMeshes.get(h.b.id),
      gl = s.renderer.getContext()
    const layers = g.userData.layers.filter(l => l.visible)
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const b = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        b
      )
      return b
    }
    const pixels = () => {
      const a = read()
      layers.forEach(l => (l.visible = false))
      const b = read()
      layers.forEach(l => (l.visible = true))
      let n = 0
      for (let i = 0; i < a.length; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++
      return n
    }
    const covered = pixels()
    tower.visible = false
    const exposed = pixels()
    tower.visible = true
    return { covered, exposed }
  })
  assert.ok(
    occlusion.exposed > 25 && occlusion.covered < occlusion.exposed,
    JSON.stringify(occlusion)
  )
  await page.evaluate(() => {
    const s = window.testScene
    s.cameraBearing = (3 * Math.PI) / 2
    s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.updateView()
  })
  const exit = await page.evaluate(() => {
    const s = window.testScene,
      u = window.tower.u,
      p = s.screen({ x: 9, z: 37 }),
      r = s.container.getBoundingClientRect()
    s.world.selected = [u.id]
    return {
      x: r.x + ((p.x + 1) * r.width) / 2,
      y: r.y + ((1 - p.y) * r.height) / 2,
      position: [u.x, u.z],
    }
  })
  await page.mouse.click(exit.x, exit.y, { button: 'right' })
  const released = await page.evaluate(() => {
    const u = window.tower.u
    return { inside: u.inside, position: [u.x, u.z], offset: u.supportHeight, path: u.path.length }
  })
  assert.equal(released.inside, null)
  assert.deepEqual(released.position, exit.position)
  assert.equal(released.offset, 480)
  assert.ok(released.path)
  await page.evaluate(() => (window.testScene.world.speed = 1))
  await page.waitForFunction(() => window.tower.u.path.length === 0)
  assert.equal(await page.evaluate(() => window.tower.u.supportHeight), undefined)
  assert.ok(
    await page.evaluate(() => Math.hypot(window.tower.u.x + 1.25, window.tower.u.z - 31) > 2)
  )
  assert.deepEqual(errors, [])
  writeFileSync(
    '/private/tmp/populous-tower-browser.json',
    JSON.stringify({ headed, result, occlusion, released }, null, 2) + '\n'
  )
  console.log(
    'PASS: actual warrior right-click admission, elevated GPU sprite pixels, original held pose, four camera bearings, no-teleport exit and cleared height on movement',
    result
  )
} finally {
  await browser.close()
}
