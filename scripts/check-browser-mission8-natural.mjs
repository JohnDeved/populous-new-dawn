import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

assert.ok(
  process.env.PND_QUEUE_JOB_ID && process.env.POPULOUS_URL,
  'Run with the shared supervisor'
)
const output = join(process.env.PND_QUEUE_OUTPUT, 'mission8-natural')
mkdirSync(output)
const report = {
  status: 'RUNNING',
  jobId: process.env.PND_QUEUE_JOB_ID,
  stage: 'startup',
  stages: [],
  batches: 0,
  errors: [],
  limits: [
    'Direct shipped Mission8 selection; no synthetic preceding victory.',
    'Only real selection, minimap, terrain/person clicks, spell cards and checkpoint/Continue controls issue player intent.',
    'QA holds presentation RAF and advances ordinary 1/12-second simulation ticks. Each batch is compared to a structured-clone control.',
    'No actor/position/HP/stock/reward/outcome/terrain injections; no training or worship commands.',
    'Camera settling/rendering is a test-only presentation shortcut, not performance or native GPU proof.',
  ],
}
function save() {
  writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
}
let browser, page
const end = setTimeout(
  () => void browser?.close(),
  Math.max(1, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 15000)
)
process.once('SIGTERM', () => void browser?.close())

async function snapshot(label) {
  const state = await page.evaluate(() => {
    const w = window.testStore.getWorld()
    return {
      turn: w.turn,
      status: w.status,
      inputMask: w.inputMask,
      level: w.outcome.level,
      completedLevel: w.outcome.completedLevel,
      completed: window.testStore.getCompletedMissions(),
      shots: { ...w.shots },
      stats: { ...w.stats },
      killCredits: w.killCredits[0],
      selected: [...w.selected],
      message: w.message,
      routeNotice: w.routeNotice,
      units: w.units
        .filter(u => u.team === 'blue' || u.team === 'red')
        .map(u => ({
          id: u.id,
          team: u.team,
          kind: u.kind,
          x: u.x,
          z: u.z,
          hp: u.hp,
          path: u.path.length,
          target: u.target,
        })),
      shrineUses: w.shrines.map(s => ({ id: s.id, uses: s.uses })),
      buildings: w.buildings.length,
      vehicles: w.vehicles.length,
    }
  })
  if (label) {
    report.stages.push({ label, ...state })
    save()
  }
  return state
}
async function render() {
  await page.evaluate(() => {
    const s = window.testSceneRef.current
    if (!window.mission8RafHeld || s.frame) throw new Error('Lost owned RAF')
    const now = performance.now()
    s.previous = now
    s.animate(now)
    s.previous = null
    if (s.frame) throw new Error('Unexpected scheduled frame')
  })
}
async function bind() {
  await bindGame(page)
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await render()
}
async function advance(turns) {
  const result = await page.evaluate(async turns => {
    const w = window.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    if (!window.mission8RafHeld || window.testSceneRef.current.frame || w.paused)
      throw new Error('Unsafe acceleration')
    const copy = structuredClone(w),
      before = w.turn
    let count = 0
    for (; count < turns && w.status === 'playing'; count++) {
      tick(w, 1 / 12)
      tick(copy, 1 / 12)
    }
    const encode = value =>
      JSON.stringify(value, (_key, v) =>
        v instanceof Map ? [...v] : v instanceof Set ? [...v] : v
      )
    if (encode(w) !== encode(copy)) throw new Error('Paired ordinary-tick state mismatch')
    window.testStore.update()
    return { before, after: w.turn, count, status: w.status }
  }, turns)
  report.batches++
  await render()
  return result
}
async function focus(point) {
  // Read the actual minimap inverse, then click its closest displayed point.
  const screen = await page.evaluate(async target => {
    const s = window.testSceneRef.current,
      { minimapPick } = await import('/app/minimap.ts'),
      { nativePosition, browserPosition, distance } = await import('/app/model.ts'),
      bounds = s.mini.getBoundingClientRect(),
      center = nativePosition(s.world, s.viewPoint),
      heading = Math.round((s.cameraBearing * 1024) / Math.PI)
    let best = null
    for (let y = 4; y < s.mini.height - 4; y += 2)
      for (let x = 4; x < s.mini.width - 4; x += 2) {
        const candidate = browserPosition(
          minimapPick(s.mini.width, s.mini.height, center, heading, { x, y })
        )
        const gap = distance(target, candidate)
        if (!best || gap < best.gap)
          best = {
            x: bounds.left + (x / s.mini.width) * bounds.width,
            y: bounds.top + (y / s.mini.height) * bounds.height,
            gap,
          }
      }
    if (!best || best.gap > 5) throw new Error('Target is not exposed on the minimap')
    return best
  }, point)
  await page.mouse.click(screen.x, screen.y)
  await page.evaluate(() => {
    const s = window.testSceneRef.current
    for (let i = 0; s.cameraMotion.active && i < 64; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  await render()
}
async function hitPoint(point, id = null) {
  await focus(point)
  return page.evaluate(
    ({ point, id }) => {
      const s = window.testSceneRef.current,
        b = s.container.getBoundingClientRect(),
        mesh = id === null ? null : s.unitMeshes.get(id),
        projected = s.screen(mesh?.position ?? point),
        x = b.left + ((projected.x + 1) * b.width) / 2,
        y = b.top + ((1 - projected.y) * b.height) / 2
      for (let dy = -28; dy <= 28; dy += 2)
        for (let dx = -36; dx <= 36; dx += 2) {
          const e = { clientX: x + dx, clientY: y + dy }
          if (document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement) continue
          if (id !== null) {
            if (s.picking.pickPerson(e) === id) return { x: e.clientX, y: e.clientY }
          } else {
            const p = s.pick(e)
            if (p && s.picking.pick(e) === null && Math.hypot(p.x - point.x, p.z - point.z) < 2)
              return { x: e.clientX, y: e.clientY, point: p }
          }
        }
      throw new Error('No genuine rendered hit for ' + JSON.stringify({ point, id }))
    },
    { point, id }
  )
}
async function clear() {
  for (let i = 0; i < 2 && (await snapshot()).selected.length; i++)
    await page.keyboard.press('Escape')
  assert.equal((await snapshot()).selected.length, 0)
}
async function selectParty(includeShaman) {
  await clear()
  if (includeShaman)
    await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  const state = await snapshot()
  const intended = state.units
    .filter(u => u.team === 'blue' && u.hp > 0 && (includeShaman || u.kind === 'brave'))
    .map(u => u.id)
    .sort((a, b) => a - b)
  assert.deepEqual(
    [...state.selected].sort((a, b) => a - b),
    intended,
    'The actual party selection differs'
  )
  assert.ok(intended.length)
}
async function attack(target) {
  await selectParty(false)
  const pointer = await hitPoint(target, target.id)
  await page.mouse.click(pointer.x, pointer.y)
  const result = await page.evaluate(target => {
    const w = window.testStore.getWorld()
    return {
      turn: w.turn,
      lastOrder: w.lastOrderTurn,
      assigned: w.units.filter(u => w.selected.includes(u.id) && u.target === target).length,
    }
  }, target.id)
  assert.ok(result.assigned > 0, 'Actual attack click assigned nobody')
  report.stages.push({ label: 'real-attack', target: target.id, ...result })
  save()
}
async function castAvailableBlast() {
  const target = await page.evaluate(async () => {
    const w = window.testStore.getWorld(),
      { spellTargetError, distance } = await import('/app/model.ts'),
      source = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    if (!source || w.shots.blast < 1) return null
    const target = w.units
      .filter(u => u.team === 'red' && u.hp > 0)
      .sort((a, b) => distance(source, a) - distance(source, b))
      .find(u => !spellTargetError(w, 'blast', u))
    return target ? { id: target.id, x: target.x, z: target.z } : null
  })
  if (!target) return false
  const before = await snapshot()
  const pointer = await hitPoint(target, target.id)
  await page.getByRole('button', { name: /^Blast, [0-9]+ shots$/ }).click()
  await page.mouse.click(pointer.x, pointer.y)
  const accepted = await page.evaluate(() => window.testStore.getWorld().mode === null)
  assert.ok(accepted, 'Real Blast input did not start casting')
  report.stages.push({
    label: 'real-blast',
    target: target.id,
    turn: before.turn,
    stockBefore: before.shots.blast,
  })
  save()
  return true
}
async function openSettings() {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('heading', { name: 'Game settings', exact: true }).waitFor()
}

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window)
    window.mission8RafHeld = true
    window.requestAnimationFrame = callback => (window.mission8RafHeld ? 0 : request(callback))
  })
  page = await context.newPage()
  page.setDefaultTimeout(30000)
  page.on('pageerror', e => report.errors.push(e.message))
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 8', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bind()
  const initial = await snapshot('authored-start')
  assert.equal(initial.level, 8)
  assert.equal(initial.turn, 0)
  assert.equal(initial.status, 'playing')
  assert.equal(initial.units.filter(u => u.team === 'blue').length, 7)
  assert.equal(initial.units.filter(u => u.team === 'red').length, 11)
  assert.equal(initial.shots.blast, 4)
  assert.equal(initial.inputMask, 0)

  report.stage = 'ordinary-staging'
  await selectParty(true)
  const ground = await hitPoint({ x: -41, z: -33 })
  await page.mouse.click(ground.x, ground.y)
  const dispatched = await snapshot('real-staging-dispatch')
  assert.ok(
    dispatched.units.filter(u => dispatched.selected.includes(u.id)).every(u => u.path > 0),
    'Party was not given land routes'
  )
  let staged = false
  for (let n = 0; n < 30 && !staged; n++) {
    await advance(64)
    const state = await snapshot(),
      source = state.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    staged = source && Math.hypot(source.x - ground.point.x, source.z - ground.point.z) < 3
    if (state.status !== 'playing') break
  }
  await snapshot('staging-result')
  assert.ok(staged, 'Original party did not reach the attack staging point')

  report.stage = 'prebattle-checkpoint'
  await openSettings()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bind()
  await snapshot('prebattle-checkpoint-reloaded')

  report.stage = 'ordinary-combat'
  for (let round = 0; round < 96; round++) {
    const state = await snapshot()
    if (state.status !== 'playing') break
    const red = state.units.filter(u => u.team === 'red' && u.hp > 0),
      braves = state.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
    if (!red.length) {
      await advance(32)
      break
    }
    if (round % 4 === 0 && braves.length) await attack(red.find(u => u.kind !== 'shaman') ?? red[0])
    await castAvailableBlast()
    await advance(32)
    if (round % 8 === 7) await snapshot('battle-' + round)
  }
  const result = await snapshot('natural-result')
  assert.equal(result.status, 'won', 'Ordinary Mission8 combat did not achieve native victory')
  assert.equal(result.units.filter(u => u.team === 'red' && u.hp > 0).length, 0)
  assert.ok(result.stats.kills > 0 || result.killCredits[1] > 0)
  assert.ok(
    result.shrineUses.every(s => s.uses === 0),
    'This route must not consume reserved worship paths'
  )
  assert.equal(result.buildings, 0, 'This route must not use training/construction')

  report.stage = 'result-camera-and-continue'
  await page.evaluate(() => {
    const s = window.testSceneRef.current
    s.previous = null
    window.mission8RafHeld = false
    s.frame = requestAnimationFrame(s.animate)
  })
  await page.getByRole('heading', { name: 'Level Won', exact: true }).waitFor({ timeout: 60000 })
  await page.screenshot({ path: join(output, 'mission8-won.png') })
  await page.waitForFunction(() => window.testStore.getCompletedMissions().includes(8))
  await page.getByRole('button', { name: /^Continue to Mission 9/ }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testStore.getWorld().outcome.level === 9)
  await page.evaluate(() => {
    const s = window.testSceneRef.current
    window.mission8RafHeld = true
    cancelAnimationFrame(s.frame)
    s.frame = 0
    s.previous = null
  })
  await render()
  await openSettings()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Load Game', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bind()
  const restored = await snapshot('fresh-page-mission9')
  assert.equal(restored.level, 9)
  assert.ok(restored.completed.includes(8))
  assert.deepEqual(report.errors, [])
  report.status = 'PASS_NATURAL_MISSION8_TO_9'
} catch (error) {
  report.status = 'FAIL_NATURAL_MISSION8_TO_9'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
  if (page && !page.isClosed()) {
    await snapshot('first-fault').catch(e => {
      report.snapshotError = e.message
    })
    await page.screenshot({ path: join(output, 'first-fault.png') }).catch(() => {})
  }
} finally {
  clearTimeout(end)
  await browser?.close()
  report.browserClosed = true
  save()
  console.log(
    JSON.stringify(
      {
        status: report.status,
        stage: report.stage,
        error: report.error,
        batches: report.batches,
        output,
      },
      null,
      2
    )
  )
}
