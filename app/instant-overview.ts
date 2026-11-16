import type { GameScene } from './scene.ts'

// Shift/Ctrl+Return (native action 0xc5) calls 0041d4b0, which enters or leaves
// World View in one call. It is ignored while the overview state machine
// (0089ce36), the globe morph (005fe420) or the view-config countdown (0089ce34,
// also armed by an ordinary zoom) runs. Plain Return keeps the animated
// overview()/leaveOverview() owners in scene-camera-runtime.ts. This applies their
// completed end state without frames and keeps their input resets.
// See decomp/research/instant-overview.md.
export function instantOverview(scene: GameScene) {
  if (
    scene.world.inputMask ||
    scene.overviewStage ||
    scene.viewTransition ||
    scene.globeMorph.active
  )
    return
  const entering = !scene.overviewActive
  if (entering) {
    // The same entry resets as overview(), then 0041d4b0's saved angle/index.
    scene.captureCamera()
    scene.overviewReturn = { preset: scene.viewPreset, bearing: scene.cameraBearing }
    scene.globeMotion.position = { ...scene.view.center }
    scene.cameraMotion.active = 0
  }
  scene.globeMotion.dragging = false
  scene.globeMotion.velocity = { x: 0, y: 0 }
  scene.world.mode = null
  // Entry: view preset 4, angle 0, completed globe morph (0). Exit: the saved
  // preset and angle (005fe42c) with flat ground (256).
  const angle = entering ? 0 : Math.round((scene.overviewReturn.bearing * 1024) / Math.PI) & 2047
  scene.globeMorph.active = false
  scene.globeMorph.value = scene.globeMorph.target = entering ? 0 : 256
  scene.viewTransition = null
  scene.viewZoom = 0
  scene.viewPreset = entering ? 4 : scene.overviewReturn.preset
  scene.cameraPosition.angle = angle
  scene.cameraBearing = (angle * Math.PI) / 1024
  scene.overviewStage = null
  scene.overviewActive = entering
  scene.world.drawMode = entering ? 2 : 0
  scene.updateView()
}
