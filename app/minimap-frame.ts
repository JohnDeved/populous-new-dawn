import artwork from './original-minimap-frame.json' with { type: 'json' }

type SpriteId = keyof typeof artwork.rects
export interface MinimapFrameDraw {
  sprite: SpriteId
  x: number
  y: number
  width: number
  height: number
}

// Native corners retain their pixel size as the map grows. The center is absent.
// The outer rectangle follows the modern, uniformly sized HUD, not native X/Y stretching.
export function minimapFrameDraws(width: number, height: number, viewportWidth: number) {
  const ids = artwork.descriptors[viewportWidth < 513 ? 'small' : 'large']
  const sprite = (index: number) => String(ids[index]) as SpriteId
  const top = artwork.rects[sprite(0)]
  const bottom = artwork.rects[sprite(6)]
  const horizontal = artwork.rects[sprite(1)]
  const vertical = artwork.rects[sprite(3)]
  const draws: MinimapFrameDraw[] = []
  const add = (index: number, x: number, y: number, w: number, h: number) => {
    if (w > 0 && h > 0) draws.push({ sprite: sprite(index), x, y, width: w, height: h })
  }
  if (width < top.w || height < top.h) return draws
  add(1, top.w, 0, width - top.w * 2, horizontal.h)
  add(7, top.w, height - horizontal.h, width - top.w * 2, horizontal.h)
  add(3, 0, top.h, vertical.w, height - top.h - bottom.h)
  add(5, width - vertical.w, top.h, vertical.w, height - top.h - bottom.h)
  add(0, 0, 0, top.w, top.h)
  add(2, width - top.w, 0, top.w, top.h)
  add(6, 0, height - bottom.h, bottom.w, bottom.h)
  add(8, width - bottom.w, height - bottom.h, bottom.w, bottom.h)
  return draws
}

export function drawMinimapFrame(
  context: CanvasRenderingContext2D,
  atlas: CanvasImageSource,
  width: number,
  height: number,
  viewportWidth: number
) {
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false
  for (const draw of minimapFrameDraws(width, height, viewportWidth)) {
    const source = artwork.rects[draw.sprite]
    for (let y = 0; y < draw.height; y += source.h) {
      for (let x = 0; x < draw.width; x += source.w) {
        const w = Math.min(source.w, draw.width - x)
        const h = Math.min(source.h, draw.height - y)
        context.drawImage(atlas, source.x, source.y, w, h, draw.x + x, draw.y + y, w, h)
      }
    }
  }
}
