// Campaign message box ownership (#1046). See
// decomp/research/campaign-message-keyboard.md for the native evidence.
//
// Native 004af440 drives one box (0089bb81 state 2/3); a new request replaces
// it. The browser strip keeps one <details> per message, so at most one of
// them may be open, and that open element is the modal box.

export interface MessageBox {
  open: boolean
  contains(node: unknown): boolean
}

export interface MessageBoxKeyEvent {
  key: string
  repeat: boolean
  metaKey: boolean
  target: unknown
}

export const openMessageBox = <T extends MessageBox>(boxes: Iterable<T>) => {
  for (const box of boxes) if (box.open) return box
  return null
}

// Open one box and close every other one, like a new 004af440 call.
export function showMessageBox<T extends MessageBox>(boxes: Iterable<T>, shown: T) {
  for (const box of boxes) if (box !== shown && box.open) box.open = false
  shown.open = true
}

// While the box is open, 004a9d90 drops every key except a fresh Enter or
// keypad Enter press (any modifiers), which closes it through process_cmd 0xb0.
// The browser keeps native activation only for a control inside the open box
// (its summary and dismiss button). A focused control of another message, for
// example a summary that kept focus after a click collapse, must not take the
// key and reopen an old message. Meta+Enter does not close the box.
export function messageBoxKey(event: MessageBoxKeyEvent, box: MessageBox) {
  const control =
    (event.target as { closest?: (selector: string) => unknown } | null)?.closest?.(
      'button,summary'
    ) ?? null
  if (control && box.contains(control)) return 'native'
  if (event.key === 'Enter' && !event.repeat && !event.metaKey) return 'close'
  // Activation keys must not reach a control outside the box either.
  if (control && (event.key === 'Enter' || event.key === ' ')) return 'block'
  return 'drop'
}

// 004314c0 has asked for the box (transient message bit 2) but the page has not
// opened it yet. 004a5590 already replaces simulation turns at this point.
export const messageBoxRequested = (messages: { slots: readonly ({ flags: number } | null)[] }) =>
  messages.slots.some(message => message !== null && (message.flags & 2) !== 0)
