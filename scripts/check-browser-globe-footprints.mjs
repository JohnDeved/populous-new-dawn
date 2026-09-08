// npm run dev, then node scripts/check-browser-globe-footprints.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, settleView } from './browser-game.mjs'
import { globeFootprint } from '../app/globe.ts'
import hud from '../app/original-hud.json' with { type: 'json' }
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
    s.overview()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    window.globeBuilding = s.world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  })
  await settleView(page)
  await page.waitForFunction(() => window.testScene.globe.icons.naturalWidth > 0)
  const capture = () => page.evaluate(() => {
    const s = window.testScene, g = s.globe, w = s.world, ctx = g.canvas.getContext('2d')
    const polygons = [], icons = [], original = {}, points = []
    for (const name of ['beginPath', 'moveTo', 'lineTo', 'fill', 'drawImage']) original[name] = ctx[name]
    ctx.beginPath = function () { points.length = 0; original.beginPath.call(this) }
    ctx.moveTo = function (x, y) { points.push({ x, y }); original.moveTo.call(this, x, y) }
    ctx.lineTo = function (x, y) { points.push({ x, y }); original.lineTo.call(this, x, y) }
    ctx.fill = function () {
      if (points.length === 4 && this.globalAlpha !== 1)
        polygons.push({ points: [...points], alpha: this.globalAlpha, color: this.fillStyle })
      original.fill.call(this)
    }
    ctx.drawImage = function (...args) { icons.push(args.slice(1)); original.drawImage.apply(this, args) }
    try { g.drawMarkers(g.view, w, s.terrainTextures) } finally { Object.assign(ctx, original) }
    const pixels = ctx.getImageData(0, 0, g.canvas.width, g.canvas.height).data
    let translucent = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 48) translucent++
    return { polygons, icons, translucent, visible: [...g.buildingIcons], view: g.view,
      cells: [...w.land.flags].flatMap((flags, cell) => flags & 0x680 ? [{cell, flags, id: w.land.buildingIds[cell] & 1023}] : []),
      buildings: w.buildings.map(b => ({ id: b.id, tribe: b.team === 'blue' ? 0 : 1 })),
      palette: [...s.terrainTextures.palette], player: w.manaWorld.playerTribe, turn: w.turn,
      fog: !!(w.manaWorld.levelFlags & 4) }
  })
  const initial = await capture(), expected = [], eligible = new Set()
  for (const c of initial.cells) {
    const f = globeFootprint(initial.view, c.cell, c.flags, initial.buildings.find(b => b.id === c.id),
      { player: initial.player, turn: initial.turn, fog: initial.fog, concealed: 0 })
    if (f?.buildingId !== null && f?.buildingId !== undefined) eligible.add(f.buildingId)
    if (f?.quad) {
      const index = hud.alphaColors[f.color >> 4]
      expected.push({ points: f.quad, alpha: 48 / 255,
        color: '#' + initial.palette.slice(index * 4, index * 4 + 3).map(v => v.toString(16).padStart(2, '0')).join('') })
    }
  }
  assert.ok(expected.length > 10, 'Opening buildings must have projected footprint cells')
  assert.deepEqual(initial.polygons.map(p => ({ ...p, alpha: Math.round(p.alpha * 255) })), expected.map(p => ({ ...p, alpha: 48 })))
  assert.deepEqual(initial.visible.sort(), [...eligible].sort())
  assert.ok(initial.translucent > 200, 'Native alpha 48 must reach actual canvas pixels')
  await page.screenshot({ path: '/private/tmp/populous-globe-footprints-v104.png' })
  // Real simulation refresh removes and re-registers the native rotated shape.
  const step = () => page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 1
    s.animate(s.previous + 100)
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
  })
  const footprint = state => state.cells.filter(c => c.id === state.buildings.find(b => b.tribe === 0).id && c.flags & 512).map(c => c.cell)
  const before = footprint(initial)
  await page.evaluate(() => { window.globeBuilding.angle += Math.PI / 2; window.globeBuilding.x += 4 })
  await step()
  const rotated = await capture()
  assert.notDeepEqual(footprint(rotated), before, 'Relocation must move the visible native footprint')
  await page.evaluate(() => { window.globeBuilding.hp = 0 })
  await step()
  const removed = await capture(), id = await page.evaluate(() => window.globeBuilding.id)
  assert.ok(!removed.visible.includes(id), 'Destroyed building must lose its world-view icon')
  assert.ok(!removed.cells.some(c => c.id === id && c.flags & 512), 'Destroyed footprint must clear')
  // Exercise live garrison-to-HFX selection through the actual canvas adapter.
  await page.evaluate(() => {
    const s = window.testScene, w = s.world, b = window.globeBuilding
    b.hp = 100; b.progress = 1; b.kind = 'tower'
    if (!w.buildings.includes(b)) w.buildings.push(b)
    window.globeOccupant = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
    w.units.forEach(u => { if (u.inside === b.id) u.inside = null })
    window.globeOccupant.inside = b.id
  })
  await step()
  const hasIcon = (state, id) => state.icons.some(a => a.slice(0, 4).every((v, i) => v === [hud.rects[id].x, hud.rects[id].y, hud.rects[id].w, hud.rects[id].h][i]))
  for (const [kind, icon] of [['brave', 0xa3], ['warrior', 0x74], ['shaman', 0x77]]) {
    await page.evaluate(kind => { window.globeOccupant.kind = kind; window.globeOccupant.inside = window.globeBuilding.id }, kind)
    assert.ok(hasIcon(await capture(), icon), `${kind} garrison must select HFX ${icon}`)
  }
  await page.evaluate(() => { window.globeOccupant.inside = null })
  assert.ok(hasIcon(await capture(), 0x78), 'Vacant tower must use the empty icon')
  await page.evaluate(() => {
    window.globeBuilding.kind = 'hut'
    window.testScene.world.buildings = [window.globeBuilding]
  })
  await step()
  await page.evaluate(() => {
    const w = window.testScene.world, b = window.globeBuilding
    w.manaWorld.levelFlags |= 4
    for (let i = 0; i < w.land.flags.length; i++) w.land.flags[i] |= 8
    const x = Math.round((b.x + 8) * 256) & 65535, y = Math.round((-b.z - 8) * 256) & 65535
    w.land.flags[(y >> 9) * 128 + (x >> 9)] &= ~8
  })
  const fogged = await capture()
  assert.ok(fogged.visible.includes(id), 'Other seen footprint cells still mark the building')
  assert.ok(!hasIcon(fogged, 0x86), 'An unseen building anchor suppresses its icon')
  assert.deepEqual(errors, [])
  console.log(`PASS: ${expected.length} native colored footprint quads, ${initial.translucent} alpha-48 canvas pixels, icon eligibility, live relocation/destruction and brave/warrior/shaman/empty tower symbols and anchor fog`)
} finally { await browser.close() }
