import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

async function entityPoint(page, collection, id) {
  return page.evaluate(
    ({ collection, id }) => {
      const scene = globalThis.testScene,
        object = scene.world[collection].find(candidate => candidate.id === id),
        bounds = scene.container.getBoundingClientRect()
      if (!object) throw new Error(`Missing ${collection} object ${id}`)
      scene.focus(object)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const mesh =
          collection === 'units'
            ? scene.unitMeshes.get(id)
            : scene.shrineMeshes.get(id)?.g,
        projected = scene.screen(mesh?.position ?? object),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        unit = collection === 'units'
      for (let dy = unit ? -24 : -140; dy <= (unit ? 24 : 60); dy += 4)
        for (let dx = unit ? -36 : -100; dx <= (unit ? 36 : 100); dx += 4) {
          const event = { clientX: center.x + dx, clientY: center.y + dy },
            person = scene.picking.pickPerson(event),
            picked = unit
              ? person
              : person !== null
                ? undefined
                : scene.pickWorldObject(event)?.id
          if (
            picked === id &&
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw new Error(`No rendered hit point for ${collection} object ${id}`)
    },
    { collection, id }
  )
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
  await page.getByRole('button', { name: 'Mission 21', exact: true }).click()
  await bindGame(page)
  await page.getByText(/mysterious, hostile land/).waitFor()

  const chargeNames = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { SPELLS } = await import('/app/world-rules.ts')
    return SPELLS.filter(
      spell =>
        spell.id !== 'convertWild' && world.manaWorld.spells[0].available & (1 << spell.model)
    ).map(spell => spell.name)
  })
  for (const name of chargeNames)
    await page.getByRole('button', { name: new RegExp(`^${name},`) }).click({ button: 'right' })

  const convertShots = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    cancelAnimationFrame(scene.frame)
    while (!world.shots.convertWild && world.turn < 1000) tick(world, 1 / 12)
    if (!world.shots.convertWild)
      throw new Error(
        `Focused Convert Wild did not charge: ${JSON.stringify({ turn: world.turn, disabled: world.manaWorld.spells[0].disabled, progress: world.manaTribes[0].spellProgress[17] })}`
      )
    world.speed = 0
    scene.focus({ x: 34, z: 83 })
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return world.shots.convertWild
  })
  await page
    .getByRole('button', { name: `Convert Wild, ${convertShots} shots`, exact: true })
    .click()
  const convertPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      point = scene.screen({ x: 34, z: 83 }),
      rect = scene.container.getBoundingClientRect()
    return {
      x: rect.left + ((point.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - point.y) * rect.height) / 2,
    }
  })
  await page.mouse.click(convertPoint.x, convertPoint.y)
  const route = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    if (world.projectiles.at(-1)?.spell !== 'convertWild')
      throw new Error('HUD did not cast Convert Wild')
    while (
      world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave').length < 2 &&
      world.turn < 1200
    )
      tick(world, 1 / 12)
    scene.focus(world.shrines.find(shrine => shrine.kind === 'flattenEffect'))
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return {
      head: world.shrines.find(shrine => shrine.kind === 'flattenEffect').id,
      people: [
        ...world.units
          .filter(unit => unit.team === 'blue' && unit.kind === 'brave')
          .slice(0, 2)
          .map(unit => unit.id),
        world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman').id,
      ],
    }
  })
  for (const [index, person] of route.people.entries()) {
    await page.keyboard.press('Escape')
    await page.evaluate(personId => {
      const scene = globalThis.testScene,
        person = scene.world.units.find(unit => unit.id === personId)
      scene.focus(person)
      scene.onChange()
    }, person)
    await page
      .getByRole('button', {
        name: index < 2 ? 'Select brave' : 'Select and focus shaman',
        exact: true,
      })
      .click()
    assert.deepEqual(
      await page.evaluate(() => globalThis.testScene.world.selected),
      [person]
    )
    const headPoint = await entityPoint(page, 'shrines', route.head)
    await page.mouse.click(headPoint.x, headPoint.y)
    const followers = await page.evaluate(async ({ headId, expected }) => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === headId)
      while (head.followers < expected && world.turn < 1951) tick(world, 1 / 12)
      return head.followers
    }, { headId: route.head, expected: index + 1 })
    assert.equal(followers, index + 1)
  }
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const sealed = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    while (world.campaignAIs[1].variables[22] !== 2 && world.turn < 1952) tick(world, 1 / 12)
    const head = world.shrines.find(shrine => shrine.kind === 'flattenEffect')
    return {
      byDeadline: world.turn <= 1952,
      state: world.campaignAIs[1].variables[22],
      latch: world.campaignAIs[1].variables[28],
      head: head ? [head.active, head.uses] : null,
      volcanoes: world.effects.filter(effect => effect.volcano).length,
      casts: world.spellCasts[0][17],
      messages: world.messages.slots.filter(Boolean).length,
    }
  })
  assert.deepEqual(
    sealed,
    {
      byDeadline: true,
      state: 2,
      latch: 1,
      head: [false, 1],
      volcanoes: 0,
      casts: 1,
      messages: 2,
    },
  )
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const sealedResolved = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    while (world.turn < 2016) tick(world, 1 / 12)
    return {
      state: world.campaignAIs[1].variables[22],
      messages: world.messages.slots.filter(Boolean).length,
      volcanoes: world.effects.filter(effect => effect.volcano).length,
    }
  })
  assert.deepEqual(sealedResolved, { state: 2, messages: 2, volcanoes: 0 })

  await page.evaluate(() => globalThis.testStore.startMission(21))
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(async () => {
    const scene = (globalThis.testScene = globalThis.testSceneRef.current),
      { tick } = await import('/app/model.ts')
    cancelAnimationFrame(scene.frame)
    while (scene.world.turn < 100) tick(scene.world, 1 / 12)
  })
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const erupted = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      { messageText } = await import('/app/messages.ts')
    while (world.turn < 1952) tick(world, 1 / 12)
    scene.onChange()
    const warning = world.messages.slots.filter(Boolean).at(-1)
    return {
      turn: world.turn,
      state: world.campaignAIs[1].variables[22],
      warning: messageText(warning.stringId),
      volcanoes: world.effects.filter(effect => effect.volcano).length,
    }
  })
  assert.deepEqual(erupted, {
    turn: 1952,
    state: 1,
    warning:
      'A fault has become unstable and sparked a massive volcano! There are still more faults on the world that can be fused with the correct spell.',
    volcanoes: 1,
  })
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const resolved = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    while (world.turn < 1984) tick(world, 1 / 12)
    return {
      state: world.campaignAIs[1].variables[22],
      volcanoes: world.effects.filter(effect => effect.volcano).length,
    }
  })
  assert.deepEqual(resolved, { state: 2, volcanoes: 1 })
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const eruptedResolved = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      { messageText } = await import('/app/messages.ts')
    while (world.turn < 2016) tick(world, 1 / 12)
    return {
      state: world.campaignAIs[1].variables[22],
      volcanoes: world.effects.filter(effect => effect.volcano).length,
      warnings: world.messages.slots.filter(
        message => message && messageText(message.stringId).startsWith('A fault has become unstable')
      ).length,
    }
  })
  assert.deepEqual(eruptedResolved, { state: 2, volcanoes: 1, warnings: 1 })

  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(20)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 21', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 21)
  await page.getByText(/mysterious, hostile land/).waitFor()
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 21 continuation, Convert Wild/totem fault seal, eruption, and checkpoint lifecycle'
  )
} finally {
  await browser.close()
}
