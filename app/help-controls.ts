import art from './original-help.json' with { type: 'json' }
import type { HelpRect } from './help-layout.ts'
import { helpScroll } from './help-layout.ts'

export type HelpNavigationAction = 'back' | 'forward' | 'home' | 'close'
export interface HelpControlDrawState {
  counter: number
  leftDown: boolean
  leftUp: boolean
}
const frameUrls = {
  normal: '/original/hud-button.png',
  hover: '/original/hud-button-selected.png',
  held: '/original/hud-button-hover.png',
} as const

// 004a2560, with original atlases independently compared against all 27 tiles.
// Counter 00897981 is not World.turn or the separate preview counter 0089d184.
export function helpNavigationFrame(hovered: boolean, pressed: boolean, counter: number) {
  if (!Number.isInteger(counter) || counter < 0 || counter > 0xffffffff)
    throw new RangeError('An actual unsigned native UI counter is required')
  return pressed ? 'held' : hovered && (counter & 4) !== 0 ? 'hover' : 'normal'
}

export function helpControlIcon(id: number) {
  const icon = art.icons[String(id) as keyof typeof art.icons]
  if (!icon) throw new RangeError('Unimported original help control')
  return { id, ...icon }
}

export function helpNavigationPlan(
  rect: HelpRect,
  index: number,
  hovered: boolean,
  draw: HelpControlDrawState
) {
  if (!Number.isInteger(index) || index < 0 || index > 3 || rect.width !== 24 || rect.height !== 28)
    throw new RangeError('Invalid original help navigation geometry')
  const pressed = hovered && draw.leftDown && !draw.leftUp
  const family = helpNavigationFrame(hovered, pressed, draw.counter)
  const icon = helpControlIcon([439, 440, 442, 441][index] + (pressed ? 8 : 0))
  return {
    action: (['back', 'forward', 'home', 'close'] as const)[index],
    family,
    frameUrl: frameUrls[family],
    rect,
    icon,
    iconX: Math.trunc((rect.width - icon.width) / 2),
    iconY: Math.trunc((rect.height - icon.height) / 2),
  }
}

// Explicit clipped 8px repeats preserve native UV phase. CSS border-image repeat
// would center partial repeats on the 12px middle edge instead of starting at 0.
export function helpNavigationTiles() {
  const startsX = [0, 8, 16],
    startsY = [0, 8, 20],
    sizesY = [8, 12, 8]
  return startsY.flatMap((top, row) =>
    startsX.flatMap((left, column) =>
      Array.from({ length: Math.ceil(sizesY[row] / 8) }, (_, part) => ({
        x: left,
        y: top + part * 8,
        width: 8,
        height: Math.min(8, sizesY[row] - part * 8),
        sourceX: column * 8,
        sourceY: row * 8,
      }))
    )
  )
}

// 0045e400: the two arrows are the MOVING thumb's caps, not fixed track ends.
export function helpScrollbarPlan(
  rect: HelpRect,
  contentHeight: number,
  visibleHeight: number,
  position: number,
  hovered: 'up' | 'down' | 'drag' | null
) {
  const scroll = helpScroll(contentHeight, visibleHeight, rect.height, 22, position)
  if (!scroll.thumb) return { ...scroll, up: null, down: null, body: null }
  const cap = (id: number, y: number) => {
    const icon = helpControlIcon(id)
    return { ...icon, x: rect.x, y }
  }
  return {
    ...scroll,
    up: cap(hovered === 'up' ? 453 : 451, rect.y + scroll.position),
    down: cap(hovered === 'down' ? 454 : 452, rect.y + scroll.position + scroll.thumb - 12),
    body: {
      ...helpControlIcon(455),
      x: rect.x,
      y: rect.y + scroll.position + 10,
      height: scroll.thumb - 22,
    },
  }
}
