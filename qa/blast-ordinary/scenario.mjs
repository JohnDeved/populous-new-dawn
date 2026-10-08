import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { waitForShamanReadiness } from '../../scripts/browser-game.mjs'
import { pollWithPreservation, readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'
import { createBlastPreparation, releaseHeldBlast, waitForBlastAdmission } from './preparation.mjs'

// First-stage ordinary witness. This module does not run a browser on import.
export default async function ordinaryBlast({ page, output, receipt, signal, openMission }) {
  const expectation = process.env.POPULOUS_BLAST_EXPECTATION
  const diagnostic = process.env.POPULOUS_BLAST_PICK_DIAGNOSTIC === '1'
  const baselineProposal = expectation === 'baseline' && !diagnostic
  const minimumDistance = baselineProposal ? 0 : 7
  if (diagnostic) assert.equal(expectation, 'baseline', 'This diagnostic precedes candidate acceptance')
  assert.ok(['baseline', 'candidate'].includes(expectation), 'Set POPULOUS_BLAST_EXPECTATION explicitly')
  assert.equal(receipt.profile?.mode, 'created', 'Each application product needs its own fresh profile')
  assert.ok(basename(receipt.profile.path).startsWith(`blast-m2-${expectation}-`), 'Use an expectation-specific fresh profile name')
  assert.equal(receipt.profile.checkpointAtStart, null)
  assert.equal(receipt.profile.previousRun, null)
  assert.ok(basename(output).startsWith(`blast-m2-${expectation}-`), 'Use an expectation-specific fresh output')
  const commands = resolve(output, 'commands'), started = Date.now(), actions = []
  mkdirSync(commands)
  const limits = { wallMs: 240000, approachMs: 140000, cameraMs: 15000, castMs: 10000, maximumSetupTurn: 1800 }
  let attached = false, setupAttached = false, primaryError, result, diagnosticResult
  let preparation, target, home
  let admittedObservation
  const save = (name, data) => writeFileSync(resolve(output, name), JSON.stringify(data, null, 2) + '\n')
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.ok(Date.now() - started < limits.wallMs, 'Scenario wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (stop) { writeFileSync(resolve(output, 'stop-command.json'), stop.bytes); throw Error('Current-run stop input received; no additional actions') }
  }
  const poll = (check, timeout, label) => pollWithPreservation(check, { checkStop, timeout, label, interval: 50, sleep: ms => page.waitForTimeout(ms) })
  const input = async (kind, details, fn, guarded = true) => {
    if (guarded) await checkStop(); actions.push({ kind, details, wallMs: Date.now() - started, phase: 'before' }); await fn()
    actions.push({ kind, details, wallMs: Date.now() - started, phase: 'after' }); if (guarded) await checkStop()
  }
  const current = async () => {
    const state = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world, sample = window.blastSetup.snapshot()
      return { ...sample, flags: w.manaWorld.gameFlags, castCount: w.stats.cast, random: w.randomState }
    })
    assert.ok(state, 'Setup snapshot failed')
    assert.deepEqual(state.failures, [], 'Original scene, World or healthy Shaman changed; setup trace retained')
    return state
  }
  const healthy = state => {
    assert.equal(state.level, 2); assert.equal(state.status, 'playing'); assert.equal(state.paused, false); assert.equal(state.speed, 1)
    assert.equal(state.flags & 32, 0); assert.ok(state.actor.hp > 0); assert.ok(state.turn < limits.maximumSetupTurn)
  }
  const settle = () => poll(() => page.evaluate(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  }), limits.cameraMs, 'public camera settlement')
  try {
    await openMission(2)
    const readiness = await waitForShamanReadiness(page)
    const roster = await page.evaluate(() => {
      const w = window.testSceneRef.current.world
      return { turn: w.turn, level: w.outcome.level,
        levelStart: w.levelStart.map(site => ({ tribe: site.tribe, shaman: site.shaman, phase: site.phase })),
        people: w.units.filter(u => u.team === 'blue' || u.team === 'wild').map(u => ({ id: u.id, team: u.team, kind: u.kind,
          hp: u.hp, inside: u.inside, x: u.x, z: u.z, ghost: !!u.ghost, native: u.native ?
            { id: u.native.id, class: u.native.class, flags2: u.native.flags2, flags4: u.native.flags4 } : null })) }
    })
    save('startup-roster.json', { readiness, ...roster })
    await page.evaluate(async census => {
      if (window.blastOriginal || window.blastEpisode) throw Error('No observer rearming')
      const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      if (!actor || world.stats.cast || world.shots.blast !== 4) throw Error('Untouched fresh Mission2 start required')
      const recordedIds = new Set(census.people.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null && !u.ghost).map(u => u.id))
      const boundBraves = world.units.filter(u => recordedIds.has(u.id) && u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null && !u.ghost)
      if (!boundBraves.length) throw Error('An eligible naturally present Blue Brave from the recorded census is required')
      window.blastOriginal = { scene, world, actor, boundBraves, target: null }
      const { observeBlastSetup } = await import('/qa/blast-ordinary/setup-observer.mjs')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const { unitAnimationSource } = await import('/app/selection-runtime.ts')
      const { observeBlastEpisode, responseSnapshot, pointerFeedback } = await import('/qa/blast-ordinary/observer.mjs')
      const { observeBlastPick } = await import('/qa/blast-ordinary/pick-observer.mjs')
      const { findProposedBlastPixel, bindStagedBlastTarget, stationaryBlastTarget } = await import('/qa/blast-ordinary/preparation.mjs')
      const { observeEntityPointer, findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
      const { spellTargetError } = await import('/app/model.ts'), { wrappedDistance } = await import('/app/world-coordinates.ts')
      window.blastHelpers = { stationaryBlastTarget, bindStagedBlastTarget, currentPersonOrder, findProposedBlastPixel, observeBlastPick, unitAnimationSource, observeBlastEpisode, responseSnapshot, pointerFeedback, observeEntityPointer, findEntityInput, inspectEntityPoint, spellTargetError, wrappedDistance }
      window.blastSetup = observeBlastSetup(scene, actor, { currentOrder: (w, p) => currentPersonOrder(w.buildingOrders, p) })
      if (window.blastSetup.read().errors.length) throw Error('Setup observation could not attach')
    }, roster)
    setupAttached = true
    healthy(await current()); save('startup.json', { readiness, state: await current(), limits })
    await input('escape', {}, () => page.keyboard.press('Escape'))
    await input('followers-tab', {}, () => page.getByLabel('followers', { exact: true }).click())
    await input('select-shaman', {}, () => page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click())
    await settle()
    const selected = await current(); home = { x: selected.actor.x, z: selected.actor.z }
    assert.deepEqual(selected.selected, [selected.actor.id]); assert.equal(selected.mode, null)
    await input('clear-selection', {}, () => page.keyboard.press('Escape'))
    await input('select-one-brave', {}, () => page.getByRole('button', { name: 'Select brave', exact: true }).click())
    target = await page.evaluate(() => {
      const { world, boundBraves } = window.blastOriginal
      if (world.selected.length !== 1) throw Error('Exactly one public HUD-selected Brave required')
      const unit = world.units.find(u => u.id === world.selected[0])
      if (!boundBraves.includes(unit) || unit.team !== 'blue' || unit.kind !== 'brave' || unit.hp <= 0 || unit.inside !== null)
        throw Error('Selected person must be the same outdoor Brave recorded before commands')
      window.blastOriginal.target = unit
      return { id: unit.id, team: unit.team, kind: unit.kind, x: unit.x, z: unit.z }
    })
    preparation = createBlastPreparation({ targetId: target.id, maximumSetupTurn: limits.maximumSetupTurn, minimumDistance })
    const groundAt = approach => page.evaluate(async approach => {
      const s = window.testSceneRef.current, rect = s.container.getBoundingClientRect(), { createMoveContextProbe, isOrdinaryMoveContext } = await import('/qa/erosion-ordinary/input.mjs')
      const probe = createMoveContextProbe(s.world)
      for (const delta of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
        const p = { x: approach.x + delta[0], z: approach.z + delta[1] }, q = s.screen(p)
        // Inspect, retain and deliver one canonical integer CSS pixel.
        const e = { clientX: Math.round(rect.left + (q.x + 1) * rect.width / 2), clientY: Math.round(rect.top + (1 - q.y) * rect.height / 2) }
        if (document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement || s.picking.pick(e) !== null) continue
        const picked = s.pick(e)
        if (picked && Math.hypot(picked.x - p.x, picked.z - p.z) < 0.75 && isOrdinaryMoveContext(probe(picked))) return { x: e.clientX, y: e.clientY, point: { x: picked.x, z: picked.z } }
      }
      return null
    }, approach)
    const ground = await groundAt({ x: -99, z: -101 })
    assert.ok(ground, 'No real ordinary ground move at the bounded approach')
    const preparationDeadline = Date.now() + limits.approachMs
    const preparationRemaining = () => {
      const remaining = preparationDeadline - Date.now()
      assert.ok(remaining > 0, 'Combined staging and pointer preparation deadline reached')
      return remaining
    }
    const groundBefore = await current()
    await page.evaluate(() => { window.blastGround = window.blastHelpers.observeEntityPointer(window.testSceneRef.current) })
    await input('approach-ground', ground, () => page.mouse.click(ground.x, ground.y))
    const groundAfter = await current(), groundPointer = await page.evaluate(() => {
      const result = window.blastGround.finish(); window.blastGround = null
      const target = window.blastOriginal.target
      window.blastOriginal.stagePerson = target.native ?? target.entry?.person
      return result
    })
    save('ground-dispatch.json', { before: groundBefore, after: groundAfter, pointer: groundPointer })
    assert.deepEqual(groundBefore.selected, [target.id])
    assert.deepEqual(groundPointer.errors, []); assert.equal(groundPointer.restored, true)
    const deliveredGround = groundPointer.events.find(e => e.type === 'pointerup')
    assert.ok(deliveredGround?.trusted && deliveredGround.canvasTarget && deliveredGround.canvasOwned)
    assert.ok(deliveredGround.picks.some(p => p.owner === 'scene' && p.name === 'pick' && p.point && Math.hypot(p.point.x - ground.point.x, p.point.z - ground.point.z) < 0.75))
    const recipient = groundAfter.recipients.find(row => row.id === target.id)?.person
    assert.equal(recipient?.order?.model, 3, 'Original selected Brave did not receive the ordinary move order')
    assert.deepEqual({ x: groundAfter.actor.x, z: groundAfter.actor.z }, home)
    assert.equal(recipient.order.a & 65535, Math.round((ground.point.x + 8) * 256) & 65535)
    assert.equal(recipient.order.b & 65535, Math.round((-ground.point.z - 8) * 256) & 65535)
    assert.ok(groundAfter.pointerAck.until > groundBefore.pointerAck.until)
    assert.ok(groundAfter.orderMarkers.some(e => !groundBefore.orderMarkers.some(old => old.id === e.id)))
    const movementGround = await groundAt({ x: -93, z: -101 })
    assert.ok(movementGround, 'Precomputed empty-ground continuation required before casting')
    let staged
    await poll(async () => {
      staged = await page.evaluate(point => window.blastHelpers.bindStagedBlastTarget(window.blastOriginal, point, window.blastHelpers.currentPersonOrder), ground.point)
      return staged.ready
    }, preparationRemaining(), 'same registered Brave completing the accepted public staging move')
    save('staged-target.json', staged)
    const state = await current(); healthy(state)
    await page.evaluate(({ options, ground }) => {
      window.blastEpisode = window.blastHelpers.observeBlastEpisode(window.testSceneRef.current, options)
      window.blastEpisode.prepareMove(ground)
    }, { options: { expectation, actorId: state.actor.id, targetId: target.id, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, maxTurns: 48 }, ground: movementGround })
    attached = true
    await input('blast-key', {}, () => page.keyboard.press('1'))
    assert.equal((await current()).mode, 'blast')
    let prior, trigger
    await poll(async () => {
      const observed = await page.evaluate(({ previous, expectation, maximumSetupTurn, diagnostic, baselineProposal, minimumDistance }) => {
        const s = window.testSceneRef.current, w = s.world, started = performance.now()
        const { stationaryBlastTarget, responseSnapshot, pointerFeedback, spellTargetError, wrappedDistance, findEntityInput, findProposedBlastPixel, inspectEntityPoint } = window.blastHelpers
        const sample = window.blastSetup.snapshot(), actor = window.blastOriginal.actor
        const state = { turn: w.turn, level: w.outcome.level, status: w.status, paused: w.paused, speed: w.speed,
          flags: w.manaWorld.gameFlags, mode: w.mode, stock: w.shots.blast, inputMask: w.inputMask, cameraSettled: !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition, actor: { id: actor.id, hp: actor.hp, x: actor.x, z: actor.z }, failures: sample?.failures ?? ['snapshot'] }
        const report = window.blastEpisode.progress(), prepared = report.hover
        const response = responseSnapshot(s), p = response[0]
        const motionTurn = prepared?.previousTurn ?? previous?.turn
        const motionPosition = prepared?.previousPosition ?? previous?.response[0]?.position
        const probe = structuredClone(w), target = p && probe.units.find(u => u.id === p.id)
        const targetError = target ? spellTargetError(probe, 'blast', target) : 'missing target'
        const distance = p ? wrappedDistance(actor, p) : null, box = p && s.picking.personBounds(p.id)
        const rect = s.container.getBoundingClientRect(), event = s.pointerScreen
        const inspection = { canvasOwned: 0, outsideCanvas: 0, targetHit: 0, nullHit: 0, otherHit: 0, sampleLimit: 250, samples: [] }
        const inspect = point => {
          const result = inspectEntityPoint(s, 'units', point)
          if (!result.canvasOwned) inspection.outsideCanvas++
          else {
            inspection.canvasOwned++
            if (result.hitId === p.id) inspection.targetHit++
            else if (result.hitId === null) inspection.nullHit++
            else inspection.otherHit++
          }
          if (inspection.samples.length < inspection.sampleLimit) inspection.samples.push({ x: point.x, y: point.y, ...result,
            geometricKind: result.canvasOwned ? s.picking.lastKind : null,
            geometricId: result.canvasOwned ? s.picking.lastId : null })
          return result
        }
        const group = s.unitMeshes.get(window.blastOriginal.target.id), layer = group?.userData.layers?.findLast(piece => piece.visible)
        const source = layer && s.view.painter.source(layer), unit = window.blastOriginal.target
        const activeNative = window.blastHelpers.unitAnimationSource(unit)
        const renderedBody = { originalTargetPresent: w.units.includes(unit), sameIdIsOriginal: w.units.find(person => person.id === unit.id) === unit,
          targetId: unit.id, hp: unit.hp, team: unit.team, kind: unit.kind, visible: group?.visible ?? null, pickable: group?.userData.pickable ?? null,
          frame: group?.userData.frame ?? null, spriteBucket: group?.userData.spriteBucket ?? null,
          inside: unit.inside, nativeRenderFlags: unit.native?.renderFlags ?? null, nativeFlags2: unit.native?.flags2 ?? null,
          activeNative: activeNative ? { id: activeNative.id, class: activeNative.class, model: activeNative.model,
            state: activeNative.state, renderFlags: activeNative.renderFlags, flags2: activeNative.flags2 } : null,
          visibleLayer: !!layer, layerHasPainterSource: !!source,
          painterSource: source ? { bucket: source.bucket, cell: source.cell, phase: source.phase, object: source.object, face: source.face } : null }
        const live = state.turn < maximumSetupTurn && state.failures.length === 0 && state.level === 2 && state.status === 'playing' && !state.paused &&
          state.speed === 1 && !(state.flags & 32) && !state.inputMask && state.cameraSettled && state.mode === 'blast' && state.stock > 0 && state.actor.hp > 0
        const stationary = stationaryBlastTarget(p, motionTurn, motionPosition, w.turn, !!actor.fight)
        let searchPixels = true, diagnosticComplete = false, diagnosticError = null
        if (diagnostic && live && stationary && distance >= 7 && targetError === null) {
          window.blastPick ??= window.blastHelpers.observeBlastPick(s, { targetId: window.blastOriginal.target.id })
          try { searchPixels = window.blastPick.beginSearch() }
          catch (error) { diagnosticError = String(error.message); searchPixels = false }
        } else if (diagnostic && window.blastPick) {
          searchPixels = false; diagnosticError = 'State eligibility lost before the matching rendered pick'
        }
        const restingPoint = event && { x: event.clientX, y: event.clientY }
        const resting = baselineProposal && searchPixels && p && restingPoint && inspect(restingPoint)
        let existingHit = null
        if (baselineProposal) {
          if (resting?.canvasOwned && resting.hitId === p.id) existingHit = restingPoint
        } else if (searchPixels && p && event) existingHit = findEntityInput([restingPoint], p.id, inspect)
        const candidates = []
        if (box) for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65])
          candidates.push({ x: rect.left + box.x + box.width * fx, y: rect.top + box.y + box.height * fy })
        const nextHit = baselineProposal
          ? searchPixels && p && findProposedBlastPixel(candidates, p.id, inspect)
          : existingHit || (searchPixels && p && findEntityInput(candidates, p.id, inspect))
        if (diagnostic && window.blastPick && searchPixels) { window.blastPick.seal(); diagnosticComplete = true }
        const feedback = pointerFeedback(s)
        const phenotype = expectation === 'candidate' ? feedback.visible && feedback.lines === 16 && feedback.targetId === window.blastOriginal.target.id : !feedback.visible
        const atStagingPoint = !!(p && Math.hypot(p.x + 99, p.z + 101) <= 2)
        const eligible = !!(atStagingPoint && live && stationary && distance >= minimumDistance && targetError === null && existingHit && phenotype)
        const proposal = null
        let hover = prepared, ready = false, rejection = null, phase = 'preparing'
        if (!p) rejection = 'original-person-unavailable'
        else if (report.errors.length) rejection = 'episode-observation-error'
        else if (prepared && JSON.stringify(p.position) !== JSON.stringify(prepared.position)) rejection = 'prospective-hover-pose-changed'
        else if (prepared && (!event || event.clientX !== prepared.point.x || event.clientY !== prepared.point.y)) rejection = 'prospective-hover-pixel-changed'
        else if (prepared && JSON.stringify(feedback.context) !== JSON.stringify(prepared.context)) rejection = 'prospective-hover-context-changed'
        else if (eligible && baselineProposal) {
          ready = true; phase = 'ready-to-press'
        }
        else if (eligible && !diagnostic) {
          if (!hover) {
            hover = { turn: w.turn, targetId: p.id, mode: w.mode, canvasOwned: true, hitId: p.id,
              visible: feedback.visible, lines: feedback.lines, context: feedback.context, position: p.position,
              previousTurn: motionTurn, previousPosition: motionPosition, idle: p.idle,
              point: { x: event.clientX, y: event.clientY }, observedAt: performance.now() }
            window.blastEpisode.hover(hover)
          }
          phase = 'awaiting-natural-hover-frame'
          // The real render and its pixel validation finish before admission.
          // Recheck current eligibility here; no read or raster await follows trigger.
          if (report.frames.some(frame => frame.kind === 'hover' && frame.turn <= w.turn)) {
            ready = true; phase = 'ready-to-press'
          }
        }
        return { turn: w.turn, state, response, distance, targetError, actorFighting: !!actor.fight,
          box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
          existingHit, nextHit, inspection, renderedBody, feedback: { targetId: feedback.targetId, visible: feedback.visible, lines: feedback.lines },
          live, stationary, atStagingPoint, phenotype, eligible, phase, rejection, pixelSearchAttempted: searchPixels, diagnosticComplete, diagnosticError, episodeErrors: report.errors, ready, hover, proposal, motionTurn, motionPosition, minimumDistance, preparationKind: baselineProposal ? 'proposed-pixel' : 'hover', readMilliseconds: performance.now() - started }
      }, { previous: prior, expectation, maximumSetupTurn: limits.maximumSetupTurn, diagnostic, baselineProposal, minimumDistance })
      // Preserve failed/onset rows before assertions. The ready-to-press row is
      // retained after input, outside the final trigger/release interval.
      if (observed.ready) { admittedObservation = observed; trigger = observed; return true }
      const { stopReason } = preparation.observe(observed)
      assert.equal(stopReason, null, 'Original response ended or target became unavailable; first observations retained')
      assert.equal(observed.rejection, null, 'Prospective hover admission failed; first observations retained')
      assert.equal(observed.diagnosticError, null, 'Pick/render diagnostic context did not match')
      assert.deepEqual(observed.state.failures, [], 'Original scene, World or healthy Shaman changed; setup trace retained')
      healthy(observed.state)
      assert.deepEqual({ x: observed.state.actor.x, z: observed.state.actor.z }, home, 'Original Shaman must remain at home')
      if (observed.diagnosticComplete) { diagnosticResult = observed; return true }
      prior = observed
      if (!diagnostic && observed.stationary && observed.nextHit && !observed.existingHit)
        await input('prepare-person-hover', { id: target.id, hit: observed.nextHit, turn: observed.turn }, () => page.mouse.move(observed.nextHit.x, observed.nextHit.y))
      return false
    }, preparationRemaining(), 'healthy idle original target at a real stable pointer pixel and actual Blast range')
    if (diagnostic) {
      const proof = await page.evaluate(() => window.blastPick.read())
      assert.deepEqual(proof.errors, []); assert.equal(proof.sealed, true)
      assert.equal(proof.frameMatched, true); assert.equal(proof.cleanupVerified, true)
      assert.ok(proof.calls.length && proof.frame.pixels > 0)
    } else {
      // The pointer and candidate natural hover are prepared before the press.
      // Only one fresh read and the trusted mouse-up remain after left-down.
      let heldCleanup, movementWait
      const readHeld = () => page.evaluate(() => {
        const s = window.testSceneRef.current, w = s.world
        return { turn: w.turn, buttons: s.pointerButtons, mode: w.mode, selected: [...w.selected], castCount: w.stats.cast, lastOrderTurn: w.lastOrderTurn }
      })
      try {
        const releasedPreparation = await releaseHeldBlast({
          press: () => input('blast-person-down', { id: target.id, hit: trigger.existingHit, turn: trigger.turn }, () => page.mouse.down()),
          prepare: () => page.evaluate(({ previous, expectation, minimumDistance, home, maximumSetupTurn }) => {
            const s = window.testSceneRef.current, w = s.world, { actor, target } = window.blastOriginal
            const { responseSnapshot, pointerFeedback, inspectEntityPoint, findEntityInput, spellTargetError, wrappedDistance } = window.blastHelpers
            const report = window.blastEpisode.progress(), p = responseSnapshot(s)[0], e = s.pointerScreen
            const point = e && { x: e.clientX, y: e.clientY }, actual = point && inspectEntityPoint(s, 'units', point)
            const probe = structuredClone(w), copied = probe.units.find(u => u.id === target.id)
            const context = pointerFeedback(s).context, prior = previous.response[0]
            const targetError = copied ? spellTargetError(probe, 'blast', copied) : 'missing target'
            window.blastHeldRead = structuredClone({ turn: w.turn, targetId: target.id, point, actual, response: p, context, targetError,
              buttons: s.pointerButtons, mode: w.mode, actor: { x: actor.x, z: actor.z, hp: actor.hp }, priorHover: report.hover })
            if (w.turn >= maximumSetupTurn || w.status !== 'playing' || w.paused || w.speed !== 1 || w.inputMask || w.manaWorld.gameFlags & 32 ||
                w.mode !== 'blast' || s.pointerButtons !== 1 || w.shots.blast <= 0 || !w.units.includes(actor) || actor.hp <= 0 || actor.fight ||
                actor.x !== home.x || actor.z !== home.z || s.cameraMotion.active || s.resultCamera.active || s.viewTransition ||
                !p || !prior || !p.idle || p.fighting || Math.hypot(p.x + 99, p.z + 101) > 2 || w.turn < previous.turn ||
                p.position.x !== prior.position.x || p.position.y !== prior.position.y || !previous.stationary ||
                wrappedDistance(actor, p) < minimumDistance || targetError !== null ||
                !actual?.canvasOwned || actual.hitId !== target.id)
              throw Error('Held pointer preparation lost original target, motion, range or context')
            if (expectation === 'candidate') {
              if (!report.hover || w.turn < report.hover.turn || JSON.stringify(p.position) !== JSON.stringify(report.hover.position) ||
                  JSON.stringify(point) !== JSON.stringify(report.hover.point) || JSON.stringify(context) !== JSON.stringify(report.hover.context) ||
                  !report.frames.some(frame => frame.kind === 'hover') ||
                  !findEntityInput([point], target.id, q => inspectEntityPoint(s, 'units', q)))
                throw Error('Original natural hover pose/context changed or target left the held pixel')
            } else {
              const motion = w.turn > previous.turn ? { turn: previous.turn, position: prior.position } :
                { turn: previous.motionTurn, position: previous.motionPosition }
              window.blastEpisode.propose({ kind: 'proposed-pixel', turn: w.turn, targetId: target.id, mode: w.mode,
                canvasOwned: actual.canvasOwned, hitId: actual.hitId, context, position: p.position,
                previousTurn: motion.turn, previousPosition: motion.position, idle: p.idle, point })
            }
            window.blastEpisode.trigger(w.turn)
            return { turn: w.turn, point, targetId: target.id, preparation: expectation === 'baseline' ? 'proposed-pixel' : 'rendered-hover' }
          }, { previous: trigger, expectation, minimumDistance, home, maximumSetupTurn: limits.maximumSetupTurn }),
          release: prepared => {
            if (prepared) signal.throwIfAborted()
            if (prepared) movementWait = waitForBlastAdmission(page.evaluate(() => window.blastEpisode.waitForMove()), signal, limits.castMs)
              .then(value => ({ value }), error => ({ error }))
            return input(prepared ? 'blast-person-release' : 'cancelled-person-up', prepared ?? {}, () => page.mouse.up(), false)
          },
          cancel: () => input('cancel-held-blast', {}, () => page.keyboard.press('Escape'), false),
          read: readHeld,
          retain: value => { heldCleanup = structuredClone(value) },
        })
        // The pre-release waiter observes the same checks latched by the actual
        // release callback. No additional query follows mouse-up.
        const admission = await movementWait
        if (admission.error) throw admission.error
        const movementAdmission = admission.value
        signal.throwIfAborted()
        await input('windup-ground-move', { target, ground: movementGround, admission: movementAdmission },
          () => page.mouse.click(movementGround.x, movementGround.y), false)
        trigger = { ...trigger, releasedPreparation, movementAdmission, movementGround }
      } finally {
        await page.evaluate(() => window.blastEpisode.abortMove('Held input finished or aborted'))
        if (heldCleanup) save('held-release-cleanup.json', heldCleanup)
        save('held-preparation.json', await page.evaluate(() => window.blastHeldRead ?? null))
      }
      preparation.observe(admittedObservation); admittedObservation = null
      save('target-setup.json', { prior, trigger, target, releaseWithinTurns: 4 })
      await poll(async () => {
        const report = await page.evaluate(() => window.blastEpisode.progress())
        assert.deepEqual(report.errors, [], 'Ordinary lifecycle observation failed')
        return report.complete
      }, limits.castMs, 'moving-target windup, flight, natural projectile and impact')
      result = await page.evaluate(() => window.blastEpisode.read())
      assert.equal(result.report.complete, true)
      await page.screenshot({ path: resolve(output, 'terminal.png') })
    }
  } catch (error) { primaryError = error }
  finally {
    if (diagnostic) {
      try {
        const proof = await page.evaluate(() => {
          if (!window.blastPick) return null
          window.blastPick.dispose(); return window.blastPick.read()
        })
        if (proof) {
          if (proof.frame?.png) {
            writeFileSync(resolve(output, 'pick-render.png'), Buffer.from(proof.frame.png.split(',')[1], 'base64'))
            delete proof.frame.png
          }
          save('pick-render.json', proof)
          if ((proof.errors.length || !proof.cleanupVerified || !proof.frameMatched) && !primaryError) primaryError = Error('Pick/render diagnostic failed or did not restore')
        }
      } catch (error) { primaryError ??= error }
    }
    if (attached) {
      try {
        const terminal = await page.evaluate(async () => { window.blastEpisode.dispose(); await window.blastEpisode.settled(); return window.blastEpisode.read() })
        result = terminal
        if (terminal.report.errors.length && !primaryError) primaryError = Error('Observer cleanup/lifecycle failed')
        for (const [kind, artifact] of Object.entries(terminal.artifacts)) {
          if (!artifact.png && !artifact.svg) continue
          if (artifact.png) writeFileSync(resolve(output, `${kind}.png`), Buffer.from(artifact.png.split(',')[1], 'base64'))
          if (artifact.svg) writeFileSync(resolve(output, `${kind}.svg`), artifact.svg)
          if (artifact.bracketPng) writeFileSync(resolve(output, `${kind}-brackets.png`), Buffer.from(artifact.bracketPng.split(',')[1], 'base64'))
          delete artifact.bracketPng
          delete artifact.png; delete artifact.svg
        }
      } catch (error) { primaryError ??= error }
    }
    if (setupAttached) {
      try {
        const setup = await page.evaluate(() => {
          const ground = window.blastGround?.finish(); window.blastGround = null
          return { ...window.blastSetup.finish(), ground }
        })
        save('setup-trace.json', setup)
        if ((!setup.cleanupVerified || setup.errors.length || setup.ground?.errors.length) && !primaryError) primaryError = Error('Setup observation/cleanup failed')
      } catch (error) { primaryError ??= error }
    }
    if (admittedObservation) preparation?.observe(admittedObservation)
    save('pointer-preparation.json', preparation?.read() ?? { targetUnbound: true })
    save('episode.json', { expectation, diagnostic, diagnosticResult, source: receipt.source, profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions, ...result,
      status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      remainingAcceptance: ['Empty-ground control', 'Out-of-range/no-stock/cancel/repeat', 'Pause and active-cast save/reload', 'Comparable paired frame review'],
      method: 'Public Mission2 entry, ordinary HUD/ground/person input and real RAF. Original-call-once turn/render/pointer observers; detached-clone diagnostic validators. Baseline release additionally checks target range before the handler and performs one geometric person read after handler-trace restoration, with cache effects separately retained. No injected game state or clock stepping; no timing-equivalence claim.' })
  }
  if (primaryError) throw primaryError
  assert.deepEqual(receipt.errors, [])
  if (diagnostic) return { stage: 'person-pick-render-diagnostic', expectation, diagnosticComplete: !!diagnosticResult, complete: false, evidence: resolve(output, 'pick-render.json'), remainingAcceptance: ['ordinary person cast and all later controls'] }
  return { stage: 'ordinary-person-cast-impact', expectation, complete: result.report.complete, evidence: resolve(output, 'episode.json'), remainingAcceptance: ['ground/rejection/interruption controls', 'active-cast save/reload', 'paired frame review'] }
}
