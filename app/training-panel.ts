import hud from './original-hud.json' with { type: 'json' }
import { chargeFills } from './hud-charge.ts'

export interface TrainingPanelState {
  occupants: { model: number; selected: boolean }[]
  active: boolean
  cost: number
  progress: number
  dismantling: boolean
  warning: boolean
  turn: number
}
type Draw =
  | ['fill', number, number[], number]
  | ['line', number, number[]]
  | ['sprite', number, number, number, number, boolean]
const rects = hud.rects as Record<string, { x: number; y: number; w: number; h: number }>

// 0x504bc0, kind 5: one row of five physical occupants, a charge bar and tail.
// Panel allocation, input commands and lifetime are separate from its artwork.
export function trainingPanel(s: TrainingPanelState) {
  const icon = rects[75],
    button = rects[46],
    tail = rects[52],
    rowWidth = (icon.w + 1) * 5 + 4,
    contentWidth = rowWidth + button.w + 4,
    width = (contentWidth + 7) & ~7,
    x = Math.trunc((width - contentWidth) / 2),
    y = s.active && s.cost ? 6 : 0,
    rowHeight = icon.h + 5,
    events: Draw[] = []
  function frame(left: number, top: number, w: number, h: number) {
    events.push(
      ['fill', 154, [left + 1, top + 1, left + w - 1, top + h - 1], 171],
      ['line', 157, [left, top, left, top + h]],
      ['line', 157, [left, top, left + w, top]],
      ['line', 150, [left + w - 1, top, left + w - 1, top + h - 1]],
      ['line', 150, [left, top + h - 1, left + w, top + h - 1]]
    )
  }
  if (y) {
    frame(x, 0, contentWidth, 6)
    if (!s.warning || s.turn & 4)
      for (const fill of chargeFills(s.progress * 4096, s.cost * 4096, contentWidth - 2))
        events.push(['fill', fill.palette, [x + 1, 1, x + 1 + fill.width, 4], 255])
  }
  frame(x, y, rowWidth, rowHeight)
  for (let i = 0; i < 5; i++) {
    const person = s.occupants[i],
      left = x + 1 + i * (icon.w + 1)
    if (!person) events.push(['sprite', 75, left, y + 1, 172, true])
    else {
      const sprite = 73 + person.model
      events.push(
        ['sprite', sprite, left + 1, y + 2, 172, false],
        ['sprite', sprite, left, y + 1, -1, false]
      )
      if (person.selected)
        events.push(['sprite', 53, left + Math.trunc((icon.w - rects[53].w) / 2), y, -1, false])
    }
  }
  frame(x + rowWidth, y, button.w + 4, rowHeight)
  events.push(
    ['sprite', s.dismantling ? (s.turn & 2 ? 47 : 46) : 49, x + rowWidth + 3, y + 3, -1, false],
    ['sprite', 52, x + Math.trunc((contentWidth - tail.w) / 2), y + rowHeight, -1, false]
  )
  return { width, height: y + rowHeight + tail.h, events }
}

export function drawTrainingPanel(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  state: TrainingPanelState
) {
  if (!atlas?.complete || !atlas.naturalWidth) return
  const key = JSON.stringify({
    ...state,
    turn: (state.warning ? state.turn & 4 : 0) | (state.dismantling ? state.turn & 2 : 0),
  })
  if (canvas.dataset.layout === key) return
  const layout = trainingPanel(state)
  canvas.width = layout.width
  canvas.height = layout.height
  const context = canvas.getContext('2d')!
  context.imageSmoothingEnabled = false
  for (const draw of layout.events) {
    if (draw[0] === 'sprite') {
      const [, id, x, y, tint, faded] = draw,
        r = rects[tint < 0 ? id : `panel-${id}-${faded ? 'empty' : 'shadow'}`]
      // 0x4f95a0: the tail is submitted with inverse ghost alpha (flag 16).
      context.globalAlpha = id === 52 ? 170 / 255 : 1
      context.drawImage(atlas, r.x, r.y, r.w, r.h, x, y, r.w, r.h)
      context.globalAlpha = 1
    } else {
      const [kind, color, [left, top, right, bottom]] = draw
      context.fillStyle = hud.colors[color]
      if (kind === 'fill') {
        context.globalAlpha = draw[3] / 255
        context.fillRect(left, top, right - left, bottom - top)
        context.globalAlpha = 1
      } else context.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top))
    }
  }
  canvas.dataset.layout = key
}
