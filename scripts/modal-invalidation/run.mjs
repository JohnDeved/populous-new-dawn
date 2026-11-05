import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { installModalInvalidationObserver } from './observer.mjs'
import { holdSkyResponse } from './response-gate.mjs'
import { validateModalInvalidationEvidence } from './evidence.mjs'
import { contextDeadline, settleWithin } from './deadline.mjs'
import { enterModalMission } from './mission-entry.mjs'

async function prepareHeldCast(page) {
  const button = name => page.getByRole('button', { name, exact: true })
  // Mission 1 starts with ordinary Blast stock. Wait for its real reincarnation
  // and camera, then cast using shipped controls. Never grant a spell or seed a shot.
  await page.waitForFunction(() => {
    const world = window.testStore.getWorld(), unit = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    return !world.paused && !world.inputMask && world.shots.blast > 0 &&
      !world.castingTribes[0].cooldown && unit?.native?.state === 19 && unit.hp > 0 && !unit.flight && !unit.lift
  })
  await button('Pause game').click(); await button('Select and focus shaman').click()
  await page.waitForFunction(() => {
    const scene = window.testSceneRef.current
    return !scene.cameraMotion.active && !scene.viewTransition && !scene.resultCamera.active
  })
  await page.getByTitle('spells', { exact: true }).click()
  await page.getByRole('button', { name: /^Blast, [1-9][0-9]* shots$/ }).click()
  await page.evaluate(installModalInvalidationObserver)
  await button('Resume game').click()
  const target = await page.evaluate(() => {
    const scene = window.testSceneRef.current, unit = scene.world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      point = { x: unit.x + 5, z: unit.z + 5 }, projected = scene.screen(point, Math.max(0, scene.y(point))),
      rect = scene.renderer.domElement.getBoundingClientRect()
    return { x: rect.left + (projected.x + 1) * rect.width / 2, y: rect.top + (1 - projected.y) * rect.height / 2 }
  })
  await page.mouse.move(target.x, target.y)
  await page.waitForFunction(point => {
    const scene = window.testSceneRef.current
    return scene.pointer && scene.pointerScreen?.clientX === point.x && scene.pointerScreen?.clientY === point.y &&
      document.elementFromPoint(point.x, point.y) === scene.renderer.domElement
  }, target)
  const prior = await page.evaluate(() => {
    const world = window.testStore.getWorld()
    return { casts: world.stats.cast, stock: world.shots.blast, shots: world.projectiles.map(shot => shot.id),
      cheats: window.testStore.hasUsedCheats() }
  })
  assert.equal(prior.cheats, false)
  await page.mouse.click(target.x, target.y); await page.keyboard.press('F9')
  await page.waitForFunction(() => window.testSceneRef.current.modalSuspended)
  const held = await page.evaluate(() => window.modalInvalidationObserver.bindHeldCast())
  assert.equal(prior.shots.includes(held.frozenState.shot[0]), false)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().stats.cast), prior.casts + 1)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().shots.blast), prior.stock - 1)
  // Normal callbacks settle the modal entry draw. No force-render, simulated
  // event, scene.animate call, clock advance or animation cancellation is used.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  return { target, prior, held }
}

export function comparePixels(before, after, triggerAt, { changed }) {
  assert.ok(before && after && after.at > triggerAt && after.drawCount === before.drawCount + 1)
  assert.deepEqual(before.crop, after.crop)
  assert.equal(after.nonempty, true)
  const differs = before.bytes.some((value, i) => value !== after.bytes[i])
  assert.equal(differs, changed, changed ? 'The visible sky crop did not change' : 'Restored canvas differs from its frozen frame')
  return { nonempty: after.nonempty, afterTrigger: after.at > triggerAt, changedFromBefore: differs,
    crop: after.crop, beforeDrawCount: before.drawCount, afterDrawCount: after.drawCount }
}

// Admission is deliberately external: this module cannot launch a browser,
// build, server, workflow or fallback. Call only from a separately reviewed
// dedicated route, with its owned browser and exact candidate fixture build.
export async function runModalInvalidation({ browser, url, candidateRoot, output, head, signal }) {
  const git = (...args) => execFileSync('git', ['-C', candidateRoot, ...args], { encoding: 'utf8' }).trim()
  assert.match(head, /^[0-9a-f]{40}$/); assert.equal(git('rev-parse', 'HEAD'), head)
  assert.equal(git('status', '--porcelain'), '', 'Candidate source must be clean')
  const assetBlob = git('rev-parse', `${head}:public/original/sky.png`)
  const evidence = { kind: 'modal-invalidation-browser-v1', head, status: 'failed',
    browserErrors: [], browserWarnings: [], episodes: [], cleanupVerified: false, sceneOwnerUnchanged: false }
  let context, page, gate, work, primaryError, observerCleanup, gateCleanup, contextClosed = false
  const fail = error => { primaryError ??= error }
  const lifetime = contextDeadline({ timeoutMs: 60000, onFailure: fail })
  const abort = () => lifetime.abort(signal.reason ?? Error('Modal capture aborted'))
  if (signal?.aborted) { lifetime.cancelTimer(); signal.throwIfAborted() }
  signal?.addEventListener('abort', abort, { once: true })
  const load = path => import(pathToFileURL(resolve(candidateRoot, path)).href)
  try {
    work = (async () => {
    context = await lifetime.create(() => browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block' }))
    page = await context.newPage(); lifetime.guard(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000)
    page.on('pageerror', error => evidence.browserErrors.push(String(error)))
    page.on('crash', () => evidence.browserErrors.push('Page crashed'))
    page.on('console', message => {
      if (message.type() === 'error') evidence.browserErrors.push(message.text())
      if (message.type() === 'warning') evidence.browserWarnings.push(message.text())
    })
      gate = await holdSkyResponse(page, url, assetBlob)
      await page.addInitScript(() => {
        window.modalInvalidationInput = []
        window.addEventListener('keydown', event => {
          if (event.key === 'F9' && window.modalInvalidationInput.length < 4)
            window.modalInvalidationInput.push({ key: event.key, trusted: event.isTrusted, repeat: event.repeat, at: performance.now() })
        }, true)
      })
      const target = new URL(url); target.searchParams.set('modal-invalidation', '1')
      await page.goto(target.href, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => !!window.__pndModalInvalidationFixture)
      assert.equal(await page.evaluate(() => window.__pndModalInvalidationFixture.buildRevision), head)
      const { openCampaignFromMainMenu } = await load('scripts/browser-new-game.mjs')
      const { bindGame } = await load('scripts/browser-game.mjs')
      evidence.entry = {}
      await enterModalMission(page, { openCampaignFromMainMenu, bindGame, signal: signal ?? new AbortController().signal,
        deadlineAt: Date.now() + 30000, trace: evidence.entry })
      evidence.castTarget = await prepareHeldCast(page)
      evidence.runtime = await page.evaluate(() => {
        const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
        return { buildRevision: window.__pndModalInvalidationFixture.buildRevision,
          userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
          renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
          vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR), version: gl.getParameter(gl.VERSION) }
      })
      evidence.input = await page.evaluate(() => window.modalInvalidationInput)
      assert.equal(evidence.input.length, 1); assert.equal(evidence.input[0].trusted, true); assert.equal(evidence.input[0].repeat, false)
      assert.equal(gate.record.status, 'held', gate.record.failure ?? 'Sky response was not acquired')
      const textureBefore = await page.evaluate(() => window.modalInvalidationObserver.watchSky())
      evidence.partial = { phase: 'late-texture', textureBefore }
      const sample = () => page.evaluate(() => window.modalInvalidationObserver.sample(400))
      const read = () => page.evaluate(() => window.modalInvalidationObserver.read())
      const before = await sample(), beforeDraw = await read()
      Object.assign(evidence.partial, { before, beforeDraw })
      const triggerAt = await page.evaluate(() => performance.now())
      evidence.partial.triggerAt = triggerAt
      gate.release()
      await page.waitForFunction(count => {
        const observer = window.modalInvalidationObserver, texture = observer.texture()
        return texture.status === 'ready' && texture.readyResult === true && observer.read().drawCount > count
      }, beforeDraw.drawCount)
      const textureAfter = await page.evaluate(() => window.modalInvalidationObserver.texture()), after = await sample(), afterDraw = await read()
      Object.assign(evidence.partial, { textureAfter, after, afterDraw })
      assert.equal(textureAfter.imageUrl, gate.record.url); assert.equal(gate.record.status, 'fulfilled')
      evidence.response = gate.record
      evidence.episodes.push({ kind: 'late-texture', triggerAt, triggerCompleted: true, triggerWasSynthetic: false,
        samples: [...before, ...after], pixelReadback: comparePixels(beforeDraw.pixels, afterDraw.pixels, triggerAt, { changed: true }),
        texture: { statusBefore: textureBefore.status, statusAfter: textureAfter.status,
          readyResult: textureAfter.readyResult, completionRevisionBefore: textureBefore.revision,
          completionRevisionAfter: textureAfter.revision, realImageDecode: textureAfter.realImageDecode,
          usedByVisibleMaterial: textureBefore.usedByVisibleMaterial && textureAfter.usedByVisibleMaterial },
        raw: { before: beforeDraw, after: afterDraw } })
      evidence.partial = { phase: 'webgl-restoration' }
      const restoreBefore = await sample(), restoreBeforeDraw = await read()
      Object.assign(evidence.partial, { before: restoreBefore, beforeDraw: restoreBeforeDraw })
      const restoreTrigger = await page.evaluate(() => window.modalInvalidationObserver.lose())
      evidence.partial.triggerAt = restoreTrigger
      await page.waitForFunction(() => window.modalInvalidationObserver.read().events.some(e => e.kind === 'lost'))
      await page.evaluate(() => window.modalInvalidationObserver.restore())
      await page.waitForFunction(count => {
        const state = window.modalInvalidationObserver.read()
        return state.events.some(e => e.kind === 'restored') && state.drawCount > count
      }, restoreBeforeDraw.drawCount)
      const restoreAfter = await sample(), restoreAfterDraw = await read(), events = restoreAfterDraw.events
      Object.assign(evidence.partial, { after: restoreAfter, afterDraw: restoreAfterDraw })
      assert.equal(events.length, 2); assert.equal(events[0].kind, 'lost'); assert.equal(events[1].kind, 'restored')
      evidence.episodes.push({ kind: 'webgl-restoration', triggerAt: restoreTrigger, triggerCompleted: true, triggerWasSynthetic: false,
        samples: [...restoreBefore, ...restoreAfter], pixelReadback: comparePixels(restoreBeforeDraw.pixels, restoreAfterDraw.pixels, restoreTrigger, { changed: false }),
        context: { extension: 'WEBGL_lose_context', lostEventTrusted: events[0].trusted, restoredEventTrusted: events[1].trusted,
          observedLost: events[0].contextLost, observedRestored: !events[1].contextLost, lostAt: events[0].at, restoredAt: events[1].at },
        raw: { before: restoreBeforeDraw, after: restoreAfterDraw } })
      assert.equal(restoreAfterDraw.errors.length, 0)
      await page.screenshot({ path: resolve(output, 'modal-restored.png') })
      delete evidence.partial
    })()
    await Promise.race([work, lifetime.expired])
  } catch (error) { fail(error) }
  finally {
    lifetime.cancelTimer(); signal?.removeEventListener('abort', abort)
    // Even if the renderer never answers cleanup, independently attempt context
    // closure. The external hard supervisor is still required if close hangs.
    const emergencyClose = setTimeout(() => { void lifetime.close() }, 3000)
    const cleanupStep = async (name, operation) => {
      const result = await settleWithin(operation, 1500)
      evidence.cleanupSteps ??= []
      evidence.cleanupSteps.push({ name, status: result.status, error: result.error })
      if (result.status !== 'fulfilled') fail(Error(`${name}: ${result.error ?? result.status}`))
      return result.value
    }
    if (page && !page.isClosed())
      observerCleanup = await cleanupStep('observer', () => page.evaluate(() => window.modalInvalidationObserver?.close() ?? null))
    gateCleanup = await cleanupStep('response-gate', () => gate?.close())
    const close = lifetime.close(); clearTimeout(emergencyClose)
    contextClosed = await cleanupStep('context', () => close) === true
    if (work) await cleanupStep('work-drain', () => work.catch(error => { fail(error) }))

    evidence.response = gate?.record ?? null
    evidence.cleanup = { observer: observerCleanup, gate: gateCleanup, contextClosed }
    evidence.cleanupVerified = observerCleanup?.restored === true && observerCleanup.observers === 0 &&
      observerCleanup.errors.length === 0 && gateCleanup?.pending === 0 && !gateCleanup.failure && contextClosed
    evidence.sceneOwnerUnchanged = evidence.episodes.length === 2 &&
      evidence.episodes.every(episode => episode.samples.every(sample => sample.ownerUnchanged))
    if (!primaryError) {
      try { evidence.acceptance = validateModalInvalidationEvidence(evidence); evidence.status = 'passed' } catch (error) { fail(error) }
    }
    if (primaryError) evidence.failure = String(primaryError)
    writeFileSync(resolve(output, 'modal-invalidation.json'), JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' })
  }
  if (primaryError) throw primaryError
  return evidence
}
