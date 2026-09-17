import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import { texture } from './scene-assets.ts'
import { defeatSky, updateSkyArray, fillSkyArray, skyCloudLayer } from './sky.ts'
import { advanceSkyMotion } from './sky-motion.ts'
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
import {
  showObjectTooltip,
  stepTooltip,
  forcedTooltipObject,
  worldTooltipObject,
} from './tooltips.ts'
import {
  zoomPreset,
  viewTransitionFrames,
  stepViewTransition,
  beginGlobeMorph,
  stepGlobeMorph,
} from './camera-view.ts'
import { stepGlobeMotion } from './globe.ts'
import { teamForTribe, type TribeTeam } from './world-types.ts'
import { missionData } from './mission-data.ts'

export function makeSky(scene: GameScene) {
  const typeOne = missionData(scene.world.outcome.level).level.landscapeBank === 16
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
  for (const [i, name] of ['clouds', 'clouds-high'].entries()) {
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
  const typeOne = missionData(scene.world.outcome.level).level.landscapeBank === 16
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

export function updateEnvironmentFrame(scene: GameScene, skyTicks: number) {
  scene.updateWater()
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
    scene.viewTransition?.config ?? (scene.viewPreset ? scene.currentPreset() : undefined)
  )
}

export function currentPreset(scene: GameScene) {
  return cameraPreset(
    cameraConfigIndex(document.documentElement.clientWidth, scene.container.clientHeight),
    scene.viewPreset
  )
}

export function captureCamera(scene: GameScene) {
  // A changed input, mouse drag or focus request starts at the displayed view.
  if (scene.cameraPreviewButtons !== null) {
    scene.cameraTime = 0
    Object.assign(scene.skyOwned, scene.skyMotion)
    scene.skyRemainder = 0
  }
  scene.cameraPreviewButtons = null
  scene.cameraPosition = {
    x: Math.round((scene.viewPoint.x + 8) * 256) & 65535,
    y: Math.round((-scene.viewPoint.z - 8) * 256) & 65535,
    angle: Math.round((scene.cameraBearing * 1024) / Math.PI) & 2047,
  }
}

export function skipIntroduction(scene: GameScene) {
  interruptFlyby(scene.world.flyby, scene.flybyCamera)
  if (!(scene.world.flyby.flags & 1)) scene.world.inputMask &= ~64
  scene.onChange()
}

export function updateCameraMotion(scene: GameScene, dt: number) {
  const w = scene.world,
    s = scene.resultCamera,
    motion = scene.cameraMotion
  let buttons = scene.navigationButtons()
  if (scene.cameraPreviewButtons !== null) {
    if (buttons !== scene.cameraPreviewButtons || scene.resultRequest !== w.outcome.cameraRequest)
      scene.captureCamera()
    else {
      // Do not feed a rendered fraction back into the next native step.
      scene.viewPoint = browserPosition(scene.cameraPosition)
      scene.cameraBearing = (scene.cameraPosition.angle * Math.PI) / 1024
      scene.cameraPreviewButtons = null
    }
  }
  if (scene.resultRequest !== w.outcome.cameraRequest) {
    scene.resultRequest = w.outcome.cameraRequest
    if (!s.active) {
      scene.cancelOverview()
      scene.captureCamera()
    }
    // ponytail: first-mission tribe origins and no replay file mode; the
    // shared native tribe/camera store replaces this presentation adapter.
    beginResultCamera(
      s,
      w.manaWorld.gameFlags,
      0,
      scene.cameraPosition,
      nativePosition(w, campaignPosition(w, teamForTribe(w.outcome.cameraTribe ?? 0) as TribeTeam))
    )
  }
  let active = !!(s.active || motion.active)
  if (!active) scene.captureCamera()
  if (buttons & 15) {
    motion.active = 0
    w.mode = null
    scene.tooltip.draw = 0
  }
  scene.skyRemainder += dt
  // Use the existing 24 Hz presentation convention until draw_main's frame
  // throttling and its shared camera/flyby ordering are fully integrated.
  if (!w.paused || !s.active) {
    scene.cameraTime += dt
    while (scene.cameraTime + 1e-9 >= 1 / 24) {
      scene.stepViewChange()
      buttons = scene.navigationButtons()
      if (!w.inputMask && !scene.overviewStage && !document.querySelector('dialog[open]')) {
        if (buttons || Object.values(scene.cameraVelocity).some(Boolean)) {
          if (buttons & 15) {
            motion.active = 0
            w.mode = null
            scene.tooltip.draw = 0
          }
          // Native momentum-off mode. The original settings menu and
          // frame-rate/input scaling lifecycle are still presentation adapters.
          const angle = scene.cameraPosition.angle
          if (scene.overviewActive) scene.cameraPosition.angle = 0
          stepCameraInput(scene.cameraPosition, scene.cameraVelocity, buttons, 24)
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
          active = true
        }
        if (scene.overviewActive && !s.active) {
          const drag = scene.globeMotion
          if (drag.dragging || drag.velocity.x || drag.velocity.y) {
            const delta = stepGlobeMotion(drag, scene.globePointer, scene.container.clientHeight)
            scene.cameraPosition.x = drag.position.x & 65535
            scene.cameraPosition.y = drag.position.y & 65535
            scene.globe.moveStars(scene.cameraPosition, delta)
            active = true
          }
        }
      }
      const context = { skyCounter: w.outcome.skyCounter, newTurn: scene.resultTurn !== w.turn }
      scene.resultTurn = w.turn
      stepResultCamera(s, motion, scene.cameraPosition, context, {
        lock: () => {
          w.inputMask |= 4
          scene.keys.clear()
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
      stepCameraMotion(motion, scene.cameraPosition, scene.overviewActive ? 2 : 0, {
        rotate: () => {},
        globe: () => {},
      })
      scene.cameraTime = Math.max(0, scene.cameraTime - 1 / 24)
      if (!(w.flyby.flags & 1)) scene.commitSky(scene.cameraPosition, scene.cameraTime)
    }
  }
  w.outcome.cameraPlaying = !!s.active
  if (active) {
    if (s.active) {
      scene.overviewActive = false
    }
    scene.viewPoint = browserPosition(scene.cameraPosition)
    scene.cameraBearing = (scene.cameraPosition.angle * Math.PI) / 1024
  }
  if (scene.previewCamera(buttons)) active = true
  if (active) scene.updateView()
  return active
}

export function previewCamera(scene: GameScene, buttons: number) {
  if (
    (!buttons && !scene.cameraMotion.active) ||
    buttons !== scene.navigationButtons() ||
    scene.cameraTime <= 1e-9 ||
    scene.resultCamera.active ||
    scene.overviewActive ||
    scene.overviewStage ||
    scene.viewTransition ||
    scene.world.flyby.flags & 1
  )
    return false
  // Preview one native step without advancing its state or side effects.
  // The focus controller replaces schedules but does not mutate their rows,
  // so a shallow copy is sufficient; no per-frame deep clone is needed.
  const next = { ...scene.cameraPosition }
  stepCameraInput(next, { ...scene.cameraVelocity }, buttons, 24)
  stepCameraMotion({ ...scene.cameraMotion }, next, 0, { rotate: () => {}, globe: () => {} })
  const preview = interpolateCamera(scene.cameraPosition, next, scene.cameraTime * 24)
  // Keep browserPosition's canonical map copy without truncating the fraction.
  const wrap = (n: number) => THREE.MathUtils.euclideanModulo(n + 128, 256) - 128
  scene.viewPoint = { x: wrap(preview.x / 256 - 8), z: -wrap(preview.y / 256 + 8) }
  scene.cameraBearing = (preview.angle * Math.PI) / 1024
  scene.cameraPreviewButtons = buttons
  return true
}

export function updateFlyby(scene: GameScene, dt: number) {
  const state = scene.world.flyby,
    active = !!(state.flags & 1)
  if (active && !scene.wasFlying) {
    scene.cancelOverview()
    scene.viewPreset = 0
    scene.viewTransition = null
    scene.flybyCamera = {
      x: Math.round((scene.viewPoint.x + 8) * 256),
      y: Math.round((-scene.viewPoint.z - 8) * 256),
      angle: 0,
      zoom: 0,
    }
    scene.flybyTime = 0
    scene.keys.clear()
  }
  // ponytail: a 24 Hz presentation clock drives the recovered native timeline;
  // original frame throttling remains unported.
  if (!scene.world.paused) {
    scene.flybyTime += dt
    while (scene.flybyTime + 1e-9 >= 1 / 24) {
      for (const event of stepFlyby(state, scene.flybyCamera, 24)) {
        if (event.kind === 5)
          showObjectTooltip(
            scene.tooltip,
            forcedTooltipObject(scene.world, event.flags, event.value),
            event.duration
          )
      }
      // Native render_land_ui consumes the request before the next frame.
      scene.tooltip.draw = 0
      stepTooltip(scene.tooltip, !!worldTooltipObject(scene.world, scene.tooltip.target), 24)
      scene.flybyTime = Math.max(0, scene.flybyTime - 1 / 24)
      if (active) scene.commitSky(scene.flybyCamera, scene.flybyTime)
    }
  }
  if (!active && !scene.wasFlying) return false
  const c = scene.flybyCamera
  const p = { x: c.x / 256 - 8, z: -c.y / 256 - 8 }
  scene.overviewActive = false
  scene.cameraBearing = (c.angle * Math.PI) / 1024
  scene.viewZoom = c.zoom
  scene.viewPoint = p
  scene.updateView()
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
  scene.viewPreset = scene.overviewReturn.preset
  scene.viewTransition = null
  scene.overviewStage = null
  scene.overviewActive = false
  scene.globeMorph.active = false
}

export function focus(scene: GameScene, p: Point = HOME, { animate = false } = {}) {
  if (animate && scene.world.inputMask) return
  scene.cancelOverview()
  scene.captureCamera()
  requestCameraFocus(
    scene.cameraMotion,
    scene.cameraPosition,
    {
      ...nativePosition(scene.world, p),
      angle: -1,
    },
    !animate
  )
  scene.world.mode = null
  scene.tooltip.draw = 0
  if (!animate) {
    scene.viewPoint = browserPosition(scene.cameraPosition)
    scene.updateView()
  }
}

export function cameraBookmark(scene: GameScene, slot: number, set: boolean) {
  if (set) {
    scene.captureCamera()
    scene.cameraBookmarks[slot] = { ...scene.cameraPosition }
    scene.onSound(221)
    return
  }
  const target = scene.cameraBookmarks[slot]
  if (!target) return
  scene.cancelOverview()
  scene.captureCamera()
  scene.onSound(222)
  requestCameraFocus(scene.cameraMotion, scene.cameraPosition, {
    x: (target.x & 0xfe00) | 0x100,
    y: (target.y & 0xfe00) | 0x100,
    angle: target.angle,
  })
  scene.world.mode = null
  scene.tooltip.draw = 0
}

export function stepViewChange(scene: GameScene) {
  if (scene.world.inputMask) return
  if (scene.viewTransition && !scene.overviewActive) {
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
        scene.startGroundView(scene.overviewReturn.preset, scene.overviewReturn.bearing)
      } else scene.overviewStage = null
    }
    scene.updateView()
  }
}

export function startGroundView(scene: GameScene, preset: number, bearing?: number) {
  if (scene.cameraPreviewButtons !== null) scene.captureCamera()
  const frames = viewTransitionFrames(24)
  scene.viewPreset = preset
  scene.viewZoom = 0
  scene.viewTransition = {
    config: { ...scene.view.config, bounds: [...scene.view.config.bounds] },
    remaining: frames,
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
  if (scene.world.inputMask || scene.overviewStage) return
  if (scene.overviewActive) {
    scene.leaveOverview(scene.overviewReturn.preset)
    return
  }
  scene.captureCamera()
  scene.overviewReturn = { preset: scene.viewPreset, bearing: scene.cameraBearing }
  scene.overviewStage = 'enter'
  scene.globeMotion.dragging = false
  scene.globeMotion.velocity = { x: 0, y: 0 }
  scene.globeMotion.position = { ...scene.view.center }
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
