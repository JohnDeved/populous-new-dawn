import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { installMission1MoveWitness } from './mission1-vault-arrival.mjs'
import { installLandBridgeFeedbackWitness } from './land-bridge-feedback-witness.mjs'

export function readLandBridgeRoute() {
  const scene = window.testSceneRef.current,
    world = scene.world
  if (world !== window.testStore.getWorld() || world.outcome.level !== 1)
    throw new Error('M1 scene/store mismatch')
  return {
    turn: world.turn,
    time: world.time,
    speed: world.speed,
    status: world.status,
    paused: world.paused,
    inputMask: world.inputMask,
    mode: world.mode,
    selected: [...world.selected],
    bridgeShots: world.shots.bridge,
    bridgeGifts: world.giftCounts.bridge,
    bridges: world.stats.bridges,
    bridgeHead: structuredClone(
      world.shrines.find(head => head.reward === 'bridge' && head.x === -5 && head.z === 25)
    ),
    shaman: structuredClone(
      world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0)
        .map(unit => ({ id: unit.id, x: unit.x, z: unit.z, hp: unit.hp }))
    ),
    started: scene.started,
    canvasConnected: scene.renderer.domElement.isConnected,
    loading: !!document.querySelector('.loading-world'),
  }
}

export default async function landBridgeFeedback({ page, openMission, output, signal, receipt }) {
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const report = {
    source: receipt.source,
    status: 'running',
    actions: [],
    limits:
      'One ordinary earned M1 Bridge cast and visible acknowledgment only; no crossing, campaign, native raster or hardware performance claim.',
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'land-bridge-feedback.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  const read = () => page.evaluate(readLandBridgeRoute)
  let originalShamanId,
    armed = false,
    failed = false,
    failure
  const cleanupErrors = []
  const wait = async (predicate, argument, timeout) => {
    signal.throwIfAborted()
    await page.waitForFunction(predicate, argument, { timeout, polling: 50 })
    signal.throwIfAborted()
    assert.deepEqual(receipt.errors, [])
    const current = await read()
    assert.equal(current.speed, 1)
    assert.equal(current.status, 'playing')
    assert.ok(current.shaman.some(unit => unit.id === originalShamanId))
  }
  try {
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    const initial = await read()
    report.initial = initial
    assert.equal(initial.inputMask, 0)
    assert.equal(initial.bridgeShots, 0)
    assert.equal(initial.bridges, 0)
    assert.equal(initial.shaman.length, 1)
    assert.ok(initial.bridgeHead)
    originalShamanId = initial.shaman[0].id
    const input = createMission1VaultInput({ page, signal, report, save, originalShamanId })
    const { button, pause, resume, view, fixedGround, clickEntity, castInput } = input
    await resume()
    await button('Select and focus shaman')
    await view(initial.bridgeHead)
    report.bridgeOrder = await clickEntity('shrines', initial.bridgeHead.id, 27, false, [
      originalShamanId,
    ])
    await wait(
      ({ headId, actorId }) => {
        const world = window.testSceneRef.current.world,
          actor = world.units.find(unit => unit.id === actorId)
        if (!actor || actor.hp <= 0) throw new Error('Original Shaman lost during Bridge worship')
        return world.shots.bridge > 0 && world.shrines.find(head => head.id === headId)?.uses > 0
      },
      { headId: initial.bridgeHead.id, actorId: originalShamanId },
      180000
    )
    report.bridgeReward = await read()
    save()
    assert.equal(report.bridgeReward.bridgeShots, 1)
    assert.ok(report.bridgeReward.bridgeGifts > initial.bridgeGifts)
    await button('Select and focus shaman')
    await view({ x: 0.5, z: 19 })
    await resume()
    const { hit, delivered } = await input.moveGround({ x: 0.5, z: 19 })
    const recipient = delivered.after.units.find(unit => unit.id === originalShamanId)
    report.shore = { hit, delivered, observation: null }
    save()
    let moving = false,
      moveFailed = false,
      moveFailure
    try {
      await page.evaluate(installMission1MoveWitness, {
        id: originalShamanId,
        point: hit.point,
        orderId: recipient.orderId,
        order: recipient.order,
        acknowledgedTurn: delivered.after.lastOrderTurn,
      })
      moving = true
      await wait(
        () => {
          const evidence = window.mission1MoveEvidence
          if (evidence.errors.length) throw new Error(evidence.errors.join('\n'))
          return !!evidence.completed
        },
        null,
        180000
      )
    } catch (error) {
      moveFailed = true
      moveFailure = error
    } finally {
      report.shore.observation = await page
        .evaluate(
          moving =>
            moving ? window.restoreMission1MoveWitness() : (window.mission1MoveEvidence ?? null),
          moving
        )
        .catch(error => ({ error: String(error) }))
      try {
        save()
      } catch (error) {
        if (!moveFailed) {
          moveFailed = true
          moveFailure = error
        }
      }
    }
    if (moveFailed) throw moveFailure
    assert.equal(report.shore.observation.restored, true)
    assert.deepEqual(report.shore.observation.errors, [])
    await pause()
    await view({ x: 0, z: 12 })
    report.beforeKey = await read()
    assert.equal(report.beforeKey.inputMask, 0)
    await page.keyboard.press('2')
    assert.equal((await read()).mode, 'bridge')
    const point = await fixedGround({ x: 0, z: 4 }, 'bridge')
    assert.equal(point.rejection, null, JSON.stringify(point))
    assert.ok(point.margin >= point.minimumMargin)
    await page.evaluate(installLandBridgeFeedbackWitness, { actorId: originalShamanId })
    armed = true
    await resume()
    report.cast = { point, delivered: await castInput(point, 'bridge') }
    save()
    const cast = report.cast.delivered
    const fresh = cast.after.projectiles.filter(
      shot => !cast.before.projectiles.some(prior => prior.id === shot.id)
    )
    assert.equal(fresh.length, 1)
    assert.equal(fresh[0].caster, originalShamanId)
    assert.equal(fresh[0].spell, 'bridge')
    assert.equal(fresh[0].phase, 'windup')
    assert.equal(fresh[0].remaining, 6)
    assert.equal(cast.before.stock, 1)
    assert.equal(cast.after.stock, 0)
    await wait(
      () => {
        const status = window.landBridgeFeedback.status()
        if (status.errors.length) throw new Error(status.errors.join('\n'))
        return status.done
      },
      null,
      30000
    )
    // First visible DOM facts are already frozen in-page. Capture pixels before
    // serializing the full report; the screenshot does not force game rendering.
    report.screenshotBefore = await page.evaluate(() => window.landBridgeFeedback.current())
    await page.screenshot({ path: resolve(output, 'land-bridge-first-visible.png') })
    report.screenshotAfter = await page.evaluate(() => window.landBridgeFeedback.current())
    report.observation = await page.evaluate(() => window.landBridgeFeedback.close())
    armed = false
    save()
    for (const snapshot of [
      report.screenshotBefore,
      report.screenshotAfter,
      report.observation.firstVisible,
    ]) {
      assert.equal(snapshot?.visible, true)
      assert.equal(snapshot.message, 'Land Bridge cast.')
      assert.ok(snapshot.messageUntil > snapshot.time)
      assert.equal(snapshot.routeNotice, null)
      assert.match(snapshot.text, /^✧\s*Land Bridge cast\.$/)
    }
    const witness = report.observation
    assert.equal(witness.restored, true)
    assert.deepEqual(witness.errors, [])
    assert.equal(witness.birth.projectile.id, fresh[0].id)
    assert.equal(witness.birth.projectile.caster, originalShamanId)
    assert.equal(witness.birth.effect.id, witness.consumed.effectId)
    assert.equal(witness.birth.effect.id, witness.firstVisible.effectId)
    assert.equal(witness.birth.effect.bridge.turn, 0)
    report.status = 'passed'
  } catch (error) {
    failed = true
    failure = error
    report.status = 'failed'
    report.failure = String(error?.stack ?? error)
  } finally {
    if (armed)
      try {
        report.observation = await page.evaluate(() => window.landBridgeFeedback.close())
      } catch (error) {
        cleanupErrors.push(String(error?.stack ?? error))
        if (!failed) {
          failed = true
          failure = error
        }
      }
    report.cleanupErrors = cleanupErrors
    if (failed) report.status = 'failed'
    try {
      save()
    } catch (error) {
      if (!failed) {
        failed = true
        failure = error
      }
    }
  }
  if (failed) throw failure
  return report
}
