/** Keep loading controls and their body-owned fullscreen portal in one Tab order. */
export function bindLoadingFocus(screen: HTMLElement) {
  const doc = screen.ownerDocument
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || event.defaultPrevented || !screen.isConnected) return
    // An actual open dialog owns focus independently of the loading presentation.
    if (doc.querySelector('dialog[open]')) return
    const portal = doc.querySelector<HTMLElement>('[data-fullscreen-control]')
    let fullscreen: HTMLElement | null = null
    if (portal?.parentElement === doc.body) fullscreen = portal
    const focused = doc.activeElement
    if (!screen.contains(focused) && !fullscreen?.contains(focused)) return
    const controls = [
      ...screen.querySelectorAll<HTMLElement>('summary,button:not(:disabled)'),
      ...(fullscreen?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []),
    ]
    event.preventDefault()
    event.stopPropagation()
    if (!controls.length) return
    const current = controls.indexOf(focused as HTMLElement)
    let next = 0
    if (event.shiftKey) next = controls.length - 1
    if (current !== -1) {
      next = current + 1
      if (event.shiftKey) next = current - 1
      next = (next + controls.length) % controls.length
    }
    controls[next].focus({ preventScroll: true })
  }
  doc.addEventListener('keydown', keydown, true)
  return () => doc.removeEventListener('keydown', keydown, true)
}
