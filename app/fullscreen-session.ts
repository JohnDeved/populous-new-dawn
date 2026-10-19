/** Browser-only compatibility control; never enters fullscreen without activation. */
export type FullscreenState = { active: boolean; available: boolean; pending: boolean; error: string }

export function createFullscreenSession(
  doc: Document,
  win: Window,
  update: (state: FullscreenState) => void,
  now: () => number = () => performance.now()
) {
  let alive = true
  let pending = false
  let error = ''
  let wasActive = Boolean(doc.fullscreenElement)
  let exitUntil = -Infinity
  let escapeHeld = false
  const active = () => Boolean(doc.fullscreenElement)
  const available = () => Boolean(doc.fullscreenEnabled && doc.documentElement.requestFullscreen)
  const publish = () => {
    if (alive) update({ active: active(), available: available(), pending, error })
  }
  const changed = () => {
    if (wasActive && !active()) exitUntil = now() + 250
    wasActive = active()
    error = ''
    publish()
  }
  const failed = () => {
    error = 'Fullscreen was blocked by the browser. You can try again or use its View menu.'
    publish()
  }
  const escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    if (active() || now() < exitUntil || escapeHeld) {
      // Do not preventDefault: the browser must still handle its native exit key.
      // Stop only application handlers, including document-capture modal handlers.
      event.stopImmediatePropagation()
      escapeHeld = event.type === 'keydown'
    }
  }
  const cancel = (event: Event) => {
    if (active() || now() < exitUntil || escapeHeld) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }
  const blur = () => { escapeHeld = false }
  doc.addEventListener('fullscreenchange', changed)
  doc.addEventListener('fullscreenerror', failed)
  win.addEventListener('keydown', escape, { capture: true })
  win.addEventListener('keyup', escape, { capture: true })
  win.addEventListener('cancel', cancel, { capture: true })
  win.addEventListener('blur', blur)
  publish()
  return {
    async toggle() {
      if (!alive || pending) return
      error = ''
      if (!active() && !available()) {
        error = 'Fullscreen is unavailable here. Try your browser’s View menu.'
        publish()
        return
      }
      pending = true
      publish()
      try {
        // Invoke synchronously within the button's trusted click, before awaiting.
        if (active()) await doc.exitFullscreen()
        else await doc.documentElement.requestFullscreen()
      } catch {
        failed()
      } finally {
        pending = false
        publish()
      }
    },
    dispose() {
      alive = false
      doc.removeEventListener('fullscreenchange', changed)
      doc.removeEventListener('fullscreenerror', failed)
      win.removeEventListener('keydown', escape, { capture: true })
      win.removeEventListener('keyup', escape, { capture: true })
      win.removeEventListener('cancel', cancel, { capture: true })
      win.removeEventListener('blur', blur)
    },
  }
}

/** Keep one portal node inside the modal top layer, not behind an inert dialog. */
export function placeFullscreenHost(doc: Document, host: HTMLElement) {
  const dialogs = doc.querySelectorAll<HTMLDialogElement>('dialog[open]')
  const target = dialogs[dialogs.length - 1] ?? doc.body
  if (host.parentElement === target) return
  const focused = host.contains(doc.activeElement) ? doc.activeElement as HTMLElement : null
  target.appendChild(host)
  focused?.focus({ preventScroll: true })
}
