import assert from 'node:assert/strict'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { bindGame, openGame } from './browser-game.mjs'

const projectRoot = process.cwd(),
  requireFromProject = createRequire(resolve(projectRoot, 'package.json')),
  { chromium } = requireFromProject('@playwright/test'),
  output = process.env.PND_QUEUE_OUTPUT ?? '/private/tmp',
  port = 4316
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

async function openMissionInContext(context, mission, errors) {
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: `Mission ${mission}`, exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(
    () => window.testScene.world.flyby.flags & 1 || !window.testScene.world.inputMask
  )
  await page.evaluate(() => document.querySelector('.skip-introduction')?.click())
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  return page
}

const rosterLabels = [
  'Select follower',
  'Select brave',
  'Select warrior',
  'Select preacher',
  'Select firewarrior',
  'Select spy',
]

async function openFollowers(page) {
  await page.getByTitle('followers', { exact: true }).click()
  const tab = page.getByTitle('followers', { exact: true })
  assert.equal(await tab.getAttribute('aria-pressed'), 'true')
  const sprite = tab.locator('.hud-sprite')
  assert.equal(await sprite.evaluate(node => node.style.backgroundPosition), '-914px -26px')
}

async function rosterSnapshot(page) {
  const section = page.locator('.tribe-classes')
  const labels = await section
    .locator('button')
    .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))
  const counts = {}
  for (const label of rosterLabels) {
    const button = page.getByRole('button', { name: label, exact: true })
    counts[label] = Number(await button.locator('.follower-number').getAttribute('aria-label'))
  }
  const meter = page.getByRole('meter', { name: 'Population capacity', exact: true })
  return {
    labels,
    counts,
    meter: await meter.getAttribute('aria-valuetext'),
    rects: await section.locator('button').evaluateAll(buttons =>
      buttons.map(button => {
        const rect = button.getBoundingClientRect()
        return [rect.left, rect.top, rect.width, rect.height]
      })
    ),
  }
}

async function assertRosterMatchesWorld(page, expected) {
  const snapshot = await rosterSnapshot(page)
  assert.deepEqual(snapshot.labels, rosterLabels)
  assert.deepEqual(snapshot.counts, expected.counts)
  assert.equal(snapshot.meter, `${expected.population} of ${expected.capacity}`)
  for (const [, , width, height] of snapshot.rects) {
    assert.ok(width > 0 && height > 0)
  }
  return snapshot
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const { page, errors } = await openGame(browser, 12)
  page.setDefaultTimeout(30_000)
  await openFollowers(page)

  // Authored startup / real tab boundary: only the original counted strip is a selection roster.
  const originalSurface = await rosterSnapshot(page)
  assert.deepEqual(originalSurface.labels, rosterLabels)
  assert.equal(
    await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).count(),
    1
  )
  assert.equal(
    await page.locator('.command-dock button[aria-label^="Select "]').count(),
    0,
    'Followers command dock must not duplicate Shaman/class/Everyone selection controls'
  )
  assert.equal(
    await page
      .locator('.command-dock .hud-sprite')
      .evaluateAll(
        nodes => nodes.filter(node => node.style.backgroundPosition === '-890px -26px').length
      ),
    0,
    'HFX 680 belongs to the Followers tab, not an Everyone command button'
  )

  // Controlled supporting fixture: retain Mission 12 startup, but create deterministic class/count
  // state without replaying the full Spy Vault/training campaign. No UI components are injected.
  const fixture = await page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      { addBuilding, addUnit, population, populationLimit } = await import('/app/model.ts'),
      { buildingAdmission } = await import('/app/live-building-entry.ts'),
      shaman = world.units.find(
        unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
      )
    if (!shaman) throw new Error('Mission 12 authored Blue Shaman is unavailable')
    world.speed = 0
    world.paused = false
    world.selected = []
    for (const unit of world.units)
      if (unit.team === 'blue' && ['warrior', 'preacher', 'firewarrior', 'spy'].includes(unit.kind))
        unit.hp = 0
    const hut = addBuilding(world, 'blue', 'hut', { x: shaman.x + 16, z: shaman.z }, true),
      housed = addUnit(world, 'blue', 'brave', { x: shaman.x + 16, z: shaman.z }),
      warrior = addUnit(world, 'blue', 'warrior', { x: shaman.x + 3, z: shaman.z }),
      firewarrior = addUnit(world, 'blue', 'firewarrior', { x: shaman.x + 4, z: shaman.z }),
      spy = addUnit(world, 'blue', 'spy', { x: shaman.x + 5, z: shaman.z })
    housed.inside = hut.id
    housed.work = hut.id
    buildingAdmission(world, hut)
    scene.onChange()
    return {
      hut: hut.id,
      housed: housed.id,
      warrior: warrior.id,
      firewarrior: firewarrior.id,
      spy: spy.id,
      counts: Object.fromEntries([
        [
          'Select follower',
          world.units.filter(u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind !== 'shaman')
            .length,
        ],
        [
          'Select brave',
          world.units.filter(u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind === 'brave')
            .length,
        ],
        [
          'Select warrior',
          world.units.filter(u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind === 'warrior')
            .length,
        ],
        [
          'Select preacher',
          world.units.filter(
            u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind === 'preacher'
          ).length,
        ],
        [
          'Select firewarrior',
          world.units.filter(
            u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind === 'firewarrior'
          ).length,
        ],
        [
          'Select spy',
          world.units.filter(u => u.team === 'blue' && u.hp > 0 && !u.ghost && u.kind === 'spy')
            .length,
        ],
      ]),
      population: population(world, 'blue'),
      capacity: populationLimit(world, 'blue'),
    }
  })
  assert.equal(
    fixture.counts['Select preacher'],
    0,
    'supporting fixture must include an empty class'
  )
  const populatedSurface = await assertRosterMatchesWorld(page, fixture)
  assert.ok(fixture.counts['Select brave'] > 0)
  assert.equal(
    await page
      .getByRole('button', { name: 'Select preacher', exact: true })
      .locator('.follower-number .hud-sprite')
      .count(),
    0,
    'native zero class count renders no numeric glyphs'
  )
  assert.equal(
    await page.evaluate(
      id => window.testScene.world.units.find(unit => unit.id === id)?.inside,
      fixture.housed
    ),
    fixture.hut,
    'housed Brave remains included in the live class count'
  )

  // Existing shipped selection/focus path: one deterministic Warrior is enough to catch a wiring regression.
  const warriorButton = page.getByRole('button', { name: 'Select warrior', exact: true })
  await warriorButton.click()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [fixture.warrior])
  await warriorButton.click({ button: 'right' })
  assert.equal(await page.evaluate(() => window.testScene.hudFocus[3]), fixture.warrior)
  assert.equal(
    await page.evaluate(id => window.testScene.objectPanels.panels.has(id), fixture.warrior),
    true
  )
  await page.evaluate(async () => {
    const { setSelection } = await import('/app/model.ts')
    setSelection(window.testScene.world, [])
    window.testScene.onChange()
  })

  // Real checkpoint UI: save the fixture, perturb counts, load, then ensure roster and housed state restore.
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.evaluate(async spyId => {
    const scene = window.testScene,
      world = scene.world,
      { addUnit } = await import('/app/model.ts'),
      shaman = world.units.find(
        unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
      ),
      spy = world.units.find(unit => unit.id === spyId)
    spy.hp = 0
    addUnit(world, 'blue', 'warrior', { x: shaman.x + 6, z: shaman.z })
    scene.onChange()
  }, fixture.spy)
  const changed = await rosterSnapshot(page)
  assert.notDeepEqual(changed.counts, fixture.counts)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await openFollowers(page)
  await assertRosterMatchesWorld(page, fixture)
  assert.equal(
    await page.evaluate(({ housed, hut }) => {
      const world = window.testScene.world,
        unit = world.units.find(candidate => candidate.id === housed),
        building = world.buildings.find(candidate => candidate.id === hut)
      return unit?.inside === hut && building?.admission?.occupants.includes(housed)
    }, fixture),
    true,
    'checkpoint keeps the counted housed follower in Unit.inside and admission'
  )

  // Existing Spy action remains the only Followers command-dock content when a Spy is selected.
  await page.getByRole('button', { name: 'Select spy', exact: true }).click()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [fixture.spy])
  await openFollowers(page)
  const disguiseButtons = page.locator(
    '.command-dock button[aria-label^="Disguise selected spies as "]'
  )
  assert.ok((await disguiseButtons.count()) > 0)
  assert.equal(await page.locator('.command-dock button[aria-label^="Select "]').count(), 0)
  const disguiseLabel = await disguiseButtons.first().getAttribute('aria-label')
  await disguiseButtons.first().click()
  const disguised = await page.evaluate(async spyId => {
    const scene = window.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      spy = world.units.find(unit => unit.id === spyId)
    tick(world, 1 / 12)
    scene.onChange()
    return { disguise: spy.native?.disguise ?? 0, message: world.message }
  }, fixture.spy)
  assert.ok(disguised.disguise, JSON.stringify(disguised))
  assert.equal(disguised.message, 'Your spies are preparing their disguises.')

  // Wide viewport: native strip and separate portrait remain visible/readable with no duplicated roster.
  await page.setViewportSize({ width: 3440, height: 1440 })
  await openFollowers(page)
  const wide = await rosterSnapshot(page)
  assert.deepEqual(wide.labels, rosterLabels)
  assert.equal(await page.locator('.command-dock button[aria-label^="Select "]').count(), 0)
  assert.equal(
    await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).isVisible(),
    true
  )

  // DPR=2 smoke uses a fresh normal Mission 12 startup; no fixture is needed for layout ownership.
  const dprErrors = [],
    dprContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    }),
    dprPage = await openMissionInContext(dprContext, 12, dprErrors)
  await openFollowers(dprPage)
  const dpr = await dprPage.evaluate(() => window.devicePixelRatio)
  assert.equal(dpr, 2)
  const dprSurface = await rosterSnapshot(dprPage)
  assert.deepEqual(dprSurface.labels, rosterLabels)
  assert.equal(await dprPage.locator('.command-dock button[aria-label^="Select "]').count(), 0)
  assert.equal(
    await dprPage.getByRole('button', { name: 'Select and focus shaman', exact: true }).isVisible(),
    true
  )
  assert.deepEqual(dprErrors, [])
  await dprContext.close()

  assert.deepEqual(errors, [])
  const evidence = {
    authoredMission12: {
      followersTab: true,
      nativeRoster: rosterLabels,
      separateShamanPortrait: true,
      noDuplicateSelectionRoster: true,
      followersTabUsesActiveHfx681: true,
    },
    supportingFixture: {
      deterministicClasses: true,
      emptyPreacherCount: fixture.counts['Select preacher'],
      housedBraveCounted: true,
      counts: fixture.counts,
      population: fixture.population,
      capacity: fixture.capacity,
      checkpointRestored: true,
      shippedWarriorSelection: true,
      shippedWarriorFocus: true,
      spyAction: disguiseLabel,
      spyDisguiseStarted: true,
    },
    presentation: {
      wideViewport: [3440, 1440],
      dpr2Viewport: [1280, 720],
      dpr: 2,
      originalSurfaceRects: originalSurface.rects,
      populatedSurfaceRects: populatedSurface.rects,
      wideSurfaceRects: wide.rects,
      dprSurfaceRects: dprSurface.rects,
    },
  }
  writeFileSync(
    resolve(output, 'followers-tab-browser.json'),
    JSON.stringify(evidence, null, 2) + '\n'
  )
  console.log(
    'PASS: Followers tab keeps one native counted class roster plus separate Shaman portrait; live/empty/housed counts, checkpoint, existing selection/focus, Spy actions, wide viewport and DPR2 all pass',
    evidence
  )
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
