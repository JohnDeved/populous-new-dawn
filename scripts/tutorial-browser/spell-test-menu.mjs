import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { SPELLS } from '../../app/world-rules.ts'
import rules from '../../app/original-rules.json' with { type: 'json' }
import { beginOrdinaryCastingWitness, waitForCastingWitness, retainCastingWitness } from './shaman-casting.mjs'

export function spellTestDiagnosticSnapshot() {
  const world = window.testStore?.getWorld(), scene = window.testSceneRef?.current
  return {
    turn: world?.turn, inputMask: world?.inputMask, paused: world?.paused,
    flybyFlags: world?.flyby.flags, status: world?.status,
    sceneMatchesWorld: !!world && scene?.world === world,
    sceneConnected: !!scene?.renderer.domElement.isConnected,
    sceneStarted: scene?.started, sceneDisposed: scene?.disposed,
    modalSuspended: scene?.modalSuspended, hidden: document.hidden,
    loading: !!document.querySelector('.loading-world'),
    skipIntroduction: !!document.querySelector('.skip-introduction'),
    dialogs: [...document.querySelectorAll('dialog[open]')].map(dialog => dialog.getAttribute('aria-label')),
  }
}

// Retain the latest read-only state while the page is alive. One in-flight read
// at most; stopping never waits for a blocked page or delays the existing cap.
export function startSpellTestDiagnostics(page, report) {
  const started = performance.now(), elapsed = () => Math.round(performance.now() - started),
    diagnostics = report.diagnostics = { stages: [] }
  let stopped = false, pending = false
  async function sample() {
    if (stopped || pending) return
    pending = true
    const stage = diagnostics.stage, requestedAtMs = elapsed()
    try {
      const state = await page.evaluate(spellTestDiagnosticSnapshot)
      if (!stopped) diagnostics.lastState = { stage, requestedAtMs, receivedAtMs: elapsed(), ...state }
    } catch (error) {
      if (!stopped) diagnostics.observationError = String(error)
    } finally { pending = false }
  }
  const timer = setInterval(sample, 250)
  return {
    stage(stage) {
      if (stopped) return
      diagnostics.stage = stage
      diagnostics.stages.push({ stage, elapsedMs: elapsed() })
      void sample()
    },
    stop() {
      if (stopped) return
      stopped = true
      clearInterval(timer)
      diagnostics.stoppedAtMs = elapsed()
    },
  }
}

// Public controls perform every change. Fiber aliases are read-only observers.
export default async function spellTestMenu({ browser, url, output }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }),
    page = await context.newPage(), report = { status: 'running', errors: [], limits: [
      'Actual production Home and normal pointer cast through plain Vite; not Vinext/Cloudflare hosting.',
      'No injected spells, forced simulation turns, altered casting state or direct store mutations.',
      'Functional/rendered menu coverage, not proof of every spell effect or hardware performance.',
    ] }
  let failure, castingRetentionAttempted = false
  const diagnostics = startSpellTestDiagnostics(page, report)
  const timer = setTimeout(() => { report.timedOut = true; diagnostics.stop(); void context.close() }, 55000)
  page.setDefaultTimeout(12000)
  page.on('pageerror', error => report.errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  const button = name => page.getByRole('button', { name, exact: true }),
    menu = page.getByRole('dialog', { name: 'Cheats / spell testing', exact: true }),
    snapshot = () => page.evaluate(() => {
      const w = window.testStore.getWorld()
      return { turn: w.turn, paused: w.paused, mode: w.mode, shots: w.shots,
        manaWorld: w.manaWorld, manaTribes: w.manaTribes, gifts: w.giftCounts,
        projectiles: w.projectiles, castingTribes: w.castingTribes, casts: w.stats.cast,
        shaman: w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
        cheatsUsed: window.testStore.hasUsedCheats(), completed: window.testStore.getCompletedMissions() }
    }),
    storage = () => page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('checkpoints'), store = transaction.objectStore('checkpoints'),
          checkpoint = store.get('latest'), profile = store.get('profile')
        transaction.oncomplete = () => {
          const w = checkpoint.result?.world
          resolve({ checkpoint: w && { turn: w.turn, shots: w.shots, manaWorld: w.manaWorld }, profile: profile.result ?? null })
          db.close()
        }
        transaction.onerror = () => { reject(transaction.error); db.close() }
      }
    })),
    waitReady = async phase => {
      diagnostics.stage(`${phase}: bind scene`)
      await bindGame(page)
      diagnostics.stage(`${phase}: await input or introduction`)
      const state = await page.waitForFunction(() => !window.testStore.getWorld().inputMask || document.querySelector('.skip-introduction'))
      if (await page.locator('.skip-introduction').isVisible()) await page.locator('.skip-introduction').click()
      await state.dispose()
      diagnostics.stage(`${phase}: await unlocked input`)
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    }
  try {
    diagnostics.stage('start mission')
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click()
    await button('Start Mission 1').click()
    await waitReady('new game')
    diagnostics.stage('save ordinary checkpoint')
    await button('Pause game').click()
    await button('Menu').click()
    await button('Save Game').click()
    await button('Save checkpoint').click()
    await page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
    await button('Back').click()
    await button('Continue Game').click()
    const saved = await storage(), beforeOpen = await snapshot()
    diagnostics.stage('read-only menu and keyboard controls')
    await button('Resume game').focus()
    await page.keyboard.down('F9')
    await menu.waitFor()
    assert.equal(await button('Close · F9').evaluate(element => element === document.activeElement), true)
    await page.keyboard.down('F9')
    assert.equal(await menu.isVisible(), true, 'held F9 does not toggle twice')
    await page.keyboard.up('F9')
    assert.deepEqual(await snapshot(), beforeOpen, 'opening is read-only for the world')
    await page.keyboard.press('F8')
    await page.locator('.fps-graph').waitFor()
    await page.keyboard.press('F8')
    await page.locator('.fps-graph').waitFor({ state: 'detached' })
    await page.keyboard.down('Escape')
    await menu.waitFor({ state: 'detached' })
    await page.keyboard.down('Escape')
    await page.keyboard.up('Escape')
    assert.equal(await page.locator('[data-original-pause-menu]').count(), 0)
    assert.equal(await button('Resume game').evaluate(element => element === document.activeElement), true)
    assert.deepEqual(await snapshot(), beforeOpen)
    await page.keyboard.press('Shift+F9')
    assert.equal(await menu.count(), 0)
    report.openCloseWithoutMutation = true
    report.repeatFocusEscapeAndF8 = true

    // Opening from live play must freeze turns without altering the user's pause
    // state, then resume the same world without catching up suspended wall time.
    diagnostics.stage('live hold and resume')
    await button('Resume game').click()
    await page.waitForFunction(turn => window.testStore.getWorld().turn >= turn + 2, beforeOpen.turn)
    await page.keyboard.press('F9')
    await menu.waitFor()
    const liveHold = await snapshot()
    assert.equal(liveHold.paused, false)
    await page.waitForTimeout(350)
    assert.deepEqual(await snapshot(), liveHold, 'unpaused world stays unchanged while F9 is open')
    await page.keyboard.press('F9')
    await menu.waitFor({ state: 'detached' })
    await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, liveHold.turn)
    assert.equal((await snapshot()).paused, false)
    await button('Pause game').click()
    report.unpausedHoldAndResume = true

    // Reuse this authored Scene before any testing grant. No extra context,
    // injected spell, driven clock, or increase to this episode's 55s bound.
    diagnostics.stage('ordinary casting witness')
    report.ordinaryCasting = await beginOrdinaryCastingWitness(page)

    diagnostics.stage('grants and responsive screenshots')
    await page.keyboard.press('F9')
    await button('Unlock + refill all spells').click()
    const unlocked = await snapshot()
    assert.equal(unlocked.cheatsUsed, true)
    for (const spell of SPELLS) {
      assert.ok(unlocked.shots[spell.id] >= rules.spellCharging[spell.model].normalLimit)
      assert.equal(await button(`Test ${spell.name}, ${unlocked.shots[spell.id]} shots`).isEnabled(), true)
    }
    await button('Refill mana').click()
    assert.ok((await snapshot()).manaTribes[0].available >= 1_000_000)
    await page.screenshot({ path: resolve(output, 'f9-cheats-desktop.png') })
    await page.setViewportSize({ width: 900, height: 560 })
    const bounds = await menu.boundingBox()
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 900 && bounds.y + bounds.height <= 560)
    await button(`Test Swarm, ${unlocked.shots.swarm} shots`).scrollIntoViewIfNeeded()
    await page.screenshot({ path: resolve(output, 'f9-cheats-short.png') })
    await page.setViewportSize({ width: 1440, height: 1000 })
    diagnostics.stage('real pointer cast and refill')
    await button(`Test Blast, ${unlocked.shots.blast} shots`).click()
    await menu.waitFor({ state: 'detached' })
    assert.equal((await snapshot()).mode, 'blast')
    await page.evaluate(() => window.shamanCastingObserver.arm('subsequent'))
    await button('Resume game').click()
    const target = await page.evaluate(() => {
      const scene = window.testSceneRef.current, w = window.testStore.getWorld(),
        shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
        p = scene.screen({ x: shaman.x + 5, z: shaman.z + 5 }), rect = scene.renderer.domElement.getBoundingClientRect()
      return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2, before: w.stats.cast }
    })
    await page.mouse.click(target.x, target.y)
    await page.waitForFunction(before => window.testStore.getWorld().stats.cast === before + 1, target.before)
    await page.keyboard.press('F9')
    await menu.waitFor()
    const casting = await snapshot()
    assert.equal(casting.shots.blast, unlocked.shots.blast - 1, 'normal cast spent one real charge')
    assert.ok(casting.shaman.casting?.remaining > 0, 'actual Shaman windup must still be active')
    assert.ok(casting.projectiles.some(projectile => projectile.spell === 'blast' &&
      projectile.phase === 'windup' && projectile.remaining > 0), 'an actual live windup projectile is required')
    assert.ok(casting.castingTribes[0].cooldown > 0, 'native cooldown remains active')
    await page.evaluate(() => window.shamanCastingObserver.beginHold())
    await page.waitForTimeout(350)
    await page.evaluate(() => window.shamanCastingObserver.endHold())
    assert.deepEqual(await snapshot(), casting, 'active cast and its windup freeze while F9 is open')
    await button('Refill available charges').click()
    const refilled = await snapshot()
    assert.deepEqual(refilled.projectiles, casting.projectiles)
    assert.deepEqual(refilled.shaman, casting.shaman)
    assert.deepEqual(refilled.castingTribes, casting.castingTribes)
    report.realPointerCast = { before: target.before, after: casting.casts, spent: 1 }
    report.refillPreservesLiveCasting = true
    diagnostics.stage('subsequent casting witness')
    await page.keyboard.press('F9')
    await menu.waitFor({ state: 'detached' })
    await waitForCastingWitness(page, 'subsequent')
    castingRetentionAttempted = true
    report.shamanCasting = await retainCastingWitness(page, output)
    diagnostics.stage('blocked save and checkpoint load')
    await button('Menu').click()
    await button('Save Game').click()
    assert.equal(await button('Save checkpoint').isDisabled(), true)
    await page.getByText(/Testing cheats are active/).waitFor()
    assert.deepEqual(await storage(), saved, 'existing save/profile are unchanged')
    await button('Back').click()
    await button('Load Game').click()
    await button('Load checkpoint').click()
    await waitReady('checkpoint load')
    assert.equal((await snapshot()).cheatsUsed, false)
    assert.equal((await snapshot()).shots.teleport, 0)
    diagnostics.stage('grant and restart')
    await page.keyboard.press('F9')
    await menu.waitFor()
    await button('Unlock + refill all spells').click()
    await page.keyboard.press('F9')
    await button('Menu').click()
    await button('Restart Level').click()
    await button('Yes').click()
    await waitReady('restart')
    assert.equal((await snapshot()).cheatsUsed, false)
    assert.equal((await snapshot()).shots.teleport, 0)
    report.savePreservedAndLoadRestartReset = true
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    diagnostics.stage('completed')
  } catch (error) {
    failure = error
    report.failure = String(error)
    report.stack = error.stack
    report.status = 'failed'
    try { await page.screenshot({ path: resolve(output, 'f9-cheats-failure.png') }) }
    catch (error) { report.screenshotError = String(error) }
  } finally {
    clearTimeout(timer)
    diagnostics.stop()
    // Failed partial observations still restore callbacks and retain raw data
    // before the existing context closes. Never mask the original F9 failure.
    try {
      if (!castingRetentionAttempted && !page.isClosed()) {
        castingRetentionAttempted = true
        report.shamanCasting = await retainCastingWitness(page, output, { validate: false })
      }
    } catch (error) {
      report.castingRetentionError = String(error)
      failure ??= error
      report.status = 'failed'
    } finally {
      await context.close()
      report.contextClosed = true
      writeFileSync(resolve(output, 'f9-cheats.json'), JSON.stringify(report, null, 2) + '\n')
    }
  }
  if (failure) throw failure
  return report
}
