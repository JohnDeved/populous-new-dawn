import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { installMission1MoveWitness } from './mission1-vault-arrival.mjs'
import {
  installTempleRouteObservation,
  findTempleGround,
  armTemplePlacement,
  readTemplePresentation,
  armTempleSave,
  readCommittedTempleSummary,
} from './mission3-temple-witness.mjs'

export function assertTempleRouteHealth(state, shamanId, errors = []) {
  assert.deepEqual(errors, [])
  assert.equal(state.level, 3)
  assert.equal(state.speed, 1)
  assert.equal(state.status, 'playing')
  assert.equal(state.inputMask, 0)
  assert.ok(state.sceneMatches && state.actorMatches && state.connected && state.started)
  assert.equal(state.loading, false)
  assert.equal(state.contextLost, false)
  assert.ok(
    state.units.some(u => u.id === shamanId && u.kind === 'shaman' && u.team === 'blue' && u.hp > 0)
  )
  assert.equal(state.stats.cast, 0)
  assert.equal(state.stats.bridges, 0)
  assert.equal(state.stats.trained, 0)
}

export function assertTemplePlacement(evidence, hit, selected) {
  const { before, after, pointer } = evidence
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(pointer.errors, [])
  assert.equal(pointer.restored, true)
  assert.deepEqual(
    pointer.events.map(event => [
      event.type,
      event.x,
      event.y,
      event.button,
      event.trusted,
      event.canvasOwned,
      event.canvasTarget,
    ]),
    ['pointerdown', 'pointerup'].map(type => [type, hit.x, hit.y, 0, true, true, true])
  )
  assert.ok(
    pointer.events.every(event =>
      ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => !event.args[key])
    )
  )
  assert.equal(before.mode, 'temple')
  assert.equal(after.mode, null)
  assert.deepEqual(before.selected, selected)
  assert.deepEqual(after.selected, selected)
  assert.equal(after.turn, before.turn)
  const created = after.temples.filter(b => !before.temples.some(prior => prior.id === b.id))
  assert.equal(created.length, 1, 'Exactly one ordinary Blue Temple plan')
  const temple = created[0]
  assert.equal(temple.object, 95)
  assert.equal(temple.progress, 0)
  const recipients = after.units.filter(
    u => u.work === temple.id || (u.order?.model === 6 && u.order.a === temple.id)
  )
  assert.deepEqual(
    recipients.map(u => u.id).sort((a, b) => a - b),
    [...selected].sort((a, b) => a - b),
    'Actual construction recipients must be exactly the selected living Braves'
  )
  assert.ok(recipients.every(u => u.kind === 'brave' && u.hp > 0))
  return temple
}

export async function saveTempleCheckpoint({
  page,
  input,
  signal,
  report,
  save,
  observeCheckpoint,
}) {
  const entry = (report.checkpoint = {
    boundary: null,
    committed: null,
    digest: null,
    cleanupErrors: [],
  })
  let armed = false,
    failed = false,
    failure
  try {
    await input.button('Game settings')
    await page.evaluate(armTempleSave)
    armed = true
    await input.button('Save checkpoint')
  } catch (error) {
    failed = true
    failure = error
  } finally {
    if (armed)
      try {
        entry.boundary = await page.evaluate(() => window.finishTempleSave())
      } catch (error) {
        entry.cleanupErrors.push(String(error))
        if (!failed) {
          failed = true
          failure = error
        }
      }
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
  assert.equal(entry.boundary?.error, null)
  assert.equal(entry.boundary.saved?.paused, true)
  assert.equal(entry.boundary.saved.unlocked, true)
  assert.equal(entry.boundary.saved.temples.length, 1)
  const temple = entry.boundary.saved.temples[0]
  assert.ok(
    temple.object === 95 &&
      temple.hp > 0 &&
      temple.progress === 1 &&
      temple.stage === 4 &&
      temple.logs === 8
  )
  let matches
  try {
    matches = await waitForCheckpointReadback(async () => {
      signal.throwIfAborted()
      entry.committed = await page.evaluate(readCommittedTempleSummary)
      return (
        entry.committed?.version === 1 &&
        JSON.stringify(entry.committed.summary) === JSON.stringify(entry.boundary.saved)
      )
    })
  } catch (error) {
    failed = true
    failure = error
    entry.readFailure = String(error)
  } finally {
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
  assert.equal(matches, true, 'Committed Save must match the trusted public click boundary')
  entry.digest = await observeCheckpoint('M3 completed Temple Save')
  save()
  assert.equal(entry.digest.checkpoint?.level, 3)
  assert.equal(entry.digest.checkpoint.turn, entry.boundary.saved.turn)
  assert.equal(entry.digest.checkpoint.time, entry.boundary.saved.time)
  assert.match(entry.digest.checkpoint.checkpointSha256, /^[a-f0-9]{64}$/)
  // Leave settings open. Its public close handler resumes the simulation;
  // this journey ends at the saved paused boundary and the harness closes it.
  return entry
}

// Direct M3 startup is a QA entry point, not campaign unlocking. Every mutation
// below is a shipped DOM input; the harness owns real RAF, profile and shutdown.
export default async function mission3TempleCheckpoint({
  page,
  openMission,
  output,
  signal,
  receipt,
  observeCheckpoint,
}) {
  assert.equal(receipt.profile?.mode, 'created', 'Use a new owned profile for this one-time route')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const report = {
    source: receipt.source,
    status: 'running',
    actions: [],
    samples: [],
    scope:
      'Ordinary M3 Temple construction and genuine Save only. No training, sermon, victory, art parity or hardware-performance claim.',
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'mission3-temple-checkpoint.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  let input,
    shamanId,
    installed = false,
    failed = false,
    failure
  const read = async () => {
    const state = await page.evaluate(() => window.m3TempleRoute.read())
    report.latest = state
    return state
  }
  const wait = async (label, predicate, timeout) => {
    const started = Date.now()
    let lastTurn,
      lastAnimation,
      turnChanged = started,
      animationChanged = started,
      sampled = 0
    for (;;) {
      signal.throwIfAborted()
      const state = await read(),
        now = Date.now()
      if (now - sampled >= 10000) {
        report.samples.push({ label, state })
        sampled = now
        save()
      }
      assertTempleRouteHealth(state, shamanId, receipt.errors)
      assert.equal(state.paused, false)
      if (state.turn !== lastTurn) {
        lastTurn = state.turn
        turnChanged = now
      }
      if (state.animationFrame !== lastAnimation) {
        lastAnimation = state.animationFrame
        animationChanged = now
      }
      if (await predicate(state)) {
        report.actions.push({ label, completed: state })
        save()
        return state
      }
      assert.ok(now - started < timeout, `${label} exceeded its reviewed wall budget`)
      assert.ok(
        now - turnChanged < 30000 && now - animationChanged < 30000,
        `${label}: ordinary clock stopped advancing`
      )
      await page.waitForTimeout(500)
    }
  }
  const clear = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const state = await read()
      if (!state.mode && !state.selected.length) return
      await input.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    assert.fail('Public Escape did not clear mode and selection')
  }
  try {
    await openMission(3)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    const initial = (report.initial = await page.evaluate(installTempleRouteObservation))
    installed = true
    shamanId = report.readiness.after.shaman.id
    save()
    assertTempleRouteHealth(initial, shamanId, receipt.errors)
    assert.equal(initial.unlocked, false)
    assert.deepEqual(initial.temples, [])
    assert.equal(initial.vault.length, 1)
    assert.equal(initial.vault[0].uses, 0)
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId })
    await clear()
    await input.button('Select and focus shaman')
    await input.view(initial.vault[0])
    report.vaultOrder = await input.clickEntity('shrines', initial.vault[0].id, 33, false, [
      shamanId,
    ])
    report.reward = await wait(
      'earned-temple-knowledge',
      state => state.unlocked && state.vault[0].uses === 1,
      420000
    )
    await clear()
    await input.button('Select and focus shaman')
    await input.view({ x: 35, z: 81 })
    const movement = (report.home = await input.moveGround({ x: 35, z: 81 }, false, 2))
    save()
    const recipient = movement.delivered.after.units.find(u => u.id === shamanId)
    let moveFailed = false,
      moveFailure
    try {
      await page.evaluate(installMission1MoveWitness, {
        id: shamanId,
        point: movement.hit.point,
        orderId: recipient.orderId,
        order: recipient.order,
        acknowledgedTurn: movement.delivered.after.lastOrderTurn,
      })
      await wait(
        'shaman-returned-home',
        () =>
          page.evaluate(() => {
            const evidence = window.mission1MoveEvidence
            if (evidence.errors.length) throw Error(evidence.errors.join('\n'))
            return !!evidence.completed
          }),
        300000
      )
    } catch (error) {
      moveFailed = true
      moveFailure = error
    } finally {
      try {
        movement.observation = await page.evaluate(
          () => window.restoreMission1MoveWitness?.() ?? window.mission1MoveEvidence
        )
      } catch (error) {
        movement.cleanupError = String(error)
        if (!moveFailed) {
          moveFailed = true
          moveFailure = error
        }
      }
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
    assert.equal(movement.observation.restored, true)
    assert.deepEqual(movement.observation.errors, [])
    assert.ok(movement.observation.completed)
    await clear()
    await input.action('select-five-Braves', () =>
      page
        .getByRole('button', { name: 'Select brave', exact: true })
        .click({ modifiers: ['Control'] })
    )
    const selected = (report.builders = (await read()).selected)
    save()
    assert.equal(selected.length, 5)
    assert.ok(
      (await read()).units
        .filter(u => selected.includes(u.id))
        .every(u => u.kind === 'brave' && u.hp > 0)
    )
    await input.view({ x: 24, z: 70 })
    const hit = (report.site = await page.evaluate(findTempleGround))
    save()
    assert.equal(hit.rejection, undefined, 'Legal ordinary Temple site required')
    await input.button('buildings B')
    await input.button('Temple, 8 wood')
    let armed = false,
      placementFailed = false,
      placementFailure
    try {
      await page.evaluate(armTemplePlacement, { hit, selected })
      armed = true
      await input.action('place-Temple', () => page.mouse.click(hit.x, hit.y))
    } catch (error) {
      placementFailed = true
      placementFailure = error
    } finally {
      if (armed)
        try {
          report.placement = await page.evaluate(() => window.finishTemplePlacement())
        } catch (error) {
          report.placementCleanupError = String(error)
          if (!placementFailed) {
            placementFailed = true
            placementFailure = error
          }
        }
      try {
        save()
      } catch (error) {
        if (!placementFailed) {
          placementFailed = true
          placementFailure = error
        }
      }
    }
    if (placementFailed) throw placementFailure
    const temple = (report.plan = assertTemplePlacement(report.placement, hit, selected))
    report.completed = await wait(
      'ordinary-Temple-completed',
      state =>
        state.temples.some(
          b => b.id === temple.id && b.hp > 0 && b.progress === 1 && b.stage === 4 && b.logs === 8
        ),
      420000
    )
    await input.pause()
    await clear()
    await input.view(temple)
    await page.mouse.move(400, 780)
    const frame = await page.evaluate(() => window.testSceneRef.current.renderer.info.render.frame)
    await page.waitForFunction(
      frame => window.testSceneRef.current.renderer.info.render.frame > frame,
      frame
    )
    report.presentation = await page.evaluate(readTemplePresentation, temple.id)
    save()
    assert.equal(report.presentation.visible, true)
    assert.equal(report.presentation.canvasOwned, true)
    assert.ok(
      report.presentation.meshes.some(
        mesh => mesh.nativeModel === 95 && mesh.stage === 4 && mesh.visible && mesh.imageWidth > 0
      )
    )
    await page.screenshot({ path: resolve(output, 'mission3-completed-temple.png') })
    await saveTempleCheckpoint({ page, input, signal, report, save, observeCheckpoint })
    report.terminal = await read()
    save()
    assertTempleRouteHealth(report.terminal, shamanId, receipt.errors)
    assert.equal(report.terminal.paused, true)
    report.status = 'passed'
  } catch (error) {
    failed = true
    failure = error
    report.status = 'failed'
    report.failure = String(error?.stack ?? error)
  } finally {
    // No failure fallback Save: a genuine committed checkpoint is never replaced.
    report.cleanupErrors = []
    if (installed) {
      if (!signal.aborted && failed)
        try {
          await input?.pause()
          report.terminal = await read()
        } catch (error) {
          report.cleanupErrors.push(String(error))
        }
      try {
        await page.evaluate(() => window.m3TempleRoute?.close())
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
    }
    if (report.cleanupErrors.length && !failed) {
      failed = true
      failure = Error(report.cleanupErrors.join('\n'))
      report.status = 'failed'
      report.failure = String(failure)
    }
    save()
  }
  if (failed) throw failure
  assert.deepEqual(report.cleanupErrors, [])
  return report
}
