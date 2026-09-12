import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addUnit } = await import('/app/model.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 0, path: [], casting: null })
    w.units = [shaman]
    addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
    addUnit(w, 'red', 'brave', { x: 3, z: 0 })
    w.shots.invisibility = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 2, z: 0 })
    s.onChange()
  })
  await page.locator('[aria-label="Invisibility, 1 shots"]').click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 2, z: 0 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      { setUnitInvisibility } = await import('/app/model.ts')
    if (w.projectiles[0]?.spell !== 'invisibility')
      throw Error('HUD click did not cast Invisibility')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    const owner = w.units.find(u => u.team === 'blue' && u.kind === 'brave'),
      enemy = w.units.find(u => u.team === 'red' && u.kind === 'brave')
    for (let i = 0; !owner.invisibility && i < 120; i++) step()
    setUnitInvisibility(w, enemy, 20)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const ownerMesh = s.unitMeshes.get(owner.id),
      enemyMesh = s.unitMeshes.get(enemy.id),
      opacity = ownerMesh.userData.layers.find(layer => layer.visible)?.material.opacity,
      renderer = s.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(s.scene, s.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    ownerMesh.visible = false
    renderer.render(s.scene, s.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
    ownerMesh.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    return {
      cast: !!owner.invisibility,
      cue: w.sounds.some(event => event.cue === 0x31),
      opacity,
      pixels,
      ownerVisible: ownerMesh.visible,
      enemyVisible: enemyMesh.visible,
      enemyPickable: enemyMesh.userData.pickable,
    }
  })
  assert.equal(result.cast, true)
  assert.equal(result.cue, true)
  assert.equal(result.ownerVisible, true)
  assert.equal(result.opacity, 0.45)
  assert.ok(result.pixels > 10)
  assert.equal(result.enemyVisible, false)
  assert.equal(result.enemyPickable, false)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: HUD Invisibility cast blends allies and conceals enemies from rendering and picking'
  )
} finally {
  await browser.close()
}
