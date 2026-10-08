// Adapted from the accepted hut-smoke-ignition Bridge prefix and ordinary-shared-training input.
// Live World is read only; every validator that synchronizes terrain receives a detached clone.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Accept only the two observed ordinary Blast paths needed by this M1 route.
// Other picker results are an unsupported QA prerequisite, not game invalidity.
export function assertMission1BlastTarget({ before, after, pointer, resolvedPerson }, actorId) {
  assert.equal(before.mode, 'blast'); assert.equal(after.mode, null)
  for (const sample of [before, after]) {
    assert.equal(sample.overviewActive, false)
    assert.ok(Number.isInteger(sample.gameFlags) && !(sample.gameFlags & 32))
    assert.equal(sample.caster, actorId); assert.equal(sample.worldMatches, true)
  }
  assert.equal(after.gameFlags, before.gameFlags); assert.equal(after.turn, before.turn)
  assert.equal(after.stock, before.stock - 1)
  assert.equal(pointer.restored, true); assert.deepEqual(pointer.errors, [])
  const releases = pointer.events.filter(event => event.type === 'pointerup')
  assert.equal(releases.length, 1)
  const release = releases[0]
  assert.ok(release.trusted && release.canvasOwned && release.canvasTarget && release.button === 0)
  const picks = release.picks.filter(pick => pick.owner === 'picking' && pick.name === 'pickPerson' ||
    pick.owner === 'scene' && pick.name === 'pick')
  for (const pick of picks) {
    assert.equal(pick.receiverMatches, true); assert.deepEqual(pick.args, release.args)
    assert.ok(!pick.threw, 'Actual target picker threw')
  }
  assert.equal(picks[0]?.owner, 'picking'); assert.equal(picks[0]?.name, 'pickPerson')
  const fresh = after.projectiles.filter(shot => !before.projectiles.some(prior => prior.id === shot.id))
  assert.equal(fresh.length, 1, 'Exactly one fresh Blast projectile is required')
  const shot = fresh[0]
  assert.ok(Number.isInteger(shot.id)); assert.equal(shot.spell, 'blast'); assert.equal(shot.caster, actorId)
  assert.equal(shot.phase, 'windup'); assert.equal(shot.remaining, 6); assert.equal(shot.turns, 0)
  assert.deepEqual(shot.visuals, [])
  assert.ok(Number.isFinite(after.pointerAck.until) && after.pointerAck.until > before.pointerAck.until)
  const id = picks[0].id
  if (id !== null) {
    assert.ok(Number.isInteger(id) && id > 0)
    assert.equal(picks.length, 1, 'Direct-person receipt must not contain terrain fallback')
    assert.deepEqual(resolvedPerson, { id, before: true, after: true, sameObject: true },
      'Unresolved/replaced picked person is an unsupported QA prerequisite')
    assert.equal(shot.blastTarget?.personId, id); assert.equal(shot.blastTarget?.shotPersonId, null)
    assert.deepEqual(shot.destination, shot.blastTarget.destination)
    assert.ok(['x', 'y', 'h'].every(key => Number.isFinite(shot.destination[key])))
    // world-coordinates.ts browserPosition: signed-short wrap, then /256.
    assert.deepEqual(shot.target, { x: ((shot.destination.x - 2048) << 16 >> 16) / 256,
      z: -((shot.destination.y + 2048) << 16 >> 16) / 256 })
    assert.equal(after.pointerAck.target, id)
    return { kind: 'person', personId: id, projectileId: shot.id }
  }
  assert.equal(picks.length, 2); assert.equal(picks[1].owner, 'scene'); assert.equal(picks[1].name, 'pick')
  const point = picks[1].point
  assert.ok(point && Number.isFinite(point.x) && Number.isFinite(point.z))
  assert.equal(shot.blastTarget, undefined)
  // spell-casting.ts beginCast consumes this actual terrain point's 2x2 cell.
  assert.deepEqual(shot.target, { x: Math.floor(point.x / 2) * 2 + 1, z: -Math.floor(-point.z / 2) * 2 - 1 })
  assert.equal(after.pointerAck.target, 0)
  return { kind: 'ground', personId: null, projectileId: shot.id, point }
}

export class Mission1PreclickRejection extends Error {
  constructor(message, retryable) { super(message); this.retryable = retryable; this.inputAttempted = false }
}

// Public command33 owns a newly queued native task at phase0. Later game
// visits initialize phase1; entry acceptance does not claim acquisition progress.
export function isQueuedMission1VaultEntry(unit, id) {
  const task = unit.vaultTask, order = unit.order, owner = unit.orderOwner
  return unit.hp > 0 && unit.kind === 'shaman' && Number.isInteger(unit.orderId) && unit.orderId > 0 &&
    order?.model === 33 && order.a === id && order.b === 0 && !(order.flags & 1) && order.references === 1 &&
    unit.work === id && task?.head === id && task.phase === 0 && task.entering === true && task.remaining === 0 &&
    owner?.native === true && owner.registered === true && owner.phase === 0 && !!(owner.flags2 & 0x40000000) &&
    owner.timer === 0 && (owner.workTarget || order.a) === id
}

export function createMission1VaultInput({ page, signal, report, save, originalShamanId }) {
  let prepared = false
  const action = async (label, run, persist = true) => {
    signal.throwIfAborted()
    if (originalShamanId !== null) await page.evaluate(id => {
      const unit = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!unit || unit.hp <= 0) throw new Error('Original Shaman was lost; stop the ordinary route')
    }, originalShamanId)
    report.actions.push({ label, phase: 'before', at: new Date().toISOString() }); if (persist) save()
    await run()
    signal.throwIfAborted()
    report.actions.push({ label, phase: 'after', at: new Date().toISOString() }); if (persist) save()
  }
  const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())
  const pause = async () => {
    if (!(await page.evaluate(() => window.testSceneRef.current.world.paused))) await button('Pause game')
    await page.waitForFunction(() => window.testSceneRef.current.world.paused)
  }
  const resume = async () => {
    if (await page.evaluate(() => window.testSceneRef.current.world.paused)) await button('Resume game')
    await page.waitForFunction(() => !window.testSceneRef.current.world.paused)
  }
  const settle = () => page.waitForFunction(() => {
    const scene = window.testSceneRef.current
    return !scene.world.inputMask && !scene.cameraMotion.active && !scene.resultCamera.active && !scene.viewTransition
  })
  // Reuse the existing reviewed pure minimap inverse; only the subsequent real
  // pointer event moves the camera. No scene.focus/update/render call is made.
  const view = async target => {
    await settle()
    const hit = await page.evaluate(async target => {
      const scene = window.testSceneRef.current
      const { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = await import('/qa/erosion-ordinary/minimap-input.mjs')
      return minimapInput({ width: scene.mini.width, height: scene.mini.height,
        rect: scene.mini.getBoundingClientRect(),
        center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
        heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
        target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) },
        maxDistance: 8 * 256 }, minimapPick,
      point => document.elementFromPoint(point.x, point.y) === scene.mini)
    }, target)
    assert.ok(hit, 'No owned minimap input near the actual target')
    await action('minimap-view', () => page.mouse.click(hit.x, hit.y))
    await settle()
  }
  const prepareDispatch = async () => {
    await page.evaluate(async () => {
      const [orders, input] = await Promise.all([import('/app/person-orders.ts'), import('/qa/erosion-ordinary/input.mjs'),
        import('/app/live-command.ts'), import('/app/spell-casting.ts'), import('/app/world-terrain-runtime.ts'), import('/app/native-math.ts')])
      window.mission1VaultDispatchModules = { orders, input }
    })
    await page.waitForFunction(() => {
      const world = window.testSceneRef.current.world
      return world.turn > world.lastOrderTurn
    }, null, { timeout: 5000 })
    prepared = true
  }
  const entityPoint = (collection, id, expectedCommand, cast = false) => page.evaluate(
    async ({ collection, id, expectedCommand, cast, actorId }) => {
      const [{ findEntityInput, inspectEntityPoint, createMoveContextProbe, entityInputState }, { spellTargetError },
        { nativePosition }, { spellRange }, { positionDistance }, { SPELLS }] = await Promise.all([
        import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts'), import('/app/world-terrain-runtime.ts'),
        import('/app/spell-casting.ts'), import('/app/native-math.ts'), import('/app/world-rules.ts')])
      const scene = window.testSceneRef.current, world = scene.world
      const target = world[collection].find(object => object.id === id)
      if (!target) return { id, collection, rejection: 'Ordinary target disappeared',
        diagnostics: { turn: world.turn, camera: { ...scene.cameraPosition }, selected: [...world.selected] } }
      const context = expectedCommand === null ? null : createMoveContextProbe(world)(target)
      const rect = scene.renderer.domElement.getBoundingClientRect(), projected = scene.screen(target)
      const center = { x: rect.left + (projected.x + 1) * rect.width / 2,
        y: rect.top + (1 - projected.y) * rect.height / 2 }, candidates = []
      const mesh = collection === 'shrines' ? scene.shrineMeshes.get(id)?.g : collection === 'units' ? scene.unitMeshes.get(id) : scene.buildingMeshes.get(id)
      // Same rendered-triangle interior candidates used by the accepted erosion input checker.
      mesh?.traverse(child => {
        if (child.userData.nativeModel === undefined || !child.visible) return
        for (const { points } of scene.picking.model(child, JSON.stringify(scene.view.projection)).filter(item => item.kind === 'model'))
          for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
            const total = weights.reduce((sum, weight) => sum + weight, 0)
            candidates.push({ x: rect.left + points.reduce((sum, point, i) => sum + point.x * weights[i], 0) / total,
              y: rect.top + points.reduce((sum, point, i) => sum + point.y * weights[i], 0) / total })
          }
      })
      candidates.sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y))
      for (let dy = -140; dy <= 64; dy += 4)
        for (let dx = -100; dx <= 100; dx += 4) candidates.push({ x: center.x + dx, y: center.y + dy })
      // Counts describe inspected search points, not a retrospective cause for all candidates.
      const probe = { paused: world.paused, candidates: candidates.length, inspected: 0, matching: 0,
        rejections: { canvasOwnership: 0, wrongTarget: 0, noTerrainPick: 0, wrongTerrainCell: 0 }, examples: {} }
      const reject = (reason, sample) => {
        probe.rejections[reason]++
        probe.examples[reason] ??= { x: sample.x, y: sample.y, canvasOwned: sample.canvasOwned, hitId: sample.hitId }
        return { ...sample, hitId: null }
      }
      const hit = findEntityInput(candidates, id, point => {
        const sample = inspectEntityPoint(scene, collection, point)
        probe.inspected++
        if (!sample.canvasOwned) return reject('canvasOwnership', sample)
        if (sample.hitId !== id) return reject('wrongTarget', sample)
        if (cast && collection === 'buildings' && sample.hitId === id) {
          const ground = scene.pick({ clientX: point.x, clientY: point.y })
          const x = ground && Math.round((ground.x + 8) * 256) & 65535
          const y = ground && Math.round((-ground.z - 8) * 256) & 65535
          if (!ground) return reject('noTerrainPick', sample)
          if ((world.land.buildingIds[(y >> 9) * 128 + (x >> 9)] & 1023) !== id) return reject('wrongTerrainCell', sample)
        }
        probe.matching++
        return sample
      })
      const diagnostics = { state: entityInputState(scene, { id, collection }, hit ?? center), context,
        pick: inspectEntityPoint(scene, collection, hit ?? center), selected: [...world.selected] }
      const rejection = expectedCommand !== null && (!context.enabled || context.model !== expectedCommand)
        ? 'Ordinary command context changed' : !hit ? 'No current rendered target interior with the required terrain cell' : null
      const ground = cast && hit ? scene.pick({ clientX: hit.x, clientY: hit.y }) : null
      // Geometry is diagnostic only. Synchronizing native helpers get a detached World.
      const spellWorld = cast ? structuredClone(world) : null, actor = spellWorld?.units.find(u => u.id === actorId)
      const spec = cast && SPELLS.find(s => s.id === cast)
      const nativeCaster = actor ? nativePosition(spellWorld, actor) : null
      const nativeTarget = ground && spellWorld ? nativePosition(spellWorld, ground) : null
      const range = actor && spec ? spellRange(spellWorld, actor, spec.model) * 256 : null
      const distance = nativeCaster && nativeTarget ? positionDistance(nativeCaster, nativeTarget) : null
      const castGeometry = cast ? { actorId, actor: actor && { x: actor.x, z: actor.z, hp: actor.hp, inside: actor.inside },
        model: spec?.model, nativeCaster, nativeTarget, range, distance,
        margin: range !== null && distance !== null ? range - distance : null } : null
      const spellPreflight = cast && ground ? { point: ground, selected: [...world.selected],
        shots: world.shots[cast], turn: world.turn,
        rejection: spellTargetError(structuredClone(world), cast, ground) } : null
      return { ...hit, id, collection, turn: world.turn, expectedCommand, cast, probe, castGeometry, spellPreflight, diagnostics,
        rejection: rejection ?? (cast && !ground ? 'Spell ground pick disappeared' : null) }
    }, { collection, id, expectedCommand, cast, actorId: originalShamanId })
  const dispatch = async (hit, command, expectedIds) => {
    if (!prepared) await prepareDispatch()
    signal.throwIfAborted()
    const preflight = await page.evaluate(({ hit, command, expectedIds, actorId }) => {
      const { orders, input } = window.mission1VaultDispatchModules
      const { currentPersonOrder } = orders
      const { findEntityInput, inspectEntityPoint, createMoveContextProbe, observeEntityPointer, entityInputState } = input
      const scene = window.testSceneRef.current, world = scene.world, canvas = scene.renderer.domElement
      const point = hit.collection ? world[hit.collection].find(object => object.id === hit.id) :
        scene.pick({ clientX: hit.x, clientY: hit.y })
      const context = point ? createMoveContextProbe(world)(point) : null
      const pick = inspectEntityPoint(scene, hit.collection ?? 'buildings', hit)
      const interior = hit.collection ? findEntityInput([hit], hit.id, p => inspectEntityPoint(scene, hit.collection, p)) : null
      const diagnostics = { state: entityInputState(scene, hit.collection ? hit : null, hit), pick, interior, context,
        point: point && { id: point.id ?? null, x: point.x, z: point.z }, selected: [...world.selected], lastOrderTurn: world.lastOrderTurn,
        selectedUnits: world.selected.map(id => { const unit = world.units.find(unit => unit.id === id);
          return { id, kind: unit?.kind, team: unit?.team, hp: unit?.hp } }) }
      const actor = world.units.find(unit => unit.id === actorId)
      const rejection = scene.world !== window.testStore.getWorld() ? 'Scene/store identity changed'
        : !actor || actor.hp <= 0 || actor.kind !== 'shaman' || actor.team !== 'blue' ? 'Original Shaman was lost'
        : world.paused || world.mode !== null ? 'Ordinary dispatch requires playing command mode'
        : expectedIds && JSON.stringify(world.selected) !== JSON.stringify(expectedIds)
        ? 'Selected recipients changed before dispatch'
        : command === 8 && (!diagnostics.selectedUnits.length || diagnostics.selectedUnits.some(unit =>
            unit.team !== 'blue' || unit.kind !== 'brave' || !(unit.hp > 0)))
          ? 'Housing requires the intended living all-Brave cohort before input'
          : window.mission1VaultDispatch || window.mission1VaultCastInput ? 'An input observer is already armed'
        : hit.collection && !interior ? 'Rendered target became stale before dispatch'
          : !point || (!hit.collection && (!pick.canvasOwned || pick.hitId !== null ||
              Math.hypot(point.x - hit.point.x, point.z - hit.point.z) > 0.05))
            ? 'Ground target became stale before dispatch'
            : !context?.enabled || context.model !== command ? 'Fresh dispatch context rejected' : null
      if (rejection) return { rejection, diagnostics }
      const ids = [...world.selected]
      const sample = () => ({ turn: world.turn, selected: [...world.selected], lastOrderTurn: world.lastOrderTurn,
        ack: { ...scene.pointerAck }, worldMatches: scene.world === world && window.testStore.getWorld() === world,
        units: ids.map(id => {
          const unit = world.units.find(unit => unit.id === id)
          const person = unit?.builder?.person ?? unit?.flight ?? unit?.fight?.motion ?? unit?.native ?? unit?.entry?.person
          return { id, kind: unit?.kind, hp: unit?.hp, inside: unit?.inside, work: unit?.work,
            vaultTask: unit?.vault && { ...unit.vault },
            orderId: person && (person.immediateCommand || person.commands[person.commandCursor]),
            orderOwner: command === 33 && person ? { native: person === unit.native, registered: world.objectCells.objects.get(id) === person,
              phase: person.commandPhase, workTarget: person.workTarget, flags2: person.flags2, timer: person.timer } : null,
            order: person ? structuredClone(currentPersonOrder(world.buildingOrders, person)) : null }
        }) })
      const delivery = observeEntityPointer(scene, document, hit.collection ? hit : null)
      const record = { before: sample(), context, point, preflight: { rejection: null, diagnostics }, after: null, errors: [] }
      const after = () => { try { record.after = sample() } catch (error) { record.errors.push(String(error)) } }
      canvas.addEventListener('pointerup', after)
      window.mission1VaultDispatch = { finish() {
        canvas.removeEventListener('pointerup', after)
        return { ...record, delivered: delivery.finish() }
      } }
      return { rejection: null, turn: world.turn }
    }, { hit, command, expectedIds, actorId: originalShamanId })
    const entry = { label: 'final-dispatch-preflight', command, hit, preflight, inputAttempted: false }
    report.actions.push(entry)
    if (preflight.rejection) throw new Mission1PreclickRejection(preflight.rejection, command === 3 && !hit.collection &&
      preflight.rejection === 'Ground target became stale before dispatch')
    let evidence
    try { signal.throwIfAborted(); entry.inputAttempted = true; await page.mouse.click(hit.x, hit.y) }
    catch (error) { if (error instanceof Mission1PreclickRejection) error.inputAttempted = entry.inputAttempted; throw error }
    finally {
      evidence = await page.evaluate(() => { const observer = window.mission1VaultDispatch; delete window.mission1VaultDispatch; return observer?.finish() })
      entry.preflight = evidence?.preflight ?? preflight
      report.actions.push({ label: 'actual-dispatch', command, hit, evidence }); save()
    }
    const { before, after, delivered, errors } = evidence
    assert.deepEqual(errors, []); assert.deepEqual(delivered.errors, []); assert.equal(delivered.restored, true)
    assert.ok(before.worldMatches && after?.worldMatches)
    assert.deepEqual(delivered.events.map(event => [event.type, event.button, event.trusted, event.canvasOwned, event.canvasTarget]),
      ['pointerdown', 'pointerup'].map(type => [type, 0, true, true, true]))
    assert.ok(delivered.events.every(event => ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => !event.args[key])))
    assert.ok(after.lastOrderTurn > before.lastOrderTurn)
    assert.ok(after.ack.until > before.ack.until); assert.equal(after.ack.target, hit.id ?? 0)
    assert.deepEqual(after.selected, before.selected)
    if (expectedIds) assert.deepEqual(before.selected, expectedIds)
    else assert.ok(before.units.length > 0 && before.units.every(unit => unit.kind === 'brave' && unit.hp > 0))
    const recipients = after.units.filter(unit => unit.hp > 0 && (command === 8 ? unit.work === hit.id : command === 33 ? isQueuedMission1VaultEntry(unit, hit.id) :
      unit.order?.model === command && !(unit.order.flags & 1) && (command !== 27 || unit.order.a === hit.id)))
    assert.ok(recipients.length > 0, 'The actual command must reach a selected recipient')
    assert.deepEqual(recipients.map(unit => unit.id), expectedIds ?? before.selected)
    return evidence
  }
  const castInput = async (hit, spell) => {
    const owner = randomUUID()
    const preflight = await page.evaluate(async ({ hit, spell, actorId, owner }) => {
      const [{ spellTargetError }, { inspectEntityPoint, observeEntityPointer }] = await Promise.all([import('/app/live-command.ts'), import('/qa/erosion-ordinary/input.mjs')])
      const scene = window.testSceneRef.current, world = scene.world, canvas = scene.renderer.domElement
      const point = hit.point ?? hit.spellPreflight.point
      const pick = inspectEntityPoint(scene, hit.collection ?? 'buildings', hit)
      const actual = scene.pick({ clientX: hit.x, clientY: hit.y })
      const rejection = JSON.stringify(world.selected) !== JSON.stringify([actorId]) ? 'Original Shaman must own spell input' : !pick.canvasOwned || !actual || Math.hypot(actual.x - point.x, actual.z - point.z) > 0.05 ||
        (hit.collection && pick.hitId !== hit.id) ? 'Spell target changed before actual input' : spellTargetError(structuredClone(world), spell, point)
      const preflight = { turn: world.turn, point, spell, mode: world.mode, paused: world.paused,
        actorId, stock: world.shots[spell], pick, actual, rejection, armed: false }
      if (rejection || world.paused || world.mode !== spell || world.shots[spell] <= 0) return preflight
      if (window.mission1VaultCastInput || window.mission1VaultDispatch) throw new Error('An input observer is already armed')
      // One maintained observer owns the actual handler's picker calls. Preflight
      // terrain/payment alone cannot distinguish direct-person Blast from fallback.
      const pointer = observeEntityPointer(scene, document, hit.collection ? hit : null)
      const record = { before: [], after: [], errors: [] }
      let releaseUnits, completedUnits
      const sample = event => ({ turn: world.turn, stock: world.shots[spell], gifts: world.giftCounts[spell],
        mode: world.mode, overviewActive: scene.overviewActive, gameFlags: world.manaWorld.gameFlags,
        trusted: event.isTrusted, button: event.button, canvasTarget: event.target === canvas,
        worldMatches: scene.world === world && window.testStore.getWorld() === world,
        caster: world.units.find(unit => unit.id === actorId)?.id ?? null,
        projectiles: world.projectiles.filter(p => p.spell === spell).map(p => ({ id: p.id, spell: p.spell, caster: p.caster, phase: p.phase, remaining: p.remaining, turns: p.turns,
          visuals: p.visuals.map(effect => effect.id), target: { ...p.target }, destination: { ...p.destination }, blastTarget: p.blastTarget && structuredClone(p.blastTarget) })),
        pointerAck: { ...scene.pointerAck },
        effects: world.effects.map(e => e.id) })
      const observe = (phase, event) => {
        try { record[phase].push(sample(event)) }
        catch (error) { if (record.errors.length < 8) record.errors.push(String(error?.stack ?? error)) }
      }
      const before = event => { releaseUnits = new Map(world.units.map(unit => [unit.id, unit])); observe('before', event) }
      const after = event => { completedUnits = new Map(world.units.map(unit => [unit.id, unit])); observe('after', event) }
      canvas.addEventListener('pointerup', before, true); canvas.addEventListener('pointerup', after)
      window.mission1VaultCastInput = { owner, finish() {
        canvas.removeEventListener('pointerup', before, true); canvas.removeEventListener('pointerup', after)
        const delivered = pointer.finish(), release = delivered.events.find(event => event.type === 'pointerup')
        const picked = release?.picks.find(pick => pick.owner === 'picking' && pick.name === 'pickPerson')?.id
        const prior = releaseUnits?.get(picked), current = completedUnits?.get(picked)
        return { ...record, pointer: delivered, resolvedPerson: { id: picked ?? null,
          before: !!prior, after: !!current, sameObject: !!prior && prior === current } }
      } }
      return { ...preflight, armed: true, owner }
    }, { hit, spell, actorId: originalShamanId, owner })
    let delivered, failure, failed = false
    const cleanupFailures = []
    try {
      report.actions.push({ label: 'actual-cast-preflight', preflight }); save()
      assert.equal(preflight.rejection, null); assert.equal(preflight.paused, false)
      assert.equal(preflight.mode, spell); assert.ok(preflight.stock > 0)
      await action(`${spell}-target-click`, () => page.mouse.click(hit.x, hit.y))
    } catch (error) { failure = error; failed = true }
    finally {
      if (preflight.armed) try {
        assert.equal(preflight.owner, owner)
        delivered = await page.evaluate(owner => {
          const observer = window.mission1VaultCastInput
          if (!observer || observer.owner !== owner) throw Error('Cast observer ownership changed before cleanup')
          delete window.mission1VaultCastInput
          return observer.finish()
        }, owner)
      } catch (error) { cleanupFailures.push(error) }
      report.actions.push({ label: 'actual-cast-stock', spell, delivered })
      try { save() } catch (error) { cleanupFailures.push(error) }
      if (cleanupFailures.length) report.actions.push({ label: 'actual-cast-cleanup-errors',
        primary: failed ? String(failure?.stack ?? failure) : null, errors: cleanupFailures.map(error => String(error?.stack ?? error)) })
    }
    if (failed) throw failure
    if (cleanupFailures.length) throw cleanupFailures[0]
    assert.deepEqual(delivered.errors, []); assert.deepEqual(delivered.pointer.errors, [])
    assert.equal(delivered.pointer.restored, true)
    assert.deepEqual(delivered.pointer.events.map(event => [event.type, event.x, event.y, event.button, event.trusted, event.canvasOwned, event.canvasTarget]),
      ['pointerdown', 'pointerup'].map(type => [type, hit.x, hit.y, 0, true, true, true]))
    assert.ok(delivered.pointer.events.every(event => ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => !event.args[key])))
    assert.equal(delivered.before.length, 1); assert.equal(delivered.after.length, 1)
    const before = delivered.before[0], after = delivered.after[0]
    assert.ok([before, after].every(row => row.trusted && row.button === 0 && row.canvasTarget && row.worldMatches && row.caster === originalShamanId))
    assert.equal(after.turn, before.turn)
    assert.equal(after.stock, before.stock - 1, 'One real handler must spend one immediately observed earned shot')
    assert.equal(after.mode, null)
    const result = { preflight, before, after, pointer: delivered.pointer, resolvedPerson: delivered.resolvedPerson }
    if (spell === 'blast') result.target = assertMission1BlastTarget(result, originalShamanId)
    return result
  }
  const clickEntity = async (collection, id, command, cast = false, expectedIds = null) => {
    if (!cast) await prepareDispatch()
    const hit = await entityPoint(collection, id, command, cast)
    report.actions.push({ label: 'rendered-target', hit })
    assert.equal(hit.rejection, null, JSON.stringify(hit.diagnostics))
    if (cast) {
      assert.equal(hit.spellPreflight.rejection, null, JSON.stringify(hit.spellPreflight))
      assert.ok(hit.spellPreflight.shots > 0)
      return castInput(hit, cast)
    } else return dispatch(hit, command, expectedIds)
  }
  const fixedGround = (target, spell = null, cellMove = false, groundRadius = 0.35) => page.evaluate(async ({ target, spell, actorId, cellMove, groundRadius: allowedRadius }) => {
    const [{ createMoveContextProbe, entityInputState }, { spellTargetError }, { spellRange }, { nativePosition }, { positionDistance }] = await Promise.all([
      import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts'), import('/app/spell-casting.ts'),
      import('/app/world-terrain-runtime.ts'), import('/app/native-math.ts')])
    const scene = window.testSceneRef.current, world = scene.world, rect = scene.renderer.domElement.getBoundingClientRect()
    if (allowedRadius !== 0.35 && (allowedRadius !== 2 || spell || cellMove || world.outcome.level !== 3 || target.x !== 35 || target.z !== 81))
      throw new Error('Only the explicit M3 home-area move may widen ground eligibility')
    const projected = scene.screen(target), center = { x: rect.left + (projected.x + 1) * rect.width / 2,
      y: rect.top + (1 - projected.y) * rect.height / 2 }, candidates = []
    const snap = point => ({ x: Math.floor(point.x / 2) * 2 + 1, z: -Math.floor(-point.z / 2) * 2 - 1 })
    const wanted = snap(target), probe = createMoveContextProbe(world), rejected = []
    // Match nativePosition's rounding/wrap and liveCommandContext's 512-unit cell.
    // Keep the spell cell rule and the accepted shore's 0.35 aim precision unchanged.
    const nativeCell = point => ({ x: (Math.round((point.x + 8) * 256) & 65535) >> 9,
      y: (Math.round((-point.z - 8) * 256) & 65535) >> 9 })
    const wantedCell = nativeCell(target), rejectionCounts = { canvasOwnership: 0, objectHit: 0,
      noTerrainPick: 0, wrongCell: 0, aimPrecision: 0, commandContext: 0, spellPredicate: 0, spellMargin: 0 }
    let nearestRejectedPoint = null
    const reject = (reason, hit, point = null, details = {}) => {
      rejectionCounts[reason]++
      if (!point) return
      const targetDistance = Math.hypot(point.x - target.x, point.z - target.z)
      if (!nearestRejectedPoint || targetDistance < nearestRejectedPoint.targetDistance)
        nearestRejectedPoint = { reason, ...hit, point: { x: point.x, z: point.z },
          pointCell: nativeCell(point), targetDistance, ...details }
    }
    const spellWorld = spell ? structuredClone(world) : null
    const actor = spellWorld?.units.find(unit => unit.id === actorId)
    const caster = actor ? { id: actor.id, x: actor.x, z: actor.z, hp: actor.hp, inside: actor.inside,
      native: nativePosition(spellWorld, actor), range: spellRange(spellWorld, actor, spell === 'bridge' ? 12 : 2) * 256,
      paused: world.paused, turn: world.turn } : null
    const minimumMargin = 128 // A half-world-unit witness margin; the shipped spell range is unchanged.
    if (spell && (!actor || actor.hp <= 0)) return { target, rejection: 'Original Shaman is unavailable', caster, rejected }
    for (let dy = -180; dy <= 180; dy += 4) for (let dx = -180; dx <= 180; dx += 4) candidates.push({ dx, dy })
    candidates.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
    for (const offset of candidates) {
      const hit = { x: Math.round(center.x + offset.dx), y: Math.round(center.y + offset.dy) }
      const event = { clientX: hit.x, clientY: hit.y }
      if (document.elementFromPoint(hit.x, hit.y) !== scene.renderer.domElement) {
        reject('canvasOwnership', hit); continue
      }
      if (!spell && (scene.pickUnit(event) || scene.picking.pickPerson(event) || scene.pickWorldObject(event))) {
        reject('objectHit', hit); continue
      }
      const point = scene.pick(event)
      if (!point) { reject('noTerrainPick', hit); continue }
      const snapped = snap(point), pointCell = nativeCell(point)
      if (spell ? snapped.x !== wanted.x || snapped.z !== wanted.z : cellMove
        ? pointCell.x !== wantedCell.x || pointCell.y !== wantedCell.y
        : Math.hypot(point.x - target.x, point.z - target.z) > allowedRadius) {
        reject(spell || cellMove ? 'wrongCell' : 'aimPrecision', hit, point); continue
      }
      const context = spell ? null : probe(point)
      const rejection = spell ? spellTargetError(spellWorld, spell, point)
        : context.model !== 3 || !context.enabled ? 'Ground command context rejected' : null
      if (!spell && rejection) { reject('commandContext', hit, point, { context }); continue }
      const nativeTarget = spell ? nativePosition(spellWorld, point) : null
      const distance = spell ? positionDistance(caster.native, nativeTarget) : null
      const margin = spell ? caster.range - distance : null
      if (spell && (rejection || margin < minimumMargin)) {
        reject(rejection ? 'spellPredicate' : 'spellMargin', hit, point, { rejection, margin })
        rejected.push({ ...hit, point, nativeTarget, rejection, distance, margin }); continue
      }
      return { ...hit, point, target, snapped, wantedCell, pointCell, cellMove, context, rejection, caster, nativeTarget, distance, margin, minimumMargin, rejected, rejectionCounts, nearestRejectedPoint,
        diagnostics: entityInputState(scene, null, hit), turn: world.turn }
    }
    return { target, wantedCell, cellMove, rejection: spell
      ? 'No owned rendered point in the required native cell meets the shipped predicate and range margin'
      : 'No owned empty ground pick meets the requested movement target and enabled command3 context',
      caster, minimumMargin, rejected, rejectionCounts, nearestRejectedPoint, diagnostics: entityInputState(scene, null, center) }
  }, { target, spell, actorId: originalShamanId, cellMove, groundRadius })
  const farBankGround = async (target, maxProbes = 3) => {
    assert.ok(Number.isInteger(maxProbes) && maxProbes >= 1 && maxProbes <= 3)
    let hit
    // Reuse ordinary-shared-training's owned right-drag corridor. Two finite
    // camera adjustments can expose this same destination cell; never drift it.
    for (let attempt = 0; attempt < maxProbes; attempt++) {
      hit = await fixedGround(target, null, true)
      report.actions.push({ label: 'far-bank-ground-probe', attempt, hit })
      if (hit.rejection === null || attempt === maxProbes - 1) return { ...hit, probeAttempts: attempt + 1 }
      const corridor = await page.evaluate(() => {
        const canvas = window.testSceneRef.current.renderer.domElement
        for (const y of [750, 650, 550]) {
          let owned = true
          for (let x = 280; x <= 792; x++)
            if (document.elementFromPoint(x, y) !== canvas) { owned = false; break }
          if (owned) return { x: 280, endX: 792, y }
        }
        return null
      })
      report.actions.push({ label: 'far-bank-camera-corridor', attempt, corridor })
      if (!corridor) return { ...hit, probeAttempts: attempt + 1 }
      await action('far-bank-ordinary-camera-rotation', async () => {
        await page.mouse.move(corridor.x, corridor.y); await page.mouse.down({ button: 'right' })
        try { await page.mouse.move(corridor.endX, corridor.y, { steps: 12 }) }
        finally { await page.mouse.up({ button: 'right' }) }
        await page.mouse.move(400, 780)
      }, false)
      await settle()
    }
    return hit
  }
  const moveGround = async (target, cellMove = false, groundRadius = 0.35) => {
    assert.ok(!cellMove || groundRadius === 0.35, 'Native-cell moves retain their exact original eligibility')
    let succeeded = false
    try {
      for (let remaining = 3; remaining > 0;) {
        await prepareDispatch() // All known imports and readiness precede target search.
        const hit = cellMove ? await farBankGround(target, remaining) : await fixedGround(target, null, false, groundRadius)
        remaining -= hit.probeAttempts ?? 1
        assert.equal(hit.rejection, null, JSON.stringify(hit))
        try {
          const delivered = await dispatch(hit, 3, [originalShamanId])
          succeeded = true
          return { hit, delivered }
        } catch (error) {
          if (!(error instanceof Mission1PreclickRejection) || error.inputAttempted || !error.retryable || !remaining) throw error
          report.actions.push({ label: 'ordinary-ground-reprobe', reason: error.message, remaining })
        }
      }
    } finally { if (!succeeded) save() }
  }
  return { action, button, pause, resume, settle, view, prepareDispatch, entityPoint, dispatch, castInput, fixedGround, farBankGround, moveGround, clickEntity }
}
