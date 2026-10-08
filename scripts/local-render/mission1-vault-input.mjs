// Adapted from the accepted hut-smoke-ignition Bridge prefix and ordinary-shared-training input.
// Live World is read only; every validator that synchronizes terrain receives a detached clone.
import assert from 'node:assert/strict'

export function createMission1VaultInput({ page, signal, report, save, originalShamanId }) {
  const action = async (label, run) => {
    signal.throwIfAborted()
    if (originalShamanId !== null) await page.evaluate(id => {
      const unit = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!unit || unit.hp <= 0) throw new Error('Original Shaman was lost; stop the ordinary route')
    }, originalShamanId)
    report.actions.push({ label, phase: 'before', at: new Date().toISOString() }); save()
    await run()
    signal.throwIfAborted()
    report.actions.push({ label, phase: 'after', at: new Date().toISOString() }); save()
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
      await Promise.all([import('/app/person-orders.ts'), import('/app/live-command.ts'),
        import('/qa/erosion-ordinary/input.mjs')])
    })
    await page.waitForFunction(() => {
      const world = window.testSceneRef.current.world
      return world.turn > world.lastOrderTurn
    }, null, { timeout: 5000 })
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
    const preflight = await page.evaluate(async ({ hit, command, expectedIds }) => {
      const [{ currentPersonOrder }, { findEntityInput, inspectEntityPoint, createMoveContextProbe, observeEntityPointer, entityInputState }] =
        await Promise.all([import('/app/person-orders.ts'), import('/qa/erosion-ordinary/input.mjs')])
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
      const rejection = world.paused || world.mode !== null ? 'Ordinary dispatch requires playing command mode'
        : expectedIds && JSON.stringify(world.selected) !== JSON.stringify(expectedIds)
        ? 'Selected recipients changed before dispatch'
        : command === 8 && (!diagnostics.selectedUnits.length || diagnostics.selectedUnits.some(unit =>
            unit.team !== 'blue' || unit.kind !== 'brave' || !(unit.hp > 0)))
          ? 'Housing requires the intended living all-Brave cohort before input'
          : window.mission1VaultDispatch ? 'A dispatch observer is already armed'
        : hit.collection && !interior ? 'Rendered target became stale before dispatch'
          : !point || (!hit.collection && (!pick.canvasOwned || pick.hitId !== null ||
              Math.hypot(point.x - hit.point.x, point.z - hit.point.z) > 0.05))
            ? 'Ground target became stale before dispatch'
            : !context.enabled || context.model !== command ? 'Fresh dispatch context rejected' : null
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
            order: person ? structuredClone(currentPersonOrder(world.buildingOrders, person)) : null }
        }) })
      const delivery = observeEntityPointer(scene, document, hit.collection ? hit : null)
      const record = { before: sample(), context, point, after: null, errors: [] }
      const after = () => { try { record.after = sample() } catch (error) { record.errors.push(String(error)) } }
      canvas.addEventListener('pointerup', after)
      window.mission1VaultDispatch = { finish() {
        canvas.removeEventListener('pointerup', after)
        return { ...record, delivered: delivery.finish() }
      } }
      return { rejection: null, diagnostics }
    }, { hit, command, expectedIds })
    report.actions.push({ label: 'final-dispatch-preflight', command, hit, preflight }); save()
    assert.equal(preflight.rejection, null, JSON.stringify(preflight))
    let evidence
    try { await action(`command-${command}-click`, () => page.mouse.click(hit.x, hit.y)) }
    finally {
      evidence = await page.evaluate(() => { const observer = window.mission1VaultDispatch; delete window.mission1VaultDispatch; return observer?.finish() })
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
    const recipients = after.units.filter(unit => unit.hp > 0 && (command === 8 ? unit.work === hit.id : command === 33 ? unit.work === hit.id && unit.vaultTask?.head === hit.id && unit.vaultTask.phase >= 1 :
      unit.order?.model === command && !(unit.order.flags & 1) && (command !== 27 || unit.order.a === hit.id)))
    assert.ok(recipients.length > 0, 'The actual command must reach a selected recipient')
    assert.deepEqual(recipients.map(unit => unit.id), expectedIds ?? before.selected)
    return evidence
  }
  const castInput = async (hit, spell) => {
    const preflight = await page.evaluate(async ({ hit, spell, actorId }) => {
      const [{ spellTargetError }, { inspectEntityPoint }] = await Promise.all([import('/app/live-command.ts'), import('/qa/erosion-ordinary/input.mjs')])
      const scene = window.testSceneRef.current, world = scene.world, canvas = scene.renderer.domElement
      const point = hit.point ?? hit.spellPreflight.point
      const pick = inspectEntityPoint(scene, hit.collection ?? 'buildings', hit)
      const actual = scene.pick({ clientX: hit.x, clientY: hit.y })
      const rejection = JSON.stringify(world.selected) !== JSON.stringify([actorId]) ? 'Original Shaman must own spell input' : !pick.canvasOwned || !actual || Math.hypot(actual.x - point.x, actual.z - point.z) > 0.05 ||
        (hit.collection && pick.hitId !== hit.id) ? 'Spell target changed before actual input' : spellTargetError(structuredClone(world), spell, point)
      const preflight = { turn: world.turn, point, spell, mode: world.mode, paused: world.paused,
        actorId, stock: world.shots[spell], pick, actual, rejection }
      if (rejection || world.paused || world.mode !== spell || world.shots[spell] <= 0) return preflight
      if (window.mission1VaultCastInput) throw new Error('A cast observation is already armed')
      const record = { before: [], after: [], errors: [] }
      const sample = event => ({ turn: world.turn, stock: world.shots[spell], gifts: world.giftCounts[spell],
        mode: world.mode, trusted: event.isTrusted, button: event.button, canvasTarget: event.target === canvas,
        worldMatches: scene.world === world && window.testStore.getWorld() === world,
        caster: world.units.find(unit => unit.id === actorId)?.id ?? null,
        projectiles: world.projectiles.filter(p => p.spell === spell).map(p => ({ id: p.id, caster: p.caster })),
        effects: world.effects.map(e => e.id) })
      const observe = (phase, event) => {
        try { record[phase].push(sample(event)) }
        catch (error) { if (record.errors.length < 8) record.errors.push(String(error?.stack ?? error)) }
      }
      const before = event => observe('before', event), after = event => observe('after', event)
      canvas.addEventListener('pointerup', before, true); canvas.addEventListener('pointerup', after)
      window.mission1VaultCastInput = { finish() {
        canvas.removeEventListener('pointerup', before, true); canvas.removeEventListener('pointerup', after)
        return record
      } }
      return preflight
    }, { hit, spell, actorId: originalShamanId })
    report.actions.push({ label: 'actual-cast-preflight', preflight }); save()
    assert.equal(preflight.rejection, null); assert.equal(preflight.paused, false)
    assert.equal(preflight.mode, spell); assert.ok(preflight.stock > 0)
    let delivered
    try { await action(`${spell}-target-click`, () => page.mouse.click(hit.x, hit.y)) }
    finally {
      delivered = await page.evaluate(() => { const observer = window.mission1VaultCastInput; delete window.mission1VaultCastInput; return observer?.finish() })
      report.actions.push({ label: 'actual-cast-stock', spell, delivered }); save()
    }
    assert.deepEqual(delivered.errors, [])
    assert.equal(delivered.before.length, 1); assert.equal(delivered.after.length, 1)
    const before = delivered.before[0], after = delivered.after[0]
    assert.ok([before, after].every(row => row.trusted && row.button === 0 && row.canvasTarget && row.worldMatches && row.caster === originalShamanId))
    assert.equal(after.turn, before.turn)
    assert.equal(after.stock, before.stock - 1, 'One real handler must spend one immediately observed earned shot')
    assert.equal(after.mode, null)
    return { preflight, before, after }
  }
  const clickEntity = async (collection, id, command, cast = false, expectedIds = null) => {
    if (!cast) await prepareDispatch()
    const hit = await entityPoint(collection, id, command, cast)
    report.actions.push({ label: 'rendered-target', hit }); save()
    assert.equal(hit.rejection, null, JSON.stringify(hit.diagnostics))
    if (cast) {
      assert.equal(hit.spellPreflight.rejection, null, JSON.stringify(hit.spellPreflight))
      assert.ok(hit.spellPreflight.shots > 0)
      return castInput(hit, cast)
    } else return dispatch(hit, command, expectedIds)
  }
  const fixedGround = (target, spell = null, cellMove = false) => page.evaluate(async ({ target, spell, actorId, cellMove }) => {
    const [{ createMoveContextProbe, entityInputState }, { spellTargetError }, { spellRange }, { nativePosition }, { positionDistance }] = await Promise.all([
      import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts'), import('/app/spell-casting.ts'),
      import('/app/world-terrain-runtime.ts'), import('/app/native-math.ts')])
    const scene = window.testSceneRef.current, world = scene.world, rect = scene.renderer.domElement.getBoundingClientRect()
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
        : Math.hypot(point.x - target.x, point.z - target.z) > 0.35) {
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
  }, { target, spell, actorId: originalShamanId, cellMove })
  const farBankGround = async target => {
    let hit
    // Reuse ordinary-shared-training's owned right-drag corridor. Two finite
    // camera adjustments can expose this same destination cell; never drift it.
    for (let attempt = 0; attempt < 3; attempt++) {
      await prepareDispatch()
      hit = await fixedGround(target, null, true)
      report.actions.push({ label: 'far-bank-ground-probe', attempt, hit }); save()
      if (hit.rejection === null || attempt === 2) return hit
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
      report.actions.push({ label: 'far-bank-camera-corridor', attempt, corridor }); save()
      if (!corridor) return hit
      await action('far-bank-ordinary-camera-rotation', async () => {
        await page.mouse.move(corridor.x, corridor.y); await page.mouse.down({ button: 'right' })
        try { await page.mouse.move(corridor.endX, corridor.y, { steps: 12 }) }
        finally { await page.mouse.up({ button: 'right' }) }
        await page.mouse.move(400, 780)
      })
      await settle()
    }
    return hit
  }
  return { action, button, pause, resume, settle, view, prepareDispatch, entityPoint, dispatch, castInput, fixedGround, farBankGround, clickEntity }
}
