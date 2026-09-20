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
      `work/orchestration/mission6-natural-victory-${process.pid}`
  ),
  port = Number(process.env.PND_MISSION6_PORT ?? 4324)
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
    } catch {
      // Retry until the guarded local server becomes reachable.
    }
    await new Promise(resolveReady => setTimeout(resolveReady, 250))
  }
  throw new Error('dev server readiness timed out')
}
async function waitForServerExit(timeoutMs) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return true
  return await new Promise(resolveExit => {
    let timeout
    const done = exited => {
        if (timeout) clearTimeout(timeout)
        server.off('exit', onExit)
        resolveExit(exited)
      },
      onExit = () => done(true)
    server.once('exit', onExit)
    timeout = setTimeout(
      () => done(server.exitCode !== null || server.signalCode !== null),
      timeoutMs
    )
  })
}
async function stopServer() {
  if (!server) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    // The process group may already be gone.
  }
  if (await waitForServerExit(5000)) return
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {
    // SIGKILL may race a process that has already exited.
  }
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
  issue: 101,
  startedAt: new Date().toISOString(),
  jobId: process.env.PND_QUEUE_JOB_ID ?? null,
  stages: [],
  limits: [
    'Starts fresh Mission 6 through the shipped mission selector; no prior mission is replayed or seeded won.',
    'No team/kind/population/killCredits/stock/reward/status/outcome/entity-position mutation is used.',
    'Accelerated time advances only ordinary tick(world, 1/12) calls while the checker explicitly owns and suspends scene RAF.',
    'The acceptance follows the repaired authored Matak ATTACK path and stops at the earliest new source fault rather than injecting or bypassing gameplay.',
  ],
}
const record = (name, evidence) => report.stages.push({ name, ...evidence })

async function snapshot(page) {
  return page.evaluate(() => {
    const world = window.testStore.getWorld()
    return {
      level: world.outcome.level,
      status: world.status,
      turn: world.turn,
      lastOrderTurn: world.lastOrderTurn,
      shots: { ...world.shots },
      stats: { ...world.stats },
      populations: Object.fromEntries(
        ['blue', 'yellow', 'green', 'wild'].map(team => [
          team,
          world.units.filter(unit => unit.team === team && unit.hp > 0).length,
        ])
      ),
      selected: [...world.selected],
      units: world.units
        .filter(unit => unit.hp > 0)
        .map(unit => ({
          id: unit.id,
          team: unit.team,
          kind: unit.kind,
          x: unit.x,
          z: unit.z,
          inside: unit.inside,
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
    }
  })
}
async function ownRaf(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    if (scene.frame) cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
    window.__mission6NaturalOwnsRaf = true
  })
}
async function advanceUntil(page, condition, limit, label) {
  const result = await page.evaluate(
    async ({ condition, limit }) => {
      const scene = window.testScene,
        world = window.testStore.getWorld(),
        { tick, findPath } = await import('/app/model.ts'),
        ready = () => {
          if (condition === 'convert-stock') return world.shots.convertWild > 0
          if (condition === 'converted')
            return world.units.filter(u => u.team === 'blue' && u.hp > 0).length >= 12
          if (condition === 'matak-attack')
            return world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 20)
          if (condition === 'matak-phase6')
            return world.campaignAIs[3].tasks.some(
              task => task.flags & 1 && task.type === 20 && task.phase === 6
            )
          if (condition === 'matak-bridge-cast')
            return world.projectiles.some(
              projectile => projectile.spell === 'bridge' && projectile.team === 'green'
            )
          if (condition === 'matak-bridge-resolution')
            return world.stats.bridges > 0 || world.status !== 'playing'
          throw new Error(`Unknown condition ${condition}`)
        }
      if (!window.__mission6NaturalOwnsRaf || scene.frame)
        throw new Error('Accelerated turns require explicit RAF ownership')
      let ticks = 0
      for (; ticks < limit && world.status === 'playing' && !ready(); ticks++) tick(world, 1 / 12)
      window.testStore.update()
      const now = performance.now()
      scene.previous = now
      scene.animate(now)
      if (scene.frame) cancelAnimationFrame(scene.frame)
      scene.frame = 0
      scene.previous = null
      const blue = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0),
        green = world.units.find(u => u.team === 'green' && u.kind === 'shaman' && u.hp > 0)
      return {
        ready: ready(),
        ticks,
        turn: world.turn,
        status: world.status,
        bridges: world.stats.bridges,
        bridgeEffects: world.effects.filter(effect => effect.bridge).length,
        routeToMatak: blue && green ? findPath(world, blue, { x: green.x, z: green.z }).length : 0,
        populations: Object.fromEntries(
          ['blue', 'yellow', 'green'].map(team => [
            team,
            world.units.filter(u => u.team === team && u.hp > 0).length,
          ])
        ),
        matakAttack: world.campaignAIs[3].tasks
          .filter(task => task.flags & 1 && task.type === 20)
          .map(task => ({
            requested: task.requested,
            phase: task.phase,
            members: [...task.members],
            spells: [...(task.spells ?? [])],
            target: task.target,
          })),
        bridgeProjectiles: world.projectiles
          .filter(projectile => projectile.spell === 'bridge')
          .map(projectile => ({
            team: projectile.team,
            source: projectile.source,
            target: projectile.target,
            destination: projectile.destination,
          })),
        matakShaman: (() => {
          const shaman = world.units.find(
            u => u.team === 'green' && u.kind === 'shaman' && u.hp > 0
          )
          return shaman
            ? {
                id: shaman.id,
                state: shaman.native?.state ?? shaman.fight?.motion?.state ?? null,
                x: shaman.x,
                z: shaman.z,
              }
            : null
        })(),
      }
    },
    { condition, limit }
  )
  assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
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
          collection === 'units' ? scene.unitMeshes.get(id) : scene.shrineMeshes.get(id)?.g,
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
async function selectShaman(page) {
  for (let i = 0; i < 2 && (await snapshot(page)).selected.length; i++)
    await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  assert.ok(
    await page.evaluate(() => {
      const world = window.testStore.getWorld()
      return world.selected.some(id =>
        world.units.some(u => u.id === id && u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      )
    }),
    'Shaman selection failed'
  )
}

async function advanceBlueCount(page, count, limit, label) {
  const result = await page.evaluate(
    async ({ count, limit }) => {
      const scene = window.testScene,
        world = window.testStore.getWorld(),
        { tick } = await import('/app/model.ts')
      if (!window.__mission6NaturalOwnsRaf || scene.frame)
        throw new Error('Accelerated turns require explicit RAF ownership')
      let ticks = 0
      const current = () => world.units.filter(unit => unit.team === 'blue' && unit.hp > 0).length
      for (; ticks < limit && world.status === 'playing' && current() < count; ticks++)
        tick(world, 1 / 12)
      window.testStore.update()
      const now = performance.now()
      scene.previous = now
      scene.animate(now)
      if (scene.frame) cancelAnimationFrame(scene.frame)
      scene.frame = 0
      scene.previous = null
      return {
        ready: current() >= count,
        ticks,
        turn: world.turn,
        status: world.status,
        blue: current(),
      }
    },
    { count, limit }
  )
  assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
}

async function convertOneWild(page) {
  const before = await snapshot(page),
    shaman = before.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.ok(shaman, 'Missing Blue Shaman for Convert Wild')
  const candidate = await page.evaluate(async () => {
    const world = window.testStore.getWorld(),
      shaman = world.units.find(
        unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
      ),
      { spellInRange } = await import('/app/spell-casting.ts')
    if (!shaman) return null
    const wrap = value => ((((value + 128) % 256) + 256) % 256) - 128
    return (
      world.units
        .filter(
          unit =>
            unit.team === 'wild' &&
            unit.hp > 0 &&
            unit.inside === null &&
            spellInRange(world, shaman, 17, unit)
        )
        .toSorted(
          (a, b) =>
            Math.hypot(wrap(a.x - shaman.x), wrap(a.z - shaman.z)) -
            Math.hypot(wrap(b.x - shaman.x), wrap(b.z - shaman.z))
        )[0]?.id ?? null
    )
  })
  assert.ok(candidate, 'No in-range Wildman available for Convert Wild')
  const shotsBefore = before.shots.convertWild,
    blueBefore = before.units.filter(unit => unit.team === 'blue').length
  assert.ok(shotsBefore > 0, 'Convert Wild requires real one-off stock')
  await selectShaman(page)
  const target = await entityPoint(page, 'units', candidate)
  await page.getByRole('button', { name: /^spells/ }).click()
  await page.getByRole('button', { name: /^Convert Wild, / }).click()
  await page.mouse.click(target.x, target.y)
  const afterClick = await snapshot(page)
  assert.equal(
    afterClick.shots.convertWild,
    shotsBefore - 1,
    `Convert Wild did not consume a real shot on Wildman ${candidate}`
  )
  const converted = await advanceBlueCount(
    page,
    blueBefore + 1,
    1200,
    `Wildman ${candidate} conversion`
  )
  return { id: candidate, shotsBefore, blueBefore, converted }
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.setDefaultTimeout(60_000)
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  })
  await page.getByRole('button', { name: 'Mission 6', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  await page.waitForFunction(
    () => window.testScene.world.flyby.flags & 1 || !window.testScene.world.inputMask
  )
  await page.evaluate(() => document.querySelector('.skip-introduction')?.click())
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await ownRaf(page)
  const initial = await snapshot(page)
  assert.equal(initial.level, 6)
  assert.deepEqual(initial.populations, { blue: 7, yellow: 8, green: 7, wild: 172 })
  record('fresh-start', {
    turn: initial.turn,
    populations: initial.populations,
    shots: initial.shots,
  })

  const convertVault = initial.shrines.find(shrine => shrine.reward === 'convertWild')
  assert.ok(convertVault, 'Missing authored Mission 6 Convert Wild Vault')
  await selectShaman(page)
  const beforeOrder = (await snapshot(page)).lastOrderTurn,
    vaultPoint = await entityPoint(page, 'shrines', convertVault.id)
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  const dispatch = await page.evaluate(
    ({ before, id }) => {
      const world = window.testStore.getWorld(),
        shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      return {
        before,
        after: world.lastOrderTurn,
        work: shaman?.work,
        accepted: world.lastOrderTurn > before || shaman?.work === id,
      }
    },
    { before: beforeOrder, id: convertVault.id }
  )
  assert.ok(
    dispatch.accepted,
    `Convert Vault rendered command rejected: ${JSON.stringify(dispatch)}`
  )
  const reward = await advanceUntil(page, 'convert-stock', 3000, 'Convert Wild Vault reward')
  record('ordinary-convert-worship', { dispatch, reward })

  const recruits = []
  for (let i = 0; i < 4; i++) {
    const current = await snapshot(page)
    if (current.shots.convertWild <= 0) break
    recruits.push(await convertOneWild(page))
  }
  const recruited = await snapshot(page)
  assert.ok(recruits.length > 0, 'Mission 6 must spend real Convert Wild stock before the raid')
  assert.ok(
    recruited.units.filter(unit => unit.team === 'blue').length >= 7 + recruits.length,
    'Rendered Convert Wild casts must increase the live Blue population'
  )
  record('ordinary-convert-recruitment', {
    recruits,
    blue: recruited.units.filter(unit => unit.team === 'blue').length,
    remainingStock: recruited.shots.convertWild,
  })

  const beforeMatak = await page.evaluate(async () => {
    const world = window.testStore.getWorld(),
      { findPath } = await import('/app/model.ts'),
      blue = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0),
      green = world.units.find(u => u.team === 'green' && u.kind === 'shaman' && u.hp > 0),
      bridgeVault = world.shrines.find(s => s.reward === 'bridge'),
      raisingHead = world.shrines.find(s => s.kind === 'bridgeEffect')
    return {
      route: blue && green ? findPath(world, blue, { x: green.x, z: green.z }).length : 0,
      bridgeStock: world.shots.bridge,
      bridges: world.stats.bridges,
      bridgeVault: bridgeVault && { id: bridgeVault.id, x: bridgeVault.x, z: bridgeVault.z },
      raisingHead: raisingHead && {
        id: raisingHead.id,
        x: raisingHead.x,
        z: raisingHead.z,
        target: raisingHead.bridgeTarget,
      },
    }
  })
  assert.deepEqual(
    {
      route: beforeMatak.route,
      bridgeStock: beforeMatak.bridgeStock,
      bridges: beforeMatak.bridges,
    },
    { route: 0, bridgeStock: 0, bridges: 0 }
  )
  record('initial-matak-separation', beforeMatak)

  const horizon = await advanceUntil(
    page,
    'matak-attack',
    15000,
    'authored Matak first attack allocation'
  )
  record('matak-first-attack-horizon', horizon)
  assert.deepEqual(
    horizon.matakAttack[0]?.spells,
    [12, 3, 2],
    'authored ATTACK spell payload order'
  )

  const phase6 = await advanceUntil(
    page,
    'matak-phase6',
    512,
    'Matak ATTACK phase-6 task spell boundary'
  )
  record('matak-phase6', phase6)
  const task = phase6.matakAttack[0],
    shaman = phase6.matakShaman
  assert.ok(
    task && shaman,
    `Missing live Matak ATTACK/Shaman at phase 6: ${JSON.stringify(phase6)}`
  )
  assert.ok(
    task.members.includes(shaman.id),
    `MISSION6_ATTACK_SHAMAN_ASSIGNMENT_MISSING: native type-20 selection assigns the tribe Shaman when the sixth ATTACK quota is nonzero, but browser phase 6 has Shaman ${shaman.id} state ${shaman.state} outside task members ${JSON.stringify(task.members)}`
  )

  const bridgeCast = await advanceUntil(
    page,
    'matak-bridge-cast',
    256,
    'Matak phase-6 Land Bridge cast'
  )
  record('matak-bridge-cast', bridgeCast)
  assert.deepEqual(
    bridgeCast.matakAttack[0]?.spells,
    [0, 3, 2],
    'successful model12 allocation consumes only Land Bridge'
  )

  const bridgeResolution = await advanceUntil(
    page,
    'matak-bridge-resolution',
    1600,
    'Matak first Land Bridge resolution'
  )
  record('matak-bridge-resolution', bridgeResolution)
  assert.ok(
    bridgeResolution.routeToMatak > 0,
    `MISSION6_ATTACK_PHASE5_BRIDGE_TARGET_STATE_MISMATCH: Matak task Shaman is assigned and model12 is consumed, but the ordinary phase-5/6 state leaves the cast non-connecting: ${JSON.stringify({ bridgeCast, bridgeResolution })}`
  )

  assert.fail(
    'Mission 6 checker reached beyond the first connected Matak bridge without completing the natural route'
  )

  assert.deepEqual(errors, [])
} catch (error) {
  report.finishedAt = new Date().toISOString()
  report.result = 'FAIL'
  report.error = error?.stack ?? String(error)
  writeFileSync(
    resolve(artifactDir, 'mission6-natural-victory-browser.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  throw error
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
