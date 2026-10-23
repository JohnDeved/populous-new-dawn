import { clearPortraitSelection } from '../browser-portrait-input.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { readCommittedCheckpoint } from '../local-render/checkpoint-observer.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'
import { meleeCameraInput, meleeTargetPoint, readMeleeRouteState, assertMeleeRouteReady,
  shiftClickMeleeTarget } from './melee-attack.mjs'
import { installFollowerCorpseObserver, readFollowerCorpseHold,
  readFollowerCorpseReady, readCommittedFollowerCorpse } from './follower-corpse-observer.mjs'
import { validateFollowerCorpseObservation } from './follower-corpse-evidence.mjs'

export const followerCorpseBudgetMs = Object.freeze({ deathAndSave: 75000, loadAndVerify: 25000 })
const root = resolve(import.meta.dirname, '../..'), viewport = { width: 960, height: 720 }
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

// These are distinct functional phases, not a retry or a refreshable timeout.
// The runner's explicit aggregate deadline remains authoritative; these phase caps are unchanged.
export function followerCorpseDeadline({ onExpire, now = () => performance.now(),
  schedule = setTimeout, cancel = clearTimeout }) {
  const records = []
  let timer, disposed = false
  const expire = record => {
    if (disposed || record !== records.at(-1) || record.timedOut) return
    record.timedOut = true; record.expiredElapsedMs = now(); onExpire(record)
  }
  const start = (name, capMs) => {
    const startedElapsedMs = now(), record = { name, capMs, startedElapsedMs, deadlineElapsedMs: startedElapsedMs + capMs }
    records.push(record); timer = schedule(() => expire(record), capMs)
  }
  const remaining = () => {
    assert.equal(disposed, false, 'Corpse budget is already closed')
    const record = records.at(-1), left = record.deadlineElapsedMs - now()
    if (left <= 0) expire(record)
    assert.equal(record.timedOut, undefined, `Corpse ${record.name} deadline exceeded`)
    return left
  }
  const finish = () => {
    const left = remaining()
    cancel(timer)
    const record = records.at(-1)
    record.completedElapsedMs = record.deadlineElapsedMs - left
    record.durationMs = record.completedElapsedMs - record.startedElapsedMs
  }
  start('death-through-committed-save', followerCorpseBudgetMs.deathAndSave)
  return { records, remaining,
    beginLoad(checkpoint) {
      assert.equal(records.length, 1, 'Only one committed-save budget transition is permitted')
      remaining()
      assert.equal(checkpoint?.committed?.version, CHECKPOINT_VERSION)
      assert.match(checkpoint.committed.checkpointSha256, /^[a-f0-9]{64}$/)
      assert.equal(checkpoint.committedCorpse.version, CHECKPOINT_VERSION)
      assert.equal(checkpoint.committedCorpse.level, checkpoint.committed.level)
      assert.equal(checkpoint.committed.turn, checkpoint.saved.turn)
      assert.equal(checkpoint.committedCorpse.turn, checkpoint.saved.turn)
      assert.equal(checkpoint.saved.paused, true)
      assert.equal(checkpoint.saved.effect.corpse.phase, 1)
      assert.deepEqual(checkpoint.committedCorpse.effect, checkpoint.saved.effect,
        'The load budget requires this exact successfully committed corpse')
      finish()
      records[0].committedSave = { checkpointSha256: checkpoint.committed.checkpointSha256,
        turn: checkpoint.saved.turn, effectId: checkpoint.saved.effect.id }
      start('load-reframe-resume-and-terminal-verification', followerCorpseBudgetMs.loadAndVerify)
    },
    complete() {
      assert.equal(records.length, 2, 'Both corpse phases must complete')
      finish(); disposed = true
    },
    dispose() { cancel(timer); disposed = true },
  }
}

export function readCorpseMinimap(effectId = null) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const target = effectId === null ? world.units.find(u => u.id === 20) : world.effects.find(f => f.id === effectId)
  if (!target) throw Error('Authored target or retained corpse missing')
  const r = scene.mini.getBoundingClientRect()
  return { width: scene.mini.width, height: scene.mini.height,
    rect: { x: r.x, y: r.y, width: r.width, height: r.height },
    center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
    heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
    target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) } }
}

// A restored paused snapshot is transient: beginLoad resumes it before the new
// Scene becomes ready. Only a new public Pause action establishes the setup hold.
export async function pauseLoadedFollowerCorpse(page, effectId, pause) {
  const readyBeforePause = await page.evaluate(readFollowerCorpseReady, effectId)
  const assertReady = state => {
    assert.equal(state.sceneReplaced, true, 'Load checkpoint must create a new ready Scene')
    assert.equal(state.worldReplaced, true, 'The ready Scene must use the replacement World')
    assert.equal(state.sceneStoreMatch, true); assert.equal(state.canvasConnected, true)
    assert.equal(state.effect?.id, effectId)
  }
  assertReady(readyBeforePause)
  assert.equal(readyBeforePause.paused, false, 'Home resumes the loaded World after its transient store notification')
  await pause()
  await page.waitForFunction(() => window.testStore.getWorld().paused)
  const readyPaused = await page.evaluate(readFollowerCorpseReady, effectId)
  assertReady(readyPaused); assert.equal(readyPaused.paused, true)
  return { readyBeforePause, readyPaused }
}

export default async function followerCorpse({ browser, url, output, expectedRevision, admission }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 }), page = await context.newPage()
  page.setDefaultTimeout(10000)
  const report = { schema: 'populous-new-dawn/ordinary-follower-corpse', schemaVersion: 2,
    status: 'running', expectedRevision, budgetCapsMs: followerCorpseBudgetMs, actions: [], errors: [],
    actorId: null, effectId: null, death: null, segments: [], error: null, phases: [],
    method: 'Fresh authored M2 through public startup. Existing public bird’s-eye/minimap target route, Escape, one plain Select brave, Resume, actual rendered hover and Shift+left attack on eligible Green Shaman20. Natural combat/death and same-frame corpse observation; public pause, committed current Save checkpoint, actual Load checkpoint, public camera reframing and Resume.',
    limits: ['Direct mission access, not campaign unlock. No native/synthetic scene, health, source, phase, clock, victim or target assignment.',
      'Independent original VSTART/VFRA fixture validates displayed native source and heading; packed frame identity comes from imported atlas metadata independently audited outside this browser check.',
      'Canvas copies and read-only observations perturb rendering; no performance or hardware smoothness claim. Crops require visual review and are not pixel-perfect composition evidence.',
      'The saved in-session current checkpoint is actually loaded and rendered. This is not a fresh browser/process persistence test.',
      'Death through verified committed save has 75 seconds; only successful committed-save proof starts the separate 25-second load/reframe/continuation/verification budget. Both remain inside the runner’s explicit shared 355-second three-episode browser cap.',
      'Browser sampling establishes observed source/frame/heading/visibility and continuation, not exact animation cadence. Cadence remains the separate native follower-corpse-animation unit-test claim.'],
    source: Object.fromEntries(['scripts/tutorial-browser/follower-corpse.mjs',
      'scripts/browser-portrait-input.mjs', 'scripts/browser-world-input.mjs', 'scripts/browser-space-ownership.mjs', 'app/mission-data.ts',
      'scripts/tutorial-browser/follower-corpse-observer.mjs', 'scripts/tutorial-browser/follower-corpse-evidence.mjs',
      'tests/fixtures/follower-corpse-native.json', 'app/original-units.json', 'app/follower-corpse-animation.ts',
      'app/scene-effects.ts', 'app/world-turn.ts', 'app/game-store.ts', 'app/checkpoint-format.ts',
      'app/page.tsx', 'app/original-pause-menu.tsx']
      .map(path => [path, sha(readFileSync(resolve(root, path)))])) }
  const save = () => writeFileSync(resolve(output, 'follower-corpse.json'), JSON.stringify(report, null, 2) + '\n')
  const started = performance.now()
  report.startedAt = new Date().toISOString()
  const elapsed = () => performance.now() - started
  const finishPhase = completed => {
    const phase = report.phases.at(-1)
    if (!phase || phase.finishedElapsedMs !== undefined) return
    phase.finishedElapsedMs = elapsed()
    phase.durationMs = phase.finishedElapsedMs - phase.startedElapsedMs
    phase.budget = budget.records.at(-1).name
    phase.remainingMs = Math.max(0, budget.records.at(-1).deadlineElapsedMs - phase.finishedElapsedMs)
    phase.completed = completed
  }
  const phase = name => {
    finishPhase(true)
    report.phases.push({ name, startedElapsedMs: elapsed() }); save()
  }
  const action = async (name, perform) => {
    const record = { name, startedAt: new Date().toISOString(), startedElapsedMs: elapsed() }
    report.actions.push(record); save()
    const input = await perform()
    if (input) record.input = input
    record.finishedAt = new Date().toISOString(); record.finishedElapsedMs = elapsed()
    record.durationMs = record.finishedElapsedMs - record.startedElapsedMs; save()
  }
  const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  })
  const focus = async effectId => {
    const geometry = await page.evaluate(readCorpseMinimap, effectId), input = meleeCameraInput(geometry)
    await action('Public minimap target framing with fixed (0,+12) backing-pixel offset', async () => {
      assert.equal(await page.evaluate(p => document.elementFromPoint(p.x, p.y) === window.testSceneRef.current.mini, input), true)
      await page.mouse.click(input.x, input.y); await settle()
      return { geometry, point: input }
    })
  }
  const errors = error => { if (report.errors.length < 20) report.errors.push(String(error).slice(0, 2000)) }
  page.on('pageerror', errors)
  page.on('console', message => { if (message.type() === 'error') errors(message.text()) })
  page.on('crash', () => errors('Page crashed'))
  const budget = followerCorpseDeadline({ now: elapsed, onExpire: record => {
    report.timedOut = true; report.expiredBudget = record.name; report.deadlineElapsedMs = elapsed(); save()
    void context.close().catch(() => {})
  } })
  report.budgets = budget.records
  let failure
  const retain = async () => {
    if (page.isClosed()) return
    const segment = await page.evaluate(() => window.__pndCorpseObservation?.retain() ?? null)
    if (!segment || report.segments.some(s => s.segment === segment.segment)) return
    if (segment.death) { report.death = segment.death; report.effectId = segment.effectId }
    report.segments.push(segment)
    for (const crop of segment.crops) {
      if (crop.error) continue
      assert.match(crop.filename, /^follower-corpse-(original|loaded)-[0-3]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' }); crop.sha256 = sha(bytes); delete crop.png
    }
    save()
  }
  save()
  try {
    phase('startup')
    admission?.setLocalCheck(() => budget.remaining())
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await action('New Game / No / Browser controls / All missions', () => showAllMissions(page))
    await button('Mission 2'); await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue(); await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip')
      await action('Skip introduction', () => skipIntroductionWithSpace(page, { timeout: Math.min(10000, budget.remaining()) }))
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld(); return !w.inputMask && !w.paused && w.turn > w.lastOrderTurn
    })
    phase('public-combat-setup')
    await action('Pause with Space', () => setWorldPaused(page, true, { timeout: Math.min(10000, budget.remaining()) }))
    await action('Clear previous portrait cohort', () => clearPortraitSelection(page, { timeout: Math.min(10000, budget.remaining()) }))
    await button('Select shaman')
    await action('Focus shaman (right-click)', () => page.getByRole('button', { name: 'Select shaman', exact: true }).click({ button: 'right' }))
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out', () => page.keyboard.press('-')); await settle()
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await focus(null)
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await action('Public Escape clears the startup Shaman selection', () => page.keyboard.press('Escape'))
    assert.deepEqual(await page.evaluate(() => window.testStore.getWorld().selected), [])
    await button('Select brave')
    report.selection = await page.evaluate(() => {
      const w = window.testStore.getWorld(), s = window.testSceneRef.current
      return { turn: w.turn, selected: [...w.selected], paused: w.paused, camera: { ...s.cameraPosition },
        people: w.units.filter(u => w.selected.includes(u.id)).map(u => ({ id: u.id, team: u.team, kind: u.kind, hp: u.hp, target: u.target, fight: u.fight })) }
    })
    assert.equal(report.selection.paused, true)
    assert.equal(report.selection.people.length, 1)
    const actor = report.selection.people[0]
    assert.equal(actor.team, 'blue'); assert.equal(actor.kind, 'brave'); assert.ok(actor.hp > 0)
    assert.equal(actor.fight, null); assert.equal(actor.target, null); report.actorId = actor.id; save()
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId })
    await action('Resume with Space', () => setWorldPaused(page, false, { timeout: Math.min(10000, budget.remaining()) }))
    const route = report.targetEligibility = await page.evaluate(readMeleeRouteState)
    assert.equal(route.paused, false); assert.equal(route.speed, 1); assert.equal(route.target.id, 20)
    assert.equal(route.target.inside, null); assert.equal(route.target.visible, true); assert.equal(route.target.pickable, true)
    const bounds = await page.evaluate(() => {
      const s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect(), b = s.picking.personBounds(20, r)
      return b && { x: r.left + b.x, y: r.top + b.y, width: b.width, height: b.height }
    })
    assert.ok(bounds); report.targetHoverAttempts = []
    const point = await meleeTargetPoint(page, bounds, report.targetHoverAttempts, save)
    report.beforeAttack = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, stamp: window.testSceneRef.current.renderer.info.render.frame }))
    await action('Public Shift+left attack click on eligible Green Shaman20', () => shiftClickMeleeTarget(page, point))
    report.order = await page.evaluate(actorId => {
      const w = window.testStore.getWorld(), u = w.units.find(u => u.id === actorId)
      return { turn: w.turn, lastOrderTurn: w.lastOrderTurn, selected: [...w.selected], paused: w.paused,
        actorId, target: u?.target, path: structuredClone(u?.path), nativeCommands: u?.native && [...u.native.commands] }
    }, report.actorId)
    assert.deepEqual(report.order.selected, [report.actorId]); assert.equal(report.order.target, 20); assert.equal(report.order.paused, false)
    assert.ok(report.order.lastOrderTurn >= report.beforeAttack.turn && report.order.lastOrderTurn <= report.order.turn,
      'The actual public attack must issue an order on this observed logical timeline'); save()
    phase('ordinary-combat')
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result
      return r.error || r.samples.some(s => s.phase === 1 && !s.paused && s.cropFile)
    }, null, { timeout: budget.remaining() })
    assert.equal(await page.evaluate(() => window.__pndCorpseObservation.result.error), null)
    report.effectId = await page.evaluate(() => window.__pndCorpseObservation.result.effectId)
    phase('pause-and-save')
    await action('Pause with Space', () => setWorldPaused(page, true, { timeout: Math.min(10000, budget.remaining()) }))
    report.checkpoint = { holdBefore: await page.evaluate(readFollowerCorpseHold, report.effectId) }
    assert.equal(report.checkpoint.holdBefore.paused, true)
    assert.equal(report.checkpoint.holdBefore.effect.corpse.phase, 1)
    await page.waitForTimeout(150)
    report.checkpoint.holdAfter = await page.evaluate(readFollowerCorpseHold, report.effectId)
    assert.deepEqual(report.checkpoint.holdAfter, report.checkpoint.holdBefore)
    await button('Menu'); await button('Save Game'); await button('Save checkpoint')
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await menu.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
    report.checkpoint.committed = await readCommittedCheckpoint(page)
    assert.equal(report.checkpoint.committed.version, CHECKPOINT_VERSION)
    report.checkpoint.saved = await page.evaluate(readFollowerCorpseHold, report.effectId)
    assert.equal(report.checkpoint.committed.turn, report.checkpoint.saved.turn)
    report.checkpoint.committedCorpse = await page.evaluate(readCommittedFollowerCorpse, report.effectId)
    assert.equal(report.checkpoint.committedCorpse.version, CHECKPOINT_VERSION)
    assert.equal(report.checkpoint.committedCorpse.turn, report.checkpoint.saved.turn)
    assert.deepEqual(report.checkpoint.committedCorpse.effect, report.checkpoint.saved.effect,
      'The committed IDB record must contain this exact saved corpse, not merely the same turn')
    await retain()
    finishPhase(true)
    budget.beginLoad(report.checkpoint)
    phase('load-and-reframe')
    await page.evaluate(effectId => {
      const store = window.testStore, original = store.getWorld()
      window.__pndCorpsePreviousWorld = original
      window.__pndCorpsePreviousScene = window.testSceneRef.current
      const unsubscribe = store.subscribe(() => {
        const world = store.getWorld()
        if (world === original) return
        window.__pndCorpseRestored = { worldReplaced: true, turn: world.turn, paused: world.paused,
          effect: structuredClone(world.effects.find(f => f.id === effectId)) }
        unsubscribe()
      })
    }, report.effectId)
    await button('Back'); await button('Load Game'); await button('Load checkpoint')
    await page.waitForFunction(() => !!window.__pndCorpseRestored)
    report.checkpoint.restoredSnapshot = await page.evaluate(() => window.__pndCorpseRestored); save()
    assert.deepEqual(report.checkpoint.restoredSnapshot.effect, report.checkpoint.saved.effect)
    assert.equal(report.checkpoint.restoredSnapshot.turn, report.checkpoint.saved.turn)
    assert.equal(report.checkpoint.restoredSnapshot.paused, true)
    assert.deepEqual(report.checkpoint.restoredSnapshot.effect, report.checkpoint.committedCorpse.effect)
    await menu.waitFor({ state: 'hidden' }); await bindGame(page)
    Object.assign(report.checkpoint, await pauseLoadedFollowerCorpse(page, report.effectId, () => action('Pause with Space', () => setWorldPaused(page, true, { timeout: Math.min(10000, budget.remaining()) })))); save()
    assert.equal(report.checkpoint.readyPaused.effect.corpse.phase, 1, 'Ready-scene setup must remain within the saved corpse phase')
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out after actual Load checkpoint', () => page.keyboard.press('-')); await settle()
    await focus(report.effectId)
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId, effectId: report.effectId, segment: 'loaded' })
    await action('Resume with Space', () => setWorldPaused(page, false, { timeout: Math.min(10000, budget.remaining()) }))
    report.checkpoint.readyResumed = await page.evaluate(readFollowerCorpseReady, report.effectId); save()
    assert.equal(report.checkpoint.readyResumed.paused, false)
    phase('loaded-continuation')
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result; return r.error || r.done
    }, null, { timeout: budget.remaining() })
    phase('acceptance-and-capture')
    await retain()
    report.acceptance = validateFollowerCorpseObservation(report)
    await action('Pause with Space', () => setWorldPaused(page, true, { timeout: Math.min(10000, budget.remaining()) }))
    await page.screenshot({ path: resolve(output, 'follower-corpse-context.png') })
    budget.complete()
  } catch (error) {
    failure = error; report.failure = { message: String(error), stack: error.stack }; save()
    if (!page.isClosed()) try { await page.screenshot({ path: resolve(output, 'follower-corpse-failure.png'), timeout: 2000 }) }
    catch (error) { report.failureScreenshotError = String(error) }
  } finally {
    admission?.clearLocalCheck()
    budget.dispose()
    finishPhase(!failure && !report.timedOut)
    try { await retain() } catch (error) { report.errors.push(`Corpse retention: ${error}`) }
    try { await context.close(); report.contextClosed = true } catch (error) { report.errors.push(`Corpse cleanup: ${error}`) }
    report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'
    report.finishedAt = new Date().toISOString(); report.elapsedMs = elapsed(); save()
  }
  assert.equal(report.status, 'passed', 'Follower corpse browser case failed; see follower-corpse.json')
  return report
}
