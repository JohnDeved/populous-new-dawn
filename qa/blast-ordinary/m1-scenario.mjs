import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { waitForShamanReadiness } from '../../scripts/browser-game.mjs'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import { pollWithPreservation, readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'

// Retain the first failure at each gate even after the bounded diagnostic tail rolls.
export function createM1EnemyPreparation(capacity = 96) {
  assert.ok(Number.isInteger(capacity) && capacity > 0 && capacity <= 96)
  const rows = [], firstFailures = {}
  let total = 0, firstMoving = null, firstPreparationReady = null, firstReady = null
  return {
    observe(value) {
      const row = structuredClone(value)
      assert.ok(Number.isInteger(row.turn) && row.turn >= 0)
      total++; rows.push(row)
      if (rows.length > capacity) rows.shift()
      for (const [gate, passed] of Object.entries(row.gates)) {
        if (gate === 'range' && row.rangeStatus === 'unprobed') continue
        if (!passed && !firstFailures[gate]) firstFailures[gate] = row
      }
      if (row.gates.moving) firstMoving ??= row
      if (row.preparationReady) firstPreparationReady ??= row
      if (row.ready) firstReady ??= row
    },
    read: () => structuredClone({ capacity, total, dropped: total - rows.length, firstFailures, firstMoving, firstPreparationReady, firstReady, rows }),
  }
}

// A host-only one-attempt guard. Polling and real observations belong to the
// caller; a clean observed gate miss differs from input or observation failure.
export function createM1PointerAttempt({ checkStop, signal, move, retain, now = Date.now }) {
  let attempt, admitted = false
  return {
    async move(row) {
      assert.equal(attempt, undefined, 'Only one preparation mouse move is permitted')
      assert.equal(row.preparationReady, true, 'Actual source-ready preparation required')
      assert.equal(row.rangeStatus, 'probed'); assert.equal(row.targetError, null)
      attempt = { row, hostBefore: now(), inputAttempted: false, completed: false }
      try {
        await checkStop(); signal.throwIfAborted()
        attempt.inputAttempted = true
        await move(row.pixel)
        attempt.completed = true
      } catch (error) { attempt.failure = String(error?.stack ?? error); throw error }
      finally { attempt.hostAfter = now(); retain(structuredClone(attempt)) }
    },
    admit(row, probe) {
      assert.ok(attempt?.completed, 'Preparation input must finish before admission')
      assert.equal(admitted, false, 'Only one fresh postdraw admission is permitted')
      admitted = true
      assert.ok(probe?.move && probe?.draw, 'Actual preparation event and first natural draw required')
      assert.deepEqual(probe.errors, [], 'Pointer observation failed')
      assert.deepEqual(row.errors, [], 'Episode observation failed')
      assert.deepEqual(row.failures, [], 'Setup observation failed')
      if ('route' in row.gates) assert.equal(row.gates.route, true, 'Original acknowledged approach changed before admission')
      assert.equal(row.withinBounds, true, 'The first-draw admission window expired')
      const missingGates = Object.entries(row.gates).filter(([, passed]) => !passed).map(([gate]) => gate)
      const ready = missingGates.length === 0 && row.rangeStatus === 'probed' && row.targetError === null
      assert.equal(row.ready, ready, 'Admission gate classification disagrees')
      return { castReady: ready, diagnosticComplete: !ready, complete: false, missingGates }
    },
  }
}

// Source-only entry point: one fresh Mission1 prefix, one ground response, and at
// most one moving-person click. The maintained harness owns browser and runtime.
export default async function ordinaryM1EnemyBlast({ page, output, receipt, signal, openMission }) {
  assert.equal(process.env.POPULOUS_BLAST_EXPECTATION, 'candidate')
  assert.equal(receipt.profile?.mode, 'created', 'A fresh candidate profile is required')
  assert.ok(basename(receipt.profile.path).startsWith('blast-m1-enemy-candidate-'))
  assert.ok(basename(output).startsWith('blast-m1-enemy-candidate-'))
  assert.equal(receipt.profile.checkpointAtStart, null)
  assert.equal(receipt.profile.previousRun, null)
  const started = Date.now(), commands = resolve(output, 'commands')
  mkdirSync(commands)
  const limits = { wallMs: 240000, maximumSetupTurn: 1800, responseTurns: 48, lifecycleTurns: 48,
    cameraMs: 15000, releaseWithinTurns: 4, harnessMs: 300000, outerMs: 330000 }
  const report = { expectation: 'candidate', phenotype: 'm1-enemy', source: receipt.source,
    profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions: [], route: [] }
  const preparation = createM1EnemyPreparation()
  let primaryError, episode, setupAttached = false, episodeAttached = false, diagnostic, skipPollSleep = false
  const save = (name = 'm1-route.json', value = report) => writeFileSync(resolve(output, name), JSON.stringify(value, null, 2) + '\n')
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.ok(Date.now() - started < limits.wallMs, 'Scenario wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (stop) { writeFileSync(resolve(output, 'stop-command.json'), stop.bytes); throw Error('Current-run stop input received') }
  }
  const poll = (check, label, timeout = limits.wallMs - (Date.now() - started)) => pollWithPreservation(check, {
    checkStop, timeout: Math.min(timeout, limits.wallMs - (Date.now() - started)), label,
    interval: 50, sleep: ms => {
      if (skipPollSleep) { skipPollSleep = false; return }
      return page.waitForTimeout(ms)
    },
  })
  const current = () => page.evaluate(() => {
    const { world: w, actor, target } = window.blastOriginal
    const setup = window.blastSetup.snapshot()
    return { ...setup, flags: w.manaWorld.gameFlags, castCount: w.stats.cast,
      actorPosition: window.blastHelpers.blastPersonSnapshot(w, actor, target).position,
      blastStock: w.shots.blast, bridgeStock: w.shots.bridge, bridgeGifts: w.giftCounts.bridge,
      bridges: w.stats.bridges, landVersion: w.landVersion,
      target: { id: target.id, hp: target.hp, x: target.x, z: target.z, team: target.team, kind: target.kind, inside: target.inside,
        same: w.units.find(u => u.id === target.id) === target },
      selectedActor: w.selected.length === 1 && w.selected[0] === actor.id,
      projectiles: w.projectiles.map(p => ({ id: p.id, spell: p.spell, caster: p.caster })), bridgeActive: w.effects.some(e => e.bridge) }
  })
  const healthy = state => {
    assert.ok(state, 'Setup observation failed')
    assert.deepEqual(state.failures, [], 'Original scene, World or Shaman changed')
    assert.equal(state.level, 1); assert.equal(state.status, 'playing'); assert.equal(state.paused, false); assert.equal(state.speed, 1)
    assert.equal(state.flags & 32, 0); assert.ok(state.turn < limits.maximumSetupTurn)
    assert.ok(state.actor.hp > 0, 'The original living caster is required')
    assert.ok(state.target.same && state.target.hp > 0 && state.target.team === 'red' && state.target.kind === 'brave' && state.target.inside === null)
  }
  try {
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    report.startup = await page.evaluate(async () => {
      if (window.blastOriginal || window.blastEpisode || window.blastSetup) throw Error('One fresh ordinary episode required')
      const scene = window.testSceneRef.current, world = scene.world
      const actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
      const target = world.units.find(u => u.team === 'red' && u.kind === 'brave' && u.x === -9 && u.z === -3)
      const head = world.shrines.find(h => h.reward === 'bridge' && h.x === -5 && h.z === 25)
      if (world.outcome.level !== 1 || actor?.id !== 30 || target?.id !== 38 || !head || world.stats.cast || world.shots.blast !== 4 || world.shots.bridge)
        throw Error('Untouched authored Mission1 Shaman30 and Red Brave38 required')
      const [observer, setup, orders, input, commands, animation, casting, terrain, math] = await Promise.all([
        import('/qa/blast-ordinary/observer.mjs'), import('/qa/blast-ordinary/setup-observer.mjs'),
        import('/app/person-orders.ts'), import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts'),
        import('/app/selection-runtime.ts'), import('/app/spell-casting.ts'), import('/app/world-terrain-runtime.ts'), import('/app/native-math.ts'),
        import('/app/minimap.ts'), import('/qa/erosion-ordinary/minimap-input.mjs'), import('/app/world-rules.ts'),
      ])
      window.blastHelpers = { ...observer, ...orders, ...input, spellTargetError: commands.spellTargetError,
        unitAnimationSource: animation.unitAnimationSource, spellRange: casting.spellRange,
        nativePosition: terrain.nativePosition, positionDistance: math.positionDistance }
      window.blastOriginal = { scene, world, actor, target }
      window.blastSetup = setup.observeBlastSetup(scene, actor, { currentOrder: (w, p) => orders.currentPersonOrder(w.buildingOrders, p) })
      if (window.blastSetup.read().errors.length) {
        window.blastSetup.finish()
        throw Error('Setup observation could not attach')
      }
      return { turn: world.turn, actorId: actor.id, targetId: target.id, head: structuredClone(head),
        people: world.units.map(u => ({ id: u.id, team: u.team, kind: u.kind, hp: u.hp, x: u.x, z: u.z })) }
    })
    setupAttached = true
    const input = createMission1VaultInput({ page, signal, report, save: () => save(), originalShamanId: report.startup.actorId })
    await input.prepareDispatch()
    const checked = async fn => { await checkStop(); healthy(await current()); const value = await fn(); await checkStop(); return value }
    const settle = () => poll(() => page.evaluate(() => {
      const s = window.testSceneRef.current
      return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
    }), 'ordinary camera settlement', limits.cameraMs)
    const move = async (name, point, cellMove = false) => {
      if (name !== 'guard approach') {
        await checked(() => input.button('Select and focus shaman'))
        await checked(() => input.view(point)); await settle()
      }
      // Reuse the maintained maximum-three pre-click recovery. It never retries
      // a delivered/uncertain click; cellMove retains its finite far-bank view path.
      const { hit, delivered } = await checked(() => input.moveGround(point, cellMove))
      const recipient = delivered.after.units.find(u => u.id === report.startup.actorId)
      const expected = { a: Math.round((hit.point.x + 8) * 256) & 65535, b: Math.round((-hit.point.z - 8) * 256) & 65535 }
      const route = { name, hit, delivered, expected, arrival: null }
      report.route.push(route); save()
      assert.ok(recipient?.orderId && recipient.order?.model === 3 && !(recipient.order.flags & 1))
      if (name === 'guard approach')
        assert.deepEqual({ a: recipient.order.a, b: recipient.order.b }, expected, 'The acknowledged approach was coast/building-corrected')
      if (name === 'guard approach') return route
      await poll(async () => {
        healthy(await current())
        const observation = await page.evaluate(({ orderId, order, acknowledgedTurn }) => {
          const { world: w, actor } = window.blastOriginal, p = actor.native
          const { currentPersonOrder, personReachedOrder } = window.blastHelpers
          const currentId = p && (p.immediateCommand || p.commands[p.commandCursor])
          const active = p && currentPersonOrder(w.buildingOrders, p)
          if (!p || w.objectCells.objects.get(actor.id) !== p || w.lastOrderTurn !== acknowledgedTurn ||
              currentId && (currentId !== orderId || active?.model !== 3 || active.a !== order.a || active.b !== order.b || active.flags & 1))
            throw Error('Original acknowledged movement ownership changed')
          const reached = !p.vehicle && personReachedOrder(p, order, () => { throw Error('Unexpected vehicle route') })
          return { turn: w.turn, actorId: actor.id, x: actor.x, z: actor.z, currentId: currentId || 0, reached,
            done: !currentId && p.commands.every(id => !id) && reached && p.speed === 0 && !p.motionGroup && !p.vehicle &&
              !w.pathfinding.people.has(actor.id) && !actor.path.length && actor.inside === null && !actor.work && !actor.lift && !actor.casting && !actor.fight }
        }, { orderId: recipient.orderId, order: recipient.order, acknowledgedTurn: delivered.after.lastOrderTurn })
        route.latest = observation
        if (observation.done) route.arrival = observation
        return observation.done
      }, `acknowledged ${name} arrival`)
      save(); return route
    }
    await checked(() => input.button('Select and focus shaman'))
    await checked(() => input.view(report.startup.head))
    report.bridgeOrder = await checked(() => input.clickEntity('shrines', report.startup.head.id, 27, false, [report.startup.actorId]))
    await poll(async () => {
      const state = await current(); healthy(state)
      if (state.bridgeStock > 0 && state.bridgeGifts > 0) { report.bridgeReward = state; return true }
      return false
    }, 'earned Bridge stock')
    await move('shore', { x: 0.53645, z: 18.97757 })
    await checked(() => input.view({ x: 0, z: 12 })); await settle()
    await checked(() => page.keyboard.press('2'))
    assert.equal((await current()).mode, 'bridge')
    const bridgePoint = await checked(() => input.fixedGround({ x: 0.01085, z: 3.98439 }, 'bridge'))
    assert.equal(bridgePoint.rejection, null, JSON.stringify(bridgePoint))
    const bridgeBefore = await current()
    report.bridgeCast = { hit: bridgePoint, before: bridgeBefore, delivered: await checked(() => input.castInput(bridgePoint, 'bridge')) }
    await poll(async () => {
      const state = await current(); healthy(state)
      if (state.bridges > bridgeBefore.bridges && state.landVersion > bridgeBefore.landVersion && !state.bridgeActive && !state.projectiles.some(p => p.spell === 'bridge')) {
        report.completedBridge = state; return true
      }
      return false
    }, 'real Bridge projectile and terrain completion')
    await move('crossing', { x: 0.21930, z: 3.58227 }, true)
    // All camera/import/observer work precedes the sole response-triggering approach.
    await checked(() => input.button('Select and focus shaman'))
    await checked(() => input.view({ x: -9, z: -3 })); await settle()
    const before = await current(); healthy(before)
    assert.equal(before.castCount, 1); assert.ok(before.blastStock > 0); assert.ok(before.selectedActor)
    await page.evaluate(options => {
      window.blastEpisode = window.blastHelpers.observeBlastEpisode(window.blastOriginal.scene, options)
    }, { expectation: 'candidate', phenotype: 'm1-enemy', enemySetup: 'ground-response', actorId: report.startup.actorId,
      targetId: report.startup.targetId, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, maxTurns: limits.lifecycleTurns })
    episodeAttached = true
    report.beforeApproach = before
    await page.screenshot({ path: resolve(output, 'before-approach.png') }); save()
    const approach = await move('guard approach', { x: -5.1, z: 0.9 })
    report.approachArmed = await page.evaluate(delivered => window.blastEpisode.armEnemy(delivered), approach.delivered)
    const approachTurn = approach.delivered.before.turn
    await checkStop(); signal.throwIfAborted()
    await page.keyboard.press('1')
    let previous, prepared = false
    const pointerAttempt = createM1PointerAttempt({ checkStop, signal,
      move: point => page.mouse.move(point.x, point.y),
      retain: attempt => { report.pointerPreparation = attempt; preparation.observe(attempt.row) },
    })
    const observe = (stage, pointerProbe = null) => page.evaluate(({ previous, approach, approachTurn, limits, stage, pointerProbe }) => {
        const { scene: s, world: w, actor, target } = window.blastOriginal
        const { blastPersonSnapshot, inputContext, inspectEntityPoint, spellTargetError, unitAnimationSource, currentPersonOrder, personReachedOrder } = window.blastHelpers
        const progress = window.blastEpisode.progress(), sample = window.blastSetup.snapshot()
        const person = blastPersonSnapshot(w, target, target), actorPerson = blastPersonSnapshot(w, actor, target)
        const draw = pointerProbe?.draw
        const motionBefore = draw ? w.turn > draw.turn ? { turn: draw.turn, position: draw.position }
          : { turn: draw.previousTurn, position: draw.previousPosition } : previous
        const moving = !!(motionBefore && w.turn > motionBefore.turn && person.position && motionBefore.position &&
          (person.position.x !== motionBefore.position.x || person.position.y !== motionBefore.position.y))
        const group = s.unitMeshes.get(target.id), layer = group?.userData.layers?.findLast(piece => piece.visible)
        const source = layer && s.view.painter.source(layer), native = unitAnimationSource(target)
        const body = { visible: group?.visible === true, pickable: group?.userData.pickable === true,
          frame: group?.userData.frame ?? null, spriteBucket: group?.userData.spriteBucket ?? null,
          visibleLayer: !!layer, painter: source ? { bucket: source.bucket, cell: source.cell, phase: source.phase, object: source.object, face: source.face } : null,
          native: native ? { id: native.id, class: native.class, flags2: native.flags2, renderFlags: native.renderFlags, state: native.state } : null }
        const box = s.picking.personBounds(target.id), rect = s.renderer.domElement.getBoundingClientRect(), candidates = [], inspection = []
        const canonical = point => ({ x: Math.round(point.x), y: Math.round(point.y) })
        if (s.pointerScreen) candidates.push(canonical({ x: s.pointerScreen.clientX, y: s.pointerScreen.clientY }))
        if (box) for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65])
          candidates.push(canonical({ x: rect.left + box.x + box.width * fx, y: rect.top + box.y + box.height * fy }))
        const visited = new Set()
        let pixel = null
        for (const point of candidates) {
          const key = `${point.x},${point.y}`
          if (!Number.isInteger(point.x) || !Number.isInteger(point.y) || visited.has(key)) continue
          visited.add(key)
          const actual = inspectEntityPoint(s, 'units', point)
          inspection.push(actual)
          if (actual.canvasOwned && actual.hitId === target.id) { pixel = point; break }
        }
        const context = inputContext(s), hover = progress.hover, capture = progress.hoverCapture
        const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
        const firstDrawHover = !!(draw && hover && capture && draw.matchedMove && capture.turn === draw.turn && capture.renderFrame === draw.renderFrame &&
          same(capture.point, draw.point) && same(capture.position, draw.position) && same(capture.context, draw.context))
        const withinBounds = w.turn < limits.maximumSetupTurn && w.turn - approachTurn <= limits.responseTurns
        const acknowledged = approach.delivered.after.units.find(u => u.id === actor.id), nativeActor = actor.native
        const currentId = nativeActor && (nativeActor.immediateCommand || nativeActor.commands[nativeActor.commandCursor])
        const order = nativeActor && currentPersonOrder(w.buildingOrders, nativeActor)
        const routeValid = nativeActor && w.objectCells.objects.get(actor.id) === nativeActor && w.lastOrderTurn === approach.delivered.after.lastOrderTurn &&
          (currentId ? currentId === acknowledged.orderId && order?.model === 3 && !(order.flags & 1) && order.a === acknowledged.order.a && order.b === acknowledged.order.b
            : personReachedOrder(nativeActor, acknowledged.order, () => { throw Error('Unexpected vehicle approach') }))
        const groundResponse = person.orderModel === 21 && !target.flight
        const awaitingHover = stage === 'preparation'
        const gates = { identity: !!(sample && !sample.failures.length && person.same && person.id === 38 && person.team === 'red' && person.kind === 'brave' &&
            person.hp > 0 && person.inside === null && person.ownerValid && actorPerson.ownerValid && actor.hp > 0),
          live: w.outcome.level === 1 && w.status === 'playing' && !w.paused && w.speed === 1 && !(w.manaWorld.gameFlags & 32) &&
            withinBounds,
          camera: !w.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition,
          recipient: w.selected.length === 1 && w.selected[0] === actor.id && w.mode === 'blast' && w.shots.blast > 0 && w.stats.cast === 1,
          moving: awaitingHover ? !moving && !groundResponse : moving && groundResponse, route: !!routeValid, range: false, body: body.visible && body.pickable && body.visibleLayer && !!body.painter,
          pixel: !!pixel, hover: firstDrawHover, context: stage === 'preparation' || !!hover && same(context, hover.context) && same(context, draw?.context),
          emptyBlast: !w.projectiles.some(p => p.team === 'blue' && p.spell === 'blast'), observation: progress.errors.length === 0 }
        const cheapReady = ['identity', 'live', 'camera', 'recipient', 'moving', 'route', 'body', 'pixel', 'emptyBlast', 'observation'].every(gate => gates[gate])
        let rangeStatus = 'unprobed', targetError = 'unprobed'
        // Only actual source readiness may spend the single preparation move.
        // Earlier cheap misses retain an explicit unprobed range, never success.
        if (cheapReady && (stage === 'preparation' || firstDrawHover)) {
          const probe = structuredClone(w), clonedTarget = probe.units.find(u => u.id === target.id)
          targetError = clonedTarget ? spellTargetError(probe, 'blast', clonedTarget) : 'target missing'
          rangeStatus = 'probed'; gates.range = targetError === null
        }
        const preparationReady = !!previous && stage === 'preparation' && cheapReady && gates.range
        const ready = stage === 'admission' && Object.values(gates).every(Boolean)
        const row = { stage, turn: w.turn, position: person.position, person, actor: actorPerson, gates, preparationReady, ready, pixel,
          body, box: box && { x: box.x, y: box.y, width: box.width, height: box.height }, inspection,
          rangeStatus, targetError, withinBounds, context, hover, firstDrawHover, groundResponse, response: pointerProbe?.response ?? null, errors: progress.errors, failures: sample?.failures ?? ['snapshot'] }
        if (preparationReady) window.blastEpisode.prepareEnemyPointer(pixel)
        // Only metadata is armed here. The host sends the sole ordinary input.
        if (ready) window.blastEpisode.trigger(w.turn)
        return row
      }, { previous, approach, approachTurn, limits, stage, pointerProbe })
    await poll(async () => {
      if (!prepared) {
        const row = await observe('preparation')
        if (row.preparationReady) {
          await pointerAttempt.move(row)
          prepared = true; skipPollSleep = true
          return false
        }
        preparation.observe(row)
        assert.ok(row.gates.identity, 'Original caster/target identity or health changed')
        assert.ok(row.gates.live, 'Ordinary clock or bounded response window ended')
        assert.equal(row.groundResponse, false, 'Response began before the one stationary hover preparation')
        assert.ok(row.gates.route, 'Original acknowledged approach changed')
        assert.ok(row.gates.recipient, 'Original cast recipient, stock or cast count changed')
        assert.deepEqual(row.errors, [], 'Episode observation failed')
        if (!previous || row.turn > previous.turn) previous = { turn: row.turn, position: row.position }
        return false
      }
      const observed = await page.evaluate(() => ({ probe: window.blastEpisode.pointerProbe(), hover: window.blastEpisode.progress().hoverCapture, turn: window.blastOriginal.world.turn }))
      report.pointerProbe = observed
      assert.deepEqual(observed.probe.errors, [], 'Preparation pointer observation failed')
      assert.ok(observed.turn < limits.maximumSetupTurn && observed.turn - approachTurn <= limits.responseTurns, 'Preparation event/draw window expired')
      if (!observed.probe.draw) return false
      // A real stationary hover precedes the response. Wait only for its first
      // passive model21 displacement; never send a second preparation move.
      if (observed.hover && !observed.probe.response) return false
      // This is the only fresh admission after that actual draw and response.
      const row = await observe('admission', observed.probe)
      let inputAttempt
      try {
        const decision = pointerAttempt.admit(row, observed.probe)
        if (!decision.castReady) {
          diagnostic = { ...decision, personCast: false, admission: row, pointerProbe: observed.probe }
          return true
        }
        inputAttempt = { turn: row.turn, pixel: row.pixel, targetId: report.startup.targetId,
          hostBefore: Date.now(), inputAttempted: false, completed: false }
        await checkStop(); signal.throwIfAborted()
        inputAttempt.inputAttempted = true
        await page.mouse.click(row.pixel.x, row.pixel.y)
        inputAttempt.completed = true
        return true
      } catch (error) {
        if (inputAttempt) inputAttempt.failure = String(error?.stack ?? error)
        throw error
      } finally {
        preparation.observe(row)
        report.pointerAdmission = row
        if (inputAttempt) { inputAttempt.hostAfter = Date.now(); report.personInput = inputAttempt }
      }
    }, 'one stationary hover, first ground response and one admission')
    save()
    if (!diagnostic) {
      await poll(async () => {
        const { progress, turn } = await page.evaluate(() => ({ progress: window.blastEpisode.progress(), turn: window.blastOriginal.world.turn }))
        assert.deepEqual(progress.errors, [], 'Moving-enemy lifecycle failed')
        assert.ok(turn - report.personInput.turn <= limits.lifecycleTurns, 'Person-shot lifecycle/render window expired')
        return progress.complete
      }, 'moving windup, flight, exact arrival and natural impact')
      await page.screenshot({ path: resolve(output, 'terminal.png') })
    }
  } catch (error) { primaryError = error }
  finally {
    if (episodeAttached) {
      try {
        episode = await page.evaluate(async () => {
          window.blastEpisode.dispose(); await window.blastEpisode.settled(); return window.blastEpisode.read()
        })
        if (episode.report.errors.length && !primaryError) primaryError = Error('Episode observation or cleanup failed')
        for (const [kind, artifact] of Object.entries(episode.artifacts)) {
          for (const [field, suffix] of [['png', '.png'], ['bracketPng', '-brackets.png']]) {
            if (!artifact?.[field]) continue
            assert.match(artifact[field], /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
            writeFileSync(resolve(output, `${kind}${suffix}`), Buffer.from(artifact[field].split(',')[1], 'base64'))
            delete artifact[field]
          }
          if (artifact?.svg) { writeFileSync(resolve(output, `${kind}.svg`), artifact.svg); delete artifact.svg }
        }
      } catch (error) { primaryError ??= error }
    }
    if (setupAttached) {
      try {
        const setup = await page.evaluate(() => window.blastSetup.finish())
        save('setup-trace.json', setup)
        if ((!setup.cleanupVerified || setup.errors.length) && !primaryError) primaryError = Error('Setup observation or cleanup failed')
      } catch (error) { primaryError ??= error }
    }
    if (!primaryError && receipt.errors.length) primaryError = Error(`Browser errors: ${receipt.errors.join('\n')}`)
    save(); save('pointer-preparation.json', preparation.read())
    save('episode.json', { ...report, ...episode, diagnostic, diagnosticComplete: !!diagnostic && !primaryError,
      complete: !primaryError && !diagnostic && episode?.report.complete === true, status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      method: 'One public Mission1 Bridge prefix, one ground approach, one stationary natural hover and at most one moving-person Blast. Real RAF and trusted public input; original-call-once passive observers and detached-clone predicates. Natural hover/ack artifacts are frozen actual-DOM detached rasters; projectile/impact images are actual game-canvas captures.',
      remainingAcceptance: ['Empty-ground/rejection/interruption controls', 'Active-cast save/reload', 'Comparable paired frame review', 'Hardware performance'] })
  }
  if (primaryError) throw primaryError
  if (diagnostic) return { stage: 'ordinary-m1-first-pointer-diagnostic', expectation: 'candidate', diagnosticComplete: true, complete: false,
    personCast: false, missingGates: diagnostic.missingGates, evidence: resolve(output, 'episode.json'),
    remainingAcceptance: ['Ordinary moving-person cast and all later gameplay acceptance'] }
  assert.equal(episode.report.complete, true)
  return { stage: 'ordinary-m1-moving-enemy-cast-impact', expectation: 'candidate', complete: true, evidence: resolve(output, 'episode.json'),
    remainingAcceptance: ['Ground/rejection/interruption controls', 'Active-cast save/reload', 'Paired frame review', 'Hardware performance'] }
}
