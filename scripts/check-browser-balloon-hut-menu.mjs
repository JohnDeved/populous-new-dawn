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
  port = 4318
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
    const onExit = () => finish(true),
      finish = exited => {
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

async function unitClickPoint(page, kind, excludedIds = []) {
  return page.evaluate(
    ({ kind, ids }) => {
      const scene = globalThis.testScene,
        follower = scene.world.units.find(
          unit =>
            unit.team === 'blue' &&
            unit.kind === kind &&
            !ids.includes(unit.id) &&
            !unit.inside &&
            !unit.native?.vehicle
        )
      if (!follower) throw new Error(`No ordinary ${kind} remains available`)
      scene.focus(follower)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(follower),
        bounds = scene.container.getBoundingClientRect(),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        }
      for (let radius = 0; radius <= 20; radius += 2)
        for (let step = 0; step < 16; step++) {
          const click = {
            x: center.x + Math.cos((step * Math.PI) / 8) * radius,
            y: center.y + Math.sin((step * Math.PI) / 8) * radius,
          }
          if (
            document.elementFromPoint(click.x, click.y) === scene.renderer.domElement &&
            scene.pickUnit({ clientX: click.x, clientY: click.y })?.id === follower.id
          )
            return { id: follower.id, click }
        }
      throw new Error(`No exposed ordinary ${kind} geometry`)
    },
    { kind, ids: Array.isArray(excludedIds) ? excludedIds : [excludedIds] }
  )
}

const braveClickPoint = (page, excludedIds) => unitClickPoint(page, 'brave', excludedIds)

async function shrineClickPoint(page, shrineId) {
  return page.evaluate(id => {
    const scene = globalThis.testScene,
      shrine = scene.world.shrines.find(candidate => candidate.id === id)
    scene.focus(shrine)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(shrine),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - projected.y) * bounds.height) / 2
    scene.picking.lastKey = ''
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === shrine.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 13 Balloon Vault geometry')
  }, shrineId)
}

async function terrainClickPoint(page, target, spell = null) {
  return page.evaluate(
    async ({ point, spell }) => {
      const scene = globalThis.testScene,
        { spellTargetError } = await import('/app/live-command.ts')
      scene.focus(point)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(point),
        bounds = scene.container.getBoundingClientRect(),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        }
      for (let radius = 0; radius <= 50; radius += 2)
        for (let step = 0; step < 16; step++) {
          const screen = {
              x: center.x + Math.cos((step * Math.PI) / 8) * radius,
              y: center.y + Math.sin((step * Math.PI) / 8) * radius,
            },
            picked = scene.pick({ clientX: screen.x, clientY: screen.y })
          if (
            picked &&
            !scene.pickUnit({ clientX: screen.x, clientY: screen.y }) &&
            !scene.pickWorldObject({ clientX: screen.x, clientY: screen.y }) &&
            Math.hypot(picked.x - point.x, picked.z - point.z) < 2 &&
            (!spell || !spellTargetError(scene.world, spell, picked))
          )
            return { ...screen, picked }
        }
      throw new Error('No exposed terrain target')
    },
    { point: target, spell }
  )
}

async function castLandBridge(page, target) {
  const before = await page.evaluate(() => globalThis.testScene.world.stats.bridges),
    click = await terrainClickPoint(page, target, 'bridge')
  await page.getByRole('button', { name: /Land Bridge, [1-9] shots/ }).click()
  await page.mouse.click(click.x, click.y)
  await page.evaluate(async previous => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (let turn = 0; world.stats.bridges === previous && turn < 1_000; turn++) tick(world, 1 / 12)
    for (let turn = 0; world.effects.some(effect => effect.bridge) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    if (
      shaman.hp <= 0 ||
      world.stats.bridges !== previous + 1 ||
      world.effects.some(effect => effect.bridge)
    )
      throw new Error('Player-cast Mission 13 Land Bridge did not finish')
  }, before)
}

async function castSwarm(page, target) {
  const click = await terrainClickPoint(page, target, 'swarm')
  await page.getByRole('button', { name: /^Swarm, [1-9] shots$/ }).click()
  await page.mouse.click(click.x, click.y)
  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (
      let turn = 0;
      (!world.effects.some(effect => effect.swarm?.applied) ||
        world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')?.casting ||
        world.castingTribes[0].cooldown) &&
      turn < 1_000;
      turn++
    )
      tick(world, 1 / 12)
    if (!world.effects.some(effect => effect.swarm?.applied))
      throw new Error('Mission 13 rendered Swarm did not apply')
  })
}

async function renderedBuildingPoint(page, buildingId) {
  return page.evaluate(id => {
    const scene = globalThis.testScene,
      building = scene.world.buildings.find(candidate => candidate.id === id)
    scene.focus(building)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(building),
      bounds = scene.renderer.domElement.getBoundingClientRect(),
      x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - projected.y) * bounds.height) / 2
    scene.picking.lastKey = ''
    for (let dy = -105; dy <= 35; dy += 3)
      for (let dx = -60; dx <= 60; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pick(event) === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No rendered ScenePicking hit point for Balloon Hut ${id}`)
  }, buildingId)
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const { page, errors } = await openGame(browser, 13)
  page.setDefaultTimeout(30_000)
  await page.waitForFunction(async () => {
    const { texture } = await import('/app/scene-assets.ts')
    const image = texture('hud').image
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  await page.evaluate(() => {
    globalThis.testScene.world.speed = 0
  })

  assert.equal(await page.getByRole('button', { name: /Balloon Hut/ }).count(), 0)

  // Reuse the normal rendered Mission 13 route: charge three Bridges, guard escorts,
  // cross with rendered spell input, then worship the authored Balloon Hut Vault.
  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; world.shots.bridge < 3 && turn < 120_000; turn++) tick(world, 1 / 12)
    if (world.shots.bridge < 3) throw new Error('Mission 13 did not charge three Land Bridges')
    globalThis.testScene.onChange()
  })

  const shaman = await unitClickPoint(page, 'shaman')
  await page.mouse.click(shaman.click.x, shaman.click.y)
  const escorts = []
  for (let i = 0; i < 4; i++) {
    const escort = await braveClickPoint(page, escorts)
    await page.keyboard.down('Control')
    await page.mouse.click(escort.click.x, escort.click.y)
    await page.keyboard.up('Control')
    escorts.push(escort.id)
  }
  await page.keyboard.press('g')
  await page.keyboard.press('h')
  assert.deepEqual(await page.evaluate(() => globalThis.testScene.world.selected), [shaman.id])

  const firstBridgeSource = { x: -91, z: 61 },
    firstBridgeTarget = { x: -103, z: 54 },
    secondBridgeSource = { x: -104.5, z: 56 },
    secondBridgeTarget = { x: -116, z: 62 },
    thirdBridgeSource = { x: -117, z: 62 },
    thirdBridgeTarget = { x: -123, z: 63 },
    bridgeApproach = { x: -50, z: 75 }

  let crossing = await terrainClickPoint(page, bridgeApproach)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 party did not reach the safe bridge approach')
  }, bridgeApproach)
  await castSwarm(page, { x: -70, z: 68 })

  crossing = await terrainClickPoint(page, firstBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 party did not reach the first bridge shore')
  }, firstBridgeSource)
  await castLandBridge(page, firstBridgeTarget)

  crossing = await terrainClickPoint(page, secondBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 Shaman did not cross the first Land Bridge')
  }, secondBridgeSource)
  await castLandBridge(page, secondBridgeTarget)

  crossing = await terrainClickPoint(page, thirdBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 Shaman did not cross the second Land Bridge')
  }, thirdBridgeSource)
  await castSwarm(page, { x: 123, z: 67 })
  await castLandBridge(page, thirdBridgeTarget)
  await castSwarm(page, { x: 123, z: 67 })

  const vaultId = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.reward === 'balloonHut')
    scene.focus(vault)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return vault.id
  })
  const clickVault = async () => {
    const point = await shrineClickPoint(page, vaultId)
    await page.mouse.click(point.x, point.y)
    return page.evaluate(async () => {
      const world = globalThis.testScene.world,
        { currentPersonOrder } = await import('/app/person-orders.ts'),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      return currentPersonOrder(world.buildingOrders, shaman.native)?.model === 33
    })
  }
  if (!(await clickVault()) && !(await clickVault()))
    throw new Error('Rendered Mission 13 Balloon Vault clicks did not start worship')
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.unlockedBalloonHut && turn < 12_000; turn++) tick(world, 1 / 12)
    if (!world.unlockedBalloonHut) throw new Error('Mission 13 Vault did not unlock Balloon Hut')
    scene.onChange()
  })

  // Shipped Balloon Hut placement and normal construction.
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const buildButton = page.getByRole('button', { name: 'Balloon Hut, 11 wood', exact: true })
  await buildButton.waitFor()
  assert.equal(await buildButton.isEnabled(), true)
  const site = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, nativePosition, placementError } =
        await import('/app/model.ts'),
      { buildingFootprintCells } = await import('/app/building-shapes.ts'),
      { missionPosition } = await import('/app/mission-data.ts'),
      start = missionPosition(13, 'blue'),
      bounds = scene.container.getBoundingClientRect(),
      candidates = []
    for (let z = start.z - 32; z <= start.z + 32; z += 0.5)
      for (let x = start.x - 32; x <= start.x + 32; x += 0.5)
        if (!placementError(world, 'balloonHut', { x, z })) {
          const plan = buildingPlanPose(world, 'balloonHut', { x, z }),
            point = browserPosition({ x: plan.anchorX, y: plan.anchorY })
          if (
            buildingFootprintCells(plan).some(index =>
              world.units.some(unit => {
                const native = nativePosition(world, unit)
                return (
                  unit.hp > 0 &&
                  unit.inside === null &&
                  ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9) === index
                )
              })
            )
          )
            continue
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
        point = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        picked = scene.pick({ clientX: point.x, clientY: point.y })
      if (picked && !placementError(world, 'balloonHut', picked)) return point
    }
    throw new Error('No exposed valid Mission 13 Balloon Hut site')
  })
  await buildButton.click()
  await page.mouse.move(site.x, site.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  await page.mouse.click(site.x, site.y)
  const hutId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      hut = world.buildings.find(
        building => building.team === 'blue' && building.kind === 'balloonHut'
      )
    if (!hut || hut.progress !== 0) throw new Error('Real input did not place Balloon Hut plan')
    for (let turn = 0; hut.progress < 1 && turn < 24_000; turn++) tick(world, 1 / 12)
    if (hut.progress < 1) throw new Error(`Balloon Hut construction timed out: ${hut.progress}`)
    for (let turn = 0; world.units.some(unit => unit.work === hut.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    return hut.id
  })

  const panel = page.locator('.training-panel[aria-label^="Balloon Hut:"]:not([hidden])')
  const hoverHut = async () => {
    const point = await renderedBuildingPoint(page, hutId)
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
      { id: hutId, point }
    )
    await panel.waitFor({ state: 'visible' })
    return point
  }

  // Empty completed workshop opens through genuine pointer picking; dismantle/cancel reuses existing control.
  await hoverHut()
  assert.equal(
    await panel.getAttribute('aria-label'),
    'Balloon Hut: 0 of 6 workers; 0 of 10 Balloon work'
  )
  assert.deepEqual(
    await panel.locator('canvas').evaluate(canvas => [canvas.width, canvas.height]),
    [208, 82]
  )
  const dismantle = panel.locator('.dismantle-control')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'true')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'false')
  await page.mouse.move(1400, 50)

  // Ordinary authored entry: select every surviving Mission 13 Brave through the shipped HUD.
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
  assert.ok(
    commanded.length >= 2 && commanded.length <= 6,
    `normal Mission 13 route must retain at least two living Braves: ${JSON.stringify(commanded)}`
  )
  const commandPoint = await renderedBuildingPoint(page, hutId)
  await page.mouse.click(commandPoint.x, commandPoint.y)
  await page.evaluate(
    async ({ id, expected }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        hut = world.buildings.find(building => building.id === id)
      for (let turn = 0; hut.admission?.inside !== expected && turn < 4_000; turn++)
        tick(world, 1 / 12)
      if (hut.admission?.inside !== expected)
        throw new Error(
          `Balloon Hut admission did not fill: ${hut.admission?.inside} of ${expected}`
        )
      scene.onChange()
    },
    { id: hutId, expected: commanded.length }
  )
  const residentIds = await page.evaluate(id => {
    const world = globalThis.testScene.world,
      hut = world.buildings.find(building => building.id === id)
    return world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).map(unit => unit.id)
  }, hutId)
  assert.equal(residentIds.length, commanded.length)

  await hoverHut()
  const workers = panel.locator('button:not(.dismantle-control):not([hidden])')
  assert.equal(await workers.count(), residentIds.length)
  assert.deepEqual(
    (
      await workers.evaluateAll(buttons => buttons.map(button => Number(button.dataset.person)))
    ).toSorted((a, b) => a - b),
    residentIds.toSorted((a, b) => a - b)
  )
  const resident = residentIds[0],
    residentIndex = await workers.evaluateAll(
      (buttons, id) => buttons.findIndex(button => Number(button.dataset.person) === id),
      resident
    )
  await page.evaluate(() => {
    globalThis.testScene.world.selected = []
  })
  await workers.nth(residentIndex).click()
  assert.deepEqual(await page.evaluate(() => globalThis.testScene.world.selected), [resident])
  await workers.nth(residentIndex).click({ button: 'right' })
  assert.equal(
    await page.evaluate(id => globalThis.testScene.objectPanels.panels.has(id), resident),
    true
  )
  await page.waitForFunction(() => !globalThis.testScene.cameraMotion.active)

  // Existing gameplay timer remains owner; observe a real partial 100-work block before the 1000 launch threshold.
  const partial = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      hut = world.buildings.find(building => building.id === id)
    for (let turn = 0; hut.timer < 100 && turn < 1_000; turn++) tick(world, 1 / 12)
    if (hut.timer >= 1000) throw new Error('Balloon launched before partial-work observation')
    scene.onChange()
    return { timer: hut.timer, blocks: Math.trunc(hut.timer / 100) }
  }, hutId)
  assert.ok(partial.blocks >= 1 && partial.blocks <= 9, JSON.stringify(partial))
  await hoverHut()
  assert.equal(
    await panel.getAttribute('aria-label'),
    `Balloon Hut: ${residentIds.length} of 6 workers; ${partial.blocks} of 10 Balloon work`
  )

  // Human/playerType 2 launch: only the driver leaves; remaining five physical occupants stay in the Hut.
  const launched = await page.evaluate(
    async ({ hutId, residents }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        hut = world.buildings.find(building => building.id === hutId),
        beforeVehicles = new Set(world.vehicles.map(vehicle => vehicle.id))
      for (
        let turn = 0;
        !world.vehicles.some(vehicle => vehicle.model === 3 && !beforeVehicles.has(vehicle.id)) &&
        turn < 2_000;
        turn++
      )
        tick(world, 1 / 12)
      const balloon = world.vehicles.find(
        vehicle => vehicle.model === 3 && !beforeVehicles.has(vehicle.id)
      )
      if (!balloon) throw new Error('Balloon Hut did not launch vehicle model 3')
      scene.onChange()
      const driver = balloon.passengers[0],
        remaining = residents.filter(id => id !== driver),
        admissionSlots = [...hut.admission.occupants]
      return {
        playerType: world.manaTribes[0].playerType,
        timer: hut.timer,
        driver,
        passengers: [...balloon.passengers],
        driverInside: world.units.find(unit => unit.id === driver)?.inside ?? null,
        remaining,
        remainingInside: remaining.filter(
          id => world.units.find(unit => unit.id === id)?.inside === hutId
        ),
        admissionInside: hut.admission.inside,
        admissionSlots,
        liveInside: world.units
          .filter(unit => unit.inside === hutId && unit.hp > 0)
          .map(unit => unit.id),
      }
    },
    { hutId, residents: residentIds }
  )
  assert.equal(launched.playerType, 2)
  assert.equal(launched.timer, 0)
  assert.ok(residentIds.includes(launched.driver))
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

  await hoverHut()
  assert.equal(
    await panel.getAttribute('aria-label'),
    `Balloon Hut: ${launched.remaining.length} of 6 workers; 0 of 10 Balloon work`
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

  // Supporting gameplay fixture only: native playerType 1 maps to computer tribes and ejects
  // every non-driver occupant. This does not substitute for the authored Mission 13 UI route above.
  const type1Fixture = await page.evaluate(async () => {
    const { createWorld, addBuilding, addUnit, tick } = await import('/app/model.ts'),
      { buildingAdmission } = await import('/app/live-building-entry.ts'),
      world = createWorld(13),
      hut = addBuilding(world, 'yellow', 'balloonHut', { x: 0, z: 0 }, true),
      occupants = Array.from({ length: 4 }, (_, i) =>
        addUnit(world, 'yellow', 'brave', { x: i, z: 0 })
      )
    for (const occupant of occupants) {
      occupant.inside = hut.id
      occupant.work = hut.id
    }
    buildingAdmission(world, hut)
    hut.timer = 999
    tick(world, 1 / 12)
    const balloon = world.vehicles.find(
        vehicle => vehicle.model === 3 && vehicle.team === 'yellow'
      ),
      admission = buildingAdmission(world, hut)
    return {
      playerType: world.manaTribes[2].playerType,
      passenger: balloon?.passengers[0],
      occupants: occupants.map(unit => unit.id),
      inside: occupants.map(unit => unit.inside),
      admissionInside: admission.inside,
      admissionSlots: [...admission.occupants],
    }
  })
  assert.equal(type1Fixture.playerType, 1)
  assert.ok(type1Fixture.occupants.includes(type1Fixture.passenger))
  assert.deepEqual(
    type1Fixture.inside,
    type1Fixture.inside.map(() => null)
  )
  assert.equal(type1Fixture.admissionInside, 0)
  assert.equal(type1Fixture.admissionSlots.some(Boolean), false)

  assert.deepEqual(errors, [])
  const evidence = {
    authoredMission13: {
      unlockedViaRenderedVault: true,
      placedViaHud: true,
      completedBySimulation: true,
      scenePickingHoverOpen: true,
      panel: [208, 82],
      capacity: 6,
      productionBlocks: 10,
      ordinaryAuthoredBraveEntry: residentIds.length,
      occupantSelection: true,
      occupantFocus: true,
      dismantleCancel: true,
      partialWork: partial,
      launchedVehicleModel: 3,
      driverSlotCleared: true,
      retainedHumanOccupants: launched.remaining.length,
      retainedOccupantsSelectable: true,
    },
    supportingType1Fixture: {
      explicitlySupporting: true,
      playerType: type1Fixture.playerType,
      computerRemainingOccupantsEjected: true,
      noStaleAdmissionSlots: true,
    },
    retainedNativeEvidence: {
      model15Capacity: 6,
      vehicle3ProductionWork: 1000,
      noNativeRerun: true,
    },
  }
  writeFileSync(
    resolve(output, 'balloon-hut-menu-browser.json'),
    JSON.stringify(evidence, null, 2) + '\n'
  )
  console.log(
    'PASS: Mission 13 Balloon Hut uses the normal rendered unlock/place/build/entry route and kind-6 menu; hover opening, six occupants, selection/focus, dismantle/cancel, work blocks, launch driver removal, human retention and supporting computer-ejection semantics pass',
    evidence
  )
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
