// npm run dev, then node scripts/check-browser-unit-shadows.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { spriteShadow, spriteBucket, spriteCoordinate } from '../app/projection.ts'
import effects from '../app/original-effects.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene, w = s.world
    w.speed = 0
    window.shadowTarget = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    shaman.x = window.shadowTarget.x - 5
    shaman.z = window.shadowTarget.z
    w.selected = [shaman.id]
    w.shots.blast = 4
    s.focus(window.shadowTarget)
    s.onChange()
  })
  await page.waitForFunction(() => [...window.testScene.unitMeshes.values()].every(g => g.userData.shadow && !g.userData.shadow.visible))
  const initial = await page.evaluate(() => {
    const s = window.testScene
    return [...s.unitMeshes.values()].map(g => ({
      frame: g.userData.frame, size: g.userData.sprite.scale.toArray(), bucket: g.userData.spriteBucket,
      depth: s.view.project(g.position, g.position.y * 128 / 45).z,
      bias: g.userData.depthBias, shaman: g.userData.signature.endsWith('shaman'), view: s.view.config,
      ring: g.children.some(c => c.isMesh && c.geometry.type === 'RingGeometry'),
    }))
  })
  for (const item of initial) {
    assert.equal(item.ring, false)
    assert.equal(item.bucket, spriteBucket(item.depth, item.bias) * (item.shaman ? -1 : 1))
    const flags = item.view.scaledSprites ? 0x100 : 0, frame = units.frames[item.frame]
    const width = item.shaman || flags ? spriteCoordinate(frame.w, item.bucket, flags, item.view) : frame.w
    assert.equal(item.size[0], Math.max(0, width))
  }
  assert.ok(new Set(initial.map(p => p.bucket)).size > 1, 'Units use their actual depth, not a fixed bucket')
  await page.keyboard.press('1')
  const target = await page.evaluate(() => {
    const s = window.testScene, p = s.screen(window.shadowTarget), r = s.container.getBoundingClientRect()
    s.world.speed = 0.25
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(() => {
    const s = window.testScene, u = window.shadowTarget, g = s.unitMeshes.get(u.id)
    if (!(u.lift > 0 && u.lift < 0.9 && g?.userData.shadow.visible)) return false
    s.world.speed = 0
    return true
  })
  const airborne = await page.evaluate(() => {
    const s = window.testScene, u = window.shadowTarget, g = s.unitMeshes.get(u.id), shadow = g.userData.shadow
    const h = (g.position.y + shadow.position.y) * 128
    const gl = s.renderer.getContext()
    const pixels = () => {
      s.renderer.render(s.scene, s.camera)
      const a = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, a)
      return a
    }
    const before = pixels()
    shadow.visible = false
    const after = pixels()
    shadow.visible = true
    let changed = 0
    for (let i = 0; i < before.length; i += 4)
      if (before[i] !== after[i] || before[i+1] !== after[i+1] || before[i+2] !== after[i+2]) changed++
    return { changed, h, bodyH: g.position.y * 128, size: shadow.scale.toArray(), center: shadow.center.toArray(),
      depth: s.view.project(u, h / 45).z, view: s.view.config, source: shadow.material.map.image.src,
      repeat: shadow.material.map.repeat.toArray(), offset: shadow.material.map.offset.toArray() }
  })
  assert.ok(airborne.changed > 5, `Shadow contributes only ${airborne.changed} GPU pixels`)
  assert.ok(airborne.bodyH > airborne.h, 'Shadow stays on ground below the flying unit')
  assert.match(airborne.source, /effects.png$/)
  const frame = effects.animations.unitShadow[0]
  assert.equal(frame.source, 22)
  assert.deepEqual(airborne.repeat, [frame.w / effects.width, frame.h / effects.height])
  const rect = spriteShadow(frame, airborne.depth, airborne.view.scaledSprites ? 0x100 : 0, airborne.view)
  assert.deepEqual(airborne.size.slice(0,2), [rect.width, rect.height])
  assert.deepEqual(airborne.center, [-rect.x / rect.width, 1 + rect.y / rect.height])
  await page.screenshot({ path: '/private/tmp/populous-native-unit-shadow.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => {
    const s = window.testScene, u = window.shadowTarget
    return u.lift === 0 && !s.unitMeshes.get(u.id)?.userData.shadow.visible
  })
  assert.deepEqual(errors, [])
  console.log(`PASS: native unit depth scaling; standing units have no rings; real Blast shows HFX22 ground shadow (${airborne.changed} GPU pixels) and clears it after landing; no browser errors`)
} finally {
  await browser.close()
}
