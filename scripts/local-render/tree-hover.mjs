import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { authoredHoverTargets, hoverInput, hoverMinimapInput } from './tree-hover-input.mjs'
import { installTreeHoverWitness } from './tree-hover-witness.mjs'

export function assertTreeHoverEvidence(evidence) {
  assert.equal(evidence.closed, true); assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.phases.map(p => p.name),
    ['tree-live', 'tree-pan', 'tree-zoom', 'tree-return', 'tree-leave', 'building-live', 'building-leave'])
  const events = evidence.records.filter(r => r.kind === 'event')
  for (const phase of evidence.phases) {
    assert.ok(phase.done, `${phase.name} incomplete`)
    const renders = evidence.records.filter(r => r.kind === 'render' && r.phase === phase.name)
    assert.ok(renders.length)
    if (phase.kind === 'hover') {
      if (phase.name === 'building-live') { assert.equal(phase.singleFrame, true); assert.equal(phase.residues.length, 1) }
      else { assert.notEqual(phase.singleFrame, true); assert.deepEqual([...phase.residues].sort(), [0, 1, 2, 3]) }
      const event = events.find(row => row.phase === phase.name && row.type === 'pointermove' &&
        row.trusted && row.canvasTarget && row.canvasOwned && row.x === phase.point.x && row.y === phase.point.y)
      assert.ok(event, `${phase.name} lacks a matching trusted canvas pointermove`)
      assert.ok(renders.some(row => row.ordinal > event.ordinal &&
        (phase.name !== 'building-live' || row.ordinal === phase.hitOrdinal) && row.pointerUpdate?.picks.some(p =>
        p.id === phase.id && p.canvasOwned && p.receiverMatches &&
        p.sceneFrame !== phase.point.preparation.sceneFrame && p.rendererFrame >= phase.point.boundary.rendererFrame)),
      `${phase.name} lacks a post-event, post-preparation ordinary picker result`)

    }
    if (phase.kind === 'leave') {
      const event = phase.name === 'building-leave'
        ? events.find(row => row.ordinal === phase.leaveOrdinal && row.type === 'pointerleave' && row.trusted &&
          row.canvasTarget && !row.canvasOwned && row.ordinal > phase.afterHitOrdinal && phase.continuationOf === 'building-live')
        : events.find(row => row.phase === phase.name && row.type === 'pointerleave' && row.trusted && row.canvasTarget)
      assert.ok(event, `${phase.name} lacks a trusted canvas leave`)
      assert.ok(renders.some(row => row.ordinal > event.ordinal && row.state.hovered === null && row.state.pointer === null))
    }
    if (phase.kind === 'camera') {
      const event = evidence.records.find(row => row.ordinal === phase.inputOrdinal)
      assert.ok(event?.trusted && event.type === 'keydown' && event.defaultPrevented,
        `${phase.name} has no consumed trusted camera key`)
      assert.equal(event.key, phase.change === 'pan' ? 'w' : '-')
      if (phase.change === 'pan') assert.ok(event.afterState.keys.includes('w'))
      else assert.equal(event.afterState.camera.preset, 2)
      assert.ok(renders.some(row => row.ordinal > event.ordinal && row.pointerUpdate.picks.length &&
        row.state.pointer?.clientX === phase.point.x && row.state.pointer?.clientY === phase.point.y &&
        (phase.change === 'pan' ? JSON.stringify(row.state.camera.point) !== JSON.stringify(event.afterState.camera.point)
          : row.state.camera.preset === 2 && row.state.camera.transition === 0)), `${phase.name} lacks linked natural camera frame`)
    }
    for (const row of renders) {
      assert.ok(row.receiverMatches && row.state.rendererFrame > row.beforeRendererFrame, 'Unproved main render return')
      assert.ok(row.pointerUpdate?.receiverMatches, 'Actual pointer-update receiver changed')
      assert.equal(row.pointerUpdate.state.turn, row.state.turn)
      assert.deepEqual(row.pointerUpdate.state.pointer, row.state.pointer)
      for (const pick of row.pointerUpdate.picks) {
        assert.ok(!pick.threw && pick.receiverMatches && pick.canvasOwned)
        assert.equal(pick.x, row.state.pointer.clientX); assert.equal(pick.y, row.state.pointer.clientY)
        assert.equal(pick.id, row.state.hovered)
      }
      for (const [id, bodies] of Object.entries(row.bodies)) {
        assert.ok(bodies.length, `Rendered target ${id} disappeared`)
        for (const body of bodies) assert.equal(body.uniform,
          Number(id) === row.state.hovered ? (row.state.turn & 2 ? 255 : 200) : 0,
          `${phase.name} target ${id} turn ${row.state.turn} highlight`)
      }
    }
  }
  assert.deepEqual(events.filter(e => e.type === 'keydown' || e.type === 'keyup').map(e => [e.type, e.key]),
    [['keydown', 'w'], ['keyup', 'w'], ['keydown', '-'], ['keyup', '-'], ['keydown', '='], ['keyup', '=']])
  for (const event of events) {
    if (event.type === 'keydown') assert.equal(event.defaultPrevented, true)
    assert.ok(event.trusted && !event.repeat && event.after, 'Missing trusted synchronous input boundary')
    assert.deepEqual(event.after, event.before, `${event.type} changed selection/orders/RNG synchronously`)
  }
  for (const name of ['tree-live-200', 'tree-live-255', 'tree-pan', 'tree-zoom',
    'tree-return-200', 'tree-return-255', 'tree-leave', 'building-leave'])
    assert.ok(evidence.frames[name], `Natural PNG missing: ${name}`)
  const controlFrames = ['building-live-200', 'building-live-255'].filter(name => evidence.frames[name])
  assert.equal(controlFrames.length, 1, 'Hut control needs one natural-phase frame before the popup handoff')
}

export default async function treeHover({ page, root, output, receipt, signal }) {
  const report = { status: 'running', actions: [], preparations: [],
    declaration: { mission: 1, tree: { object: 20, type: 5, model: 1, owner: 255, x: 3, z: 23 },
      building: { object: 42, team: 'blue', kind: 'hut', x: -12, z: 34 },
      startupMs: 60000, observationMs: 120000, phaseMs: 12000, maxRecords: 512, maxPNGs: 10,
      buildingControl: 'One actual pick and natural-phase override, then trusted canvas leave and zero-render; existing popup may own the leave before the host arms its continuation.',
      routes: 'One start, one optional Skip, minimap to tree, hover, stationary-pointer W pan and - zoom, = and minimap return, re-hover/leave, minimap to Blue Hut, hover/leave. No retries.' },
    inputs: Object.fromEntries(['tree-hover.mjs', 'tree-hover-input.mjs', 'tree-hover-witness.mjs'].map(name => [name,
      createHash('sha256').update(readFileSync(new URL(name, import.meta.url))).digest('hex')])),
    method: 'Public Mission1 entry/Skip and actual trusted minimap, pointer and keyboard inputs; natural RAF picker/render-return observation. Candidate probing is diagnostic preparation that may refresh picker/matrix caches.',
    limits: 'Current-port ordinary rendered feedback only. No native execution/controller equivalence, raster equivalence, tooltip behavior, hardware performance, or complete issue19 acceptance. PNG readback perturbs scheduling.' }
  let witness, failure, failed = false, held = false, startupDeadline = null
  const retainFailure = error => { if (!failed) { failed = true; failure = error } report.status = 'failed' }
  const save = () => writeFileSync(resolve(output, 'tree-hover.json'), JSON.stringify(report, null, 2) + '\n')
  const persistFailure = () => { try { save() } catch (error) { retainFailure(error); report.persistenceFailure = String(error?.stack ?? error) } }
  const action = async (label, run) => {
    signal.throwIfAborted(); if (startupDeadline !== null) {
      const remaining = startupDeadline - Date.now(); assert.ok(remaining > 0, 'Startup deadline exhausted')
      page.setDefaultTimeout(remaining)
    }
    report.actions.push({ label, state: 'before', at: new Date().toISOString() }); save()
    await run(); signal.throwIfAborted(); if (startupDeadline !== null) {
      const remaining = startupDeadline - Date.now(); assert.ok(remaining > 0, 'Startup deadline exhausted')
      page.setDefaultTimeout(remaining)
    }
    report.actions.push({ label, state: 'after', at: new Date().toISOString() }); save()
  }
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition && !(s.world.flyby.flags & 1)
  }, null, { timeout: 12000 })
  const view = async target => {
    await settle()
    const prepared = await page.evaluate(hoverMinimapInput, { target })
    report.preparations.push({ kind: 'minimap', target, prepared }); save()
    assert.ok(prepared, 'No owned minimap point within declared distance')
    await action('minimap-view', () => page.mouse.click(prepared.x, prepared.y)); await settle()
  }
  const point = async target => {
    const prepared = await page.evaluate(hoverInput, { target })
    report.preparations.push({ kind: 'diagnostic-pick', ...prepared }); save()
    assert.ok(prepared.point, 'No integer 5x5 interior point; stop without retries')
    await page.waitForFunction(before => {
      const s = window.testSceneRef.current
      return s.frame !== before.sceneFrame && s.renderer.info.render.frame > before.rendererFrame
    }, prepared, { timeout: 12000 })
    const boundary = await page.evaluate(() => { const s = window.testSceneRef.current
      return { sceneFrame: s.frame, rendererFrame: s.renderer.info.render.frame, turn: s.world.turn } })
    report.preparations.push({ kind: 'later-natural-render', boundary, preparedSceneFrame: prepared.sceneFrame }); save()
    return { ...prepared.point, preparation: { sceneFrame: prepared.sceneFrame, rendererFrame: prepared.rendererFrame }, boundary }
  }
  const arm = spec => witness.evaluate((api, spec) => api.arm(spec), spec)
  const wait = () => page.waitForFunction(api => {
    const status = api.status()
    if (status.errors.length) throw Error(status.errors.join('\n'))
    return status.phase.done
  }, witness, { timeout: 12000, polling: 25 })
  const hover = async (name, target, p) => {
    await arm({ name, kind: 'hover', id: target.id, point: p, ...(target.kind === 'building' ? { singleFrame: true } : {}) })
    await action(name, () => page.mouse.move(p.x, p.y)); await wait()
  }
  const leave = async name => {
    const box = await page.getByRole('button', { name: 'Game settings', exact: true }).boundingBox()
    assert.ok(box, 'Actual HUD destination unavailable')
    await arm({ name, kind: 'leave', ...(name === 'building-leave' ? { continuationOf: 'building-live' } : {}) })
    await action(name, () => page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2)))
    await wait()
  }
  save()
  try {
    page.setDefaultTimeout(60000)
    const { bindGame, showAllMissions, waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    const start = Date.now(); startupDeadline = start + 60000
    await action('all-missions', () => showAllMissions(page))
    await action('Mission1', () => page.getByRole('button', { name: 'Mission 1', exact: true }).click({ noWaitAfter: true }))
    await bindGame(page)
    const skip = page.getByRole('button', { name: /^Skip introduction/ })
    if (await skip.isVisible()) await action('Skip introduction', () => skip.click({ noWaitAfter: true }))
    report.readiness = await waitForShamanReadiness(page, { timeout: Math.max(1, 60000 - (Date.now() - start)) })
    await settle(); assert.ok(Date.now() < startupDeadline, 'Startup deadline exhausted'); startupDeadline = null
    page.setDefaultTimeout(12000)
    report.targets = await page.evaluate(authoredHoverTargets); save()
    assert.equal(report.targets.failure, null, report.targets.failure ?? undefined)
    const tree = { ...report.targets.tree, kind: 'tree' }, building = { ...report.targets.building, kind: 'building' }
    report.entry = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { level: w.outcome.level, turn: w.turn, selected: [...w.selected], speed: w.speed, mode: w.mode,
        paused: w.paused, renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, preset: s.viewPreset }
    }); save()
    assert.equal(report.entry.level, 1); assert.equal(report.entry.speed, 1); assert.equal(report.entry.paused, false)
    assert.equal(report.entry.mode, null); assert.equal(report.entry.preset, 0)
    await view(tree); const p = await point(tree)
    witness = await page.evaluateHandle(installTreeHoverWitness, [tree, building])
    await hover('tree-live', tree, p)
    await arm({ name: 'tree-pan', kind: 'camera', change: 'pan', point: p })
    await action('W down', async () => { held = true; await page.keyboard.down('w') }); await wait()
    await action('W up', async () => { await page.keyboard.up('w'); held = false }); await settle()
    await arm({ name: 'tree-zoom', kind: 'camera', change: 'zoom', point: p })
    await action('zoom out', () => page.keyboard.press('-')); await wait()
    await action('zoom return', () => page.keyboard.press('=')); await settle()
    await view(tree); const returned = await point(tree)
    await hover('tree-return', tree, returned); await leave('tree-leave')
    await view(building); await hover('building-live', building, await point(building)); await leave('building-leave')
    report.status = 'observed'
  } catch (error) { retainFailure(error); report.failure = String(error?.stack ?? error); persistFailure() }
  finally {
    if (held) try { await page.keyboard.up('w') } catch (error) { report.releaseFailure = String(error); retainFailure(error) }
    if (witness) {
      try {
        report.observation = await witness.evaluate(api => { api.close(); return api.read() })
        // Persist raw failure evidence before assertions or PNG conversion.
        save()
        for (const [name, frame] of Object.entries(report.observation.frames)) {
          const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
          assert.ok(match, 'Expected PNG from actual render return')
          writeFileSync(resolve(output, `${name}.png`), Buffer.from(match[1], 'base64')); frame.png = `${name}.png`
        }
        save()
        if (!failed) { assertTreeHoverEvidence(report.observation); assert.deepEqual(receipt.errors, []); report.status = 'passed' }
      } catch (error) { retainFailure(error); report.evidenceFailure = String(error?.stack ?? error) }
      finally { try { await witness.dispose() } catch (error) { retainFailure(error); report.disposeFailure = String(error) } }
    }
    persistFailure()
  }
  if (failed) throw failure
  return report
}
