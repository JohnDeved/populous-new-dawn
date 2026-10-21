import type { SceneUpdateMetrics } from './scene-update-metrics.ts'
import type { WaterUpdateMetrics } from './water-update-reasons.ts'
import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import { texture } from './scene-assets.ts'
import { defeatSky, updateSkyArray, fillSkyArray, skyCloudLayer } from './sky.ts'
import { advanceSkyMotion } from './sky-motion.ts'
import { skyEnvironment } from './sky-environment.ts'
import skyPalette from './original-sky.json'
import { nativePosition, browserPosition, sound, HOME, campaignPosition, type Point } from './model'
import { cameraPreset, cameraConfigIndex } from './projection.ts'
import { stepFlyby, interruptFlyby } from './flyby.ts'
import { stepCameraInput } from './camera-input.ts'
import {
  requestCameraFocus,
  beginResultCamera,
  stepResultCamera,
  stepCameraMotion,
  interpolateCamera,
} from './camera-motion.ts'
import { forcedTooltipObject, type TooltipObject } from './tooltips.ts'
import {
  zoomPreset,
  viewTransitionFrames,
  stepViewTransition,
  previewViewTransition,
  beginGlobeMorph,
  stepGlobeMorph,
} from './camera-view.ts'
import { stepGlobeMotion } from './globe.ts'
import { teamForTribe, type TribeTeam } from './world-types.ts'
import { missionData } from './mission-data.ts'
import { displayedTribeCamera, withSimulationCamera } from './tribe-camera.ts'

export function makeSky(scene: GameScene) {
  const environment = skyEnvironment(missionData(scene.world.outcome.level).level.landscapeBank)
  const { typeOne } = environment
  scene.skyBackdrop.material.uniforms.map.value = texture(environment.backdrop)
  // Native sky commands precede land and receive a farther depth (0x47c7e0).
  // Draw before other transparent objects, with opaque land still occluding it.
  scene.skyFlash.renderOrder = -10000
  scene.skyFlash.frustumCulled = false
  scene.skyFlash.userData.nativeIgnore = true
  scene.skyFlash.visible = false
  scene.scene.add(scene.skyFlash)
  scene.skyBackdrop.renderOrder = -10003
  scene.skyBackdrop.frustumCulled = false
  scene.skyBackdrop.userData.nativeIgnore = true
  scene.scene.add(scene.skyBackdrop)
  for (const [i, name] of environment.clouds.entries()) {
    // Bank g has no backdrop: 00517630 draws only one opaque 256-size type-1 lens.
    const opaque = typeOne && i === 0
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(31 * 3), 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(31 * 2), 2))
    geo.setAttribute('fade', new THREE.Float32BufferAttribute(new Float32Array(31), 1))
    const mesh = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { map: { value: texture(opaque ? 'sky-g' : name) } },
        vertexShader:
          'attribute float fade; varying vec2 cloudUV; varying float cloudAlpha; void main(){cloudUV=vec2(uv.x,1.-uv.y);cloudAlpha=fade;gl_Position=vec4(position.xy,1.,1.);}',
        fragmentShader: `uniform sampler2D map; varying vec2 cloudUV; varying float cloudAlpha;
        void main(){gl_FragColor=texture2D(map,cloudUV);${opaque ? 'gl_FragColor.rgb*=cloudAlpha;' : 'gl_FragColor.a*=cloudAlpha;'}
        }`,
        transparent: !opaque,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        side: THREE.DoubleSide,
      })
    )
    mesh.renderOrder = -10002 + i
    mesh.frustumCulled = false
    mesh.userData.nativeIgnore = true
    scene.skyClouds.push(mesh)
    scene.scene.add(mesh)
  }
}

export function commitSky(
  scene: GameScene,
  camera: { x: number; y: number; angle: number },
  remainder: number
) {
  if (!scene.skyLoaded) {
    updateSkyArray(scene.skyOwned, camera, 0, scene.skyGrid)
    scene.skyLoaded = true
  }
  remainder = Math.max(0, remainder)
  advanceSkyMotion(scene.skyOwned, camera, Math.max(0, scene.skyRemainder - remainder))
  scene.skyRemainder = remainder
}

export function updateSky(scene: GameScene) {
  const { typeOne } = skyEnvironment(missionData(scene.world.outcome.level).level.landscapeBank)
  const camera = {
    x: (scene.viewPoint.x + 8) * 256,
    y: (-scene.viewPoint.z - 8) * 256,
    angle: (scene.cameraBearing * 1024) / Math.PI,
  }
  if (!scene.skyLoaded || (scene.world.paused && (scene.wasFlying || scene.resultCamera.active)))
    scene.commitSky(camera, 0)
  Object.assign(scene.skyMotion, scene.skyOwned)
  advanceSkyMotion(scene.skyMotion, camera, scene.skyRemainder)
  fillSkyArray(
    scene.skyGrid,
    Math.round(scene.skyMotion.angle) & 2047,
    Math.trunc(scene.skyMotion.x * 512),
    Math.trunc(scene.skyMotion.y * 512)
  )
  const width = scene.container.clientWidth,
    height = scene.container.clientHeight
  if (!width || !height) return
  // Keep the native horizon/UV scale. Wide views can expose space below it;
  // extend the backdrop edge color there without stretching clouds or terrain.
  const horizon = scene.view.config.horizon
  scene.skyBackdrop.visible = !scene.overviewActive && !typeOne
  scene.skyBackdrop.material.uniforms.height.value = horizon / height
  for (const [i, mesh] of scene.skyClouds.entries()) {
    mesh.visible = !scene.overviewActive && horizon > 0 && (!typeOne || i === 0)
    if (!mesh.visible) continue
    // ponytail: the browser battlefield is the render surface. Its HUD is
    // outside that surface, so include the original optional left strip.
    // Restore native offsets when the original UI layout is integrated.
    const layer = skyCloudLayer(
      scene.skyGrid,
      width,
      height,
      horizon,
      i ? 192 : 256,
      !typeOne,
      true,
      true,
      true
    )
    const { position, uv, fade } = mesh.geometry.attributes
    layer.vertices.forEach((v, j) => {
      position.setXYZ(j, (v.x * 2) / width - 1, 1 - (v.y * 2) / height, 1)
      uv.setXY(j, v.u, v.v)
      fade.setX(j, ((typeOne ? v.color : v.color >>> 24) & 255) / 255)
    })
    fade.needsUpdate = true
    uv.needsUpdate = true
    position.needsUpdate = true
    const count = layer.triangles.length * 3
    if (mesh.geometry.index?.count !== count) mesh.geometry.setIndex(layer.triangles.flat())
  }
}

export function updateEnvironmentFrame(
  scene: GameScene,
  skyTicks: number,
  waterMetrics?: WaterUpdateMetrics,
  sceneUpdates?: SceneUpdateMetrics
) {
  const waterStart = sceneUpdates ? performance.now() : 0
  scene.updateWater(waterMetrics)
  if (sceneUpdates) sceneUpdates.waterCpuMs += performance.now() - waterStart
  scene.ground.visible = !scene.overviewActive
  scene.globe.visible = scene.overviewActive
  scene.scene.background = scene.space
  if (scene.overviewActive && scene.terrainTextures) {
    scene.globe.phase = (scene.globe.phase + (skyTicks >>> 4)) | 0
    scene.globe.update(scene.view.globe, scene.world, scene.terrainTextures)
  }
  scene.updateSky()
  // ponytail: initial mission palette; connect live system-palette changes
  // when the original palette scheduler is integrated.
  const sky = defeatSky(
    scene.world.outcome.skyCounter,
    scene.world.outcome.lastDefeated,
    skyPalette.colors,
    {
      x: 0,
      y: 0,
      width: scene.container.clientWidth,
      screenWidth: scene.container.clientWidth,
      // 0x429f90 clamps the ground-view flash surface to the viewport.
      surfaceOffset:
        scene.container.clientWidth *
        Math.max(0, Math.min(scene.container.clientHeight, scene.view.config.horizon)),
    }
  )
  scene.skyFlash.visible = !!sky && !scene.overviewActive
  if (sky) {
    scene.skyFlash.material.uniforms.height.value =
      (sky.rect[3] - sky.rect[1]) / scene.container.clientHeight
    scene.skyFlash.material.uniforms.rgba.value.set(
      ((sky.color >>> 16) & 255) / 255,
      ((sky.color >>> 8) & 255) / 255,
      (sky.color & 255) / 255,
      (sky.color >>> 24) / 255
    )
  }
}

export function updateView(scene: GameScene) {
  scene.world.lightView = nativePosition(scene.world, scene.viewPoint)
  scene.view.globeBlend = scene.overviewActive ? scene.globeMorph.value : 0
  scene.view.globeFlatScale = scene.overviewStage === 'exit' ? 18 : 21
  scene.view.update(
    scene.container.clientWidth,
    scene.container.clientHeight,
    scene.viewPoint,
    scene.cameraBearing,
    scene.viewZoom,
    scene.overviewActive,
    document.documentElement.clientWidth,
    scene.viewTransition?.preview ??
      scene.viewTransition?.config ??
      (scene.viewPreset ? scene.currentPreset() : undefined)
  )
}

export function currentPreset(scene: GameScene) {
  return cameraPreset(
    cameraConfigIndex(document.documentElement.clientWidth, scene.container.clientHeight),
    scene.viewPreset
  )
}

// Timestamped input can rebase the fractional navigation sample. Compute it
// from owned state; a displayed renderer pose is never an authority source.
export function captureCamera(scene: GameScene, interruptMotion = false) {
  const c = scene.world.cameras
  if (c.phase !== 'idle') return
  withSimulationCamera(c, () => {
    const sampled = sampleCamera(scene, c.input.buttons, interruptMotion)
    if (sampled)
      Object.assign(scene.cameraPosition, {
        x: Math.round(sampled.x) & 65535,
        y: Math.round(sampled.y) & 65535,
        angle: Math.round(sampled.angle) & 2047,
      })
    if (interruptMotion) scene.cameraMotion.active = 0
    scene.commitSky(scene.cameraPosition, 0)
  })
  // An input starts a new navigation segment even when the old buttons were
  // zero. Camera, focus, animation and independent zoom deadlines do not move.
  c.navigationTime = 0
  scene.cameraPreviewButtons = null
}

export function skipIntroduction(scene: GameScene) {
  scene.advanceInputTime?.()
  const state = scene.world.flyby,
    skipping = (state.flags & 17) === 17 && (!!state.warmup || !(state.flags & 64))
  withSimulationCamera(scene.world.cameras, () =>
    interruptFlyby(scene.world.flyby, scene.flybyCamera)
  )
  if (skipping) scene.tooltipFrame.cueGroups.length = 0
  if (!(scene.world.flyby.flags & 1)) scene.world.inputMask &= ~64
  scene.onChange()
}

// Input belongs to the pre-simulation phase. Result/focus/heading controllers
// belong to the post phase, with one shared mutable tribe pose between them.
export function preCameraVisit(scene: GameScene) {
  scene.tooltipCameraActive ||= !!(scene.resultCamera.active || scene.cameraMotion.active)
  // 004a4960 visits the flyby before shake and person processing. Keep the
  // existing pause/focus gates, but never let its absolute writes follow a turn.
  if (!scene.resultCamera.active && !scene.cameraMotion.active && !scene.world.paused)
    updateFlyby(scene, 1 / 24)
  const w = scene.world,
    buttons = scene.navigationButtons(),
    fraction = Math.min(1, w.cameras.navigationTime * 24)
  // A flyby can release its mask without a DOM event. Reconcile held input at
  // the controller boundary without rebasing time or publishing another event.
  w.cameras.input.buttons = buttons
  w.cameras.navigationTime = 0
  if (w.inputMask || scene.overviewStage) return
  if (buttons || Object.values(scene.cameraVelocity).some(Boolean)) {
    scene.tooltipCameraActive = true
    if (buttons & 15) {
      scene.cameraMotion.active = 0
      w.mode = null
      scene.tooltip.draw = 0
    }
    const angle = scene.cameraPosition.angle
    if (scene.overviewActive) scene.cameraPosition.angle = 0
    const next = { ...scene.cameraPosition }
    stepCameraInput(next, scene.cameraVelocity, buttons, 24)
    const moved = interpolateCamera(scene.cameraPosition, next, fraction)
    Object.assign(scene.cameraPosition, {
      x: Math.round(moved.x) & 65535,
      y: Math.round(moved.y) & 65535,
      angle: Math.round(moved.angle) & 2047,
    })
    if (scene.overviewActive) {
      scene.cameraPosition.angle = angle
      if (buttons & 15) {
        const drag = scene.globeMotion
        drag.position.x += ((scene.cameraPosition.x - drag.position.x) << 16) >> 16
        drag.position.y += ((scene.cameraPosition.y - drag.position.y) << 16) >> 16
        drag.velocity = { x: 0, y: 0 }
        scene.globe.moveStars(scene.cameraPosition)
      }
    }
  }
  if (scene.overviewActive && !scene.resultCamera.active) {
    const drag = scene.globeMotion
    if (drag.dragging || drag.velocity.x || drag.velocity.y) {
      scene.tooltipCameraActive = true
      const delta = stepGlobeMotion(drag, scene.globePointer, scene.container.clientHeight)
      scene.cameraPosition.x = drag.position.x & 65535
      scene.cameraPosition.y = drag.position.y & 65535
      scene.globe.moveStars(scene.cameraPosition, delta)
    }
  }
}

export function postCameraVisit(scene: GameScene, ordinaryZoom?: () => void) {
  const w = scene.world,
    s = scene.resultCamera,
    motion = scene.cameraMotion
  if (scene.resultRequest !== w.outcome.cameraRequest) {
    scene.resultRequest = w.outcome.cameraRequest
    if (!s.active) scene.cancelOverview()
    beginResultCamera(
      s,
      w.manaWorld.gameFlags,
      0,
      scene.cameraPosition,
      nativePosition(w, campaignPosition(w, teamForTribe(w.outcome.cameraTribe ?? 0) as TribeTeam))
    )
  }
  const context = { skyCounter: w.outcome.skyCounter, newTurn: scene.resultTurn !== w.turn }
  scene.resultTurn = w.turn
  scene.tooltipCameraActive ||= !!(s.active || motion.active)
  stepResultCamera(s, motion, scene.cameraPosition, context, {
    lock: () => {
      w.inputMask |= 4
      scene.keys.clear()
      w.cameras.input.buttons = 0
    },
    unlock: () => {
      w.inputMask &= ~4
    },
    clearInteraction: () => {
      if (w.flyby.flags & 1) {
        w.flyby.flags &= ~1
        scene.flybyCamera.zoom = 0
        scene.viewZoom = 0
        w.inputMask &= ~64
        scene.wasFlying = false
      }
      w.mode = null
      scene.tooltip.draw = 0
    },
    sound: () => sound(w, 0xa2, browserPosition(scene.cameraPosition)),
  })
  w.outcome.skyCounter = context.skyCounter
  scene.tooltipCameraActive ||= !!(s.active || motion.active)
  // Native result/focus selection precedes view/heading transitions, then
  // motion consumes their resulting shared pose (004a4960, 0041b6d0 onward).
  if (scene.overviewActive || scene.overviewStage || scene.viewTransition?.angle)
    scene.stepViewChange()
  else ordinaryZoom?.()
  stepCameraMotion(motion, scene.cameraPosition, scene.overviewActive ? 2 : 0, {
    rotate: () => {},
    globe: () => {},
  })
  w.outcome.cameraPlaying = !!s.active
  if (s.active) scene.overviewActive = false
  // Result/view gates can also change in this phase. The next fractional
  // preview must already use the newly permitted input and overview mapping.
  w.cameras.input.buttons = scene.navigationButtons()
  scene.commitSky(scene.cameraPosition, 0)
}

function sampleCamera(scene: GameScene, buttons: number, includeMotion = true) {
  if (
    (!buttons && !(includeMotion && scene.cameraMotion.active)) ||
    scene.world.inputMask ||
    scene.resultCamera.active ||
    scene.overviewActive ||
    scene.overviewStage ||
    scene.viewTransition?.angle ||
    scene.world.flyby.flags & 1
  )
    return null
  const current = displayedTribeCamera(scene.world.cameras, scene.world.manaWorld.playerTribe),
    next = { ...current }
  stepCameraInput(next, { ...scene.cameraVelocity }, buttons, 24)
  const navigation = interpolateCamera(
    current,
    next,
    Math.min(1, scene.world.cameras.navigationTime * 24)
  )
  if (!includeMotion || !scene.cameraMotion.active) return navigation
  const focused = { ...navigation }
  // Completion can write target.angle. Schedules are replaced, but the target
  // itself must be copied or a render preview changes the next controller turn.
  stepCameraMotion(
    { ...scene.cameraMotion, target: { ...scene.cameraMotion.target } },
    focused,
    0,
    { rotate: () => {}, globe: () => {} }
  )
  return interpolateCamera(navigation, focused, scene.cameraTime * 24)
}

export function previewCamera(scene: GameScene, buttons: number) {
  const preview = sampleCamera(scene, buttons)
  if (!preview) return false
  const wrap = (n: number) => THREE.MathUtils.euclideanModulo(n + 128, 256) - 128
  scene.viewPoint = { x: wrap(preview.x / 256 - 8), z: -wrap(preview.y / 256 + 8) }
  scene.cameraBearing = (preview.angle * Math.PI) / 1024
  scene.cameraPreviewButtons = buttons
  return true
}

// Rendering is uncapped. It only samples the committed logical result and a
// prediction on copies; controller time belongs to advanceGame.
export function updateCameraMotion(scene: GameScene) {
  const c = scene.world.cameras,
    pose = displayedTribeCamera(c, scene.world.manaWorld.playerTribe)
  scene.viewPoint = browserPosition(pose)
  scene.cameraBearing = (pose.angle * Math.PI) / 1024
  scene.cameraPreviewButtons = null
  const preview = scene.previewCamera(c.input.buttons),
    zoom = previewGroundZoom(scene)
  scene.tooltipCameraActive ||= !!(
    preview ||
    (zoom && scene.tooltipFrame.elapsed > scene.tooltipFrame.lastElapsed) ||
    c.result.active ||
    c.motion.active ||
    c.input.buttons
  )
  scene.updateView()
  return !!(preview || zoom || c.result.active || c.motion.active || c.wasFlying || c.input.buttons)
}

// One logical pre-phase visit, never a second elapsed-time accumulator.
export function updateFlyby(scene: GameScene, dt: number) {
  if (dt <= 0 || scene.world.paused) return false
  const state = scene.world.flyby,
    active = !!(state.flags & 1)
  if (active && !scene.wasFlying) {
    scene.cancelOverview()
    scene.viewPreset = 0
    scene.viewTransition = null
    scene.flybyCamera.zoom = 0
    scene.levelStartCameraSeeded = false
    scene.keys.clear()
    scene.world.cameras.input.buttons = 0
  }
  const cues: { object: TooltipObject | null; duration: number }[] = []
  for (const event of stepFlyby(state, scene.flybyCamera, 24)) {
    if (event.kind !== 5) continue
    const object = forcedTooltipObject(scene.world, event.flags, event.value)
    cues.push({
      object: object
        ? {
            id: object.id,
            x: object.x,
            z: object.z,
            type: object.type,
            model: object.model,
            owner: object.owner,
            tutorial: object.tutorial,
            head: object.head ? { ...object.head } : null,
          }
        : null,
      duration: event.duration,
    })
  }
  if (cues.length)
    scene.tooltipFrame.cueGroups.push({ emittedElapsed: scene.tooltipFrame.elapsed, cues })
  if (!active && !scene.wasFlying) return false
  scene.overviewActive = false
  scene.viewZoom = scene.flybyCamera.zoom
  scene.wasFlying = !!(state.flags & 1)
  if (!scene.wasFlying) {
    scene.world.inputMask &= ~64
    scene.camera.up.set(0, 0, -1)
  }
  return true
}

export function cancelOverview(scene: GameScene) {
  if (!scene.overviewActive && !scene.overviewStage) return
  scene.cameraBearing = scene.overviewReturn.bearing
  scene.cameraPosition.angle = Math.round((scene.overviewReturn.bearing * 1024) / Math.PI) & 2047
  scene.viewPreset = scene.overviewReturn.preset
  scene.viewTransition = null
  scene.overviewStage = null
  scene.overviewActive = false
  scene.world.drawMode = 0
  scene.globeMorph.active = false
}

export function focus(scene: GameScene, p: Point = HOME, { animate = false } = {}) {
  scene.advanceInputTime()
  if (animate && scene.world.inputMask) return
  scene.captureCamera(true)
  withSimulationCamera(scene.world.cameras, () => {
    scene.cancelOverview()
    requestCameraFocus(
      scene.cameraMotion,
      scene.cameraPosition,
      { ...nativePosition(scene.world, p), angle: -1 },
      !animate
    )
    scene.world.mode = null
    scene.tooltip.draw = 0
    if (!animate) {
      scene.viewPoint = browserPosition(scene.cameraPosition)
      scene.cameraBearing = (scene.cameraPosition.angle * Math.PI) / 1024
      scene.updateView()
    }
  })
}

export function cameraBookmark(scene: GameScene, slot: number, set: boolean) {
  scene.advanceInputTime()
  if (set) {
    // Reading a bookmark must not commit a predicted focus step twice.
    const sample =
      sampleCamera(scene, scene.world.cameras.input.buttons) ??
      displayedTribeCamera(scene.world.cameras, scene.world.manaWorld.playerTribe)
    scene.cameraBookmarks[slot] = {
      x: Math.round(sample.x) & 65535,
      y: Math.round(sample.y) & 65535,
      angle: Math.round(sample.angle) & 2047,
    }
    scene.onSound(221)
    return
  }
  const target = scene.cameraBookmarks[slot]
  if (!target) return
  scene.captureCamera(true)
  withSimulationCamera(scene.world.cameras, () => {
    scene.cancelOverview()
    scene.onSound(222)
    requestCameraFocus(scene.cameraMotion, scene.cameraPosition, {
      x: (target.x & 0xfe00) | 0x100,
      y: (target.y & 0xfe00) | 0x100,
      angle: target.angle,
    })
    scene.world.mode = null
    scene.tooltip.draw = 0
  })
}

// Only ordinary ground zoom is previewed; globe/heading choreography is not
// speculated, and previewing cannot run native notifications or change masks.
export function previewGroundZoom(scene: GameScene) {
  const transition = scene.viewTransition
  if (
    !transition ||
    scene.world.inputMask ||
    scene.overviewActive ||
    scene.overviewStage ||
    transition.angle ||
    (scene.world.paused && scene.resultCamera.active)
  )
    return false
  const fraction = Math.max(
    transition.previewFraction,
    Math.min(
      1,
      Math.max(
        0,
        (transition.time - transition.previewStartTime) / (1 / 24 - transition.previewStartTime)
      )
    )
  )
  if (fraction <= 1e-9) return false
  // A lock/camera capture must never roll back an already displayed sample.
  // Retargeting starts a new transition from that displayed config instead.
  if (fraction !== transition.previewFraction) scene.pointerState = ''
  transition.previewFraction = fraction
  transition.preview = previewViewTransition(
    transition.config,
    scene.currentPreset(),
    transition.remaining,
    viewTransitionFrames(24),
    fraction
  )
  return true
}

export function stepViewChange(scene: GameScene) {
  if (scene.world.inputMask) return
  if (scene.viewTransition && !scene.overviewActive) {
    scene.viewTransition.preview = undefined
    scene.viewTransition.previewStartTime = 0
    scene.viewTransition.previewFraction = 0
    scene.viewTransition.remaining = stepViewTransition(
      scene.viewTransition.config,
      scene.currentPreset(),
      scene.viewTransition.remaining,
      viewTransitionFrames(24)
    )
    const angle = scene.viewTransition.angle
    if (angle) {
      scene.cameraPosition.angle = scene.viewTransition.remaining
        ? (scene.cameraPosition.angle + angle.increment) & 2047
        : angle.target
      scene.cameraBearing = (scene.cameraPosition.angle * Math.PI) / 1024
    }
    if (!scene.viewTransition.remaining) {
      scene.viewTransition = null
      if (scene.overviewStage === 'enter') {
        scene.overviewActive = true
        scene.world.drawMode = 2
        beginGlobeMorph(scene.globeMorph, true)
      } else scene.overviewStage = null
    }
    scene.updateView()
  }
  if (scene.overviewActive && scene.globeMorph.active) {
    stepGlobeMorph(scene.globeMorph)
    if (!scene.globeMorph.active) {
      if (scene.overviewStage === 'exit') {
        scene.overviewActive = false
        scene.world.drawMode = 0
        scene.startGroundView(scene.overviewReturn.preset, scene.overviewReturn.bearing)
      } else scene.overviewStage = null
    }
    scene.updateView()
  }
}

export function startGroundView(scene: GameScene, preset: number, bearing?: number) {
  const previousTime = scene.viewTransition?.time
  previewGroundZoom(scene)
  // Rebuild from the old owned transition/preset before capturing its config.
  // A new Scene or an input between paints need not have a current renderer cache.
  scene.updateView()
  if (scene.cameraPreviewButtons !== null) scene.captureCamera()
  const frames = viewTransitionFrames(24),
    time = previousTime ?? scene.cameraTime
  scene.viewPreset = preset
  scene.viewZoom = 0
  scene.viewTransition = {
    config: { ...scene.view.config, bounds: [...scene.view.config.bounds] },
    remaining: frames,
    time,
    previewStartTime: time,
    previewFraction: 0,
  }
  if (bearing !== undefined) {
    const target = Math.round((bearing * 1024) / Math.PI) & 2047
    let distance = target - scene.cameraPosition.angle
    if (Math.abs(distance) > 1024) distance += distance < 0 ? 2048 : -2048
    scene.viewTransition.angle = { target, increment: Math.trunc(distance / frames) }
  }
  scene.updateView()
}

export function overview(scene: GameScene) {
  scene.advanceInputTime()
  if (scene.world.inputMask || scene.overviewStage) return
  if (scene.overviewActive) {
    scene.leaveOverview(scene.overviewReturn.preset)
    return
  }
  scene.captureCamera(true)
  // Capture the event-time ground view before entering overview disables its
  // fractional prediction. The last rendered frame may be older than this input.
  if (previewGroundZoom(scene)) scene.updateView()
  scene.overviewReturn = {
    preset: scene.viewPreset,
    bearing:
      (displayedTribeCamera(scene.world.cameras, scene.world.manaWorld.playerTribe).angle *
        Math.PI) /
      1024,
  }
  scene.overviewStage = 'enter'
  scene.globeMotion.dragging = false
  scene.globeMotion.velocity = { x: 0, y: 0 }
  scene.globeMotion.position = { x: scene.cameraPosition.x, y: scene.cameraPosition.y }
  scene.world.mode = null
  scene.cameraMotion.active = 0
  scene.startGroundView(4, 0)
}

export function leaveOverview(scene: GameScene, preset: number) {
  scene.overviewReturn.preset = preset
  scene.overviewStage = 'exit'
  scene.globeMotion.dragging = false
  scene.globeMotion.velocity = { x: 0, y: 0 }
  beginGlobeMorph(scene.globeMorph, false)
  scene.world.mode = null
}

export function zoom(scene: GameScene, inward: boolean) {
  scene.advanceInputTime()
  if (scene.world.inputMask || scene.overviewStage) return
  const preset = zoomPreset(scene.overviewActive ? 4 : scene.viewPreset, inward)
  if (preset === 4) {
    if (!scene.overviewActive) scene.overview()
    return
  }
  if (scene.overviewActive) {
    scene.leaveOverview(preset)
    return
  }
  if (preset !== scene.viewPreset) scene.startGroundView(preset)
}
