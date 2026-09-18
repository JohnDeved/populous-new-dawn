import type { GameScene } from './scene.ts'
import { texture } from './scene-assets.ts'
import { populationMeter } from './hud-population.ts'
import { drawPortrait, portraitBackground } from './hud-portrait.ts'
import { isShaman, maxHp } from './world-rules.ts'
import nativeUnits from './original-units.json'
import nativeHud from './original-hud.json'

function messageScreenY(value: number, height: number) {
  const product = (Math.imul(height, value) + Math.trunc(height / 2)) | 0
  return (product + ((product >> 31) & 0xffff)) >> 16
}

function syncCampaignMessagePresentation(scene: GameScene) {
  const shell = scene.container.parentElement
  if (!shell) return
  const elements = shell.querySelectorAll<HTMLElement>(
    '.campaign-messages details[data-message-serial]'
  )
  if (!elements.length) return

  const messages = new Map(
      scene.world.messages.slots
        .filter(message => message)
        .map(message => [message!.serial, message!] as const)
    ),
    height = window.innerHeight,
    lowerBoundary = Math.trunc(height / 2)

  for (const element of elements) {
    const message = messages.get(Number(element.dataset.messageSerial))
    if (!message) continue
    const top = messageScreenY(message.position, height)
    element.style.top = `${top}px`
    if (top > lowerBoundary) element.setAttribute('data-lower', '')
    else element.removeAttribute('data-lower')
  }
}

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
  // Campaign-message motion advances independently of the slower general HUD publication.
  // Keep the already-mounted message DOM bound to that mutable presentation state without
  // globally publishing React/store revisions every frame.
  syncCampaignMessagePresentation(scene)
  scene.uiTimer += dt
  if (scene.uiTimer > 0.2) {
    scene.onChange()
    scene.uiTimer = 0
  }
  scene.drawMinimap()
}
