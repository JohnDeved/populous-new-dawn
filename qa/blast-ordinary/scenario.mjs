import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { waitForShamanReadiness } from '../../scripts/browser-game.mjs'
import { pollWithPreservation, readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'

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
  const limits = { wallMs: 240000, approachMs: 140000, targetMs: 12000, cameraMs: 15000, castMs: 10000, maximumSetupTurn: 1800 }
  let attached = false, setupAttached = false, primaryError, result
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
      const { observeBlastEpisode, responseSnapshot, pointerFeedback } = await import('/qa/blast-ordinary/observer.mjs')
      const { observeEntityPointer, findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
      const { spellTargetError } = await import('/app/model.ts'), { wrappedDistance } = await import('/app/world-coordinates.ts')
      window.blastHelpers = { observeBlastEpisode, responseSnapshot, pointerFeedback, observeEntityPointer, findEntityInput, inspectEntityPoint, spellTargetError, wrappedDistance }
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
      healthy(await current())
      const observed = await page.evaluate(() => {
        const s = window.testSceneRef.current, { responseSnapshot, spellTargetError, wrappedDistance } = window.blastHelpers
        const response = responseSnapshot(s), p = response[0], actor = window.blastOriginal.actor
        const probe = structuredClone(s.world), target = p && probe.units.find(u => u.id === p.id)
        return { turn: s.world.turn, response, distance: p ? wrappedDistance(actor, p) : null,
          targetError: target ? spellTargetError(probe, 'blast', target) : 'missing target', actorFighting: !!actor.fight }
      })
      const p = observed.response[0], old = prior?.response[0]
      if (old && p && observed.turn > prior.turn && p.speed > 0 && !p.fighting && !observed.actorFighting &&
        (p.position.x !== old.position.x || p.position.y !== old.position.y) && observed.distance >= 7 && observed.targetError === null) trigger = observed
      if (!trigger) prior = observed
      return !!trigger
    }, limits.approachMs, 'healthy original response Warrior19 moving inside actual Blast range')
    await page.evaluate(turn => window.blastEpisode.trigger(turn), trigger.turn)
    save('target-setup.json', { prior, trigger, target, releaseWithinTurns: 4 })
    let hit, hover
    await poll(async () => {
      assert.ok((await current()).turn <= trigger.turn + 4, 'Response release window expired; stop without casting')
      hit = await page.evaluate(id => {
        const s = window.testSceneRef.current, u = s.world.units.find(u => u.id === id && u.hp > 0 && u.inside === null), box = s.picking.personBounds(id)
        if (!u || !box) return null
        const { findEntityInput, inspectEntityPoint, spellTargetError } = window.blastHelpers
        // Native position/terrain synchronization runs only on this detached clone.
        const probe = structuredClone(s.world)
        if (spellTargetError(probe, 'blast', probe.units.find(p => p.id === id)) || !s.world.shots.blast) return null
        const r = s.container.getBoundingClientRect(), candidates = []
        for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65]) candidates.push({ x: r.left + box.x + box.width * fx, y: r.top + box.y + box.height * fy })
        return findEntityInput(candidates, id, p => inspectEntityPoint(s, 'units', p))
      }, target.id)
      if (!hit) return false
      await input('person-hover', { id: target.id, hit }, () => page.mouse.move(hit.x, hit.y))
      hover = await page.evaluate(({ id, prior }) => {
        const s = window.testSceneRef.current, { pointerFeedback, responseSnapshot } = window.blastHelpers
        const p = responseSnapshot(s).find(p => p.id === id), old = prior.response.find(p => p.id === id)
        const event = s.pointerScreen, actual = event && s.picking.pickPerson(event), feedback = pointerFeedback(s)
        if (!p || !old || !event || actual !== id) return null
        return { turn: s.world.turn, targetId: id, mode: s.world.mode, canvasOwned: document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement,
          hitId: actual, visible: feedback.visible, lines: feedback.lines, context: feedback.context, position: p.position,
          previousTurn: prior.turn, previousPosition: old.position, orderModel: p.orderModel }
      }, { id: target.id, prior })
      return hover && (expectation === 'candidate' ? hover.visible && hover.lines === 16 : !hover.visible)
    }, limits.targetMs, 'real person hit and declared hover phenotype')
    await page.evaluate(hover => window.blastEpisode.hover(hover), hover)
    // Re-read the moving person hit immediately before a single dispatched click.
    const fresh = await page.evaluate(id => {
      const s = window.testSceneRef.current, { pointerFeedback, responseSnapshot, spellTargetError } = window.blastHelpers
      const p = responseSnapshot(s).find(p => p.id === id), event = s.pointerScreen
      const probe = structuredClone(s.world)
      return { turn: s.world.turn, id: event && s.picking.pickPerson(event), p, feedback: pointerFeedback(s),
        targetError: p ? spellTargetError(probe, 'blast', probe.units.find(u => u.id === id)) : 'missing target' }
    }, target.id)
    assert.equal(fresh.id, target.id, 'Moving target left the actual pointer before dispatch')
    assert.ok(fresh.p?.speed > 0 && !fresh.p.fighting, 'Original response target stopped before release')
    assert.equal(fresh.targetError, null, 'Fresh release-time spell range/health validation failed')
    assert.ok(fresh.turn <= trigger.turn + 4, 'Response release window expired; stop without casting')
    assert.ok(fresh.turn <= hover.turn + 1, 'Hover/context became stale; stop without casting')
    await input('blast-person-release', { id: target.id, hit, turn: fresh.turn }, () => page.mouse.click(hit.x, hit.y))
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
    save('episode.json', { expectation, source: receipt.source, profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions, ...result,
      status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      remainingAcceptance: ['Empty-ground control', 'Out-of-range/no-stock/cancel/repeat', 'Pause and active-cast save/reload', 'Comparable paired frame review'],
      method: 'Public Mission2 entry, ordinary HUD/minimap/ground/person input and real RAF. Passive original-call-once turn/render/pointer observers; detached-clone diagnostic validators. No injected game state or clock stepping.' })
  }
  if (primaryError) throw primaryError
  assert.deepEqual(receipt.errors, [])
  return { stage: 'ordinary-person-cast-impact', expectation, complete: result.report.complete, evidence: resolve(output, 'episode.json'), remainingAcceptance: ['ground/rejection/interruption controls', 'active-cast save/reload', 'paired frame review'] }
}
