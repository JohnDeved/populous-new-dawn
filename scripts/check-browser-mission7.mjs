import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(10_000)
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(6)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 7', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 7)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByRole('button', { name: 'Convert Wild, 0 shots' }).waitFor()
  await page.getByLabel('Focus Chumara tribe').waitFor()

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.shots.convertWild && turn < 5_000; turn++) tick(world, 1 / 12)
    if (!world.shots.convertWild) throw new Error('Mission 7 Convert Wild did not charge')
    world.speed = 0
    scene.focus({ x: -63, z: 19 })
    scene.onChange()
  })
  await page
    .getByText('The Chumara will use the spell of Invisibility to attack us.', { exact: false })
    .waitFor()
  await page.getByRole('button', { name: 'Skip introduction', exact: false }).click()
  await page.waitForFunction(() => !globalThis.testStore.getWorld().inputMask)
  await page.getByRole('button', { name: 'Convert Wild, 1 shots' }).click()
  const convertPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      point = scene.screen({ x: -63, z: 19 }),
      bounds = scene.container.getBoundingClientRect()
    return {
      x: bounds.left + ((point.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - point.y) * bounds.height) / 2,
    }
  })
  await page.mouse.click(convertPoint.x, convertPoint.y)

  const convertedId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (world.projectiles.at(-1)?.spell !== 'convertWild')
      throw new Error('Mission 7 HUD did not cast Convert Wild')
    cancelAnimationFrame(scene.frame)
    world.paused = true
    world.speed = 1
    scene.gameClock.animationTime = 0
    const step = () => {
      world.paused = false
      advanceGame(world, scene.gameClock, 1 / 12)
      world.paused = true
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
    }
    for (
      let turn = 0;
      !world.units.some(unit => unit.team === 'blue' && unit.kind === 'brave') && turn < 100;
      turn++
    )
      step()
    const converted = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
    if (!converted) throw new Error('Mission 7 Wildman conversion timed out')
    return converted.id
  })

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    // The remote terrain route is separate work; use real input with the authentic Shaman at the door.
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.paused = false
    world.speed = 0
    scene.focus(vault)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      point = scene.screen(vault),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
          scene.pickWorldObject(event)?.id === vault.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 7 Vault geometry for real input')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  await page.evaluate(async convertedId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    if (!shaman.vault)
      throw new Error(
        `Mission 7 Vault input did not create the Shaman task: ${JSON.stringify({ selected: world.selected, mode: world.mode, inputMask: world.inputMask, shaman: shaman.id, vault: vault.id })}`
      )
    world.paused = false
    world.speed = 1
    for (let turn = 0; !world.shots.invisibility && turn < 2_000; turn++) tick(world, 1 / 12)
    world.paused = true
    if (!world.shots.invisibility || vault.uses !== 1)
      throw new Error('Mission 7 Vault did not deliver Invisibility')
    const converted = world.units.find(unit => unit.id === convertedId)
    Object.assign(converted, { x: shaman.x + 1, z: shaman.z })
    syncLivePersonCells(world)
    world.paused = false
    world.speed = 0
    scene.focus(converted)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
  }, convertedId)

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByText('Objectives · 2 / 3', { exact: true }).click()
  const objectives = await page.locator('.menu-objectives').textContent()
  assert.match(objectives, /Convert the Wildmen/)
  assert.match(objectives, /Claim Invisibility from the stone head/)
  await page.getByRole('button', { name: 'Return to the world', exact: false }).click()
  await page.getByRole('button', { name: 'Invisibility, 1 shots' }).click()
  const followerPoint = await page.evaluate(convertedId => {
    const scene = globalThis.testScene,
      follower = scene.world.units.find(unit => unit.id === convertedId),
      point = scene.screen(follower),
      bounds = scene.container.getBoundingClientRect()
    return {
      x: bounds.left + ((point.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - point.y) * bounds.height) / 2,
    }
  }, convertedId)
  await page.mouse.click(followerPoint.x, followerPoint.y)

  const concealed = await page.evaluate(async convertedId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      converted = world.units.find(unit => unit.id === convertedId)
    if (world.projectiles.at(-1)?.spell !== 'invisibility')
      throw new Error('Mission 7 HUD did not cast Invisibility')
    world.paused = true
    world.speed = 1
    scene.gameClock.animationTime = 0
    for (let turn = 0; !converted.invisibility && turn < 100; turn++) {
      world.paused = false
      advanceGame(world, scene.gameClock, 1 / 12)
      world.paused = true
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
    }
    if (!converted.invisibility) throw new Error('Mission 7 Invisibility timed out')
    scene.onChange()
    return {
      team: converted.team,
      invisibility: converted.invisibility,
      inStore: globalThis.testStore.getWorld().units.some(unit => unit.id === convertedId),
      storeInvisibility: globalThis.testStore.getWorld().units.find(unit => unit.id === convertedId)
        ?.invisibility,
      sameWorld: globalThis.testStore.getWorld() === world,
      storeLevel: globalThis.testStore.getWorld().outcome.level,
    }
  }, convertedId)
  assert.equal(concealed.team, 'blue')
  assert.ok(concealed.invisibility)
  assert.equal(concealed.inStore, true)
  assert.ok(concealed.storeInvisibility)
  assert.equal(concealed.sameWorld, true)
  assert.equal(concealed.storeLevel, 7)

  const restored = await page.evaluate(async convertedId => {
    const store = globalThis.testStore
    await store.saveCheckpoint()
    store.startMission(1)
    if (!store.loadCheckpoint()) throw new Error('Mission 7 checkpoint load failed')
    const world = store.getWorld(),
      converted = world.units.find(unit => unit.id === convertedId),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    return {
      invisible: !!converted?.invisibility,
      vaultUses: vault?.uses,
      vaultActive: vault?.active,
      shots: world.shots.invisibility,
    }
  }, convertedId)
  assert.deepEqual(restored, { invisible: true, vaultUses: 1, vaultActive: false, shots: 0 })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 6 continues to Mission 7; HUD input converts, worships, conceals and restores'
  )
} finally {
  await browser.close()
}
