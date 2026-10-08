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
  let total = 0, firstMoving = null, firstReady = null
  return {
    observe(value) {
      const row = structuredClone(value)
      assert.ok(Number.isInteger(row.turn) && row.turn >= 0)
      total++; rows.push(row)
      if (rows.length > capacity) rows.shift()
      for (const [gate, passed] of Object.entries(row.gates))
        if (!passed && !firstFailures[gate]) firstFailures[gate] = row
      if (row.gates.moving) firstMoving ??= row
      if (row.ready) firstReady ??= row
    },
    read: () => structuredClone({ capacity, total, dropped: total - rows.length, firstFailures, firstMoving, firstReady, rows }),
  }
}

// Source-only entry point: one fresh Mission1 prefix, one ground primer, and at
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
  const limits = { wallMs: 240000, maximumSetupTurn: 1800, primerTurns: 48, lifecycleTurns: 48,
    cameraMs: 15000, releaseWithinTurns: 4, harnessMs: 300000, outerMs: 330000 }
  const report = { expectation: 'candidate', phenotype: 'm1-enemy', source: receipt.source,
    profileId: receipt.profile.id, runId: receipt.profile.runId, limits, actions: [], route: [] }
  const preparation = createM1EnemyPreparation()
  let primaryError, episode, setupAttached = false, episodeAttached = false, admitted, home
  const save = (name = 'm1-route.json', value = report) => writeFileSync(resolve(output, name), JSON.stringify(value, null, 2) + '\n')
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.ok(Date.now() - started < limits.wallMs, 'Scenario wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (stop) { writeFileSync(resolve(output, 'stop-command.json'), stop.bytes); throw Error('Current-run stop input received') }
  }
  const poll = (check, label, timeout = limits.wallMs - (Date.now() - started)) => pollWithPreservation(check, {
    checkStop, timeout: Math.min(timeout, limits.wallMs - (Date.now() - started)), label,
    interval: 50, sleep: ms => page.waitForTimeout(ms),
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
    if (home) assert.deepEqual(state.actorPosition, home.position, 'Original caster native position changed')
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
      await checked(() => input.button('Select and focus shaman'))
      await checked(() => input.view(point)); await settle()
      const hit = await checked(() => input.fixedGround(point, null, cellMove))
      assert.equal(hit.rejection, null, JSON.stringify(hit))
      const delivered = await checked(() => input.dispatch(hit, 3, [report.startup.actorId]))
      const recipient = delivered.after.units.find(u => u.id === report.startup.actorId)
      const expected = { a: Math.round((hit.point.x + 8) * 256) & 65535, b: Math.round((-hit.point.z - 8) * 256) & 65535 }
      const route = { name, hit, delivered, expected, arrival: null }
      report.route.push(route); save()
      assert.ok(recipient?.orderId && recipient.order?.model === 3 && !(recipient.order.flags & 1))
      if (name === 'guard approach')
        assert.deepEqual({ a: recipient.order.a, b: recipient.order.b }, expected, 'The acknowledged approach was coast/building-corrected')
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
    await move('guard approach', { x: -5.01285, z: 3.00167 })
    // Fix the only combat view before the primer; no camera changes follow it.
    await checked(() => input.view({ x: -9, z: -3 })); await settle()
    const before = await current(); healthy(before)
    assert.equal(before.castCount, 1); assert.equal(before.blastStock, 4); assert.ok(before.selectedActor)
    home = { x: before.actor.x, z: before.actor.z, position: before.actorPosition }
    await page.evaluate(options => {
      window.blastEpisode = window.blastHelpers.observeBlastEpisode(window.blastOriginal.scene, options)
    }, { expectation: 'candidate', phenotype: 'm1-enemy', actorId: report.startup.actorId,
      targetId: report.startup.targetId, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, maxTurns: limits.lifecycleTurns })
    episodeAttached = true
    report.beforePrimer = before
    await page.screenshot({ path: resolve(output, 'before-primer.png') }); save()
    await checked(() => page.keyboard.press('1'))
    const base = await checked(() => input.fixedGround({ x: -9.06031, z: -2.98577 }, 'blast'))
    assert.equal(base.rejection, null, JSON.stringify(base))
    const primer = await page.evaluate(base => {
      const { scene: s, world: w, actor } = window.blastOriginal
      const { spellTargetError, nativePosition, spellRange, positionDistance } = window.blastHelpers
      const probe = structuredClone(w), caster = probe.units.find(u => u.id === actor.id), rejected = []
      const cell = point => ({ x: (Math.round((point.x + 8) * 256) & 65535) >> 9, y: (Math.round((-point.z - 8) * 256) & 65535) >> 9 })
      const wanted = cell(base.point), offsets = []
      for (let dy = -16; dy <= 16; dy += 4) for (let dx = -16; dx <= 16; dx += 4) offsets.push({ dx, dy })
      offsets.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
      for (const { dx, dy } of offsets) {
        const hit = { x: Math.round(base.x + dx), y: Math.round(base.y + dy) }, event = { clientX: hit.x, clientY: hit.y }
        const owned = document.elementFromPoint(hit.x, hit.y) === s.renderer.domElement
        const person = owned ? s.picking.pickPerson(event) : null
        const occupied = person !== null
        const point = owned && !occupied ? s.pick(event) : null, pickedCell = point && cell(point)
        const error = point ? spellTargetError(probe, 'blast', point) : 'no empty ground'
        const margin = point ? spellRange(probe, caster, 2) * 256 - positionDistance(nativePosition(probe, caster), nativePosition(probe, point)) : null
        if (point && pickedCell.x === wanted.x && pickedCell.y === wanted.y && error === null && margin >= 128)
          return { ...base, ...hit, point, margin, rejected, groundOnly: true, turn: w.turn }
        rejected.push({ ...hit, owned, person, occupied: !!occupied, point, pickedCell, error, margin })
      }
      return { ...base, rejection: 'No owned empty-person primer point in the retained ground cell', rejected }
    }, base)
    report.primer = { hit: primer }; save()
    assert.equal(primer.rejection, null, JSON.stringify(primer))
    report.primer.delivered = await checked(() => input.castInput(primer, 'blast'))
    report.primer.armed = await page.evaluate(() => window.blastEpisode.armEnemy())
    const primerTurn = report.primer.delivered.before.turn
    await checkStop()
    await page.keyboard.press('1')
    let previous
    await poll(async () => {
      const row = await page.evaluate(({ previous, home, primerTurn, limits }) => {
        const { scene: s, world: w, actor, target } = window.blastOriginal
        const { blastPersonSnapshot, inputContext, inspectEntityPoint, spellTargetError, unitAnimationSource } = window.blastHelpers
        const progress = window.blastEpisode.progress(), sample = window.blastSetup.snapshot()
        const person = blastPersonSnapshot(w, target, target), actorPerson = blastPersonSnapshot(w, actor, target)
        const probe = structuredClone(w), clonedTarget = probe.units.find(u => u.id === target.id)
        const targetError = clonedTarget ? spellTargetError(probe, 'blast', clonedTarget) : 'target missing'
        const moving = !!(previous && w.turn > previous.turn && person.position && previous.position &&
          (person.position.x !== previous.position.x || person.position.y !== previous.position.y))
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
        const context = inputContext(s), hover = progress.hover
        const gates = { identity: !!(sample && !sample.failures.length && person.same && person.id === 38 && person.team === 'red' && person.kind === 'brave' &&
            person.hp > 0 && person.inside === null && person.ownerValid && actorPerson.ownerValid && actor.hp > 0 && actor.x === home.x && actor.z === home.z &&
            actorPerson.position && home.position && actorPerson.position.x === home.position.x && actorPerson.position.y === home.position.y && actorPerson.position.h === home.position.h),
          live: w.outcome.level === 1 && w.status === 'playing' && !w.paused && w.speed === 1 && !(w.manaWorld.gameFlags & 32) &&
            w.turn < limits.maximumSetupTurn && w.turn - primerTurn <= limits.primerTurns,
          camera: !w.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition,
          recipient: w.selected.length === 1 && w.selected[0] === actor.id && w.mode === 'blast' && w.shots.blast > 0 && w.stats.cast === 2,
          moving, range: targetError === null, body: body.visible && body.pickable && body.visibleLayer && !!body.painter,
          pixel: !!pixel, hover: !!hover && !!progress.hoverCapture, context: !hover || JSON.stringify(context) === JSON.stringify(hover.context),
          primerRetired: !w.projectiles.some(p => p.team === 'blue' && p.spell === 'blast'), observation: progress.errors.length === 0 }
        const ready = Object.values(gates).every(Boolean)
        const row = { turn: w.turn, position: person.position, person, actor: actorPerson, gates, ready, pixel,
          body, box: box && { x: box.x, y: box.y, width: box.width, height: box.height }, inspection,
          targetError, context, hover, errors: progress.errors, failures: sample?.failures ?? ['snapshot'] }
        // Only metadata is armed here. The host sends the sole candidate click.
        if (ready) window.blastEpisode.trigger(w.turn)
        return row
      }, { previous, home, primerTurn, limits })
      if (row.ready) {
        admitted = row
        // No screenshot, raster work, artifact write or additional read between
        // this fresh source/pixel admission and the one ordinary click.
        signal.throwIfAborted()
        await page.mouse.click(row.pixel.x, row.pixel.y)
        preparation.observe(row); admitted = null
        report.personInput = { turn: row.turn, pixel: row.pixel, targetId: report.startup.targetId }
        return true
      }
      preparation.observe(row)
      assert.ok(row.gates.identity, 'Original caster/target identity, health or fixed position changed')
      assert.ok(row.gates.live, 'Ordinary clock or bounded primer window ended')
      assert.ok(row.gates.recipient, 'Original cast recipient, stock or cast count changed')
      assert.ok(row.gates.context, 'Natural hover context changed')
      assert.deepEqual(row.errors, [], 'Episode observation failed')
      if (!previous || row.turn > previous.turn) previous = { turn: row.turn, position: row.position }
      if (row.pixel && !row.hover && row.gates.camera) await page.mouse.move(row.pixel.x, row.pixel.y)
      return false
    }, 'first eligible real moving-enemy pixel and natural hover')
    save()
    await poll(async () => {
      const { progress, turn } = await page.evaluate(() => ({ progress: window.blastEpisode.progress(), turn: window.blastOriginal.world.turn }))
      assert.deepEqual(progress.errors, [], 'Moving-enemy lifecycle failed')
      assert.ok(turn - report.personInput.turn <= limits.lifecycleTurns, 'Second-shot lifecycle/render window expired')
      return progress.complete
    }, 'moving windup, flight, exact arrival and natural impact')
    await page.screenshot({ path: resolve(output, 'terminal.png') })
  } catch (error) { primaryError = error }
  finally {
    if (admitted) preparation.observe(admitted)
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
    save('episode.json', { ...report, ...episode, status: primaryError ? 'failed' : 'passed', failure: primaryError?.stack,
      method: 'One public Mission1 Bridge prefix, one ground primer and at most one person Blast. Real RAF and trusted public input; original-call-once passive observers and detached-clone predicates. Natural hover/ack artifacts are frozen actual-DOM detached rasters; projectile/impact images are actual game-canvas captures.',
      remainingAcceptance: ['Empty-ground/rejection/interruption controls', 'Active-cast save/reload', 'Comparable paired frame review', 'Hardware performance'] })
  }
  if (primaryError) throw primaryError
  assert.equal(episode.report.complete, true)
  return { stage: 'ordinary-m1-moving-enemy-cast-impact', expectation: 'candidate', complete: true, evidence: resolve(output, 'episode.json'),
    remainingAcceptance: ['Ground/rejection/interruption controls', 'Active-cast save/reload', 'Paired frame review', 'Hardware performance'] }
}
