import type { GameScene } from './scene.ts'
import { texture } from './scene-assets.ts'
import { populationMeter } from './hud-population.ts'
import { drawPortrait, portraitBackground } from './hud-portrait.ts'
import { isShaman, maxHp } from './world-rules.ts'
import nativeUnits from './original-units.json'
import nativeHud from './original-hud.json'

export function updateHudFrame(scene: GameScene, now: number, dt: number) {
  scene.drawPointer(now)
  scene.renderBuildingPanels()
  scene.objectPanels.update(texture('hud').image as HTMLImageElement)
  scene.container.parentElement!.style.setProperty(
    '--population-full-color',
    nativeHud.colors[populationMeter(1, 1, scene.gameClock.animationFrame).color]
  )
  const shaman = scene.world.units.find(u => u.team === 'blue' && isShaman(u))
  const portraitMesh = shaman && scene.unitMeshes.get(shaman.id)
  drawPortrait(
    scene.portrait,
    texture(nativeUnits.atlas).image as HTMLImageElement,
    portraitMesh?.userData.frame,
    portraitMesh?.userData.frameFlip ?? false,
    portraitBackground(
      shaman
        ? {
            health: Math.round(shaman.hp * 20),
            maximum: Math.round(maxHp('shaman') * 20),
            state: shaman.native?.state ?? 0,
          }
        : null,
      scene.gameClock.animationFrame,
      scene.portrait.parentElement?.matches(':hover,:active') ?? false
    ),
    scene.view.config
  )
  scene.uiTimer += dt
  if (scene.uiTimer > 0.2) {
    scene.onChange()
    scene.uiTimer = 0
  }
  scene.drawMinimap()
}
