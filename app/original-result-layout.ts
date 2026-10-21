import art from './original-result-ui.json' with { type: 'json' }
import { popupGlyph, popupTextWidth, type PopupFont } from './campaign-popup-layout.ts'

export {
  popupGlyph as resultGlyph,
  popupTextWidth as resultTextWidth,
} from './campaign-popup-layout.ts'

/** Native geometry with a deliberate modern fit correction: keep the complete
 * panel and prompt inside very small viewports instead of reproducing clipping. */
export function resultLayout(width: number, height: number, preferred = 1) {
  const font: PopupFont = width * height >= 640 * 480 ? 3 : 4
  const compact = height <= 220
  const glyph = popupGlyph('A', font)
  const lineHeight = compact ? Math.trunc((14 * glyph.h) / 16) + 1 : glyph.h - 1
  const groupGap = compact ? 3 : Math.trunc((5 * glyph.h) / 16) + 2
  const top = compact ? 4 : 8
  const bottom = Math.trunc(glyph.w / 2) + (compact ? 2 : 0)
  const labelWidth = Math.max(...art.nativeRows.map(row => popupTextWidth(row.label, font)))
  const colonWidth = popupTextWidth(':', font)
  const contentWidth =
    Math.max(labelWidth + colonWidth + popupTextWidth(' 22:22:22 ', font), 5 * 36 + 4 * glyph.w) +
    32
  const contentHeight =
    (art.nativeRows.length + 4) * lineHeight +
    art.nativeRows.filter(row => row.groupBefore).length * groupGap +
    2 * (top + bottom) +
    Math.trunc(lineHeight / 2) +
    43
  const panelWidth = Math.ceil(contentWidth / 16) * 16
  const panelHeight = Math.ceil(contentHeight / 16) * 16
  const contentInset = [
    Math.trunc((panelWidth - contentWidth) / 2),
    Math.trunc((panelHeight - contentHeight) / 2),
  ]
  const headingY = contentInset[1] + top
  const labelX = contentInset[0] + 16
  const valueColonX = labelX + labelWidth + colonWidth
  const geometry = {
    panelWidth,
    panelHeight,
    contentWidth,
    contentHeight,
    contentInset,
    headingY,
    playerY: headingY + lineHeight,
    statusY: headingY + 2 * lineHeight,
    timeY: headingY + 3 * lineHeight + Math.trunc(lineHeight / 2),
    labelX,
    valueColonX,
    lineHeight,
    groupGap,
    promptY: panelHeight + Math.trunc(lineHeight / 4),
    counterValueStartX: valueColonX + popupTextWidth(': ', font),
    counterReserveWidth: popupTextWidth(': 22:22:22', font),
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
