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
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 17', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByText(/great struggle ahead/).waitFor()
  await page.getByText(/Find Armageddon and prepare every tribe/).waitFor()

  const acquisition = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, browserPosition, command, nativePosition, tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts'),
      head = world.shrines.find(shrine => shrine.reward === 'armageddon'),
      slots = worshipPositions({
        ...nativePosition(world, head),
        angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
      }),
      followers = Array.from({ length: head.required }, (_, index) =>
        addUnit(world, 'blue', 'brave', browserPosition(slots[index]))
      )
    world.selected = followers.map(unit => unit.id)
    syncLivePersonCells(world)
    if (!command(world, head)) throw new Error('Armageddon worship order was rejected')
    for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
    head.work = head.target * head.required ** 2 - 1
    for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
    for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    return { uses: head.uses, shots: world.shots.armageddon, gifts: world.giftCounts.armageddon }
  })
  assert.deepEqual(acquisition, { uses: 1, shots: 1, gifts: 1 })

  const castPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, spellTargetError } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      target = { x: shaman.x + 1, z: shaman.z }
    for (let index = 0; index < 90; index++)
      addUnit(world, 'blue', index & 1 ? 'warrior' : 'firewarrior', shaman)
    scene.focus(shaman)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(target, Math.max(0, scene.y(target))),
      rect = scene.container.getBoundingClientRect(),
      center = {
        x: rect.left + ((point.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - point.y) * rect.height) / 2,
      }
    for (let radius = 0; radius <= 40; radius += 2)
      for (let step = 0; step < 16; step++) {
        const event = {
            clientX: center.x + Math.cos((step * Math.PI) / 8) * radius,
            clientY: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          picked = scene.pick(event)
        if (picked && !spellTargetError(world, 'armageddon', picked)) return event
      }
    throw new Error('No exposed Armageddon cast target')
  })
  const button = page.getByRole('button', { name: 'Armageddon, 1 shots', exact: true })
  await button.waitFor()
  await button.click()
  await page.mouse.click(castPoint.clientX, castPoint.clientY)

  const cast = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 180 && !world.effects.some(effect => effect.armageddon); turn++)
      tick(world, 1 / 12)
    const effect = world.effects.find(item => item.armageddon)
    if (!effect) throw new Error('HUD cast did not start Armageddon')
    return {
      id: effect.id,
      stock: world.shots.armageddon,
      input: world.inputMask,
      special: world.manaWorld.gameFlags & 2,
      phase: effect.armageddon.phase,
    }
  })
  assert.equal(cast.stock, 0)
  assert.equal(cast.input & 32, 32)
  assert.equal(cast.special, 2)
  assert.equal(cast.phase, 0)

  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  const restored = await page.evaluate(async effectId => {
    const store = globalThis.testStore
    store.getWorld().effects.find(effect => effect.id === effectId).armageddon.terrainRemaining = 1
    if (!store.loadCheckpoint()) throw new Error('Armageddon checkpoint did not load')
    return store.getWorld().effects.find(effect => effect.id === effectId).armageddon
      .terrainRemaining
  }, cast.id)
  assert.ok(restored > 1)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => {
    globalThis.testScene = globalThis.testSceneRef.current
  })

  const arena = await page.evaluate(async effectId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { nativePosition, tick } = await import('/app/model.ts'),
      { specialBattlePosition } = await import('/app/special-battle.ts'),
      effect = world.effects.find(item => item.id === effectId)
    while (effect.armageddon.phase === 0) tick(world, 1 / 12)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const center = nativePosition(world, effect),
      index = ((center.y & 65535) >>> 9) * 128 + ((center.x & 65535) >>> 9)
    return {
      phase: effect.armageddon.phase,
      shamans: world.units.filter(unit => unit.native?.state === 39).length,
      centerHeight: world.land.heights[index],
      meshes: world.units.filter(unit => scene.unitMeshes.has(unit.id)).length,
      units: world.units.length,
      shamansAtRanks: effect.armageddon.participants.every((ids, tribe) => {
        const actual = nativePosition(
            world,
            world.units.find(unit => unit.id === ids[0])
          ),
          expected = specialBattlePosition(
            {
              randomState: world.randomState,
              center,
              directions: effect.armageddon.directions,
              populations: effect.armageddon.populations,
            },
            0,
            tribe
          )
        return (actual.x & 65535) === expected.x && (actual.y & 65535) === expected.y
      }),
    }
  }, cast.id)
  assert.equal(arena.phase, 1)
  assert.equal(arena.shamans, 4)
  assert.equal(arena.centerHeight, 50)
  assert.equal(arena.shamansAtRanks, true)
  assert.equal(arena.meshes, arena.units)
  assert.ok(arena.meshes > 4)

  const result = await page.evaluate(async effectId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      effect = world.effects.find(item => item.id === effectId)
    for (let turn = 0; turn < 1000 && effect.armageddon.phase < 2; turn++) tick(world, 1 / 12)
    for (let turn = 0; turn < 38 && effect.armageddon.commandDelay; turn++) tick(world, 1 / 12)
    const engaged = world.units.filter(unit => unit.target !== null || unit.fight).length
    for (const unit of world.units) if (unit.team !== 'blue') unit.hp = 0
    for (let turn = 0; turn < 32 && world.status === 'playing'; turn++) tick(world, 1 / 12)
    scene.onChange()
    return {
      engaged,
      status: world.status,
      input: world.inputMask,
      special: world.manaWorld.gameFlags & 2,
      controller: world.effects.some(item => item.armageddon),
    }
  }, cast.id)
  assert.ok(result.engaged > 0)
  assert.deepEqual(result, {
    engaged: result.engaged,
    status: 'won',
    input: 0,
    special: 0,
    controller: false,
  })
  await page.getByText('A world united.').waitFor()
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 17 reward, HUD cast, checkpoint, visible staged arena, live battle order, and victory teardown'
  )
} finally {
  await browser.close()
}
