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
  await page.getByRole('button', { name: 'Mission 19', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByText(/protect their settlement/).waitFor()
  await page.waitForFunction(() => {
    const scene = globalThis.testScene
    return [scene.skyBackdrop, ...scene.skyClouds].every(
      layer => layer.material.uniforms.map.value.image?.complete
    )
  })

  const sky = await page.evaluate(() => {
    const scene = globalThis.testScene,
      layers = [scene.skyBackdrop, ...scene.skyClouds],
      renderer = scene.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    scene.world.speed = 0
    scene.updateSky()
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    layers.forEach(layer => (layer.visible = false))
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    scene.updateSky()
    let changed = 0
    for (let index = 0; index < length; index += 4)
      if (before[index] !== after[index] || before[index + 1] !== after[index + 1] || before[index + 2] !== after[index + 2])
        changed++
    return {
      visible: layers.map(layer => layer.visible),
      sources: layers.map(layer => {
        const image = layer.material.uniforms.map.value.image
        return [image.currentSrc || image.src, image.naturalWidth, image.naturalHeight]
      }),
      changed,
    }
  })
  assert.deepEqual(sky.visible, [true, true, true])
  assert.deepEqual(
    sky.sources.map(([source, width, height]) => [source.replace(/^.*\/original\//, ''), width, height]),
    [
      ['sky-d.png', 128, 128],
      ['clouds-d.png', 512, 512],
      ['clouds-high-d.png', 512, 512],
    ]
  )
  assert.ok(sky.changed > 0)

  const headPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, browserPosition, nativePosition } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts'),
      head = world.shrines.find(shrine => shrine.reward === 'teleport'),
      slots = worshipPositions({
        ...nativePosition(world, head),
        angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
      })
    slots.slice(0, head.required).forEach(slot => addUnit(world, 'blue', 'brave', browserPosition(slot)))
    for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
    syncLivePersonCells(world)
    world.selected = []
    world.speed = 0
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(head),
      rect = scene.container.getBoundingClientRect(),
      x = rect.left + ((point.x + 1) * rect.width) / 2,
      y = rect.top + ((1 - point.y) * rect.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
          return { ...event, head: head.id }
      }
    throw new Error('No exposed Teleport head geometry')
  })
  await page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Shift'] })
  await page.mouse.click(headPoint.clientX, headPoint.clientY)
  const worship = await page.evaluate(async headId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      head = world.shrines.find(shrine => shrine.id === headId)
    if (!world.selected.every(id => world.units.find(unit => unit.id === id)?.native?.commandStatus === 27))
      throw new Error('Head click did not enter live worship')
    world.speed = 1
    for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
    head.work = head.target * head.required ** 2 - 1
    for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
    for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    return { uses: head.uses, stock: world.shots.teleport, gifts: world.giftCounts.teleport }
  }, headPoint.head)
  assert.deepEqual(worship, { uses: 1, stock: 1, gifts: 1 })

  const teleportButton = page.getByRole('button', { name: 'Teleport, 1 shots', exact: true })
  await teleportButton.waitFor()
  const castPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { spellTargetError } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      target = { x: shaman.x + 3, z: shaman.z + 3 }
    scene.focus(shaman)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(target, Math.max(0, scene.y(target))),
      rect = scene.container.getBoundingClientRect(),
      center = {
        x: rect.left + ((point.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - point.y) * rect.height) / 2,
      }
    for (let radius = 0; radius <= 40; radius += 2)
      for (let step = 0; step < 16; step++) {
        const event = {
            clientX: center.x + Math.cos((step * Math.PI) / 8) * radius,
            clientY: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          picked = scene.pick(event)
        if (picked && !scene.pickUnit(event) && !scene.pickWorldObject(event) && !spellTargetError(world, 'teleport', picked))
          return { ...event, start: [shaman.x, shaman.z] }
      }
    throw new Error('No exposed Teleport cast target')
  })
  await teleportButton.click()
  await page.mouse.click(castPoint.clientX, castPoint.clientY)
  const cast = await page.evaluate(async start => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 160 && world.effects.some(effect => effect.teleport) === false; turn++)
      tick(world, 1 / 12)
    for (let turn = 0; turn < 32 && world.effects.some(effect => effect.teleport); turn++)
      tick(world, 1 / 12)
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    scene.focus(shaman)
    scene.onChange()
    return { stock: world.shots.teleport, moved: shaman.x !== start[0] || shaman.z !== start[1] }
  }, castPoint.start)
  assert.deepEqual(cast, { stock: 0, moved: true })

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    world.turn = 62
    world.units = world.units.filter(
      (unit, index, units) => unit.team !== 'yellow' || units.slice(0, index).filter(item => item.team === 'yellow').length < 14
    )
    world.buildings = world.buildings.filter(building => building.team !== 'yellow')
    for (let turn = 0; turn < 80 && !world.messages.slots.some(message => message?.stringId === 705); turn++)
      tick(world, 1 / 12)
    scene.onChange()
  })
  const warning = page.locator('details').filter({ hasText: /last chance to save them/ })
  await warning.locator('summary').click()
  await warning.getByText(/last chance to save them/).waitFor()

  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(18)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 19', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 19)
  await page.waitForFunction(() => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld())
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 19 continuation, bank-d sky, opening, Teleport worship/HUD cast, and warning')
} finally {
  await browser.close()
}
