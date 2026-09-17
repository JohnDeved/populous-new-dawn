import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Mission 23', exact: true }).click()
  await bindGame(page)
  if (await page.evaluate(() => !!globalThis.testScene.world.inputMask))
    await page.keyboard.press('Escape')
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)

  const headPoint = async (id, raiseCoast = false) =>
    page.evaluate(
      async ({ id, raiseCoast }) => {
        const scene = globalThis.testScene,
          world = scene.world,
          { browserPosition, cast, nativePosition, tick } = await import('/app/model.ts'),
          { createLivePerson, syncLivePersonCells } = await import('/app/live-people.ts'),
          { terrainPointHeight } = await import('/app/native-terrain.ts'),
          { worshipPositions } = await import('/app/worship.ts'),
          head = world.shrines.find(shrine => shrine.id === id)
        if (raiseCoast) {
          const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
          Object.assign(shaman, { x: 50, z: 102 })
          shaman.native = createLivePerson(world, shaman)
          shaman.native.h = terrainPointHeight(world.land, shaman.native)
          syncLivePersonCells(world)
          world.shots.bridge = 1
          world.selected = [shaman.id]
          if (!cast(world, 'bridge', { x: 61, z: 102 })) throw new Error(world.message)
          for (let turn = 0; turn < 200; turn++) tick(world, 1 / 12)
        }
        const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave'),
          [slot] = worshipPositions({
            ...nativePosition(world, head),
            angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
          })
        Object.assign(brave, browserPosition(slot))
        syncLivePersonCells(world)
        world.selected = []
        world.speed = 0
        scene.focus(head)
        scene.onChange()
        scene.animate(scene.previous)
        cancelAnimationFrame(scene.frame)
        const projected = scene.screen(head),
          rect = scene.container.getBoundingClientRect(),
          x = rect.left + ((projected.x + 1) * rect.width) / 2,
          y = rect.top + ((1 - projected.y) * rect.height) / 2
        for (let dy = -75; dy <= 0; dy += 3)
          for (let dx = -20; dx <= 20; dx += 3) {
            const event = { clientX: x + dx, clientY: y + dy }
            if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
              return event
          }
        throw new Error(`No exposed Mission 23 head ${head.id}`)
      },
      { id, raiseCoast }
    )

  const worship = async (id, raiseCoast = false) => {
    const point = await headPoint(id, raiseCoast)
    await page.getByRole('button', { name: 'Select brave', exact: true }).click()
    await page.mouse.click(point.clientX, point.clientY)
    return page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === id)
      for (let turn = 0; turn < 24 && !head.followers; turn++) tick(world, 1 / 12)
      if (!head.followers) throw new Error(`Head ${id} click did not enter live worship`)
      head.work = head.target * head.required ** 2 - 1
      for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
      return { active: head.active, uses: head.uses }
    }, id)
  }

  const unlock = await page.evaluate(() =>
    globalThis.testScene.world.shrines.find(head => head.linkedShrine).id
  )
  assert.deepEqual(await worship(unlock, true), { active: false, uses: 1 })

  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))

  assert.deepEqual(await worship(303), { active: true, uses: 1 })
  assert.deepEqual(
    await page.evaluate(() => {
      const gift = globalThis.testScene.world.effects.find(effect => effect.reward === 'mana')
      return [gift.amount, gift.recipient, gift.rewardModel, gift.phase, gift.remaining]
    }),
    [0, 0, 53, 1, 82]
  )

  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  assert.deepEqual(
    await page.evaluate(async () => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === 303),
        gift = world.effects.find(effect => effect.reward === 'mana'),
        pending = world.manaTribes[0].pending
      for (let turn = 0; world.effects.some(effect => effect.id === gift.id) && turn < 82; turn++)
        tick(world, 1 / 12)
      for (let turn = 0; turn < 4 && !head.enabled; turn++) tick(world, 1 / 12)
      head.work = head.target * head.required ** 2 - 1
      for (let turn = 0; turn < 8 && head.uses < 2; turn++) tick(world, 1 / 12)
      return {
        pending: world.manaTribes[0].pending - pending,
        repeat: [head.active, head.uses],
        second: world.effects.some(effect => effect.reward === 'mana'),
      }
    }),
    { pending: 0, repeat: [true, 2], second: true }
  )

  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(22)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 23', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 23)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )

  const settlement = await page.evaluate(async () => {
    const store = globalThis.testStore,
      scene = globalThis.testSceneRef.current,
      world = store.getWorld(),
      { tick } = await import('/app/model.ts'),
      { buildingModel } = await import('/app/building-shapes.ts')
    while (world.turn < 1500) tick(world, 1 / 12)
    store.update()
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    scene.renderer.render(scene.scene, scene.camera)
    const buildings = world.buildings
    return {
      buildings: buildings
        .map(building => [building.team, buildingModel(building), building.progress])
        .sort(),
      rendered: buildings.every(building => {
        const group = scene.buildingMeshes.get(building.id)
        return !!group && group.parent === scene.objects && group.children.some(child => child.visible)
      }),
    }
  })
  assert.deepEqual(settlement, {
    buildings: [
      ['green', 1, 1],
      ['green', 4, 1],
      ['red', 1, 1],
      ['red', 4, 1],
      ['yellow', 13, 1],
      ['yellow', 4, 1],
    ],
    rendered: true,
  })

  assert.deepEqual(errors, [])
  console.log('PASS: Mission 23 continuation, settlement cycle, linked gift, and checkpoint')
} finally {
  await browser.close()
}
