import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertTempleRouteHealth } from './mission3-temple-checkpoint.mjs'
import {
  assertMissionThreeSwarmCast,
  assertMissionThreeSwarmEvidence,
  finishMissionThreeSwarmObservation,
} from './mission3-swarm-witness.mjs'

// One predeclared empty terrain pick from ordinary02, before command-context testing.
// mission3-swarm-42f20635-02/mission3-swarm.json:
// sha256 bcb3535fa1b1f2fa13d49d2c69795b76970d3dd795f14e29b3336408e147d3f3.
// Fresh visibility, command3, arrival and range remain required; never adopt a later nearest miss.
export const missionThreeSwarmStagingPoint = Object.freeze({
  x: -31.685820678042944,
  z: -115.69012077842177,
})

export function closeMissionThreeTempleObservation(api) {
  if (window.m3TempleRoute !== api)
    throw new Error('Temple route API ownership changed; foreign API preserved')
  api.close()
}

export async function installMissionThreeMoveObservation(expected) {
  if (window.restoreMission1MoveWitness || window.m3Swarm)
    throw new Error('Another movement/Swarm observation is already installed')
  const { installMission1MoveWitness } =
    await import('/scripts/local-render/mission1-vault-arrival.mjs')
  const scene = window.testSceneRef.current,
    clock = scene.gameClock,
    beforeTurn = clock.beforeTurn,
    afterTurn = clock.afterTurn
  await installMission1MoveWitness(expected)
  return {
    scene,
    clock,
    beforeTurn,
    afterTurn,
    evidence: window.mission1MoveEvidence,
    restore: window.restoreMission1MoveWitness,
  }
}

export function readMissionThreeMoveObservation(owner) {
  if (
    window.testSceneRef.current !== owner.scene ||
    window.mission1MoveEvidence !== owner.evidence ||
    window.restoreMission1MoveWitness !== owner.restore
  )
    throw new Error('Movement observation ownership changed')
  if (owner.evidence.errors.length) throw new Error(owner.evidence.errors.join('\n'))
  return !!owner.evidence.completed
}

export function closeMissionThreeMoveObservation(owner) {
  if (
    window.mission1MoveEvidence !== owner.evidence ||
    window.restoreMission1MoveWitness !== owner.restore
  )
    throw new Error('Movement observation ownership changed; foreign API preserved')
  const evidence = owner.restore()
  evidence.callbacksRestored =
    owner.clock.beforeTurn === owner.beforeTurn && owner.clock.afterTurn === owner.afterTurn
  if (!evidence.callbacksRestored) {
    evidence.errors.push('Movement callbacks were not restored to their original owners')
    evidence.restored = false
  }
  return evidence
}

// This is the scenario's actual post-install cleanup, shared with supplied-boundary
// tests. A primary thrown value, including falsy values, belongs to the caller.
export async function cleanupMissionThreeSwarm(
  { input, moveHandle, swarmHandle, routeHandle, report, output },
  outcome
) {
  if (input)
    try {
      await input.pause()
    } catch (error) {
      report.cleanupErrors.push(String(error))
    }
  if (moveHandle)
    try {
      report.staging.observation = await moveHandle.evaluate(closeMissionThreeMoveObservation)
    } catch (error) {
      report.cleanupErrors.push(String(error))
    }
  if (swarmHandle)
    try {
      report.evidence = await swarmHandle.evaluate(finishMissionThreeSwarmObservation)
      for (const [index, frame] of report.evidence.frames.entries()) {
        const name = `m3-swarm-turn-${frame.turn}-frame-${index + 1}.png`
        writeFileSync(resolve(output, name), Buffer.from(frame.png.split(',')[1], 'base64'))
        frame.file = name
      }
      if (!outcome.failed)
        try {
          report.result = assertMissionThreeSwarmEvidence(report.evidence)
        } catch (error) {
          outcome.failed = true
          outcome.failure = error
          report.failure = String(error)
          report.status = 'failed'
        }
      for (const frame of report.evidence.frames) delete frame.png
    } catch (error) {
      report.cleanupErrors.push(String(error))
    }
  if (routeHandle)
    try {
      await routeHandle.evaluate(closeMissionThreeTempleObservation)
    } catch (error) {
      report.cleanupErrors.push(String(error))
    }
  for (const handle of [moveHandle, swarmHandle, routeHandle])
    if (handle)
      try {
        await handle.dispose()
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
}

// The accepted Temple route's small fresh Vault prefix, followed by one Swarm.
// The shared harness supplies the owned profile/browser and real callbacks.
export default async function missionThreeSwarm({ page, openMission, output, signal, receipt }) {
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const report = {
    source: receipt.source,
    status: 'running',
    actions: [],
    samples: [],
    cleanupErrors: [],
    scope:
      'Fresh M3 Vault and one stocked player Swarm through public controls and natural callbacks. No native/AI/audio/full-campaign closure.',
  }
  const save = () =>
    writeFileSync(resolve(output, 'mission3-swarm.json'), JSON.stringify(report, null, 2) + '\n')
  const inPage = (name, arg = null) =>
    page.evaluate(
      async ({ name, arg }) => {
        const qa = await import('/scripts/local-render/mission3-swarm-witness.mjs')
        return qa[name](arg)
      },
      { name, arg }
    )
  let input, shamanId, routeHandle, swarmHandle, moveHandle
  const outcome = { failed: false, failure: undefined }
  const read = () =>
    routeHandle.evaluate(api => {
      if (window.m3TempleRoute !== api) throw new Error('Temple route API ownership changed')
      return api.read()
    })
  const clear = async (controls = input) => {
    for (let i = 0; i < 3; i++) {
      const state = await read()
      if (!state.mode && !state.selected.length) return
      await controls.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    assert.fail('Public Escape did not clear selection/mode')
  }
  const wait = async (label, readState, ready, wallMs, turnLimit = Infinity) => {
    const start = Date.now()
    const window = {
      label,
      startedAt: new Date(start).toISOString(),
      wallMs,
      turnLimit: Number.isFinite(turnLimit) ? turnLimit : null,
    }
    ;(report.windows ??= []).push(window)
    let firstTurn,
      lastTurn,
      lastAnimation,
      changedTurn = start,
      changedAnimation = start,
      lastSaved = 0
    for (;;) {
      signal.throwIfAborted()
      const state = await readState(),
        now = Date.now()
      firstTurn ??= state.turn
      Object.assign(window, {
        firstTurn,
        lastTurn: state.turn,
        lastAt: new Date(now).toISOString(),
        elapsedMs: now - start,
      })
      assert.deepEqual(receipt.errors, [])
      assert.equal(state.status, 'playing')
      assert.equal(state.paused, false)
      assert.equal(state.inputMask, 0)
      assert.equal(state.speed, 1)
      if (state.turn !== lastTurn) {
        lastTurn = state.turn
        changedTurn = now
      }
      if (state.animationFrame !== lastAnimation) {
        lastAnimation = state.animationFrame
        changedAnimation = now
      }
      if (now - lastSaved >= 10000) {
        report.samples.push({ label, state })
        save()
        lastSaved = now
      }
      assert.ok(
        now - start < wallMs && state.turn - firstTurn < turnLimit,
        `${label}: declared observation window expired`
      )
      if (ready(state)) return state
      assert.ok(
        now - changedTurn < 30000 && now - changedAnimation < 30000,
        `${label}: ordinary clock stopped advancing`
      )
      await page.waitForTimeout(250)
    }
  }
  try {
    await openMission(3)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    routeHandle = await page.evaluateHandle(async () => {
      const { installTempleRouteObservation } =
        await import('/scripts/local-render/mission3-temple-witness.mjs')
      await installTempleRouteObservation()
      return window.m3TempleRoute
    })
    report.initial = await read()
    shamanId = report.readiness.after.shaman.id
    assertTempleRouteHealth(report.initial, shamanId, receipt.errors)
    assert.equal(report.initial.unlocked, false)
    assert.equal(report.initial.vault.length, 1)
    assert.equal(report.initial.vault[0].uses, 0)
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId })
    await clear()
    await input.button('Select and focus shaman')
    await input.view(report.initial.vault[0])
    report.vaultOrder = await input.clickEntity('shrines', report.initial.vault[0].id, 33, false, [
      shamanId,
    ])
    report.reward = await wait(
      'earned-temple-knowledge',
      async () => {
        const state = await read()
        assertTempleRouteHealth(state, shamanId, receipt.errors)
        return state
      },
      state => state.unlocked && state.vault[0].uses === 1,
      420000
    )
    const readinessDeadline = Date.now() + 60000
    report.readinessWindow = {
      startedAt: new Date().toISOString(),
      firstObservedTurn: report.reward.turn,
      deadline: new Date(readinessDeadline).toISOString(),
    }
    const remainingReadiness = () => {
      const remaining = readinessDeadline - Date.now()
      assert.ok(remaining > 0, 'Swarm staging/readiness window expired')
      return remaining
    }
    // Only new readiness input is deadline-scoped. The original helper remains
    // available for best-effort public Pause/restoration during cleanup.
    const readinessInput = createMission1VaultInput({
      page,
      signal,
      report,
      save,
      originalShamanId: shamanId,
      deadlineAt: readinessDeadline,
    })
    await clear(readinessInput)
    await readinessInput.button('Select and focus shaman')
    // One ordinary move replaces the continuing Vault route. Its existing
    // native-arrival witness proves completion; this is not a cast idle gate.
    const stagingPoint = missionThreeSwarmStagingPoint
    await readinessInput.view(stagingPoint)
    await page.evaluate(async () => {
      await Promise.all([
        import('/scripts/local-render/mission1-vault-arrival.mjs'),
        import('/app/person-orders.ts'),
        import('/app/original-rules.json'),
        import('/app/unit-kinds.ts'),
        import('/app/person-idle.ts'),
      ])
    })
    remainingReadiness()
    report.staging = await readinessInput.moveGround(stagingPoint)
    save()
    const recipient = report.staging.delivered.after.units.find(unit => unit.id === shamanId)
    moveHandle = await page.evaluateHandle(installMissionThreeMoveObservation, {
      id: shamanId,
      point: report.staging.hit.point,
      orderId: recipient.orderId,
      order: recipient.order,
      acknowledgedTurn: report.staging.delivered.after.lastOrderTurn,
    })
    await wait(
      'ordinary-Swarm-staging-arrival',
      async () => {
        const state = await read()
        assertTempleRouteHealth(state, shamanId, receipt.errors)
        return { ...state, arrived: await moveHandle.evaluate(readMissionThreeMoveObservation) }
      },
      state => state.arrived,
      remainingReadiness()
    )
    report.staging.observation = await moveHandle.evaluate(closeMissionThreeMoveObservation)
    const completedMoveHandle = moveHandle
    moveHandle = null
    await completedMoveHandle.dispose()
    assert.equal(report.staging.observation.restored, true)
    assert.deepEqual(report.staging.observation.errors, [])
    assert.ok(report.staging.observation.completed)
    save()
    report.candidates = await wait(
      'charged-castable-Swarm',
      async () => {
        const state = await read()
        assertTempleRouteHealth(state, shamanId, receipt.errors)
        return {
          ...(await inPage('readMissionThreeSwarmCandidates')),
          speed: state.speed,
          animationFrame: state.animationFrame,
        }
      },
      state => !!state.target,
      remainingReadiness(),
      120
    )
    Object.assign(report.readinessWindow, {
      endedAt: new Date().toISOString(),
      lastObservedTurn: report.candidates.turn,
    })
    report.target = report.candidates.target
    // Public pause holds the declared candidate during camera/HUD preparation.
    await input.pause()
    await input.view(report.target)
    await inPage('preloadMissionThreeSwarm')
    await input.action('Spells category', () =>
      page.getByRole('button', { name: 'spells 1–3', exact: true }).click()
    )
    await input.action('Swarm card', () =>
      page.getByRole('button', { name: /^Swarm, \d+ shots$/ }).click()
    )
    report.hit = await input.fixedGround(report.target, 'swarm')
    assert.equal(report.hit.rejection, null)
    await input.resume()
    report.expected = await inPage('inspectMissionThreeSwarmTarget', {
      hit: report.hit,
      targetId: report.target.id,
      shamanId,
    })
    assert.deepEqual(report.expected.errors, [], JSON.stringify(report.expected))
    swarmHandle = await page.evaluateHandle(async expected => {
      const { installMissionThreeSwarmObservation } =
        await import('/scripts/local-render/mission3-swarm-witness.mjs')
      return installMissionThreeSwarmObservation(expected)
    }, report.expected)
    report.delivery = await input.castInput(report.hit, 'swarm')
    const cast = await swarmHandle.evaluate(api => ({ cast: api.evidence.cast }))
    report.cast = assertMissionThreeSwarmCast(report.delivery, cast, report.expected)
    report.observed = await wait(
      'natural-Swarm-response',
      () => swarmHandle.evaluate(api => api.status()),
      state => {
        assert.deepEqual(state.errors, [])
        return state.arrival && state.firstVisit && state.response && state.frames >= 2 && state.cue
      },
      120000,
      240
    )
    await input.pause()
    report.status = 'observed-pending-pixel-review'
  } catch (error) {
    outcome.failed = true
    outcome.failure = error
    report.failure = String(error?.stack ?? error)
    report.status = 'failed'
  } finally {
    await cleanupMissionThreeSwarm(
      { input, moveHandle, swarmHandle, routeHandle, report, output },
      outcome
    )
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
  assert.deepEqual(report.cleanupErrors, [])
  assert.ok(report.result)
  save()
  return report
}
