import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true }),
  reports = []
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 3440, height: 1440 },
  ]) {
    const { page, errors } = await openGame(browser)
    await page.setViewportSize(viewport)
    await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        m = await import('/app/model.ts')
      cancelAnimationFrame(s.frame)
      const version = w.terrainVersion + 1
      Object.assign(w, m.createWorld())
      w.terrainVersion = version
      w.terrain.fill(3)
      Object.assign(w, { units: [], buildings: [], shrines: [], trees: [], inputMask: 0, speed: 0 })
      w.manaWorld.gameFlags = 96
      w.flyby.flags = 0
      const b = m.addBuilding(w, 'red', 'hut', { x: 0, z: 0 })
      const units = Array.from({ length: 6 }, (_, i) =>
        m.addUnit(w, 'blue', 'warrior', { x: i / 10, z: 20 })
      )
      window.areaAttack = { b, units }
      m.setSelection(
        w,
        units.map(u => u.id)
      )
      s.focus({ x: 8, z: 8 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    })
    for (const [x, z, ctrl] of [
      [0, 12, true],
      [0, 0, true],
      [16, 12, false],
    ]) {
      const point = await page.evaluate(
        ({ x, z }) => {
          const s = window.testScene,
            p = s.screen({ x, z }),
            r = s.container.getBoundingClientRect()
          return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
        },
        { x, z }
      )
      if (ctrl) await page.keyboard.down('Control')
      await page.mouse.click(point.x, point.y)
      if (ctrl) await page.keyboard.up('Control')
    }
    const result = await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        { b, units } = window.areaAttack
      const { advanceGame } = await import('/app/game-clock.ts')
      const p = units[0].native,
        ids = p.commands.filter(Boolean),
        timings = []
      const models = ids.map(id => w.buildingOrders.records[id].model)
      const shared =
        units.every(u => u.native.commands.join() === p.commands.join()) &&
        ids.every(id => w.buildingOrders.records[id].references === 6)
      const advance = () => {
        w.speed = 1
        const start = performance.now()
        advanceGame(w, s.gameClock, 1 / 12)
        timings.push(performance.now() - start)
        w.speed = 0
      }
      for (let i = 0; i < 300 && !(b.damageState?.damage > 0); i++) advance()
      s.cameraBearing = Math.PI
      s.focus({ x: 0, z: 1 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const attacking = b.damageState?.damage > 0 && units.some(u => u.native?.animationMode === 46)
      const mesh = s.unitMeshes.get(units.find(u => u.native?.animationMode === 46)?.id)
      const visible = !!mesh?.visible
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
      if (mesh) mesh.visible = false
      const after = read()
      if (mesh) mesh.visible = true
      let pixels = 0
      for (let i = 0; i < before.length; i += 4)
        if (
          before[i] !== after[i] ||
          before[i + 1] !== after[i + 1] ||
          before[i + 2] !== after[i + 2]
        )
          pixels++
      const frozen = JSON.stringify({ turn: w.turn, damage: b.damageState, people: units })
      w.paused = true
      w.speed = 1
      advanceGame(w, s.gameClock, 10)
      w.speed = 0
      w.paused = false
      const paused =
        frozen === JSON.stringify({ turn: w.turn, damage: b.damageState, people: units })
      for (let i = 0; i < 1500 && w.buildingOrders.active; i++) advance()
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const sorted = timings.toSorted((a, b) => a - b),
        info = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        models,
        shared,
        attacking,
        visible,
        pixels,
        paused,
        destroyed: b.hp === 0,
        arrived: units.every(u => u.hp > 0 && u.x > 14 && u.z > 9),
        orders: w.buildingOrders.active,
        performance: {
          userAgent: navigator.userAgent,
          renderer: info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
          viewport: [innerWidth, innerHeight],
          dpr: devicePixelRatio,
          samples: sorted.length,
          medianMs: sorted[Math.floor(sorted.length / 2)],
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          limitation:
            'Six-person complete simulation turns; headless software rendering and coarse browser timer. No hardware FPS or speedup claim.',
        },
      }
    })
    assert.deepEqual(result.models, [3, 19, 3])
    for (const key of ['shared', 'attacking', 'visible', 'paused', 'destroyed', 'arrived'])
      assert.equal(result[key], true, key)
    assert.ok(result.pixels > 5, JSON.stringify(result))
    assert.equal(result.orders, 0)
    assert.deepEqual(errors, [])
    reports.push(result)
    if (viewport.width === 1440)
      await page.screenshot({ path: '/private/tmp/populous-area-attack.png' })
    await page.close()
  }
  writeFileSync(
    'references/performance/2026-09-11-area-attack.json',
    JSON.stringify(reports, null, 2) + '\n'
  )
  console.log(JSON.stringify(reports, null, 2))
} finally {
  await browser.close()
}
