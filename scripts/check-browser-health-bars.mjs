// Native atlas pixels, live input/gates, viewport scaling and shared texture lifetime.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, m = await import('/app/model.ts')
    s.world.speed = 0; s.world.units = []; s.world.buildings = []; s.world.selected = []
    const blue = m.addUnit(s.world, 'blue', 'brave', { x: 0, z: 30 })
    const red = m.addUnit(s.world, 'red', 'brave', { x: 2, z: 30 })
    const healthy = m.addUnit(s.world, 'blue', 'shaman', { x: -2, z: 30 })
    blue.hp = red.hp = 25
    s.world.selected = [blue.id, healthy.id]
    s.focus({ x: 0, z: 30 })
    window.healthPeople = { blue: blue.id, red: red.id, healthy: healthy.id }
  })
  await page.waitForFunction(() => window.testScene.unitMeshes.size === 3)
  const visible = () => page.evaluate(() => [...window.testScene.unitMeshes.values()].filter(g => g.userData.health.visible).map(g => g.userData.unit))
  const tick = () => page.evaluate(() => { const s = window.testScene; s.animate(s.previous); cancelAnimationFrame(s.frame) })
  await tick(); assert.deepEqual(await visible(), [])
  await page.keyboard.down('Quote'); await tick()
  const ids = await page.evaluate(() => window.healthPeople)
  assert.deepEqual(await visible(), [ids.blue])
  await page.keyboard.down('Shift'); await page.keyboard.up('Quote'); await tick()
  assert.deepEqual(await visible(), [], 'release works after modifiers change')
  await page.keyboard.down('Quote'); await tick()
  assert.deepEqual(await visible(), [], 'modified press does not activate the gauge')
  await page.keyboard.up('Quote'); await page.keyboard.up('Shift')
  await page.keyboard.down('Quote'); await tick()
  assert.deepEqual(await visible(), [ids.blue])
  const sizes = []
  for (const [width, height, dpr] of [[1440,1000,1],[1920,1080,1],[3440,1440,1],[3840,2160,1],[1440,1000,2]]) {
    await page.setViewportSize({ width, height })
    sizes.push(await page.evaluate(dpr => {
      const s = window.testScene
      s.renderer.setPixelRatio(dpr); s.setSize(); s.animate(s.previous); cancelAnimationFrame(s.frame)
      const g = s.unitMeshes.get(window.healthPeople.blue), h = g.userData.health
      return { scale: [h.scale.x,h.scale.y], anchor: [(1-h.center.y)*h.scale.y, g.userData.frameHeight], visible:h.visible }
    }, dpr))
  }
  for (const p of sizes) {
    assert.deepEqual(p.scale, [6,26]); assert.ok(p.visible)
    assert.ok(Math.abs(p.anchor[0] - 26 - Math.trunc(p.anchor[1]*24/32)) < 1e-8)
  }
  await page.setViewportSize({ width:1440, height:1000 })
  await page.evaluate(() => { const s = window.testScene; s.renderer.setPixelRatio(1); s.setSize(); s.animate(s.previous); cancelAnimationFrame(s.frame) })
  await page.screenshot({ path:'/private/tmp/populous-unit-health.png' })
  await page.evaluate(() => { window.testScene.world.inputMask = 64 })
  await tick(); assert.deepEqual(await visible(), [], 'scripted input suppression hides gauges')
  await page.evaluate(() => { window.testScene.world.inputMask = 0; window.dispatchEvent(new Event('blur')) })
  await tick(); assert.deepEqual(await visible(), [], 'focus loss clears held display')
  await page.keyboard.up('Quote')
  const pixels = await page.evaluate(async () => {
    const s = window.testScene, gl = s.renderer.getContext(), Scene = s.scene.constructor, Group = s.unitMeshes.values().next().value.constructor
    const source = s.unitMeshes.get(window.healthPeople.blue).userData.health
    await source.material.map.image.decode()
    const image = source.material.map.image, canvas = document.createElement('canvas')
    canvas.width = image.width; canvas.height = image.height
    const context = canvas.getContext('2d'); context.drawImage(image,0,0)
    const expected = context.getImageData(0,0,image.width,image.height).data
    const scene = new Scene(), group = new Group(), gauge = source.clone()
    gauge.material = source.material.clone(); gauge.userData.atlasTransform = source.userData.atlasTransform.clone()
    gauge.center.set(.5,0); gauge.scale.set(6,26,1); gauge.visible = true
    group.add(gauge); scene.add(group)
    s.renderer.setPixelRatio(1); s.renderer.setSize(128,128,false); s.renderer.setClearColor(0x204060,1)
    s.view.update(128,128,{x:0,z:0},0,0,false,640)
    s.view.projection.centerX = 64; s.view.projection.centerY = 80
    s.view.uniforms.nativeScreen.value.set([128,128,64,80])
    s.view.prepare(scene)
    const actual = new Uint8Array(128*128*4)
    let differences = 0, maximumError = 0
    for (let fill = 0; fill < 25; fill++) {
      gauge.userData.atlasTransform.set(1/25,1,fill/25,0)
      s.renderer.render(scene,s.camera); gl.readPixels(0,0,128,128,gl.RGBA,gl.UNSIGNED_BYTE,actual)
      for (let y=0; y<26; y++) for (let x=0; x<6; x++) {
        const at = (y*150+fill*6+x)*4, to = ((127-(54+y))*128+61+x)*4, alpha = expected[at+3]/255
        for (let channel=0;channel<3;channel++) {
          const value = Math.round(expected[at+channel]*alpha + [32,64,96][channel]*(1-alpha))
          const error = Math.abs(actual[to+channel]-value)
          maximumError = Math.max(maximumError,error)
          if (error > 1) differences++
        }
      }
    }
    gauge.material.dispose()
    // Removing one person must never dispose the shared gauge atlas.
    let disposed = false
    source.material.map.addEventListener('dispose', () => { disposed = true })
    s.releaseGroup(s.unitMeshes.get(window.healthPeople.blue))
    return { differences, maximumError, checked:25*6*26, disposed }
  })
  assert.equal(pixels.differences,0,JSON.stringify(pixels)); assert.equal(pixels.disposed,false)
  assert.deepEqual(errors, [])
  console.log('PASS: 3900 native gauge pixels (including background alpha), held-key/modifier/owner/health gates, five desktop/DPR layouts and shared atlas lifetime', pixels)
} finally { await browser.close() }
