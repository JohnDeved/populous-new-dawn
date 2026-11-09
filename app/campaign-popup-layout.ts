import result from './original-result-ui.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }

export type PopupFont = 3 | 4

export function popupGlyph(character: string, font: PopupFont) {
  const index = Math.max(0, Math.min(223, character.charCodeAt(0) - 32))
  return font === 3
    ? result.font.rects[index]
    : hud.rects[`f00t4-${index}` as keyof typeof hud.rects]
}

export const popupTextWidth = (text: string, font: PopupFont) =>
  [...text].reduce((width, character) => width + popupGlyph(character, font).w, 0)

// The Western wrapper consumes a glyph before checking its accumulated width.
// It backtracks after punctuation/space only when there is more text to consume.
export function wrapPopupText(text: string, width: number, font: PopupFont) {
  const lines: string[] = []
  let start = 0
  while (start < text.length) {
    let end = start,
      pixels = 0,
      lastBreak = -1
    while (end < text.length && pixels < width && end - start < 511) {
      const character = text[end++]
      if (' -,.:;'.includes(character)) lastBreak = end
      pixels += popupGlyph(character, font).w
    }
    // Preserve forward progress even in a browser viewport narrower than a glyph.
    if (end === start) end++
    let next = end
    if (end < text.length) {
      if (lastBreak >= 0) {
        end = lastBreak - (text[lastBreak - 1] === ' ' ? 1 : 0)
        next = lastBreak
      }
      while (text[next] === ' ') next++
    }
    lines.push(text.slice(start, end))
    start = next
  }
  return lines
}

// Source geometry is independent of notification position and its icon size.
// Browser fitting below preserves this geometry rather than introducing CSS wrap.
export function campaignPopupLayout(
  text: string,
  width: number,
  height: number,
  font: PopupFont,
  labels = ['OK']
) {
  const a = popupGlyph('A', font),
    wrapWidth = Math.max(1, width - Math.trunc((12 * width) / 32)),
    lines = wrapPopupText(text, wrapWidth, font),
    padding = Math.trunc((24 * a.w) / 16),
    buttonWidths = labels.map(label => popupTextWidth(label, font) + 4 * a.w),
    buttonsWidth = buttonWidths.reduce((sum, value) => sum + value, 0),
    initialButtonsWidth = buttonsWidth + Math.max(0, labels.length - 1) * 3 * a.w,
    buttonHeight = Math.trunc((22 * a.h) / 16),
    panelWidth = Math.ceil((Math.max(wrapWidth, initialButtonsWidth) + 4 * padding) / 16) * 16,
    panelHeight = Math.ceil((lines.length * a.h + buttonHeight + 5 * padding) / 16) * 16,
    textX = Math.trunc((panelWidth - wrapWidth) / 2),
    gap = labels.length > 1 ? Math.trunc((wrapWidth - buttonsWidth) / (labels.length - 1)) : 0
  let buttonX = textX
  return {
    font,
    lines,
    wrapWidth,
    panelWidth,
    panelHeight,
    x: Math.trunc((width - panelWidth) / 2),
    y: Math.trunc(height / 32),
    textX,
    textY: buttonHeight,
    lineHeight: a.h,
    buttons: labels.map((label, index) => {
      const buttonWidth = buttonWidths[index],
        x = index === labels.length - 1 && index > 0 ? textX + wrapWidth - buttonWidth : buttonX
      buttonX += buttonWidth + gap
      return {
        label,
        x,
        y: panelHeight - Math.trunc((12 * a.h) / 16) - buttonHeight,
        width: buttonWidth,
        height: buttonHeight,
        labelX: Math.trunc((buttonWidth - popupTextWidth(label, font)) / 2),
        labelY: Math.trunc((buttonHeight - a.h) / 2),
      }
    }),
  }
}

export function popupPanelTile(column: number, row: number, columns: number, rows: number) {
  if (row === 0) {
    if (column === 0) return 1450
    if (column === columns - 1) return 1451
    return 1454 + Number(column % 2 === 0)
  }
  if (row === rows - 1) {
    if (column === 0) return 1452
    if (column === columns - 1) return 1453
    return 1456 + Number(column % 2 === 0)
  }
  if (column === 0) return 1458 + Number((columns - 1) % 2 === 0)
  if (column === columns - 1) return 1460 + Number((columns - 1) % 2 === 0)
  return 1462
}

export function fitCampaignPopup(
  text: string,
  width: number,
  height: number,
  screenWidth: number,
  preferred = 1,
  labels = ['OK']
) {
  const font = screenWidth * height < 640 * 480 ? 4 : 3,
    wanted = Math.max(1, preferred),
    layout = campaignPopupLayout(
      text,
      Math.trunc(width / wanted),
      Math.trunc(height / wanted),
      font,
      labels
    ),
    scale = Math.max(
      0.1,
      Math.min(
        wanted,
        (width - 8) / layout.panelWidth,
        (height - Math.trunc(height / 32) - 8) / layout.panelHeight
      )
    )
  return {
    ...layout,
    // Native wrapping may consume one overflowing glyph (including punctuation).
    // Describe its existing DOM extent without changing the wrap budget, glyph
    // coordinates, panel quantization or button positions.
    textWidth: layout.lines.reduce(
      (extent, line) => Math.max(extent, popupTextWidth(line, layout.font)),
      layout.wrapWidth
    ),
    scale,
    x: Math.trunc((width - layout.panelWidth * scale) / 2),
    y: Math.trunc(height / 32),
  }
}

// Native 8px corners overlap on 13px small-font buttons; do not compress them.
export function popupButtonTiles(width: number, height: number) {
  const tiles: { x: number; y: number; w: number; h: number; sx: number; sy: number }[] = []
  const fill = (x: number, y: number, w: number, h: number, sx: number, sy: number) => {
    for (let top = 0; top < h; top += 8)
      for (let left = 0; left < w; left += 8)
        tiles.push({
          x: x + left,
          y: y + top,
          w: Math.min(8, w - left),
          h: Math.min(8, h - top),
          sx,
          sy,
        })
  }
  fill(8, 8, width - 16, height - 16, 8, 8)
  fill(8, 0, width - 16, 8, 8, 0)
  fill(8, height - 8, width - 16, 8, 8, 16)
  fill(0, 8, 8, height - 16, 0, 8)
  fill(width - 8, 8, 8, height - 16, 16, 8)
  fill(0, 0, 8, 8, 0, 0)
  fill(width - 8, 0, 8, 8, 16, 0)
  fill(0, height - 8, 8, 8, 0, 16)
  fill(width - 8, height - 8, 8, 8, 16, 16)
  return tiles
}
