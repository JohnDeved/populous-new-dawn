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
  let attached = false, primaryError, result
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
  const current = () => page.evaluate(() => {
    const s = window.testSceneRef.current, w = s.world, original = window.blastOriginal
    if (!original || s !== original.scene || w !== original.world || w !== window.testStore.getWorld() || !w.units.includes(original.actor)) throw Error('Original scene, World or Shaman changed')
    return { turn: w.turn, level: w.outcome.level, flags: w.manaWorld.gameFlags, status: w.status, paused: w.paused, speed: w.speed,
      actor: { id: original.actor.id, x: original.actor.x, z: original.actor.z, hp: original.actor.hp }, selected: [...w.selected], mode: w.mode,
      stock: w.shots.blast, castCount: w.stats.cast, random: w.randomState, inputMask: w.inputMask }
  })
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
    await page.evaluate(() => {
      if (window.blastOriginal || window.blastEpisode) throw Error('No observer rearming')
      const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      if (!actor || world.stats.cast || world.shots.blast !== 4) throw Error('Untouched fresh Mission2 start required')
      window.blastOriginal = { scene, world, actor }
    })
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
    await input('approach-ground', ground, () => page.mouse.click(ground.x, ground.y))
    await poll(async () => {
      const state = await current(); healthy(state)
      return Math.hypot(state.actor.x - ground.point.x, state.actor.z - ground.point.z) < 2
    }, limits.approachMs, 'original Shaman walking to patrol range')
    await view(approach)
    // Two distinct normal-turn observations choose an actually moving original patrol member.
    let prior, target
    await poll(async () => {
      const observed = await page.evaluate(async () => {
        const s = window.testSceneRef.current, { patrolSnapshot } = await import('/qa/blast-ordinary/observer.mjs')
        return { turn: s.world.turn, patrol: patrolSnapshot(s) }
      })
      if (prior && observed.turn > prior.turn) target = observed.patrol.find(p => {
        const old = prior.patrol.find(u => u.id === p.id)
        return old && p.speed > 0 && (p.position.x !== old.position.x || p.position.y !== old.position.y)
      })
      if (!target) prior = observed
      return !!target
    }, limits.targetMs, 'naturally moving model25 patrol member')
    save('target-setup.json', { prior, target, state: await current() })
    const state = await current(); healthy(state)
    await page.evaluate(async options => {
      const { observeBlastEpisode } = await import('/qa/blast-ordinary/observer.mjs')
      window.blastEpisode = observeBlastEpisode(window.testSceneRef.current, options)
    }, { expectation, actorId: state.actor.id, targetId: target.id, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, maxTurns: 48 })
    attached = true
    await input('blast-key', {}, () => page.keyboard.press('1'))
    assert.equal((await current()).mode, 'blast')
    let hit, hover
    await poll(async () => {
      hit = await page.evaluate(async id => {
        const s = window.testSceneRef.current, u = s.world.units.find(u => u.id === id && u.hp > 0 && u.inside === null), box = s.picking.personBounds(id)
        if (!u || !box) return null
        const { findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs'), { spellTargetError } = await import('/app/model.ts')
        // Native position/terrain synchronization runs only on this detached clone.
        const probe = structuredClone(s.world)
        if (spellTargetError(probe, 'blast', probe.units.find(p => p.id === id)) || !s.world.shots.blast) return null
        const r = s.container.getBoundingClientRect(), candidates = []
        for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65]) candidates.push({ x: r.left + box.x + box.width * fx, y: r.top + box.y + box.height * fy })
        return findEntityInput(candidates, id, p => inspectEntityPoint(s, 'units', p))
      }, target.id)
      if (!hit) return false
      await input('person-hover', { id: target.id, hit }, () => page.mouse.move(hit.x, hit.y))
      hover = await page.evaluate(async ({ id, prior }) => {
        const s = window.testSceneRef.current, { pointerFeedback, patrolSnapshot } = await import('/qa/blast-ordinary/observer.mjs')
        const p = patrolSnapshot(s).find(p => p.id === id), old = prior.patrol.find(p => p.id === id)
        const event = s.pointerScreen, actual = event && s.picking.pickPerson(event), feedback = pointerFeedback(s)
        if (!p || !old || !event || actual !== id) return null
        return { turn: s.world.turn, targetId: id, mode: s.world.mode, canvasOwned: document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement,
          hitId: actual, visible: feedback.visible, lines: feedback.lines, context: feedback.context, position: p.position,
          previousTurn: prior.turn, previousPosition: old.position, orderModel: p.orderModel }
      }, { id: target.id, prior })
      return hover && (expectation === 'candidate' ? hover.visible && hover.lines === 16 : !hover.visible)
    }, limits.targetMs, 'real person hit and declared hover phenotype')
    await page.evaluate(hover => window.blastEpisode.hover(hover), hover)
    if (expectation === 'candidate') await poll(() => page.evaluate(() => window.blastEpisode.progress().frames.some(f => f.kind === 'hover')), 2000, 'rendered hover frame')
    // Re-read the moving person hit immediately before a single dispatched click.
    const fresh = await page.evaluate(async id => {
      const s = window.testSceneRef.current, { pointerFeedback, patrolSnapshot } = await import('/qa/blast-ordinary/observer.mjs')
      const p = patrolSnapshot(s).find(p => p.id === id), event = s.pointerScreen
      return { turn: s.world.turn, id: event && s.picking.pickPerson(event), p, feedback: pointerFeedback(s) }
    }, target.id)
    assert.equal(fresh.id, target.id, 'Moving target left the actual pointer before dispatch')
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
    save('episode.json', { expectation, source: receipt.source, profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions, ...result,
      status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      remainingAcceptance: ['Empty-ground control', 'Out-of-range/no-stock/cancel/repeat', 'Pause and active-cast save/reload', 'Comparable paired frame review'],
      method: 'Public Mission2 entry, ordinary HUD/minimap/ground/person input and real RAF. Passive original-call-once turn/render/pointer observers; detached-clone diagnostic validators. No injected game state or clock stepping.' })
  }
  if (primaryError) throw primaryError
  assert.deepEqual(receipt.errors, [])
  return { stage: 'ordinary-person-cast-impact', expectation, complete: result.report.complete, evidence: resolve(output, 'episode.json'), remainingAcceptance: ['ground/rejection/interruption controls', 'active-cast save/reload', 'paired frame review'] }
}
