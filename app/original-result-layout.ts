import art from './original-result-ui.json' with { type: 'json' }
import { popupGlyph, popupTextWidth, type PopupFont } from './campaign-popup-layout.ts'

export { popupGlyph as resultGlyph, popupTextWidth as resultTextWidth }

/** Native geometry with a deliberate modern fit correction: keep the complete
 * panel and prompt inside very small viewports instead of reproducing clipping. */
export function resultLayout(width: number, height: number, preferred = 1) {
  const font: PopupFont = width * height >= 640 * 480 ? 3 : 4
  const short = height <= 220
  const geometry =
    font === 3
      ? art.layout640
      : {
          panelWidth: 240,
          panelHeight: short ? 208 : 224,
          contentWidth: 236,
          contentHeight: short ? 203 : 215,
          contentInset: [2, short ? 2 : 4],
          headingY: short ? 6 : 12,
          playerY: short ? 15 : 21,
          statusY: short ? 24 : 30,
          timeY: short ? 37 : 43,
          labelX: 18,
          valueColonX: 168,
          lineHeight: 9,
          groupGap: short ? 3 : 5,
          promptY: short ? 210 : 226,
          counterValueStartX: 177,
          counterReserveWidth: 51,
        }
  const glyphHeight = popupGlyph('A', font).h
  const scale = Math.max(
    0.1,
    Math.min(
      preferred,
      (width - 8) / geometry.panelWidth,
      (height - 8) / (geometry.promptY + glyphHeight)
    )
  )
  let y = geometry.timeY
  return {
    ...geometry,
    font,
    scale,
    glyphHeight,
    rows: art.nativeRows.map(row => ({
      ...row,
      y: (y += geometry.lineHeight + (row.groupBefore ? geometry.groupGap : 0)),
    })),
    promptY: Math.min(
      geometry.promptY,
      (height / scale + geometry.panelHeight) / 2 - glyphHeight - 2
    ),
  }
}

// Kept as the normal-resolution sizing helper for consumers inspecting geometry.
export function resultScale(width: number, height: number, preferred: number, controls = 0) {
  return Math.max(
    0.1,
    Math.min(preferred, (width - 24) / 384, (height - 2 * (controls + 16)) / 368)
  )
}

export function resultTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '--:--:--'
  const elapsed = Math.max(0, Math.floor(seconds))
  return [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60]
    .map(value => String(value).padStart(2, '0'))
    .join(':')
}
