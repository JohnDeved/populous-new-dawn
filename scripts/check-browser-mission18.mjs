import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 18', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByText(/Dakini are the mightiest/).waitFor()
  await page
    .getByRole('status')
    .filter({ hasText: /seek Armageddon/ })
    .waitFor()
  await page.waitForFunction(
    () => globalThis.testScene.skyClouds[0].material.uniforms.map.value.image?.complete
  )

  const sky = await page.evaluate(() => {
    const scene = globalThis.testScene,
      layer = scene.skyClouds[0],
      renderer = scene.renderer,
      gl = renderer.getContext(),
      pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    scene.world.speed = 0
    scene.updateSky()
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    )
    layer.visible = false
    renderer.render(scene.scene, scene.camera)
    const without = new Uint8Array(pixels.length)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      without
    )
    layer.visible = true
    let changed = 0
    for (let index = 0; index < pixels.length; index += 4)
      if (
        pixels[index] !== without[index] ||
        pixels[index + 1] !== without[index + 1] ||
        pixels[index + 2] !== without[index + 2]
      )
        changed++
    const image = layer.material.uniforms.map.value.image
    return {
      backdrop: scene.skyBackdrop.visible,
      layers: scene.skyClouds.map(mesh => mesh.visible),
      transparent: layer.material.transparent,
      source: image.currentSrc || image.src,
      size: [image.naturalWidth, image.naturalHeight],
      changed,
    }
  })
  assert.equal(sky.backdrop, false)
  assert.deepEqual(sky.layers, [true, false])
  assert.equal(sky.transparent, false)
  assert.match(sky.source, /\/original\/sky-g\.png$/)
  assert.deepEqual(sky.size, [128, 128])
  assert.ok(sky.changed > 0)

  const rewards = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, browserPosition, command, nativePosition, tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts')
    for (const head of world.shrines.filter(shrine =>
      ['armageddon', 'volcano'].includes(shrine.reward)
    )) {
      const slots = worshipPositions({
          ...nativePosition(world, head),
          angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
        }),
        followers = Array.from({ length: head.required }, (_, index) =>
          addUnit(world, 'blue', 'brave', browserPosition(slots[index]))
        )
      world.selected = followers.map(unit => unit.id)
      syncLivePersonCells(world)
      if (!command(world, head)) throw new Error(`${head.reward} worship order was rejected`)
      for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
      head.work = head.target * head.required ** 2 - 1
      for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
      for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
    }
    scene.onChange()
    return {
      armageddon: [world.shots.armageddon, world.giftCounts.armageddon],
      volcano: [world.shots.volcano, world.giftCounts.volcano],
    }
  })
  assert.deepEqual(rewards, { armageddon: [1, 1], volcano: [1, 2] })
  await page.getByRole('button', { name: 'Armageddon, 1 shots', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Volcano, 1 shots', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 18 selector, bank-g lens, opening, authored rewards, and HUD stock')
} finally {
  await browser.close()
}
