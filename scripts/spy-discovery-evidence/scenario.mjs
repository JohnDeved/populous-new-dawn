import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { createDeadline } from './deadline.mjs'
import { spyGuardCycle } from './guards.mjs'

// Bounded rendered Spy discovery witness. The owner supplies a reviewed browser,
// built test-host URL and outer deadline; this module never launches one.
// Each fixture case uses its own fresh context because preparation is single-use per World.
export const spyDiscoveryLimits = Object.freeze([
  'Supplied Spy actor/disguise/invisibility through the reviewed test-host fixture (6e62705) after ordinary Mission 1 startup; unrelated computer work suppressed by the fixture',
  'Actual mounted Home/Scene, public New Game/Start Mission 1/Skip/Escape/Pause/Resume controls and real Playwright pointer input on the canvas',
  'Camera focus on the supplied Spy is supplied setup; target pixel is located by read-only projection plus the production ScenePicking.pickPerson (which updates only its own pick cache)',
  'No natural Spy acquisition, native pixel parity, save/load, modal/overview guards, performance or full-gate claim',
])

const readSpy = () => {
  const h = window.__spyDiscoveryWitness, s = window.testSceneRef.current, w = s.world
  const unit = w.units.find(u => u.id === h.spyId)
  const person = unit && (unit.native ?? unit.entry?.person)
  return {
    current: s === h.scene && w === h.world && window.testStore.getWorld() === w && s.isCurrent(),
    pending: w.spyDiscovery && { ...w.spyDiscovery }, modal: !!s.modalSuspended, overview: !!s.overviewActive,
    turn: w.turn, paused: w.paused, selected: [...w.selected], mode: w.mode, inputMask: w.inputMask,
    sameUnit: unit === h.unit, samePerson: person === h.person, ownerRegistered: w.objectCells.objects.get(h.spyId) === h.person,
    hp: unit?.hp ?? null, disguise: h.person.disguise, tribe: h.person.tribe, invisibility: unit?.invisibility ?? null,
    position: unit ? { x: unit.x, z: unit.z } : null, randomState: w.randomState,
  }
}

async function runCase({ browser, url, output, deadline, caseName, report, guards }) {
  const record = { caseName, stages: [], screenshots: [], errors: [] }
  report.cases.push(record)
  let page
  try { await runCaseBody({ browser, url, output, deadline, caseName, report, guards, record, setPage: value => { page = value } }) }
  catch (error) {
    // Bounded best-effort failure capture; the original failure is always rethrown.
    if (page && !deadline.expired) {
      const file = `spy-${caseName}-failure.png`
      let t
      try {
        await Promise.race([page.screenshot({ path: resolve(output, file), timeout: 2000 }),
          new Promise((_, reject) => { t = setTimeout(() => reject(Error('failure screenshot >2.5s')), 2500) })])
        record.failureScreenshot = file
      } catch (e) { record.diagnosticError = String(e) }
      finally { clearTimeout(t) }
    }
    report.save()
    throw error
  }
}

async function runCaseBody({ browser, url, output, deadline, caseName, report, guards, record, setPage }) {
  const stage = (name, data) => { record.stages.push({ name, time: new Date().toISOString(), data }); report.save() }
  // Track the creation itself: a context arriving after a deadline still belongs to this
  // episode and is closed by the episode owner (never claimed as verified cleanup).
  const creation = browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
  report.creations.push(creation)
  void creation.then(late => {
    if (report.closing && !report.contexts.includes(late)) { report.lateContextsClosedUnverified++; void late.close().catch(() => {}) }
  }, () => {})
  const context = await deadline.run(() => creation)
  report.contexts.push(context)
  const page = await deadline.run(() => context.newPage())
  setPage(page)
  page.on('pageerror', e => record.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') record.errors.push(m.text()) })
  page.on('crash', () => record.errors.push('Page crashed'))
  page.setDefaultTimeout(20000)
  const entry = new URL(url); entry.searchParams.set('spy-discovery-fixture', '1')
  await deadline.run(() => page.goto(entry.href, { waitUntil: 'domcontentloaded' }))
  const button = name => page.getByRole('button', { name, exact: true })
  await deadline.run(() => waitForStartupMenu(page)); await deadline.run(() => button('New Game').click())
  await deadline.run(() => page.locator('[data-original-tutorial-recommendation]').waitFor())
  await deadline.run(() => button('No').click()); await deadline.run(() => button('Start Mission 1').click()); await deadline.run(() => bindGame(page))
  const startup = await deadline.run(() => page.waitForFunction(() => {
    const w = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
    if (!w.inputMask && w.levelStart.every(s => s.phase === 4)) return 'ready'
    return skip && skip.getClientRects().length && !skip.disabled ? 'skip' : false
  }))
  const startupValue = await deadline.run(() => startup.jsonValue()); await deadline.run(() => startup.dispose())
  if (startupValue === 'skip') await deadline.run(() => page.getByRole('button', { name: /^Skip introduction/ }).click())
  // The fixture's own readiness predicate: opening controllers finished and stones settled by ordinary turns.
  await deadline.run(() => page.evaluate(async () => {
    const fixture = await window.__pndSpyDiscoveryFixtureReady
    if (typeof fixture?.prepareDiscoveryFixture !== 'function') throw Error('Spy discovery fixture unavailable')
    window.__spyDiscoveryFixture = fixture
  }))
  await deadline.run(() => page.waitForFunction(() => window.__spyDiscoveryFixture.discoveryFixtureReady(window.testSceneRef.current),
    null, { timeout: 60000, polling: 100 }))
  // Ordinary Escape clears the startup Shaman selection (no mode is armed here).
  await deadline.run(() => page.locator('.world-viewport canvas').first().focus())
  const interaction = () => deadline.run(() => page.evaluate(() => {
    const s = window.testSceneRef.current, w = s.world
    return { selected: [...w.selected], mode: w.mode, paused: w.paused, overview: !!s.overviewActive, modal: !!s.modalSuspended,
      active: document.activeElement?.tagName ?? null }
  }))
  const escapes = []
  for (let i = 0; i < 4; i++) {
    const state = await interaction()
    escapes.push(state)
    if (!state.selected.length && !state.mode) break
    // Escape is ignored while a campaign message details panel is open (page.tsx key handler).
    // After one unsuccessful Escape, use the ordinary right-click cancellation on the canvas
    // (same public route as the owned-Swamp episode); no Spy exists yet, so nothing can be staged.
    if (i === 0) await deadline.run(() => page.keyboard.press('Escape'))
    else await deadline.run(() => page.locator('.world-viewport canvas').first().click({ button: 'right', position: { x: 400, y: 300 } }))
    await deadline.run(() => page.evaluate(() => new Promise(done => requestAnimationFrame(() => done()))))
  }
  await deadline.run(() => button('Pause game').click())
  await deadline.run(() => page.waitForFunction(() => window.testStore.getWorld().paused))
  const prePrepare = await interaction()
  stage('public-escape-pause', { escapes, prePrepare })
  assert.ok(!prePrepare.selected.length && !prePrepare.mode && prePrepare.paused && !prePrepare.overview && !prePrepare.modal,
    'Public Escape/Pause must leave an empty paused interaction state before fixture preparation')
  const prepared = await deadline.run(() => page.evaluate(async caseName => {
    const fixture = await window.__pndSpyDiscoveryFixtureReady, s = window.testSceneRef.current
    const result = fixture.prepareDiscoveryFixture(s, { caseName })
    const unit = s.world.units.find(u => u.id === result.spyId)
    // Disclosed camera setup: centre the view on the supplied Spy (does not touch world.mode here).
    s.focus(unit); s.onChange()
    window.__spyDiscoveryWitness = { scene: s, world: s.world, spyId: result.spyId, unit, person: unit.native }
    return result
  }, caseName))
  stage('supplied-fixture', prepared)
  const bootstrap = await deadline.run(() => page.evaluate(() => {
    const s = window.testSceneRef.current, gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { level: s.world.outcome.level, turn: s.world.turn, vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
      unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null, viewport: [innerWidth, innerHeight, devicePixelRatio] }
  }))
  stage('bootstrap', bootstrap)
  report.renderer ??= bootstrap
  // Wait for the supplied Spy to have a rendered mesh in the paused frame.
  await deadline.run(() => page.waitForFunction(() => {
    const h = window.__spyDiscoveryWitness, meshes = window.testSceneRef.current.unitMeshes
    if (!(meshes instanceof Map)) throw Error('Scene unit mesh registry unavailable')
    return meshes.has(h.spyId)
  }))
  await deadline.run(() => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))))
  const locate = () => deadline.run(() => page.evaluate(() => {
    const h = window.__spyDiscoveryWitness, s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect()
    const p = s.screen(h.unit), gx = r.left + (p.x + 1) * r.width / 2, gy = r.top + (1 - p.y) * r.height / 2
    const hits = []
    for (let dy = 0; dy <= 48; dy++) for (let dx = -8; dx <= 8; dx++) {
      const x = Math.round(gx + dx), y = Math.round(gy - dy)
      if (document.elementFromPoint(x, y) !== s.renderer.domElement) continue
      if (s.picking.pickPerson({ clientX: x, clientY: y }) === h.spyId) hits.push({ x, y })
    }
    const mean = k => hits.reduce((a, b) => a + b[k], 0) / Math.max(1, hits.length)
    const centre = hits.length ? hits.reduce((best, p) => Math.hypot(p.x - mean('x'), p.y - mean('y')) < Math.hypot(best.x - mean('x'), best.y - mean('y')) ? p : best) : null
    return { ground: { x: gx, y: gy }, hitCount: hits.length, point: centre }
  }))
  const capture = async name => {
    const file = `spy-${caseName}-${name}.png`, path = resolve(output, file)
    await deadline.run(() => page.screenshot({ path, timeout: 5000 }))
    record.screenshots.push({ file, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }); report.save()
  }
  const witness = () => deadline.run(() => page.evaluate(readSpy))
  const resumeTurns = async (turns, label) => {
    const start = await witness()
    await deadline.run(() => button('Resume game').click())
    await deadline.run(() => page.waitForFunction(([t, n]) => window.testStore.getWorld().turn >= t + n, [start.turn, turns], { timeout: 15000, polling: 'raf' }))
    const resumed = await witness()
    await deadline.run(() => button('Pause game').click())
    await deadline.run(() => page.waitForFunction(() => window.testStore.getWorld().paused))
    await deadline.run(() => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))))
    const paused = await witness()
    stage(label, { start, resumed, paused })
    return { start, resumed, paused }
  }
  let target = await locate()
  stage('target', target)
  const initial = await witness()
  assert.equal(initial.current, true); assert.equal(initial.paused, true); assert.deepEqual(initial.selected, [])
  assert.equal(initial.disguise, prepared.supplied.disguise)

  if (caseName === 'visible') {
    assert.ok(target.point, 'Visible supplied Spy must be pickable by the production person picker')
    if (guards) {
      const canvas = page.locator('.world-viewport canvas').first()
      for (const kind of ['options', 'overview']) {
        await spyGuardCycle({ kind, read: witness, capture, stage,
          enter: async () => {
            if (kind === 'options') {
              await deadline.run(() => button('Game settings').click())
              await deadline.run(() => button('Options').click())
              await deadline.run(() => page.waitForFunction(() => document.querySelector('dialog[data-original-pause-menu]')?.dataset.panel === 'options'))
            } else {
              await deadline.run(() => canvas.focus())
              await deadline.run(() => page.keyboard.press('Enter'))
              await deadline.run(() => page.waitForFunction(() => window.testSceneRef.current.overviewActive))
            }
          },
          click: async () => {
            // Reproject in the current camera. Options must receive the event inside its open dialog. Overview
            // uses a projected production-picker hit, NOT visible Spy pixels:
            // the overview ground parent hides world objects.
            const point = await deadline.run(() => page.evaluate(kind => {
              const h = window.__spyDiscoveryWitness, s = window.testSceneRef.current
              const r = s.renderer.domElement.getBoundingClientRect(), p = s.screen(h.unit)
              const x = Math.round(r.left + (p.x + 1) * r.width / 2), y = Math.round(r.top + (1 - p.y) * r.height / 2 - 12)
              const owner = document.elementFromPoint(x, y)
              if (kind === 'overview' && (owner !== s.renderer.domElement || s.picking.pickPerson({ clientX: x, clientY: y }) !== h.spyId))
                throw Error('Overview projected actor must resolve through the production picker on canvas')
              if (kind === 'options' && !document.querySelector('dialog[data-original-pause-menu]')?.open)
                throw Error('Options dialog absent')
              return { x, y }
            }, kind))
            await deadline.run(() => page.evaluate(() => {
              window.__spyGuardPointer = null
              window.__spyGuardListener = e => {
                const dialog = document.querySelector('dialog[data-original-pause-menu]')
                window.__spyGuardPointer = {
                  trusted: e.isTrusted, canvas: e.target === window.testSceneRef.current.renderer.domElement,
                  targetTag: e.target?.tagName ?? null,
                  inOpenDialog: !!dialog?.open && dialog.contains(e.target),
                  dialogPanel: dialog?.dataset.panel ?? null,
                }
              }
              document.addEventListener('pointerdown', window.__spyGuardListener, true)
            }))
            try {
              await deadline.run(() => page.mouse.click(point.x, point.y, { button: 'right' }))
              return await deadline.run(() => page.evaluate(() => window.__spyGuardPointer))
            } finally {
              await deadline.run(() => page.evaluate(() => document.removeEventListener('pointerdown', window.__spyGuardListener, true)))
            }
          },
          leave: async () => {
            if (kind === 'options') {
              await deadline.run(() => page.keyboard.press('Escape'))
              await deadline.run(() => button('Continue Game').click())
              await deadline.run(() => page.waitForFunction(() => !window.testSceneRef.current.modalSuspended))
            } else {
              await deadline.run(() => canvas.focus())
              await deadline.run(() => page.keyboard.press('Enter'))
              await deadline.run(() => page.waitForFunction(() => !window.testSceneRef.current.overviewActive))
            }
          },
        })
      }
      target = await locate(); stage('target-after-guards', target)
      assert.ok(target.point, 'Same Spy must be pickable after both guard recoveries')
    }
    // Negative controls before the discovering press (all on the same World, while paused):
    // 1) Shift-right press on the Spy; 2) plain right press away from the Spy dragged onto it.
    await deadline.run(() => page.keyboard.down('Shift'))
    try { await deadline.run(() => page.mouse.click(target.point.x, target.point.y, { button: 'right' })) }
    finally { await deadline.run(() => page.keyboard.up('Shift')) }
    const away = { x: target.point.x + 120, y: target.point.y + 60 }
    const awayPick = await deadline.run(() => page.evaluate(([x, y]) => window.testSceneRef.current.picking.pickPerson({ clientX: x, clientY: y }), [away.x, away.y]))
    assert.equal(awayPick, null, 'Away press point must not pick a person')
    await deadline.run(() => page.mouse.move(away.x, away.y))
    await deadline.run(() => page.mouse.down({ button: 'right' }))
    await deadline.run(() => page.mouse.move(target.point.x, target.point.y, { steps: 6 }))
    await deadline.run(() => page.mouse.up({ button: 'right' }))
    const controls = await resumeTurns(3, 'negative-controls-resumed')
    assert.equal(controls.paused.disguise, prepared.supplied.disguise, 'Shift-right and away-press drag must not discover')
    assert.ok(controls.paused.sameUnit && controls.paused.samePerson && controls.paused.ownerRegistered)
    // Re-locate after any camera motion from the drag and the resumed turns.
    target = await locate(); stage('target-after-controls', target)
    assert.ok(target.point, 'Spy must remain pickable after the controls')
    await capture('before')
    await deadline.run(() => page.mouse.click(target.point.x, target.point.y, { button: 'right' }))
    const pending = await witness(); stage('after-press-paused', pending)
    assert.equal(pending.paused, true)
    assert.equal(pending.disguise, prepared.supplied.disguise, 'Discovery is delayed to the next logical turn, not applied on press')
    assert.equal(pending.turn, controls.paused.turn)
    const revealed = await resumeTurns(1, 'discovery-resumed')
    assert.equal(revealed.resumed.disguise, (revealed.resumed.tribe << 6) & 255, 'Next logical turn resets disguise to the Spy owner')
    assert.equal(revealed.paused.disguise, (prepared.supplied.tribe << 6) & 255)
    assert.ok(revealed.paused.sameUnit && revealed.paused.samePerson && revealed.paused.ownerRegistered && revealed.paused.hp > 0)
    await capture('after')
  } else {
    // Ineligible supplied cases. Visible ineligible Spies must be hit by the production
    // person picker (so the control is not a pick miss). The invisible Spy must yield no
    // picker hit at all; its right click uses the projected point above its ground position.
    let point
    if (caseName === 'invisible') {
      assert.equal(target.hitCount, 0, 'Invisible Spy must not be pickable')
      point = { x: target.ground.x, y: target.ground.y - 12 }
    } else {
      assert.ok(target.point && target.hitCount > 0, `${caseName} Spy must be pickable by the production person picker`)
      point = target.point
    }
    await capture('before')
    await deadline.run(() => page.mouse.click(point.x, point.y, { button: 'right' }))
    const control = await resumeTurns(3, 'ineligible-resumed')
    if (caseName === 'changing') {
      // An in-progress disguise keeps counting down its low six bits on ordinary turns
      // (observed 63 -> 60 -> 59 in attempt 1). Discovery would instead reset it to the
      // owner value (tribe << 6). Require the apparent tribe to stay the supplied one,
      // the countdown to remain in progress, and no owner reset.
      assert.equal(control.paused.disguise >>> 6, prepared.supplied.disguise >>> 6, 'changing Spy apparent tribe must not be reset')
      assert.ok((control.paused.disguise & 63) > 0 && control.paused.disguise <= prepared.supplied.disguise, 'changing disguise must still be in progress')
      assert.notEqual(control.paused.disguise, (prepared.supplied.tribe << 6) & 255, 'changing Spy must not be discovered')
    } else assert.equal(control.paused.disguise, prepared.supplied.disguise, `${caseName} Spy must not be discovered`)
    assert.ok(control.paused.sameUnit && control.paused.samePerson)
    await capture('after')
  }
  assert.deepEqual(record.errors, [])
  record.status = 'passed'; report.save()
}

export default async function spyDiscoveryEpisode({ browser, url, output, deadlineAt, cases = ['visible', 'own', 'other-colour', 'changing', 'invisible'], guards = false }) {
  assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now())
  assert.ok(!guards || (cases.length === 1 && cases[0] === 'visible'), 'Guard evidence uses one supplied visible Spy')
  const report = { guards, status: 'running', cases: [], contexts: [], creations: [], closing: false,
    lateContextsClosedUnverified: 0, errors: [], limits: guards ? [...spyDiscoveryLimits.filter(line => !line.startsWith('No natural')), 'Supplied Spy: public Options dialog-targeted input and overview canvas input at a projected production-picker-resolved actor, not visible overview Spy pixels (ground parent hidden); then ordinary discovery recovery; no campaign message-modal coverage', 'No natural Spy acquisition, native pixel parity, save/load, performance or full-gate claim'] : spyDiscoveryLimits }
  report.save = () => writeFileSync(resolve(output, 'spy-discovery-episode.json'),
    JSON.stringify({ ...report, contexts: report.contexts.length, creations: report.creations.length, save: undefined }, null, 2) + '\n')
  const deadline = createDeadline(Math.min(Date.now() + 150000, deadlineAt - 10000))
  try {
    for (const caseName of cases) await runCase({ browser, url, output, deadline, caseName, report, guards })
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.errors.push(String(error?.stack ?? error)); report.timedOut = deadline.expired
  } finally {
    deadline.dispose()
    report.closing = true
    // Adopt any creation that settles within a short bound; later arrivals close on arrival.
    for (const creation of report.creations) {
      let t
      const settled = await Promise.race([creation.catch(() => null),
        new Promise(done => { t = setTimeout(() => done(undefined), 5000) })])
      clearTimeout(t)
      if (settled === undefined) { report.pendingContextCreation = true; report.errors.push('Context creation unsettled at teardown') }
      else if (settled && !report.contexts.includes(settled)) report.contexts.push(settled)
    }
    const closed = []
    for (const context of report.contexts) {
      let t
      try { await Promise.race([context.close(), new Promise((_, reject) => { t = setTimeout(() => reject(Error('context close >5s')), 5000) })]); closed.push(true) }
      catch (error) { report.errors.push(String(error)); closed.push(false) }
      finally { clearTimeout(t) }
    }
    report.contextsClosed = closed.every(Boolean)
    if (!report.contextsClosed) report.status = 'failed'
    report.save()
  }
  assert.equal(report.status, 'passed', 'Spy discovery episode failed; inspect retained receipt')
  return { status: report.status, cases: report.cases.map(c => ({ caseName: c.caseName, status: c.status, screenshots: c.screenshots })) }
}

// Explicit opt-in; existing five-case evidence and its acceptance stay unchanged.
export const spyGuardEpisode = options => spyDiscoveryEpisode({ ...options, cases: ['visible'], guards: true })
