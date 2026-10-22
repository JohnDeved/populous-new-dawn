import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'

export const conversionLimitMs = 75000
export const conversionObservationMs = 30000
const root = resolve(import.meta.dirname, '../..')

// Read-only failure evidence, including failures before bindGame installs aliases.
export function readConversionStartup() {
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  return { level: world?.outcome.level, turn: world?.turn, paused: world?.paused, speed: world?.speed,
    inputMask: world?.inputMask, flybyFlags: world?.flyby.flags, flybyFrame: world?.flyby.frame,
    flybyWarmup: world?.flyby.warmup, casts: world?.spellCasts[2][17],
    stock: world?.manaWorld.spells[2].stocks[17], sameWorld: !!scene && scene.world === world,
    canvasConnected: !!scene?.renderer.domElement.isConnected,
    loading: !!document.querySelector('.loading-world'), visibility: document.visibilityState,
    skipAvailable: !!world && (world.inputMask & 64) !== 0 && (world.flyby.flags & 0x51) === 0x11 }
}

export async function waitForConversionIntroduction(page, report) {
  report.phase = 'wait-introduction-control'
  report.startup = { bound: await page.evaluate(readConversionStartup) }
  // Mission 3 starts its authored flyby at turn 16, not at world creation.
  // Wait for its native input gate instead of accepting the initial unlocked state.
  await page.waitForFunction(() => {
    const world = window.testStore.getWorld()
    return !document.querySelector('.loading-world') && (world.inputMask & 64) !== 0 &&
      (world.flyby.flags & 0x51) === 0x11
  })
  report.startup.beforeSkip = await page.evaluate(readConversionStartup)
  report.phase = 'skip-introduction'
  await skipIntroductionWithSpace(page, { timeout: 12000 })
  report.phase = 'wait-input-ready'
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  report.startup.afterSkip = await page.evaluate(readConversionStartup)
}

export async function pauseConversionBaseline(page, report) {
  await setWorldPaused(page, true, { timeout: 12000 })
  const baseline = report.pausedBaseline = await page.evaluate(readConversionStartup)
  assert.equal(baseline.level, 3)
  assert.ok(Number.isSafeInteger(baseline.turn) && baseline.turn >= 0)
  assert.equal(baseline.inputMask, 0)
  assert.equal(baseline.paused, true)
  assert.equal(baseline.sameWorld, true)
  assert.equal(baseline.casts, 0, 'Public setup must precede the first natural conversion')
  assert.equal(baseline.stock, 1)
}

// Resume only after the measured paused-baseline observer has been armed.
export async function resumeArmedConversion(page, report) {
  report.phase = 'public-resume'
  report.resume = { before: await page.evaluate(readConversionStartup), actions: [] }
  if (report.resume.before.paused) {
    await setWorldPaused(page, false, { timeout: 12000 })
    report.resume.actions.push('native-space-resume')
  }
  await page.waitForFunction(() => !window.testStore.getWorld().paused)
  report.resume.after = await page.evaluate(readConversionStartup)
}

export function setupConversionCamera(codec) {
  const scene = window.testSceneRef.current, w = window.testStore.getWorld(),
    camera = { x: -45, z: -91 }, encode = value => JSON.stringify(codec(value)),
    identity = () => {
      const { mode, lightView, ...rest } = w
      return rest
    },
    before = encode(identity()), beforeMode = w.mode, beforeLightView = structuredClone(w.lightView),
    expectedLightView = { x: (Math.round((camera.x + 8) * 256) << 16) >> 16,
      y: (Math.round((-camera.z - 8) * 256) << 16) >> 16, h: Math.round(scene.y(camera) * 45) }
  // Ordinary focus cancels UI mode; updateView stores its exact camera position
  // for dynamic terrain lighting. Every other World field stays losslessly equal,
  // including Map/Set contents, typed arrays, undefined values and shared references.
  scene.focus(camera) // One fixed first-conversion point, not actor pursuit.
  if (w.mode !== null || encode(w.lightView) !== encode(expectedLightView))
    throw Error('Diagnostic camera did not apply only its expected mode/light-view changes')
  if (scene.world !== w || window.testStore.getWorld() !== w || encode(identity()) !== before)
    throw Error('Diagnostic camera changed non-camera world state')
  return { level: w.outcome.level, turn: w.turn, paused: w.paused, speed: w.speed,
    casts: w.spellCasts[2][17], stock: w.manaWorld.spells[2].stocks[17], camera,
    cameraWorldChanges: { mode: { before: beforeMode, after: w.mode },
      lightView: { before: beforeLightView, after: w.lightView } },
    renderer: scene.renderer.getContext().getParameter(scene.renderer.getContext().RENDERER) }
}

// Logical records use the existing fixed-turn boundary; RAF owns only artwork
// and rendered cleanup. The original callback is chained without driving time.
export function installConversionObserver({ observationMs, armed = false, baselineTurn = null }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    clock = scene.gameClock, originalTurn = clock.afterTurn,
    turnDescriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn'),
    canvas = scene.renderer.domElement, started = performance.now(), copies = [], keys = new Set(),
    result = { done: false, error: null, visits: 0, samples: [], logical: [], crops: [],
      bornTurn: null, removal: null, terminal: null, restored: false,
      phase: armed ? 'armed' : 'observing', armedAt: armed ? { turn: world.turn, paused: world.paused } : null,
      firstRunningTurn: null, lastObservedTurn: world.turn, observedTurns: 0 }
  let raf, flash, target, stopped = false, lastKey
  const restore = () => {
    if (clock.afterTurn === turnWrapper) {
      if (turnDescriptor) Object.defineProperty(clock, 'afterTurn', turnDescriptor)
      else delete clock.afterTurn
    }
    result.restored = clock.afterTurn === originalTurn
    if (!result.restored) result.error ??= 'Conversion observer callback ownership changed'
  }
  const stop = reason => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    restore()
    result.done = true
    result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame,
      elapsedMs: performance.now() - started, present: !!flash && world.effects.includes(flash),
      meshPresent: !!flash && scene.fxMeshes.has(flash.id), remaining: flash?.turnsRemaining }
  }
  const check = (logical = false) => {
    if (performance.now() - started > observationMs || result.visits > 7200)
      throw Error('Conversion observation exceeded its fixed bound')
    if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world ||
      scene.world !== world || scene.gameClock !== clock)
      throw Error('Conversion observer lost its original Scene/world/clock')
    if (clock.afterTurn !== turnWrapper) throw Error('Conversion observer callback ownership changed')
    if (!canvas.isConnected || document.visibilityState !== 'visible' || world.speed !== 1)
      throw Error('Conversion observation must remain connected, visible and at normal speed')
    if (result.phase === 'armed') {
      if (world.turn !== baselineTurn && !(logical && world.turn === baselineTurn + 1))
        throw Error('Conversion armed phase missed an ordinary turn')
      if (logical && world.paused) throw Error('Conversion fixed turn occurred while paused')
    } else if (world.paused) throw Error('Conversion observation must remain running')
    if (scene.renderer.getContext().isContextLost()) throw Error('Conversion WebGL context lost')
  }
  const logicalVisit = () => {
    check(true)
    if (world.turn !== result.lastObservedTurn + 1) throw Error('Conversion missed a fixed turn')
    result.lastObservedTurn = world.turn
    result.observedTurns++
    result.firstRunningTurn ??= world.turn
    result.phase = 'observing'
    if (result.removal) return
    if (!flash) {
      flash = world.effects.find(f => f.startConversionLink !== undefined &&
        world.units.some(u => u.id === f.startConversionLink && u.team === 'yellow'))
      if (!flash) {
        if (world.spellCasts[2][17] > 1) throw Error('Missed the first natural AI conversion')
        return
      }
      target = world.units.find(u => u.id === flash.startConversionLink)
      result.bornTurn = world.turn
      result.birth = { turn: world.turn, id: flash.id, targetId: target.id, team: target.team, kind: target.kind,
        casts: world.spellCasts[2][17], stock: world.manaWorld.spells[2].stocks[17],
        remaining: flash.turnsRemaining, linkedCount: world.effects.filter(f => f.startConversionLink === target.id).length,
        birthSubstitute: world.effects.some(f => f.kind === 'birth' && f.x === flash.x && f.z === flash.z),
        cue5: world.sounds.some(s => s.cue === 5 && s.turn === world.turn), x: flash.x, z: flash.z }
    }
    const sample = { turn: world.turn, present: world.effects.includes(flash), remaining: flash.turnsRemaining,
      id: flash.id, targetId: target.id, x: flash.x, z: flash.z, targetX: target.x, targetZ: target.z }
    if (result.logical.length >= 10) throw Error('Conversion logical storage exceeded')
    result.logical.push(sample)
    if (!sample.present) result.removal = { ...sample }
    if (world.turn > result.bornTurn + 8) throw Error('Conversion owner exceeded eight logical visits')
  }
  function turnWrapper(...args) {
    let returned
    try { returned = originalTurn?.apply(this, args) }
    catch (error) {
      result.error ??= String(error)
      stop('callback-error')
      throw error
    }
    if (!stopped) {
      try { logicalVisit() }
      catch (error) { result.error ??= String(error); stop('error') }
    }
    return returned
  }
  const visit = () => {
    if (stopped) return
    try {
      result.visits++
      check()
      if (!flash) { raf = requestAnimationFrame(visit); return }
      if (!world.effects.includes(flash)) {
        if (!result.removal) throw Error('Conversion removal missed fixed-turn observation')
        // Scene updates meshes after advanceGame, not inside afterTurn.
        if (!scene.fxMeshes.has(flash.id)) { stop('rendered-expiry'); return }
        raf = requestAnimationFrame(visit); return
      }
      const group = scene.fxMeshes.get(flash.id), sprite = group?.userData.sprite,
        animation = flash.animation, stamp = scene.renderer.info.render.frame,
        key = `${world.turn}:${animation.object}:${animation.f1}:${stamp}`
      if (key !== lastKey) {
        lastKey = key
        const frame = animation.object === 0x650 ? null : animation.object + (animation.f1 >>> 2),
          sample = { turn: world.turn, stamp, elapsedMs: performance.now() - started,
            id: flash.id, targetId: target.id, remaining: flash.turnsRemaining, x: flash.x, z: flash.z,
            targetX: target.x, targetZ: target.z, object: animation.object, draw: animation.draw,
            f1: animation.f1, flags: animation.renderFlags, palette: animation.palette, frame,
            sequence: group?.userData.sequence, visible: !!group?.visible && !!sprite?.visible,
            submitted: !!sprite && !!scene.view.painter.source(sprite), opacity: sprite?.material.opacity,
            uv: sprite?.userData.atlasTransform?.toArray(), size: sprite?.scale.toArray(),
            center: sprite?.center.toArray(), texture: sprite?.material.map?.image?.currentSrc ?? sprite?.material.map?.image?.src }
        if (result.samples.length >= 2048) throw Error('Conversion sample storage exceeded')
        result.samples.push(sample)
        if (sample.visible && frame !== null && !keys.has(frame) && keys.size < 8) {
          keys.add(frame) // A failed original frame slot is never replaced by later pixels.
          if (!sample.submitted) throw Error('Visible conversion frame was not submitted to painter')
          const rect = canvas.getBoundingClientRect(), point = scene.screen(flash, flash.height),
            px = (point.x + 1) * canvas.width / 2, py = (1 - point.y) * canvas.height / 2,
            width = 192, height = 192, x = Math.floor(px - width / 2), y = Math.floor(py - 144)
          if (x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height)
            throw Error('Conversion crop falls outside the actual canvas')
          const clip = { x: rect.left + x * rect.width / canvas.width,
            y: rect.top + y * rect.height / canvas.height,
            width: width * rect.width / canvas.width, height: height * rect.height / canvas.height },
            owner = document.elementFromPoint(rect.left + px * rect.width / canvas.width,
              rect.top + (py - 50) * rect.height / canvas.height)
          if (owner !== canvas) throw Error('Conversion artwork center is covered by UI')
          const copy = document.createElement('canvas')
          copy.width = width; copy.height = height
          const context = copy.getContext('2d'), copyStart = performance.now()
          if (!context) throw Error('Conversion canvas copy context unavailable')
          context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
          const crop = { filename: `spell-conversion-frame-${result.crops.length}.png`, frame,
            turn: world.turn, stamp, clip, copyMs: performance.now() - copyStart }
          sample.cropFile = crop.filename
          result.crops.push(crop); copies.push({ copy, context, crop })
        }
      }
      raf = requestAnimationFrame(visit)
    } catch (error) { result.error = String(error); stop('error') }
  }
  window.__pndConversionObservation = {
    result,
    retain() {
      if (!stopped) stop('retained-before-completion')
      for (const { copy, context, crop } of copies) {
        try {
          const bytes = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
          for (let i = 0; i < bytes.length; i += 4)
            if (bytes[i + 3]) colors.add((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2])
          crop.colors = colors.size
          crop.png = copy.toDataURL('image/png')
        } catch (error) { crop.error = String(error); result.error ??= String(error) }
        finally { copy.width = 0; copy.height = 0 }
      }
      copies.length = 0
      return result
    },
  }
  try {
    if (armed && (!world.paused || !Number.isSafeInteger(baselineTurn) || baselineTurn < 0 || world.turn !== baselineTurn))
      throw Error('Conversion must arm at the unchanged measured paused baseline')
    if (world.spellCasts[2][17] !== 0 || world.effects.some(f => f.startConversionLink !== undefined))
      throw Error('Conversion observer must precede the first conversion')
    clock.afterTurn = turnWrapper
    check()
    raf = requestAnimationFrame(visit)
  } catch (error) { result.error ??= String(error); stop('installation-error'); throw error }
}

export function validateConversionObservation(observation, atlas) {
  assert.equal(observation.error, null)
  assert.equal(observation.restored, true)
  if (observation.armedAt) {
    assert.equal(observation.armedAt.paused, true)
    assert.ok(Number.isSafeInteger(observation.armedAt.turn) && observation.armedAt.turn >= 0)
    assert.equal(observation.firstRunningTurn, observation.armedAt.turn + 1)
    assert.equal(observation.observedTurns, observation.lastObservedTurn - observation.armedAt.turn)
  }
  assert.equal(observation.terminal.reason, 'rendered-expiry')
  assert.equal(observation.birth.turn, observation.bornTurn)
  assert.equal(observation.removal.turn - observation.bornTurn, 8)
  assert.equal(observation.removal.present, false)
  assert.equal(observation.removal.remaining, 0)
  assert.ok(observation.terminal.turn >= observation.removal.turn)
  assert.equal(observation.logical.length, 9)
  for (const [index, sample] of observation.logical.entries()) {
    assert.equal(sample.turn, observation.bornTurn + index)
    assert.equal(sample.remaining, 8 - index)
    assert.equal(sample.present, index < 8)
    assert.equal(sample.id, observation.birth.id)
    assert.equal(sample.targetId, observation.birth.targetId)
  }
  assert.deepEqual(observation.removal, observation.logical.at(-1))
  assert.equal(observation.terminal.present, false)
  assert.equal(observation.terminal.meshPresent, false)
  assert.equal(observation.terminal.remaining, 0)
  const birth = observation.birth
  assert.equal(birth.casts, 1); assert.equal(birth.stock, 0)
  assert.equal(birth.team, 'yellow'); assert.equal(birth.kind, 'brave')
  assert.equal(birth.remaining, 8); assert.equal(birth.linkedCount, 1)
  assert.equal(birth.birthSubstitute, false); assert.equal(birth.cue5, true)
  const visible = observation.samples.filter(s => s.visible)
  assert.ok(new Set(visible.map(s => s.frame)).size >= 2, 'Observe actual artwork phase advancement')
  assert.ok(observation.crops.length >= 2 && observation.crops.length <= 8)
  assert.ok(observation.samples.some(s => s.object === 0x650 && !s.visible), 'Observe visual termination before removal')
  assert.ok(observation.logical.some(s => s.present && (s.x !== birth.x || s.z !== birth.z)), 'Observe natural linked movement')
  assert.ok(observation.logical.some(s => s.present && observation.logical.some(previous => previous.turn === s.turn - 1 &&
    (s.x !== birth.x || s.z !== birth.z) && s.x === previous.targetX && s.z === previous.targetZ)),
  'Moving flash follows the replacement position from the preceding logical visit')
  for (const sample of visible) {
    assert.equal(sample.id, birth.id); assert.equal(sample.targetId, birth.targetId)
    assert.equal(sample.draw, 45); assert.equal(sample.object, 1240)
    assert.equal(sample.frame, 1240 + (sample.f1 >>> 2))
    assert.equal(sample.sequence, 'startConversion'); assert.equal(sample.flags, 0x104)
    assert.equal(sample.palette, 0); assert.equal(sample.opacity, 1); assert.equal(sample.submitted, true)
    assert.match(sample.texture, /\/original\/effects\.png(?:\?|$)/)
    const frame = atlas.animations.startConversion[sample.frame - 1240]
    assert.ok(frame && frame.source === sample.frame)
    assert.deepEqual(sample.size, [100, 100, 1]); assert.deepEqual(sample.center, [0.5, 0])
    assert.deepEqual(sample.uv, [100 / atlas.width, 100 / atlas.height,
      frame.index % 8 * 256 / atlas.width, 1 - (Math.floor(frame.index / 8) * 256 + 100) / atlas.height])
  }
  for (const crop of observation.crops) {
    assert.ok(!crop.error && crop.colors > 1, 'Actual copied canvas must not be blank')
    assert.ok(visible.some(s => s.cropFile === crop.filename && s.frame === crop.frame &&
      s.turn === crop.turn && s.stamp === crop.stamp), 'Crop must retain its synchronous rendered sample')
  }
}

export async function closeConversionContext(context, report, started, now = () => performance.now()) {
  await context.close()
  report.elapsedMs = now() - started
  assert.ok(!report.timedOut && report.elapsedMs <= conversionLimitMs,
    'Conversion episode exceeded its deadline during final cleanup')
}

export default async function spellConversion({ browser, url, output }) {
  const started = performance.now(), context = await browser.newContext({
    viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 }), page = await context.newPage(),
    report = { status: 'running', capMs: conversionLimitMs, observationCapMs: conversionObservationMs,
      errors: [], limits: ['Public direct Mission 3 access, not earned campaign unlock.',
        'Native introduction skip and public Space establish a measured paused baseline before the first natural conversion. No turn-zero or width-dependent pause claim; no World pause assignment.',
        'One fixed diagnostic camera focus; no stock/entity injection, forced ticks or replaced render paths.',
        'Same-frame canvas crops are real browser pixels, not original-game framebuffer equivalence.',
        'Native depth/blend composition and wall-clock ratio remain existing adapters; no hardware performance claim.',
        'Display callbacks may skip artwork frames. Exhaustive eight-frame proof remains the independent source/CPU oracle.'] }
  const save = () => writeFileSync(resolve(output, 'spell-conversion.json'), JSON.stringify(report, null, 2) + '\n')
  let failure
  const retain = async () => {
    if (report.observation || page.isClosed()) return
    report.observation = await page.evaluate(() => window.__pndConversionObservation?.retain() ?? null)
    if (!report.observation) return
    for (const crop of report.observation.crops) {
      if (!crop.png) continue
      assert.match(crop.filename, /^spell-conversion-frame-[0-7]\.png$/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' })
      crop.sha256 = createHash('sha256').update(bytes).digest('hex'); delete crop.png
    }
    save()
  }
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(() => {}) }, conversionLimitMs)
  page.setDefaultTimeout(12000)
  page.on('pageerror', error => report.errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  try {
    report.phase = 'navigation'
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    report.phase = 'mission-selector'
    await showAllMissions(page)
    report.phase = 'mission-start'
    await page.getByRole('button', { name: 'Mission 3', exact: true }).click()
    report.phase = 'bind-game'
    await bindGame(page)
    await waitForConversionIntroduction(page, report)
    report.phase = 'public-paused-baseline'
    await pauseConversionBaseline(page, report)
    report.phase = 'arm-observer'
    await page.evaluate(installConversionObserver, { observationMs: conversionObservationMs, armed: true,
      baselineTurn: report.pausedBaseline.turn })
    report.phase = 'camera-setup'
    // Synchronous camera-only focus after public flyby/input completion. The
    // armed observer remains on the same paused baseline throughout camera setup.
    report.setup = await page.evaluate(`(${setupConversionCamera.toString()})(${checkpointCodec.toString()})`)
    assert.equal(report.setup.level, 3); assert.equal(report.setup.casts, 0)
    assert.equal(report.setup.stock, 1); assert.equal(report.setup.paused, true)
    assert.equal(report.setup.turn, report.pausedBaseline.turn, 'Setup cannot advance the paused baseline')
    assert.equal(report.setup.speed, 1)
    await resumeArmedConversion(page, report)
    report.phase = 'observe-conversion'
    await page.waitForFunction(() => window.__pndConversionObservation.result.done, null,
      { timeout: conversionObservationMs + 1000, polling: 50 })
    report.phase = 'retain-observation'
    await retain()
    report.phase = 'validate-observation'
    const atlas = JSON.parse(readFileSync(resolve(root, 'app/original-effects.json'), 'utf8'))
    validateConversionObservation(report.observation, atlas)
    assert.deepEqual(report.errors, [])
  } catch (error) {
    failure = error; report.status = 'failed'; report.error = String(error)
    report.errorStack = error.stack
    try { report.failureState = await page.evaluate(readConversionStartup) }
    catch (diagnosticError) { report.diagnosticError = String(diagnosticError) }
    try { await retain() } catch (retentionError) { report.retentionError = String(retentionError) }
  }
  finally {
    try { await closeConversionContext(context, report, started) }
    catch (error) { failure ??= error; report.error ??= String(error) }
    finally {
      clearTimeout(timer)
      report.elapsedMs = performance.now() - started
      report.status = failure ? 'failed' : 'passed'
      save()
    }
  }
  if (failure) throw failure
  return report
}
