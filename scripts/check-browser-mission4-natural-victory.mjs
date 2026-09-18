import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const projectRoot = process.cwd(),
  artifactDir = resolve(
    process.env.PND_QUEUE_OUTPUT ??
      process.env.POPULOUS_ARTIFACT_DIR ??
      `work/orchestration/mission4-natural-victory-${process.pid}`
  ),
  port = Number(process.env.PND_MISSION4_PORT ?? 4323)
mkdirSync(artifactDir, { recursive: true })
let server

async function startServer() {
  if (process.env.POPULOUS_URL) return
  const log = openSync(resolve(artifactDir, 'server.log'), 'a')
  server = spawn(
    resolve(projectRoot, 'node_modules/.bin/vinext'),
    ['dev', '--port', String(port)],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', log, log],
      env: { ...process.env, WRANGLER_LOG_PATH: resolve(artifactDir, 'wrangler.log') },
    }
  )
  process.env.POPULOUS_URL = `http://localhost:${port}`
  for (let i = 0; i < 480; i++) {
    if (server.exitCode !== null) throw new Error(`dev server exited with ${server.exitCode}`)
    try {
      const response = await fetch(process.env.POPULOUS_URL)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('dev server readiness timed out')
}

async function waitForServerExit(timeoutMs) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return true
  return await new Promise(resolveExit => {
    let timeout
    const onExit = () => finish(true),
      finish = exited => {
        if (timeout) clearTimeout(timeout)
        server.off('exit', onExit)
        resolveExit(exited)
      }
    server.once('exit', onExit)
    if (server.exitCode !== null || server.signalCode !== null) return finish(true)
    timeout = setTimeout(
      () => finish(server.exitCode !== null || server.signalCode !== null),
      timeoutMs
    )
  })
}

async function stopServer() {
  if (!server) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {}
  if (await waitForServerExit(5000)) return
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {}
  if (!(await waitForServerExit(5000))) throw new Error('dev server did not exit after SIGKILL')
}

function cleanupReceipt() {
  if (!process.env.PND_QUEUE_CLEANUP) return
  const receipt = {
      jobId: process.env.PND_QUEUE_JOB_ID,
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: server ? [{ pid: server.pid, group: true }] : [],
    },
    temporary = `${process.env.PND_QUEUE_CLEANUP}.tmp`
  writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`)
  renameSync(temporary, process.env.PND_QUEUE_CLEANUP)
}
const report = {
  startedAt: new Date().toISOString(),
  jobId: process.env.PND_QUEUE_JOB_ID ?? null,
  stages: [],
  limits: [
    'Starts Mission 4 directly through the shipped mission selector; Mission 3 -> 4 chain remains owned by #85.',
    'Accelerated time advances only ordinary tick(world, 1/12) calls while this checker owns and suspends scene RAF.',
    'No team/kind/population/killCredits/status/outcome/reward/stock or entity-position fixture mutation is used.',
  ],
}
const record = (name, evidence) => report.stages.push({ name, ...evidence })
const wrapped = value => ((((value + 128) % 256) + 256) % 256) - 128

async function snapshot(page) {
  return page.evaluate(() => {
    const world = window.testStore.getWorld()
    return {
      level: world.outcome.level,
      status: world.status,
      turn: world.turn,
      inputMask: world.inputMask,
      lastOrderTurn: world.lastOrderTurn,
      unlockedTower: world.unlockedTower,
      shots: { ...world.shots },
      selected: [...world.selected],
      completedLevel: world.outcome.completedLevel,
      cameraPlaying: world.outcome.cameraPlaying,
      populationAll: {
        blue: world.units.filter(unit => unit.team === 'blue').length,
        green: world.units.filter(unit => unit.team === 'green').length,
        wild: world.units.filter(unit => unit.team === 'wild').length,
      },
      units: world.units
        .filter(unit => unit.hp > 0)
        .map(unit => ({
          id: unit.id,
          team: unit.team,
          kind: unit.kind,
          x: unit.x,
          z: unit.z,
          hp: unit.hp,
          inside: unit.inside,
          work: unit.work,
          target: unit.target,
        })),
      buildings: world.buildings
        .filter(building => building.hp > 0)
        .map(building => ({
          id: building.id,
          team: building.team,
          kind: building.kind,
          x: building.x,
          z: building.z,
          progress: building.progress,
        })),
      shrines: world.shrines.map(shrine => ({
        id: shrine.id,
        kind: shrine.kind,
        reward: shrine.reward,
        x: shrine.x,
        z: shrine.z,
        uses: shrine.uses,
        remaining: shrine.remaining,
      })),
      completedMissions: window.testStore.getCompletedMissions(),
    }
  })
}

async function ownRaf(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    window.__mission4SetRafHold?.(true)
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
    window.__mission4NaturalOwnsRaf = true
  })
}

async function renderOwnedFrame(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    if (!window.__mission4NaturalOwnsRaf || scene.frame)
      throw new Error('Mission 4 checker does not own RAF')
    const now = performance.now()
    scene.previous = now
    scene.animate(now)
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
  })
}

async function advance(page, turns) {
  return page.evaluate(async turns => {
    const scene = window.testScene,
      world = window.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    if (!window.__mission4NaturalOwnsRaf || scene.frame)
      throw new Error('Accelerated turns require explicit RAF ownership')
    for (let i = 0; i < turns && world.status === 'playing'; i++) tick(world, 1 / 12)
    window.testStore.update()
    const now = performance.now()
    scene.previous = now
    scene.animate(now)
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
    return { turn: world.turn, status: world.status }
  }, turns)
}

async function advanceUntil(page, condition, limit, label, required = true) {
  const result = await page.evaluate(
    async ({ condition, limit }) => {
      const scene = window.testScene,
        world = window.testStore.getWorld(),
        { tick } = await import('/app/model.ts'),
        ready = () => {
          if (condition.type === 'shots') return world.shots[condition.spell] >= condition.count
          if (condition.type === 'blue-count')
            return (
              world.units.filter(unit => unit.team === 'blue' && unit.hp > 0).length >=
              condition.count
            )
          if (condition.type === 'tower-unlocked') return world.unlockedTower
          if (condition.type === 'building-complete')
            return world.buildings.some(
              building => building.id === condition.id && building.hp > 0 && building.progress === 1
            )
          if (condition.type === 'building-staffed')
            return world.units.some(unit => unit.hp > 0 && unit.inside === condition.id)
          if (condition.type === 'unit-dead')
            return !world.units.some(unit => unit.id === condition.id && unit.hp > 0)
          if (condition.type === 'shaman')
            return world.units.some(
              unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
            )
          if (condition.type === 'flyby') return !!(world.flyby.flags & 1)
          if (condition.type === 'status') return world.status === condition.status
          throw new Error(`Unknown condition ${condition.type}`)
        }
      if (!window.__mission4NaturalOwnsRaf || scene.frame)
        throw new Error('Accelerated turns require explicit RAF ownership')
      for (let i = 0; i < limit && world.status === 'playing' && !ready(); i++) tick(world, 1 / 12)
      window.testStore.update()
      const now = performance.now()
      scene.previous = now
      scene.animate(now)
      if (scene.frame) cancelAnimationFrame(scene.frame)
      scene.frame = 0
      scene.previous = null
      return {
        ready: ready(),
        turn: world.turn,
        status: world.status,
        selected: [...world.selected],
        blue: world.units.filter(unit => unit.team === 'blue' && unit.hp > 0).length,
        green: world.units.filter(unit => unit.team === 'green' && unit.hp > 0).length,
      }
    },
    { condition, limit }
  )
  if (required) assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
}

async function releaseRaf(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
    window.__mission4NaturalOwnsRaf = false
    window.__mission4SetRafHold?.(false)
    scene.frame = requestAnimationFrame(scene.animate)
  })
}

async function entityPoint(page, collection, id) {
  return page.evaluate(
    ({ collection, id }) => {
      const scene = window.testScene,
        world = window.testStore.getWorld(),
        object = world[collection].find(candidate => candidate.id === id),
        bounds = scene.container.getBoundingClientRect()
      if (!object) throw new Error(`Missing ${collection} object ${id}`)
      scene.focus(object)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const mesh =
          collection === 'units'
            ? scene.unitMeshes.get(id)
            : collection === 'buildings'
              ? scene.buildingMeshes.get(id)
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
            picked = unit ? person : person !== null ? undefined : scene.pickWorldObject(event)?.id
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

async function groundPoint(page, point, buildingKind, maxRadius = 24) {
  return page.evaluate(
    async ({ point, buildingKind, maxRadius }) => {
      const scene = window.testScene,
        bounds = scene.container.getBoundingClientRect(),
        placementError = buildingKind ? (await import('/app/model.ts')).placementError : undefined
      scene.focus(point)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      for (let radius = 0; radius <= maxRadius; radius += 2)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const candidate = {
              x: point.x + Math.cos(angle) * radius,
              z: point.z + Math.sin(angle) * radius,
            },
            projected = scene.screen(candidate),
            event = {
              clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
              clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
            },
            picked = scene.pick(event)
          if (
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
            scene.picking.pick(event) === null &&
            picked &&
            (!placementError || !placementError(scene.world, buildingKind, picked)) &&
            Math.hypot(picked.x - candidate.x, picked.z - candidate.z) < 2
          )
            return { x: event.clientX, y: event.clientY, point: { x: picked.x, z: picked.z } }
        }
      throw new Error(`No rendered ground point near ${point.x},${point.z}`)
    },
    { point, buildingKind, maxRadius }
  )
}

async function clickEntity(page, collection, id) {
  const point = await entityPoint(page, collection, id)
  await page.mouse.click(point.x, point.y)
}

async function clearSelection(page) {
  for (let attempt = 0; attempt < 2 && (await snapshot(page)).selected.length; attempt++)
    await page.keyboard.press('Escape')
  await page.waitForFunction(() => window.testStore.getWorld().selected.length === 0)
}

async function selectShaman(page, clear = true) {
  if (clear) await clearSelection(page)
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  const selected = await page.evaluate(() => {
    const world = window.testStore.getWorld()
    return world.selected.some(id =>
      world.units.some(
        unit => unit.id === id && unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
      )
    )
  })
  assert.ok(selected, 'Shaman was not selected through the shipped portrait control')
}

async function selectBraves(page, mode = 'all', clear = true) {
  if (clear) await clearSelection(page)
  const button = page.getByRole('button', { name: 'Select brave', exact: true })
  await button.click(mode === 'all' ? { modifiers: ['Shift'] } : {})
  const selected = await page.evaluate(() => {
    const world = window.testStore.getWorld()
    return world.selected.filter(id =>
      world.units.some(
        unit => unit.id === id && unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0
      )
    ).length
  })
  assert.ok(selected > 0, `No Braves selected through the shipped class control (${mode})`)
  return selected
}

async function selectArmy(page) {
  await advanceUntil(page, { type: 'shaman' }, 5000, 'Blue Shaman availability')
  await selectShaman(page, true)
  const braveCount = (await snapshot(page)).units.filter(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0
  ).length
  if (braveCount) await selectBraves(page, 'all', false)
  const selected = (await snapshot(page)).selected.length
  assert.ok(selected > 0, 'No attack group selected')
  return selected
}

async function worshipReward(page, reward) {
  const shrine = (await snapshot(page)).shrines.find(candidate => candidate.reward === reward)
  assert.ok(shrine, `Missing ${reward} shrine`)
  await selectShaman(page)
  const before = (await snapshot(page)).lastOrderTurn
  await clickEntity(page, 'shrines', shrine.id)
  const accepted = await page.evaluate(
    ({ id, before }) => {
      const world = window.testStore.getWorld()
      return {
        lastOrderTurn: world.lastOrderTurn,
        work: world.units.find(
          unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
        )?.work,
        inputMask: world.inputMask,
        selected: [...world.selected],
        accepted:
          world.lastOrderTurn >= before &&
          world.units.some(
            unit =>
              unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0 && unit.work === id
          ),
      }
    },
    { id: shrine.id, before }
  )
  assert.ok(
    accepted.accepted,
    `${reward} worship command was not accepted: ${JSON.stringify(accepted)}`
  )
  return shrine
}

async function convertOneWild(page) {
  let current = await snapshot(page)
  const shaman = current.units.find(
    unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
  )
  assert.ok(shaman, 'Missing Blue Shaman for Convert Wild')
  const wild = current.units
    .filter(unit => unit.team === 'wild' && unit.hp > 0 && unit.inside === null)
    .toSorted(
      (a, b) =>
        Math.hypot(wrapped(a.x - shaman.x), wrapped(a.z - shaman.z)) -
        Math.hypot(wrapped(b.x - shaman.x), wrapped(b.z - shaman.z))
    )[0]
  assert.ok(wild, 'No live Wildman available for Convert Wild')
  const blueBefore = current.units.filter(unit => unit.team === 'blue').length,
    shotsBefore = current.shots.convertWild
  await selectShaman(page)
  const target = await entityPoint(page, 'units', wild.id)
  await page.getByRole('button', { name: /^spells/ }).click()
  await page.getByRole('button', { name: /^Convert Wild, / }).click()
  await page.mouse.click(target.x, target.y)
  await advance(page, 1)
  current = await snapshot(page)
  assert.equal(
    current.shots.convertWild,
    shotsBefore - 1,
    `Convert Wild did not consume a real shot on Wildman ${wild.id}`
  )
  await advanceUntil(
    page,
    { type: 'blue-count', count: blueBefore + 1 },
    1000,
    `Wildman ${wild.id} conversion`
  )
  return wild.id
}

async function validTowerPoint(page, preferred) {
  return page.evaluate(async preferred => {
    const world = window.testStore.getWorld(),
      { placementError } = await import('/app/model.ts')
    for (let radius = 0; radius <= 24; radius += 2)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const point = {
          x: preferred.x + Math.cos(angle) * radius,
          z: preferred.z + Math.sin(angle) * radius,
        }
        if (!placementError(world, 'tower', point)) return point
      }
    throw new Error(`No valid Guard Tower placement near ${preferred.x},${preferred.z}`)
  }, preferred)
}

async function buildGuardTower(page) {
  const before = new Set((await snapshot(page)).buildings.map(building => building.id)),
    ground = await groundPoint(page, await validTowerPoint(page, { x: 36, z: -26 }), 'tower')
  await selectBraves(page, 'all')
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const towerButton = page.getByRole('button', { name: 'Guard Tower, 5 wood', exact: true })
  assert.equal(await towerButton.isDisabled(), false, 'Guard Tower control must be unlocked')
  await towerButton.click()
  await page.mouse.click(ground.x, ground.y)
  const tower = (await snapshot(page)).buildings.find(building => !before.has(building.id))
  assert.ok(tower, 'Guard Tower was not placed through rendered building controls')
  await advanceUntil(
    page,
    { type: 'building-complete', id: tower.id },
    20_000,
    'Guard Tower construction'
  )
  return tower
}

async function staffTower(page, tower) {
  await selectBraves(page, 'single')
  const before = (await snapshot(page)).lastOrderTurn
  await clickEntity(page, 'buildings', tower.id)
  const accepted = await page.evaluate(before => {
    const world = window.testStore.getWorld()
    return world.lastOrderTurn >= before
  }, before)
  assert.ok(accepted, 'Guard Tower staffing click did not issue an ordinary order')
  await advanceUntil(page, { type: 'building-staffed', id: tower.id }, 5000, 'Guard Tower staffing')
  return (await snapshot(page)).units.find(unit => unit.inside === tower.id)?.id
}

async function attackMatak(page) {
  const attacks = []
  for (let attempt = 0; attempt < 24; attempt++) {
    const current = await snapshot(page)
    if (current.status !== 'playing') break
    const green = current.units.filter(unit => unit.team === 'green' && unit.hp > 0)
    if (!green.length) break
    const target =
      green.find(unit => unit.kind !== 'shaman' && unit.inside === null) ??
      green.find(unit => unit.inside === null)
    if (!target) {
      await advance(page, 600)
      continue
    }
    const selected = await selectArmy(page),
      beforeState = await snapshot(page),
      before = beforeState.lastOrderTurn,
      selectedIds = beforeState.selected
    await clickEntity(page, 'units', target.id)
    const dispatch = await page.evaluate(
      ({ target, before, selectedIds }) => {
        const world = window.testStore.getWorld(),
          attackers = new Set(selectedIds)
        return {
          accepted: world.lastOrderTurn > before,
          before,
          after: world.lastOrderTurn,
          assigned: world.units.filter(unit => attackers.has(unit.id) && unit.target === target).length,
          selected: [...world.selected],
        }
      },
      { target: target.id, before, selectedIds }
    )
    assert.ok(
      dispatch.accepted || dispatch.assigned > 0,
      `Rendered attack on Matak ${target.id} was not accepted: ${JSON.stringify(dispatch)}`
    )
    const result = await advanceUntil(
      page,
      { type: 'unit-dead', id: target.id },
      5000,
      `Matak ${target.id} defeat`,
      false
    )
    attacks.push({
      target: target.id,
      kind: target.kind,
      selected,
      dead: result.ready,
      turn: result.turn,
    })
  }
  await advanceUntil(page, { type: 'status', status: 'won' }, 2000, 'Mission 4 generic victory')
  return attacks
}

async function waitForStoredMissionFour(page) {
  await page.waitForFunction(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    if (!database.objectStoreNames.contains('checkpoints')) return false
    const value = await new Promise((resolve, reject) => {
      const transaction = database.transaction('checkpoints', 'readonly'),
        request = transaction.objectStore('checkpoints').get('profile')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return value?.version === 1 && Array.isArray(value.completed) && value.completed.includes(4)
  })
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  await page.addInitScript(() => {
    const requestFrame = window.requestAnimationFrame.bind(window)
    let held = true
    window.requestAnimationFrame = callback => (held ? 0 : requestFrame(callback))
    window.__mission4SetRafHold = value => {
      held = value
    }
  })
  page.setDefaultTimeout(30_000)
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 4', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  await page.waitForFunction(() => window.testStore.getWorld().outcome.level === 4)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await ownRaf(page)
  await renderOwnedFrame(page)

  const authoredStart = await snapshot(page)
  record('startup-authored', {
    turn: authoredStart.turn,
    populations: authoredStart.populationAll,
    livePopulations: {
      blue: authoredStart.units.filter(unit => unit.team === 'blue').length,
      green: authoredStart.units.filter(unit => unit.team === 'green').length,
      wild: authoredStart.units.filter(unit => unit.team === 'wild').length,
    },
    rewards: authoredStart.shrines.map(shrine => shrine.reward),
  })
  assert.equal(authoredStart.level, 4)
  assert.equal(authoredStart.status, 'playing')
  assert.deepEqual(authoredStart.populationAll, { blue: 1, green: 7, wild: 53 })
  assert.deepEqual(
    authoredStart.shrines.map(shrine => shrine.reward),
    ['tower', 'convertWild', 'lightning']
  )

  await advanceUntil(page, { type: 'flyby' }, 64, 'Mission 4 opening flyby')
  await releaseRaf(page)
  const skip = page.getByRole('button', { name: 'Skip introduction', exact: false })
  await skip.waitFor()
  await skip.click()
  await page.waitForFunction(() => !(window.testStore.getWorld().inputMask & 64))
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await ownRaf(page)
  await renderOwnedFrame(page)
  const afterIntro = await snapshot(page)
  record('intro-skip', {
    turn: afterIntro.turn,
    populations: {
      blue: afterIntro.units.filter(unit => unit.team === 'blue').length,
      green: afterIntro.units.filter(unit => unit.team === 'green').length,
      wild: afterIntro.units.filter(unit => unit.team === 'wild').length,
    },
  })

  const convertHead = await worshipReward(page, 'convertWild')
  await advanceUntil(
    page,
    { type: 'shots', spell: 'convertWild', count: 4 },
    20_000,
    'Convert Wild reward'
  )
  record('convert-worship', {
    shrine: convertHead.id,
    shots: (await snapshot(page)).shots.convertWild,
  })

  const converted = [await convertOneWild(page)]
  const afterConvert = await snapshot(page)
  assert.ok(
    afterConvert.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave').length >= 1
  )
  record('convert-wild', {
    originalWildIds: converted,
    braves: afterConvert.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave').length,
    shots: afterConvert.shots.convertWild,
  })

  const towerVault = await worshipReward(page, 'tower')
  await advanceUntil(page, { type: 'tower-unlocked' }, 20_000, 'Guard Tower discovery')
  record('tower-discovery', { shrine: towerVault.id, unlockedTower: true })

  const tower = await buildGuardTower(page),
    occupant = await staffTower(page, tower)
  assert.ok(occupant, 'Guard Tower has no ordinary staffed follower')
  record('tower-build-staff', { tower: tower.id, occupant })

  const attacks = await attackMatak(page),
    victory = await snapshot(page)
  assert.equal(victory.status, 'won')
  assert.equal(victory.completedLevel, 3)
  assert.ok(victory.completedMissions.includes(4))
  record('victory', {
    turn: victory.turn,
    attacks,
    status: victory.status,
    completedLevel: victory.completedLevel,
    completedMissions: victory.completedMissions,
    greenRemaining: victory.units.filter(unit => unit.team === 'green').length,
  })

  await waitForStoredMissionFour(page)
  await releaseRaf(page)
  await page.waitForFunction(() => !window.testStore.getWorld().outcome.cameraPlaying)
  const continueButton = page.getByRole('button', { name: 'Continue to Mission 5', exact: false })
  await continueButton.waitFor()
  record('result-ui', { continueMission5: true })

  await continueButton.click()
  await page.waitForFunction(() => window.testStore.getWorld().outcome.level === 5)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  record('continuation', { level: 5 })

  await page.reload({ waitUntil: 'networkidle' })
  const completedMissionFour = page.getByRole('button', {
    name: 'Mission 4, completed',
    exact: true,
  })
  await completedMissionFour.waitFor()
  record('persistence', { mission4CompletedAfterReload: true })

  assert.deepEqual(errors, [])
  report.finishedAt = new Date().toISOString()
  report.result = 'PASS'
  writeFileSync(
    resolve(artifactDir, 'mission4-natural-victory-browser.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  console.log(
    `PASS: shipped Mission 4 startup, Convert Wild worship/conversion, Guard Tower discovery/build/staff, rendered attacks, generic victory, persisted completion and Continue to Mission 5 (${attacks.length} attack orders)`
  )
} catch (error) {
  report.finishedAt = new Date().toISOString()
  report.result = 'FAIL'
  report.error = error?.stack ?? String(error)
  writeFileSync(
    resolve(artifactDir, 'mission4-natural-victory-browser.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  throw error
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
