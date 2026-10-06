// Unrun ordinary Mission1 adaptation of the existing smoke/worship input checks.
// The maintained local-render harness owns browser, profile, server and cleanup.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'

export default async function hutSmokeIgnition({ page, openMission, output, signal, receipt }) {
  const report = { status: 'running', actions: [], screenshots: [] }
  let armed = false
  const save = () => writeFileSync(resolve(output, 'hut-smoke-ignition.json'), JSON.stringify(report, null, 2) + '\n')
  const action = async (label, run) => {
    signal.throwIfAborted()
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
    const shaman = world.units.find(unit => unit.kind === 'shaman' && unit.team === 'blue')
    return { turn: world.turn, speed: world.speed, paused: world.paused, status: world.status,
      shots: world.shots.lightning, giftCount: world.giftCounts.lightning,
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
    const preflight = await page.evaluate(async ({ hit, command }) => {
      const [{ currentPersonOrder }, { findEntityInput, inspectEntityPoint, createMoveContextProbe, observeEntityPointer, entityInputState }] =
        await Promise.all([import('/app/person-orders.ts'), import('/qa/erosion-ordinary/input.mjs')])
      const scene = window.testSceneRef.current, world = scene.world, canvas = scene.renderer.domElement
      const point = hit.collection ? world[hit.collection].find(object => object.id === hit.id) :
        scene.pick({ clientX: hit.x, clientY: hit.y })
      const context = point ? createMoveContextProbe(world)(point) : null
      const pick = inspectEntityPoint(scene, hit.collection ?? 'buildings', hit)
      const interior = hit.collection ? findEntityInput([hit], hit.id, p => inspectEntityPoint(scene, hit.collection, p)) : null
      const diagnostics = { state: entityInputState(scene, hit.collection ? hit : null, hit), pick, interior, context,
        point: point && { id: point.id ?? null, x: point.x, z: point.z }, selected: [...world.selected], lastOrderTurn: world.lastOrderTurn }
      const rejection = window.hutDispatch ? 'A dispatch observer is already armed'
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
    }, { hit, command })
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
  const clickEntity = async (collection, id, command, cast = false, expectedIds = null) => {
    if (!cast) await prepareDispatch()
    const hit = await entityPoint(collection, id, command, cast)
    report.actions.push({ label: 'rendered-target', hit }); save()
    assert.equal(hit.rejection, null, JSON.stringify(hit.diagnostics))
    if (cast) {
      assert.equal(hit.spellPreflight.rejection, null, JSON.stringify(hit.spellPreflight))
      assert.ok(hit.spellPreflight.shots > 0)
      await action('Lightning-target-click', () => page.mouse.click(hit.x, hit.y))
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
    await button('Select and focus shaman')
    await view(report.initial.head)
    await clickEntity('shrines', headId, 27, false, [shamanId])
    await page.waitForFunction(id => {
      const world = window.testSceneRef.current.world
      return world.shots.lightning > 0 && world.shrines.find(head => head.id === id)?.uses > 0
    }, headId, { timeout: 180000 })
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
      return unit?.hp > 0 && unit.inside === null && Math.hypot(unit.x - point.x, unit.z - point.z) < 2
    }, { id: shamanId, point: ground.point }, { timeout: 180000 })
    await action('Select-Braves-through-roster', () => page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Shift'] }))
    await view(hut)
    await clickEntity('buildings', hut.id, 8)
    await page.waitForFunction(id => {
      const scene = window.testSceneRef.current, world = scene.world
      const hut = world.buildings.find(building => building.id === id)
      return hut?.progress === 1 && !hut.burn &&
        world.secondaryEffects.roots[id]?.state.root?.mode === 'full' &&
        scene.buildingMeshes.get(id)?.userData.hutOccupancySmoke?.group.visible
    }, hut.id, { timeout: 180000 })
    await pause()
    await button('Select and focus shaman')
    await view(hut)
    await page.evaluate(async id => {
      if (window.hutIgnitionFrames) throw Error('Ignition observer already exists')
      const { observeHutIgnitionFrames } = await import('/scripts/local-render/hut-smoke-ignition-observer.mjs')
      window.hutIgnitionFrames = observeHutIgnitionFrames(window.testSceneRef.current, id)
    }, hut.id)
    armed = true
    await page.waitForFunction(() => {
      const state = window.hutIgnitionFrames.status()
      return state.before || state.errors.length
    })
    assert.deepEqual(await page.evaluate(() => window.hutIgnitionFrames.status().errors), [])
    await action('select-earned-Lightning', () => page.keyboard.press('3'))
    assert.equal((await read()).mode, 'lightning')
    await resume()
    await clickEntity('buildings', hut.id, null, true)
    await page.waitForFunction(() => {
      const state = window.hutIgnitionFrames.status()
      return state.burning || state.errors.length
    }, null, { timeout: 180000 })
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
    assert.ok((await read()).shots < report.reward.shots, 'The actual earned shot must be consumed')
    await page.screenshot({ path: resolve(output, 'hut-smoke-paused-after-ignition.png') })
    report.screenshots.push('hut-smoke-paused-after-ignition.png')
    await resume()
    await page.waitForFunction(() => {
      const state = window.hutIgnitionFrames.status()
      return state.evacuated || state.errors.length
    })
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
