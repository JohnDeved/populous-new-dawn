import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertNearbySurface, assertNearbyEvidence } from './follower-nearby-contract.mjs'
import { captureNearbyDisplay, assertNearbyDisplayCapture } from './nearby-display-capture.mjs'

// Continue only the genuine ordinary02 checkpoint. No new M1 acquisition, Save,
// forced frame, camera assignment, clock adjustment or injected follower state.
export default async function ({ page, root, output, receipt, signal, observeCheckpoint }) {
  const prior = JSON.parse(readFileSync(resolve(root,
      'work/orchestration/nearby-mission1-4395-02/mission1-nearby-followers.json'), 'utf8')),
    report = { status: 'running', source: receipt.source, actions: [], stages: [], errors: [] },
    deadline = Date.now() + 90000,
    save = () => writeFileSync(resolve(output, 'nearby-compact-load.json'), `${JSON.stringify(report, null, 2)}\n`),
    expected = { phases: ['compact-global', 'compact-nearby', 'compact-keyboard-global'], nearby: false }
  let checkpoint, witness, cdp, failure
  const admit = () => { signal.throwIfAborted(); assert.ok(Date.now() < deadline, 'Compact Load tail deadline') }
  const wait = async (read, accepts, label, duration = 5000) => {
    const end = Math.min(deadline, Date.now() + duration)
    for (;;) {
      admit()
      const value = await read()
      if (accepts(value)) return value
      assert.ok(Date.now() < end, `${label}: ${JSON.stringify(value)}`)
      await page.waitForTimeout(25)
    }
  }
  try {
    assert.equal(receipt.profile.mode, 'reused')
    assert.equal(prior.status, 'passed')
    assert.equal(prior.saved.digest.turn, 178)
    assert.deepEqual(receipt.profile.checkpointAtStart, prior.saved.digest)
    assert.deepEqual(receipt.profile.previousRun.checkpointAtEnd, prior.saved.digest)
    report.committedBeforeLoad = receipt.profile.checkpointAtStart
    save()
    checkpoint = await page.evaluateHandle(async () => {
      const { armTempleCheckpoint } = await import('/scripts/local-render/temple-training-checkpoint.mjs'),
        { armBuildingSceneStart } = await import('/scripts/local-render/mission3-building-lifecycle.mjs'),
        { nearbyCheckpointState, nearbySnapshot } = await import('/scripts/local-render/follower-nearby-snapshot.mjs'),
        { GameScene } = await import('/app/scene.ts')
      const hooks = () => {
        const values = [], main = document.querySelector('main')
        let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        for (; fiber; fiber = fiber.return)
          for (let hook = fiber.memoizedState; hook; hook = hook.next) values.push(hook.memoizedState)
        return values
      }, store = hooks().find(value => value?.getWorld && value?.subscribe),
        button = [...document.querySelectorAll('button')].find(node => node.textContent.trim() === 'Load Game')
      if (!store) throw Error('Actual startup store unavailable')
      const before = store.getWorld(), loaded = armTempleCheckpoint({ kind: 'load', store, button, snapshot: nearbyCheckpointState })
      let replacement, initial, start, unsubscribe
      const close = () => {
        const result = {}, errors = []
        for (const [name, cleanup] of [['load', () => loaded.close()], ['start', () => start?.close()],
          ['subscription', () => unsubscribe?.()]])
          try { result[name] = cleanup() } catch (error) { errors.push(String(error)) }
        return { result, errors }
      }
      try {
        unsubscribe = store.subscribe(() => {
          const world = store.getWorld()
          if (world !== before && !replacement) { replacement = world; unsubscribe() }
        })
        start = armBuildingSceneStart({ prototype: GameScene.prototype, store,
          expectedWorld: () => replacement, sceneRef: scene => hooks().find(value => value?.current === scene),
          attach(scene, ref) {
            initial = nearbySnapshot(scene, store)
            window.testSceneRef = ref; window.testScene = scene; window.testStore = store
          } })
      } catch (error) {
        const cleanup = close()
        if (cleanup.errors.length) console.error('Compact Load observer cleanup', cleanup.errors)
        throw error
      }
      return {
        summary() { return { captured: loaded.status().captured, attached: start.evidence.attached,
          errors: [...loaded.status().errors, ...start.evidence.errors] } },
        async take() { return { status: loaded.status(), digest: await loaded.digest(), initial, cleanup: close() } },
        close,
      }
    })
    admit()
    await page.getByRole('dialog', { name: 'Start game', exact: true })
      .getByRole('button', { name: 'Load Game', exact: true }).click({ timeout: 10000 })
    await wait(() => checkpoint.evaluate(api => api.summary()),
      value => value.captured && value.attached && value.errors.length === 0, 'Public Load and Scene start', 30000)
    report.load = await checkpoint.evaluate(api => api.take())
    assert.deepEqual(report.load.digest, prior.saved.expectedLoad)
    assert.equal(report.load.status.trusted, true)
    assert.equal(report.load.status.publication.paused, true)
    assert.equal(report.load.status.publication.turn, 178)
    assert.equal(report.load.status.publication.target.flags & 128, 128)
    assert.equal(report.load.initial.turn, 178)
    assert.equal(report.load.initial.nearby, true)
    assert.deepEqual(report.load.cleanup.errors, [])
    await bindGame(page)
    report.readiness = await waitForShamanReadiness(page, { timeout: 30000 })
    const input = createMission1VaultInput({ page, signal, report, save, deadlineAt: deadline,
      originalShamanId: report.readiness.after.shaman.id })
    await input.pause()
    await input.action('Followers tab', () => page.getByTitle('followers', { exact: true }).click())
    await input.settle()
    witness = await page.evaluateHandle(async () => {
      const { createNearbyFollowerWitness } = await import('/scripts/local-render/follower-nearby-witness.mjs'),
        { nearbySnapshot, nearbySurface, nearbySurfaceMatches } = await import('/scripts/local-render/follower-nearby-snapshot.mjs'),
        api = createNearbyFollowerWitness({ scene: window.testSceneRef.current, store: window.testStore,
          read: nearbySnapshot, root: window }),
        inspect = () => {
          const state = api.snapshot()
          return { state, surface: nearbySurface(document, state) }
        }
      return { ...api, inspect, summary() {
        const { state, surface } = inspect()
        return { ...api.status(), nearby: state.nearby, matched: nearbySurfaceMatches(state, surface) }
      } }
    })
    cdp = await page.context().newCDPSession(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 2, mobile: false,
    })
    await page.waitForFunction(() => innerWidth === 1280 && innerHeight === 720 && devicePixelRatio === 2,
      null, { timeout: 5000 })
    for (const [index, label] of expected.phases.entries()) {
      admit()
      await witness.evaluate((api, label) => api.mark(label), label)
      const before = await witness.evaluate(api => api.summary()),
        button = page.getByRole('button', { name: 'Nearby followers', exact: true })
      await input.action(label, async () => {
        if (index === 2) { await button.focus(); await page.keyboard.press('Enter') }
        else await button.click()
      })
      await wait(() => witness.evaluate(api => api.summary()), value => value.errors.length === 0 &&
        value.commits === before.commits + 1 && value.nearby !== before.nearby && value.matched,
      `${label} actual elapsed mode and DOM commitment`)
      const observed = await witness.evaluate(api => api.inspect()), stage = { label, ...observed }
      report.stages.push(stage)
      stage.capture = await captureNearbyDisplay(page, cdp, resolve(output, `${label}.png`))
      save()
      assertNearbyDisplayCapture(stage.capture)
      assert.equal(stage.surface.layout.dpr, 2)
      assertNearbySurface(stage.state, stage.surface)
    }
    report.committedAfter = await observeCheckpoint('Compact tail leaves genuine Save178 unchanged')
    assert.deepEqual(report.committedAfter.checkpoint, prior.saved.digest)
    assert.deepEqual(receipt.errors, [])
    report.status = 'observed'
  } catch (error) {
    failure = error; report.failure = String(error?.stack ?? error); report.status = 'failed'
  } finally {
    if (witness) {
      try {
        report.epoch = await witness.evaluate((api, expected) => api.take(expected), expected)
        assertNearbyEvidence(report.epoch, expected)
      } catch (error) { report.errors.push(String(error?.stack ?? error)) }
      try { await witness.dispose() } catch (error) { report.errors.push(String(error)) }
    }
    if (checkpoint) {
      try {
        report.checkpointCleanup = await checkpoint.evaluate(api => api.close())
        assert.deepEqual(report.checkpointCleanup.errors, [])
        assert.deepEqual(report.checkpointCleanup.result.load.errors, [])
        assert.deepEqual(report.checkpointCleanup.result.load.cleanup, { listener: true, subscription: true })
        assert.deepEqual(report.checkpointCleanup.result.start.errors, [])
        assert.equal(report.checkpointCleanup.result.start.restored, true)
      } catch (error) { report.errors.push(String(error?.stack ?? error)) }
      try { await checkpoint.dispose() } catch (error) { report.errors.push(String(error)) }
    }
    if (cdp) {
      try { await cdp.send('Emulation.clearDeviceMetricsOverride') } catch (error) { report.errors.push(String(error)) }
      try { await cdp.detach() } catch (error) { report.errors.push(String(error)) }
    }
    report.status = report.status === 'observed' && !report.errors.length ? 'passed' : 'failed'
    try { save() } catch (error) {
      report.status = 'failed'
      report.errors.push(`Compact report write failed: ${String(error?.stack ?? error)}`)
      receipt.errors.push(...report.errors); failure ??= error
    }
  }
  if (failure) throw failure
  assert.deepEqual(report.errors, [])
  return { status: report.status, loadTurn: report.load.initial.turn, stages: report.stages.length,
    report: 'nearby-compact-load.json' }
}
