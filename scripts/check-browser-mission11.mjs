import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(20_000)
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(10)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 11', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 11)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page.getByText('Once again we must face two tribes.', { exact: false }).waitFor()

  const opening = await page.evaluate(() => {
    const scene = globalThis.testScene,
      world = scene.world
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      level: world.outcome.level,
      teams: Object.fromEntries(
        ['blue', 'green', 'yellow', 'wild'].map(team => [
          team,
          world.units.filter(unit => unit.team === team).length,
        ])
      ),
      sites: world.shrines.map(shrine => [shrine.kind, shrine.reward]),
      siteMeshes: world.shrines.filter(shrine => {
        const group = scene.shrineMeshes.get(shrine.id)?.g
        return (
          group?.visible &&
          group.parent === scene.objects &&
          group.children.some(child => child.visible)
        )
      }).length,
      selected: world.units.find(unit => world.selected.includes(unit.id))?.kind,
      meshes: world.units.filter(unit => scene.unitMeshes.get(unit.id)?.visible).length,
    }
  })
  assert.equal(opening.level, 11)
  assert.deepEqual(
    { blue: opening.teams.blue, green: opening.teams.green, yellow: opening.teams.yellow },
    { blue: 7, green: 7, yellow: 7 }
  )
  assert.ok(opening.teams.wild >= 150, JSON.stringify(opening))
  assert.deepEqual(opening.sites, [
    ['vault', 'hypnotise'],
    ['vault', 'swamp'],
    ['flatten', 'flatten'],
    ['swamp', 'swamp'],
  ])
  assert.equal(opening.siteMeshes, 4)
  assert.equal(opening.selected, 'shaman')
  assert.equal(
    opening.meshes,
    Object.values(opening.teams).reduce((sum, count) => sum + count, 0)
  )

  await page.getByLabel('Menu', { exact: true }).click()
  await page
    .getByText('Explore the Hypnotise, Swamp, and Flatten knowledge sites', { exact: false })
    .waitFor()
  assert.equal(await page.locator('.menu-objectives').count(), 0)
  await page.getByLabel('Close menu').click()

  const order = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { supportsFollower } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      bounds = scene.container.getBoundingClientRect()
    scene.focus(shaman)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    for (let radius = 4; radius <= 12; radius += 2)
      for (let step = 0; step < 16; step++) {
        const angle = (step * Math.PI) / 8,
          target = {
            x: shaman.x + Math.cos(angle) * radius,
            z: shaman.z + Math.sin(angle) * radius,
          }
        if (!supportsFollower(world, target)) continue
        const projected = scene.screen(target),
          point = {
            x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          },
          picked = scene.pick({ clientX: point.x, clientY: point.y })
        if (picked && Math.hypot(picked.x - shaman.x, picked.z - shaman.z) > 3)
          return { id: shaman.id, before: [shaman.x, shaman.z], point }
      }
    throw new Error('No exposed Mission 11 movement destination')
  })
  await page.mouse.click(order.point.x, order.point.y)
  const moved = await page.evaluate(async ({ id, before }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.id === id)
    for (
      let turn = 0;
      Math.hypot(shaman.x - before[0], shaman.z - before[1]) < 0.5 && turn < 240;
      turn++
    )
      tick(world, 1 / 12)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      distance: Math.hypot(shaman.x - before[0], shaman.z - before[1]),
      visible: scene.unitMeshes.get(id)?.visible,
    }
  }, order)
  assert.ok(moved.distance >= 0.5, JSON.stringify(moved))
  assert.equal(moved.visible, true)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 10 continues to rendered Mission 11 with both enemy tribes, four knowledge sites, opening message and real movement input'
  )
} finally {
  await browser.close()
}
