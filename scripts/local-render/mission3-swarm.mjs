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

export function closeMissionThreeTempleObservation(api) {
  if (window.m3TempleRoute !== api)
    throw new Error('Temple route API ownership changed; foreign API preserved')
  api.close()
}

// This is the scenario's actual post-install cleanup, shared with supplied-boundary
// tests. A primary thrown value, including falsy values, belongs to the caller.
export async function cleanupMissionThreeSwarm(
  { input, swarmHandle, routeHandle, report, output },
  outcome
) {
  if (input)
    try {
      await input.pause()
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
  for (const handle of [swarmHandle, routeHandle])
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
  let input, shamanId, routeHandle, swarmHandle
  const outcome = { failed: false, failure: undefined }
  const read = () =>
    routeHandle.evaluate(api => {
      if (window.m3TempleRoute !== api) throw new Error('Temple route API ownership changed')
      return api.read()
    })
  const clear = async () => {
    for (let i = 0; i < 3; i++) {
      const state = await read()
      if (!state.mode && !state.selected.length) return
      await input.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    assert.fail('Public Escape did not clear selection/mode')
  }
  const wait = async (label, readState, ready, wallMs, turnLimit = Infinity) => {
    const start = Date.now()
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
      if (ready(state)) return state
      assert.ok(
        now - start < wallMs && state.turn - firstTurn < turnLimit,
        `${label}: declared observation window expired`
      )
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
    await clear()
    await input.button('Select and focus shaman')
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
      60000,
      120
    )
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
    report.hit = await input.entityPoint('units', report.target.id, null, 'swarm')
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
    await cleanupMissionThreeSwarm({ input, swarmHandle, routeHandle, report, output }, outcome)
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
