// npm run dev; add --headed for hardware frame-cost evidence.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const headed = process.argv.includes('--headed')
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    const b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    w.speed = 0
    w.manaWorld.gameFlags = 32
    for (const u of w.units.filter(u => u.team === 'blue' && u.kind === 'brave')) {
      w.selected = [u.id]
      m.command(w, { x: 8, z: 27 })
    }
    const people = Array.from({ length: 3 }, (_, i) => m.addUnit(w, 'blue', 'brave', { x: 9 + i, z: 30 }))
    w.selected = people.map(u => u.id)
    window.housing = { b, people, m, frames: [], positions: [] }
    s.focus(b)
    s.startGroundView(2)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  const target = await page.evaluate(async () => {
    const s = window.testScene, { b, m } = window.housing, r = s.container.getBoundingClientRect()
    const { buildingFootprintCells } = await import('/app/building-shapes.ts')
    for (const point of [b, ...buildingFootprintCells(m.buildingPose(b)).map(i => m.browserPosition({ x: (i % 128) * 512 + 256, y: Math.floor(i / 128) * 512 + 256 }))]) {
      const p = s.screen(point), x = r.left + (p.x + 1) * r.width / 2, y = r.top + (1 - p.y) * r.height / 2
      const picked = s.pick({ clientX: x, clientY: y })
      if (!picked) continue
      const native = m.nativePosition(s.world, picked), cell = ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9)
      if ((s.world.land.buildingIds[cell] & 1023) === b.id) return { x, y }
    }
    throw Error('No clickable housing footprint')
  })
  await page.mouse.click(target.x, target.y, { button: 'right' })
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene, h = window.housing, animate = s.animate, afterTurn = s.gameClock.afterTurn
    h.commanded = h.people.every(u => u.work === h.b.id)
    s.animate = now => {
      const start = performance.now()
      animate(now)
      if (!h.paused) h.frames.push({ time: now, cpu: performance.now() - start, calls: s.renderer.info.render.calls })
    }
    s.gameClock.afterTurn = () => {
      afterTurn()
      h.positions.push(h.people.map(u => ({ x: u.x, z: u.z, inside: u.inside, phase: u.entry?.person.substate })))
      if (!h.paused && h.people.some(u => u.entry?.person.substate === 5)) {
        h.paused = true
        s.world.speed = 0
      }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.housing.paused)
  const visible = await page.evaluate(async () => {
    const s = window.testScene, h = window.housing, u = h.people.find(u => u.entry?.person.substate === 5)
    const g = s.unitMeshes.get(u.id), p = u.entry.person
    const rules = (await import('/app/original-rules.json')).default
    h.crossing = u
    const gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      return pixels
    }
    const before = read(); g.visible = false; const after = read(); g.visible = true
    let pixels = 0
    for (let i = 0; i < before.length; i += 4) if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    const frames = h.frames, gaps = frames.slice(1).map((f, i) => f.time - frames[i].time)
    const q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    return { commanded: h.commanded, inside: u.inside, visible: g.visible, layers: g.children.filter(c => c.isSprite && c.visible).length,
      object: p.object, expected: rules.animationObjects[rules.personAnimationObjects[9 + p.model]][0], pixels,
      performance: { userAgent: navigator.userAgent, renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
        frames: frames.length, cpu: { p50: q(frames.map(f => f.cpu), .5), p95: q(frames.map(f => f.cpu), .95) },
        gaps: { p50: q(gaps, .5), p95: q(gaps, .95), max: Math.max(...gaps) }, maxDrawCalls: Math.max(...frames.map(f => f.calls)) } }
  })
  assert.ok(visible.commanded, 'real right-click orders all selected followers into the hut')
  assert.equal(visible.inside, null)
  assert.ok(visible.visible && visible.layers > 0 && visible.pixels > 0)
  assert.equal(visible.object, visible.expected)
  await page.screenshot({ path: '/private/tmp/populous-housing-entry.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => window.housing.people.every(u => u.inside === window.housing.b.id))
  const admitted = await page.evaluate(async () => {
    const s = window.testScene, h = window.housing
    s.world.speed = 0
    const { buildingInsidePoint } = await import('/app/building-shapes.ts'), inside = buildingInsidePoint(h.m.buildingPose(h.b))
    return { people: h.people.map(u => {
      const p = h.m.nativePosition(s.world, u)
      return { hidden: !s.unitMeshes.get(u.id).visible, sourceCleared: !u.entry && !u.native,
        dx: ((p.x - inside.x) << 16) >> 16, dy: ((p.y - inside.y) << 16) >> 16 }
    }), maxStep: Math.max(...h.positions.slice(1).flatMap((turn, i) => turn.map((p, j) => Math.hypot(p.x - h.positions[i][j].x, p.z - h.positions[i][j].z)))) }
  })
  for (const p of admitted.people) assert.ok(p.hidden && p.sourceCleared && Math.abs(p.dx) < 112 && Math.abs(p.dy) < 112)
  assert.ok(admitted.maxStep < 1.5, 'admission must never teleport the follower')
  assert.deepEqual(errors, [])
  writeFileSync('/private/tmp/populous-housing-entry-browser.json', JSON.stringify({ headed, visible, admitted }, null, 2) + '\n')
  console.log('PASS: real housing input, original visible entry sprites, native interior admission, no teleport or browser errors', { visible, admitted })
} finally { await browser.close() }
