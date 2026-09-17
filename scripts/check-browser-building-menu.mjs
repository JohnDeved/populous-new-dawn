import assert from 'node:assert/strict'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { bindGame } from './browser-game.mjs'

const projectRoot = process.cwd(),
  requireFromProject = createRequire(resolve(projectRoot, 'package.json')),
  { chromium } = requireFromProject('@playwright/test'),
  output = process.env.PND_QUEUE_OUTPUT ?? '/private/tmp',
  port = 4314
mkdirSync(output, { recursive: true })
let server
async function startServer() {
  if (process.env.POPULOUS_URL) return
  const log = openSync(resolve(output, 'server.log'), 'a')
  server = spawn(resolve(projectRoot, 'node_modules/.bin/vinext'), ['dev', '--port', String(port)], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, WRANGLER_LOG_PATH: resolve(output, 'wrangler.log') },
  })
  process.env.POPULOUS_URL = `http://localhost:${port}`
  for (let i = 0; i < 120; i++) {
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
    timeout = setTimeout(() => finish(server.exitCode !== null || server.signalCode !== null), timeoutMs)
  })
}
async function stopServer() {
  if (!server) return
  try { process.kill(-server.pid, 'SIGTERM') } catch {}
  if (await waitForServerExit(5000)) return
  try { process.kill(-server.pid, 'SIGKILL') } catch {}
  if (!await waitForServerExit(5000)) throw new Error('dev server did not exit after SIGKILL')
}
function cleanupReceipt() {
  if (!process.env.PND_QUEUE_CLEANUP) return
  const receipt = {
    jobId: process.env.PND_QUEUE_JOB_ID,
    resourcesReleased: true,
    releasedAt: new Date().toISOString(),
    processes: server ? [{ pid: server.pid, group: true }] : [],
  }, temporary = `${process.env.PND_QUEUE_CLEANUP}.tmp`
  writeFileSync(temporary, JSON.stringify(receipt, null, 2) + '\n')
  renameSync(temporary, process.env.PND_QUEUE_CLEANUP)
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 1', exact: true }).evaluate(button => button.click())
  await bindGame(page)
  await page.waitForFunction(() => window.testScene.world.flyby.flags & 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await page.evaluate(() => { window.testScene = window.testSceneRef.current })
  await page.waitForFunction(async () => {
    const { texture } = await import('/app/scene-assets.ts')
    const image = texture('hud').image
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  const setup = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts'),
      { buildingAdmission } = await import('/app/live-building-entry.ts')
    w.speed = 0
    w.inputMask = 0
    w.manaWorld.gameFlags = 32
    const huts = []
    for (const [i, level] of [1, 2, 3].entries()) {
      const b = m.addBuilding(w, 'blue', 'hut', { x: -26 + i * 18, z: 30 }, true, {
        angle: Math.PI,
        level,
      })
      const people = Array.from({ length: 6 }, (_, j) =>
        m.addUnit(w, 'blue', 'brave', { x: b.x + j * 0.15, z: b.z + 0.5 })
      )
      for (const u of people) u.inside = b.id
      buildingAdmission(w, b)
      huts.push({ b, people })
    }
    const empty = m.addBuilding(w, 'blue', 'hut', { x: 28, z: 30 }, true, {
      angle: Math.PI,
      level: 1,
    })
    buildingAdmission(w, empty)
    const enemy = m.addBuilding(w, 'red', 'hut', { x: 42, z: 30 }, true, {
      angle: Math.PI,
      level: 3,
    })
    buildingAdmission(w, enemy)
    window.buildingMenuCheck = { huts, empty, enemy }
    s.focus({ x: 8, z: 30 })
    s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    return {
      huts: huts.map(({ b, people }) => ({ id: b.id, level: b.level, people: people.map(u => u.id) })),
      empty: empty.id,
      enemy: enemy.id,
    }
  })

  const panel = page.locator('.training-panel:not(.construction-panel):not(.tower-panel):not([hidden])')
  const open = async id => {
    await page.evaluate(id => {
      const s = window.testScene
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      s.hoveredObject = id
      s.renderBuildingPanels()
      const visiblePanel = [...document.querySelectorAll('.training-panel:not(.construction-panel):not(.tower-panel)')].find(
        candidate => !candidate.hidden
      )
      const control = visiblePanel?.querySelector('.dismantle-control')
      if (!(control instanceof HTMLButtonElement) || control.hidden)
        throw new Error(`building panel ${id} did not render a visible dismantle control`)
      control.focus()
    }, id)
    await panel.waitFor({ state: 'visible' })
  }
  const hide = async () => {
    await page.mouse.move(1400, 50)
    await page.evaluate(() => {
      const s = window.testScene
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      s.hoveredObject = null
      s.renderBuildingPanels()
    })
  }

  const capacities = [3, 4, 5], widths = [88, 104, 120], results = []
  for (let i = 0; i < setup.huts.length; i++) {
    const h = setup.huts[i], capacity = capacities[i]
    await open(h.id)
    assert.equal(await panel.getAttribute('aria-label'), `Hut: ${capacity} of ${capacity} occupants`)
    assert.deepEqual(await panel.locator('canvas').evaluate(c => [c.width, c.height]), [widths[i], 62])
    const occupants = panel.locator('button:not(.dismantle-control):not([hidden])')
    assert.equal(await occupants.count(), capacity, `level ${h.level} must cap stale six-slot admission`)
    assert.deepEqual(await occupants.evaluateAll(bs => bs.map(b => Number(b.dataset.person))), h.people.slice(0, capacity))

    await page.evaluate(() => { window.testScene.world.selected = [] })
    await occupants.nth(0).click()
    assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [h.people[0]])
    await occupants.nth(0).click({ modifiers: ['Shift'] })
    assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
    await occupants.nth(1).click({ button: 'right' })
    assert.equal(await page.evaluate(id => window.testScene.objectPanels.panels.has(id), h.people[1]), true)
    await page.waitForFunction(() => !window.testScene.cameraMotion.active)

    await page.evaluate(({ id, person }) => {
      const s = window.testScene,
        b = s.world.buildings.find(b => b.id === id),
        u = s.world.units.find(u => u.id === person),
        slot = b.admission.occupants.indexOf(person)
      b.admission.occupants[slot] = 0
      b.admission.inside--
      u.inside = null
      s.renderBuildingPanels()
    }, { id: h.id, person: h.people[0] })
    assert.equal(await panel.locator('button:not(.dismantle-control):not([hidden])').count(), capacity)
    assert.deepEqual(
      await panel.locator('button:not(.dismantle-control):not([hidden])').evaluateAll(bs => bs.map(b => Number(b.dataset.person))),
      h.people.slice(1, capacity + 1),
      'departed occupant is removed and the next live physical slot compacts into the native-capacity row'
    )
    results.push({ level: h.level, capacity, width: widths[i] })
    await hide()
  }

  await open(setup.empty)
  assert.equal(await panel.getAttribute('aria-label'), 'Hut: 0 of 3 occupants')
  assert.equal(await panel.locator('button:not(.dismantle-control):not([hidden])').count(), 0)
  const hoverControl = panel.locator('.dismantle-control')
  await hoverControl.hover()
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await page.waitForFunction(() =>
    document.querySelector('.training-panel:not(.construction-panel):not(.tower-panel):not([hidden])')?.matches(':hover')
  )
  await page.evaluate(() => {
    const s = window.testScene
    s.hoveredObject = null
    s.renderBuildingPanels()
  })
  assert.equal(await panel.count(), 1, 'panel hover retains the control after world hover leaves')
  await page.mouse.move(1400, 50)
  await page.waitForFunction(() =>
    !document.querySelector('.training-panel:not(.construction-panel):not(.tower-panel):not([hidden])')?.matches(':hover')
  )
  await page.evaluate(() => window.testScene.renderBuildingPanels())
  assert.equal(await panel.count(), 0, 'leaving both building and panel hides the hover menu')

  await open(setup.empty)
  const dismantle = panel.locator('.dismantle-control')
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'true')
  assert.ok(await page.evaluate(id => window.testScene.world.buildings.find(b => b.id === id).admission.activity & 0x8000, setup.empty))
  await dismantle.click()
  assert.equal(await dismantle.getAttribute('aria-pressed'), 'false')

  await hide()
  await page.evaluate(id => {
    const s = window.testScene
    s.hoveredObject = id
    s.renderBuildingPanels()
  }, setup.enemy)
  assert.equal(await panel.count(), 0, 'enemy huts never expose player occupant/dismantle controls')

  const checkpoint = setup.huts[0]
  const saved = await page.evaluate(async () => ({
    persisted: await window.testStore.saveCheckpoint(),
    available: window.testStore.hasCheckpoint(),
  }))
  assert.equal(saved.available, true)
  await page.evaluate(id => {
    const s = window.testScene,
      b = s.world.buildings.find(b => b.id === id)
    for (const person of b.admission.occupants) {
      const u = person && s.world.units.find(u => u.id === person)
      if (u) u.inside = null
    }
    b.admission.occupants.fill(0)
    b.admission.inside = 0
    s.renderBuildingPanels()
  }, checkpoint.id)
  await open(checkpoint.id)
  assert.equal(await panel.getAttribute('aria-label'), 'Hut: 0 of 3 occupants')
  assert.equal(await page.evaluate(() => window.testStore.loadCheckpoint()), true)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
    window.testScene.hoveredObject = null
  })
  await open(checkpoint.id)
  assert.equal(await panel.getAttribute('aria-label'), 'Hut: 3 of 3 occupants')
  assert.deepEqual(
    await panel.locator('button:not(.dismantle-control):not([hidden])').evaluateAll(bs => bs.map(b => Number(b.dataset.person))),
    checkpoint.people.slice(1, 4),
    'checkpoint restore rebuilds live occupant IDs without retaining post-save stale state'
  )

  await open(setup.empty)
  await page.evaluate(id => {
    const s = window.testScene,
      b = s.world.buildings.find(b => b.id === id)
    b.hp = 0
    s.renderBuildingPanels()
  }, setup.empty)
  assert.equal(await panel.count(), 0, 'destroyed building leaves no visible stale hover control')

  assert.deepEqual(errors, [])
  await page.screenshot({ path: resolve(output, 'populous-building-menu.png') })
  const evidence = { capacities: results, staleAdmissionClamped: true, enemySuppressed: true, pointerTransition: true, dismantleToggle: true }
  writeFileSync(resolve(output, 'populous-building-menu-browser.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log('PASS: owned hut kind-7 menus use 3/4/5 capacities, clamp stale physical slots, use real world hover, select/focus, refresh departures, retain pointer transitions, toggle dismantling, suppress enemy controls, restore checkpoints and remove destroyed panels', evidence)
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
