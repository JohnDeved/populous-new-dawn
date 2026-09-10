import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import fixture from '../tests/fixtures/construction-panel.json' with { type: 'json' }
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
    const b = m.addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, false, { angle: Math.PI })
    b.progress = 0.5
    m.ensureBuildingDamage(b)
    const people = Array.from({ length: 4 }, (_, i) =>
      m.addUnit(w, 'blue', 'brave', { x: 7 + i * 0.4, z: 33 })
    )
    w.selected = people.map(u => u.id)
    window.planCheck = { b, people, frames: [] }
    s.focus(b)
    s.startGroundView(2)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  const target = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen(window.planCheck.b),
      r = s.container.getBoundingClientRect()
    return { x: r.x + ((p.x + 1) * r.width) / 2, y: r.y + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(target.x, target.y)
  const panel = page.locator('.construction-panel:not([hidden])'),
    button = panel.locator('.dismantle-control')
  try {
    await panel.waitFor({ state: 'visible', timeout: 5000 })
  } catch (e) {
    console.log(
      await page.evaluate(() => ({
        b: window.planCheck.b,
        hover: window.testScene.hoveredObject,
        pointer: window.testScene.pointer,
        panels: document.querySelectorAll('.training-panel').length,
        work: window.planCheck.people.map(u => u.work),
      }))
    )
    await page.screenshot({ path: '/private/tmp/populous-plan-failure.png' })
    throw e
  }
  assert.match(await panel.getAttribute('aria-label'), /4 of 16 workers; 4 of 8 timber/)
  const worker = panel.getByRole('button', { name: 'Worker 2: brave' })
  await worker.click()
  assert.equal(await page.evaluate(() => window.testScene.world.selected.length), 3)
  await worker.click({ modifiers: ['Shift'] })
  assert.equal(await page.evaluate(() => window.testScene.world.selected.length), 4)
  await worker.focus()
  await page.keyboard.press('Space')
  assert.equal(await page.evaluate(() => window.testScene.world.selected.length), 3)
  const cached = await page.evaluate(async () => {
    const canvas = document.querySelector('.construction-panel canvas'),
      ctx = canvas.getContext('2d'),
      draw = ctx.drawImage
    let paints = 0
    ctx.drawImage = function (...args) {
      paints++
      return draw.apply(this, args)
    }
    await new Promise(resolve => {
      let n = 0
      const f = () => (++n === 30 ? resolve() : requestAnimationFrame(f))
      requestAnimationFrame(f)
    })
    ctx.drawImage = draw
    return paints
  })
  assert.equal(cached, 0)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 1
    s.renderBuildingPanels()
  })
  assert.equal(await page.locator('.construction-panel:not([hidden])').count(), 0)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 0
    s.renderBuildingPanels()
  })
  await page.screenshot({ path: '/private/tmp/populous-construction-panel.png' })
  const pixels = await page.evaluate(
    async cases => {
      const { constructionPanel } = await import('/app/construction-panel.ts'),
        { paintPanel } = await import('/app/training-panel.ts')
      const atlas = new Image()
      atlas.src = '/original/hud.png'
      await atlas.decode()
      return cases.map(state => {
        const c = document.createElement('canvas')
        paintPanel(c, atlas, constructionPanel(state))
        return { state, png: c.toDataURL().split(',')[1] }
      })
    },
    fixture.cases.filter((_, i) => i % 20 === 0)
  )
  writeFileSync('/private/tmp/populous-construction-panel-pixels.json', JSON.stringify(pixels))
  const geometry = []
  for (const [width, height] of [
    [1440, 1000],
    [1920, 1080],
    [2560, 1440],
    [3440, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(width => window.testScene.container.clientWidth === width - (width >= 2560 ? 250 : 200), width)
    await page.evaluate(() => window.testScene.renderBuildingPanels())
    const g = await panel.evaluate(p => {
      const c = p.querySelector('canvas'),
        r = p.getBoundingClientRect(),
        s = window.testScene,
        v = s.container.getBoundingClientRect(),
        q = s.screen(window.planCheck.b)
      return {
        native: [c.width, c.height],
        actual: [r.width, r.height],
        tail: [r.x + r.width / 2, r.bottom],
        anchor: [v.x + ((q.x + 1) * v.width) / 2, v.y + ((1 - q.y) * v.height) / 2],
        buttons: [...p.querySelectorAll('button:not([hidden])')].map(b => {
          const t = b.getBoundingClientRect()
          return [t.x - r.x, t.y - r.y, t.width, t.height]
        }),
      }
    })
    assert.ok(Math.abs(g.actual[0] / g.native[0] - g.actual[1] / g.native[1]) < 0.001)
    assert.ok(
      g.tail.every((v, i) => Math.abs(v - g.anchor[i]) < 1),
      JSON.stringify(g)
    )
    assert.ok(
      g.buttons.every(
        ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= g.actual[0] + 1 && y + h <= g.actual[1] + 1
      )
    )
    geometry.push({ width, height, ...g })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForFunction(() => window.testScene.container.clientWidth === 1240)
  const before = await page.evaluate(() => window.planCheck.people.map(u => [u.x, u.z, u.cargo]))
  await button.click()
  assert.deepEqual(
    await page.evaluate(() => window.planCheck.people.map(u => [u.x, u.z, u.cargo])),
    before
  )
  assert.ok(
    await page.evaluate(async () => {
      const { isDismantling } = await import('/app/live-building-entry.ts')
      return window.planCheck.people.every(
        u => isDismantling(window.testScene.world, u) && !u.builder
      )
    })
  )
  await button.click()
  assert.equal(await button.getAttribute('aria-pressed'), 'false')
  const woodBeforeCancel = await page.evaluate(() => window.planCheck.b.damageState.plan.remaining)
  await page.evaluate(() => {
    const s = window.testScene,
      after = s.gameClock.afterTurn,
      until = s.world.turn + 3
    s.gameClock.afterTurn = () => {
      after()
      if (s.world.turn >= until) {
        s.world.speed = 0
        s.gameClock.afterTurn = after
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.testScene.world.speed === 0)
  assert.equal(
    await page.evaluate(() => window.planCheck.b.damageState.plan.remaining),
    woodBeforeCancel
  )
  await button.click()
  assert.equal(await button.getAttribute('aria-pressed'), 'true')
  // Resume from cancellation through actual movement input, keeping the same building panel.
  await page.evaluate(
    () => (window.testScene.world.selected = window.planCheck.people.map(u => u.id))
  )
  await page.mouse.click(target.x, target.y)
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene,
      h = window.planCheck,
      animate = s.animate,
      after = s.gameClock.afterTurn
    s.animate = now => {
      const start = performance.now()
      animate(now)
      if (!h.done)
        h.frames.push({
          time: now,
          cpu: performance.now() - start,
          calls: s.renderer.info.render.calls,
        })
    }
    s.gameClock.afterTurn = () => {
      after()
      if (h.b.hp <= 0) {
        h.done = true
        s.world.speed = 0
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.planCheck.done)
  await page.waitForFunction(() => !document.querySelector('.construction-panel'))
  const performance = await page.evaluate(() => {
    const s = window.testScene,
      h = window.planCheck,
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info'),
      f = h.frames,
      g = f.slice(1).map((v, i) => v.time - f[i].time),
      q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    return {
      userAgent: navigator.userAgent,
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      frames: f.length,
      cpu: {
        p50: q(
          f.map(v => v.cpu),
          0.5
        ),
        p95: q(
          f.map(v => v.cpu),
          0.95
        ),
      },
      gaps: { p50: q(g, 0.5), p95: q(g, 0.95), max: Math.max(...g) },
      maxDrawCalls: Math.max(...f.map(v => v.calls)),
    }
  })
  assert.deepEqual(errors, [])
  writeFileSync(
    '/private/tmp/populous-construction-panel-browser.json',
    JSON.stringify({ headed, cached, pixelStates: pixels.length, geometry, performance }, null, 2) +
      '\n'
  )
  console.log(
    'PASS: original construction workers/timber, mouse/Shift/keyboard selection, cached canvas, five desktop sizes, active-builder reassignment and dismantle/cancel/restart/removal',
    performance
  )
} finally {
  await browser.close()
}
