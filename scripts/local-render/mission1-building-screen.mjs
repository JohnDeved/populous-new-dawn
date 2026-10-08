// Ordinary M1 screen acquisition only. The maintained harness owns runtime,
// fresh profile and timeout. No World/clock/RAF/render/storage injection.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { bindGame, waitForShamanReadiness } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { installMission1MoveWitness } from './mission1-vault-arrival.mjs'
import { readMission1GuardPresentation } from './mission1-vault-guard-observation.mjs'
import { installMission1VaultCheckpointState, installMission1VaultSaveWitness,
  readMission1VaultCheckpoint, installMission1VaultLoadWitness } from './mission1-vault-checkpoint.mjs'
import { installMission1BuildingScreenWitness } from './mission1-building-screen-witness.mjs'

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

export default async function mission1BuildingScreen({ page, openMission, output, signal, receipt, observeCheckpoint }) {
  assert.equal(receipt.profile?.mode, 'created', 'Changed product requires a fresh task profile')
  assert.equal(receipt.profile.checkpointAtStart, null, 'Fresh M1 entry must not adopt a historical checkpoint')
  const hash = value => createHash('sha256').update(value).digest('hex')
  const report = { source: receipt.source, status: 'running', actions: [], frames: {}, epochs: {},
    limits: 'M1 screen/ownership only, real RAF/speed1. PR269 unchanged world-art carry requires exact correspondence. No original GPU, cadence, hardware-performance or campaign claim.' }
  const save = () => writeFileSync(resolve(output, 'mission1-building-screen.json'), JSON.stringify(report, null, 2) + '\n')
  const read = () => page.evaluate(readMission1VaultRoute)
  let originalShamanId, installed = false, primary, failed = false
  const wait = async (predicate, detail = null, timeout = 30000) => {
    signal.throwIfAborted()
    await page.waitForFunction(predicate, detail, { timeout, polling: 50 })
    signal.throwIfAborted(); assert.deepEqual(receipt.errors, [])
    const current = await read()
    assert.equal(current.speed, 1); assert.equal(current.status, 'playing')
    assert.ok(current.blue.some(u => u.id === originalShamanId && u.kind === 'shaman' && u.hp > 0))
  }
  const screenWait = (goal, timeout = 300000) => wait(goal => {
    const status = window.m1BuildingScreen.status()
    if (status.errors.length) throw Error(status.errors.join('\n'))
    return goal === 'whole' ? status.whole : status.terminal && status.grants === 1
  }, goal, timeout)
  const retain = async (epoch, close = false) => {
    let evidence
    try { evidence = await page.evaluate(close => close ? window.m1BuildingScreen.close() : window.m1BuildingScreen.read(), close) }
    finally { if (close) installed = false }
    for (const [stage, frame] of Object.entries(evidence.frames)) for (const field of ['overlayPng', 'buildingPng']) {
      const uri = frame[field]
      if (!uri) continue
      assert.match(uri, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
      const bytes = Buffer.from(uri.slice('data:image/png;base64,'.length), 'base64'), sha256 = hash(bytes)
      const file = `${epoch}-${stage}-${field === 'buildingPng' ? 'building' : 'overlay'}.png`, path = resolve(output, file)
      if (existsSync(path)) assert.equal(hash(readFileSync(path)), sha256, 'First captured pixels must not be replaced')
      else writeFileSync(path, bytes, { flag: 'wx' })
      report.frames[file] = { sha256, bytes: bytes.length }; delete frame[field]
    }
    report.epochs[epoch] = evidence; save()
    return evidence
  }
  const requireEpoch = (evidence, resumed = false) => {
    assert.equal(evidence.restored, true); assert.deepEqual(evidence.errors, [])
    assert.equal(evidence.handoffs, resumed ? 0 : 1); assert.equal(evidence.grants, 1)
    const grant = evidence.stages.grant
    assert.equal(grant.after.turn - evidence.birth.turn, 82)
    assert.equal(grant.before.gift.remaining, 1); assert.equal(grant.before.camp, false)
    assert.equal(grant.after.gift, undefined); assert.equal(grant.after.camp, true)
    if (!resumed) {
      assert.equal(evidence.stages.hide.turn - evidence.birth.turn, 6)
      assert.equal(evidence.stages.hide.gift.remaining, 76)
      assert.equal(evidence.stages.beforeGrant.gift.remaining, 1)
      assert.ok(evidence.frames.whole?.opaquePixels > 0 && evidence.frames.flight?.opaquePixels > 0)
      assert.ok(evidence.stages.handoff.hud.selected && evidence.stages.handoff.hud.disabled)
    }
    assert.ok(evidence.frames.terminal)
  }
  try {
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    const initial = report.initial = await read()
    assert.equal(initial.speed, 1); assert.equal(initial.camp, false); assert.equal(initial.bridgeShots, 0)
    originalShamanId = initial.blue.find(u => u.kind === 'shaman')?.id
    const guard = initial.red.find(u => u.kind === 'brave' && Math.hypot(u.x + 9, u.z + 3) < 3)
    assert.ok(originalShamanId && guard && initial.bridgeHead && initial.vault)
    report.guardId = guard.id
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
    await page.evaluate(installMission1VaultCheckpointState)
    // Retain PR269's genuine nonzero-cursor save without recapturing unchanged art.
    for (let attempt = 0; attempt < 3 && !(await page.evaluate(() =>
      window.mission1VaultCheckpointState(window.testSceneRef.current.world).glow?.f1)); attempt++) {
      await resume(); await wait(() => !!window.mission1VaultCheckpointState(window.testSceneRef.current.world).glow?.f1); await pause()
    }
    const saveCurrent = async (label, active = false) => {
      await button('Game settings')
      await page.evaluate(installMission1VaultSaveWitness)
      let boundary
      try { await button('Save checkpoint') }
      finally { boundary = await page.evaluate(() => window.restoreVaultSaveWitness?.()) }
      assert.equal(boundary?.error, null); assert.ok(boundary.saved)
      let saved
      assert.equal(await waitForCheckpointReadback(async () => {
        signal.throwIfAborted(); saved = await page.evaluate(readMission1VaultCheckpoint)
        return JSON.stringify(saved) === JSON.stringify(boundary.saved)
      }), true, 'Committed Save must match its synchronous public click')
      if (active) {
        assert.equal(saved.acquisition.controllers.building?.active, true, 'Missed naturally active Save boundary')
        assert.equal(saved.camp, false); assert.equal(saved.buildingGifts.length, 1)
      }
      const committed = await observeCheckpoint(label)
      report.checkpoints ??= []; report.checkpoints.push({ label, saved, committed }); save()
      await button('Close menu')
      return saved
    }
    const loadCurrent = async (saved, startup = false) => {
      if (!startup) await button('Game settings')
      await page.evaluate(installMission1VaultCheckpointState)
      await page.evaluate(installMission1VaultLoadWitness)
      try {
        if (startup) await page.getByRole('dialog', { name: 'Start game', exact: true })
          .getByRole('button', { name: 'Load Game', exact: true }).click()
        else await button('Load checkpoint')
        const boundary = await page.evaluate(() => ({ loaded: window.vaultLoadedBoundary, error: window.vaultLoadedError }))
        report.loads ??= []; report.loads.push(boundary); save()
        assert.equal(boundary.error, null); assert.deepEqual(boundary.loaded, saved)
      } finally { await page.evaluate(() => window.restoreVaultLoadWitness?.()) }
      await bindGame(page)
    }
    const beforeSave = await page.evaluate(() => window.mission1VaultCheckpointState(window.testSceneRef.current.world))
    assert.ok(beforeSave.glow.f1); assert.equal(beforeSave.active, true); assert.equal(beforeSave.camp, false)
    assert.equal(beforeSave.gifts, 0); assert.ok(beforeSave.bridges > initial.bridges)
    const preVault = await saveCurrent('M1 pre-vault')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
    await loadCurrent(preVault, true); await waitForShamanReadiness(page); await pause()
    await clear(); await button('Select and focus shaman'); await view(initial.vault)
    await button('buildings B')
    const card = page.getByRole('button', { name: 'Warrior Training Hut, 8 wood', exact: true })
    assert.equal(await card.isDisabled(), true)
    report.lockedCard = await card.boundingBox()
    await page.screenshot({ path: resolve(output, 'locked-camp-card.png') })
    await button('spells 1–3')
    await page.evaluate(installMission1BuildingScreenWitness, { shamanId: originalShamanId }); installed = true
    await resume()
    report.vaultOrder = await clickEntity('shrines', initial.vault.id, 33, false, [originalShamanId]); save()
    await screenWait('whole')
    await pause()
    await retain('ordinary') // Save first actual screen pixels before phase assertions.
    assert.equal(await page.evaluate(() => window.testSceneRef.current.world.worshipAcquisition.controllers.building?.active), true,
      'Natural active pause window was missed')
    const activeSave = await saveCurrent('M1 active screen', true)
    await resume(); await screenWait('terminal')
    await pause()
    const ordinary = await retain('ordinary', true)
    requireEpoch(ordinary)
    await page.screenshot({ path: resolve(output, 'camp-screen-complete.png') })
    await button('Warrior Training Hut, 8 wood'); assert.equal((await read()).mode, 'camp'); await clear()
    // Public restore reuses this run's active state, then ordinary Restart clears it.
    await loadCurrent(activeSave); await pause()
    report.activeAfterLoad = await page.evaluate(() => window.mission1VaultCheckpointState(window.testSceneRef.current.world))
    assert.equal(report.activeAfterLoad.acquisition.controllers.building?.active, true, 'Active ownership retired before restart could be observed')
    await button('Game settings'); await button('Restart world')
    await bindGame(page); await waitForShamanReadiness(page); await pause()
    report.restarted = await page.evaluate(() => window.mission1VaultCheckpointState(window.testSceneRef.current.world))
    assert.equal(report.restarted.acquisition.controllers.building, null)
    assert.equal(report.restarted.acquisition.controllers.companion, null)
    assert.equal(report.restarted.acquisition.controllers.pulse, null)
    assert.deepEqual(report.restarted.acquisition.requests, [])
    assert.equal(report.restarted.camp, false); assert.equal(report.restarted.active, true)
    assert.equal(report.restarted.buildingGifts.length, 0)
    await page.screenshot({ path: resolve(output, 'restarted-camp-locked.png') })
    // Restart must leave the genuine committed active checkpoint available.
    assert.deepEqual(await page.evaluate(readMission1VaultCheckpoint), activeSave)
    await loadCurrent(activeSave)
    await page.evaluate(installMission1BuildingScreenWitness, { shamanId: originalShamanId, birth: ordinary.birth }); installed = true
    await resume(); await screenWait('terminal')
    await pause()
    const continued = await retain('restored', true)
    requireEpoch(continued, true)
    await page.screenshot({ path: resolve(output, 'restored-camp-complete.png') })
    await button('Warrior Training Hut, 8 wood'); assert.equal((await read()).mode, 'camp')
    assert.deepEqual(receipt.errors, []); report.status = 'passed'
  } catch (error) { primary = error; failed = true; report.status = 'failed'; report.failure = String(error?.stack ?? error) }
  finally {
    if (installed) try { await retain('unfinished', true) }
    catch (error) { report.cleanupError = String(error?.stack ?? error); if (!failed) { primary = error; failed = true; report.status = 'failed' } }
    await page.evaluate(() => { window.restoreVaultLoadWitness?.(); window.restoreVaultSaveWitness?.() }).catch(error => {
      report.checkpointCleanupError = String(error); if (!failed) { primary = error; failed = true; report.status = 'failed' }
    })
    try { save() } catch (error) { if (!failed) { primary = error; failed = true } }
  }
  if (failed) throw primary
  return report
}
