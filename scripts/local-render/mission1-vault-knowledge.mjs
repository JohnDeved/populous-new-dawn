// One ordinary Mission1 episode. The maintained local-render/harness.mjs owns
// the server, browser and timeout. No clock, stock, World or renderer injection.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { readMission1ContinuationSeed } from './mission1-vault-continue.mjs'
import { bindGame, waitForShamanReadiness } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { installMission1MoveWitness } from './mission1-vault-arrival.mjs'
import { readMission1GuardPresentation } from './mission1-vault-guard-observation.mjs'
import { installMission1VaultWitness, readMission1VaultProgress } from './mission1-vault-witness.mjs'
import { installMission1VaultCheckpointState, readMission1VaultCheckpoint, installMission1VaultLoadWitness } from './mission1-vault-checkpoint.mjs'
import { findMission1CampGround, installMission1CampConstruction } from './mission1-vault-construction.mjs'

export function readMission1VaultRoute() {
  const s = window.testSceneRef.current, w = s.world
  if (w !== window.testStore.getWorld() || w.outcome.level !== 1) throw Error('Mission1 scene/store mismatch')
  const copyUnit = u => ({ id: u.id, kind: u.kind, team: u.team, x: u.x, z: u.z, hp: u.hp, inside: u.inside, work: u.work })
  return { turn: w.turn, time: w.time, paused: w.paused, speed: w.speed, status: w.status, mode: w.mode,
    selected: [...w.selected], camp: w.unlockedCamp, bridgeShots: w.shots.bridge, bridgeGifts: w.giftCounts.bridge,
    bridges: w.stats.bridges, landVersion: w.landVersion, blastShots: w.shots.blast,
    bridgeHead: structuredClone(w.shrines.find(h => h.reward === 'bridge' && h.x === -5 && h.z === 25)),
    vault: structuredClone(w.shrines.find(h => h.kind === 'vault' && h.mode === 4 && h.reward === 'camp' && h.x === -5 && h.z === -3)),
    projectiles: w.projectiles.map(p => ({ id: p.id, spell: p.spell, caster: p.caster })),
    blue: w.units.filter(u => u.team === 'blue' && u.hp > 0).map(copyUnit),
    red: w.units.filter(u => u.team === 'red').map(copyUnit),
    buildings: w.buildings.map(b => ({ id: b.id, x: b.x, z: b.z, kind: b.kind, team: b.team, hp: b.hp, progress: b.progress, logs: b.logs })) }
}

// Match live-command.ts's action gate and spell-casting.ts's tribe cooldown owner.
// Unit.cooldown belongs to follower combat and cannot establish spell readiness.
export function mission1BlastReady(id) {
  const w = window.testSceneRef.current.world, u = w.units.find(u => u.id === id)
  if (!u || u.hp <= 0 || u.kind !== 'shaman' || u.team !== 'blue')
    throw Error('Original Shaman lost before Blast')
  const tribe = w.castingTribes[0], playerType = w.manaTribes[0].playerType
  const castingReady = !!(tribe.flags & 0x80000) || !tribe.cooldown && (playerType !== 1 || !tribe.aiCooldown)
  return w.shots.blast > 0 && u.lift <= 0 && !u.casting && castingReady
}

// The approach feasibility bound requires the actual acknowledged payload to
// preserve the picked point; native coastal/building corrections must fail it.
export function assertMission1ApproachPayload(approach, actorId) {
  const point = approach.hit.point, recipient = approach.delivered.after.units.find(u => u.id === actorId)
  const expected = { a: Math.round((point.x + 8) * 256) & 65535, b: Math.round((-point.z - 8) * 256) & 65535 }
  assert.ok(recipient?.orderId && recipient.order?.model === 3 && !(recipient.order.flags & 1), 'Original acknowledged approach order required')
  assert.deepEqual({ a: recipient.order.a, b: recipient.order.b }, expected, 'Approach payload was coast/building-corrected; range bound does not apply')
  return { actorId, orderId: recipient.orderId, pickedNative: expected, order: { ...recipient.order } }
}

export default async function mission1VaultKnowledge({ page, openMission, output, signal, receipt, continueSaved946 = false }) {
  const hash = value => createHash('sha256').update(value).digest('hex')
  const files = ['mission1-vault-knowledge.mjs', 'mission1-vault-input.mjs', 'mission1-vault-witness.mjs', 'mission1-vault-checkpoint.mjs', 'mission1-vault-construction.mjs', 'mission1-vault-arrival.mjs', 'mission1-vault-guard-observation.mjs', 'mission1-vault-continue.mjs']
  const report = { source: receipt.source, entry: continueSaved946 ? 'public-saved946-continuation' : 'fresh-Mission1', status: 'running', actions: [], captures: {},
    helpers: Object.fromEntries(files.map(file => [file, hash(readFileSync(new URL(file, import.meta.url)))])),
    provenance: { bridge: 'scripts/local-render/hut-smoke-ignition.mjs:373-419 @ e649af3c51be5e1f6131809c900789b607ef7fb2',
      observer: 'Mission3 a6b302d5, tightened for missed birth and exact first1417',
      construction: 'ordinary-shared-training.mjs @ a3d3f2f92a7dc7e84f54f6ddac9f6c989b0ee435',
      input: 'qa/erosion-ordinary/input.mjs' },
    limits: 'Ordinary Mission1 bank-c camp marker/gift and construction only. Real RAF at speed1. Software/headless pixels do not establish native raster, absolute animation cadence or hardware performance.' }
  const save = () => writeFileSync(resolve(output, 'mission1-vault-knowledge.json'), JSON.stringify(report, null, 2) + '\n')
  const read = () => page.evaluate(readMission1VaultRoute)
  let originalShamanId, witnessInstalled = false, constructionInstalled = false
  const wait = async (predicate, detail = null, timeout = 30000) => {
    signal.throwIfAborted()
    await page.waitForFunction(predicate, detail, { timeout, polling: 50 })
    signal.throwIfAborted()
    assert.deepEqual(receipt.errors, [])
    const s = await read()
    assert.equal(s.speed, 1); assert.equal(s.status, 'playing')
    assert.ok(s.blue.some(u => u.id === originalShamanId && u.kind === 'shaman' && u.hp > 0), 'Original Shaman must remain alive')
  }
  const capture = async name => {
    const snapshot = await page.evaluate(() => window.readVaultWitness())
    report.captures[name] = snapshot
    await page.screenshot({ path: resolve(output, `${name}.png`) }); save()
    return snapshot
  }
  const finishWitness = async epoch => {
    const pixels = await page.evaluate(() => window.vaultRenderedPixels ?? {})
    for (const [stage, uri] of Object.entries(pixels)) {
      assert.match(uri, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
      const bytes = Buffer.from(uri.slice('data:image/png;base64,'.length), 'base64')
      const file = `${epoch}-${stage}-first-real-render.png`
      writeFileSync(resolve(output, file), bytes)
      report.frames ??= {}; report.frames[`${epoch}-${stage}`] = { file, sha256: hash(bytes) }
    }
    const witness = await page.evaluate(() => window.restoreVaultWitness())
    witnessInstalled = false; report.witnesses ??= {}; report.witnesses[epoch] = witness; save()
    assert.equal(witness.restored, true); assert.deepEqual(witness.errors, [])
    return witness
  }
  try {
    let initial, saved, guard
    if (continueSaved946) {
      const seed = await readMission1ContinuationSeed(page, receipt)
      saved = seed.saved; originalShamanId = seed.originalShamanId
      report.continuation = seed.provenance
    } else {
      await openMission(1)
      report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
      initial = report.initial = await read()
      assert.equal(initial.speed, 1); assert.equal(initial.camp, false); assert.equal(initial.bridgeShots, 0)
      originalShamanId = initial.blue.find(u => u.kind === 'shaman')?.id
      assert.ok(originalShamanId && initial.bridgeHead && initial.vault)
      guard = initial.red.find(u => u.kind === 'brave' && Math.hypot(u.x + 9, u.z + 3) < 3)
      assert.ok(guard, 'Retain authored record43 Red guard identity at the opening')
      report.guardId = guard.id
    }
    const input = createMission1VaultInput({ page, signal, report, save, originalShamanId })
    const { button, pause, resume, view, fixedGround, clickEntity, castInput } = input
    const clear = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const current = await read()
        if (!current.mode && !current.selected.length) return
        await page.keyboard.press('Escape')
      }
      assert.fail('Public Escape did not clear mode and selection')
    }
    const move = async (point, cellMove = false) => {
      await button('Select and focus shaman'); await view(point); await resume()
      const { hit, delivered } = await input.moveGround(point, cellMove)
      const recipient = delivered.after.units.find(unit => unit.id === originalShamanId)
      const movement = { hit, delivered, status: 'running' }
      report.movements ??= []; report.movements.push(movement); save()
      let installed = false
      try {
        await page.evaluate(installMission1MoveWitness, { id: originalShamanId, point: hit.point,
          orderId: recipient.orderId, order: recipient.order, acknowledgedTurn: delivered.after.lastOrderTurn })
        installed = true
        await wait(() => {
          const e = window.mission1MoveEvidence
          if (e.errors.length) throw Error(e.errors.join('\n'))
          return !!e.completed
        }, null, 180000)
        movement.status = 'passed'
      } catch (error) { movement.status = 'failed'; movement.failure = String(error.stack ?? error); throw error }
      finally {
        movement.observation = await page.evaluate(installed => installed
          ? window.restoreMission1MoveWitness() : window.mission1MoveEvidence ?? null, installed)
          .catch(error => ({ observationError: String(error) }))
        save()
      }
      assert.equal(movement.observation.restored, true); assert.deepEqual(movement.observation.errors, [])
      return { hit, delivered, movement: movement.observation, arrived: await read() }
    }
    if (!continueSaved946) {
      // Accepted Bridge-first prefix: real command27, earned stock, checked shore,
      // public key2 and real projectile/terrain completion, original Shaman throughout.
      await resume(); await button('Select and focus shaman'); await view(initial.bridgeHead)
      report.bridgeOrder = await clickEntity('shrines', initial.bridgeHead.id, 27, false, [originalShamanId])
      await wait(({ headId, actorId }) => {
        const w = window.testSceneRef.current.world, u = w.units.find(u => u.id === actorId)
        if (!u || u.hp <= 0) throw Error('Original Shaman lost during Bridge worship')
        return w.shots.bridge > 0 && w.shrines.find(h => h.id === headId)?.uses > 0
      }, { headId: initial.bridgeHead.id, actorId: originalShamanId }, 180000)
      report.bridgeReward = await read()
      assert.ok(report.bridgeReward.bridgeGifts > initial.bridgeGifts)
      report.shore = await move({ x: 0.5, z: 19 })
      await pause(); await view({ x: 0, z: 12 })
      await page.keyboard.press('2'); assert.equal((await read()).mode, 'bridge')
      const bridgePoint = await fixedGround({ x: 0, z: 4 }, 'bridge')
      assert.equal(bridgePoint.rejection, null, JSON.stringify(bridgePoint)); assert.ok(bridgePoint.margin >= bridgePoint.minimumMargin)
      await resume()
      const bridgeBefore = await read(), bridgeDelivery = await castInput(bridgePoint, 'bridge'), bridgeAfter = await read()
      report.bridgeCast = { point: bridgePoint, before: bridgeBefore, delivered: bridgeDelivery, after: bridgeAfter }; save()
      assert.ok(bridgeAfter.projectiles.some(p => p.spell === 'bridge' && p.caster === originalShamanId &&
        !bridgeBefore.projectiles.some(old => old.id === p.id)) || bridgeAfter.bridges > bridgeBefore.bridges)
      await wait(({ actorId, bridges }) => {
        const w = window.testSceneRef.current.world, u = w.units.find(u => u.id === actorId)
        if (!u || u.hp <= 0) throw Error('Original Shaman lost while Bridge completed')
        return w.stats.bridges > bridges && !w.effects.some(e => e.bridge) && !w.projectiles.some(p => p.spell === 'bridge')
      }, { actorId: originalShamanId, bridges: bridgeBefore.bridges }, 60000)
      report.completedBridge = await read()
      assert.ok(report.completedBridge.landVersion > bridgeBefore.landVersion)
      report.crossing = await move({ x: 0, z: 4 }, true)
      // Authored approach cell is outside the Vault footprint; real input and movement still must succeed.
      report.guardApproach = await move({ x: -5, z: 3 })
      report.guardApproach.payloadCorrespondence = assertMission1ApproachPayload(report.guardApproach, originalShamanId); save()
      // The existing Red guard is an ordinary gameplay prerequisite. If still near
      // the approach, use genuine Blast stock and let normal damage/retreat resolve.
      report.guardCasts = []
      for (let attempt = 0; attempt < 6; attempt++) {
        const current = (await read()).red.find(u => u.id === guard.id)
        if (!current || current.hp <= 0 || Math.hypot(current.x + 5, current.z + 3) > 14) break
        await resume()
        await wait(mission1BlastReady, originalShamanId, 120000)
        await pause(); await button('Select and focus shaman'); await view(current)
        await page.keyboard.press('1'); assert.equal((await read()).mode, 'blast')
        await resume()
        const currentGuard = (await read()).red.find(u => u.id === guard.id)
        if (!currentGuard || currentGuard.hp <= 0 || Math.hypot(currentGuard.x + 5, currentGuard.z + 3) > 14) break
        const presentation = await page.evaluate(readMission1GuardPresentation, guard.id)
        const hit = await fixedGround(currentGuard, 'blast')
        report.actions.push({ label: 'guard-blast-probe', attempt, guard: currentGuard, presentation, hit }); save()
        assert.equal(hit.rejection, null, JSON.stringify(hit))
        const delivered = await castInput(hit, 'blast')
        await wait(({ id, hp, x, z }) => {
          const w = window.testSceneRef.current.world, u = w.units.find(u => u.id === id)
          return !u || u.hp < hp || Math.hypot(u.x - x, u.z - z) > 2
        }, currentGuard, 30000)
        report.guardCasts.push({ before: currentGuard, hit, delivered, after: (await read()).red.find(u => u.id === guard.id) }); save()
      }
      const afterGuard = (await read()).red.find(u => u.id === guard.id)
      assert.ok(!afterGuard || afterGuard.hp <= 0 || Math.hypot(afterGuard.x + 5, afterGuard.z + 3) > 14, 'Guard still threatens Vault approach')
      await pause(); await clear(); await button('Select and focus shaman'); await view(initial.vault)
      await page.evaluate(installMission1VaultWitness); witnessInstalled = true
      await resume(); await wait(() => !!window.vaultEvidence.stages.preflight?.postRender)
      await pause()
      const marker = await capture('camp-marker-before-save')
      assert.equal(marker.marker?.visible, true); assert.equal(marker.marker?.family, 'hfx'); assert.equal(marker.marker?.body, 1077)
      assert.ok(marker.marker.glow.frame >= 1417 && marker.marker.glow.frame <= 1430)
      // A baseline product stops above with its actual rendered marker retained.
      for (let attempt = 0; attempt < 3 && !(await page.evaluate(() => window.readVaultWitness().state.shrine.glow?.f1)); attempt++) {
        await resume(); await wait(() => !!window.readVaultWitness().state.shrine.glow?.f1); await pause()
      }
      await page.evaluate(installMission1VaultCheckpointState)
      const paused = await page.evaluate(() => window.mission1VaultCheckpointState(window.testSceneRef.current.world))
      assert.notEqual(paused.glow.f1, 0); assert.equal(paused.active, true); assert.equal(paused.camp, false); assert.equal(paused.gifts, 0)
      assert.ok(paused.bridges > initial.bridges)
      await button('Game settings'); await button('Save checkpoint')
      assert.equal(await waitForCheckpointReadback(async () => {
        signal.throwIfAborted(); saved = await page.evaluate(readMission1VaultCheckpoint)
        return saved?.turn === paused.turn && saved?.level === 1
      }), true)
      assert.deepEqual(saved, paused)
      await finishWitness('preload')
      await page.reload({ waitUntil: 'domcontentloaded' })
    }
    const startup = page.getByRole('dialog', { name: 'Start game', exact: true })
    await startup.waitFor({ state: 'visible' })
    await page.evaluate(installMission1VaultCheckpointState); await page.evaluate(installMission1VaultLoadWitness)
    await startup.getByRole('button', { name: 'Load Game', exact: true }).click()
    const boundary = await page.evaluate(() => ({ loaded: window.vaultLoadedBoundary, error: window.vaultLoadedError }))
    report.checkpoint = { saved, loadedBeforeResume: boundary.loaded, loadError: boundary.error, scope: continueSaved946
      ? 'Verified full stored946 digest; public Load Game matches bounded synchronous snapshot; prefix not replayed'
      : 'Same browser context; actual reload and public Load Game; no cross-process persistence claim' }; save()
    assert.equal(boundary.error, null); assert.deepEqual(boundary.loaded, saved)
    await bindGame(page); await waitForShamanReadiness(page); await pause()
    initial ??= report.initial = await read()
    await page.evaluate(installMission1VaultWitness); witnessInstalled = true
    await page.evaluate(() => { window.vaultEvidence.arm = null })
    await clear(); await button('Select and focus shaman'); await view(initial.vault)
    const postLoad = await capture('camp-marker-after-load')
    assert.equal(postLoad.marker?.body, 1077); assert.equal(postLoad.marker?.visible, true)
    assert.ok((await read()).blue.some(u => u.id === originalShamanId))
    await page.evaluate(() => { window.vaultEvidence.arm = 'birth' })
    await resume()
    report.vaultOrder = await clickEntity('shrines', initial.vault.id, 33, false, [originalShamanId]); save()
    await wait(id => {
      const e = window.vaultEvidence, w = window.testSceneRef.current.world, u = w.units.find(u => u.id === id)
      if (e.errors.length) throw Error(e.errors.join('\n'))
      if (!u || u.hp <= 0) throw Error('Original Shaman lost during Vault acquisition')
      return !!e.stages.payout?.postRender
    }, originalShamanId, 300000)
    await pause(); await capture('camp-unlocked')
    report.route = await page.evaluate(readMission1VaultProgress, originalShamanId)
    const witness = await finishWitness('acquisition'), stages = witness.stages
    assert.deepEqual([stages.birth.afterTurn.gift.remaining, stages.birth.afterTurn.gift.phase], [82, 6])
    assert.equal(stages.birth.beforeTurn.shrine.active, true); assert.equal(stages.birth.afterTurn.shrine.active, false)
    assert.equal(stages.birth.afterTurn.gift.independentGlow, true)
    assert.equal(stages.birth.postRender.gift.visible, true); assert.equal(stages.birth.postRender.gift.body, 1077)
    assert.equal(stages.birth.postRender.gift.glow.frame, 1417); assert.equal(stages.birth.postRender.marker.visible, false)
    assert.equal(stages.retirement.afterTurn.turn - stages.birth.afterTurn.turn, 6)
    assert.equal(stages.retirement.afterTurn.gift.remaining, 76); assert.equal(stages.retirement.postRender.gift.visible, false)
    assert.equal(stages.retirement.afterTurn.camp, false)
    assert.equal(stages.payout.afterTurn.turn - stages.birth.afterTurn.turn, 82)
    assert.equal(stages.payout.beforeTurn.gift.remaining, 1); assert.equal(stages.payout.beforeTurn.camp, false)
    assert.equal(stages.payout.afterTurn.camp, true); assert.equal(stages.payout.afterTurn.gift, undefined)
    // Actual opening Braves and home-island ground, then public construction UI.
    await clear(); await page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Control'] })
    const cohort = await read(), ids = cohort.selected
    assert.ok(ids.length > 0 && ids.every(id => cohort.blue.some(u => u.id === id && u.kind === 'brave' && u.z >= 19)))
    const home = initial.blue.filter(u => u.kind === 'brave').reduce((a, u, _, all) => ({ x: a.x + u.x / all.length, z: a.z + u.z / all.length }), { x: 0, z: 0 })
    await view(home)
    const ground = await page.evaluate(findMission1CampGround, { point: home, radius: 14, ids })
    assert.ok(ground?.reachable.length, 'No reachable owned home-island camp placement')
    assert.deepEqual(ground.selected, ids)
    await resume(); await button('buildings B'); await button('Warrior Training Hut, 8 wood')
    const beforeBuild = await read(); assert.equal(beforeBuild.mode, 'camp'); assert.deepEqual(beforeBuild.selected, ids)
    const placement = await page.evaluate(async ({ ground, ids }) => {
      const { placementError } = await import('/app/model.ts')
      const { inspectEntityPoint, observeEntityPointer } = await import('/qa/erosion-ordinary/input.mjs')
      const s = window.testSceneRef.current, w = s.world, pick = inspectEntityPoint(s, 'buildings', ground)
      const point = s.pick({ clientX: ground.x, clientY: ground.y })
      if (!pick.canvasOwned || pick.hitId !== null || !point || Math.hypot(point.x - ground.point.x, point.z - ground.point.z) > 0.05 ||
        JSON.stringify(w.selected) !== JSON.stringify(ids) || w.mode !== 'camp' || w.paused || placementError(structuredClone(w), 'camp', point)) return { ok: false, pick, point }
      window.mission1CampPointer = observeEntityPointer(s, document, null)
      return { ok: true, pick, point }
    }, { ground, ids })
    assert.equal(placement.ok, true, JSON.stringify(placement))
    let delivered
    try { await page.mouse.click(ground.x, ground.y) }
    finally { delivered = await page.evaluate(() => { const result = window.mission1CampPointer.finish(); delete window.mission1CampPointer; return result }) }
    assert.deepEqual(delivered.errors, []); assert.equal(delivered.restored, true)
    assert.deepEqual(delivered.events.map(e => [e.type, e.trusted, e.canvasOwned, e.canvasTarget, e.button]),
      ['pointerdown', 'pointerup'].map(type => [type, true, true, true, 0]))
    const plans = (await read()).buildings.filter(b => b.kind === 'camp' && b.team === 'blue' && !beforeBuild.buildings.some(old => old.id === b.id))
    assert.equal(plans.length, 1); assert.ok(plans[0].progress < 1 && plans[0].z >= 19)
    report.constructionInput = { home, ids, ground, placement, delivered, plan: plans[0] }; save()
    await page.evaluate(installMission1CampConstruction, plans[0].id); constructionInstalled = true
    await wait(() => {
      const e = window.mission1CampConstruction
      if (e.errors.length) throw Error(e.errors.join('\n'))
      return !!e.completed
    }, null, 240000)
    await pause()
    report.construction = await page.evaluate(() => window.restoreMission1CampConstruction()); constructionInstalled = false
    assert.equal(report.construction.restored, true); assert.deepEqual(report.construction.errors, [])
    assert.ok(report.construction.carried.length && report.construction.delivered.length, 'Retain ordinary timber carrying and log delivery')
    assert.equal(report.construction.completed.progress, 1)
    await page.screenshot({ path: resolve(output, 'home-island-camp-completed.png') })
    assert.deepEqual(receipt.errors, []); report.status = 'passed'; return report
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack ?? error); throw error }
  finally {
    if (witnessInstalled) try { await finishWitness('unfinished') } catch (error) { report.cleanupError = String(error); report.status = 'failed' }
    if (constructionInstalled) report.construction = await page.evaluate(() => window.restoreMission1CampConstruction()).catch(error => ({ error: String(error) }))
    await page.evaluate(() => window.restoreVaultLoadWitness?.()).catch(() => {})
    save()
  }
}
