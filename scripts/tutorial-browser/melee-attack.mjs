import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'
import { minimapInput } from '../../qa/erosion-ordinary/minimap-input.mjs'
import { minimapPick } from '../../app/minimap.ts'
import { spriteDirection } from '../../app/projection.ts'
import { validateMeleeAttackFrames } from './melee-attack-evidence.mjs'

export const meleeAttackLimitMs = 75000
const root = resolve(import.meta.dirname, '../..')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

// Read the eligibility published by updateUnitsFrame, not a private hit query.
export function readMeleeRouteState() {
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  if (!scene || !world) return { sceneAvailable: false }
  const person = id => {
    const unit = world.units.find(unit => unit.id === id), group = scene.unitMeshes.get(id)
    return unit ? { id, kind: unit.kind, team: unit.team, hp: unit.hp, x: unit.x, z: unit.z,
      inside: unit.inside, visible: group?.visible ?? false, pickable: group?.userData.pickable === true,
      frame: group?.userData.frame ?? null, target: unit.target,
      fight: unit.fight && { group: unit.fight.group, action: unit.fight.action, opponent: unit.fight.opponent } } : null
  }
  return { sceneAvailable: true, sceneStoreMatch: scene.world === world, turn: world.turn,
    selected: [...world.selected], paused: world.paused, speed: world.speed, drawMode: world.drawMode,
    inputMask: world.inputMask, actor: person(54), target: person(20), hiddenPriorTarget: person(13),
    camera: { position: { ...scene.cameraPosition }, target: { ...scene.cameraMotion.target },
      active: scene.cameraMotion.active, preset: scene.viewPreset, overview: scene.overviewActive,
      transitioning: !!scene.viewTransition, resultActive: scene.resultCamera.active },
    rendererStamp: scene.renderer.info.render.frame, canvasConnected: scene.renderer.domElement.isConnected }
}

export function assertMeleeRouteReady(state) {
  assert.equal(state.sceneAvailable, true); assert.equal(state.sceneStoreMatch, true)
  assert.deepEqual(state.selected, [54]); assert.equal(state.paused, true); assert.equal(state.speed, 1)
  assert.equal(state.target?.id, 20); assert.equal(state.target?.kind, 'shaman')
  assert.equal(state.target?.team, 'green'); assert.ok(state.target.hp > 0)
  assert.equal(state.target.inside, null, 'Public melee target must be outside a building')
  assert.equal(state.target.visible, true, 'Public melee target must be visible')
  assert.equal(state.target.pickable, true, 'Public melee target must be eligible for ordinary picking')
  assert.equal(state.camera.preset, 2, 'One public zoom-out must reach ordinary bird’s-eye')
  assert.equal(state.camera.overview, false); assert.equal(state.drawMode, 0)
  assert.equal(state.camera.transitioning, false); assert.equal(state.camera.active, 0)
  assert.equal(state.camera.resultActive, 0); assert.equal(state.inputMask, 0)
}

// Expected artwork comes from retained tables, never from the observed pose.
export function meleeAttackMapping() {
  const rules = JSON.parse(readFileSync(resolve(root, 'app/original-rules.json')))
  const units = JSON.parse(readFileSync(resolve(root, 'app/original-units.json')))
  return Object.fromEntries(Object.entries({ attack: 10, strike: 8, special: 16 }).map(([action, row]) => {
    const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + 7]]
    return [`shaman:${action}`, { object, draw, step: rules.animationDescriptors[draw].step,
      directions: units.shamanSources[object] }]
  }))
}

// A separate RAF reads after the Scene's already-scheduled ordinary render.
// It does not mutate World, advance time, render, replace a game method or issue
// a hit-selection query. Reading crop bounds may touch renderer/picker metadata.
export function installMeleeFrameObserver() {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement
  const result = { samples: [], crops: [], error: null, done: false, firstAttackTurn: null }
  let raf, stopped = false
  const cropKeys = new Set()
  const stop = () => { stopped = true; cancelAnimationFrame(raf); return result }
  window.__pndMeleeObservation = { result, stop }
  const visit = () => {
    if (stopped) return
    try {
      if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world)
        throw Error('Melee observation lost its original Scene/world')
      if (!canvas.isConnected || document.visibilityState !== 'visible')
        throw Error('Melee canvas disconnected or document hidden')
      const unit = world.units.find(unit => unit.id === 54), fight = unit?.fight
      if (!unit || unit.kind !== 'shaman' || unit.team !== 'blue' || unit.hp <= 0)
        throw Error('Authored Shaman54 disappeared or died')
      if (fight && ['attack', 'strike', 'special'].includes(fight.action)) {
        result.firstAttackTurn ??= world.turn
        const person = fight.motion, group = scene.unitMeshes.get(54)
        if (!person || !group) throw Error('Attack lacks physical person or rendered group')
        const layers = (group.userData.layers ?? []).filter(layer => layer.visible)
        const submittedLayers = layers.filter(layer => scene.view.painter.source(layer)).length
        const sample = { timestampMs: performance.now(), turn: world.turn,
          animationFrame: scene.gameClock.animationFrame, stamp: scene.renderer.info.render.frame,
          id: 54, kind: unit.kind, action: fight.action, started: fight.started,
          opponent: fight.opponent, participants: [...(world.fights?.find(group => group.id === fight.group)?.members ?? [])],
          object: person.object, draw: person.draw, f1: person.f1, f2: person.f2,
          logicalStamp: person.stamp, nativeAttackAnimation: fight.nativeAttackAnimation === true,
          frame: group.userData.frame, flip: group.userData.frameFlip,
          heading: unit.heading, cameraBearing: scene.cameraBearing,
          visible: group.visible, submittedLayers, canvasConnected: canvas.isConnected,
          sceneStoreMatch: scene.world === world, paused: world.paused,
          pieces: layers.map(layer => layer.userData.piece) }
        const key = `${fight.started}:${sample.frame}`
        if (group.visible && submittedLayers > 0 && !cropKeys.has(key) && result.crops.length < 4) {
          const rect = canvas.getBoundingClientRect(), bounds = scene.picking.personBounds(54, rect)
          if (bounds && bounds.width > 1 && bounds.height > 1) {
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
            const x = Math.max(0, Math.floor((bounds.x - 12) * scaleX))
            const y = Math.max(0, Math.floor((bounds.y - 12) * scaleY))
            const width = Math.min(256, canvas.width - x, Math.ceil((bounds.width + 24) * scaleX))
            const height = Math.min(256, canvas.height - y, Math.ceil((bounds.height + 24) * scaleY))
            if (width > 1 && height > 1) {
              // Copy the current canvas synchronously in the same observer callback.
              // This is readback, not a second Scene render or a hidden-body redraw.
              const copy = document.createElement('canvas'); copy.width = width; copy.height = height
              const context = copy.getContext('2d')
              context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
              const pixels = context.getImageData(0, 0, width, height).data
              const colors = new Set()
              for (let at = 0; at < pixels.length; at += 4)
                if (pixels[at + 3]) colors.add((pixels[at] << 16) | (pixels[at + 1] << 8) | pixels[at + 2])
              sample.cropFile = `melee-attack-frame-${result.crops.length}.png`
              result.crops.push({ filename: sample.cropFile, turn: world.turn, stamp: sample.stamp,
                frame: sample.frame, object: sample.object, f2: sample.f2, clip: { x, y, width, height },
                opaqueColors: colors.size, png: copy.toDataURL('image/png') })
              cropKeys.add(key)
            }
          }
        }
        result.samples.push(sample)
        if (result.samples.length > 1200) throw Error('Melee observation exceeded bounded sample storage')
      }
      // One preregistered window, not retries until an attractive frame passes.
      if (result.firstAttackTurn !== null && world.turn >= result.firstAttackTurn + 10) {
        result.done = true; stop(); return
      }
    } catch (error) { result.error = String(error); result.done = true; stop(); return }
    raf = requestAnimationFrame(visit)
  }
  raf = requestAnimationFrame(visit)
}

export default async function meleeAttack({ browser, url, output, expectedRevision }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const report = { schema: 'populous-new-dawn/ordinary-melee-artwork', schemaVersion: 1,
    status: 'running', expectedRevision, capMs: meleeAttackLimitMs, actions: [], errors: [],
    method: 'Public authored M2 startup, Shaman54 selection, one public bird’s-eye zoom-out, supplied minimap camera input and real eligible Green Shaman20 attack click; normal defenders may intercept; normal RAF and same-frame canvas observation.',
    limits: ['Direct mission access, not earned campaign unlock.', 'No original-game FPS calibration, hardware smoothness or Firewarrior browser claim.',
      'Marker is recorded, not represented as direct observation of a private getter return. Native object and actual directional frame are independently compared.',
      'Canvas readback perturbs rendering; crops require visual review and do not establish pixel-perfect composition or performance.',
      'Crop bounds read renderer/picker metadata; observation does not mutate World or issue a hit-selection query.',
      '30/60/120/144Hz and irregular schedule evidence remains the separate CPU regression.'],
    source: Object.fromEntries(['app/original-rules.json', 'app/original-units.json', 'app/projection.ts',
      'app/unit-animation-source.ts', 'app/scene-entities.ts', 'scripts/tutorial-browser/melee-attack.mjs',
      'scripts/tutorial-browser/melee-attack-evidence.mjs', 'qa/erosion-ordinary/minimap-input.mjs']
      .map(path => [path, sha256(readFileSync(resolve(root, path)))])) }
  const save = () => writeFileSync(resolve(output, 'melee-attack.json'), JSON.stringify(report, null, 2) + '\n')
  const action = async (name, perform) => {
    report.actions.push({ name, startedAt: new Date().toISOString() }); save()
    await perform()
    report.actions.at(-1).finishedAt = new Date().toISOString(); save()
  }
  const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())
  const runtimeError = error => { if (report.errors.length < 20) report.errors.push(String(error).slice(0, 2000)) }
  page.on('pageerror', runtimeError)
  page.on('console', message => { if (message.type() === 'error') runtimeError(message.text()) })
  page.on('crash', () => runtimeError('Page crashed'))
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(() => {}) }, meleeAttackLimitMs)
  let failure
  const retainObservation = async () => {
    if (report.observation || page.isClosed()) return
    const observation = await page.evaluate(() => window.__pndMeleeObservation?.stop() ?? null)
    if (!observation) return
    report.observation = observation
    for (const sample of observation.samples)
      sample.direction = spriteDirection(Math.round(sample.cameraBearing * 1024 / Math.PI), Math.round((Math.PI - sample.heading) * 1024 / Math.PI))
    for (const crop of observation.crops) {
      assert.match(crop.filename, /^melee-attack-frame-[0-3]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const sample = observation.samples.find(sample => sample.cropFile === crop.filename)
      assert.ok(sample, 'Every canvas crop must belong to an actual sampled native frame')
      for (const field of ['turn', 'stamp', 'frame', 'object', 'f2'])
        assert.equal(crop[field], sample[field], `Canvas crop ${field} must match its synchronous observation`)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' })
      crop.sha256 = sha256(bytes); delete crop.png
    }
    save()
  }
  save()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await action('New Game / No / Browser controls / All missions', () => showAllMissions(page))
    await button('Mission 2')
    await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue(); await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip') await action('Skip introduction', () => page.getByRole('button', { name: /^Skip introduction/ }).click())
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld()
      return !w.inputMask && !w.paused && w.turn > w.lastOrderTurn
    })
    await button('Pause game')
    await button('Select and focus shaman')
    const settle = () => page.waitForFunction(() => {
      const scene = window.testSceneRef.current
      return !scene.cameraMotion.active && !scene.resultCamera.active && !scene.viewTransition
    })
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out to ordinary bird’s-eye', () => page.keyboard.press('-'))
    await settle()
    report.eligibility = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.eligibility)
    const setup = await page.evaluate(() => {
      const scene = window.testSceneRef.current, w = scene.world, target = w.units.find(unit => unit.id === 20)
      if (!target || target.kind !== 'shaman' || target.team !== 'green' || target.hp <= 0) throw Error('Authored Green Shaman20 unavailable')
      const rect = scene.mini.getBoundingClientRect()
      return { turn: w.turn, selected: [...w.selected], paused: w.paused, speed: w.speed,
        environment: { viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
          canvas: { width: scene.renderer.domElement.width, height: scene.renderer.domElement.height },
          renderer: scene.renderer.getContext().getParameter(scene.renderer.getContext().RENDERER),
          vendor: scene.renderer.getContext().getParameter(scene.renderer.getContext().VENDOR),
          version: scene.renderer.getContext().getParameter(scene.renderer.getContext().VERSION) },
        target: { id: target.id, kind: target.kind, team: target.team, x: target.x, z: target.z, hp: target.hp },
        minimap: { width: scene.mini.width, height: scene.mini.height,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
          heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
          target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) } } }
    })
    report.setup = setup
    assert.deepEqual(setup.selected, [54]); assert.equal(setup.paused, true); assert.equal(setup.speed, 1)
    assert.deepEqual(setup.environment.viewport, { width: 1440, height: 1000 })
    assert.equal(setup.environment.dpr, 1)
    const camera = minimapInput(setup.minimap, minimapPick, () => true)
    assert.ok(camera, 'Authored target must be reachable through public minimap camera input')
    assert.equal(await page.evaluate(point => document.elementFromPoint(point.x, point.y) === window.testSceneRef.current.mini, camera), true)
    report.cameraInput = camera
    await action('Minimap camera toward authored Green Shaman20', () => page.mouse.click(camera.x, camera.y))
    await settle()
    report.afterFocus = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.afterFocus)
    const targetBounds = report.targetBounds = await page.evaluate(() => {
      const s = window.testSceneRef.current, canvas = s.renderer.domElement, rect = canvas.getBoundingClientRect()
      const g = s.unitMeshes.get(20), bounds = s.picking.personBounds(20, rect)
      if (!g?.visible || !bounds) return null
      return { x: rect.left + bounds.x, y: rect.top + bounds.y, width: bounds.width, height: bounds.height }
    })
    save()
    assert.ok(targetBounds, 'Eligible Green Shaman20 must have rendered canvas bounds')
    report.targetHoverAttempts = []
    let targetPoint
    // Fixed body-interior candidates. Actual pointer events, not a test picker
    // call, must identify Green Shaman20 before the one real attack click.
    for (const [fx, fy] of [[.5, .5], [.5, .65], [.35, .5], [.65, .5], [.5, .35]]) {
      const point = { x: Math.floor(targetBounds.x + targetBounds.width * fx), y: Math.floor(targetBounds.y + targetBounds.height * fy) }
      const before = await page.evaluate(() => window.testSceneRef.current.renderer.info.render.frame)
      await page.mouse.move(point.x, point.y)
      await page.waitForFunction(({ point, before }) => {
        const s = window.testSceneRef.current
        return s.renderer.info.render.frame > before && s.pointerScreen?.clientX === point.x && s.pointerScreen?.clientY === point.y
      }, { point, before })
      const observed = await page.evaluate(point => {
        const s = window.testSceneRef.current
        return { id: s.hoveredObject, canvasOwnsPoint: document.elementFromPoint(point.x, point.y) === s.renderer.domElement }
      }, point)
      report.targetHoverAttempts.push({ point, ...observed }); save()
      if (observed.id === 20 && observed.canvasOwnsPoint) { targetPoint = point; break }
    }
    assert.ok(targetPoint, 'Public pointer route must identify eligible Green Shaman20')
    report.targetInput = targetPoint
    report.beforeAttack = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.beforeAttack)
    await action('Real canvas attack click on Green Shaman20', () => page.mouse.click(targetPoint.x, targetPoint.y))
    report.order = await page.evaluate(() => {
      const w = window.testStore.getWorld(), u = w.units.find(unit => unit.id === 54)
      return { turn: w.turn, selected: [...w.selected], target: u.target, path: structuredClone(u.path),
        nativeCommands: u.native && { commands: [...u.native.commands], commandCursor: u.native.commandCursor,
          commandStatus: u.native.commandStatus, workTarget: u.native.workTarget }, paused: w.paused }
    })
    assert.deepEqual(report.order.selected, [54]); assert.equal(report.order.target, 20)
    assert.equal(report.order.paused, true); assert.equal(report.order.turn, setup.turn)
    await page.evaluate(installMeleeFrameObserver)
    await button('Resume game')
    await page.waitForFunction(() => window.__pndMeleeObservation.result.done, null, { timeout: meleeAttackLimitMs })
    await retainObservation()
    for (const crop of report.observation.crops)
      assert.ok(crop.opaqueColors > 1, 'Same-frame canvas crop must not be blank')
    assert.equal(report.observation.error, null)
    assert.equal(report.observation.done, true)
    report.mapping = meleeAttackMapping()
    report.acceptance = validateMeleeAttackFrames(report.observation.samples, report.mapping)
    await button('Pause game')
    await page.screenshot({ path: resolve(output, 'melee-attack-context.png') })
  } catch (error) {
    failure = error; report.failure = { message: String(error), stack: error.stack }; save()
    if (!page.isClosed()) {
      try { report.failureState = await page.evaluate(readMeleeRouteState); save() }
      catch (diagnostic) { report.failureStateError = String(diagnostic) }
      try {
        const filename = 'melee-attack-failure.png'
        await page.screenshot({ path: resolve(output, filename), timeout: 2000 })
        report.failureScreenshot = { filename, sha256: sha256(readFileSync(resolve(output, filename))) }
      } catch (diagnostic) { report.failureScreenshotError = String(diagnostic) }
    }
  }
  finally {
    clearTimeout(timer)
    try { await retainObservation() }
    catch (error) { report.errors.push(`Observer cleanup: ${error}`) }
    try { await context.close(); report.contextClosed = true }
    catch (error) { report.errors.push(`Context cleanup: ${error}`) }
    report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'; save()
  }
  assert.equal(report.status, 'passed', 'Ordinary melee browser case failed; see melee-attack.json')
  return report
}
