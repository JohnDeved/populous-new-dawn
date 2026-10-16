import assets from './original-frontend.json' with { type: 'json' }
import { frontendWideIndexedBackground } from './frontend-wide-background.ts'

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
// Native frontend menu1 descriptors; see decomp/research/frontend-quit-menu/.
export const frontendQuitRows = [
  { text: 'Quit?', x: 320, y: 159 },
  { text: 'Yes', x: 320, y: 189 },
  { text: 'No', x: 320, y: 219 },
  { text: 'Back', x: 320, y: 454 },
] as const

export const frontendRowY = (index: number) => ((0x4aaa + index * 0x1000) * 480) >> 16
export const frontendScale = (width: number, height: number) => Math.min(width / 640, height / 480)
export const frontendTextWidth = (text: string) =>
  [...text].reduce(
    (width, letter) => width + assets.banks.feft33we.rects[letter.charCodeAt(0) - 32].w,
    0
  )

export interface FrontendTextRow {
  text: string
  x: number
  y: number
}

interface Mask {
  w: number
  h: number
  offset: number
}
// 00459d60: each opaque sprite byte is a fade-table row, not a palette color.
export function fadeMask(
  target: Uint8Array,
  source: Uint8Array,
  mask: Mask,
  x: number,
  y: number,
  width = 640
) {
  const fade = 640 * 480 + 1024
  for (let row = 0; row < mask.h; row++) {
    const dy = y + row
    if (dy < 0 || dy >= 480) continue
    for (let col = 0; col < mask.w; col++) {
      const dx = x + col
      if (dx < 0 || dx >= width) continue
      const value = source[mask.offset + row * mask.w + col]
      if (value === 255) continue
      const at = dy * width + dx
      target[at] = source[fade + value * 256 + target[at]]
    }
  }
}

// Native 640×480 reference composition, or an explicitly reframed wide background.
// Native geometry and palette effects remain on the same centered logical frame.
// Text shadow → logo shadow → foreground artwork is the native draw order.
export function frontendBackground(
  source: Uint8Array,
  pointer: { x: number; y: number },
  menu: boolean,
  glowFrame: number | null = null,
  textRows: readonly FrontendTextRow[] = [],
  width = 640
) {
  if (source.length !== assets.binaryBytes) throw new Error('Invalid frontend composition data')
  if (!Number.isInteger(width) || width < 640 || width % 2 !== 0)
    throw new Error('Invalid frontend composition width')
  const indexed =
    width === 640 ? source.slice(0, 640 * 480) : frontendWideIndexedBackground(source, width)
  const offset = (width - 640) / 2
  const rows = menu
    ? frontendRows.map((text, index) => ({ text, x: 320, y: frontendRowY(index) }))
    : textRows
  {
    for (const { text, x: center, y } of rows) {
      let x = center - (frontendTextWidth(text) >> 1)
      for (const letter of text) {
        const mask = assets.masks.fesd33we[letter.charCodeAt(0) - 32]
        fadeMask(
          indexed,
          source,
          mask,
          offset + x - ((pointer.x - (mask.w >> 1) - x) >> 5),
          y - ((pointer.y - (mask.h >> 1) - y) >> 5),
          width
        )
        x += mask.w
      }
    }
  }
  const logo = assets.masks.felgsden[0]
  fadeMask(
    indexed,
    source,
    logo,
    offset + 173 - ((pointer.x - 320) >> 5),
    5 - ((pointer.y - 60) >> 5),
    width
  )
  if (glowFrame !== null) {
    const glow = assets.masks.fecursor[glowFrame % assets.masks.fecursor.length]
    fadeMask(indexed, source, glow, offset + pointer.x - 64, pointer.y - 64, width)
  }
  const rgba = new Uint8ClampedArray(width * 480 * 4)
  for (let i = 0; i < indexed.length; i++) {
    const color = 640 * 480 + indexed[i] * 4
    rgba[i * 4] = source[color]
    rgba[i * 4 + 1] = source[color + 1]
    rgba[i * 4 + 2] = source[color + 2]
    rgba[i * 4 + 3] = 255
  }
  return rgba
}
