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
      w.units = w.units.filter(u => u.team === 'blue')
      w.manaWorld.gameFlags = 32
      w.flyby.flags = 0
      w.inputMask = 0
      w.speed = 0
      m.setSelection(
        w,
        w.units.map(u => u.id)
      )
      s.focus(w.shrines.find(h => h.kind === 'bridge'))
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    })
    const click = async point => {
      const p = await page.evaluate(point => {
        const s = window.testScene,
          p = s.screen(point),
          r = s.container.getBoundingClientRect()
        return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
      }, point)
      await page.keyboard.down('Control')
      await page.mouse.click(p.x, p.y)
      await page.keyboard.up('Control')
    }
    await click({ x: 4, z: 24 })
    const first = await page.evaluate(() => window.testScene.world.units[0].native.commands[0])
    await click(
      await page.evaluate(() => {
        const h = window.testScene.world.shrines.find(h => h.kind === 'bridge')
        return { x: h.x, z: h.z }
      })
    )
    const queue = await page.evaluate(() => {
      const w = window.testScene.world,
        p = w.units[0].native
      return {
        cursor: w.orderCursor,
        selected: w.selected.length,
        slots: p.commands,
        models: p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model),
        flags: p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].flags),
        work: w.units.map(u => u.work),
      }
    })
    assert.equal(queue.cursor, 0)
    assert.equal(queue.selected, 7)
    assert.equal(queue.slots[0], first)
    assert.deepEqual(queue.models, [3, 27])
    assert.deepEqual(queue.flags, [128, 0])
    assert.ok(queue.work.every(id => id === null))
    const result = await page.evaluate(async () => {
      const s = window.testScene,
        w = s.world,
        { advanceGame } = await import('/app/game-clock.ts'),
        { liveWorshippers } = await import('/app/live-worship.ts')
      const times = [],
        phases = new Set(),
        head = w.shrines.find(h => h.kind === 'bridge')
      w.speed = 1
      for (let i = 0; i < 420; i++) {
        const start = performance.now()
        advanceGame(w, s.gameClock, 1 / 12)
        times.push(performance.now() - start)
        phases.add(w.units[0].native.commandStatus)
      }
      w.speed = 0
      s.onChange()
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const meshes = w.units.map(u => s.unitMeshes.get(u.id)),
        gl = s.renderer.getContext()
      const read = () => {
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
      const sorted = times.slice().sort((a, b) => a - b),
        info = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        phases: [...phases],
        roster: liveWorshippers(w, head).length,
        uses: head.uses,
        shots: w.shots.bridge,
        pixels,
        people: w.units.map(u => ({
          object: u.native.object,
          phase: u.native.substate,
          work: u.work,
          frame: s.unitMeshes.get(u.id)?.userData.frame,
          visible: s.unitMeshes.get(u.id)?.visible,
        })),
        performance: {
          userAgent: navigator.userAgent,
          renderer: info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
          viewport: [innerWidth, innerHeight],
          dpr: devicePixelRatio,
          samples: times,
          median: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          max: Math.max(...times),
        },
      }
    })
    assert.deepEqual(result.phases, [3, 27])
    assert.equal(result.roster, 7)
    assert.ok(result.uses >= 1 && result.shots >= 1)
    assert.ok(result.pixels > 50)
    assert.ok(
      result.people.every(
        p =>
          p.visible &&
          Number.isInteger(p.frame) &&
          [64, 744].includes(p.object) &&
          [2, 3].includes(p.phase)
      )
    )
    reports.push(result)
  }
  await page.screenshot({ path: '/private/tmp/populous-worship-waypoints.png' })
  assert.deepEqual(errors, [])
  writeFileSync(
    'references/performance/2026-09-11-worship-waypoints.json',
    JSON.stringify({
      scope:
        'Headless Chromium, seven followers, actual Ctrl ground/head clicks and native queue completion, prayer sprite pixels and rewards. CPU visits only, coarse browser timers; not hardware FPS or a before/after speedup.',
      reports,
    }) + '\n'
  )
  console.log(
    'PASS: real desktop/ultrawide Ctrl waypoint → stone-head input, forced sequence completion, seven original prayer sprites and rewards',
    reports.map(r => ({ pixels: r.pixels, p95: r.performance.p95 }))
  )
} finally {
  await browser.close()
}
