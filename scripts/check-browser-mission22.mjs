import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

async function terrainClickPoint(page, target, spell = null, affected = null) {
  return page.evaluate(async ({ point, spell, affected }) => {
    const scene = globalThis.testScene,
      { spellTargetError } = await import('/app/live-command.ts'),
      { nativePosition } = await import('/app/model.ts'),
      { spiralCell } = await import('/app/native-math.ts'),
      required = scene.world.units.find(unit => unit.id === affected)
    scene.focus(point)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(point),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let radius = 0; radius <= 50; radius += 2)
      for (let step = 0; step < 16; step++) {
        const screen = {
            x: center.x + Math.cos((step * Math.PI) / 8) * radius,
            y: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          event = { clientX: screen.x, clientY: screen.y },
          picked = scene.pick(event),
          nativeCenter = picked && nativePosition(scene.world, picked),
          centerCell =
            nativeCenter && ((nativeCenter.y & 0xfe00) | ((nativeCenter.x >>> 8) & 254)),
          affectedCells = centerCell === null || centerCell === undefined
            ? null
            : new Set([centerCell, ...Array.from({ length: 7 }, (_, i) => spiralCell(centerCell, i, 0))]),
          requiredNative = required && nativePosition(scene.world, required),
          requiredCell =
            requiredNative && ((requiredNative.y & 0xfe00) | ((requiredNative.x >>> 8) & 254))
        if (
          picked &&
          document.elementFromPoint(screen.x, screen.y) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
          !scene.pickWorldObject(event) &&
          Math.hypot(picked.x - point.x, picked.z - point.z) < (required ? 4 : 2) &&
          (!required || affectedCells.has(requiredCell)) &&
          (!spell || !spellTargetError(scene.world, spell, picked))
        )
          return { ...screen, picked }
      }
    throw new Error(`No exposed terrain target near ${JSON.stringify(point)}`)
  }, { point: target, spell, affected })
}

async function shrineClickPoint(page, shrineId) {
  return page.evaluate(id => {
    const scene = globalThis.testScene,
      shrine = scene.world.shrines.find(candidate => candidate.id === id)
    scene.focus(shrine)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(shrine),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    scene.picking.lastKey = ''
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: center.x + dx, clientY: center.y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No exposed stone-head geometry for ${id}`)
  }, shrineId)
}

async function vehicleClickPoint(page, vehicleId) {
  return page.evaluate(async id => {
    const scene = globalThis.testScene,
      vehicle = scene.world.vehicles.find(candidate => candidate.id === id),
      { browserPosition } = await import('/app/model.ts')
    scene.focus(browserPosition(vehicle))
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.view.screen(scene.vehicleMeshes.get(id).position, scene.camera),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    scene.picking.lastKey = ''
    for (let dy = -100; dy <= 40; dy += 3)
      for (let dx = -50; dx <= 50; dx += 3) {
        const event = { clientX: center.x + dx, clientY: center.y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
          scene.pickWorldObject(event)?.id === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No exposed vehicle geometry for ${id}`)
  }, vehicleId)
}

async function focusSpell(page, id, name) {
  const charging = await page.evaluate(async selected => {
    const world = globalThis.testScene.world,
      stock = world.manaWorld.spells[0],
      { SPELLS } = await import('/app/world-rules.ts'),
      spell = SPELLS.find(candidate => candidate.id === selected)
    return {
      enableSelected: !!(stock.disabled & (1 << (spell.model - 1))),
      otherNames: SPELLS.filter(
        candidate =>
          candidate.id !== selected &&
          stock.available & (1 << candidate.model) &&
          !(stock.disabled & (1 << (candidate.model - 1)))
      ).map(candidate => candidate.name),
    }
  }, id)
  for (const other of charging.otherNames)
    await page.getByRole('button', { name: new RegExp(`^${other},`) }).click({ button: 'right' })
  if (charging.enableSelected)
    await page.getByRole('button', { name: new RegExp(`^${name},`) }).click({ button: 'right' })
  return page.evaluate(async selected => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    cancelAnimationFrame(scene.frame)
    for (let turn = 0; !world.shots[selected] && turn < 15_000; turn++) tick(world, 1 / 12)
    if (!world.shots[selected])
      throw new Error(
        `${selected} did not charge: ${JSON.stringify({ turn: world.turn, disabled: world.manaWorld.spells[0].disabled, available: world.manaTribes[0].available, progress: world.manaTribes[0].spellProgress, stocks: world.manaWorld.spells[0].stocks })}`
      )
    world.speed = 0
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return world.shots[selected]
  }, id)
}

async function moveShaman(page, target) {
  const click = await terrainClickPoint(page, target)
  await page.mouse.click(click.x, click.y)
  await page.evaluate(async point => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - point.x, shaman.z - point.z) >= 2 && turn < 1_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - point.x, shaman.z - point.z) >= 2)
      throw new Error(`Shaman failed to reach ${JSON.stringify(point)}`)
  }, click.picked)
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
  await page.getByRole('button', { name: 'Mission 22', exact: true }).click()
  await bindGame(page)
  await page.getByText(/None of my followers could accompany me/).waitFor()
  assert.deepEqual(
    await page.evaluate(() =>
      globalThis.testScene.world.units
        .filter(unit => unit.team === 'blue')
        .map(unit => unit.kind)
    ),
    ['shaman']
  )

  await page.evaluate(() => {
    globalThis.testStore.startMission(22)
    globalThis.testStore.getWorld().speed = 0
  })
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))

  await focusSpell(page, 'bridge', 'Land Bridge')
  const bridgePoint = await terrainClickPoint(page, { x: -29, z: -49 }, 'bridge')
  await page.getByRole('button', { name: /Land Bridge, [1-9] shots/ }).click()
  await page.mouse.click(bridgePoint.x, bridgePoint.y)
  const manaHead = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      head = world.shrines.find(shrine => shrine.kind === 'mana' && shrine.rewardMana === 600_000)
    for (let turn = 0; (shaman.casting || world.effects.some(effect => effect.bridge)) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)
    for (let turn = 0; world.inputMask && turn < 2_000; turn++) tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return head.id
  })
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const headPoint = await shrineClickPoint(page, manaHead)
  await page.mouse.click(headPoint.x, headPoint.y)
  const worshipped = await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === id),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      for (let turn = 0; head.rewardDelay !== 50 && turn < 500; turn++) tick(world, 1 / 12)
      return {
        rewardDelay: head.rewardDelay,
        active: head.active,
        uses: head.uses,
        followers: head.followers,
        shaman: [shaman.x, shaman.z, shaman.hp, shaman.native?.state],
        message: world.message,
      }
    }, manaHead)
  assert.equal(worshipped.rewardDelay, 50, JSON.stringify(worshipped))
  assert.deepEqual([worshipped.active, worshipped.uses], [true, 0], JSON.stringify(worshipped))
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  assert.deepEqual(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === id)
      for (let turn = 0; !world.effects.some(effect => effect.reward === 'mana') && turn < 60; turn++)
        tick(world, 1 / 12)
      const gift = world.effects.find(effect => effect.reward === 'mana'),
        giftState = [gift.amount, gift.recipient, gift.rewardModel, gift.phase]
      for (let turn = 0; world.effects.some(effect => effect.id === gift.id) && turn < 90; turn++)
        tick(world, 1 / 12)
      return {
        head: [head.active, head.uses],
        gift: giftState,
        pending: world.manaTribes[0].pending >= 590_000,
      }
    }, manaHead),
    { head: [false, 1], gift: [600_000, 0, 5, 1], pending: true }
  )

  await page.evaluate(() => {
    globalThis.testStore.startMission(22)
    globalThis.testStore.getWorld().speed = 0
  })
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  await focusSpell(page, 'swarm', 'Swarm')
  await moveShaman(page, { x: 0, z: -45 })
  await moveShaman(page, { x: 20, z: -45 })
  const guardId = await page.evaluate(() => {
    const world = globalThis.testScene.world
    return world.units
      .filter(unit => unit.team === 'red' && unit.kind === 'warrior')
      .sort(
        (a, b) =>
          Math.hypot(a.x - 31.4453125, a.z + 31.4453125) -
          Math.hypot(b.x - 31.4453125, b.z + 31.4453125)
      )[0].id
  })
  const swarmPoint = await terrainClickPoint(page, { x: 27, z: -27 }, 'swarm', guardId)
  await page.getByRole('button', { name: /^Swarm, [1-9] shots$/ }).click()
  await page.mouse.click(swarmPoint.x, swarmPoint.y)
  const boatId = await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.effects.some(effect => effect.swarm?.applied) && turn < 100; turn++)
      tick(world, 1 / 12)
    if (!world.effects.some(effect => effect.swarm?.applied)) throw new Error('Rendered Swarm missed')
    return world.vehicles.find(vehicle => vehicle.model === 1).id
  })
  const boatPoint = await vehicleClickPoint(page, boatId)
  await page.mouse.click(boatPoint.x, boatPoint.y)
  const boarded = await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        boat = world.vehicles.find(vehicle => vehicle.id === id),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      for (let turn = 0; !boat.passengerCount && shaman.hp > 0 && turn < 500; turn++)
        tick(world, 1 / 12)
      return {
        result: [boat.team, boat.passengerCount, shaman.hp, shaman.native?.vehicle],
        shaman: [shaman.x, shaman.z, shaman.native?.state],
        enemies: world.units
          .filter(unit => unit.team === 'red' && unit.kind === 'warrior' && unit.hp > 0)
          .map(unit => [unit.id, unit.x, unit.z, unit.native?.state]),
        message: world.message,
        turn: world.turn,
      }
    }, boatId)
  assert.deepEqual(boarded.result, ['blue', 1, 100, boatId], JSON.stringify(boarded))
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const landing = await terrainClickPoint(page, { x: -25, z: -63 })
  await page.mouse.click(landing.x, landing.y)
  assert.deepEqual(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        boat = world.vehicles.find(vehicle => vehicle.id === id),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      for (let turn = 0; boat.passengerCount && turn < 2_000; turn++) tick(world, 1 / 12)
      return [boat.team, boat.passengerCount, shaman.hp, shaman.native?.vehicle]
    }, boatId),
    ['blue', 0, 100, 0]
  )

  const southernHeadId = await page.evaluate(() =>
    globalThis.testScene.world.shrines.find(shrine => shrine.rewardMana === 600_000).id
  )
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const southernHead = await shrineClickPoint(page, southernHeadId)
  await page.mouse.click(southernHead.x, southernHead.y)
  assert.equal(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === id)
      for (let turn = 0; head.uses !== 1 && turn < 700; turn++) tick(world, 1 / 12)
      return head.uses
    }, southernHeadId),
    1
  )
  await focusSpell(page, 'bridge', 'Land Bridge')
  await focusSpell(page, 'swarm', 'Swarm')

  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const returnBoat = await vehicleClickPoint(page, boatId)
  await page.mouse.click(returnBoat.x, returnBoat.y)
  assert.equal(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        boat = world.vehicles.find(vehicle => vehicle.id === id)
      for (let turn = 0; !boat.passengerCount && turn < 500; turn++) tick(world, 1 / 12)
      return boat.passengerCount
    }, boatId),
    1
  )
  const balloonShore = await terrainClickPoint(page, { x: -83, z: -57 })
  await page.mouse.click(balloonShore.x, balloonShore.y)
  assert.equal(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        boat = world.vehicles.find(vehicle => vehicle.id === id)
      for (let turn = 0; boat.passengerCount && turn < 2_000; turn++) tick(world, 1 / 12)
      return boat.passengerCount
    }, boatId),
    0
  )

  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const balloonBridge = await terrainClickPoint(page, { x: -83, z: -69 }, 'bridge')
  await page.getByRole('button', { name: /Land Bridge, [1-9] shots/ }).click()
  await page.mouse.click(balloonBridge.x, balloonBridge.y)
  const balloonId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (let turn = 0; shaman.casting && turn < 100; turn++) tick(world, 1 / 12)
    for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return world.vehicles.find(vehicle => vehicle.model === 3).id
  })
  const balloonPoint = await vehicleClickPoint(page, balloonId)
  await page.mouse.click(balloonPoint.x, balloonPoint.y)
  assert.deepEqual(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === id),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      for (let turn = 0; !balloon.passengerCount && turn < 1_000; turn++) tick(world, 1 / 12)
      return [balloon.team, balloon.passengerCount, shaman.native?.vehicle]
    }, balloonId),
    ['blue', 1, balloonId]
  )
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))

  const northernLanding = await terrainClickPoint(page, { x: 55, z: 121 })
  await page.mouse.click(northernLanding.x, northernLanding.y)
  assert.equal(
    await page.evaluate(async id => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === id)
      for (let turn = 0; balloon.passengerCount && turn < 2_000; turn++) tick(world, 1 / 12)
      return balloon.passengerCount
    }, balloonId),
    0
  )
  const priorSwarms = await page.evaluate(() =>
    globalThis.testScene.world.effects.filter(effect => effect.swarm).map(effect => effect.id)
  )
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const northernSwarm = await terrainClickPoint(page, { x: 55, z: 121 }, 'swarm')
  await page.getByRole('button', { name: /^Swarm, [1-9] shots$/ }).click()
  await page.mouse.click(northernSwarm.x, northernSwarm.y)
  await page.evaluate(async ids => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (
      let turn = 0;
      !world.effects.some(effect => effect.swarm?.applied && !ids.includes(effect.id)) && turn < 100;
      turn++
    )
      tick(world, 1 / 12)
    if (!world.effects.some(effect => effect.swarm?.applied && !ids.includes(effect.id)))
      throw new Error('Rendered northern Swarm missed')
  }, priorSwarms)
  const northernHeadId = await page.evaluate(() =>
    globalThis.testScene.world.shrines.find(shrine => shrine.rewardMana === 1_000_000).id
  )
  const northernHead = await shrineClickPoint(page, northernHeadId)
  await page.mouse.click(northernHead.x, northernHead.y)
  const northernCompletion = await page.evaluate(async ({ headId, balloonId }) => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === headId),
        balloon = world.vehicles.find(vehicle => vehicle.id === balloonId)
      for (let turn = 0; head.uses !== 1 && turn < 700; turn++) tick(world, 1 / 12)
      for (let turn = 0; world.effects.some(effect => effect.reward === 'mana') && turn < 100; turn++)
        tick(world, 1 / 12)
      return [
        head.active,
        head.uses,
        head.rewardDelay,
        world.effects.some(effect => effect.reward === 'mana'),
        world.manaTribes[0].pending,
        balloon.team,
        balloon.passengerCount,
      ]
    }, { headId: northernHeadId, balloonId })
  assert.deepEqual(northernCompletion.slice(0, 4), [false, 1, 0, false])
  assert.ok(northernCompletion[4] >= 990_000)
  assert.deepEqual(northernCompletion.slice(5), ['blue', 0])
  await page.evaluate(() => globalThis.testStore.saveCheckpoint())
  await page.evaluate(() => globalThis.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  assert.deepEqual(
    await page.evaluate(({ headId, balloonId }) => {
      const world = globalThis.testScene.world,
        head = world.shrines.find(shrine => shrine.id === headId),
        balloon = world.vehicles.find(vehicle => vehicle.id === balloonId)
      return [
        head.active,
        head.uses,
        head.rewardDelay,
        world.effects.some(effect => effect.reward === 'mana'),
        world.manaTribes[0].pending,
        balloon.team,
        balloon.passengerCount,
      ]
    }, { headId: northernHeadId, balloonId }),
    northernCompletion
  )

  const returnBalloon = await vehicleClickPoint(page, balloonId)
  await page.mouse.click(returnBalloon.x, returnBalloon.y)
  const returnBoarding = await page.evaluate(async ({ id, previousPending, headId }) => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === id),
        head = world.shrines.find(shrine => shrine.id === headId)
      for (let turn = 0; !balloon.passengerCount && turn < 1_000; turn++) {
        tick(world, 1 / 12)
        if (
          head.active ||
          head.uses !== 1 ||
          head.rewardDelay ||
          world.effects.some(effect => effect.reward === 'mana') ||
          world.manaTribes[0].pending > previousPending
        )
          throw new Error('Northern mana gift replayed after checkpoint restore')
        previousPending = world.manaTribes[0].pending
      }
      return [balloon.passengerCount, previousPending]
    }, { id: balloonId, previousPending: northernCompletion[4], headId: northernHeadId })
  assert.equal(returnBoarding[0], 1)
  const safeLanding = await terrainClickPoint(page, { x: -29, z: -33 })
  await page.mouse.click(safeLanding.x, safeLanding.y)
  const returned = await page.evaluate(async ({ balloonId, headId, previousPending }) => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === balloonId),
        head = world.shrines.find(shrine => shrine.id === headId),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      for (let turn = 0; balloon.passengerCount && turn < 2_000; turn++) {
        tick(world, 1 / 12)
        if (
          head.active ||
          head.uses !== 1 ||
          head.rewardDelay ||
          world.effects.some(effect => effect.reward === 'mana') ||
          world.manaTribes[0].pending > previousPending
        )
          throw new Error('Northern mana gift replayed during the return flight')
        previousPending = world.manaTribes[0].pending
      }
      return [
        balloon.team,
        balloon.passengerCount,
        shaman.hp,
        shaman.native?.vehicle,
        head.active,
        head.uses,
        head.rewardDelay,
        world.effects.some(effect => effect.reward === 'mana'),
        world.manaTribes[0].pending,
      ]
    }, { balloonId, headId: northernHeadId, previousPending: returnBoarding[1] })
  assert.deepEqual(returned.slice(0, 8), ['blue', 0, 100, 0, false, 1, 0, false])
  assert.ok(returned[8] <= northernCompletion[4])

  assert.deepEqual(errors, [])
  console.log('PASS: Mission 22 solo gifts, Boat and Balloon claims, checkpoint, travel, and landing')
} finally {
  await browser.close()
}
