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
  port = 4317,
  missionTwoOpening =
    'Now we must face the Matak Tribe. I sense many Warriors ready to stand against us. In my vision we are aided by magic from a Stone Head. There must be a way to reach it...',
  tornadoGuidance =
    'Shaman, this Stone Head will aid you faster if you command two of your Followers to worship there.',
  tornadoInstruction =
    'Use the Tornado Spell to destroy the Enemy and their buildings before they have a chance to react.'
mkdirSync(output, { recursive: true })
let server

function screenX(value, width) {
  const product = Math.imul(width, value)
  return (product + ((product >> 31) & 0xffff)) >> 16
}
function screenY(value, height) {
  const product = (Math.imul(height, value) + Math.trunc(height / 2)) | 0
  return (product + ((product >> 31) & 0xffff)) >> 16
}
function stripWidth(width) {
  let normalized = 0x0ccc
  if (screenX(normalized, width) & 1) normalized += 0x66
  return screenX(normalized, width)
}

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

async function currentMessage(page, stringId) {
  return page.evaluate(stringId => {
    const message = window.testStore
      .getWorld()
      .messages.slots.find(candidate => candidate?.stringId === stringId)
    return message ? structuredClone(message) : null
  }, stringId)
}

async function summaryRect(page, stringId) {
  const details = page.locator('.campaign-messages details').filter({
    has: page.getByText(
      stringId === 641
        ? missionTwoOpening
        : stringId === 644
          ? tornadoGuidance
          : tornadoInstruction,
      { exact: true }
    ),
  })
  const message = await currentMessage(page, stringId)
  if (!message) throw new Error(`message ${stringId} is unavailable`)
  const rect = await details.locator('summary').evaluate(node => {
    const box = node.getBoundingClientRect(),
      style = getComputedStyle(node.parentElement)
    return {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      transitionDuration: style.transitionDuration,
    }
  })
  return { details, message, rect }
}

async function assertNativeRect(page, stringId, width, height) {
  const { details, message, rect } = await summaryRect(page, stringId),
    expected = {
      left: screenX(0x2800, width),
      top: screenY(message.position, height),
      width: stripWidth(width),
      height: screenY(message.height, height),
    }
  assert.deepEqual(
    { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    expected,
    `message ${stringId} native screen parameterization`
  )
  assert.equal(
    rect.transitionDuration,
    '0s',
    'native message positions must not have CSS wall-clock smoothing'
  )
  return { details, message, rect, expected }
}

async function closeMenu(page) {
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
}

async function freezePresentation(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
    scene.world.speed = 0
    scene.world.paused = false
  })
}

async function finishFlybyPresentation(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    if (!scene.frame) {
      scene.previous = null
      scene.frame = requestAnimationFrame(scene.animate)
    }
  })
  await page.waitForFunction(() => !(window.testStore.getWorld().inputMask & 64))
  await freezePresentation(page)
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(30_000)

  // Supporting startup acceleration only: finish Mission 1, then use the shipped Continue route.
  // Every message asserted below is produced by authored Mission 2 campaign logic.
  await page.evaluate(async () => {
    const world = window.testScene.world,
      { tick } = await import('/app/model.ts')
    world.units = world.units.filter(unit => unit.team === 'blue')
    world.turn = 31
    tick(world, 1 / 12)
    window.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 2', exact: false }).click()
  await page.waitForFunction(() => window.testStore.getWorld().outcome.level === 2)
  await page.evaluate(() => {
    const world = window.testStore.getWorld()
    world.paused = true
    world.speed = 0
  })
  await bindGame(page)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  const skipIntroduction = page.locator('.skip-introduction')
  if (await skipIntroduction.count()) await skipIntroduction.click()
  await page.waitForFunction(() => !(window.testStore.getWorld().inputMask & 64))
  await freezePresentation(page)

  // Advance only the authored simulation until the Mission 2 opening producer fires.
  const entry = await page.evaluate(async () => {
    const world = window.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    for (
      let i = 0;
      i < 200 &&
      !world.messages.slots.some(message => message?.stringId === 641 && message.flags & 0x20000);
      i++
    )
      tick(world, 1 / 12)
    const message = world.messages.slots.find(candidate => candidate?.stringId === 641)
    if (!message || !(message.flags & 0x20000))
      throw new Error(`Mission 2 opening pending-auto-open did not fire by turn ${world.turn}`)
    window.testStore.update()
    return structuredClone(message)
  })
  assert.equal(entry.flags & 0x20000, 0x20000)
  assert.equal(entry.flags & 0xc0000, 0)
  const opening = page.locator('.campaign-messages details').filter({
    has: page.getByText(missionTwoOpening, { exact: true }),
  })
  await opening.waitFor({ state: 'visible' })
  assert.equal(
    await opening.evaluate(node => node.open),
    false,
    'pending message must remain icon-only while entering'
  )
  await assertNativeRect(page, 641, 1440, 1000)
  await page.screenshot({ path: resolve(output, 'message-641-entry.png') })

  // Use the shipped 24 Hz presentation owner with simulation speed zero until native settle consumption.
  const settled = await page.evaluate(async () => {
    const scene = window.testScene,
      world = window.testStore.getWorld(),
      { advanceGame } = await import('/app/game-clock.ts')
    for (let i = 0; i < 240; i++) {
      const message = world.messages.slots.find(candidate => candidate?.stringId === 641)
      if (!(message?.flags & 0x20000)) break
      advanceGame(world, scene.gameClock, 1 / 24)
    }
    window.testStore.update()
    const message = world.messages.slots.find(candidate => candidate?.stringId === 641)
    return structuredClone(message)
  })
  assert.ok(settled.flags & 0xc0000)
  assert.equal(settled.flags & 0x20000, 0)
  await page.waitForFunction(text => {
    const details = [...document.querySelectorAll('.campaign-messages details')].find(node =>
      node.textContent.includes(text)
    )
    const message = window.testStore
      .getWorld()
      .messages.slots.find(candidate => candidate?.stringId === 641)
    return details?.open && message && !(message.flags & 2) && !(message.flags & 0x20000)
  }, missionTwoOpening)
  await assertNativeRect(page, 641, 1440, 1000)
  assert.deepEqual(
    await opening.locator('summary img').evaluate(node => {
      const rect = node.getBoundingClientRect()
      return { width: rect.width, height: rect.height, src: node.getAttribute('src') }
    }),
    { width: 25, height: 18, src: '/original/message-type1.png' }
  )
  await page.screenshot({ path: resolve(output, 'message-641-settled.png') })

  // The remaining 0x40 input gate is flyby/presentation-owned. Let the shipped
  // scene presentation release it, then freeze again before geometry assertions.
  await finishFlybyPresentation(page)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().inputMask), 0)

  // HUD preference is independent: sidebar scale changes, campaign-message geometry does not.
  const beforeHud = await assertNativeRect(page, 641, 1440, 1000),
    hudBefore = await page
      .locator('.native-hud')
      .evaluate(node => node.getBoundingClientRect().width)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption('1')
  await closeMenu(page)
  await page.waitForFunction(
    width => document.querySelector('.native-hud').getBoundingClientRect().width === width,
    100
  )
  const afterHud = await assertNativeRect(page, 641, 1440, 1000)
  assert.deepEqual(afterHud.rect, beforeHud.rect)
  assert.ok(hudBefore > 100)

  // Exact native viewport parameterization after resize, still independent of HUD preference.
  await page.setViewportSize({ width: 3440, height: 1440 })
  await page.waitForFunction(
    expected => {
      const details = [...document.querySelectorAll('.campaign-messages details')].find(node =>
          node.textContent.includes(expected.text)
        ),
        summary = details?.querySelector('summary')
      return summary && summary.getBoundingClientRect().left === expected.left
    },
    { text: missionTwoOpening, left: screenX(0x2800, 3440) }
  )
  await assertNativeRect(page, 641, 3440, 1440)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForFunction(
    left => {
      const summary = document.querySelector('.campaign-messages summary')
      return summary && summary.getBoundingClientRect().left === left
    },
    screenX(0x2800, 1440)
  )

  // A consumed record stays closed when the user closes it and after a real checkpoint reload.
  await opening.locator('summary').click()
  assert.equal(await opening.evaluate(node => node.open), false)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await freezePresentation(page)
  const restoredOpening = page.locator('.campaign-messages details').filter({
    has: page.getByText(missionTwoOpening, { exact: true }),
  })
  await restoredOpening.waitFor({ state: 'visible' })
  assert.equal(await restoredOpening.evaluate(node => node.open), false)
  const restoredState = await currentMessage(page, 641)
  assert.equal(restoredState.flags & 0x20000, 0)
  assert.equal(restoredState.flags & 2, 0)

  // Continue the same authored Mission 2 route used by the checkpoint checker to messages 644/642.
  const route = await page.evaluate(async () => {
    const world = window.testStore.getWorld(),
      { command, placeBuilding, select, setSelection, tick } = await import('/app/model.ts'),
      bridge = world.shrines.find(shrine => shrine.kind === 'bridgeEffect'),
      tornado = world.shrines.find(shrine => shrine.kind === 'tornado')
    const until = (ready, limit, label) => {
      for (let i = 0; i < limit && !ready(); i++) tick(world, 1 / 12)
      if (!ready()) throw new Error(`${label} timed out at turn ${world.turn}`)
    }
    until(() => world.turn >= 122, 200, 'Mission 2 opening state')
    select(world, 'brave')
    if (!placeBuilding(world, 'camp', { x: -99, z: -105 }))
      throw new Error('Mission 2 warrior camp placement failed')
    const camp = world.buildings.find(
      building => building.team === 'blue' && building.kind === 'camp'
    )
    until(() => camp.progress === 1, 3000, 'Mission 2 warrior camp construction')
    until(() => !world.units.some(unit => unit.builder), 1000, 'Mission 2 builders')
    setSelection(
      world,
      world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
        .slice(0, 8)
        .map(unit => unit.id)
    )
    if (!command(world, camp)) throw new Error('Mission 2 warrior training command failed')
    until(
      () =>
        world.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
          .length >= 8,
      10000,
      'Mission 2 warrior training'
    )
    select(world, 'shaman')
    if (!command(world, bridge)) throw new Error('Mission 2 Land Bridge worship command failed')
    until(() => bridge.uses === 1, 10000, 'Mission 2 Land Bridge worship')
    until(
      () => !world.effects.some(effect => effect.kind === 'bridge'),
      5000,
      'Mission 2 Land Bridge effect'
    )
    select(world, 'shaman')
    if (!command(world, tornado)) throw new Error('Mission 2 Tornado worship command failed')
    until(
      () => world.messages.slots.some(message => message?.stringId === 644),
      10000,
      'Mission 2 positioned message'
    )
    select(world, 'brave')
    if (!command(world, tornado))
      throw new Error('Mission 2 follower Tornado worship command failed')
    until(
      () => world.messages.slots.some(message => message?.stringId === 642),
      10000,
      'Mission 2 Tornado instruction'
    )
    world.speed = 0
    window.testStore.update()
    const guidance = world.messages.slots.find(message => message?.stringId === 644),
      instruction = world.messages.slots.find(message => message?.stringId === 642)
    return {
      guidance: structuredClone(guidance),
      instruction: structuredClone(instruction),
      rng: world.randomState,
    }
  })
  assert.deepEqual(
    { flags: route.guidance.flags, lifetime: route.guidance.lifetime, view: route.guidance.view },
    { flags: 0x36f1, lifetime: 3000, view: { cell: 0x60cc, payload: 308 } }
  )
  assert.equal(route.instruction.flags, 0x2d1)

  const positioned = page.locator('.campaign-messages details').filter({
      has: page.getByText(tornadoGuidance, { exact: true }),
    }),
    instruction = page.locator('.campaign-messages details').filter({
      has: page.getByText(tornadoInstruction, { exact: true }),
    })
  await positioned.waitFor({ state: 'visible' })
  await instruction.waitFor({ state: 'visible' })
  await finishFlybyPresentation(page)
  const rngBeforeInteraction = await page.evaluate(() => window.testStore.getWorld().randomState)
  await positioned.locator('summary').click()
  await page.getByText(tornadoGuidance, { exact: true }).waitFor()
  assert.deepEqual(
    await page.evaluate(() => {
      const { target } = window.testScene.cameraMotion
      return { x: target.x, y: target.y }
    }),
    { x: 0xcd00, y: 0x6100 }
  )
  await page.screenshot({ path: resolve(output, 'message-644-authored.png') })
  await positioned.getByRole('button', { name: 'Dismiss campaign message', exact: true }).click()
  assert.equal(await currentMessage(page, 644), null)
  assert.equal(
    await page.evaluate(() => window.testStore.getWorld().randomState),
    rngBeforeInteraction
  )

  await instruction.locator('summary').click()
  await page.getByText(tornadoInstruction, { exact: true }).waitFor()
  await page.screenshot({ path: resolve(output, 'message-642-authored.png') })

  assert.deepEqual(errors, [])
  const evidence = {
    baseRoute:
      'Mission 1 completion acceleration -> shipped Continue to Mission 2; all asserted messages are authored Mission 2 producers',
    authored: {
      opening641: { entryPending: true, settledAutoOpen: true, checkpointDoesNotReopen: true },
      positioned644: {
        focus: { x: 0xcd00, y: 0x6100 },
        dismissed: true,
        rngUnchangedByInteraction: true,
      },
      instruction642: { authored: true },
    },
    presentation: {
      noCssTopTransition: true,
      nativeScreenParameterization: true,
      hudPreferenceIndependent: true,
      viewports: [
        [1440, 1000],
        [3440, 1440],
      ],
      hudSizes: ['auto', '1'],
    },
    rapidStackFixture: 'not used; max-one pending consumption is owned by focused portable tests',
    screenshots: [
      'message-641-entry.png',
      'message-641-settled.png',
      'message-644-authored.png',
      'message-642-authored.png',
    ],
  }
  writeFileSync(
    resolve(output, 'campaign-message-presentation.json'),
    JSON.stringify(evidence, null, 2) + '\n'
  )
  console.log(
    'PASS: authored Mission 2 campaign messages use native settle-gated auto-open and viewport geometry; focus, dismissal, checkpoint and HUD-size independence pass',
    evidence
  )
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
