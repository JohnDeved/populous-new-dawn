import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'
import effects from '../app/original-effects.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }

assert.deepEqual(
  effects.animations.hutSmokeFull.map(frame => [frame.source, frame.w, frame.h]),
  Array.from({ length: 16 }, (_, i) => [1329 + i, 32, 64])
)
assert.deepEqual(
  effects.animations.hutSmokePartial.map(frame => [frame.source, frame.w, frame.h]),
  Array.from({ length: 16 }, (_, i) => [1385 + i, 32, 64])
)
assert.deepEqual(rules.buildingCapacity.slice(1, 4), [3, 4, 5])

const report = {}
const reportPath =
  (process.env.PND_QUEUE_OUTPUT ?? '/private/tmp') + '/issue73-fresh-hut-acceptance.json'
const writeReport = () => writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')

async function pauseGame(page) {
  if (!(await page.evaluate(() => window.testScene.world.paused)))
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testScene.world.paused)
}

async function resumeGame(page) {
  if (await page.evaluate(() => window.testScene.world.paused))
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await page.waitForFunction(() => !window.testScene.world.paused)
}

async function ensureDoubleSpeed(page) {
  const current = await page.evaluate(() => window.testScene.world.speed)
  if (current === 2) return
  assert.equal(current, 1, 'rendered game-speed control expects the normal 1x state')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: '1× game speed', exact: true }).click()
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.waitForFunction(() => window.testScene.world.speed === 2)
}

async function focusSettlement(page) {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Focus settlement', exact: true }).click()
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
}

async function clearSelection(page) {
  for (let i = 0; i < 2; i++) {
    const state = await page.evaluate(() => ({
      selected: window.testScene.world.selected.length,
      mode: window.testScene.world.mode,
    }))
    if (!state.selected && !state.mode) return
    await page.keyboard.press('Escape')
  }
  await page.waitForFunction(() => {
    const world = window.testScene.world
    return !world.selected.length && !world.mode
  })
}

async function renderedPersonTarget(page, id) {
  return page.evaluate(id => {
    const scene = window.testScene,
      rect = scene.renderer.domElement.getBoundingClientRect(),
      bounds = scene.picking.personBounds(id)
    if (!bounds) throw new Error('Free Brave ' + id + ' has no rendered person bounds')
    for (let y = bounds.y + 2; y < bounds.y + bounds.height - 1; y += 3)
      for (let x = bounds.x + 2; x < bounds.x + bounds.width - 1; x += 3) {
        const event = { clientX: rect.left + x, clientY: rect.top + y }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pickPerson(event) === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No rendered pointer hit for free Brave ' + id)
  }, id)
}

async function selectRenderedPeople(page, ids) {
  await clearSelection(page)
  for (const [index, id] of ids.entries()) {
    const target = await renderedPersonTarget(page, id)
    if (index) await page.keyboard.down('Control')
    await page.mouse.click(target.x, target.y)
    if (index) await page.keyboard.up('Control')
  }
  const selected = await page.evaluate(() => [...window.testScene.world.selected])
  assert.deepEqual(
    [...selected].sort((a, b) => a - b),
    [...ids].sort((a, b) => a - b)
  )
}

async function buildSiteCandidates(page) {
  return page.evaluate(() => {
    const scene = window.testScene,
      rect = scene.renderer.domElement.getBoundingClientRect(),
      points = [
        { x: -1.7, z: 32.3 },
        { x: 4, z: 32 },
        { x: -8, z: 32 },
        { x: 6, z: 27 },
        { x: -9, z: 27 },
        { x: 10, z: 32 },
        { x: -12, z: 32 },
      ]
    return points.map(point => {
      const projected = scene.screen(point, Math.max(0, scene.y(point)))
      return {
        world: point,
        x: rect.left + ((projected.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - projected.y) * rect.height) / 2,
      }
    })
  })
}

async function resolveBuildSite(page) {
  for (const candidate of await buildSiteCandidates(page)) {
    await page.mouse.move(candidate.x, candidate.y)
    const valid = await page.evaluate(candidate => {
      const scene = window.testScene,
        hit = document.elementFromPoint(candidate.x, candidate.y)
      return {
        canvas: hit === scene.renderer.domElement,
        mode: scene.world.mode,
        visible: scene.cursor.visible,
        invalid: !!scene.cursor.userData.invalid,
      }
    }, candidate)
    if (valid.canvas && valid.mode === 'hut' && valid.visible && !valid.invalid) return candidate
  }
  throw new Error('No rendered valid Mission 1 hut construction site')
}

async function resolveHutDispatch(page) {
  return page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      { liveCommandContext } = await import('/app/live-command.ts')
    if (!hut) throw new Error('Fresh Mission 1 hut disappeared before dispatch')
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
          context.model === 8 &&
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
    throw new Error('No rendered fresh-hut point with enabled command-8 context')
  })
}

async function resolveGroundDispatch(page) {
  return page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      { liveCommandContext } = await import('/app/live-command.ts')
    if (!hut) throw new Error('Fresh Mission 1 hut disappeared before ground dispatch')
    scene.renderer.render(scene.scene, scene.camera)
    const rect = scene.renderer.domElement.getBoundingClientRect()
    for (const radius of [8, 10, 12, 14])
      for (let step = 0; step < 16; step++) {
        const angle = (step * Math.PI) / 8,
          worldPoint = {
            x: hut.x + Math.cos(angle) * radius,
            z: hut.z + Math.sin(angle) * radius,
          },
          projected = scene.screen(worldPoint),
          event = {
            clientX: rect.left + ((projected.x + 1) * rect.width) / 2,
            clientY: rect.top + ((1 - projected.y) * rect.height) / 2,
          }
        if (
          event.clientX <= rect.left ||
          event.clientX >= rect.right ||
          event.clientY <= rect.top ||
          event.clientY >= rect.bottom ||
          document.elementFromPoint(event.clientX, event.clientY) !== scene.renderer.domElement ||
          scene.pickUnit(event) ||
          scene.pickWorldObject(event)
        )
          continue
        const point = scene.pick(event),
          context = point && liveCommandContext(world, point)
        if (point && context?.enabled && context.model === 3 && !context.building)
          return {
            x: event.clientX,
            y: event.clientY,
            point: { x: point.x, z: point.z },
            contextModel: context.model,
          }
      }
    throw new Error('No rendered nearby ground point with enabled move context')
  })
}

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
      originalEffects = (await import('/app/original-effects.json')).default,
      originalRules = (await import('/app/original-rules.json')).default,
      capacity = originalRules.buildingCapacity[buildingModel(hut)],
      socket = buildingSocketPoint(buildingPose(hut), capacity),
      point = browserPosition(socket),
      expectedY = (terrainPointHeight(world.land, socket) + socket.heightOffset) / 128,
      root = smoke.state.root,
      sequence = root ? (root.mode === 'full' ? 'hutSmokeFull' : 'hutSmokePartial') : null,
      frame =
        root === null
          ? null
          : (((scene.gameClock.animationFrame - root.frameStart) % 16) + 16) % 16,
      asset =
        sequence === null || frame === null ? null : originalEffects.animations[sequence][frame],
      atlas = smoke.sprite.userData.atlasTransform
    return {
      counter: hut.counter,
      occupants: world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).length,
      admissionInside: hut.admission?.inside ?? 0,
      capacity,
      socketIndex: capacity,
      root: structuredClone(root),
      visible: smoke.group.visible,
      sequence,
      frame,
      frameSource: asset?.source ?? null,
      atlas: atlas ? [atlas.x, atlas.y, atlas.z, atlas.w] : null,
      expectedAtlas: asset
        ? [
            asset.w / originalEffects.width,
            asset.h / originalEffects.height,
            ((asset.index % 8) * 256) / originalEffects.width,
            1 - (Math.floor(asset.index / 8) * 256 + asset.h) / originalEffects.height,
          ]
        : null,
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
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    smoke.group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
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

async function admissionDispatch(page, ids) {
  await pauseGame(page)
  await selectRenderedPeople(page, ids)
  await resumeGame(page)
  const target = await resolveHutDispatch(page),
    before = await page.evaluate(ids => {
      const world = window.testScene.world,
        hut = world.buildings.find(building => building.id === window.hutSmoke.hutId)
      return {
        turn: world.turn,
        hutId: hut.id,
        selected: [...world.selected],
        people: ids.map(id => {
          const unit = world.units.find(candidate => candidate.id === id)
          return { id, inside: unit?.inside ?? null, work: unit?.work ?? null }
        }),
      }
    }, ids)
  await page.mouse.click(target.x, target.y)
  const immediate = await page.evaluate(ids => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId)
    return {
      turn: world.turn,
      lastOrderTurn: world.lastOrderTurn,
      hutId: hut.id,
      selected: [...world.selected],
      people: ids.map(id => {
        const unit = world.units.find(candidate => candidate.id === id)
        return { id, inside: unit?.inside ?? null, work: unit?.work ?? null }
      }),
    }
  }, ids)
  assert.ok(
    immediate.lastOrderTurn >= before.turn && immediate.lastOrderTurn <= immediate.turn,
    'real hut click must immediately accept the selected resident order'
  )
  assert.ok(
    immediate.people.every(
      person => person.inside === immediate.hutId || person.work === immediate.hutId
    ),
    'real hut click must immediately dispatch every selected free Brave to the hut'
  )
  return { target, before, immediate }
}

async function departOne(page) {
  await pauseGame(page)
  await clearSelection(page)
  const hutTarget = await resolveHutDispatch(page)
  await page.mouse.move(hutTarget.x, hutTarget.y)
  const panel = page.getByRole('group', { name: /^Hut: [0-9]+ of [0-9]+ occupants$/ })
  await panel.waitFor({ state: 'visible' })
  const occupant = panel.getByRole('button', { name: /^Occupant 1:/ }),
    id = Number(await occupant.getAttribute('data-person'))
  assert.ok(id > 0, 'visible hut occupant must expose its live person id')
  await occupant.click()
  assert.deepEqual(await page.evaluate(() => [...window.testScene.world.selected]), [id])
  let groundTarget = await resolveGroundDispatch(page)
  const before = await page.evaluate(id => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      unit = world.units.find(candidate => candidate.id === id)
    return {
      turn: world.turn,
      hutId: hut.id,
      residents: world.units.filter(person => person.inside === hut.id && person.hp > 0).length,
      admissionInside: hut.admission?.inside ?? 0,
      unitInside: unit?.inside ?? null,
    }
  }, id)
  assert.equal(before.unitInside, before.hutId)
  await resumeGame(page)
  groundTarget = await resolveGroundDispatch(page)
  await page.mouse.click(groundTarget.x, groundTarget.y)
  const immediate = await page.evaluate(id => {
    const world = window.testScene.world,
      hut = world.buildings.find(building => building.id === window.hutSmoke.hutId),
      unit = world.units.find(candidate => candidate.id === id)
    return {
      turn: world.turn,
      lastOrderTurn: world.lastOrderTurn,
      residents: world.units.filter(person => person.inside === hut.id && person.hp > 0).length,
      admissionInside: hut.admission?.inside ?? 0,
      unitInside: unit?.inside ?? null,
    }
  }, id)
  assert.ok(immediate.lastOrderTurn >= before.turn && immediate.lastOrderTurn <= immediate.turn)
  assert.equal(immediate.unitInside, null)
  assert.equal(immediate.residents, before.residents - 1)
  assert.equal(immediate.admissionInside, before.admissionInside - 1)
  await page.waitForFunction(turn => window.testScene.world.turn > turn, immediate.turn)
  await pauseGame(page)
  return { id, hutTarget, groundTarget, before, immediate }
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 1)
  page.setDefaultTimeout(30_000)
  await ensureDoubleSpeed(page)
  await focusSettlement(page)
  await pauseGame(page)

  const builderIds = await page.evaluate(() => {
    const scene = window.testScene,
      site = { x: -1.7, z: 32.3 }
    return scene.world.units
      .filter(
        unit =>
          unit.team === 'blue' &&
          unit.kind === 'brave' &&
          unit.hp > 0 &&
          unit.inside === null &&
          unit.work === null &&
          scene.picking.personBounds(unit.id)
      )
      .sort(
        (a, b) => Math.hypot(a.x - site.x, a.z - site.z) - Math.hypot(b.x - site.x, b.z - site.z)
      )
      .slice(0, 6)
      .map(unit => unit.id)
  })
  assert.ok(
    builderIds.length >= 3,
    'fresh hut construction needs at least three rendered free Braves'
  )
  await selectRenderedPeople(page, builderIds)

  const beforeBuildings = await page.evaluate(() => window.testScene.world.buildings.map(b => b.id))
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
  let buildTarget = await resolveBuildSite(page)
  await resumeGame(page)
  buildTarget = await resolveBuildSite(page)
  await page.mouse.click(buildTarget.x, buildTarget.y)
  await page.waitForFunction(
    before =>
      window.testScene.world.buildings.some(
        building =>
          !before.includes(building.id) &&
          building.team === 'blue' &&
          building.kind === 'hut' &&
          building.level === 1 &&
          building.progress < 1
      ),
    beforeBuildings
  )
  const hutId = await page.evaluate(
    before =>
      window.testScene.world.buildings.find(
        building =>
          !before.includes(building.id) &&
          building.team === 'blue' &&
          building.kind === 'hut' &&
          building.level === 1
      ).id,
    beforeBuildings
  )
  const placed = await page.evaluate(
    ({ hutId, builderIds }) => {
      const world = window.testScene.world,
        hut = world.buildings.find(building => building.id === hutId)
      return {
        hutId,
        builders: [...hut.builders],
        assigned: builderIds.filter(id => hut.builders.includes(id)),
        selected: [...world.selected],
      }
    },
    { hutId, builderIds }
  )
  assert.ok(placed.assigned.length >= 3, 'rendered hut placement must assign the selected Braves')
  report.construction = { builderIds, buildTarget, placed }
  writeReport()

  await page.waitForFunction(
    hutId => {
      const hut = window.testScene.world.buildings.find(building => building.id === hutId)
      return hut?.progress === 1 && hut.builders.every(id => id === 0)
    },
    hutId,
    { timeout: 180_000 }
  )
  await page.waitForFunction(
    ({ hutId, builderIds }) => {
      const world = window.testScene.world,
        hut = world.buildings.find(building => building.id === hutId)
      return (
        hut?.admission?.inside === 0 &&
        !world.units.some(unit => unit.inside === hutId && unit.hp > 0) &&
        builderIds.every(id => {
          const unit = world.units.find(candidate => candidate.id === id)
          return !unit || unit.work === null
        })
      )
    },
    { hutId, builderIds },
    { timeout: 60_000 }
  )
  await pauseGame(page)
  await page.evaluate(hutId => {
    window.hutSmoke = { hutId }
  }, hutId)
  await page.waitForFunction(hutId => {
    const scene = window.testScene
    return !!scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
  }, hutId)

  let state = await smokeSnapshot(page)
  assert.ok(state)
  assert.equal(state.occupants, 0)
  assert.equal(state.admissionInside, 0)
  assert.equal(state.capacity, 3)
  assert.equal(state.socketIndex, 3)
  const zeroStart = state.counter,
    turnsToProducer = (32 - (zeroStart & 31)) & 31 || 32
  await resumeGame(page)
  await page.waitForFunction(
    ({ hutId, start, required }) => {
      const scene = window.testScene,
        world = scene.world,
        hut = world.buildings.find(building => building.id === hutId),
        smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
      return (
        ((hut.counter - start) & 255) >= required &&
        !world.units.some(unit => unit.inside === hutId && unit.hp > 0) &&
        (hut.admission?.inside ?? 0) === 0 &&
        smoke?.state.root === null &&
        !smoke.group.visible
      )
    },
    { hutId, start: zeroStart, required: turnsToProducer }
  )
  await pauseGame(page)
  state = await smokeSnapshot(page)
  assert.equal(state.root, null)
  assert.equal(state.visible, false)
  report.zero = state
  writeReport()

  const residentIds = await page.evaluate(builderIds => {
    const scene = window.testScene,
      preferred = new Set(builderIds)
    return scene.world.units
      .filter(
        unit =>
          unit.team === 'blue' &&
          unit.kind === 'brave' &&
          unit.hp > 0 &&
          unit.inside === null &&
          unit.work === null &&
          scene.picking.personBounds(unit.id)
      )
      .sort((a, b) => Number(preferred.has(b.id)) - Number(preferred.has(a.id)))
      .slice(0, 3)
      .map(unit => unit.id)
  }, builderIds)
  assert.equal(residentIds.length, 3, 'fresh hut acceptance needs three rendered free Braves')

  const partialDispatch = await admissionDispatch(page, [residentIds[0]])
  report.partialDispatch = partialDispatch
  await page.waitForFunction(
    ({ hutId, id }) => {
      const world = window.testScene.world
      return world.units.find(unit => unit.id === id)?.inside === hutId
    },
    { hutId, id: residentIds[0] }
  )
  await page.waitForFunction(hutId => {
    const scene = window.testScene,
      smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
    return smoke?.state.root?.mode === 'partial' && smoke.group.visible
  }, hutId)
  await pauseGame(page)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 1)
  assert.equal(state.admissionInside, 1)
  assert.equal(state.root.mode, 'partial')
  assert.equal(state.sequence, 'hutSmokePartial')
  assert.ok(state.frameSource >= 1385 && state.frameSource <= 1400)
  assert.deepEqual(state.atlas, state.expectedAtlas)
  assert.deepEqual(state.position, state.expected)
  assert.deepEqual(state.size, { x: 32, y: 64 })
  const partialPixels = await renderedPixels(page)
  assert.ok(
    partialPixels > 20,
    'partial occupancy smoke rendered only ' + partialPixels + ' pixels'
  )
  report.partial = { ...state, pixels: partialPixels }
  writeReport()

  const fullDispatch = await admissionDispatch(page, residentIds.slice(1))
  report.fullDispatch = fullDispatch
  await page.waitForFunction(
    ({ hutId, ids }) => {
      const world = window.testScene.world
      return ids.every(id => world.units.find(unit => unit.id === id)?.inside === hutId)
    },
    { hutId, ids: residentIds.slice(1) }
  )
  await page.waitForFunction(hutId => {
    const scene = window.testScene,
      smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
    return smoke?.state.root?.mode === 'full' && smoke.group.visible
  }, hutId)
  await pauseGame(page)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 3)
  assert.equal(state.admissionInside, 3)
  assert.equal(state.root.mode, 'full')
  assert.equal(state.sequence, 'hutSmokeFull')
  assert.ok(state.frameSource >= 1329 && state.frameSource <= 1344)
  assert.deepEqual(state.atlas, state.expectedAtlas)
  assert.deepEqual(state.position, state.expected)
  const fullPixels = await renderedPixels(page)
  assert.ok(fullPixels > 20, 'full occupancy smoke rendered only ' + fullPixels + ' pixels')
  report.full = { ...state, pixels: fullPixels, residentIds }
  writeReport()

  const pausedBefore = await smokeSnapshot(page)
  await page.waitForTimeout(300)
  const pausedAfter = await smokeSnapshot(page)
  assert.deepEqual(
    {
      counter: pausedAfter.counter,
      root: pausedAfter.root,
      cosmeticRandom: pausedAfter.cosmeticRandom,
      animationFrame: pausedAfter.animationFrame,
    },
    {
      counter: pausedBefore.counter,
      root: pausedBefore.root,
      cosmeticRandom: pausedBefore.cosmeticRandom,
      animationFrame: pausedBefore.animationFrame,
    }
  )

  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  const load = page.getByRole('button', { name: 'Load checkpoint', exact: true })
  assert.equal(await load.isEnabled(), true)
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()

  const firstDeparture = await departOne(page)
  report.firstDeparture = firstDeparture
  await resumeGame(page)
  await page.waitForFunction(hutId => {
    const scene = window.testScene,
      world = scene.world,
      smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
    return (
      world.units.filter(unit => unit.inside === hutId && unit.hp > 0).length === 2 &&
      smoke?.state.root?.mode === 'partial'
    )
  }, hutId)
  await pauseGame(page)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 2)
  assert.equal(state.root.mode, 'partial')
  assert.deepEqual(state.position, state.expected)

  report.secondDeparture = await departOne(page)
  report.thirdDeparture = await departOne(page)
  await resumeGame(page)
  await page.waitForFunction(hutId => {
    const scene = window.testScene,
      world = scene.world,
      smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
    return (
      world.units.filter(unit => unit.inside === hutId && unit.hp > 0).length === 0 &&
      (world.buildings.find(building => building.id === hutId)?.admission?.inside ?? 0) === 0 &&
      smoke?.state.root === null &&
      !smoke.group.visible
    )
  }, hutId)
  await pauseGame(page)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 0)
  assert.equal(state.admissionInside, 0)
  assert.equal(state.root, null)
  assert.equal(state.visible, false)
  report.emptyAgain = state
  writeReport()

  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(hutId => {
    const scene = window.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === hutId),
      smoke = hut && scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke
    return (
      hut &&
      world.units.filter(unit => unit.inside === hutId && unit.hp > 0).length === 3 &&
      smoke?.state.root?.mode === 'full' &&
      smoke.group.visible
    )
  }, hutId)
  state = await smokeSnapshot(page)
  assert.equal(state.occupants, 3)
  assert.equal(state.root.mode, 'full')
  assert.deepEqual(state.position, state.expected)
  assert.equal(state.frameSource >= 1329 && state.frameSource <= 1344, true)
  assert.deepEqual(state.atlas, state.expectedAtlas)
  assert.deepEqual(errors, [])
  report.checkpoint = state
  report.result =
    'PASS fresh rendered hut construction; zero sampling; partial/full native HFX/socket smoke; departures; pause; checkpoint'
  writeReport()
  console.log(
    'PASS: fresh rendered Mission 1 hut construction establishes true zero occupancy; real resident input drives model75 partial HFX1385-1400 then model74 full HFX1329-1344 at capacity socket 3; full→partial→empty, pause and checkpoint restoration pass; supported capacities remain sockets 3/4/5; secondary full-hut child puffs remain excluded; evidence ' +
      reportPath
  )
} finally {
  await browser.close()
}
