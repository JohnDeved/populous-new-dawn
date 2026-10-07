import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForSavedCheckpoint } from './early-missions.mjs'
import { requireSabotageTrace } from './spy-sabotage-observer.mjs'

// Authored Mission16, public controls and ordinary RAF only. The existing harness
// owns the fresh profile, 300000ms whole-attempt deadline, browser and cleanup.
export default async function ({ page, output, receipt, openMission, observeCheckpoint, signal }) {
  const report = { productBase: '076636812067329a91de33aac484702c4f03f342', source: receipt.source,
    status: 'running', stages: [], method: 'Public Mission16 entry, real construction/training/save/disguise and pointer command15; passive copied turn evidence.',
    limits: 'One bounded functional attempt; no source-game timing, complete mission, hardware performance or unconditional reveal claim.' }
  const deadline = Date.parse(receipt.startedAt) + 300000
  let observerInstalled = false
  const save = () => writeFileSync(resolve(output, 'ordinary-spy-sabotage.json'), JSON.stringify(report, null, 2) + '\n')
  const remaining = (maximum = 15000) => {
    signal.throwIfAborted()
    assert.deepEqual(receipt.errors, [], 'Stop after a browser error')
    assert.ok(Date.now() < deadline, 'Whole Mission16 attempt exceeded 300000ms')
    return Math.min(maximum, deadline - Date.now())
  }
  const shot = name => page.screenshot({ path: resolve(output, `${name}.png`), timeout: remaining() })
  const button = (name, options = {}) => page.getByRole('button', { name, exact: true }).click({ timeout: remaining(), ...options })
  const read = async (actorId = null, targetId = null) => {
    remaining()
    return page.evaluate(async ({ actorId, targetId }) => {
      const { spySnapshot } = await import('/scripts/local-render/spy-sabotage-observer.mjs')
      const s = window.testSceneRef.current, w = s.world
      if (w !== window.testStore.getWorld() || w.outcome.level !== 16) throw Error('Mission16 scene/store identity changed')
      if (s.renderer.getContext().isContextLost()) throw Error('Rendering context lost')
      if (w.status !== 'playing' || w.speed !== 1) throw Error('Ordinary playing 1x state required')
      return { ...spySnapshot(w, actorId, targetId), unlockedSpyHut: w.unlockedSpyHut, inputMask: w.inputMask,
        trained: w.stats.trained, observer: window.spyTurnObserver?.status(),
        people: w.units.filter(u => u.hp > 0).map(u => ({ id: u.id, team: u.team, kind: u.kind,
          x: u.x, z: u.z, inside: u.inside, work: u.work, pathLength: u.path.length })),
        buildings: w.buildings.map(b => ({ id: b.id, team: b.team, kind: b.kind, hp: b.hp,
          progress: b.progress, x: b.x, z: b.z, admission: structuredClone(b.admission) })) }
    }, { actorId, targetId })
  }
  const wait = async (label, predicate, limit, actorId = null, targetId = null) => {
    const end = Math.min(deadline, Date.now() + limit)
    while (Date.now() < end) {
      const state = await read(actorId, targetId)
      assert.deepEqual(state.observer?.errors ?? [], [], 'Stop on passive observation failure')
      if (predicate(state)) return state
      await page.waitForTimeout(Math.max(1, Math.min(100, remaining(), end - Date.now())))
    }
    throw Error(`PREREQUISITE: ${label} did not complete within its remaining bound`)
  }
  const stage = async (name, run) => {
    remaining(); console.log(`Mission16: ${name}`)
    const entry = { name, startedAt: new Date().toISOString(), status: 'running' }
    report.stages.push(entry); save()
    try { entry.evidence = await run(); remaining(); await shot(name); entry.status = 'passed' }
    catch (error) { entry.status = 'failed'; entry.error = String(error.stack ?? error); throw error }
    finally { entry.finishedAt = new Date().toISOString(); save() }
  }
  const clear = async () => {
    for (let n = 0; n < 3; n++) {
      const s = await read()
      if (!s.selected.length && !s.mode) return
      remaining(); await page.keyboard.press('Escape')
    }
    assert.fail('Selection/mode did not clear through Escape')
  }
  const select = async (kind, group = false) => {
    await clear(); await button(`Select ${kind}`, group ? { modifiers: ['Control'] } : {})
    const s = await read()
    assert.ok(s.selected.length && s.selected.every(id => s.people.some(u => u.id === id && u.team === 'blue' && u.kind === kind)))
    if (!group) assert.equal(s.selected.length, 1)
    return s.selected
  }
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  }, null, { timeout: remaining(30000) })
  const view = async target => {
    await settle()
    const hit = await page.evaluate(async target => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = await import('/qa/erosion-ordinary/minimap-input.mjs')
      return minimapInput({ width: s.mini.width, height: s.mini.height, rect: s.mini.getBoundingClientRect(),
        center: { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
        heading: Math.round(s.cameraBearing * 1024 / Math.PI),
        target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) }, maxDistance: 2048 },
      minimapPick, p => document.elementFromPoint(p.x, p.y) === s.mini)
    }, target)
    assert.ok(hit, 'PREREQUISITE: no owned minimap point')
    remaining(); await page.mouse.click(hit.x, hit.y); await page.mouse.move(400, 780); await settle()
  }
  const buildingHit = id => page.evaluate(async id => {
    const { findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
    const s = window.testSceneRef.current, b = s.world.buildings.find(b => b.id === id)
    if (!b) return null
    const r = s.renderer.domElement.getBoundingClientRect(), q = s.screen(b)
    const center = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }, points = []
    s.buildingMeshes.get(id)?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const model of s.picking.model(child, JSON.stringify(s.view.projection)).filter(item => item.kind === 'model'))
        points.push({ x: r.x + model.points.reduce((n, p) => n + p.x, 0) / model.points.length,
          y: r.y + model.points.reduce((n, p) => n + p.y, 0) / model.points.length })
    })
    for (let dy = -150; dy <= 64; dy += 4) for (let dx = -100; dx <= 100; dx += 4) points.push({ x: center.x + dx, y: center.y + dy })
    return findEntityInput(points, id, p => inspectEntityPoint(s, 'buildings', p))
  }, id)
  const targets = actorId => page.evaluate(async actorId => {
    const w = window.testStore.getWorld(), u = w.units.find(u => u.id === actorId && u.hp > 0)
    if (!u) throw Error('Original route actor unavailable')
    const rules = (await import('/app/original-rules.json')).default
    const { buildingPose, buildingSabotagePoint, buildingOutsidePoint } = await import('/app/building-shapes.ts')
    const cell = p => (((p.y & 65535) >> 9) * 128) + ((p.x & 65535) >> 9)
    const start = cell({ x: Math.round((u.x + 8) * 256), y: Math.round((-u.z - 8) * 256) })
    const seen = new Set([start]), queue = [start]
    for (let n = 0; n < queue.length; n++) {
      const x = queue[n] & 127, y = queue[n] >> 7
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const next = ((y + dy + 128) % 128) * 128 + ((x + dx + 128) % 128)
        if (!seen.has(next) && rules.terrainCategoryFlags[w.land.categories[next] & 15] & 1) { seen.add(next); queue.push(next) }
      }
    }
    const distance = b => Math.hypot(...['x', 'z'].map(k => Math.min(Math.abs(b[k] - u[k]), 256 - Math.abs(b[k] - u[k]))))
    return w.buildings.filter(b => b.team !== 'blue' && b.hp > 0 && b.progress === 1 && !b.burn && b.kind !== 'tower')
      .map(b => ({ id: b.id, team: b.team, kind: b.kind, x: b.x, z: b.z, distance: distance(b),
        goals: [buildingSabotagePoint(buildingPose(b)), buildingOutsidePoint(buildingPose(b))] }))
      .filter(b => b.goals.some(p => seen.has(cell(p)))).sort((a, b) => a.distance - b.distance)
  }, actorId)
  const dispatch = async (id, actorId, expectedModel) => {
    await page.waitForFunction(() => window.testStore.getWorld().turn > window.testStore.getWorld().lastOrderTurn, null, { timeout: remaining(5000) })
    const hit = await buildingHit(id); assert.ok(hit, 'PREREQUISITE: no rendered building interior')
    const preflight = await page.evaluate(async ({ id, actorId, hit, expectedModel }) => {
      const { createMoveContextProbe, inspectEntityPoint, findEntityInput, observeEntityPointer } = await import('/qa/erosion-ordinary/input.mjs')
      const { spySnapshot } = await import('/scripts/local-render/spy-sabotage-observer.mjs')
      const s = window.testSceneRef.current, w = s.world, b = w.buildings.find(b => b.id === id)
      const context = b && createMoveContextProbe(w)(b)
      if (w.paused || w.mode || w.selected.length !== 1 || w.selected[0] !== actorId ||
        !context?.enabled || context.model !== expectedModel ||
        !findEntityInput([hit], id, p => inspectEntityPoint(s, 'buildings', p))) return { ok: false, context }
      const delivery = observeEntityPointer(s, document, { ...hit, collection: 'buildings', id })
      const input = { before: null, after: null, errors: [] }, canvas = s.renderer.domElement
      const copy = name => () => { try { input[name] = spySnapshot(w, actorId, id) } catch (e) { input.errors.push(String(e)) } }
      const before = copy('before'), after = copy('after')
      canvas.addEventListener('pointerup', before, true); canvas.addEventListener('pointerup', after)
      window.finishSpyInput = () => {
        canvas.removeEventListener('pointerup', before, true); canvas.removeEventListener('pointerup', after)
        return { ...input, delivery: delivery.finish() }
      }
      return { ok: true, context }
    }, { id, actorId, hit, expectedModel })
    assert.equal(preflight.ok, true, JSON.stringify(preflight))
    let result
    try { remaining(); await page.mouse.click(hit.x, hit.y) }
    finally { result = await page.evaluate(() => { const finish = window.finishSpyInput; delete window.finishSpyInput; return finish() }) }
    assert.deepEqual(result.errors, []); assert.deepEqual(result.delivery.errors, []); assert.equal(result.delivery.restored, true)
    assert.deepEqual(result.delivery.events.map(e => [e.type, e.trusted, e.canvasOwned, e.button]),
      [['pointerdown', true, true, 0], ['pointerup', true, true, 0]])
    assert.ok(result.delivery.events.every(e => ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(k => !e.args[k])))
    assert.equal(result.after.order?.model, expectedModel)
    return { ...result, hit, preflight }
  }
  try {
    await stage('authored-entry-and-route-preflight', async () => {
      assert.equal(receipt.profile?.mode, 'created'); assert.equal(receipt.profile.checkpointAtStart, null)
      page.setDefaultTimeout(remaining()); await openMission(16)
      const initial = await read(), braves = initial.people.filter(u => u.team === 'blue' && u.kind === 'brave')
      assert.equal(initial.unlockedSpyHut, true); assert.equal(initial.inputMask, 0)
      assert.ok(braves.length >= 2); assert.equal(initial.people.filter(u => u.team === 'blue' && u.kind === 'spy').length, 0)
      const candidates = await targets(braves[0].id)
      assert.ok(candidates.length, 'PREREQUISITE: no completed hostile target on the actual land component')
      report.renderer = await page.evaluate(() => {
        const gl = window.testSceneRef.current.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      })
      return { initial, candidates }
    })
    let school
    await stage('ordinary-spy-school-construction', async () => {
      const builders = await select('brave', true); await view({ x: 32, z: -32 })
      const site = await page.evaluate(async () => {
        const { placementError } = await import('/app/model.ts')
        const { inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
        const s = window.testSceneRef.current, probe = structuredClone(s.world), r = s.renderer.domElement.getBoundingClientRect()
        for (let radius = 0; radius <= 12; radius++) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const p = { x: 32 + radius * Math.cos(angle), z: -32 + radius * Math.sin(angle) }, q = s.screen(p)
          const hit = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
          const pick = s.pick({ clientX: hit.x, clientY: hit.y }), ownership = inspectEntityPoint(s, 'buildings', hit)
          if (pick && ownership.canvasOwned && ownership.hitId === null && Math.hypot(pick.x - p.x, pick.z - p.z) < 1.5 && !placementError(probe, 'spyHut', pick)) return { ...hit, point: { x: pick.x, z: pick.z } }
        }
        return null
      })
      assert.ok(site, 'PREREQUISITE: no legal ordinary school site')
      const before = await read(); await button('buildings B'); await button('Spy Training Hut, 8 wood')
      remaining(); await page.mouse.click(site.x, site.y)
      const plans = (await read()).buildings.filter(b => b.team === 'blue' && b.kind === 'spyHut' && !before.buildings.some(old => old.id === b.id))
      assert.equal(plans.length, 1); school = plans[0]
      const built = await wait('real timber delivery/construction', s => {
        assert.ok(builders.every(id => s.people.some(u => u.id === id)), 'Chosen builder was lost')
        const b = s.buildings.find(b => b.id === school.id); assert.ok(b?.hp > 0, 'School was lost')
        return b.progress === 1
      }, 180000)
      return { builders, site, built }
    })
    let spyId
    await stage('ordinary-training-and-genuine-save', async () => {
      const [brave] = await select('brave'); await view(school)
      await page.getByTitle('spells', { exact: true }).click({ timeout: remaining() })
      const charging = await page.evaluate(async () => {
        const w = window.testStore.getWorld(), { SPELLS } = await import('/app/model.ts'), s = w.manaWorld.spells[0]
        return SPELLS.filter(p => s.available & (1 << p.model) && !(s.disabled & (1 << (p.model - 1)))).map(p => p.name)
      })
      for (const name of charging) await page.getByRole('button', { name: new RegExp('^' + name + ', ') }).click({ button: 'right', timeout: remaining() })
      const before = await read(brave, school.id), previous = new Set(before.people.filter(u => u.team === 'blue' && u.kind === 'spy').map(u => u.id))
      const input = await dispatch(school.id, brave, 8)
      const trained = await wait('actual new Spy allocation and exit', s => {
        const spies = s.people.filter(u => u.team === 'blue' && u.kind === 'spy' && !previous.has(u.id))
        if (!s.people.some(u => u.id === brave) && !spies.length) throw Error('Training Brave disappeared without an observed Spy')
        assert.ok(spies.length <= 1, 'One real trainee must yield one identified Spy')
        if (!spies.length || spies[0].inside !== null || spies[0].work !== null || spies[0].pathLength) return false
        assert.ok(!s.people.some(u => u.id === brave), 'The actual source Brave must have been replaced')
        assert.ok(Math.hypot(spies[0].x - school.x, spies[0].z - school.z) < 16, 'The observed Spy must originate at the actual school')
        assert.ok(s.trained > before.trained); spyId = spies[0].id; return true
      }, 120000, brave, school.id)
      assert.notEqual(spyId, brave)
      await button('Game settings'); await page.locator('dialog.game-dialog').waitFor({ state: 'visible', timeout: remaining() })
      const paused = await read(spyId, school.id); assert.equal(paused.paused, true); assert.equal(paused.actor.kind, 'spy')
      await button('Save checkpoint'); await waitForSavedCheckpoint(page, paused.turn, signal)
      const saved = await observeCheckpoint('Trained Spy before hostile approach')
      assert.equal(saved.checkpoint.level, 16); assert.equal(saved.checkpoint.turn, paused.turn)
      report.savedSpy = { spyId, schoolId: school.id, sourceBrave: brave, paused, checkpoint: saved }; save()
      await shot('trained-spy-saved-settings')
      await page.getByRole('button', { name: 'Continue Game', exact: false }).click({ timeout: remaining() })
      return { sourceBrave: brave, allocatedSpy: spyId, input, trained, saved }
    })
    let target
    await stage('ordinary-disguise-and-target', async () => {
      assert.deepEqual(await select('spy'), [spyId])
      const candidates = await targets(spyId); assert.ok(candidates.length, 'PREREQUISITE: no live connected hostile target')
      target = candidates[0]
      await page.getByTitle('followers', { exact: true }).click({ timeout: remaining() })
      const names = { red: 'Dakini', yellow: 'Chumara', green: 'Matak' }, tribe = { red: 1, yellow: 2, green: 3 }[target.team]
      await button(`Disguise selected spies as ${names[target.team]}`)
      const disguised = await wait('public disguise countdown', s => {
        assert.ok(s.actor?.hp > 0, 'Chosen Spy was lost'); return s.person?.disguise === tribe << 6
      }, 15000, spyId, target.id)
      await view(target)
      return { target, disguised }
    })
    await stage('ordinary-command15-and-ignition', async () => {
      const before = await read(spyId, target.id)
      assert.equal(before.actor.kind, 'spy'); assert.ok(before.actor.hp > 0 && before.actor.registeredNative)
      assert.ok(before.target.hp > 0 && before.target.progress === 1 && !before.target.burn)
      await page.evaluate(async ({ spyId, targetId }) => {
        const { observeSpyTurns } = await import('/scripts/local-render/spy-sabotage-observer.mjs')
        const s = window.testSceneRef.current, w = s.world
        window.spyTurnObserver = observeSpyTurns(s.gameClock, w, spyId, targetId,
          () => window.testSceneRef.current === s && window.testStore.getWorld() === w)
      }, { spyId, targetId: target.id }); observerInstalled = true
      const input = await dispatch(target.id, spyId, 15)
      await wait('actual Spy approach/arrival/sabotage', s => {
        assert.ok(s.actor?.hp > 0 && s.actor.registeredNative, 'Chosen Spy/controller was lost')
        assert.ok(s.target?.hp > 0, 'Chosen target was lost')
        assert.equal(s.order?.model, 15, 'Stop if combat or reassignment replaces sabotage')
        return s.person.substate === 4 && s.target.burn?.remaining > 0
      }, remaining(120000), spyId, target.id)
      const trace = await page.evaluate(() => { const result = window.spyTurnObserver.finish(); delete window.spyTurnObserver; return result })
      observerInstalled = false
      writeFileSync(resolve(output, 'spy-sabotage-trace.json'), JSON.stringify({ input, trace }, null, 2) + '\n')
      const proof = requireSabotageTrace(trace, input, target.id, target.goals)
      await button('Pause game')
      return { target, proof, samples: trace.samples.length, trace: 'spy-sabotage-trace.json', final: await read(spyId, target.id) }
    })
    report.status = 'passed'; return report
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack ?? error); throw error }
  finally {
    if (observerInstalled) try {
      const trace = await page.evaluate(() => { const result = window.spyTurnObserver.finish(); delete window.spyTurnObserver; return result })
      writeFileSync(resolve(output, 'spy-sabotage-trace-failed.json'), JSON.stringify(trace, null, 2) + '\n')
    } catch (error) { report.observerCleanupFailure = String(error) }
    save()
  }
}
