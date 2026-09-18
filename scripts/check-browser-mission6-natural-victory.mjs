import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

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
  server = spawn(resolve(projectRoot, 'node_modules/.bin/vinext'), ['dev', '--port', String(port)], {
    cwd: projectRoot,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, WRANGLER_LOG_PATH: resolve(artifactDir, 'wrangler.log') },
  })
  process.env.POPULOUS_URL = `http://localhost:${port}`
  for (let i = 0; i < 480; i++) {
    if (server.exitCode !== null) throw new Error(`dev server exited with ${server.exitCode}`)
    try {
      const response = await fetch(process.env.POPULOUS_URL)
      if (response.ok) return
    } catch {}
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
    }, onExit = () => done(true)
    server.once('exit', onExit)
    timeout = setTimeout(() => done(server.exitCode !== null || server.signalCode !== null), timeoutMs)
  })
}
async function stopServer() {
  if (!server) return
  try { process.kill(-server.pid, 'SIGTERM') } catch {}
  if (await waitForServerExit(5000)) return
  try { process.kill(-server.pid, 'SIGKILL') } catch {}
  if (!(await waitForServerExit(5000))) throw new Error('dev server did not exit after SIGKILL')
}
function cleanupReceipt() {
  if (!process.env.PND_QUEUE_CLEANUP) return
  const receipt = {
    jobId: process.env.PND_QUEUE_JOB_ID,
    resourcesReleased: true,
    releasedAt: new Date().toISOString(),
    processes: server ? [{ pid: server.pid, group: true }] : [],
  }, temporary = `${process.env.PND_QUEUE_CLEANUP}.tmp`
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
    'This failure-first acceptance stops at the earliest natural-completion blocker; it does not bypass the missing first Matak land connection.',
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
  const result = await page.evaluate(async ({ condition, limit }) => {
    const scene = window.testScene,
      world = window.testStore.getWorld(),
      { tick, findPath } = await import('/app/model.ts'),
      ready = () => {
        if (condition === 'convert-stock') return world.shots.convertWild > 0
        if (condition === 'converted') return world.units.filter(u => u.team === 'blue' && u.hp > 0).length >= 12
        if (condition === 'matak-attack')
          return world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 20)
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
      ready: ready(), ticks, turn: world.turn, status: world.status,
      bridges: world.stats.bridges,
      bridgeEffects: world.effects.filter(effect => effect.bridge).length,
      routeToMatak: blue && green ? findPath(world, blue, { x: green.x, z: green.z }).length : 0,
      populations: Object.fromEntries(
        ['blue', 'yellow', 'green'].map(team => [team, world.units.filter(u => u.team === team && u.hp > 0).length])
      ),
      matakAttack: world.campaignAIs[3].tasks
        .filter(task => task.flags & 1 && task.type === 20)
        .map(task => ({ requested: task.requested, phase: task.phase, members: task.members.length })),
    }
  }, { condition, limit })
  assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
}
async function entityPoint(page, collection, id) {
  return page.evaluate(({ collection, id }) => {
    const scene = window.testScene,
      world = window.testStore.getWorld(),
      object = world[collection].find(candidate => candidate.id === id),
      bounds = scene.container.getBoundingClientRect()
    if (!object) throw new Error(`Missing ${collection} object ${id}`)
    scene.focus(object); scene.onChange(); scene.renderer.render(scene.scene, scene.camera)
    const mesh = collection === 'units' ? scene.unitMeshes.get(id) : scene.shrineMeshes.get(id)?.g,
      projected = scene.screen(mesh?.position ?? object),
      center = { x: bounds.left + ((projected.x + 1) * bounds.width) / 2, y: bounds.top + ((1 - projected.y) * bounds.height) / 2 },
      unit = collection === 'units'
    for (let dy = unit ? -24 : -140; dy <= (unit ? 24 : 60); dy += 4)
      for (let dx = unit ? -36 : -100; dx <= (unit ? 36 : 100); dx += 4) {
        const event = { clientX: center.x + dx, clientY: center.y + dy },
          person = scene.picking.pickPerson(event),
          picked = unit ? person : person !== null ? undefined : scene.pickWorldObject(event)?.id
        if (picked === id && document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No rendered hit point for ${collection} object ${id}`)
  }, { collection, id })
}
async function selectShaman(page) {
  for (let i = 0; i < 2 && (await snapshot(page)).selected.length; i++) await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  assert.ok(await page.evaluate(() => {
    const world = window.testStore.getWorld()
    return world.selected.some(id => world.units.some(u => u.id === id && u.team === 'blue' && u.kind === 'shaman' && u.hp > 0))
  }), 'Shaman selection failed')
}

let browser
try {
  await startServer()
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
  const { page, errors } = await openGame(browser, 6)
  page.setDefaultTimeout(30_000)
  await ownRaf(page)
  const initial = await snapshot(page)
  assert.equal(initial.level, 6)
  assert.deepEqual(initial.populations, { blue: 7, yellow: 8, green: 7, wild: 172 })
  record('fresh-start', { turn: initial.turn, populations: initial.populations, shots: initial.shots })

  const convertVault = initial.shrines.find(shrine => shrine.reward === 'convertWild')
  assert.ok(convertVault, 'Missing authored Mission 6 Convert Wild Vault')
  await selectShaman(page)
  const beforeOrder = (await snapshot(page)).lastOrderTurn,
    vaultPoint = await entityPoint(page, 'shrines', convertVault.id)
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  const dispatch = await page.evaluate(({ before, id }) => {
    const world = window.testStore.getWorld(), shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    return { before, after: world.lastOrderTurn, work: shaman?.work, accepted: world.lastOrderTurn > before || shaman?.work === id }
  }, { before: beforeOrder, id: convertVault.id })
  assert.ok(dispatch.accepted, `Convert Vault rendered command rejected: ${JSON.stringify(dispatch)}`)
  const reward = await advanceUntil(page, 'convert-stock', 3000, 'Convert Wild Vault reward')
  record('ordinary-convert-worship', { dispatch, reward })

  const beforeMatak = await page.evaluate(async () => {
    const world = window.testStore.getWorld(), { findPath } = await import('/app/model.ts'),
      blue = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0),
      green = world.units.find(u => u.team === 'green' && u.kind === 'shaman' && u.hp > 0),
      bridgeVault = world.shrines.find(s => s.reward === 'bridge'),
      raisingHead = world.shrines.find(s => s.kind === 'bridgeEffect')
    return {
      route: blue && green ? findPath(world, blue, { x: green.x, z: green.z }).length : 0,
      bridgeStock: world.shots.bridge,
      bridges: world.stats.bridges,
      bridgeVault: bridgeVault && { id: bridgeVault.id, x: bridgeVault.x, z: bridgeVault.z },
      raisingHead: raisingHead && { id: raisingHead.id, x: raisingHead.x, z: raisingHead.z, target: raisingHead.bridgeTarget },
    }
  })
  assert.deepEqual({ route: beforeMatak.route, bridgeStock: beforeMatak.bridgeStock, bridges: beforeMatak.bridges }, { route: 0, bridgeStock: 0, bridges: 0 })
  record('initial-matak-separation', beforeMatak)

  const horizon = await advanceUntil(page, 'matak-attack', 15000, 'authored Matak first attack allocation')
  record('matak-first-attack-horizon', horizon)

  assert.ok(
    horizon.bridges > 0 || horizon.bridgeEffects > 0 || horizon.routeToMatak > 0,
    `MISSION6_FIRST_LAND_CONNECTION_MISSING: authored Matak attack became active at turn ${horizon.turn}, but fresh Blue still has no bridge/path to Matak: ${JSON.stringify(horizon)}`
  )
  assert.fail('Mission 6 checker reached beyond the expected first-fault boundary without a complete victory route')

  assert.deepEqual(errors, [])
} catch (error) {
  report.finishedAt = new Date().toISOString()
  report.result = 'FAIL'
  report.error = error?.stack ?? String(error)
  writeFileSync(resolve(artifactDir, 'mission6-natural-victory-browser.json'), `${JSON.stringify(report, null, 2)}\n`)
  throw error
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
}
