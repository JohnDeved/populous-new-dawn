import units from './original-units.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import { spriteLayers } from './sprite-layers.ts'
import type { CameraConfig } from './projection.ts'

// 0x49fe70: missing shamans clear the interior, including while hovered.
export function portraitBackground(
  shaman: { health: number; maximum: number; state: number } | null,
  frame: number,
  hover: boolean
) {
  if (!shaman) return 172
  if (hover) return 130
  return shaman.health >= shaman.maximum - 225 &&
    (shaman.state === 25 || shaman.state === 29) &&
    frame & 4
    ? 243
    : 172
}

// 0x450e60: reuse the live directional frame, suppress its shadow, anchor at HUD (47,144).
// The canvas spans the HUD because original action poses can cross the frame.
// ponytail: logical 640×480 HUD; native per-resolution rounding remains separate.
export function drawPortrait(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  frame: number | undefined,
  flip: boolean,
  background: number,
  view: CameraConfig
) {
  const context = canvas.getContext('2d')!
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = hud.colors[background]
  context.fillRect(35, 116, 25, 30)
  if (frame === undefined || !atlas?.complete || !atlas.naturalWidth) return
  context.imageSmoothingEnabled = false
  for (const layer of spriteLayers(
    units.frames[frame].layers,
    units.pieces,
    { flags: 2 | Number(flip) },
    view
  )) {
    const mirror = !!(layer.flags & 1)
    context.save()
    context.translate(47 + layer.x + (mirror ? layer.w : 0), 144 + layer.y)
    context.scale(mirror ? -1 : 1, 1)
    context.drawImage(
      atlas,
      (layer.piece % units.columns) * units.cell,
      Math.floor(layer.piece / units.columns) * units.cell,
      layer.w,
      layer.h,
      0,
      0,
      layer.w,
      layer.h
    )
    context.restore()
  }
}
