// Unrun ordinary Mission1 adaptation of the existing smoke/worship input checks.
// The maintained local-render harness owns browser, profile, server and cleanup.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'

export default async function hutSmokeIgnition({ page, openMission, output, signal, receipt }) {
  const report = { status: 'running', actions: [], screenshots: [] }
  let armed = false, originalShamanId = null
  const save = () => writeFileSync(resolve(output, 'hut-smoke-ignition.json'), JSON.stringify(report, null, 2) + '\n')
  const action = async (label, run) => {
    signal.throwIfAborted()
    if (originalShamanId !== null) await page.evaluate(id => {
      const unit = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!unit || unit.hp <= 0) throw Error('Original Shaman was lost; stop the ordinary route')
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
  const read = () => page.evaluate(() => {
    const scene = window.testSceneRef.current, world = scene.world
    if (window.testStore.getWorld() !== world || world.outcome.level !== 1) throw Error('Mission1 scene/store mismatch')
    const head = world.shrines.find(shrine => shrine.reward === 'lightning')
    const bridgeHead = world.shrines.find(shrine => shrine.reward === 'bridge')
    const shaman = world.units.find(unit => unit.kind === 'shaman' && unit.team === 'blue')
    return { turn: world.turn, speed: world.speed, paused: world.paused, status: world.status,
      shots: world.shots.lightning, giftCount: world.giftCounts.lightning,
      bridgeShots: world.shots.bridge, bridgeGifts: world.giftCounts.bridge, bridges: world.stats.bridges,
      bridgeEffects: world.effects.filter(effect => effect.bridge).map(effect => ({ id: effect.id, turn: effect.bridge.turn })),
      bridgeProjectiles: world.projectiles.filter(projectile => projectile.spell === 'bridge').map(projectile => ({ id: projectile.id, caster: projectile.caster, phase: projectile.phase })),
      bridgeHead: bridgeHead && { id: bridgeHead.id, x: bridgeHead.x, z: bridgeHead.z, uses: bridgeHead.uses },
      selected: [...world.selected], mode: world.mode,
      head: head && { id: head.id, x: head.x, z: head.z, uses: head.uses, required: head.required },
      shaman: shaman && { id: shaman.id, x: shaman.x, z: shaman.z, hp: shaman.hp, inside: shaman.inside },
      huts: world.buildings.filter(building => building.team === 'blue' && building.kind === 'hut')
        .map(hut => ({ id: hut.id, x: hut.x, z: hut.z, progress: hut.progress, hp: hut.hp,
          burning: !!hut.burn, level: hut.level,
          residents: world.units.filter(unit => unit.inside === hut.id && unit.hp > 0).map(unit => unit.id) })) }
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
    async ({ collection, id, expectedCommand, cast }) => {
      const [{ findEntityInput, inspectEntityPoint, createMoveContextProbe, entityInputState }, { spellTargetError }] =
        await Promise.all([import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts')])
      const scene = window.testSceneRef.current, world = scene.world
      const target = world[collection].find(object => object.id === id)
      if (!target) return { id, collection, rejection: 'Ordinary target disappeared',
        diagnostics: { turn: world.turn, camera: { ...scene.cameraPosition }, selected: [...world.selected] } }
      const context = expectedCommand === null ? null : createMoveContextProbe(world)(target)
      const rect = scene.renderer.domElement.getBoundingClientRect(), projected = scene.screen(target)
      const center = { x: rect.left + (projected.x + 1) * rect.width / 2,
        y: rect.top + (1 - projected.y) * rect.height / 2 }, candidates = []
      const mesh = collection === 'shrines' ? scene.shrineMeshes.get(id)?.g : scene.buildingMeshes.get(id)
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
      const hit = findEntityInput(candidates, id, point => {
        const sample = inspectEntityPoint(scene, collection, point)
        if (cast && sample.hitId === id) {
          const ground = scene.pick({ clientX: point.x, clientY: point.y })
          const x = ground && Math.round((ground.x + 8) * 256) & 65535
          const y = ground && Math.round((-ground.z - 8) * 256) & 65535
          if (!ground || (world.land.buildingIds[(y >> 9) * 128 + (x >> 9)] & 1023) !== id)
            return { ...sample, hitId: null }
        }
        return sample
      })
      const diagnostics = { state: entityInputState(scene, { id, collection }, hit ?? center), context,
        pick: inspectEntityPoint(scene, collection, hit ?? center), selected: [...world.selected] }
      const rejection = expectedCommand !== null && (!context.enabled || context.model !== expectedCommand)
        ? 'Ordinary command context changed' : !hit ? 'No current rendered target interior with the required terrain cell' : null
      const ground = cast && hit ? scene.pick({ clientX: hit.x, clientY: hit.y }) : null
      const spellPreflight = cast && ground ? { point: ground, selected: [...world.selected],
        shots: world.shots.lightning, turn: world.turn,
        rejection: spellTargetError(structuredClone(world), 'lightning', ground) } : null
      return { ...hit, id, collection, turn: world.turn, expectedCommand, cast, spellPreflight, diagnostics,
        rejection: rejection ?? (cast && !ground ? 'Lightning ground pick disappeared' : null) }
    }, { collection, id, expectedCommand, cast })
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
      const rejection = expectedIds && JSON.stringify(world.selected) !== JSON.stringify(expectedIds)
        ? 'Selected recipients changed before dispatch'
        : command === 8 && (!diagnostics.selectedUnits.length || diagnostics.selectedUnits.some(unit =>
            unit.team !== 'blue' || unit.kind !== 'brave' || !(unit.hp > 0)))
          ? 'Housing requires the intended living all-Brave cohort before input'
          : window.hutDispatch ? 'A dispatch observer is already armed'
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
            order: person ? structuredClone(currentPersonOrder(world.buildingOrders, person)) : null }
        }) })
      const delivery = observeEntityPointer(scene, document, hit.collection ? hit : null)
      const record = { before: sample(), context, point, after: null, errors: [] }
      const after = () => { try { record.after = sample() } catch (error) { record.errors.push(String(error)) } }
      canvas.addEventListener('pointerup', after)
      window.hutDispatch = { finish() {
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
      evidence = await page.evaluate(() => { const observer = window.hutDispatch; delete window.hutDispatch; return observer?.finish() })
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
    const recipients = after.units.filter(unit => unit.hp > 0 && (command === 8 ? unit.work === hit.id :
      unit.order?.model === command && !(unit.order.flags & 1) && (command !== 27 || unit.order.a === hit.id)))
    assert.ok(recipients.length > 0, 'The actual command must reach a selected recipient')
    assert.deepEqual(recipients.map(unit => unit.id), expectedIds ?? before.selected)
  }
  const castInput = async (hit, spell) => {
    const preflight = await page.evaluate(async ({ hit, spell, actorId }) => {
      const { spellTargetError } = await import('/app/live-command.ts')
      const scene = window.testSceneRef.current, world = scene.world, canvas = scene.renderer.domElement
      const point = hit.point ?? hit.spellPreflight.point
      const rejection = spellTargetError(structuredClone(world), spell, point)
      const preflight = { turn: world.turn, point, spell, mode: world.mode, paused: world.paused,
        actorId, stock: world.shots[spell], rejection }
      if (rejection || world.paused || world.mode !== spell || world.shots[spell] <= 0) return preflight
      if (window.hutCastInput) throw Error('A cast observation is already armed')
      const record = { before: [], after: [], errors: [] }
      const sample = event => ({ turn: world.turn, stock: world.shots[spell], gifts: world.giftCounts[spell],
        mode: world.mode, trusted: event.isTrusted, button: event.button, canvasTarget: event.target === canvas,
        worldMatches: scene.world === world && window.testStore.getWorld() === world,
        caster: world.units.find(unit => unit.id === actorId)?.id ?? null })
      const observe = (phase, event) => {
        try { record[phase].push(sample(event)) }
        catch (error) { if (record.errors.length < 8) record.errors.push(String(error?.stack ?? error)) }
      }
      const before = event => observe('before', event), after = event => observe('after', event)
      canvas.addEventListener('pointerup', before, true); canvas.addEventListener('pointerup', after)
      window.hutCastInput = { finish() {
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
      delivered = await page.evaluate(() => { const observer = window.hutCastInput; delete window.hutCastInput; return observer?.finish() })
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
      report.lightningCast = await castInput(hit, 'lightning'); save()
    } else await dispatch(hit, command, expectedIds)
  }
  const groundNear = hut => page.evaluate(async hut => {
    const scene = window.testSceneRef.current
    const { createMoveContextProbe } = await import('/qa/erosion-ordinary/input.mjs')
    const probe = createMoveContextProbe(scene.world), rect = scene.renderer.domElement.getBoundingClientRect()
    const projected = scene.screen(hut), cx = rect.left + (projected.x + 1) * rect.width / 2
    const cy = rect.top + (1 - projected.y) * rect.height / 2
    for (let dy = 20; dy <= 180; dy += 8) for (let dx = -180; dx <= 180; dx += 8) {
      const event = { clientX: cx + dx, clientY: cy + dy }
      if (document.elementFromPoint(event.clientX, event.clientY) !== scene.renderer.domElement ||
          scene.picking.pickPerson(event) || scene.pickWorldObject(event)) continue
      const point = scene.pick(event)
      if (!point || Math.hypot(point.x - hut.x, point.z - hut.z) > 12) continue
      const context = probe(point)
      if (context.model === 3 && context.enabled) return { x: event.clientX, y: event.clientY, point }
    }
    return null
  }, hut)
  const worshipRoute = (label, shrineId) => page.evaluate(async ({ label, shrineId, actorId }) => {
    const [{ planLivePath }, { worshipHeadPose }, { worshipApproach }, { browserPosition },
      { syncNativeTerrain, syncLandscapeObjects }, { canOrder }, { combatPerson }, { acceptsPersonOrder }] = await Promise.all([
      import('/app/live-pathfinding.ts'), import('/app/live-worship.ts'), import('/app/worship.ts'),
      import('/app/world-coordinates.ts'), import('/app/world-terrain-runtime.ts'), import('/app/selection-runtime.ts'),
      import('/app/live-combat.ts'), import('/app/person-orders.ts')])
    const source = window.testSceneRef.current.world, copy = structuredClone(source)
    const actor = copy.units.find(unit => unit.id === actorId), shrine = copy.shrines.find(head => head.id === shrineId)
    if (!actor || actor.hp <= 0 || !shrine) throw Error('Original worship actor or target was lost')
    syncNativeTerrain(copy); syncLandscapeObjects(copy)
    const person = combatPerson(actor), goal = browserPosition(worshipApproach(worshipHeadPose(copy, shrine)))
    const path = planLivePath(copy, actor, goal)
    return { label, turn: source.turn, actor: { id: actor.id, kind: actor.kind, x: actor.x, z: actor.z },
      shrine: { id: shrine.id, mode: shrine.mode, x: shrine.x, z: shrine.z }, goal,
      eligibility: { canOrder: canOrder(actor), accepts27: acceptsPersonOrder(person, 27), model: person.model, flags4: person.flags4 },
      routeFound: path !== null, nativeRoute: path && { x: path.x, y: path.y, motionGroup: path.motionGroup, motionIndex: path.motionIndex } }
  }, { label, shrineId, actorId: originalShamanId })
  const fixedGround = (target, spell = null) => page.evaluate(async ({ target, spell, actorId }) => {
    const [{ createMoveContextProbe, entityInputState }, { spellTargetError }, { spellRange }, { nativePosition }, { positionDistance }] = await Promise.all([
      import('/qa/erosion-ordinary/input.mjs'), import('/app/live-command.ts'), import('/app/spell-casting.ts'),
      import('/app/world-terrain-runtime.ts'), import('/app/native-math.ts')])
    const scene = window.testSceneRef.current, world = scene.world, rect = scene.renderer.domElement.getBoundingClientRect()
    const projected = scene.screen(target), center = { x: rect.left + (projected.x + 1) * rect.width / 2,
      y: rect.top + (1 - projected.y) * rect.height / 2 }, candidates = []
    const snap = point => ({ x: Math.floor(point.x / 2) * 2 + 1, z: -Math.floor(-point.z / 2) * 2 - 1 })
    const wanted = snap(target), probe = createMoveContextProbe(world), rejected = []
    const spellWorld = spell ? structuredClone(world) : null
    const actor = spellWorld?.units.find(unit => unit.id === actorId)
    const caster = actor ? { id: actor.id, x: actor.x, z: actor.z, hp: actor.hp, inside: actor.inside,
      native: nativePosition(spellWorld, actor), range: spellRange(spellWorld, actor, 12) * 256,
      paused: world.paused, turn: world.turn } : null
    const minimumMargin = 128 // A half-world-unit witness margin; the shipped spell range is unchanged.
    if (spell && (!actor || actor.hp <= 0)) return { target, rejection: 'Original Shaman is unavailable', caster, rejected }
    for (let dy = -180; dy <= 180; dy += 4) for (let dx = -180; dx <= 180; dx += 4) candidates.push({ dx, dy })
    candidates.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
    for (const offset of candidates) {
      const hit = { x: Math.round(center.x + offset.dx), y: Math.round(center.y + offset.dy) }
      const event = { clientX: hit.x, clientY: hit.y }
      if (document.elementFromPoint(hit.x, hit.y) !== scene.renderer.domElement) continue
      if (!spell && (scene.pickUnit(event) || scene.picking.pickPerson(event) || scene.pickWorldObject(event))) continue
      const point = scene.pick(event)
      if (!point) continue
      const snapped = snap(point)
      if (spell ? snapped.x !== wanted.x || snapped.z !== wanted.z : Math.hypot(point.x - target.x, point.z - target.z) > 0.35) continue
      const context = spell ? null : probe(point)
      const rejection = spell ? spellTargetError(spellWorld, spell, point)
        : context.model !== 3 || !context.enabled ? 'Ground command context rejected' : null
      const nativeTarget = spell ? nativePosition(spellWorld, point) : null
      const distance = spell ? positionDistance(caster.native, nativeTarget) : null
      const margin = spell ? caster.range - distance : null
      if (spell && (rejection || margin < minimumMargin)) {
        rejected.push({ ...hit, point, nativeTarget, rejection, distance, margin }); continue
      }
      return { ...hit, point, target, snapped, context, rejection, caster, nativeTarget, distance, margin, minimumMargin, rejected,
        diagnostics: entityInputState(scene, null, hit), turn: world.turn }
    }
    return { target, rejection: 'No owned rendered point in the required native cell meets the shipped predicate and range margin',
      caster, minimumMargin, rejected, diagnostics: entityInputState(scene, null, center) }
  }, { target, spell, actorId: originalShamanId })
  const retainFrames = async () => {
    if (!armed) return
    const observed = await page.evaluate(() => window.hutIgnitionFrames.read())
    for (const [label, frame] of Object.entries(observed.frames)) {
      const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
      assert.ok(match, 'Actual-render readback must be a PNG')
      const name = `hut-smoke-${label}.png`
      writeFileSync(resolve(output, name), Buffer.from(match[1], 'base64'))
      frame.png = name
    }
    report.observation = observed; save()
    return observed
  }
  try {
    await openMission(1)
    report.startup = await waitForShamanReadiness(page, { timeout: 60000 })
    await resume()
    report.renderer = await page.evaluate(() => {
      const renderer = window.testSceneRef.current.renderer, gl = renderer.getContext()
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { webglVersion: gl.getParameter(gl.VERSION),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        contextLost: gl.isContextLost(), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
    })
    assert.equal(report.renderer.contextLost, false)
    report.initial = await read(); save()
    assert.equal(report.initial.speed, 1)
    assert.equal(report.initial.shots, 0)
    assert.ok(report.initial.head && report.initial.shaman)
    assert.equal(report.initial.head.required, 1)
    const shamanId = report.initial.shaman.id, headId = report.initial.head.id
    originalShamanId = shamanId
    assert.ok(report.initial.bridgeHead)
    report.initialRoutes = [await worshipRoute('opening-Lightning', headId),
      await worshipRoute('opening-Land-Bridge', report.initial.bridgeHead.id)]; save()
    assert.equal(report.initialRoutes[0].routeFound, false)
    assert.ok(report.initialRoutes[1].eligibility.canOrder && report.initialRoutes[1].eligibility.accepts27 && report.initialRoutes[1].routeFound)
    await button('Select and focus shaman')
    await view(report.initial.bridgeHead)
    await clickEntity('shrines', report.initial.bridgeHead.id, 27, false, [shamanId])
    await page.waitForFunction(({ headId, actorId }) => {
      const world = window.testSceneRef.current.world, actor = world.units.find(unit => unit.id === actorId)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during Bridge worship')
      return world.shots.bridge > 0 && world.shrines.find(head => head.id === headId)?.uses > 0
    }, { headId: report.initial.bridgeHead.id, actorId: shamanId }, { timeout: 180000 })
    report.bridgeReward = await read(); save()
    assert.ok(report.bridgeReward.bridgeGifts > report.initial.bridgeGifts)
    await button('Select and focus shaman')
    const shoreDestination = { x: 0.5, z: 19 } // Interior of the already demonstrated native shore cell.
    await view(shoreDestination)
    await prepareDispatch()
    const shore = await fixedGround(shoreDestination)
    report.shoreInput = shore; save(); assert.equal(shore.rejection, null)
    await dispatch(shore, 3, [shamanId])
    await page.waitForFunction(({ id, point }) => {
      const actor = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost before the shore')
      const person = actor.builder?.person ?? actor.flight ?? actor.fight?.motion ?? actor.native ?? actor.entry?.person
      return actor.inside === null && !actor.path.length && person && Number.isFinite(person.speed) && person.speed === 0 &&
        Math.hypot(actor.x - point.x, actor.z - point.z) < 0.35
    }, { id: shamanId, point: shore.point }, { timeout: 180000 })
    await pause()
    report.shoreArrival = await read(); save()
    // One ordinary camera offset keeps the fixed Bridge target outside the central Pause badge.
    await view({ x: 0, z: 12 }) // Actual cast target remains (0,4); ownership checks stay strict.
    await action('select-earned-Land-Bridge', () => page.keyboard.press('2'))
    assert.equal((await read()).mode, 'bridge')
    const bridgePoint = await fixedGround({ x: 0, z: 4 }, 'bridge')
    report.bridgeInput = bridgePoint; save(); assert.equal(bridgePoint.rejection, null)
    assert.equal(bridgePoint.caster.paused, true)
    assert.ok(bridgePoint.margin >= bridgePoint.minimumMargin)
    await resume()
    const bridgeBefore = await read()
    const bridgeDelivery = await castInput(bridgePoint, 'bridge')
    const bridgeAfter = await read()
    report.bridgeCast = { before: bridgeBefore, after: bridgeAfter, delivered: bridgeDelivery }; save()
    assert.ok(bridgeAfter.bridgeProjectiles.some(projectile => projectile.caster === shamanId &&
      !bridgeBefore.bridgeProjectiles.some(prior => prior.id === projectile.id)) || bridgeAfter.bridges > bridgeBefore.bridges)
    await page.waitForFunction(({ actorId, before }) => {
      const world = window.testSceneRef.current.world, actor = world.units.find(unit => unit.id === actorId)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost while the Bridge completed')
      return world.stats.bridges > before && !world.effects.some(effect => effect.bridge) &&
        !world.projectiles.some(projectile => projectile.spell === 'bridge')
    }, { actorId: shamanId, before: bridgeBefore.bridges }, { timeout: 60000 })
    report.completedBridge = await read()
    report.lightningRouteAfterBridge = await worshipRoute('completed-Bridge-to-Lightning', headId); save()
    assert.equal(report.lightningRouteAfterBridge.routeFound, true)
    await button('Select and focus shaman')
    await view(report.initial.head)
    await clickEntity('shrines', headId, 27, false, [shamanId])
    await page.waitForFunction(({ headId, actorId }) => {
      const world = window.testSceneRef.current.world, actor = world.units.find(unit => unit.id === actorId)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during Lightning worship')
      return world.shots.lightning > 0 && world.shrines.find(head => head.id === headId)?.uses > 0
    }, { headId, actorId: shamanId }, { timeout: 180000 })
    report.reward = await read(); save()
    assert.equal(report.reward.shaman.id, shamanId)
    assert.ok(report.reward.giftCount > report.initial.giftCount)
    const hut = report.reward.huts.find(hut => hut.progress === 1 && hut.hp > 0 && !hut.burning)
    assert.ok(hut, 'No completed authored Blue hut after actual reward acquisition')
    report.hut = hut; save()
    await button('Select and focus shaman')
    await view(hut)
    await prepareDispatch()
    const ground = await groundNear(hut)
    assert.ok(ground, 'No ordinary movement target near the authored hut')
    await dispatch(ground, 3, [shamanId])
    await page.waitForFunction(({ id, point }) => {
      const unit = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!unit || unit.hp <= 0) throw Error('Original Shaman was lost on the return route')
      return unit.inside === null && Math.hypot(unit.x - point.x, unit.z - point.z) < 2
    }, { id: shamanId, point: ground.point }, { timeout: 180000 })
    assert.equal((await read()).mode, null, 'Ground dispatch must finish before changing the cohort')
    await action('clear-Shaman-selection-before-Braves', () => page.keyboard.press('Escape'))
    report.clearedSelection = await read(); save()
    assert.deepEqual(report.clearedSelection.selected, [])
    assert.equal(report.clearedSelection.mode, null)
    await action('Select-Braves-through-roster', () => page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Shift'] }))
    report.housingCohort = await page.evaluate(() => {
      const world = window.testSceneRef.current.world
      return world.selected.map(id => { const unit = world.units.find(unit => unit.id === id)
        return { id, kind: unit?.kind, team: unit?.team, hp: unit?.hp } })
    }); save()
    assert.ok(report.housingCohort.length > 0 && report.housingCohort.every(unit =>
      unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0))
    await view(hut)
    await clickEntity('buildings', hut.id, 8, false, report.housingCohort.map(unit => unit.id))
    await page.waitForFunction(({ id, actorId }) => {
      const scene = window.testSceneRef.current, world = scene.world
      const actor = world.units.find(unit => unit.id === actorId)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during housing')
      const hut = world.buildings.find(building => building.id === id)
      return hut?.progress === 1 && !hut.burn &&
        world.secondaryEffects.roots[id]?.state.root?.mode === 'full' &&
        scene.buildingMeshes.get(id)?.userData.hutOccupancySmoke?.group.visible
    }, { id: hut.id, actorId: shamanId }, { timeout: 180000 })
    await pause()
    await button('Select and focus shaman')
    await view(hut)
    report.beforeLightningSelection = await read(); save()
    assert.deepEqual(report.beforeLightningSelection.selected, [shamanId])
    assert.equal(report.beforeLightningSelection.mode, null)
    assert.equal(report.beforeLightningSelection.shaman.inside, null)
    await page.evaluate(async id => {
      if (window.hutIgnitionFrames) throw Error('Ignition observer already exists')
      const { observeHutIgnitionFrames } = await import('/scripts/local-render/hut-smoke-ignition-observer.mjs')
      window.hutIgnitionFrames = observeHutIgnitionFrames(window.testSceneRef.current, id)
    }, hut.id)
    armed = true
    await page.waitForFunction(id => {
      const actor = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during the ignition witness')
      const state = window.hutIgnitionFrames.status()
      return state.before || state.errors.length
    }, shamanId)
    assert.deepEqual(await page.evaluate(() => window.hutIgnitionFrames.status().errors), [])
    await action('select-earned-Lightning', () => page.keyboard.press('3'))
    assert.equal((await read()).mode, 'lightning')
    await resume()
    await clickEntity('buildings', hut.id, null, true)
    await page.waitForFunction(id => {
      const actor = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during the ignition witness')
      const state = window.hutIgnitionFrames.status()
      return state.burning || state.errors.length
    }, shamanId, { timeout: 180000 })
    await pause() // Ordinary control; first actual frame has already been retained.
    let observed = await retainFrames()
    assert.deepEqual(observed.errors, [])
    const before = observed.frames.before.sample, burning = observed.frames.burning.sample
    assert.equal(before.rootVisible, true)
    assert.equal(before.rootRecord.state.root.mode, 'full')
    assert.equal(burning.hut.state, 4)
    assert.equal(burning.hut.progress, 1)
    assert.ok(burning.hut.timer > 119, 'The first actual burning render missed the occupied interval; retain a capture gap')
    assert.deepEqual(burning.residents, before.residents)
    assert.deepEqual(burning.admissionSlots, before.admissionSlots)
    assert.equal(burning.roots.length, 0)
    assert.equal(burning.rootVisible, false)
    assert.equal(report.lightningCast.after.stock, report.lightningCast.before.stock - 1)
    await page.screenshot({ path: resolve(output, 'hut-smoke-paused-after-ignition.png') })
    report.screenshots.push('hut-smoke-paused-after-ignition.png')
    await resume()
    await page.waitForFunction(id => {
      const actor = window.testSceneRef.current.world.units.find(unit => unit.id === id)
      if (!actor || actor.hp <= 0) throw Error('Original Shaman was lost during the ignition witness')
      const state = window.hutIgnitionFrames.status()
      return state.evacuated || state.errors.length
    }, shamanId)
    await pause()
    observed = await retainFrames()
    assert.deepEqual(observed.errors, [])
    assert.equal(observed.frames.evacuated.sample.roots.length, 0)
    assert.deepEqual(observed.frames.evacuated.sample.residents, [])
    assert.ok(observed.records.every(row => row.speed === 1))
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'
    report.limits = 'Ordinary Mission1 reward, admission, cast and actual browser frames; no full-game/native raster or hardware performance claim.'
    save()
    return report
  } catch (error) {
    report.status = 'failed'; report.error = String(error?.stack ?? error)
    await retainFrames().catch(captureError => { report.captureError = String(captureError) })
    save()
    throw error
  } finally {
    if (armed) {
      await page.evaluate(() => { window.hutIgnitionFrames.close(); delete window.hutIgnitionFrames })
      report.observerRestored = true
      save()
    }
  }
}
