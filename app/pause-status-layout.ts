import hud from './original-hud.json' with { type: 'json' }

// 00479f00 -> 00523200: English 231, no panel or interactive resume control.
// import-hud.py preserves raw F00T pixels (sprites defaults to alpha=False).
const label = 'Paused'
const glyph = (font: 3 | 4, character: string) =>
  hud.rects[`f00t${font}-${character.charCodeAt(0) - 32}` as keyof typeof hud.rects]

export function pauseStatusLayout(width: number, height: number) {
  // 0042bde0 selects this font by total screen area, not battlefield dimensions.
  const font = width * height >= 307200 ? 3 : 4
  return {
    font,
    height: glyph(font, 'A').h,
    glyphs: [...label].map(character => glyph(font, character)),
  }
}
