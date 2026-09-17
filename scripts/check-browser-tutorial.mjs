import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, settleView } from './browser-game.mjs'

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
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 2)
  assert.equal(await page.locator('.world-message').count(), 0)
  assert.deepEqual(
    await page.evaluate(() => ({
      level: window.testScene.world.outcome.level,
      drawMode: window.testScene.world.drawMode,
      overview: window.testScene.overviewActive,
      stage: window.testScene.world.ai.variables[9],
      rendered: window.testScene.world.units.every(unit => window.testScene.unitMeshes.has(unit.id)),
    })),
    { level: 79, drawMode: 2, overview: true, stage: 2, rendered: true }
  )
  await page.keyboard.press('Enter')
  await settleView(page)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 3)
  const nextLesson = page
    .locator('.campaign-messages')
    .getByText(/Move the mouse pointer to the edge/)
  await nextLesson.waitFor()
  assert.equal(await nextLesson.count(), 1)
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
  const returned = await page.evaluate(() => window.testScene.cameraPosition.angle)
  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(angle => window.testScene.cameraPosition.angle !== angle, returned)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quit to Main Menu', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Save checkpoint', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Quit to Main Menu', exact: true }).click()
  await page.getByRole('heading', { name: 'Choose your world', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: Tutorial camera, Shaman selection, Obelisk transition, and normal exit')
} finally {
  await browser.close()
}
