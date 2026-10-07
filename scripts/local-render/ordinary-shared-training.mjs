// Source-only until coordinator release. The maintained harness owns browser/resources.
// Route: accepted c9b975eb qa/mission-three-controls/driver.mjs prepareTemple.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, waitForShamanReadiness } from '../browser-game.mjs'
import { waitForSavedCheckpoint } from './early-missions.mjs'

// Copies actual ownership, including aliases preserved by structuredClone/IndexedDB.
export function trainingObservation({ source = 'live', ids = [], school = null, order = null } = {}) {
  const w = source === 'loaded' ? window.trainingLoadedWorld : source === 'saved'
    ? window.trainingSavedWorld : source === 'input' ? window.trainingInput.world
      : window.testSceneRef.current.world
  if (!w) throw Error(`Missing ${source} world observation`)
  const members = ids.map(id => {
    const u = w.units.find(unit => unit.id === id), p = w.objectCells.objects.get(id)
    if (!u) return { id, absent: true }
    const current = p && (p.immediateCommand || p.commands[p.commandCursor])
    return { id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z, inside: u.inside, work: u.work,
      target: u.target, path: structuredClone(u.path), registered: !!p, entryPresent: !!u.entry,
      aliases: { native: !!p && u.native === p, entry: !!p && u.entry?.person === p,
        builder: !!p && u.builder?.person === p, flight: !!p && u.flight === p,
        fight: !!p && u.fight?.motion === p, entryPool: !!u.entry && u.entry.orders === w.buildingOrders },
      person: p && { id: p.id, commands: [...p.commands], commandCursor: p.commandCursor,
        immediateCommand: p.immediateCommand, commandStatus: p.commandStatus,
        state: p.state, previousState: p.previousState, substate: p.substate, counter: p.counter,
        flags2: p.flags2, flags3: p.flags3, flags4: p.flags4, selectionFlags: p.selectionFlags },
      current, record: current ? structuredClone(w.buildingOrders.records[current]) : null }
  })
  const b = w.buildings.find(building => building.id === school)
  return { level: w.outcome.level, turn: w.turn, time: w.time, paused: w.paused, speed: w.speed,
    status: w.status, inputMask: w.inputMask, selected: [...w.selected], mode: w.mode,
    lastOrderTurn: w.lastOrderTurn, unlockedTemple: w.unlockedTemple,
    blue: w.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => ({ id: u.id, kind: u.kind,
      x: u.x, z: u.z, inside: u.inside, builder: !!u.builder })),
    buildings: w.buildings.map(b => ({ id: b.id, kind: b.kind, team: b.team, x: b.x, z: b.z, progress: b.progress, hp: b.hp })),
    vault: structuredClone(w.shrines.find(shrine => shrine.kind === 'vault')),
    school: b && { id: b.id, kind: b.kind, progress: b.progress, hp: b.hp, admission: structuredClone(b.admission) },
    pool: { active: w.buildingOrders.active, cursor: w.buildingOrders.cursor },
    trackedRecord: order ? structuredClone(w.buildingOrders.records[order]) : null,
    trackedOwners: order ? w.units.filter(u => {
      const p = w.objectCells.objects.get(u.id)
      return p && (p.immediateCommand === order || p.commands.includes(order))
    }).map(u => u.id) : [], members }
}

export function assertSharedTraining(snapshot, ids, school, expected) {
  assert.equal(snapshot.members.length, ids.length)
  const order = snapshot.members[0].current
  assert.ok(order)
  if (expected !== undefined) assert.equal(order, expected)
  for (const member of snapshot.members) {
    assert.equal(member.registered, true)
    assert.equal(member.current, order)
    assert.equal(member.record.model, 8)
    assert.equal(member.record.a, school)
    assert.equal(member.record.references, ids.length)
    assert.equal(member.aliases.entry, true)
    assert.equal(member.aliases.entryPool, true)
    assert.equal(member.work, school)
  }
  return order
}

export function trainingOwnersToReassign(snapshot, originalIds, school, order) {
  const owners = snapshot.members.filter(m => m.hp > 0 && m.current === order).map(m => m.id)
  assert.ok(owners.length, 'No original training owner remains for a reassignment witness')
  assert.ok(owners.every(id => originalIds.includes(id)), 'Never substitute a replacement trainee')
  assert.deepEqual([...snapshot.trackedOwners].sort((a, b) => a - b), [...owners].sort((a, b) => a - b))
  assert.equal(snapshot.trackedRecord.model, 8)
  assert.equal(snapshot.trackedRecord.a, school)
  assert.equal(snapshot.trackedRecord.references, owners.length)
  return owners
}

export function assertCheckpointTraining(snapshot, originalIds, school, order) {
  const owners = trainingOwnersToReassign(snapshot, originalIds, school, order)
  assert.ok(owners.length >= 2, 'The saved checkpoint must contain shared training ownership')
  assertSharedTraining({ ...snapshot, members: snapshot.members.filter(m => owners.includes(m.id)) }, owners, school, order)
  return owners
}

export function assertTrainingReleased(snapshot, school, order) {
  assert.equal(snapshot.trackedRecord.references, 0)
  assert.deepEqual(snapshot.trackedOwners, [])
  for (const member of snapshot.members) {
    assert.equal(member.entryPresent, false, 'No stale entry adapter may survive reassignment')
    assert.notEqual(member.work, school)
    assert.equal(member.registered, true)
    assert.notEqual(member.current, order)
    assert.equal(member.record?.model, 3)
  }
}

export default async function ({ page, output, receipt, openMission, signal }) {
  const report = { productBase: '9eca3723f92c3c2cdcb7170c60816864aa82826d', source: receipt.source, status: 'running', steps: [],
    method: 'Public UI and real RAF; detached-clone validators, read-only picking and ownership observations.',
    limits: 'Mission3 group ownership/save/load/cancellation only. No conversion/combat, original-packet timing, throughput or hardware-performance claim.' }
  const save = () => writeFileSync(resolve(output, 'ordinary-shared-training.json'), JSON.stringify(report, null, 2) + '\n')
  let originalShaman = null
  const read = (args = {}) => page.evaluate(trainingObservation, args)
  const button = name => page.getByRole('button', { name, exact: true }).click()
  const stage = async (name, run) => {
    signal.throwIfAborted()
    assert.deepEqual(receipt.errors, [], 'Stop before another stage after a browser error')
    const step = { name, startedAt: new Date().toISOString(), status: 'running' }
    report.steps.push(step); save()
    try {
      step.evidence = await run(); signal.throwIfAborted()
      assert.deepEqual(receipt.errors, [], 'Stop after a browser error')
      await page.screenshot({ path: resolve(output, `${report.steps.length}-${name}.png`) })
      step.status = 'passed'
    } catch (error) { step.status = 'failed'; step.error = String(error.stack ?? error); throw error }
    finally { step.finishedAt = new Date().toISOString(); save() }
  }
  const wait = (kind, detail, timeout) => page.waitForFunction(({ kind, detail, originalShaman }) => {
    const w = window.testSceneRef.current.world
    if (window.testStore.getWorld() !== w) throw Error('Scene/store changed during the ordinary witness')
    if (window.testSceneRef.current.renderer.getContext().isContextLost()) throw Error('Rendering context lost')
    if (w.status !== 'playing') throw Error(`Mission stopped: ${w.status}`)
    if (!w.units.some(u => u.id === originalShaman && u.hp > 0)) throw Error('Authored Shaman was lost')
    if (kind === 'vault') return w.unlockedTemple
    if (kind === 'home') {
      const u = w.units.find(u => u.id === detail)
      return u && Math.hypot(u.x - 35, u.z - 81) < 4
    }
    if (kind === 'built') return w.buildings.some(b => b.id === detail && b.progress === 1 && b.hp > 0)
    if (kind === 'braves') return w.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null).length >= 2
    return w.turn > detail
  }, { kind, detail, originalShaman }, { timeout, polling: 500 })
  const clear = async () => {
    for (let i = 0; i < 3; i++) {
      const s = await read()
      if (!s.mode && !s.selected.length) return
      await page.keyboard.press('Escape')
    }
    assert.fail('Escape did not clear selection/mode')
  }
  const select = async kind => {
    await clear()
    if (kind === 'shaman') await button('Select and focus shaman')
    else await page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Control'] })
    const s = await read()
    if (kind === 'shaman') assert.equal(s.selected.length, 1)
    else assert.ok(s.selected.length >= 2 && s.selected.length <= 5, 'Ctrl-select must supply an actual group')
    assert.ok(s.selected.every(id => s.blue.some(u => u.id === id && u.kind === kind)))
    return s.selected
  }
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  }, null, { timeout: 30000 })
  const view = async target => {
    assert.equal((await read()).mode, null)
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
    assert.ok(hit, 'No owned minimap input at target')
    await page.mouse.click(hit.x, hit.y); await page.mouse.move(400, 780); await settle()
  }
  const entityHit = async (collection, id) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const hit = await page.evaluate(async ({ collection, id }) => {
        const { findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
        const s = window.testSceneRef.current, target = s.world[collection].find(o => o.id === id)
        if (!target) return null
        const r = s.renderer.domElement.getBoundingClientRect(), q = s.screen(target)
        const center = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }, candidates = []
        const mesh = collection === 'buildings' ? s.buildingMeshes.get(id)
          : collection === 'units' ? s.unitMeshes.get(id) : s.shrineMeshes.get(id)?.g
        mesh?.traverse(child => {
          if (child.userData.nativeModel === undefined || !child.visible) return
          for (const { points } of s.picking.model(child, JSON.stringify(s.view.projection)).filter(item => item.kind === 'model'))
            candidates.push({ x: r.x + points.reduce((sum, p) => sum + p.x, 0) / points.length,
              y: r.y + points.reduce((sum, p) => sum + p.y, 0) / points.length })
        })
        for (let dy = -150; dy <= 64; dy += 4) for (let dx = -100; dx <= 100; dx += 4)
          candidates.push({ x: center.x + dx, y: center.y + dy })
        return findEntityInput(candidates, id, p => inspectEntityPoint(s, collection, p))
      }, { collection, id })
      if (hit) return { ...hit, collection, id }
      if (attempt === 3) break
      const corridor = await page.evaluate(() => {
        const canvas = window.testSceneRef.current.renderer.domElement
        for (const y of [750, 650, 550]) if ([280, 792].every(x => document.elementFromPoint(x, y) === canvas)) return { x: 280, y }
        return null
      })
      assert.ok(corridor, 'No owned camera-rotation corridor')
      await page.mouse.move(corridor.x, corridor.y); await page.mouse.down({ button: 'right' })
      try { await page.mouse.move(792, corridor.y, { steps: 12 }) }
      finally { await page.mouse.up({ button: 'right' }) }
      await page.mouse.move(400, 780); await settle()
    }
    assert.fail(`No rendered interior for ${collection} ${id}`)
  }
  const groundHit = (point, kind = null, radius = 2) => page.evaluate(async ({ point, kind, radius }) => {
    const { placementError } = await import('/app/model.ts')
    const { createMoveContextProbe, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
    const s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect()
    const probe = structuredClone(s.world), context = createMoveContextProbe(probe)
    for (let distance = 0; distance <= radius; distance++) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const p = { x: point.x + Math.cos(angle) * distance, z: point.z + Math.sin(angle) * distance }, q = s.screen(p)
      const hit = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
      const picked = s.pick({ clientX: hit.x, clientY: hit.y }), inspected = inspectEntityPoint(s, 'buildings', hit)
      if (!picked || !inspected.canvasOwned || inspected.hitId !== null || Math.hypot(picked.x - p.x, picked.z - p.z) >= 1.5) continue
      if (kind ? placementError(probe, kind, picked) : context(picked).model !== 3 || !context(picked).enabled) continue
      return { ...hit, point: { x: picked.x, z: picked.z } }
    }
    return null
  }, { point, kind, radius })
  const dispatch = async (hit, model, ids) => {
    await page.waitForFunction(() => window.testSceneRef.current.world.turn > window.testSceneRef.current.world.lastOrderTurn, null, { timeout: 5000 })
    const preflight = await page.evaluate(async ({ hit, model, ids }) => {
      const { createMoveContextProbe, inspectEntityPoint, findEntityInput, observeEntityPointer } = await import('/qa/erosion-ordinary/input.mjs')
      const s = window.testSceneRef.current, w = s.world, canvas = s.renderer.domElement
      const target = hit.collection ? w[hit.collection].find(o => o.id === hit.id) : s.pick({ clientX: hit.x, clientY: hit.y })
      const pick = inspectEntityPoint(s, hit.collection ?? 'buildings', hit)
      const interior = hit.collection && findEntityInput([hit], hit.id, p => inspectEntityPoint(s, hit.collection, p))
      const context = target && createMoveContextProbe(w)(target)
      if (JSON.stringify(w.selected) !== JSON.stringify(ids) || w.paused || w.mode || !target || !pick.canvasOwned ||
        (hit.collection ? !interior : pick.hitId !== null) || !context.enabled || context.model !== model) return { ok: false, context, pick, selected: [...w.selected] }
      const delivery = observeEntityPointer(s, document, hit.collection ? hit : null), errors = []
      window.trainingInput = { world: null, errors, delivery: null, before: { turn: w.turn, lastOrderTurn: w.lastOrderTurn, selected: [...w.selected] } }
      const after = () => { try { window.trainingInput.world = structuredClone(w) } catch (e) { errors.push(String(e)) } }
      canvas.addEventListener('pointerup', after)
      window.finishTrainingInput = () => {
        canvas.removeEventListener('pointerup', after); window.trainingInput.delivery = delivery.finish()
        return { before: window.trainingInput.before, errors, delivery: window.trainingInput.delivery }
      }
      return { ok: true, context, pick }
    }, { hit, model, ids })
    assert.equal(preflight.ok, true, JSON.stringify(preflight))
    let delivered
    try { await page.mouse.click(hit.x, hit.y) }
    finally { delivered = await page.evaluate(() => { const finish = window.finishTrainingInput; delete window.finishTrainingInput; return finish() }) }
    assert.deepEqual(delivered.errors, [])
    assert.deepEqual(delivered.delivery.errors, [])
    assert.equal(delivered.delivery.restored, true)
    assert.deepEqual(delivered.delivery.events.map(e => [e.type, e.button, e.trusted, e.canvasOwned, e.canvasTarget]),
      ['pointerdown', 'pointerup'].map(type => [type, 0, true, true, true]))
    assert.ok(delivered.delivery.events.every(e => ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => !e.args[key])))
    const after = await read({ source: 'input', ids })
    assert.ok(after.lastOrderTurn > delivered.before.lastOrderTurn)
    return { preflight, delivered, after }
  }
  try {
    await stage('authored-mission3-entry', async () => {
      assert.equal(receipt.profile?.mode, 'created', 'This route requires a fresh task-owned profile')
      assert.equal(receipt.profile.checkpointAtStart, null, 'The route starts without a prior save')
      await openMission(3); await waitForShamanReadiness(page)
      const s = await read(); assert.equal(s.level, 3); assert.equal(s.speed, 1)
      originalShaman = s.blue.find(u => u.kind === 'shaman')?.id
      assert.ok(originalShaman, 'Retain the actual authored Shaman identity')
      report.renderer = await page.evaluate(() => {
        const gl = window.testSceneRef.current.renderer.getContext(), d = gl.getExtension('WEBGL_debug_renderer_info')
        return { renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), contextLost: gl.isContextLost() }
      })
      assert.equal(report.renderer.contextLost, false)
      return s
    })
    await stage('earned-temple-knowledge', async () => {
      const ids = await select('shaman'), vault = (await read()).vault
      assert.ok(vault); await view(vault)
      const input = await dispatch(await entityHit('shrines', vault.id), 33, ids)
      await wait('vault', null, 180000)
      await select('shaman'); await view({ x: 35, z: 81 })
      const home = await groundHit({ x: 35, z: 81 }); assert.ok(home)
      await dispatch(home, 3, ids); await wait('home', ids[0], 90000)
      return { input, completed: await read() }
    })
    let school
    await stage('real-temple-construction', async () => {
      await wait('braves', null, 60000)
      await select('brave'); await view({ x: 24, z: 70 })
      const hit = await groundHit({ x: 24, z: 70 }, 'temple', 12); assert.ok(hit)
      const before = await read()
      await button('buildings B'); await button('Temple, 8 wood'); await page.mouse.click(hit.x, hit.y)
      const plans = (await read()).buildings.filter(b => b.team === 'blue' && b.kind === 'temple' && !before.buildings.some(old => old.id === b.id))
      assert.equal(plans.length, 1); school = plans[0].id
      await wait('built', school, 180000); await wait('braves', null, 30000)
      return read({ school })
    })
    let ids, order
    await stage('one-shared-training-click', async () => {
      ids = await select('brave')
      const b = (await read()).buildings.find(b => b.id === school); await view(b)
      const input = await dispatch(await entityHit('buildings', school), 8, ids)
      order = assertSharedTraining(input.after, ids, school)
      await wait('turn', input.after.turn, 10000)
      const next = await read({ ids, school, order }); assertSharedTraining(next, ids, school, order)
      // Public pause keeps screenshot/save preparation out of the training interval.
      await button('Pause game')
      return { input, next }
    })
    await stage('save-and-exact-load-boundary', async () => {
      await button('Game settings')
      const menu = page.locator('dialog.game-dialog'); await menu.waitFor({ state: 'visible' })
      const paused = await read({ ids, school, order }); assert.equal(paused.paused, true)
      const ownersAtSave = assertCheckpointTraining(paused, ids, school, order)
      await button('Save checkpoint'); await waitForSavedCheckpoint(page, paused.turn, signal)
      await page.evaluate(async () => {
        const request = indexedDB.open('populous-new-dawn', 1)
        const db = await new Promise((res, rej) => { request.onsuccess = () => res(request.result); request.onerror = () => rej(request.error) })
        try {
          const r = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
          const value = await new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
          window.trainingSavedWorld = value.world
        } finally { db.close() }
      })
      const saved = await read({ source: 'saved', ids, school, order })
      assert.deepEqual(saved, paused)
      await page.screenshot({ path: resolve(output, 'saved-settings.png') })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
      await page.evaluate(() => {
        const main = document.querySelector('main')
        let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
        for (; fiber && !store; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
        if (!store) throw Error('Load-boundary store unavailable')
        const before = store.getWorld(); window.trainingLoadError = null
        const unsubscribe = store.subscribe(() => {
          const w = store.getWorld(); if (w === before) return
          try { window.trainingLoadedWorld = structuredClone(w) } catch (e) { window.trainingLoadError = String(e) }
          finally { unsubscribe() }
        })
      })
      await button('Load Game')
      assert.equal(await page.evaluate(() => window.trainingLoadError), null)
      const loaded = await read({ source: 'loaded', ids, school, order })
      // This first synchronous replacement precedes public Load's auto-resume.
      assert.deepEqual(loaded, saved)
      await bindGame(page)
      await wait('turn', saved.turn, 10000)
      await button('Pause game')
      return { ownersAtSave, saved, loaded, resumed: await read({ ids, school, order }) }
    })
    await stage('ordinary-group-reassignment', async () => {
      const before = await read({ ids, school, order })
      // Conversion can replace original IDs after the exact Load boundary. Reassign
      // only actual remaining original owners, recording every intervening change.
      const owners = trainingOwnersToReassign(before, ids, school, order)
      if (JSON.stringify(before.selected) !== JSON.stringify(owners)) {
        await clear()
        for (const id of owners) {
          const member = before.members.find(m => m.id === id)
          assert.equal(member.inside, null, 'Changed selection requires a visible original owner')
          await view(member)
          const hit = await entityHit('units', id)
          await page.keyboard.down('Control')
          try { await page.mouse.click(hit.x, hit.y) }
          finally { await page.keyboard.up('Control') }
        }
      }
      await view({ x: 35, z: 81 })
      const hit = await groundHit({ x: 35, z: 81 }); assert.ok(hit)
      await button('Resume game')
      const input = await dispatch(hit, 3, owners)
      const after = await read({ source: 'input', ids: owners, school, order })
      assertTrainingReleased(after, school, order)
      await button('Pause game')
      return { before, originalIds: ids, reassignedIds: owners, input, after }
    })
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'; return report
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack ?? error); throw error }
  finally { save() }
}
