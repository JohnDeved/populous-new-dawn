// The accepted Mission3 acquisition sequence, stopped at one safe Blue Preacher.
import assert from 'node:assert/strict'
import { appendFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createOrdinaryInput } from '../preacher-gesture-baseline/inherited/ordinary-input.mjs'
import { createOrderDispatch } from './ground-dispatch.mjs'
import { installNativeGuardObserver, setNativeGuardObservedHut } from '../preacher-gesture-baseline/inherited/observer.mjs'

export const SAFE_POINTS = Object.freeze([{ x: 35, z: 90 }])

export async function acquirePreacher({ page, openMission, output, receipt, signal }) {
  const started = performance.now(), acquisitionDeadline = started + 360000
  let latest, preacherId, shamanId, templeId, traineeId, acquisitionComplete = false
  let firstAdmission = null, trainingAdmission = false
  const milestones = [], failures = []
  const log = event => appendFileSync(resolve(output, 'actions.jsonl'), JSON.stringify({ at: new Date().toISOString(),
    elapsedMs: performance.now() - started, ...event }) + '\n')
  const save = status => writeFileSync(resolve(output, 'acquisition.json'), JSON.stringify({ status,
    source: receipt.source, started, elapsedMs: performance.now() - started, preacherId, shamanId, templeId,
    traineeId, trainingAdmission, firstAdmission, milestones, failures, latest,
    limits: 'Reused accepted ordinary Mission3 acquisition route; no fixture or simulation stepping. First actual admission snapshot is retained.' }, null, 2) + '\n')
  const check = () => {
    signal.throwIfAborted()
    if (!acquisitionComplete) assert.ok(performance.now() < acquisitionDeadline, '360-second acquisition ceiling')
    assert.deepEqual(receipt.errors, [])
  }
  const read = async () => {
    check()
    latest = await page.evaluate(() => ({ ...window.nativeGuardRead(),
      unlockedTemple: window.testSceneRef.current.world.unlockedTemple }))
    check(); return latest
  }
  const health = row => {
    check(); assert.equal(row.level, 3); assert.equal(row.status, 'playing')
    assert.equal(row.paused, false); assert.equal(row.speed, 1); assert.equal(row.visibility, 'visible')
    assert.equal(row.landFlags & 2, 0)
    if (shamanId) assert.ok(row.units.some(u => u.id === shamanId && u.hp > 0), 'Acquired Shaman survives')
    if (preacherId) assert.ok(row.units.some(u => u.id === preacherId && u.hp > 0), 'Trained Preacher survives')
  }
  // One acquisition deadline and the accepted finite observation. No retry engine.
  const pollUI = async (predicate, timeout, label) => {
    const end = Math.min(performance.now() + timeout, acquisitionComplete ? Infinity : acquisitionDeadline)
    for (;;) {
      check()
      if (await predicate()) { check(); return }
      assert.ok(performance.now() < end, label)
      await page.waitForTimeout(100)
    }
  }
  const wait = async (label, predicate) => {
    await pollUI(async () => { const row = await read(); health(row); return predicate(row) },
      acquisitionDeadline - performance.now(), label)
    milestones.push({ label, elapsedMs: performance.now() - started, state: latest }); save('acquiring')
  }
  const clear = async () => {
    for (let i = 0; i < 3; i++) {
      const row = await read(); health(row)
      if (!row.mode && !row.selected.length) return
      log({ action: 'key', key: 'Escape' }); await page.keyboard.press('Escape')
    }
    assert.fail('Ordinary Escape did not clear mode and selection')
  }
  const select = async (kind, five = false) => {
    await clear()
    const name = kind === 'shaman' ? 'Select and focus shaman' : `Select ${kind}`
    log({ action: 'button', name, five })
    await page.getByRole('button', { name, exact: true }).click(five ? { modifiers: ['Control'] } : {})
    const row = await read(); health(row)
    assert.equal(row.selected.length, five ? 5 : 1)
    assert.ok(row.selected.every(id => row.units.some(u => u.id === id && u.kind === kind && u.team === 'blue')))
    log({ action: 'selection-accepted', ids: row.selected, kind, turn: row.turn })
    return row.selected
  }
  try {
    await openMission(3)
    await page.evaluate(installNativeGuardObserver)
    await page.evaluate(async () => {
      window.nativeGuardProbes = await import('/qa/preacher-gesture-baseline/inherited/browser-probes.mjs')
      window.nativeGuardCandidateGround = await import('/qa/preacher-gesture-candidate/ground-input.mjs')
    })
    await wait('Shaman selectable after public Mission3 opening', row => row.readiness.ready && !row.inputMask)
    assert.equal(latest.units.filter(u => u.kind === 'preacher').length, 0, 'No supplied Blue Preacher')
    const vault = latest.shrines.find(h => h.kind === 'vault'); assert.ok(vault)
    const ordinary = createOrdinaryInput({ page, read, log, signal, health, pollUI })
    const dispatch = createOrderDispatch({ page, read, log, pollUI, health, ordinary, signal })
    const ground = async (point, kind = null, radius = 0) => {
      const result = await page.evaluate(async ({ point, kind, radius }) => {
        const s = window.testSceneRef.current, r = s.container.getBoundingClientRect()
        const { placementError } = await import('/app/model.ts')
        const { nativePosition } = await import('/app/model.ts')
        const { restingCellCollision } = await import('/app/person-collision.ts')
        const { findEntityInput, createMoveContextProbe } = window.nativeGuardProbes
        const clone = kind ? structuredClone(s.world) : null
        const moveContext = kind ? null : createMoveContextProbe(s.world)
        const rejected = [], probes = []
        for (let distance = 0; distance <= radius; distance++) for (let step = 0; step < (distance ? 24 : 1); step++) {
          const a = step * Math.PI / 12, target = { x: point.x + Math.cos(a) * distance, z: point.z + Math.sin(a) * distance }
          const q = s.screen(target), candidates = []
          const cx = r.x + (q.x + 1) * r.width / 2, cy = r.y + (1 - q.y) * r.height / 2
          for (const [dx, dy] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]]) candidates.push({ x: cx + dx, y: cy + dy })
          const sampler = window.nativeGuardCandidateGround.groundSampler(s, document, target, true)
          const hit = findEntityInput(candidates, 0, sampler.inspect)
          probes.push({ target, candidates, turn: s.world.turn, frame: s.frame, now: performance.now(),
            hit, samples: sampler.samples })
          if (!hit) continue
          const picked = s.pick({ clientX: hit.x, clientY: hit.y })
          const problem = kind ? placementError(clone, kind, picked) : null
          const context = moveContext?.(picked)
          if (problem || context && !(context.model === 3 && context.enabled)) { rejected.push({ target, problem, context }); continue }
          const native = nativePosition(s.world, picked), cell = (native.y >> 9) * 128 + (native.x >> 9)
          const collision = restingCellCollision({ flags: s.world.land.flags[cell], category: s.world.land.categories[cell] }, s.world.land.walkMasks[0], native)
          if (!kind && collision) { rejected.push({ target, collision }); continue }
          return { hit: { ...hit, point: { x: picked.x, z: picked.z }, context }, rejected, probes }
        }
        return { hit: null, rejected, probes }
      }, { point, kind, radius })
      log({ action: 'finite-ground-probe', point, kind, radius, ...result })
      return result.hit
    }
    const move = async (point, radius = 0) => {
      await ordinary.map(point)
      const hit = await ground(point, null, radius); assert.ok(hit, 'No legal ordinary ground target in declared finite probes')
      return dispatch.clickOrder(hit)
    }
    ;[shamanId] = await select('shaman')
    await dispatch.clickOrder(await ordinary.targetEntity('shrines', vault.id))
    await wait('Vault unlocks Temple', row => row.unlockedTemple)
    await select('shaman'); await move({ x: 35, z: 81 }, 2)
    await wait('Shaman returns home', row => row.units.some(u => u.id === shamanId && Math.hypot(u.x - 35, u.z - 81) <= 4))
    const builders = await select('brave', true)
    await ordinary.map({ x: 24, z: 70 })
    const site = await ground({ x: 24, z: 70 }, 'temple', 12); assert.ok(site)
    const beforeBuild = await read()
    await page.getByRole('button', { name: 'buildings B', exact: true }).click()
    await page.getByRole('button', { name: 'Temple, 8 wood', exact: true }).click()
    assert.equal((await read()).mode, 'temple')
    log({ action: 'place-temple-plan', site, builders })
    await page.mouse.click(site.x, site.y); await page.mouse.move(400, 780)
    const afterBuild = await read(), created = afterBuild.buildings.filter(b => b.team === 'blue' &&
      b.kind === 'temple' && !beforeBuild.buildings.some(old => old.id === b.id))
    assert.equal(created.length, 1); templeId = created[0].id
    assert.ok(afterBuild.units.some(u => builders.includes(u.id) && (u.work === templeId || u.order?.model === 6 && u.order.a === templeId)))
    await wait('Temple completed', row => row.buildings.some(b => b.id === templeId && b.hp > 0 && b.progress === 1))
    await page.evaluate(setNativeGuardObservedHut, templeId)
    ;[traineeId] = await select('brave')
    const beforeTraining = await read(), retained = beforeTraining.units.filter(u => u.kind === 'brave' && u.id !== traineeId).map(u => u.id)
    assert.ok(retained.length); assert.equal(beforeTraining.units.filter(u => u.kind === 'preacher').length, 0)
    await dispatch.clickOrder(await ordinary.targetEntity('buildings', templeId))
    await wait('Exactly one genuinely trained Preacher leaves Temple', row => {
      if (!firstAdmission && row.hut?.admission?.occupants.includes(traineeId)) {
        firstAdmission = structuredClone(row); trainingAdmission = true
        writeFileSync(resolve(output, 'first-trainee-admission.json'), JSON.stringify(firstAdmission, null, 2) + '\n')
      }
      const trained = row.units.filter(u => u.kind === 'preacher' && u.hp > 0)
      if (!trained.length) return false
      assert.equal(trained.length, 1); const u = trained[0]
      if (u.inside !== null || !u.native || u.sourceIdentity !== u.nativeIdentity) return false
      assert.equal(row.units.some(u => u.id === traineeId), false)
      assert.equal(trainingAdmission, true, 'Actual trainee admission observed before replacement')
      assert.ok(row.units.some(u => retained.includes(u.id) && u.kind === 'brave' && u.hp > 0))
      preacherId = u.id; return true
    })
    await page.screenshot({ path: resolve(output, 'acquired-preacher.png') })
    assert.deepEqual(await select('preacher'), [preacherId])
    await ordinary.map(SAFE_POINTS[0])
    let safe
    for (const point of SAFE_POINTS) { safe = await ground(point); if (safe) break }
    assert.ok(safe, 'The accepted Blue-base point is unavailable')
    return { preacherId, shamanId, templeId, traineeId, firstAdmission, milestones, safe,
      read, health, log, clear, select, ground, ordinary, dispatch, started,
      acquisitionDeadline, save,
      finishAcquisition(entry) {
        check(); acquisitionComplete = true
        milestones.push({ label: 'Ordinary safe command17 entry', elapsedMs: performance.now() - started, entry })
        save('acquired')
      } }
  } catch (error) { failures.push(String(error?.stack ?? error)); save('failed'); throw error }
}
