import rules from './original-rules.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import type { OrderedPerson, OrderPool, PersonOrder } from './person-orders.ts'
import { panelFrame, type PanelDraw } from './training-panel.ts'

// 0x4369f0: the immediate order consumes one of the eight visible slots.
export function personOrderIcons(
  pool: OrderPool,
  person: Pick<OrderedPerson, 'immediateCommand' | 'commands' | 'commandCursor'>,
  objects: ReadonlyMap<number, { class?: number; model?: number; flags2: number }>
) {
  const icons: { id: number; model: number; sprite: number }[] = []
  const add = (id: number) => {
    const order = id ? pool.records[id] : undefined
    if (!order || order.flags & 1) return
    let sprite = rules.personCommands[order.model].icon
    if (order.model === 7 && order.flags & 8) sprite = 37
    if (order.model === 22) {
      const target = objects.get(order.a)
      if (target?.class === 4 && !(target.flags2 & 1) && (target.model === 1 || target.model === 2))
        sprite = 32
    }
    icons.push({ id, model: order.model, sprite })
  }
  add(person.immediateCommand)
  const count = 8 - icons.length
  let cursor = person.commandCursor & 255
  for (let i = 0; i < count; i++) {
    if (cursor > 7) cursor = 0
    add(person.commands[cursor++])
  }
  return icons
}

// Kind 2 of 0x504bc0. Reserve eight command widths; visible content is centered.
export function personPanel(health: number, maximum: number, icons: number[]) {
  const rects = hud.rects as Record<number, { w: number; h: number }>
  const commands = icons.length ? icons : [39]
  const rowWidth = 4 + commands.reduce((sum, id) => sum + rects[id].w + 1, 0)
  const contentWidth = rowWidth + (maximum ? 6 : 0)
  const width = ((maximum ? 6 : 0) + rects[32].w * 8 + 12 + 7) & ~7
  const rowHeight = rects[32].h + 5
  const left = Math.trunc((width - contentWidth) / 2)
  const events: PanelDraw[] = []
  let x = left
  if (maximum) {
    panelFrame(events, x, 0, 6, rowHeight)
    const bottom = rowHeight - 1
    const top = bottom - Math.trunc((Math.max(0, health) * (rowHeight - 2)) / maximum)
    events.push(['fill', 130, [x + 1, top, x + 5, bottom], 255])
    x += 6
  }
  panelFrame(events, x, 0, rowWidth, rowHeight)
  x += 2
  for (const id of commands) {
    events.push(['sprite', id, x + 1, 3, 150, false], ['sprite', id, x, 2, -1, false])
    x += rects[id].w + 1
  }
  events.push([
    'sprite',
    52,
    left + Math.trunc((contentWidth - rects[52].w) / 2),
    rowHeight,
    -1,
    false,
  ])
  return { width, height: rowHeight + rects[52].h, events }
}

export interface PersonPanelTime {
  phase: number
  remaining: number
  hold: number
}
// 0x504920's three stages; caller uses the elapsed presentation clock.
export function stepPersonPanel(panel: PersonPanelTime, held: boolean) {
  if (held && panel.phase === 1) panel.remaining = panel.hold
  if (!panel.remaining) {
    if (++panel.phase === 3) return false
    panel.remaining = panel.phase === 1 ? panel.hold : 3
  }
  if (panel.remaining) panel.remaining--
  return true
}

export interface OrderFocusObject {
  id: number
  class: number
  flags2: number
  x: number
  y: number
}
// 0x438950 / 0x4389c0, consumed by 0x47b460. A live object takes precedence
// over a packed cell. The caller supplies existing world objects only.
export function personOrderFocus(order: PersonOrder, object?: OrderFocusObject) {
  const { flags } = rules.personCommands[order.model]
  if (flags & 0x246 && order.a && object?.class && !(object.flags2 & 1))
    return { x: object.x & 65535, y: object.y & 65535, target: object.id }
  let { a: x, b: y } = order
  if (flags & 0x804) {
    const cell = flags & 4 ? order.b : order.a
    x = ((cell & 254) + 1) * 256
    y = (((cell >> 8) & 254) + 1) * 256
  } else if (flags & 0x242) {
    // A removed browser object has no readable native pool slot to fall back to.
    if (!object) return null
    ;({ x, y } = object)
  }
  return { x: x & 65535, y: y & 65535, target: 0 }
}
