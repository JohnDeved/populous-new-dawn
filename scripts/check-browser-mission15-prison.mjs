import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, effectPixels } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  async function mission() {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
      page = await context.newPage(),
      errors = []
    page.on('pageerror', error => errors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', {
      waitUntil: 'networkidle',
    })
    await page.getByRole('button', { name: 'Mission 15', exact: true }).click()
    await bindGame(page)
    await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
    return { context, page, errors }
  }

  const rescue = await mission(),
    page = rescue.page
  await page.getByText(/The Dakini have trapped me in this magical prison/).waitFor()
  const prisonPixels = await page.evaluate(() => {
    const scene = globalThis.testScene,
      prison = scene.world.buildings.find(building => building.kind === 'prison'),
      group = scene.buildingMeshes.get(prison.id),
      renderer = scene.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    scene.focus(prison)
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    group.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2])
        pixels++
    return pixels
  })
  assert.ok(prisonPixels > 20)

  await page.getByRole('button', { name: 'Select brave', exact: true }).click()
  const target = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      prison = world.buildings.find(building => building.kind === 'prison'),
      brave = world.units.find(unit => world.selected.includes(unit.id)),
      { browserPosition } = await import('/app/model.ts'),
      { buildingOutsidePoint, buildingPose } = await import('/app/building-shapes.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { releaseTasks } = await import('/app/world-tasks.ts')
    world.speed = 0
    world.randomState = 1
    releaseTasks(world, brave)
    Object.assign(brave, browserPosition(buildingOutsidePoint(buildingPose(prison))), {
      inside: null,
      native: null,
    })
    syncLivePersonCells(world)
    scene.focus(prison)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(prison),
      rect = scene.container.getBoundingClientRect(),
      x = rect.left + ((point.x + 1) * rect.width) / 2,
      y = rect.top + ((1 - point.y) * rect.height) / 2
    for (let dy = -80; dy <= 40; dy += 3)
      for (let dx = -45; dx <= 45; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === prison.id)
          return { x: event.clientX, y: event.clientY, brave: brave.id }
      }
    throw new Error('No exposed Prison geometry')
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(
    braveId =>
      globalThis.testScene.world.units.find(unit => unit.id === braveId)?.native?.commandStatus === 19,
    target.brave
  )
  const rescued = await page.evaluate(async braveId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      prison = world.buildings.find(building => building.kind === 'prison'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      brave = world.units.find(unit => unit.id === braveId)
    for (let turn = 0; turn < 120 && !prison.damageState?.damage; turn++) tick(world, 1 / 12)
    const firstDamage = prison.damageState?.damage,
      command = brave.native?.commandStatus
    prison.damageState.damage = 22001
    tick(world, 1 / 12)
    for (let turn = 0; turn < 32 && world.campaignTimer !== null; turn++) tick(world, 1 / 12)
    scene.onChange()
    return {
      command,
      firstDamage,
      prison: prison.hp,
      captive: shaman.inside,
      timer: world.campaignTimer,
      status: world.status,
    }
  }, target.brave)
  assert.deepEqual(rescued, {
    command: 19,
    firstDamage: 7,
    prison: 0,
    captive: null,
    timer: null,
    status: 'playing',
  })
  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  assert.deepEqual(
    await page.evaluate(() => {
      const store = globalThis.testStore
      if (!store.loadCheckpoint()) return null
      const world = store.getWorld()
      return {
        prison: world.buildings.some(building => building.kind === 'prison'),
        captive: world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman').inside,
        timer: world.campaignTimer,
      }
    }),
    { prison: false, captive: null, timer: null }
  )
  assert.deepEqual(rescue.errors, [])
  await rescue.context.close()

  const failure = await mission(),
    failed = await failure.page.evaluate(async () => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        prison = world.buildings.find(building => building.kind === 'prison'),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      world.campaignTimer = 1
      for (let turn = 0; turn < 100 && world.status === 'playing'; turn++) tick(world, 1 / 12)
      scene.focus(prison)
      scene.onChange()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      return {
        status: world.status,
        inputLocked: !!(world.inputMask & 128),
        casts: world.spellCasts[2][3],
        prison: prison.hp,
        shaman: { hp: shaman.hp, inside: shaman.inside },
        lightning: world.effects.filter(effect => effect.lightning).map(effect => effect.id),
      }
    })
  assert.deepEqual(
    { ...failed, lightning: failed.lightning.length },
    {
      status: 'lost',
      inputLocked: true,
      casts: 1,
      prison: 260,
      shaman: { hp: 0, inside: null },
      lightning: 1,
    }
  )
  assert.ok((await effectPixels(failure.page, failed.lightning)) > 20)
  assert.equal(await failure.page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  assert.equal(
    await failure.page.evaluate(() => {
      if (!globalThis.testStore.loadCheckpoint()) return null
      return globalThis.testStore.getWorld().status
    }),
    'lost'
  )
  assert.deepEqual(failure.errors, [])
  await failure.context.close()
  console.log('PASS: Mission 15 rendered Prison attack frees the Shaman; timer expiry delivers enemy Lightning loss; both restore')
} finally {
  await browser.close()
}
