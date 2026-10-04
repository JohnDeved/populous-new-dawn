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
  port = 4325
mkdirSync(output, { recursive: true })

let server
async function startServer() {
  if (process.env.POPULOUS_URL) return
  const log = openSync(resolve(output, 'server.log'), 'a')
  server = spawn(resolve(projectRoot, 'node_modules/.bin/vinext'), ['dev', '--port', String(port)], {
    cwd: projectRoot,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, WRANGLER_LOG_PATH: resolve(output, 'wrangler.log') },
  })
  process.env.POPULOUS_URL = `http://localhost:${port}`
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`dev server exited with ${server.exitCode}`)
    try {
      if ((await fetch(process.env.POPULOUS_URL)).ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('dev server readiness timed out')
}

async function stopServer() {
  if (!server) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {}
  for (let i = 0; i < 50 && server.exitCode === null && server.signalCode === null; i++)
    await new Promise(resolve => setTimeout(resolve, 100))
  if (server.exitCode === null && server.signalCode === null) {
    try {
      process.kill(-server.pid, 'SIGKILL')
    } catch {}
  }
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

async function waitHud(page) {
  await page.waitForFunction(async () => {
    const { texture } = await import('/app/scene-assets.ts'),
      image = texture('hud').image
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
}

async function setHudSize(page, value) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByLabel('HUD size').selectOption(value)
  await page.getByRole('button', { name: 'Continue Game', exact: false }).click()
  await page.waitForFunction(value => {
    const fit = Math.min(innerWidth / 640, innerHeight / 480),
      preferred =
        value === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(value),
      expected = String(Math.min(preferred, fit))
    return getComputedStyle(document.querySelector('.game-shell'))
      .getPropertyValue('--hud-scale')
      .trim() === expected
  }, value)
}

async function renderedBuildingPoint(page, id) {
  return page.evaluate(id => {
    const s = window.testScene,
      building = s.world.buildings.find(candidate => candidate.id === id)
    if (!building) throw new Error(`Missing building ${id}`)
    s.focus(building)
    s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    s.renderer.render(s.scene, s.camera)
    const p = s.screen(building),
      r = s.renderer.domElement.getBoundingClientRect(),
      cx = r.left + ((p.x + 1) * r.width) / 2,
      cy = r.top + ((1 - p.y) * r.height) / 2
    for (let dy = -140; dy <= 60; dy += 3)
      for (let dx = -90; dx <= 90; dx += 3) {
        const event = { clientX: cx + dx, clientY: cy + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement &&
          s.picking.pick(event) === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No ScenePicking point for building ${id}`)
  }, id)
}

async function advanceUntil(page, predicate, limit, label) {
  const result = await page.evaluate(async ({ predicate, limit }) => {
    const s = window.testScene,
      w = s.world,
      { tick } = await import('/app/model.ts')
    const ready = () => {
      if (predicate.type === 'building-complete') {
        const b = w.buildings.find(candidate => candidate.id === predicate.id)
        return !!b && b.progress >= 1
      }
      if (predicate.type === 'inside') {
        const b = w.buildings.find(candidate => candidate.id === predicate.id)
        return (b?.admission?.inside ?? 0) >= predicate.count
      }
      throw new Error(`Unknown predicate ${predicate.type}`)
    }
    for (let i = 0; i < limit && !ready(); i++) tick(w, 1 / 12)
    w.speed = 0
    window.testStore.update()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return { ready: ready(), turn: w.turn }
  }, { predicate, limit })
  assert.ok(result.ready, `${label} timed out at turn ${result.turn}`)
}

async function groundBuildPoint(page, kind, preferred) {
  return page.evaluate(async ({ kind, preferred }) => {
    const s = window.testScene,
      { placementError } = await import('/app/model.ts')
    let worldPoint
    for (let radius = 0; radius <= 24 && !worldPoint; radius += 2)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const p = {
          x: preferred.x + Math.cos(angle) * radius,
          z: preferred.z + Math.sin(angle) * radius,
        }
        if (!placementError(s.world, kind, p)) {
          worldPoint = p
          break
        }
      }
    if (!worldPoint) throw new Error(`No valid ${kind} placement`)
    s.focus(worldPoint)
    s.onChange()
    s.renderer.render(s.scene, s.camera)
    const r = s.renderer.domElement.getBoundingClientRect()
    for (let radius = 0; radius <= 12; radius += 2)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const candidate = {
            x: worldPoint.x + Math.cos(angle) * radius,
            z: worldPoint.z + Math.sin(angle) * radius,
          },
          projected = s.screen(candidate),
          event = {
            clientX: r.left + ((projected.x + 1) * r.width) / 2,
            clientY: r.top + ((1 - projected.y) * r.height) / 2,
          },
          picked = s.pick(event)
        if (
          document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement &&
          s.picking.pick(event) === null &&
          picked &&
          !placementError(s.world, kind, picked) &&
          Math.hypot(picked.x - candidate.x, picked.z - candidate.z) < 2
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No rendered build point for ${kind}`)
  }, { kind, preferred })
}

async function ordinaryMissionOneHouse(page) {
  await waitHud(page)
  const hut = await page.evaluate(() => {
    const s = window.testScene,
      b = s.world.buildings.find(
        candidate => candidate.team === 'blue' && candidate.kind === 'hut' && candidate.progress >= 1 && candidate.hp > 0
      )
    if (!b) throw new Error('Mission 1 authored hut unavailable')
    s.world.speed = 0
    return b.id
  })
  const point = await renderedBuildingPoint(page, hut)
  await page.getByLabel('Select brave').click()
  await page.mouse.click(point.x, point.y)
  await advanceUntil(page, { type: 'inside', id: hut, count: 3 }, 5000, 'Mission 1 hut entry')
  return hut
}

async function ordinaryMissionTwoTrainingHut(page) {
  await waitHud(page)
  const before = new Set(await page.evaluate(() => window.testScene.world.buildings.map(b => b.id))),
    target = await groundBuildPoint(page, 'camp', { x: -99, z: -105 })
  await page.getByLabel('Select brave').click({ modifiers: ['Shift'] })
  await page.getByLabel('buildings B', { exact: true }).click()
  await page.getByRole('button', { name: 'Warrior Training Hut, 8 wood', exact: true }).click()
  await page.mouse.click(target.x, target.y)
  const camp = await page.evaluate(before => {
    const known = new Set(before),
      building = window.testScene.world.buildings.find(b => !known.has(b.id) && b.kind === 'camp' && b.team === 'blue')
    if (!building) throw new Error('Rendered Warrior Training Hut placement did not create a camp')
    return building.id
  }, [...before])
  await advanceUntil(page, { type: 'building-complete', id: camp }, 20000, 'Mission 2 training hut construction')
  const point = await renderedBuildingPoint(page, camp)
  await page.getByLabel('Select brave').click({ modifiers: ['Shift'] })
  await page.mouse.click(point.x, point.y)
  await advanceUntil(page, { type: 'inside', id: camp, count: 1 }, 3000, 'Mission 2 training entry')
  return camp
}

async function openPanel(page, id) {
  const point = await renderedBuildingPoint(page, id)
  await page.mouse.move(1400, 40)
  await page.waitForFunction(() => window.testScene.hoveredObject === null)
  await page.mouse.move(point.x, point.y)
  await page.waitForFunction(id => window.testScene.hoveredObject === id, id)
  const panel = page.locator('.training-panel:not([hidden])')
  await panel.waitFor({ state: 'visible' })
  return { panel, point }
}

async function panelGeometry(page, panel, id) {
  return panel.evaluate((node, id) => {
    const s = window.testScene,
      b = s.world.buildings.find(candidate => candidate.id === id),
      p = s.screen(b),
      renderer = s.renderer.domElement.getBoundingClientRect(),
      viewport = s.container.getBoundingClientRect(),
      r = node.getBoundingClientRect(),
      scale = Number.parseFloat(
        getComputedStyle(s.container).getPropertyValue('--hud-scale')
      ),
      anchor = {
        x: renderer.left - viewport.left + ((p.x + 1) * renderer.width) / 2,
        y: renderer.top - viewport.top + ((1 - p.y) * renderer.height) / 2,
      }
    return {
      scale,
      renderer: { x: renderer.x, y: renderer.y, width: renderer.width, height: renderer.height },
      panel: { x: r.x, y: r.y, width: r.width, height: r.height },
      localAnchor: anchor,
      panelTail: { x: r.x - viewport.x + r.width / 2, y: r.bottom - viewport.y },
    }
  }, id)
}

async function transitIntoPanel(page, panel, point) {
  const route = await panel.evaluate((node, point) => {
    const r = node.getBoundingClientRect(),
      buttons = [...node.querySelectorAll('button:not([hidden])')].map(button => button.getBoundingClientRect())
    let waypoint = null,
      distance = -1
    for (let y = r.top + 4; y < r.bottom - 4; y += 4)
      for (let x = r.left + 4; x < r.right - 4; x += 4) {
        if (buttons.some(b => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom)) continue
        const d = Math.hypot(x - point.x, y - point.y)
        if (d > distance) {
          distance = d
          waypoint = { x, y }
        }
      }
    const first = node.querySelector('button:not(.dismantle-control):not([hidden])')?.getBoundingClientRect()
    if (!waypoint || !first) throw new Error('Panel needs a blank transit point and an occupant control')
    return {
      waypoint,
      occupant: { x: first.left + first.width / 2, y: first.top + first.height / 2 },
    }
  }, point)
  const before = await page.evaluate(() => ({
    lastOrderTurn: window.testScene.world.lastOrderTurn,
    orders: JSON.stringify(window.testScene.world.buildingOrders),
  }))
  const samples = []
  for (let i = 1; i <= 12; i++) {
    const x = point.x + ((route.waypoint.x - point.x) * i) / 12,
      y = point.y + ((route.waypoint.y - point.y) * i) / 12
    await page.mouse.move(x, y)
    await page.waitForTimeout(20)
    samples.push(
      await page.evaluate(({ x, y }) => {
        const p = document.querySelector('.training-panel:not([hidden])'),
          hit = document.elementFromPoint(x, y)
        return {
          visible: !!p,
          hovered: !!p?.matches(':hover'),
          worldHover: window.testScene.hoveredObject,
          hitInsidePanel: !!p && (hit === p || p.contains(hit)),
          hit: hit?.className || hit?.tagName || null,
        }
      }, { x, y })
    )
  }
  await page.mouse.move(route.waypoint.x, route.waypoint.y)
  await page.waitForTimeout(30)
  const waypointState = await page.evaluate(({ x, y }) => {
    const p = document.querySelector('.training-panel:not([hidden])'),
      hit = document.elementFromPoint(x, y)
    return {
      visible: !!p,
      hovered: !!p?.matches(':hover'),
      hitInsidePanel: !!p && (hit === p || p.contains(hit)),
      hit: hit?.className || hit?.tagName || null,
      worldHover: window.testScene.hoveredObject,
    }
  }, route.waypoint)
  if (waypointState.visible) {
    await page.mouse.move(route.occupant.x, route.occupant.y, { steps: 4 })
    await page.waitForTimeout(20)
  }
  const final = await page.evaluate(({ x, y }) => {
    const p = document.querySelector('.training-panel:not([hidden])'),
      hit = document.elementFromPoint(x, y)
    return {
      visible: !!p,
      hovered: !!p?.matches(':hover'),
      occupantHit: hit instanceof HTMLButtonElement && !hit.classList.contains('dismantle-control'),
      worldHover: window.testScene.hoveredObject,
    }
  }, route.occupant)
  const after = await page.evaluate(() => ({
    lastOrderTurn: window.testScene.world.lastOrderTurn,
    orders: JSON.stringify(window.testScene.world.buildingOrders),
  }))
  return {
    route,
    waypointState,
    final,
    noWorldCommand: before.lastOrderTurn === after.lastOrderTurn && before.orders === after.orders,
    samples,
  }
}

async function exerciseControls(page, panel) {
  const occupant = panel.locator('button:not(.dismantle-control):not([hidden])').first(),
    person = Number(await occupant.getAttribute('data-person'))
  await page.evaluate(() => {
    window.testScene.world.selected = []
  })
  await occupant.click()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [person])

  const target = await page.evaluate(async person => {
    const s = window.testScene,
      unit = s.world.units.find(candidate => candidate.id === person && candidate.hp > 0),
      { nativePosition } = await import('/app/model.ts')
    if (!unit) throw new Error(`Missing panel occupant ${person}`)
    const point = nativePosition(s.world, unit)
    return {
      person,
      x: point.x & 65535,
      y: point.y & 65535,
      beforeControl: { x: s.cameraPosition.x, y: s.cameraPosition.y },
    }
  }, person)

  await page.keyboard.down('w')
  try {
    await page.waitForFunction(({ x, y, beforeControl }) => {
      const camera = window.testScene.cameraPosition,
        wrapped = value => ((value + 32768) & 65535) - 32768,
        moved = Math.hypot(wrapped(camera.x - beforeControl.x), wrapped(camera.y - beforeControl.y)),
        away = Math.hypot(wrapped(camera.x - x), wrapped(camera.y - y))
      return moved >= 256 && away >= 512
    }, target, { timeout: 5000 })
  } finally {
    await page.keyboard.up('w')
  }

  const away = await page.evaluate(({ x, y, beforeControl }) => {
    const camera = window.testScene.cameraPosition,
      wrapped = value => ((value + 32768) & 65535) - 32768
    return {
      x: camera.x,
      y: camera.y,
      moved: Math.hypot(wrapped(camera.x - beforeControl.x), wrapped(camera.y - beforeControl.y)),
      distanceToTarget: Math.hypot(wrapped(camera.x - x), wrapped(camera.y - y)),
    }
  }, target)
  assert.ok(away.moved >= 256, 'shipped camera control must move before occupant focus')
  assert.ok(away.distanceToTarget >= 512, 'focus must begin from a non-zero camera displacement')
  assert.equal(
    await occupant.evaluate(button => {
      const r = button.getBoundingClientRect()
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === button
    }),
    true,
    'camera-away precondition must leave the exact occupant right-click hit target unobscured'
  )

  await occupant.click({ button: 'right' })
  const accepted = await page.evaluate(({ x, y }) => {
    const s = window.testScene,
      wrapped = value => ((value + 32768) & 65535) - 32768,
      sourceDistance = Math.hypot(
        wrapped(s.cameraMotion.source.x - x),
        wrapped(s.cameraMotion.source.y - y)
      )
    return {
      active: s.cameraMotion.active,
      target: { x: s.cameraMotion.target.x, y: s.cameraMotion.target.y },
      source: { x: s.cameraMotion.source.x, y: s.cameraMotion.source.y },
      sourceDistance,
      selected: [...s.world.selected],
    }
  }, target)
  assert.ok(accepted.active, 'non-zero right-click focus must schedule the shipped camera focus consumer')
  assert.deepEqual(accepted.selected, [person], 'right-click focus must retain the selected occupant identity')
  assert.deepEqual(accepted.source, { x: away.x, y: away.y }, 'focus consumer must start from the shipped-control camera position')
  assert.deepEqual(accepted.target, { x: target.x, y: target.y }, 'focus consumer must target the exact occupant position')
  assert.ok(accepted.sourceDistance >= 512, 'focus request must originate from the shipped-control displacement')

  await page.waitForFunction(({ x, y }) => {
    const s = window.testScene
    return !s.cameraMotion.active && s.cameraPosition.x === x && s.cameraPosition.y === y
  }, target, { timeout: 10_000 })
  const result = await page.evaluate(() => ({
    x: window.testScene.cameraPosition.x,
    y: window.testScene.cameraPosition.y,
  }))
  assert.deepEqual(result, { x: target.x, y: target.y }, 'camera must settle on the exact occupant focus target')
  return { person, target, away, accepted, result }
}

async function exerciseDismantle(page, id) {
  const { panel } = await openPanel(page, id),
    control = panel.locator('.dismantle-control')
  await control.click()
  assert.equal(await control.getAttribute('aria-pressed'), 'true')
  await control.click()
  assert.equal(await control.getAttribute('aria-pressed'), 'false')
}

async function edgeGeometry(page, id) {
  const results = []
  const measure = async id =>
    page.evaluate(id => {
      const s = window.testScene,
        b = s.world.buildings.find(candidate => candidate.id === id),
        node = s.buildingPanels.get(id)
      if (!b || !node) throw new Error(`Missing edge-case building/panel ${id}`)
      s.renderBuildingPanels()
      const r = node.getBoundingClientRect(),
        v = s.renderer.domElement.getBoundingClientRect(),
        p = s.screen(b),
        projected = {
          x: v.left + ((p.x + 1) * v.width) / 2,
          y: v.top + ((1 - p.y) * v.height) / 2,
        },
        tail = { x: r.left + r.width / 2, y: r.bottom }
      return {
        visible: s.visible(b),
        hidden: node.hidden,
        panel: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width },
        renderer: { left: v.left, top: v.top, right: v.right, bottom: v.bottom, width: v.width },
        projected,
        tail,
        clamped: Math.abs(tail.x - projected.x) > 1 || Math.abs(tail.y - projected.y) > 1,
        scale: Number.parseFloat(getComputedStyle(s.container).getPropertyValue('--hud-scale')),
      }
    }, id)

  for (const hudSize of ['auto', '1']) {
    await setHudSize(page, hudSize)
    const { panel } = await openPanel(page, id),
      control = panel.locator('.dismantle-control')
    await panel.hover()
    await control.focus()
    let geometry = await measure(id)
    for (let step = 0; step < 96 && !geometry.clamped; step++) {
      await page.keyboard.down('d')
      await page.waitForTimeout(50)
      await page.keyboard.up('d')
      geometry = await measure(id)
      if (!geometry.visible || geometry.hidden)
        throw new Error(
          `building/panel left the visible renderer before clamping at ${hudSize}: ${JSON.stringify(geometry)}`
        )
    }
    if (!geometry.clamped)
      throw new Error(`Panel ${id} never reached a clamped edge at ${hudSize}`)
    results.push({ hudSize, ...geometry })
  }
  return results
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: true })

  const houseGame = await openGame(browser, 1),
    houseId = await ordinaryMissionOneHouse(houseGame.page),
    houseOpen = await openPanel(houseGame.page, houseId),
    houseGeometry = await panelGeometry(houseGame.page, houseOpen.panel, houseId),
    houseTransit = await transitIntoPanel(houseGame.page, houseOpen.panel, houseOpen.point)

  const trainingGame = await openGame(browser, 2),
    trainingId = await ordinaryMissionTwoTrainingHut(trainingGame.page),
    trainingOpen = await openPanel(trainingGame.page, trainingId),
    trainingGeometry = await panelGeometry(trainingGame.page, trainingOpen.panel, trainingId),
    trainingTransit = await transitIntoPanel(trainingGame.page, trainingOpen.panel, trainingOpen.point)

  const evidence = {
    authored: {
      house: { id: houseId, geometry: houseGeometry, transit: houseTransit },
      training: { id: trainingId, geometry: trainingGeometry, transit: trainingTransit },
    },
  }
  writeFileSync(resolve(output, 'building-panel-hover-browser.json'), JSON.stringify(evidence, null, 2) + '\n')

  assert.equal(houseTransit.waypointState.hitInsidePanel, true, 'occupied-house panel background must own pointer transit')
  assert.equal(houseTransit.final.occupantHit, true, 'occupied-house transit must reach an occupant control')
  assert.equal(houseTransit.noWorldCommand, true, 'occupied-house transit must not issue a world command')
  assert.equal(trainingTransit.waypointState.hitInsidePanel, true, 'training panel background must own pointer transit')
  assert.equal(trainingTransit.final.occupantHit, true, 'training transit must reach a trainee control')
  assert.equal(trainingTransit.noWorldCommand, true, 'training transit must not issue a world command')

  evidence.authored.house.focus = await exerciseControls(houseGame.page, houseOpen.panel)
  await exerciseDismantle(houseGame.page, houseId)
  evidence.authored.training.focus = await exerciseControls(trainingGame.page, trainingOpen.panel)
  await exerciseDismantle(trainingGame.page, trainingId)

  const edge = await edgeGeometry(houseGame.page, houseId)
  evidence.supporting = { edge }
  for (const sample of edge) {
    assert.ok(sample.panel.left >= sample.renderer.left - 0.5)
    assert.ok(sample.panel.top >= sample.renderer.top - 0.5)
    assert.ok(sample.panel.right <= sample.renderer.right + 0.5)
    assert.ok(sample.panel.bottom <= sample.renderer.bottom + 0.5)
    assert.equal(sample.clamped, true, `${sample.hudSize} edge case must exercise shared panel clamping`)
  }
  assert.deepEqual(houseGame.errors, [])
  assert.deepEqual(trainingGame.errors, [])
  writeFileSync(resolve(output, 'building-panel-hover-browser.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log('PASS: authored Mission 1 occupied hut and rendered Mission 2 Warrior Training Hut retain true building→panel pointer transit with no world commands; occupant select/right-focus, dismantle/cancel, HUD Auto/100% edge containment pass')
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
