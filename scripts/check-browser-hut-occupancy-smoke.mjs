import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
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



const firstAdmissionEvidence = {}
const firstAdmissionPath = `${process.env.PND_QUEUE_OUTPUT ?? '/private/tmp'}/issue73-first-admission.json`

function writeFirstAdmissionEvidence() {
  writeFileSync(firstAdmissionPath, JSON.stringify(firstAdmissionEvidence, null, 2) + '\n')
}

async function resolveHutDispatch(page) {
  return page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      { liveCommandContext } = await import('/app/live-command.ts')
    if (!hut) throw new Error('Mission 1 hut disappeared before first admission dispatch')
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(hut),
      rect = scene.renderer.domElement.getBoundingClientRect(),
      center = {
        x: rect.left + ((projected.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - projected.y) * rect.height) / 2,
      }
    for (let dy = -120; dy <= 60; dy += 3)
      for (let dx = -75; dx <= 75; dx += 3) {
        const event = { clientX: center.x + dx, clientY: center.y + dy },
          hit = document.elementFromPoint(event.clientX, event.clientY)
        if (hit !== scene.renderer.domElement) continue
        const pickingId = scene.picking.pick(event),
          object = scene.pickWorldObject(event),
          context = object && liveCommandContext(world, object)
        if (
          pickingId === hut.id &&
          object?.id === hut.id &&
          context?.enabled &&
          context.building?.id === hut.id
        )
          return {
            x: event.clientX,
            y: event.clientY,
            projected: center,
            pickingId,
            objectId: object.id,
            contextModel: context.model,
          }
      }
    throw new Error('No rendered/clickable Mission 1 hut point with enabled building context')
  })
}

async function firstAdmissionSnapshot(page, target) {
  return page.evaluate(async target => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      person = world.units.find(unit => unit.id === window.hutSmoke.firstPersonId),
      source = person?.native ?? person?.entry?.person ?? person?.builder?.person,
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      { liveCommandContext } = await import('/app/live-command.ts'),
      { buildingModel } = await import('/app/model.ts'),
      rules = (await import('/app/original-rules.json')).default,
      pickedId = target ? scene.picking.pick(target) : null,
      object = target ? scene.pickWorldObject(target) : null,
      context = object && liveCommandContext(world, object),
      hit = target ? document.elementFromPoint(target.x, target.y) : null,
      order = source && currentPersonOrder(world.buildingOrders, source)
    return {
      turn: world.turn,
      speed: world.speed,
      paused: world.paused,
      status: world.status,
      flybyFlags: world.flyby.flags,
      inputMask: world.inputMask,
      lastOrderTurn: world.lastOrderTurn,
      selected: [...world.selected],
      camera: {
        cameraMotion: scene.cameraMotion.active,
        viewTransition: scene.viewTransition?.remaining ?? 0,
        overviewStage: scene.overviewStage,
        overviewActive: scene.overviewActive,
      },
      person: person
        ? {
            id: person.id,
            x: person.x,
            z: person.z,
            inside: person.inside,
            work: person.work,
            path: person.path?.length ?? 0,
            entry: !!person.entry,
            state: source?.state ?? null,
            substate: source?.substate ?? null,
            commandStatus: source?.commandStatus ?? null,
            order: order
              ? { model: order.model, a: order.a, b: order.b, flags: order.flags }
              : null,
          }
        : null,
      pick: {
        pickingId: pickedId,
        pickingKind: scene.picking.lastKind,
        objectId: object?.id ?? null,
        objectKind: object?.kind ?? null,
        context: context
          ? {
              model: context.model,
              enabled: context.enabled,
              buildingId: context.building?.id ?? null,
            }
          : null,
      },
      hut: hut
        ? {
            id: hut.id,
            kind: hut.kind,
            level: hut.level,
            progress: hut.progress,
            hp: hut.hp,
            capacity: rules.buildingCapacity[buildingModel(hut)],
            admission: hut.admission
              ? { inside: hut.admission.inside, occupants: [...hut.admission.occupants] }
              : null,
          }
        : null,
      target,
      hit: {
        tag: hit?.tagName ?? null,
        className: hit instanceof HTMLElement ? hit.className : null,
        isCanvas: hit === scene.renderer.domElement,
      },
    }
  }, target)
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
  acceptance: {
  const { page, errors } = await openGame(browser, 1)
  page.setDefaultTimeout(30_000)

  const fixture = await page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
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

    const rect = scene.renderer.domElement.getBoundingClientRect(),
      ground = scene.screen({ x: 9, z: 37 }),
      groundTarget = {
        x: rect.left + ((ground.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - ground.y) * rect.height) / 2,
      },
      redHut = world.buildings.find(
        building => building.team === 'red' && building.kind === 'hut' && building.progress >= 1
      )
    return {
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

  await page.waitForFunction(() => {
    const scene = window.testScene
    return (
      !scene.world.inputMask &&
      !scene.world.paused &&
      !scene.cameraMotion.active &&
      !scene.viewTransition &&
      !scene.overviewStage
    )
  })
  await page.getByLabel('Select brave').click()
  const firstPersonId = await page.evaluate(() => {
    const scene = window.testScene,
      world = scene.world,
      selected = world.selected.filter(id => {
        const unit = world.units.find(candidate => candidate.id === id)
        return unit?.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
      })
    if (selected.length !== 1)
      throw new Error('Shipped Select brave control did not select exactly one free living Brave')
    const id = selected[0],
      old = window.hutSmoke.peopleIds
    window.hutSmoke.firstPersonId = id
    window.hutSmoke.peopleIds = [id, ...old.filter(candidate => candidate !== id)].slice(0, 3)
    return id
  })
  const hutTarget = await resolveHutDispatch(page)
  firstAdmissionEvidence.before = await firstAdmissionSnapshot(page, hutTarget)
  writeFirstAdmissionEvidence()
  assert.equal(firstAdmissionEvidence.before.inputMask, 0)
  assert.equal(firstAdmissionEvidence.before.paused, false)
  assert.equal(firstAdmissionEvidence.before.camera.cameraMotion, 0)
  assert.equal(firstAdmissionEvidence.before.camera.viewTransition, 0)
  assert.equal(firstAdmissionEvidence.before.camera.overviewStage, null)
  assert.deepEqual(firstAdmissionEvidence.before.selected, [firstPersonId])
  assert.equal(firstAdmissionEvidence.before.pick.pickingId, firstAdmissionEvidence.before.hut.id)
  assert.equal(firstAdmissionEvidence.before.pick.objectId, firstAdmissionEvidence.before.hut.id)
  assert.equal(firstAdmissionEvidence.before.pick.context?.enabled, true)
  assert.equal(
    firstAdmissionEvidence.before.pick.context?.buildingId,
    firstAdmissionEvidence.before.hut.id
  )
  assert.equal(firstAdmissionEvidence.before.hit.isCanvas, true)

  await page.mouse.click(hutTarget.x, hutTarget.y)
  firstAdmissionEvidence.afterDispatch = await firstAdmissionSnapshot(page, hutTarget)
  writeFirstAdmissionEvidence()
  assert.equal(
    firstAdmissionEvidence.afterDispatch.lastOrderTurn,
    firstAdmissionEvidence.afterDispatch.turn,
    'real hut click must immediately accept a player order'
  )
  assert.equal(
    firstAdmissionEvidence.afterDispatch.person?.work,
    firstAdmissionEvidence.afterDispatch.hut.id,
    'real hut click must immediately bind the selected Brave to the hut'
  )

  await setSpeed(page, 4)
  try {
    await page.waitForFunction(firstPersonId => {
      const world = window.testScene.world,
        hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
        person = world.units.find(unit => unit.id === firstPersonId)
      return person?.inside === hut.id
    }, firstPersonId)
  } catch (error) {
    firstAdmissionEvidence.afterWait = await firstAdmissionSnapshot(page, hutTarget)
    writeFirstAdmissionEvidence()
    console.error('[issue73-first-admission] evidence ' + firstAdmissionPath)
    throw error
  }
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
  firstAdmissionEvidence.admitted = await firstAdmissionSnapshot(page, hutTarget)
  firstAdmissionEvidence.partialPixels = partialPixels
  writeFirstAdmissionEvidence()
  if (process.env.HUT_SMOKE_FIRST_ADMISSION_ONLY === '1') {
    assert.deepEqual(errors, [])
    console.log(
      'PASS: shipped Select brave + rendered hut pick admitted one Mission 1 Brave and produced native-socket partial occupancy smoke; evidence ' +
        firstAdmissionPath
    )
    break acceptance
  }

  await selectPeople(page, [1, 2])
  await page.mouse.click(hutTarget.x, hutTarget.y)
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
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()

  await departOne(page, hutTarget, fixture.groundTarget)
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

  await departOne(page, hutTarget, fixture.groundTarget)
  await departOne(page, hutTarget, fixture.groundTarget)
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
  }
} finally {
  await browser.close()
}
