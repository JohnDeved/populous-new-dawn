import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installShamanCastingObserver } from './shaman-casting-observer.mjs'
import { castingArtworkReference, validateShamanCastingEvidence } from './shaman-casting-evidence.mjs'

// This helper owns no context, world, timer or browser. The existing F9 episode
// supplies its unchanged 55s bound and public Mission 1 Scene.
export async function beginOrdinaryCastingWitness(page) {
  const button = name => page.getByRole('button', { name, exact: true })
  assert.equal(await page.evaluate(() => window.testStore.hasUsedCheats()), false)
  // Let the ordinary clock finish reincarnation. finishStart enters idle
  // approach (17), which settles into resting state 19. State 10 here still
  // owns opening command18; it is not the authored idle caster.
  await button('Resume game').click()
  await page.waitForFunction(() => {
    const w = window.testStore.getWorld(), u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      p = u?.native, order = p && w.buildingOrders.records[p.immediateCommand || p.commands[p.commandCursor]]
    return w.status === 'playing' && !w.paused && !w.inputMask && w.shots.blast > 0 &&
      !w.castingTribes[0].cooldown && u?.hp > 0 && !u.flight && !u.lift && p?.state === 19 &&
      !p.vehicle && !(p.flags2 & 0x100000) && !(p.flags4 & 128) && order?.model !== 18
  })
  await button('Pause game').click()
  await button('Select and focus shaman').click()
  await page.waitForFunction(() => {
    const s = window.testSceneRef.current, u = s.world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    return s.world.selected.includes(u.id) && !s.cameraMotion.active && !s.viewTransition && !s.resultCamera.active
  })
  await page.evaluate(installShamanCastingObserver)
  const before = await page.evaluate(() => window.shamanCastingObserver.arm('ordinary'))
  assert.ok(before.stock > 0); assert.equal(before.cheatsUsed, false)
  await page.getByTitle('spells', { exact: true }).click()
  await page.getByRole('button', { name: /^Blast, [1-9][0-9]* shots$/ }).click()
  assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), 'blast')
  await button('Resume game').click()
  const target = await page.evaluate(() => {
    const s = window.testSceneRef.current, u = s.world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      point = { x: u.x + 5, z: u.z + 5 }, projected = s.screen(point, Math.max(0, s.y(point))),
      r = s.renderer.domElement.getBoundingClientRect()
    return { x: r.left + (projected.x + 1) * r.width / 2, y: r.top + (1 - projected.y) * r.height / 2 }
  })
  await page.mouse.move(target.x, target.y)
  await page.waitForFunction(point => {
    const s = window.testSceneRef.current
    return s.pointerScreen?.clientX === point.x && s.pointerScreen?.clientY === point.y &&
      s.pointer && document.elementFromPoint(point.x, point.y) === s.renderer.domElement
  }, target)
  await page.mouse.click(target.x, target.y)
  await waitForCastingWitness(page, 'ordinary')
  await button('Pause game').click()
  return { target, before }
}

export async function waitForCastingWitness(page, label) {
  await page.waitForFunction(label => {
    const state = window.shamanCastingObserver.status()
    if (state.errors.length) throw Error(state.errors.join('; '))
    return state.casts.some(cast => cast.label === label && cast.done)
  }, label)
}

// Host timestamps stay separate from the observer's page clock.
export function startCastingHostOperation(report, operation) {
  const timing = report.castingHostTiming ??= { clock: 'host.performance.now', operations: [] }
  assert.ok(timing.operations.length < 4, 'Casting host timing exceeded four operations')
  const row = { operation, start: performance.now(), end: null, completed: false }
  timing.operations.push(row)
  return completed => { row.end = performance.now(); row.completed = completed }
}

export async function prepareCastingF9(page, report, before, deadline) {
  const token = randomUUID(), binding = `shamanCastingFirstRender_${token.replaceAll('-', '')}`,
    frame = page.mainFrame(), timing = report.castingNotification = { clock: 'host.performance.now', token,
      armedAt: performance.now(), receivedAt: null, clickCompletedAt: null, dispatchAt: null, closedAt: null }
  let active = true, clickStarted = false, clicked = false, received = null, dispatched = false, failure = null,
    bindingHandle, subscription, subscriptionAttempted = false, closePromise, resolve, reject
  const done = new Promise((yes, no) => { resolve = yes; reject = no })
  // A click may still be pending when the page rejects this observation.
  void done.catch(() => {})
  const cancel = error => {
    if (timing.closedAt !== null) return
    failure ??= error
    timing.failure ??= String(error)
    timing.cancelledAt ??= performance.now()
    active = false
    reject(failure)
  }
  const guard = () => {
    assert.ok(active && !report.timedOut && !page.isClosed() && performance.now() < deadline,
      'Casting F9 notification is cancelled, closed or past its deadline')
  }
  const dispatch = () => {
    if (!active || !clicked || !received || dispatched) return
    try { guard() } catch (error) { cancel(error); return }
    dispatched = true
    timing.dispatchAt = performance.now()
    const end = startCastingHostOperation(report, 'keyboard-press')
    try {
      void page.keyboard.press('F9').then(() => {
        end(true)
        if (active) resolve()
      }, error => { end(false); cancel(error) })
    } catch (error) { end(false); cancel(error) }
  }
  const receive = (source, message) => {
    try {
      guard()
      assert.ok(source.page === page && source.frame === frame, 'Casting notification page/frame changed')
      assert.equal(message?.token, token, 'Casting notification token changed')
      if (message.kind === 'invalid') throw Error(message.reason)
      assert.ok(subscription && !received && message.kind === 'ready' && message.label === 'subsequent' &&
        message.personId === subscription.personId && message.before === before && message.after === before + 1 &&
        Number.isInteger(message.shot) && Number.isInteger(message.stamp) &&
        Number.isFinite(message.copiedAt) && Number.isFinite(message.pageAt) && message.copiedAt <= message.pageAt,
      'Duplicate or invalid first-render notification')
      received = message
      timing.receivedAt = performance.now()
      timing.pageNotification = { clock: 'page.performance.now', ...message }
      dispatch()
    } catch (error) { cancel(error); throw error }
  }
  const closed = () => cancel(Error('Casting F9 page closed')),
    navigated = target => { if (target === frame) cancel(Error('Casting F9 page navigated')) }
  page.on('close', closed); page.on('framenavigated', navigated)
  const close = () => closePromise ??= (async () => {
    active = false
    // No late callback may dispatch while protocol cleanup is in flight.
    reject(failure ?? Error('Casting F9 notification disarmed'))
    try {
      if (subscriptionAttempted && !page.isClosed())
        await page.evaluate(token => window.shamanCastingObserver.disarmFirstRunningCast(token), token)
    } catch (error) { cancel(error) }
    finally {
      try { await bindingHandle?.dispose() } catch (error) { cancel(error) }
      page.off('close', closed); page.off('framenavigated', navigated)
      timing.closedAt = performance.now()
    }
    if (failure) throw failure
  })()
  try {
    bindingHandle = await page.exposeBinding(binding, receive)
    guard()
    subscriptionAttempted = true
    subscription = await page.evaluate(options => window.shamanCastingObserver.subscribeFirstRunningCast(options),
      { binding, token, before })
    guard()
    return { done, cancel, close, async click(target) {
      let end
      try {
        guard()
        assert.ok(!clickStarted, 'Casting pointer click repeated')
        clickStarted = true
        end = startCastingHostOperation(report, 'pointer-click')
        await page.mouse.click(target.x, target.y)
        end(true); end = null
        guard()
        clicked = true; timing.clickCompletedAt = performance.now()
        dispatch()
        await done
      } catch (error) { end?.(false); cancel(error); throw failure }
    } }
  } catch (error) {
    cancel(error)
    try { await close() } catch {}
    throw error
  }
}

// Called before the existing context is disposed, including on failure. Raw
// observations/copies are retained even if validation rejects the run.
export async function retainCastingWitness(page, output, { validate = true } = {}) {
  const observation = await page.evaluate(() => window.shamanCastingObserver?.finish() ?? null)
  if (!observation) return null
  const root = resolve(import.meta.dirname, '../..'), sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
  const report = { status: 'failed', observation, native: castingArtworkReference.provenance,
    source: Object.fromEntries(['app/person-casting.ts', 'app/live-people.ts', 'app/live-command.ts',
      'app/spell-casting.ts', 'app/world-turn.ts', 'app/scene-entities.ts', 'app/unit-animation-source.ts',
      'app/game-clock.ts', 'app/original-units.json', 'tests/fixtures/shaman-casting-native.json',
      'scripts/tutorial-browser/shaman-casting.mjs', 'scripts/tutorial-browser/shaman-casting-observer.mjs',
      'scripts/tutorial-browser/shaman-casting-evidence.mjs']
      .map(file => [file, sha256(readFileSync(resolve(root, file)))])) }
  try {
    for (const cast of observation.casts) for (const crop of cast.crops) {
      if (!crop.png) continue
      assert.match(crop.file, /^shaman-casting-(ordinary|subsequent)-[01]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.file), bytes, { flag: 'wx' })
      crop.sha256 = sha256(bytes); delete crop.png
    }
    if (validate) {
      report.acceptance = validateShamanCastingEvidence(observation)
      report.status = 'passed'
    } else report.status = 'incomplete'
  } catch (error) {
    report.failure = String(error)
    throw error
  } finally {
    writeFileSync(resolve(output, 'shaman-casting.json'), JSON.stringify(report, null, 2) + '\n')
  }
  return report
}
