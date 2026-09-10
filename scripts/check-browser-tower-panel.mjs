import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import fixture from '../tests/fixtures/tower-panel.json' with { type: 'json' }
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
    window.towerPanel = { b, u, frames: [] }
    w.selected = [u.id]
    s.focus(b)
    s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  const ground = async p =>
    page.evaluate(p => {
      const s = window.testScene,
        q = s.screen(p ?? window.towerPanel.b),
        r = s.container.getBoundingClientRect()
      return { x: r.x + ((q.x + 1) * r.width) / 2, y: r.y + ((1 - q.y) * r.height) / 2 }
    }, p)
  let target = await ground()
  await page.mouse.click(target.x, target.y)
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene,
      h = window.towerPanel,
      animate = s.animate,
      after = s.gameClock.afterTurn
    s.animate = now => {
      const t = performance.now()
      animate(now)
      if (!h.ready)
        h.frames.push({
          time: now,
          cpu: performance.now() - t,
          calls: s.renderer.info.render.calls,
        })
    }
    s.gameClock.afterTurn = () => {
      after()
      if (h.u.inside === h.b.id && h.u.entry?.person.timer === 0) {
        h.ready = true
        s.world.speed = 0
        s.gameClock.afterTurn = after
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.towerPanel.ready)
  const panel = page.locator('.tower-panel:not([hidden])'),
    occupant = panel.getByRole('button', { name: 'Occupant 1: warrior' })
  await panel.waitFor({ state: 'visible' })
  assert.match(await panel.getAttribute('aria-label'), /1 of 1/)
  assert.deepEqual(await panel.locator('canvas').evaluate(c => [c.width, c.height]), [48, 62])
  await page.evaluate(() => {
    window.testScene.world.selected = []
    window.testScene.renderBuildingPanels()
  })
  await occupant.click()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [
    await page.evaluate(() => window.towerPanel.u.id),
  ])
  await occupant.click({ modifiers: ['Shift'] })
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
  await occupant.focus()
  await page.keyboard.press('Space')
  assert.equal(await occupant.getAttribute('aria-pressed'), 'true')
  await occupant.click({ button: 'right' })
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  assert.equal(
    await page.evaluate(() => window.towerPanel.u.inside),
    await page.evaluate(() => window.towerPanel.b.id)
  )
  const cached = await panel.locator('canvas').evaluate(async c => {
    const ctx = c.getContext('2d'),
      draw = ctx.drawImage
    let n = 0
    ctx.drawImage = function (...a) {
      n++
      return draw.apply(this, a)
    }
    await new Promise(resolve => {
      let i = 0
      const f = () => (++i === 30 ? resolve() : requestAnimationFrame(f))
      requestAnimationFrame(f)
    })
    ctx.drawImage = draw
    return n
  })
  assert.equal(cached, 0)
  await page.screenshot({ path: '/private/tmp/populous-tower-panel.png' })
  const frames = await page.evaluate(
    async cases => {
      const { drawOccupantPanel } = await import('/app/training-panel.ts'),
        atlas = new Image()
      atlas.src = '/original/hud.png'
      await atlas.decode()
      return cases.map(state => {
        const c = document.createElement('canvas')
        drawOccupantPanel(c, atlas, state)
        return { state, png: c.toDataURL().split(',')[1] }
      })
    },
    fixture.cases.filter((_, i) => i % 4 === 0)
  )
  writeFileSync('/private/tmp/populous-tower-panel-pixels.json', JSON.stringify(frames))
  const geometry = []
  for (const [width, height, scale] of [
    [1440, 1000, 2],
    [1920, 1080, 2],
    [2560, 1440, 2.5],
    [3440, 1440, 2.5],
    [3840, 2160, 2.5],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(
      ({ width, scale }) => window.testScene.container.clientWidth === width - scale * 100,
      { width, scale }
    )
    await page.evaluate(() => window.testScene.renderBuildingPanels())
    const r = await panel.evaluate(p => {
      const r = p.getBoundingClientRect(),
        s = window.testScene,
        v = s.container.getBoundingClientRect(),
        q = s.screen(window.towerPanel.b)
      return {
        width: r.width,
        height: r.height,
        tail: [r.x + r.width / 2, r.bottom],
        anchor: [v.x + ((q.x + 1) * v.width) / 2, v.y + ((1 - q.y) * v.height) / 2],
        controls: [...p.querySelectorAll('button:not([hidden])')].map(b => {
          const t = b.getBoundingClientRect()
          return [t.x - r.x, t.y - r.y, t.width, t.height]
        }),
      }
    })
    assert.equal(r.width, 48 * scale)
    assert.equal(r.height, 62 * scale)
    assert.ok(r.tail.every((v, i) => Math.abs(v - r.anchor[i]) < 1))
    assert.deepEqual(
      r.controls.map(c => c.map(v => v / scale)),
      [
        [1, 1, 17, 24],
        [21, 0, 27, 28],
      ]
    )
    geometry.push({ width, height, scale, ...r })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForFunction(() => window.testScene.container.clientWidth === 1240)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 1
    s.renderBuildingPanels()
  })
  assert.equal(await page.locator('.tower-panel:not([hidden])').count(), 0)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 0
    s.cameraBearing = (3 * Math.PI) / 2
    s.updateView()
    s.renderBuildingPanels()
  })
  const before = await page.evaluate(() => [window.towerPanel.u.x, window.towerPanel.u.z])
  target = await ground({ x: 9, z: 37 })
  await page.mouse.click(target.x, target.y)
  assert.equal(await page.evaluate(() => window.towerPanel.u.inside), null)
  assert.deepEqual(
    await page.evaluate(() => [window.towerPanel.u.x, window.towerPanel.u.z]),
    before
  )
  await page.evaluate(() => (window.testScene.world.speed = 1))
  await page.waitForFunction(() => !window.towerPanel.u.path.length)
  await page.evaluate(() => (window.testScene.world.speed = 0))
  // Re-open the empty tower by hovering its actual mesh, then use the original control.
  const hit = await page.evaluate(() => {
    const s = window.testScene,
      b = window.towerPanel.b,
      r = s.container.getBoundingClientRect()
    for (let h = 0.25; h < 10; h += 0.25) {
      const q = s.screen(b, s.y(b) + h),
        x = r.x + ((q.x + 1) * r.width) / 2,
        y = r.y + ((1 - q.y) * r.height) / 2
      if (s.pickWorldObject({ clientX: x, clientY: y })?.id === b.id) return { x, y }
    }
    throw Error('No tower mesh hit')
  })
  await page.mouse.move(hit.x, hit.y)
  await panel.waitFor({ state: 'visible' })
  assert.match(await panel.getAttribute('aria-label'), /0 of 1/)
  const dismantle = panel.locator('.dismantle-control')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'true')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'false')
  await page.evaluate(async () => {
    const s = window.testScene,
      { addUnit } = await import('/app/model.ts')
    const u = addUnit(s.world, 'blue', 'brave', { x: 7, z: 33 })
    s.world.selected = [u.id]
    window.towerPanel.brave = u
  })
  await dismantle.click()
  target = await ground()
  await page.mouse.click(target.x, target.y)
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene,
      after = s.gameClock.afterTurn
    s.gameClock.afterTurn = () => {
      after()
      if (window.towerPanel.b.hp <= 0) s.world.speed = 0
    }
    s.world.speed = 1
  })
  try {
    await page.waitForFunction(() => window.towerPanel.b.hp <= 0, null, { timeout: 60000 })
  } catch (e) {
    console.log(
      await page.evaluate(() => {
        const h = window.towerPanel,
          u = h.brave
        return {
          progress: h.b.progress,
          hp: h.b.hp,
          activity: h.b.admission?.activity,
          work: u.work,
          position: [u.x, u.z],
          path: u.path,
          entry: u.entry?.person,
          selected: window.testScene.world.selected,
        }
      })
    )
    throw e
  }
  await page.waitForFunction(() => !document.querySelector('.tower-panel'))
  const performance = await page.evaluate(() => {
    const s = window.testScene,
      h = window.towerPanel,
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info'),
      f = h.frames,
      g = f.slice(1).map((v, i) => v.time - f[i].time),
      q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    return {
      userAgent: navigator.userAgent,
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      viewport: [1440, 1000],
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
    '/private/tmp/populous-tower-panel-browser.json',
    JSON.stringify({ headed, cached, pixelStates: frames.length, geometry, performance }, null, 2) +
      '\n'
  )
  console.log(
    'PASS: original tower panel, mouse/Shift/keyboard selection and focus, five desktop sizes, held occupant and exit, empty hover, dismantle/cancel/removal, cached canvas',
    performance
  )
} finally {
  await browser.close()
}
