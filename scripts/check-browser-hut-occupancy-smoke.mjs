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

const report = {
  strategy: 'rendered construction; continuous non-cohort Guard; explicit admission and release',
  newcomerOrders: [],
}
const reportPath =
  (process.env.PND_QUEUE_OUTPUT ?? '/private/tmp') + '/issue73-fresh-hut-acceptance.json'
const writeReport = () => writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
const stage = name => {
  report.stage = name
  writeReport()
  console.log('[issue73] ' + name)
}

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

// dialog.close() removes `open` before its queued close event. The React
// onClose handler then unpauses; consume both before issuing a fresh Pause.
async function closeMenuForGameplay(page) {
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.waitForFunction(() => {
    const dialog = document.querySelector('.game-dialog')
    return dialog && !dialog.open && window.testScene.world.paused === false
  })
}

async function ensureDoubleSpeed(page) {
  const current = await page.evaluate(() => window.testScene.world.speed)
  if (current === 2) return
  assert.equal(current, 1, 'rendered game-speed control expects the normal 1x state')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: '1× game speed', exact: true }).click()
  await closeMenuForGameplay(page)
  await page.waitForFunction(() => window.testScene.world.speed === 2)
}

async function focusSettlement(page) {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Focus settlement', exact: true }).click()
  await closeMenuForGameplay(page)
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

async function renderedPersonTarget(page, id, required = true) {
  const target = await page.evaluate(id => {
    const scene = window.testScene,
      rect = scene.renderer.domElement.getBoundingClientRect(),
      bounds = scene.picking.personBounds(id)
    if (!bounds) return null
    for (let y = bounds.y + 2; y < bounds.y + bounds.height - 1; y += 3)
      for (let x = bounds.x + 2; x < bounds.x + bounds.width - 1; x += 3) {
        const event = { clientX: rect.left + x, clientY: rect.top + y }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pickPerson(event) === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    return null
  }, id)
  if (required) assert.ok(target, 'No rendered pointer hit for free Brave ' + id)
  return target
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

// G is the shipped Guard command: it releases real work/occupancy and keeps
// idle auto-housing from reclaiming the staged Braves. Never write those fields.
async function guardSelected(page, ids, protectedIds = []) {
  assert.ok(
    ids.every(id => !protectedIds.includes(id)),
    'Guard must never select a controlled resident'
  )
  const snapshot = () =>
    page.evaluate(ids => {
      const world = window.testScene.world,
        hut = world.buildings.find(b => b.id === window.hutSmoke.hutId)
      return {
        turn: world.turn,
        selected: [...world.selected],
        residents: world.units.filter(u => u.inside === hut.id && u.hp > 0).map(u => u.id),
        admissionInside: hut.admission?.inside ?? 0,
        people: ids.map(id => {
          const u = world.units.find(u => u.id === id)
          return { id, inside: u?.inside, work: u?.work, guard: u?.guard, hp: u?.hp }
        }),
      }
    }, ids)
  const before = await snapshot(),
    record = { before, protectedIds: [...protectedIds] }
  ;(report.guardOrders ??= []).push(record)
  writeReport()
  assert.deepEqual(
    [...before.selected].sort((a, b) => a - b),
    [...ids].sort((a, b) => a - b)
  )
  assert.ok(
    before.people.every(u => u.hp > 0 && !u.guard),
    'Guard must enable, not toggle off'
  )
  await resumeGame(page)
  await page.keyboard.press('g')
  record.immediate = await snapshot()
  writeReport()
  assert.ok(
    record.immediate.people.every(u => u.guard && u.inside === null && u.work === null),
    'shipped Guard must release every selected Brave through the normal task/occupancy owner'
  )
  await pauseGame(page)
  return record
}

// Passed directly to Playwright: observation only, no game mutation or clock step.
// A protected ID may still be approaching the hut; guard eligibility must not
// depend on whether admission has happened yet.
function observeGuardedFixture({ ids, mode = null, afterTurn = 0, wake = false }) {
  const scene = window.testScene,
    world = scene.world,
    hutId = window.hutSmoke.hutId,
    hut = world.buildings.find(b => b.id === hutId),
    smoke = scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke,
    braves = world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0),
    pendingIds = braves.filter(u => !u.guard && !ids.includes(u.id)).map(u => u.id),
    residentIds = world.units.filter(u => u.hp > 0 && u.inside === hutId).map(u => u.id),
    incomingIds = world.units
      .filter(u => u.hp > 0 && u.work === hutId && u.inside !== hutId)
      .map(u => u.id),
    cohort = ids.map(id => {
      const u = world.units.find(u => u.id === id)
      return { id, hp: u?.hp ?? 0, inside: u?.inside, work: u?.work, guard: u?.guard }
    }),
    smokeReady =
      mode === 'absent'
        ? smoke?.state.root === null && !smoke.group.visible
        : smoke?.state.root?.mode === mode && smoke.group.visible,
    ready =
      !pendingIds.length &&
      world.turn >= afterTurn &&
      hut?.admission?.inside === ids.length &&
      residentIds.length === ids.length &&
      ids.every(id => residentIds.includes(id)) &&
      !incomingIds.length &&
      !!smokeReady
  return wake
    ? pendingIds.length > 0 || ready
    : {
        turn: world.turn,
        pendingIds,
        residentIds,
        incomingIds,
        cohort,
        ready,
      }
}

async function focusBrave(page, id) {
  const count = await page.evaluate(
    () =>
      window.testScene.world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
        .length
  )
  // The shipped HUD right-click cycles actual people; Shift includes occupants.
  for (let i = 0; i <= count; i++) {
    await page
      .getByRole('button', { name: 'Select brave', exact: true })
      .click({ button: 'right', modifiers: ['Shift'] })
    if (await page.evaluate(id => window.testScene.hudFocus[2] === id, id)) {
      await page.waitForFunction(() => !window.testScene.cameraMotion.active)
      return
    }
  }
  throw new Error('HUD focus cycle could not reach Brave ' + id)
}

async function selectNewcomer(page, id) {
  await clearSelection(page)
  let point = await renderedPersonTarget(page, id, false),
    focused = false
  const inside = await page.evaluate(
    id => window.testScene.world.units.find(u => u.id === id)?.inside,
    id
  )
  if (inside == null && !point) {
    await focusBrave(page, id)
    focused = true
    point = await renderedPersonTarget(page, id, false)
  }
  if (inside != null) {
    if (
      !(await page.evaluate(id => {
        const scene = window.testScene,
          b = scene.world.buildings.find(b => b.id === id)
        return b && scene.visible(b)
      }, inside))
    ) {
      await focusBrave(page, id)
      focused = true
    }
    const target = await resolveHutDispatch(page, inside)
    await page.mouse.move(target.x, target.y)
    await page.locator('.training-panel:visible button[data-person="' + id + '"]').click()
  } else {
    assert.ok(point, 'New Brave ' + id + ' has no rendered selection point after HUD focus')
    await page.mouse.click(point.x, point.y)
  }
  assert.deepEqual(await page.evaluate(() => [...window.testScene.world.selected]), [id])
  return { id, inside, point, focused }
}

async function guardNewcomers(page, ids) {
  await pauseGame(page)
  for (let attempts = 0; attempts < 32; attempts++) {
    const observation = await page.evaluate(observeGuardedFixture, { ids })
    assert.ok(
      observation.cohort.every(u => u.hp > 0),
      'Controlled resident must remain alive'
    )
    const id = observation.pendingIds[0]
    if (id === undefined) return
    const receipt = { stage: report.stage, observation, id, protectedIds: [...ids] }
    report.newcomerOrders.push(receipt)
    writeReport()
    receipt.selection = await selectNewcomer(page, id)
    receipt.guard = await guardSelected(page, [id], ids)
    writeReport()
    if (receipt.selection.focused) await focusSettlement(page)
  }
  throw new Error('Newcomer guarding exceeded its bounded 32-person input batch')
}

async function waitForGuardedSmoke(page, ids, mode, afterTurn = 0) {
  const options = { ids: [...ids], mode, afterTurn },
    deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    await guardNewcomers(page, ids)
    const observed = await page.evaluate(observeGuardedFixture, options)
    if (observed.ready) return smokeSnapshot(page)
    await resumeGame(page)
    await page.waitForFunction(
      observeGuardedFixture,
      { ...options, wake: true },
      {
        timeout: Math.max(1, deadline - Date.now()),
      }
    )
    // Recheck after the real Pause click; new people may appear during its latency.
    await pauseGame(page)
  }
  throw new Error('Controlled ' + mode + ' smoke did not settle within 60 seconds')
}

async function chooseHudResidents(page, count) {
  await pauseGame(page)
  await clearSelection(page)
  const button = page.getByRole('button', { name: 'Select brave', exact: true })
  for (let i = 0; i < count; i++) await button.click()
  const selected = await page.evaluate(() => {
    const world = window.testScene.world
    return world.selected.map(id => {
      const u = world.units.find(candidate => candidate.id === id)
      return {
        id,
        hp: u?.hp ?? 0,
        guard: !!u?.guard,
        inside: u?.inside ?? null,
        work: u?.work ?? null,
      }
    })
  })
  assert.equal(
    selected.length,
    count,
    'HUD brave selection must return the requested resident count'
  )
  assert.ok(
    selected.every(u => u.hp > 0 && u.guard && u.inside === null && u.work === null),
    'HUD brave selection must return only guarded free residents'
  )
  return selected.map(u => u.id)
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

async function resolveHutDispatch(page, buildingId = null, requireCommand = true) {
  return page.evaluate(
    async ({ buildingId, requireCommand }) => {
      const scene = window.testScene,
        world = scene.world,
        hut = world.buildings.find(
          building => building.id === (buildingId ?? window.hutSmoke.hutId)
        ),
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
          if (hit !== scene.renderer.domElement || scene.picking.pickPerson(event)) continue
          const pickingId = scene.picking.pick(event),
            object = scene.pickWorldObject(event),
            context = object && liveCommandContext(world, object),
            commandReady =
              !requireCommand ||
              (context?.enabled && context.model === 8 && context.building?.id === hut.id)
          if (pickingId === hut.id && object?.id === hut.id && commandReady)
            return {
              x: event.clientX,
              y: event.clientY,
              projected: center,
              pickingId,
              objectId: object.id,
              contextModel: context?.model ?? null,
            }
        }
      throw new Error(
        requireCommand
          ? 'No rendered fresh-hut point with enabled command-8 context'
          : 'No rendered fresh-hut pointer hit'
      )
    },
    { buildingId, requireCommand }
  )
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
      turn: world.turn,
      progress: hut.progress,
      level: hut.level,
      residentIds: world.units.filter(u => u.inside === hut.id && u.hp > 0).map(u => u.id),
      incomingIds: world.units
        .filter(u => u.work === hut.id && u.inside !== hut.id && u.hp > 0)
        .map(u => u.id),
      unguardedOutsideIds: world.units
        .filter(
          u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null && !u.guard
        )
        .map(u => u.id),
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
    renderer.render(scene.scene, scene.camera)
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
  const alreadySelected = await page.evaluate(ids => {
    const selected = window.testScene.world.selected
    return selected.length === ids.length && ids.every(id => selected.includes(id))
  }, ids)
  if (!alreadySelected) await selectRenderedPeople(page, ids)
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
  const record = { target, before }
  ;(report.admissionOrders ??= []).push(record)
  writeReport()
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
  record.immediate = immediate
  writeReport()
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

async function departOne(page, cohort) {
  await guardNewcomers(page, cohort)
  await clearSelection(page)
  const hutTarget = await resolveHutDispatch(page, null, false)
  await page.mouse.move(hutTarget.x, hutTarget.y)
  const panel = page.getByRole('group', { name: /^Hut: [0-9]+ of [0-9]+ occupants$/ })
  await panel.waitFor({ state: 'visible' })
  const occupant = panel.getByRole('button', { name: /^Occupant [0-9]+:/ }).first(),
    id = Number(await occupant.getAttribute('data-person'))
  assert.ok(cohort.includes(id), 'Departure must select a controlled resident identity')
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
  const record = { id, hutTarget, before }
  ;(report.departureOrders ??= []).push(record)
  writeReport()
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
  record.groundTarget = groundTarget
  record.immediate = immediate
  writeReport()
  assert.ok(immediate.lastOrderTurn >= before.turn && immediate.lastOrderTurn <= immediate.turn)
  assert.equal(immediate.unitInside, null)
  assert.equal(immediate.residents, before.residents - 1)
  assert.equal(immediate.admissionInside, before.admissionInside - 1)
  // Hold this released Brave outside; an unguarded idle person can re-enter
  // before the next 32-count smoke sample even after a successful ground order.
  const guard = await guardSelected(
    page,
    [id],
    cohort.filter(person => person !== id)
  )
  return { id, hutTarget, groundTarget, before, immediate, guard }
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
let page, errors
try {
  stage('construction')
  ;({ page, errors } = await openGame(browser, 1))
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
  await pauseGame(page)
  await page.evaluate(hutId => {
    window.hutSmoke = { hutId }
  }, hutId)
  await page.waitForFunction(hutId => {
    const scene = window.testScene
    return !!scene.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
  }, hutId)
  // Completion releases builders, not a stable empty-hut promise. Retain the
  // observed occupancy, then issue a normal order to the entire live Brave cohort.
  report.completedConstruction = await smokeSnapshot(page)
  stage('guard staging')
  await clearSelection(page)
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  const stagedIds = await page.evaluate(() =>
    window.testScene.world.units
      .filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
      .map(u => u.id)
  )
  report.staging = await guardSelected(page, stagedIds)
  stage('absent smoke after normal release')
  await guardNewcomers(page, [])

  let state = await smokeSnapshot(page)
  assert.ok(state)
  assert.equal(state.occupants, 0)
  assert.equal(state.admissionInside, 0)
  assert.equal(state.capacity, 3)
  assert.equal(state.socketIndex, 3)
  const turnsToProducer = (32 - (state.counter & 31)) & 31 || 32
  state = await waitForGuardedSmoke(page, [], 'absent', state.turn + turnsToProducer)
  assert.equal(state.occupants, 0)
  assert.equal(state.admissionInside, 0)
  assert.deepEqual(state.incomingIds, [])
  assert.equal(state.root, null)
  assert.equal(state.visible, false)
  report.zero = state
  await page.screenshot({ path: reportPath.replace('.json', '-zero.png') })
  writeReport()

  const residentIds = await chooseHudResidents(page, 1)
  stage('partial admission')

  const partialDispatch = await admissionDispatch(page, [residentIds[0]])
  report.partialDispatch = partialDispatch
  state = await waitForGuardedSmoke(page, residentIds, 'partial')
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
  await page.screenshot({ path: reportPath.replace('.json', '-partial.png') })
  writeReport()

  const additionalResidents = await chooseHudResidents(page, 2)
  residentIds.push(...additionalResidents)
  stage('full admission')
  const fullDispatch = await admissionDispatch(page, additionalResidents)
  report.fullDispatch = fullDispatch
  state = await waitForGuardedSmoke(page, residentIds, 'full')
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
  await page.screenshot({ path: reportPath.replace('.json', '-full.png') })
  writeReport()

  stage('pause and checkpoint save')
  const pausedBefore = await smokeSnapshot(page)
  await page.waitForTimeout(300)
  const pausedAfter = await smokeSnapshot(page)
  report.pause = { before: pausedBefore, after: pausedAfter }
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
  await closeMenuForGameplay(page)

  stage('full to partial departure')
  const firstDeparture = await departOne(page, residentIds)
  report.firstDeparture = firstDeparture
  let remainingIds = residentIds.filter(id => id !== firstDeparture.id)
  state = await waitForGuardedSmoke(page, remainingIds, 'partial')
  assert.equal(state.occupants, 2)
  assert.equal(state.root.mode, 'partial')
  assert.deepEqual(state.position, state.expected)

  assert.equal(state.admissionInside, 2)
  assert.deepEqual(state.atlas, state.expectedAtlas)
  assert.equal(state.sequence, 'hutSmokePartial')
  const reversePixels = await renderedPixels(page)
  assert.ok(reversePixels > 20, 'reverse partial smoke must contribute visible pixels')
  report.partialAfterDeparture = { ...state, pixels: reversePixels }
  await page.screenshot({ path: reportPath.replace('.json', '-reverse-partial.png') })
  stage('partial to absent departures')
  report.secondDeparture = await departOne(page, remainingIds)
  remainingIds = remainingIds.filter(id => id !== report.secondDeparture.id)
  report.thirdDeparture = await departOne(page, remainingIds)
  state = await waitForGuardedSmoke(page, [], 'absent')
  assert.equal(state.occupants, 0)
  assert.equal(state.admissionInside, 0)
  assert.equal(state.root, null)
  assert.equal(state.visible, false)
  report.emptyAgain = state
  await page.screenshot({ path: reportPath.replace('.json', '-empty-again.png') })
  writeReport()

  stage('checkpoint restore')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  state = await waitForGuardedSmoke(page, residentIds, 'full')
  assert.equal(state.occupants, 3)
  assert.equal(state.root.mode, 'full')
  assert.deepEqual(state.position, state.expected)
  assert.equal(state.frameSource >= 1329 && state.frameSource <= 1344, true)
  assert.deepEqual(state.atlas, state.expectedAtlas)
  assert.deepEqual(errors, [])
  report.checkpoint = state
  report.errors = errors
  report.stage = 'complete'
  report.result =
    'PASS rendered construction; continuous newcomer Guard with protected cohort; absent/partial/full/reverse native HFX/socket smoke; pause; checkpoint'
  writeReport()
  console.log(
    'PASS: rendered Mission 1 hut construction followed by shipped Guard release establishes zero occupancy; real resident input drives model75 partial HFX1385-1400 then model74 full HFX1329-1344 at capacity socket 3; full→partial→empty, pause and checkpoint restoration pass; supported capacities remain sockets 3/4/5; secondary full-hut child puffs remain excluded; evidence ' +
      reportPath
  )
} catch (error) {
  report.result = 'FAIL'
  report.failure = { stage: report.stage, message: error.message, stack: error.stack }
  report.lastSnapshot = page ? await smokeSnapshot(page).catch(() => null) : null
  report.errors = errors ?? []
  if (page)
    await page.screenshot({ path: reportPath.replace('.json', '-failure.png') }).catch(() => {})
  writeReport()
  throw error
} finally {
  await browser.close()
}
