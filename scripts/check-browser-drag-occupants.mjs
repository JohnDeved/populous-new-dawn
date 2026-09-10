import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const trainee = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world
    const m = await import('/app/model.ts')
    cancelAnimationFrame(s.frame)
    w.manaWorld.gameFlags = 32
    w.units = w.units.filter(u => u.kind === 'shaman')
    const camp = m.addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, true)
    const u = m.addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
    w.selected = [u.id]
    m.command(w, camp)
    w.speed = 1
    for (let i = 0; i < 300 && u.entry?.person.substate !== 12; i++) m.tick(w, 1 / 12)
    if (u.entry?.person.substate !== 12) throw new Error('Training entry did not reach phase 12')
    w.speed = 0
    w.inputMask = 0
    m.setSelection(w, [])
    s.focus(camp)
    s.cameraBearing = 0
    s.updateView()
    s.onChange()
    s.animate(s.previous)
    return { id: u.id, camp: camp.id }
  })
  const drag = async () => {
    const [a, b] = await page.evaluate(async () => {
      const s = window.testScene,
        m = await import('/app/model.ts'),
        t = await import('/app/native-terrain.ts')
      const r = s.container.getBoundingClientRect()
      return [
        { x: -9, z: 39 },
        { x: 6, z: 26 },
      ].map(p => {
        const q = s.view.project(
          p,
          t.terrainPointHeight(s.world.land, m.nativePosition(s.world, p)) / 45
        )
        return { x: r.left + q.screenX, y: r.top + q.screenY }
      })
    })
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(b.x, b.y, { steps: 12 })
    await page.waitForFunction(
      () =>
        window.testScene.dragActive.value &&
        window.testScene.selectionOverlay.geometry.drawRange.count > 0
    )
    await page.mouse.up()
  }
  const orders = await page.evaluate(() => JSON.stringify(window.testScene.world.buildingOrders))
  await drag()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [trainee.id])
  assert.equal(
    await page.evaluate(() => JSON.stringify(window.testScene.world.buildingOrders)),
    orders
  )
  await page.screenshot({ path: '/private/tmp/populous-drag-trainee-entry.png' })
  await page.keyboard.press('Escape')
  await page.evaluate(async () => {
    const s = window.testScene,
      m = await import('/app/model.ts')
    s.world.speed = 1
    m.tick(s.world, 1 / 12)
    s.world.speed = 0
    s.world.inputMask = 0
    s.onChange()
  })
  assert.equal(
    await page.evaluate(
      id => window.testScene.world.units.find(u => u.id === id).entry.person.substate,
      trainee.id
    ),
    13
  )
  await drag()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
  const queued = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts')
    cancelAnimationFrame(s.frame)
    const camp = w.buildings.find(b => b.id === id)
    const people = Array.from({ length: 6 }, (_, i) =>
      m.addUnit(w, 'blue', 'brave', { x: 7 + i * 0.3, z: 33 })
    )
    w.selected = people.map(u => u.id)
    m.command(w, camp)
    w.speed = 1
    for (let i = 0; i < 300; i++) m.tick(w, 1 / 12)
    w.speed = 0
    w.inputMask = 0
    m.setSelection(w, [])
    s.onChange()
    s.animate(s.previous)
    return {
      ids: people.filter(u => u.inside === null).map(u => u.id),
      orders: JSON.stringify(w.buildingOrders),
      random: w.randomState,
    }
  }, trainee.camp)
  assert.equal(queued.ids.length, 2)
  await drag()
  assert.deepEqual(
    new Set(await page.evaluate(() => window.testScene.world.selected)),
    new Set(queued.ids)
  )
  const stable = await page.evaluate(() => {
    const w = window.testScene.world
    return { orders: JSON.stringify(w.buildingOrders), random: w.randomState }
  })
  assert.equal(stable.orders, queued.orders)
  assert.equal(stable.random, queued.random)
  await page.screenshot({ path: '/private/tmp/populous-drag-training-queue.png' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: real 3D drag selects a phase-12 entrant, excludes the phase-13 interior, selects the outside training queue and preserves native commands/RNG'
  )
} finally {
  await browser.close()
}
