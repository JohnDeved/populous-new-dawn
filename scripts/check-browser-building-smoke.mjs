// Start npm run dev, then node scripts/check-browser-building-smoke.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import rules from '../app/original-rules.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForSelector('.world-viewport canvas')
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.current?.unitMeshes) window.testScene = hook.memoizedState.current
      }
    }
    return !!window.testScene
  })
  await page.waitForFunction(() => window.testScene.world.flyby.flags & 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    scene.focus({ x: 9, z: 33 })
  })

  await page.evaluate(rules => {
    const scene = window.testScene
    const world = scene.world
    world.manaWorld.gameFlags = 32
    const building = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    const model = building.level
    building.collapse = {
      model, state: 2, flags2: 0, flags3: 0, buildingFlags: 64, counter: 0,
      damage: rules.buildingDamageThreshold[model], stage: 4, attacker: 255, occupants: 0,
      plan: { remaining: rules.buildingLife[model], repairDelay: 0, attacker: 255 },
    }
    scene.focus(building)
    world.speed = 1
  }, rules)
  await page.waitForFunction(() => window.testScene.world.effects.some(fx => fx.smoke))
  const id = await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    const fx = scene.world.effects.find(fx => fx.smoke)
    window.smokeTestId = fx.id
    return fx.id
  })
  const first = await page.evaluate(() => {
    const scene = window.testScene
    const fx = scene.world.effects.find(fx => fx.id === window.smokeTestId)
    return { kind: fx.kind, object: fx.smoke.object, lifetime: fx.smoke.lifetime, scale: fx.smoke.scaleX }
  })
  assert.equal(first.kind, 'buildingSmoke')
  assert.equal(first.object, 1345)
  assert.ok(first.lifetime >= rules.buildingSmokeDuration - 2)
  assert.ok(first.scale < 256)
  await page.evaluate(() => { window.testScene.world.speed = 4 })
  await page.waitForFunction(() => window.testScene.world.effects.find(fx => fx.id === window.smokeTestId)?.smoke.scaleX === 256)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  const displayed = await page.evaluate(() => {
    const scene = window.testScene
    const fx = scene.world.effects.find(fx => fx.id === window.smokeTestId)
    const group = scene.fxMeshes.get(fx.id)
    const sprite = group.userData.sprite
    const renderer = scene.renderer, gl = renderer.getContext()
    const length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4
    const before = new Uint8Array(length), after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    group.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4) {
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    }
    return {
      pixels, sequence: group.userData.sequence, opacity: sprite.material.opacity,
      height: group.position.y, nativeHeight: fx.smoke.h, frame: fx.animation.f1,
      width: sprite.scale.x, spriteHeight: sprite.scale.y,
    }
  })
  assert.equal(displayed.sequence, 'buildingSmoke')
  assert.equal(displayed.opacity, 1)
  assert.equal(displayed.height, displayed.nativeHeight / 128)
  assert.ok(displayed.width > 0 && displayed.spriteHeight > displayed.width)
  assert.ok(displayed.pixels > 20, JSON.stringify(displayed))
  await page.waitForFunction(frame => window.testScene.world.effects.find(fx => fx.id === window.smokeTestId).animation.f1 !== frame, displayed.frame)
  await page.screenshot({ path: '/private/tmp/populous-building-smoke.png' })
  await page.locator('.world-viewport canvas').focus()
  const bearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.keyboard.down('q')
  await page.waitForTimeout(250)
  await page.keyboard.up('q')
  assert.notEqual(await page.evaluate(() => window.testScene.cameraBearing), bearing)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.effects.find(fx => fx.id === window.smokeTestId).smoke.lifetime = 10
    scene.world.speed = 1
  })
  await page.waitForFunction(() => window.testScene.world.effects.find(fx => fx.id === window.smokeTestId)?.smoke.scaleX < 256)
  await page.screenshot({ path: '/private/tmp/populous-building-smoke-shrinking.png' })
  await page.waitForFunction(id => !window.testScene.world.effects.some(fx => fx.id === id) && !window.testScene.fxMeshes.has(id), id)
  assert.deepEqual(errors, [])
  console.log(`PASS: real building collapse creates growing, looping HFX1345 smoke (${displayed.pixels} GPU pixels), native ground height, camera rotation, shrinking and removal; no browser errors`)
} finally {
  await browser.close()
}
