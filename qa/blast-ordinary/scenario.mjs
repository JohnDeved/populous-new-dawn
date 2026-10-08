import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { waitForShamanReadiness } from '../../scripts/browser-game.mjs'
import { pollWithPreservation, readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'
import { createBlastPreparation } from './preparation.mjs'

// First-stage ordinary witness. This module does not run a browser on import.
export default async function ordinaryBlast({ page, output, receipt, signal, openMission }) {
  const expectation = process.env.POPULOUS_BLAST_EXPECTATION
  assert.ok(['baseline', 'candidate'].includes(expectation), 'Set POPULOUS_BLAST_EXPECTATION explicitly')
  assert.equal(receipt.profile?.mode, 'created', 'Each application product needs its own fresh profile')
  assert.ok(basename(receipt.profile.path).startsWith(`blast-m2-${expectation}-`), 'Use an expectation-specific fresh profile name')
  assert.equal(receipt.profile.checkpointAtStart, null)
  assert.equal(receipt.profile.previousRun, null)
  assert.ok(basename(output).startsWith(`blast-m2-${expectation}-`), 'Use an expectation-specific fresh output')
  const commands = resolve(output, 'commands'), started = Date.now(), actions = []
  mkdirSync(commands)
  const limits = { wallMs: 240000, approachMs: 140000, cameraMs: 15000, castMs: 10000, maximumSetupTurn: 1800 }
  let attached = false, setupAttached = false, primaryError, result
  const preparation = createBlastPreparation({ targetId: 19, maximumSetupTurn: limits.maximumSetupTurn })
  let admittedObservation
  const save = (name, data) => writeFileSync(resolve(output, name), JSON.stringify(data, null, 2) + '\n')
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.ok(Date.now() - started < limits.wallMs, 'Scenario wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (stop) { writeFileSync(resolve(output, 'stop-command.json'), stop.bytes); throw Error('Current-run stop input received; no additional actions') }
  }
  const poll = (check, timeout, label) => pollWithPreservation(check, { checkStop, timeout, label, interval: 50, sleep: ms => page.waitForTimeout(ms) })
  const input = async (kind, details, fn) => {
    await checkStop(); actions.push({ kind, details, wallMs: Date.now() - started, phase: 'before' }); await fn()
    actions.push({ kind, details, wallMs: Date.now() - started, phase: 'after' }); await checkStop()
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
  const view = async target => {
    await settle()
    const hit = await page.evaluate(async target => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts'), { minimapInput } = await import('/qa/erosion-ordinary/minimap-input.mjs')
      return minimapInput({ width: s.mini.width, height: s.mini.height, rect: s.mini.getBoundingClientRect(),
        center: { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) }, heading: Math.round(s.cameraBearing * 1024 / Math.PI),
        target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) } }, minimapPick, p => document.elementFromPoint(p.x, p.y) === s.mini)
    }, target)
    assert.ok(hit, 'An actual visible minimap hit is required')
    await input('minimap', { target, hit }, () => page.mouse.click(hit.x, hit.y)); await settle()
  }
  try {
    await openMission(2)
    const readiness = await waitForShamanReadiness(page)
    await page.evaluate(async () => {
      if (window.blastOriginal || window.blastEpisode) throw Error('No observer rearming')
      const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      if (!actor || world.stats.cast || world.shots.blast !== 4) throw Error('Untouched fresh Mission2 start required')
      const target = world.units.find(u => u.id === 19 && u.team === 'green' && u.kind === 'warrior')
      if (!target) throw Error('Authored response Warrior19 is required; no replacement target')
      window.blastOriginal = { scene, world, actor, target }
      const { observeBlastSetup } = await import('/qa/blast-ordinary/setup-observer.mjs')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const { unitAnimationSource } = await import('/app/selection-runtime.ts')
      const { observeBlastEpisode, responseSnapshot, pointerFeedback } = await import('/qa/blast-ordinary/observer.mjs')
      const { observeEntityPointer, findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
      const { spellTargetError } = await import('/app/model.ts'), { wrappedDistance } = await import('/app/world-coordinates.ts')
      window.blastHelpers = { unitAnimationSource, observeBlastEpisode, responseSnapshot, pointerFeedback, observeEntityPointer, findEntityInput, inspectEntityPoint, spellTargetError, wrappedDistance }
      window.blastSetup = observeBlastSetup(scene, actor, { currentOrder: (w, p) => currentPersonOrder(w.buildingOrders, p) })
      if (window.blastSetup.read().errors.length) throw Error('Setup observation could not attach')
    })
    setupAttached = true
    healthy(await current()); save('startup.json', { readiness, state: await current(), limits })
    await input('escape', {}, () => page.keyboard.press('Escape'))
    await input('followers-tab', {}, () => page.getByLabel('followers', { exact: true }).click())
    await input('select-shaman', {}, () => page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click())
    const selected = await current(); assert.deepEqual(selected.selected, [selected.actor.id]); assert.equal(selected.mode, null)
    const approach = { x: 58, z: 108 }
    await view(approach)
    const ground = await page.evaluate(async approach => {
      const s = window.testSceneRef.current, rect = s.container.getBoundingClientRect(), { createMoveContextProbe, isOrdinaryMoveContext } = await import('/qa/erosion-ordinary/input.mjs')
      const probe = createMoveContextProbe(s.world)
      for (const delta of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
        const p = { x: approach.x + delta[0], z: approach.z + delta[1] }, q = s.screen(p)
        const e = { clientX: rect.left + (q.x + 1) * rect.width / 2, clientY: rect.top + (1 - q.y) * rect.height / 2 }
        if (document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement || s.picking.pick(e) !== null) continue
        const picked = s.pick(e)
        if (picked && Math.hypot(picked.x - p.x, picked.z - p.z) < 0.75 && isOrdinaryMoveContext(probe(picked))) return { x: e.clientX, y: e.clientY, point: { x: picked.x, z: picked.z } }
      }
      return null
    }, approach)
    assert.ok(ground, 'No real ordinary ground move at the bounded approach')
    const groundBefore = await current()
    await page.evaluate(() => { window.blastGround = window.blastHelpers.observeEntityPointer(window.testSceneRef.current) })
    await input('approach-ground', ground, () => page.mouse.click(ground.x, ground.y))
    const groundAfter = await current(), groundPointer = await page.evaluate(() => {
      const result = window.blastGround.finish(); window.blastGround = null; return result
    })
    save('ground-dispatch.json', { before: groundBefore, after: groundAfter, pointer: groundPointer })
    assert.deepEqual(groundBefore.selected, [groundBefore.actor.id])
    assert.deepEqual(groundPointer.errors, []); assert.equal(groundPointer.restored, true)
    const deliveredGround = groundPointer.events.find(e => e.type === 'pointerup')
    assert.ok(deliveredGround?.trusted && deliveredGround.canvasTarget && deliveredGround.canvasOwned)
    assert.ok(deliveredGround.picks.some(p => p.owner === 'scene' && p.name === 'pick' && p.point && Math.hypot(p.point.x - ground.point.x, p.point.z - ground.point.z) < 0.75))
    assert.equal(groundAfter.actor.order?.model, 3, 'Original Shaman did not receive the ordinary move order')
    assert.equal(groundAfter.actor.order.a & 65535, Math.round((ground.point.x + 8) * 256) & 65535)
    assert.equal(groundAfter.actor.order.b & 65535, Math.round((-ground.point.z - 8) * 256) & 65535)
    assert.ok(groundAfter.pointerAck.until > groundBefore.pointerAck.until)
    assert.ok(groundAfter.orderMarkers.some(e => !groundBefore.orderMarkers.some(old => old.id === e.id)))
    // Face the observed response corridor before either side reaches cast range.
    await view({ x: 122, z: 122 })
    const state = await current(); healthy(state)
    const target = { id: 19 }
    await page.evaluate(options => {
      window.blastEpisode = window.blastHelpers.observeBlastEpisode(window.testSceneRef.current, options)
    }, { expectation, actorId: state.actor.id, targetId: target.id, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, maxTurns: 48 })
    attached = true
    await input('blast-key', {}, () => page.keyboard.press('1'))
    assert.equal((await current()).mode, 'blast')
    let prior, trigger
    await poll(async () => {
      const observed = await page.evaluate(({ previous, expectation, maximumSetupTurn }) => {
        const s = window.testSceneRef.current, w = s.world, started = performance.now()
        const { responseSnapshot, pointerFeedback, spellTargetError, wrappedDistance, findEntityInput, inspectEntityPoint } = window.blastHelpers
        const sample = window.blastSetup.snapshot(), actor = window.blastOriginal.actor
        const state = { turn: w.turn, level: w.outcome.level, status: w.status, paused: w.paused, speed: w.speed,
          flags: w.manaWorld.gameFlags, mode: w.mode, stock: w.shots.blast, inputMask: w.inputMask, cameraSettled: !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition, actor: { id: actor.id, hp: actor.hp }, failures: sample?.failures ?? ['snapshot'] }
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
        const group = s.unitMeshes.get(19), layer = group?.userData.layers?.findLast(piece => piece.visible)
        const source = layer && s.view.painter.source(layer), unit = window.blastOriginal.target
        const activeNative = window.blastHelpers.unitAnimationSource(unit)
        const renderedBody = { originalTargetPresent: w.units.includes(unit), sameIdIsOriginal: w.units.find(person => person.id === 19) === unit,
          targetId: unit.id, hp: unit.hp, team: unit.team, kind: unit.kind, visible: group?.visible ?? null, pickable: group?.userData.pickable ?? null,
          frame: group?.userData.frame ?? null, spriteBucket: group?.userData.spriteBucket ?? null,
          inside: unit.inside, nativeRenderFlags: unit.native?.renderFlags ?? null, nativeFlags2: unit.native?.flags2 ?? null,
          activeNative: activeNative ? { id: activeNative.id, class: activeNative.class, model: activeNative.model,
            state: activeNative.state, renderFlags: activeNative.renderFlags, flags2: activeNative.flags2 } : null,
          visibleLayer: !!layer, layerHasPainterSource: !!source,
          painterSource: source ? { bucket: source.bucket, cell: source.cell, phase: source.phase, object: source.object, face: source.face } : null }
        const existingHit = p && event && findEntityInput([{ x: event.clientX, y: event.clientY }], p.id, inspect)
        const candidates = []
        if (box) for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65])
          candidates.push({ x: rect.left + box.x + box.width * fx, y: rect.top + box.y + box.height * fy })
        const nextHit = existingHit || (p && findEntityInput(candidates, p.id, inspect))
        const feedback = pointerFeedback(s)
        const live = state.turn < maximumSetupTurn && state.failures.length === 0 && state.level === 2 && state.status === 'playing' && !state.paused &&
          state.speed === 1 && !(state.flags & 32) && !state.inputMask && state.cameraSettled && state.mode === 'blast' && state.stock > 0 && state.actor.hp > 0
        const moving = !!(motionPosition && p && w.turn > motionTurn && p.speed > 0 && !p.fighting && !actor.fight &&
          (p.position.x !== motionPosition.x || p.position.y !== motionPosition.y))
        const phenotype = expectation === 'candidate' ? feedback.visible && feedback.lines === 16 && feedback.targetId === 19 : !feedback.visible
        const eligible = !!(live && moving && distance >= 7 && targetError === null && existingHit && phenotype)
        let hover = prepared, ready = false, rejection = null, phase = 'preparing'
        if (report.errors.length) rejection = 'episode-observation-error'
        else if (prepared && w.turn > prepared.turn + 1) rejection = 'prospective-hover-expired'
        else if (prepared && JSON.stringify(feedback.context) !== JSON.stringify(prepared.context)) rejection = 'prospective-hover-context-changed'
        else if (eligible) {
          if (!hover) {
            hover = { turn: w.turn, targetId: p.id, mode: w.mode, canvasOwned: true, hitId: p.id,
              visible: feedback.visible, lines: feedback.lines, context: feedback.context, position: p.position,
              previousTurn: motionTurn, previousPosition: motionPosition, orderModel: p.orderModel }
            window.blastEpisode.hover(hover)
          }
          phase = 'awaiting-natural-hover-frame'
          // The real render and its pixel validation finish before admission.
          // Recheck current eligibility here; no read or raster await follows trigger.
          if (expectation === 'baseline' || report.frames.some(frame => frame.kind === 'hover' && frame.turn <= w.turn)) {
            window.blastEpisode.trigger(w.turn)
            ready = true; phase = 'admitted'
          }
        }
        return { turn: w.turn, state, response, distance, targetError, actorFighting: !!actor.fight,
          box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
          existingHit, nextHit, inspection, renderedBody, feedback: { targetId: feedback.targetId, visible: feedback.visible, lines: feedback.lines },
          live, moving, phenotype, eligible, phase, rejection, episodeErrors: report.errors, ready, hover, readMilliseconds: performance.now() - started }
      }, { previous: prior, expectation, maximumSetupTurn: limits.maximumSetupTurn })
      // Preserve failed/onset rows before assertions. The admitted row is retained
      // after input, keeping diagnostic copying outside the four-turn interval.
      if (observed.ready) { admittedObservation = observed; trigger = observed; return true }
      const { stopReason } = preparation.observe(observed)
      assert.equal(stopReason, null, 'Original response ended or target became unavailable; first observations retained')
      assert.equal(observed.rejection, null, 'Prospective hover admission failed; first observations retained')
      assert.deepEqual(observed.state.failures, [], 'Original scene, World or healthy Shaman changed; setup trace retained')
      healthy(observed.state)
      prior = observed
      if (observed.nextHit && !observed.existingHit)
        await input('prepare-person-hover', { id: target.id, hit: observed.nextHit, turn: observed.turn }, () => page.mouse.move(observed.nextHit.x, observed.nextHit.y))
      return false
    }, limits.approachMs, 'healthy moving original response target at a real stable pointer pixel and actual Blast range')
    // One normal trusted click follows the atomic eligibility read. Late delivery
    // remains a retained failure under the existing actual-release contract.
    await input('blast-person-release', { id: target.id, hit: trigger.existingHit, turn: trigger.turn }, () => page.mouse.click(trigger.existingHit.x, trigger.existingHit.y))
    preparation.observe(admittedObservation); admittedObservation = null
    save('target-setup.json', { prior, trigger, target, releaseWithinTurns: 4 })
    await poll(async () => {
      const report = await page.evaluate(() => window.blastEpisode.progress())
      assert.deepEqual(report.errors, [], 'Ordinary lifecycle observation failed')
      return report.complete
    }, limits.castMs, 'moving-target windup, flight, rendered arrival and impact')
    result = await page.evaluate(() => window.blastEpisode.read())
    assert.equal(result.report.complete, true)
    await page.screenshot({ path: resolve(output, 'terminal.png') })
  } catch (error) { primaryError = error }
  finally {
    if (attached) {
      try {
        const terminal = await page.evaluate(async () => { window.blastEpisode.dispose(); await window.blastEpisode.settled(); return window.blastEpisode.read() })
        result = terminal
        if (terminal.report.errors.length && !primaryError) primaryError = Error('Observer cleanup/lifecycle failed')
        for (const [kind, artifact] of Object.entries(terminal.artifacts)) {
          if (!artifact.png) continue
          writeFileSync(resolve(output, `${kind}.png`), Buffer.from(artifact.png.split(',')[1], 'base64'))
          writeFileSync(resolve(output, `${kind}.svg`), artifact.svg)
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
    if (admittedObservation) preparation.observe(admittedObservation)
    save('pointer-preparation.json', preparation.read())
    save('episode.json', { expectation, source: receipt.source, profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions, ...result,
      status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      remainingAcceptance: ['Empty-ground control', 'Out-of-range/no-stock/cancel/repeat', 'Pause and active-cast save/reload', 'Comparable paired frame review'],
      method: 'Public Mission2 entry, ordinary HUD/minimap/ground/person input and real RAF. Passive original-call-once turn/render/pointer observers; detached-clone diagnostic validators. No injected game state or clock stepping.' })
  }
  if (primaryError) throw primaryError
  assert.deepEqual(receipt.errors, [])
  return { stage: 'ordinary-person-cast-impact', expectation, complete: result.report.complete, evidence: resolve(output, 'episode.json'), remainingAcceptance: ['ground/rejection/interruption controls', 'active-cast save/reload', 'paired frame review'] }
}
