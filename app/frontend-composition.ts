import assets from './original-frontend.json' with { type: 'json' }

export const frontendRows = [
  'New Game',
  'Tutorial',
  'Load Game',
  'Multiplayer',
  'Options',
  'Rolling Demo',
  'Credits',
  'Coming Soon',
  'Quit',
] as const
export const frontendRowY = (index: number) => ((0x4aaa + index * 0x1000) * 480) >> 16
export const frontendScale = (width: number, height: number) => Math.min(width / 640, height / 480)
export const frontendTextWidth = (text: string) =>
  [...text].reduce(
    (width, letter) => width + assets.banks.feft33we.rects[letter.charCodeAt(0) - 32].w,
    0
  )

interface Mask {
  w: number
  h: number
  offset: number
}
// 00459d60: each opaque sprite byte is a fade-table row, not a palette color.
export function fadeMask(target: Uint8Array, source: Uint8Array, mask: Mask, x: number, y: number) {
  const fade = 640 * 480 + 1024
  for (let row = 0; row < mask.h; row++) {
    const dy = y + row
    if (dy < 0 || dy >= 480) continue
    for (let col = 0; col < mask.w; col++) {
      const dx = x + col
      if (dx < 0 || dx >= 640) continue
      const value = source[mask.offset + row * mask.w + col]
      if (value === 255) continue
      const at = dy * 640 + dx
      target[at] = source[fade + value * 256 + target[at]]
    }
  }
}

// Fixed 640×480 reference composition; the browser scales the result uniformly.
// Text shadow → logo shadow → foreground artwork is the native draw order.
export function frontendBackground(
  source: Uint8Array,
  pointer: { x: number; y: number },
  menu: boolean,
  glowFrame: number | null = null
) {
  if (source.length !== assets.binaryBytes) throw new Error('Invalid frontend composition data')
  const indexed = source.slice(0, 640 * 480)
  if (menu) {
    for (const [index, text] of frontendRows.entries()) {
      let x = 320 - (frontendTextWidth(text) >> 1)
      const y = frontendRowY(index)
      for (const letter of text) {
        const mask = assets.masks.fesd33we[letter.charCodeAt(0) - 32]
        fadeMask(
          indexed,
          source,
          mask,
          x - ((pointer.x - (mask.w >> 1) - x) >> 5),
          y - ((pointer.y - (mask.h >> 1) - y) >> 5)
        )
        x += mask.w
      }
    }
  }
  const logo = assets.masks.felgsden[0]
  fadeMask(indexed, source, logo, 173 - ((pointer.x - 320) >> 5), 5 - ((pointer.y - 60) >> 5))
  if (glowFrame !== null) {
    const glow = assets.masks.fecursor[glowFrame % assets.masks.fecursor.length]
    fadeMask(indexed, source, glow, pointer.x - 64, pointer.y - 64)
  }
  const rgba = new Uint8ClampedArray(640 * 480 * 4)
  for (let i = 0; i < indexed.length; i++) {
    const color = 640 * 480 + indexed[i] * 4
    rgba[i * 4] = source[color]
    rgba[i * 4 + 1] = source[color + 1]
    rgba[i * 4 + 2] = source[color + 2]
    rgba[i * 4 + 3] = 255
  }
  return rgba
}
