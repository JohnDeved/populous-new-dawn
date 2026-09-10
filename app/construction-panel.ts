import hud from './original-hud.json' with { type: 'json' }
import { panelFrame, panelControl, type PanelDraw } from './training-panel.ts'

export interface ConstructionPanelState {
  capacity: number
  occupants: { model: number; selected: boolean }[]
  wood: number
  totalWood: number
  linked: boolean
  dismantling: boolean
  warning: boolean
  turn: number
  controlHover?: boolean
  controlPressed?: boolean
}

// 0x504bc0, kind 1: registered workers, linked-building control and structural timber.
export function constructionPanel(s: ConstructionPanelState) {
  const icon = hud.rects[75],
    log = hud.rects[40],
    button = hud.rects[46],
    tail = hud.rects[52]
  const twoRows = s.capacity > 7
  const columns = twoRows ? s.capacity / 2 + Number(s.linked) : s.capacity
  const workerWidth = columns * (icon.w + 1) + 4
  const woodWidth = s.totalWood * (log.w + 1) + 4
  const rowWidth = Math.max(workerWidth, woodWidth)
  const buttonWidth = s.linked ? button.w + 4 : 0
  const contentWidth = rowWidth + (twoRows ? 0 : buttonWidth)
  const width = (contentWidth + 7) & ~7,
    x = Math.trunc((width - contentWidth) / 2)
  const rowHeight = icon.h + 5,
    events: PanelDraw[] = [],
    people: { x: number; y: number }[] = []
  const firstCount = twoRows ? s.capacity / 2 - Number(s.linked) : s.capacity
  const firstWidth = rowWidth - (twoRows ? buttonWidth : 0)
  function row(start: number, count: number, y: number, w: number) {
    panelFrame(events, x, y, w, rowHeight)
    for (let i = 0; i < count; i++) {
      const person = s.occupants[start + i],
        left = x + Math.trunc((rowWidth - workerWidth) / 2) + 1 + i * (icon.w + 1)
      people.push({ x: left, y: y + 1 })
      if (!person) events.push(['sprite', 75, left, y + 1, 172, true])
      else {
        const id = 73 + person.model
        events.push(
          ['sprite', id, left + 1, y + 2, 172, false],
          ['sprite', id, left, y + 1, -1, false]
        )
        if (person.selected)
          events.push([
            'sprite',
            53,
            left + Math.trunc((icon.w - hud.rects[53].w) / 2),
            y,
            -1,
            false,
          ])
      }
    }
  }
  row(0, firstCount, 0, firstWidth)
  const control = s.linked
    ? { x: x + firstWidth, y: 0, width: buttonWidth, height: rowHeight }
    : null
  if (control) {
    panelFrame(events, control.x, 0, buttonWidth, rowHeight)
    panelControl(events, control.x + 3, 3, s)
  }
  if (twoRows) row(firstCount, s.capacity - firstCount, rowHeight, rowWidth)
  const y = rowHeight * (twoRows ? 2 : 1)
  panelFrame(events, x, y, contentWidth, log.h + 5)
  for (let i = 0; i < s.totalWood; i++) {
    const left = x + Math.trunc((rowWidth - woodWidth) / 2) + 2 + i * (log.w + 1)
    if (i < s.wood)
      events.push(
        ['sprite', 40, left + 1, y + 3, 172, false],
        ['sprite', 40, left, y + 2, -1, false]
      )
    else if (!s.warning || s.turn & 4) events.push(['sprite', 40, left, y + 2, 172, true])
  }
  events.push(['sprite', 52, x + Math.trunc((contentWidth - tail.w) / 2), y + log.h + 5, -1, false])
  return { width, height: y + log.h + 5 + tail.h, events, people, control }
}
