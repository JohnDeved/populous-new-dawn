import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(15_000)
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(7)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 8', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 8)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Dakini tribe').waitFor()

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    if (vault.reward !== 'firewarriorHut') throw new Error(`Wrong Mission 8 Vault: ${vault.reward}`)
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.speed = 0
    scene.focus(vault)
    scene.onChange()
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      point = scene.screen(vault),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === vault.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 8 Vault geometry')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    world.speed = 1
    for (let turn = 0; !world.unlockedFirewarriorHut && turn < 2_000; turn++) tick(world, 1 / 12)
    world.speed = 0
    if (!world.unlockedFirewarriorHut) throw new Error('Mission 8 Vault did not unlock Firewarriors')
    scene.onChange()
  })

  await page.getByLabel('Select brave').click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const firewarriorBuilding = page.getByRole('button', { name: /Firewarrior Training Hut/ })
  if (!(await firewarriorBuilding.count()))
    throw new Error(
      `Missing Firewarrior building button: ${JSON.stringify(await page.locator('button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')).filter(Boolean)))}`
    )
  const site = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, placementError } = await import('/app/model.ts'),
      { missionPosition } = await import('/app/mission-data.ts'),
      start = missionPosition(8, 'blue'),
      bounds = scene.container.getBoundingClientRect()
    const candidates = []
    for (let z = start.z - 16; z <= start.z + 16; z += 0.5)
      for (let x = start.x - 16; x <= start.x + 16; x += 0.5)
        if (!placementError(world, 'firewarriorHut', { x, z })) {
          const plan = buildingPlanPose(world, 'firewarriorHut', { x, z }),
            point = browserPosition({ x: plan.anchorX, y: plan.anchorY })
          if (!candidates.some(candidate => candidate.x === point.x && candidate.z === point.z))
            candidates.push(point)
        }
    if (!candidates.length)
      throw new Error('No valid Mission 8 Firewarrior building site near the settlement')
    const candidate = candidates[0]
    scene.focus(candidate)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(candidate),
      point = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      },
      picked = scene.pick({ clientX: point.x, clientY: point.y })
    if (!picked || placementError(world, 'firewarriorHut', picked))
      throw new Error('No exposed Mission 8 Firewarrior building site')
    return point
  })
  await firewarriorBuilding.click()
  await page.mouse.move(site.x, site.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  const cursor = await page.evaluate(() => {
    const scene = globalThis.testScene
    return {
      visible: scene.cursor.visible,
      invalid: scene.cursor.userData.invalid,
      pointer: scene.pointer,
      pointerScreen: scene.pointerScreen,
      mode: scene.world.mode,
    }
  })
  assert.equal(cursor.visible && !cursor.invalid, true, JSON.stringify(cursor))
  await page.mouse.click(site.x, site.y)
  const school = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { setSelection, tick } = await import('/app/model.ts'),
      building = world.buildings.find(b => b.team === 'blue' && b.kind === 'firewarriorHut')
    if (!building || building.progress !== 0) throw new Error('Real building input did not place the school')
    for (let turn = 0; building.progress < 1 && turn < 20_000; turn++) tick(world, 1 / 12)
    if (building.progress < 1) throw new Error(`Firewarrior school construction timed out: ${JSON.stringify(building)}`)
    for (let turn = 0; world.units.some(unit => unit.work === building.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    if (world.units.some(unit => unit.work === building.id))
      throw new Error('Firewarrior school builders did not depart')
    setSelection(world, [])
    scene.onChange()
    return { id: building.id, built: world.stats.built }
  })
  assert.equal(school.built, 1)

  await page.getByLabel('Select brave').click()
  await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      school = world.buildings.find(building => building.id === id),
      brave = world.units.find(unit => world.selected.includes(unit.id) && unit.kind === 'brave')
    Object.assign(brave, entrance(world, school, 2))
    syncLivePersonCells(world)
    scene.focus(school)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  }, school.id)
  const schoolPoint = await page.evaluate(id => {
    const scene = globalThis.testScene,
      school = scene.world.buildings.find(building => building.id === id),
      point = scene.screen(school),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 20; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === school.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Firewarrior school geometry')
  }, school.id)
  await page.mouse.click(schoolPoint.x, schoolPoint.y)
  const schoolPanel = page.locator('.training-panel:not([hidden])')
  await schoolPanel.waitFor({ state: 'visible' })
  assert.match(await schoolPanel.getAttribute('aria-label'), /^Firewarrior training:/)
  const firewarrior = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      school = world.buildings.find(building => building.id === id)
    for (let turn = 0; !world.units.some(unit => unit.team === 'blue' && unit.kind === 'firewarrior') && turn < 2_000; turn++) {
      school.timer = 65535
      tick(world, 1 / 12)
    }
    const unit = world.units.find(candidate => candidate.team === 'blue' && candidate.kind === 'firewarrior')
    if (!unit) throw new Error('Firewarrior training timed out')
    scene.onChange()
    return unit.id
  }, school.id)

  await page.getByLabel('Select firewarrior').click()
  const target = await page.evaluate(async firewarriorId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      firewarrior = world.units.find(unit => unit.id === firewarriorId),
      enemy = world.units.find(unit => unit.team === 'red' && unit.kind === 'brave')
    Object.assign(enemy, { x: firewarrior.x + 8, z: firewarrior.z })
    syncLivePersonCells(world)
    scene.focus(enemy)
    scene.onChange()
    const point = scene.screen(enemy),
      bounds = scene.container.getBoundingClientRect()
    return {
      id: enemy.id,
      hp: enemy.hp,
      x: bounds.left + ((point.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - point.y) * bounds.height) / 2,
    }
  }, firewarrior)
  await page.mouse.click(target.x, target.y)
  const shotIds = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    tick(world, 1 / 12)
    const shots = world.effects.filter(effect => effect.firewarriorShot)
    if (shots.length !== 2) throw new Error(`Expected native Firewarrior pair, got ${shots.length}`)
    return shots.map(shot => shot.id)
  })
  await page.waitForFunction(ids => ids.every(id => globalThis.testScene.fxMeshes.has(id)), shotIds)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      { tick } = await import('/app/model.ts')
    tick(scene.world, 1 / 12)
    scene.updateEffectsFrame()
  })
  const shotPixels = await effectPixels(page, shotIds)
  if (!shotPixels) {
    const shotState = await page.evaluate(ids =>
      ids.map(id => {
        const scene = globalThis.testScene,
          effect = scene.world.effects.find(effect => effect.id === id),
          group = scene.fxMeshes.get(id),
          sprite = group?.children[0]
        return {
          effect,
          groupVisible: group?.visible,
          spriteVisible: sprite?.visible,
          scale: sprite?.scale.toArray(),
          screen: effect && scene.screen(effect, effect.height),
        }
      }), shotIds)
    throw new Error(`Firewarrior shots must reach the GPU: ${JSON.stringify(shotState)}`)
  }
  const impact = await page.evaluate(async ({ id, hp }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      enemy = world.units.find(unit => unit.id === id)
    for (let turn = 0; enemy.hp === hp && turn < 16; turn++) tick(world, 1 / 12)
    return { hp: enemy.hp, pairAlive: world.effects.some(effect => effect.firewarriorShot && effect.duration === Infinity) }
  }, target)
  assert.equal(impact.hp, target.hp - 20)
  assert.equal(impact.pairAlive, false)

  const restored = await page.evaluate(async firewarriorId => {
    const store = globalThis.testStore
    await store.saveCheckpoint()
    store.startMission(1)
    if (!store.loadCheckpoint()) throw new Error('Mission 8 checkpoint load failed')
    const world = store.getWorld()
    return {
      level: world.outcome.level,
      unlocked: world.unlockedFirewarriorHut,
      school: world.buildings.some(building => building.kind === 'firewarriorHut' && building.progress === 1),
      firewarrior: world.units.some(unit => unit.id === firewarriorId && unit.kind === 'firewarrior'),
    }
  }, firewarrior)
  assert.deepEqual(restored, { level: 8, unlocked: true, school: true, firewarrior: true })
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 7 continues to Mission 8; Vault, build, training, HUD ranged attack, GPU shot and checkpoint paths work')
} finally {
  await browser.close()
}
