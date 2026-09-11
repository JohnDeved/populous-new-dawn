import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true }),
  reports = []
try {
  const { page, errors } = await openGame(browser)
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 3440, height: 1440 },
  ]) {
    await page.setViewportSize(viewport)
    await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        m = await import('/app/model.ts')
      cancelAnimationFrame(s.frame)
      const version = w.terrainVersion + 1
      Object.assign(w, m.createWorld())
      w.terrainVersion = version
      w.units = []
      w.buildings = []
      w.shrines = []
      w.trees = []
      w.terrain.fill(3)
      w.manaWorld.gameFlags = 32
      w.flyby.flags = 0
      w.inputMask = 0
      w.speed = 0
      const b = m.addBuilding(w, 'blue', 'camp', { x: 4, z: 24 }, true)
      const people = Array.from({ length: 3 }, (_, i) =>
        m.addUnit(w, 'blue', 'brave', { x: -15 + i * 0.5, z: 8 })
      )
      window.mixed = { b, people }
      m.setSelection(
        w,
        people.map(u => u.id)
      )
      s.focus({ x: 2, z: 16 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    })
    const click = async (point, ctrl = false) => {
      const p = await page.evaluate(point => {
        const s = window.testScene,
          p = s.screen(point),
          r = s.container.getBoundingClientRect()
        return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
      }, point)
      if (ctrl) await page.keyboard.down('Control')
      await page.mouse.click(p.x, p.y)
      if (ctrl) await page.keyboard.up('Control')
    }
    await click({ x: -4, z: 8 }, true)
    await click(await page.evaluate(() => ({ x: window.mixed.b.x, z: window.mixed.b.z })), true)
    await click({ x: 20, z: 8 })
    const queued = await page.evaluate(() => {
      const w = window.testScene.world
      return w.units.map(u => ({
        work: u.work,
        models: u.native?.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model),
      }))
    })
    assert.ok(
      queued.every(u => u.work === null && JSON.stringify(u.models) === '[3,8,3]'),
      JSON.stringify(queued)
    )
    const result = await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        h = window.mixed,
        { advanceGame } = await import('/app/game-clock.ts'),
        { stepLiveTraining } = await import('/app/live-building-entry.ts')
      const times = [],
        advance = () => {
          w.speed = 1
          const start = performance.now()
          advanceGame(w, s.gameClock, 1 / 12)
          times.push(performance.now() - start)
          w.speed = 0
        }
      for (
        let i = 0;
        i < 400 && !h.people.every(u => u.inside === h.b.id && u.entry?.person.substate === 13);
        i++
      )
        advance()
      const inside = h.b.admission?.inside,
        tail = w.buildingOrders.records[h.people[0].entry.person.commands[2]]
      w.manaWorld.gameFlags = 0
      h.b.timer = 65535
      stepLiveTraining(w, h.b)
      w.manaWorld.gameFlags = 32
      const inherited = w.units
        .filter(u => u.hp > 0)
        .every(u => w.buildingOrders.records[u.native.commands[0]] === tail)
      for (let i = 0; i < 35; i++) advance()
      s.focus({ x: 12, z: 16 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const sprites = (await import('/app/original-units.json')).default,
        walk = new Set(sprites.animations['blue-warrior'].walk.flatMap(d => d.frames))
      const warriors = w.units.filter(u => u.hp > 0),
        meshes = warriors.map(u => s.unitMeshes.get(u.id))
      const walking = meshes.every(g => g?.visible && walk.has(g.userData.frame))
      const gl = s.renderer.getContext(),
        read = () => {
          s.renderer.render(s.scene, s.camera)
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
          return pixels
        }
      const before = read()
      meshes.forEach(g => (g.visible = false))
      const after = read()
      meshes.forEach(g => (g.visible = true))
      let pixels = 0
      for (let i = 0; i < before.length; i += 4)
        if (
          before[i] !== after[i] ||
          before[i + 1] !== after[i + 1] ||
          before[i + 2] !== after[i + 2]
        )
          pixels++
      for (let i = 0; i < 250; i++) advance()
      s.focus({ x: 20, z: 8 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const sorted = times.slice().sort((a, b) => a - b),
        info = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        inside,
        inherited,
        walking,
        pixels,
        arrived: warriors.every(u => u.x > 18 && u.z < 10),
        orders: w.buildingOrders.active,
        routes: w.motionRoutes.active,
        performance: {
          userAgent: navigator.userAgent,
          renderer: info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
          viewport: [innerWidth, innerHeight],
          dpr: devicePixelRatio,
          samples: times,
          median: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          max: Math.max(...times),
          drawCalls: s.renderer.info.render.calls,
        },
      }
    })
    assert.equal(result.inside, 3)
    assert.ok(result.inherited)
    assert.ok(result.walking)
    assert.ok(result.pixels > 50)
    assert.ok(result.arrived)
    assert.equal(result.orders, 0)
    assert.equal(result.routes, 0)
    reports.push(result)
  }
  await page.screenshot({ path: '/private/tmp/populous-mixed-building-orders.png' })
  assert.deepEqual(errors, [])
  writeFileSync(
    'references/performance/2026-09-11-mixed-building-orders.json',
    JSON.stringify({
      scope:
        'Headless browser correctness and CPU timing for real Ctrl clicks, native ground-to-training handoff, conversion with inherited ground commands, original moving warrior sprite pixels and final arrival. Three people. No equivalent before/after speedup or hardware FPS claim.',
      reports,
    }) + '\n'
  )
  console.log(
    'PASS: desktop/ultrawide real Ctrl ground → training → ground input, inherited shared orders, visible original warrior walking pixels and settled arrival',
    reports.map(r => ({ pixels: r.pixels, median: r.performance.median, p95: r.performance.p95 }))
  )
} finally {
  await browser.close()
}
