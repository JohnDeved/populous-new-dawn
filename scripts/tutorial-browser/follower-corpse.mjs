import { installCorpseCameraFollow } from './follower-corpse-camera.mjs'
import assert from 'node:assert/strict'
import { collapseObservedCampaignMessages } from '../public-keyboard-owner.mjs'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { bindGame, showAllMissions, settleOpeningMessages } from '../browser-game.mjs'
import { readCommittedCheckpoint } from '../local-render/checkpoint-observer.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'
import { meleeCameraInput, meleeTargetPoint, readMeleeRouteState, assertMeleeRouteReady } from './melee-attack.mjs'
import { installFollowerCorpseObserver, readFollowerCorpseHold,
  readFollowerCorpseReady, readCommittedFollowerCorpse } from './follower-corpse-observer.mjs'
import { validateFollowerCorpseObservation } from './follower-corpse-evidence.mjs'

export const followerCorpseBudgetMs = Object.freeze({ deathAndSave: 75000, loadAndVerify: 25000 })
const root = resolve(import.meta.dirname, '../..'), viewport = { width: 960, height: 720 }
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

// These fences are scoped to the stock scalable Mission 2, not a timing
// promise for other levels or roster/Pathfinder states. Earlier attacks can
// lose the alive-in-combat predecessor; later setup can select another brave.
const alignmentWindow = Object.freeze({ skip: [70, 96], pause: [104, 107], attack: [113, 116] })
const alignedActorId = 1235, alignedTargetId = 20
const inWindow = (turn, [first, last]) => Number.isInteger(turn) && turn >= first && turn <= last

// Read-only capture of actual DOM clicks. The existing startup helper owns its
// Skip input. The two HUD controls additionally require trusted clicks below.
function installAlignmentClickObserver() {
  const clicks = []
  const record = event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null
    const label = button?.matches('.skip-introduction') ? 'Skip Introduction' : button?.getAttribute('aria-label')
    if (!['Skip Introduction', 'Pause game', 'Resume game'].includes(label)) return
    const scene = window.testSceneRef?.current, w = window.testStore?.getWorld()
    if (!scene || scene.world !== w || w.outcome.level !== 2 || clicks.length >= 16) return
    clicks.push({ label, turn: w.turn, paused: w.paused, mask: w.inputMask, flybyFlags: w.flyby.flags,
      trusted: event.isTrusted, x: event.clientX, y: event.clientY, stamp: scene.renderer.info.render.frame })
  }
  const attack = event => {
    const scene = window.testSceneRef?.current, w = window.testStore?.getWorld()
    if (!scene || scene.world !== w || w.outcome.level !== 2 || clicks.length >= 16 ||
        event.target !== scene.renderer.domElement || event.button !== 0 || !event.shiftKey) return
    clicks.push({ label: 'Shift+left on live canvas', trusted: event.isTrusted, x: event.clientX,
      y: event.clientY, turn: w.turn, target: scene.hoveredObject, paused: w.paused,
      mask: w.inputMask, selected: [...w.selected] })
  }
  document.addEventListener('click', record, true)
  document.addEventListener('pointerup', attack, true)
  window.__pndCorpseAlignmentClicks = { read: () => clicks.slice(), stop: () => {
    document.removeEventListener('click', record, true)
    document.removeEventListener('pointerup', attack, true)
  } }
}

function inspectPauseResumeAtPoint({ x, y, label }) {
  const scene = window.testSceneRef?.current, w = window.testStore?.getWorld()
  const hit = document.elementFromPoint(x, y)
  const button = hit?.closest('button')
  const owners = [...document.querySelectorAll('.top-actions button')].filter(
    candidate => candidate.getAttribute('aria-label') === label && !candidate.disabled && candidate.getClientRects().length)
  const rect = owners[0]?.getBoundingClientRect()
  return { turn: w?.turn, paused: w?.paused, mask: w?.inputMask, level: w?.outcome.level,
    sceneStoreMatch: !!scene && scene.world === w, ownsPoint: owners.length === 1 && button === owners[0],
    centerMatches: !!rect && Math.abs(rect.x + rect.width / 2 - x) <= 1 && Math.abs(rect.y + rect.height / 2 - y) <= 1 }
}

function validHudPoint(observation, paused) {
  return observation.sceneStoreMatch && observation.level === 2 && observation.mask === 0 &&
    observation.paused === paused && observation.ownsPoint && observation.centerMatches
}


// These are distinct functional phases, not a retry or a refreshable timeout.
// The runner's existing global 180-second deadline remains authoritative.
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
export async function pauseLoadedFollowerCorpse(page, effectId, button) {
  const readyBeforePause = await page.evaluate(readFollowerCorpseReady, effectId)
  const assertReady = state => {
    assert.equal(state.sceneReplaced, true, 'Load checkpoint must create a new ready Scene')
    assert.equal(state.worldReplaced, true, 'The ready Scene must use the replacement World')
    assert.equal(state.sceneStoreMatch, true); assert.equal(state.canvasConnected, true)
    assert.equal(state.effect?.id, effectId)
  }
  assertReady(readyBeforePause)
  assert.equal(readyBeforePause.paused, false, 'Home resumes the loaded World after its transient store notification')
  await button('Pause game')
  await page.waitForFunction(() => window.testStore.getWorld().paused)
  const readyPaused = await page.evaluate(readFollowerCorpseReady, effectId)
  assertReady(readyPaused); assert.equal(readyPaused.paused, true)
  return { readyBeforePause, readyPaused }
}

export default async function followerCorpse({ browser, url, output, expectedRevision }) {
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
      'Death through verified committed save has 75 seconds; only successful committed-save proof starts the separate 25-second load/reframe/continuation/verification budget. Both remain inside the runner’s unchanged shared 180-second browser cap.',
      'Browser sampling establishes observed source/frame/heading/visibility and continuation, not exact animation cadence. Cadence remains the separate native follower-corpse-animation unit-test claim.'],
    source: Object.fromEntries(['scripts/tutorial-browser/follower-corpse.mjs',
      'scripts/tutorial-browser/follower-corpse-observer.mjs', 'scripts/tutorial-browser/follower-corpse-camera.mjs', 'scripts/tutorial-browser/follower-corpse-evidence.mjs',
      'tests/fixtures/follower-corpse-native.json', 'app/original-units.json', 'app/follower-corpse-animation.ts',
      'app/scene-effects.ts', 'app/world-turn.ts', 'app/game-store.ts', 'app/checkpoint-format.ts',
      'app/page.tsx', 'app/original-pause-menu.tsx', 'scripts/public-keyboard-owner.mjs']
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
  // Prelocate the literal public button. Raw mouse input avoids repeating
  // Playwright's actionability cycle at the narrow logical phase boundary.
  const hudPoint = async label => {
    const element = page.getByRole('button', { name: label, exact: true })
    const rect = await element.boundingBox()
    assert.ok(rect && rect.width > 0 && rect.height > 0, `${label} must have a visible HUD button`)
    return { label, x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }
  }
  const retainAlignment = async () => {
    if (page.isClosed() || !report.alignment) return
    report.alignment.clicks = await page.evaluate(() => window.__pndCorpseAlignmentClicks?.read() ?? [])
    save()
  }
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
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await action('New Game / No / Browser controls / All missions', () => showAllMissions(page))
    report.alignment = { windows: alignmentWindow, clicks: [] }
    await page.evaluate(installAlignmentClickObserver)
    await button('Mission 2'); await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue(); await startup.dispose()
    assert.equal(report.startup.level, 2)
    assert.ok(report.startup.action === 'skip' && report.startup.skipVisible &&
      report.startup.inputMask === 64 && report.startup.flybyFlags === 21,
    'Authored Skip owner is not visible/eligible; do not ask the startup helper to issue input')
    await action('Settle opening messages and introduction', () => settleOpeningMessages(page))
    await retainAlignment()
    const initialSkip = report.alignment.clicks.find(click => click.label === 'Skip Introduction' && click.mask === 64 && click.flybyFlags === 21)
    assert.ok(initialSkip && inWindow(initialSkip.turn, alignmentWindow.skip),
      'Observed authored Skip must be inside tested M2 startup window; no reroute or retry')
    const pausePoint = await hudPoint('Pause game')
    phase('public-combat-setup')
    await action('Pause game', async () => {
      const gate = await page.waitForFunction(min => window.testStore.getWorld().turn >= min,
        alignmentWindow.pause[0], { timeout: budget.remaining() })
      const before = report.alignment.beforePause = await page.evaluate(inspectPauseResumeAtPoint, pausePoint)
      assert.ok(validHudPoint(before, false) && inWindow(before.turn, alignmentWindow.pause) && before.turn < alignmentWindow.pause[1],
        'Real Pause owner or authored phase is not eligible; do not click')
      await page.mouse.click(pausePoint.x, pausePoint.y)
      await gate.dispose()
      await retainAlignment()
      const click = report.alignment.clicks.find(c => c.label === 'Pause game')
      const after = report.alignment.afterPause = await page.evaluate(() => {
        const w = window.testStore.getWorld(); return { turn: w.turn, paused: w.paused, mask: w.inputMask }
      })
      assert.ok(click?.trusted && click.x === pausePoint.x && click.y === pausePoint.y && !click.paused,
        'Expected one trusted click on the actual public Pause button')
      assert.ok(inWindow(click.turn, alignmentWindow.pause) && after.turn === click.turn && after.paused && !after.mask,
        'Real Pause click did not establish the authored timing window')
      return { point: pausePoint, before, click, after }
    })
    await action('Focus shaman (right-click)', () => page.getByRole('button', { name: 'Select shaman', exact: true }).click({ button: 'right' })); await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out', () => page.keyboard.press('-')); await settle()
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await focus(null)
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await action('Public campaign-message collapse before Escape', () => collapseObservedCampaignMessages(page, {
      remainingMs: budget.remaining,
      observe: observation => { (report.keyboardOwnership ??= []).push(observation); save() },
    }))
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
    assert.equal(actor.id, alignedActorId, 'Natural public single-Brave selection must identify this authored episode')
    assert.equal(report.selection.turn, report.alignment.afterPause.turn)
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId })
    const bounds = await page.evaluate(() => {
      const s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect(), b = s.picking.personBounds(20, r)
      return b && { x: r.left + b.x, y: r.top + b.y, width: b.width, height: b.height }
    })
    assert.ok(bounds); report.targetHoverAttempts = []
    const point = await meleeTargetPoint(page, bounds, report.targetHoverAttempts, save)
    const pausedAim = report.alignment.pausedAim = await page.evaluate(({ x, y }) => {
      const s = window.testSceneRef.current, w = window.testStore.getWorld()
      return { turn: w.turn, paused: w.paused, stamp: s.renderer.info.render.frame,
        target: s.hoveredObject, ownsPoint: document.elementFromPoint(x, y) === s.renderer.domElement }
    }, point)
    assert.ok(pausedAim.paused && pausedAim.ownsPoint && pausedAim.target === alignedTargetId)
    const resumePoint = await hudPoint('Resume game')
    await action('Resume game', async () => {
      const before = report.alignment.beforeResume = await page.evaluate(inspectPauseResumeAtPoint, resumePoint)
      assert.ok(validHudPoint(before, true) && before.turn === pausedAim.turn,
        'Real Resume button moved or paused world advanced')
      await page.mouse.click(resumePoint.x, resumePoint.y)
      // Clicking the public HUD button moves the pointer. Revisit only the
      // already observed point with real input; never pick another after Resume.
      await page.mouse.move(point.x, point.y)
      return { point: resumePoint, before, targetPoint: point }
    })
    let live
    await action('Public Shift+left attack click on eligible Green Shaman20', async () => {
      // The generic action receipt is persisted before this boundary, not
      // between the final live read and the trusted canvas click. Preserve
      // the unmodified Pause, aim and Resume; arm only the real modifier now.
      try {
        await page.keyboard.down('Shift')
        live = await page.waitForFunction(({ point, pausedAim, resumePoint, first, last }) => {
          const s = window.testSceneRef?.current, w = window.testStore?.getWorld()
          if (!s || !w) return false
          const person = id => {
            const unit = w.units.find(u => u.id === id), group = s.unitMeshes.get(id)
            return unit ? { id, kind: unit.kind, team: unit.team, hp: unit.hp, x: unit.x, z: unit.z,
              inside: unit.inside, visible: group?.visible ?? false, pickable: group?.userData.pickable === true,
              frame: group?.userData.frame ?? null, target: unit.target,
              fight: unit.fight && { group: unit.fight.group, action: unit.fight.action, opponent: unit.fight.opponent } } : null
          }
          const target = person(20)
          const owned = document.elementFromPoint(point.x, point.y) === s.renderer.domElement
          const pointer = s.pointerScreen?.clientX === point.x && s.pointerScreen?.clientY === point.y
          const resume = window.__pndCorpseAlignmentClicks?.read().find(c => c.label === 'Resume game')
          const resumeEligible = resume?.trusted === true && resume.paused && resume.turn === pausedAim.turn &&
            resume.x === resumePoint.x && resume.y === resumePoint.y
          const snapshot = { sceneAvailable: true, sceneStoreMatch: s.world === w, turn: w.turn, selected: [...w.selected],
            paused: w.paused, speed: w.speed, drawMode: w.drawMode, inputMask: w.inputMask,
            actor: person(54), target, hiddenPriorTarget: person(13),
            camera: { position: { ...s.cameraPosition }, target: { ...s.cameraMotion.target },
              active: s.cameraMotion.active, preset: s.viewPreset, overview: s.overviewActive,
              transitioning: !!s.viewTransition, resultActive: s.resultCamera.active },
            rendererStamp: s.renderer.info.render.frame, canvasConnected: s.renderer.domElement.isConnected,
            hover: s.hoveredObject, owned, pointer, resumeEligible }
          if (w.turn >= last) return { ...snapshot, eligible: false, reason: 'no remaining live input headroom' }
          if (!resumeEligible) return { ...snapshot, eligible: false, reason: 'no trusted Resume in frozen phase' }
          const eligible = w.turn >= first && snapshot.rendererStamp > pausedAim.stamp && snapshot.sceneStoreMatch &&
            snapshot.canvasConnected && !snapshot.paused && !snapshot.inputMask && snapshot.speed === 1 &&
            snapshot.camera.preset === 2 && !snapshot.camera.transitioning && !snapshot.camera.active &&
            !snapshot.camera.overview && !snapshot.camera.resultActive && snapshot.drawMode === 0 &&
            snapshot.selected.length === 1 && snapshot.selected[0] === 1235 &&
            target?.id === 20 && target.team === 'green' && target.hp > 0 && target.inside === null &&
            target.visible && target.pickable && snapshot.hover === 20 && owned && pointer
          return eligible ? { ...snapshot, eligible } : false
        }, { point, pausedAim, resumePoint, first: alignmentWindow.attack[0], last: alignmentWindow.attack[1] },
        { timeout: budget.remaining() })
        const route = report.targetEligibility = await live.jsonValue()
        assert.ok(route.eligible && inWindow(route.turn, alignmentWindow.attack), 'No qualified live target in authored timing window; do not click')
        report.beforeAttack = { turn: route.turn, stamp: route.rendererStamp }
        await page.mouse.click(point.x, point.y)
      } finally {
        await page.keyboard.up('Shift')
      }
    })
    report.order = await page.evaluate(actorId => {
      const w = window.testStore.getWorld(), u = w.units.find(u => u.id === actorId)
      return { turn: w.turn, lastOrderTurn: w.lastOrderTurn, selected: [...w.selected], paused: w.paused,
        actorId, target: u?.target, path: structuredClone(u?.path), nativeCommands: u?.native && [...u.native.commands] }
    }, report.actorId)
    await live.dispose()
    await retainAlignment()
    const attacks = report.alignment.clicks.filter(c => c.label === 'Shift+left on live canvas')
    assert.equal(attacks.length, 1, 'Expected exactly one ordinary Shift+left canvas release')
    const attack = attacks[0]
    assert.ok(attack.trusted && !attack.paused && !attack.mask && attack.target === alignedTargetId &&
      attack.x === point.x && attack.y === point.y && inWindow(attack.turn, alignmentWindow.attack),
    'Trusted canvas release must target the live authored unit inside the timing window')
    assert.deepEqual(attack.selected, [alignedActorId])
    await page.evaluate(() => window.__pndCorpseAlignmentClicks.stop())
    assert.deepEqual(report.order.selected, [report.actorId]); assert.equal(report.order.target, 20); assert.equal(report.order.paused, false)
    assert.ok(report.order.lastOrderTurn >= report.beforeAttack.turn && report.order.lastOrderTurn <= report.order.turn &&
      inWindow(report.order.lastOrderTurn, alignmentWindow.attack) && report.order.lastOrderTurn === attack.turn,
    'The single actual public attack order must be inside the tested authored timing window'); save()
    await page.evaluate(installCorpseCameraFollow, { order: report.order })
    phase('ordinary-combat')
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result
      return r.error || r.samples.some(s => s.phase === 1 && !s.paused && s.cropFile)
    }, null, { timeout: budget.remaining() })
    assert.equal(await page.evaluate(() => window.__pndCorpseObservation.result.error), null)
    report.cameraFollow = await page.evaluate(() => window.__pndCorpseCameraFollow.stop('combat-complete'))
    assert.equal(report.cameraFollow.error, null)
    report.effectId = await page.evaluate(() => window.__pndCorpseObservation.result.effectId)
    phase('pause-and-save')
    await button('Pause game')
    report.checkpoint = { holdBefore: await page.evaluate(readFollowerCorpseHold, report.effectId) }
    assert.equal(report.checkpoint.holdBefore.paused, true)
    assert.equal(report.checkpoint.holdBefore.effect.corpse.phase, 1)
    await page.waitForTimeout(150)
    report.checkpoint.holdAfter = await page.evaluate(readFollowerCorpseHold, report.effectId)
    assert.deepEqual(report.checkpoint.holdAfter, report.checkpoint.holdBefore)
    await button('Game settings'); await button('Save Game'); await button('Save checkpoint')
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
    Object.assign(report.checkpoint, await pauseLoadedFollowerCorpse(page, report.effectId, button)); save()
    assert.equal(report.checkpoint.readyPaused.effect.corpse.phase, 1, 'Ready-scene setup must remain within the saved corpse phase')
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out after actual Load checkpoint', () => page.keyboard.press('-')); await settle()
    await focus(report.effectId)
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId, effectId: report.effectId, segment: 'loaded' })
    await button('Resume game')
    report.checkpoint.readyResumed = await page.evaluate(readFollowerCorpseReady, report.effectId); save()
    assert.equal(report.checkpoint.readyResumed.paused, false)
    phase('loaded-continuation')
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result; return r.error || r.done
    }, null, { timeout: budget.remaining() })
    phase('acceptance-and-capture')
    await retain()
    report.acceptance = validateFollowerCorpseObservation(report)
    await button('Pause game')
    await page.screenshot({ path: resolve(output, 'follower-corpse-context.png') })
    budget.complete()
  } catch (error) {
    failure = error; report.failure = { message: String(error), stack: error.stack }; save()
    if (!page.isClosed()) try {
      await retainAlignment()
      await page.evaluate(() => window.__pndCorpseAlignmentClicks?.stop())
    } catch (error) { report.alignmentObservationError = String(error); save() }
    if (!page.isClosed()) try { await page.screenshot({ path: resolve(output, 'follower-corpse-failure.png'), timeout: 2000 }) }
    catch (error) { report.failureScreenshotError = String(error) }
  } finally {
    budget.dispose()
    finishPhase(!failure && !report.timedOut)
    if (!page.isClosed()) try { report.cameraFollow ??= await page.evaluate(() => window.__pndCorpseCameraFollow?.stop('cleanup') ?? null) }
    catch (error) { report.errors.push(`Corpse camera cleanup: ${error}`) }
    try { await retain() } catch (error) { report.errors.push(`Corpse retention: ${error}`) }
    try { await context.close(); report.contextClosed = true } catch (error) { report.errors.push(`Corpse cleanup: ${error}`) }
    report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'
    report.finishedAt = new Date().toISOString(); report.elapsedMs = elapsed(); save()
  }
  assert.equal(report.status, 'passed', 'Follower corpse browser case failed; see follower-corpse.json')
  return report
}
