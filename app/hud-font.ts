// English branch of 0x4fe270. Codes below space select space; overflow selects
// the final PSFB entry. Each glyph advances by its stored width, without kerning.
export function hudGlyph(code: number, font: 0 | 2 = 0) {
  return `font${font}-${Math.max(0, Math.min(font === 0 ? 95 : 239, code - 32))}`
}
