import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness, bindGame } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertNearbySurface, assertNearbyEvidence } from './follower-nearby-contract.mjs'

// One authored M1 opening. Real controls own every action and elapsed visit.
// Polling exports small status only; each epoch's bounded records leave once.
export default async function ({ page, openMission, output, receipt, signal, observeCheckpoint }) {
  assert.equal(receipt.profile?.mode, 'created', 'One fresh owned profile is required')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const report = { status: 'running', source: receipt.source, actions: [], stages: [], errors: [],
    limits: 'Ordinary M1 current-port proof. Paused UI cues are requests, not audible playback. No native execution, full panel, specialist/transport or hardware-performance claim.' },
    deadline = Date.now() + 210000,
    save = () => writeFileSync(resolve(output, 'mission1-nearby-followers.json'), `${JSON.stringify(report, null, 2)}\n`),
    witnesses = []
  let witness, checkpoint, failure, input, cdp, heldPrimary = false
  const admit = () => { signal.throwIfAborted(); assert.ok(Date.now() < deadline, 'Nearby episode deadline expired') }
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
  const status = async () => {
    const value = await witness.evaluate(api => api.status())
    assert.deepEqual(value.errors, [])
    assert.equal(value.overflow, false)
    return value
  }
  const mark = name => witness.evaluate((api, name) => api.mark(name), name)
  const install = async () => {
    witness = await page.evaluateHandle(async () => {
      const { createNearbyFollowerWitness } = await import('/scripts/local-render/follower-nearby-witness.mjs'),
        { nearbySnapshot, nearbySurface, nearbySurfaceMatches } = await import('/scripts/local-render/follower-nearby-snapshot.mjs'),
        scene = window.testSceneRef.current, store = window.testStore,
        api = createNearbyFollowerWitness({ scene, store, read: nearbySnapshot, root: window })
      const inspect = (pressed = false) => {
        const state = api.snapshot()
        return { state, surface: nearbySurface(document, state, { pressed }) }
      }
      return { ...api, inspect, inspectStatus(pressed = false) {
        const { state, surface } = inspect(pressed)
        return { matched: nearbySurfaceMatches(state, surface), turn: state.turn, nearby: state.nearby }
      } }
    })
    witnesses.push(witness)
    await status()
  }
  const inspect = async (label, pressed = false) => {
    admit()
    let observed, observationError
    try {
      await wait(() => witness.evaluate((api, pressed) => api.inspectStatus(pressed), pressed),
        value => value.matched, `${label} DOM commit`)
      observed = await witness.evaluate((api, pressed) => api.inspect(pressed), pressed)
    } catch (error) { observationError = error }
    try { await screenshot(label) }
    catch (error) {
      if (observationError) report.errors.push(String(error))
      else observationError = error
    }
    if (observationError) throw observationError
    report.stages.push({ label, ...observed })
    save()
    assertNearbySurface(observed.state, observed.surface)
    return observed.state
  }
  const screenshot = name => page.screenshot({ path: resolve(output, `${name}.png`), timeout: 5000 })
  const followers = () => input.action('Followers tab', () => page.getByTitle('followers', { exact: true }).click())
  const clear = async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      await input.action('Clear interaction', () => page.keyboard.press('Escape'))
      if (!(await witness.evaluate(api => api.snapshot().selected.length))) return
    }
    assert.equal(await witness.evaluate(api => api.snapshot().selected.length), 0)
  }
  const toggle = async (label, keyboard = false) => {
    await mark(label)
    const before = await status(), state = await witness.evaluate(api => api.snapshot()),
      button = page.getByRole('button', { name: 'Nearby followers', exact: true })
    await input.action(label, async () => {
      if (keyboard) { await button.focus(); await page.keyboard.press('Enter') }
      else await button.click()
    })
    await wait(status, value => value.requests === before.requests + 1 && value.commits === before.commits + 1,
      `${label} real elapsed commit`)
    const after = await inspect(label)
    assert.equal(after.nearby, !state.nearby)
    assert.equal(after.turn, state.turn, 'Public pause must preserve the comparison roster')
    return after
  }
  save()
  try {
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, { timeout: 30000 })
    input = createMission1VaultInput({ page, signal, report, save,
      originalShamanId: report.readiness.after.shaman.id, deadlineAt: deadline })
    await input.button('Game settings')
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible' })
    await page.evaluate(async () => Promise.all([
      import('/scripts/local-render/follower-nearby-witness.mjs'),
      import('/scripts/local-render/follower-nearby-snapshot.mjs'),
      import('/scripts/local-render/temple-training-checkpoint.mjs'),
      import('/scripts/local-render/mission3-building-lifecycle.mjs'),
      import('/app/scene.ts'),
    ]).then(() => undefined))
    await input.button('Close menu')
    await input.resume()
    await followers()
    await install()
    await wait(() => witness.evaluate(api => {
      const s = api.snapshot()
      return { level: s.level, idle: s.global.tasks[2][2], housed: s.global.tasks[2][3], turn: s.turn }
    }), value => value.level === 1 && value.idle > 0 && value.housed > 0,
    'Authored natural Idle and Housed Braves', 30000)
    await input.pause()
    await input.settle()
    report.home = await inspect('global-home')
    assert.equal(report.home.nearby, false)
    assert.equal(report.home.speed, 1)
    assert.equal(report.home.status, 'playing')
    assert.equal(report.home.overview, false)
    assert.equal(report.home.inputMask, 0)

    // Hold through real dispatcher frames; no injected timestamp or arbitrary
    // settle sleep decides when the feature has committed.
    await mark('global-held')
    const heldBefore = await status(), box = await page.getByRole('button', { name: 'Nearby followers', exact: true }).boundingBox()
    assert.ok(box)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down(); heldPrimary = true
    await wait(status, value => value.clock.last - heldBefore.clock.last >= 200, 'Natural held dispatch frames')
    await inspect('global-pressed', true)
    assert.equal((await status()).requests, heldBefore.requests)
    await page.mouse.up(); heldPrimary = false
    await wait(status, value => value.commits === heldBefore.commits + 1, 'Release elapsed commit')
    await inspect('nearby-home')

    const home = report.home.blue.find(unit => unit.id === report.readiness.after.shaman.id)
    assert.ok(home)
    await input.view({ x: home.x + 64, z: home.z })
    await clear()
    const away = await inspect('nearby-away')
    assert.ok(away.global.displayTotals[2] > 0 && away.global.tasks[2][2] > 0)
    assert.equal(away.local.displayTotals[2], 0)
    assert.equal(away.local.tasks[2][2], 0)
    for (const [label, modifiers, button] of [
      ['Idle Braves', [], 'left'], ['Idle Braves', ['Shift'], 'left'],
      ['Idle Braves', [], 'right'], ['Select brave', [], 'left'],
    ]) {
      await mark(`nearby-away-${label}-${button}-${modifiers.join('')}`)
      await input.action(label, () => page.getByRole('button', { name: label, exact: true }).click({ modifiers, button }))
      assert.deepEqual(await witness.evaluate(api => api.snapshot().selected), [])
    }
    const globalAway = await toggle('global-away')
    assert.deepEqual(globalAway.center, away.center)
    assert.equal(globalAway.global.displayTotals[2], away.global.displayTotals[2])
    await mark('global-away-select')
    await input.button('Idle Braves')
    await inspect('global-away-selected')
    assert.equal((await witness.evaluate(api => api.snapshot().selected)).length, 1)
    await mark('global-away-focus')
    await input.action('Idle Brave focus', () => page.getByRole('button', { name: 'Idle Braves', exact: true }).click({ button: 'right' }))
    await input.settle()
    await inspect('global-focused')
    await input.view(home)
    await clear()
    await mark('global-home-five')
    await input.action('Select five Braves', () => page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Control'] }))
    await inspect('global-selected')
    await clear()
    await toggle('nearby-before-save')

    // Verify canceled primary and secondary input without synthetic dispatch.
    const canceled = await status()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down(); heldPrimary = true
    await inspect('nearby-pressed', true)
    await page.mouse.move(600, 400)
    await page.mouse.up(); heldPrimary = false
    await input.action('Secondary mode input', () => page.getByRole('button', { name: 'Nearby followers', exact: true }).click({ button: 'right' }))
    await inspect('nearby-canceled')
    assert.equal((await status()).requests, canceled.requests)

    await input.button('Game settings')
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible' })
    checkpoint = await page.evaluateHandle(async () => {
      const { armTempleCheckpoint } = await import('/scripts/local-render/temple-training-checkpoint.mjs'),
        { armBuildingSceneStart } = await import('/scripts/local-render/mission3-building-lifecycle.mjs'),
        { nearbyCheckpointState, nearbySnapshot } = await import('/scripts/local-render/follower-nearby-snapshot.mjs'),
        { GameScene } = await import('/app/scene.ts'),
        scene = window.testSceneRef.current, store = window.testStore,
        button = name => [...document.querySelectorAll('dialog.game-dialog button')].find(node => node.textContent.trim() === name),
        saved = armTempleCheckpoint({ kind: 'save', store, button: button('Save checkpoint'), snapshot: nearbyCheckpointState })
      let loaded, start, initial = null, replacement = null, unsubscribe = null
      return {
        async saved() { return { status: saved.status(), digest: await saved.digest(), expectedLoad: await saved.expectedLoadDigest() } },
        armLoad() {
          loaded = armTempleCheckpoint({ kind: 'load', store, button: button('Load checkpoint'), snapshot: nearbyCheckpointState })
          unsubscribe = store.subscribe(() => {
            const world = store.getWorld()
            if (world !== scene.world && !replacement) { replacement = world; unsubscribe() }
          })
          start = armBuildingSceneStart({ prototype: GameScene.prototype, store,
            expectedWorld: () => replacement, sceneRef: () => window.testSceneRef,
            attach(next) { initial = nearbySnapshot(next, store) } })
        },
        status() { return { start: start?.evidence,
          initialMode: initial?.nearby, oldDisposed: scene.disposed } },
        async loaded() { return { status: loaded.status(), digest: await loaded.digest(), initial } },
        close() {
          const errors = [], result = {}
          for (const [name, close] of [['save', () => saved.close()], ['load', () => loaded?.close()],
            ['start', () => start?.close()], ['subscription', () => unsubscribe?.()]])
            try { result[name] = close() } catch (error) { errors.push(String(error)) }
          return { result, errors }
        },
      }
    })
    await input.button('Save checkpoint')
    report.saved = await checkpoint.evaluate(api => api.saved())
    assert.equal(report.saved.status.captured, true)
    assert.deepEqual(report.saved.status.errors, [])
    assert.equal(await waitForCheckpointReadback(async () => {
      admit()
      report.committed = await page.evaluate(checkpointObservation)
      return JSON.stringify(report.committed) === JSON.stringify(report.saved.digest)
    }), true, 'Public Save must commit its complete typed record')
    report.profileSave = await observeCheckpoint('Mission 1 nearby followers Save')
    await witness.evaluate(api => api.close())
    await checkpoint.evaluate(api => api.armLoad())
    await input.button('Load checkpoint')
    const loaded = await wait(() => checkpoint.evaluate(api => api.status()), value => value.start?.attached,
      'Replacement Scene before first RAF', 15000)
    assert.deepEqual(loaded.start.errors, [])
    assert.equal(loaded.start.restored, true)
    assert.equal(loaded.oldDisposed, true)
    assert.equal(loaded.initialMode, true)
    report.loaded = await checkpoint.evaluate(api => api.loaded())
    assert.deepEqual(report.loaded.status.errors, [])
    assert.deepEqual(report.loaded.digest, report.saved.expectedLoad)
    await bindGame(page)
    await wait(() => page.evaluate(() => ({ paused: window.testStore.getWorld().paused, turn: window.testStore.getWorld().turn })),
      value => !value.paused && value.turn > report.loaded.initial.turn, 'Normal loaded clock')
    await input.pause()
    await followers()
    await install()
    await inspect('loaded-nearby')
    await toggle('loaded-global')
    // Same maintained CDP device-metrics path as check-browser-display-audio.
    // Browser display emulation does not touch World, camera or simulation time.
    cdp = await page.context().newCDPSession(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 2, mobile: false,
    })
    await wait(() => page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })),
      value => value.width === 1280 && value.height === 720 && value.dpr === 2, 'Compact DPR2 presentation')
    await inspect('compact-global')
    await toggle('compact-nearby')
    await toggle('compact-keyboard-global', true)
    assert.deepEqual(receipt.errors, [])
    report.status = 'observed'
  } catch (error) {
    failure = error; report.status = 'failed'; report.failure = String(error?.stack ?? error)
  } finally {
    if (failure) try { await screenshot('nearby-terminal-failure') }
    catch (error) { report.errors.push(String(error)) }
    if (heldPrimary) try { await page.mouse.up() } catch (error) { report.errors.push(String(error)) }
    report.epochs = []
    for (const handle of witnesses) {
      try {
        const evidence = await handle.evaluate(api => api.take())
        report.epochs.push(evidence)
        assertNearbyEvidence(evidence, report.epochs.length === 1
          ? { phases: ['global-held', 'global-away', 'nearby-before-save'], nearby: true }
          : { phases: ['loaded-global', 'compact-nearby', 'compact-keyboard-global'], nearby: false })
      } catch (error) { report.errors.push(String(error?.stack ?? error)) }
      finally { try { await handle.dispose() } catch (error) { report.errors.push(String(error)) } }
    }
    if (checkpoint) {
      try {
        report.checkpointCleanup = await checkpoint.evaluate(api => api.close())
        assert.deepEqual(report.checkpointCleanup.errors, [])
        for (const key of ['save', 'load']) {
          const state = report.checkpointCleanup.result[key]
          assert.deepEqual(state.errors, [])
          assert.deepEqual(state.cleanup, { listener: true, subscription: true })
        }
      } catch (error) { report.errors.push(String(error?.stack ?? error)) }
      finally { try { await checkpoint.dispose() } catch (error) { report.errors.push(String(error)) } }
    }
    if (cdp) {
      try { await cdp.send('Emulation.clearDeviceMetricsOverride') }
      catch (error) { report.errors.push(String(error)) }
      try { await cdp.detach() } catch (error) { report.errors.push(String(error)) }
    }
    if (report.status === 'observed' && !report.errors.length) report.status = 'passed'
    else report.status = 'failed'
    save()
  }
  if (failure) throw failure
  assert.deepEqual(report.errors, [])
  return { status: report.status, stages: report.stages.length,
    epochs: report.epochs.map(({ requests, commits, selections }) => ({ requests, commits, selections })),
    report: 'mission1-nearby-followers.json' }
}
