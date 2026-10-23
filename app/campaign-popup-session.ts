// Native 004314c0 binds one popup controller. Replacing its visible body does
// not acknowledge/delete either notification or mutate pause/queue ownership.
export function showCampaignPopup(
  selected: HTMLDetailsElement,
  messages: Iterable<HTMLDetailsElement>
) {
  for (const details of messages) if (details !== selected) details.open = false
  selected.open = true
}

/** 004a9d90 gives the visible body priority over gameplay, independent of focus.
 * Browser adaptations: Tab, F8/F9, necessary browser controls and focused HTML action
 * activation remain usable. Fullscreen's window-capture Escape owner runs first.
 */
export function captureCampaignPopupKeys(
  doc: Document,
  current: () => HTMLDetailsElement | undefined
) {
  const held = new Set<string>()
  const blur = () => held.clear()
  const key = (event: KeyboardEvent) => {
    const popup = current(),
      token = event.code || event.key
    const releasing = event.type === 'keyup',
      wasHeld = held.has(token)
    if (releasing) held.delete(token)
    if (!popup && !wasHeld) return
    if (event.key === 'F8' || event.key === 'F9' || event.key === 'Tab') {
      // Their keydown owners/defaults remain available. Scene keyup also
      // samples modifiers, so forwarding releases would reintroduce held
      // camera modifiers whose later release is owned by this popup.
      if (releasing) event.stopImmediatePropagation()
      return
    }
    const target = event.target instanceof Element ? event.target : null
    const activation = event.key === 'Enter' || event.key === ' '
    const browserAction =
      activation &&
      target?.closest(
        '.campaign-messages button,.campaign-messages summary,[data-fullscreen-control],.fps-graph button'
      )
    if (!releasing) held.add(token)
    // Let the browser activate focused buttons/summary; their owners isolate
    // bubbling. A held key after the popup closes must not reach the world.
    if (popup && browserAction && !event.repeat) return
    event.stopImmediatePropagation()
    const graph = target?.closest<HTMLElement>('.fps-graph')
    if (
      popup &&
      graph &&
      graph.scrollHeight > graph.clientHeight &&
      doc.defaultView?.getComputedStyle(graph).overflowY === 'auto' &&
      ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)
    )
      return // Native browser scrolling, isolated from gameplay camera keys.
    // Keep browser shortcuts (copy, zoom, etc.) but never route them to gameplay.
    if (event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    if (popup && !releasing && !event.repeat && event.key === 'Enter')
      popup.querySelector<HTMLButtonElement>('[data-popup-acknowledge]')?.click()
  }
  doc.addEventListener('keydown', key, true)
  doc.addEventListener('keyup', key, true)
  doc.defaultView?.addEventListener('blur', blur)
  return () => {
    doc.removeEventListener('keydown', key, true)
    doc.removeEventListener('keyup', key, true)
    doc.defaultView?.removeEventListener('blur', blur)
  }
}
