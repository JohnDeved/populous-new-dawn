import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertTempleRouteHealth } from './mission3-temple-checkpoint.mjs'
import { installTempleRouteObservation } from './mission3-temple-witness.mjs'

export function assertVaultApproachEvidence(e, { requireFrames = true } = {}) {
  assert.deepEqual(e.errors, [])
  assert.deepEqual(e.cleanupErrors, [])
  assert.equal(e.restored, true)
  assert.ok(e.input && e.prayer && e.opening && e.reward && e.unlock && e.completion)
  const goals = { 1: [58112, 30976], 4: [58112, 32000], 7: [58112, 30976], 9: [58112, 29952] }
  const row = ref => e.rows[ref.index]
  for (const [phase, goal] of Object.entries(goals)) {
    const state = e.rows[e.phases[phase]]?.after
    assert.ok(state, `Missing executed Vault phase${phase}`)
    assert.equal(state.entering, false)
    assert.deepEqual([state.p.goalX, state.p.goalY], goal)
    assert.equal(state.order?.model, 33)
    assert.equal(state.order.a, 92)
    if (phase === '4') assert.equal(state.vault.model, 153)
  }
  const prayer = row(e.prayer)
  for (const state of [prayer.before, prayer.after]) {
    assert.equal(state.p.commandPhase, 2)
    assert.equal(state.entering, false)
    assert.equal(state.p.state, 10)
    assert.equal(state.p.commandStatus, 33)
    assert.equal(state.orderId, e.input.after.orderId)
    assert.equal(state.order?.model, 33)
    assert.equal(state.order.a, 92)
    assert.equal(state.p.workTarget, 92)
    assert.deepEqual([state.p.goalX, state.p.goalY], goals[1])
    assert.ok(Math.abs(state.p.x - 58112) <= 11 && Math.abs(state.p.y - 30976) <= 11)
    assert.equal(state.occupied, false)
    assert.equal(state.vault.model, 154)
    assert.equal(state.morph, null)
    assert.equal(state.vault.uses, 0)
    assert.equal(state.vault.forced, false)
  }
  assert.ok(prayer.after.vault.work > prayer.before.vault.work)
  const opening = row(e.opening),
    reward = row(e.reward),
    unlock = row(e.unlock)
  assert.ok(
    e.phases[1] < e.prayer.index &&
      e.prayer.index < e.opening.index &&
      e.opening.index < e.phases[4] &&
      e.phases[4] < e.reward.index &&
      e.reward.index < e.phases[7] &&
      e.phases[7] < e.phases[9] &&
      e.phases[9] < e.completion.index
  )
  assert.ok(opening.before.vault.work >= opening.before.vault.target)
  assert.equal(opening.after.morph.to, 153)
  assert.deepEqual([reward.before.vault.uses, reward.after.vault.uses], [0, 1])
  assert.equal(reward.after.gift.id, e.reward.giftId)
  assert.equal(reward.after.gift.remaining, 82)
  assert.equal(reward.after.unlocked, false)
  assert.ok(e.unlock.index > e.reward.index)
  assert.equal(e.giftVisits, 82)
  assert.equal(unlock.before.gift.remaining, 1)
  assert.equal(unlock.after.unlocked, true)
  const labels = e.frames.map(f => f.label)
  if (requireFrames)
    for (const label of ['approach', 'prayer', 'entry'])
      assert.ok(labels.includes(label), `Missing natural ${label} pixels`)
  for (const frame of e.frames) {
    assert.equal(frame.afterFrame, frame.beforeFrame + 1)
    const phase = { approach: 1, prayer: 2, entry: 4, 'entry-gap-phase5': 5 }[frame.label]
    assert.equal(frame.state.p.commandPhase, phase)
    assert.equal(frame.state.entering, false)
    assert.ok(frame.png?.startsWith('data:image/png;base64,') || frame.file)
  }
  return {
    endpointWorkOrdering: 'passed',
    rewardTurn: reward.after.turn,
    unlockTurn: unlock.after.turn,
    completionTurn: row(e.completion).after.turn,
    preOpenFootprintSamples: e.crossings.count,
    approachPath: e.crossings.count
      ? 'Residual pre-open footprint crossings observed'
      : 'No crossing in retained turn samples',
    pixels: requireFrames
      ? 'Pending independent inspection of phase-labelled images'
      : 'Not evaluated by CPU contracts',
    scope:
      'One ordinary M3 endpoint/work/entry/reward/departure. No global collision, native raster, checkpoint or hardware-performance claim.',
  }
}

export async function cleanupVaultApproach({ input, routeHandle, report, output }, outcome) {
  const failure = error => {
    report.cleanupErrors.push(String(error?.stack ?? error))
    if (!outcome.failed) {
      outcome.failed = true
      outcome.failure = error
    }
  }
  if (input)
    try {
      await input.pause()
    } catch (error) {
      failure(error)
    }
  if (routeHandle) {
    try {
      report.evidence = await routeHandle.evaluate(api => api.close())
    } catch (error) {
      failure(error)
    }
    try {
      await routeHandle.dispose()
    } catch (error) {
      failure(error)
    }
  }
  if (report.evidence) {
    for (const [index, frame] of report.evidence.frames.entries()) {
      try {
        const file = `m3-vault-${frame.label}-turn-${frame.state.turn}-${index}.png`
        writeFileSync(resolve(output, file), Buffer.from(frame.png.split(',')[1], 'base64'))
        frame.file = file
        delete frame.png
      } catch (error) {
        failure(error)
      }
    }
    if (!outcome.failed)
      try {
        report.result = assertVaultApproachEvidence(report.evidence)
      } catch (error) {
        failure(error)
      }
  }
}

// Ordinary01's view hides the outside prayer point behind the Vault/tree.
// One fixed half-turn from the actual settled heading uses the existing right-drag
// control before any witness or order. Only fresh pixels can establish clearance.
export async function prepareVaultDoorView({ page, input, routeHandle, signal, report, save }) {
  const entry = { before: null, after: null, cleanupErrors: [] }
  report.cameraView = entry
  const read = () =>
    routeHandle.evaluate(api => {
      const { scene, world, shaman } = api,
        canvas = scene.renderer.domElement
      const rect = canvas.getBoundingClientRect()
      const x = Math.round(rect.left + (rect.width - 1024) / 2)
      const y = Math.round(rect.top + rect.height * 0.75)
      return {
        camera: { ...scene.cameraPosition },
        velocity: { ...scene.cameraVelocity },
        selected: [...world.selected],
        mode: world.mode,
        turn: world.turn,
        lastOrderTurn: world.lastOrderTurn,
        ready:
          window.m3TempleRoute === api &&
          window.testSceneRef.current === scene &&
          window.testStore.getWorld() === world &&
          scene.world === world &&
          canvas.isConnected &&
          world.units.find(u => u.id === 46) === shaman &&
          shaman.hp > 0 &&
          world.status === 'playing' &&
          !world.paused &&
          !world.inputMask &&
          !scene.overviewActive &&
          !scene.cameraMotion.active &&
          !scene.resultCamera.active &&
          !scene.viewTransition,
        corridor: {
          x,
          y,
          end: x + 1024,
          steps: 16,
          owned:
            rect.width >= 1152 &&
            rect.height >= 128 &&
            Array.from({ length: 17 }, (_, index) => x + index * 64).every(
              clientX => document.elementFromPoint(clientX, y) === canvas
            ),
        },
      }
    })
  let failed = false,
    failure
  const fail = error => {
    if (!failed) {
      failed = true
      failure = error
    }
  }
  try {
    await input.settle()
    signal.throwIfAborted()
    entry.before = await read()
    signal.throwIfAborted()
    assert.equal(entry.before.ready, true)
    assert.deepEqual(entry.before.selected, [46])
    assert.equal(entry.before.mode, null)
    assert.ok(Number.isInteger(entry.before.camera.angle))
    assert.ok(entry.before.camera.angle >= 0 && entry.before.camera.angle <= 2047)
    assert.deepEqual(entry.before.velocity, { turn: 0, forward: 0, side: 0 })
    assert.equal(
      entry.before.corridor.owned,
      true,
      'Fixed right-drag corridor must belong to the canvas'
    )
    await input.action('vault-door-half-turn', async () => {
      const { x, y, end, steps } = entry.before.corridor
      await page.mouse.move(x, y)
      signal.throwIfAborted()
      try {
        await page.mouse.down({ button: 'right' })
        signal.throwIfAborted()
        await page.mouse.move(end, y, { steps })
      } catch (error) {
        fail(error)
      } finally {
        try {
          await page.mouse.up({ button: 'right' })
        } catch (error) {
          entry.cleanupErrors.push(String(error))
          fail(error)
        }
      }
      if (failed) throw failure
    })
    await input.settle()
    signal.throwIfAborted()
  } catch (error) {
    fail(error)
  } finally {
    try {
      entry.after = await read()
    } catch (error) {
      entry.cleanupErrors.push(String(error))
      fail(error)
    }
    try {
      save()
    } catch (error) {
      entry.cleanupErrors.push(String(error))
      fail(error)
    }
  }
  if (failed) throw failure
  signal.throwIfAborted()
  assert.equal(entry.after.ready, true)
  assert.deepEqual(
    entry.after.camera,
    { ...entry.before.camera, angle: (entry.before.camera.angle + 1024) & 2047 },
    'Fixed right-drag must add exactly half a turn and retain the camera center'
  )
  assert.deepEqual(entry.after.velocity, entry.before.velocity)
  assert.deepEqual(entry.after.selected, [46])
  assert.equal(entry.after.mode, null)
  assert.equal(entry.after.lastOrderTurn, entry.before.lastOrderTurn)
  return entry
}

// The ordinary05/Temple fresh prefix, with no replacement order after reward.
export default async function missionThreeVaultApproach({
  page,
  openMission,
  output,
  signal,
  receipt,
}) {
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const report = { source: receipt.source, status: 'running', actions: [], cleanupErrors: [] }
  const save = () =>
    writeFileSync(
      resolve(output, 'mission3-vault-approach.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  const outcome = { failed: false, failure: undefined }
  let input, routeHandle, shamanId
  const read = async () => {
    signal.throwIfAborted()
    const state = await routeHandle.evaluate(api => {
      if (window.m3TempleRoute !== api) throw new Error('Temple route API ownership changed')
      return api.read()
    })
    signal.throwIfAborted()
    report.latest = state
    assertTempleRouteHealth(state, shamanId, receipt.errors)
    return state
  }
  try {
    await openMission(3)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    shamanId = report.readiness.after.shaman.id
    routeHandle = await page.evaluateHandle(installTempleRouteObservation, { returnApi: true })
    report.initial = await read()
    assert.equal(shamanId, 46)
    assert.equal(report.initial.unlocked, false)
    assert.deepEqual(report.initial.temples, [])
    assert.equal(report.initial.vault.length, 1)
    assert.equal(report.initial.vault[0].id, 92)
    assert.equal(report.initial.vault[0].uses, 0)
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId })
    for (let n = 0; n < 3; n++) {
      const state = await read()
      if (!state.mode && !state.selected.length) break
      await input.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    const cleared = await read()
    assert.ok(!cleared.mode && !cleared.selected.length)
    await input.button('Select and focus shaman')
    await input.view(report.initial.vault[0])
    await prepareVaultDoorView({ page, input, routeHandle, signal, report, save })
    await input.prepareDispatch()
    await routeHandle.evaluate(async api => {
      const { armTempleVaultApproach } =
        await import('/scripts/local-render/mission3-temple-witness.mjs')
      return armTempleVaultApproach(api)
    })
    report.vaultOrder = await input.clickEntity('shrines', 92, 33, false, [shamanId])
    const started = Date.now()
    let lastTurn,
      lastAnimation,
      turnChanged = started,
      animationChanged = started
    for (;;) {
      const state = await read()
      assert.equal(state.paused, false)
      const observed = await routeHandle.evaluate(api => api.vaultApproach.status())
      signal.throwIfAborted()
      const now = Date.now()
      assert.ok(now - started < 420000, 'Vault host admission window expired')
      assert.deepEqual(observed.errors, [])
      if (observed.turn !== lastTurn) {
        lastTurn = observed.turn
        turnChanged = now
      }
      if (observed.animationFrame !== lastAnimation) {
        lastAnimation = observed.animationFrame
        animationChanged = now
      }
      assert.ok(
        now - turnChanged < 30000 && now - animationChanged < 30000,
        'Ordinary Vault clock stopped'
      )
      if (observed.complete) break
      await page.waitForTimeout(250)
    }
  } catch (error) {
    outcome.failed = true
    outcome.failure = error
  } finally {
    await cleanupVaultApproach({ input, routeHandle, report, output }, outcome)
    report.status = outcome.failed ? 'failed' : 'observed-pending-pixel-review'
    if (outcome.failed) report.failure = String(outcome.failure?.stack ?? outcome.failure)
    try {
      save()
    } catch (error) {
      report.cleanupErrors.push(String(error))
      if (!outcome.failed) {
        outcome.failed = true
        outcome.failure = error
      }
    }
  }
  if (outcome.failed) throw outcome.failure
  return report
}
