type Input = Pick<PointerEvent,
  'pointerId' | 'pointerType' | 'isPrimary' | 'isTrusted' | 'button' | 'buttons' |
  'clientX' | 'clientY' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey' | 'currentTarget'
>

type Context = {
  scene: object
  world: object
  canvas: EventTarget
  readCanvasBounds?: () => Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>
  selected: readonly number[]
  ordinary: boolean
}

export type OrdinaryMoveOwner = {
  readonly press: Pick<Input, 'pointerId' | 'clientX' | 'clientY'>
  readonly context: Context
  readonly ids: readonly number[]
  moved: boolean
  spent: boolean
}

function plain(e: Input, canvas: EventTarget, buttons: number) {
  return e.isTrusted && e.isPrimary && e.pointerType === 'mouse' &&
    e.currentTarget === canvas && e.button === 0 && e.buttons === buttons &&
    Number.isFinite(e.clientX) && Number.isFinite(e.clientY) &&
    !(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)
}

function withinCanvas(c: Context, e: Pick<Input, 'clientX' | 'clientY'>) {
  const bounds = c.readCanvasBounds?.()
  return bounds === undefined ||
    (Number.isFinite(bounds.left) && Number.isFinite(bounds.top) &&
      Number.isFinite(bounds.right) && Number.isFinite(bounds.bottom) &&
      e.clientX >= bounds.left && e.clientX < bounds.right &&
      e.clientY >= bounds.top && e.clientY < bounds.bottom)
}

export function startOrdinaryMoveOwner(c: Context, e: Input): OrdinaryMoveOwner | undefined {
  if (!c.ordinary || !c.selected.length || !plain(e, c.canvas, 1) || !withinCanvas(c, e)) return
  // Snapshot the only press fields used later; Event.currentTarget becomes null.
  return { press: { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY },
    context: c, ids: c.selected.slice(), moved: false, spent: false }
}

export function observeOrdinaryMoveOwner(o: OrdinaryMoveOwner | undefined, e: Input) {
  if (o && o.press.pointerId === e.pointerId) {
    o.moved ||= !e.isTrusted || e.buttons !== 1 ||
      !Number.isFinite(e.clientX) || !Number.isFinite(e.clientY) ||
      Math.hypot(e.clientX - o.press.clientX, e.clientY - o.press.clientY) > 7 ||
      e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || !withinCanvas(o.context, e)
  }
}

export function leaveOrdinaryMoveOwner(
  o: OrdinaryMoveOwner | undefined,
  e: Pick<PointerEvent, 'pointerId' | 'isTrusted' | 'currentTarget'>
) {
  if (o && e.isTrusted && e.currentTarget === o.context.canvas && e.pointerId === o.press.pointerId)
    o.moved = true
}

export function consumeOrdinaryMoveOwner(
  o: OrdinaryMoveOwner | undefined, c: Context, e: Input, cleanGround: boolean
) {
  if (!o || o.spent) return false
  o.spent = true
  const held = o.context
  return !o.moved && c.ordinary && cleanGround && plain(e, c.canvas, 0) &&
    o.press.pointerId === e.pointerId &&
    Math.hypot(e.clientX - o.press.clientX, e.clientY - o.press.clientY) <= 7 &&
    c.scene === held.scene && c.world === held.world && c.canvas === held.canvas &&
    c.selected === held.selected && c.selected.length === o.ids.length &&
    c.selected.every((id, i) => id === o.ids[i]) && withinCanvas(c, e)
}
