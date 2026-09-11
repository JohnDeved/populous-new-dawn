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
      w.terrain.fill(3)
      w.units = []
      w.buildings = []
      w.shrines = []
      w.trees = []
      w.manaWorld.gameFlags = 96
      w.flyby.flags = 0
      w.inputMask = 0
      w.speed = 0
      const red = m.addUnit(w, 'red', 'warrior', { x: 0, z: 0 })
      const ally = m.addUnit(w, 'blue', 'warrior', { x: 1, z: 0 })
      const u = m.addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
      m.joinBattle(w, ally, red)
      window.combatQueue = { red, u }
      m.setSelection(w, [u.id])
      s.focus({ x: 8, z: 4 })
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    })
    for (const [x, ctrl] of [
      [12, true],
      [20, false],
    ]) {
      const point = await page.evaluate(x => {
        const s = window.testScene,
          p = s.screen({ x, z: 8 }),
          r = s.container.getBoundingClientRect()
        return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
      }, x)
      if (ctrl) await page.keyboard.down('Control')
      await page.mouse.click(point.x, point.y)
      if (ctrl) await page.keyboard.up('Control')
    }
    const result = await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        { u, red } = window.combatQueue
      const m = await import('/app/model.ts'),
        { advanceGame } = await import('/app/game-clock.ts')
      const p = u.native,
        ids = p.commands.filter(Boolean)
      const models = ids.map(id => w.buildingOrders.records[id].model)
      m.joinBattle(w, u, red)
      const retained =
        u.fight.motion === p &&
        u.native === null &&
        ids.every(id => w.buildingOrders.records[id].references === 1)
      const timings = []
      const advance = () => {
        w.speed = 1
        const start = performance.now()
        advanceGame(w, s.gameClock, 1 / 12)
        timings.push(performance.now() - start)
        w.speed = 0
      }
      for (let i = 0; i < 10; i++) advance()
      const fought = !!u.fight && u.fight.motion === p
      red.hp = 0
      for (let i = 0; i < 10; i++) advance()
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const sprites = (await import('/app/original-units.json')).default
      const walk = new Set(sprites.animations['blue-brave'].walk.flatMap(d => d.frames))
      const mesh = s.unitMeshes.get(u.id)
      const walking = !u.fight && u.native === p && mesh?.visible && walk.has(mesh.userData.frame)
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
      mesh.visible = false
      const after = read()
      mesh.visible = true
      let pixels = 0
      for (let i = 0; i < before.length; i += 4)
        if (
          before[i] !== after[i] ||
          before[i + 1] !== after[i + 1] ||
          before[i + 2] !== after[i + 2]
        )
          pixels++
      const frozen = JSON.stringify({ x: u.x, z: u.z, commands: p.commands, turn: w.turn })
      w.paused = true
      w.speed = 1
      advanceGame(w, s.gameClock, 10)
      w.speed = 0
      const paused =
        frozen === JSON.stringify({ x: u.x, z: u.z, commands: p.commands, turn: w.turn })
      w.paused = false
      for (let i = 0; i < 400 && w.buildingOrders.active; i++) advance()
      const sorted = timings.toSorted((a, b) => a - b),
        info = gl.getExtension('WEBGL_debug_renderer_info')
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return {
        models,
        retained,
        fought,
        walking,
        pixels,
        paused,
        arrived: u.x > 18 && u.z > 6,
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
            'Headless software-renderer check; simulation timings only, coarse timer, no hardware FPS or speedup claim.',
        },
      }
    })
    assert.deepEqual(result.models, [3, 3])
    for (const name of ['retained', 'fought', 'walking', 'paused', 'arrived'])
      assert.equal(result[name], true, name)
    assert.ok(result.pixels > 5)
    assert.equal(result.orders, 0)
    reports.push(result)
    if (viewport.width === 1440)
      await page.screenshot({ path: '/private/tmp/populous-combat-queues.png' })
  }
  assert.deepEqual(errors, [])
  writeFileSync(
    'references/performance/2026-09-11-combat-queues.json',
    JSON.stringify(reports, null, 2) + '\n'
  )
  console.log(JSON.stringify(reports, null, 2))
} finally {
  await browser.close()
}
