/** Loading and its body-owned fullscreen portal share one keyboard boundary.
 * Query on each press so retry, scrollbar and portal changes cannot retain a
 * stale control. Real modal dialogs and browser tab shortcuts keep precedence. */
export function captureLoadingFocus(doc: Document, root: HTMLElement) {
  const keydown = (event: KeyboardEvent) => {
    if (
      event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey ||
      !root.isConnected || doc.querySelector('dialog[open]')
    ) return
    const host = doc.querySelector<HTMLElement>('[data-fullscreen-control]')
    const fullscreen = host && host.parentElement === doc.body
      ? host.querySelector<HTMLButtonElement>('button')
      : null
    const controls = [
      ...root.querySelectorAll<HTMLElement>(
        'summary,button,[data-loading-recovery-scroll][tabindex="0"]'
      ),
      ...(fullscreen ? [fullscreen] : []),
    ].filter(node =>
      !node.matches(':disabled') && node.getClientRects().length > 0 &&
      doc.defaultView?.getComputedStyle(node).visibility === 'visible'
    )
    event.preventDefault()
    event.stopPropagation()
    const current = controls.indexOf(doc.activeElement as HTMLElement)
    const next = current < 0
      ? event.shiftKey ? controls.length - 1 : 0
      : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
    if (controls.length) controls[next].focus()
    else root.focus({ preventScroll: true })
  }
  // Capture both React siblings, including a Tab originating in the body portal.
  doc.addEventListener('keydown', keydown, true)
  return () => doc.removeEventListener('keydown', keydown, true)
}
