import assert from 'node:assert/strict'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { openGame } from './browser-game.mjs'

const projectRoot = process.cwd(),
  requireFromProject = createRequire(resolve(projectRoot, 'package.json')),
  { chromium } = requireFromProject('@playwright/test'),
  output = process.env.PND_QUEUE_OUTPUT ?? '/private/tmp',
  port = 4315
mkdirSync(output, { recursive: true })
let server
async function startServer() {
  if (process.env.POPULOUS_URL) return
  const log = openSync(resolve(output, 'server.log'), 'a')
  server = spawn(
    resolve(projectRoot, 'node_modules/.bin/vinext'),
    ['dev', '--port', String(port)],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', log, log],
      env: { ...process.env, WRANGLER_LOG_PATH: resolve(output, 'wrangler.log') },
    }
  )
  process.env.POPULOUS_URL = `http://localhost:${port}`
  for (let i = 0; i < 160; i++) {
    if (server.exitCode !== null) throw new Error(`dev server exited with ${server.exitCode}`)
    try {
      const response = await fetch(process.env.POPULOUS_URL)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('dev server readiness timed out')
}
async function waitForServerExit(timeoutMs) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return true
  return await new Promise(resolve => {
    let timeout
    const onExit = () => finish(true)
    const finish = exited => {
      if (timeout) clearTimeout(timeout)
      server.off('exit', onExit)
      resolve(exited)
    }
    server.once('exit', onExit)
    if (server.exitCode !== null || server.signalCode !== null) return finish(true)
    timeout = setTimeout(
      () => finish(server.exitCode !== null || server.signalCode !== null),
      timeoutMs
    )
  })
}
async function stopServer() {
  if (!server) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {}
  if (await waitForServerExit(5000)) return
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {}
  if (!(await waitForServerExit(5000))) throw new Error('dev server did not exit after SIGKILL')
}
function cleanupReceipt() {
  if (!process.env.PND_QUEUE_CLEANUP) return
  const receipt = {
      jobId: process.env.PND_QUEUE_JOB_ID,
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: server ? [{ pid: server.pid, group: true }] : [],
    },
    temporary = `${process.env.PND_QUEUE_CLEANUP}.tmp`
  writeFileSync(temporary, JSON.stringify(receipt, null, 2) + '\n')
  renameSync(temporary, process.env.PND_QUEUE_CLEANUP)
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const { page, errors } = await openGame(browser, 9)
  page.setDefaultTimeout(30_000)
  await page.waitForFunction(async () => {
    const { texture } = await import('/app/scene-assets.ts')
    const image = texture('hud').image
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })

  // Controlled setup boundary: move the authored Shaman to the authored Vault entrance,
  // then use real rendered input for the unlock. No buildings or people are injected.
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'boatHouse')
    if (!shaman || !vault) throw new Error('Mission 9 authored Shaman/Vault path is unavailable')
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.speed = 0
    scene.focus(vault)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(
        shrine => shrine.kind === 'vault' && shrine.reward === 'boatHouse'
      ),
      point = scene.screen(vault),
      bounds = scene.renderer.domElement.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 10; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === vault.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 9 Boat House Vault geometry')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.unlockedBoatHouse && turn < 2_000; turn++) tick(world, 1 / 12)
    if (!world.unlockedBoatHouse)
      throw new Error('Rendered Vault input did not unlock the Boat House')
    world.speed = 0
    scene.onChange()
  })

  // Shipped HUD selection and placement; simulation is accelerated only after placement.
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const buildButton = page.getByRole('button', { name: 'Boat House, 5 wood', exact: true })
  await buildButton.waitFor()
  assert.equal(await buildButton.isEnabled(), true)
  const site = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, placementError } = await import('/app/model.ts'),
      { missionPosition } = await import('/app/mission-data.ts'),
      start = missionPosition(9, 'blue'),
      bounds = scene.renderer.domElement.getBoundingClientRect(),
      candidates = []
    for (let z = start.z - 28; z <= start.z + 28; z += 0.5)
      for (let x = start.x - 28; x <= start.x + 28; x += 0.5)
        if (!placementError(world, 'boatHouse', { x, z })) {
          const pose = buildingPlanPose(world, 'boatHouse', { x, z }),
            point = browserPosition({ x: pose.anchorX, y: pose.anchorY })
          if (!candidates.some(candidate => candidate.x === point.x && candidate.z === point.z))
            candidates.push(point)
        }
    for (const candidate of candidates) {
      scene.focus(candidate)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(candidate),
        event = {
          clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        picked = scene.pick(event)
      if (picked && !placementError(world, 'boatHouse', picked))
        return { x: event.clientX, y: event.clientY }
    }
    throw new Error('No exposed valid Mission 9 Boat House site')
  })
  await buildButton.click()
  await page.mouse.move(site.x, site.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  await page.mouse.click(site.x, site.y)
  const houseId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      house = world.buildings.find(
        building => building.team === 'blue' && building.kind === 'boatHouse'
      )
    if (!house || house.progress !== 0)
      throw new Error('Real input did not place the Boat House plan')
    for (let turn = 0; house.progress < 1 && turn < 24_000; turn++) tick(world, 1 / 12)
    if (house.progress < 1) throw new Error(`Boat House construction timed out: ${house.progress}`)
    for (let turn = 0; world.units.some(unit => unit.work === house.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    return house.id
  })

  const panel = page.locator('.training-panel[aria-label^="Boat House:"]:not([hidden])')
  const findHousePoint = async () =>
    page.evaluate(id => {
      const scene = globalThis.testScene,
        house = scene.world.buildings.find(building => building.id === id)
      scene.focus(house)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(house),
        bounds = scene.renderer.domElement.getBoundingClientRect(),
        x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y = bounds.top + ((1 - projected.y) * bounds.height) / 2
      for (let dy = -100; dy <= 30; dy += 3)
        for (let dx = -55; dx <= 55; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy }
          if (
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
            scene.picking.pick(event) === id
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw new Error(`No rendered ScenePicking hit point for Boat House ${id}`)
    }, houseId)
  const hoverHouse = async () => {
    const point = await findHousePoint()
    await page.mouse.move(1400, 50)
    await page.waitForFunction(() => globalThis.testScene.hoveredObject === null)
    await page.mouse.move(point.x, point.y)
    await page.waitForFunction(
      ({ id, point }) => {
        const scene = globalThis.testScene
        return (
          scene.hoveredObject === id &&
          scene.picking.pick({ clientX: point.x, clientY: point.y }) === id
        )
      },
      { id: houseId, point }
    )
    await panel.waitFor({ state: 'visible' })
    return point
  }

  // Empty completed workshop: real pointer opening plus existing dismantle/cancel control.
  await hoverHouse()
  assert.equal(
    await panel.getAttribute('aria-label'),
    'Boat House: 0 of 4 workers; 0 of 6 Boat work'
  )
  assert.deepEqual(
    await panel.locator('canvas').evaluate(canvas => [canvas.width, canvas.height]),
    [136, 82]
  )
  const dismantle = panel.locator('.dismantle-control')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'true')
  assert.ok(
    await page.evaluate(
      id => globalThis.testScene.world.buildings.find(b => b.id === id).admission.activity & 0x8000,
      houseId
    )
  )
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'false')
  await page.mouse.move(1400, 50)

  // Ordinary entry: select existing Mission 9 Braves through the HUD and click the rendered house.
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  const commanded = await page.evaluate(() => {
    const world = globalThis.testScene.world
    return world.selected.filter(id => {
      const unit = world.units.find(candidate => candidate.id === id)
      return unit?.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
    })
  })
  assert.ok(commanded.length > 0, 'HUD must select an authored living Brave for Boat House work')
  const commandPoint = await findHousePoint()
  await page.mouse.click(commandPoint.x, commandPoint.y)
  await page.evaluate(() => {
    globalThis.testScene.world.speed = 8
  })
  await page.waitForFunction(
    houseId => {
      const world = globalThis.testScene.world,
        house = world.buildings.find(building => building.id === houseId),
        inside = world.units.filter(
          unit =>
            unit.inside === houseId && unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0
        )
      return house?.admission?.inside === 4 && inside.length === 4
    },
    houseId,
    { timeout: 30_000 }
  )
  const residentIds = await page.evaluate(id => {
    const scene = globalThis.testScene,
      world = scene.world,
      house = world.buildings.find(building => building.id === id)
    world.speed = 0
    scene.onChange()
    return world.units.filter(unit => unit.inside === house.id && unit.hp > 0).map(unit => unit.id)
  }, houseId)
  assert.equal(residentIds.length, 4, JSON.stringify(residentIds))
  assert.ok(
    residentIds.some(id => commanded.includes(id)),
    'at least one HUD-commanded Brave must enter normally'
  )

  await hoverHouse()
  const workers = panel.locator('button:not(.dismantle-control):not([hidden])')
  assert.equal(await workers.count(), residentIds.length)
  assert.deepEqual(
    (
      await workers.evaluateAll(buttons => buttons.map(button => Number(button.dataset.person)))
    ).toSorted((a, b) => a - b),
    residentIds.toSorted((a, b) => a - b)
  )
  const resident = residentIds[0]
  await page.evaluate(() => {
    globalThis.testScene.world.selected = []
  })
  const residentIndex = await workers.evaluateAll(
    (buttons, id) => buttons.findIndex(button => Number(button.dataset.person) === id),
    resident
  )
  await workers.nth(residentIndex).click()
  assert.deepEqual(await page.evaluate(() => globalThis.testScene.world.selected), [resident])
  await workers.nth(residentIndex).click({ button: 'right' })
  assert.equal(
    await page.evaluate(id => globalThis.testScene.objectPanels.panels.has(id), resident),
    true
  )
  await page.waitForFunction(() => !globalThis.testScene.cameraMotion.active)

  // Live production owns the timer; observe a real partial block before the native 600-work launch.
  await page.evaluate(() => {
    globalThis.testScene.world.speed = 4
  })
  await page.waitForFunction(
    id => {
      const house = globalThis.testScene.world.buildings.find(building => building.id === id)
      return house && house.timer >= 100 && house.timer < 600 && !house.boatLaunched
    },
    houseId,
    { timeout: 30_000 }
  )
  const partial = await page.evaluate(id => {
    const scene = globalThis.testScene,
      house = scene.world.buildings.find(building => building.id === id)
    scene.world.speed = 0
    scene.onChange()
    return { timer: house.timer, blocks: Math.trunc(house.timer / 100) }
  }, houseId)
  assert.ok(partial.blocks >= 1 && partial.blocks <= 5, JSON.stringify(partial))
  await hoverHouse()
  assert.match(
    await panel.getAttribute('aria-label'),
    new RegExp(`Boat House: ${residentIds.length} of 4 workers; ${partial.blocks} of 6 Boat work`)
  )

  await page.evaluate(() => {
    globalThis.testScene.world.speed = 8
  })
  await page.waitForFunction(
    id => {
      const world = globalThis.testScene.world,
        house = world.buildings.find(building => building.id === id)
      return (
        !!house?.boatLaunched &&
        world.vehicles.some(vehicle => vehicle.active && vehicle.model === 1)
      )
    },
    houseId,
    { timeout: 30_000 }
  )
  const launched = await page.evaluate(
    ({ houseId, residents }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        house = world.buildings.find(building => building.id === houseId),
        boat = world.vehicles.find(vehicle => vehicle.active && vehicle.model === 1)
      world.speed = 0
      scene.onChange()
      const driver = boat.passengers[0],
        remaining = residents.filter(id => id !== driver),
        admissionSlots = [...house.admission.occupants]
      return {
        timer: house.timer,
        launched: house.boatLaunched,
        driver,
        passengers: [...boat.passengers],
        driverInside: world.units.find(unit => unit.id === driver)?.inside ?? null,
        remaining,
        remainingInside: remaining.filter(
          id => world.units.find(unit => unit.id === id)?.inside === houseId
        ),
        admissionInside: house.admission.inside,
        admissionSlots,
        liveInside: world.units
          .filter(unit => unit.inside === houseId && unit.hp > 0)
          .map(unit => unit.id),
      }
    },
    { houseId, residents: residentIds }
  )
  assert.equal(launched.timer, 0)
  assert.equal(launched.launched, true)
  assert.ok(residentIds.includes(launched.driver), JSON.stringify(launched))
  assert.deepEqual(launched.passengers, [launched.driver])
  assert.equal(launched.driverInside, null)
  assert.equal(launched.admissionInside, launched.remaining.length)
  assert.equal(launched.admissionSlots.includes(launched.driver), false)
  assert.deepEqual(
    launched.admissionSlots.filter(Boolean).toSorted((a, b) => a - b),
    launched.remaining.toSorted((a, b) => a - b)
  )
  assert.deepEqual(
    launched.remainingInside.toSorted((a, b) => a - b),
    launched.remaining.toSorted((a, b) => a - b)
  )
  assert.deepEqual(
    launched.liveInside.toSorted((a, b) => a - b),
    launched.remaining.toSorted((a, b) => a - b)
  )

  // Native playerType 2 retains non-driver occupants; the driver slot alone must disappear.
  await hoverHouse()
  assert.equal(
    await panel.getAttribute('aria-label'),
    `Boat House: ${launched.remaining.length} of 4 workers; 0 of 6 Boat work`
  )
  const retainedWorkers = panel.locator('button:not(.dismantle-control):not([hidden])')
  assert.equal(await retainedWorkers.count(), launched.remaining.length)
  const retainedIds = await retainedWorkers.evaluateAll(buttons =>
    buttons.map(button => Number(button.dataset.person))
  )
  assert.equal(retainedIds.includes(launched.driver), false)
  assert.deepEqual(
    retainedIds.toSorted((a, b) => a - b),
    launched.remaining.toSorted((a, b) => a - b)
  )
  await page.evaluate(() => {
    globalThis.testScene.world.selected = []
  })
  await retainedWorkers.first().click()
  assert.deepEqual(await page.evaluate(() => globalThis.testScene.world.selected), [retainedIds[0]])
  assert.deepEqual(errors, [])

  const evidence = {
    authoredMission9: {
      houseId,
      unlockedViaRenderedVault: true,
      placedViaHud: true,
      completedBySimulation: true,
      ordinaryBraveEntry: true,
      scenePickingOpen: true,
      panel: [136, 82],
      occupantSelection: true,
      occupantFocus: true,
      dismantleToggle: true,
      partialWork: partial,
      launched: true,
      driverSlotCleared: true,
      retainedHumanOccupants: launched.remaining.length,
      retainedOccupantsSelectable: true,
    },
    controlledBoundaries: {
      authoredShamanMovedToVaultEntrance: true,
      unlockAndConstructionSimulationAccelerated: true,
      noBuildingOrResidentInjection: true,
      noHoveredObjectAssignment: true,
      multiBraveHudSelection: true,
    },
  }
  writeFileSync(
    resolve(output, 'boat-house-menu-browser.json'),
    JSON.stringify(evidence, null, 2) + '\n'
  )
  await page.screenshot({ path: resolve(output, 'boat-house-menu.png') })
  console.log(
    'PASS: Mission 9 Boat House uses real unlock/place/entry and genuine pointer ScenePicking menu opening; occupant selection/focus, dismantle/cancel, live work blocks, driver boarding/removal and native type-2 retained occupants pass',
    evidence
  )
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
