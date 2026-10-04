import rules from './original-rules.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import { panelFrame, type PanelDraw } from './training-panel.ts'
import { markPersonSelected } from './person-selection.ts'

type Passenger = {
  id: number
  model: number
  flags3: number
  flags4: number
  selectionFlags: number
}
export function vehiclePanelGeometry(model: number) {
  const capacity = rules.vehicleCapacity[model],
    icon = hud.rects[75],
    rowWidth = capacity * (icon.w + 1) + 4,
    contentWidth = rowWidth + hud.rects[60].w + 4,
    width = (contentWidth + 7) & ~7,
    left = Math.trunc((width - contentWidth) / 2)
  return {
    width,
    height: icon.h + 5 + hud.rects[52].h,
    capacity,
    left,
    rowWidth,
    rowHeight: icon.h + 5,
    unload: { x: left + rowWidth, y: 0, w: hud.rects[60].w + 4, h: icon.h + 5 },
  }
}

// Native kind9: physical passenger slots have distinct click identity even when
// the renderer compacts missing IDs. The caller supplies that slot with each icon.
export function vehiclePanel(
  model: number,
  people: { model: number; selected: boolean; own: boolean }[],
  canUnload: boolean,
  hover = -1
) {
  const g = vehiclePanelGeometry(model),
    events: PanelDraw[] = []
  panelFrame(events, g.left, 0, g.rowWidth, g.rowHeight)
  for (let i = 0; i < g.capacity; i++) {
    const p = people[i],
      x = g.left + 1 + i * (hud.rects[75].w + 1)
    if (!p) events.push(['sprite', 75, x, 1, 172, true])
    else {
      const sprite = 73 + p.model
      events.push(['sprite', sprite, x + 1, 2, 172, false], ['sprite', sprite, x, 1, -1, false])
      if (p.selected || (p.own && hover === i))
        events.push([
          'sprite',
          53,
          x + Math.trunc((hud.rects[75].w - hud.rects[53].w) / 2),
          0,
          -1,
          false,
        ])
    }
  }
  panelFrame(events, g.unload.x, 0, g.unload.w, g.rowHeight)
  events.push(['sprite', canUnload && hover === -2 ? 61 : 60, g.unload.x + 3, 3, -1, !canUnload])
  events.push([
    'sprite',
    52,
    g.left + Math.trunc((g.rowWidth + g.unload.w - hud.rects[52].w) / 2),
    g.rowHeight,
    -1,
    false,
  ])
  return { width: g.width, height: g.height, events }
}

// Vehicle command0x2a(arg1=6) differs from building selection: deselect expands.
// Group command0x61 expands from an eligible occupant to all fellow passengers.
export function selectVehicleOccupants(people: Passenger[], id: number, all: boolean) {
  const clicked = people.find(p => p.id === id)
  if (!clicked) return
  const selected = !(clicked.selectionFlags & 128)
  if (all || !selected) {
    if (selected && people.every(p => p.flags4 & 128)) return
    for (const p of people) markPersonSelected(p, selected)
  } else if (!(clicked.flags4 & 128)) markPersonSelected(clicked, true, true)
}

export function vehiclePanelInput(
  person: { id: number } | undefined,
  unload: boolean,
  right: boolean,
  canUnload: boolean
) {
  if (unload) return !right && canUnload ? 'unload' : undefined
  if (person) return right ? 'focus' : 'select'
}
