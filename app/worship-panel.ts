import hud from './original-hud.json' with { type: 'json' }
import { panelFrame, type PanelDraw } from './training-panel.ts'
import type { WorshipState } from './worship.ts'

export type WorshipPanelState = Pick<
  WorshipState,
  'required' | 'enabled' | 'work' | 'target' | 'growth' | 'cooldown'
> & {
  shamanOnly: boolean
  // A counted worshipper whose native lookup fails still occupies a visible slot.
  people: ({ model: number; selected: boolean } | null)[]
}

// 0x504bc0, kinds 3/13: stone heads and vaults share worship/recharge artwork.
export function worshipPanel(s: WorshipPanelState) {
  const rects = hud.rects as Record<number, { w: number; h: number }>
  const { 75: icon, 52: tail } = rects
  const rows = s.required >= 8 ? 2 : Number(s.required > 0)
  const columns = rows === 2 ? (s.required + 1) >> 1 : s.required
  const rowHeight = icon.h + 5,
    rowWidth = columns ? columns * (icon.w + 1) + 4 : 0
  const maximum = s.enabled ? Math.imul(s.target, Math.imul(s.required, s.required)) : s.growth
  let value = s.cooldown ? maximum - s.cooldown : 0
  if (s.enabled) value = s.work
  const contentWidth = rowWidth + (maximum ? 6 : 0),
    width = (contentWidth + 7) & ~7
  const left = Math.trunc((width - contentWidth) / 2),
    events: PanelDraw[] = []
  const bodyHeight = columns ? rowHeight : 0
  if (maximum) {
    panelFrame(events, left, 0, 6, bodyHeight)
    const bottom = bodyHeight - 1
    const top = bottom - Math.trunc(Math.imul(Math.max(0, value), bodyHeight - 2) / maximum)
    events.push(['fill', 139, [left + 1, top, left + 5, bottom], 255])
  }
  const x = left + (maximum ? 6 : 0)
  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight
    panelFrame(events, x, y, rowWidth, rowHeight)
    for (let column = 0; column < columns; column++) {
      const person = s.people[row * columns + column],
        px = x + 1 + column * (icon.w + 1)
      if (person) {
        const sprite = 73 + person.model
        events.push(
          ['sprite', sprite, px + 1, y + 2, 172, false],
          ['sprite', sprite, px, y + 1, -1, false]
        )
        if (person.selected)
          events.push(['sprite', 53, px + Math.trunc((icon.w - rects[53].w) / 2), y, -1, false])
      } else if (person === null) {
        events.push(['sprite', 75, px, y + 1, 172, true])
      } else if (s.enabled) {
        events.push(['sprite', s.shamanOnly && row === 0 ? 80 : 75, px, y + 1, 172, true])
      } else {
        events.push(
          ['sprite', 75, px + 1, y + 2, 172, false],
          ['sprite', 75, px, y + 1, 172, false]
        )
      }
    }
  }
  const tailY = rows * bodyHeight
  events.push(['sprite', 52, left + Math.trunc((contentWidth - tail.w) / 2), tailY, -1, false])
  // Native reports one row even when it draws two. Allocate the actual extent.
  return { width, height: tailY + tail.h, events }
}
