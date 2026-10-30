import { clearPortraitSelection } from '../browser-portrait-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'
import { minimapInput } from '../../qa/erosion-ordinary/minimap-input.mjs'
import { minimapPick } from '../../app/minimap.ts'
import { spriteDirection } from '../../app/projection.ts'
import { meleeRunningProtocol, validateMeleeRunningObservation } from './melee-attack-running-evidence.mjs'
import { recoilRunningProtocol, validateRecoilObservation } from './melee-recoil-evidence.mjs'
import { installRecoilCameraFollow } from './melee-recoil-camera.mjs'

export const meleeAttackLimitMs = 75000
// A fixed functional artwork workload, separate from performance frame recording.
// Keep normal game time and the source-bounded entry; reduce only raster area.
const meleeArtworkViewport = { width: 960, height: 720 }
const root = resolve(import.meta.dirname, '../..')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function meleeCameraInput(minimap, recoil = false) {
  assert.equal(typeof recoil, 'boolean')
  const { width, height, rect, center, heading } = minimap
  assert.ok(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0)
  assert.ok([rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0)
  const nearest = minimapInput(minimap, minimapPick, () => true)
  assert.ok(nearest, 'Authored target must be reachable through public minimap camera input')
  // One fixed setup offset frames the target above the paused badge and the
  // retained approach corridor inside the view. Recoil's opposite heading uses
  // the nearest target center (zero offset), avoiding that corridor's top-edge
  // clipping after the declared half-turn. This is not live camera pursuit.
  const offsetBacking = { x: 0, y: recoil ? 0 : 12 }, backing = {
    x: (nearest.x - rect.x) / rect.width * width + offsetBacking.x,
    y: (nearest.y - rect.y) / rect.height * height + offsetBacking.y,
  }
  assert.ok(backing.x >= 2 && backing.x < width - 2 && backing.y >= 2 && backing.y < height - 2,
    'Declared melee camera offset must remain inside the minimap')
  return { nearest, offsetBacking, backing,
    x: rect.x + backing.x / width * rect.width, y: rect.y + backing.y / height * rect.height,
    native: minimapPick(width, height, center, heading, backing) }
}

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

export function assertMeleeRouteReady(state, paused = true) {
  assert.equal(state.sceneAvailable, true); assert.equal(state.sceneStoreMatch, true)
  assert.deepEqual(state.selected, [54]); assert.equal(state.paused, paused); assert.equal(state.speed, 1)
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

// Declared recoil-only view from the opposite side of the foreground hut.
// Two ordinary 512px right drags equal 1024 native angle units (half a turn).
export async function rotateRecoilCamera(page) {
  for (let drag = 0; drag < 2; drag++) {
    await page.mouse.move(200, 200)
    await page.mouse.down({ button: 'right' })
    try { await page.mouse.move(712, 200) }
    finally { await page.mouse.up({ button: 'right' }) }
  }
}

export async function shiftClickMeleeTarget(page, point) {
  try {
    await page.keyboard.down('Shift')
    await page.mouse.click(point.x, point.y)
  } finally {
    await page.keyboard.up('Shift')
  }
}

// DOM ownership is not a game hit query. A paused HUD button can cover an
// otherwise eligible body, so do not wait for a canvas event at a blocked point.
export function readMeleePointerState(point) {
  const scene = window.testSceneRef.current, owner = document.elementFromPoint(point.x, point.y)
  const rect = owner?.getBoundingClientRect()
  return { id: scene.hoveredObject, canvasOwnsPoint: owner === scene.renderer.domElement,
    pointerScreen: scene.pointerScreen && { ...scene.pointerScreen },
    stamp: scene.renderer.info.render.frame,
    owner: owner && { tag: owner.tagName, className: owner.className,
      label: owner.getAttribute('aria-label'),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } } }
}

export async function meleeTargetPoint(page, bounds, attempts, save) {
  // Preserve this fixed body-interior set and order. Only real pointer events
  // and the ordinary rendered hover winner may establish the attack target.
  for (const [fx, fy] of [[.5, .5], [.5, .65], [.35, .5], [.65, .5], [.5, .35]]) {
    const point = { x: Math.floor(bounds.x + bounds.width * fx), y: Math.floor(bounds.y + bounds.height * fy) }
    const before = await page.evaluate(readMeleePointerState, point)
    const attempt = { point, before, status: before.canvasOwnsPoint ? 'moving' : 'blocked' }
    attempts.push(attempt); save()
    if (!before.canvasOwnsPoint) continue
    await page.mouse.move(point.x, point.y)
    await page.waitForFunction(({ point, before }) => {
      const s = window.testSceneRef.current
      return s.renderer.info.render.frame > before && s.pointerScreen?.clientX === point.x && s.pointerScreen?.clientY === point.y
    }, { point, before: before.stamp })
    attempt.after = await page.evaluate(readMeleePointerState, point)
    attempt.status = 'observed'; save()
    if (attempt.after.id === 20 && attempt.after.canvasOwnsPoint) return point
  }
  assert.fail('Public pointer route must identify eligible Green Shaman20')
}

// Expected artwork comes from retained tables, never from the observed pose.
export function meleeAttackMapping(recoil = false) {
  const rules = JSON.parse(readFileSync(resolve(root, 'app/original-rules.json')))
  const units = JSON.parse(readFileSync(resolve(root, 'app/original-units.json')))
  return Object.fromEntries(Object.entries(recoil ? { recoil: 9 } : { attack: 10, strike: 8, special: 16 }).map(([action, row]) => {
    const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + 7]]
    return [`shaman:${action}`, { object, draw, step: rules.animationDescriptors[draw].step,
      frameCount: units.frameCounts[object],
      duration: recoil ? 7 : (rules.animationDescriptors[draw].step + 1) * units.frameCounts[object],
      ...(recoil ? { knockbackDuration: 4 } : {}),
      directions: units.shamanSources[object] }]
  }))
}

// A separate RAF reads after the Scene's already-scheduled ordinary render.
// It does not mutate World, advance time, render, replace a game method or issue
// a hit-selection query. Reading crop bounds may touch renderer/picker metadata.
export function installMeleeFrameObserver(input) {
  const recoil = input?.mode === 'recoil', originalMapping = recoil ? input.mapping : input
  const admitted = action => recoil ? action === 'recoil' : ['attack', 'strike', 'special'].includes(action)
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement, visitLimit = 75 * 240
  // These independent original tables arrive from Node, not the observed pose,
  // countdown or a game getter. Keep a private copy for the entire episode.
  const mapping = structuredClone(originalMapping)
  const result = { protocol: recoil ? 'running-native-recoil-entry-v1' : 'running-original-entry-v2', samples: [], crops: [], visits: [], visitLimit,
    error: null, done: false, firstAttackTurn: null, entry: null, endpoint: null, terminal: null, retention: null }
  let raf, stopped = false, firstPerson = null, firstEntry = null
  const cropKeys = new Set(), copies = []
  const stop = (reason = 'stopped') => {
    if (!stopped) {
      result.terminal = { turn: world.turn, stamp: scene.renderer.info.render.frame, reason }
      stopped = true; cancelAnimationFrame(raf)
    }
    return result
  }
  // Encoding never runs inside the observer RAF, including its terminal visit.
  // Only these private, once-drawn copies survive until explicit retention.
  const retain = () => {
    stop()
    if (result.retention) return result
    const timestampMs = performance.now()
    result.retention = { timestampMs, durationMs: 0, copyCount: copies.length, done: false }
    for (const { copy, context, crop } of copies) {
      try {
        let started = performance.now()
        try {
          const pixels = context.getImageData(0, 0, copy.width, copy.height).data
          const colors = new Set()
          for (let at = 0; at < pixels.length; at += 4)
            if (pixels[at + 3]) colors.add((pixels[at] << 16) | (pixels[at + 1] << 8) | pixels[at + 2])
          crop.opaqueColors = colors.size
        } finally { crop.readbackScanMs = performance.now() - started }
        started = performance.now()
        try { crop.png = copy.toDataURL('image/png') }
        finally { crop.encodingMs = performance.now() - started }
      } catch (error) {
        crop.error = String(error)
        result.error ??= `Melee crop retention failed: ${error}`
      } finally {
        // Release backing stores even when readback/encoding failed. A second
        // retention cannot retry a failed crop or replace it with later pixels.
        copy.width = 0; copy.height = 0
      }
    }
    copies.length = 0
    result.retention.durationMs = performance.now() - timestampMs
    result.retention.done = true
    return result
  }
  window.__pndMeleeObservation = { result, stop, retain }
  const visit = rafTimestampMs => {
    if (stopped) return
    const timestampMs = performance.now()
    const diagnostic = { timestampMs, rafTimestampMs, turn: world.turn, stamp: scene.renderer.info.render.frame,
      animationFrame: scene.gameClock.animationFrame, paused: world.paused, stage: 'guards',
      actorInspected: false, alive: null, hp: null, action: null, started: null, f2: null, frame: null,
      observerMs: 0, cropCopyMs: 0 }
    result.visits.push(diagnostic)
    try {
      // 75 seconds at 240 callbacks/second bounds diagnostics separately from
      // the unchanged 1,200 attack samples and case cap. Never drop visits silently.
      if (result.visits.length >= visitLimit) throw Error('Melee observation exceeded bounded visit storage')
      if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world)
        throw Error('Melee observation lost its original Scene/world')
      if (!canvas.isConnected || document.visibilityState !== 'visible')
        throw Error('Melee canvas disconnected or document hidden')
      if (result.firstAttackTurn !== null && world.paused) throw Error('Running melee observation unexpectedly paused')
      const unit = world.units.find(unit => unit.id === 54), fight = unit?.fight
      Object.assign(diagnostic, { stage: 'observed', actorInspected: true,
        alive: !!unit && unit.hp > 0, hp: unit?.hp ?? null,
        action: fight?.action ?? null, started: fight?.started ?? null,
        f2: fight?.motion?.f2 ?? null, frame: scene.unitMeshes.get(54)?.userData.frame ?? null })
      if (!unit || unit.kind !== 'shaman' || unit.team !== 'blue' || unit.hp <= 0)
        throw Error('Authored Shaman54 disappeared or died')
      // A recoil action can be assigned after this actor's controller visit.
      // Wait only for its first processed entry, never skip a processed episode.
      const pendingRecoil = recoil && fight?.action === 'recoil' && fight.remaining === undefined
      if (!firstEntry && fight && admitted(fight.action) && !pendingRecoil) {
        const original = mapping?.[`${unit.kind}:${fight.action}`]
        if (!original || original.step !== 0 || !Number.isSafeInteger(original.frameCount) ||
          original.frameCount < 2 || original.duration !== (recoil ? 7 : (original.step + 1) * original.frameCount) ||
          !Number.isSafeInteger(fight.started) || fight.started > world.turn)
          throw Error('First melee entry lacks an independent original duration')
        if (recoil && (world.turn !== fight.started || original.knockbackDuration !== 4))
          throw Error('First observed recoil must be its exact entry with original durations; no later replacement')
        const duration = recoil && fight.knockback === true ? original.knockbackDuration : original.duration
        result.firstAttackTurn = world.turn
        firstPerson = fight.motion
        firstEntry = Object.freeze({ id: unit.id, kind: unit.kind, action: fight.action, started: fight.started,
          fightGroup: fight.group, opponent: fight.opponent, duration,
          ...(recoil ? { knockback: fight.knockback === true } : {}),
          endExclusive: fight.started + duration - 1 })
        result.entry = firstEntry
      }
      if (firstEntry) {
        const entry = firstEntry
        if (!fight || !firstPerson || fight.motion !== firstPerson || fight.started !== entry.started ||
          fight.group !== entry.fightGroup || fight.opponent !== entry.opponent)
          throw Error('Melee observation lost its first attack entry')
        if (world.turn > entry.endExclusive) throw Error('Melee observation missed its exact native expiry turn')
        if (world.turn === entry.endExclusive) {
          // Entry initializes remaining=D-1; expiry decrements it to zero,
          // changes to approach and continues without selecting another attack.
          // Actor life and all uninterrupted-running guards still apply here.
          if (fight.action !== (recoil && entry.knockback ? 'push' : 'approach') || fight.remaining !== undefined)
            throw Error('First melee entry did not reach its native expiry transition')
          const person = fight.motion
          result.endpoint = { turn: world.turn, stamp: scene.renderer.info.render.frame,
            animationFrame: scene.gameClock.animationFrame, id: unit.id, kind: unit.kind, team: unit.team,
            hp: unit.hp, alive: true, action: fight.action, started: fight.started,
            fightGroup: fight.group, opponent: fight.opponent, remaining: fight.remaining ?? null,
            animation: fight.animation, nativeAttackAnimation: fight.nativeAttackAnimation === true,
            ...(recoil ? { nativeRecoilAnimation: fight.nativeRecoilAnimation === true, knockback: fight.knockback === true } : {}),
            personId: person.id, personState: person.state, personModel: person.model, personClass: person.class,
            personIdentityMatch: person === firstPerson, workFlags: person.workFlags,
            object: person.object, draw: person.draw, f1: person.f1, f2: person.f2, logicalStamp: person.stamp,
            flight: !!unit.flight, personFlags2: person.flags2, personFlags4: person.flags4,
            paused: world.paused, canvasConnected: canvas.isConnected, sceneStoreMatch: scene.world === world,
            documentVisible: document.visibilityState === 'visible' }
          diagnostic.stage = 'entry-complete'
          result.done = true; stop('entry-complete'); return
        }
        if (fight.action !== entry.action) throw Error('Melee observation changed its first attack before expiry')
      }
      if (fight && admitted(fight.action) && !pendingRecoil) {
        diagnostic.stage = recoil ? 'recoil' : 'attack'
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
          ...(recoil ? { nativeRecoilAnimation: fight.nativeRecoilAnimation === true, knockback: fight.knockback === true } : {}),
          frame: group.userData.frame, flip: group.userData.frameFlip,
          heading: unit.heading, cameraBearing: scene.cameraBearing,
          visible: group.visible, submittedLayers, canvasConnected: canvas.isConnected,
          sceneStoreMatch: scene.world === world, paused: world.paused,
          pieces: layers.map(layer => layer.userData.piece) }
        Object.assign(sample, { fightGroup: fight.group, remaining: fight.remaining ?? null,
          animation: fight.animation, personId: person.id, personState: person.state,
          personSpeed: person.speed, motionIsNative: person === unit.native, flight: !!unit.flight,
          personClass: person.class, personModel: person.model, workFlags: person.workFlags,
          personFlags2: person.flags2, personFlags4: person.flags4, personIdentityMatch: person === firstPerson,
          // This records the reviewed pure source-branch contract, not a
          // direct call/observation of the private visual getter's return.
          fightMotionSourceAdmitted: !unit.flight && (
            (recoil ? fight.nativeRecoilAnimation === true && fight.action === 'recoil' :
              fight.nativeAttackAnimation === true && ['attack', 'strike', 'special', 'approach'].includes(fight.action)) ||
            ['walk', 'idle'].includes(fight.animation) || person === unit.native && person.state !== 10),
          renderedDraw: group.userData.draw,
        })
        const cameraHeading = Math.round(sample.cameraBearing * 1024 / Math.PI)
        const objectHeading = Math.round((Math.PI - sample.heading) * 1024 / Math.PI)
        sample.direction = ((((cameraHeading << 16) >> 16) - ((objectHeading << 16) >> 16) - 0x380) & 0x700) >> 8
        sample.phase = 'running'
        // Reserve the first four distinct native poses BEFORE visibility or crop
        // eligibility. A failed slot is evidence failure, never a later replacement.
        const key = JSON.stringify([sample.id, sample.action, sample.started, sample.fightGroup,
          sample.opponent, sample.object, sample.draw, sample.f1, sample.f2, sample.direction])
        sample.cropPlanned = !cropKeys.has(key) && cropKeys.size < 4
        if (sample.cropPlanned) {
          cropKeys.add(key)
          const rect = canvas.getBoundingClientRect(), bounds = scene.picking.personBounds(54, rect)
          if (bounds && bounds.width > 1 && bounds.height > 1) {
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
            const x = Math.max(0, Math.floor((bounds.x - 12) * scaleX))
            const y = Math.max(0, Math.floor((bounds.y - 12) * scaleY))
            const width = Math.min(256, canvas.width - x, Math.ceil((bounds.width + 24) * scaleX))
            const height = Math.min(256, canvas.height - y, Math.ceil((bounds.height + 24) * scaleY))
            if (width > 1 && height > 1) {
              // Canvas readback excludes HTML. Retain real body-center DOM
              // ownership and reject overlap with the shipped HUD overlays.
              const clip = { x: rect.left + x / scaleX, y: rect.top + y / scaleY,
                width: width / scaleX, height: height / scaleY }
              const owner = document.elementFromPoint(rect.left + bounds.x + bounds.width / 2,
                rect.top + bounds.y + bounds.height / 2)
              const overlays = [...document.querySelectorAll('.native-hud,[data-original-pause-status],.campaign-messages summary,.campaign-messages details[open] [data-native-campaign-panel],.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
                .filter(element => { const style = getComputedStyle(element)
                  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 })
                .map(element => { const r = element.getBoundingClientRect()
                  return { tag: element.tagName, className: element.className,
                    x: r.x, y: r.y, width: r.width, height: r.height } })
                .filter(r => r.width > 0 && r.height > 0 && r.x < clip.x + clip.width && r.x + r.width > clip.x &&
                  r.y < clip.y + clip.height && r.y + r.height > clip.y)
              sample.bodyCanvasOwned = owner === canvas
              sample.bodyInCanvas = bounds.x >= 0 && bounds.y >= 0 &&
                bounds.x + bounds.width <= rect.width && bounds.y + bounds.height <= rect.height
              sample.cropOverlayClear = overlays.length === 0
              sample.cropVisibility = { bodyBounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
                canvasRect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }, bodyOwner: { tag: owner?.tagName, className: owner?.className }, clip, overlays }
              // Snapshot the current canvas in this callback, never from a
              // later render. Color scanning and PNG encoding wait until retain().
              const started = performance.now(), copy = document.createElement('canvas')
              let context
              try {
                copy.width = width; copy.height = height
                context = copy.getContext('2d')
                if (!context) throw Error('Melee crop lacks its 2D copy context')
                context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
              } catch (error) {
                copy.width = 0; copy.height = 0
                throw error
              } finally { diagnostic.cropCopyMs = performance.now() - started }
              sample.cropFile = `${recoil ? 'melee-recoil' : 'melee-attack'}-frame-${result.crops.length}.png`
              const crop = { filename: sample.cropFile, turn: world.turn, stamp: sample.stamp,
                frame: sample.frame, object: sample.object, f2: sample.f2,
                phase: sample.phase, clip: { x, y, width, height },
                copyMs: diagnostic.cropCopyMs, readbackScanMs: null, encodingMs: null }
              result.crops.push(crop); copies.push({ copy, context, crop })
            }
          }
        }
        result.samples.push(sample)
        if (result.samples.length > 1200) throw Error('Melee observation exceeded bounded sample storage')
      }
    } catch (error) {
      diagnostic.stage = 'error'
      result.error = String(error); result.done = true; stop('error'); return
    } finally {
      if (!stopped) raf = requestAnimationFrame(visit)
      diagnostic.observerMs = performance.now() - timestampMs
    }
  }
  raf = requestAnimationFrame(visit)
}

export default async function meleeAttack({ browser, url, output, expectedRevision, admission, recoil = false }) {
  assert.equal(typeof recoil, 'boolean')
  const label = recoil ? 'melee-recoil' : 'melee-attack'
  const context = await browser.newContext({ viewport: meleeArtworkViewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const report = { schema: recoil ? 'populous-new-dawn/ordinary-recoil-artwork' : 'populous-new-dawn/ordinary-melee-artwork', schemaVersion: recoil ? 1 : 2,
    status: 'running', expectedRevision, capMs: meleeAttackLimitMs, actions: [], errors: [],
    protocol: recoil ? recoilRunningProtocol : meleeRunningProtocol,
    method: 'Public authored M2 startup, Shaman54 selection, one public bird’s-eye zoom-out, nearest-target minimap input plus one fixed (0,+12) backing-pixel corridor offset, public Resume and real Shift+left attack on eligible Green Shaman20; uninterrupted normal RAF through the first observed attack entry and its independently mapped exact native expiry, with same-frame canvas observation.',
    limits: ['Direct mission access, not earned campaign unlock.', 'No original-game FPS calibration, hardware smoothness or Firewarrior browser claim.',
      'Fixed 960x720/DPR1 functional artwork capture; performance recording keeps its separate viewport. No improvement in frame cadence is assumed.',
      'Running samples prove mapped artwork and cropped same-direction same-sequence logical advancement. No browser pause/hold/resume or running same-turn hold is claimed; deterministic CPU contracts remain separate.',
      'Marker is recorded, not represented as direct observation of a private getter return. Native object and actual directional frame are independently compared.',
      'Same-frame canvas copies and visit diagnostics perturb rendering; pixel scanning and PNG encoding are deferred until retention after stop. Timings are diagnostic, not a cause attribution or performance proof.',
      'Crops still require visual review and do not establish pixel-perfect composition or hardware performance.',
      'Crop bounds read renderer/picker metadata; observation does not mutate World or issue a hit-selection query.',
      'Actual Scene CPU tests prove unpaused same-turn hold/advance and pause-to-expiry rendering. Separate 30/60/120/144Hz and irregular schedules compare simulation World states, not browser or per-schedule Scene renders.'],
    source: Object.fromEntries(['app/original-rules.json', 'app/original-units.json', 'app/melee.ts', 'app/combat-runtime.ts', 'app/projection.ts',
      'app/unit-animation-source.ts', 'app/scene-entities.ts', 'scripts/tutorial-browser/melee-attack.mjs',
      'scripts/tutorial-browser/melee-attack-running-evidence.mjs',
      'scripts/browser-portrait-input.mjs', 'scripts/browser-world-input.mjs', 'scripts/browser-space-ownership.mjs', 'app/mission-data.ts',
      'qa/erosion-ordinary/minimap-input.mjs']
      .map(path => [path, sha256(readFileSync(resolve(root, path)))])) }
  if (recoil) {
    report.method = report.method.replace('first observed attack entry', 'first observed recoil entry').replace('plus one fixed (0,+12) backing-pixel corridor offset', 'with zero offset at the nearest target center') + ' Recoil-only setup rotates the camera by a fixed half-turn through two public right drags while paused before minimap framing and the attack; no world objects or actor state are edited. After the actual order, the supported camera focus follows only authored actor54 after each observer sample to keep intercepted combat in view; tooltip state is reset and camera-relative terrain lightView follows actor54 through that API; combat orders, RNG and actor state are unchanged.'
    report.limits.push('The first observed recoil is accepted only from its exact entry, using original four-turn knockback or seven-turn Shaman duration; no later favorable episode or native-executable comparison is substituted.')
    for (const path of ['scripts/tutorial-browser/melee-recoil-evidence.mjs', 'scripts/tutorial-browser/melee-recoil.mjs', 'app/live-people.ts', 'app/world-types.ts', 'scripts/tutorial-browser/melee-recoil-camera.mjs'])
      report.source[path] = sha256(readFileSync(resolve(root, path)))
  }
  const save = () => writeFileSync(resolve(output, `${label}.json`), JSON.stringify(report, null, 2) + '\n')
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
  const localStarted = performance.now()
  const expireLocal = () => { report.timedOut = true; void context.close().catch(() => {}) }
  const timer = setTimeout(expireLocal, meleeAttackLimitMs)
  const checkLocal = () => {
    report.localElapsedMs = performance.now() - localStarted
    if (report.localElapsedMs >= meleeAttackLimitMs) expireLocal()
    assert.equal(report.timedOut, undefined, 'Ordinary melee deadline exceeded')
  }
  let failure
  const retainObservation = async () => {
    if (report.observation || page.isClosed()) return
    const observation = await page.evaluate(() => window.__pndMeleeObservation?.retain() ?? null)
    if (!observation) return
    report.observation = observation
    for (const sample of observation.samples)
      assert.equal(sample.direction, spriteDirection(Math.round(sample.cameraBearing * 1024 / Math.PI), Math.round((Math.PI - sample.heading) * 1024 / Math.PI)),
        'Observer crop direction must match the retained projection function')
    for (const crop of observation.crops) {
      if (crop.error) continue // Keep other immutable crops and the failed timeline.
      assert.match(crop.filename, recoil ? /^melee-recoil-frame-[0-3]\.png$/ : /^melee-attack-frame-[0-3]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const sample = observation.samples.find(sample => sample.cropFile === crop.filename)
      assert.ok(sample, 'Every canvas crop must belong to an actual sampled native frame')
      for (const field of ['turn', 'stamp', 'frame', 'object', 'f2', 'phase'])
        assert.equal(crop[field], sample[field], `Canvas crop ${field} must match its synchronous observation`)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' })
      crop.sha256 = sha256(bytes); delete crop.png
    }
    save()
  }
  save()
  try {
    admission?.setLocalCheck(checkLocal)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await action('New Game / No / Browser controls / All missions', () => showAllMissions(page))
    await button('Mission 2')
    await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue(); await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip') await action('Skip introduction', () => skipIntroductionWithSpace(page, { timeout: 10000 }))
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld()
      return !w.inputMask && !w.paused && w.turn > w.lastOrderTurn
    })
    await action('Pause with Space', () => setWorldPaused(page, true, { timeout: 10000 }))
    assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), true, 'Public Space must establish paused setup')
    await action('Clear previous portrait cohort', async () => {
      report.portraitCancellation = await clearPortraitSelection(page, { timeout: 10000 })
    })
    await button('Select shaman')
    await action('Focus shaman (right-click)', () => page.getByRole('button', { name: 'Select shaman', exact: true }).click({ button: 'right' }))
    const settle = () => page.waitForFunction(() => {
      const scene = window.testSceneRef.current
      return !scene.cameraMotion.active && !scene.resultCamera.active && !scene.viewTransition
    })
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out to ordinary bird’s-eye', () => page.keyboard.press('-'))
    await settle()
    if (recoil) {
      const before = await page.evaluate(readMeleeRouteState)
      assertMeleeRouteReady(before)
      await action('Two public 512px right drags: fixed half-turn before framing and attack', () => rotateRecoilCamera(page))
      await settle()
      const after = await page.evaluate(readMeleeRouteState)
      assertMeleeRouteReady(after)
      assert.equal(after.camera.position.angle, (before.camera.position.angle + 1024) & 2047)
      assert.equal(after.camera.position.x, before.camera.position.x)
      assert.equal(after.camera.position.y, before.camera.position.y)
      const gameplay = state => ({ turn: state.turn, selected: state.selected, paused: state.paused,
        speed: state.speed, inputMask: state.inputMask,
        actor: { id: state.actor.id, hp: state.actor.hp, target: state.actor.target, fight: state.actor.fight },
        target: { id: state.target.id, hp: state.target.hp, target: state.target.target, fight: state.target.fight } })
      assert.deepEqual(gameplay(after), gameplay(before), 'Paused camera setup must preserve route gameplay state')
      report.recoilCamera = { method: 'two public right-button drags (200,200) to (712,200)',
        nativeAngleDelta: 1024, before, after, gameplayUnchanged: true }
      save()
    }
    report.eligibility = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.eligibility)
    const setup = await page.evaluate(() => {
      const scene = window.testSceneRef.current, w = scene.world, target = w.units.find(unit => unit.id === 20)
      if (!target || target.kind !== 'shaman' || target.team !== 'green' || target.hp <= 0) throw Error('Authored Green Shaman20 unavailable')
      const rect = scene.mini.getBoundingClientRect()
      const gl = scene.renderer.getContext()
      return { turn: w.turn, selected: [...w.selected], paused: w.paused, speed: w.speed,
        environment: { viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
          canvas: { width: scene.renderer.domElement.width, height: scene.renderer.domElement.height },
          drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight },
          renderer: gl.getParameter(gl.RENDERER),
          vendor: gl.getParameter(gl.VENDOR),
          version: gl.getParameter(gl.VERSION) },
        target: { id: target.id, kind: target.kind, team: target.team, x: target.x, z: target.z, hp: target.hp },
        minimap: { width: scene.mini.width, height: scene.mini.height,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
          heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
          target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) } } }
    })
    report.setup = setup
    assert.deepEqual(setup.selected, [54]); assert.equal(setup.paused, true); assert.equal(setup.speed, 1)
    assert.deepEqual(setup.environment.viewport, meleeArtworkViewport)
    assert.equal(setup.environment.dpr, 1)
    const camera = report.cameraInput = meleeCameraInput(setup.minimap, recoil)
    save()
    assert.equal(await page.evaluate(point => document.elementFromPoint(point.x, point.y) === window.testSceneRef.current.mini, camera), true)
    await action(recoil ? 'Minimap camera at nearest Green Shaman20 center, zero offset' : 'Minimap camera toward Green Shaman20 plus fixed (0,+12) backing-pixel corridor offset', () => page.mouse.click(camera.x, camera.y))
    await settle()
    report.afterFocus = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.afterFocus)
    report.mapping = meleeAttackMapping(recoil); save()
    await page.evaluate(installMeleeFrameObserver, recoil ? { mode: 'recoil', mapping: report.mapping } : report.mapping)
    await action('Resume with Space', () => setWorldPaused(page, false, { timeout: 10000 }))
    await page.waitForFunction(() => !window.testStore.getWorld().paused)
    report.afterResume = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.afterResume, false)
    const targetBounds = report.targetBounds = await page.evaluate(() => {
      const s = window.testSceneRef.current, canvas = s.renderer.domElement, rect = canvas.getBoundingClientRect()
      const g = s.unitMeshes.get(20), bounds = s.picking.personBounds(20, rect)
      if (!g?.visible || !bounds) return null
      return { x: rect.left + bounds.x, y: rect.top + bounds.y, width: bounds.width, height: bounds.height }
    })
    save()
    assert.ok(targetBounds, 'Eligible Green Shaman20 must have rendered canvas bounds')
    report.targetHoverAttempts = []
    const targetPoint = await meleeTargetPoint(page, targetBounds, report.targetHoverAttempts, save)
    report.targetInput = targetPoint
    report.beforeAttack = await page.evaluate(readMeleeRouteState); save()
    assertMeleeRouteReady(report.beforeAttack, false)
    assert.equal(report.beforeAttack.actor.target, null)
    assert.equal(report.beforeAttack.actor.fight, null, 'Authored attacker must not already be fighting before the public order')
    await action('Public Shift+left attack click on Green Shaman20 while running', () => shiftClickMeleeTarget(page, targetPoint))
    report.order = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = window.testStore.getWorld(), u = w.units.find(unit => unit.id === 54)
      return { turn: w.turn, lastOrderTurn: w.lastOrderTurn, stamp: s.renderer.info.render.frame,
        selected: [...w.selected], target: u.target, path: structuredClone(u.path),
        nativeCommands: u.native && { commands: [...u.native.commands], commandCursor: u.native.commandCursor,
          commandStatus: u.native.commandStatus, workTarget: u.native.workTarget }, paused: w.paused }
    })
    save()
    assert.deepEqual(report.order.selected, [54]); assert.equal(report.order.target, 20)
    assert.equal(report.order.paused, false)
    assert.ok(report.order.lastOrderTurn >= report.beforeAttack.turn && report.order.lastOrderTurn <= report.order.turn,
      'Public attack must record an issued command on the live logical timeline')
    if (recoil) await page.evaluate(installRecoilCameraFollow, { order: report.order })
    await page.waitForFunction(() => window.__pndMeleeObservation.result.done || window.__pndRecoilCameraFollow?.result.error, null, { timeout: meleeAttackLimitMs })
    if (recoil) {
      report.cameraFollow = await page.evaluate(() => window.__pndRecoilCameraFollow.stop('observer-terminal'))
      assert.equal(report.cameraFollow.error, null)
      assert.ok(report.cameraFollow.visits.length > 0, 'Declared actor camera follow must execute')
    }
    await retainObservation()
    assert.ok(report.observation.samples.every(sample => sample.turn >= report.order.lastOrderTurn && sample.stamp > report.order.stamp),
      'Every melee sample must follow the actual public attack command')
    assert.equal(report.observation.error, null)
    for (const crop of report.observation.crops)
      assert.ok(crop.opaqueColors > 1, 'Same-frame canvas crop must not be blank')
    assert.equal(report.observation.done, true)
    report.acceptance = (recoil ? validateRecoilObservation : validateMeleeRunningObservation)(report.observation, report.mapping)
    await action('Pause with Space', () => setWorldPaused(page, true, { timeout: 10000 }))
    await page.screenshot({ path: resolve(output, `${label}-context.png`) })
  } catch (error) {
    failure = error; report.failure = { message: String(error), stack: error.stack }; save()
    if (!page.isClosed()) {
      try { report.failureState = await page.evaluate(readMeleeRouteState); save() }
      catch (diagnostic) { report.failureStateError = String(diagnostic) }
      try {
        const filename = `${label}-failure.png`
        await page.screenshot({ path: resolve(output, filename), timeout: 2000 })
        report.failureScreenshot = { filename, sha256: sha256(readFileSync(resolve(output, filename))) }
      } catch (diagnostic) { report.failureScreenshotError = String(diagnostic) }
    }
  }
  finally {
    clearTimeout(timer)
    try { checkLocal() } catch (error) { failure ??= error; report.failure ??= { message: String(error), stack: error.stack } }
    admission?.clearLocalCheck()
    if (recoil && !page.isClosed()) {
      try { report.cameraFollow = await page.evaluate(() => window.__pndRecoilCameraFollow?.stop('cleanup') ?? null) }
      catch (error) { report.errors.push(`Camera follow cleanup: ${error}`) }
    }
    try { await retainObservation() }
    catch (error) { report.errors.push(`Observer cleanup: ${error}`) }
    try { await context.close(); report.contextClosed = true }
    catch (error) { report.errors.push(`Context cleanup: ${error}`) }
    report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'; save()
  }
  assert.equal(report.status, 'passed', `Ordinary ${label} browser case failed; see ${label}.json`)
  return report
}
