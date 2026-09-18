import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'
import effects from '../app/original-effects.json' with { type: 'json' }

assert.deepEqual(
  effects.animations.hutSmokeFull.map(frame => [frame.source, frame.w, frame.h]),
  Array.from({ length: 16 }, (_, i) => [1329 + i, 32, 64])
)
assert.deepEqual(
  effects.animations.hutSmokePartial.map(frame => [frame.source, frame.w, frame.h]),
  Array.from({ length: 16 }, (_, i) => [1385 + i, 32, 64])
)

async function smokeSnapshot(page) {
  return page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      group = hut && scene.buildingMeshes.get(hut.id),
      smoke = group?.userData.hutOccupancySmoke
    if (!hut || !smoke) return null
    const { buildingModel, buildingPose, browserPosition } = await import('/app/model.ts'),
      { buildingSocketPoint } = await import('/app/building-shapes.ts'),
      { terrainPointHeight } = await import('/app/native-terrain.ts'),
      rules = (await import('/app/original-rules.json')).default,
      capacity = rules.buildingCapacity[buildingModel(hut)],
      socket = buildingSocketPoint(buildingPose(hut), capacity),
      point = browserPosition(socket),
      expectedY = (terrainPointHeight(world.land, socket) + socket.heightOffset) / 128
    return {
      counter: hut.counter,
      occupants: world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length,
      capacity,
      root: structuredClone(smoke.state.root),
      visible: smoke.group.visible,
      position: { x: smoke.group.position.x, y: smoke.group.position.y, z: smoke.group.position.z },
      expected: { x: point.x, y: expectedY, z: point.z },
      size: { x: smoke.sprite.scale.x, y: smoke.sprite.scale.y },
      gameplayRandom: world.randomState,
      cosmeticRandom: world.cosmeticRandom.randomState,
      animationFrame: scene.gameClock.animationFrame,
    }
  })
}

async function renderedPixels(page) {
  return page.evaluate(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = hut && scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    if (!smoke?.group.visible) return 0
    const renderer = scene.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    smoke.group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    smoke.group.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    return pixels
  })
}

async function setSpeed(page, speed) {
  await page.evaluate(speed => {
    window.testScene.world.speed = speed
  }, speed)
}

async function selectPeople(page, indices) {
  await page.evaluate(indices => {
    const world = window.testScene.world
    world.selected = indices.map(index => window.hutSmoke.peopleIds[index])
  }, indices)
}

async function departOne(page, hutTarget, groundTarget) {
  await page.mouse.move(hutTarget.x, hutTarget.y)
  const panel = page.getByRole('group', { name: /^Hut: \d+ of \d+ occupants$/ })
  await panel.waitFor({ state: 'visible' })
  const occupant = panel.getByRole('button', { name: /^Occupant 1:/ })
  await occupant.click()
  const before = await page.evaluate(() => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId)
    return world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length
  })
  await page.mouse.click(groundTarget.x, groundTarget.y)
  await page.waitForFunction(before => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId)
    return world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length === before - 1
  }, before)
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 1)
  page.setDefaultTimeout(30_000)

  const fixture = await page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      { buildingPose, browserPosition, nativePosition } = await import('/app/model.ts'),
      { buildingFootprintCells } = await import('/app/building-shapes.ts'),
      hut = world.buildings.find(
        building =>
          building.team === 'blue' &&
          building.kind === 'hut' &&
          building.level === 1 &&
          building.progress >= 1
      )
    if (!hut) throw new Error('Mission 1 completed blue level-1 hut is unavailable')
    const people = world.units
      .filter(
        unit =>
          unit.team === 'blue' &&
          unit.kind === 'brave' &&
          unit.inside === null &&
          unit.hp > 0
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - hut.x, a.z - hut.z) - Math.hypot(b.x - hut.x, b.z - hut.z)
      )
      .slice(0, 3)
    if (people.length !== 3) throw new Error('Mission 1 does not have three free Braves')

    window.hutSmoke = { hutId: hut.id, peopleIds: people.map(unit => unit.id) }
    world.speed = 0
    scene.focus(hut)
    scene.startGroundView(2)
    for (let i = 0; i < 18; i++) scene.updateCameraMotion(1 / 24)

    const rect = scene.container.getBoundingClientRect()
    let hutTarget = null
    for (const point of [
      hut,
      ...buildingFootprintCells(buildingPose(hut)).map(index =>
        browserPosition({
          x: (index % 128) * 512 + 256,
          y: Math.floor(index / 128) * 512 + 256,
        })
      ),
    ]) {
      const projected = scene.screen(point),
        candidate = {
          x: rect.left + ((projected.x + 1) * rect.width) / 2,
          y: rect.top + ((1 - projected.y) * rect.height) / 2,
        },
        picked = scene.pick({ clientX: candidate.x, clientY: candidate.y })
      if (!picked) continue
      const native = nativePosition(world, picked),
        cell = ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9)
      if ((world.land.buildingIds[cell] & 1023) === hut.id) {
        hutTarget = candidate
        break
      }
    }
    if (!hutTarget) throw new Error('No clickable residential-hut footprint')

    const ground = scene.screen({ x: 9, z: 37 }),
      groundTarget = {
        x: rect.left + ((ground.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - ground.y) * rect.height) / 2,
      },
      redHut = world.buildings.find(
        building => building.team === 'red' && building.kind === 'hut' && building.progress >= 1
      )
    return {
      hutTarget,
      groundTarget,
      redHutId: redHut?.id ?? null,
    }
  })

  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId)
    return !!hut && !!scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
  })

  let state = await smokeSnapshot(page)
  assert.ok(state)
  assert.equal(state.occupants, 0)
  assert.equal(state.capacity, 3)
  assert.equal(state.root, null)
  assert.equal(state.visible, false)
  if (fixture.redHutId !== null)
    assert.equal(
      await page.evaluate(id => window.testScene.buildingMeshes.get(id)?.userData.hutOccupancySmoke, fixture.redHutId),
      undefined,
      'native occupancy smoke producer is player-tribe only'
    )

  await selectPeople(page, [0])
  await page.mouse.click(fixture.hutTarget.x, fixture.hutTarget.y)
  await setSpeed(page, 4)
  await page.waitForFunction(() => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      person = world.units.find(unit => unit.id === window.hutSmoke.peopleIds[0])
    return person?.inside === hut.id
  })
  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return smoke?.state.root?.mode === 'partial' && smoke.group.visible
  })
  await setSpeed(page, 0)

  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 1)
  assert.equal(state.root.mode, 'partial')
  assert.deepEqual(state.position, state.expected)
  assert.deepEqual(state.size, { x: 32, y: 64 })
  const partialPixels = await renderedPixels(page)
  assert.ok(partialPixels > 20, 'partial occupancy smoke rendered only ' + partialPixels + ' pixels')

  await selectPeople(page, [1, 2])
  await page.mouse.click(fixture.hutTarget.x, fixture.hutTarget.y)
  await setSpeed(page, 4)
  await page.waitForFunction(() => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId)
    return window.hutSmoke.peopleIds.every(
      id => world.units.find(unit => unit.id === id)?.inside === hut.id
    )
  })
  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return smoke?.state.root?.mode === 'full' && smoke.group.visible
  })
  await setSpeed(page, 0)

  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 3)
  assert.equal(state.root.mode, 'full')
  assert.deepEqual(state.position, state.expected)
  const fullPixels = await renderedPixels(page)
  assert.ok(fullPixels > 20, 'full occupancy smoke rendered only ' + fullPixels + ' pixels')

  const paused = await page.evaluate(async () => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke,
      before = {
        counter: hut.counter,
        root: structuredClone(smoke.state.root),
        cosmeticRandom: scene.world.cosmeticRandom.randomState,
        animationFrame: scene.gameClock.animationFrame,
      }
    scene.world.paused = true
    await new Promise(resolve => setTimeout(resolve, 300))
    const after = {
      counter: hut.counter,
      root: structuredClone(smoke.state.root),
      cosmeticRandom: scene.world.cosmeticRandom.randomState,
      animationFrame: scene.gameClock.animationFrame,
    }
    scene.world.paused = false
    return { before, after }
  })
  assert.deepEqual(paused.after, paused.before)

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click()

  await departOne(page, fixture.hutTarget, fixture.groundTarget)
  await setSpeed(page, 4)
  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return (
      scene.world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length === 2 &&
      smoke?.state.root?.mode === 'partial'
    )
  })
  await setSpeed(page, 0)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 2)
  assert.equal(state.root.mode, 'partial')
  assert.deepEqual(state.position, state.expected)

  await departOne(page, fixture.hutTarget, fixture.groundTarget)
  await departOne(page, fixture.hutTarget, fixture.groundTarget)
  await setSpeed(page, 4)
  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return (
      scene.world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length === 0 &&
      smoke?.state.root === null &&
      !smoke.group.visible
    )
  })
  await setSpeed(page, 0)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 0)
  assert.equal(state.root, null)
  assert.equal(state.visible, false)

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(building => building.id === window.hutSmoke.hutId),
      smoke = hut && scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return (
      hut &&
      scene.world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length === 3 &&
      smoke?.state.root?.mode === 'full' &&
      smoke.group.visible
    )
  })
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 3)
  assert.equal(state.root.mode, 'full')
  assert.deepEqual(state.position, state.expected)
  assert.deepEqual(errors, [])

  console.log(
    'PASS: real Mission 1 hut occupancy drives 0→partial→full→partial→empty root smoke at native capacity/socket, pause is stable, checkpoint restores full occupancy, player-only gating holds, and original HFX render (' +
      partialPixels +
      '/' +
      fullPixels +
      ' pixels); secondary full-hut child puffs remain intentionally excluded'
  )
} finally {
  await browser.close()
}
