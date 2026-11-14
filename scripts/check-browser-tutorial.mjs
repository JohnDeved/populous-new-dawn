import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, settleView } from './browser-game.mjs'

// Wait until no message is still pending its one-shot auto-open (0x20000 / 2), then
// close whatever is open through one ordinary Enter press. Fails if Enter leaves any
// message open, reaches overview, or dismisses (removes) a message.
async function closeOpenMessagesWithEnter(page) {
  await page.waitForFunction(() =>
    window.testScene.world.messages.slots.every(message => !message || !(message.flags & 0x20002))
  )
  const open = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.campaign-messages details[open] > div > p')].map(
        paragraph => paragraph.textContent
      )
    )
  const closed = await open(),
    serials = await page.evaluate(() =>
      window.testScene.world.messages.slots.filter(Boolean).map(message => message.serial)
    )
  if (closed.length) await page.keyboard.press('Enter')
  assert.deepEqual(await open(), [], 'one Enter press closes every open campaign message')
  assert.deepEqual(
    await page.evaluate(() =>
      window.testScene.world.messages.slots.filter(Boolean).map(message => message.serial)
    ),
    serials,
    'closing with Enter keeps messages in the notification strip'
  )
  const after = await page.evaluate(() => ({
    drawMode: window.testScene.world.drawMode,
    overview: window.testScene.overviewActive,
    overviewStage: window.testScene.overviewStage,
    stage: window.testScene.world.ai.variables[9],
  }))
  return { closed, after }
}

// #1046: an open campaign message box is modal like the original. 004af640 pauses
// the game (the ordinary "Paused" state) and replaces every simulation turn;
// cursor keys, zoom, bookmarks, the screen edge and world/HUD presses do nothing.
const artifacts = process.env.POPULOUS_TUTORIAL_ARTIFACTS
async function modalState(page) {
  return page.evaluate(() => {
    const scene = window.testScene,
      world = scene.world
    return {
      open: [...document.querySelectorAll('.campaign-messages details[open] > div > p')].map(
        paragraph => paragraph.textContent
      ),
      paused: world.paused,
      messageModal: scene.messageModal,
      pauseStatus: !!document.querySelector('[data-original-pause-status]'),
      turn: world.turn,
      selected: [...world.selected],
      camera: { ...scene.cameraPosition, zoom: scene.viewZoom, preset: scene.viewPreset },
      focused: document.activeElement?.closest?.('.campaign-messages details')?.dataset.messageSerial ?? null,
    }
  })
}
async function waitForOpenBox(page, pattern) {
  await page
    .locator('.campaign-messages details[open] > div > p')
    .filter({ hasText: pattern })
    .waitFor()
  // The page pauses in the same commit that opens the box.
  await page.waitForFunction(() => window.testScene.messageModal && window.testScene.world.paused)
  const state = await modalState(page)
  assert.equal(state.open.length, 1, `exactly one open message box: ${JSON.stringify(state.open)}`)
  assert.match(state.open[0], pattern)
  assert.deepEqual(
    { paused: state.paused, messageModal: state.messageModal, pauseStatus: state.pauseStatus },
    { paused: true, messageModal: true, pauseStatus: true },
    'an open box pauses the game and shows the original Paused status'
  )
  return state
}
async function screenshot(page, name) {
  if (artifacts) await page.screenshot({ path: `${artifacts}/${name}.png` })
}

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
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click()
  await bindGame(page)
  await settleView(page)
  // Stage 0 emits the type-1 welcome message 17 and stage 1 the World View lesson
  // 137 (tutorial-first-lesson.md). Each auto-opens as the original modal box,
  // which pauses the game until it closes, so the stages advance one box at a time.
  const welcomeBox = await waitForOpenBox(page, /Welcome to Populous/)
  assert.equal(await page.locator('.world-message').count(), 0)
  assert.deepEqual(
    await page.evaluate(() => ({
      level: window.testScene.world.outcome.level,
      drawMode: window.testScene.world.drawMode,
      overview: window.testScene.overviewActive,
      stage: window.testScene.world.ai.variables[9],
      rendered: window.testScene.world.units.every(unit => window.testScene.unitMeshes.has(unit.id)),
    })),
    { level: 79, drawMode: 2, overview: true, stage: 1, rendered: true }
  )
  await page.waitForTimeout(700)
  const frozen = await modalState(page)
  assert.deepEqual(
    { turn: frozen.turn, open: frozen.open },
    { turn: welcomeBox.turn, open: welcomeBox.open },
    'no simulation turn and no further lesson runs under the box'
  )
  await screenshot(page, 'tutorial-welcome-box-paused')
  // Original 004a9d90: while the auto-opened lesson box is shown (0089bb81 = 2/3),
  // the only key that passes is an Enter press, which closes it (process_cmd 0xb0)
  // without leaving World View. The next ordinary Enter is the lesson's overview exit.
  const welcome = await closeOpenMessagesWithEnter(page)
  assert.deepEqual(welcome.after, { drawMode: 2, overview: true, overviewStage: null, stage: 1 })
  assert.deepEqual(
    await page.evaluate(() => ({ paused: window.testScene.world.paused, modal: window.testScene.messageModal })),
    { paused: false, modal: false },
    'closing the box resumes the game'
  )
  await page.waitForFunction(turn => window.testScene.world.turn > turn, welcomeBox.turn)
  await waitForOpenBox(page, /World View/i)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 2)
  const lesson = await closeOpenMessagesWithEnter(page)
  assert.ok(lesson.closed.length > 0, 'the World View lesson opens automatically')
  assert.ok(
    lesson.closed.some(text => /World View/i.test(text)),
    `the closed lesson is the World View instruction: ${JSON.stringify(lesson.closed)}`
  )
  assert.deepEqual(lesson.after, { drawMode: 2, overview: true, overviewStage: null, stage: 2 })
  await page.keyboard.press('Enter')
  await settleView(page)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 3)
  const nextLesson = page
    .locator('.campaign-messages')
    .getByText(/Move the mouse pointer to the edge/)
  await nextLesson.waitFor()
  assert.equal(await nextLesson.count(), 1)
  // Under the open box every camera and world input is refused (004aa532 skips the
  // held camera list and the screen edge; 004aa1c0 passes only the box's release).
  const edgeBox = await waitForOpenBox(page, /Move the mouse pointer to the edge/)
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowLeft')
  for (const key of ['+', '-', 'z', 'Space', 'Escape', '1']) await page.keyboard.press(key)
  await page.mouse.move(800, 500)
  await page.mouse.wheel(0, -400)
  await page.mouse.click(800, 500)
  await page.mouse.click(800, 500, { button: 'right' })
  await page.mouse.move(1439, 500)
  await page.waitForTimeout(400)
  await page.mouse.move(800, 500)
  await page.getByRole('button', { name: 'Resume game', exact: true }).click({ force: true })
  await page.waitForTimeout(300)
  const refused = await modalState(page)
  assert.deepEqual(
    { ...refused, focused: null },
    { ...edgeBox, focused: null },
    'camera keys, zoom, bookmark, Space, Escape, number row, wheel, edge, world and HUD presses do nothing'
  )
  assert.equal(await page.locator('dialog[data-original-pause-menu][open]').count(), 0)
  await screenshot(page, 'tutorial-edge-lesson-box-refuses-input')
  // Collapse by clicking the summary. It keeps focus: the focus edge case below.
  await page
    .locator('.campaign-messages details[open]')
    .locator('summary[aria-label="Read campaign message"]')
    .click()
  await page.waitForFunction(() => !window.testScene.messageModal && !window.testScene.world.paused)
  const staleSummary = await page.evaluate(() =>
    document.activeElement?.matches('summary')
      ? document.activeElement.closest('details').dataset.messageSerial
      : null
  )
  assert.ok(staleSummary !== null, 'the collapsed summary keeps focus after the click')
  await page.mouse.move(800, 500)
  const start = await page.evaluate(() => ({ ...window.testScene.cameraPosition }))
  await page.keyboard.down('ArrowLeft')
  await page.waitForFunction(angle => window.testScene.cameraPosition.angle !== angle, start.angle)
  await page.keyboard.up('ArrowLeft')
  const rotated = await page.evaluate(() => ({ ...window.testScene.cameraPosition }))
  await page.mouse.move(1439, 500)
  await page.waitForFunction(x => window.testScene.cameraPosition.x !== x, rotated.x)
  await page.mouse.move(800, 500)
  await page.waitForFunction(
    () =>
      window.testScene.world.ai.variables[9] === 4 &&
      !!(window.testScene.world.flyby.flags & 1) &&
      !!(window.testScene.world.inputMask & 64)
  )
  assert.deepEqual(
    await page.evaluate(() => ({
      stage: window.testScene.world.ai.variables[9],
      flybyActive: !!(window.testScene.world.flyby.flags & 1),
      inputLocked: !!(window.testScene.world.inputMask & 64),
    })),
    { stage: 4, flybyActive: true, inputLocked: true }
  )
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 5)
  await page
    .locator('.campaign-messages')
    .getByText(/Left-click on the Shaman directly/)
    .waitFor()
  // Focus edge case: the new box opened while the old summary held focus. Enter
  // must close the new box, not reopen the old message.
  const shamanBox = await waitForOpenBox(page, /Left-click on the Shaman directly/)
  assert.equal(shamanBox.focused, null, 'the stale summary no longer holds focus')
  await page.keyboard.press('Enter')
  const afterShamanBox = await modalState(page)
  assert.deepEqual(
    { open: afterShamanBox.open, paused: afterShamanBox.paused, modal: afterShamanBox.messageModal },
    { open: [], paused: false, modal: false },
    'Enter closes the new box and does not reopen the old message'
  )
  assert.equal(
    await page.evaluate(() =>
      window.testScene.world.shrines.some(shrine => shrine.name === 'Obelisk')
    ),
    false
  )
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 6)
  await page.waitForFunction(() => {
    const scene = window.testScene,
      obelisk = scene.world.shrines.find(shrine => shrine.name === 'Obelisk')
    return !!obelisk && scene.shrineMeshes.has(obelisk.id)
  })
  assert.deepEqual(
    await page.evaluate(() => {
      const scene = window.testScene,
        trigger = scene.world.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger'),
        obelisk = scene.world.shrines.find(shrine => shrine.name === 'Obelisk')
      return {
        stage: scene.world.ai.variables[9],
        inputLocked: !!(scene.world.inputMask & 64),
        flybyActive: !!(scene.world.flyby.flags & 1),
        triggerRendered: !!trigger && scene.shrineMeshes.has(trigger.id),
        obeliskRendered: !!obelisk && scene.shrineMeshes.has(obelisk.id),
        obeliskPosition: obelisk && [obelisk.x, obelisk.z],
      }
    }),
    {
      stage: 6,
      inputLocked: true,
      flybyActive: true,
      triggerRendered: false,
      obeliskRendered: true,
      obeliskPosition: [-33, -49],
    }
  )
  await page.waitForFunction(
    () => !(window.testScene.world.flyby.flags & 1) && !(window.testScene.world.inputMask & 64)
  )
  const shaman = await page.evaluate(() => {
    const scene = window.testScene,
      unit = scene.world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      mesh = unit && scene.unitMeshes.get(unit.id)
    if (!unit || !mesh?.userData.bounds) throw new Error('Authored Blue Shaman is not rendered')
    const rect = scene.container.getBoundingClientRect(),
      point = scene.unitScreen(unit.id),
      bounds = mesh.userData.bounds
    return {
      id: unit.id,
      x: rect.left + ((point.x + 1) * rect.width) / 2 + (bounds.left + bounds.right) / 2,
      y: rect.top + ((1 - point.y) * rect.height) / 2 + (bounds.top + bounds.bottom) / 2,
    }
  })
  await page.mouse.click(shaman.x, shaman.y, { button: 'right' })
  await page.waitForFunction(() => !window.testScene.world.selected.length)
  await page.mouse.click(shaman.x, shaman.y)
  await page.waitForFunction(id => window.testScene.world.selected.includes(id), shaman.id)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 9)
  await page
    .locator('.campaign-messages')
    .getByText(/Worshipping Obelisks benefit you/)
    .waitFor()
  // One box: opening an older message from the strip replaces the open box.
  await waitForOpenBox(page, /Worshipping Obelisks benefit you/)
  await page
    .locator('.campaign-messages details')
    .filter({ hasText: /Left-click on the Shaman directly/ })
    .locator('summary')
    .click()
  await page.waitForFunction(
    () => document.querySelectorAll('.campaign-messages details[open]').length === 1
  )
  const switched = await waitForOpenBox(page, /Left-click on the Shaman directly/)
  await screenshot(page, 'tutorial-single-box-after-switch')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => !window.testScene.messageModal && !window.testScene.world.paused)
  assert.deepEqual((await modalState(page)).open, [], 'Enter on the switched box closes it')
  assert.equal(switched.paused, true)
  const obelisk = await page.evaluate(() => {
    const scene = window.testScene,
      shrine = scene.world.shrines.find(candidate => candidate.name === 'Obelisk'),
      projected = shrine && scene.screen(shrine),
      bounds = scene.container.getBoundingClientRect()
    if (!shrine || !projected) throw new Error('Authored Tutorial Obelisk is unavailable')
    const x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - projected.y) * bounds.height) / 2
    for (let dy = -60; dy <= 60; dy += 3)
      for (let dx = -60; dx <= 60; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === shrine.id
        )
          return { id: shrine.id, x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Tutorial Obelisk geometry')
  })
  await page.mouse.click(obelisk.x, obelisk.y)
  await page.waitForFunction(
    ({ shrine, person }) => {
      const world = window.testScene.world,
        shaman = world.units.find(unit => unit.id === person)
      return shaman?.work === shrine
    },
    { shrine: obelisk.id, person: shaman.id }
  )
  const worship = await page.evaluate(async id => {
    const world = window.testScene.world,
      shrine = world.shrines.find(candidate => candidate.id === id),
      { tick } = await import('/app/model.ts')
    for (let turn = 0; shrine.rewardDelay !== 50 && turn < 2_000; turn++) tick(world, 1 / 12)
    if (shrine.rewardDelay !== 50) throw new Error('Tutorial Obelisk worship timed out')
    const countdownTurn = world.turn
    for (let turn = 0; shrine.active && turn < 64; turn++) tick(world, 1 / 12)
    return {
      active: shrine.active,
      countdown: world.turn - countdownTurn,
      uses: shrine.uses,
    }
  }, obelisk.id)
  assert.deepEqual(worship, { active: false, countdown: 50, uses: 1 })
  // An open lesson box also swallows cursor keys and Escape in the original;
  // close it with Enter first.
  const beforeExit = await closeOpenMessagesWithEnter(page)
  assert.equal(beforeExit.after.overview, false, 'closing Enter does not enter World View')
  const returned = await page.evaluate(() => window.testScene.cameraPosition.angle)
  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(angle => window.testScene.cameraPosition.angle !== angle, returned)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('Escape')
  // The Tutorial Game menu has no Load/Save/Restart/Quit Level rows.
  const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
  await menu.waitFor()
  assert.deepEqual(
    await menu.locator('nav button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label'))),
    ['Continue Game', 'Options', 'Quit Game', 'Back']
  )
  await menu.getByRole('button', { name: 'Quit Game', exact: true }).click()
  await menu.getByRole('button', { name: 'Yes', exact: true }).click()
  await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
  assert.equal(await page.locator('.world-viewport canvas').count(), 0)
  assert.deepEqual(errors, [])
  console.log('Closed with Enter:', JSON.stringify({ welcome: welcome.closed, lesson: lesson.closed, beforeExit: beforeExit.closed }))
  console.log('PASS: Tutorial modal lesson boxes (pause, refused input, focus edge, one box), Enter-closes-lesson, camera, Shaman selection, Obelisk worship, and normal exit')
} finally {
  await browser.close()
}
