// Native 005d63b8 is a Shift+L press; 005d63ac leaves plain L owned
// by the Followers panel. World/live-scene/focus admission belongs upstream.
export function isStaySelectedShortcut(
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey' | 'repeat'>
): boolean {
  return (
    !event.repeat &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    event.shiftKey &&
    event.key.toLowerCase() === 'l'
  )
}
