// English glyph selection/advance from 0x4fe270; counter controllers use F00T.
// Codes below space select space; overflow selects the final bank entry.
export function hudGlyph(code: number, font: 0 | 2 | 4 | 5 | 6 | 7 = 0) {
  const prefix = font < 3 ? 'font' : 'f00t'
  const last = { 0: 95, 2: 239, 4: 223, 5: 223, 6: 223, 7: 223 }[font]
  return `${prefix}${font}-${Math.max(0, Math.min(last, code - 32))}`
}
