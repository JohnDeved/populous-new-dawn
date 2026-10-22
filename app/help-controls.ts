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
  helpRenderCounter(counter)
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
  hovered: 'up' | 'down' | 'drag' | null,
  focused: 'up' | 'down' | null = null
) {
  const scroll = helpScroll(contentHeight, visibleHeight, rect.height, 22, position)
  if (!scroll.thumb) return { ...scroll, up: null, down: null, body: null }
  const cap = (id: number, y: number) => {
    const icon = helpControlIcon(id)
    return { ...icon, x: rect.x, y }
  }
  return {
    ...scroll,
    up: cap(hovered === 'up' || focused === 'up' ? 453 : 451, rect.y + scroll.position),
    down: cap(
      hovered === 'down' || focused === 'down' ? 454 : 452,
      rect.y + scroll.position + scroll.thumb - 12
    ),
    body: {
      ...helpControlIcon(455),
      x: rect.x,
      y: rect.y + scroll.position + 10,
      height: scroll.thumb - 22,
    },
  }
}

/** All three 24×24 atlases were compared against the original nine 8px tiles.
 * Preflight both ordinary/pressed glyphs before any hover or press can use them. */
export function helpNavigationAssets() {
  return [
    ...Object.values(frameUrls).map(url => ({ url, width: 24, height: 24 })),
    ...[439, 440, 442, 441, 447, 448, 450, 449].map(helpControlIcon),
  ]
}

export function helpScrollbarAssets() {
  return [451, 452, 453, 454, 455].map(helpControlIcon)
}

function scrollBounds(position: number, maximum: number) {
  if (
    !Number.isSafeInteger(position) ||
    !Number.isSafeInteger(maximum) ||
    maximum < 0 ||
    maximum > 0x7fffffff ||
    position < 0 ||
    position > maximum
  )
    throw new RangeError('Invalid original Help scrollbar position')
}

/** 0045eb09 / 0045eb22: seven TRACK units, not seven article pixels. */
export function helpScrollStep(position: number, maximum: number, direction: 'up' | 'down') {
  scrollBounds(position, maximum)
  if (direction === 'down' && position > 0x7fffffff - 7)
    throw new RangeError('Original Help cap step overflow is unsupported')
  return Math.max(0, Math.min(maximum, position + (direction === 'up' ? -7 : 7)))
}

export interface HelpScrollSample extends HelpControlDrawState {
  mouseY: number
}

/** Owns only drag state. The Scene owner must sample AFTER its current draw and
 * publish the returned position for its next draw (0045e6e2–0045e71f). This is
 * neither a React render clock nor the separate preview input-cycle counter. */
export function createHelpScrollController() {
  let anchor = 0
  let counter: number | null = null
  const mouse = (y: number) => {
    if (!Number.isInteger(y) || y < -0x80000000 || y > 0x7fffffff)
      throw new RangeError('Actual signed32 native mouse Y is required')
  }
  return {
    begin(mouseY: number) {
      mouse(mouseY)
      anchor = mouseY // 0045eb41: zero remains the native inactive sentinel.
    },
    reset() {
      anchor = 0
    },
    sample(position: number, maximum: number, input: HelpScrollSample) {
      scrollBounds(position, maximum)
      mouse(input.mouseY)
      helpRenderCounter(input.counter)
      if (counter === input.counter) return position
      counter = input.counter
      if (!input.leftDown || input.leftUp) anchor = 0 // 0045e693–0045e6ac.
      if (!anchor) return position
      // Native DWORD subtraction/addition wraps BEFORE the signed clamp.
      const next = Math.max(0, Math.min(maximum, (position + input.mouseY - anchor) | 0))
      anchor = input.mouseY // Update even when clamped: no hidden overshoot debt.
      return next
    },
  }
}

export type HelpScrollController = ReturnType<typeof createHelpScrollController>

function helpRenderCounter(counter: number) {
  if (!Number.isInteger(counter) || counter < 0 || counter > 0xffffffff)
    throw new RangeError('An actual unsigned native UI counter is required')
}

/** 00451390: UI hover point 0087ca9c/9e uses half-open rectangles. It is
 * deliberately not inferred from captured DOM events or drag Y 00984584. */
export function helpScrollbarHover(
  plan: ReturnType<typeof helpScrollbarPlan>,
  point: { x: number; y: number } | null
) {
  if (!point) return null
  if (
    ![point.x, point.y].every(
      value => Number.isInteger(value) && value >= -0x8000 && value <= 0x7fff
    )
  )
    throw new RangeError('Actual signed16 native UI hover coordinates are required')
  for (const [action, rect] of [
    ['up', plan.up],
    ['down', plan.down],
    ['drag', plan.body],
  ] as const)
    if (
      rect &&
      point.x >= rect.x &&
      point.x < rect.x + rect.width &&
      point.y >= rect.y &&
      point.y < rect.y + rect.height
    )
      return action
  return null
}
